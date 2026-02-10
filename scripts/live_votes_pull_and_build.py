#!/usr/bin/env python3
"""Live Votes: pull open governance actions, process risk tags, and build dashboard.

Design goals:
- Store immutable raw pulls per epoch in data/raw-votes/<epoch>.json
- Store processed/enriched pulls in data/processed/<epoch>.json
- Build an auto-updating HTML dashboard in reports/live-dashboard/index.html

Data sources (default):
- Koios (via BEACN worker) for governance action list + withdrawals recipients

Notes / limitations (explicit by design):
- "Countdown" is approximated using epoch math (5 days/epoch). We also label actions that expire this epoch.
- Linking withdrawals to specific grants is heuristic (title/keyword match) until we have canonical payout mappings.
- Flags/risk are *signals*, not accusations.
"""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import re
import sys
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

KOIOS_BASE = os.environ.get("KOIOS_BASE", "https://koios.beacn.workers.dev").rstrip("/")
KOIOS_API = KOIOS_BASE + "/api/v1"

EPOCH_DAYS = 5.0


def http_post_json(url: str, payload: Any, timeout: int = 45) -> Any:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "BEACN-Governance-DOGE/1.0 (+https://github.com/BEACNpool/Governance)",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def http_get_json(url: str, timeout: int = 45) -> Any:
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "BEACN-Governance-DOGE/1.0 (+https://github.com/BEACNpool/Governance)",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def utc_now_z() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def get_current_epoch() -> int:
    # Koios tip endpoint
    tip = http_get_json(KOIOS_API + "/tip")
    # tip is list with one row
    if isinstance(tip, list) and tip:
        e = tip[0].get("epoch_no")
        if e is not None:
            return int(e)
    raise RuntimeError("Unable to determine current epoch from Koios tip")


def pull_open_actions() -> List[Dict[str, Any]]:
    """Pull governance actions from Koios. We fetch 'proposal_list' and filter to open/unexpired."""
    # Koios proposal_list returns many; filter locally
    rows = http_post_json(KOIOS_API + "/proposal_list", {})
    if not isinstance(rows, list):
        raise RuntimeError("Unexpected proposal_list response")

    # Heuristic for open: status == 'active' or 'ratified' etc varies; we'll keep those with expiry > current epoch
    cur_epoch = get_current_epoch()

    out = []
    for r in rows:
        expires = r.get("expires_after")
        try:
            exp_epoch = int(expires) if expires is not None else None
        except Exception:
            exp_epoch = None

        status = (r.get("proposal_status") or r.get("status") or "").lower()

        # Keep if expiry known and not passed; else keep if status suggests active
        if exp_epoch is not None:
            if exp_epoch < cur_epoch:
                continue
        else:
            if status and status not in {"active", "submitted", "ratified"}:
                continue

        out.append(r)

    return out


def normalize_action(r: Dict[str, Any]) -> Dict[str, Any]:
    gaid = r.get("proposal_id") or r.get("proposal_id")
    title = r.get("proposal_title") or r.get("title") or ""
    kind = r.get("proposal_type") or r.get("type") or ""
    expires_after = r.get("expires_after")
    try:
        expires_after = int(expires_after) if expires_after is not None else None
    except Exception:
        expires_after = None

    # withdrawals (list of {stake_address, amount})
    withdrawals = r.get("withdrawal") or []

    return {
        "proposal_id": gaid,
        "title": title,
        "type": kind,
        "expires_after": expires_after,
        "status": r.get("proposal_status") or r.get("status"),
        "url_govtool": f"https://gov.tools/governance_actions/{gaid}#0" if gaid else None,
        "withdrawals": withdrawals,
        "raw": r,
    }


def load_intersect_waste_radar_latest(repo_root: Path) -> Dict[str, Any]:
    """Load Intersect waste radar JSON from the repo's data/ folder.

    Prefer the newest intersect-grants-waste-radar-*.json in data/.
    """
    data_dir = repo_root / "data"
    candidates = sorted(data_dir.glob("intersect-grants-waste-radar-*.json"))
    if not candidates:
        return {"items": []}
    # pick last lexicographically; date in filename
    p = candidates[-1]
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {"items": []}


def compute_risk(action: Dict[str, Any], intersect: Dict[str, Any]) -> Tuple[int, Optional[Dict[str, Any]], str, List[str]]:
    """Return (risk_score 0-100, linked_grant, receipt_status, flags)."""
    flags: List[str] = []
    linked = None
    receipt_status = "unknown"
    risk = 0

    kind = (action.get("type") or "").lower()

    # Skip pure info actions (still shown, but low/no risk scoring)
    if "info" in kind:
        return 0, None, "n/a", []

    # Treasury withdrawal exposure
    withdrawals = action.get("withdrawals") or []
    if withdrawals:
        risk += 35
        flags.append("TREASURY_WITHDRAWAL")

        # Add magnitude-based bump
        total = 0
        for w in withdrawals:
            try:
                total += int(w.get("amount") or 0)
            except Exception:
                pass
        if total >= 10_000_000:
            risk += 35
            flags.append("MEGA_WITHDRAWAL")
        elif total >= 1_000_000:
            risk += 20
            flags.append("LARGE_WITHDRAWAL")
        elif total >= 100_000:
            risk += 10
            flags.append("MID_WITHDRAWAL")

    # Heuristic link to an Intersect grant by keyword/title similarity
    title = (action.get("title") or "").strip().lower()
    if title and intersect.get("items"):
        best = None
        best_score = 0
        for it in intersect.get("items", []):
            t = (it.get("title") or "").strip().lower()
            if not t:
                continue
            # simple token overlap score
            toks_a = set(re.findall(r"[a-z0-9]{4,}", title))
            toks_b = set(re.findall(r"[a-z0-9]{4,}", t))
            if not toks_a or not toks_b:
                continue
            overlap = len(toks_a & toks_b)
            score = overlap
            if score > best_score:
                best_score = score
                best = it
        if best and best_score >= 3:
            linked = {
                "title": best.get("title"),
                "url": best.get("url"),
                "grant_value_ada": best.get("grant_value_ada"),
                "flags": best.get("flags", []),
            }
            flags.append("LINKED_INTERSECT_GRANT_HEURISTIC")
            risk += 25

            # If the linked grant is already flagged, bump risk and set receipt status
            gflags = best.get("flags") or []
            if gflags:
                flags.append("PRIOR_FLAGS")
                risk += 20
                receipt_status = "needs-receipts"
            else:
                receipt_status = "ok-ish"

    risk = max(0, min(100, risk))
    if risk >= 70:
        flags.append("RISK_HIGH")
    elif risk >= 40:
        flags.append("RISK_MED")
    elif risk > 0:
        flags.append("RISK_LOW")

    return risk, linked, receipt_status, flags


def process_epoch(raw_path: Path, processed_path: Path, repo_root: Path) -> Dict[str, Any]:
    raw = json.loads(raw_path.read_text(encoding="utf-8"))
    intersect = load_intersect_waste_radar_latest(repo_root)

    cur_epoch = get_current_epoch()
    actions = [normalize_action(r) for r in raw.get("actions", [])]

    processed_actions = []
    for a in actions:
        risk, linked, receipt_status, flags = compute_risk(a, intersect)
        exp = a.get("expires_after")
        epochs_left = exp - cur_epoch if isinstance(exp, int) else None

        processed_actions.append(
            {
                **{k: a[k] for k in ("proposal_id", "title", "type", "expires_after", "status", "url_govtool", "withdrawals")},
                "epochs_left": epochs_left,
                "approx_days_left": (epochs_left * EPOCH_DAYS) if isinstance(epochs_left, int) else None,
                "risk_score": risk,
                "linked_grant": linked,
                "receipt_status": receipt_status,
                "flags": flags,
                "raw_ref": str(raw_path.relative_to(repo_root)).replace('\\', '/'),
            }
        )

    # sort by deadline then risk
    def sort_key(x: Dict[str, Any]):
        exp = x.get("expires_after")
        expv = exp if isinstance(exp, int) else 10**9
        return (expv, -int(x.get("risk_score") or 0))

    processed_actions.sort(key=sort_key)

    out = {
        "generated_at": utc_now_z(),
        "epoch": raw.get("epoch"),
        "current_epoch": cur_epoch,
        "source": raw.get("source"),
        "actions": processed_actions,
    }

    processed_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    return out


def build_dashboard(repo_root: Path, processed_files: List[Path], out_html: Path):
    # Load all processed actions from all files (latest wins)
    all_actions: List[Dict[str, Any]] = []
    latest_epoch = None
    latest_generated = None

    for p in sorted(processed_files):
        data = json.loads(p.read_text(encoding="utf-8"))
        latest_epoch = data.get("epoch")
        latest_generated = data.get("generated_at")
        all_actions = data.get("actions", [])  # use newest only for now

    # Render minimal dashboard using shared CSS
    css_path = "../../assets/beacn.css"  # from reports/live-dashboard/

    def pill(text: str, cls: str = "pill"):
        return f"<span class='{cls}'>{text}</span>"

    def fmt_ada(n: int) -> str:
        return f"{n:,} ADA"

    rows = []
    for a in all_actions:
        kind = (a.get("type") or "")
        title = (a.get("title") or "").strip() or "(untitled)"
        gov = a.get("url_govtool")
        raw_ref = a.get("raw_ref")
        raw_url = "../../" + raw_ref

        risk = int(a.get("risk_score") or 0)
        flags = a.get("flags") or []

        exp = a.get("expires_after")
        days = a.get("approx_days_left")
        epochs_left = a.get("epochs_left")

        urgency_cls = "flag" if (epochs_left == 0 or (isinstance(days, (int, float)) and days <= 3)) else "pill"
        urgency = "Due this epoch" if epochs_left == 0 else (f"~{int(days)}d" if days is not None else "?")

        amt_total = 0
        for w in a.get("withdrawals") or []:
            try:
                amt_total += int(w.get("amount") or 0)
            except Exception:
                pass

        amt_html = f"<div class='mono ada'>{fmt_ada(amt_total)}</div>" if amt_total else "<div class='muted'>—</div>"

        linked = a.get("linked_grant")
        linked_html = "<span class='muted'>—</span>"
        if linked and linked.get("url"):
            linked_html = f"<a href='{linked['url']}' target='_blank' rel='noopener'>{linked.get('title') or 'linked grant'}</a>"

        flag_pills = " ".join([pill(f, "pill danger" if "RISK_HIGH" in f or f.startswith("PRIOR") else "pill") for f in flags[:4]])

        rows.append(
            f"""
            <tr>
              <td>
                <div class='title'><a href='{gov}' target='_blank' rel='noopener'>{title}</a></div>
                <div class='muted small'>{kind} · <a href='{raw_url}'>raw json</a></div>
                <div class='small'>{flag_pills}</div>
              </td>
              <td class='mono'>{exp if exp is not None else '—'}</td>
              <td>{pill(urgency, urgency_cls)}</td>
              <td class='mono'>{risk}</td>
              <td>{amt_html}</td>
              <td>{linked_html}</td>
            </tr>
            """
        )

    html = f"""<!doctype html>
<html lang='en'>
<head>
  <meta charset='utf-8' />
  <meta name='viewport' content='width=device-width, initial-scale=1' />
  <title>Live Votes Dashboard — BEACN Governance</title>
  <link rel='stylesheet' href='{css_path}' />
</head>
<body class='report-page'>
  <div class='top-bar'>
    <div class='top-bar-inner'>
      <a class='brand' href='../../index.html'>BEACN Governance</a>
      <div class='top-links'>
        <a href='../../reports/waste-deep-dive-latest.html'>Waste Deep Dive</a>
        <a href='../../reports/grants-ledger-latest.html'>Grants Ledger</a>
        <a href='https://github.com/BEACNpool/Governance' target='_blank' rel='noopener'>GitHub</a>
      </div>
    </div>
  </div>

  <main class='container'>
    <header class='report-header'>
      <div>
        <div class='kicker'>AUTO-UPDATED</div>
        <h1>Live Votes Dashboard</h1>
        <p class='muted'>Open governance actions sorted by deadline. Links to raw JSON provided for proof. Flags indicate missing/weak receipts — not proof of fraud.</p>
      </div>
      <div class='report-meta'>
        <div class='meta-row'><span class='muted'>Epoch</span> <span class='mono'>{latest_epoch}</span></div>
        <div class='meta-row'><span class='muted'>Generated</span> <span class='mono'>{latest_generated}</span></div>
      </div>
    </header>

    <section class='card'>
      <h2>Open Actions</h2>
      <div class='table-wrap'>
        <table class='table'>
          <thead>
            <tr>
              <th>Action</th>
              <th class='mono'>Expiry epoch</th>
              <th>Countdown</th>
              <th class='mono'>Risk</th>
              <th class='mono'>ADA ask</th>
              <th>Linked grant (heuristic)</th>
            </tr>
          </thead>
          <tbody>
            {''.join(rows) if rows else '<tr><td colspan="6" class="muted">No open actions found.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>

    <section class='card ok'>
      <h2>How to clear a “risk” tag</h2>
      <ul>
        <li>Link the deliverables + closeout/reporting receipts on the official pages.</li>
        <li>For TreasuryWithdrawals: add a clear anchor with recipients, milestones, and payment proof.</li>
        <li>Open an issue/PR in the repo with receipts; we’ll re-check and update.</li>
      </ul>
    </section>
  </main>
</body>
</html>
"""

    out_html.write_text(html, encoding="utf-8")


def main(argv: List[str]) -> int:
    repo_root = Path(__file__).resolve().parents[1]
    raw_dir = repo_root / "data" / "raw-votes"
    processed_dir = repo_root / "data" / "processed"
    dash_dir = repo_root / "reports" / "live-dashboard"

    raw_dir.mkdir(parents=True, exist_ok=True)
    processed_dir.mkdir(parents=True, exist_ok=True)
    dash_dir.mkdir(parents=True, exist_ok=True)

    epoch = get_current_epoch()

    actions = pull_open_actions()
    raw_obj = {
        "generated_at": utc_now_z(),
        "epoch": epoch,
        "source": {"koios_base": KOIOS_BASE, "endpoint": "proposal_list"},
        "actions": actions,
    }

    raw_bytes = (json.dumps(raw_obj, indent=2) + "\n").encode("utf-8")
    raw_path = raw_dir / f"{epoch}.json"

    # Only write raw if changed (avoid noisy commits)
    if raw_path.exists() and sha256_bytes(raw_path.read_bytes()) == sha256_bytes(raw_bytes):
        pass
    else:
        raw_path.write_bytes(raw_bytes)

    processed_path = processed_dir / f"{epoch}.json"
    processed = process_epoch(raw_path, processed_path, repo_root)

    # Build dashboard from newest processed file
    build_dashboard(repo_root, [processed_path], dash_dir / "index.html")

    print(f"Wrote raw: {raw_path}")
    print(f"Wrote processed: {processed_path}")
    print(f"Wrote dashboard: {dash_dir / 'index.html'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

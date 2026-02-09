#!/usr/bin/env python3
"""Generate a recipient/entity leaderboard across indexed mechanisms.

Current sources:
- CIP-1694 TreasuryWithdrawals: aggregates recipient stake addresses from the local SQLite DB.
- Intersect Grants: aggregates by page title (v1) from intersect-grants-waste-radar CSV.

Outputs:
- reports/recipient-entity-leaderboard-YYYY-MM-DD.(md|csv)
- data/recipient-entity-leaderboard-YYYY-MM-DD.json

Note: This is an *index* for review, not an accusation engine.
"""

import csv
import datetime as dt
import json
import os
import sqlite3
from collections import defaultdict
from pathlib import Path


def load_treasury_recipients(db_path: Path):
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        """
        SELECT id, tx_hash, cert_index, status, metadata_title, anchor_url, treasury_recipients
        FROM proposals
        WHERE type LIKE '%Treasury%'
        """
    ).fetchall()
    conn.close()

    # entity_key -> {amount, count, sources[]}
    agg = defaultdict(lambda: {"amount_ada": 0.0, "count": 0, "sources": []})

    for r in rows:
        rec_json = r["treasury_recipients"]
        if not rec_json:
            continue
        try:
            recs = json.loads(rec_json)
        except Exception:
            continue
        if not isinstance(recs, list):
            continue
        for it in recs:
            stake = it.get("stake_address")
            amt_lv = it.get("amount")
            if not stake or amt_lv is None:
                continue
            try:
                amt_ada = int(amt_lv) / 1_000_000
            except Exception:
                continue
            key = f"stake:{stake}"
            agg[key]["amount_ada"] += amt_ada
            agg[key]["count"] += 1
            agg[key]["sources"].append(
                {
                    "mechanism": "CIP1694_TreasuryWithdrawal",
                    "status": r["status"],
                    "title": r["metadata_title"],
                    "govtool": f"https://gov.tools/governance_actions/{r['tx_hash']}#{r['cert_index']}",
                    "anchor": r["anchor_url"],
                    "amount_ada": amt_ada,
                }
            )

    return agg


def load_intersect_entities(intersect_csv: Path):
    rows = []
    with intersect_csv.open("r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    agg = defaultdict(lambda: {"amount_ada": 0.0, "count": 0, "sources": []})

    for r in rows:
        title = (r.get("title") or "").strip()
        if not title:
            continue
        amt_raw = (r.get("grant_value_ada") or "").strip()
        try:
            amt = float(amt_raw) if amt_raw else 0.0
        except Exception:
            amt = 0.0
        key = f"intersect:{title}"
        agg[key]["amount_ada"] += amt
        agg[key]["count"] += 1
        agg[key]["sources"].append(
            {
                "mechanism": "Intersect_Community_Grants",
                "round": f"Cohort {r.get('cohort','')}",
                "title": title,
                "url": (r.get("url") or "").strip(),
                "flags": (r.get("flags") or "").strip(),
                "amount_ada": amt,
            }
        )

    return agg


def main():
    today = dt.date.today().isoformat()
    root = Path(__file__).resolve().parent

    # Inputs
    db_path = Path.home() / ".openclaw" / "workspace" / "skills" / "cardano-gov" / "data" / "proposals.db"
    intersect_csv = root / "reports" / f"intersect-grants-waste-radar-{today}.csv"

    if not db_path.exists():
        raise SystemExit(f"Missing {db_path}")
    if not intersect_csv.exists():
        raise SystemExit(f"Missing {intersect_csv}")

    treasury = load_treasury_recipients(db_path)
    intersect = load_intersect_entities(intersect_csv)

    combined = defaultdict(lambda: {"amount_ada": 0.0, "count": 0, "sources": []})

    for src in (treasury, intersect):
        for k, v in src.items():
            combined[k]["amount_ada"] += v["amount_ada"]
            combined[k]["count"] += v["count"]
            combined[k]["sources"].extend(v["sources"])

    # Flatten
    rows = []
    for k, v in combined.items():
        rows.append(
            {
                "entity_key": k,
                "entity": k.split(":", 1)[1] if ":" in k else k,
                "amount_ada": round(v["amount_ada"], 6),
                "items": v["count"],
                "mechanism": k.split(":", 1)[0],
            }
        )

    rows.sort(key=lambda r: r["amount_ada"], reverse=True)

    out_base = f"recipient-entity-leaderboard-{today}"
    out_csv = root / "reports" / f"{out_base}.csv"
    out_md = root / "reports" / f"{out_base}.md"
    out_json = root / "data" / f"{out_base}.json"

    # CSV
    fields = ["mechanism", "entity", "amount_ada", "items", "entity_key"]
    with out_csv.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow(r)

    # JSON (includes drill-down sources)
    drill = []
    for k, v in combined.items():
        drill.append(
            {
                "entity_key": k,
                "amount_ada": round(v["amount_ada"], 6),
                "items": v["count"],
                "sources": v["sources"],
            }
        )
    drill.sort(key=lambda r: r["amount_ada"], reverse=True)

    out_json.write_text(
        json.dumps(
            {
                "generated_at": dt.datetime.now(dt.timezone.utc)
                .replace(microsecond=0)
                .isoformat()
                .replace("+00:00", "Z"),
                "rows": drill,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    # Markdown
    lines = []
    lines.append(f"# Recipient/Entity Leaderboard — {today}")
    lines.append("")
    lines.append("Aggregated view of who received (or was authorized to receive) funds across indexed mechanisms.")
    lines.append("")
    lines.append("**Caveats**")
    lines.append("- TreasuryWithdrawals: aggregated by *recipient stake address* from on-chain withdrawal maps (good).")
    lines.append("- Intersect Grants: aggregated by *page title* (v1). Next improvement is parsing grantee legal entity names.")
    lines.append("- This is not an accusation list; it’s a ‘follow the money’ index.")
    lines.append("")

    lines.append("## Top 25")
    lines.append("")
    for r in rows[:25]:
        lines.append(f"- **{r['amount_ada']:,.0f} ADA** — {r['mechanism']} — `{r['entity']}` (items: {r['items']})")

    out_md.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(out_csv)
    print(out_md)
    print(out_json)


if __name__ == "__main__":
    main()

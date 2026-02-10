#!/usr/bin/env python3
"""Generate a community-readable HTML report focused on potential waste signals.

Uses the BEACN v2 design system (assets/beacn.css).

This report is intentionally evidence-first:
- It does NOT claim fraud.
- It flags missing receipts (deliverables/reporting/payment proof) and weak transparency.

Inputs (today):
- reports/intersect-grants-waste-radar-YYYY-MM-DD.csv + data/intersect-grants-waste-radar-YYYY-MM-DD.json
- reports/treasury-withdrawals-YYYY-MM-DD.csv

Output:
- reports/waste-deep-dive-YYYY-MM-DD.html
"""

import csv
import datetime as dt
import html
import json
from collections import Counter
from pathlib import Path

FLAG_EXPLAIN = {
    "NO_DELIVERABLE_LINKS": "No obvious public links to deliverables (repo / site / video / podcast feed). This creates an accountability gap for delegators.",
    "NO_REPORTING_LINKS": "No obvious links to reporting / closeout / final evidence. Without reporting receipts, it's hard to verify work completed.",
    "NO_EXTERNAL_LINKS": "No external links found at all. Even if work exists, the official page isn't linking to it.",
    "MISSING_GRANT_VALUE": "Grant value not clearly stated on the page. This makes totals / ROI harder to audit.",
    "🟡 NO_DISCUSSION": "No obvious public discussion links were detected in proposal references. Not proof of waste, but a governance transparency smell.",
    "🔴 NO_METADATA": "Anchor metadata missing / unresolvable. Without metadata, delegators can't evaluate scope / deliverables.",
    "🔴 HASH_MISMATCH": "Anchor content hash mismatch vs on-chain hash. This is a serious integrity issue.",
}


def esc(s):
    return html.escape(str(s)) if s else ""


def flag_reason(fl):
    return FLAG_EXPLAIN.get(fl, "Unknown flag — manual review required.")


def read_csv(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def fmt_ada(val):
    try:
        return f"{float(val):,.0f}"
    except (TypeError, ValueError):
        return "unknown"


# ══════════════════════════════════════════════════════
# HTML builder using BEACN v2 design system
# ══════════════════════════════════════════════════════

def build_top_bar(today):
    return f"""<nav class="top-bar">
  <a href="../" class="brand">BEACN</a>
  <a href="../">← Dashboard</a>
  <a href="methodology-doge.html">Methodology</a>
  <a href="grants-ledger-{today}.html">Grants Ledger</a>
  <a href="https://github.com/BEACNpool/Governance" target="_blank" rel="noopener">GitHub</a>
</nav>"""


def build_header(today):
    return f"""<header class="report-header">
  <div class="report-badge">🔍 WASTE RADAR · {today}</div>
  <h1>Waste / Weak-Evidence Deep Dive</h1>
  <p class="report-sub">
    Focused report: items that currently show weak public receipts or transparency gaps.
    Every flag links to the source so anyone can verify.
  </p>
</header>"""


def build_disclaimer():
    return """<div class="card warn">
  <h2>⚠️ Before You Scroll</h2>
  <ul>
    <li><strong>Not voting advice.</strong> This report is informational and evidence-first.</li>
    <li><strong>Not proof of fraud.</strong> A flag means missing / weak receipts (deliverables / reporting / payment proof), not wrongdoing.</li>
    <li><strong>DOGE lens:</strong> we aggressively hunt waste signals by demanding receipts and clear outcomes.</li>
    <li><strong>Easy fix:</strong> if deliverables exist but aren't linked publicly, add them to clear the flag.</li>
  </ul>
</div>"""


def build_summary(intersect_flagged, treasury_flagged, intersect_flag_counts, treasury_flag_counts):
    total_int = len(intersect_flagged)
    total_int_with_amt = sum(1 for x in intersect_flagged if x.get("amount") is not None)
    total_int_amt = sum((x.get("amount") or 0) for x in intersect_flagged if x.get("amount") is not None)
    total_trs = len(treasury_flagged)

    out = []
    out.append('<div class="card">')
    out.append("<h2>Executive Summary</h2>")
    out.append(f"<p><strong>Report scope:</strong> only items with evidence flags.</p>")

    # Stat grid
    out.append('<div class="stat-grid">')
    out.append(f'<div class="stat-box"><div class="s-val" style="color:var(--red)">{total_int}</div><div class="s-label">Flagged grants</div></div>')
    out.append(f'<div class="stat-box"><div class="s-val" style="color:var(--ada-gold)">{fmt_ada(total_int_amt)} ₳</div><div class="s-label">ADA at risk (known)</div></div>')
    out.append(f'<div class="stat-box"><div class="s-val" style="color:var(--amber)">{total_trs}</div><div class="s-label">Treasury actions flagged</div></div>')
    out.append(f'<div class="stat-box"><div class="s-val" style="color:var(--text-muted)">{total_int - total_int_with_amt}</div><div class="s-label">Missing grant values</div></div>')
    out.append("</div>")

    # Flag breakdown
    if intersect_flag_counts:
        out.append("<h3 style='margin-top:16px'>Intersect Grants — Flag Breakdown</h3>")
        out.append("<table><thead><tr><th>Flag</th><th class='num'>Count</th></tr></thead><tbody>")
        for fl, cnt in intersect_flag_counts.most_common():
            out.append(f"<tr><td><code style='color:var(--red)'>{esc(fl)}</code></td><td class='num'>{cnt}</td></tr>")
        out.append("</tbody></table>")

    if treasury_flag_counts:
        out.append("<h3 style='margin-top:16px'>Treasury Actions — Flag Breakdown</h3>")
        out.append("<table><thead><tr><th>Flag</th><th class='num'>Count</th></tr></thead><tbody>")
        for fl, cnt in treasury_flag_counts.most_common():
            out.append(f"<tr><td><code style='color:var(--amber)'>{esc(fl)}</code></td><td class='num'>{cnt}</td></tr>")
        out.append("</tbody></table>")

    out.append("</div>")
    return "\n".join(out)


def build_intersect_section(intersect_flagged):
    if not intersect_flagged:
        return ""
    out = []
    out.append('<div class="card"><h2>Intersect Community Grants — Flagged Items</h2>')
    out.append(f'<p class="muted">Sorted by flag severity. {len(intersect_flagged)} items with evidence gaps.</p></div>')

    for i, it in enumerate(intersect_flagged, 1):
        out.append(f'<div class="flag-item" style="animation-delay:{min(i*0.03, 0.5):.2f}s">')
        out.append(f"<h3>{i}. {esc(it.get('title', 'Untitled'))}</h3>")
        meta_parts = []
        if it.get("cohort"):
            meta_parts.append(f"Cohort: {esc(it['cohort'])}")
        if it.get("last_updated"):
            meta_parts.append(f"Last updated: {esc(it['last_updated'])}")
        out.append(f'<div class="flag-meta">{" · ".join(meta_parts)}</div>')

        if it.get("amount") is not None:
            out.append(f'<div class="flag-amount">{fmt_ada(it["amount"])} ADA</div>')
        else:
            out.append('<div class="flag-amount" style="color:var(--amber)">(value missing/unclear)</div>')

        if it.get("url"):
            out.append(f"<p><strong>Source page:</strong> <a href='{esc(it['url'])}' target='_blank' rel='noopener'>{esc(it['url'])}</a></p>")

        out.append('<ul class="flag-reasons">')
        for fl in it.get("flags", []):
            out.append(f"<li><code>{esc(fl)}</code> <span>{esc(flag_reason(fl))}</span></li>")
        out.append("</ul>")

        ext = it.get("external_links") or []
        if ext:
            out.append('<div class="ext-links"><strong>External links found:</strong>')
            for link in ext[:6]:
                out.append(f"<a href='{esc(link)}' target='_blank' rel='noopener'>{esc(link)}</a>")
            out.append("</div>")

        out.append("</div>")
    return "\n".join(out)


def build_treasury_section(treasury_flagged):
    if not treasury_flagged:
        return ""
    out = []
    out.append('<div class="card"><h2>Treasury Actions — Flagged Items</h2>')
    out.append(f'<p class="muted">{len(treasury_flagged)} governance actions with evidence gaps.</p></div>')

    for i, it in enumerate(treasury_flagged, 1):
        out.append(f'<div class="flag-item" style="animation-delay:{min(i*0.03, 0.5):.2f}s">')
        out.append(f"<h3>{i}. {esc(it.get('title', 'Untitled'))}</h3>")
        meta_parts = []
        if it.get("type"):
            meta_parts.append(it["type"])
        if it.get("status"):
            meta_parts.append(f"Status: {it['status']}")
        out.append(f'<div class="flag-meta">{" · ".join(meta_parts)}</div>')

        if it.get("govtool"):
            out.append(f"<p><strong>GovTool:</strong> <a href='{esc(it['govtool'])}' target='_blank' rel='noopener'>{esc(it['govtool'])}</a></p>")
        if it.get("anchor"):
            out.append(f"<p><strong>Anchor:</strong> <code>{esc(it['anchor'])}</code></p>")

        out.append('<ul class="flag-reasons">')
        for fl in it.get("flags", []):
            out.append(f"<li><code>{esc(fl)}</code> <span>{esc(flag_reason(fl))}</span></li>")
        out.append("</ul>")
        out.append("</div>")
    return "\n".join(out)


def build_how_to_clear():
    return """<div class="card ok">
  <h2>How to Clear Flags (Fast)</h2>
  <ul>
    <li>Add public deliverable links (repo / site / video / podcast feed) to the official page.</li>
    <li>Add reporting / closeout links (final report, milestones, proof-of-work).</li>
    <li>For governance actions: ensure anchor metadata resolves and matches the on-chain hash.</li>
    <li>If you've already done this and we missed it, <a href="https://github.com/BEACNpool/Governance/issues" target="_blank" rel="noopener">open an issue</a> and we'll re-check.</li>
  </ul>
</div>"""


def main():
    today = dt.date.today().isoformat()
    root = Path(__file__).resolve().parent
    reports = root / "reports"
    data = root / "data"

    intersect_csv = reports / f"intersect-grants-waste-radar-{today}.csv"
    intersect_json = data / f"intersect-grants-waste-radar-{today}.json"
    treasury_csv = reports / f"treasury-withdrawals-{today}.csv"

    if not intersect_csv.exists():
        raise SystemExit(f"Missing {intersect_csv}")
    if not intersect_json.exists():
        raise SystemExit(f"Missing {intersect_json}")
    if not treasury_csv.exists():
        raise SystemExit(f"Missing {treasury_csv}")

    intersect_rows = read_csv(intersect_csv)
    treasury_rows = read_csv(treasury_csv)

    intersect_items = json.loads(intersect_json.read_text(encoding="utf-8")).get("items", [])
    by_url = {it.get("url"): it for it in intersect_items if it.get("url")}

    # Build flagged lists
    intersect_flagged = []
    for row in intersect_rows:
        flags_raw = row.get("flags", "")
        flags = [f.strip() for f in flags_raw.split(",") if f.strip()] if flags_raw else []
        if not flags:
            continue
        url = row.get("url", "")
        detail = by_url.get(url, {})
        amt = None
        if row.get("amount_ada"):
            try:
                amt = float(row["amount_ada"])
            except (TypeError, ValueError):
                pass
        intersect_flagged.append({
            "title": row.get("title", "Untitled"),
            "cohort": row.get("cohort", ""),
            "url": url,
            "amount": amt,
            "flags": flags,
            "last_updated": detail.get("last_updated", ""),
            "external_links": detail.get("external_links", []),
        })

    treasury_flagged = []
    for row in treasury_rows:
        flags_raw = row.get("flags", "")
        flags = [f.strip() for f in flags_raw.split(",") if f.strip()] if flags_raw else []
        if not flags:
            continue
        treasury_flagged.append({
            "title": row.get("title", "Untitled"),
            "type": row.get("type", ""),
            "status": row.get("status", ""),
            "govtool": row.get("govtool", ""),
            "anchor": row.get("anchor_url", ""),
            "flags": flags,
        })

    # Stats
    intersect_flag_counts = Counter()
    for it in intersect_flagged:
        for fl in it.get("flags", []):
            intersect_flag_counts[fl] += 1

    treasury_flag_counts = Counter()
    for it in treasury_flagged:
        for fl in it.get("flags", []):
            treasury_flag_counts[fl] += 1

    # ── Build full HTML ──
    page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>BEACN Waste Deep Dive — {today}</title>
<meta name="description" content="Evidence-first review of flagged treasury items. Missing receipts ≠ fraud. {today}"/>
<link rel="stylesheet" href="../assets/beacn.css"/>
</head>
<body>

{build_top_bar(today)}

<div class="report-page">

{build_header(today)}

{build_disclaimer()}

{build_summary(intersect_flagged, treasury_flagged, intersect_flag_counts, treasury_flag_counts)}

{build_intersect_section(intersect_flagged)}

{build_treasury_section(treasury_flagged)}

{build_how_to_clear()}

<footer class="report-footer">
  <p>Generated: {today} · MIT License · <a href="https://github.com/BEACNpool/Governance">BEACN Governance</a> · Not voting advice</p>
</footer>

</div>
</body>
</html>"""

    out_path = reports / f"waste-deep-dive-{today}.html"
    out_path.write_text(page, encoding="utf-8")
    print(out_path)


if __name__ == "__main__":
    main()

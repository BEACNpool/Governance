#!/usr/bin/env python3
"""Generate a DOGE-style grants spend ledger (HTML + JSON).

Uses BEACN v2 design system (assets/beacn.css).

Inputs:
- data/intersect-grants-waste-radar-YYYY-MM-DD.json

Outputs:
- reports/grants-ledger-YYYY-MM-DD.html
- data/grants-ledger-YYYY-MM-DD.json
"""

import datetime as dt
import html
import json
from pathlib import Path


def esc(s):
    return html.escape(str(s)) if s else ""


def fmt_ada(val):
    try:
        return f"{float(val):,.0f}"
    except (TypeError, ValueError):
        return "unknown"


def main():
    today = dt.date.today().isoformat()
    root = Path(__file__).resolve().parent
    reports = root / "reports"
    data_dir = root / "data"

    src = data_dir / f"intersect-grants-waste-radar-{today}.json"
    if not src.exists():
        raise SystemExit(f"Missing {src}")

    raw = json.loads(src.read_text(encoding="utf-8"))
    items = raw.get("items", [])

    # Parse grants
    grants = []
    by_cohort = {}
    for it in items:
        amt = None
        if it.get("grant_value"):
            try:
                amt = float(str(it["grant_value"]).replace(",", "").replace("₳", "").strip())
            except (TypeError, ValueError):
                pass
        g = {
            "title": it.get("title", "Untitled"),
            "cohort": it.get("cohort", ""),
            "url": it.get("url", ""),
            "amount_ada": amt,
            "flags": it.get("flags", []),
            "external_links": it.get("external_links", []),
        }
        grants.append(g)
        by_cohort.setdefault(g["cohort"], []).append(g)

    with_amount = [g for g in grants if g["amount_ada"] is not None]
    total_ada = sum(g["amount_ada"] for g in with_amount)

    cohort_totals = []
    for c, lst in by_cohort.items():
        wa = [g for g in lst if g["amount_ada"] is not None]
        cohort_totals.append({
            "cohort": c,
            "count": len(lst),
            "with_amount": len(wa),
            "sum_ada": sum(g["amount_ada"] for g in wa),
        })
    cohort_totals.sort(key=lambda x: x["sum_ada"], reverse=True)

    grants.sort(key=lambda g: (g["amount_ada"] if g["amount_ada"] is not None else -1, g["title"]), reverse=True)

    # Write JSON
    out_json = data_dir / f"grants-ledger-{today}.json"
    out_json.write_text(
        json.dumps({
            "generated_at": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "totals": {"items": len(grants), "items_with_amount": len(with_amount), "total_ada_known": total_ada},
            "cohort_totals": cohort_totals,
            "rows": grants,
        }, indent=2) + "\n",
        encoding="utf-8",
    )

    # ── Build HTML ──
    out = []
    out.append(f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>BEACN Grants Ledger — {today}</title>
<meta name="description" content="DOGE-style grants spend ledger. {len(grants)} items indexed, {fmt_ada(total_ada)} ADA tracked."/>
<link rel="stylesheet" href="../assets/beacn.css"/>
<style>
  .ledger-row {{ transition: background .15s; }}
  .ledger-row:hover {{ background: var(--bg-hover); }}
  .ledger-row td {{ font-size: 13px; }}
  .links-cell a {{ display: block; font-size: 12px; word-break: break-all; margin: 2px 0; }}
  .links-cell a:hover {{ text-decoration: underline; }}
</style>
</head>
<body>

<nav class="top-bar">
  <a href="../" class="brand">BEACN</a>
  <a href="../">← Dashboard</a>
  <a href="waste-deep-dive-{today}.html">Waste Deep Dive</a>
  <a href="methodology-doge.html">Methodology</a>
  <a href="https://github.com/BEACNpool/Governance" target="_blank" rel="noopener">GitHub</a>
</nav>

<div class="report-page">

<header class="report-header">
  <div class="report-badge">📒 GRANTS LEDGER · {today}</div>
  <h1>DOGE Grants Spend Ledger</h1>
  <p class="report-sub">
    Public money demands public receipts. This page spotlights where ADA is allocated
    and whether the public can <em>directly verify</em> deliverables via links.
  </p>
</header>

<div class="card warn">
  <h2>⚠️ Read This Before Scrolling</h2>
  <ul>
    <li><strong>Fact-driven, not vibes.</strong> Amounts come from official program pages. If a page doesn't state a value, we mark it unknown and exclude from totals.</li>
    <li><strong>Not voting advice.</strong> This is a transparency ledger to support public discussion and accountability.</li>
    <li><strong>Not an accusation list.</strong> Missing links = missing public receipts. The easiest fix: publish/attach links on the official page.</li>
  </ul>
</div>""")

    # Top-line stats
    out.append(f"""<div class="card">
  <h2>Top-Line Totals (Known Values Only)</h2>
  <p class="muted">This is the scope of this ledger. Not every item is wasteful — the point is to quantify exposure and demand receipts.</p>
  <div class="stat-grid">
    <div class="stat-box"><div class="s-val" style="color:var(--blue)">{len(grants)}</div><div class="s-label">Items indexed</div></div>
    <div class="stat-box"><div class="s-val" style="color:var(--ada-gold)">{len(with_amount)}</div><div class="s-label">With stated ADA</div></div>
    <div class="stat-box"><div class="s-val" style="color:var(--ada-gold)">{fmt_ada(total_ada)} ₳</div><div class="s-label">Total ADA (known)</div></div>
    <div class="stat-box"><div class="s-val" style="color:var(--amber)">{len(grants) - len(with_amount)}</div><div class="s-label">Value unknown</div></div>
  </div>
</div>""")

    # By cohort
    out.append('<div class="card"><h2>By Cohort (Known Values)</h2>')
    out.append('<table><thead><tr><th>Cohort</th><th class="num">Items</th><th class="num">Known Values</th><th class="num">Sum ADA</th></tr></thead><tbody>')
    for ct in cohort_totals:
        out.append(f'<tr><td>{esc(ct["cohort"])}</td><td class="num">{ct["count"]}</td><td class="num">{ct["with_amount"]}</td><td class="num">{fmt_ada(ct["sum_ada"])}</td></tr>')
    out.append("</tbody></table></div>")

    # Full table
    out.append('<div class="card"><h2>All Indexed Grants (Sorted by ADA)</h2>')
    out.append('<div style="overflow-x:auto">')
    out.append('<table><thead><tr><th>Program / Cohort</th><th>Grant</th><th class="num">ADA</th><th>Direct Receivable (Links)</th></tr></thead><tbody>')
    for g in grants:
        amt_str = fmt_ada(g["amount_ada"]) if g["amount_ada"] is not None else '<span style="color:var(--amber)">unknown</span>'
        links_html = ""
        ext = g.get("external_links", [])
        if ext:
            links_html = '<div class="links-cell">'
            for link in ext[:4]:
                links_html += f"<a href='{esc(link)}' target='_blank' rel='noopener'>{esc(link[:80])}{'…' if len(link) > 80 else ''}</a>"
            links_html += "</div>"
        else:
            links_html = '<span class="muted" style="font-size:12px">No public links found</span>'

        source_link = f"<a href='{esc(g['url'])}' target='_blank' rel='noopener'>source page</a>" if g.get("url") else ""
        flag_pills = ""
        if g.get("flags"):
            flag_pills = " ".join(f'<span class="pill flag" style="font-size:9px;margin:1px">{esc(f)}</span>' for f in g["flags"][:3])

        out.append(f"""<tr class="ledger-row">
<td>Intersect — Cohort {esc(g["cohort"])}</td>
<td><strong>{esc(g["title"])}</strong><div class="muted" style="font-size:12px">{source_link}</div>{f'<div style="margin-top:4px">{flag_pills}</div>' if flag_pills else ''}</td>
<td class="num">{amt_str}</td>
<td>{links_html}</td>
</tr>""")

    out.append("</tbody></table></div></div>")

    # How to clear
    out.append("""<div class="card ok">
  <h2>How to Clear Scrutiny</h2>
  <ul>
    <li>Add public deliverable links (repo / site / video) to the official grant page.</li>
    <li>Add reporting / closeout links (milestones, proof-of-work).</li>
    <li>If we missed existing links, <a href="https://github.com/BEACNpool/Governance/issues" target="_blank" rel="noopener">open an issue</a>.</li>
  </ul>
</div>""")

    out.append(f"""<footer class="report-footer">
  <p>Generated: {today} · MIT License · <a href="https://github.com/BEACNpool/Governance">BEACN Governance</a> · Not voting advice</p>
</footer>
</div>
</body>
</html>""")

    out_path = reports / f"grants-ledger-{today}.html"
    out_path.write_text("\n".join(out), encoding="utf-8")
    print(out_path)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Generate a community-readable HTML report focused on potential waste signals.

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
from pathlib import Path

FLAG_EXPLAIN = {
    # Intersect grants
    "NO_DELIVERABLE_LINKS": "No obvious public links to deliverables (e.g., YouTube/podcast feed/GitHub/website). This creates an accountability gap for delegators.",
    "NO_REPORTING_LINKS": "No obvious links to reporting/closeout/final evidence. Without reporting receipts, it’s hard to verify work completed.",
    "NO_EXTERNAL_LINKS": "No external links found at all. Even if work exists, the official page isn’t linking to it.",
    "MISSING_GRANT_VALUE": "Grant value not clearly stated on the page. This makes totals/ROI harder to audit.",

    # Governance
    "🟡 NO_DISCUSSION": "No obvious public discussion links were detected in proposal references. That’s not proof of waste, but it’s a governance transparency smell.",
    "🔴 NO_METADATA": "Anchor metadata missing/unresolvable. Without metadata, delegators can’t evaluate scope/deliverables.",
    "🔴 HASH_MISMATCH": "Anchor content hash mismatch vs on-chain hash. This is a serious integrity issue.",
}


def read_csv(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


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

    # Filter: focus on items with flags (waste signals)
    intersect_flagged = []
    for r in intersect_rows:
        flags = (r.get("flags") or "").strip()
        if not flags:
            continue
        url = (r.get("url") or "").strip()
        item = by_url.get(url, {})
        intersect_flagged.append(
            {
                "cohort": (r.get("cohort") or "").strip(),
                "title": (r.get("title") or "").strip(),
                "amount": int(r.get("grant_value_ada") or 0) if (r.get("grant_value_ada") or "").strip().isdigit() else None,
                "flags": [f for f in flags.split(";") if f],
                "url": url,
                "external_links": item.get("external_links", []),
                "last_updated": (r.get("last_updated") or "").strip(),
            }
        )

    intersect_flagged.sort(key=lambda x: (x["amount"] or -1, len(x["flags"])), reverse=True)

    # Treasury: focus on items with flags AND large stated amounts (signal)
    treasury_flagged = []
    for r in treasury_rows:
        flags = (r.get("flags") or "").strip()
        if not flags:
            continue
        title = (r.get("title") or "").strip()
        status = (r.get("status") or "").strip()
        govtool = (r.get("govtool_url") or "").strip()
        anchor = (r.get("anchor_url") or "").strip()
        treasury_flagged.append(
            {
                "title": title,
                "status": status,
                "flags": [f.strip() for f in flags.split(";") if f.strip()],
                "govtool": govtool,
                "anchor": anchor,
            }
        )

    # Basic sort: active first, then anything else
    def tkey(x):
        st = x.get("status")
        return (0 if st == "active" else 1, x.get("title", ""))

    treasury_flagged.sort(key=tkey)

    def esc(s):
        return html.escape(s or "")

    def flag_reason(flag):
        return FLAG_EXPLAIN.get(flag) or FLAG_EXPLAIN.get(flag.strip()) or "Flag raised due to missing or weak public evidence links." 

    # Build HTML
    out = []
    out.append("<!doctype html>")
    out.append('<html lang="en">')
    out.append("<head>")
    out.append('<meta charset="utf-8"/>')
    out.append('<meta name="viewport" content="width=device-width, initial-scale=1"/>')
    out.append(f"<title>BEACN Waste Deep Dive — {today}</title>")
    out.append("<style>")
    out.append(":root{color-scheme:light dark}")
    out.append("body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;line-height:1.5;max-width:1020px}")
    out.append("h1,h2,h3{line-height:1.2}")
    out.append(".muted{opacity:.75}")
    out.append(".card{border:1px solid rgba(127,127,127,.35);border-radius:12px;padding:16px 18px;margin:14px 0}")
    out.append(".warn{border-left:4px solid #b45309;padding-left:12px}")
    out.append("code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono',monospace;font-size:.95em}")
    out.append("a{text-decoration:none}a:hover{text-decoration:underline}")
    out.append(".pill{display:inline-block;padding:2px 10px;border-radius:999px;border:1px solid rgba(127,127,127,.35);font-size:12px;margin-left:8px}")
    out.append("</style>")
    out.append("</head>")
    out.append("<body>")

    out.append(f"<h1>Waste / Weak-Evidence Deep Dive — {today} <span class='pill'>AI analysis</span></h1>")
    out.append("<div class='muted'>Focused report: items that currently show weak public receipts or transparency gaps. Links included so anyone can verify.</div>")

    out.append("<div class='card warn'><strong>Important:</strong><ul>")
    out.append("<li><strong>Not voting advice.</strong> This report is informational and evidence-first.</li>")
    out.append("<li><strong>Not proof of fraud.</strong> A flag means missing/weak receipts (deliverables/reporting/payment proof), not wrongdoing.</li>")
    out.append("<li><strong>DOGE lens:</strong> we aggressively hunt waste signals by demanding receipts and clear outcomes.</li>")
    out.append("</ul></div>")

    out.append("<div class='card'>")
    out.append("<h2>What made this list?</h2>")
    out.append("<p>We only include items with evidence flags (missing deliverables/reporting/value). If an item is not flagged, it may still be debated — but it is not the focus of this document.</p>")
    out.append("</div>")

    out.append("<div class='card'>")
    out.append(f"<h2>Intersect Community Grants (flagged)</h2>")
    out.append(f"<div class='muted'>Flagged items: {len(intersect_flagged)} (from all cohorts rollup)</div>")
    out.append("<ol>")
    for it in intersect_flagged[:80]:
        out.append("<li>")
        out.append(f"<h3>{esc(it['title'])}</h3>")
        out.append(f"<div class='muted'>Cohort: {esc(it['cohort'] or '?')} | Last updated: {esc(it['last_updated'] or '?')}</div>")
        if it.get("amount") is not None:
            out.append(f"<p><strong>Grant value:</strong> {it['amount']:,} ADA</p>")
        else:
            out.append("<p><strong>Grant value:</strong> (missing/unclear)</p>")
        out.append(f"<p><strong>Source page:</strong> <a href='{esc(it['url'])}' target='_blank' rel='noopener'>{esc(it['url'])}</a></p>")

        out.append("<p><strong>Flags & reasons:</strong></p><ul>")
        for fl in it.get("flags", []):
            out.append(f"<li><code>{esc(fl)}</code> — {esc(flag_reason(fl))}</li>")
        out.append("</ul>")

        links = it.get("external_links") or []
        if links:
            out.append("<p><strong>External links found:</strong></p><ul>")
            for l in links[:10]:
                out.append(f"<li><a href='{esc(l)}' target='_blank' rel='noopener'>{esc(l)}</a></li>")
            out.append("</ul>")
        else:
            out.append("<p><strong>External links found:</strong> none</p>")

        out.append("</li>")
    out.append("</ol>")
    out.append("</div>")

    out.append("<div class='card'>")
    out.append("<h2>TreasuryWithdrawals (flagged governance transparency)</h2>")
    out.append(f"<div class='muted'>Flagged items: {len(treasury_flagged)} (flags are evidence/process signals, not proof of waste)</div>")
    out.append("<ol>")
    for it in treasury_flagged[:60]:
        out.append("<li>")
        out.append(f"<h3>{esc(it['title'])}</h3>")
        out.append(f"<div class='muted'>Status: {esc(it['status'] or '?')}</div>")
        if it.get("govtool"):
            out.append(f"<p><strong>GovTool:</strong> <a href='{esc(it['govtool'])}' target='_blank' rel='noopener'>{esc(it['govtool'])}</a></p>")
        if it.get("anchor"):
            out.append(f"<p><strong>Anchor:</strong> {esc(it['anchor'])}</p>")
        out.append("<p><strong>Flags & reasons:</strong></p><ul>")
        for fl in it.get("flags", []):
            out.append(f"<li><code>{esc(fl)}</code> — {esc(flag_reason(fl))}</li>")
        out.append("</ul>")
        out.append("</li>")
    out.append("</ol>")
    out.append("</div>")

    out.append("<div class='card'>")
    out.append("<h2>How to clear flags (fast)</h2>")
    out.append("<ul>")
    out.append("<li>Add public deliverable links (repo/site/video/podcast feed) to the official page.</li>")
    out.append("<li>Add reporting/closeout links (final report, milestones, proof-of-work).</li>")
    out.append("<li>For governance actions: ensure anchor metadata resolves and matches the on-chain hash.</li>")
    out.append("</ul>")
    out.append("</div>")

    out.append(f"<div class='muted'>Generated: {today}</div>")
    out.append("</body></html>")

    out_path = reports / f"waste-deep-dive-{today}.html"
    out_path.write_text("\n".join(out), encoding="utf-8")
    print(out_path)


if __name__ == "__main__":
    main()

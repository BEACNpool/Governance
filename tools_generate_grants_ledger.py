#!/usr/bin/env python3
"""Generate a community-readable Grants Ledger page.

Goal: show *how much ADA is allocated* and *what the public can directly verify* (links).

Current coverage:
- Intersect Community Grants (GitBook registry)

Future:
- Catalyst (once canonical dataset is ingested)

Inputs:
- reports/intersect-grants-waste-radar-YYYY-MM-DD.csv
- data/intersect-grants-waste-radar-YYYY-MM-DD.json

Outputs:
- reports/grants-ledger-YYYY-MM-DD.html
- data/grants-ledger-YYYY-MM-DD.json
"""

import csv
import datetime as dt
import html
import json
from collections import defaultdict
from pathlib import Path


def read_csv(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def esc(s: str) -> str:
    return html.escape(s or "")


def main():
    today = dt.date.today().isoformat()
    root = Path(__file__).resolve().parent
    reports = root / "reports"
    data_dir = root / "data"

    intersect_csv = reports / f"intersect-grants-waste-radar-{today}.csv"
    intersect_json = data_dir / f"intersect-grants-waste-radar-{today}.json"

    if not intersect_csv.exists():
        raise SystemExit(f"Missing {intersect_csv}")
    if not intersect_json.exists():
        raise SystemExit(f"Missing {intersect_json}")

    rows = read_csv(intersect_csv)
    items = json.loads(intersect_json.read_text(encoding="utf-8")).get("items", [])
    by_url = {it.get("url"): it for it in items if it.get("url")}

    # Normalize
    grants = []
    for r in rows:
        title = (r.get("title") or "").strip()
        url = (r.get("url") or "").strip()
        cohort = (r.get("cohort") or "").strip()
        flags = (r.get("flags") or "").strip()
        last_updated = (r.get("last_updated") or "").strip()
        amt_raw = (r.get("grant_value_ada") or "").strip()
        try:
            amt = int(amt_raw) if amt_raw.isdigit() else None
        except Exception:
            amt = None

        external_links = (by_url.get(url) or {}).get("external_links", [])

        grants.append(
            {
                "program": "Intersect Community Grants",
                "cohort": cohort,
                "title": title,
                "amount_ada": amt,
                "url": url,
                "external_links": external_links,
                "flags": [f for f in flags.split(";") if f],
                "last_updated": last_updated,
            }
        )

    # Stats
    with_amount = [g for g in grants if g["amount_ada"] is not None]
    total_ada = sum(g["amount_ada"] for g in with_amount)

    by_cohort = defaultdict(list)
    for g in grants:
        by_cohort[g["cohort"] or "?"] .append(g)

    cohort_totals = []
    for c, lst in by_cohort.items():
        wa = [g for g in lst if g["amount_ada"] is not None]
        cohort_totals.append(
            {
                "cohort": c,
                "count": len(lst),
                "with_amount": len(wa),
                "sum_ada": sum(g["amount_ada"] for g in wa),
            }
        )
    cohort_totals.sort(key=lambda x: x["sum_ada"], reverse=True)

    # Sort main list by amount desc, then title
    grants.sort(key=lambda g: (g["amount_ada"] if g["amount_ada"] is not None else -1, g["title"]), reverse=True)

    # Write JSON feed
    out_json = data_dir / f"grants-ledger-{today}.json"
    out_json.write_text(
        json.dumps(
            {
                "generated_at": dt.datetime.now(dt.timezone.utc)
                .replace(microsecond=0)
                .isoformat()
                .replace("+00:00", "Z"),
                "totals": {
                    "items": len(grants),
                    "items_with_amount": len(with_amount),
                    "total_ada_known": total_ada,
                },
                "cohort_totals": cohort_totals,
                "rows": grants,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    # HTML
    out = []
    out.append("<!doctype html>")
    out.append('<html lang="en">')
    out.append("<head>")
    out.append('<meta charset="utf-8"/>')
    out.append('<meta name="viewport" content="width=device-width, initial-scale=1"/>')
    out.append(f"<title>BEACN Grants Ledger — {today}</title>")
    out.append("<style>")
    out.append(":root{color-scheme:light dark}")
    out.append("body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;line-height:1.5;max-width:1100px}")
    out.append("h1,h2,h3{line-height:1.2}")
    out.append(".muted{opacity:.75}")
    out.append(".card{border:1px solid rgba(127,127,127,.35);border-radius:12px;padding:16px 18px;margin:14px 0}")
    out.append(".warn{border-left:4px solid #b45309;padding-left:12px}")
    out.append("a{text-decoration:none}a:hover{text-decoration:underline}")
    out.append("code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono',monospace;font-size:.95em}")
    out.append("table{border-collapse:collapse;width:100%}")
    out.append("th,td{border-bottom:1px solid rgba(127,127,127,.25);padding:10px 8px;vertical-align:top}")
    out.append("th{text-align:left}")
    out.append(".num{text-align:right;white-space:nowrap}")
    out.append(".pill{display:inline-block;padding:2px 10px;border-radius:999px;border:1px solid rgba(127,127,127,.35);font-size:12px;margin-left:8px}")
    out.append("</style>")
    out.append("</head><body>")

    out.append(f"<h1>DOGE Grants Spend Ledger — {today} <span class='pill'>AI-indexed</span></h1>")
    out.append("<div class='muted'><strong>DOGE lens:</strong> public money demands public receipts. This page spotlights where ADA is allocated and whether the public can <em>directly verify</em> deliverables via links.</div>")

    out.append("<div class='card warn'><strong>Read this before scrolling:</strong><ul>")
    out.append("<li><strong>Fact-driven, not vibes.</strong> Amounts come from official program pages. If a page doesn’t state a value clearly, we mark it unknown and exclude it from totals.</li>")
    out.append("<li><strong>Not voting advice.</strong> This is a transparency ledger to support public discussion and accountability.</li>")
    out.append("<li><strong>Not an accusation list.</strong> Missing links = missing public receipts. The easiest way to clear scrutiny is to publish/attach deliverable + reporting links on the official page.</li>")
    out.append("</ul></div>")

    out.append("<div class='card'>")
    out.append("<h2>Top-line totals (known values only)</h2>")
    out.append("<div class='muted'>This is the ‘maximum savings ceiling’ for this page <em>only if</em> every listed item were wasteful (unlikely). The point is to quantify exposure and demand receipts, not to accuse.</div>")
    out.append("<ul>")
    out.append(f"<li><strong>Total items indexed:</strong> {len(grants)}</li>")
    out.append(f"<li><strong>Items with stated ADA value:</strong> {len(with_amount)} (unknown: {len(grants)-len(with_amount)})</li>")
    out.append(f"<li><strong>Total ADA (known):</strong> {total_ada:,} ADA</li>")
    out.append("</ul>")
    out.append("</div>")

    out.append("<div class='card'>")
    out.append("<h2>By cohort (known values)</h2>")
    out.append("<table><thead><tr><th>Cohort</th><th class='num'>Items</th><th class='num'>Known values</th><th class='num'>Sum ADA</th></tr></thead><tbody>")
    for c in cohort_totals:
        out.append(
            f"<tr><td>{esc(c['cohort'])}</td><td class='num'>{c['count']}</td><td class='num'>{c['with_amount']}</td><td class='num'>{c['sum_ada']:,}</td></tr>"
        )
    out.append("</tbody></table>")
    out.append("</div>")

    out.append("<div class='card'>")
    out.append("<h2>All indexed grants (sorted by ADA)</h2>")
    out.append("<table><thead><tr><th>Program / Cohort</th><th>Grant</th><th class='num'>ADA</th><th>Direct receivable (links)</th></tr></thead><tbody>")

    for g in grants:
        prog = f"{g['program']} — Cohort {g['cohort']}" if g.get("cohort") else g["program"]
        amt = f"{g['amount_ada']:,}" if g.get("amount_ada") is not None else "?"

        links = g.get("external_links") or []
        # show up to 3 links
        link_html = ""
        if links:
            shown = links[:3]
            link_html = "<ul>" + "".join(
                [f"<li><a href='{esc(l)}' target='_blank' rel='noopener'>{esc(l)}</a></li>" for l in shown]
            ) + "</ul>"
        else:
            link_html = "<span class='muted'>(none found)</span>"

        title = esc(g.get("title"))
        src = esc(g.get("url"))

        out.append("<tr>")
        out.append(f"<td>{esc(prog)}</td>")
        out.append(
            f"<td><strong>{title}</strong><div class='muted'><a href='{src}' target='_blank' rel='noopener'>source page</a></div></td>"
        )
        out.append(f"<td class='num'>{amt}</td>")
        out.append(f"<td>{link_html}</td>")
        out.append("</tr>")

    out.append("</tbody></table>")
    out.append("</div>")

    out.append("<div class='muted'>Generated: {}</div>".format(today))
    out.append("</body></html>")

    out_html = reports / f"grants-ledger-{today}.html"
    out_html.write_text("\n".join(out), encoding="utf-8")
    print(out_html)


if __name__ == "__main__":
    main()

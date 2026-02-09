#!/usr/bin/env python3
"""Generate a unified funding index (TreasuryWithdrawals + Intersect Grants).

This is a *dashboard feed*: a flat table you can sort/filter.
Not an accusation list — it surfaces amounts + evidence links + missing-evidence flags.

Inputs (expected in repo):
- reports/treasury-withdrawals-YYYY-MM-DD.csv
- reports/intersect-grants-waste-radar-YYYY-MM-DD.csv

Outputs:
- reports/unified-funding-index-YYYY-MM-DD.csv
- reports/unified-funding-index-YYYY-MM-DD.md
- data/unified-funding-index-YYYY-MM-DD.json
"""

import csv
import datetime as dt
import json
import re
from pathlib import Path

RE_TREASURY_AMT = re.compile(r"₳\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]+)?)")


def parse_ada_from_title(title: str):
    if not title:
        return None
    m = RE_TREASURY_AMT.search(title)
    if not m:
        return None
    return float(m.group(1).replace(",", ""))


def guess_entity_from_treasury_title(title: str):
    if not title:
        return None
    low = title.lower()
    # common patterns: "Withdraw ₳X for <entity>" | "Loan ₳X to <entity>"
    for kw in [" for ", " to "]:
        if kw in low:
            idx = low.find(kw)
            entity = title[idx + len(kw) :].strip()
            # trim common suffixes
            for cut in [" administered by ", " - ", " (", " — ", " | "]:
                j = entity.lower().find(cut)
                if j != -1:
                    entity = entity[:j].strip()
            return entity[:120] or None
    return None


def read_csv(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def main():
    today = dt.date.today().isoformat()
    root = Path(__file__).resolve().parent
    reports = root / "reports"
    data = root / "data"

    treasury_csv = reports / f"treasury-withdrawals-{today}.csv"
    intersect_csv = reports / f"intersect-grants-waste-radar-{today}.csv"

    if not treasury_csv.exists():
        raise SystemExit(f"Missing {treasury_csv}")
    if not intersect_csv.exists():
        raise SystemExit(f"Missing {intersect_csv}")

    treasury = read_csv(treasury_csv)
    intersect = read_csv(intersect_csv)

    rows = []

    # TreasuryWithdrawals
    for r in treasury:
        title = (r.get("title") or "").strip()
        amt = parse_ada_from_title(title)
        entity = guess_entity_from_treasury_title(title)
        flags = (r.get("flags") or "").strip()
        rows.append(
            {
                "mechanism": "CIP1694_TreasuryWithdrawal",
                "round": "",
                "status": (r.get("status") or "").strip(),
                "title": title,
                "entity": entity or "",
                "amount_ada": amt if amt is not None else "",
                "source_url": (r.get("govtool_url") or "").strip(),
                "evidence_url": (r.get("anchor_url") or "").strip(),
                "flags": flags,
            }
        )

    # Intersect Grants (All cohorts rollup)
    for r in intersect:
        title = (r.get("title") or "").strip()
        cohort = (r.get("cohort") or "").strip()
        amt_raw = (r.get("grant_value_ada") or "").strip()
        try:
            amt = float(amt_raw) if amt_raw else ""
        except Exception:
            amt = ""
        rows.append(
            {
                "mechanism": "Intersect_Community_Grants",
                "round": f"Cohort {cohort}" if cohort else "",
                "status": "",
                "title": title,
                "entity": title,  # for Intersect pages, title is effectively the grantee/project name
                "amount_ada": amt,
                "source_url": (r.get("url") or "").strip(),
                "evidence_url": (r.get("external_links") or "").split(" ")[0].strip() if (r.get("external_links") or "").strip() else "",
                "flags": (r.get("flags") or "").strip(),
            }
        )

    def sort_key(x):
        try:
            return float(x["amount_ada"])
        except Exception:
            return -1

    rows.sort(key=sort_key, reverse=True)

    out_base = f"unified-funding-index-{today}"
    out_csv = reports / f"{out_base}.csv"
    out_md = reports / f"{out_base}.md"
    out_json = data / f"{out_base}.json"

    # CSV
    fields = [
        "mechanism",
        "round",
        "status",
        "title",
        "entity",
        "amount_ada",
        "source_url",
        "evidence_url",
        "flags",
    ]
    with out_csv.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow(r)

    # JSON (for future UI)
    out_json.write_text(
        json.dumps(
            {
                "generated_at": dt.datetime.now(dt.timezone.utc)
                .replace(microsecond=0)
                .isoformat()
                .replace("+00:00", "Z"),
                "rows": rows,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    # MD (summary + links)
    lines = []
    lines.append(f"# Unified Funding Index — {today}")
    lines.append("")
    lines.append("Combined dashboard of funding items across mechanisms currently indexed:")
    lines.append("- CIP-1694 TreasuryWithdrawals (from governance DB export)")
    lines.append("- Intersect Community Grants (GitBook sitemap crawl)")
    lines.append("")
    lines.append("**Notes / caveats**")
    lines.append("- This is not an accusation list. Flags indicate missing or hard-to-find public evidence links.")
    lines.append("- TreasuryWithdrawals `entity` + `amount` are heuristics parsed from titles until we extract recipients/amounts from on-chain payloads.")
    lines.append("")
    lines.append(f"Total rows: **{len(rows)}**")
    lines.append("")

    top = rows[:25]
    lines.append("## Top items by ADA (first 25)")
    lines.append("")
    for r in top:
        amt = r["amount_ada"]
        amt_s = f"{amt:,.0f}" if isinstance(amt, (int, float)) else (str(amt) if amt else "?")
        lines.append(f"- **{amt_s} ADA** — {r['title']} ({r['mechanism']}{', ' + r['round'] if r['round'] else ''})")
        if r.get("source_url"):
            lines.append(f"  - Source: {r['source_url']}")
        if r.get("evidence_url"):
            lines.append(f"  - Evidence: {r['evidence_url']}")
        if r.get("flags"):
            lines.append(f"  - Flags: {r['flags']}")

    out_md.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(out_csv)
    print(out_md)
    print(out_json)


if __name__ == "__main__":
    main()

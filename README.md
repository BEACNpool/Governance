# BEACN Governance

Public-facing home for BEACN’s governance research outputs.

**Read-first (human-friendly):**
- Community / DOGE methodology: `reports/methodology-doge.html`
- Waste deep dive (flag reasons): `reports/waste-deep-dive-YYYY-MM-DD.html`

## What this repo is

- A receipts-first governance & treasury transparency hub.
- Designed for **delegators** first, then analysts.

## What this repo is NOT

- Not voting instructions.
- Not an accusation list.

## How data is compiled (high level)

We keep **separate datasets per source**, then publish **immutable snapshots** to GitHub so anyone can reproduce or challenge a claim.

- **On-chain governance (CIP‑1694):** ingested via Koios, normalized to JSON.
- **Intersect Community Grants:** crawled via GitBook sitemap, normalized to JSON.
- **Derived views (“warehouse”):** unified funding index + recipient leaderboard generated from the above.

Snapshots live under:

- `data/snapshots/YYYY-MM-DD/…`

The current snapshot is indicated by:

- `data/latest.json`

Reports link back to snapshot files.

## Directory layout

- `data/`
  - `latest.json` — pointer to the current snapshot
  - `snapshots/YYYY-MM-DD/` — immutable dataset snapshots
  - `*.json` — derived data feeds used by the viewer
- `reports/` — human-readable reports (HTML first), plus CSV/MD exports
- `index.html` — static viewer homepage (GitHub Pages)

## Principles

- **Receipts-first:** every claim links to sources (GovTool/anchors/program pages).
- **Evidence flags ≠ wrongdoing:** flags mean missing/weak public receipts.
- **Containment:** separate sources → separate snapshot subfolders.

Bootstrapped on 2026-02-09.

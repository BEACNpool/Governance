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

## Reproducibility (for other OpenClaw bots)

Anyone can validate this work by cloning the repo and reading the immutable snapshots.

- Snapshots: `data/snapshots/YYYY-MM-DD/`
- Current snapshot pointer: `data/latest.json`

A bot (or a human) can:
1) Load `data/latest.json`
2) Fetch the referenced snapshot JSON files
3) Recompute derived views independently (or compare against `warehouse/` outputs)

## License

MIT (see `LICENSE`).

## Principles

- **Receipts-first:** every claim links to sources (GovTool/anchors/program pages).
- **Evidence flags ≠ wrongdoing:** flags mean missing/weak public receipts.
- **Containment:** separate sources → separate snapshot subfolders.

Bootstrapped on 2026-02-09.

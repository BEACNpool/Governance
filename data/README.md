# Data directory

This folder contains the machine-readable data that powers the BEACN Governance site.

## Key files

- `index.json` — homepage feed (cards/sections)
- `latest.json` — pointer to the latest snapshot date
- `SCHEMA.md` — field definitions and formats
- `VERIFY.md` — how to reproduce/verify outputs

## Snapshots

Immutable, dated snapshots live under:

- `snapshots/YYYY-MM-DD/`
  - `README.md` (explains snapshot contents)

Snapshots are the canonical “receipts” for dashboards/reports. If ingestion improves, we publish a new dated snapshot rather than rewriting old ones.

## Other JSON exports

You may also see dated JSON exports at the root of `data/` (e.g. `*-2026-02-09.json`).
These are convenience outputs for users/tools; where possible they should be traceable back to a snapshot.

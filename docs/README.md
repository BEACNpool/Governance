# BEACN Governance — Start Here

This repository backs the public site:
- https://beacnpool.github.io/Governance/

## What this repo contains

- **Public dashboards and reports** (human-readable)
- **Immutable data snapshots** (machine-readable)
- **DRep metadata + vote receipts** (verifiable governance history)

## Newcomer quick path

1) **Read the methodology** (what we flag and why):
   - https://beacnpool.github.io/Governance/reports/methodology-doge.html

2) **See the latest community summary**:
   - https://beacnpool.github.io/Governance/reports/community-summary-latest.html

3) **Audit BEACNpool DRep votes + receipts**:
   - https://beacnpool.github.io/Governance/drep/votes/reader.html

4) **Verify data / reproduce**:
   - `data/VERIFY.md`

## Repository map

- `index.html` — GitHub Pages home (renders sections from `data/index.json`)
- `reports/` — published reports (HTML + CSV + MD)
- `data/` — datasets + immutable snapshots
- `drep/` — BEACNpool DRep metadata + receipts
- `scripts/` — automation for pulling/building live vote data
- `tools_generate_*.py` — report generators

If you’re contributing, see `CONTRIBUTING.md`.

# Snapshot — 2026-02-09

This folder is a point-in-time snapshot of the datasets used by the BEACN Governance viewer.

## Structure

- `gov-actions/` — CIP-1694 governance actions pulled from Koios and normalized into JSON.
- `intersect-grants/` — Intersect Community Grants registry snapshot + evidence flags.
- `warehouse/` — derived views (unified funding index, recipient/entity leaderboard).

## Notes

- Snapshots are immutable outputs. If something looks wrong, we fix the ingestion and publish a new dated snapshot.
- Reports/analysis are generated *on-demand* and link back to these snapshot files.

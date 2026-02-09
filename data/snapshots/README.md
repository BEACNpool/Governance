# Snapshots

This directory contains **immutable point-in-time snapshots** of the datasets used by the BEACN Governance viewer.

## Why snapshots?

- **Reproducibility:** Discussions stay anchored to a specific dataset version.
- **Integrity:** If something is wrong, we fix ingestion and publish a new dated snapshot.
- **Containment:** Different sources (on-chain governance vs program registries) can be corrected independently.

## Structure

- `YYYY-MM-DD/`
  - `gov-actions/` — CIP-1694 governance actions pulled via Koios and normalized to JSON.
  - `intersect-grants/` — Intersect Community Grants registry snapshot + evidence flags.
  - `warehouse/` — derived views (unified funding index, recipient/entity leaderboard).

## Latest pointer

See `data/latest.json` to find the current snapshot folder.

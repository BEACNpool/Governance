# DRep Compass (working title)

A public, receipts-first tool that helps Cardano delegators:

1) Look up a DRep and see exactly how they vote (across all governance action types)
2) Define their own preferences via a fast quiz + calibration on real past actions
3) Compare alignment and find better-fit DReps with linked evidence

Status: scaffolding + v0 spec in progress.

## Principles

- **Receipts-first:** always link to the action and any anchor/rationale.
- **No vibes-only matching:** alignment is based on revealed preferences (votes + rationales).
- **Show uncertainty:** sparse histories and low coverage must be labeled.
- **Public by default:** static-hostable outputs; minimal backend ops.

## Layout

- `pipeline/` – data ingest + feature extraction + scoring; emits JSON for the frontend
- `public-data/` – generated datasets consumed by the frontend (commit or publish via CI)
- `frontend/` – static SPA
- `docs/` – schemas, taxonomy, scoring notes

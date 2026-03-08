# Interim Evidence Bundle v1 — Founder Seed Confirmation + IOG Shelley Window

**Subtitle:** Best-effort, evidence-first tracing update for genesis ADA accountability research

## 1) Scope and non-accusation statement
This bundle is a best-effort, evidence-first tracing checkpoint for founder-linked genesis ADA flows.

It is **not** a forensic audit, legal claim, or prosecutorial document.

No "final destination" claims are made here; all destinations are **current observed trace points** unless shown to be unspent with no downstream movement.

## 2) Methodology and evidence grading
Tracing source:
- Cardano db-sync receipts (relay)
- Founder seed registry (`confirmed_seeds_founders.csv`)
- Structured window exports from traced founder graph

Evidence grading:
- **FACT**: directly supported by on-chain/db-sync receipts
- **STRONG INFERENCE**: highly supported clustering/attribution signal, not direct proof
- **UNKNOWN**: unresolved/unlabeled/not responsibly attributable yet

Execution constraints used in this phase:
- Founder-first tracing (IOG/CF/Emurgo only)
- Idempotent edge insertion with dedupe guard
- Root-attribution persistence via `address_root`
- High-value-first expansion, with deferred lower-value edges tracked separately

## 3) Confirmed founder seed receipts
Founder seed registry in this bundle:
- `confirmed_seeds_founders.csv`

This includes 3 founder roots marked `CONFIRMED` with candidate seed tx, block, epoch, and timestamp fields.

## 4) IOG Shelley ingress fact
**FACT:** A Shelley-era ingress was observed on the IOG founder-linked tracing branch at epoch **208** via transaction:

`f3e68848e3099b7b4d2e199354dce21a596d256d25af1bb21c80ca958b1cb1d2`

Supporting receipt row included in:
- `receipts_pack.csv` (receipt_type: `FIRST_SHELLEY_INGRESS`)

## 5) IOG 208–230 structured unknown
IOG Shelley/stake-bearing window file:
- `iog_shelley_window_208_230.csv`

Window summary file:
- `iog_208_230_summary.json`

Top clusters:
- `iog_208_230_top20_stake_credentials.csv`
- `iog_208_230_top20_dest_addresses.csv`

Current measured result for this window:
- Rows: **8,593**
- Unique stake credentials: **4,481**
- Unique destination addresses: **5,372**
- Label hits: **0 payment / 0 stake** (against current working label set)

Interpretation:
This is a large, structured migration surface that currently does not intersect the working label set. This is recorded as an **unresolved attribution gap**, not evidence of absence.

## 6) CF/Emurgo current ingress-negative status
At this checkpoint, CF and Emurgo remain ingress-negative in the current pass:
- CF: no observed Shelley ingress yet
- Emurgo: no observed Shelley ingress yet

## 7) Limits and next steps
Limits in this bundle:
- Label coverage is incomplete and may miss valid real-world entities
- Absence of label hits is not absence of activity
- Additional downstream movement may exist beyond current bounded windows

Next steps:
1. Continue founder expansion with controlled thresholds
2. Expand and reconcile label intelligence
3. Re-run payment+stake matching over new windows
4. Promote first confirmed label intersections into receipts pack
5. Backfill deferred lower-value edges where needed

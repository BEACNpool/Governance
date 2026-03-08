# Interim Evidence Bundle v1 — Founder Seed Confirmation + IOG Shelley Window

**Subtitle:** Best-effort, evidence-first tracing update for genesis ADA accountability research

## 1) Scope and non-accusation statement

This bundle is a best-effort, evidence-first tracing checkpoint focused on founder-linked genesis ADA flows.

It is **not** a forensic audit, legal allegation, or prosecutorial document. It is a structured research artifact intended to separate what is directly observed from what remains unresolved.

No “final destination” claims are made here; all destinations referenced in this bundle are **current observed trace points** unless they are shown to be unspent with no downstream movement.

## 2) Methodology and evidence grading

This phase relied on:

* Cardano `db-sync` receipts from relay-side tracing
* a founder seed registry in `confirmed_seeds_founders.csv`
* bounded Shelley-window exports from the traced founder graph

Evidence is classified using the following standard:

* **FACT**: directly supported by on-chain or `db-sync` receipts
* **STRONG INFERENCE**: highly supported clustering or attribution signal, but not direct proof
* **UNKNOWN**: unresolved, unlabeled, or not yet responsibly attributable

Execution constraints in this phase:

* founder-first tracing only (`IOG`, `CF`, `EMURGO`)
* idempotent edge insertion with dedupe guards
* persistent root attribution via `address_root`
* high-value-first expansion, with lower-value edges deferred for later review

## 3) Confirmed founder seed receipts

The founder seed registry included in this bundle is:

* `confirmed_seeds_founders.csv`

This file contains 3 founder roots marked `CONFIRMED`, including candidate seed transaction hash, block, epoch, and timestamp fields derived from `db-sync` receipts.

## 4) IOG Shelley ingress fact

**FACT:** A Shelley-era ingress was observed on the IOG founder-linked tracing branch at epoch **208** via transaction:

`f3e68848e3099b7b4d2e199354dce21a596d256d25af1bb21c80ca958b1cb1d2`

A supporting receipt row is included in:

* `receipts_pack.csv` (`receipt_type = FIRST_SHELLEY_INGRESS`)

## 5) IOG 208–230 structured unknown

The bounded IOG Shelley/stake-bearing window for epochs 208–230 is included in:

* `iog_shelley_window_208_230.csv`

Supporting summary artifacts:

* `iog_208_230_summary.json`
* `iog_208_230_top20_stake_credentials.csv`
* `iog_208_230_top20_dest_addresses.csv`

Current measured result for this window:

* Rows: **8,593**
* Unique stake credentials: **4,481**
* Unique destination addresses: **5,372**
* Label intersections: **0 payment / 0 stake** against the current working label set

**UNKNOWN:** This is a large, highly structured migration surface that does not yet intersect the current working label set. It is therefore recorded as an **unresolved attribution gap**, not as evidence of absence, inactivity, or benignity.

## 6) CF/Emurgo current ingress-negative status

At this checkpoint, the current tracing pass remains ingress-negative for the other two founder-linked branches:

* **CF:** no observed Shelley ingress yet
* **EMURGO:** no observed Shelley ingress yet

This is a statement about the current bounded tracing pass only. It is not a claim that no such ingress exists.

## 7) Limits and next steps

### Limits

* Label coverage remains incomplete and may miss valid real-world entities
* Absence of label intersections is not absence of activity
* Additional downstream movement may exist beyond the current bounded tracing windows
* Pool-linked stake keys and similar labels may support clustering analysis, but are not automatically proof of treasury custody or beneficial ownership

### Next steps

1. Continue founder expansion using controlled thresholds
2. Expand and reconcile high-confidence label intelligence
3. Re-run payment and stake matching over newly materialized windows
4. Promote first confirmed label intersections into the receipts pack
5. Backfill deferred lower-value edges where necessary

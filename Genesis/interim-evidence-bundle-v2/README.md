# Interim Evidence Bundle v2 — Founder Seed Confirmation + IOG Shelley Window

**Subtitle:** Best-effort, evidence-first tracing update for genesis ADA accountability research

## Quality gate status (recorded)

- Mandatory gates (#1, #2): **PASS / PASS**
- Overall gates: **8/8 PASS (recorded at commit `de22d95` / tag `v2-candidate-audit-fixes`)**
- Recorded result file: `GATE_RESULTS.md`
- Gate definitions/checklist: `QUALITY_GATES.md`

## Operating control rule (claim discipline)

No new README/public-facing claim may be added unless:
1) a corresponding row exists in `receipts_pack.csv`, and
2) a corresponding row exists in `CLAIMS_TO_RECEIPTS_MAP.md`,
or it is explicitly classified as **UNKNOWN** with no implied proof.

## 1) Scope and non-accusation statement

This bundle is a best-effort, evidence-first tracing checkpoint focused on founder-linked genesis ADA flows.

It is **not** a forensic audit, legal allegation, or prosecutorial document. It is a structured research artifact intended to separate what is directly observed from what remains unresolved.

No “final destination” claims are made here; all destinations referenced in this bundle are **current observed trace points** unless they are shown to be unspent with no downstream movement.

## 2) Methodology and evidence grading

This phase relied on:

* Cardano `db-sync` receipts from relay-side tracing
* founder seed registry in `confirmed_seeds_founders.csv`
* bounded Shelley-window exports from the traced founder graph
* relay-side label joins against indexed label tables

Evidence is classified using the following standard:

* **FACT**: directly supported by on-chain or `db-sync` receipts
* **STRONG INFERENCE**: highly supported clustering or attribution signal, but not direct proof
* **UNKNOWN**: unresolved, unlabeled, or not yet responsibly attributable

Execution constraints in this phase:

* founder-first tracing only (`IOG`, `CF`, `EMURGO`)
* idempotent edge insertion with dedupe guards
* persistent root attribution via `address_root`
* high-value-first expansion, with lower-value edges deferred for later review

## 3) Headline findings (current)

### FACT

1. **IOG → Binance confirmed CEX deposits (epoch 27 / 2018-02-06): total 7,921,587 ADA**
   - tx `893a195a124cb10a33105974e47b10402dd39ee4791579e18577578eb6f84f25` (5,878,892 ADA)
   - tx `753ff5403e23c15abba5a6aa6597b078e1fffedd4a80e769b199c918e8bbde81` (2,042,695 ADA)
   - Match type: direct payment-address match to Binance-labeled Byron address

2. **IOG Shelley ingress confirmed at epoch 208**
   - tx `f3e68848e3099b7b4d2e199354dce21a596d256d25af1bb21c80ca958b1cb1d2`

### STRONG INFERENCE

1. **EMURGO branch reached exchange-class Byron infrastructure**
   - tx `caa4f573f1f2c1cd98c51f2bad2c8ef8f69a69689e03ee3e48467e173836b9bf`
   - 14,099.8 ADA to behaviorally exchange-class address (2,521 tx / 1,489 counterparties / 26.5M ADA throughput)
   - Specific exchange identity remains unconfirmed

### EMURGO evidence update (bounded pass)

- **FACT:** EMURGO Shelley ingress confirmed at epoch **208** via tx `48695c1092d0e465a3d32ee9fb5b799c8d93a725e76a45badf01af7a2446389e`
- Bounded Shelley-window rows (epochs 208–230): **24**
- Label hits in that window: **0 payment / 0 stake**
- External attribution for this window remains **UNKNOWN** in the current bounded pass

### UNKNOWN

1. Purpose of IOG Binance deposits (sell/listing/vendor/custody/treasury ops not provable on-chain)
2. Beneficial ownership after exchange ingress
3. Full CF Byron→Shelley bridge not yet observed in current bounded pass
4. EMURGO external attribution beyond ingress remains unresolved in the current bounded Shelley window
5. Large unlabeled portions of founder-linked flows remain unresolved

## 4) Confirmed founder seed receipts

The founder seed registry included in this bundle:

* `confirmed_seeds_founders.csv`

This file contains 3 founder roots marked `CONFIRMED`, including candidate seed transaction hash, block, epoch, and timestamp fields derived from `db-sync` receipts.

## 5) IOG Shelley-window evidence

* `iog_shelley_window_208_230.csv`
* `iog_208_230_summary.json`
* `iog_208_230_top20_stake_credentials.csv`
* `iog_208_230_top20_dest_addresses.csv`

Window snapshot (epochs 208–230):

* Rows: **8,593**
* Unique stake credentials: **4,481**
* Unique destination addresses: **5,372**

## 6) CF/Emurgo status in current bounded pass

At this checkpoint, the current bounded forward tracing pass remains ingress-negative for CF and EMURGO:

* **CF:** no observed Shelley ingress yet in this bounded pass
* **EMURGO:** no observed Shelley ingress yet in this bounded pass

This is a tracing-boundary statement only, not an inactivity claim.

## 7) Included files (evidence + governance controls)

* `receipts_pack.csv`
* `confirmed_seeds_founders.csv`
* `label_hits_external_deduped.csv`
* `label_hits_summary_deduped.csv`
* `external_hits_source_validation.csv`
* `iog_shelley_window_208_230.csv`
* `iog_208_230_summary.json`
* `iog_208_230_top20_stake_credentials.csv`
* `iog_208_230_top20_dest_addresses.csv`
* `emurgo_hop5_summary.json`
* `emurgo_shelley_window_208_230.csv`
* `emurgo_label_summary.json`
* `probable_byron_exchanges.csv`
* `cf_emurgo_probable_exchange_intersections.csv`
* `cf_emurgo_probable_exchange_intersections_summary.json`
* `CHANGELOG.md`
* `QUALITY_GATES.md`
* `GATE_RESULTS.md`
* `CLAIMS_TO_RECEIPTS_MAP.md`
* `SNAPSHOT.md`

## 8) Limits and next steps

### Limits

* Label coverage remains incomplete and may miss valid real-world entities
* Absence of label intersections is not absence of activity
* Additional downstream movement may exist beyond current bounded windows
* Custodian labels do not automatically prove beneficial ownership

### Next steps

1. Continue CF/EMURGO bridge search with bounded reverse depth
2. Expand and reconcile high-confidence external labels
3. Re-run payment + stake joins on newly materialized windows
4. Promote additional confirmed intersections into `receipts_pack.csv`
5. Complete quality-gate pass, then publish v2 bundle

# Interim Evidence Bundle v2 — Founder Genesis Tracing Snapshot

**Subtitle:** Best-effort, evidence-first accountability research into founder-linked genesis ADA across IOG, EMURGO, and the Cardano Foundation

## Why this exists

Cardano launched with more than **5.18 billion ADA** allocated to the three founding entities. That allocation matters because it shaped the economic and governance reality of the network from day one.

For years, the community has asked for more transparency around founder-era funds and their downstream movement. We did not get enough answers. So this repository takes the only path still available to the public: **use open blockchain data, disciplined tracing, and reproducible evidence to document what can be proven, what can be strongly inferred, and what still remains unknown**.

This work is not driven by accusation. It is driven by accountability.

When billions of dollars’ worth of founder-linked ADA may have entered, shaped, or exited the ecosystem over time, the community deserves more than hand-waving. It deserves receipts, structure, and honesty about what can and cannot be known from the chain alone.

---

**Latest bounded-phase status update:** see `STATUS_NOTE_2026-03-11.md`.

## Quality gate status (recorded)

- Mandatory gates (#1, #2): **PASS / PASS**
- Overall gates: **8/8 PASS** *(recorded at commit `de22d95` / tag `v2-candidate-audit-fixes`)*
- Recorded result file: `GATE_RESULTS.md`
- Gate definitions/checklist: `QUALITY_GATES.md`

---

## Operating control rule (claim discipline)

No new public-facing claim may be added unless:

1. a corresponding row exists in `receipts_pack.csv`, and
2. a corresponding row exists in `CLAIMS_TO_RECEIPTS_MAP.md`

—or the statement is explicitly classified as **UNKNOWN** with no implied proof.

This rule exists to prevent narrative drift, overclaiming, and “trust me” reporting.

---

## 1) Scope and non-accusation statement

This bundle is a **best-effort, evidence-first tracing checkpoint** focused on founder-linked genesis ADA flows.

It is **not** a legal allegation, prosecutorial filing, or final forensic audit. It is a structured public research artifact designed to separate:

- what is directly observable,
- what is strongly suggested,
- and what remains unresolved.

No “final destination” claims are made here. All destinations referenced in this bundle are **current observed trace points** unless they are shown to be unspent with no downstream movement.

---

## 2) Methodology and evidence grading

### Data sources used in this phase

- Cardano `db-sync` receipts from relay-side tracing
- founder seed registry in `confirmed_seeds_founders.csv`
- bounded Shelley-window exports from traced founder-linked graphs
- relay-side payment/stake label joins against indexed label tables
- external source validation where applicable

### Evidence grading standard

- **FACT** — directly supported by on-chain or `db-sync` receipts
- **STRONG INFERENCE** — highly supported structural or behavioral signal, but not direct proof
- **UNKNOWN** — unresolved, unlabeled, or not yet responsibly attributable

### Execution constraints in this phase

- founder-first tracing only: `IOG`, `EMURGO`, `CF`
- idempotent edge insertion with dedupe guards
- persistent root attribution via `address_root`
- bounded tracing windows and bounded review tasks
- high-value-first expansion, with lower-value edges deferred for later review

This project is intentionally conservative. When evidence is incomplete, we say so.

---

## 3) Headline findings (current)

## FACT

### 1. IOG → Binance confirmed CEX deposits  
**Epoch 27 / 2018-02-06 — total 7,921,587 ADA**

Two founder-linked IOG transactions were traced to a Binance-labeled Byron payment address:

- tx `893a195a124cb10a33105974e47b10402dd39ee4791579e18577578eb6f84f25`  
  **5,878,892 ADA**
- tx `753ff5403e23c15abba5a6aa6597b078e1fffedd4a80e769b199c918e8bbde81`  
  **2,042,695 ADA**

**Why this matters:** this is not a vague clustering claim. It is a direct payment-address match backed by receipts, source validation, and explorer-linked evidence.

---

### 2. IOG Shelley ingress confirmed at epoch 208

- tx `f3e68848e3099b7b4d2e199354dce21a596d256d25af1bb21c80ca958b1cb1d2`

**Why this matters:** this establishes a directly evidenced founder-linked transition into the Shelley era.

---

### 3. EMURGO Shelley ingress confirmed at epoch 208

- tx `48695c1092d0e465a3d32ee9fb5b799c8d93a725e76a45badf01af7a2446389e`

Bounded Shelley-window result:
- rows: **24**
- payment label hits: **0**
- stake label hits: **0**

**Why this matters:** EMURGO is no longer only a speculative or inferred branch. A bounded Shelley ingress is now directly confirmed. At the same time, that bounded window remains externally unresolved.

---

### 3. EMURGO full genesis-to-Shelley bridge confirmed at epoch 210

Complete chain of custody: AVVM redemption → consolidation via single funnel address → 47+ hop Byron peeling chain → Ae2td transition → Shelley bridge at epoch 210 → delegation to EMUR2 pool at epoch 212.

- Bridge tx: `425104ce88b5b4653a1f49e93a696056ee6e60531fbf95f4f81c9ca46ac048a9`
- Shelley outputs: 486,873,323.034918 ADA + 150,000,000 ADA
- EMUR2 pool: `pool1qs6h0y7czzt605kptmrv6cr85kxd6tajr2hs0etvxphv7tr7nqu`
- Pool relay: `relays.pools.emurgo.io`
- Pool metadata: `https://pools.emurgo.io/EMUR2.json`

**Why this matters:** EMURGO genesis ADA is no longer an unresolved tracing lane. The chain from genesis to confirmed EMURGO pool infrastructure is fully documented with on-chain receipts.

---

### 4. Second genesis key (781M ADA) confirmed under EMURGO custody

- Genesis TX: `5ec95a53fa3bb7dc56864bb6e75f369f00aa20e8d8cdc3b66b2fb88ec1b225ef`
- Merged into EMURGO consolidation at epoch 4
- Peak EMURGO consolidation: 2,855,547,137 ADA (781M above publicly attributed allocation)

**Why this matters:** EMURGO controlled more genesis ADA than publicly attributed. The second key's AVVM identity is not yet known.

---
## STRONG INFERENCE

### 1. EMURGO branch reached exchange-class Byron infrastructure

- tx `caa4f573f1f2c1cd98c51f2bad2c8ef8f69a69689e03ee3e48467e173836b9bf`
- amount: **14,099.8 ADA**
- behavioral profile: **2,521 tx / 1,489 counterparties / 26.5M ADA throughput**

This address behaves like exchange-class infrastructure, but the specific exchange identity is **not** confirmed in this bundle.

**Why this matters:** it suggests external-routing behavior, but does not justify naming a specific exchange or inferring beneficial ownership.

---

## UNKNOWN

These are not omissions. They are the current documented limits of public on-chain attribution.

1. **Purpose of the IOG Binance deposits**  
   The chain can show deposit activity. It cannot prove whether those deposits were for sale, listing support, treasury operations, custody, vendor settlement, or another purpose.

2. **Beneficial ownership after exchange ingress**  
   Once founder-linked ADA enters exchange infrastructure, public UTxO-level identity is no longer enough to assign beneficial ownership.

3. **CF main treasury-scale bridge path remains unresolved**  
   No confirmed CF Shelley ingress has been established in the current bounded pass.

4. **EMURGO main treasury-scale bridge remains unresolved beyond bounded ingress confirmation**  
   A bounded Emurgo ingress is confirmed, but the larger treasury-scale path still has not been fully resolved.

5. **Large unlabeled portions of founder-linked flows remain unresolved**  
   This is the core accountability gap the project is trying to reduce.

---

## 4) Confirmed founder seed receipts

The founder seed registry included in this bundle:

- `confirmed_seeds_founders.csv`

This file contains **3 founder roots marked `CONFIRMED`**, including candidate seed transaction hash, block, epoch, and timestamp fields derived from `db-sync` receipts.

This is the starting point for all downstream tracing in the bundle.

---

## 5) IOG Shelley-window evidence

Included evidence files:

- `iog_shelley_window_208_230.csv`
- `iog_208_230_summary.json`
- `iog_208_230_top20_stake_credentials.csv`
- `iog_208_230_top20_dest_addresses.csv`

### IOG bounded Shelley-window snapshot (epochs 208–230)

- Rows: **8,593**
- Unique stake credentials: **4,481**
- Unique destination addresses: **5,372**

**Interpretation:** this is not a trivial or isolated founder-linked branch. It is a large structured migration/distribution surface. It is evidence of scale, not proof of final downstream ownership.

---

## 6) Current founder status (bounded pass)

### IOG
- Shelley ingress confirmed
- direct Binance deposit receipts confirmed
- strongest public evidence branch in the current bundle

### EMURGO
- Shelley bridge **confirmed at epoch 210** (FACT)
- Full chain of custody documented from AVVM redemption to EMUR2 pool delegation
- 150M branch confirmed delegated to EMUR2 pool (`relays.pools.emurgo.io`)
- Second genesis key (781M ADA) confirmed merged into EMURGO custody at epoch 4
- Byron-era peeling chain structure fully mapped (47+ hops, ~2.2B distributed)
- 487M Shelley branch distributed through 4 intermediary stakes; final pool delegation for this branch not yet confirmed
- EMUR2 pool retired at epoch 513

### Cardano Foundation (CF)
- no confirmed Shelley ingress observed yet in the current bounded pass
- remains the most important unresolved founder branch

This section is a **tracing-boundary status statement**, not a claim of inactivity.

---

## 7) What this bundle does — and does not — answer

### What this bundle does answer
- which founder-linked flows can be directly evidenced on-chain
- whether certain founder-linked branches reached exchanges or Shelley-era structures
- how much of the current surface is structured vs unresolved
- where public attribution stops being responsible

### What this bundle does **not** answer
- where every founder-linked ADA ultimately ended up
- who ultimately benefited from every downstream flow
- what any given exchange deposit was “for”
- whether every unresolved flow was benign, harmful, sold, held, or redistributed

Those unanswered questions are exactly why transparency still matters.

---

## 8) Included files (evidence + governance controls)

### Core evidence
- `receipts_pack.csv`
- `confirmed_seeds_founders.csv`
- `label_hits_external_deduped.csv`
- `label_hits_summary_deduped.csv`
- `external_hits_source_validation.csv`

### IOG evidence
- `iog_shelley_window_208_230.csv`
- `iog_208_230_summary.json`
- `iog_208_230_top20_stake_credentials.csv`
- `iog_208_230_top20_dest_addresses.csv`

### EMURGO evidence
- `emurgo_hop5_summary.json`
- `emurgo_shelley_window_208_230.csv`
- `emurgo_label_summary.json`

### CF / shared attribution support
- `probable_byron_exchanges.csv`
- `cf_emurgo_probable_exchange_intersections.csv`
- `cf_emurgo_probable_exchange_intersections_summary.json`

### Governance / audit controls
- `CHANGELOG.md`
- `QUALITY_GATES.md`
- `GATE_RESULTS.md`
- `CLAIMS_TO_RECEIPTS_MAP.md`
- `SNAPSHOT.md`

---

## 9) Limits

- label coverage remains incomplete and may miss valid real-world entities
- absence of label intersections is **not** absence of activity
- additional downstream movement may exist beyond current bounded windows
- exchange ingress is often a visibility wall, not a visibility solution
- custodian or infrastructure labels do **not** automatically prove beneficial ownership
- complete founder-flow attribution may not be achievable from public chain data alone without entity cooperation or much larger forensic resources

That last point matters. The public can push this work far, but not infinitely.

---

## 10) What comes next

### Near-term technical next steps
1. Continue bounded CF strategy review and branch-selection work
2. Expand and reconcile high-confidence external label sources
3. Re-run payment + stake joins on newly materialized windows
4. Promote additional confirmed intersections into `receipts_pack.csv` only when receipt-backed
5. Continue Emurgo source-acquisition and label-gap closure work

### Governance and accountability next steps
1. turn unresolved founder opacity itself into a documented governance finding
2. use this bundle to support stronger public calls for voluntary disclosure
3. demonstrate, with receipts, which founder branches are transparent and which remain opaque
4. make it harder for “nobody knows” to remain an acceptable answer

---

## Final note

This bundle does **not** claim to have solved the full founder-genesis map.

It does claim something important:

**the community no longer has to choose between blind trust and baseless accusation.**

There is now a third path:
**evidence-first scrutiny.**

That is what this repository is for.

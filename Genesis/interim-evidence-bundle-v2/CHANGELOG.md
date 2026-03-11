# CHANGELOG: v1 → v2

## Phase-status update note (2026-03-11)

- Added `STATUS_NOTE_2026-03-11.md` to document the end-state of the current bounded CF reverse phase.
- Clarified that latest bounded CF work was technically productive but produced **no new receipt-backed attribution lift**.
- Recorded that two bounded CF branch families are now active-paused for bounded reasons.
- Confirmed no new `receipts_pack.csv` row and no new claim-map row were added in this update.

## Post-snapshot reconciliation note (2026-03-09)

- Completed a bounded EMURGO validation pass using new metadata-mirror and label-research sources.
- Result: **no new receipt-backed attribution lift** and **no new `receipts_pack.csv` rows**.
- Decision: EMURGO lane set to **pause / stop-and-review** until new provenance-strong evidence appears.
- Public bundle implication: no new evidence artifacts promoted; status clarity only.

## What changed since Interim Evidence Bundle v1

### New confirmed receipts (FACT grade)

**IOG → Binance: 7,921,587 ADA confirmed deposited to exchange**
- Two transactions on February 6, 2018 (epoch 27), 25 minutes apart
- TX1: `893a195a...` → 5,878,892 ADA to Binance Byron hot wallet #2
- TX2: `753ff540...` → 2,042,695 ADA to same address
- Evidence chain: IOG AVVM redemption → hop-1 → hop-2/3 splits → hop-4 Binance deposit
- Label source: community-verified address registry (forum.cardano.org)
- This is the first FACT-grade founder-to-exchange receipt in this investigation

- **EMURGO Shelley ingress confirmed (FACT):**
  - tx `48695c1092d0e465a3d32ee9fb5b799c8d93a725e76a45badf01af7a2446389e`
  - first observed Shelley ingress at epoch 208 in bounded hop-5 recovery pass
  - initial bounded Shelley window (epochs 208–230): 24 rows, 0 payment/stake label hits

### Expanded trace coverage

- IOG traced edges expanded from 8,593 (epochs 208–230) to ~1.1 million edges
- IOG Shelley window now spans epochs 208–490
- IOG self-circulation detected: 5,177 hits totaling 3.04B ADA through IOG-traced stake credentials (staking reward compounding + treasury consolidation)
- Label join now operational on relay db-sync with 356 indexed labels

### New STRONG INFERENCE findings

- EMURGO genesis-traced ADA (14,099.8 ADA, epoch 38) reached a behaviorally confirmed exchange-class Byron address
  - 2,521 txs / 1,489 counterparties / 26.5M ADA throughput
  - Probable Bittrex or Binance (based on temporal window)
  - Cannot upgrade to FACT without external address verification

### CF / Emurgo bridge status

- **CF:** Shelley ingress not yet confirmed in bounded forward pass. Reverse tracing from known CF pool stake credentials is active. CF treasury split pattern identified at epoch 55 (6+ branches). Forward trace following wrong branch after split point — corrective expansion underway.
- **EMURGO:** Shelley ingress is now confirmed in bounded evidence (`48695c10...` at epoch 208), but the **main treasury-scale bridge path remains unresolved**. Reverse tracing from SWIM/YOROI pool credentials is active; deep Byron-branch behavior remains bounded and unresolved.
- **Important:** These are tracing boundary statements, not claims about entity inactivity.

### Infrastructure improvements

- Staged Byron exchange heuristic query (materialized, index-friendly) deployed and executed
- 1,542 probable Byron-era exchange addresses identified by behavioral analysis
- Known false positives file created (8 patterns: script addresses, enterprise addresses, custodian-vs-owner distinction, etc.)
- Reverse trace SQL templates created for db-sync direct querying (bypassing Koios input-visibility gap)

### What is NOT in v2

- No CF or Emurgo confirmed Shelley ingress receipts (still in progress)
- No expanded external hit surface beyond Binance (label coverage remains thin vs graph scale)
- No "final destination" claims for any entity
- No beneficial ownership assertions for exchange deposits

---

## For DReps: What this means in plain language

**What we now know (with receipts):**

At genesis in September 2017, three founding entities received 5.185 billion ADA. We've traced IOG's 2.46 billion ADA through 4 hops on-chain and confirmed that at least 7.9 million ADA was deposited into a Binance exchange wallet on February 6, 2018 — four months after launch, during the crypto bull market peak.

IOG then distributed approximately 1.27 billion ADA to over 5,000 unique addresses during the first months of the Shelley era (July–October 2020). The distribution pattern is structured and consistent with operational treasury management (salary-scale payments, no dust). The top recipients have since moved 98%+ of received ADA onward.

Prior analyses indicate substantial Cardano Foundation-identifiable holdings in CF pool infrastructure, but this v2 snapshot does not yet include a newly confirmed CF Byron→Shelley bridge receipt.

**What we still don't know:**

- Where the remaining ~2.4 billion IOG ADA ended up after leaving their transit accounts
- The full Byron-to-Shelley path for CF and Emurgo genesis ADA (tracing is active)
- The specific purpose of the Binance deposits (selling, listing fees, vendor payments, or treasury management)
- The identity of 9 unidentified genesis addresses holding 1.9 billion ADA combined

**What we're asking for:**

Voluntary address disclosure from all three founding entities would resolve these questions faster than on-chain forensics. The CF has demonstrated this is possible. IOG and Emurgo have not provided equivalent transparency.

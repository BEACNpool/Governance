# CHANGELOG: v1 → v2 → v3

## V3 findings (2026-03-14)

### EMURGO full genesis-to-Shelley bridge confirmed (FACT)

- Complete chain of custody documented: AVVM redemption → consolidation funnel → 47+ hop Byron peeling chain → Shelley bridge at epoch 210
- Bridge TX `425104ce88b5b4653a1f49e93a696056ee6e60531fbf95f4f81c9ca46ac048a9` produced two Shelley outputs: 486.9M ADA and 150M ADA
- 150M branch delegated to EMUR2 pool (pool1qs6h0y7czzt605kptmrv6cr85kxd6tajr2hs0etvxphv7tr7nqu) at epoch 212
- EMUR2 pool confirmed as EMURGO infrastructure: relay DNS `relays.pools.emurgo.io`, metadata at `https://pools.emurgo.io/EMUR2.json`
- Pool owner: `stake1uym7pcjwzldgwjxek8a88vm9jdvc70yayc6jm7nkan9t2wgayexh2`
- EMUR2 retired at epoch 513, 15,081 blocks produced

### Second genesis key confirmed (FACT)

- 781,381,495 ADA from genesis TX `5ec95a53fa3bb7dc56864bb6e75f369f00aa20e8d8cdc3b66b2fb88ec1b225ef` merged into EMURGO consolidation funnel at epoch 4
- EMURGO peak consolidation: 2,855,547,137 ADA (781M above publicly attributed allocation)
- AVVM key identity for the second genesis key remains UNKNOWN

### Methodology breakthrough: consolidation funnel identification

- Key insight: a 100 ADA marker payment at hop 1 identified the EMURGO consolidation address
- ALL EMURGO genesis ADA flows through this single address (`DdzFFzCqrhsu3iF6...`)
- This bypasses the Byron HD-wallet fan-out problem entirely
- The peeling chain structure (2 outputs per hop, structured amounts) is fully documented

### Infrastructure improvements

- Label enrichment: 356 → 8,439 labels (6,917 pool reward + 1,522 pool owner)
- Phase 1A: 68 unique CF/EMURGO stake addresses identified from pool registrations
- Phase 1B: 252 unique Shelley landing-point transactions identified

### Status changes

- EMURGO lane: UNKNOWN → **FACT** (full genesis-to-pool receipt chain)
- Second genesis key: UNKNOWN → **FACT** (traced to epoch 0, EMURGO-controlled)
- CF lane: remains UNKNOWN (active-paused, no change this session)
- IOG lane: no change (strongest branch, already FACT for Binance deposits + Shelley ingress)

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
- **EMURGO:** Main treasury-scale Byron→Shelley bridge **confirmed at epoch 210** in v3 (tx `425104ce88b5b4653a1f49e93a696056ee6e60531fbf95f4f81c9ca46ac048a9`). Full chain of custody documented from AVVM genesis to EMUR2 pool delegation. See `V3_EMURGO_BRIDGE_RECEIPT.md`. The earlier bounded hop-5 Shelley ingress (`48695c10...` at epoch 208, 19,843 ADA) remains valid as a separate probe finding but is superseded by the full treasury-scale bridge. Second genesis key (781M ADA, tx `5ec95a53...`) confirmed merged into EMURGO consolidation at epoch 4.
- **Important:** These are tracing boundary statements, not claims about entity inactivity.

### Infrastructure improvements

- Staged Byron exchange heuristic query (materialized, index-friendly) deployed and executed
- 1,542 probable Byron-era exchange addresses identified by behavioral analysis
- Known false positives file created (8 patterns: script addresses, enterprise addresses, custodian-vs-owner distinction, etc.)
- Reverse trace SQL templates created for db-sync direct querying (bypassing Koios input-visibility gap)

### What is NOT in v2

- No CF confirmed Shelley ingress receipts (still in progress)
- EMURGO Shelley bridge is now confirmed in v3 (see above)
- No expanded external hit surface beyond Binance (label coverage remains thin vs graph scale)
- No "final destination" claims for any entity
- No beneficial ownership assertions for exchange deposits

---

## For DReps: What this means in plain language

**What we now know (with receipts):**

At genesis in September 2017, three founding entities received 5.185 billion ADA. We've traced IOG's 2.46 billion ADA through 4 hops on-chain and confirmed that at least 7.9 million ADA was deposited into a Binance exchange wallet on February 6, 2018 — four months after launch, during the crypto bull market peak.

IOG then distributed approximately 1.27 billion ADA to over 5,000 unique addresses during the first months of the Shelley era (July–October 2020). The distribution pattern is structured and consistent with operational treasury management (salary-scale payments, no dust). The top recipients have since moved 98%+ of received ADA onward.

Prior analyses indicate substantial Cardano Foundation-identifiable holdings in CF pool infrastructure, but this v2 snapshot does not yet include a newly confirmed CF Byron→Shelley bridge receipt.

**EMURGO (v3 finding, 2026-03-14):** We traced EMURGO's 2.074 billion ADA genesis allocation through a complete chain of custody — from the AVVM redemption through a consolidation funnel, a 47+ hop Byron peeling chain, an Ae2td-era transition, and finally a Byron→Shelley bridge at epoch 210 (August 2020). At the bridge, 150 million ADA was sent to an address that delegated to the EMUR2 pool — confirmed as EMURGO infrastructure via relay DNS (`relays.pools.emurgo.io`) and metadata URL (`pools.emurgo.io/EMUR2.json`). We also confirmed that a second genesis key holding 781 million ADA merged into EMURGO's consolidation funnel at epoch 4, meaning EMURGO controlled at least 2.856 billion ADA at peak — 781M more than publicly attributed.


**What we still don't know:**

- Where the remaining ~2.4 billion IOG ADA ended up after leaving their transit accounts
- The full Byron-to-Shelley path for CF genesis ADA (tracing is active; EMURGO is now resolved)
- The specific purpose of the Binance deposits (selling, listing fees, vendor payments, or treasury management)
- The identity of remaining unidentified genesis addresses (one 781M key is now confirmed under EMURGO control; others still unattributed)

**What we're asking for:**

Voluntary address disclosure from all three founding entities would resolve these questions faster than on-chain forensics. The CF has demonstrated this is possible. IOG and Emurgo have not provided equivalent transparency.

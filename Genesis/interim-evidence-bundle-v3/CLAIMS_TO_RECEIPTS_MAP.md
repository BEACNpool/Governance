# Claims to Receipts Map

| Claim text | Evidence class | Backing file | Tx hash / row reference | Verdict |
|---|---|---|---|---|
| IOG Shelley ingress confirmed at epoch 208 | FACT | `receipts_pack.csv` | `receipt_type=FIRST_SHELLEY_INGRESS`, tx `f3e68848e3099b7b4d2e199354dce21a596d256d25af1bb21c80ca958b1cb1d2` | VERIFIED |
| IOG -> Binance confirmed CEX deposits totaling 7,921,587 ADA (2 tx) | FACT | `receipts_pack.csv`, `external_hits_source_validation.csv` | tx `893a195a124cb10a33105974e47b10402dd39ee4791579e18577578eb6f84f25`; tx `753ff5403e23c15abba5a6aa6597b078e1fffedd4a80e769b199c918e8bbde81` | VERIFIED |
| EMURGO branch reached exchange-class Byron infrastructure | STRONG INFERENCE | `receipts_pack.csv`, `external_hits_source_validation.csv` | `receipt_type=PROBABLE_BYRON_EXCHANGE_INTERSECTION`, tx `caa4f573f1f2c1cd98c51f2bad2c8ef8f69a69689e03ee3e48467e173836b9bf` | VERIFIED |
| Founder seed confirmation for IOG/CF/EMURGO | FACT | `confirmed_seeds_founders.csv` | 3 rows with `validation_status=CONFIRMED` | VERIFIED |
| CF ingress-negative in current bounded pass (EMURGO resolved in v3) | UNKNOWN / bounded status | `README.md` section 6 | Bounded-pass status statement only (no inactivity claim) | VERIFIED (bounded claim) |
| IOG 208-230 structured window stats (8,593 / 4,481 / 5,372) | FACT (dataset-level) | `iog_208_230_summary.json` | keys: `iog_208_230_rows`, `unique_stake_credentials`, `unique_dest_addresses` | VERIFIED |
| EMURGO Shelley ingress confirmed at epoch 208 (bounded hop-5 recovery pass) | FACT | `receipts_pack.csv`, `emurgo_hop5_summary.json` | `receipt_type=FIRST_SHELLEY_INGRESS`, tx `48695c1092d0e465a3d32ee9fb5b799c8d93a725e76a45badf01af7a2446389e`; summary `shelley_edges=24, first_shelley_epoch=208` | VERIFIED |
| EMURGO full genesis-to-Shelley bridge at epoch 210 | FACT | `receipts_pack.csv`, `V3_EMURGO_BRIDGE_RECEIPT.md` | TX chain: `242608fc...` → `7eb47f8f...` → `743fd051...` → `c8596b9c...` → `71a35dc3...` → [47+ peeling hops] → bridge tx `425104ce88b5b4653a1f49e93a696056ee6e60531fbf95f4f81c9ca46ac048a9` → delegation to pool1qs6h0y7czzt605kptmrv6cr85kxd6tajr2hs0etvxphv7tr7nqu (EMUR2) | VERIFIED |
| EMURGO consolidation funnel via DdzFFzCqrhsu3iF6... | FACT | `receipts_pack.csv`, `V3_EMURGO_BRIDGE_RECEIPT.md` | TX `71a35dc3...` consumes 3 funnel UTxOs totaling 2,855,547,137.48 ADA | VERIFIED |
| Second genesis key (781M ADA) traced to epoch 0 | FACT | `receipts_pack.csv`, `V3_EMURGO_BRIDGE_RECEIPT.md` | Genesis tx `5ec95a53...` → spend tx `c8596b9c...` → merged into EMURGO consolidation at epoch 4 | VERIFIED |
| 150M EMURGO branch delegated to EMUR2 pool | FACT | `receipts_pack.csv`, `V3_EMURGO_BRIDGE_RECEIPT.md` | stake `stake1u9q4556wduzu49c62ruj68tmvruhetk8pc0ruddepjd6h8qyuf8sp` delegated at epoch 212 to pool1qs6h0y7czzt605kptmrv6cr85kxd6tajr2hs0etvxphv7tr7nqu; metadata `https://pools.emurgo.io/EMUR2.json`; relay `relays.pools.emurgo.io` | VERIFIED |

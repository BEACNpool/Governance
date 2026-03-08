# Claims to Receipts Map

| Claim text | Evidence class | Backing file | Tx hash / row reference | Verdict |
|---|---|---|---|---|
| IOG Shelley ingress confirmed at epoch 208 | FACT | `receipts_pack.csv` | `receipt_type=FIRST_SHELLEY_INGRESS`, tx `f3e68848e3099b7b4d2e199354dce21a596d256d25af1bb21c80ca958b1cb1d2` | VERIFIED |
| IOG -> Binance confirmed CEX deposits totaling 7,921,587 ADA (2 tx) | FACT | `receipts_pack.csv`, `external_hits_source_validation.csv` | tx `893a195a124cb10a33105974e47b10402dd39ee4791579e18577578eb6f84f25`; tx `753ff5403e23c15abba5a6aa6597b078e1fffedd4a80e769b199c918e8bbde81` | VERIFIED |
| EMURGO branch reached exchange-class Byron infrastructure | STRONG INFERENCE | `receipts_pack.csv`, `external_hits_source_validation.csv` | `receipt_type=PROBABLE_BYRON_EXCHANGE_INTERSECTION`, tx `caa4f573f1f2c1cd98c51f2bad2c8ef8f69a69689e03ee3e48467e173836b9bf` | VERIFIED |
| Founder seed confirmation for IOG/CF/EMURGO | FACT | `confirmed_seeds_founders.csv` | 3 rows with `validation_status=CONFIRMED` | VERIFIED |
| CF/EMURGO ingress-negative in current bounded pass | UNKNOWN / bounded status | `README.md` section 6 | Bounded-pass status statement only (no inactivity claim) | VERIFIED (bounded claim) |
| IOG 208-230 structured window stats (8,593 / 4,481 / 5,372) | FACT (dataset-level) | `iog_208_230_summary.json` | keys: `iog_208_230_rows`, `unique_stake_credentials`, `unique_dest_addresses` | VERIFIED |

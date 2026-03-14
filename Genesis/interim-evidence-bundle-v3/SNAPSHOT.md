# Snapshot Metadata

- Snapshot label: `interim-evidence-bundle-v3`
- Snapshot reference tag: `v2-emurgo-ingress-freeze` (see repo tags)
- Snapshot commit: `e792d39`
- Snapshot created: 2026-03-08 (America/Chicago)

## Headline findings frozen in this snapshot
- FACT: IOG Shelley ingress at epoch 208.
- FACT: IOG -> Binance confirmed CEX deposits totaling 7,921,587 ADA (2 txs, epoch 27).
- STRONG INFERENCE: EMURGO branch intersects exchange-class Byron infrastructure.
- UNKNOWN: CF bridge unresolved in current bounded forward pass (EMURGO resolved in v3); no final-destination claims.

## Canonical evidence register
- `receipts_pack.csv`

## Notes
This snapshot is intended as a stable review point for governance readers before additional tracing updates alter counts.

## V3 supplement (2026-03-14)

- FACT: EMURGO full genesis-to-Shelley bridge confirmed at epoch 210 (tx `425104ce88b5b4653a1f49e93a696056ee6e60531fbf95f4f81c9ca46ac048a9`)
- FACT: Second genesis key (781M ADA) traced to epoch 0, merged into EMURGO custody
- FACT: 150M EMURGO branch delegated to EMUR2 pool (`relays.pools.emurgo.io`) at epoch 212
- Infrastructure: label count expanded from 356 to 8,439

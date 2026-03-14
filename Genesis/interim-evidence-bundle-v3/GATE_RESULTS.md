# Quality Gate Results (Recorded)

Recorded: 2026-03-08
Scope: `Genesis/interim-evidence-bundle-v3/`

## Mandatory gates
- Gate 1 (receipts evidence-graded with caveats): **PASS**
- Gate 2 (README headline claims map to receipts): **PASS**

## Full gate score
- Gate 1: PASS
- Gate 2: PASS
- Gate 3: PASS
- Gate 4: PASS
- Gate 5: PASS
- Gate 6: PASS
- Gate 7: PASS
- Gate 8: PASS

**Overall:** 8/8 PASS

## Evidence pointers
- Canonical register: `receipts_pack.csv`
- Claim mapping: `CLAIMS_TO_RECEIPTS_MAP.md`
- External adjudication: `external_hits_source_validation.csv`
- Deduped exports: `label_hits_external_deduped.csv`, `label_hits_summary_deduped.csv`
- Change log: `CHANGELOG.md`


## V3 gate check (2026-03-14)
- New receipts added to `receipts_pack.csv`: 4 rows (CONSOLIDATION_FUNNEL, SHELLEY_BRIDGE, CONFIRMED_POOL_DELEGATION, SECOND_GENESIS_KEY)
- New claims added to `CLAIMS_TO_RECEIPTS_MAP.md`: 4 rows
- All new claims have corresponding receipt rows: PASS
- `V3_EMURGO_BRIDGE_RECEIPT.md` headline claims map to receipts: PASS

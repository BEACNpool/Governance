# Verifying snapshots (quick guide)

This repo is designed so anyone can independently verify claims.

## Minimal verification

1) Pick a snapshot date:
- `data/latest.json` (current)
- or a specific folder in `data/snapshots/YYYY-MM-DD/`

2) Inspect the raw source datasets:
- `gov-actions/proposals.json`
- `intersect-grants/waste_radar.json`

3) Confirm receipts:
- Governance actions should link to GovTool/anchors.
- Grants should link to the official program page.

## Derived views

Derived views in `warehouse/` are recomputable from the source datasets.
If you disagree with a derived view, open an issue with:
- snapshot date
- the row(s)
- the corrected computation

## Notes

- Flags indicate missing/weak public receipts, not proof of fraud.

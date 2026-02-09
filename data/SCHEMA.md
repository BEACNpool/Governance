# Data schema (human overview)

This repo publishes **snapshots** (immutable datasets) plus **reports** (human-readable analysis).

## Snapshot pointer

- `data/latest.json` → points to the current snapshot folder.

## Snapshot folders

`data/snapshots/YYYY-MM-DD/`

### `gov-actions/`
- `proposals.json` — governance actions (CIP-1694) with anchors, vote tallies, flags, and (for TreasuryWithdrawals) the withdrawal recipient map.
- `poll_log.json` — ingestion log.

### `intersect-grants/`
- `waste_radar.json` — registry pages (cohorts) + evidence flags + link inventory.

### `warehouse/` (derived)
- `unified_funding_index.json` — flat index combining funding mechanisms currently indexed.
- `recipient_entity_leaderboard.json` — aggregated view of recipients/entities by ADA.

## Reports

Reports are generated on demand and link back to snapshot files.

- `reports/methodology-doge.html` — methodology + disclaimers.
- `reports/waste-deep-dive-YYYY-MM-DD.html` — flagged items with reasons.

## Notes

- This is evidence-first. A flag means missing receipts, not proof of fraud.
- If you find a wrong entry, open an issue/PR pointing to the receipt.

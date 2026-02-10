# 📐 Data Schema (Human Overview)

This repo publishes **snapshots** (immutable datasets) plus **reports** (human-readable analysis).

## Snapshot Pointer

```json
// data/latest.json
{
  "snapshot": "2026-02-09",
  "path": "data/snapshots/2026-02-09/"
}
```

## Snapshot Structure

```
data/snapshots/YYYY-MM-DD/
├── gov-actions/
│   ├── proposals.json          # CIP-1694 governance actions
│   └── poll_log.json           # Ingestion log
├── intersect-grants/
│   └── waste_radar.json        # Grant pages + evidence flags
└── warehouse/                  # Derived (recomputable)
    ├── unified_funding_index.json
    └── recipient_entity_leaderboard.json
```

## Key Schemas

### `gov-actions/proposals.json`

Each proposal contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique proposal ID |
| `tx_hash` | string | Transaction hash |
| `cert_index` | int | Certificate index |
| `type` | string | Action type (TreasuryWithdrawals, ParameterChange, InfoAction, etc.) |
| `status` | string | Current status (active, ratified, expired, enacted) |
| `anchor_url` | string | Metadata anchor URL |
| `anchor_hash` | string | Expected content hash |
| `metadata_title` | string | Proposal title from metadata |
| `metadata_abstract` | string | Proposal abstract |
| `metadata_motivation` | string | Proposal motivation |
| `metadata_references` | string | JSON array of reference links |
| `metadata_resolved` | int | 1 if metadata was successfully resolved |
| `metadata_hash_valid` | int | 1 if content hash matches on-chain |
| `treasury_amount_lovelace` | int | Total withdrawal amount (lovelace) |
| `treasury_recipients` | string | JSON array of `{stake_address, amount}` |
| `param_changes` | string | JSON of parameter changes (if applicable) |

### `intersect-grants/waste_radar.json`

```json
{
  "generated_at": "2026-02-09T...",
  "items": [
    {
      "title": "Project Name",
      "url": "https://intersect.gitbook.io/...",
      "cohort": "3",
      "grant_value": "50000",
      "last_updated": "2 months ago",
      "flags": ["NO_DELIVERABLE_LINKS", "NO_REPORTING_LINKS"],
      "external_links": ["https://..."],
      "deliverable_links": [],
      "reporting_links": []
    }
  ]
}
```

### `warehouse/unified_funding_index.json`

Flat index combining all funding mechanisms:

| Field | Description |
|-------|-------------|
| `mechanism` | Funding source (CIP1694_TreasuryWithdrawal, IntersectGrant) |
| `round` | Cohort / epoch range |
| `status` | Current status |
| `title` | Item title |
| `entity` | Recipient entity (stake address or org name) |
| `amount_ada` | ADA amount |
| `source_url` | Official page link |
| `evidence_url` | Deliverable/reporting link (if found) |
| `flags` | Evidence flags |

### `warehouse/recipient_entity_leaderboard.json`

Aggregated by recipient:

| Field | Description |
|-------|-------------|
| `entity_key` | `stake:{address}` or `grant:{title}` |
| `amount_ada` | Total ADA across items |
| `items` | Number of funding items |
| `sources` | Array of individual items |

## Dashboard Feed

`data/index.json` powers the main dashboard:

```json
{
  "generated_at": "2026-02-10T00:02:00Z",
  "highlights": ["..."],
  "sections": [
    {
      "title": "Waste Radar",
      "description": "...",
      "items": [
        {
          "title": "Report Name",
          "href": "reports/...",
          "kind": "html",
          "note": "..."
        }
      ]
    }
  ]
}
```

## Flag Codes

| Code | Severity | Meaning |
|------|----------|---------|
| `NO_DELIVERABLE_LINKS` | 🔴 High | No public deliverable links found |
| `NO_REPORTING_LINKS` | 🔴 High | No closeout/proof links found |
| `NO_EXTERNAL_LINKS` | 🟡 Medium | No external links at all |
| `MISSING_GRANT_VALUE` | 🟡 Medium | ADA amount not stated |
| `🟡 NO_DISCUSSION` | 🟡 Medium | No discussion links in governance metadata |
| `🔴 NO_METADATA` | 🔴 High | Anchor metadata unresolvable |
| `🔴 HASH_MISMATCH` | 🔴 Critical | Content hash doesn't match on-chain |

## Notes

- This is evidence-first. A flag means missing receipts, **not proof of fraud**.
- If you find wrong data, open an issue/PR pointing to the correct receipt.
- Snapshots are immutable. Fixes go into new snapshots.

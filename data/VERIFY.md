# 🔬 Verifying Snapshots (Quick Guide)

> This repo is designed so **anyone** can independently verify every claim.

## Minimal Verification (5 minutes)

### Step 1: Pick a snapshot
```
# Current snapshot
cat data/latest.json

# Or browse specific dates
ls data/snapshots/
```

### Step 2: Inspect raw source data

| File | What It Contains |
|------|-----------------|
| `gov-actions/proposals.json` | CIP-1694 governance actions with anchors, votes, flags |
| `intersect-grants/waste_radar.json` | Intersect grant pages + evidence flags + link inventory |

### Step 3: Confirm receipts

**Governance actions** should link to:
- GovTool: `https://gov.tools/governance_actions/{tx_hash}#{cert_index}`
- Anchor URL (IPFS or HTTP)
- On-chain hash (should match anchor content)

**Grants** should link to:
- Official program page (Intersect GitBook)
- Deliverable links (if available)
- Reporting/closeout links (if available)

## Verifying Derived Views

Files in `warehouse/` are **recomputable** from source datasets:

| Derived File | Inputs |
|-------------|--------|
| `unified_funding_index.json` | `gov-actions/proposals.json` + `intersect-grants/waste_radar.json` |
| `recipient_entity_leaderboard.json` | Same as above |

If you disagree with a derived view, open an issue with:
1. Snapshot date
2. The specific row(s)
3. Your corrected computation

## Verifying Reports

Reports in `reports/` are generated from snapshot data by the `tools_generate_*.py` scripts. To reproduce:

```bash
# Example: regenerate waste deep dive
python tools_generate_waste_deep_dive.py

# Example: regenerate grants ledger
python tools_generate_grants_ledger.py
```

## Cross-Check with External Sources

| Source | URL | What to Check |
|--------|-----|---------------|
| GovTool | https://gov.tools/ | Action status, vote tallies |
| CGOV | https://app.cgov.io/ | Action details, metadata |
| Cexplorer | https://cexplorer.io/governance | On-chain data |
| AdaStat | https://adastat.net/governance | Alternative explorer |
| Intersect GitBook | https://intersect.gitbook.io/intersect-community-grants | Grant pages |

## Important Notes

- **Flags indicate missing/weak public receipts**, not proof of fraud
- If you find a wrong entry, open an issue/PR pointing to the receipt
- Snapshots are immutable — if something needs fixing, a new snapshot is published

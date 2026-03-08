# Interim Evidence Bundle v2 — Quality Gates

**Purpose:** No v2 publish until these gates clear. Enforces evidence discipline.

## GO criteria (at least 6/8, with #1 + #2 mandatory)

| # | Gate | Status | Notes |
|---|------|--------|-------|
| 1 | **MANDATORY:** `receipts_pack.csv` has only evidence-graded rows (FACT / STRONG INFERENCE / UNKNOWN) with caveats where needed | ⬜ | Every row must have `evidence_class` and `notes` fields populated |
| 2 | **MANDATORY:** All headline claims in README map to at least one concrete receipt row (tx hash + explorer link) | ⬜ | No narrative claim without a receipt |
| 3 | Founder seed section is complete and consistent (IOG/CF/Emurgo confirmed seeds + timing) | ⬜ | `confirmed_seeds_founders.csv` validated |
| 4 | External-hit section is split clearly into: confirmed direct matches (FACT) and behavioral/heuristic matches (STRONG INFERENCE) | ⬜ | `external_hits_source_validation.csv` is adjudication source; `label_hits_external_deduped.csv` is raw hit export |
| 5 | CF/Emurgo status is explicit and non-overclaimed (ingress/bridge state clearly stated) | ⬜ | Must use "not observed in current bounded pass" language |
| 6 | Label-hit exports are deduped and reproducible (`label_hits_*_deduped.csv` present) | ⬜ | `rows_to_delete = 0` verified |
| 7 | "Unknowns" section is substantive: what is unresolved and why | ⬜ | Minimum 5 specific unknowns with explanation |
| 8 | CHANGELOG from v1→v2 exists and highlights net new receipts/findings | ⬜ | `CHANGELOG.md` present in bundle |

## NO-GO triggers (any one blocks publish)

| Trigger | Why it matters |
|---------|---------------|
| Any claim of "final destination" without unspent/no-downstream proof | Implies funds stopped moving when we just lost the trail |
| Any speculative label presented as confirmed fact | Destroys credibility of the entire bundle |
| Any summary number that can't be reproduced from included CSVs | If a DRep checks our math and it doesn't add up, everything is suspect |
| CF/Emurgo language implies absence instead of "not observed in current bounded pass" | Absence of evidence ≠ evidence of absence. This is the most common overclaim in blockchain forensics |

## Pre-publish checklist (run before git push)

```bash
# 1. Verify receipts_pack has evidence_class on every row
head -1 receipts_pack.csv | grep -q "evidence_class" && echo "OK" || echo "FAIL: missing evidence_class column"
tail -n +2 receipts_pack.csv | while IFS=, read -r line; do
  echo "$line" | grep -qE "(FACT|STRONG INFERENCE|UNKNOWN)" && true || echo "FAIL: ungraded row"
done

# 2. Verify label hits are deduped
wc -l label_hits_external_deduped.csv
sort label_hits_external_deduped.csv | uniq -d | wc -l  # should be 0

# 3. Verify no "final destination" language in README
grep -i "final destination" README.md && echo "FAIL: final destination language found" || echo "OK"

# 4. Verify CF/Emurgo non-overclaim language
grep -i "CF.*no.*activity\|CF.*inactive\|Emurgo.*no.*activity\|Emurgo.*inactive" README.md && echo "FAIL: overclaim language" || echo "OK"

# 5. Verify CHANGELOG exists
test -f CHANGELOG.md && echo "OK" || echo "FAIL: no CHANGELOG"
```

## Sign-off

- [ ] Primary investigator confirms all GO gates pass
- [ ] Quality check confirms no NO-GO triggers
- [ ] README reviewed for tone (evidence-first, non-prosecutorial)
- [ ] Published

# 🔍 BEACN Governance

> **Public money demands public receipts.**

Open-source, receipts-first transparency watchdog for Cardano's treasury.

[![Live Dashboard](https://img.shields.io/badge/Dashboard-Live-22c55e?style=flat-square)](https://beacnpool.github.io/Governance/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Snapshot](https://img.shields.io/badge/Snapshot-2026--02--09-d4a843?style=flat-square)](data/snapshots/2026-02-09/)

---

## What This Is

A **"Cardano DOGE"** — an AI-assisted, community-readable audit tool that indexes treasury spending across multiple Cardano programs and flags where public receipts are missing.

**Read-first (human-friendly):**
- 🔍 [**Waste Deep Dive**](https://beacnpool.github.io/Governance/reports/waste-deep-dive-2026-02-09.html) — flagged items with reasons
- 📒 [**Grants Ledger**](https://beacnpool.github.io/Governance/reports/grants-ledger-2026-02-09.html) — all grants sorted by ADA
- 📖 [**DOGE Methodology**](https://beacnpool.github.io/Governance/reports/methodology-doge.html) — how we audit
- 📣 [**Community Summary**](https://beacnpool.github.io/Governance/reports/community-summary-2026-02-09.html) — plain-language overview

## What This Is NOT

- ❌ Not voting instructions
- ❌ Not an accusation list
- ❌ Not proof of fraud (a flag = missing receipts, not wrongdoing)

## How Data Is Compiled

We keep **separate datasets per source**, then publish **immutable snapshots** so anyone can reproduce or challenge a claim.

| Source | Method | What We Check |
|--------|--------|---------------|
| **On-chain governance (CIP-1694)** | Koios API → normalized JSON | Actions, anchors, votes, withdrawal recipients |
| **Intersect Community Grants** | GitBook sitemap crawl | Deliverable links, reporting links, grant values |
| **Project Catalyst** *(coming)* | Catalyst API (TBD) | Funds, projects, milestones, payment tx hashes |

## Architecture

```
data/
├── latest.json                         # → current snapshot pointer
├── snapshots/
│   └── YYYY-MM-DD/
│       ├── gov-actions/proposals.json  # CIP-1694 governance actions
│       ├── intersect-grants/waste_radar.json
│       └── warehouse/                  # Derived views
│           ├── unified_funding_index.json
│           └── recipient_entity_leaderboard.json
├── index.json                          # Dashboard feed
└── *.json                              # Other data feeds

reports/                                # Human-readable outputs
├── methodology-doge.html               # How we audit
├── waste-deep-dive-YYYY-MM-DD.html     # Flagged items deep dive
├── grants-ledger-YYYY-MM-DD.html       # Grants spend ledger
├── community-summary-YYYY-MM-DD.html   # Plain-language summary
├── daily-briefing-YYYY-MM-DD.html      # Daily governance briefing
└── *.csv / *.md                        # Machine-readable exports

assets/
└── beacn.css                           # Shared design system (v2)

tools_generate_*.py                     # Report generators
index.html                              # Dashboard (GitHub Pages)
```

## What "Flags" Mean

| Flag | Meaning | How to Clear |
|------|---------|-------------|
| `NO_DELIVERABLE_LINKS` | No public output links | Add repo/site/video links |
| `NO_REPORTING_LINKS` | No closeout/proof links | Publish a final report |
| `MISSING_GRANT_VALUE` | ADA amount not stated | State value on the page |
| `🟡 NO_DISCUSSION` | No discussion links in metadata | Add forum link |
| `🔴 NO_METADATA` | Anchor metadata missing | Fix anchor URL |
| `🔴 HASH_MISMATCH` | Hash doesn't match on-chain | Re-publish with correct hash |

> **A flag ≠ scam. A flag = "needs receipts."**

## Reproducibility

Anyone can validate:

1. Clone this repo
2. Load `data/latest.json` → find current snapshot
3. Fetch snapshot JSON files
4. Recompute derived views independently
5. Compare against `warehouse/` outputs

See: [**VERIFY.md**](data/VERIFY.md) · [**SCHEMA.md**](data/SCHEMA.md)

## Contributing

We welcome PRs! See [CONTRIBUTING.md](CONTRIBUTING.md).

Ways to help:
- **Submit receipts** — found a deliverable link we missed? PR or issue it.
- **Challenge a flag** — if an item is wrongly flagged, tell us and link the proof.
- **Add datasets** — Catalyst ingestion is next. Help is welcome.
- **Improve heuristics** — better flag detection, entity normalization.

## Principles

- 🧾 **Receipts-first:** every claim links to primary sources
- 📸 **Immutable snapshots:** discussions anchor to dated data versions
- 🔬 **Flags ≠ fraud:** flags mean missing evidence, not wrongdoing
- 🔓 **Open source:** MIT licensed, fork it, challenge it

## Quick Links

| Resource | Link |
|----------|------|
| Dashboard | [beacnpool.github.io/Governance](https://beacnpool.github.io/Governance/) |
| GitHub | [BEACNpool/Governance](https://github.com/BEACNpool/Governance) |
| Verify Guide | [data/VERIFY.md](data/VERIFY.md) |
| Data Schema | [data/SCHEMA.md](data/SCHEMA.md) |
| GovTool | [gov.tools](https://gov.tools/) |
| Koios Mirror | [koios.beacn.workers.dev](https://koios.beacn.workers.dev/) |
| Intersect Grants | [intersect.gitbook.io](https://intersect.gitbook.io/intersect-community-grants) |

---

*Bootstrapped 2026-02-09 · MIT License*

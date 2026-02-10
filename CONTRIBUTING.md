# Contributing to BEACN Governance

> **Public money demands public receipts.** Help us keep it that way.

## Quick Start

1. Fork this repo
2. Make your changes
3. Open a PR with a clear description

## Ways to Contribute

### 🧾 Submit Missing Receipts (Easiest)
Found a deliverable link we missed? A project page that actually has outputs?

- Open an issue with:
  - The item name / URL
  - The evidence link(s) we missed
  - Why it should clear the flag

Or submit a PR updating the relevant snapshot data.

### 🔬 Challenge a Flag
If an item is wrongly flagged:
- Open an issue titled: `[Flag Challenge] <item name>`
- Include: snapshot date, the row(s), and links to evidence

### 📊 Add a Dataset
Next priorities:
- **Project Catalyst** ingestion (funds / projects / milestones / payments)
- **On-chain payment tracking** (tx hash linking for grants)
- **Entity normalization** (matching grant recipients to on-chain addresses)

### 🛠️ Improve Tools
- Better flag detection heuristics
- Anchor hash verification improvements
- Report generation improvements
- UI/UX improvements to the dashboard

## Code Standards

- **Python:** generators in `tools_generate_*.py`
- **HTML reports:** use `assets/beacn.css` for consistent styling
- **Data:** JSON with clear field names, immutable snapshots in `data/snapshots/YYYY-MM-DD/`
- **Reports:** human-readable HTML first, with CSV/MD exports

## Principles (Non-Negotiable)

1. **Receipts-first** — every claim must link to a primary source
2. **No harassment** — focus on systems and documentation, not individuals
3. **Flags ≠ fraud** — a flag means missing evidence, not wrongdoing
4. **Reproducible** — all data must be verifiable from public sources
5. **Not voting advice** — we publish facts, not recommendations

## Issue Templates

When opening issues, please use:
- `[Flag Challenge]` — to dispute a flag
- `[Missing Receipt]` — to submit evidence we missed
- `[Bug]` — for technical issues
- `[Feature]` — for new capabilities
- `[Dataset]` — for new data source suggestions

## License

By contributing, you agree that your contributions will be licensed under MIT.

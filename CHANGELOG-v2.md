# BEACN Governance v2 — Redesign Changelog

> All changes designed to bring maximum attention to Cardano treasury accountability
> while keeping the receipts-first, open-source ethos.

## Overview

This is a comprehensive redesign of the BEACN Governance project covering:
- **Visual identity** (new design system)
- **Landing page** (complete rebuild)
- **Report templates** (consistent branding)
- **Developer experience** (better docs, CI/CD)
- **Generator tools** (cleaner HTML output)

---

## 🎨 NEW: Design System (`assets/beacn.css`)

**Before:** Each HTML page had its own inline `<style>` block with slightly different styles.

**After:** A shared CSS design system that every report imports via `<link rel="stylesheet" href="../assets/beacn.css" />`.

### Design decisions:
- **Dark mode primary** — conveys audit/surveillance energy; easier on eyes for data-heavy pages
- **Amber/gold accent** — matches ADA brand color; used for amounts and warnings
- **Red for flags** — instantly communicates attention needed
- **Green for cleared/safe** — positive signals
- **JetBrains Mono** for data — monospaced numbers align properly; conveys precision
- **DM Sans** for body text — clean, modern, readable
- **Playfair Display** for headlines — editorial/investigative journalism feel
- **Noise texture overlay** — subtle paper grain that adds physicality
- **Card-based layout** — information hierarchy through depth
- **Sticky navigation** — always know where you are
- **Staggered animations** — content reveals smoothly on load

### CSS variables for consistency:
- `--bg-deep`, `--bg-surface`, `--bg-card`, `--bg-raised` — four depth levels
- `--ada-gold`, `--amber`, `--red`, `--green`, `--blue` — semantic colors
- `--font-display`, `--font-body`, `--font-mono` — three font tiers
- `--radius-sm` through `--radius-xl` — consistent border radii

---

## 🏠 REBUILT: Landing Page (`index.html`)

**Before:** Minimal page with basic cards, loading from `data/index.json`. No branding, no hierarchy, no call to action.

**After:** Full-featured dashboard with:

### Hero section
- Gradient headline: "Public money demands public receipts"
- BEACN description and mission statement
- Live badge with green dot

### Sticky navigation
- Brand link + section anchors
- Scrollspy highlighting (active section tracked via IntersectionObserver)
- Links to GitHub, methodology

### Stats counters
- Treasury actions indexed
- Grant pages crawled
- Waste radar reports generated
- Current snapshot date
- Color-coded cards with top accent bars

### Featured card
- Waste Deep Dive prominently displayed at top
- Red gradient accent, call-to-action button
- "READ FIRST" label

### Section rendering
- Each `index.json` section rendered with header + badge count
- Report cards with hover effects, format pills (HTML/CSV/MD)
- Smooth staggered animations

### Principles strip
- Four pillars: Receipts-First, Immutable Snapshots, Flags ≠ Fraud, Open Source
- Visual icons, concise descriptions

### Footer
- Quick links to all key resources
- MIT license + disclaimers

### Error state
- Graceful fallback when `data/index.json` doesn't exist yet
- Still shows principles and branding

---

## 📖 REBUILT: Methodology Page (`reports/methodology-doge.html`)

**Before:** Inline-styled, basic formatting.

**After:** Uses shared design system with:
- Top bar navigation (back to dashboard, other reports)
- Report header with badge and subtitle
- Warning card (read-first disclaimer)
- **Mission stat grid** — four boxes: Where? Who? What? Proof?
- Data sources as nested info cards
- **Flag reference table** — all flags with meanings and how to clear
- Processing pipeline (numbered steps)
- Reproducibility section with verification links
- "DOGE framing" section with safe/unsafe language examples

---

## 🔍 REBUILT: Waste Deep Dive Generator (`tools_generate_waste_deep_dive.py`)

**Before:** Inline HTML strings with duplicated styles.

**After:** Modular builder functions that output pages using `assets/beacn.css`:
- `build_top_bar()` — consistent navigation
- `build_header()` — report header with badge
- `build_disclaimer()` — warning card
- `build_summary()` — stat grid + flag breakdown tables
- `build_intersect_section()` — flagged grants as styled `.flag-item` cards
- `build_treasury_section()` — flagged actions
- `build_how_to_clear()` — green "ok" card with instructions

### Visual improvements:
- Stat grid for executive summary (flagged count, ADA at risk, etc.)
- Staggered animations on flag items
- External links displayed inline
- Clear visual hierarchy (amount → flags → links)

---

## 📒 REBUILT: Grants Ledger Generator (`tools_generate_grants_ledger.py`)

**Before:** Inline HTML with basic table.

**After:** Uses design system with:
- Stat grid for top-line totals
- Cohort breakdown table with sticky headers
- Full grants table with:
  - Flag pills inline on each row
  - External links displayed per grant
  - Hover state on rows
  - Responsive overflow scrolling
- "How to clear" card at bottom

---

## 📄 IMPROVED: README.md

**Before:** Basic description with directory layout.

**After:** Professional open-source README with:
- Shield badges (live dashboard, license, snapshot date)
- What This Is / What This Is NOT (clear scope)
- Architecture diagram (file tree)
- Data sources table
- Flags reference table
- Quick links table
- Contributing section
- Principles as emoji bullets

---

## 📋 IMPROVED: CONTRIBUTING.md

**Before:** Basic contribution guidelines.

**After:** Structured by contribution type:
- 🧾 Submit Missing Receipts (easiest path)
- 🔬 Challenge a Flag
- 📊 Add a Dataset
- 🛠️ Improve Tools
- Issue template naming conventions
- Code standards section
- Non-negotiable principles

---

## 🔬 IMPROVED: data/VERIFY.md

**Before:** Short verification steps.

**After:** Comprehensive guide with:
- "5 minute" minimal verification
- Step-by-step with code blocks
- Derived view verification table
- Cross-check table with external sources
- Report reproduction commands

---

## 📐 IMPROVED: data/SCHEMA.md

**Before:** Basic field descriptions.

**After:** Full schema documentation with:
- Snapshot pointer format
- Directory tree diagram
- **Field-level tables** for every JSON file
- Sample JSON structures
- Flag codes with severity levels
- Dashboard feed schema

---

## 🆕 NEW: 404.html

Custom 404 page with BEACN branding and the quip:
> "This page doesn't exist — but if it's a missing receipt, that's exactly what we track."

---

## 🆕 NEW: Redirect pages

- `reports/waste-deep-dive-latest.html` → redirects to current dated version
- `reports/grants-ledger-latest.html` → redirects to current dated version
- (community-summary-latest.html already existed)

These allow stable bookmarkable URLs that always point to the most recent report.

---

## 🆕 NEW: GitHub Actions Deployment (`.github/workflows/deploy.yml`)

Automatic deployment to GitHub Pages on every push to `main`.
Uses the new `actions/deploy-pages@v4` flow.

---

## Migration Notes

### For existing data:
- All existing snapshot data, JSON feeds, and CSV/MD reports are **unchanged**
- The new design is purely a presentation layer upgrade
- Python generators now output HTML that references `assets/beacn.css` instead of inline styles

### For the viewer:
- `index.html` still loads from `data/index.json` — no data format changes
- New sections (stats, featured card) are derived from the existing index format
- The page gracefully degrades if `index.json` is missing

### For contributors:
- New reports should `<link rel="stylesheet" href="../assets/beacn.css" />`
- Use the `top-bar`, `report-page`, `report-header`, `card` CSS classes
- Follow the patterns in `methodology-doge.html` as a template

---

## File Summary

| File | Status | Description |
|------|--------|-------------|
| `index.html` | **REBUILT** | Dashboard landing page |
| `assets/beacn.css` | **NEW** | Shared design system |
| `reports/methodology-doge.html` | **REBUILT** | DOGE methodology page |
| `reports/waste-deep-dive-latest.html` | **NEW** | Redirect to latest |
| `reports/grants-ledger-latest.html` | **NEW** | Redirect to latest |
| `tools_generate_waste_deep_dive.py` | **REBUILT** | Uses design system |
| `tools_generate_grants_ledger.py` | **REBUILT** | Uses design system |
| `README.md` | **IMPROVED** | Professional README |
| `CONTRIBUTING.md` | **IMPROVED** | Structured guide |
| `data/VERIFY.md` | **IMPROVED** | Detailed verification |
| `data/SCHEMA.md` | **IMPROVED** | Full schema docs |
| `404.html` | **NEW** | Custom 404 page |
| `.github/workflows/deploy.yml` | **NEW** | CI/CD deployment |

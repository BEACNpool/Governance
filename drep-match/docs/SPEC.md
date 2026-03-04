# DRep Compass — v0 Spec

## Goal

Build a **public** tool that:

- lets a delegator check **how their DRep votes** across **all** governance action types
- captures the delegator’s preferences with minimal friction
- ranks alternative DReps by **alignment + trust signals**
- explains results with **linked receipts** (actions + anchors)

Non-goal for v0: perfect “political ideology detection.” We will be explicit and auditable.

---

## v0 User Flows

### 1) Check my DRep (stake address)
1. User pastes a `stake1...` address.
2. Site resolves current DRep delegation (if available) and opens DRep profile.
3. User optionally takes quiz to compute alignment.

### 2) DRep lookup (search)
1. User searches by DRep id / name.
2. DRep profile page shows vote history + stats.

### 3) Find a better rep
1. User completes quiz + calibration.
2. Site shows ranked matches with:
   - match score + confidence
   - top alignment examples (3)
   - top disagreement examples (3)

---

## Data Sources (v0 default)

Start with public APIs for fastest ship / lowest ops, with a seam to swap to db-sync later.

- Governance actions feed
- DRep votes per action
- DRep metadata (if available)
- Vote anchors/rationales: `(url, hash)`; fetch + cache content

Implementation note: treat on-chain facts as authoritative; anchors are optional, but high-value.

---

## Core Entities

### `gov_action`
Fields (minimum):
- `id` (canonical action id)
- `type` (enum/string)
- `title`
- `created_epoch` / `created_time` (if available)
- `url` (GovTool or canonical viewer)
- `anchor_url`, `anchor_hash` (if present)

### `vote`
- `gov_action_id`
- `drep_id`
- `vote` (`YES|NO|ABSTAIN`)
- `time` (or epoch)

### `drep`
- `id`
- `name` (best-effort)
- `links` (website/social)

### `anchor_cache`
- `url`, `hash`
- `fetched_at`
- `content_type`
- `raw_text` (or extracted markdown)
- `summary` (short)
- `tags` (list)

---

## Taxonomy (v0)

Every governance action gets:
- `category` (one primary)
- `tags` (0..n)

**Primary categories (v0):**
- `treasury`
- `protocol_params`
- `hard_fork_or_tech`
- `governance_process`
- `committee_or_constitution`
- `info_or_signal`
- `other`

Tags (examples): `audit`, `milestones`, `security`, `vendor_specific`, `research`, `marketing`, `tooling`, `open_source`, `high_spend`.

v0 classifier approach:
- rule-based on title/metadata + anchor text when present
- keep outputs deterministic and debuggable

---

## Preference Model

### Quiz design requirement (non-negotiable)
Quiz and calibration questions must be **explicitly tied to governance action types** and the kinds of tradeoffs delegators will repeatedly face. The goal is not personality typing; it’s to generate a preference model that can be validated against real vote history ("proof" via linked actions).

Represent both user and DRep as a vector over categories + a few cross-cutting traits.

### DRep features (derived)
Per category:
- vote rates: `P(YES)`, `P(NO)`, `P(ABSTAIN)`
- coverage: how many actions in category they voted on

Cross-cutting:
- participation rate
- rationale/anchor rate (votes with anchors)
- recency (last vote time)

### User features (from quiz)
- per-category lean: prefer YES / NO / ABSTAIN in typical cases
- cross-cutting stances:
  - risk tolerance
  - treasury strictness
  - transparency bar
  - “no vote without rationale” preference

---

## Scoring (v0)

### Similarity
Weighted similarity between user vector and DRep vector:
- weight categories equally by default
- optionally reweight by the user’s “care more about X” slider (later)

### Explicit non-signal: delegation size
Unlike SPO selection, there is no performance/uptime requirement tied to delegation size. **We do not use delegation size as a positive or negative signal** for recommendations in v0; alignment + participation + receipts are what matter.

### Trust modifiers

**Eligibility rule for recommendations (v0):** BEACN only recommends DReps with a **perfect voting record** across the most recent **20** indexed actions. (They can still be viewable/searchable.)

Penalize:
- stale activity

Boost:
- high rationale/anchor rate

### Confidence
Label confidence using:
- total votes cast
- category coverage

---

## Explanations (required)

Each match card shows:
- “Why you match” — 3 linked actions
- “Where you differ” — 3 linked actions
- confidence label

Receipts are mandatory: every example links to a canonical action page and (if present) the anchor.

---

## Output Dataset (frontend reads)

Prefer chunked JSON for scale:

- `public-data/latest/index.json` (manifest)
- `public-data/latest/actions.json` (or chunked)
- `public-data/latest/dreps.json`
- `public-data/latest/votes.json` (likely chunked)
- `public-data/latest/anchors.json` (optional)

Manifest includes version, generated_at, counts, and file list.

---

## Frontend Pages (v0)

- `/` Home: stake address lookup + DRep search
- `/drep/:id` DRep profile (timeline + stats)
- `/quiz` Preference quiz + calibration
- `/matches` Ranked matches

---

## Milestones

0. Scaffolding + schemas + manifest
1. Ingest actions + votes; render DRep profile with timeline
2. Anchor cache + show rationale links
3. Quiz + compute user vector
4. Matching + explanations

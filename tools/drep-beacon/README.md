# BEACN DRep Beacon (governance tool — proof-of-concept)

A forkable, receipts-first toolkit for **auditing DRep voting participation** on Cardano governance actions using **Koios** (optionally via the BEACN Cloudflare worker).

## Why this exists

BEACN’s ethos is accountability without hype:

- **Receipts-first:** every claim is backed by a queryable endpoint + IDs.
- **Open & forkable:** anyone can reproduce results.
- **No harassment tooling:** this repo is for public accountability reporting, not dogpiling.

## What it does

- Pulls active governance actions from Koios (`/proposal_list`).
- Pulls vote records for an action (`/proposal_votes`).
- Pulls DRep registration list (`/drep_list`) and stake history (`/drep_history`).
- Produces a ranked table of **top-N DReps by voting power** and whether they voted on a chosen action.

## Quick start (CLI)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Uses BEACN Koios worker by default
python3 -m beacon report --proposal-id <gov_action_id> --top 50

# Or point at public Koios
KOIOS_BASE=https://api.koios.rest/api/v1 python3 -m beacon report --proposal-id <gov_action_id>
```

## Quick start (Web)

Open:

- `site/index.html` (static)

This is designed to be hosted via GitHub Pages under the BEACN governance site.
It supports share links via query params like:

- `?proposal_id=...&top=50&koios_base=https://koios.beacn.workers.dev`

## Configuration

- `KOIOS_BASE` (default: `https://koios.beacn.workers.dev`)

## Outputs

- Markdown summary to stdout
- Optional `--csv out.csv`
- Web UI supports: share links + CSV export

## Guide / recipes (positive uses)

These are intentionally *not* “call-out tools.” They’re accountability primitives that anyone can build on.

1) **Participation report (single action)**
   - Identify the top-N DReps by voting power and whether a vote record exists.

2) **Participation trend (many actions)**
   - Run the report for multiple actions and track: “what % of top-100 voting power voted?”
   - Share your methodology (proposal ids + timestamp + Koios base).

3) **Reliability / data integrity check**
   - Run the same query against:
     - `https://koios.beacn.workers.dev`
     - `https://api.koios.rest/api/v1`
   - If results diverge, you found something worth investigating.

4) **Remix into new tooling**
   - Export CSV and build a chart dashboard, or embed the share link into a blog post so readers can verify.

### Language norms

Prefer neutral language:
- ✅ “No vote recorded (as of <timestamp>)”
- ❌ “Refused to vote” / “lazy” / accusations

## Safety / norms

- This tool is **read-only**.
- Prefer neutral language: “no vote recorded” instead of accusations.
- If publishing, include the proposal id + timestamp + Koios base URL used.

## License

MIT (see `LICENSE`).

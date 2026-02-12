# Single Stake Pools Calculator (BEACN)

A small static web tool that estimates how many Cardano stake pools look like **single-operator, single-pool** candidates after excluding likely multi-pool clusters using receipts-first linkage signals.

- Site: `site/`
- Data source: Koios (default: `https://koios.beacn.workers.dev`)

## Method (high level)

Start with all pools, then exclude pools that match any enabled linkage flags (cluster size ≥ threshold):

- `reward_addr_reuse` (strong)
- `owner_reuse` (strong)
- `relay_shared` (medium)
- `meta_url_shared` (soft/medium)

This tool is intended for **private analysis** and should not be used for harassment.

## Publish

If placed in `BEACNpool/Governance` under `tools/single-stake-pools/site/`, GitHub Pages will serve it at:

`https://beacnpool.github.io/Governance/tools/single-stake-pools/site/`

# Deep Dive — 2026-02-09 — Increase Transaction and Block Memory Units (Part 1/2)

> **AI Deep Dive (analysis)** — links included so anyone can verify.

## 0) One-paragraph summary
This is a **protocol parameter change** proposal (Part 1 of 2) from Intersect’s Parameter Committee to increase Plutus script **memory unit limits** (and related limits) to improve smart contract capacity. If enacted, it can allow more complex Plutus workloads per transaction/block, but it also increases the resource burden on the network (validation/mempool/relay pressure) and needs careful, data-backed sizing.

## 1) Why this matters (delegators + network)
- **User impact:** higher Plutus capacity can reduce failed transactions and enable more complex dApps.
- **SPO impact:** more memory allowance can increase worst-case validation load; relays/BPs need headroom.
- **Governance precedent:** parameter changes should be evidence-driven (benchmarks, propagation analysis, failure modes).

## 2) Primary receipts
- GovTool: https://gov.tools/governance_actions/c21b00f90f18fce4003edf42b0b0d455126e01c946e80cc5341a9f9750caf795#0
- CGOV: https://app.cgov.io/governance_actions/c21b00f90f18fce4003edf42b0b0d455126e01c946e80cc5341a9f9750caf795#0
- Anchor (IPFS): ipfs://bafkreifwx5z25x6bh5vcwgvzrajy7qlgisukglywjjduwfsrsnp752pqca

## 3) What to look for (technical homework)
Before supporting/voting YES, the community should be able to point to:
- Benchmarks showing **validation cost** changes (CPU/RAM) under realistic mempool loads.
- Any analysis of **block propagation**/fork risk if scripts become heavier.
- Whether this change increases risk of **DoS-style** “heavy but valid” transactions.
- Clarity on why this is split “Part 1/2” and what Part 2 changes.

## 4) Verification checklist
- Read the anchor doc and confirm it:
  - states the exact parameter deltas,
  - explains why existing limits are constraining devs,
  - links to discussion/benchmarks.
- Cross-check on multiple UIs (GovTool/CGOV) that the same action/anchor is referenced.

## 5) Risks / concerns
- Parameter changes can be good, but **"just raise limits"** without supporting data is risky.
- If this increases worst-case validation too much, it can degrade network performance.

## 6) Questions to ask publicly
1) What empirical data supports the exact new limits (not just “devs need it”)?
2) What’s the expected impact on relay bandwidth + BP validation time?
3) What monitoring/rollback plan exists if mempool/backpressure worsens?

## 7) My recommendation (clearly labeled)
**Recommendation: NEEDS MORE INFO → likely YES if evidence is strong.**
- If the anchor includes real performance analysis and the deltas are conservative, this is probably a net positive.
- If evidence is thin, it should be held until the committee provides benchmarks and propagation analysis.

## 8) Change log
- First draft created 2026-02-09.

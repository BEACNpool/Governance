from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, Iterable, List, Optional, Set, Tuple

from . import __version__
from .koios import KOIOS_BASE, get, with_retries


@dataclass
class DRepRow:
    drep_id: str
    stake: int  # lovelace


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def fetch_drep_list() -> List[dict]:
    return with_retries(lambda: get("drep_list"))


def fetch_drep_history() -> List[dict]:
    return with_retries(lambda: get("drep_history"))


def latest_stake_by_drep() -> Dict[str, int]:
    """Return latest known stake (amount) per drep_id from /drep_history."""
    rows = fetch_drep_history()
    latest: Dict[str, Tuple[int, int]] = {}  # drep_id -> (epoch_no, amount)
    for r in rows:
        did = r.get("drep_id")
        ep = r.get("epoch_no")
        amt = r.get("amount")
        if not did or ep is None or amt is None:
            continue
        try:
            ep_i = int(ep)
            amt_i = int(amt)
        except Exception:
            continue
        cur = latest.get(did)
        if cur is None or ep_i > cur[0]:
            latest[did] = (ep_i, amt_i)
    return {k: v[1] for k, v in latest.items()}


def top_dreps_by_stake(top_n: int) -> List[DRepRow]:
    # Only include currently registered DReps
    drep_list = fetch_drep_list()
    registered = [r for r in drep_list if r.get("registered") is True]

    stake_latest = latest_stake_by_drep()

    out: List[DRepRow] = []
    for r in registered:
        did = r.get("drep_id")
        if not did:
            continue
        stake = int(stake_latest.get(did, 0))
        out.append(DRepRow(drep_id=str(did), stake=stake))

    out.sort(key=lambda x: x.stake, reverse=True)
    return out[:top_n]


def fetch_proposal_votes(proposal_id: str) -> List[dict]:
    # Koios worker supports GET /proposal_votes?_proposal_id=<gov_action_id>
    return with_retries(lambda: get("proposal_votes", params={"_proposal_id": proposal_id}))


def voted_dreps_for_proposal(proposal_id: str) -> Set[str]:
    votes = fetch_proposal_votes(proposal_id)
    s: Set[str] = set()
    for v in votes:
        if v.get("voter_role") != "DRep":
            continue
        did = v.get("voter_id")
        if did:
            s.add(str(did))
    return s


def vote_choice_by_drep(proposal_id: str) -> Dict[str, str]:
    votes = fetch_proposal_votes(proposal_id)
    out: Dict[str, str] = {}
    for v in votes:
        if v.get("voter_role") != "DRep":
            continue
        did = v.get("voter_id")
        choice = v.get("vote") or v.get("vote_choice")
        if did and choice:
            out[str(did)] = str(choice)
    return out


def format_ada(lovelace: int) -> str:
    return f"{lovelace/1_000_000:,.0f} ADA"


def report(proposal_id: str, top: int, csv_path: Optional[str] = None) -> str:
    top_dreps = top_dreps_by_stake(top)
    choices = vote_choice_by_drep(proposal_id)

    # Build rows
    table = []
    for i, dr in enumerate(top_dreps, start=1):
        voted = dr.drep_id in choices
        table.append(
            {
                "rank": i,
                "drep_id": dr.drep_id,
                "stake_lovelace": dr.stake,
                "stake_ada": dr.stake / 1_000_000,
                "vote": choices.get(dr.drep_id, "NO_VOTE_RECORDED"),
            }
        )

    if csv_path:
        with open(csv_path, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["rank", "drep_id", "stake_ada", "vote"])
            w.writeheader()
            for r in table:
                w.writerow({"rank": r["rank"], "drep_id": r["drep_id"], "stake_ada": f"{r['stake_ada']:.6f}", "vote": r["vote"]})

    # Summary stats
    no_vote = [r for r in table if r["vote"] == "NO_VOTE_RECORDED"]

    lines = []
    lines.append(f"BEACN DRep Beacon v{__version__}")
    lines.append(f"Koios base: {KOIOS_BASE}")
    lines.append(f"Timestamp (UTC): {utc_now_iso()}")
    lines.append(f"Proposal: {proposal_id}")
    lines.append("")
    lines.append(f"Top {top} registered DReps by latest stake: {len(no_vote)}/{top} have NO_VOTE_RECORDED")
    lines.append("")

    # Markdown table
    lines.append("| # | DRep | Voting Power (latest) | Vote |")
    lines.append("|---:|---|---:|---|")
    for r in table:
        lines.append(f"| {r['rank']} | `{r['drep_id']}` | {format_ada(r['stake_lovelace'])} | {r['vote']} |")

    lines.append("")
    lines.append("Notes:")
    lines.append("- ‘NO_VOTE_RECORDED’ means Koios returned no DRep vote record for that DRep on this proposal at query time.")
    lines.append("- This is a read-only, reproducible snapshot intended for accountability reporting.")

    return "\n".join(lines)


def main(argv: Optional[List[str]] = None) -> int:
    ap = argparse.ArgumentParser(prog="beacon", description="DRep voting participation report (Koios-backed)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    rp = sub.add_parser("report", help="Generate a top-N DRep participation report for a proposal")
    rp.add_argument("--proposal-id", required=True, help="Koios proposal_id / gov_action_id")
    rp.add_argument("--top", type=int, default=50)
    rp.add_argument("--csv", help="Write CSV output to path")

    args = ap.parse_args(argv)

    if args.cmd == "report":
        md = report(args.proposal_id, args.top, args.csv)
        print(md)
        return 0

    return 2


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Build the static dataset consumed by the DRep Compass frontend.

This script ingests on-chain governance actions + DRep votes via Koios and emits
static JSON files under `public-data/latest/`.

Design goals:
- public + auditable (store primary ids + anchor URLs/hashes)
- deterministic outputs (no hidden state)
- fast to ship (Koios first; db-sync seam later)

Env vars:
- KOIOS_BASE: defaults to https://koios.beacn.workers.dev
- DREPCOMPASS_ACTION_LIMIT: number of recent governance actions to ingest (default 250)
- DREPCOMPASS_VOTE_LIMIT: per-action vote rows limit (default 5000)
"""

from __future__ import annotations

import json
import os
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public-data" / "latest"

KOIOS_BASE = os.environ.get("KOIOS_BASE", "https://koios.beacn.workers.dev").rstrip("/")
ACTION_LIMIT = int(os.environ.get("DREPCOMPASS_ACTION_LIMIT", "250"))
VOTE_LIMIT = int(os.environ.get("DREPCOMPASS_VOTE_LIMIT", "5000"))


@dataclass
class Manifest:
    version: str
    generated_at: str
    files: list[str]
    counts: dict
    source: dict


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def write_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def post(endpoint: str, body: dict[str, Any] | None = None, *, params: dict[str, Any] | None = None, timeout: int = 60):
    url = f"{KOIOS_BASE}/{endpoint.lstrip('/')}"
    r = requests.post(url, params=params or {}, json=body or {}, timeout=timeout)
    r.raise_for_status()
    return r.json()


def as_action(row: dict[str, Any]) -> dict[str, Any]:
    pid = row.get("proposal_id")
    meta = row.get("meta_json") or {}
    title = None
    body = {}
    try:
        body = meta.get("body", {}) or {}
    except Exception:
        body = {}

    title = body.get("title")

    # Fallback titles that are still meaningful.
    if not title:
        title = f"{row.get('proposal_type', 'GovernanceAction')} {pid}"

    abstract = body.get("abstract")

    return {
        "id": pid,
        "type": row.get("proposal_type"),
        "title": title,
        "abstract": abstract,
        "created_time": row.get("block_time"),
        "url": f"https://explorer.cardano.org/governance-action/{pid}" if pid else None,
        "anchor_url": row.get("meta_url"),
        "anchor_hash": row.get("meta_hash"),
        "proposed_epoch": row.get("proposed_epoch"),
        "ratified_epoch": row.get("ratified_epoch"),
        "enacted_epoch": row.get("enacted_epoch"),
        "dropped_epoch": row.get("dropped_epoch"),
        "expired_epoch": row.get("expired_epoch"),
        "expiration": row.get("expiration"),
    }


def normalize_vote(v: dict[str, Any]) -> str | None:
    # Koios returns Yes/No/Abstain strings.
    s = (v or {}).get("vote")
    if not s:
        return None
    s = str(s).strip().lower()
    if s == "yes":
        return "YES"
    if s == "no":
        return "NO"
    if s == "abstain":
        return "ABSTAIN"
    return None


def ingest() -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    # Actions
    proposals = post(
        "proposal_list",
        {},
        params={"limit": ACTION_LIMIT, "order": "block_time.desc"},
        timeout=120,
    )
    # Koios can return duplicate rows for the same proposal_id; dedupe.
    seen: set[str] = set()
    actions: list[dict[str, Any]] = []
    for p in proposals:
        pid = p.get("proposal_id")
        if not pid or pid in seen:
            continue
        seen.add(pid)
        actions.append(as_action(p))

    # DReps (active list; name resolution is a later enhancement)
    # Koios/PostgREST commonly caps responses around 1000 rows; paginate explicitly.
    dreps: list[dict[str, Any]] = []
    page_size = 1000
    offset = 0
    while True:
        page = post(
            "drep_list",
            {},
            params={"limit": page_size, "offset": offset, "order": "drep_id.asc"},
            timeout=120,
        )
        if not page:
            break
        for d in page:
            did = d.get("drep_id")
            if not did:
                continue
            dreps.append(
                {
                    "id": did,
                    "name": None,
                    "hex": d.get("hex"),
                    "has_script": d.get("has_script"),
                    "registered": d.get("registered"),
                }
            )
        if len(page) < page_size:
            break
        offset += page_size

    # Votes
    votes: list[dict[str, Any]] = []
    for i, a in enumerate(actions, start=1):
        pid = a["id"]
        try:
            rows = post(
                "proposal_votes",
                {"_proposal_id": pid},
                params={"limit": VOTE_LIMIT, "order": "block_time.desc"},
                timeout=120,
            )
        except Exception as e:
            print(f"WARN: failed proposal_votes for {pid}: {e}", file=sys.stderr)
            continue

        for r in rows:
            if r.get("voter_role") != "DRep":
                continue
            dv = normalize_vote(r)
            if not dv:
                continue
            votes.append(
                {
                    "gov_action_id": pid,
                    "drep_id": r.get("voter_id"),
                    "vote": dv,
                    "time": r.get("block_time"),
                    "anchor_url": r.get("meta_url"),
                    "anchor_hash": r.get("meta_hash"),
                }
            )

        # Be a good API citizen.
        if i % 20 == 0:
            time.sleep(0.2)

    return actions, dreps, votes


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    actions, dreps, votes = ingest()

    write_json(OUT / "actions.json", actions)
    write_json(OUT / "dreps.json", dreps)
    write_json(OUT / "votes.json", votes)

    manifest = Manifest(
        version="v0",
        generated_at=utc_now_iso(),
        files=["actions.json", "dreps.json", "votes.json"],
        counts={"actions": len(actions), "dreps": len(dreps), "votes": len(votes)},
        source={
            "koios_base": KOIOS_BASE,
            "action_limit": ACTION_LIMIT,
            "vote_limit": VOTE_LIMIT,
        },
    )
    write_json(OUT / "index.json", manifest.__dict__)

    print(f"Wrote {OUT / 'index.json'}")
    print(f"Actions: {len(actions)} | DReps: {len(dreps)} | Votes: {len(votes)}")


if __name__ == "__main__":
    main()

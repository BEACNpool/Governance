#!/usr/bin/env python3
"""Build the static dataset consumed by the DRep Compass frontend.

v0: scaffold + manifest + placeholders.

Next steps:
- ingest gov actions
- ingest DRep votes
- cache anchors
- derive DRep vectors
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public-data" / "latest"


@dataclass
class Manifest:
    version: str
    generated_at: str
    files: list[str]
    counts: dict


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def write_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    # Placeholders — replaced once ingest is implemented.
    actions = []
    dreps = []
    votes = []

    write_json(OUT / "actions.json", actions)
    write_json(OUT / "dreps.json", dreps)
    write_json(OUT / "votes.json", votes)

    manifest = Manifest(
        version="v0",
        generated_at=utc_now_iso(),
        files=["actions.json", "dreps.json", "votes.json"],
        counts={"actions": len(actions), "dreps": len(dreps), "votes": len(votes)},
    )
    write_json(OUT / "index.json", manifest.__dict__)

    print(f"Wrote {OUT / 'index.json'}")


if __name__ == "__main__":
    main()

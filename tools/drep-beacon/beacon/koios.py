from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional

import requests

KOIOS_BASE = os.environ.get("KOIOS_BASE", "https://koios.beacn.workers.dev").rstrip("/")


class KoiosError(RuntimeError):
    pass


def _req(method: str, path: str, *, params: Optional[Dict[str, Any]] = None, timeout: int = 30) -> Any:
    url = f"{KOIOS_BASE}/{path.lstrip('/')}"
    r = requests.request(method, url, params=params, headers={"Accept": "application/json"}, timeout=timeout)
    r.raise_for_status()
    return r.json()


def get(path: str, *, params: Optional[Dict[str, Any]] = None, timeout: int = 30) -> Any:
    return _req("GET", path, params=params, timeout=timeout)


def with_retries(fn, *, retries: int = 5, backoff: float = 0.7):
    last: Exception | None = None
    for i in range(retries):
        try:
            return fn()
        except Exception as exc:
            last = exc
            if i >= retries - 1:
                break
            time.sleep(backoff * (2**i))
    raise KoiosError(str(last))

/* Single Stake Pools Calculator
 * - Fetches all pools from Koios
 * - Fetches pool_info in batches
 * - Computes linkage clusters and excludes by enabled flags
 */

const $ = (id) => document.getElementById(id);

const state = {
  pools: [], // enriched pool_info rows
  computed: null,
};

function setStatus(msg) {
  $("status").textContent = msg;
}

function setProgress(pct) {
  $("progressBar").style.width = `${Math.max(0, Math.min(100, pct))}%`;
}

function norm(s) {
  return (s ?? "").toString().trim();
}

function safeLower(s) {
  return norm(s).toLowerCase();
}

function relayKeys(relays) {
  // Create stable keys for relay endpoints.
  // Prefer dns if present; else ipv4/ipv6; include port.
  const out = [];
  for (const r of (relays || [])) {
    const port = r.port ?? "";
    const dns = norm(r.dns);
    const ipv4 = norm(r.ipv4);
    const ipv6 = norm(r.ipv6);
    const srv = norm(r.srv);
    if (dns) out.push(`dns:${dns}:${port}`);
    else if (srv) out.push(`srv:${srv}:${port}`);
    else if (ipv4) out.push(`ipv4:${ipv4}:${port}`);
    else if (ipv6) out.push(`ipv6:${ipv6}:${port}`);
  }
  return Array.from(new Set(out));
}

function download(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows) {
  const header = [
    "pool_id_bech32",
    "ticker",
    "name",
    "live_stake",
    "live_delegators",
    "reward_addr",
    "flags",
    "exclude_reason",
  ];
  const esc = (v) => {
    const s = (v ?? "").toString();
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
      return '"' + s.replaceAll('"', '""') + '"';
    }
    return s;
  };
  const lines = [header.join(",")];
  for (const r of rows) {
    const obj = r._view || r;
    lines.push(
      [
        obj.pool_id_bech32,
        obj.ticker,
        obj.name,
        obj.live_stake,
        obj.live_delegators,
        obj.reward_addr,
        (obj.flags || []).join(";"),
        obj.exclude_reason || "",
      ].map(esc).join(",")
    );
  }
  return lines.join("\n") + "\n";
}

async function koiosGetJson(base, path, params = {}) {
  const url = new URL(base.replace(/\/$/, "") + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { headers: { "accept": "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return await res.json();
}

async function koiosPostJson(base, path, body) {
  const url = base.replace(/\/$/, "") + path;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "accept": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for POST ${path}`);
  return await res.json();
}

async function loadPools() {
  const base = norm($("koiosBase").value);
  if (!base) throw new Error("Koios base URL is required");

  setProgress(0);
  setStatus("Fetching pool_list (paged)…");

  const ids = [];
  const limit = 1000;
  let offset = 0;

  while (true) {
    const page = await koiosGetJson(base, "/pool_list", { offset, limit });
    if (!Array.isArray(page) || page.length === 0) break;
    for (const row of page) {
      if (row.pool_id_bech32) ids.push(row.pool_id_bech32);
    }
    offset += page.length;
    setStatus(`Fetched pool_list: ${ids.length} pools…`);
    setProgress(Math.min(10, 10 * (ids.length / 3000))); // optimistic
    if (page.length < limit) break;
  }

  if (ids.length === 0) throw new Error("No pools returned by /pool_list");

  // Batch pool_info
  const batchSize = 80;
  const out = [];
  let done = 0;
  setStatus(`Fetching pool_info in batches (${batchSize})…`);

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const rows = await koiosPostJson(base, "/pool_info", { _pool_bech32_ids: batch });
    if (Array.isArray(rows)) {
      out.push(...rows);
    }
    done += batch.length;
    const pct = 10 + 90 * (done / ids.length);
    setProgress(pct);
    setStatus(`Loaded pool_info: ${out.length}/${ids.length}…`);
  }

  // Normalize fields used by the UI
  state.pools = out.map((p) => {
    const meta = p.meta_json || {};
    const ticker = meta.ticker || meta.pool_ticker || "";
    const name = meta.name || meta.pool_name || "";
    const owners = Array.isArray(p.owners) ? p.owners : [];
    const relays = Array.isArray(p.relays) ? p.relays : [];

    return {
      pool_id_bech32: p.pool_id_bech32,
      pool_status: p.pool_status,
      ticker: ticker,
      name: name,
      live_stake: p.live_stake,
      live_delegators: p.live_delegators,
      block_count: p.block_count,
      reward_addr: p.reward_addr,
      owners: owners,
      relays: relays,
      relay_keys: relayKeys(relays),
      meta_url: p.meta_url,
      meta_hash: p.meta_hash,
      meta_json: meta,
    };
  });

  setProgress(100);
  setStatus(`Done. Loaded ${state.pools.length} pools.`);

  recompute();
}

function buildIndex(pools) {
  const byReward = new Map();
  const byOwner = new Map();
  const byRelay = new Map();
  const byMetaUrl = new Map();

  for (const p of pools) {
    const reward = norm(p.reward_addr);
    if (reward) {
      if (!byReward.has(reward)) byReward.set(reward, []);
      byReward.get(reward).push(p);
    }

    for (const o of (p.owners || [])) {
      const key = norm(o);
      if (!key) continue;
      if (!byOwner.has(key)) byOwner.set(key, []);
      byOwner.get(key).push(p);
    }

    for (const rk of (p.relay_keys || [])) {
      if (!byRelay.has(rk)) byRelay.set(rk, []);
      byRelay.get(rk).push(p);
    }

    const mu = norm(p.meta_url);
    if (mu) {
      if (!byMetaUrl.has(mu)) byMetaUrl.set(mu, []);
      byMetaUrl.get(mu).push(p);
    }
  }

  return { byReward, byOwner, byRelay, byMetaUrl };
}

function recompute() {
  const pools = state.pools;
  if (!pools || pools.length === 0) {
    render([]);
    return;
  }

  const minCluster = Math.max(2, parseInt($("minCluster").value || "2", 10));
  const flags = {
    reward: $("flagRewardAddr").checked,
    owners: $("flagOwners").checked,
    relays: $("flagRelays").checked,
    metaUrl: $("flagMetaUrl").checked,
  };

  const idx = buildIndex(pools);

  const annotated = pools.map((p) => {
    const tripped = [];
    const receipts = [];

    const reward = norm(p.reward_addr);
    if (flags.reward && reward) {
      const cluster = idx.byReward.get(reward) || [];
      if (cluster.length >= minCluster) {
        tripped.push("reward_addr_reuse");
        receipts.push(`reward_addr cluster size=${cluster.length}`);
      }
    }

    if (flags.owners) {
      // Exclude if ANY owner key appears in a cluster >= minCluster
      let maxOwnerCluster = 0;
      for (const o of (p.owners || [])) {
        const cluster = idx.byOwner.get(o) || [];
        if (cluster.length > maxOwnerCluster) maxOwnerCluster = cluster.length;
      }
      if (maxOwnerCluster >= minCluster) {
        tripped.push("owner_reuse");
        receipts.push(`owner cluster max=${maxOwnerCluster}`);
      }
    }

    if (flags.relays) {
      let maxRelayCluster = 0;
      for (const rk of (p.relay_keys || [])) {
        const cluster = idx.byRelay.get(rk) || [];
        if (cluster.length > maxRelayCluster) maxRelayCluster = cluster.length;
      }
      if (maxRelayCluster >= minCluster) {
        tripped.push("relay_shared");
        receipts.push(`relay cluster max=${maxRelayCluster}`);
      }
    }

    const mu = norm(p.meta_url);
    if (flags.metaUrl && mu) {
      const cluster = idx.byMetaUrl.get(mu) || [];
      if (cluster.length >= minCluster) {
        tripped.push("meta_url_shared");
        receipts.push(`meta_url cluster size=${cluster.length}`);
      }
    }

    const excluded = tripped.length > 0;

    return {
      ...p,
      _view: {
        ...p,
        excluded,
        flags: tripped,
        exclude_reason: receipts.join(" | "),
      },
    };
  });

  const total = annotated.length;
  const excludedCount = annotated.filter((r) => r._view.excluded).length;
  const candidateCount = total - excludedCount;

  $("kpiTotal").textContent = total.toLocaleString();
  $("kpiCandidates").textContent = candidateCount.toLocaleString();
  $("kpiExcluded").textContent = excludedCount.toLocaleString();

  state.computed = { annotated, idx, flags, minCluster };

  renderCurrent();
}

function renderCurrent() {
  const comp = state.computed;
  if (!comp) return;

  const mode = $("viewMode").value;
  const q = safeLower($("search").value);

  let rows = comp.annotated;
  if (mode === "candidates") rows = rows.filter((r) => !r._view.excluded);
  if (mode === "excluded") rows = rows.filter((r) => r._view.excluded);

  if (q) {
    rows = rows.filter((r) => {
      const p = r._view;
      const hay = [
        p.pool_id_bech32,
        p.ticker,
        p.name,
        p.reward_addr,
        (p.flags || []).join(" "),
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  render(rows);
}

function fmtAda(lovelace) {
  if (lovelace == null) return "";
  const n = Number(lovelace);
  if (!Number.isFinite(n)) return String(lovelace);
  // Koios returns lovelace; display ADA rounded.
  const ada = n / 1e6;
  if (ada >= 1_000_000) return `${(ada / 1_000_000).toFixed(2)}M ADA`;
  if (ada >= 10_000) return `${(ada / 1_000).toFixed(1)}k ADA`;
  return `${ada.toFixed(0)} ADA`;
}

function render(rows) {
  const wrap = $("tableWrap");

  const table = document.createElement("table");
  table.className = "table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Status</th>
      <th>Pool</th>
      <th>Stake / Delegators</th>
      <th>Flags</th>
      <th>Receipts</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  for (const r of rows) {
    const p = r._view;
    const tr = document.createElement("tr");

    const statusBadge = p.excluded
      ? `<span class="badge bad">Excluded</span>`
      : `<span class="badge ok">Candidate</span>`;

    const poolName = [p.ticker ? `[${p.ticker}]` : "", p.name].filter(Boolean).join(" ");

    const relays = (r.relays || []).slice(0, 3).map((x) => x.dns || x.ipv4 || x.ipv6 || x.srv).filter(Boolean);

    tr.innerHTML = `
      <td>${statusBadge}</td>
      <td>
        <div><b>${poolName || "(no metadata name)"}</b></div>
        <div class="small mono">${p.pool_id_bech32}</div>
        <div class="small">reward: <span class="mono">${p.reward_addr || ""}</span></div>
        <div class="small">relays: <span class="mono">${relays.join(", ")}${(r.relays||[]).length>3?"…":""}</span></div>
      </td>
      <td>
        <div><b>${fmtAda(p.live_stake)}</b></div>
        <div class="small">delegators: ${p.live_delegators ?? ""}</div>
        <div class="small">blocks: ${p.block_count ?? ""}</div>
      </td>
      <td>
        <div class="mono">${(p.flags || []).join("\n")}</div>
      </td>
      <td>
        <div class="small">${p.exclude_reason || ""}</div>
        ${p.meta_url ? `<div class="small">meta_url: <span class="mono">${p.meta_url}</span></div>` : ""}
      </td>
    `;

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);

  wrap.innerHTML = "";
  wrap.appendChild(table);
}

$("btnLoad").addEventListener("click", async () => {
  try {
    $("btnLoad").disabled = true;
    setStatus("Starting…");
    await loadPools();
  } catch (e) {
    console.error(e);
    setStatus(`Error: ${e.message || e}`);
  } finally {
    $("btnLoad").disabled = false;
  }
});

$("btnRecompute").addEventListener("click", () => recompute());
$("search").addEventListener("input", () => renderCurrent());
$("viewMode").addEventListener("change", () => renderCurrent());

$("btnExport").addEventListener("click", () => {
  const comp = state.computed;
  if (!comp) return;

  const mode = $("viewMode").value;
  const q = safeLower($("search").value);
  let rows = comp.annotated;
  if (mode === "candidates") rows = rows.filter((r) => !r._view.excluded);
  if (mode === "excluded") rows = rows.filter((r) => r._view.excluded);
  if (q) {
    rows = rows.filter((r) => {
      const p = r._view;
      const hay = [p.pool_id_bech32, p.ticker, p.name, p.reward_addr, (p.flags||[]).join(" ")].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  const csv = toCsv(rows);
  download(`single-stake-pools-${mode}.csv`, csv);
});

// Auto-load on first open? Keep idle by default.
setStatus("Idle. Click Load / Refresh.");

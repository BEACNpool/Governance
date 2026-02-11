/* BEACN DRep Beacon — client-side Koios explorer (mobile-friendly)
   Philosophy: receipts-first, reproducible, forkable.
*/

import { startEpochTimer } from './epoch.js';

const $ = (id) => document.getElementById(id);

function qs() {
  const p = new URLSearchParams(location.search);
  return {
    proposal_id: p.get('proposal_id') || '',
    top: p.get('top') || '50',
    koios_base: p.get('koios_base') || 'https://koios.beacn.workers.dev'
  };
}

function setStatus(msg) { $('runStatus').textContent = msg || ''; }
function setSummary(msg) { $('summary').textContent = msg || ''; }
function setDetails(html) { $('actionDetails').innerHTML = html || ''; }
function setGlobal(msg, loading=false){
  const el = $('globalStatus');
  if (!el) return;
  el.textContent = msg || '';
  el.classList.toggle('loading', !!loading);
}

function normalizeBase(u) {
  return (u || '').trim().replace(/\/+$/,'');
}

async function jget(base, path, params={}) {
  const url = new URL(normalizeBase(base) + '/' + path.replace(/^\//,''));
  Object.entries(params).forEach(([k,v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  const r = await fetch(url.toString(), { headers: { 'Accept': 'application/json' }});
  if (!r.ok) throw new Error(`${path} HTTP ${r.status}`);
  return await r.json();
}

function fmtAda(lovelace) {
  const ada = (Number(lovelace)||0) / 1_000_000;
  return ada.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' ADA';
}

function voteClass(v) {
  const x = String(v||'').toLowerCase();
  if (x === 'yes') return 'vote-yes';
  if (x === 'no') return 'vote-no';
  if (x.includes('abstain')) return 'vote-abstain';
  if (x.includes('no_vote')) return 'vote-none';
  return 'vote-none';
}

function toCsv(rows) {
  const header = ['rank','drep_id','voting_power_ada','vote'];
  const lines = [header.join(',')];
  for (const r of rows) {
    const line = [r.rank, r.drep_id, r.stake_ada.toFixed(6), r.vote]
      .map(x => String(x).replace(/"/g,'""'))
      .map(x => /[",\n]/.test(x) ? `"${x}"` : x)
      .join(',');
    lines.push(line);
  }
  return lines.join('\n');
}

function download(filename, text) {
  const blob = new Blob([text], {type: 'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function loadPresets() {
  const base = normalizeBase($('koiosBase').value);
  const preset = $('preset');
  preset.innerHTML = '<option value="">Loading proposals…</option>';
  setGlobal('Loading proposals from Koios…', true);
  try {
    const list = await jget(base, 'proposal_list', { limit: '60' });
    const rows = Array.isArray(list) ? list : [];
    window.__proposalsById = {};

    preset.innerHTML = '<option value="">Select a governance action…</option>';

    for (const r of rows) {
      const pid = r.proposal_id;
      if (!pid) continue;
      window.__proposalsById[String(pid)] = r;

      const type = r.proposal_type || 'UnknownType';
      const ep = (r.proposed_epoch !== undefined && r.proposed_epoch !== null) ? `e${r.proposed_epoch}` : '';
      const ttl = (r.meta_json && (r.meta_json.title || r.meta_json.body?.title)) || r.meta_comment || r.proposal_description || '';
      const t = String(ttl).replace(/\s+/g,' ').trim();
      const short = t ? (t.length > 72 ? t.slice(0,72) + '…' : t) : '';

      const label = `${type}${ep ? ' · ' + ep : ''}${short ? ' · ' + short : ''}`;

      const opt = document.createElement('option');
      opt.value = pid;
      opt.textContent = label;
      preset.appendChild(opt);
    }
    setGlobal(`Loaded ${rows.length} proposals. Pick one to run.`, false);
  } catch (e) {
    preset.innerHTML = '<option value="">(Could not load proposals — check Koios base)</option>';
    setGlobal('Failed to load proposals. Check Koios base / network.', false);
  }
}

async function run() {
  const base = normalizeBase($('koiosBase').value);
  const proposal_id = $('preset').value || '';
  const top = Number($('topN').value || 50);

  if (!proposal_id) {
    setStatus('Pick a governance action from “Quick pick”.');
    return;
  }

  $('run').disabled = true;
  setStatus('Fetching Koios data…');
  setGlobal('Running report…', true);
  setSummary('');
  setDetails('');

  try {
    // 1) voting summary (optional, but nice for context)
    let summaryRow = null;
    try {
      const vs = await jget(base, 'proposal_voting_summary', { _proposal_id: proposal_id });
      if (Array.isArray(vs) && vs.length) summaryRow = vs[0];
    } catch (_) {
      // non-fatal
    }

    // 2) votes for proposal (DRep subset)
    const votes = await jget(base, 'proposal_votes', { _proposal_id: proposal_id });
    const choices = new Map();
    for (const v of (Array.isArray(votes) ? votes : [])) {
      if (v.voter_role !== 'DRep') continue;
      if (!v.voter_id) continue;
      const choice = v.vote || v.vote_choice || 'VOTED';
      choices.set(String(v.voter_id), String(choice));
    }

    // 3) DRep list (registered)
    const drepList = await jget(base, 'drep_list');
    const registered = new Set(
      (Array.isArray(drepList) ? drepList : [])
        .filter(r => r.registered === true)
        .map(r => String(r.drep_id))
        .filter(Boolean)
    );

    // 4) DRep history — compute latest stake per DRep
    setStatus('Computing latest voting power… (this can take a moment)');
    const hist = await jget(base, 'drep_history');
    const latest = new Map(); // drep_id -> {epoch, amount}
    for (const r of (Array.isArray(hist) ? hist : [])) {
      const did = r.drep_id;
      if (!did || !registered.has(String(did))) continue;
      const ep = Number(r.epoch_no);
      const amt = Number(r.amount);
      if (!Number.isFinite(ep) || !Number.isFinite(amt)) continue;
      const cur = latest.get(String(did));
      if (!cur || ep > cur.epoch) latest.set(String(did), { epoch: ep, amount: amt });
    }

    // Rank
    const ranked = Array.from(latest.entries())
      .map(([drep_id, v]) => ({ drep_id, stake_lovelace: v.amount }))
      .sort((a,b) => b.stake_lovelace - a.stake_lovelace)
      .slice(0, top)
      .map((r, i) => {
        const vote = choices.get(r.drep_id) || 'NO_VOTE_RECORDED';
        return {
          rank: i+1,
          drep_id: r.drep_id,
          stake_lovelace: r.stake_lovelace,
          stake_ada: r.stake_lovelace / 1_000_000,
          vote,
        };
      });

    const noVote = ranked.filter(r => r.vote === 'NO_VOTE_RECORDED').length;

    // Render summary
    const bits = [];
    bits.push(`Koios base: ${base}`);
    bits.push(`Proposal: ${proposal_id}`);
    bits.push(`Top ${top} registered DReps by latest voting power: ${noVote}/${top} have NO_VOTE_RECORDED`);
    if (summaryRow) {
      const drepCast = summaryRow.drep_yes_votes_cast + summaryRow.drep_no_votes_cast + summaryRow.drep_abstain_votes_cast;
      bits.push(`Koios voting summary (DReps cast): ${drepCast} (yes ${summaryRow.drep_yes_pct}%, no ${summaryRow.drep_no_pct}%, abstain ${summaryRow.drep_abstain_pct}%)`);
    }
    setSummary(bits.join(' · '));

    // Action detail panel (human-friendly)
    const pr = (window.__proposalsById || {})[proposal_id];
    const govTool = `https://gov.tools/governance_actions/${proposal_id}`;

    let title = '';
    let abstract = '';
    if (pr && pr.meta_json) {
      const body = pr.meta_json.body || pr.meta_json;
      title = body.title || pr.meta_json.title || '';
      abstract = body.abstract || pr.meta_json.abstract || '';
    }
    const desc = (pr && pr.proposal_description) ? String(pr.proposal_description) : '';

    // BEACN track record
    const BEACN_DREP_ID = 'drep1y2jn8fk0cn6wd6et3evnykea0glhw7t20xnhwss4xxjlczq29343n';
    const beacnOnChainVote = choices.get(BEACN_DREP_ID) || null;

    let beacnLine = '';
    let receiptFound = false;
    try {
      // TODO: replace with a rolling index (drep/votes/index.json). For now, use the published daily index.
      const idxUrl = new URL('../../../drep/votes/2026-02-10/json/index.json', location.href);
      const idx = await fetch(idxUrl.toString(), { headers: { 'Accept': 'application/json' }});
      if (idx.ok) {
        const j = await idx.json();
        const item = (j.items || []).find(x => x.govActionId === proposal_id);
        if (item) {
          receiptFound = true;
          const reader = new URL('../../../drep/votes/reader.html', location.href);
          beacnLine = `BEACN vote: <span class="pill ok">${item.vote}</span> · <a href="${reader.toString()}" target="_blank" rel="noopener">receipt</a>`;
        }
      }
    } catch (_) {}

    if (!receiptFound) {
      if (beacnOnChainVote) {
        beacnLine = `BEACN vote (on-chain): <span class="pill ok">${escapeHtml(beacnOnChainVote)}</span> · <span class="pill bad">receipt missing in repo</span>`;
      } else {
        beacnLine = `BEACN vote: <span class="pill bad">no vote record found</span>`;
      }
    }

    const parts = [];
    if (title) parts.push(`<div><b>Title:</b> ${escapeHtml(title)}</div>`);
    if (abstract) parts.push(`<div style="margin-top:6px"><b>Abstract:</b> ${escapeHtml(String(abstract).slice(0,420))}${String(abstract).length>420?'…':''}</div>`);
    else if (desc) parts.push(`<div style="margin-top:6px"><b>Summary:</b> ${escapeHtml(String(desc).slice(0,420))}${String(desc).length>420?'…':''}</div>`);

    let meta = '';
    if (pr) {
      const type = pr.proposal_type || '';
      const pe = (pr.proposed_epoch !== undefined && pr.proposed_epoch !== null) ? pr.proposed_epoch : '';
      const exp = pr.expiration || pr.expiration_epoch || pr.expired_epoch || '';
      meta = `<div style="margin-top:6px"><b>Type:</b> ${escapeHtml(type)}${pe!==''?` · <b>Proposed epoch:</b> ${pe}`:''}${exp!==''?` · <b>Expiration:</b> ${escapeHtml(String(exp))}`:''}</div>`;
    }

    const links = `<div style="margin-top:8px"><a href="${govTool}" target="_blank" rel="noopener">Open in GovTool</a></div>`;
    const beacn = beacnLine ? `<div style="margin-top:8px">${beacnLine}</div>` : '';

    setDetails(parts.join('') + meta + links + beacn);

    // Render table
    const tbody = $('table').querySelector('tbody');
    tbody.innerHTML = '';
    for (const r of ranked) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="r">${r.rank}</td>
        <td><code>${r.drep_id}</code></td>
        <td class="r">${fmtAda(r.stake_lovelace)}</td>
        <td class="${voteClass(r.vote)}">${r.vote}</td>
      `;
      tbody.appendChild(tr);
    }

    // cache for CSV download
    window.__lastRows = ranked;

    setStatus('Done.');
    setGlobal('Done.', false);

    // update URL (shareable)
    const u = new URL(location.href);
    u.searchParams.set('proposal_id', proposal_id);
    u.searchParams.set('top', String(top));
    u.searchParams.set('koios_base', base);
    history.replaceState(null, '', u.toString());

  } catch (e) {
    setStatus('Error: ' + (e?.message || String(e)));
    setGlobal('Error running report. See details below.', false);
  } finally {
    $('run').disabled = false;
  }
}

function copyShareLink() {
  const u = new URL(location.href);
  navigator.clipboard.writeText(u.toString());
  setStatus('Share link copied to clipboard.');
}

function escapeHtml(s){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

function downloadCsv() {
  const rows = window.__lastRows || [];
  if (!rows.length) { setStatus('Run a report first.'); return; }
  const csv = toCsv(rows);
  download('drep-beacon.csv', csv);
  setStatus('CSV downloaded.');
}

(function init(){
  const p = qs();
  $('topN').value = p.top;
  $('koiosBase').value = p.koios_base;

  $('run').addEventListener('click', run);
  $('copyLink').addEventListener('click', copyShareLink);
  $('downloadCsv').addEventListener('click', downloadCsv);

  $('preset').addEventListener('change', () => {
    // auto-run on selection to reduce friction
    if ($('preset').value) run();
  });

  $('koiosBase').addEventListener('change', async () => {
    await loadPresets();
    setDetails('');
    setSummary('');
    setStatus('');
  });

  // Epoch timer (best-effort)
  startEpochTimer({
    base: normalizeBase($('koiosBase').value),
    setText: (t) => { const el = $('epochTimer'); if (el) el.textContent = t; },
  });

  // load presets, then apply proposal_id from URL (no typing)
  loadPresets().then(() => {
    if (p.proposal_id) {
      $('preset').value = p.proposal_id;
      if ($('preset').value) run();
    } else {
      setGlobal('Ready. Pick a governance action.', false);
    }
  });
})();

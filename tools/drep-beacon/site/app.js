/* BEACN DRep Beacon — client-side Koios explorer (mobile-friendly)
   Philosophy: receipts-first, reproducible, forkable.
*/

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
  preset.innerHTML = '<option value="">Loading active proposals…</option>';
  try {
    const list = await jget(base, 'proposal_list', { limit: '30' });
    // Keep only active-ish (Koios includes status). If absent, show all.
    const rows = Array.isArray(list) ? list : [];
    preset.innerHTML = '<option value="">Pick a recent proposal…</option>';
    for (const r of rows) {
      const pid = r.proposal_id;
      if (!pid) continue;
      const label = `${(r.proposal_type||'').padEnd(15)} | ${(r.status||'').padEnd(8)} | ${String(pid).slice(0,28)}…`;
      const opt = document.createElement('option');
      opt.value = pid;
      opt.textContent = label;
      preset.appendChild(opt);
    }
  } catch (e) {
    preset.innerHTML = '<option value="">(Could not load proposals — check Koios base)</option>';
  }
}

async function run() {
  const base = normalizeBase($('koiosBase').value);
  const proposal_id = $('proposalId').value.trim();
  const top = Number($('topN').value || 50);

  if (!proposal_id) {
    setStatus('Provide a proposal_id (gov_action…).');
    return;
  }

  $('run').disabled = true;
  setStatus('Fetching Koios data…');
  setSummary('');

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

    // update URL (shareable)
    const u = new URL(location.href);
    u.searchParams.set('proposal_id', proposal_id);
    u.searchParams.set('top', String(top));
    u.searchParams.set('koios_base', base);
    history.replaceState(null, '', u.toString());

  } catch (e) {
    setStatus('Error: ' + (e?.message || String(e)));
  } finally {
    $('run').disabled = false;
  }
}

function copyShareLink() {
  const u = new URL(location.href);
  navigator.clipboard.writeText(u.toString());
  setStatus('Share link copied to clipboard.');
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
  $('proposalId').value = p.proposal_id;
  $('topN').value = p.top;
  $('koiosBase').value = p.koios_base;

  $('run').addEventListener('click', run);
  $('copyLink').addEventListener('click', copyShareLink);
  $('downloadCsv').addEventListener('click', downloadCsv);

  $('preset').addEventListener('change', (ev) => {
    const v = ev.target.value;
    if (v) $('proposalId').value = v;
  });

  $('koiosBase').addEventListener('change', loadPresets);

  loadPresets();

  // auto-run if proposal_id present
  if (p.proposal_id) run();
})();

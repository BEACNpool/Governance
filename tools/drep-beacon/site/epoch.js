// Epoch timer helper (Cardano epochs are 5 days = 432000 seconds)
// We derive epoch timing from Koios tip: epoch_no + epoch_slot.

export async function startEpochTimer({ base, setText }) {
  const EPOCH_LEN = 432000; // seconds

  async function fetchTip() {
    const url = new URL(base.replace(/\/+$/,'') + '/tip');
    const r = await fetch(url.toString(), { headers: { 'Accept': 'application/json' }});
    if (!r.ok) throw new Error('tip HTTP ' + r.status);
    const j = await r.json();
    return Array.isArray(j) ? j[0] : j;
  }

  let tip = null;
  async function refresh() {
    try {
      tip = await fetchTip();
    } catch (_) {
      // ignore; keep last tip
    }
  }

  function tick() {
    if (!tip) {
      setText('Epoch: …');
      return;
    }

    const epoch = Number(tip.epoch_no);
    const epochSlot = Number(tip.epoch_slot);
    const blockTime = Number(tip.block_time);

    if (!Number.isFinite(epoch) || !Number.isFinite(epochSlot) || !Number.isFinite(blockTime)) {
      setText('Epoch: …');
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    // estimate epoch start/end
    const epochStart = blockTime - epochSlot;
    const epochEnd = epochStart + EPOCH_LEN;
    const remain = Math.max(0, epochEnd - now);

    const d = Math.floor(remain / 86400);
    const h = Math.floor((remain % 86400) / 3600);
    const m = Math.floor((remain % 3600) / 60);
    const s = remain % 60;

    const pct = Math.max(0, Math.min(100, Math.floor((epochSlot / EPOCH_LEN) * 100)));
    setText(`Epoch ${epoch} · T-${d}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} · ${pct}%`);
  }

  // prime + intervals
  await refresh();
  tick();

  setInterval(tick, 1000);
  setInterval(refresh, 60_000);
}

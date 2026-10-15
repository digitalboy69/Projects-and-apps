/* ---------------------------------- MATCHING UI ---------------------------------- */
const KM_INFO = {
  'Varna': 'Ego & spiritual outlook', 'Vashya': 'Mutual attraction & influence', 'Tara': 'Health & luck through the nakshatras',
  'Yoni': 'Physical & instinctive fit', 'Graha Maitri': 'Mental wavelength & friendship', 'Gana': 'Temperament & nature',
  'Bhakoot': 'Emotional bond & family harmony', 'Nadi': 'Health & constitution'
};
const KM_COL = { 1: '#5B7FD6', 2: '#D96C9B' };
let MT = null;
const mtKey = p => `${p.name}|${p.dob}|${p.tob}`;
const mtBlank = tz => ({ name: '', dob: '', tob: '', place: '', lat: null, lon: null, tz, save: false });
function mtSaved(){
  let list = []; try { list = loadProfiles(); } catch(e){}
  const cur = currentProfileForExport;
  if (cur && !list.some(p => mtKey(p) === mtKey(cur))) list = [cur].concat(list);
  return list;
}
function buildMatchPanel(chart, profile){
  MT = { 1: { mode: 'saved', profile, draft: mtBlank(profile.tz) }, 2: { mode: 'saved', profile: null, draft: mtBlank(profile.tz) }, list: mtSaved(), results: {}, timers: {}, last: null };
  setTimeout(() => { mtRenderCard(1); mtRenderCard(2); mtUpdateGo(); }, 0);
  return `<div class="mt">
    <div class="mt-hero">
      <div class="mt-hearts" aria-hidden="true">💞</div>
      <h3>Kundali Matching</h3>
      <p>Compare two birth charts with the traditional <b>Ashtakoota</b> system — 8 factors worth 36 points — plus a Manglik check.</p>
      <ol class="mt-steps"><li><b>1</b>Choose two people</li><li><b>2</b>Tap check</li><li><b>3</b>See the score</li></ol>
    </div>
    <div class="mt-people"><div id="mtCard1" class="mt-card" style="--pc:${KM_COL[1]}"></div>
      <button type="button" class="mt-swap" data-mt-swap title="Swap roles" aria-label="Swap groom and bride roles">⇄</button>
      <div id="mtCard2" class="mt-card" style="--pc:${KM_COL[2]}"></div></div>
    <button type="button" class="mt-go" id="mtGo" data-mt-go disabled>Choose both people to continue</button>
    <div id="mtResult"></div>
  </div>`;
}
function mtResolve(i){
  const S = MT[i];
  if (S.mode === 'saved') return S.profile;
  const d = S.draft;
  if (!d.dob || !d.tob || d.lat === null || d.lon === null || isNaN(d.lat) || isNaN(d.lon) || isNaN(d.tz)) return null;
  return { name: d.name.trim() || `Person ${i}`, dob: d.dob, tob: d.tob.slice(0, 5), place: d.place || `${(+d.lat).toFixed(2)}, ${(+d.lon).toFixed(2)}`, lat: +d.lat, lon: +d.lon, tz: +d.tz };
}
function mtAvatar(name, col){ return `<span class="mt-av" style="background:${col}">${escapeHtml((name || '?').trim().charAt(0).toUpperCase())}</span>`; }
const MT_COLS = ['#D4AF37', '#5EC4B7', '#8A6FB8', '#E0A64A', '#6B7FA3', '#C95050', '#5B8A9E'];
function mtColor(name){ return MT_COLS[[...(name || '?')].reduce((a, c) => a + c.charCodeAt(0), 0) % MT_COLS.length]; }
function mtSummary(p){
  try { const P = kmPerson(p); return `<div class="mt-sum"><span>${SIGNS[P.moonSign].symbol} ${SIGNS[P.moonSign].name} Moon</span><span>★ ${NAKSHATRAS[P.nak].name} · pada ${P.pada}</span><span>↑ ${SIGNS[P.lagna].name} Lagna</span></div>`; }
  catch(e){ return '<div class="mt-sum"><span>Could not read this chart</span></div>'; }
}
function mtRenderCard(i){
  const el = document.getElementById('mtCard' + i); if (!el) return; const S = MT[i];
  const role = i === 1 ? ['Person 1', 'Groom side · Vara'] : ['Person 2', 'Bride side · Kanya'];
  const head = `<div class="mt-ch"><span class="mt-role">${role[0]}</span><small>${role[1]}</small></div>
    <div class="mt-seg"><button type="button" class="${S.mode === 'saved' ? 'on' : ''}" data-mt-mode="${i}:saved">Saved profile</button><button type="button" class="${S.mode === 'new' ? 'on' : ''}" data-mt-mode="${i}:new">New person</button></div>`;
  let body;
  if (S.mode === 'saved'){
    body = MT.list.length ? `<div class="mt-chips">${MT.list.map((p, idx) => `<button type="button" class="mt-chip ${S.profile && mtKey(S.profile) === mtKey(p) ? 'on' : ''}" data-mt-pick="${i}:${idx}">${mtAvatar(p.name, mtColor(p.name))}<span><b>${escapeHtml(p.name || 'Unnamed')}</b><small>${formatDateHuman(p.dob)} · ${p.tob.slice(0, 5)}</small></span></button>`).join('')}</div>`
      : `<div class="mt-empty">No saved profiles yet — switch to “New person”.</div>`;
    body += S.profile ? mtSummary(S.profile) : `<div class="mt-hint">Tap a profile above</div>`;
  } else {
    const d = S.draft;
    body = `<div class="mt-form">
      <label>Name <small>(optional)</small><input type="text" data-mt-f="name" value="${escapeHtml(d.name)}" placeholder="e.g. Ananya"></label>
      <div class="mt-row"><label>Date of birth<input type="date" data-mt-f="dob" value="${d.dob}"></label><label>Time of birth<input type="time" data-mt-f="tob" step="1" value="${d.tob}"></label></div>
      <label class="mt-place">Place of birth<input type="text" data-mt-place="${i}" value="${escapeHtml(d.place)}" placeholder="Search a city…" autocomplete="off"><div class="mt-res" id="mtRes${i}"></div></label>
      <div class="lp-tools"><button type="button" data-mt-loc="${i}:map">🗺️ Pick on map</button><button type="button" data-mt-loc="${i}:coords">⌖ Enter coordinates</button></div>
      <div class="mt-coord ${d.lat !== null ? 'ok' : ''}" id="mtCoord${i}">${d.lat !== null ? `✓ ${(+d.lat).toFixed(3)}°, ${(+d.lon).toFixed(3)}°` : 'Location not selected yet'}</div>
      <label>Timezone<select data-mt-f="tz">${TZ_OPTIONS.map(v => `<option value="${v}" ${+d.tz === v ? 'selected' : ''}>${fmtTz(v)}</option>`).join('')}</select></label>
      <details><summary>Enter coordinates manually</summary><div class="mt-row"><label>Latitude<input type="number" step="any" data-mt-f="lat" value="${d.lat === null ? '' : d.lat}"></label><label>Longitude<input type="number" step="any" data-mt-f="lon" value="${d.lon === null ? '' : d.lon}"></label></div></details>
      <label class="mt-save"><input type="checkbox" data-mt-f="save" ${d.save ? 'checked' : ''}> Save to my profiles</label>
    </div>`;
  }
  el.innerHTML = head + body;
}
function mtUpdateGo(){
  const b = document.getElementById('mtGo'); if (!b) return;
  const ok = !!(mtResolve(1) && mtResolve(2));
  b.disabled = !ok; b.textContent = ok ? '✨ Check compatibility' : 'Choose both people to continue';
}
async function mtSearch(i, q){
  const box = document.getElementById('mtRes' + i); if (!box) return;
  if (q.trim().length < 3){ box.innerHTML = ''; return; }
  box.innerHTML = '<div class="mt-r-msg">Searching…</div>';
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(q)}&email=contact@yourdomain.com`);
    const arr = await r.json(); MT.results[i] = arr;
    box.innerHTML = arr.length ? arr.map((x, n) => `<button type="button" data-mt-rpick="${i}:${n}">${escapeHtml(x.display_name)}</button>`).join('') : '<div class="mt-r-msg">No places found — try another spelling.</div>';
  } catch(e){ box.innerHTML = '<div class="mt-r-msg">Search unavailable — use “Enter coordinates manually”.</div>'; }
}
function mtRun(){
  const p1 = mtResolve(1), p2 = mtResolve(2); if (!p1 || !p2) return;
  let G, B; try { G = kmPerson(p1); B = kmPerson(p2); } catch(e){ console.error(e); APP.toast('Could not read one of the charts — check the birth details.', 'error'); return; }
  [1, 2].forEach(i => { const S = MT[i]; if (S.mode === 'new' && S.draft.save){ try { const ps = loadProfiles(); const pr = mtResolve(i); if (!ps.some(x => mtKey(x) === mtKey(pr))){ saveProfiles(ps.concat([{ ...pr, savedAt: Date.now() }])); refreshProfileSelect(); } S.draft.save = false; } catch(e){} } });
  MT.list = mtSaved(); MT.last = kmMatch(G, B);
  if (mtKey(p1) === mtKey(p2)) APP.toast('Both people are the same profile — pick someone else for a real match.', 'info', 4500);
  document.getElementById('mtResult').innerHTML = mtResultHtml(MT.last);
  const r = document.getElementById('mtResult'); if (r.scrollIntoView) r.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function mtResultHtml(R){
  const nm = R.G.profile.name || 'Person 1', nf = R.B.profile.name || 'Person 2', pct = R.total / 36, C = 2 * Math.PI * 52;
  const col = R.verdict[1];
  const person = (P, c) => `<div class="mt-pp" style="--pc:${c}">${mtAvatar(P.profile.name, c)}<span><b>${escapeHtml(P.profile.name || '')}</b><small>${SIGNS[P.moonSign].symbol} ${SIGNS[P.moonSign].name} · ${NAKSHATRAS[P.nak].name} ${P.pada}</small></span></div>`;
  const cards = R.k.map(x => {
    const cls = x.score === x.max ? 'full' : (x.score === 0 ? 'zero' : 'part');
    return `<div class="mt-k ${cls}"><div class="mt-kh"><b>${x.key}</b><span>${x.score % 1 ? x.score.toFixed(1) : x.score}<small>/${x.max}</small></span></div>
      <small class="mt-kd">${KM_INFO[x.key]}</small>
      <div class="mt-kbar"><i style="width:${x.score / x.max * 100}%"></i></div>
      <div class="mt-kv"><span style="--pc:${KM_COL[1]}">${escapeHtml(x.a)}</span><span style="--pc:${KM_COL[2]}">${escapeHtml(x.b)}</span></div>${x.note ? `<small class="mt-kn">${x.note}</small>` : ''}</div>`;
  }).join('');
  const D = R.dosha, mg = D.manglik.g, mb = D.manglik.b;
  const card = (ok, title, text) => `<div class="mt-d ${ok ? 'ok' : 'warn'}"><span class="mt-di">${ok ? '✓' : '!'}</span><div><b>${title}</b><p>${text}</p></div></div>`;
  const mline = (name, m, c) => `<div class="mt-ml" style="--pc:${c}"><b>${escapeHtml(name)}</b><span class="mt-lvl ${m.level === 'None' ? 'none' : ''}">${m.level === 'None' ? 'No dosha' : m.level}</span><small>Mars in house ${m.hL} from Lagna · ${m.hM} from Moon${m.cancel.length ? ' · ' + m.cancel.join('; ') : ''}</small></div>`;
  const mVerdict = !mg.present && !mb.present ? 'Neither chart has Manglik dosha.' : (mg.present && mb.present ? 'Both charts carry Manglik dosha — traditionally this balances out.' : `Only ${escapeHtml(mg.present ? nm : nf)} has Manglik dosha${(mg.present ? mg : mb).cancelled ? ', with a cancellation condition present' : ''} — check this with care.`);
  const dos = `<div class="mt-d ${(mg.present !== mb.present) && !(mg.present ? mg : mb).cancelled ? 'warn' : 'ok'} wide"><span class="mt-di">${(mg.present !== mb.present) && !(mg.present ? mg : mb).cancelled ? '!' : '✓'}</span><div><b>Manglik (Kuja) dosha</b>${mline(nm, mg, KM_COL[1])}${mline(nf, mb, KM_COL[2])}<p>${mVerdict}</p></div></div>`
    + card(!D.nadi.present, 'Nadi', D.nadi.present ? `Both share the same Nadi (${R.k[7].a}).${D.nadi.cancel.length ? ' Possible cancellation: ' + D.nadi.cancel.join(' / ') + '.' : ''}` : `Different Nadis (${R.k[7].a} · ${R.k[7].b}) — full 8 points.`)
    + card(!D.bhakoot.present, 'Bhakoot', D.bhakoot.present ? `${R.k[6].note} between the Moon signs.${D.bhakoot.cancel.length ? ' Possible cancellation: ' + D.bhakoot.cancel[0] + '.' : ''}` : `${R.k[6].note} — no Bhakoot dosha.`)
    + card(!D.gana.present, 'Gana', D.gana.present ? `Temperament mismatch: ${D.gana.a} with ${D.gana.b}.` : `${D.gana.a} with ${D.gana.b} — compatible.`);
  const B = R.bonus;
  const bonus = card(B.rajju.ok, 'Rajju', B.rajju.ok ? `Different Rajju (${B.rajju.a} · ${B.rajju.b}).` : `Same Rajju (${B.rajju.a}) — traditionally unfavourable.`)
    + card(B.mahendra.ok, 'Mahendra', B.mahendra.ok ? `Bride's nakshatra counts ${B.mahendra.count} to the groom's — favourable.` : `Count ${B.mahendra.count} — not in the favourable set (4, 7, 10, 13, 16, 19, 22, 25).`);
  return `<div class="mt-res-wrap">
    <div class="mt-score" style="--vc:${col}">
      <div class="mt-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg" stroke-dasharray="${(pct * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 60 60)"/></svg>
        <div class="mt-rt"><b>${R.total % 1 ? R.total.toFixed(1) : R.total}</b><small>out of 36</small></div></div>
      <div class="mt-vd"><h4>${R.verdict[0]}</h4><span>${Math.round(pct * 100)}% compatibility</span>
        <div class="mt-pair">${person(R.G, KM_COL[1])}<span class="mt-amp">&amp;</span>${person(R.B, KM_COL[2])}</div></div>
    </div>
    <div class="mt-sec"><h5>Ashtakoota <span>8 factors · 36 points</span></h5><div class="mt-kgrid">${cards}</div></div>
    <div class="mt-sec"><h5>Dosha check <span>things worth a closer look</span></h5><div class="mt-dgrid">${dos}</div></div>
    <div class="mt-sec"><h5>Bonus checks <span>commonly used in South Indian matching</span></h5><div class="mt-dgrid">${bonus}</div></div>
    <div class="mt-actions"><button type="button" class="export-download-btn export-ghost" data-mt-copy>📋 Copy summary</button></div>
    <div class="pn-note">Guideline: 33–36 excellent, 25–32 very good, 18–24 acceptable, below 18 low. Scores use the Moon sign and nakshatra of each chart (Lahiri). Person 1 is treated as the groom side and Person 2 as the bride side for the factors that are direction-dependent (Varna, Vashya, Tara, Yoni, Gana, Bhakoot) — use ⇄ to swap. Traditions differ on some tables and cancellation rules; this follows the commonly published standard.</div>
  </div>`;
}
function mtCopyText(R){
  const nm = R.G.profile.name || 'Person 1', nf = R.B.profile.name || 'Person 2';
  return [`Kundali Matching — ${nm} & ${nf}`, `Total: ${R.total} / 36 (${R.verdict[0]})`, '', ...R.k.map(x => `${x.key}: ${x.score}/${x.max}  (${x.a} | ${x.b})`), '',
    `Manglik: ${nm} ${R.dosha.manglik.g.level}, ${nf} ${R.dosha.manglik.b.level}`, `Nadi dosha: ${R.dosha.nadi.present ? 'yes' : 'no'}  Bhakoot dosha: ${R.dosha.bhakoot.present ? 'yes' : 'no'}  Gana mismatch: ${R.dosha.gana.present ? 'yes' : 'no'}`,
    `Rajju: ${R.bonus.rajju.ok ? 'ok' : 'same'}  Mahendra: ${R.bonus.mahendra.ok ? 'ok' : 'no'}`].join('\n');
}
document.addEventListener('click', (e) => {
  if (!MT) return;
  const mode = e.target.closest('[data-mt-mode]');
  if (mode){ const [i, m] = mode.dataset.mtMode.split(':'); MT[i].mode = m; mtRenderCard(+i); mtUpdateGo(); return; }
  const pick = e.target.closest('[data-mt-pick]');
  if (pick){ const [i, idx] = pick.dataset.mtPick.split(':'); MT[i].profile = MT.list[+idx]; mtRenderCard(+i); mtUpdateGo(); return; }
  const ml = e.target.closest('[data-mt-loc]');
  if (ml){
    const [i, mode] = ml.dataset.mtLoc.split(':'), d = MT[i].draft, LPk = (window.parent && window.parent!==window) ? window.parent.LocPicker : null;
    if (!LPk){ APP.toast('Map picker is available in the full app', 'info'); return; }
    LPk.open({mode, lat:d.lat, lon:d.lon, name:d.place, title:'Place of birth', onPick: r => { d.lat = parseFloat(r.lat); d.lon = parseFloat(r.lon); d.place = r.display_name; d.tz = estimateTz(d.lat, d.lon, r); mtRenderCard(+i); mtUpdateGo(); }});
    return;
  }
  const rp = e.target.closest('[data-mt-rpick]');
  if (rp){
    const [i, n] = rp.dataset.mtRpick.split(':'), x = MT.results[i][+n], d = MT[i].draft;
    d.lat = parseFloat(x.lat); d.lon = parseFloat(x.lon); d.place = x.display_name; d.tz = estimateTz(d.lat, d.lon, x);
    mtRenderCard(+i); mtUpdateGo(); return;
  }
  if (e.target.closest('[data-mt-swap]')){ const t = MT[1]; MT[1] = MT[2]; MT[2] = t; mtRenderCard(1); mtRenderCard(2); mtUpdateGo(); if (MT.last) mtRun(); return; }
  if (e.target.closest('[data-mt-go]')){ mtRun(); return; }
  if (e.target.closest('[data-mt-copy]') && MT.last){ APP.copy(mtCopyText(MT.last)).then(ok => APP.toast(ok ? 'Summary copied ✓' : 'Could not copy', ok ? 'success' : 'error')); }
});
function mtOnField(e){
  if (!MT) return;
  const t = e.target, card = t.closest && t.closest('.mt-card'); if (!card) return;
  const i = +card.id.replace('mtCard', ''), d = MT[i].draft;
  if (t.dataset.mtPlace !== undefined){
    d.place = t.value; d.lat = null; d.lon = null; mtUpdateGo();
    const c = document.getElementById('mtCoord' + i); if (c){ c.textContent = 'Location not selected yet'; c.classList.remove('ok'); }
    clearTimeout(MT.timers[i]); MT.timers[i] = setTimeout(() => mtSearch(i, t.value), 450); return;
  }
  const f = t.dataset.mtF; if (!f) return;
  if (f === 'save') d.save = t.checked;
  else if (f === 'lat' || f === 'lon'){ d[f] = t.value === '' ? null : parseFloat(t.value); const c = document.getElementById('mtCoord' + i); if (c){ const ok = d.lat !== null && d.lon !== null; c.textContent = ok ? `✓ ${(+d.lat).toFixed(3)}°, ${(+d.lon).toFixed(3)}°` : 'Location not selected yet'; c.classList.toggle('ok', ok); } }
  else if (f === 'tz') d.tz = parseFloat(t.value);
  else d[f] = t.value;
  mtUpdateGo();
}
document.addEventListener('input', mtOnField); document.addEventListener('change', mtOnField);


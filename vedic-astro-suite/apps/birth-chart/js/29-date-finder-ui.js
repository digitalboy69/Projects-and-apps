/* ---------- UI ---------- */
const dfState = { res: null, shown: 40, run: 0 };
function dfPlace(){
  try {
    if (typeof selectedLat !== 'undefined' && selectedLat != null && selectedLon != null){
      const tz = parseFloat(document.getElementById('tzInput').value);
      if (isFinite(tz)) return { lat: +selectedLat, lon: +selectedLon, tz, label: (placeInput && placeInput.value) ? placeInput.value : 'the place chosen on the form' };
    }
    const p = currentProfileForExport;
    if (p && isFinite(p.lat) && isFinite(p.lon) && isFinite(p.tz)) return { lat: +p.lat, lon: +p.lon, tz: +p.tz, label: p.place || 'your chart place' };
  } catch(e){}
  return { lat: 22.0, lon: 79.0, tz: 5.5, label: 'central India (default)', dflt: true };
}
function dfEsc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function dfFmtDate(y, m, d, wd){ return `${PN_VARA[wd][1].slice(0, 3)}, ${d} ${PN_MON[m - 1]} ${y}`; }
function dfFmtT(jd, tz, dateStr){ if (jd == null || !isFinite(jd)) return '—'; const p = jdToLocalParts(jd, tz), t = p.timeStr.slice(0, 5); return p.dateStr === dateStr ? t : `${t} (${p.dateStr.slice(8)} ${PN_MON[+p.dateStr.slice(5, 7) - 1]})`; }

function dfPlaceNote(){
  const el = document.getElementById('dfPlace'); if (!el) return;
  const pl = dfPlace();
  el.innerHTML = `📍 Sunrise is worked out for <b>${dfEsc(pl.label)}</b>${pl.dflt ? ' — pick the birth place on the form for exact sunrise' : ''}.`;
}
function dfBuild(pane){
  const had = document.getElementById('dfRoot'); if (had){ pane.appendChild(had); return; }   // already built (e.g. opened from the form before any chart)
  const p = document.createElement('div'); p.id = 'dfRoot'; pane.appendChild(p);
  const opt = (arr, first) => (first ? `<option value="">${first}</option>` : '') + arr.map((t, i) => `<option value="${i}">${dfEsc(t)}</option>`).join('');
  const signs = SIGNS.map(s => `${s.symbol} ${s.name}`);
  p.innerHTML = `
  <div class="rs-pane-head"><h3>🔎 Date Finder</h3><p>Not sure of the birth date? Add whatever the family remembers: full moon, a festival, the weekday… We check every day and list the ones that fit.</p></div>
  <details class="rs-how"><summary>💡 How it works (and how far to trust it)</summary>
    <p>You give a range of years and any clues. For every day in that range we work out the tithi, weekday, nakshatra, Moon sign, lunar month, festivals, eclipses and where Saturn, Jupiter and Rahu were (Lahiri, same engine as the rest of the app). A day is listed when it fits <b>all</b> your clues. With 3 or more clues we also show days that miss <b>just one</b> (memory is often slightly wrong), clearly marked.
    More clues = fewer dates. <b>Amavasya + Sunday + Diwali</b> within a few years usually gives one or two days.</p>
    <p><b>Good to know:</b> a day runs from sunrise to the next sunrise, so a tithi counts if it is active at sunrise <i>or</i> at some time that day. If the baby was born after midnight but before sunrise, also check the next date. Festival days follow the usual panchang rules; some regions keep a festival one day earlier or later, so use “± 1 day”. Eclipses are those visible somewhere on Earth (not checked for your town). Sunrise uses the place on the birth form (central India if none).</p></details>
  <div class="df-card"><h4>1 · Which years? <small>required</small></h4>
    <div class="df-grid"><label class="df-f">From year<input id="dfY0" type="number" inputmode="numeric" min="1900" max="2050" placeholder="e.g. 1968"></label>
    <label class="df-f">To year<input id="dfY1" type="number" inputmode="numeric" min="1900" max="2050" placeholder="e.g. 1972"></label></div>
    <div class="df-place" id="dfPlace"></div></div>
  <div class="df-card"><h4>2 · What do they remember?</h4>
    <div class="df-pills" id="dfQuick"><span class="df-pl">Quick:</span>
      <button type="button" class="df-pill" data-q="amav">🌑 Amavasya</button><button type="button" class="df-pill" data-q="purn">🌕 Purnima</button><button type="button" class="df-pill" data-q="ekad">Ekadashi</button>
      <button type="button" class="df-pill" data-q="shani">Shani Amavasya</button><button type="button" class="df-pill" data-q="somv">Somvati Amavasya</button><button type="button" class="df-pill" data-q="gurup">Guru Pushya</button><button type="button" class="df-pill" data-q="ravip">Ravi Pushya</button></div>
    <div class="df-grid">
      <label class="df-f">Paksha (moon phase)<select id="dfPak"><option value="">Any</option><option value="S">Shukla · growing moon</option><option value="K">Krishna · fading moon</option></select></label>
      <label class="df-f">Tithi<select id="dfTithi"><option value="">Any</option>${PN_TITHI.map((t, i) => `<option value="${i + 1}">${i + 1} · ${t}</option>`).join('')}<option value="P">🌕 Purnima (full moon)</option><option value="A">🌑 Amavasya (new moon)</option></select></label>
      <label class="df-f">Weekday<select id="dfWd"><option value="">Any</option>${PN_VARA.map((v, i) => `<option value="${i}">${v[1]}</option>`).join('')}</select></label>
      <label class="df-f">Festival<select id="dfFest"><option value="">None</option>${DF_FEST.map(f => `<option value="${f[0]}">${dfEsc(f[1])}</option>`).join('')}</select></label>
      <label class="df-f">How close to the festival / eclipse?<select id="dfTol"><option value="0">Same day</option><option value="1" selected>± 1 day</option><option value="2">± 2 days</option><option value="3">± 3 days</option><option value="7">± 1 week</option><option value="15">± 2 weeks</option></select></label>
    </div>
    <details class="df-more"><summary>More clues (eclipse, nakshatra, Moon sign, month, Saturn, Jupiter…)</summary>
      <div class="df-grid">
        <label class="df-f">Eclipse (grahan)<select id="dfEcl"><option value="">None</option><option value="solar">☀ Solar eclipse</option><option value="lunar">🌙 Lunar eclipse</option><option value="either">Either one</option></select></label>
        <label class="df-f">Nakshatra (birth star)<select id="dfNak">${opt(NAKSHATRAS.map(x => x.name), 'Any')}</select></label>
        <label class="df-f">Moon sign (rashi)<select id="dfMoon">${opt(signs, 'Any')}</select></label>
        <label class="df-f">Hindu lunar month<select id="dfMasa">${opt(PN_MASA, 'Any')}</select></label>
        <label class="df-f">Sun sign (Tamil / Malayalam month)<select id="dfSun">${opt(signs, 'Any')}</select></label>
        <label class="df-f">Year name (Samvatsara)<select id="dfSam">${opt(DF_SAM.map((s, i) => `${i + 1} · ${s}`), 'Any')}</select></label>
        <label class="df-f">Month (English)<select id="dfMon">${opt(PN_MON, 'Any').replace(/value="(\d+)"/g, (m0, v) => `value="${+v + 1}"`)}</select></label>
        <label class="df-f">Date number (1–31)<input id="dfDom" type="number" inputmode="numeric" min="1" max="31" placeholder="e.g. 14"></label>
        <label class="df-f">Saturn was in<select id="dfSat">${opt(signs, 'Any')}</select></label>
        <label class="df-f">Jupiter was in<select id="dfJup">${opt(signs, 'Any')}</select></label>
        <label class="df-f">Rahu was in<select id="dfRahu">${opt(signs, 'Any')}</select></label>
      </div>
      <label class="df-chk"><input type="checkbox" id="dfPurn"> Use North-India month names (Purnimanta: the fading half belongs to the next month)</label>
    </details></div>
  <div class="df-actions"><button type="button" class="btn btn-primary" id="dfRun">🔎 Find possible dates</button><button type="button" class="btn btn-ghost" id="dfClear">Clear</button><span class="df-count" id="dfCount"></span></div>
  <div id="dfOut"></div>`;
  const $ = id => p.querySelector('#' + id), val = id => $(id).value;
  const set = (id, v) => { $(id).value = v; };
  const count = () => {
    const ids = ['dfPak', 'dfTithi', 'dfWd', 'dfFest', 'dfEcl', 'dfNak', 'dfMoon', 'dfMasa', 'dfSun', 'dfSam', 'dfMon', 'dfDom', 'dfSat', 'dfJup', 'dfRahu'];
    let c = 0; ids.forEach(i => { if (val(i) !== '' && !(i === 'dfPak' && val('dfTithi') !== '')) c++; });
    $('dfCount').textContent = c ? `${c} clue${c > 1 ? 's' : ''} set` : 'Add at least one clue';
  };
  const clear = () => { p.querySelectorAll('select').forEach(s => { s.selectedIndex = 0; }); set('dfTol', '1'); p.querySelectorAll('input[type=number]').forEach(i => { if (i.id !== 'dfY0' && i.id !== 'dfY1') i.value = ''; }); $('dfPurn').checked = false; count(); };
  p.addEventListener('input', count); p.addEventListener('change', count);
  dfPlaceNote(); count();
  const dob = (currentProfileForExport && currentProfileForExport.dob) || (document.getElementById('dobInput') || {}).value;
  if (dob && /^\d{4}/.test(dob)){ const y = +dob.slice(0, 4); set('dfY0', y - 1); set('dfY1', y + 1); }
  const Q = {
    amav: () => { clear(); set('dfTithi', 'A'); }, purn: () => { clear(); set('dfTithi', 'P'); }, ekad: () => { clear(); set('dfTithi', '11'); },
    shani: () => { clear(); set('dfTithi', 'A'); set('dfWd', '6'); }, somv: () => { clear(); set('dfTithi', 'A'); set('dfWd', '1'); },
    gurup: () => { clear(); set('dfNak', '7'); set('dfWd', '4'); }, ravip: () => { clear(); set('dfNak', '7'); set('dfWd', '0'); }
  };
  $('dfQuick').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b){ Q[b.dataset.q](); count(); } });
  $('dfClear').addEventListener('click', () => { clear(); $('dfOut').innerHTML = ''; dfState.res = null; });
  $('dfRun').addEventListener('click', () => dfRun(p));
  p.addEventListener('click', e => {
    const use = e.target.closest('[data-df-use]'); if (use){ dfUse(use.dataset.dfUse); return; }
    const mo = e.target.closest('[data-df-more]'); if (mo){ dfDetail(p, +mo.dataset.dfMore, mo); return; }
    if (e.target.closest('#dfShowMore')){ dfState.shown += 40; dfRender(p); }
    const al = e.target.closest('#dfAlmostBtn'); if (al){ dfState.showAlmost = !dfState.showAlmost; dfRender(p); }
  });
}
function dfRead(p){
  const val = id => p.querySelector('#' + id).value, pl = dfPlace();
  let y0 = parseInt(val('dfY0'), 10), y1 = parseInt(val('dfY1'), 10);
  if (!isFinite(y0) && !isFinite(y1)){ rsToast('Enter the years first (e.g. 1968 to 1972) 📅'); return null; }
  if (!isFinite(y0)) y0 = y1; if (!isFinite(y1)) y1 = y0;
  if (y0 > y1){ const t = y0; y0 = y1; y1 = t; }
  if (y0 < 1900 || y1 > 2050){ rsToast('Please use years between 1900 and 2050'); return null; }
  if (y1 - y0 > 40){ rsToast('Please keep it within 40 years — add a narrower range'); return null; }
  const q = { y0, y1, lat: pl.lat, lon: pl.lon, tz: pl.tz, pak: val('dfPak'), tithi: val('dfTithi'), wd: val('dfWd'), fest: val('dfFest'), tol: val('dfTol'), ecl: val('dfEcl'), nak: val('dfNak'), moon: val('dfMoon'), masa: val('dfMasa'), sun: val('dfSun'), sam: val('dfSam'), mon: val('dfMon'), dom: val('dfDom'), sat: val('dfSat'), jup: val('dfJup'), rahu: val('dfRahu'), purn: p.querySelector('#dfPurn').checked };
  const any = q.pak || q.tithi || q.wd || q.fest || q.ecl || q.nak || q.moon || q.masa || q.sun || q.sam || q.mon || q.dom || q.sat || q.jup || q.rahu;
  if (!any){ rsToast('Add at least one clue (like Amavasya or a weekday) ✨'); return null; }
  return q;
}
function dfRun(p){
  const q = dfRead(p); if (!q) return;
  const out = p.querySelector('#dfOut'), run = ++dfState.run, g = dfGen(q);
  out.innerHTML = `<div class="df-prog"><div class="df-bar"><i id="dfBar" style="width:2%"></i></div><span>Looking through ${(q.y1 - q.y0 + 1) * 365} days…</span></div>`;
  const step = () => {
    if (run !== dfState.run) return;
    let r; const t0 = performance.now();
    try { do { r = g.next(); } while (!r.done && performance.now() - t0 < 40); }
    catch(e){ console.error('Date Finder', e); out.innerHTML = '<div class="df-empty">Something went wrong while searching. Please try a smaller range.</div>'; return; }
    if (r.done){ dfState.res = r.value; dfState.shown = 40; dfState.showAlmost = r.value.nFull === 0; dfRender(p); return; }
    const bar = p.querySelector('#dfBar'); if (bar) bar.style.width = Math.max(2, Math.round(r.value * 100)) + '%';
    setTimeout(step, 0);
  };
  setTimeout(step, 20);
}
function dfRender(p){
  const R = dfState.res, out = p.querySelector('#dfOut'); if (!R) return;
  const full = R.rows.filter(r => r.miss === 0), almost = R.rows.filter(r => r.miss > 0);
  const card = r => {
    const inf = dfInfo(R.ctx, r.i), miss = r.chips.filter(c => !c.ok).map(c => c.txt);
    return `<div class="df-res${r.miss ? ' near' : ''}"><div class="df-res-top"><div><div class="df-date">${dfFmtDate(inf.y, inf.m, inf.d, inf.wd)}</div>
      <div class="df-sub">${dfEsc(inf.tithi)} · ${dfEsc(inf.nak)} · ${inf.moonSign.symbol} Moon in ${inf.moonSign.name} · ${dfEsc(inf.masa)}${inf.adhika ? ' (Adhika)' : ''}</div></div>
      <div class="df-res-act"><button type="button" class="btn btn-primary" data-df-use="${r.date}">Use this date</button><button type="button" class="btn btn-ghost" data-df-more="${r.i}">Details</button></div></div>
      <div class="df-chips">${r.chips.map(c => `<span class="df-chip ${c.ok ? 'ok' : 'bad'}">${c.ok ? '✓' : '✕'} ${dfEsc(c.txt)}</span>`).join('')}${inf.fests.map(f => `<span class="df-chip fest">🎉 ${dfEsc(f)}</span>`).join('')}${inf.ecl.map(f => `<span class="df-chip fest">🌘 ${dfEsc(f)}</span>`).join('')}</div>
      ${r.miss ? `<div class="df-miss">Close match: does not fit ${dfEsc(miss.join(', '))}</div>` : ''}<div class="df-detail" id="dfD${r.i}" hidden></div></div>`;
  };
  let html = '';
  if (!full.length) html += `<div class="df-empty">No day fits <b>all</b> the clues in these years.${almost.length ? ' Below are days that miss just one clue.' : ' Try a wider range of years, fewer clues, or a bigger “how close” setting.'}</div>`;
  else html += `<div class="df-summary"><b>${full.length}</b> possible date${full.length > 1 ? 's' : ''} found${full.length > 12 ? ' — add more clues to narrow it down' : ''}.</div>${full.slice(0, dfState.shown).map(card).join('')}`;
  if (full.length > dfState.shown) html += `<button type="button" class="btn btn-ghost df-showmore" id="dfShowMore">Show more (${full.length - dfState.shown} left)</button>`;
  if (almost.length && full.length) html += `<button type="button" class="btn btn-ghost df-showmore" id="dfAlmostBtn">${dfState.showAlmost ? 'Hide' : 'Show'} ${almost.length} close match${almost.length > 1 ? 'es' : ''} (miss one clue)</button>`;
  if (almost.length && (dfState.showAlmost || !full.length)) html += `<div class="df-near-h">Close matches · miss one clue</div>${almost.slice(0, dfState.shown).map(card).join('')}`;
  out.innerHTML = html;
}
function dfDetail(p, i, btn){
  const R = dfState.res, box = p.querySelector('#dfD' + i); if (!R || !box) return;
  if (!box.hidden){ box.hidden = true; btn.textContent = 'Details'; return; }
  const ctx = R.ctx, q = ctx.q, inf = dfInfo(ctx, i), dateStr = ctx.dt(i).slice(0, 3).map((x, k) => k ? String(x).padStart(2, '0') : x).join('-');
  let pn = null; try { pn = panchangaAt(ctx.srj[i] + 0.01, q.lat, q.lon, q.tz); } catch(e){}
  const row = (a, b) => `<div class="df-drow"><span>${a}</span><b>${b}</b></div>`;
  let h = '';
  if (pn){
    h += row('Tithi', `${dfEsc(pn.tithi.paksha)} ${dfEsc(pn.tithi.name)} · ${dfFmtT(pn.tithi.start, q.tz, dateStr)} → ${dfFmtT(pn.tithi.end, q.tz, dateStr)}`);
    h += row('Nakshatra', `${dfEsc(pn.nakshatra.name)} (pada ${pn.nakshatra.pada}) · until ${dfFmtT(pn.nakshatra.end, q.tz, dateStr)}`);
    h += row('Yoga · Karana', `${dfEsc(pn.yoga.name)} · ${dfEsc(pn.karana.name)}`);
    h += row('Sunrise · Sunset', `${dfFmtT(pn.sunrise, q.tz, dateStr)} · ${dfFmtT(pn.sunset, q.tz, dateStr)}`);
  }
  h += row('Lunar month · year', `${dfEsc(inf.masa)}${inf.adhika ? ' (Adhika)' : ''} · ${dfEsc(inf.sam)} samvatsara`);
  h += row('Sun · Saturn · Jupiter · Rahu', `${inf.sun.symbol} ${inf.sun.name} · ${inf.sat.symbol} ${inf.sat.name} · ${inf.jup.symbol} ${inf.jup.name} · ${inf.rahu.symbol} ${inf.rahu.name}`);
  h += `<div class="df-tip">Next: press <b>Use this date</b>, then open <b>Time Dial</b> or <b>Sandhi Table</b> to find the time. Tithi and nakshatra end times above show which part of the day fits your clues.</div>`;
  box.innerHTML = h; box.hidden = false; btn.textContent = 'Hide details';
}
/* The same Date Finder also opens as a popup from the birth form, so it can be used before any chart exists. */
function dfModalOpen(){ const m = document.getElementById('dfModal'); return !!(m && m.classList.contains('show')); }
function dfOpenModal(){
  let m = document.getElementById('dfModal');
  if (!m){
    m = document.createElement('div'); m.id = 'dfModal'; m.className = 'df-modal';
    m.innerHTML = '<div class="df-modal-box" role="dialog" aria-modal="true" aria-label="Date Finder"><button type="button" class="df-x" id="dfX" aria-label="Close">✕</button><div id="dfModalBody"></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('#dfX')) dfCloseModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && dfModalOpen()) dfCloseModal(); });
  }
  const body = document.getElementById('dfModalBody'); let root = document.getElementById('dfRoot');
  if (!root){ dfBuild(body); root = document.getElementById('dfRoot'); } else body.appendChild(root);
  const head = root.querySelector('.rs-pane-head'); if (head) head.style.paddingRight = '44px';
  dfPlaceNote(); m.classList.add('show'); document.body.style.overflow = 'hidden';
}
function dfCloseModal(){
  const m = document.getElementById('dfModal'); if (!m) return;
  m.classList.remove('show'); document.body.style.overflow = '';
  const root = document.getElementById('dfRoot'), pane = document.querySelector('.rs-pane[data-rs-pane="dates"]');
  if (root && pane) pane.appendChild(root);
}
function dfUse(dateStr){
  const el = document.getElementById('dobInput'); if (!el) return;
  el.value = dateStr;
  ['input', 'change'].forEach(ev => el.dispatchEvent(new Event(ev, { bubbles: true })));
  try { inSyncFriendly(); } catch(e){}
  rsToast('Birth date set to ' + dateStr + '. Now add the place and time ✨');
  const wasModal = dfModalOpen(); if (wasModal) dfCloseModal();
  try { if (!wasModal) switchAppTab('panel-home'); const f = document.getElementById('birthForm'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(e){}
}


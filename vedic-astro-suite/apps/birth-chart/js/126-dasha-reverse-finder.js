/* ============================================================================
   DASHA REVERSE FINDER (Rectify tab "Dasha Reverse")
   You know the birth DATE and PLACE but not the time. You know which Vimshottari periods were running at some moment
   (Mahadasha required; Antardasha, Pratyantar, Sookshma, Prana, Deha optional). Every birth time of that day is tried;
   the times at which the Dasha chain at your moment equals the planets you picked are returned as time windows.
   Uses the app's own engine (moonLongitude, lahiriAyanamsa, calculateVimshottariDasha, findActiveDasha), so it agrees
   with the chart and the Dasha Lens exactly. The Moon is interpolated between exact 30-second values (error < 0.001 arcsec).
   ============================================================================ */
const DREV_NAMES = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
const DREV_GLYPH = { Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋' };
const DREV_LEVELS = ['Mahadasha','Antardasha','Pratyantar','Sookshma','Prana','Deha'];
const DREV_YEARS = { Ketu:7, Venus:20, Sun:6, Moon:10, Mars:7, Rahu:18, Jupiter:16, Saturn:19, Mercury:17 };

/* ------------------------------ engine ------------------------------ */
function drevChainOf(a){
  const x = [a.mahadasha, a.antardasha, a.pratyantardasha, a.sookshmaDasha, a.pranaDasha, a.dehaDasha];
  return x.map(p => p ? p.lord : null);
}
/* Dasha chain at `eventDate` if the Moon (sidereal) was `moonLon` at `birthDate`. */
function drevChainAt(moonLon, birthDate, eventDate){
  const dd = calculateVimshottariDasha(moonLon, birthDate);
  const a = findActiveDasha(dd.mahadashas, eventDate);
  return a ? drevChainOf(a) : null;
}
function drevMatches(chain, want){
  if (!chain) return false;
  for (let i = 0; i < want.length; i++) if (want[i] && chain[i] !== want[i]) return false;
  return true;
}
/* Moon sidereal longitude every 30 s over the window (exact engine values); linear interpolation between them. */
function drevMoonTable(jd0, fromSec, toSec){
  const STEP = 30, n = Math.ceil((toSec - fromSec) / STEP) + 2, tab = new Float64Array(n);
  let prev = null, add = 0;
  for (let i = 0; i < n; i++){
    const jd = jd0 + (fromSec + i * STEP) / 86400;
    let L = normDeg(moonLongitude(jd) - lahiriAyanamsa(jd));
    if (prev !== null && L - prev < -180) add += 360;   // unwrap 360 -> 0
    prev = L; tab[i] = L + add;
  }
  return { at: (sec) => { const x = (sec - fromSec) / STEP, i = Math.max(0, Math.min(n - 2, Math.floor(x))); return normDeg(tab[i] + (tab[i+1] - tab[i]) * (x - i)); },
           exact: (sec) => { const jd = jd0 + sec / 86400; return normDeg(moonLongitude(jd) - lahiriAyanamsa(jd)); } };
}
/* Search step in seconds: a fraction of the width (in birth-time seconds) of the deepest level chosen. */
function drevStepFor(want, moonSpeedDegPerSec){
  let k = -1; for (let i = 0; i < want.length; i++) if (want[i]) k = i;
  let days = 365.25 * DREV_YEARS[want[0]];
  for (let i = 1; i <= k; i++) days *= (DREV_YEARS[want[i]] || 9) / 120;   // average over the level if a lord was skipped is not needed: skipped levels shrink only the window estimate
  // days the whole timeline slides per second of birth-time error (worst case: a 20-year lord at birth)
  const slide = 365.25 * 20 * moonSpeedDegPerSec / (360 / 27);
  const w = days / slide;                       // width of the matching window in seconds
  return Math.max(0.25, Math.min(60, w / 6));
}
/* opts: { birthJD0 (UT Julian Day of local midnight of the birth date), eventDate (Date), want[6], fromSec, toSec (local seconds in the day), onProgress, token } */
async function drevSearch(opts){
  const { birthJD0, eventDate, want, fromSec, toSec, onProgress, token } = opts;
  const moon = drevMoonTable(birthJD0, fromSec, toSec);
  const speed = Math.abs(moon.at(fromSec + 30) - moon.at(fromSec)) / 30 || 0.00015;
  const step = drevStepFor(want, speed), runs = [];
  const birthAt = sec => new Date((birthJD0 + sec / 86400 - 2440587.5) * 86400000);
  const test = sec => drevMatches(drevChainAt(moon.at(sec), birthAt(sec), eventDate), want);
  let inRun = false, runStart = null, lastNo = fromSec, count = 0, t = fromSec;
  const refine = (a, b, wantMatchAtB) => {          // a: state != b state; find the flip to 0.01 s
    let lo = a, hi = b;
    for (let i = 0; i < 40 && hi - lo > 0.005; i++){ const m = (lo + hi) / 2; if (test(m) === wantMatchAtB) hi = m; else lo = m; }
    return (lo + hi) / 2;
  };
  for (; t <= toSec; t += step){
    const m = test(t);
    if (m && !inRun){ inRun = true; runStart = t === fromSec ? fromSec : refine(t - step, t, true); }
    else if (!m && inRun){ inRun = false; runs.push([runStart, refine(t - step, t, false)]); }
    if (++count % 4000 === 0){
      if (token && token.cancel) return null;
      onProgress && onProgress((t - fromSec) / (toSec - fromSec));
      await new Promise(r => setTimeout(r, 0));
    }
  }
  if (inRun) runs.push([runStart, toSec]);
  return { runs: runs.map(([a, b]) => ({ start: a, end: b, mid: (a + b) / 2, moon: moon.exact((a + b) / 2) })), step, tried: count };
}

/* ------------------------------ UI ------------------------------ */
const drevState = { run: 0, token: { cancel: false } };
function drevEsc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }
function drevPad(n){ return String(n).padStart(2, '0'); }
function drevClock(sec){ sec = Math.max(0, Math.min(86399.99, sec)); const t = Math.round(sec * 100) / 100, h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return `${drevPad(h)}:${drevPad(m)}:${drevPad(Math.floor(s))}${s % 1 ? '.' + String(Math.round((s % 1) * 100)).padStart(2, '0') : ''}`; }
function drevPlace(){ try { return typeof dfPlace === 'function' ? dfPlace() : { lat: 22, lon: 79, tz: 5.5, label: 'default', dflt: true }; } catch(e){ return { lat: 22, lon: 79, tz: 5.5, label: 'default', dflt: true }; } }
function drevBuild(pane){
  if (document.getElementById('drevRoot')) return;
  const root = document.createElement('div'); root.id = 'drevRoot'; pane.appendChild(root);
  const opts = '<option value="">— not sure —</option>' + DREV_NAMES.map(n => `<option value="${n}">${DREV_GLYPH[n]} ${n}</option>`).join('');
  const rows = DREV_LEVELS.map((n, i) => `<label class="drev-lv"><span class="drev-ln"><i>${i + 1}</i>${n}${i === 0 ? ' <em>required</em>' : ''}</span>
      <select id="drevL${i}" ${i === 0 ? '' : ''}>${i === 0 ? opts.replace('<option value="">— not sure —</option>', '<option value="">Choose…</option>') : opts}</select></label>`).join('');
  root.innerHTML = `
  <div class="rs-pane-head"><span class="rs-ph-ico">🔁</span><div class="rs-ph-txt"><h3>Dasha Reverse</h3><p>Know the dasha at a moment but not the birth time? Pick the planets and get the birth time back.</p></div></div>
  <details class="rs-how"><summary>💡 How it works</summary>
    <p>The whole Vimshottari timeline slides with the birth time (about 2 hours of dasha for every second of birth time). We try every second of the birth day and keep the times for which the Dasha running at <b>your moment</b> has exactly the planets you picked.</p>
    <p>Fill only the levels you are sure of. <b>Mahadasha alone</b> gives wide windows. Adding <b>Antardasha, Pratyantar, Sookshma, Prana</b> narrows it to a few minutes or seconds. If you leave a level blank, any planet is accepted there.</p></details>
  <div class="df-card"><h4>1 · Birth date <small>known</small></h4>
    <div class="df-grid"><label class="df-f">Date of birth<input id="drevDob" type="date"></label>
    <label class="df-f">Search between<span class="drev-two"><input id="drevFrom" type="time" step="1" value="00:00:00"><input id="drevTo" type="time" step="1" value="23:59:59"></span></label></div>
    <div class="df-place" id="drevPlace"></div></div>
  <div class="df-card"><h4>2 · The moment you know <small>date and time</small></h4>
    <div class="df-grid"><label class="df-f">Date<input id="drevEvDate" type="date"></label><label class="df-f">Time<input id="drevEvTime" type="time" step="1" value="12:00:00"></label></div>
    <div class="drev-note">Time is read in the birth place's timezone <span id="drevTz"></span>.</div></div>
  <div class="df-card"><h4>3 · Dasha planets at that moment <small>Mahadasha required, rest optional</small></h4><div class="drev-levels">${rows}</div>
    <button type="button" class="drev-clear" id="drevClear">Clear levels 2 to 6</button></div>
  <button type="button" class="btn btn-primary drev-go" id="drevGo">🔁 Find birth time</button>
  <div class="drev-out" id="drevOut"></div>`;
  const q = id => root.querySelector('#' + id);
  const fill = () => {
    const pl = drevPlace(); q('drevPlace').innerHTML = `📍 Place used: <b>${drevEsc(pl.label)}</b>${pl.dflt ? ' (default: pick the birth place on the form)' : ''}`;
    const h = Math.abs(pl.tz), hh = Math.floor(h), mm = Math.round((h - hh) * 60); q('drevTz').textContent = `(UTC${pl.tz < 0 ? '−' : '+'}${hh}${mm ? ':' + drevPad(mm) : ''})`;
    const dob = document.getElementById('dobInput'); if (dob && dob.value && !q('drevDob').value) q('drevDob').value = dob.value;
    if (!q('drevEvDate').value){ const n = new Date(); q('drevEvDate').value = `${n.getFullYear()}-${drevPad(n.getMonth() + 1)}-${drevPad(n.getDate())}`; }
  };
  fill(); root._fill = fill;
  q('drevClear').addEventListener('click', () => { for (let i = 1; i < 6; i++) q('drevL' + i).value = ''; });
  q('drevGo').addEventListener('click', () => drevRun(root));
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-drev-use]'); if (!b) return;
    const t = document.getElementById('tobInput'); if (!t) return;
    const sec = Math.round(parseFloat(b.dataset.drevUse));
    t.value = `${drevPad(Math.floor(sec / 3600))}:${drevPad(Math.floor(sec % 3600 / 60))}:${drevPad(sec % 60)}`;
    t.dispatchEvent(new Event('input', { bubbles: true })); t.dispatchEvent(new Event('change', { bubbles: true }));
    try { rsToast('Birth time set to ' + t.value); } catch(e2){}
  });
}
function drevOnShow(){ const r = document.getElementById('drevRoot'); if (r && r._fill) r._fill(); }
async function drevRun(root){
  const q = id => root.querySelector('#' + id), out = q('drevOut'), pl = drevPlace();
  const want = DREV_LEVELS.map((_, i) => q('drevL' + i).value || null);
  if (!want[0]){ out.innerHTML = '<div class="drev-msg err">Choose the Mahadasha planet first.</div>'; return; }
  const dob = q('drevDob').value, evd = q('drevEvDate').value, evt = q('drevEvTime').value || '12:00:00';
  if (!dob){ out.innerHTML = '<div class="drev-msg err">Enter the date of birth.</div>'; return; }
  if (!evd){ out.innerHTML = '<div class="drev-msg err">Enter the date of the moment you know.</div>'; return; }
  const tsec = s => { const p = (s || '0:0:0').split(':').map(Number); return (p[0] || 0) * 3600 + (p[1] || 0) * 60 + (p[2] || 0); };
  const fromSec = tsec(q('drevFrom').value), toSec = Math.min(86399.99, tsec(q('drevTo').value || '23:59:59'));
  if (!(toSec > fromSec)){ out.innerHTML = '<div class="drev-msg err">The end time must be after the start time.</div>'; return; }
  const pd = parseDob(dob), Y = pd.y, M = pd.m, D = pd.d;
  const birthJD0 = toJulianDay(Y, M, D, 0, 0, 0) - pl.tz / 24;
  const [ey, em, ed] = evd.split('-').map(Number), es = tsec(evt);
  const eventDate = new Date((toJulianDay(ey, em, ed, 0, 0, 0) + es / 86400 - pl.tz / 24 - 2440587.5) * 86400000);
  drevState.token.cancel = true; const token = drevState.token = { cancel: false };
  const btn = q('drevGo'); btn.disabled = true;
  out.innerHTML = '<div class="drev-msg"><span class="drev-spin"></span> Trying every second of the day… <b id="drevPct">0%</b></div>';
  let res;
  try { res = await drevSearch({ birthJD0, eventDate, want, fromSec, toSec, token, onProgress: f => { const e = document.getElementById('drevPct'); if (e) e.textContent = Math.round(f * 100) + '%'; } }); }
  catch(err){ console.error(err); out.innerHTML = '<div class="drev-msg err">Something went wrong while searching. Please try again.</div>'; btn.disabled = false; return; }
  btn.disabled = false; if (!res) return;
  const chainTxt = want.map((w, i) => w ? `${DREV_GLYPH[w]} ${w}` : null).filter(Boolean).join(' › ');
  const head = `<div class="drev-sum">Looking for: <b>${drevEsc(chainTxt)}</b> at <b>${evd} ${drevEsc(evt)}</b></div>`;
  if (!res.runs.length){
    out.innerHTML = head + `<div class="drev-msg err">No birth time between ${drevClock(fromSec)} and ${drevClock(toSec)} gives that Dasha at your moment.<br><small>Check the date of the moment, the planets, or widen the search time. If you are unsure of a lower level, leave it as "not sure".</small></div>`;
    return;
  }
  const lvl = want.filter(Boolean).length;
  out.innerHTML = head + `<div class="drev-count">${res.runs.length} matching time window${res.runs.length > 1 ? 's' : ''}${lvl < 3 ? ' · add more levels to narrow it' : ''}</div>` + res.runs.map((r, i) => {
    const w = r.end - r.start, nk = getNakshatra(r.moon);
    const width = w < 1 ? `${Math.round(w * 100) / 100} s` : w < 90 ? `${Math.round(w)} s` : w < 5400 ? `${Math.floor(w / 60)} min ${Math.round(w % 60)} s` : `${Math.floor(w / 3600)} h ${Math.round(w % 3600 / 60)} min`;
    return `<div class="drev-card"><div class="drev-c-top"><span class="drev-c-n">#${i + 1}</span><span class="drev-c-w">window ${drevEsc(width)}</span></div>
      <div class="drev-c-time"><b>${drevClock(r.start)}</b><i>→</i><b>${drevClock(r.end)}</b></div>
      <div class="drev-c-mid">Best single time: <b>${drevClock(r.mid)}</b></div>
      <div class="drev-c-moon">Moon at that time: ${r.moon.toFixed(4)}° · ${drevEsc(nk.name)} pada ${nk.pada} (${drevEsc(nk.lord)} dasha at birth)</div>
      <button type="button" class="drev-use" data-drev-use="${r.mid}">Use ${drevClock(r.mid).slice(0, 8)} as birth time</button></div>`;
  }).join('') + `<div class="drev-foot">Searched ${drevClock(fromSec)} to ${drevClock(toSec)} in steps of ${res.step < 1 ? res.step.toFixed(2) : Math.round(res.step * 10) / 10} s. Moon, ayanamsha and Dasha follow your current setting (Lahiri unless changed).</div>`;
}

/* ============================================================================
   TIME SKY PANEL  ("What is happening at this time")  - Time Dial and Dasha Reverse
   1. Full Vimshottari chain (Maha > Deha, start and end of each level) at three moments:
      the birth time being tested, any optional day + time, and today.
   2. Rising-sign boundaries in a 2-hour window around the tested time (1 h before to 1 h after):
      "x time to y time: Leo rising, Navamsha (D9) rising Cancer". D1 changes are marked.
   Uses the app's engine only (ascendantLongitude, moonLongitude, lahiriAyanamsa, calculateVimshottariDasha).
   ============================================================================ */
const TSKY_GLYPH = { Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋' };
const TSKY_LV = ['Maha','Antar','Pratyantar','Sookshma','Prana','Deha'];
function tskyEsc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }
function tskyPad(n){ return String(n).padStart(2, '0'); }
const TSKY_MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* sidereal rising longitude at a UT Julian Day */
function tskyAsc(jd, lat, lon){ return normDeg(ascendantLongitude(jd, lat, lon) - lahiriAyanamsa(jd)); }
function tskySigns(sidLon){ const d1 = Math.floor(normDeg(sidLon) / 30) % 12, d9 = Math.floor(normDeg(sidLon) * 9 / 30) % 12; return [d1, d9]; }
/* Segments where (D1 sign, D9 sign) of the rising degree stay the same, from jd0 to jd1 (UT JD). */
function tskySegments(jd0, jd1, lat, lon){
  const st = 5 / 86400, key = jd => { const s = tskySigns(tskyAsc(jd, lat, lon)); return s[0] * 12 + s[1]; };
  const flip = (a, b) => { const ka = key(a); let lo = a, hi = b; for (let i = 0; i < 30 && hi - lo > 0.2 / 86400; i++){ const m = (lo + hi) / 2; if (key(m) === ka) lo = m; else hi = m; } return (lo + hi) / 2; };
  const segs = []; let a = jd0, ka = key(jd0);
  for (let t = jd0 + st; t <= jd1 + 1e-9; t += st){
    const k = key(t);
    if (k !== ka){ const f = flip(t - st, t); segs.push({ a, b: f, d1: Math.floor(ka / 12), d9: ka % 12 }); a = f; ka = k; }
  }
  segs.push({ a, b: jd1, d1: Math.floor(ka / 12), d9: ka % 12 });
  return segs;
}
/* Dasha chain at `at` (Date) for a birth at birthJD (UT) */
function tskyChain(birthJD, lat, lon, at){
  const moon = normDeg(moonLongitude(birthJD) - lahiriAyanamsa(birthJD));
  const dd = calculateVimshottariDasha(moon, new Date((birthJD - 2440587.5) * 864e5));
  const a = findActiveDasha(dd.mahadashas, at); if (!a) return null;
  return [a.mahadasha, a.antardasha, a.pratyantardasha, a.sookshmaDasha, a.pranaDasha, a.dehaDasha];
}
function tskyDT(d, tz){ const x = new Date(d.getTime() + tz * 36e5); return `${x.getUTCDate()} ${TSKY_MON[x.getUTCMonth()]} ${x.getUTCFullYear()} ${tskyPad(x.getUTCHours())}:${tskyPad(x.getUTCMinutes())}`; }
function tskyHMS(jd, tz){ const p = jdToLocalParts(jd, tz); return p.timeStr; }

/* opts: { dateStr:'YYYY-MM-DD' (birth), timeStr:'HH:MM:SS', lat, lon, tz } -> html */
function tskyHtml(o, custom){
  const pd = parseDob(o.dateStr), [h, m, s] = o.timeStr.split(':').map(Number);
  const jd = toJulianDay(pd.y, pd.m, pd.d, h, m, s || 0) - o.tz / 24;
  const moments = [['At birth time', new Date((jd - 2440587.5) * 864e5)]];
  if (custom && custom.date){ const c = custom.date.split('-').map(Number), ct = (custom.time || '12:00:00').split(':').map(Number);
    moments.push([`Your day · ${custom.date}`, new Date((toJulianDay(c[0], c[1], c[2], ct[0] || 0, ct[1] || 0, ct[2] || 0) - o.tz / 24 - 2440587.5) * 864e5)]); }
  moments.push(['Today (now)', new Date()]);
  const cols = moments.map(([label, at]) => {
    let ch; try { ch = tskyChain(jd, o.lat, o.lon, at); } catch(e){ ch = null; }
    const rows = ch ? ch.map((p, i) => p ? `<div class="tsky-lv"><span class="tsky-l">${TSKY_LV[i]}</span><b>${TSKY_GLYPH[p.lord] || ''} ${tskyEsc(p.lord)}</b><small>${tskyDT(p.startDate, o.tz)} → ${tskyDT(p.endDate, o.tz)}</small></div>` : '').join('') : '<div class="tsky-lv"><small>No Dasha here (outside the 120-year cycle)</small></div>';
    return `<div class="tsky-col"><h5>${tskyEsc(label)}</h5><div class="tsky-when">${tskyDT(at, o.tz)}</div>${rows}</div>`;
  }).join('');
  const segs = tskySegments(jd - 3600 / 86400, jd + 3600 / 86400, o.lat, o.lon);
  const names = typeof SIGNS !== 'undefined' ? SIGNS : null, nm = i => names ? `${names[i].symbol} ${names[i].name}` : String(i + 1);
  let prevD1 = null;
  const seg = segs.map(x => { const cur = x.a <= jd && jd <= x.b, ch = prevD1 !== null && prevD1 !== x.d1; prevD1 = x.d1;
    return `<div class="tsky-seg${cur ? ' cur' : ''}${ch ? ' d1chg' : ''}"><span class="tsky-t">${tskyHMS(x.a, o.tz)} → ${tskyHMS(x.b, o.tz)}</span><span class="tsky-s"><b>${nm(x.d1)}</b> rising</span><span class="tsky-n">D9: ${nm(x.d9)}</span>${cur ? '<em>your time</em>' : ''}</div>`; }).join('');
  return `<div class="tsky"><h4>🔱 Dasha at three moments</h4><div class="tsky-cols">${cols}</div>
    <h4>🌅 Rising sign · 2-hour window <small>1 h before to 1 h after ${tskyEsc(o.timeStr.slice(0, 8))}</small></h4><div class="tsky-segs">${seg}</div>
    <div class="tsky-foot">Gold rows contain your time. A teal bar on the left marks where the rising sign (D1) itself changes. D9 changes more often, roughly every 13 minutes.</div></div>`;
}

/* ---- mount helper: draws into `el` and keeps a custom day/time ---- */
function tskyMount(el, getOpts){
  if (!el._tsk){ el._tsk = { date: '', time: '12:00:00' }; el.innerHTML = '<div class="tsky-wrap"><div class="tsky-in"><label>Optional day<input type="date" class="tsky-d"></label><label>Time<input type="time" step="1" class="tsky-tm" value="12:00:00"></label></div><div class="tsky-body"></div></div>';
    const upd = () => { el._tsk.date = el.querySelector('.tsky-d').value; el._tsk.time = el.querySelector('.tsky-tm').value || '12:00:00'; tskyMount(el, getOpts); };
    el.querySelector('.tsky-d').addEventListener('change', upd); el.querySelector('.tsky-tm').addEventListener('change', upd); }
  const o = getOpts(); const body = el.querySelector('.tsky-body');
  if (!o){ body.innerHTML = '<div class="tsky-empty">Generate a chart first.</div>'; return; }
  try { body.innerHTML = tskyHtml(o, el._tsk); } catch(e){ console.error('Time sky', e); body.innerHTML = '<div class="tsky-empty">Could not calculate this time.</div>'; }
}
/* Time Dial: called from rsRefresh() */
let _tskyTimer = null;
function tskyDialRefresh(){
  clearTimeout(_tskyTimer);
  _tskyTimer = setTimeout(() => {
    const pane = document.querySelector('.rs-pane[data-rs-pane="dial"]'), dEl = document.getElementById('rectDate'), p = (typeof currentProfileForExport !== 'undefined') ? currentProfileForExport : null;
    if (!pane || !dEl || !dEl.value || !p) return;
    let host = pane.querySelector('#tskyDial'); if (!host){ host = document.createElement('div'); host.id = 'tskyDial'; host.className = 'df-card tsky-card'; pane.appendChild(host); }
    tskyMount(host, () => ({ dateStr: dEl.value, timeStr: `${tskyPad(rectHms.h)}:${tskyPad(rectHms.m)}:${tskyPad(rectHms.s)}`, lat: p.lat, lon: p.lon, tz: p.tz }));
  }, 300);
}

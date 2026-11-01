/* ============================================================================
   EXACT ASPECTS  (tab "Aspects")
   A moving planet aspects a point when  (mover longitude) + (offset-1)*30  =  (point longitude).
   Example: Rahu 5th aspect on Mars 18° Gemini (78°) -> Rahu must stand at 78 - 120 = 318° = 18° Aquarius.
   Targets: a natal planet / Lagna (when a natal profile is active), a live-sky planet (always), or a custom degree.
   For every aspect of the chosen planet we list the exact moments (several if the planet turns retrograde),
   plus the time it enters and leaves the orb, and how long that lasts.
   Uses the app's own sidereal engine (siderealLongitude, angDiff). Needs js/43 (window.DFU).
   ============================================================================ */
(function(){
'use strict';
if (typeof siderealLongitude !== 'function' || !window.DFU) return;
const U = window.DFU, $ = id => document.getElementById(id);
const OFF_NAME = { 1:'Conjunction (same degree)', 3:'3rd aspect', 4:'4th aspect', 5:'5th aspect', 7:'7th aspect (opposite)', 8:'8th aspect', 9:'9th aspect', 10:'10th aspect' };
const MAX_YEARS = 150;

/* ------------------------------ engine ------------------------------ */
// signed distance (deg) of the aspect point from the target; zero = exact
function makeF(mover, off, targetFn){
  const shift = (off-1)*30;
  return jd => angDiff(siderealLongitude(mover, jd) + shift, targetFn(jd));
}
function bisect(f, lo, hi){          // sign change of f inside [lo,hi]
  const neg0 = f(lo) < 0;
  for (let i=0; i<64 && hi-lo > 1e-8; i++){ const m = (lo+hi)/2; if ((f(m) < 0) === neg0) lo = m; else hi = m; }
  return (lo+hi)/2;
}
function exactIn(f, step, from, to){
  const out = []; let jd = from, a = f(jd);
  while (jd < to){
    const jn = Math.min(jd+step, to), b = f(jn);
    if (((a<0 && b>=0) || (a>=0 && b<0)) && Math.abs(a)<90 && Math.abs(b)<90){
      const t = bisect(f, jd, jn);
      out.push({ jd:t, retro: f(t-1e-4) > f(t+1e-4) ? true : false });   // f falls -> planet moving backwards relative to point
    }
    a = b; jd = jn; if (jn >= to) break;
  }
  return out;
}
// time at which |f| leaves the orb, going outward from an exact moment
function orbEdge(f, h, dir, orb, step){
  const g = jd => Math.abs(f(jd)) - orb;
  let inner = h, outer = h + dir*step, n = 0;
  while (g(outer) < 0 && n++ < 20000){ inner = outer; outer += dir*step; }
  for (let i=0; i<50; i++){ const m = (inner+outer)/2; if (g(m) < 0) inner = m; else outer = m; }
  return (inner+outer)/2;
}
function clusterWindows(f, hits, orb, step){
  const w = hits.map(h => ({ exact:[h], start:orbEdge(f,h.jd,-1,orb,step), end:orbEdge(f,h.jd,1,orb,step) }));
  w.sort((x,y) => x.exact[0].jd - y.exact[0].jd);
  const out = [];
  w.forEach(x => {
    const c = out[out.length-1];
    if (c && x.start <= c.end){ c.exact.push(x.exact[0]); c.end = Math.max(c.end, x.end); c.start = Math.min(c.start, x.start); }
    else out.push(x);
  });
  return out;
}
/* main: upcoming (dir=1) or previous (dir=-1) windows for ONE aspect of ONE mover on ONE target */
async function findWindows(o){
  const { mover, off, targetFn, targetName, now, dir, count, orb, tok, onProg } = o;
  const f = makeF(mover, off, targetFn);
  let step = U.STEP[mover] || 1;
  if (targetName && U.STEP[targetName]) step = Math.min(step, U.STEP[targetName]);
  const vm = Math.abs(AVG_DAILY_MOTION[mover]||1), vt = targetName ? Math.abs(AVG_DAILY_MOTION[targetName]||0) : 0;
  const rel = Math.max(0.01, Math.abs(vm - vt) || vm);
  const edgeStep = Math.min(step/2, Math.max(1/1440, orb/rel/8));
  const lookback = Math.min(800, 1.4*orb/rel + 1);          // so a window that is running right now is included
  const chunk = 366*2, limit = MAX_YEARS*365.25, hits = [];
  let a = dir>0 ? now - lookback : now + lookback, travelled = 0, iter = 0;
  while (travelled < limit && hits.length < count*3){
    const b = dir>0 ? a + chunk : a - chunk;
    const seg = exactIn(f, step, Math.min(a,b), Math.max(a,b));
    seg.forEach(h => hits.push(h));
    a = b; travelled += chunk;
    if (tok && tok.cancel) return null;
    onProg && onProg(a);
    if (++iter % 2 === 0) await U.nextTick();
  }
  let cl = clusterWindows(f, hits, orb, edgeStep);
  cl = dir>0 ? cl.filter(c => c.end >= now).sort((x,y)=>x.exact[0].jd-y.exact[0].jd)
             : cl.filter(c => c.start <= now).sort((x,y)=>y.exact[0].jd-x.exact[0].jd);
  return cl.slice(0, count);
}

/* ------------------------------ state ------------------------------ */
let axMover = 'Rahu', axTarget = 'Mars', axDir = 1, axOrb = 1, axConj = true, axTok = { cancel:false };
const CUSTOM = '__custom__', LAGNA = 'Lagna';

function profile(){ return (typeof isValidProfile === 'function' && isValidProfile(activeNatalProfile)) ? activeNatalProfile : null; }
function natalJD(p){ return toJulianDay(...parseDob(p.dob), ...p.tob.split(':').map(Number), 0) - p.tz/24; }
function targetInfo(){
  const p = profile();
  if (axTarget === CUSTOM){
    const d = U.parseDMS($('axDeg').value);
    if (d.err !== undefined) return { err: d.err || 'Type a degree like 18°00\'00"' };
    const lon = d.deg >= 30 ? d.deg : Number($('axSign').value)*30 + d.deg;
    return { label:`custom point ${U.sgn(Math.floor(normDeg(lon)/30))} ${U.inSign(lon).text}`, fn:() => lon, name:null, lon };
  }
  if (p){
    const nj = natalJD(p);
    if (axTarget === LAGNA){ const lon = siderealAscendant(nj, p.lat, p.lon); return { label:`natal Lagna ${U.sgn(U.inSign(lon).sign)} ${U.inSign(lon).text}`, fn:() => lon, name:null, lon }; }
    const lon = siderealLongitude(axTarget, nj);
    return { label:`natal ${axTarget} ${U.sgn(U.inSign(lon).sign)} ${U.inSign(lon).text}`, fn:() => lon, name:null, lon, natal:true };
  }
  return { label:`live-sky ${axTarget}`, fn: jd => siderealLongitude(axTarget, jd), name:axTarget, live:true };
}

/* ------------------------------ UI ------------------------------ */
function chip(n, active, extra){
  const col = PLANET_COLORS[n] || '#d4a24a';
  return `<button type="button" class="filter-chip${active?' active':''}" data-p="${n}"><span class="df-chip-glyph" style="color:${active?'#021210':col}">${PLANET_GLYPHS[n]||extra||''}</span>${n==='__custom__'?'Custom':n}</button>`;
}
function buildUI(){
  const p = profile();
  $('axMovers').innerHTML = PLANET_LIST.map(n => chip(n, n===axMover)).join('');
  const tl = PLANET_LIST.slice();
  if (p) tl.push(LAGNA);
  $('axTargets').innerHTML = tl.map(n => n===LAGNA ? chip(n, n===axTarget, '↑') : chip(n, n===axTarget)).join('') + chip(CUSTOM, axTarget===CUSTOM, '⌖');
  if (axTarget !== CUSTOM && !tl.includes(axTarget)) axTarget = 'Mars';
  $('axSrc').innerHTML = p
    ? `Target = <b>${esc(p.name)}'s natal chart</b>, moving planet = <b>live sky</b>. Choose "Custom" for any degree.`
    : `No natal profile active, so this works on the <b>live sky only</b>: the moving planet against the chosen planet, which also keeps moving. Save a profile in the Natal tab to test against your birth chart.`;
  $('axCustom').style.display = axTarget === CUSTOM ? '' : 'none';
  $('axMovers').querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.dataset.p === axMover));
  $('axTargets').querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.dataset.p === axTarget));
  preview();
}
function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function offsets(){
  const list = (ASPECT_OFFSETS[axMover] || [7]).slice();
  return axConj ? [1].concat(list) : list;
}
function preview(){
  const t = targetInfo(), el = $('axPreview');
  if (t.err !== undefined){ el.textContent = t.err; el.classList.add('err'); return; }
  el.classList.remove('err');
  if (t.lon === undefined){ el.textContent = `Target: ${t.label}`; return; }
  // where the moving planet must stand for each aspect
  const ord = n => n===1?'Conjunction':n+({3:'rd',1:'st',2:'nd'}[n]||'th')+' aspect';
  const lines = offsets().map(off => { const L = normDeg(t.lon - (off-1)*30); return `${ord(off)}: ${axMover} at ${U.sgn(U.inSign(L).sign)} ${U.inSign(L).text}`; });
  el.innerHTML = `Target: <b>${esc(t.label)}</b><br>` + lines.map(esc).join('<br>');
}
function dur(c){ return U.fmtSpan(c.end - c.start); }
function card(c, i, off, t, now){
  const ex = c.exact[0], active = c.start <= now && c.end >= now;
  const L = t.lon !== undefined ? normDeg(t.lon - (off-1)*30) : normDeg(siderealLongitude(axMover, ex.jd));
  const pos = U.inSign(L);
  const motion = (axMover==='Rahu'||axMover==='Ketu') ? '' : (ex.retro ? ' · ℞ retrograde' : ' · direct');
  const passes = c.exact.length > 1
    ? `<div class="ax-passes">${c.exact.map((e,k) => `<span data-jd="${e.jd}">Pass ${k+1}: ${U.fmtDate(e.jd,true)} ${U.fmtClock(e.jd,true)}${(axMover==='Rahu'||axMover==='Ketu')?'':(e.retro?' ℞':'')}</span>`).join('')}</div>` : '';
  const tag = active ? '<div class="transit-card-tag ax-live">● Inside the orb now</div>' : '';
  const when = c.start > now ? 'in ' + U.fmtSpan(ex.jd - now) : (ex.jd < now ? U.fmtSpan(now - ex.jd) + ' ago' : 'in ' + U.fmtSpan(ex.jd - now));
  return `<div class="transit-card ax-card" data-jd="${ex.jd}">
    <div class="transit-card-top"><div class="transit-card-title">#${i+1} · ${U.fmtDate(ex.jd,true)}</div><div class="transit-card-date">${U.fmtClock(ex.jd,true)}</div></div>
    <div class="transit-card-desc">${U.fmtWD(ex.jd)} · ${U.fmtUTC(ex.jd)} · ${when}<br>${PLANET_GLYPHS[axMover]} ${axMover} at <b>${U.sgn(pos.sign)} ${pos.text}</b>${motion}<br>
      <span class="ax-win">Orb ±${axOrb}°: <b>${U.fmtDate(c.start)} ${U.fmtClock(c.start)}</b> → <b>${U.fmtDate(c.end)} ${U.fmtClock(c.end)}</b><br>Duration inside the orb: <b>${dur(c)}</b></span></div>${passes}${tag}</div>`;
}
async function run(){
  const res = $('axResults'), note = $('axNote'), t = targetInfo();
  if (t.err !== undefined){ res.innerHTML = `<div class="empty-feed">${esc(t.err)}</div>`; return; }
  if (!t.live && axTarget !== CUSTOM && !t.natal && t.lon === undefined){ res.innerHTML = '<div class="empty-feed">Pick a target.</div>'; return; }
  if (t.live && axTarget === axMover){ res.innerHTML = '<div class="empty-feed">Pick a different target: a planet cannot aspect itself in the live sky.</div>'; return; }
  axTok.cancel = true; const tok = axTok = { cancel:false };
  const now = currentJD, dir = axDir, offs = offsets();
  $('axGo').disabled = true;
  note.textContent = `${dir>0?'Upcoming from':'Previous before'} ${U.fmtDate(now)} · sidereal (Lahiri) · ${axMover} → ${t.label} · orb ±${axOrb}° · times in your device timezone`;
  res.innerHTML = '<div class="empty-feed"><span class="df-prog" id="axProg">Scanning…</span></div>';
  await U.nextTick();
  let html = '';
  for (const off of offs){
    const wins = await findWindows({ mover:axMover, off, targetFn:t.fn, targetName:t.name, now, dir, count:3, orb:axOrb, tok,
      onProg: jd => { const el = $('axProg'); if (el) el.textContent = `Scanning ${OFF_NAME[off]} · reached ${U.dateAt(jd,86400000).getFullYear()}`; } });
    if (wins === null) return;
    html += `<div class="panel-heading">${OFF_NAME[off]}</div>` + (wins.length ? wins.map((c,i) => card(c,i,off,t,now)).join('') : `<div class="empty-feed">Not found within ${MAX_YEARS} years.</div>`);
  }
  if (tok.cancel) return;
  $('axGo').disabled = false;
  res.innerHTML = html;
  res.querySelectorAll('.ax-card').forEach(c => c.addEventListener('click', () => jumpToJD(parseFloat(c.dataset.jd))));
  res.querySelectorAll('.ax-passes span').forEach(s => s.addEventListener('click', e => { e.stopPropagation(); jumpToJD(parseFloat(s.dataset.jd)); }));
}

function wireUI(){
  $('axMovers').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b){ axMover = b.dataset.p; buildUI(); } });
  $('axTargets').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b){ axTarget = b.dataset.p; buildUI(); } });
  $('axDir').addEventListener('click', e => { const b = e.target.closest('[data-dir]'); if (!b) return; axDir = Number(b.dataset.dir); $('axDir').querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c===b)); });
  $('axOrbs').addEventListener('click', e => { const b = e.target.closest('[data-orb]'); if (!b) return; axOrb = Number(b.dataset.orb); $('axOrbs').querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c===b)); });
  $('axConj').addEventListener('change', e => { axConj = e.target.checked; preview(); });
  $('axDeg').addEventListener('input', preview); $('axSign').addEventListener('change', preview);
  $('axDeg').addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); $('axDeg').blur(); run(); } });
  $('axGo').addEventListener('click', run);
  $('axSign').innerHTML = SIGNS.map((s,i) => `<option value="${i}">${s.symbol} ${s.name}</option>`).join('');
}

if ($('tab-aspexact')){
  wireUI(); buildUI();
  document.querySelector('[data-tab="aspexact"]').addEventListener('click', buildUI);
  const cardWrap = $('natalCardWrap');
  if (cardWrap) new MutationObserver(() => { buildUI(); }).observe(cardWrap, { childList:true });
}
window.AXA = { findWindows, makeF };   // exposed for tests
})();

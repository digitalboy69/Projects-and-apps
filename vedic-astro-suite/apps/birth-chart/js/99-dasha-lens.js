/* ============================================================================
   DASHA LENS (Rectification Studio tab "Dasha Lens")
   Pick ANY moment (date + hour + minute + second) and see the whole Vimshottari stack running at that instant:
   Mahadasha > Antardasha > Pratyantardasha > Sookshma > Prana > Deha, each with exact start/end, length,
   time left, and where that planet sits in the chart. Nudge the date, hour, minute or second (hold to repeat)
   to watch the lords change. A sibling timeline shows the 9 periods of any level, and a sensitivity note says
   how far one second of birth-time error moves every boundary (so deep levels are used honestly).
   Same maths as js/10 (365.25-day years, periods laid on the full cycle from the virtual start of the first Mahadasha).
   Needs: js/10 (DASHA_*), js/05 (NAKSHATRAS), js/16 (rectifyPoint), js/26 (rsPaneHead, rectHms), js/99-jump-3d-bridge.
   ============================================================================ */
const DL_YR = 365.25*86400000;
const DL_LV = [['Mahadasha','MD'],['Antardasha','AD'],['Pratyantardasha','PD'],['Sookshma','SD'],['Prana','PR'],['Deha','DH']];
const DL_PC = { Sun:'#f6c453', Moon:'#cbd5e1', Mars:'#ff7a6b', Mercury:'#5fcf8d', Jupiter:'#e9b949', Venus:'#ef6f9a', Saturn:'#94a3b8', Rahu:'#a78bfa', Ketu:'#c08457' };
const DL_GL = { Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋' };
const DL_MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DL = { y:0, m:0, d:0, H:0, M:0, S:0, src:'rec', lv:4, step:1, ready:false, timer:0 };

/* ---------- engine ---------- */
function dlChildren(par){                       // the 9 sub-periods of a period, starting from its own lord
  const j0 = DASHA_SEQUENCE.indexOf(par.lord), len = par.end - par.start, out = []; let cur = par.start;
  for (let k=0;k<9;k++){ const lord = DASHA_SEQUENCE[(j0+k)%9], l = len*DASHA_YEARS[lord]/DASHA_TOTAL_YEARS; out.push({ lord, start:cur, end:cur+l }); cur += l; }
  return out;
}
function dlStack(moonLon, birthMs, evMs, depth){
  const span = 360/27, ml = normDeg(moonLon), ni = Math.floor(ml/span), frac = (span - ml%span)/span;
  const sl = NAKSHATRAS[ni].lord, sIdx = DASHA_SEQUENCE.indexOf(sl), vstart = birthMs - DASHA_YEARS[sl]*(1 - frac)*DL_YR;
  const mahas = []; let cur = vstart;
  for (let k=0;k<9;k++){ const lord = DASHA_SEQUENCE[(sIdx+k)%9], l = DASHA_YEARS[lord]*DL_YR; mahas.push({ lord, start:cur, end:cur+l }); cur += l; }
  let t = evMs, i = 0, guard = 0, base = vstart;       // beyond 120 years the cycle simply repeats
  if (t >= mahas[8].end){ const cycles = Math.floor((t - vstart)/(DASHA_TOTAL_YEARS*DL_YR)); base = vstart + cycles*DASHA_TOTAL_YEARS*DL_YR; }
  const shifted = base===vstart ? mahas : mahas.map(m=>({ lord:m.lord, start:m.start + (base - vstart), end:m.end + (base - vstart) }));
  while (i < 8 && t >= shifted[i].end && guard++ < 20) i++;
  const levels = [shifted[i]];
  for (let lv=1; lv<depth; lv++){ const ch = dlChildren(levels[lv-1]); let pick = ch[8]; for (let k=0;k<9;k++){ if (t < ch[k].end){ pick = ch[k]; break; } } levels.push(pick); }
  return { levels, mahas:shifted, vstart:base, balanceLord:sl, sIdx };
}

/* ---------- formatting ---------- */
function dlTz(){ const p = currentProfileForExport; return p && isFinite(+p.tz) ? +p.tz : 0; }
function dlP2(n){ return String(n).padStart(2,'0'); }
function dlLocal(ms){ const d = new Date(ms + dlTz()*3600000); return { y:d.getUTCFullYear(), m:d.getUTCMonth()+1, d:d.getUTCDate(), H:d.getUTCHours(), M:d.getUTCMinutes(), S:d.getUTCSeconds() }; }
function dlStamp(ms){ const l = dlLocal(Math.round(ms/1000)*1000); return `${l.d} ${DL_MON[l.m-1]} ${l.y}<span class="dl-tm">${dlP2(l.H)}:${dlP2(l.M)}:${dlP2(l.S)}</span>`; }
function dlDur(ms){
  const s = Math.max(0, Math.round(ms/1000));
  if (s >= 86400*30){ const y = Math.floor(s/(DL_YR/1000)), mo = Math.floor((s - y*DL_YR/1000)/(30.4375*86400)), d = Math.floor((s - y*DL_YR/1000 - mo*30.4375*86400)/86400); return `${y?y+'y ':''}${mo?mo+'mo ':''}${d?d+'d':''}`.trim() || '0d'; }
  if (s >= 86400){ const d = Math.floor(s/86400), h = Math.floor((s%86400)/3600); return `${d}d${h?' '+h+'h':''}`; }
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), x = s%60;
  return h ? `${h}h ${m}m${x?' '+x+'s':''}` : m ? `${m}m ${x}s` : `${x}s`;
}
function dlMomentMs(){ return Date.UTC(DL.y, DL.m-1, DL.d, DL.H, DL.M, DL.S) - dlTz()*3600000; }
function dlSetMs(ms){ const l = dlLocal(ms); DL.y = l.y; DL.m = l.m; DL.d = l.d; DL.H = l.H; DL.M = l.M; DL.S = l.S; }
function dlNorm(){ const t = Date.UTC(DL.y, DL.m-1, DL.d, DL.H, DL.M, DL.S); const d = new Date(t); DL.y = d.getUTCFullYear(); DL.m = d.getUTCMonth()+1; DL.d = d.getUTCDate(); DL.H = d.getUTCHours(); DL.M = d.getUTCMinutes(); DL.S = d.getUTCSeconds(); }
function dlNudge(unit, n){
  if (unit==='y' || unit==='mo'){            // keep the day-of-month, clamp to the month length (31 Jan + 1 month = 28/29 Feb)
    const d0 = DL.d; if (unit==='y') DL.y += n; else DL.m += n;
    DL.d = 1; dlNorm(); const dim = new Date(Date.UTC(DL.y, DL.m, 0)).getUTCDate(); DL.d = Math.min(d0, dim);
  } else DL[unit] += n;
  dlNorm();
}

/* ---------- birth moment used for the Moon ---------- */
function dlBirth(){
  const pr = currentProfileForExport, ch = currentChartForModal; if (!pr || !ch) return null;
  let date = pr.dob, time = String(pr.tob || '12:00:00'); if (time.length === 5) time += ':00';
  if (DL.src === 'dial'){ const de = document.getElementById('rectDate'); if (de && de.value){ date = de.value; const h = (typeof rectHms !== 'undefined') ? rectHms : { h:0, m:0, s:0 }; time = `${dlP2(h.h)}:${dlP2(h.m)}:${dlP2(h.s)}`; } }
  const r = rectifyPoint(date, time, pr.lat, pr.lon, pr.tz), sh = shiftLocalDateTime(date, time, 60);
  const r3 = rectifyPoint(sh.dateStr, sh.timeStr, pr.lat, pr.lon, pr.tz);
  const birthMs = (r.jd - 2440587.5)*86400000, nl = NAKSHATRAS[Math.floor(normDeg(r.moon.longitude)/(360/27))].lord;
  const dMoon = Math.abs(r3.moon.longitude - r.moon.longitude), perSec = (dMoon/(360/27))*DASHA_YEARS[nl]*DL_YR/60;   // ms of dasha shift per second of birth-time error
  return { moonLon:r.moon.longitude, birthMs, date, time, shiftPerSecMs:perSec, shiftPerMinDays:perSec*60/86400000 };
}

/* ---------- UI ---------- */
function dlPlanetInfo(P){ const ch = currentChartForModal, p = ch && ch.planets && ch.planets[P]; return p ? `H${p.house} · ${SIGNS[p.sign].name}` : ''; }
function dlChip(P, big){ return `<span class="dl-pl${big?' big':''}" style="--pc:${DL_PC[P]}"><span class="dl-gl">${DL_GL[P]}</span>${P}</span>`; }
function rsBuildDasha(p){
  p.innerHTML = rsPaneHead('🔱','Dasha Lens','Pick any moment and see the whole Vimshottari stack running then, down to Prana and Deha.') +
  `<details class="rs-how"><summary>How to use this</summary><p>Set a date and time (your event, or any moment) and the lens shows which planet rules every level at that instant. Use the pods to move the hour, minute or second and watch the deeper levels change. Prana lasts hours and Deha about an hour, so seconds matter there.</p>
   <p><b>Be honest with deep levels:</b> every dasha boundary depends on the Moon at birth. One second of birth-time error slides the whole timeline by the amount shown in the sensitivity note. So use Prana and Deha to <em>compare candidate birth times</em> (switch the source to the Time Dial), not as proof on their own.</p></details>
   <div class="dl-card"><div class="dl-h"><span class="dl-hn">1</span><b>When?</b><span class="dl-tz" id="dlTz"></span><button type="button" class="dl-info" data-dl-info="1" aria-label="Mismatch calculator">ⓘ</button></div>
     <div class="dl-presets"><button type="button" class="dl-pre" data-dl-pre="birth">🍼 Birth</button><button type="button" class="dl-pre" data-dl-pre="now">⏱ Now</button><button type="button" class="dl-pre" data-dl-pre="dial">🕰️ Dial time</button><button type="button" class="dl-pre" data-dl-pre="mid">🌓 Midnight</button></div>
     <div class="dl-daterow"><button type="button" class="dl-nb" data-dl-n="y:-1">−1y</button><button type="button" class="dl-nb" data-dl-n="mo:-1">−1mo</button><button type="button" class="dl-nb" data-dl-n="d:-1">−1d</button>
       <input type="date" id="dlDate" aria-label="Date">
       <button type="button" class="dl-nb" data-dl-n="d:1">+1d</button><button type="button" class="dl-nb" data-dl-n="mo:1">+1mo</button><button type="button" class="dl-nb" data-dl-n="y:1">+1y</button></div>
     <div class="dl-pods" id="dlPods"><div class="dl-pod"><div class="dl-pv" data-dl-val="H">00</div><div class="dl-pb"><button type="button" class="dl-pbtn" data-dl-pod="H:-1" aria-label="HOUR minus">◀</button><button type="button" class="dl-pbtn" data-dl-pod="H:1" aria-label="HOUR plus">▶</button></div><div class="dl-pl2">HOUR</div></div><div class="dl-colon">:</div><div class="dl-pod"><div class="dl-pv" data-dl-val="M">00</div><div class="dl-pb"><button type="button" class="dl-pbtn" data-dl-pod="M:-1" aria-label="MINUTE minus">◀</button><button type="button" class="dl-pbtn" data-dl-pod="M:1" aria-label="MINUTE plus">▶</button></div><div class="dl-pl2">MINUTE</div></div><div class="dl-colon">:</div><div class="dl-pod"><div class="dl-pv" data-dl-val="S">00</div><div class="dl-pb"><button type="button" class="dl-pbtn" data-dl-pod="S:-1" aria-label="SECOND minus">◀</button><button type="button" class="dl-pbtn" data-dl-pod="S:1" aria-label="SECOND plus">▶</button></div><div class="dl-pl2">SECOND</div></div></div>
     <div class="dl-stepsz"><span class="dl-sl">Step</span>${[1,5,10,30].map(n=>`<button type="button" class="dl-sc${n===1?' on':''}" data-dl-step="${n}">${n}</button>`).join('')}<span class="dl-hint">Hold a ◀ ▶ button to run</span></div>
     <div class="dl-src"><span class="dl-sl">Birth moment for the Moon</span><div class="dl-seg"><button type="button" class="dl-sg on" data-dl-src="rec">Recorded birth time</button><button type="button" class="dl-sg" data-dl-src="dial">Time Dial time</button></div></div></div>
   <div class="dl-card"><div class="dl-h"><span class="dl-hn">2</span><b>Running at that moment</b></div><div id="dlCrumb" class="dl-crumb"></div><div id="dlStack" class="dl-stack"></div><div id="dlSens" class="dl-sens"></div>
     <div class="dl-actions"><button type="button" class="dl-btn dl-btn-3d" id="dlTo3d">🌌 Show this moment in the 3D wheel</button><button type="button" class="dl-btn" id="dlCopy">📋 Copy</button></div></div>
   <div class="dl-card" id="dlMulti"><div class="dl-h"><span class="dl-hn">3</span><b>Known moments</b><span class="dl-tz">add many, compare their dashas</span></div>
     <div class="dl-mform"><input type="text" id="dlMLabel" class="dl-mi" maxlength="40" placeholder="Label (e.g. Marriage)" aria-label="Label">
       <input type="date" id="dlMDate" class="dl-mi" aria-label="Date"><input type="time" step="1" id="dlMTime" class="dl-mi" value="12:00:00" aria-label="Time">
       <button type="button" class="dl-btn dl-btn-add" id="dlMAdd">＋ Add</button></div>
     <div class="dl-mrow2"><button type="button" class="dl-pre" id="dlMCur">＋ Add the moment above (step 1)</button></div>
     <details class="dl-paste"><summary>Paste many at once</summary><textarea id="dlMText" rows="4" spellcheck="false" placeholder="2004-04-15 12:30:00 Marriage&#10;15/08/2010 09:05 First job&#10;2018-01-03 22:40:10 Child born"></textarea>
       <div class="dl-mrow2"><button type="button" class="dl-btn dl-btn-add" id="dlMParse">Add all lines</button><span class="dl-hint2">Formats: YYYY-MM-DD HH:MM[:SS] label, or DD/MM/YYYY HH:MM[:SS] label</span></div><div id="dlMMsg" class="dl-mmsg"></div></details>
     <div id="dlMList" class="dl-mlist"></div><div id="dlMCommon" class="dl-mcommon"></div></div>
   <div class="dl-card"><div class="dl-h"><span class="dl-hn">4</span><b>Timeline</b><span class="dl-tz">tap a period to jump to its start</span></div><div id="dlLvTabs" class="dl-lvtabs"></div><div id="dlBar" class="dl-bar"></div><div id="dlList" class="dl-list"></div></div>`;
  const root = p, hold = { t:0, i:0, down:false };
  const stop = ()=>{ hold.down = false; clearTimeout(hold.t); clearInterval(hold.i); hold.t = hold.i = 0; };
  const act = fn=>{ fn(); dlRender(); };
  root.addEventListener('pointerdown', e=>{
    const b = e.target.closest('[data-dl-pod]'); if (!b) return; e.preventDefault();
    stop(); hold.down = true;
    const [u, dir] = b.dataset.dlPod.split(':'), go = ()=>{ if (!hold.down || !root.offsetParent){ stop(); return; } act(()=> dlNudge(u, (+dir)*DL.step)); };
    go(); hold.t = setTimeout(()=>{ if (hold.down) hold.i = setInterval(go, 90); }, 380);
  });
  // the finger or mouse can be released anywhere (even off the button or off the screen): listen on the window, never on the button
  ['pointerup','pointercancel','lostpointercapture','blur','contextmenu','dragstart','touchend','touchcancel','mouseup'].forEach(ev=> window.addEventListener(ev, stop, true));
  document.addEventListener('visibilitychange', stop);
  root.addEventListener('contextmenu', e=>{ if (e.target.closest('[data-dl-pod]')) e.preventDefault(); });
  root.addEventListener('click', e=>{
    const t = e.target;
    let b;
    if ((b = t.closest('[data-dl-n]'))){ const [u,n] = b.dataset.dlN.split(':'); act(()=> dlNudge(u, +n)); }
    else if ((b = t.closest('[data-dl-pre]'))){ act(()=> dlPreset(b.dataset.dlPre)); }
    else if ((b = t.closest('[data-dl-step]'))){ DL.step = +b.dataset.dlStep; root.querySelectorAll('[data-dl-step]').forEach(x=>x.classList.toggle('on', x===b)); }
    else if ((b = t.closest('[data-dl-src]'))){ DL.src = b.dataset.dlSrc; root.querySelectorAll('[data-dl-src]').forEach(x=>x.classList.toggle('on', x===b)); dlRender(); }
    else if ((b = t.closest('[data-dl-lv]'))){ DL.lv = +b.dataset.dlLv; dlRender(); }
    else if ((b = t.closest('[data-dl-goto]'))){ act(()=> dlSetMs(Math.ceil(+b.dataset.dlGoto/1000)*1000)); }
    else if ((b = t.closest('[data-dl-hop]'))){ const [lv, dir] = b.dataset.dlHop.split(':'), s = DL.stack && DL.stack.levels[+lv]; if (s) act(()=> dlSetMs(+dir > 0 ? Math.ceil(s.end/1000)*1000 : Math.floor(s.start/1000)*1000 - 1000)); }
    else if (t.closest('#dlTo3d')){ const l = dlLocal(dlMomentMs()); dlTo3D(l); }
    else if (t.closest('#dlCopy')) dlCopy();
  });
  dlWireExtras(root);
  const de = root.querySelector('#dlDate');
  de.addEventListener('change', ()=>{ if (!de.value) return; const [y,m,d] = de.value.split('-').map(Number); DL.y = y; DL.m = m; DL.d = d; dlRender(); });
}
function dlPreset(k){
  const pr = currentProfileForExport; if (!pr) return;
  if (k==='birth'){ const {y,m,d} = parseDob(pr.dob), t = String(pr.tob||'12:00').split(':').map(Number); DL.y = y; DL.m = m; DL.d = d; DL.H = t[0]||0; DL.M = t[1]||0; DL.S = t[2]||0; }
  else if (k==='now') dlSetMs(Date.now());
  else if (k==='dial'){ const de = document.getElementById('rectDate'); if (de && de.value){ const [y,m,d] = de.value.split('-').map(Number), h = (typeof rectHms !== 'undefined') ? rectHms : { h:0, m:0, s:0 }; DL.y = y; DL.m = m; DL.d = d; DL.H = h.h; DL.M = h.m; DL.S = h.s; } }
  else if (k==='mid'){ DL.H = 0; DL.M = 0; DL.S = 0; }
  dlNorm();
}
function dlTo3D(l){
  const pr = currentProfileForExport || {};
  if (typeof vxJump3D !== 'function'){ rsToast('3D link not ready'); return; }
  vxJump3D({ date:`${l.y}-${dlP2(l.m)}-${dlP2(l.d)}`, time:`${dlP2(l.H)}:${dlP2(l.M)}:${dlP2(l.S)}`, tz:pr.tz, lat:pr.lat, lon:pr.lon, place:pr.place, label:'Dasha Lens' });
}
function dlCopy(){
  const txt = document.getElementById('dlCrumb').dataset.txt || ''; if (!txt) return;
  try { navigator.clipboard.writeText(txt).then(()=> rsToast('Copied ✓'), ()=> rsToast('Copy failed')); } catch(e){ rsToast('Copy not available'); }
}
function dlOnShow(){
  if (!DL.ready){ dlSetMs(Date.now()); DL.ready = true; }
  dlRender();
}
function dlRender(){
  const root = document.querySelector('.rs-pane[data-rs-pane="dasha"]'); if (!root) return;
  const crumb = root.querySelector('#dlCrumb'), stackEl = root.querySelector('#dlStack');
  const bi = dlBirth();
  if (!bi){ crumb.textContent = ''; stackEl.innerHTML = `<div class="rs-empty">Generate a chart first.</div>`; return; }
  const tzs = dlTz(); root.querySelector('#dlTz').textContent = 'Birth-place time · UTC' + (tzs>=0?'+':'−') + Math.abs(tzs);
  const de = root.querySelector('#dlDate'); const ds = `${DL.y}-${dlP2(DL.m)}-${dlP2(DL.d)}`; if (de.value !== ds) de.value = ds;
  ['H','M','S'].forEach(u=>{ const el = root.querySelector('[data-dl-val="'+u+'"]'); const v = dlP2(DL[u]); if (el && el.textContent !== v) el.textContent = v; });   // only the numbers change: the buttons stay put
  const ev = dlMomentMs(), st = dlStack(bi.moonLon, bi.birthMs, ev, 6); DL.stack = st;
  const before = ev < bi.birthMs;
  crumb.innerHTML = st.levels.map((l,i)=>`<span class="dl-cr">${dlChip(l.lord)}</span>`).join('<span class="dl-ar">›</span>') + (before ? `<div class="dl-warn">This moment is before the birth moment. The periods shown are the ones that would have been running.</div>` : '');
  crumb.dataset.txt = `${DL.y}-${dlP2(DL.m)}-${dlP2(DL.d)} ${dlP2(DL.H)}:${dlP2(DL.M)}:${dlP2(DL.S)}  ` + st.levels.map((l,i)=>`${DL_LV[i][1]} ${l.lord}`).join(' > ');
  stackEl.innerHTML = st.levels.map((l,i)=>{
    const len = l.end - l.start, done = Math.min(1, Math.max(0, (ev - l.start)/len)), left = l.end - ev;
    return `<div class="dl-row lv${i}" style="--pc:${DL_PC[l.lord]}"><div class="dl-r1"><span class="dl-tag">${DL_LV[i][1]}</span><span class="dl-lvn">${DL_LV[i][0]}</span>${dlChip(l.lord,true)}<span class="dl-nat">${dlPlanetInfo(l.lord)}</span>
      <span class="dl-hops"><button type="button" class="dl-hop" data-dl-hop="${i}:-1" title="Previous ${DL_LV[i][0]}">◀</button><button type="button" class="dl-hop" data-dl-hop="${i}:1" title="Next ${DL_LV[i][0]}">▶</button></span></div>
      <div class="dl-r2"><span class="dl-when">${dlStamp(l.start)}</span><span class="dl-to">→</span><span class="dl-when">${dlStamp(l.end)}</span></div>
      <div class="dl-r3"><span class="dl-len">lasts ${dlDur(len)}</span><span class="dl-left">${dlDur(left)} left</span><span class="dl-pct">${(done*100).toFixed(done<.1||done>.9?2:1)}%</span></div>
      <div class="dl-prog"><span class="dl-prog-i" style="width:${(done*100).toFixed(2)}%"></span></div></div>`; }).join('');
  // sensitivity: how far one second of birth-time error slides every boundary
  const perSec = bi.shiftPerSecMs, pr = st.levels[4], prLen = pr.end - pr.start;
  const secNeeded = perSec > 0 ? Math.max(1, Math.round(prLen/2/perSec)) : 0;
  root.querySelector('#dlSens').innerHTML = `<div class="dl-sens-t">🎚 Sensitivity <button type="button" class="dl-info" data-dl-info="1" aria-label="How much can a mismatch shift the timeline?">ⓘ Mismatch calculator</button></div>
    <div>1 minute of birth-time error moves every dasha date by about <b>${bi.shiftPerMinDays.toFixed(1)} days</b> (≈ ${dlDur(perSec)} per second). This Prana lasts ${dlDur(prLen)}, so it is only certain if the birth time is right to about <b>±${secNeeded} second${secNeeded===1?'':'s'}</b>.</div>
    <div class="dl-sens-s">Birth moment used: ${bi.date} ${bi.time} (${DL.src==='dial'?'Time Dial':'recorded'}).</div>`;
  try { dlRenderMoments(root, bi); } catch(e){ console.error('moments', e); }
  // timeline for the chosen level
  const lv = Math.min(DL.lv, 5), tabs = root.querySelector('#dlLvTabs');
  tabs.innerHTML = DL_LV.map((x,i)=>`<button type="button" class="dl-lt${i===lv?' on':''}" data-dl-lv="${i}">${x[1]}<span class="dl-lt2">${x[0]}</span></button>`).join('');
  const sibs = lv===0 ? st.mahas : dlChildren(st.levels[lv-1]), cur = st.levels[lv], tot = sibs[sibs.length-1].end - sibs[0].start;
  root.querySelector('#dlBar').innerHTML = sibs.map(s=>{ const on = s.lord===cur.lord && s.start===cur.start; return `<button type="button" class="dl-seg2${on?' on':''}" style="width:${Math.max(3,(s.end-s.start)/tot*100).toFixed(2)}%;--pc:${DL_PC[s.lord]}" data-dl-goto="${s.start}" title="${s.lord}: ${dlDur(s.end-s.start)}"><span class="dl-gl2">${DL_GL[s.lord]}</span></button>`; }).join('') +
    `<span class="dl-marker" style="left:${Math.min(100,Math.max(0,(ev - sibs[0].start)/tot*100)).toFixed(2)}%"></span>`;
  root.querySelector('#dlList').innerHTML = `<div class="dl-ltitle">${lv===0 ? 'The 9 Mahadashas from the start of the cycle' : `The 9 ${DL_LV[lv][0]}s inside ${st.levels[lv-1].lord} ${DL_LV[lv-1][0]}`}</div>` +
    sibs.map(s=>{ const on = s.lord===cur.lord && s.start===cur.start; return `<button type="button" class="dl-li${on?' on':''}" style="--pc:${DL_PC[s.lord]}" data-dl-goto="${s.start}">${on?'<span class="dl-now">NOW</span>':''}${dlChip(s.lord)}<span class="dl-lwhen">${dlStamp(s.start)}</span><span class="dl-lto">→</span><span class="dl-lwhen">${dlStamp(s.end)}</span><span class="dl-llen">${dlDur(s.end - s.start)}</span></button>`; }).join('');
}

/* ============ Known moments (many dates + times at once) ============ */
const DL_MKEY = 'vax_dl_moments_v1';
function dlPid(){ const p = currentProfileForExport || {}; return [p.name, p.dob, String(p.tob || '').slice(0,5)].join('|'); }
function dlMoments(){ try { const a = JSON.parse(localStorage.getItem(DL_MKEY) || '{}'); return Array.isArray(a[dlPid()]) ? a[dlPid()] : []; } catch(e){ return []; } }
function dlSaveMoments(list){ try { const a = JSON.parse(localStorage.getItem(DL_MKEY) || '{}'); a[dlPid()] = list; localStorage.setItem(DL_MKEY, JSON.stringify(a)); } catch(e){} }
function dlValid(y,mo,d,H,Mi,S){ if (mo<1||mo>12||d<1||d>31||H>23||Mi>59||S>59) return false; const t = new Date(Date.UTC(y,mo-1,d)); return t.getUTCMonth()===mo-1 && t.getUTCDate()===d; }
function dlParseLine(line){
  line = String(line).trim(); if (!line) return null;
  let m = line.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(.*)$/), y, mo, d, H, Mi, S, label;
  if (m){ y=+m[1]; mo=+m[2]; d=+m[3]; H=+m[4]; Mi=+m[5]; S=+(m[6]||0); label=m[7]; }
  else { m = line.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(.*)$/); if (!m) return null; d=+m[1]; mo=+m[2]; y=+m[3]; H=+m[4]; Mi=+m[5]; S=+(m[6]||0); label=m[7]; }
  if (!dlValid(y,mo,d,H,Mi,S)) return null;
  return { date:`${y}-${dlP2(mo)}-${dlP2(d)}`, time:`${dlP2(H)}:${dlP2(Mi)}:${dlP2(S)}`, label:String(label||'').replace(/^[-–,;:]\s*/,'').slice(0,40) };
}
function dlMomentMsOf(m){ const [y,mo,d] = m.date.split('-').map(Number), t = m.time.split(':').map(Number); return Date.UTC(y,mo-1,d,t[0]||0,t[1]||0,t[2]||0) - dlTz()*3600000; }
function dlAddMoment(o){
  const list = dlMoments(); if (list.some(x=> x.date===o.date && x.time===o.time && x.label===o.label)) return false;
  list.push({ id:Date.now().toString(36) + Math.random().toString(36).slice(2,5), date:o.date, time:o.time, label:o.label || '' });
  list.sort((a,b)=> (a.date+a.time) < (b.date+b.time) ? -1 : 1); dlSaveMoments(list); return true;
}
function dlRenderMoments(root, bi){
  const list = dlMoments(), el = root.querySelector('#dlMList'), cm = root.querySelector('#dlMCommon'); if (!el) return;
  if (!list.length){ el.innerHTML = `<div class="rs-empty">No moments yet. Add your known dates (marriage, job, a child, an accident…) and every one is read against the same birth moment.</div>`; cm.innerHTML = ''; return; }
  const stacks = list.map(m=> dlStack(bi.moonLon, bi.birthMs, dlMomentMsOf(m), 6));
  el.innerHTML = list.map((m,i)=>{ const st = stacks[i], pr = st.levels[4], [y,mo,d] = m.date.split('-').map(Number);
    return `<div class="dl-m"><div class="dl-m1"><span class="dl-mlab">${rsEsc(m.label || 'Moment ' + (i+1))}</span><span class="dl-mwhen">${d} ${DL_MON[mo-1]} ${y}<span class="dl-tm">${m.time}</span></span>
      <span class="dl-mbtns"><button type="button" class="dl-hop" data-dl-mopen="${m.id}" title="Open in the lens">⌖</button><button type="button" class="dl-hop" data-dl-m3d="${m.id}" title="Show in the 3D wheel">🌌</button><button type="button" class="dl-hop dl-x" data-dl-mdel="${m.id}" title="Remove">✕</button></span></div>
      <div class="dl-mchips">${st.levels.map((l,k)=>`<span class="dl-mc"><span class="dl-mtag">${DL_LV[k][1]}</span>${dlChip(l.lord)}</span>`).join('')}</div>
      <div class="dl-msub">Prana ${dlStamp(pr.start)} → ${dlStamp(pr.end)}</div></div>`; }).join('') +
    `<button type="button" class="dl-clear" id="dlMClear">Remove all ${list.length}</button>`;
  if (list.length < 2){ cm.innerHTML = ''; return; }
  const shared = []; for (let k=0;k<6;k++){ const l0 = stacks[0].levels[k].lord; if (stacks.every(s=> s.levels[k].lord === l0)) shared.push(`<b>${DL_LV[k][0]}</b> ${dlChip(l0)}`); else break; }
  const counts = {}; stacks.forEach(s=>{ const k = s.levels[1].lord; counts[k] = (counts[k]||0) + 1; });
  const top = Object.keys(counts).sort((a,b)=> counts[b]-counts[a])[0];
  cm.innerHTML = `<div class="dl-ch">${shared.length ? 'All ' + list.length + ' moments share: ' + shared.join(' · ') : 'The moments do not share a Mahadasha.'}</div>` +
    (counts[top] > 1 ? `<div class="dl-ch2">Most common Antardasha lord: ${dlChip(top)} in ${counts[top]} of ${list.length} moments.</div>` : '');
}
function dlWireExtras(root){
  const q = s=> root.querySelector(s);
  q('#dlMAdd').addEventListener('click', ()=>{
    const date = q('#dlMDate').value, time = (q('#dlMTime').value || '12:00:00'), label = q('#dlMLabel').value.trim();
    if (!date){ rsToast('Pick a date first'); return; }
    dlAddMoment({ date, time: time.length===5 ? time+':00' : time, label }); q('#dlMLabel').value = ''; dlRender(); rsToast('Moment added ✓');
  });
  q('#dlMCur').addEventListener('click', ()=>{ dlAddMoment({ date:`${DL.y}-${dlP2(DL.m)}-${dlP2(DL.d)}`, time:`${dlP2(DL.H)}:${dlP2(DL.M)}:${dlP2(DL.S)}`, label:q('#dlMLabel').value.trim() }); q('#dlMLabel').value = ''; dlRender(); rsToast('Current moment added ✓'); });
  q('#dlMParse').addEventListener('click', ()=>{
    const lines = q('#dlMText').value.split(/\n+/).filter(l=> l.trim()); let added = 0; const bad = [];
    lines.forEach(l=>{ const m = dlParseLine(l); if (m){ if (dlAddMoment(m)) added++; } else bad.push(l.trim().slice(0,40)); });
    q('#dlMMsg').innerHTML = `<b>${added}</b> added${bad.length ? ` · <span class="dl-bad">${bad.length} line${bad.length>1?'s':''} not understood:</span> ${bad.map(rsEsc).join(' | ')}` : ''}`;
    if (added) q('#dlMText').value = ''; dlRender();
  });
  root.addEventListener('click', e=>{
    let b;
    if ((b = e.target.closest('[data-dl-mopen]'))){ const m = dlMoments().find(x=> x.id===b.dataset.dlMopen); if (m){ dlSetMs(dlMomentMsOf(m)); dlRender(); const t = root.querySelector('#dlStack'); if (t) t.scrollIntoView({ behavior:'smooth', block:'start' }); } }
    else if ((b = e.target.closest('[data-dl-m3d]'))){ const m = dlMoments().find(x=> x.id===b.dataset.dlM3d); if (m){ const [y,mo,d] = m.date.split('-').map(Number), t = m.time.split(':').map(Number); dlTo3D({ y, m:mo, d, H:t[0], M:t[1], S:t[2]||0 }); } }
    else if ((b = e.target.closest('[data-dl-mdel]'))){ dlSaveMoments(dlMoments().filter(x=> x.id !== b.dataset.dlMdel)); dlRender(); }
    else if (e.target.closest('#dlMClear')){ if (confirm('Remove all saved moments for this chart?')){ dlSaveMoments([]); dlRender(); } }
    else if (e.target.closest('[data-dl-info]')) dlOpenInfo();
  });
}

/* ============ Mismatch calculator (info sheet) ============ */
function dlDurFull(ms){
  let s = Math.round(Math.abs(ms)/1000); if (s === 0) return '0 s';
  const d = Math.floor(s/86400); s -= d*86400; const h = Math.floor(s/3600); s -= h*3600; const m = Math.floor(s/60); s -= m*60;
  return [d && d + ' d', h && h + ' h', m && m + ' min', s && s + ' s'].filter(Boolean).join(' ');
}
/* pure core: shift of every dasha boundary when the birth time moves by errSec (+ = later). Uses the real chart maths, no shortcuts. */
function dlShiftCore(bi, pr, evMs, errSec){
  const st0 = dlStack(bi.moonLon, bi.birthMs, evMs, 6), sh = shiftLocalDateTime(bi.date, bi.time, errSec);
  const r = rectifyPoint(sh.dateStr, sh.timeStr, pr.lat, pr.lon, pr.tz), st1 = dlStack(r.moon.longitude, (r.jd - 2440587.5)*86400000, evMs, 6);
  return { st0, st1, same: st0.balanceLord === st1.balanceLord, shiftMs: st1.vstart - st0.vstart, moon:r.moon.longitude };
}
function dlMargin(bi, pr){      // how far the birth time can move before the Moon crosses into another nakshatra (= every dasha changes)
  const sh = shiftLocalDateTime(bi.date, bi.time, 60), r = rectifyPoint(sh.dateStr, sh.timeStr, pr.lat, pr.lon, pr.tz);
  const speed = (r.moon.longitude - bi.moonLon)/60, span = 360/27, into = normDeg(bi.moonLon) % span;     // deg per second
  return speed > 0 ? { later:(span - into)/speed, earlier:into/speed, nak:NAKSHATRAS[Math.floor(normDeg(bi.moonLon)/span)], into } : null;
}
const DLC = { mode:'A', dir:1, h:0, m:1, s:0, tdir:-1, d:0, th:1, tm:0, ts:0 };
function dlOpenInfo(){
  let sheet = document.getElementById('dlSheet');
  if (!sheet){ sheet = document.createElement('div'); sheet.id = 'dlSheet'; sheet.className = 'dl-sheet'; document.body.appendChild(sheet);
    sheet.addEventListener('click', e=>{
      if (e.target === sheet || e.target.closest('[data-dls-close]')){ sheet.classList.remove('open'); document.body.classList.remove('dl-lock'); return; }
      const b = e.target.closest('[data-dls-mode]'); if (b){ DLC.mode = b.dataset.dlsMode; dlSheetRender(); return; }
      const q = e.target.closest('[data-dls-dir]'); if (q){ DLC[q.dataset.dlsKey] = +q.dataset.dlsDir; dlSheetRender(); }
    });
    sheet.addEventListener('input', e=>{ const k = e.target.dataset && e.target.dataset.dlsNum; if (!k) return; DLC[k] = Math.max(0, +e.target.value || 0); dlSheetResult(); });
    document.addEventListener('keydown', e=>{ if (e.key === 'Escape' && sheet.classList.contains('open')){ sheet.classList.remove('open'); document.body.classList.remove('dl-lock'); } });
  }
  sheet.classList.add('open'); document.body.classList.add('dl-lock'); dlSheetRender();
}
function dlSheetRender(){
  const sheet = document.getElementById('dlSheet'), bi = dlBirth(), pr = currentProfileForExport; if (!sheet) return;
  if (!bi || !pr){ sheet.innerHTML = `<div class="dl-sh"><div class="dl-sh-h"><b>Mismatch calculator</b><button type="button" class="dl-sh-x" data-dls-close="1">✕</button></div><div class="rs-empty">Generate a chart first.</div></div>`; return; }
  const ev = dlMomentMs(), mg = dlMargin(bi, pr);
  const rows = [[1,'1 second'],[10,'10 seconds'],[30,'30 seconds'],[60,'1 minute'],[300,'5 minutes'],[900,'15 minutes'],[3600,'1 hour']].map(([sec,l])=>{ const r = dlShiftCore(bi, pr, ev, sec);
    return `<div class="dl-trow"><span class="dl-tl">${l}</span><span class="dl-tv">${r.same ? 'dasha dates move <b>' + dlDurFull(r.shiftMs) + '</b>' : '<b class="dl-bad">the Moon changes nakshatra: every dasha is different</b>'}</span></div>`; }).join('');
  const num = (k, lab, max)=>`<label class="dl-nf"><span>${lab}</span><input type="number" inputmode="numeric" min="0" max="${max}" value="${DLC[k]}" data-dls-num="${k}"></label>`;
  const dirBtn = (key, v, lab)=>`<button type="button" class="dl-sg${DLC[key]===v?' on':''}" data-dls-key="${key}" data-dls-dir="${v}">${lab}</button>`;
  sheet.innerHTML = `<div class="dl-sh" role="dialog" aria-label="Mismatch calculator"><div class="dl-sh-h"><b>How much can a mismatch shift the timeline?</b><button type="button" class="dl-sh-x" data-dls-close="1">✕</button></div>
   <p class="dl-sh-p">The whole dasha timeline hangs on where the Moon was at birth. The Moon moves about 13° a day, so even a small error in the birth time moves <b>every</b> dasha and sub-period by the <b>same amount</b>. Numbers below are worked out from <b>this chart</b> (${rsEsc(bi.date)} ${rsEsc(bi.time)}, ${DL.src==='dial'?'Time Dial':'recorded time'}).</p>
   ${mg ? `<div class="dl-safe"><div class="dl-safe-t">🧭 Safe margin</div>The Moon is in <b>${rsEsc(mg.nak.name)}</b> (lord ${dlChip(mg.nak.lord)}). The birth time can move up to <b>${dlDurFull(mg.later*1000)} later</b> or <b>${dlDurFull(mg.earlier*1000)} earlier</b> before the Moon crosses into another nakshatra. Past that, <b>every dasha changes</b>, not just the dates.</div>` : ''}
   <div class="dl-ttl">If the birth time is wrong by…</div><div class="dl-trows">${rows}</div>
   <div class="dl-ttl">Calculator</div>
   <div class="dl-seg dl-modes"><button type="button" class="dl-sg${DLC.mode==='A'?' on':''}" data-dls-mode="A">Birth error → timeline shift</button><button type="button" class="dl-sg${DLC.mode==='B'?' on':''}" data-dls-mode="B">Timeline shift wanted → birth change</button></div>
   ${DLC.mode==='A' ? `<div class="dl-calc"><div class="dl-cl">The true birth time is</div><div class="dl-seg">${dirBtn('dir',1,'later than used')}${dirBtn('dir',-1,'earlier than used')}</div><div class="dl-nfs">${num('h','hours',23)}${num('m','minutes',59)}${num('s','seconds',59)}</div></div>`
     : `<div class="dl-calc"><div class="dl-cl">I want every dasha date to move</div><div class="dl-seg">${dirBtn('tdir',1,'later')}${dirBtn('tdir',-1,'earlier')}</div><div class="dl-nfs">${num('d','days',3650)}${num('th','hours',23)}${num('tm','minutes',59)}${num('ts','seconds',59)}</div></div>`}
   <div id="dlSheetRes" class="dl-res"></div>
   <p class="dl-sh-p dl-sh-s">Why it matters: a Prana lasts hours, but 1 minute of birth error moves it by days. Use deep levels to compare candidate birth times, not to prove one. Times are in the birth place's local time. Results come from the real chart maths, so they stay right even for large errors.</p></div>`;
  dlSheetResult();
}
function dlSheetResult(){
  const out = document.getElementById('dlSheetRes'), bi = dlBirth(), pr = currentProfileForExport; if (!out || !bi || !pr) return;
  const ev = dlMomentMs(), crumb = st=> st.levels.map(l=> dlChip(l.lord)).join('<span class="dl-ar">›</span>');
  if (DLC.mode === 'A'){
    const err = DLC.dir*(DLC.h*3600 + DLC.m*60 + DLC.s), r = dlShiftCore(bi, pr, ev, err);
    if (!err){ out.innerHTML = `<div class="dl-res-t">Enter an error above.</div>`; return; }
    out.innerHTML = r.same ? `<div class="dl-res-t">Every dasha date moves <b>${r.shiftMs<0?'earlier':'later'}</b> by</div><div class="dl-res-big">${dlDurFull(r.shiftMs)}</div>
      <div class="dl-res-r"><span class="dl-cl">At your moment now</span><div class="dl-mchips">${crumb(r.st0)}</div></div><div class="dl-res-r"><span class="dl-cl">With that birth-time error</span><div class="dl-mchips">${crumb(r.st1)}</div></div>`
      : `<div class="dl-res-t dl-bad">That error moves the Moon into another nakshatra, so the dasha sequence itself changes.</div><div class="dl-res-r"><span class="dl-cl">At your moment now</span><div class="dl-mchips">${crumb(r.st0)}</div></div><div class="dl-res-r"><span class="dl-cl">With that birth-time error</span><div class="dl-mchips">${crumb(r.st1)}</div></div>`;
  } else {
    const target = DLC.tdir*((DLC.d*86400 + DLC.th*3600 + DLC.tm*60 + DLC.ts)*1000);
    if (!target){ out.innerHTML = `<div class="dl-res-t">Enter a shift above.</div>`; return; }
    const slope = dlShiftCore(bi, pr, ev, 60).shiftMs/60;       // ms of timeline shift per second of birth change (signed)
    if (!slope){ out.innerHTML = `<div class="dl-res-t">Could not work this out for this chart.</div>`; return; }
    let err = target/slope, r = dlShiftCore(bi, pr, ev, Math.round(err));
    if (r.same && r.shiftMs){ err = err*target/r.shiftMs; }
    const e = Math.round(err); r = dlShiftCore(bi, pr, ev, e);          // birth time is in whole seconds: show what that really gives
    out.innerHTML = !r.same ? `<div class="dl-res-t dl-bad">That shift would need the Moon to leave its nakshatra, so it cannot be done by a small birth-time change.</div>`
      : `<div class="dl-res-t">Move the birth time</div><div class="dl-res-big">${e>=0?'LATER':'EARLIER'} by ${dlDurFull(e*1000)}</div>
         <div class="dl-res-t">That moves every dasha date <b>${r.shiftMs<0?'earlier':'later'} by ${dlDurFull(r.shiftMs)}</b> (you asked for ${dlDurFull(target)}). Birth time works in whole seconds, and <b>1 second here = ${dlDurFull(Math.abs(slope))}</b> of timeline, so that is the closest it can get.</div>
         <div class="dl-res-r"><span class="dl-cl">At your moment, with that new birth time</span><div class="dl-mchips">${crumb(r.st1)}</div></div>${Math.abs(e) > 43200 ? '<div class="dl-warn">That is more than 12 hours of birth-time change. Check it makes sense.</div>' : ''}`;
  }
}
window.DLENS = { stack:dlStack, children:dlChildren, dur:dlDur, durFull:dlDurFull, parse:dlParseLine, shift:dlShiftCore, margin:dlMargin };
/* The app may restore the last chart (and build the studio) before this file has loaded: build our pane now if it has no content yet. */
(function(){ const pn = document.querySelector('.rs-pane[data-rs-pane="dasha"]'); if (pn && !pn.querySelector('.dl-card') && typeof rsBuildDasha === 'function'){ const nx = pn.querySelector('.rs-next'); try { rsBuildDasha(pn); if (nx) pn.appendChild(nx); } catch(e){ console.error('Dasha Lens', e); } } })();

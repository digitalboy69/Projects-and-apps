/* ============================================================================
   DASHA + TRANSIT TRIGGERS TAB (UI). Engine is in 46-dasha-transit-engine.js (DTrig), dasha maths in 45 (VDasha).
   Shows the running dashas, a live strength bar per life area at the scrubber date, and a scan of future/past trigger windows.
   ============================================================================ */
(function(){
'use strict';
if (typeof DTrig === 'undefined' || !document.getElementById('dtBody')) return;
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2,'0');
const dOf = jd => new Date(Math.round((jd-2440587.5)*864e5/6e4)*6e4);
const fd = jd => { const d = dOf(jd); return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const span = d => { d = Math.abs(d); if (d < 1) return '<1 day'; if (d < 60) return `${Math.round(d)} days`; const m = d/30.44; return m < 24 ? `${m.toFixed(1)} months` : `${(m/12).toFixed(1)} years`; };
const LV = { Strong:'#00F0D5', Good:'#F4C45C', Possible:'#8A9BB0' };
const RANGES = { p5:['Past 5 yrs',-5,0], n2:['Next 2 yrs',0,2], n5:['Next 5 yrs',0,5], n10:['Next 10 yrs',0,10] };
const TRLAB = { dbl:'double transit', jup:'Jupiter trigger', sat:'Saturn pressure', press:'Saturn + node pressure', node:'Rahu/Ketu trigger' };
const st = { range:'n5', theme:'all', sort:'date', scan:null, scanKey:'', nowKey:'' };

const profKey = p => [p.dob,p.tob,p.tz,p.lat,p.lon].join('|');
const esc = s => escapeHtml(String(s));

function nowCardHtml(p){
  const snap = DTrig.snapshot(p, currentJD), seg = snap.seg;
  let h = `<div class="dt-now"><div class="dt-now-h">On <b>${fd(currentJD)}</b> <small>(the date on the time scrubber)</small></div>`;
  if (!seg){ return h + `<div class="dt-none">This date is outside the 120-year dasha cycle of this profile.</div></div>`; }
  h += `<div class="dt-dasha">
    <span><i>Maha</i><b>${seg.md}</b><small>until ${fd(seg.mdE)}</small></span>
    <span><i>Antar</i><b>${seg.ad}</b><small>until ${fd(seg.adE)}</small></span>
    <span><i>Pratyantar</i><b>${seg.pd}</b><small>until ${fd(seg.e)}</small></span></div>`;
  const barHtml = ({theme,res})=>{
    const sc = res ? res.score : 0, on = !!(res && res.on), lv = on ? DTrig.levelOf(sc) : '';
    return `<div class="dt-bar${on?' on':''}" ${on?`style="--lv:${LV[lv]}"`:''}><span class="dt-bl">${theme.icon} ${theme.short||theme.label}</span>
      <span class="dt-bt"><i style="width:${Math.max(3,Math.min(100,sc))}%"></i></span>
      <span class="dt-bv">${on ? lv : 'quiet'}</span></div>`;
  };
  const rows = snap.rows.slice().sort((a,b)=> ((b.res&&b.res.on)?1:0)-((a.res&&a.res.on)?1:0) || (b.res?b.res.score:0)-(a.res?a.res.score:0));
  const onRows = rows.filter(r=>r.res&&r.res.on), offRows = rows.filter(r=>!(r.res&&r.res.on));
  h += `<div class="dt-bars">${onRows.length?onRows.map(barHtml).join(''):'<div class="dt-none" style="padding:8px 0">No life area is triggered on this date.</div>'}</div>`;
  if (offRows.length) h += `<details class="dt-quiet"><summary>${offRows.length} quiet areas (closest first)</summary><div class="dt-bars">${offRows.map(barHtml).join('')}</div></details>`;
  h += `</div>`;
  return h;
}

function srcHtml(t){
  return t.src && t.src.length ? `<p class="dt-src">Checked against: ${t.src.map(x=>`<a href="${esc(x[1])}" target="_blank" rel="noopener noreferrer">${esc(x[0])}</a>`).join(' · ')}</p>` : '';
}
function windowCardHtml(w){
  const t = DTrig.THEME[w.theme], c = LV[w.level], now = currentJD;
  const active = now >= w.s && now <= w.e, past = w.e < now;
  const ex = w.explain;
  return `<div class="dt-card${active?' act':''}${past?' past':''}" data-jd="${w.peakJD}" style="--lv:${c}">
    <div class="dt-ch"><i>${t.icon}</i><div><b>${t.label}</b><small>House ${ex.house} · peak ${fd(w.peakJD)}${w.dt?' · '+TRLAB[t.tp||'dbl']:''}</small></div><em>${w.level} ${w.score}</em></div>
    <div class="dt-dates"><b>${w.openStart?'… ':''}${fd(w.s)} → ${fd(w.e)}${w.openEnd?' …':''}</b><small>${span(w.e-w.s)} · ${w.dasha.md} › ${w.dasha.ad} › ${w.dasha.pd} at peak${active?' · <span class="dt-live">happening now</span>':''}</small></div>
    <details class="dt-why"><summary>Why this window</summary>
      <div class="dt-wh">Dasha link <small>(the promise)</small></div><ul>${ex.dasha.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
      <div class="dt-wh">Transit <small>(the trigger)</small></div><ul>${ex.transit.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
      ${t.rule?`<div class="dt-wh">Rule used <small>(${TRLAB[t.tp||'dbl']})</small></div><p class="dt-rule">${esc(t.rule)}</p>`:''}${srcHtml(t)}
    </details></div>`;
}

function resultsHtml(p){
  const sc = st.scan;
  if (!sc) return `<div class="dt-none">Scanning…</div>`;
  let list = sc.windows.filter(w=> st.theme==='all' || w.theme===st.theme);
  if (st.sort === 'score') list = list.slice().sort((a,b)=> b.score-a.score || a.s-b.s);
  const strong = list.filter(w=>w.level==='Strong').length;
  let h = `<div class="dt-sum"><div><label>Windows</label><b>${list.length}</b><small>${fd(sc.jd0)} → ${fd(sc.jd1)}</small></div>
    <div><label>Strong</label><b style="color:${LV.Strong}">${strong}</b><small>top-scoring</small></div>
    <div><label>Next one</label><b>${(()=>{ const n = list.filter(w=>w.e>=currentJD).sort((a,b)=>a.s-b.s)[0]; return n ? fd(Math.max(n.s,currentJD)).slice(0,6) : '—'; })()}</b><small>from the scrubber date</small></div></div>`;
  if (!list.length) return h + `<div class="dt-none">No trigger windows in this range${st.theme==='all'?'':' for this life area'}. Try a longer range.</div>`;
  return h + list.map(windowCardHtml).join('') +
    `<div class="dt-none">Tap a window to see the 3D sky at its peak. Dates are accurate to about a day, shown in your device timezone.</div>`;
}

function chips(map, cur, attr){
  return Object.keys(map).map(k=>`<button type="button" class="filter-chip${k===cur?' active':''}" data-${attr}="${k}">${map[k]}</button>`).join('');
}

function shell(p){
  const themeMap = { all:'All areas' }; DTrig.THEMES.forEach(t=>{ themeMap[t.key] = t.icon+' '+(t.short||t.label.split(' ')[0]); });
  const rangeMap = {}; Object.keys(RANGES).forEach(k=>{ rangeMap[k] = RANGES[k][0]; });
  return `<div class="dt-prof">Profile: <b>${esc(p.name||'Unnamed')}</b> <small>${esc(p.dob)} · ${esc(p.tob)}</small></div>
    <div id="dtNow">${nowCardHtml(p)}</div>
    <div class="panel-heading">Scan for trigger windows</div>
    <div class="filter-row" id="dtRange">${chips(rangeMap, st.range, 'r')}</div>
    <div class="filter-row" id="dtTheme">${chips(themeMap, st.theme, 't')}</div>
    <div class="filter-row" id="dtSort">${chips({date:'By date',score:'Strongest first'}, st.sort, 's')}</div>
    <div id="dtRes"></div>
    <details class="dt-how"><summary>How this works (and how far to trust it)</summary>
      <p class="dt-rule">Each life area names the houses it uses and its own trigger. Areas marked <i>Jupiter trigger</i>, <i>Saturn pressure</i> or <i>Rahu/Ketu trigger</i> follow what practising astrologers use for that question, instead of always requiring the double transit. Tap a window, then "Why this window", to see the rule and the pages it was checked against.</p>
      <p><b>Dasha = the promise.</b> A life event needs the running Maha, Antar and Pratyantar lords to be linked to that area's house: they rule it, sit in it, aspect it, or are its natural significator.</p>
      <p><b>Transit = the trigger.</b> Jupiter <i>and</i> Saturn must both occupy or aspect that same house at the same time (the classical double transit), counted from the Lagna and, at lower weight, from the Moon. Rahu/Ketu on the house, Mars, and slow planets crossing the natal sign of a running dasha lord raise the score.</p>
      <p>A window is shown only when both meet on the same house. The score and label (Possible / Good / Strong) rank how well they line up. It shows timing <i>potential</i>, not certainty, so use it as a guide and check it against real past events with <b>Past 5 yrs</b>.</p></details>`;
}

let scanToken = 0;
function runScan(p){
  const r = RANGES[st.range], jd0 = currentJD + r[1]*365.25, jd1 = currentJD + r[2]*365.25;
  const key = profKey(p)+'|'+st.range+'|'+Math.floor(currentJD);
  if (st.scanKey === key && st.scan){ $('dtRes').innerHTML = resultsHtml(p); return; }
  const token = ++scanToken;                      // a newer scan (range/profile changed) makes this one's result stale
  st.scan = null;
  $('dtRes').innerHTML = `<div class="dt-none" id="dtProg">Scanning… 0%</div>`;
  DTrig.scanAsync(p, null, jd0, jd1, f=>{ const e = $('dtProg'); if (e && token===scanToken) e.textContent = `Scanning… ${Math.round(f*100)}%`; }).then(out=>{
    if (token !== scanToken || !$('dtRes')) return;
    st.scan = { windows:out.windows, jd0, jd1 }; st.scanKey = key;
    $('dtRes').innerHTML = resultsHtml(p);
  });
}

function render(){
  const body = $('dtBody');
  if (!isValidProfile(activeNatalProfile)){
    body.innerHTML = `<div class="natal-card-empty">No active natal profile.<br>Save or pick a profile in the Natal tab first, then come back here.<br><button type="button" class="btn btn-ghost" id="dtGoNatal" style="margin-top:12px">Go to Natal tab</button></div>`;
    $('dtGoNatal').addEventListener('click', ()=> document.querySelector('[data-tab="natal"]').click());
    return;
  }
  const p = activeNatalProfile;
  body.innerHTML = shell(p);
  st.nowKey = Math.floor(currentJD)+'|'+profKey(p);
  runScan(p);
}

function rerenderResults(){ if (isValidProfile(activeNatalProfile)) $('dtRes').innerHTML = resultsHtml(activeNatalProfile); }
function setActive(rowId, attr, val){ $(rowId).querySelectorAll('.filter-chip').forEach(c=> c.classList.toggle('active', c.dataset[attr]===val)); }

$('dtBody').addEventListener('click', e=>{
  const r = e.target.closest('[data-r]'), t = e.target.closest('[data-t]'), s = e.target.closest('[data-s]');
  if (r){ st.range = r.dataset.r; setActive('dtRange','r',st.range); runScan(activeNatalProfile); return; }
  if (t){ st.theme = t.dataset.t; setActive('dtTheme','t',st.theme); rerenderResults(); return; }
  if (s){ st.sort = s.dataset.s; setActive('dtSort','s',st.sort); rerenderResults(); return; }
  if (e.target.closest('details')) return;
  const c = e.target.closest('.dt-card'); if (c) jumpToJD(parseFloat(c.dataset.jd));
});

// called by the main refresh loop (every ~2.5 s while this tab is open): keep the "right now" card in step with the scrubber
window.__dtRefreshNow = function(){
  if (!isValidProfile(activeNatalProfile) || !$('dtNow')) return;
  const key = Math.floor(currentJD)+'|'+profKey(activeNatalProfile);
  if (key === st.nowKey) return;
  st.nowKey = key; $('dtNow').innerHTML = nowCardHtml(activeNatalProfile);
};
window.__dtRender = render;
document.querySelector('[data-tab="triggers"]').addEventListener('click', ()=> setTimeout(render, 0));
})();

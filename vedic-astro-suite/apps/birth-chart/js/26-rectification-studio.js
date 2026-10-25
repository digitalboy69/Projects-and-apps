/* ============================================================================
   RECTIFICATION STUDIO — one calm place for every birth-time tool
   Tabs: Time Dial · Second Scan · Sandhi Table · Varga Timeline · Transit Timer · Life Events
   initRectStudio() runs after the old panels are wired; it MOVES the existing nodes
   (IDs + listeners survive) into tab panes. Old panel ids still work via switchAppTab.
   ============================================================================ */
const RS_TABS = [
  ['dates', '🔎', 'Date Finder',    1],
  ['dial',  '🕰️', 'Time Dial',      1],
  ['scan',  '🎯', 'Second Scan',    2],
  ['sandhi','⏱️', 'Sandhi Table',   2],
  ['vt',    '🗺️', 'Varga Timeline', 2],
  ['tt',    '⏳', 'Transit Timer',  2],
  ['dasha', '🔱', 'Dasha Lens',     3],
  ['life',  '🌟', 'Life Events',    3]
];
const RS_STEPS = [[1,'Set date & time'],[2,'Narrow it down'],[3,'Confirm with life']];
const RS_SUBS = { sandhi:'panel-sandhi', vt:'panel-vargatimeline', tt:'panel-transittimer' };
const RS_ROUTE = { 'panel-datefinder':'dates', 'panel-sandhi':'sandhi', 'panel-vargatimeline':'vt', 'panel-transittimer':'tt', 'panel-lifeevents':'life' };
const RS_CATS = {
  marriage:{label:'💍 Marriage / partnership', p:[7], s:[2,11], k:['Venus']},
  child:   {label:'👶 Child birth',            p:[5], s:[2,9,11], k:['Jupiter']},
  career:  {label:'💼 Job start / promotion',  p:[10], s:[6,11], k:['Sun','Saturn']},
  edu:     {label:'🎓 Higher education',       p:[4,9], s:[5], k:['Jupiter','Mercury']},
  foreign: {label:'✈️ Foreign travel / move',  p:[12], s:[3,9], k:['Rahu']},
  property:{label:'🏠 Property / vehicle',     p:[4], s:[2,11], k:['Mars','Venus']},
  gain:    {label:'💰 Big gain / wealth',      p:[2,11], s:[5,9], k:['Jupiter']},
  father:  {label:'👨 Father: major event',    p:[9], s:[3,8], k:['Sun']},
  mother:  {label:'👩 Mother: major event',    p:[4], s:[8,10], k:['Moon']},
  health:  {label:'🩺 Illness / surgery',      p:[6,8], s:[1,12], k:['Mars','Saturn']}
};
let rsState = { tab:'dial', visited:{dial:1}, conf:null, events:[], hand:{h:0,m:0,s:0} };

function rsEvKey(){
  const p = currentProfileForExport || {};
  return 'vax_rs_events:' + (p.name||'') + '|' + (p.dob||'') + '|' + (p.tob||'');
}
function rsLoadEvents(){
  try { const v = JSON.parse(localStorage.getItem(rsEvKey())||'[]'); return Array.isArray(v) ? v : []; } catch(e){ return []; }
}
function rsSaveEvents(){ try { localStorage.setItem(rsEvKey(), JSON.stringify(rsState.events)); } catch(e){} }
function rsEsc(s){ return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function rsToast(msg){
  let t = document.getElementById('rsToast');
  if (!t){ t = document.createElement('div'); t.id = 'rsToast'; t.className = 'rs-toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(rsToast._t); rsToast._t = setTimeout(()=> t.classList.remove('show'), 2600);
}

function rsClockSVG(){
  let ring = '', ticks = '';
  for (let i=0;i<12;i++){
    const a = i*30*Math.PI/180;
    ring += `<text x="${(100+90*Math.sin(a)).toFixed(1)}" y="${(100-90*Math.cos(a)+3.5).toFixed(1)}" text-anchor="middle" font-size="10" fill="currentColor">${SIGNS[i].symbol}</text>`;
    const r1 = i%3===0 ? 58 : 62, r2 = 68;
    ticks += `<line x1="${(100+r1*Math.sin(a)).toFixed(1)}" y1="${(100-r1*Math.cos(a)).toFixed(1)}" x2="${(100+r2*Math.sin(a)).toFixed(1)}" y2="${(100-r2*Math.cos(a)).toFixed(1)}" stroke="currentColor" stroke-width="${i%3===0?2:1}" opacity="${i%3===0?.9:.5}"/>`;
  }
  return `<svg viewBox="0 0 200 200" class="rs-clock" aria-hidden="true">
    <defs><radialGradient id="rsFace" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#2a2410"/><stop offset="1" stop-color="#0a0b10"/></radialGradient></defs>
    <g class="rs-ring" style="color:var(--gold)">${ring}</g>
    <circle cx="100" cy="100" r="76" fill="url(#rsFace)" stroke="var(--gold)" stroke-width="1.2" opacity=".95"/>
    <g style="color:var(--gold-bright)">${ticks}</g>
    <line id="rsHandH" x1="100" y1="100" x2="100" y2="64" stroke="var(--gold-bright)" stroke-width="4" stroke-linecap="round"/>
    <line id="rsHandM" x1="100" y1="100" x2="100" y2="48" stroke="#EAE6DF" stroke-width="3" stroke-linecap="round"/>
    <line id="rsHandS" x1="100" y1="112" x2="100" y2="42" stroke="var(--teal-bright)" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="100" cy="100" r="4.5" fill="var(--gold)"/><circle cx="100" cy="100" r="1.8" fill="#000"/>
  </svg>`;
}
function rsSetHands(){
  const h = rectHms.h, m = rectHms.m, s = rectHms.s;
  const tgt = { h:((h%12)+m/60)*30, m:(m+s/60)*6, s:s*6 };
  const cur = rsState.hand, from = { h:cur.h, m:cur.m, s:cur.s }, t0 = performance.now();
  const sh = (a,b)=> { let d = ((b-a)%360+540)%360-180; return d; };
  const dh = sh(from.h,tgt.h), dm = sh(from.m,tgt.m), ds = sh(from.s,tgt.s);
  const ease = x=> 1-Math.pow(1-x,3);
  cancelAnimationFrame(rsSetHands._r);
  const step = now=>{
    const k = Math.min(1,(now-t0)/380), e = ease(k);
    cur.h = from.h+dh*e; cur.m = from.m+dm*e; cur.s = from.s+ds*e;
    [['rsHandH',cur.h],['rsHandM',cur.m],['rsHandS',cur.s]].forEach(([id,a])=>{
      const el = document.getElementById(id); if (el) el.setAttribute('transform', `rotate(${a.toFixed(2)} 100 100)`);
    });
    if (k<1) rsSetHands._r = requestAnimationFrame(step);
  };
  rsSetHands._r = requestAnimationFrame(step);
}

function rsRefresh(){
  const pill = document.getElementById('rsPill'); if (!pill) return;
  rsSetHands();
  const p = currentProfileForExport, dEl = document.getElementById('rectDate');
  if (!p || !dEl || !dEl.value){ pill.innerHTML = `<span class="rs-pill-dim">Generate a chart first to begin ✨</span>`; return; }
  const ts = `${padHms(rectHms.h)}:${padHms(rectHms.m)}:${padHms(rectHms.s)}`;
  try {
    const r = rectifyPoint(dEl.value, ts, p.lat, p.lon, p.tz);
    const sg = SIGNS[r.asc.sign];
    pill.innerHTML = `<span class="rs-pill-t">${ts}</span><span class="rs-pill-i"><b>${sg.symbol} ${sg.name}</b> rising ${r.asc.degInSign.toFixed(1)}°</span><span class="rs-pill-i">🌙 ${r.moon.nak.name} · pada ${r.moon.nak.pada}</span>`;
  } catch(e){ pill.innerHTML = `<span class="rs-pill-dim">${ts}</span>`; }
}

function rsShow(id, scroll){
  const root = document.getElementById('rsRoot'); if (!root) return;
  rsState.tab = id; rsState.visited[id] = 1;
  let activeTab = null;
  root.querySelectorAll('.rs-tab').forEach(b=>{
    const on = b.dataset.rsTab===id; b.classList.toggle('active', on);
    b.classList.toggle('seen', !!rsState.visited[b.dataset.rsTab] && !on);
    if (on) activeTab = b;
  });
  root.querySelectorAll('.rs-pane').forEach(p=> p.classList.toggle('active', p.dataset.rsPane===id));
  const grp = RS_TABS.find(t=>t[0]===id)[3];
  root.querySelectorAll('.rs-step').forEach(s=>{
    const n = +s.dataset.step; s.classList.toggle('active', n===grp); s.classList.toggle('done', n<grp);
  });
  const line = root.querySelector('.rs-rail-fill'); if (line) line.style.width = ((grp-1)/2*100)+'%';
  // all layout reads happen together in the next frame (no read/write ping-pong while the tab swaps)
  requestAnimationFrame(()=>{
    if (activeTab){ const bar = activeTab.parentElement; bar.scrollTo({ left: activeTab.offsetLeft - (bar.clientWidth-activeTab.offsetWidth)/2, behavior:'smooth' }); }
    if (scroll){ const top = root.querySelector('.rs-tabs').getBoundingClientRect().top + window.pageYOffset - 70; window.scrollTo({ top:Math.max(0,top), behavior:'smooth' }); }
  });
  if (id==='life') rsRenderEvents();
  if (id==='dasha' && typeof dlOnShow==='function') dlOnShow();
  if (id==='dates'){ try { dfPlaceNote(); } catch(e){} }
}

function rsPaneHead(icon, title, sub){
  return `<div class="rs-pane-head"><span class="rs-ph-ico">${icon}</span><div class="rs-ph-txt"><h3>${title}</h3><p>${sub}</p></div></div>`;
}
function rsHow(el, title){
  if (!el || el.closest('details')) return;
  const d = document.createElement('details'); d.className = 'rs-how';
  d.innerHTML = `<summary>💡 ${title||'How it works'}</summary>`;
  el.parentNode.insertBefore(d, el); d.appendChild(el);
}

function initRectStudio(){
  const panel = document.getElementById('panel-rectification');
  if (!panel || panel.dataset.rs) return;
  const card = panel.querySelector('.rect-panel-card'); if (!card) return;
  panel.dataset.rs = '1';
  const q = s=> card.querySelector(s);
  const dialCard = q('.rect-time-dial-card'), actRow = q('.rect-action-row'), fullRes = q('#rectFullChartResults'), intro = q('.rect-intro');
  const ctrls = q('.rect-controls'), resWrap = q('#rectResultsWrap'), detail = q('#rectDetail');
  rsState.events = rsLoadEvents(); rsState.visited = { dial:1 }; rsState.conf = null;

  const chips = [
    ['exact','🎯','To the minute','I trust it closely'],
    ['half','🕐','Within ~30 min','Pretty close'],
    ['hours','🌓','Within a few hours','Rough idea'],
    ['unk','❔','Not sure at all','Use life events']
  ];
  panel.innerHTML = `
  <div class="rs" id="rsRoot">
    <div class="rs-hero">
      <div class="rs-aura" aria-hidden="true"></div>
      <div class="rs-clockwrap">${rsClockSVG()}</div>
      <div class="rs-hero-txt">
        <div class="rs-eyebrow">✦ Rectification Studio</div>
        <h2>Find the <em>true</em> moment of birth</h2>
        <p>Every birth-time tool in one calm place. Tell us how sure you are and we will point you to the right one.</p>
        <div class="rs-pill" id="rsPill"></div>
      </div>
      <div class="rs-ask-wrap">
        <div class="rs-ask">How sure are you of the birth time?</div>
        <div class="rs-chips">${chips.map(c=>`<button type="button" class="rs-chip" data-rs-chip="${c[0]}"><span class="rs-ci">${c[1]}</span><span class="rs-ct"><span class="rs-cb">${c[2]}</span><span class="rs-cs">${c[3]}</span></span></button>`).join('')}</div>
        <div class="rs-hint" id="rsHint"></div>
      </div>
    </div>
    <div class="rs-rail">
      <div class="rs-rail-line"><div class="rs-rail-fill"></div></div>
      ${RS_STEPS.map(s=>`<button type="button" class="rs-step" data-step="${s[0]}"><span class="rs-dot">${s[0]}</span><em class="rs-step-l">${s[1]}</em></button>`).join('')}
    </div>
    <div class="rs-tabs" role="tablist">
      ${RS_TABS.map(t=>`<button type="button" class="rs-tab" role="tab" data-rs-tab="${t[0]}" data-g="${t[3]}"><span class="rs-ti">${t[1]}</span><span class="rs-tl">${t[2]}</span></button>`).join('')}
    </div>
    <div class="rs-panes">
      ${RS_TABS.map(t=>`<section class="rs-pane" data-rs-pane="${t[0]}"></section>`).join('')}
    </div>
  </div>`;
  const pane = id=> panel.querySelector(`.rs-pane[data-rs-pane="${id}"]`);

  // Dial
  const pd = pane('dial');
  pd.innerHTML = rsPaneHead('🕰️','Time Dial','Dial an exact moment and see the whole chart for it.');
  if (intro){ rsHow(intro, 'How the dial works'); pd.appendChild(intro.closest('details') || intro); }
  pd.appendChild(dialCard); pd.appendChild(actRow); pd.appendChild(fullRes);
  // Scan
  const ps = pane('scan');
  ps.innerHTML = rsPaneHead('🎯','Second-by-Second Scan','Slide through a window of time and watch the Ascendant, D60 and nakshatra shift.');
  ps.appendChild(ctrls); ps.appendChild(resWrap); ps.appendChild(detail);
  // Sub panels (nodes keep their ids so Export still finds them)
  Object.keys(RS_SUBS).forEach(k=>{
    const el = document.getElementById(RS_SUBS[k]); const p = pane(k); if (!el) return;
    el.classList.remove('app-panel'); el.classList.add('rs-sub');
    const intro2 = el.querySelector('.tt-intro'); if (intro2) rsHow(intro2, 'What this does');
    p.insertBefore(document.createRange().createContextualFragment(({
      sandhi:rsPaneHead('⏱️','Sandhi Table','The exact moments the rising sign changes in every divisional chart.'),
      vt:rsPaneHead('🗺️','Varga Timeline','Map how a divisional chart changes across the birth-time window.'),
      tt:rsPaneHead('⏳','Transit Timer','When any planet or the Ascendant changes sign in any D-chart.') })[k]), p.firstChild);
    p.appendChild(el);
  });
  // Life
  rsBuildLife(pane('life'));
  try { rsBuildDasha(pane('dasha')); } catch(e){ console.error('Dasha Lens', e); }
  // 'Show in the 3D wheel' next to the Full Chart button on the Time Dial
  try { const b3 = document.createElement('button'); b3.type = 'button'; b3.className = 'rect-3d-btn'; b3.dataset.jump3d = 'dial'; b3.innerHTML = '🌌 Show this time in the 3D wheel'; actRow.appendChild(b3); } catch(e){}
  try { dfBuild(pane('dates')); } catch(e){ console.error('Date Finder', e); }
  // Next / Back
  RS_TABS.forEach((t,i)=>{
    const nx = RS_TABS[i+1], pv = RS_TABS[i-1];
    const d = document.createElement('div'); d.className = 'rs-next';
    d.innerHTML = (pv?`<button type="button" class="btn btn-ghost" data-rs-go="${pv[0]}">← ${pv[2]}</button>`:'<span></span>') +
      (nx?`<button type="button" class="btn btn-primary" data-rs-go="${nx[0]}">Next: ${nx[2]} ➜</button>`:`<button type="button" class="btn btn-ghost" data-rs-go="dial">↺ Start over</button>`);
    pane(t[0]).appendChild(d);
  });

  const root = document.getElementById('rsRoot');
  root.addEventListener('click', e=>{
    const tb = e.target.closest('[data-rs-tab]'); if (tb){ rsShow(tb.dataset.rsTab); return; }
    const go = e.target.closest('[data-rs-go]'); if (go){ rsShow(go.dataset.rsGo, true); return; }
    const st = e.target.closest('.rs-step'); if (st){ const f = RS_TABS.find(t=>t[3]===+st.dataset.step); rsShow(f[0]); return; }
    const ch = e.target.closest('[data-rs-chip]'); if (ch) rsChip(ch.dataset.rsChip);
  });
  const dEl = document.getElementById('rectDate'); if (dEl) dEl.addEventListener('change', rsRefresh);
  rsShow('dial'); rsRefresh();
}

function rsChip(key){
  const root = document.getElementById('rsRoot'); if (!root) return;
  root.querySelectorAll('.rs-chip').forEach(c=> c.classList.toggle('active', c.dataset.rsChip===key));
  const w = document.getElementById('rectWindow'), st = document.getElementById('rectStep'), hint = document.getElementById('rsHint');
  const set = (el,v)=>{ if (el) el.value = v; };
  const M = {
    exact:{ tab:'dial',  msg:'Lovely. Check the full chart for your time, then do a ±2 minute scan to be sure.', w:'2', s:'1' },
    half: { tab:'scan',  msg:'Scan window set to ±30 min in 10-second steps. Press Run and look for the Ascendant sign changes.', w:'30', s:'10' },
    hours:{ tab:'sandhi',msg:'Start with the Sandhi Table. It shows when the rising sign changes, so you can cut the hours down.' },
    unk:  { tab:'life',  msg:'No problem. Add 3 or more real life events and we will rank the likely rising signs.' }
  }[key];
  if (M.w) set(w, M.w); if (M.s) set(st, M.s);
  if (hint) hint.textContent = '→ ' + M.msg;
  rsState.conf = key;
  rsShow(M.tab, true);
}


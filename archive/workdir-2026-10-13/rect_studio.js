/* ============================================================================
   RECTIFICATION STUDIO — one calm place for every birth-time tool
   Tabs: Time Dial · Second Scan · Sandhi Table · Varga Timeline · Transit Timer · Life Events
   initRectStudio() runs after the old panels are wired; it MOVES the existing nodes
   (IDs + listeners survive) into tab panes. Old panel ids still work via switchAppTab.
   ============================================================================ */
const RS_TABS = [
  ['dial',  '🕰️', 'Time Dial',      1],
  ['scan',  '🎯', 'Second Scan',    2],
  ['sandhi','⏱️', 'Sandhi Table',   2],
  ['vt',    '🗺️', 'Varga Timeline', 2],
  ['tt',    '⏳', 'Transit Timer',  2],
  ['life',  '🌟', 'Life Events',    3]
];
const RS_STEPS = [[1,'Set the time'],[2,'Narrow it down'],[3,'Confirm with life']];
const RS_SUBS = { sandhi:'panel-sandhi', vt:'panel-vargatimeline', tt:'panel-transittimer' };
const RS_ROUTE = { 'panel-sandhi':'sandhi', 'panel-vargatimeline':'vt', 'panel-transittimer':'tt', 'panel-lifeevents':'life' };
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
  root.querySelectorAll('.rs-tab').forEach(b=>{
    const on = b.dataset.rsTab===id; b.classList.toggle('active', on);
    b.classList.toggle('seen', !!rsState.visited[b.dataset.rsTab] && !on);
    if (on){ const bar = b.parentElement; bar.scrollTo({ left: b.offsetLeft - (bar.clientWidth-b.offsetWidth)/2, behavior:'smooth' }); }
  });
  root.querySelectorAll('.rs-pane').forEach(p=> p.classList.toggle('active', p.dataset.rsPane===id));
  const grp = RS_TABS.find(t=>t[0]===id)[3];
  root.querySelectorAll('.rs-step').forEach(s=>{
    const n = +s.dataset.step; s.classList.toggle('active', n===grp); s.classList.toggle('done', n<grp);
  });
  const line = root.querySelector('.rs-rail-fill'); if (line) line.style.width = ((grp-1)/2*100)+'%';
  if (scroll){ const top = root.querySelector('.rs-tabs').getBoundingClientRect().top + window.pageYOffset - 70; window.scrollTo({ top:Math.max(0,top), behavior:'smooth' }); }
  if (id==='life') rsRenderEvents();
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
      <div class="rs-aura"></div>
      <div class="rs-clockwrap">${rsClockSVG()}</div>
      <div class="rs-hero-txt">
        <div class="rs-eyebrow">✦ Rectification Studio</div>
        <h2>Find the <em>true</em> moment of birth</h2>
        <p>Every tool in one calm place. Tell us how sure you are and we'll point you to the right one.</p>
        <div class="rs-pill" id="rsPill"></div>
        <div class="rs-ask">How sure are you of the birth time?</div>
        <div class="rs-chips">${chips.map(c=>`<button type="button" class="rs-chip" data-rs-chip="${c[0]}"><span>${c[1]}</span><b>${c[2]}</b><i>${c[3]}</i></button>`).join('')}</div>
        <div class="rs-hint" id="rsHint"></div>
      </div>
    </div>
    <div class="rs-rail">
      <div class="rs-rail-line"><div class="rs-rail-fill"></div></div>
      ${RS_STEPS.map(s=>`<button type="button" class="rs-step" data-step="${s[0]}"><span class="rs-dot">${s[0]}</span><em>${s[1]}</em></button>`).join('')}
    </div>
    <div class="rs-tabs" role="tablist">
      ${RS_TABS.map(t=>`<button type="button" class="rs-tab" role="tab" data-rs-tab="${t[0]}" data-g="${t[3]}"><span>${t[1]}</span>${t[2]}</button>`).join('')}
    </div>
    <div class="rs-panes">
      ${RS_TABS.map(t=>`<section class="rs-pane" data-rs-pane="${t[0]}"></section>`).join('')}
    </div>
  </div>`;
  const pane = id=> panel.querySelector(`.rs-pane[data-rs-pane="${id}"]`);

  // Dial
  const pd = pane('dial');
  pd.innerHTML = `<div class="rs-pane-head"><h3>🕰️ Time Dial</h3><p>Dial an exact moment and see the whole chart for it.</p></div>`;
  if (intro){ rsHow(intro, 'How the dial works'); pd.appendChild(intro.closest('details') || intro); }
  pd.appendChild(dialCard); pd.appendChild(actRow); pd.appendChild(fullRes);
  // Scan
  const ps = pane('scan');
  ps.innerHTML = `<div class="rs-pane-head"><h3>🎯 Second-by-Second Scan</h3><p>Slide through a window of time and watch the Ascendant, D60 and nakshatra shift.</p></div>`;
  ps.appendChild(ctrls); ps.appendChild(resWrap); ps.appendChild(detail);
  // Sub panels (nodes keep their ids so Export still finds them)
  Object.keys(RS_SUBS).forEach(k=>{
    const el = document.getElementById(RS_SUBS[k]); const p = pane(k); if (!el) return;
    el.classList.remove('app-panel'); el.classList.add('rs-sub');
    const intro2 = el.querySelector('.tt-intro'); if (intro2) rsHow(intro2, 'What this does');
    p.appendChild(el);
  });
  // Life
  rsBuildLife(pane('life'));
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

/* ---------------------------- Life-Event checker ---------------------------- */
function rsBuildLife(p){
  p.innerHTML = `
  <div class="rs-pane-head"><h3>🌟 Life-Event Checker</h3><p>Real events are the best proof. We test every possible rising sign against your dashas and slow transits.</p></div>
  <details class="rs-how"><summary>💡 How it works (and how far to trust it)</summary>
    <p>For each possible rising sign we ask: <em>at the date of each event, were the running Mahadasha / Antardasha / Pratyantardasha lords linked to the houses that rule that kind of event?</em>
    Houses a planet is linked to = the house it sits in plus the houses it rules. Jupiter and Saturn transits to those houses add a bonus. Scores are relative, a ranking and not a proof.
    Add <b>3 or more</b> dated events (marriage, job, child, move…) for a meaningful result. Treat the answer as a clue to confirm with the other tools.</p></details>
  <div class="rs-ev-form">
    <label>Event<select id="rsEvCat">${Object.keys(RS_CATS).map(k=>`<option value="${k}">${RS_CATS[k].label}</option>`).join('')}</select></label>
    <label>Date<input type="date" id="rsEvDate"></label>
    <label class="grow">Note (optional)<input type="text" id="rsEvNote" maxlength="40" placeholder="e.g. first job"></label>
    <button type="button" class="btn btn-ghost" id="rsEvAdd">＋ Add event</button>
  </div>
  <div id="rsEvList" class="rs-ev-list"></div>
  <div class="rs-ev-opts">
    <label>Search around your working time<select id="rsEvWin">
      <option value="12">Whole day · all 12 signs</option><option value="6">± 6 hours</option><option value="3" selected>± 3 hours</option><option value="1.5">± 90 minutes</option></select></label>
    <button type="button" class="btn btn-primary" id="rsEvRun">✨ Find the best-fitting rising sign</button>
  </div>
  <div id="rsEvOut"></div>`;
  p.querySelector('#rsEvAdd').addEventListener('click', ()=>{
    const d = document.getElementById('rsEvDate').value, c = document.getElementById('rsEvCat').value, n = document.getElementById('rsEvNote').value.trim();
    if (!d){ rsToast('Pick the event date first 📅'); return; }
    const p0 = currentProfileForExport;
    if (p0 && d < p0.dob){ rsToast('That date is before the birth date'); return; }
    rsState.events.push({ c, d, n }); rsState.events.sort((a,b)=> a.d<b.d?-1:1);
    rsSaveEvents(); rsRenderEvents(); document.getElementById('rsEvDate').value=''; document.getElementById('rsEvNote').value='';
    rsToast('Event added ✓');
  });
  p.querySelector('#rsEvList').addEventListener('click', e=>{
    const b = e.target.closest('[data-rs-del]'); if (!b) return;
    rsState.events.splice(+b.dataset.rsDel,1); rsSaveEvents(); rsRenderEvents();
  });
  p.querySelector('#rsEvRun').addEventListener('click', rsRunLife);
  p.addEventListener('click', e=>{
    const b = e.target.closest('[data-rs-use]'); if (!b) return;
    const off = +b.dataset.rsUse, dEl = document.getElementById('rectDate');
    const base = shiftLocalDateTime(dEl.value, document.getElementById('rectCenterTime').value, off);
    dEl.value = base.dateStr;
    const pr = base.timeStr.split(':').map(Number); rectHms = { h:pr[0], m:pr[1], s:pr[2]||0 }; updateHmsDisplay();
    rsToast('Dial set to ' + base.timeStr.slice(0,5) + ' ✓'); rsShow('dial', true);
  });
}
function rsRenderEvents(){
  const el = document.getElementById('rsEvList'); if (!el) return;
  if (!rsState.events.length){ el.innerHTML = `<div class="rs-empty">No events yet. Add your first one above. Marriage, a job, a child, a big move all work well.</div>`; return; }
  el.innerHTML = rsState.events.map((e,i)=>`<span class="rs-evchip"><b>${RS_CATS[e.c]?RS_CATS[e.c].label:rsEsc(e.c)}</b> · ${rsEsc(e.d)}${e.n?` · ${rsEsc(e.n)}`:''}<button type="button" data-rs-del="${i}" aria-label="Remove">✕</button></span>`).join('') +
    (rsState.events.length<3 ? `<div class="rs-empty" style="margin-top:8px">Tip: ${3-rsState.events.length} more event${3-rsState.events.length>1?'s':''} will make the ranking much more reliable.</div>` : '');
}

function rsHouseOf(sign, L){ return ((sign - L + 12) % 12) + 1; }
function rsLinks(P, L, chart){
  // houses planet P is linked to from lagna L: occupied + owned (nodes also act through their sign lord)
  const out = {};
  const add = (h, why)=>{ if (!out[h]) out[h] = why; };
  const pl = chart.planets[P]; if (!pl) return out;
  add(rsHouseOf(pl.sign, L), 'sits in H'+rsHouseOf(pl.sign, L));
  const owner = (P==='Rahu'||P==='Ketu') ? SIGNS[pl.sign].lord : P;
  for (let s=0;s<12;s++) if (SIGNS[s].lord===owner) add(rsHouseOf(s,L), (owner===P?'rules':'via '+owner+' rules')+' H'+rsHouseOf(s,L));
  if (owner!==P && chart.planets[owner]) add(rsHouseOf(chart.planets[owner].sign, L), 'via '+owner+' in H'+rsHouseOf(chart.planets[owner].sign, L));
  return out;
}
function rsScore(P, L, cat, chart){
  const links = rsLinks(P, L, chart); let sc = 0; const hits = [];
  Object.keys(links).forEach(h=>{
    h = +h;
    if (cat.p.indexOf(h)>-1){ sc += 2; hits.push(links[h]+' ★'); }
    else if (cat.s.indexOf(h)>-1){ sc += 1; hits.push(links[h]); }
  });
  if (cat.k.indexOf(P)>-1) sc += 0.5;
  return { sc, hits };
}
function rsEvalLagna(L, chart, evs){
  let total = 0; const detail = [];
  evs.forEach(ev=>{
    const cat = RS_CATS[ev.c]; if (!cat) return;
    let s = 0; const lines = [];
    [['Mahadasha', ev.md, 1],['Antardasha', ev.ad, 1],['Pratyantardasha', ev.pd, .5]].forEach(([nm,P,w])=>{
      if (!P) return; const r = rsScore(P, L, cat, chart); s += r.sc*w;
      lines.push(`${nm} ${P}${r.hits.length?': '+r.hits.join(', '):': no link'}`);
    });
    // slow transits
    let tHit = 0;
    [['Jupiter',[0,4,6,8]],['Saturn',[0,2,6,9]]].forEach(([P,offs])=>{
      const hs = rsHouseOf(ev.tr[P], L); const set = offs.map(o=> ((hs-1+o)%12)+1);
      const pm = set.filter(h=> cat.p.indexOf(h)>-1).length>0, sm = set.filter(h=> cat.s.indexOf(h)>-1).length>0;
      if (pm){ s += 1; tHit++; lines.push(`${P} transit reaches H${cat.p.filter(h=>set.indexOf(h)>-1).join('/H')} ★`); }
      else if (sm){ s += .4; }
    });
    if (tHit===2){ s += 1; lines.push('Double transit ✨'); }
    total += s; detail.push({ ev, s, lines });
  });
  return { total, detail };
}

function rsRunLife(){
  const out = document.getElementById('rsEvOut'); if (!out) return;
  const chart = currentChartForModal, prof = currentProfileForExport;
  if (!chart || !prof){ out.innerHTML = `<div class="rs-empty">Generate a chart first.</div>`; return; }
  if (!rsState.events.length){ rsToast('Add at least one event first'); out.innerHTML = `<div class="rs-empty">Add some dated events above, then press the button again.</div>`; return; }
  const tz = prof.tz || 0;
  const evs = rsState.events.map(e=>{
    const [y,m,d] = e.d.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m-1, d, 12) - tz*3600000);
    const jd = dt.getTime()/86400000 + 2440587.5;
    const act = findActiveDasha(chart.dashaData.mahadashas, dt) || {};
    return { c:e.c, d:e.d, n:e.n, md: act.mahadasha&&act.mahadasha.lord, ad: act.antardasha&&act.antardasha.lord, pd: act.pratyantardasha&&act.pratyantardasha.lord,
      tr:{ Jupiter: Math.floor(getSiderealLongitudeAt('Jupiter', jd)/30), Saturn: Math.floor(getSiderealLongitudeAt('Saturn', jd)/30) } };
  });
  // which rising signs occur in the chosen window, and when
  const dEl = document.getElementById('rectDate'), tStr = document.getElementById('rectCenterTime').value;
  const half = parseFloat(document.getElementById('rsEvWin').value)*3600, step = half>14000 ? 240 : 120;
  const segs = []; let cur = null;
  for (let off=-half; off<=half; off+=step){
    const sh = shiftLocalDateTime(dEl.value, tStr, off);
    const sg = rectifyPoint(sh.dateStr, sh.timeStr, prof.lat, prof.lon, tz).asc.sign;
    if (cur && cur.sign===sg) cur.end = off+step; else { cur = { sign:sg, start:off, end:off+step }; segs.push(cur); }
  }
  const bySign = {};
  segs.forEach(s=>{ (bySign[s.sign] = bySign[s.sign] || []).push(s); });
  const ranked = Object.keys(bySign).map(k=>{ const L=+k, r = rsEvalLagna(L, chart, evs); return { L, total:r.total, detail:r.detail, segs:bySign[k] }; })
    .sort((a,b)=> b.total-a.total);
  const best = ranked[0].total || 1;
  const fmt = off=>{
    const sh = shiftLocalDateTime(dEl.value, tStr, off); const day = sh.dateStr===dEl.value ? '' : (sh.dateStr>dEl.value?' +1d':' −1d');
    return sh.timeStr.slice(0,5)+day;
  };
  const close = ranked.length>1 && ranked[1].total >= ranked[0].total*0.9;
  out.innerHTML = `
    <div class="rs-res-head">Ranking of possible rising signs <span>${evs.length} event${evs.length>1?'s':''} tested</span></div>
    ${ranked.map((r,i)=>{
      const pct = Math.round(r.total/best*100), sg = SIGNS[r.L];
      return `<div class="rs-rank ${i===0?'top':''}">
        <div class="rs-rank-row"><span class="rs-rank-n">${i===0?'👑':i+1}</span><b>${sg.symbol} ${sg.name}</b>
          <div class="rs-bar"><i data-w="${pct}"></i></div><em>${pct}%</em></div>
        <div class="rs-rank-segs">${r.segs.map(s=>`<button type="button" class="rs-seg" data-rs-use="${Math.round((s.start+s.end)/2)}" title="Set the dial to the middle of this window">🕰️ ${fmt(s.start)} – ${fmt(s.end)} <u>use ➜</u></button>`).join('')}</div>
        <details class="rs-why"><summary>Why this score?</summary>${r.detail.map(x=>`<div class="rs-why-ev"><b>${RS_CATS[x.ev.c]?RS_CATS[x.ev.c].label:''} · ${rsEsc(x.ev.d)}</b><ul>${x.lines.map(l=>`<li>${rsEsc(l)}</li>`).join('')}</ul></div>`).join('')}</details>
      </div>`;
    }).join('')}
    <div class="rs-note">${close?'⚖️ <b>Close call.</b> The top signs are within 10%. Add more events or check the Sandhi / Varga tools. ':''}Times are in your birth timezone and are approximate to a few minutes. Use <b>"use ➜"</b> to load a window into the Time Dial. This ranking supports your judgement, it does not replace it.</div>`;
  requestAnimationFrame(()=> requestAnimationFrame(()=> out.querySelectorAll('.rs-bar i').forEach(b=> b.style.width = b.dataset.w+'%')));
  rsToast('Done ✨ Top fit: ' + SIGNS[ranked[0].L].name);
}

/* Hooks: keep old panel ids working + keep clock/pill live */
(function rsInstallHooks(){
  if (window.__rsHooks) return; window.__rsHooks = 1;
  const _sw = switchAppTab;
  switchAppTab = function(id){
    if (RS_ROUTE[id] && document.getElementById('rsRoot')){
      _sw('panel-rectification'); rsShow(RS_ROUTE[id]); return;
    }
    _sw(id); if (id==='panel-rectification' && document.getElementById('rsRoot')) rsRefresh();
  };
  const _up = updateHmsDisplay;
  updateHmsDisplay = function(){ _up(); try{ rsRefresh(); }catch(e){} };
})();

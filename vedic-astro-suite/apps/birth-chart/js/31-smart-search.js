/* ============================================================================
   SMART SEARCH — one box to find any tool, any placement in YOUR chart, and the meaning of any term.
   Opens from the 🔍 button, Ctrl/Cmd+K or "/". Enter = go, ↑↓ = move, Esc = close. Falls back to Google / Google AI.
   ============================================================================ */
const SRCH_PLANET = {
  Sun:'Soul, vitality, father, authority, government, confidence, heart and bones.',
  Moon:'Mind, emotions, mother, home, public, comfort, intuition, fluids.',
  Mars:'Energy, courage, siblings, land, property, surgery, competition.',
  Mercury:'Intellect, speech, trade, writing, skin, nerves, friends.',
  Jupiter:'Wisdom, children, teachers, wealth, dharma, faith, growth.',
  Venus:'Love, spouse, comforts, art, vehicles, luxury, fertility.',
  Saturn:'Discipline, delay, karma, service, longevity, structure, sorrow.',
  Rahu:'Obsession, foreign, sudden gains, illusion, technology, ambition.',
  Ketu:'Detachment, moksha, past-life skill, intuition, loss, spirituality.',
  Uranus:'Sudden change, rebellion, invention, freedom (outer planet).',
  Neptune:'Dreams, imagination, illusion, compassion (outer planet).',
  Pluto:'Transformation, power, rebirth, hidden forces (outer planet).'
};
const SRCH_HOUSE = ['Self, body, personality, vitality','Wealth, speech, family, food','Courage, siblings, effort, short travel','Home, mother, comforts, property, peace of mind','Children, intellect, creativity, romance, past merit','Enemies, debts, illness, service, daily work','Marriage, partnerships, business, spouse','Longevity, transformation, inheritance, occult, sudden events','Fortune, dharma, father, teachers, long journeys','Career, status, karma, authority','Gains, income, friends, fulfilled desires','Losses, expenses, foreign lands, sleep, moksha'];
const SRCH_ORD = ['1st first','2nd second','3rd third','4th fourth','5th fifth','6th sixth','7th seventh','8th eighth','9th ninth','10th tenth','11th eleventh','12th twelfth'];
let srchSel = 0, srchRows = [];

function srchBuild(){
  const I = [], ch = (typeof currentChartForModal !== 'undefined') ? currentChartForModal : null;
  const add = (k,ico,t,s,kw,go,q)=> I.push({k,ico,t,s:s||'',kw:(kw||''),go,q:q||t});
  HOME_ITEMS.forEach(i=> add('page',i[1],i[2],i[3],i[4]+' '+i[5]+' open go tool tab '+i[0].replace('panel-','')+(i[5]==='rectify'?' rectify rectification birth time correct fix':''),i[0]));
  if (ch){
    const pr = ch.planets || {};
    PLANET_LIST.forEach(n=>{
      const p = pr[n]; if (!p) return; const sg = SIGNS[p.sign];
      add('planet','🪐',`${n} in ${sg.name}${p.retrograde?' (R)':''}`,`House ${p.house} · ${p.nakshatra?p.nakshatra.name+' pada '+p.nakshatra.pada:''} · ${(p.dignity&&p.dignity.status&&p.dignity.status!=='Neutral')?p.dignity.status+' · ':''}${SRCH_PLANET[n]}`,
        `${n} ${sg.name} ${sg.sk} house ${p.house} h${p.house} ${p.nakshatra?p.nakshatra.name:''} ${p.dignity?p.dignity.status:''} my placement chart`,'panel-planets',`${n} in ${sg.name} in house ${p.house}`);
    });
    if (ch.outer) Object.keys(ch.outer).forEach(n=>{ const p = ch.outer[n]; if (!p) return;
      add('planet','🔭',`${n} in ${SIGNS[p.sign].name}`,`House ${p.house} — ${SRCH_PLANET[n]||''}`,`${n} outer planet ${SIGNS[p.sign].name} house ${p.house}`,'panel-planets',`${n} in ${SIGNS[p.sign].name} in house ${p.house}`); });
    const asc = ch.ascendant.sign;
    add('chart','⬆️',`Ascendant: ${SIGNS[asc].name} ${ch.ascendant.degInSign.toFixed(1)}°`,`Lagna lord ${SIGNS[asc].lord} · ${ch.ascendant.nakshatra?ch.ascendant.nakshatra.name:''}`,`ascendant lagna rising ${SIGNS[asc].name} ${SIGNS[asc].sk}`,'panel-overview',`${SIGNS[asc].name} ascendant lagna`);
    for (let h=1;h<=12;h++){
      const si = (asc+h-1)%12, s = SIGNS[si], lp = pr[s.lord];
      const occ = PLANET_LIST.filter(n=> pr[n] && pr[n].house===h).join(', ');
      add('house','🏠',`House ${h} · ${s.name}`,`${SRCH_HOUSE[h-1]} · Lord ${s.lord}${lp?' in H'+lp.house:''}${occ?' · '+occ:' · empty'}`,`house ${h} h${h} ${SRCH_ORD[h-1]} bhava ${s.name} ${s.lord} ${SRCH_HOUSE[h-1]}`,'panel-overview',`${h}th house ${SRCH_HOUSE[h-1].split(',')[0]} vedic astrology`);
    }
    try {
      const a = findActiveDasha(ch.dashaData.mahadashas, new Date());
      if (a && a.mahadasha) add('dasha','⏳',`Running dasha: ${a.mahadasha.lord} / ${a.antardasha?a.antardasha.lord:'-'}${a.pratyantardasha?' / '+a.pratyantardasha.lord:''}`,`Until ${a.antardasha?a.antardasha.endDate.toDateString():''} · ${SRCH_PLANET[a.mahadasha.lord]||''}`,`dasha mahadasha antardasha running now current period time ${a.mahadasha.lord}`,'panel-dasha',`${a.mahadasha.lord} mahadasha ${a.antardasha?a.antardasha.lord:''} antardasha results`);
    } catch(e){}
    try {
      Object.keys(ch.yogas||{}).forEach(k=>{
        const v = ch.yogas[k], list = Array.isArray(v) ? v : (v && typeof v==='object' ? [v] : []);
        const label = k.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
        list.forEach(y=>{ const nm = y.yoga||y.name||y.type||label;
          add('yoga','✨',`${nm} yoga`,`${label}${y.planet?' · '+y.planet:''}${y.house?' · house '+y.house:''}`,`yoga ${nm} ${label} ${y.planet||''}`,'panel-yogas',`${nm} yoga vedic astrology`); });
      });
    } catch(e){}
  }
  if (ch) SRCH_TOPICS.forEach((tp,i)=>{ I.push({k:'topic',ico:tp.ico,t:'Ask AI: '+tp.t+' ›',s:tp.subs.map(x=>x[0]).join(' · '),kw:'ask ai '+tp.t+' '+tp.kw+' about my chart google ai mode',go:null,q:tp.t,tp,ti:i});
    tp.subs.forEach(sb=> I.push({k:'ask',ico:tp.ico,t:tp.t+' › '+sb[0],s:sb[1],kw:'ask ai '+tp.kw+' '+sb[0],go:null,q:tp.t,tp,sub:sb})); });
  SIGNS.forEach((s,i)=> add('term',s.symbol,`${s.name} (${s.sk})`,`${s.element} · ${s.modality} · ruled by ${s.lord}`,`sign rashi ${s.name} ${s.sk} ${s.element} ${s.modality} ${s.lord}`,null,`${s.name} rashi ${s.sk} meaning`));
  NAKSHATRAS.forEach((n,i)=> add('term','🌟',`${n.name} nakshatra`,`#${i+1} · lord ${n.lord} · deity ${n.deity}`,`nakshatra star ${n.name} ${n.lord} ${n.deity}`,null,`${n.name} nakshatra characteristics`));
  Object.keys(SRCH_PLANET).forEach(n=> add('term','📖',`${n} — what it signifies`,SRCH_PLANET[n],`graha planet meaning karaka ${n} ${SRCH_PLANET[n]}`,null,`${n} in vedic astrology significations`));
  return I;
}
function srchRank(q){
  const items = srchBuild(), toks = q.toLowerCase().split(/\s+/).filter(Boolean);
  const W = { page:2, ask:3.2, topic:3.4, planet:3, house:3, chart:3, dasha:3.5, yoga:2.5, term:1 };
  const out = [];
  items.forEach(it=>{
    const hay = (it.t+' '+it.kw+' '+it.s).toLowerCase(), tl = it.t.toLowerCase(); let sc = 0, ok = true;
    for (const t of toks){
      if (hay.indexOf(t) < 0){ ok = false; break; }
      sc += tl.indexOf(t)===0 ? 6 : tl.indexOf(t)>0 ? 4 : (' '+it.kw.toLowerCase()).indexOf(' '+t)>=0 ? 2.5 : 1;
    }
    if (ok) out.push({it, sc: sc + (W[it.k]||1)});
  });
  return out.sort((a,b)=> b.sc-a.sc).slice(0,30).map(x=>x.it);
}
function srchRecent(){ try { const v = JSON.parse(localStorage.getItem('vax_srch_recent')||'[]'); return Array.isArray(v)?v:[]; } catch(e){ return []; } }
function srchRemember(q){ q = q.trim(); if (!q) return; try { const r = [q].concat(srchRecent().filter(x=>x!==q)).slice(0,6); localStorage.setItem('vax_srch_recent', JSON.stringify(r)); } catch(e){} }
function srchGoogle(q, ai){ const u = 'https://www.google.com/search?q='+encodeURIComponent(q+' vedic astrology')+(ai?'&udm=50':''); window.open(u,'_blank','noopener'); }

function srchOpen(prefill){
  let ov = document.getElementById('srchOv');
  if (!ov){
    ov = document.createElement('div'); ov.id = 'srchOv'; ov.className = 'srch-ov';
    ov.innerHTML = `<div class="srch-box" role="dialog" aria-label="Search">
      <div class="srch-handle"></div><div class="srch-top"><span class="srch-mag">🔍</span><input id="srchIn" type="search" autocomplete="off" spellcheck="false" placeholder="Search tools, planets, houses, yogas, meanings…"><button type="button" class="srch-clr" id="srchClr" aria-label="Clear" hidden>✕</button><kbd>Esc</kbd><button type="button" class="srch-x" id="srchX" aria-label="Close">Done</button></div>
      <div class="srch-list" id="srchList"></div>
      <div class="srch-foot"><span>↑↓ move · Enter open · 🌐 Google it</span>
        <button type="button" class="srch-click" id="srchClick" title="When on, click anything in a chart to Google it">🖱️ Click-to-Google <b id="srchClickState">off</b></button></div></div>`;
    document.body.appendChild(ov);
    ov.addEventListener('mousedown', e=>{ if (e.target===ov) srchClose(); });
    const inp = ov.querySelector('#srchIn');
    inp.addEventListener('input', ()=>{ srchRender(inp.value); document.getElementById('srchClr').hidden = !inp.value; });
    ov.querySelector('#srchClr').addEventListener('click', ()=>{ inp.value=''; document.getElementById('srchClr').hidden=true; srchRender(''); inp.focus(); });
    ov.querySelector('#srchX').addEventListener('click', srchClose);
    inp.addEventListener('keydown', e=>{
      if (e.key==='ArrowDown'){ e.preventDefault(); srchMove(1); }
      else if (e.key==='ArrowUp'){ e.preventDefault(); srchMove(-1); }
      else if (e.key==='Enter'){ e.preventDefault(); srchAct(srchSel, e.shiftKey || e.ctrlKey || e.metaKey); }
      else if (e.key==='Escape'){ srchClose(); }
    });
    ov.querySelector('#srchList').addEventListener('click', e=>{
      const g = e.target.closest('[data-g]'); if (g){ const rr = srchRows[+g.dataset.g]; srchRemember(inp.value); if (rr.k==='ask') srchAsk(rr.tp, rr.sub, true); else srchGoogle(rr.q, false); return; }
      const r = e.target.closest('[data-i]'); if (r) srchAct(+r.dataset.i);
      if (e.target.closest('[data-back]')){ srchRender(inp.value); return; }
      const a = e.target.closest('[data-ask]'); if (a){ srchTopicBox(+a.dataset.ask); return; }
      const c = e.target.closest('[data-chip]'); if (c){ inp.value = c.dataset.chip; srchRender(inp.value); inp.focus(); }
    });
    ov.querySelector('#srchClick').addEventListener('click', ()=>{ const t = document.getElementById('qsearchToggle'); if (t) t.click(); srchClickState(); });
  }
  ov.classList.add('show'); document.body.classList.add('srch-lock');
  const inp = ov.querySelector('#srchIn'); inp.value = prefill || ''; document.getElementById('srchClr').hidden = !inp.value; srchRender(inp.value); srchClickState(); setTimeout(()=> inp.focus(), 30);
}
function srchClickState(){ const s = document.getElementById('srchClickState'); if (s) s.textContent = (typeof qsearchActive!=='undefined' && qsearchActive) ? 'ON' : 'off'; const b = document.getElementById('srchClick'); if (b) b.classList.toggle('on', typeof qsearchActive!=='undefined' && qsearchActive); }
function srchClose(){ const ov = document.getElementById('srchOv'); if (ov) ov.classList.remove('show'); document.body.classList.remove('srch-lock'); }
function srchMove(d){
  if (!srchRows.length) return; srchSel = (srchSel + d + srchRows.length) % srchRows.length;
  const list = document.getElementById('srchList');
  list.querySelectorAll('.srch-row').forEach((r,i)=> r.classList.toggle('sel', i===srchSel));
  const el = list.querySelector('.srch-row.sel'); if (el) el.scrollIntoView({ block:'nearest' });
}
function srchAct(i, google){
  const r = srchRows[i]; if (!r) return; const q = document.getElementById('srchIn').value;
  if (r.k==='topic'){ srchTopicBox(r.ti); return; }
  if (r.k==='ask'){ srchRemember(q || r.t); srchAsk(r.tp, r.sub, !!google); return; }
  if (r.k==='google' || r.k==='ai'){ srchRemember(q); srchGoogle(q, r.k==='ai'); return; }
  srchRemember(q || r.t);
  if (google || !r.go){ srchGoogle(r.q, false); if (r.go) {} return; }
  srchClose(); switchAppTab(r.go);
}
function srchRender(q){
  const list = document.getElementById('srchList'); if (!list) return;
  q = (q||'').trim(); let html = '';
  if (!q){
    const hasChart = typeof currentChartForModal !== 'undefined' && currentChartForModal;
    const rec = srchRecent();
    srchRows = srchBuild().filter(x=> x.k==='dasha').concat(HOME_ITEMS.slice(0,0).map(()=>null)).filter(Boolean);
    ['panel-rectification','panel-dasha','panel-transit','panel-vargas','panel-yogas','panel-reading'].forEach(id=>{
      const it = HOME_ITEMS.find(h=>h[0]===id); if (it) srchRows.push({k:'page',ico:it[1],t:it[2],s:it[3],go:id,q:it[2]});
    });
    if (hasChart){ html += srchGroupsHTML(); }
    html += `<div class="srch-h">${hasChart?'Right now & popular':'Popular tools'}</div>`;
    if (rec.length) html = `<div class="srch-h">Recent</div><div class="srch-chips">${rec.map(r=>`<button type="button" data-chip="${rsEsc(r)}">${rsEsc(r)}</button>`).join('')}</div>` + html;
    html += srchRows.map((r,i)=> srchRowHTML(r,i)).join('');
    html += `<div class="srch-tip">Try: <button data-chip="mars">mars</button> <button data-chip="7th house">7th house</button> <button data-chip="dasha">dasha</button> <button data-chip="rectify">rectify</button> <button data-chip="rohini">rohini</button> <button data-chip="gaja">gaja kesari</button></div>`;
  } else {
    srchRows = srchRank(q);
    html += srchRows.length ? '' : `<div class="srch-none">No match inside the app for “${rsEsc(q)}”. Try Google below 👇</div>`;
    html += srchRows.map((r,i)=> srchRowHTML(r,i)).join('');
    const base = srchRows.length;
    srchRows.push({k:'google',ico:'🌐',t:`Google “${q}”`,s:'Search the web with “vedic astrology” added',q}); html += srchRowHTML(srchRows[base], base);
    srchRows.push({k:'ai',ico:'🤖',t:`Ask Google AI about “${q}”`,s:'AI answer with sources',q}); html += srchRowHTML(srchRows[base+1], base+1);
  }
  srchSel = 0; list.innerHTML = html; list.scrollTop = 0;
  const first = list.querySelector('.srch-row'); if (first) first.classList.add('sel');
}

const SRCH_GROUPS = [
  ['🪞','Know yourself',['me','purpose','mind','talent','spiritual','karma','karmapat','thisyear']],
  ['❤️','Love & relationships',['love','lovers','soulmate','chemistry','breakup','partnerfit','spouse','marriagetime','marriedlife','karmarel','children']],
  ['💰','Money & career',['career','job','money','moneyblocks','wealthboost','fame','inherit','losses','property','foreign']],
  ['🏡','Family, health & remedies',['health','longevity','father','mother','siblings','friends','enemies','education','remedies']]
];
function srchGroupsHTML(){
  const seen = {}; let n = 0;
  let out = '<div class="srch-hero"><b>✨ Ask AI about your chart</b><small>Pick a topic, then a question. Opens Google AI with your exact chart data.</small></div>';
  const tile = (tp,i)=> `<button type="button" class="srch-tile" data-ask="${i}" style="--d:${(n++%12)*28}ms"><span>${tp.ico}</span><b>${rsEsc(tp.t)}</b><small>${tp.subs.length} questions</small></button>`;
  SRCH_GROUPS.forEach(g=>{
    const tiles = g[2].map(id=>{ const i = SRCH_TOPICS.findIndex(t=>t.id===id); if (i<0 || seen[i]) return ''; seen[i]=1; return tile(SRCH_TOPICS[i], i); }).join('');
    if (tiles) out += `<div class="srch-grp"><span>${g[0]}</span>${g[1]}</div><div class="srch-tiles">${tiles}</div>`;
  });
  const rest = SRCH_TOPICS.map((tp,i)=> seen[i]?'':tile(tp,i)).join('');
  if (rest.trim()) out += `<div class="srch-grp"><span>🔎</span>More</div><div class="srch-tiles">${rest}</div>`;
  return out;
}
function srchRowHTML(r,i){
  const tag = { page:'Open', planet:'Your chart', house:'Your chart', chart:'Your chart', dasha:'Your chart', yoga:'Your chart', term:'Learn', ask:'Ask AI', topic:'Ask AI ›', google:'Web', ai:'Web' }[r.k] || '';
  return `<div class="srch-row ${i===0?'sel':''}" data-i="${i}" data-k="${r.k}"><span class="srch-ico">${r.ico}</span><div class="srch-txt"><b>${rsEsc(r.t)}</b><small>${rsEsc((r.s||'').slice(0,150))}</small></div><span class="srch-tag">${tag}</span>${r.k!=='google'&&r.k!=='ai'?`<button type="button" class="srch-g" data-g="${i}" title="${r.k==='ask'?'Copy the full brief':'Google this'}">${r.k==='ask'?'📋':'🌐'}</button>`:''}</div>`;
}
document.addEventListener('keydown', e=>{
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target||{}).tagName) || (e.target && e.target.isContentEditable);
  if ((e.key==='k' || e.key==='K') && (e.ctrlKey || e.metaKey)){ e.preventDefault(); srchOpen(); }
  else if (e.key==='/' && !typing && document.getElementById('appTabbar') && document.getElementById('appTabbar').classList.contains('show')){ e.preventDefault(); srchOpen(); }
  else if (e.key==='Escape') srchClose();
});
document.addEventListener('click', e=>{
  if (e.target.closest && e.target.closest('#quickSearchBtn')){ e.preventDefault(); e.stopImmediatePropagation(); srchOpen(); }
}, true);


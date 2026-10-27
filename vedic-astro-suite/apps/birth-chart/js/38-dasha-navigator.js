/* ---------- Drill-down navigator ---------- */
function dxRowHtml(p, idx, lvl, path, ref){
  const st = dxStatus(p, ref), c = DASHA_PLANET_COLORS[p.lord], drill = lvl < 5;
  return `<div class="dx-row ${st}"><button type="button" class="dx-row-h" ${drill ? `data-dx-in="${idx}"` : 'disabled'}>
      <span class="dx-dot" style="background:${c}">${PLANET_GLYPHS[p.lord]}</span>
      <span class="dx-row-main"><b>${dxNames(path.concat([p]), lvl)}</b><small>${dxFmt(p.startDate,lvl)} → ${dxFmt(p.endDate,lvl)}</small></span>
      <span class="dx-row-side"><span class="dx-age">Age ${dxAgeTxt(dxAge(p.startDate))}–${dxAgeTxt(dxAge(p.endDate))}</span>${dxPill(st)}</span>
      ${drill ? '<span class="dx-chev">›</span>' : '<span class="dx-chev"></span>'}</button>
    ${st==='now' ? `<div class="dx-bar"><i style="width:${dxPct(p,ref).toFixed(1)}%;background:${c}"></i></div>` : ''}</div>`;
}
function dxNavHtml(){
  const ref = dxRef(), path = DXN.path, L = path.length, list = dxList(path);
  const steps = DX_SHORT.map((nm,i) => {
    const sel = path[i], cur = i === L;
    return `<button type="button" class="dx-st ${cur?'cur':''} ${sel?'has':''}" data-dx-lvl="${i}" ${i>L?'disabled':''}><small>${nm}</small><b>${sel ? PLANET_GLYPHS[sel.lord]+' '+DX_ABBR[sel.lord] : (cur ? 'pick ↓' : '·')}</b></button>`;
  }).join('');
  let head;
  if (L === 0){
    head = `<div class="dx-ctx"><div class="dx-ctx-t"><b>All Mahadashas</b><small>The full 120-year cycle · tap one to open its Antardashas</small></div></div>`;
  } else {
    const cur = path[L-1], parent = L === 1 ? DX.mds : calculateSubPeriods(path[L-2]), i = parent.findIndex(x => x.startDate.getTime() === cur.startDate.getTime());
    const prev = parent[i-1], next = parent[i+1], c = DASHA_PLANET_COLORS[cur.lord], st = dxStatus(cur, ref), lvl = L-1;
    head = `<div class="dx-ctx" style="--pc:${c}"><div class="dx-ctx-bar">
        <button type="button" class="dx-nav" data-dx-sib="-1" ${prev?'':'disabled'}>‹ ${prev ? DX_ABBR[prev.lord] : ''}</button>
        <button type="button" class="dx-nav up" data-dx-up>↑ Up</button>
        <button type="button" class="dx-nav" data-dx-sib="1" ${next?'':'disabled'}>${next ? DX_ABBR[next.lord] : ''} ›</button></div>
      <div class="dx-ctx-t"><span class="dx-bigglyph">${PLANET_GLYPHS[cur.lord]}</span><div><b>${dxNames(path, L)} ${DX_LEVELS[lvl]}</b>
        <small>${dxFmt(cur.startDate, Math.max(lvl,2))} → ${dxFmt(cur.endDate, Math.max(lvl,2))} · ${dxPill(st).replace(/<[^>]+>/g,'')}</small></div></div>
      ${st==='now' ? `<div class="dx-bar big"><i style="width:${dxPct(cur,ref).toFixed(1)}%;background:${c}"></i></div>` : ''}</div>`;
  }
  const rows = list.map((p,idx) => dxRowHtml(p, idx, L, path, ref)).join('');
  return `<div class="dx-steps">${steps}</div>${head}
    <div class="dx-lh"><h6>${DX_LEVELS[L]}${L===0?'s':' periods'} <span>${list.length} ${list.length===1?'period':'periods'}</span></h6><button type="button" class="dx-nowbtn" data-dx-now>📍 Go to now</button></div>
    <div class="dx-list">${rows}</div>`;
}
function dxNavRender(scroll){
  const box = document.getElementById('dxNav'); if (!box) return;
  box.innerHTML = dxNavHtml();
  if (scroll){ const n = box.querySelector('.dx-row.now'); (n || box).scrollIntoView({ behavior:'smooth', block: n ? 'center' : 'start' }); }
}
function dxPathAt(at, depth){ // chain of periods containing `at`, up to `depth` levels
  const act = findActiveDasha(DX.dasha.mahadashas, at); if (!act) return [];
  return [act.mahadasha, act.antardasha, act.pratyantardasha, act.sookshmaDasha, act.pranaDasha, act.dehaDasha].filter(Boolean).slice(0, depth);
}

function buildDashaSection(chart, profile){
  const dasha = chart.dashaData, now = new Date();
  DX = { dasha, birth: dasha.mahadashas[0].startDate, tz: profile && profile.tz !== undefined ? profile.tz : 0, mds: [] };
  const cap = DX.birth.getTime() + 120*365.25*86400000;
  const mds = dasha.mahadashas.filter(m => m.startDate.getTime() < cap); DX.mds = mds;
  const active = findActiveDasha(dasha.mahadashas, now), span = cap - DX.birth.getTime();
  const nowFrac = Math.max(0, Math.min(1, (now - DX.birth)/span)), age = dxAge(now);
  DXN = { path: active ? [active.mahadasha] : [], at: null };

  let nowCard;
  if (active){
    const lv = [active.mahadasha, active.antardasha, active.pratyantardasha, active.sookshmaDasha, active.pranaDasha, active.dehaDasha].filter(Boolean);
    const m = active.mahadasha, c = DASHA_PLANET_COLORS[m.lord];
    nowCard = `<div class="dx-now" style="--pc:${c}">
      <div class="dx-now-top"><span class="dx-bigglyph">${PLANET_GLYPHS[m.lord]}</span>
        <div><div class="dx-eyebrow">You are in</div><h4>${m.lord} – ${active.antardasha?active.antardasha.lord:''} period</h4>
        <small>Age ${age.toFixed(1)} · ${yearsUntil(now, m.endDate)} left in ${m.lord} Mahadasha</small></div></div>
      <div class="dx-bar big"><i style="width:${dxPct(m,now).toFixed(1)}%;background:${c}"></i></div>
      <div class="dx-bar-lbl"><span>${dxFmt(m.startDate,1)}</span><span>${dxPct(m,now).toFixed(0)}% through</span><span>${dxFmt(m.endDate,1)}</span></div>
      <div class="dx-ladder">${lv.map((p,i)=>`<div class="dx-step"><span class="dx-step-l">${DX_LEVELS[i]}</span><span class="dx-step-p"><i style="background:${DASHA_PLANET_COLORS[p.lord]}"></i>${PLANET_GLYPHS[p.lord]} ${p.lord}</span><span class="dx-step-e">until ${dxFmt(p.endDate,Math.max(i,2))}</span></div>`).join('')}</div>
    </div>`;
  } else nowCard = `<div class="dx-now"><div class="dx-eyebrow">Today is outside this chart's 120-year range.</div></div>`;

  let segs = '', ticks = '';
  mds.forEach((m,i) => {
    const s = m.startDate.getTime()-DX.birth.getTime(), e = Math.min(m.endDate.getTime(), cap)-DX.birth.getTime(), w = (e-s)/span*100;
    segs += `<button type="button" class="dx-seg ${active && active.mahadasha===m ? 'is-now':''}" data-dx-md="${i}" style="width:${w}%;background:${DASHA_PLANET_COLORS[m.lord]}" title="${m.lord} ${dxAgeTxt(dxAge(m.startDate))}–${dxAgeTxt(Math.min(120,dxAge(m.endDate)))}"><span class="g">${PLANET_GLYPHS[m.lord]}</span>${w>7?`<span class="n">${m.lord}</span>`:''}</button>`;
  });
  for (let a=0;a<=120;a+=10) ticks += `<span style="left:${a/120*100}%">${a}</span>`;
  const strip = `<div class="dx-strip-scroll"><div class="dx-strip-wrap"><div class="dx-strip">${segs}</div><div class="dx-ticks">${ticks}</div>
      ${active?`<div class="dx-today" style="left:${nowFrac*100}%"><span>Today · ${age.toFixed(0)}</span></div>`:''}</div></div>`;

  setTimeout(() => { dxSetCheck(nowJulianDay()); dxNavRender(false); const sc=document.querySelector('.dx-strip-scroll'), t=document.querySelector('.dx-today'); if(sc&&t&&sc.scrollWidth>sc.clientWidth) sc.scrollLeft = t.offsetLeft - sc.clientWidth/2; }, 0);

  return `<div class="dx">
    <div class="dx-intro">Your life runs through nine planetary periods in a fixed 120-year cycle, starting from the Moon's nakshatra. Begins with <b>${dasha.startLord}</b> (${dasha.balanceYears.toFixed(1)} years remaining at birth).</div>
    ${nowCard}
    <div class="dx-sec"><h5>🔎 Check any date &amp; time <span>all 6 levels at that moment</span></h5>
      <div class="dx-chk"><div class="dx-chk-in">
        <label>Date<input type="date" id="dxDate"></label><label>Time<input type="time" id="dxTime"></label>
        <div class="dx-chk-q"><button type="button" data-dx-q="now">Now</button><button type="button" data-dx-q="birth">At birth</button><button type="button" data-dx-q="open" class="gold">Open in navigator →</button></div></div>
        <div id="dxChk"></div></div></div>
    <div class="dx-sec"><h5>① Life timeline <span>0 – 120 years · tap a planet</span></h5>${strip}</div>
    <div class="dx-sec"><h5>② Explore periods <span>drill down level by level</span></h5><div id="dxNav" class="dx-detail"></div></div>
  </div>`;
}

document.addEventListener('click', (e) => {
  if (!DX.dasha) return;
  const md = e.target.closest('[data-dx-md]');
  if (md){ DXN.at = null; DXN.path = [DX.mds[parseInt(md.dataset.dxMd)]]; dxNavRender(false); const n = document.getElementById('dxNav'); if (n) n.scrollIntoView({ behavior:'smooth', block:'start' }); return; }
  const into = e.target.closest('[data-dx-in]');
  if (into){ DXN.path = DXN.path.concat([dxList(DXN.path)[parseInt(into.dataset.dxIn)]]); dxNavRender(false); const n = document.getElementById('dxNav'); if (n && n.getBoundingClientRect().top < 0) n.scrollIntoView({ behavior:'smooth', block:'start' }); return; }
  const lvl = e.target.closest('[data-dx-lvl]');
  if (lvl && !lvl.disabled){ DXN.path = DXN.path.slice(0, parseInt(lvl.dataset.dxLvl)); dxNavRender(false); return; }
  if (e.target.closest('[data-dx-up]')){ DXN.path = DXN.path.slice(0, -1); dxNavRender(false); return; }
  const sib = e.target.closest('[data-dx-sib]');
  if (sib && !sib.disabled){
    const L = DXN.path.length, parent = L === 1 ? DX.mds : calculateSubPeriods(DXN.path[L-2]), cur = DXN.path[L-1];
    const i = parent.findIndex(x => x.startDate.getTime() === cur.startDate.getTime()), n = parent[i + parseInt(sib.dataset.dxSib)];
    if (n){ DXN.path = DXN.path.slice(0, -1).concat([n]); dxNavRender(false); } return;
  }
  if (e.target.closest('[data-dx-now]')){ DXN.at = null; DXN.path = dxPathAt(new Date(), 2); dxNavRender(true); return; }
  const q = e.target.closest('[data-dx-q]');
  if (q){
    if (q.dataset.dxQ === 'now') dxSetCheck(nowJulianDay());
    else if (q.dataset.dxQ === 'birth') dxSetCheck(DX.birth.getTime()/86400000 + 2440587.5 + 0.0001);
    else if (q.dataset.dxQ === 'open' && DX.chkAt){ DXN.at = DX.chkAt; DXN.path = dxPathAt(DX.chkAt, 4); dxNavRender(true); }
  }
});
document.addEventListener('input', (e) => { if (DX.dasha && (e.target.id === 'dxDate' || e.target.id === 'dxTime')) dxCheckRender(); });

function formatDashaDate(d){
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
function formatDashaDatePrecise(d){
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
function formatDashaDateTime(d){
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const hh = String(d.getUTCHours()).padStart(2,'0');
  const mm = String(d.getUTCMinutes()).padStart(2,'0');
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${hh}:${mm} UT`;
}

const dashaPeriodCache = {};
const DASHA_LEVEL_NEXT = { antardasha:"pratyantar", pratyantar:"sookshma", sookshma:"prana", prana:"deha", deha:null };
const DASHA_LEVEL_PREFIX = { pratyantar:"pr", sookshma:"sk", prana:"pn", deha:"dh" };

function buildDashaLevelChips(parentPeriod, parentKey, level, now){
  const periods = calculateSubPeriods(parentPeriod);
  const nextLevel = DASHA_LEVEL_NEXT[level];
  const useDateTime = (level === "sookshma");
  const fmt = (level === "antardasha") ? formatDashaDate : formatDashaDatePrecise;
  return periods.map((p, idx)=>{
    const isActive = now >= p.startDate && now < p.endDate;
    const childKey = `${parentKey}-${DASHA_LEVEL_PREFIX[nextLevel] || 'x'}${idx}`;
    dashaPeriodCache[childKey] = p;
    const canDrillFurther = DASHA_LEVEL_NEXT[nextLevel] !== undefined && nextLevel !== null;
    return `<span class="dasha-ad-chip ${isActive?'ad-active':''} ${canDrillFurther?'dasha-drill-chip':''}" ${canDrillFurther?`data-drill-key="${childKey}" data-drill-level="${nextLevel}"`:''}>
      ${PLANET_GLYPHS[p.lord]} ${p.lord}: ${fmt(p.startDate)}–${fmt(p.endDate)}${canDrillFurther?' <span class="dasha-drill-hint">▸</span>':''}
    </span>${canDrillFurther?`<div class="dasha-drill-panel" id="drill-${childKey}" style="display:none;"></div>`:''}`;
  }).join('');
}

function buildAntardashaChips(mahadasha, active, now, mdIdx){
  const parentKey = `md${mdIdx}`;
  dashaPeriodCache[parentKey] = mahadasha;
  return buildDashaLevelChips(mahadasha, parentKey, "antardasha", now);
}

function expandDashaLevel(key, level){
  const parentPeriod = dashaPeriodCache[key];
  const panel = document.getElementById('drill-'+key);
  if (!parentPeriod || !panel) return;
  const now = new Date();
  if (panel.dataset.expanded === 'true'){
    panel.style.display = panel.style.display === 'none' ? '' : 'none';
    return;
  }
  const label = level === "pratyantar" ? "Pratyantardasha" : level === "sookshma" ? "Sookshma Dasha" : level === "prana" ? "Prana Dasha" : "Deha Dasha";
  panel.innerHTML = `<div class="dasha-drill-label">${label} (within ${parentPeriod.lord}):</div><div class="dasha-drill-chips">${buildDashaLevelChips(parentPeriod, key, level, now)}</div>`;
  panel.dataset.expanded = 'true';
  panel.style.display = '';
}
function yearsUntil(from, to){
  const years = (to - from) / (365.25*24*60*60*1000);
  if (years < 0) return "0 years";
  if (years < 1) return Math.round(years*12) + " months";
  return years.toFixed(1) + " years";
}

const YOGA_DESCRIPTIONS = {
  Ruchaka: "Mars in own sign or exaltation, angled from Lagna. Classically linked to courage, physical vigor, and leadership.",
  Bhadra: "Mercury in own sign or exaltation, angled from Lagna. Linked to sharp intellect and communication skill.",
  Hamsa: "Jupiter in own sign or exaltation, angled from Lagna. Linked to wisdom, ethics, and respected standing.",
  Malavya: "Venus in own sign or exaltation, angled from Lagna. Linked to refinement, comfort, and artistic sense.",
  Sasa: "Saturn in own sign or exaltation, angled from Lagna. Linked to discipline, endurance, and authority through effort."
};


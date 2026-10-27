/* ============================================================================
   DASHA TIME FINDER  (Vimshottari, all 6 levels)
   Six cards: Mahadasha > Antardasha > Pratyantardasha > Sookshma > Prana > Deha.
   Pick a planet in a card -> that card shows the EXACT start and end date + time
   (to the second) and the next card unlocks with that period's sub-periods.
   No new astrology maths: periods come from the existing engine only
   (DX.mds from js/38, calculateSubPeriods from js/10). Times are shown in the
   birth place's local time (DX.tz) and in UT.
   Hooks in by wrapping buildDashaSection (js/38) to append one section.
   ============================================================================ */
const DTF_LEVELS = [
  { name:'Mahadasha',       hint:'Major period · up to 120 years in total' },
  { name:'Antardasha',      hint:'Sub-period inside the Mahadasha' },
  { name:'Pratyantardasha', hint:'Sub-period inside the Antardasha' },
  { name:'Sookshma Dasha',  hint:'Fourth level · inside the Pratyantardasha' },
  { name:'Prana Dasha',     hint:'Fifth level · inside the Sookshma' },
  { name:'Deha Dasha',      hint:'Sixth level · inside the Prana, about an hour long' }
];
const DTF_MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// sel[i] = chosen planet at level i, occ[i] = which occurrence (only Mahadasha can repeat inside 120 years)
let DTF = { sel:[null,null,null,null,null,null], occ:[0,0,0,0,0,0], msg:'' };

/* ---------- formatting ---------- */
function dtfP2(n){ return String(n).padStart(2,'0'); }
function dtfSnap(d){ return new Date(Math.round(d.getTime()/1000)*1000); }   // whole seconds
function dtfTzLabel(){
  const t = Number(DX.tz) || 0, a = Math.abs(t), h = Math.floor(a), m = Math.round((a-h)*60);
  return 'UTC' + (t<0 ? '−' : '+') + h + (m ? ':' + dtfP2(m) : '');
}
function dtfStamp(d){                       // birth-place local time, with seconds
  const L = dxLocal(dtfSnap(d));
  return `${L.getUTCDate()} ${DTF_MON[L.getUTCMonth()]} ${L.getUTCFullYear()}, ${dtfP2(L.getUTCHours())}:${dtfP2(L.getUTCMinutes())}:${dtfP2(L.getUTCSeconds())}`;
}
function dtfStampUT(d){
  const s = dtfSnap(d);
  return `${s.getUTCDate()} ${DTF_MON[s.getUTCMonth()]} ${s.getUTCFullYear()}, ${dtfP2(s.getUTCHours())}:${dtfP2(s.getUTCMinutes())}:${dtfP2(s.getUTCSeconds())} UT`;
}
function dtfShort(d, lvl){                  // compact label for the planet chips
  const L = dxLocal(d), base = `${DTF_MON[L.getUTCMonth()]} ${L.getUTCFullYear()}`;
  if (lvl <= 1) return base;
  const day = `${L.getUTCDate()} ${base}`;
  return lvl >= 3 ? `${day} ${dtfP2(L.getUTCHours())}:${dtfP2(L.getUTCMinutes())}` : day;
}
function dtfDur(ms){                        // e.g. "3y 2mo 14d"; seconds only when shorter than 1 hour
  let r = Math.round(ms/1000);
  const units = [['y',31557600],['mo',2629800],['d',86400],['h',3600],['m',60],['s',1]], parts = [];
  for (const [n,v] of units){ const q = Math.floor(r/v); r -= q*v; if (q) parts.push([q,n]); }
  const keep = parts.filter(x => !(ms >= 3600000 && x[1] === 's'));
  return keep.length ? keep.slice(0,3).map(x => x[0]+x[1]).join(' ') : '0s';
}

/* ---------- logic ---------- */
function dtfList(chain, i){                 // the 9 (or fewer) periods offered at level i, or null if locked
  if (i === 0) return DX.mds;
  return chain.length >= i ? calculateSubPeriods(chain[i-1].p) : null;
}
function dtfChain(){                        // resolve current selection into real periods
  const chain = []; let list = DX.mds;
  for (let i = 0; i < DTF_LEVELS.length; i++){
    const lord = DTF.sel[i]; if (!lord || !list) break;
    const matches = list.filter(p => p.lord === lord); if (!matches.length) break;
    const k = Math.min(DTF.occ[i] || 0, matches.length - 1);
    chain.push({ p: matches[k], matches, k });
    list = calculateSubPeriods(matches[k]);
  }
  return chain;
}
function dtfClearFrom(i){ for (let j = i; j < DTF_LEVELS.length; j++){ DTF.sel[j] = null; DTF.occ[j] = 0; } }
function dtfSetPath(periods){               // select an existing chain of periods (used by "current dasha")
  dtfClearFrom(0); let list = DX.mds;
  periods.forEach((p, i) => {
    if (!list) return;
    const m = list.filter(x => x.lord === p.lord), k = m.findIndex(x => x.startDate.getTime() === p.startDate.getTime());
    if (k < 0){ list = null; return; }
    DTF.sel[i] = p.lord; DTF.occ[i] = k; list = calculateSubPeriods(m[k]);
  });
}

/* ---------- html ---------- */
function dtfSummary(chain, now){
  if (DTF.msg) return `<div class="dtf-sum empty">${DTF.msg}</div>`;
  if (!chain.length) return `<div class="dtf-sum empty">Choose a planet in the <b>Mahadasha</b> card below. Every choice unlocks the next level, and the card shows the exact start and end.</div>`;
  const i = chain.length - 1, p = chain[i].p, c = DASHA_PLANET_COLORS[p.lord], st = dxStatus(p, now);
  const path = chain.map(x => `<span class="dtf-pp" style="--pc:${DASHA_PLANET_COLORS[x.p.lord]}">${PLANET_GLYPHS[x.p.lord]} ${x.p.lord}</span>`).join('<i>›</i>');
  const stTxt = st === 'now' ? 'Running now' : (st === 'next' ? 'Upcoming' : 'Finished');
  const bar = st === 'now' ? `<div class="dx-bar"><i style="width:${dxPct(p,now).toFixed(1)}%;background:${c}"></i></div><div class="dtf-left">${dxPct(p,now).toFixed(0)}% through · ${dxLeft(p.endDate - now)} left</div>` : '';
  return `<div class="dtf-sum" style="--pc:${c}">
    <div class="dtf-sum-top"><small>${DTF_LEVELS[i].name}${i < DTF_LEVELS.length - 1 ? ' · pick the next level below to go deeper' : ''}</small><span class="dtf-st ${st}">${stTxt}</span></div>
    <div class="dtf-path">${path}</div>
    <div class="dtf-times"><div><span>Starts</span><b>${dtfStamp(p.startDate)}</b></div><div><span>Ends</span><b>${dtfStamp(p.endDate)}</b></div><div><span>Length</span><b>${dtfDur(p.endDate - p.startDate)}</b></div></div>
    <div class="dtf-tz">Local time at the birth place (${dtfTzLabel()}) · seconds shown</div>${bar}</div>`;
}
function dtfCardHtml(i, chain, now){
  const lv = DTF_LEVELS[i], list = dtfList(chain, i), cur = chain[i];
  const head = `<div class="dtf-ch"><span class="dtf-n">${i+1}</span><div><b>${lv.name}</b><small>${lv.hint}</small></div>${cur ? `<span class="dtf-sel">${PLANET_GLYPHS[cur.p.lord]} ${cur.p.lord}</span>` : ''}</div>`;
  if (!list) return `<div class="dtf-card lock" id="dtfCard${i}">${head}<div class="dtf-lock">🔒 Pick a ${DTF_LEVELS[i-1].name} first</div></div>`;
  const chips = DASHA_SEQUENCE.map(lord => {
    const m = list.filter(p => p.lord === lord), c = DASHA_PLANET_COLORS[lord];
    if (!m.length) return `<button type="button" class="dtf-chip" disabled style="--pc:${c}" title="Not part of this chart (falls before birth)"><span class="dtf-g">${PLANET_GLYPHS[lord]}</span><b>${lord}</b><small>—</small></button>`;
    const on = !!cur && cur.p.lord === lord;
    return `<button type="button" class="dtf-chip ${on ? 'on' : ''}" style="--pc:${c}" data-dtf-pick="${i}:${lord}" aria-pressed="${on}"><span class="dtf-g">${PLANET_GLYPHS[lord]}</span><b>${lord}</b><small>${dtfShort(m[0].startDate, i)}${m.length > 1 ? ' · ×' + m.length : ''}</small></button>`;
  }).join('');
  let extra = '';
  if (cur){
    const p = cur.p, c = DASHA_PLANET_COLORS[p.lord];
    if (cur.matches.length > 1){
      extra += `<div class="dtf-occ"><span>${cur.p.lord} comes ${cur.matches.length} times in this range, choose one:</span>` +
        cur.matches.map((m, j) => `<button type="button" class="${j === cur.k ? 'on' : ''}" data-dtf-occ="${i}:${j}">${dtfShort(m.startDate,1)} → ${dtfShort(m.endDate,1)}</button>`).join('') + `</div>`;
    }
    extra += `<div class="dtf-rev" style="--pc:${c}">
      <div><span>Starts</span><b>${dtfStamp(p.startDate)}</b><small>${dtfStampUT(p.startDate)}</small></div>
      <div><span>Ends</span><b>${dtfStamp(p.endDate)}</b><small>${dtfStampUT(p.endDate)}</small></div>
      <div class="dtf-len">Length ${dtfDur(p.endDate - p.startDate)} · ${dxStatus(p, now) === 'now' ? 'running now' : (dxStatus(p, now) === 'next' ? 'upcoming' : 'finished')}</div></div>`;
    if (p.fullStart && p.fullStart.getTime() < p.startDate.getTime() - 1000){
      extra += `<div class="dtf-note">This period began before birth (${dtfStamp(p.fullStart)}), so the chart counts it from birth.</div>`;
    }
  }
  return `<div class="dtf-card ${cur ? 'has' : ''}" id="dtfCard${i}" style="--pc:${cur ? DASHA_PLANET_COLORS[cur.p.lord] : '#D4AF37'}">${head}<div class="dtf-chips">${chips}</div>${extra}</div>`;
}
function dtfHtml(){
  const chain = dtfChain(), now = new Date();
  const bar = `<div class="dtf-top"><button type="button" class="dtf-btn gold" data-dtf-now>📍 Use my current dasha</button><button type="button" class="dtf-btn" data-dtf-clear>✕ Clear</button></div>`;
  return bar + dtfSummary(chain, now) + DTF_LEVELS.map((_, i) => dtfCardHtml(i, chain, now)).join('');
}
function dtfRender(){ const r = document.getElementById('dtfRoot'); if (r) r.innerHTML = dtfHtml(); }

/* ---------- wiring ---------- */
(function(){
  const base = buildDashaSection;
  buildDashaSection = function(chart, profile){      // js/38 builds DX; we append our section inside the .dx wrapper
    const html = base(chart, profile);
    DTF = { sel:[null,null,null,null,null], occ:[0,0,0,0,0], msg:'' };
    const block = `<div class="dx-sec dtf"><h5>⏱ Dasha Time Finder <span>pick a planet at each of the 6 levels</span></h5>
      <p class="dtf-intro">Choose a planet in each card. You get the <b>exact start and end date and time</b> of that period. Vimshottari years are 365.25 days, as in the rest of the app.</p>
      <div id="dtfRoot">${dtfHtml()}</div></div>`;
    const k = html.lastIndexOf('</div>');
    return k < 0 ? html + block : html.slice(0, k) + block + html.slice(k);
  };
})();

document.addEventListener('click', (e) => {
  if (!DX.dasha) return;
  const pick = e.target.closest('[data-dtf-pick]');
  if (pick){
    const [a, lord] = pick.dataset.dtfPick.split(':'), i = parseInt(a, 10);
    DTF.msg = '';
    if (DTF.sel[i] === lord && dtfChain().length > i) dtfClearFrom(i);       // tap again = unselect
    else { DTF.sel[i] = lord; DTF.occ[i] = 0; dtfClearFrom(i + 1); }
    dtfRender();
    const nx = document.getElementById('dtfCard' + (i + 1)); if (nx && DTF.sel[i]) nx.scrollIntoView({ behavior:'smooth', block:'nearest' });
    return;
  }
  const occ = e.target.closest('[data-dtf-occ]');
  if (occ){ const [a, b] = occ.dataset.dtfOcc.split(':'), i = parseInt(a, 10); DTF.occ[i] = parseInt(b, 10); dtfClearFrom(i + 1); dtfRender(); return; }
  if (e.target.closest('[data-dtf-clear]')){ dtfClearFrom(0); DTF.msg = ''; dtfRender(); return; }
  if (e.target.closest('[data-dtf-now]')){
    const act = findActiveDasha(DX.dasha.mahadashas, new Date());
    if (!act){ dtfClearFrom(0); DTF.msg = 'Today is outside this chart’s 120-year range.'; }
    else { DTF.msg = ''; dtfSetPath([act.mahadasha, act.antardasha, act.pratyantardasha, act.sookshmaDasha, act.pranaDasha, act.dehaDasha].filter(Boolean)); }
    dtfRender();
  }
});

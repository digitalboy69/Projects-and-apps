/* ===== 36 Dasha Systems — PANEL (system picker, "running now" ladder, level-by-level drill-down) =====
   Engines: 78 core · 79 nakshatra · 80 rasi · 81 ayur+special. Styles: css/35-dasha-systems.css. */
(function(){
'use strict';
const DS = window.DashaSys;
const FAMILIES = [
  ['Nakshatra','Nakshatra dashas'],
  ['Conditional','Conditional nakshatra dashas'],
  ['Phalita','Phalita rasi dashas'],
  ['Ayur','Ayur dashas'],
  ['Special','Special dashas']
];
const CONDITIONAL = ['shodasottari','shattrimsa','dwadasottari','dwisaptati','sataabdika','chaturaseeti','shashtihayani','panchottari'];
const famOf = s => s.family === 'Nakshatra' && CONDITIONAL.includes(s.id) ? 'Conditional' : s.family;
const ELEM = { Fire:'#d9824a', Earth:'#8fae6b', Air:'#6fa8c8', Water:'#7a8fd4' };
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const S = { chart:null, sys:null, gender:'M', subMode:'auto', path:[], data:null };
try { S.gender = localStorage.getItem('vx_ds_gender') === 'F' ? 'F' : 'M'; S.subMode = localStorage.getItem('vx_ds_sub') || 'auto'; } catch(e){}

const tz = () => (S.chart && S.chart.tzOffsetHours) || 0;
function fmt(ms, withTime){
  const d = new Date(ms + tz()*3600000);
  const base = String(d.getUTCDate()).padStart(2,'0') + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  return withTime ? base + ' ' + String(d.getUTCHours()).padStart(2,'0') + ':' + String(d.getUTCMinutes()).padStart(2,'0') : base;
}
function dur(ms){
  const days = ms / 86400000;
  if (days >= 365.25*1) return (days/365.25).toFixed(days >= 365.25*10 ? 1 : 2).replace(/\.0+$/,'') + ' yrs';
  if (days >= 30) return (days/30.4375).toFixed(1) + ' months';
  if (days >= 1) return days.toFixed(1) + ' days';
  return (days*24).toFixed(1) + ' hrs';
}
const age = ms => ((ms - S.data.c.birth) / DS.YR);
function tile(sys, key){
  const col = sys.keyType === 'planet' ? (window.DASHA_PLANET_COLORS && DASHA_PLANET_COLORS[key]) || '#d4a24a' : ELEM[SIGNS[key].element];
  return `<span class="ds-tile" style="--c:${col}">${DS.glyph(sys,key)}</span>`;
}
const withTime = lv => lv >= 3;

function recompute(){
  const sys = S.sys;
  const r = DS.compute(sys, S.chart, { gender:S.gender, subMode:S.subMode });
  const limit = r.c.birth + 128 * DS.YR;
  r.periods = r.periods.filter(p => p.start < limit);
  S.data = { c:r.c, periods:r.periods };
}
function listAt(path){ return path.length ? DS.children(S.sys, S.data.c, path[path.length-1]) : S.data.periods; }

function rowHtml(p, i, now){
  const sys = S.sys, lv = p.level, isNow = now >= p.start && now < p.end;
  return `<button type="button" class="ds-row${isNow ? ' now' : ''}" data-i="${i}" ${lv >= 4 ? 'disabled' : ''}>`
    + tile(sys, p.key)
    + `<span class="ds-rt"><b>${DS.label(sys,p.key)}</b><small>${fmt(p.start, withTime(lv))} → ${fmt(p.end, withTime(lv))}</small></span>`
    + `<span class="ds-rd">${dur(p.end - p.start)}${lv < 3 ? `<em>age ${Math.max(0,age(p.start)).toFixed(1)}–${age(p.end).toFixed(1)}</em>` : ''}</span>`
    + (lv < 4 ? '<span class="ds-go">›</span>' : '') + (isNow ? '<span class="ds-nowtag">now</span>' : '') + `</button>`;
}

function systemHtml(){
  const sys = S.sys, c = S.data.c, now = Date.now();
  const ap = sys.applic(c);
  const active = DS.active(sys, c, S.data.periods, now);
  let h = `<button type="button" class="ds-back" data-act="home">‹ All 36 systems</button>`;
  h += `<div class="ds-head"><div><div class="ds-eyebrow">${famLabel(sys)}</div><h4>${sys.name}</h4><small>${sys.blurb}</small></div>`
     + `<span class="ds-badge ${sys.conf === 'classical' ? 'ok' : 'warn'}" title="${sys.conf === 'classical' ? 'Standard, widely agreed rules' : 'Software conventions differ on some rules; treat as interpretation'}">${sys.conf === 'classical' ? 'classical' : 'interpretation varies'}</span></div>`;
  h += `<div class="ds-note ${ap.ok ? 'g' : 'b'}"><span>${ap.ok ? '✓' : '!'}</span><div>${ap.text}</div></div>`;
  if (sys.needsGender || sys.subToggle){
    h += `<div class="ds-ctl">`;
    if (sys.needsGender) h += `<div class="ds-seg" data-k="gender"><span>Gender</span><button type="button" data-v="M" class="${S.gender==='M'?'on':''}">Male</button><button type="button" data-v="F" class="${S.gender==='F'?'on':''}">Female</button></div>`;
    if (sys.subToggle) h += `<div class="ds-seg" data-k="sub"><span>Sub-periods</span><button type="button" data-v="auto" class="${S.subMode==='auto'?'on':''}">Classical</button><button type="button" data-v="equal" class="${S.subMode==='equal'?'on':''}">Equal</button><button type="button" data-v="prop" class="${S.subMode==='prop'?'on':''}">Proportional</button></div>`;
    h += `</div>`;
  }
  if (sys.rule) h += `<p class="ds-rule">${sys.rule}</p>`;
  // running now ladder
  h += `<div class="ds-now"><div class="ds-eyebrow">Running now</div>`;
  if (active.length){
    h += `<div class="ds-ladder">` + active.map((p,i)=>
      `<div class="ds-lad"><span class="ds-lv">${DS.LEVELS[i]}</span>${tile(sys,p.key)}<span class="ds-rt"><b>${DS.label(sys,p.key)}</b><small>${fmt(p.start,withTime(i))} → ${fmt(p.end,withTime(i))}</small></span></div>`).join('') + `</div>`;
  } else h += `<p class="ds-rule">No period is running today (outside the calculated span).</p>`;
  h += `</div>`;
  // drill-down
  const crumbs = [`<button type="button" data-act="crumb" data-n="0">${sys.name}</button>`].concat(S.path.map((p,i)=>
    `<button type="button" data-act="crumb" data-n="${i+1}">${DS.label(sys,p.key)}</button>`)).join('<i>›</i>');
  h += `<div class="ds-drill"><div class="ds-crumbs">${crumbs}</div>`;
  h += `<div class="ds-eyebrow">${DS.LEVELS[S.path.length]}dasha${S.path.length ? ' of ' + DS.label(sys, S.path[S.path.length-1].key) : ' — tap a period to open its sub-periods'}</div>`;
  const list = listAt(S.path);
  h += `<div class="ds-list">` + list.map((p,i)=> rowHtml(p,i,now)).join('') + `</div></div>`;
  return h;
}
function famLabel(sys){ return FAMILIES.find(f => f[0] === famOf(sys))[1]; }

function homeHtml(){
  let h = `<p class="ds-intro">Pick a system. Each one opens <b>level by level</b> — Maha › Antar › Pratyantar › Sookshma › Prana — with the <b>start and end of every period</b>.</p>`;
  FAMILIES.forEach(([f,title])=>{
    const items = DS.list.filter(s => famOf(s) === f);
    h += `<div class="ds-fam"><div class="ds-eyebrow">${title}</div><div class="ds-grid">`
      + items.map(s => `<button type="button" class="ds-card" data-id="${s.id}"><b>${s.name}</b><small>${s.blurb}</small></button>`).join('') + `</div></div>`;
  });
  return h;
}

function paint(root){
  root = root || document.getElementById('ds-root'); if (!root) return;
  try { root.innerHTML = S.sys ? systemHtml() : homeHtml(); }
  catch(e){ root.innerHTML = `<div class="vx-note b"><div>Could not compute this system for this chart. (${String(e && e.message || e)})</div></div>`; console.error(e); }
}

window.buildDashaSystemsPanel = function(chart){
  S.chart = chart; S.data = null;
  if (S.sys){ try { recompute(); } catch(e){ S.sys = null; } }
  return `<div class="section-heading"><h3>36 Dasha Systems</h3><div class="rule"></div></div><div class="ds" id="ds-root">${S.sys ? systemHtml() : homeHtml()}</div>`;
};

document.addEventListener('click', e => {
  const root = e.target.closest('#ds-root'); if (!root || !S.chart) return;
  const q = sel => e.target.closest(sel);
  let b;
  if ((b = q('.ds-card'))){
    S.sys = DS.map[b.dataset.id]; S.path = [];
    try { recompute(); } catch(err){ S.sys = null; console.error(err); }
    paint(root); root.scrollIntoView({block:'start', behavior:'smooth'}); return;
  }
  if ((b = q('[data-act="home"]'))){ S.sys = null; S.path = []; paint(root); return; }
  if ((b = q('[data-act="crumb"]'))){ S.path = S.path.slice(0, +b.dataset.n); paint(root); return; }
  if ((b = q('.ds-seg button'))){
    const k = b.parentNode.dataset.k;
    if (k === 'gender') S.gender = b.dataset.v; else S.subMode = b.dataset.v;
    try { localStorage.setItem(k === 'gender' ? 'vx_ds_gender' : 'vx_ds_sub', b.dataset.v); } catch(err){}
    S.path = []; recompute(); paint(root); return;
  }
  if ((b = q('.ds-row')) && !b.disabled){
    const p = listAt(S.path)[+b.dataset.i];
    if (p){ S.path = S.path.concat([p]); paint(root); root.querySelector('.ds-drill').scrollIntoView({block:'start', behavior:'smooth'}); }
  }
});
})();

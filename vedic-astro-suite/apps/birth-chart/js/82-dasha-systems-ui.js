/* ===== 36 Dasha Systems — PANEL (system picker, "running now" ladder, level-by-level drill-down) =====
   Engines: 78 core · 79 nakshatra · 80 rasi · 81 ayur+special. Styles: css/35-dasha-systems.css. */
(function(){
'use strict';
const DS = window.DashaSys;
// 36 systems folded into 7 groups: systems an astrologer reads side by side live together.
const GROUPS = [
  { id:'nak',   title:'Moon-based (Nakshatra)', ico:'🌙', desc:'The classic life timelines, read from the Moon\u2019s nakshatra. Vimshottari is the main one; the others are cross-checks.',
    ids:['vimshottari','yogini','ashtottari','kalachakra'] },
  { id:'cond',  title:'Conditional dashas', ico:'⚖️', desc:'Nakshatra systems that are meant only when the chart meets a condition. The ones that apply to you are shown first.',
    ids:['shodasottari','shattrimsa','dwadasottari','dwisaptati','sataabdika','chaturaseeti','shashtihayani','panchottari'] },
  { id:'chara', title:'Chara (Jaimini)', ico:'🧭', desc:'Sign-based dashas from the Jaimini school \u2014 the Chara variants side by side, plus the Chara + Sthira hybrid.',
    ids:['chara-parasara','chara-knrao','chara-iranganti1','chara-iranganti2','yogardha'] },
  { id:'nara',  title:'Narayana family', ico:'🛕', desc:'Sign dashas for life events, wealth and fortune: Narayana, Sudasa, Drig, Trikona and Lagnamsaka.',
    ids:['narayana','sudasa','drig','trikona','lagnamsaka'] },
  { id:'kendra',title:'Kendra & Padakrama', ico:'🔲', desc:'Sign dashas that move through kendras or by footsteps (padakrama).',
    ids:['kendradi','moola','padanadhamsa','paryaya'] },
  { id:'ayur',  title:'Longevity (Ayur)', ico:'⏳', desc:'Dashas used to judge life span and critical periods.',
    ids:['sthira','shoola','niryana','mandooka','brahma'] },
  { id:'spec',  title:'Special purpose', ico:'✨', desc:'Status, spiritual and fine-tuning dashas: Varnada, Navamsa, Sandhya, Chakra and Tara Lagna.',
    ids:['varnada','navamsa','sandhya','chakra','taralagna'] }
];
const GMAP = {}; GROUPS.forEach(g => g.ids.forEach(i => { GMAP[i] = g; }));
const gById = id => GROUPS.find(g => g.id === id);
const gIco = g => '<span class="ds-ico">' + g.ico + '</span>';
const ELEM = { Fire:'#d9824a', Earth:'#8fae6b', Air:'#6fa8c8', Water:'#7a8fd4' };
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// One icon (emoji key -> SVG via shared/icons.js) per system
const ICO = { vimshottari:'🔯', ashtottari:'✴️', kalachakra:'☸️', yogini:'🪷', shodasottari:'🌞', shattrimsa:'🔅', dwadasottari:'💝', dwisaptati:'🔀',
  sataabdika:'💠', chaturaseeti:'🧳', shashtihayani:'🌄', panchottari:'🦀', 'chara-parasara':'🧭', 'chara-knrao':'🏹', 'chara-iranganti1':'🙍',
  'chara-iranganti2':'🙋', narayana:'🛕', sudasa:'💴', drig:'🧐', trikona:'🔺', lagnamsaka:'🧱', yogardha:'⚖️', kendradi:'🔲', padanadhamsa:'👣',
  paryaya:'♻️', moola:'🪴', sthira:'⚓', shoola:'🔱', niryana:'🕯️', mandooka:'🐸', brahma:'🌠', varnada:'🎖️', navamsa:'💒', sandhya:'🌆',
  chakra:'🎡', taralagna:'🌃' };
const ico = x => '<span class="ds-ico">' + (ICO[x.id] || '🎡') + '</span>';
const S = { chart:null, grp:null, sys:null, gender:'M', subMode:'auto', path:[], data:null };
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
  const r = DS.compute(sys, S.chart, opts());
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

const opts = () => ({ gender:S.gender, subMode:S.subMode });
const sysOf = g => g.ids.map(i => DS.map[i]).filter(Boolean);
function ordered(g, c){        // conditional group: systems that apply to this chart first
  const L = sysOf(g);
  if (g.id !== 'cond') return L;
  const ok = x => x.applic(c).ok ? 0 : 1;
  return L.map((x,i)=>[x,i]).sort((a,b)=> ok(a[0]) - ok(b[0]) || a[1] - b[1]).map(x => x[0]);
}
function ctrlHtml(list){
  let h = '';
  if (list.some(x => x.needsGender)) h += `<div class="ds-seg" data-k="gender"><span>Gender</span><button type="button" data-v="M" class="${S.gender==='M'?'on':''}">Male</button><button type="button" data-v="F" class="${S.gender==='F'?'on':''}">Female</button></div>`;
  if (list.some(x => x.subToggle)) h += `<div class="ds-seg" data-k="sub"><span>Sub-periods</span><button type="button" data-v="auto" class="${S.subMode==='auto'?'on':''}">Classical</button><button type="button" data-v="equal" class="${S.subMode==='equal'?'on':''}">Equal</button><button type="button" data-v="prop" class="${S.subMode==='prop'?'on':''}">Proportional</button></div>`;
  return h ? `<div class="ds-ctl">${h}</div>` : '';
}
function chipsHtml(g, c){
  const list = ordered(g, c);
  return `<div class="ds-chips"><button type="button" class="ds-chip${S.sys ? '' : ' on'}" data-id="cmp"><b>Compare</b></button>`
    + list.map(x => {
        const ok = g.id === 'cond' ? x.applic(c).ok : null;
        return `<button type="button" class="ds-chip${S.sys === x ? ' on' : ''}" data-id="${x.id}">${ico(x)}<b>${x.name}</b>${ok === true ? '<i class="ds-dot" title="Applies to your chart"></i>' : ''}</button>`;
      }).join('') + `</div>`;
}
const badge = x => `<span class="ds-badge ${x.conf === 'classical' ? 'ok' : 'warn'}" title="${x.conf === 'classical' ? 'Standard, widely agreed rules' : 'Software conventions differ on some rules; treat as interpretation'}">${x.conf === 'classical' ? 'classical' : 'varies'}</span>`;

function groupHtml(){      // side-by-side comparison of every system in the group
  const g = gById(S.grp), now = Date.now(), c = DS.ctx(S.chart, opts()), list = ordered(g, c);
  let h = `<button type="button" class="ds-back" data-act="home">‹ All dasha groups</button>`;
  h += `<div class="ds-head">${gIco(g)}<div class="ds-ht"><div class="ds-eyebrow">${list.length} systems · side by side</div><h4>${g.title}</h4></div></div><p class="ds-rule">${g.desc}</p>`;
  h += chipsHtml(g, c) + ctrlHtml(list);
  if (g.id === 'cond'){ const n = list.filter(x => x.applic(c).ok).length; h += `<div class="ds-note ${n ? 'g' : 'b'}"><span>${n ? '✓' : '!'}</span><div>${n ? n + ' of ' + list.length + ' conditional dashas apply to this chart (marked with a gold dot).' : 'None of the conditional dashas apply to this chart — they are shown for study only.'}</div></div>`; }
  h += `<div class="ds-eyebrow">Running now in each system</div><div class="ds-cmpl">`;
  list.forEach(x => {
    let act = [], ap;
    try { const r = DS.compute(x, S.chart, opts()); act = DS.active(x, r.c, r.periods, now); ap = x.applic(r.c); } catch(e){ ap = { ok:false, text:'' }; }
    h += `<button type="button" class="ds-cmp${g.id === 'cond' && !ap.ok ? ' dim' : ''}" data-id="${x.id}">`
      + `<div class="ds-cmp-h">${ico(x)}<span class="ds-rt"><b>${x.name}</b><small>${x.blurb}</small></span>`
      + (g.id === 'cond' ? `<span class="ds-badge ${ap.ok ? 'ok' : 'warn'}">${ap.ok ? 'applies' : 'not met'}</span>` : badge(x)) + `<span class="ds-go">›</span></div>`
      + `<div class="ds-cmp-c">` + (act.length ? act.slice(0,3).map((p,i)=>
          `<span class="ds-cc"><i>${DS.LEVELS[i]}</i><b>${DS.label(x,p.key)}</b><small>to ${fmt(p.end, false)}</small></span>`).join('') : '<span class="ds-cc"><small>No period running today</small></span>')
      + `</div></button>`;
  });
  return h + `</div>`;
}

function systemHtml(){
  const sys = S.sys, g = GMAP[sys.id], c = S.data.c, now = Date.now();
  const ap = sys.applic(c);
  const active = DS.active(sys, c, S.data.periods, now);
  let h = `<button type="button" class="ds-back" data-act="cmp">‹ ${g.title} — compare</button>`;
  h += chipsHtml(g, c);
  h += `<div class="ds-head">${ico(sys)}<div class="ds-ht"><div class="ds-eyebrow">${g.title}</div><h4>${sys.name}</h4><small>${sys.blurb}</small></div>${badge(sys)}</div>`;
  h += `<div class="ds-note ${ap.ok ? 'g' : 'b'}"><span>${ap.ok ? '✓' : '!'}</span><div>${ap.text}</div></div>`;
  h += ctrlHtml([sys]);
  if (sys.rule) h += `<p class="ds-rule">${sys.rule}</p>`;
  h += `<div class="ds-now"><div class="ds-eyebrow">Running now</div>`;
  if (active.length){
    h += `<div class="ds-ladder">` + active.map((p,i)=>
      `<div class="ds-lad"><span class="ds-lv">${DS.LEVELS[i]}</span>${tile(sys,p.key)}<span class="ds-rt"><b>${DS.label(sys,p.key)}</b><small>${fmt(p.start,withTime(i))} → ${fmt(p.end,withTime(i))}</small></span></div>`).join('') + `</div>`;
  } else h += `<p class="ds-rule">No period is running today (outside the calculated span).</p>`;
  h += `</div>`;
  const crumbs = [`<button type="button" data-act="crumb" data-n="0">${sys.name}</button>`].concat(S.path.map((p,i)=>
    `<button type="button" data-act="crumb" data-n="${i+1}">${DS.label(sys,p.key)}</button>`)).join('<i>›</i>');
  h += `<div class="ds-drill"><div class="ds-crumbs">${crumbs}</div>`;
  h += `<div class="ds-eyebrow">${DS.LEVELS[S.path.length]}dasha${S.path.length ? ' of ' + DS.label(sys, S.path[S.path.length-1].key) : ' — tap a period to open its sub-periods'}</div>`;
  const list = listAt(S.path);
  h += `<div class="ds-list">` + list.map((p,i)=> rowHtml(p,i,now)).join('') + `</div></div>`;
  return h;
}

function homeHtml(){
  const c = DS.ctx(S.chart, opts());
  let h = `<p class="ds-intro"><b>36 dasha systems in 7 groups.</b> Open a group to see its systems <b>side by side</b>, then tap one to open it <b>level by level</b> — Maha › Antar › Pratyantar › Sookshma › Prana — with the <b>start and end of every period</b>.</p><div class="ds-groups">`;
  GROUPS.forEach(g => {
    const list = sysOf(g);
    let extra = '';
    if (g.id === 'cond'){ const n = list.filter(x => x.applic(c).ok).length; extra = `<span class="ds-badge ${n ? 'ok' : 'warn'}">${n} apply to you</span>`; }
    h += `<button type="button" class="ds-gcard" data-g="${g.id}">${gIco(g)}<span class="ds-ct"><b>${g.title}</b><small>${list.slice(0,4).map(x => x.name.replace(/ (Dasha|Dasa|Rashi)$/,'')).join(' · ')}${list.length > 4 ? ' · +' + (list.length - 4) + ' more' : ''}</small></span>${extra}<span class="ds-go">›</span></button>`;
  });
  return h + `</div>`;
}
const view = () => S.sys ? systemHtml() : S.grp ? groupHtml() : homeHtml();

function paint(root){
  root = root || document.getElementById('ds-root'); if (!root) return;
  try { root.innerHTML = view(); }
  catch(e){ root.innerHTML = `<div class="vx-note b"><div>Could not compute this system for this chart. (${String(e && e.message || e)})</div></div>`; console.error(e); }
}

window.buildDashaSystemsPanel = function(chart){
  S.chart = chart; S.data = null;
  if (S.sys){ try { recompute(); } catch(e){ S.sys = null; } }
  let body; try { body = view(); } catch(e){ S.sys = null; S.grp = null; body = homeHtml(); }
  return `<div class="section-heading"><h3>36 Dasha Systems</h3><div class="rule"></div></div><div class="ds" id="ds-root">${body}</div>`;
};

function openSys(id){
  S.sys = DS.map[id]; S.grp = GMAP[id].id; S.path = [];
  try { recompute(); } catch(err){ S.sys = null; console.error(err); }
}
document.addEventListener('click', e => {
  const root = e.target.closest('#ds-root'); if (!root || !S.chart) return;
  const q = sel => e.target.closest(sel);
  let b;
  if ((b = q('.ds-gcard'))){ S.grp = b.dataset.g; S.sys = null; S.path = []; paint(root); root.scrollIntoView({block:'start', behavior:'smooth'}); return; }
  if ((b = q('.ds-chip, .ds-cmp'))){
    if (b.dataset.id === 'cmp'){ S.sys = null; S.path = []; paint(root); }
    else { openSys(b.dataset.id); paint(root); }
    root.scrollIntoView({block:'start', behavior:'smooth'}); return;
  }
  if ((b = q('[data-act="home"]'))){ S.sys = null; S.grp = null; S.path = []; paint(root); return; }
  if ((b = q('[data-act="cmp"]'))){ S.sys = null; S.path = []; paint(root); return; }
  if ((b = q('[data-act="crumb"]'))){ S.path = S.path.slice(0, +b.dataset.n); paint(root); return; }
  if ((b = q('.ds-seg button'))){
    const k = b.parentNode.dataset.k;
    if (k === 'gender') S.gender = b.dataset.v; else S.subMode = b.dataset.v;
    try { localStorage.setItem(k === 'gender' ? 'vx_ds_gender' : 'vx_ds_sub', b.dataset.v); } catch(err){}
    S.path = []; if (S.sys) recompute(); paint(root); return;
  }
  if ((b = q('.ds-row')) && !b.disabled){
    const p = listAt(S.path)[+b.dataset.i];
    if (p){ S.path = S.path.concat([p]); paint(root); root.querySelector('.ds-drill').scrollIntoView({block:'start', behavior:'smooth'}); }
  }
});
})();

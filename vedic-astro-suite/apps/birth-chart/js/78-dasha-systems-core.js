/* ===== 36 Dasha Systems — CORE (helpers, registry, layout engine) =====
   Engines live in 79 (nakshatra), 80 (rasi), 81 (ayur + special); the panel is 82.
   A system is registered with:
     { id, name, blurb, family, keyType:'planet'|'sign', conf:'classical'|'varies', total:<yrs label>,
       needsGender?, applic(c) -> {ok, text}, build(c) -> {seq:[{key,years,meta?}], elapsed:0..1},
       sub(parent, c) -> [{key, w, meta?}] }
   Periods are laid out from birth. The first period is cut at birth (balance) but sub-periods are laid out on its
   FULL length from a virtual start (same trick as the Vimshottari engine) and then clipped.
   Year = 365.25 days, like the rest of the app. Sign index 0 = Aries. */
(function(){
'use strict';
const YR = 365.25 * 86400000;
const DS = window.DashaSys = { list:[], map:{}, YR, LEVELS:['Maha','Antar','Pratyantar','Sookshma','Prana'] };
DS.register = function(s){ DS.list.push(s); DS.map[s.id] = s; };

/* ---------- small sign helpers ---------- */
const mod = (n,m)=> ((n % m) + m) % m;
const mod12 = n => mod(n,12);
const ojas = s => [0,1,2,6,7,8].includes(s);     // odd-footed (Ojapada) signs
const oddSign = s => s % 2 === 0;                // Aries, Gemini, Leo... (odd signs)
const typ = s => s % 3;                          // 0 movable, 1 fixed, 2 dual
const EXALT = { Sun:0, Moon:1, Mars:9, Mercury:5, Jupiter:3, Venus:11, Saturn:6 };
Object.assign(DS, { mod12, ojas, oddSign, typ, EXALT });

/* ---------- context ---------- */
DS.ctx = function(chart, opts){
  opts = opts || {};
  const ps = {}, pd = {};
  PLANET_LIST.forEach(n => { ps[n] = chart.planets[n].sign; pd[n] = chart.planets[n].degInSign; });
  const asc = getSignIndex(chart.ascendant.longitude);
  const birth = chart.dashaData.mahadashas[0].startDate.getTime();
  return { chart, ps, pd, asc, birth, gender: opts.gender || 'M', subMode: opts.subMode || 'auto' };
};
const occ = (s,c) => PLANET_LIST.filter(p => c.ps[p] === s);
DS.occ = occ;

/* ---------- lords, aspects, strength ---------- */
function strongerPlanet(a,b,c){
  const na = occ(c.ps[a],c).length, nb = occ(c.ps[b],c).length;
  if (na !== nb) return na > nb ? a : b;
  return c.pd[a] >= c.pd[b] ? a : b;
}
// Scorpio (Mars/Ketu) and Aquarius (Saturn/Rahu) have two lords (Jaimini): if only one sits in the sign the other is the lord;
// otherwise the one with more company / higher degree.
function lordOf(s,c){
  if (s === 7 || s === 10){
    const a = s === 7 ? 'Mars' : 'Saturn', b = s === 7 ? 'Ketu' : 'Rahu';
    const ia = c.ps[a] === s, ib = c.ps[b] === s;
    if (ia && !ib) return b;
    if (ib && !ia) return a;
    return strongerPlanet(a,b,c);
  }
  return SIGNS[s].lord;
}
const lordPos = (s,c) => c.ps[lordOf(s,c)];
DS.lordOf = lordOf; DS.lordPos = lordPos;

// Rashi drishti: movable→fixed (not adjacent), fixed→movable (not adjacent), dual→other duals.
function rAsp(a,b){
  const ma = a % 3, mb = b % 3, d = mod12(b - a);
  if (ma === 0) return mb === 1 && d !== 1;
  if (ma === 1) return mb === 0 && d !== 11;
  return mb === 2 && a !== b;
}
DS.rAsp = rAsp;

// Which of two signs is stronger (Jaimini rules, in order).
function stronger(a,b,c){
  if (a === b) return a;
  const f = (fn) => { const x = fn(a), y = fn(b); return x === y ? 0 : (x > y ? 1 : -1); };
  let r;
  if ((r = f(s => occ(s,c).length))) return r > 0 ? a : b;
  const infl = s => { const L = lordOf(s,c); return [...new Set(['Mercury','Jupiter',L])].filter(p => { const q = c.ps[p]; return q === s || rAsp(q,s); }).length; };
  if ((r = f(infl))) return r > 0 ? a : b;
  if ((r = f(s => occ(s,c).some(p => EXALT[p] === s) ? 1 : 0))) return r > 0 ? a : b;
  if ((r = f(s => (oddSign(s) !== oddSign(lordPos(s,c))) ? 1 : 0))) return r > 0 ? a : b;
  if ((r = f(s => typ(s) === 2 ? 2 : typ(s) === 1 ? 1 : 0))) return r > 0 ? a : b;
  return c.pd[lordOf(a,c)] >= c.pd[lordOf(b,c)] ? a : b;
}
DS.stronger = stronger;
const strongestOf = (arr,c) => arr.reduce((x,y)=> stronger(x,y,c));

/* ---------- orders ---------- */
const seq12 = (start, dir) => Array.from({length:12}, (_,i)=> mod12(start + dir*i));
const kendraOrder = (seed, dir) => [0,3,6,9,1,4,7,10,2,5,8,11].map(o => mod12(seed + dir*o));
// Padakrama: movable = consecutive, fixed = every 5th, dual = steps of 3 inside blocks of 4 (anchor +4).
const DUAL_OFFS = [0,3,6,9,4,7,10,1,8,11,2,5];
function padaOrder(start, dir){
  const t = typ(start);
  const offs = t === 0 ? [0,1,2,3,4,5,6,7,8,9,10,11] : t === 1 ? [0,5,10,3,8,1,6,11,4,9,2,7] : DUAL_OFFS;
  return offs.map(o => mod12(start + dir*o));
}
Object.assign(DS, { seq12, kendraOrder, padaOrder, strongestOf });

/* ---------- Sign-duration rules ---------- */
// Steps from sign s to the position `pos` of its lord, counted forward for odd-footed signs, backward for even-footed
// (inclusive count minus one). Lord in the sign itself = 12.
function signSteps(s, pos){
  if (pos === s) return 12;
  const d = ojas(s) ? mod12(pos - s) : mod12(s - pos);
  return d;
}
// Narayana / K.N. Rao style: steps, +1 if lord exalted, −1 if debilitated (clamped 1..12).
function narayanaYears(s,c){
  const L = lordOf(s,c), pos = c.ps[L];
  let d = signSteps(s,pos);
  if (EXALT[L] === pos) d += 1;
  else if (EXALT[L] !== undefined && mod12(EXALT[L] + 6) === pos) d -= 1;
  return Math.max(1, Math.min(12, d));
}
// Parasara Chara: same count, no exaltation / debilitation adjustment.
const charaYears = (s,c) => signSteps(s, lordPos(s,c));
// Two passes over the same order: first d years, then 12 − d (zero length skipped).
function twoCycles(order, years, meta){
  const out = [];
  order.forEach(s => { const y = years(s); if (y > 0) out.push({ key:s, years:y, meta: meta ? meta(s) : undefined }); });
  order.forEach(s => { const y = 12 - years(s); if (y > 0) out.push({ key:s, years:y, meta: meta ? meta(s) : undefined }); });
  return out;
}
// Fixed length repeated until the life is covered.
function repeatFixed(order, years, rounds){
  const out = [];
  for (let r = 0; r < (rounds || 2); r++) order.forEach(s => out.push({ key:s, years: typeof years === 'function' ? years(s) : years }));
  return out;
}
Object.assign(DS, { signSteps, narayanaYears, charaYears, twoCycles, repeatFixed });

/* ---------- Progression direction helpers (Narayana family) ---------- */
// Odd sign → forward, even → backward; Saturn in the seed forces forward, otherwise Ketu in the seed reverses.
function dirSaturnKetu(seed,c){
  const base = oddSign(seed) ? 1 : -1;
  if (c.ps.Saturn === seed) return 1;
  if (c.ps.Ketu === seed) return -base;
  return base;
}
// Narayana sub-periods of a sign: seed = stronger(sign of parent's lord, sign of 7th-from-parent's lord).
function narayanaSub(parent,c){
  const s = parent.key;
  const seed = stronger(lordPos(s,c), lordPos(mod12(s+6),c), c);
  let dir = oddSign(seed) ? 1 : -1;
  if (c.ps.Saturn === seed) dir = 1;
  if (c.ps.Ketu === s) dir = -dir;
  return seq12(seed, dir).map(k => ({ key:k, w:1 }));
}
Object.assign(DS, { dirSaturnKetu, narayanaSub });

/* ---------- Nakshatra helpers ---------- */
// map 27 nakshatras → index in `order` from explicit lists {Lord:[1-based naks]}
DS.mapFromLists = function(order, lists){
  const m = new Array(27).fill(-1);
  order.forEach((o,i)=> (lists[o.key] || []).forEach(n => { m[n-1] = i; }));
  return m;
};
// seed nakshatra (1-based) gets order[0]; following nakshatras walk the order (mod 27 first, then mod len)
DS.mapFromSeed = function(order, seed, dir){
  return Array.from({length:27}, (_,i)=> mod(dir * ((i+1) - seed), 27) % order.length);
};
// Generic nakshatra-balance builder
DS.nakBuild = function(def){
  return function(c){
    const lon = normDeg(c.chart.siderealLongitudes.Moon), span = 360/27;
    const n = Math.floor(lon / span), elapsed = (lon % span) / span;
    let i = def.map[n];
    const seq = [];
    let total = 0;
    while (total < def.cover){ seq.push({ key:def.order[i].key, years:def.order[i].years }); total += def.order[i].years; i = (i+1) % def.order.length; }
    return { seq, elapsed };
  };
};
DS.nakSub = function(def, proportional){
  return function(parent,c){
    const idx = def.order.findIndex(o => o.key === parent.key);
    const prop = c.subMode === 'prop' ? true : c.subMode === 'equal' ? false : proportional;
    return def.order.map((_,k)=>{ const o = def.order[(idx+k) % def.order.length]; return { key:o.key, w: prop ? o.years : 1 }; });
  };
};

/* ---------- Layout ---------- */
DS.compute = function(sys, chart, opts){
  const c = DS.ctx(chart, opts);
  const b = sys.build(c);
  const out = [];
  let cur = null;
  b.seq.forEach((p,i)=>{
    const full = p.years * YR;
    let fs, st;
    if (i === 0){ fs = c.birth - full * b.elapsed; st = c.birth; }
    else { fs = cur; st = cur; }
    const en = fs + full;
    cur = en;
    out.push({ key:p.key, level:0, start:st, end:en, fullStart:fs, fullYears:p.years, meta:p.meta });
  });
  return { c, periods:out };
};

DS.children = function(sys, c, parent){
  if (parent.level >= 4) return [];
  const subs = sys.sub(parent,c).filter(x => x.w > 0);
  const tw = subs.reduce((a,x)=>a + x.w, 0);
  const out = [];
  let cur = parent.fullStart;
  const full = parent.fullYears * YR;
  subs.forEach(x=>{
    const len = full * x.w / tw, fs = cur, fe = cur + len;
    cur = fe;
    if (fe <= parent.start + 1000 || fs >= parent.end - 1000) return;   // outside (before birth / beyond parent)
    out.push({ key:x.key, level:parent.level+1, start:Math.max(fs,parent.start), end:Math.min(fe,parent.end),
               fullStart:fs, fullYears:len/YR, meta: x.meta !== undefined ? x.meta : parent.meta });
  });
  return out;
};

// the five periods running at time t (ms)
DS.active = function(sys, c, periods, t){
  const path = [];
  let list = periods;
  for (let lv = 0; lv < 5; lv++){
    const p = list.find(x => t >= x.start && t < x.end);
    if (!p) break;
    path.push(p);
    list = DS.children(sys, c, p);
  }
  return path;
};

DS.label = function(sys, key){ return sys.keyType === 'planet' ? key : SIGNS[key].name; };
DS.glyph = function(sys, key){ return sys.keyType === 'planet' ? (window.PLANET_GLYPHS && PLANET_GLYPHS[key]) || '' : SIGNS[key].symbol + '\uFE0E'; };
})();

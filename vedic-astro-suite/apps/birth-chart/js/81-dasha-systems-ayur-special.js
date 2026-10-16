/* ===== 36 Dasha Systems — AYUR (5) + SPECIAL (5) families =====
   Sthira, Shoola, Niryana Shoola, Mandooka, Brahma · Varnada, Navamsa, Sandhya, Chakra, Tara Lagna. See 78 for helpers. */
(function(){
'use strict';
const DS = window.DashaSys;
const { mod12, ojas, oddSign, typ, EXALT, seq12, stronger, twoCycles, repeatFixed, lordOf } = DS;
const ap = (ok, text) => ({ ok, text });
const eq = (arr) => arr.map(k => ({ key:k, w:1 }));
const dirP = (s) => oddSign(s) ? 1 : -1;
const OK = () => ap(true, 'Universal — computed from the ascendant and planet signs of any chart.');
const seven = (c) => stronger(c.asc, mod12(c.asc+6), c);
const reg = (fam) => (o) => DS.register(Object.assign({ family:fam, keyType:'sign', conf:'varies', applic:OK }, o));
const ayur = reg('Ayur'), special = reg('Special');
const plainLord = (s) => SIGNS[s].lord;                       // never Rahu/Ketu
const subFwdFromParent = (parent) => eq(seq12(parent.key, 1));
const subSevenStrong = (parent,c) => eq(seq12(stronger(parent.key, mod12(parent.key+6), c), 1));
const sub3Dir = (parent,c) => {                                // default backward; forward if Saturn there or odd sign; Ketu flips
  const s = parent.key;
  let dir = (c.ps.Saturn === s || oddSign(s)) ? 1 : -1;
  if (c.ps.Ketu === s) dir = -dir;
  return eq(seq12(s, dir));
};

/* ---------- Brahma planet (for Sthira & Brahma) ---------- */
const FRIENDS = { Sun:['Moon','Mars','Jupiter'], Moon:['Sun','Mercury'], Mars:['Sun','Moon','Jupiter'], Mercury:['Sun','Venus'],
                  Jupiter:['Sun','Moon','Mars'], Venus:['Mercury','Saturn'], Saturn:['Mercury','Venus'] };
function brahmaPlanet(c){
  const sp = seven(c);
  const cands = [...new Set([5,7,11].map(o => plainLord(mod12(sp+o))))];
  const score = p => {
    const pos = c.ps[p], L = plainLord(pos);
    let s = 0;
    if (L === p || EXALT[p] === pos || (FRIENDS[p] || []).includes(L)) s++;
    if (oddSign(pos)) s++;
    return s;
  };
  const ranked = cands.slice().sort((a,b)=> score(b) - score(a) || c.pd[b] - c.pd[a]);
  const top = ranked.slice(0,2);
  if (top.length < 2) return top[0];
  return stronger(c.ps[top[0]], c.ps[top[1]], c) === c.ps[top[0]] ? top[0] : top[1];
}
const brahmaSign = (c) => c.ps[brahmaPlanet(c)];

/* ---------- AYUR ---------- */
ayur({ id:'sthira', name:'Sthira Dasha', blurb:'Fixed longevity',
  build(c){ const s0 = brahmaSign(c); return { seq: repeatFixed(seq12(s0,1), s => 7 + typ(s), 2), elapsed:0 }; },
  sub: subFwdFromParent,
  rule:'Starts at the Brahma planet’s sign, forward; 7 / 8 / 9 years for movable / fixed / dual signs.' });

ayur({ id:'shoola', name:'Shoola Dasha', blurb:'9 years per sign',
  build(c){ return { seq: repeatFixed(seq12(seven(c),1), 9, 2), elapsed:0 }; },
  sub: subSevenStrong,
  rule:'Starts at the stronger of lagna / 7th; 9 years per sign.' });

ayur({ id:'niryana', name:'Niryana Shoola', blurb:'Modality durations',
  build(c){
    const seed = stronger(mod12(c.asc+1), mod12(c.asc+7), c);
    return { seq: twoCycles(seq12(seed, dirP(seed)), s => 7 + typ(s)), elapsed:0 };
  },
  sub: sub3Dir,
  rule:'Starts at the stronger of the 2nd / 8th sign; 7 / 8 / 9 years by modality, second cycle = 12 − years.' });

ayur({ id:'mandooka', name:'Mandooka Dasha', blurb:'Kendra jumps',
  build(c){ return { seq: twoCycles(mandookaOrder(c), s => mandookaYears(s,c)), elapsed:0 }; },
  sub(parent,c){
    const o = mandookaOrder(c), i = Math.max(0, o.indexOf(parent.key));
    return eq(o.map((_,k)=> o[(i+k) % 12]));
  },
  rule:'The “frog jump” order skips between kendras and their neighbours; sub-periods follow the same order from the parent sign.' });
function mandookaOrder(c){
  const seed = seven(c), dir = dirP(seed);
  return [0,3,6,9,2,5,8,11,1,4,7,10].map(o => mod12(seed + dir*o));
}
function mandookaYears(s,c){
  const pos = DS.lordPos(s,c);
  if (pos === s) return 12;
  if (pos === mod12(s+6)) return 10;
  const d = oddSign(s) ? mod12(pos - s + 1) : mod12(s - pos + 1);
  return d === 0 ? 12 : d;
}

ayur({ id:'brahma', name:'Brahma Dasha', blurb:'6th lord distances',
  build(c){
    const s0 = brahmaSign(c);
    const order = oddSign(s0) ? seq12(s0,1) : seq12(mod12(s0+6), -1);
    const yrs = s => {
      const L6 = plainLord(mod12(s+5)), pos = c.ps[L6];
      let d = oddSign(s) ? mod12(pos - s) : mod12(s - pos);
      if (EXALT[L6] === pos) d += 1; else if (EXALT[L6] !== undefined && mod12(EXALT[L6]+6) === pos) d -= 1;
      return Math.max(0, Math.min(12, d));
    };
    return { seq: twoCycles(order, yrs), elapsed:0 };
  },
  sub: subFwdFromParent,
  rule:'Starts at the Brahma planet’s sign. Years = distance from a sign to the sign of the lord of its 6th.' });

/* ---------- SPECIAL ---------- */
special({ id:'varnada', name:'Varnada Dasha', blurb:'Social status',
  build(c){
    const hora = calcHoraLagnaSign(c.chart), vl = calcVarnadaLagnaSign(c.asc, hora);
    const seed = stronger(c.asc, hora, c);
    return { seq: twoCycles(seq12(seed, dirP(seed)), s => mod12(s - vl)), elapsed:0 };
  },
  sub: subFwdFromParent,
  rule:'Starts at the stronger of lagna / Hora Lagna; each sign runs its distance from the Varnada Lagna.' });

special({ id:'navamsa', name:'Navamsa Dasha', blurb:'9 years per sign',
  build(c){
    const d9 = c.chart.vargas.D9.ascendantSign;
    const seed = [0,4,6,10][Math.floor(d9/3)] ;
    const order = oddSign(seed) ? seq12(seed,1) : seq12(mod12(seed+6), -1);
    return { seq: repeatFixed(order, 9, 2), elapsed:0 };
  },
  sub(parent){ const st = [6,0,8,10,4,8,6,0,8,10,4,8][parent.key]; return eq(seq12(st,1)); },
  rule:'Seed from the navamsa lagna group; 9 years per sign; sub-periods start from a fixed partner sign.' });

special({ id:'sandhya', name:'Sandhya Dasha', blurb:'10 years per sign', conf:'classical',
  build(c){ return { seq: repeatFixed(seq12(c.asc,1), 10, 2), elapsed:0 }; },
  sub: subFwdFromParent,
  rule:'Starts at the lagna, 10 years per sign, forward.' });

special({ id:'chakra', name:'Chakra Dasha', blurb:'Lagna lord seed',
  build(c){
    const j = c.chart.julianDay, sr = c.chart.sunriseJD, ss = c.chart.sunsetJD, hr = 1/24;
    const twilight = Math.abs(j - sr) < hr || Math.abs(j - ss) < hr;
    const day = j >= sr && j < ss;
    const seed = twilight ? mod12(c.asc+1) : day ? c.ps[lordOf(c.asc,c)] : c.asc;
    return { seq: repeatFixed(seq12(seed,1), 10, 2), elapsed:0 };
  },
  sub: subFwdFromParent,
  rule:'Seed: dawn/dusk (within an hour of sunrise/sunset) → sign after lagna; day → sign of the lagna lord; night → lagna. 10 years per sign.' });

special({ id:'taralagna', name:'Tara Lagna Dasha', blurb:'Nakshatra fraction',
  build(c){
    const lon = normDeg(c.chart.siderealLongitudes.Moon), span = 360/27;
    const part = Math.min(11, Math.floor(((lon % span) / span) * 12));
    const seed = mod12(c.asc + part);
    return { seq: repeatFixed(seq12(seed, dirP(seed)), 9, 2), elapsed:0 };
  },
  sub(parent,c){
    const ak = c.ps[c.chart.charaKarakas.Atmakaraka.planet];
    return eq(seq12(ak, [1,5,7,10].includes(ak) ? -1 : 1));
  },
  rule:'Seed = lagna + the 12th-part of the Moon’s nakshatra; 9 years per sign; sub-periods run from the Atma Karaka sign.' });
})();

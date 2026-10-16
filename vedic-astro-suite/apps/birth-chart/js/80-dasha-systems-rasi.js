/* ===== 36 Dasha Systems — PHALITA RASI family (14 sign-based systems) =====
   Chara (Parasara, K.N. Rao, Iranganti 1 & 2), Narayana, Sudasa, Drig, Trikona, Lagnamsaka, Yogardha, Kendradi,
   Padanadhamsa, Paryaya, Moola. Sign-based sub-periods are equal 1/12 splits. See 78 for helpers. */
(function(){
'use strict';
const DS = window.DashaSys;
const { mod12, ojas, oddSign, typ, EXALT, seq12, kendraOrder, padaOrder, stronger, strongestOf, signSteps, narayanaYears, charaYears, twoCycles, repeatFixed, lordOf, lordPos } = DS;
const ap = (ok, text) => ({ ok, text });
const eq = (arr) => arr.map(k => ({ key:k, w:1 }));
const dirP = (s) => oddSign(s) ? 1 : -1;
const OK = () => ap(true, 'Universal — computed from the ascendant and planet signs of any chart.');
const reg = (o) => DS.register(Object.assign({ family:'Phalita', keyType:'sign', conf:'classical', total:'144', applic:OK }, o));
const seven = (c) => stronger(c.asc, mod12(c.asc+6), c);

/* ---------- Chara family ---------- */
const charaParasaraSub = (parent,c) => {
  const st = stronger(parent.key, mod12(parent.key+6), c);
  return eq(padaOrder(st, ojas(st) ? 1 : -1));
};
reg({ id:'chara-parasara', name:'Chara – Parasara', blurb:'Sign-based (Jaimini)', conf:'varies',
  build(c){ const dir = ojas(mod12(c.asc+8)) ? 1 : -1; return { seq: twoCycles(seq12(c.asc,dir), s => charaYears(s,c)), elapsed:0 }; },
  sub: charaParasaraSub,
  rule:'Starts at the lagna (direction from the 9th sign). Years = signs to the lord, 2nd cycle = 12 − first. Sub-periods start from the stronger of the sign and its 7th, in padakrama order.' });

reg({ id:'chara-knrao', name:'Chara – K.N. Rao', blurb:'Single-cycle variant', conf:'varies',
  build(c){ const dir = ojas(mod12(c.asc+8)) ? 1 : -1; return { seq: twoCycles(seq12(c.asc,dir), s => narayanaYears(s,c)), elapsed:0 }; },
  sub(parent){
    const s = parent.key;
    return eq([0,4,5,6,10,11].includes(s) ? seq12(mod12(s+1), 1) : seq12(mod12(s-1), -1));
  },
  rule:'Years include +1 for an exalted and −1 for a debilitated lord. The first 12-sign cycle is the main run; a complementary cycle (12 − years) follows so the full life is covered. Sub-periods run forward from the next sign (Aries, Leo, Virgo, Libra, Aquarius, Pisces) or backward from the previous sign, the parent sign last.' });

function irYears(s, c, female, adj){
  const L = SIGNS[s].lord, pos = c.ps[L];
  let d = (female && pos === mod12(s+6)) ? 10 : signSteps(s,pos);
  if (adj){ if (EXALT[L] === pos) d += 1; else if (EXALT[L] !== undefined && mod12(EXALT[L]+6) === pos) d -= 1; }
  return Math.max(1, Math.min(12, d));
}
function iranganti(id, name, byNinth, adj){
  reg({ id, name, blurb:'By gender • Rangacharya', conf:'varies', needsGender:true,
    build(c){
      const f = c.gender === 'F';
      const start = f ? mod12(c.asc + (ojas(c.asc) ? 3 : -3)) : c.asc;
      const dir = byNinth ? (ojas(mod12(c.asc+8)) ? 1 : -1) : (ojas(c.asc) ? 1 : -1);
      return { seq: twoCycles(seq12(start,dir), s => irYears(s,c,f,adj)), elapsed:0 };
    },
    sub(parent){ const p = parent.key; return eq(padaOrder(p, ojas(p) ? 1 : -1)); },
    rule:'Male: starts at the lagna. Female: starts 3 signs from the lagna. Each sign’s lord is its plain ruler (Mars for Scorpio, Saturn for Aquarius). Needs the Male/Female choice above.' });
}
iranganti('chara-iranganti1','Chara – Iranganti 1', true,  true);
iranganti('chara-iranganti2','Chara – Iranganti 2', false, false);

/* ---------- Narayana family ---------- */
reg({ id:'narayana', name:'Narayana Dasa', blurb:'Padakrama / versatile', conf:'varies',
  build(c){ const seed = seven(c); return { seq: twoCycles(seq12(seed, DS.dirSaturnKetu(seed,c)), s => narayanaYears(s,c)), elapsed:0 }; },
  sub: DS.narayanaSub,
  rule:'Starts at the stronger of lagna / 7th. Odd seed runs forward, even backward (Saturn in the seed forces forward; Ketu reverses). Sub-periods start from the stronger of the lords’ signs.' });

reg({ id:'sudasa', name:'Sudasa', blurb:'Wealth & prosperity', conf:'varies',
  build(c){
    const sl = calcShreeLagnaLongitude(c.chart), seed = getSignIndex(sl), el = (normDeg(sl) % 30) / 30;
    return { seq: twoCycles(kendraOrder(seed, DS.dirSaturnKetu(seed,c)), s => narayanaYears(s,c)), elapsed: el };
  },
  sub(parent,c){ const st = stronger(parent.key, mod12(parent.key+6), c); return eq(seq12(st, oddSign(st) ? -1 : 1)); },
  rule:'Starts at the Sree Lagna sign (first period cut by its degree). Signs run in kendra → panaphara → apoklima groups.' });

function aspectedSigns(a){
  const t = typ(a), list = [];
  for (let b = 0; b < 12; b++) if (DS.rAsp(a,b)) list.push(b);
  const fwd = t === 1 || (t === 2 && oddSign(a));
  return list.sort((x,y)=> fwd ? mod12(x-a) - mod12(y-a) : mod12(a-x) - mod12(a-y));
}
reg({ id:'drig', name:'Drig Dasha', blurb:'Aspect-based', conf:'varies',
  build(c){
    const order = [];
    [8,9,10].forEach(h => { const a = mod12(c.asc + h); order.push(a); aspectedSigns(a).forEach(x => order.push(x)); });
    return { seq: twoCycles(order, s => narayanaYears(s,c)), elapsed:0 };
  },
  sub: DS.narayanaSub,
  rule:'Runs the 9th, 10th and 11th signs, each followed by the three signs it aspects (rashi drishti).' });

reg({ id:'trikona', name:'Trikona Dasha', blurb:'Dharma & fortune', conf:'varies',
  build(c){
    const seed = stronger(stronger(c.asc, mod12(c.asc+4), c), mod12(c.asc+8), c);
    return { seq: twoCycles(seq12(seed, dirP(seed)), s => narayanaYears(s,c)), elapsed:0 };
  },
  sub(parent){ return eq(seq12(parent.key, dirP(parent.key))); },
  rule:'Starts at the strongest of the 1st, 5th and 9th signs; odd seed forward, even backward.' });

reg({ id:'lagnamsaka', name:'Lagnamsaka Dasha', blurb:'Navamsa Lagna seed', conf:'varies',
  build(c){ const seed = c.chart.vargas.D9.ascendantSign; return { seq: twoCycles(seq12(seed, DS.dirSaturnKetu(seed,c)), s => narayanaYears(s,c)), elapsed:0 }; },
  sub: DS.narayanaSub,
  rule:'Narayana progression seeded from the navamsa lagna sign.' });

reg({ id:'yogardha', name:'Yogardha Dasha', blurb:'Chara + Sthira hybrid', conf:'varies', total:'~190',
  build(c){
    const seed = seven(c);
    const yrs = s => (charaYears(s,c) + (typ(s) === 0 ? 7 : typ(s) === 1 ? 8 : 9)) / 2;
    return { seq: repeatFixed(seq12(seed, dirP(seed)), yrs, 2), elapsed:0 };
  },
  sub: charaParasaraSub,
  rule:'Each sign runs the average of its Chara years and its Sthira years (7/8/9).' });

const kendraDir = (seed,c) => c.ps.Saturn === seed ? 1 : c.ps.Ketu === seed ? -1 : dirP(seed);
const kendraSub = (parent,c) => {
  const s = parent.key;
  let dir = (c.ps.Saturn === s || oddSign(s)) ? 1 : -1;
  if (c.ps.Ketu === s) dir = -dir;
  return eq(seq12(s, dir));
};
reg({ id:'kendradi', name:'Kendradi Rashi', blurb:'Kendra-based', conf:'varies',
  build(c){ const seed = seven(c); return { seq: twoCycles(kendraOrder(seed, kendraDir(seed,c)), s => narayanaYears(s,c)), elapsed:0 }; },
  sub: kendraSub,
  rule:'Starts at the stronger of lagna / 7th, then kendras, panapharas, apoklimas.' });
reg({ id:'moola', name:'Moola Dasha', blurb:'Lagna Kendradi', conf:'varies',
  build(c){ const seed = c.asc; return { seq: twoCycles(kendraOrder(seed, kendraDir(seed,c)), s => narayanaYears(s,c)), elapsed:0 }; },
  sub: kendraSub,
  rule:'Kendradi order seeded directly from the lagna.' });

reg({ id:'padanadhamsa', name:'Padanadhamsa Dasha', blurb:'D-9 of D-9 seed', conf:'varies',
  build(c){
    const al = calcAllArudhaPadas(c.chart, c.asc).AL;
    const d9 = c.chart.vargas.D9.planetVargaSign;
    const x = d9[SIGNS[al].lord], seed = stronger(x, mod12(x+6), c);
    return { seq: twoCycles(padaOrder(seed, dirP(seed)), s => signSteps(s, d9[SIGNS[s].lord])), elapsed:0 };
  },
  sub(parent){ return eq(padaOrder(parent.key, dirP(parent.key))); },
  rule:'Seed from the navamsa position of the Arudha Lagna lord; years are counted to each sign lord’s navamsa sign.' });

reg({ id:'paryaya', name:'Paryaya Dasha', blurb:'Modality-based', conf:'varies',
  build(c){
    const t = typ(c.asc);
    const start = t === 2 ? strongestOf([c.asc, mod12(c.asc+4), mod12(c.asc+8)], c)
                : t === 0 ? strongestOf([0,3,6,9].map(o => mod12(c.asc+o)), c)
                : seven(c);
    const OFFS = [[0,4,8,1,5,9,2,6,10,3,7,11],[0,6,1,7,2,8,3,9,4,10,5,11],[0,3,6,9,1,4,7,10,2,5,8,11]][t];
    const dir = ojas(start) ? 1 : -1;
    const order = OFFS.map(o => mod12(start + dir*o));
    const yrs = s => { const pos = lordPos(s,c); return ojas(s) ? mod12(pos - s) : mod12(s - pos); };
    return { seq: twoCycles(order, yrs), elapsed:0 };
  },
  sub(parent){
    const s = parent.key, t = typ(s), dir = ojas(s) ? 1 : -1;
    const OFFS = [[0,4,8,1,5,9,2,6,10,3,7,11],[0,6,1,7,2,8,3,9,4,10,5,11],[0,3,6,9,1,4,7,10,2,5,8,11]][t];
    return eq(OFFS.map(o => mod12(s + dir*o)));
  },
  rule:'Order depends on whether the lagna is movable, fixed or dual. Years = signs from a sign to its lord (0–11; zero skipped).' });
})();

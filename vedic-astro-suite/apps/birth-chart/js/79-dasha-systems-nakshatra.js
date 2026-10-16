/* ===== 36 Dasha Systems — NAKSHATRA family (12 systems) =====
   Vimshottari, Ashtottari, Kala Chakra, Yogini + 8 conditional systems. See 78 for the registry / layout engine. */
(function(){
'use strict';
const DS = window.DashaSys;
const COVER = 150;                       // build at least this many years of periods (first one is cut at birth)
const ap = (ok, text) => ({ ok, text });
const ord = (pairs) => pairs.map(p => ({ key:p[0], years:p[1] }));
const horaOfLagna = (c) => {             // 'Sun' or 'Moon' hora of the ascendant
  const s = c.asc, d = c.chart.ascendant.degInSign != null ? c.chart.ascendant.degInSign : (normDeg(c.chart.ascendant.longitude) % 30);
  const first = d < 15;
  return oddSign(s) ? (first ? 'Sun' : 'Moon') : (first ? 'Moon' : 'Sun');
};
const oddSign = DS.oddSign;
const isShukla = (c) => { const e = normDeg(c.chart.siderealLongitudes.Moon - c.chart.siderealLongitudes.Sun); return e < 180; };
const isDay = (c) => c.chart.julianDay >= c.chart.sunriseJD && c.chart.julianDay < c.chart.sunsetJD;
const d9Asc = (c) => c.chart.vargas.D9.ascendantSign;

function simple(id, name, blurb, total, order, map, prop, applic, conf){
  const def = { order, map, cover:COVER };
  DS.register({ id, name, blurb, family:'Nakshatra', total, keyType:'planet', conf: conf || 'classical',
    subToggle:true, applic, build: DS.nakBuild(def), sub: DS.nakSub(def, prop),
    rule: prop ? 'Sub-periods are proportional to each lord’s years.' : 'Sub-periods are equal parts.' });
}

/* 1 Vimshottari — uses the same order & balance as the main Dasha tab */
(function(){
  const order = DASHA_SEQUENCE.map(k => ({ key:k, years:DASHA_YEARS[k] }));
  const map = NAKSHATRAS.map(n => DASHA_SEQUENCE.indexOf(n.lord));
  simple('vimshottari','Vimshottari','120-year cycle',120, order, map, true, () => ap(true,'Universal — the standard system for every chart.'));
})();

/* 2 Ashtottari 108 */
(function(){
  const order = ord([['Sun',6],['Moon',15],['Mars',8],['Mercury',17],['Saturn',10],['Jupiter',19],['Rahu',12],['Venus',21]]);
  const map = DS.mapFromLists(order, { Sun:[6,7,8,9], Moon:[10,11,12], Mars:[13,14,15,16], Mercury:[17,18,19], Saturn:[20,21,22], Jupiter:[23,24,25], Rahu:[26,27,1,2], Venus:[3,4,5] });
  simple('ashtottari','Ashtottari','108-year cycle',108, order, map, true, c => {
    const L = c.ps[DS.lordOf(c.asc,c)], h = DS.mod12(c.ps.Rahu - L) + 1;
    const ok = [1,4,5,7,9,10].includes(h) && c.ps.Rahu !== c.asc;
    return ap(ok, ok ? 'Rahu is in a kendra/trikona from the lagna lord and not in the lagna — this chart qualifies.' : 'Classically used when Rahu sits in a kendra/trikona from the lagna lord (not in lagna). Not met here — shown for study.');
  });
})();

/* 4 Yogini 36 */
(function(){
  const order = ord([['Moon',1],['Sun',2],['Jupiter',3],['Mars',4],['Mercury',5],['Saturn',6],['Venus',7],['Rahu',8]]);
  const map = DS.mapFromLists(order, { Moon:[6,14,22], Sun:[7,15,23], Jupiter:[8,16,24], Mars:[1,9,17,25], Mercury:[2,10,18,26], Saturn:[3,11,19,27], Venus:[4,12,20], Rahu:[5,13,21] });
  simple('yogini','Yogini Dasha','36-year cycle',36, order, map, false, () => ap(true,'Universal — usable for every chart (Moon’s nakshatra).'));
})();

/* Conditional nakshatra systems */
(function(){
  const n7 = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];

  // Shodasottari 116
  let order = ord([['Sun',11],['Mars',12],['Jupiter',13],['Saturn',14],['Ketu',15],['Moon',16],['Mercury',17],['Venus',18]]);
  simple('shodasottari','Shodasottari','116 yrs • hora-paksha',116, order, DS.mapFromSeed(order, 8, 1), false, c => {
    const h = horaOfLagna(c), sh = isShukla(c), ok = (h === 'Sun' && sh) || (h === 'Moon' && !sh);
    return ap(ok, (ok ? 'Qualifies: ' : 'Not met: ') + 'lagna is in the ' + h + ' hora and the birth is in ' + (sh ? 'Shukla' : 'Krishna') + ' paksha (needs Sun hora + Shukla, or Moon hora + Krishna).');
  });

  // Shattrimsa Sama 36
  order = ord([['Moon',1],['Sun',2],['Jupiter',3],['Mars',4],['Mercury',5],['Saturn',6],['Venus',7],['Rahu',8]]);
  simple('shattrimsa','Shattrimsa Sama','36 yrs • hora-day/night',36, order, DS.mapFromSeed(order, 22, 1), false, c => {
    const h = horaOfLagna(c), day = isDay(c), ok = (day && h === 'Sun') || (!day && h === 'Moon');
    return ap(ok, (ok ? 'Qualifies: ' : 'Not met: ') + (day ? 'day' : 'night') + ' birth with lagna in the ' + h + ' hora (needs day + Sun hora, or night + Moon hora).');
  });

  // Dwadasottari 112
  order = ord([['Sun',7],['Jupiter',9],['Ketu',11],['Mercury',13],['Rahu',15],['Mars',17],['Saturn',19],['Moon',21]]);
  simple('dwadasottari','Dwadasottari','112 yrs • Venus navamsha',112, order, DS.mapFromSeed(order, 27, -1), false, c => {
    const a = d9Asc(c), ok = a === 1 || a === 6;
    return ap(ok, (ok ? 'Qualifies: ' : 'Not met: ') + 'navamsa lagna is ' + SIGNS[a].name + ' (needs Taurus or Libra — Venus’ signs).');
  });

  // Dwisaptati Sama 72
  order = ord(n7.concat(['Rahu']).map(k => [k,9]));
  simple('dwisaptati','Dwisaptati Sama','72 yrs • 1st-7th exchange',72, order, DS.mapFromSeed(order, 19, 1), false, c => {
    const l1 = DS.lordOf(c.asc,c), s7 = DS.mod12(c.asc+6), l7 = DS.lordOf(s7,c);
    const ok = c.ps[l1] === s7 || c.ps[l7] === c.asc;
    return ap(ok, (ok ? 'Qualifies: ' : 'Not met: ') + 'needs the lagna lord in the 7th house or the 7th lord in the lagna.');
  });

  // Sataabdika 100
  order = ord([['Sun',5],['Moon',5],['Venus',10],['Mercury',10],['Jupiter',20],['Mars',20],['Saturn',30]]);
  simple('sataabdika','Sataabdika','100 yrs • vargottama lagna',100, order, DS.mapFromSeed(order, 27, 1), false, c => {
    const ok = d9Asc(c) === c.asc;
    return ap(ok, (ok ? 'Qualifies: ' : 'Not met: ') + 'lagna is ' + SIGNS[c.asc].name + ' in D-1 and ' + SIGNS[d9Asc(c)].name + ' in D-9 (needs vargottama lagna).');
  });

  // Chaturaseeti Sama 84
  order = ord(n7.map(k => [k,12]));
  simple('chaturaseeti','Chaturaseeti Sama','84 yrs • 10th lord in 10th',84, order, DS.mapFromSeed(order, 15, 1), false, c => {
    const s10 = DS.mod12(c.asc+9), ok = c.ps[DS.lordOf(s10,c)] === s10;
    return ap(ok, (ok ? 'Qualifies: ' : 'Not met: ') + 'needs the 10th lord placed in the 10th house.');
  });

  // Shashtihayani 60
  order = ord([['Jupiter',10],['Sun',10],['Mars',10],['Moon',6],['Mercury',6],['Venus',6],['Saturn',6],['Rahu',6]]);
  simple('shashtihayani','Shashtihayani','60 yrs • Sun in lagna',60, order,
    DS.mapFromLists(order, { Jupiter:[1,2,3], Sun:[4,5,6,7], Mars:[8,9,10], Moon:[11,12,13,14], Mercury:[15,16,17], Venus:[18,19,20,21], Saturn:[22,23,24], Rahu:[25,26,27] }),
    false, c => { const ok = c.ps.Sun === c.asc; return ap(ok, (ok ? 'Qualifies: ' : 'Not met: ') + 'needs the Sun in the lagna sign.'); });

  // Panchottari 105
  order = ord([['Sun',12],['Mercury',13],['Saturn',14],['Mars',15],['Venus',16],['Moon',17],['Jupiter',18]]);
  simple('panchottari','Panchottari','105 yrs • Cancer lagna',105, order, DS.mapFromSeed(order, 17, 1), false, c => {
    const ok = c.asc === 3;
    return ap(ok, (ok ? 'Qualifies: ' : 'Not met: ') + 'classically for Cancer lagna (here: ' + SIGNS[c.asc].name + ').');
  }, 'varies');
})();

/* 3 Kala Chakra — pada-based sign periods (interpretive: no gati jumps) */
(function(){
  const SY = [7,16,9,21,5,9,16,7,10,4,4,10];
  const SAV = new Set([1,2,3,7,8,9,13,14,15,19,20,21,25,26,27]);
  const SERIES = [
    [0,1,2,3,4,5,6,7,8],            // 100
    [9,10,11,0,1,2,3,4,5],          // 85
    [6,7,8,9,10,11,0,1,2],          // 83
    [3,4,5,6,7,8,9,10,11]           // 86
  ];
  const seriesFor = (sav, p) => sav ? SERIES[p] : SERIES[p].slice().reverse();
  const tot = a => a.reduce((x,s)=> x + SY[s], 0);
  DS.register({ id:'kalachakra', name:'Kala Chakra', blurb:'Pada-based signs', family:'Nakshatra', total:'83–100', keyType:'sign', conf:'varies',
    applic: () => ap(true, 'Pada of the Moon decides the sign series. Gati (sign-jump) corrections are not applied; the apasavya series is built as the reverse of the savya one — treat as an approximation.'),
    build(c){
      const lon = normDeg(c.chart.siderealLongitudes.Moon), padaSpan = 360/108;
      const pi = Math.floor(lon / padaSpan), fracPada = (lon % padaSpan) / padaSpan;
      const nak = Math.floor(pi/4) + 1, sav = SAV.has(nak);
      let p = pi % 4;
      let ser = seriesFor(sav, p), el = fracPada * tot(ser), acc = 0, k = 0;
      while (k < ser.length - 1 && acc + SY[ser[k]] <= el){ acc += SY[ser[k]]; k++; }
      const elapsed = (el - acc) / SY[ser[k]];
      const seq = [];
      let total = 0;
      for (let j = k; j < ser.length; j++){ seq.push({ key:ser[j], years:SY[ser[j]], meta:ser }); total += SY[ser[j]]; }
      while (total < COVER){
        p = (p+1) % 4; ser = seriesFor(sav, p);
        ser.forEach(s => { seq.push({ key:s, years:SY[s], meta:ser }); total += SY[s]; });
      }
      return { seq, elapsed };
    },
    sub(parent){
      const ser = parent.meta || SERIES[0], i = Math.max(0, ser.indexOf(parent.key));
      return ser.map((_,k)=>{ const s = ser[(i+k) % ser.length]; return { key:s, w:SY[s] }; });
    },
    rule:'Sub-periods follow the same pada series from the parent sign, proportional to sign years.' });
})();
})();

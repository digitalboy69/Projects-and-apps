/* =============================================================================
   KUNDALI MATCHING — Ashtakoota (36 gunas) + Manglik + bonus checks
   Groom = Person 1 (Vara), Bride = Person 2 (Kanya). Asymmetric tables use these roles.
   ============================================================================= */
const KM_VARNA = ['Kshatriya','Vaishya','Shudra','Brahmin','Kshatriya','Vaishya','Shudra','Brahmin','Kshatriya','Vaishya','Shudra','Brahmin'];
const KM_VARNA_RANK = { Brahmin: 4, Kshatriya: 3, Vaishya: 2, Shudra: 1 };
const KM_VASHYA_SIGN = ['Chatushpada','Chatushpada','Manava','Jalachara','Vanachara','Manava','Manava','Keeta','*','*','Manava','Jalachara'];
const KM_VASHYA_ORDER = ['Chatushpada','Manava','Jalachara','Vanachara','Keeta'];
const KM_VASHYA = [[2,1,1,0.5,1],[1,2,0.5,0,1],[1,0.5,2,1,1],[0,0,0,2,0],[1,1,1,0,2]];   // [groom][bride]
const KM_GANA = ['Deva','Manushya','Rakshasa','Manushya','Deva','Manushya','Deva','Deva','Rakshasa','Rakshasa','Manushya','Manushya','Deva','Rakshasa','Deva','Rakshasa','Deva','Rakshasa','Rakshasa','Manushya','Manushya','Deva','Rakshasa','Rakshasa','Manushya','Manushya','Deva'];
const KM_GANA_SCORE = { Deva: { Deva: 6, Manushya: 6, Rakshasa: 1 }, Manushya: { Deva: 5, Manushya: 6, Rakshasa: 0 }, Rakshasa: { Deva: 0, Manushya: 0, Rakshasa: 6 } };
const KM_NADI_NAMES = ['Aadi (Vata)', 'Madhya (Pitta)', 'Antya (Kapha)'];
const KM_NADI = [0,1,2,2,1,0];                        // by nakshatra index % 6
const KM_YONI_ORDER = ['Horse','Elephant','Sheep','Serpent','Dog','Cat','Rat','Cow','Buffalo','Tiger','Deer','Monkey','Lion','Mongoose'];
const KM_YONI_NAK = ['Horse','Elephant','Sheep','Serpent','Serpent','Dog','Cat','Sheep','Cat','Rat','Rat','Cow','Buffalo','Tiger','Buffalo','Tiger','Deer','Deer','Dog','Monkey','Mongoose','Monkey','Lion','Horse','Lion','Cow','Elephant'];
const KM_YONI = [
 [4,2,2,3,2,2,2,1,0,1,3,3,1,2],[2,4,3,3,2,2,2,2,3,1,2,3,0,2],[2,3,4,2,1,2,1,3,3,1,2,0,1,2],[3,3,2,4,2,1,1,1,1,2,2,2,1,0],
 [2,2,1,2,4,2,1,2,2,1,0,2,1,1],[2,2,2,1,2,4,0,2,2,1,3,3,1,2],[2,2,1,1,1,0,4,2,2,2,2,2,1,3],[1,2,3,1,2,2,2,4,3,0,3,2,1,2],
 [0,3,3,1,2,2,2,3,4,1,2,2,1,2],[1,1,1,2,1,1,2,0,1,4,1,1,2,2],[3,2,2,2,0,3,2,3,2,1,4,2,2,2],[3,3,0,2,2,3,2,2,2,1,2,4,3,2],
 [1,0,1,1,1,1,1,1,1,2,2,3,4,2],[2,2,2,0,1,2,3,2,2,2,2,2,2,4]];
const KM_FRIEND = {
  Sun: { F: ['Moon','Mars','Jupiter'], E: ['Venus','Saturn'] }, Moon: { F: ['Sun','Mercury'], E: [] },
  Mars: { F: ['Sun','Moon','Jupiter'], E: ['Mercury'] }, Mercury: { F: ['Sun','Venus'], E: ['Moon'] },
  Jupiter: { F: ['Sun','Moon','Mars'], E: ['Mercury','Venus'] }, Venus: { F: ['Mercury','Saturn'], E: ['Sun','Moon'] },
  Saturn: { F: ['Mercury','Venus'], E: ['Sun','Moon','Mars'] }
};
const KM_RAJJU_NAMES = ['Pada (feet)','Kati (waist)','Nabhi (navel)','Kantha (neck)','Siro (head)'];
const KM_RAJJU = [0,1,2,3,4,3,2,1,0,0,1,2,3,4,3,2,1,0,0,1,2,3,4,3,2,1,0];   // zig-zag by nakshatra index

function kmRel(a, b){ return KM_FRIEND[a].F.includes(b) ? 'F' : (KM_FRIEND[a].E.includes(b) ? 'E' : 'N'); }
function kmPerson(profile){
  const chart = computeChart(profile.dob, profile.tob.length === 5 ? profile.tob + ':00' : profile.tob, profile.lat, profile.lon, profile.tz);
  const moon = chart.planets.Moon;
  return { profile, chart, moonSign: moon.sign, nak: Math.floor(normDeg(moon.longitude) / (360 / 27)), pada: moon.nakshatra.pada, deg: moon.degInSign, lagna: chart.ascendant.sign };
}
function kmManglik(P){
  const c = P.chart, mars = c.planets.Mars, jup = c.planets.Jupiter;
  const hL = mars.house, hM = (mars.sign - P.moonSign + 12) % 12 + 1, strong = [1, 4, 7, 8, 12];
  const inL = strong.includes(hL), inM = strong.includes(hM), mild = (hL === 2 || hM === 2) && !inL && !inM;
  const cancel = [];
  if ([0, 7, 9].includes(mars.sign)) cancel.push('Mars is in its own or exalted sign');
  if (jup.sign === mars.sign) cancel.push('Jupiter is with Mars');
  else if (jup.aspectsHouses && jup.aspectsHouses.includes(mars.house)) cancel.push('Jupiter aspects Mars');
  const level = (inL && inM) ? 'High' : (inL || inM) ? 'Moderate' : mild ? 'Mild' : 'None';
  return { hL, hM, level, present: level !== 'None', cancel, cancelled: cancel.length > 0 && level !== 'None' };
}
function kmMatch(G, B){
  const k = [];
  // 1 Varna
  const vg = KM_VARNA[G.moonSign], vb = KM_VARNA[B.moonSign];
  k.push({ key: 'Varna', max: 1, score: KM_VARNA_RANK[vg] >= KM_VARNA_RANK[vb] ? 1 : 0, a: vg, b: vb });
  // 2 Vashya
  const vsh = (s, d) => s === 8 ? (d < 15 ? 'Manava' : 'Chatushpada') : s === 9 ? (d < 15 ? 'Chatushpada' : 'Jalachara') : KM_VASHYA_SIGN[s];
  const wg = vsh(G.moonSign, G.deg), wb = vsh(B.moonSign, B.deg);
  k.push({ key: 'Vashya', max: 2, score: KM_VASHYA[KM_VASHYA_ORDER.indexOf(wg)][KM_VASHYA_ORDER.indexOf(wb)], a: wg, b: wb });
  // 3 Tara (counted both ways, remainder of 9; 3, 5, 7 are unfavourable)
  const rem = n => n % 9 === 0 ? 9 : n % 9;
  const t1 = rem((G.nak - B.nak + 27) % 27 + 1), t2 = rem((B.nak - G.nak + 27) % 27 + 1), bad = [3, 5, 7];
  const TN = ['Janma','Sampat','Vipat','Kshema','Pratyak','Sadhana','Naidhana','Mitra','Parama Mitra'];
  k.push({ key: 'Tara', max: 3, score: 3 - 1.5 * ([t1, t2].filter(x => bad.includes(x)).length), a: TN[t1 - 1], b: TN[t2 - 1], note: 'from bride → groom / groom → bride' });
  // 4 Yoni
  const yg = KM_YONI_NAK[G.nak], yb = KM_YONI_NAK[B.nak];
  k.push({ key: 'Yoni', max: 4, score: KM_YONI[KM_YONI_ORDER.indexOf(yg)][KM_YONI_ORDER.indexOf(yb)], a: yg, b: yb });
  // 5 Graha Maitri
  const lg = SIGNS[G.moonSign].lord, lb = SIGNS[B.moonSign].lord;
  let gm; if (lg === lb) gm = 5; else { const r = [kmRel(lg, lb), kmRel(lb, lg)].sort().join('');
    gm = { FF: 5, FN: 4, NN: 3, EF: 1, EN: 0.5, EE: 0 }[r]; }
  k.push({ key: 'Graha Maitri', max: 5, score: gm, a: lg, b: lb });
  // 6 Gana
  const gg = KM_GANA[G.nak], gb = KM_GANA[B.nak];
  k.push({ key: 'Gana', max: 6, score: KM_GANA_SCORE[gg][gb], a: gg, b: gb });
  // 7 Bhakoot
  const d1 = (B.moonSign - G.moonSign + 12) % 12 + 1, d2 = (G.moonSign - B.moonSign + 12) % 12 + 1;
  const badB = [[2, 12], [12, 2], [5, 9], [9, 5], [6, 8], [8, 6]].some(p => p[0] === d1 && p[1] === d2);
  k.push({ key: 'Bhakoot', max: 7, score: badB ? 0 : 7, a: SIGNS[G.moonSign].name, b: SIGNS[B.moonSign].name, note: `${d1}/${d2} relationship` });
  // 8 Nadi
  const ng = KM_NADI[G.nak % 6], nb = KM_NADI[B.nak % 6];
  k.push({ key: 'Nadi', max: 8, score: ng !== nb ? 8 : 0, a: KM_NADI_NAMES[ng], b: KM_NADI_NAMES[nb] });

  const total = k.reduce((s, x) => s + x.score, 0);
  const verdict = total >= 33 ? ['Excellent match', '#5EC4B7'] : total >= 25 ? ['Very good match', '#8FB36B'] : total >= 18 ? ['Acceptable match', '#E0A64A'] : ['Low match', '#C95050'];
  // doshas
  const lordsOk = lg === lb || (kmRel(lg, lb) === 'F' && kmRel(lb, lg) === 'F');
  const sameNadi = ng === nb;
  const nadiCancel = []; if (sameNadi){ if (G.moonSign === B.moonSign && G.nak !== B.nak) nadiCancel.push('same Moon sign but different nakshatra'); if (G.nak === B.nak && G.pada !== B.pada) nadiCancel.push('same nakshatra but different pada'); }
  const mg = kmManglik(G), mb = kmManglik(B);
  const rg = KM_RAJJU[G.nak], rb = KM_RAJJU[B.nak], cnt = (G.nak - B.nak + 27) % 27 + 1;
  return { k, total, verdict, G, B,
    dosha: { nadi: { present: sameNadi, cancel: nadiCancel }, bhakoot: { present: badB, cancel: badB && lordsOk ? ['Moon-sign lords are the same or mutual friends'] : [] },
             gana: { present: k[5].score <= 1, a: gg, b: gb }, manglik: { g: mg, b: mb } },
    bonus: { rajju: { ok: rg !== rb, a: KM_RAJJU_NAMES[rg], b: KM_RAJJU_NAMES[rb] }, mahendra: { ok: [4, 7, 10, 13, 16, 19, 22, 25].includes(cnt), count: cnt } } };
}


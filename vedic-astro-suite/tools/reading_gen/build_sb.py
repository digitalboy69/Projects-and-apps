import os, json, sys
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '..', '..')); sys.path.insert(0, HERE)
from ps_data import PL
# Shadbala reading (S17, layer schema v1.1). Facts in (every Shadbala component from the chart, the planet's house, sign, motion, Moon phase, lords of the birth moment)
# -> tier per component (relative to its known range) -> plain-language meaning + what it does in life + what helps. Tendencies, not fate. Wording tables below.
DATA = dict(schema='layer-v1.1', planets={k: dict(core=v['core'], scenes=v['scenes'], fric=v['fric'], gift=v['gift'], shadow=v['shadow'], help=v['help']) for k, v in PL.items()},
 order=['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'],
 six=[
  dict(id='sthana', e='📍', name='Sthana Bala', plain='Positional strength', what='how comfortable and well placed the planet is: its sign, its standing across seven divisional charts, its house and its degree'),
  dict(id='dig', e='🧭', name='Dig Bala', plain='Directional strength', what='how close the planet stands to the house where it gains direction: East (1st) for Mercury and Jupiter, South (10th) for the Sun and Mars, North (4th) for the Moon and Venus, West (7th) for Saturn'),
  dict(id='kala', e='⏰', name='Kala Bala', plain='Time strength', what='how well the moment of your birth suits the planet: day or night, waxing or waning Moon, the ruling lords of the year, month, day and hour, and the planet\'s northward or southward lean'),
  dict(id='cheshta', e='🏃', name='Cheshta Bala', plain='Motional strength', what='how energetically the planet is moving: slow or backward-moving planets (retrograde) carry more working energy than fast ones, while the Sun and Moon take theirs from season and phase'),
  dict(id='naisargika', e='🌿', name='Naisargika Bala', plain='Natural strength', what='the built-in rank of each planet by brightness, fixed for everyone: Sun highest, then Moon, Venus, Jupiter, Mercury, Mars and Saturn'),
  dict(id='drik', e='👁️', name='Drik Bala', plain='Aspectual strength', what='the net effect of other planets looking at it: friendly planets (benefics) add strength, harsh planets (malefics) take it away')],
 bandText={'vh': 'very well supplied with strength', 'h': 'well supplied with strength', 'm': 'a little under the strength it needs', 'l': 'clearly short of the strength it needs'},
 homeDir={'Mercury': ['1st', 'East'], 'Jupiter': ['1st', 'East'], 'Sun': ['10th', 'South'], 'Mars': ['10th', 'South'], 'Moon': ['4th', 'North'], 'Venus': ['4th', 'North'], 'Saturn': ['7th', 'West']},
 tmpl=dict(
  overall=dict(
   vh="{P} carries {pct}% of the strength it needs ({rup} rupas against {req}), which puts it {rank} of your seven planets. This is a planet that has resources to work with: {core} tend to have a solid base under it, and you may notice {s1} and {s2} going well with less strain than usual. Because strong planets also carry more weight when their dasha runs, the themes of {P} tend to come through clearly in its Mahadasha and Antardasha. The thing to keep an eye on is {shadow}, which can show when so much strength is available.",
   h="{P} carries {pct}% of the strength it needs ({rup} rupas against {req}), which puts it {rank} of your seven planets. It has enough resources to deliver: {core} tend to work without heavy effort, and you may notice {s1} and {s2} in a dependable form. During its own dasha periods the themes of {P} tend to show with reasonable clarity. Watch for {shadow} if you rely on it too much.",
   m="{P} carries {pct}% of the strength it needs ({rup} rupas against {req}), which puts it {rank} of your seven planets. It is a little short, so {core} tend to work, but with more preparation, repetition or support than you might expect. You may notice {f1} or {f2} on some days and {s1} going well on others. The detail below shows which of its six sources of strength are carrying it and which are thin, so you can see where small efforts matter most.",
   l="{P} carries {pct}% of the strength it needs ({rup} rupas against {req}), which puts it {rank} of your seven planets. It is clearly short, so {core} tend to need real effort, patience and support, and you may notice {f1}, {f2} or {f3} more often than you would like. This is a tendency, not a verdict: low total strength is often balanced by good house placement, friendly aspects or helpful periods, and the sections below show which parts of {P} are weak and which are fine.")),
 comp=dict(
  uchcha=dict(max=60, name='Uchcha Bala (exaltation strength)', what='how far the planet stands from the lowest point of its debilitation: the nearer it is to the high point of exaltation, the higher it scores',
   high="{P} stands near its high point ({ex}) rather than its low point ({de}), so its basic standing is raised. {core} tend to carry weight with other people, and you may find that {s1} comes more easily than it does for most.",
   mid="{P} stands roughly midway between its high point ({ex}) and its low point ({de}), so its standing is ordinary: neither lifted nor pulled down. {core} depend more on the other sources of strength, and {s1} may go well on some days and ask for effort on others.",
   low="{P} stands closer to its low point ({de}) than to its high point ({ex}), so its basic standing is modest. That does not cancel the planet; it means {core} tend to need preparation, and you may notice {f1} or {f2} until other strengths and supportive planets help."),
  saptavargaja=dict(max=315, name='Saptavargaja Bala (strength across seven divisional charts)', what='how the planet fares in seven charts (the birth chart, hora, drekkana, saptamsa, navamsa, dwadasamsa and trimsamsa): own and friendly signs raise it, enemy signs lower it',
   high="In {k} of the seven charts {P} stands in an own, strong or friendly sign ({strong} strong, {friend} friendly, {weak} uncomfortable), so it is well supported from many angles. {core} tend to hold up across different parts of life, and {s1} and {s2} are likely to feel steady.",
   mid="Across the seven charts {P} is mixed ({strong} strong, {friend} friendly, {weak} uncomfortable), so its support depends on the area of life. {core} may go well in some settings and need more effort in others, and you may notice {s1} going well while {f1} shows up elsewhere.",
   low="Across the seven charts {P} often lands in uncomfortable signs ({strong} strong, {friend} friendly, {weak} uncomfortable), so it gets less support than most planets. {core} tend to ask for more of your own effort, and {f1} or {f2} are the places where you may feel it. This tends to ease with steady practice and with a strong house placement."),
  ojayugma=dict(max=30, name='Ojayugma Bala (odd and even sign strength)', what='whether the planet and its navamsa sit in the odd or even signs it prefers: the Sun, Mars and Jupiter prefer odd signs, the Moon and Venus prefer even signs, Mercury and Saturn are given full marks',
   high="{P} gets {v} of 30 here because {why}. This is a small but real extra: its style fits the kind of sign it is in, so {core} tend to feel natural to you.",
   mid="{P} gets {v} of 30 here because {why}. Half of the match is there, so {core} tend to come easily in some settings and a little less naturally in others.",
   low="{P} gets {v} of 30 here because {why}. This is a small point in the total, so it matters little by itself; it only means {core} tend to need a little more conscious effort than the sign alone would give."),
  kendradi=dict(max=60, name='Kendradi Bala (house type strength)', what='how much a house type lifts a planet: corner houses (1, 4, 7, 10) give full marks, the next houses (2, 5, 8, 11) give half, and the rest (3, 6, 9, 12) give a quarter',
   high="{P} stands in your {house} house, a corner house, so it gets full marks ({v}). Corner houses are the visible, action-oriented parts of life, so {core} tend to show up in real, daily results and is hard to miss.",
   mid="{P} stands in your {house} house, a house of the middle kind, so it gets half marks ({v}). It is supported without being in the front row: {core} tend to build steadily rather than showing up all at once.",
   low="{P} stands in your {house} house, one of the quieter houses, so it gets a quarter of the marks ({v}). The planet works more behind the scenes here: {core} tend to grow through effort and learning, and its results may show later than the planets in corner houses."),
  drekkana=dict(max=15, name='Drekkana Bala (decanate strength)', what='whether the planet stands in the third of the sign it likes: male planets (Sun, Mars, Jupiter) in the first third, female planets (Moon, Venus) in the second, neutral planets (Mercury, Saturn) in the third',
   high="{P} stands in the {dec} third of {sign}, the third it prefers, and gains the full {v} points. A small but pleasant boost: its way of working fits the part of the sign it is in.",
   mid="",
   low="{P} stands in the {dec} third of {sign}, not the third it prefers, so it gains {v} points here. This is a small item and changes little by itself."),
  dig=dict(max=60, name='Dig Bala (directional strength)', what='how close the planet is to the house where it gains direction',
   high="{P} stands in your {house} house, at or near its directional home ({dh} house, {dd}), so it scores {v} of 60. Directionally this planet is pointed the right way: {core} tend to find a natural stage in your life, and you may notice {s1} and {s2} getting space and attention.",
   mid="{P} stands in your {house} house, partly towards its directional home ({dh} house, {dd}), so it scores {v} of 60. It has some direction but not full: {core} tend to find its place in some situations and not in others, and {s1} may depend on timing and support.",
   low="{P} stands in your {house} house, far from its directional home ({dh} house, {dd}), so it scores {v} of 60. The planet is working against the grain of its natural direction: {core} tend to need more deliberate effort, and you may notice {f1} or {f2}. A planet low in this strength often grows through the very house it stands in, so look at that house's theme for where the effort pays."),
  nathonnata=dict(max=60, name='Nathonnata Bala (day and night strength)', what='the Sun, Jupiter and Venus gain by day (strongest at noon), the Moon, Mars and Saturn gain by night (strongest at midnight), and Mercury gets full marks at any hour',
   high="{P} scores {v} of 60 because {why}. The hour of your birth suited it well, so {core} tend to feel natural and dependable.",
   mid="{P} scores {v} of 60 because {why}. The hour of your birth gave it some help, so {core} tend to work, with the help coming and going with circumstances.",
   low="{P} scores {v} of 60 because {why}. The hour of your birth did not favour it much, so {core} tend to need more conscious effort or the right setting."),
  paksha=dict(max=60, name='Paksha Bala (phase strength)', what='the Moon\'s phase at birth: planets that are gentle (the Moon, Mercury, Jupiter, Venus) gain from a waxing, brighter Moon; harsh planets (the Sun, Mars, Saturn) gain from a waning, darker Moon',
   high="{P} scores {v} of 60 because {why}. The phase of the Moon at birth supports it, so {core} tend to be backed by the mood of the time you were born.",
   mid="{P} scores {v} of 60 because {why}. The phase of the Moon is neutral for it, so {core} depend on the other strengths.",
   low="{P} scores {v} of 60 because {why}. The phase of the Moon at birth worked against it, so {core} tend to need a little more support from the other strengths."),
  tribhaga=dict(max=60, name='Tribhaga Bala (third of the day or night)', what='the day and the night are each cut into three parts, and one planet rules each part: by day Mercury, the Sun and Saturn, by night the Moon, Venus and Mars; Jupiter gets full marks in all of them',
   high="{P} scores {v} of 60 because {why}. Being born in its part of the day or night gives it full backing: {core} tend to have a quiet, steady support.",
   mid="",
   low="{P} scores {v} of 60 because {why}. This is an all-or-nothing item, so a zero is common and says little by itself; it only means this particular third did not belong to the planet."),
  vmdh=dict(max=150, name='Varsha, Masa, Dina and Hora Bala (the ruling lords of your birth moment)', what='a planet earns points if it rules the year (15), the month (30), the weekday (45) or the planetary hour (60) of your birth',
   high="{P} scores {v} because {why}. Ruling part of the moment of your birth gives it a personal link to you, so {core} tend to feel like part of your own character.",
   mid="",
   low="{P} scores {v} because it rules none of the year, month, day or hour of your birth. Most planets score zero here, so this says little; it only means {P} is not one of the planets that marked the moment of your arrival."),
  ayana=dict(max=60, name='Ayana Bala (northern and southern strength)', what='the Sun, Mars, Jupiter and Venus gain when they stand in the northern half of the sky, the Moon and Saturn when they stand in the southern, and Mercury gets full marks',
   high="{P} scores {v} of 60 because {why}. The season of its position suits it, so {core} tend to have a seasonal lift behind it.",
   mid="{P} scores {v} of 60 because {why}. Its seasonal position is neutral, so {core} depend on the other strengths.",
   low="{P} scores {v} of 60 because {why}. Its seasonal position is not the one it prefers, so {core} tend to need a little more help from the other strengths."),
  cheshta=dict(max=60, name='Cheshta Bala (motional strength)', what='how much working energy the planet has through its movement: a retrograde planet or one moving slowly carries more drive than one moving quickly; the Sun takes its value from its seasonal position and the Moon from its phase',
   high="{P} scores {v} of 60 because {why}. It has a lot of working energy: {core} tend to come with drive and persistence, and you may notice {s1} and {s2} getting done with real follow-through.",
   mid="{P} scores {v} of 60 because {why}. It has a moderate amount of working energy: {core} tend to move at an ordinary pace, with bursts of drive when the running periods involve {P}.",
   low="{P} scores {v} of 60 because {why}. Its working energy is low: {core} tend to be easy and unforced rather than driven, and big pushes may take more effort or come from outside help."),
  naisargika=dict(max=60, name='Naisargika Bala (natural strength)', what='the built-in rank of each planet, the same for every chart',
   high="{P} scores {v} of 60 by nature, one of the brightest planets, so it starts every chart with a head start. {core} tend to be visible and carry natural weight.",
   mid="{P} scores {v} of 60 by nature, a middle-ranking planet. It has no special head start or handicap, so {core} depend on what the other strengths add.",
   low="{P} scores {v} of 60 by nature, one of the quieter planets by rank. This is the same for everyone, so it is not a weakness of your chart; it only means {P} makes up its strength through the other sources. {core} tend to be slow, deep and lasting rather than showy."),
  drik=dict(max=60, name='Drik Bala (aspectual strength)', what='the net effect of other planets looking at it: gentle planets add, harsh planets subtract',
   high="{P} scores {v}, a positive figure, so the planets that look at it are mostly supportive. {core} tend to get help from others: you may find that {s1} comes with encouragement or good timing.",
   mid="{P} scores {v}, close to zero, so the support and the pressure from other planets roughly cancel out. {core} depend more on its own strengths than on help or interference.",
   low="{P} scores {v}, a negative figure, so the planets that look at it are mostly pressing. {core} tend to meet friction from outside: you may find {f1} or {f2}. Pressure from aspects is often a call for patience, not a closed door, and it eases when the running periods or transits bring supportive planets."),
  ishta=dict(name='Ishta and Kashta Phala (favourable and unfavourable results)', what='two classical numbers built from the exaltation strength and the motional strength: Ishta (favourable) is high when the planet is both well placed and energetic, Kashta (unfavourable) is high when it is poorly placed and weak in motion',
   high="Ishta is {i} against Kashta {k}, so the favourable side clearly outweighs the unfavourable. During {P} periods, the results of {core} tend to lean towards the helpful: progress, goodwill and things working out.",
   mid="Ishta is {i} and Kashta {k}, which are close, so the helpful and testing sides are balanced. During {P} periods you may see both: some results come easily and some come after effort.",
   low="Ishta is {i} against Kashta {k}, so the testing side outweighs the favourable one. During {P} periods, {core} tend to ask for effort first and reward later; the habits that tend to help most are {help}.")))
HEAD = '''/* ============================================================================
   GENERATED by tools/reading_gen (edit the tables in tools/reading_gen/build_sb.py, then run tools/reading_gen/regen.sh). Do not hand-edit this file.
   SHADBALA READING (SBR): the six sources of planetary strength, every component explained and read for your chart, layer schema v1.1. Tendencies, not predictions.
   SBR.assess(chart) -> { planets:[7 x {planet, rupas, required, pct, rank, band, groups:[{id,e,h,lines:[{h,text,value}]}], words}], ranking, strongest, weakest, six, glossary }
   Components: Sthana (Uchcha, Saptavargaja, Ojayugma, Kendradi, Drekkana), Dig, Kala (Nathonnata, Paksha, Tribhaga, Varsha-Masa-Dina-Hora, Ayana), Cheshta, Naisargika, Drik,
   plus Ishta and Kashta Phala. Reads chart.shadbala as computed by js/14; nothing is recalculated here.
   ============================================================================ */
const SBR_DATA = '''
API = r'''

window.SBR = (function(D){
  'use strict';
  if (typeof VDB === 'undefined') return null;
  const SIGN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ordn = n => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
  const nm = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const pickN = (arr, k, seed) => { const a = arr.slice(), out = []; let h = hash(seed); while (out.length < k && a.length){ const i = h % a.length; out.push(a.splice(i, 1)[0]); h = (h * 31 + 17) >>> 0; } return out; };
  const fill = (s, m) => s.replace(/\{(\w+)\}/g, (x, k) => m[k] != null ? m[k] : x);
  const r1 = v => (Math.round(v * 10) / 10).toFixed(1), r0 = v => String(Math.round(v));
  const VK = ['D1', 'D2', 'D3', 'D7', 'D9', 'D12', 'D30'];
  const tier = (v, hi, lo) => v >= hi ? 'high' : v < lo ? 'low' : 'mid';
  const band = p => p >= 130 ? 'vh' : p >= 100 ? 'h' : p >= 80 ? 'm' : 'l';
  const MALE = ['Sun','Mars','Jupiter'], FEMALE = ['Moon','Venus'];
  const DAYP = ['Sun','Jupiter','Venus'], NIGHTP = ['Moon','Mars','Saturn'], NORTHP = ['Sun','Mars','Jupiter','Venus'];
  const rankWord = r => ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'][r - 1];

  function planet(chart, n, ranks){
    const sb = chart.shadbala && chart.shadbala.planets && chart.shadbala.planets[n], p = chart.planets[n], P = D.planets[n]; if (!sb || !p || !P) return null;
    const sc = pickN(P.scenes, 3, n + 'sb'), fr = pickN(P.fric, 3, n + 'sb');
    const base = { P: n, core: P.core, s1: sc[0], s2: sc[1], s3: sc[2], f1: fr[0], f2: fr[1], f3: fr[2], shadow: P.shadow, gift: P.gift, help: P.help.charAt(0).toLowerCase() + P.help.slice(1) };
    const groups = [], pct = Math.round(sb.percentOfRequired), bk = band(pct), T = D.tmpl, C = D.comp;
    const mk = (id, e, h, lines) => groups.push({ id, e, h, lines });
    const WHATS = Object.keys(C).filter(k => C[k].what).map(k => cap(C[k].what) + '.');
    const L = (h, text, value) => { const t = text.replace(/\s+/g, ' ').trim().replace(/(^|[.!?]\s)([a-z])/g, (m, a, b) => a + b.toUpperCase()), w = WHATS.find(x => t.startsWith(x + ' ')); return w ? { h, what: w, read: t.slice(w.length).trim(), text: t, value } : { h, what: '', read: t, text: t, value }; };
    const rk = ranks.total[n];
    mk('overall', '💪', `${n}: ${pct}% of the strength it needs`, [L('Overall strength', fill(T.overall[bk], Object.assign({}, base, { pct, rup: sb.totalRupas.toFixed(2), req: sb.requiredRupas, rank: rankWord(rk) })), sb.totalRupas)]);
    // Sthana
    const ex = VDB.data.planets[n].exaltSign, de = VDB.data.planets[n].debilitationSign, st = sb.sthanaBala, sl = [];
    sl.push(L(C.uchcha.name, C.uchcha.what.charAt(0).toUpperCase() + C.uchcha.what.slice(1) + `. Your value: ${r1(st.uchcha)} of 60. ` + fill(C.uchcha[tier(st.uchcha, 40, 20)], Object.assign({}, base, { ex, de })), st.uchcha));
    let strong = 0, friend = 0, weak = 0, k = 0;
    VK.forEach(v => { const vv = chart.vargas && chart.vargas[v]; if (!vv || !vv.planetVargaSign) return; const sg = vv.planetVargaSign[n]; if (sg == null) return; k++; const s = (getDignity(n, sg, 15) || {}).status; if (/Exalted|OwnSign|Moolatrikona/.test(s)) strong++; else if (s === 'Friend') friend++; else if (/Enemy|Debilitated/.test(s)) weak++; });
    sl.push(L(C.saptavargaja.name, C.saptavargaja.what.charAt(0).toUpperCase() + C.saptavargaja.what.slice(1) + `. Your value: ${r1(st.saptavargaja)}. ` + fill(C.saptavargaja[tier(st.saptavargaja, 200, 120)], Object.assign({}, base, { k: strong + friend, strong, friend, weak })), st.saptavargaja));
    const oddNav = chart.vargas && chart.vargas.D9 && chart.vargas.D9.planetVargaSign ? chart.vargas.D9.planetVargaSign[n] : p.sign, odd = s => s % 2 === 0;
    const why = (n === 'Mercury' || n === 'Saturn') ? `${n} is given full marks whatever the sign` : MALE.includes(n) ? `${n} prefers odd signs and stands in ${SIGN[p.sign]} (${odd(p.sign) ? 'odd, a match' : 'even, not a match'}) with its navamsa in ${SIGN[oddNav]} (${odd(oddNav) ? 'odd, a match' : 'even, not a match'})` : `${n} prefers even signs and stands in ${SIGN[p.sign]} (${!odd(p.sign) ? 'even, a match' : 'odd, not a match'}) with its navamsa in ${SIGN[oddNav]} (${!odd(oddNav) ? 'even, a match' : 'odd, not a match'})`;
    sl.push(L(C.ojayugma.name, C.ojayugma.what.charAt(0).toUpperCase() + C.ojayugma.what.slice(1) + `. ` + fill(C.ojayugma[tier(st.ojaYugma, 30, 15)], Object.assign({}, base, { v: r0(st.ojaYugma), why })), st.ojaYugma));
    sl.push(L(C.kendradi.name, C.kendradi.what.charAt(0).toUpperCase() + C.kendradi.what.slice(1) + `. ` + fill(C.kendradi[tier(st.kendradi, 60, 30)], Object.assign({}, base, { house: ordn(p.house), v: r0(st.kendradi) })), st.kendradi));
    const dec = Math.floor(p.degInSign / 10) + 1, want = MALE.includes(n) ? 1 : FEMALE.includes(n) ? 2 : 3;
    sl.push(L(C.drekkana.name, C.drekkana.what.charAt(0).toUpperCase() + C.drekkana.what.slice(1) + `. ` + fill(C.drekkana[st.drekkana > 0 ? 'high' : 'low'], Object.assign({}, base, { dec: ordn(dec), sign: SIGN[p.sign], v: r0(st.drekkana) })), st.drekkana));
    mk('sthana', D.six[0].e, `${D.six[0].name} (${D.six[0].plain}): ${r1(st.total)} virupas`, [L('What it is', cap(D.six[0].what) + `. Your total for ${n}: ${r1(st.total)} virupas, ${ranks.sthana[n] === 1 ? 'the highest' : ranks.sthana[n] === 7 ? 'the lowest' : ordn(ranks.sthana[n]) + ' highest'} among your seven planets.`, st.total)].concat(sl));
    // Dig
    const hd = D.homeDir[n], dg = sb.digBala;
    mk('dig', D.six[1].e, `${D.six[1].name} (${D.six[1].plain}): ${r1(dg)} of 60`, [L('What it is', cap(D.six[1].what) + '.', dg), L('Your reading', fill(C.dig[tier(dg, 40, 20)], Object.assign({}, base, { house: ordn(p.house), dh: hd[0], dd: hd[1], v: r1(dg) })), dg)]);
    // Kala
    const ka = sb.kalaBala, kl = [], moonSun = (((chart.planets.Moon.longitude - chart.planets.Sun.longitude) % 360) + 360) % 360, waxing = moonSun < 180;
    const nwhy = n === 'Mercury' ? 'Mercury gets full marks at any hour' : DAYP.includes(n) ? `${n} gains by day, strongest at noon, and your birth time sits ${ka.nathonnata >= 40 ? 'close to its peak' : ka.nathonnata < 20 ? 'far from its peak' : 'part-way to its peak'}` : `${n} gains by night, strongest at midnight, and your birth time sits ${ka.nathonnata >= 40 ? 'close to its peak' : ka.nathonnata < 20 ? 'far from its peak' : 'part-way to its peak'}`;
    kl.push(L(C.nathonnata.name, cap(C.nathonnata.what) + '. ' + fill(C.nathonnata[tier(ka.nathonnata, 40, 20) === 'mid' ? 'mid' : tier(ka.nathonnata, 40, 20)], Object.assign({}, base, { v: r1(ka.nathonnata), why: nwhy })), ka.nathonnata));
    const gentle = ['Moon','Mercury','Jupiter','Venus'].includes(n), pwhy = n === 'Mercury' || n === 'Moon' || gentle ? `the Moon is ${waxing ? 'waxing' : 'waning'} (${Math.round(moonSun)} degrees ahead of the Sun) and ${n} is a ${gentle ? 'gentle planet, which gains from a brighter Moon' : 'planet'}` : `the Moon is ${waxing ? 'waxing' : 'waning'} (${Math.round(moonSun)} degrees ahead of the Sun) and ${n} is a harsh planet, which gains from a darker Moon`;
    kl.push(L(C.paksha.name, cap(C.paksha.what) + '. ' + fill(C.paksha[tier(ka.paksha, 40, 20)], Object.assign({}, base, { v: r1(ka.paksha), why: pwhy })), ka.paksha));
    kl.push(L(C.tribhaga.name, cap(C.tribhaga.what) + '. ' + fill(C.tribhaga[ka.tribhaga > 0 ? 'high' : 'low'], Object.assign({}, base, { v: r0(ka.tribhaga), why: n === 'Jupiter' ? 'Jupiter gets full marks in every third' : ka.tribhaga > 0 ? 'your birth fell in the third of the day or night that belongs to it' : 'your birth did not fall in the third of the day or night that belongs to it' })), ka.tribhaga));
    const lordsOf = []; const SBc = chart.shadbala; [['varshaLord', 'year'], ['masaLord', 'month'], ['dinaLord', 'weekday'], ['horaLord', 'planetary hour']].forEach(([key, nmx]) => { if (SBc[key] === n) lordsOf.push(nmx); });
    kl.push(L(C.vmdh.name, cap(C.vmdh.what) + `. The lords of your birth moment are: year ${SBc.varshaLord}, month ${SBc.masaLord}, weekday ${SBc.dinaLord}, hour ${SBc.horaLord}. ` + (ka.vmdh > 0 ? fill(C.vmdh.high, Object.assign({}, base, { v: r0(ka.vmdh), why: n + ' rules your ' + nm(lordsOf) })) : fill(C.vmdh.low, Object.assign({}, base, { v: r0(ka.vmdh) }))), ka.vmdh));
    const nlean = NORTHP.includes(n) ? 'northern' : 'southern', awhy = n === 'Mercury' ? 'Mercury gets full marks' : `${n} prefers the ${nlean} half of the sky and its position is ${ka.ayana >= 40 ? 'well aligned with that' : ka.ayana < 20 ? 'on the opposite side' : 'close to the middle'}`;
    kl.push(L(C.ayana.name, cap(C.ayana.what) + '. ' + fill(C.ayana[tier(ka.ayana, 40, 20)], Object.assign({}, base, { v: r1(ka.ayana), why: awhy })), ka.ayana));
    mk('kala', D.six[2].e, `${D.six[2].name} (${D.six[2].plain}): ${r1(ka.total)} virupas`, [L('What it is', cap(D.six[2].what) + `. Your total for ${n}: ${r1(ka.total)} virupas, ${ranks.kala[n] === 1 ? 'the highest' : ranks.kala[n] === 7 ? 'the lowest' : ordn(ranks.kala[n]) + ' highest'} among your seven planets.`, ka.total)].concat(kl));
    // Cheshta
    const sp = p.speed, cwhy = n === 'Sun' ? 'the Sun takes its motional strength from its seasonal position' : n === 'Moon' ? 'the Moon takes its motional strength from its phase' : p.retrograde ? `${n} is retrograde (moving backward at ${r1(Math.abs(sp))} degrees a day), which gives it extra working energy` : `${n} is moving forward at ${r1(sp)} degrees a day, ${sb.chestaBala >= 40 ? 'slowly enough to carry plenty of drive' : sb.chestaBala < 20 ? 'at a quick pace, which gives it less working energy' : 'at a moderate pace'}`;
    mk('cheshta', D.six[3].e, `${D.six[3].name} (${D.six[3].plain}): ${r1(sb.chestaBala)} of 60`, [L('What it is', cap(D.six[3].what) + '.', sb.chestaBala), L('Your reading', fill(C.cheshta[tier(sb.chestaBala, 40, 20)], Object.assign({}, base, { v: r1(sb.chestaBala), why: cwhy })), sb.chestaBala)]);
    // Naisargika
    mk('naisargika', D.six[4].e, `${D.six[4].name} (${D.six[4].plain}): ${r1(sb.naisargikaBala)} of 60`, [L('What it is', cap(D.six[4].what) + '.', sb.naisargikaBala), L('Your reading', fill(C.naisargika[tier(sb.naisargikaBala, 42, 26)], Object.assign({}, base, { v: r1(sb.naisargikaBala) })), sb.naisargikaBala)]);
    // Drik
    mk('drik', D.six[5].e, `${D.six[5].name} (${D.six[5].plain}): ${sb.drikBala >= 0 ? '+' : ''}${r1(sb.drikBala)}`, [L('What it is', cap(D.six[5].what) + '.', sb.drikBala), L('Your reading', fill(C.drik[tier(sb.drikBala, 15, -15)], Object.assign({}, base, { v: (sb.drikBala >= 0 ? '+' : '') + r1(sb.drikBala) })), sb.drikBala)]);
    // Ishta / Kashta
    const u = Math.max(0, Math.min(60, st.uchcha)), c = Math.max(0, Math.min(60, sb.chestaBala)), ish = Math.sqrt(u * c), kas = Math.sqrt((60 - u) * (60 - c)), it = ish - kas >= 8 ? 'high' : ish - kas <= -8 ? 'low' : 'mid';
    mk('ishta', '⚖️', `Ishta ${r1(ish)} and Kashta ${r1(kas)}`, [L('What it is', cap(C.ishta.what) + '.', ish), L('Your reading', fill(C.ishta[it], Object.assign({}, base, { i: r1(ish), k: r1(kas) })), ish - kas)]);
    // strongest and thinnest source
    const six = [['Sthana', ranks.sthana[n], 'positional'], ['Dig', ranks.dig[n], 'directional'], ['Kala', ranks.kala[n], 'time'], ['Cheshta', ranks.cheshta[n], 'motional'], ['Drik', ranks.drik[n], 'aspectual']].sort((a, b) => a[1] - b[1]);
    groups[0].lines.push(L('Where its strength comes from', `Compared with your other six planets, ${n} is relatively strongest in its ${six[0][2]} strength (${ordn(six[0][1])} of 7) and relatively thinnest in its ${six[six.length - 1][2]} strength (${ordn(six[six.length - 1][1])} of 7). Natural strength is the same for every chart, so it is left out of this comparison. When ${n} runs a period, the strong source tends to show up first, and small efforts around the thin source (${P.help.charAt(0).toLowerCase() + P.help.slice(1)}) tend to help most.`, null));
    const words = groups.reduce((a, g) => a + g.lines.reduce((b, l) => b + l.text.split(/\s+/).length, 0), 0);
    return { planet: n, rupas: sb.totalRupas, required: sb.requiredRupas, pct, rank: rk, band: bk, bandText: D.bandText[bk], groups, words, ish, kas };
  }
  function assess(chart){
    const names = D.order.filter(n => chart.shadbala && chart.shadbala.planets && chart.shadbala.planets[n]), S = n => chart.shadbala.planets[n];
    const rankBy = fn => { const o = names.slice().sort((a, b) => fn(S(b)) - fn(S(a)) || names.indexOf(a) - names.indexOf(b)), r = {}; o.forEach((n, i) => r[n] = i + 1); return r; };
    const ranks = { total: rankBy(s => s.percentOfRequired), sthana: rankBy(s => s.sthanaBala.total), dig: rankBy(s => s.digBala), kala: rankBy(s => s.kalaBala.total), cheshta: rankBy(s => s.chestaBala), drik: rankBy(s => s.drikBala) };
    const list = names.map(n => planet(chart, n, ranks)).filter(Boolean), ranking = list.slice().sort((a, b) => b.pct - a.pct);
    return { planets: list, ranking: ranking.map(x => ({ planet: x.planet, pct: x.pct, rupas: x.rupas, required: x.required })), strongest: ranking[0] && ranking[0].planet, weakest: ranking[ranking.length - 1] && ranking[ranking.length - 1].planet,
      six: D.six, words: list.reduce((a, x) => a + x.words, 0) };
  }
  return { data: D, assess };
})(SBR_DATA);
'''
out = HEAD + json.dumps(DATA, ensure_ascii=False, indent=1) + ';' + API
open(os.path.join(REPO, 'apps/birth-chart/js/105-shadbala-reading.js'), 'w', encoding='utf-8').write(out)
print('written KB:', len(out.encode()) // 1024)

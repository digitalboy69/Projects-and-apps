import os, json, sys
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '..', '..')); sys.path.insert(0, HERE)
from ps_data import PL, NODES
# Planet states (S15, layer schema v1.1). Facts in (dignity, retrograde, combustion, vargottama, navamsa, house, sign lord) -> state blocks out, with real-life examples.
# Tables are in ps_data.py (planet wording) and below (frames, combinations); logic in the API. Tendencies, not fate.
DATA = dict(schema='layer-v1.1', planets=PL, nodes=NODES,
 frames=dict(
  OwnSign="{P} is in its own sign, {S}: at home, steady and dependable. Its work in {core} tends to come without strain. In daily life you may notice it in {s1}, {s2} and {s3}. You tend to have {gift} to draw on; the thing to watch is {shadow} when the strength is overused.",
  Moolatrikona="{P} is in its moolatrikona sign, {S}: very strong, nearly as good as exaltation. It works with confidence and clarity in {core}. In daily life this may show in {s1}, {s2} and {s3}. {Gift} are available to you; the thing to watch is {shadow} if the confidence runs ahead of the situation.",
  Friend="{P} is in {S}, a friend's sign (ruled by {L}): supported and cooperative. Results in {core} tend to flow with mild ease, though the support is smaller than in its own sign, so steady effort still matters. In daily life you may notice it in {s1}, {s2} and {s3}. {Gift} tend to be available; watch {shadow} if you lean on the help and stop trying.",
  Neutral="{P} is in {S}, a neutral sign (ruled by {L}): neither helped nor hindered by the sign, so the house it stands in, the planets that look at it and its company decide the result. In {core} it can go either way; you might notice it in {s1}, {s2} or {s3}. Look at the other factors on this page to see whether it leans toward {gift} or toward {shadow}.",
  Enemy="{P} is in {S}, an enemy's sign (ruled by {L}): uncomfortable, so results in {core} come with friction or extra effort. In daily life this may look like {f1}, {f2} or {f3}. The friction is real but workable: it often builds skill and resilience, and it eases with a supportive lord, a strong navamsa and the practical help below. Watch for {shadow}."),
 combos={
  'Exalted+retro': "Exalted and retrograde together: the strength is real but turned inward. Think of a powerful engine running in a lower gear: results in {core} often arrive later or after a second look, and they tend to be deeper and more personal than showy.",
  'Debilitated+retro': "Debilitated and retrograde together: some traditions read this as a planet that works hard to repair itself. You may need to revisit {core} more than once, and the maturity that comes from repeating the lesson often turns the weakness into depth.",
  'Enemy+retro': "In an enemy's sign and retrograde: the friction is felt inwardly first. You may rehearse, delay or doubt before acting in {core}; the repeated attempts tend to improve the outcome.",
  'Exalted+combust': "Exalted and combust together: the strength is there, but the Sun's glare mutes it. The skill is real while the recognition for it may lag, so let your results speak and share credit.",
  'Debilitated+combust': "Debilitated and combust together: two pressures meet on {core}. Look carefully at the navamsa, cancellation and the kindness of the sign lord, because those decide whether this feels heavy or becomes a quiet strength.",
  'combust+retro': "Combust and retrograde together: the planet is both dimmed by the Sun and turned inward. Its work in {core} is private and slow to be noticed, so patience and written records of your progress help.",
  'Exalted+vargottama': "Exalted and vargottama together: the strength shows in the birth chart and repeats in the navamsa, so the promise in {core} is reliable and clearly expressed.",
  'Debilitated+vargottama': "Debilitated and vargottama together: the weakness repeats in the navamsa, which makes the theme of {core} a lifelong training ground; effort and support matter, and the growth tends to be real.",
  'Enemy+combust': "In an enemy's sign and combust: the sign adds friction and the Sun adds glare, so {core} can feel harder to express. Concentrate on one clear task at a time and let results, not arguments, make the case.",
  'Friend+combust': "In a friend's sign and combust: the sign supports the planet while the Sun dims it, so {core} works, but quietly and with less credit than it deserves. Writing down what you contributed helps.",
  'Neutral+combust': "In a neutral sign and combust: the planet has no help from the sign and some dimming from the Sun, so {core} depends more on the house, the aspects and your own conscious effort.",
  'OwnSign+combust': "In its own sign and combust: the planet is at home but overshadowed by the Sun, so the ability in {core} is there and may be modest about itself. It tends to improve when you claim it openly.",
  'Moolatrikona+combust': "In its moolatrikona sign and combust: the strength of the sign is partly hidden by the Sun's glare, so {core} is capable but may need you to bring it into view.",
  'combust+vargottama': "Combust and vargottama together: the Sun dims the planet, yet the navamsa repeats its sign, which keeps the core ability steady. {core} tends to improve once the glare of ego is balanced with humility.",
  'retro+vargottama': "Retrograde and vargottama together: the planet works inward, yet both charts agree on its sign, so its inner work in {core} is consistent even when the results arrive later.",
  'Friend+retro': "In a friend's sign and retrograde: the sign helps while the motion turns the energy inward, so {core} tends to improve after a second look, with supportive people close by.",
  'Neutral+retro': "In a neutral sign and retrograde: the planet works inward without much help from the sign, so {core} depends on reflection, repetition and the house it stands in.",
  'OwnSign+retro': "In its own sign and retrograde: the planet is at home but works privately, so {core} is strong in a quiet, reflective way and benefits from time alone to think.",
  'Moolatrikona+retro': "In its moolatrikona sign and retrograde: the strength is high and turned inward, so {core} tends to be deep, personal and slower to show than to feel.",
  'Enemy+vargottama': "In an enemy's sign and vargottama: the friction repeats in the navamsa, so {core} is a steady training ground where effort tends to build lasting skill.",
  'OwnSign+vargottama': "Own sign and vargottama together: the planet is at home in both charts, which makes it one of the dependable parts of your chart for {core}."},
 houseTone=dict(
  Exalted="Placed in your {h} house ({theme}), the strength goes into that field: it tends to be where you do well with less effort.",
  Moolatrikona="Placed in your {h} house ({theme}), the confidence goes into that field: it tends to be a place where you trust yourself.",
  OwnSign="Placed in your {h} house ({theme}), it keeps that field steady and cared for.",
  Friend="Placed in your {h} house ({theme}), it brings supportive help to that field.",
  Neutral="Placed in your {h} house ({theme}), its effect there depends on the planets that join or look at it.",
  Enemy="Placed in your {h} house ({theme}), expect some friction in that field and extra effort that tends to pay off.",
  Debilitated="Placed in your {h} house ({theme}), that field asks for patience and practice; it often turns into a quiet strength later."),
 period=dict(
  strong="With {P} {state}, this {level} tends to bring {core} forward with less effort than usual. You may notice {s1}, {s2} and {s3} becoming more active or more rewarding. The thing to watch is {shadow}, which can appear when things go well for a long time.",
  friend="With {P} in a friend's sign, this {level} tends to bring {core} forward with support. You may notice {s1}, {s2} and {s3} getting attention, and help tends to arrive through people and circumstances. Steady effort turns that support into results; the thing to watch is {shadow}.",
  neutral="With {P} in a neutral sign, this {level} brings {core} forward without extra help or hindrance from the sign, so the houses it rules and sits in decide the flavour. You may notice {s1}, {s2} and {s3} in the foreground. Watch for {shadow} and use {gift}.",
  weak="With {P} {state}, this {level} may start with friction around {core}. In daily life this can look like {f1}, {f2} or {f3}. The friction is workable: it tends to ask for patience, preparation and support, and it often builds real skill. Watch for {shadow}.",
  retro="Because {P} is retrograde, this {level} tends to revisit old matters before moving on: unfinished projects, former contacts or earlier decisions may return for a second look. Progress is slower at the start and more thorough later.",
  combust="Because {P} is close to the Sun, this {level} may feel overshadowed by authority, ego or a stronger personality; your work in {core} may be noticed later than it deserves, so keep records and let results speak.",
  level=dict(Mahadasha='the long background chapter of your life, lasting years, which sets the main theme', Antardasha='the chapter inside that background, lasting months to a couple of years, which decides which part of the theme is in front', Pratyantar='the finest layer, lasting weeks to months, useful for timing smaller steps and moods')),
 houseState=dict(
  strong="{P} stands strong here, so its gifts ({gift}) tend to reach {theme} with ease. Example: in matters of {theme}, you may find that {s1} feels natural and goes well.",
  mid="{P} stands in a middling state here, so {theme} gets {core} in a mixed way. Example: some days {s1} goes smoothly and on others it asks more effort, depending on the other planets that touch this house.",
  weak="{P} stands under pressure here, so {theme} meets {core} with some friction. Example: {f1} or {f2} may show up around {theme}. This usually responds to patience, preparation and practical support.",
  retro="As it is retrograde, the matters of {theme} are often reviewed before they settle: a second look, a delayed start or a return to something earlier.",
  combust="As it is close to the Sun, the matters of {theme} can feel overshadowed by ego or by a stronger person, and benefit from deliberate attention.",
  karaka="{P} is also a natural significator of this house, which strengthens its themes but can make you over-focus on them; keep the other areas of life in view."),
 starState=dict(
  strong_friend="{P} is strong in its sign and stands in {N}, a star ruled by {NL}, a friend, so the sign and the star agree: the placement tends to be steady and well supported.",
  strong_enemy="{P} is strong in its sign but stands in {N}, a star ruled by {NL}, an enemy, so the sign and the star pull in different directions: the strength is there, though its expression can come with friction or surprise.",
  strong_other="{P} is strong in its sign and stands in {N}, a star ruled by {NL}; the star adds its own colour without changing the underlying strength.",
  weak_friend="{P} is under pressure in its sign but stands in {N}, a star ruled by {NL}, a friend, which softens the difficulty: the star gives help where the sign does not.",
  weak_enemy="{P} is under pressure in its sign and also stands in {N}, a star ruled by {NL}, an enemy, so the friction is felt twice; patience and support matter more than usual here.",
  weak_other="{P} is under pressure in its sign and stands in {N}, a star ruled by {NL}; the star adds colour and the final effect depends on the aspects and the running periods.",
  mid_friend="{P} stands in {N}, a star ruled by {NL}, a friend, which supports its work.",
  mid_enemy="{P} stands in {N}, a star ruled by {NL}, an enemy, which adds some friction to its work.",
  mid_other="{P} stands in {N}, a star ruled by {NL}; the star adds its own colour to the result."),
 karaka={'1': ['Sun'], '2': ['Jupiter'], '3': ['Mars'], '4': ['Moon'], '5': ['Jupiter'], '6': ['Mars', 'Saturn'], '7': ['Venus'], '8': ['Saturn'], '9': ['Jupiter'], '10': ['Sun', 'Mercury', 'Jupiter', 'Saturn'], '11': ['Jupiter'], '12': ['Saturn', 'Ketu']},
 labels=dict(Exalted='Exalted', OwnSign='Own sign', Moolatrikona='Moolatrikona', Friend="Friend's sign", Neutral='Neutral sign', Enemy="Enemy's sign", Debilitated='Debilitated'),
 emoji=dict(Exalted='👑', OwnSign='🏠', Moolatrikona='🏛️', Friend='🤝', Neutral='⚖️', Enemy='⚔️', Debilitated='📉', retro='🔄', combust='🔥', vargottama='⭐'))
HEAD = '''/* ============================================================================
   GENERATED by tools/reading_gen (edit the tables in tools/reading_gen/build_ps.py and ps_data.py, then run tools/reading_gen/regen.sh). Do not hand-edit this file.
   PLANET STATES (PST): what each planet's state means for you, with everyday examples, layer schema v1.1. Tendencies, not predictions.
   PST.block(chart, planet) -> { planet, tags:[...], lines:[{e,h,text}], words }     PST.all(chart) -> [ 9 blocks ]     PST.text(planet, status) -> the bare paragraph
   States covered: exalted, own sign, moolatrikona, friend's sign, neutral, enemy's sign, debilitated (with cancellation check), retrograde, combust, vargottama,
   navamsa strength, house placement, and combinations of states. PST.period(chart, planet, level, dates) and PST.periods(chart, now) read the running dasha lords by state. Rahu and Ketu are read through the planet that rules their sign. Needs js/99 (ADD tables).
   ============================================================================ */
const PST_DATA = '''
API = r'''

window.PST = (function(D){
  'use strict';
  if (typeof VDB === 'undefined' || typeof getDignity !== 'function') return null;
  const SIGN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ordn = n => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
  const nm = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const pickN = (arr, k, seed) => { const a = arr.slice(), out = []; let h = hash(seed); while (out.length < k && a.length){ const i = h % a.length; out.push(a.splice(i, 1)[0]); h = (h * 31 + 17) >>> 0; } return out; };
  const T = (typeof ADD !== 'undefined' && ADD && ADD.data && ADD.data.theme) ? ADD.data.theme : null;
  const fill = (s, m) => s.replace(/\{(\w+)\}/g, (x, k) => m[k] != null ? m[k] : x);
  const KEND = [1, 4, 7, 10], lordOfSign = s => VDB.data.signs[s].lord;
  const sd = n => { try { return (getDignity(n, 0, 15) || {}).status; } catch (e) { return null; } };

  function text(n, status, ctx){
    const P = D.planets[n]; if (!P) return '';
    ctx = ctx || {}; const sign = ctx.sign != null ? SIGN[ctx.sign] : 'its sign', lord = ctx.sign != null ? lordOfSign(ctx.sign) : 'the sign lord';
    if (status === 'Exalted' || status === 'Debilitated') return status === 'Exalted' ? P.exalted : P.debilitated;
    const f = D.frames[status] || D.frames.Neutral, sc = pickN(P.scenes, 3, n + status), fr = pickN(P.fric, 3, n + status);
    return fill(f, { P: n, S: sign, L: lord, core: P.core, s1: sc[0], s2: sc[1], s3: sc[2], f1: fr[0], f2: fr[1], f3: fr[2], gift: P.gift, Gift: cap(P.gift), shadow: P.shadow });
  }

  function block(chart, n){
    const p = chart.planets[n]; if (!p) return null;
    const tags = [], L = [], add = (e, h, t) => L.push({ e, h, text: t.replace(/\s+/g, ' ').trim() });
    const st = (p.dignity && p.dignity.status) || 'Neutral', label = (p.dignity && p.dignity.label) || '';
    const asc = chart.ascendant.sign, moonH = chart.planets.Moon.house;
    if (n === 'Rahu' || n === 'Ketu'){
      const N = D.nodes[n], dl = lordOfSign(p.sign), dp = chart.planets[dl], dst = dp && dp.dignity ? dp.dignity.status : 'Neutral';
      add('🌀', 'What ' + n + ' is about', `${n} stands for ${N.core}. Both nodes are retrograde by nature, so their work is karmic and unconventional: the results tend to come through unfamiliar routes, in bursts, and with a feeling of pull rather than choice. In daily life you may notice it in ${nm(pickN(N.scenes, 3, n))}.`);
      add('🔗', 'How its sign lord shapes it', `${n} behaves like the planet that rules its sign. It stands in ${SIGN[p.sign]}, ruled by ${dl}, which sits in your ${ordn(dp.house)} house ${/Exalted|Moolatrikona|OwnSign/.test(dst) ? 'in a strong state (' + dst.replace('OwnSign', 'own sign').toLowerCase() + '), so the node tends to find a supportive channel' : dst === 'Debilitated' ? 'in a weak state (debilitated), so the node can feel unsupported and benefits from patience' : dst === 'Enemy' ? "in an enemy's sign, so the node's results can come with friction" : /Friend/.test(dst) ? "in a friend's sign, so the node tends to get cooperation" : 'in a neutral sign, so the result depends on the house and company'}. ${T ? 'In your ' + ordn(p.house) + ' house (' + T[p.house - 1].split(',')[0] + ') the node pulls attention toward that field.' : ''}`);
      add('🛠️', 'What helps', `${N.help}.`);
      tags.push(st === 'Neutral' ? 'node' : st);
      return { planet: n, tags, lines: L, words: L.reduce((a, l) => a + l.text.split(/\s+/).length, 0) };
    }
    const P = D.planets[n], ctx = { sign: p.sign }, states = [];
    tags.push(D.labels[st] || st);
    add(D.emoji[st] || '🎚️', 'Its sign state: ' + (D.labels[st] || st) + ((st === 'Exalted' || st === 'Debilitated') && label && label !== '—' ? ' (' + label + ')' : ''), text(n, st, ctx) + (T ? ' ' + fill(D.houseTone[st] || D.houseTone.Neutral, { h: ordn(p.house), theme: T[p.house - 1].split(',')[0] }) : ''));
    states.push(st);
    if (p.retrograde && P.retro){ tags.push('Retrograde'); states.push('retro'); add('🔄', 'Retrograde', P.retro); }
    if (p.combustion && p.combustion.combust && P.combust){ tags.push('Combust'); states.push('combust'); add('🔥', 'Combust', `${P.combust} Here the planet is ${p.combustion.separation.toFixed(1)} degrees from the Sun (the combustion limit used is ${p.combustion.orb} degrees), so ${p.combustion.separation <= p.combustion.orb / 2 ? 'the dimming is strong' : 'the dimming is mild'}.`); }
    const d9s = chart.vargas && chart.vargas.D9 && chart.vargas.D9.planetVargaSign ? chart.vargas.D9.planetVargaSign[n] : null;
    if (d9s != null){
      const d9 = (getDignity(n, d9s, 15) || {}).status, varg = d9s === p.sign;
      if (varg){ tags.push('Vargottama'); states.push('vargottama'); add('⭐', 'Vargottama', 'The planet is in the same sign in the birth chart and the navamsa, so its results are more reliable and clearly expressed. ' + (st === 'Debilitated' ? 'Because the planet is also weak here, the weakness repeats, and the theme becomes a lifelong training ground.' : 'This strengthens the promise of the placement.')); }
      const strong = x => /Exalted|OwnSign|Moolatrikona/.test(x), weak = x => /Enemy|Debilitated/.test(x);
      add('🌗', 'In the navamsa (D9)', `In the navamsa the planet is in ${SIGN[d9s]}, ${D.labels[d9].toLowerCase()}. ${weak(st) && strong(d9) ? 'This lifts a weak birth-chart state: the inner promise is better than the outward start suggests, and results tend to improve with maturity.' : strong(st) && weak(d9) ? 'The birth chart looks strong while the navamsa is weaker, so keep the strength maintained with effort rather than assuming it.' : strong(st) && strong(d9) ? 'Both charts agree on strength, which makes this planet a reliable support.' : weak(st) && weak(d9) ? 'Both charts show friction, so steady effort and support matter more than usual.' : 'The two charts give a balanced picture, so the house and aspects decide the details.'}`);
    }
    const polar = /Exalted|OwnSign|Moolatrikona/.test(st) ? 'strong' : /Enemy|Debilitated/.test(st) ? 'weak' : 'mid', theme = T ? T[p.house - 1].split(',')[0] : 'that house', scn = pickN(P.scenes, 1, n + 'h' + p.house)[0], frc = pickN(P.fric, 2, n + 'h' + p.house);
    { const hm = { P: n, gift: P.gift, core: P.core, theme, s1: scn, f1: frc[0], f2: frc[1] }; let t = fill(D.houseState[polar], hm);
      if (p.retrograde && P.retro) t += ' ' + fill(D.houseState.retro, hm); if (p.combustion && p.combustion.combust && P.combust) t += ' ' + fill(D.houseState.combust, hm); if ((D.karaka[p.house] || []).indexOf(n) >= 0) t += ' ' + fill(D.houseState.karaka, hm);
      add('🏠', `In your ${ordn(p.house)} house (${theme}) with this state`, t); }
    if (p.nakshatra && typeof VNK !== 'undefined' && VNK){ const nk = p.nakshatra, rel = VNK.relation(n, nk.lord), kind = rel === 'enemy' ? 'enemy' : (rel === 'friend' || rel === 'own') ? 'friend' : 'other', nr = VNK.nakshatra(nk.index);
      add('⭐', 'Sign and star together', fill(D.starState[polar + '_' + kind], { P: n, N: nk.name + ' (pada ' + nk.pada + ')', NL: nk.lord }) + (nr && nr.nature ? ` The star is ${nr.nature.toLowerCase()} in nature, so the planet's work tends to feel ${/fixed/i.test(nr.nature) ? 'steady and persistent' : /movable|swift/i.test(nr.nature) ? 'quick and changeable' : /fierce|sharp|dreadful/i.test(nr.nature) ? 'intense and decisive' : /soft|tender|gentle/i.test(nr.nature) ? 'gentle and cooperative' : 'varied, with a mix of steady and quick phases'}.` : '')); }
    for (let i = 0; i < states.length; i++) for (let j = i + 1; j < states.length; j++){ const k = [states[i], states[j]].sort().join('+'), alt = states[i] + '+' + states[j], t = D.combos[k] || D.combos[alt] || D.combos[states[j] + '+' + states[i]]; if (t) add('🧩', 'States together', fill(t, { core: P.core })); }
    if (st === 'Debilitated'){
      const ds = SIGN.indexOf(VDB.data.planets[n].debilitationSign), es = SIGN.indexOf(VDB.data.planets[n].exaltSign), l1 = lordOfSign(ds), l2 = lordOfSign(es), reasons = [];
      const kend = x => { const h = chart.planets[x] && chart.planets[x].house; return h && (KEND.indexOf(h) >= 0 ? 'the ' + ordn(h) + ' house from the rising sign' : KEND.indexOf(((h - moonH + 12) % 12) + 1) >= 0 ? 'a corner house from the Moon' : null); };
      if (l1 !== 'Moon' && kend(l1)) reasons.push(`${l1}, the lord of the sign of debilitation, stands in ${kend(l1)}`);
      if (l2 !== 'Moon' && kend(l2)) reasons.push(`${l2}, the lord of the sign of exaltation, stands in ${kend(l2)}`);
      add('🩹', 'Cancellation check (Neecha Bhanga)', reasons.length ? `A classical cancellation rule is met: ${nm(reasons)}. This tends to soften the weakness and turn the early struggle into resilience, often rising to real achievement in this planet's field.` : `The common cancellation rules (the lords of the debilitation or exaltation sign standing in a corner house from the rising sign or the Moon) are not met here, so the planet works as a plain weak planet. Support from the navamsa, friendly aspects and steady practice still improve it.`);
    }
    add('🛠️', 'What helps', `${cap(P.help)}.`);
    return { planet: n, tags, lines: L, words: L.reduce((a, l) => a + l.text.split(/\s+/).length, 0) };
  }

  function yogaStates(chart, y){
    const L = [], add = (e, h, t) => L.push({ e, h, text: t.replace(/\s+/g, ' ').trim() }), ps = (y.planets || []).filter(n => chart.planets[n]), info = [];
    ps.forEach(n => { const p = chart.planets[n], st = (p.dignity && p.dignity.status) || 'Neutral', P = D.planets[n]; let sc = /Exalted|OwnSign|Moolatrikona/.test(st) ? 2 : st === 'Friend' ? 1 : /Enemy/.test(st) ? -1 : st === 'Debilitated' ? -2 : 0;
      const bits = [D.labels[st].toLowerCase()]; if (p.retrograde && P && P.retro){ bits.push('retrograde'); sc -= 0.5; } if (p.combustion && p.combustion.combust && P){ bits.push('combust'); sc -= 1; }
      const d9 = chart.vargas && chart.vargas.D9 && chart.vargas.D9.planetVargaSign ? chart.vargas.D9.planetVargaSign[n] : null; if (d9 != null && d9 === p.sign){ bits.push('vargottama'); sc += 1; }
      info.push({ n, sc, bits, house: p.house }); });
    if (!info.length) return L;
    add('🎚️', 'State of the planets in this combination', info.map(x => `${x.n} is ${nm(x.bits)} in your ${ordn(x.house)} house`).join('; ') + '.');
    const tot = info.reduce((a, x) => a + x.sc, 0) / info.length, weakest = info.slice().sort((a, b) => a.sc - b.sc)[0], strongest = info.slice().sort((a, b) => b.sc - a.sc)[0], sc0 = (y.scenes && y.scenes[0]) || 'this theme';
    add('📈', 'What the states do to this combination', tot >= 1 ? `The planets involved are in good condition, so this combination tends to show clearly and with less effort. For example, ${sc0}. Keep it healthy by using it, not assuming it.` : tot <= -0.5 ? `Some of the planets involved are under pressure (${weakest.n} most of all), so this combination tends to appear in a muted or delayed form and asks for more effort. For example, ${sc0}, though it may take preparation and patience. ${cap((D.planets[weakest.n] || D.nodes[weakest.n]).help)} tends to help it come through.` : `The planets involved are in a mixed condition (${strongest.n} strongest, ${weakest.n} weakest), so this combination shows in some seasons and fades in others. For example, ${sc0}, with a stronger effect when the running periods involve ${strongest.n}.`);
    return L;
  }
  function all(chart){ return ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map(n => block(chart, n)).filter(Boolean); }
  function period(chart, n, level, d, now){
    const p = chart.planets[n]; if (!p || !D.planets[n]) return null;
    const P = D.planets[n], st = (p.dignity && p.dignity.status) || 'Neutral', L = [], add = (e, h, t) => L.push({ e, h, text: t.replace(/\s+/g, ' ').trim() }), lv = D.period.level[level] || '';
    const sc = pickN(P.scenes, 3, n + level), fr = pickN(P.fric, 3, n + level), state = (D.labels[st] || st).toLowerCase().replace("friend's sign", "in a friend's sign").replace("enemy's sign", "in an enemy's sign").replace('own sign', 'in its own sign').replace('neutral sign', 'in a neutral sign').replace('moolatrikona', 'in its moolatrikona sign');
    const strong = /Exalted|OwnSign|Moolatrikona/.test(st), weak = /Enemy|Debilitated/.test(st), key = strong ? 'strong' : st === 'Friend' ? 'friend' : weak ? 'weak' : 'neutral';
    const m = { P: n, level, state: st === 'Exalted' ? 'exalted' : st === 'Debilitated' ? 'debilitated' : st === 'Enemy' ? "in an enemy's sign" : state, core: P.core, s1: sc[0], s2: sc[1], s3: sc[2], f1: fr[0], f2: fr[1], f3: fr[2], shadow: P.shadow, gift: P.gift };
    const dates = d && d.startDate ? ` (${MONS[d.startDate.getUTCMonth()]} ${d.startDate.getUTCFullYear()} to ${MONS[d.endDate.getUTCMonth()]} ${d.endDate.getUTCFullYear()})` : '';
    add('⏳', `${level} ${n}${dates}: ${lv}`, fill(D.period[key], m));
    if (p.retrograde && P.retro){ add('🔄', 'Retrograde lord', fill(D.period.retro, m)); }
    if (p.combustion && p.combustion.combust && P.combust){ add('🔥', 'Combust lord', fill(D.period.combust, m)); }
    const ruled = [1,2,3,4,5,6,7,8,9,10,11,12].filter(h => chart.vargas.D1.houses[h - 1].signLord === n);
    if (T) add('🏠', 'Houses it lights up', `${n} rules ${ruled.length ? nm(ruled.map(h => 'the ' + ordn(h) + ' house (' + T[h - 1].split(',')[0] + ')')) : 'no house'} and sits in the ${ordn(p.house)} house (${T[p.house - 1].split(',')[0]}), so during this ${level.toLowerCase()} those are the parts of life that tend to be switched on${ruled.length ? ', and where matters connected to them are more likely to move' : ''}.`);
    add('🛠️', 'What helps in this period', `${cap(P.help)}.`);
    return { planet: n, level, lines: L, words: L.reduce((a, l) => a + l.text.split(/\s+/).length, 0) };
  }
  const MONS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function periods(chart, now){ const act = findActiveDasha(chart.dashaData.mahadashas, now || new Date()); if (!act) return []; return [['Mahadasha', act.mahadasha], ['Antardasha', act.antardasha], ['Pratyantar', act.pratyantardasha]].filter(x => x[1]).map(([lv, d]) => period(chart, d.lord, lv, d)).filter(Boolean); }
  return { data: D, text, block, all, period, periods, yogaStates };
})(PST_DATA);
'''
out = HEAD + json.dumps(DATA, ensure_ascii=False, indent=1) + ';' + API
open(os.path.join(REPO, 'apps/birth-chart/js/102-planet-states.js'), 'w', encoding='utf-8').write(out)
print('written KB:', len(out.encode()) // 1024)

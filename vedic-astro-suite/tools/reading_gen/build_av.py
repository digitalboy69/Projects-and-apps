import os, json, sys
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '..', '..')); sys.path.insert(0, HERE)
from ps_data import PL
# Ashtakavarga reading (S18, layer schema v1.1). Facts in (bindu table of every planet per sign, SAV per sign, natal houses and lords, where each planet transits today)
# -> tiers per bindu count -> a reading for each planet and then for that planet in each of the twelve houses, plus the combined (Sarvashtakavarga) house map.
# Wording tables here; logic in the API below. Tendencies, not predictions.
P7 = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
DATA = dict(schema='layer-v1.1', order=P7, planets={k: dict(core=PL[k]['core'], scenes=PL[k]['scenes'], fric=PL[k]['fric'], gift=PL[k]['gift'], shadow=PL[k]['shadow'], help=PL[k]['help']) for k in P7},
 short=['you and your body', 'money and family', 'effort and courage', 'home and roots', 'creativity and children', 'daily work and health', 'partnerships', 'change and hidden matters', 'belief and luck', 'career and standing', 'gains and friends', 'rest and the inner life'],
 word=['no support at all', 'barely any support', 'thin support', 'modest support', 'balanced support', 'good support', 'strong support', 'very strong support', 'full support'],
 emoji=['⚪', '🔴', '🟠', '🟡', '🟡', '🟢', '🟢', '💚', '💎'],
 ph=dict(
  low=[
   "{P} gives {b} of 8 points to {sign}, your {h} house ({theme}). That is {word}, so {core} reach {theme} with some difficulty. In daily life you may notice {f1} or {f2} around {theme}. When {P} passes through {sign}, that stretch tends to ask for patience and preparation rather than big moves in {theme}.",
   "In {sign}, your {h} house ({theme}), {P} holds only {b} of its 8 points: {word}. This is a quieter channel for {core}, so matters of {theme} may need more effort from you than from {P} itself. {f1} is the kind of thing that can show here, and small steady habits tend to help more than force. A passage of {P} through this house is better used for quiet work than for launching things."],
  mid=[
   "{P} gives {b} of 8 points to {sign}, your {h} house ({theme}): {word}, close to an average house. {core} reach {theme} in an ordinary way, so results depend on the other factors in the chart. You might notice {s1} going fine and {f1} needing some attention. A passage of {P} through {sign} tends to be mixed: neither a special opening nor a closed door.",
   "With {b} of 8 points in {sign}, your {h} house ({theme}), {P} offers {word}. {core} work here without strong help or hindrance, so timing and effort decide the result. {s1} is an example of what tends to go normally. When {P} passes through this house, steady ordinary progress in {theme} is the realistic expectation."],
  high=[
   "{P} gives {b} of 8 points to {sign}, your {h} house ({theme}): {word}. {core} flow into {theme} with ease, and you may notice {s1} and {s2} working out better than average. When {P} passes through {sign}, it tends to be a productive stretch for {theme}: a good time to act, ask or start.",
   "In {sign}, your {h} house ({theme}), {P} holds {b} of its 8 points, which is {word}. This is one of the channels where {core} come through well. You may find {s1} supported by timing or people, and a passage of {P} through this house is worth using for decisions about {theme}."],
  top=[
   "{P} gives {b} of 8 points to {sign}, your {h} house ({theme}): {word}, among the best a planet can give. {core} are richly supplied here, so {theme} is likely to be one of the places where {P}'s gifts ({gift}) show most clearly. {s1} and {s2} are the kind of things that tend to go well. When {P} passes through {sign}, it tends to be a standout window for {theme}, and it deserves to be used on purpose.",
   "With {b} of 8 points in {sign}, your {h} house ({theme}), {P} reaches {word}. This is a rare, full channel for {core}: {theme} gets the best of what {P} can give. Expect {gift} to be available here, and treat a passage of {P} through this house as a window worth planning for. Watch only for {shadow} if things go very smoothly."]),
 occ=dict(low="{P} also stands in this house at birth, so the thin support sits exactly where the planet lives: giving this area extra time and care tends to pay off.", mid="{P} also stands in this house at birth, so it works in its own seat with ordinary support.", high="{P} also stands in this house at birth, so the planet is well supplied in the very place it lives, which strengthens everything above."),
 lord=dict(low="{P} also rules this house, so its thin support here is felt in how the house is managed: structure and routine help.", mid="{P} also rules this house, which makes its balanced support here the baseline for the whole house.", high="{P} also rules this house, which means the support comes from the planet that is responsible for the house, a strong match."),
 sig=dict(low="The house as a whole holds {sav} points against an average of {avg}, so the other planets add little to make up for it; look to the lord and to Jupiter for help.", mid="The house as a whole holds {sav} points against an average of {avg}, so it is close to the middle for the chart.", high="The house as a whole holds {sav} points against an average of {avg}, so the other planets also support it; this is one of the better-supplied houses in the chart.", gap="Interesting contrast: this house holds {sav} points overall against an average of {avg}, so {P}'s share here is {cmp} what the other planets give."),
 sav=dict(
  top="{sav} points against an average of {avg}: one of the best-supplied houses in the chart. For {theme}, support comes from many planets at once, so it is a natural strength, and you may notice {sc} going well. Use it: this house is a reliable place to invest effort. Biggest contributors: {top}.",
  high="{sav} points against an average of {avg}: well supplied. For {theme}, the chart gives real support, and you may notice {sc} working out. Biggest contributors: {top}.",
  mid="{sav} points against an average of {avg}: close to ordinary. For {theme}, the result depends on the lord, the planets passing through and the running periods. Biggest contributors: {top}.",
  low="{sav} points against an average of {avg}: thinly supplied. For {theme}, more deliberate effort tends to be needed, and {fr} is the kind of thing you may notice. This is not a closed door: it often marks a house you build by effort, and it responds well to patience and to good transits. Biggest contributors: {top}.",
  bottom="{sav} points against an average of {avg}: the thinnest house in the chart. For {theme}, the chart gives the least ready support, so you may feel {fr}. Many people with a thin house here become skilled at it through practice and bring a lot of awareness to it. Biggest contributors: {top}."),
 bandHouse=dict(g='good houses (1, 4, 5, 7, 9, 10)', b='houses of strain or loss (6, 8, 12)'),
 )
HEAD = '''/* ============================================================================
   GENERATED by tools/reading_gen (edit the tables in tools/reading_gen/build_av.py, then run tools/reading_gen/regen.sh). Do not hand-edit this file.
   ASHTAKAVARGA READING (AVR): the bindu (point) tables read in full, layer schema v1.1. Tendencies, not predictions.
   AVR.assess(chart, {now}) -> { sav:{houses:[12 x {h,sign,points,tier,text,top}], axes, best, thin, text}, planets:[7 x {planet, total, sections:[{id,e,h,text}], houses:[12 x {h,sign,b,tier,text}], bars, words}], words }
   Reads chart.ashtakavarga (bavTables per planet per sign, sav per sign) with the natal houses, lords and occupants, plus where each planet transits today. Nothing is recalculated.
   ============================================================================ */
const AVR_DATA = '''
API = r'''

window.AVR = (function(D){
  'use strict';
  const SIGN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ordn = n => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
  const nm = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1), lc = s => s.charAt(0).toLowerCase() + s.slice(1);
  const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const pickN = (arr, k, seed) => { const a = arr.slice(), out = []; let h = hash(seed); while (out.length < k && a.length){ const i = h % a.length; out.push(a.splice(i, 1)[0]); h = (h * 31 + 17) >>> 0; } return out; };
  const fill = (s, m) => s.replace(/\{(\w+)\}/g, (x, k) => m[k] != null ? m[k] : x);
  const fix = t => t.replace(/\s+/g, ' ').trim().replace(/(^|[.!?]\s)([a-z])/g, (m, a, b) => a + b.toUpperCase());
  const tierB = b => b <= 2 ? 'low' : b <= 4 ? 'mid' : b === 5 ? 'high' : 'top';
  const pts = n => n + (n === 1 ? ' point' : ' points');
  const GOOD = [1, 4, 5, 7, 9, 10], BAD = [6, 8, 12], MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function transitNow(chart, now){
    const out = {}; try { const jd = toJulianDay(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()), asc = chart.ascendant.sign;
      D.order.forEach(n => { const s = getSignIndex(getSiderealLongitudeAt(n, jd)); out[n] = { sign: s, house: ((s - asc + 12) % 12) + 1 }; }); } catch (e) {}
    return out;
  }

  function planet(chart, n, ctx){
    const B = chart.ashtakavarga.bavTables[n], P = D.planets[n], pl = chart.planets[n], asc = chart.ascendant.sign, H1 = chart.vargas.D1.houses, SAV = chart.ashtakavarga.sav, avgSav = SAV.reduce((a, b) => a + b, 0) / 12;
    const total = B.reduce((a, b) => a + b, 0), avg = total / 12, hs = []; for (let h = 1; h <= 12; h++) hs.push({ h, sign: (asc + h - 1) % 12, b: B[(asc + h - 1) % 12] });
    const rank = {}; hs.slice().sort((a, b) => b.b - a.b || a.h - b.h).forEach((x, i) => rank[x.h] = i + 1);
    const sc = pickN(P.scenes, 3, n + 'av'), fr = pickN(P.fric, 3, n + 'av'), base = { P: n, core: P.core, gift: P.gift, shadow: P.shadow, s1: sc[0], s2: sc[1], s3: sc[2], f1: fr[0], f2: fr[1], f3: fr[2] };
    const sec = [], add = (id, e, h, t) => sec.push({ id, e, h, text: fix(t) });
    const best = hs.slice().sort((a, b) => b.b - a.b || a.h - b.h).slice(0, 3), thin = hs.slice().sort((a, b) => a.b - b.b || a.h - b.h).slice(0, 3);
    const goodSum = GOOD.reduce((a, h) => a + hs[h - 1].b, 0), badSum = BAD.reduce((a, h) => a + hs[h - 1].b, 0), goodShare = Math.round(100 * goodSum / total), badShare = Math.round(100 * badSum / total);
    const dist = hs.filter(x => x.b >= 5).length, thinN = hs.filter(x => x.b <= 2).length;
    const T = D.short, shape = dist >= 5 ? 'spread generously, with many strong houses' : thinN >= 4 ? 'concentrated in a few houses, with several thin ones' : 'spread in an ordinary way, with a few high points and a few low ones';
    add('overview', '🔢', `${n}'s points at a glance`, `Ashtakavarga gives ${n} a fixed budget of ${total} points (bindus) to spread across the twelve signs, at most 8 in any one sign (an even spread is ${avg.toFixed(1)} a sign). Your ${n} spends them like this: ${hs.map(x => `${ordn(x.h)} house ${x.b}`).join(', ')}. The shape is ${shape}. Because ${n} stands for ${P.core}, this table shows the houses where those themes find the most and the least support in your life.`);
    add('best', '🌟', `Where ${n} gives the most`, `${n}'s strongest houses are ${nm(best.map(x => `the ${ordn(x.h)} (${SIGN[x.sign]}, ${T[x.h - 1]}) with ${pts(x.b)}`))}. In these areas ${P.core} tend to be well supplied, and you may notice ${sc[0]} or ${sc[1]} going better than average. They are the houses to lean on: put important decisions about ${nm(best.map(x => T[x.h - 1]))} in front of the periods and transits of ${n}.`);
    add('thin', '🛠️', `Where ${n} gives the least`, `${n}'s thinnest houses are ${nm(thin.map(x => `the ${ordn(x.h)} (${SIGN[x.sign]}, ${T[x.h - 1]}) with ${pts(x.b)}`))}. In these areas ${P.core} reach with more difficulty, and you may notice ${fr[0]} or ${fr[1]}. That is not a closed door: it marks where effort, preparation and patience matter most, and where ${P.help.charAt(0).toLowerCase() + P.help.slice(1)} tends to help.`);
    add('balance', '⚖️', 'Where the points fall', `${goodShare}% of ${n}'s points (${goodSum} of ${total}) sit in the good houses (1, 4, 5, 7, 9, 10) and ${badShare}% (${badSum}) in the houses of strain or loss (6, 8, 12). ${goodShare >= 50 && badShare <= 20 ? `That is a favourable balance: ${n}'s themes tend to be directed towards the supportive parts of life, and its gifts (${P.gift}) tend to be easier to use.` : badShare >= 30 ? `A heavier share than usual falls in the houses of strain or loss, so ${n}'s energy tends to go into effort, service, hidden or private matters; the gift here is depth, and the thing to watch is ${P.shadow}.` : `That is a mixed balance: ${n} supports both the visible and the quieter parts of life, so its results depend on which house a period or transit is activating.`}`);
    const own = pl ? B[pl.sign] : null;
    if (pl && own != null) add('home', '📍', `Where ${n} stands in your chart`, `At birth ${n} stands in ${SIGN[pl.sign]}, your ${ordn(pl.house)} house (${T[pl.house - 1]}), where its own table gives ${own} of 8 points: ${D.word[own]}. ${own >= 5 ? `That is a good base: the planet is well supplied in the very place it lives, so ${P.core} tend to have solid footing there.` : own <= 2 ? `That is a thin base, so the planet works hard in the place it lives: ${P.core} in ${T[pl.house - 1]} benefit from patience, and its dasha periods are best met with preparation.` : `That is an ordinary base: the planet lives in a house where its support is balanced, so the running periods and aspects decide the details.`}`);
    const nowT = ctx.now[n];
    if (nowT){ const nb = B[nowT.sign]; add('now', '🛰️', `Where ${n} is passing today`, `Today ${n} is moving through ${SIGN[nowT.sign]}, your ${ordn(nowT.house)} house (${T[nowT.house - 1]}), where its table gives ${nb} of 8 points: ${D.word[nb]}. ${nb >= 5 ? `That tends to be a supportive passage for ${T[nowT.house - 1]}: a good period to act, ask or start on matters of ${T[nowT.house - 1]}.` : nb <= 2 ? `That tends to be a quieter passage for ${T[nowT.house - 1]}: a time for patience, preparation and keeping things simple.` : `That tends to be a mixed, ordinary passage for ${T[nowT.house - 1]}: steady progress is realistic.`} The passage lasts as long as ${n} stays in ${SIGN[nowT.sign]}.`); }
    add('use', '🧭', `How to use ${n}'s points`, `Two practical uses. First, transits: when ${n} passes through one of its strong houses (${nm(best.map(x => ordn(x.h)))}) the matters of that house tend to move more easily, and when it passes through a thin one (${nm(thin.map(x => ordn(x.h)))}) they tend to ask for care. Second, dasha periods: during a ${n} Mahadasha or Antardasha, the themes of the strong houses tend to be easier to develop, and the thin houses are where it helps to prepare. These are tendencies to plan with, not promises.`);
    // 12 houses
    const houses = hs.map(x => {
      const sign = SIGN[x.sign], lord = H1[x.h - 1].signLord, occ = pl && pl.house === x.h, tier = tierB(x.b), sav = SAV[x.sign], v = D.ph[tier], pick = v[hash(n + x.h) % v.length];
      const sentence = fill(pick, Object.assign({}, base, { b: x.b, sign, h: ordn(x.h), theme: T[x.h - 1], word: D.word[x.b], sav, avg: avgSav.toFixed(1) }));
      const ex = []; if (occ) ex.push(fill(D.occ[tier === 'low' ? 'low' : tier === 'mid' ? 'mid' : 'high'], base)); if (lord === n) ex.push(fill(D.lord[tier === 'low' ? 'low' : tier === 'mid' ? 'mid' : 'high'], base));
      ex.push(x.b >= avg + 1.5 ? `This is above ${n}'s own average of ${avg.toFixed(1)} a sign, ${rank[x.h] <= 2 ? 'and one of its two best houses' : 'a favourable house for it'}.` : x.b <= avg - 1.5 ? `This is below ${n}'s own average of ${avg.toFixed(1)} a sign${rank[x.h] >= 11 ? ', and one of its two thinnest houses' : ''}.` : `This is close to ${n}'s own average of ${avg.toFixed(1)} a sign.`);
      const savTier = sav >= avgSav + 3 ? 'high' : sav <= avgSav - 3 ? 'low' : 'mid';
      ex.push(savTier === 'mid' ? fill(D.sig.mid, { sav, avg: avgSav.toFixed(1) }) : (savTier === 'high' && x.b <= 2) || (savTier === 'low' && x.b >= 5) ? fill(D.sig.gap, { sav, avg: avgSav.toFixed(1), P: n, cmp: savTier === 'high' ? 'smaller than' : 'larger than' }) : fill(D.sig[savTier], { sav, avg: avgSav.toFixed(1) }));
      const tn = ctx.now[n]; if (tn && tn.house === x.h) ex.push(`Today ${n} is passing through this very house, so this support is active right now.`);
      return { h: x.h, sign, signIndex: x.sign, b: x.b, tier, emoji: D.emoji[x.b], rank: rank[x.h], text: fix(sentence + ' ' + ex.join(' ')) };
    });
    const words = sec.reduce((a, s) => a + s.text.split(/\s+/).length, 0) + houses.reduce((a, x) => a + x.text.split(/\s+/).length, 0);
    return { planet: n, total, avg, sections: sec, houses, best: best.map(x => x.h), thin: thin.map(x => x.h), goodShare, badShare, words };
  }

  function savReading(chart, ctx){
    const SAV = chart.ashtakavarga.sav, BAV = chart.ashtakavarga.bavTables, asc = chart.ascendant.sign, avg = SAV.reduce((a, b) => a + b, 0) / 12, T = D.short, H1 = chart.vargas.D1.houses, P = chart.planets;
    const hs = []; for (let h = 1; h <= 12; h++){ const s = (asc + h - 1) % 12, v = SAV[s]; hs.push({ h, s, v }); }
    const order = hs.slice().sort((a, b) => b.v - a.v || a.h - b.h), top = order[0].h, bottom = order[11].h;
    const houses = hs.map(x => {
      const tier = x.h === bottom ? 'bottom' : x.v >= avg + 4 || x.h === top ? 'top' : x.v >= avg + 1.5 ? 'high' : x.v <= avg - 3 ? 'low' : 'mid';
      const contrib = D.order.map(n => ({ n, b: BAV[n][x.s] })).sort((a, b) => b.b - a.b || D.order.indexOf(a.n) - D.order.indexOf(b.n)), topc = contrib.slice(0, 3).map(c => `${c.n} ${c.b}`).join(', '), lord = H1[x.h - 1].signLord, occ = Object.keys(P).filter(n => P[n].house === x.h);
      const frs = pickN(D.planets[contrib[contrib.length - 1].n].fric, 1, 'sav' + x.h)[0], scn = pickN(D.planets[contrib[0].n].scenes, 1, 'sav' + x.h)[0];
      const t = fill(D.sav[tier], { sav: x.v, avg: avg.toFixed(1), theme: T[x.h - 1], sc: scn, fr: frs, top: topc }) + ` The house is ruled by ${lord}; ${occ.length ? 'at birth ' + nm(occ) + (occ.length > 1 ? ' stand' : ' stands') + ' in it' : 'no planet stands in it at birth'}. The fullest contributor is ${contrib[0].n} (${contrib[0].b}) and the lightest is ${contrib[contrib.length - 1].n} (${contrib[contrib.length - 1].b}).`;
      return { h: x.h, sign: SIGN[x.s], points: x.v, tier, emoji: x.v >= avg + 4 ? '💎' : x.v >= avg + 1.5 ? '🟢' : x.v <= avg - 3 ? '🔴' : x.v < avg - 0.5 ? '🟠' : '🟡', theme: T[x.h - 1], text: fix(t), top: contrib.slice(0, 3).map(c => c.n) };
    });
    const ax = (a, b, name, what) => { const v = hs[a - 1].v + hs[b - 1].v; return { name, houses: [a, b], points: v, diff: +(v - 2 * avg).toFixed(1), text: fix(`${name} (the ${ordn(a)} and ${ordn(b)} houses: ${T[a - 1]} plus ${T[b - 1]}) hold ${v} points together against ${(2 * avg).toFixed(1)} for an even pair. ${v >= 2 * avg + 4 ? `That is a strong pair: ${what} tends to be one of the better-supported strands of your chart.` : v <= 2 * avg - 4 ? `That is a thin pair: ${what} tends to ask for more deliberate effort.` : `That is close to even: ${what} depends on the running periods and transits more than on the table.`}`) }; };
    const axes = [ax(2, 11, 'The money axis', 'earning and gaining'), ax(6, 10, 'The work axis', 'daily work and career'), ax(5, 7, 'The love axis', 'romance and partnership'), ax(4, 12, 'The home and rest axis', 'home, comfort and rest'), ax(3, 9, 'The effort and fortune axis', 'effort turning into luck'), ax(1, 7, 'The self and other axis', 'you and your closest relationships')];
    const left = hs.filter(x => x.h >= 1 && x.h <= 6).reduce((a, x) => a + x.v, 0), right = 337 - 0; const goodSum = GOOD.reduce((a, h) => a + hs[h - 1].v, 0), badSum = BAD.reduce((a, h) => a + hs[h - 1].v, 0);
    const text = fix(`The combined table (Sarvashtakavarga) adds the points of all seven planets in each sign, ${SAV.reduce((a, b) => a + b, 0)} in all, an average of ${avg.toFixed(1)} a house. Your best-supplied house is the ${ordn(top)} (${T[top - 1]}, ${hs[top - 1].v} points) and the thinnest is the ${ordn(bottom)} (${T[bottom - 1]}, ${hs[bottom - 1].v} points). The good houses (1, 4, 5, 7, 9, 10) hold ${goodSum} points and the houses of strain or loss (6, 8, 12) hold ${badSum}${badSum < 3 * avg ? ', which is lighter than an even share: a classical sign that strain and loss tend to be limited' : badSum > 3 * avg + 4 ? ', which is heavier than an even share, so the quieter, effort-based parts of life carry extra weight' : ', close to an even share'}.`);
    return { houses, axes, best: top, thin: bottom, avg, text, ranked: order.map(x => x.h) };
  }

  function assess(chart, opts){
    if (!chart.ashtakavarga || !chart.ashtakavarga.bavTables) return null;
    const now = (opts && opts.now) || new Date(), ctx = { now: transitNow(chart, now) };
    const sav = savReading(chart, ctx), planets = D.order.filter(n => chart.ashtakavarga.bavTables[n]).map(n => planet(chart, n, ctx));
    const words = planets.reduce((a, x) => a + x.words, 0) + sav.houses.reduce((a, x) => a + x.text.split(/\s+/).length, 0) + sav.axes.reduce((a, x) => a + x.text.split(/\s+/).length, 0) + sav.text.split(/\s+/).length;
    return { sav, planets, words, now: ctx.now };
  }
  return { data: D, assess };
})(AVR_DATA);
'''
out = HEAD + json.dumps(DATA, ensure_ascii=False, indent=1) + ';' + API
open(os.path.join(REPO, 'apps/birth-chart/js/107-ashtakavarga-reading.js'), 'w', encoding='utf-8').write(out)
print('written KB:', len(out.encode()) // 1024)

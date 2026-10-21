import os, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
TMPJSON = os.path.join(tempfile.gettempdir(), 'vdb_data.json')
sys.path.insert(0, HERE)
import json
PLANET = {
 'Sun':    dict(theme="identity, standing and what you stand for", feelsLike="a push to step forward and be counted", lens="recognition and purpose", helps=["Take on visible responsibility you can stand behind.","Look after your health and energy first."], watch=["clashes with authority figures or your own pride","burning out while chasing recognition"]),
 'Moon':   dict(theme="home, feelings and the people who nourish you", feelsLike="tides of feeling and a stronger need for comfort and belonging", lens="feelings and security", helps=["Keep a steady routine and a place that feels safe.","Spend time with people who feel like family."], watch=["mood swings and over-sensitivity","leaning too heavily on others for reassurance"]),
 'Mars':   dict(theme="action, courage and getting things built or defended", feelsLike="a surge of energy and a shorter fuse", lens="drive and courage", helps=["Give your energy a physical outlet every day.","Take on a clear challenge instead of letting tension build."], watch=["impulsive decisions and arguments","mistakes from rushing"]),
 'Rahu':   dict(theme="ambition, the unfamiliar and reaching beyond your usual world", feelsLike="a hunger for more and an itch to try something new", lens="ambition and the unfamiliar", helps=["Learn from people outside your usual circle.","Check each big move against your values."], watch=["obsession and restlessness","shortcuts that cost you later"]),
 'Jupiter':dict(theme="growth, learning, guidance and widening your horizons", feelsLike="a sense of opening, with more room for hope", lens="growth and guidance", helps=["Study or teach something you care about.","Back your optimism with a concrete plan."], watch=["overcommitting or overspending","drifting because everything feels possible"]),
 'Saturn': dict(theme="responsibility, structure and slow, earned progress", feelsLike="more weight on your shoulders, and steady results for steady effort", lens="responsibility and structure", helps=["Build one dependable routine and keep it.","Plan in steps and include real rest."], watch=["self-doubt and being too hard on yourself","isolation from carrying everything alone"]),
 'Mercury':dict(theme="learning, communication, trade and skills", feelsLike="a busier mind with more conversations, plans and options", lens="learning and communication", helps=["Learn a skill or start a project you can finish.","Write down plans and decisions."], watch=["overthinking and scattered attention","too many commitments at once"]),
 'Ketu':   dict(theme="letting go, inner search and simplifying", feelsLike="a loosening of old interests and a pull inward", lens="release and inner search", helps=["Simplify what no longer fits.","Make room for quiet, study or practice."], watch=["withdrawing from people and plans","sudden endings you did not plan"]),
 'Venus':  dict(theme="love, comfort, creativity and values", feelsLike="a stronger pull toward closeness, beauty and enjoyment", lens="love and comfort", helps=["Invest in relationships and creative work.","Choose quality and keep your boundaries."], watch=["overindulgence or overspending","people-pleasing in relationships"]),
}
HOUSEREL = {1:("the two sit in the same house, so their themes are tightly fused",.25),2:("the sub-period lord is the 2nd from the main lord, a quiet supportive neighbour",.25),
 3:("the sub-period lord is the 3rd from the main lord, a cooperative, effort-driven link",.25),4:("the sub-period lord is the 4th from the main lord, an active and visible angle",.25),
 5:("the sub-period lord is the 5th from the main lord, a supportive trine",.5),6:("the sub-period lord is the 6th from the main lord, which brings friction and adjustments",-.5),
 7:("the sub-period lord is opposite the main lord, so the themes pull against each other or balance each other",0),8:("the sub-period lord is the 8th from the main lord, which brings intensity and delays",-.5),
 9:("the sub-period lord is the 9th from the main lord, a supportive trine",.5),10:("the sub-period lord is the 10th from the main lord, an active and visible angle",.25),
 11:("the sub-period lord is the 11th from the main lord, a link that tends to pay off",.25),12:("the sub-period lord is the 12th from the main lord, which can feel slightly draining",-.25)}
DATA = dict(schema='layer-v1.1', planet=PLANET, houseRel={k: dict(text=v[0], delta=v[1]) for k, v in HOUSEREL.items()},
  intro="Each stage of life is ruled by a planet. Past stages are a chance to check the reading against your own history; the current and coming ones show the themes to expect. These are tendencies, not events: what you do with a stage matters more than the label.")
assert len(PLANET) == 9 and len(HOUSEREL) == 12
HEAD = '''/* ============================================================================
   GENERATED by tools/reading_gen (edit the tables there, then run tools/reading_gen/regen.sh). Do not hand-edit this file.
   DASHA LAYER (VDA): what each Mahadasha / Antardasha tends to feel like in real life. Layer schema v1.1 (second person, concrete, self-check).
   Reuses the earlier layers; only a small hand-written table per planet lives here (theme, how it feels, helps, watch, lens).
     period   = the planet's theme + where it sits (arena theme from VMF) + the houses it rules + 2 real-life lines (VMF) + helps / watch + a self-check question
     ease     = functional nature for the rising sign (VDB) + dignity + house group  ->  tone supportive / mixed / challenging (rule of thumb, shown with its reasons)
     pair     = main lord x sub lord: natural relation + where the sub lord sits counted from the main lord (same house, trine, 6/8 ...)
   VDA.timeline(chart, now?)      every Mahadasha of the life with dates, ages, tone, text and a past/now/ahead marker
   VDA.antardashas(chart, i)      the 9 sub-periods of Mahadasha i          VDA.upcoming(chart, years, now?)   sub-periods in the next N years
   VDA.current(chart, now?)       running Mahadasha + Antardasha            VDA.pair(md, ad)                  chart-free blend of any two lords (81 pairs)
   Dates and lords come from the app's own dasha engine (chart.dashaData, calculateAntardashas, findActiveDasha); nothing is recomputed here.
   Needs js/87 (VDB), js/90 (VMF). Wording: tendencies, never fixed events.
   ============================================================================ */
const VDA_DATA = '''
API = r'''

window.VDA = (function(D){
  'use strict';
  if (typeof VDB === 'undefined' || typeof VMF === 'undefined' || !VMF) return null;
  const PL = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  const SIGN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const ordn = n => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
  const lc = s => s.charAt(0).toLowerCase() + s.slice(1);
  const fmt = d => MON[d.getMonth()] + ' ' + d.getFullYear();
  const YEAR = 365.2425 * 864e5;
  const KIND = { 'Yogakaraka': 1.5, 'Functional benefic': 1, 'Mixed / neutral': 0, 'Functional malefic': -0.5 };
  const toneOf = e => e >= 1 ? 'supportive' : e <= -0.25 ? 'challenging' : 'mixed';
  const HG = { 1: .25, 3: .25, 4: .25, 5: .25, 7: .25, 9: .25, 10: .25, 11: .25, 6: -.25, 8: -.25, 12: -.25 };
  const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const relOf = (a, b) => a === b ? 'own' : VDB.data.planets[a].relations.friends.includes(b) ? 'friend' : VDB.data.planets[a].relations.enemies.includes(b) ? 'enemy' : 'neutral';
  const RD = { own: .25, friend: .25, neutral: 0, enemy: -.25 };

  // chart-free blend of any two lords (81 pairs)
  function pair(md, ad){
    const M = D.planet[md], A = D.planet[ad]; if (!M || !A) return null;
    const rel = relOf(md, ad);
    const relText = { own: `${ad} is the same planet as the main lord, so this is a concentrated stretch of ${md}'s themes.`, friend: `${ad} is a natural friend of ${md}, so the two cooperate.`,
      enemy: `${ad} is a natural enemy of ${md}, so the two can feel like friction.`, neutral: `${ad} is neutral to ${md}, so the result depends on where each sits in the chart.` }[rel];
    return { relation: rel, text: `Inside the ${md} period, the ${ad} sub-period brings ${A.lens} into the foreground of ${M.lens}. ${relText}` };
  }
  // ease of one planet for this chart, with the reasons shown to the reader
  function planetEase(chart, n){
    const P = chart.planets[n]; if (!P) return { ease: 0, why: [] };
    const asc = chart.ascendant.sign, F = VDB.functionalNature(asc), why = []; let e = 0;
    const via = (n === 'Rahu' || n === 'Ketu') ? VDB.data.signs[P.sign].lord : n, k = F[via];
    if (k){ e += KIND[k.kind]; why.push(via === n ? `${n} is a ${k.kind.toLowerCase()} for ${SIGN[asc]} rising` : `${n} acts through ${via}, a ${k.kind.toLowerCase()} for ${SIGN[asc]} rising`); }
    const dg = (P.dignity && P.dignity.status) || '';
    if (/exalted|own/i.test(dg)){ e += .5; why.push('it is strong in ' + (/own/i.test(dg) ? 'its own sign' : 'its exalted sign')); } else if (/debilitated/i.test(dg)){ e -= .5; why.push('it sits in a weaker sign'); }
    if (HG[P.house]){ e += HG[P.house]; why.push(`it is placed in the ${ordn(P.house)} house`); }
    return { ease: Math.round(e * 100) / 100, why };
  }
  const ruled = (chart, n) => { const o = [], asc = chart.ascendant.sign; for (let h = 1; h <= 12; h++) if (VDB.data.signs[(asc + h - 1) % 12].lord === n) o.push(h); return o; };

  function period(chart, i, now){
    const M = chart.dashaData.mahadashas, md = M[i]; if (!md) return null;
    const n = md.lord, P = chart.planets[n], F = D.planet[n], birth = M[0].startDate, pe = planetEase(chart, n);
    const vm = VMF.placement(n, P.house, P.sign, P.dignity && P.dignity.status), rl = ruled(chart, n);
    const ageStart = Math.max(0, Math.round((md.startDate - birth) / YEAR)), ageEnd = Math.round((md.endDate - birth) / YEAR);
    const arenaText = `${n} sits in the ${ordn(P.house)} house in ${SIGN[P.sign]}, so attention gathers around ${vm.theme}.` +
      (rl.length ? ` It also rules the ${list(rl.map(ordn))} house${rl.length > 1 ? 's' : ''}, which brings in ${list(rl.map(h => VMF.data.arena[h - 1].theme))}.` : ' Rahu and Ketu rule no house; they work through the sign they sit in.');
    const scenes = vm.practice.slice(0, 2).map(x => x.line);
    const status = md.endDate < now ? 'past' : md.startDate <= now ? 'now' : 'ahead';
    const line = `${lc(vm.practice[0].scene)}, you tend to ${vm.practice[0].does}`;
    const y1 = md.startDate.getFullYear(), y2 = md.endDate.getFullYear();
    const reflect = status === 'past' ? `Think back to ${y1}-${y2}: does this fit that stage of your life: ${line}?` : status === 'now' ? `Over the last few years, have you noticed that ${line}?` : `When this stage arrives, watch whether ${line}.`;
    const tone = toneOf(pe.ease);
    const text = `${n} Mahadasha, ${fmt(md.startDate)} to ${fmt(md.endDate)} (age ${ageStart} to ${ageEnd}). This stage of life tends to be about ${F.theme}. It often feels like ${F.feelsLike}. ${arenaText} In practice: ${scenes.join(' ')} Helps: ${F.helps.join(' ')} Watch for: ${list(F.watch)}. Tone: ${tone} (${pe.why.join('; ')}).`;
    return { index: i, lord: n, start: md.startDate, end: md.endDate, startYear: y1, endYear: y2, years: md.years, ageStart, ageEnd, house: P.house, sign: SIGN[P.sign], ruled: rl, status,
      theme: F.theme, feelsLike: F.feelsLike, arenaText, scenes, helps: F.helps, watch: F.watch, ease: pe.ease, tone, why: pe.why, reflect, text };
  }
  function timeline(chart, now){
    now = now || new Date(); const M = chart.dashaData.mahadashas, periods = M.map((m, i) => period(chart, i, now));
    return { birth: M[0].startDate, periods, currentIndex: periods.findIndex(p => p.status === 'now') };
  }
  function row(chart, md, ad, now){
    const pr = pair(md.lord, ad.lord), pm = chart.planets[md.lord], pa = chart.planets[ad.lord];
    const d = ((pa.house - pm.house + 12) % 12) + 1, hr = D.houseRel[d];
    const me = planetEase(chart, md.lord).ease, ae = planetEase(chart, ad.lord).ease;
    const ease = Math.round(((me + ae) / 2 + RD[pr.relation] + hr.delta) * 100) / 100;
    const vm = VMF.placement(ad.lord, pa.house, pa.sign, pa.dignity && pa.dignity.status);
    return { mdLord: md.lord, lord: ad.lord, start: ad.startDate, end: ad.endDate, years: ad.years, status: ad.endDate < now ? 'past' : ad.startDate <= now ? 'now' : 'ahead', relation: pr.relation,
      houseFromMain: d, houseNote: `Counting from ${md.lord}, ${ad.lord} sits ${ordn(d)}: ${hr.text}.`, blend: pr.text, scene: vm.practice[0].line, ease, tone: toneOf(ease) };
  }
  function antardashas(chart, i, now){
    now = now || new Date(); const md = chart.dashaData.mahadashas[i]; if (!md) return [];
    return calculateAntardashas(md).map(ad => row(chart, md, ad, now));
  }
  function upcoming(chart, years, now){
    now = now || new Date(); const end = new Date(now.getTime() + (years || 5) * YEAR), out = [];
    chart.dashaData.mahadashas.forEach((md, i) => { if (md.endDate < now || md.startDate > end) return;
      antardashas(chart, i, now).forEach(r => { if (r.end >= now && r.start <= end) out.push(r); }); });
    return out;
  }
  function current(chart, now){
    now = now || new Date(); const act = findActiveDasha(chart.dashaData.mahadashas, now); if (!act || !act.mahadasha) return null;
    const i = chart.dashaData.mahadashas.findIndex(m => m.lord === act.mahadasha.lord && m.startDate.getTime() === act.mahadasha.startDate.getTime());
    const pd = period(chart, i, now), ads = antardashas(chart, i, now), ad = ads.find(r => r.status === 'now') || null;
    return { md: pd, ad, antardashas: ads };
  }
  return { data: D, pair, planetEase, period, timeline, antardashas, upcoming, current, fmt };
})(VDA_DATA);
'''
out = HEAD + json.dumps(DATA, ensure_ascii=False, indent=1) + ';' + API
open(os.path.join(REPO, 'apps/birth-chart/js/91-dasha-reading.js'), 'w', encoding='utf-8').write(out)
print('written KB:', len(out.encode()) // 1024)

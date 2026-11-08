/* Sensitive Degrees (js/137): Gandanta, Mrityu Bhaga, Pushkara Navamsa and Pushkara Bhaga for every planet and the Lagna.
   TABLES COME FROM PUBLISHED SOURCES, NOT FROM MEMORY. Where sources differ the page says so.
   Mrityu Bhaga: degree N means the Nth degree = (N-1) to N. Table = Jataka Parijata 1.57 as printed at saptarishisshop.com/mrithyu-bhaga-and-bcp-by-hemant-bhatt, cross-checked row by row
   against astrogurukul.com/web/important-tables-in-transit-of-planets and jyotishandmedicalastrology.blogspot.com (Kausika Hora table): Sun, Mars, Mercury, Jupiter, Venus, Saturn and Rahu agree in at
   least two of the three sources in every cell (single-cell typos in the third were outvoted). The MOON has two traditions (Jataka Parijata / Sarvartha Chintamani, and Phaladeepika / Brihat Prajapatya): both are kept.
   LAGNA: the Jataka Parijata row (1,9,22,22,25,2,4,23,18,20,24,10) agrees with the Kausika table except Gemini (22 here, 21 there; astrogurukul also says 22); astrogurukul's list differs for Aries, Virgo and Aquarius, so the Lagna row is flagged as less settled.
   Ketu and Gulika appear in one source only and are left out.
   Pushkara Navamsa: agrees in aaps.space/docs/navamsa/pushkara-navamsa and gkayapilla.blogspot.com (by element; the second prints 26 where the first has 26d40, taken as 26d40).
   Pushkara Bhaga: TWO sets, both shown: Jataka Parijata 1.58 (per sign) and C.S. Patel (per element: fire 21, earth 14, air 24, water 7). Flagged when within 1 degree.
   Gandanta: the junction of Cancer-Leo, Scorpio-Sagittarius, Pisces-Aries. Broad window = last / first 3d20 (jagannathhora.com; the 3D app uses the same), narrow core = 0d48 either side (moondanceastrology.substack.com). Both are shown.
   Nothing here predicts anything; teachers soften these flags when the planet is strong. Uses SIGNS, getSignIndex, getDegInSign (js/05). Classes sdg- prefixed. */
const SDG = (() => {
  const SIGN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  /* Mrityu Bhaga degree per sign (index 0 = Aries). */
  const MB = {
    Sun: [20, 9, 12, 6, 8, 24, 16, 17, 22, 2, 3, 23],
    Mars: [19, 28, 25, 23, 29, 28, 14, 21, 2, 15, 11, 6],
    Mercury: [15, 14, 13, 12, 8, 18, 20, 10, 21, 22, 7, 5],
    Jupiter: [19, 29, 12, 27, 6, 4, 13, 10, 17, 11, 15, 28],
    Venus: [28, 15, 11, 17, 10, 13, 4, 6, 27, 12, 29, 19],
    Saturn: [10, 4, 7, 9, 12, 16, 3, 18, 28, 14, 13, 15],
    Rahu: [14, 13, 12, 11, 24, 23, 22, 21, 10, 20, 18, 8],
    Lagna: [1, 9, 22, 22, 25, 2, 4, 23, 18, 20, 24, 10]
  };
  const MOON = {
    JP: { label: 'Jataka Parijata', d: [8, 25, 22, 22, 21, 1, 4, 23, 18, 20, 20, 10] },
    PH: { label: 'Phaladeepika', d: [26, 12, 13, 25, 24, 11, 26, 14, 13, 25, 5, 12] }
  };
  const ELEM = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3]; /* 0 fire, 1 earth, 2 air, 3 water */
  const T = 10 / 3;
  const PNAV = [
    [[20, 20 + T], [80 / 3, 30]],
    [[20 / 3, 10], [40 / 3, 50 / 3]],
    [[50 / 3, 20], [70 / 3, 80 / 3]],
    [[0, T], [20 / 3, 10]]
  ];
  const PBJP = [21, 14, 18, 8, 19, 9, 24, 11, 23, 14, 19, 9];
  const PBCP = [21, 14, 24, 7]; /* by element */
  const POINTS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu', 'Lagna'];

  function mbDegrees(name, sign) {
    if (name === 'Moon') return [MOON.JP.d[sign], MOON.PH.d[sign]].filter((v, i, a) => a.indexOf(v) === i);
    return MB[name] ? [MB[name][sign]] : [];
  }
  function check(name, lon) {
    const sign = getSignIndex(lon), deg = getDegInSign(lon), r = { name, sign, signName: SIGN[sign], deg, flags: [] };
    /* Gandanta */
    const edge = [3, 7, 11].includes(sign) ? 30 - deg : [0, 4, 8].includes(sign) ? deg : null;
    if (edge !== null && edge < T) { const junction = ['Pisces', 'Aries'].includes(SIGN[sign]) ? 'Pisces / Aries' : sign === 3 || sign === 4 ? 'Cancer / Leo' : 'Scorpio / Sagittarius'; r.flags.push({ k: 'gand', title: 'Gandanta', tone: 'warn', core: edge < 0.8, text: `${(edge).toFixed(2)}° from the ${junction} junction` + (edge < 0.8 ? ' (inside the narrow core of 0°48′)' : '') }); }
    /* Mrityu Bhaga */
    const hit = mbDegrees(name, sign).filter(N => deg >= N - 1 && deg < N);
    if (hit.length) { const sc = name === 'Moon' ? [MOON.JP.d[sign] === hit[0] ? MOON.JP.label : null, MOON.PH.d[sign] === hit[0] ? MOON.PH.label : null].filter(Boolean).join(' and ') : ''; r.flags.push({ k: 'mb', title: 'Mrityu Bhaga', tone: 'bad', text: `in the ${hit[0]}th degree of ${SIGN[sign]}` + (sc ? ` (${sc})` : '') }); }
    /* Pushkara Navamsa */
    { const inN = PNAV[ELEM[sign]].some(([a, b]) => deg >= a && deg < b); if (inN) r.flags.push({ k: 'pn', title: 'Pushkara Navamsa', tone: 'good', text: 'in a nourishing navamsa of ' + SIGN[sign] }); }
    /* Pushkara Bhaga (either set, within 1 degree) */
    const pj = PBJP[sign], pc = PBCP[ELEM[sign]], dj = Math.abs(deg - pj), dc = Math.abs(deg - pc), near = [];
    if (dj < 1) near.push(`${pj}° (Jataka Parijata)`); if (dc < 1 && !(pc === pj && near.length)) near.push(`${pc}° (C.S. Patel)`);
    if (near.length) r.flags.push({ k: 'pb', title: 'Pushkara Bhaga', tone: 'good', text: 'within 1° of ' + near.join(' and ') });
    return r;
  }
  function compute(chart) {
    return POINTS.map(n => check(n, n === 'Lagna' ? chart.ascendant.longitude : n === 'Ketu' ? chart.planets.Ketu.longitude : chart.planets[n].longitude));
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const dm = d => { const t = Math.round(d * 60); return `${Math.floor(t / 60)}°${String(t % 60).padStart(2, '0')}′`; };
  function html(chart, profile) {
    const R = compute(chart), nf = R.reduce((a, r) => a + r.flags.length, 0), hit = R.filter(r => r.flags.length);
    const MEAN = { gand: 'A sensitive knot where a water sign meets a fire sign. Tends to ask for patience with that planet\'s matters.', mb: 'A degree that many teachers read as delicate for that planet. Strength and aspects tend to soften it.', pn: 'A nourishing part of the sign. It tends to support the planet.', pb: 'Close to a point teachers call nourishing, though schools list different degrees.' };
    const cards = R.map(r => `<article class="sdg-card${r.flags.length ? ' on' : ''}"><header><h4>${r.name}</h4><span class="sdg-pos">${esc(r.signName)} ${dm(r.deg)}</span></header>
      ${r.flags.length ? r.flags.map(f => `<div class="sdg-flag ${f.tone}"><span class="sdg-chip ${f.tone}">${f.title}</span><span class="sdg-t">${esc(f.text)}<em>${esc(MEAN[f.k])}</em></span></div>`).join('') : '<div class="sdg-clear">Nothing flagged</div>'}</article>`).join('');
    return `<div class="sdg"><div class="sdg-hero"><h3>Sensitive Degrees</h3><p>Some degrees are read with extra care (<b>Gandanta, Mrityu Bhaga</b>) and some are called nourishing (<b>Pushkara</b>). ${nf ? `In your chart <b>${hit.length}</b> of ${R.length} points carry a mark.` : 'None of your points carries a mark, a perfectly calm result.'}</p></div>
      <div class="sdg-cards">${cards}</div>
      <details class="sdg-note"><summary>Where these come from</summary>
        <p><b>Gandanta</b> is the junction of Cancer and Leo, Scorpio and Sagittarius, Pisces and Aries. The common window is the last or first 3°20′ of the sign; a narrow core of 0°48′ is also shown.</p>
        <p><b>Mrityu Bhaga</b> uses the table of Jataka Parijata (chapter 1, verse 57), checked cell by cell against two other published tables. The Nth degree means N−1 to N. The Moon has two traditions (Jataka Parijata, and Phaladeepika) and both are checked. The Lagna row is less settled between sources.</p>
        <p><b>Pushkara Navamsa</b> is two navamsas in each sign by element. <b>Pushkara Bhaga</b> is a single degree, and two sets exist (Jataka Parijata by sign, and C.S. Patel by element); a point within 1° of either is shown.</p>
        <p>These are traditional marks, not predictions. Teachers soften them when the planet is strong, and they are one clue next to the sign, house and Dasha. Ketu and Gulika are not checked for Mrityu Bhaga because only one source lists them.</p></details></div>`;
  }
  function text(chart) { return compute(chart).map(r => `${r.name}: ${r.signName} ${dm(r.deg)}${r.flags.length ? ' - ' + r.flags.map(f => f.title).join(', ') : ''}`).join('\n'); }
  window.buildSensitiveDegreesPanel = function (chart, profile) { return html(chart, profile || {}); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-sensitive', window.buildSensitiveDegreesPanel);
  return { compute, check, html, text, MB, MOON, PNAV, PBJP, PBCP, POINTS, mbDegrees };
})();

/* Sudarshana Chakra (js/138): three rings of 12 houses counted from the Lagna (inner), the Moon (middle) and the Sun (outer), with the planets in each,
   and the house each ring points to in a chosen year of life.
   Sources: BPHS ch.74 (enjoylearningsanskrit.com/scriptures/parashara/chapter-74: three circles, inner Lagna, middle Moon, outer Sun; a house prospers with its lord and benefics and declines with malefics),
   sushmajee.com/astrology/dashaa/dashaa-sudarshan.htm and vedic-astrology-wiki.blogspot.com (one house per year, 12-year cycle), panchangbodh.com/sudarshana-chakra-calculator (house 1 = years 1, 13, 25...).
   Year of life = completed years + 1: the first year (birth to first birthday) is the 1st house, the 13th year the 1st again. The texts do not state this anchor in words (BPHS ch.74 does not); the calculator page does by example. Months/days are not shown (sources do not agree on the start).
   Nature of a planet in the tally: natural malefics Sun, Mars, Saturn, Rahu, Ketu; natural benefics Jupiter, Venus, Mercury, Moon; a malefic Mars or Saturn in its own or exaltation sign counts as benefic and a benefic in its debilitation or an enemy sign counts as adverse (BPHS ch.74 and the wiki page). The BPHS "Sun is good in the 1st house" line is not applied.
   Applies as a view only: if Lagna, Moon and Sun fall in the same house of the chart the texts say to read from the Lagna alone; the page says so.
   FACTS ONLY otherwise: no scoring beyond counting benefic and malefic influences. Tendencies, not events. Classes sdc- prefixed; fills via inline style (class rules beat fill attributes). */
const SDC = (() => {
  const GR = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const MALEFIC = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];
  const REFS = [['Lagna', 'inner ring: the body and the chart as a whole'], ['Moon', 'middle ring: the mind'], ['Sun', 'outer ring: the self']];
  const houseFrom = (refSign, sign) => ((sign - refSign + 12) % 12) + 1;
  const yearHouse = y => ((y - 1) % 12 + 12) % 12 + 1;
  function nature(chart, name) {
    const st = chart.planets[name].dignity.status;
    if (MALEFIC.includes(name)) return ((name === 'Mars' || name === 'Saturn') && (st === 'Exalted' || st === 'OwnSign' || st === 'Moolatrikona')) ? 'good' : 'bad';
    return (st === 'Debilitated' || st === 'Enemy') ? 'bad' : 'good';
  }
  function ringData(chart, ref, hse) {
    const rs = ref === 'Lagna' ? chart.ascendant.sign : chart.planets[ref].sign;
    const inHouse = {}; for (let h = 1; h <= 12; h++) inHouse[h] = [];
    GR.forEach(n => inHouse[houseFrom(rs, chart.planets[n].sign)].push(n));
    const sign = (rs + hse - 1) % 12, lord = SIGNS[sign].lord, lordHouse = houseFrom(rs, chart.planets[lord].sign);
    const planets = inHouse[hse].map(n => ({ name: n, tone: nature(chart, n) }));
    const good = planets.filter(p => p.tone === 'good').length, bad = planets.length - good;
    const lean = !planets.length ? 'empty' : good > bad ? 'benefic' : bad > good ? 'malefic' : 'mixed';
    return { ref, refSign: rs, houseSigns: Array.from({ length: 12 }, (_, i) => (rs + i) % 12), inHouse, house: hse, sign, signName: SIGNS[sign].name, lord, lordHouse, planets, good, bad, lean };
  }
  function currentYear(chart, nowJD) {
    const now = nowJD !== undefined ? nowJD : Date.now() / 86400000 + 2440587.5;
    return Math.max(1, Math.floor((now - chart.julianDay) / 365.2425) + 1);
  }
  function compute(chart, year) {
    year = year || currentYear(chart);
    const hse = yearHouse(year), rings = REFS.map(r => ringData(chart, r[0], hse));
    const same = chart.planets.Moon.sign === chart.ascendant.sign || chart.planets.Sun.sign === chart.ascendant.sign || chart.planets.Sun.sign === chart.planets.Moon.sign;
    const leans = rings.map(r => r.lean), agree = leans.every(l => l === leans[0] && l !== 'empty');
    return { year, house: hse, rings, sameHouseNote: same, agree, lean: leans };
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const G = n => (typeof PLANET_GLYPHS !== 'undefined' && PLANET_GLYPHS[n]) || n.slice(0, 2);
  function svg(D) {
    const cx = 180, cy = 180, band = [[46, 86], [88, 128], [130, 170]], pt = (r, a) => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
    const ang = h => Math.PI / 2 + (h - 1) * Math.PI / 6; /* house 1 starts at the top and runs anticlockwise */
    let o = `<svg class="sdc-svg" viewBox="0 0 360 360" role="img" aria-label="Sudarshana Chakra, year ${D.year}"><defs><linearGradient id="sdcGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1cf7d"/><stop offset="1" stop-color="#b98a2c"/></linearGradient></defs>`;
    D.rings.forEach((R, ri) => {
      const [r0, r1] = band[ri];
      for (let h = 1; h <= 12; h++) {
        const a0 = ang(h), a1 = a0 + Math.PI / 6, p = [pt(r1, a0), pt(r1, a1), pt(r0, a1), pt(r0, a0)];
        const on = h === D.house;
        o += `<path d="M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}A${r1} ${r1} 0 0 0 ${p[1][0].toFixed(1)} ${p[1][1].toFixed(1)}L${p[2][0].toFixed(1)} ${p[2][1].toFixed(1)}A${r0} ${r0} 0 0 1 ${p[3][0].toFixed(1)} ${p[3][1].toFixed(1)}Z" class="sdc-cell${on ? ' on' : ''}" ${on ? 'style="fill:url(#sdcGold)"' : ''}/>`;
        const am = a0 + Math.PI / 12, rm = (r0 + r1) / 2, np = R.inHouse[h].length;
        const hn = pt(r0 + 7, am); o += `<text x="${hn[0].toFixed(1)}" y="${(hn[1] + 3).toFixed(1)}" class="sdc-hn${on ? ' on' : ''}" text-anchor="middle">${h}</text>`;
        R.inHouse[h].forEach((n, k) => {
          const rows = np > 3 ? 2 : 1, row = rows === 2 ? k % 2 : 0, col = rows === 2 ? Math.floor(k / 2) : k, inRow = rows === 2 ? Math.ceil((np - row) / 2) : np;
          const rr = rm + (rows === 2 ? (row ? 8 : -2) : 4) + 3, da = (col - (inRow - 1) / 2) * (ri === 0 ? 0.2 : ri === 1 ? 0.14 : 0.11), q = pt(rr, am + da * (ri === 0 ? 1 : 1.0));
          o += `<text x="${q[0].toFixed(1)}" y="${(q[1] + 4).toFixed(1)}" class="sdc-pl${on ? ' on' : ''}" text-anchor="middle">${G(n)}</text>`;
        });
      }
    });
    o += `<circle cx="180" cy="180" r="42" class="sdc-core"/><text x="180" y="176" text-anchor="middle" class="sdc-cy">Year</text><text x="180" y="198" text-anchor="middle" class="sdc-cn">${D.year}</text></svg>`;
    return o;
  }
  const LEAN = { benefic: 'leans benefic', malefic: 'leans malefic', mixed: 'mixed', empty: 'no planets here' };
  function body(chart, year) {
    const D = compute(chart, year);
    return `${svg(D)}
      <div class="sdc-sum"><b>Year ${D.year}</b> of life points to the <b>${D.house}${['st', 'nd', 'rd'][D.house - 1] || 'th'} house</b> in each ring. ${D.agree ? 'All three rings lean the same way here, so the view tends to be firm.' : 'The rings do not all lean the same way, so read it as mixed.'}</div>
      <div class="sdc-rows">${D.rings.map((R, i) => `<div class="sdc-r"><div class="sdc-rh"><span class="sdc-rn">${REFS[i][0]}</span><span class="sdc-lean ${R.lean}">${LEAN[R.lean]}</span></div>
        <div class="sdc-rs">${esc(R.signName)} from ${REFS[i][0] === 'Lagna' ? 'the Lagna' : 'the ' + REFS[i][0]}, lord ${R.lord} in its ring house ${R.lordHouse}</div>
        <div class="sdc-rp">${R.planets.length ? R.planets.map(p => `<span class="sdc-pc ${p.tone}">${G(p.name)} ${p.name}</span>`).join('') : '<span class="sdc-none">empty: judged by its lord and aspects</span>'}</div></div>`).join('')}</div>
      ${D.sameHouseNote ? '<p class="sdc-warn">Two of Lagna, Moon and Sun share a house in your chart. The old texts say that when this happens the Lagna view is the one to use.</p>' : ''}`;
  }
  let ST = { year: 0 };
  function html(chart, profile) {
    const y = ST.year || currentYear(chart);
    return `<div class="sdc"><div class="sdc-hero"><h3>Sudarshana Chakra</h3><p>Three views of one chart at once: houses counted from the <b>Lagna</b> (body), the <b>Moon</b> (mind) and the <b>Sun</b> (self). Each year of life lights one house in all three. Pick a year to see what sits there.</p></div>
      <div class="sdc-pick"><button type="button" data-sdc="step" data-d="-1" aria-label="Previous year">−</button><label>Year of life <input id="sdcYear" type="number" min="1" max="120" value="${y}" inputmode="numeric"></label><button type="button" data-sdc="step" data-d="1" aria-label="Next year">+</button><button type="button" class="sdc-now" data-sdc="now">Now</button></div>
      <div id="sdcBody">${body(chart, y)}</div>
      <details class="sdc-note"><summary>How to read this</summary>
        <p>Following Brihat Parashara Hora Shastra chapter 74, the chart is read three times: from the Lagna, from the Moon and from the Sun. The first year of life lights the 1st house, the second year the 2nd, and so on, repeating every 12 years (year 13 is the 1st again).</p>
        <p>A house tends to do well when its lord and benefic planets are with it, and to struggle under malefic planets. A malefic Mars or Saturn in its own or exalted sign counts as benefic here; a benefic in its fall or an enemy's sign counts as adverse. This page only counts these influences and does not score the year.</p>
        <p>The texts disagree on small points, such as month steps, so months are not shown. Use it as a theme for the year next to the Vimshottari Dasha and transits. It describes tendencies, not events.</p></details></div>`;
  }
  function text(chart, year) {
    const D = compute(chart, year);
    return `Sudarshana Chakra, year ${D.year} (house ${D.house}): ` + D.rings.map(r => `${r.ref}: ${r.planets.map(p => p.name).join(', ') || 'empty'} (${r.lean})`).join('; ');
  }
  function bind() {
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-sdc]'); if (!b) return;
      const root = b.closest('.sdc'), inp = root && root.querySelector('#sdcYear'), chart = typeof currentChartForModal !== 'undefined' ? currentChartForModal : null; if (!inp || !chart) return;
      let y = parseInt(inp.value, 10) || currentYear(chart);
      if (b.dataset.sdc === 'step') y += parseInt(b.dataset.d, 10); else y = currentYear(chart);
      y = Math.min(120, Math.max(1, y)); inp.value = y; ST.year = y; root.querySelector('#sdcBody').innerHTML = body(chart, y);
    });
    document.addEventListener('change', e => {
      if (e.target.id !== 'sdcYear') return; const chart = typeof currentChartForModal !== 'undefined' ? currentChartForModal : null; if (!chart) return;
      const y = Math.min(120, Math.max(1, parseInt(e.target.value, 10) || 1)); e.target.value = y; ST.year = y; e.target.closest('.sdc').querySelector('#sdcBody').innerHTML = body(chart, y);
    });
  }
  if (typeof document !== 'undefined' && document.addEventListener) bind();
  window.buildSudarshanaPanel = function (chart, profile) { ST.year = 0; return html(chart, profile || {}); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-sudarshana', window.buildSudarshanaPanel);
  return { compute, html, text, yearHouse, houseFrom, nature, currentYear, ringData, REFS, GR, state: ST };
})();

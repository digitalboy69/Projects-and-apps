/* Ashtakavarga extras (js/141): the working behind the Ashtakavarga numbers the app already shows. Built in sub-steps (see docs/ASTRO_FEATURES_PLAN.md A8):
   A8a Prastara: for each of the seven planets, a table of the eight contributors (Sun..Saturn, Lagna) against the twelve signs, a dot where that contributor gives a bindu.
       No new data: it re-uses CONTRIBUTION_TABLE and the sign placements from js/11; the column sums must (and in the tests do) equal chart.ashtakavarga.bavTables. Known totals 48/49/39/54/56/52/39 and SAV 337.
   A8b Sodhana (reduction) and the pindas. Rules from M.S. Mehta and K.N. Rao, "Ashtakvarga: concept and application" (archive.org copy), checked against vedalumina.com/deep-dive/shodhya-pinda and astrobix.com/learn/398 (multipliers agree in all three):
       Trikona sodhana first (trines Aries-Leo-Sagittarius, Taurus-Virgo-Capricorn, Gemini-Libra-Aquarius, Cancer-Scorpio-Pisces): all three above zero -> subtract the smallest from each (equal ones become zero); one is zero -> no change; two are zero -> the third becomes zero.
       Ekadhipatya sodhana second, for Mars (Aries, Scorpio), Mercury (Gemini, Virgo), Jupiter (Sagittarius, Pisces), Venus (Taurus, Libra), Saturn (Capricorn, Aquarius); Sun and Moon own one sign and are skipped; occupancy means one of the seven planets sits in the sign (nodes and Lagna do not count):
         one sign has zero bindus -> no change; both occupied -> no change; one occupied -> the occupied sign is kept, the empty one is cut to the occupied figure if it was larger, else to zero; neither occupied -> the larger is cut to the smaller (equal -> both zero).
       Rasi Pinda = sum(reduced bindus x Rasi multiplier 7,10,8,4,10,5,7,8,9,5,11,12). Graha Pinda = sum over the seven planets of (reduced bindus in the sign the planet sits in x Graha multiplier Sun 5, Moon 5, Mars 8, Mercury 5, Jupiter 10, Venus 7, Saturn 5). Shodhya Pinda = Rasi Pinda + Graha Pinda.
       Schools vary on details (Mehta notes other books apply these methods differently); this page follows Mehta/Rao. The vedalumina page leaves some cases unstated.
   A8c Kakshya and A8d Transit: each sign is cut into eight parts of 3 deg 45 min ruled in order by Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon, Lagna (indianetzone.com/kakshas_indian_astrology and jagannathhora.com/?p=30277 agree; the same order is used in js/90).
       A transiting planet tends to do well in a part whose ruler contributed a bindu to that sign in the planet's own table (jagannathhora.com): the ruler's bindu is read from the Prastara of the transiting planet.
       Transit view: for any chosen date, each of the seven planets' sign, degree, kakshya ruler, whether that ruler gave a bindu, the planet's own bindus in the sign and the Sarvashtakavarga of the sign.
       The plain bands (planet 5+ good, 4 middling, 3 or less strain; sign total over 30 / 25-30 / under 25) are ONE teacher's working bands (jagannathhora.com), shown as such, not a classical rule.
   Classes asx- prefixed. Facts only. Uses CONTRIBUTION_TABLE, BAV_PLANETS, CONTRIBUTORS, signsFromOffsets (js/11), SIGNS, chart.planets[].sign, chart.ascendant.sign. */
const ASX = (() => {
  const AB = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
  const TABS = [['pras', 'Prastara'], ['sod', 'Sodhana'], ['kak', 'Kakshya'], ['trn', 'Transit']];
  const KAK = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Lagna'];
  const TRINES = [[0, 4, 8], [1, 5, 9], [2, 6, 10], [3, 7, 11]];
  const DUAL = { Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10] };
  const RASI_M = [7, 10, 8, 4, 10, 5, 7, 8, 9, 5, 11, 12];
  const GRAHA_M = { Sun: 5, Moon: 5, Mars: 8, Mercury: 5, Jupiter: 10, Venus: 7, Saturn: 5 };
  function positions(chart) {
    const p = {}; BAV_PLANETS.forEach(n => p[n] = chart.planets[n].sign); p.Lagna = chart.ascendant.sign; return p;
  }
  /* Prastara of one planet: rows[contributor] = 12 flags, totals per sign, rowTotals per contributor */
  function prastara(chart, planet) {
    const pos = positions(chart), rows = {}, totals = new Array(12).fill(0), rowTotals = {};
    CONTRIBUTORS.forEach(c => {
      const flags = new Array(12).fill(0);
      signsFromOffsets(pos[c], CONTRIBUTION_TABLE[planet][c]).forEach(s => { flags[s] = 1; totals[s]++; });
      rows[c] = flags; rowTotals[c] = flags.reduce((a, b) => a + b, 0);
    });
    return { planet, rows, totals, rowTotals, total: totals.reduce((a, b) => a + b, 0), pos };
  }
  function trikona(b) {
    const o = b.slice();
    TRINES.forEach(t => {
      const v = t.map(i => o[i]), z = v.filter(x => x === 0).length;
      if (z === 0) { const m = Math.min(...v); t.forEach(i => o[i] -= m); }
      else if (z === 2) t.forEach(i => o[i] = 0);
    });
    return o;
  }
  function ekadhipatya(b, planet, occ) {
    const o = b.slice(), d = DUAL[planet]; if (!d) return o;
    const [x, y] = d, ox = occ.has(x), oy = occ.has(y);
    if (o[x] === 0 || o[y] === 0) return o;
    if (ox && oy) return o;
    if (ox || oy) { const [keep, emp] = ox ? [x, y] : [y, x]; o[emp] = o[emp] > o[keep] ? o[keep] : 0; return o; }
    if (o[x] === o[y]) { o[x] = 0; o[y] = 0; } else if (o[x] > o[y]) o[x] = o[y]; else o[y] = o[x];
    return o;
  }
  function sodhana(chart, planet) {
    const raw = chart.ashtakavarga.bavTables[planet], pos = positions(chart), occ = new Set(BAV_PLANETS.map(n => pos[n]));
    const tri = trikona(raw), eka = ekadhipatya(tri, planet, occ);
    const rasiParts = eka.map((v, i) => v * RASI_M[i]), rasiPinda = rasiParts.reduce((a, c) => a + c, 0);
    const grahaParts = BAV_PLANETS.map(q => ({ planet: q, sign: pos[q], bindus: eka[pos[q]], mult: GRAHA_M[q], product: eka[pos[q]] * GRAHA_M[q] })), grahaPinda = grahaParts.reduce((a, c) => a + c.product, 0);
    return { planet, raw: raw.slice(), trikona: tri, ekadhipatya: eka, rasiParts, rasiPinda, grahaParts, grahaPinda, shodhya: rasiPinda + grahaPinda, occupied: occ };
  }
  const nowJD = () => Date.now() / 86400000 + 2440587.5;
  const dateStr = jd => new Date((jd - 2440587.5) * 86400000).toISOString().slice(0, 10);
  function kakshyaAt(deg) { const k = Math.min(7, Math.max(0, Math.floor(deg / 3.75))); return { idx: k, lord: KAK[k] }; }
  function transitAt(chart, jd) {
    const asc = chart.ascendant.sign;
    return BAV_PLANETS.map(name => {
      const lon = getSiderealLongitudeAt(name, jd), sign = Math.floor(lon / 30), deg = lon - sign * 30, k = kakshyaAt(deg).idx, lord = KAK[k];
      const P = prastara(chart, name), gave = P.rows[lord][sign] === 1, bav = chart.ashtakavarga.bavTables[name][sign], sav = chart.ashtakavarga.sav[sign];
      return { name, lon, sign, deg, kIdx: k, lord, gave, bav, sav, house: ((sign - asc + 12) % 12) + 1, strip: KAK.map(l => P.rows[l][sign] === 1) };
    });
  }
  const bavBand = v => v >= 5 ? 'good' : v === 4 ? 'mid' : 'low';
  const savBand = v => v > 30 ? 'good' : v >= 25 ? 'mid' : 'low';
  const dm = d => { const t = Math.round(d * 60); return `${Math.floor(t / 60)}°${String(t % 60).padStart(2, '0')}′`; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const G = n => (typeof PLANET_GLYPHS !== 'undefined' && PLANET_GLYPHS[n]) || '';
  let ST = { tab: 'pras', planet: 'Sun', jd: 0 };
  function prasHtml(chart) {
    const P = prastara(chart, ST.planet), asc = chart.ascendant.sign;
    const head = AB.map((a, i) => `<th class="${i === P.pos[ST.planet] ? 'me' : ''}${i === asc ? ' lg' : ''}">${a}</th>`).join('');
    const body = CONTRIBUTORS.map(c => `<tr><th class="asx-rl">${c === 'Lagna' ? 'Lagna' : G(c) + ' ' + c.slice(0, 3)}<small>${AB[P.pos[c]]}</small></th>${P.rows[c].map(f => `<td class="${f ? 'on' : ''}">${f ? '●' : '·'}</td>`).join('')}<td class="asx-rt">${P.rowTotals[c]}</td></tr>`).join('');
    const tot = `<tr class="asx-tot"><th class="asx-rl">Total</th>${P.totals.map(v => `<td>${v}</td>`).join('')}<td class="asx-rt">${P.total}</td></tr>`;
    return `<div class="asx-chips">${BAV_PLANETS.map(p => `<button type="button" class="${p === ST.planet ? 'on' : ''}" data-asx="planet" data-p="${p}">${G(p)} ${p}</button>`).join('')}</div>
      <div class="asx-wrap"><table class="asx-t"><thead><tr><th class="asx-rl"></th>${head}<th class="asx-rt">Σ</th></tr></thead><tbody>${body}${tot}</tbody></table></div>
      <p class="asx-cap">${ST.planet}'s own table: a dot where that giver adds one bindu to the sign. The bottom row is the planet's Ashtakavarga (${P.total} bindus in all). Small letters under each giver show the sign it sits in.</p>`;
  }
  function sodHtml(chart) {
    const S = sodhana(chart, ST.planet), row = (lab, arr, cls) => `<tr class="${cls || ''}"><th class="asx-rl">${lab}</th>${arr.map((v, i) => `<td class="${S.occupied.has(i) ? 'occ' : ''}">${v}</td>`).join('')}<td class="asx-rt">${arr.reduce((a, c) => a + c, 0)}</td></tr>`;
    const all = BAV_PLANETS.map(p => ({ p, v: sodhana(chart, p).shodhya }));
    return `<div class="asx-chips">${BAV_PLANETS.map(p => `<button type="button" class="${p === ST.planet ? 'on' : ''}" data-asx="planet" data-p="${p}">${G(p)} ${p}</button>`).join('')}</div>
      <div class="asx-wrap"><table class="asx-t asx-s"><thead><tr><th class="asx-rl"></th>${AB.map(a => `<th>${a}</th>`).join('')}<th class="asx-rt">Σ</th></tr></thead><tbody>
        ${row('Start', S.raw)}${row('Trines', S.trikona)}${row('Pairs', S.ekadhipatya, 'asx-last')}${row('× sign', S.rasiParts, 'asx-tot')}</tbody></table></div>
      <p class="asx-cap">${ST.planet}: <b>Start</b> is its Ashtakavarga. <b>Trines</b> removes the shared part of each trine, then <b>Pairs</b> trims the two signs of Mars, Mercury, Jupiter, Venus and Saturn (the Sun and Moon own one sign each). Gold numbers are signs where a planet sits. <b>× sign</b> multiplies by each sign's fixed number.</p>
      <div class="asx-pin"><div><span>Rasi Pinda</span><b>${S.rasiPinda}</b></div><div><span>Graha Pinda</span><b>${S.grahaPinda}</b></div><div class="t"><span>Shodhya Pinda</span><b>${S.shodhya}</b></div></div>
      <div class="asx-gp">${S.grahaParts.map(g => `<span>${G(g.planet)} ${g.planet} in ${AB[g.sign]}: ${g.bindus} × ${g.mult} = ${g.product}</span>`).join('')}</div>
      <div class="asx-all"><h4>Shodhya Pinda of all seven</h4>${all.map(a => `<div><span>${G(a.p)} ${a.p}</span><b>${a.v}</b></div>`).join('')}</div>`;
  }
  function dateBar() {
    return `<div class="asx-date"><button type="button" data-asx="day" data-d="-1" aria-label="Previous day">‹</button><input type="date" id="asxDate" value="${dateStr(ST.jd)}"><button type="button" data-asx="day" data-d="1" aria-label="Next day">›</button><button type="button" class="asx-now" data-asx="now">Now</button></div>`;
  }
  function kakHtml(chart) {
    const T = transitAt(chart, ST.jd).find(t => t.name === ST.planet);
    return `<div class="asx-chips">${BAV_PLANETS.map(p => `<button type="button" class="${p === ST.planet ? 'on' : ''}" data-asx="planet" data-p="${p}">${G(p)} ${p}</button>`).join('')}</div>${dateBar()}
      <div class="asx-kh"><b>${esc(ST.planet)}</b> is in <b>${SIGNS[T.sign].name}</b> at ${dm(T.deg)}, in the part ruled by <b>${T.lord}</b>.</div>
      <div class="asx-strip">${KAK.map((l, i) => `<div class="${i === T.kIdx ? 'cur' : ''}${T.strip[i] ? ' gave' : ''}"><span>${l === 'Lagna' ? 'Lag' : l.slice(0, 3)}</span><b>${T.strip[i] ? '●' : '·'}</b><small>${dm(i * 3.75)}</small></div>`).join('')}</div>
      <p class="asx-cap">The sign is cut into eight parts of 3°45′. A dot means that part's ruler gave ${esc(ST.planet)} a bindu in ${SIGNS[T.sign].name}. ${T.gave ? `${esc(ST.planet)} is now in a part whose ruler gave a bindu, which tends to be its supportive stretch.` : `${esc(ST.planet)} is now in a part whose ruler gave no bindu, which tends to be a quieter stretch.`} ${esc(ST.planet)} has <b>${T.bav}</b> bindus in this sign and the sign total is <b>${T.sav}</b>.</p>`;
  }
  function trnHtml(chart) {
    const T = transitAt(chart, ST.jd);
    return `${dateBar()}<div class="asx-wrap"><table class="asx-t asx-s asx-x"><thead><tr><th class="asx-rl"></th><th>Sign</th><th>House</th><th>Part</th><th>Own</th><th>Sign Σ</th></tr></thead><tbody>${T.map(t => `<tr><th class="asx-rl">${G(t.name)} ${t.name.slice(0, 3)}<small>${dm(t.deg)}</small></th><td>${AB[t.sign]}</td><td>${t.house}</td><td class="${t.gave ? 'gv' : 'ng'}">${t.lord === 'Lagna' ? 'Lag' : t.lord.slice(0, 3)} ${t.gave ? '●' : '·'}</td><td class="b-${bavBand(t.bav)}">${t.bav}</td><td class="b-${savBand(t.sav)}">${t.sav}</td></tr>`).join('')}</tbody></table></div>
      <p class="asx-cap"><b>House</b> is counted from your Lagna. <b>Part</b> is the 3°45′ part of the sign the planet is in and its ruler; a dot means that ruler gave the planet a bindu there. <b>Own</b> is the planet's bindus in the sign and <b>Sign Σ</b> the Sarvashtakavarga of the sign. Working bands (one teacher's, not a classical rule): own 5 or more good, 4 middling, 3 or fewer strain; sign total over 30 supported, 25 to 30 ordinary, under 25 needs help.</p>`;
  }
  function body(chart) { return ST.tab === 'pras' ? prasHtml(chart) : ST.tab === 'sod' ? sodHtml(chart) : ST.tab === 'kak' ? kakHtml(chart) : ST.tab === 'trn' ? trnHtml(chart) : ''; }
  function html(chart, profile) {
    return `<div class="asx"><div class="asx-hero"><h3>Ashtakavarga Workings</h3><p>The Ashtakavarga numbers come from eight givers (the seven planets and the Lagna). Here is the working behind them, step by step.</p></div>
      <div class="asx-tabs" role="tablist">${TABS.map(t => `<button type="button" role="tab" class="${ST.tab === t[0] ? 'on' : ''}" data-asx="tab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>
      <div id="asxBody">${body(chart)}</div>
      <details class="asx-note"><summary>How this is worked out</summary>
        <p>Each planet has its own table. Each of the eight givers (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn and the Lagna) adds one bindu to the signs that lie at its fixed set of distances from the sign it occupies. Adding down a column gives that planet's number for the sign; adding all seven planets' columns gives the Sarvashtakavarga.</p>
        <p>This page uses the same rules the app already uses for its Ashtakavarga. The totals are the classic ones: Sun 48, Moon 49, Mars 39, Mercury 54, Jupiter 56, Venus 52, Saturn 39, and 337 in all.</p>
        <p><b>Kakshya</b> cuts each sign into eight parts of 3°45′, ruled in turn by Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon and the Lagna. A planet in transit tends to be most supportive while it is in a part whose ruler gave it a bindu in that sign. The Transit tab shows this for every planet on a chosen date.</p>
        <p><b>Sodhana</b> (reduction) follows Mehta and Rao: first each trine (Aries-Leo-Sagittarius, Taurus-Virgo-Capricorn, Gemini-Libra-Aquarius, Cancer-Scorpio-Pisces) loses its smallest figure, with the special cases for zeros; then the two signs of Mars, Mercury, Jupiter, Venus and Saturn are trimmed by whether a planet sits in them. Shodhya Pinda adds the sign-weighted total (Rasi Pinda) and the planet-weighted total (Graha Pinda). Books differ on small points, so treat the numbers as one school's working.</p></details></div>`;
  }
  function text(chart) { return BAV_PLANETS.map(p => { const P = prastara(chart, p); return `${p} (${P.total}): ` + P.totals.map((v, i) => AB[i] + ' ' + v).join(' '); }).join('\n'); }
  function bind() {
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-asx]'); if (!b) return; const root = b.closest('.asx'); if (!root) return;
      const chart = typeof currentChartForModal !== 'undefined' ? currentChartForModal : null; if (!chart) return;
      if (b.dataset.asx === 'planet') ST.planet = b.dataset.p; else if (b.dataset.asx === 'day') ST.jd += parseInt(b.dataset.d, 10); else if (b.dataset.asx === 'now') ST.jd = nowJD(); else if (b.dataset.asx === 'tab') { ST.tab = b.dataset.t; root.querySelectorAll('.asx-tabs button').forEach(x => x.classList.toggle('on', x.dataset.t === ST.tab)); }
      root.querySelector('#asxBody').innerHTML = body(chart);
    });
  }
  function bindDate() {
    document.addEventListener('change', e => {
      if (e.target.id !== 'asxDate') return; const chart = typeof currentChartForModal !== 'undefined' ? currentChartForModal : null; if (!chart) return;
      const p = e.target.value.split('-').map(Number); if (p.length !== 3 || p.some(isNaN)) return;
      ST.jd = Date.UTC(p[0], p[1] - 1, p[2], 12) / 86400000 + 2440587.5; e.target.closest('.asx').querySelector('#asxBody').innerHTML = body(chart);
    });
  }
  if (typeof document !== 'undefined' && document.addEventListener) { bind(); bindDate(); }
  window.buildAshtakavargaExtrasPanel = function (chart, profile) { ST.tab = 'pras'; ST.planet = 'Sun'; ST.jd = nowJD(); return html(chart, profile || {}); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-asx', window.buildAshtakavargaExtrasPanel);
  return { prastara, sodhana, transitAt, kakshyaAt, KAK, bavBand, savBand, trikona, ekadhipatya, positions, html, text, AB, TABS, TRINES, DUAL, RASI_M, GRAHA_M, state: ST };
})();

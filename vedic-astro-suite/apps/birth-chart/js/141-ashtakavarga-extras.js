/* Ashtakavarga extras (js/141): the working behind the Ashtakavarga numbers the app already shows. Built in sub-steps (see docs/ASTRO_FEATURES_PLAN.md A8):
   A8a Prastara: for each of the seven planets, a table of the eight contributors (Sun..Saturn, Lagna) against the twelve signs, a dot where that contributor gives a bindu.
       No new data: it re-uses CONTRIBUTION_TABLE and the sign placements from js/11; the column sums must (and in the tests do) equal chart.ashtakavarga.bavTables. Known totals 48/49/39/54/56/52/39 and SAV 337.
   Classes asx- prefixed. Facts only. Uses CONTRIBUTION_TABLE, BAV_PLANETS, CONTRIBUTORS, signsFromOffsets (js/11), SIGNS, chart.planets[].sign, chart.ascendant.sign. */
const ASX = (() => {
  const AB = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
  const TABS = [['pras', 'Prastara']];
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
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const G = n => (typeof PLANET_GLYPHS !== 'undefined' && PLANET_GLYPHS[n]) || '';
  let ST = { tab: 'pras', planet: 'Sun' };
  function prasHtml(chart) {
    const P = prastara(chart, ST.planet), asc = chart.ascendant.sign;
    const head = AB.map((a, i) => `<th class="${i === P.pos[ST.planet] ? 'me' : ''}${i === asc ? ' lg' : ''}">${a}</th>`).join('');
    const body = CONTRIBUTORS.map(c => `<tr><th class="asx-rl">${c === 'Lagna' ? 'Lagna' : G(c) + ' ' + c.slice(0, 3)}<small>${AB[P.pos[c]]}</small></th>${P.rows[c].map(f => `<td class="${f ? 'on' : ''}">${f ? '●' : '·'}</td>`).join('')}<td class="asx-rt">${P.rowTotals[c]}</td></tr>`).join('');
    const tot = `<tr class="asx-tot"><th class="asx-rl">Total</th>${P.totals.map(v => `<td>${v}</td>`).join('')}<td class="asx-rt">${P.total}</td></tr>`;
    return `<div class="asx-chips">${BAV_PLANETS.map(p => `<button type="button" class="${p === ST.planet ? 'on' : ''}" data-asx="planet" data-p="${p}">${G(p)} ${p}</button>`).join('')}</div>
      <div class="asx-wrap"><table class="asx-t"><thead><tr><th class="asx-rl"></th>${head}<th class="asx-rt">Σ</th></tr></thead><tbody>${body}${tot}</tbody></table></div>
      <p class="asx-cap">${ST.planet}'s own table: a dot where that giver adds one bindu to the sign. The bottom row is the planet's Ashtakavarga (${P.total} bindus in all). Small letters under each giver show the sign it sits in.</p>`;
  }
  function body(chart) { return ST.tab === 'pras' ? prasHtml(chart) : ''; }
  function html(chart, profile) {
    return `<div class="asx"><div class="asx-hero"><h3>Ashtakavarga Workings</h3><p>The Ashtakavarga numbers come from eight givers (the seven planets and the Lagna). Here is the working behind them, step by step.</p></div>
      <div class="asx-tabs" role="tablist">${TABS.map(t => `<button type="button" role="tab" class="${ST.tab === t[0] ? 'on' : ''}" data-asx="tab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>
      <div id="asxBody">${body(chart)}</div>
      <details class="asx-note"><summary>How this is worked out</summary>
        <p>Each planet has its own table. Each of the eight givers (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn and the Lagna) adds one bindu to the signs that lie at its fixed set of distances from the sign it occupies. Adding down a column gives that planet's number for the sign; adding all seven planets' columns gives the Sarvashtakavarga.</p>
        <p>This page uses the same rules the app already uses for its Ashtakavarga. The totals are the classic ones: Sun 48, Moon 49, Mars 39, Mercury 54, Jupiter 56, Venus 52, Saturn 39, and 337 in all.</p></details></div>`;
  }
  function text(chart) { return BAV_PLANETS.map(p => { const P = prastara(chart, p); return `${p} (${P.total}): ` + P.totals.map((v, i) => AB[i] + ' ' + v).join(' '); }).join('\n'); }
  function bind() {
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-asx]'); if (!b) return; const root = b.closest('.asx'); if (!root) return;
      const chart = typeof currentChartForModal !== 'undefined' ? currentChartForModal : null; if (!chart) return;
      if (b.dataset.asx === 'planet') ST.planet = b.dataset.p; else if (b.dataset.asx === 'tab') { ST.tab = b.dataset.t; root.querySelectorAll('.asx-tabs button').forEach(x => x.classList.toggle('on', x.dataset.t === ST.tab)); }
      root.querySelector('#asxBody').innerHTML = body(chart);
    });
  }
  if (typeof document !== 'undefined' && document.addEventListener) bind();
  window.buildAshtakavargaExtrasPanel = function (chart, profile) { ST.tab = 'pras'; ST.planet = 'Sun'; return html(chart, profile || {}); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-asx', window.buildAshtakavargaExtrasPanel);
  return { prastara, positions, html, text, AB, TABS, state: ST };
})();

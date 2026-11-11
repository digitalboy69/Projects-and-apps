/* Bhavat Bhavam and Arudha Padas (js/140).
   Bhavat Bhavam = the house counted from a house by the same number: the Nth house from house N (7th from the 7th is the 1st; 2nd from the 2nd is the 3rd...).
   Sources: panchangbodh.com/bhavat-bhavam-calculator (all 12 pairs) and astrosight.ai/predictions/bhavat-bhavam-principle-explained (the rule and ten of the pairs): they agree everywhere both give a pair.
   Pairs: 1>1, 2>3, 3>5, 4>7, 5>9, 6>11, 7>1, 8>3, 9>5, 10>7, 11>9, 12>11. astrosight stresses the base house stays the authority; the second house supplements it, and chaining twice is shaky: this page shows one step only.
   Arudha padas: the app already computes eleven (AL = A1, A2..A6, A8..A11, UL = A12) in js/17 (calcAllArudhaPadas, BPHS rule with the 7th/same-house correction). A7 (Dara Pada) was missing: it is added here by the same function calcArudhaPadaSign.
   House themes are plain one-word reminders, not source claims. Tendencies only. Uses calcArudhaPadaSign/calcAllArudhaPadas (js/17), SIGNS, chart.planets[].house. Classes bbh- prefixed. */
const BBH = (() => {
  const GR = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const THEME = ['self and body', 'wealth and family', 'effort and siblings', 'home and mother', 'children and learning', 'service and obstacles', 'partnership', 'change and depth', 'fortune and dharma', 'work and standing', 'gains and networks', 'rest, loss and release'];
  const ORD = n => n + (['st', 'nd', 'rd'][n - 1] || 'th');
  const derived = n => ((2 * (n - 1)) % 12) + 1; /* Nth from the Nth house */
  const PADA_NAMES = { AL: 'Arudha Lagna (A1)', A2: 'Dhana Pada (A2)', A3: 'Bhatru Pada (A3)', A4: 'Matru Pada (A4)', A5: 'Mantra Pada (A5)', A6: 'Roga Pada (A6)', A7: 'Dara Pada (A7)', A8: 'Mrityu Pada (A8)', A9: 'Pitri Pada (A9)', A10: 'Rajya Pada (A10)', A11: 'Labha Pada (A11)', UL: 'Upapada Lagna (A12)' };
  const PADA_ORDER = ['AL', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'UL'];
  function compute(chart) {
    const asc = chart.ascendant.sign, at = {}; for (let h = 1; h <= 12; h++) at[h] = [];
    GR.forEach(n => at[chart.planets[n].house].push(n));
    const rows = []; for (let h = 1; h <= 12; h++) {
      const d = derived(h), sg = (asc + d - 1) % 12, lord = SIGNS[sg].lord;
      rows.push({ house: h, derived: d, sign: sg, signName: SIGNS[sg].name, lord, lordHouse: chart.planets[lord].house, planets: at[d].slice(), theme: THEME[h - 1], dTheme: THEME[d - 1] });
    }
    const ar = calcAllArudhaPadas(chart, asc); ar.A7 = calcArudhaPadaSign((asc + 6) % 12, asc, chart.planets);
    const padas = PADA_ORDER.map(k => ({ key: k, name: PADA_NAMES[k], sign: ar[k], signName: SIGNS[ar[k]].name, house: ((ar[k] - asc + 12) % 12) + 1, planets: GR.filter(n => chart.planets[n].sign === ar[k]) }));
    return { rows, padas };
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const G = n => (typeof PLANET_GLYPHS !== 'undefined' && PLANET_GLYPHS[n]) || '';
  const pl = a => a.length ? a.map(n => `${G(n)} ${n}`).join(', ') : 'empty';
  function html(chart, profile) {
    const D = compute(chart);
    return `<div class="bbh"><div class="bbh-hero"><h3>House from the House</h3><p><b>Bhavat Bhavam</b> reads a house a second time: the Nth house counted from the Nth house. The 7th from the 7th is the 1st, so a partner is also read through the self. It supplements the main reading and does not replace it.</p><p><button type="button" class="bbh-go" onclick="switchAppTab('panel-bhavatclass')">Open the full Masterclass →</button></p></div>
      <div class="bbh-list">${D.rows.map(r => `<article class="bbh-card"><header><span class="bbh-n">${r.house}</span><span class="bbh-ar">→</span><span class="bbh-n d">${r.derived}</span><div class="bbh-t"><b>${ORD(r.house)} from the ${ORD(r.house)} is the ${ORD(r.derived)}</b><small>${esc(r.theme)} read through ${esc(r.dTheme)}</small></div></header>
        <div class="bbh-b"><span>${esc(r.signName)}, lord ${r.lord} in house ${r.lordHouse}</span><span>${esc(pl(r.planets))}</span></div></article>`).join('')}</div>
      <div class="bbh-hero"><h3>Arudha Padas</h3><p>The <b>arudha</b> of a house is the image it projects, how it looks from outside. Here are all twelve, with the house each falls in from your Lagna.</p></div>
      <div class="bbh-list">${D.padas.map(p => `<article class="bbh-card"><header><span class="bbh-n">${p.key === 'UL' ? '12' : p.key === 'AL' ? '1' : p.key.slice(1)}</span><div class="bbh-t"><b>${esc(p.name)}</b><small>${esc(p.signName)} · house ${p.house}</small></div></header><div class="bbh-b"><span>${esc(pl(p.planets))}</span></div></article>`).join('')}</div>
      <details class="bbh-note"><summary>How these are worked out</summary>
        <p>Bhavat Bhavam counts the same number of houses from a house as its own number: 2nd from the 2nd is the 3rd, 4th from the 4th is the 7th, 7th from the 7th is the 1st. Two published sources give the same pairs. The main house stays the authority; the second house adds colour. Only one step is shown because chaining further gets unreliable.</p>
        <p>An arudha pada is found by counting from a house to its lord, then the same number again from the lord. If that lands in the house itself or in its 7th, the 10th from it is taken instead. The twelve padas are A1 (Arudha Lagna) to A12 (Upapada).</p>
        <p>These are tendencies and shown for those who read them with the chart.</p></details></div>`;
  }
  function text(chart) { const D = compute(chart); return D.rows.map(r => `${ORD(r.house)} from ${ORD(r.house)} = ${ORD(r.derived)} (${r.signName})`).join('\n') + '\n' + D.padas.map(p => `${p.name}: ${p.signName} (house ${p.house})`).join('\n'); }
  window.buildBhavatBhavamPanel = function (chart, profile) { return html(chart, profile || {}); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-bhavat', window.buildBhavatBhavamPanel);
  return { compute, html, text, derived, GR, PADA_ORDER };
})();

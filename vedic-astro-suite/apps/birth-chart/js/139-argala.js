/* Argala and Virodhargala (js/139): for each house, which planets intervene (argala) and which obstruct (virodhargala). Jaimini Upadesa Sutras 1.1.10-14.
   Rules (agreeing in sutramritam.blogspot.com "Argala - The Linchpin", panchangbodh.com/argala-calculator and the B.V. Raman summary at slideshare "Jaimini Astrology - Argala"; dekhopanchang.com has the 2nd/12th and 11th/3rd pairs swapped, an error):
     Argala from the 2nd, 4th, 11th house counted from the house; obstructed by the 12th, 10th, 3rd respectively. Raman adds the 5th (obstructed by the 9th); dekhopanchang lists it too: shown as a special pair.
     Strength by count: the obstruction wins only with MORE planets than the argala; equal numbers are shown as contested ("compare strength", sutramritam) because dekhopanchang lets equal count hold.
   Single-source details, flagged on the page: 3 or more malefics in the 3rd give an extra argala nothing can obstruct (sutramritam; shown as its own row); for a house holding Ketu the argala is reckoned in reverse (sutramritam, slideshare). Some teachers count only benefics for the 5th/9th pair: all planets are counted here.
   Planets counted: the nine grahas (nodes as ordinary planets: the sources leave Rahu open). Facts and counts only; the result is a tendency. Uses chart.planets[].house, chart.ascendant.sign (js/15), SIGNS. Classes arg- prefixed. */
const ARG = (() => {
  const GR = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const MALEFIC = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];
  const PAIRS = [
    { id: 'dhana', name: 'Dhana argala', from: 2, vir: 12, special: false },
    { id: 'sukha', name: 'Sukha argala', from: 4, vir: 10, special: false },
    { id: 'labha', name: 'Labha argala', from: 11, vir: 3, special: false },
    { id: 'putra', name: 'Putra argala (special)', from: 5, vir: 9, special: true }
  ];
  const ORD = n => n + (['st', 'nd', 'rd'][n - 1] || 'th');
  const nth = (h, k) => ((h - 1 + k - 1) % 12) + 1; /* house k-th counted from house h */
  function compute(chart) {
    const at = {}; for (let h = 1; h <= 12; h++) at[h] = [];
    GR.forEach(n => at[chart.planets[n].house].push(n));
    const houses = [];
    for (let h = 1; h <= 12; h++) {
      const ketu = at[h].includes('Ketu'), rev = ketu;
      const pairs = PAIRS.map(p => {
        /* reverse: the roles swap (the obstructing house causes, the causing house obstructs) */
        const cH = nth(h, rev ? p.vir : p.from), oH = nth(h, rev ? p.from : p.vir);
        const c = at[cH], o = at[oH];
        let state;
        if (!c.length) state = 'none';
        else if (o.length > c.length) state = 'obstructed';
        else if (o.length === c.length && o.length > 0) state = 'contested';
        else state = 'stands';
        return { id: p.id, name: p.name, special: p.special, argalaHouse: cH, virHouse: oH, argala: c.slice(), vir: o.slice(), state, reversed: rev };
      });
      /* single-teacher rule (sutramritam): 3 or more malefics in the 3rd give an argala that cannot be obstructed */
      const m3 = at[nth(h, 3)].filter(n => MALEFIC.includes(n));
      if (!rev && m3.length >= 3) pairs.push({ id: 'tritiya', name: 'Malefics in the 3rd (special)', special: true, argalaHouse: nth(h, 3), virHouse: null, argala: m3, vir: [], state: 'stands', extra: true, reversed: false });
      const main = pairs.filter(p => !p.special);
      houses.push({ house: h, sign: (chart.ascendant.sign + h - 1) % 12, signName: SIGNS[(chart.ascendant.sign + h - 1) % 12].name, reversed: rev, pairs, standing: main.filter(p => p.state === 'stands').length, anyStanding: pairs.filter(p => p.state === 'stands').length });
    }
    return houses;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const G = n => (typeof PLANET_GLYPHS !== 'undefined' && PLANET_GLYPHS[n]) || '';
  const pl = a => a.length ? a.map(n => `${G(n)} ${n}`).join(', ') : 'no planets';
  const STXT = { stands: 'stands', obstructed: 'is obstructed', contested: 'is contested', none: 'not present' };
  let ST = { open: 1 };
  function detail(h) {
    return `<div class="arg-d">${h.reversed ? '<p class="arg-rev">Ketu is in this house, so the old texts count the argala the other way round here (the 12th, 10th and 3rd intervene; the 2nd, 4th and 11th obstruct).</p>' : ''}${h.pairs.map(p => `<div class="arg-p ${p.state}"><div class="arg-ph"><span>${p.name}</span><span class="arg-st ${p.state}">${STXT[p.state]}</span></div>
      <div class="arg-pl"><em>${ORD(p.argalaHouse)} house</em> ${esc(pl(p.argala))}</div>${p.state === 'none' || p.extra ? '' : `<div class="arg-pl"><em>${ORD(p.virHouse)} house (obstructs)</em> ${esc(pl(p.vir))}</div>`}${p.extra ? '<div class="arg-pn">Three or more malefics in the 3rd: one teacher gives this an argala that nothing can obstruct.</div>' : ''}${p.state === 'contested' ? '<div class="arg-pn">Equal numbers: teachers say to compare strength.</div>' : ''}</div>`).join('')}</div>`;
  }
  function body(chart) {
    return compute(chart).map(h => {
      const on = ST.open === h.house;
      return `<div class="arg-h${on ? ' on' : ''}"><button type="button" class="arg-row" data-arg="${h.house}" aria-expanded="${on}"><span class="arg-n">${h.house}</span><span class="arg-s">${esc(h.signName)}</span><span class="arg-c">${h.standing} of 3 stand</span></button>${on ? detail(h) : ''}</div>`;
    }).join('');
  }
  function html(chart, profile) {
    return `<div class="arg"><div class="arg-hero"><h3>Argala</h3><p><b>Argala</b> means planets that press on a house from the 2nd, 4th and 11th places from it. Planets in the 12th, 10th and 3rd can <b>obstruct</b> them. Tap a house to see who intervenes and who obstructs.</p></div>
      <div id="argBody">${body(chart)}</div>
      <details class="arg-note"><summary>How this is worked out</summary>
        <p>Following the Jaimini Sutras, a house is pressed on by planets in its 2nd, 4th and 11th, and these are obstructed by planets in its 12th, 10th and 3rd respectively. The 5th, obstructed by the 9th, is shown as a special extra. An obstruction wins only when it has more planets; equal numbers are shown as contested, since teachers say to compare strength.</p>
        <p>Two details rest on single teachers and are marked where they apply: three or more malefics in the 3rd, and the reversed count when Ketu is in the house. Rahu and Ketu are counted like other planets. Some teachers count only benefics for the 5th and 9th; here all planets count.</p>
        <p>This counts planets only and says nothing of their strength. It tends to show where help or pressure reaches a house; read it with the sign, the lord and the Dasha.</p></details></div>`;
  }
  function text(chart) { return compute(chart).map(h => `House ${h.house}: ${h.pairs.map(p => `${ORD(p.argalaHouse)} ${STXT[p.state]}`).join(', ')}`).join('\n'); }
  function bind() {
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-arg]'); if (!b) return; const root = b.closest('.arg'); if (!root) return;
      const chart = typeof currentChartForModal !== 'undefined' ? currentChartForModal : null; if (!chart) return;
      const n = parseInt(b.dataset.arg, 10); ST.open = ST.open === n ? 0 : n; root.querySelector('#argBody').innerHTML = body(chart);
    });
  }
  if (typeof document !== 'undefined' && document.addEventListener) bind();
  window.buildArgalaPanel = function (chart, profile) { ST.open = 1; return html(chart, profile || {}); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-argala', window.buildArgalaPanel);
  return { compute, html, text, nth, PAIRS, GR, state: ST };
})();

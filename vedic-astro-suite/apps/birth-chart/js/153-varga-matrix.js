/* Varga Matrix (js/153). Global VMX. All nine planets across the divisional charts D1 to D144 in one colour-coded grid.
   Reads only chart.vargas[key] (houses[].sign/houseNum/planets[].name/retrograde/dignity.status, ascendantSign) and the VARGAS names (js/05).
   Dignity points (a teaching aid, not a verdict): Exalted +2, Own sign / Moolatrikona +2, Friend +1, Neutral 0, Enemy -1, Debilitated -2. "Good" = +1 or more.
   Vargottama = same sign in D1 and D9. Ring marker = same sign as in D1 in another chart. Classes vmx- prefixed. Tendency wording only. */
const VMX = (() => {
  const GR = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const SETS = [
    { id: 'sapta', t: 'Sapta 7', keys: ['D1', 'D2', 'D3', 'D7', 'D9', 'D12', 'D30'], note: 'The seven classical charts used for varga strength.' },
    { id: 'shodasha', t: 'Shodasha 16', keys: ['D1', 'D2', 'D3', 'D4', 'D7', 'D9', 'D10', 'D12', 'D16', 'D20', 'D24', 'D27', 'D30', 'D40', 'D45', 'D60'], note: 'The sixteen charts of the classical Shodashavarga scheme.' },
    { id: 'all', t: 'All charts', keys: null, note: 'Every divisional chart the app calculates, D1 to D144.' }
  ];
  const PTS = { Exalted: 2, OwnSign: 2, Moolatrikona: 2, Friend: 1, Neutral: 0, Enemy: -1, Debilitated: -2 };
  const CLS = { Exalted: 'vx-ex', OwnSign: 'vx-ow', Moolatrikona: 'vx-ow', Friend: 'vx-fr', Neutral: 'vx-ne', Enemy: 'vx-en', Debilitated: 'vx-de' };
  const WORD = { Exalted: 'Exalted', OwnSign: 'Own sign', Moolatrikona: 'Moolatrikona', Friend: 'Friendly sign', Neutral: 'Neutral sign', Enemy: 'Enemy sign', Debilitated: 'Debilitated' };
  const ORD = n => n + (['st', 'nd', 'rd'][n - 1] || 'th');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const G = n => (typeof PLANET_GLYPHS !== 'undefined' && PLANET_GLYPHS[n]) || n.slice(0, 2);
  const vname = k => (typeof VARGAS !== 'undefined' && VARGAS[k] ? VARGAS[k].name : k);
  const vdesc = k => (typeof VARGAS !== 'undefined' && VARGAS[k] ? VARGAS[k].desc : '');
  let lastChart = null, setId = 'shodasha', pick = { k: 'D9', p: 'Sun' };

  function keysFor(chart, id) {
    const have = Object.keys(chart.vargas || {}), s = SETS.find(x => x.id === id) || SETS[1];
    return s.keys ? s.keys.filter(k => have.indexOf(k) >= 0) : have;
  }
  function cellOf(chart, key, planet) {
    const v = chart.vargas && chart.vargas[key]; if (!v) return null;
    for (const h of v.houses) {
      const p = h.planets.find(x => x.name === planet);
      if (p) { const st = (p.dignity && p.dignity.status) || 'Neutral'; return { sign: h.sign, house: h.houseNum, status: st, cls: CLS[st] || 'ne', pts: PTS[st] == null ? 0 : PTS[st], retro: !!p.retrograde }; }
    }
    return null;
  }
  function compute(chart, id) {
    const keys = keysFor(chart, id), rows = [], per = {};
    GR.forEach(p => { per[p] = { planet: p, n: 0, pts: 0, good: 0, ex: 0, ow: 0, de: 0 }; });
    keys.forEach(k => {
      const v = chart.vargas[k], cells = GR.map(p => cellOf(chart, k, p));
      cells.forEach((c, i) => { if (!c) return; const s = per[GR[i]]; s.n++; s.pts += c.pts; if (c.pts >= 1) s.good++; if (c.status === 'Exalted') s.ex++; if (c.status === 'OwnSign' || c.status === 'Moolatrikona') s.ow++; if (c.status === 'Debilitated') s.de++; });
      rows.push({ key: k, name: vname(k), lagna: v.ascendantSign, cells });
    });
    const d1 = chart.vargas.D1, d9 = chart.vargas.D9, vot = [];
    GR.forEach(p => { const a = cellOf(chart, 'D1', p), b = cellOf(chart, 'D9', p); if (a && b && a.sign === b.sign) vot.push(p); });
    const ranked = GR.map(p => per[p]).filter(s => s.n).sort((a, b) => (b.pts / b.n) - (a.pts / a.n));
    const tot = (f) => GR.reduce((s, p) => s + per[p][f], 0);
    return { keys, rows, per, vot, ranked, strong: tot('ex') + tot('ow'), weak: tot('de'), d1 };
  }
  function detail(chart, key, planet) {
    const c = cellOf(chart, key, planet); if (!c) return null;
    const d1 = cellOf(chart, 'D1', planet), v = chart.vargas[key], lg = v.ascendantSign, nm = SIGNS[c.sign].name;
    const same = d1 && d1.sign === c.sign;
    return { key, planet, c, signName: nm, lagnaName: SIGNS[lg].name, d1Name: d1 ? SIGNS[d1.sign].name : null, same, vot: key === 'D9' && same, title: `${planet} in ${key} ${vname(key)}`, about: vdesc(key) };
  }
  const tag = (t) => `<span class="vmx-tag">${esc(t)}</span>`;
  function detailHtml(d) {
    if (!d) return '<p class="vmx-cap">Tap any square to see the details.</p>';
    return `<div class="vmx-dh"><span class="vmx-gl ${d.c.cls}">${esc(SIGNS[d.c.sign].symbol)}</span><div><b>${esc(d.title)}</b><small>${esc(d.about)}</small></div></div>
      <ul class="vmx-dl"><li><i>Sign</i><span>${esc(d.signName)} <em class="vmx-pill ${d.c.cls}">${esc(WORD[d.c.status] || d.c.status)}</em></span></li>
      <li><i>House</i><span>${ORD(d.c.house)} house from the ${esc(d.key)} Lagna (${esc(d.lagnaName)})</span></li>
      <li><i>Motion</i><span>${d.c.retro ? 'Retrograde in the birth chart' : 'Direct'}</span></li>
      ${d.key === 'D1' ? '' : `<li><i>In D1</i><span>${esc(d.d1Name)}${d.same ? ' (same sign)' : ''}</span></li>`}</ul>
      ${d.vot ? `<p class="vmx-note"><b>★ Vargottama.</b> ${esc(d.planet)} holds the same sign in D1 and D9, which many traditions read as extra strength for that planet.</p>` : ''}`;
  }
  function matrixHtml(M) {
    const head = `<div class="vmx-r vmx-hd"><span class="vmx-lb"></span><span class="vmx-hc vmx-lg">Lg</span>${GR.map(p => `<span class="vmx-hc" title="${p}">${esc(G(p))}</span>`).join('')}</div>`;
    const body = M.rows.map(r => `<div class="vmx-r"><span class="vmx-lb"><b>${esc(r.key)}</b><small>${esc(r.name)}</small></span><span class="vmx-lc">${esc(SIGNS[r.lagna].symbol)}</span>${r.cells.map((c, i) => {
      if (!c) return '<span class="vmx-c vmx-none">–</span>';
      const d1 = M.d1 ? cellOf(lastChart, 'D1', GR[i]) : null, same = d1 && d1.sign === c.sign, vot = r.key === 'D9' && same;
      return `<button type="button" class="vmx-c ${c.cls}${same && r.key !== 'D1' ? ' vmx-same' : ''}${vot ? ' vmx-vot' : ''}${pick.k === r.key && pick.p === GR[i] ? ' vmx-on' : ''}" data-k="${r.key}" data-p="${GR[i]}" onclick="VMX.tap('${r.key}','${GR[i]}')" aria-label="${GR[i]} in ${r.key} ${esc(r.name)}: ${esc(SIGNS[c.sign].name)}, ${esc(WORD[c.status] || c.status)}${vot ? ', Vargottama' : ''}">${esc(SIGNS[c.sign].symbol)}${c.retro ? '<i class="vmx-rt">R</i>' : ''}${vot ? '<i class="vmx-st">★</i>' : ''}</button>`;
    }).join('')}</div>`).join('');
    return `<div class="vmx-mx" role="group" aria-label="Planet signs and dignity across divisional charts">${head}${body}</div>`;
  }
  function bodyHtml(chart, id) {
    const M = compute(chart, id), s = SETS.find(x => x.id === id), top = M.ranked.slice(0, 3), low = M.ranked.slice(-3).reverse();
    if (!M.rows.some(r => r.key === pick.k)) pick = { k: M.rows[0].key, p: pick.p };
    const bar = s => { const w = Math.round((s.pts + 2 * s.n) / (4 * s.n) * 100); return `<div class="vmx-pb"><span class="vmx-pn">${esc(G(s.planet))} ${esc(s.planet)}</span><span class="vmx-bar"><i style="width:${w}%"></i></span><span class="vmx-pv">${s.good}<small>/${s.n}</small></span></div>`; };
    return `<div class="vmx-stats"><div><b>${M.rows.length}</b><small>Charts</small></div><div class="vmx-sg"><b>${M.vot.length}</b><small>Vargottama</small></div><div class="vmx-sg"><b>${M.strong}</b><small>Strong spots</small></div><div class="vmx-sr"><b>${M.weak}</b><small>Weak spots</small></div></div>
      <div class="vmx-card"><h4>Planets across the charts</h4><p class="vmx-cap">${esc(s.note)} Rows are charts, columns are planets. Lg is the Lagna of that chart. Tap a square.</p>${matrixHtml(M)}
        <div class="vmx-legend"><span><i class="vx-ex"></i>Exalted</span><span><i class="vx-ow"></i>Own sign</span><span><i class="vx-fr"></i>Friendly</span><span><i class="vx-ne"></i>Neutral</span><span><i class="vx-en"></i>Enemy</span><span><i class="vx-de"></i>Debilitated</span></div>
        <div class="vmx-legend vmx-key"><span>★ Vargottama</span><span>◻ same sign as D1</span><span>R retrograde</span></div></div>
      <div class="vmx-card" id="vmxDetail" aria-live="polite">${detailHtml(detail(chart, pick.k, pick.p))}</div>
      <div class="vmx-sum"><div class="vmx-good"><h5>✦ Strongest across charts</h5>${top.map(bar).join('')}</div><div class="vmx-warn"><h5>◈ Needs the most care</h5>${low.map(bar).join('')}</div></div>
      <div class="vmx-card"><h4>Vargottama planets</h4>${M.vot.length ? `<p class="vmx-cap">Same sign in D1 and D9.</p><div class="vmx-chips">${M.vot.map(p => `<span>★ ${esc(G(p))} ${esc(p)} <em>${esc(SIGNS[cellOf(chart, 'D1', p).sign].name)}</em></span>`).join('')}</div>` : '<p class="vmx-cap">No planet holds the same sign in D1 and D9 in this chart.</p>'}</div>
      <div class="vmx-card"><h4>Every planet, ranked</h4><p class="vmx-cap">Bar is dignity points across the shown charts. The number is how many charts place the planet in an exalted, own or friendly sign.</p>${M.ranked.map(bar).join('')}</div>
      <p class="vmx-fine">Dignity is how comfortable a planet is in a sign. Points are a teaching aid, not a verdict, and Rahu and Ketu follow the convention used elsewhere in this app. Read these with the whole chart. ${tag('Teaching aid')}</p>`;
  }
  function html(chart) {
    lastChart = chart;
    const lg = SIGNS[chart.vargas.D1.ascendantSign];
    return `<div class="vmx"><div class="vmx-banner"><span class="vmx-orn" aria-hidden="true">◫</span><h3>Varga Matrix</h3><p>All nine planets across your divisional charts in one grid. The colour is how comfortable each planet is in its sign.</p><div class="vmx-now"><span>Lagna</span><b>${esc(lg.symbol)} ${esc(lg.name)}</b></div></div>
      <div class="vmx-sets" role="tablist" aria-label="Which charts to show">${SETS.map(s => `<button type="button" role="tab" class="${s.id === setId ? 'vmx-on' : ''}" data-set="${s.id}" onclick="VMX.setSet('${s.id}')">${esc(s.t)}</button>`).join('')}</div>
      <div id="vmxBody">${bodyHtml(chart, setId)}</div></div>`;
  }
  function text(chart, id) {
    const M = compute(chart, id || 'shodasha');
    return M.rows.map(r => `${r.key} ${r.name} (Lagna ${SIGNS[r.lagna].name}): ` + GR.map((p, i) => r.cells[i] ? `${p} ${SIGNS[r.cells[i].sign].name} ${r.cells[i].status}` : `${p} –`).join(', ')).join('\n');
  }
  const api = {
    compute, cellOf, detail, keysFor, html, text, GR, SETS,
    setSet(id) { setId = id; document.querySelectorAll('.vmx-sets button').forEach(b => b.classList.toggle('vmx-on', b.getAttribute('data-set') === id)); const el = document.getElementById('vmxBody'); if (el && lastChart) el.innerHTML = bodyHtml(lastChart, id); },
    tap(k, p) { pick = { k, p }; document.querySelectorAll('.vmx-c.vmx-on').forEach(b => b.classList.remove('vmx-on')); document.querySelectorAll('.vmx-c').forEach(b => { if (b.getAttribute('data-k') === k && b.getAttribute('data-p') === p) b.classList.add('vmx-on'); }); const el = document.getElementById('vmxDetail'); if (el && lastChart) el.innerHTML = detailHtml(detail(lastChart, k, p)); }
  };
  window.buildVargaMatrixPanel = function (chart) { return html(chart); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-vargamatrix', window.buildVargaMatrixPanel);
  window.VMX = api;
  return api;
})();

/* Compare Lab (experiment): a full-screen canvas in the Divisional Charts tab to put up to 4 charts side by side
   (D1 vs D9, any chart vs any chart). Three-dot menu (top left) adds charts. Tap a planet in any chart to follow it
   across all charts. Below the charts: a planet-by-chart table and plain-language notes about what matches and what differs.
   Global: CMPLAB { open, close, add, setCards, text }. Chart data comes from window.__vgC (set when the chart is built). */
window.CMPLAB = (function () {
  'use strict';
  const KEY = 'vx-cmplab-v1', MAX = 4, LET = ['A', 'B', 'C', 'D'];
  const STYLES = [['north', '◇', 'North Indian'], ['south', '▦', 'South Indian'], ['west', '◯', 'Western wheel']];
  const POPULAR = ['D1', 'D9', 'D10', 'D2', 'D3', 'D4', 'D7', 'D12', 'D60'];
  const PAIRS = [['D1 vs D9', ['D1', 'D9']], ['D1 vs D10', ['D1', 'D10']], ['D9 vs D10', ['D9', 'D10']], ['D1 vs D2', ['D1', 'D2']], ['D1 · D9 · D10', ['D1', 'D9', 'D10']], ['D1 · D2 · D4 · D9', ['D1', 'D2', 'D4', 'D9']]];
  const STRONG = ['Exalted', 'OwnSign', 'Moolatrikona'], WEAK = ['Debilitated'];
  const nice = s => s === 'OwnSign' ? 'Own sign' : s;
  let st = { cards: [], focus: null, style: 'north' }, root = null, uid = 0, menuOpen = false;

  const chart = () => window.__vgC || window.currentChartForModal || null;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const abbr = si => SIGNS[si].name.slice(0, 3);
  const keys = () => Object.keys(VARGAS);

  function save() { try { localStorage.setItem(KEY, JSON.stringify({ cards: st.cards.map(c => ({ k: c.k, sty: c.sty })), style: st.style })); } catch (e) {} }
  function restore() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && Array.isArray(s.cards)) {
        st.style = STYLES.some(x => x[0] === s.style) ? s.style : 'north';
        return s.cards.filter(c => VARGAS[c.k]).slice(0, MAX).map(c => ({ id: ++uid, k: c.k, sty: STYLES.some(x => x[0] === c.sty) ? c.sty : st.style }));
      }
    } catch (e) {}
    return null;
  }

  /* ---------- data helpers ---------- */
  function info(c, k) {
    const v = c.vargas[k]; if (!v) return null;
    const asc = v.ascendantSign, byName = {};
    v.houses.forEach(h => h.planets.forEach(p => { byName[p.name] = p; }));
    const rows = {};
    PLANET_LIST.forEach(n => {
      const sign = v.planetVargaSign[n], house = ((sign - asc + 12) % 12) + 1, p = byName[n] || {};
      const stt = (p.dignity && p.dignity.status) || '';
      rows[n] = { sign, house, st: stt, rx: !!p.retrograde, strong: STRONG.includes(stt), weak: WEAK.includes(stt) };
    });
    return { k, v, asc, rows, lord: SIGNS[asc].lord };
  }
  const htype = h => ([1, 4, 7, 10].includes(h) ? 'K' : [5, 9].includes(h) ? 'T' : [6, 8, 12].includes(h) ? 'D' : 'O');
  function infos() { const c = chart(); if (!c) return []; return st.cards.map(cd => info(c, cd.k)).filter(Boolean); }

  /* ---------- compare logic ---------- */
  function compare(A, B) {
    const same = [], sameH = [], both = [], mixed = [];
    PLANET_LIST.forEach(n => {
      const a = A.rows[n], b = B.rows[n];
      if (a.sign === b.sign) same.push(n);
      if (a.house === b.house) sameH.push(n);
      if (a.strong && b.strong) both.push(n);
      if ((a.strong && b.weak) || (a.weak && b.strong)) mixed.push(n);
    });
    return { same, sameH, both, mixed };
  }
  const gl = n => (PLANET_GLYPHS[n] || '') + ' ' + n;
  const list = a => a.map(gl).join(', ');
  function notes(I) {
    if (I.length < 2) return [];
    const A = I[0], out = [];
    for (let i = 1; i < I.length; i++) {
      const B = I[i], c = compare(A, B), L = [];
      L.push(c.same.length
        ? `${c.same.length} of 9 planets sit in the same sign in both charts (${list(c.same)}). Those planets tend to tell a consistent story in both areas of life.`
        : 'No planet sits in the same sign in both charts, so the two charts describe their areas of life quite independently.');
      if (c.sameH.length) L.push(`Same house in both: ${list(c.sameH)}.`);
      L.push(c.both.length ? `Strong in both charts (own, exalted or moolatrikona): ${list(c.both)}. These are the most dependable supports across the two.` : 'No planet is in an own, exalted or moolatrikona sign in both charts.');
      if (c.mixed.length) L.push(`Mixed signals: ${list(c.mixed)} ${c.mixed.length > 1 ? 'are' : 'is'} strong in one chart and debilitated in the other. Read ${c.mixed.length > 1 ? 'them' : 'it'} as strong in one area and under strain in the other.`);
      const lA = A.rows[A.lord] && A.rows[A.lord].house, lB = B.rows[B.lord] && B.rows[B.lord].house;
      if (lA && lB) L.push(`Lagna lord: ${A.lord} sits in house ${lA} of ${A.k}, and ${B.lord} sits in house ${lB} of ${B.k}.`);
      out.push({ title: `${A.k} (A) compared with ${B.k} (${LET[i]})`, lines: L });
    }
    return out;
  }
  function counts(i) { const c = { K: 0, T: 0, D: 0 }; PLANET_LIST.forEach(n => { const t = htype(i.rows[n].house); if (c[t] !== undefined) c[t]++; }); return c; }
  function journey(I, p) {
    return I.map((i, x) => { const r = i.rows[p]; return { tag: `${LET[x]} · ${i.k}`, sign: SIGNS[r.sign].name, house: r.house, st: r.st, rx: r.rx }; });
  }

  function text() {
    const I = infos(); if (!I.length) return 'Compare Lab is empty.';
    let t = 'Compare Lab: ' + I.map((i, x) => `${LET[x]} ${i.k} (${VARGAS[i.k].name}, ${SIGNS[i.asc].name} rising)`).join('  |  ') + '\n\n';
    t += 'Planet'.padEnd(10) + I.map((i, x) => `${LET[x]} ${i.k}`.padEnd(22)).join('') + '\n';
    PLANET_LIST.forEach(n => { t += n.padEnd(10) + I.map(i => { const r = i.rows[n]; return `${abbr(r.sign)} H${r.house}${r.st && r.st !== 'Neutral' ? ' ' + nice(r.st) : ''}${r.rx ? ' R' : ''}`.padEnd(22); }).join('') + '\n'; });
    notes(I).forEach(n => { t += '\n' + n.title + '\n' + n.lines.map(l => '- ' + l).join('\n') + '\n'; });
    return t;
  }

  /* ---------- rendering ---------- */
  function cardHtml(cd, x, n) {
    const c = chart(), v = c.vargas[cd.k], m = VARGAS[cd.k];
    const opts = keys().map(k => `<option value="${k}"${k === cd.k ? ' selected' : ''}>${k} · ${esc(VARGAS[k].name)}</option>`).join('');
    const sty = STYLES.map(s => `<button type="button" class="cl-sty${s[0] === cd.sty ? ' on' : ''}" data-act="style" data-id="${cd.id}" data-v="${s[0]}" title="${s[2]}" aria-label="${s[2]}">${s[1]}</button>`).join('');
    return `<section class="cl-card" data-id="${cd.id}">
      <header><span class="cl-let">${LET[x]}</span>
        <select class="cl-sel" data-act="pick" data-id="${cd.id}" aria-label="Chart ${LET[x]}">${opts}</select>
        <span class="cl-sty-grp">${sty}</span>
        ${x > 0 ? `<button type="button" class="cl-ic" data-act="first" data-id="${cd.id}" title="Make this the first chart (A)" aria-label="Make first">⇱</button>` : ''}
        <button type="button" class="cl-ic" data-act="del" data-id="${cd.id}" title="Remove" aria-label="Remove chart">✕</button></header>
      <div class="cl-meta"><b>${esc(m.full)}</b><span>${SIGNS[v.ascendantSign].symbol} ${SIGNS[v.ascendantSign].name} rising</span></div>
      <div class="cl-svg">${buildInteractiveVargaSvg(v, m, cd.sty, null)}</div>
    </section>`;
  }
  function tableHtml(I) {
    const head = I.map((i, x) => `<th>${LET[x]} · ${i.k}</th>`).join('');
    let body = `<tr class="cl-lag"><th>Lagna</th>${I.map((i, x) => `<td class="${x && i.asc === I[0].asc ? 'same' : ''}">${abbr(i.asc)}</td>`).join('')}<td></td></tr>`;
    PLANET_LIST.forEach(n => {
      const rs = I.map(i => i.rows[n]), allSign = rs.every(r => r.sign === rs[0].sign), allHouse = rs.every(r => r.house === rs[0].house);
      body += `<tr data-p="${n}" class="${st.focus === n ? 'foc' : ''}"><th><span style="color:${PCOL[n]}">${PLANET_GLYPHS[n]}</span> ${n}</th>` + rs.map((r, x) => {
        const dot = r.strong ? '<i class="g" title="strong"></i>' : r.weak ? '<i class="r" title="debilitated"></i>' : '';
        return `<td class="${x && r.sign === rs[0].sign ? 'same' : ''}">${abbr(r.sign)} <small>H${r.house}</small>${dot}${r.rx ? '<em>R</em>' : ''}</td>`;
      }).join('') + `<td class="cl-st">${allSign ? '<span class="g" title="same sign in every chart">★ same sign</span>' : allHouse ? '<span title="same house in every chart">same house</span>' : ''}</td></tr>`;
    });
    const cnt = I.map(counts);
    body += `<tr class="cl-cnt"><th>Kendra · Trikona · Dusthana</th>${cnt.map(c => `<td>${c.K} · ${c.T} · ${c.D}</td>`).join('')}<td></td></tr>`;
    return `<div class="cl-sec"><h3>Planet by chart</h3><p class="cl-sub">Gold cells share the sign of chart A. Tap a planet row to follow it. Green dot: own, exalted or moolatrikona. Red dot: debilitated.</p>
      <div class="cl-tw"><table class="cl-tbl"><thead><tr><th></th>${head}<th></th></tr></thead><tbody>${body}</tbody></table></div></div>`;
  }
  function focusHtml(I) {
    if (!st.focus) return '';
    const p = st.focus, J = journey(I, p);
    return `<div class="cl-sec cl-focus"><h3><span style="color:${PCOL[p]}">${PLANET_GLYPHS[p]}</span> ${p} across your charts <button type="button" class="cl-ic" data-act="unfocus" aria-label="Stop following">✕</button></h3>
      <div class="cl-j">${J.map(j => `<div><small>${j.tag}</small><b>${j.sign}</b><span>House ${j.house}${j.st && j.st !== 'Neutral' ? ' · ' + esc(nice(j.st)) : ''}${j.rx ? ' · retrograde' : ''}</span></div>`).join('')}</div></div>`;
  }
  function notesHtml(I) {
    const N = notes(I); if (!N.length) return '';
    return `<div class="cl-sec"><h3>What this comparison shows</h3>${N.map(n => `<div class="cl-note"><h4>${esc(n.title)}</h4><ul>${n.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>`).join('')}
      <p class="cl-sub">These are patterns in the chart data, read as tendencies. They are not predictions, and a chart is best read as a whole by a trained astrologer.</p></div>`;
  }
  function menuHtml() {
    const full = st.cards.length >= MAX;
    const chip = k => `<button type="button" class="cl-chip" data-act="add" data-k="${k}"${full ? ' disabled' : ''}><b>${k}</b> ${esc(VARGAS[k].name)}</button>`;
    return `<div class="cl-menu" role="menu">
      <h5>Add a chart ${full ? '<em>(4 is the maximum)</em>' : ''}</h5>
      <div class="cl-chips">${POPULAR.map(chip).join('')}</div>
      <details><summary>All ${keys().length} charts</summary><div class="cl-chips">${keys().filter(k => !POPULAR.includes(k)).map(chip).join('')}</div></details>
      <h5>Quick comparisons</h5>
      <div class="cl-chips">${PAIRS.map((p, i) => `<button type="button" class="cl-chip" data-act="pair" data-i="${i}">${p[0]}</button>`).join('')}</div>
      <h5>Style for all charts</h5>
      <div class="cl-chips">${STYLES.map(s => `<button type="button" class="cl-chip${st.style === s[0] ? ' on' : ''}" data-act="allstyle" data-v="${s[0]}">${s[1]} ${s[2]}</button>`).join('')}</div>
      <h5>More</h5>
      <div class="cl-chips"><button type="button" class="cl-chip" data-act="copy">📋 Copy comparison</button><button type="button" class="cl-chip" data-act="clear">🗑 Clear all</button></div>
    </div>`;
  }
  function render() {
    if (!root) return;
    const c = chart(), keep = root.querySelector('.cl-scroll'), y = keep ? keep.scrollTop : 0;
    if (!c) { root.innerHTML = '<div class="cl-empty"><p>Cast a chart first, then open the Compare Lab.</p><button type="button" class="cl-chip" data-act="close">Close</button></div>'; return; }
    const I = infos();
    root.innerHTML = `<div class="cl-bar">
        <div class="cl-dots-wrap"><button type="button" class="cl-dots" data-act="menu" aria-label="Menu" aria-expanded="${menuOpen}">⋮</button>${menuOpen ? menuHtml() : ''}</div>
        <div class="cl-title"><b>Compare Lab</b><span class="cl-exp">Experiment</span></div>
        <button type="button" class="cl-x" data-act="close" aria-label="Close">✕</button></div>
      <div class="cl-scroll"><div class="cl-wrap">
        ${st.cards.length ? `<div class="cl-grid n${st.cards.length}">${st.cards.map((cd, x) => cardHtml(cd, x)).join('')}${st.cards.length < MAX ? `<button type="button" class="cl-add" data-act="menu"><span>＋</span>Add a chart</button>` : ''}</div>`
          : `<div class="cl-empty"><p>Your canvas is empty.</p><button type="button" class="cl-chip" data-act="menu">⋮ Open the menu to add a chart</button></div>`}
        ${I.length === 1 ? '<p class="cl-hint">Add a second chart to compare. Try D9 next to D1.</p>' : ''}
        ${focusHtml(I)}${I.length >= 2 ? tableHtml(I) + notesHtml(I) : ''}
      </div></div>`;
    root.querySelector('.cl-scroll').scrollTop = y;
    applyFocus();
  }
  function applyFocus() {
    root.querySelectorAll('.ch-pl').forEach(g => { const on = st.focus && g.getAttribute('data-p') === st.focus; g.classList.toggle('cl-hit', !!on); g.classList.toggle('cl-dim', !!st.focus && !on); });
  }

  /* ---------- actions ---------- */
  const find = id => st.cards.find(c => String(c.id) === String(id));
  function add(k) { if (!VARGAS[k] || st.cards.length >= MAX) return false; st.cards.push({ id: ++uid, k, sty: st.style }); save(); return true; }
  function setCards(ks) { st.cards = []; ks.slice(0, MAX).forEach(add); save(); }
  function toast(msg) { const t = document.createElement('div'); t.className = 'cl-toast'; t.textContent = msg; root.appendChild(t); setTimeout(() => t.remove(), 1800); }
  function onClick(e) {
    const f = e.target.closest('.ch-pl[data-p]');
    if (f && root.contains(f)) { const p = f.getAttribute('data-p'); st.focus = st.focus === p ? null : p; render(); return; }
    const tr = e.target.closest('tr[data-p]');
    if (tr && root.contains(tr)) { const p = tr.getAttribute('data-p'); st.focus = st.focus === p ? null : p; render(); return; }
    const b = e.target.closest('[data-act]'); if (!b || !root.contains(b)) { if (menuOpen && !e.target.closest('.cl-menu')) { menuOpen = false; render(); } return; }
    const a = b.dataset.act, id = b.dataset.id;
    if (a === 'menu') { menuOpen = !menuOpen; render(); return; }
    if (a === 'close') { close(); return; }
    if (a === 'add') { add(b.dataset.k); menuOpen = false; render(); return; }
    if (a === 'pair') { setCards(PAIRS[+b.dataset.i][1]); menuOpen = false; render(); return; }
    if (a === 'allstyle') { st.style = b.dataset.v; st.cards.forEach(c => { c.sty = st.style; }); save(); render(); return; }
    if (a === 'style') { const c = find(id); if (c) { c.sty = b.dataset.v; save(); render(); } return; }
    if (a === 'del') { st.cards = st.cards.filter(c => String(c.id) !== String(id)); save(); render(); return; }
    if (a === 'first') { const c = find(id); if (c) { st.cards = [c, ...st.cards.filter(x => x !== c)]; save(); render(); } return; }
    if (a === 'unfocus') { st.focus = null; render(); return; }
    if (a === 'clear') { st.cards = []; st.focus = null; menuOpen = false; save(); render(); return; }
    if (a === 'copy') {
      const t = text(); menuOpen = false; render();
      (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Comparison copied'), () => toast('Could not copy on this browser'));
    }
  }
  function onChange(e) { const s = e.target.closest('select[data-act="pick"]'); if (!s) return; const c = find(s.dataset.id); if (c) { c.k = s.value; save(); render(); } }
  function onKey(e) { if (e.key === 'Escape' && root) { if (menuOpen) { menuOpen = false; render(); } else close(); } }

  function open(first) {
    if (root) return;
    const c = chart();
    root = document.createElement('div'); root.id = 'cmpLab'; root.className = 'cl-root'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Compare Lab');
    document.body.appendChild(root); document.body.classList.add('cl-open');
    st.focus = null; menuOpen = false;
    const saved = restore();
    if (saved && saved.length) st.cards = saved;
    else { const k = VARGAS[first] ? first : 'D1'; st.cards = []; add(k); add(k === 'D9' ? 'D1' : 'D9'); }
    root.addEventListener('click', onClick); root.addEventListener('change', onChange); document.addEventListener('keydown', onKey);
    render();
    return !!c;
  }
  function close() {
    if (!root) return;
    document.removeEventListener('keydown', onKey); root.remove(); root = null; document.body.classList.remove('cl-open');
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('#vxLabBtn'); if (!b) return;
    const sel = document.getElementById('vargaSelect'); open(sel && sel.value);
  });
  return { open, close, add, setCards, text, isOpen: () => !!root, cards: () => st.cards.map(c => c.k) };
})();

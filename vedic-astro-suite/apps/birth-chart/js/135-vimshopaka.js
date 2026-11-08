/* Vimshopaka Bala (js/135): a planet's strength out of 20 from its sign in a set of divisional charts. BPHS ch.7 slokas 17-27 (Santhanam translation).
   Four sets (each weight list adds to 20): Shadvarga, Saptavarga, Dashavarga, Shodashavarga. Points per sign: own 20, adhi-mitra 18, mitra 15, sama 10, shatru 7, adhi-shatru 5 (BPHS sloka 25),
   scaled by the chart's weight. Relation = compound (natural + temporary) friendship of the planet toward the sign lord, taken from the BIRTH chart (D1) positions of both, then applied in every varga.
   Bands (BPHS sloka 26-27): under 5 no good results, 5-10 some, 10-15 middling, over 15 wholly favourable.
   Sources: BPHS translation (archive.org BPHSEnglish, ch.7), saravali.github.io/astrology/vargas.html (weights). The BPHS scan is garbled for the Sapta/Dasa lists: Saptavarga was taken as 5,2,3,2.5,4.5,2,1 (adds to 20; the saravali page has its column shifted) and Dashavarga as saravali gives (adds to 20).
   Single-source choices, said on the page: exalted and moolatrikona signs count as own (20) and debilitated signs as 0 (saravali); the Shodashavarga list is rebuilt from BPHS "the rest nine halves" (the saravali table sums to 19.5).
   Seven grahas only. Uses AVS.compound (js/134), chart.vargas[key].planetVargaSign (js/15), getDignity (js/07). Tendencies only. Classes vim- prefixed. */
const VIM = (() => {
  const GRAHA = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const SETS = {
    Shadvarga: { label: 'Shadvarga (6 charts)', w: { D1: 6, D2: 2, D3: 4, D9: 5, D12: 2, D30: 1 } },
    Saptavarga: { label: 'Saptavarga (7 charts)', w: { D1: 5, D2: 2, D3: 3, D7: 2.5, D9: 4.5, D12: 2, D30: 1 } },
    Dashavarga: { label: 'Dashavarga (10 charts)', w: { D1: 3, D2: 1.5, D3: 1.5, D7: 1.5, D9: 1.5, D10: 1.5, D12: 1.5, D16: 1.5, D30: 1.5, D60: 5 } },
    Shodashavarga: { label: 'Shodashavarga (16 charts)', w: { D1: 3.5, D2: 1, D3: 1, D4: 0.5, D7: 0.5, D9: 3, D10: 0.5, D12: 0.5, D16: 2, D20: 0.5, D24: 0.5, D27: 0.5, D30: 1, D40: 0.5, D45: 0.5, D60: 4 } }
  };
  const PTS = { Own: 20, AdhiMitra: 18, Mitra: 15, Sama: 10, Shatru: 7, AdhiShatru: 5, Debilitated: 0 };
  const REL = { Own: 'own sign', AdhiMitra: 'great friend', Mitra: 'friend', Sama: 'neutral', Shatru: 'enemy', AdhiShatru: 'great enemy', Debilitated: 'debilitated' };
  const BANDS = [[15, 'wholly favourable'], [10, 'middling'], [5, 'some good results'], [0, 'little help']];
  const band = t => (BANDS.find(b => t > b[0]) || BANDS[BANDS.length - 1])[1];

  /* relation of a planet placed in varga sign s: Own / exalted / MT = own; debilitated = 0; else compound relation to the sign lord (D1 positions) */
  function relIn(chart, name, s, key) {
    if (OWN_SIGNS[name].includes(s)) return 'Own';
    const ex = EXALTATION[name]; if (s === ex.sign) return 'Own';
    if (s === getDebilitation(name).sign) return 'Debilitated';
    const lord = SIGNS[s].lord, lp = chart.planets[lord], pp = chart.planets[name];
    return AVS.compound(name, lord, pp.sign, lp.sign);
  }

  function compute(chart, setName) {
    const set = SETS[setName || 'Shadvarga'], out = {};
    GRAHA.forEach(name => {
      let total = 0; const rows = [];
      Object.keys(set.w).forEach(key => {
        const s = chart.vargas[key].planetVargaSign[name], r = relIn(chart, name, s, key);
        const pts = set.w[key] * PTS[r] / 20; total += pts;
        rows.push({ varga: key, vname: VARGAS[key].name, sign: SIGNS[s].name, rel: r, relText: REL[r], weight: set.w[key], points: pts });
      });
      out[name] = { total, band: band(total), rows };
    });
    return { set: setName || 'Shadvarga', label: set.label, planets: out };
  }

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const f1 = n => (Math.round(n * 100) / 100).toString();
  let ST = { set: 'Shadvarga', open: '' };
  function body(chart) {
    const D = compute(chart, ST.set);
    return GRAHA.map(name => {
      const p = D.planets[name], pct = Math.min(100, p.total / 20 * 100), cl = p.total > 15 ? 'ok' : p.total > 10 ? 'mid' : 'low', on = ST.open === name;
      return `<div class="vim-pl${on ? ' on' : ''}"><button type="button" class="vim-bar" data-vim="open" data-p="${name}" aria-expanded="${on}">
        <span class="vim-n">${name}</span><span class="vim-track"><span class="vim-fill ${cl}" style="width:${pct.toFixed(1)}%"></span></span><span class="vim-v">${f1(p.total)}<small>/20</small></span></button>
        <div class="vim-band">${esc(p.band)}</div>
        ${on ? `<div class="vim-tbl"><table><thead><tr><th>Chart</th><th>Sign</th><th>Relation</th><th>Pts</th></tr></thead><tbody>${p.rows.map(r => `<tr><td><b>${r.varga}</b><small class="vim-vn">${esc(r.vname)}</small></td><td>${esc(r.sign)}</td><td>${esc(r.relText)}</td><td>${f1(r.points)}<small> /${f1(r.weight)}</small></td></tr>`).join('')}</tbody></table></div>` : ''}</div>`;
    }).join('');
  }
  function html(chart, profile) {
    return `<div class="vim"><div class="vim-hero"><h3>Vimshopaka Bala</h3><p>A strength score out of <b>20</b> for each planet, built from how it sits in the divisional charts. Higher tends to mean its promise holds up better. Tap a planet to see every chart.</p></div>
      <div class="vim-seg" role="tablist">${Object.keys(SETS).map(k => `<button type="button" role="tab" class="${ST.set === k ? 'on' : ''}" data-vim="set" data-s="${k}">${k}</button>`).join('')}</div>
      <div class="vim-set">${esc(SETS[ST.set].label)}</div>
      <div id="vimBody">${body(chart)}</div>
      <details class="vim-note"><summary>How this is worked out</summary>
        <p>Each divisional chart has a weight; the weights of a set add to 20. A planet earns a share of that weight by the sign it occupies there: own sign all of it, a great friend's sign 90%, a friend's 75%, a neutral's 50%, an enemy's 35%, a great enemy's 25%.</p>
        <p>Friendship is the compound kind (natural plus temporary), taken from the birth chart and applied in every divisional chart. Exalted and moolatrikona signs count as own and debilitated signs as zero, which one source states; the plain BPHS text lists only the six relations.</p>
        <p>Bands follow Brihat Parashara Hora Shastra chapter 7: under 5 little help, 5 to 10 some good results, 10 to 15 middling, over 15 wholly favourable. The Saptavarga and Dashavarga weights are checked by their sum (20) because the old text is damaged. Rahu and Ketu are not scored.</p>
        <p>This is one clue. Read it with the sign, house and Dasha.</p></details></div>`;
  }
  function text(chart, setName) {
    const D = compute(chart, setName || 'Shadvarga');
    return D.label + '\n' + GRAHA.map(n => `${n}: ${f1(D.planets[n].total)}/20 (${D.planets[n].band})`).join('\n');
  }
  function bind() {
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-vim]'); if (!b) return;
      const root = b.closest('.vim'); if (!root) return;
      const chart = typeof currentChartForModal !== 'undefined' ? currentChartForModal : null; if (!chart) return;
      if (b.dataset.vim === 'set') { ST.set = b.dataset.s; root.querySelectorAll('.vim-seg button').forEach(x => x.classList.toggle('on', x.dataset.s === ST.set)); root.querySelector('.vim-set').textContent = SETS[ST.set].label; }
      else ST.open = ST.open === b.dataset.p ? '' : b.dataset.p;
      root.querySelector('#vimBody').innerHTML = body(chart);
    });
  }
  if (typeof document !== 'undefined' && document.addEventListener) bind();
  window.buildVimshopakaPanel = function (chart, profile) { return html(chart, profile || {}); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-vimshopaka', window.buildVimshopakaPanel);
  return { compute, html, text, SETS, PTS, relIn, band, state: ST, GRAHA };
})();

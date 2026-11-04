/* ============================================================================
   MEANING LAB (Home > Analysis, and the left quick menu)
   Free workspace: add ANY pieces (planet, house, sign, house lord, nakshatra, Dasha lord) and read the raw meaning of each from the
   existing Vedic Knowledge Database (VDB, js/87) side by side. Where the database has a text for a pair (planet in house, lord in house,
   planet in sign, conjunction, aspect) it is shown as an optional "link". Nothing is concluded for you: you write your own meaning per
   piece and one combined reading. Your pieces and notes are saved on this device (localStorage vedicMeaningLab_v1).
   Global: ML { html, text }, buildMeaningLabPanel(chart, profile). Delegated events (data-ml). No new astrology rules are added here.
   ============================================================================ */
const ML = (function(){
  const KEY = 'vedicMeaningLab_v1';
  const PL = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  const SG = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const GL = { Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋' };
  const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th'));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const TYPES = [['planet','Planet'],['house','House'],['sign','Sign'],['lord','House lord'],['nak','Nakshatra'],['dasha','Dasha lord']];
  let S = { items: [], notes: {}, big: '', links: true }, chart = null;
  function load(){ try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && Array.isArray(j.items)) S = Object.assign(S, j); } catch(e){} }
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} }
  load();
  const D = () => (typeof VDB !== 'undefined' && VDB) ? VDB.data : null;
  const key = it => it.t + ':' + it.v;
  function label(it){
    if (it.t === 'planet') return GL[it.v] + ' ' + it.v;
    if (it.t === 'house') return ord(+it.v) + ' house';
    if (it.t === 'sign') return SG[+it.v];
    if (it.t === 'lord') return ord(+it.v) + ' lord';
    if (it.t === 'nak'){ const n = D() && D().nakshatras[+it.v]; return n ? n.name : 'Nakshatra'; }
    if (it.t === 'dasha') return it.v + ' Dasha';
    return it.v;
  }
  /* what the chart says about a house lord: { planet, sign, house } or null */
  function lordInChart(n){
    if (!chart) return null;
    try { const sign = (chart.ascendant.sign + (+n) - 1) % 12, lord = (typeof SIGNS !== 'undefined' ? SIGNS[sign].lord : D().signs[sign].lord), p = chart.planets[lord];
      return p ? { planet: lord, sign: p.sign, house: p.house } : null; } catch(e){ return null; }
  }
  /* base meaning (from the database) as a list of [heading, text] */
  function base(it){
    const d = D(); if (!d) return [];
    try {
      if (it.t === 'planet'){ const p = d.planets[it.v]; return [['Stands for', p.signifies], ['Nature', p.nature], ['Body', p.body], ['Strong', p.strong], ['Weak', p.weak]].filter(x => x[1]); }
      if (it.t === 'house'){ const h = d.houses[+it.v - 1]; return [[h.name + ' (' + h.sk + ')', h.short], ['Rules', h.rules], ['Karaka', h.karaka], ['Kind', h.kind]].filter(x => x[1]); }
      if (it.t === 'sign'){ const s = d.signs[+it.v]; return [['Ruler', s.lord], ['Style', s.style], ['Channel', s.channel], ['Element', s.element + ' · ' + s.quality]].filter(x => x[1]); }
      if (it.t === 'lord'){ const h = d.houses[+it.v - 1]; return [['Carries the themes of', h.short], ['Rules', h.rules]]; }
      if (it.t === 'nak'){ const n = d.nakshatras[+it.v]; return [['Lord', n.lord + ' · ' + n.deity], ['Nature', n.trait], ['Fields', n.careers], ['Watch', n.watch]].filter(x => x[1]); }
      if (it.t === 'dasha'){ const x = d.dasha[it.v]; return x ? [['Period', x.years], ['Tends to bring', x.text]] : []; }
    } catch(e){}
    return [];
  }
  /* database links between two pieces (order does not matter) */
  function links(a, b){
    const out = [], V = (typeof VDB !== 'undefined') ? VDB : null; if (!V) return out;
    const pair = (x, y) => {
      try {
        if (x.t === 'planet' && y.t === 'house'){ const r = V.planetInHouse(x.v, +y.v); if (r) out.push([x.v + ' in the ' + ord(+y.v) + ' house', r.text]); const q = V.aspectOnHouse(x.v, +y.v); if (q) out.push([x.v + ' aspecting the ' + ord(+y.v) + ' house', q]); }
        if (x.t === 'planet' && y.t === 'sign'){ const r = V.planetInSign(x.v, +y.v); if (r) out.push([x.v + ' in ' + SG[+y.v], r.text]); }
        if (x.t === 'lord' && y.t === 'house'){ const r = V.lordInHouse(+x.v, +y.v); if (r) out.push([ord(+x.v) + ' lord in the ' + ord(+y.v) + ' house', r]); }
        if (x.t === 'planet' && y.t === 'planet' && x.v !== y.v){ const c = V.conjunction(x.v, y.v); if (c) out.push([x.v + ' with ' + y.v, c]); const p1 = V.planetAspect(x.v, y.v); if (p1) out.push([x.v + ' aspecting ' + y.v, p1]); const p2 = V.planetAspect(y.v, x.v); if (p2) out.push([y.v + ' aspecting ' + x.v, p2]); }
      } catch(e){}
    };
    pair(a, b); if (!out.length) pair(b, a);
    return out;
  }
  function valueOptions(t){
    if (t === 'planet' || t === 'dasha') return PL.map(p => [p, GL[p] + ' ' + p]);
    if (t === 'house' || t === 'lord') return Array.from({ length: 12 }, (_, i) => [i + 1, ord(i + 1) + (t === 'lord' ? ' lord' : ' house')]);
    if (t === 'sign') return SG.map((s, i) => [i, s]);
    if (t === 'nak'){ const d = D(); return d ? d.nakshatras.map((n, i) => [i, n.name]) : []; }
    return [];
  }
  function add(t, v){ v = (t === 'planet' || t === 'dasha') ? v : +v; if (S.items.some(x => x.t === t && String(x.v) === String(v))) return; S.items.push({ t, v }); save(); }
  function fromChart(planet){
    if (!chart || !chart.planets[planet]) return;
    const p = chart.planets[planet]; add('planet', planet); add('sign', p.sign); add('house', p.house);
  }
  function html(c){
    if (c) chart = c;
    const opts = t => valueOptions(t).map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('');
    const chartRow = chart ? `<div class="ml-row"><label>From my chart<select id="mlFrom">${PL.map(p => `<option>${p}</option>`).join('')}</select></label><button type="button" class="ml-btn" data-ml="from">+ Planet, its sign and house</button></div>` : '';
    return `<div class="ml">
      <div class="ml-intro"><b>Meaning Lab.</b> Pick any pieces, in any combination. Each shows its raw meaning from your Knowledge Database. You do the reading: add your own meaning to each piece and write the combined result below.</div>
      <div class="ml-add"><div class="ml-row"><label>Add<select id="mlType">${TYPES.map(t => `<option value="${t[0]}">${t[1]}</option>`).join('')}</select></label>
        <label>Which<select id="mlVal">${opts('planet')}</select></label><button type="button" class="ml-btn pri" data-ml="add">+ Add</button></div>${chartRow}</div>
      <div id="mlOut"></div></div>`;
  }
  function render(){
    const out = document.getElementById('mlOut'); if (!out) return;
    if (!S.items.length){ out.innerHTML = '<div class="ml-empty">Nothing added yet. Try a planet and a house, or a house lord and a house, and read them side by side.</div>'; return; }
    const cards = S.items.map((it, i) => {
      const rows = base(it).map(r => `<div class="ml-kv"><small>${esc(r[0])}</small><span>${esc(r[1])}</span></div>`).join('');
      let lc = ''; if (it.t === 'lord'){ const l = lordInChart(it.v); if (l) lc = `<div class="ml-chart">In your chart: <b>${GL[l.planet]} ${l.planet}</b> in ${SG[l.sign]}, ${ord(l.house)} house <button type="button" class="ml-mini" data-ml="addlord" data-i="${i}">add ${esc(l.planet)} + house</button></div>`; }
      return `<div class="ml-card t-${it.t}"><div class="ml-ch"><b>${esc(label(it))}</b><small>${TYPES.find(t => t[0] === it.t)[1]}</small><button type="button" class="ml-x" data-ml="del" data-i="${i}" aria-label="Remove">✕</button></div>${rows}${lc}
        <textarea class="ml-note" data-ml="note" data-k="${esc(key(it))}" placeholder="My meaning for ${esc(label(it))} (saved on this device)">${esc(S.notes[key(it)] || '')}</textarea></div>`;
    }).join('');
    let lk = '';
    if (S.links && S.items.length > 1){
      const seen = new Set(), rows = [];
      for (let i = 0; i < S.items.length; i++) for (let j = i + 1; j < S.items.length; j++){ links(S.items[i], S.items[j]).forEach(r => { if (!seen.has(r[0])){ seen.add(r[0]); rows.push(r); } }); }
      lk = `<div class="ml-links"><h4>Links from the database <small>optional, tap to read</small></h4>${rows.length ? rows.map(r => `<details><summary>${esc(r[0])}</summary><p>${esc(r[1])}</p></details>`).join('') : '<p class="ml-dim">No ready-made text for these pieces together. Use your own reading below.</p>'}</div>`;
    }
    out.innerHTML = `<div class="ml-cards">${cards}</div>${lk}
      <div class="ml-big"><h4>My combined reading</h4><textarea id="mlBig" placeholder="Rahu means … and the 7th lord means … so together …">${esc(S.big || '')}</textarea></div>
      <div class="ml-bar"><button type="button" class="ml-btn" data-ml="copy">📋 Copy everything</button><label class="ml-sw"><input type="checkbox" id="mlLinks" ${S.links ? 'checked' : ''}> show database links</label><button type="button" class="ml-btn ghost" data-ml="clear">Clear pieces</button></div>`;
  }
  function text(){
    const L = ['MEANING LAB'];
    S.items.forEach(it => { L.push('', label(it).toUpperCase()); base(it).forEach(r => L.push(' - ' + r[0] + ': ' + r[1])); if (S.notes[key(it)]) L.push(' MY MEANING: ' + S.notes[key(it)]); });
    if (S.big) L.push('', 'MY COMBINED READING', S.big);
    return L.join('\n');
  }
  document.addEventListener('change', e => {
    if (e.target.id === 'mlType'){ const v = document.getElementById('mlVal'); v.innerHTML = valueOptions(e.target.value).map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join(''); }
    if (e.target.id === 'mlLinks'){ S.links = e.target.checked; save(); render(); }
  });
  document.addEventListener('input', e => {
    const t = e.target; if (!t.dataset) return;
    if (t.dataset.ml === 'note'){ S.notes[t.dataset.k] = t.value; save(); }
    if (t.id === 'mlBig'){ S.big = t.value; save(); }
  });
  document.addEventListener('click', e => {
    const b = e.target.closest ? e.target.closest('[data-ml]') : null; if (!b || b.tagName === 'TEXTAREA') return;
    const a = b.dataset.ml, i = +b.dataset.i;
    if (a === 'add'){ add(document.getElementById('mlType').value, document.getElementById('mlVal').value); render(); }
    else if (a === 'from'){ fromChart(document.getElementById('mlFrom').value); render(); }
    else if (a === 'del'){ S.items.splice(i, 1); save(); render(); }
    else if (a === 'addlord'){ const l = lordInChart(S.items[i].v); if (l){ add('planet', l.planet); add('house', l.house); add('sign', l.sign); render(); } }
    else if (a === 'clear'){ S.items = []; save(); render(); }
    else if (a === 'copy'){ try { copyTextToClipboard(text(), b, '📋 Copy everything'); } catch(err){ try { navigator.clipboard.writeText(text()); } catch(e2){} } }
  });
  window.buildMeaningLabPanel = function(c){ const h = html(c); setTimeout(render, 0); return h; };
  return { html, text, render };
})();

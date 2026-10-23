/* ============================================================================
   PLANET STATES, screens (js/103): adds the PST blocks (js/102) to the Planets tab cards (VDR.planetBlock), the report text (VDR.reportText) and the PDF planet pages.
   Hand-written; no new calculations. Tested by tests/planet_states_test.py.
   ============================================================================ */
(function(){
'use strict';
if (typeof PST === 'undefined' || !PST) return;
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const html = (c, n) => { const b = PST.block(c, n); if (!b) return ''; return `<div class="ps"><div class="rd-h">🎛️ State of ${esc(n)}: ${b.tags.map(esc).join(' · ')}</div>${b.lines.map(l => `<div class="dr-l"><b>${l.e} ${esc(l.h)}</b><div>${esc(l.text)}</div></div>`).join('')}</div>`; };
const pdf = (c, n) => { const b = PST.block(c, n); return b ? b.lines.map(l => `<h5>${l.e} ${esc(l.h)}</h5><p>${esc(l.text)}</p>`).join('') : ''; };
const wrap = (t, w, ind) => { const words = String(t).split(/\s+/), out = []; let ln = ''; words.forEach(x => { if ((ln + ' ' + x).trim().length > w && ln){ out.push(ln); ln = ind + x; } else ln = (ln ? ln + ' ' : '') + x; }); if (ln) out.push(ln); return out.join('\n'); };
const reportText = c => PST.all(c).map(b => `${b.planet.toUpperCase()}: ${b.tags.join(', ')}\n` + b.lines.map(l => wrap('  ' + l.h + ': ' + l.text, 74, '      ')).join('\n')).join('\n\n');
window.PSTUI = { html, pdf, reportText };
if (window.VDR){
  const pb = VDR.planetBlock, rt = VDR.reportText;
  VDR.planetBlock = (c, n) => pb(c, n) + html(c, n);
  VDR.reportText = c => rt(c) + '\n\nPLANET STATES (WHAT EACH PLANET\'S CONDITION MEANS, WITH EXAMPLES)\n' + reportText(c);
}
})();

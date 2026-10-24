/* ============================================================================
   SHADBALA READING, screens (js/106): the "💪 Strength" tab of Chart Reading, the report text and the PDF Shadbala pages, all from SBR (js/105).
   SBRUI.pane(chart) -> HTML      SBRUI.pdf(chart) -> HTML      SBRUI.text(chart) -> plain text
   Hand-written; no calculations. Styles: css/45-shadbala-reading.css. Tested by tests/shadbala_reading_test.py.
   ============================================================================ */
(function(){
'use strict';
if (typeof SBR === 'undefined' || !SBR) return;
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const GL = { Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃', Venus: '♀', Saturn: '♄' };
const tone = p => p >= 100 ? 'g' : p < 80 ? 'b' : '';
const R = c => SBR.assess(c);
const wrap = (t, w, ind) => { const words = String(t).split(/\s+/), out = []; let ln = ''; words.forEach(x => { if ((ln + ' ' + x).trim().length > w && ln){ out.push(ln); ln = ind + x; } else ln = (ln ? ln + ' ' : '') + x; }); if (ln) out.push(ln); return out.join('\n'); };

function pane(c){
  const a = R(c); if (!a.planets.length) return '<div class="vx-note"><div>Strength data is not available for this chart.</div></div>';
  const bars = a.ranking.map(x => `<div class="sbr-bar"><span>${GL[x.planet]} ${esc(x.planet)}</span><div class="dr-bar"><i class="${tone(x.pct)}" style="width:${Math.min(100, x.pct / 2)}%"></i><u style="left:50%"></u></div><b>${x.pct}%</b></div>`).join('');
  const six = a.six.map(s => `<div class="sbr-six"><span>${s.e}</span><div><b>${esc(s.name)}</b><small>${esc(s.plain)}</small><p>${esc(s.what.charAt(0).toUpperCase() + s.what.slice(1))}.</p></div></div>`).join('');
  const card = x => `<details class="dr-vg sbr-card" id="sbr-${esc(x.planet)}"><summary><span class="sbr-g">${GL[x.planet]}</span><b>${esc(x.planet)}</b><small>${x.rupas.toFixed(2)} of ${x.required} rupas · ${x.rank === 1 ? 'strongest' : x.rank === 7 ? 'thinnest' : '#' + x.rank + ' of 7'}</small><span class="vx-chip ${tone(x.pct)}">${x.pct}%</span></summary><div class="dr-vg-b">` +
    x.groups.map(g => `<h5><span class="sbr-bub">${g.e}</span>${esc(g.h)}</h5>${g.lines.map((l, i) => `<div class="sbr-l${(g.id === 'sthana' || g.id === 'kala') && i > 0 ? ' sbr-sub' : ''}"><h6>${esc(l.h)}</h6>${l.what ? `<p class="sbr-what">${esc(l.what)}</p>` : ''}<p class="dr-p sbr-read">${esc(l.read)}</p></div>`).join('')}`).join('') + `</div></details>`;
  return `<div class="sbr"><div class="hn-hero"><h2>💪 Your strength map</h2><p>Shadbala is the classical six-fold measure of how much strength each planet has to deliver its results. Below, every part of it is explained and read for your chart: position, direction, time, motion, natural strength and aspects.</p>` +
    `<div class="hn-hero-tags"><div class="hn-tag g">🌟 Strongest: ${esc(a.strongest)} (${a.ranking[0].pct}%)</div><div class="hn-tag b">🛠️ Needs most support: ${esc(a.weakest)} (${a.ranking[a.ranking.length - 1].pct}%)</div></div></div>` +
    `<div class="vx-note"><div>🔎 A planet needs <b>100%</b> of its requirement to count as strong. A planet below 100% is not "bad": it is the one that needs more support from the house it stands in, the planets that look at it and the running periods. These are tendencies, not predictions.</div></div>` +
    `<div class="rd-h">📊 How strong is each planet?</div><div class="sbr-bars">${bars}</div><small class="sbr-axis">The line in the middle marks 100%, the classical minimum.</small>` +
    `<div class="rd-h">🧩 The six strengths in plain words</div><div class="sbr-sixes">${six}</div>` +
    `<div class="rd-h">📖 Each planet in depth <small>(tap a planet to open it)</small></div>${a.planets.map(card).join('')}</div>`;
}
function pdf(c){
  const a = R(c); if (!a.planets.length) return '';
  return `<h3 class="grp">What each kind of strength means for you</h3><p class="lead">The six sources of strength are explained below, planet by planet, with what each one tends to do in daily life and what helps.</p>` +
    a.planets.map(x => `<div class="plate hn-plate"><div class="pl-head"><div class="pl-glyph">${GL[x.planet]}</div><div><small>${x.rupas.toFixed(2)} of ${x.required} rupas · ${x.pct}% of the requirement</small><h3>${esc(x.planet)}: ${esc(x.bandText)}</h3></div></div>` +
      x.groups.map(g => `<h5>${g.e} ${esc(g.h)}</h5>${g.lines.map(l => `<p><b>${esc(l.h)}.</b> ${esc(l.text)}</p>`).join('')}`).join('') + `</div>`).join('');
}
function text(c){
  const a = R(c); const o = ['SHADBALA READING: WHAT EACH KIND OF STRENGTH MEANS FOR YOU', ''];
  a.planets.forEach(x => { o.push(`${x.planet.toUpperCase()}: ${x.pct}% of the requirement (${x.rupas.toFixed(2)} of ${x.required} rupas)`); x.groups.forEach(g => { o.push('  ' + g.h); g.lines.forEach(l => o.push(wrap('    ' + l.h + ': ' + l.text, 74, '        '))); }); o.push(''); });
  return o.join('\n');
}
window.SBRUI = { pane, pdf, text };
const P = window.PDFR;
if (P && P.h){ const old = P.extraCss; P.extraCss = th => (old ? old(th) : '') + `.hn-plate{break-before:page}`; }
})();

/* ============================================================================
   ASHTAKAVARGA READING, screens (js/108): the "🔢 Ashtakavarga" tab of Chart Reading, the report text and the PDF Ashtakavarga pages, all from AVR (js/107).
   AVRUI.pane(chart) -> HTML      AVRUI.pdf(chart) -> HTML      AVRUI.text(chart) -> plain text
   Hand-written; no calculations. Styles: css/46-ashtakavarga-reading.css. Tested by tests/ashtakavarga_reading_test.py.
   ============================================================================ */
(function(){
'use strict';
if (typeof AVR === 'undefined' || !AVR) return;
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ordn = n => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
const GL = { Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃', Venus: '♀', Saturn: '♄' };
const cls = b => b <= 2 ? 'b' : b >= 5 ? 'g' : '';
const R = c => AVR.assess(c, { now: new Date() });
const wrap = (t, w, ind) => { const words = String(t).split(/\s+/), out = []; let ln = ''; words.forEach(x => { if ((ln + ' ' + x).trim().length > w && ln){ out.push(ln); ln = ind + x; } else ln = (ln ? ln + ' ' : '') + x; }); if (ln) out.push(ln); return out.join('\n'); };

function pane(c){
  const a = R(c); if (!a) return '<div class="vx-note"><div>Ashtakavarga data is not available for this chart.</div></div>';
  const S = a.sav, bh = S.houses[S.best - 1], th = S.houses[S.thin - 1], mx = Math.max.apply(null, S.houses.map(x => x.points));
  const bars = S.houses.map(x => `<div class="avr-bar"><span>${x.emoji} ${ordn(x.h)}</span><div class="dr-bar"><i class="${x.tier === 'top' || x.tier === 'high' ? 'g' : x.tier === 'low' || x.tier === 'bottom' ? 'b' : ''}" style="width:${(x.points / mx * 100).toFixed(0)}%"></i><u style="left:${(S.avg / mx * 100).toFixed(1)}%"></u></div><b>${x.points}</b></div>`).join('');
  const hcards = S.houses.map(x => `<details class="dr-vg avr-card"><summary><span class="avr-e">${x.emoji}</span><b>${ordn(x.h)} house · ${esc(x.theme)}</b><small>${esc(x.sign)}</small><span class="vx-chip ${x.tier === 'top' || x.tier === 'high' ? 'g' : x.tier === 'low' || x.tier === 'bottom' ? 'b' : ''}">${x.points} points</span></summary><div class="dr-vg-b"><p class="dr-p avr-read">${esc(x.text)}</p></div></details>`).join('');
  const axes = S.axes.map(x => `<div class="avr-l"><h6>${x.diff >= 4 ? '💪' : x.diff <= -4 ? '🛠️' : '⚖️'} ${esc(x.name)} <small>${x.points} points</small></h6><p class="dr-p avr-read">${esc(x.text)}</p></div>`).join('');
  const planet = p => `<details class="dr-vg avr-card avr-pl" id="avr-${esc(p.planet)}"><summary><span class="avr-g">${GL[p.planet]}</span><b>${esc(p.planet)}</b><small>${p.total} points to place · best: ${p.best.map(ordn).join(', ')}</small><span class="vx-chip">${p.total}</span></summary><div class="dr-vg-b">` +
    `<div class="avr-strip">${p.houses.map(x => `<span class="avr-cell ${cls(x.b)}" title="${ordn(x.h)} house"><i>${ordn(x.h)}</i><b>${x.b}</b></span>`).join('')}</div>` +
    p.sections.map(s => `<div class="avr-l"><h6><span class="avr-bub">${s.e}</span>${esc(s.h)}</h6><p class="dr-p avr-read">${esc(s.text)}</p></div>`).join('') +
    `<h5 class="avr-h5"><span class="avr-bub">🏠</span>${esc(p.planet)} in each of your twelve houses</h5>` +
    p.houses.map(x => `<div class="avr-l avr-hs"><h6><span class="avr-bub">${x.emoji}</span>${ordn(x.h)} house · ${esc(x.sign)} <small>${x.b} of 8 points</small></h6><p class="dr-p avr-read">${esc(x.text)}</p></div>`).join('') + `</div></details>`;
  return `<div class="avr"><div class="hn-hero"><h2>🔢 Your points map</h2><p>Ashtakavarga gives every planet a fixed number of points to place across the twelve signs. More points in a house means that planet supports that area of life better, and its passages through that house tend to go more smoothly. Here it is read in full: first the combined map, then each planet, then each planet in each house.</p>` +
    `<div class="hn-hero-tags"><div class="hn-tag g">🌟 Best-supplied house: ${ordn(bh.h)} (${esc(bh.theme)}, ${bh.points} points)</div><div class="hn-tag b">🛠️ Thinnest house: ${ordn(th.h)} (${esc(th.theme)}, ${th.points} points)</div></div></div>` +
    `<div class="vx-note"><div>🔎 <b>How to read the numbers.</b> For one planet in one house: 0 to 2 points is thin support, 3 to 4 is balanced (4 is the average), 5 is good, and 6 to 8 is strong. For a whole house, the average is about 28 points. These are tendencies to plan with, not predictions.</div></div>` +
    `<div class="rd-h">📊 The combined map (all seven planets)</div><div class="avr-bars">${bars}</div><small class="avr-axis">The line marks the average of ${S.avg.toFixed(1)} points a house.</small><div class="vx-note g"><div>${esc(S.text)}</div></div>` +
    `<div class="rd-h">🏠 House by house <small>(tap to open)</small></div>${hcards}` +
    `<div class="rd-h">🧭 Life axes</div>${axes}` +
    `<div class="rd-h">🪐 Planet by planet <small>(each planet, then that planet in all twelve houses)</small></div>${a.planets.map(planet).join('')}</div>`;
}
function pdf(c){
  const a = R(c); if (!a) return ''; const S = a.sav;
  let out = `<h3 class="grp">The combined map, house by house</h3><p class="lead">${esc(S.text)}</p>` + S.houses.map(x => `<p><b>${x.emoji} ${ordn(x.h)} house, ${esc(x.theme)} (${esc(x.sign)}, ${x.points} points).</b> ${esc(x.text)}</p>`).join('') + `<h3 class="grp">Life axes</h3>` + S.axes.map(x => `<p>${esc(x.text)}</p>`).join('');
  out += a.planets.map(p => `<div class="plate hn-plate"><div class="pl-head"><div class="pl-glyph">${GL[p.planet]}</div><div><small>${p.total} points to place · best houses ${p.best.map(ordn).join(', ')}</small><h3>${esc(p.planet)}: points and houses</h3></div></div>` +
    p.sections.map(s => `<h5>${s.e} ${esc(s.h)}</h5><p>${esc(s.text)}</p>`).join('') + `<h5>🏠 ${esc(p.planet)} in each of your twelve houses</h5>` + p.houses.map(x => `<p><b>${x.emoji} ${ordn(x.h)} house, ${esc(x.sign)}, ${x.b} of 8 points.</b> ${esc(x.text)}</p>`).join('') + `</div>`).join('');
  return out;
}
function text(c){
  const a = R(c); if (!a) return ''; const S = a.sav, o = ['ASHTAKAVARGA READING: POINTS, PLANET BY PLANET AND HOUSE BY HOUSE', '', wrap(S.text, 78, ''), ''];
  S.houses.forEach(x => o.push(wrap(`${ordn(x.h)} house, ${x.theme} (${x.sign}, ${x.points} points): ${x.text}`, 74, '    '))); o.push(''); S.axes.forEach(x => o.push(wrap(x.text, 74, '    '))); o.push('');
  a.planets.forEach(p => { o.push(`${p.planet.toUpperCase()}: ${p.total} points`); p.sections.forEach(s => o.push(wrap('  ' + s.h + ': ' + s.text, 74, '      '))); p.houses.forEach(x => o.push(wrap(`  ${p.planet} in the ${ordn(x.h)} house (${x.sign}, ${x.b} of 8): ${x.text}`, 74, '      '))); o.push(''); });
  return o.join('\n');
}
window.AVRUI = { pane, pdf, text };
})();

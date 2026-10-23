/* ============================================================================
   HOUSE RIGHT NOW, screens (js/101): the first tab of Chart Reading ("🌅 Right now"), the report text and the PDF section, all from HNW (js/100).
   HNW.pane(chart) -> HTML      HNW.reportText(chart) -> plain text      PDFR section 'now' (first page of the Time part)
   Hand-written; no new calculations here. Styles: css/43-house-now.css. Tested by tests/house_now_test.py.
   ============================================================================ */
(function(){
'use strict';
if (typeof HNW === 'undefined' || !HNW) return;
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ordn = n => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], fd = d => d ? MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear() : '';
const GL = { Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋' };
const TONE = { g: '🟢', b: '🔴', '': '🟡' };
const A = c => HNW.assess(c, { now: new Date() });

function pane(c){
  const a = A(c), D = a.dasha, nowS = new Date().toUTCString().slice(5, 16);
  const tile = (lab, d) => d ? `<div class="vx-t"><label>${lab}</label><b>${esc(d.lord)}</b><small>${fd(d.startDate)} to ${fd(d.endDate)}</small></div>` : '';
  const chips = a.houses.map(x => `<a class="hn-chip ${x.tone}" href="#hn-h${x.h}" data-hn="${x.h}"><span>${x.emoji}</span><b>${x.h}</b><i>${x.score}</i></a>`).join('');
  const sky = a.sky.map(x => `<div class="hn-sk"><span class="hn-g">${GL[x.n]}</span><div><b>${x.n}${x.rx && x.n !== 'Rahu' && x.n !== 'Ketu' ? ' ℞' : ''}</b><small>${esc(['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][x.sign])} · ${ordn(x.house)} house</small></div><small class="hn-nk">${esc(x.nak)} ${x.pada}</small></div>`).join('');
  const areas = a.areas.map(x => `<div class="hn-ar"><span>${x.icon || ''} ${esc(x.name)}</span><div class="dr-bar"><i class="${x.tone}" style="width:${x.score}%"></i></div><b>${x.score}</b><small>${esc(x.band)}</small></div>`).join('');
  const card = x => `<details class="dr-vg hn-card" id="hn-h${x.h}"><summary><span class="hn-e">${x.emoji}</span><b>${ordn(x.h)} house · ${esc(x.theme.split(',')[0])}</b><small>${esc(x.sign)} · lord ${esc(x.lord)}</small><span class="vx-chip ${x.tone}">${TONE[x.tone]} ${x.score} · ${esc(x.band)}</span></summary><div class="dr-vg-b">${x.sections.map(s => `<h5>${s.e} ${esc(s.h)}</h5>${s.lines.map(l => `<p class="dr-p">${esc(l)}</p>`).join('')}`).join('')}</div></details>`;
  return `<div class="hn"><div class="vx-note g"><div>🌅 <b>Your life right now</b>, read for ${esc(nowS)} (UTC). Every house is read from its sign, lord and natal planets, today's transiting planets, their aspects and nakshatras, and your running Mahadasha, Antardasha and Pratyantar. These are present conditions and tendencies, not predictions of events.</div></div>
  <div class="rd-h">⏳ Running periods</div><div class="vx-grid">${tile('Mahadasha', D.md)}${tile('Antardasha', D.ad)}${tile('Pratyantar', D.pd)}</div>
  <div class="rd-h">📈 How the nine life areas are going</div><div class="hn-ars">${areas}</div>
  <div class="vx-note"><div>🌟 <b>Brightest houses now:</b> ${a.best.map(h => `${a.houses[h - 1].emoji} ${ordn(h)} (${a.houses[h - 1].score})`).join(', ')}. &nbsp; 🛠️ <b>Needing most care:</b> ${a.care.map(h => `${a.houses[h - 1].emoji} ${ordn(h)} (${a.houses[h - 1].score})`).join(', ')}.</div></div>
  <div class="rd-h">🏠 The twelve houses at a glance <small>(tap one to read it)</small></div><div class="hn-chips">${chips}</div>
  <div class="rd-h">🪐 Today's sky</div><div class="hn-sky">${sky}</div>
  <div class="rd-h">📖 Each house in depth</div>${a.houses.map(card).join('')}</div>`;
}
function reportText(c){
  const a = A(c), D = a.dasha, out = ['LIFE RIGHT NOW: THE TWELVE HOUSES', 'Running: ' + ['Mahadasha', 'Antardasha', 'Pratyantar'].map((l, i) => { const d = [D.md, D.ad, D.pd][i]; return d ? l + ' ' + d.lord + ' (' + fd(d.startDate) + ' to ' + fd(d.endDate) + ')' : ''; }).filter(Boolean).join(', '), ''];
  out.push('Life areas: ' + a.areas.map(x => x.name + ' ' + x.score + ' (' + x.band + ')').join('; '), '');
  a.houses.forEach(x => { out.push(`--- ${ordn(x.h)} house: ${x.theme} (${x.sign}, lord ${x.lord}) ${x.score}/100 ${x.band} ---`); x.sections.forEach(s => { out.push(s.h.toUpperCase()); s.lines.forEach(l => out.push('  ' + l)); }); out.push(''); });
  return out.join('\n');
}
window.HNW.pane = pane; window.HNW.reportText = reportText;

document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.hn-chip'); if (!b) return; e.preventDefault(); const t = document.getElementById('hn-h' + b.dataset.hn); if (t){ t.open = true; t.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });

/* ---------- PDF ---------- */
const P = window.PDFR;
if (P && P.h && P.reg){
  const H = P.h, ES = H.esc;
  P.reg('now', 'Your life right now: the twelve houses', 'Each house read from today\'s sky and your running dasha', function(c){
    const a = A(c), D = a.dasha, tile = (l, d) => d ? `<div class="hn-t"><small>${l}</small><b>${ES(d.lord)}</b><span>${fd(d.startDate)} to ${fd(d.endDate)}</span></div>` : '';
    let out = `<p class="lead">Read for ${ES(new Date().toUTCString().slice(5, 16))}. Each house is read from its sign, lord and natal planets, today's transiting planets with their aspects and nakshatras, and your running dasha periods. These are present conditions and tendencies, not predictions.</p>`;
    out += `<div class="hn-tiles">${tile('Mahadasha', D.md)}${tile('Antardasha', D.ad)}${tile('Pratyantar', D.pd)}</div>`;
    out += `<h4 class="hn-h">How the nine life areas are going</h4>` + a.areas.map(x => H.hbar(x.name, x.score, 100, x.band, x.tone)).join('');
    out += `<h4 class="hn-h">Today's sky</h4><table class="tb"><tr><th>Planet</th><th>Sign</th><th>House</th><th>Nakshatra</th></tr>${a.sky.map(x => `<tr><td>${ES(x.n)}${x.rx && x.n !== 'Rahu' && x.n !== 'Ketu' ? ' ℞' : ''}</td><td>${ES(H.SIGN[x.sign])}</td><td>${ordn(x.house)}</td><td>${ES(x.nak)} ${x.pada}</td></tr>`).join('')}</table>`;
    out += a.houses.map(x => `<div class="plate hn-plate"><div class="pl-head"><div class="pl-glyph">${x.h}</div><div><small>${ES(x.sign)} · lord ${ES(x.lord)}</small><h3>${ES(x.theme.split(',')[0])} · ${x.score}/100 · ${ES(x.band)}</h3></div></div>${x.sections.map(s => `<h5>${ES(s.h)}</h5>${s.lines.map(l => `<p>${ES(l)}</p>`).join('')}`).join('')}</div>`).join('');
    return out;
  });
  const i = P.parts.findIndex(p => p.secs.indexOf('timeline') >= 0); if (i >= 0 && P.parts[i].secs.indexOf('now') < 0) P.parts[i].secs.unshift('now');
  const old = P.extraCss; P.extraCss = th => (old ? old(th) : '') + `.hn-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4mm;margin:4mm 0}.hn-t{padding:4mm;border:.3mm solid ${th.rule};border-radius:2mm;background:${th.card}}.hn-t small{display:block;font:600 7.5pt Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:${th.soft}}.hn-t b{display:block;font:700 17pt Georgia,serif;color:${th.accent}}.hn-t span{font:8pt Arial,sans-serif;color:${th.soft}}.hn-h{margin:6mm 0 2mm;font:700 12pt Georgia,serif;color:${th.accent}}.hn-plate p{font-size:10pt;line-height:1.5;margin:0 0 2mm;text-align:left}.hn-plate h5{margin:3mm 0 1mm}`;
}
})();

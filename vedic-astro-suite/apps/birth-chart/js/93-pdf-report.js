/* ============================================================================
   PDF REPORT (PDFR): a beautiful, self-contained printable report + the "PDF Studio" dialog. No libraries, no network.
   PDFR.build(chart, profile, opts)  -> one complete HTML document (inline CSS + inline SVG) = cover, contents, sections, tables, charts, closing page
   PDFR.open()                       -> the Studio: options on the left, live page preview on the right, "Save as PDF" (browser print dialog) and "Download HTML"
   opts: { title, subtitle, preparedBy, theme: 'ivory'|'midnight', paper: 'A4'|'Letter', sections: [ids], asks: bool, why: bool }
   Reads the same engines as the Deep reading (VDB, VMF, VNK, VDA, YGE) and the chart object from computeChart(); nothing is recomputed here.
   "Save as PDF" prints the document inside a hidden iframe, so the PDF contains only the report (page numbers use @page margin boxes where the browser supports them).
   Styles for the Studio dialog: css/40-pdf-studio.css. Tests: tests/pdf_report_test.py.
   ============================================================================ */
(function(){
'use strict';
const SIGN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const PL = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'], P7 = PL.slice(0, 7);
const AB = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' };
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ordn = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtD = d => MON[d.getMonth()] + ' ' + d.getFullYear();
const strip = t => String(t || '').replace(/^[^:]{1,90}: /, '');
const dig = s => !s ? '' : String(s).replace('OwnSign', 'Own sign').replace(/([a-z])([A-Z])/g, '$1 $2');
const SECTIONS = [
  ['overview', 'Your signature at a glance'], ['chart', 'Birth chart and planet positions'], ['foundation', 'Who you are: rising sign, Moon and birth star'],
  ['roles', 'What each planet does for you'], ['yogas', 'Yogas: notable combinations'], ['cautions', 'Points that need care'],
  ['timeline', 'Life timeline (Mahadashas)'], ['houses', 'House by house'], ['strength', 'Strength of the twelve houses']];
const THEMES = {
  ivory:    { name: 'Ivory & gold', cover1: '#fbf6e9', cover2: '#efe2bd', coverInk: '#2b2418', ink: '#262626', soft: '#6b6355', accent: '#a8801f', accent2: '#e9d9a6', rule: '#e4dcc6', card: '#fdfaf1', page: '#ffffff' },
  midnight: { name: 'Midnight & gold', cover1: '#10142b', cover2: '#2a2350', coverInk: '#f6ecd0', ink: '#20222e', soft: '#626675', accent: '#8a6a17', accent2: '#e3cf8d', rule: '#dedbe8', card: '#f8f7fc', page: '#ffffff' } };
const ID = { name: 'Chart', dob: '', tob: '', place: '' };

/* ---------- small building blocks ---------- */
const chip = (t, k) => `<span class="chip ${k || ''}">${esc(t)}</span>`;
const tone = t => /strong|support|easy|helpful|good|positive/i.test(t) ? 'g' : /mild|challeng|strain|hard|pressure/i.test(t) ? 'b' : '';
const card = (h, body, cls) => `<div class="card ${cls || ''}">${h ? `<h4>${h}</h4>` : ''}${body}</div>`;
const sec = (id, n, title, sub, body) => `<section class="sec" id="s-${id}"><header class="sh"><span class="sn">${n}</span><div><h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div></header>${body}</section>`;

/* ---------- North Indian chart as inline SVG (light, print-friendly) ---------- */
function chartSvg(c, th){
  const asc = c.ascendant.sign, byHouse = {}; PL.forEach(n => { const p = c.planets[n]; if (p) (byHouse[p.house] = byHouse[p.house] || []).push(AB[n] + (p.retrograde && n !== 'Rahu' && n !== 'Ketu' ? 'ᴿ' : '')); });
  const A = [0, 0], B = [400, 0], C = [400, 400], D = [0, 400], T = [200, 0], R = [400, 200], Bo = [200, 400], L = [0, 200], O = [200, 200], P1 = [100, 100], P2 = [300, 100], P3 = [300, 300], P4 = [100, 300];
  const H = { 1: [T, P1, O, P2], 2: [A, T, P1], 3: [A, L, P1], 4: [L, P1, O, P4], 5: [L, D, P4], 6: [D, Bo, P4], 7: [Bo, P4, O, P3], 8: [Bo, C, P3], 9: [C, R, P3], 10: [R, P3, O, P2], 11: [R, B, P2], 12: [B, T, P2] };
  const cen = pts => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
  let g = '';
  for (let h = 1; h <= 12; h++){
    const pts = H[h], [cx, cy] = cen(pts), tri = pts.length === 3, list = (byHouse[h] || []).concat(h === 1 ? ['Asc'] : []);
    const sn = ((asc + h - 1) % 12) + 1, nx = tri ? cx : cx, sy = tri ? cy + (cy < 200 ? -26 : 30) : cy - 38;
    g += `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${h === 1 ? th.accent2 : 'none'}" fill-opacity="${h === 1 ? '.45' : '0'}" stroke="${th.accent}" stroke-width="1.6"/>`;
    g += `<text x="${nx.toFixed(0)}" y="${sy.toFixed(0)}" class="cs">${sn}</text>`;
    const cols = list.length > 4 ? 3 : 2, rows = Math.ceil(list.length / cols);
    list.forEach((t, i) => { const r = Math.floor(i / cols), k = Math.min(cols, list.length - r * cols), j = i % cols; g += `<text x="${(cx + (j - (k - 1) / 2) * 34).toFixed(0)}" y="${(cy + 6 + (r - (rows - 1) / 2) * 20).toFixed(0)}" class="${t === 'Asc' ? 'ca' : 'cp'}">${esc(t)}</text>`; });
  }
  g += `<rect x="0" y="0" width="400" height="400" fill="none" stroke="${th.accent}" stroke-width="3"/>`;
  return `<svg class="chart-svg" viewBox="-6 -6 412 412" role="img" aria-label="North Indian birth chart, ${esc(SIGN[asc])} rising">${g}</svg>`;
}

/* ---------- Ashtakavarga (sarva) bars by house, inline SVG ---------- */
function savSvg(c, th){
  const av = c.ashtakavarga && c.ashtakavarga.sav; if (!av) return '';
  const asc = c.ascendant.sign, v = Array.from({ length: 12 }, (_, h) => av[(asc + h) % 12]), max = Math.max.apply(null, v.concat([40])), W = 560, Hh = 230, bw = 32, gap = 13, x0 = 28;
  let g = `<line x1="${x0 - 6}" y1="${Hh - 30}" x2="${W}" y2="${Hh - 30}" stroke="${th.rule}"/>`;
  const avg = v.reduce((a, b) => a + b, 0) / 12, ay = Hh - 30 - (avg / max) * (Hh - 70);
  g += `<line x1="${x0 - 6}" y1="${ay.toFixed(1)}" x2="${W}" y2="${ay.toFixed(1)}" stroke="${th.accent}" stroke-dasharray="4 4" stroke-width="1"/><text x="${W - 2}" y="${(ay - 4).toFixed(1)}" text-anchor="end" class="cl">average ${avg.toFixed(1)}</text>`;
  v.forEach((b, i) => { const h = (b / max) * (Hh - 70), x = x0 + i * (bw + gap), y = Hh - 30 - h, hi = b >= avg + 3, lo = b <= avg - 3;
    g += `<rect x="${x}" y="${y.toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="4" fill="${hi ? th.accent : lo ? '#b9b3a6' : th.accent2}"/><text x="${x + bw / 2}" y="${(y - 5).toFixed(1)}" text-anchor="middle" class="cv">${b}</text><text x="${x + bw / 2}" y="${Hh - 14}" text-anchor="middle" class="cl">${i + 1}</text>`; });
  return `<svg class="bar-svg" viewBox="0 0 ${W + 6} ${Hh}" role="img" aria-label="Ashtakavarga points for each house">${g}</svg>`;
}

/* ---------- section builders (each returns an HTML string) ---------- */
function bOverview(c, o){
  const s = (typeof VMF !== 'undefined' && VMF) ? VMF.signature(c) : null; if (!s) return '';
  return `<p class="lead">A reading that describes tendencies, not fate. Read each line and test it against your own life: where it fits, it is useful; where it does not, trust your experience.</p>` +
    s.items.map(x => `<div class="sig"><span class="ic">${esc(x.icon)}</span><div><b>${esc(x.title)}</b><p>${esc(x.text)}</p></div></div>`).join('');
}
function bChart(c){
  const rows = PL.map(n => { const p = c.planets[n]; if (!p) return ''; const nk = p.nakshatra;
    return `<tr><td><b>${esc(n)}</b></td><td>${esc(SIGN[p.sign])}</td><td>${(p.degInSign || 0).toFixed(1)}°</td><td>${p.house}</td><td>${nk ? esc(nk.name) + ' · ' + nk.pada : ''}</td><td>${esc(dig(p.dignity && p.dignity.status))}${p.retrograde && n !== 'Rahu' && n !== 'Ketu' ? ' · retrograde' : ''}</td></tr>`; }).join('');
  return `<div class="chart-wrap"><div class="chart-box">${chartSvg(c, o_theme)}<p class="cap">${esc(SIGN[c.ascendant.sign])} rising. Numbers are signs (1 = Aries); the highlighted diamond is the 1st house.</p></div>` +
    `<table class="tb"><thead><tr><th>Planet</th><th>Sign</th><th>Degree</th><th>House</th><th>Nakshatra · pada</th><th>Condition</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
let o_theme = THEMES.ivory;
function bFoundation(c, o){
  const r = VDB.reading(c), asc = r.lagna.sign, mo = c.planets.Moon, ll = r.houseLords[0], out = [];
  out.push(card(`${esc(asc)} rising`, `<p>${esc(r.lagna.text)}</p><p class="sm">${esc(ll.lord)}: ${esc(ll.text)}</p>` + ((typeof VMF !== 'undefined' && VMF) ? `<p>${esc(VMF.lagna(c.ascendant.sign).text)}</p>` : '')));
  const mpf = (typeof VMF !== 'undefined' && VMF) ? VMF.moonProfile(mo.sign) : null;
  out.push(card(`Moon in ${esc(SIGN[mo.sign])}${mo.nakshatra ? ', ' + esc(mo.nakshatra.name) : ''}`, `<p>${esc(VDB.data.moonSign[SIGN[mo.sign]])}${mo.nakshatra ? ' ' + esc(mo.nakshatra.trait || '') : ''}</p>` + (mpf ? `<p>${esc(mpf.text)}</p>${o.asks ? `<p class="ask">${esc(mpf.reflect)}</p>` : ''}` : '')));
  const nk = (typeof VNK !== 'undefined' && VNK) ? VNK.forChart(c) : null;
  if (nk && nk.moon){ const m = nk.moon; out.push(card(`Birth star: ${esc(m.nakshatra)}, pada ${m.pada.pada}`, `<p>${esc(m.how)} In close relationships you tend to be ${esc(m.relating)}.</p><p class="sm"><b>Strengths:</b> ${esc((m.strengths || []).join(', '))}. <b>Points to watch:</b> ${esc((m.shadows || []).join(', '))}. <b>Supportive practice:</b> ${esc((m.practices || [''])[0])}</p>`)); }
  if (nk && nk.lagna){ const g = nk.lagna; out.push(card(`Rising nakshatra: ${esc(g.nakshatra)}, pada ${g.pada.pada}`, `<p>${esc(g.how)} In dealings with others you tend to be ${esc(g.relating)}.</p><p class="sm"><b>Strengths:</b> ${esc((g.strengths || []).join(', '))}. <b>Points to watch:</b> ${esc((g.shadows || []).join(', '))}.</p>`)); }
  return out.join('');
}
function bRoles(c){
  if (typeof VMF === 'undefined' || !VMF) return '';
  const F = VDB.functionalNature(c.ascendant.sign), rows = P7.map(n => VMF.role(n, c.ascendant.sign)).filter(Boolean);
  const chips = P7.map(n => `<span class="chip ${F[n].kind === 'Yogakaraka' || F[n].kind === 'Functional benefic' ? 'g' : F[n].kind === 'Functional malefic' ? 'b' : ''}">${esc(n)}: ${esc(F[n].kind.replace('Functional ', ''))}</span>`).join(' ');
  return `<p class="lead">For ${esc(SIGN[c.ascendant.sign])} rising, each planet looks after particular houses. That decides whether it tends to help directly, test you, or give mixed results.</p><div class="chips">${chips}</div>` +
    rows.map(x => card(`${esc(x.planet)} <small>${esc(x.kind)} · house${x.rules.length > 1 ? 's' : ''} ${x.rules.join(' and ')}</small>`, `<p>It ${esc(x.gives)}. It can feel ${esc(x.feels)}. Watch for ${esc(x.watch)}.</p>`)).join('');
}
function yogaCard(x, o){
  return card(`${esc(x.name)} ${x.level ? chip(x.level, x.level === 'strong' ? 'g' : x.level === 'mild' ? 'b' : '') : ''} <small>${esc(x.cat)}</small>`,
    (o.why ? `<p class="sm"><b>Why it shows:</b> ${esc(x.why)}.</p>` : '') + `<p>${esc(x.meaning.charAt(0).toUpperCase() + x.meaning.slice(1))}. In real life, ${esc(x.scenes[0])}; ${esc(x.scenes[1])}. At its best, you ${esc(x.best)}. Watch for ${esc(x.watch)}.${x.note ? ' ' + esc(x.note) : ''}</p>` +
    (x.levelWhy ? `<p class="sm">Strength: ${esc(x.level)} (${esc(x.levelWhy)}).${x.timing ? ' ' + esc(x.timing) : ''}</p>` : (x.timing ? `<p class="sm">${esc(x.timing)}</p>` : '')) + (o.asks ? `<p class="ask">${esc(x.ask)}</p>` : ''), tone(x.tone));
}
function groups(list, o){ const cats = []; list.forEach(x => { if (cats.indexOf(x.cat) < 0) cats.push(x.cat); }); return cats.map(k => `<h3 class="grp">${esc(k)}</h3>` + list.filter(x => x.cat === k).map(x => yogaCard(x, o)).join('')).join(''); }
const isD = x => /^Doshas|^Cautions/.test(x.cat);
function bYogas(c, o){ if (typeof YGE === 'undefined' || !YGE) return ''; const l = YGE.detect(c).filter(x => !isD(x)); return l.length ? `<p class="lead">${l.length} combinations were found by exact rules. Each is a tendency to test against your life, not a promise.</p>` + groups(l, o) : '<p>No notable yoga from the rules in this report was found in this chart.</p>'; }
function bCautions(c, o){ if (typeof YGE === 'undefined' || !YGE) return ''; const l = YGE.detect(c).filter(isD); return l.length ? `<p class="lead">These are areas to look after, not verdicts. Where a condition eases the point, it is listed with it.</p>` + groups(l, o) : '<p>None of the points checked in this report stand out in this chart.</p>'; }
function bTimeline(c, o){
  if (typeof VDA === 'undefined' || !VDA || !c.dashaData) return '';
  const T = VDA.timeline(c), rows = T.periods.map(p => `<tr class="${p.status}"><td><b>${esc(p.lord)}</b></td><td>${fmtD(p.start)} – ${fmtD(p.end)}</td><td>${p.ageStart}–${p.ageEnd}</td><td>${esc(p.theme)}</td><td>${chip(p.tone, tone(p.tone))}</td></tr>`).join('');
  const cards = T.periods.map(p => card(`${esc(p.lord)} Mahadasha <small>${fmtD(p.start)} – ${fmtD(p.end)}${p.status === 'now' ? ' · running now' : ''}</small>`, `<p>${esc(p.text)}</p>${o.asks ? `<p class="ask">${esc(p.reflect)}</p>` : ''}`, p.status === 'now' ? 'now' : '')).join('');
  const up = VDA.upcoming(c, 5), upRows = up.map(r => `<tr><td>${fmtD(r.start)} – ${fmtD(r.end)}</td><td><b>${esc(r.mdLord)}–${esc(r.lord)}</b></td><td>${chip(r.tone, tone(r.tone))}</td><td>${esc(r.blend)}</td></tr>`).join('');
  return `<p class="lead">${esc(VDA.data.intro)}</p><table class="tb"><thead><tr><th>Mahadasha</th><th>Dates</th><th>Age</th><th>Theme</th><th>Tone</th></tr></thead><tbody>${rows}</tbody></table>` +
    (up.length ? `<h3 class="grp">The next five years, sub-period by sub-period</h3><table class="tb"><thead><tr><th>Dates</th><th>Period</th><th>Tone</th><th>What the blend tends to feel like</th></tr></thead><tbody>${upRows}</tbody></table>` : '') + `<h3 class="grp">Every Mahadasha in words</h3>` + cards;
}
function bHouses(c, o){
  const r = VDB.reading(c), D = VDB.data, asc = SIGN.indexOf(r.lagna.sign), out = [];
  for (let n = 1; n <= 12; n++){
    const H = D.houses[n - 1], S = D.signs[(asc + n - 1) % 12], hl = r.houseLords[n - 1], occ = PL.filter(p => r.planets[p] && r.planets[p].house === n);
    out.push(card(`${ordn(n)} house: ${esc(H.name)} <small>${esc(S.name)} · lord ${esc(hl.lord)} in the ${ordn(hl.placedIn || 0)} house</small>`,
      `<p><b>Meaning:</b> ${esc(H.rules)}.</p><p>${esc(strip(hl.text))}</p>` + (occ.length ? occ.map(p => `<p><b>${esc(p)} sits here.</b> ${esc(strip(r.planets[p].inHouse.text))}</p>`).join('') : `<p class="sm">No planet sits here, so the lord's placement and the aspects carry this house.</p>`) +
      (o && o.asks ? `<p class="ask">${esc(H.ask)}</p>` : '')));
  }
  return out.join('');
}
function bStrength(c){
  const av = c.ashtakavarga && c.ashtakavarga.sav; if (!av) return '';
  const asc = c.ascendant.sign, v = Array.from({ length: 12 }, (_, h) => av[(asc + h) % 12]), avg = v.reduce((a, b) => a + b, 0) / 12;
  const hi = v.map((b, i) => [b, i + 1]).sort((a, b) => b[0] - a[0]).slice(0, 3), lo = v.map((b, i) => [b, i + 1]).sort((a, b) => a[0] - b[0]).slice(0, 3), D = VDB.data;
  const nmh = h => `${ordn(h)} house (${D.houses[h - 1].name.toLowerCase()})`;
  return `<p class="lead">Sarva Ashtakavarga points for each house, counted from the rising sign. A house above the average of ${avg.toFixed(1)} tends to get more support; below it tends to need more of your own effort.</p>${savSvg(c, o_theme)}` +
    `<p><b>Best supported:</b> ${hi.map(x => `${nmh(x[1])}, ${x[0]} points`).join('; ')}.</p><p><b>Needs more effort:</b> ${lo.map(x => `${nmh(x[1])}, ${x[0]} points`).join('; ')}.</p>`;
}
const BUILD = { overview: bOverview, chart: bChart, foundation: bFoundation, roles: bRoles, yogas: bYogas, cautions: bCautions, timeline: bTimeline, houses: bHouses, strength: bStrength };
const SUB = { overview: 'The main threads of your chart in plain language', chart: 'Where every planet stands at your birth', foundation: 'The base layer of the whole reading', roles: 'How each planet works for your rising sign', yogas: 'Supportive and notable planet combinations', cautions: 'Areas that deserve extra care', timeline: 'The stages of your life, with dates', houses: 'The twelve areas of life, one by one', strength: 'Where your chart has more or less support' };

/* ---------- the document ---------- */
function css(th, paper){
  const sz = paper === 'Letter' ? 'Letter' : 'A4';
  return `
  @page{size:${sz};margin:17mm 15mm 19mm;@bottom-center{content:counter(page);font:9pt Georgia,serif;color:#8a8576}}
  @page:first{margin:0;@bottom-center{content:none}}
  *{box-sizing:border-box}
  html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{margin:0;font:10.5pt/1.55 Georgia,'Times New Roman',serif;color:${th.ink};background:${th.page}}
  h1,h2,h3,h4{font-family:'Palatino Linotype',Palatino,Georgia,serif;margin:0;font-weight:700}
  p{margin:0 0 7pt}
  .cover{height:297mm;width:100%;display:flex;flex-direction:column;justify-content:space-between;padding:26mm 22mm 20mm;color:${th.coverInk};background:radial-gradient(120% 80% at 80% 0%,${th.cover2},${th.cover1} 70%);break-after:page;position:relative;overflow:hidden}
  .cover::before{content:'';position:absolute;right:-60mm;top:-60mm;width:170mm;height:170mm;border-radius:50%;border:1.2mm solid ${th.accent2};opacity:.55}
  .cover::after{content:'';position:absolute;right:-30mm;top:-30mm;width:110mm;height:110mm;border-radius:50%;border:.5mm solid ${th.accent2};opacity:.55}
  .cover .om{font-size:30pt;color:${th.accent2};letter-spacing:.2em}
  .cover .kick{font:600 9.5pt Arial,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:${th.accent2}}
  .cover h1{font-size:38pt;line-height:1.08;margin:6mm 0 4mm;max-width:150mm}
  .cover .sub{font-size:13pt;opacity:.85;max-width:140mm}
  .cover .rule{height:1.2mm;width:42mm;background:${th.accent2};margin:9mm 0}
  .cover .who{font-size:21pt;font-family:'Palatino Linotype',Palatino,Georgia,serif}
  .cover dl{display:grid;grid-template-columns:auto 1fr;gap:2mm 6mm;margin:6mm 0 0;font-size:11pt}
  .cover dt{opacity:.7;font:600 8.5pt Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;padding-top:1pt}.cover dd{margin:0}
  .cover .foot{font-size:9pt;opacity:.75;display:flex;justify-content:space-between;align-items:flex-end}
  .toc{break-after:page;padding-top:4mm}.toc h2{font-size:22pt;color:${th.accent};margin-bottom:6mm}
  .toc ol{list-style:none;margin:0;padding:0;counter-reset:t}.toc li{counter-increment:t;display:flex;align-items:baseline;gap:4mm;padding:3.2mm 0;border-bottom:.3mm solid ${th.rule};font-size:12pt}
  .toc li::before{content:counter(t);flex:0 0 8mm;height:8mm;border-radius:50%;display:grid;place-items:center;background:${th.accent};color:#fff;font:700 9.5pt Arial,sans-serif}
  .toc li small{display:block;color:${th.soft};font-size:9pt}.toc a{color:inherit;text-decoration:none}
  .toc .how{margin-top:9mm;padding:5mm;border-radius:3mm;background:${th.card};border:.3mm solid ${th.rule};font-size:10pt;color:${th.soft}}
  .sec{margin-top:9mm}.sec:first-of-type{margin-top:0}#s-chart,#s-yogas,#s-timeline,#s-houses{break-before:page;margin-top:0}
  .sh{display:flex;gap:5mm;align-items:center;padding:4mm 5mm;margin:0 0 6mm;border-radius:3mm;background:linear-gradient(90deg,${th.accent2},transparent);border-left:1.6mm solid ${th.accent};break-after:avoid}
  .sh h2{font-size:17pt}.sh p{margin:0;color:${th.soft};font-size:9.5pt}
  .sn{flex:0 0 10mm;height:10mm;border-radius:50%;background:${th.accent};color:#fff;display:grid;place-items:center;font:700 12pt Arial,sans-serif}
  .lead{font-size:11pt;color:${th.soft};margin-bottom:6mm}
  .card{border:.3mm solid ${th.rule};border-left:1.2mm solid ${th.accent2};background:${th.card};border-radius:2mm;padding:4mm 5mm;margin:0 0 4mm;break-inside:avoid}
  .card.g{border-left-color:#4f8a5b}.card.b{border-left-color:#b5683a}.card.now{border-left-color:${th.accent};background:#fff8e1}
  .card h4{font-size:11.5pt;margin-bottom:2mm}.card h4 small{font:400 8.5pt Arial,sans-serif;color:${th.soft};margin-left:2mm}
  .sm{font-size:9pt;color:${th.soft}}.ask{font-size:9.5pt;font-style:italic;color:${th.accent};padding-top:1.5mm;border-top:.25mm dashed ${th.rule}}
  .grp{font-size:12.5pt;color:${th.accent};margin:7mm 0 3mm;padding-bottom:1.5mm;border-bottom:.4mm solid ${th.rule};break-after:avoid}
  .chip{display:inline-block;font:600 7.5pt Arial,sans-serif;padding:.6mm 2.4mm;border-radius:99px;background:#eee9da;color:#5a5240;vertical-align:1pt;margin-left:1mm}
  .chip.g{background:#dcefe0;color:#2f6b3c}.chip.b{background:#f5e0d2;color:#9a4f24}.chips{margin-bottom:5mm}.chips .chip{margin:0 1.5mm 1.5mm 0;font-size:8.5pt;padding:1.2mm 3mm}
  .sig{display:flex;gap:4mm;padding:3.5mm 0;border-bottom:.25mm solid ${th.rule};break-inside:avoid}.sig .ic{flex:0 0 9mm;font-size:15pt;color:${th.accent}}.sig b{font-size:11pt}.sig p{margin:1mm 0 0}
  .tb{width:100%;border-collapse:collapse;font:9pt Arial,sans-serif;margin:0 0 6mm}
  .tb th{background:${th.accent};color:#fff;text-align:left;padding:2mm 2.4mm;font-weight:600}.tb td{padding:2mm 2.4mm;border-bottom:.25mm solid ${th.rule};vertical-align:top}
  .tb tr:nth-child(even) td{background:${th.card}}.tb tr.now td{background:#fff3c9}.tb tr.past td{color:${th.soft}}.tb tr{break-inside:avoid}
  .chart-wrap{display:grid;grid-template-columns:76mm 1fr;gap:6mm;align-items:start}.chart-box{break-inside:avoid}
  .chart-svg{width:100%;height:auto;background:#fffdf6;border-radius:2mm}.chart-svg .cp{font:700 15px Arial,sans-serif;fill:${th.ink};text-anchor:middle}.chart-svg .ca{font:700 13px Arial,sans-serif;fill:${th.accent};text-anchor:middle}.chart-svg .cs{font:11px Arial,sans-serif;fill:${th.soft};text-anchor:middle}
  .cap{font:8.5pt Arial,sans-serif;color:${th.soft};margin-top:2mm}
  .bar-svg{width:100%;height:auto;margin:2mm 0 5mm}.bar-svg .cv{font:700 11px Arial,sans-serif;fill:${th.ink}}.bar-svg .cl{font:10px Arial,sans-serif;fill:${th.soft}}
  .end{text-align:center;padding-top:30mm;color:${th.soft}}.end h2{color:${th.accent};font-size:20pt;margin-bottom:5mm}.end p{max-width:130mm;margin:0 auto 4mm}
  @media screen{html{background:#d9d6cc}body{max-width:210mm;margin:0 auto;box-shadow:0 6px 40px rgba(0,0,0,.25)}.cover{height:297mm}.sec,.toc{padding:0 15mm}.toc{padding-top:18mm;padding-bottom:12mm}.sec{padding-top:15mm;padding-bottom:6mm;border-top:.4mm solid ${th.rule}}.end{padding-bottom:20mm}}
  @media screen and (max-width:600px){body{font-size:10pt}.chart-wrap{grid-template-columns:1fr}.cover{padding:16mm 10mm;height:auto;min-height:260mm}.cover h1{font-size:28pt}}
  @media print{.card,.sig,.tb tr{break-inside:avoid}}`;
}
function build(chart, profile, opts){
  opts = Object.assign({ theme: 'ivory', paper: 'A4', asks: true, why: true, sections: SECTIONS.map(s => s[0]) }, opts || {});
  const th = THEMES[opts.theme] || THEMES.ivory; o_theme = th;
  const pr = Object.assign({}, ID, profile || {}), asc = SIGN[chart.ascendant.sign], mo = chart.planets.Moon, su = chart.planets.Sun;
  const title = opts.title || 'Vedic Birth Chart Reading', subtitle = opts.subtitle || 'A personal reading of your chart: character, strengths, timing and the points that deserve care';
  const chosen = SECTIONS.filter(s => opts.sections.indexOf(s[0]) >= 0);
  const bodies = chosen.map((s, i) => { let html = ''; try { html = BUILD[s[0]](chart, opts); } catch (e) { html = ''; } return html ? sec(s[0], i + 1, s[1], SUB[s[0]], html) : null; });
  const used = chosen.filter((s, i) => bodies[i]);
  const today = new Date(), made = today.getDate() + ' ' + MON[today.getMonth()] + ' ' + today.getFullYear();
  const birth = [pr.dob, pr.tob].filter(Boolean).join(', ');
  const cover = `<div class="cover"><div><div class="om">ॐ</div></div><div><div class="kick">Vedic astrology</div><h1>${esc(title)}</h1><div class="sub">${esc(subtitle)}</div><div class="rule"></div><div class="who">${esc(pr.name || 'Your chart')}</div>` +
    `<dl>${birth ? `<dt>Born</dt><dd>${esc(birth)}</dd>` : ''}${pr.place ? `<dt>Place</dt><dd>${esc(pr.place)}</dd>` : ''}<dt>Rising</dt><dd>${esc(asc)}</dd><dt>Moon</dt><dd>${esc(SIGN[mo.sign])}${mo.nakshatra ? ', ' + esc(mo.nakshatra.name) : ''}</dd><dt>Sun</dt><dd>${esc(SIGN[su.sign])}</dd></dl></div>` +
    `<div class="foot"><span>${opts.preparedBy ? 'Prepared by ' + esc(opts.preparedBy) : 'Prepared with care'}</span><span>${esc(made)}</span></div></div>`;
  const toc = `<div class="toc"><h2>Contents</h2><ol>${used.map(s => `<li><a href="#s-${s[0]}"><b>${esc(s[1])}</b><small>${esc(SUB[s[0]])}</small></a></li>`).join('')}</ol><div class="how"><b>How to read this report.</b> Everything here describes tendencies drawn from the position of the planets at your birth. It is not a prediction of fixed events. Read each section with the questions in mind, keep what fits your life and let the rest go.</div></div>`;
  const end = `<section class="end"><h2>A last word</h2><p>Astrology offers a language for reflection. It cannot replace medical, legal, financial or psychological advice, and nothing here is a promise about what will happen.</p><p>Your choices, effort and circumstances shape your life far more than any chart. Use this reading to understand yourself better, then act on what you learn.</p><p class="sm">${esc(title)} · ${esc(pr.name || '')} · ${esc(made)}</p></section>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}${pr.name ? ' - ' + esc(pr.name) : ''}</title><style>${css(th, opts.paper)}</style></head><body>${cover}${toc}${bodies.filter(Boolean).join('')}${end}</body></html>`;
}

/* ---------- the Studio dialog ---------- */
let root = null, frame = null, timer = 0, state = null;
function ctx(){ return { chart: (typeof currentChartForModal !== 'undefined') ? currentChartForModal : null, profile: (typeof currentProfileForExport !== 'undefined') ? currentProfileForExport : null }; }
function readOpts(){
  const g = id => root.querySelector('#pdfs-' + id), o = { title: g('title').value.trim(), subtitle: g('sub').value.trim(), preparedBy: g('by').value.trim(), theme: root.querySelector('input[name=pdfs-theme]:checked').value, paper: g('paper').value, asks: g('asks').checked, why: g('why').checked };
  o.sections = [...root.querySelectorAll('.pdfs-sec input:checked')].map(i => i.value); return o;
}
function refresh(){
  const { chart, profile } = ctx(); if (!chart) return; state = readOpts();
  const html = build(chart, profile, state); frame.srcdoc = html; root.querySelector('#pdfs-count').textContent = state.sections.length + ' of ' + SECTIONS.length + ' sections';
}
function later(){ clearTimeout(timer); timer = setTimeout(refresh, 250); }
function close(){ if (root){ root.classList.remove('on'); document.body.classList.remove('pdfs-lock'); } }
function printNow(){
  const { chart, profile } = ctx(); if (!chart) return; const html = build(chart, profile, readOpts());
  const f = document.createElement('iframe'); f.setAttribute('aria-hidden', 'true'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0';
  f.onload = () => { try { f.contentWindow.focus(); f.contentWindow.print(); window.focus(); } catch (e) { window.focus(); flash('Could not open the print dialog. Use Download HTML and print it from your browser.'); } setTimeout(() => f.remove(), 60000); };
  document.body.appendChild(f); f.srcdoc = html; flash('Choose "Save as PDF" in the print window.');
}
function download(){
  const { chart, profile } = ctx(); if (!chart) return; const html = build(chart, profile, readOpts()), nm = ((profile && profile.name) || 'chart').replace(/[^a-z0-9]/gi, '_');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' })); a.download = nm + '_vedic_report.html'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); flash('Report downloaded. Open it and print to PDF any time.');
}
function flash(m){ const el = root && root.querySelector('#pdfs-msg'); if (!el) return; el.textContent = m; el.classList.add('on'); clearTimeout(flash.t); flash.t = setTimeout(() => el.classList.remove('on'), 4000); }
function make(){
  root = document.createElement('div'); root.className = 'pdfs'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'PDF Studio');
  root.innerHTML = `<div class="pdfs-card"><header class="pdfs-top"><div><b>📄 PDF Studio</b><small>Design your report, check the preview, then save it as a PDF</small></div><button type="button" class="pdfs-x" id="pdfs-close" aria-label="Close">✕</button></header>
  <div class="pdfs-body"><aside class="pdfs-opts">
    <label class="pdfs-f">Report title<input id="pdfs-title" type="text" value="Vedic Birth Chart Reading" maxlength="70"></label>
    <label class="pdfs-f">Subtitle<input id="pdfs-sub" type="text" value="A personal reading of your chart: character, strengths, timing and the points that deserve care" maxlength="140"></label>
    <label class="pdfs-f">Prepared by (optional)<input id="pdfs-by" type="text" placeholder="Your name or studio" maxlength="60"></label>
    <div class="pdfs-f"><span>Style</span><div class="pdfs-themes">${Object.keys(THEMES).map((k, i) => `<label class="pdfs-theme t-${k}"><input type="radio" name="pdfs-theme" value="${k}"${i === 0 ? ' checked' : ''}><i></i>${esc(THEMES[k].name)}</label>`).join('')}</div></div>
    <label class="pdfs-f">Paper<select id="pdfs-paper"><option value="A4">A4</option><option value="Letter">US Letter</option></select></label>
    <div class="pdfs-f"><span>Sections <em id="pdfs-count"></em></span><div class="pdfs-secs">${SECTIONS.map(s => `<label class="pdfs-sec"><input type="checkbox" value="${s[0]}" checked><b>${esc(s[1])}</b></label>`).join('')}</div></div>
    <label class="pdfs-sw"><input type="checkbox" id="pdfs-asks" checked> Include the self-check questions</label>
    <label class="pdfs-sw"><input type="checkbox" id="pdfs-why" checked> Show why each yoga appears</label>
  </aside><main class="pdfs-prev"><iframe id="pdfs-frame" title="Report preview"></iframe></main></div>
  <footer class="pdfs-foot"><span id="pdfs-msg" class="pdfs-msg" role="status"></span><button type="button" class="pdfs-btn ghost" id="pdfs-dl">⬇ Download HTML</button><button type="button" class="pdfs-btn" id="pdfs-print">🖨 Save as PDF</button></footer></div>`;
  document.body.appendChild(root); frame = root.querySelector('#pdfs-frame');
  root.addEventListener('input', later); root.addEventListener('change', later);
  root.querySelector('#pdfs-close').addEventListener('click', close); root.addEventListener('click', e => { if (e.target === root) close(); });
  root.querySelector('#pdfs-print').addEventListener('click', printNow); root.querySelector('#pdfs-dl').addEventListener('click', download);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('on')) close(); });
}
function open(){
  const { chart, profile } = ctx(); if (!chart){ alert('Cast a chart first, then create the PDF.'); return; }
  if (!root) make();
  const nm = root.querySelector('#pdfs-by'); if (!nm.value && profile && profile.preparedBy) nm.value = profile.preparedBy;
  root.classList.add('on'); document.body.classList.add('pdfs-lock'); refresh(); const b = root.querySelector('#pdfs-print'); if (b) b.focus();
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-pdf-studio]'); if (b){ e.preventDefault(); if (typeof closeExportModal === 'function') closeExportModal(); open(); } });
window.PDFR = { build, open, close, sections: SECTIONS.map(s => s[0]), themes: Object.keys(THEMES) };
})();

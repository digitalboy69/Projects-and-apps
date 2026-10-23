/* ============================================================================
   PDF REPORT (PDFR): one click, one complete designed book. No settings, no libraries, no network.
   PDFR.build(chart, profile)  -> one self-contained HTML document (inline CSS + inline SVG): cover, contents, nine parts with full-page dividers,
                                  and every section the app can produce (chart, panchang, planets, special lagnas, Shadbala, Ashtakavarga, yogas, life areas,
                                  all divisional charts, every Dasha and Antardasha, transits and Sade Sati, house by house, glossary, notes).
   PDFR.open() / PDFR.generate()  -> builds the book and opens the browser's print window in a hidden frame (choose "Save as PDF").
   PDFR.reg(id, title, sub, fn)   -> register a section builder (js/98-pdf-pages.js adds the extra pages); PDFR.h = shared helpers for those builders.
   Reads the same engines as the Deep reading (VDB, VMF, VNK, VDA, YGE, LAE, LAN, VGR, TRS) and the chart object from computeChart(); nothing is recomputed here.
   Styles for the small "preparing" notice: css/40-pdf-studio.css. Tests: tests/pdf_report_test.py.
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
const SECTIONS = [];   // [id, title, sub, builder] in registration order
const TH = { name: 'Ivory, indigo & gold', night1: '#0c0f2e', night2: '#2b2057', coverInk: '#f6ecd0', ink: '#262626', soft: '#6b6355', accent: '#a8801f', accent2: '#e9d9a6', goldL: '#f3e7bd', rule: '#e4dcc6', card: '#fdfaf1', cream: '#fbf6e9', page: '#ffffff' };
const PARTS = [
  { n: 'I', title: 'The Chart', head: 'The sky at the moment you were born', quote: 'Every reading begins with one honest picture: where each planet stood, in which sign, in which house, under which star.', secs: ['overview', 'chart', 'panchang', 'planets', 'lagnas'] },
  { n: 'II', title: 'The Person', head: 'Who you are', quote: 'Rising sign, Moon and birth star describe the temperament you bring to everything else. The planets then show how each part of you works.', secs: ['foundation', 'roles'] },
  { n: 'III', title: 'Strength', head: 'Where the chart is well supplied', quote: 'Shadbala measures the strength of each planet. Ashtakavarga counts the support behind each house. Together they show where effort is easier and where it needs more of you.', secs: ['shadbala', 'ashtakavarga', 'strength'] },
  { n: 'IV', title: 'Patterns', head: 'Yogas and points of care', quote: 'Planets rarely act alone. These are the combinations the classical rules find in your chart, and the places that deserve extra attention.', secs: ['yogas', 'cautions'] },
  { n: 'V', title: 'Life Areas', head: 'Nine areas of life, one by one', quote: 'Career, money, partnership, children, health, learning, travel, home and the inner life, each scored and told as a story.', secs: ['areas'] },
  { n: 'VI', title: 'Divisional Charts', head: 'The same sky, seen through a closer lens', quote: 'A divisional chart zooms into one theme: marriage, career, children, fortune. Every chart the app can draw is here.', secs: ['vargas', 'gallery'] },
  { n: 'VII', title: 'Time', head: 'Dashas, transits and Sade Sati', quote: 'The birth chart is the landscape. The dashas and the slow-moving planets show which part of the landscape is lit up, and when.', secs: ['timeline', 'dashas', 'transits'] },
  { n: 'VIII', title: 'The Houses', head: 'Twelve rooms of a life', quote: 'Each house is a field of experience. Here is what every house holds in your chart and what the planets do there.', secs: ['houses'] },
  { n: 'IX', title: 'Appendix', head: 'Reference and notes', quote: 'A short glossary, the numbers behind the reading, how it was made, and room for your own notes.', secs: ['glossary', 'notes'] }];
const ID = { name: 'Chart', dob: '', tob: '', place: '' };

/* ---------- small building blocks ---------- */
const chip = (t, k) => `<span class="chip ${k || ''}">${esc(t)}</span>`;
const tone = t => /strong|support|easy|helpful|good|positive/i.test(t) ? 'g' : /mild|challeng|strain|hard|pressure/i.test(t) ? 'b' : '';
const card = (h, body, cls) => `<div class="card ${cls || ''}">${h ? `<h4>${h}</h4>` : ''}${body}</div>`;
const pad2 = n => (n < 10 ? '0' : '') + n;
const sec = (id, n, title, sub, part, body) => `<section class="sec" id="s-${id}"><header class="sh"><span class="sn">${n}</span><div class="st"><small>${esc(part)}</small><h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div></header>${body}</section>`;
const bar = x => `<div class="abar"><i class="${x.bandTone || 'm'}" style="width:${x.score}%"></i></div>`;
const hbar = (label, v, max, note, k) => `<div class="hb"><span class="hl">${esc(label)}</span><span class="ht"><i class="${k || ''}" style="width:${Math.max(0, Math.min(100, v / max * 100)).toFixed(0)}%"></i></span><span class="hv">${esc(note != null ? note : v)}</span></div>`;

/* ---------- decorative SVG: lotus mandala, zodiac wheel, score ring, radar ---------- */
function mandala(col, op){
  let g = '';
  for (let i = 0; i < 16; i++) g += `<ellipse cx="200" cy="118" rx="24" ry="82" transform="rotate(${i * 22.5} 200 200)"/>`;
  for (let i = 0; i < 16; i++) g += `<ellipse cx="200" cy="150" rx="13" ry="48" transform="rotate(${i * 22.5 + 11.25} 200 200)"/>`;
  [196, 170, 120, 62, 34].forEach(r => { g += `<circle cx="200" cy="200" r="${r}"/>`; });
  for (let i = 0; i < 48; i++){ const a = i * 7.5 * Math.PI / 180, r1 = 170, r2 = 196; g += `<line x1="${(200 + r1 * Math.sin(a)).toFixed(1)}" y1="${(200 - r1 * Math.cos(a)).toFixed(1)}" x2="${(200 + r2 * Math.sin(a)).toFixed(1)}" y2="${(200 - r2 * Math.cos(a)).toFixed(1)}"/>`; }
  return `<svg class="mandala" viewBox="0 0 400 400" aria-hidden="true"><g fill="none" stroke="${col}" stroke-width="1.1" opacity="${op}">${g}</g></svg>`;
}
function zodiacWheel(asc, col, ink){
  const GL = '♈♉♊♋♌♍♎♏♐♑♒♓'; let g = '';
  for (let i = 0; i < 12; i++){
    const a0 = (i * 30 - 90 - 15) * Math.PI / 180, a1 = ((i + 1) * 30 - 90 - 15) * Math.PI / 180, ro = 190, ri = 140, am = ((i * 30) - 90) * Math.PI / 180;
    const P = (r, a) => (200 + r * Math.cos(a)).toFixed(1) + ',' + (200 + r * Math.sin(a)).toFixed(1);
    g += `<path d="M${P(ro, a0)} A${ro} ${ro} 0 0 1 ${P(ro, a1)} L${P(ri, a1)} A${ri} ${ri} 0 0 0 ${P(ri, a0)}Z" fill="${i === asc ? col : 'none'}" fill-opacity="${i === asc ? .9 : 0}" stroke="${col}" stroke-width="1.2"/>`;
    g += `<text x="${(200 + 165 * Math.cos(am)).toFixed(1)}" y="${(200 + 165 * Math.sin(am) + 9).toFixed(1)}" text-anchor="middle" font-size="26" fill="${i === asc ? ink : col}" font-family="Georgia,serif">${GL[i]}&#xFE0E;</text>`;
  }
  g += `<circle cx="200" cy="200" r="126" fill="none" stroke="${col}" stroke-width=".8"/><circle cx="200" cy="200" r="96" fill="none" stroke="${col}" stroke-width=".8" stroke-dasharray="2 5"/>`;
  for (let i = 0; i < 12; i++){ const a = (i * 30 - 90 - 15) * Math.PI / 180; g += `<line x1="${(200 + 96 * Math.cos(a)).toFixed(1)}" y1="${(200 + 96 * Math.sin(a)).toFixed(1)}" x2="${(200 + 126 * Math.cos(a)).toFixed(1)}" y2="${(200 + 126 * Math.sin(a)).toFixed(1)}" stroke="${col}" stroke-width=".8"/>`; }
  g += `<text x="200" y="222" text-anchor="middle" font-size="64" fill="${col}" font-family="Georgia,serif">ॐ</text>`;
  return `<svg class="wheel" viewBox="0 0 400 400" role="img" aria-label="Zodiac wheel with ${esc(SIGN[asc])} rising highlighted">${g}</svg>`;
}
function ring(score, k, th){
  const r = 40, L = 2 * Math.PI * r, col = k === 'g' ? '#4f8a5b' : k === 'b' ? '#c0733f' : th.accent;
  return `<svg class="ring" viewBox="0 0 100 100" role="img" aria-label="Score ${score} of 100"><circle cx="50" cy="50" r="${r}" fill="none" stroke="#ece7d8" stroke-width="9"/><circle cx="50" cy="50" r="${r}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(L * score / 100).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 50 50)"/><text x="50" y="57" text-anchor="middle" font-size="26" font-weight="700" font-family="Georgia,serif" fill="${th.ink}">${score}</text></svg>`;
}
function radar(items, th){
  const n = items.length, cx = 210, cy = 190, R = 130; let g = '';
  [25, 50, 75, 100].forEach(p => { g += `<polygon points="${items.map((_, i) => { const a = (i / n) * 2 * Math.PI - Math.PI / 2; return (cx + R * p / 100 * Math.cos(a)).toFixed(1) + ',' + (cy + R * p / 100 * Math.sin(a)).toFixed(1); }).join(' ')}" fill="none" stroke="${th.rule}" stroke-width="1"/>`; });
  items.forEach((it, i) => { const a = (i / n) * 2 * Math.PI - Math.PI / 2, x = cx + (R + 22) * Math.cos(a), y = cy + (R + 22) * Math.sin(a);
    g += `<line x1="${cx}" y1="${cy}" x2="${(cx + R * Math.cos(a)).toFixed(1)}" y2="${(cy + R * Math.sin(a)).toFixed(1)}" stroke="${th.rule}"/><text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${Math.cos(a) > .3 ? 'start' : Math.cos(a) < -.3 ? 'end' : 'middle'}" class="rl">${esc(it.label)}</text>`; });
  g += `<polygon points="${items.map((it, i) => { const a = (i / n) * 2 * Math.PI - Math.PI / 2, r = R * it.v / 100; return (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1); }).join(' ')}" fill="${th.accent}" fill-opacity=".28" stroke="${th.accent}" stroke-width="2"/>`;
  items.forEach((it, i) => { const a = (i / n) * 2 * Math.PI - Math.PI / 2, r = R * it.v / 100; g += `<circle cx="${(cx + r * Math.cos(a)).toFixed(1)}" cy="${(cy + r * Math.sin(a)).toFixed(1)}" r="3.6" fill="${th.accent}"/>`; });
  return `<svg class="radar" viewBox="0 0 420 380" role="img" aria-label="Scores of the nine life areas">${g}</svg>`;
}

/* ---------- North Indian chart as inline SVG (light, print-friendly); used for the birth chart, Moon chart, every divisional chart and each house ---------- */
function north(asc, byHouse, th, o){
  o = o || {};
  const A = [0, 0], B = [400, 0], C = [400, 400], D = [0, 400], T = [200, 0], R = [400, 200], Bo = [200, 400], L = [0, 200], O = [200, 200], P1 = [100, 100], P2 = [300, 100], P3 = [300, 300], P4 = [100, 300];
  const H = { 1: [T, P1, O, P2], 2: [A, T, P1], 3: [A, L, P1], 4: [L, P1, O, P4], 5: [L, D, P4], 6: [D, Bo, P4], 7: [Bo, P4, O, P3], 8: [Bo, C, P3], 9: [C, R, P3], 10: [R, P3, O, P2], 11: [R, B, P2], 12: [B, T, P2] };
  const cen = pts => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
  let g = '';
  for (let h = 1; h <= 12; h++){
    const pts = H[h], [cx, cy] = cen(pts), tri = pts.length === 3, list = (byHouse[h] || []).concat(h === 1 && !o.noAsc ? ['Asc'] : []);
    const sn = ((asc + h - 1) % 12) + 1, sy = tri ? cy + (cy < 200 ? -26 : 30) : cy - 38, on = (o.hl ? h === o.hl : h === 1);
    g += `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${on ? th.accent2 : 'none'}" fill-opacity="${on ? '.55' : '0'}" stroke="${th.accent}" stroke-width="1.6"/>`;
    g += `<text x="${cx.toFixed(0)}" y="${sy.toFixed(0)}" class="cs">${sn}</text>`;
    const cols = list.length > 4 ? 3 : 2, rows = Math.ceil(list.length / cols);
    list.forEach((t, i) => { const r = Math.floor(i / cols), k = Math.min(cols, list.length - r * cols), j = i % cols; g += `<text x="${(cx + (j - (k - 1) / 2) * 34).toFixed(0)}" y="${(cy + 6 + (r - (rows - 1) / 2) * 20).toFixed(0)}" class="${t === 'Asc' ? 'ca' : 'cp'}">${esc(t)}</text>`; });
  }
  g += `<rect x="0" y="0" width="400" height="400" fill="none" stroke="${th.accent}" stroke-width="3"/>`;
  return `<svg class="chart-svg${o.mini ? ' m' : ''}" viewBox="-6 -6 412 412" role="img" aria-label="${esc(o.label || 'North Indian chart, ' + SIGN[asc] + ' rising')}">${g}</svg>`;
}
const abbr = p => AB[p.name || p] + (p.retrograde && (p.name || p) !== 'Rahu' && (p.name || p) !== 'Ketu' ? 'ᴿ' : '');
function chartSvg(c, th){
  const byHouse = {}; PL.forEach(n => { const p = c.planets[n]; if (p) (byHouse[p.house] = byHouse[p.house] || []).push(abbr(p)); });
  return north(c.ascendant.sign, byHouse, th, { label: `North Indian birth chart, ${SIGN[c.ascendant.sign]} rising` });
}
function moonSvg(c, th){
  const ms = c.planets.Moon.sign, byHouse = {}; PL.forEach(n => { const p = c.planets[n]; if (p){ const h = ((p.sign - ms + 12) % 12) + 1; (byHouse[h] = byHouse[h] || []).push(abbr(p)); } });
  return north(ms, byHouse, th, { mini: true, noAsc: true, label: 'Chandra Lagna: chart counted from the Moon' });
}
function vargaSvg(c, key, th, o){
  const v = c.vargas[key]; if (!v) return ''; const byHouse = {};
  v.houses.forEach(h => { if (h.planets && h.planets.length) byHouse[h.houseNum] = h.planets.map(abbr); });
  return north(v.ascendantSign, byHouse, th, Object.assign({ mini: true, label: key + ' chart, ' + SIGN[v.ascendantSign] + ' rising' }, o || {}));
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
  const asc = c.ascendant;
  return `<div class="chart-wrap"><div class="chart-box">${chartSvg(c, TH)}<p class="cap">${esc(SIGN[asc.sign])} rising at ${(asc.degInSign || 0).toFixed(1)}°. Numbers are signs (1 = Aries); the highlighted diamond is the 1st house. R = retrograde.</p></div>` +
    `<table class="tb"><thead><tr><th>Planet</th><th>Sign</th><th>Degree</th><th>House</th><th>Nakshatra · pada</th><th>Condition</th></tr></thead><tbody>${rows}</tbody></table></div>` +
    `<h3 class="grp">Two more views of the same sky</h3><div class="pair"><figure>${moonSvg(c, TH)}<figcaption><b>Chandra Lagna</b>: the chart counted from the Moon (${esc(SIGN[c.planets.Moon.sign])}). Classical texts read the Moon chart beside the rising chart, especially for the mind and daily life.</figcaption></figure>` +
    `<figure>${vargaSvg(c, 'D9', TH)}<figcaption><b>Navamsa (D9)</b>: the chart of marriage, dharma and the deeper strength of each planet. It is read together with the birth chart.</figcaption></figure></div>`;
}
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
function bAreas(c, o){
  if (typeof LAE === 'undefined' || !LAE) return ''; const la = LAE.assess(c), th = TH, ln = (typeof LAN !== 'undefined' && LAN) ? LAN.all(c) : [], lnOf = id => ln.find(y => y.id === id);
  const sum = `<table class="tb"><thead><tr><th>Area</th><th>Score</th><th></th><th>Band</th><th>Right now</th></tr></thead><tbody>${la.areas.map(x => `<tr><td><b>${esc(x.icon)} ${esc(x.name)}</b></td><td><b>${x.score}</b></td><td style="width:34%">${bar(x)}</td><td>${chip(x.band, x.bandTone)}</td><td>${x.now.score}</td></tr>`).join('')}</tbody></table>`;
  const rad = radar(la.areas.map(x => ({ label: x.name.split(' and ')[0], v: x.score })), th);
  const idOf = v => v && v.id ? v.id : v, st = la.areas.find(x => x.id === idOf(la.strongest)) || la.areas[0], wk = la.areas.find(x => x.id === idOf(la.weakest)) || la.areas[0];
  const intro = `<p class="lead">${esc(la.note)} Each score blends house strength, house lords, natural significators, the matching divisional chart, related yogas and the running dasha.</p><div class="pair wide"><div>${rad}</div><div class="callouts"><div class="callout g"><small>Most supported</small><b>${esc(st.icon)} ${esc(st.name)}</b><span>${st.score} / 100</span></div><div class="callout b"><small>Needs most of your own effort</small><b>${esc(wk.icon)} ${esc(wk.name)}</b><span>${wk.score} / 100</span></div><p class="sm">Scores compare the nine areas inside this one chart. A low score is not a verdict: it marks where support is thinner and conscious effort counts for more.</p></div></div>${sum}`;
  const PN = [['house', 'Houses'], ['lords', 'House lords'], ['karaka', 'Natural significators'], ['varga', 'Divisional chart'], ['yogas', 'Yogas'], ['dasha', 'Timing (dasha)']];
  const plates = la.areas.map(x => {
    const nar = lnOf(x.id);
    return `<div class="plate area ${tone(x.bandTone === 'g' ? 'strong' : x.bandTone === 'b' ? 'mild' : '')}"><div class="ahd">${ring(x.score, x.bandTone, th)}<div><small>${esc(x.theme)}</small><h3>${esc(x.icon)} ${esc(x.name)}</h3>${chip(x.band + ' · ' + x.score, x.bandTone)} <span class="sm">Right now ${x.now.score} · next five years ${x.next5.score}</span></div></div>` +
      `<div class="parts">${PN.map(k => hbar(k[1], x.parts[k[0]], 100, x.parts[k[0]], x.parts[k[0]] >= 62 ? 'g' : x.parts[k[0]] < 40 ? 'b' : '')).join('')}</div>` +
      `<div class="two"><div><h5>What helps</h5><ul class="ul">${(x.pos || []).map(t => `<li>${esc(t)}</li>`).join('') || '<li>No single standout support.</li>'}</ul></div><div><h5>What needs care</h5><ul class="ul">${(x.neg || []).map(t => `<li class="neg">${esc(t)}</li>`).join('') || '<li>Nothing stands out as a strain.</li>'}</ul></div></div>` +
      (nar ? nar.paragraphs.map(q => `<h5>${esc(q.h)}</h5><p>${esc(q.text)}</p>`).join('') : `<p><b>Right now:</b> ${esc(x.now.why.join('; ') || 'no direct link to this area')}.</p><p><b>Next five years:</b> ${esc(x.next5.why.join('; '))}.</p>`) + `</div>`;
  }).join('');
  return intro + plates;
}
function bVargas(c, o){
  if (typeof VGR === 'undefined' || !VGR) return ''; const vg = VGR.all(c); if (!vg.length) return '';
  const bar = x => `<div class="abar"><i class="${x.bandTone || 'm'}" style="width:${x.score}%"></i></div>`;
  return `<p class="lead">${esc(VGR.data.note)}</p><table class="tb"><thead><tr><th>Chart</th><th>Looks at</th><th>Rising</th><th>Score</th><th></th><th>Band</th></tr></thead><tbody>${vg.map(x => `<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.short)}</td><td>${esc(x.lagna.sign)}</td><td><b>${x.score}</b></td><td style="width:26%">${bar(x)}</td><td>${chip(x.band, x.bandTone)}</td></tr>`).join('')}</tbody></table>` +
    vg.map(x => card(`${esc(x.name)} ${chip(x.band + ' · ' + x.score, x.bandTone)} <small>${esc(x.noun)}</small>`, bar(x) + x.paragraphs.map(q => `<h5>${esc(q.h)}</h5><p>${esc(q.text)}</p>`).join(''), tone(x.bandTone === 'g' ? 'strong' : x.bandTone === 'b' ? 'mild' : '') + ' long')).join('');
}
function bTimeline(c, o){
  if (typeof VDA === 'undefined' || !VDA || !c.dashaData) return '';
  const T = VDA.timeline(c), rows = T.periods.map(p => `<tr class="${p.status}"><td><b>${esc(p.lord)}</b></td><td>${fmtD(p.start)} – ${fmtD(p.end)}</td><td>${p.ageStart}–${p.ageEnd}</td><td>${esc(p.theme)}</td><td>${chip(p.tone, tone(p.tone))}</td></tr>`).join('');
  const cards = T.periods.map(p => card(`${esc(p.lord)} Mahadasha <small>${fmtD(p.start)} – ${fmtD(p.end)}${p.status === 'now' ? ' · running now' : ''}</small>`, `<p>${esc(p.text)}</p>${o.asks ? `<p class="ask">${esc(p.reflect)}</p>` : ''}`, p.status === 'now' ? 'now' : '')).join('');
  const up = VDA.upcoming(c, 5), upRows = up.map(r => `<tr><td>${fmtD(r.start)} – ${fmtD(r.end)}</td><td><b>${esc(r.mdLord)}–${esc(r.lord)}</b></td><td>${chip(r.tone, tone(r.tone))}</td><td>${esc(r.blend)}</td></tr>`).join('');
  return `<p class="lead">${esc(VDA.data.intro)}</p><table class="tb tl1"><thead><tr><th>Mahadasha</th><th>Dates</th><th>Age</th><th>Theme</th><th>Tone</th></tr></thead><tbody>${rows}</tbody></table>` +
    (up.length ? `<h3 class="grp">The next five years, sub-period by sub-period</h3><table class="tb tl2"><thead><tr><th>Dates</th><th>Period</th><th>Tone</th><th>What the blend tends to feel like</th></tr></thead><tbody>${upRows}</tbody></table>` : '') + `<h3 class="grp">Every Mahadasha in words</h3>` + cards;
}
function bTransits(c, o){
  if (typeof TRS === 'undefined' || !TRS) return ''; const T = TRS.assess(c, (typeof currentProfileForExport !== 'undefined') ? currentProfileForExport : null);
  if (!T.available) return `<p class="lead">${esc(T.notes.join(' '))}</p>`;
  const fj = jd => jd == null ? 'open' : MON[jdToDate(jd).getUTCMonth()] + ' ' + jdToDate(jd).getUTCFullYear(), LA = LAE.assess(c).areas;
  const sade = T.sade.active.length ? T.sade.active.map(x => card(`${esc(x.kind)}: ${esc(x.name)} ${chip(x.level, x.level === 'lighter' ? 'g' : x.level === 'heavier' ? 'b' : '')}`, `<p>${esc(x.text)}</p>`, 'now')).join('') : card('Sade Sati and Dhaiya', `<p>Not running now. ${esc(T.sade.next ? T.sade.next.text : '')}</p>`);
  const cyc = `<table class="tb"><thead><tr><th>Period</th><th>Stage</th><th>Dates</th><th></th></tr></thead><tbody>${T.sade.cycles.map(cy => cy.phases.map(p => `<tr class="${cy.status === 'now' ? 'now' : cy.status === 'past' ? 'past' : ''}"><td>${esc(cy.kind)}</td><td>${esc(p.name)} (${esc(p.sign)})</td><td>${fj(p.start)} – ${fj(p.end)}</td><td>${cy.status === 'now' ? 'running' : cy.status}</td></tr>`).join('')).join('')}</tbody></table>`;
  const gt = `<table class="tb"><thead><tr><th>Planet</th><th>Sign</th><th>Until</th><th>From the Moon</th><th>Tone</th></tr></thead><tbody>${T.gochar.map(g => `<tr><td><b>${esc(g.planet)}</b></td><td>${esc(g.sign)}</td><td>${fj(g.to)}</td><td>${ordn(g.houseFromMoon)} house</td><td>${chip(g.tone, g.tone === 'helpful' ? 'g' : 'b')}</td></tr>`).join('')}</tbody></table>` + T.gochar.map(g => `<p>${esc(g.text)}</p>`).join('');
  const cal = `<table class="tb"><thead><tr><th>Date</th><th>Planet</th><th>Enters</th><th>From the Moon</th><th>Tone</th></tr></thead><tbody>${T.calendar.map(x => `<tr><td>${fj(x.jd)}</td><td><b>${esc(x.planet)}</b></td><td>${esc(x.sign)}</td><td>${ordn(x.houseFromMoon)} house</td><td>${chip(x.tone, x.tone === 'helpful' ? 'g' : 'b')}</td></tr>`).join('')}</tbody></table>`;
  const ol = `<table class="tb"><thead><tr><th>Area</th><th>Year 1</th><th>Year 2</th><th>Year 3</th></tr></thead><tbody>${LA.map(a => `<tr><td><b>${esc(a.icon)} ${esc(a.name)}</b></td>${T.outlook[a.id].map(o => `<td>${chip(o.band + ' ' + o.score, o.bandTone)}</td>`).join('')}</tr>`).join('')}</tbody></table><p class="sm">${esc(T.outlook[LA[0].id].map(o => 'Year ' + o.year + ': ' + o.label).join(' · '))}. Each number blends the natal score of the area, the dasha running in the middle of that year, and how long Jupiter and Saturn together influence its houses (the double transit).</p>`;
  const dbl = LA.filter(a => T.double[a.id].length).map(a => `<p><b>${esc(a.icon)} ${esc(a.name)}:</b> ${T.double[a.id].map(w => esc(w.text.replace('Jupiter and Saturn both influence your ', '')).replace(/ from /, ', ')).join(' ')}</p>`).join('');
  return `<p class="lead">${esc(T.note)}</p><p><b>In short.</b> ${esc(T.summary.join(' '))}</p>${sade}<h3 class="grp">Every Sade Sati and Dhaiya in your life</h3>${cyc}<h3 class="grp">Where the slow planets are now</h3>${gt}<h3 class="grp">Sign changes in the next three years</h3>${cal}<h3 class="grp">Year by year, area by area</h3>${ol}${dbl ? `<h3 class="grp">Double-transit windows (Jupiter and Saturn together)</h3>${dbl}` : ''}`;
}
function bavRow(c, n){
  const A = c.ashtakavarga; if (!A || !A.bavTables) return ''; const sg = (c.ascendant.sign + n - 1) % 12, ps = P7.filter(p => A.bavTables[p]); if (!ps.length) return '';
  const tot = ps.reduce((a, p) => a + A.bavTables[p][sg], 0);
  return `<h5>Support from each planet (Ashtakavarga points in this house)</h5><table class="tb heatrow"><thead><tr>${ps.map(p => `<th class="c">${esc(AB[p])}</th>`).join('')}<th class="c">Sum</th></tr></thead><tbody><tr>${ps.map(p => `<td class="c"><b>${A.bavTables[p][sg]}</b></td>`).join('')}<td class="c"><b>${tot}</b></td></tr></tbody></table><p class="sm">Each planet can give up to 8 points. A planet with 5 or more here supports this house; 2 or fewer means that planet adds little.</p>`;
}
function bHouses(c, o){
  const r = VDB.reading(c), D = VDB.data, asc = SIGN.indexOf(r.lagna.sign), sav = c.ashtakavarga && c.ashtakavarga.sav, out = [], avg = sav ? sav.reduce((a, b) => a + b, 0) / 12 : 0;
  const byHouse = {}; PL.forEach(n => { const p = c.planets[n]; if (p) (byHouse[p.house] = byHouse[p.house] || []).push(abbr(p)); });
  for (let n = 1; n <= 12; n++){
    const H = D.houses[n - 1], S = D.signs[(asc + n - 1) % 12], hl = r.houseLords[n - 1], occ = PL.filter(p => r.planets[p] && r.planets[p].house === n);
    const asp = PL.filter(p => c.planets[p] && (c.planets[p].aspectsHouses || []).indexOf(n) >= 0), pts = sav ? sav[(asc + n - 1) % 12] : null;
    out.push(`<div class="plate house"><div class="hhead"><div class="hn">${n}</div><div class="hbox"><small>${esc(ordn(n))} house · ${esc(S.name)}</small><h3>${esc(H.name)}</h3><p class="sm">Lord ${esc(hl.lord)}, placed in the ${esc(ordn(hl.placedIn || 0))} house</p>` +
      `${pts != null ? `<div class="pts">${hbar('Ashtakavarga', pts, 48, pts + ' points', pts >= avg + 3 ? 'g' : pts <= avg - 3 ? 'b' : '')}</div>` : ''}</div><div class="hchart">${north(c.ascendant.sign, byHouse, TH, { mini: true, hl: n, label: 'Birth chart with the ' + ordn(n) + ' house highlighted' })}</div></div>` +
      `<p><b>This house covers:</b> ${esc(H.rules)}.</p><p>${esc(strip(hl.text))}</p>` +
      (occ.length ? occ.map(p => `<p><b>${esc(p)} sits here.</b> ${esc(strip(r.planets[p].inHouse.text))}</p>`).join('') : `<p class="sm">No planet sits here, so the lord's placement and the aspects carry this house.</p>`) +
      (asp.length ? `<p class="sm"><b>Aspected by:</b> ${esc(asp.join(', '))}.</p>` : '') + bavRow(c, n) + `<p class="ask">${esc(H.ask)}</p></div>`);
  }
  return `<p class="lead">Twelve houses, counted from the rising sign (whole-sign houses). For each: what it covers, where its lord sits, which planets live there or look at it, and how much Ashtakavarga support it carries.</p>` + out.join('');
}
function bStrength(c){
  const av = c.ashtakavarga && c.ashtakavarga.sav; if (!av) return '';
  const asc = c.ascendant.sign, v = Array.from({ length: 12 }, (_, h) => av[(asc + h) % 12]), avg = v.reduce((a, b) => a + b, 0) / 12;
  const hi = v.map((b, i) => [b, i + 1]).sort((a, b) => b[0] - a[0]).slice(0, 3), lo = v.map((b, i) => [b, i + 1]).sort((a, b) => a[0] - b[0]).slice(0, 3), D = VDB.data;
  const nmh = h => `${ordn(h)} house (${D.houses[h - 1].name.toLowerCase()})`;
  return `<p class="lead">Sarva Ashtakavarga points for each house, counted from the rising sign. A house above the average of ${avg.toFixed(1)} tends to get more support; below it tends to need more of your own effort.</p>${savSvg(c, TH)}` +
    `<p><b>Best supported:</b> ${hi.map(x => `${nmh(x[1])}, ${x[0]} points`).join('; ')}.</p><p><b>Needs more effort:</b> ${lo.map(x => `${nmh(x[1])}, ${x[0]} points`).join('; ')}.</p>`;
}
const SUB_FALLBACK = '';
function reg(id, title, sub, fn){ const row = [id, title, sub || SUB_FALLBACK, fn], i = SECTIONS.findIndex(s => s[0] === id); if (i >= 0) SECTIONS[i] = row; else SECTIONS.push(row); }
reg('overview', 'Your signature at a glance', 'The main threads of your chart in plain language', bOverview);
reg('chart', 'Birth chart and planet positions', 'Where every planet stands at your birth', bChart);
reg('foundation', 'Who you are: rising sign, Moon and birth star', 'The base layer of the whole reading', bFoundation);
reg('roles', 'What each planet does for you', 'How each planet works for your rising sign', bRoles);
reg('yogas', 'Yogas: notable combinations', 'Supportive and notable planet combinations', bYogas);
reg('cautions', 'Points that need care', 'Areas that deserve extra care', bCautions);
reg('areas', 'Nine areas of life', 'Career, money, marriage and six more, scored and explained', bAreas);
reg('vargas', 'Divisional charts: the six big ones', 'Marriage, career, children, siblings, learning and more', bVargas);
reg('timeline', 'Life timeline (Mahadashas)', 'The stages of your life, with dates', bTimeline);
reg('transits', 'Transits and Sade Sati', 'What the slow planets are doing now and over the next three years', bTransits);
reg('houses', 'House by house', 'The twelve areas of life, one by one', bHouses);
reg('strength', 'Strength of the twelve houses', 'Where your chart has more or less support', bStrength);

/* ---------- the document ---------- */
function css(th, name){
  const nm = String(name || '').replace(/[^\p{L}\p{N} .,'\u2019-]/gu, ' ').trim();   // letters and basic punctuation only: this string goes inside a <style> block
  return `
  @page{size:A4;margin:18mm 15mm 20mm;@bottom-center{content:counter(page);font:9pt Georgia,serif;color:#8a8576}@top-right{content:"${nm ? nm + '  ·  ' : ''}Vedic Birth Chart Reading";font:7.5pt Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#b3a98e}}
  @page:first{margin:0;@bottom-center{content:none}@top-right{content:none}}
  @page dv{margin:0;@bottom-center{content:none}@top-right{content:none}}
  *{box-sizing:border-box}
  html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{margin:0;font:10.5pt/1.58 Georgia,'Times New Roman',serif;color:${th.ink};background:${th.page}}
  h1,h2,h3,h4{font-family:'Palatino Linotype',Palatino,Georgia,serif;margin:0;font-weight:700}
  p{margin:0 0 7pt}
  .mandala,.wheel{display:block}
  /* cover and closing page */
  .cover,.end{page:dv;height:297mm;width:100%;display:flex;flex-direction:column;justify-content:space-between;padding:24mm 22mm 18mm;color:${th.coverInk};background:radial-gradient(120% 90% at 85% 0%,${th.night2},${th.night1} 68%);break-after:page;position:relative;overflow:hidden}
  .cover .wheel{position:absolute;right:-34mm;top:-30mm;width:150mm;height:150mm;opacity:.95}
  .cover .mandala{position:absolute;left:-70mm;bottom:-95mm;width:190mm;height:190mm}
  .cover>*{position:relative}.cover .main{margin-top:52mm}.cover .om{font-size:30pt;color:${th.accent2};letter-spacing:.2em}
  .cover .kick{font:600 9.5pt Arial,sans-serif;letter-spacing:.34em;text-transform:uppercase;color:${th.accent2}}
  .cover h1{font-size:46pt;line-height:1.04;margin:6mm 0 5mm;max-width:150mm;font-weight:700}
  .cover .sub{font-size:13pt;opacity:.86;max-width:130mm}
  .cover .rule{height:1.2mm;width:42mm;background:${th.accent2};margin:10mm 0}
  .cover .who{font-size:24pt;font-family:'Palatino Linotype',Palatino,Georgia,serif}
  .cover dl{display:grid;grid-template-columns:auto 1fr;gap:2mm 7mm;margin:6mm 0 0;font-size:11.5pt}
  .cover dt{opacity:.7;font:600 8.5pt Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;padding-top:1pt}.cover dd{margin:0}
  .cover .foot{font-size:9pt;opacity:.78;display:flex;justify-content:space-between;align-items:flex-end}
  .end{justify-content:center;align-items:center;text-align:center;break-before:page;break-after:auto}.end .mandala{position:absolute;left:50%;top:50%;width:230mm;height:230mm;margin:-115mm 0 0 -115mm}
  .end>div{position:relative;max-width:125mm}.end h2{color:${th.accent2};font-size:30pt;margin-bottom:8mm}.end p{font-size:12pt;opacity:.92;margin-bottom:5mm}.end .sm{color:${th.accent2};opacity:.8;font-size:9pt;margin-top:12mm}
  /* contents */
  .toc{break-after:page;padding-top:2mm}.toc h2{font-size:28pt;color:${th.accent};margin-bottom:2mm}.toc .tl{width:40mm;height:1.2mm;background:${th.accent2};margin-bottom:8mm}
  .toc .tp{display:flex;align-items:baseline;gap:4mm;margin:6mm 0 1.5mm;break-after:avoid;color:${th.accent};font:700 13pt 'Palatino Linotype',Palatino,Georgia,serif;border-bottom:.4mm solid ${th.accent2};padding-bottom:1mm}.toc .tp i{font:700 10pt Arial,sans-serif;font-style:normal;letter-spacing:.14em;color:${th.soft};min-width:11mm}
  .toc ol{list-style:none;margin:0;padding:0}.toc li{display:flex;align-items:baseline;gap:4mm;padding:1.8mm 0 1.8mm 15mm;border-bottom:.25mm solid ${th.rule};font-size:11pt}
  .toc li em{font:700 9pt Arial,sans-serif;font-style:normal;color:${th.accent};min-width:7mm}.toc li small{display:block;color:${th.soft};font-size:8.5pt}.toc a{color:inherit;text-decoration:none}
  .toc .how{margin-top:8mm;padding:5mm;border-radius:3mm;background:${th.card};border:.3mm solid ${th.rule};font-size:10pt;color:${th.soft}}
  /* part dividers: full-bleed pages with a big headline */
  .divider{page:dv;height:297mm;width:100%;break-before:page;break-after:page;position:relative;overflow:hidden;color:${th.coverInk};background:radial-gradient(110% 80% at 15% 100%,${th.night2},${th.night1} 72%);padding:36mm 24mm 24mm;display:flex;flex-direction:column;justify-content:flex-end}
  .divider .mandala{position:absolute;right:-92mm;top:-30mm;width:210mm;height:210mm}
  .divider .pn{position:absolute;left:20mm;top:26mm;font:700 150pt/1 'Palatino Linotype',Palatino,Georgia,serif;color:transparent;-webkit-text-stroke:.5mm ${th.accent2};opacity:.9}
  .divider>div{position:relative}.divider .kick{font:600 9.5pt Arial,sans-serif;letter-spacing:.34em;text-transform:uppercase;color:${th.accent2};margin-bottom:5mm}
  .divider h2{font-size:48pt;line-height:1.02;max-width:160mm;margin-bottom:6mm}.divider .head{font-size:19pt;font-style:italic;color:${th.accent2};max-width:150mm;margin-bottom:7mm}
  .divider .rule{height:1.2mm;width:42mm;background:${th.accent2};margin:0 0 7mm}.divider .q{font-size:12pt;opacity:.88;max-width:140mm;margin-bottom:12mm}
  .divider ul{list-style:none;margin:0;padding:0;border-top:.3mm solid rgba(233,217,166,.45)}.divider li{padding:2.4mm 0;border-bottom:.3mm solid rgba(233,217,166,.3);font:10.5pt Arial,sans-serif;letter-spacing:.04em}.divider li b{color:${th.accent2};margin-right:5mm;font-weight:600}
  /* sections */
  .sec{break-before:page}
  .sh{display:flex;gap:7mm;align-items:center;padding:0 0 5mm;margin:0 0 8mm;border-bottom:.5mm solid ${th.accent2};position:relative;break-after:avoid}
  .sh::after{content:'';position:absolute;left:0;bottom:-1.6mm;width:30mm;height:.9mm;background:${th.accent}}
  .sn{flex:0 0 auto;font:700 50pt/1 'Palatino Linotype',Palatino,Georgia,serif;color:${th.goldL};-webkit-text-stroke:.35mm ${th.accent}}
  .st small{display:block;font:600 8.5pt Arial,sans-serif;letter-spacing:.26em;text-transform:uppercase;color:${th.accent};margin-bottom:1.5mm}.sh h2{font-size:25pt;line-height:1.1}.sh p{margin:2mm 0 0;color:${th.soft};font-size:10.5pt;font-style:italic}
  .lead{font-size:11.5pt;color:${th.soft};margin-bottom:6mm;padding-left:4mm;border-left:.8mm solid ${th.accent2}}
  .card{border:.3mm solid ${th.rule};border-left:1.2mm solid ${th.accent2};background:${th.card};border-radius:2mm;padding:4mm 5mm;margin:0 0 4mm;break-inside:avoid}
  .card.g{border-left-color:#4f8a5b}.card.b{border-left-color:#b5683a}.card.now{border-left-color:${th.accent};background:#fff8e1}.card.long{break-inside:auto}
  .card h4{font-size:12pt;margin-bottom:2mm}.card h4 small{font:400 8.5pt Arial,sans-serif;color:${th.soft};margin-left:2mm}
  .sm{font-size:9pt;color:${th.soft}}.ask{font-size:9.5pt;font-style:italic;color:${th.accent};padding-top:1.5mm;border-top:.25mm dashed ${th.rule}}
  .grp{font-size:14pt;color:${th.accent};margin:8mm 0 3mm;padding-bottom:1.5mm;border-bottom:.4mm solid ${th.rule};break-after:avoid}
  .chip{white-space:nowrap;display:inline-block;font:600 7.5pt Arial,sans-serif;padding:.6mm 2.4mm;border-radius:99px;background:#eee9da;color:#5a5240;vertical-align:1pt;margin-left:1mm}
  .chip.g{background:#dcefe0;color:#2f6b3c}.chip.b{background:#f5e0d2;color:#9a4f24}.chips{margin-bottom:5mm}.chips .chip{margin:0 1.5mm 1.5mm 0;font-size:8.5pt;padding:1.2mm 3mm}
  .sig{display:flex;gap:4mm;padding:3.5mm 0;border-bottom:.25mm solid ${th.rule};break-inside:avoid}.sig .ic{flex:0 0 9mm;font-size:15pt;color:${th.accent}}.sig b{font-size:11pt}.sig p{margin:1mm 0 0}
  .tb{width:100%;border-collapse:collapse;font:9pt Arial,sans-serif;margin:0 0 6mm}
  .tb th{background:${th.accent};color:#fff;text-align:left;padding:2mm 2.4mm;font-weight:600}.tb td{overflow-wrap:break-word;padding:2mm 2.4mm;border-bottom:.25mm solid ${th.rule};vertical-align:top}
  .tb tr:nth-child(even) td{background:${th.card}}.tb tr.now td{background:#fff3c9}.tb tr.past td{color:${th.soft}}.tb tr{break-inside:avoid}.tb td.c,.tb th.c{text-align:center}
  .chart-wrap{display:grid;grid-template-columns:minmax(0,1fr);gap:5mm;justify-items:center}.chart-wrap .chart-box{width:112mm}.chart-wrap .tb{width:100%}.chart-box{break-inside:avoid}
  .chart-svg{width:100%;height:auto;background:#fffdf6;border-radius:2mm}.chart-svg .cp{font:700 15px Arial,sans-serif;fill:${th.ink};text-anchor:middle}.chart-svg .ca{font:700 13px Arial,sans-serif;fill:${th.accent};text-anchor:middle}.chart-svg .cs{font:11px Arial,sans-serif;fill:${th.soft};text-anchor:middle}
  .chart-svg.m .cp{font-size:19px}.chart-svg.m .ca{font-size:16px}.chart-svg.m .cs{font-size:14px}
  .pair{display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin:0 0 6mm}.pair figure{margin:0;break-inside:avoid}.pair figcaption,.cap{font:8.5pt Arial,sans-serif;color:${th.soft};margin-top:2mm}.pair.wide{grid-template-columns:1.2fr 1fr;align-items:center}
  .abar{height:2.4mm;border-radius:99px;background:#ece7d8;overflow:hidden;margin:1mm 0 2.5mm}.abar i{display:block;height:100%;background:${th.accent}}.abar i.g{background:#4f8a5b}.abar i.b{background:#c0733f}
  .hb{display:grid;grid-template-columns:36mm 1fr 18mm;gap:3mm;align-items:center;font:8.5pt Arial,sans-serif;margin:0 0 1.6mm}.hb .hl{color:${th.soft}}.hb .ht{height:2.6mm;border-radius:99px;background:#ece7d8;overflow:hidden}.hb .ht i{display:block;height:100%;background:${th.accent}}.hb .ht i.g{background:#4f8a5b}.hb .ht i.b{background:#c0733f}.hb .hv{text-align:right;font-weight:700;color:${th.ink}}
  .ul{margin:0 0 5pt 5mm;padding:0;font-size:9.5pt}.ul li{margin:0 0 1.5mm}.ul li.neg{color:#9a4f24}
  h5{font:700 8.5pt Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:${th.accent};margin:4mm 0 1mm}
  .bar-svg{width:100%;height:auto;margin:2mm 0 5mm}.bar-svg .cv{font:700 11px Arial,sans-serif;fill:${th.ink}}.bar-svg .cl{font:10px Arial,sans-serif;fill:${th.soft}}
  .radar{width:100%;height:auto}.radar .rl{font:10.5px Arial,sans-serif;fill:${th.ink}}
  .callouts .callout{padding:4mm 5mm;border-radius:2.5mm;margin-bottom:4mm;border:.3mm solid ${th.rule};background:${th.card}}.callout small{display:block;font:600 7.5pt Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:${th.soft}}.callout b{display:block;font:700 13pt Georgia,serif;margin:1mm 0}.callout span{font:700 18pt Georgia,serif}.callout.g{border-left:1.4mm solid #4f8a5b}.callout.g span{color:#2f6b3c}.callout.b{border-left:1.4mm solid #c0733f}.callout.b span{color:#9a4f24}
  /* plates: one big framed page per area, house, planet or divisional chart */
  .plate{break-before:page;padding:6mm 6mm 2mm;border:.4mm solid ${th.rule};border-top:2mm solid ${th.accent2};border-radius:3mm;background:linear-gradient(180deg,${th.card},#fff 38mm)}
  .plate.g{border-top-color:#4f8a5b}.plate.b{border-top-color:#c0733f}
  .ahd{display:flex;gap:6mm;align-items:center;margin-bottom:5mm}.ahd small{display:block;font:600 8pt Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:${th.soft}}.ahd h3{font-size:20pt;margin:1mm 0 2mm}.ring{width:30mm;height:30mm;flex:0 0 30mm}
  .parts{margin:0 0 5mm;padding:4mm 5mm;border-radius:2.5mm;background:#fff;border:.3mm solid ${th.rule}}.two{display:grid;grid-template-columns:1fr 1fr;gap:7mm}
  .hhead{display:grid;grid-template-columns:36mm 1fr 52mm;gap:6mm;align-items:center;margin-bottom:5mm}.hn{font:700 96pt/1 'Palatino Linotype',Palatino,Georgia,serif;color:${th.goldL};-webkit-text-stroke:.4mm ${th.accent};text-align:center}.hbox small{font:600 8pt Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:${th.accent}}.hbox h3{font-size:21pt;margin:1mm 0 2mm}.hbox .pts{margin-top:3mm}
  .plate .chart-svg{background:#fff}
  .pl-head{display:flex;gap:6mm;align-items:center;margin-bottom:4mm}.pl-glyph{flex:0 0 26mm;height:26mm;border-radius:50%;display:grid;place-items:center;font:44pt Georgia,serif;color:#fff;background:linear-gradient(135deg,${th.accent},#6d5210)}.pl-head small{display:block;font:600 8pt Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:${th.accent}}.pl-head h3{font-size:22pt;margin:1mm 0}
  .facts{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin:0 0 5mm}.facts div{padding:2.6mm 3mm;border-radius:2mm;background:#fff;border:.3mm solid ${th.rule}}.facts .sm{display:block;margin-top:.6mm}.facts small{display:block;font:600 7pt Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:${th.soft}}.facts b{font:700 10.5pt Georgia,serif}
  .vplate{display:grid;grid-template-columns:62mm 1fr;gap:6mm;padding:5mm;margin:0 0 6mm;border:.4mm solid ${th.rule};border-left:1.6mm solid ${th.accent};border-radius:2.5mm;background:${th.card};break-inside:avoid}.vplate h4{font-size:14pt}.vplate .sm{margin:1mm 0 3mm}.vplate .tb{margin:0}
  .tb.heat tr td.h0{background:#f6f2e6}.tb.heat tr td.h1{background:#efe3b8}.tb.heat tr td.h2{background:#e3cf8d}.tb.heat tr td.h3{background:#c9a94c;color:#fff}.tb.heat tr td.h4{background:#a8801f;color:#fff}.heat td{text-align:center}.heat td:first-child,.heat th:first-child{text-align:left}
  .tline{width:100%;height:auto;margin:0 0 6mm}.tline text{font:11px Arial,sans-serif}
  .gl dt{font:700 11pt 'Palatino Linotype',Georgia,serif;color:${th.accent};margin-top:4mm}.gl dd{margin:.5mm 0 0;break-inside:avoid}
  .ruled{height:230mm;background:repeating-linear-gradient(180deg,transparent 0,transparent 9.2mm,${th.rule} 9.2mm,${th.rule} 9.6mm);margin-top:6mm}
  .tl1,.tl2{table-layout:fixed}.tl1 th:nth-child(1){width:17%}.tl1 th:nth-child(2){width:25%}.tl1 th:nth-child(3){width:9%}.tl1 th:nth-child(5){width:15%}.tl2 th:nth-child(1){width:24%}.tl2 th:nth-child(2){width:17%}.tl2 th:nth-child(3){width:16%}
  @media screen{html{background:#d9d6cc}body{max-width:210mm;margin:0 auto;box-shadow:0 6px 40px rgba(0,0,0,.25)}.sec,.toc{padding:14mm 15mm}.plate{margin:0 15mm}}
  @media print{.card,.sig,.tb tr,.vplate{break-inside:avoid}.card.long{break-inside:auto}}`;
}
function build(chart, profile, opts){
  opts = opts || {}; const th = TH, only = Array.isArray(opts.sections) ? opts.sections : null;
  const pr = Object.assign({}, ID, profile || {}), asc = SIGN[chart.ascendant.sign], mo = chart.planets.Moon, su = chart.planets.Sun;
  const title = opts.title || 'Vedic Birth Chart Reading', subtitle = opts.subtitle || 'A personal reading of your chart: character, strengths, timing and the points that deserve care';
  const body = {}; SECTIONS.forEach(s => { if (only && only.indexOf(s[0]) < 0){ body[s[0]] = ''; return; } let h = ''; try { h = s[3](chart, { asks: true, why: true }); } catch (e) { h = ''; if (window.console) console.warn('PDFR: section ' + s[0] + ' failed: ' + (e && e.message)); } body[s[0]] = h; });
  const info = id => SECTIONS.find(s => s[0] === id);
  let n = 0, partNo = 0, main = '', tocBits = '';
  PARTS.forEach(p => {
    const ids = p.secs.filter(id => body[id] && info(id)); if (!ids.length) return; partNo++;
    const first = n + 1;
    main += `<section class="divider" id="p-${partNo}"><div class="pn">${p.n}</div>${mandala(th.accent2, .5)}<div><div class="kick">Part ${p.n}</div><h2>${esc(p.title)}</h2><div class="head">${esc(p.head)}</div><div class="rule"></div><p class="q">${esc(p.quote)}</p><ul>${ids.map((id, i) => `<li><b>${pad2(first + i)}</b>${esc(info(id)[1])}</li>`).join('')}</ul></div></section>`;
    tocBits += `<div class="tp"><i>${p.n}</i>${esc(p.title)}</div><ol>`;
    ids.forEach(id => { n++; const s = info(id); main += sec(id, pad2(n), s[1], s[2], 'Part ' + p.n + ' · ' + p.title, body[id]); tocBits += `<li><em>${pad2(n)}</em><a href="#s-${id}"><b>${esc(s[1])}</b><small>${esc(s[2])}</small></a></li>`; });
    tocBits += '</ol>';
  });
  const today = new Date(), made = today.getDate() + ' ' + MON[today.getMonth()] + ' ' + today.getFullYear(), birth = [pr.dob, pr.tob].filter(Boolean).join(', ');
  const cover = `<div class="cover">${zodiacWheel(chart.ascendant.sign, th.accent2, th.night1)}${mandala(th.accent2, .35)}<div><div class="om">ॐ</div></div><div class="main"><div class="kick">Vedic astrology · sidereal Lahiri</div><h1>${esc(title)}</h1><div class="sub">${esc(subtitle)}</div><div class="rule"></div><div class="who">${esc(pr.name || 'Your chart')}</div>` +
    `<dl>${birth ? `<dt>Born</dt><dd>${esc(birth)}</dd>` : ''}${pr.place ? `<dt>Place</dt><dd>${esc(pr.place)}</dd>` : ''}<dt>Rising</dt><dd>${esc(asc)}</dd><dt>Moon</dt><dd>${esc(SIGN[mo.sign])}${mo.nakshatra ? ', ' + esc(mo.nakshatra.name) : ''}</dd><dt>Sun</dt><dd>${esc(SIGN[su.sign])}</dd></dl></div>` +
    `<div class="foot"><span>${opts.preparedBy ? 'Prepared by ' + esc(opts.preparedBy) : 'Prepared with care'}</span><span>${esc(made)}</span></div></div>`;
  const toc = `<div class="toc"><h2>Contents</h2><div class="tl"></div>${tocBits}<div class="how"><b>How to read this report.</b> Everything here describes tendencies drawn from the position of the planets at your birth. It is not a prediction of fixed events. Read each section with the questions in mind, keep what fits your life and let the rest go.</div></div>`;
  const end = `<section class="end">${mandala(th.accent2, .3)}<div><h2>A last word</h2><p>Astrology offers a language for reflection. It cannot replace medical, legal, financial or psychological advice, and nothing here is a promise about what will happen.</p><p>Your choices, effort and circumstances shape your life far more than any chart. Use this reading to understand yourself better, then act on what you learn.</p><p class="sm">${esc(title)} · ${esc(pr.name || '')} · ${esc(made)}</p></div></section>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}${pr.name ? ' - ' + esc(pr.name) : ''}</title><style>${css(th, pr.name)}${typeof PDFR !== 'undefined' && PDFR.extraCss ? PDFR.extraCss(th) : ''}</style></head><body>${cover}${toc}${main}${end}</body></html>`;
}

/* ---------- one click: build the book and open the print window ---------- */
function ctx(){ return { chart: (typeof currentChartForModal !== 'undefined') ? currentChartForModal : null, profile: (typeof currentProfileForExport !== 'undefined') ? currentProfileForExport : null }; }
function note(m, ms){
  let el = document.getElementById('pdfr-note'); if (!el){ el = document.createElement('div'); el.id = 'pdfr-note'; el.className = 'pdfr-note'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = m; el.classList.add('on'); clearTimeout(note.t); note.t = setTimeout(() => el.classList.remove('on'), ms || 5000);
}
function generate(){
  const { chart, profile } = ctx(); if (!chart){ alert('Cast a chart first, then create the PDF.'); return; }
  note('Preparing your full report…', 8000);
  setTimeout(() => {
    let html; try { html = build(chart, profile); } catch (e) { note('Could not build the report: ' + (e && e.message || e), 8000); return; }
    const f = document.createElement('iframe'); f.setAttribute('aria-hidden', 'true'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0';
    let done = false;
    f.onload = () => {   // the empty about:blank frame fires 'load' first: print only once the book itself is in the frame
      if (done) return; let d = null; try { d = f.contentDocument; } catch (e) { d = null; }
      if (!d || !d.querySelector('.cover')) return; done = true;
      setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); window.focus(); note('Choose "Save as PDF" in the print window.', 6000); } catch (e) { window.focus(); note('Could not open the print window.', 6000); } setTimeout(() => f.remove(), 120000); }, 250);
    };
    f.srcdoc = html; document.body.appendChild(f);
  }, 60);
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-pdf-studio],[data-pdf-generate]'); if (b){ e.preventDefault(); if (typeof closeExportModal === 'function') closeExportModal(); generate(); } });
window.PDFR = { build, open: generate, generate, reg, sections: () => SECTIONS.map(s => s[0]), parts: PARTS,
  h: { SIGN, PL, P7, AB, esc, ordn, MON, fmtD, strip, dig, chip, tone, card, bar, hbar, pad2, north, vargaSvg, chartSvg, moonSvg, abbr, ring, radar, mandala, TH, savSvg } };
})();

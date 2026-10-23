/* ============================================================================
   PDF PAGES (js/98): the extra sections of the PDF book, registered into PDFR (js/93-pdf-report.js).
   panchang (birth details, Chara Karakas, outer planets), planets (one page per planet), lagnas (special lagnas + Bhava Chalit), shadbala, ashtakavarga,
   gallery (all divisional charts as drawings), dashas (every Mahadasha and Antardasha), glossary, notes.
   Hand-written; reads the chart object and the existing engines (VDB, VNK, VMF, VDA); no libraries, no network. Tested by tests/pdf_report_test.py.
   ============================================================================ */
(function(){
'use strict';
const P = window.PDFR; if (!P) return;
const { SIGN, PL, P7, esc, ordn, fmtD, chip, tone, card, hbar, pad2, north, vargaSvg, TH } = P.h;
const OWN = { Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10] };
const GLY = { Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋' };
const glyph = n => (GLY[n] || '●') + '︎';
const prof = () => (typeof currentProfileForExport !== 'undefined' && currentProfileForExport) || {};
const dms = x => { const d = Math.floor(x), m = Math.floor((x - d) * 60), s = Math.round(((x - d) * 60 - m) * 60); return d + '° ' + pad2(m) + '′ ' + pad2(s === 60 ? 59 : s) + '″'; };
const lonTxt = l => SIGN[Math.floor(l / 30) % 12] + ' ' + (l % 30).toFixed(1) + '°';
const hr = (n, a) => ((n - a + 12) % 12) + 1;
const th = (cells) => `<tr>${cells.map(c => `<th>${esc(c)}</th>`).join('')}</tr>`;
const table = (head, rows, cls) => `<table class="tb ${cls || ''}"><thead>${th(head)}</thead><tbody>${rows.join('')}</tbody></table>`;
const tr = (cells, cls) => `<tr${cls ? ` class="${cls}"` : ''}>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;

/* ---------- panchang, karakas, outer planets ---------- */
const VARA = { Sun: 'Sunday, the Sun\'s day: vitality, authority and a sense of purpose.', Moon: 'Monday, the Moon\'s day: feeling, care, the public and the home.', Mars: 'Tuesday, the day of Mars: energy, courage, drive and friction.', Mercury: 'Wednesday, Mercury\'s day: speech, learning, trade and quick thinking.', Jupiter: 'Thursday, Jupiter\'s day: guidance, growth, teaching and good fortune.', Venus: 'Friday, Venus\'s day: relationships, beauty, comfort and pleasure.', Saturn: 'Saturday, Saturn\'s day: discipline, duty, patience and slow, lasting results.' };
const TITHI = ['Nanda: a joyful, celebratory tithi, said to suit pleasant beginnings.', 'Bhadra: a steady, supportive tithi, good for work that needs persistence.', 'Jaya: a victorious tithi, good for effort, competition and success.', 'Rikta: an "empty" tithi, said to suit endings, clearing and letting go.', 'Purna: a "full" tithi, good for completing and fulfilling things.'];
const KARAKA = { Atmakaraka: 'The soul significator: the planet with the highest degree. It shows the lesson and the inner drive of this life.', Amatyakaraka: 'The minister: guides career, advisers and how you use your skills.', Bhratrikaraka: 'Siblings, courage and the effort you put into things.', Matrikaraka: 'Mother, nurture, home and emotional grounding.', Putrakaraka: 'Children, creativity, intelligence and what you create.', Gnatikaraka: 'Rivals, relatives and the obstacles you work through.', Darakaraka: 'The spouse significator: the planet with the lowest degree. It describes the partner you tend to attract.' };
function lt(jd, tz){ const d = new Date(jdToDate(jd).getTime() + tz * 3600000); return pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes()); }
function bPanchang(c){
  const pr = prof(), tz = c.tzOffsetHours; let p = null; try { p = panchangaAt(c.julianDay, +pr.lat, +pr.lon, tz); } catch (e) { p = null; }
  const fact = (k, v, s) => `<div><small>${esc(k)}</small><b>${esc(v)}</b>${s ? `<span class="sm">${esc(s)}</span>` : ''}</div>`;
  let out = `<p class="lead">The panchang is the five-part signature of the moment of birth: weekday, tithi, nakshatra, yoga and karana. It is the traditional calendar entry for the day you were born.</p>`;
  if (p){
    const tn = ((p.tithi.num - 1) % 15) % 5;
    out += `<div class="facts">${fact('Weekday (Vara)', p.vara.name, 'Ruled by ' + p.vara.lord)}${fact('Tithi', p.tithi.paksha + ' ' + p.tithi.name, 'Lunar day ' + p.tithi.num)}${fact('Moon\'s nakshatra', p.nakshatra.name, 'Pada ' + p.nakshatra.pada + ' · lord ' + p.nakshatra.lord)}${fact('Yoga', p.yoga.name, 'Number ' + p.yoga.num + ' of 27')}${fact('Karana', p.karana.name, p.karana.vishti ? 'Vishti (Bhadra) karana' : 'Half of a tithi')}${fact('Local birth time', lt(c.julianDay, tz), 'UTC' + (tz >= 0 ? '+' : '') + tz)}${fact('Sunrise', lt(p.sunrise, tz), 'Local time')}${fact('Sunset', lt(p.sunset, tz), 'Local time')}${fact('Ayanamsa (Lahiri)', dms(c.ayanamsa), 'Sidereal correction')}</div>`;
    out += `<h3 class="grp">What the five parts say</h3><p><b>Vara.</b> ${esc(VARA[p.vara.lord] || '')}</p><p><b>Tithi.</b> ${esc(p.tithi.paksha === 'Shukla' ? 'Born in the waxing half of the month: growth, building and outward energy are emphasised.' : 'Born in the waning half of the month: reflection, release and inward energy are emphasised.')} ${esc(TITHI[tn])}</p><p><b>Nakshatra.</b> The Moon was in ${esc(p.nakshatra.name)}, ruled by ${esc(p.nakshatra.lord)}. This is your birth star and it also sets the starting point of your dasha sequence.</p><p><b>Yoga and karana.</b> Yoga (${esc(p.yoga.name)}) blends the longitudes of the Sun and Moon and colours the overall quality of the day. Karana (${esc(p.karana.name)}) is half a tithi${p.karana.vishti ? '; Vishti is traditionally considered a poor time to begin new ventures, though it says nothing fixed about a life' : ''}.</p>`;
  }
  const ck = c.charaKarakas;
  if (ck) out += `<h3 class="grp">Chara Karakas (the Jaimini significators)</h3><p class="sm">Planets ranked by how far they have travelled within their sign. Each one takes a role in your story.</p>` + table(['Role', 'Planet', 'Degree', 'What it describes'], Object.keys(ck).map(k => tr([`<b>${esc(k)}</b>`, esc(ck[k].planet), (ck[k].degree || 0).toFixed(2) + '°', esc(KARAKA[k] || '')])));
  if (c.outer) out += `<h3 class="grp">Uranus, Neptune and Pluto</h3><p class="sm">The outer planets are not part of the classical rules. They are shown for completeness and are slow, generational influences.</p>` + table(['Planet', 'Sign', 'Degree', 'House', 'Nakshatra'], ['Uranus', 'Neptune', 'Pluto'].filter(n => c.outer[n]).map(n => { const o = c.outer[n]; return tr([`<b>${esc(n)}</b>${o.retrograde ? ' ᴿ' : ''}`, esc(SIGN[o.sign]), (o.degInSign || 0).toFixed(1) + '°', o.house, o.nakshatra ? esc(o.nakshatra.name) + ' · ' + o.nakshatra.pada : '']); }));
  return out;
}

/* ---------- one page per planet ---------- */
function bPlanets(c){
  const r = VDB.reading(c), nk = (typeof VNK !== 'undefined' && VNK) ? VNK.forChart(c) : null, asc = c.ascendant.sign, F = VDB.functionalNature(asc);
  let out = `<p class="lead">One page for each of the nine planets: where it stands, what it is doing there, how strong its position is, and what that tends to mean in practice.</p>` + table(['Planet', 'Sign', 'House', 'Nakshatra · pada', 'Dignity', 'Motion'], PL.map(n => { const p = c.planets[n]; return tr([`<b>${glyph(n)} ${esc(n)}</b>`, esc(SIGN[p.sign]), p.house, p.nakshatra ? esc(p.nakshatra.name) + ' · ' + p.nakshatra.pada : '', esc(P.h.dig(p.dignity && p.dignity.status)), p.retrograde && n !== 'Rahu' && n !== 'Ketu' ? 'Retrograde' : (n === 'Rahu' || n === 'Ketu' ? 'Retrograde by nature' : 'Direct')]); }));
  PL.forEach(n => {
    const p = c.planets[n], rd = r.planets[n], vn = nk && nk.planets && nk.planets[n], conj = PL.filter(q => q !== n && c.planets[q].house === p.house), role = (typeof VMF !== 'undefined' && VMF && P7.indexOf(n) >= 0) ? VMF.role(n, asc) : null;
    const f = (k, v) => `<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`;
    const dg = P.h.dig(p.dignity && p.dignity.status) || 'Neutral', sb = c.shadbala && c.shadbala.planets && c.shadbala.planets[n], d9 = c.vargas.D9 && c.vargas.D9.planetVargaSign && c.vargas.D9.planetVargaSign[n], rules = (OWN[n] || []).map(sg => ordn(hr(sg, asc))), bv = c.ashtakavarga && c.ashtakavarga.bavTables && c.ashtakavarga.bavTables[n];
    out += `<div class="plate"><div class="pl-head"><div class="pl-glyph">${glyph(n)}</div><div><small>${esc(ordn(p.house))} house · ${esc(SIGN[p.sign])}${rules.length ? ' · rules the ' + esc(rules.join(' and ')) + ' house' + (rules.length > 1 ? 's' : '') : ''}</small><h3>${esc(n)} in ${esc(SIGN[p.sign])}</h3>${F[n] ? chip(F[n].kind, F[n].kind === 'Yogakaraka' || F[n].kind === 'Functional benefic' ? 'g' : F[n].kind === 'Functional malefic' ? 'b' : '') : ''}${chip(dg, /exalt|own|friend/i.test(dg) ? 'g' : /debil|enemy/i.test(dg) ? 'b' : '')}${p.retrograde && n !== 'Rahu' && n !== 'Ketu' ? chip('Retrograde', 'b') : ''}${p.combustion && p.combustion.combust ? chip('Combust', 'b') : ''}</div></div>` +
      `<div class="facts">${f('Position', (p.degInSign || 0).toFixed(2) + '° ' + SIGN[p.sign])}${f('Nakshatra', p.nakshatra ? p.nakshatra.name + ', pada ' + p.nakshatra.pada : '–')}${f('Star lord · deity', p.nakshatra ? p.nakshatra.lord + ' · ' + p.nakshatra.deity : '–')}${f('Daily motion', (p.speed != null ? p.speed.toFixed(2) + '° / day' : '–'))}${f('Looks at house', (p.aspectsHouses || []).map(ordn).join(', ') || '–')}${f('Shares the house with', conj.join(', ') || 'no other planet')}${f('Navamsa (D9) sign', d9 != null ? SIGN[d9] : '–')}${f('Strength (Shadbala)', sb ? sb.percentOfRequired.toFixed(0) + '% of the requirement' : 'Not measured for the nodes')}${f(bv ? 'Ashtakavarga points in its sign' : 'Nature', bv ? bv[p.sign] + ' of 8' : 'Shadow planet')}</div>` +
      (role ? `<p><b>What it does for ${esc(SIGN[asc])} rising.</b> It ${esc(role.gives)}. It can feel ${esc(role.feels)}. Watch for ${esc(role.watch)}.</p>` : '') +
      (rd && rd.inHouse ? `<h5>In the ${esc(ordn(p.house))} house</h5><p>${esc(P.h.strip(rd.inHouse.text))}</p>` : '') + (rd && rd.inSign ? `<h5>In ${esc(SIGN[p.sign])}</h5><p>${esc(P.h.strip(rd.inSign.text))}</p>` : '') +
      (vn ? `<h5>In ${esc(p.nakshatra.name)}, pada ${p.nakshatra.pada}</h5><p>${esc(vn.text || vn.how || '')}</p>` : '') +
      (p.retrograde && n !== 'Rahu' && n !== 'Ketu' ? `<p class="sm"><b>Retrograde.</b> A retrograde planet turns its energy inward. Its results often come later, in a revised form, or through rethinking.</p>` : '') +
      (p.combustion && p.combustion.combust ? `<p class="sm"><b>Combust.</b> Very close to the Sun, this planet's own voice is overshadowed. Its themes may need conscious attention to come through.</p>` : '') +
      (conj.length ? `<p class="sm"><b>Conjunction.</b> ${esc(n)} shares the ${esc(ordn(p.house))} house with ${esc(conj.join(' and '))}; their themes blend and are read together.</p>` : '') + `</div>`;
  });
  return out;
}

/* ---------- special lagnas and Bhava Chalit ---------- */
const LAG = [['AL', 'Arudha Lagna (AL)', 'How the world sees you: your public image'], ['UL', 'Upapada Lagna (UL)', 'Marriage and the nature of primary partnerships'], ['KL', 'Karakamsha (KL)', 'The calling of the soul, read from the Atmakaraka'], ['HL', 'Hora Lagna (HL)', 'Wealth and the ability to earn'], ['GL', 'Ghati Lagna (GL)', 'Power, authority and influence'], ['BL', 'Bhava Lagna (BL)', 'The sense of life direction and the body\'s vitality'], ['VGL', 'Vighati Lagna', 'Fine timing of the birth moment'], ['VL', 'Varnada Lagna (VL)', 'Social standing and livelihood'], ['INDU', 'Indu Lagna', 'Wealth potential through the Moon'], ['SL', 'Shree Lagna (SL)', 'Prosperity and grace'], ['PRANAPADA', 'Pranapada Lagna', 'Life force and vitality'], ['SWAMSHA', 'Swamsha', 'The inner self and spiritual path'], ['PADANADHAMSA', 'Padanadhamsa', 'Place in the community'], ['BB', 'Bhrigu Bindu', 'A sensitive karmic trigger point'], ['PAKA', 'Paka Lagna', 'Maturity and ripening of results'], ['CHANDRA', 'Chandra Lagna', 'The chart counted from the Moon'], ['SURYA', 'Surya Lagna', 'The chart counted from the Sun'], ['A2', 'Dhana Pada (A2)', 'Perceived wealth, family resources and speech'], ['A3', 'Bhatru Pada (A3)', 'Siblings and courage'], ['A4', 'Matru Pada (A4)', 'Mother, home and comfort'], ['A5', 'Mantra Pada (A5)', 'Intelligence, children and merit'], ['A6', 'Roga Pada (A6)', 'Health challenges, service and rivals'], ['A8', 'Mrityu Pada (A8)', 'Transformation and sudden change'], ['A9', 'Pitri Pada (A9)', 'Father, fortune and guidance'], ['A10', 'Rajya Pada (A10)', 'Career and public status'], ['A11', 'Labha Pada (A11)', 'Gains, income and aspirations']];
function bLagnas(c){
  let S = null; try { S = computeAllSpecialLagnaSigns(c); } catch (e) { S = null; } if (!S) return '';
  const asc = c.ascendant.sign, pr = prof();
  const rows = LAG.filter(x => S[x[0]] != null && !isNaN(S[x[0]])).map(x => tr([`<b>${esc(x[1])}</b>`, esc(x[2]), esc(SIGN[S[x[0]]]), ordn(hr(S[x[0]], asc)) + ' house']));
  let out = `<p class="lead">Besides the rising sign, classical astrology uses special points that each look at one theme of life. Each is shown as a sign and as the house it falls in when counted from your rising sign.</p>` + table(['Point', 'What it looks at', 'Sign', 'From rising sign'], rows);
  let bc = null; try { bc = computeBhavaChalit(c, +pr.lat, +pr.lon); } catch (e) { bc = null; }
  if (bc){
    const pl = n => { const v = bc.place && bc.place[n]; return typeof v === 'number' ? v : (v && (v.house || v.n)) || null; };
    out += `<h3 class="grp">Bhava Chalit: houses by degrees</h3><p class="sm">The main chart uses whole signs as houses. Bhava Chalit (Sripati) instead centres each house on its midpoint. A planet near a house edge can fall in the neighbouring house here; its results then colour that house as well.</p>` +
      table(['House', 'Begins', 'Middle', 'Ends'], bc.houses.map(h => tr([`<b>${h.n}</b>`, lonTxt(h.begin), lonTxt(h.madhya), lonTxt(h.end)]))) +
      table(['Planet', 'House in the chart', 'House in Bhava Chalit', ''], PL.map(n => { const a = c.planets[n].house, b = pl(n); return tr([`<b>${esc(n)}</b>`, a, b == null ? '–' : b, b != null && b !== a ? chip('moves house', 'b') : '']); }));
  }
  return out;
}

/* ---------- Shadbala ---------- */
function bShadbala(c){
  const S = c.shadbala && c.shadbala.planets; if (!S) return '';
  const v = (n, f) => { const x = S[n] && S[n][f]; return x == null ? 0 : (typeof x === 'object' ? x.total : x); };
  const verdict = p => p >= 150 ? ['Very strong', 'g'] : p >= 100 ? ['Strong', 'g'] : p >= 75 ? ['Moderate', ''] : ['Below the requirement', 'b'];
  const rows = P7.filter(n => S[n]).map(n => { const s = S[n], vd = verdict(s.percentOfRequired); return tr([`<b>${glyph(n)} ${esc(n)}</b>`, v(n, 'sthanaBala').toFixed(0), v(n, 'digBala').toFixed(0), v(n, 'kalaBala').toFixed(0), v(n, 'chestaBala').toFixed(0), v(n, 'naisargikaBala').toFixed(0), v(n, 'drikBala').toFixed(0), `<b>${s.totalRupas.toFixed(2)}</b>`, s.requiredRupas, `<b>${s.percentOfRequired.toFixed(0)}%</b>`, chip(vd[0], vd[1])]); });
  const ordered = P7.filter(n => S[n]).slice().sort((a, b) => S[b].percentOfRequired - S[a].percentOfRequired);
  const bars = P7.filter(n => S[n]).map(n => hbar(n, S[n].percentOfRequired, 200, S[n].percentOfRequired.toFixed(0) + '%', S[n].percentOfRequired >= 100 ? 'g' : 'b')).join('');
  const sub = P7.filter(n => S[n]).map(n => { const s = S[n].sthanaBala, k = S[n].kalaBala; return tr([`<b>${esc(n)}</b>`, (s.uchcha || 0).toFixed(0), (s.saptavargaja || 0).toFixed(0), (s.ojaYugma || 0).toFixed(0), (s.kendradi || 0).toFixed(0), (s.drekkana || 0).toFixed(0), (k.nathonnata || 0).toFixed(0), (k.paksha || 0).toFixed(0), (k.tribhaga || 0).toFixed(0), (k.vmdh || 0).toFixed(0), (k.ayana || 0).toFixed(0)]); });
  const lords = ['dinaLord', 'horaLord', 'masaLord', 'varshaLord'].filter(k => c.shadbala[k]).map(k => `${({ dinaLord: 'Lord of the day', horaLord: 'Lord of the hour', masaLord: 'Lord of the month', varshaLord: 'Lord of the year' })[k]}: ${c.shadbala[k]}`);
  return `<p class="lead">Shadbala is the classical "six-fold strength" of a planet: position, direction, time, motion, natural strength and aspects. Each planet needs a minimum number of rupas to act well. Above 100% of the requirement, a planet delivers its results readily; below it, results need more effort or arrive in a diluted form.</p>` +
    `<h3 class="grp">Strength against the requirement</h3><div class="parts">${bars}</div><p class="sm">The full bar is 200%. A planet needs 100% to meet the classical minimum.</p>` +
    `<p><b>Strongest:</b> ${esc(ordered[0])} (${S[ordered[0]].percentOfRequired.toFixed(0)}%). <b>Needs the most support:</b> ${esc(ordered[ordered.length - 1])} (${S[ordered[ordered.length - 1]].percentOfRequired.toFixed(0)}%). ${lords.length ? esc(lords.join(' · ')) + '.' : ''}</p>` +
    `<h3 class="grp">The six strengths (in virupas)</h3>` + table(['Planet', 'Position', 'Direction', 'Time', 'Motion', 'Natural', 'Aspect', 'Total (rupas)', 'Needs', '% of need', 'Verdict'], rows) +
    `<h3 class="grp">Inside position and time</h3><p class="sm">Position strength (Sthana) is made of five parts and time strength (Kala) of five more. These are the working figures behind the table above.</p>` + table(['Planet', 'Exalt.', 'Seven charts', 'Odd/even', 'Kendra', 'Decan', 'Day/night', 'Moon phase', 'Third of day', 'Weekday etc.', 'Ayana'], sub) +
    `<h3 class="grp">How to read it</h3><p>A strong planet is easier to use: its house and themes tend to be well supported. A planet below the requirement is not "bad"; it is the one that asks for more conscious effort, patience or support from the other planets. Read Shadbala together with the dignity of the planet and with the Ashtakavarga on the next pages.</p>`;
}

/* ---------- Ashtakavarga ---------- */
function miniBars(vals, max, avg){
  const W = 320, Hh = 130, bw = 18, gap = 7.5, x0 = 8; let g = `<line x1="4" y1="${Hh - 22}" x2="${W}" y2="${Hh - 22}" stroke="${TH.rule}"/>`;
  const ay = Hh - 22 - (avg / max) * (Hh - 44); g += `<line x1="4" y1="${ay.toFixed(1)}" x2="${W}" y2="${ay.toFixed(1)}" stroke="${TH.accent}" stroke-dasharray="3 3" stroke-width=".8"/>`;
  vals.forEach((b, i) => { const h = (b / max) * (Hh - 44), x = x0 + i * (bw + gap), y = Hh - 22 - h; g += `<rect x="${x}" y="${y.toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="3" fill="${b >= avg + 1.5 ? TH.accent : b <= avg - 1.5 ? '#b9b3a6' : TH.accent2}"/><text x="${x + bw / 2}" y="${(y - 3).toFixed(1)}" text-anchor="middle" style="font:700 9px Arial;fill:${TH.ink}">${b}</text><text x="${x + bw / 2}" y="${Hh - 9}" text-anchor="middle" style="font:8px Arial;fill:${TH.soft}">${i + 1}</text>`; });
  return `<svg class="bar-svg" viewBox="0 0 ${W + 4} ${Hh}" role="img" aria-label="Points by house">${g}</svg>`;
}
function bAshtakavarga(c){
  const A = c.ashtakavarga; if (!A || !A.bavTables || !A.sav) return '';
  const asc = c.ascendant.sign, house = i => (asc + i) % 12;
  const cls = (v, kind) => kind === 'sav' ? (v < 24 ? 'h0' : v < 28 ? 'h1' : v < 31 ? 'h2' : v < 34 ? 'h3' : 'h4') : (v <= 2 ? 'h0' : v === 3 ? 'h1' : v === 4 ? 'h2' : v === 5 ? 'h3' : 'h4');
  const hdr = ['Planet'].concat(Array.from({ length: 12 }, (_, i) => 'H' + (i + 1)), ['Total']);
  const rows = P7.filter(n => A.bavTables[n]).map(n => { const v = Array.from({ length: 12 }, (_, i) => A.bavTables[n][house(i)]); return `<tr><td><b>${esc(n)}</b></td>${v.map(x => `<td class="${cls(x)}">${x}</td>`).join('')}<td><b>${v.reduce((a, b) => a + b, 0)}</b></td></tr>`; });
  const sv = Array.from({ length: 12 }, (_, i) => A.sav[house(i)]), tot = sv.reduce((a, b) => a + b, 0), avg = tot / 12;
  rows.push(`<tr><td><b>All (Sarva)</b></td>${sv.map(x => `<td class="${cls(x, 'sav')}"><b>${x}</b></td>`).join('')}<td><b>${tot}</b></td></tr>`);
  const sign = table(['Sign'].concat(SIGN.map(s => s.slice(0, 3))), [tr(['<b>Points</b>'].concat(A.sav.map(x => `<b>${x}</b>`)), ''), tr(['House from rising sign'].concat(SIGN.map((s, i) => hr(i, asc))), '')], 'heatrow');
  const nm = n => `${n}: ` + (() => { const v = Array.from({ length: 12 }, (_, i) => [A.bavTables[n][house(i)], i + 1]); const hi = v.slice().sort((a, b) => b[0] - a[0] || a[1] - b[1]).slice(0, 2), lo = v.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]).slice(0, 2); return `most points in the ${hi.map(x => ordn(x[1]) + ' (' + x[0] + ')').join(' and ')}, fewest in the ${lo.map(x => ordn(x[1]) + ' (' + x[0] + ')').join(' and ')}`; })();
  const bars = P7.filter(n => A.bavTables[n]).map(n => `<figure><h5>${glyph(n)} ${esc(n)} · ${A.bavTables[n].reduce((a, b) => a + b, 0)} points</h5>${miniBars(Array.from({ length: 12 }, (_, i) => A.bavTables[n][house(i)]), 8, A.bavTables[n].reduce((a, b) => a + b, 0) / 12)}</figure>`).join('');
  return `<p class="lead">Ashtakavarga gives every planet eight "voices" that each add or withhold a point in every sign. The result is a map of support: a house with many points tends to help what it holds; one with few asks for more effort.</p>` +
    `<h3 class="grp">Points in each house, by planet</h3><p class="sm">Columns are houses counted from your ${esc(SIGN[asc])} rising sign. Darker means more points. A single planet's total is fixed by the system, so compare houses within a row.</p><table class="tb heat"><thead>${th(hdr)}</thead><tbody>${rows.join('')}</tbody></table>` +
    `<p>The Sarva total is ${tot} (the system gives 337 in total across a chart). The average is ${avg.toFixed(1)} points per house; houses at ${Math.ceil(avg + 3)} or more are well supported, and houses at ${Math.floor(avg - 3)} or fewer are thinner.</p>` +
    `<h3 class="grp">The same points, sign by sign</h3>${sign}` +
    `<h3 class="grp">Each planet's pattern</h3><div class="grid2">${bars}</div><ul class="ul">${P7.filter(n => A.bavTables[n]).map(n => `<li>${esc(nm(n))}.</li>`).join('')}</ul>`;
}

/* ---------- gallery of every divisional chart ---------- */
function bGallery(c){
  if (typeof VARGAS === 'undefined') return ''; const keys = Object.keys(c.vargas).filter(k => VARGAS[k]); if (!keys.length) return '';
  const out = keys.map(k => {
    const v = c.vargas[k], info = VARGAS[k], pv = v.planetVargaSign || {}, rows = PL.filter(n => pv[n] != null).map(n => tr([`<b>${esc(n)}</b>`, esc(SIGN[pv[n]]), hr(pv[n], v.ascendantSign)]));
    return `<div class="vplate"><div>${vargaSvg(c, k, TH)}</div><div><h4>${esc(k)} · ${esc(info.name)}</h4><p class="sm"><b>${esc(info.full)}.</b> ${esc(info.desc)}. Rising sign in this chart: ${esc(SIGN[v.ascendantSign])}.</p>${table(['Planet', 'Sign', 'House'], rows)}</div></div>`;
  }).join('');
  return `<p class="lead">All ${keys.length} divisional charts the app calculates, drawn in the North Indian style. Each divides every sign into smaller parts to look at one theme of life more closely. The six most used (D9, D10, D7, D4, D24, D20) are also read in words in the previous section.</p>` + out;
}

/* ---------- every Mahadasha and Antardasha ---------- */
const DCOL = { Sun: '#d98a2b', Moon: '#7da6c9', Mars: '#c0533f', Mercury: '#5f9e6e', Jupiter: '#c9a94c', Venus: '#c47aa0', Saturn: '#6b6f82', Rahu: '#7a5a8c', Ketu: '#a07a5a' };
function dashaLine(T){
  const per = T.periods, t0 = new Date(per[0].start).getTime(), t1 = new Date(per[per.length - 1].end).getTime(), W = 700, X = d => 10 + (new Date(d).getTime() - t0) / (t1 - t0) * (W - 20); let g = '';
  per.forEach(p => { const x = X(p.start), w = X(p.end) - x; g += `<rect x="${x.toFixed(1)}" y="30" width="${w.toFixed(1)}" height="46" fill="${DCOL[p.lord] || TH.accent}" ${p.status === 'now' ? `stroke="${TH.ink}" stroke-width="2"` : ''}/><text x="${(x + w / 2).toFixed(1)}" y="56" text-anchor="middle" style="fill:#fff;font:700 ${w > 44 ? 11 : 8}px Arial">${esc(w > 44 ? p.lord : p.lord.slice(0, 2))}</text><text x="${(x + w / 2).toFixed(1)}" y="93" text-anchor="middle" style="fill:${TH.soft}">${Math.round(p.ageStart)}</text>`; });
  const now = Date.now(); if (now > t0 && now < t1) g += `<line x1="${X(now).toFixed(1)}" y1="18" x2="${X(now).toFixed(1)}" y2="82" stroke="${TH.ink}" stroke-width="2"/><text x="${X(now).toFixed(1)}" y="12" text-anchor="middle" style="fill:${TH.ink};font:700 10px Arial">today</text>`;
  return `<svg class="tline" viewBox="0 0 ${W} 108" role="img" aria-label="Timeline of the nine Mahadashas">${g}<text x="10" y="106" style="fill:${TH.soft};font:10px Arial">Numbers under the bars are your age when each period begins.</text></svg>`;
}
function bDashas(c){
  if (typeof VDA === 'undefined' || !VDA || !c.dashaData) return ''; const T = VDA.timeline(c); let cur = null; try { cur = VDA.current(c); } catch (e) { cur = null; }
  let out = `<p class="lead">The Vimshottari dasha system divides life into nine long periods (Mahadashas), each ruled by a planet and each split into nine sub-periods (Antardashas). The order and lengths come from the Moon's nakshatra at birth. Here is every period of your life, with each sub-period.</p>${dashaLine(T)}`;
  if (cur && cur.md) out += card(`Running now: ${esc(cur.md.lord)} Mahadasha${cur.ad ? ' · ' + esc(cur.ad.lord) + ' Antardasha' : ''}`, `<p>${esc(cur.md.text || '')}</p>${cur.ad ? `<p>${esc(cur.ad.blend || '')}</p>` : ''}`, 'now');
  T.periods.forEach((p, i) => {
    const ads = VDA.antardashas(c, i);
    out += `<div class="dblock"><div class="pl-head"><div class="pl-glyph" style="background:${DCOL[p.lord] || TH.accent}">${glyph(p.lord)}</div><div><small>${fmtD(new Date(p.start))} – ${fmtD(new Date(p.end))} · age ${p.ageStart}–${p.ageEnd} · ${Math.round(p.years * 10) / 10} years</small><h3>${esc(p.lord)} Mahadasha</h3>${p.status === 'now' ? chip('running now', 'g') : p.status === 'past' ? chip('past') : chip('ahead')}${chip(p.tone, tone(p.tone))}</div></div>` +
      `<p>${esc(p.text || '')}</p>${p.arenaText ? `<p class="sm">${esc(p.arenaText)}</p>` : ''}` + table(['Sub-period', 'Dates', 'Tone', 'What the blend tends to feel like'], ads.map(a => tr([`<b>${esc(p.lord)}–${esc(a.lord)}</b>`, fmtD(new Date(a.start)) + ' – ' + fmtD(new Date(a.end)), chip(a.tone, tone(a.tone)), esc(a.blend)], a.status === 'now' ? 'now' : a.status === 'past' ? 'past' : ''))) + `</div>`;
  });
  return out;
}

/* ---------- glossary and notes ---------- */
const GL = [['Lagna (rising sign)', 'The sign rising on the eastern horizon at birth. It starts the first house and anchors the whole chart.'], ['Rashi', 'A zodiac sign. There are twelve, each 30° long.'], ['Bhava (house)', 'One of twelve areas of life, counted from the rising sign. This report uses whole-sign houses.'], ['Graha (planet)', 'The nine bodies of Vedic astrology: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn and the lunar nodes Rahu and Ketu.'], ['Nakshatra', 'One of 27 lunar mansions of 13°20′ each. The Moon\'s nakshatra at birth is your "birth star".'], ['Pada', 'A quarter of a nakshatra (3°20′). Each pada links to one navamsa sign.'], ['Dignity', 'How comfortable a planet is in a sign: exalted, own sign, friend, neutral, enemy or debilitated.'], ['Retrograde (vakri)', 'A planet that appears to move backwards. Its results often turn inward or come late.'], ['Combustion (asta)', 'A planet very close to the Sun, which dims its own results.'], ['Aspect (drishti)', 'A planet\'s line of sight to a house. All planets look at the 7th house from where they stand; Mars, Jupiter and Saturn have extra aspects.'], ['Yoga', 'A combination of planets that gives a particular result. Some are supportive, some ask for care.'], ['Dosha', 'A challenging combination or condition. It marks an area for attention, not a verdict.'], ['Karaka', 'A natural significator: the planet that represents a theme in any chart (Venus for relationships, Jupiter for wisdom).'], ['Functional nature', 'Whether a planet helps or strains you for your particular rising sign, based on the houses it rules.'], ['Yogakaraka', 'A planet that rules both a trine and a corner house for your rising sign. It is especially helpful.'], ['Vimshottari dasha', 'The 120-year cycle of planetary periods starting from the Moon\'s nakshatra.'], ['Mahadasha / Antardasha', 'The main period and its sub-period. Their two lords together colour the time.'], ['Shadbala', 'The six-fold strength of a planet, measured in rupas against a required minimum.'], ['Ashtakavarga', 'A system of points that shows how well each sign and house is supported by the planets.'], ['Varga (divisional chart)', 'A chart made by dividing each sign into parts. The navamsa (D9) is the best known.'], ['Gochar (transit)', 'The current movement of planets through the signs, read from the natal Moon.'], ['Sade Sati', 'The roughly 7½-year period when Saturn crosses the sign before, of and after the natal Moon.'], ['Dhaiya', 'A 2½-year Saturn period when it crosses the 4th or 8th sign from the Moon.'], ['Double transit', 'Jupiter and Saturn both influencing the same house at the same time, a classic marker of active timing.'], ['Arudha', 'The "image" of a house: how it appears to the world rather than how it is.'], ['Ayanamsa', 'The angle between the tropical and sidereal zodiacs. This report uses Lahiri (Chitrapaksha).']];
function bGlossary(){ return `<p class="lead">The terms used in this report, in plain words.</p><dl class="gl">${GL.map(g => `<dt>${esc(g[0])}</dt><dd>${esc(g[1])}</dd>`).join('')}</dl>`; }
function bNotes(c){
  const pr = prof(), rows = PL.map(n => { const p = c.planets[n]; return tr([`<b>${esc(n)}</b>`, lonTxt(p.longitude), (p.longitude).toFixed(4) + '°', p.house, p.nakshatra ? esc(p.nakshatra.name) + ' ' + p.nakshatra.pada : '']); });
  return `<h3 class="grp">Your chart in numbers</h3>` + table(['Body', 'Sidereal position', 'Longitude', 'House', 'Nakshatra'], [tr(['<b>Ascendant</b>', lonTxt(c.ascendant.longitude), c.ascendant.longitude.toFixed(4) + '°', 1, c.ascendant.nakshatra ? esc(c.ascendant.nakshatra.name || '') : ''])].concat(rows)) +
    `<p class="sm">Julian day ${c.julianDay.toFixed(4)} · Lahiri ayanamsa ${dms(c.ayanamsa)} · UTC${c.tzOffsetHours >= 0 ? '+' : ''}${c.tzOffsetHours}${pr.place ? ' · ' + esc(pr.place) : ''}</p>` +
    `<h3 class="grp">How this reading was made</h3><ul class="ul"><li>Positions are sidereal (Lahiri ayanamsa) and houses are whole signs, counted from the rising sign.</li><li>Dashas use the Vimshottari system, starting from the Moon's nakshatra at birth.</li><li>Shadbala and Ashtakavarga follow the classical methods; Yogas and Doshas are found by exact rules and listed with the reason each one appears.</li><li>The text is composed from a structured database of planet, sign, house, nakshatra and dasha facets, so the same chart gives the same reading each time.</li><li>Life-area scores compare the nine areas inside one chart. They are calibrated summaries, not predictions.</li></ul>` +
    `<h3 class="grp">A note on use</h3><p>This report describes tendencies. It is a tool for reflection and not medical, legal, financial or psychological advice. Where a line does not fit your life, trust your own experience. If you have the exact birth time from a record, accuracy improves everything here; a few minutes of difference can change the rising sign and the divisional charts.</p>` +
    `<div class="ruled" style="break-before:page"><h3 class="grp" style="margin-top:0">Your notes</h3></div><div class="ruled" style="break-before:page"><h3 class="grp" style="margin-top:0">Your notes</h3></div>`;
}

P.reg('panchang', 'Panchang, Chara Karakas and outer planets', 'The five-part signature of your birth moment', bPanchang);
P.reg('planets', 'Planet by planet', 'One page for each of the nine planets', bPlanets);
P.reg('lagnas', 'Special lagnas and Bhava Chalit', 'Arudha, Hora, Ghati and other points that look at one theme each', bLagnas);
P.reg('shadbala', 'Shadbala: strength of the planets', 'The six-fold strength of each planet against the classical minimum', bShadbala);
P.reg('ashtakavarga', 'Ashtakavarga: support behind each house', 'Points by planet, by house and by sign', bAshtakavarga);
P.reg('gallery', 'Every divisional chart', 'All the divisional charts the app calculates, drawn out', bGallery);
P.reg('dashas', 'Every Mahadasha and Antardasha', 'The full dasha map of your life, period by period', bDashas);
P.reg('glossary', 'Glossary', 'The terms in this report, in plain words', bGlossary);
P.reg('notes', 'Numbers, method and notes', 'The data behind the reading, and space for your own notes', bNotes);
P.extraCss = th => `.dblock{break-before:page}.dhead{margin-bottom:4mm}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:5mm 8mm;margin-bottom:5mm}.grid2 figure{margin:0;break-inside:avoid}.grid2 h5{margin:0 0 1mm}.vplate .tb td,.vplate .tb th{padding:1.3mm 2mm}.heatrow td{text-align:center}.heatrow td:first-child{text-align:left}`;
})();

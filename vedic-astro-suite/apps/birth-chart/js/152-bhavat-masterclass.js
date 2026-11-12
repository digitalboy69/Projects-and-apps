/* Bhavat Bhavam Masterclass (js/152). Global BMC. Teaching data lives in js/151 (BMD).
   Counting: house X counted from house Y = ((Y-1)+(X-1)) mod 12 + 1. Same-number pair: derived(N) = ((2N-2) mod 12) + 1.
   Support score (a teaching aid, tag C, not a verdict): lord in kendra/trikona +1 (in 6/8/12 -1, except for the 6th/8th/12th houses themselves: 0);
   lord exalted/own/moolatrikona +1, debilitated -1; occupants: Moon, Jupiter, Venus, Mercury +1 each, Sun, Mars, Saturn, Rahu, Ketu -1 each (0 in 3/6/10/11), clamped to -2..+2;
   aspects from outside: Jupiter or Venus +1, Mars/Saturn/Rahu/Ketu -1, clamped to -1..+1; Sarvashtakavarga of the house sign >= 30 +1, <= 25 -1.
   Timing: the current Mahadasha / Antardasha lord is "active" when it is the lord or an occupant of the house or of its derived house.
   Uses SIGNS, chart.planets[n].{house,sign,dignity,aspectsHouses}, chart.ashtakavarga.sav, chart.dashaData, calculateAntardashas (js/10). Classes bmc- prefixed. Tendency wording only. */
const BMC = (() => {
  const D = BMD;
  const GR = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const KEND = [1, 4, 5, 7, 9, 10], DUS = [6, 8, 12], UPA = [3, 6, 10, 11];
  const BEN = ['Moon', 'Jupiter', 'Venus', 'Mercury'], MAL = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];
  const STRONG = ['Exalted', 'OwnSign', 'Moolatrikona'];
  const KARAKA_OWN = { 3: 'Mars', 5: 'Jupiter', 9: 'Sun' };
  const ORD = n => n + (['st', 'nd', 'rd'][n - 1] || 'th');
  const ref = (x, y) => ((y - 1 + x - 1) % 12) + 1;
  const derived = n => ref(n, n);
  const inv = (h, y) => ((h - y + 12) % 12) + 1;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const G = n => (typeof PLANET_GLYPHS !== 'undefined' && PLANET_GLYPHS[n]) || '';
  const pl = a => a.length ? a.map(n => `${G(n)} ${n}`.trim()).join(', ') : 'empty';
  const sgn = v => (v > 0 ? '+' : '') + v;
  let lastChart = null, perTxt = '';

  function facts(chart, h) {
    const asc = chart.ascendant.sign, sign = (asc + h - 1) % 12, lord = SIGNS[sign].lord, lp = chart.planets[lord];
    const occ = GR.filter(n => chart.planets[n].house === h);
    const asp = GR.filter(n => chart.planets[n].house !== h && (chart.planets[n].aspectsHouses || []).indexOf(h) >= 0);
    const sav = chart.ashtakavarga && chart.ashtakavarga.sav ? chart.ashtakavarga.sav[sign] : null;
    return { h, sign, signName: SIGNS[sign].name, lord, lordHouse: lp.house, lordSign: SIGNS[lp.sign].name, lordDignity: (lp.dignity && lp.dignity.status) || 'Neutral', occ, asp, sav };
  }
  function signal(f) {
    const parts = [];
    let v = KEND.indexOf(f.lordHouse) >= 0 ? 1 : (DUS.indexOf(f.lordHouse) >= 0 && DUS.indexOf(f.h) < 0 ? -1 : 0);
    parts.push({ k: 'Lord placed', v, why: `${f.lord} in house ${f.lordHouse}` + (v > 0 ? ' (kendra or trikona)' : v < 0 ? ' (a 6/8/12 house)' : '') });
    v = STRONG.indexOf(f.lordDignity) >= 0 ? 1 : f.lordDignity === 'Debilitated' ? -1 : 0;
    parts.push({ k: 'Lord strength', v, why: `${f.lord} is ${f.lordDignity === 'OwnSign' ? 'in its own sign' : f.lordDignity.toLowerCase()}` });
    let o = 0; f.occ.forEach(n => { if (BEN.indexOf(n) >= 0) o++; else if (MAL.indexOf(n) >= 0 && UPA.indexOf(f.h) < 0) o--; });
    o = Math.max(-2, Math.min(2, o));
    parts.push({ k: 'Planets inside', v: o, why: f.occ.length ? f.occ.join(', ') : 'none' });
    let a = 0; f.asp.forEach(n => { if (n === 'Jupiter' || n === 'Venus') a++; else if (['Mars', 'Saturn', 'Rahu', 'Ketu'].indexOf(n) >= 0) a--; });
    a = Math.max(-1, Math.min(1, a));
    parts.push({ k: 'Looked at by', v: a, why: f.asp.length ? f.asp.join(', ') : 'none' });
    v = f.sav == null ? 0 : f.sav >= 30 ? 1 : f.sav <= 25 ? -1 : 0;
    parts.push({ k: 'Ashtakavarga', v, why: f.sav == null ? 'not available' : `${f.sav} points in ${f.signName} (average is 28)` });
    const score = parts.reduce((s, p) => s + p.v, 0);
    const label = score >= 3 ? 'Well supported' : score >= 1 ? 'Leaning supportive' : score === 0 ? 'Balanced or mixed' : score >= -2 ? 'Leaning strained' : 'Needs care';
    const tone = score >= 3 ? 'g2' : score >= 1 ? 'g1' : score === 0 ? 'm' : score >= -2 ? 'r1' : 'r2';
    return { score, parts, label, tone };
  }
  function relation(h, d, ps, qs) {
    if (h === d) return { k: 'same', t: 'The 1st from the 1st is the Lagna itself, so there is no second layer. Use the 7th as its mirror.' };
    if (ps >= 1 && qs >= 1) return { k: 'reinforced', t: 'Both layers lean the same supportive way. The tendency looks steady.' };
    if (ps >= 1 && qs <= -1) return { k: 'effort', t: 'The main house is supported, the second layer is strained. The matter tends to hold, with effort or patience in the deeper layer.' };
    if (ps <= -1 && qs >= 1) return { k: 'help', t: 'The main house is strained, the second layer is supportive. The second layer can soften or open another route.' };
    if (ps <= -1 && qs <= -1) return { k: 'care', t: 'Both layers are under pressure. Go slowly and weigh the timing and the natural significator.' };
    return { k: 'mixed', t: 'The signals are mixed. Read the details of each layer and the timing before leaning either way.' };
  }
  function currentPeriod(chart, now) {
    now = now == null ? Date.now() : now;
    const md = (chart.dashaData.mahadashas || []).find(m => +new Date(m.startDate) <= now && now < +new Date(m.endDate));
    if (!md) return null;
    let ad = null; try { ad = calculateAntardashas(md).find(a => +new Date(a.startDate) <= now && now < +new Date(a.endDate)); } catch (e) { ad = null; }
    return { md: md.lord, mdEnd: md.endDate, ad: ad ? ad.lord : null, adEnd: ad ? ad.endDate : null };
  }
  function timing(pf, qf, per) {
    const roles = {}, add = (p, r) => { (roles[p] = roles[p] || []).push(r); };
    const one = (f, nm) => { add(f.lord, `lord of the ${ORD(f.h)} (${nm})`); f.occ.forEach(p => add(p, `inside the ${ORD(f.h)} (${nm})`)); };
    one(pf, 'main house'); if (qf.h !== pf.h) one(qf, 'second house');
    const active = [];
    if (per) { if (roles[per.md]) active.push({ planet: per.md, level: 'Mahadasha', roles: roles[per.md] }); if (per.ad && roles[per.ad]) active.push({ planet: per.ad, level: 'Antardasha', roles: roles[per.ad] }); }
    return { roles, active };
  }
  function compute(chart, now) {
    const per = currentPeriod(chart, now), rows = [];
    for (let h = 1; h <= 12; h++) {
      const d = derived(h), pf = facts(chart, h), qf = facts(chart, d), ps = signal(pf), qs = signal(qf);
      const kar = KARAKA_OWN[h] && pf.occ.indexOf(KARAKA_OWN[h]) >= 0 ? KARAKA_OWN[h] : null;
      rows.push({ house: h, derived: d, pf, qf, ps, qs, rel: relation(h, d, ps.score, qs.score), tm: timing(pf, qf, per), karaka: kar });
    }
    const real = rows.filter(r => r.house !== r.derived).slice().sort((a, b) => (b.ps.score + b.qs.score) - (a.ps.score + a.qs.score));
    return { rows, per, best: real.slice(0, 3), care: real.slice(-3).reverse() };
  }
  /* any house counted from any house */
  function cell(chart, x, y) {
    const h = ref(x, y), f = facts(chart, h), key = x + '-' + y;
    const note = x === y ? (D.PAIRS[x - 1] || {}).a : D.EX[key];
    return { x, y, h, f, phrase: `${D.LENS[x - 1]} of ${D.SUBJ[y - 1]}`, note: note || null, noted: !!note, work: `(${y} - 1) + (${x} - 1) = ${y + x - 2}; ${y + x - 2} mod 12 + 1 = ${h}` };
  }
  function hats(chart, h) { const o = []; for (let y = 1; y <= 12; y++) o.push(cell(chart, inv(h, y), y)); return o; }

  /* ---------- HTML ---------- */
  const tag = (t, s) => `<span class="bmc-tag t${t}" title="${t === 'S' ? 'Stated by the published sources' : t === 'M' ? 'Worked out from the counting rule' : 'Common practice and teaching aid'}">${t === 'S' ? 'Sources' : t === 'M' ? 'Worked out' : 'Common practice'}${s && s.length ? ' · ' + s.join(', ') : ''}</span>`;
  const chip = s => `<span class="bmc-chip ${s.tone}">${esc(s.label)} <i>${sgn(s.score)}</i></span>`;
  const gauge = sc => { const w = Math.abs(sc) / 6 * 50; return `<span class="bmc-gauge" role="img" aria-label="Support score ${sgn(sc)} on a scale from minus 6 to plus 6"><i class="${sc > 0 ? 'p' : sc < 0 ? 'n' : 'z'}" style="left:${sc >= 0 ? 50 : 50 - w}%;width:${w}%"></i></span>`; };
  const facts_html = f => `<div class="bmc-f"><b>${esc(f.signName)}</b> · lord ${esc(f.lord)} in house ${f.lordHouse} (${esc(f.lordSign)})<br><span>Inside: ${esc(pl(f.occ))}</span><br><span>Looked at by: ${esc(pl(f.asp))}</span></div>`;
  const parts_html = s => `<ul class="bmc-parts">${s.parts.map(p => `<li class="${p.v > 0 ? 'p' : p.v < 0 ? 'n' : 'z'}"><i>${sgn(p.v)}</i><span><b>${esc(p.k)}</b> ${esc(p.why)}</span></li>`).join('')}</ul>`;
  /* the pair map: every house points to its second house. rows = compute() rows to colour the houses by Support score, or null for a plain teaching wheel */
  function wheelSvg(rows, uid) {
    const cx = 160, cy = 160, R = 116, nr = 17, P = h => { const a = (-90 + (h - 1) * 30) * Math.PI / 180; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; }, f1 = v => v.toFixed(1);
    let arcs = '';
    for (let h = 1; h <= 12; h++) {
      const d = derived(h); if (d === h) continue;
      const a = P(h), b = P(d), L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
      const sx = a[0] + ux * (nr + 2), sy = a[1] + uy * (nr + 2), ex = b[0] - ux * (nr + 6), ey = b[1] - uy * (nr + 6);
      const qx = cx + ((sx + ex) / 2 - cx) * 0.3, qy = cy + ((sy + ey) / 2 - cy) * 0.3;
      arcs += `<path class="bmc-wa" d="M${f1(sx)} ${f1(sy)}Q${f1(qx)} ${f1(qy)} ${f1(ex)} ${f1(ey)}" marker-end="url(#bmcAr${uid})"/>`;
    }
    const p1 = P(1); arcs += `<circle class="bmc-wself" cx="${f1(p1[0])}" cy="${f1(p1[1])}" r="${nr + 5}"/>`;
    let nodes = '';
    for (let h = 1; h <= 12; h++) {
      const p = P(h), t = rows ? rows[h - 1].ps.tone : 'm', btn = rows ? ` tabindex="0" role="button" aria-label="Open the ${ORD(h)} house row" onclick="BMC.go(${h})" onkeydown="if(event.key==='Enter')BMC.go(${h})"` : '';
      nodes += `<g class="bmc-wn ${t}${h % 2 ? ' d' : ''}"${btn} transform="translate(${f1(p[0])} ${f1(p[1])})"><circle r="${nr}"/><text y="5" text-anchor="middle">${h}</text></g>`;
    }
    return `<svg class="bmc-wheel" viewBox="0 0 320 320" role="img" aria-label="Map of the twelve houses, each with an arrow to its second house"><defs><marker id="bmcAr${uid}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#e6b94f"/></marker></defs><circle class="bmc-wring" cx="160" cy="160" r="${R + nr + 8}"/><circle class="bmc-wring in" cx="160" cy="160" r="${R - nr - 12}"/>${arcs}${nodes}<text class="bmc-wc1" x="160" y="152" text-anchor="middle">Bhavat</text><text class="bmc-wc1" x="160" y="172" text-anchor="middle">Bhavam</text><text class="bmc-wc2" x="160" y="190" text-anchor="middle">N → 2N − 1</text></svg>`;
  }
  function houseCard(r) {
    const same = r.house === r.derived, pair = D.PAIRS[r.house - 1];
    return `<details class="bmc-h ${r.rel.k}" id="bmcRow${r.house}"><summary><span class="bmc-n">${r.house}</span><span class="bmc-ar">${same ? '=' : '→'}</span><span class="bmc-n d">${r.derived}</span><span class="bmc-st"><b>${ORD(r.house)} from the ${ORD(r.house)} is the ${ORD(r.derived)}</b><small>${esc(D.SHORT[r.house - 1])} read through ${esc(D.SHORT[r.derived - 1])}</small></span><span class="bmc-dots" aria-hidden="true"><i class="${r.ps.tone}"></i><i class="${r.qs.tone}"></i></span>${r.tm.active.length ? '<span class="bmc-live" title="A running dasha touches this pair">now</span>' : ''}</summary>
      <div class="bmc-body">
        <div class="bmc-formula"><b>The count</b> 2 × ${r.house} − 1 = ${2 * r.house - 1}${2 * r.house - 1 > 12 ? `, minus 12 = ${r.derived}` : ''}. The ${ORD(r.derived)} house is your Lagna sign plus ${r.derived - 1} sign${r.derived - 1 === 1 ? '' : 's'}.</div>
        <div class="bmc-layer"><div class="bmc-lh"><h5><span class="bmc-lk">Main</span> ${ORD(r.house)} house</h5>${chip(r.ps)}</div>${gauge(r.ps.score)}${facts_html(r.pf)}${parts_html(r.ps)}</div>
        ${same ? '' : `<div class="bmc-layer two"><div class="bmc-lh"><h5><span class="bmc-lk">Second</span> ${ORD(r.derived)} house</h5>${chip(r.qs)}</div>${gauge(r.qs.score)}${facts_html(r.qf)}${parts_html(r.qs)}</div>`}
        <div class="bmc-rel ${r.rel.k}"><b>🔗 How they sit together</b>${esc(r.rel.t)}</div>
        <div class="bmc-tm"><b>⏳ Timing</b>${r.tm.active.length ? r.tm.active.map(a => `<span class="bmc-ta">${G(a.planet)} ${esc(a.planet)} · ${a.level}</span> is ${esc(a.roles.join(' and '))}.`).join(' ') : `The running periods${perTxt ? ' (' + esc(perTxt) + ')' : ''} do not directly involve these two houses. Look ahead for their lords in the Dasha tool.`}</div>
        ${r.karaka ? `<div class="bmc-kar"><b>🔎 Natural significator note</b>${esc(r.karaka)} sits in its own house here. One source says this can thin out that house\'s results. Look closer; it is not a verdict.</div>` : ''}
        <div class="bmc-pair"><b>📖 What the pair means</b>${esc(pair.a)} ${esc(pair.b)}</div>
      </div></details>`;
  }
  /* 12-segment balance ring: one arc per house, coloured by its Support score */
  function ringSvg(rows) {
    const c = 60, r = 46, f = v => v.toFixed(2), pt = a => [c + r * Math.cos(a * Math.PI / 180), c + r * Math.sin(a * Math.PI / 180)];
    let arcs = '';
    rows.forEach((x, i) => { const a0 = -90 + i * 30 + 3, a1 = -90 + (i + 1) * 30 - 3, p0 = pt(a0), p1 = pt(a1); arcs += `<path class="bmc-rg ${x.ps.tone}" d="M${f(p0[0])} ${f(p0[1])}A${r} ${r} 0 0 1 ${f(p1[0])} ${f(p1[1])}"/>`; });
    const good = rows.filter(x => x.ps.score >= 1).length;
    return `<svg class="bmc-ring" viewBox="0 0 120 120" role="img" aria-label="${good} of 12 houses lean supportive">${arcs}<text class="bmc-rn" x="60" y="62" text-anchor="middle">${good}<tspan class="bmc-rd">/12</tspan></text><text class="bmc-rl" x="60" y="78" text-anchor="middle">supportive</text></svg>`;
  }
  const RELIC = { reinforced: ['✦', 'Steady'], care: ['◈', 'Care'], effort: ['↗', 'Effort'], help: ['↙', 'Helped'], mixed: ['≈', 'Mixed'], same: ['＝', 'Self'] };
  const bar = s => `<span class="bmc-mini" title="${esc(s.label)} ${sgn(s.score)}"><i class="${s.tone}" style="width:${Math.max(6, Math.round((s.score + 6) / 12 * 100))}%"></i></span>`;
  function paneChart(C) {
    perTxt = C.per ? `${C.per.md}${C.per.ad ? '/' + C.per.ad : ''}` : '';
    const rows = C.rows, lagna = rows[0].pf.signName, good = rows.filter(x => x.ps.score >= 1).length, mid = rows.filter(x => x.ps.score === 0).length, low = rows.filter(x => x.ps.score <= -1).length, live = rows.filter(x => x.tm.active.length).length;
    const li = r => `<li><span class="bmc-n sm">${r.house}</span><span class="bmc-ar">→</span><span class="bmc-n sm d">${r.derived}</span><span>${esc(D.SHORT[r.house - 1])} <small>through ${esc(D.SHORT[r.derived - 1])}</small></span></li>`;
    const snaps = rows.map(r => { const ic = RELIC[r.rel.k]; return `<button type="button" class="bmc-snap ${r.rel.k}" onclick="BMC.go(${r.house})" aria-label="Open pair ${r.house} to ${r.derived}. Main ${esc(r.ps.label)}, second ${esc(r.qs.label)}"><span class="bmc-n sm">${r.house}</span><span class="bmc-ar">→</span><span class="bmc-n sm d">${r.derived}</span><span class="bmc-sn"><b>${esc(D.SHORT[r.house - 1])}${r.house === r.derived ? '' : ' <em>via</em> ' + esc(D.SHORT[r.derived - 1])}</b><small>${esc(r.pf.signName)}${r.house === r.derived ? '' : ' · ' + esc(r.qf.signName)}</small></span><span class="bmc-bars">${bar(r.ps)}${r.house === r.derived ? '' : bar(r.qs)}</span><span class="bmc-ri" title="${ic[1]}">${ic[0]}</span>${r.tm.active.length ? '<span class="bmc-live sm" title="A running dasha touches this pair">now</span>' : ''}</button>`; }).join('');
    return `<div class="bmc-banner top"><span class="bmc-orn" aria-hidden="true">🪞</span><div class="bmc-hrow"><div class="bmc-hl"><h3>Your twelve pairs</h3><p>Every house is read twice: itself, then the house counted the same number of places from it.</p></div>${ringSvg(rows)}</div>
      <div class="bmc-stats"><div class="bmc-sg"><b>${good}</b><small>Supportive</small></div><div><b>${mid}</b><small>Mixed</small></div><div class="bmc-sr"><b>${low}</b><small>Strained</small></div><div class="bmc-sa"><b>${live}</b><small>Live now</small></div></div>
      <div class="bmc-now"><span>Lagna</span><b>${esc(lagna)}</b>${C.per ? `<span class="gap">Running now</span><b>${G(C.per.md)} ${esc(C.per.md)} <em>Mahadasha</em></b>${C.per.ad ? `<b>${G(C.per.ad)} ${esc(C.per.ad)} <em>Antardasha</em></b>` : ''}` : ''}</div></div>
      <div class="bmc-card"><h4>All twelve at a glance</h4><p class="bmc-cap">One line per pair. Top bar is the main house, lower bar its second house. Tap a line to open the full reading.</p><div class="bmc-snaps">${snaps}</div>
        <div class="bmc-legend"><span><i class="g2"></i>Well supported</span><span><i class="g1"></i>Supportive</span><span><i class="m"></i>Mixed</span><span><i class="r1"></i>Strained</span><span><i class="r2"></i>Needs care</span></div>
        <div class="bmc-legend key"><span>✦ Steady</span><span>↗ Effort</span><span>↙ Helped</span><span>◈ Care</span><span>≈ Mixed</span></div></div>
      <div class="bmc-sum"><div class="bmc-good"><h5>✦ Best supported</h5><ol>${C.best.map(li).join('')}</ol></div><div class="bmc-warn"><h5>◈ Most care needed</h5><ol>${C.care.map(li).join('')}</ol></div></div>
      <div class="bmc-card"><h4>The pair map</h4><p class="bmc-cap">Tap a house to jump to its reading. Colour is its Support score; gold rings mark the houses that act as second houses.</p>${wheelSvg(rows, 'a')}</div>
      <h4 class="bmc-sec">Read each pair</h4><div class="bmc-list">${rows.map(houseCard).join('')}</div>
      <p class="bmc-fine">Scores add a few visible signals so you can see why a house looks easy or hard. They are a teaching aid, not a verdict. ${tag('C')}</p>`;
  }
  const sel = (id, from, to, cur, fn, lab) => `<label class="bmc-sel"><span>${lab}</span><select id="${id}" onchange="BMC.${fn}()">${Array.from({ length: to - from + 1 }, (_, i) => from + i).map(n => `<option value="${n}"${n === cur ? ' selected' : ''}>${ORD(n)} house</option>`).join('')}</select></label>`;
  function cellHtml(c) {
    return `<div class="bmc-cell"><div class="bmc-big">${ORD(c.x)} from the ${ORD(c.y)} is the <em>${ORD(c.h)} house</em></div>
      <div class="bmc-f"><b>${esc(c.f.signName)}</b> · lord ${esc(c.f.lord)} in house ${c.f.lordHouse}<br><span>Inside: ${esc(pl(c.f.occ))}</span></div>
      <p class="bmc-ph">Reads: ${esc(c.phrase)}. ${tag('C')}</p>
      ${c.note ? `<p class="bmc-nt"><b>From the sources:</b> ${esc(c.note)}</p>` : ''}
      <p class="bmc-wk">Working: ${esc(c.work)}</p></div>`;
  }
  function hatsHtml(list) {
    return `<ol class="bmc-hats">${list.map(c => `<li><span class="bmc-hn">${c.y}</span><span><b>${ORD(c.x)} from the ${ORD(c.y)}</b> <small>${esc(c.f.signName)}</small><br>${esc(c.note ? c.note : c.phrase)}${c.note ? ' ' + tag('S', c.x === c.y ? D.PAIRS[c.x - 1].src : ['VJ']) : ''}</span></li>`).join('')}</ol>`;
  }
  function matrixGrid(y, x) {
    let g = '<div class="bmc-mx" aria-label="The house you land on, for every starting house and every count"><span class="bmc-mc"></span>';
    for (let xx = 1; xx <= 12; xx++) g += `<span class="bmc-mh">${xx}</span>`;
    for (let yy = 1; yy <= 12; yy++) { g += `<span class="bmc-mh">${yy}</span>`; for (let xx = 1; xx <= 12; xx++) g += `<button type="button" class="bmc-mb${xx === yy ? ' same' : ''}${xx === x && yy === y ? ' on' : ''}" data-y="${yy}" data-x="${xx}" onclick="BMC.pickCell(${yy},${xx})" aria-label="${ORD(xx)} from the ${ORD(yy)}">${ref(xx, yy)}</button>`; }
    return g + '</div>';
  }
  function paneExplorer(chart) {
    return `<div class="bmc-banner sm"><span class="bmc-orn" aria-hidden="true">🧭</span><h3>Any house from any house</h3><p>Pick a starting house, then which house to count from it. The starting house is treated like a Lagna of its own.</p></div>
      <div class="bmc-ctl">${sel('bmcY', 1, 12, 7, 'upMatrix', 'Count from')}${sel('bmcX', 1, 12, 8, 'upMatrix', 'Count to')}</div>
      <div id="bmcCell">${cellHtml(cell(chart, 8, 7))}</div>
      <div class="bmc-card"><h4>The full map</h4><p class="bmc-cap">Rows are the starting house, columns are the count. The number is the house you land on. Tap any square. The gold diagonal is the same-number rule.</p>${matrixGrid(7, 8)}</div>
      <h4 class="bmc-sec">Every house wears twelve hats</h4><p class="bmc-cap">One house seen from all twelve starting points.</p>
      <div class="bmc-ctl">${sel('bmcH', 1, 12, 2, 'upHats', 'Which house')}</div>
      <div id="bmcHats">${hatsHtml(hats(chart, 2))}</div>`;
  }
  function paneRecipes(chart, C) {
    return `<div class="bmc-banner sm"><span class="bmc-orn" aria-hidden="true">🧩</span><h3>Reading recipes</h3><p>Pick a question. Each recipe says which house to read first, which second, and what else to count, with your own signs and planets.</p></div>
      <div class="bmc-list">${D.TOPICS.map(t => {
        const r = C.rows[t.h - 1], ex = t.extra.map(e => { const c = cell(chart, e.x, e.y); return `<li><b>${ORD(e.x)} from the ${ORD(e.y)}</b> = house ${c.h} (${esc(c.f.signName)}, inside: ${esc(pl(c.f.occ))})<br><small>${esc(D.EX[e.x + '-' + e.y] || c.phrase)} ${tag(e.s === 'M' ? 'M' : 'S', e.s === 'M' ? [] : [e.s])}</small></li>`; }).join('');
        return `<details class="bmc-h ${r.rel.k}"><summary><span class="bmc-ic" aria-hidden="true">${t.ic}</span><span class="bmc-st"><b>${esc(t.t)}</b><small>House ${t.h} → ${r.derived}</small></span><span class="bmc-dots" aria-hidden="true"><i class="${r.ps.tone}"></i><i class="${r.qs.tone}"></i></span></summary><div class="bmc-body"><p>${esc(t.note)}</p><div class="bmc-lh">${chip(r.ps)}${r.house !== r.derived ? chip(r.qs) : ''}</div><div class="bmc-rel ${r.rel.k}"><b>🔗 Your chart</b>${esc(r.rel.t)}</div><h5>Also count</h5><ul class="bmc-ex">${ex}</ul></div></details>`;
      }).join('')}</div>`;
  }
  const srcLinks = a => a.map(k => `<a href="${D.SRC[k].u}" target="_blank" rel="noopener">${esc(D.SRC[k].n)}</a>`).join(' · ');
  function paneLearn() {
    const ch = (n, ic, t, body, open) => `<details class="bmc-h bmc-ch"${open ? ' open' : ''}><summary><span class="bmc-ic" aria-hidden="true">${ic}</span><span class="bmc-st"><b>${n}. ${t}</b></span></summary><div class="bmc-body">${body}</div></details>`;
    const fc = (lab, f) => `<div class="bmc-fc"><small>${lab}</small><code>${f}</code></div>`;
    return `<div class="bmc-banner sm"><span class="bmc-orn" aria-hidden="true">🎓</span><h3>The masterclass</h3><p>Seven short chapters: what it is, the formula, the twelve pairs, the rules, where teachers differ, a step-by-step recipe, and common mistakes.</p></div><div class="bmc-list">
      ${ch(1, '🪞', 'What Bhavat Bhavam means', `<p><b>Bhavat Bhavam</b> means "from house to house". It has two uses.</p><div class="bmc-two"><div><b>1 · Same-number pair</b><span>Count the Nth house from the Nth house. The 7th from the 7th is the 1st.</span></div><div><b>2 · Any house from any house</b><span>Treat any house as a Lagna. The 2nd from the 7th is the 8th, the partner's money.</span></div></div><p>Both give a house a second layer of meaning beyond the first reading. ${tag('S', ['PB', 'AS', 'BP', 'VJ'])}</p>`, true)}
      ${ch(2, '🧮', 'The formula', `<p>Count the starting house as 1.</p>${fc('House X counted from house Y', '((Y − 1) + (X − 1)) mod 12 + 1')}${fc('Same-number pair (X = Y = N)', '(2N − 2) mod 12 + 1<br>= 2N − 1, minus 12 if above 12')}${fc('Sign of a house', '(Lagna sign + house − 1) mod 12')}<p>Worked: the 8th from the 8th is (7 + 7) mod 12 + 1 = 3. The 5th from the 5th is (4 + 4) + 1 = 9. ${tag('M')}</p>`)}
      ${ch(3, '🕸️', 'The twelve pairs', `${wheelSvg(null, 'b')}<div class="bmc-pairs">${D.PAIRS.map(p => `<div class="bmc-pr"><div class="bmc-prh"><span class="bmc-n">${p.n}</span><span class="bmc-ar">→</span><span class="bmc-n d">${p.d}</span><b>${esc(p.a)}</b></div><small>${esc(p.b)}</small>${tag('S', p.src)}</div>`).join('')}</div><p>Houses 6 apart share a second house: 1 and 7 give the 1st, 2 and 8 give the 3rd, 3 and 9 give the 5th, 4 and 10 give the 7th, 5 and 11 give the 9th, 6 and 12 give the 11th. ${tag('M')}</p>`)}
      ${ch(4, '📜', 'The rules', D.RULES.map(r => `<div class="bmc-rule"><b>${esc(r.t)}</b>${tag(r.tag, r.src)}<span>${esc(r.b)}</span></div>`).join(''))}
      ${ch(5, '⚖️', 'Where teachers differ', D.DIFFS.map(r => `<div class="bmc-rule"><b>${esc(r.t)}</b><span>${esc(r.b)}</span></div>`).join(''))}
      ${ch(6, '🗺️', 'The reading recipe', `<ol class="bmc-steps">${D.STEPS.map(s => `<li>${esc(s)}</li>`).join('')}</ol><div class="bmc-rule"><b>How the Support score is built</b>${tag('C')}<span>Lord in a kendra or trikona +1. Lord strong +1 or weak −1. Each benefic inside +1, each malefic −1 (not counted in the 3rd, 6th, 10th, 11th). Jupiter or Venus looking at it +1, a malefic −1. Ashtakavarga 30 or more +1, 25 or less −1. Range −6 to +6.</span></div>`)}
      ${ch(7, '🚧', 'Common mistakes', `<ul class="bmc-steps">${D.MISTAKES.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`)}
    </div><p class="bmc-fine">Sources read: ${srcLinks(Object.keys(D.SRC))}. A classical verse for the same-number rule was not verified. These are tendencies, to be read with the whole chart.</p>`;
  }
  function html(chart) {
    lastChart = chart; const C = compute(chart);
    return `<div class="bmc"><div class="bmc-tabs" role="tablist">${[['chart', '🪞', 'My chart'], ['explore', '🧭', 'Explorer'], ['recipes', '🧩', 'Recipes'], ['learn', '🎓', 'Learn']].map((t, i) => `<button type="button" role="tab" data-bmc-tab="${t[0]}" class="${i ? '' : 'on'}" onclick="BMC.tab(this)"><span aria-hidden="true">${t[1]}</span>${t[2]}</button>`).join('')}</div>
      <section data-bmc-pane="chart">${paneChart(C)}</section>
      <section data-bmc-pane="explore" hidden>${paneExplorer(chart)}</section>
      <section data-bmc-pane="recipes" hidden>${paneRecipes(chart, C)}</section>
      <section data-bmc-pane="learn" hidden>${paneLearn()}</section></div>`;
  }
  function text(chart, now) {
    const C = compute(chart, now);
    return C.rows.map(r => `${ORD(r.house)} from ${ORD(r.house)} = ${ORD(r.derived)}: ${r.pf.signName}/${r.qf.signName}; main ${r.ps.label} (${sgn(r.ps.score)}), second ${r.qs.label} (${sgn(r.qs.score)}). ${r.rel.t}`).join('\n');
  }
  const api = {
    compute, cell, hats, facts, signal, relation, currentPeriod, derived, ref, inv, html, text, GR,
    tab(b) { const root = b.closest('.bmc'); if (!root) return; root.querySelectorAll('[data-bmc-tab]').forEach(x => x.classList.toggle('on', x === b)); root.querySelectorAll('[data-bmc-pane]').forEach(p => { p.hidden = p.getAttribute('data-bmc-pane') !== b.getAttribute('data-bmc-tab'); }); },
    upMatrix() { const y = +document.getElementById('bmcY').value, x = +document.getElementById('bmcX').value, el = document.getElementById('bmcCell'); if (el && lastChart) el.innerHTML = cellHtml(cell(lastChart, x, y)); document.querySelectorAll('.bmc-mb').forEach(b => b.classList.toggle('on', +b.getAttribute('data-y') === y && +b.getAttribute('data-x') === x)); },
    pickCell(y, x) { const sy = document.getElementById('bmcY'), sx = document.getElementById('bmcX'); if (!sy || !sx) return; sy.value = y; sx.value = x; api.upMatrix(); },
    upHats() { const h = +document.getElementById('bmcH').value, el = document.getElementById('bmcHats'); if (el && lastChart) el.innerHTML = hatsHtml(hats(lastChart, h)); },
    go(h) { const row = document.getElementById('bmcRow' + h); if (!row) return; const t = row.closest('.bmc').querySelector('[data-bmc-tab=chart]'); if (t) api.tab(t); row.open = true; try { row.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { row.scrollIntoView(); } }
  };
  window.buildBhavatMasterclassPanel = function (chart) { return html(chart); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-bhavatclass', window.buildBhavatMasterclassPanel);
  window.BMC = api;
  return api;
})();

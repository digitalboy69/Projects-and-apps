/* ============================================================================
   ASTRO ATLAS (Home > Analysis, left quick menu): the basics of Vedic astrology as one beautiful reference.
   Tabs: Week (day lords, hora) · Planets · Signs · Body (Kala Purusha) · Houses · Stars (27 nakshatras) · Time (tithi, yoga, karana, dasha) · Rules (friends, dignity, aspects, directions) · Charts (vargas).
   Data lives in js/130-astro-atlas-data.js (global ATLAS). Panel registered as 'panel-atlas' -> window.buildAtlasPanel. Pure reference: needs no chart.
   ============================================================================ */
const ATL = (function(){
  const A = ATLAS, esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const S = { tab:'week', day:new Date().getDay(), planet:'Sun', sign:0, house:1, nak:0, body:0 };
  const TABS = [['week','☉','Week','Day lords and horas'],['planets','♃','Planets','Nine planets'],['signs','♈\uFE0E','Signs','12 rashis'],['body','☤','Body','Kala Purusha'],['houses','⌂','Houses','12 bhavas'],['stars','✶','Stars','27 nakshatras'],['time','◷','Time','Tithi, yoga, dasha'],['rules','⚖','Rules','Friends, dignity, aspects'],['charts','◫','Charts','Divisional charts']];
  const col = p => A.COL[p] || '#f2cf6b', gl = p => A.GL[p] || '', pill = (t, c) => `<i class="at-pill"${c ? ` style="--ac:${c}"` : ''}>${esc(t)}</i>`;
  const kv = (rows, cols) => `<dl class="at-kv${cols ? ' c' + cols : ''}">${rows.filter(r => r && r[1] !== '' && r[1] != null).map(r => `<div><dt>${esc(r[0])}</dt><dd>${r[2] ? r[1] : esc(r[1])}</dd></div>`).join('')}</dl>`;
  const sec = (h, sub, body, cls) => `<section class="at-sec${cls ? ' ' + cls : ''}"><h4>${h}${sub ? `<small>${sub}</small>` : ''}</h4>${body}</section>`;
  const ordn = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1:'st', 2:'nd', 3:'rd' }[n % 10] || 'th'));

  /* ---------- WEEK ---------- */
  function wheelSvg(){
    const R = 108, cx = 150, cy = 150, pos = {};
    A.CHALDEAN.forEach((p, i) => { const a = (-90 + i * 360 / 7) * Math.PI / 180; pos[p] = [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
    const order = A.DAYS.map(d => d.lord), path = order.concat(order[0]).map((p, i) => (i ? 'L' : 'M') + pos[p][0].toFixed(1) + ' ' + pos[p][1].toFixed(1)).join(' ');
    const nodes = A.DAYS.map((d, i) => { const [x, y] = pos[d.lord];
      return `<g class="at-wn${S.day === i ? ' on' : ''}" data-day="${i}" style="--ac:${col(d.lord)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="25"/><text class="g" y="7">${gl(d.lord)}</text><text class="d" y="42">${d.en.slice(0, 3)}</text></g>`; }).join('');
    return `<svg class="at-wheel" viewBox="0 0 300 300" role="img" aria-label="Weekday wheel"><circle cx="150" cy="150" r="108" class="ring"/><circle cx="150" cy="150" r="80" class="ring2"/><path d="${path}" class="star" pathLength="1"/>${nodes}<text x="150" y="146" class="mid" id="atWm1"></text><text x="150" y="168" class="mid2" id="atWm2"></text></svg>`;
  }
  function dayHtml(){
    const d = A.DAYS[S.day], p = A.P[d.lord], i0 = A.CHALDEAN.indexOf(d.lord), today = new Date().getDay() === S.day;
    const horas = Array.from({ length:24 }, (_, k) => { const l = A.CHALDEAN[(i0 + k) % 7], h = (6 + k) % 24, e = (h + 1) % 24;
      return `<div class="at-hora" style="--ac:${col(l)}"><b>${gl(l)}</b><span>${l}</span><em>${String(h).padStart(2, '0')}:00 to ${String(e).padStart(2, '0')}:00</em></div>`; }).join('');
    return `<div class="at-card" style="--ac:${col(d.lord)}"><div class="at-hd"><span class="at-big">${gl(d.lord)}</span><div><h3>${d.en}${today ? ' <em class="at-today">today</em>' : ''}</h3><p>${d.sa} · ruled by ${d.lord}</p></div></div>
      ${kv([['Deity', d.deity], ['Favoured for', d.good], ['Take care with', d.avoid], ['Rahu Kala', A.RAHU_KALA[S.day]], ['Colour', p.color], ['Gem and metal', p.gem + ', ' + p.metal]])}</div>
      ${sec('Horas of ' + d.en, 'the first hora belongs to the day lord at sunrise; the lords then follow the slow-to-fast order', `<div class="at-horas">${horas}</div><p class="at-note">Hours are counted from sunrise, shown here as 06:00. Real hora length changes with the sunrise and sunset of your place.</p>`)}`;
  }
  function weekHtml(){
    return `<div class="at-hero2">${wheelSvg()}<p class="at-note c">Planets stand in their order of speed, slowest first. Join each day to the next and a seven-pointed star appears: every day lord sits three places after the last.</p></div><div id="atDay">${dayHtml()}</div>`;
  }

  /* ---------- PLANETS ---------- */
  function planetHtml(){
    const p = A.P[S.planet], c = col(S.planet), dayIx = A.DAYS.findIndex(d => d.lord === S.planet);
    const sg = n => { const i = A.SIGNS.findIndex(s => s.name === n); return i < 0 ? n : A.SIGNS[i].glyph + ' ' + n; };
    const dg = a => a[1] ? `${sg(a[0])} at ${a[1]}°` : a[0];
    return `<div class="at-card" style="--ac:${c}"><div class="at-hd"><span class="at-big">${gl(S.planet)}</span><div><h3>${S.planet}</h3><p>${p.sa} · ${p.nature}</p></div></div>
      ${kv([['Day', dayIx >= 0 ? A.DAYS[dayIx].en : 'No weekday (has its own Kala each day)'], ['Direction', p.dir], ['Element', p.tattva], ['Guna', p.guna], ['Dosha', p.dosha], ['Gender', p.gender], ['Colour', p.color], ['Gem', p.gem], ['Metal', p.metal], ['Taste', p.taste], ['Season', p.season], ['Deity', p.deity], ['Mantra', p.mantra], ['Dasha years', p.years + ' of 120'], ['Speed', p.speed], ['In a sign', p.period]], 2)}</div>
      ${sec('Signifies', '', kv([['Karaka', p.karaka], ['Body', p.body]]))}
      ${sec('Dignity', '', `<div class="at-dig">${[['Exalted', dg(p.exalt), '#58c98a'], ['Own sign', p.own.map(sg).join(', '), '#f2cf6b'], ['Moolatrikona', p.mt[1] ? sg(p.mt[0]) + ' ' + p.mt[1] + '°' : p.mt[0], '#7f93c9'], ['Debilitated', dg(p.debil), '#e5584b']].map(x => `<div style="--ac:${x[2]}"><small>${x[0]}</small><b>${x[1]}</b></div>`).join('')}</div>`)}`;
  }
  function planetsHtml(){
    return `<div class="at-grid g3" id="atPick">${A.PL.map(p => `<button type="button" class="at-tile${S.planet === p ? ' on' : ''}" data-planet="${p}" style="--ac:${col(p)}"><b>${gl(p)}</b><span>${p}</span></button>`).join('')}</div><div id="atPlanet">${planetHtml()}</div>`;
  }

  /* ---------- SIGNS ---------- */
  function signHtml(){
    const s = A.SIGNS[S.sign], c = col(s.lord), ex = A.PL.filter(p => A.P[p].exalt[0] === s.name), de = A.PL.filter(p => A.P[p].debil[0] === s.name);
    return `<div class="at-card" style="--ac:${c}"><div class="at-hd"><span class="at-big">${s.glyph}</span><div><h3>${s.name}</h3><p>${s.sa} · the ${s.symbol}</p></div></div><p class="at-lead">${s.trait}.</p>
      ${kv([['Lord', gl(s.lord) + ' ' + s.lord, 1], ['Element', s.element], ['Quality', s.quality], ['Gender', s.gender], ['Direction', s.dir], ['Body part', s.body], ['Rises', s.rise], ['Exalted here', ex.length ? ex.map(p => gl(p) + ' ' + p).join(', ') : 'None of the seven', 1], ['Debilitated here', de.length ? de.map(p => gl(p) + ' ' + p).join(', ') : 'None of the seven', 1]], 2)}</div>`;
  }
  function signsHtml(){
    const mat = `<table class="at-mat"><thead><tr><th></th>${A.SIGNS.slice(0, 3).map((_, i) => `<th>${['Movable', 'Fixed', 'Dual'][i]}</th>`).join('')}</tr></thead><tbody>${A.ELEM.map((e, r) => `<tr><th>${e}</th>${[0, 1, 2].map(q => { const i = r + 4 * q; return `<td><button type="button" data-sign="${i}" style="--ac:${col(A.SIGNS[i].lord)}">${A.SIGNS[i].glyph}<span>${A.SIGNS[i].name}</span></button></td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
    return `<div class="at-grid g4" id="atPick">${A.SIGNS.map(s => `<button type="button" class="at-tile sm${S.sign === s.i ? ' on' : ''}" data-sign="${s.i}" style="--ac:${col(s.lord)}"><b>${s.glyph}</b><span>${s.name}</span></button>`).join('')}</div><div id="atSign">${signHtml()}</div>
      ${sec('Elements and qualities', 'every sign is one element and one quality', mat)}`;
  }

  /* ---------- BODY (Kala Purusha) ---------- */
  const BY = [34, 72, 112, 148, 184, 222, 258, 296, 352, 420, 482, 540];
  function bodySvg(){
    const half = '<path d="M84 112 L64 120 L52 178 L44 248 L58 252 L72 182 L88 146Z"/><path d="M92 258 L119 264 L117 402 L110 534 L84 534 L94 410Z"/><ellipse cx="96" cy="541" rx="17" ry="8"/>';
    const marks = A.SIGNS.map((s, i) => `<g class="at-bm${S.body === i ? ' on' : ''}" data-body="${i}" style="--ac:${col(s.lord)}"><line x1="134" y1="${BY[i]}" x2="206" y2="${BY[i]}"/><circle cx="120" cy="${BY[i]}" r="14"/><text class="g" x="120" y="${BY[i] + 6}">${s.glyph}</text><text class="l" x="212" y="${BY[i] + 4}">${s.body.split(',')[0]}</text></g>`).join('');
    return `<svg class="at-body" viewBox="0 0 350 575" role="img" aria-label="Kala Purusha, the zodiac as a body"><defs><g id="atBd"><ellipse cx="120" cy="52" rx="26" ry="32"/><rect x="108" y="78" width="24" height="26"/><path d="M84 110 C96 100 144 100 156 110 C154 160 152 210 150 262 L90 262 C88 210 86 160 84 110Z"/>${half}<g transform="translate(240 0) scale(-1 1)">${half}</g></g></defs><use href="#atBd" class="o"/><use href="#atBd" class="f"/>${marks}</svg>`;
  }
  function bodyHtml(){
    const s = A.SIGNS[S.body];
    return `<div class="at-card" style="--ac:${col(s.lord)}"><div class="at-hd"><span class="at-big">${s.glyph}</span><div><h3>${s.name}: ${s.body}</h3><p>Ruled by ${gl(s.lord)} ${s.lord} · house ${s.i + 1} of the natural zodiac</p></div></div>
      <p class="at-lead">In the natural zodiac the first house is the head and each following house moves down the body. The sign sitting on a house shows which part of you that house speaks for.</p></div>`;
  }
  function bodyTab(){
    const pb = A.PL.map(p => `<div class="at-pb" style="--ac:${col(p)}"><b>${gl(p)}</b><span>${p}</span><em>${A.P[p].body}</em></div>`).join('');
    return `<div class="at-hero2">${bodySvg()}</div><div id="atBodyD">${bodyHtml()}</div>${sec('Planets and the body', 'what each planet traditionally rules', `<div class="at-pbs">${pb}</div>`)}<p class="at-note">Traditional symbolism for study. It is not a medical tool.</p>`;
  }

  /* ---------- HOUSES ---------- */
  function houseSvg(){
    const P = { A:[0,0], B:[300,0], C:[300,300], D:[0,300], T:[150,0], R:[300,150], M:[150,300], L:[0,150], O:[150,150], a:[75,75], b:[225,75], c:[225,225], d:[75,225] };
    const H = { 1:'a T b O', 2:'A T a', 3:'A L a', 4:'a L d O', 5:'D L d', 6:'D M d', 7:'d M c O', 8:'C M c', 9:'C R c', 10:'c R b O', 11:'B R b', 12:'B T b' };
    const cells = Object.keys(H).map(n => { const v = H[n].split(' ').map(k => P[k]), cx = v.reduce((s, q) => s + q[0], 0) / v.length, cy = v.reduce((s, q) => s + q[1], 0) / v.length, k = A.HOUSE_KINDS;
      const big = v.length === 4, kinds = [[1,4,7,10].includes(+n) ? 'K' : '', [1,5,9].includes(+n) ? 'T' : '', [6,8,12].includes(+n) ? 'D' : ''].join('');
      return `<g class="at-hc${S.house === +n ? ' on' : ''}" data-house="${n}"><polygon points="${v.map(q => q.join(',')).join(' ')}"/><text class="n" x="${cx}" y="${cy + 7}">${n}</text>${kinds ? `<text class="k" x="${cx}" y="${cy + 24}">${kinds}</text>` : ''}</g>`; }).join('');
    return `<svg class="at-hchart" viewBox="-4 -4 308 308" role="img" aria-label="North Indian chart with 12 houses"><rect x="0" y="0" width="300" height="300" class="fr"/>${cells}<g class="ln"><line x1="0" y1="0" x2="300" y2="300"/><line x1="300" y1="0" x2="0" y2="300"/><polygon points="150,0 300,150 150,300 0,150"/></g></svg>`;
  }
  function houseHtml(){
    const h = A.HOUSES[S.house - 1], kinds = A.HOUSE_KINDS.filter(k => k.h.includes(h.n)), aim = A.AIMS.find(a => a.h.includes(h.n)), sg = A.SIGNS[h.n - 1];
    return `<div class="at-card" style="--ac:${aim.color}"><div class="at-hd"><span class="at-big n">${h.n}</span><div><h3>${h.name}</h3><p>${h.sa} bhava · ${ordn(h.n)} house</p></div></div><p class="at-lead">${h.sig}.</p>
      ${kv([['Natural sign', sg.glyph + ' ' + sg.name + ' (lord ' + gl(sg.lord) + ' ' + sg.lord + ')', 1], ['Karaka', h.karaka], ['Body', h.body], ['Life aim', aim.name + ' (' + aim.sa + ')']], 2)}
      <div class="at-pills">${kinds.map(k => pill(k.name + ' · ' + k.sa)).join('')}</div></div>`;
  }
  function housesHtml(){
    const kinds = A.HOUSE_KINDS.map(k => `<div class="at-kind"><b>${k.name}<small>${k.sa}</small></b><span>${k.h.map(n => `<i data-house="${n}">${n}</i>`).join('')}</span><p>${k.note}</p></div>`).join('');
    const aims = A.AIMS.map(a => `<div class="at-aim" style="--ac:${a.color}"><b>${a.name}</b><small>${a.sa}</small><span>${a.h.map(n => `<i data-house="${n}">${n}</i>`).join('')}</span></div>`).join('');
    return `<div class="at-hero2">${houseSvg()}<p class="at-note c">North Indian layout: house 1 is always the top diamond and the houses run anticlockwise. K = angle (Kendra), T = trine (Trikona), D = difficult (Dusthana).</p></div><div id="atHouse">${houseHtml()}</div>${sec('Four aims of life', 'Purusharthas', `<div class="at-aims">${aims}</div>`)}${sec('Kinds of house', 'tap a number to open that house', kinds)}`;
  }

  /* ---------- STARS ---------- */
  function nakHtml(){
    const n = A.NAK[S.nak], c = col(n.lord), padas = [0, 1, 2, 3].map(k => { const lon = n.from + k * 10 / 3, sg = Math.floor(lon / 30), nv = (n.i * 4 + k) % 12;
      return `<div><b>Pada ${k + 1}</b><span>${A.SIGNS[sg].glyph} ${Math.floor(lon % 30)}°${String(Math.round((lon % 30 % 1) * 60)).padStart(2, '0')}′ · navamsa ${A.SIGNS[nv].glyph} ${A.SIGNS[nv].name}</span></div>`; }).join('');
    const d0 = n.from % 30, dm = (x) => Math.floor(x) + '°' + String(Math.round((x % 1) * 60)).padStart(2, '0') + '′';
    return `<div class="at-card" style="--ac:${c}"><div class="at-hd"><span class="at-big n">${n.i + 1}</span><div><h3>${n.name}</h3><p>${gl(n.lord)} ${n.lord} nakshatra · ${A.DASHA_YEARS[n.lord]} year Dasha</p></div></div>
      ${kv([['Span', `${dm(d0)} to ${dm(d0 + 13.3333)} ${A.SIGNS[n.sign].name}${d0 + 13.3333 > 30 ? ' and beyond' : ''}`], ['Deity', n.deity], ['Symbol', n.symbol], ['Gana', n.gana], ['Animal (yoni)', n.animal], ['Nature', n.nature]], 2)}
      <div class="at-padas">${padas}</div></div>`;
  }
  function starsHtml(){
    const rows = A.DASHA_ORDER.map(l => `<div class="at-nrow" style="--ac:${col(l)}"><b>${gl(l)}<small>${l}</small></b>${A.NAK.filter(n => n.lord === l).map(n => `<button type="button" class="at-ntile${S.nak === n.i ? ' on' : ''}" data-nak="${n.i}"><em>${n.i + 1}</em>${n.name}</button>`).join('')}</div>`).join('');
    return `<div id="atNak">${nakHtml()}</div>${sec('All 27 by ruling planet', 'the Dasha order repeats three times', `<div class="at-nrows" id="atPick">${rows}</div>`)}`;
  }

  /* ---------- TIME ---------- */
  function donut(){
    let a0 = -90; const r = 84, cx = 110, cy = 110, tot = 120, arcs = A.DASHA_ORDER.map(p => { const sw = A.DASHA_YEARS[p] / tot * 360, a1 = a0 + sw, x0 = cx + r * Math.cos(a0 * Math.PI / 180), y0 = cy + r * Math.sin(a0 * Math.PI / 180), x1 = cx + r * Math.cos(a1 * Math.PI / 180), y1 = cy + r * Math.sin(a1 * Math.PI / 180), m = (a0 + a1) / 2, tx = cx + (r + 0) * Math.cos(m * Math.PI / 180), ty = cy + r * Math.sin(m * Math.PI / 180); a0 = a1;
      return `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${sw > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${col(p)}" class="arc"><title>${p} ${A.DASHA_YEARS[p]} years</title></path><text x="${tx.toFixed(1)}" y="${(ty + 5).toFixed(1)}" class="al">${gl(p)}</text>`; }).join('');
    return `<svg class="at-donut" viewBox="0 0 220 220" role="img" aria-label="The 120 year Vimshottari cycle">${arcs}<text x="110" y="108" class="c1">120</text><text x="110" y="130" class="c2">years</text></svg>`;
  }
  function timeHtml(){
    const T = A.TITHI, tit = (half) => T.map((t, i) => { const n = i + 1, last = i === 14, nm = last ? (half === 'S' ? 'Purnima' : 'Amavasya') : t[0], dt = last ? (half === 'S' ? 'Chandra' : 'Pitris') : t[1];
      return `<div class="at-tt"><em>${half === 'S' ? n : n + 15}</em><b>${nm}</b><span>${dt}</span><small>${A.TITHI_KIND[i % 5].split(' ')[0]}</small></div>`; }).join('');
    const avg = (() => { const mdDays = 120 / 9 * 365.25; let d = mdDays; return A.DASHA_LEVELS.map((n, i) => { const out = [n, d]; d /= 9; return out; }); })();
    const fmt = d => d >= 365 ? (d / 365.25).toFixed(1) + ' years' : d >= 60 ? (d / 30.44).toFixed(1) + ' months' : d >= 2 ? d.toFixed(1) + ' days' : (d * 24).toFixed(1) + ' hours';
    return sec('The 120 year Dasha cycle', 'Vimshottari', `<div class="at-donutw">${donut()}<div class="at-dleg">${A.DASHA_ORDER.map(p => `<span style="--ac:${col(p)}"><b>${gl(p)}</b>${p}<em>${A.DASHA_YEARS[p]}</em></span>`).join('')}</div></div><p class="at-note">The order never changes: Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury. Your birth Moon nakshatra decides where in the cycle you start.</p>`)
      + sec('How long each level lasts', 'on average', `<div class="at-lvl">${avg.map((a, i) => `<div style="--w:${Math.max(8, 100 - i * 15)}%"><b>${i + 1}</b><span>${a[0]}</span><em>${fmt(a[1])}</em><i></i></div>`).join('')}</div>`)
      + sec('Tithi', 'the 30 lunar days: 15 bright, 15 dark', `<h5 class="at-h5">Shukla paksha (waxing)</h5><div class="at-tts">${tit('S')}</div><h5 class="at-h5">Krishna paksha (waning)</h5><div class="at-tts">${tit('K')}</div><p class="at-note">Kinds repeat in fives: Nanda (joy), Bhadra (good), Jaya (victory), Rikta (empty, avoid starting things), Purna (full).</p>`)
      + sec('Nitya yoga', '27 Sun plus Moon combinations', `<div class="at-chips">${A.YOGA.map((y, i) => `<i class="${A.YOGA_BAD.includes(y) ? 'bad' : ''}"><em>${i + 1}</em>${y}</i>`).join('')}</div><p class="at-note">Red marks the traditionally difficult yogas.</p>`)
      + sec('Karana', 'half a tithi each', `<h5 class="at-h5">Moving, 7 (repeat eight times)</h5><div class="at-chips">${A.KARANA.moving.map(k => `<i class="${k.startsWith('Vishti') ? 'bad' : ''}">${k}</i>`).join('')}</div><h5 class="at-h5">Fixed, 4 (once a month)</h5><div class="at-chips">${A.KARANA.fixed.map(k => `<i>${k}</i>`).join('')}</div>`)
      + sec('Six seasons', 'Ritu', `<div class="at-seas">${A.SEASONS.map(s => `<div style="--ac:${col(s.lord.split(' ')[0])}"><b>${s.n}</b><span>${s.en}</span><em>${s.months}</em><small>${s.lord}</small></div>`).join('')}</div>`);
  }

  /* ---------- RULES ---------- */
  function rulesHtml(){
    const P7 = A.PL.slice(0, 7), cell = (a, b) => a === b ? '<td class="me">·</td>' : `<td class="${A.FRIEND[a][b]}"><b>${A.FRIEND[a][b] === 'F' ? '♥' : A.FRIEND[a][b] === 'E' ? '✕' : '○'}</b></td>`;
    const mat = `<table class="at-fr"><thead><tr><th></th>${P7.map(p => `<th style="--ac:${col(p)}">${gl(p)}</th>`).join('')}</tr></thead><tbody>${P7.map(a => `<tr><th style="--ac:${col(a)}">${gl(a)}</th>${P7.map(b => cell(a, b)).join('')}</tr>`).join('')}</tbody></table>`;
    const asp = A.ASPECTS.map(a => `<div class="at-asp"><b>${a[0]}</b><span>${a[1]}</span></div>`).join('');
    const dig = A.PL.slice(0, 7).map(p => { const q = A.P[p], g = n => { const s = A.SIGNS.find(x => x.name === n); return s ? s.glyph : n; };
      return `<div class="at-dr" style="--ac:${col(p)}"><b>${gl(p)}<small>${p}</small></b><span class="ex"><small>Exalted</small>${g(q.exalt[0])} ${q.exalt[1]}°</span><span class="ow"><small>Own</small>${q.own.map(g).join(' ')}</span><span class="mt"><small>Moolatrikona</small>${g(q.mt[0])} ${q.mt[1]}°</span><span class="de"><small>Debilitated</small>${g(q.debil[0])} ${q.debil[1]}°</span></div>`; }).join('');
    const group = (o) => Object.keys(o).map(k => `<div class="at-grp"><b>${k}</b><span>${o[k].map(p => `<i style="--ac:${col(p)}">${gl(p)} ${p}</i>`).join('')}</span></div>`).join('');
    return sec('Natural friendships', 'read across: the planet on the left feels this way about the planet on top', mat + `<p class="at-note"><b class="f">♥</b> friend · <b>○</b> neutral · <b class="e">✕</b> enemy. Rahu and Ketu: friends Mercury, Venus, Saturn; Jupiter neutral; enemies Sun, Moon, Mars.</p>`)
      + sec('Dignity', 'where each planet is strongest and weakest', `<div class="at-drs">${dig}</div><p class="at-note">Rahu and Ketu are left out because the schools disagree on their signs.</p>`)
      + sec('Aspects (drishti)', 'Vedic planets look at whole houses counted from where they stand', `<div class="at-asps">${asp}</div>`)
      + sec('Directional strength', 'Dik bala', `<div class="at-comp">${A.DIKBALA.map(d => `<div class="d${d.house}"><b>House ${d.house}</b><span>${d.dir}</span><em>${d.planets.map(p => gl(p) + ' ' + p).join(' · ')}</em></div>`).join('')}</div>`)
      + sec('Eight directions', 'Dikpalas', `<div class="at-dik">${A.DIKPALA.map(d => `<div style="--ac:${col(d[2])}"><b>${d[0]}</b><span>${d[1]}</span><em>${gl(d[2])} ${d[2]}</em></div>`).join('')}</div>`)
      + sec('Three gunas', '', group(A.GUNAS)) + sec('Three doshas', 'Ayurvedic humours', group(A.DOSHAS)) + sec('Five elements', 'Tattvas', group(A.TATTVAS));
  }

  /* ---------- CHARTS ---------- */
  function chartsHtml(){
    return sec('Divisional charts', 'Vargas: each one zooms into one part of life', `<div class="at-vg">${A.VARGAS.map(v => `<div><b>${v[0]}</b><span>${v[1]}</span><em>${v[2]}</em></div>`).join('')}</div><p class="at-note">The Divisional Charts tab of this app draws these for your birth chart. D9 (Navamsa) is the most used after the main chart.</p>`);
  }

  /* ---------- shell ---------- */
  const BODY = { week:weekHtml, planets:planetsHtml, signs:signsHtml, body:bodyTab, houses:housesHtml, stars:starsHtml, time:timeHtml, rules:rulesHtml, charts:chartsHtml };
  function wheelCenter(){ const d = A.DAYS[S.day], a = document.getElementById('atWm1'), b = document.getElementById('atWm2'); if (a){ a.textContent = d.en; b.textContent = gl(d.lord) + ' ' + d.lord; } }
  function paint(){
    const host = document.getElementById('atBody'); if (!host) return;
    host.innerHTML = `<div class="at-pane" data-pane="${S.tab}">${BODY[S.tab]()}</div>`;
    document.querySelectorAll('#atlas .at-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
    if (S.tab === 'week') wheelCenter();
  }
  function html(){
    const d = A.DAYS[new Date().getDay()];
    return `<div class="atlas" id="atlas"><header class="at-top"><div><h2>Astro Atlas</h2><p>The basics of Vedic astrology in one place: day lords, signs, houses, nakshatras, time and rules.</p></div><div class="at-now" style="--ac:${col(d.lord)}"><b>${gl(d.lord)}</b><span>${d.en}<small>${d.lord}'s day</small></span></div></header>
      <nav class="at-tabs" aria-label="Atlas sections">${TABS.map(t => `<button type="button" class="at-tab${S.tab === t[0] ? ' on' : ''}" data-tab="${t[0]}"><b>${t[1]}</b><span>${t[2]}</span></button>`).join('')}</nav><div id="atBody"></div></div>`;
  }
  const upd = (id, fn) => { const e = document.getElementById(id); if (e){ e.innerHTML = fn(); e.classList.remove('at-swap'); void e.offsetWidth; e.classList.add('at-swap'); } };
  document.addEventListener('click', e => {
    const t = e.target.closest ? e.target.closest('#atlas [data-tab],#atlas [data-day],#atlas [data-planet],#atlas [data-sign],#atlas [data-body],#atlas [data-house],#atlas [data-nak]') : null; if (!t) return;
    const D = t.dataset;
    if (D.tab){ S.tab = D.tab; paint(); const n = document.getElementById('atlas'); if (n && n.scrollIntoView) n.scrollIntoView({ block:'start', behavior:'smooth' }); return; }
    if (D.day != null){ S.day = +D.day; document.querySelectorAll('#atlas .at-wn').forEach(g => g.classList.toggle('on', +g.dataset.day === S.day)); upd('atDay', dayHtml); wheelCenter(); return; }
    if (D.planet){ S.planet = D.planet; document.querySelectorAll('#atlas [data-planet]').forEach(b => b.classList.toggle('on', b.dataset.planet === S.planet)); upd('atPlanet', planetHtml); return; }
    if (D.sign != null){ S.sign = +D.sign; document.querySelectorAll('#atlas .at-tile[data-sign]').forEach(b => b.classList.toggle('on', +b.dataset.sign === S.sign)); upd('atSign', signHtml); return; }
    if (D.body != null){ S.body = +D.body; document.querySelectorAll('#atlas .at-bm').forEach(g => g.classList.toggle('on', +g.dataset.body === S.body)); upd('atBodyD', bodyHtml); return; }
    if (D.house != null){ S.house = +D.house; document.querySelectorAll('#atlas .at-hc').forEach(g => g.classList.toggle('on', +g.dataset.house === S.house)); upd('atHouse', houseHtml); const h = document.getElementById('atHouse'); if (h && h.getBoundingClientRect().top < 0 && h.scrollIntoView) h.scrollIntoView({ block:'center', behavior:'smooth' }); return; }
    if (D.nak != null){ S.nak = +D.nak; document.querySelectorAll('#atlas .at-ntile').forEach(b => b.classList.toggle('on', +b.dataset.nak === S.nak)); upd('atNak', nakHtml); const h = document.getElementById('atNak'); if (h && h.getBoundingClientRect().top < 0 && h.scrollIntoView) h.scrollIntoView({ block:'start', behavior:'smooth' }); }
  });
  window.buildAtlasPanel = function(){ setTimeout(paint, 0); return html(); };
  return { S, html, paint };
})();
window.ATL = ATL;

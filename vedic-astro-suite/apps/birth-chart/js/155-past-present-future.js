/* Past · Present · Future (js/155, global PPF). One screen that lays the Vimshottari periods (js/10 engine, js/91 reading layer VDA) out as a life river,
   an ease chart around today, and three panes: what has run, what runs now, what comes next.
   No new astrology: every date, lord, tone and sentence comes from VDA / the dasha engine. Tone is a teaching aid (tendencies, not verdicts).
   Class-scoped (ppf-) only. */
const PPF = (() => {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const G = p => (typeof PLANET_GLYPHS !== 'undefined' && PLANET_GLYPHS && PLANET_GLYPHS[p]) || '';
  const YEAR = 365.2425 * 864e5, MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmt = d => MON[d.getMonth()] + ' ' + d.getFullYear();
  const fmtD = d => d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear();
  const TC = { supportive: 'ppf-s', mixed: 'ppf-m', challenging: 'ppf-c' };
  const TCOL = { supportive: '#5ec4b7', mixed: '#e6b94f', challenging: '#d96c9b' };
  let lastChart = null, sig = 'Lagna', tab = 'present', pickI = null, pickBar = null, bars = [];

  const left = (end, now) => {
    let m = Math.max(0, Math.round((end - now) / (YEAR / 12))); const y = Math.floor(m / 12); m -= y * 12;
    return (y ? y + (y === 1 ? ' year' : ' years') : '') + (y && m ? ' ' : '') + (m || !y ? m + (m === 1 ? ' month' : ' months') : '');
  };
  const chip = t => `<span class="ppf-chip ${TC[t] || 'ppf-m'}">${esc(t)}</span>`;
  const gl = p => `<span class="ppf-gl">${esc(G(p))}</span>`;

  function model(chart, now) {
    if (typeof VDA === 'undefined' || !VDA || !chart || !chart.dashaData) return null;
    const T = VDA.timeline(chart, now), M = chart.dashaData.mahadashas;
    return { T, M, birth: T.birth, endAll: M[M.length - 1].endDate, cur: VDA.current(chart, now) };
  }

  /* ---------- life river ---------- */
  function riverSvg(m, now) {
    const W = 360, H = 74, pad = 6, span = (m.endAll - m.birth) / YEAR, X = d => pad + (d - m.birth) / YEAR / span * (W - 2 * pad);
    const nowX = Math.min(W - pad, Math.max(pad, X(now)));
    const segs = m.T.periods.map(p => {
      const x1 = X(p.start), x2 = X(p.end), w = Math.max(2, x2 - x1 - 1.5), cx = x1 + w / 2;
      return `<g class="ppf-seg${pickI === p.index ? ' ppf-on' : ''}${p.status === 'past' ? ' ppf-past' : ''}" data-i="${p.index}" tabindex="0" role="button" aria-label="${esc(p.lord)} Mahadasha ${fmt(p.start)} to ${fmt(p.end)}"><rect x="${x1.toFixed(1)}" y="16" width="${w.toFixed(1)}" height="34" rx="7" fill="${TCOL[p.tone]}"/>${w > 17 ? `<text x="${cx.toFixed(1)}" y="38" text-anchor="middle" class="ppf-sg">${esc(G(p.lord))}</text>` : ''}</g>`;
    }).join('');
    let ticks = ''; for (let a = 0; a <= span; a += 20) { const x = X(new Date(m.birth.getTime() + a * YEAR)); ticks += `<text x="${x.toFixed(1)}" y="68" text-anchor="${a === 0 ? 'start' : 'middle'}" class="ppf-tk">${a}</text>`; }
    return `<svg viewBox="0 0 ${W} ${H}" class="ppf-river" role="group" aria-label="Your life by Mahadasha, age 0 to ${Math.round(span)}">${segs}<line x1="${nowX.toFixed(1)}" x2="${nowX.toFixed(1)}" y1="8" y2="56" class="ppf-nl"/><path d="M${(nowX - 5).toFixed(1)} 2h10l-5 8z" class="ppf-nt"/>${ticks}</svg>`;
  }
  function pickHtml(m, now) {
    const p = m.T.periods[pickI == null ? (m.T.currentIndex >= 0 ? m.T.currentIndex : 0) : pickI]; if (!p) return '';
    return `<div class="ppf-pick" aria-live="polite"><div class="ppf-ph">${gl(p.lord)}<b>${esc(p.lord)} Mahadasha</b>${chip(p.tone)}<em>${p.status === 'past' ? 'Past' : p.status === 'now' ? 'Now' : 'Ahead'}</em></div><div class="ppf-pm">${fmt(p.start)} to ${fmt(p.end)} · age ${p.ageStart} to ${p.ageEnd} · ${esc(p.lord)} in house ${p.house}</div><p>Tends to be about ${esc(p.theme)}.</p></div>`;
  }

  /* ---------- ease chart around today ---------- */
  function collectBars(chart, m, now) {
    const lo = Math.max(m.birth.getTime(), now.getTime() - 10 * YEAR), hi = Math.min(m.endAll.getTime(), now.getTime() + 10 * YEAR), out = [];
    m.M.forEach((md, i) => { if (md.endDate.getTime() < lo || md.startDate.getTime() > hi) return;
      VDA.antardashas(chart, i, now).forEach(r => { if (r.end.getTime() > lo && r.start.getTime() < hi) out.push(r); }); });
    return { lo, hi, rows: out };
  }
  function chartSvg(chart, m, now) {
    const B = collectBars(chart, m, now); bars = B.rows;
    const W = 360, H = 176, L = 6, R = 354, zero = 86, scale = 30, X = t => L + (t - B.lo) / (B.hi - B.lo) * (R - L);
    const bs = bars.map((r, k) => {
      const x1 = X(Math.max(B.lo, r.start.getTime())), x2 = X(Math.min(B.hi, r.end.getTime())), w = Math.max(1.5, x2 - x1 - 1), e = Math.max(-2.2, Math.min(2.4, r.ease)), h = Math.max(5, Math.abs(e) * scale), y = e >= 0 ? zero - h : zero;
      return `<g class="ppf-bar${r.status === 'past' ? ' ppf-past' : ''}${pickBar === k ? ' ppf-on' : ''}" data-k="${k}" tabindex="0" role="button" aria-label="${esc(r.mdLord)} ${esc(r.lord)} ${fmt(r.start)} to ${fmt(r.end)}, ${r.tone}"><rect x="${x1.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${TCOL[r.tone]}"/>${w > 15 ? `<text x="${(x1 + w / 2).toFixed(1)}" y="${(e >= 0 ? y + 12 : y + h - 5).toFixed(1)}" text-anchor="middle" class="ppf-bg">${esc(G(r.lord))}</text>` : ''}</g>`;
    }).join('');
    let yrs = ''; const y0 = new Date(B.lo).getFullYear() + 1;
    for (let y = y0; y <= new Date(B.hi).getFullYear(); y += (new Date(B.hi).getFullYear() - y0 > 14 ? 4 : 2)) { const x = X(new Date(y, 0, 1).getTime()); if (x > L + 8 && x < R - 8) yrs += `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="14" y2="158" class="ppf-gr"/><text x="${x.toFixed(1)}" y="171" text-anchor="middle" class="ppf-tk">${y}</text>`; }
    const nx = X(now.getTime());
    return `<svg viewBox="0 0 ${W} ${H}" class="ppf-ease" role="group" aria-label="Ease of each sub-period, ten years back to ten years ahead"><text x="${L}" y="10" class="ppf-tk">easier</text><text x="${L}" y="166" class="ppf-tk"></text>${yrs}<line x1="${L}" x2="${R}" y1="${zero}" y2="${zero}" class="ppf-zl"/>${bs}<line x1="${nx.toFixed(1)}" x2="${nx.toFixed(1)}" y1="14" y2="158" class="ppf-nl"/><text x="${Math.min(R - 12, Math.max(L + 12, nx)).toFixed(1)}" y="10" text-anchor="middle" class="ppf-nw">NOW</text><text x="${R}" y="158" text-anchor="end" class="ppf-tk">testing</text></svg>`;
  }
  function barHtml() {
    const r = bars[pickBar]; if (pickBar == null || !r) return `<div class="ppf-pick ppf-hint">Tap a bar to read that sub-period.</div>`;
    return `<div class="ppf-pick" aria-live="polite"><div class="ppf-ph">${gl(r.mdLord)}<b>${esc(r.mdLord)}–${esc(r.lord)}</b>${gl(r.lord)}${chip(r.tone)}<em>${r.status === 'past' ? 'Past' : r.status === 'now' ? 'Now' : 'Ahead'}</em></div><div class="ppf-pm">${fmtD(r.start)} to ${fmtD(r.end)}</div><p>${esc(r.blend)} ${esc(r.houseNote)}</p></div>`;
  }

  /* ---------- period cards ---------- */
  function adStrip(chart, i, now) {
    const ads = VDA.antardashas(chart, i, now), tot = ads.reduce((s, a) => s + (a.end - a.start), 0) || 1;
    return `<div class="ppf-strip" aria-label="Sub-periods inside this Mahadasha">${ads.map(a => `<span class="${a.status === 'past' ? 'ppf-past' : ''}${a.status === 'now' ? ' ppf-nowb' : ''}" style="flex:${(a.end - a.start) / tot};background:${TCOL[a.tone]}" title="${esc(a.lord)} ${fmt(a.start)} to ${fmt(a.end)}">${((a.end - a.start) / tot) > .07 ? esc(G(a.lord)) : ''}</span>`).join('')}</div>`;
  }
  function card(chart, p, now) {
    const lead = p.status === 'past' ? 'Looking back' : p.status === 'now' ? 'Right now' : 'When it arrives';
    return `<article class="ppf-card ${p.status === 'past' ? 'ppf-cp' : ''}"><div class="ppf-ph">${gl(p.lord)}<b>${esc(p.lord)} Mahadasha</b>${chip(p.tone)}</div>
      <div class="ppf-pm">${fmt(p.start)} to ${fmt(p.end)} · age ${p.ageStart} to ${p.ageEnd} · ${p.years} yrs</div>
      ${adStrip(chart, p.index, now)}
      <p class="ppf-th">Tends to be about <b>${esc(p.theme)}</b>. ${esc(p.arenaText)}</p>
      <p class="ppf-rf"><em>${esc(lead)}:</em> ${esc(p.reflect)}</p>
      <details><summary>More about this stage</summary><p>It often feels like ${esc(p.feelsLike)}.</p><p><b>Tends to help:</b> ${esc(p.helps.join ? p.helps.join(', ') : p.helps)}.</p><p><b>Worth watching:</b> ${esc(p.watch.join ? p.watch.join(', ') : p.watch)}.</p><p class="ppf-why">Why ${esc(p.tone)}: ${esc(p.why.join('; '))}.</p></details></article>`;
  }

  /* ---------- panes ---------- */
  function pastPane(chart, m, now) {
    const L = m.T.periods.filter(p => p.status === 'past').reverse();
    if (!L.length) return `<div class="ppf-card"><p>No Mahadasha has finished yet. You are still in the first one.</p></div>`;
    return `<p class="ppf-cap">Stages already lived, newest first. Read the line that starts "Looking back" and see whether it fits.</p>` + L.map(p => card(chart, p, now)).join('');
  }
  function bar(label, a, b, now) { const f = Math.max(0, Math.min(1, (now - a) / (b - a))); return `<div class="ppf-pg"><div><span>${label}</span><b>${Math.round(f * 100)}% done · ${esc(left(b, now))} left</b></div><i><u style="width:${(f * 100).toFixed(1)}%"></u></i></div>`; }
  function housesLit(chart, cur) {
    const mh = cur.md.house, ah = cur.ad ? cur.ad.houseFromMain : null, adH = cur.ad ? chart.planets[cur.ad.lord].house : null, ru = cur.md.ruled;
    return `<div class="ppf-hs" role="group" aria-label="Houses lit up now">${Array.from({ length: 12 }, (_, k) => k + 1).map(h => `<span class="${h === mh ? 'ppf-hm' : ''}${adH && h === adH ? ' ppf-ha' : ''}${ru.includes(h) ? ' ppf-hr' : ''}">${h}</span>`).join('')}</div>
      <div class="ppf-hk"><span><i class="ppf-hm"></i>${esc(cur.md.lord)} sits here</span>${adH ? `<span><i class="ppf-ha"></i>${esc(cur.ad.lord)} sits here</span>` : ''}<span><i class="ppf-hr"></i>houses ${esc(cur.md.lord)} rules</span></div>`;
  }
  function presentPane(chart, m, now) {
    const c = m.cur; if (!c || !c.md) return `<div class="ppf-card"><p>This chart is past the 120-year Vimshottari cycle, so no period is running.</p></div>`;
    const act = typeof findActiveDasha === 'function' ? findActiveDasha(chart.dashaData.mahadashas, now) : null, pd = act && act.pratyantardasha;
    const ad = c.ad;
    return `<p class="ppf-cap">Today, ${esc(fmtD(now))}. Three clocks run together: the big stage, the sub-stage inside it, and a shorter one inside that.</p>
      <article class="ppf-card ppf-now"><div class="ppf-ph">${gl(c.md.lord)}<b>${esc(c.md.lord)} Mahadasha</b>${chip(c.md.tone)}</div><div class="ppf-pm">${fmt(c.md.start)} to ${fmt(c.md.end)}</div>${bar('Big stage', c.md.start, c.md.end, now)}
        <p class="ppf-th">Tends to be about <b>${esc(c.md.theme)}</b>. ${esc(c.md.arenaText)}</p></article>
      ${ad ? `<article class="ppf-card ppf-now"><div class="ppf-ph">${gl(ad.lord)}<b>${esc(ad.lord)} Antardasha</b>${chip(ad.tone)}</div><div class="ppf-pm">${fmtD(ad.start)} to ${fmtD(ad.end)}</div>${bar('Sub-stage', ad.start, ad.end, now)}
        <p class="ppf-th">${esc(ad.blend)} ${esc(ad.houseNote)}</p><p class="ppf-rf"><em>Right now:</em> ${esc(ad.scene)}</p></article>` : ''}
      ${pd ? `<article class="ppf-card ppf-now ppf-mini"><div class="ppf-ph">${gl(pd.lord)}<b>${esc(pd.lord)} Pratyantardasha</b></div><div class="ppf-pm">${fmtD(pd.startDate)} to ${fmtD(pd.endDate)}</div>${bar('Short stage', pd.startDate, pd.endDate, now)}</article>` : ''}
      <article class="ppf-card"><h4>Houses lit up now</h4><p class="ppf-cap">The houses where today's lords sit and the houses the big-stage lord rules.</p>${housesLit(chart, c)}</article>
      ${adStrip(chart, c.md.index, now) ? `<article class="ppf-card"><h4>Inside this Mahadasha</h4><p class="ppf-cap">Each block is one sub-period. The outlined block is now.</p>${adStrip(chart, c.md.index, now)}</article>` : ''}`;
  }
  function futurePane(chart, m, now) {
    const up = VDA.upcoming(chart, 5, now), later = m.T.periods.filter(p => p.status === 'ahead').slice(0, 4);
    const rows = up.map(r => `<div class="ppf-row ${r.status === 'now' ? 'ppf-now' : ''}"><i style="background:${TCOL[r.tone]}"></i><div><div class="ppf-rh"><b>${fmt(r.start)} to ${fmt(r.end)}</b>${gl(r.mdLord)}${gl(r.lord)}${chip(r.tone)}${r.status === 'now' ? '<em>Now</em>' : ''}</div><small>${esc(r.blend)} ${esc(r.houseNote)}</small></div></div>`).join('');
    return `<p class="ppf-cap">What the next five years hold, sub-period by sub-period, then the bigger stages after that. These are tendencies from the chart, not promises.</p>
      <article class="ppf-card"><h4>Next five years</h4>${rows || '<p>No running period to look ahead from.</p>'}</article>
      ${later.length ? `<h4 class="ppf-h">Bigger stages after that</h4>` + later.map(p => card(chart, p, now)).join('') : ''}`;
  }
  function pane(chart) {
    const now = new Date(), m = model(chart, now); if (!m) return '';
    return tab === 'past' ? pastPane(chart, m, now) : tab === 'future' ? futurePane(chart, m, now) : presentPane(chart, m, now);
  }

  /* ---------- directional (+) chart: houses counted in four groups ---------- */
  const ARMS = [
    { houses: [1, 5, 9], name: 'Dharma', note: 'purpose, values, luck and teachers' },
    { houses: [2, 6, 10], name: 'Artha', note: 'money, work and daily effort' },
    { houses: [3, 7, 11], name: 'Kama', note: 'desires, courage, partners and gains' },
    { houses: [4, 8, 12], name: 'Moksha', note: 'home, inner life, change and letting go' }];
  const SIGS = ['Lagna', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const houseOf = (chart, n) => n === 'Lagna' ? 1 : (chart.planets[n] ? chart.planets[n].house : null);
  function dirModel(chart, who) {
    const arms = ARMS.map(a => ({ ...a, planets: [] }));
    SIGS.slice(1).forEach(n => { const h = houseOf(chart, n); if (!h) return; const a = arms.find(x => x.houses.includes(h)); if (a) a.planets.push({ n, h }); });
    const h0 = houseOf(chart, who), s = arms.findIndex(a => a.houses.includes(h0));
    arms.forEach((a, i) => { a.role = i === s ? 'you' : i === (s + 3) % 4 ? 'past' : i === (s + 1) % 4 ? 'future' : 'present'; });
    return { arms, s, who, h0 };
  }
  const ROLE = { you: 'You', past: 'Past', present: 'Present', future: 'Future' };
  function armHtml(a, pos) {
    const chips = a.planets.length ? a.planets.map(p => `<span class="ppf-pc" title="${esc(p.n)} in house ${p.h}"><b>${esc(G(p.n))}</b><i>${p.h}</i></span>`).join('') : '<span class="ppf-em">empty</span>';
    return `<div class="ppf-arm ppf-a-${a.role}" style="grid-area:${pos}"><div class="ppf-ah"><span class="ppf-role">${ROLE[a.role]}</span><b>${a.houses.join(' · ')}</b><small>${esc(a.name)}</small></div><div class="ppf-pcs">${chips}</div></div>`;
  }
  function dirReading(chart, m) {
    const D = (typeof VDA !== 'undefined' && VDA && VDA.data && VDA.data.planet) || {};
    return ['past', 'present', 'future'].map(r => { const a = m.arms.find(x => x.role === r);
      const body = a.planets.length ? a.planets.map(p => `<li><b>${esc(G(p.n))} ${esc(p.n)}</b> in house ${p.h}${D[p.n] && D[p.n].theme ? ': ' + esc(D[p.n].theme) : ''}</li>`).join('') : '<li class="ppf-mt">No planet sits in these houses, so there is nothing to read here from planets alone.</li>';
      return `<div class="ppf-dr ppf-a-${r}"><div class="ppf-ph"><span class="ppf-role">${ROLE[r]}</span><b>Houses ${a.houses.join(' · ')}</b><em>${esc(a.name)}</em></div><p class="ppf-pm">${esc(a.note)}</p><ul>${body}</ul></div>`; }).join('');
  }
  function dirHtml(chart) {
    const m = dirModel(chart, sig), pos = ['1 / 2', '2 / 3', '3 / 2', '2 / 1'];
    const you = m.arms[m.s], sg = sig === 'Lagna' ? '' : esc(G(sig));
    return `<div class="ppf-chips" role="group" aria-label="Who to read for">${SIGS.map(n => `<button type="button" data-sig="${n}" class="${n === sig ? 'ppf-on' : ''}" aria-pressed="${n === sig}">${n === 'Lagna' ? 'Lagna' : esc(G(n)) + ' ' + n}</button>`).join('')}</div>
      <div class="ppf-plus" role="group" aria-label="Directional chart"><div class="ppf-hub"><small>Reading for</small><b>${sg} ${esc(sig)}</b><i>house ${m.h0}</i></div>${m.arms.map((a, i) => armHtml(a, pos[i])).join('')}</div>
      <p class="ppf-cap ppf-dn">Arms run clockwise: 1·5·9 at the top, 2·6·10 right, 3·7·11 bottom, 4·8·12 left. The number beside each planet is its house.</p>
      ${dirReading(chart, m)}
      <p class="ppf-fine">How it works: the houses are put in four groups (Dharma, Artha, Kama, Moksha). Find the group where ${esc(sig)} sits. The group just ahead (clockwise) is read as the future, the group opposite as the present, and the group behind as the past. The four house groups are standard. The past, present and future rule is a teaching method, and I could not verify it in a classical text, so treat it as a lens for reflection, not a prediction.</p>`;
  }

  /* ---------- screen ---------- */
  function html(chart) {
    lastChart = chart; const now = new Date(), m = model(chart, now);
    if (!m) return `<div class="ppf"><div class="ppf-banner"><h3>Past · Present · Future</h3><p>The dasha reading needs the Vimshottari engine, which is not available for this chart.</p></div></div>`;
    const age = Math.max(0, (now - m.birth) / YEAR), c = m.cur;
    const nowTxt = c && c.md ? `${esc(c.md.lord)}${c.ad ? ' – ' + esc(c.ad.lord) : ''}` : 'cycle complete';
    return `<div class="ppf"><div class="ppf-banner"><span class="ppf-orn" aria-hidden="true">⏳</span><h3>Past · Present · Future</h3><p>Your whole life on one line, then what has run, what runs now and what comes next, from your Vimshottari periods.</p>
      <div class="ppf-now-r"><span>Now</span><b>Age ${age.toFixed(1)}</b><b>${nowTxt}</b></div></div>
      <div class="ppf-card"><h4>Directional chart</h4><p class="ppf-cap">Count the houses into four groups and draw them as a + . Choose who you are reading for.</p><div id="ppfDir">${dirHtml(chart)}</div></div>
      <div class="ppf-card"><h4>Your life by Mahadasha</h4><p class="ppf-cap">Each block is one big stage. Faded blocks are behind you. Tap a block.</p><div id="ppfRiver">${riverSvg(m, now)}</div><div id="ppfPick">${pickHtml(m, now)}</div>
        <div class="ppf-legend"><span><i class="ppf-s"></i>Supportive</span><span><i class="ppf-m"></i>Mixed</span><span><i class="ppf-c"></i>Challenging</span></div></div>
      <div class="ppf-card"><h4>Ten years back, ten years ahead</h4><p class="ppf-cap">Each bar is one sub-period. Up is easier, down is more testing. Tap a bar.</p><div id="ppfEase">${chartSvg(chart, m, now)}</div><div id="ppfBar">${barHtml()}</div></div>
      <div class="ppf-tabs" role="tablist" aria-label="Past, present or future">${[['past', 'Past'], ['present', 'Present'], ['future', 'Future']].map(t => `<button type="button" role="tab" aria-selected="${t[0] === tab}" class="${t[0] === tab ? 'ppf-on' : ''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div>
      <div id="ppfBody" class="ppf-body">${pane(chart)}</div>
      <p class="ppf-fine">Supportive, mixed and challenging are a teaching aid: they weigh how friendly each lord is for your rising sign, its dignity and its house. They describe tendencies, never fixed outcomes. Periods come from your Moon's position at birth, so a different birth time can shift the dates. Read them with the whole chart.</p></div>`;
  }
  function refreshPick() {
    const m = lastChart && model(lastChart, new Date()); if (!m) return;
    const r = document.getElementById('ppfRiver'), p = document.getElementById('ppfPick'); if (r) r.innerHTML = riverSvg(m, new Date()); if (p) p.innerHTML = pickHtml(m, new Date());
  }
  function refreshBar() {
    const e = document.getElementById('ppfEase'), b = document.getElementById('ppfBar'), m = lastChart && model(lastChart, new Date()); if (!m) return;
    if (e) e.innerHTML = chartSvg(lastChart, m, new Date()); if (b) b.innerHTML = barHtml();
  }
  const api = {
    html, model,
    setTab(t) { tab = t; document.querySelectorAll('.ppf-tabs button').forEach(b => { const on = b.getAttribute('data-tab') === t; b.classList.toggle('ppf-on', on); b.setAttribute('aria-selected', on); }); const el = document.getElementById('ppfBody'); if (el && lastChart) el.innerHTML = pane(lastChart); },
    pickPeriod(i) { pickI = i; refreshPick(); },
    pickSub(k) { pickBar = k; refreshBar(); },
    setWho(n) { sig = n; const e = document.getElementById('ppfDir'); if (e && lastChart) e.innerHTML = dirHtml(lastChart); },
    dirModel
  };
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('.ppf-tabs button, .ppf-seg, .ppf-bar, .ppf-chips button'); if (!t) return;
    if (t.matches('.ppf-chips button')) api.setWho(t.getAttribute('data-sig')); else if (t.matches('.ppf-tabs button')) api.setTab(t.getAttribute('data-tab')); else if (t.matches('.ppf-seg')) api.pickPeriod(+t.getAttribute('data-i')); else api.pickSub(+t.getAttribute('data-k'));
  });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.ppf-seg, .ppf-bar')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
  window.buildPastPresentFuturePanel = function (chart) { return html(chart); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-ppf', window.buildPastPresentFuturePanel);
  window.PPF = api;
  return api;
})();

/* Hora panel (js/157, global HORAUI, panel-hora). Tabs: Now (live ring), Today (24 horas), Week (7 x 24 grid), Best (best times for an activity), Learn.
   All numbers come from HORA (js/156). Class-scoped (hr-) only. Only transform/opacity animate; no backdrop-filter. Tendency wording only. */
const HORAUI = (() => {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const G = p => (typeof PLANET_GLYPHS !== 'undefined' && PLANET_GLYPHS && PLANET_GLYPHS[p]) || p.charAt(0);
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const TONE = { good: ['hr-s', 'supportive'], mid: ['hr-m', 'mixed'], care: ['hr-c', 'careful'] };
  const BANDC = { Excellent: 'hr-s', Good: 'hr-s', Fair: 'hr-m', Neutral: 'hr-m', Avoid: 'hr-c' };
  const S = { tab: 'now', date: null, wdate: null, act: 'start', show: '', range: 3, useChart: true, open: null, cell: null, loc: null, chart: null };
  let timer = null;

  const nowJd = () => Date.now() / 864e5 + 2440587.5;
  const t12 = jd => { const p = jdToLocalParts(jd, S.loc.tz).timeStr, h = +p.slice(0, 2); return ((h % 12) || 12) + ':' + p.slice(3, 5) + ' ' + (h < 12 ? 'AM' : 'PM'); };
  const span = h => t12(h.from) + ' – ' + t12(h.to);
  const dateOf = jd => jdToLocalParts(jd, S.loc.tz).dateStr;
  const dnice = ds => { const [y, m, d] = ds.split('-').map(Number), w = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); return WD[w] + ' ' + d + ' ' + MON[m - 1]; };
  const addDays = (ds, n) => { const [y, m, d] = ds.split('-').map(Number), t = new Date(Date.UTC(y, m - 1, d + n)); return t.getUTCFullYear() + '-' + String(t.getUTCMonth() + 1).padStart(2, '0') + '-' + String(t.getUTCDate()).padStart(2, '0'); };
  const mins = d => Math.round(d) + ' min';
  const chip = (cls, t) => `<span class="hr-chip ${cls}">${esc(t)}</span>`;
  const toneChip = tone => chip(TONE[tone][0], TONE[tone][1]);
  const pg = l => `<span class="hr-pg" style="--pc:${HORA.PL[l].color}">${esc(G(l))}</span>`;
  const short = n => n.replace(' Kalam', '');
  const cdText = ms => { const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60, p = n => String(n).padStart(2, '0'); return h ? h + ':' + p(m) + ':' + p(x) : p(m) + ':' + p(x); };
  const chartOn = () => (S.useChart ? S.chart : null);

  /* ---------- shared bits ---------- */
  function ribbon(day, jd) {
    const tot = day.nextSunrise - day.sunrise, nowX = jd != null && jd >= day.sunrise && jd < day.nextSunrise ? (jd - day.sunrise) / tot * 100 : null;
    return `<div class="hr-rib" role="img" aria-label="The 24 horas of this day as one coloured line"><div class="hr-rb">${day.horas.map(h => `<span class="${h.night ? 'hr-nt' : ''}" style="flex:${h.to - h.from};background:${HORA.PL[h.lord].color}" title="${esc(h.lord)} ${span(h)}">${esc(G(h.lord))}</span>`).join('')}</div>${nowX != null ? `<i class="hr-rn" style="left:${nowX.toFixed(2)}%"></i>` : ''}</div>
      <div class="hr-rt"><span>☀ ${t12(day.sunrise)}</span><span style="left:${((day.sunset - day.sunrise) / tot * 100).toFixed(1)}%">☾ ${t12(day.sunset)}</span><span>${t12(day.nextSunrise)}</span></div>`;
  }
  function overChips(h) { return h.over.map(n => chip('hr-c', short(n))).join(''); }
  function forYou(lord) {
    const f = S.chart && HORA.forYou(S.chart, lord); if (!f) return '';
    const o = n => ({ own: 'the same planet as', friend: 'a friend of', enemy: 'an enemy of', neutral: 'neutral to' }[n]);
    const e = f.ease >= 1 ? ['hr-s', 'works easily for you'] : f.ease <= -.25 ? ['hr-c', 'a harder planet for you'] : ['hr-m', 'mixed for you'];
    return `<div class="hr-card"><h4>${esc(lord)} in your chart</h4><p class="hr-p">${esc(lord)} sits in your <b>${f.house}${['th', 'st', 'nd', 'rd'][(f.house % 100 > 10 && f.house % 100 < 14) ? 0 : Math.min(f.house % 10, 4) % 4] || 'th'} house</b>${f.sign ? ' in ' + esc(f.sign) : ''}${f.dignity ? ' (' + esc(String(f.dignity).toLowerCase()) + ')' : ''}. ${chip(e[0], e[1])}</p>
      <p class="hr-p hr-mu">${f.lagnaLord ? `${esc(lord)} is ${o(f.toLagnaLord)} your Lagna lord ${esc(f.lagnaLord)}.` : ''} ${f.dashaLord ? `Compared with your running Mahadasha lord ${esc(f.dashaLord)}, it is ${o(f.toDashaLord)} it.` : ''}</p>${f.why.length ? `<p class="hr-p hr-mu">Why: ${esc(f.why.join('; '))}.</p>` : ''}</div>`;
  }
  const unavailable = () => `<div class="hr-card"><p class="hr-p">The Sun does not rise and set normally at this place and date, so the horas cannot be worked out.</p></div>`;

  /* ---------- NOW ---------- */
  function nowPane() {
    const jd = nowJd(), a = HORA.at(jd, S.loc.lat, S.loc.lon, S.loc.tz); if (!a || !a.hora) return unavailable();
    const h = a.hora, pl = HORA.PL[h.lord], C = 2 * Math.PI * 60, f = (jd - h.from) / (h.to - h.from), d = a.day;
    const good = HORA.ACTS.filter(x => x.good.includes(h.lord)), nxt = d.horas.slice(a.idx + 1, a.idx + 4);
    return `<div class="hr-hero" id="hrNow" style="--pc:${pl.color}" data-end="${h.to}">
        <div class="hr-ringw"><svg viewBox="0 0 140 140" aria-hidden="true"><circle class="hr-r0" cx="70" cy="70" r="60"/><circle id="hrArc" class="hr-r1" cx="70" cy="70" r="60" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${(C * (1 - f)).toFixed(2)}"/></svg>
          <div class="hr-rc"><span class="hr-big">${esc(G(h.lord))}</span><b>${esc(h.lord)} Hora</b><small>${h.night ? 'Night' : 'Day'} hora ${h.night ? h.n - 12 : h.n} of 12</small></div></div>
        <div class="hr-cd"><b id="hrLeft">${cdText((h.to - jd) * 864e5)}</b><small>left in this hora</small></div>
        <div class="hr-rng">${span(h)}</div>
        <div class="hr-chips">${chip('hr-t', pl.tag)}${toneChip(h.tone)}${h.chog ? chip(h.chog.tone === 'good' ? 'hr-s' : h.chog.tone === 'bad' ? 'hr-c' : 'hr-m', 'Choghadiya ' + h.chog.name) : ''}${overChips(h)}</div>
        ${h.over.length ? `<p class="hr-warn">${esc(h.over.map(short).join(' and '))} ${h.over.length > 1 ? 'are' : 'is'} also running now. Many people wait for it to pass before starting something important.</p>` : ''}
      </div>
      <div class="hr-card"><h4>${esc(h.lord)} hora tends to favour</h4><p class="hr-p">${esc(pl.does)}.</p><p class="hr-p hr-mu"><b>Be careful with:</b> ${esc(pl.careful)}.</p>
        ${good.length ? `<div class="hr-acts">${good.map(x => `<button type="button" class="hr-ac" data-best="${x.id}"><i>${x.icon}</i>${esc(x.name)}</button>`).join('')}</div><p class="hr-cap">Tap one to find its best times this week.</p>` : ''}</div>
      <div class="hr-card"><h4>Next up</h4>${nxt.map(x => `<div class="hr-nx" style="--pc:${HORA.PL[x.lord].color}">${pg(x.lord)}<div><b>${esc(x.lord)} hora</b> ${toneChip(x.tone)}<small>${span(x)}${x.over.length ? ' · ' + esc(x.over.map(short).join(', ')) : ''}</small></div></div>`).join('') || '<p class="hr-p">This is the last hora before the next sunrise.</p>'}</div>
      <div class="hr-card"><h4>The whole Vedic day</h4><p class="hr-cap">${esc(d.vara.name)}, sunrise to next sunrise. Day horas run ${mins(d.dayMin)} each and night horas ${mins(d.nightMin)} each. Fainter blocks are the night.</p>${ribbon(d, jd)}</div>
      ${forYou(h.lord)}`;
  }

  /* ---------- TODAY ---------- */
  function sel() { return `<label class="hr-sel"><span>Show a score for</span><select id="hrShow"><option value="">Nothing</option>${HORA.ACTS.map(a => `<option value="${a.id}"${S.show === a.id ? ' selected' : ''}>${esc(a.name)}</option>`).join('')}</select></label>`; }
  function detail(h, day) {
    const pl = HORA.PL[h.lord], uses = HORA.ACTS.filter(x => x.good.includes(h.lord)), sc = S.show ? HORA.score(h, day, S.show, chartOn()) : null;
    return `<div class="hr-det"><p class="hr-p"><b>Tends to favour:</b> ${esc(pl.does)}.</p><p class="hr-p hr-mu"><b>Careful with:</b> ${esc(pl.careful)}.</p>
      ${uses.length ? `<p class="hr-p hr-mu"><b>Good for:</b> ${uses.map(x => x.icon + ' ' + esc(x.name)).join(' · ')}</p>` : ''}
      ${h.chog ? `<p class="hr-p hr-mu">Choghadiya at the middle of this hora: ${esc(h.chog.name)}.</p>` : ''}${h.over.length ? `<p class="hr-p hr-mu">Overlaps ${esc(h.over.join(' and '))}.</p>` : ''}
      ${sc ? `<p class="hr-p"><b>${esc(HORA.act(S.show).name)}:</b> ${chip(BANDC[sc.band], sc.band + ' · ' + sc.score)}</p><ul class="hr-why">${sc.why.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}</div>`;
  }
  function row(h, day, jd) {
    const now = jd >= h.from && jd < h.to, sc = S.show ? HORA.score(h, day, S.show, chartOn()) : null, open = S.open === day.date + ':' + h.i;
    return `<div class="hr-rw${now ? ' hr-now' : ''}${open ? ' hr-open' : ''}" style="--pc:${HORA.PL[h.lord].color}"><button type="button" class="hr-row" data-row="${day.date}:${h.i}" aria-expanded="${open}"><span class="hr-n">${h.n}</span>${pg(h.lord)}
      <span class="hr-rm"><b>${esc(h.lord)}</b><small>${span(h)}</small></span><span class="hr-rc2">${now ? chip('hr-t', 'now') : ''}${sc ? chip(BANDC[sc.band], sc.band) : toneChip(h.tone)}${overChips(h)}</span></button>${open ? detail(h, day) : ''}</div>`;
  }
  function todayPane() {
    const ds = S.date, d = HORA.dayOf(ds, S.loc.lat, S.loc.lon, S.loc.tz); if (!d) return unavailable();
    const jd = nowJd();
    return `<div class="hr-bar"><button type="button" class="hr-ar" data-day="-1" aria-label="Previous day">‹</button><label class="hr-dt"><span>${esc(dnice(ds))}</span><input type="date" id="hrDate" value="${ds}" aria-label="Choose a date"></label><button type="button" class="hr-ar" data-day="1" aria-label="Next day">›</button><button type="button" class="hr-tb" data-today="1">Today</button></div>
      <div class="hr-facts"><div><small>Day lord</small><b>${pg(d.vara.lord)} ${esc(d.vara.lord)}</b></div><div><small>Sunrise</small><b>${t12(d.sunrise)}</b></div><div><small>Sunset</small><b>${t12(d.sunset)}</b></div><div><small>Day hora</small><b>${mins(d.dayMin)}</b></div><div><small>Night hora</small><b>${mins(d.nightMin)}</b></div></div>
      <div class="hr-card">${ribbon(d, jd)}</div>${sel()}
      <h4 class="hr-h">Day horas <small>sunrise to sunset</small></h4>${d.horas.slice(0, 12).map(h => row(h, d, jd)).join('')}
      <h4 class="hr-h">Night horas <small>sunset to next sunrise</small></h4>${d.horas.slice(12).map(h => row(h, d, jd)).join('')}
      <button type="button" class="hr-copy" data-copy="1">Copy this day as text</button>
      <p class="hr-fine">The Vedic day runs from sunrise to the next sunrise, so a time after midnight still belongs to the day before. Hora is a popular timing practice (Muhurta), not a guarantee. Many people also check Rahu Kalam and Choghadiya.</p>`;
  }

  /* ---------- WEEK ---------- */
  function weekPane() {
    const D = HORA.week(S.wdate, 7, S.loc.lat, S.loc.lon, S.loc.tz); if (!D.length) return unavailable();
    const jd = nowJd(), a = S.show ? HORA.act(S.show) : null;
    const head = `<div class="hr-wh"></div>` + D.map(d => `<div class="hr-wh ${d.date === dateOf(jd) ? 'hr-today' : ''}"><b>${WD[d.vara.idx]}</b><small>${+d.date.slice(8)}</small></div>`).join('');
    let cells = '';
    for (let i = 0; i < 24; i++) {
      if (i === 12) cells += `<div class="hr-wsep">☾ night</div>`;
      cells += `<div class="hr-wl">${i + 1}</div>` + D.map(d => { const h = d.horas[i], now = jd >= h.from && jd < h.to, cls = a ? (a.good.includes(h.lord) ? ' hr-wg' : a.avoid.includes(h.lord) ? ' hr-wx' : '') : '';
        return `<button type="button" class="hr-wc${now ? ' hr-wn' : ''}${cls}${S.cell === d.date + ':' + i ? ' hr-wo' : ''}${h.over.length ? ' hr-wr' : ''}" data-cell="${d.date}:${i}" style="--pc:${HORA.PL[h.lord].color}" aria-label="${esc(dnice(d.date))} ${esc(h.lord)} hora ${span(h)}">${esc(G(h.lord))}</button>`; }).join('');
    }
    let det = '<div class="hr-card hr-hint">Tap a square to read that hora.</div>';
    if (S.cell) { const [ds, ix] = S.cell.split(':'), d = D.find(x => x.date === ds); if (d) { const h = d.horas[+ix], sc = a ? HORA.score(h, d, S.show, chartOn()) : null;
      det = `<div class="hr-card" style="--pc:${HORA.PL[h.lord].color}"><div class="hr-dh">${pg(h.lord)}<b>${esc(h.lord)} hora</b>${toneChip(h.tone)}</div><p class="hr-cap">${esc(dnice(d.date))} · ${span(h)} · ${h.night ? 'night' : 'day'} hora ${h.night ? h.n - 12 : h.n}</p><p class="hr-p">${esc(HORA.PL[h.lord].tag)}. Tends to favour ${esc(HORA.PL[h.lord].does)}.</p>${h.over.length ? `<p class="hr-p hr-mu">Overlaps ${esc(h.over.join(' and '))}.</p>` : ''}${sc ? `<p class="hr-p"><b>${esc(a.name)}:</b> ${chip(BANDC[sc.band], sc.band + ' · ' + sc.score)}</p>` : ''}</div>`; } }
    return `<div class="hr-bar"><button type="button" class="hr-ar" data-wk="-7" aria-label="Previous week">‹</button><div class="hr-dt hr-wt"><span>${esc(dnice(D[0].date))} – ${esc(dnice(D[D.length - 1].date))}</span></div><button type="button" class="hr-ar" data-wk="7" aria-label="Next week">›</button><button type="button" class="hr-tb" data-wtoday="1">This week</button></div>
      <label class="hr-sel"><span>Glow the horas that suit</span><select id="hrShow"><option value="">Nothing</option>${HORA.ACTS.map(x => `<option value="${x.id}"${S.show === x.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
      <div class="hr-wk" role="group" aria-label="Seven days of horas">${head}${cells}</div>
      <div class="hr-leg">${HORA.ORDER.slice().reverse().map(l => `<span><i style="background:${HORA.PL[l].color}"></i>${esc(l)}</span>`).join('')}<span><i class="hr-ld"></i>Rahu Kalam dot</span></div>${det}
      <p class="hr-fine">Rows are hora numbers 1 to 12 (day) then 13 to 24 (night). The clock time of each hora changes day by day because sunrise and sunset move.</p>`;
  }

  /* ---------- BEST ---------- */
  function bestPane() {
    const jd = nowJd(), L = S.loc, a = HORA.act(S.act), all = HORA.best(S.act, jd, S.range, L.lat, L.lon, L.tz, chartOn(), 9999), top = all.slice(0, 8), low = all.slice(-3).reverse();
    const card = (r, k, bad) => { const h = r.h, now = jd >= h.from && jd < h.to;
      return `<article class="hr-res" style="--pc:${HORA.PL[h.lord].color}"><div class="hr-rk${bad ? ' hr-bad' : ''}">${bad ? '!' : k + 1}</div><div class="hr-rbd"><div class="hr-rh"><b>${esc(dnice(r.day.date))}</b><span>${span(h)}</span>${now ? chip('hr-t', 'now') : ''}</div>
        <div class="hr-rl">${pg(h.lord)}<span>${esc(h.lord)} hora</span>${chip(BANDC[r.band], r.band + ' · ' + r.score)}</div><ul class="hr-why">${r.why.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div></article>`; };
    return `<div class="hr-card"><h4>What do you want to do?</h4><div class="hr-grid">${HORA.ACTS.map(x => `<button type="button" class="hr-ac${x.id === S.act ? ' hr-on' : ''}" data-act="${x.id}"><i>${x.icon}</i>${esc(x.name)}</button>`).join('')}</div>
      <div class="hr-seg" role="group" aria-label="How far ahead"><button type="button" data-rng="1" class="${S.range === 1 ? 'hr-on' : ''}">Next 24 h</button><button type="button" data-rng="3" class="${S.range === 3 ? 'hr-on' : ''}">3 days</button><button type="button" data-rng="7" class="${S.range === 7 ? 'hr-on' : ''}">7 days</button></div>
      <label class="hr-tg"><input type="checkbox" id="hrChart" ${S.useChart ? 'checked' : ''}><span>Use my chart in the score</span></label></div>
      <h4 class="hr-h">Best horas for <b>${esc(a.name.toLowerCase())}</b></h4><p class="hr-cap">Ranked by planet fit, friendship with the day lord, clear of Rahu Kalam, Yamaganda and Gulika, Choghadiya${S.useChart ? ' and your chart' : ''}. Reasons are shown under each one.</p>${top.map((r, k) => card(r, k, false)).join('') || '<p class="hr-p">No hora found in this range.</p>'}
      ${low.length ? `<h4 class="hr-h">Times to skip <small>lowest scores in this range</small></h4>${low.map(r => card(r, 0, true)).join('')}` : ''}
      <p class="hr-fine">The score is a teaching aid built from the traditional hora table, planet friendship, the three inauspicious periods, Choghadiya and your chart. It shows a tendency, not a verdict. For weddings and other big events, ask a trusted astrologer to choose a full Muhurta.</p>`;
  }

  /* ---------- LEARN ---------- */
  function learnPane() {
    const d = HORA.dayOf(S.date || dateOf(nowJd()), S.loc.lat, S.loc.lon, S.loc.tz), O = HORA.ORDER;
    const seven = HORA.WEEK.map(l => `<div class="hr-lr"><b>${WD[HORA.WEEK.indexOf(l)]}</b>${pg(l)}<span>${esc(l)}</span></div>`).join('');
    const rows = O.map((l, i) => `<div class="hr-lr">${pg(l)}<b>${esc(l)}</b><span>${esc(HORA.PL[l].tag)}</span>${i < 6 ? '<em>→</em>' : '<em>↺</em>'}</div>`).join('');
    const pls = HORA.WEEK.map(l => { const p = HORA.PL[l]; return `<div class="hr-pl" style="--pc:${p.color}"><div class="hr-dh">${pg(l)}<b>${esc(l)}</b>${toneChip(p.tone)}<em>${esc(p.tag)}</em></div><p class="hr-p"><b>Tends to favour:</b> ${esc(p.does)}.</p><p class="hr-p hr-mu"><b>Careful with:</b> ${esc(p.careful)}.</p></div>`; }).join('');
    const sec = (t, body, open) => `<details class="hr-ls"${open ? ' open' : ''}><summary>${t}</summary><div class="hr-lb">${body}</div></details>`;
    return `<p class="hr-cap">Everything about hora in plain words. Tap a heading to open it.</p>
      ${sec('What is a hora?', `<p class="hr-p">A hora is a slice of the day ruled by one of the seven visible planets. The day is cut into 24 horas, and the planet of the current hora is said to colour what the hour is good for. People use it as a quick way to pick a time for a task, called a Muhurta choice. The word Hora also names the D2 chart and the Hora Lagna in your birth chart; those are different ideas with the same root.</p>`, true)}
      ${sec('How the 24 horas are made', `<p class="hr-p">1. A Vedic day runs from one sunrise to the next.</p><p class="hr-p">2. Day length is sunrise to sunset. Night length is sunset to the next sunrise.</p><p class="hr-p">3. Each day hora = day length ÷ 12. Each night hora = night length ÷ 12.</p><p class="hr-p">4. The first hora of the day belongs to the planet of the weekday. After that the planets follow the order below, over and over.</p>${d ? `<p class="hr-p hr-ex"><b>Worked example, ${esc(dnice(d.date))}:</b> sunrise ${t12(d.sunrise)}, sunset ${t12(d.sunset)}. Day = ${Math.floor(d.dayMin * 12 / 60)} h ${Math.round(d.dayMin * 12 % 60)} min, so each day hora is ${mins(d.dayMin)}. Night = ${Math.floor(d.nightMin * 12 / 60)} h ${Math.round(d.nightMin * 12 % 60)} min, so each night hora is ${mins(d.nightMin)}. First hora: ${esc(d.vara.lord)}.</p>` : ''}`)}
      ${sec('The planet order', `<p class="hr-p">The order is slowest planet to fastest: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon. It is often called the Chaldean order.</p><div class="hr-lo">${rows}</div><p class="hr-p">A day has 24 horas and the cycle has 7 planets. Since 24 = 3 × 7 + 3, the next day's first hora lands three places further along the order. That is why the weekdays run Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn:</p><div class="hr-lo">${seven}</div>`)}
      ${sec('What each planet\'s hora is for', pls)}
      ${sec('How the app scores a hora', `<p class="hr-p">In Best times each hora gets a small score so you can compare them. It adds up:</p><ul class="hr-why"><li><b>+2</b> if the planet is traditionally good for your task, <b>+1</b> if fair, <b>−2</b> if usually avoided.</li><li><b>+0.5</b> if it is the day's own planet or a friend of it, <b>−0.5</b> if an enemy.</li><li><b>−1.5</b> for each overlap with Rahu Kalam, Yamaganda or Gulika Kalam.</li><li><b>±0.5</b> if Choghadiya at that moment is good or to be avoided.</li><li><b>up to ±1</b> from how easily that planet works in your own chart.</li></ul><p class="hr-p">Bands: 3 or more Excellent, 2 Good, 1 Fair, 0 Neutral, below 0 Avoid. This is the app's own teaching aid.</p>`)}
      ${sec('Hora, Rahu Kalam, Choghadiya and Abhijit', `<p class="hr-p">They are separate tools that people often combine. Hora cuts the day into 24 unequal parts by planet. Choghadiya cuts it into 8 day and 8 night parts with names like Amrit and Rog. Rahu Kalam, Yamaganda and Gulika are fixed eighths of the day to avoid for new starts. Abhijit Muhurta is the short midday window. The Panchang screen shows the last three, and this screen marks any hora that overlaps them.</p>`)}
      ${sec('Where teachers and websites differ', `<p class="hr-p"><b>Equal or unequal.</b> One almanac describes a hora as simply one twenty-fourth of sunrise to sunrise, which would make all horas equal. Most (Drik Panchang, Shubh Panchang, and the classical planetary-hours method) make day horas and night horas different lengths. This app uses the unequal method.</p><p class="hr-p"><b>Where the hour starts.</b> Modern Indian practice starts at sunrise. The old Greek author Vettius Valens started it at sunset.</p><p class="hr-p"><b>Good or bad planets.</b> Sources do not agree on calling hora planets auspicious or not. Mars and Saturn horas are often called bad, but two sources call that too simple and say they are situational: good for the work they rule, poor for gentle new beginnings. The app marks them "careful", not "bad".</p>`)}
      ${sec('Common mistakes', `<ul class="hr-why"><li>Using the clock hour instead of the planetary hour. Horas do not start on the hour.</li><li>Starting the day at midnight. Before sunrise you are still in the previous Vedic day.</li><li>Treating a good hora as a guarantee, or a careful hora as a ban.</li><li>Skipping the other checks: Rahu Kalam, Choghadiya, and for big events a proper Muhurta.</li></ul>`)}
      ${sec('Hora in your own chart', `<p class="hr-p">The Hora chart (D2) splits each sign into two halves for the Sun and the Moon and is read for wealth. The Hora Lagna is a special ascendant that moves fast and is also read for wealth. Open them here:</p><div class="hr-acts"><button type="button" class="hr-ac" data-go="panel-vargas"><i>◫</i>Divisional Charts</button><button type="button" class="hr-ac" data-go="panel-lagnas"><i>✧</i>Special Lagnas</button><button type="button" class="hr-ac" data-go="panel-panchanga"><i>☼</i>Panchang</button></div>`)}
      ${sec('Sources', `<p class="hr-p">Drik Panchang (hora page), Shubh Panchang (hora page), Dekho Panchang (learn: hora) and Wikipedia (Planetary hours). The activity table keeps pairs that at least two of the three almanac pages agree on. The planet order, day and night lengths and weekday rule are the same in all of them.</p>`)}`;
  }

  /* ---------- shell ---------- */
  const TABS = [['now', 'Now'], ['today', 'Today'], ['week', 'Week'], ['best', 'Best'], ['learn', 'Learn']];
  function pane() { try { return S.tab === 'today' ? todayPane() : S.tab === 'week' ? weekPane() : S.tab === 'best' ? bestPane() : S.tab === 'learn' ? learnPane() : nowPane(); } catch (e) { console.warn('hora pane', e); return '<div class="meta-err">This part could not be built. Please refresh the page.</div>'; } }
  function render() { const b = document.getElementById('hrBody'); if (!b) return; b.classList.remove('hr-in'); b.innerHTML = pane(); void b.offsetWidth; b.classList.add('hr-in'); startTimer(); }
  function setTab(t) { S.tab = t; document.querySelectorAll('.hr-tabs button').forEach(x => { const on = x.getAttribute('data-tab') === t; x.classList.toggle('hr-on', on); x.setAttribute('aria-selected', on); }); render(); }
  function tick() {
    const el = document.getElementById('hrNow'), p = document.getElementById('panel-hora');
    if (!el || !p || !p.classList.contains('active')) { if (!el) { clearInterval(timer); timer = null; } return; }
    const end = +el.getAttribute('data-end'), jd = nowJd();
    if (jd >= end) { render(); return; }
    const L = document.getElementById('hrLeft'); if (L) L.textContent = cdText((end - jd) * 864e5);
    const arc = document.getElementById('hrArc'); if (arc && S.cur) { const C = 2 * Math.PI * 60; arc.setAttribute('stroke-dashoffset', (C * (1 - (jd - S.cur.from) / (S.cur.to - S.cur.from))).toFixed(2)); }
  }
  function startTimer() {
    const a = S.tab === 'now' ? HORA.at(nowJd(), S.loc.lat, S.loc.lon, S.loc.tz) : null; S.cur = a && a.hora ? a.hora : null;
    if (S.tab === 'now' && !timer) timer = setInterval(tick, 1000); else if (S.tab !== 'now' && timer) { clearInterval(timer); timer = null; }
  }
  function html(chart, profile) {
    S.chart = chart; S.loc = { lat: Number(profile.lat), lon: Number(profile.lon), tz: Number(profile.tz != null ? profile.tz : chart.tzOffsetHours), place: (profile.place || '').split(',')[0] };
    S.date = S.wdate = dateOf(nowJd()); S.open = S.cell = null;
    setTimeout(() => { render(); }, 0);
    return `<div class="hr"><div class="hr-banner"><span class="hr-orn" aria-hidden="true">☉</span><h3>Hora</h3><p>The planet that rules every hour of your day, with the best times for what you want to do.</p><div class="hr-pl-r"><span>Place</span><b>${esc(S.loc.place || 'your place')}</b></div></div>
      <div class="hr-tabs" role="tablist" aria-label="Hora views">${TABS.map(t => `<button type="button" role="tab" aria-selected="${t[0] === S.tab}" class="${t[0] === S.tab ? 'hr-on' : ''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div>
      <div id="hrBody" class="hr-body"></div></div>`;
  }
  function copyDay() {
    const d = HORA.dayOf(S.date, S.loc.lat, S.loc.lon, S.loc.tz); if (!d) return;
    const t = `Hora for ${dnice(d.date)} (${d.vara.name}) at ${S.loc.place}\nSunrise ${t12(d.sunrise)}, sunset ${t12(d.sunset)}\n` + d.horas.map(h => `${String(h.n).padStart(2, ' ')}. ${t12(h.from)} – ${t12(h.to)}  ${h.lord}${h.over.length ? '  (' + h.over.join(', ') + ')' : ''}`).join('\n');
    const b = document.querySelector('.hr-copy'); const done = m => { if (b) { b.textContent = m; setTimeout(() => { if (b) b.textContent = 'Copy this day as text'; }, 1800); } };
    try { navigator.clipboard.writeText(t).then(() => done('Copied'), () => done('Could not copy')); } catch (e) { done('Could not copy'); }
  }
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('#panel-hora [data-tab],#panel-hora [data-row],#panel-hora [data-day],#panel-hora [data-today],#panel-hora [data-wk],#panel-hora [data-wtoday],#panel-hora [data-cell],#panel-hora [data-act],#panel-hora [data-rng],#panel-hora [data-best],#panel-hora [data-copy],#panel-hora [data-go]'); if (!t) return;
    const g = n => t.getAttribute(n);
    if (g('data-tab')) return setTab(g('data-tab'));
    if (g('data-row')) { S.open = S.open === g('data-row') ? null : g('data-row'); const y = window.scrollY; render(); window.scrollTo(0, y); return; }
    if (g('data-day')) { S.date = addDays(S.date, +g('data-day')); S.open = null; return render(); }
    if (g('data-today')) { S.date = dateOf(nowJd()); S.open = null; return render(); }
    if (g('data-wk')) { S.wdate = addDays(S.wdate, +g('data-wk')); S.cell = null; return render(); }
    if (g('data-wtoday')) { S.wdate = dateOf(nowJd()); S.cell = null; return render(); }
    if (g('data-cell')) { S.cell = g('data-cell'); const y = window.scrollY; render(); window.scrollTo(0, y); return; }
    if (g('data-act')) { S.act = g('data-act'); const y = window.scrollY; render(); window.scrollTo(0, y); return; }
    if (g('data-rng')) { S.range = +g('data-rng'); return render(); }
    if (g('data-best')) { S.act = g('data-best'); return setTab('best'); }
    if (g('data-copy')) return copyDay();
    if (g('data-go') && typeof switchAppTab === 'function') return switchAppTab(g('data-go'));
  });
  document.addEventListener('change', e => {
    const t = e.target; if (!t.closest || !t.closest('#panel-hora')) return;
    if (t.id === 'hrDate' && t.value) { S.date = t.value; S.open = null; render(); }
    else if (t.id === 'hrShow') { S.show = t.value; const y = window.scrollY; render(); window.scrollTo(0, y); }
    else if (t.id === 'hrChart') { S.useChart = t.checked; const y = window.scrollY; render(); window.scrollTo(0, y); }
  });
  window.buildHoraPanel = function (chart, profile) { return html(chart, profile); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-hora', window.buildHoraPanel);
  const api = { html, setTab, S, render };
  window.HORAUI = api;
  return api;
})();

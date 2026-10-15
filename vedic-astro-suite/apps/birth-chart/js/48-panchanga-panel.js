/* =============================================================================
   PHASE 1 UI — Panchanga · Transits & Sade Sati · Bhava Chalit
   ============================================================================= */
function nvDate(jd, tz, withTime){
  const p = jdToLocalParts(jd, tz), [y, m, d] = p.dateStr.split('-').map(Number);
  return `${d} ${PN_MON[m - 1]} ${y}` + (withTime ? ` · ${p.timeStr.slice(0, 5)}` : '');
}
function nvTime(jd, tz, refDate){
  if (jd === null || jd === undefined) return '—';
  const p = jdToLocalParts(jd, tz); let s = p.timeStr.slice(0, 5);
  if (refDate && p.dateStr !== refDate) s += p.dateStr > refDate ? ' (+1d)' : ' (−1d)';
  return s;
}
function nvSpan(jd){ const d = Math.abs(jd), mo = d / 30.44, y = d / 365.25;
  if (y >= 1.5) return y.toFixed(1) + ' years'; if (mo >= 1.5) return Math.round(mo) + ' months'; return Math.max(1, Math.round(d)) + ' days'; }
function nvDeg(lon){ const s = getSignIndex(lon), d = getDegInSign(lon); return `${SIGNS[s].symbol} ${SIGNS[s].name} ${formatDeg(d)}`; }
function nvDur(days){ const m = Math.round(days * 1440); return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`; }

/* ---------------------------------- PANCHANGA ---------------------------------- */
let PN_CTX = null;
function buildPanchangaPanel(chart, profile){
  PN_CTX = { lat: profile.lat, lon: profile.lon, tz: profile.tz, birthDate: profile.dob, birthTime: profile.tob.slice(0, 5), place: (profile.place || '').split(',')[0], birthJD: chart.julianDay };
  setTimeout(() => pnRender(), 0);
  return `<div class="pn">
    <div class="pn-bar">
      <div class="pn-fields">
        <label>Date<input type="date" id="pnDate" value="${profile.dob}"></label>
        <label>Time<input type="time" id="pnTime" value="${profile.tob.slice(0, 5)}"></label>
      </div>
      <div class="pn-quick"><button type="button" class="on" data-pn-set="birth">At birth</button><button type="button" data-pn-set="now">Now</button></div>
    </div>
    <div id="pnBody"></div>
  </div>`;
}
function pnRender(){
  const body = document.getElementById('pnBody'); if (!body || !PN_CTX) return;
  const c = PN_CTX, ds = document.getElementById('pnDate').value, ts = document.getElementById('pnTime').value || '00:00';
  if (!ds) return;
  const [y, m, d] = ds.split('-').map(Number), [hh, mm] = ts.split(':').map(Number);
  const jd = toJulianDay(y, m, d, hh, mm, 0) - c.tz / 24;
  let P; try { P = panchangaAt(jd, c.lat, c.lon, c.tz); } catch(e){ body.innerHTML = '<div class="meta-err">Could not compute Panchanga for this moment.</div>'; console.error(e); return; }
  const ref = P.vara.date;
  const pct = (a, b) => Math.max(0, Math.min(100, (jd - a) / (b - a) * 100));
  const limb = (label, name, sub, a, b, col, extra) => `<div class="pn-limb" style="--pc:${col}">
      <small>${label}</small><b>${name}</b><span class="pn-sub">${sub}</span>
      <div class="pn-bar2"><i style="width:${pct(a, b).toFixed(1)}%"></i></div>
      <span class="pn-end">Ends ${nvTime(b, c.tz, ref)}${extra || ''}</span></div>`;
  const nk = NAKSHATRAS[P.nakshatra.num - 1];
  const limbs = [
    limb('Tithi', `${P.tithi.paksha} ${P.tithi.name}`, `${P.tithi.num} of 30 · ${P.tithi.paksha === 'Shukla' ? 'waxing' : 'waning'} Moon`, P.tithi.start, P.tithi.end, '#D4AF37'),
    `<div class="pn-limb" style="--pc:#8A6FB8"><small>Vara</small><b>${P.vara.name}</b><span class="pn-sub">${P.vara.sk} · ruled by ${P.vara.lord}</span>
      <div class="pn-bar2"><i style="width:${P.nextSunrise && P.sunrise ? pct(P.sunrise, P.nextSunrise).toFixed(1) : 0}%"></i></div><span class="pn-end">Until sunrise ${nvTime(P.nextSunrise, c.tz, ref)}</span></div>`,
    limb('Nakshatra', P.nakshatra.name, `Pada ${P.nakshatra.pada} · lord ${nk.lord}`, P.nakshatra.start, P.nakshatra.end, '#5EC4B7'),
    limb('Yoga', P.yoga.name, `${P.yoga.num} of 27`, P.yoga.start, P.yoga.end, '#E0A64A'),
    limb('Karana', P.karana.name, P.karana.vishti ? 'Vishti (Bhadra) — see note' : 'Half of a tithi', P.karana.start, P.karana.end, P.karana.vishti ? '#C95050' : '#6B7FA3')
  ].join('');

  const facts = [
    ['Sunrise', nvTime(P.sunrise, c.tz, ref)], ['Sunset', nvTime(P.sunset, c.tz, ref)],
    ['Day length', P.dayLength ? nvDur(P.dayLength) : '—'], ['Hora now', P.hora ? `${PLANET_GLYPHS[P.hora]} ${P.hora}` : '—'],
    ['Moon sign', `${SIGNS[P.moonSign].symbol} ${SIGNS[P.moonSign].name}`], ['Sun sign', `${SIGNS[P.sunSign].symbol} ${SIGNS[P.sunSign].name}`]
  ].map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('');

  const calChips = `<span>🌙 ${P.masa.adhika ? 'Adhika ' : ''}${P.masa.name} <em>(Amanta)</em></span><span>📅 Shaka ${P.masa.shaka}</span><span>☀ ${P.ayana}</span><span>🌑 New moon ${nvDate(P.masa.newMoonPrev, c.tz)}</span><span>🌑 Next ${nvDate(P.masa.newMoonNext, c.tz)}</span>`;

  let day = '';
  if (P.rahu){
    const dl = P.sunset - P.sunrise, pos = t => ((t - P.sunrise) / dl * 100);
    const segs = [['Abhijit', P.abhijit, '#5EC4B7', 'Auspicious'], ['Rahu Kalam', P.rahu, '#C95050', 'Avoid new starts'], ['Yamaganda', P.yama, '#E0A64A', 'Inauspicious'], ['Gulika Kalam', P.gulika, '#8A6FB8', 'Inauspicious']];
    const marks = segs.map(([n, r, col]) => `<i title="${n}" style="left:${pos(r[0]).toFixed(2)}%;width:${((r[1] - r[0]) / dl * 100).toFixed(2)}%;background:${col}"></i>`).join('');
    const now = jd >= P.sunrise && jd <= P.sunset ? `<u style="left:${pos(jd).toFixed(2)}%"></u>` : '';
    const rows = segs.map(([n, r, col, tag]) => `<div class="pn-prow" style="--pc:${col}"><span class="pn-dot"></span><b>${n}</b><span>${nvTime(r[0], c.tz, ref)} – ${nvTime(r[1], c.tz, ref)}</span><em>${tag}</em></div>`).join('') +
      `<div class="pn-prow" style="--pc:#6B7FA3"><span class="pn-dot"></span><b>Brahma Muhurta</b><span>${nvTime(P.brahma[0], c.tz, ref)} – ${nvTime(P.brahma[1], c.tz, ref)}</span><em>Before sunrise</em></div>`;
    day = `<div class="pn-sec"><h5>Day timeline <span>sunrise → sunset · ${P.vara.name}</span></h5>
      <div class="pn-track">${marks}${now}</div>
      <div class="pn-tl"><span>${nvTime(P.sunrise, c.tz, ref)}</span><span>Midday</span><span>${nvTime(P.sunset, c.tz, ref)}</span></div>
      <div class="pn-plist">${rows}</div></div>`;
  } else day = `<div class="pn-sec"><div class="pl-empty">The Sun does not rise and set normally at this latitude and date, so day-based timings are unavailable.</div></div>`;

  body.innerHTML = `<div class="pn-for">Computed for <b>${nvDate(jd, c.tz, true)}</b> · ${escapeHtml(c.place)} · ${fmtTz(c.tz)}</div>
    <div class="pn-limbs">${limbs}</div>
    <div class="pn-facts">${facts}</div>
    <div class="pn-chips">${calChips}</div>
    ${day}
    <div class="pn-note">Vedic day runs sunrise to sunrise, so births before sunrise take the previous weekday. Sunrise uses the upper limb with standard refraction (−0.833°). Lunar month is the Amanta (new-moon to new-moon) system; Purnimanta calendars name the Krishna fortnight one month later. Vishti karana is traditionally avoided for new beginnings.</div>`;
}
document.addEventListener('input', (e) => { if (e.target.id === 'pnDate' || e.target.id === 'pnTime') { document.querySelectorAll('[data-pn-set]').forEach(b => b.classList.remove('on')); pnRender(); } });
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-pn-set]'); if (!b || !PN_CTX) return;
  document.querySelectorAll('[data-pn-set]').forEach(x => x.classList.toggle('on', x === b));
  if (b.dataset.pnSet === 'birth'){ document.getElementById('pnDate').value = PN_CTX.birthDate; document.getElementById('pnTime').value = PN_CTX.birthTime; }
  else { const p = jdToLocalParts(nowJulianDay(), PN_CTX.tz); document.getElementById('pnDate').value = p.dateStr; document.getElementById('pnTime').value = p.timeStr.slice(0, 5); }
  pnRender();
});


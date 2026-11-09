/* Monthly Panchang calendar (js/146): a month grid with, for each day, the tithi and nakshatra at sunrise, paksha, Ekadashi, Purnima, Amavasya, Sankranti, festivals and eclipses.
   No new astrology rules: it REUSES the Date Finder engine (js/27-28): DF_FEST festival rules, dfLunarHit/dfFestHits logic through dfInfo, the sunrise-to-sunrise day,
   the syzygy and lunar-month code (Amanta; the Purnimanta setting names the dark half one month later, as dfInfo does), and the eclipse test (new moon with |Moon latitude| < 1.55 degrees = solar,
   full moon with < 1.0 degrees = lunar; a solar or lunar eclipse "somewhere on Earth", not necessarily visible from the chosen place).
   Day = sunrise to next sunrise at the chosen place; tithi and nakshatra shown are those running at sunrise. Ekadashi means the 11th tithi at sunrise (the Smarta/Vaishnava
   difference when Dashami overlaps is not handled; drikpanchang lists a second "Gauna" date in such years). Festivals are the nationwide set in DF_FEST, as the Date Finder lists them.
   Sankranti: the day the Sun enters a sidereal sign (after sunset counts as the next day, as in js/28).
   Checked against drikpanchang.com (New Delhi, 2026) and NASA eclipse dates; see docs/ASTRO_FEATURES_PLAN.md A12 Notes for the comparison and any differences.
   Only a window of about 110 days is calculated per month (about 0.1 s); results are cached per month. Classes pcal- prefixed. Facts only. */
const PCAL = (() => {
  const PAD = 40;
  const cache = {};
  /* build the same arrays dfGen builds, for [month start - PAD, month end + PAD] */
  function buildCtx(y, m, lat, lon, tz, purn) {
    const base = Date.UTC(y, m - 1, 1) - PAD * 864e5, dim = new Date(Date.UTC(y, m, 0)).getUTCDate(), n = dim + 2 * PAD, N2 = n + 2;
    const dt = i => { const d = new Date(base + i * 864e5); return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCDay()]; };
    const srj = new Float64Array(N2), T = new Int8Array(N2), NK = new Int8Array(N2), MS = new Int8Array(N2), SUN = new Int8Array(N2);
    for (let i = 0; i < N2; i++) {
      const [yy, mm, dd] = dt(i), t = dfSunrise(yy, mm, dd, lat, lon, tz); srj[i] = t;
      T[i] = Math.min(29, Math.floor(pnDiff(t) / 12));
      const ml = pnMoon(t); NK[i] = Math.floor(ml / PN_NAK) % 27; MS[i] = getSignIndex(ml); SUN[i] = dfSunSign(t);
    }
    const sy = dfSyz(srj[0], srj[N2 - 1]), months = dfMonths(sy), ecl = dfEclipses(sy);
    const MI = new Int8Array(N2), ADH = new Uint8Array(N2), SAM = new Int8Array(N2);
    for (let i = 0; i < N2; i++) {
      const mo = dfMonthAt(months, srj[i]); MI[i] = mo ? mo.mi : 0; ADH[i] = mo && mo.adhika ? 1 : 0;
      const [yy, mm] = dt(i), Y = (mm <= 4 && MI[i] >= 8) ? yy - 1 : yy; SAM[i] = (((Y - 2024 + 37) % 60) + 60) % 60;
    }
    const SAT = dfSlow('Saturn', srj, N2), JUP = dfSlow('Jupiter', srj, N2), RAH = dfSlow('Rahu', srj, N2);
    const eclS = new Uint8Array(n), eclL = new Uint8Array(n);
    ecl.forEach(e => { const p = jdToLocalParts(e.jd, tz).dateStr.split('-').map(Number), idx = Math.round((Date.UTC(p[0], p[1] - 1, p[2]) - base) / 864e5); if (idx >= 0 && idx < n) (e.kind === 'solar' ? eclS : eclL)[idx] = 1; });
    return { q: { purn: !!purn }, n, base, srj, T, NK, MS, SUN, MI, ADH, SAM, SAT, JUP, RAH, months, ecl, eclS, eclL, dt };
  }
  /* day index i is the day the Sun enters sign s (same rule as js/28 'S' festivals) */
  function sankrantiAt(ctx, i) {
    const { srj, SUN } = ctx;
    for (const j of [i, i - 1]) {
      if (j < 0 || SUN[j] === SUN[j + 1]) continue;
      const s = SUN[j + 1]; let a = srj[j], b = srj[j + 1];
      for (let k = 0; k < 30; k++) { const mm = (a + b) / 2; if (dfSunSign(mm) === s) b = mm; else a = mm; }
      if (((b >= srj[j] + 0.5) ? j + 1 : j) === i) return s;
    }
    return null;
  }
  /* A festival tithi can start after one sunrise and end before the next, so it is never "at sunrise". The Date Finder rules then find nothing, and
     published panchangs keep the festival on the day the tithi begins (2026: Ugadi, Akshaya Tritiya, Dev Uthani Ekadashi). This page does the same, only when the
     Date Finder rule gives no day within two days either side. */
  const FRAGILE = ['holika', 'holi', 'rakhi', 'mahanavami', 'dussehra', 'onam'];       /* days that published panchangs set with Bhadra / Pradosh / nakshatra rules this page does not apply, or that this page lists on two days */
  function fallbackHit(ctx, f, i) {
    if (f[2] !== 'L' || f[6]) return false;
    const tgt = f[4] - 1;
    const mid = tgt * 12 + 6, g = t => ((pnDiff(t) - mid + 540) % 360) - 180;
    /* the month is taken at the middle of the tithi, so a Pratipada after a new moon belongs to the new month and an Amavasya before it to the old one */
    const act = j => {
      if (j < 0 || j + 1 >= ctx.srj.length) return false; if (!dfIn(ctx.T[j], ctx.T[j + 1], tgt, 30)) return false;
      let a = ctx.srj[j], b = ctx.srj[j + 1]; if (g(a) > 0 || g(b) < 0) return false;
      for (let k = 0; k < 30; k++) { const c = (a + b) / 2; if (g(c) < 0) a = c; else b = c; }
      const mo = dfMonthAt(ctx.months, (a + b) / 2); return !!(mo && mo.mi === f[3] && !mo.adhika);
    };
    if (!act(i) || act(i - 1)) return false;
    for (let o = -2; o <= 2; o++) if (i + o >= 0 && i + o < ctx.n && dfLunarHit(ctx, f, i + o)) return false;
    return true;
  }
  function month(y, m, lat, lon, tz, purn) {
    const key = [y, m, lat, lon, tz, purn ? 1 : 0].join('|'); if (cache[key]) return cache[key];
    const ctx = buildCtx(y, m, lat, lon, tz, purn), dim = new Date(Date.UTC(y, m, 0)).getUTCDate(), days = [];
    for (let d = 1; d <= dim; d++) {
      const i = PAD + d - 1, info = dfInfo(ctx, i), t = ctx.T[i], k = t % 15;
      const sk = sankrantiAt(ctx, i), fests = info.fests.slice(); let fragile = false, begins = false;
      DF_FEST.forEach(f => { if (fallbackHit(ctx, f, i)) { fests.push(f[1]); begins = true; } if (FRAGILE.includes(f[0]) && info.fests.includes(f[1])) fragile = true; });
      const tithiNum = k + 1;
      days.push({
        y, m, d, wd: info.wd, tithiIdx: t, tithi: info.tithi, tithiNum, paksha: t < 15 ? 'Shukla' : 'Krishna', nak: info.nak, moonSign: info.moonSign.name,
        masa: info.masa, adhika: info.adhika, sam: info.sam,
        ekadashi: tithiNum === 11, purnima: t === 14, amavasya: t === 29, sankranti: sk === null ? null : SIGNS[sk].name,
        fests, fragile, begins, solar: !!ctx.eclS[i], lunar: !!ctx.eclL[i], sunrise: ctx.srj[i]
      });
    }
    cache[key] = days; return days;
  }
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- screen ---------- */
  const ST = { y: 2026, m: 1, sel: 1, purn: false };
  function place(profile) {
    const lat = Number(profile && profile.lat), lon = Number(profile && profile.lon);
    const tz = Number(profile && profile.tz != null ? profile.tz : (typeof currentChartForModal !== 'undefined' && currentChartForModal ? currentChartForModal.tzOffsetHours : 5.5));
    return { lat: isFinite(lat) ? lat : 28.6139, lon: isFinite(lon) ? lon : 77.209, tz: isFinite(tz) ? tz : 5.5, name: (profile && profile.place) || 'your birth place' };
  }
  function marks(x) {
    const o = [];
    if (x.fests.length) o.push('<i class="pcal-d f" title="Festival"></i>');
    if (x.ekadashi) o.push('<i class="pcal-d e" title="Ekadashi"></i>');
    if (x.purnima) o.push('<i class="pcal-d p" title="Purnima"></i>');
    if (x.amavasya) o.push('<i class="pcal-d a" title="Amavasya"></i>');
    if (x.sankranti) o.push('<i class="pcal-d s" title="Sankranti"></i>');
    if (x.solar || x.lunar) o.push('<i class="pcal-d x" title="Eclipse"></i>');
    return o.join('');
  }
  function grid(days) {
    const lead = days[0].wd, cells = [];
    for (let k = 0; k < lead; k++) cells.push('<span class="pcal-c off"></span>');
    const now = new Date(), isCur = now.getFullYear() === ST.y && now.getMonth() + 1 === ST.m;
    days.forEach(x => cells.push(`<button type="button" class="pcal-c${x.d === ST.sel ? ' sel' : ''}${isCur && x.d === now.getDate() ? ' today' : ''}" data-pcal="day" data-d="${x.d}" aria-label="${x.d} ${MONTHS[ST.m - 1]}: ${esc(x.tithi)}, ${esc(x.nak)}"><b>${x.d}</b><small>${x.paksha === 'Shukla' ? 'S' : 'K'}${x.tithiNum}</small><span class="pcal-ds">${marks(x)}</span></button>`));
    return `<div class="pcal-wd">${WD.map(w => `<span>${w}</span>`).join('')}</div><div class="pcal-g">${cells.join('')}</div>`;
  }
  function detail(x, pl) {
    const rows = [];
    rows.push(`<li><b>Tithi at sunrise</b> ${esc(x.tithi)} (${x.paksha === 'Shukla' ? 'waxing' : 'waning'})</li>`, `<li><b>Nakshatra at sunrise</b> ${esc(x.nak)}</li>`, `<li><b>Moon</b> in ${esc(x.moonSign)}</li>`,
      `<li><b>Lunar month</b> ${esc(x.masa)}${x.adhika ? ' (Adhika, the extra month)' : ''}</li>`);
    if (x.ekadashi) rows.push('<li><b>Ekadashi</b> the 11th tithi is running at sunrise</li>');
    if (x.purnima) rows.push('<li><b>Purnima</b> full moon day</li>'); if (x.amavasya) rows.push('<li><b>Amavasya</b> new moon day</li>');
    if (x.sankranti) rows.push(`<li><b>Sankranti</b> the Sun enters ${esc(x.sankranti)}</li>`);
    x.fests.forEach(f => rows.push(`<li class="pcal-fe"><b>Festival</b> ${esc(f)}</li>`));
    if (x.fests.length && x.fragile) rows.push('<li class="pcal-fn">Published panchangs set this festival with extra rules (Bhadra, Pradosh, the time of day) that this page does not apply, so they can keep it one day away from here, or on one of two days. Check your local panchang.</li>');
    if (x.fests.length && x.begins) rows.push('<li class="pcal-fn">The festival tithi begins today after sunrise and ends before the next sunrise, so today is shown, as published panchangs do.</li>');
    if (x.solar) rows.push('<li class="pcal-ec"><b>Solar eclipse</b> somewhere on Earth; check a local source for visibility from your place</li>');
    if (x.lunar) rows.push('<li class="pcal-ec"><b>Lunar eclipse</b> somewhere on Earth; check a local source for visibility from your place</li>');
    return `<div class="pcal-det"><h4>${WD[x.wd]} ${x.d} ${MONTHS[x.m - 1]} ${x.y}</h4><ul>${rows.join('')}</ul><button type="button" class="pcal-open" data-pcal="open">Open full Panchanga for this day</button></div>`;
  }
  function legend() { return '<div class="pcal-leg"><span><i class="pcal-d f"></i>Festival</span><span><i class="pcal-d e"></i>Ekadashi</span><span><i class="pcal-d p"></i>Purnima</span><span><i class="pcal-d a"></i>Amavasya</span><span><i class="pcal-d s"></i>Sankranti</span><span><i class="pcal-d x"></i>Eclipse</span></div>'; }
  function body(profile) {
    const pl = place(profile); let days; try { days = month(ST.y, ST.m, pl.lat, pl.lon, pl.tz, ST.purn); } catch (e) { return '<p class="pcal-err">Could not work out this month.</p>'; }
    if (ST.sel > days.length) ST.sel = days.length;
    const mn = {}; days.forEach(x => { mn[x.masa + (x.adhika ? ' (Adhika)' : '')] = 1; });
    return `<div class="pcal-sub">${Object.keys(mn).map(esc).join(' · ')} · sunrise at ${esc(pl.name)}</div>${grid(days)}${legend()}${detail(days[ST.sel - 1], pl)}`;
  }
  function html(chart, profile) {
    return `<div class="pcal"><div class="pcal-hero"><h3>Panchang Calendar</h3><p>A month at a glance: tithi, nakshatra, Ekadashi, full and new moons, Sankranti, festivals and eclipses. Tap a day for the details.</p></div>
      <div class="pcal-nav"><button type="button" data-pcal="prev" aria-label="Previous month">‹</button><b id="pcalTitle">${MONTHS[ST.m - 1]} ${ST.y}</b><button type="button" data-pcal="next" aria-label="Next month">›</button><button type="button" data-pcal="today" class="pcal-now">Today</button></div>
      <label class="pcal-tg"><input type="checkbox" id="pcalPurn"${ST.purn ? ' checked' : ''}> Purnimanta month names (North India)</label>
      <div id="pcalBody">${body(profile)}</div>
      <details class="pcal-note"><summary>How this is worked out</summary>
        <p>Each day runs from sunrise to the next sunrise at your birth place. The tithi and nakshatra shown are the ones running at sunrise. Month names are Amanta (the month ends at the new moon) unless you tick Purnimanta, which names the waning half one month later.</p>
        <p>Festivals use the same nationwide list and rules as the Date Finder. Where two traditions keep a festival on different days, this page shows one day, so check your local panchang for a family observance. Ekadashi means the 11th tithi is running at sunrise; some traditions move it a day when the 10th overlaps.</p>
        <p>Eclipses are the new or full moons at which the Moon is close enough to the Sun's path. They are eclipses somewhere on Earth, so visibility from your place needs a local source.</p>
        <p>The numbers are calculated for the sidereal zodiac with the app's ephemeris. They were compared with drikpanchang.com for New Delhi and with NASA's eclipse dates for 2026.</p>
      </details></div>`;
  }
  function text(chart, profile) {
    const pl = place(profile), days = month(ST.y, ST.m, pl.lat, pl.lon, pl.tz, ST.purn);
    return `Panchang ${MONTHS[ST.m - 1]} ${ST.y}: ` + days.filter(x => x.fests.length || x.ekadashi || x.purnima || x.amavasya || x.solar || x.lunar).map(x => `${x.d} ${[].concat(x.fests, x.ekadashi ? 'Ekadashi' : [], x.purnima ? 'Purnima' : [], x.amavasya ? 'Amavasya' : [], x.solar ? 'Solar eclipse' : [], x.lunar ? 'Lunar eclipse' : []).join(', ')}`).join('; ');
  }
  function bind() {
    const prof = () => window.__vgProf || {};
    const redraw = root => { root.querySelector('#pcalTitle').textContent = MONTHS[ST.m - 1] + ' ' + ST.y; root.querySelector('#pcalBody').innerHTML = body(prof()); };
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-pcal]'); if (!b) return; const root = b.closest('.pcal'); if (!root) return;
      const a = b.dataset.pcal;
      if (a === 'prev' || a === 'next') { ST.m += a === 'next' ? 1 : -1; if (ST.m < 1) { ST.m = 12; ST.y--; } if (ST.m > 12) { ST.m = 1; ST.y++; } ST.sel = 1; }
      else if (a === 'today') { const n = new Date(); ST.y = n.getFullYear(); ST.m = n.getMonth() + 1; ST.sel = n.getDate(); }
      else if (a === 'day') ST.sel = parseInt(b.dataset.d, 10);
      else if (a === 'open') {
        const go = document.querySelector('#panel-home [data-go=panel-panchanga]'); if (go) go.click();
        setTimeout(() => { const d = document.getElementById('pnDate'), t = document.getElementById('pnTime'); if (!d) return; d.value = `${ST.y}-${String(ST.m).padStart(2, '0')}-${String(ST.sel).padStart(2, '0')}`; if (t) t.value = '12:00'; d.dispatchEvent(new Event('input', { bubbles: true })); }, 250);
        return;
      }
      redraw(root);
    });
    document.addEventListener('change', e => { if (e.target.id !== 'pcalPurn') return; const root = e.target.closest('.pcal'); if (!root) return; ST.purn = e.target.checked; redraw(root); });
  }
  if (typeof document !== 'undefined' && document.addEventListener) bind();
  window.buildPanchangCalendarPanel = function (chart, profile) { const n = new Date(); ST.y = n.getFullYear(); ST.m = n.getMonth() + 1; ST.sel = n.getDate(); ST.purn = false; return html(chart, profile || window.__vgProf || {}); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-pcal', window.buildPanchangCalendarPanel);
  return { month, buildCtx, sankrantiAt, html, text, place, MONTHS, state: ST, PAD };
})();

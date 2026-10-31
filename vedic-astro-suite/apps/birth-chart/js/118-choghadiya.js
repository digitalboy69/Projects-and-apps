/* ============================================================================
   CHOGHADIYA (CHG): the daily "good and bad time" slots used all over India. The daytime (sunrise to sunset) and the night (sunset to next sunrise) are each cut
   into 8 equal parts; every part has one of 7 names, always in the same order, and the first name depends on the weekday.
   Day order   : Udveg, Chal, Labh, Amrit, Kaal, Shubh, Rog      first part: Sun Udveg, Mon Amrit, Tue Rog, Wed Labh, Thu Shubh, Fri Chal, Sat Kaal
   Night order : Shubh, Amrit, Chal, Rog, Kaal, Labh, Udveg      first part: Sun Shubh, Mon Chal, Tue Kaal, Wed Udveg, Thu Amrit, Fri Rog, Sat Labh
   (the 8th part of each run repeats the 1st name). This is a popular almanac practice (panchang tables), not from the BPHS, and it is marked so on screen.
   Uses the Panchanga result P from panchangaAt() (js/45): P.sunrise, P.sunset, P.nextSunrise, P.vara.idx (0 = Sunday).
   API: CHG.parts(P) -> {day:[{name,from,to,tone}], night:[...]} | null ; CHG.html(P, c, jd, ref) -> HTML section (uses nvTime from js/48).
   ============================================================================ */
const CHG = (function(){
  const DAYO = ['Udveg','Chal','Labh','Amrit','Kaal','Shubh','Rog'], NIGHTO = ['Shubh','Amrit','Chal','Rog','Kaal','Labh','Udveg'];
  const DAYS = [0,3,6,2,5,1,4], NIGHTS = [0,2,4,6,1,3,5];   // start index in DAYO / NIGHTO for Sun..Sat
  const INFO = {
    Amrit:['good','Best slot. Good for almost anything: starting work, learning, travel, buying.'],
    Shubh:['good','Auspicious. Good for ceremonies, new work, meeting elders and teachers.'],
    Labh:['good','Gain. Good for business, trade, money matters and study.'],
    Chal:['mid','Moving. Fine for travel and quick errands; not for things that must stay fixed.'],
    Udveg:['bad','Restless. Said to suit government or authority matters; avoid starting anything peaceful.'],
    Rog:['bad','Illness. Avoid new work, medical decisions and travel if you can.'],
    Kaal:['bad','Loss. Avoid new work, deals and journeys.']
  };
  function parts(P){
    if (!P || P.sunrise == null || P.sunset == null) return null;
    const w = P.vara.idx, mk = (from, to, order, st) => { const l = (to - from) / 8; return Array.from({length: 8}, (_, i) => { const name = order[(st + i) % 7]; return { name, from: from + i * l, to: from + (i + 1) * l, tone: INFO[name][0] }; }); };
    return { day: mk(P.sunrise, P.sunset, DAYO, DAYS[w]), night: P.nextSunrise != null ? mk(P.sunset, P.nextSunrise, NIGHTO, NIGHTS[w]) : null };
  }
  function html(P, c, jd, ref){
    const ps = parts(P); if (!ps) return '';
    const row = r => { const now = jd >= r.from && jd < r.to;
      return `<div class="chg-r ${r.tone}${now ? ' now' : ''}"><b>${r.name}</b><span>${nvTime(r.from, c.tz, ref)} – ${nvTime(r.to, c.tz, ref)}</span><em>${now ? 'now' : ({good:'good',mid:'so-so',bad:'avoid'})[r.tone]}</em></div>`; };
    const grid = (t, a) => a ? `<div class="chg-col"><h6>${t}</h6>${a.map(row).join('')}</div>` : '';
    const keys = Object.keys(INFO).map(k => `<div><b class="${INFO[k][0]}">${k}</b> ${INFO[k][1]}</div>`).join('');
    return `<div class="pn-sec chg"><h5>Choghadiya <span>8 day slots · 8 night slots · ${P.vara.name}</span></h5>
      <div class="chg-grid">${grid('Day', ps.day)}${grid('Night', ps.night)}</div>
      <details class="chg-d"><summary>What each name means</summary><div class="chg-keys">${keys}</div>
        <p class="pn-note">Choghadiya is a popular almanac practice, not a rule from Parashara. Many families prefer Abhijit Muhurta and avoid Rahu Kalam on top of it. Use it as guidance.</p></details></div>`;
  }
  /* standalone panel: pick a date and time, see the slots for the birth place */
  function panel(chart, profile){
    const tz = Number(profile.tz != null ? profile.tz : chart.tzOffsetHours), now = jdToLocalParts(Date.now() / 86400000 + 2440587.5, tz);
    return `<div class="chgp"><div class="avk-intro">Today's good and bad time slots for <b>${escapeHtml(profile.place || 'your place')}</b>. Change the date or time to see another day.</div>
      <div class="chgp-in"><label>Date <input type="date" id="chgDate" value="${now.dateStr}"></label><label>Time <input type="time" id="chgTime" value="${now.timeStr.slice(0, 5)}"></label>
      <button type="button" id="chgNow" class="chgp-btn">Now</button></div><div id="chgBody"></div></div>`;
  }
  function draw(){
    const b = document.getElementById('chgBody'); if (!b) return;
    const pf = window.__vgProf, ch = (typeof currentChartForModal !== 'undefined') ? currentChartForModal : null; if (!pf || !ch) return;
    const tz = Number(pf.tz != null ? pf.tz : ch.tzOffsetHours), lat = Number(pf.lat), lon = Number(pf.lon);
    const ds = document.getElementById('chgDate').value, ts = document.getElementById('chgTime').value || '12:00'; if (!ds) return;
    const [y, m, d] = ds.split('-').map(Number), [hh, mm] = ts.split(':').map(Number), jd = toJulianDay(y, m, d, hh, mm, 0) - tz / 24;
    try { const P = panchangaAt(jd, lat, lon, tz), h = html(P, { tz }, jd, P.vara.date);
      b.innerHTML = h || '<div class="pl-empty">The Sun does not rise and set normally at this place and date, so Choghadiya cannot be worked out.</div>'; }
    catch(e){ b.innerHTML = '<div class="meta-err">Could not work out Choghadiya for this moment.</div>'; console.warn(e); }
  }
  document.addEventListener('input', e => { if (e.target.id === 'chgDate' || e.target.id === 'chgTime') draw(); });
  document.addEventListener('click', e => {
    if (e.target.id !== 'chgNow') return; const pf = window.__vgProf; if (!pf) return;
    const tz = Number(pf.tz != null ? pf.tz : 0), n = jdToLocalParts(Date.now() / 86400000 + 2440587.5, tz);
    document.getElementById('chgDate').value = n.dateStr; document.getElementById('chgTime').value = n.timeStr.slice(0, 5); draw();
  });
  window.buildChoghadiyaPanel = function(chart, profile){ setTimeout(draw, 0); return panel(chart, profile); };
  const _sw = window.switchAppTab; if (typeof _sw === 'function' && !window.__chgSw){ window.__chgSw = 1; window.switchAppTab = function(id){ const r = _sw.apply(this, arguments); if (id === 'panel-choghadiya') setTimeout(draw, 30); return r; }; }
  return { parts, html, info: INFO, draw };
})();

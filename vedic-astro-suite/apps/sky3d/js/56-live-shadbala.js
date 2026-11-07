/* ============================================================================
   LIVE SHADBALA (planet window, Strength tab): six-fold strength of the 7 planets (Sun to Saturn) at the 3D time and the viewer's place.
   Engine: js/55-live-shadbala-engine.js (a copy of the Birth Chart engine). Place: getLiveLoc() (js/17), the same place used for the Rising sign.
   Adds a Shadbala block at the top of the Strength tab and a strength badge under the planet name, by wrapping openPlanetDetail (js/29).
   API: SHB.live(jd) -> {planets, rank, dinaLord, horaLord, place, approx, jd} | null ; SHB.html(name, jd) ; SHB.badge(name, jd).
   ============================================================================ */
const SHB = (function(){
  const E = SHB_ENGINE, PL = E.BALA_PLANETS, esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const browserTz = jd => -new Date((jd - 2440587.5) * 86400000).getTimezoneOffset() / 60;
  const solarDay = (jd, lon, lat) => {            // sunrise and sunset of the solar-local day that holds jd (same rule as the Birth Chart)
    const tzs = lon / 15, d = new Date((jd + tzs / 24 - 2440587.5) * 86400000);
    const rs = GK.riseSet(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), lat, lon, tzs);
    return rs.rise != null && rs.set != null ? { sunriseJD: rs.rise, sunsetJD: rs.set } : null;
  };
  const speedOf = (name, jd) => { let d = siderealLongitude(name, jd + 0.5) - siderealLongitude(name, jd - 0.5); if (d > 180) d -= 360; if (d < -180) d += 360; return d; };
  function compute(jd, lat, lon, tz){
    const t0 = solarDay(jd, lon, lat), t1 = solarDay(jd + 1, lon, lat); if (!t0 || !t1) return null;
    const sid = {}, planets = {}, asc = getSignIndex(siderealAscendant(jd, lat, lon));
    PL.forEach(n => { sid[n] = siderealLongitude(n, jd); });
    PL.forEach(n => { const s = getSignIndex(sid[n]); planets[n] = { sign:s, degInSign:normDeg(sid[n]) % 30, house:((s - asc + 12) % 12) + 1, speed:speedOf(n, jd) }; });
    const day = jd >= t0.sunriseJD && jd < t0.sunsetJD, hour = (((jd + 0.5) % 1) * 24 + tz + 24) % 24, wd = (Math.floor(jd + 0.5 + tz / 24) + 1) % 7;
    const r = E.computeShadbala(sid, planets, asc, jd, jd + tz / 24, hour, day, t0.sunriseJD, t0.sunsetJD, t1.sunriseJD, wd);
    const rank = PL.slice().sort((a, b) => r.planets[b].percentOfRequired - r.planets[a].percentOfRequired);
    return { planets:r.planets, rank, dinaLord:r.dinaLord, horaLord:r.horaLord, asc, isDay:day, house:Object.fromEntries(PL.map(n => [n, planets[n].house])) };
  }
  let memo = null;
  function live(jd){
    const L = getLiveLoc(), k = [Math.round(jd * 1440), L.lat, L.lon].join('|');
    if (memo && memo.k === k) return memo.v;
    let v = null; try { v = compute(jd, L.lat, L.lon, browserTz(jd)); } catch(e){ console.warn('shadbala', e); }
    if (v){ v.place = L.label; v.approx = !!L.approx; v.jd = jd; }
    memo = { k, v }; return v;
  }
  const r2 = x => (x / 60).toFixed(2), r1 = x => (x / 60).toFixed(1), sg = x => (x >= 0 ? '+' : '') + (x / 60).toFixed(2);
  const SIX = [['sthana','Sthana','Place: sign, dignity and house', s => s.sthanaBala.total], ['dig','Dig','Direction: where it stands in the chart', s => s.digBala], ['kala','Kala','Time: day or night, phase, hour and season', s => s.kalaBala.total],
    ['chesta','Cheshta','Motion: speed and retrograde', s => s.chestaBala], ['nais','Naisargika','Natural strength, fixed for each planet', s => s.naisargikaBala], ['drik','Drik','Aspects it receives', s => s.drikBala]];
  const DETAIL = [['Sthana bala', s => [['Uchcha (exaltation)', s.sthanaBala.uchcha], ['Saptavargaja (7 charts)', s.sthanaBala.saptavargaja], ['Oja-yugma (odd or even)', s.sthanaBala.ojaYugma], ['Kendradi (angles)', s.sthanaBala.kendradi], ['Drekkana', s.sthanaBala.drekkana]]],
    ['Kala bala', s => [['Natonnata (day or night)', s.kalaBala.nathonnata], ['Paksha (Moon phase)', s.kalaBala.paksha], ['Tribhaga (third of day)', s.kalaBala.tribhaga], ['Year, month, day, hour lord', s.kalaBala.vmdh], ['Ayana (declination)', s.kalaBala.ayana]]]];
  function ring(pct, ok){
    const R = 54, C = 2 * Math.PI * R, f = Math.min(1, pct / 100), off = C * (1 - f), mk = C * 0;
    return `<svg class="shb-ring" viewBox="0 0 132 132" aria-hidden="true"><defs><linearGradient id="shbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ok ? '#6EE7B7' : '#FFB36B'}"/><stop offset="1" stop-color="${ok ? '#38BDF8' : '#FF6B4A'}"/></linearGradient></defs>
      <circle cx="66" cy="66" r="${R}" class="shb-trk"/><circle cx="66" cy="66" r="${R}" class="shb-arc" stroke="url(#shbg)" stroke-dasharray="${C.toFixed(1)}" style="--full:${C.toFixed(1)};--off:${off.toFixed(1)}" transform="rotate(-90 66 66)"/>
      <circle cx="66" cy="12" r="3.2" class="shb-tick"/></svg>`;
  }
  function badge(name, jd){
    const v = live(jd); if (!v || !v.planets[name]) return '';
    const s = v.planets[name];
    return `<button type="button" class="pdx-badge shb-badge ${s.isStrong ? 'good' : 'bad'}" onclick="shbGoto(this)" title="Open Shadbala">⚖ ${s.totalRupas.toFixed(2)} / ${s.requiredRupas} rupas</button>`;
  }
  function html(name, jd){
    const v = live(jd), head = (live2 = '') => `<div class="shb-hd"><div class="pdx-h">Shadbala · strength</div>${live2}</div>`;
    if (!PL.includes(name)) return `<section class="shb" id="shbBox">${head()}<div class="pdx-card"><div class="v">Shadbala is for the seven planets, Sun to Saturn</div><div class="s">${name} has no Shadbala in the classical texts. See its sign, motion and dignity below.</div></div></section>`;
    if (!v) return `<section class="shb" id="shbBox">${head()}<div class="pdx-card"><div class="v">Not available here</div><div class="s">Shadbala needs sunrise and sunset. The Sun does not rise or set on this day at ${esc(getLiveLoc().label)}. Change the place or the date.</div></div></section>`;
    const s = v.planets[name], pct = Math.round(s.percentOfRequired), pos = v.rank.indexOf(name) + 1, ok = s.isStrong;
    const nowMs = Date.now() / 86400000 + 2440587.5, isNow = Math.abs(jd - nowMs) < 0.003;
    const maxOf = f => Math.max(1, ...PL.map(n => Math.abs(f(v.planets[n]))));
    const six = SIX.map((c, i) => { const val = c[3](s), w = Math.min(100, Math.abs(val) / maxOf(c[3]) * 100);
      return `<div class="shb-row pdx-in" style="--i:${i + 1}"><div class="shb-n"><b>${c[1]}</b><small>${c[2]}</small></div><div class="shb-bar"><i class="${val < 0 ? 'neg' : ''}" style="--w:${w.toFixed(0)}%"></i></div><div class="shb-v">${c[0] === 'drik' ? sg(val) : r2(val)}</div></div>`; }).join('');
    const det = DETAIL.map(d => `<details class="shb-det"><summary>${d[0]}<b>${r2(d[0].startsWith('Sthana') ? s.sthanaBala.total : s.kalaBala.total)}</b></summary>${d[1](s).map(x => `<div class="shb-dr"><span>${x[0]}</span><b>${(x[1] / 60).toFixed(2)}</b></div>`).join('')}</details>`).join('');
    const bars = v.rank.map(n => { const p = v.planets[n], q = p.percentOfRequired;
      return `<button type="button" class="shb-pr ${n === name ? 'me' : ''}" style="--c:${PLANET_COLORS[n]};--w:${Math.min(100, q / 1.6).toFixed(0)}%" onclick="openPlanetDetail('${n}',${jd});setTimeout(()=>pdxTab(document.querySelectorAll('.pdx-tab')[1],'st'),0)"><span>${PLANET_GLYPHS[n]}</span><i><u></u><em style="left:${(100 / 1.6).toFixed(1)}%"></em></i><b>${Math.round(q)}%</b></button>`; }).join('');
    const loc = getLiveLoc();
    return `<section class="shb" id="shbBox" data-k="${[Math.round(jd * 1440), loc.lat, loc.lon].join('|')}">
      ${head(isNow ? '<span class="shb-live"><i></i>Live now</span>' : `<span class="shb-live off">${esc(formatFullDate(jd))}</span>`)}
      <div class="shb-hero pdx-in"><div class="shb-ringw">${ring(pct, ok)}<div class="shb-mid"><b>${s.totalRupas.toFixed(2)}</b><small>of ${s.requiredRupas} rupas</small></div></div>
        <div class="shb-info"><span class="shb-verdict ${ok ? 'good' : 'bad'}">${ok ? 'Strong' : 'Needs support'}</span><div class="shb-pct">${pct}% of the strength it needs</div>
          <div class="shb-meta"><span>#${pos} of 7 now</span><span>House ${v.house[name]}</span><span>${v.isDay ? 'Daytime' : 'Night-time'}</span></div></div></div>
      <div class="shb-six">${six}</div>
      <div class="shb-dets">${det}</div>
      <div class="pdx-h" style="margin-top:18px">All seven right now</div><div class="shb-prs">${bars}</div>
      <div class="shb-foot"><span>Hora lord <b>${v.horaLord}</b> · Day lord <b>${v.dinaLord}</b></span>
        <span>For <b>${v.approx ? 'a place estimated from your time zone' : esc(v.place)}</b> <button type="button" class="shb-chg" onclick="askLiveLoc()">Change place</button></span></div>
      <p class="shb-note">Rupas are the classical unit (60 virupas). A planet is counted strong when it reaches its minimum: Sun 6.5, Moon 6, Mars 5, Mercury 7, Jupiter 6.5, Venus 5.5, Saturn 5. Dig and Kendradi use the rising sign at this place and time, so they change with both. Ishta and Kashta bala are not shown.</p></section>`;
  }
  return { live, compute, html, badge };
})();

/* ---- planet window hook ---- */
(function(){
  if (typeof openPlanetDetail !== 'function') return;
  const base = openPlanetDetail; let timer = null;
  function put(name, jd){
    const root = document.querySelector('#planetDetailContent .pdx-root'); if (!root) return;
    const pane = root.querySelector('.pdx-pane[data-pane="st"]'), old = document.getElementById('shbBox');
    if (old) old.remove(); const old2 = root.querySelector('.shb-badge'); if (old2) old2.remove();
    if (pane) pane.insertAdjacentHTML('afterbegin', SHB.html(name, jd));
    const bd = root.querySelector('.pdx-badges'); if (bd && ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'].includes(name)) bd.insertAdjacentHTML('beforeend', SHB.badge(name, jd));
  }
  window.openPlanetDetail = function(name, jd){
    base.apply(this, arguments); if (jd == null) jd = currentJD;
    try { put(name, jd); } catch(e){ console.warn('shadbala block', e); return; }
    clearInterval(timer);                            // follow a change of place (Change place button) while the window is open
    timer = setInterval(() => {
      const ov = document.getElementById('planetDetailOverlay'), box = document.getElementById('shbBox');
      if (!ov || !ov.classList.contains('show') || !box){ clearInterval(timer); return; }
      const L = getLiveLoc(); if (box.dataset.k !== [Math.round(jd * 1440), L.lat, L.lon].join('|')){ try { put(name, jd); } catch(e){} }
    }, 600);
  };
  window.shbGoto = function(btn){ const root = btn.closest('.pdx-root'); const tab = root && root.querySelectorAll('.pdx-tab')[1]; if (tab) pdxTab(tab, 'st'); const m = btn.closest('.pdmodal'); const b = document.getElementById('shbBox'); if (m && b) setTimeout(() => m.scrollTo({ top:b.offsetTop - 60, behavior:'smooth' }), 60); };
})();

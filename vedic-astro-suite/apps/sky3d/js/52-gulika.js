/* ============================================================================
   GULIKA (Mandi), son of Saturn: an upagraha point on the zodiac, not a body. Same method as the Birth Chart (apps/birth-chart/js/117-gulika.js): change both.
   The day (sunrise to sunset) or night (sunset to next sunrise) is cut into 8 parts. Day: the first part is the weekday lord's. Night: the first part
   is the 5th planet from the weekday lord. Gulika = the rising sign and degree at the moment of Saturn's part (BPHS chapter 3, upagrahas; teaching sources).
   Saturn's part, day: Sun 7, Mon 6, Tue 5, Wed 4, Thu 3, Fri 2, Sat 1. Night: Sun 3, Mon 2, Tue 1, Wed 7, Thu 6, Fri 5, Sat 4.
   Schools differ on the moment inside Saturn's part (start, middle or end); the default is the start.
   API: GK.at(jd, lat, lon, tz, where) -> {lon, sign, deg, nak, pada, isDay, part, weekday, jd} | null ; GK.live(jd) uses the viewer's place; GK.natal(profile).
   ============================================================================ */
const GK = (function(){
  const DAYP = [7,6,5,4,3,2,1], NIGHTP = [3,2,1,7,6,5,4];
  const sunAlt = (jd, lat, lon) => {
    const T = (jd - J2000) / 36525, lam = sunLongitude(jd) * DEG, eps = (23.4392911 - 0.0130042 * T) * DEG;
    const sd = Math.sin(eps) * Math.sin(lam), dec = Math.asin(sd), ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
    const gm = normDeg(280.46061837 + 360.98564736629 * (jd - J2000) + 0.000387933 * T * T), H = (gm + lon) * DEG - ra;
    return Math.asin(Math.sin(lat * DEG) * sd + Math.cos(lat * DEG) * Math.cos(dec) * Math.cos(H)) * RAD;
  };
  const addDay = (y, m, d, n) => { const t = new Date(Date.UTC(y, m - 1, d + n)); return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()]; };
  function riseSet(y, m, d, lat, lon, tz){
    const h0 = -0.8333, start = toJulianDay(y, m, d, 0, 0, 0) - tz / 24, N = 96, f = t => sunAlt(t, lat, lon) - h0;
    const bis = (a, b) => { for (let i = 0; i < 40; i++){ const mid = (a + b) / 2; if ((f(a) < 0) === (f(mid) < 0)) a = mid; else b = mid; } return (a + b) / 2; };
    let rise = null, set = null, prev = f(start);
    for (let i = 1; i <= N; i++){ const t = start + i / N, v = f(t);
      if (rise === null && prev < 0 && v >= 0) rise = bis(t - 1 / N, t); else if (rise !== null && set === null && prev >= 0 && v < 0) set = bis(t - 1 / N, t); prev = v; }
    return { rise, set };
  }
  function at(jd, lat, lon, tz, where){
    where = ['start','middle','end'].includes(where) ? where : 'start';
    const loc = new Date((jd + tz / 24 - 2440587.5) * 86400000), y = loc.getUTCFullYear(), m = loc.getUTCMonth() + 1, d = loc.getUTCDate();
    const rs = riseSet(y, m, d, lat, lon, tz); if (rs.rise === null || rs.set === null) return null;
    let from, to, isDay, wy = y, wm = m, wd = d;
    if (jd >= rs.rise && jd < rs.set){ from = rs.rise; to = rs.set; isDay = true; }
    else if (jd >= rs.set){ const [ny, nm, nd] = addDay(y, m, d, 1), nx = riseSet(ny, nm, nd, lat, lon, tz); if (nx.rise === null) return null; from = rs.set; to = nx.rise; isDay = false; }
    else { [wy, wm, wd] = addDay(y, m, d, -1); const pv = riseSet(wy, wm, wd, lat, lon, tz); if (pv.set === null) return null; from = pv.set; to = rs.rise; isDay = false; }
    const w = new Date(Date.UTC(wy, wm - 1, wd)).getUTCDay(), n = (isDay ? DAYP : NIGHTP)[w], part = (to - from) / 8;
    const t = from + (n - 1) * part + (where === 'start' ? 0 : where === 'middle' ? part / 2 : part);
    const l = siderealAscendant(t, lat, lon), ni = getNakshatraIndex(l);
    return { lon: l, sign: getSignIndex(l), deg: normDeg(l) % 30, nak: ni, pada: getPadaIndex(l) + 1, isDay, part: n, weekday: w, jd: t, where };
  }
  const browserTz = jd => -new Date((jd - 2440587.5) * 86400000).getTimezoneOffset() / 60;
  let memo = null;
  function live(jd){
    const L = getLiveLoc(), tz = browserTz(jd), k = [Math.round(jd * 1440), L.lat, L.lon].join('|');   // same minute and place = same answer
    if (memo && memo.k === k) return memo.v;
    let v = null; try { v = at(jd, L.lat, L.lon, tz); } catch(e){ console.warn('gulika', e); }
    memo = { k, v }; return v;
  }
  function natal(p){
    if (!p) return null; const j = computeNatalAscendant(p).jd; let v = null;
    try { v = at(j, p.lat, p.lon, p.tz); } catch(e){ console.warn('gulika natal', e); } return v;
  }
  return { at, live, natal };
})();

/* =============================================================================
   VEDIC BIRTHDAY ENGINE — Tithi birthday · Nakshatra birthday · Solar return
   ============================================================================= */
function vbJD(y, m, d, tz){ return toJulianDay(y, m, d, 0, 0, 0) - tz / 24; }
function vbNatal(chart, profile){
  const jd = chart.julianDay, P = panchangaAt(jd, profile.lat, profile.lon, profile.tz), lp = pnParts(jd, profile.tz);
  return { jd, P, masaIdx: PN_MASA.indexOf(P.masa.name), adhika: P.masa.adhika, tn: P.tithi.num, nak: P.nakshatra.num - 1, pada: P.nakshatra.pada,
    sunSid: getSiderealLongitudeAt('Sun', jd), by: lp.y, bm: lp.m, bd: lp.d, lat: profile.lat, lon: profile.lon, tz: profile.tz };
}
/* the day a span [a,b) is observed: the first local date whose sunrise falls inside it (Hindu rule); else the date at the span's middle (kshaya) */
function vbDayFor(a, b, N){
  const s = pnParts(a, N.tz), e = pnParts(b, N.tz);
  let [y, m, d] = pnAddDay(s.y, s.m, s.d, -1);
  for (let i = 0; i < 6; i++){
    const rs = pnRiseSet(y, m, d, N.lat, N.lon, N.tz);
    if (rs.rise !== null && rs.rise >= a && rs.rise < b) return { y, m, d, jd: rs.rise, sunrise: true };
    [y, m, d] = pnAddDay(y, m, d, 1);
    if (y > e.y || (y === e.y && m > e.m) || (y === e.y && m === e.m && d > e.d + 1)) break;
  }
  const mid = pnParts((a + b) / 2, N.tz); return { y: mid.y, m: mid.m, d: mid.d, jd: (a + b) / 2, sunrise: false };
}
function vbMoons(y, tz){
  const start = vbJD(y, 1, 1, tz) - 45, end = vbJD(y, 12, 31, tz) + 45;
  let nm = pnBoundary(pnDiff, start, 360, -1, 0.25); const out = [nm];
  while (nm < end){ nm = pnBoundary(pnDiff, nm + 1, 360, +1, 0.25); out.push(nm); }
  return out;
}
function vbMonths(nms){
  return nms.slice(0, -1).map((a, k) => { const b = nms[k + 1], s1 = getSignIndex(getSiderealLongitudeAt('Sun', a)), s2 = getSignIndex(getSiderealLongitudeAt('Sun', b));
    return { a, b, idx: (s1 + 1) % 12, adhika: s1 === s2 }; });
}
function vbTithi(N, y, months){
  const out = [];
  months.forEach(M => {
    if (M.idx !== N.masaIdx || M.adhika) return;
    const u = t => { let v = pnDiff(t); if (t < M.a + 0.3 && v > 300) v -= 360; if (t > M.b - 0.3 && v < 60) v += 360; return v; };
    const at = deg => { let lo = M.a, hi = M.b; for (let i = 0; i < 45; i++){ const m = (lo + hi) / 2; if (u(m) >= deg) hi = m; else lo = m; } return (lo + hi) / 2; };
    const start = N.tn === 1 ? M.a : at((N.tn - 1) * 12), end = N.tn === 30 ? M.b : at(N.tn * 12);
    const day = vbDayFor(start, end, N);
    if (day.y === y) out.push({ start, end, day, month: M });
  });
  return out;
}
function vbNak(N, y, months){
  const out = [], endJD = vbJD(y, 12, 31, N.tz) + 2;
  let cur = pnBoundary(pnMoon, vbJD(y, 1, 1, N.tz) - 2, PN_NAK, -1);
  while (cur < endJD){
    const nxt = pnBoundary(pnMoon, cur + 0.01, PN_NAK, +1);
    if (Math.floor(pnMoon((cur + nxt) / 2) / PN_NAK) === N.nak){
      const day = vbDayFor(cur, nxt, N);
      if (day.y === y){ const M = months.find(m => cur >= m.a && cur < m.b);
        out.push({ start: cur, end: nxt, day, birthMonth: !!M && M.idx === N.masaIdx && !M.adhika, masa: M ? PN_MASA[M.idx] + (M.adhika ? ' (Adhika)' : '') : '' }); }
    }
    cur = nxt;
  }
  return out;
}
function vbSolar(N, y){
  const sunAt = t => getSiderealLongitudeAt('Sun', t), target = N.sunSid;
  const find = c => { let lo = c - 3, hi = c + 3; const f = t => { const d = normDeg(sunAt(t) - target); return d > 180 ? d - 360 : d; };
    for (let i = 0; i < 50; i++){ const m = (lo + hi) / 2; if (f(m) >= 0) hi = m; else lo = m; } return (lo + hi) / 2; };
  for (const n of [y - N.by, y - N.by + 1, y - N.by - 1]){
    const jd = find(N.jd + n * 365.25636), p = pnParts(jd, N.tz);
    if (p.y === y){
      const asc = getSignIndex(normDeg(ascendantLongitude(jd, N.lat, N.lon) - lahiriAyanamsa(jd)));
      return { jd, day: { y: p.y, m: p.m, d: p.d }, time: p.timeStr.slice(0, 5), age: y - N.by, lagna: asc, moon: getSignIndex(getSiderealLongitudeAt('Moon', jd)) };
    }
  }
  return null;
}
function vbYear(N, y){
  const months = vbMonths(vbMoons(y, N.tz));
  return { y, tithi: vbTithi(N, y, months), nak: vbNak(N, y, months), solar: vbSolar(N, y) };
}


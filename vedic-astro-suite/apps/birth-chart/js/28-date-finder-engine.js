/* ---------- engine ---------- */
function dfSunrise(y, m, d, lat, lon, tz){
  const jd0 = toJulianDay(y, m, d, 0, 0, 0) - tz / 24;
  const guess = jd0 + 0.5 - (lon - tz * 15) / 360 - 0.25;
  const f = x => pnSunAlt(x, lat, lon) + 0.8333;
  let t = guess;
  for (let i = 0; i < 6; i++){
    const a = f(t), s = (f(t + 0.01) - a) / 0.01;
    if (!isFinite(s) || Math.abs(s) < 1e-6) break;
    const dt = a / s; t -= dt; if (Math.abs(dt) < 1e-5) break;
  }
  return (isFinite(t) && Math.abs(t - guess) < 0.2) ? t : guess;
}
function dfSunSign(jd){ return getSignIndex(getSiderealLongitudeAt('Sun', jd)); }
/* Moon's ecliptic latitude (Meeus ch.47, main terms; good to ~0.03°) */
function dfMoonLat(jd){
  const T = (jd - J2000) / 36525.0;
  const D = normDeg(297.8501921 + 445267.1114034*T), Mp = normDeg(134.9633964 + 477198.8675055*T), F = normDeg(93.2720950 + 483202.0175233*T), M = normDeg(357.5291092 + 35999.0502909*T);
  const R = DEG, tm = [[0,0,0,1,5128122],[0,0,1,1,280602],[0,0,1,-1,277693],[2,0,0,-1,173237],[2,0,-1,1,55413],[2,0,-1,-1,46271],[2,0,0,1,32573],[0,0,2,1,17198],[2,0,1,-1,9266],[0,0,2,-1,8822],[2,-1,0,-1,8216],[2,0,-2,-1,4324],[2,0,1,1,4200],[2,1,0,-1,-3359],[2,-1,-1,1,2463],[2,-1,0,1,2211],[2,-1,-1,-1,2065],[0,1,-1,-1,-1870],[4,0,-1,-1,1828],[0,1,0,1,-1794],[0,0,0,3,-1749]];
  let s = 0; tm.forEach(t => { s += t[4] * Math.sin((t[0]*D + t[1]*M + t[2]*Mp + t[3]*F) * R); });
  return s / 1e6;
}
/* every new / full moon (Moon-Sun elongation crosses 0 or 180) from a little before jdA to a little after jdB */
function dfSyz(jdA, jdB){
  const out = []; let t = jdA - 35;
  for (let g = 0; g < 4000 && t < jdB + 35; g++){
    const x = pnBoundary(pnDiff, t, 180, +1, 0.25);
    out.push({ jd: x, full: Math.round(pnDiff(x) / 180) % 2 === 1 });
    t = x + 1;
  }
  return out;
}
/* Amanta lunar months from the new moons: starts at a new moon, named by the Sun's sign then; Adhika if the Sun stays in one sign */
function dfMonths(sy){
  const nm = sy.filter(s => !s.full), mo = [];
  for (let k = 0; k + 1 < nm.length; k++){
    const s1 = dfSunSign(nm[k].jd), s2 = dfSunSign(nm[k + 1].jd);
    mo.push({ start: nm[k].jd, end: nm[k + 1].jd, mi: (s1 + 1) % 12, adhika: s1 === s2 });
  }
  return mo;
}
function dfMonthAt(mo, jd){
  let lo = 0, hi = mo.length - 1;
  if (!mo.length || jd < mo[0].start || jd >= mo[hi].end) return null;
  while (lo < hi){ const m = (lo + hi + 1) >> 1; if (mo[m].start <= jd) lo = m; else hi = m - 1; }
  return mo[lo];
}
/* eclipses (any visible somewhere on Earth): new moon with |Moon lat| < 1.55° = solar, full moon with |lat| < 1.0° = lunar (umbral) */
function dfEclipses(sy){
  const out = [];
  sy.forEach(s => {
    const lat = Math.abs(dfMoonLat(s.jd));
    if (!s.full && lat < DF_LIM_SOLAR) out.push({ jd: s.jd, kind: 'solar', lat });
    else if (s.full && lat < DF_LIM_LUNAR) out.push({ jd: s.jd, kind: 'lunar', lat });
  });
  return out;
}
function dfIn(a, b, x, mod){ const d1 = (x - a + mod) % mod, d2 = (b - a + mod) % mod; return d1 <= d2; }   // is x within the cyclic run a..b ?
function dfNear(arr, i, n, tol){ for (let d = 0; d <= tol; d++){ if (i - d >= 0 && arr[i - d]) return -d; if (i + d < n && arr[i + d]) return d; } return null; }
function dfTithiName(t0){ const pk = t0 < 15 ? 'Shukla' : 'Krishna', k = t0 % 15; return k === 14 ? (t0 < 15 ? 'Purnima' : 'Amavasya') : pk + ' ' + PN_TITHI[k]; }
function dfTithiTargets(q){
  if (q.tithi === '' && q.pak === '') return null;
  if (q.tithi === 'P') return [14];
  if (q.tithi === 'A') return [29];
  const out = [];
  if (q.tithi === ''){ for (let k = 0; k < 15; k++){ if (q.pak === 'S' && k < 15) out.push(k); if (q.pak === 'K') out.push(k + 15); } return out; }
  const x = +q.tithi - 1;
  if (q.pak !== 'K') out.push(x);
  if (q.pak !== 'S') out.push(x + 15);
  return out;
}
/* sign of a slow planet on every day, sampled every 6 days and interpolated (error is far below a day) */
function dfSlow(name, tm, n){
  const out = new Int8Array(n), step = 6; let prev = null;
  for (let i = 0; i < n; i += step){
    const j = Math.min(n - 1, i + step), a = getSiderealLongitudeAt(name, tm[i]), b = getSiderealLongitudeAt(name, tm[j]);
    const dd = ((b - a + 540) % 360) - 180;
    for (let k = i; k <= j && k < n; k++){ const f = j === i ? 0 : (k - i) / (j - i); out[k] = getSignIndex(a + dd * f); }
  }
  return out;
}

function* dfGen(q){
  const lat = q.lat, lon = q.lon, tz = q.tz;
  const base = Date.UTC(q.y0, 0, 1), n = Math.round((Date.UTC(q.y1, 11, 31) - base) / 864e5) + 1, N2 = n + 2;
  const dt = i => { const d = new Date(base + i * 864e5); return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCDay()]; };
  const srj = new Float64Array(N2), T = new Int8Array(N2), NK = new Int8Array(N2), MS = new Int8Array(N2), SUN = new Int8Array(N2);
  for (let i = 0; i < N2; i++){
    const [y, m, d] = dt(i), t = dfSunrise(y, m, d, lat, lon, tz); srj[i] = t;
    T[i] = Math.min(29, Math.floor(pnDiff(t) / 12));
    const ml = pnMoon(t); NK[i] = Math.floor(ml / PN_NAK) % 27; MS[i] = getSignIndex(ml); SUN[i] = dfSunSign(t);
    if (i % 200 === 0) yield 0.55 * i / N2;
  }
  const sy = dfSyz(srj[0], srj[N2 - 1]); yield 0.6;
  const months = dfMonths(sy), ecl = dfEclipses(sy);
  const MI = new Int8Array(N2), ADH = new Uint8Array(N2), SAM = new Int8Array(N2);
  for (let i = 0; i < N2; i++){
    const mo = dfMonthAt(months, srj[i]); MI[i] = mo ? mo.mi : 0; ADH[i] = mo && mo.adhika ? 1 : 0;
    const [y, m] = dt(i), Y = (m <= 4 && MI[i] >= 8) ? y - 1 : y; SAM[i] = (((Y - 2024 + 37) % 60) + 60) % 60;
  }
  const SAT = dfSlow('Saturn', srj, N2), JUP = dfSlow('Jupiter', srj, N2), RAH = dfSlow('Rahu', srj, N2); yield 0.8;
  const eclS = new Uint8Array(n), eclL = new Uint8Array(n);
  ecl.forEach(e => { const p = jdToLocalParts(e.jd, tz).dateStr.split('-').map(Number), idx = Math.round((Date.UTC(p[0], p[1] - 1, p[2]) - base) / 864e5); if (idx >= 0 && idx < n) (e.kind === 'solar' ? eclS : eclL)[idx] = 1; });
  const ctx = { q, n, base, srj, T, NK, MS, SUN, MI, ADH, SAM, SAT, JUP, RAH, months, ecl, eclS, eclL, dt };
  ctx.festHits = f => dfFestHits(ctx, f);
  let fh = null;
  if (q.fest){ const f = DF_FEST.find(x => x[0] === q.fest); if (f) fh = dfFestHits(ctx, f); }
  yield 0.9;

  const tg = dfTithiTargets(q), clues = [];
  if (tg) clues.push('tithi'); if (q.wd !== '') clues.push('wd'); if (fh) clues.push('fest');
  if (q.ecl) clues.push('ecl'); if (q.nak !== '') clues.push('nak'); if (q.moon !== '') clues.push('moon'); if (q.masa !== '') clues.push('masa');
  if (q.sun !== '') clues.push('sun'); if (q.sam !== '') clues.push('sam'); if (q.mon !== '') clues.push('mon'); if (q.dom !== '') clues.push('dom');
  if (q.sat !== '') clues.push('sat'); if (q.jup !== '') clues.push('jup'); if (q.rahu !== '') clues.push('rahu');
  const maxMiss = clues.length >= 3 ? 1 : 0, tol = +q.tol || 0, rows = [];
  for (let i = 0; i < n; i++){
    const [y, m, d, wd] = dt(i), chips = []; let miss = 0;
    const chk = (id, ok, txt) => { chips.push({ id, ok, txt }); if (!ok) miss++; };
    if (q.wd !== '') chk('wd', wd === +q.wd, PN_VARA[+q.wd][1]);
    if (q.mon !== '') chk('mon', m === +q.mon, PN_MON[+q.mon - 1]);
    if (q.dom !== '') chk('dom', d === +q.dom, 'Date ' + q.dom);
    if (tg){
      const a = T[i], b = T[i + 1], hit = tg.find(x => dfIn(a, b, x, 30)), ex = tg.indexOf(a) >= 0;
      chk('tithi', hit !== undefined, (hit !== undefined ? dfTithiName(hit) : dfTithiName(tg[0])) + (hit !== undefined ? (ex ? ' · at sunrise' : ' · during the day') : ''));
    }
    if (q.nak !== ''){ const hit = dfIn(NK[i], NK[i + 1], +q.nak, 27); chk('nak', hit, NAKSHATRAS[+q.nak].name + (hit ? (NK[i] === +q.nak ? ' · at sunrise' : ' · during the day') : '')); }
    if (q.moon !== ''){ const hit = dfIn(MS[i], MS[i + 1], +q.moon, 12); chk('moon', hit, 'Moon in ' + SIGNS[+q.moon].name); }
    if (q.masa !== ''){ const mi = (MI[i] + (q.purn && T[i] >= 15 ? 1 : 0)) % 12; chk('masa', mi === +q.masa, PN_MASA[+q.masa] + ' month'); }
    if (q.sun !== '') chk('sun', SUN[i] === +q.sun, 'Sun in ' + SIGNS[+q.sun].name);
    if (q.sam !== '') chk('sam', SAM[i] === +q.sam, DF_SAM[+q.sam] + ' year');
    if (q.sat !== '') chk('sat', SAT[i] === +q.sat, 'Saturn in ' + SIGNS[+q.sat].name);
    if (q.jup !== '') chk('jup', JUP[i] === +q.jup, 'Jupiter in ' + SIGNS[+q.jup].name);
    if (q.rahu !== '') chk('rahu', RAH[i] === +q.rahu, 'Rahu in ' + SIGNS[+q.rahu].name);
    if (fh){ const o = dfNear(fh, i, n, tol), f = DF_FEST.find(x => x[0] === q.fest); chk('fest', o !== null, f[1] + (o === null ? '' : (o === 0 ? ' · same day' : ' · ' + Math.abs(o) + ' day' + (Math.abs(o) > 1 ? 's' : '') + (o < 0 ? ' after' : ' before')))); }
    if (q.ecl){
      const arrs = q.ecl === 'solar' ? [eclS] : q.ecl === 'lunar' ? [eclL] : [eclS, eclL]; let best = null;
      arrs.forEach((a, k) => { const o = dfNear(a, i, n, tol); if (o !== null && (best === null || Math.abs(o) < Math.abs(best.o))) best = { o, kind: q.ecl === 'either' ? (k === 0 ? 'Solar' : 'Lunar') : (q.ecl === 'solar' ? 'Solar' : 'Lunar') }; });
      chk('ecl', best !== null, (best ? best.kind : (q.ecl === 'solar' ? 'Solar' : q.ecl === 'lunar' ? 'Lunar' : 'Solar / lunar')) + ' eclipse' + (best ? (best.o === 0 ? ' · same day' : ' · ' + Math.abs(best.o) + ' day' + (Math.abs(best.o) > 1 ? 's' : '') + (best.o < 0 ? ' after' : ' before')) : ''));
    }
    if (miss <= maxMiss) rows.push({ i, date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, wd, chips, miss });
    if (i % 1500 === 0) yield 0.9 + 0.1 * i / n;
  }
  rows.sort((a, b) => a.miss - b.miss || a.i - b.i);
  return { rows, clues, nFull: rows.filter(r => r.miss === 0).length, nAlmost: rows.filter(r => r.miss > 0).length, n, ctx };
}

/* does lunar festival f fall on day i?  (f[5] = moment(s) of the day joined by '+', f[6] = days after the tithi day) */
function dfLunarHit(ctx, f, i){
  const j = i - (f[6] || 0); if (j < 0) return false;
  return f[5].split('+').some(mm => {
    const tf = ctx.srj[j] + DF_AT[mm];
    if (Math.floor(pnDiff(tf) / 12) + 1 !== f[4]) return false;
    const mo = dfMonthAt(ctx.months, tf); return !!(mo && mo.mi === f[3] && !mo.adhika);
  });
}
/* all days on which a festival falls (index array as 0/1) */
function dfFestHits(ctx, f){
  const { n, srj, SUN, NK, months } = ctx, h = new Uint8Array(n);
  if (f[2] === 'L'){
    for (let i = 0; i < n; i++) if (dfLunarHit(ctx, f, i)) h[i] = 1;
  } else if (f[2] === 'S'){
    for (let i = 0; i < n; i++){
      if (SUN[i] === f[3] || SUN[i + 1] !== f[3]) continue;
      let a = srj[i], b = srj[i + 1];
      for (let k = 0; k < 30; k++){ const m = (a + b) / 2; if (dfSunSign(m) === f[3]) b = m; else a = m; }
      const idx = (b >= srj[i] + 0.5) ? i + 1 : i; if (idx < n) h[idx] = 1;      // after sunset -> observed next day
    }
  } else {
    for (let i = 0; i < n; i++) if (SUN[i] === 4 && dfIn(NK[i], NK[i + 1], 21, 27)) h[i] = 1;
  }
  return h;
}
/* everything we know about one result day (for the result card) */
function dfInfo(ctx, i){
  const { q, T, NK, MS, SUN, MI, ADH, SAM, SAT, JUP, RAH, n, srj, dt } = ctx, [y, m, d, wd] = dt(i);
  const mi = (MI[i] + (q.purn && T[i] >= 15 ? 1 : 0)) % 12, fests = [];
  DF_FEST.forEach(f => {
    if (f[2] === 'L'){ if (dfLunarHit(ctx, f, i)) fests.push(f[1]); }
    else if (f[2] === 'O'){ if (SUN[i] === 4 && dfIn(NK[i], NK[i + 1], 21, 27)) fests.push(f[1]); }
    else if (SUN[i] !== f[3] && SUN[i + 1] === f[3]){ let a = srj[i], b = srj[i + 1]; for (let k = 0; k < 30; k++){ const mm = (a + b) / 2; if (dfSunSign(mm) === f[3]) b = mm; else a = mm; } if (((b >= srj[i] + 0.5) ? i + 1 : i) === i) fests.push(f[1]); }
  });
  const ecl = []; [-1, 0, 1].forEach(o => { const j = i + o; if (j < 0 || j >= n) return; const w = o === 0 ? '' : (o < 0 ? ' (day before)' : ' (day after)'); if (ctx.eclS[j]) ecl.push('Solar eclipse' + w); if (ctx.eclL[j]) ecl.push('Lunar eclipse' + w); });
  return { y, m, d, wd, tithi: dfTithiName(T[i]), nak: NAKSHATRAS[NK[i]].name, moonSign: SIGNS[MS[i]], masa: PN_MASA[mi], adhika: !!ADH[i], sam: DF_SAM[SAM[i]], sun: SIGNS[SUN[i]], sat: SIGNS[SAT[i]], jup: SIGNS[JUP[i]], rahu: SIGNS[RAH[i]], fests, ecl };
}


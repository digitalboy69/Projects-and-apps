/* =============================================================================
   PHASE 1 ENGINES — Panchanga · Transits & Sade Sati · Bhava Chalit (Sripati)
   Pure functions (no DOM). All times are Julian Days in UT; tz is the birth-place UTC offset in hours.
   ============================================================================= */
const PN_TITHI = ['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi'];
const PN_YOGA = ['Vishkambha','Priti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma','Dhriti','Shula','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata','Variyana','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti'];
const PN_KARANA_MOV = ['Bava','Balava','Kaulava','Taitila','Gara','Vanija','Vishti'];
const PN_VARA = [['Ravivara','Sunday','Sun'],['Somavara','Monday','Moon'],['Mangalavara','Tuesday','Mars'],['Budhavara','Wednesday','Mercury'],['Guruvara','Thursday','Jupiter'],['Shukravara','Friday','Venus'],['Shanivara','Saturday','Saturn']];
const PN_MASA = ['Chaitra','Vaishakha','Jyeshtha','Ashadha','Shravana','Bhadrapada','Ashvina','Kartika','Margashirsha','Pausha','Magha','Phalguna'];
const PN_RAHU_PART = [8,2,7,5,6,4,3];   // 1-based eighth of the daytime, indexed Sun..Sat
const PN_YAMA_PART = [5,4,3,2,1,7,6];
const PN_GULI_PART = [7,6,5,4,3,2,1];
const PN_CHALDEAN = ['Saturn','Jupiter','Mars','Sun','Venus','Mercury','Moon'];
const PN_MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PN_NAK = 360/27;

function pnDiff(jd){ return normDeg(moonLongitude(jd) - sunLongitude(jd)); }                 // Moon-Sun elongation (ayanamsa cancels)
function pnSum(jd){ return normDeg(getSiderealLongitudeAt('Sun', jd) + getSiderealLongitudeAt('Moon', jd)); }
function pnMoon(jd){ return getSiderealLongitudeAt('Moon', jd); }

/* Time at which a monotonic angle fn(jd) next (dir=+1) / last (dir=-1) crosses a multiple of `unit` degrees. */
function pnBoundary(fn, jd, unit, dir, stepDays){
  const v0 = fn(jd), into = v0 % unit, need = dir > 0 ? unit - into : into;
  const delta = t => dir > 0 ? normDeg(fn(t) - v0) : normDeg(v0 - fn(t));
  const step = stepDays || 0.02; let lo = jd, hi = jd;
  for (let i = 1; i <= 600; i++){ hi = jd + dir * step * i; if (delta(hi) >= need) break; lo = hi; }
  let a = lo, b = hi;
  for (let i = 0; i < 38; i++){ const m = (a + b) / 2; if (delta(m) >= need) b = m; else a = m; }   // 38 halvings of a <=12-day bracket is far below double precision at JD 2.4e6
  return (a + b) / 2;
}

/* Altitude of the Sun's centre (degrees) from apparent longitude, obliquity and sidereal time. */
function pnSunAlt(jd, lat, lon){
  const lam = sunLongitude(jd) * DEG, eps = obliquityOfEcliptic(jd) * DEG;
  const sinDec = Math.sin(eps) * Math.sin(lam), dec = Math.asin(sinDec);
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
  const H = (greenwichSiderealTime(jd) + lon) * DEG - ra;
  return Math.asin(Math.sin(lat * DEG) * sinDec + Math.cos(lat * DEG) * Math.cos(dec) * Math.cos(H)) * RAD;
}
/* Sunrise / sunset (upper limb + refraction, h0 = -0.833°) for a local civil date. Returns {rise,set} (JD UT) or nulls. */
function pnRiseSet(y, m, d, lat, lon, tz){
  const h0 = -0.8333, start = toJulianDay(y, m, d, 0, 0, 0) - tz / 24, N = 96;
  const f = t => pnSunAlt(t, lat, lon) - h0;
  const bis = (a, b) => { for (let i = 0; i < 40; i++){ const mid = (a + b) / 2; if ((f(a) < 0) === (f(mid) < 0)) a = mid; else b = mid; } return (a + b) / 2; };
  let rise = null, set = null, prev = f(start);
  for (let i = 1; i <= N; i++){
    const t = start + i / N, v = f(t);
    if (rise === null && prev < 0 && v >= 0) rise = bis(t - 1 / N, t);
    else if (rise !== null && set === null && prev >= 0 && v < 0) set = bis(t - 1 / N, t);
    prev = v;
  }
  return { rise, set };
}
function pnParts(jd, tz){ const p = jdToLocalParts(jd, tz); const [y, m, d] = p.dateStr.split('-').map(Number); return { y, m, d, dateStr: p.dateStr, timeStr: p.timeStr }; }
function pnAddDay(y, m, d, n){ const t = new Date(Date.UTC(y, m - 1, d + n)); return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()]; }
function pnWeekday(y, m, d){ return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }

function panchangaAt(jd, lat, lon, tz){
  const diff = pnDiff(jd), tn = Math.floor(diff / 12), tIdx = tn % 15;
  const tithi = {
    num: tn + 1, paksha: tn < 15 ? 'Shukla' : 'Krishna',
    name: tIdx === 14 ? (tn < 15 ? 'Purnima' : 'Amavasya') : PN_TITHI[tIdx],
    start: pnBoundary(pnDiff, jd, 12, -1), end: pnBoundary(pnDiff, jd, 12, +1)
  };
  const kn = Math.floor(diff / 6);
  const karana = {
    name: kn === 0 ? 'Kimstughna' : (kn >= 57 ? ['Shakuni','Chatushpada','Naga'][kn - 57] : PN_KARANA_MOV[(kn - 1) % 7]),
    start: pnBoundary(pnDiff, jd, 6, -1), end: pnBoundary(pnDiff, jd, 6, +1)
  };
  karana.vishti = karana.name === 'Vishti';
  const sum = pnSum(jd), yi = Math.floor(sum / PN_NAK);
  const yoga = { num: yi + 1, name: PN_YOGA[yi], start: pnBoundary(pnSum, jd, PN_NAK, -1), end: pnBoundary(pnSum, jd, PN_NAK, +1) };
  const mlon = pnMoon(jd), ni = Math.floor(mlon / PN_NAK);
  const nakshatra = { num: ni + 1, name: NAKSHATRAS[ni].name, lord: NAKSHATRAS[ni].lord, pada: Math.floor((mlon % PN_NAK) / (PN_NAK / 4)) + 1,
    start: pnBoundary(pnMoon, jd, PN_NAK, -1), end: pnBoundary(pnMoon, jd, PN_NAK, +1) };

  // Vedic day runs sunrise → next sunrise
  const lp = pnParts(jd, tz);
  let rsToday = pnRiseSet(lp.y, lp.m, lp.d, lat, lon, tz), vy = lp.y, vm = lp.m, vd = lp.d;
  if (rsToday.rise !== null && jd < rsToday.rise){ [vy, vm, vd] = pnAddDay(lp.y, lp.m, lp.d, -1); }
  const rs = pnRiseSet(vy, vm, vd, lat, lon, tz);
  const [ny, nm, nd] = pnAddDay(vy, vm, vd, 1), rsNext = pnRiseSet(ny, nm, nd, lat, lon, tz);
  const wd = pnWeekday(vy, vm, vd), vara = { idx: wd, sk: PN_VARA[wd][0], name: PN_VARA[wd][1], lord: PN_VARA[wd][2], date: `${vy}-${String(vm).padStart(2,'0')}-${String(vd).padStart(2,'0')}` };

  const out = { jd, tz, tithi, karana, yoga, nakshatra, vara, sunrise: rs.rise, sunset: rs.set, nextSunrise: rsNext.rise,
    moonSign: getSignIndex(mlon), sunSign: getSignIndex(getSiderealLongitudeAt('Sun', jd)), elongation: diff };
  if (rs.rise !== null && rs.set !== null){
    const dl = rs.set - rs.rise, part = dl / 8, seg = n => [rs.rise + (n - 1) * part, rs.rise + n * part];
    out.dayLength = dl; out.nightLength = rsNext.rise !== null ? rsNext.rise - rs.set : null;
    out.rahu = seg(PN_RAHU_PART[wd]); out.yama = seg(PN_YAMA_PART[wd]); out.gulika = seg(PN_GULI_PART[wd]);
    out.abhijit = [rs.rise + 7 * dl / 15, rs.rise + 8 * dl / 15];
    out.brahma = [rs.rise - 96 / 1440, rs.rise - 48 / 1440];
    let h = null;
    if (jd >= rs.rise && jd < rs.set) h = Math.floor((jd - rs.rise) / (dl / 12));
    else if (jd >= rs.set && out.nightLength) h = 12 + Math.min(11, Math.floor((jd - rs.set) / (out.nightLength / 12)));
    if (h !== null) out.hora = PN_CHALDEAN[(PN_CHALDEAN.indexOf(vara.lord) + h) % 7];
  }
  // Lunar month (Amanta): named from the Sun's sidereal sign at the preceding new moon; Adhika if the Sun stays in one sign
  const nmPrev = pnBoundary(pnDiff, jd, 360, -1, 0.25), nmNext = pnBoundary(pnDiff, jd, 360, +1, 0.25);
  const s1 = getSignIndex(getSiderealLongitudeAt('Sun', nmPrev)), s2 = getSignIndex(getSiderealLongitudeAt('Sun', nmNext));
  const mi = (s1 + 1) % 12, gm = lp.m;
  out.masa = { name: PN_MASA[mi], adhika: s1 === s2, newMoonPrev: nmPrev, newMoonNext: nmNext, shaka: (gm <= 4 && mi >= 8) ? lp.y - 79 : lp.y - 78 };
  const tl = sunLongitude(jd); out.ayana = (tl >= 270 || tl < 90) ? 'Uttarayana' : 'Dakshinayana';
  return out;
}


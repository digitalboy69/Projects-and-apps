/* ============================================================================
   DIVISIONAL TRANSIT TIMING ENGINE
   Powers the "Transit Timer" and "Sandhi Table" tabs: given any body (a graha
   or the Ascendant) and any varga (D1-D144), finds precisely when it entered
   its current division and when it will leave — using real evaluated motion
   (adaptive scan + bisection on the body's actual longitude function), not a
   flat linear guess, so retrograde loops and speed changes are respected.
   ============================================================================ */

// Julian Day -> JS UTC Date (Meeus algorithm), the inverse of toJulianDay().
function jdToDate(jd){
  const jdShifted = jd + 0.5;
  const Z = Math.floor(jdShifted);
  const F = jdShifted - Z;
  let A = Z;
  if (Z >= 2299161){
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const dayFrac = B - D - Math.floor(30.6001 * E) + F;
  const day = Math.floor(dayFrac);
  const month = (E < 14) ? E - 1 : E - 13;
  const year = (month > 2) ? C - 4716 : C - 4715;
  const hoursFrac = (dayFrac - day) * 24;
  const hours = Math.floor(hoursFrac + 1e-7);
  const minutesFrac = (hoursFrac - hours) * 60;
  const minutes = Math.floor(minutesFrac + 1e-5);
  const secondsFrac = (minutesFrac - minutes) * 60;
  const seconds = Math.round(secondsFrac);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, Math.min(seconds, 59)));
}

// Julian Day (UT) for the real current moment.
function nowJulianDay(){
  const now = new Date();
  return toJulianDay(now.getUTCFullYear(), now.getUTCMonth()+1, now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds() + now.getUTCMilliseconds()/1000);
}

// A JD, rendered as a wall-clock date/time string at a fixed UTC offset (the
// same "local time" convention used everywhere else in this app).
function jdToLocalParts(jd, tzOffsetHours){
  const utcDate = jdToDate(jd);
  const local = new Date(utcDate.getTime() + tzOffsetHours*3600*1000);
  const pad2 = n => String(n).padStart(2,'0');
  return {
    dateStr: `${local.getUTCFullYear()}-${pad2(local.getUTCMonth()+1)}-${pad2(local.getUTCDate())}`,
    timeStr: `${pad2(local.getUTCHours())}:${pad2(local.getUTCMinutes())}:${pad2(local.getUTCSeconds())}`,
  };
}

// Signed angular difference a-b, wrapped into (-180, 180].
function angDiffSigned(a, b){
  let d = a - b;
  d = ((d + 180) % 360 + 360) % 360 - 180;
  return d;
}

// Finds the JD at which lonFn(jd) crosses boundaryDeg, searching away from
// nowJD in the given direction (+1 = future, -1 = past). dtLinearGuess (days,
// positive) sizes the initial search window; if the crossing isn't found
// there (e.g. a slow outer planet stationed near the boundary), the search
// widens geometrically. Returns null if nothing is found within ~600 days.
function findBoundaryCrossingJD(lonFn, nowJD, boundaryDeg, direction, dtLinearGuess){
  const err = (jd) => angDiffSigned(lonFn(jd), boundaryDeg);
  const e0 = err(nowJD);
  if (Math.abs(e0) < 1e-9) return nowJD;

  let segStart = nowJD;
  let windowSize = Math.max(dtLinearGuess * 1.4, 0.0007); // floor ~1 minute
  const maxTotal = 4500; // days (slow planets can sit in one sign/division for ~3 years, with retrograde loops)
  let totalSearched = 0;
  let bracketLo = null, bracketHi = null;

  while (totalSearched < maxTotal){
    const segEnd = segStart + direction * windowSize;
    const substeps = 50;
    let prevJD = segStart, prevErr = err(segStart);
    for (let i=1;i<=substeps;i++){
      const jd = segStart + (segEnd - segStart) * i / substeps;
      const e = err(jd);
      if ((prevErr >= 0 && e < 0) || (prevErr <= 0 && e > 0)){
        bracketLo = Math.min(prevJD, jd); bracketHi = Math.max(prevJD, jd);
        break;
      }
      prevJD = jd; prevErr = e;
    }
    if (bracketLo !== null) break;
    totalSearched += windowSize;
    segStart = segEnd;
    windowSize *= 1.8;
  }
  if (bracketLo === null) return null;

  let lo = bracketLo, hi = bracketHi;
  const signAtLo = err(lo) >= 0;
  for (let i=0;i<50;i++){
    const mid = (lo+hi)/2;
    const eMid = err(mid);
    if ((eMid >= 0) === signAtLo) lo = mid; else hi = mid;
  }
  return (lo+hi)/2;
}

// Given a body ("Ascendant" or one of the 9 grahas) and a varga key ("D1".."D60"),
// computes: current division, when it was entered, when it will be left, and
// how much time remains — using the body's true evaluated motion.
function computeDivisionTiming(bodyName, vargaKey, lat, lon){
  const nowJD = nowJulianDay();
  const lonFn = bodyName === "Ascendant"
    ? (jd) => normDeg(ascendantLongitude(jd, lat, lon) - lahiriAyanamsa(jd))
    : (jd) => getSiderealLongitudeAt(bodyName, jd);

  const currentLon = lonFn(nowJD);
  const n = VARGAS[vargaKey].n;
  const width = 30 / n;
  const divIndexAbs = Math.floor((currentLon + 1e-9) / width);
  const lowerB = divIndexAbs * width;
  const upperB = (divIndexAbs + 1) * width;

  let speed;
  if (bodyName === "Ascendant"){
    const dt = 0.0007;
    let l1 = lonFn(nowJD - dt), l2 = lonFn(nowJD + dt);
    let diff = l2 - l1;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    speed = diff / (2*dt);
  } else {
    speed = getPlanetSpeed(bodyName, nowJD);
  }
  const retrograde = speed < 0;
  const absSpeed = Math.max(Math.abs(speed), 0.00005);

  // A retrograde-prone body can leave its division in EITHER direction, so "next change" is the earlier of the two
  // boundary crossings ahead of now, and "entered" is the most recent crossing behind now (not just the one in the
  // direction of current motion).
  const nextBoundary = retrograde ? lowerB : upperB;
  const enteredBoundary = retrograde ? upperB : lowerB;
  const dtNextLinear = Math.abs(nextBoundary - currentLon) / absSpeed;
  const dtEnteredLinear = Math.abs(currentLon - enteredBoundary) / absSpeed;
  const dtUp = Math.abs(upperB - currentLon) / absSpeed, dtLo = Math.abs(currentLon - lowerB) / absSpeed;
  const cl = x => Math.min(x, 30);   // near a station the speed is ~0, so cap the search window or crossings get skipped
  const futs = [findBoundaryCrossingJD(lonFn, nowJD, upperB, +1, cl(dtUp)), findBoundaryCrossingJD(lonFn, nowJD, lowerB, +1, cl(dtLo))].filter(x => x !== null);
  const jdNext = futs.length ? Math.min(...futs) : null;
  const pastU = findBoundaryCrossingJD(lonFn, nowJD, upperB, -1, cl(dtUp)), pastL = findBoundaryCrossingJD(lonFn, nowJD, lowerB, -1, cl(dtLo));
  const pasts = [pastU, pastL].filter(x => x !== null);
  const jdEnteredRaw = pasts.length ? Math.max(...pasts) : null;
  const enteredViaUpper = jdEnteredRaw !== null && jdEnteredRaw === pastU;
  const jdEntered = jdEnteredRaw !== null ? jdEnteredRaw : (nowJD - (retrograde ? -dtEnteredLinear : dtEnteredLinear));

  // One more division back: search further into the past from jdEntered for
  // the boundary before the one just found, using the same local width as a
  // search-window guess (division widths change gradually, so this is a good
  // starting bracket — the actual crossing is still found by real evaluation).
  const beforeBoundary = (jdEnteredRaw !== null ? enteredViaUpper : retrograde) ? (upperB + width) : (lowerB - width);
  const jdBeforeRaw = findBoundaryCrossingJD(lonFn, jdEntered, beforeBoundary, -1, cl(dtEnteredLinear));
  const jdBefore = jdBeforeRaw !== null ? jdBeforeRaw : (jdEntered - dtEnteredLinear);

  const signIdx = getSignIndex(currentLon);
  const degInSign = getDegInSign(currentLon);
  const divWithinSign = Math.floor((degInSign + 1e-9) / width) + 1; // 1..n
  const vargaSignIdx = calcVarga(vargaKey, currentLon);

  return {
    bodyName, vargaKey, n, width, currentLon, signIdx, degInSign,
    divIndexAbs, divWithinSign, vargaSignIdx, lowerB, upperB,
    speed, retrograde,
    nowJD,
    jdNext: jdNext !== null ? jdNext : (nowJD + (retrograde ? -dtNextLinear : dtNextLinear)),
    jdEntered, jdBefore,
    remainingDays: (jdNext !== null ? jdNext : (nowJD + dtNextLinear)) - nowJD,
    sinceDays: nowJD - jdEntered,
  };
}

// Given a birth moment (JD, UT) and a birth location, finds the precise start
// and end time of the D1 Ascendant sign that was rising at that exact moment —
// e.g. "Leo was rising from 1:02:44 to 3:19:01". Anchored to the birth time,
// not to "now".
function computeAscendantD1Window(lat, lon, birthJD){
  const lonFn = (jd) => normDeg(ascendantLongitude(jd, lat, lon) - lahiriAyanamsa(jd));
  const birthLon = lonFn(birthJD);
  const d1SignIdx = getSignIndex(birthLon);
  const d1Lower = d1SignIdx * 30, d1Upper = d1SignIdx * 30 + 30;

  const dt = 0.0007;
  let l1 = lonFn(birthJD - dt), l2 = lonFn(birthJD + dt);
  let diff = l2 - l1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  const speed = diff / (2*dt);
  const absSpeed = Math.max(Math.abs(speed), 1e-5);

  const dtEnteredGuess = Math.abs(birthLon - d1Lower) / absSpeed;
  const dtExitGuess = Math.abs(d1Upper - birthLon) / absSpeed;
  const jdD1Start = findBoundaryCrossingJD(lonFn, birthJD, d1Lower, -1, dtEnteredGuess) ?? (birthJD - dtEnteredGuess);
  const jdD1End = findBoundaryCrossingJD(lonFn, birthJD, d1Upper, +1, dtExitGuess) ?? (birthJD + dtExitGuess);

  return { lonFn, birthLon, d1SignIdx, d1Lower, d1Upper, jdD1Start, jdD1End, speed };
}

// For the selected varga, walks the ENTIRE D1 Ascendant window found above
// (from its precise start to its precise end) and lists out every single
// division inside it in order — e.g. for D9, all 9 slices of that ~2h window,
// each with its own precise start time, end time, and resulting varga sign —
// marking whichever slice the exact birth moment falls into.
function computeVargaTimelineForD1Window(vargaKey, lat, lon, birthJD){
  const w = computeAscendantD1Window(lat, lon, birthJD);
  const n = VARGAS[vargaKey].n;
  const width = 30 / n;
  const startIndexAbs = Math.round(w.d1Lower / width);

  const rows = [];
  let curJD = w.jdD1Start;
  for (let i=0; i<n; i++){
    const divIndexAbs = startIndexAbs + i;
    const divUpperDeg = (divIndexAbs + 1) * width;
    let divEndJD;
    if (i === n-1){
      divEndJD = w.jdD1End; // last slice always closes exactly at the D1 exit time
    } else {
      const guessDt = (w.jdD1End - curJD) / (n - i);
      divEndJD = findBoundaryCrossingJD(w.lonFn, curJD, divUpperDeg, +1, guessDt) ?? (curJD + guessDt);
    }
    const vargaSignIdx = calcVarga(vargaKey, divIndexAbs*width + width/2);
    const containsBirth = birthJD >= curJD - 1e-9 && birthJD <= divEndJD + 1e-9;
    rows.push({ index: i+1, startJD: curJD, endJD: divEndJD, vargaSignIdx, containsBirth });
    curJD = divEndJD;
  }
  return { ...w, n, width, rows };
}

// Formats a duration in days as a compact human string ("2h 14m 08s", "3d 6h").
function formatDurationHMS(days){
  const totalSeconds = Math.max(0, Math.round(Math.abs(days) * 86400));
  const d = Math.floor(totalSeconds/86400);
  const h = Math.floor((totalSeconds%86400)/3600);
  const m = Math.floor((totalSeconds%3600)/60);
  const s = totalSeconds%60;
  if (d > 0) return `${d}d ${h}h ${String(m).padStart(2,'0')}m`;
  if (h > 0) return `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
  if (m > 0) return `${m}m ${String(s).padStart(2,'0')}s`;
  return `${s}s`;
}

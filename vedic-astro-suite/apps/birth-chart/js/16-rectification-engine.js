/* ============================================================================
   BIRTH TIME RECTIFICATION — lightweight per-second Ascendant/D60 scan.
   Computes only what shifts second-to-second (Ascendant + Moon sidereal
   longitude) rather than a full computeChart(), so hundreds/thousands of
   candidate seconds can be scanned interactively without recomputing all
   twenty divisional charts, Shadbala, dashas, etc. for every candidate.
   ============================================================================ */
function rectifyPoint(dateStr, timeStr, lat, lon, tzOffsetHours){
  const [year,month,day] = dateStr.split("-").map(Number);
  const [hour,minute,second] = timeStr.split(":").map(Number);
  const sec = second || 0;
  const localJD = toJulianDay(year,month,day,hour,minute,sec);
  const jd = localJD - tzOffsetHours/24;
  const ayanamsa = lahiriAyanamsa(jd);
  const ascSidereal = normDeg(ascendantLongitude(jd, lat, lon) - ayanamsa);
  const moonSidereal = normDeg(moonLongitude(jd) - ayanamsa);
  const ascD60Part = Math.floor(getDegInSign(ascSidereal)/0.5); // 0..59 -> amsa # within sign
  const moonD60Part = Math.floor(getDegInSign(moonSidereal)/0.5);
  return {
    dateStr, timeStr, jd,
    asc: { longitude: ascSidereal, sign: getSignIndex(ascSidereal), degInSign: getDegInSign(ascSidereal),
           nak: getNakshatra(ascSidereal), d60Sign: calcVarga("D60", ascSidereal), d60Amsa: ascD60Part+1 },
    moon: { longitude: moonSidereal, sign: getSignIndex(moonSidereal), degInSign: getDegInSign(moonSidereal),
            nak: getNakshatra(moonSidereal), d60Sign: calcVarga("D60", moonSidereal), d60Amsa: moonD60Part+1 }
  };
}

function shiftLocalDateTime(dateStr, timeStr, offsetSeconds){
  const [year,month,day] = dateStr.split("-").map(Number);
  const [hour,minute,second] = timeStr.split(":").map(Number);
  const base = new Date(Date.UTC(year, month-1, day, hour, minute, second||0));
  const t = new Date(base.getTime() + offsetSeconds*1000);
  const d2 = `${t.getUTCFullYear()}-${String(t.getUTCMonth()+1).padStart(2,'0')}-${String(t.getUTCDate()).padStart(2,'0')}`;
  const t2 = `${String(t.getUTCHours()).padStart(2,'0')}:${String(t.getUTCMinutes()).padStart(2,'0')}:${String(t.getUTCSeconds()).padStart(2,'0')}`;
  return { dateStr: d2, timeStr: t2 };
}


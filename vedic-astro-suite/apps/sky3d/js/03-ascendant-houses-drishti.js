/* ============================================================================
   ASCENDANT (LAGNA) + HOUSES + GRAHA DRISHTI (VEDIC ASPECTS)
   ============================================================================ */
function siderealAscendant(jd, lat, lon){
  const T = (jd-J2000)/36525.0;
  let gmst = 280.46061837 + 360.98564736629*(jd-J2000) + 0.000387933*T*T - (T*T*T)/38710000.0;
  gmst = normDeg(gmst);
  const lst = normDeg(gmst + lon);
  const ramc = lst*DEG;
  const eps = (23.4392911 - 0.0130042*T)*DEG;
  const phi = lat*DEG;
  const y = -Math.cos(ramc);
  const x = Math.sin(ramc)*Math.cos(eps) + Math.tan(phi)*Math.sin(eps);
  // atan2(-cos, sin·cosε + tanφ·sinε) is the ascendant minus 180°, for EVERY sidereal time (the old code added the 180°
  // only when cos(RAMC) > 0, which put the ascendant exactly opposite for ~half of each day).
  let ascTropical = normDeg(Math.atan2(y,x)*RAD + 180);
  const ayan = lahiriAyanamsa(jd);
  return normDeg(ascTropical - ayan);
}

function getHouseOfLongitude(lon, lagnaSignIdx){
  const signIdx = getSignIndex(lon);
  return ((signIdx - lagnaSignIdx + 12) % 12) + 1;
}

const ASPECT_OFFSETS = {
  Sun: [7], Moon: [7], Mercury: [7], Venus: [7],
  Mars: [4,7,8],
  Jupiter: [5,7,9],
  Saturn: [3,7,10],
  Rahu: [5,7,9],
  Ketu: [5,7,9]
};
function computeAspects(sidereal){
  const results = [];
  PLANET_LIST.forEach(from=>{
    const fromSign = getSignIndex(sidereal[from]);
    const offsets = ASPECT_OFFSETS[from] || [7];
    offsets.forEach(off=>{
      const targetSign = (fromSign + (off-1)) % 12;
      PLANET_LIST.forEach(to=>{
        if (to===from) return;
        if (getSignIndex(sidereal[to]) === targetSign){
          results.push({ from, to, houseOffset: off, sign: targetSign });
        }
      });
    });
  });
  return results;
}


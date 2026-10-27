/* ----------------------------------------------------------------------------
   ASPECT EXPLORER — resolve "what does X aspect" / "what aspects X" for
   either a planet or a bare sign, in both directions.
   mode: 'planet' | 'sign'
   ---------------------------------------------------------------------------- */
function explorePlanetAspects(sidereal, planetName){
  const fromSign = getSignIndex(sidereal[planetName]);
  const offsets = ASPECT_OFFSETS[planetName] || [7];
  // Signs & planets this planet aspects (outgoing)
  const throwsTo = offsets.map(off=>{
    const targetSign = (fromSign + (off-1)) % 12;
    const occupants = PLANET_LIST.filter(p => p!==planetName && getSignIndex(sidereal[p])===targetSign);
    return { houseOffset: off, sign: targetSign, occupants };
  });
  // Planets that aspect this planet's sign (incoming)
  const receivesFrom = [];
  PLANET_LIST.forEach(other=>{
    if (other===planetName) return;
    const otherSign = getSignIndex(sidereal[other]);
    const otherOffsets = ASPECT_OFFSETS[other] || [7];
    otherOffsets.forEach(off=>{
      const targetSign = (otherSign + (off-1)) % 12;
      if (targetSign===fromSign){
        receivesFrom.push({ from: other, houseOffset: off });
      }
    });
  });
  return { planetName, fromSign, throwsTo, receivesFrom };
}

function exploreSignAspects(sidereal, signIdx){
  // Planets that aspect this sign (incoming), from wherever they sit
  const aspectedBy = [];
  PLANET_LIST.forEach(p=>{
    const pSign = getSignIndex(sidereal[p]);
    const offsets = ASPECT_OFFSETS[p] || [7];
    offsets.forEach(off=>{
      const targetSign = (pSign + (off-1)) % 12;
      if (targetSign===signIdx){
        aspectedBy.push({ from: p, fromSign: pSign, houseOffset: off });
      }
    });
  });
  // Planets currently occupying this sign, and what they in turn aspect out
  const occupants = PLANET_LIST.filter(p=> getSignIndex(sidereal[p])===signIdx);
  const occupantsThrow = occupants.map(p=>{
    const offsets = ASPECT_OFFSETS[p] || [7];
    const targets = offsets.map(off=> ({ houseOffset: off, sign: (signIdx + (off-1)) % 12 }));
    return { planet: p, targets };
  });
  return { signIdx, aspectedBy, occupants, occupantsThrow };
}
function computeNatalAscendant(profile){
  const natalJD = toJulianDay(...parseDob(profile.dob), ...profile.tob.split(':').map(Number), 0) - profile.tz/24;
  return { jd: natalJD, lagnaLon: siderealAscendant(natalJD, profile.lat, profile.lon) };
}


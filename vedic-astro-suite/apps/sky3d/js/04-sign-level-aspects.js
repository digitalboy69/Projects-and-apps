/* ----------------------------------------------------------------------------
   SIGN-LEVEL ASPECTS (Rashi Drishti) — every planet aspects certain *signs*
   by its graha-drishti offsets, whether or not another planet currently sits
   there. This is the "exactly which area (sign) each planet is aspecting
   right now" view: one row per planet → every sign it currently throws its
   gaze onto, independent of occupancy.
   ---------------------------------------------------------------------------- */
function computeSignAspects(sidereal){
  const results = [];
  PLANET_LIST.forEach(from=>{
    const fromSign = getSignIndex(sidereal[from]);
    const offsets = ASPECT_OFFSETS[from] || [7];
    offsets.forEach(off=>{
      const targetSign = (fromSign + (off-1)) % 12;
      const occupants = PLANET_LIST.filter(p => p!==from && getSignIndex(sidereal[p])===targetSign);
      results.push({ from, fromSign, houseOffset: off, targetSign, occupants });
    });
  });
  return results;
}


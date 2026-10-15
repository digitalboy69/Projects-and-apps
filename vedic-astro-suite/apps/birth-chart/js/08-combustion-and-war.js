
const COMBUSTION_ORBS = { Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15 };
const COMBUSTION_ORBS_RETRO = { Mercury: 12, Venus: 8, Mars: 8 };

function getCombustion(name, planetLon, sunLon, retrograde){
  if (name==="Sun" || name==="Rahu" || name==="Ketu" || name==="Moon" && false) {}
  if (!(name in COMBUSTION_ORBS)) return { combust:false };
  let orb = COMBUSTION_ORBS[name];
  if (retrograde && COMBUSTION_ORBS_RETRO[name]) orb = COMBUSTION_ORBS_RETRO[name];
  const sep = Math.abs(angDiffLocal(planetLon, sunLon));
  return { combust: sep <= orb, separation: sep, orb };
}
function angDiffLocal(a,b){ let d = normDeg(a-b); if (d>180) d -= 360; return Math.abs(d); }

const WAR_ELIGIBLE = ["Mars","Mercury","Jupiter","Venus","Saturn"];
function findPlanetaryWars(siderealLongitudes){
  const wars = [];
  for (let i=0;i<WAR_ELIGIBLE.length;i++){
    for (let j=i+1;j<WAR_ELIGIBLE.length;j++){
      const a = WAR_ELIGIBLE[i], b = WAR_ELIGIBLE[j];
      const sep = angDiffLocal(siderealLongitudes[a], siderealLongitudes[b]);
      if (sep <= 1.0){
        const winner = normDeg(siderealLongitudes[a]) < normDeg(siderealLongitudes[b]) ? a : b;
        wars.push({ planetA:a, planetB:b, separation:sep, winner });
      }
    }
  }
  return wars;
}

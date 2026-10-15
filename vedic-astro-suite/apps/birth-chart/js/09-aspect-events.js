
const SPECIAL_ASPECTS = { Mars: [4,8], Jupiter: [5,9], Saturn: [3,10] };
function getAspectedHouses(name, houseOfPlanet){
  const houses = new Set();
  houses.add(((houseOfPlanet-1+6)%12)+1);
  if (SPECIAL_ASPECTS[name]){
    SPECIAL_ASPECTS[name].forEach(offset=>{
      houses.add(((houseOfPlanet-1+offset-1)%12)+1);
    });
  }
  return [...houses].sort((a,b)=>a-b);
}

function angleErrorForTarget(lonA, lonB, targetAngle){
  let diff = normDeg(lonA - lonB);
  let error = diff - targetAngle;
  error = ((error + 180) % 360 + 360) % 360 - 180;
  return error;
}

function findAspectEventsInRange(bodyA, bodyB, targetAngle, startJD, endJD, stepDays){
  stepDays = stepDays || 1;
  const events = [];
  let jd = startJD;
  let prevErr = angleErrorForTarget(getSiderealLongitudeAt(bodyA,jd), getSiderealLongitudeAt(bodyB,jd), targetAngle);
  jd += stepDays;
  while (jd <= endJD){
    const err = angleErrorForTarget(getSiderealLongitudeAt(bodyA,jd), getSiderealLongitudeAt(bodyB,jd), targetAngle);
    if ((prevErr>0 && err<=0) || (prevErr<0 && err>=0)){
      if (Math.abs(prevErr) < 90 && Math.abs(err) < 90){
        let lo = jd-stepDays, hi = jd;
        for (let iter=0; iter<40; iter++){
          const mid = (lo+hi)/2;
          const e = angleErrorForTarget(getSiderealLongitudeAt(bodyA,mid), getSiderealLongitudeAt(bodyB,mid), targetAngle);
          if ((e>0)===(prevErr>0)) lo=mid; else hi=mid;
        }
        events.push({ jd: hi });
      }
    }
    prevErr = err;
    jd += stepDays;
  }
  return events;
}

function stepDaysForPair(bodyA, bodyB){
  const fast = ["Moon"];
  if (fast.includes(bodyA) || fast.includes(bodyB)) return 0.5;
  const medium = ["Sun","Mercury","Venus","Mars"];
  if (medium.includes(bodyA) || medium.includes(bodyB)) return 1;
  return 2;
}

function findNearestAspectForPair(bodyA, bodyB, targetAngle, referenceJD, maxSearchDays){
  maxSearchDays = maxSearchDays || 3650;
  const stepDays = stepDaysForPair(bodyA, bodyB);
  const future = findAspectEventsInRange(bodyA, bodyB, targetAngle, referenceJD, referenceJD+maxSearchDays, stepDays);
  const past = findAspectEventsInRange(bodyA, bodyB, targetAngle, referenceJD-maxSearchDays, referenceJD, stepDays);
  return { next: future.length ? future[0] : null, previous: past.length ? past[past.length-1] : null };
}

const WESTERN_ASPECTS = [
  { name:"Conjunction", angle:0, symbol:"☌", orb:8 },
  { name:"Sextile", angle:60, symbol:"⚹", orb:6 },
  { name:"Square", angle:90, symbol:"□", orb:8 },
  { name:"Trine", angle:120, symbol:"△", orb:8 },
  { name:"Opposition", angle:180, symbol:"☍", orb:8 }
];

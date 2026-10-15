/* ============================================================================
   PLANET DETAIL HELPERS — degree-in-sign, nakshatra pada, instantaneous speed,
   and sign ingress/egress (exact crossing time) via binary search.
   ============================================================================ */
function degreeInSign(lon){
  const d = normDeg(lon) % 30;
  const deg = Math.floor(d);
  const minFloat = (d-deg)*60;
  const min = Math.floor(minFloat);
  const sec = Math.round((minFloat-min)*60);
  return { deg, min, sec, raw:d };
}
function getPadaIndex(lon){
  const nakSpan = 360/27; // 13.3333...
  const posInNak = normDeg(lon) % nakSpan;
  return Math.min(3, Math.floor(posInNak / (nakSpan/4))); // 0-3 -> pada 1-4
}
// Instantaneous speed in degrees/day (signed; negative = retrograde), central difference.
function planetSpeed(name, jd){
  const l1 = siderealLongitude(name, jd-0.25);
  const l2 = siderealLongitude(name, jd+0.25);
  let diff = l2-l1;
  if (diff>180) diff-=360; if (diff<-180) diff+=360;
  return diff*2; // per day
}
function speedCategory(name, jd){
  const s = Math.abs(planetSpeed(name,jd));
  if (name==="Rahu"||name==="Ketu") return "Steady (mean node)";
  if (s > 1.0) return "Fast";
  if (s > 0.3) return "Moderate";
  if (s > 0.02) return "Slow";
  return "Near-stationary";
}
// Find the JD (within +-searchDays of centerJD) at which `name` crosses the given
// absolute ecliptic longitude boundary (0-360, sidereal). Uses bisection on the
// signed angular distance to the boundary, assuming a single monotonic crossing
// in the search window (true for direct motion; for retrograde loops we search
// a narrower window seeded from the nearest crossing guess).
function findLongitudeCrossing(name, boundaryLon, guessJD, searchDays){
  function angDist(jd){
    let d = normDeg(siderealLongitude(name,jd) - boundaryLon);
    if (d>180) d-=360;
    return d; // negative = before boundary, positive = past it (in the body's direction of travel)
  }
  let lo = guessJD - searchDays, hi = guessJD + searchDays;
  let dLo = angDist(lo), dHi = angDist(hi);
  // opposite signs with large |d| is the ±180° wrap, not a crossing of the boundary
  if (Math.sign(dLo)===Math.sign(dHi) || Math.abs(dLo)>=90 || Math.abs(dHi)>=90){
    // Scan in reasonably fine steps to bracket the true crossing, since retrograde
    // loops can cross the same boundary more than once within the window.
    const steps = 200;
    const stepSize = (2*searchDays)/steps;
    let prevJD = lo, prevD = dLo;
    let found = false;
    for (let i=1;i<=steps;i++){
      const jd = lo + i*stepSize;
      const d = angDist(jd);
      if (Math.sign(d)!==Math.sign(prevD) && Math.abs(d)<90 && Math.abs(prevD)<90){ lo=prevJD; hi=jd; dLo=prevD; dHi=d; found=true; break; }
      prevJD=jd; prevD=d;
    }
    if (!found) return null;
  }
  for (let i=0;i<60;i++){
    const mid = (lo+hi)/2;
    const dMid = angDist(mid);
    if (Math.sign(dMid)===Math.sign(dLo)){ lo=mid; dLo=dMid; } else { hi=mid; dHi=dMid; }
    if (Math.abs(hi-lo) < 0.0001) break; // ~8.6 sec precision
  }
  return (lo+hi)/2;
}
// Returns { enterJD, exitJD, daysIn, daysLeft } for the sign that `name` occupies at jd.
// Rahu/Ketu move continuously retrograde (westward through the zodiac), so "enter" is
// the higher-longitude boundary and "exit" is the lower-longitude boundary, chronologically.
// enterJD/exitJD may be null if not found within the search window — caller handles gracefully.
/* Edges of the CURRENT continuous stay of `name` inside whatever zone idxFn() says it is in (sign or nakshatra):
   walk outward from jd until the zone changes, then bisect to the exact moment. Works through retrograde loops
   (the old boundary-crossing search could lock onto a crossing 180° away or from an earlier lap). */
function stayEdges(name, jd, idxFn, maxDays){
  const step = name==="Moon" ? 0.05 : (name==="Jupiter" ? 0.5 : (name==="Saturn" ? 1 : ((name==="Rahu"||name==="Ketu") ? 2 : 0.25)));
  const z0 = idxFn(siderealLongitude(name, jd));
  maxDays = maxDays || 16000;
  function edge(dir){
    let prev = jd;
    for (let d=step; d<=maxDays; d+=step){
      const cur = jd + dir*d;
      if (idxFn(siderealLongitude(name, cur)) !== z0){
        let inside = prev, outside = cur;
        for (let i=0;i<50 && Math.abs(outside-inside)>1e-7;i++){
          const mid = (inside+outside)/2;
          if (idxFn(siderealLongitude(name, mid)) === z0) inside = mid; else outside = mid;
        }
        return (inside+outside)/2;
      }
      prev = cur;
    }
    return null;
  }
  return { enterJD: edge(-1), exitJD: edge(1) };
}
// Returns { enterJD, exitJD, daysIn, daysLeft } for the sign that `name` occupies at jd (null = not found in range).
function getSignOccupancy(name, jd){
  const signIdx = getSignIndex(siderealLongitude(name, jd));
  const e = stayEdges(name, jd, getSignIndex);
  return { enterJD:e.enterJD, exitJD:e.exitJD,
           daysIn: e.enterJD!=null ? (jd-e.enterJD) : null,
           daysLeft: e.exitJD!=null ? (e.exitJD-jd) : null, signIdx };
}

function findIngresses(name,startJD,endJD){
  const events=[];
  const stepDays = name==="Moon" ? 0.5 : (Math.abs(AVG_DAILY_MOTION[name])>0.3 ? 1 : 2);
  let prevJD=startJD, prevSign=getSignIndex(siderealLongitude(name,prevJD));
  let jd=startJD+stepDays;
  while (jd<=endJD){
    const sign=getSignIndex(siderealLongitude(name,jd));
    if (sign!==prevSign){
      let lo=prevJD, hi=jd;
      for (let iter=0; iter<40; iter++){
        const mid=(lo+hi)/2;
        if (getSignIndex(siderealLongitude(name,mid))===prevSign) lo=mid; else hi=mid;
      }
      events.push({ jd:hi, fromSign:prevSign, toSign:getSignIndex(siderealLongitude(name,hi+0.001)) });
    }
    prevSign=sign; prevJD=jd; jd+=stepDays;
  }
  return events;
}

function findConjunctions(bodyA,bodyB,startJD,endJD,orb){
  orb = orb || 1.0;
  const events=[];
  const stepDays=1;
  let jd=startJD;
  let prevDiff=angDiff(siderealLongitude(bodyA,jd), siderealLongitude(bodyB,jd));
  jd+=stepDays;
  while (jd<=endJD){
    const diff=angDiff(siderealLongitude(bodyA,jd), siderealLongitude(bodyB,jd));
    // |diff|<90 on both sides: angDiff also flips sign when the bodies are 180° apart (opposition) - not a conjunction.
    if (((prevDiff>0&&diff<=0)||(prevDiff<0&&diff>=0)) && Math.abs(prevDiff)<90 && Math.abs(diff)<90){
      let lo=jd-stepDays, hi=jd;
      for (let iter=0; iter<40; iter++){
        const mid=(lo+hi)/2;
        const dmid=angDiff(siderealLongitude(bodyA,mid), siderealLongitude(bodyB,mid));
        if ((dmid>0)===(prevDiff>0)) lo=mid; else hi=mid;
      }
      const lon=siderealLongitude(bodyA,hi);
      events.push({ jd:hi, sign:getSignIndex(lon), longitude:lon });
    }
    prevDiff=diff; jd+=stepDays;
  }
  return events;
}


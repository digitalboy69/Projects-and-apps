/* ---- Full position snapshot at a given JD (for 3D rendering + sky table) ---- */
function snapshotPositions(jd){
  const ayan = lahiriAyanamsa(jd);
  const helio = {};
  ["mercury","venus","mars","jupiter","saturn","uranus","neptune","pluto"].forEach(k=> helio[k]=planetHeliocentric(k,jd));
  const earth = earthHeliocentric(jd);
  const sidereal = {};
  ALL_BODIES.forEach(name=> sidereal[name] = siderealLongitude(name,jd));
  const retro = {};
  ALL_BODIES.forEach(name=> retro[name] = isRetrograde(name,jd));
  return { jd, ayanamsa: ayan, helio, earth, sidereal, retro };
}

/* ============================================================================
   3D SCENE — dual mode: Heliocentric solar system / Geocentric zodiac wheel
   ============================================================================ */
let scene, camera, renderer, clock3d;
const mode = "geo"; // Zodiac Wheel only
let orbitAngleTheta = 0.55, orbitAnglePhi = 1.15, orbitDist = 26;
let isDragging=false, lastPointer={x:0,y:0};
let pointerDownPos = null;
let autoRotate = true;
let needsRender = true;
const isMobile = window.innerWidth < 720 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
function markDirty(){ needsRender = true; }


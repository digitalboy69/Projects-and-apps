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
/* Wheel framing: on a tall phone screen the old fixed distance (26) showed only the middle of the ring, so the distance is worked out
   from the screen shape. The outer sign ring is about 15 units across from the centre; we leave a small margin on each side. */
function wheelFitDist(){
  try {
    const vp = document.querySelector('.viewport'), a = vp && vp.clientHeight ? vp.clientWidth / vp.clientHeight : 1.6;
    if (a >= 1) return 26;
    const t = Math.tan(25 * Math.PI / 180), byWidth = 17.5 / (t * a);
    const B = window.wheelBand ? window.wheelBand() : null, phi = wheelFitPhi();
    const byHeight = B ? (32 * Math.cos(phi) + 5) / (2 * t * B.h / B.H) : 0;   // the tilted ring (plus its labels) must also fit the free band
    return Math.max(26, Math.min(100, Math.max(byWidth, byHeight)));
  } catch (e) { return 26; }
}
function wheelFitPhi(){ try { const vp = document.querySelector('.viewport'); return vp && vp.clientWidth < vp.clientHeight ? 0.9 : 1.15; } catch (e) { return 1.15; } }
let orbitAngleTheta = 0.55, orbitAnglePhi = wheelFitPhi(), orbitDist = wheelFitDist();
let isDragging=false, lastPointer={x:0,y:0};
let pointerDownPos = null;
let autoRotate = true;
let needsRender = true;
const isMobile = window.innerWidth < 720 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
function markDirty(){ needsRender = true; }


/* ============================================================================
   ENGINE (embedded) — Sidereal Lahiri Vedic calculations
   ============================================================================ */
const DEG = Math.PI / 180, RAD = 180 / Math.PI, J2000 = 2451545.0;
function normDeg(d){ d = d % 360; return d < 0 ? d + 360 : d; }

/* ---- Delta-T: the Sun/Moon/planet series are written in dynamical time (TT) but birth times are Universal Time (UT).
   TT = UT + deltaT. Ignoring it put the Moon 20-55 arcsec behind (Moon moves ~0.55 deg/hour), which slides every dasha date by
   days. Model: Espenak & Meeus (NASA). The ascendant / sidereal time correctly stay in UT. Set EPH_DELTA_T = false to switch off. ---- */
const EPH_DELTA_T = true;
function deltaTSeconds(jd){
  const y = 2000 + (jd - 2451545.0) / 365.25;
  let t, u;
  if (y < -500){ u = (y - 1820) / 100; return -20 + 32*u*u; }
  if (y < 500){ u = y / 100; return 10583.6 - 1014.41*u + 33.78311*u*u - 5.952053*u**3 - 0.1798452*u**4 + 0.022174192*u**5 + 0.0090316521*u**6; }
  if (y < 1600){ u = (y - 1000) / 100; return 1574.2 - 556.01*u + 71.23472*u*u + 0.319781*u**3 - 0.8503463*u**4 - 0.005050998*u**5 + 0.0083572073*u**6; }
  if (y < 1700){ t = y - 1600; return 120 - 0.9808*t - 0.01532*t*t + t**3/7129; }
  if (y < 1800){ t = y - 1700; return 8.83 + 0.1603*t - 0.0059285*t*t + 0.00013336*t**3 - t**4/1174000; }
  if (y < 1860){ t = y - 1800; return 13.72 - 0.332447*t + 0.0068612*t*t + 0.0041116*t**3 - 0.00037436*t**4 + 0.0000121272*t**5 - 0.0000001699*t**6 + 0.000000000875*t**7; }
  if (y < 1900){ t = y - 1860; return 7.62 + 0.5737*t - 0.251754*t*t + 0.01680668*t**3 - 0.0004473624*t**4 + t**5/233174; }
  if (y < 1920){ t = y - 1900; return -2.79 + 1.494119*t - 0.0598939*t*t + 0.0061966*t**3 - 0.000197*t**4; }
  if (y < 1941){ t = y - 1920; return 21.20 + 0.84493*t - 0.076100*t*t + 0.0020936*t**3; }
  if (y < 1961){ t = y - 1950; return 29.07 + 0.407*t - t*t/233 + t**3/2547; }
  if (y < 1986){ t = y - 1975; return 45.45 + 1.067*t - t*t/260 - t**3/718; }
  if (y < 2005){ t = y - 2000; return 63.86 + 0.3345*t - 0.060374*t*t + 0.0017275*t**3 + 0.000651814*t**4 + 0.00002373599*t**5; }
  if (y < 2050){ t = y - 2000; return 62.92 + 0.32217*t + 0.005589*t*t; }
  if (y < 2150){ u = (y - 1820) / 100; return -20 + 32*u*u - 0.5628*(2150 - y); }
  u = (y - 1820) / 100; return -20 + 32*u*u;
}
function jdTT(jd){ return EPH_DELTA_T ? jd + deltaTSeconds(jd) / 86400 : jd; }   // ephemeris time from a UT Julian Day

function toJulianDay(year, month, day, hour, minute, second){
  /* Meeus: dates before 15 Oct 1582 are in the Julian calendar (the one in use then); later dates are Gregorian.
     `year` is astronomical (1 BC = 0, 2 BC = -1). Valid from -4712. */
  let Y = year, M = month;
  if (M <= 2) { Y -= 1; M += 12; }
  const greg = year > 1582 || (year === 1582 && (month > 10 || (month === 10 && day >= 15)));
  let B = 0;
  if (greg) { const A = Math.floor(Y / 100); B = 2 - A + Math.floor(A / 4); }
  const dayFrac = day + (hour + minute/60 + second/3600) / 24;
  return Math.floor(365.25*(Y+4716)) + Math.floor(30.6001*(M+1)) + dayFrac + B - 1524.5;
}

/* Birth-date strings: "YYYY-MM-DD" for years 1..9999, and the ISO expanded form "-000499-03-14" for years before year 0
   (astronomical numbering: "0000" is 1 BC, "-000499" is 500 BC). Always use this instead of split("-"). */
function parseDob(str){
  const m = /^([+-]?\d{4,6})-(\d{2})-(\d{2})/.exec(String(str || '').trim());
  if (!m) return { y: NaN, m: NaN, d: NaN };
  return { y: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) };
}
function formatDobStr(y, m, d){
  const p2 = n => String(n).padStart(2, '0');
  return (y < 0 ? '-' + String(-y).padStart(6, '0') : String(y).padStart(4, '0')) + '-' + p2(m) + '-' + p2(d);
}
/* ΔT = TT − UT in seconds (Espenak and Meeus, NASA polynomials). The series for the Sun, Moon and planets are in
   Terrestrial Time, so for ancient dates (when ΔT is hours) the clock time must be moved by ΔT. */
function deltaT(year, month){
  const y = year + ((month || 6) - 0.5) / 12;
  let t, u;
  if (y < -500) { u = (y - 1820) / 100; return -20 + 32 * u * u; }
  if (y < 500) { u = y / 100; return 10583.6 - 1014.41*u + 33.78311*u*u - 5.952053*u**3 - 0.1798452*u**4 + 0.022174192*u**5 + 0.0090316521*u**6; }
  if (y < 1600) { u = (y - 1000) / 100; return 1574.2 - 556.01*u + 71.23472*u*u + 0.319781*u**3 - 0.8503463*u**4 - 0.005050998*u**5 + 0.0083572073*u**6; }
  if (y < 1700) { t = y - 1600; return 120 - 0.9808*t - 0.01532*t*t + t**3 / 7129; }
  if (y < 1800) { t = y - 1700; return 8.83 + 0.1603*t - 0.0059285*t*t + 0.00013336*t**3 - t**4 / 1174000; }
  if (y < 1860) { t = y - 1800; return 13.72 - 0.332447*t + 0.0068612*t*t + 0.0041116*t**3 - 0.00037436*t**4 + 0.0000121272*t**5 - 0.0000001699*t**6 + 0.000000000875*t**7; }
  if (y < 1900) { t = y - 1860; return 7.62 + 0.5737*t - 0.251754*t*t + 0.01680668*t**3 - 0.0004473624*t**4 + t**5 / 233174; }
  if (y < 1920) { t = y - 1900; return -2.79 + 1.494119*t - 0.0598939*t*t + 0.0061966*t**3 - 0.000197*t**4; }
  if (y < 1941) { t = y - 1920; return 21.20 + 0.84493*t - 0.076100*t*t + 0.0020936*t**3; }
  if (y < 1961) { t = y - 1950; return 29.07 + 0.407*t - t*t / 233 + t**3 / 2547; }
  if (y < 1986) { t = y - 1975; return 45.45 + 1.067*t - t*t / 260 - t**3 / 718; }
  if (y < 2005) { t = y - 2000; return 63.86 + 0.3345*t - 0.060374*t*t + 0.0017275*t**3 + 0.000651814*t**4 + 0.00002373599*t**5; }
  if (y < 2050) { t = y - 2000; return 62.92 + 0.32217*t + 0.005589*t*t; }
  if (y < 2150) { u = (y - 1820) / 100; return -20 + 32*u*u - 0.5628 * (2150 - y); }
  u = (y - 1820) / 100; return -20 + 32 * u * u;
}

/* Julian Day -> calendar parts (Julian calendar before 15 Oct 1582, Gregorian after), rounded to the second; no JS Date, so any year works. */
function jdToParts(jd){
  const secs = Math.round((jd + 0.5) * 86400), Z = Math.floor(secs / 86400), rem = secs - Z * 86400;
  let A = Z; if (Z >= 2299161){ const alpha = Math.floor((Z - 1867216.25) / 36524.25); A = Z + 1 + alpha - Math.floor(alpha / 4); }
  const B = A + 1524, C = Math.floor((B - 122.1) / 365.25), D = Math.floor(365.25 * C), E = Math.floor((B - D) / 30.6001);
  const day = B - D - Math.floor(30.6001 * E), month = E < 14 ? E - 1 : E - 13, year = month > 2 ? C - 4716 : C - 4715;
  return { y: year, m: month, d: day, h: Math.floor(rem / 3600), mi: Math.floor((rem % 3600) / 60), s: rem % 60 };
}

function lahiriAyanamsa(jd){
  const ayan1900 = 22 + 27/60 + 54.33/3600;
  const precessionRate = 50.2564 / 3600;
  const years = (jd - 2415020.0) / 365.25;
  let ayan = ayan1900 + precessionRate * years;
  const correction = 0.000139 * Math.sin((jd - 2415020.0) / 365.25 * 0.98565 * DEG);
  ayan += correction;
  return ayan;
}

function sunLongitude(jd){
  const T = (jdTT(jd) - J2000) / 36525.0;
  const L0 = normDeg(280.46646 + 36000.76983*T + 0.0003032*T*T);
  const M = normDeg(357.52911 + 35999.05029*T - 0.0001537*T*T);
  const Mrad = M*DEG;
  const C = (1.914602-0.004817*T-0.000014*T*T)*Math.sin(Mrad) + (0.019993-0.000101*T)*Math.sin(2*Mrad) + 0.000289*Math.sin(3*Mrad);
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136*T;
  const lambda = trueLong - 0.00569 - 0.00478*Math.sin(omega*DEG);
  return normDeg(lambda);
}

/* Moon longitude series (Meeus ch.47), built once. Rows: D, M, M', F, coefficient (1e-6 deg). */
const MOON_TERMS = new Float64Array([
  0,0,1,0,6288774,
  2,0,-1,0,1274027,
  2,0,0,0,658314,
  0,0,2,0,213618,
  0,1,0,0,-185116,
  0,0,0,2,-114332,
  2,0,-2,0,58793,
  2,-1,-1,0,57066,
  2,0,1,0,53322,
  2,-1,0,0,45758,
  0,1,-1,0,-40923,
  1,0,0,0,-34720,
  0,1,1,0,-30383,
  2,0,0,-2,15327,
  0,0,1,2,-12528,
  0,0,1,-2,10980,
  4,0,-1,0,10675,
  0,0,3,0,10034,
  4,0,-2,0,8548,
  2,1,-1,0,-7888,
  2,1,0,0,-6766,
  1,0,-1,0,-5163,
  1,1,0,0,4987,
  2,-1,1,0,4036,
  2,0,2,0,3994,
  4,0,0,0,3861,
  2,0,-3,0,3665,
  0,1,-2,0,-2689,
  2,0,-1,2,-2602,
  2,-1,-2,0,2390,
  1,0,1,0,-2348,
  2,-2,0,0,2236,
  0,1,2,0,-2120,
  0,2,0,0,-2069,
  2,-2,-1,0,2048,
  2,0,1,-2,-1773,
  2,0,0,2,-1595,
  4,-1,-1,0,1215,
  0,0,2,2,-1110,
  3,0,-1,0,-892,
  2,1,1,0,-810,
  4,-1,-2,0,759,
  0,2,-1,0,-713,
  2,2,-1,0,-700,
  2,1,-2,0,691,
  2,-1,0,-2,596,
  4,0,1,0,549,
  0,0,4,0,537,
  4,-1,0,0,520,
  1,0,-2,0,-487,
  2,1,0,-2,-399,
  0,0,2,-2,-381,
  1,1,1,0,351,
  3,0,-2,0,-340,
  4,0,-3,0,330,
  2,-1,2,0,327,
  0,2,1,0,-323,
  1,1,-1,0,299,
  2,0,3,0,294
]);

function moonLongitude(jd){
  const T = (jdTT(jd) - J2000) / 36525.0;
  const Lp = normDeg(218.3164477 + 481267.88123421*T - 0.0015786*T*T + T*T*T/538841 - T*T*T*T/65194000);
  const D = normDeg(297.8501921 + 445267.1114034*T - 0.0018819*T*T + T*T*T/545868 - T*T*T*T/113065000);
  const M = normDeg(357.5291092 + 35999.0502909*T - 0.0001536*T*T + T*T*T/24490000);
  const Mp = normDeg(134.9633964 + 477198.8675055*T + 0.0087414*T*T + T*T*T/69699 - T*T*T*T/14712000);
  const F = normDeg(93.2720950 + 483202.0175233*T - 0.0036539*T*T - T*T*T/3526000 + T*T*T*T/863310000);
  const Dr=D*DEG, Mr=M*DEG, Mpr=Mp*DEG, Fr=F*DEG;
  let sumL = 0;
  const tm = MOON_TERMS;
  for (let k = 0; k < tm.length; k += 5){
    sumL += tm[k+4] * Math.sin(tm[k]*Dr + tm[k+1]*Mr + tm[k+2]*Mpr + tm[k+3]*Fr);
  }
  return normDeg(Lp + sumL/1000000);
}

const PLANET_ELEMENTS = {
  mercury:{a:0.387098,e:0.205635,i:7.0047,L:252.2503,Lrate:149472.6746,peri:77.4561,periRate:0.1588,node:48.3308,nodeRate:-0.1254},
  venus:{a:0.723330,e:0.006773,i:3.3946,L:181.9791,Lrate:58517.8156,peri:131.5637,periRate:0.0048,node:76.6799,nodeRate:-0.2780},
  mars:{a:1.523688,e:0.093405,i:1.8497,L:355.4330,Lrate:19140.2993,peri:336.0602,periRate:0.4438,node:49.5581,nodeRate:-0.2910},
  jupiter:{a:5.202561,e:0.048498,i:1.3033,L:34.3515,Lrate:3034.9057,peri:14.3312,periRate:0.2155,node:100.4644,nodeRate:0.1767},
  saturn:{a:9.554747,e:0.055546,i:2.4886,L:50.0774,Lrate:1222.1138,peri:93.0572,periRate:0.5150,node:113.6634,nodeRate:-0.2566}
};
Object.assign(PLANET_ELEMENTS,{
  uranus:{a:19.18797948,e:0.04685740,i:0.77298127,L:313.23810451,Lrate:428.48202785,peri:170.95427630,periRate:0.40805281,node:74.01692503,nodeRate:0.04240589},
  neptune:{a:30.06952752,e:0.00895439,i:1.77005520,L:-55.12002969,Lrate:218.45945325,peri:44.96476227,periRate:-0.32241464,node:131.78422574,nodeRate:-0.00508664},
  pluto:{a:39.48686035,e:0.24885238,i:17.14104260,L:238.96535011,Lrate:145.18042903,peri:224.09702598,periRate:-0.04062942,node:110.30167986,nodeRate:-0.01183482}
});
const EARTH_ELEMENTS = {a:1.000001,e:0.016709,i:0.0,L:100.4664,Lrate:35999.3729,peri:102.9373,periRate:0.3225,node:0,nodeRate:0};

function solveKepler(M, e){
  let E = M;
  for (let i=0;i<50;i++){
    const dE = (E - e*Math.sin(E) - M) / (1 - e*Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}
function heliocentricPos(elements, T){
  const a=elements.a, e=elements.e, i=elements.i*DEG;
  const L = normDeg(elements.L + elements.Lrate*T)*DEG;
  const peri = normDeg(elements.peri + elements.periRate*T)*DEG;
  const node = normDeg(elements.node + elements.nodeRate*T)*DEG;
  const M = L - peri;
  const E = solveKepler(normDeg(M*RAD)*DEG, e);
  const xv = a*(Math.cos(E)-e);
  const yv = a*(Math.sqrt(1-e*e)*Math.sin(E));
  const v = Math.atan2(yv,xv);
  const r = Math.sqrt(xv*xv+yv*yv);
  const omega = peri - node;
  const xh = r*(Math.cos(node)*Math.cos(v+omega) - Math.sin(node)*Math.sin(v+omega)*Math.cos(i));
  const yh = r*(Math.sin(node)*Math.cos(v+omega) + Math.cos(node)*Math.sin(v+omega)*Math.cos(i));
  return {x:xh,y:yh};
}
function planetGeocentricLongitude(name, jd){
  const T = (jdTT(jd)-J2000)/36525.0;
  const earth = heliocentricPos(EARTH_ELEMENTS,T);
  const planet = heliocentricPos(PLANET_ELEMENTS[name],T);
  const xg = planet.x-earth.x, yg = planet.y-earth.y;
  // Elements are referred to the fixed J2000 equinox; the ayanamsa is subtracted from tropical-of-DATE longitudes
  // (as for Sun/Moon/Rahu), so add the general precession since J2000 to put all bodies in the same frame.
  return normDeg(Math.atan2(yg,xg)*RAD + 1.3969713*T + 0.0003086*T*T);
}
function isRetrograde(name, jd){
  const l1 = planetGeocentricLongitude(name, jd-0.25);
  const l2 = planetGeocentricLongitude(name, jd+0.25);
  let diff = l2-l1;
  if (diff>180) diff-=360; if (diff<-180) diff+=360;
  return diff<0;
}
function rahuLongitude(jd){
  const T = (jdTT(jd)-J2000)/36525.0;
  return normDeg(125.0445479 - 1934.1362891*T + 0.0020754*T*T + T*T*T/467441 - T*T*T*T/60616000);
}

function getSiderealLongitudeAt(name, jd){
  const ayan = lahiriAyanamsa(jd);
  let tropical;
  switch(name){
    case "Sun": tropical = sunLongitude(jd); break;
    case "Moon": tropical = moonLongitude(jd); break;
    case "Mercury": tropical = planetGeocentricLongitude("mercury", jd); break;
    case "Venus": tropical = planetGeocentricLongitude("venus", jd); break;
    case "Mars": tropical = planetGeocentricLongitude("mars", jd); break;
    case "Jupiter": tropical = planetGeocentricLongitude("jupiter", jd); break;
    case "Saturn": tropical = planetGeocentricLongitude("saturn", jd); break;
    case "Rahu": return normDeg(rahuLongitude(jd) - ayan);
    case "Ketu": return normDeg(rahuLongitude(jd) - ayan + 180);
  }
  return normDeg(tropical - ayan);
}

function getPlanetSpeed(name, jd){
  if (name === "Rahu" || name === "Ketu"){
    const T = (jd-J2000)/36525.0;
    const dTdJD = 1/36525.0;
    const speed = (-1934.1362891 + 2*0.0020754*T + 3*T*T/467441 - 4*T*T*T/60616000) * dTdJD;
    return speed; 
  }
  const dt = 0.5; 
  const l1 = getSiderealLongitudeAt(name, jd-dt);
  const l2 = getSiderealLongitudeAt(name, jd+dt);
  let diff = l2 - l1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff / (2*dt);
}


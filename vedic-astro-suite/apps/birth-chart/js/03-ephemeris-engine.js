/* ============================================================================
   ENGINE (embedded) — Sidereal Lahiri Vedic calculations
   ============================================================================ */
const DEG = Math.PI / 180, RAD = 180 / Math.PI, J2000 = 2451545.0;
function normDeg(d){ d = d % 360; return d < 0 ? d + 360 : d; }

function toJulianDay(year, month, day, hour, minute, second){
  let Y = year, M = month;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const dayFrac = day + (hour + minute/60 + second/3600) / 24;
  return Math.floor(365.25*(Y+4716)) + Math.floor(30.6001*(M+1)) + dayFrac + B - 1524.5;
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
  const T = (jd - J2000) / 36525.0;
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
  const T = (jd - J2000) / 36525.0;
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
  const T = (jd-J2000)/36525.0;
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
  const T = (jd-J2000)/36525.0;
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


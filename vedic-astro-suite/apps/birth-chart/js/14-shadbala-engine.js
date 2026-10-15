
const BALA_PLANETS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
const NAISARGIKA_BALA = { Sun: 60, Moon: 51.43, Venus: 42.86, Jupiter: 34.29, Mercury: 25.71, Mars: 17.14, Saturn: 8.57 };
function getNaisargikaBala(name){ return NAISARGIKA_BALA[name]; }
const DIG_BALA_HOME_HOUSE = { Sun:10, Mars:10, Moon:4, Venus:4, Mercury:1, Jupiter:1, Saturn:7 };
function getDigBala(name, house){
  const homeHouse = DIG_BALA_HOME_HOUSE[name];
  let dist = Math.abs(house - homeHouse);
  if (dist > 6) dist = 12 - dist;
  return Math.max(0, 60 * (1 - dist/6));
}
function getUcchaBala(exaltSignIdx, exaltDeg, planetSignIdx, planetDegInSign){
  const exaltAbsLon = exaltSignIdx*30 + exaltDeg;
  const planetAbsLon = planetSignIdx*30 + planetDegInSign;
  const debilAbsLon = normDeg(exaltAbsLon + 180);
  let distFromDebil = normDeg(planetAbsLon - debilAbsLon);
  if (distFromDebil > 180) distFromDebil = 360 - distFromDebil;
  return (distFromDebil/180) * 60;
}
const ODD_SIGN_STRONG = ["Sun","Mars","Jupiter"];
const EVEN_SIGN_STRONG = ["Moon","Venus"];
function isOddSign(signIdx){ return signIdx % 2 === 0; }
function getOjaYugmaBala(name, rashiSignIdx, navamsaSignIdx){
  if (name==="Mercury" || name==="Saturn") return 30;
  let bala = 0;
  const rashiOdd = isOddSign(rashiSignIdx);
  const navamsaOdd = isOddSign(navamsaSignIdx);
  if (ODD_SIGN_STRONG.includes(name)){ bala += rashiOdd ? 15 : 0; bala += navamsaOdd ? 15 : 0; } 
  else if (EVEN_SIGN_STRONG.includes(name)){ bala += !rashiOdd ? 15 : 0; bala += !navamsaOdd ? 15 : 0; }
  return bala;
}
function getKendradiBala(house){
  const kendra = [1,4,7,10];
  const panapara = [2,5,8,11];
  if (kendra.includes(house)) return 60;
  if (panapara.includes(house)) return 30;
  return 15;
}
const MALE_PLANETS = ["Sun","Mars","Jupiter"];
const FEMALE_PLANETS = ["Moon","Venus"];
const NEUTER_PLANETS = ["Mercury","Saturn"];
function getDrekkanaBala(name, degInSign){
  const drekkanaIdx = Math.floor(degInSign/10);
  if (drekkanaIdx===0 && MALE_PLANETS.includes(name)) return 15;
  if (drekkanaIdx===1 && FEMALE_PLANETS.includes(name)) return 15;
  if (drekkanaIdx===2 && NEUTER_PLANETS.includes(name)) return 15;
  return 0;
}
const VARGA_DIGNITY_POINTS = { Moolatrikona: 45, OwnSign: 30, GreatFriend: 22.5, Friend: 15, Neutral: 7.5, Enemy: 3.75, GreatEnemy: 1.875 };
const SAPTAVARGA_KEYS = ["D1","D2","D3","D7","D9","D12","D30"];
function dignityStatusToVargaPoints(status){
  switch(status){
    case "Exalted": return VARGA_DIGNITY_POINTS.Moolatrikona;
    case "Moolatrikona": return VARGA_DIGNITY_POINTS.Moolatrikona;
    case "OwnSign": return VARGA_DIGNITY_POINTS.OwnSign;
    case "Friend": return VARGA_DIGNITY_POINTS.Friend;
    case "Neutral": return VARGA_DIGNITY_POINTS.Neutral;
    case "Enemy": return VARGA_DIGNITY_POINTS.Enemy;
    case "Debilitated": return VARGA_DIGNITY_POINTS.GreatEnemy;
    default: return VARGA_DIGNITY_POINTS.Neutral;
  }
}
function getSaptavargajaBala(vargaDignityStatuses){
  return vargaDignityStatuses.reduce((sum, status) => sum + dignityStatusToVargaPoints(status), 0);
}
function getNathonnataBala(name, hoursFromLocalMidnight){
  if (name === "Mercury") return 60;
  const DIURNAL = ["Sun","Jupiter","Venus"];
  let peakHour = DIURNAL.includes(name) ? 12 : 0;
  let dist = Math.abs(hoursFromLocalMidnight - peakHour);
  if (dist > 12) dist = 24 - dist;
  return 60 * (1 - dist/12);
}
function getPakshaBala(name, moonLon, sunLon){
  let sep = normDeg(moonLon - sunLon);
  const BENEFICS = ["Moon","Mercury","Jupiter","Venus"];
  const MALEFICS = ["Sun","Mars","Saturn"];
  let benefStrength = sep/180 * 60;
  if (sep > 180) benefStrength = (360-sep)/180 * 60;
  if (BENEFICS.includes(name)) return benefStrength;
  if (MALEFICS.includes(name)) return 60 - benefStrength;
  return 30;
}
function getTribhagaBala(name, hourFraction, isDaytime){
  const third = Math.floor(Math.min(0.9999, hourFraction)*3);
  if (isDaytime){
    if (third===0 && name==="Mercury") return 60;
    if (third===1 && name==="Sun") return 60;
    if (third===2 && name==="Saturn") return 60;
  } else {
    if (third===0 && name==="Moon") return 60;
    if (third===1 && name==="Venus") return 60;
    if (third===2 && name==="Mars") return 60;
  }
  if (name==="Jupiter") return 60;
  return 0;
}
function getVarshaMasaDinaHoraBala(name, yearLordName, monthLordName, dayLordName, horaLordName){
  let bala = 0;
  if (name === yearLordName) bala += 15;
  if (name === monthLordName) bala += 30;
  if (name === dayLordName) bala += 45;
  if (name === horaLordName) bala += 60;
  return bala;
}

const KALI_EPOCH_JDN = 588465;
const WEEKDAY_LORD_BY_INDEX = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
function getAhargana(julianDayNumber){ return Math.floor(julianDayNumber) - KALI_EPOCH_JDN; }
function getWeekdayLordFromAhargana(ahargana){
  const idx = ((ahargana + 4) % 7 + 7) % 7;
  return { index: idx, lord: WEEKDAY_LORD_BY_INDEX[idx] };
}
function getDinaLord(julianDayNumber){ return getWeekdayLordFromAhargana(getAhargana(julianDayNumber)).lord; }
function getVarshaLord(yearStartJDN){ return getWeekdayLordFromAhargana(getAhargana(yearStartJDN)).lord; }
function getMasaLord(monthStartJDN){ return getWeekdayLordFromAhargana(getAhargana(monthStartJDN)).lord; }
const CHALDEAN_SEQUENCE = ["Sun","Venus","Mercury","Moon","Saturn","Jupiter","Mars"];
function getHoraLord(weekdayIndex, jdAtBirth, sunriseJD, sunsetJD, nextSunriseJD){
  const dayLord = WEEKDAY_LORD_BY_INDEX[weekdayIndex];
  const startSeqIdx = CHALDEAN_SEQUENCE.indexOf(dayLord);
  let horaIndex;
  if (jdAtBirth >= sunriseJD && jdAtBirth < sunsetJD){
    const horaLength = (sunsetJD - sunriseJD) / 12;
    horaIndex = Math.floor((jdAtBirth - sunriseJD) / horaLength);
  } else {
    const horaLength = (nextSunriseJD - sunsetJD) / 12;
    const nightOffset = jdAtBirth >= sunsetJD ? (jdAtBirth - sunsetJD) : (jdAtBirth + 1 - sunsetJD);
    horaIndex = 12 + Math.floor(Math.max(0,nightOffset) / horaLength);
  }
  return CHALDEAN_SEQUENCE[(startSeqIdx + horaIndex) % 7];
}
function getAyanaBala(name, declinationDeg, isNorthern){
  if (name === "Mercury") return 60;
  const NORTHERN_STRONG = ["Sun","Mars","Jupiter","Venus"];
  const obliquity = 23.4333;
  const prefersNorthern = NORTHERN_STRONG.includes(name);
  const aligned = (isNorthern && prefersNorthern) || (!isNorthern && !prefersNorthern);
  const magnitude = Math.min(Math.abs(declinationDeg), obliquity);
  const bala = aligned ? 30 + (magnitude/obliquity)*30 : 30 - (magnitude/obliquity)*30;
  return Math.max(0, Math.min(60, bala));
}
function getDeclinationDeg(tropicalLongitudeDeg, obliquityDeg){
  const DEG2RAD = Math.PI/180, RAD2DEG = 180/Math.PI;
  const sinDecl = Math.sin(obliquityDeg*DEG2RAD) * Math.sin(tropicalLongitudeDeg*DEG2RAD);
  return Math.asin(sinDecl) * RAD2DEG;
}
function getKalaBala(components){
  const { nathonnata, paksha, tribhaga, vmdh, ayana, yuddha } = components;
  return nathonnata + paksha + tribhaga + vmdh + ayana + (yuddha||0);
}
const MEAN_DAILY_MOTION = { Mars:0.524, Mercury:1.383, Jupiter:0.0831, Venus:1.2, Saturn:0.0334 };
function getChestaBala(name, actualSpeed, sunAyanaBala, moonPakshaBala){
  if (name === "Sun") return sunAyanaBala;
  if (name === "Moon") return Math.min(60, moonPakshaBala * 2 / 2);
  const mean = MEAN_DAILY_MOTION[name];
  if (actualSpeed < 0){
    const ratio = Math.min(2, Math.abs(actualSpeed)/mean);
    return Math.min(60, 30 + ratio*15);
  } else {
    const ratio = Math.min(1, actualSpeed/mean);
    return Math.max(0, 30 - ratio*30) + (actualSpeed < mean*0.3 ? 15 : 0);
  }
}
const NATURAL_BENEFICS = ["Jupiter","Venus","Mercury","Moon"];
const NATURAL_MALEFICS = ["Sun","Mars","Saturn","Rahu","Ketu"];
function getDrikBalaContribution(aspectingPlanet, orbDegrees, maxOrb){
  const strength = Math.max(0, 30 * (1 - orbDegrees/maxOrb));
  const isBenefic = NATURAL_BENEFICS.includes(aspectingPlanet);
  return isBenefic ? strength : -strength;
}
const REQUIRED_RUPAS = { Sun:6.5, Moon:6, Mars:5, Mercury:7, Jupiter:6.5, Venus:5.5, Saturn:5 };

function findSunSignEntryBefore(beforeJD, targetSignIdx){
  let jd = beforeJD;
  let prevSign = getSignIndex(normDeg(sunLongitude(jd) - lahiriAyanamsa(jd)));
  for (let i=0; i<400; i++){
    const testJD = beforeJD - i;
    const sign = getSignIndex(normDeg(sunLongitude(testJD) - lahiriAyanamsa(testJD)));
    const prevTestSign = getSignIndex(normDeg(sunLongitude(testJD-1) - lahiriAyanamsa(testJD-1)));
    if (sign === targetSignIdx && prevTestSign !== targetSignIdx){
      let lo = testJD-1, hi = testJD;
      for (let iter=0; iter<30; iter++){
        const mid = (lo+hi)/2;
        const midSign = getSignIndex(normDeg(sunLongitude(mid) - lahiriAyanamsa(mid)));
        if (midSign === targetSignIdx) hi = mid; else lo = mid;
      }
      return hi;
    }
  }
  return beforeJD - 30;
}

function computeShadbala(siderealLongitudes, planets, ascSignIdx, jd, localJD, hourOfDayLocal, isDaytimeNow, sunriseJD, sunsetJD, nextSunriseJD, weekdayIndex){
  const results = {};
  const sunLon = siderealLongitudes.Sun;
  const moonLon = siderealLongitudes.Moon;
  const obliquity = obliquityOfEcliptic(jd);

  function ayanaBalaFor(name){
    const tropicalLon = normDeg(siderealLongitudes[name] + lahiriAyanamsa(jd));
    const decl = getDeclinationDeg(tropicalLon, obliquity);
    return getAyanaBala(name, decl, decl >= 0);
  }
  const sunAyana = ayanaBalaFor("Sun");
  const moonPaksha = getPakshaBala("Moon", moonLon, sunLon);

  const jdn = Math.floor(localJD + 0.5);
  const dinaLord = getDinaLord(jdn);
  const horaLord = getHoraLord(weekdayIndex, jd, sunriseJD, sunsetJD, nextSunriseJD);
  const yearStartJD = findSunSignEntryBefore(jd, 0);
  const currentSunSign = getSignIndex(sunLon);
  const monthStartJD = findSunSignEntryBefore(jd, currentSunSign);
  const varshaLord = getVarshaLord(Math.floor(yearStartJD+0.5));
  const masaLord = getMasaLord(Math.floor(monthStartJD+0.5));

  BALA_PLANETS.forEach(name=>{
    const p = planets[name];
    const signIdx = p.sign;
    const degInSign = p.degInSign;
    const house = p.house;

    const ex = EXALTATION[name];
    const uchcha = getUcchaBala(ex.sign, ex.deg, signIdx, degInSign);
    const vargaDignityStatuses = SAPTAVARGA_KEYS.map(vk=>{
      const vSign = calcVarga(vk, siderealLongitudes[name]);
      return getDignity(name, vSign, 15).status;
    });
    const saptavargaja = getSaptavargajaBala(vargaDignityStatuses);
    const navamsaSign = calcVarga("D9", siderealLongitudes[name]);
    const ojaYugma = getOjaYugmaBala(name, signIdx, navamsaSign);
    const kendradi = getKendradiBala(house);
    const drekkana = getDrekkanaBala(name, degInSign);
    const sthanaBala = uchcha + saptavargaja + ojaYugma + kendradi + drekkana;

    const digBala = getDigBala(name, house);

    const nathonnata = getNathonnataBala(name, hourOfDayLocal);
    const paksha = getPakshaBala(name, moonLon, sunLon);
    const hourFraction = isDaytimeNow
      ? (jd - sunriseJD) / (sunsetJD - sunriseJD)
      : (jd >= sunsetJD ? (jd - sunsetJD) : (jd + 1 - sunsetJD)) / (nextSunriseJD - sunsetJD);
    const tribhaga = getTribhagaBala(name, Math.max(0,Math.min(0.999,hourFraction)), isDaytimeNow);
    const vmdh = getVarshaMasaDinaHoraBala(name, varshaLord, masaLord, dinaLord, horaLord);
    const ayana = ayanaBalaFor(name);
    const kalaBala = getKalaBala({ nathonnata, paksha, tribhaga, vmdh, ayana, yuddha:0 });

    const chestaBala = getChestaBala(name, p.speed, sunAyana, moonPaksha);
    const naisargikaBala = getNaisargikaBala(name);

    let drikBala = 0;
    BALA_PLANETS.forEach(other=>{
      if (other===name) return;
      const sep = angDiffLocal(siderealLongitudes[other], siderealLongitudes[name]);
      const aspectAngles = [0,60,90,120,180];
      let minDist = 180;
      aspectAngles.forEach(a=>{ minDist = Math.min(minDist, Math.abs(sep-a)); });
      if (minDist <= 15){
        drikBala += getDrikBalaContribution(other, minDist, 15);
      }
    });

    const totalVirupas = sthanaBala + digBala + kalaBala + chestaBala + naisargikaBala + drikBala;
    const totalRupas = totalVirupas / 60;
    const requiredRupas = REQUIRED_RUPAS[name];

    results[name] = {
      sthanaBala: { total: sthanaBala, uchcha, saptavargaja, ojaYugma, kendradi, drekkana },
      digBala,
      kalaBala: { total: kalaBala, nathonnata, paksha, tribhaga, vmdh, ayana },
      chestaBala, naisargikaBala, drikBala,
      totalVirupas, totalRupas, requiredRupas,
      isStrong: totalRupas >= requiredRupas,
      percentOfRequired: (totalRupas/requiredRupas)*100
    };
  });

  return { planets: results, dinaLord, horaLord, varshaLord, masaLord };
}

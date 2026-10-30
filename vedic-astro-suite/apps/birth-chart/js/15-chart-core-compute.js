
function getSunriseSunsetJD(jd, lat, lon){
  // The old routine assumed `jd` was exactly 0h UT, so sunrise/sunset were wrong by hours for real birth instants.
  // Use the same refraction-corrected routine as the Panchang tab, for the solar-local day containing `jd`.
  const tzs = lon/15, dp = parseDob(jdToLocalParts(jd, tzs).dateStr);
  const rs = pnRiseSet(dp.y, dp.m, dp.d, lat, lon, tzs);
  if (rs.rise != null && rs.set != null) return { sunriseJD: rs.rise, sunsetJD: rs.set };
  return getSunriseSunsetApprox(jd, lat, lon);
}
function getSunriseSunsetApprox(jd, lat, lon){
  const DEG2RAD = Math.PI/180, RAD2DEG = 180/Math.PI;
  const noonJD = jd + 0.5 - lon/360; 
  const sunLon = sunLongitude(noonJD);
  const obliquity = obliquityOfEcliptic(noonJD);
  const decl = getDeclinationDeg(sunLon, obliquity);

  const latRad = lat*DEG2RAD, declRad = decl*DEG2RAD;
  const cosH = -Math.tan(latRad)*Math.tan(declRad);
  let H;
  if (cosH > 1){ H = 0; } 
  else if (cosH < -1){ H = 180; } 
  else { H = Math.acos(cosH) * RAD2DEG; }

  const hourAngleDays = H/360;
  const sunriseJD = noonJD - hourAngleDays;
  const sunsetJD = noonJD + hourAngleDays;
  return { sunriseJD, sunsetJD };
}

function computeChart(dateStr, timeStr, lat, lon, tzOffsetHours){
  const {y:year,m:month,d:day} = parseDob(dateStr);
  const [hour,minute,second] = timeStr.split(":").map(Number);
  const sec = second || 0;
  const localJD = toJulianDay(year,month,day,hour,minute,sec);
  const jd = localJD - tzOffsetHours/24;
  const ayanamsa = lahiriAyanamsa(jd);

  const jdT = jd;   // delta-T (UT -> TT) is applied INSIDE the Sun/Moon/planet/node series (js/03 jdTT), so every caller gets it. Adding deltaT() here too would count it twice.
  const tropicalLongitudes = {
    Sun: sunLongitude(jdT), Moon: moonLongitude(jdT),
    Mercury: planetGeocentricLongitude("mercury",jdT), Venus: planetGeocentricLongitude("venus",jdT),
    Mars: planetGeocentricLongitude("mars",jdT), Jupiter: planetGeocentricLongitude("jupiter",jdT),
    Saturn: planetGeocentricLongitude("saturn",jdT)
  };
  const rahuTropical = rahuLongitude(jdT);
  const siderealLongitudes = {};
  for (const p in tropicalLongitudes) siderealLongitudes[p] = normDeg(tropicalLongitudes[p]-ayanamsa);
  siderealLongitudes.Rahu = normDeg(rahuTropical-ayanamsa);
  siderealLongitudes.Ketu = normDeg(siderealLongitudes.Rahu+180);

  const retro = {
    Mercury:isRetrograde("mercury",jd), Venus:isRetrograde("venus",jd), Mars:isRetrograde("mars",jd),
    Jupiter:isRetrograde("jupiter",jd), Saturn:isRetrograde("saturn",jd),
    Sun:false, Moon:false, Rahu:true, Ketu:true
  };

  const ascTropical = ascendantLongitude(jd, lat, lon);
  const ascSidereal = normDeg(ascTropical-ayanamsa);
  const ascSignIdx = getSignIndex(ascSidereal);

  const planets = {};
  for (const name of PLANET_LIST){
    const l = siderealLongitudes[name];
    const signIdx = getSignIndex(l);
    const house = ((signIdx-ascSignIdx+12)%12)+1;
    const nak = getNakshatra(l);
    const dignity = getDignity(name, signIdx, getDegInSign(l));
    const combustion = getCombustion(name, l, siderealLongitudes.Sun, retro[name]);
    const degInSign = getDegInSign(l);
    const speed = getPlanetSpeed(name, jd);
    planets[name] = {
      name, longitude:l, sign:signIdx, degInSign, degRemainingInSign: 30-degInSign, house, nakshatra:nak,
      retrograde:retro[name], dignity, combustion, speed,
      aspectsHouses: getAspectedHouses(name, house)
    };
  }
  const wars = findPlanetaryWars(siderealLongitudes);
  wars.forEach(w=>{
    planets[w.planetA].war = { with:w.planetB, won: w.winner===w.planetA, separation:w.separation };
    planets[w.planetB].war = { with:w.planetA, won: w.winner===w.planetB, separation:w.separation };
  });

  const birthUTC = new Date((jd - 2440587.5) * 86400000);   // from the Julian Day, so years 0-99 and BC dates are exact
  const dashaData = calculateVimshottariDasha(siderealLongitudes.Moon, birthUTC);

  const yogas = {
    panchaMahapurusha: detectPanchaMahapurushaYogas(planets),
    gajaKesari: detectGajaKesariYoga(planets),
    rajaYogas: detectRajaYogas(planets, ascSignIdx),
    parivartana: detectParivartanaYogas(planets, ascSignIdx),
    viparitaRaja: detectViparitaRajaYoga(planets, ascSignIdx),
    neechaBhanga: detectNeechaBhanga(planets, ascSignIdx)
  };

  const ashtakavargaSignPositions = { Lagna: ascSignIdx };
  BAV_PLANETS.forEach(name=> ashtakavargaSignPositions[name] = planets[name].sign);
  const ashtakavarga = computeFullAshtakavarga(ashtakavargaSignPositions);

  const karakaDegrees = {};
  KARAKA_ELIGIBLE.forEach(name => karakaDegrees[name] = planets[name].degInSign);
  const charaKarakas = calculateCharaKarakas(karakaDegrees);

  const todaySunriseSunset = getSunriseSunsetJD(jd, lat, lon);
  const tomorrowSunriseSunset = getSunriseSunsetJD(jd+1, lat, lon);
  const isDaytimeNow = jd >= todaySunriseSunset.sunriseJD && jd < todaySunriseSunset.sunsetJD;
  const localHourFraction = ((jd + 0.5) % 1);
  const hourOfDayLocal = ((localHourFraction*24) + tzOffsetHours + 24) % 24;
  const weekdayIndex = (Math.floor(jd + 0.5 + tzOffsetHours/24) + 1) % 7; 

  const shadbala = computeShadbala(
    siderealLongitudes, planets, ascSignIdx, jd, localJD,
    hourOfDayLocal, isDaytimeNow,
    todaySunriseSunset.sunriseJD, todaySunriseSunset.sunsetJD, tomorrowSunriseSunset.sunriseJD,
    weekdayIndex
  );

  const vargaResults = {};
  for (const key in VARGAS){
    const ascVargaSign = key === "RTN" ? ascSignIdx : calcVarga(key, ascSidereal);   // Rasi Tulya Navamsa keeps the D1 lagna
    const planetVargaSign = {};
    PLANET_LIST.forEach(name=> planetVargaSign[name] = calcVarga(key, siderealLongitudes[name]));

    const houses = [];
    for (let h=1; h<=12; h++){
      const signIdx = (ascVargaSign + h - 1) % 12;
      const sign = SIGNS[signIdx];
      const planetsHere = PLANET_LIST.filter(name=> planetVargaSign[name]===signIdx).map(name=>({
        name, retrograde: retro[name],
        dignity: key==="D1" ? planets[name].dignity : getDignity(name, signIdx, 15)
      }));
      houses.push({
        houseNum: h, sign: signIdx, signName: sign.name, signSanskrit: sign.sk,
        signLord: sign.lord, signSymbol: sign.symbol, element: sign.element, modality: sign.modality,
        planets: planetsHere, isEmpty: planetsHere.length===0
      });
    }
    vargaResults[key] = { ascendantSign: ascVargaSign, houses, planetVargaSign };
  }
  const outer = {};
  OUTER_LIST.forEach(n=>{
    const k = n.toLowerCase(), l = normDeg(planetGeocentricLongitude(k,jd) - ayanamsa), sg = getSignIndex(l);
    const rx = isRetrograde(k,jd);
    outer[n] = { name:n, longitude:l, sign:sg, degInSign:getDegInSign(l), house:((sg-ascSignIdx+12)%12)+1, nakshatra:getNakshatra(l), retrograde:rx };
    for (const vk in vargaResults){ const V = vargaResults[vk]; (V.outerSign = V.outerSign || {})[n] = calcVarga(vk, l); (V.outerRx = V.outerRx || {})[n] = rx; }
  });

  const upagraha = {};
  try { const gk = computeGulika(jd, lat, lon, tzOffsetHours, 'start');
    if (gk){ gk.house = ((gk.sign-ascSignIdx+12)%12)+1; upagraha.Gulika = gk;
      for (const vk in vargaResults){ const V = vargaResults[vk]; (V.outerSign = V.outerSign || {}).Gulika = calcVarga(vk, gk.longitude); (V.outerRx = V.outerRx || {}).Gulika = false; } } } catch(e){ console.warn('gulika skipped', e); }

  return {
    julianDay: jd, ayanamsa, tzOffsetHours,
    sunriseJD: todaySunriseSunset.sunriseJD, sunsetJD: todaySunriseSunset.sunsetJD,
    prevSunsetJD: (function(){ const y = getSunriseSunsetJD(jd-1, lat, lon); return y.sunsetJD; })(),
    ascendant: { longitude: ascSidereal, sign: ascSignIdx, degInSign: getDegInSign(ascSidereal), nakshatra: getNakshatra(ascSidereal) },
    planets, outer, upagraha, vargas: vargaResults, siderealLongitudes, wars, dashaData, yogas, ashtakavarga, charaKarakas, shadbala
  };
}


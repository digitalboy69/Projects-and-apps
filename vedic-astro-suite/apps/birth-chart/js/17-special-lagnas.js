/* ============================================================================
   SPECIAL LAGNAS (UDAYA, ARUDHA PADAS, HORA, GHATI, INDU, SHREE, ETC.)
   ============================================================================
   Every "lagna" below resolves to a sidereal longitude (0-360). Once we have
   that longitude, it can be fed through the exact same varga-house pipeline
   used for the main Rashi/Divisional charts, so every one of these can be
   rendered as its own D1..D60 chart set.
*/
const ARUDHA_HOUSE_META = {
  AL:  { fromHouse: 1,  name: "Arudha Lagna",   sanskrit: "Pada Lagna",       desc: "Public image, perceived status, how the world sees you." },
  UL:  { fromHouse: 12, name: "Upapada Lagna",  sanskrit: "Gauna Pada / A7",  desc: "Marriage, spouse, and the nature of primary partnerships." },
  A2:  { fromHouse: 2,  name: "Dhana Pada",     sanskrit: "A2",               desc: "Perceived wealth, family resources, speech." },
  A3:  { fromHouse: 3,  name: "Bhatru Pada",    sanskrit: "A3",               desc: "Siblings, courage, effort, valor." },
  A4:  { fromHouse: 4,  name: "Matru Pada",     sanskrit: "A4",               desc: "Mother, home, property, inner comfort." },
  A5:  { fromHouse: 5,  name: "Mantra Pada",    sanskrit: "A5",               desc: "Intelligence, mantra, children, past-life merit." },
  A6:  { fromHouse: 6,  name: "Roga Pada",      sanskrit: "A6",               desc: "Disease, enemies, litigation, service." },
  A8:  { fromHouse: 8,  name: "Mrityu Pada",    sanskrit: "A8",               desc: "Longevity, transformation, sudden events." },
  A9:  { fromHouse: 9,  name: "Pitri Pada",     sanskrit: "A9",               desc: "Father, fortune, dharma, guru." },
  A10: { fromHouse: 10, name: "Rajya Pada",     sanskrit: "A10",              desc: "Career, public status, authority." },
  A11: { fromHouse: 11, name: "Labha Pada",     sanskrit: "A11",              desc: "Gains, income, elder siblings, aspirations." }
};

// Classical Arudha Pada algorithm (BPHS): count from the house to its lord's
// house, then count the same number of houses again from the lord's house.
// If the result would fall in the same house or the 7th from the house
// itself (i.e. the Pada would be identical to, or in opposition to, the
// house it represents), the CORRECTED rule (BPHS 29.4-29.5, cross-verified
// against multiple translations) is to take the 10th house FROM THAT
// INTERMEDIATE RESULT — i.e. add 9 signs (0-indexed), not 10.
function calcArudhaPadaSign(houseSignIdx, ascSignIdx, planets){
  const houseLordName = SIGNS[houseSignIdx].lord;
  const lordSignIdx = planets[houseLordName].sign;
  let distance = ((lordSignIdx - houseSignIdx + 12) % 12); // houses counted from the house to its lord (0-11)
  let padaSignIdx = (lordSignIdx + distance) % 12;
  // Check: is padaSignIdx the same as houseSignIdx (1st) or opposite (7th)?
  const diffFromHouse = ((padaSignIdx - houseSignIdx + 12) % 12); // 0 = same sign, 6 = opposite
  if (diffFromHouse === 0 || diffFromHouse === 6){
    padaSignIdx = (padaSignIdx + 9) % 12; // 10th FROM the intermediate result = +9 offset
  }
  return padaSignIdx;
}

function calcAllArudhaPadas(chart, ascSignIdx){
  const result = {};
  for (const key in ARUDHA_HOUSE_META){
    const meta = ARUDHA_HOUSE_META[key];
    const houseSignIdx = (ascSignIdx + meta.fromHouse - 1) % 12;
    result[key] = calcArudhaPadaSign(houseSignIdx, ascSignIdx, chart.planets);
  }
  return result;
}

// Sun's sidereal longitude at the most recent sunrise before birth (the anchor of Hora/Ghati/Bhava/Vighati lagnas).
// (Earlier these used the Sun's longitude AT BIRTH, which drifts up to ~1° from the sunrise position.)
function lastSunriseInfo(chart){
  let sr = chart.sunriseJD; if (chart.julianDay < sr) sr -= 1;
  return { jd: sr, sun: getSiderealLongitudeAt('Sun', sr) };
}
// Hora Lagna (BPHS Ch.5, cross-checked against multiple worked examples):
// starts at the Sun's longitude at sunrise and advances 1 full sign (30°)
// per 2.5 ghatis (= 1 hour) of elapsed time since the most recent sunrise.
// Computed at full degree precision, then reduced to a sign.
function calcHoraLagnaLongitude(chart){
  let elapsedDays = chart.julianDay - chart.sunriseJD;
  if (elapsedDays < 0) elapsedDays += 1; // birth was before today's sunrise -> measure from previous sunrise
  const elapsedGhatis = elapsedDays * 60; // 60 ghatis in a full day
  const degreesTravelled = (elapsedGhatis / 2.5) * 30; // 1 rashi (30°) per 2.5 ghatis
  return normDeg(lastSunriseInfo(chart).sun + degreesTravelled);
}
function calcHoraLagnaSign(chart){
  return getSignIndex(calcHoraLagnaLongitude(chart));
}

// Ghati Lagna (BPHS Ch.5): starts at the SUN'S longitude at sunrise (not the
// Ascendant) and advances 1 full sign (30°) per ghati (24 min) elapsed since
// the most recent sunrise.
function calcGhatiLagnaLongitude(chart){
  let elapsedDays = chart.julianDay - chart.sunriseJD;
  if (elapsedDays < 0) elapsedDays += 1;
  const elapsedGhatis = elapsedDays * 60;
  const degreesTravelled = elapsedGhatis * 30; // 1 rashi (30°) per ghati
  return normDeg(lastSunriseInfo(chart).sun + degreesTravelled);
}
function calcGhatiLagnaSign(chart){
  return getSignIndex(calcGhatiLagnaLongitude(chart));
}

// Varnada Lagna (BPHS + cross-verified worked examples from multiple Jaimini
// sources): for the Lagna and separately for the Hora Lagna, count signs
// directly from Aries if the sign is odd, or in reverse from Pisces if the
// sign is even. If both counts share the same odd/even parity, add them;
// otherwise take their absolute difference (treating a result of 0 as 12).
// Reduce that total to the 1-12 range, then count it out from Aries (if the
// natal Lagna is odd) or in reverse from Pisces (if the natal Lagna is even).
function countFromAriesOrPisces(signIdx){
  const oneIndexed = signIdx + 1;
  const isOdd = (oneIndexed % 2) === 1;
  return isOdd ? oneIndexed : (12 - signIdx);
}
function calcVarnadaLagnaSign(ascSignIdx, horaSignIdx){
  const nLagna = countFromAriesOrPisces(ascSignIdx);
  const nHora = countFromAriesOrPisces(horaSignIdx);
  const lagnaOdd = (ascSignIdx % 2) === 0; // 0-indexed even sign == 1-indexed odd sign
  const horaOdd = (horaSignIdx % 2) === 0;
  let result;
  if (lagnaOdd === horaOdd){
    result = nLagna + nHora;
  } else {
    result = Math.abs(nLagna - nHora);
    if (result === 0) result = 12;
  }
  result = result % 12;
  if (result === 0) result = 12;
  return lagnaOdd ? (result - 1) % 12 : (12 - result) % 12;
}

// Indu Lagna: uses the "Kalas" assigned to the lord of the 9th house counted
// from the Moon, and the lord of the 9th house counted from the Lagna. Their
// Kala values are added; the sum (reduced mod 12, with 0 treated as 12) is
// counted forward from the Moon's own sign (Moon's sign = count 1).
const INDU_LAGNA_KALAS = { Sun:30, Moon:16, Mars:6, Mercury:8, Jupiter:10, Venus:12, Saturn:1 };
function calcInduLagnaSign(chart, ascSignIdx){
  const moonSignIdx = getSignIndex(chart.siderealLongitudes.Moon);
  const ninthFromMoonSignIdx = (moonSignIdx + 8) % 12;
  const ninthFromLagnaSignIdx = (ascSignIdx + 8) % 12;
  const lordOfNinthFromMoon = SIGNS[ninthFromMoonSignIdx].lord;
  const lordOfNinthFromLagna = SIGNS[ninthFromLagnaSignIdx].lord;
  const totalKalas = (INDU_LAGNA_KALAS[lordOfNinthFromMoon] || 0) + (INDU_LAGNA_KALAS[lordOfNinthFromLagna] || 0);
  let remainder = totalKalas % 12;
  if (remainder === 0) remainder = 12;
  return (moonSignIdx + remainder - 1) % 12;
}

// Shree Lagna: the fraction of the Moon's current Nakshatra already crossed
// is scaled across the full 360° zodiac and added to the Ascendant's exact
// longitude (not merely its sign — precision matters near sign boundaries).
function calcShreeLagnaLongitude(chart){
  const moonLon = chart.siderealLongitudes.Moon;
  const nakSpanDeg = 360/27;
  const posInNak = normDeg(moonLon) % nakSpanDeg;
  const fraction = posInNak / nakSpanDeg; // 0..1 through the current nakshatra
  const mappedDeg = fraction * 360; // stretched across a full sign-wheel
  return normDeg(chart.ascendant.longitude + mappedDeg);
}
function calcShreeLagnaSign(chart){
  return getSignIndex(calcShreeLagnaLongitude(chart));
}

// Pranapada Lagna (BPHS Ch.6 v.71-74, verified against the text's own three
// worked examples): time elapsed since the most recent sunrise, in vighatis,
// is converted at 2° per vighati (i.e. divide by 15 to get rashis directly)
// and added to the SUN'S OWN LONGITUDE. If the Sun is in a fixed sign, add a
// further 240°; if in a dual sign, add a further 120° (movable signs: no
// further addition).
function calcPranapadaLagnaLongitude(chart){
  const sunLon = chart.siderealLongitudes.Sun;
  const sunSignIdx = getSignIndex(sunLon);
  let elapsedDays = chart.julianDay - chart.sunriseJD;
  if (elapsedDays < 0) elapsedDays += 1;
  const elapsedVighatis = elapsedDays * 3600; // 1 day = 60 ghatis * 60 vighatis = 3600 vighatis
  const xDeg = normDeg(elapsedVighatis * 2); // 30 deg per 15 vighatis = 2 deg/vighati
  const modality = sunSignIdx % 3; // 0 = movable, 1 = fixed, 2 = dual
  let offsetDeg = 0;
  if (modality === 1) offsetDeg = 240;
  else if (modality === 2) offsetDeg = 120;
  return normDeg(sunLon + xDeg + offsetDeg);
}
function calcPranapadaLagnaSign(chart){
  return getSignIndex(calcPranapadaLagnaLongitude(chart));
}

// Karakamsha Lagna: the Navamsa (D9) sign occupied by the Atmakaraka planet
// (the planet with the highest degree among the 7 classical grahas).
function calcKarakamshaSign(chart){
  const atmakaraka = chart.charaKarakas.Atmakaraka.planet;
  return chart.vargas.D9.planetVargaSign[atmakaraka];
}

// Swamsha Lagna (Lagnamsa): the Navamsa chart's own Ascendant (the D9 Lagna
// sign) — distinct from the Karakamsha (the Atmakaraka's D9 sign). Classical
// texts group both under the umbrella term "Svamsa" when a shared rule
// applies to them, but as a standalone point Swamsha = the D9 Lagna itself.
function calcSwamshaLagnaSign(chart){
  return chart.vargas.D9.ascendantSign;
}

// Padanadhamsa Lagna (per Jaimini Sutramritam / Krishna Mishra's Phaladeepika
// Ratnamala, and multiple cross-checked commentaries): the Navamsa (D9) sign
// occupied by the LORD of the Arudha Lagna (AL) — i.e. find AL in the Rashi
// chart, find its ruling planet, and see which sign that planet falls in
// within the D9 chart.
function calcPadanadhamsaLagnaSign(chart, alSignIdx){
  const alLord = SIGNS[alSignIdx].lord;
  return chart.vargas.D9.planetVargaSign[alLord];
}

// Bhava Lagna (BPHS Ch.5, same family as Hora/Ghati Lagna): starts at the
// Sun's longitude at sunrise and advances 1 full sign (30°) per 5 ghatis
// (2 hours) elapsed since the most recent sunrise — this is the slowest of
// the three "sunrise-anchored" special lagnas, moving at roughly the same
// average pace as the true Ascendant itself.
function calcBhavaLagnaLongitude(chart){
  let elapsedDays = chart.julianDay - chart.sunriseJD;
  if (elapsedDays < 0) elapsedDays += 1;
  const elapsedGhatis = elapsedDays * 60;
  const degreesTravelled = (elapsedGhatis / 5) * 30; // 1 rashi (30°) per 5 ghatis
  return normDeg(lastSunriseInfo(chart).sun + degreesTravelled);
}
function calcBhavaLagnaSign(chart){
  return getSignIndex(calcBhavaLagnaLongitude(chart));
}

// Vighati Lagna: the fourth and fastest member of the sunrise-anchored
// family (Bhava: 5 ghati/rashi, Hora: 2.5 ghati/rashi, Ghati: 1 ghati/rashi),
// completing the same "1 rashi per unit" pattern one level finer — 1 full
// sign (30°) per Vighati (24 seconds) elapsed since the most recent sunrise.
// This makes it extremely time-sensitive, useful chiefly for disambiguating
// near-simultaneous births (classically invoked before resorting to D-60).
function calcVighatiLagnaLongitude(chart){
  let elapsedDays = chart.julianDay - chart.sunriseJD;
  if (elapsedDays < 0) elapsedDays += 1;
  const elapsedVighatis = elapsedDays * 3600; // 1 day = 3600 vighatis
  const degreesTravelled = elapsedVighatis * 30; // 1 rashi (30°) per vighati
  return normDeg(lastSunriseInfo(chart).sun + degreesTravelled);
}
function calcVighatiLagnaSign(chart){
  return getSignIndex(calcVighatiLagnaLongitude(chart));
}

// Bhrigu Bindu (Rahu-Moon midpoint / "destiny point"): the point exactly
// midway between the Moon and Rahu along the SHORTER arc between them.
function calcBhriguBinduLongitude(chart){
  const moonLon = chart.siderealLongitudes.Moon;
  const rahuLon = chart.siderealLongitudes.Rahu;
  const gap = normDeg(rahuLon - moonLon); // 0-360, moving from Moon to Rahu
  let midpoint = normDeg((moonLon + rahuLon) / 2);
  if (gap > 180) midpoint = normDeg(midpoint + 180); // flip to the shorter arc
  return midpoint;
}
function calcBhriguBinduSign(chart){
  return getSignIndex(calcBhriguBinduLongitude(chart));
}

// Paka Lagna ("ripening" ascendant): simply the sign occupied by the Lagna
// Lord (the ruler of the natal Ascendant) — shows what a person actually
// gravitates toward, versus the raw potential shown by the Lagna itself.
function calcPakaLagnaSign(chart, ascSignIdx){
  const lagnaLord = SIGNS[ascSignIdx].lord;
  return chart.planets[lagnaLord].sign;
}

const SPECIAL_LAGNAS_META = {
  UL_LAGNA:   { key:"UL_LAGNA",   name:"Udaya Lagna",        sanskrit:"Lagna / Ascendant",  group:"core",   desc:"The Ascendant itself — physical body, personality, overall life direction." },
  AL:         { key:"AL",         name:"Arudha Lagna",       sanskrit:"AL / Pada Lagna",    group:"arudha", desc: ARUDHA_HOUSE_META.AL.desc },
  KL:         { key:"KL",         name:"Karakamsha Lagna",   sanskrit:"KL",                 group:"karaka", desc:"The Navamsa sign of the Atmakaraka — soul purpose and spiritual identity." },
  UL:         { key:"UL",         name:"Upapada Lagna",      sanskrit:"UL / Gauna Pada / A7",group:"arudha",desc: ARUDHA_HOUSE_META.UL.desc },
  HL:         { key:"HL",         name:"Hora Lagna",         sanskrit:"HL",                 group:"kala",   desc:"Wealth and resource flow, based on elapsed time since sunrise." },
  GL:         { key:"GL",         name:"Ghati Lagna",        sanskrit:"GL",                 group:"kala",   desc:"Fame, honors, and government favor, based on elapsed time since sunrise." },
  BL:         { key:"BL",         name:"Bhava Lagna",        sanskrit:"BL",                 group:"kala",   desc:"General nature, mentality, and physical/mental constitution — the slowest of the sunrise-anchored lagnas." },
  VGL:        { key:"VGL",        name:"Vighati Lagna",      sanskrit:"VGL / Pal Lagna",    group:"kala",   desc:"An extremely fine-grained timing point, classically used to distinguish near-simultaneous births (e.g. twins)." },
  VL:         { key:"VL",         name:"Varnada Lagna",      sanskrit:"VL",                 group:"kala",   desc:"Social standing, class, and reputation." },
  INDU:       { key:"INDU",       name:"Indu Lagna",         sanskrit:"Indu Lagna",         group:"karaka", desc:"Financial prosperity and accumulated wealth (a special money-point)." },
  SL:         { key:"SL",         name:"Shree Lagna",        sanskrit:"SL",                 group:"karaka", desc:"General auspiciousness, prosperity, and good fortune." },
  PRANAPADA:  { key:"PRANAPADA",  name:"Pranapada Lagna",    sanskrit:"Pranapada",          group:"kala",   desc:"Vitality, life-force, and how one meets fated events." },
  SWAMSHA:    { key:"SWAMSHA",    name:"Swamsha Lagna",      sanskrit:"Swamsha / Lagnamsa", group:"karaka", desc:"The Navamsa chart's own Ascendant (Lagnamsa) — inner self and dharmic path, distinct from the Karakamsha." },
  PADANADHAMSA:{key:"PADANADHAMSA",name:"Padanadhamsa Lagna",sanskrit:"Padanadhamsa",       group:"arudha", desc:"The Navamsa sign of the Arudha Lagna's own lord — a refinement of public image at the soul-division level." },
  BB:         { key:"BB",         name:"Bhrigu Bindu",       sanskrit:"BB / Destiny Point", group:"karaka", desc:"The midpoint of Moon and Rahu — a sensitive karmic 'destiny point' activated by transits and dashas." },
  PAKA:       { key:"PAKA",       name:"Paka Lagna",         sanskrit:"Paka Lagna",         group:"arudha", desc:"The sign occupied by the Lagna Lord — what a person actually gravitates toward, versus raw Lagna potential." },
  CHANDRA:    { key:"CHANDRA",    name:"Chandra Lagna",      sanskrit:"Moon Sign",          group:"core",   desc:"The Moon's own sign, used as an alternate ascendant for mind and emotion." },
  SURYA:      { key:"SURYA",      name:"Surya Lagna",        sanskrit:"Sun Sign",           group:"core",   desc:"The Sun's own sign, used as an alternate ascendant for soul and vitality." },
  A2:         { key:"A2",         name:"Dhana Pada",         sanskrit:"A2",                 group:"arudha", desc: ARUDHA_HOUSE_META.A2.desc },
  A3:         { key:"A3",         name:"Bhatru Pada",        sanskrit:"A3",                 group:"arudha", desc: ARUDHA_HOUSE_META.A3.desc },
  A4:         { key:"A4",         name:"Matru Pada",         sanskrit:"A4",                 group:"arudha", desc: ARUDHA_HOUSE_META.A4.desc },
  A5:         { key:"A5",         name:"Mantra Pada",        sanskrit:"A5",                 group:"arudha", desc: ARUDHA_HOUSE_META.A5.desc },
  A6:         { key:"A6",         name:"Roga Pada",          sanskrit:"A6",                 group:"arudha", desc: ARUDHA_HOUSE_META.A6.desc },
  A8:         { key:"A8",         name:"Mrityu Pada",        sanskrit:"A8",                 group:"arudha", desc: ARUDHA_HOUSE_META.A8.desc },
  A9:         { key:"A9",         name:"Pitri Pada",         sanskrit:"A9",                 group:"arudha", desc: ARUDHA_HOUSE_META.A9.desc },
  A10:        { key:"A10",        name:"Rajya Pada",         sanskrit:"A10",                group:"arudha", desc: ARUDHA_HOUSE_META.A10.desc },
  A11:        { key:"A11",        name:"Labha Pada",         sanskrit:"A11",                group:"arudha", desc: ARUDHA_HOUSE_META.A11.desc }
};
const SPECIAL_LAGNAS_ORDER = ["UL_LAGNA","AL","KL","UL","HL","GL","BL","VGL","VL","INDU","SL","PRANAPADA","SWAMSHA","PADANADHAMSA","BB","PAKA","CHANDRA","SURYA","A2","A3","A4","A5","A6","A8","A9","A10","A11"];

// Computes the sign index (0-11, Aries=0) for every special lagna.
function computeAllSpecialLagnaSigns(chart){
  const ascSignIdx = chart.ascendant.sign;
  const arudhaPadas = calcAllArudhaPadas(chart, ascSignIdx);
  const horaSignIdx = calcHoraLagnaSign(chart);

  const signs = {
    UL_LAGNA: ascSignIdx,
    AL: arudhaPadas.AL,
    KL: calcKarakamshaSign(chart),
    UL: arudhaPadas.UL,
    HL: horaSignIdx,
    GL: calcGhatiLagnaSign(chart),
    BL: calcBhavaLagnaSign(chart),
    VGL: calcVighatiLagnaSign(chart),
    VL: calcVarnadaLagnaSign(ascSignIdx, horaSignIdx),
    INDU: calcInduLagnaSign(chart, ascSignIdx),
    SL: calcShreeLagnaSign(chart),
    PRANAPADA: calcPranapadaLagnaSign(chart),
    SWAMSHA: calcSwamshaLagnaSign(chart),
    PADANADHAMSA: calcPadanadhamsaLagnaSign(chart, arudhaPadas.AL),
    BB: calcBhriguBinduSign(chart),
    PAKA: calcPakaLagnaSign(chart, ascSignIdx),
    CHANDRA: getSignIndex(chart.siderealLongitudes.Moon),
    SURYA: getSignIndex(chart.siderealLongitudes.Sun),
    A2: arudhaPadas.A2, A3: arudhaPadas.A3, A4: arudhaPadas.A4, A5: arudhaPadas.A5,
    A6: arudhaPadas.A6, A8: arudhaPadas.A8, A9: arudhaPadas.A9, A10: arudhaPadas.A10, A11: arudhaPadas.A11
  };
  return signs;
}

// Builds a full varga-shaped dataset (ascendantSign, houses, planetVargaSign)
// for a chosen special lagna acting as the new Ascendant, for a given
// divisional chart (D1..D60). Planets keep their own divisional placement;
// only the reference point (Lagna) changes, exactly as classical Jyotish
// treats these special points as alternate ascendants for house-counting.
function buildVargaFromLagna(chart, lagnaSignIdx, vargaKey){
  const planetVargaSign = {};
  PLANET_LIST.forEach(name => {
    planetVargaSign[name] = chart.vargas[vargaKey].planetVargaSign[name];
  });
  const houses = [];
  for (let h=1; h<=12; h++){
    const signIdx = (lagnaSignIdx + h - 1) % 12;
    const sign = SIGNS[signIdx];
    const planetsHere = PLANET_LIST.filter(name => planetVargaSign[name] === signIdx).map(name => ({
      name, retrograde: chart.planets[name].retrograde,
      dignity: vargaKey === "D1" ? chart.planets[name].dignity : getDignity(name, signIdx, 15)
    }));
    houses.push({
      houseNum: h, sign: signIdx, signName: sign.name, signSanskrit: sign.sk,
      signLord: sign.lord, signSymbol: sign.symbol, element: sign.element, modality: sign.modality,
      planets: planetsHere, isEmpty: planetsHere.length === 0
    });
  }
  const V0 = chart.vargas[vargaKey];
  return { ascendantSign: lagnaSignIdx, houses, planetVargaSign, outerSign: V0.outerSign, outerRx: V0.outerRx };
}

// Plain-text render of one lagna's chart (for a chosen divisional chart) —
// used by the "Copy Current Chart" button in the Lagnas tab.
function lagnaChartToPlainText(chart, lagnaKey, vargaKey, vdata, aspectRows){
  const lagnaMeta = SPECIAL_LAGNAS_META[lagnaKey];
  const vargaMeta = VARGAS[vargaKey];
  const ascSign = SIGNS[vdata.ascendantSign];
  let out = `${lagnaMeta.name} (${lagnaMeta.sanskrit}) — ${vargaKey} ${vargaMeta.name}\n`;
  out += '='.repeat(60) + '\n';
  out += `${lagnaMeta.desc}\n`;
  out += `Ascendant (this Lagna): ${ascSign.name} (${ascSign.sk})\n\n`;
  out += `HOUSES\n${'-'.repeat(60)}\n`;
  vdata.houses.forEach(h => {
    const occupants = h.isEmpty ? 'Empty' : h.planets.map(p => `${p.name}${p.retrograde ? ' (R)' : ''}`).join(', ');
    out += `H${h.houseNum} — ${h.signName} (${h.signSanskrit}), Lord: ${h.signLord} :: ${occupants}\n`;
  });
  if (aspectRows){
    out += `\n${aspectRowsToPlainText(aspectRows, `${lagnaKey} · ${vargaKey}`)}`;
  }
  return out;
}

// Plain-text render of ALL 23 special lagnas at once (their sign placements
// and a full D1 house breakdown for each) — used by "Copy All Lagnas".
function allLagnasToPlainText(chart, specialLagnaSigns, vargaKey){
  const vargaMeta = VARGAS[vargaKey];
  let out = `SPECIAL LAGNAS — FULL EXPORT (cast on ${vargaKey} ${vargaMeta.name})\n`;
  out += '='.repeat(70) + '\n\n';
  const groupLabels = { core: "Core Ascendants", arudha: "Arudha Padas", karaka: "Karaka-Based", kala: "Time-Based (Kala)" };
  ["core","arudha","karaka","kala"].forEach(group => {
    out += `${groupLabels[group].toUpperCase()}\n${'-'.repeat(70)}\n`;
    SPECIAL_LAGNAS_ORDER.filter(k => SPECIAL_LAGNAS_META[k].group === group).forEach(key => {
      const meta = SPECIAL_LAGNAS_META[key];
      const signIdx = specialLagnaSigns[key];
      const sign = SIGNS[signIdx];
      out += `\n${meta.name} (${meta.sanskrit}): ${sign.name} (${sign.sk})\n`;
      out += `  ${meta.desc}\n`;
      const vdata = buildVargaFromLagna(chart, signIdx, vargaKey);
      vdata.houses.forEach(h => {
        if (h.isEmpty) return;
        const occupants = h.planets.map(p => `${p.name}${p.retrograde ? ' (R)' : ''}`).join(', ');
        out += `    H${h.houseNum} ${h.signName}: ${occupants}\n`;
      });
    });
    out += '\n';
  });
  return out;
}



/* Rasi Tulya Navamsa extras: Arudha padas (AL, UL, A2..A12) computed ON the RTN chart (planets = their D9 signs, lagna = D1 lagna),
   shown as a strip under the chart table. Planet degrees are the real D1 degrees (RTN keeps them). */
function buildRtnExtras(chart, vdata){
  const pseudo = { planets:{} };
  PLANET_LIST.forEach(n => { pseudo.planets[n] = { sign: vdata.planetVargaSign[n] }; });
  const ar = calcAllArudhaPadas(pseudo, vdata.ascendantSign);
  const chips = Object.keys(ar).map(k => {
    const sg = ar[k], h = ((sg - vdata.ascendantSign + 12) % 12) + 1;
    return `<span class="occupant-chip" title="${ARUDHA_HOUSE_META[k].name}"><b>${k}</b>&nbsp;${SIGNS[sg].symbol} ${SIGNS[sg].name} <span class="tiny">H${h}</span></span>`;
  }).join(' ');
  return `<div class="varga-footer" style="flex-direction:column;align-items:flex-start;gap:8px"><span><strong>Arudha padas</strong> on this chart (AL = Arudha Lagna, UL = Upapada)</span><div>${chips}</div></div>`;
}

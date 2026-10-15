/* ---------- Bhava Chalit (Sripati) ---------- */
function computeBhavaChalit(chart, lat, lon){
  const jd = chart.julianDay, ayan = chart.ayanamsa;
  const lst = normDeg(greenwichSiderealTime(jd) + lon), eps = obliquityOfEcliptic(jd) * DEG;
  const mc = normDeg(Math.atan2(Math.sin(lst * DEG), Math.cos(lst * DEG) * Math.cos(eps)) * RAD - ayan);
  const asc = normDeg(ascendantLongitude(jd, lat, lon) - ayan), ic = normDeg(mc + 180);
  const d = normDeg(asc - mc), d2 = normDeg(ic - asc), mad = new Array(13);
  mad[1] = asc; mad[4] = ic; mad[7] = normDeg(asc + 180); mad[10] = mc;
  mad[11] = normDeg(mc + d / 3); mad[12] = normDeg(mc + 2 * d / 3);
  mad[2] = normDeg(asc + d2 / 3); mad[3] = normDeg(asc + 2 * d2 / 3);
  mad[5] = normDeg(mad[11] + 180); mad[6] = normDeg(mad[12] + 180); mad[8] = normDeg(mad[2] + 180); mad[9] = normDeg(mad[3] + 180);
  const begin = new Array(14);
  for (let i = 1; i <= 12; i++){ const p = i === 1 ? 12 : i - 1; begin[i] = normDeg(mad[p] + normDeg(mad[i] - mad[p]) / 2); }
  begin[13] = begin[1];
  const houses = [];
  for (let i = 1; i <= 12; i++) houses.push({ n: i, madhya: mad[i], begin: begin[i], end: begin[i + 1], planets: [] });
  const place = {};
  PLANET_LIST.forEach(name => {
    const lonP = chart.planets[name].longitude !== undefined ? chart.planets[name].longitude : null;
    const L = lonP === null ? null : normDeg(lonP);
    let h = null;
    for (let i = 1; i <= 12; i++){ if (normDeg(L - begin[i]) < normDeg(begin[i + 1] - begin[i]) || (i === 12 && normDeg(L - begin[12]) < normDeg(begin[1] - begin[12]))){ h = i; break; } }
    place[name] = { lon: L, whole: chart.planets[name].house, chalit: h, shifted: h !== chart.planets[name].house, fromMadhya: angDiffSigned(L, mad[h]) };
    houses[h - 1].planets.push(name);
  });
  return { asc, mc, ic, desc: mad[7], houses, place };
}


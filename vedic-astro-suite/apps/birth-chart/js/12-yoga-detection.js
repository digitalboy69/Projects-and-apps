
const KENDRA_HOUSES = [1,4,7,10];
const TRIKONA_HOUSES = [1,5,9];
const DUSTHANA_HOUSES = [6,8,12];
function housesApart(fromHouse, toHouse){
  let d = toHouse - fromHouse;
  if (d < 0) d += 12;
  return d + 1;
}

function detectPanchaMahapurushaYogas(planets){
  const results = [];
  const MAHAPURUSHA_PLANETS = { Mars: "Ruchaka", Mercury: "Bhadra", Jupiter: "Hamsa", Venus: "Malavya", Saturn: "Sasa" };
  for (const name in MAHAPURUSHA_PLANETS){
    const p = planets[name];
    if (!p) continue;
    const inKendra = KENDRA_HOUSES.includes(p.house);
    const inOwnOrExalted = (OWN_SIGNS[name]&&OWN_SIGNS[name].includes(p.sign)) || p.sign===EXALTATION[name].sign;
    if (inKendra && inOwnOrExalted){
      results.push({ yoga: MAHAPURUSHA_PLANETS[name], planet:name, house:p.house, sign:p.sign });
    }
  }
  return results;
}
function detectGajaKesariYoga(planets){
  const moonHouse = planets.Moon.house;
  const jupiterHouse = planets.Jupiter.house;
  const dist = housesApart(moonHouse, jupiterHouse);
  const kendraFromMoon = [1,4,7,10].includes(dist);
  return kendraFromMoon ? { yoga:"Gaja Kesari", moonHouse, jupiterHouse, distance:dist } : null;
}
function getHouseLord(houseNum, ascSign){
  const signOfHouse = (ascSign + houseNum - 1) % 12;
  return SIGNS[signOfHouse].lord;
}
function detectRajaYogas(planets, ascSign){
  const results = [];
  const seen = new Set();
  const kendraLords = new Set(KENDRA_HOUSES.map(h=>getHouseLord(h,ascSign)));
  const trikonaLords = new Set(TRIKONA_HOUSES.map(h=>getHouseLord(h,ascSign)));
  kendraLords.forEach(kLord=>{
    trikonaLords.forEach(tLord=>{
      if (kLord===tLord) return;
      const key = [kLord,tLord].sort().join('-');
      if (seen.has(key)) return;
      const kPlanet = planets[kLord];
      const tPlanet = planets[tLord];
      if (!kPlanet || !tPlanet) return;
      const conjunct = kPlanet.house === tPlanet.house;
      const mutualAspect = kPlanet.aspectsHouses && tPlanet.aspectsHouses &&
        kPlanet.aspectsHouses.includes(tPlanet.house) && tPlanet.aspectsHouses.includes(kPlanet.house);
      if (conjunct || mutualAspect){
        seen.add(key);
        results.push({ yoga:"Raja Yoga", kendraLord:kLord, trikonaLord:tLord, type: conjunct?"conjunction":"mutual aspect" });
      }
    });
  });
  return results;
}
function detectParivartanaYogas(planets, ascSign){
  const results = [];
  const checked = new Set();
  for (let h1=1; h1<=12; h1++){
    const lord1 = getHouseLord(h1, ascSign);
    const lord1Planet = planets[lord1];
    if (!lord1Planet) continue;
    const lord1CurrentHouse = lord1Planet.house;
    if (lord1CurrentHouse === h1) continue;
    const lord2 = getHouseLord(lord1CurrentHouse, ascSign);
    if (lord2 === lord1) continue;
    const lord2Planet = planets[lord2];
    if (!lord2Planet) continue;
    if (lord2Planet.house === h1){
      const key = [lord1,lord2].sort().join('-');
      if (!checked.has(key)){
        checked.add(key);
        results.push({ yoga:"Parivartana (Exchange)", houseA:h1, lordA:lord1, houseB:lord1CurrentHouse, lordB:lord2 });
      }
    }
  }
  return results;
}
function detectViparitaRajaYoga(planets, ascSign){
  // Classical definition: the lord of the 6th (Harsha), 8th (Sarala) or 12th (Vimala) is placed in the 6th, 8th or 12th house.
  const NAME = { 6:'Harsha', 8:'Sarala', 12:'Vimala' }, results = [];
  DUSTHANA_HOUSES.forEach(h=>{
    const lord = getHouseLord(h, ascSign), p = planets[lord];
    if (p && DUSTHANA_HOUSES.includes(p.house))
      results.push({ yoga: NAME[h]+' Viparita Raja Yoga', houseA:h, lordA:lord, houseB:p.house, lordB:lord, type: h===p.house ? `${h}th lord in its own house` : `${h}th lord placed in the ${p.house}th house` });
  });
  return results;
}
function detectNeechaBhanga(planets, ascSign){
  const results = [];
  const NEECHA_ELIGIBLE = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
  for (const name of NEECHA_ELIGIBLE){
    const p = planets[name];
    const deb = getDebilitation(name);
    if (!p || p.sign !== deb.sign) continue;
    const dispositor = SIGNS[p.sign].lord;
    const dispositorPlanet = planets[dispositor];
    if (!dispositorPlanet) continue;
    const kendraFromLagna = KENDRA_HOUSES.includes(dispositorPlanet.house);
    const moonHouse = planets.Moon.house;
    const distFromMoon = housesApart(moonHouse, dispositorPlanet.house);
    const kendraFromMoon = KENDRA_HOUSES.includes(distFromMoon);
    const exLord = SIGNS[EXALTATION[name].sign].lord, exP = planets[exLord];
    const exKendra = exP && exLord !== dispositor && (KENDRA_HOUSES.includes(exP.house) || KENDRA_HOUSES.includes(housesApart(moonHouse, exP.house)));
    if (kendraFromLagna || kendraFromMoon){
      results.push({ yoga:"Neecha Bhanga Raja Yoga", planet:name, dispositor, condition: kendraFromLagna?"dispositor in kendra from Lagna":"dispositor in kendra from Moon" });
    } else if (exKendra){
      results.push({ yoga:"Neecha Bhanga Raja Yoga", planet:name, dispositor:exLord, condition:`lord of its exaltation sign, in a kendra` });
    }
  }
  return results;
}


function pad(str, len){ str = String(str); return str + ' '.repeat(Math.max(0,len-str.length)); }
function rule(char, len){ return (char||'-').repeat(len||70); }
function centerLine(str, width){
  width = width || 70;
  const padTotal = Math.max(0, width - str.length);
  const left = Math.floor(padTotal/2);
  return ' '.repeat(left) + str;
}

function buildFullReportText(chart, profile, sections, liveSkyData){
  sections = sections || {}; 
  const want = (key) => sections[key] !== false; 
  const lines = [];
  const W = 78;
  const add = (s='') => lines.push(s);
  const section = (title) => { add(); add(rule('=', W)); add(centerLine(title, W)); add(rule('=', W)); add(); };
  const subsection = (title) => { add(); add(title); add(rule('-', title.length)); };

  add(rule('=', W));
  add(centerLine('Vedic Astrology — FULL VEDIC BIRTH CHART REPORT', W));
  add(rule('=', W));
  add(`Generated: ${new Date().toString()}`);
  add();

  if (want('birthDetails')){
    section('BIRTH DETAILS');
    add(`Name:            ${profile.name}`);
    add(`Date of Birth:   ${profile.dob}`);
    add(`Time of Birth:   ${profile.tob}`);
    add(`Timezone:        ${fmtTz(profile.tz)}`);
    add(`Place of Birth:  ${profile.place}`);
    add(`Coordinates:     ${profile.lat.toFixed(4)}°, ${profile.lon.toFixed(4)}°`);
    add(`Ayanamsa:        Lahiri, ${chart.ayanamsa.toFixed(4)}°`);
    add(`Julian Day (UT): ${chart.julianDay.toFixed(6)}`);
  }

  const ascSign = SIGNS[chart.ascendant.sign];
  const moonSign = SIGNS[chart.planets.Moon.sign];
  const sunSign = SIGNS[chart.planets.Sun.sign];
  const moonNak = chart.planets.Moon.nakshatra;
  if (want('chartSummary')){
    section('CHART SUMMARY');
    add(`Ascendant (Lagna):    ${ascSign.name} (${ascSign.sk}), Lord ${ascSign.lord}, ${formatDeg(chart.ascendant.degInSign)}`);
    add(`Moon Sign (Rashi):    ${moonSign.name} (${moonSign.sk}), Lord ${moonSign.lord}, ${formatDeg(chart.planets.Moon.degInSign)}`);
    add(`Sun Sign:             ${sunSign.name} (${sunSign.sk}), Lord ${sunSign.lord}, ${formatDeg(chart.planets.Sun.degInSign)}`);
    add(`Janma Nakshatra:      ${moonNak.name}, Pada ${moonNak.pada}, Lord ${moonNak.lord}, Deity ${moonNak.deity}`);
    add(`Lagna Nakshatra:      ${chart.ascendant.nakshatra.name}, Pada ${chart.ascendant.nakshatra.pada}`);
  }

  if (want('karakas')){
    section('CHARA KARAKA (JAIMINI SOUL SIGNIFICATORS)');
    KARAKA_NAMES.forEach(k=>{
      const data = chart.charaKarakas[k];
      add(`${pad(k+':',18)} ${pad(data.planet,10)} ${formatDeg(data.degree)}  -  ${KARAKA_SIGNIFICANCE[k]}`);
    });
  }

  if (want('planetTable')){
    section('GRAHA SPHUTA — PLANETARY POSITIONS (D1)');
    PLANET_LIST.forEach(name=>{
      const p = chart.planets[name];
      const sign = SIGNS[p.sign];
      add(`${pad(name,10)} ${sign.name} (${sign.sk}), ${formatDeg(p.degInSign)}  |  House ${p.house}  |  Lord: ${sign.lord}${p.retrograde ? '  |  RETROGRADE' : ''}`);
      add(`${pad('',10)} Nakshatra: ${p.nakshatra.name}, Pada ${p.nakshatra.pada} (Lord ${p.nakshatra.lord})  |  Dignity: ${p.dignity.label}`);
      add(`${pad('',10)} Degrees traveled in sign: ${formatDeg(p.degInSign)}  |  Degrees remaining: ${formatDeg(p.degRemainingInSign)}  |  Speed: ${Math.abs(p.speed).toFixed(4)}°/day ${p.retrograde?'(retrograde)':'(direct)'}`);
      add(`${pad('',10)} Absolute sidereal longitude: ${formatDeg(normDeg(p.longitude))}  |  Aspects houses: ${p.aspectsHouses.map(h=>'H'+h).join(', ')}`);
    });

    subsection('Outer Planets (modern; not used in classical Vedic strength or dasha)');
    OUTER_LIST.forEach(n=>{
      const o = chart.outer[n], sg = SIGNS[o.sign];
      add(`${pad(n,10)} ${sg.name} (${sg.sk}), ${formatDeg(o.degInSign)}  |  House ${o.house}${o.retrograde ? '  |  RETROGRADE' : ''}  |  Nakshatra: ${o.nakshatra.name}, Pada ${o.nakshatra.pada}  |  Absolute sidereal longitude: ${formatDeg(normDeg(o.longitude))}`);
      add(`${pad('',10)} Themes: ${OUTER_INFO[n].themes.slice(0,4).join(', ')}  |  ${outerHouseLine(n, o.house)}`);
      const tg = PLANET_LIST.map(x=>[x, chart.planets[x].longitude]).concat(OUTER_LIST.map(x=>[x, chart.outer[x].longitude])).concat([['Ascendant', chart.ascendant.longitude]]);
      const a = outerAspectsTo(o.longitude, tg, n);
      add(`${pad('',10)} Western aspects: ${a.length ? a.map(r=>`${r.asp.name} ${r.target} (${r.dev.toFixed(1)}° orb)`).join('; ') : 'none within orb'}`);
    });

    subsection('Combustion Status');
    PLANET_LIST.forEach(name=>{
      const p = chart.planets[name];
      if (p.combustion && p.combustion.separation !== undefined){
        add(`${pad(name,10)} ${p.combustion.separation.toFixed(2)}° from Sun  -  ${p.combustion.combust ? 'COMBUST (orb '+p.combustion.orb+'°)' : 'Not combust'}`);
      }
    });
    if (chart.wars && chart.wars.length){
      subsection('Planetary War (Graha Yuddha)');
      chart.wars.forEach(w=> add(`${w.planetA} vs ${w.planetB}: ${w.separation.toFixed(2)}° apart, ${w.winner} wins (simplified longitude-based rule)`));
    }
  }

  if (want('aspects')){
    section('DRISHTI — PLANETARY ASPECTS (D1)');
    PLANET_LIST.forEach(name=>{
      const p = chart.planets[name];
      const aspectedSigns = p.aspectsHouses.map(h=>{
        const signIdx = (chart.ascendant.sign + h - 1) % 12;
        return SIGNS[signIdx].name;
      });
      add(`${pad(name,10)} in House ${p.house}  ->  aspects House(s) ${p.aspectsHouses.map(h=>'H'+h).join(', ')}  (${aspectedSigns.join(', ')})`);
    });
  }

  if (want('yogas')){
    section('YOGAS — NOTABLE PLANETARY COMBINATIONS');
    const y = chart.yogas;
    let yogaCount = 0;
    y.panchaMahapurusha.forEach(p=>{ add(`${p.yoga} Yoga: ${p.planet} in ${SIGNS[p.sign].name} (House ${p.house})`); yogaCount++; });
    if (y.gajaKesari){ add(`Gaja Kesari Yoga: Jupiter (H${y.gajaKesari.jupiterHouse}) in kendra from Moon (H${y.gajaKesari.moonHouse})`); yogaCount++; }
    y.rajaYogas.forEach(r=>{ add(`Raja Yoga: kendra lord ${r.kendraLord} + trikona lord ${r.trikonaLord} (${r.type})`); yogaCount++; });
    y.parivartana.forEach(p=>{ add(`Parivartana Yoga: House ${p.houseA} <-> House ${p.houseB} (${p.lordA} / ${p.lordB} exchange)`); yogaCount++; });
    y.viparitaRaja.forEach(v=>{ add(`${v.yoga}: ${v.type} (${v.lordA})`); yogaCount++; });
    y.neechaBhanga.forEach(n=>{ add(`Neecha Bhanga Raja Yoga: ${n.planet}'s debilitation cancelled (dispositor ${n.dispositor} ${n.condition})`); yogaCount++; });
    if (yogaCount === 0) add('No yogas found from this detection set (Pancha Mahapurusha, Gaja Kesari, Raja Yoga, Parivartana, Viparita Raja Yoga, Neecha Bhanga).');
  }

  if (want('shadbala')){
    section('SHADBALA — SIX-FOLD PLANETARY STRENGTH');
    add('(Note: Varsha/Masa Lord follow one documented convention among several traditions.)');
    add(`Dina Lord (Day): ${chart.shadbala.dinaLord}   Hora Lord (Hour): ${chart.shadbala.horaLord}   Varsha Lord (Year): ${chart.shadbala.varshaLord}   Masa Lord (Month): ${chart.shadbala.masaLord}`);
    add();
    BALA_PLANETS.forEach(name=>{
      const s = chart.shadbala.planets[name];
      add(`${pad(name+':',10)} ${s.totalRupas.toFixed(2)} Rupas / ${s.requiredRupas} required  ->  ${s.isStrong?'STRONG':'BELOW THRESHOLD'} (${s.percentOfRequired.toFixed(0)}%)`);
      add(`${pad('',10)} Sthana ${(s.sthanaBala.total/60).toFixed(2)}R (Uchcha ${(s.sthanaBala.uchcha/60).toFixed(2)} + Saptavargaja ${(s.sthanaBala.saptavargaja/60).toFixed(2)} + OjaYugma ${(s.sthanaBala.ojaYugma/60).toFixed(2)} + Kendradi ${(s.sthanaBala.kendradi/60).toFixed(2)} + Drekkana ${(s.sthanaBala.drekkana/60).toFixed(2)})`);
      add(`${pad('',10)} Dig ${(s.digBala/60).toFixed(2)}R | Kala ${(s.kalaBala.total/60).toFixed(2)}R (Nathonnata ${(s.kalaBala.nathonnata/60).toFixed(2)} + Paksha ${(s.kalaBala.paksha/60).toFixed(2)} + Tribhaga ${(s.kalaBala.tribhaga/60).toFixed(2)} + VMDH ${(s.kalaBala.vmdh/60).toFixed(2)} + Ayana ${(s.kalaBala.ayana/60).toFixed(2)})`);
      add(`${pad('',10)} Chesta ${(s.chestaBala/60).toFixed(2)}R | Naisargika ${(s.naisargikaBala/60).toFixed(2)}R | Drik ${(s.drikBala/60).toFixed(2)}R`);
    });
  }

  if (want('ashtakavarga')){
    section('ASHTAKAVARGA — POINT-STRENGTH SYSTEM');
    const av = chart.ashtakavarga;
    subsection('Sarvashtakavarga (combined, all 7 planets)');
    add(pad('Sign',14) + 'Bindus');
    for (let h=0; h<12; h++){
      const signIdx = (chart.ascendant.sign + h) % 12;
      add(pad(SIGNS[signIdx].name,14) + av.sav[signIdx]);
    }
    add(`TOTAL: ${av.sav.reduce((a,b)=>a+b,0)} (theoretical constant: 337 for every chart)`);
    BALA_PLANETS.forEach(p=>{
      subsection(`${p} Bhinnashtakavarga`);
      add(pad('Sign',14) + 'Bindus');
      for (let h=0; h<12; h++){
        const signIdx = (chart.ascendant.sign + h) % 12;
        add(pad(SIGNS[signIdx].name,14) + av.bavTables[p][signIdx]);
      }
      add(`TOTAL: ${av.bavTables[p].reduce((a,b)=>a+b,0)}`);
    });
  }

  if (want('dasha')){
    section('VIMSHOTTARI DASHA — FULL PERIOD TIMELINE');
    add(`Starting lord at birth: ${chart.dashaData.startLord} (balance ${chart.dashaData.balanceYears.toFixed(2)} years)`);
    const activeNow = findActiveDasha(chart.dashaData.mahadashas, new Date());
    if (activeNow){
      subsection('Currently Active (as of report generation)');
      add(`Mahadasha:       ${activeNow.mahadasha.lord}  (${formatDashaDate(activeNow.mahadasha.startDate)} -> ${formatDashaDate(activeNow.mahadasha.endDate)})`);
      if (activeNow.antardasha) add(`Antardasha:      ${activeNow.antardasha.lord}  (${formatDashaDate(activeNow.antardasha.startDate)} -> ${formatDashaDate(activeNow.antardasha.endDate)})`);
      if (activeNow.pratyantardasha) add(`Pratyantardasha: ${activeNow.pratyantardasha.lord}  (${formatDashaDatePrecise(activeNow.pratyantardasha.startDate)} -> ${formatDashaDatePrecise(activeNow.pratyantardasha.endDate)})`);
      if (activeNow.sookshmaDasha) add(`Sookshma Dasha:  ${activeNow.sookshmaDasha.lord}  (${formatDashaDatePrecise(activeNow.sookshmaDasha.startDate)} -> ${formatDashaDatePrecise(activeNow.sookshmaDasha.endDate)})`);
      if (activeNow.pranaDasha) add(`Prana Dasha:     ${activeNow.pranaDasha.lord}  (${formatDashaDateTime(activeNow.pranaDasha.startDate)} -> ${formatDashaDateTime(activeNow.pranaDasha.endDate)})`);
      add('Note: Pratyantardasha/Sookshma/Prana are shown only for the currently active window, not the full lifespan, since expanding all levels across a lifetime produces tens of thousands of entries.');
    }
    subsection('Full Lifespan — Mahadasha and Antardasha');
    add();
    chart.dashaData.mahadashas.forEach(m=>{
      add(`${pad(m.lord+' Mahadasha:',22)} ${formatDashaDate(m.startDate)} -> ${formatDashaDate(m.endDate)}  (${m.years.toFixed(2)} years)`);
      const ads = calculateAntardashas(m);
      ads.forEach(a=>{
        add(`${pad('',24)} ${pad(a.lord+' Antardasha:',20)} ${formatDashaDate(a.startDate)} -> ${formatDashaDate(a.endDate)}`);
      });
      add();
    });
  }

  if (want('liveSky') && liveSkyData){
    section('GOCHARA — LIVE SKY AT TIME OF EXPORT');
    add(`Observed as of: ${liveSkyData.sky.now.toString()}`);
    add(`Observer location: ${liveSkyData.locationLabel || (liveSkyData.lat.toFixed(4)+'°, '+liveSkyData.lon.toFixed(4)+'°')}`);
    add(`Coordinates: ${liveSkyData.lat.toFixed(4)}°, ${liveSkyData.lon.toFixed(4)}°  |  Timezone: ${fmtTz(liveSkyData.tz)}`);
    add(`Ayanamsa at this moment: Lahiri, ${liveSkyData.sky.ayanamsa.toFixed(4)}°`);
    add();
    PLANET_LIST.forEach(name=>{
      const p = liveSkyData.sky.planets[name];
      const sign = SIGNS[p.sign];
      add(`${pad(name,10)} ${sign.name} (${sign.sk}), ${formatDeg(p.degInSign)}${p.retrograde?'  |  RETROGRADE':''}`);
      add(`${pad('',10)} Nakshatra: ${p.nakshatra.name}, Pada ${p.nakshatra.pada} (Lord ${p.nakshatra.lord})  |  Speed: ${Math.abs(p.speed).toFixed(4)}°/day`);
      if (p.natalHouse !== null){
        add(`${pad('',10)} Falls in natal House ${p.natalHouse}: ${p.natalHouseTheme}`);
      }
    });
  }

  if (want('vargas')){
    section('SHODASA VARGA — ALL DIVISIONAL CHARTS (D1 - D60)');
    Object.keys(VARGAS).forEach(key=>{
      if (sections.vargaKeys && sections.vargaKeys.indexOf(key) === -1) return;
      const meta = VARGAS[key];
      const vdata = chart.vargas[key];
      const ascVSign = SIGNS[vdata.ascendantSign];
      subsection(`${key} — ${meta.name} (${meta.full})`);
      add(`Significance: ${meta.desc}`);
      add(`Ascendant: ${ascVSign.name} (${ascVSign.sk})`);
      add();
      vdata.houses.forEach(h=>{
        const sign = SIGNS[h.sign];
        add(`H${h.houseNum}: ${h.signName} (${h.signSanskrit}), Lord ${h.signLord}, ${sign.element}/${sign.modality}`);
        if (h.isEmpty){
          add(`${pad('',6)} (no planets placed here)`);
        } else {
          h.planets.forEach(p=>{
            add(`${pad('',6)} ${p.name}${p.retrograde?' (R)':''} — Dignity: ${p.dignity.label}`);
          });
        }
      });
      add();
    });
  }

  if (want('rawLongitudes')){
    section('REFERENCE — RAW SIDEREAL LONGITUDES (ABSOLUTE 0-360°)');
    add('Useful for cross-checking against other astrology software.');
    add();
    PLANET_LIST.forEach(name=>{
      const p = chart.planets[name];
      add(`${pad(name,10)} ${normDeg(p.longitude).toFixed(6)}°`);
    });
    add(`${pad('Ascendant',10)} ${normDeg(chart.ascendant.longitude).toFixed(6)}°`);
  }

  if (want('deepReading') && window.VDR){
    try { section('DEEP READING: CLASSICAL INTERPRETATIONS'); add(VDR.reportText(chart)); }
    catch(e){ add('(Deep reading could not be built for this chart.)'); }
  }

  add(rule('=', W));
  add(centerLine('END OF REPORT', W));
  add(centerLine('Generated by Vedic Astrology — computed locally, Lahiri Ayanamsa', W));
  add(rule('=', W));

  return lines.join('\n');
}

let exportSelectedVargas = new Set(Object.keys(VARGAS));
let exportLocMode = "search";
let exportLat = null, exportLon = null, exportLocationLabel = null;

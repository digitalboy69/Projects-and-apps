
function greenwichSiderealTime(jd){
  const T = (jd-J2000)/36525.0;
  return normDeg(280.46061837 + 360.98564736629*(jd-J2000) + 0.000387933*T*T - T*T*T/38710000);
}
function obliquityOfEcliptic(jd){
  const T = (jd-J2000)/36525.0;
  return 23.439291 - 0.0130042*T - 0.00000016*T*T + 0.000000504*T*T*T;
}
function ascendantLongitude(jd, lat, lon){
  const gst = greenwichSiderealTime(jd);
  const lst = normDeg(gst+lon);
  const eps = obliquityOfEcliptic(jd)*DEG;
  const lstRad = lst*DEG, latRad = lat*DEG;
  const y = -Math.cos(lstRad);
  const x = Math.sin(lstRad)*Math.cos(eps) + Math.tan(latRad)*Math.sin(eps);
  let asc = Math.atan2(y,x)*RAD;
  return normDeg(asc+180);
}

const SIGNS = [
  {name:"Aries",sk:"Mesha",lord:"Mars",element:"Fire",modality:"Movable",symbol:"♈"},
  {name:"Taurus",sk:"Vrishabha",lord:"Venus",element:"Earth",modality:"Fixed",symbol:"♉"},
  {name:"Gemini",sk:"Mithuna",lord:"Mercury",element:"Air",modality:"Dual",symbol:"♊"},
  {name:"Cancer",sk:"Karka",lord:"Moon",element:"Water",modality:"Movable",symbol:"♋"},
  {name:"Leo",sk:"Simha",lord:"Sun",element:"Fire",modality:"Fixed",symbol:"♌"},
  {name:"Virgo",sk:"Kanya",lord:"Mercury",element:"Earth",modality:"Dual",symbol:"♍"},
  {name:"Libra",sk:"Tula",lord:"Venus",element:"Air",modality:"Movable",symbol:"♎"},
  {name:"Scorpio",sk:"Vrishchika",lord:"Mars",element:"Water",modality:"Fixed",symbol:"♏"},
  {name:"Sagittarius",sk:"Dhanu",lord:"Jupiter",element:"Fire",modality:"Dual",symbol:"♐"},
  {name:"Capricorn",sk:"Makara",lord:"Saturn",element:"Earth",modality:"Movable",symbol:"♑"},
  {name:"Aquarius",sk:"Kumbha",lord:"Saturn",element:"Air",modality:"Fixed",symbol:"♒"},
  {name:"Pisces",sk:"Meena",lord:"Jupiter",element:"Water",modality:"Dual",symbol:"♓"}
];
const NAKSHATRAS = [
  {name:"Ashwini",lord:"Ketu",deity:"Ashwini Kumaras"},{name:"Bharani",lord:"Venus",deity:"Yama"},
  {name:"Krittika",lord:"Sun",deity:"Agni"},{name:"Rohini",lord:"Moon",deity:"Brahma"},
  {name:"Mrigashira",lord:"Mars",deity:"Soma"},{name:"Ardra",lord:"Rahu",deity:"Rudra"},
  {name:"Punarvasu",lord:"Jupiter",deity:"Aditi"},{name:"Pushya",lord:"Saturn",deity:"Brihaspati"},
  {name:"Ashlesha",lord:"Mercury",deity:"Nagas"},{name:"Magha",lord:"Ketu",deity:"Pitrs"},
  {name:"Purva Phalguni",lord:"Venus",deity:"Bhaga"},{name:"Uttara Phalguni",lord:"Sun",deity:"Aryaman"},
  {name:"Hasta",lord:"Moon",deity:"Savitar"},{name:"Chitra",lord:"Mars",deity:"Tvashtar"},
  {name:"Swati",lord:"Rahu",deity:"Vayu"},{name:"Vishakha",lord:"Jupiter",deity:"Indragni"},
  {name:"Anuradha",lord:"Saturn",deity:"Mitra"},{name:"Jyeshtha",lord:"Mercury",deity:"Indra"},
  {name:"Mula",lord:"Ketu",deity:"Nirriti"},{name:"Purva Ashadha",lord:"Venus",deity:"Apas"},
  {name:"Uttara Ashadha",lord:"Sun",deity:"Vishvadevas"},{name:"Shravana",lord:"Moon",deity:"Vishnu"},
  {name:"Dhanishta",lord:"Mars",deity:"Vasus"},{name:"Shatabhisha",lord:"Rahu",deity:"Varuna"},
  {name:"Purva Bhadrapada",lord:"Jupiter",deity:"Aja Ekapada"},{name:"Uttara Bhadrapada",lord:"Saturn",deity:"Ahir Budhnya"},
  {name:"Revati",lord:"Mercury",deity:"Pushan"}
];
function getSignIndex(lon){ return Math.floor(normDeg(lon)/30); }
function getDegInSign(lon){ return normDeg(lon)%30; }
function getNakshatra(lon){
  const l = normDeg(lon);
  const nakSpan = 360/27;
  const idx = Math.floor(l/nakSpan);
  const posInNak = l % nakSpan;
  const pada = Math.floor(posInNak/(nakSpan/4)) + 1;
  return {index:idx, pada, degInNak:posInNak, ...NAKSHATRAS[idx]};
}

const VARGAS = {
  D1:{n:1,name:"Rashi",full:"Birth Chart",desc:"Physical body, overall life, personality"},
  D2:{n:2,name:"Hora",full:"Wealth Chart",desc:"Wealth, financial prosperity, resources"},
  D3:{n:3,name:"Drekkana",full:"Siblings Chart",desc:"Siblings, courage, communication"},
  D4:{n:4,name:"Chaturthamsa",full:"Fortune & Property",desc:"Fixed assets, property, home, happiness"},
  D5:{n:5,name:"Panchamsa",full:"Power & Authority",desc:"Fame, authority, spiritual merit"},
  D6:{n:6,name:"Shashthamsa",full:"Health Chart",desc:"Disease, debts, enemies, obstacles"},
  D7:{n:7,name:"Saptamsa",full:"Children Chart",desc:"Children, progeny, creativity"},
  D8:{n:8,name:"Ashtamsa",full:"Longevity Chart",desc:"Longevity, sudden events, transformation"},
  D9:{n:9,name:"Navamsa",full:"Marriage & Dharma",desc:"Marriage, spouse, inner dharma, fortune"},
  D10:{n:10,name:"Dasamsa",full:"Career Chart",desc:"Career, profession, status, achievements"},
  D11:{n:11,name:"Rudramsa",full:"Death & Destruction",desc:"Death-like events, endings, destruction"},
  D12:{n:12,name:"Dwadasamsa",full:"Parents Chart",desc:"Parents, ancestry, lineage"},
  D16:{n:16,name:"Shodasamsa",full:"Vehicles & Comfort",desc:"Vehicles, comforts, mental peace"},
  D20:{n:20,name:"Vimsamsa",full:"Spiritual Chart",desc:"Spiritual pursuits, worship, sadhana"},
  D24:{n:24,name:"Chaturvimsamsa",full:"Education Chart",desc:"Education, learning, knowledge"},
  D27:{n:27,name:"Bhamsa",full:"Strengths & Weaknesses",desc:"Inherent strengths and weaknesses"},
  D30:{n:30,name:"Trimsamsa",full:"Misfortunes Chart",desc:"Miseries, evils, misfortunes"},
  D40:{n:40,name:"Khavedamsa",full:"Auspicious Effects",desc:"Maternal legacy, auspicious/inauspicious effects"},
  D45:{n:45,name:"Akshavedamsa",full:"General Indications",desc:"Character, conduct, general life indications"},
  D60:{n:60,name:"Shashtiamsa",full:"Past Karma Chart",desc:"Past-life karma, overall life refinement"},
  D81:{n:81,name:"Nava-navamsa",full:"Nested D9 in D9",desc:"Fine-grained dharma and fortune (D9 computed within D9)"},
  D108:{n:108,name:"Ashtottaramsa",full:"Nested D12 in D9",desc:"Deep karmic lineage (D12 computed within D9)"},
  D144:{n:144,name:"Dwadasa-dwadasamsa",full:"Nested D12 in D12",desc:"Subtle ancestry and heredity (D12 computed within D12)"}
};

// Longitude of a planet inside its divisional sign (for equal-division vargas D9 / D12), stretched to 0-30\u00B0 of that sign.
function nestedVargaLon(key, lon){
  const w = 30 / VARGAS[key].n, frac = Math.min(0.999999, (getDegInSign(lon) % w) / w);
  return calcVarga(key, lon) * 30 + frac * 30;
}
function calcVarga(varga, lon){
  const signIdx = getSignIndex(lon);
  const degInSign = getDegInSign(lon);
  const odd = signIdx % 2 === 0;
  switch(varga){
    case "D1": return signIdx;
    case "D2": { if (odd) return degInSign<15 ? 4 : 3; return degInSign<15 ? 3 : 4; }
    case "D3": { const part = Math.floor(degInSign/10); if (part===0) return signIdx; if (part===1) return (signIdx+4)%12; return (signIdx+8)%12; }
    case "D4": { const part = Math.floor(degInSign/7.5); return (signIdx+part*3)%12; }
    case "D5": {
      // Verified against two independent matching sources: 5 parts of an ODD sign go
      // into Aries, Aquarius, Sagittarius, Gemini, Libra (in that order); 5 parts of an
      // EVEN sign go into Taurus, Virgo, Pisces, Capricorn, Scorpio.
      const D5_ODD = [0,10,8,2,6];
      const D5_EVEN = [1,5,11,9,7];
      const part = Math.min(4, Math.floor(degInSign/6));
      return odd ? D5_ODD[part] : D5_EVEN[part];
    }
    case "D6": { const part = Math.floor(degInSign/5); const base = odd?0:6; return (base+part)%12; }
    case "D7": { const part = Math.floor(degInSign/(30/7)); const base = odd?signIdx:(signIdx+6)%12; return (base+part)%12; }
    case "D8": {
      // Verified: uses movable/fixed/dual modality (NOT odd/even), starting from
      // Aries/Leo/Sagittarius respectively -- confirmed by two independent sources.
      const part = Math.floor(degInSign/3.75);
      const modality = signIdx % 3;
      let start;
      if (modality===0) start=0; else if (modality===1) start=4; else start=8;
      return (start+part)%12;
    }
    case "D9": {
      // CRITICAL FIX: the previous formula used fixed absolute starting points
      // (movable->Aries, fixed->Leo, dual->Sagittarius always) which is WRONG for
      // 11 of 12 signs. The verified BPHS rule is RELATIVE to each specific sign:
      // movable sign -> count from itself; fixed sign -> count from the 9th sign
      // from itself; dual sign -> count from the 5th sign from itself. Verified
      // against a direct BPHS-sourced worked example (Taurus 17 deg -> Gemini)
      // and cross-checked for internal consistency across all 12 signs via the
      // classical element-group (fire/earth/air/water) description, which
      // independently derives the same starting signs.
      const part = Math.floor(degInSign/(30/9));
      const modality = signIdx % 3;
      let start;
      if (modality===0) start = signIdx;
      else if (modality===1) start = (signIdx+8)%12;
      else start = (signIdx+4)%12;
      return (start+part)%12;
    }
    case "D10": { const part = Math.floor(degInSign/3); const base = odd?signIdx:(signIdx+8)%12; return (base+part)%12; }
    case "D11": {
      // Verified: 11 equal divisions (not 12 as before). Starting sign = the sign
      // reached by counting anti-zodiacally from Aries the same number of steps as
      // the sign-being-divided is from Aries zodiacally. Confirmed against two
      // worked examples (Mercury 11 deg Gemini -> Gemini; Jupiter 19 deg Scorpio ->
      // starts from Virgo), both matching exactly.
      const part = Math.floor(degInSign/(30/11));
      const startSign = (12 - signIdx) % 12;
      return (startSign + part) % 12;
    }
    case "D12": { const part = Math.floor(degInSign/2.5); return (signIdx+part)%12; }
    case "D16": {
      // BPHS Ch.6 v.36: "Shodashamsha from Aries for movable signs, from Leo for fixed signs, from Sagittarius for dual signs."
      // (The earlier odd/even -> Aries/Libra rule was wrong.)
      const part = Math.floor(degInSign/1.875);
      const modality = signIdx % 3;
      const start = modality===0 ? 0 : (modality===1 ? 4 : 8);
      return (start+part)%12;
    }
    case "D20": {
      // Verified: uses movable/fixed/dual modality (NOT odd/even). Starting signs:
      // movable->Aries, fixed->Sagittarius, dual->Leo -- confirmed by three
      // independent matching sources. Note this ordering (fixed->Sagittarius,
      // dual->Leo) is swapped relative to D8/D45's Aries/Leo/Sagittarius pattern.
      const part = Math.floor(degInSign/1.5);
      const modality = signIdx % 3;
      let start;
      if (modality===0) start=0; else if (modality===1) start=8; else start=4;
      return (start+part)%12;
    }
    case "D24": { const part = Math.floor(degInSign/1.25); const base = odd?4:3; return (base+part)%12; }
    case "D27": { const part = Math.floor(degInSign/(30/27)); const elementBase = [0,3,6,9][signIdx%4]; return (elementBase+part)%12; }
    case "D30": {
      if (odd){
        if (degInSign<5) return 0; if (degInSign<10) return 10; if (degInSign<18) return 8; if (degInSign<25) return 2; return 6;
      } else {
        if (degInSign<5) return 1; if (degInSign<12) return 5; if (degInSign<20) return 11; if (degInSign<25) return 9; return 7;
      }
    }
    case "D40": { const part = Math.floor(degInSign/0.75); const base = odd?0:6; return (base+part)%12; }
    case "D45": {
      // Verified: uses movable/fixed/dual modality (NOT odd/even, and the previous
      // code only had 2 branches when 3 are needed). Starting signs: movable->Aries,
      // fixed->Leo, dual->Sagittarius -- confirmed by four independent matching
      // sources (same pattern as D8).
      const part = Math.floor(degInSign/(30/45));
      const modality = signIdx % 3;
      let start;
      if (modality===0) start=0; else if (modality===1) start=4; else start=8;
      return (start+part)%12;
    }
    case "D60": { const part = Math.floor(degInSign/0.5); return (signIdx+part)%12; }
    // Nested charts: the inner divisional position is stretched back over a full 30\u00B0 sign, then divided again.
    case "D81":  return calcVarga("D9",  nestedVargaLon("D9",  lon));
    case "D108": return calcVarga("D12", nestedVargaLon("D9",  lon));
    case "D144": return calcVarga("D12", nestedVargaLon("D12", lon));
    default: return signIdx;
  }
}

const PLANET_LIST = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"];
// Outer (trans-Saturnian) planets: plotted on the charts and listed, but kept out of the classical Vedic engines.
const OUTER_LIST = ["Uranus","Neptune","Pluto"];
const OUTER_GLYPHS = {Uranus:"♅",Neptune:"♆",Pluto:"♇"};
const OUTER_COL = {Uranus:"#7DE3E0",Neptune:"#5B7CFA",Pluto:"#C9A38A"};
const OUTER_SK = {Uranus:"Prajapati",Neptune:"Varuna",Pluto:"Yama"};
window.__showOuter = true;

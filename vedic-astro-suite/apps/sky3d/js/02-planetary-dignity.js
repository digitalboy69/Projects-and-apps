const PLANET_GLYPHS = {Sun:"☉",Moon:"☽",Mars:"♂",Mercury:"☿",Jupiter:"♃",Venus:"♀",Saturn:"♄",Rahu:"☊",Ketu:"☋"};
const OUTER_LIST = ["Uranus","Neptune","Pluto"];
const OUTER_SK = {Uranus:"Prajapati",Neptune:"Varuna",Pluto:"Yama"};
const OUTER_ORBIT_R = {Uranus:10.6,Neptune:10.95,Pluto:11.3};
const PLANET_COLORS = {Sun:"#FFD84A",Moon:"#D8DEE8",Mars:"#FF6B4A",Mercury:"#8FB3C9",Jupiter:"#E8B95C",Venus:"#F5E6C8",Saturn:"#8A9BB0",Rahu:"#7B6EC9",Ketu:"#C97B9E"};
Object.assign(PLANET_GLYPHS,{Uranus:"♅",Neptune:"♆",Pluto:"♇"});
Object.assign(PLANET_COLORS,{Uranus:"#7DE3E0",Neptune:"#5B7CFA",Pluto:"#C9A38A"});
const ALL_BODIES = PLANET_LIST.concat(OUTER_LIST); // outer planets are shown/plotted but are not part of Vedic aspect/yoga logic

function siderealLongitude(name,jd){
  const ayan=lahiriAyanamsa(jd);
  let tropical;
  switch(name){
    case "Sun": tropical=sunLongitude(jd); break;
    case "Moon": tropical=moonLongitude(jd); break;
    case "Mercury": tropical=planetGeocentricLongitude("mercury",jd); break;
    case "Venus": tropical=planetGeocentricLongitude("venus",jd); break;
    case "Mars": tropical=planetGeocentricLongitude("mars",jd); break;
    case "Jupiter": tropical=planetGeocentricLongitude("jupiter",jd); break;
    case "Saturn": tropical=planetGeocentricLongitude("saturn",jd); break;
    case "Uranus": case "Neptune": case "Pluto": tropical=planetGeocentricLongitude(name.toLowerCase(),jd); break;
    case "Rahu": return normDeg(rahuLongitude(jd)-ayan);
    case "Ketu": return normDeg(rahuLongitude(jd)-ayan+180);
  }
  return normDeg(tropical-ayan);
}

const SIGNS = [
  {name:"Aries",sk:"Mesha",lord:"Mars",symbol:"♈"},{name:"Taurus",sk:"Vrishabha",lord:"Venus",symbol:"♉"},
  {name:"Gemini",sk:"Mithuna",lord:"Mercury",symbol:"♊"},{name:"Cancer",sk:"Karka",lord:"Moon",symbol:"♋"},
  {name:"Leo",sk:"Simha",lord:"Sun",symbol:"♌"},{name:"Virgo",sk:"Kanya",lord:"Mercury",symbol:"♍"},
  {name:"Libra",sk:"Tula",lord:"Venus",symbol:"♎"},{name:"Scorpio",sk:"Vrishchika",lord:"Mars",symbol:"♏"},
  {name:"Sagittarius",sk:"Dhanu",lord:"Jupiter",symbol:"♐"},{name:"Capricorn",sk:"Makara",lord:"Saturn",symbol:"♑"},
  {name:"Aquarius",sk:"Kumbha",lord:"Saturn",symbol:"♒"},{name:"Pisces",sk:"Meena",lord:"Jupiter",symbol:"♓"}
];
const NAKSHATRAS = ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha",
  "Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula",
  "Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];

function getSignIndex(lon){ return Math.floor(normDeg(lon)/30); }
function getNakshatraIndex(lon){ return Math.floor(normDeg(lon)/(360/27)); }
function getDegInSign(lon){ return normDeg(lon)%30; }
function formatDeg(d){
  const deg=Math.floor(d), min=Math.floor((d-deg)*60);
  return `${deg}°${String(min).padStart(2,'0')}'`;
}

const AVG_DAILY_MOTION = {Sun:0.9856,Moon:13.176,Mars:0.524,Mercury:1.383,Jupiter:0.0831,Venus:1.2,Saturn:0.0334,Rahu:-0.0529,Ketu:-0.0529};


// node tests/ephemeris_vs_swiss_test.js
// REAL-CHART CHECK: the app's astronomy against the Swiss Ephemeris (Moshier mode, run once with pyswisseph; values stored below).
// 14 charts: famous births (1863-1973) and modern ones. Columns: [name, date, time, lat, lon, tz, JD(UT), Moon mean-equinox longitude, sidereal Ascendant (Lahiri), Swiss Lahiri ayanamsa].
// Guards: delta-T handling (without it the Moon was 20-55 arcsec behind), the Ascendant, the Lahiri anchor (official ICRC value 23 15 00.658 on 21 Mar 1956),
// and that the Vimshottari dasha (6 levels, Mahadasha to Deha) equals an independent calculation from the same Moon.
const vm=require('vm'),fs=require('fs'),path=require('path');const base=path.join(__dirname,'..','apps','birth-chart','js')+'/';const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx;vm.createContext(ctx);const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','15-chart-core-compute.js','16-rectification-engine.js']);
const run=s=>vm.runInContext(s,ctx);let fail=0;const ok=(c,m)=>{if(!c){fail++;console.log('FAIL',m);}else console.log('ok  ',m);};
const REF=[["Albert Einstein", "1879-03-14", "11:30", 48.4, 9.99, 0.6656, 2407422.951433, 254.522399, 79.477144, 22.170106], ["Mahatma Gandhi", "1869-10-02", "07:33", 21.64, 69.6, 4.64, 2403972.62125, 140.187881, 189.407602, 22.038222], ["Swami Vivekananda", "1863-01-12", "06:33", 22.57, 88.36, 5.8907, 2401517.527471, 189.391325, 266.028208, 21.944382], ["Marilyn Monroe", "1926-06-01", "09:30", 34.05, -118.24, -8, 2424668.229167, 319.103064, 110.251836, 22.829364], ["Steve Jobs", "1955-02-24", "19:15", 37.77, -122.42, -8, 2435163.635417, 7.742132, 149.054726, 23.230654], ["Princess Diana", "1961-07-01", "19:45", 52.83, 0.5, 1, 2437482.28125, 325.040043, 235.095198, 23.319313], ["Barack Obama", "1961-08-04", "19:24", 21.31, -157.86, -10, 2437516.725, 63.359894, 294.730352, 23.32063], ["Amitabh Bachchan", "1942-10-11", "16:00", 25.43, 81.84, 5.5, 2430643.9375, 213.96527, 321.554914, 23.057838], ["Sachin Tendulkar", "1973-04-24", "16:20", 18.96, 72.82, 5.5, 2441796.951389, 289.73527, 154.27855, 23.484303], ["Narendra Modi", "1950-09-17", "11:00", 23.78, 72.64, 5.5, 2433541.729167, 241.976569, 211.253932, 23.168637], ["Sample 1905", "1905-05-05", "04:30", 28.61, 77.21, 5.5, 2416970.458333, 47.110522, 357.737203, 22.535074], ["Sample 1988", "1988-11-22", "22:10", 13.08, 80.27, 5.5, 2447488.194444, 47.807662, 100.741417, 23.701945], ["Sample 2003", "2003-02-14", "13:45", 19.07, 72.87, 5.5, 2452684.84375, 111.110379, 56.011932, 23.900686], ["Sample 2024", "2024-08-09", "06:15", 12.97, 77.59, 5.5, 2460531.53125, 187.480378, 113.853843, 24.200798]];
const dA=(a,b)=>((a-b+540)%360-180)*3600;                       // arcsec difference, wrapped
let sumMoon=0,maxMoon=0,maxAsc=0,maxAyan=0;
for(const [name,d,t,lat,lon,tz,jd,moonT,asc,ay] of REF){
  const c=run(`computeChart('${d}','${t}',${lat},${lon},${tz})`);
  const moonTrop=(c.planets.Moon.longitude+c.ayanamsa+360)%360;          // app Moon, tropical (mean equinox)
  const eM=Math.abs(dA(moonTrop,moonT)), eA=Math.abs(dA(c.ascendant.longitude,asc)), eY=Math.abs((c.ayanamsa-ay)*3600);
  sumMoon+=eM; maxMoon=Math.max(maxMoon,eM); maxAsc=Math.max(maxAsc,eA); maxAyan=Math.max(maxAyan,eY);
  if(Math.abs(c.julianDay-jd)>2e-5){ fail++; console.log('FAIL JD differs for',name,c.julianDay,jd); }
}
ok(maxMoon<25,'Moon (tropical) within 25 arcsec of the Swiss Ephemeris on all 14 real charts (max '+maxMoon.toFixed(1)+'", mean '+(sumMoon/REF.length).toFixed(1)+'")');
ok(sumMoon/REF.length<15,'Moon mean error under 15 arcsec');
ok(maxAsc<35,'sidereal Ascendant within 35 arcsec (max '+maxAsc.toFixed(1)+'"; mostly the 16" Lahiri-definition difference)');
ok(maxAyan<20,'Lahiri ayanamsa within 20 arcsec of the Swiss Lahiri over 1863-2024 (max '+maxAyan.toFixed(1)+'")');
const off=23+15/60+0.658/3600, jd1956=Date.UTC(1956,2,21)/86400000+2440587.5;
ok(Math.abs(run(`lahiriAyanamsa(${jd1956})`)-off)*3600<2,'ayanamsa equals the official Indian Calendar Reform Committee value on 21 Mar 1956 (23 15 00.658) within 2 arcsec');
const dt=run('deltaTSeconds(2451545.0)'); ok(dt>63&&dt<65,'delta-T at J2000 is about 64 s ('+dt.toFixed(1)+' s)');
const SEQ=['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'],DY={Ketu:7,Venus:20,Sun:6,Moon:10,Mars:7,Rahu:18,Jupiter:16,Saturn:19,Mercury:17};
function ref(moon,birthMs,evMs){ const span=360/27,ni=Math.floor(moon/span),el=(moon-ni*span)/span; let cur=birthMs-el*DY[SEQ[ni%9]]*365.25*86400000,i=ni%9;const lv=[];
  for(;;){const L=SEQ[i%9],ln=DY[L]*365.25*86400000; if(evMs<cur+ln){lv.push([L,cur,cur+ln]);break;} cur+=ln;i++;}
  for(let n=0;n<5;n++){const p=lv[lv.length-1],j=SEQ.indexOf(p[0]);let c=p[1];const ln=p[2]-p[1];for(let k=0;k<9;k++){const L=SEQ[(j+k)%9],l=ln*DY[L]/120;if(evMs<c+l||k===8){lv.push([L,c,c+l]);break;}c+=l;}} return lv; }
let bad=0,n=0,worst=0;
for(const [name,d,t,lat,lon,tz] of REF){ const c=run(`computeChart('${d}','${t}',${lat},${lon},${tz})`); ctx._c=c; const bms=(c.julianDay-2440587.5)*86400000;
  for(const age of [3.5,12.25,24.75,36.6,48.9,61.2]){ const ev=bms+age*365.25*86400000; ctx._t=ev;
    const a=run("(()=>{const x=findActiveDasha(_c.dashaData.mahadashas,new Date(_t));return [x.mahadasha,x.antardasha,x.pratyantardasha,x.sookshmaDasha,x.pranaDasha,x.dehaDasha].map(p=>[p.lord,p.startDate.getTime(),p.endDate.getTime(),!!p.fullStart])})()");
    const r=ref(c.planets.Moon.longitude,bms,ev);
    for(let k=0;k<6;k++){ n++; const startOK=a[k][3]||Math.abs(a[k][1]-r[k][1])<=50;       // periods cut at birth start at birth by design
      if(a[k][0]!==r[k][0]||Math.abs(a[k][2]-r[k][2])>50||!startOK) bad++; else worst=Math.max(worst,Math.abs(a[k][2]-r[k][2])); } } }
ok(bad===0,'Vimshottari: '+n+' period boundaries over 6 levels (Mahadasha to Deha), 14 real charts x 6 ages, equal an independent calculation ('+bad+' differ, worst end gap '+worst.toFixed(1)+' ms)');
console.log(fail?'FAILED '+fail:'ALL PASSED');process.exit(fail?1:0);

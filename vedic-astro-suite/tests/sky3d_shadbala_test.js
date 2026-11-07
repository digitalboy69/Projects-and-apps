// 3D live Shadbala: its engine copy must give the same answer as the Birth Chart engine, and the live adapter must behave. Run: node tests/sky3d_shadbala_test.js
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..','apps');
const mk=()=>{const c={console,localStorage:{getItem(){return null},setItem(){}},sessionStorage:{getItem(){return null},setItem(){},removeItem(){}},document:{getElementById(){return null},querySelector(){return null},querySelectorAll(){return[]},addEventListener(){}},setTimeout,clearInterval,setInterval,Math,Date,JSON};c.window=c;return vm.createContext(c)};
const run=(c,dir,files)=>files.forEach(f=>{try{vm.runInContext(fs.readFileSync(path.join(root,dir,'js',f),'utf8'),c,{filename:f})}catch(e){console.log('load',f,e.message)}});
const B=mk(),S=mk();
run(B,'birth-chart',['03-ephemeris-engine.js','05-ascendant-nakshatra-vargas.js','07-planetary-dignity.js','08-combustion-and-war.js','14-shadbala-engine.js']);
run(S,'sky3d',['01-astro-engine.js','02-planetary-dignity.js','03-ascendant-houses-drishti.js','06-planet-detail-helpers.js','07-position-snapshot.js','55-live-shadbala-engine.js']);
let fail=0;const ck=(n,c)=>{console.log(c?'ok  ':'FAIL',n);if(!c)fail++;};
const near=(a,b)=>Math.abs(a-b)<1e-6;
let cases=0,bad=0;
const jds=[2451545.0+0.31,2454416.6,2460000.25,2461000.9,2459000.1];
for(const jd of jds)for(const asc of [0,4,9]){
  const sid={};['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'].forEach((n,i)=>sid[n]=((jd*7.3+i*47.1)%360));
  B.sid=sid;B.jd=jd;B.asc=asc;S.sid=sid;S.jd=jd;S.asc=asc;
  const mkp="(()=>{const p={};Object.keys(sid).forEach((n,i)=>{const s=Math.floor(sid[n]/30);p[n]={sign:s,degInSign:sid[n]%30,house:((s-asc+12)%12)+1,speed:[1,13,0.5,1.4,0.08,1.2,-0.03][i]}});return p})()";
  B.pl=vm.runInContext(mkp,B);S.pl=vm.runInContext(mkp,S);
  const a=vm.runInContext("computeShadbala(sid,pl,asc,jd,jd+0.2,14.5,true,jd-0.3,jd+0.2,jd+0.7,3)",B);
  const b=vm.runInContext("SHB_ENGINE.computeShadbala(sid,pl,asc,jd,jd+0.2,14.5,true,jd-0.3,jd+0.2,jd+0.7,3)",S);
  for(const n of Object.keys(a.planets)){cases++;if(!near(a.planets[n].totalVirupas,b.planets[n].totalVirupas)||!near(a.planets[n].sthanaBala.saptavargaja,b.planets[n].sthanaBala.saptavargaja)||!near(a.planets[n].kalaBala.total,b.planets[n].kalaBala.total))bad++;}
}
ck('engine copy equals the Birth Chart engine ('+cases+' planet cases)',cases>=100&&bad===0);
// live adapter on the 3D engines
run(S,'sky3d',['52-gulika.js']);
vm.runInContext("function getLiveLoc(){return {lat:28.6139,lon:77.2090,label:'Test'}} function formatFullDate(j){return 'date'}",S);
try{vm.runInContext(fs.readFileSync(path.join(root,'sky3d','js','56-live-shadbala.js'),'utf8'),S,{filename:'56'})}catch(e){console.log('56',e.message)}
S.jd=vm.runInContext("toJulianDay(2026,11,8,12,0,0)-5.5/24",S);
const v=vm.runInContext("SHB.live(jd)",S);
ck('live result exists for Delhi at noon',!!v);
if(v){
  const P=v.planets;
  ck('all seven planets present',['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'].every(n=>P[n]&&isFinite(P[n].totalRupas)));
  ck('rupas are in a sane range 1..12',Object.values(P).every(p=>p.totalRupas>1&&p.totalRupas<12));
  ck('naisargika is fixed by planet (Sun 1.0 rupa)',near(P.Sun.naisargikaBala/60,1));
  ck('rank has 7 planets sorted high to low',v.rank.length===7&&v.rank.every((n,i)=>i===0||P[v.rank[i-1]].percentOfRequired>=P[n].percentOfRequired));
  ck('noon is daytime',v.isDay===true);
  const html=vm.runInContext("SHB.html('Mars',jd)",S);
  ck('block has hero, six rows and the ranking',/shb-hero/.test(html)&&(html.match(/class="shb-row/g)||[]).length===6&&(html.match(/class="shb-pr /g)||[]).length===7);
  ck('node window gets an explanation, not a crash',/seven planets/.test(vm.runInContext("SHB.html('Rahu',jd)",S)));
}
// polar night: no sunrise, must not throw
vm.runInContext("function getLiveLoc(){return {lat:78,lon:15,label:'Svalbard'}}",S);
ck('polar night is handled',(()=>{try{S.jd=vm.runInContext("toJulianDay(2026,12,21,12,0,0)",S);return vm.runInContext("SHB.html('Sun',jd)",S).includes('shb')}catch(e){console.log(e.message);return false}})());
process.exit(fail?1:0);

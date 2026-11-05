const fs=require('fs'),vm=require('vm'),path=require('path');
const el=()=>({addEventListener(){},querySelectorAll(){return[]},classList:{toggle(){}}});
const ctx={console,localStorage:{getItem(){return null},setItem(){}},sessionStorage:{getItem(){return null},setItem(){},removeItem(){}},document:{getElementById(){return null},querySelector(){return null},addEventListener(){},querySelectorAll(){return[]}},window:{},navigator:{userAgent:''},performance:{now:()=>0}};
ctx.window=ctx;vm.createContext(ctx);const d=path.join(__dirname,'..','apps','sky3d','js');
for(const f of ['01-astro-engine.js','02-planetary-dignity.js','03-ascendant-houses-drishti.js','06-planet-detail-helpers.js','07-position-snapshot.js'])try{vm.runInContext(fs.readFileSync(path.join(d,f),'utf8'),ctx,{filename:f});}catch(e){console.log('load',f,e.message.slice(0,80));}
vm.runInContext("function isValidProfile(){return false} function getLiveLoc(){return {lat:16.7747,lon:78.1315,label:'t'}} let activeNatalProfile=null, currentJD=2460000.5, A={snap:null}; function degreeInSign(l){const x=((l%360)+360)%360%30;return{deg:Math.floor(x),min:Math.floor((x%1)*60)}}",ctx);
vm.runInContext(fs.readFileSync(path.join(d,'54-degree-houses.js'),'utf8'),ctx,{filename:'54'});
let fail=0;const ck=(n,c)=>{console.log(c?'ok  ':'FAIL',n);if(!c)fail++;};
const jd=vm.runInContext("toJulianDay(2007,11,11,2,23,0)-5.5/24",ctx);
ctx.jd=jd;
for(const s of ['sripati','eqmid','eqstart']){
  ctx.s=s;const c=vm.runInContext("DEG_H.cusps(jd,16.7747,78.1315,s)",ctx);
  let tot=0;for(let i=0;i<12;i++){const a=c.begin[i],b=c.begin[(i+1)%12];tot+=((b-a)%360+360)%360;}
  ck(s+': 12 houses cover 360 deg',Math.abs(tot-360)<1e-6);
}
ctx.s='eqstart';const c=vm.runInContext("DEG_H.cusps(jd,16.7747,78.1315,'eqstart')",ctx);ctx.c=c;
ctx.sid={Sun:c.asc-5,Moon:c.asc+5,Mars:c.asc+40,Mercury:0,Jupiter:0,Venus:0,Saturn:0,Rahu:0,Ketu:0};
const pl=vm.runInContext("DEG_H.place(sid,c)",ctx);
const asc=c.asc;
ck('equal-start: 5 deg before Lagna is house 12',pl.Sun.byDeg===12);
ck('equal-start: 5 deg after Lagna is house 1',pl.Moon.byDeg===1);
const sg=l=>Math.floor((((l%360)+360)%360)/30);ck('shifted flag = sign house differs from degree house',pl.Sun.shifted===(pl.Sun.bySign!==pl.Sun.byDeg)&&pl.Moon.shifted===(sg(asc+5)!==sg(asc)));
ck('Sripati madhya of house 1 is the Lagna',Math.abs(vm.runInContext("DEG_H.cusps(jd,16.7747,78.1315,'sripati')",ctx).madhya[0]-asc)<1e-6);
process.exit(fail?1:0);

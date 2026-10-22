// node tests/life_event_pro_test.js  - engine checks without a browser (vm sandbox)
const vm=require('vm'),fs=require('fs'),path=require('path');
const base=path.join(__dirname,'..','apps','birth-chart','js')+'/'; const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx; vm.createContext(ctx);
const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','15-chart-core-compute.js','16-rectification-engine.js']);
vm.runInContext("var rsState={events:[]},rsEsc=s=>s,RS_CATS={}",ctx); load(['97-life-event-catalog.js','98-life-event-engine.js']);
const run=s=>vm.runInContext(s,ctx); let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log('FAIL',m);} else console.log('ok  ',m); };
ok(run('LEC.count')>=200,'catalog has 200+ events ('+run('LEC.count')+')');
const orig={marriage:'7',child:'5',career:'10',edu:'4,9',foreign:'12',property:'4',gain:'2,11',father:'9',mother:'4',health:'6,8'};
ok(Object.keys(orig).every(k=>run(`LEC.byId['${k}'].p.join()`)===orig[k]),'10 original ids keep their houses');
ok(run('LEC.list.every(e=>e.p.length&&e.k.length&&e.house>=1&&e.house<=12)'),'every event has house + planet');
const chart=run("computeChart('1990-03-12','06:40',28.61,77.21,5.5)"); const birth=Date.UTC(1990,2,12,6,40)-5.5*3600000; let bad=0;
for(let i=0;i<200;i++){ ctx._d=new Date(birth+((i*7919)%36000)*86400000/1.0); ctx._c=chart;
  const a=run("(()=>{const x=findActiveDasha(_c.dashaData.mahadashas,_d);return [x.mahadasha.lord,x.antardasha.lord,x.pratyantardasha.lord].join()})()");
  const b=run(`leVim(_c.planets.Moon.longitude,${birth},_d.getTime()).join()`); if(a!==b) bad++; }
ok(bad===0,'leVim equals the app dasha engine (200 dates)');
ctx._chart=chart; ctx._prof={lat:28.61,lon:77.21,tz:5.5,dob:'1990-03-12'};
const good=[['marriage','2004-04-15'],['child','2004-04-15'],['career','2003-01-15'],['property','2000-10-15'],['foreign','2021-10-15'],['father','1993-10-15'],['edu','2000-10-15'],['gain','1996-04-15']].map(([c,d])=>({c,d,n:'',pr:'d'}));
(async()=>{
  const go=ev=>{ ctx._ev=ev; return run("LEE.analyse({chart:_chart,prof:_prof,events:_ev,date:'1990-03-12',time:'05:10',halfHours:3,K:150,B:200})"); };
  const r=await go(good); const trueAsc=run("rectifyPoint('1990-03-12','06:40:00',28.61,77.21,5.5).asc.sign");
  ok(r.top.L===trueAsc,'recovers the rising sign of a known birth time');
  ok(Math.abs(r.top.off/60-90)<15,'recovers the time within 15 min (offset '+(r.top.off/60).toFixed(0)+' min, expected 90)');
  ok(r.conf.floor>.7,'well-fitting events give a high floor ('+r.conf.floor.toFixed(2)+')');
  const bad2=good.slice(); bad2[2]={...bad2[2],d:'1999-07-02'};
  const r2=await go(bad2); ok(r2.outliers.some(o=>o.ev.c.id==='career'),'a wrong date is flagged as an outlier');
  let a=3; const rnd=()=>{a=(a*1103515245+12345)&0x7fffffff;return a/0x7fffffff}; let high=0;
  for(let i=0;i<12;i++){ const ev=good.map(e=>({...e,d:`${1992+Math.floor(rnd()*32)}-0${1+Math.floor(rnd()*9)}-1${Math.floor(rnd()*9)}`})); const x=await go(ev); if(x.conf.floor>=.4) high++; }
  ok(high<=1,'random dates almost never reach a 40% floor ('+high+'/12)');
  const one=await go([good[0]]); ok(one.conf.floor<.4,'a single event cannot give a high floor');
  console.log(fail?'FAILED '+fail:'ALL PASSED'); process.exit(fail?1:0);
})();

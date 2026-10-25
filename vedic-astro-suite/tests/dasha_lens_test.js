// node tests/dasha_lens_test.js - Dasha Lens engine vs the app's own dasha engine (js/10), plus basic laws of the nesting
const vm=require('vm'),fs=require('fs'),path=require('path');const base=path.join(__dirname,'..','apps','birth-chart','js')+'/';const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx;vm.createContext(ctx);const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','15-chart-core-compute.js','16-rectification-engine.js','99-dasha-lens.js']);
const run=s=>vm.runInContext(s,ctx);let fail=0;const ok=(c,m)=>{if(!c){fail++;console.log('FAIL',m);}else console.log('ok  ',m);};
for (const [d,t,lat,lon,tz] of [['1990-03-12','06:40',28.61,77.21,5.5],['1975-11-02','23:15',19.07,72.87,5.5],['2001-07-19','03:05',51.5,-0.12,1]]){
  const ch=run(`computeChart('${d}','${t}',${lat},${lon},${tz})`), birth=Date.UTC(+d.slice(0,4),+d.slice(5,7)-1,+d.slice(8,10),+t.slice(0,2),+t.slice(3,5))-tz*3600000;
  ctx._c=ch; let bad=0, badDeep=0, n=0;
  for(let i=0;i<400;i++){ const ev=birth+Math.random()*95*365.25*86400000; ctx._e=ev;
    const a=run("(()=>{const x=findActiveDasha(_c.dashaData.mahadashas,new Date(_e));return [x.mahadasha.lord,x.antardasha.lord,x.pratyantardasha.lord,x.sookshmaDasha.lord,x.pranaDasha.lord].join()})()");
    const b=run(`DLENS.stack(_c.planets.Moon.longitude,${birth},_e,6).levels.map(l=>l.lord).slice(0,5).join()`); n++; if(a!==b) bad++;
    const st=run(`DLENS.stack(_c.planets.Moon.longitude,${birth},_e,6)`).levels;
    for(let k=1;k<6;k++){ if(!(st[k].start>=st[k-1].start-1e-3 && st[k].end<=st[k-1].end+1e-3)) badDeep++; }
    if(!(st[5].start<=ev && ev<st[5].end+1e-3)) badDeep++; }
  ok(bad===0,`${d}: levels 1-5 equal the app engine in ${n} random moments (${bad} differ)`); ok(badDeep===0,`${d}: every level sits inside its parent and the moment sits inside Deha`);
}
const ch=run("computeChart('1990-03-12','06:40',28.61,77.21,5.5)"); ctx._c=ch;
const st=run("DLENS.stack(_c.planets.Moon.longitude,Date.UTC(1990,2,12,6,40)-5.5*3600000,Date.UTC(2020,5,1,12,0,0),6)").levels;
const ch9=run("DLENS.children(DLENS.stack(_c.planets.Moon.longitude,Date.UTC(1990,2,12,6,40)-5.5*3600000,Date.UTC(2020,5,1,12,0,0),6).levels[0])");
ok(ch9.length===9 && Math.abs(ch9[8].end-st[0].end)<1,'the 9 sub-periods exactly fill the parent');
ok(st[4].end-st[4].start>3600e3*2 && st[4].end-st[4].start<86400e3*1.2,'Prana lasts hours ('+run(`DLENS.dur(${st[4].end-st[4].start})`)+')');
ok(run("DLENS.dur(3725000)")==='1h 2m 5s' && run("DLENS.dur(45000)")==='45s','duration text');
console.log(fail?'FAILED '+fail:'ALL PASSED');process.exit(fail?1:0);

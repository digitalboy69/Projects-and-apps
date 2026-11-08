// node tests/argala_test.js - Argala (js/139): house pairs, count rule, Ketu reversal, 3-malefic extra, hand-worked charts, render
const vm=require('vm'),fs=require('fs'),path=require('path');
const base=path.join(__dirname,'..','apps','birth-chart','js')+'/'; const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx; vm.createContext(ctx);
const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','117-gulika.js','15-chart-core-compute.js','134-avasthas.js','139-argala.js']);
const run=s=>vm.runInContext(s,ctx); let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log('FAIL',m);} else console.log('ok  ',m); };

const mk=(m)=>({ascendant:{sign:0},planets:Object.fromEntries(['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map(n=>[n,{house:m[n]||7}]))});
const H=(m,h)=>{ctx._s=mk(m);return JSON.parse(run(`JSON.stringify(ARG.compute(_s)[${h-1}])`));};
const pr=(h,id)=>h.pairs.find(p=>p.id===id);
let h1=H({Jupiter:2,Mars:12,Venus:4,Mercury:11},1);
ok(pr(h1,'dhana').argala.join()==='Jupiter'&&pr(h1,'dhana').vir.join()==='Mars'&&pr(h1,'dhana').state==='contested','house 1: Jupiter in 2nd vs Mars in 12th = equal count = contested');
ok(pr(h1,'sukha').argala.join()==='Venus'&&pr(h1,'sukha').state==='stands'&&pr(h1,'labha').argala.join()==='Mercury'&&pr(h1,'labha').state==='stands','4th and 11th argala stand when nothing obstructs');
h1=H({Jupiter:2,Venus:2,Mars:12},1);
ok(pr(h1,'dhana').argala.length===2&&pr(h1,'dhana').state==='stands','two argala planets beat one obstructor: stands');
h1=H({Jupiter:2,Mars:12,Saturn:12},1);
ok(pr(h1,'dhana').state==='obstructed','two obstructors beat one argala planet: obstructed');
ok(pr(H({},1),'dhana').state==='none','empty 2nd house: no argala');
const h5=H({},5); ok(pr(h5,'dhana').argalaHouse===6&&pr(h5,'dhana').virHouse===4&&pr(h5,'sukha').argalaHouse===8&&pr(h5,'sukha').virHouse===2&&pr(h5,'labha').argalaHouse===3&&pr(h5,'labha').virHouse===7&&pr(h5,'putra').argalaHouse===9&&pr(h5,'putra').virHouse===1,'from house 5: 2nd=6, 12th=4, 4th=8, 10th=2, 11th=3, 3rd=7, 5th=9, 9th=1 (wraps round)');
h1=H({Jupiter:5},1); ok(pr(h1,'putra').state==='stands'&&h1.standing===0&&h1.anyStanding===1,'5th-house argala stands but is outside the main "of 3" count');
h1=H({Ketu:1,Jupiter:12,Mars:2},1);
ok(h1.reversed&&pr(h1,'dhana').argalaHouse===12&&pr(h1,'dhana').virHouse===2&&pr(h1,'dhana').argala.join()==='Jupiter'&&pr(h1,'dhana').vir.join()==='Mars','house with Ketu: roles reversed (12th causes, 2nd obstructs)');
ok(!H({Jupiter:12,Mars:2},1).reversed,'no Ketu in the house: not reversed');
h1=H({Mars:3,Saturn:3,Sun:3},1); ok(!!pr(h1,'tritiya')&&pr(h1,'tritiya').argala.length===3&&pr(h1,'tritiya').state==='stands','three malefics in the 3rd give the extra unobstructable row');
h1=H({Mars:3,Saturn:3,Jupiter:3},1); ok(!pr(h1,'tritiya'),'two malefics and a benefic in the 3rd: no extra row');
let bad=0,n=0;
for(let i=0;i<60;i++){
  const d=new Date(Date.UTC(1950+(i*7)%70,(i*5)%12,1+(i*11)%28)).toISOString().slice(0,10);
  ctx._c=run(`computeChart('${d}','${String(i%24).padStart(2,'0')}:${String((i*13)%60).padStart(2,'0')}',${10+(i%40)},${70+(i%30)},5.5)`); n++;
  const R=run('ARG.compute(_c)'); if(R.length!==12)bad++;
  const inH=x=>['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].filter(q=>ctx._c.planets[q].house===x);
  R.forEach(h=>{ if(h.sign!==(ctx._c.ascendant.sign+h.house-1)%12)bad++;
    h.pairs.filter(p=>!p.extra).forEach(p=>{
      if(inH(p.argalaHouse).join()!==p.argala.join())bad++; if(inH(p.virHouse).join()!==p.vir.join())bad++;
      if(p.state==='none'&&p.argala.length)bad++; if(p.state==='stands'&&p.vir.length>p.argala.length)bad++; if(p.state==='obstructed'&&p.vir.length<=p.argala.length)bad++; });
    if(h.standing!==h.pairs.filter(p=>!p.special&&p.state==='stands').length)bad++; });
  const S=run('ARG.html(_c,{})'); if(/undefined|NaN|\[object/.test(S)||(S.match(/class="arg-row"/g)||[]).length!==12)bad++; if(/fatal|doom|death|cursed|will die/i.test(S))bad++; }
ok(bad===0,`60 real charts: 12 houses, planets match chart houses, state follows the count rule, no NaN (${n})`);
ok(run('ARG.text(computeChart("1990-03-12","06:40",28.61,77.21,5.5))').split('\n').length===12,'text() gives 12 lines');
process.exit(fail?1:0);

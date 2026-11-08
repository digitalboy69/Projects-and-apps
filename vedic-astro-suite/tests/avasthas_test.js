// node tests/avasthas_test.js - Planet States (js/134): Baladi edges, Jagradadi vs app dignity, compound friendship, render
const vm=require('vm'),fs=require('fs'),path=require('path');
const base=path.join(__dirname,'..','apps','birth-chart','js')+'/'; const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx; vm.createContext(ctx);
const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','117-gulika.js','15-chart-core-compute.js','134-avasthas.js']);
const run=s=>vm.runInContext(s,ctx); let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log('FAIL',m);} else console.log('ok  ',m); };

/* Baladi edges: odd sign Aries(0) Bala->Mrita, even sign Taurus(1) Mrita->Bala */
const bal=(s,d)=>run(`AVS.baladi(${s},${d}).state`);
ok(['Bala','Kumara','Yuva','Vriddha','Mrita'].every((x,i)=>bal(0,i*6)===x),'odd sign: 0,6,12,18,24 degrees = Bala,Kumara,Yuva,Vriddha,Mrita');
ok(bal(0,5.99)==='Bala'&&bal(0,11.99)==='Kumara'&&bal(0,17.99)==='Yuva'&&bal(0,23.99)==='Vriddha'&&bal(0,29.99)==='Mrita','odd sign upper edges stay in their slice');
ok(['Mrita','Vriddha','Yuva','Kumara','Bala'].every((x,i)=>bal(1,i*6)===x),'even sign: 0,6,12,18,24 degrees = Mrita,Vriddha,Yuva,Kumara,Bala');
ok(bal(1,29.99)==='Bala'&&bal(11,0)==='Mrita'&&bal(10,0)==='Bala','even/odd parity by sign index (Pisces even, Aquarius odd)');
/* compound friendship: hand-worked */
const cmp=(a,b,sa,sb)=>run(`AVS.compound('${a}','${b}',${sa},${sb})`);
ok(cmp('Sun','Moon',0,3)==='AdhiMitra','Sun in Aries, Moon in Cancer (4th from Sun): natural friend + temporary friend = great friend');
ok(cmp('Sun','Moon',0,0)==='Sama','Sun and Moon together (1st): natural friend + temporary enemy = neutral');
ok(cmp('Sun','Venus',0,0)==='AdhiShatru'&&cmp('Sun','Venus',0,1)==='Sama','Sun/Venus: enemy+enemy = great enemy; enemy+friend = neutral');
ok(cmp('Sun','Mercury',0,1)==='Mitra'&&cmp('Sun','Mercury',0,0)==='Shatru','Sun/Mercury (natural neutral): + friend = friend, + enemy = enemy');
/* Jagradadi equals the app's dignity for every planet and sign; Deeptadi consistent with dignity */
let bad=0,n=0;
for(let i=0;i<120;i++){
  const d=new Date(Date.UTC(1950+(i*7)%70,(i*5)%12,1+(i*11)%28)); const ds=d.toISOString().slice(0,10),tm=String(i%24).padStart(2,'0')+':'+String((i*13)%60).padStart(2,'0');
  ctx._c=run(`computeChart('${ds}','${tm}',${10+(i%40)},${70+(i%30)},5.5)`);
  const D=run('AVS.compute(_c)');
  for(const g of run('AVS.GRAHA')){
    n++; const p=ctx._c.planets[g],a=D.planets[g],st=p.dignity.status;
    const wantJ=(st==='Exalted'||st==='Moolatrikona'||st==='OwnSign')?'Jagrat':(st==='Enemy'||st==='Debilitated')?'Sushupti':'Swapna';
    if(a.jagradadi.state!==wantJ)bad++;
    if(!['Deepta','Swastha','Pramudita','Shanta','Deena','Khala'].includes(a.deeptadi.state))bad++;
    if(st==='Exalted'&&a.deeptadi.state!=='Deepta')bad++;
    if((st==='Moolatrikona'||st==='OwnSign')&&a.deeptadi.state!=='Swastha')bad++;
    if(!['Bala','Kumara','Yuva','Vriddha','Mrita'].includes(a.baladi.state))bad++;
    if(a.deeptadi.also.some(x=>x.state==='Kopa')!==!!(p.combustion&&p.combustion.combust))bad++;
    if(a.sign!==run(`SIGNS[${p.sign}].name`))bad++;
  }
  const h=run('AVS.html(_c,{})'); if(/undefined|NaN|\[object/.test(h))bad++;
  if(!/Planet States/.test(h)||(h.match(/avs-card/g)||[]).length<7)bad++;
}
ok(bad===0,`120 charts x 7 planets (${n}): Jagradadi/Deeptadi match dignity, states in allowed lists, Kopa = combust, no NaN`);
ok(run('Object.keys(AVS.compute(computeChart("1990-03-12","06:40",28.61,77.21,5.5)).planets).join()')==='Sun,Moon,Mars,Mercury,Jupiter,Venus,Saturn','seven grahas only (no Rahu/Ketu)');
ok(run('AVS.text(computeChart("1990-03-12","06:40",28.61,77.21,5.5))').split('\n').length===7,'text() gives seven lines');
process.exit(fail?1:0);

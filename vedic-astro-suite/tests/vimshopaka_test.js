// node tests/vimshopaka_test.js - Vimshopaka Bala (js/135): weight sums, hand-worked scores, real charts
const vm=require('vm'),fs=require('fs'),path=require('path');
const base=path.join(__dirname,'..','apps','birth-chart','js')+'/'; const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx; vm.createContext(ctx);
const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','117-gulika.js','15-chart-core-compute.js','134-avasthas.js','135-vimshopaka.js']);
const run=s=>vm.runInContext(s,ctx); let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log('FAIL',m);} else console.log('ok  ',m); };

const sets=JSON.parse(run('JSON.stringify(Object.fromEntries(Object.entries(VIM.SETS).map(([k,v])=>[k,v.w])))'));
ok(Object.values(sets).every(w=>Math.abs(Object.values(w).reduce((a,b)=>a+b,0)-20)<1e-9),'every set adds to exactly 20 (Shad, Sapta, Dasha, Shodasha)');
ok(Object.keys(sets.Shadvarga).join()==='D1,D2,D3,D9,D12,D30'&&Object.keys(sets.Shodashavarga).length===16&&Object.keys(sets.Dashavarga).length===10&&Object.keys(sets.Saptavarga).length===7,'chart counts 6 / 7 / 10 / 16');
ok(Object.values(sets).every(w=>Object.keys(w).every(k=>run(`!!VARGAS.${k}`))),'every chart key exists in the app VARGAS');
/* hand-worked synthetic chart: Sun in Leo (own, index 4) in every varga and D1 -> 20 in every set; Moon in Cancer in D1 but Capricorn (enemy? Saturn) elsewhere */
const mk=(sunSign,moonD1,moonV)=>{const planets={},vargas={};const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];names.forEach((n,i)=>planets[n]={sign:n==='Sun'?sunSign:n==='Moon'?moonD1:i});
  const all=new Set();Object.values(sets).forEach(w=>Object.keys(w).forEach(k=>all.add(k)));all.forEach(k=>{vargas[k]={planetVargaSign:Object.fromEntries(names.map((n,i)=>[n,n==='Sun'?sunSign:n==='Moon'?moonV:i]))};});return {planets,vargas};};
ctx._s=mk(4,3,3);
ok(['Shadvarga','Saptavarga','Dashavarga','Shodashavarga'].every(k=>Math.abs(run(`VIM.compute(_s,'${k}').planets.Sun.total`)-20)<1e-9),'planet in its own sign in every chart scores 20 in all four sets');
/* Moon in Capricorn (9, lord Saturn) in every varga, Moon in Cancer (3) in D1, Saturn in sign 6 (Libra): Saturn is Moon's natural neutral; Libra is 4 signs from Cancer -> temporary friend -> friend (15 of 20 = 75%) */
ctx._s=mk(4,3,9); ctx._s.planets.Saturn.sign=6;
ok(Math.abs(run("VIM.compute(_s,'Shadvarga').planets.Moon.total")-15)<1e-9,'hand-worked: Moon in Saturn\'s sign, Saturn 4th from Moon = friend = 75% of 20 = 15');
/* Moon debilitated (Scorpio=7) -> 0 */
ctx._s=mk(4,3,7); ok(run("VIM.compute(_s,'Shadvarga').planets.Moon.total")===0,'debilitated in every chart scores 0');
ok(run("VIM.band(16)")==='wholly favourable'&&run("VIM.band(12)")==='middling'&&run("VIM.band(7)")==='some good results'&&run("VIM.band(3)")==='little help'&&run("VIM.band(15)")==='middling'&&run("VIM.band(5)")==='little help','bands follow BPHS: >15, 10-15, 5-10, <5 (edges go down)');
/* real charts */
let bad=0,n=0;
for(let i=0;i<80;i++){
  const d=new Date(Date.UTC(1950+(i*7)%70,(i*5)%12,1+(i*11)%28)).toISOString().slice(0,10);
  ctx._c=run(`computeChart('${d}','${String(i%24).padStart(2,'0')}:${String((i*13)%60).padStart(2,'0')}',${10+(i%40)},${70+(i%30)},5.5)`);
  for(const k of Object.keys(sets)){ const D=run(`VIM.compute(_c,'${k}')`);
    for(const g of run('VIM.GRAHA')){ n++; const p=D.planets[g];
      if(!(p.total>=0&&p.total<=20.0000001))bad++;
      if(p.rows.length!==Object.keys(sets[k]).length)bad++;
      if(Math.abs(p.rows.reduce((a,r)=>a+r.points,0)-p.total)>1e-9)bad++;
      if(p.rows.some(r=>r.sign!==run(`SIGNS[_c.vargas.${r.varga}.planetVargaSign.${g}].name`)))bad++;
      const d1=p.rows.find(r=>r.varga==='D1'); const st=ctx._c.planets[g].dignity.status;
      if((st==='OwnSign'||st==='Moolatrikona'||st==='Exalted')&&d1.rel!=='Own')bad++; } }
  const h=run('VIM.html(_c,{})'); if(/undefined|NaN|\[object/.test(h)||(h.match(/vim-pl/g)||[]).length<7)bad++; }
ok(bad===0,`80 charts x 4 sets x 7 planets (${n*1}): 0..20, rows add up, signs equal chart.vargas, D1 own/exalted = own, no NaN`);
ok(run('VIM.text(computeChart("1990-03-12","06:40",28.61,77.21,5.5))').split('\n').length===8,'text() gives title + seven lines');
process.exit(fail?1:0);

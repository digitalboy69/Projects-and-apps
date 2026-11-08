// node tests/ashtakavarga_extras_test.js - Ashtakavarga extras (js/141): Prastara column sums = the app BAV, known totals, render
const vm=require('vm'),fs=require('fs'),path=require('path');
const base=path.join(__dirname,'..','apps','birth-chart','js')+'/'; const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx; vm.createContext(ctx);
const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','117-gulika.js','15-chart-core-compute.js','134-avasthas.js','141-ashtakavarga-extras.js']);
const run=s=>vm.runInContext(s,ctx); let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log('FAIL',m);} else console.log('ok  ',m); };

const KNOWN={Sun:48,Moon:49,Mars:39,Mercury:54,Jupiter:56,Venus:52,Saturn:39};
let bad=0,n=0,tot337=0;
for(let i=0;i<100;i++){
  const d=new Date(Date.UTC(1940+(i*7)%80,(i*5)%12,1+(i*11)%28)).toISOString().slice(0,10);
  ctx._c=run(`computeChart('${d}','${String(i%24).padStart(2,'0')}:${String((i*13)%60).padStart(2,'0')}',${10+(i%40)},${70+(i%30)},5.5)`); n++;
  let sav=new Array(12).fill(0);
  for(const p of Object.keys(KNOWN)){
    const P=run(`ASX.prastara(_c,'${p}')`), bav=ctx._c.ashtakavarga.bavTables[p];
    if(P.totals.join()!==bav.join())bad++;                       /* column sums equal the app's BAV */
    if(P.total!==KNOWN[p])bad++;                                  /* classic totals */
    Object.keys(P.rows).forEach(c=>{ if(P.rows[c].some(v=>v!==0&&v!==1))bad++; if(P.rowTotals[c]!==run(`CONTRIBUTION_TABLE.${p}.${c}.length`))bad++; });
    P.totals.forEach((v,k)=>sav[k]+=v); }
  if(sav.join()!==ctx._c.ashtakavarga.sav.join())bad++; if(sav.reduce((a,b)=>a+b,0)===337)tot337++;
  const S=run('ASX.html(_c,{})'); if(/undefined|NaN|\[object/.test(S)||(S.match(/<tr>/g)||[]).length!==9)bad++; }
ok(bad===0,`100 charts x 7 planets: Prastara column sums equal chart.ashtakavarga.bavTables, totals 48/49/39/54/56/52/39, row totals = table lengths, SAV equal (${n})`);
ok(tot337===100,'Sarvashtakavarga is 337 in every chart');
/* hand-worked: Sun's own row for Sun in Aries (index 0): offsets 1,2,4,7,8,9,10,11 -> signs 0,1,3,6,7,8,9,10 */
ctx._h={planets:Object.fromEntries(['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'].map(n=>[n,{sign:0}])),ascendant:{sign:0}};
ok(run("ASX.prastara(_h,'Sun').rows.Sun.join()")==='1,1,0,1,0,0,1,1,1,1,1,0','hand-worked: Sun in Aries gives Sun-table bindus to signs 1,2,4,7,8,9,10,11 counted from Aries');
ok(run("ASX.text(_c).split('\\n').length")===7,'text() gives seven lines');
process.exit(fail?1:0);

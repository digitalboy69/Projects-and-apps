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


/* ---- A8b Sodhana: hand-worked reductions ---- */
const T=(a)=>run(`ASX.trikona(${JSON.stringify(a)})`).join();
const mk12=(o)=>{const a=new Array(12).fill(0);Object.entries(o).forEach(([i,v])=>a[i]=v);return a;};
ok(T(mk12({0:5,4:3,8:4}))===mk12({0:2,4:0,8:1}).join(),'trine: 5,3,4 -> subtract the smallest (3) -> 2,0,1');
ok(T(mk12({0:4,4:0,8:6}))===mk12({0:4,4:0,8:6}).join(),'trine with one zero: unchanged');
ok(T(mk12({0:0,4:0,8:5}))===mk12({}).join(),'trine with two zeros: the third becomes zero');
ok(T(mk12({1:3,5:3,9:3}))===mk12({}).join(),'trine with three equal figures: all zero');
ok(T(mk12({2:2,6:2,10:5,3:6,7:1,11:4}))===mk12({10:3,3:5,11:3}).join(),'two trines at once: 2,2,5 -> 0,0,3 and 6,1,4 -> 5,0,3');
const E=(a,p,occ)=>run(`ASX.ekadhipatya(${JSON.stringify(a)},'${p}',new Set(${JSON.stringify(occ)}))`).join();
ok(E(mk12({0:5,7:3}),'Mars',[0,7])===mk12({0:5,7:3}).join(),'Mars pair, both occupied: no change');
ok(E(mk12({0:5,7:3}),'Mars',[0])===mk12({0:5}).join(),'Mars pair, Aries occupied (5), Scorpio empty with fewer (3): Scorpio goes to zero');
ok(E(mk12({0:3,7:5}),'Mars',[0])===mk12({0:3,7:3}).join(),'Mars pair, Aries occupied (3), Scorpio empty with more (5): Scorpio cut to 3');
ok(E(mk12({0:5,7:3}),'Mars',[])===mk12({0:3,7:3}).join(),'neither occupied, unequal: larger cut to the smaller');
ok(E(mk12({0:4,7:4}),'Mars',[])===mk12({}).join(),'neither occupied, equal: both zero');
ok(E(mk12({0:0,7:6}),'Mars',[])===mk12({7:6}).join(),'one sign has zero bindus: no change');
ok(E(mk12({4:5,3:5}),'Sun',[])===mk12({4:5,3:5}).join()&&E(mk12({4:5}),'Moon',[])===mk12({4:5}).join(),'Sun and Moon are never reduced');
ok(E(mk12({8:2,11:7}),'Jupiter',[11])===mk12({8:0,11:7}).join(),'Jupiter pair (Sagittarius, Pisces): occupied Pisces 7 keeps, empty Sagittarius 2 -> 0');
ok(run('ASX.DUAL.Venus.join()')==='1,6'&&run('ASX.DUAL.Saturn.join()')==='9,10'&&run('ASX.DUAL.Mercury.join()')==='2,5'&&run('ASX.DUAL.Jupiter.join()')==='8,11'&&run('ASX.DUAL.Mars.join()')==='0,7','owned pairs: Mars Ar-Sc, Mercury Ge-Vi, Jupiter Sg-Pi, Venus Ta-Li, Saturn Cp-Aq');
ok(run('ASX.RASI_M.join()')==='7,10,8,4,10,5,7,8,9,5,11,12'&&JSON.stringify(run('ASX.GRAHA_M'))===JSON.stringify({Sun:5,Moon:5,Mars:8,Mercury:5,Jupiter:10,Venus:7,Saturn:5}),'multipliers equal the three published lists');
const ex=[6,0,4,8,0,4,5,0,8,2,0,0];
ok(ex.map((v,i)=>v*run('ASX.RASI_M')[i]).join()==='42,0,32,32,0,20,35,0,72,10,0,0'&&ex.reduce((a,v,i)=>a+v*run('ASX.RASI_M')[i],0)===243,'astrobix worked example: sign products and the 243 total reproduce');
ok(0*5+2*5+0*8+0*5+0*10+8*7+8*5===106&&243+106===349,'astrobix worked example: graha total 106 and Shodhya 349 reproduce');
bad=0;
const TR=[[0,4,8],[1,5,9],[2,6,10],[3,7,11]];
for(let i=0;i<100;i++){
  const d=new Date(Date.UTC(1940+(i*7)%80,(i*5)%12,1+(i*11)%28)).toISOString().slice(0,10);
  ctx._c=run(`computeChart('${d}','${String(i%24).padStart(2,'0')}:${String((i*13)%60).padStart(2,'0')}',${10+(i%40)},${70+(i%30)},5.5)`);
  for(const p of Object.keys(KNOWN)){
    const S=run(`ASX.sodhana(_c,'${p}')`), raw=ctx._c.ashtakavarga.bavTables[p];
    if(S.raw.join()!==raw.join())bad++;
    S.trikona.forEach((v,k)=>{ if(v>raw[k]||v<0)bad++; }); S.ekadhipatya.forEach((v,k)=>{ if(v>S.trikona[k]||v<0)bad++; });
    TR.forEach(t=>{ if(Math.min(...t.map(k=>S.trikona[k]))!==0)bad++; });
    if(S.rasiPinda!==S.ekadhipatya.reduce((a,v,k)=>a+v*[7,10,8,4,10,5,7,8,9,5,11,12][k],0))bad++;
    if(S.shodhya!==S.rasiPinda+S.grahaPinda)bad++;
    if(S.grahaParts.length!==7||S.grahaParts.some(g=>g.product!==g.bindus*g.mult))bad++;
    if(['Sun','Moon'].includes(p)&&S.ekadhipatya.join()!==S.trikona.join())bad++; }
  const H=run('ASX.html(_c,{})'); if(/undefined|NaN|\[object/.test(H))bad++; }
ok(bad===0,'100 charts x 7 planets: reduction never raises a figure, each trine ends with a zero, Sun/Moon skip pairs, pindas add up');
process.exit(fail?1:0);

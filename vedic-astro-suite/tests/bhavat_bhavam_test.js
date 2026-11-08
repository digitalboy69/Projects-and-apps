// node tests/bhavat_bhavam_test.js - Bhavat Bhavam and Arudha Padas (js/140): pairs vs two sources, arudha rule hand-worked, A7, render
const vm=require('vm'),fs=require('fs'),path=require('path');
const base=path.join(__dirname,'..','apps','birth-chart','js')+'/'; const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx; vm.createContext(ctx);
const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','117-gulika.js','15-chart-core-compute.js','134-avasthas.js','17-special-lagnas.js','140-bhavat-bhavam.js']);
const run=s=>vm.runInContext(s,ctx); let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log('FAIL',m);} else console.log('ok  ',m); };

/* Pairs typed from the two sources (panchangbodh: all 12; astrosight: ten of them) */
const PB={1:1,2:3,3:5,4:7,5:9,6:11,7:1,8:3,9:5,10:7,11:9,12:11}, AS={1:1,2:3,4:7,5:9,6:11,7:1,8:3,9:5,10:7,12:11};
ok(Object.keys(PB).every(h=>run(`BBH.derived(${h})`)===PB[h]),'Nth from Nth equals all 12 pairs of the first source');
ok(Object.keys(AS).every(h=>run(`BBH.derived(${h})`)===AS[h]),'and the ten pairs of the second source');
ok(Object.keys(PB).every(h=>run(`BBH.derived(${h})`)===((2*(h-1))%12)+1),'matches the counting rule (count N places from house N, inclusive)');
/* arudha rule, hand-worked (house sign Aries=0 lord Mars) */
const ap=(hs,ls)=>run(`calcArudhaPadaSign(${hs},0,{Mars:{sign:${ls}},Venus:{sign:${ls}},Mercury:{sign:${ls}},Moon:{sign:${ls}},Sun:{sign:${ls}},Jupiter:{sign:${ls}},Saturn:{sign:${ls}}})`);
ok(ap(0,1)===2,'Aries house, Mars in Taurus (2nd): count 1 more from Taurus = Gemini');
ok(ap(0,0)===9,'Aries house, lord in the house itself: lands on the house, so 10th from it = Capricorn');
ok(ap(0,3)===3,'Aries house, Mars in Cancer: lands in Libra (7th), corrected to the 10th from it = Cancer');
ok(ap(0,9)===3,'Aries house, Mars in Capricorn (9 away): 9 more = Libra (7th from Aries), corrected to the 10th from it = Cancer');
ok(ap(0,4)===8,'Aries house, Mars in Leo (4 away): 4 more = Sagittarius, no correction needed');
/* real charts */
let bad=0,n=0;
for(let i=0;i<60;i++){
  const d=new Date(Date.UTC(1950+(i*7)%70,(i*5)%12,1+(i*11)%28)).toISOString().slice(0,10);
  ctx._c=run(`computeChart('${d}','${String(i%24).padStart(2,'0')}:${String((i*13)%60).padStart(2,'0')}',${10+(i%40)},${70+(i%30)},5.5)`); n++;
  const D=run('BBH.compute(_c)'); if(D.rows.length!==12||D.padas.length!==12)bad++;
  D.rows.forEach(r=>{ if(r.derived!==PB[r.house])bad++; if(r.sign!==(ctx._c.ascendant.sign+r.derived-1)%12)bad++;
    const pp=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].filter(q=>ctx._c.planets[q].house===r.derived); if(pp.join()!==r.planets.join())bad++; });
  const ex=run('calcAllArudhaPadas(_c,_c.ascendant.sign)');
  D.padas.forEach(p=>{ if(p.key!=='A7'&&p.sign!==ex[p.key])bad++; if(!(p.sign>=0&&p.sign<12))bad++; if(p.house!==((p.sign-ctx._c.ascendant.sign+12)%12)+1)bad++;
    /* no pada lands in the house it represents or its 7th */
    const base=p.key==='AL'?1:p.key==='UL'?12:+p.key.slice(1); if(p.house===base||p.house===((base+5)%12)+1)bad++; });
  const S=run('BBH.html(_c,{})'); if(/undefined|NaN|\[object/.test(S)||(S.match(/<article class="bbh-card/g)||[]).length!==24)bad++; if(/fatal|doom|death|cursed|will die/i.test(S))bad++; }
ok(bad===0,`60 real charts: 12 pairs + 12 padas, planets match chart houses, existing 11 padas unchanged, no pada in its own or 7th house, no NaN (${n})`);
ok(run('BBH.text(computeChart("1990-03-12","06:40",28.61,77.21,5.5))').split('\n').length===24,'text() gives 24 lines');
process.exit(fail?1:0);

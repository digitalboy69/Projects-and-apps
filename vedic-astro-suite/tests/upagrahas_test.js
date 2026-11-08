// node tests/upagrahas_test.js - Upagrahas (js/136): formula chain, hand-worked values, invariants, render
const vm=require('vm'),fs=require('fs'),path=require('path');
const base=path.join(__dirname,'..','apps','birth-chart','js')+'/'; const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx; vm.createContext(ctx);
const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','117-gulika.js','15-chart-core-compute.js','134-avasthas.js','136-upagrahas.js']);
const run=s=>vm.runInContext(s,ctx); let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log('FAIL',m);} else console.log('ok  ',m); };

const near=(a,b)=>Math.abs(((a-b+540)%360)-180)<1e-9;
const F=l=>JSON.parse(run(`JSON.stringify(UPA.fromSun(${l}))`));
let f=F(0);
ok(near(f.Dhuma,133+20/60)&&near(f.Vyatipata,226+40/60)&&near(f.Parivesha,46+40/60)&&near(f.Indrachapa,313+20/60)&&near(f.Upaketu,330),'Sun 0: 133d20, 226d40, 46d40, 313d20, 330 (hand-worked)');
f=F(100); ok(near(f.Dhuma,233+20/60)&&near(f.Vyatipata,126+40/60)&&near(f.Parivesha,306+40/60)&&near(f.Indrachapa,53+20/60)&&near(f.Upaketu,70),'Sun 100 (wraps past 360): 233d20, 126d40, 306d40, 53d20, 70');
let bad=0; for(let i=0;i<1000;i++){ const s=(i*37.7)%360; const g=F(s);
  if(!near(g.Indrachapa,g.Dhuma+180))bad++; if(!near(g.Parivesha,g.Vyatipata+180))bad++; if(!near(g.Upaketu,s-30))bad++; if(!near(g.Dhuma+g.Vyatipata,0)) bad++; if(Object.values(g).some(v=>!(v>=0&&v<360)))bad++; }
ok(bad===0,'1000 Sun longitudes: Dhuma/Indrachapa and Vyatipata/Parivesha are 180 apart, Upaketu = Sun - 30, Dhuma + Vyatipata = 360, all in 0..360');
bad=0; let n=0;
for(let i=0;i<60;i++){
  const d=new Date(Date.UTC(1950+(i*7)%70,(i*5)%12,1+(i*11)%28)).toISOString().slice(0,10);
  ctx._c=run(`computeChart('${d}','${String(i%24).padStart(2,'0')}:${String((i*13)%60).padStart(2,'0')}',${10+(i%40)},${70+(i%30)},5.5)`);
  const R=run('UPA.compute(_c)'); n++;
  if(R.length<5||R.length>6)bad++;
  if(!near(R[0].longitude,ctx._c.planets.Sun.longitude+133+20/60))bad++;
  const gk=ctx._c.upagraha.Gulika; if(gk&&(R.length!==6||R[5].longitude!==gk.longitude||R[5].house!==gk.house))bad++;
  for(const r of R){ if(r.house!==((r.sign-ctx._c.ascendant.sign+12)%12)+1)bad++; if(r.sign!==Math.floor(r.longitude/30))bad++; }
  const before=JSON.stringify(Object.keys(ctx._c.upagraha)); const h=run('UPA.html(_c,{})'); if(JSON.stringify(Object.keys(ctx._c.upagraha))!==before)bad++;
  if(/undefined|NaN|\[object/.test(h)||(h.match(/upa-card/g)||[]).length!==R.length)bad++; }
ok(bad===0,`60 real charts: house = sign from Lagna, Gulika copied unchanged, chart.upagraha untouched, no NaN (${n})`);
ok(run('UPA.text(computeChart("1990-03-12","06:40",28.61,77.21,5.5))').split('\n').length>=5,'text() lists the points');
process.exit(fail?1:0);

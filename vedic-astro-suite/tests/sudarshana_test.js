// node tests/sudarshana_test.js - Sudarshana Chakra (js/138): year-to-house cycle, ring geometry, planet placement, nature rules, render
const vm=require('vm'),fs=require('fs'),path=require('path');
const base=path.join(__dirname,'..','apps','birth-chart','js')+'/'; const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx; vm.createContext(ctx);
const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','117-gulika.js','15-chart-core-compute.js','134-avasthas.js','138-sudarshana.js']);
const run=s=>vm.runInContext(s,ctx); let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log('FAIL',m);} else console.log('ok  ',m); };

ok(run('Array.from({length:120},(_,i)=>SDC.yearHouse(i+1)).every((h,i)=>h===(i%12)+1)'),'year 1..120 maps to house 1..12 repeating (13 -> 1, 24 -> 12, 25 -> 1)');
ok(run('SDC.yearHouse(1)')===1&&run('SDC.yearHouse(12)')===12&&run('SDC.yearHouse(13)')===1&&run('SDC.yearHouse(100)')===4,'year 1, 12, 13, 100 -> houses 1, 12, 1, 4 (100 = 8*12+4)');
ok(run('SDC.houseFrom(0,0)')===1&&run('SDC.houseFrom(0,6)')===7&&run('SDC.houseFrom(11,0)')===2&&run('SDC.houseFrom(5,4)')===12,'house counted from a reference sign: same = 1, opposite = 7, Pisces->Aries = 2, Virgo->Leo = 12');
/* nature rules on a synthetic chart */
const mk=(dg)=>({planets:Object.fromEntries(['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map(n=>[n,{sign:0,dignity:{status:dg[n]||'Neutral'}}]))});
ctx._m=mk({Mars:'OwnSign',Saturn:'Exalted',Jupiter:'Debilitated',Venus:'Enemy',Mercury:'Friend'});
const nat=n=>run(`SDC.nature(_m,'${n}')`);
ok(nat('Mars')==='good'&&nat('Saturn')==='good'&&nat('Sun')==='bad'&&nat('Rahu')==='bad'&&nat('Ketu')==='bad','malefics are adverse, but Mars and Saturn in own/exalted sign count benefic');
ok(nat('Jupiter')==='bad'&&nat('Venus')==='bad'&&nat('Mercury')==='good'&&nat('Moon')==='good','benefics are good, but adverse when debilitated or in an enemy sign');
ok(run("SDC.nature(mk2=(()=>{const c=_m;c.planets.Mars.dignity.status='Neutral';return c})(),'Mars')")==='bad','Mars in a neutral sign stays malefic');
/* currentYear */
ctx._c=run("computeChart('1990-03-12','06:40',28.61,77.21,5.5)"); const jd0=ctx._c.julianDay;
ok(run(`SDC.currentYear(_c,${jd0}+10)`)===1&&run(`SDC.currentYear(_c,${jd0}+365.2425*12+1)`)===13&&run(`SDC.currentYear(_c,${jd0}-5)`)===1,'first year of life = 1 (birth to first birthday), 13 at twelve years');
let bad=0,n=0;
for(let i=0;i<60;i++){
  const d=new Date(Date.UTC(1950+(i*7)%70,(i*5)%12,1+(i*11)%28)).toISOString().slice(0,10);
  ctx._c=run(`computeChart('${d}','${String(i%24).padStart(2,'0')}:${String((i*13)%60).padStart(2,'0')}',${10+(i%40)},${70+(i%30)},5.5)`); n++;
  for(const yr of [1,7,13,30,58,99]){
    const D=run(`SDC.compute(_c,${yr})`);
    if(D.house!==((yr-1)%12)+1||D.rings.length!==3)bad++;
    D.rings.forEach((R,ri)=>{ const cnt=Object.values(R.inHouse).reduce((a,v)=>a+v.length,0); if(cnt!==9)bad++;
      const refSign=ri===0?ctx._c.ascendant.sign:ri===1?ctx._c.planets.Moon.sign:ctx._c.planets.Sun.sign; if(R.refSign!==refSign)bad++;
      if(R.sign!==(refSign+D.house-1)%12)bad++;
      R.planets.forEach(p=>{ if(((ctx._c.planets[p.name].sign-refSign+12)%12)+1!==D.house)bad++; });
      if(R.good+R.bad!==R.planets.length)bad++; });
    /* Lagna ring holds the same planets the chart puts in that house */
    const h=ctx._c.ascendant.sign; const viaChart=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].filter(p=>((ctx._c.planets[p].sign-h+12)%12)+1===D.house);
    if(viaChart.join()!==D.rings[0].planets.map(p=>p.name).join())bad++;
    if(run(`SDC.html(_c,{})`)===undefined)bad++;
  }
  const S=run('SDC.html(_c,{})'); if(/undefined|NaN|\[object/.test(S))bad++;
  if((S.match(/class="sdc-cell/g)||[]).length!==36)bad++; if((S.match(/class="sdc-pl/g)||[]).length!==27)bad++;
  if(/fatal|doom|death|cursed|will die/i.test(S))bad++; }
ok(bad===0,`60 charts x 6 years: three rings, 9 planets in each, houses from Lagna/Moon/Sun, drawing has 36 cells and 27 planet glyphs, no NaN (${n})`);
ok(run('SDC.text(computeChart("1990-03-12","06:40",28.61,77.21,5.5),13)').includes('year 13 (house 1)'),'text() names year and house');
process.exit(fail?1:0);

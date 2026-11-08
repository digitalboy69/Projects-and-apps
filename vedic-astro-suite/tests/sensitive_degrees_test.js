// node tests/sensitive_degrees_test.js - Sensitive Degrees (js/137): tables vs independently typed source tables, window edges, real charts
const vm=require('vm'),fs=require('fs'),path=require('path');
const base=path.join(__dirname,'..','apps','birth-chart','js')+'/'; const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx; vm.createContext(ctx);
const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','117-gulika.js','15-chart-core-compute.js','134-avasthas.js','137-sensitive-degrees.js']);
const run=s=>vm.runInContext(s,ctx); let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log('FAIL',m);} else console.log('ok  ',m); };

const J=s=>JSON.parse(run('JSON.stringify('+s+')'));
/* Table 2: astrogurukul layout (rows = signs, columns = planets), typed here in a different shape from the code (planet-major) */
const AG={ // Asd,Sun,Moon,Mars,Mercury,Jupiter,Venus,Saturn,Rahu
 Aries:[8,20,26,19,15,19,28,10,14],Taurus:[9,9,12,28,14,29,15,4,13],Gemini:[22,12,13,25,13,12,11,7,12],Cancer:[22,6,25,23,12,27,17,9,11],Leo:[25,8,24,29,8,6,10,12,24],Virgo:[14,24,11,28,18,4,13,16,23],
 Libra:[4,16,26,14,20,13,4,3,22],Scorpio:[23,17,14,21,10,10,6,18,21],Sagittarius:[18,22,13,2,21,17,27,28,10],Capricorn:[20,2,25,15,22,11,12,14,20],Aquarius:[21,3,5,11,7,15,29,13,18],Pisces:[10,23,12,6,5,28,19,15,8]};
/* Table 3: Jataka Parijata layout from saptarishisshop (Sun,Moon,Mars,Mercury,Jupiter,Venus,Saturn,Rahu,Lagna) */
const JPT={Aries:[20,8,19,15,19,28,10,14,1],Taurus:[9,25,28,14,29,15,4,13,9],Gemini:[12,22,25,13,12,11,7,12,22],Cancer:[6,22,23,12,27,17,9,11,22],Leo:[8,21,29,8,6,10,12,24,25],Virgo:[24,1,28,18,4,13,16,23,2],Libra:[16,4,14,20,13,4,3,22,4],Scorpio:[17,23,21,10,10,6,18,21,23],Sagittarius:[22,18,2,21,17,27,28,10,18],Capricorn:[2,20,15,22,11,12,14,20,20],Aquarius:[3,20,11,7,15,29,13,18,24],Pisces:[23,10,6,5,28,19,15,8,10]};
const SG=Object.keys(AG); const mb=J('SDG.MB'), moon=J('SDG.MOON');
let bad=0;
SG.forEach((s,i)=>{ const a=AG[s],j=JPT[s];
  ['Sun','Mars','Mercury','Jupiter','Venus','Saturn','Rahu'].forEach(p=>{ const ai={Sun:1,Mars:3,Mercury:4,Jupiter:5,Venus:6,Saturn:7,Rahu:8}[p], ji={Sun:0,Mars:2,Mercury:3,Jupiter:4,Venus:5,Saturn:6,Rahu:7}[p];
    if(mb[p][i]!==a[ai]||mb[p][i]!==j[ji])bad++; });
  if(moon.JP.d[i]!==j[1])bad++; if(moon.PH.d[i]!==a[2])bad++; if(mb.Lagna[i]!==j[8])bad++; });
ok(bad===0,'Mrityu Bhaga: Sun, Mars, Mercury, Jupiter, Venus, Saturn, Rahu equal BOTH independently typed source tables in all 84 cells; Moon rows equal their traditions; Lagna = Jataka Parijata');
ok(SG.filter((s,i)=>mb.Lagna[i]!==AG[s][0]).join()==='Aries,Virgo,Aquarius','the only Lagna cells where the third source differs are Aries, Virgo, Aquarius (documented)');
/* Pushkara navamsa: aaps per-sign list typed as signs->[ [start,end],[start,end] ] in degrees+minutes */
const am=(d,m)=>d+m/60; const AAPS={Aries:[[am(20,0),am(23,20)],[am(26,40),30]],Taurus:[[am(6,40),10],[am(13,20),am(16,40)]],Gemini:[[am(16,40),20],[am(23,20),am(26,40)]],Cancer:[[0,am(3,20)],[am(6,40),10]]};
const pn=J('SDG.PNAV'); const el=[0,1,2,3];
ok(['Aries','Taurus','Gemini','Cancer'].every((s,i)=>AAPS[s].every((r,k)=>Math.abs(pn[i][k][0]-r[0])<1e-9&&Math.abs(pn[i][k][1]-r[1])<1e-9)),'Pushkara navamsa ranges equal the per-sign source list (fire, earth, air, water)');
ok(pn.every(e=>e.length===2&&e.every(([a,b])=>Math.abs((b-a)-10/3)<1e-9||Math.abs((b-a)-10/3)<1e-9)),'every Pushkara range is exactly one navamsa (3d20) wide');
const chk=(n,lon)=>J(`SDG.check('${n}',${lon})`);
const has=(r,k)=>r.flags.some(f=>f.k===k);
/* Mrityu Bhaga window: Sun, Aries, 20th degree = 19..20 */
ok(has(chk('Sun',19.0),'mb')&&has(chk('Sun',19.99),'mb')&&!has(chk('Sun',20.0),'mb')&&!has(chk('Sun',18.99),'mb'),'Sun Aries: 20th degree = 19.00 to 19.99 flagged, 20.00 and 18.99 not');
ok(has(chk('Moon',7.5),'mb')&&has(chk('Moon',25.5),'mb')&&!has(chk('Moon',10),'mb'),'Moon Aries: both traditions flag (8th and 26th degree)');
ok(chk('Moon',7.5).flags.find(f=>f.k==='mb').text.includes('Jataka Parijata')&&chk('Moon',25.5).flags.find(f=>f.k==='mb').text.includes('Phaladeepika'),'Moon flag names the tradition');
/* Gandanta edges (sign boundary at Cancer 90, Leo 120, etc.) */
ok(has(chk('Mars',119.0),'gand')&&has(chk('Mars',120+3.2),'gand')&&!has(chk('Mars',120+3.4),'gand')&&!has(chk('Mars',120-3.4),'gand')&&has(chk('Mars',120-3.3),'gand'),'Gandanta Cancer/Leo: 3d20 either side (junction 120, edges 116.667 and 123.333)');
ok(has(chk('Mars',359.9),'gand')&&has(chk('Mars',0.1),'gand')&&has(chk('Mars',239.9),'gand')&&has(chk('Mars',240.1),'gand')&&!has(chk('Mars',30.5),'gand')&&!has(chk('Mars',60),'gand')&&!has(chk('Mars',150),'gand'),'Pisces/Aries and Scorpio/Sagittarius junctions flagged; Taurus start, Gemini, Virgo not (only water to fire junctions)');
ok(chk('Mars',0.5).flags.find(f=>f.k==='gand').core===true&&chk('Mars',2).flags.find(f=>f.k==='gand').core===false,'narrow core is within 0d48');
/* Pushkara bhaga */
ok(has(chk('Sun',20.8),'pb')&&has(chk('Sun',21.5),'pb')&&!has(chk('Sun',22.2),'pb')&&has(chk('Moon',30+14.2),'pb'),'Pushkara bhaga within 1 degree of 21 Aries and 14 Taurus');
ok(has(chk('Mercury',60+24.1),'pb')&&has(chk('Mercury',60+18.2),'pb'),'Gemini: Patel 24 and Jataka Parijata 18 both honoured');
/* Pushkara navamsa edges */
ok(has(chk('Venus',20.0),'pn')&&!has(chk('Venus',23+20/60),'pn')&&has(chk('Venus',26+40/60),'pn')&&has(chk('Venus',29.99),'pn')&&!has(chk('Venus',25),'pn'),'Aries: 20-23d20 and 26d40-30 yes, 23d20 and 25 no');
/* real charts */
bad=0;let n=0;
for(let i=0;i<80;i++){
  const d=new Date(Date.UTC(1950+(i*7)%70,(i*5)%12,1+(i*11)%28)).toISOString().slice(0,10);
  ctx._c=run(`computeChart('${d}','${String(i%24).padStart(2,'0')}:${String((i*13)%60).padStart(2,'0')}',${10+(i%40)},${70+(i%30)},5.5)`);
  const R=run('SDG.compute(_c)'); n++;
  if(R.length!==10){bad++;console.log('len',R.length);}
  R.forEach(r=>{ const lon=r.name==='Lagna'?ctx._c.ascendant.longitude:ctx._c.planets[r.name].longitude; if(r.sign!==Math.floor(lon/30)||Math.abs(r.deg-(lon%30))>1e-9){bad++;console.log('sd',r.name,r.sign,lon,r.deg);} });
  const h=run('SDG.html(_c,{})'); if(/undefined|NaN|\[object/.test(h)||(h.match(/<article class="sdg-card/g)||[]).length!==10){bad++;console.log('html',(h.match(/<article class="sdg-card/g)||[]).length,h.match(/undefined|NaN|\[object/)&&h.match(/undefined|NaN|\[object/)[0]);}
  if(/fatal|doom|death|cursed|will die/i.test(h)){bad++;console.log('words',h.match(/fatal|doom|death|cursed|will die/i)[0]);} }
ok(bad===0,`80 real charts: ten points, sign/degree match the chart, no NaN, no fear words (${n})`);
ok(run('SDG.text(computeChart("1990-03-12","06:40",28.61,77.21,5.5))').split('\n').length===10,'text() lists ten points');
process.exit(fail?1:0);

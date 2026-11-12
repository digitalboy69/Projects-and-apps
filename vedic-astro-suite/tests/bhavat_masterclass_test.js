// node tests/bhavat_masterclass_test.js - Bhavat Bhavam Masterclass (js/151 data + js/152 engine): formulas, pairs vs sources, scoring, timing, render
const vm=require('vm'),fs=require('fs'),path=require('path');
const base=path.join(__dirname,'..','apps','birth-chart','js')+'/'; const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx; vm.createContext(ctx);
const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','117-gulika.js','15-chart-core-compute.js','134-avasthas.js','17-special-lagnas.js','140-bhavat-bhavam.js','151-bhavat-masterclass-data.js','152-bhavat-masterclass.js']);
const run=s=>vm.runInContext(s,ctx); let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log('FAIL',m);} else console.log('ok  ',m); };
const PB={1:1,2:3,3:5,4:7,5:9,6:11,7:1,8:3,9:5,10:7,11:9,12:11};
ok(Object.keys(PB).every(h=>run(`BMC.derived(${h})`)===PB[h]&&run(`BMC.ref(${h},${h})`)===PB[h]),'derived(N) equals the 12 source pairs (and ref(N,N))');
ok(run('BMD.PAIRS.every(p=>BMC.derived(p.n)===p.d)'),'data table pairs match the formula');
ok(run('BMC.ref(8,7)')===2&&run('BMC.ref(12,3)')===2&&run('BMC.ref(7,7)')===1,'8th from 7th = 2, 12th from 3rd = 2, 7th from 7th = 1');
/* every example key in the source list (VJ: the 2nd house seen from other houses) resolves to house 2, except 12-7 which is 6 */
ok(run('Object.keys(BMD.EX).every(k=>{const[x,y]=k.split("-").map(Number);return BMC.ref(x,y)===(k==="12-7"?6:2);})'),'all sourced X-from-Y examples land on the expected house');
ok(run('[1,2,3,4,5,6,7,8,9,10,11,12].every(h=>[1,2,3,4,5,6,7,8,9,10,11,12].every(y=>BMC.ref(BMC.inv(h,y),y)===h))'),'inv() is the exact inverse of ref() for all 144 combinations');
ok(run('[1,2,3,4,5,6].every(n=>BMC.derived(n)===BMC.derived(n+6))'),'houses 6 apart share one derived house');
ok(run('new Set([1,2,3,4,5,6,7,8,9,10,11,12].map(BMC.derived)).size')===6&&run('[1,2,3,4,5,6,7,8,9,10,11,12].every(h=>BMC.derived(h)%2===1)'),'derived houses are only 1,3,5,7,9,11');
ok(run('BMD.TOPICS.every(t=>t.extra.every(e=>BMC.ref(e.x,e.y)>=1))')&&run('BMD.TOPICS.length')===12,'12 topics, extra counts all valid');
/* scoring on a hand-made house */
const mk=(o)=>Object.assign({h:7,sign:6,signName:'Libra',lord:'Venus',lordHouse:10,lordSign:'Cancer',lordDignity:'Neutral',occ:[],asp:[],sav:28},o);
const sg=f=>{ctx._f=f;return run('BMC.signal(_f)');};
ok(sg(mk({})).score===1,'lord in kendra +1 only -> +1');
ok(sg(mk({lordHouse:8,lordDignity:'Debilitated'})).score===-2,'lord in 8th -1, debilitated -1 = -2');
ok(sg(mk({h:8,lordHouse:12})).parts[0].v===0,'for the 8th house itself a lord in 12th is not counted against it');
ok(sg(mk({occ:['Jupiter','Venus','Mercury','Moon']})).parts[2].v===2,'occupants clamp at +2');
ok(sg(mk({h:10,occ:['Saturn','Mars']})).parts[2].v===0,'malefics in an upachaya house (10th) are not counted against it');
ok(sg(mk({occ:['Saturn','Mars','Rahu']})).parts[2].v===-2,'malefics elsewhere count against, clamp -2');
ok(sg(mk({asp:['Jupiter','Venus']})).parts[3].v===1&&sg(mk({asp:['Saturn','Mars']})).parts[3].v===-1,'aspects clamp at +1/-1');
ok(sg(mk({sav:31})).parts[4].v===1&&sg(mk({sav:25})).parts[4].v===-1&&sg(mk({sav:28})).parts[4].v===0,'ashtakavarga thresholds 30/25');
ok(sg(mk({lordDignity:'OwnSign'})).parts[1].v===1,'own sign counts as strong');
const R=(a,b)=>run(`BMC.relation(7,1,${a},${b})`).k;
ok(R(2,2)==='reinforced'&&R(2,-1)==='effort'&&R(-1,2)==='help'&&R(-2,-2)==='care'&&R(0,1)==='mixed'&&run('BMC.relation(1,1,3,3)').k==='same','relation outcomes');
/* real charts */
let bad=0,n=0,why=[];
for(let i=0;i<60;i++){
  const d=new Date(Date.UTC(1950+(i*7)%70,(i*5)%12,1+(i*11)%28)).toISOString().slice(0,10);
  ctx._c=run(`computeChart('${d}','${String(i%24).padStart(2,'0')}:${String((i*13)%60).padStart(2,'0')}',${10+(i%40)},${70+(i%30)},5.5)`); n++;
  const C=run('BMC.compute(_c, Date.UTC(2026,10,12))');
  if(C.rows.length!==12){bad++;why.push('rows');}
  C.rows.forEach(r=>{
    if(r.derived!==PB[r.house]){bad++;why.push('pair');}
    if(r.qf.sign!==(ctx._c.ascendant.sign+r.derived-1)%12){bad++;why.push('sign');}
    const occ=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].filter(q=>ctx._c.planets[q].house===r.derived);
    if(occ.join()!==r.qf.occ.join()){bad++;why.push('occ');}
    if(!(r.ps.score>=-6&&r.ps.score<=6)||!(r.qs.score>=-6&&r.qs.score<=6)){bad++;why.push('range');}
    if(r.ps.parts.length!==5){bad++;why.push('parts');}
    /* aspecting planets really aspect, and are not inside */
    r.pf.asp.forEach(p=>{ if(ctx._c.planets[p].house===r.house||ctx._c.planets[p].aspectsHouses.indexOf(r.house)<0){bad++;why.push('asp');} });
    /* active dasha entries really are lord or occupant */
    r.tm.active.forEach(a=>{ const okk=[r.pf,r.qf].some(f=>f.lord===a.planet||f.occ.indexOf(a.planet)>=0); if(!okk){bad++;why.push('timing');} });
  });
  if(!C.per||!C.per.md){bad++;why.push('per');}
  const S=run('BMC.html(_c)');
  if(/undefined|NaN|\[object/.test(S)){bad++;why.push('html-bad');}
  if(/fatal|doom|cursed|will die|death/i.test(S)){bad++;why.push('fear-word');}
  if((S.match(/class="bmc-h[ "]/g)||[]).length<12+12+7){bad++;why.push('cards');}
  if((S.match(/class="bmc-wn /g)||[]).length!==24||(S.match(/class="bmc-snap /g)||[]).length!==12||(S.match(/class="bmc-rg /g)||[]).length!==12||(S.match(/class="bmc-mb/g)||[]).length!==144){bad++;why.push('visuals');}
  const x=run('BMC.cell(_c,8,7)'); if(x.h!==2){bad++;why.push('cell');}
  if(run('BMC.hats(_c,2)').length!==12){bad++;why.push('hats');}
}
ok(bad===0,`60 real charts: 12 rows, pairs, signs, occupants, score range, aspects, timing roles, html clean, no fear words (${n})${bad?' '+why.slice(0,6).join(','):''}`);
/* dasha: a known date picks the right mahadasha */
ctx._c2=run('computeChart("1990-03-12","06:40",28.61,77.21,5.5)');
const per=run('BMC.currentPeriod(_c2, Date.UTC(2026,10,12))');
ok(per&&per.md==='Rahu','1990-03-12 chart is in Rahu Mahadasha on 2026-11-12 (Rahu ends 2027-10-18)');
ok(run('BMC.text(_c2)').split('\n').length===12,'text() gives 12 lines');
ok(!/\bundefined\b/.test(run('BMC.text(_c2)')),'text has no undefined');
/* every pair data row has a source tag and every source id exists */
ok(run('BMD.PAIRS.every(p=>p.src.length>0&&p.src.every(k=>BMD.SRC[k]))&&BMD.RULES.every(r=>["S","M","C"].includes(r.tag)&&r.src.every(k=>BMD.SRC[k]))'),'all rules and pairs carry valid tags and source ids');
process.exit(fail?1:0);

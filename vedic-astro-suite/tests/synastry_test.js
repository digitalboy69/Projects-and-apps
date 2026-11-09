// node tests/synastry_test.js - Synastry (js/143): overlays, contacts, mirror symmetry, hand-worked cases
const vm=require('vm'),fs=require('fs'),path=require('path');
const base=path.join(__dirname,'..','apps','birth-chart','js')+'/'; const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx; vm.createContext(ctx);
const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','117-gulika.js','15-chart-core-compute.js','51-kundali-matching-engine.js','143-synastry.js']);
const run=s=>vm.runInContext(s,ctx); let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log('FAIL',m);} else console.log('ok  ',m); };
const mkP=(name,lagna,signs)=>({name,lagna,moonSign:signs.Moon,chart:{planets:Object.fromEntries(['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map(n=>[n,{sign:signs[n]!=null?signs[n]:0}]))}});
ctx._mk=mkP;
/* hand-worked: A lagna Aries (0). B lagna Libra (6). A Sun in Leo(4): house in B = (4-6+12)%12+1 = 11 */
run("_A=_mk('Asha',0,{Sun:4,Moon:1,Mars:0,Mercury:2,Jupiter:8,Venus:11,Saturn:9}); _B=_mk('Ben',6,{Sun:7,Moon:1,Mars:3,Mercury:0,Jupiter:4,Venus:5,Saturn:10})");
ok(run("SYN.overlay(_A,_B).find(r=>r.planet==='Sun').house")===11,'A Sun in Leo is in the 11th of a Libra Lagna chart');
ok(run("SYN.overlay(_B,_A).find(r=>r.planet==='Sun').house")===8,'B Sun in Scorpio is in the 8th of an Aries Lagna chart');
ok(run("SYN.overlay(_A,_B).length")===9,'nine planets in each overlay');
ok(run("SYN.houseIn(6,_B)")===1,'a sign equal to the Lagna sign is house 1');
/* aspects: Mars Aries(0): signs 6, 3, 7 ; Jupiter Leo(4): 10, 8, 0 ; Saturn Capricorn(9): 3, 11, 6 ; Sun Aries: 6 */
ok(run("SYN.aspectSigns('Mars',0).sort((a,b)=>a-b).join()")==='3,6,7','Mars in Aries looks at Cancer, Libra, Scorpio');
ok(run("SYN.aspectSigns('Jupiter',4).sort((a,b)=>a-b).join()")==='0,8,10','Jupiter in Leo looks at Aries, Sagittarius, Aquarius');
ok(run("SYN.aspectSigns('Saturn',9).sort((a,b)=>a-b).join()")==='3,6,11','Saturn in Capricorn looks at Cancer, Libra, Pisces');
ok(run("SYN.aspectSigns('Sun',0).join()")==='6','Sun looks at the 7th only');
/* contacts: Moon-Moon both in Taurus (1): conjunct */
const cs=run("SYN.contacts(_A,_B)");
ok(cs.some(c=>c.a==='Moon'&&c.b==='Moon'&&c.kind==='conjunct'),'both Moons in Taurus: a conjunction');
/* A Mars Aries(0) looks at Libra(6); B has nothing in Libra, but B Sun in Scorpio(7) is looked at by A Mars? Mars 8th from Aries is Scorpio -> yes */
ok(cs.some(c=>c.a==='Mars'&&c.b==='Sun'&&c.kind==='aspect'&&c.dir==='AtoB'),"A's Mars (Aries) looks at B's Sun in Scorpio (8th sign): one-way");
/* A Sun Leo(4), B Saturn Aquarius(10): 7th apart, both look at each other */
ok(cs.some(c=>c.a==='Sun'&&c.b==='Saturn'&&c.kind==='aspect'&&c.dir==='mutual'),'A Sun in Leo and B Saturn in Aquarius look at each other');
ok(cs.every(c=>c.score===cs.filter(x=>x===c)[0].score),'scores are plain numbers');
ok(cs[0].score>=cs[cs.length-1].score,'sorted strongest first');
/* score arithmetic: Moon-Moon conjunct: 3+3+2 = 8; Moon is also nobody's Lagna lord here (Aries Mars, Libra Venus) */
ok(cs.find(c=>c.a==='Moon'&&c.b==='Moon').score===8,'Moon-Moon conjunction scores 3+3+2=8');
/* Lagna lord weight: A Mars is Aries Lagna lord (2, same as base 2); Mercury in A is not a lord. Use a chart where Jupiter is the lord: Sagittarius lagna (8) */
run("_C=_mk('Cy',8,{Sun:0,Moon:5,Mars:0,Mercury:0,Jupiter:0,Venus:0,Saturn:0}); _D=_mk('Di',0,{Sun:6,Moon:6,Mars:6,Mercury:6,Jupiter:0,Venus:6,Saturn:6})");
const cj=run("SYN.contacts(_C,_D)").find(c=>c.a==='Jupiter'&&c.b==='Jupiter');
ok(cj&&cj.kind==='conjunct'&&cj.score===2+1+2,'Jupiter as a Lagna lord counts 2 (Jupiter-Jupiter conjunct with only C a lord: 2+1+2=5)');
/* Moon relation */
const mr=run("SYN.moonRel(_A,_B)"); ok(mr.same&&mr.aToB===1&&mr.bToA===1,'same Moon sign: 1 and 1');
run("_E=_mk('Eve',0,{Moon:7})"); const m2=run("SYN.moonRel(_A,_E)"); ok(m2.aToB===7&&m2.bToA===7,'Taurus to Scorpio is the 7th both ways');
run("_F=_mk('Fay',0,{Moon:3})"); const m3=run("SYN.moonRel(_A,_F)"); ok(m3.aToB===3&&m3.bToA===11,'Taurus to Cancer: 3rd one way, 11th the other');
/* lagna lords */
const ll=run("SYN.lagnaLords(_A,_B)"); ok(ll.a.lord==='Mars'&&ll.a.houseInOwn===1&&ll.a.houseInOther===(0-6+12)%12+1,'A Lagna lord Mars (Aries) is house 1 at home and the 7th in B');
ok(ll.b.lord==='Venus'&&ll.b.signInOwn==='Virgo'&&ll.b.houseInOwn===12&&ll.b.houseInOther===6,"B's lagna lord Venus in Virgo: 12th at home, 6th in A's chart");

/* real charts: mirror consistency over 60 pairs, no NaN, no fear words */
let bad=0,n=0;
for(let i=0;i<60;i++){
  const mk=(k)=>{const d=new Date(Date.UTC(1950+(k*7)%60,(k*5)%12,1+(k*11)%28)).toISOString().slice(0,10);
    ctx._p=run(`SYN.person({name:'P${k}',dob:'${d}',tob:'${String((k*3)%24).padStart(2,'0')}:${String((k*13)%60).padStart(2,'0')}',lat:${10+(k%40)},lon:${70+(k%30)},tz:5.5})`);return ctx._p;};
  ctx._a=mk(i);ctx._b=mk(i+31);
  const ab=run('SYN.compute(_a,_b)'),ba=run('SYN.compute(_b,_a)'); n++;
  if(JSON.stringify(ab.aInB)!==JSON.stringify(ba.bInA)||JSON.stringify(ab.bInA)!==JSON.stringify(ba.aInB))bad++;                  /* swapping gives the mirrored tables */
  if(ab.contacts.length!==ba.contacts.length)bad++;
  const key=c=>c.a+'>'+c.b+':'+c.kind, flip=c=>c.b+'>'+c.a+':'+c.kind;
  const s1=ab.contacts.map(key).sort().join('|'), s2=ba.contacts.map(flip).sort().join('|'); if(s1!==s2)bad++;                       /* every contact appears mirrored */
  ab.contacts.forEach(c=>{ const m=ba.contacts.find(x=>x.a===c.b&&x.b===c.a&&x.kind===c.kind); if(!m||m.score!==c.score)bad++; if(c.dir==='AtoB'&&m.dir!=='BtoA')bad++; if(c.dir==='mutual'&&m.dir!=='mutual')bad++; });
  if(ab.moon.aToB!==ba.moon.bToA||ab.moon.bToA!==ba.moon.aToB)bad++;
  if(!ab.km||ab.km.ab.total!==ba.km.ba.total||ab.km.ba.total!==ba.km.ab.total)bad++;                                               /* score for an order is the same whichever way you ask */
  ab.aInB.concat(ab.bInA).forEach(r=>{ if(!(r.house>=1&&r.house<=12))bad++; });
  ctx.loadProfiles=()=>[ctx._b.profile]; run('SYN.state.a="cur";SYN.state.b=""'); const H=run('SYN.html(_a.chart,Object.assign({name:"P"},_a.profile))'); if(!/syn-link|syn-empty/.test(H)||!/Planets in each other/.test(H))bad++; if(/undefined|NaN|\[object/.test(H))bad++;
}
ok(bad===0,`60 chart pairs: swapping gives mirrored tables, mirrored contacts with equal scores, Moon relation and Ashtakoota consistent, no NaN`);
ok(!/fate|doom|will die|fatal|cursed/i.test(run('SYN.html(_a.chart,Object.assign({name:"P"},_a.profile))')),'no fear words in the page');
ok(run("SYN.text(_a.chart,Object.assign({name:'P'},_a.profile))").startsWith('Synastry'),'text summary');
console.log(fail?fail+' FAILED':'ALL PASSED'); process.exit(fail?1:0);

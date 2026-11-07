// node tests/chakra_explorer_test.js - Chakra Explorer (js/130): grid, ray geometry, Kota fort, Latta, Shoola, and a full render, without a browser
const vm=require('vm'),fs=require('fs'),path=require('path');
const base=path.join(__dirname,'..','apps','birth-chart','js')+'/'; const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx; vm.createContext(ctx);
const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','117-gulika.js','15-chart-core-compute.js','130-chakra-explorer.js']);
const run=s=>vm.runInContext(s,ctx); let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log('FAIL',m);} else console.log('ok  ',m); };

/* grid */
ok(run("CHX.grid.length===9&&CHX.grid.every(r=>r.length===9&&r.every(c=>c&&c.t))"),'9x9 grid has all 81 cells filled');
const cnt=t=>run(`CHX.grid.flat().filter(c=>c.t==='${t}').length`);
ok(cnt('k')===28,'28 nakshatra cells ('+cnt('k')+')'); ok(cnt('r')===12,'12 rashi cells'); ok(cnt('t')===5,'5 tithi-group cells');
ok(run("CHX.letters.filter(l=>l.vowel).length")===16,'16 vowels'); ok(run("CHX.letters.filter(l=>!l.vowel).length")===20,'20 consonants');
ok(run("new Set(Object.keys(CHX.pos)).size")===28,'every nakshatra has exactly one cell');
ok(run("CHX.grid[0][1].n===2&&CHX.grid[1][8].n===9&&CHX.grid[8][7].n===16&&CHX.grid[7][0].n===23"),'walls start Krittika (N), Magha (E), Anuradha (S), Dhanishta (W) as on the reference chart');
ok(run("[1,2,3].every((s,i)=>CHX.grid[2][3+i].s===s)&&CHX.grid[3][4].g===0&&CHX.grid[4][4].g===4&&CHX.grid[5][4].g===2"),'rashi ring starts Taurus at the top; Nanda above Purna above Jaya');
/* rays: top-wall planet */
const r=run("(()=>{const q=CHX.pos[3];const R=CHX.rays(q[0],q[1]);return JSON.stringify({q,sam:R.sam.length,sEnd:R.sam[R.sam.length-1],vEnd:R.vama[R.vama.length-1],dEnd:R.dak[R.dak.length-1]})})()");
const R=JSON.parse(r); /* Rohini = top wall, col 2 */
ok(R.q[0]===0&&R.q[1]===2,'Rohini sits on the top wall, column 2');
ok(R.sEnd[0]===8&&R.sEnd[1]===2,'straight ray from Rohini ends at the bottom wall, same column (Shravana)');
ok(R.vEnd[1]>2&&R.dEnd[1]<2,'forward diagonal leans toward the next wall clockwise (east), back diagonal toward the west');
/* the rays of every wall cell stay on the grid and the straight ray hits the opposite wall */
ok(run("Object.values(CHX.pos).every(([r,c])=>{const R=CHX.rays(r,c);const e=R.sam[R.sam.length-1];return R.sam.length===8&&((r===0&&e[0]===8)||(r===8&&e[0]===0)||(c===0&&e[1]===8)||(c===8&&e[1]===0))})"),'straight ray from all 28 wall cells reaches the opposite wall');
/* kota zones match the published lists */
const zones={Stambha:[4,11,18,25],Madhya:[3,5,10,12,17,19,24,26],Prakaara:[2,6,9,13,16,20,23,27],Bahya:[1,7,8,14,15,21,22,28]};
ok(Object.keys(zones).every(z=>zones[z].every(n=>run(`CHX.kotaInfo(${n}).zone`)===z)),'Kota zones equal the published Stambha / Madhya / Prakaara / Bahya lists');
ok([2,9,16,23].every(n=>run(`CHX.kotaInfo(${n}).way`)==='IN')&&[6,13,20,27].every(n=>run(`CHX.kotaInfo(${n}).way`)==='OUT')&&[4,11,18,25].every(n=>run(`CHX.kotaInfo(${n}).way`)==='STALL'),'Prakaara entry 2/9/16/23 = IN, exit 6/13/20/27 = OUT, pillars = STALL');
ok(run("new Set(Array.from({length:28},(_,i)=>CHX.kotaPos(i+1).join())).size")===28,'28 distinct Kota positions on the drawing');
/* 28-nakshatra mapping incl. Abhijit */
ok(run("CHX.nak28(278)")===21&&run("CHX.nak28(270)")===20&&run("CHX.nak28(282)")===22&&run("CHX.nak28(0.5)")===0&&run("CHX.nak28(359.9)")===27,'Abhijit window 276d40-280d53 maps to Abhijit; neighbours stay Uttara Ashadha / Shravana');

/* a real chart */
const chart=run("computeChart('1990-03-12','06:40',28.61,77.21,5.5)"); ctx._c=chart; ctx._p={name:'Test',lat:28.61,lon:77.21,tz:5.5};
const jd=run("toJulianDay(2026,11,7,1,13,0)-5.5/24"); ctx._jd=jd;
const D=run("CHX.compute(_c,_p,_jd)");
ok(D.pl.length===9&&D.pl.every(p=>p.n28>=0&&p.n28<=27&&p.n27>=0&&p.n27<=26),'nine planets placed in 28 / 27 nakshatra lists');
/* Latta: examples from the source (Sun at Mula kicks Krittika; Venus at Shravana kicks Jyeshtha) */
ok(run("(()=>{const L={Sun:[12,1],Venus:[5,-1]};const f=(n27,[c,d])=>(((n27+d*(c-1))%27)+27)%27;return f(18,L.Sun)===2&&f(21,L.Venus)===17})()"),'Latta count rule reproduces the two published examples');
ok(D.latta.length===9&&D.latta.every(L=>L.name&&L.t28>=0),'Latta computed for every planet');
/* the sky matches the app's own engine */
ok(D.pl.every(p=>Math.abs(p.lon-run(`getSiderealLongitudeAt('${p.name}',_jd)`))<1e-9),'planet longitudes equal getSiderealLongitudeAt');
ok(Math.abs(((D.pl.find(p=>p.name==='Ketu').lon-D.pl.find(p=>p.name==='Rahu').lon+360)%360)-180)<1e-6,'Ketu is exactly opposite Rahu');
ok(D.pl.find(p=>p.name==='Rahu').retro&&D.pl.find(p=>p.name==='Ketu').retro&&!D.pl.find(p=>p.name==='Sun').retro,'nodes retrograde, Sun not');
/* natal pillars come from the app's chart */
ok(D.nat.j27===chart.planets.Moon.nakshatra.index&&D.nat.pada===chart.planets.Moon.nakshatra.pada,'Janma Nakshatra and pada = the chart Moon');
ok(D.nat.swami===run("SIGNS[_c.planets.Moon.sign].lord"),'Kota Swami = lord of the Moon sign');
/* Kota: IN/OUT flip when retrograde */
ok(D.kota.rows.every(x=>x.base==='STALL'?x.way==='STALL':(x.p.retro?x.way!==x.base:x.way===x.base)),'retrograde planets (and nodes) reverse IN and OUT, pillar stays STALL');
ok(D.kota.rows.every(x=>x.n>=1&&x.n<=28),'every planet has a Kota number 1-28');
/* Shoola */
ok(D.shoola.tips.map(t=>t.n).join()==='9,15,21'&&D.shoola.rows.every(x=>x.n>=1&&x.n<=27),'Shoola tips at the 9th, 15th and 21st');
ok(run("CHX.compute(_c,_p,_jd,Object.assign({},CHX.state,{shoola:'sun'})).shoola.b27")===chart.planets.Sun.nakshatra.index,'Shoola can count from the natal Sun nakshatra');
/* Kota Paala override */
ok(run("CHX.compute(_c,_p,_jd,Object.assign({},CHX.state,{paala:'Saturn'})).nat.paala")==='Saturn'&&run("CHX.compute(_c,_p,_jd,Object.assign({},CHX.state,{paala:''})).nat.paalaSet")===false,'Kota Paala override works and automatic is flagged as not set');
/* render */
const H=run("CHX.html(_c,_p,_jd)");
ok(/Sarvatobhadra Chakra/.test(H)&&/Kota Chakra/.test(H)&&/Shoola/.test(H),'page has the three chakras');
ok((H.match(/<svg/g)||[]).length===3,'three drawings');
ok(!/undefined|NaN|\[object/.test(H),'no undefined / NaN / [object] in the output');
ok(/Janma Nakshatra/.test(H)&&/Kota Swami/.test(H)&&/spear-point/.test(H),'sections for Janma points, Kota lords and Shoola tips');
const H2=run("CHX.html(_c,_p,_jd,Object.assign({},CHX.state,{vara:true,latta:true,naam:'6,1'}))");
ok(!/undefined|NaN|\[object/.test(H2)&&/Latta kicks/.test(H2)&&/Sat/.test(H2),'weekday centre + Latta + Naam Akshara render cleanly');
ok(/Kota Paala/.test(H)&&/best guess/.test(H),'Kota Paala says it is a best guess');
/* every start moment across 3 charts and 60 random dates gives no error */
let bad=0; for(const [d,t,la,lo,tz] of [['1990-03-12','06:40',28.61,77.21,5.5],['1975-11-02','23:15',19.07,72.87,5.5],['2001-07-19','03:05',51.5,-0.12,1]]){
  ctx._c=run(`computeChart('${d}','${t}',${la},${lo},${tz})`); ctx._p={name:'x',lat:la,lon:lo,tz};
  for(let i=0;i<20;i++){ ctx._jd=2451545+((i*7919+la*100)%20000)-3000; try{ const h=run("CHX.html(_c,_p,_jd)"); if(/undefined|NaN|\[object/.test(h)) bad++; }catch(e){ bad++; console.log(e.message); } } }
ok(bad===0,'60 random moments over 3 charts render without error or NaN');
ok(run("typeof CHX.text(_c,_p,_jd)")==='string'&&run("CHX.text(_c,_p,_jd)").length>20,'text() summary works');
process.exit(fail?1:0);

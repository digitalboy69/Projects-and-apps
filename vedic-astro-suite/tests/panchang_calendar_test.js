// node tests/panchang_calendar_test.js - Panchang calendar (js/146): 2026 festivals vs drikpanchang (New Delhi), eclipses vs NASA, continuity, counts
const vm=require('vm'),fs=require('fs'),path=require('path');
const base=path.join(__dirname,'..','apps','birth-chart','js')+'/'; const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx; vm.createContext(ctx);
const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','117-gulika.js','15-chart-core-compute.js','27-date-finder-core.js','28-date-finder-engine.js','146-panchang-calendar.js']);
const run=s=>vm.runInContext(s,ctx); let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log('FAIL',m);} else console.log('ok  ',m); };
const LAT=28.6139,LON=77.209,TZ=5.5;
const M=(y,m,p)=>run(`PCAL.month(${y},${m},${LAT},${LON},${TZ},${p?'true':'false'})`);
const find=(D,name)=>D.filter(x=>x.fests.some(f=>f.includes(name))).map(x=>x.d).join();
/* drikpanchang.com/calendars/hindu/hinducalendar.html?year=2026 (New Delhi) */
ok(find(M(2026,1),'Makar Sankranti')==='14'&&find(M(2026,1),'Vasant Panchami')==='23','Jan 2026: Makar Sankranti 14, Vasant Panchami 23 (drikpanchang)');
ok(find(M(2026,2),'Maha Shivaratri')==='15','Feb 2026: Maha Shivaratri 15');
ok(find(M(2026,3),'Ugadi')==='19'&&find(M(2026,3),'Ram Navami')==='26','Mar 2026: Ugadi 19 (tithi begins after sunrise), Ram Navami 26 (Smarta)');
ok(find(M(2026,4),'Akshaya Tritiya')==='19','Apr 2026: Akshaya Tritiya 19 (tithi begins after sunrise)');
ok(find(M(2026,5),'Buddha Purnima')==='1','May 2026: Buddha Purnima 1');
ok(find(M(2026,7),'Guru Purnima')==='29','Jul 2026: Guru Purnima 29');
ok(find(M(2026,9),'Janmashtami')==='4'&&find(M(2026,9),'Ganesh Chaturthi')==='14','Sep 2026: Janmashtami 4, Ganesh Chaturthi 14');
const oct=M(2026,10); ok(find(oct,'Navaratri begins')==='11'&&find(oct,'Karwa Chauth')==='29'&&find(oct,'Dussehra').split(',').includes('20'),'Oct 2026: Navaratri 11, Dussehra includes 20, Karwa Chauth 29');
const nov=M(2026,11); ok(find(nov,'Dhanteras')==='6'&&find(nov,'Diwali (Lakshmi Puja)')==='8'&&find(nov,'Govardhan')==='10'&&find(nov,'Bhai Dooj')==='11'&&find(nov,'Dev Uthani')==='20','Nov 2026: Dhanteras 6, Diwali 8, Govardhan 10, Bhai Dooj 11, Dev Uthani Ekadashi 20 (tithi begins after sunrise)');
/* KNOWN DIFFERENCES from drikpanchang (documented in the plan Notes and flagged on the page as fragile): Holika Dahan (drik 3 Mar, app 2 Mar), Holi (drik 4 Mar, app 3 Mar), Raksha Bandhan (drik 28 Aug, app 27 Aug) */
const mar=M(2026,3), hol=mar.find(x=>x.fests.some(f=>f.includes('Holika')));
ok(hol&&hol.d===2&&hol.fragile,'known difference: Holika Dahan 2 Mar here vs 3 Mar in drikpanchang (Bhadra rule), flagged fragile');
const rk=M(2026,8).find(x=>x.fests.some(f=>f.includes('Raksha')));
ok(rk&&rk.d===27&&rk.fragile,'known difference: Raksha Bandhan 27 Aug here vs 28 Aug in drikpanchang (Bhadra), flagged fragile');
/* eclipses 2026 (NASA): annular solar Feb 17, total lunar Mar 3, total solar Aug 12, partial lunar Aug 28; none else */
const ec=[]; for(let m=1;m<=12;m++)M(2026,m).forEach(x=>{ if(x.solar)ec.push(`S ${x.m}-${x.d}`); if(x.lunar)ec.push(`L ${x.m}-${x.d}`); });
ok(ec.join('|')==='S 2-17|L 3-3|S 8-12|L 8-28','2026 eclipses match NASA exactly: '+ec.join(' '));
/* sankrantis, 12 a year, Makar 14 Jan and Mesha 14 Apr */
const sk=[]; for(let m=1;m<=12;m++)M(2026,m).forEach(x=>{ if(x.sankranti)sk.push(x.m+'-'+x.d+':'+x.sankranti); });
ok(sk.length===12,'12 sankrantis in 2026: '+sk.length); ok(sk.includes('1-14:Capricorn')&&sk.includes('4-14:Aries'),'Makar 14 Jan and Mesha 14 Apr');
ok(new Set(sk.map(x=>x.split(':')[1])).size===12,'all twelve signs entered once: '+sk.join(' '));
/* all 12 months: no empty day, tithi continuous, sunrises rising, counts */
let bad=[],ek=0,pu=0,am=0;
for(let y of [2025,2026]) for(let m=1;m<=12;m++){ const D=M(y,m), dim=new Date(Date.UTC(y,m,0)).getUTCDate();
  if(D.length!==dim)bad.push(['len',y,m]);
  D.forEach((x,i)=>{ if(!x.tithi||!x.nak||!x.masa||x.tithiIdx<0||x.tithiIdx>29||x.d!==i+1)bad.push(['empty',y,m,i+1]); if(i&&x.sunrise<=D[i-1].sunrise)bad.push(['sr',y,m,i+1]);
    if(i){ const dd=(x.tithiIdx-D[i-1].tithiIdx+30)%30; if(dd>2)bad.push(['tithi jump',y,m,i+1,dd]); }
    if(y===2026){ if(x.ekadashi)ek++; if(x.purnima)pu++; if(x.amavasya)am++; if(x.ekadashi&&x.tithiNum!==11)bad.push('ek'); } });
  if(m<12){ const N=M(y,m+1)[0], L=D[D.length-1]; const dd=(N.tithiIdx-L.tithiIdx+30)%30; if(dd>2)bad.push(['month join',y,m,dd]); } }
ok(bad.length===0,'24 months (2025, 2026): right length, no empty day, tithi sequence continuous (step 0 to 2) inside and across months, sunrises rising '+JSON.stringify(bad.slice(0,3)));
ok(ek>=22&&ek<=26&&pu>=11&&pu<=13&&am>=11&&am<=13,`2026 counts: Ekadashi ${ek}, Purnima ${pu}, Amavasya ${am}`);
/* adhika month 2026 (Jyeshtha) appears */
ok(M(2026,5).some(x=>x.adhika)||M(2026,6).some(x=>x.adhika),'the 2026 Adhika (extra) month is flagged in May/June');
/* purnimanta changes only the dark-half names */
const A=M(2026,11), P=M(2026,11,true); const diff=A.filter((x,i)=>x.masa!==P[i].masa);
ok(diff.length>0&&diff.every(x=>x.paksha==='Krishna'),'Purnimanta renames only Krishna paksha days');
/* speed and cache */
const t0=Date.now(); M(2027,3); const t1=Date.now()-t0; const t2=Date.now(); M(2027,3); ok(t1<3000&&Date.now()-t2<5,`one fresh month ${t1} ms, cached repeat instant`);
ok(!/undefined|NaN|\[object/.test(run('PCAL.html(null,{lat:28.6,lon:77.2,tz:5.5})')),'page html has no undefined/NaN');
run('PCAL.state.y=2026;PCAL.state.m=11'); ok(/8 .*Diwali/.test(run('PCAL.text(null,{lat:28.6139,lon:77.209,tz:5.5})')),'text() lists Diwali on 8 Nov 2026');
console.log(fail?fail+' FAILED':'ALL PASSED'); process.exit(fail?1:0);

// node tests/dasha_lens_test.js - Dasha Lens engine vs the app's own dasha engine (js/10), plus basic laws of the nesting
const vm=require('vm'),fs=require('fs'),path=require('path');const base=path.join(__dirname,'..','apps','birth-chart','js')+'/';const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx;vm.createContext(ctx);const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','15-chart-core-compute.js','16-rectification-engine.js','99-dasha-lens.js']);
const run=s=>vm.runInContext(s,ctx);let fail=0;const ok=(c,m)=>{if(!c){fail++;console.log('FAIL',m);}else console.log('ok  ',m);};
for (const [d,t,lat,lon,tz] of [['1990-03-12','06:40',28.61,77.21,5.5],['1975-11-02','23:15',19.07,72.87,5.5],['2001-07-19','03:05',51.5,-0.12,1]]){
  const ch=run(`computeChart('${d}','${t}',${lat},${lon},${tz})`), birth=Date.UTC(+d.slice(0,4),+d.slice(5,7)-1,+d.slice(8,10),+t.slice(0,2),+t.slice(3,5))-tz*3600000;
  ctx._c=ch; let bad=0, badDeep=0, n=0;
  for(let i=0;i<400;i++){ const ev=birth+Math.random()*95*365.25*86400000; ctx._e=ev;
    const a=run("(()=>{const x=findActiveDasha(_c.dashaData.mahadashas,new Date(_e));return [x.mahadasha.lord,x.antardasha.lord,x.pratyantardasha.lord,x.sookshmaDasha.lord,x.pranaDasha.lord].join()})()");
    const b=run(`DLENS.stack(_c.planets.Moon.longitude,${birth},_e,6).levels.map(l=>l.lord).slice(0,5).join()`); n++; if(a!==b) bad++;
    const st=run(`DLENS.stack(_c.planets.Moon.longitude,${birth},_e,6)`).levels;
    for(let k=1;k<6;k++){ if(!(st[k].start>=st[k-1].start-1e-3 && st[k].end<=st[k-1].end+1e-3)) badDeep++; }
    if(!(st[5].start<=ev && ev<st[5].end+1e-3)) badDeep++; }
  ok(bad===0,`${d}: levels 1-5 equal the app engine in ${n} random moments (${bad} differ)`); ok(badDeep===0,`${d}: every level sits inside its parent and the moment sits inside Deha`);
}
const ch=run("computeChart('1990-03-12','06:40',28.61,77.21,5.5)"); ctx._c=ch;
const st=run("DLENS.stack(_c.planets.Moon.longitude,Date.UTC(1990,2,12,6,40)-5.5*3600000,Date.UTC(2020,5,1,12,0,0),6)").levels;
const ch9=run("DLENS.children(DLENS.stack(_c.planets.Moon.longitude,Date.UTC(1990,2,12,6,40)-5.5*3600000,Date.UTC(2020,5,1,12,0,0),6).levels[0])");
ok(ch9.length===9 && Math.abs(ch9[8].end-st[0].end)<1,'the 9 sub-periods exactly fill the parent');
ctx._lords=st.map(l=>l.lord);
const lenOK=run("(()=>{const Y=365.25*86400000;let e=DASHA_YEARS[_lords[0]]*Y;const out=[];for(let k=0;k<6;k++){if(k>0)e=e*DASHA_YEARS[_lords[k]]/120;out.push(e);}return out})()");
ok(st.every((l,k)=>Math.abs((l.end-l.start)-lenOK[k])<5),'every level length = Mahadasha years x product of (lord years/120) per level (Prana '+run(`DLENS.dur(${st[4].end-st[4].start})`)+', Deha '+run(`DLENS.dur(${st[5].end-st[5].start})`)+')');
ok(run("DLENS.dur(3725000)")==='1h 2m 5s' && run("DLENS.dur(45000)")==='45s','duration text');

/* ---- Known moments parser + mismatch calculator core ---- */
const P=(l)=>run(`JSON.stringify(DLENS.parse(${JSON.stringify(l)}))`);
ok(P('2004-04-15 12:30:00 Marriage')===JSON.stringify({date:'2004-04-15',time:'12:30:00',label:'Marriage'}),'parser: ISO line with label');
ok(P('15/08/2010 09:05 First job')===JSON.stringify({date:'2010-08-15',time:'09:05:00',label:'First job'}),'parser: DD/MM/YYYY, seconds optional');
ok(P('2018-02-30 10:00')==='null' && P('hello')==='null' && P('2018-01-01 25:00')==='null','parser rejects impossible dates, junk and bad times');
const pr={lat:28.61,lon:77.21,tz:5.5}, date='1990-03-12', time='06:40:00';
const r0=run(`rectifyPoint('${date}','${time}',${pr.lat},${pr.lon},${pr.tz})`);
ctx._bi={moonLon:r0.moon.longitude,birthMs:(r0.jd-2440587.5)*86400000,date,time}; ctx._pr=pr; ctx._ev=Date.UTC(2020,5,1,12,0,0);
const sh=e=>run(`(()=>{const r=DLENS.shift(_bi,_pr,_ev,${e});return {same:r.same,ms:r.shiftMs}})()`);
const a1=sh(60), a2=sh(120), am=sh(-60);
ok(a1.same&&Math.abs(a2.ms/a1.ms-2)<0.02,'timeline shift is proportional to the birth error (60s -> '+run(`DLENS.durFull(${a1.ms})`)+', 120s -> '+run(`DLENS.durFull(${a2.ms})`)+')');
ok(Math.sign(am.ms)===-Math.sign(a1.ms) && Math.abs(am.ms+a1.ms)<0.03*Math.abs(a1.ms),'earlier error shifts the opposite way by about the same amount');
ok(Math.abs(a1.ms)>86400e3 && Math.abs(a1.ms)<20*86400e3,'1 minute of birth error moves the dasha dates by days, not hours or years');
const slope=a1.ms/60, target=-3*3600e3, e1=target/slope, chk=sh(e1);
const chk2=sh(Math.round(e1));
ok(Math.abs(chk2.ms-target)<=Math.abs(slope),'wanted shift of 3 h earlier -> '+Math.round(e1)+' s of birth change gives '+run(`DLENS.durFull(${chk2.ms})`)+' (1 s of birth time = '+run(`DLENS.durFull(${Math.abs(slope)})`)+', so the answer is within one second)');
const mg=run("(()=>{const m=DLENS.margin(_bi,_pr);return {later:m.later,earlier:m.earlier}})()");
ok(mg.later>0&&mg.earlier>0&&sh(mg.later*0.9).same===true&&sh(mg.later*1.1+5).same===false,'safe margin is exact: inside it the dasha lord stays, just past it the Moon changes nakshatra ('+run(`DLENS.durFull(${mg.later*1000})`)+' later / '+run(`DLENS.durFull(${mg.earlier*1000})`)+' earlier)');
ok(run("DLENS.durFull(2*86400000+9*3600000+36*60000+12000)")==='2 d 9 h 36 min 12 s','full duration text');
/* ---- the main Vimshottari engine (js/10) now has the 6th level, Deha: it must agree with the lens ---- */
{ const ch2=run("computeChart('1975-11-02','23:15',19.07,72.87,5.5)"), b2=Date.UTC(1975,10,2,23,15)-5.5*3600000; ctx._c=ch2; let bad6=0, none=0;
  for(let i=0;i<500;i++){ ctx._e=b2+Math.random()*90*365.25*86400000;
    const m=run("(()=>{const x=findActiveDasha(_c.dashaData.mahadashas,new Date(_e));return x.dehaDasha?[x.dehaDasha.lord,x.dehaDasha.startDate.getTime(),x.dehaDasha.endDate.getTime(),x.allDehaDashas.length]:null})()");
    const l=run(`(()=>{const d=DLENS.stack(_c.planets.Moon.longitude,${b2},_e,6).levels[5];return [d.lord,d.start,d.end]})()`);
    if(!m){none++;continue;} if(m[0]!==l[0]||Math.abs(m[1]-l[1])>50||Math.abs(m[2]-l[2])>50||m[3]!==9){ bad6++; if(process.env.DEBUG) console.log('   differ at age',((ctx._e-b2)/(365.25*86400000)).toFixed(6),'y; main',m[0],m[3],'siblings; lens',l[0],'start diff ms',m[1]-l[1],'end diff ms',m[2]-l[2]); } }
  ok(none===0,'findActiveDasha returns a Deha period for every moment'); ok(bad6===0,'main engine Deha (lord, start, end, 9 siblings) equals the Dasha Lens in 500 random moments ('+bad6+' differ)'); }
console.log(fail?'FAILED '+fail:'ALL PASSED');process.exit(fail?1:0);

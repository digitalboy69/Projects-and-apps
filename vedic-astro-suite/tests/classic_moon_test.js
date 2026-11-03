// CLASSIC Moon (default, no delta-T): the user's reference chart gives exactly the Dasha dates the user trusts (Node).
// Chart: 2007-11-11 02:23 IST (UTC+5:30), 16.7747 N, 78.1315 E. Reference: Mahadasha Mercury 6 Dec 2025 02:16 -> 6 Dec 2042 08:16 etc. (IST).
const vm=require('vm'),fs=require('fs'),path=require('path');const base=path.join(__dirname,'..','apps','birth-chart','js')+'/';const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx;vm.createContext(ctx);const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','15-chart-core-compute.js','16-rectification-engine.js']);
const run=s=>vm.runInContext(s,ctx);let fail=0;const ok=(c,m)=>{if(!c){fail++;console.log('FAIL',m);}else console.log('ok  ',m);};
const c=run(`computeChart('2007-11-11','02:23',16.7747,78.1315,5.5)`); ctx.__c=c;
const fmt=d=>{const t=new Date(d.getTime()+19800000); const M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; const p=n=>String(n).padStart(2,'0'); return `${t.getUTCDate()} ${M[t.getUTCMonth()]} ${t.getUTCFullYear()} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}`;};
ctx.__fmt=fmt;
const a=run(`findActiveDasha(__c.dashaData.mahadashas,new Date(Date.UTC(2026,10,3,21,8,0)))`);   // 4 Nov 2026 02:38 IST
const row=(x)=>x.lord+' '+fmt(x.startDate)+' -> '+fmt(x.endDate);
const want={Maha:'Mercury 6 Dec 2025 02:16 -> 6 Dec 2042 08:16',Antar:'Mercury 6 Dec 2025 02:16 -> 3 May 2028 17:43',Pratyantar:'Sun 24 Oct 2026 15:08 -> 7 Dec 2026 14:43',Sookshma:'Rahu 2 Nov 2026 01:27 -> 8 Nov 2026 15:48',Prana:'Saturn 3 Nov 2026 22:19 -> 4 Nov 2026 23:23'};
const got={Maha:row(a.mahadasha),Antar:row(a.antardasha),Pratyantar:row(a.pratyantardasha),Sookshma:row(a.sookshmaDasha),Prana:row(a.pranaDasha)};
for(const k in want) ok(got[k]===want[k],k+': '+got[k]+(got[k]===want[k]?'':'   (wanted '+want[k]+')'));
ok(run('EPH_DELTA_T')===false,'classic mode is the default');
ok(Math.abs(c.planets.Moon.longitude-213.9861)<0.001,'Moon 3 deg 59 min Scorpio, Anuradha pada 1 ('+c.planets.Moon.longitude.toFixed(4)+')');
console.log(fail?'FAILED '+fail:'ALL PASSED'); process.exit(fail?1:0);

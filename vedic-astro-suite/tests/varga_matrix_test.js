// node tests/varga_matrix_test.js - Varga Matrix (js/153): cells vs chart.vargas, dignity points, Vargottama, sets, ranking, render
const vm=require('vm'),fs=require('fs'),path=require('path');
const base=path.join(__dirname,'..','apps','birth-chart','js')+'/'; const noop=()=>{};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,performance,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({style:{}}),body:{},documentElement:{}},navigator:{},location:{hash:''},addEventListener:noop,requestAnimationFrame:noop};
ctx.window=ctx; vm.createContext(ctx);
const load=a=>a.forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
load(['01-dev-contact.js','02-app-meta-layer.js','03-ephemeris-engine.js','04-transit-timing-engine.js','05-ascendant-nakshatra-vargas.js','06-outer-planet-knowledge.js','07-planetary-dignity.js','08-combustion-and-war.js','09-aspect-events.js','10-vimshottari-dasha-engine.js','11-ashtakavarga-engine.js','12-yoga-detection.js','13-chara-karakas.js','14-shadbala-engine.js','45-panchanga-engine.js','117-gulika.js','15-chart-core-compute.js','134-avasthas.js','17-special-lagnas.js','140-bhavat-bhavam.js','153-varga-matrix.js']);
const run=s=>vm.runInContext(s,ctx); let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log('FAIL',m);} else console.log('ok  ',m); };
const G=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
ctx._c=run('computeChart("2000-01-01","06:30",28.61,77.21,5.5)');
ok(run('VMX.keysFor(_c,"sapta").join()')==='D1,D2,D3,D7,D9,D12,D30','sapta set keys');
ok(run('VMX.keysFor(_c,"shodasha").length')===16,'shodasha has 16 charts');
ok(run('VMX.keysFor(_c,"all").length')===Object.keys(ctx._c.vargas).length,'all set = every chart in the data');
/* each cell equals the raw varga data */
let bad=0;
for(const k of Object.keys(ctx._c.vargas)){ for(const p of G){ const c=run(`VMX.cellOf(_c,"${k}","${p}")`); let raw=null; ctx._c.vargas[k].houses.forEach(h=>h.planets.forEach(x=>{if(x.name===p)raw={sign:h.sign,house:h.houseNum,st:(x.dignity&&x.dignity.status)||'Neutral'};})); if(!!c!==!!raw||(c&&(c.sign!==raw.sign||c.house!==raw.house||c.status!==raw.st))) bad++; } }
ok(bad===0,'every cell equals the raw divisional data for all charts and planets');
const PT={Exalted:2,OwnSign:2,Moolatrikona:2,Friend:1,Neutral:0,Enemy:-1,Debilitated:-2};
const M=run('VMX.compute(_c,"shodasha")');
ok(M.rows.length===16&&M.rows.every(r=>r.cells.length===9),'16 rows x 9 planet cells');
ok(M.ranked.length===9||M.ranked.length===7,'ranked planets present (9, or 7 when nodes are absent)');
let okp=true; for(const p of G){ const s=M.per[p]; let pts=0,n=0,good=0; M.rows.forEach(r=>{const c=r.cells[G.indexOf(p)]; if(c){n++;pts+=PT[c.status];if(PT[c.status]>=1)good++;}}); if(s.n!==n||s.pts!==pts||s.good!==good) okp=false; }
ok(okp,'per-planet points, count and good-count recomputed by hand');
ok(M.ranked.every((s,i,a)=>i===0||(a[i-1].pts/a[i-1].n)>=(s.pts/s.n)),'ranking is sorted best to worst');
const vot=G.filter(p=>{const a=run(`VMX.cellOf(_c,"D1","${p}")`),b=run(`VMX.cellOf(_c,"D9","${p}")`);return a&&b&&a.sign===b.sign;});
ok(vot.join()===M.vot.join(),'Vargottama list = same sign in D1 and D9');
ok(M.strong===G.reduce((s,p)=>s+M.per[p].ex+M.per[p].ow,0)&&M.weak===G.reduce((s,p)=>s+M.per[p].de,0),'strong and weak spot totals');
const d=run('VMX.detail(_c,"D9","Mars")');
ok(d&&d.title==='Mars in D9 Navamsa'&&d.lagnaName===run('SIGNS[_c.vargas.D9.ascendantSign].name'),'detail title and lagna name');
ok(run('VMX.detail(_c,"D9","Mars")').c.house>=1&&run('VMX.detail(_c,"D9","Mars")').c.house<=12,'detail house in 1..12');
/* 60 real charts */
let b2=0,why=[];
for(let i=0;i<60;i++){
  const dt=new Date(Date.UTC(1950+(i*7)%70,(i*5)%12,1+(i*11)%28)).toISOString().slice(0,10);
  ctx._c=run(`computeChart('${dt}','${String(i%24).padStart(2,'0')}:${String((i*13)%60).padStart(2,'0')}',${10+(i%40)},${70+(i%30)},5.5)`);
  for(const id of ['sapta','shodasha','all']){
    const S=run(`VMX.html(_c)`); 
    const MM=run(`VMX.compute(_c,"${id}")`);
    if(MM.rows.length!==run(`VMX.keysFor(_c,"${id}")`).length){b2++;why.push('rows');}
    MM.rows.forEach(r=>{ if(r.lagna!==ctx._c.vargas[r.key].ascendantSign){b2++;why.push('lagna');} r.cells.forEach((c,j)=>{ if(c&&(c.sign<0||c.sign>11||c.house<1||c.house>12)){b2++;why.push('range');} }); });
    if(/undefined|NaN|\[object/.test(S)){b2++;why.push('html-bad');}
    if(/fatal|doom|cursed|will die/i.test(S)){b2++;why.push('fear');}
  }
  const S2=run('VMX.html(_c)');
  if((S2.match(/class="vmx-c /g)||[]).length<16*7){b2++;why.push('cells');}
  const T=run('VMX.text(_c)'); if(T.split('\n').length!==16||/undefined/.test(T)){b2++;why.push('text');}
}
ok(b2===0,'60 real charts x 3 sets: rows, lagna, ranges, html clean, no fear words'+(b2?' '+why.slice(0,6).join(','):''));
process.exit(fail?1:0);

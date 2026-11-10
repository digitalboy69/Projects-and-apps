// node tests/tools_hub_test.js - Tools hub (js/147): every tool listed exactly once, groups, search words, recents
const vm=require('vm'),fs=require('fs'),path=require('path');
const base=path.join(__dirname,'..','apps','birth-chart','js')+'/';
const store={}; const ctx={console,JSON,Math,localStorage:{getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v);}}};
ctx.window=ctx; vm.createContext(ctx);
const s25=fs.readFileSync(base+'25-home-and-tabs.js','utf8'); const a=s25.indexOf('const HOME_ITEMS=['), b=s25.indexOf('];',a)+2;
vm.runInContext(s25.slice(a,b),ctx); vm.runInContext(fs.readFileSync(base+'147-tools-hub.js','utf8'),ctx,{filename:'147'});
const run=s=>vm.runInContext(s,ctx); let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log('FAIL',m);} else console.log('ok  ',m); };

const ids=run('HOME_ITEMS.map(i=>i[0])'), G=run('THB.groups()');
const listed=[].concat(...G.map(g=>g.items.map(i=>i[0])));
ok(ids.length>=54,'HOME_ITEMS has '+ids.length+' tools');
ok(listed.length===ids.length&&new Set(listed).size===ids.length,'every tool is listed exactly once ('+listed.length+')');
ok(ids.every(i=>listed.includes(i)),'no tool is missing from the Tools tab');
ok(!G.some(g=>g.id==='more'),'no tool falls into "More tools" today (every one has a proper group)');
ok(run('THB.CATS.every(c=>c[4].every(id=>HOME_ITEMS.some(i=>i[0]===id)))'),'every id named in a group exists in HOME_ITEMS (no stale names)');
ok(G.every(g=>g.items.length>0&&g.title&&g.use),'every group has a title, a one-line use and tools');
ok(G.length===9,'nine groups');
/* a new tile added later is not lost */
run("HOME_ITEMS.push(['panel-zzz','★','Zed Tool','A brand new tool','Analysis','home'])");
const G2=run('THB.groups()'); ok(G2[G2.length-1].id==='more'&&G2[G2.length-1].items[0][0]==='panel-zzz','a new Home tile appears under "More tools" automatically');
ok(run("THB.search('zed').length")===1,'and can be searched'); run('HOME_ITEMS.pop()');
/* search */
const top=q=>{const r=run(`THB.search(${JSON.stringify(q)})`); return r?r.map(x=>x.item[0]):null;};
ok(top('')===null,'empty search returns null (show all groups)');
ok(top('marriage').includes('panel-match')&&top('marriage').includes('panel-synastry'),'"marriage" finds Kundali Matching and Synastry');
ok(top('today')[0]==='panel-today','"today" ranks Today for You first');
ok(top('festival').includes('panel-pcal'),'"festival" finds the Panchang Calendar');
ok(top('birth time').includes('panel-rectification'),'"birth time" finds Rectification');
ok(top('forgot').includes('panel-datefinder'),'"forgot" finds the Date Finder'); 
ok(top('sade sati').includes('panel-transits'),'"sade sati" finds Transits');
ok(top('strength').length>=4,'"strength" finds the strength tools');
ok(top('kundli').includes('panel-overview'),'"kundli" finds Overview');
ok(top('zzzzqq').length===0,'nonsense finds nothing');
ok(top('MARRIAGE').includes('panel-match'),'search ignores case');
ok(top('  match   ').includes('panel-match'),'search ignores extra spaces');
/* every tool can be found by its own title */
const bad=ids.filter(id=>{const t=run(`HOME_ITEMS.find(i=>i[0]==='${id}')[2]`); const r=top(t); return !r||!r.includes(id);});
ok(bad.length===0,'every tool is found by typing its own title '+JSON.stringify(bad));
/* recents */
ok(run('THB.recent().length')===0,'no recents at first');
run("THB.remember('panel-dasha');THB.remember('panel-today');THB.remember('panel-dasha')");
ok(run("THB.recent().join()")==='panel-dasha,panel-today','recents: newest first, no duplicates');
run("THB.remember('panel-export');THB.remember('panel-contact');THB.remember('panel-nope')");
ok(run("THB.recent().join()")==='panel-dasha,panel-today','Export, Contact and unknown ids are not remembered');
for(const id of ['panel-reading','panel-yogas','panel-kp','panel-atlas','panel-numerology']) run(`THB.remember('${id}')`);
ok(run('THB.recent().length')===4,'at most four recents shown');
/* quick access: the four owner-chosen cards */
ok(run("THB.QUICK.map(q=>q[0]).join()")==='panel-vargas,panel-dasha,panel-reading,panel-ashtakavarga','quick access cards: Divisional Charts, Vimshottari Dasha, Reading, Ashtakavarga (in that order)');
ok(run("THB.QUICK.every(q=>HOME_ITEMS.some(i=>i[0]===q[0]))"),'every quick card points to a real tool');
{ const h=run('THB.html()'); const iR=h.indexOf('Recently used'), iQ=h.indexOf('Quick access'), iG=h.indexOf('Read my chart<em>'); ok(iR>=0&&iR<iQ&&iQ<iG,'order: Recently used, then Quick access, then the groups'); ok((h.match(/class="th-q4"/g)||[]).length===4,'four quick cards'); }
run("THB.state.cat='fix'"); ok(!/Quick access/.test(run('THB.html()')),'quick cards hide when a group chip is chosen'); run("THB.state.cat='all'");
/* html */
const H=run('THB.html()'); ok(!/undefined|NaN|\[object/.test(H),'page html has no undefined/NaN');
ok((H.match(/class="th-r"/g)||[]).length===ids.length+4,'html has one row per tool plus the four recents (quick cards are separate)');
console.log(fail?fail+' FAILED':'ALL PASSED'); process.exit(fail?1:0);

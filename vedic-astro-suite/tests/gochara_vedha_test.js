// node tests/gochara_vedha_test.js - Gochara vedha (js/142): pair tables, exceptions, check() logic
const vm=require('vm'),fs=require('fs'),path=require('path');
const ctx={console}; ctx.window=ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','apps','birth-chart','js','142-gochara-vedha.js'),'utf8'),ctx,{filename:'142'});
const run=s=>vm.runInContext(s,ctx); let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log('FAIL',m);} else console.log('ok  ',m); };

/* favourable sets must equal the ones Today for You already uses (js/122) and the sources' sets */
const SETS={Sun:[3,6,10,11],Moon:[1,3,6,7,10,11],Mars:[3,6,11],Mercury:[2,4,6,8,10,11],Jupiter:[2,5,7,9,11],Venus:[1,2,3,4,5,8,9,11,12],Saturn:[3,6,11]};
Object.keys(SETS).forEach(p=>ok(run(`Object.keys(GVD.PAIRS.${p}).map(Number).sort((a,b)=>a-b).join()`)===SETS[p].join(),p+': favourable houses as published'));
/* vedha sets as printed by webastrologers/astrogurukul (list form) */
const VSET={Sun:[4,5,9,12],Moon:[2,4,5,8,9,12],Mars:[5,9,12],Mercury:[1,3,5,8,9,12],Jupiter:[3,4,8,10,12],Saturn:[5,9,12]};
Object.keys(VSET).forEach(p=>ok(run(`Object.values(GVD.PAIRS.${p}).sort((a,b)=>a-b).join()`)===VSET[p].join(),p+': vedha houses equal the printed list'));
ok(run("Object.values(GVD.PAIRS.Venus).sort((a,b)=>a-b).join()")==='1,3,5,6,7,8,9,10,11','Venus: nine distinct vedha houses (1,3,5,6,7,8,9,10,11)');
/* every pair is one-to-one inside a planet and a vedha house is never the same as its own favourable house */
let bad=0; const P=run('GVD.PAIRS'); Object.keys(P).forEach(p=>{const v=Object.values(P[p]); if(new Set(v).size!==v.length)bad++; Object.entries(P[p]).forEach(([h,x])=>{if(+h===x)bad++;});});
ok(bad===0,'each vedha house is paired once per planet and never equals its own house');
/* the spot checks from the plan: two sources for Saturn and Jupiter (jagannathhora) */
ok(run("GVD.PAIRS.Saturn[3]===12&&GVD.PAIRS.Saturn[6]===9&&GVD.PAIRS.Saturn[11]===5"),'Saturn 3-12, 6-9, 11-5');
ok(run("GVD.PAIRS.Jupiter[2]===12&&GVD.PAIRS.Jupiter[5]===4&&GVD.PAIRS.Jupiter[7]===3&&GVD.PAIRS.Jupiter[9]===10&&GVD.PAIRS.Jupiter[11]===8"),'Jupiter 2-12, 5-4, 7-3, 9-10, 11-8');
ok(run("GVD.PAIRS.Mercury[10]")===8,'Mercury 10th pairs with 8 (three sources; vedastro prints 7, flagged)');

const C=h=>run(`GVD.check(${JSON.stringify(h)})`);
/* blocked: Mars in 3 (good), Jupiter in 12 (its vedha) -> blocked by Jupiter */
let r=C({Sun:1,Moon:2,Mars:3,Mercury:1,Jupiter:12,Venus:1,Saturn:1});
ok(r.Mars.favourable&&r.Mars.vedhaHouse===12&&r.Mars.blockedBy.join()==='Jupiter','Mars 3rd is blocked by Jupiter in the 12th');
/* not favourable: Mars in 4 gives no vedha result */
r=C({Sun:1,Moon:2,Mars:4,Mercury:1,Jupiter:12,Venus:1,Saturn:1});
ok(!r.Mars.favourable&&r.Mars.blockedBy.length===0&&r.Mars.vedhaHouse===null,'a planet in an unfavourable house is never reported as blocked');
/* exceptions, both directions */
r=C({Sun:3,Moon:2,Mars:1,Mercury:1,Jupiter:1,Venus:1,Saturn:9});
ok(r.Sun.favourable&&r.Sun.vedhaHouse===9&&r.Sun.blockedBy.length===0,'Sun 3rd with Saturn in the 9th: no vedha (Sun and Saturn exempt)');
r=C({Sun:12,Moon:2,Mars:1,Mercury:1,Jupiter:1,Venus:1,Saturn:3});
ok(r.Saturn.vedhaHouse===12&&r.Saturn.blockedBy.length===0,'Saturn 3rd with the Sun in the 12th: no vedha (exempt the other way)');
r=C({Sun:1,Moon:3,Mars:1,Mercury:9,Jupiter:1,Venus:1,Saturn:1});
ok(r.Moon.vedhaHouse===9&&r.Moon.blockedBy.length===0,'Moon 3rd with Mercury in the 9th: no vedha (Moon and Mercury exempt)');
r=C({Sun:1,Moon:9,Mars:1,Mercury:4,Jupiter:1,Venus:1,Saturn:1});
ok(r.Mercury.vedhaHouse===3&&r.Mercury.blockedBy.length===0,'Mercury 4th: nothing in the 3rd');
r=C({Sun:1,Moon:3,Mars:1,Mercury:4,Jupiter:1,Venus:1,Saturn:1});
ok(r.Mercury.vedhaHouse===3&&r.Mercury.blockedBy.length===0,'Mercury 4th with the Moon in the 3rd: Moon is exempt, so not blocked');
/* a planet is never its own blocker; two blockers are both named */
r=C({Sun:1,Moon:1,Mars:3,Mercury:12,Jupiter:12,Venus:1,Saturn:1});
ok(r.Mars.blockedBy.join()==='Mercury,Jupiter','two planets in the vedha house are both listed');
r=C({Sun:6,Moon:1,Mars:1,Mercury:1,Jupiter:1,Venus:1,Saturn:1});
ok(r.Sun.vedhaHouse===12&&r.Sun.blockedBy.length===0,'Sun alone is never blocked by itself');
/* text() and note() */
ok(/none of the favourable/.test(run("GVD.text({Sun:6,Moon:1,Mars:1,Mercury:1,Jupiter:1,Venus:1,Saturn:1})")),'text(): none blocked');
ok(/Jupiter in the 12th holds back Mars's good 3rd/.test(run("GVD.text({Sun:1,Moon:2,Mars:3,Mercury:1,Jupiter:12,Venus:1,Saturn:1})")),'text(): names the blocker');
ok(!/fate|doom|will die|fatal|cursed/i.test(run("GVD.text({Sun:1,Moon:2,Mars:3,Mercury:1,Jupiter:12,Venus:1,Saturn:1})")),'no fear words');
/* nodes ignored */
r=C({Sun:1,Moon:1,Mars:3,Mercury:1,Jupiter:1,Venus:1,Saturn:1,Rahu:12});
ok(r.Mars.blockedBy.length===0&&!('Rahu' in r),'Rahu in the vedha house does not block; nodes are not subjects');
console.log(fail?fail+' FAILED':'ALL PASSED'); process.exit(fail?1:0);

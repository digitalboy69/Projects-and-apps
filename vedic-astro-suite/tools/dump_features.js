// node tools/dump_features.js > json : tools list (HOME_ITEMS), Tools-hub groups (THB.CATS), Feature Guide data (FG_DATA); used by tools/gen_all_features.py
const vm=require('vm'),fs=require('fs'),path=require('path');
const base=path.join(__dirname,'..','apps','birth-chart','js')+'/';
const store={}; const ctx={console,JSON,Math,localStorage:{getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v);}}};
ctx.window=ctx; vm.createContext(ctx);
const s25=fs.readFileSync(base+'25-home-and-tabs.js','utf8'); const a=s25.indexOf('const HOME_ITEMS=['), b=s25.indexOf('];',a)+2;
vm.runInContext(s25.slice(a,b),ctx);
['147-tools-hub.js','149-feature-guide-data.js'].forEach(f=>vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f}));
const run=s=>vm.runInContext(s,ctx);
console.log(JSON.stringify({items:run('HOME_ITEMS'),cats:run('THB.CATS.map(c=>[c[0],c[1],c[2],c[4]])'),fg:run('FG_DATA')}));

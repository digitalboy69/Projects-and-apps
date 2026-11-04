const fs=require('fs'),vm=require('vm'),path=require('path');
const ctx={console,localStorage:{getItem(){return null},setItem(){},removeItem(){}},sessionStorage:{getItem(){return null},setItem(){},removeItem(){}},document:{getElementById(){return null}},window:{},setTimeout,Date,Math};
vm.createContext(ctx);
const d=path.join(__dirname,'..','apps','birth-chart','js');
for(const f of fs.readdirSync(d).filter(f=>/^(03-|05-|10-|126-)/.test(f)).sort()){vm.runInContext(fs.readFileSync(path.join(d,f),'utf8'),ctx,{filename:f});}
(async()=>{
const tz=5.5, jd0=vm.runInContext('toJulianDay(2007,11,11,0,0,0)',ctx)-tz/24;
const ev=new Date(Date.UTC(2026,10,3,21,8,0));
ctx.jd0=jd0;ctx.ev=ev;
const run=async want=>{ctx.want=want;return vm.runInContext('drevSearch({birthJD0:jd0,eventDate:ev,want,fromSec:0,toSec:86399})',ctx);};
let fail=0;const ck=(n,c)=>{console.log(c?'ok  ':'FAIL',n);if(!c)fail++;};
const full=await run(['Mercury','Mercury','Sun','Rahu','Saturn',null]);
const t=2*3600+23*60;
ck('full chain: some window',full.runs.length>0);
ck('window contains 02:23:00',full.runs.some(r=>r.start<=t&&t<=r.end));
const deha=await run(['Mercury','Mercury','Sun','Rahu','Saturn','Mercury']);
ck('with Deha contains 02:23:00',deha.runs.some(r=>r.start<=t&&t<=r.end));
const maha=await run(['Mercury',null,null,null,null,null]);
ck('maha only wider',maha.runs.some(r=>r.start<=t&&t<=r.end));
const bad=await run(['Venus','Mercury','Sun','Rahu','Saturn',null]);
ck('wrong chain has no 02:23',!bad.runs.some(r=>r.start<=t&&t<=r.end));
console.log(JSON.stringify(full.runs.map(r=>[r.start,r.end])),'step',full.step);
process.exit(fail?1:0);})();

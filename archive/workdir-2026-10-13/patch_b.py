s=open('srcB.html',encoding='utf-8').read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old); assert n==cnt,(n,old[:60]); s=s.replace(old,new)
rep('const EARTH_ELEMENTS = {a:1.000001','''Object.assign(PLANET_ELEMENTS,{
  uranus:{a:19.18797948,e:0.04685740,i:0.77298127,L:313.23810451,Lrate:428.48202785,peri:170.95427630,periRate:0.40805281,node:74.01692503,nodeRate:0.04240589},
  neptune:{a:30.06952752,e:0.00895439,i:1.77005520,L:-55.12002969,Lrate:218.45945325,peri:44.96476227,periRate:-0.32241464,node:131.78422574,nodeRate:-0.00508664},
  pluto:{a:39.48686035,e:0.24885238,i:17.14104260,L:238.96535011,Lrate:145.18042903,peri:224.09702598,periRate:-0.04062942,node:110.30167986,nodeRate:-0.01183482}
});
const EARTH_ELEMENTS = {a:1.000001''')
rep('const PLANET_LIST = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"];','''const PLANET_LIST = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"];
// Outer (trans-Saturnian) planets: plotted on the charts and listed, but kept out of the classical Vedic engines.
const OUTER_LIST = ["Uranus","Neptune","Pluto"];
const OUTER_GLYPHS = {Uranus:"♅",Neptune:"♆",Pluto:"♇"};
const OUTER_COL = {Uranus:"#7DE3E0",Neptune:"#5B7CFA",Pluto:"#C9A38A"};
const OUTER_SK = {Uranus:"Prajapati",Neptune:"Varuna",Pluto:"Yama"};
window.__showOuter = true;''')
# computeChart
rep('''    vargaResults[key] = { ascendantSign: ascVargaSign, houses, planetVargaSign };
  }
''','''    vargaResults[key] = { ascendantSign: ascVargaSign, houses, planetVargaSign };
  }
  const outer = {};
  OUTER_LIST.forEach(n=>{
    const k = n.toLowerCase(), l = normDeg(planetGeocentricLongitude(k,jd) - ayanamsa), sg = getSignIndex(l);
    const rx = isRetrograde(k,jd);
    outer[n] = { name:n, longitude:l, sign:sg, degInSign:getDegInSign(l), house:((sg-ascSignIdx+12)%12)+1, nakshatra:getNakshatra(l), retrograde:rx };
    for (const vk in vargaResults){ const V = vargaResults[vk]; (V.outerSign = V.outerSign || {})[n] = calcVarga(vk, l); (V.outerRx = V.outerRx || {})[n] = rx; }
  });
''')
rep('    planets, vargas: vargaResults, siderealLongitudes, wars,','    planets, outer, vargas: vargaResults, siderealLongitudes, wars,')
rep("  return { ascendantSign: lagnaSignIdx, houses, planetVargaSign };\n}","  const V0 = chart.vargas[vargaKey];\n  return { ascendantSign: lagnaSignIdx, houses, planetVargaSign, outerSign: V0.outerSign, outerRx: V0.outerRx };\n}")
# drawing helpers
rep("const PCOL={Sun:'#F4A340'","const PCOL={Uranus:'#7DE3E0',Neptune:'#5B7CFA',Pluto:'#C9A38A',Sun:'#F4A340'")
rep("PLANET_LIST.forEach(n=>{inf[n]=inf[n]||{st:'',rx:false};inf[n].vg=","chOuter(v).forEach(n=>{inf[n]={st:'',rx:!!(v.outerRx&&v.outerRx[n]),vg:false};});\n  PLANET_LIST.forEach(n=>{inf[n]=inf[n]||{st:'',rx:false};inf[n].vg=")
rep("function chMeta(v){","function chOuter(v){return (window.__showOuter!==false&&v&&v.outerSign)?OUTER_LIST:[];}\nfunction chMeta(v){")
rep("${PLANET_GLYPHS[n]}</text>${i.rx?","${PLANET_GLYPHS[n]||OUTER_GLYPHS[n]}</text>${i.rx?")
# builders: north + west (house keyed), south (sign keyed)
a="PLANET_LIST.forEach(n=>hp[((v.planetVargaSign[n]-asc+12)%12)+1].push(n));"
rep(a,a+"chOuter(v).forEach(n=>hp[((v.outerSign[n]-asc+12)%12)+1].push(n));",2)
b="PLANET_LIST.forEach(n=>hp[v.planetVargaSign[n]].push(n));"
rep(b,b+"chOuter(v).forEach(n=>hp[v.outerSign[n]].push(n));")
# toggle UI
tog='''    <div class="varga-control-group">
      <span class="varga-control-label">Outer planets:</span>
      <label class="outer-chk"><input type="checkbox" class="outer-chk-input" ${window.__showOuter!==false?'checked':''}> <span>♅ Uranus · ♆ Neptune · ♇ Pluto</span></label>
    </div>

'''
rep('''    <div class="varga-control-group">
      <span class="varga-control-label">Chart Style:</span>
      <div class="varga-style-toggle" id="vargaStyleToggle">''',tog+'''    <div class="varga-control-group">
      <span class="varga-control-label">Chart Style:</span>
      <div class="varga-style-toggle" id="vargaStyleToggle">''')
rep('''    <div class="varga-control-group">
      <span class="varga-control-label">Chart Style:</span>
      <div class="varga-style-toggle" id="lagnaStyleToggle">''',tog+'''    <div class="varga-control-group">
      <span class="varga-control-label">Chart Style:</span>
      <div class="varga-style-toggle" id="lagnaStyleToggle">''')
rep("function chOuter(v){","""document.addEventListener('change',e=>{
  if(!e.target.classList||!e.target.classList.contains('outer-chk-input'))return;
  window.__showOuter=e.target.checked;
  document.querySelectorAll('.outer-chk-input').forEach(c=>c.checked=window.__showOuter);
  document.querySelectorAll('.varga-style-toggle .varga-style-btn.active').forEach(b=>b.click());
});
function chOuter(v){""")
rep('\n.varga-style-btn {','\n.outer-chk{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:12px;border:1px solid var(--line,rgba(255,255,255,.12));font-size:12.5px;color:var(--text-dim,#9aa7b8);cursor:pointer}\n.outer-chk input{accent-color:#D4AF37}\n.varga-style-btn {')
open('srcB.html','w',encoding='utf-8').write(s)
print('ok')

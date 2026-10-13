import re
s=open('srcA.html',encoding='utf-8').read()
def rep(old,new,count=1,regex=False):
    global s
    n=s.count(old)
    assert n>=1,('missing',old[:70])
    if count==1: assert n==1,('multi',n,old[:70])
    s=s.replace(old,new)
# 1 constants + elements
rep('const EARTH_ELEMENTS = {a:1.000001','''Object.assign(PLANET_ELEMENTS,{
  uranus:{a:19.18797948,e:0.04685740,i:0.77298127,L:313.23810451,Lrate:428.48202785,peri:170.95427630,periRate:0.40805281,node:74.01692503,nodeRate:0.04240589},
  neptune:{a:30.06952752,e:0.00895439,i:1.77005520,L:-55.12002969,Lrate:218.45945325,peri:44.96476227,periRate:-0.32241464,node:131.78422574,nodeRate:-0.00508664},
  pluto:{a:39.48686035,e:0.24885238,i:17.14104260,L:238.96535011,Lrate:145.18042903,peri:224.09702598,periRate:-0.04062942,node:110.30167986,nodeRate:-0.01183482}
});
const EARTH_ELEMENTS = {a:1.000001''')
rep('const PLANET_COLORS = {Sun:"#FFD84A"','''const OUTER_LIST = ["Uranus","Neptune","Pluto"];
const OUTER_SK = {Uranus:"Prajapati",Neptune:"Varuna",Pluto:"Yama"};
const OUTER_ORBIT_R = {Uranus:10.6,Neptune:10.95,Pluto:11.3};
const PLANET_COLORS = {Sun:"#FFD84A"''')
rep('''Rahu:"#7B6EC9",Ketu:"#C97B9E"};

function siderealLongitude''','''Rahu:"#7B6EC9",Ketu:"#C97B9E"};
Object.assign(PLANET_GLYPHS,{Uranus:"♅",Neptune:"♆",Pluto:"♇"});
Object.assign(PLANET_COLORS,{Uranus:"#7DE3E0",Neptune:"#5B7CFA",Pluto:"#C9A38A"});
const ALL_BODIES = PLANET_LIST.concat(OUTER_LIST); // outer planets are shown/plotted but are not part of Vedic aspect/yoga logic

function siderealLongitude''')
rep('''    case "Saturn": tropical=planetGeocentricLongitude("saturn",jd); break;
    case "Rahu"''','''    case "Saturn": tropical=planetGeocentricLongitude("saturn",jd); break;
    case "Uranus": case "Neptune": case "Pluto": tropical=planetGeocentricLongitude(name.toLowerCase(),jd); break;
    case "Rahu"''')
# snapshot
rep('["mercury","venus","mars","jupiter","saturn"].forEach(k=> helio[k]=planetHeliocentric(k,jd));','["mercury","venus","mars","jupiter","saturn","uranus","neptune","pluto"].forEach(k=> helio[k]=planetHeliocentric(k,jd));')
rep('  PLANET_LIST.forEach(name=> sidereal[name] = siderealLongitude(name,jd));','  ALL_BODIES.forEach(name=> sidereal[name] = siderealLongitude(name,jd));')
rep('  PLANET_LIST.forEach(name=> retro[name] = isRetrograde(name,jd));','  ALL_BODIES.forEach(name=> retro[name] = isRetrograde(name,jd));')
# orbit radius maps
old='{ Sun:4, Moon:2.6, Mercury:5, Venus:6, Mars:7, Jupiter:8, Saturn:9.2, Rahu:10.2, Ketu:10.2 }'
assert s.count(old)>=4,s.count(old)
s=s.replace(old,'{ Sun:4, Moon:2.6, Mercury:5, Venus:6, Mars:7, Jupiter:8, Saturn:9.2, Rahu:10.2, Ketu:10.2, Uranus:10.6, Neptune:10.95, Pluto:11.3 }')
# meshes
rep('''  PLANET_LIST.forEach(name=>{
    const mesh = makeSphere(name==="Sun"?0.5: name==="Moon"?0.4:0.32,''','''  ALL_BODIES.forEach(name=>{
    const mesh = makeSphere(name==="Sun"?0.5: name==="Moon"?0.4: OUTER_LIST.includes(name)?0.26:0.32,''')
rep("Rahu:[0x7B6EC9,1.6,2.0], Ketu:[0xC97B9E,1.6,2.0] };","Rahu:[0x7B6EC9,1.6,2.0], Ketu:[0xC97B9E,1.6,2.0], Uranus:[0x7DE3E0,2.2,1.0], Neptune:[0x5B7CFA,2.4,1.1] };")
rep("PLANET_LIST.forEach(n=> bodies['geo_'+n] = n);","ALL_BODIES.forEach(n=> bodies['geo_'+n] = n);")
rep('''  PLANET_LIST.forEach(name=>{
    const lon = snap.sidereal[name];
    const r = planetOrbitRadius[name];
    bodyMeshes["geo_"+name].position.set(''','''  ALL_BODIES.forEach(name=>{
    const lon = snap.sidereal[name];
    const r = planetOrbitRadius[name];
    bodyMeshes["geo_"+name].position.set(''')
rep("  updateOverlays(snap);\n  markDirty();\n  return snap;","  updateOverlays(snap);\n  solUpdate(jd);\n  markDirty();\n  return snap;")
# labels
rep('  const activeSet = PLANET_LIST.map(n=>[n,"geo_"+n]);','  const activeSet = ALL_BODIES.map(n=>[n,"geo_"+n]);')
rep('''      labelNodes["signlabel_"+i] = { el, label: SIGNS[i].name, isSign:true };
    }
  }
}''','''      labelNodes["signlabel_"+i] = { el, label: SIGNS[i].name, isSign:true };
    }
  }
  if (SOL.built) solMakeLabels();
}''')
rep('''    let mesh = bodyMeshes[key];
    if (!mesh){ el.style.display='none'; continue; }''','''    let mesh = bodyMeshes[key];
    if (!mesh || mesh.visible===false || (mesh.parent && mesh.parent.visible===false)){ el.style.display='none'; continue; }''')
# focus select
rep('''  const geoOptions = PLANET_LIST.map(n=>[n,"geo_"+n]);
  const options = geoOptions;''','''  const geoOptions = ALL_BODIES.map(n=>[n,"geo_"+n]);
  const options = SOL.view==='solar' ? ["Sun"].concat(SOL_BODIES).map(n=>[n,"sol_"+n]) : geoOptions;''')
# legend
rep('''    const label = focusedPlanetKey.replace(/^geo_/,'');''','''    const label = focusedPlanetKey.replace(/^(geo_|sol_)/,'');''')
rep('''  legend.innerHTML = `<div>EARTH-CENTERED · SIDEREAL LONGITUDE (LAHIRI)</div><div>RING = 12 RASHI · DRAG TO ORBIT</div>`;''','''  if (SOL.view==='solar'){
    legend.innerHTML = SOL.scale==='real'
      ? `<div>SUN-CENTERED · TRUE SCALE (1 AU = 10 UNITS)</div><div>REAL DISTANCES &amp; SIZES · DOTS MARK TINY PLANETS · DRAG TO ORBIT</div>`
      : `<div>SUN-CENTERED · EASY FIT (DISTANCES COMPRESSED)</div><div>REAL POSITIONS · SIZES EXAGGERATED · DRAG TO ORBIT</div>`;
    return;
  }
  legend.innerHTML = `<div>EARTH-CENTERED · SIDEREAL LONGITUDE (LAHIRI)</div><div>RING = 12 RASHI · DRAG TO ORBIT</div>`;''')
# zoom clamps
rep('orbitDist = Math.max(6, Math.min(120, pinchStartOrbit*scale));','orbitDist = clampZoom(pinchStartOrbit*scale);')
rep('orbitDist = Math.max(6, Math.min(120, orbitDist + e.deltaY*0.02));','orbitDist = clampZoom(orbitDist * (1 + e.deltaY*0.0008) + (SOL.view==="solar" ? 0 : e.deltaY*0.02 - orbitDist*e.deltaY*0.0008));')
rep("document.getElementById('zoomInBtn').addEventListener('click', ()=>{ orbitDist = Math.max(6, orbitDist-4); });","document.getElementById('zoomInBtn').addEventListener('click', ()=>{ orbitDist = clampZoom(SOL.view==='solar' ? orbitDist*0.78 : orbitDist-4); markDirty(); });")
rep("document.getElementById('zoomOutBtn').addEventListener('click', ()=>{ orbitDist = Math.min(120, orbitDist+4); });","document.getElementById('zoomOutBtn').addEventListener('click', ()=>{ orbitDist = clampZoom(SOL.view==='solar' ? orbitDist*1.28 : orbitDist+4); markDirty(); });")
rep("  orbitAngleTheta=0.55; orbitAnglePhi=1.15; orbitDist = 26; autoRotate=true;","  orbitAngleTheta=0.55; orbitAnglePhi=1.15; orbitDist = SOL.view==='solar' ? (SOL.scale==='real'?60:38) : 26; autoRotate=true; markDirty();")
rep("  function wheel(){ setCamMode('orbit'); orbitDist = 26; markDirty(); syncPickBtn(); close(); }","  function wheel(){ setCamMode('orbit'); orbitDist = SOL.view==='solar' ? (SOL.scale==='real'?60:38) : 26; markDirty(); syncPickBtn(); close(); }")
# render loop focus
rep('''  if (camMode==="focus"){
    const target = getFocusTargetPos() || new THREE.Vector3(0,0,0);''','''  if (SOL.view==='solar'){
    if (camMode==='focus'){
      if (SOL.lastFocus!==focusedPlanetKey){ SOL.lastFocus = focusedPlanetKey; orbitDist = solFocusDist(); }
      orbitDist = clampZoom(orbitDist);
    } else { SOL.lastFocus = null; orbitDist = clampZoom(orbitDist); }
    const nn = camMode==='focus' ? Math.max(0.00005, orbitDist*0.04) : 0.1;
    if (Math.abs(nn-SOL.lastNear) > 1e-9){ SOL.lastNear = nn; camera.near = Math.min(0.1, nn); camera.updateProjectionMatrix(); }
  }
  if (camMode==="focus"){
    const target = getFocusTargetPos() || new THREE.Vector3(0,0,0);''')
# solar module before updateLegend
rep('function updateLegend(){',open('solar_a.js',encoding='utf-8').read()+'\nfunction updateLegend(){')
# sky table
rep('''  PLANET_LIST.forEach(name=>{
    const row = document.createElement('div');
    row.className = 'sky-row';
    row.style.setProperty('--pc', PLANET_COLORS[name]);
    row.style.cursor = 'pointer';
    row.addEventListener('click', ()=> openPlanetDetail(name));''','''  ALL_BODIES.forEach(name=>{
    const row = document.createElement('div');
    row.className = 'sky-row';
    row.style.setProperty('--pc', PLANET_COLORS[name]);
    row.style.cursor = 'pointer';
    row.addEventListener('click', ()=>{
      if (OUTER_LIST.includes(name)){ if (SOL.view==='solar') setSceneView('wheel'); setCamMode('focus'); focusedPlanetKey = 'geo_'+name; autoRotate = false; const sel = document.getElementById('focusPlanetSelect'); if (sel) sel.value = focusedPlanetKey; updateLegend(); markDirty(); }
      else openPlanetDetail(name);
    });''')
rep('''function renderSkyTable(snap){
  PLANET_LIST.forEach(name=>{''','''function renderSkyTable(snap){
  ALL_BODIES.forEach(name=>{''')
rep('''    nodes.sign.textContent = `${sign.symbol} ${sign.name} (${sign.sk}) · ${nak} Pada ${pada} (Lord: ${nakLord})`;''','''    nodes.sign.textContent = `${sign.symbol} ${sign.name} (${sign.sk}) · ${nak} Pada ${pada} (Lord: ${nakLord})` + (OUTER_LIST.includes(name) ? ` · ${OUTER_SK[name]} (outer planet)` : '');''')
# picker
rep("const n = focusedPlanetKey.replace(/^geo_/, ''); btn.textContent = PLANET_GLYPHS[n]; btn.style.setProperty('--pc', PLANET_COLORS[n]);","const n = focusedPlanetKey.replace(/^(geo_|sol_)/, ''); btn.textContent = PLANET_GLYPHS[n] || (SOL_DATA[n] && SOL_DATA[n].g) || '☉'; btn.style.setProperty('--pc', PLANET_COLORS[n] || '#FFD84A');")
rep("    setCamMode('focus'); focusedPlanetKey = 'geo_' + n;","    setCamMode('focus'); focusedPlanetKey = (SOL.view==='solar' ? 'sol_' : 'geo_') + n;")
old_start=s.index("    box.innerHTML = `<div class=\"pk-title\">Select a planet</div>")
old_end=s.index("      <button class=\"pk-all\" id=\"pkAll\">◎ Whole wheel view</button>`;")+len("      <button class=\"pk-all\" id=\"pkAll\">◎ Whole wheel view</button>`;")
new='''    const solar = SOL.view==='solar', names = solar ? ["Sun"].concat(SOL_BODIES) : ALL_BODIES;
    const tile = (n,i)=>{
      const sel = camMode==='focus' && focusedPlanetKey===(solar?'sol_':'geo_')+n;
      if (solar){
        const col = n==='Sun' ? '#FFD84A' : '#'+SOL_DATA[n].c.toString(16).padStart(6,'0'), g = n==='Sun' ? '☉' : SOL_DATA[n].g;
        const h = n==='Sun' ? {x:0,y:0,z:0} : solHelio(n, currentJD), r = Math.hypot(h.x,h.y,h.z);
        return `<div class="pk-tile ${sel?'sel':''}" style="--pc:${col};--i:${i}" data-p="${n}"><div class="pk-orb">${g}</div><div class="pk-name">${n}</div><div class="pk-sk">from Sun</div><div class="pk-pos">${n==='Sun' ? '—' : r.toFixed(2)+' AU'}</div></div>`;
      }
      const lon = snap.sidereal[n], sg = SIGNS[getSignIndex(lon)], dm = degreeInSign(lon), rx = (n==='Rahu'||n==='Ketu'||snap.retro[n]) ? ' ℞' : '';
      const outer = OUTER_LIST.includes(n), sk = outer ? OUTER_SK[n] : PD[n].sk.split(' ')[0];
      return `<div class="pk-tile ${sel?'sel':''}" style="--pc:${PLANET_COLORS[n]};--i:${i}" data-p="${n}">${outer?'':`<button class="pk-info" data-i="${n}" aria-label="Details">i</button>`}
        <div class="pk-orb">${PLANET_GLYPHS[n]}</div><div class="pk-name">${n}</div><div class="pk-sk">${sk}</div><div class="pk-pos">${sg.symbol} ${dm.deg}°${rx}</div></div>`;
    };
    box.innerHTML = `<div class="pk-title">Select a planet</div><div class="pk-sub">Tap a planet to fly the camera to it.${solar?'':' Tap ⓘ for its full details.'}</div>
      <div class="pk-grid">${names.map(tile).join('')}</div>
      <button class="pk-all" id="pkAll">${solar?'☉ Whole solar system':'◎ Whole wheel view'}</button>`;'''
s=s[:old_start]+new+s[old_end:]
# HTML: switch, scale, presets
rep('''    <div class="viewport-legend" id="viewportLegend"></div>''','''    <div class="view-switch-wrap">
      <div class="view-switch" id="viewSwitch"><button data-v="wheel" class="active">☸ Zodiac Wheel</button><button data-v="solar">☉ Solar System</button></div>
      <div class="sol-sub" id="solScale" style="display:none"><button data-s="easy" class="active">Easy fit</button><button data-s="real">True scale</button></div>
      <div class="sol-sub" id="solPresets" style="display:none"><button data-p="inner">Inner</button><button data-p="outer">Outer</button><button data-p="all">Whole system</button></div>
    </div>
    <div class="viewport-legend" id="viewportLegend"></div>''')
rep('''      <button class="panel-tab" data-tab="chart">''','''      <button class="panel-tab" data-tab="solar"><span class="ti">🪐</span><span>Solar</span></button>
      <button class="panel-tab" data-tab="chart">''')
rep('''      <div class="panel-section" id="tab-chart">''','''      <div class="panel-section" id="tab-solar">
        <div class="tab-intro"><span class="ico">🪐</span><div><b>The real solar system for this date.</b> Every planet's true distance from the Sun and from Earth, its real size and its year. Use the <b>Solar System</b> switch above the 3D view, then tap a row to fly to that planet. <b>True scale</b> shows how empty space really is.</div></div>
        <div class="panel-heading">Planet Sizes (true proportions)</div>
        <div id="solSizes" style="margin:0 0 18px"></div>
        <div class="panel-heading">Distances &amp; Facts</div>
        <div id="solTable"></div>
        <div class="transit-note" style="margin-top:12px">Positions come from JPL Keplerian orbital elements (accurate to about an arc-minute for 1800–2050, less outside that range). The Sun's own diameter is about 1,391,400 km.</div>
      </div>

      <div class="panel-section" id="tab-chart">''')
# CSS
rep('.planet-label.dimmed { opacity: 0.35; }','''.planet-label.dimmed { opacity: 0.35; }
.view-switch-wrap { position:absolute; top:24px; left:50%; transform:translateX(-50%); z-index:11; display:flex; flex-direction:column; align-items:center; gap:8px; pointer-events:none; }
.view-switch, .sol-sub { display:flex; gap:4px; padding:4px; border-radius:14px; background:rgba(18,25,38,.7); border:1px solid var(--glass-border); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); pointer-events:auto; }
.view-switch button, .sol-sub button { padding:8px 14px; border-radius:10px; font-size:12px; font-weight:600; color:var(--text-dim); border:0; background:transparent; cursor:pointer; white-space:nowrap; transition:all .2s; }
.sol-sub button { padding:6px 11px; font-size:11px; }
.view-switch button.active, .sol-sub button.active { color:#07101c; background:linear-gradient(135deg,var(--cyan),#7B6EF6); box-shadow:0 2px 12px var(--cyan-glow); }
.view-switch button:not(.active):hover, .sol-sub button:not(.active):hover { color:var(--text); background:rgba(255,255,255,.07); }
.sol-row { display:flex; gap:12px; align-items:center; padding:12px 14px; margin-bottom:8px; border-radius:16px; cursor:pointer; border:1px solid var(--glass-border); background:linear-gradient(100deg,color-mix(in srgb,var(--pc) 13%,transparent),rgba(255,255,255,.02) 60%); transition:transform .2s; }
.sol-row:hover { transform:translateY(-2px); }
.sol-g { font-size:26px; width:34px; text-align:center; flex:none; }
.sol-main { display:flex; flex-direction:column; gap:2px; min-width:0; flex:1; }
.sol-main b { font-size:14px; color:var(--text); }
.sol-main span, .sol-nums span { font-size:11px; color:var(--text-dim); font-family:var(--font-mono); }
.sol-nums { display:flex; flex-direction:column; gap:2px; text-align:right; flex:none; max-width:55%; }
@media (max-width:720px){ .view-switch-wrap{ top:calc(64px + var(--safe-t)); } .view-switch button{ padding:7px 11px; font-size:11.5px; } .sol-row{ flex-wrap:wrap; } .sol-nums{ text-align:left; max-width:100%; width:100%; } }''')
# init: build size strip
rep('  buildSkyTableRows();\n  setViewMode();','  buildSkyTableRows();\n  solBuildSizeStrip();\n  setViewMode();')
open('srcA.html','w',encoding='utf-8').write(s)
print('patched A')

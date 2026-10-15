/* ============================================================================
   SOLAR SYSTEM VIEW — heliocentric, planets at their real positions for the
   chosen date. Two scale modes:
     "easy"  distances compressed (sqrt) + sizes exaggerated, everything visible
     "real"  true distances (1 AU = 10 units) and true relative sizes
   Orbital elements: JPL/Standish Keplerian elements (best for 1800-2050).
   ============================================================================ */
const SOL_AU_KM = 149597870.7, SOL_SUN_KM = 695700, SOL_UNITS_PER_AU = 10, SOL_LIGHT_MIN_PER_AU = 8.3167;
const SOL_BODIES = ["Mercury","Venus","Earth","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto"];
const SOL_DATA = {
  Mercury:{R:2439.7, P:0.2408, c:0x8FB3C9, g:"☿"}, Venus:{R:6051.8, P:0.6152, c:0xF5E6C8, g:"♀"},
  Earth:{R:6371.0, P:1.0000, c:0x4F9BE0, g:"⊕"}, Mars:{R:3389.5, P:1.8808, c:0xFF6B4A, g:"♂"},
  Jupiter:{R:69911, P:11.862, c:0xE8B95C, g:"♃"}, Saturn:{R:58232, P:29.457, c:0xD9C58E, g:"♄"},
  Uranus:{R:25362, P:84.011, c:0x7DE3E0, g:"♅"}, Neptune:{R:24622, P:164.79, c:0x5B7CFA, g:"♆"},
  Pluto:{R:1188.3, P:247.94, c:0xC9A38A, g:"♇"}
};
const SOL = { view:'wheel', scale:'easy', built:false, group:null, bodies:{}, orbits:{}, sun:null, light:null, lastFocus:null, lastNear:0.1 };

function solHelio(name, jd){ return name==="Earth" ? earthHeliocentric(jd) : planetHeliocentric(name.toLowerCase(), jd); }
function solMapPos(h){ // ecliptic (x,y,z AU) -> scene coords for current scale mode
  const r = Math.sqrt(h.x*h.x + h.y*h.y + h.z*h.z) || 1e-9;
  const k = SOL.scale==='real' ? SOL_UNITS_PER_AU : (5.2*Math.sqrt(r)/r);
  return new THREE.Vector3(h.x*k, h.z*k, -h.y*k);
}
function solRadius(name){ // sphere radius in scene units
  if (SOL.scale==='real') return (name==="Sun" ? SOL_SUN_KM : SOL_DATA[name].R) / SOL_AU_KM * SOL_UNITS_PER_AU;
  if (name==="Sun") return 1.7;
  return Math.max(0.12, 0.34*Math.pow(SOL_DATA[name].R/6371, 0.5));
}
function solBuild(){
  if (SOL.built) return; SOL.built = true;
  const g = SOL.group = new THREE.Group(); g.visible = false; scene.add(g);
  // Sun
  const sun = makeSphere(1, 0xFFD84A, 0xFFB347, 'Sun'); g.add(sun); SOL.sun = sun; bodyMeshes['sol_Sun'] = sun;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map:_glowTex(), color:0xFFB347, transparent:true, opacity:0.5, blending:THREE.AdditiveBlending, depthWrite:false }));
  g.add(glow); SOL.sunGlow = glow; SOL.dots = {};
  SOL.light = new THREE.PointLight(0xFFF2D6, 1.4, 0, 0); g.add(SOL.light);
  SOL_BODIES.forEach(n=>{
    const m = makeSphere(1, SOL_DATA[n].c, 0, n); g.add(m); SOL.bodies[n] = m; bodyMeshes['sol_'+n] = m;
    // fixed-screen-size dot so tiny true-scale planets stay findable
    const dot = new THREE.Sprite(new THREE.SpriteMaterial({ map:_glowTex(), color:SOL_DATA[n].c, transparent:true, opacity:0.95, depthWrite:false, sizeAttenuation:false }));
    dot.scale.set(0.022,0.022,1); dot.visible = false; g.add(dot); SOL.dots[n] = dot;
    if (n==='Saturn'){
      m.userData.noSpin = true;
      const c = document.createElement('canvas'); c.width = 512; c.height = 4; const x = c.getContext('2d');
      const gr = x.createLinearGradient(0,0,512,0);
      [[0,'rgba(0,0,0,0)'],[0.08,'rgba(190,170,130,0.55)'],[0.3,'rgba(235,215,165,0.9)'],[0.45,'rgba(120,100,70,0.25)'],[0.52,'rgba(240,222,175,0.95)'],[0.8,'rgba(210,190,145,0.75)'],[0.93,'rgba(170,150,110,0.35)'],[1,'rgba(0,0,0,0)']].forEach(([p,col])=> gr.addColorStop(p,col));
      x.fillStyle = gr; x.fillRect(0,0,512,4);
      const rg = new THREE.RingGeometry(1.45, 2.45, 96, 1), pos = rg.attributes.position, uv = rg.attributes.uv;
      for (let i=0;i<pos.count;i++){ const d = Math.hypot(pos.getX(i), pos.getY(i)); uv.setXY(i, (d-1.45)/1, 0.5); }
      const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(c), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
      ring.rotation.x = -Math.PI/2 + 0.42; m.add(ring);
    }
  });
  solMakeLabels();
  solRebuildOrbits(); solApplyScale(); solUpdate(currentJD);
}
function solMakeLabels(){
  const container = document.getElementById('planetLabels');
  ["Sun"].concat(SOL_BODIES).forEach(n=>{
    const el = document.createElement('div'); el.className = 'planet-label';
    const col = '#'+(n==="Sun"?0xFFD84A:SOL_DATA[n].c).toString(16).padStart(6,'0');
    el.innerHTML = `<span class="dot" style="background:${col}"></span>${n}`; el.style.display = 'none';
    container.appendChild(el); labelNodes['sol_'+n] = { el, label:n };
  });
}
function solRebuildOrbits(){
  for (const k in SOL.orbits){ SOL.group.remove(SOL.orbits[k]); SOL.orbits[k].geometry.dispose(); }
  SOL.orbits = {};
  SOL_BODIES.forEach(n=>{
    const key = n.toLowerCase(), el = n==="Earth" ? EARTH_ELEMENTS : PLANET_ELEMENTS[key];
    const T0 = (currentJD-J2000)/36525.0, N = 360, pts = [];
    // sweep the mean longitude through one full revolution at the current epoch's elements
    for (let i=0;i<=N;i++){
      const e2 = Object.assign({}, el, { L: el.L + el.Lrate*T0 + i*360/N, Lrate:0, peri: el.peri + el.periRate*T0, periRate:0, node: el.node + el.nodeRate*T0, nodeRate:0 });
      pts.push(solMapPos(heliocentricPos(e2, 0)));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color:SOL_DATA[n].c, transparent:true, opacity:0.38 }));
    SOL.group.add(line); SOL.orbits[n] = line;
  });
}
function solApplyScale(){
  if (!SOL.built) return;
  const real = SOL.scale==='real';
  SOL.sun.scale.setScalar(solRadius("Sun"));
  SOL.sunGlow.material.sizeAttenuation = !real; SOL.sunGlow.material.needsUpdate = true;
  if (real) SOL.sunGlow.scale.set(0.11,0.11,1); else SOL.sunGlow.scale.set(6,6,1);
  SOL_BODIES.forEach(n=>{
    const m = SOL.bodies[n]; m.scale.setScalar(solRadius(n));
    SOL.dots[n].visible = real; // real mode: planets are sub-pixel, so mark them with a dot
  });
  solRebuildOrbits(); solUpdate(currentJD);
  document.querySelectorAll('#solScale button').forEach(b=> b.classList.toggle('active', b.dataset.s===SOL.scale));
  markDirty();
}
function solUpdate(jd){
  if (!SOL.built) return;
  SOL_BODIES.forEach(n=>{ const p = solMapPos(solHelio(n, jd)); SOL.bodies[n].position.copy(p); SOL.dots[n].position.copy(p); });
  if (SOL.view==='solar') solRenderTable(jd);
}
function solZoomRange(){
  if (SOL.view!=='solar') return [6,120];
  if (camMode==='focus' && focusedPlanetKey){
    const n = focusedPlanetKey.replace(/^(geo_|sol_)/,''); const r = n==='Sun' ? solRadius('Sun') : (SOL.bodies[n] ? solRadius(n) : 1);
    return [Math.max(r*1.8, 0.0006), SOL.scale==='real' ? 900 : 120];
  }
  return SOL.scale==='real' ? [3, 950] : [4, 120];
}
function clampZoom(v){ const z = solZoomRange(); return Math.max(z[0], Math.min(z[1], v)); }
function solFocusDist(){
  const n = focusedPlanetKey ? focusedPlanetKey.replace(/^(geo_|sol_)/,'') : null;
  if (!n || !SOL.bodies[n]) return SOL.scale==='real' ? 60 : 30;
  return solRadius(n) * (SOL.scale==='real' ? 6 : 7);
}
function solPreset(which){
  if (SOL.view!=='solar') setSceneView('solar');
  setCamMode('orbit'); autoRotate = false; orbitAnglePhi = 1.0;
  const real = SOL.scale==='real';
  orbitDist = which==='inner' ? (real ? 30 : 22) : which==='outer' ? (real ? 700 : 85) : (real ? 950 : 90);
  markDirty();
}
function setSceneView(v){
  if (v==='solar') solBuild();
  SOL.view = v; const solar = v==='solar';
  zodiacRingGroup.visible = !solar; aspectLineGroup.visible = !solar;
  if (SOL.group) SOL.group.visible = solar;
  if (window._wheelSunLight) window._wheelSunLight.intensity = solar ? 0.25 : 3.5;
  document.querySelectorAll('#viewSwitch button').forEach(b=> b.classList.toggle('active', b.dataset.v===v));
  document.getElementById('solScale').style.display = solar ? 'flex' : 'none';
  document.getElementById('solPresets').style.display = solar ? 'flex' : 'none';
  if (solar){ if (camMode==='focus') setCamMode('orbit'); orbitDist = SOL.scale==='real' ? 120 : 62; solUpdate(currentJD); }
  else { orbitDist = 26; }
  if (!solar){ camera.near = 0.1; camera.updateProjectionMatrix(); }
  populateFocusPlanetSelect(); updateLegend(); markDirty();
  if (typeof syncPickBtn === 'function') syncPickBtn();
}
function solRenderTable(jd){
  const wrap = document.getElementById('solTable'); if (!wrap) return;
  const earth = earthHeliocentric(jd);
  let html = '';
  SOL_BODIES.forEach(n=>{
    const h = solHelio(n, jd), r = Math.hypot(h.x,h.y,h.z);
    const d = n==="Earth" ? 0 : Math.hypot(h.x-earth.x, h.y-earth.y, h.z-earth.z);
    const lon = normDeg(Math.atan2(h.y,h.x)*RAD), D = SOL_DATA[n], col = '#'+D.c.toString(16).padStart(6,'0');
    html += `<div class="sol-row" data-n="${n}" style="--pc:${col}">
      <div class="sol-g" style="color:${col}">${D.g}</div>
      <div class="sol-main"><b>${n}</b><span>${(D.R*2).toLocaleString('en-US',{maximumFractionDigits:0})} km wide · ${(D.R/6371).toFixed(n==="Pluto"||n==="Mercury"||n==="Mars"?3:2)}× Earth</span></div>
      <div class="sol-nums"><span>${r.toFixed(3)} AU from Sun</span><span>${n==="Earth" ? 'home' : d.toFixed(3)+' AU · '+(d*SOL_LIGHT_MIN_PER_AU).toFixed(1)+' light-min from Earth'}</span><span>year ${D.P<2 ? (D.P*365.25).toFixed(0)+' d' : D.P.toFixed(1)+' y'} · helio. ${lon.toFixed(1)}°</span></div>
    </div>`;
  });
  wrap.innerHTML = html;
  wrap.querySelectorAll('.sol-row').forEach(r=> r.addEventListener('click', ()=>{
    setCamMode('focus'); focusedPlanetKey = 'sol_'+r.dataset.n; autoRotate = false;
    const sel = document.getElementById('focusPlanetSelect'); if (sel) sel.value = focusedPlanetKey;
    SOL.lastFocus = null; updateLegend(); markDirty(); if (typeof syncPickBtn==='function') syncPickBtn();
  }));
}
function solBuildSizeStrip(){
  // true relative sizes (Sun omitted: it would be ~10x Jupiter), drawn as one SVG row
  const wrap = document.getElementById('solSizes'); if (!wrap) return;
  const list = SOL_BODIES.slice().sort((a,b)=> SOL_DATA[b].R - SOL_DATA[a].R);
  const scale = 38 / SOL_DATA.Jupiter.R; let x = 8, svg = '', svgI = 0;
  list.forEach(n=>{
    const r = Math.max(1.2, SOL_DATA[n].R*scale), col = '#'+SOL_DATA[n].c.toString(16).padStart(6,'0');
    x += r; const lo = (r<6 && (svgI++ % 2)) ? 9 : 0; svg += `<circle cx="${x.toFixed(1)}" cy="46" r="${r.toFixed(2)}" fill="${col}" fill-opacity=".85"><title>${n}: ${(SOL_DATA[n].R*2).toLocaleString('en-US',{maximumFractionDigits:0})} km</title></circle><text x="${x.toFixed(1)}" y="${(46+Math.max(r,6)+9+lo).toFixed(1)}" text-anchor="middle" font-size="6.5" fill="#8FA3B8" font-family="sans-serif">${n.slice(0,3)}</text>`;
    x += r + 5;
  });
  wrap.innerHTML = `<svg viewBox="0 0 ${Math.ceil(x+6)} 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">${svg}</svg>`;
}
document.querySelectorAll('#viewSwitch button').forEach(b=> b.addEventListener('click', ()=> setSceneView(b.dataset.v)));
document.querySelectorAll('#solScale button').forEach(b=> b.addEventListener('click', ()=>{ SOL.scale = b.dataset.s; solApplyScale(); orbitDist = clampZoom(SOL.scale==='real' ? 120 : 62); markDirty(); }));
document.querySelectorAll('#solPresets button').forEach(b=> b.addEventListener('click', ()=> solPreset(b.dataset.p)));

function updateLegend(){
  const legend = document.getElementById('viewportLegend');
  if (camMode==="free"){
    legend.innerHTML = `<div>FREE FLY · MOVE ANYWHERE IN THE SCENE</div><div>DRAG TO LOOK · WASD/ARROWS + Q/E OR JOYSTICK TO MOVE</div>`;
    return;
  }
  if (camMode==="focus" && focusedPlanetKey){
    const label = focusedPlanetKey.replace(/^(geo_|sol_)/,'');
    legend.innerHTML = `<div>FOCUSED ON ${label.toUpperCase()}</div><div>DRAG TO ORBIT THE PLANET · PINCH OR SCROLL TO ZOOM</div>`;
    return;
  }
  if (SOL.view==='solar'){
    legend.innerHTML = SOL.scale==='real'
      ? `<div>SUN-CENTERED · TRUE SCALE (1 AU = 10 UNITS)</div><div>REAL DISTANCES &amp; SIZES · DOTS MARK TINY PLANETS · DRAG TO ORBIT</div>`
      : `<div>SUN-CENTERED · EASY FIT (DISTANCES COMPRESSED)</div><div>REAL POSITIONS · SIZES EXAGGERATED · DRAG TO ORBIT</div>`;
    return;
  }
  legend.innerHTML = `<div>EARTH-CENTERED · SIDEREAL LONGITUDE (LAHIRI)</div><div>RING = 12 RASHI · DRAG TO ORBIT</div>`;
}


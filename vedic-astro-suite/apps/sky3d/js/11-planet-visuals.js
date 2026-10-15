/* ============================================================================
   VISUAL ENHANCEMENT: atmospheres, coronas, Saturn rings, orbit tracks, elemental zodiac
   ============================================================================ */
function _atmo(hex, power, k){
  return new THREE.ShaderMaterial({
    uniforms:{ c:{ value:new THREE.Color(hex) } },
    vertexShader:'varying vec3 n; varying vec3 v; void main(){ n=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); v=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
    fragmentShader:'uniform vec3 c; varying vec3 n; varying vec3 v; void main(){ float f=pow(1.0-abs(dot(n,v)),'+power.toFixed(1)+'); gl_FragColor=vec4(c*f*'+k.toFixed(2)+',f); }',
    blending:THREE.AdditiveBlending, transparent:true, depthWrite:false });
}
function enhanceZodiac(){
  const ORBIT = { Sun:4, Moon:2.6, Mercury:5, Venus:6, Mars:7, Jupiter:8, Saturn:9.2, Rahu:10.2, Ketu:10.2, Uranus:10.6, Neptune:10.95, Pluto:11.3 };
  const ATMO = { Earth:[0x4F9BE0,2.2,1.6], Venus:[0xFFD9A0,2.4,1.3], Mars:[0xFF7B4A,3.2,0.9], Jupiter:[0xFFC999,2.6,1.1], Saturn:[0xF0DCA0,2.6,1.1], Mercury:[0xBBBBBB,3.5,0.6], Moon:[0xCFD8FF,3.2,0.8], Rahu:[0x7B6EC9,1.6,2.0], Ketu:[0xC97B9E,1.6,2.0], Uranus:[0x7DE3E0,2.2,1.0], Neptune:[0x5B7CFA,2.4,1.1] };
  const addGlow = (mesh, hex, scale, op)=>{ const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:_glowTex(), color:hex, transparent:true, opacity:op, blending:THREE.AdditiveBlending, depthWrite:false })); sp.scale.set(scale,scale,1); mesh.add(sp); };
  const bodies = { geo_earth:'Earth' }; ALL_BODIES.forEach(n=> bodies['geo_'+n] = n);
  for (const key in bodies){
    const mesh = bodyMeshes[key], name = bodies[key]; if (!mesh) continue;
    const r = mesh.geometry.parameters.radius;
    if (name === 'Sun'){
      addGlow(mesh, 0xFFB347, r*4.5, 0.55);
    } else {
      const a = ATMO[name]; if (a) mesh.add(new THREE.Mesh(new THREE.SphereGeometry(r*1.16, 48, 48), _atmo(a[0], a[1]+0.6, a[2]*0.45)));
      addGlow(mesh, a ? a[0] : 0xFFFFFF, r*3, 0.1);
    }
    if (name === 'Saturn'){
      mesh.userData.noSpin = true;
      const c = document.createElement('canvas'); c.width = 512; c.height = 4; const x = c.getContext('2d');
      const g = x.createLinearGradient(0,0,512,0);
      [[0,'rgba(0,0,0,0)'],[0.08,'rgba(190,170,130,0.55)'],[0.3,'rgba(235,215,165,0.9)'],[0.45,'rgba(120,100,70,0.25)'],[0.52,'rgba(240,222,175,0.95)'],[0.8,'rgba(210,190,145,0.75)'],[0.93,'rgba(170,150,110,0.35)'],[1,'rgba(0,0,0,0)']].forEach(([p,col])=> g.addColorStop(p,col));
      x.fillStyle = g; x.fillRect(0,0,512,4);
      const rg = new THREE.RingGeometry(r*1.45, r*2.45, 96, 1), pos = rg.attributes.position, uv = rg.attributes.uv;
      for (let i=0;i<pos.count;i++){ const d = Math.hypot(pos.getX(i), pos.getY(i)); uv.setXY(i, (d - r*1.45)/(r), 0.5); }
      const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(c), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
      ring.rotation.x = -Math.PI/2 + 0.42; mesh.add(ring);
    }
  }
  // soft orbit tracks
  [...new Set(Object.values(ORBIT))].forEach(rad=>{
    const m = new THREE.Mesh(new THREE.RingGeometry(rad-0.012, rad+0.012, 180), new THREE.MeshBasicMaterial({ color:0x8FB4FF, transparent:true, opacity:0.05, side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false }));
    m.rotation.x = Math.PI/2; zodiacRingGroup.add(m);
  });
  // zodiac: nebula disc, elemental wedges, glowing rims and gems
  const dc = document.createElement('canvas'); dc.width = dc.height = 256; const dx = dc.getContext('2d');
  const dg = dx.createRadialGradient(128,128,0,128,128,128);
  dg.addColorStop(0,'rgba(123,110,246,0.1)'); dg.addColorStop(0.7,'rgba(0,240,213,0.03)'); dg.addColorStop(1,'rgba(0,0,0,0)');
  dx.fillStyle = dg; dx.fillRect(0,0,256,256);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(14, 64), new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(dc), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending }));
  disc.rotation.x = -Math.PI/2; disc.position.y = -0.08;
  const EL = [0xFF6B4A, 0x6BD08A, 0x5FE0F0, 0x4F7BE0];
  for (let i=0;i<12;i++){
    const a0 = i*30*DEG, a1 = (i+1)*30*DEG;
    [].forEach(([ri,ro,op])=>{
      const w = new THREE.Mesh(new THREE.RingGeometry(ri, ro, 28, 1, -a1, a1-a0), new THREE.MeshBasicMaterial({ color:EL[i%4], transparent:true, opacity:op, side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false }));
      w.rotation.x = Math.PI/2; zodiacRingGroup.add(w);
    });
    const gem = new THREE.Sprite(new THREE.SpriteMaterial({ map:_glowTex(), color:0xF4C45C, transparent:true, opacity:0.7, blending:THREE.AdditiveBlending, depthWrite:false }));
    gem.scale.set(0.45,0.45,1); gem.position.set(Math.cos(a0)*12, 0, -Math.sin(a0)*12); zodiacRingGroup.add(gem);
  }
  [11.45, 12.55].forEach(rad=>{
    const m = new THREE.Mesh(new THREE.RingGeometry(rad-0.035, rad+0.035, 180), new THREE.MeshBasicMaterial({ color:0xFFE6A8, transparent:true, opacity:0.9, side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false }));
    m.rotation.x = Math.PI/2; zodiacRingGroup.add(m);
  });
}

function _strip(deg, r0, r1, w, color, op, kind){
  const t = deg*DEG, c = Math.cos(t), sn = Math.sin(t), px = sn*w/2, pz = c*w/2;
  const a = [c*r0, -sn*r0], b = [c*r1, -sn*r1];
  const v = new Float32Array([a[0]-px,0,a[1]-pz, a[0]+px,0,a[1]+pz, b[0]-px,0,b[1]-pz, b[0]+px,0,b[1]+pz]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(v,3)); g.setIndex([0,1,2,1,3,2]);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent:true, opacity:op, side:THREE.DoubleSide, depthWrite:false }));
  m.userData.kind = kind; m.position.y = 0.01; zodiacRingGroup.add(m); return m;
}
function drawBorders(){
  // Zodiac: solid bright dividers across the sign band + soft guide lines all the way down to Earth
  for (let i=0;i<12;i++){
    _strip(i*30, 11.45, 12.55, 0.075, 0xFFE6A8, 0.95, 'sign');
    _strip(i*30, 0.8, 4.5, 0.03, 0xF4C45C, 0.07, 'sign');
    _strip(i*30, 4.5, 8.5, 0.03, 0xF4C45C, 0.12, 'sign');
    _strip(i*30, 8.5, 11.45, 0.03, 0xF4C45C, 0.2, 'sign');
  }
  // Nakshatras: bright boundary between each of the 27 arcs + crisp band edges
  for (let i=0;i<27;i++) _strip(i*(360/27), 13.15, 13.85, 0.06, 0xFFFFFF, 0.9, 'nak');
  [13.18, 13.82].forEach(rad=>{
    const m = new THREE.Mesh(new THREE.RingGeometry(rad-0.025, rad+0.025, 200), new THREE.MeshBasicMaterial({ color:0xFFFFFF, transparent:true, opacity:0.75, side:THREE.DoubleSide, depthWrite:false }));
    m.rotation.x = Math.PI/2; m.userData.kind = 'nak'; zodiacRingGroup.add(m);
  });
}

function updateSceneForJD(jd){
  const snap = snapshotPositions(jd);

  // Geocentric zodiac wheel positions
  const planetOrbitRadius = { Sun:4, Moon:2.6, Mercury:5, Venus:6, Mars:7, Jupiter:8, Saturn:9.2, Rahu:10.2, Ketu:10.2, Uranus:10.6, Neptune:10.95, Pluto:11.3 };
  ALL_BODIES.forEach(name=>{
    const lon = snap.sidereal[name];
    const r = planetOrbitRadius[name];
    bodyMeshes["geo_"+name].position.set(r*Math.cos(lon*DEG), 0, -r*Math.sin(lon*DEG));
  });

  rebuildAspectLines(snap.sidereal, planetOrbitRadius);
  
  // Clear any active nakshatra click-highlight when time changes so the lines don't detach
  if (typeof clearNakshatraHighlight === 'function') {
    clearNakshatraHighlight();
  }

  updateOverlays(snap);
  solUpdate(jd);
  markDirty();
  return snap;
}

/* Draw a thin line between any two planets currently in graha-drishti aspect,
   at the actual 3D position of their markers on the zodiac wheel, so the person
   can visually see "which planet is influencing which planets". */
function rebuildAspectLines(sidereal, planetOrbitRadius){
  const now = performance.now();
  if (isPlaying && now - _aspLast < 120 && aspectLineGroup.children.length) return;
  _aspLast = now;
  while (aspectLineGroup.children.length){
    const c = aspectLineGroup.children[0]; aspectLineGroup.remove(c);
    c.traverse(o=>{ if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); if (o.material && !o.material.userData.shared) o.material.dispose(); });
  }
  const aspects = computeAspects(sidereal);
  const seen = new Set();
  const col = n => new THREE.Color(PLANET_COLORS[n] || '#00F0D5');
  aspects.forEach(a=>{
    const pk = [a.from,a.to].sort().join('-')+'-'+a.houseOffset;
    if (seen.has(pk)) return; seen.add(pk);
    const rF = planetOrbitRadius[a.from], rT = planetOrbitRadius[a.to];
    const p1 = new THREE.Vector3(rF*Math.cos(sidereal[a.from]*DEG), 0, -rF*Math.sin(sidereal[a.from]*DEG));
    const p2 = new THREE.Vector3(rT*Math.cos(sidereal[a.to]*DEG), 0, -rT*Math.sin(sidereal[a.to]*DEG));
    const dist = p1.distanceTo(p2);
    const mid = p1.clone().add(p2).multiplyScalar(0.5); mid.y += Math.min(2.5, Math.max(0.5, dist*0.16));
    const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
    const full = a.houseOffset === 7;
    const tube = new THREE.TubeGeometry(curve, 28, full ? 0.034 : 0.022, 6, false);
    const cA = col(a.from), cB = col(a.to), n = tube.attributes.position.count, arr = new Float32Array(n*3);
    for (let i=0;i<n;i++){ const t = Math.floor(i/7)/28, c = cA.clone().lerp(cB, t).multiplyScalar(1.15); arr[i*3]=c.r; arr[i*3+1]=c.g; arr[i*3+2]=c.b; }
    tube.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    const g = new THREE.Group();
    g.add(new THREE.Mesh(tube, new THREE.MeshBasicMaterial({ vertexColors:true, transparent:true, opacity:0.6, blending:THREE.AdditiveBlending, depthWrite:false })));
    const hex = col(a.to).getHex();
    const cone = new THREE.Mesh(_coneGeo, _sharedMat('cone'+hex, ()=> new THREE.MeshBasicMaterial({ color:hex, transparent:true, opacity:0.95, blending:THREE.AdditiveBlending, depthWrite:false })));
    cone.position.copy(curve.getPoint(0.95));
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), curve.getTangent(0.95).normalize());
    g.add(cone);
    const glow = new THREE.Sprite(_sharedMat('glow'+hex, ()=> new THREE.SpriteMaterial({ map:_glowTex(), color:hex, transparent:true, opacity:0.6, blending:THREE.AdditiveBlending, depthWrite:false }), true));
    glow.scale.set(0.6,0.6,1); glow.position.copy(p2); g.add(glow);
    aspectLineGroup.add(g);
  });
  aspectLineGroup.visible = lineToggleState.aspectLines;
}
let _aspLast = 0;
const _coneGeo = new THREE.ConeGeometry(0.09, 0.26, 12); _coneGeo.userData.shared = true;
const _matCache = {};
function _sharedMat(k, make){ if (!_matCache[k]){ _matCache[k] = make(); _matCache[k].userData.shared = true; } return _matCache[k]; }
let _glowT = null;
function _glowTex(){
  if (_glowT) return _glowT;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.25,'rgba(255,255,255,0.45)'); g.addColorStop(0.6,'rgba(255,255,255,0.1)'); g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0,0,128,128); return (_glowT = new THREE.CanvasTexture(c));
}

function getFocusTargetPos(){
  if (!focusedPlanetKey) return null;
  const mesh = bodyMeshes[focusedPlanetKey];
  return mesh ? mesh.position : null;
}

function renderLoop(ts){
  requestAnimationFrame(renderLoop);
  const dt = lastFreeTickTime ? Math.min(0.1,(ts-lastFreeTickTime)/1000) : 0;
  lastFreeTickTime = ts;
  

  if (camMode==="free"){
    zoomGoal = null; spinVT = spinVP = 0;
    // Always re-render in free mode since movement can happen every frame
    const speed = FREE_MOVE_SPEED * dt;
    if (speed>0 && (freeMoveState.fwd||freeMoveState.right||freeMoveState.up)){
      const forward = new THREE.Vector3(Math.cos(freeCamPitch)*Math.cos(freeCamYaw), Math.sin(freeCamPitch), Math.cos(freeCamPitch)*Math.sin(freeCamYaw));
      const rightVec = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0)).normalize();
      freeCamPos.addScaledVector(forward, freeMoveState.fwd*speed);
      freeCamPos.addScaledVector(rightVec, freeMoveState.right*speed);
      freeCamPos.y += freeMoveState.up*speed;
      markDirty();
    }
    camera.position.copy(freeCamPos);
    const lookDir = new THREE.Vector3(Math.cos(freeCamPitch)*Math.cos(freeCamYaw), Math.sin(freeCamPitch), Math.cos(freeCamPitch)*Math.sin(freeCamYaw));
    camera.lookAt(freeCamPos.clone().add(lookDir));
    renderer.render(scene, camera);
    updatePlanetLabels();
    return;
  }

  if (!isDragging && (Math.abs(spinVT) > 4e-5 || Math.abs(spinVP) > 4e-5)){      // drag momentum, glides to a stop
    const f = dt * 60;
    orbitAngleTheta += spinVT * f;
    orbitAnglePhi = Math.max(0.15, Math.min(Math.PI-0.15, orbitAnglePhi + spinVP * f));
    const dmp = Math.pow(0.93, f); spinVT *= dmp; spinVP *= dmp; markDirty();
  }
  if (zoomGoal != null){                                                          // eased zoom
    if (orbitDist !== zoomSet) zoomGoal = null;                                   // something else moved the camera
    else {
      orbitDist += (zoomGoal - orbitDist) * (1 - Math.exp(-dt * 11));
      if (Math.abs(zoomGoal - orbitDist) < Math.abs(zoomGoal) * 1e-4 + 1e-6){ orbitDist = zoomGoal; zoomGoal = null; }
      zoomSet = orbitDist; markDirty();
    }
  }
  if (autoRotate){ orbitAngleTheta += 0.0006; markDirty(); }
  if (!needsRender) return;
  needsRender = false;

  if (SOL.view==='solar'){
    if (camMode==='focus'){
      if (SOL.lastFocus!==focusedPlanetKey){ SOL.lastFocus = focusedPlanetKey; orbitDist = solFocusDist(); }
      orbitDist = clampZoom(orbitDist);
    } else { SOL.lastFocus = null; orbitDist = clampZoom(orbitDist); }
    const nn = camMode==='focus' ? Math.max(0.00005, orbitDist*0.04) : 0.1;
    if (Math.abs(nn-SOL.lastNear) > 1e-9){ SOL.lastNear = nn; camera.near = Math.min(0.1, nn); camera.updateProjectionMatrix(); }
  }
  if (camMode==="focus"){
    const target = getFocusTargetPos() || new THREE.Vector3(0,0,0);
    const x = target.x + orbitDist*Math.sin(orbitAnglePhi)*Math.cos(orbitAngleTheta);
    const y = target.y + orbitDist*Math.cos(orbitAnglePhi);
    const z = target.z + orbitDist*Math.sin(orbitAnglePhi)*Math.sin(orbitAngleTheta);
    camera.position.set(x,y,z);
    camera.lookAt(target);
  } else {
    const x = orbitDist*Math.sin(orbitAnglePhi)*Math.cos(orbitAngleTheta);
    const y = orbitDist*Math.cos(orbitAnglePhi);
    const z = orbitDist*Math.sin(orbitAnglePhi)*Math.sin(orbitAngleTheta);
    camera.position.set(x,y,z);
    camera.lookAt(0,0,0);
  }
  renderer.render(scene, camera);
  updatePlanetLabels();
}

function setViewMode(){
  zodiacRingGroup.visible = true;
  orbitDist = 26;
  populateFocusPlanetSelect();
  updateLineToggleVisibility();
  updateLegend();
  rebuildLabelNodes();
  markDirty();
}


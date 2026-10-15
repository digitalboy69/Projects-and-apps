/* ---- Camera mode: "orbit" (default, orbits scene origin) | "focus" (orbits a chosen planet)
   | "free" (fully free-fly, pilot the camera anywhere) ---- */
let camMode = "orbit";
let focusedPlanetKey = null; // e.g. "geo_Mars"
let freeCamPos = new THREE.Vector3(0, 8, 34);
let freeCamYaw = -1.57, freeCamPitch = -0.2; // radians
let freeMoveState = { fwd:0, right:0, up:0 };
let freeLookDrag = false, freeLookLast = {x:0,y:0};
const FREE_MOVE_SPEED = 18; // scene units / second
let lastFreeTickTime = null;
var spinVT = 0, spinVP = 0, lastMoveTs = 0, zoomGoal = null, zoomSet = null, reduceMotion = false;
try { reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

const bodyMeshes = {}; // name -> mesh
const clickRaycaster = new THREE.Raycaster();
clickRaycaster.params.Points = { threshold: 0.4 };

// Reverse-lookup: scene mesh -> canonical planet name (works for both helio_* and geo_* keys)
function meshKeyToPlanetName(key){
  if (!key) return null;
  const stripped = key.replace(/^(geo_|sol_)/, '');
  const capitalized = stripped.charAt(0).toUpperCase()+stripped.slice(1);
  if (ALL_BODIES.includes(capitalized)) return capitalized;
  return null;
}
const nakshatraLineGroup = new THREE.Group();

function clearNakshatraHighlight(){
  while(nakshatraLineGroup.children.length) nakshatraLineGroup.remove(nakshatraLineGroup.children[0]);
  if(labelNodes["nakshatra_highlight"] && labelNodes["nakshatra_highlight"].el) {
    labelNodes["nakshatra_highlight"].el.style.display = 'none';
  }
  markDirty();
}

function showNakshatraHighlight(nakIdx){
  if(!nakshatraLineGroup.parent && typeof scene !== 'undefined') scene.add(nakshatraLineGroup);
  clearNakshatraHighlight();
  
  const outerRingRadius = 13.5;
  const nakCenterAng = (nakIdx + 0.5) * (360 / 27) * DEG;
  
  // Starting point for the ray on the inner boundary of the Nakshatra track
  const ringPt = new THREE.Vector3(Math.cos(nakCenterAng) * (outerRingRadius - 0.3), 0, -Math.sin(nakCenterAng) * (outerRingRadius - 0.3));
  
  // Float label high above disk plane and outside the outer perimeter
  const labelPt = new THREE.Vector3(
    Math.cos(nakCenterAng) * (outerRingRadius + 1.8),
    1.2, // Lift vertically off the floor plane
    -Math.sin(nakCenterAng) * (outerRingRadius + 1.8)
  );

  // Get Lord & dynamic color
  const lord = NAKSHATRA_LORDS[nakIdx];
  const lordColorHex = PLANET_COLORS[lord] || "#00F0D5";
  const lordColorNum = parseInt(lordColorHex.replace('#', ''), 16);

  // 1. ADD GLOWING ARC TO THE SELECTED NAKSHATRA SEGMENT
  const a0 = (nakIdx * (360 / 27)) * DEG;
  const a1 = ((nakIdx + 1) * (360 / 27)) * DEG;

  // Intense core illumination
  const glowGeo = new THREE.RingGeometry(outerRingRadius - 0.32, outerRingRadius + 0.32, 16, 1, -a1, a1 - a0);
  const glowMat = new THREE.MeshBasicMaterial({
    color: lordColorNum,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const glowMesh = new THREE.Mesh(glowGeo, glowMat);
  glowMesh.rotation.x = Math.PI / 2;
  glowMesh.position.y = 0.03; 
  nakshatraLineGroup.add(glowMesh);

  // Soft radiant halo bloom
  const haloGeo = new THREE.RingGeometry(outerRingRadius - 0.55, outerRingRadius + 0.55, 16, 1, -a1, a1 - a0);
  const haloMat = new THREE.MeshBasicMaterial({
    color: lordColorNum,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const haloMesh = new THREE.Mesh(haloGeo, haloMat);
  haloMesh.rotation.x = Math.PI / 2;
  haloMesh.position.y = 0.02;
  nakshatraLineGroup.add(haloMesh);

  // 2. CREATE / UPDATE FLOATING LABEL
  if(!labelNodes["nakshatra_highlight"]){
    const el = document.createElement('div');
    el.className = 'planet-label';
    el.style.fontWeight = '700';
    el.style.fontSize = '12px';
    el.style.background = 'rgba(10, 15, 26, 0.9)';
    el.style.padding = '6px 12px';
    el.style.borderRadius = '8px';
    el.style.backdropFilter = 'blur(8px)';
    el.style.zIndex = '50';
    el.style.whiteSpace = 'nowrap';
    document.getElementById('planetLabels').appendChild(el);
    labelNodes["nakshatra_highlight"] = { el, isSign: false };
  }
  
  const el = labelNodes["nakshatra_highlight"].el;
  
  if(!bodyMeshes["nakshatra_highlight"]){
    const anchor = new THREE.Object3D();
    scene.add(anchor);
    bodyMeshes["nakshatra_highlight"] = anchor;
  }
  bodyMeshes["nakshatra_highlight"].position.copy(labelPt);
  
  // 3. SHOOT BEAM TO OCCUPYING PLANETS AT EXACT DEGREE & CALCULATE TRANSIT TIMINGS
  const snap = snapshotPositions(currentJD);
  const planetOrbitRadius = { Sun:4, Moon:2.6, Mercury:5, Venus:6, Mars:7, Jupiter:8, Saturn:9.2, Rahu:10.2, Ketu:10.2, Uranus:10.6, Neptune:10.95, Pluto:11.3 };
  let found = false;
  let occupantsHtml = '';

  PLANET_LIST.forEach(name=>{
    const lon = snap.sidereal[name];
    if(getNakshatraIndex(lon) === nakIdx){
      found = true;
      const r = planetOrbitRadius[name];
      
      // Calculate origin point on the outer ring matching the planet's EXACT degree
      const exactRingPt = new THREE.Vector3(
        Math.cos(lon * DEG) * (outerRingRadius - 0.3), 
        0, 
        -Math.sin(lon * DEG) * (outerRingRadius - 0.3)
      );
      
      // Destination point at the planet's exact orbital position
      const pPt = new THREE.Vector3(
        r * Math.cos(lon * DEG), 
        0, 
        -r * Math.sin(lon * DEG)
      );
      
      const geo = new THREE.BufferGeometry().setFromPoints([exactRingPt, pPt]);
      const mat = new THREE.LineBasicMaterial({ color: lordColorNum, transparent: true, opacity: 0.95, linewidth: 2 });
      nakshatraLineGroup.add(new THREE.Line(geo, mat));

      // Calculate exact Nakshatra entry/exit times (edges of the current continuous stay)
      const nakEdges = stayEdges(name, currentJD, getNakshatraIndex);
      let enterJD = nakEdges.enterJD, exitJD = nakEdges.exitJD;

      const enterStr = enterJD ? formatFullDate(enterJD) : 'Beyond range';
      const exitStr = exitJD ? formatFullDate(exitJD) : 'Beyond range';
      
      // Build the interior mini-timeline for this planet
      occupantsHtml += `
        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid ${lordColorHex}44; font-size: 10.5px; font-family: var(--font-mono); color: var(--text);">
          <div style="margin-bottom:4px;"><span style="color:${PLANET_COLORS[name]}; font-size:12px; font-family:var(--font-ui);">${PLANET_GLYPHS[name]}</span> <b style="font-family:var(--font-ui); font-size:11px;">${name}</b></div>
          <div style="color:var(--text-dim); margin-bottom: 2px;">In : <span style="color:var(--cyan);">${enterStr}</span></div>
          <div style="color:var(--text-dim);">Out: <span style="color:var(--cyan);">${exitStr}</span></div>
        </div>
      `;
    }
  });

  // Apply Name + Embedded Planet Timelines
  el.innerHTML = `✦ ${NAKSHATRAS[nakIdx]} <span style="font-size:10px; opacity:0.8;">(${lord})</span>` + occupantsHtml;
  el.style.color = lordColorHex;
  el.style.border = `1.5px solid ${lordColorHex}`;
  el.style.boxShadow = `0 0 16px ${lordColorHex}44, inset 0 0 8px ${lordColorHex}22`;
  el.style.textShadow = `0 0 10px ${lordColorHex}`;

  if(!found){
     // Draw a small inward tick from the center of the Nakshatra if unoccupied
     const stubPt = new THREE.Vector3(Math.cos(nakCenterAng) * 12.2, 0, -Math.sin(nakCenterAng) * 12.2);
     const geo = new THREE.BufferGeometry().setFromPoints([ringPt, stubPt]);
     const mat = new THREE.LineBasicMaterial({ color: lordColorNum, transparent: true, opacity: 0.5 });
     nakshatraLineGroup.add(new THREE.Line(geo, mat));
  }
  
  labelNodes["nakshatra_highlight"].el.style.display = '';
  markDirty();
}

function handleCanvasClick(e){
  const rect = renderer.domElement.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((e.clientX-rect.left)/rect.width)*2-1,
    -((e.clientY-rect.top)/rect.height)*2+1
  );
  clickRaycaster.setFromCamera(ndc, camera);
  clickRaycaster.params.Line = { threshold: 0.8 }; // Larger threshold makes tapping lines easier on mobile

  const candidateMeshes = Object.entries(bodyMeshes)
    .filter(([key,m])=> !key.startsWith('signlabel_') && !key.startsWith('nakshatra_') && !key.startsWith('ghost_') && m.visible!==false && !(m.parent && m.parent.visible===false))
    .map(([key,mesh])=>({key,mesh}));
  
  const hits = clickRaycaster.intersectObjects(candidateMeshes.map(c=>c.mesh), false);
  if (hits.length) {
    const hitMesh = hits[0].object;
    const found = candidateMeshes.find(c=>c.mesh===hitMesh);
    if (found) {
      const planetName = meshKeyToPlanetName(found.key);
      if (planetName) openPlanetDetail(planetName, currentJD);
    }
    return;
  }

  // If we missed planets, check if we hit the Zodiac Ring to trigger Nakshatra highlights
  if (mode === "geo") {
    const ringHits = clickRaycaster.intersectObjects(zodiacRingGroup.children, false);
    if (ringHits.length) {
      const pt = ringHits[0].point;
      let ang = normDeg(Math.atan2(-pt.z, pt.x) * RAD);
      showNakshatraHighlight(Math.floor(ang / (360/27)));
    } else {
      clearNakshatraHighlight();
    }
  } else {
    clearNakshatraHighlight();
  }
}
const orbitLines = {}; // name -> line
const zodiacRingGroup = new THREE.Group();


function initScene(){
  scene = new THREE.Scene();
  const canvas = document.getElementById('canvas3d');
  const vp = document.querySelector('.viewport');
  camera = new THREE.PerspectiveCamera(50, vp.clientWidth/vp.clientHeight, 0.1, 2000);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha:true, powerPreference:"default" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.75));
  renderer.setSize(vp.clientWidth, vp.clientHeight);

  // Gorgeous Multi-layered Starfield
  const starGeo = new THREE.BufferGeometry();
  const starCount = isMobile ? 800 : 3500;
  const starPos = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  
  const colorPalette = [new THREE.Color(0xffffff), new THREE.Color(0x99ccff), new THREE.Color(0xffcc99), new THREE.Color(0x5599ff)];
  
  for (let i = 0; i < starCount; i++) {
    const r = 300 + Math.random() * 800;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    starPos[i*3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i*3+1] = r * Math.cos(phi);
    starPos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
    
    // Varying star colors for depth and realism
    const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    starColors[i*3] = col.r;
    starColors[i*3+1] = col.g;
    starColors[i*3+2] = col.b;
  }
  
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  
  // Custom glowing star material
  const starMat = new THREE.PointsMaterial({ 
    size: isMobile ? 1.5 : 2.0, 
    vertexColors: true, 
    sizeAttenuation: true, 
    transparent: true, 
    opacity: 0.9,
    map: (function(){
        const cvs = document.createElement('canvas'); cvs.width = 16; cvs.height = 16;
        const ctx = cvs.getContext('2d');
        const grad = ctx.createRadialGradient(8,8,0, 8,8,8);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad; ctx.fillRect(0,0,16,16);
        return new THREE.CanvasTexture(cvs);
    })(),
    depthWrite: false, 
    blending: THREE.AdditiveBlending
  });
  scene.add(new THREE.Points(starGeo, starMat));

  // Cinematic Lighting Setup
  // Hemisphere light gives a subtle dark space ambience to the unlit sides of planets
  scene.add(new THREE.HemisphereLight(0x0a1220, 0x050810, 3.0)); 
  
  // The Sun's actual light source (intense, warm)
  const sunLight = new THREE.PointLight(0xFFFFFF, 3.5, 0, 0.1); 
  scene.add(sunLight); window._wheelSunLight = sunLight;
  
  // Subtle blue rim light for 3D volume
  const rimLight = new THREE.DirectionalLight(0x4F9BE0, 0.8);
  rimLight.position.set(-100, 50, -50);
  scene.add(rimLight);

  scene.add(zodiacRingGroup);
  scene.add(aspectLineGroup);

  buildZodiacRingGroup();
  enhanceZodiac();
  drawBorders();
  zodiacRingGroup.visible = true;
  aspectLineGroup.visible = false;

  canvas.addEventListener('pointerdown', (e)=>{
    e.preventDefault();
    isDragging=true; lastPointer={x:e.clientX,y:e.clientY}; autoRotate=false; spinVT = spinVP = 0; zoomGoal = null;
    pointerDownPos = {x:e.clientX,y:e.clientY};
    markDirty();
  });
  window.addEventListener('pointerup', (e)=>{
    isDragging=false;
    if (performance.now() - lastMoveTs > 90) spinVT = spinVP = 0;   // held still before release -> no fling
    if (pointerDownPos){
      const moved = Math.hypot(e.clientX-pointerDownPos.x, e.clientY-pointerDownPos.y);
      if (moved < 6) handleCanvasClick(e); // treat as a tap/click, not a drag
    }
    pointerDownPos = null;
  });
  window.addEventListener('pointercancel', ()=> isDragging=false);
  window.addEventListener('pointermove', (e)=>{
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX-lastPointer.x, dy = e.clientY-lastPointer.y;
    if (camMode==="free"){
      freeCamYaw += dx*0.005;
      freeCamPitch = Math.max(-1.5, Math.min(1.5, freeCamPitch - dy*0.005));
    } else {
      orbitAngleTheta -= dx*0.006;
      orbitAnglePhi = Math.max(0.15, Math.min(Math.PI-0.15, orbitAnglePhi - dy*0.006));
      if (!reduceMotion){ spinVT = spinVT*0.4 - dx*0.006*0.6; spinVP = spinVP*0.4 - dy*0.006*0.6; lastMoveTs = performance.now(); }
    }
    lastPointer = {x:e.clientX,y:e.clientY};
    markDirty();
  }, {passive:false});

  // Pinch-to-zoom (two-finger touch)
  let pinchStartDist = null, pinchStartOrbit = null;
  canvas.addEventListener('touchstart', (e)=>{
    if (e.touches.length===2){
      isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist = Math.hypot(dx,dy);
      pinchStartOrbit = orbitDist;
    }
  }, {passive:true});
  canvas.addEventListener('touchmove', (e)=>{
    if (e.touches.length===2 && pinchStartDist){
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx,dy);
      const scale = pinchStartDist/dist;
      orbitDist = clampZoom(pinchStartOrbit*scale);
      markDirty();
    }
  }, {passive:false});
  canvas.addEventListener('touchend', (e)=>{ if (e.touches.length<2) pinchStartDist=null; }, {passive:true});
  canvas.addEventListener('wheel', (e)=>{
    e.preventDefault();
    if (camMode==="free"){
      const forward = new THREE.Vector3(Math.cos(freeCamPitch)*Math.cos(freeCamYaw), Math.sin(freeCamPitch), Math.cos(freeCamPitch)*Math.sin(freeCamYaw));
      freeCamPos.addScaledVector(forward, -e.deltaY*0.03);
    } else {
      const zb = zoomGoal != null ? zoomGoal : orbitDist;
      const zn = clampZoom(SOL.view==="solar" ? zb*(1 + e.deltaY*0.0012) : zb + e.deltaY*0.02);
      if (reduceMotion) orbitDist = zn; else { zoomGoal = zn; zoomSet = orbitDist; }
    }
    markDirty();
  }, {passive:false});

  // Keyboard controls for free-fly (desktop): WASD/arrows to move, Q/E for down/up
  window.addEventListener('keydown', (e)=>{
    if (camMode!=="free") return;
    switch(e.code){
      case 'KeyW': case 'ArrowUp': freeMoveState.fwd = 1; break;
      case 'KeyS': case 'ArrowDown': freeMoveState.fwd = -1; break;
      case 'KeyA': case 'ArrowLeft': freeMoveState.right = -1; break;
      case 'KeyD': case 'ArrowRight': freeMoveState.right = 1; break;
      case 'KeyE': freeMoveState.up = 1; break;
      case 'KeyQ': freeMoveState.up = -1; break;
    }
  });
  window.addEventListener('keyup', (e)=>{
    switch(e.code){
      case 'KeyW': case 'ArrowUp': case 'KeyS': case 'ArrowDown': freeMoveState.fwd = 0; break;
      case 'KeyA': case 'ArrowLeft': case 'KeyD': case 'ArrowRight': freeMoveState.right = 0; break;
      case 'KeyE': case 'KeyQ': freeMoveState.up = 0; break;
    }
  });

  setupFreeFlyJoystick();

  window.addEventListener('resize', onResize);
  onResize();
}


/* ---- PROCEDURAL TEXTURE GENERATORS ---- */
function generatePlanetTexture(name, hexColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;

  // Base fill
  ctx.fillStyle = '#' + hexColor.toString(16).padStart(6, '0');
  ctx.fillRect(0, 0, w, h);

  // Generic surface noise (simulates craters and rock textures)
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const r = Math.random() * 2.5;
    ctx.fillStyle = Math.random() > 0.5 ? '#000000' : '#ffffff';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  
  ctx.globalAlpha = 1.0;

  // Planet-specific features
  if (name === 'Jupiter' || name === 'Saturn') {
    const bands = name === 'Jupiter' ? 20 : 12;
    for (let i = 0; i < bands; i++) {
      const y = (i / bands) * h;
      const bh = (1 / bands) * h * (0.3 + Math.random() * 0.7);
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(120,60,0,0.18)';
      ctx.fillRect(0, y, w, bh);
    }
    if (name === 'Jupiter') {
      // Great Red Spot
      ctx.fillStyle = 'rgba(180, 60, 20, 0.5)';
      ctx.beginPath(); ctx.ellipse(w * 0.6, h * 0.65, 35, 15, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (name === 'Earth') {
    // Green Continents
    ctx.fillStyle = '#2b6a3a'; 
    for (let i = 0; i < 40; i++) {
      ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 15 + Math.random() * 30, 0, Math.PI * 2); ctx.fill();
    }
    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 60; i++) {
      ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 8 + Math.random() * 20, 0, Math.PI * 2); ctx.fill();
    }
  } else if (name === 'Mars') {
    // Rusty patches
    ctx.fillStyle = 'rgba(80, 20, 0, 0.35)';
    for (let i = 0; i < 50; i++) {
      ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 10 + Math.random() * 40, 0, Math.PI * 2); ctx.fill();
    }
    // Ice caps
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(0, 0, w, 20);
    ctx.fillRect(0, h - 20, w, 20);
  } else if (name === 'Sun') {
    // Solar flares/plasma
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 40);
      grad.addColorStop(0, 'rgba(255, 230, 120, 0.8)');
      grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2); ctx.fill();
    }
  } else if (name === 'Venus') {
    // Thick atmosphere layers
    ctx.fillStyle = 'rgba(255, 240, 200, 0.4)';
    for (let i = 0; i < 15; i++) {
      ctx.fillRect(0, Math.random() * h, w, 20 + Math.random() * 30);
    }
  } else if (name === 'Moon' || name === 'Mercury') {
    // Extreme craters
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const r = 5 + Math.random() * 15;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function generateRingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 1;
  const ctx = canvas.getContext('2d');
  
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, 'rgba(232, 185, 92, 0.1)');
  grad.addColorStop(0.2, 'rgba(232, 185, 92, 0.8)');
  grad.addColorStop(0.5, 'rgba(232, 185, 92, 0.3)');
  grad.addColorStop(0.8, 'rgba(232, 185, 92, 0.9)');
  grad.addColorStop(1, 'rgba(232, 185, 92, 0.0)');
  
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, 1);
  return new THREE.CanvasTexture(canvas);
}

function makeSphere(radius, colorHex, emissiveHex, name){
  const geo = new THREE.SphereGeometry(radius, 64, 64); // Ultra-high poly sphere
  const isSun = name === 'Sun';
  
  // Upgrade to Physical Material for hyper-realistic lighting & clearcoat reflections
  const matOpts = { 
    color: colorHex, 
    roughness: (name === 'Earth' || name === 'Venus') ? 0.3 : 0.8, 
    metalness: (name === 'Earth' || name === 'Venus') ? 0.1 : 0.3,
    clearcoat: name === 'Earth' ? 0.4 : 0.0,
    clearcoatRoughness: 0.2
  };

  if (emissiveHex) {
    matOpts.emissive = emissiveHex;
    matOpts.emissiveIntensity = 0.6;
  }

  if (name) {
    matOpts.map = generatePlanetTexture(name, colorHex);
    
    // Auto-generate realistic bump maps from the procedural texture to give mountains/craters depth
    if (['Moon', 'Mercury', 'Mars'].includes(name)) {
      matOpts.bumpMap = matOpts.map;
      matOpts.bumpScale = name === 'Mars' ? 0.06 : 0.09;
    }
    
    if (isSun) {
      matOpts.emissiveMap = matOpts.map;
      matOpts.emissive = colorHex;
      matOpts.emissiveIntensity = 2.5; // Brighter sun core
      matOpts.roughness = 1.0;
    }
  }

  const mat = new THREE.MeshPhysicalMaterial(matOpts);
  const mesh = new THREE.Mesh(geo, mat);

  // Saturn's Rings
  if (name === 'Saturn') {
     const ringGeo = new THREE.RingGeometry(radius * 1.4, radius * 2.4, 64);
     
     // Correct UV mapping so linear gradient wraps in a circle
     const pos = ringGeo.attributes.position;
     const v3 = new THREE.Vector3();
     for (let i = 0; i < pos.count; i++){
        v3.fromBufferAttribute(pos, i);
        const r = v3.length();
        const uvX = (r - radius * 1.4) / (radius * 2.4 - radius * 1.4);
        ringGeo.attributes.uv.setXY(i, uvX, 0.5);
     }
     
     const ringMat = new THREE.MeshStandardMaterial({
        color: 0xffeebb, transparent: true, opacity: 0.95, side: THREE.DoubleSide,
        map: generateRingTexture(), roughness: 0.8
     });
     const ring = new THREE.Mesh(ringGeo, ringMat);
     ring.rotation.x = Math.PI / 2 + 0.15; // Realistic tilt
     mesh.add(ring);
  }

  // Cinematic Atmospheric Glows (Multi-layered Additive Blending)
  if (name === 'Earth') {
     const atmosGeo = new THREE.SphereGeometry(radius * 1.04, 32, 32);
     const atmosMat = new THREE.MeshBasicMaterial({ color: 0x66B0FF, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending });
     mesh.add(new THREE.Mesh(atmosGeo, atmosMat));
     
     const outerAtmosGeo = new THREE.SphereGeometry(radius * 1.15, 32, 32);
     const outerAtmosMat = new THREE.MeshBasicMaterial({ color: 0x2266FF, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending });
     mesh.add(new THREE.Mesh(outerAtmosGeo, outerAtmosMat));
  } else if (name === 'Venus') {
     const atmosGeo = new THREE.SphereGeometry(radius * 1.05, 32, 32);
     const atmosMat = new THREE.MeshBasicMaterial({ color: 0xFFD280, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
     mesh.add(new THREE.Mesh(atmosGeo, atmosMat));
  } else if (isSun) {
     const glowGeo = new THREE.SphereGeometry(radius * 1.3, 48, 48);
     const glowMat = new THREE.MeshBasicMaterial({ color: 0xFFEA8C, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });
     mesh.add(new THREE.Mesh(glowGeo, glowMat));
     
     const coronaGeo = new THREE.SphereGeometry(radius * 1.9, 32, 32);
     const coronaMat = new THREE.MeshBasicMaterial({ color: 0xFF7700, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending });
     mesh.add(new THREE.Mesh(coronaGeo, coronaMat));
     
     const haloGeo = new THREE.SphereGeometry(radius * 3.0, 32, 32);
     const haloMat = new THREE.MeshBasicMaterial({ color: 0x882200, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending });
     mesh.add(new THREE.Mesh(haloGeo, haloMat));
  } else if (name === 'Rahu' || name === 'Ketu') {
     matOpts.transparent = true; matOpts.opacity = 0.85; mat.needsUpdate = true;
     const glowGeo = new THREE.SphereGeometry(radius * 1.3, 32, 32);
     const glowMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending });
     mesh.add(new THREE.Mesh(glowGeo, glowMat));
  }

  return mesh;
}

function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

const SIGN_COLORS = [0xD64545,0x4F9A5F,0xE0C34A,0x8FB8D8,0xE8892F,0x7A9A5A,0xE07FAE,0x9B2D47,0x8458C9,0x5E6E86,0x3FA7E0,0x2FB9A8];
const signHex = i => '#' + SIGN_COLORS[i].toString(16).padStart(6,'0');
function buildZodiacRingGroup(){
  const ringRadius = 12;
  // 12 sign sectors.
  // NOTE on coordinate convention: every planet marker, aspect line, and the
  // sign-label anchors below place world position as
  //   (cos(lon)*r, 0, -sin(lon)*r)
  // RingGeometry is authored in its own local XY plane (theta measured the
  // normal/counter-clockwise way) and then rotated flat with rotation.x =
  // Math.PI/2, which maps local angle theta -> world (cos(theta)*r, 0,
  // sin(theta)*r) — the OPPOSITE z-sign from planets. Left as-is, the sign
  // wedges/labels render mirrored across the Aries–Libra axis relative to
  // where the actual planet markers sit. To match, we negate the angle
  // (thetaStart = -a1, sweeping by +(a1-a0)) so local theta = -ang.
  for (let i=0;i<12;i++){
    const a0 = (i*30)*DEG, a1=((i+1)*30)*DEG;
    const shape = new THREE.RingGeometry(ringRadius-0.6, ringRadius+0.6, 32, 1, -a1, a1-a0);
    const mat = new THREE.MeshBasicMaterial({ color: SIGN_COLORS[i], side:THREE.DoubleSide, transparent:true, opacity:0.92 });
    const mesh = new THREE.Mesh(shape, mat);
    mesh.rotation.x = Math.PI/2;
    zodiacRingGroup.add(mesh);
  }
  // Divider lines every 30deg (uses the SAME -sin(z) convention as planet
  // markers / aspect lines / sign-label anchors below, so the wedge grid
  // lines up exactly with where planets actually render — previously this
  // used +sin(z) while everything else used -sin(z), causing the whole
  // sign grid & nakshatra ticks to render mirrored relative to the planets)
  for (let i=0;i<12;i++){
    const ang = (i*30)*DEG;
    const pts = [ new THREE.Vector3(Math.cos(ang)*(ringRadius-0.6),0,-Math.sin(ang)*(ringRadius-0.6)),
                  new THREE.Vector3(Math.cos(ang)*(ringRadius+0.6),0,-Math.sin(ang)*(ringRadius+0.6)) ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({color:0x5A7A9B}));
    zodiacRingGroup.add(line);
  }
  // Nakshatra boundary ticks & New Outer Nakshatra Circle
  const outerRingRadius = 13.5;
  for (let i=0;i<27;i++){
    const ang = (i*(360/27))*DEG;
    // Inner ticks on main zodiac ring
    const pts = [ new THREE.Vector3(Math.cos(ang)*(ringRadius-0.25),0,-Math.sin(ang)*(ringRadius-0.25)),
                  new THREE.Vector3(Math.cos(ang)*(ringRadius+0.25),0,-Math.sin(ang)*(ringRadius+0.25)) ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({color:0x2A3A55, transparent:true, opacity:0.6}));
    zodiacRingGroup.add(line);
    
    // Outer Nakshatra ring ticks
    const ptsOuter = [ new THREE.Vector3(Math.cos(ang)*(outerRingRadius-0.3),0,-Math.sin(ang)*(outerRingRadius-0.3)),
                       new THREE.Vector3(Math.cos(ang)*(outerRingRadius+0.3),0,-Math.sin(ang)*(outerRingRadius+0.3)) ];
    const geoOuter = new THREE.BufferGeometry().setFromPoints(ptsOuter);
    const lineOuter = new THREE.Line(geoOuter, new THREE.LineBasicMaterial({color:0x3A4A65, transparent:true, opacity:0.4}));
    zodiacRingGroup.add(lineOuter);
  }
  
  // 27 Colored Nakshatra arcs filled with their ruling Lord's color
  for (let i = 0; i < 27; i++) {
    const lord = NAKSHATRA_LORDS[i];
    const lordColorHex = parseInt((PLANET_COLORS[lord] || "#00F0D5").replace('#', ''), 16);
    
    // Calculate precise start and end angles, inverted for 3D orientation (-a1, a1-a0)
    const a0 = (i * (360 / 27)) * DEG;
    const a1 = ((i + 1) * (360 / 27)) * DEG;
    
    // Create a thick, colored wedge for each Nakshatra
    const arcGeo = new THREE.RingGeometry(outerRingRadius - 0.3, outerRingRadius + 0.3, 12, 1, -a1, a1 - a0);
    const arcMat = new THREE.MeshBasicMaterial({ 
      color: lordColorHex, 
      side: THREE.DoubleSide, 
      transparent: true, 
      opacity: 0.42 // Subtle transparency so it looks glowing but not overwhelming
    });
    
    const arcMesh = new THREE.Mesh(arcGeo, arcMat);
    arcMesh.rotation.x = Math.PI / 2;
    zodiacRingGroup.add(arcMesh);
  }
  
  // Thin boundary line to contain the colored arcs neatly on the outside
  const outerTrackGeo = new THREE.RingGeometry(outerRingRadius + 0.3, outerRingRadius + 0.34, 128);
  const outerTrackMat = new THREE.MeshBasicMaterial({ color: 0x3A4A65, side:THREE.DoubleSide, transparent:true, opacity:0.5 });
  const outerTrackMesh = new THREE.Mesh(outerTrackGeo, outerTrackMat);
  outerTrackMesh.rotation.x = Math.PI/2;
  zodiacRingGroup.add(outerTrackMesh);
  
  // Earth at center
  const earth = makeSphere(0.5, 0x4F9BE0, 0, 'Earth');
  zodiacRingGroup.add(earth);
  bodyMeshes["geo_earth"] = earth;

  // Planet markers
  const planetOrbitRadius = { Sun:4, Moon:2.6, Mercury:5, Venus:6, Mars:7, Jupiter:8, Saturn:9.2, Rahu:10.2, Ketu:10.2, Uranus:10.6, Neptune:10.95, Pluto:11.3 };
  ALL_BODIES.forEach(name=>{
    const mesh = makeSphere(name==="Sun"?0.5: name==="Moon"?0.4: OUTER_LIST.includes(name)?0.26:0.32, parseInt(PLANET_COLORS[name].replace('#',''),16), name==="Sun"?0xFFB347:0, name);
    zodiacRingGroup.add(mesh);
    bodyMeshes["geo_"+name] = mesh;
  });

  // Invisible anchor points for HTML sign-name labels
  for (let i=0;i<12;i++){
    const midAng = ((i*30)+15)*DEG;
    const anchor = new THREE.Object3D();
    anchor.position.set(Math.cos(midAng)*(ringRadius+1.5), 0, -Math.sin(midAng)*(ringRadius+1.5));
    zodiacRingGroup.add(anchor);
    bodyMeshes["signlabel_"+i] = anchor;
  }
}


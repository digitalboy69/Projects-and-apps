/* ============================================================================
   WHEEL BEAUTY PASS (3D Sky, Zodiac Wheel view). Runs once the scene exists and only adds or swaps visuals; no astronomy is touched.
   1. Smooth glows: the Sun, Earth, Venus, Rahu and Ketu were wrapped in hard-edged see-through shells that showed as flat rings. They are removed and
      the Sun gets a soft layered glow (core, corona, halo) made of gradient sprites instead (the Earth, Venus and nodes keep their softer rim shaders).
   2. A degree scale on the sign ring: a tick every degree, longer at 5 and 10, brightest at each sign boundary (one draw call).
   3. A soft golden aura around the ring so the wheel feels lit from within.
   4. Gentle life: the Sun glow breathes and the twelve ring gems twinkle, only while frames are being drawn anyway (no extra animation loop).
   Switch off for testing with localStorage vax3d_beauty = '0'. Test: tests/sky3d_ui_refresh_browser_test.py (stub) and a real-WebGL look in the screenshots.
   ============================================================================ */
(function(){
  'use strict';
  try { if (localStorage.getItem('vax3d_beauty') === '0') return; } catch(e){}
  const R = 12;
  function tex(stops, size){
    const c = document.createElement('canvas'); c.width = c.height = size || 256; const x = c.getContext('2d'), h = c.width / 2;
    const g = x.createRadialGradient(h, h, 0, h, h, h); stops.forEach(s => g.addColorStop(s[0], s[1])); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    return new THREE.CanvasTexture(c);
  }
  /* smoother than the shared glow texture: eased fall-off, no visible edge */
  const SOFT = [[0, 'rgba(255,255,255,1)'], [0.12, 'rgba(255,255,255,.7)'], [0.3, 'rgba(255,255,255,.3)'], [0.55, 'rgba(255,255,255,.1)'], [0.8, 'rgba(255,255,255,.025)'], [1, 'rgba(255,255,255,0)']];
  const sprite = (map, hex, scale, op) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, color: hex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.set(scale, scale, 1); return s; };
  let live = null;
  function strip(mesh){
    mesh.children.slice().forEach(c => {
      if (c.isMesh && c.material && c.material.type === 'MeshBasicMaterial' && c.geometry && c.geometry.type === 'SphereGeometry' && c.material.blending === THREE.AdditiveBlending){
        mesh.remove(c); c.geometry.dispose(); c.material.dispose();
      }
    });
  }
  function build(){
    if (typeof bodyMeshes === 'undefined' || !bodyMeshes.geo_Sun || typeof zodiacRingGroup === 'undefined' || !zodiacRingGroup.children.length) return false;
    ['geo_Sun', 'geo_earth', 'geo_Venus', 'geo_Rahu', 'geo_Ketu'].forEach(k => { if (bodyMeshes[k]) strip(bodyMeshes[k]); });
    const soft = tex(SOFT), sun = bodyMeshes.geo_Sun, r = sun.geometry.parameters.radius;
    const core = sprite(soft, 0xFFF3C4, r * 6, 1), corona = sprite(soft, 0xFFB347, r * 12, 0.7), halo = sprite(soft, 0xFF6A2A, r * 24, 0.3);
    [halo, corona, core].forEach(s => sun.add(s));
    /* the stripped shells also gave Earth its blue body glow and the Moon its pale rim: give both back as soft glows */
    const earth = bodyMeshes.geo_earth, moon = bodyMeshes.geo_Moon;
    if (earth){ const er = earth.geometry.parameters.radius; earth.add(sprite(soft, 0x4F9BE0, er * 4.2, 0.75), sprite(soft, 0x9BD0FF, er * 2.2, 0.45)); }
    if (moon){ const mr = moon.geometry.parameters.radius; moon.add(sprite(soft, 0xCFD8FF, mr * 3.4, 0.4)); }
    /* a faint lift over the dark sides so Earth and the Moon never read as black discs (earthshine) */
    const lift = (m, hex, op) => { const rr = m.geometry.parameters.radius; m.add(new THREE.Mesh(new THREE.SphereGeometry(rr * 1.015, 32, 32), new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }))); };
    if (earth) lift(earth, 0x2F66B8, 0.3); if (moon) lift(moon, 0x8E98C4, 0.2);
    /* degree scale */
    const pts = [], col = [];
    for (let d = 0; d < 360; d++){
      const t = d * Math.PI / 180, c = Math.cos(t), s = -Math.sin(t), big = d % 30 === 0, ten = d % 10 === 0, five = d % 5 === 0;
      const r0 = big ? 11.45 : R + 0.55, r1 = big ? R + 0.55 : R + 0.55 + (ten ? 0.4 : five ? 0.26 : 0.12), b = big ? 1 : ten ? 0.75 : five ? 0.55 : 0.32;
      pts.push(c * r0, 0.01, s * r0, c * r1, 0.01, s * r1); col.push(1 * b, 0.88 * b, 0.55 * b, 1 * b, 0.88 * b, 0.55 * b);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const ticks = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    zodiacRingGroup.add(ticks);
    /* golden aura */
    const aura = new THREE.Mesh(new THREE.CircleGeometry(16, 96), new THREE.MeshBasicMaterial({
      map: tex([[0, 'rgba(0,0,0,0)'], [0.62, 'rgba(0,0,0,0)'], [0.74, 'rgba(244,196,92,.28)'], [0.78, 'rgba(244,196,92,.38)'], [0.86, 'rgba(244,196,92,.14)'], [1, 'rgba(244,196,92,0)']], 512),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    aura.rotation.x = -Math.PI / 2; aura.position.y = -0.06; zodiacRingGroup.add(aura);
    /* inner plate: a faint indigo-to-teal glow toward the centre for depth */
    const plate = new THREE.Mesh(new THREE.CircleGeometry(11.4, 96), new THREE.MeshBasicMaterial({
      map: tex([[0, 'rgba(90,80,200,.34)'], [0.55, 'rgba(40,80,150,.16)'], [1, 'rgba(0,0,0,0)']], 256), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    plate.rotation.x = -Math.PI / 2; plate.position.y = -0.09; zodiacRingGroup.add(plate);
    const gems = zodiacRingGroup.children.filter(c => c.isSprite && Math.abs(c.scale.x - 0.45) < 1e-6);
    live = { corona, halo, core, gems, r };
    if (typeof markDirty === 'function') markDirty();
    return true;
  }
  window.wheelBeautyTick = function(){
    if (!live) return; const t = performance.now() / 1000;
    const k = 1 + 0.05 * Math.sin(t * 1.4);
    live.corona.scale.set(live.r * 12 * k, live.r * 12 * k, 1); live.halo.scale.set(live.r * 24 * (1 + 0.03 * Math.sin(t * 0.9 + 1)), live.r * 24 * (1 + 0.03 * Math.sin(t * 0.9 + 1)), 1);
    live.gems.forEach((s, i) => { s.material.opacity = 0.55 + 0.25 * Math.sin(t * 1.8 + i * 0.9); });
  };
  /* the tick rides on the label update that follows every drawn frame */
  if (typeof updatePlanetLabels === 'function'){ const _u = updatePlanetLabels; window.updatePlanetLabels = updatePlanetLabels = function(){ try { window.wheelBeautyTick(); } catch(e){} return _u.apply(this, arguments); }; }
  let tries = 0; const iv = setInterval(() => { tries++; let ok = false; try { ok = build(); } catch(e){ console.warn('wheel beauty', e); ok = true; } if (ok || tries > 40) clearInterval(iv); }, 150);
})();

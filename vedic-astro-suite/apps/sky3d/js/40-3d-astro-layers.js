/* ============================================================================
   3D ASTRO LAYERS: natal ghosts + transit arcs, live Lagna, houses, conditions,
   Sade Sati, Rahu-Ketu axis, Moon phase, camera presets, image export
   ============================================================================ */
const A = { ready:false, snap:null, natal:null, np:null, lagnaLon:null, lastArc:0, T:{} };
const CONDEX = { Sun:0, Moon:1, Mars:9, Mercury:5, Jupiter:3, Venus:11, Saturn:6, Rahu:1, Ketu:7 };
const COMBUST = { Moon:12, Mars:17, Mercury:14, Jupiter:11, Venus:10, Saturn:15 };
const ORB_R = { Sun:4, Moon:2.6, Mercury:5, Venus:6, Mars:7, Jupiter:8, Saturn:9.2, Rahu:10.2, Ketu:10.2, Uranus:10.6, Neptune:10.95, Pluto:11.3 };
const _pt = (lon, r)=> new THREE.Vector3(r*Math.cos(lon*DEG), 0, -r*Math.sin(lon*DEG));
const _on = id => document.getElementById(id).checked;

function initAstroLayers(){
  const G = zodiacRingGroup, T = A.T, box = document.getElementById('planetLabels');
  const hexOf = n => new THREE.Color(PLANET_COLORS[n]).getHex();
  const mkLabel = (key, html, cls)=>{
    const obj = new THREE.Object3D(); G.add(obj); bodyMeshes[key] = obj;
    const el = document.createElement('div'); el.className = 'planet-label ' + cls; el.innerHTML = html; el.style.display = 'none'; el.style.opacity = '0';
    box.appendChild(el); labelNodes[key] = { el, label:key }; return { obj, el };
  };
  const flat = (geo, color, op, extra)=> new THREE.Mesh(geo, new THREE.MeshBasicMaterial(Object.assign({ color, transparent:true, opacity:op, side:THREE.DoubleSide, depthWrite:false }, extra||{})));
  // natal ghosts
  T.ghosts = {};
  PLANET_LIST.forEach(n=>{
    const g = mkLabel('ghost_'+n, `<span class="dot" style="background:transparent;border:1.5px solid ${PLANET_COLORS[n]}"></span>${n.slice(0,2)}·N`, 'ghost');
    const r = flat(new THREE.RingGeometry(0.2, 0.27, 28), hexOf(n), 0.95); r.rotation.x = Math.PI/2; g.obj.add(r); g.ring = r; T.ghosts[n] = g;
  });
  T.arcs = new THREE.Group(); G.add(T.arcs);
  // lagna pointer
  T.lagna = new THREE.Group(); G.add(T.lagna);
  const lg = new THREE.PlaneGeometry(14, 0.09); lg.rotateX(-Math.PI/2); lg.translate(7.8, 0.02, 0);
  T.asc = flat(lg, 0xFFFFFF, 0.95); T.dsc = flat(lg, 0xFFFFFF, 0.25); T.dsc.rotation.y = Math.PI; T.lagna.add(T.asc, T.dsc);
  T.ascLbl = mkLabel('ghost_asc', 'ASC', 'asc');
  // current rising sign: gold START / END lines from Earth to the zodiac ring, a soft wedge between them, and a label
  T.riseG = new THREE.Group(); G.add(T.riseG);
  const rg = new THREE.PlaneGeometry(11.7, 0.08); rg.rotateX(-Math.PI/2); rg.translate(6.75, 0.035, 0);
  T.riseA = flat(rg, 0xD4A24A, 0.95); T.riseB = flat(rg.clone(), 0xD4A24A, 0.95); T.riseB.rotation.y = 30*DEG;
  const rw = flat(new THREE.RingGeometry(11.45, 12.55, 32, 1, -30*DEG, 30*DEG), 0xD4A24A, 0.5); rw.rotation.x = Math.PI/2; rw.position.y = 0.03;
  const rf = flat(new THREE.CircleGeometry(12.5, 32, -30*DEG, 30*DEG), 0xD4A24A, 0.07); rf.rotation.x = Math.PI/2; rf.position.y = 0.005;
  T.riseG.add(rf, rw, T.riseA, T.riseB);
  T.riseLbl = mkLabel('ghost_rise', 'Rising', 'asc');
  // houses + Lagna sign highlight
  T.houseLbl = []; for (let h=0; h<12; h++) T.houseLbl.push(mkLabel('ghost_h'+h, String(h+1), 'house'));
  T.wedgeG = new THREE.Group(); const w = flat(new THREE.RingGeometry(11.45, 12.55, 32, 1, -30*DEG, 30*DEG), 0xFFFFFF, 0.3); w.rotation.x = Math.PI/2; w.position.y = 0.02; T.wedgeG.add(w); G.add(T.wedgeG);
  // sade sati zone
  T.sadeG = new THREE.Group(); T.sade = flat(new THREE.RingGeometry(14.05, 14.45, 48, 1, -90*DEG, 90*DEG), 0x9B8CFF, 0.4); T.sade.rotation.x = Math.PI/2; T.sadeG.add(T.sade); G.add(T.sadeG);
  T.sadeLbl = mkLabel('ghost_sade', 'Sade Sati ●', 'sade');
  // rahu-ketu axis
  const ag = new THREE.PlaneGeometry(20.4, 0.05); ag.rotateX(-Math.PI/2); ag.translate(0, 0.015, 0);
  T.axis = flat(ag, 0x9B8CFF, 0.3); G.add(T.axis); T.axisLbl = mkLabel('ghost_axis', '☊ Eclipse season', 'sade');
  // moon phase shell
  const moon = bodyMeshes.geo_Moon, mr = moon.geometry.parameters.radius;
  T.moonU = { sd:{ value:new THREE.Vector3(1,0,0) } };
  moon.add(new THREE.Mesh(new THREE.SphereGeometry(mr*1.02, 40, 40), new THREE.ShaderMaterial({ uniforms:T.moonU, transparent:true, depthWrite:false,
    vertexShader:'varying vec3 vN; void main(){ vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader:'uniform vec3 sd; varying vec3 vN; void main(){ float l=dot(normalize(vN),sd); gl_FragColor=vec4(0.0,0.0,0.03,(1.0-smoothstep(-0.08,0.12,l))*0.88); }' })));
  // controls
  document.querySelectorAll('#tab-view .switch input[id^="L_"]').forEach(i=> i.addEventListener('change', ()=>{ updateOverlays(A.snap); markDirty(); }));
  document.querySelectorAll('.pbtn').forEach(b=> b.addEventListener('click', ()=>{ orbitAnglePhi = { top:0.06, tilt:1.15, side:1.45 }[b.dataset.preset]; setCamMode('orbit'); autoRotate = false; markDirty(); }));
  document.getElementById('lagnaViewBtn').addEventListener('click', ()=>{
    if (A.lagnaLon === null){ alert('Save a natal profile first (Natal tab) so the Lagna can be calculated.'); return; }
    const L = A.lagnaLon*DEG; setCamMode('orbit'); orbitAngleTheta = Math.atan2(-Math.cos(L), -Math.sin(L)); autoRotate = false; markDirty();
  });
  document.getElementById('saveImgBtn').addEventListener('click', ()=>{
    renderer.render(scene, camera); const src = renderer.domElement, c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const x = c.getContext('2d'); x.fillStyle = '#050912'; x.fillRect(0,0,c.width,c.height); x.drawImage(src,0,0);
    const a = document.createElement('a'); a.download = 'ephemeris-wheel.png'; a.href = c.toDataURL('image/png'); a.click();
  });
  const _rn = renderNatalTab; renderNatalTab = function(){ _rn.apply(this, arguments); updateOverlays(A.snap); markDirty(); };
  A.ready = true; updateOverlays(snapshotPositions(currentJD));
}

function updateOverlays(snap){ try { _updateOverlays(snap); } catch(e){ console.warn('overlay update skipped:', e); } }
function _updateOverlays(snap){
  if (!A.ready || !snap) return; A.snap = snap;
  const sid = snap.sidereal, T = A.T, p = isValidProfile(activeNatalProfile) ? activeNatalProfile : null, has = !!p;
  const vis = (lbl, b)=>{ lbl.el.style.opacity = b ? '' : '0'; };
  // conditions on live planet labels
  PLANET_LIST.forEach(n=>{
    const ln = labelNodes['geo_'+n]; if (!ln) return;
    let sp = ln.el.querySelector('.cond'); if (!sp){ sp = document.createElement('span'); sp.className = 'cond'; ln.el.appendChild(sp); }
    let t = ''; const si = getSignIndex(sid[n]);
    if (CONDEX[n] === si) t += ' <b style="color:#6EE7B7">▲</b>'; else if ((CONDEX[n]+6)%12 === si) t += ' <b style="color:#FF6B4A">▼</b>'; else if (SIGNS[si].lord === n) t += ' <b style="color:#F4C45C">★</b>';
    if (COMBUST[n] && Math.abs(angDiff(sid[n], sid.Sun)) < COMBUST[n]) t += ' <b style="color:#FFA94D">☀</b>';
    if (snap.retro[n] && n !== 'Rahu' && n !== 'Ketu') t += ' <b style="color:#FF8A66">℞</b>';
    if (!_on('L_cond')) t = '';
    if (sp._k !== t){ sp._k = t; sp.innerHTML = t; }
  });
  // moon phase
  const mm = bodyMeshes.geo_Moon.position, sm = bodyMeshes.geo_Sun.position;
  T.moonU.sd.value.copy(sm).sub(mm).normalize();
  // rahu-ketu axis + eclipse season
  T.axis.rotation.y = sid.Rahu*DEG; T.axis.visible = _on('L_axis');
  const nodeD = Math.min(Math.abs(angDiff(sid.Sun, sid.Rahu)), Math.abs(angDiff(sid.Sun, sid.Ketu)));
  const ecl = nodeD < 15; T.axis.material.color.set(ecl ? 0xFF6B4A : 0x9B8CFF); T.axis.material.opacity = ecl ? 0.7 : 0.3;
  T.axisLbl.obj.position.copy(_pt(sid.Rahu, 10.9)); vis(T.axisLbl, ecl && _on('L_axis'));
  // natal-dependent layers
  if (has && A.np !== p){ A.np = p; A.natal = snapshotPositions(computeNatalAscendant(p).jd).sidereal; }
  if (!has){ A.np = null; A.natal = null; A.lagnaLon = null; }
  // current rising sign at the viewer's place: start / end lines of the sign
  const liveL = getLiveLoc(), lonR = siderealAscendant(snap.jd, liveL.lat, liveL.lon), rsI = getSignIndex(lonR), riseOn = _on('L_rise');
  A.lagnaLon = lonR; T.riseG.visible = riseOn; T.riseG.rotation.y = rsI*30*DEG;
  T.riseLbl.obj.position.copy(_pt(rsI*30 + 15, 14.4)); T.riseLbl.el.innerHTML = `↑ Rising ${SIGNS[rsI].symbol} ${SIGNS[rsI].name}`; vis(T.riseLbl, riseOn);
  const showN = has && _on('L_natal');
  PLANET_LIST.forEach(n=>{ const g = T.ghosts[n]; if (showN) g.obj.position.copy(_pt(A.natal[n], ORB_R[n])); vis(g, showN); g.ring.visible = showN; });
  const now = performance.now();
  if (!showN){ if (T.arcs.children.length) clearArcs(); }
  else if (now - A.lastArc > 150 || !T.arcs.children.length){
    A.lastArc = now; clearArcs();
    PLANET_LIST.forEach(from=>{
      const offs = ASPECT_OFFSETS[from] || [7], fs = getSignIndex(sid[from]);
      PLANET_LIST.forEach(to=>{
        const off = ((getSignIndex(A.natal[to]) - fs + 12) % 12) + 1; if (off === 1 || !offs.includes(off)) return;
        const p1 = _pt(sid[from], ORB_R[from]), p2 = _pt(A.natal[to], ORB_R[to]), mid = p1.clone().add(p2).multiplyScalar(0.5); mid.y += 0.7;
        T.arcs.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p1, mid, p2), 20, 0.016, 5, false),
          new THREE.MeshBasicMaterial({ color:hexOf(from), transparent:true, opacity:0.55, blending:THREE.AdditiveBlending, depthWrite:false })));
      });
    });
  }
  if (has){
    const lon = lonR; const ls = rsI;
    T.lagna.rotation.y = lon*DEG; T.lagna.visible = _on('L_lagna');
    T.ascLbl.obj.position.copy(_pt(lon, 15.3)); T.ascLbl.el.innerHTML = `ASC ${SIGNS[ls].symbol} ${degreeInSign(lon).deg}°`; vis(T.ascLbl, _on('L_lagna'));
    const hs = _on('L_houses'); T.wedgeG.visible = hs; T.wedgeG.rotation.y = ls*30*DEG;
    T.houseLbl.forEach((h,i)=>{ h.obj.position.copy(_pt(((ls+i)%12)*30+15, 10.95)); vis(h, hs); });
    const ms = getSignIndex(A.natal.Moon), d = (getSignIndex(sid.Saturn) - ms + 12) % 12, active = d === 11 || d === 0 || d === 1, ss = _on('L_sade');
    T.sadeG.visible = ss; T.sadeG.rotation.y = ((ms+11)%12)*30*DEG; T.sade.material.color.set(active ? 0xFF6B4A : 0x9B8CFF); T.sade.material.opacity = active ? 0.9 : 0.35;
    T.sadeLbl.obj.position.copy(_pt(ms*30+15, 15.3)); vis(T.sadeLbl, active && ss);
  } else {
    T.lagna.visible = T.wedgeG.visible = T.sadeG.visible = false; vis(T.ascLbl, false); vis(T.sadeLbl, false); T.houseLbl.forEach(h=> vis(h, false));
  }
}
function clearArcs(){ const g = A.T.arcs; while (g.children.length){ const c = g.children[0]; g.remove(c); c.geometry.dispose(); c.material.dispose(); } }



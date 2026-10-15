/* ----------------------------------------------------------------------
   PLANET LABELS — persistent DOM nodes, positioned via CSS transform only.
   This avoids the innerHTML-rebuild-every-frame pattern that caused lag:
   we create each label div ONCE, then every frame just move it.
   ---------------------------------------------------------------------- */
const labelNodes = {}; // key -> {el, dotEl}
function rebuildLabelNodes(){
  const container = document.getElementById('planetLabels');
  container.innerHTML = "";
  for (const k in labelNodes) delete labelNodes[k];
  const activeSet = ALL_BODIES.map(n=>[n,"geo_"+n]);
  activeSet.forEach(([label,key])=>{
    const el = document.createElement('div');
    el.className = 'planet-label';
    const color = label==="Sun" ? "#FFD84A" : label==="Earth" ? "#4F9BE0" : (PLANET_COLORS[label]||"#8FA3B8");
    el.innerHTML = `<span class="dot" style="background:${color}"></span>${label}`;
    el.style.display = 'none';
    container.appendChild(el);
    labelNodes[key] = { el, label };
  });

  // Sign-name labels around the zodiac ring (geo mode only)
  if (mode==="geo"){
    for (let i=0;i<12;i++){
      const el = document.createElement('div');
      el.className = 'sign-label el-' + ['fire','earth','air','water'][i%4];
      el.style.setProperty('--ec', signHex(i));
      el.innerHTML = `<span class="sign-glyph">${SIGNS[i].symbol}</span><span class="sign-name-text">${SIGNS[i].name}</span>`;
      el.style.display = 'none';
      container.appendChild(el);
      labelNodes["signlabel_"+i] = { el, label: SIGNS[i].name, isSign:true };
    }
  }
  if (SOL.built) solMakeLabels();
}

let _vw = 0, _vh = 0;
new ResizeObserver(e=>{ _vw = e[0].contentRect.width; _vh = e[0].contentRect.height; }).observe(document.querySelector('.viewport'));
function updatePlanetLabels(){
  const w = _vw || document.querySelector('.viewport').clientWidth, h = _vh || document.querySelector('.viewport').clientHeight;
  for (const key in labelNodes){
    const { el, label, isSign } = labelNodes[key];
    let mesh = bodyMeshes[key];
    if (!mesh || mesh.visible===false || (mesh.parent && mesh.parent.visible===false)){ el.style.display='none'; continue; }
    const pos = mesh.position.clone();
    pos.project(camera);
    if (pos.z > 1){ el.style.display='none'; continue; }
    const sx = (pos.x*0.5+0.5)*w;
    const sy = (-pos.y*0.5+0.5)*h;
    if (sx<-60||sx>w+60||sy<-60||sy>h+60){ el.style.display='none'; continue; }
    el.style.display = '';
    el.style.transform = isSign
      ? `translate(${sx}px, ${sy}px) translate(-50%,-50%)`
      : `translate(${sx}px, ${sy}px) translate(-50%,-140%)`;
  }
}


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
/* Planet labels, placed so they do not sit on top of each other (the Sun, Mercury and Venus often share a spot).
   Sign badges are placed first (they stay put); each planet name then takes the first free spot from this list: above, right, left, below,
   then stepping further down. Widths are measured once per text so this adds no layout work while the sky moves. */
function _lblBox(el){ const t = el.textContent; if (el._t !== t || !el._w){ el._t = t; el._w = el.offsetWidth || (t.length * 7 + 18); el._h = el.offsetHeight || 22; } return [el._w, el._h]; }
function updatePlanetLabels(){
  const w = _vw || document.querySelector('.viewport').clientWidth, h = _vh || document.querySelector('.viewport').clientHeight;
  const signs = [], planets = [];
  for (const key in labelNodes){
    const { el, isSign } = labelNodes[key];
    let mesh = bodyMeshes[key];
    if (!mesh || mesh.visible===false || (mesh.parent && mesh.parent.visible===false)){ el.style.display='none'; continue; }
    const pos = mesh.position.clone();
    pos.project(camera);
    if (pos.z > 1){ el.style.display='none'; continue; }
    const sx = (pos.x*0.5+0.5)*w;
    const sy = (-pos.y*0.5+0.5)*h;
    if (sx<-60||sx>w+60||sy<-60||sy>h+60){ el.style.display='none'; continue; }
    el.style.display = '';
    (isSign ? signs : planets).push({ el, sx, sy, z: pos.z });
  }
  const placed = [];
  signs.forEach(o => { const [bw, bh] = _lblBox(o.el); o.el.style.transform = `translate(${o.sx}px, ${o.sy}px) translate(-50%,-50%)`; placed.push([o.sx - bw/2, o.sy - bh/2, bw, bh]); });
  const hit = (x, y, bw, bh) => placed.some(r => x < r[0] + r[2] + 2 && x + bw + 2 > r[0] && y < r[1] + r[3] + 1 && y + bh + 1 > r[1]);
  planets.sort((a, b) => a.z - b.z);                       // nearer planets choose first
  planets.forEach(o => {
    const [bw, bh] = _lblBox(o.el), x0 = o.sx - bw/2, yA = o.sy - bh*1.4;
    const tries = [[x0, yA], [o.sx + 9, o.sy - bh/2], [o.sx - bw - 9, o.sy - bh/2], [x0, o.sy + 7]];
    for (let k = 1; k <= 5; k++){ tries.push([o.sx + 9, o.sy - bh/2 + k*(bh+1)], [o.sx - bw - 9, o.sy - bh/2 + k*(bh+1)], [x0, yA - k*(bh+1)], [x0, o.sy + 7 + k*(bh+1)], [o.sx + 9, o.sy - bh/2 - k*(bh+1)], [o.sx - bw - 9, o.sy - bh/2 - k*(bh+1)]); }
    const over = t => placed.reduce((a, r) => a + Math.max(0, Math.min(t[0] + bw, r[0] + r[2]) - Math.max(t[0], r[0])) * Math.max(0, Math.min(t[1] + bh, r[1] + r[3]) - Math.max(t[1], r[1])), 0);
    let pick = tries[0], best = Infinity;
    for (const t of tries){ if (!hit(t[0], t[1], bw, bh)){ pick = t; best = 0; break; } const v = over(t); if (v < best){ best = v; pick = t; } }
    placed.push([pick[0], pick[1], bw, bh]);
    o.el.style.transform = `translate(${pick[0]}px, ${pick[1]}px)`;
  });
}


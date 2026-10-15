/* ============================================================================
   QUICK PLANET PICKER
   ============================================================================ */
function initPlanetPicker(){
  const btn = document.getElementById('planetPickBtn'), ov = document.getElementById('pickOverlay'), box = document.getElementById('pickContent');
  const close = ()=> ov.classList.remove('show');
  window.syncPickBtn = function(){
    if (camMode === 'focus' && focusedPlanetKey){
      const n = focusedPlanetKey.replace(/^(geo_|sol_)/, ''); btn.textContent = PLANET_GLYPHS[n] || (SOL_DATA[n] && SOL_DATA[n].g) || '☉'; btn.style.setProperty('--pc', PLANET_COLORS[n] || '#FFD84A'); btn.classList.add('following'); btn.title = 'Following ' + n + ' (tap to change)';
    } else { btn.textContent = '🪐'; btn.classList.remove('following'); btn.title = 'Select a planet'; }
  };
  function pick(n){
    setCamMode('focus'); focusedPlanetKey = (SOL.view==='solar' ? 'sol_' : 'geo_') + n;
    const sel = document.getElementById('focusPlanetSelect'); if (sel) sel.value = focusedPlanetKey;
    autoRotate = false; updateLegend(); markDirty(); syncPickBtn(); close();
  }
  function wheel(){ setCamMode('orbit'); orbitDist = SOL.view==='solar' ? (SOL.scale==='real'?120:62) : 26; markDirty(); syncPickBtn(); close(); }
  function render(){
    const snap = snapshotPositions(currentJD);
    const solar = SOL.view==='solar', names = solar ? ["Sun"].concat(SOL_BODIES) : ALL_BODIES;
    const tile = (n,i)=>{
      const sel = camMode==='focus' && focusedPlanetKey===(solar?'sol_':'geo_')+n;
      if (solar){
        const col = n==='Sun' ? '#FFD84A' : '#'+SOL_DATA[n].c.toString(16).padStart(6,'0'), g = n==='Sun' ? '☉' : SOL_DATA[n].g;
        const h = n==='Sun' ? {x:0,y:0,z:0} : solHelio(n, currentJD), r = Math.hypot(h.x,h.y,h.z);
        return `<div class="pk-tile ${sel?'sel':''}" style="--pc:${col};--i:${i}" data-p="${n}"><div class="pk-orb">${g}</div><div class="pk-name">${n}</div><div class="pk-sk">from Sun</div><div class="pk-pos">${n==='Sun' ? '—' : r.toFixed(2)+' AU'}</div></div>`;
      }
      const lon = snap.sidereal[n], sg = SIGNS[getSignIndex(lon)], dm = degreeInSign(lon), rx = (n==='Rahu'||n==='Ketu'||snap.retro[n]) ? ' ℞' : '';
      const outer = OUTER_LIST.includes(n), sk = outer ? OUTER_SK[n] : PD[n].sk.split(' ')[0];
      return `<div class="pk-tile ${sel?'sel':''}" style="--pc:${PLANET_COLORS[n]};--i:${i}" data-p="${n}"><button class="pk-info" data-i="${n}" aria-label="Details">i</button>
        <div class="pk-orb">${PLANET_GLYPHS[n]}</div><div class="pk-name">${n}</div><div class="pk-sk">${sk}</div><div class="pk-pos">${sg.symbol} ${dm.deg}°${rx}</div></div>`;
    };
    box.innerHTML = `<div class="pk-title">Select a planet</div><div class="pk-sub">Tap a planet to fly the camera to it.${solar?'':' Tap ⓘ for its full details.'}</div>
      <div class="pk-grid">${names.map(tile).join('')}</div>
      <button class="pk-all" id="pkAll">${solar?'☉ Whole solar system':'◎ Whole wheel view'}</button>`;
    box.querySelectorAll('.pk-tile').forEach(t=> t.addEventListener('click', e=>{
      if (e.target.closest('.pk-info')){ close(); openPlanetDetail(e.target.closest('.pk-info').dataset.i); return; }
      pick(t.dataset.p); }));
    document.getElementById('pkAll').addEventListener('click', wheel);
  }
  btn.addEventListener('click', ()=>{ render(); ov.classList.add('show'); });
  document.getElementById('pickClose').addEventListener('click', close);
  ov.addEventListener('click', e=>{ if (e.target === ov) close(); });
  const _scm = setCamMode; setCamMode = function(m){ _scm(m); syncPickBtn(); };
  document.getElementById('focusPlanetSelect').addEventListener('change', syncPickBtn);
}

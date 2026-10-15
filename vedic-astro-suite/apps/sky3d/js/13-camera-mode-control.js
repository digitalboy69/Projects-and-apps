/* ============================================================================
   CAMERA MODE CONTROL (Orbit / Focus Planet / Free Fly)
   ============================================================================ */
function setCamMode(newCamMode){
  camMode = newCamMode;
  document.querySelectorAll('.cam-mode-btn').forEach(b=> b.classList.toggle('active', b.dataset.cammode===newCamMode));
  document.getElementById('focusPlanetFieldWrap').style.display = newCamMode==="focus" ? '' : 'none';
  document.getElementById('freeFlyHint').style.display = newCamMode==="free" ? '' : 'none';
  document.getElementById('ffMoveStick').classList.toggle('show', newCamMode==="free" && isMobile);
  document.getElementById('ffVertControls').classList.toggle('show', newCamMode==="free" && isMobile);
  if (newCamMode==="free"){
    // seed free camera position from wherever the orbit camera currently is
    freeCamPos.copy(camera.position);
    const dir = new THREE.Vector3(0,0,0).sub(camera.position).normalize();
    freeCamYaw = Math.atan2(dir.z, dir.x);
    freeCamPitch = Math.asin(Math.max(-1,Math.min(1,dir.y)));
    autoRotate = false;
  } else {
    autoRotate = false; // respect user's manual control once they've engaged with view; keep off by default post-load
  }
  updateLegend();
  markDirty();
}

function populateFocusPlanetSelect(){
  const sel = document.getElementById('focusPlanetSelect');
  sel.innerHTML = "";
  const geoOptions = ALL_BODIES.map(n=>[n,"geo_"+n]);
  const options = SOL.view==='solar' ? ["Sun"].concat(SOL_BODIES).map(n=>[n,"sol_"+n]) : geoOptions;
  options.forEach(([label,key])=>{
    const opt = document.createElement('option');
    opt.value = key; opt.textContent = label;
    sel.appendChild(opt);
  });
  if (options.length){
    focusedPlanetKey = options[0][1];
    sel.value = focusedPlanetKey;
  }
}

document.querySelectorAll('.cam-mode-btn').forEach(btn=>{
  btn.addEventListener('click', ()=> setCamMode(btn.dataset.cammode));
});
document.getElementById('focusPlanetSelect').addEventListener('change', (e)=>{
  focusedPlanetKey = e.target.value;
  updateLegend();
  markDirty();
});


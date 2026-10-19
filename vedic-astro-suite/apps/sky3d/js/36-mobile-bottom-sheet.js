/* ---- Mobile bottom-sheet: tap handle to toggle, drag to resize ---- */
(function setupBottomSheet(){
  const sheet = document.getElementById('sidepanel');
  const handle = document.getElementById('sheetHandle');
  let dragStartY = null, dragStartExpanded = false;

  handle.addEventListener('click', ()=>{
    sheet.classList.toggle('expanded');
  });

  handle.addEventListener('pointerdown', (e)=>{
    dragStartY = e.clientY;
    dragStartExpanded = sheet.classList.contains('expanded');
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', (e)=>{
    if (dragStartY===null) return;
    const dy = e.clientY - dragStartY;
    // Dragging up (negative dy) while collapsed -> expand; dragging down while expanded -> collapse
    if (dy < -30 && !dragStartExpanded) sheet.classList.add('expanded');
    if (dy > 30 && dragStartExpanded) sheet.classList.remove('expanded');
  });
  handle.addEventListener('pointerup', ()=>{ dragStartY = null; });
  handle.addEventListener('pointercancel', ()=>{ dragStartY = null; });

  // Tap the 3D scene while the sheet is open -> collapse it (mobile only)
  const mq = window.matchMedia('(max-width: 820px), (max-height: 500px) and (pointer: coarse)');
  document.getElementById('canvas3d').addEventListener('pointerdown', ()=>{
    if (mq.matches) sheet.classList.remove('expanded');
  });

  // Clear view: hide/show the floating controls on small screens (remembered; short landscape phones start hidden)
  const clr = document.getElementById('clearViewBtn'), appEl = document.querySelector('.app');
  const EYE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', EYE_OFF = EYE + '<path d="M3 3l18 18"/></svg>';
  /* eye = "show controls", eye with a line = "hide controls" */
  function setClean(on, remember){
    appEl.classList.toggle('clean', on); clr.classList.toggle('active', on);
    clr.setAttribute('aria-pressed', on ? 'true' : 'false');
    const t = on ? 'Show controls' : 'Hide controls'; clr.title = t; clr.setAttribute('aria-label', t);
    clr.innerHTML = on ? EYE + '</svg>' : EYE_OFF;
    if (remember){ try{ localStorage.setItem('vedic3dClean', on ? '1' : '0'); }catch(e){} }
  }
  let savedClean = null; try{ savedClean = localStorage.getItem('vedic3dClean'); }catch(e){}
  setClean(savedClean === null ? window.matchMedia('(max-height: 500px) and (pointer: coarse)').matches : savedClean === '1', false);
  clr.addEventListener('click', ()=> setClean(!appEl.classList.contains('clean'), true));

  // Timeline: collapsible "jump to date" row on mobile
  const dock = document.getElementById('timelineDock');
  const jt = document.getElementById('tlJumpToggle');
  jt.addEventListener('click', ()=>{
    const open = dock.classList.toggle('show-jump');
    jt.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();


document.getElementById('tlPlayPause').addEventListener('click', (e)=>{
  isPlaying = !isPlaying;
  e.currentTarget.textContent = isPlaying ? "❚❚" : "▶";
  autoRotate = false;
});
document.getElementById('tlStepBack').addEventListener('click', ()=>{ jumpToJD(currentJD-1); });
document.getElementById('tlStepFwd').addEventListener('click', ()=>{ jumpToJD(currentJD+1); });
document.querySelectorAll('.speed-chip').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    document.querySelectorAll('.speed-chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    playSpeedDaysPerSec = parseFloat(chip.dataset.speed);
  });
});

document.getElementById('jumpBtn').addEventListener('click', ()=>{
  const val = document.getElementById('jumpDateInput').value;
  if (!val) return;
  const d = new Date(val);
  // Must convert local input time back to UTC for the astronomy engine to read correctly
  const jd = toJulianDay(d.getUTCFullYear(), d.getUTCMonth()+1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), 0);
  jumpToJD(jd);
});
document.getElementById('nowBtn').addEventListener('click', ()=>{
  const now = new Date();
  const jd = toJulianDay(now.getUTCFullYear(), now.getUTCMonth()+1, now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), 0);
  jumpToJD(jd);
});

document.getElementById('resetViewBtn').addEventListener('click', ()=>{
  orbitAngleTheta=0.55; orbitAnglePhi=1.15; orbitDist = SOL.view==='solar' ? (SOL.scale==='real'?120:62) : 26; autoRotate=true; markDirty();
});


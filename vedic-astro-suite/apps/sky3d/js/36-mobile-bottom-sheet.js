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


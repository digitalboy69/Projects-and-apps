/* ============================================================================
   MAIN REFRESH LOOP
   ============================================================================ */
function refreshAll(){
  const snap = updateSceneForJD(currentJD);
  renderHUD(snap);
  renderSkyTable(snap);
  renderTransitFeed();
  renderConjunctionFeed();
  renderTimeline();
  if (!activeNatalProfile) renderChartTab(snap);
}

/* Animation play/pause driving currentJD forward */
let lastUIThrottle = 0;
function animationTick(ts){
  if (isPlaying){
    if (lastFrameTime===null) lastFrameTime = ts;
    const dt = (ts-lastFrameTime)/1000;
    lastFrameTime = ts;
    currentJD += dt*playSpeedDaysPerSec;
    if (currentJD > timelineWindowEnd){ timelineWindowStart=currentJD-30; timelineWindowEnd=currentJD+365; }
    const snap = updateSceneForJD(currentJD);
    // Throttle DOM-heavy UI updates to ~12fps during playback — the 3D motion stays smooth
    // (driven by renderLoop separately) while text/table updates, which nobody can read at 60fps
    // anyway, stop competing for main-thread time every single frame.
    if (ts - lastUIThrottle > 80){
      lastUIThrottle = ts;
      renderHUD(snap);
      renderSkyTable(snap);
      renderTimelineLight();
    }
  } else {
    lastFrameTime = null;
  }
  requestAnimationFrame(animationTick);
}
// Lightweight timeline update during playback (avoid full feed re-scan every frame)
let lastFullRefresh = 0;
function renderTimelineLight(){
  const span = timelineWindowEnd - timelineWindowStart;
  const frac = Math.max(0, Math.min(1, (currentJD-timelineWindowStart)/span));
  document.getElementById('tlPlayhead').style.left = (frac*100)+"%";
  document.getElementById('tlFill').style.width = (frac*100)+"%";
  const now = performance.now();
  if (now-lastFullRefresh > 2500){
    lastFullRefresh = now;
    const sp = document.getElementById('sidepanel');
    const open = !window.matchMedia('(max-width: 820px)').matches || sp.classList.contains('expanded');
    const act = (document.querySelector('.panel-tab.active')||{dataset:{}}).dataset.tab;
    if (open && act==='transits') renderTransitFeed();
    if (open && act==='conjunctions') renderConjunctionFeed();
    if (open && act==='triggers' && window.__dtRefreshNow) window.__dtRefreshNow();
    const key = Math.round(timelineWindowStart)+'|'+Math.round(timelineWindowEnd);
    if (key!==lastTlKey || now-lastTlAt>10000){ lastTlKey = key; lastTlAt = now; renderTimeline(); }
  }
}
let lastTlKey = '', lastTlAt = 0;


/* ============================================================================
   INIT
   ============================================================================ */
function init(){
  initTimelineWindow();
  populateNatalTz();
  refreshProfileSelect();
  initScene();
  buildSkyTableRows();
  solBuildSizeStrip();
  setViewMode();
  renderLineToggleList();
  applyLineToggles();
  renderChartTab();
  refreshAll();
  renderTransitFilters();
  requestAnimationFrame(renderLoop);
  requestAnimationFrame(animationTick);
  document.getElementById('loadingMask').classList.add('hide');
}
init();
initAstroLayers();
initPlanetPicker();

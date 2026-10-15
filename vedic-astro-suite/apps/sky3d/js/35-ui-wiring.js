/* ============================================================================
   UI WIRING
   ============================================================================ */

document.querySelectorAll('.panel-tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    document.querySelectorAll('.panel-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.panel-section').forEach(s=>s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-'+tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab==="transits"){ renderTransitFilters(); renderTransitFeed(); }
    if (tab.dataset.tab==="conjunctions") renderConjunctionFeed();
    if (tab.dataset.tab==="rising") renderRising(true);
    if (tab.dataset.tab==="chart") renderChartTab();
    if (tab.dataset.tab==="view") updateLineToggleVisibility();
    document.getElementById('sidepanel').classList.add('expanded');
    try { tab.scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' }); } catch(e){}
  });
});


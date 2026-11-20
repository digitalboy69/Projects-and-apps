/* ============================================================================
   LATE PANELS: makes new Home cards safe. A panel registered here is built on demand the first time it is opened, from the chart already on screen,
   so a card can never open to a blank screen, even if the browser still holds an older copy of js/58-render-results.js (the file that normally
   adds each panel). It also puts Choghadiya into the Panchanga panel without needing js/48 to call it, and gives Choghadiya its own panel.
   API: registerLatePanel(id, (chart, profile) => html). Loaded after js/25 (switchAppTab) and js/45/48 (Panchanga).
   ============================================================================ */
(function(){
  const REG = {};
  window.registerLatePanel = function(id, fn){ REG[id] = fn; };
  function ensure(id){
    if (!REG[id] || document.getElementById(id)) return;
    const r = document.getElementById('results'), ch = (typeof currentChartForModal !== 'undefined') ? currentChartForModal : null, pf = window.__vgProf;
    if (!r || !ch || !pf) return;
    let h = ''; try { h = REG[id](ch, pf); } catch(e){ console.warn('late panel', id, e); h = '<div class="meta-err">This screen could not be built. Please refresh the page.</div>'; }
    const d = document.createElement('div'); d.className = 'app-panel'; d.id = id; d.innerHTML = h; r.appendChild(d);
  }
  if (typeof switchAppTab === 'function'){
    const _s = switchAppTab;
    /* Self-heal (once per page load): if a normal tool panel is missing although a chart is showing (it was drawn before that script had loaded, e.g. on a slow connection),
       draw the chart again now that everything has loaded, then open the tool. Panels that are routed on purpose (Rectification Studio, Problem Finder) are left alone. */
    let healed = false;
    const SKIP = { 'panel-home': 1, 'panel-contact': 1, 'panel-export': 1, 'panel-problem': 1 };
    function heal(id){
      try {
        if (healed || SKIP[id] || document.getElementById(id)) return;
        if (typeof HOME_ITEMS === 'undefined' || !HOME_ITEMS.some(i => i[0] === id)) return;
        if (typeof RS_ROUTE !== 'undefined' && RS_ROUTE[id]) return;
        const f = document.getElementById('birthForm'); if (!f || !document.querySelector('#results.show') || !window.__vgProf) return;
        healed = true; console.warn('panel missing, redrawing once:', id);
        f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit', { cancelable: true }));
        setTimeout(() => { if (document.getElementById(id)) window.switchAppTab(id); }, 900);
      } catch (e) { console.warn('heal', e); }
    }
    window.switchAppTab = function(id){ ensure(id); heal(id); return _s.apply(this, arguments); };
  }
  /* Choghadiya inside the Panchanga panel (works with or without a hook in js/48) */
  if (typeof pnRender === 'function'){
    const _p = pnRender;
    window.pnRender = function(){
      _p.apply(this, arguments);
      try {
        const body = document.getElementById('pnBody'); if (!body || body.querySelector('.chg') || typeof PN_CTX === 'undefined' || !PN_CTX || typeof CHG === 'undefined') return;
        const c = PN_CTX, ds = document.getElementById('pnDate').value, ts = document.getElementById('pnTime').value || '00:00'; if (!ds) return;
        const [y, m, d] = ds.split('-').map(Number), [hh, mm] = ts.split(':').map(Number), jd = toJulianDay(y, m, d, hh, mm, 0) - c.tz / 24;
        const P = panchangaAt(jd, c.lat, c.lon, c.tz), h = CHG.html(P, c, jd, P.vara.date); if (!h) return;
        const note = body.querySelector('.pn-note'); if (note) note.insertAdjacentHTML('beforebegin', h); else body.insertAdjacentHTML('beforeend', h);
      } catch(e){ console.warn('choghadiya inject', e); }
    };
  }
  /* registrations */
  const reg = (id, name) => registerLatePanel(id, (c, p) => (window[name] ? window[name](c, p) : ''));
  reg('panel-triggerlab', 'buildTriggerLabPanel'); reg('panel-bhavatclass', 'buildBhavatMasterclassPanel'); reg('panel-vargamatrix', 'buildVargaMatrixPanel'); reg('panel-ppf', 'buildPastPresentFuturePanel'); reg('panel-ai', 'buildAiPanel'); reg('panel-hora', 'buildHoraPanel'); reg('panel-meaninglab', 'buildMeaningLabPanel'); reg('panel-atlas', 'buildAtlasPanel'); reg('panel-avakahada', 'buildAvakahadaPanel'); reg('panel-planetency', 'buildPlanetEncyPanel'); reg('panel-dosha', 'buildDoshaPanel'); reg('panel-choghadiya', 'buildChoghadiyaPanel'); reg('panel-today', 'buildTodayPanel'); reg('panel-prashna', 'buildPrashnaPanel'); reg('panel-kp', 'buildKpPanel'); reg('panel-chakra', 'buildChakraExplorerPanel'); reg('panel-avasthas', 'buildAvasthasPanel'); reg('panel-vimshopaka', 'buildVimshopakaPanel'); reg('panel-upagrahas', 'buildUpagrahasPanel'); reg('panel-sensitive', 'buildSensitiveDegreesPanel'); reg('panel-sudarshana', 'buildSudarshanaPanel'); reg('panel-argala', 'buildArgalaPanel'); reg('panel-bhavat', 'buildBhavatBhavamPanel'); reg('panel-asx', 'buildAshtakavargaExtrasPanel'); reg('panel-synastry', 'buildSynastryPanel'); reg('panel-pcal', 'buildPanchangCalendarPanel'); reg('panel-tools', 'buildToolsPanel'); reg('panel-export', 'buildExportBuilderPanel');
})();

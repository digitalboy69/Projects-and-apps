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
    window.switchAppTab = function(id){ ensure(id); return _s.apply(this, arguments); };
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
  reg('panel-avakahada', 'buildAvakahadaPanel'); reg('panel-planetency', 'buildPlanetEncyPanel'); reg('panel-dosha', 'buildDoshaPanel'); reg('panel-choghadiya', 'buildChoghadiyaPanel');
})();

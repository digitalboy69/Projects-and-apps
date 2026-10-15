/* ---- META: error boundaries around every panel builder ---- */
const SAFE_BUILDERS = {
  buildOverviewPanel:'My Chart', buildPlanetsPanel:'Planets', buildDashaSection:'Dasha', buildYogaSection:'Yogas',
  buildShadbalaSection:'Shadbala', buildNumerologyPanel:'Numerology', buildVedicBirthdayPanel:'Vedic Birthday', buildMatchPanel:'Matching', buildPanchangaPanel:'Panchanga', buildTransitsPanel:'Transits', buildBhavaPanel:'Bhava Chalit', buildAshtakavargaSection:'Ashtakavarga', buildRelationshipsSection:'Relations'
};
Object.keys(SAFE_BUILDERS).forEach(name => {
  const orig = window[name]; if (typeof orig !== 'function') return;
  window[name] = function(){
    try { return orig.apply(this, arguments); }
    catch(err){
      console.error('[' + name + ']', err); APP.report(SAFE_BUILDERS[name], err);
      return `<div class="meta-err"><b>⚠ ${SAFE_BUILDERS[name]} couldn't be built.</b><p>The rest of your chart is fine. Try recalculating; if it keeps happening, use Menu → Contact Developer.</p><details><summary>Technical detail</summary><code>${escapeHtml(String(err && err.message || err))}</code></details></div>`;
    }
  };
});

/* ---- META: back-button routing (phone Back returns to Home instead of leaving the app) ---- */
(function(){
  const base = window.switchAppTab; let replaying = false;
  window.switchAppTab = function(id){
    base(id);
    if (replaying || id === 'panel-export' || id === 'panel-contact') return;
    const h = '#' + id.replace('panel-', '');
    if (location.hash !== h){ try { history.pushState({ p: id }, '', h); } catch(e){} }
  };
  window.addEventListener('popstate', (e) => {
    const id = e.state && e.state.p;
    if (id && document.getElementById(id)){ replaying = true; base(id); replaying = false; }
  });
})();


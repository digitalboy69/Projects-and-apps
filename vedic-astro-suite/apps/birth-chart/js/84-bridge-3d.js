/* ===== Bridge: send the open chart (any divisional chart D1–D144) to the 3D Sky app ===== */
(function(){
  'use strict';
  const KEY = 'vax_bridge_3d';
  function build(varKey){
    const ch = (typeof currentChartForModal !== 'undefined') ? currentChartForModal : null, pr = window.__vgProf;
    if (!ch || !pr || !ch.vargas) return null;
    const vargas = {};
    Object.keys(ch.vargas).forEach(k => {
      const v = ch.vargas[k], m = (typeof VARGAS !== 'undefined' && VARGAS[k]) || {};
      vargas[k] = { name: m.name || k, full: m.full || '', asc: v.ascendantSign, planets: Object.assign({}, v.planetVargaSign) };
    });
    return { ts: Date.now(), key: vargas[varKey] ? varKey : 'D1', vargas,
      profile: { name: pr.name, dob: pr.dob, tob: String(pr.tob).slice(0,5), tobFull: String(pr.tob), tz: +pr.tz, lat: +pr.lat, lon: +pr.lon, place: pr.place || '' } };
  }
  window.vxSend3D = function(varKey){
    const p = build(varKey || 'D1');
    if (!p){ alert('Open a chart first, then send it to 3D Sky.'); return; }
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch(e){}
    /* Open the 3D wheel at the birth moment with THIS divisional chart drawn as the sky (the 3D app reads 'vax_jump_3d', js/99) */
    if (typeof window.vxJump3D === 'function' && p.profile && p.profile.dob){
      const pf = p.profile, m = (typeof VARGAS !== 'undefined' && VARGAS[p.key]) || {}, tob = String(pf.tobFull || pf.tob || '00:00');
      window.vxJump3D({ date: pf.dob, time: tob.split(':').length < 3 ? tob + ':00' : tob, tz: pf.tz, lat: pf.lat, lon: pf.lon, place: pf.place,
        label: p.key === 'D1' ? (pf.name || 'Birth chart') : (p.key + ' ' + (m.name || '') + (pf.name ? ' · ' + pf.name : '')), varga: p.key });
      return;
    }
    if (window.parent && window.parent !== window) window.parent.postMessage('vedic-open-3d', '*');
    else window.location.href = '../sky3d/index.html';
  };
  // button in the Divisional Charts toolbar
  function inject(){
    const tb = document.querySelector('#panel-vargas .varga-toolbar');
    if (!tb || document.getElementById('vx3dBtn')) return;
    const g = document.createElement('div'); g.className = 'varga-control-group';
    g.innerHTML = '<button type="button" class="vx-3d-btn" id="vx3dBtn" title="Open this divisional chart as a sky in 3D, at the birth moment">🌌 Open in 3D</button>';
    tb.appendChild(g);
  }
  const res = document.getElementById('results');
  if (res) new MutationObserver(inject).observe(res, { childList: true, subtree: true });
  document.addEventListener('click', e => {
    if (e.target.closest('#vx3dBtn')) { const sel = document.getElementById('vargaSelect'); window.vxSend3D(sel && sel.value ? sel.value : 'D1'); }   // the chart picked in the toolbar (the chips keep this select in step)
    else if (e.target.closest('[data-3d]')) window.vxSend3D('D1');
  });
})();

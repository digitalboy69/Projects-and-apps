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
      profile: { name: pr.name, dob: pr.dob, tob: String(pr.tob).slice(0,5), tz: +pr.tz, lat: +pr.lat, lon: +pr.lon, place: pr.place || '' } };
  }
  window.vxSend3D = function(varKey){
    const p = build(varKey || 'D1');
    if (!p){ alert('Open a chart first, then send it to 3D Sky.'); return; }
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch(e){}
    if (window.parent && window.parent !== window) window.parent.postMessage('vedic-open-3d', '*');
    else window.location.href = '../sky3d/index.html';
  };
  // button in the Divisional Charts toolbar
  function inject(){
    const tb = document.querySelector('#panel-vargas .varga-toolbar');
    if (!tb || document.getElementById('vx3dBtn')) return;
    const g = document.createElement('div'); g.className = 'varga-control-group';
    g.innerHTML = '<button type="button" class="vx-3d-btn" id="vx3dBtn" title="View this chart in the 3D sky">🌌 View in 3D</button>';
    tb.appendChild(g);
  }
  const res = document.getElementById('results');
  if (res) new MutationObserver(inject).observe(res, { childList: true, subtree: true });
  document.addEventListener('click', e => {
    if (e.target.closest('#vx3dBtn')) window.vxSend3D(typeof currentSelectedVarga !== 'undefined' ? currentSelectedVarga : 'D1');
    else if (e.target.closest('[data-3d]')) window.vxSend3D('D1');
  });
})();

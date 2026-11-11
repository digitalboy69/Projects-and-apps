/* ============================================================================
   WHEEL FRAMING (3D Sky, phone). The 3D scene fills the whole screen, but the top card, view switch, timeline bar and bottom sheet sit on top of it,
   so the wheel used to be centred behind them. This finds the free band of screen between them and shifts the picture so the wheel sits in the middle
   of that band (camera.setViewOffset, which keeps taps and labels correct). wheelFitDist (js/07) uses the band height to choose how far to zoom.
   Re-measured on resize, when the sheet opens or closes, when the view changes and when controls are hidden. Phone widths only; wide screens are untouched.
   Test: tests/sky3d_ui_refresh_browser_test.py (band checks, stubbed Three.js)
   ============================================================================ */
(function(){
  'use strict';
  const vp = document.querySelector('.viewport'); if (!vp) return;
  let last = '';
  function band(){
    const W = vp.clientWidth, H = vp.clientHeight; if (!W || !H || W > 820) return null;
    const vr = vp.getBoundingClientRect(), vis = el => el && el.offsetParent !== null && getComputedStyle(el).display !== 'none';
    let top = 56, bottom = H;                                              // under the top bar by default
    const sw = document.querySelector('.view-switch-wrap'), dock = document.getElementById('timelineDock'), sp = document.getElementById('sidepanel');
    const hud = document.querySelector('.viewport-hud');
    if (vis(hud)) top = Math.max(top, hud.getBoundingClientRect().bottom - vr.top + 6);
    if (vis(sw)) top = Math.max(top, sw.getBoundingClientRect().bottom - vr.top + 6);
    if (vis(dock) && getComputedStyle(dock).opacity !== '0') bottom = Math.min(bottom, dock.getBoundingClientRect().top - vr.top - 6);
    else if (sp) bottom = Math.min(bottom, sp.getBoundingClientRect().top - vr.top - 6);
    if (bottom - top < 120) return null;                                  // nothing sensible: leave the picture centred
    return { top, bottom, H, W, mid: (top + bottom) / 2, h: bottom - top };
  }
  window.wheelBand = band;
  function apply(force){
    if (typeof camera === 'undefined' || !camera || !camera.setViewOffset) return;
    const b = band(), key = b ? [b.W, b.H, Math.round(b.mid), Math.round(b.h)].join() : 'off';
    if (!force && key === last) return; last = key;
    if (!b){ if (camera.view && camera.view.enabled) camera.clearViewOffset(); }
    else camera.setViewOffset(b.W, b.H, 0, -(b.mid - b.H / 2), b.W, b.H);
    camera.updateProjectionMatrix();
    if (typeof markDirty === 'function') markDirty();
  }
  window.wheelFrameUpdate = apply;
  /* re-fit the zoom when the free band changes while the wheel is at its default framing */
  function refit(){
    apply(true);
    if (typeof SOL !== 'undefined' && SOL.view === 'solar') return;
    if (typeof camMode !== 'undefined' && camMode !== 'orbit') return;
    if (typeof orbitDist !== 'undefined' && typeof wheelFitDist === 'function' && window.__wheelAuto !== false){ orbitDist = wheelFitDist(); orbitAnglePhi = wheelFitPhi(); if (typeof markDirty === 'function') markDirty(); }
  }
  /* once the person zooms or drags, stop re-fitting so we never fight their hand */
  ['pointerdown', 'wheel', 'touchstart'].forEach(ev => document.getElementById('canvas3d') && document.getElementById('canvas3d').addEventListener(ev, () => { window.__wheelAuto = false; }, { passive: true }));
  document.getElementById('resetViewBtn') && document.getElementById('resetViewBtn').addEventListener('click', () => { window.__wheelAuto = true; setTimeout(refit, 0); });
  window.addEventListener('resize', () => setTimeout(() => apply(true), 0));
  window.addEventListener('orientationchange', () => setTimeout(refit, 250));
  const watch = [document.getElementById('sidepanel'), document.querySelector('.app'), document.getElementById('timelineDock'), document.getElementById('viewSwitch')].filter(Boolean);
  const mo = new MutationObserver(() => apply(false)); watch.forEach(el => mo.observe(el, { attributes: true, attributeFilter: ['class', 'style'] }));
  if (window.ResizeObserver){ const ro = new ResizeObserver(() => apply(false)); [document.getElementById('timelineDock'), document.querySelector('.viewport-hud'), vp].forEach(el => el && ro.observe(el)); }
  document.addEventListener('click', e => { if (e.target.closest('#viewSwitch,#solScale,#solPresets')) setTimeout(() => apply(true), 80); }, true);
  setTimeout(refit, 600); setTimeout(refit, 2000);
})();

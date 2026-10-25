/* ============================================================================
   JUMP TO THE 3D WHEEL: send an exact moment (and the birth place, so the Rising sign is right) from the
   Rectification Studio to the 3D Sky app. Same storage + message path as js/84-bridge-3d.js.
   vxJump3D({ date:'YYYY-MM-DD', time:'HH:MM:SS', tz, lat, lon, place, label })  -> local time at the birth place.
   The 3D app (apps/sky3d/js/51-jump-from-rectification.js) reads 'vax_jump_3d', switches to the Zodiac Wheel and jumps there.
   ============================================================================ */
(function(){
  'use strict';
  const KEY = 'vax_jump_3d';
  window.vxJump3D = function(o){
    if (!o || !o.date || !o.time){ if (window.rsToast) rsToast('Pick a date and time first'); return; }
    const [y,m,d] = String(o.date).split('-').map(Number), [H,M,S] = String(o.time).split(':').map(Number), tz = +o.tz || 0;
    const ms = Date.UTC(y, m-1, d, H||0, M||0, S||0) - tz*3600000, jd = ms/86400000 + 2440587.5;
    const pay = { ts:Date.now(), jd, local:o.date+' '+String(o.time).slice(0,8), tz, lat:+o.lat, lon:+o.lon, place:o.place || '', label:o.label || 'Rectification' };
    try { localStorage.setItem(KEY, JSON.stringify(pay)); } catch(e){}
    if (window.rsToast) rsToast('Opening the 3D wheel at ' + pay.local + ' ✨');
    if (window.parent && window.parent !== window) window.parent.postMessage('vedic-open-3d', '*');
    else window.location.href = '../sky3d/index.html';
  };
  /* "Show in 3D wheel" buttons inside the studio: the Time Dial and the Second Scan candidate. */
  document.addEventListener('click', e=>{
    const b = e.target.closest('[data-jump3d]'); if (!b) return;
    const pr = (typeof currentProfileForExport !== 'undefined') ? currentProfileForExport : null; if (!pr) return;
    let date, time;
    if (b.dataset.jump3d === 'dial'){
      date = (document.getElementById('rectDate') || {}).value;
      const h = (typeof rectHms !== 'undefined') ? rectHms : { h:0, m:0, s:0 };
      time = [h.h, h.m, h.s].map(n=>String(n).padStart(2,'0')).join(':');
    } else if (b.dataset.jump3d === 'scan'){
      const r = (typeof rectRows !== 'undefined' && typeof rectSelectedIdx !== 'undefined' && rectSelectedIdx != null) ? rectRows[rectSelectedIdx] : null; if (!r) return;
      const sh = shiftLocalDateTime((document.getElementById('rectDate') || {}).value, (document.getElementById('rectCenterTime') || {}).value, r.offsetSec);
      date = sh.dateStr; time = sh.timeStr;
    }
    window.vxJump3D({ date, time, tz:pr.tz, lat:pr.lat, lon:pr.lon, place:pr.place, label:'Rectification' });
  });
})();

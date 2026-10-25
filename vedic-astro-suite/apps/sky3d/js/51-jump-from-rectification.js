/* ============================================================================
   JUMP FROM RECTIFICATION: the Birth Chart app's Rectification Studio / Dasha Lens writes 'vax_jump_3d'
   ({ ts, jd (UTC Julian Day), local, tz, lat, lon, place, label }). Here we switch to the Zodiac Wheel, jump the
   sky to that exact moment, pause playback, and show the Rising sign for the BIRTH PLACE (for this session only:
   the saved 'where are you now' place is never overwritten).
   Triggers: the shell's bridge ping, the storage event, and a check at load.
   ============================================================================ */
(function(){
  'use strict';
  const KEY = 'vax_jump_3d'; let done = 0;
  function toast(t){
    let el = document.getElementById('jumpToast');
    if (!el){ el = document.createElement('div'); el.id = 'jumpToast';
      el.style.cssText = 'position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:99999;max-width:92vw;padding:10px 18px;border-radius:99px;background:rgba(18,20,29,.96);border:1px solid #d4af37;color:#f6d775;font:500 13px/1.4 system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.5);text-align:center;transition:opacity .4s';
      document.body.appendChild(el); }
    el.textContent = t; el.style.opacity = '1'; clearTimeout(el._t); el._t = setTimeout(()=>{ el.style.opacity = '0'; }, 5200);
  }
  function consume(){
    let j = null; try { j = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){}
    if (!j || !isFinite(j.jd) || !(j.ts > done) || Date.now() - j.ts > 10*60*1000) return;
    done = j.ts;
    const step = fn => { try { fn(); } catch(e){ console.error('jump from rectification', e); } };   // one failing step must not hide the others
    step(()=>{ const wb = document.querySelector('#viewSwitch [data-v="wheel"]'); if (wb && !wb.classList.contains('active')) wb.click(); });
    step(()=>{ if (isPlaying){ const pb = document.getElementById('tlPlayPause'); if (pb) pb.click(); else isPlaying = false; } });
    step(()=>{ if (isFinite(j.lat) && isFinite(j.lon)) liveLocMem = { lat:+j.lat, lon:+j.lon, label:(j.place ? String(j.place).split(',')[0] : 'birth place') }; });   // session only, not saved
    step(()=> jumpToJD(j.jd));
    step(()=> toast('🌌 ' + (j.label || 'Rectification') + ' · ' + j.local + (j.place ? ' · ' + String(j.place).split(',')[0] : '')));
  }
  window.addEventListener('message', e=>{ if (e.data === 'vedic-bridge-ping') consume(); });
  window.addEventListener('storage', e=>{ if (e.key === KEY) consume(); });
  setTimeout(consume, 600);
})();

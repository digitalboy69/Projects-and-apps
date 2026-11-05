/* Native bridge for the Android app (loaded only inside the APK; harmless in a browser).
   1. Tells the updater the new web build started fine (otherwise it rolls back).
   2. Styles the status bar, handles the Android back button.
   3. Live updates: when online, compares the published web build with the one inside the app; if newer it downloads it in the
      background and it becomes active the next time the app is opened. Offline = nothing happens, the bundled app runs as is. */
(function(){
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  window.__NATIVE_APP = true;
  var OTA = '__OTA_BASE__', P = C.Plugins || {};
  function plug(n){ try { return (C.registerPlugin ? C.registerPlugin(n) : null) || P[n] || null; } catch(e){ return P[n] || null; } }
  var U = plug('CapacitorUpdater'), AP = plug('App'), SB = plug('StatusBar');
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){} return null; }
  try { if (U) U.notifyAppReady(); } catch(e){}
  try { if (SB){ SB.setStyle({ style: 'DARK' }); SB.setBackgroundColor({ color: '#0b0f1a' }); } } catch(e){}
  try {
    if (AP) AP.addListener('backButton', function(){
      if (history.length > 1) history.back(); else if (AP.minimizeApp) AP.minimizeApp(); else if (AP.exitApp) AP.exitApp();
    });
  } catch(e){}
  function toast(msg){
    try { var t = document.createElement('div'); t.textContent = msg;
      t.style.cssText = 'position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:2147483647;background:#151b2b;color:#f6d775;border:1px solid rgba(246,215,117,.5);padding:10px 16px;border-radius:14px;font:13px system-ui;max-width:86vw;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.5)';
      document.body.appendChild(t); setTimeout(function(){ t.remove(); }, 6000); } catch(e){}
  }
  async function bundledId(){ try { var r = await fetch('version.json', { cache: 'no-store' }); var j = await r.json(); return j && j.id; } catch(e){ return null; } }
  async function check(){
    if (!U || navigator.onLine === false) return;
    try {
      var r = await fetch(OTA + '/latest.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return;
      var latest = await r.json(); if (!latest || !latest.id || !latest.url) return;
      var have = ls('otaApplied') || await bundledId();
      if (latest.id === have || latest.id === ls('otaPending')) return;
      var b = await U.download({ url: latest.url, version: String(latest.id) });
      if (!b || !b.id) return;
      await U.next({ id: b.id });
      ls('otaPending', latest.id); ls('otaApplied', latest.id);
      toast('Update downloaded. It opens the next time you start the app.');
    } catch(e){ /* offline or blocked: keep the current version */ }
  }
  window.addEventListener('load', function(){ setTimeout(check, 4000); });
  window.addEventListener('online', function(){ setTimeout(check, 1500); });
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) setTimeout(check, 2000); });
})();

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
  async function bundledId(){ try { var r = await fetch('/version.json', { cache: 'no-store' }); var j = await r.json(); return j && j.id; } catch(e){ return null; } }
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
  var IS_ROOT = !/\/apps\//.test(location.pathname);      // the launcher does the background check; app pages only offer the manual button
  if (IS_ROOT) window.addEventListener('load', function(){ setTimeout(check, 4000); });
  if (IS_ROOT){
    window.addEventListener('online', function(){ setTimeout(check, 1500); });
    document.addEventListener('visibilitychange', function(){ if (!document.hidden) setTimeout(check, 2000); });
  }

  /* ---- In-app "Update app": only exists inside the APK (this file is never part of the website). ----
     Update now        : downloads the newest published build (the whole web app) and restarts into it; works offline afterwards.
     Build, then update: asks GitHub to build the newest code first (needs a token kept on this phone only), waits, then updates. */
  var REPO = (OTA.match(/github\.com\/([^\/]+\/[^\/]+)\//) || [])[1] || 'digitalboy69/projects-and-apps';
  var sheet, busy = false;
  function el(tag, css, html){ var e = document.createElement(tag); if (css) e.style.cssText = css; if (html != null) e.innerHTML = html; return e; }
  function say(msg, kind){ var m = sheet && sheet.querySelector('.vu-msg'); if (m){ m.textContent = msg; m.style.color = kind === 'err' ? '#ff8f8f' : kind === 'ok' ? '#5ad6c4' : '#cfd5e3'; } }
  function setBusy(b){ busy = b; if (!sheet) return; sheet.querySelectorAll('button.vu-b').forEach(function(x){ x.disabled = b; x.style.opacity = b ? .55 : 1; }); }
  function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
  async function getLatest(){ var r = await fetch(OTA + '/latest.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) throw new Error('No published build found (' + r.status + ').'); var j = await r.json(); if (!j || !j.id || !j.url) throw new Error('Build info is incomplete.'); return j; }
  async function applyLatest(latest){
    var have = ls('otaApplied') || await bundledId();
    if (latest.id === have){ say('You already have the newest build (built ' + String(latest.built || '').slice(0, 16).replace('T', ' ') + ' UTC).', 'ok'); return false; }
    say('Downloading the new version… keep the app open.');
    var b = await U.download({ url: latest.url, version: String(latest.id) });
    if (!b || !b.id) throw new Error('Download did not finish.');
    ls('otaPending', latest.id); ls('otaApplied', latest.id);
    say('Installed. Restarting into the new version…', 'ok');
    await sleep(700); await U.set({ id: b.id });                 // applies and reloads right now
    return true;
  }
  async function updateNow(){
    if (busy) return; if (!U){ say('Updates are only available in the installed app.', 'err'); return; }
    if (navigator.onLine === false){ say('You are offline. The app keeps working with the version it has.', 'err'); return; }
    setBusy(true); say('Checking for the newest build…');
    try { await applyLatest(await getLatest()); } catch(e){ say('Could not update: ' + (e && e.message || e), 'err'); }
    setBusy(false);
  }
  async function gh(path, opt){ var r = await fetch('https://api.github.com/repos/' + REPO + path, opt); return r; }
  async function buildThenUpdate(){
    if (busy) return; if (!U){ say('Updates are only available in the installed app.', 'err'); return; }
    if (navigator.onLine === false){ say('You are offline.', 'err'); return; }
    var inp = sheet.querySelector('.vu-tok'), tok = (inp.value || '').trim() || ls('ghBuildToken') || '';
    if (!tok){ sheet.querySelector('.vu-tokbox').style.display = 'block'; say('Paste a GitHub token once (kept on this phone only) to start a build.', 'err'); return; }
    ls('ghBuildToken', tok); setBusy(true);
    try {
      say('Asking GitHub to build the newest code…');
      var before = Date.now() - 15000;
      var d = await gh('/actions/workflows/android.yml/dispatches', { method: 'POST', headers: { 'Authorization': 'Bearer ' + tok, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' }, body: JSON.stringify({ ref: 'main' }) });
      if (d.status === 401 || d.status === 403 || d.status === 404){ ls('ghBuildToken', ''); throw new Error('GitHub refused the token (needs Actions: read and write on ' + REPO + ').'); }
      if (d.status !== 204) throw new Error('GitHub answered ' + d.status + '.');
      var run = null, t0 = Date.now();
      while (Date.now() - t0 < 25 * 60 * 1000){                  // wait for the build to finish (usually 6-10 minutes)
        await sleep(15000);
        var rr = await gh('/actions/workflows/android.yml/runs?event=workflow_dispatch&per_page=3&t=' + Date.now(), { headers: { 'Accept': 'application/vnd.github+json' } });
        if (!rr.ok) continue; var j = await rr.json();
        run = (j.workflow_runs || []).filter(function(x){ return new Date(x.created_at).getTime() >= before; })[0];
        if (!run){ say('Waiting for the build to start…'); continue; }
        var mins = Math.max(1, Math.round((Date.now() - t0) / 60000));
        if (run.status !== 'completed'){ say('Building the newest code… ' + mins + ' min so far. You can leave this screen open.'); continue; }
        if (run.conclusion !== 'success') throw new Error('The build finished with: ' + run.conclusion + '.');
        break;
      }
      if (!run || run.status !== 'completed') throw new Error('The build is taking too long. Try “Update now” in a few minutes.');
      say('Build finished. Getting it…'); await sleep(4000);
      await applyLatest(await getLatest());
    } catch(e){ say('Could not build/update: ' + (e && e.message || e), 'err'); }
    setBusy(false);
  }
  function openSheet(){
    if (sheet){ sheet.style.display = 'flex'; return; }
    sheet = el('div', 'position:fixed;inset:0;z-index:2147483646;display:flex;align-items:flex-end;justify-content:center;background:rgba(2,5,12,.62);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);padding:0');
    var card = el('div', 'width:100%;max-width:520px;box-sizing:border-box;padding:20px 18px calc(20px + env(safe-area-inset-bottom));border-radius:26px 26px 0 0;background:linear-gradient(180deg,#151c30,#0b101d);border:1px solid rgba(246,215,117,.28);color:#eee8dc;font:14px/1.55 system-ui,sans-serif');
    var bs = 'width:100%;padding:15px;border:0;border-radius:16px;font:700 15px system-ui;cursor:pointer;margin-top:10px';
    card.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center"><b style="font:700 20px Georgia,serif;color:#f6d775">Update app</b><button class="vu-x" style="width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#fff;font-size:16px">✕</button></div>'
      + '<div style="margin:8px 0 4px;color:#9aa3b5">Downloads all the newest code into the app, so it keeps working offline.</div>'
      + '<button class="vu-b vu-now" style="' + bs + ';background:linear-gradient(135deg,#f8dd85,#c9962f);color:#1a1405">Update now</button>'
      + '<button class="vu-b vu-build" style="' + bs + ';background:rgba(90,214,196,.12);border:1px solid rgba(90,214,196,.4);color:#5ad6c4">Build the latest code, then update</button>'
      + '<div class="vu-tokbox" style="display:none;margin-top:10px"><input class="vu-tok" type="password" autocomplete="off" placeholder="GitHub token (saved on this phone only)" style="width:100%;box-sizing:border-box;padding:13px;border-radius:14px;border:1px solid rgba(246,215,117,.3);background:#0e121c;color:#fff;font:14px system-ui"><div style="margin-top:6px;font-size:12px;color:#7f8899">Create a fine-grained token for ' + REPO + ' with “Actions: Read and write”. It is stored only in this app.</div></div>'
      + '<div class="vu-msg" style="margin-top:14px;min-height:42px"></div>';
    sheet.appendChild(card); document.body.appendChild(sheet);
    card.querySelector('.vu-x').onclick = function(){ if (!busy) sheet.style.display = 'none'; };
    sheet.addEventListener('pointerdown', function(e){ if (e.target === sheet && !busy) sheet.style.display = 'none'; });
    card.querySelector('.vu-now').onclick = updateNow; card.querySelector('.vu-build').onclick = buildThenUpdate;
    if (ls('ghBuildToken')) card.querySelector('.vu-tok').placeholder = 'Token saved. Paste a new one to replace it.';
    (async function(){ try { var l = await getLatest(), have = ls('otaApplied') || await bundledId(); say(l.id === have ? 'You are on the newest published build.' : 'A newer build is ready to install.', l.id === have ? 'ok' : ''); } catch(e){} })();
  }
  window.vedicNativeUpdate = openSheet;
  function addButton(){
    var acts = document.querySelector('#mainMenuModal .menu-actions');
    if (acts){                                                // birth chart: a tile in the profile menu
      if (acts.querySelector('.vu-tile')) return;
      var b = el('button', 'grid-column:1/-1', '<span style="font-size:20px">⟳</span> <span>Update app</span>'); b.className = 'menu-action-btn dev-btn vu-tile'; b.type = 'button';
      b.onclick = openSheet; acts.insertBefore(b, acts.children[1] || null); return;
    }
    if (document.querySelector('.vu-fab')) return;            // launcher: a small floating button
    var f = el('button', 'position:fixed;left:12px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:2147483000;width:44px;height:44px;border-radius:50%;border:1px solid rgba(246,215,117,.5);background:rgba(15,19,32,.92);color:#f6d775;font-size:20px;box-shadow:0 8px 22px rgba(0,0,0,.45)', '⟳'); f.className = 'vu-fab'; f.setAttribute('aria-label', 'Update app'); f.onclick = openSheet;
    document.body.appendChild(f);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton); else addButton();
})();

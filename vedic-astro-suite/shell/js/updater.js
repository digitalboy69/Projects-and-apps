/* Silent updater (hosted site and installed app). The browser may keep old copies of the app's files, so after an update the
   new tabs only show after a manual refresh. This reads version.json (never cached); when the build changed it re-downloads
   every file into the cache quietly (no reload while you use the app, so it never loads twice). The new version shows the next time
   you open the app, or when you come back to a tab with no chart open. Does nothing in the single-file build. */
(function(){
  if (document.getElementById('srcB')) return;
  var KEY = 'vasBuild', busy = false, running = get0();
  function get0(){ try{ return localStorage.getItem(KEY); }catch(e){ return null; } }
  function get(){ return get0(); }
  function put(v){ try{ localStorage.setItem(KEY, v); }catch(e){} }
  function chartOpen(){ try{ var d = document.querySelector('iframe[title="Birth Chart"]'); d = d && d.contentDocument; return !!(d && d.querySelector('#results.show')); }catch(e){ return false; } }
  // The page never reloads by itself while you are using it (that was the "loads twice" problem). A new build is downloaded quietly;
  // the next time you open the app it is already there, and if you come back to a tab with no chart open it refreshes then.
  function check(fromReturn){
    if (busy || !window.fetch) return; busy = true;
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(v){
      if (!v || !v.id){ busy = false; return; }
      if (v.id === running){ busy = false; return; }
      if (v.id === get()){ if (fromReturn && !chartOpen()){ running = v.id; location.reload(); return; } busy = false; return; }
      var files = v.files || [], i = 0, fail = 0;
      function next(){
        var batch = files.slice(i, i + 12); i += 12;
        if (!batch.length){ if (fail < files.length / 4){ put(v.id); if (fromReturn && !chartOpen()){ running = v.id; location.reload(); return; } } busy = false; return; }
        Promise.all(batch.map(function(u){ return fetch(u, { cache: 'reload' }).then(function(r){ if (!r.ok) fail++; }, function(){ fail++; }); })).then(next);
      }
      next();
    }).catch(function(){ busy = false; });
  }
  check(false);
  document.addEventListener('visibilitychange', function(){ if (document.visibilityState === 'visible') check(true); });
  window.addEventListener('pageshow', function(e){ if (e.persisted) check(true); });
})();

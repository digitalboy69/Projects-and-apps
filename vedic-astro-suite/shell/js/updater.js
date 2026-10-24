/* Silent updater (hosted site and installed app). The browser may keep old copies of the app's files, so after an update the
   new tabs only show after a manual refresh. This reads version.json (never cached); when the build changed it re-downloads
   every file into the cache and reloads once, behind the loading screen. Later, when you come back to the app, it does the same
   only if no chart is open, so nothing you are looking at is lost. Does nothing in the single-file build. */
(function(){
  if (document.getElementById('srcB')) return;
  var KEY = 'vasBuild', busy = false;
  function get(){ try{ return localStorage.getItem(KEY); }catch(e){ return null; } }
  function put(v){ try{ localStorage.setItem(KEY, v); }catch(e){} }
  function chartOpen(){ try{ var d = document.querySelector('iframe[title="Birth Chart"]'); d = d && d.contentDocument; return !!(d && d.querySelector('#results.show')); }catch(e){ return false; } }
  function check(fromReturn){
    if (busy || !window.fetch) return; busy = true;
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(v){
      if (!v || !v.id || v.id === get()){ busy = false; return; }
      if (fromReturn && chartOpen()){ busy = false; return; }
      var files = v.files || [], i = 0, fail = 0;
      function next(){
        var batch = files.slice(i, i + 12); i += 12;
        if (!batch.length){ if (fail < files.length / 4){ put(v.id); if (sessionStorage.getItem('vasRel') !== v.id){ try{ sessionStorage.setItem('vasRel', v.id); }catch(e){} location.reload(); return; } } busy = false; return; }
        Promise.all(batch.map(function(u){ return fetch(u, { cache: 'reload' }).then(function(r){ if (!r.ok) fail++; }, function(){ fail++; }); })).then(next);
      }
      next();
    }).catch(function(){ busy = false; });
  }
  check(false);
  document.addEventListener('visibilitychange', function(){ if (document.visibilityState === 'visible') check(true); });
  window.addEventListener('pageshow', function(e){ if (e.persisted) check(true); });
})();

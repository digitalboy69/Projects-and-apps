
/* =============================================================================
   APP META LAYER  ·  v2.0.0
   -----------------------------------------------------------------------------
   ARCHITECTURE MAP (search these names to jump around)
   1. Astronomy & maths ........ computeChart, calcVarga, computeLiveSky, find*Boundary*
   2. Classical engines ........ calculateVimshottariDasha, computeShadbala, computeFullAshtakavarga,
                                 calculateCharaKarakas, findPlanetaryWars, calc*Lagna*
   3. Panel builders (HTML) .... buildOverviewPanel, buildPlanetsPanel, buildDashaSection, buildYogaSection,
                                 buildShadbalaSection, buildAshtakavargaSection, buildRelationshipsSection
   4. Chart drawing ............ buildNorthIndianSvg, buildSouthIndianSvg, buildWesternWheelSvg
   5. Navigation ............... buildHomePanel, switchAppTab (+ history/back-button routing below)
   6. Profiles & storage ....... loadProfiles, saveProfiles, refreshProfileSelect, renderProfileCards
   7. Export ................... buildFullReportText, openExportModal (download / copy, local only)
   8. Orchestrator ............. renderResults(profile)  — builds every panel, then shows Home
   META HELPERS (this block): APP.store · APP.toast · APP.safe · APP.copy · APP.debounce · APP.report
   RULES: every panel builder is wrapped in an error boundary (see bottom), so one failing section never
          takes down the whole app. Add new panels to SAFE_BUILDERS and HOME_ITEMS.
   ============================================================================= */
const APP = (() => {
  const NS = 'va_ui_';
  const store = {
    get(k, d){ try { const v = localStorage.getItem(NS + k); return v === null ? d : JSON.parse(v); } catch(e){ return d; } },
    set(k, v){ try { localStorage.setItem(NS + k, JSON.stringify(v)); return true; } catch(e){ return false; } },
    remove(k){ try { localStorage.removeItem(NS + k); } catch(e){} }
  };
  let box = null, lastErr = 0;
  function toast(msg, type = 'info', ms = 3200){
    if (!box){
      box = document.createElement('div'); box.id = 'appToasts';
      box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    const t = document.createElement('div'); t.className = 'app-toast ' + type; t.textContent = msg;
    box.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, ms);
  }
  function report(label, err){
    const now = Date.now(); if (now - lastErr < 4000) return; lastErr = now;
    toast('Something went wrong' + (label ? ' in ' + label : '') + '. Your data is safe — please try again.', 'error', 4500);
  }
  function safe(label, fn, fallback){
    try { return fn(); }
    catch(err){ console.error('[' + label + ']', err); report(label, err); return typeof fallback === 'function' ? fallback(err) : fallback; }
  }
  async function copy(text){
    try { await navigator.clipboard.writeText(text); return true; }
    catch(e){
      try {
        const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
        document.body.appendChild(ta); ta.focus(); ta.select();
        const ok = document.execCommand('copy'); document.body.removeChild(ta); return ok;
      } catch(e2){ return false; }
    }
  }
  function debounce(fn, ms = 250){ let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  return { name: 'Vedic Astrology', version: '2.0.0', store, toast, report, safe, copy, debounce, debug: /debug/.test(location.hash) };
})();

/* global safety nets: nothing fails silently any more */
window.addEventListener('error', (e) => {
  if (!e.message || /ResizeObserver|Script error/i.test(e.message)) return;
  console.error(e.error || e.message); APP.report('', e.error);
});
window.addEventListener('unhandledrejection', (e) => {
  const m = String((e.reason && e.reason.message) || e.reason || '');
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) APP.toast('Network problem — check your connection.', 'error');
  else { console.error(e.reason); APP.report('', e.reason); }
});
window.addEventListener('offline', () => APP.toast('You are offline — place search needs internet.', 'error', 4500));
window.addEventListener('online', () => APP.toast('Back online ✓', 'success', 2000));


/* ============================================================================
   AYANAMSA CHOICE: selector on the intake form (Lahiri default, Raman, KP). The engine (js/03 lahiriAyanamsa) reads the saved choice, so every chart,
   transit, panchang and report follows it. Changing it re-draws the chart already on screen. 3D Sky reads the same saved choice when it opens.
   ============================================================================ */
(function(){
  const sel = document.getElementById('aynSel'); if (!sel) return;
  sel.value = ayanKey();
  function note(){ const n = document.getElementById('aynNote'); if (n) n.textContent = ayanKey() === 'lahiri' ? 'Lahiri is used unless you change it. Changing it re-draws the chart.' : 'Using ' + ayanName() + ' ayanamsa. Charts everywhere in this app follow it (3D Sky after you reopen it).'; }
  note();
  sel.addEventListener('change', function(){
    try { localStorage.setItem('vax_ayanamsa', sel.value); } catch(e){}
    note();
    const r = document.getElementById('results'), f = document.getElementById('birthForm');
    if (r && r.classList.contains('show') && f && window.__vgProf){ try { f.requestSubmit(); } catch(e){ console.warn('ayanamsa redraw', e); } }
  });
  window.setAyanamsa = function(k){ if (!AYAN_MODES[k]) return; sel.value = k; sel.dispatchEvent(new Event('change')); };
})();

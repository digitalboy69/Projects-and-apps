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
    try { sessionStorage.setItem('vax_ayanamsa', sel.value); } catch(e){}
    note();
    const r = document.getElementById('results'), f = document.getElementById('birthForm');
    if (r && r.classList.contains('show') && f && window.__vgProf){ try { f.requestSubmit(); } catch(e){ console.warn('ayanamsa redraw', e); } }
  });
  /* a clear banner on every result screen while a non-Lahiri ayanamsa is on, because it moves Dasha dates (KP about 1.6 months, Raman about 2 years) */
  function banner(){
    const r = document.getElementById('results'); if (!r) return; const old = r.querySelector(':scope > .ayn-banner');
    if (ayanKey() === 'lahiri'){ if (old) old.remove(); return; }
    const txt = '<b>' + ayanName() + ' ayanamsa is on.</b> Planet degrees and Dasha dates differ a little from the usual Lahiri. <button type="button" class="chgp-btn" id="aynBack">Back to Lahiri</button>';
    if (old){ if (old.innerHTML !== txt) old.innerHTML = txt; return; }
    const d = document.createElement('div'); d.className = 'ayn-banner'; d.innerHTML = txt; r.insertBefore(d, r.firstChild);
  }
  try { new MutationObserver(banner).observe(document.getElementById('results'), { childList: true }); } catch(e){}
  sel.addEventListener('change', () => setTimeout(banner, 50)); banner();
  document.addEventListener('click', e => { if (e.target && e.target.id === 'aynBack') window.setAyanamsa('lahiri'); });
  window.setAyanamsa = function(k){ if (!AYAN_MODES[k]) return; sel.value = k; sel.dispatchEvent(new Event('change')); };
})();

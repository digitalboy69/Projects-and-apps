/* ============================================================================
   ALL TABS GRID + TAB STRIP HELPERS (3D Sky, phone). Fifteen tabs sit in a sideways strip; this adds
   - an "All" button at the start of the strip that opens a grid of every tab (icon + name), one tap to go there;
   - the active tab is kept in view (centred) whenever it changes.
   It only clicks the existing tab buttons, so each tab's own code runs exactly as before. Styles: css/31-ui-refresh.css (ui- prefix).
   Test: tests/sky3d_ui_refresh_browser_test.py
   ============================================================================ */
(function(){
  'use strict';
  const strip = document.querySelector('.panel-tabs'); if (!strip) return;
  const tabs = () => [...strip.querySelectorAll('.panel-tab')];
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  /* one line about each tab, shown under its name in the grid */
  const HINT = { sky:'Every planet now', rising:'Rising sign times', transits:'Planet sign changes', conjunctions:'When planets meet', degree:'Find a degree', degreehouses:'House cusps', aspexact:'Exact aspects',
    natal:'Your birth chart', triggers:'Dasha + transit hits', returns:'Planet returns', retro:'Retrograde spans', solar:'Solar system', chart:'Chart style', view:'Look & lines', export:'Save or copy' };
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ui-all'; btn.setAttribute('aria-label', 'Show all tabs'); btn.innerHTML = '<b>⊞</b><span>All</span>';
  strip.insertBefore(btn, strip.firstChild);
  let ov = null;
  function build(){
    ov = document.createElement('div'); ov.className = 'ui-ov';
    ov.innerHTML = '<div class="ui-card" role="dialog" aria-label="All tabs"><div class="ui-top"><b>All tabs</b><button type="button" class="ui-x" aria-label="Close">✕</button></div><p class="ui-lead">Tap one to open it.</p><div class="ui-grid"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('pointerdown', e => { if (e.target === ov) close(); });
    ov.querySelector('.ui-x').addEventListener('click', close);
    ov.querySelector('.ui-grid').addEventListener('click', e => {
      const t = e.target.closest('.ui-t'); if (!t) return;
      const tab = strip.querySelector('.panel-tab[data-tab="' + t.dataset.tab + '"]'); close(); if (tab) tab.click();
    });
  }
  function open(){
    if (!ov) build();
    const cur = (strip.querySelector('.panel-tab.active') || {}).dataset;
    ov.querySelector('.ui-grid').innerHTML = tabs().map(t => { const k = t.dataset.tab, ic = (t.querySelector('.ti') || {}).innerHTML || '•', nm = (t.querySelector(':scope > span:not(.ti)') || t).textContent.trim();
      return `<button type="button" class="ui-t${cur && cur.tab === k ? ' on' : ''}" data-tab="${esc(k)}"><i>${ic}</i><span>${esc(nm)}</span><small>${esc(HINT[k] || '')}</small></button>`; }).join('');
    ov.classList.add('show');
  }
  function close(){ if (ov) ov.classList.remove('show'); }
  btn.addEventListener('click', open);
  window.uiAllTabs = { open, close };
  /* keep the active tab in view */
  function centre(){ const a = strip.querySelector('.panel-tab.active'); if (!a) return; const L = a.offsetLeft - (strip.clientWidth - a.offsetWidth) / 2; try { strip.scrollTo({ left: Math.max(0, L), behavior: 'smooth' }); } catch(e){ strip.scrollLeft = Math.max(0, L); } }
  new MutationObserver(centre).observe(strip, { subtree: true, attributes: true, attributeFilter: ['class'] });
})();

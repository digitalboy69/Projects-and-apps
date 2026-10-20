/* Copy buttons on/off (Settings in the main menu). OFF by default. Hides every "Copy ..." button in the app while off.
   Setting key: localStorage vedicCopyBtns = "1" (on). The shell tells open apps with postMessage('vedic-copy-toggle'). */
(function(){
  'use strict';
  const KEY = 'vedicCopyBtns', FLAG = 'data-cp-hid';
  const on = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
  const label = el => (el.textContent || '').replace(/^[^A-Za-z]+/, '').trim();
  const isCopy = el => /^copy\b/i.test(label(el)) || /aspect-copy-btn|dc-copy|\bcc\b|lineCopy/.test((el.className && el.className.baseVal === undefined ? el.className : '') + ' ' + el.id) || (el.getAttribute && /copy/i.test(el.getAttribute('title') || '') && !/^(dup|dupl)/i.test(label(el)) && label(el).length < 14);
  let busy = false;
  function apply(){
    if (busy) return; busy = true;
    try {
      const show = on();
      document.querySelectorAll('button,[role="button"]').forEach(el => {
        if (el.hasAttribute(FLAG)){ if (show){ el.removeAttribute(FLAG); el.style.removeProperty('display'); } return; }
        if (!show && isCopy(el)){ el.setAttribute(FLAG, '1'); el.style.setProperty('display', 'none', 'important'); }
      });
    } catch (e) {}
    busy = false;
  }
  let t = 0; const later = () => { if (!t) t = requestAnimationFrame(() => { t = 0; apply(); }); };
  function start(){ apply(); try { new MutationObserver(later).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.addEventListener('storage', e => { if (e.key === KEY) apply(); });
  window.addEventListener('message', e => { if (e.data === 'vedic-copy-toggle') apply(); });
})();

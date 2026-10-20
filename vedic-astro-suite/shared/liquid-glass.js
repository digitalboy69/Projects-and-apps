/* Liquid glass look: adds class "lg" to <html> while on. ON by default; the main-menu Settings switch writes localStorage vedicGlass = "0" (off) / "1".
   Turns itself off when the device asks for less transparency. Parent shell tells open apps with postMessage('vedic-glass-toggle'). */
(function(){
  'use strict';
  const KEY = 'vedicGlass', root = document.documentElement;
  function want(){
    try { if (window.matchMedia && matchMedia('(prefers-reduced-transparency: reduce)').matches) return false; } catch (e) {}
    try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; }
  }
  function apply(){ root.classList.toggle('lg', want()); }
  apply();
  window.addEventListener('storage', e => { if (e.key === KEY) apply(); });
  window.addEventListener('message', e => { if (e.data === 'vedic-glass-toggle') apply(); });
  window.vedicGlassApply = apply;
})();

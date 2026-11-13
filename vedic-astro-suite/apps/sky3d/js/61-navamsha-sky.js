/* Navamsha sky (js/61, global NAV) + the Tools drop-down in the top-right of the 3D view.
   Navamsha (D9) longitude = (sidereal longitude x 9) mod 360. Each 3°20' slice of a sign is stretched over a whole 30° sign. This equals the Parashari rule
   (movable signs start from themselves, fixed from the 9th, dual from the 5th) and the app's Navamsha code in js/18, with the exact degree kept.
   NAV.snap(jd) is the snapshot the 3D scene, HUD, sky table, overlays and chart tab draw from: the normal sky, or the Navamsha sky when it is on.
   Everything else (planet pop-ups, dashboard, transit feeds, rising-sign timings, degree houses) keeps the real sky: it reads snapshotPositions directly,
   or snap.raw when it is handed a Navamsha snapshot. Wheel view only; switching to the Solar System view turns it off. */
const NAV = (() => {
  'use strict';
  const st = { on: false };
  const d9 = lon => normDeg(lon * 9);
  function snap(jd) {
    const s = snapshotPositions(jd); if (!st.on) return s;
    const sid = {}; ALL_BODIES.forEach(n => { sid[n] = d9(s.sidereal[n]); });
    return Object.assign({}, s, { sidereal: sid, raw: s.sidereal, nav: true });
  }
  const asc = (jd, lat, lon) => { const a = siderealAscendant(jd, lat, lon); return st.on ? d9(a) : a; };
  const $ = id => document.getElementById(id);
  function paint() {
    const b = $('navBtn'); if (b) { b.setAttribute('aria-pressed', String(st.on)); b.classList.toggle('on', st.on); const t = b.querySelector('.tm-st'); if (t) t.textContent = st.on ? 'On' : 'Off'; }
    const g = $('navBadge'); if (g) g.style.display = st.on ? '' : 'none';
    const app = document.querySelector('.app'); if (app) app.classList.toggle('navsky', st.on);
  }
  function set(v, quiet) {
    if (v && typeof SOL !== 'undefined' && SOL.view === 'solar') return false;
    st.on = !!v; try { A.np = null; A.natal = null; } catch (e) { /* overlays not ready yet */ }
    paint(); if (!quiet && typeof refreshAll === 'function') refreshAll(); return true;
  }
  /* ---- Tools drop-down ---- */
  let open = false;
  function setOpen(v) { open = !!v; const m = $('toolsMenu'), b = $('toolsBtn'); if (m) m.hidden = !open; if (b) { b.setAttribute('aria-expanded', String(open)); b.classList.toggle('active', open); } }
  function wire() {
    const tb = $('toolsBtn'), menu = $('toolsMenu'); if (!tb || !menu) return;
    tb.addEventListener('click', e => { e.stopPropagation(); setOpen(!open); });
    menu.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return; if (b.id === 'navBtn') set(!st.on); setOpen(false); });
    document.addEventListener('click', e => { if (open && !e.target.closest('.viewport-actions')) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) { setOpen(false); tb.focus(); } });
    const off = $('navBadge'); if (off) off.addEventListener('click', () => set(false));
    const eye = $('clearViewBtn'); if (eye) eye.addEventListener('click', () => setOpen(false));
    const _sv = window.setSceneView;
    if (typeof _sv === 'function') window.setSceneView = function (v) {
      if (v === 'solar' && st.on) set(false, true);
      const r = _sv.apply(this, arguments); const n = $('navBtn'); if (n) { n.disabled = (v === 'solar'); n.title = n.disabled ? 'Navamsha sky works in the Zodiac Wheel view' : 'Show the sky in Navamsha (D9)'; }
      if (typeof refreshAll === 'function') refreshAll(); return r;
    };
    paint();
  }
  const api = { snap, asc, d9, set, setOpen, get on() { return st.on; } };
  window.NAV = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  return api;
})();

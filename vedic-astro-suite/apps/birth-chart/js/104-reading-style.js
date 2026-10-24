/* ============================================================================
   READING STYLE (js/104): small, tested helpers that make Chart Reading easy to scan and rewarding to read. Hand-written; no calculations.
   - bold hook: the first sentence of each paragraph in the reading is wrapped in <strong class="hk">
   - progress bar (scroll) and "explored n of m" dots with a tick on each tab you have opened
   - "Next up" button at the end of each tab
   Styles: css/44-reading-style.css. Tested by tests/reading_style_test.py.
   ============================================================================ */
(function(){
'use strict';
const SENT = /^([^.!?]{18,170}[.!?])(\s|$)/;
function hook(root){
  root.querySelectorAll('.dr-p:not([data-hk]),.rd-w:not([data-hk]),.dr-l>div:not([data-hk])').forEach(p => {
    p.setAttribute('data-hk', '1'); const tn = [...p.childNodes].find(n => n.nodeType === 3 && n.textContent.trim().length > 30); if (!tn || p.querySelector('.hk')) return;
    const t = tn.textContent, m = SENT.exec(t.replace(/^\s+/, '')), lead = t.length - t.replace(/^\s+/, '').length; if (!m || t.length < lead + m[1].length + 20) return;
    const s = document.createElement('strong'); s.className = 'hk'; s.textContent = m[1]; const rest = document.createTextNode(t.slice(lead + m[1].length)); tn.textContent = t.slice(0, lead); tn.after(s); s.after(rest);
  });
  root.querySelectorAll('.hn-card .dr-vg-b h5:not([data-bub])').forEach(h => { h.setAttribute('data-bub', '1'); const m = /^(\S+)\s+(.*)$/.exec(h.textContent); if (!m) return; h.textContent = ''; const b = document.createElement('span'); b.className = 'hn-bub'; b.textContent = m[1]; h.appendChild(b); h.appendChild(document.createTextNode(m[2])); });
}
function wire(rd){
  if (rd.getAttribute('data-rs')) return; rd.setAttribute('data-rs', '1');
  const tabs = [...rd.querySelectorAll(':scope>.vx-tabs button')], panes = [...rd.querySelectorAll(':scope>.vx-pane')]; if (tabs.length < 2) return;
  const seen = new Set([0]); tabs[0].classList.add('seen');
  const bar = document.createElement('div'); bar.className = 'rs-progress'; bar.innerHTML = '<i></i>'; rd.insertBefore(bar, rd.firstChild);
  const ex = document.createElement('div'); ex.className = 'rs-explored'; rd.insertBefore(ex, rd.querySelector(':scope>.vx-tabs'));
  const paint = () => { ex.innerHTML = `<span>✨ Explored <b>${seen.size}</b> of <b>${tabs.length}</b> parts</span><span class="rs-dots">${tabs.map((t, i) => `<span class="${seen.has(i) ? 'on' : ''}"></span>`).join('')}</span>`; };
  paint();
  panes.forEach((p, i) => { if (i >= tabs.length - 1) return; const nx = tabs[i + 1], b = document.createElement('button'); b.type = 'button'; b.className = 'rs-next'; b.setAttribute('data-next', i + 1);
    b.innerHTML = `<div>Next up<small>${nx.textContent.replace(/\s*✓$/, '')}</small></div><span>→</span>`; p.appendChild(b); });
  rd.addEventListener('click', e => {
    const t = e.target.closest('.vx-tabs button'), n = e.target.closest('.rs-next');
    if (n){ const i = +n.getAttribute('data-next'); tabs[i].click(); rd.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (t){ const i = tabs.indexOf(t); if (i >= 0){ seen.add(i); t.classList.add('seen'); paint(); setTimeout(() => hook(rd), 0); } }
  });
  const upd = () => { const r = rd.getBoundingClientRect(), h = r.height - window.innerHeight; bar.firstChild.style.width = Math.max(0, Math.min(100, h > 0 ? (-r.top / h) * 100 : 100)).toFixed(1) + '%'; };
  window.addEventListener('scroll', upd, { passive: true }); upd(); hook(rd);
}
function scan(){ document.querySelectorAll('.rd').forEach(wire); document.querySelectorAll('.rd').forEach(hook); }
let timer = null; new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(scan, 30); }).observe(document.body, { childList: true, subtree: true });
document.addEventListener('DOMContentLoaded', scan); scan();
window.RSTYLE = { scan, hook };
})();

/* ---- Aspect Explorer shortcut popup (top right of the 3D screen) ----
   Same explorer as the side panel: the block is moved into the popup while it
   is open and moved back when it closes, so both always behave the same. */
function openAspExp(){
  const block = document.getElementById('explorerBlock');
  document.getElementById('aspExpBody').appendChild(block);
  try { renderExplorer(getExplorerContext()); } catch(e){}
  document.getElementById('aspExpOverlay').classList.add('show');
}
function closeAspExp(){
  document.getElementById('aspExpOverlay').classList.remove('show');
  document.getElementById('explorerHome').appendChild(document.getElementById('explorerBlock'));
}
document.getElementById('aspExpBtn').addEventListener('click', openAspExp);
(function setupMagnetic(){
  let fine = false, reduce = false;
  try { fine = matchMedia('(hover:hover) and (pointer:fine)').matches; reduce = matchMedia('(prefers-reduced-motion:reduce)').matches; } catch(e){}
  if (!fine || reduce) return;
  const SEL = '.icon-btn,.panel-tab,.speed-chip,.cam-mode-btn,.pbtn,.hud-asc,.rs-btn'; let cur = null;
  const clear = el => { ['--tx','--ty'].forEach(k => el.style.removeProperty(k)); };
  document.addEventListener('pointermove', (e)=>{
    const el = e.target.closest && e.target.closest(SEL);
    if (cur && cur !== el){ clear(cur); cur = null; }
    if (!el || isDragging) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--tx', (((e.clientX - r.left) / r.width - .5) * 5).toFixed(2) + 'px');
    el.style.setProperty('--ty', (((e.clientY - r.top) / r.height - .5) * 4).toFixed(2) + 'px');
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    cur = el;
  }, { passive:true });
  window.addEventListener('blur', ()=>{ if (cur){ clear(cur); cur = null; } });
})();
(function setupRisingPress(){
  const el = document.getElementById('hudAsc'); let t = null, fired = false, sx = 0, sy = 0;
  const clear = ()=>{ if (t){ clearTimeout(t); t = null; } el.classList.remove('pressing'); };
  el.addEventListener('pointerdown', (e)=>{
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    fired = false; sx = e.clientX; sy = e.clientY; el.classList.add('pressing');
    t = setTimeout(()=>{ t = null; fired = true; el.classList.remove('pressing'); try { navigator.vibrate && navigator.vibrate(18); } catch(_){} openRising(); }, 550);
  });
  el.addEventListener('pointermove', (e)=>{ if (t && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) clear(); });
  ['pointerup','pointercancel','pointerleave'].forEach(n => el.addEventListener(n, clear));
  el.addEventListener('click', (e)=>{ if (fired){ fired = false; e.preventDefault(); e.stopImmediatePropagation(); return; } askLiveLoc(); });
  el.addEventListener('contextmenu', (e)=> e.preventDefault());
  el.addEventListener('keydown', (e)=>{ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); if (e.shiftKey) openRising(); else askLiveLoc(); } });
})();
document.getElementById('risingClose').addEventListener('click', closeRising);
document.getElementById('risingOverlay').addEventListener('click', (e)=>{ if (e.target.id === 'risingOverlay' && Date.now() - risingOpenedAt > 450) closeRising(); });
document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeRising(); });
document.addEventListener('click', (e)=>{ if (e.target.closest && e.target.closest('[data-rs-place]')) askLiveLoc(); });
document.getElementById('aspExpClose').addEventListener('click', closeAspExp);
document.getElementById('aspExpOverlay').addEventListener('click', (e)=>{
  if (e.target.id==='aspExpOverlay') closeAspExp();
});
document.addEventListener('keydown', (e)=>{
  if (e.key==='Escape' && document.getElementById('aspExpOverlay').classList.contains('show')) closeAspExp();
});
document.getElementById('planetDetailOverlay').addEventListener('click', (e)=>{
  if (e.target.id==='planetDetailOverlay') closePlanetDetail();
});

const NAKSHATRA_LORDS = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"];

function formatDurationDays(days){
  const d = Math.abs(days);
  if (d < 1) return `${Math.round(d*24)} hours`;
  if (d < 60) return `${d.toFixed(1)} days`;
  if (d < 400) return `${(d/30.44).toFixed(1)} months`;
  return `${(d/365.25).toFixed(2)} years`;
}


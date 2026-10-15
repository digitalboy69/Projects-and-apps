/* ---- Smoothness: skip DOM writes that would not change anything ---- */
(function(){
  const d = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
  Object.defineProperty(Node.prototype, 'textContent', { configurable:true, get(){ return d.get.call(this); },
    set(v){ const f = this.firstChild; if (f && f === this.lastChild && f.nodeType === 3 && f.nodeValue === String(v)) return; d.set.call(this, v); } });
  const hd = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  ['transitFeed','conjunctionFeed','aspectList','signAspectList','houseTable','skyTable'].forEach(id=>{
    const el = document.getElementById(id); if (!el) return; let last = null;
    Object.defineProperty(el, 'innerHTML', { configurable:true, get(){ return hd.get.call(this); },
      set(v){ if (v === last && this.firstChild) return; last = v; hd.set.call(this, v); } });
  });
})();

/* ============================================================================
   STRUCTURE: numbered accordions + help
   ============================================================================ */
(function setupStructure(){
  const HINT = {
    "Natal Profile":"The chart that is currently active", "Enter Birth Details":"Name, date, time and place of birth",
    "Rasi Chart (D1)":"Your birth wheel. Tap a planet for details", "Houses & Placements":"Which sign and planets sit in each house",
    "Planetary Aspects (Graha Drishti)":"Which planets are looking at each other", "Sign Aspects (Rashi Drishti)":"Every sign each planet is gazing at",
    "Aspect Explorer":"Pick a planet or sign to see its aspects", "Camera Mode":"How you move around the wheel", "Line Visibility":"Show or hide guide lines"
  };
  const OPEN_ALL = { 'tab-natal':true, 'tab-view':true };
  ['tab-chart','tab-natal','tab-view'].forEach(id=>{
    const sec = document.getElementById(id);
    [...sec.querySelectorAll(':scope > .panel-heading')].forEach((h,i)=>{
      const acc = document.createElement('div'); acc.className = 'acc' + ((i===0 || OPEN_ALL[id]) ? ' open' : '');
      const body = document.createElement('div'); body.className = 'acc-body';
      let n = h.nextSibling; const moved = [];
      while (n && !(n.nodeType===1 && n.classList.contains('panel-heading'))){ moved.push(n); n = n.nextSibling; }
      moved.forEach(x=> body.appendChild(x));
      const t = h.textContent.trim();
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'acc-head';
      btn.innerHTML = `<span class="acc-num">${i+1}</span><span><div class="acc-title">${t.replace(/&/g,'&amp;')}</div><div class="acc-hint">${HINT[t]||''}</div></span><span class="acc-chev">⌄</span>`;
      btn.addEventListener('click', ()=> acc.classList.toggle('open'));
      acc.append(btn, body); h.replaceWith(acc);
    });
  });
  const hm = document.getElementById('helpModal');
  document.getElementById('helpBtn').addEventListener('click', ()=> hm.classList.add('show'));
  document.getElementById('helpClose').addEventListener('click', ()=> hm.classList.remove('show'));
  hm.addEventListener('click', e=>{ if (e.target===hm) hm.classList.remove('show'); });
  document.getElementById('newProfileMiniBtn').addEventListener('click', ()=>{
    document.getElementById('sidepanel').classList.add('expanded');
    document.querySelectorAll('#tab-natal .acc').forEach(a=> a.classList.add('open'));
  });
})();



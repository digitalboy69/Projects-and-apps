(function(){
  const stage = document.getElementById('stage'), load = document.getElementById('load'), txt = document.getElementById('loadTxt');
  const NAME = { A:'3D Sky', B:'Birth Chart', N:'Notepad' }, frames = {};
  /* Two ways to get an app's document:
       - hosted / dev folder: the iframe loads apps/<name>/index.html directly (browser caches every css/js file, loads only the apps you open)
       - single-file build (dist/): the app text sits in <script type="text/plain" id="srcX" data-enc="b64|plain"> and goes in via srcdoc */
  const APP_URL = { A:'apps/sky3d/index.html', B:'apps/birth-chart/index.html', N:'apps/notepad/index.html', Dev:'apps/developer/index.html' };
  const decode = id => {
    const el = document.getElementById(id), raw = el.textContent;
    if (el.dataset.enc === 'b64'){ const bin = atob(raw.trim()); const u = new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) u[i] = bin.charCodeAt(i); return new TextDecoder('utf-8').decode(u); }
    return raw.replace(/<\\\/script/gi,'</script').replace(/<\\!--/g,'<!--').replace(/^\n/,'');
  };
  const setSource = (f, key) => { if (document.getElementById('src' + key)) f.srcdoc = decode('src' + key); else f.src = APP_URL[key]; };

  setTimeout(()=>document.documentElement.classList.remove('booting'), 20000); /* failsafe */
  /* welcome greeting (first start only) */
  const T0 = performance.now(); let firstDone = false;
  (function(){
    const hr = new Date().getHours(), g = hr < 5 ? 'Shubh Ratri' : hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : hr < 21 ? 'Good evening' : 'Shubh Ratri';
    document.getElementById('welHi').textContent = 'Namaste, ' + g.toLowerCase();
    const z = document.getElementById('zring'), G = '\u2648\u2649\u264A\u264B\u264C\u264D\u264E\u264F\u2650\u2651\u2652\u2653';
    for (let i = 0; i < 12; i++){ const e = document.createElement('s'); e.textContent = G[i] + '\uFE0E'; e.style.transform = 'rotate(' + i*30 + 'deg) translateY(-86px) rotate(' + (-i*30) + 'deg)'; e.style.animationDelay = (0.2 + i*0.07) + 's'; z.appendChild(e); }
    const L = ['Welcome to your sky', 'Charts, planets and time, in one place', 'Preparing the heavens\u2026', 'Aligning the planets\u2026'], sub = document.getElementById('welSub'); let k = 0;
    const t = setInterval(()=>{ if (firstDone){ clearInterval(t); return; } sub.style.opacity = 0; setTimeout(()=>{ k = (k+1) % L.length; sub.textContent = L[k]; sub.style.opacity = 1; }, 380); }, 1700);
  })();
  /* Loader state: ready[k] = that view finished starting up. The loader hides whenever the CURRENT view is ready
     (also when you switch back to a view that finished while you were away), so it can never stay stuck. */
  const ready = {}; let revT = 0, slowT = 0; const retryBtn = document.getElementById('retry');
  function hideLoader(){ load.classList.add('hide'); load.classList.remove('slow'); firstDone = true; document.documentElement.classList.remove('booting'); setTimeout(()=>load.classList.add('compact'), 800); }
  function reveal(){ clearTimeout(slowT); clearTimeout(revT); const wait0 = firstDone ? 0 : Math.max(0, 1500 - (performance.now() - T0)); revT = setTimeout(()=>{ if (ready[cur]) hideLoader(); }, wait0); }
  function finish(k){ ready[k] = true; if (cur === k) reveal(); }
  function showLoader(k){
    clearTimeout(slowT); clearTimeout(revT);
    load.classList.remove('slow'); load.classList.add('instant'); load.classList.remove('hide'); void load.offsetWidth; load.classList.remove('instant'); txt.textContent = 'LOADING ' + NAME[k].toUpperCase() + '\u2026';
    slowT = setTimeout(()=>{ if (!ready[cur]){ load.classList.add('slow'); txt.textContent = 'STILL LOADING\u2026'; } }, 10000);   /* slow connection: offer a reload */
  }
  function reloadView(k){
    const f = frames[k]; if (f){ f.remove(); delete frames[k]; }
    ready[k] = false; show(k);
  }
  if (retryBtn) retryBtn.addEventListener('click', ()=>reloadView(cur));
  function mount(k){
    if (frames[k]) return frames[k];
    const f = document.createElement('iframe'); f.title = NAME[k]; f.setAttribute('allow', 'fullscreen; camera');
    /* Start as soon as the app's scripts have run (DOMContentLoaded). Do not wait for the frame's 'load' event: it also waits for fonts/images, so one slow request used to keep the loader up. 'load' stays as a fallback. */
    let started = false, poll = 0;
    const begin = ()=>{
      if (started) return; started = true; clearInterval(poll);
      try{ f.contentWindow.dispatchEvent(new Event('resize')); }catch(e){}
      /* stay until the inner app has finished its own start-up (max 6s), then reveal */
      let n = 0;
      (function wait(){ let rdy = true; try{ const m = f.contentDocument.getElementById('loadingMask'); rdy = !m || m.classList.contains('hide'); }catch(e){}
        if (rdy || ++n > 60) settle(); else setTimeout(wait, 100); })();
      /* 3D Sky: keep the loader until the scene runs smoothly (10 quick frames in a row, max 3s) */
      function settle(){
        if (k !== 'A'){ finish(k); return; }
        if (cur === k) txt.textContent = 'WARMING UP THE SKY\u2026';
        let good = 0, last = 0; const t0 = performance.now(); let w; try{ w = f.contentWindow; }catch(e){ finish(k); return; }
        (function f1(ts){
          if (last){ good = (ts - last) < 45 ? good + 1 : 0; } last = ts;
          if (good >= 10 || performance.now() - t0 > 3000) finish(k); else w.requestAnimationFrame(f1);
        })(0);
      }
    };
    f.addEventListener('load', begin);
    poll = setInterval(()=>{ if (!f.isConnected){ clearInterval(poll); return; } try{ const d = f.contentDocument; if (d && d.URL !== 'about:blank' && d.readyState !== 'loading') begin(); }catch(e){} }, 100);
    setSource(f, k); stage.appendChild(f); frames[k] = f; return f;
  }
  const sw = document.getElementById('sw'), swBtn = document.getElementById('swBtn'), swBack = document.getElementById('swBack'), swIco = document.getElementById('swIco');
  const ICON = { A:'🌌', B:'🧭', N:'📝' };
  let cur = 'B', devF = null;
  function setMenu(open){
    if (open) place();
    sw.classList.toggle('open', open); swBack.classList.toggle('show', open);
    swBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function show(k){
    cur = k; closeDev();
    const f = mount(k);
    if (ready[k]) reveal(); else showLoader(k);
    for (const j in frames) frames[j].classList.toggle('on', j === k);
    sw.querySelectorAll('.sw-item[data-act="A"],.sw-item[data-act="B"],.sw-item[data-act="N"]').forEach(b=>{ const on = b.dataset.act === k; b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
    swIco.textContent = ICON[k];
    try{ f.contentWindow.dispatchEvent(new Event('resize')); }catch(e){}
    try{ history.replaceState(null, '', k === 'A' ? '#sky' : k === 'N' ? '#notes' : '#chart'); }catch(e){}
  }
  /* Developer card: its own overlay on top of whatever view is open — never switches views */
  function openDev(){
    if (!devF){ devF = document.createElement('iframe'); devF.id = 'devFrame'; devF.title = 'Developer'; setSource(devF, 'Dev'); document.body.appendChild(devF); }
    devF.classList.add('on');
  }
  function closeDev(){ if (devF) devF.classList.remove('on'); }
  window.addEventListener('message', e=>{ if (e.data === 'vedic-dev-close') closeDev(); else if (e.data === 'vedic-open-chart') show('B'); else if (e.data === 'vedic-open-3d'){ show('A'); [300, 1500].forEach(t=>setTimeout(()=>{ try{ frames.A.contentWindow.postMessage('vedic-bridge-ping','*'); }catch(x){} }, t)); } });

  /* ---- floating, draggable switcher ---- */
  const SZ = 40, M = 10;
  let pos = { x:null, y:null };
  try{ const s = JSON.parse(localStorage.getItem('vedicSwPos') || 'null'); if (s && typeof s.x === 'number') pos = s; }catch(e){}
  function clamp(){
    const W = innerWidth, H = innerHeight;
    if (pos.x == null){ pos.x = W - SZ - M; pos.y = Math.round(H * 0.4); }
    pos.x = Math.min(Math.max(pos.x, M), W - SZ - M);
    pos.y = Math.min(Math.max(pos.y, M + 40), H - SZ - M - 20);
  }
  function place(){
    clamp();
    sw.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
    sw.dataset.x = (pos.x + SZ/2 > innerWidth/2) ? 'r' : 'l';
    sw.dataset.y = (pos.y + SZ/2 > innerHeight/2) ? 'b' : 't';
  }
  function save(){ try{ localStorage.setItem('vedicSwPos', JSON.stringify(pos)); }catch(e){} }
  let drag = null, moved = false;
  swBtn.addEventListener('pointerdown', e=>{
    drag = { sx:e.clientX, sy:e.clientY, ox:pos.x, oy:pos.y, id:e.pointerId }; moved = false;
    try{ swBtn.setPointerCapture(e.pointerId); }catch(_){}
  });
  swBtn.addEventListener('pointermove', e=>{
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!moved && Math.hypot(dx, dy) < 7) return;
    if (!moved){ moved = true; sw.classList.add('drag'); setMenu(false); }
    pos.x = drag.ox + dx; pos.y = drag.oy + dy; place();
  });
  function endDrag(){
    if (!drag) return;
    drag = null; sw.classList.remove('drag');
    if (moved){ pos.x = (pos.x + SZ/2 > innerWidth/2) ? innerWidth - SZ - M : M; place(); save(); }   // snap to nearest side
  }
  swBtn.addEventListener('pointerup', endDrag); swBtn.addEventListener('pointercancel', endDrag);
  swBtn.addEventListener('click', ()=>{ if (moved){ moved = false; return; } setMenu(!sw.classList.contains('open')); });
  addEventListener('resize', place);

  swBack.addEventListener('click', ()=> setMenu(false));
  document.addEventListener('keydown', e=>{ if (e.key === 'Escape' && sw.classList.contains('open')){ setMenu(false); swBtn.focus(); } });
  /* ---- Quick note: long-press the Notepad button to jot a note in a small window, without leaving the chart ---- */
  const NP_KEY = 'vedicNotepad_v1', QN_DRAFT = 'vedicQuickDraft';
  let qn = null, qnT = null, qnSt = null, qnStT = 0, lpT = 0, lpFired = false;
  const qesc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function chartName(){   /* name of the chart open in Birth Chart (if any) */
    try{ const w = frames.B && frames.B.contentWindow; const p = w && w.eval('typeof currentProfileForExport!=="undefined"?currentProfileForExport:null'); return p && p.name ? String(p.name) : ''; }catch(e){ return ''; }
  }
  function qnStatus(msg, bad){ qnSt.textContent = msg; qnSt.classList.toggle('bad', !!bad); clearTimeout(qnStT); if (msg) qnStT = setTimeout(()=>{ qnSt.textContent = ''; }, 3000); }
  function quickSave(){
    const raw = qnT.value.replace(/\s+$/, ''); if (!raw.trim()){ qnStatus('Write something first', true); return; }
    const nm = chartName(), d = new Date();
    const title = (nm ? nm + ' \u00b7 ' : '') + 'Quick note \u00b7 ' + d.toLocaleDateString(undefined, { day:'numeric', month:'short' }) + ', ' + d.toLocaleTimeString(undefined, { hour:'numeric', minute:'2-digit' });
    const html = raw.split(/\n/).map(l => '<p>' + (qesc(l) || '<br>') + '</p>').join('');
    let ok = false;
    try{ const w = frames.N && frames.N.contentWindow; if (w && typeof w.vedicQuickAdd === 'function'){ w.vedicQuickAdd({ title, html, tags:['quick note'] }); ok = true; } }catch(e){}
    if (!ok){   /* Notepad not open yet: add to its saved notes (same shape as Notepad's newNote) */
      try{
        const now = Date.now(); let S = null; try{ S = JSON.parse(localStorage.getItem(NP_KEY) || 'null'); }catch(e){}
        if (!S || !Array.isArray(S.notes)) S = { v:1, notes:[], nbs:[{id:'nb_clients',name:'Clients',ic:'\ud83d\udc64'},{id:'nb_study',name:'Study',ic:'\ud83d\udcda'},{id:'nb_journal',name:'Journal',ic:'\ud83c\udf19'}], preds:[], set:{ theme:'dark', acc:'gold', fs:16, pin:null, welcomed:false }, created:now };
        S.notes.unshift({ id: now.toString(36) + Math.random().toString(36).slice(2,7), title, html, nb:null, tags:['quick note'], pin:false, color:'', created:now, updated:now, trash:false, client:null, ver:[] });
        localStorage.setItem(NP_KEY, JSON.stringify(S)); ok = true;
      }catch(e){}
    }
    if (!ok){ qnStatus('Could not save (browser storage is blocked)', true); return; }
    qnT.value = ''; try{ localStorage.removeItem(QN_DRAFT); }catch(e){}
    qnStatus('Saved to Notepad \u2713');
  }
  function quickClose(){ if (qn) qn.classList.remove('on'); }
  function quickOpen(){
    if (!qn){
      qn = document.createElement('div'); qn.id = 'qnote'; qn.setAttribute('role', 'dialog'); qn.setAttribute('aria-label', 'Quick note');
      qn.innerHTML = '<div class="qn-h" id="qnH"><b>Quick note</b><span class="qn-chart" id="qnChart"></span><button type="button" class="qn-x" id="qnX" aria-label="Close quick note">\u2715</button></div>'
        + '<textarea id="qnT" placeholder="Write a note while you look at the chart\u2026" aria-label="Quick note text"></textarea>'
        + '<div class="qn-f"><span class="qn-st" id="qnSt" role="status"></span><button type="button" class="qn-b" id="qnOpen">Open Notepad</button><button type="button" class="qn-b pri" id="qnSave">Save to Notepad</button></div>';
      document.body.appendChild(qn);
      qnT = qn.querySelector('#qnT'); qnSt = qn.querySelector('#qnSt');
      try{ qnT.value = localStorage.getItem(QN_DRAFT) || ''; }catch(e){}
      qnT.addEventListener('input', ()=>{ try{ localStorage.setItem(QN_DRAFT, qnT.value); }catch(e){} });
      qn.addEventListener('keydown', e=>{ if (e.key === 'Escape'){ quickClose(); } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter'){ quickSave(); } });
      qn.querySelector('#qnX').addEventListener('click', quickClose);
      qn.querySelector('#qnSave').addEventListener('click', quickSave);
      qn.querySelector('#qnOpen').addEventListener('click', ()=>{ quickClose(); show('N'); });
      /* drag by the title bar */
      const hd = qn.querySelector('#qnH'); let dg = null;
      hd.addEventListener('pointerdown', e=>{ if (e.target.closest('button')) return; const r = qn.getBoundingClientRect(); dg = { sx:e.clientX, sy:e.clientY, ox:r.left, oy:r.top }; try{ hd.setPointerCapture(e.pointerId); }catch(_){} });
      hd.addEventListener('pointermove', e=>{ if (!dg) return; const r = qn.getBoundingClientRect();
        qn.style.left = Math.min(Math.max(dg.ox + e.clientX - dg.sx, 4), innerWidth - r.width - 4) + 'px';
        qn.style.top = Math.min(Math.max(dg.oy + e.clientY - dg.sy, 4), innerHeight - 60) + 'px'; });
      const end = ()=>{ dg = null; }; hd.addEventListener('pointerup', end); hd.addEventListener('pointercancel', end);
      qn.classList.add('on');
      qn.style.left = Math.max(8, Math.round((innerWidth - qn.offsetWidth) / 2)) + 'px';
      qn.style.top = 'calc(env(safe-area-inset-top, 0px) + 64px)';   /* near the top so the phone keyboard does not cover it */
    }
    qn.querySelector('#qnChart').textContent = chartName();
    qn.classList.add('on'); qnStatus('');
    qnT.focus();
  }
  const npItem = sw.querySelector('.sw-item[data-act="N"]');
  let lpX = 0, lpY = 0;
  npItem.addEventListener('pointerdown', e=>{ lpFired = false; lpX = e.clientX; lpY = e.clientY; clearTimeout(lpT); lpT = setTimeout(()=>{ lpFired = true; setMenu(false); quickOpen(); }, 500); });
  npItem.addEventListener('pointermove', e=>{ if (Math.hypot(e.clientX - lpX, e.clientY - lpY) > 12) clearTimeout(lpT); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => npItem.addEventListener(ev, ()=>clearTimeout(lpT)));
  npItem.addEventListener('contextmenu', e=>{ e.preventDefault(); });   /* no browser menu on long-press / right-click */
  npItem.addEventListener('keydown', e=>{ if (e.key === 'q' || e.key === 'Q'){ e.preventDefault(); setMenu(false); quickOpen(); } });

  /* Settings (main menu): one switch for now, "Copy buttons" (off by default). Apps hide/show their copy buttons through shared/copy-toggle.js */
  let vs = null;
  function glassOn(){ try { return localStorage.getItem('vedicGlass') !== '0'; } catch (e) { return true; } }
  function copyOn(){ try { return localStorage.getItem('vedicCopyBtns') === '1'; } catch (e) { return false; } }
  function openSettings(){
    if (!vs){
      vs = document.createElement('div'); vs.id = 'vset'; vs.setAttribute('role', 'dialog'); vs.setAttribute('aria-label', 'Settings');
      vs.innerHTML = '<div class="vs-box"><div class="vs-h"><b>⚙️ Settings</b><button type="button" class="vs-x" aria-label="Close">✕</button></div>' +
        '<label class="vs-row"><span><b>Glass look</b><small>Soft translucent style across all apps. Turn off for the plain flat look.</small></span><input type="checkbox" id="vsGlass"><i></i></label>' +
        '<label class="vs-row"><span><b>Copy buttons</b><small>Show the "Copy" buttons across the apps. Off by default.</small></span><input type="checkbox" id="vsCopy"><i></i></label></div>';
      document.body.appendChild(vs);
      vs.addEventListener('click', e=>{ if (e.target === vs || e.target.closest('.vs-x')) vs.classList.remove('on'); });
      document.addEventListener('keydown', e=>{ if (e.key === 'Escape') vs.classList.remove('on'); });
      vs.querySelector('#vsGlass').addEventListener('change', e=>{
        try { localStorage.setItem('vedicGlass', e.target.checked ? '1' : '0'); } catch (x) {}
        if (window.vedicGlassApply) window.vedicGlassApply();
        for (const k in frames){ try { frames[k].contentWindow.postMessage('vedic-glass-toggle', '*'); } catch (x) {} }
      });
      vs.querySelector('#vsCopy').addEventListener('change', e=>{
        try { localStorage.setItem('vedicCopyBtns', e.target.checked ? '1' : '0'); } catch (x) {}
        for (const k in frames){ try { frames[k].contentWindow.postMessage('vedic-copy-toggle', '*'); } catch (x) {} }
      });
    }
    vs.querySelector('#vsCopy').checked = copyOn();
    vs.querySelector('#vsGlass').checked = glassOn(); vs.classList.add('on');
  }

  sw.querySelectorAll('.sw-item').forEach(b=> b.addEventListener('click', ()=>{
    const a = b.dataset.act;
    if (a === 'N' && lpFired){ lpFired = false; return; }   /* the long-press already opened the quick note */
    setMenu(false);
    if (a === 'dev') openDev(); else if (a === 'set') openSettings(); else show(a);
  }));
  place();
  show(location.hash === '#sky' ? 'A' : location.hash === '#notes' ? 'N' : 'B');
  if (location.hash === '#developer') openDev();
})();

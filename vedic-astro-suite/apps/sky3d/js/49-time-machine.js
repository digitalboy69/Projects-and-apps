/* ===== Time Machine: fast date + time picker (year slider, hold-to-repeat steps, typed dates, month/day tiles) + zoomable, draggable timeline ===== */
(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let Y_MIN = 1800, Y_MAX = 2200, wide = false;
  const Y_ALL0 = -4712, Y_ALL1 = 9999, pad = n => String(n).padStart(2,'0');
  // Dates are plain {y,m,d,h,mi} (y astronomical, m 0-11): exact for BC and the Julian calendar, which a JS Date cannot do.
  const isG = (y,m,d) => y > 1582 || (y === 1582 && (m > 9 || (m === 9 && d >= 15)));
  const dim = (y,m) => { const lj = ((y % 4) + 4) % 4 === 0, lg = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0, leap = (y > 1582 || (y === 1582 && m >= 9)) ? lg : lj; return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m]; };
  const fixGap = (y,m,d) => (y === 1582 && m === 9 && d >= 5 && d <= 14) ? 4 : d;   // 5-14 Oct 1582 never happened
  const mk = (y,m,d,h,mi) => ({ y, m, d: fixGap(y, m, d), h, mi });
  const toJD = p => { const j = toJulianDay(p.y, p.m + 1, p.d, p.h, p.mi, 0); return j - localOffsetMin(j) / 1440; };
  const cur = () => { const c = jdToDate(currentJD); return { y: c.getFullYear(), m: c.getMonth(), d: c.getDate(), h: c.getHours(), mi: c.getMinutes(), wd: c.getDay() }; };
  const yl = y => yearLabel(y);
  const fromJD = jd => { const c = jdToDate(jd); return { y: c.getFullYear(), m: c.getMonth(), d: c.getDate(), h: c.getHours(), mi: c.getMinutes() }; };
  let raf = 0, pend = null;
  function go(d){                                           // throttled: one jump per animation frame
    pend = d; if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; if (pend){ jumpToJD(toJD(pend)); pend = null; paint(); } });
  }
  function add(unit, n){
    const d = cur(), y = d.y, m = d.m, day = d.d, h = d.h, mi = d.mi;
    if (unit === 'y'){ const ny = y + n; return mk(ny, m, Math.min(day, dim(ny, m)), h, mi); }
    if (unit === 'mo'){ const t = m + n, ny = y + Math.floor(t/12), nm = ((t % 12) + 12) % 12; return mk(ny, nm, Math.min(day, dim(ny, nm)), h, mi); }
    const dd = { w:7, d:1, h:1/24 }[unit] * n; return fromJD(currentJD + dd);
  }
  // ---- smart typed date ----
  function parse(t){
    t = t.trim().replace(/,/g,' ').replace(/\s+/g,' '); if (!t) return null;
    let m, h = 0, mi = 0;
    const tm = t.match(/(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (tm){ h = +tm[1]; mi = +tm[2]; if (tm[3]){ const p = tm[3].toLowerCase(); if (p === 'pm' && h < 12) h += 12; if (p === 'am' && h === 12) h = 0; } t = t.slice(0, tm.index).trim(); }
    let y, mo, d, bc = false;
    const em = t.match(/\s*(BCE?|B\.C\.?|ADE?|CE|A\.D\.?)$/i); if (em){ bc = /^b/i.test(em[1]); t = t.slice(0, em.index).trim(); }
    const neg = /^-\d{1,4}$/.test(t); if (neg){ bc = true; t = t.slice(1); }
    if ((m = t.match(/^(\d{1,4})$/))){ const c = cur(); y = +m[1]; mo = c.m; d = Math.min(c.d, dim(bc ? 1 - y : y, mo)); if (!tm){ h = c.h; mi = c.mi; } }
    else if ((m = t.match(/^(\d{1,4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/))){ y = +m[1]; mo = +m[2]-1; d = +m[3]; }
    else if ((m = t.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{1,4})$/))){ y = +m[3]; mo = +m[2]-1; d = +m[1]; }
    else if ((m = t.match(/^(\d{1,2}) ?([A-Za-z]{3,9}) ?(\d{1,4})$/))){ y = +m[3]; mo = MON.findIndex(x => m[2].toLowerCase().startsWith(x.toLowerCase())); d = +m[1]; }
    else if ((m = t.match(/^([A-Za-z]{3,9}) ?(\d{1,2}) ?(\d{1,4})$/))){ y = +m[3]; mo = MON.findIndex(x => m[1].toLowerCase().startsWith(x.toLowerCase())); d = +m[2]; }
    else return null;
    if (bc) y = 1 - y;
    if (mo < 0 || mo > 11 || d < 1 || d > dim(y, mo) || y < Y_ALL0 || y > Y_ALL1 || h > 23 || mi > 59 || (y === 1582 && mo === 9 && d >= 5 && d <= 14)) return null;
    return mk(y, mo, d, h, mi);
  }
  // ---- UI: five snapping wheels (day, month, year, hour, minute) + quick steppers ----
  let ov;
  const IH = 34, W = {};                                    // wheel item height; wheel state by key
  const KEYS = ['d','m','y','h','mi'];
  const labels = {
    m: () => MON.map(n => n), y: () => Array.from({length: Y_ALL1 - Y_ALL0 + 1}, (_, i) => yl(Y_ALL0 + i)),
    h: () => Array.from({length: 24}, (_, i) => pad(i)), mi: () => Array.from({length: 60}, (_, i) => pad(i))
  };
  function fill(k, list){ const w = W[k]; w.n = list.length; w.el.innerHTML = list.map((t, i) => `<div class="tm-it" data-i="${i}">${t}</div>`).join(''); w.idx = -1; }
  function mark(k, idx){ const w = W[k], old = w.el.querySelector('.on'); if (old) old.classList.remove('on'); const it = w.el.children[idx]; if (it) it.classList.add('on'); }
  function pick(k, idx){                                    // a wheel was turned by the user
    const c = cur(), y = c.y, m = c.m, d = c.d, h = c.h, mi = c.mi;
    if (k === 'd') go(mk(y, m, idx + 1, h, mi));
    else if (k === 'm') go(mk(y, idx, Math.min(d, dim(y, idx)), h, mi));
    else if (k === 'y'){ const ny = Y_ALL0 + idx; go(mk(ny, m, Math.min(d, dim(ny, m)), h, mi)); }
    else if (k === 'h') go(mk(y, m, d, idx, mi));
    else go(mk(y, m, d, h, idx));
  }
  function place(k, idx, smooth){ const w = W[k]; w.idx = idx; mark(k, idx); w.el.scrollTo({ top: idx * IH, behavior: smooth ? 'smooth' : 'auto' }); }
  function scale(){
    Y_MIN = wide ? Y_ALL0 : 1800; Y_MAX = wide ? Y_ALL1 : 2200;
    const r = $('tmYear'), t = $('tmTicks'), w = $('tmWide'); if (!r) return;
    r.min = Y_MIN; r.max = Y_MAX;
    const ticks = wide ? [Y_ALL0, 0, 2500, 5000, 7500, Y_ALL1] : [1800, 1900, 2000, 2100, 2200];
    t.innerHTML = ticks.map(v => `<span>${yl(v)}</span>`).join('');
    w.textContent = wide ? '↔ Show 1800–2200 only' : '↔ All years (4713 BC – 9999)';
  }
  function build(){
    ov = document.createElement('div'); ov.className = 'tm-ov'; ov.id = 'tmOv';
    ov.innerHTML = `<div class="tm-card" role="dialog" aria-modal="true" aria-label="Pick date and time">
      <div class="tm-top"><b>Pick date &amp; time</b><button type="button" class="tm-x" id="tmX" aria-label="Close">✕</button></div>
      <div class="tm-big"><div class="tm-date" id="tmDate"></div><div class="tm-sub" id="tmSub"></div></div>
      <div class="tm-wheels"><div class="tm-band"></div>
        ${KEYS.slice(0, 3).map(k => `<div class="tm-wl" data-w="${k}" tabindex="0" role="listbox" aria-label="${{d:'Day',m:'Month',y:'Year'}[k]}"></div>`).join('')}
        <div class="tm-colon">:</div>
        ${KEYS.slice(3).map(k => `<div class="tm-wl" data-w="${k}" tabindex="0" role="listbox" aria-label="${{h:'Hour',mi:'Minute'}[k]}"></div>`).join('')}</div>
      <div class="tm-wlabs"><span>Day</span><span>Month</span><span>Year</span><span></span><span>Hour</span><span>Min</span></div>
      <div class="tm-st" data-u="d"><button data-u="y" data-n="-1">−1y</button><button data-u="mo" data-n="-1">−1mo</button><button data-n="-1">−1d</button><button data-n="1">+1d</button><button data-u="mo" data-n="1">+1mo</button><button data-u="y" data-n="1">+1y</button></div>
      <div class="tm-st tm-st4" data-u="y"><button data-n="-100">−100y</button><button data-n="-10">−10y</button><button data-n="10">+10y</button><button data-n="100">+100y</button></div>
      <div class="tm-lab">Year scrub <em id="tmYv"></em></div>
      <input type="range" id="tmYear" min="${Y_MIN}" max="${Y_MAX}" step="1" aria-label="Year">
      <div class="tm-ticks" id="tmTicks"></div>
      <button type="button" class="tm-wide" id="tmWide"></button>
      <div class="tm-q"><button type="button" class="now" id="tmNow">Now</button><button type="button" class="birth" id="tmBirth" hidden>✦ Birth moment</button><button type="button" id="tmY0">1 Jan this year</button><button type="button" id="tmMid">Midnight</button></div>
      <form class="tm-type" id="tmForm"><input id="tmIn" type="text" inputmode="text" autocomplete="off" placeholder="Or type: 15 Aug 1998 10:30, 1850, 14 Mar 500 BC"><button class="tm-go" type="submit">Go</button></form>
    </div>`;
    document.body.appendChild(ov); scale();
    KEYS.forEach(k => { W[k] = { el: ov.querySelector(`[data-w="${k}"]`), idx: -1, n: 0, last: 0, t: 0 }; });
    fill('m', labels.m()); fill('y', labels.y()); fill('h', labels.h()); fill('mi', labels.mi());
    KEYS.forEach(k => {
      const w = W[k];
      w.el.addEventListener('scroll', () => {
        w.last = Date.now();
        const idx = Math.max(0, Math.min(w.n - 1, Math.round(w.el.scrollTop / IH)));
        if (idx === w.idx) return;
        w.idx = idx; mark(k, idx);
        if (!w.t) w.t = setTimeout(() => { w.t = 0; pick(k, w.idx); }, 90);   // live while spinning, final value when it stops
      }, { passive: true });
      w.el.addEventListener('click', e => { const it = e.target.closest('.tm-it'); if (it) w.el.scrollTo({ top: +it.dataset.i * IH, behavior: 'smooth' }); });
      w.el.addEventListener('keydown', e => {
        const dir = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0; if (!dir) return;
        e.preventDefault(); e.stopPropagation(); w.el.scrollTo({ top: Math.max(0, Math.min(w.n - 1, w.idx + dir)) * IH, behavior: 'smooth' });
      });
    });
    const close = () => { ov.classList.remove('show'); document.body.classList.remove('tm-open'); };
    ov.addEventListener('pointerdown', e => { if (e.target === ov) close(); });
    $('tmX').addEventListener('click', close);
    $('tmYear').addEventListener('input', e => { const c = cur(), y = +e.target.value; go(mk(y, c.m, Math.min(c.d, dim(y, c.m)), c.h, c.mi)); $('tmYv').textContent = yl(y); });
    $('tmWide').addEventListener('click', () => { wide = !wide; scale(); paint(); });
    $('tmForm').addEventListener('submit', e => { e.preventDefault(); const d = parse($('tmIn').value); $('tmIn').classList.toggle('bad', !d); if (d){ go(d); $('tmIn').value = ''; $('tmIn').blur(); } });
    $('tmNow').addEventListener('click', () => { const n = new Date(); jumpToJD(toJulianDay(n.getUTCFullYear(), n.getUTCMonth() + 1, n.getUTCDate(), n.getUTCHours(), n.getUTCMinutes(), 0)); paint(); });
    $('tmY0').addEventListener('click', () => { const c = cur(); go(mk(c.y, 0, 1, 0, 0)); });
    $('tmMid').addEventListener('click', () => { const c = cur(); go(mk(c.y, c.m, c.d, 0, 0)); });
    $('tmBirth').addEventListener('click', () => { const p = activeNatalProfile; if (!p) return; const [y,m,d] = parseDob(p.dob), [h,mi] = p.tob.split(':').map(Number); jumpToJD(toJulianDay(y,m,d,h,mi,0) - p.tz/24); paint(); });
    // hold-to-repeat steppers
    ov.querySelectorAll('.tm-st').forEach(box => {
      let t1, t2;
      const step = b => go(add(b.dataset.u || box.dataset.u, +b.dataset.n));
      const stop = () => { clearTimeout(t1); clearInterval(t2); };
      box.addEventListener('pointerdown', e => { const b = e.target.closest('button'); if (!b) return; e.preventDefault(); step(b); t1 = setTimeout(() => { t2 = setInterval(() => step(b), 70); }, 380); });
      ['pointerup','pointerleave','pointercancel'].forEach(ev => box.addEventListener(ev, stop));
    });
    document.addEventListener('keydown', e => {
      if (!ov.classList.contains('show')) return;
      if (e.key === 'Escape') close();
      else if (!/^(INPUT|TEXTAREA)$/.test((e.target||{}).tagName) && !(e.target.classList && e.target.classList.contains('tm-wl')) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')){ e.preventDefault(); go(add(e.shiftKey ? 'mo' : 'd', e.key === 'ArrowLeft' ? -1 : 1)); }
    });
  }
  function paint(){
    if (!ov || !ov.classList.contains('show')) return;
    const c = cur(), y = c.y, m = c.m, d = c.d, now = Date.now();
    if ((y < 1800 || y > 2200) && !wide){ wide = true; scale(); }
    $('tmDate').textContent = `${pad(d)} ${MON[m]} ${yl(y)}`;
    $('tmSub').textContent = `${WD[c.wd]} · ${pad(c.h)}:${pad(c.mi)} local · JD ${currentJD.toFixed(2)}${isG(y, m, d) ? '' : ' · Julian calendar'}`;
    $('tmYear').value = Math.max(Y_MIN, Math.min(Y_MAX, y)); $('tmYv').textContent = yl(y);
    // day wheel depends on month length and shows the weekday
    const n = dim(y, m), firstWd = ((Math.floor(toJulianDay(y, m + 1, 1, 12, 0, 0) + 0.5) + 1) % 7 + 7) % 7;
    if (W.d.n !== n || W.d.key !== y + '-' + m){ W.d.key = y + '-' + m; fill('d', Array.from({length: n}, (_, i) => `${i + 1}<small>${WD[(firstWd + i) % 7]}</small>`)); }
    const target = { d: d - 1, m, y: Math.max(0, Math.min(Y_ALL1 - Y_ALL0, y - Y_ALL0)), h: c.h, mi: c.mi };
    KEYS.forEach(k => { const w = W[k]; if (now - w.last < 450 || w.t) return; if (w.idx !== target[k] || Math.abs(w.el.scrollTop - target[k] * IH) > 2) place(k, target[k], false); });
    $('tmBirth').hidden = !(typeof isValidProfile === 'function' && isValidProfile(activeNatalProfile));
  }
  function open(){ if (!ov) build(); ov.classList.add('show'); document.body.classList.add('tm-open'); KEYS.forEach(k => { W[k].idx = -1; W[k].last = 0; }); paint(); requestAnimationFrame(paint); }
  window.openTimeMachine = open;
  // keep the dial in step with play / timeline drags while it is open
  setInterval(paint, 600);
  // open from the 📅 button (replaces the heavy native picker) and from the date in the HUD
  document.addEventListener('click', e => {
    if (e.target.closest('#tlJumpToggle')){ e.preventDefault(); e.stopImmediatePropagation(); open(); }
    else if (e.target.closest('.hud-datetime')) open();
  }, true);
  // ---- timeline: drag to scrub, zoom ranges, end dates ----
  const track = $('tlTrack'), wrap = track && track.parentNode, ctl = document.querySelector('.timeline-controls');
  const ZOOM = { '1M':[-10,20], '1Y':[-30,365], '10Y':[-365,3287], '100Y':[-3652,32870] };
  let zoom = '1Y';
  function applyZoom(k){
    zoom = k; const z = ZOOM[k]; timelineWindowStart = currentJD + z[0]; timelineWindowEnd = currentJD + z[1];
    renderTimeline(); sync();
  }
  function sync(){
    const span = timelineWindowEnd - timelineWindowStart;
    if (span > 1500) track.querySelectorAll('.tl-tick').forEach(t => t.remove());   // too dense to read when zoomed out
    const l = $('tlEndL'), r = $('tlEndR'); if (l) l.textContent = formatHudDate(timelineWindowStart); if (r) r.textContent = formatHudDate(timelineWindowEnd);
    document.querySelectorAll('.tl-zoom button').forEach(b => b.classList.toggle('on', b.dataset.z === zoom));
  }
  if (track && ctl){
    const zb = document.createElement('div'); zb.className = 'tl-zoom'; zb.setAttribute('aria-label','Timeline range');
    zb.innerHTML = Object.keys(ZOOM).map(k => `<button type="button" data-z="${k}" title="Timeline shows ${k}">${k}</button>`).join('');
    ctl.insertBefore(zb, $('tlJumpToggle'));
    zb.addEventListener('click', e => { const b = e.target.closest('[data-z]'); if (b) applyZoom(b.dataset.z); });
    const ends = document.createElement('div'); ends.className = 'tl-ends'; ends.innerHTML = '<span id="tlEndL"></span><span id="tlEndR"></span>'; wrap.after(ends);
    let drag = false;
    const at = e => { const r = track.getBoundingClientRect(), f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); jumpToJD(timelineWindowStart + f * (timelineWindowEnd - timelineWindowStart)); };
    track.addEventListener('pointerdown', e => { drag = true; track.setPointerCapture(e.pointerId); at(e); });
    track.addEventListener('pointermove', e => { if (drag) at(e); });
    ['pointerup','pointercancel'].forEach(ev => track.addEventListener(ev, () => { drag = false; }));
    // zoom persists while playing: the main loop snaps the window back to 1Y when it runs out
    setInterval(() => { const z = ZOOM[zoom], span = timelineWindowEnd - timelineWindowStart; if (span !== z[1] - z[0] && !drag && zoom !== '1Y') applyZoom(zoom); sync(); }, 500);
    sync();
  }
})();

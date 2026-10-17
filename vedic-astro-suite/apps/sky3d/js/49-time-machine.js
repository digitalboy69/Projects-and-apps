/* ===== Time Machine: fast date + time picker (year slider, hold-to-repeat steps, typed dates, month/day tiles) + zoomable, draggable timeline ===== */
(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const Y_MIN = 1800, Y_MAX = 2200, pad = n => String(n).padStart(2,'0');
  const dim = (y,m) => new Date(y, m+1, 0).getDate();
  const mk = (y,m,d,h,mi) => { const t = new Date(2000,0,1,0,0,0); t.setFullYear(y, m, d); t.setHours(h, mi, 0, 0); return t; };
  const toJD = d => toJulianDay(d.getUTCFullYear(), d.getUTCMonth()+1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), 0);
  const cur = () => jdToDate(currentJD);                    // local-time Date for the JD being shown
  let raf = 0, pend = null;
  function go(d){                                           // throttled: one jump per animation frame
    pend = d; if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; if (pend){ jumpToJD(toJD(pend)); pend = null; paint(); } });
  }
  function add(unit, n){
    const d = cur(), y = d.getFullYear(), m = d.getMonth(), day = d.getDate(), h = d.getHours(), mi = d.getMinutes();
    if (unit === 'y'){ const ny = y + n; return mk(ny, m, Math.min(day, dim(ny, m)), h, mi); }
    if (unit === 'mo'){ const t = m + n, ny = y + Math.floor(t/12), nm = ((t % 12) + 12) % 12; return mk(ny, nm, Math.min(day, dim(ny, nm)), h, mi); }
    const ms = { w:7*864e5, d:864e5, h:36e5 }[unit] * n; return new Date(d.getTime() + ms);
  }
  // ---- smart typed date ----
  function parse(t){
    t = t.trim().replace(/,/g,' ').replace(/\s+/g,' '); if (!t) return null;
    let m, h = 0, mi = 0;
    const tm = t.match(/(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (tm){ h = +tm[1]; mi = +tm[2]; if (tm[3]){ const p = tm[3].toLowerCase(); if (p === 'pm' && h < 12) h += 12; if (p === 'am' && h === 12) h = 0; } t = t.slice(0, tm.index).trim(); }
    let y, mo, d;
    if ((m = t.match(/^(\d{4})$/))){ const c = cur(); y = +m[1]; mo = c.getMonth(); d = Math.min(c.getDate(), dim(y, mo)); if (!tm){ h = c.getHours(); mi = c.getMinutes(); } }
    else if ((m = t.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/))){ y = +m[1]; mo = +m[2]-1; d = +m[3]; }
    else if ((m = t.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/))){ y = +m[3]; mo = +m[2]-1; d = +m[1]; }
    else if ((m = t.match(/^(\d{1,2}) ?([A-Za-z]{3,9}) ?(\d{4})$/))){ y = +m[3]; mo = MON.findIndex(x => m[2].toLowerCase().startsWith(x.toLowerCase())); d = +m[1]; }
    else if ((m = t.match(/^([A-Za-z]{3,9}) ?(\d{1,2}) ?(\d{4})$/))){ y = +m[3]; mo = MON.findIndex(x => m[1].toLowerCase().startsWith(x.toLowerCase())); d = +m[2]; }
    else return null;
    if (mo < 0 || mo > 11 || d < 1 || d > dim(y, mo) || y < 1 || h > 23 || mi > 59) return null;
    return mk(y, mo, d, h, mi);
  }
  // ---- UI ----
  let ov;
  function build(){
    ov = document.createElement('div'); ov.className = 'tm-ov'; ov.id = 'tmOv';
    ov.innerHTML = `<div class="tm-card" role="dialog" aria-modal="true" aria-label="Time Machine">
      <div class="tm-top"><b>Time Machine</b><button type="button" class="tm-x" id="tmX" aria-label="Close">✕</button></div>
      <div class="tm-big"><div class="tm-date" id="tmDate"></div><div class="tm-sub" id="tmSub"></div></div>
      <form class="tm-type" id="tmForm"><input id="tmIn" type="text" inputmode="text" autocomplete="off" placeholder="Type a date: 15 Aug 1998 10:30, 1850, 2031-04-09"><button class="tm-go" type="submit">Go</button></form>
      <div class="tm-lab">Year <em id="tmYv"></em></div>
      <input type="range" id="tmYear" min="${Y_MIN}" max="${Y_MAX}" step="1" aria-label="Year">
      <div class="tm-ticks"><span>1800</span><span>1900</span><span>2000</span><span>2100</span><span>2200</span></div>
      <div class="tm-st" data-u="y"><button data-n="-100">−100y</button><button data-n="-10">−10y</button><button data-n="-1">−1y</button><button data-n="1">+1y</button></div>
      <div class="tm-st" data-u="y"><button data-n="10">+10y</button><button data-n="100">+100y</button><button data-u="mo" data-n="-1">−1mo</button><button data-u="mo" data-n="1">+1mo</button></div>
      <div class="tm-lab">Month</div><div class="tm-months" id="tmMonths"></div>
      <div class="tm-lab">Day</div><div class="tm-wk">${WD.map(w=>`<span>${w[0]}${w[1]}</span>`).join('')}</div><div class="tm-days" id="tmDays"></div>
      <div class="tm-lab">Hour <em id="tmHv"></em></div><input type="range" id="tmHour" min="0" max="23" step="1" aria-label="Hour">
      <div class="tm-lab">Minute <em id="tmMv"></em></div><input type="range" id="tmMin" min="0" max="59" step="1" aria-label="Minute">
      <div class="tm-st" data-u="d"><button data-u="w" data-n="-1">−1w</button><button data-n="-1">−1d</button><button data-n="1">+1d</button><button data-u="w" data-n="1">+1w</button></div>
      <div class="tm-q"><button type="button" class="now" id="tmNow">Now</button><button type="button" class="birth" id="tmBirth" hidden>✦ Birth moment</button><button type="button" id="tmY0">1 Jan this year</button></div>
    </div>`;
    document.body.appendChild(ov);
    const close = () => ov.classList.remove('show');
    ov.addEventListener('pointerdown', e => { if (e.target === ov) close(); });
    $('tmX').addEventListener('click', close);
    $('tmYear').addEventListener('input', e => { const c = cur(), y = +e.target.value; go(mk(y, c.getMonth(), Math.min(c.getDate(), dim(y, c.getMonth())), c.getHours(), c.getMinutes())); $('tmYv').textContent = y; });
    $('tmHour').addEventListener('input', e => { const c = cur(); go(mk(c.getFullYear(), c.getMonth(), c.getDate(), +e.target.value, c.getMinutes())); });
    $('tmMin').addEventListener('input', e => { const c = cur(); go(mk(c.getFullYear(), c.getMonth(), c.getDate(), c.getHours(), +e.target.value)); });
    $('tmMonths').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; const c = cur(), m = +b.dataset.m; go(mk(c.getFullYear(), m, Math.min(c.getDate(), dim(c.getFullYear(), m)), c.getHours(), c.getMinutes())); });
    $('tmDays').addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (!b) return; const c = cur(); go(mk(c.getFullYear(), c.getMonth(), +b.dataset.d, c.getHours(), c.getMinutes())); });
    $('tmForm').addEventListener('submit', e => { e.preventDefault(); const d = parse($('tmIn').value); $('tmIn').classList.toggle('bad', !d); if (d){ go(d); $('tmIn').value = ''; $('tmIn').blur(); } });
    $('tmNow').addEventListener('click', () => go(new Date()));
    $('tmY0').addEventListener('click', () => { const c = cur(); go(mk(c.getFullYear(), 0, 1, 0, 0)); });
    $('tmBirth').addEventListener('click', () => { const p = activeNatalProfile; if (!p) return; const [y,m,d] = p.dob.split('-').map(Number), [h,mi] = p.tob.split(':').map(Number); jumpToJD(toJulianDay(y,m,d,h,mi,0) - p.tz/24); paint(); });
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
      else if (!/^(INPUT|TEXTAREA)$/.test((e.target||{}).tagName) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')){ e.preventDefault(); go(add(e.shiftKey ? 'mo' : 'd', e.key === 'ArrowLeft' ? -1 : 1)); }
    });
  }
  function paint(){
    if (!ov || !ov.classList.contains('show')) return;
    const c = cur(), y = c.getFullYear(), m = c.getMonth(), d = c.getDate();
    $('tmDate').textContent = `${pad(d)} ${MON[m]} ${y}`;
    $('tmSub').textContent = `${WD[c.getDay()]} · ${pad(c.getHours())}:${pad(c.getMinutes())} local · JD ${currentJD.toFixed(2)}`;
    $('tmYear').value = Math.max(Y_MIN, Math.min(Y_MAX, y)); $('tmYv').textContent = y;
    $('tmHour').value = c.getHours(); $('tmHv').textContent = pad(c.getHours());
    $('tmMin').value = c.getMinutes(); $('tmMv').textContent = pad(c.getMinutes());
    $('tmMonths').innerHTML = MON.map((n,i) => `<button type="button" data-m="${i}" class="${i===m?'on':''}">${n}</button>`).join('');
    const first = new Date(2000,0,1); first.setFullYear(y, m, 1);
    $('tmDays').innerHTML = '<i></i>'.repeat(first.getDay()).replace(/<i><\/i>/g,'<button type="button" tabindex="-1" disabled style="visibility:hidden"></button>') +
      Array.from({length:dim(y,m)}, (_,i) => `<button type="button" data-d="${i+1}" class="${i+1===d?'on':''}">${i+1}</button>`).join('');
    $('tmBirth').hidden = !(typeof isValidProfile === 'function' && isValidProfile(activeNatalProfile));
  }
  function open(){ if (!ov) build(); ov.classList.add('show'); paint(); }
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

/* ===== Time Machine: fast date + time picker (year slider, hold-to-repeat steps, typed dates, month/day tiles) + zoomable, draggable timeline ===== */
(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
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
  // Light jump while the user is scrubbing: move the scene + HUD at once, run the heavy feeds/timeline refresh once when they pause.
  let fullT = 0;
  function fastJump(jd){
    currentJD = jd;
    if (jd < timelineWindowStart || jd > timelineWindowEnd){ timelineWindowStart = jd - 30; timelineWindowEnd = jd + 365; }
    const snap = updateSceneForJD(jd); renderHUD(snap); renderSkyTable(snap); renderTimelineLight();
    clearTimeout(fullT); fullT = setTimeout(() => { fullT = 0; refreshAll(); }, 240);
  }
  let raf = 0, pend = null;
  function go(d){                                           // throttled: one jump per animation frame
    pend = d; if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; if (pend){ fastJump(toJD(pend)); pend = null; paint(); } });
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
  // ---- UI: a plain, clear picker: date + time fields, a typed-date box, quick buttons, saved moments ----
  let ov;
  const dv = c => `${String(Math.abs(c.y)).padStart(4, '0')}-${pad(c.m + 1)}-${pad(c.d)}`;
  function build(){
    ov = document.createElement('div'); ov.className = 'tm-ov'; ov.id = 'tmOv';
    ov.innerHTML = `<div class="tm-card" role="dialog" aria-modal="true" aria-label="Pick date and time">
      <div class="tm-top"><b>Pick date &amp; time</b><button type="button" class="tm-x" id="tmX" aria-label="Close">✕</button></div>
      <div class="tm-big"><div class="tm-date" id="tmDate"></div><div class="tm-sub" id="tmSub"></div></div>
      <div class="tm-fields">
        <label><span>Date</span><input type="date" id="tmD" min="0001-01-01" max="9999-12-31"></label>
        <label><span>Time</span><input type="time" id="tmT"></label>
      </div>
      <form class="tm-type" id="tmForm"><input id="tmIn" type="text" inputmode="text" autocomplete="off" aria-label="Type a date" placeholder="Type: 15 Aug 1998 10:30"><button class="tm-go" type="submit">Go</button></form>
      <div class="tm-q"><button type="button" class="now" id="tmNow">Now</button><button type="button" id="tmMid">Midnight</button><button type="button" class="birth" id="tmBirth" hidden>✦ Birth moment</button><button type="button" class="sv" id="tmSave">★ Save moment</button><button type="button" class="svl" id="tmSaved">Saved <em id="tmSvN">0</em></button></div>
      <button type="button" class="tm-done" id="tmDone">Done</button>
    </div>`;
    document.body.appendChild(ov);
    const close = () => { ov.classList.remove('show'); document.body.classList.remove('tm-open'); };
    ov.addEventListener('pointerdown', e => { if (e.target === ov) close(); });
    $('tmX').addEventListener('click', close); $('tmDone').addEventListener('click', close);
    const fromFields = () => {
      const dd = $('tmD').value.match(/^(\d{4})-(\d{2})-(\d{2})$/), tt = $('tmT').value.match(/^(\d{2}):(\d{2})/); if (!dd) return;
      go(mk(+dd[1], +dd[2] - 1, +dd[3], tt ? +tt[1] : cur().h, tt ? +tt[2] : cur().mi));
    };
    $('tmD').addEventListener('change', fromFields); $('tmT').addEventListener('change', fromFields);
    $('tmForm').addEventListener('submit', e => { e.preventDefault(); const d = parse($('tmIn').value); $('tmIn').classList.toggle('bad', !d); if (d){ go(d); $('tmIn').value = ''; $('tmIn').blur(); } });
    $('tmNow').addEventListener('click', () => { const n = new Date(); jumpToJD(toJulianDay(n.getUTCFullYear(), n.getUTCMonth() + 1, n.getUTCDate(), n.getUTCHours(), n.getUTCMinutes(), 0)); paint(true); });
    $('tmMid').addEventListener('click', () => { const c = cur(); go(mk(c.y, c.m, c.d, 0, 0)); });
    $('tmBirth').addEventListener('click', () => { const p = activeNatalProfile; if (!p) return; const [y,m,d] = parseDob(p.dob), [h,mi] = p.tob.split(':').map(Number); jumpToJD(toJulianDay(y,m,d,h,mi,0) - p.tz/24); paint(true); });
    document.addEventListener('keydown', e => { if (ov.classList.contains('show') && e.key === 'Escape') close(); });
  }
  function paint(force){
    if (!ov || !ov.classList.contains('show')) return;
    const c = cur(), y = c.y, m = c.m, d = c.d, ae = document.activeElement;
    $('tmDate').textContent = `${pad(d)} ${MON[m]} ${yl(y)}`;
    $('tmSub').textContent = `${WD[c.wd]} · ${pad(c.h)}:${pad(c.mi)} local · JD ${currentJD.toFixed(2)}${isG(y, m, d) ? '' : ' · Julian calendar'}`;
    if (force || ae !== $('tmD')) $('tmD').value = (y >= 1 && y <= 9999) ? dv(c) : '';     // years outside 1-9999 (BC) are typed in the box below
    if (force || ae !== $('tmT')) $('tmT').value = `${pad(c.h)}:${pad(c.mi)}`;
    $('tmBirth').hidden = !(typeof isValidProfile === 'function' && isValidProfile(activeNatalProfile));
  }
  function open(){ if (!ov) build(); ov.classList.add('show'); document.body.classList.add('tm-open'); paint(true); }
  window.openTimeMachine = open;
  // keep the dial in step with play / timeline drags while it is open
  setInterval(paint, 600);
  // open from the 📅 button (replaces the heavy native picker) and from the date in the HUD
  document.addEventListener('click', e => {
    if (e.target.closest('#tlJumpToggle')){ e.preventDefault(); e.stopImmediatePropagation(); open(); }
    else if (e.target.closest('.hud-datetime')) open();
  }, true);
  // ---- saved moments: a small popup on top of the picker; each entry keeps the exact date AND time ----
  const SV_KEY = 'vedic3d_saved_moments_v1'; let sv = [], svEl;
  try { sv = JSON.parse(localStorage.getItem(SV_KEY) || '[]'); if (!Array.isArray(sv)) sv = []; } catch (e) { sv = []; }
  const svStore = () => { try { localStorage.setItem(SV_KEY, JSON.stringify(sv)); } catch (e) {} const n = $('tmSvN'); if (n) n.textContent = sv.length; };
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const fmt = jd => { const p = fromJD(jd); return `${pad(p.d)} ${MON[p.m]} ${yl(p.y)} · ${pad(p.h)}:${pad(p.mi)}`; };
  function svList(){
    const box = svEl.querySelector('.sv-list');
    box.innerHTML = sv.length ? sv.map((m, i) => `<div class="sv-it" data-i="${i}"><button type="button" class="sv-go"><b>${esc(m.name)}</b><span>${fmt(m.jd)}</span></button><button type="button" class="sv-ed" aria-label="Rename">✎</button><button type="button" class="sv-rm" aria-label="Delete">✕</button></div>`).join('')
      : '<div class="sv-empty">Nothing saved yet. Set a date and time, then tap “Save moment”.</div>';
  }
  function svOpen(focusName){
    if (!svEl){
      svEl = document.createElement('div'); svEl.className = 'sv-ov';
      svEl.innerHTML = `<div class="sv-card" role="dialog" aria-label="Saved moments"><div class="sv-top"><b>Saved moments</b><button type="button" class="tm-x sv-x" aria-label="Close">✕</button></div>
        <form class="sv-add"><input class="sv-name" type="text" maxlength="40" autocomplete="off" aria-label="Name"><button class="tm-go" type="submit">Save</button></form>
        <div class="sv-cur"></div><div class="sv-list"></div></div>`;
      document.body.appendChild(svEl);
      const closeSv = () => svEl.classList.remove('show');
      svEl.addEventListener('pointerdown', e => { if (e.target === svEl) closeSv(); });
      svEl.querySelector('.sv-x').addEventListener('click', closeSv);
      svEl.querySelector('.sv-add').addEventListener('submit', e => {
        e.preventDefault(); const inp = svEl.querySelector('.sv-name');
        sv.unshift({ id: Date.now(), name: inp.value.trim() || fmt(currentJD), jd: currentJD }); svStore(); svList(); inp.value = ''; svCur();
      });
      svEl.querySelector('.sv-list').addEventListener('click', e => {
        const row = e.target.closest('.sv-it'); if (!row) return; const m = sv[+row.dataset.i]; if (!m) return;
        if (e.target.closest('.sv-rm')){ sv.splice(+row.dataset.i, 1); svStore(); svList(); }
        else if (e.target.closest('.sv-ed')){ const nn = prompt('Rename', m.name); if (nn && nn.trim()){ m.name = nn.trim().slice(0, 40); svStore(); svList(); } }
        else { fastJump(m.jd); refreshAll(); paint(); closeSv(); }
      });
    }
    svCur(); svList(); svEl.classList.add('show');
    if (focusName) setTimeout(() => svEl.querySelector('.sv-name').focus(), 60);
  }
  function svCur(){ svEl.querySelector('.sv-cur').textContent = 'Now showing: ' + fmt(currentJD); svEl.querySelector('.sv-name').placeholder = fmt(currentJD); }
  document.addEventListener('click', e => {
    if (e.target.closest('#tmSave')) svOpen(true); else if (e.target.closest('#tmSaved')) svOpen(false);
  });
  setTimeout(svStore, 0);
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
    const at = e => { const r = track.getBoundingClientRect(), f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); pendTr = timelineWindowStart + f * (timelineWindowEnd - timelineWindowStart); if (!rafT) rafT = requestAnimationFrame(() => { rafT = 0; fastJump(pendTr); }); };
    let rafT = 0, pendTr = 0;
    track.addEventListener('pointerdown', e => { drag = true; track.setPointerCapture(e.pointerId); at(e); });
    track.addEventListener('pointermove', e => { if (drag) at(e); });
    ['pointerup','pointercancel'].forEach(ev => track.addEventListener(ev, () => { drag = false; }));
    // zoom persists while playing: the main loop snaps the window back to 1Y when it runs out
    setInterval(() => { const z = ZOOM[zoom], span = timelineWindowEnd - timelineWindowStart; if (span !== z[1] - z[0] && !drag && zoom !== '1Y') applyZoom(zoom); sync(); }, 500);
    sync();
  }
})();

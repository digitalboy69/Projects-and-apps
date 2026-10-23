/* ============================================================================
   BIRTH TIME RECTIFICATION — full-screen tab panel (rewired on every render,
   since results.innerHTML — and therefore this panel's DOM — is rebuilt
   each time a profile loads or the chart is recalculated).
   ============================================================================ */
let rectSelectedIdx = null;
let rectRows = [];

function fmtDegShort(deg){
  const d = Math.floor(deg);
  const mFull = (deg-d)*60;
  let m = Math.floor(mFull);
  let s = Math.round((mFull-m)*60);
  if (s === 60){ s = 0; m += 1; }
  let dd = d;
  if (m === 60){ m = 0; dd += 1; }
  return `${String(dd).padStart(2,'0')}°${String(m).padStart(2,'0')}'${String(s).padStart(2,'0')}"`;
}

let rectScanToken = 0;
const RECT_ROW_H = 40, RECT_BUF = 8;
async function runRectificationScan(){
  if (!currentProfileForExport){ return; }
  const lat = currentProfileForExport.lat, lon = currentProfileForExport.lon, tz = currentProfileForExport.tz;
  const dateStr = document.getElementById('rectDate').value;
  const centerTime = document.getElementById('rectCenterTime').value;
  const windowMin = parseInt(document.getElementById('rectWindow').value, 10);
  const step = parseInt(document.getElementById('rectStep').value, 10);
  const wrap = document.getElementById('rectResultsWrap');

  if (!dateStr || !centerTime){
    wrap.innerHTML = `<div class="rect-empty">Please enter a date and a center time to scan around.</div>`;
    return;
  }
  const totalRange = windowMin*60;
  const steps = Math.floor((totalRange*2)/step) + 1;
  if (steps > 6000){
    wrap.innerHTML = `<div class="rect-empty">That window/step combination is ${steps.toLocaleString()} candidate seconds — too many to scan smoothly. Widen the step or narrow the window.</div>`;
    return;
  }
  // compute in small chunks so the screen never freezes; a newer run cancels an older one
  const token = ++rectScanToken, btn = document.getElementById('rectScanBtn');
  if (btn) btn.disabled = true;
  wrap.innerHTML = `<div class="rect-prog"><div class="rect-prog-t"><b id="rectProgTxt">Scanning ${steps.toLocaleString()} moments…</b><span id="rectProgPct">0%</span></div><div class="rect-prog-bar"><i id="rectProgBar"></i></div></div>`;
  const rows = []; let done = 0;
  for (let off = -totalRange; off <= totalRange; off += step){
    const shifted = shiftLocalDateTime(dateStr, centerTime, off);
    const pt = rectifyPoint(shifted.dateStr, shifted.timeStr, lat, lon, tz);
    pt.offsetSec = off;
    rows.push(pt);
    if (++done % 150 === 0){
      const f = Math.min(1, done/steps), b = document.getElementById('rectProgBar'), t = document.getElementById('rectProgPct');
      if (b) b.style.width = Math.round(f*100) + '%'; if (t) t.textContent = Math.round(f*100) + '%';
      await new Promise(r => setTimeout(r, 0));
      if (token !== rectScanToken) return;
    }
  }
  if (btn) btn.disabled = false;
  rectRows = rows;
  rectSelectedIdx = null;
  document.getElementById('rectDetail').classList.remove('show');
  renderRectificationTable(true);
}

function rectRowHtml(i){
  const r = rectRows[i], prev = i>0 ? rectRows[i-1] : null;
  const d60Boundary = prev && (prev.asc.sign !== r.asc.sign || prev.asc.d60Amsa !== r.asc.d60Amsa);
  const nakBoundary = prev && (prev.asc.nak.index !== r.asc.nak.index || prev.asc.nak.pada !== r.asc.nak.pada);
  const isCenter = r.offsetSec === 0;
  const cls = [ d60Boundary ? 'rect-d60-boundary' : '', nakBoundary ? 'rect-nak-boundary' : '', i===rectSelectedIdx ? 'rect-selected' : '' ].filter(Boolean).join(' ');
  const ascSign = SIGNS[r.asc.sign], moonD60Sign = SIGNS[r.moon.d60Sign];
  return `<tr class="${cls}" data-idx="${i}">
      <td>${r.timeStr}${isCenter ? ' <span class="rect-rec">● recorded</span>' : ''}</td>
      <td>${ascSign.symbol} ${ascSign.name} ${fmtDegShort(r.asc.degInSign)}</td>
      <td>${escapeHtml(r.asc.nak.name)}-${r.asc.nak.pada}</td>
      <td>#${r.asc.d60Amsa} → ${SIGNS[r.asc.d60Sign].name}</td>
      <td>#${r.moon.d60Amsa} → ${moonD60Sign.name}</td>
    </tr>`;
}
/* Virtual table: only the rows near the viewport exist in the DOM (about 40), however many seconds were scanned. */
function renderRectificationTable(resetScroll){
  const wrap = document.getElementById('rectResultsWrap');
  if (!wrap) return;
  if (rectRows.length === 0){ wrap.innerHTML = ""; return; }
  const n = rectRows.length;
  wrap.innerHTML = `
    <div class="rect-summary">
      <span>${n.toLocaleString()} candidate seconds scanned · tap any row to inspect &amp; apply</span>
      <span class="rect-legend">
        <span><i style="background:var(--gold-dim);"></i> new D60 (Shashtiamsha) division begins</span>
        <span><i style="background:var(--teal-bright);"></i> new Nakshatra pada begins</span>
      </span>
    </div>
    <div class="rect-vwrap vx-noicon" id="rectVWrap">
      <table class="rect-table">
        <thead><tr><th>Local Time</th><th>Ascendant</th><th>Asc Nakshatra-Pada</th><th>Asc D60 Amsa</th><th>Moon D60 Amsa</th></tr></thead>
        <tbody id="rectTbody"></tbody>
      </table>
    </div>
    <button type="button" class="rect-jump" id="rectJump">⌖ Jump to the recorded time</button>`;
  const vw = document.getElementById('rectVWrap'), tb = document.getElementById('rectTbody');
  const V = { a:-1, b:-1, raf:0 };
  const paint = force => {
    const head = vw.querySelector('thead'), hh = head ? head.offsetHeight : 40;
    const top = Math.max(0, vw.scrollTop - hh), h = vw.clientHeight || 460;
    const a = Math.max(0, Math.floor(top/RECT_ROW_H) - RECT_BUF), b = Math.min(n, Math.ceil((top + h)/RECT_ROW_H) + RECT_BUF);
    if (!force && a === V.a && b === V.b) return;
    V.a = a; V.b = b;
    let html = a > 0 ? `<tr class="rect-sp" style="height:${a*RECT_ROW_H}px"><td colspan="5"></td></tr>` : '';
    for (let i=a; i<b; i++) html += rectRowHtml(i);
    if (b < n) html += `<tr class="rect-sp" style="height:${(n-b)*RECT_ROW_H}px"><td colspan="5"></td></tr>`;
    tb.innerHTML = html;
  };
  vw.addEventListener('scroll', () => { if (!V.raf) V.raf = requestAnimationFrame(() => { V.raf = 0; paint(false); }); }, { passive:true });
  tb.addEventListener('click', e => {
    const tr = e.target.closest('tr[data-idx]'); if (!tr) return;
    rectSelectedIdx = parseInt(tr.dataset.idx, 10);
    const old = tb.querySelector('.rect-selected'); if (old) old.classList.remove('rect-selected');
    tr.classList.add('rect-selected');
    renderRectificationDetail();
    const d = document.getElementById('rectDetail'); if (d) d.scrollIntoView({ behavior:'smooth', block:'nearest' });
  });
  const center = () => { const ci = rectRows.findIndex(r => r.offsetSec === 0); if (ci >= 0) vw.scrollTop = Math.max(0, ci*RECT_ROW_H - (vw.clientHeight||460)/2 + RECT_ROW_H*2); paint(true); };
  document.getElementById('rectJump').addEventListener('click', center);
  paint(true);
  if (resetScroll) center();
}

function renderRectificationDetail(){
  const detail = document.getElementById('rectDetail');
  if (!detail) return;
  if (rectSelectedIdx === null || !rectRows[rectSelectedIdx]){ detail.classList.remove('show'); return; }
  const r = rectRows[rectSelectedIdx];
  const ascSign = SIGNS[r.asc.sign];
  const moonSign = SIGNS[r.moon.sign];
  detail.innerHTML = `
    <h4>Candidate: ${r.dateStr} · ${r.timeStr} local</h4>
    <div class="rect-detail-grid">
      <div><span class="rd-label">Ascendant</span><span class="rd-value">${ascSign.symbol} ${ascSign.name} ${fmtDegShort(r.asc.degInSign)}</span></div>
      <div><span class="rd-label">Asc Nakshatra / Pada</span><span class="rd-value">${escapeHtml(r.asc.nak.name)} · Pada ${r.asc.nak.pada}</span></div>
      <div><span class="rd-label">Asc D60 (Shashtiamsha)</span><span class="rd-value">Amsa #${r.asc.d60Amsa} of 60 → ${SIGNS[r.asc.d60Sign].name}</span></div>
      <div><span class="rd-label">Moon Sign / Degree</span><span class="rd-value">${moonSign.symbol} ${moonSign.name} ${fmtDegShort(r.moon.degInSign)}</span></div>
      <div><span class="rd-label">Moon D60 (Shashtiamsha)</span><span class="rd-value">Amsa #${r.moon.d60Amsa} of 60 → ${SIGNS[r.moon.d60Sign].name}</span></div>
      <div><span class="rd-label">Julian Day (UT)</span><span class="rd-value">${r.jd.toFixed(6)}</span></div>
    </div>
    <div class="rect-detail-actions">
      <button type="button" class="btn btn-primary btn-sm" id="rectApplyBtn">✓ Apply This Second & Recalculate Full Chart</button>
      <button type="button" class="btn btn-ghost btn-sm" id="rectCopyBtn">📋 Copy Time</button>
    </div>`;
  detail.classList.add('show');

  document.getElementById('rectApplyBtn').addEventListener('click', () => {
    const updatedProfile = { ...currentProfileForExport, dob: r.dateStr, tob: r.timeStr };
    const profiles = loadProfiles();
    const idx = profiles.findIndex(p => p.savedAt === currentProfileForExport.savedAt);
    if (idx >= 0){ profiles[idx] = updatedProfile; saveProfiles(profiles); refreshProfileSelect(); }
    renderResults(updatedProfile);
    switchAppTab('panel-overview');
  });
  document.getElementById('rectCopyBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(r.timeStr);
    const btn = document.getElementById('rectCopyBtn');
    btn.textContent = '✓ Copied';
    setTimeout(()=>{ btn.innerHTML = '📋 Copy Time'; }, 1500);
  });
}

let rectHms = { h:0, m:0, s:0 };

function padHms(n){ return String(n).padStart(2,'0'); }

function syncHmsHiddenInput(){
  const hidden = document.getElementById('rectCenterTime');
  if (hidden) hidden.value = `${padHms(rectHms.h)}:${padHms(rectHms.m)}:${padHms(rectHms.s)}`;
}

function updateHmsDisplay(){
  const hEl = document.getElementById('rectHmsH');
  const mEl = document.getElementById('rectHmsM');
  const sEl = document.getElementById('rectHmsS');
  if (hEl) hEl.textContent = padHms(rectHms.h);
  if (mEl) mEl.textContent = padHms(rectHms.m);
  if (sEl) sEl.textContent = padHms(rectHms.s);
  syncHmsHiddenInput();
}

function changeHmsUnit(unit, dir){
  if (unit === 'h') rectHms.h = (rectHms.h + dir + 24) % 24;
  else if (unit === 'm') rectHms.m = (rectHms.m + dir + 60) % 60;
  else if (unit === 's') rectHms.s = (rectHms.s + dir + 60) % 60;
  updateHmsDisplay();
}

function wireHmsSteppers(){
  document.querySelectorAll('#rectHmsRow .hms-btn').forEach(btn => {
    const unit = btn.dataset.unit;
    const dir = parseInt(btn.dataset.dir, 10);
    let holdTimer = null, holdInterval = null, repeatStarted = false, activePointerId = null;

    const clearTimers = () => {
      clearTimeout(holdTimer); clearInterval(holdInterval);
      holdTimer = null; holdInterval = null;
    };
    const startHold = () => {
      repeatStarted = false;
      holdTimer = setTimeout(() => {
        repeatStarted = true;
        holdInterval = setInterval(() => changeHmsUnit(unit, dir), 90);
      }, 450);
    };
    const endHold = (fireIfTap) => {
      if (fireIfTap && !repeatStarted) changeHmsUnit(unit, dir);
      clearTimers();
      activePointerId = null;
    };

    // Pointer Events unify mouse + touch + pen into a single reliable path,
    // so a single tap always registers on the very first touch — no ghost
    // clicks, no missed taps, no needing to tap twice.
    if (window.PointerEvent){
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        activePointerId = e.pointerId;
        if (btn.setPointerCapture){ try { btn.setPointerCapture(e.pointerId); } catch(err){} }
        startHold();
      });
      btn.addEventListener('pointerup', (e) => {
        if (activePointerId !== null && e.pointerId !== activePointerId) return;
        endHold(true);
      });
      btn.addEventListener('pointercancel', () => endHold(false));
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    } else {
      // Fallback for older browsers without Pointer Events support
      let touchFired = false;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchFired = true;
        startHold();
      }, {passive:false});
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        endHold(true);
        setTimeout(() => { touchFired = false; }, 400);
      }, {passive:false});
      btn.addEventListener('touchcancel', () => endHold(false));
      btn.addEventListener('mousedown', () => { if (!touchFired) startHold(); });
      btn.addEventListener('mouseup', () => { if (!touchFired) endHold(true); });
      btn.addEventListener('mouseleave', () => { if (!touchFired) endHold(false); });
      btn.addEventListener('click', (e) => { if (touchFired) e.preventDefault(); });
    }
  });
}

function runFullChartCalculation(){
  const resultsEl = document.getElementById('rectFullChartResults');
  if (!currentProfileForExport){
    resultsEl.innerHTML = `<div class="rect-empty">Generate a chart first — Full Chart calculation needs a Place of Birth (lat/lon/timezone) to work from.</div>`;
    return;
  }
  const dateStr = document.getElementById('rectDate').value;
  const timeStr = document.getElementById('rectCenterTime').value;
  if (!dateStr || !timeStr){
    resultsEl.innerHTML = `<div class="rect-empty">Please pick a date and dial in a time first.</div>`;
    return;
  }
  // Recompute EVERYTHING through the exact same pipeline the main intake form
  // uses (renderResults → computeChart), so every tab — Overview, Dasha, Yogas,
  // Ashtakavarga, Shadbala, Planets, Divisions, Lagnas — reflects this dialed
  // time identically to a normal chart generation. Nothing is saved to the
  // stored profile unless you use "Apply" — this is a live, temporary preview.
  const tempProfile = { ...currentProfileForExport, dob: dateStr, tob: timeStr };
  const btn = document.getElementById('rectFullCalcBtn');
  if (btn){ btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.innerHTML = '<span class="rs-spin"></span> Calculating…'; }
  resultsEl.innerHTML = `<div class="rs-calc"><span class="rs-spin"></span><div><b>Recalculating every tab for this exact time</b><small>This takes a moment. You can keep reading while it works.</small></div></div>`;
  // let the screen show the working state first, then do the heavy render
  requestAnimationFrame(() => setTimeout(() => {
    try { renderResults(tempProfile); switchAppTab('panel-overview'); }
    finally { const b2 = document.getElementById('rectFullCalcBtn'); if (b2){ b2.disabled = false; if (b2.dataset.label) b2.innerHTML = b2.dataset.label; } }
  }, 30));
}

function wireRectificationPanel(){
  rectSelectedIdx = null; rectRows = [];
  const scanBtn = document.getElementById('rectScanBtn');
  if (scanBtn) scanBtn.addEventListener('click', runRectificationScan);

  const tobVal = (currentProfileForExport && currentProfileForExport.tob) || "00:00:00";
  const parts = tobVal.split(':').map(Number);
  rectHms = { h: parts[0]||0, m: parts[1]||0, s: parts[2]||0 };
  updateHmsDisplay();
  wireHmsSteppers();

  const fullCalcBtn = document.getElementById('rectFullCalcBtn');
  if (fullCalcBtn) fullCalcBtn.addEventListener('click', runFullChartCalculation);

  const dateInput = document.getElementById('rectDate');
  if (dateInput) dateInput.addEventListener('change', syncHmsHiddenInput);
}


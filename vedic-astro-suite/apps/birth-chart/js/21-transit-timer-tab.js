/* ============================================================================
   TRANSIT TIMER TAB
   ============================================================================ */
let ttCountdownInterval = null;
const VARGA_ORDER = Object.keys(VARGAS).filter(k => !VARGAS[k].noTimer).sort((a,b) => VARGAS[a].n - VARGAS[b].n);

function wireTransitTimerPanel(){
  if (ttCountdownInterval){ clearInterval(ttCountdownInterval); ttCountdownInterval = null; }
  const vargaSel = document.getElementById('ttVarga');
  if (vargaSel){
    vargaSel.innerHTML = VARGA_ORDER.map(k => `<option value="${k}" ${k==="D9"?"selected":""}>${k} — ${VARGAS[k].name} (${VARGAS[k].full})</option>`).join('');
  }
  const checkBtn = document.getElementById('ttCheckBtn');
  if (checkBtn) checkBtn.addEventListener('click', runTransitTimerCheck);
}

function runTransitTimerCheck(){
  if (ttCountdownInterval){ clearInterval(ttCountdownInterval); ttCountdownInterval = null; }
  const resultsEl = document.getElementById('ttResults');
  if (!currentProfileForExport){
    resultsEl.innerHTML = `<div class="rect-empty">Generate a chart first — the Ascendant needs a Place of Birth (lat/lon) to compute, and planet transits need a location for context.</div>`;
    return;
  }
  const bodyName = document.getElementById('ttBody').value;
  const vargaKey = document.getElementById('ttVarga').value;
  const lat = currentProfileForExport.lat, lon = currentProfileForExport.lon, tz = currentProfileForExport.tz;

  const t = computeDivisionTiming(bodyName, vargaKey, lat, lon);
  renderTransitTimerResult(t, tz);

  ttCountdownInterval = setInterval(() => {
    const el = document.getElementById('ttResults');
    if (!el || !document.getElementById('ttCountdownValue')){ clearInterval(ttCountdownInterval); ttCountdownInterval = null; return; }
    const nowJD = nowJulianDay();
    const remaining = t.jdNext - nowJD;
    const sinceNow = nowJD - t.jdEntered;
    const cdEl = document.getElementById('ttCountdownValue');
    const cdCard = document.getElementById('ttCountdownCard');
    if (remaining <= 0){
      cdEl.textContent = "Crossing now →";
      if (cdCard) cdCard.classList.add('tt-countdown-past');
    } else {
      cdEl.textContent = formatDurationHMS(remaining);
    }
    const sinceEl = document.getElementById('ttSinceValue');
    if (sinceEl) sinceEl.textContent = formatDurationHMS(sinceNow) + " ago";
  }, 1000);
}

function renderTransitTimerResult(t, tz){
  const resultsEl = document.getElementById('ttResults');
  const sign = SIGNS[t.signIdx];
  const vargaSign = SIGNS[t.vargaSignIdx];
  const nak = getNakshatra(t.currentLon);
  const enteredParts = jdToLocalParts(t.jdEntered, tz);
  const nextParts = jdToLocalParts(t.jdNext, tz);
  const bodyLabel = t.bodyName === "Ascendant" ? "🌅 Ascendant (Lagna)" : `${PLANET_GLYPHS[t.bodyName]} ${t.bodyName}`;

  resultsEl.innerHTML = `
    <div class="tt-result-wrap">
      <div class="tt-result-badge">
        <span>${bodyLabel} in ${t.vargaKey} — ${VARGAS[t.vargaKey].name}</span>
        ${t.retrograde ? '<span class="retro-tag">Retrograde</span>' : ''}
        <span>· ${Math.abs(t.speed).toFixed(t.bodyName==="Ascendant"?1:4)}°/day</span>
      </div>
      <div class="tt-result-body">
        <div class="tt-grid" style="margin-bottom:14px;">
          <div class="tt-stat-card">
            <div class="tt-label">D1 Position</div>
            <div class="tt-value">${sign.symbol} ${sign.name} ${fmtDegShort(t.degInSign)}</div>
            <div class="tt-sub">${escapeHtml(nak.name)} · Pada ${nak.pada}</div>
          </div>
          <div class="tt-stat-card">
            <div class="tt-label">${t.vargaKey} Division</div>
            <div class="tt-value">${vargaSign.symbol} ${vargaSign.name}</div>
            <div class="tt-sub">Amsa ${t.divWithinSign} of ${t.n} · width ${t.width.toFixed(4)}°</div>
          </div>
        </div>
        <div class="tt-grid">
          <div class="tt-stat-card">
            <div class="tt-label">Entered This Division</div>
            <div class="tt-value">${enteredParts.timeStr}</div>
            <div class="tt-sub">${enteredParts.dateStr} · <span id="ttSinceValue">${formatDurationHMS(t.sinceDays)} ago</span></div>
          </div>
          <div class="tt-stat-card">
            <div class="tt-label">Moves to Next Division</div>
            <div class="tt-value">${nextParts.timeStr}</div>
            <div class="tt-sub">${nextParts.dateStr}${t.retrograde ? ' (moving backward)' : ''}</div>
          </div>
          <div class="tt-stat-card tt-countdown-card" id="ttCountdownCard">
            <div class="tt-label">Time Remaining</div>
            <div class="tt-value" id="ttCountdownValue">${formatDurationHMS(t.remainingDays)}</div>
            <div class="tt-sub">live countdown</div>
          </div>
        </div>
      </div>
    </div>`;
}


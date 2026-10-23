/* ============================================================================
   SANDHI TABLE TAB
   ============================================================================ */
let sandhiCountdownInterval = null;
let sandhiRows = [];

function wireSandhiPanel(){
  if (sandhiCountdownInterval){ clearInterval(sandhiCountdownInterval); sandhiCountdownInterval = null; }
  sandhiRows = [];
  const btn = document.getElementById('sandhiCalcBtn');
  if (btn) btn.addEventListener('click', runSandhiCalculation);
}

function runSandhiCalculation(){
  if (sandhiCountdownInterval){ clearInterval(sandhiCountdownInterval); sandhiCountdownInterval = null; }
  const resultsEl = document.getElementById('sandhiResults');
  if (!currentProfileForExport){
    resultsEl.innerHTML = `<div class="rect-empty">Generate a chart first — the Ascendant needs a Place of Birth (lat/lon) to compute.</div>`;
    return;
  }
  const lat = currentProfileForExport.lat, lon = currentProfileForExport.lon, tz = currentProfileForExport.tz;
  sandhiRows = VARGA_ORDER.map(key => computeDivisionTiming("Ascendant", key, lat, lon));
  renderSandhiTable(tz);

  sandhiCountdownInterval = setInterval(() => {
    if (!document.getElementById('sandhiTableBody')){ clearInterval(sandhiCountdownInterval); sandhiCountdownInterval = null; return; }
    if (document.hidden || !document.getElementById('sandhiTableBody').offsetParent) return;   // hidden tab: skip
    const nowJD = nowJulianDay();
    sandhiRows.forEach(t => {
      const cell = document.getElementById(`sandhi-rem-${t.vargaKey}`);
      if (cell){
        const remaining = t.jdNext - nowJD;
        cell.textContent = remaining <= 0 ? "now →" : formatDurationHMS(remaining);
      }
    });
  }, 1000);
}

function renderSandhiTable(tz){
  const resultsEl = document.getElementById('sandhiResults');
  const d1 = sandhiRows.find(r => r.vargaKey === "D1");
  const d1Sign = SIGNS[d1.signIdx];

  let rows = "";
  sandhiRows.forEach(t => {
    const before = jdToLocalParts(t.jdBefore, tz);
    const current = jdToLocalParts(t.jdEntered, tz);
    const next = jdToLocalParts(t.jdNext, tz);
    rows += `<tr class="${t.vargaKey==='D1' ? 'sandhi-d1-row' : ''}">
      <td>${t.vargaKey} — ${VARGAS[t.vargaKey].name}</td>
      <td>${formatDurationHMS(t.remainingDays + t.sinceDays)}</td>
      <td>${before.timeStr}</td>
      <td>${current.timeStr}</td>
      <td>${next.timeStr}</td>
      <td class="sandhi-remaining" id="sandhi-rem-${t.vargaKey}">${formatDurationHMS(t.remainingDays)}</td>
    </tr>`;
  });

  resultsEl.innerHTML = `
    <div class="sandhi-meta">Ascendant currently in <strong>${d1Sign.symbol} ${d1Sign.name}</strong> · D1 window ≈ <strong>${formatDurationHMS(d1.remainingDays + d1.sinceDays)}</strong> wide for this location and date</div>
    <div class="sandhi-table-wrap">
      <table class="sandhi-table">
        <thead><tr><th>Varga</th><th>Window Width</th><th>Before Started</th><th>Current Started</th><th>Next Starts</th><th>Remaining</th></tr></thead>
        <tbody id="sandhiTableBody">${rows}</tbody>
      </table>
    </div>`;
}


/* ============================================================================
   VARGA TIMELINE TAB — anchored to the BIRTH TIME, not live "now"
   ============================================================================ */
function wireVargaTimelinePanel(){
  const sel = document.getElementById('vtVarga');
  if (sel){
    sel.innerHTML = VARGA_ORDER.map(k => `<option value="${k}" ${k==="D9"?"selected":""}>${k} — ${VARGAS[k].name} (${VARGAS[k].full})</option>`).join('');
  }
  const infoEl = document.getElementById('vtBirthInfo');
  if (infoEl){
    if (!currentProfileForExport){
      infoEl.innerHTML = `<div class="rect-empty">Generate a chart first — this needs the birth date, time, and place.</div>`;
    } else {
      const tz = currentProfileForExport.tz;
      const w = computeAscendantD1Window(currentProfileForExport.lat, currentProfileForExport.lon, getBirthJD(currentProfileForExport));
      const sign = SIGNS[w.d1SignIdx];
      const startParts = jdToLocalParts(w.jdD1Start, tz);
      const endParts = jdToLocalParts(w.jdD1End, tz);
      infoEl.innerHTML = `
        <div class="vt-birth-card">
          <div class="tt-stat-card"><div class="tt-label">Birth Ascendant</div><div class="tt-value">${sign.symbol} ${sign.name}</div></div>
          <div class="tt-stat-card"><div class="tt-label">D1 Window Started</div><div class="tt-value">${startParts.timeStr}</div><div class="tt-sub">${startParts.dateStr}</div></div>
          <div class="tt-stat-card"><div class="tt-label">D1 Window Ended</div><div class="tt-value">${endParts.timeStr}</div><div class="tt-sub">${endParts.dateStr}</div></div>
          <div class="tt-stat-card"><div class="tt-label">Total Width</div><div class="tt-value">${formatDurationHMS(w.jdD1End - w.jdD1Start)}</div></div>
        </div>`;
    }
  }
  const btn = document.getElementById('vtMapBtn');
  if (btn) btn.addEventListener('click', runVargaTimeline);
}

function getBirthJD(profile){
  const {y:year,m:month,d:day} = parseDob(profile.dob);
  const timeStr = (profile.tob && profile.tob.length===5) ? profile.tob+":00" : profile.tob;
  const [hour,minute,second] = timeStr.split(":").map(Number);
  const localJD = toJulianDay(year,month,day,hour,minute,second||0);
  return localJD - profile.tz/24;
}

function runVargaTimeline(){
  const resultsEl = document.getElementById('vtResults');
  if (!currentProfileForExport){
    resultsEl.innerHTML = `<div class="rect-empty">Generate a chart first — this needs the birth date, time, and place.</div>`;
    return;
  }
  const vargaKey = document.getElementById('vtVarga').value;
  const tz = currentProfileForExport.tz;
  const birthJD = getBirthJD(currentProfileForExport);
  const tl = computeVargaTimelineForD1Window(vargaKey, currentProfileForExport.lat, currentProfileForExport.lon, birthJD);

  let rows = "";
  tl.rows.forEach(r => {
    const s = jdToLocalParts(r.startJD, tz);
    const e = jdToLocalParts(r.endJD, tz);
    const sign = SIGNS[r.vargaSignIdx];
    rows += `<tr class="${r.containsBirth ? 'vt-birth-row' : ''}">
      <td>${r.index} of ${tl.n}</td>
      <td>${s.timeStr}</td>
      <td>${e.timeStr}</td>
      <td>${sign.symbol} ${sign.name}</td>
      <td class="vt-birth-flag">${r.containsBirth ? '← birth moment' : ''}</td>
    </tr>`;
  });

  resultsEl.innerHTML = `
    <div class="sandhi-meta">
      ${vargaKey} — ${VARGAS[vargaKey].name}: ${tl.n} division${tl.n>1?'s':''} across the D1 window
      (${jdToLocalParts(tl.jdD1Start,tz).timeStr} to ${jdToLocalParts(tl.jdD1End,tz).timeStr}),
      each ≈ <strong>${formatDurationHMS((tl.jdD1End-tl.jdD1Start)/tl.n)}</strong> wide
    </div>
    <div class="sandhi-table-wrap">
      <table class="sandhi-table">
        <thead><tr><th>Division</th><th>Start</th><th>End</th><th>Sign</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}


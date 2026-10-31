/* ============================================================================
   PLANET DETAIL POPUP
   Click any planet (sky table, natal list, chart wheel, house table, aspect
   list, or directly in the 3D viewport) to see everything about it at that
   moment: sign, exact degree/min/sec, nakshatra + pada, house (if a natal
   Lagna is available), retrograde state, speed, and its current aspects.
   ============================================================================ */
function buildDegreeGaugeSVG(degInSign, colorHex){
  // A small radial gauge (0-30deg arc) showing how far through the sign the planet has travelled.
  const size = 58, r = 24, cx = size/2, cy = size/2;
  const pct = Math.max(0, Math.min(1, degInSign/30));
  const circumference = 2*Math.PI*r;
  const dash = circumference*pct;
  return `<svg class="pd-gauge" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1B2636" stroke-width="5"></circle>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colorHex}" stroke-width="5"
      stroke-dasharray="${dash.toFixed(1)} ${circumference.toFixed(1)}" stroke-linecap="round"
      transform="rotate(-90 ${cx} ${cy})"></circle>
    <text x="${cx}" y="${cy+4}" text-anchor="middle" font-family="var(--font-mono)" font-size="11" fill="#E8EDF4">${Math.round(pct*100)}%</text>
  </svg>`;
}

function openPlanetDetailLegacy(name, jd){
  if (jd==null) jd = currentJD;
  const snap = snapshotPositions(jd);
  const lon = snap.sidereal[name];
  const signIdx = getSignIndex(lon);
  const sign = SIGNS[signIdx];
  const dms = degreeInSign(lon);
  const nakIdx = getNakshatraIndex(lon);
  const nak = NAKSHATRAS[nakIdx];
  const pada = getPadaIndex(lon)+1;
  const isRetro = snap.retro[name] && name!=="Rahu" && name!=="Ketu";
  const isNodeAlways = (name==="Rahu"||name==="Ketu");
  const speed = planetSpeed(name, jd);
  const speedCat = speedCategory(name, jd);
  const occ = getSignOccupancy(name, jd);

  // House: only meaningful when we have a Lagna reference (active natal profile).
  let houseLine = "";
  if (activeNatalProfile){
    const { lagnaLon } = computeNatalAscendant(activeNatalProfile);
    const lagnaSignIdx = getSignIndex(lagnaLon);
    const house = getHouseOfLongitude(lon, lagnaSignIdx);
    houseLine = `<div class="pd-stat"><div class="pd-stat-label">House (from ${activeNatalProfile.name}'s Lagna)</div><div class="pd-stat-value accent">${house}${house===1?' · Lagna':''}</div></div>`;
  }

  // Aspects involving this planet, computed at the same jd
  const allAspects = computeAspects(snap.sidereal).filter(a=> a.from===name || a.to===name);
  const houseLabel = {3:'3rd',4:'4th',5:'5th',7:'7th',8:'8th',9:'9th',10:'10th'};
  const aspectChips = allAspects.map(a=>{
    const isFrom = a.from===name;
    const other = isFrom ? a.to : a.from;
    const verb = isFrom ? 'aspects' : 'aspected by';
    return `<div class="pd-aspect-chip" onclick="openPlanetDetail('${other}', ${jd})">
      <span style="color:${PLANET_COLORS[other]}">${PLANET_GLYPHS[other]}</span>
      <span>${verb} <b style="color:var(--text)">${other}</b> (${houseLabel[a.houseOffset]||a.houseOffset+'th'})</span>
    </div>`;
  }).join('');

  const enterStr = occ.enterJD!=null ? `${formatFullDate(occ.enterJD)}` : "Beyond calculable range";
  const exitStr = occ.exitJD!=null ? `${formatFullDate(occ.exitJD)}` : "Beyond calculable range";
  const daysInStr = occ.daysIn!=null ? formatDurationDays(occ.daysIn) : "—";
  const daysLeftStr = occ.daysLeft!=null ? formatDurationDays(occ.daysLeft) : "—";

  const html = `
    <div class="pd-hero">
      <div class="pd-hero-glyph" style="color:${PLANET_COLORS[name]}">${PLANET_GLYPHS[name]}</div>
      <div class="pd-hero-name">${name}</div>
      <div class="pd-hero-sub">${formatFullDate(jd)}</div>
      <div class="pd-hero-badges">
        <span class="pd-badge">${sign.symbol} ${sign.name}</span>
        <span class="pd-badge">${nak} · Pada ${pada}</span>
        ${isNodeAlways ? `<span class="pd-badge retro">Always Retrograde</span>` : isRetro ? `<span class="pd-badge retro">Retrograde</span>` : `<span class="pd-badge direct">Direct</span>`}
      </div>
    </div>

    <div class="pd-section">
      <div class="pd-section-title">Position</div>
      <div class="pd-gauge-row">
        ${buildDegreeGaugeSVG(dms.raw, PLANET_COLORS[name])}
        <div class="pd-gauge-label">
          <div class="pd-gauge-deg">${dms.deg}° ${dms.min}' ${dms.sec}"</div>
          <div class="pd-gauge-sign">into ${sign.symbol} ${sign.name} (${sign.sk})</div>
        </div>
      </div>
    </div>

    <div class="pd-section">
      <div class="pd-section-title">Details</div>
      <div class="pd-grid">
        <div class="pd-stat">
          <div class="pd-stat-label">Ecliptic Longitude</div>
          <div class="pd-stat-value">${lon.toFixed(3)}°</div>
          <div class="pd-stat-sub">Sidereal (${ayanName()})</div>
        </div>
        <div class="pd-stat">
          <div class="pd-stat-label">Speed</div>
          <div class="pd-stat-value ${Math.abs(speed)<0.02?'accent':''}">${speed>=0?'+':''}${speed.toFixed(4)}°/day</div>
          <div class="pd-stat-sub">${speedCat}</div>
        </div>
        <div class="pd-stat">
          <div class="pd-stat-label">Nakshatra Lord</div>
          <div class="pd-stat-value">${NAKSHATRA_LORDS[nakIdx]}</div>
          <div class="pd-stat-sub">${nak}, Pada ${pada} of 4</div>
        </div>
        <div class="pd-stat">
          <div class="pd-stat-label">Sign Lord</div>
          <div class="pd-stat-value">${sign.lord}</div>
          <div class="pd-stat-sub">${sign.sk} rashi</div>
        </div>
        ${houseLine}
      </div>
    </div>

    <div class="pd-section">
      <div class="pd-section-title">Time In This Sign</div>
      <div class="pd-grid">
        <div class="pd-stat">
          <div class="pd-stat-label">Days In Sign</div>
          <div class="pd-stat-value accent">${daysInStr}</div>
        </div>
        <div class="pd-stat">
          <div class="pd-stat-label">Days Remaining</div>
          <div class="pd-stat-value accent">${daysLeftStr}</div>
        </div>
      </div>
      <div class="pd-grid" style="margin-top:10px;">
        <div class="pd-stat">
          <div class="pd-stat-label">Entered Sign</div>
          <div class="pd-stat-value" style="font-size:11.5px;">${enterStr}</div>
        </div>
        <div class="pd-stat">
          <div class="pd-stat-label">Exits Sign</div>
          <div class="pd-stat-value" style="font-size:11.5px;">${exitStr}</div>
        </div>
      </div>
    </div>

    <div class="pd-section">
      <div class="pd-section-title">Aspects (Graha Drishti)</div>
      ${aspectChips ? `<div class="pd-aspect-chip-row">${aspectChips}</div>` : `<div class="pd-empty-note">No planets currently in aspect with ${name}.</div>`}
    </div>
  `;
  document.getElementById('planetDetailContent').innerHTML = html;
  document.getElementById('planetDetailOverlay').classList.add('show');
}


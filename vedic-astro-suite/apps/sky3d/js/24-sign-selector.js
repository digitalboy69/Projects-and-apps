/* ============================================================================
   SIGN SELECTOR — pick any sign from a dropdown (or tap a wheel cell) to see
   it highlighted, plus every planet in it with exact degree, when it entered,
   when it exits, and days in/remaining.
   ============================================================================ */
let signSelectorBuilt = false;
function renderSignSelector(ctx, lagnaSignIdx){
  const dropdown = document.getElementById('signSelectDropdown');
  if (!signSelectorBuilt){
    signSelectorBuilt = true;
    SIGNS.forEach((sign,i)=>{
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${sign.symbol} ${sign.name} (${sign.sk})`;
      dropdown.appendChild(opt);
    });
    dropdown.addEventListener('change', ()=>{
      const val = dropdown.value;
      selectedWheelSign = val==="" ? null : parseInt(val,10);
      renderChartTab(); // re-render wheel with highlight
      if (selectedWheelSign!=null) openSignDetail(selectedWheelSign);
    });
  }
  dropdown.value = selectedWheelSign==null ? "" : String(selectedWheelSign);
}

// Called from wheel cell onclick — selects the sign, highlights it, and opens the detail popup
function selectWheelSign(signIdx){
  selectedWheelSign = signIdx;
  const dropdown = document.getElementById('signSelectDropdown');
  if (dropdown) dropdown.value = String(signIdx);
  renderChartTab();
  openSignDetail(signIdx);
}

function openSignDetailLegacy(signIdx){
  const jd = chartTabContextJD;
  const snap = snapshotPositions(jd);
  const sign = SIGNS[signIdx];

  const planetsInSign = PLANET_LIST.filter(name=> getSignIndex(snap.sidereal[name])===signIdx);
  const cardsHtml = planetsInSign.length ? planetsInSign.map(name=>{
    const lon = snap.sidereal[name];
    const dms = degreeInSign(lon);
    const occ = getSignOccupancy(name, jd);
    const enterStr = occ.enterJD!=null ? formatFullDate(occ.enterJD) : "Beyond calculable range";
    const exitStr = occ.exitJD!=null ? formatFullDate(occ.exitJD) : "Beyond calculable range";
    const daysInStr = occ.daysIn!=null ? formatDurationDays(occ.daysIn) : "—";
    const daysLeftStr = occ.daysLeft!=null ? formatDurationDays(occ.daysLeft) : "—";
    return `<div class="sd-planet-card" onclick="closeSignDetail(); openPlanetDetail('${name}', ${jd})">
      <div class="sd-planet-top">
        <span class="sd-planet-glyph" style="color:${PLANET_COLORS[name]}">${PLANET_GLYPHS[name]}</span>
        <span class="sd-planet-name">${name}</span>
        <span class="sd-planet-deg">${dms.deg}° ${dms.min}' ${dms.sec}"</span>
      </div>
      <div class="sd-planet-timeline">
        <div class="sd-tl-item"><div class="sd-tl-label">Days In Sign</div><div class="sd-tl-value accent">${daysInStr}</div></div>
        <div class="sd-tl-item"><div class="sd-tl-label">Days Remaining</div><div class="sd-tl-value accent">${daysLeftStr}</div></div>
        <div class="sd-tl-item" style="grid-column:1/-1;"><div class="sd-tl-label">Entered Sign</div><div class="sd-tl-value">${enterStr}</div></div>
        <div class="sd-tl-item" style="grid-column:1/-1;"><div class="sd-tl-label">Exits Sign</div><div class="sd-tl-value">${exitStr}</div></div>
      </div>
    </div>`;
  }).join('') : `<div class="pd-empty-note">No planets are currently in ${sign.name}.</div>`;

  const html = `
    <div class="sd-hero">
      <div class="sd-hero-symbol">${sign.symbol}</div>
      <div class="sd-hero-name">${sign.name} <span style="color:var(--text-faint); font-weight:400; font-size:14px;">(${sign.sk})</span></div>
      <div class="sd-hero-sub">Ruled by ${sign.lord} · ${formatFullDate(jd)}</div>
      <div class="pd-hero-badges" style="margin-top:12px;">
        <span class="pd-badge">${planetsInSign.length} planet${planetsInSign.length===1?'':'s'} currently here</span>
      </div>
    </div>
    <div class="pd-section">
      <div class="pd-section-title">Planets In ${sign.name}</div>
      ${cardsHtml}
    </div>
  `;
  document.getElementById('signDetailContent').innerHTML = html;
  document.getElementById('signDetailOverlay').classList.add('show');
}


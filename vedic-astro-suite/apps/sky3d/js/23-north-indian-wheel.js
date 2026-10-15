/* ---- North-Indian style diamond wheel, drawn as SVG (crisp at any size, no WebGL needed for this 2D summary view) ---- */
const NI_HOUSE_POLYGONS = [
  // 12 house cells for a standard North Indian diamond, house 1 = center-top diamond, going clockwise
  [50,2, 75,25, 50,48, 25,25],   // 1
  [50,2, 98,2, 75,25],            // 2
  [98,2, 98,50, 75,25, 75,25],    // placeholder overwritten below
];
// Building exact North-Indian coordinates cell-by-cell is intricate; instead we
// use the simpler, equally standard South-Indian FIXED-SIGN grid: signs stay in
// fixed cells and the Lagna marker moves — easier to read at a glance and just
// as authentic a chart style.
const SI_GRID = [
  // row,col for signs 0..11 (Aries..Pisces) in a 4x4 grid with the 2x2 center empty
  {sign:0, r:0, c:1}, {sign:1, r:0, c:2}, {sign:2, r:0, c:3}, {sign:3, r:1, c:3},
  {sign:4, r:2, c:3}, {sign:5, r:3, c:3}, {sign:6, r:3, c:2}, {sign:7, r:3, c:1},
  {sign:8, r:3, c:0}, {sign:9, r:2, c:0}, {sign:10, r:1, c:0}, {sign:11, r:0, c:0}
];
function renderChartWheel(ctx, lagnaSignIdx){
  const wrap = document.getElementById('chartWheelWrap');
  const cell = 88, pad = 4;
  const size = cell*4;
  let svg = `<div class="chart-wheel"><svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;

  // planets grouped by sign
  const planetsBySign = {};
  PLANET_LIST.forEach(name=>{
    const s = getSignIndex(ctx.sidereal[name]);
    (planetsBySign[s] = planetsBySign[s]||[]).push(name);
  });

  SI_GRID.forEach(cellDef=>{
    const x = cellDef.c*cell, y = cellDef.r*cell;
    const houseNum = getHouseOfLongitude(cellDef.sign*30+1, lagnaSignIdx);
    const isLagna = cellDef.sign===lagnaSignIdx;
    const isSelected = cellDef.sign===selectedWheelSign;
    const sign = SIGNS[cellDef.sign];
    svg += `<rect class="cw-house-bg${isLagna?' lagna':''}${isSelected?' selected':''}" style="cursor:pointer;" x="${x+pad}" y="${y+pad}" width="${cell-2*pad}" height="${cell-2*pad}" rx="6" onclick="selectWheelSign(${cellDef.sign})"></rect>`;
    svg += `<text class="cw-house-num" x="${x+10}" y="${y+16}" style="pointer-events:none;">H${houseNum}</text>`;
    svg += `<text class="cw-sign-name" x="${x+cell-10}" y="${y+16}" text-anchor="end" style="pointer-events:none;">${sign.symbol}</text>`;
    const planetsHere = planetsBySign[cellDef.sign] || [];
    planetsHere.forEach((name,i)=>{
      const px = x + 14 + (i%3)*24;
      const py = y + 38 + Math.floor(i/3)*20;
      svg += `<text class="cw-planet" x="${px}" y="${py}" fill="${PLANET_COLORS[name]}" onclick="event.stopPropagation(); openPlanetDetail('${name}', chartTabContextJD)">${PLANET_GLYPHS[name]}</text>`;
    });
    if (isLagna){
      svg += `<text class="cw-planet" x="${x+cell-24}" y="${y+cell-10}" fill="#00D9C0" font-size="8" style="pointer-events:none;">ASC</text>`;
    }
  });
  svg += `</svg></div>`;
  wrap.innerHTML = svg + `<div class="scan-range-note" style="margin-top:12px;">${escapeHtml(ctx.label)} · South-Indian fixed-sign layout · Whole-sign houses</div>`;
}

function renderHouseTable(ctx, lagnaSignIdx){
  const wrap = document.getElementById('houseTable');
  const planetsBySign = {};
  PLANET_LIST.forEach(name=>{
    const s = getSignIndex(ctx.sidereal[name]);
    (planetsBySign[s] = planetsBySign[s]||[]).push(name);
  });
  let html = "";
  for (let h=1; h<=12; h++){
    const signIdx = (lagnaSignIdx + h - 1) % 12;
    const sign = SIGNS[signIdx];
    const planetsHere = planetsBySign[signIdx] || [];
    const isLagna = h===1;
    html += `<div class="house-row">
      <div class="house-num-badge${isLagna?' lagna':''}">${h}</div>
      <div>
        <div class="house-sign-line">${sign.symbol} ${sign.name} <span style="color:var(--text-faint); font-weight:400;">(${sign.sk}, lord ${sign.lord})</span>${isLagna?'<span class="lagna-tag">LAGNA</span>':''}</div>
        <div class="house-planets-line">${planetsHere.length ? planetsHere.map(n=>`<span style="cursor:pointer;" onclick="openPlanetDetail('${n}', chartTabContextJD)">${PLANET_GLYPHS[n]} ${n}</span>`).join(' · ') : '<span class="hp-empty">No planets here</span>'}</div>
      </div>
    </div>`;
  }
  wrap.innerHTML = html;
}


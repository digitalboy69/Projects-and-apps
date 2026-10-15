function renderHUD(snap){
  document.getElementById('hudDate').textContent = formatHudDate(snap.jd);
  document.getElementById('hudTime').textContent = formatHudTime(snap.jd);
  document.getElementById('hudSub').textContent = `JD ${snap.jd.toFixed(3)} · Ayanamsa ${snap.ayanamsa.toFixed(3)}°`;
  const moonLon = snap.sidereal.Moon;
  const moonSign = SIGNS[getSignIndex(moonLon)];
  const moonNak = NAKSHATRAS[getNakshatraIndex(moonLon)];
  document.getElementById('hudMoon').textContent = `☽ ${moonSign.symbol} ${moonSign.name} · ${moonNak} Nakshatra`;
  const ascEl = document.getElementById('hudAsc');
  if (ascEl){
    const L = getLiveLoc(), aLon = siderealAscendant(snap.jd, L.lat, L.lon), aSign = SIGNS[getSignIndex(aLon)];
    ascEl.innerHTML = `↑ Rising ${aSign.symbol} ${aSign.name} ${degreeInSign(aLon).deg}°<span class="asc-nak"> · ${L.approx ? 'tap to set your place' : hudEsc(L.label)}</span> <span class="asc-pin">📍</span>`;
  }
  renderRising(false);
}

const skyRowNodes = {}; // planet name -> {glyph, name, sign, deg}
function buildSkyTableRows(){
  const wrap = document.getElementById('skyTable');
  wrap.innerHTML = "";
  ALL_BODIES.forEach(name=>{
    const row = document.createElement('div');
    row.className = 'sky-row';
    row.style.setProperty('--pc', PLANET_COLORS[name]);
    row.style.cursor = 'pointer';
    row.addEventListener('click', ()=>{
      openPlanetDetail(name);
    });
    row.innerHTML = `
      <div class="sky-glyph" style="color:${PLANET_COLORS[name]}">${PLANET_GLYPHS[name]}</div>
      <div class="sky-info">
        <div class="sky-name"><span class="sky-name-text">${name}</span><span class="retro-badge" style="display:none">R</span></div>
        <div class="sky-sign"></div>
      </div>
      <div class="sky-deg"></div>`;
    wrap.appendChild(row);
    skyRowNodes[name] = {
      retro: row.querySelector('.retro-badge'),
      sign: row.querySelector('.sky-sign'),
      deg: row.querySelector('.sky-deg')
    };
  });
}

function renderSkyTable(snap){
  ALL_BODIES.forEach(name=>{
    const nodes = skyRowNodes[name];
    if (!nodes) return;
    const lon = snap.sidereal[name];
    const sign = SIGNS[getSignIndex(lon)];
    const nakIdx = getNakshatraIndex(lon);
    const nak = NAKSHATRAS[nakIdx];
    const pada = Math.floor((normDeg(lon) % (360/27)) / ((360/27)/4)) + 1;
    const deg = getDegInSign(lon);
    const nakLord = NAKSHATRA_LORDS[nakIdx];
    nodes.sign.textContent = `${sign.symbol} ${sign.name} (${sign.sk}) · ${nak} Pada ${pada} (Lord: ${nakLord})` + (OUTER_LIST.includes(name) ? ` · ${OUTER_SK[name]} (outer planet)` : '');
    nodes.deg.textContent = formatDeg(deg);
    const showRetro = snap.retro[name] && name!=="Rahu" && name!=="Ketu";
    nodes.retro.style.display = showRetro ? '' : 'none';
  });
}


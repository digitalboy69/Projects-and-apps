/* ============================================================================
   NATAL PROFILE
   ============================================================================ */
const NATAL_STORAGE_KEY = 'ephemeris_natal_profiles_v1';
function loadNatalProfiles(){ try{ return JSON.parse(localStorage.getItem(NATAL_STORAGE_KEY)||"[]"); }catch(e){ return []; } }
function saveNatalProfiles(list){ localStorage.setItem(NATAL_STORAGE_KEY, JSON.stringify(list)); }

function refreshProfileSelect(){
  const profiles = loadNatalProfiles();
  const sel = document.getElementById('profileSelect');
  const cur = sel.value;
  sel.innerHTML = '<option value="">No natal chart</option>';
  profiles.forEach((p,i)=>{
    const opt = document.createElement('option');
    opt.value = i; opt.textContent = p.name;
    sel.appendChild(opt);
  });
  if (cur) sel.value = cur;
}

function renderNatalTab(){
  const wrap = document.getElementById('natalCardWrap');
  if (!isValidProfile(activeNatalProfile)){
    activeNatalProfile = null;
    wrap.innerHTML = `<div class="natal-card-empty">No active profile.<br>Enter birth details below to see personalized transit hits against your natal planets.</div>`;
    return;
  }
  const p = activeNatalProfile;
  const natalJD = toJulianDay(...p.dob.split('-').map(Number), ...p.tob.split(':').map(Number), 0) - p.tz/24;
  const natalSnap = snapshotPositions(natalJD);
  let planetsHtml = "";
  PLANET_LIST.forEach(name=>{
    const lon = natalSnap.sidereal[name];
    const sign = SIGNS[getSignIndex(lon)];
    planetsHtml += `<div class="sky-row" style="cursor:pointer;" onclick="openPlanetDetail('${name}', ${natalJD})"><div class="sky-glyph" style="color:${PLANET_COLORS[name]}">${PLANET_GLYPHS[name]}</div>
      <div class="sky-info"><div class="sky-name">${name}</div><div class="sky-sign">${sign.symbol} ${sign.name}</div></div>
      <div class="sky-deg">${formatDeg(getDegInSign(lon))}</div></div>`;
  });
  wrap.innerHTML = `<div class="natal-card">
    <div class="natal-name">${escapeHtml(p.name)}</div>
    <div class="natal-meta">${p.dob} · ${p.tob} · ${p.place ? p.place.split(',')[0] : ''}</div>
  </div>
  <div class="panel-heading">Natal Positions</div>
  ${planetsHtml}`;
  renderChartTab();
}

function escapeHtml(str){ const d=document.createElement('div'); d.textContent=str; return d.innerHTML; }


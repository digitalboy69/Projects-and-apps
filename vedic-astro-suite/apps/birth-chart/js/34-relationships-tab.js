/* ============================================================================
   RELATIONSHIPS TAB
   ============================================================================ */
let relSelectedPlanets = new Set();
let relSystem = "vedic";

document.addEventListener('click', (e)=>{
  const chip = e.target.closest('[data-rel-planet]');
  if (chip){
    const name = chip.dataset.relPlanet;
    if (relSelectedPlanets.has(name)){ relSelectedPlanets.delete(name); chip.classList.remove('selected'); }
    else { relSelectedPlanets.add(name); chip.classList.add('selected'); }
    return;
  }
  const sysBtn = e.target.closest('[data-rel-system]');
  if (sysBtn){
    relSystem = sysBtn.dataset.relSystem;
    document.querySelectorAll('#relSystemToggle .rel-system-btn').forEach(b=>b.classList.remove('active'));
    sysBtn.classList.add('active');
    return;
  }
  if (e.target.id === 'relFindBtn'){
    runRelationshipScan();
  }
});

function runRelationshipScan(){
  const resultsDiv = document.getElementById('relResults');
  if (!resultsDiv) return;
  const selected = [...relSelectedPlanets];
  if (selected.length < 2){
    resultsDiv.innerHTML = `<div class="rel-empty-state">Select at least two planets above, then click "Find Relationships".</div>`;
    return;
  }
  resultsDiv.innerHTML = `<div class="rel-loading">Scanning planetary motion across time — this searches up to 10 years in each direction…</div>`;

  setTimeout(()=>{
    const nowJD = toJulianDay(new Date().getUTCFullYear(), new Date().getUTCMonth()+1, new Date().getUTCDate(), new Date().getUTCHours(), new Date().getUTCMinutes(), 0);
    let html = "";
    for (let i=0; i<selected.length; i++){
      for (let j=i+1; j<selected.length; j++){
        const a = selected[i], b = selected[j];
        html += buildRelPairCard(a, b, nowJD);
      }
    }
    resultsDiv.innerHTML = html;
  }, 30);
}

function buildRelPairCard(bodyA, bodyB, nowJD){
  const lonA = getSiderealLongitudeAt(bodyA, nowJD);
  const lonB = getSiderealLongitudeAt(bodyB, nowJD);
  const currentSep = angDiffLocal(lonA, lonB);

  let rowsHtml = "";

  if (relSystem === "vedic"){
    const vedicTargets = [
      { name:"Conjunction (same sign)", angle:0 },
      { name:"Opposition (7th aspect)", angle:180 }
    ];
    vedicTargets.forEach(t=>{
      const result = findNearestAspectForPair(bodyA, bodyB, t.angle, nowJD, 3650);
      const isActiveNow = Math.abs(angleErrorForTarget(lonA, lonB, t.angle)) <= 3;
      rowsHtml += buildAspectRow(t.name, result, isActiveNow);
    });
  } else {
    WESTERN_ASPECTS.forEach(asp=>{
      const result = findNearestAspectForPair(bodyA, bodyB, asp.angle, nowJD, 3650);
      const isActiveNow = Math.abs(angleErrorForTarget(lonA, lonB, asp.angle)) <= asp.orb;
      rowsHtml += buildAspectRow(`${asp.symbol} ${asp.name} (${asp.angle}°)`, result, isActiveNow);
    });
  }

  return `
  <div class="rel-pair-card">
    <div class="rel-pair-head">
      <div class="rel-pair-planets">
        <span>${PLANET_GLYPHS[bodyA]} ${bodyA}</span>
        <span class="rel-pair-symbol">⟷</span>
        <span>${PLANET_GLYPHS[bodyB]} ${bodyB}</span>
      </div>
      <div class="rel-pair-current">Currently ${currentSep.toFixed(1)}° apart</div>
    </div>
    ${rowsHtml}
  </div>`;
}

function buildAspectRow(label, result, isActiveNow){
  const prevText = result.previous ? formatRelDate(result.previous.jd) : "Not found in the last 10 years";
  const nextText = result.next ? formatRelDate(result.next.jd) : "Not found in the next 10 years";
  return `
  <div class="rel-aspect-row">
    <div class="rel-aspect-name">${label}${isActiveNow ? '<span class="rel-aspect-active-badge">Active now</span>' : ''}</div>
    <div class="rel-aspect-dates">
      <span class="past">← ${prevText}</span>
      <span class="future">${nextText} →</span>
    </div>
  </div>`;
}

function formatRelDate(jd){
  let j = jd + 0.5;
  const Z = Math.floor(j), F = j-Z;
  let A = Z;
  if (Z>=2299161){ const alpha=Math.floor((Z-1867216.25)/36524.25); A=Z+1+alpha-Math.floor(alpha/4); }
  const B=A+1524, C=Math.floor((B-122.1)/365.25), D=Math.floor(365.25*C), E=Math.floor((B-D)/30.6001);
  const day = B-D-Math.floor(30.6001*E)+F;
  const month = E<14 ? E-1 : E-13;
  const year = month>2 ? C-4716 : C-4715;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${Math.floor(day)} ${months[month-1]} ${year}`;
}

document.getElementById('profileSelect').addEventListener('change', (e) => {
  document.getElementById('mainMenuModal').classList.remove('show'); // Hide menu immediately so UI doesn't freeze

  const idx = e.target.value;
  if (idx !== "") {
    localStorage.setItem('VedicAstrology_lastProfileIdx', idx);
  } else {
    localStorage.removeItem('VedicAstrology_lastProfileIdx');
  }

  if (idx === "") {
    document.getElementById('intakeSection').style.display = '';
    document.getElementById('results').classList.remove('show');
    document.getElementById('appTabbar').classList.remove('show');
    return;
  }

  const profiles = loadProfiles();
  const p = profiles[idx];
  if (!p) return;

  // Load old details safely
  loadProfileIntoForm(p);

  // Show the loading screen to give feedback
  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.classList.add('show');
  document.getElementById('results').classList.remove('show');
  document.getElementById('intakeSection').style.display = 'none';

  // Wait 150ms to allow the browser to paint the closing menu and loading spinner before doing heavy math
  setTimeout(() => {
    try {
      renderResults(p);
    } catch(err) {
      console.error("Error loading profile:", err);
      alert("There was an issue loading this profile. It may be corrupted.");
    }
    loadingOverlay.classList.remove('show');
  }, 150);
});

function loadProfileIntoForm(p){
  document.getElementById('profileName').value = p.name || "";
  document.getElementById('dobInput').value = p.dob || "";
  document.getElementById('tobInput').value = p.tob || "";
  placeInput.value = p.place || "";
  selectedLat = p.lat || null; 
  selectedLon = p.lon || null;
  coordReadout.textContent = (p.lat !== null && p.lon !== null) ? `${p.lat.toFixed(4)}°, ${p.lon.toFixed(4)}°` : "— not yet selected —";
  const sel = document.getElementById('tzInput');
  [...sel.options].forEach(o=>{ if (parseFloat(o.value)===p.tz) o.selected = true; });
  try{ inSyncFriendly(); inUpdate(); }catch(e){}
}

document.getElementById('newProfileBtn').addEventListener('click', ()=>{
  document.getElementById('birthForm').reset();
  selectedLat=null; selectedLon=null;
  coordReadout.textContent = "— not yet selected —";
  document.getElementById('profileSelect').value = "";
  document.getElementById('results').classList.remove('show');
  document.getElementById('appTabbar').classList.remove('show');
  document.getElementById('intakeSection').style.display = '';
  window.scrollTo({top: 0, behavior: 'smooth'});
  document.getElementById('profileName').focus();
});

let pendingDeleteIdx = null;
document.getElementById('deleteProfileBtn').addEventListener('click', ()=>{
  const sel = document.getElementById('profileSelect');
  if (!sel.value){ return; }
  pendingDeleteIdx = sel.value;
  document.getElementById('modalTitle').textContent = "Delete this profile?";
  document.getElementById('modalBody').textContent = `This will permanently remove "${sel.options[sel.selectedIndex].textContent}" from this browser.`;
  document.getElementById('confirmModal').classList.add('show');
});
document.getElementById('modalCancel').addEventListener('click', ()=>{
  document.getElementById('confirmModal').classList.remove('show');
  pendingDeleteIdx = null;
});
document.getElementById('modalConfirm').addEventListener('click', ()=>{
  if (pendingDeleteIdx !== null){
    const profiles = loadProfiles();
    profiles.splice(pendingDeleteIdx,1);
    saveProfiles(profiles);
    refreshProfileSelect();
    document.getElementById('birthForm').reset();
    document.getElementById('results').classList.remove('show');
    document.getElementById('appTabbar').classList.remove('show');
    document.getElementById('intakeSection').style.display = '';
  }
  document.getElementById('confirmModal').classList.remove('show');
  pendingDeleteIdx = null;
});


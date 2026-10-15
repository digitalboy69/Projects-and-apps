/* ============================================================================
   FORM SUBMIT -> COMPUTE -> RENDER
   ============================================================================ */
document.getElementById('birthForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const errorBanner = document.getElementById('errorBanner');
  errorBanner.classList.remove('show');

  const name = document.getElementById('profileName').value.trim();
  const dob = document.getElementById('dobInput').value;
  const tob = document.getElementById('tobInput').value;
  const tz = parseFloat(document.getElementById('tzInput').value);

  if (!name || !dob || !tob){
    const miss = [!name?'your name':'', !dob?'the date you were born':'', !tob?'the time you were born (tap "No idea" if unsure)':''].filter(Boolean).join(', ');
    errorBanner.textContent = "Almost there! Please add: " + miss + ".";
    errorBanner.classList.add('show');
    return;
  }
  if (selectedLat === null || selectedLon === null){
    errorBanner.textContent = "Please tap your city in the list that appears under the box (or use the map pin) so we know where you were born.";
    errorBanner.classList.add('show');
    return;
  }

  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.classList.add('show');
  document.getElementById('results').classList.remove('show');

  setTimeout(()=>{
    const profile = {
      name, dob, tob, tz,
      place: placeInput.value, lat: selectedLat, lon: selectedLon,
      savedAt: Date.now()
    };

    const profiles = loadProfiles();
    const existingIdx = profiles.findIndex(p=> p.name===name && p.dob===dob && p.tob===tob && p.place===profile.place);
    if (existingIdx >= 0) profiles[existingIdx] = profile; else profiles.push(profile);
    saveProfiles(profiles);
    refreshProfileSelect();
    const sel = document.getElementById('profileSelect');
    const newIdx = profiles.findIndex(p=> p.savedAt===profile.savedAt);
    sel.value = newIdx;

    loadingOverlay.classList.remove('show');
    document.getElementById('intakeSection').style.display = 'none';
    
    // Render the chart first so the calculations are finished
    renderResults(profile);

  }, 400);
});


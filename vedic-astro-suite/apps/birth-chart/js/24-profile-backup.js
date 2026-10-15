/* ============================================================================
   EXPORT / IMPORT ALL PROFILES (backup & restore via copy-paste)
   ============================================================================ */
function openProfileDataModal(mode){
  document.getElementById('mainMenuModal').classList.remove('show');
  const modal = document.getElementById('profileDataModal');
  const title = document.getElementById('profileDataModalTitle');
  const hint = document.getElementById('profileDataModalHint');
  const ta = document.getElementById('profileDataTextarea');
  const primaryBtn = document.getElementById('profileDataPrimaryBtn');
  const secondaryBtn = document.getElementById('profileDataSecondaryBtn');
  const status = document.getElementById('profileDataStatus');
  status.textContent = '';
  status.className = 'profile-data-status';

  if (mode === 'export'){
    const profiles = loadProfiles();
    title.textContent = 'Export All Profiles';
    hint.textContent = `This is a backup of all ${profiles.length} saved profile${profiles.length===1?'':'s'} on this device. Copy it somewhere safe — on another device or browser, open this menu, choose "Import Profiles", paste it in, and they'll all come back.`;
    ta.value = JSON.stringify(profiles, null, 2);
    ta.readOnly = true;
    ta.placeholder = '';
    primaryBtn.innerHTML = '<span>📋</span> Copy to Clipboard';
    primaryBtn.style.display = '';
    primaryBtn.onclick = () => {
      copyTextToClipboard(ta.value, primaryBtn, '<span>📋</span> Copy to Clipboard');
    };
    secondaryBtn.style.display = 'none';
  } else {
    title.textContent = 'Import Profiles';
    hint.textContent = 'Paste profile backup text (from "Export All Profiles" on this or another device) below, then import. Profiles are merged with what you already have — existing profiles with the same name, date, time and place are updated in place; everything else is added.';
    ta.value = '';
    ta.readOnly = false;
    ta.placeholder = 'Paste exported profile JSON here...';
    primaryBtn.style.display = 'none';
    secondaryBtn.style.display = '';
    secondaryBtn.innerHTML = '<span>📥</span> Import These Profiles';
    secondaryBtn.onclick = () => {
      let incoming;
      try {
        incoming = JSON.parse(ta.value);
        if (!Array.isArray(incoming)) throw new Error('not an array');
      } catch (e){
        status.textContent = '⚠ That doesn\'t look like valid exported profile data. Make sure you pasted the full text.';
        status.className = 'profile-data-status error';
        return;
      }
      const validKeys = ['name','dob','tob','tz','place','lat','lon'];
      const valid = incoming.filter(p => p && typeof p === 'object' && validKeys.every(k => k in p));
      if (valid.length === 0){
        status.textContent = '⚠ No valid profiles found in that text.';
        status.className = 'profile-data-status error';
        return;
      }
      const existing = loadProfiles();
      let added = 0, updated = 0;
      valid.forEach(p => {
        if (!p.savedAt) p.savedAt = Date.now();
        const idx = existing.findIndex(e => e.name===p.name && e.dob===p.dob && e.tob===p.tob && e.place===p.place);
        if (idx >= 0){ existing[idx] = p; updated++; } else { existing.push(p); added++; }
      });
      saveProfiles(existing);
      refreshProfileSelect();
      status.textContent = `✓ Imported successfully — ${added} new, ${updated} updated. Total profiles: ${existing.length}.`;
      status.className = 'profile-data-status success';
    };
  }

  modal.classList.add('show');
}
document.getElementById('exportProfilesBtn').addEventListener('click', () => openProfileDataModal('export'));
document.getElementById('importProfilesBtn').addEventListener('click', () => openProfileDataModal('import'));
document.getElementById('profileDataModalClose').addEventListener('click', () => {
  document.getElementById('profileDataModal').classList.remove('show');
});
document.getElementById('profileDataModal').addEventListener('click', (e) => {
  if (e.target.id === 'profileDataModal') document.getElementById('profileDataModal').classList.remove('show');
});


/* ============================================================================
   MAKE A PROFILE FROM A MOMENT (3D Sky): turn the moment on screen, or any Saved moment, into a natal profile in one step.
   Entry points: the 👤 button in the timeline bar (takes the moment showing at the instant of the tap, even while time is running)
   and the 👤 button on each row of Saved moments (js/49, via window.tmSavedMoments).
   Date and time are the ones the 3D app shows (your device clock zone), the timezone is that zone's offset at that moment, and the place is
   "Where are you now?" (getLiveLoc, js/17). With only a time-zone estimate of the place the Create button stays off until you set a place,
   because the Rising sign would be wrong. The profile is saved with the same functions as the Natal form (loadNatalProfiles / saveNatalProfiles),
   so it appears in the profile list and is activated. Classes pm- prefixed. Test: tests/sky3d_profile_moment_test.js
   ============================================================================ */
(function(){
  'use strict';
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], p2 = n => String(n).padStart(2, '0');
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  /* pure part: everything a profile needs from a Julian Day and a place */
  window.pmDraft = function(jd, name){
    const c = jdToDate(jd), y = c.getFullYear(), m = c.getMonth() + 1, d = c.getDate(), hh = c.getHours(), mi = c.getMinutes();
    const L = getLiveLoc(), tz = localOffsetMin(jd) / 60;
    const label = p2(d) + ' ' + MON[m - 1] + ' ' + yearLabel(y) + ' · ' + p2(hh) + ':' + p2(mi);
    return { jd, label, approx: !!L.approx, placeLabel: L.label, tz,
      profile: { name: (name || '').trim() || ('Moment ' + label), dob: formatDobStr(y, m, d), tob: p2(hh) + ':' + p2(mi), tz, lat: L.lat, lon: L.lon, place: L.label, savedAt: Date.now() } };
  };
  window.pmCreate = function(draft){
    if (!draft || draft.approx) return null;
    const list = loadNatalProfiles(); list.push(draft.profile); saveNatalProfiles(list);
    refreshProfileSelect(); const sel = document.getElementById('profileSelect'); if (sel) sel.value = String(list.length - 1);
    activeNatalProfile = draft.profile; renderNatalTab(); return draft.profile;
  };
  let ov = null, cur = null, watch = 0;
  function toast(t){
    let el = document.getElementById('pmToast');
    if (!el){ el = document.createElement('div'); el.id = 'pmToast';
      el.style.cssText = 'position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:99999;max-width:92vw;padding:10px 18px;border-radius:99px;background:rgba(18,20,29,.96);border:1px solid #00F0D5;color:#bffcf4;font:500 13px/1.4 system-ui,sans-serif;transition:opacity .3s;pointer-events:none';
      document.body.appendChild(el); }
    el.textContent = t; el.style.opacity = '1'; clearTimeout(el._t); el._t = setTimeout(() => { el.style.opacity = '0'; }, 3600);
  }
  function paint(){
    const nm = ov.querySelector('.pm-name').value, dr = pmDraft(cur.jd, nm || ''); const keep = nm;
    ov.querySelector('.pm-name').placeholder = 'Moment ' + dr.label;
    ov.querySelector('.pm-rows').innerHTML = `<div><span>Date</span><b>${esc(dr.label.split(' · ')[0])}</b></div><div><span>Time</span><b>${esc(dr.label.split(' · ')[1])}</b></div>
      <div><span>Timezone</span><b>UTC${dr.tz >= 0 ? '+' : '−'}${Math.abs(dr.tz)}</b></div><div><span>Place</span><b>${esc(dr.placeLabel)}${dr.approx ? ' <i>(a guess)</i>' : ''}</b></div>`;
    ov.querySelector('.pm-warn').hidden = !dr.approx;
    ov.querySelector('.pm-go').disabled = dr.approx; ov.querySelector('.pm-place').textContent = dr.approx ? 'Set place' : 'Change place';
    cur.draft = dr; if (keep === '') ov.querySelector('.pm-name').value = '';
  }
  function close(){ if (ov) ov.classList.remove('show'); clearInterval(watch); }
  function open(jd){
    cur = { jd };
    if (!ov){
      ov = document.createElement('div'); ov.className = 'pm-ov';
      ov.innerHTML = `<div class="pm-card" role="dialog" aria-label="Make a profile from this moment"><div class="pm-top"><b>👤 Make a profile</b><button type="button" class="pm-x" aria-label="Close">✕</button></div>
        <p class="pm-lead">A new natal profile from this exact moment.</p>
        <label class="pm-lab" for="pmName">Name</label><input id="pmName" class="pm-name" type="text" maxlength="40" autocomplete="off">
        <div class="pm-rows"></div><p class="pm-warn" hidden>Your place is only a time-zone guess, so the Rising sign would be off. Set your place first.</p>
        <div class="pm-btns"><button type="button" class="pm-place">Change place</button><button type="button" class="pm-go">Create profile</button></div></div>`;
      document.body.appendChild(ov);
      ov.addEventListener('pointerdown', e => { if (e.target === ov) close(); });
      ov.querySelector('.pm-x').addEventListener('click', close);
      ov.querySelector('.pm-name').addEventListener('input', paint);
      ov.querySelector('.pm-place').addEventListener('click', () => { if (typeof askLiveLoc === 'function') askLiveLoc(); });
      ov.querySelector('.pm-go').addEventListener('click', () => {
        const pr = pmCreate(cur.draft); if (!pr) return; close();
        const tab = document.querySelector('[data-tab="natal"]'); if (tab) tab.click();
        toast('✦ Profile “' + pr.name + '” created and opened');
      });
    }
    ov.querySelector('.pm-name').value = ''; paint(); ov.classList.add('show');
    let last = JSON.stringify(getLiveLoc()); clearInterval(watch);
    watch = setInterval(() => { const n = JSON.stringify(getLiveLoc()); if (n !== last){ last = n; paint(); } }, 500);   // the place picker answers later
  }
  window.pmOpen = open;
  document.addEventListener('click', e => {
    if (e.target.closest('#tlMkProfile')){ open(currentJD); return; }
    const b = e.target.closest('.sv-mp'); if (!b) return;
    const row = b.closest('.sv-it'), m = window.tmSavedMoments && window.tmSavedMoments()[+row.dataset.i]; if (!m) return;
    e.stopPropagation(); open(m.jd);
  }, true);
})();

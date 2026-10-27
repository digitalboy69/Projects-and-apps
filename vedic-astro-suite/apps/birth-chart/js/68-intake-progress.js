/* ---- Intake: progress + welcome-back chips ---- */
function inUpdate(){
  const v = id => (document.getElementById(id).value||'').trim();
  const d1 = v('profileName').length>0, d2 = !!((window.inDobValue ? inDobValue() : v('dobInput')) && v('tobInput')), d3 = (typeof selectedLat==='number' && !isNaN(selectedLat));
  [d1,d2,d3].forEach((d,i)=> document.querySelector(`.in-step[data-step="${i+1}"]`).classList.toggle('done', d));
  const n=[d1,d2,d3].filter(Boolean).length, hints=["First, tell us your name","Now, when were you born?","Last one: where were you born?"];
  document.getElementById('inBarFill').style.width = (n/3*100)+'%';
  try{ inSyncFriendly(); inFoundUpdate(); }catch(e){}
  document.querySelectorAll('.in-step').forEach(x=> x.classList.remove('current')); const cur = document.querySelector(`.in-step[data-step="${Math.min(3, [d1,d2,d3].findIndex(x=>!x)+1 || 3)}"]`); if (cur && n<3) cur.classList.add('current');
  document.getElementById('inStepLbl').textContent = n===3 ? 'All set ✓' : `Step ${n+1} of 3`;
  document.getElementById('inStepHint').textContent = n===3 ? 'Tap “Show my chart” below' : (!d1?hints[0]:!d2?hints[1]:hints[2]);
}
function renderIntakeSaved(){
  const box=document.getElementById('inSaved'); if(!box) return;
  const ps=loadProfiles();
  if(!ps.length){ box.hidden=true; return; }
  box.hidden=false;
  box.innerHTML='<span>Welcome back — open a saved chart:</span>'+ps.map((p,i)=>`<button type="button" data-in-prof="${i}">${escapeHtml(p.name||'Unnamed')}</button>`).join('');
}
document.getElementById('inSaved').addEventListener('click',(e)=>{
  const b=e.target.closest('[data-in-prof]'); if(!b) return;
  const sel=document.getElementById('profileSelect'); sel.value=b.dataset.inProf; sel.dispatchEvent(new Event('change'));
});
(function(){
  const form=document.getElementById('birthForm');
  form.addEventListener('input',inUpdate); form.addEventListener('change',inUpdate);
  form.addEventListener('reset',()=>setTimeout(inUpdate,0));
  new MutationObserver(inUpdate).observe(document.getElementById('coordReadout'),{childList:true,characterData:true,subtree:true});
  const o=refreshProfileSelect; refreshProfileSelect=function(){ o.apply(this,arguments); renderIntakeSaved(); };
  try{ inBuildFriendly(); }catch(e){ console.error('intake', e); }
  renderIntakeSaved(); inUpdate();
})();


// Automatically track new profile saves and form clears
document.getElementById('birthForm').addEventListener('submit', () => {
  setTimeout(() => {
    const sel = document.getElementById('profileSelect');
    if (sel.value !== "") localStorage.setItem('VedicAstrology_lastProfileIdx', sel.value);
  }, 500); // Trigger just after the chart renders
});
document.getElementById('newProfileBtn').addEventListener('click', () => {
  localStorage.removeItem('VedicAstrology_lastProfileIdx');
});
document.getElementById('modalConfirm').addEventListener('click', () => {
  localStorage.removeItem('VedicAstrology_lastProfileIdx');
});

// Auto-load last active profile on page load
(function autoLoadLastProfile() {
  const profiles = loadProfiles();
  if (profiles && profiles.length > 0) {
    let lastIdx = localStorage.getItem('VedicAstrology_lastProfileIdx');
    // Default to the most recently added profile if none is stored or index is invalid
    if (lastIdx === null || lastIdx >= profiles.length || lastIdx < 0 || lastIdx === "") {
      lastIdx = profiles.length - 1;
    }
    const sel = document.getElementById('profileSelect');
    sel.value = lastIdx;
    if (sel.value !== "") {
      sel.dispatchEvent(new Event('change')); // Trigger chart rendering
    }
  }
})();

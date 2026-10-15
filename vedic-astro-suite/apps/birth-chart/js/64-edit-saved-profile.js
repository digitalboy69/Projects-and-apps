/* ---- Edit a saved profile's name / birth date / birth time (menu -> profile card -> ✏️) ---- */
function openProfEdit(idx){
  const list=loadProfiles(), p=list[idx]; if(!p) return;
  let m=document.getElementById('profEditModal');
  if(!m){
    m=document.createElement('div'); m.className='modal-overlay'; m.id='profEditModal';
    m.innerHTML='<div class="modal-box pe-box"><h4>✏️ Edit birth details</h4>'
      +'<label class="pe-l">Name<input type="text" id="peName" maxlength="60"></label>'
      +'<label class="pe-l">Date of birth<input type="date" id="peDob"></label>'
      +'<label class="pe-l">Time of birth<input type="time" id="peTob" step="60"></label>'
      +'<p class="pe-note">Place stays the same. To change the place, create a new profile. The chart is recalculated when you save.</p>'
      +'<div class="pe-err" id="peErr" hidden></div>'
      +'<div class="modal-actions"><button type="button" class="btn btn-ghost btn-sm" id="peCancel">Cancel</button><button type="button" class="btn btn-primary btn-sm" id="peSave">Save &amp; recalculate</button></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click',e=>{ if(e.target===m) m.classList.remove('show'); });
    m.querySelector('#peCancel').addEventListener('click',()=>m.classList.remove('show'));
    m.querySelector('#peSave').addEventListener('click',()=>{
      const i=+m.dataset.idx, L=loadProfiles(), q=L[i]; if(!q) return;
      const nm=m.querySelector('#peName').value.trim(), d=m.querySelector('#peDob').value, t=m.querySelector('#peTob').value, er=m.querySelector('#peErr');
      if(!nm||!d||!t){ er.textContent='Please fill in the name, date and time.'; er.hidden=false; return; }
      q.name=nm; q.dob=d; q.tob=t; L[i]=q; saveProfiles(L); m.classList.remove('show');
      refreshProfileSelect();
      const sel=document.getElementById('profileSelect'); sel.value=String(i); sel.dispatchEvent(new Event('change'));
    });
  }
  m.dataset.idx=idx;
  m.querySelector('#peName').value=p.name||''; m.querySelector('#peDob').value=p.dob||''; m.querySelector('#peTob').value=(p.tob||'').slice(0,5);
  m.querySelector('#peErr').hidden=true;
  m.classList.add('show');
}
document.getElementById('openMenuBtn').addEventListener('click', renderProfileCards);

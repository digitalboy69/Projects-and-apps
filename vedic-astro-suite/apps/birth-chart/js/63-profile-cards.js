/* ---- Profile cards (menu) ---- */
function renderProfileCards(){
  const box=document.getElementById('profileCards'); if(!box) return;
  const profiles=loadProfiles(), cur=document.getElementById('profileSelect').value;
  document.getElementById('profCount').textContent = profiles.length ? `(${profiles.length})` : '';
  if(!profiles.length){ box.innerHTML='<div class="prof-empty">No saved profiles yet.<br>Create your first chart with “Create New Profile” below.</div>'; return; }
  const cols=['#D4AF37','#5EC4B7','#8A6FB8','#E0A64A','#6B7FA3','#C95050','#5B8A9E'];
  const ic={share:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4m0 0L8 8m4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>',
    edit:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3zM14 7l3 3"/></svg>',
    del:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12M10 11v5M14 11v5"/></svg>',
    pin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10zM12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>'};
  box.innerHTML=profiles.map((p,i)=>{
    const nm=(p.name||'?').trim()||'?', col=cols[[...nm].reduce((a,c)=>a+c.charCodeAt(0),0)%cols.length];
    const place=(p.place||'').split(',')[0].trim(), on=String(i)===cur;
    return `<div class="prof-card ${on?'active':''}" data-prof="${i}">
      <div class="prof-top"><span class="prof-av" style="background:${col}">${escapeHtml(Array.from(nm)[0].toUpperCase())}</span>
      <span class="prof-info"><b>${escapeHtml(p.name||'Unnamed')}</b>${on?'<span class="prof-badge">Active</span>':''}
      <small>${formatDateHuman(p.dob)}, ${p.tob||''}</small>${place?`<small class="prof-place">${ic.pin}${escapeHtml(place)}</small>`:''}</span></div>
      <div class="prof-acts">
        <button type="button" class="prof-share" data-prof-share="${i}" aria-label="Share chart of ${escapeHtml(nm)}">${ic.share}<span>Share</span></button>
        <button type="button" class="prof-edit" data-prof-edit="${i}" aria-label="Edit birth date and time of ${escapeHtml(nm)}">${ic.edit}<span>Edit</span></button>
        <button type="button" class="prof-del" data-prof-del="${i}" aria-label="Delete ${escapeHtml(nm)}">${ic.del}<span>Delete</span></button>
      </div>
    </div>`;
  }).join('');
}
document.getElementById('profileCards').addEventListener('click',(e)=>{
  const sel=document.getElementById('profileSelect');
  const del=e.target.closest('[data-prof-del]');
  const ed=e.target.closest('[data-prof-edit]');
  if(ed){ e.stopPropagation(); openProfEdit(+ed.dataset.profEdit); return; }
  if(del){ e.stopPropagation(); sel.value=del.dataset.profDel; document.getElementById('deleteProfileBtn').click(); return; }
  const card=e.target.closest('[data-prof]');
  if(card){ sel.value=card.dataset.prof; sel.dispatchEvent(new Event('change')); }
});
(function(){ const orig=refreshProfileSelect; refreshProfileSelect=function(){ orig.apply(this,arguments); renderProfileCards(); }; })();


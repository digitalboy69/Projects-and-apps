/* ---- Profile cards (menu) ---- */
function renderProfileCards(){
  const box=document.getElementById('profileCards'); if(!box) return;
  const profiles=loadProfiles(), cur=document.getElementById('profileSelect').value;
  document.getElementById('profCount').textContent = profiles.length ? `(${profiles.length})` : '';
  if(!profiles.length){ box.innerHTML='<div class="prof-empty">No saved profiles yet.<br>Create your first chart with “Create New Profile” below.</div>'; return; }
  const cols=['#D4AF37','#5EC4B7','#8A6FB8','#E0A64A','#6B7FA3','#C95050','#5B8A9E'];
  box.innerHTML=profiles.map((p,i)=>{
    const col=cols[[...(p.name||'?')].reduce((a,c)=>a+c.charCodeAt(0),0)%cols.length];
    const place=(p.place||'').split(',')[0];
    return `<div class="prof-card ${String(i)===cur?'active':''}" data-prof="${i}">
      <span class="prof-av" style="background:${col}">${escapeHtml((p.name||'?').trim().charAt(0).toUpperCase())}</span>
      <span class="prof-info"><b>${escapeHtml(p.name||'Unnamed')}${String(i)===cur?'<span class="prof-badge">Active</span>':''}</b>
      <small>${formatDateHuman(p.dob)} · ${p.tob||''}${place?' · '+escapeHtml(place):''}</small></span>
      <button type="button" class="prof-share" data-prof-share="${i}" title="Share chart link / QR" aria-label="Share chart">📤</button>
      <button type="button" class="prof-edit" data-prof-edit="${i}" title="Edit birth date &amp; time" aria-label="Edit birth date and time">✏️</button>
      <button type="button" class="prof-del" data-prof-del="${i}" title="Delete profile" aria-label="Delete profile">🗑️</button>
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


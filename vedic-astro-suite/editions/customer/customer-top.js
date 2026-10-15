/* CUSTOMER TOP LAYER — brand badge, title, per-customer tab flags (wrapper document). */
(function(){
  var B=window.__VAX_BRAND||{},F=window.__VAX_FEATURES||{};
  if(B.brand_name) document.title=B.brand_name;
  [['A','sky'],['N','notes']].forEach(function(p){ if(F[p[1]]===false){ var b=document.querySelector('.sw-item[data-act="'+p[0]+'"]'); if(b) b.style.display='none'; } });
  if(true){
    var d=document.createElement('div'); d.id='vcxBrand';
    d.style.cssText='position:fixed;left:10px;bottom:10px;z-index:35;display:flex;align-items:center;gap:7px;max-width:52vw;padding:5px 11px 5px 6px;border-radius:999px;background:rgba(10,14,24,.72);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#e9edf6;font:600 12px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;cursor:pointer';
    if(B.logo&&/^data:image\//.test(B.logo)){ var im=document.createElement('img'); im.src=B.logo; im.alt=''; im.style.cssText='width:22px;height:22px;border-radius:50%;object-fit:cover'; d.appendChild(im); }
    { var s=document.createElement('span'); s.textContent=B.brand_name||'✎ Set your brand'; s.style.cssText='white-space:nowrap;overflow:hidden;text-overflow:ellipsis'; d.appendChild(s); }
    if(B.accent&&/^#[0-9a-f]{6}$/i.test(B.accent)) d.style.borderColor=B.accent+'88';
    d.title='Edit your brand'; d.setAttribute('role','button'); d.onclick=function(){ location.href=location.pathname+'?brand=1'+location.hash; };
    document.body.appendChild(d);
  }
})();

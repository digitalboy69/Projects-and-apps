/* ============================================================================
   RENDER: HUD + Sky table
   ============================================================================ */
/* ---- where you are now (used for the live Rising sign) ---- */
let liveLocMem = null;
const hudEsc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
function getLiveLoc(){
  if (liveLocMem) return liveLocMem;
  try { const v = JSON.parse(localStorage.getItem('vax_live_loc') || 'null'); if (v && isFinite(v.lat) && isFinite(v.lon)) return (liveLocMem = { lat:+v.lat, lon:+v.lon, label:String(v.label || 'your place') }); } catch(e){}
  const off = -new Date().getTimezoneOffset() / 60;          // hours east of Greenwich -> rough longitude until the person sets a place
  return { lat: 22, lon: off * 15, label: 'time-zone estimate', approx: true };
}
function askLiveLoc(){
  const apply = (lat, lon, label)=>{
    liveLocMem = { lat, lon, label };
    try { localStorage.setItem('vax_live_loc', JSON.stringify(liveLocMem)); } catch(e){}
    const snap = A.snap || snapshotPositions(currentJD); renderHUD(snap); updateOverlays(snap); markDirty();
  };
  const LP = (window.parent && window.parent !== window) ? window.parent.LocPicker : null;
  if (LP){ const c = getLiveLoc(); LP.open({ title:'Where are you now?', lat:c.lat, lon:c.lon, onPick: r => apply(parseFloat(r.lat), parseFloat(r.lon), String(r.display_name || 'your place').split(',')[0]) }); }
  else if (navigator.geolocation) navigator.geolocation.getCurrentPosition(p => apply(p.coords.latitude, p.coords.longitude, 'your location'), ()=>{});
}

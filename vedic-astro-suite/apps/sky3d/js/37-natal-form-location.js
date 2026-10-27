/* ---- Natal form + location autocomplete (mini) ---- */
const TZ_OPTIONS = [-12,-11,-10,-9.5,-9,-8,-7,-6,-5,-4.5,-4,-3.5,-3,-2,-1,0,1,2,3,3.5,4,4.5,5,5.5,5.75,6,6.5,7,8,8.75,9,9.5,10,10.5,11,12,12.75,13,14];
function fmtTz(v){ const sign=v>=0?"+":"-"; const abs=Math.abs(v); const h=Math.floor(abs); const m=Math.round((abs-h)*60); return `UTC${sign}${h}${m?":"+String(m).padStart(2,'0'):':00'}`; }
function populateNatalTz(){
  const sel = document.getElementById('natalTz');
  sel.innerHTML = "";
  TZ_OPTIONS.forEach(v=>{ const opt=document.createElement('option'); opt.value=v; opt.textContent=fmtTz(v); if (v===5.5) opt.selected=true; sel.appendChild(opt); });
}
let natalSelectedLat=null, natalSelectedLon=null;
const natalPlaceInput = document.getElementById('natalPlace');
const natalLocationResults = document.getElementById('natalLocationResults');
let natalSearchDebounce=null;
natalPlaceInput.addEventListener('input', ()=>{
  const q = natalPlaceInput.value.trim();
  natalSelectedLat=null; natalSelectedLon=null;
  clearTimeout(natalSearchDebounce);
  if (q.length<3){ natalLocationResults.classList.remove('open'); return; }
  natalSearchDebounce = setTimeout(async ()=>{
    try{
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(q)}`, { headers:{'Accept-Language':'en'} });
      const data = await res.json();
      natalLocationResults.innerHTML = "";
      data.forEach(r=>{
        const div = document.createElement('div');
        div.className = 'location-item-mini';
        div.textContent = r.display_name;
        div.addEventListener('click', ()=>{
          natalPlaceInput.value = r.display_name;
          natalSelectedLat = parseFloat(r.lat); natalSelectedLon = parseFloat(r.lon);
          natalLocationResults.classList.remove('open');
          let est = Math.round((natalSelectedLon/15)*4)/4;
          let closest = TZ_OPTIONS.reduce((a,b)=> Math.abs(b-est)<Math.abs(a-est)?b:a);
          [...document.getElementById('natalTz').options].forEach(o=>{ if (parseFloat(o.value)===closest) o.selected=true; });
        });
        natalLocationResults.appendChild(div);
      });
      if (data.length) natalLocationResults.classList.add('open');
    }catch(e){ /* silent - user can still submit if coordinates already chosen */ }
  }, 400);
});
document.addEventListener('click',(e)=>{ if (!e.target.closest('.location-wrap-mini')) natalLocationResults.classList.remove('open'); });
try{ if (window.parent && window.parent!==window && window.parent.LocPicker) window.parent.LocPicker.attach(document, natalPlaceInput, r=>{
  natalPlaceInput.value = r.display_name; natalSelectedLat = parseFloat(r.lat); natalSelectedLon = parseFloat(r.lon);
  natalLocationResults.classList.remove('open');
  const est = Math.round((natalSelectedLon/15)*4)/4, closest = TZ_OPTIONS.reduce((a,b)=> Math.abs(b-est)<Math.abs(a-est)?b:a);
  [...document.getElementById('natalTz').options].forEach(o=>{ o.selected = (parseFloat(o.value)===closest); });
}, {title:'Place of birth', get:()=> natalSelectedLat!=null ? {lat:natalSelectedLat, lon:natalSelectedLon} : null}); }catch(e){}

/* Date of birth: Day / Month / Year + AD/BC (years 4713 BC to 9999 AD; Julian calendar before 15 Oct 1582; 1 BC = year 0 inside).
   Writes the date string into the hidden #natalDob; window.ndCheck is shared with tests. */
(function(){
  const $=id=>document.getElementById(id), MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const greg=(y,m,d)=>y>1582||(y===1582&&(m>10||(m===10&&d>=15)));
  const dim=(y,m)=>{ const lj=((y%4)+4)%4===0, lg=(y%4===0&&y%100!==0)||y%400===0, leap=(y>1582||(y===1582&&m>=10))?lg:lj; return [31,leap?29:28,31,30,31,30,31,31,30,31,30,31][m-1]; };
  window.ndCheck=function(d,m,yN,era){
    if(!(d>=1&&m>=1&&yN>=1)) return {ok:false,empty:true};
    const y=era==='BC'?1-yN:yN;
    if(era==='BC'&&yN>4713) return {ok:false,msg:'The calculations start at 4713 BC.'};
    if(yN>9999) return {ok:false,msg:'The latest year is 9999.'};
    if(y===1582&&m===10&&d>=5&&d<=14) return {ok:false,msg:'These days do not exist: the calendar jumped from 4 to 15 October 1582.'};
    if(d>dim(y,m)) return {ok:false,msg:MN[m-1]+' '+(era==='BC'?yN+' BC':yN)+' has only '+dim(y,m)+' days'+(greg(y,m,d)?'':' (old Julian calendar)')+'.'};
    return {ok:true,y,str:formatDobStr(y,m,d),julian:!greg(y,m,d)};
  };
  function refresh(){
    const c=ndCheck(+$('ndDay').value,+$('ndMon').value,+$('ndYear').value,$('ndEra').value), n=$('ndNote'), L=[];
    $('natalDob').value=c.ok?c.str:'';
    if(c.ok){
      if(c.julian) L.push('📜 Read in the Julian calendar, the one used then.');
      if(c.y<1000||c.y>3000) L.push('⚠️ Approximate: the planet maths is built for modern dates.');
      if(c.y<1900) L.push('🕰️ Before about 1900 use local sun time for the timezone.');
    } else if(c.msg) L.push(c.msg);
    n.textContent=L.join(' '); n.classList.toggle('bad',!c.ok&&!!c.msg);
  }
  ['ndDay','ndMon','ndYear','ndEra'].forEach(i=>{ $(i).addEventListener('input',refresh); $(i).addEventListener('change',refresh); });
  window.ndSet=function(dob){ const [y,m,d]=parseDob(dob); if(!isFinite(y)) return; $('ndDay').value=d; $('ndMon').value=m; $('ndEra').value=y<=0?'BC':'AD'; $('ndYear').value=y<=0?1-y:y; refresh(); };
})();
document.getElementById('natalForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = document.getElementById('natalName').value.trim();
  const dob = document.getElementById('natalDob').value;
  const tob = document.getElementById('natalTob').value;
  const tz = parseFloat(document.getElementById('natalTz').value);
  if (!name || !dob || !tob || natalSelectedLat===null){
    alert(document.getElementById('ndNote').classList.contains('bad') ? document.getElementById('ndNote').textContent : "Please fill all fields and select a place from the location suggestions.");
    return;
  }
  const profile = { name, dob, tob, tz, lat:natalSelectedLat, lon:natalSelectedLon, place:natalPlaceInput.value, savedAt:Date.now() };
  const profiles = loadNatalProfiles();
  profiles.push(profile);
  saveNatalProfiles(profiles);
  refreshProfileSelect();
  document.getElementById('profileSelect').value = profiles.length-1;
  activeNatalProfile = profile;
  renderNatalTab();
});
document.getElementById('clearNatalBtn').addEventListener('click', ()=>{
  activeNatalProfile = null;
  document.getElementById('profileSelect').value = "";
  renderNatalTab();
});
document.getElementById('profileSelect').addEventListener('change', (e)=>{
  const idx = e.target.value;
  if (idx===""){ activeNatalProfile=null; renderNatalTab(); return; }
  const profiles = loadNatalProfiles();
  activeNatalProfile = isValidProfile(profiles[idx]) ? profiles[idx] : null;
  if (!activeNatalProfile) alert('This saved profile is incomplete. Please re-enter its birth details.');
  renderNatalTab();
});
document.getElementById('newProfileMiniBtn').addEventListener('click', ()=>{
  document.querySelectorAll('.panel-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.panel-section').forEach(s=>s.classList.remove('active'));
  document.querySelector('[data-tab="natal"]').classList.add('active');
  document.getElementById('tab-natal').classList.add('active');
  document.getElementById('natalForm').reset();
  natalSelectedLat=null; natalSelectedLon=null;
});


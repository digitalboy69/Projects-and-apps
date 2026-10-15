/* ============================================================================
   UI & DOM LOGIC
   ============================================================================ */
const TZ_OPTIONS = [-12,-11,-10,-9.5,-9,-8,-7,-6,-5,-4.5,-4,-3.5,-3,-2,-1,0,1,2,3,3.5,4,4.5,5,5.5,5.75,6,6.5,7,8,8.75,9,9.5,10,10.5,11,12,12.75,13,14];
function fmtTz(v){
  const sign = v>=0?"+":"-";
  const abs = Math.abs(v);
  const h = Math.floor(abs);
  const m = Math.round((abs-h)*60);
  return `UTC${sign}${h}${m?":"+String(m).padStart(2,"0"):":00"}`;
}
function populateTz(){
  const sel = document.getElementById('tzInput');
  sel.innerHTML = "";
  TZ_OPTIONS.forEach(v=>{
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = fmtTz(v);
    if (v===5.5) opt.selected = true;
    sel.appendChild(opt);
  });
}

let selectedLat=null, selectedLon=null, tzAutoGuess=null;
let searchDebounce=null;
const placeInput = document.getElementById('placeInput');
const locationResults = document.getElementById('locationResults');
const locationStatus = document.getElementById('locationStatus');
const coordReadout = document.getElementById('coordReadout');

placeInput.addEventListener('input', ()=>{
  const q = placeInput.value.trim();
  selectedLat = null; selectedLon = null;
  coordReadout.textContent = "— not yet selected —";
  clearTimeout(searchDebounce);
  if (q.length < 3){ locationResults.classList.remove('open'); locationResults.innerHTML=""; return; }
  locationStatus.textContent = "Searching…";
  // Increased debounce to 1000ms to enforce 1 req/sec limit
  searchDebounce = setTimeout(()=> doLocationSearch(q), 1000);
});

async function doLocationSearch(q){
  try{
    const appEmail = "contact@yourdomain.com"; // Replace with your actual email
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=7&q=${encodeURIComponent(q)}&email=${appEmail}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    renderLocationResults(data);
    locationStatus.textContent = data.length ? "" : "No matches found — try a broader search";
  } catch(err){
    locationStatus.textContent = "Location search unavailable right now — you can still enter coordinates manually below.";
    locationResults.classList.remove('open');
  }
}

function renderLocationResults(results){
  locationResults.innerHTML = "";
  if (!results.length){ locationResults.classList.remove('open'); return; }
  results.forEach(r=>{
    const div = document.createElement('div');
    div.className = 'location-item';
    const main = r.display_name.split(',')[0];
    div.innerHTML = `<span class="lname">${main}</span><span class="lsub">${r.display_name}</span>`;
    div.addEventListener('click', ()=> selectLocation(r));
    locationResults.appendChild(div);
  });
  locationResults.classList.add('open');
}

function selectLocation(r){
  placeInput.value = r.display_name;
  selectedLat = parseFloat(r.lat);
  selectedLon = parseFloat(r.lon);
  coordReadout.textContent = `${selectedLat.toFixed(4)}°, ${selectedLon.toFixed(4)}°`;
  locationResults.classList.remove('open');
  locationStatus.textContent = "";
  guessTimezone(selectedLat, selectedLon, r);
}


/* Map + coordinates pickers (shared popup hosted by the outer page) */
try{ if (window.parent && window.parent!==window && window.parent.LocPicker) window.parent.LocPicker.attach(document, placeInput, r=>selectLocation(r), {title:'Place of birth', get:()=> selectedLat!=null ? {lat:selectedLat, lon:selectedLon} : null}); }catch(e){}

/* Accurate timezone guess: country rule first (fixes +5:30 India etc.), then longitude */
const TZ_BY_COUNTRY={in:5.5,lk:5.5,np:5.75,ir:3.5,af:4.5,mm:6.5,bd:6,pk:5,bt:6,mv:5,uz:5,cn:8,sg:8,my:8,ph:8,hk:8,tw:8,kr:9,jp:9,th:7,vn:7,kh:7,la:7,nz:12,ae:4,om:4,sa:3,qa:3,kw:3,bh:3,ye:3,iq:3,tr:3,eg:2,ke:3,et:3,tz:3,ug:3,za:2,ng:1,gh:0,gb:0,ie:0,pt:0,is:0};
function estimateTz(lat, lon, r){
  const cc = r && r.address && r.address.country_code ? r.address.country_code.toLowerCase() : '';
  let tz;
  if (cc === 'au') tz = lon < 129 ? 8 : (lon < 138 ? 9.5 : 10);
  else if (cc in TZ_BY_COUNTRY) tz = TZ_BY_COUNTRY[cc];
  else tz = Math.round(lon/15);           // whole hours only; no more half-hour rounding errors
  return TZ_OPTIONS.reduce((a,b)=> Math.abs(b-tz)<Math.abs(a-tz)?b:a);
}
function setTzSelect(sel, v){ [...sel.options].forEach(o=>{ o.selected = (parseFloat(o.value)===v); }); }
function guessTimezone(lat, lon, r){
  const closest = estimateTz(lat, lon, r);
  setTzSelect(document.getElementById('tzInput'), closest);
  document.getElementById('tzHint').textContent = `Estimated from longitude — please verify against local records`;
}

document.addEventListener('click', (e)=>{
  if (!e.target.closest('.location-wrap')) locationResults.classList.remove('open');
});

const STORAGE_KEY = 'Vedic Astrology_profiles_v1';
function loadProfiles(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }catch(e){ return []; } }
function saveProfiles(list){ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
function refreshProfileSelect(){
  const profiles = loadProfiles();
  const sel = document.getElementById('profileSelect');
  const currentVal = sel.value;
  sel.innerHTML = '<option value="">— Select a profile —</option>';
  profiles.forEach((p,i)=>{
    const opt = document.createElement('option');
    opt.value = i; opt.textContent = p.name;
    sel.appendChild(opt);
  });
  if (currentVal) sel.value = currentVal;
}

let currentChartForModal = null; 
let currentProfileForExport = null; 


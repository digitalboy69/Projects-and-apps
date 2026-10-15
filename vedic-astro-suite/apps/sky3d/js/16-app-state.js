/* ============================================================================
   APP STATE
   ============================================================================ */
let currentJD = toJulianDay(new Date().getUTCFullYear(), new Date().getUTCMonth()+1, new Date().getUTCDate(), new Date().getUTCHours(), new Date().getUTCMinutes(), 0);
let isPlaying = false;
let playSpeedDaysPerSec = 7;
let lastFrameTime = null;
let timelineWindowStart, timelineWindowEnd; // JD bounds shown on scrubber
let activeNatalProfile = null; // {name,dob,tob,lat,lon,tz}
function isValidProfile(p){ return !!p && typeof p.dob==='string' && p.dob.includes('-') && typeof p.tob==='string' && p.tob.includes(':') && isFinite(p.tz) && isFinite(p.lat) && isFinite(p.lon); }
let transitFilterSet = new Set(["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"]);

function initTimelineWindow(){
  timelineWindowStart = currentJD - 30;
  timelineWindowEnd = currentJD + 365;
}

/* ---- Date formatting ---- */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function formatHudDate(jd){
  const d = jdToDate(jd);
  // Replaced UTC getters with local browser timezone getters
  return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function formatHudTime(jd){
  const d = jdToDate(jd);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; 
}
function formatFullDate(jd){
  const d = jdToDate(jd);
  return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}


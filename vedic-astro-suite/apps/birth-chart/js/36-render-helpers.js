/* ============================================================================
   RENDERING
   ============================================================================ */
function formatDeg(d){
  const deg = Math.floor(d);
  const minFloat = (d-deg)*60;
  const min = Math.floor(minFloat);
  const sec = Math.round((minFloat-min)*60);
  return `${deg}°${String(min).padStart(2,'0')}'${String(sec).padStart(2,'0')}"`;
}

const DASHA_PLANET_COLORS = {
  Ketu:"#8A6FB8", Venus:"#D4AF37", Sun:"#E0A64A", Moon:"#C9C3AE",
  Mars:"#C95050", Rahu:"#5B8A9E", Jupiter:"#D9A441", Saturn:"#6B7FA3", Mercury:"#5EC4B7"
};

/* ===== Dasha — 120-year timeline with drill-down navigator (v2) ===== */
const DX_LEVELS = ['Mahadasha','Antardasha','Pratyantar','Sookshma','Prana','Deha'];
const DX_SHORT = ['Maha','Antar','Pratyantar','Sookshma','Prana'];
const DX_ABBR = {Ketu:'Ke',Venus:'Ve',Sun:'Su',Moon:'Mo',Mars:'Ma',Rahu:'Ra',Jupiter:'Ju',Saturn:'Sa',Mercury:'Me'};
let DX = { dasha:null, birth:null, tz:0, mds:[] };
let DXN = { path: [], at: null };

function dxAge(d){ return (d - DX.birth) / (365.25*86400000); }
function dxAgeTxt(a){ return Math.max(0,a).toFixed(a<10?1:0).replace(/\.0$/,''); }
function dxDur(y){ return y>=1 ? (y%1<0.05||y%1>0.95 ? Math.round(y)+'y' : y.toFixed(1)+'y') : (y*12>=1 ? Math.round(y*12)+'mo' : Math.max(1,Math.round(y*365.25))+'d'); }
function dxLocal(d){ return new Date(d.getTime() + DX.tz * 3600000); }
function dxFmt(d, lvl){
  const L = dxLocal(d), mon = PN_MON[L.getUTCMonth()];
  if (lvl <= 1) return `${mon} ${L.getUTCFullYear()}`;
  const base = `${L.getUTCDate()} ${mon} ${L.getUTCFullYear()}`;
  return lvl >= 3 ? `${base}, ${String(L.getUTCHours()).padStart(2,'0')}:${String(L.getUTCMinutes()).padStart(2,'0')}` : base;
}
function dxFull(d){ const L = dxLocal(d); return `${L.getUTCDate()} ${PN_MON[L.getUTCMonth()]} ${L.getUTCFullYear()}, ${String(L.getUTCHours()).padStart(2,'0')}:${String(L.getUTCMinutes()).padStart(2,'0')}`; }
function dxLeft(ms){ const d = ms/86400000; if (d >= 730) return (d/365.25).toFixed(1)+' years'; if (d >= 60) return Math.round(d/30.44)+' months'; if (d >= 2) return Math.round(d)+' days'; const h = ms/3600000; return h >= 2 ? Math.round(h)+' hours' : Math.max(1,Math.round(ms/60000))+' min'; }
function dxStatus(p, now){ return now>=p.endDate ? 'past' : (now>=p.startDate ? 'now' : 'next'); }
function dxPct(p, now){ return Math.max(0,Math.min(100,(now-p.startDate)/(p.endDate-p.startDate)*100)); }
function dxRef(){ return DXN.at || new Date(); }
function dxPill(st){ return st==='now' ? `<span class="dx-pill now">${DXN.at?'Selected':'Now'}</span>` : (st==='next' ? '<span class="dx-pill">Upcoming</span>' : '<span class="dx-pill past">Past</span>'); }
function dxNames(path, lvl){ return path.map(p => (lvl>=3 ? DX_ABBR[p.lord] : p.lord)).join(' › '); }
function dxList(path){ return path.length === 0 ? DX.mds : calculateSubPeriods(path[path.length-1]); }


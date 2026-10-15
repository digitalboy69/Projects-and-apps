
function openExportModal(){
  if (!currentChartForModal || !currentProfileForExport){
    alert('Please generate a chart first before exporting a report.');
    return;
  }
  
  const hint = document.getElementById('exportModalHint'); if (hint) hint.style.color = '';

  document.getElementById('exportModal').classList.add('show');
  updateExportCountLabel();
}
function closeExportModal(){
  document.getElementById('exportModal').classList.remove('show');
}

function buildExportVargaChips(){
  const wrap = document.getElementById('exportVargasChips');
  if (wrap.childElementCount) return;
  Object.keys(VARGAS).forEach(key=>{
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'export-varga-chip selected';
    chip.textContent = key;
    chip.dataset.vargaKey = key;
    chip.addEventListener('click', ()=>{
      if (exportSelectedVargas.has(key)){
        exportSelectedVargas.delete(key);
        chip.classList.remove('selected');
      } else {
        exportSelectedVargas.add(key);
        chip.classList.add('selected');
      }
      updateExportCountLabel();
    });
    wrap.appendChild(chip);
  });
}
buildExportVargaChips();

function updateExportCountLabel(){
  const checks = document.querySelectorAll('.export-section-check');
  const checkedCount = [...checks].filter(c=>c.checked).length;
  document.getElementById('exportCountLabel').textContent = `${checkedCount} of ${checks.length} sections`;
  document.getElementById('exportModalHint').textContent = checkedCount === checks.length ? 'All sections included' : `${checkedCount} section${checkedCount===1?'':'s'} selected`;
  document.getElementById('exportDownloadBtn').disabled = checkedCount === 0;
}

document.getElementById('exportReportBtn').addEventListener('click', openExportModal);
document.getElementById('exportModalClose').addEventListener('click', closeExportModal);
document.getElementById('exportModal').addEventListener('click', (e)=>{
  if (e.target.id === 'exportModal') closeExportModal();
});

document.getElementById('exportSelectAll').addEventListener('change', (e)=>{
  const checked = e.target.checked;
  document.querySelectorAll('.export-section-check').forEach(c=>{ c.checked = checked; });
  updateExportCountLabel();
  document.getElementById('exportVargasGroup').classList.toggle('show', document.getElementById('exportVargasCheck').checked);
  document.getElementById('exportLocationPicker').style.display = document.getElementById('exportLiveSkyCheck').checked ? '' : 'none';
});

document.querySelectorAll('.export-section-check').forEach(cb=>{
  cb.addEventListener('change', ()=>{
    updateExportCountLabel();
    const allChecked = [...document.querySelectorAll('.export-section-check')].every(c=>c.checked);
    document.getElementById('exportSelectAll').checked = allChecked;
    if (cb.dataset.section === 'vargas'){
      document.getElementById('exportVargasGroup').classList.toggle('show', cb.checked);
    }
    if (cb.dataset.section === 'liveSky'){
      document.getElementById('exportLocationPicker').style.display = cb.checked ? '' : 'none';
      if (cb.checked && document.getElementById('exportTzInput').options.length === 0){
        populateTzSelect(document.getElementById('exportTzInput'));
        const browserTzOffset = -new Date().getTimezoneOffset()/60;
        const closest = TZ_OPTIONS.reduce((a,b)=> Math.abs(b-browserTzOffset)<Math.abs(a-browserTzOffset)?b:a);
        [...document.getElementById('exportTzInput').options].forEach(o=>{ if (parseFloat(o.value)===closest) o.selected=true; });
      }
    }
  });
});

document.querySelectorAll('.export-loc-mode-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    exportLocMode = btn.dataset.locMode;
    document.querySelectorAll('.export-loc-mode-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('exportLocSearchMode').style.display = exportLocMode==='search' ? '' : 'none';
    document.getElementById('exportLocCoordsMode').style.display = exportLocMode==='coords' ? '' : 'none';
    exportLat = null; exportLon = null; exportLocationLabel = null;
    document.getElementById('exportLocationStatus').textContent = '';
  });
});

document.getElementById('exportLatInput').addEventListener('input', (e)=>{
  const v = parseFloat(e.target.value);
  if (!isNaN(v) && v>=-90 && v<=90){ exportLat = v; syncExportCoordsStatus(); }
  else { exportLat = null; }
});
document.getElementById('exportLonInput').addEventListener('input', (e)=>{
  const v = parseFloat(e.target.value);
  if (!isNaN(v) && v>=-180 && v<=180){ exportLon = v; syncExportCoordsStatus(); }
  else { exportLon = null; }
});
function syncExportCoordsStatus(){
  if (exportLat !== null && exportLon !== null){
    exportLocationLabel = `${exportLat.toFixed(4)}°, ${exportLon.toFixed(4)}°`;
    document.getElementById('exportLocationStatus').textContent = `Using manual coordinates: ${exportLocationLabel}`;
  }
}

const exportPlaceInput = document.getElementById('exportPlaceInput');
const exportLocationResultsEl = document.getElementById('exportLocationResults');
let exportSearchDebounce = null;
try{ if (window.parent && window.parent!==window && window.parent.LocPicker) window.parent.LocPicker.attach(document, exportPlaceInput, r=>{
  exportPlaceInput.value = r.display_name; exportLat = parseFloat(r.lat); exportLon = parseFloat(r.lon); exportLocationLabel = r.display_name;
  exportLocationResultsEl.classList.remove('open');
  document.getElementById('exportLocationStatus').textContent = (r.source==='coords' ? 'Using coordinates: ' : 'Selected: ') + r.display_name;
  setTzSelect(document.getElementById('exportTzInput'), estimateTz(exportLat, exportLon, r));
}, {title:'Location for export', get:()=> exportLat!=null ? {lat:exportLat, lon:exportLon} : null}); }catch(e){}
exportPlaceInput.addEventListener('input', ()=>{
  const q = exportPlaceInput.value.trim();
  exportLat = null; exportLon = null; exportLocationLabel = null;
  clearTimeout(exportSearchDebounce);
  if (q.length<3){ exportLocationResultsEl.classList.remove('open'); return; }
  exportSearchDebounce = setTimeout(async ()=>{
        try{
          const appEmail = "contact@yourdomain.com"; // Replace with your actual email
          const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(q)}&email=${appEmail}`;
          const res = await fetch(url, { headers:{'Accept-Language':'en'} });
          const data = await res.json();
          exportLocationResultsEl.innerHTML = "";
          data.forEach(r=>{
            const div = document.createElement('div');
            div.className = 'location-item';
            const main = r.display_name.split(',')[0];
            div.innerHTML = `<span class="lname">${main}</span><span class="lsub">${r.display_name}</span>`;
            div.addEventListener('click', ()=>{
              exportPlaceInput.value = r.display_name;
              exportLat = parseFloat(r.lat); exportLon = parseFloat(r.lon);
              exportLocationLabel = r.display_name;
              exportLocationResultsEl.classList.remove('open');
              document.getElementById('exportLocationStatus').textContent = `Selected: ${r.display_name}`;
              const tzSel = document.getElementById('exportTzInput');
              setTzSelect(tzSel, estimateTz(exportLat, exportLon, r));
            });
            exportLocationResultsEl.appendChild(div);
          });
          if (data.length) exportLocationResultsEl.classList.add('open');
        }catch(e){ }
      }, 1000); // 1000ms delay to enforce 1 req/sec limit
});
document.addEventListener('click', (e)=>{
  if (!e.target.closest('#exportLocSearchMode .location-wrap')) exportLocationResultsEl.classList.remove('open');
});

function collectExportText(){
  const sections = {};
  document.querySelectorAll('.export-section-check').forEach(c=>{ sections[c.dataset.section] = c.checked; });
  sections.vargaKeys = [...exportSelectedVargas];
  let liveSkyData = null;
  if (sections.liveSky){
    if (exportLat === null || exportLon === null){
      alert('Please select a location or enter coordinates for the Live Sky section, or untick it.');
      return null;
    }
    const tz = parseFloat(document.getElementById('exportTzInput').value || '0');
    const sky = computeLiveSky(exportLat, exportLon, currentChartForModal.ascendant.sign);
    liveSkyData = { sky, lat: exportLat, lon: exportLon, tz, locationLabel: exportLocationLabel };
  }
  return buildFullReportText(currentChartForModal, currentProfileForExport, sections, liveSkyData);
}
function exportFlash(msg, ok){
  const hint = document.getElementById('exportModalHint');
  hint.textContent = msg; hint.style.color = ok ? 'var(--teal-bright)' : '#E07070';
  setTimeout(()=>{ hint.style.color=''; updateExportCountLabel(); }, 2500);
}
document.getElementById('exportDownloadBtn').addEventListener('click', ()=>{
  const text = collectExportText(); if (text === null) return;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const safeName = (currentProfileForExport.name || 'chart').replace(/[^a-z0-9]/gi, '_');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `${safeName}_vedic_chart.txt`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
  exportFlash('✓ File downloaded', true);
});
document.getElementById('exportCopyBtn').addEventListener('click', async ()=>{
  const text = collectExportText(); if (text === null) return;
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch(e){}
  if (!ok){
    try{
      const ta = document.createElement('textarea'); ta.value = text;
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      ok = document.execCommand('copy'); document.body.removeChild(ta);
    }catch(e){}
  }
  exportFlash(ok ? '✓ Copied to clipboard' : 'Could not copy — use Download file instead', ok);
});


/* ---------- Check any date & time: all 5 levels ---------- */
function dxLadderHtml(at){
  const act = findActiveDasha(DX.dasha.mahadashas, at);
  if (!act) return '<div class="pl-empty">That moment is outside this chart’s Vimshottari cycle (before birth or beyond the calculated range).</div>';
  const lv = [act.mahadasha, act.antardasha, act.pratyantardasha, act.sookshmaDasha, act.pranaDasha];
  const path = [];
  const cards = lv.map((p,i) => {
    if (!p) return '';
    path.push(p); const c = DASHA_PLANET_COLORS[p.lord], pct = dxPct(p, at);
    return `<div class="dx-lv" style="--pc:${c}">
      <div class="dx-lv-top"><span class="dx-lv-n">${i+1}</span><small>${DX_LEVELS[i]}</small></div>
      <div class="dx-lv-main"><span class="dx-dot" style="background:${c}">${PLANET_GLYPHS[p.lord]}</span><b>${p.lord}</b></div>
      ${i>0 ? `<div class="dx-lv-path">${dxNames(path, i)}</div>` : ''}
      <div class="dx-lv-dates">${dxFull(p.startDate)}<br>→ ${dxFull(p.endDate)}</div>
      <div class="dx-bar"><i style="width:${pct.toFixed(1)}%;background:${c}"></i></div>
      <div class="dx-lv-foot"><span>${pct.toFixed(0)}% through</span><span>${dxLeft(p.endDate - at)} left</span></div>
    </div>`;
  }).join('');
  DX.chkAct = act;
  return `<div class="dx-lvs">${cards}</div>`;
}
function dxCheckRender(){
  const ds = document.getElementById('dxDate'), ts = document.getElementById('dxTime'), box = document.getElementById('dxChk'); if (!ds || !box || !ds.value) return;
  const [y,m,d] = ds.value.split('-').map(Number), [hh,mm] = (ts.value || '00:00').split(':').map(Number);
  const at = new Date(Date.UTC(y, m-1, d, hh, mm) - DX.tz*3600000);
  DX.chkAt = at; box.innerHTML = dxLadderHtml(at);
}
function dxSetCheck(jd){ const p = jdToLocalParts(jd, DX.tz); document.getElementById('dxDate').value = p.dateStr; document.getElementById('dxTime').value = p.timeStr.slice(0,5); dxCheckRender(); }


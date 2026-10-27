/* ============================================================================
   ASPECT EXPLORER — pick a planet or a sign and see exactly what it aspects
   (outgoing) and, symmetrically, exactly what aspects it (incoming).
   ============================================================================ */
let explorerMode = "planet"; // 'planet' | 'sign'
let explorerTarget = null;   // planet name (string) or sign index (number)
let explorerBuilt = false;

/* The explorer always shows the sky at the time picked in the app (the 3D date), even when a birth profile is loaded.
   The profile only supplies the Lagna so house numbers stay yours. */
function getExplorerContext(){
  const snap = snapshotPositions(currentJD);
  let lagnaLon = 0;
  try { if (isValidProfile(activeNatalProfile)) lagnaLon = computeNatalAscendant(activeNatalProfile).lagnaLon; } catch(e){}
  return { sidereal: snap.sidereal, retro: snap.retro, lagnaLon, label: 'Sky on ' + formatFullDate(currentJD), isNatal:false, jd: currentJD };
}
function renderExplorer(ctx){
  ctx = getExplorerContext();
  if (!explorerBuilt){
    explorerBuilt = true;
    document.querySelectorAll('#explorerModeToggle .cam-mode-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('#explorerModeToggle .cam-mode-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        explorerMode = btn.dataset.mode;
        explorerTarget = null;
        populateExplorerTargetSelect();
        renderExplorerResult(getExplorerContext());
      });
    });
    document.getElementById('explorerTargetSelect').addEventListener('change', (e)=>{
      const v = e.target.value;
      explorerTarget = explorerMode==="sign" ? (v===""?null:parseInt(v,10)) : (v===""?null:v);
      renderExplorerResult(getExplorerContext());
    });
    populateExplorerTargetSelect();
  }
  renderExplorerResult(ctx);
}

function populateExplorerTargetSelect(){
  const sel = document.getElementById('explorerTargetSelect');
  const label = document.getElementById('explorerTargetLabel');
  sel.innerHTML = `<option value="">Select a ${explorerMode}…</option>`;
  if (explorerMode==="planet"){
    label.textContent = "Select a planet";
    PLANET_LIST.forEach(name=>{
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = `${PLANET_GLYPHS[name]} ${name}`;
      sel.appendChild(opt);
    });
  } else {
    label.textContent = "Select a sign";
    SIGNS.forEach((sign,i)=>{
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${sign.symbol} ${sign.name} (${sign.sk})`;
      sel.appendChild(opt);
    });
  }
  sel.value = "";
}

function renderExplorerResult(ctx){
  ctx = getExplorerContext();
  renderExplorerResultInner(ctx);
  const w = document.getElementById('explorerResult');
  if (w && explorerTarget != null) w.insertAdjacentHTML('afterbegin', '<div class="empty-aspects" style="margin-bottom:8px;text-align:left">Showing the sky on <b>' + formatFullDate(ctx.jd) + '</b> (the time selected in the app)</div>');
}
function renderExplorerResultInner(ctx){
  const wrap = document.getElementById('explorerResult');
  if (explorerTarget==null){
    wrap.innerHTML = `<div class="empty-aspects">Pick a ${explorerMode} above to see exactly which ${explorerMode==='planet'?'signs it aspects, and what aspects it back':'planets aspect it, and what its occupants aspect out'}.</div>`;
    return;
  }
  const houseLabel = {3:'3rd', 4:'4th (square)', 5:'5th (trine)', 7:'7th (opposition)', 8:'8th', 9:'9th (trine)', 10:'10th'};

  if (explorerMode==="planet"){
    const name = explorerTarget;
    const r = explorePlanetAspects(ctx.sidereal, name);
    const fromSign = SIGNS[r.fromSign];
    let html = `<div class="expl-hero">
      <span class="glyph" style="color:${PLANET_COLORS[name]}">${PLANET_GLYPHS[name]}</span>
      <div>
        <div class="title">${name}</div>
        <div class="sub">Currently in ${fromSign.symbol} ${fromSign.name} (${fromSign.sk})</div>
      </div>
    </div>`;

    html += `<div class="expl-section-title">${name} aspects these signs</div>`;
    html += r.throwsTo.map(t=>{
      const sign = SIGNS[t.sign];
      const occHtml = t.occupants.length
        ? t.occupants.map(p=>`<b onclick="openPlanetDetail('${p}', chartTabContextJD)">${PLANET_GLYPHS[p]} ${p}</b>`).join(', ')
        : `<span style="color:var(--text-faint); font-style:italic;">empty right now</span>`;
      return `<div class="expl-row">
        <span class="glyph">${sign.symbol}</span>
        <span class="desc"><b onclick="selectWheelSign(${t.sign})">${sign.name}</b> — ${occHtml}</span>
        <span class="tag">${houseLabel[t.houseOffset]||t.houseOffset+'th'}</span>
      </div>`;
    }).join('') || `<div class="empty-aspects">No outgoing aspects.</div>`;

    html += `<div class="expl-section-title">${name} is aspected by</div>`;
    html += r.receivesFrom.length ? r.receivesFrom.map(inc=>{
      return `<div class="expl-row">
        <span class="glyph" style="color:${PLANET_COLORS[inc.from]}">${PLANET_GLYPHS[inc.from]}</span>
        <span class="desc"><b onclick="openPlanetDetail('${inc.from}', chartTabContextJD)">${inc.from}</b> aspects ${name}'s sign</span>
        <span class="tag">${houseLabel[inc.houseOffset]||inc.houseOffset+'th'}</span>
      </div>`;
    }).join('') : `<div class="empty-aspects">No planet currently aspects ${name}.</div>`;

    wrap.innerHTML = html;
    return;
  }

  // explorerMode === "sign"
  const signIdx = explorerTarget;
  const sign = SIGNS[signIdx];
  const r = exploreSignAspects(ctx.sidereal, signIdx);
  let html = `<div class="expl-hero">
    <span class="glyph">${sign.symbol}</span>
    <div>
      <div class="title">${sign.name} <span style="color:var(--text-faint); font-weight:400;">(${sign.sk})</span></div>
      <div class="sub">Ruled by ${sign.lord}${r.occupants.length? ' · '+r.occupants.length+' planet'+(r.occupants.length===1?'':'s')+' here':''}</div>
    </div>
  </div>`;

  html += `<div class="expl-section-title">${sign.name} is aspected by</div>`;
  html += r.aspectedBy.length ? r.aspectedBy.map(a=>{
    const fs = SIGNS[a.fromSign];
    return `<div class="expl-row">
      <span class="glyph" style="color:${PLANET_COLORS[a.from]}">${PLANET_GLYPHS[a.from]}</span>
      <span class="desc"><b onclick="openPlanetDetail('${a.from}', chartTabContextJD)">${a.from}</b> from ${fs.symbol} ${fs.name}</span>
      <span class="tag">${houseLabel[a.houseOffset]||a.houseOffset+'th'}</span>
    </div>`;
  }).join('') : `<div class="empty-aspects">No planet currently aspects ${sign.name}.</div>`;

  html += `<div class="expl-section-title">Planets in ${sign.name} aspect out to</div>`;
  if (!r.occupants.length){
    html += `<div class="empty-aspects">No planets are currently in ${sign.name}.</div>`;
  } else {
    html += r.occupantsThrow.map(o=>{
      const rows = o.targets.map(t=>{
        const ts = SIGNS[t.sign];
        return `<div class="expl-row">
          <span class="glyph" style="color:${PLANET_COLORS[o.planet]}">${PLANET_GLYPHS[o.planet]}</span>
          <span class="desc"><b onclick="openPlanetDetail('${o.planet}', chartTabContextJD)">${o.planet}</b> aspects <b onclick="selectWheelSign(${t.sign})">${ts.symbol} ${ts.name}</b></span>
          <span class="tag">${houseLabel[t.houseOffset]||t.houseOffset+'th'}</span>
        </div>`;
      }).join('');
      return rows;
    }).join('');
  }

  wrap.innerHTML = html;
}


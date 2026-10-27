
function renderResults(profile){
  window.__vgProf = profile;
  const chart = computeChart(profile.dob, profile.tob, profile.lat, profile.lon, profile.tz);
  currentChartForModal = chart;
  currentProfileForExport = profile;
  const results = document.getElementById('results');

  const ascSign = SIGNS[chart.ascendant.sign];
  const moonSign = SIGNS[chart.planets.Moon.sign];
  const sunSign = SIGNS[chart.planets.Sun.sign];
  const moonNak = chart.planets.Moon.nakshatra;

  let html = "";

  html += `<div class="app-panel active" id="panel-overview">`;
  html += buildOverviewPanel(chart, profile);
  html += `</div>`;

  html += `<div class="app-panel" id="panel-dasha">`;
  html += buildDashaSection(chart, profile);
  html += `</div>`;

  html += `<div class="app-panel" id="panel-yogas">`;
  html += buildYogaSection(chart);
  html += `</div>`;

  html += `<div class="app-panel" id="panel-transit">`;
  html += `
  <div class="section-heading"><h3>Gochara — Live Transit Comparison</h3><div class="rule"></div></div>
  <div class="transit-live-card" id="transitLiveCard">
    <div class="transit-live-intro">
      Compare real-time planetary positions against this natal chart. Enter where you are right now (it doesn't need to match the birth place) to see which natal house each transiting planet currently occupies.
    </div>
    <form id="transitLocationForm" class="transit-location-form">
      <div class="field location-wrap" style="flex:1;">
        <label for="transitPlaceInput">Current Location</label>
        <input type="text" id="transitPlaceInput" placeholder="Start typing a city…" autocomplete="off">
        <div class="location-results" id="transitLocationResults"></div>
      </div>
      <div class="field" style="max-width:200px;">
        <label for="transitTzInput">Timezone (UTC)</label>
        <select id="transitTzInput"></select>
      </div>
      <button type="submit" class="btn btn-primary" style="align-self:flex-end;">Check Live Transits</button>
    </form>
    <div id="transitLiveResults"></div>
  </div>`;
  html += `</div>`;

  html += `<div class="app-panel" id="panel-rectification">`;
  html += `
  <div class="section-heading"><h3>Birth Time Rectification</h3><div class="rule"></div><span class="section-sub">Dial in any time and calculate the complete chart</span></div>
  <div class="rect-panel-card">
    <p class="rect-intro">
      Dial the exact date and time with the Hour · Minute · Second controls below, then hit
      <strong>Calculate Full Chart</strong> to recompute the <strong>entire chart</strong> — every
      tab (Overview, Dasha, Yogas, Ashtakavarga, Shadbala, Planets, Divisions D1–D144, Lagnas) —
      exactly like generating a fresh chart, for that exact instant. You'll be taken straight to
      Overview to see it. Nothing is saved to your stored profile unless you choose to apply it —
      come back to Rectify any time to dial a different second and recalculate again.
    </p>

    <div class="rect-time-dial-card">
      <div class="rect-field" style="max-width:220px; margin-bottom:16px;">
        <label for="rectDate">Date</label>
        <input type="date" id="rectDate" value="${profile.dob}">
      </div>
      <div class="hms-stepper-row" id="rectHmsRow">
        <div class="hms-unit">
          <div class="hms-unit-controls">
            <button type="button" class="hms-btn" data-unit="h" data-dir="-1">◀</button>
            <div class="hms-value" id="rectHmsH">00</div>
            <button type="button" class="hms-btn" data-unit="h" data-dir="1">▶</button>
          </div>
          <span class="hms-unit-label">Hour</span>
        </div>
        <div class="hms-sep">:</div>
        <div class="hms-unit">
          <div class="hms-unit-controls">
            <button type="button" class="hms-btn" data-unit="m" data-dir="-1">◀</button>
            <div class="hms-value" id="rectHmsM">00</div>
            <button type="button" class="hms-btn" data-unit="m" data-dir="1">▶</button>
          </div>
          <span class="hms-unit-label">Minute</span>
        </div>
        <div class="hms-sep">:</div>
        <div class="hms-unit">
          <div class="hms-unit-controls">
            <button type="button" class="hms-btn" data-unit="s" data-dir="-1">◀</button>
            <div class="hms-value" id="rectHmsS">00</div>
            <button type="button" class="hms-btn" data-unit="s" data-dir="1">▶</button>
          </div>
          <span class="hms-unit-label">Second</span>
        </div>
      </div>
      <div class="hms-hint">Tap to step by one · press and hold to fly through faster</div>
      <input type="hidden" id="rectCenterTime" value="${profile.tob && profile.tob.length===5 ? profile.tob+':00' : profile.tob}">
    </div>

    <div class="rect-action-row">
      <button type="button" class="btn btn-primary rect-fullcalc-btn" id="rectFullCalcBtn">🔬 Calculate Full Chart at This Exact Time</button>
    </div>
    <div id="rectFullChartResults"></div>

    <div class="section-heading" style="margin-top:36px;"><h3 style="font-size:19px;">Second-by-Second Ascendant Scan</h3><div class="rule"></div><span class="section-sub">Narrow down a window, watch D60 &amp; Nakshatra shift</span></div>
    <div class="rect-controls">
      <div class="rect-field">
        <label for="rectWindow">Scan Window (± minutes, centered on the dial above)</label>
        <select id="rectWindow">
          <option value="1">1 min</option>
          <option value="2" selected>2 min</option>
          <option value="5">5 min</option>
          <option value="10">10 min</option>
          <option value="20">20 min</option>
          <option value="30">30 min</option>
        </select>
      </div>
      <div class="rect-field">
        <label for="rectStep">Step Precision</label>
        <select id="rectStep">
          <option value="1" selected>1 second</option>
          <option value="2">2 seconds</option>
          <option value="5">5 seconds</option>
          <option value="10">10 seconds</option>
          <option value="30">30 seconds</option>
        </select>
      </div>
      <button type="button" class="btn btn-ghost rect-scan-btn" id="rectScanBtn">🎯 Run Second-by-Second Scan</button>
    </div>

    <div id="rectResultsWrap"></div>
    <div class="rect-detail" id="rectDetail"></div>
  </div>`;
  html += `</div>`;

  html += `<div class="app-panel" id="panel-transittimer">`;
  html += `
  <div class="section-heading"><h3>Transit Timer</h3><div class="rule"></div><span class="section-sub">When any planet — or the Ascendant — changes house in any D-chart</span></div>
  <div class="tt-panel-card">
    <p class="tt-intro">
      Pick a body and a divisional chart (D1–D144). This finds, using the body's real evaluated
      motion (not a flat average), exactly <strong>when it entered</strong> its current division,
      <strong>when it will move</strong> into the next one, and the live countdown between now
      and then. Retrograde bodies are handled correctly — the countdown reflects them moving
      backward into the previous division, not forward.
    </p>

    <div class="tt-controls">
      <div class="tt-field">
        <label for="ttBody">Body</label>
        <select id="ttBody">
          <option value="Ascendant">🌅 Ascendant (Lagna)</option>
          <option value="Sun">☉ Sun</option>
          <option value="Moon">☽ Moon</option>
          <option value="Mars">♂ Mars</option>
          <option value="Mercury">☿ Mercury</option>
          <option value="Jupiter">♃ Jupiter</option>
          <option value="Venus">♀ Venus</option>
          <option value="Saturn">♄ Saturn</option>
          <option value="Rahu">☊ Rahu</option>
          <option value="Ketu">☋ Ketu</option>
        </select>
      </div>
      <div class="tt-field">
        <label for="ttVarga">Divisional Chart</label>
        <select id="ttVarga"></select>
      </div>
      <button type="button" class="btn btn-primary tt-check-btn" id="ttCheckBtn">⏳ Check Transit Timing</button>
    </div>

    <div id="ttResults"></div>
  </div>`;
  html += `</div>`;

  html += `<div class="app-panel" id="panel-sandhi">`;
  html += `
  <div class="section-heading"><h3>Sandhi Table</h3><div class="rule"></div><span class="section-sub">The Ascendant's D1 window, sliced across every varga</span></div>
  <div class="tt-panel-card">
    <p class="tt-intro">
      The D1 Ascendant sign holds for roughly <strong>2 hours</strong> — its real entry and exit
      moment, computed precisely for the loaded profile's birth location. That same window is what
      every divisional chart slices up: D9 into 9 pieces (~13 min each), D60 into 60 (~2 min each),
      and so on. For each chart below: when the <strong>previous</strong> division started, when the
      <strong>current</strong> one started, when the <strong>next</strong> one begins, and time left.
      This is the classic rectification "sandhi" technique — match a known life event to the exact
      slice that was live at that moment.
    </p>
    <div class="rect-action-row">
      <button type="button" class="btn btn-primary rect-fullcalc-btn" id="sandhiCalcBtn">⏱ Calculate Sandhi Table Now</button>
    </div>
    <div id="sandhiResults"></div>
  </div>`;
  html += `</div>`;

  html += `<div class="app-panel" id="panel-vargatimeline">`;
  html += `
  <div class="section-heading"><h3>Varga Timeline</h3><div class="rule"></div><span class="section-sub">Map the birth's D1 Ascendant window across any chart</span></div>
  <div class="tt-panel-card">
    <p class="tt-intro">
      Anchored to the <strong>birth time</strong> from the loaded profile — not live "now". First
      finds exactly when the birth's D1 Ascendant sign started and ended (e.g. Leo rising from
      1:00 to 3:00). Pick a divisional chart and it maps out <strong>every single division</strong>
      inside that entire window in order — for D9, all 9 slices from D1-start to D1-end, each with
      its own start time, end time, and resulting sign — and marks exactly which slice the birth
      moment itself falls into.
    </p>
    <div id="vtBirthInfo"></div>
    <div class="tt-controls" style="margin-top:20px;">
      <div class="tt-field">
        <label for="vtVarga">Divisional Chart</label>
        <select id="vtVarga"></select>
      </div>
      <div class="tt-field"></div>
      <button type="button" class="btn btn-primary tt-check-btn" id="vtMapBtn">🗺️ Map Out Timeline</button>
    </div>
    <div id="vtResults"></div>
  </div>`;
  html += `</div>`;


  html += `<div class="app-panel" id="panel-planets">`;
  html += buildPlanetsPanel(chart);

  if (chart.wars.length){
    html += `<div class="war-note">⚔ Planetary War (Graha Yuddha) detected: ${chart.wars.map(w=>`${w.planetA} vs ${w.planetB} (${w.separation.toFixed(2)}° apart, ${w.winner} wins)`).join('; ')}. Winner determination uses the simplified longitude-based rule; classical texts also weigh ecliptic latitude.</div>`;
  }
  html += `</div>`;

  html += `<div class="app-panel" id="panel-reading">${window.buildReadingPanel(chart)}</div>`;
  html += `<div class="app-panel" id="panel-fate">${window.buildFatePanel(chart, profile)}</div>`;
  html += `<div class="app-panel" id="panel-dashasys">${window.buildDashaSystemsPanel(chart, profile)}</div>`;
  html += `<div class="app-panel" id="panel-sahams">${window.buildSahamPanel(chart)}</div>`;
  html += `<div class="app-panel" id="panel-tithi">${window.buildTithiPraveshPanel(chart, profile)}</div>`;
  html += `<div class="app-panel" id="panel-bhavabala">${window.buildBhavaBalaPanel(chart, profile)}</div>`;
  html += `<div class="app-panel" id="panel-active">${window.buildActivationPanel(chart)}</div>`;
  try { html += `<div class="app-panel" id="panel-yeartimeline">${window.buildYearTimelinePanel(chart, profile)}</div>`; } catch(e) { console.warn('year timeline panel', e); }
  html += `<div class="app-panel" id="panel-ashtakavarga">`;
  html += buildAshtakavargaSection(chart);
  html += `</div>`;

  html += `<div class="app-panel" id="panel-shadbala">`;
  html += buildShadbalaSection(chart);
  html += `</div>`;

  html += `<div class="app-panel" id="panel-relationships">`;
  html += buildRelationshipsSection(chart);
  html += `</div>`;

  const activeDashaNow = findActiveDasha(chart.dashaData.mahadashas, new Date());
  const currentDashaLabel = activeDashaNow
    ? `${activeDashaNow.mahadasha.lord} / ${activeDashaNow.antardasha ? activeDashaNow.antardasha.lord : '—'}`
    : 'Active';

  html += `<div class="app-panel" id="panel-match">`;
  html += buildMatchPanel(chart, profile);
  html += `</div>`;

  html += `<div class="app-panel" id="panel-vbday">`;
  html += buildVedicBirthdayPanel(chart, profile);
  html += `</div>`;

  html += `<div class="app-panel" id="panel-numerology">`;
  html += buildNumerologyPanel(chart, profile);
  html += `</div>`;

  html += `<div class="app-panel" id="panel-bhava">`;
  html += buildBhavaPanel(chart, profile);
  html += `</div>`;

  html += `<div class="app-panel" id="panel-panchanga">`;
  html += buildPanchangaPanel(chart, profile);
  html += `</div>`;

  html += `<div class="app-panel" id="panel-transits">`;
  html += buildTransitsPanel(chart, profile);
  html += `</div>`;

  html += `<div class="app-panel" id="panel-vargas">`;
  html += `
  <div class="section-heading"><h3>Shodasa Varga — Divisional Charts (D1–D144)</h3><div class="rule"></div><span class="section-sub">Interactive chart viewer</span></div>
  
  <div class="varga-toolbar">
    <div class="varga-control-group">
      <span class="varga-control-label">Select Chart:</span>
      <select id="vargaSelect" class="varga-select">`;
  Object.keys(VARGAS).forEach(key => {
    const meta = VARGAS[key];
    html += `<option value="${key}">${key} — ${meta.name} (${meta.full})</option>`;
  });
  html += `  </select>
    </div>

    <div class="varga-control-group">
      <span class="varga-control-label">Outer planets:</span>
      <label class="outer-chk"><input type="checkbox" class="outer-chk-input" ${window.__showOuter!==false?'checked':''}> <span>♅ Uranus · ♆ Neptune · ♇ Pluto</span></label>
    </div>

    <div class="varga-control-group">
      <span class="varga-control-label">Chart Style:</span>
      <div class="varga-style-toggle" id="vargaStyleToggle">
        <button type="button" class="varga-style-btn active" data-style="north"><span>◇</span> North Indian</button>
        <button type="button" class="varga-style-btn" data-style="west"><span>◯</span> Western Wheel</button>
        <button type="button" class="varga-style-btn" data-style="south"><span>▦</span> South Indian</button>
      </div>
    </div>

    <div class="varga-control-group">
      <label class="varga-aspect-toggle-label" for="vargaAspectToggle">
        <input type="checkbox" id="vargaAspectToggle" class="varga-aspect-checkbox">
        <span class="varga-aspect-toggle-track"><span class="varga-aspect-toggle-thumb"></span></span>
        <span class="varga-control-label" style="text-transform:none; font-weight:600;">✦ Show Planetary Aspects (Drishti)</span>
      </label>
    </div>

    <div class="varga-quick-chips">
      <span style="font-size:11px; text-transform:uppercase; color:var(--text-subtle); align-self:center; margin-right:4px;">Quick Jump:</span>`;
  ["D1","D9","D10","D2","D3","D7","D12","D60"].forEach(key => {
    html += `<button type="button" class="varga-chip ${key==='D1'?'active':''}" data-varga-quick="${key}">${key}</button>`;
  });
  html += `</div>
  </div>

  <div class="varga-single-display" id="vargaDisplayContainer">
    <!-- Populated by updateVargaDisplay() -->
  </div>`;
  html += `</div>`; 

  html += `<div class="app-panel" id="panel-lagnas">`;
  html += `
  <div class="section-heading lagna-section-heading">
    <div>
      <h3>Special Lagnas — Alternate Ascendants</h3><div class="rule"></div><span class="section-sub">23 classical lagna points, viewable as full divisional charts</span>
    </div>
    <button type="button" class="chart-dl-btn-single aspect-copy-btn" id="copyAllLagnasBtn"><span>📋</span> Copy All Lagnas</button>
  </div>

  <div class="varga-toolbar">
    <div class="varga-control-group">
      <span class="varga-control-label">Select Lagna:</span>
      <select id="lagnaSelect" class="varga-select">`;
  const lagnaGroupLabels = { core: "Core Ascendants", arudha: "Arudha Padas", karaka: "Karaka-Based", kala: "Time-Based (Kala)" };
  ["core","arudha","karaka","kala"].forEach(group => {
    html += `<optgroup label="${lagnaGroupLabels[group]}">`;
    SPECIAL_LAGNAS_ORDER.filter(k => SPECIAL_LAGNAS_META[k].group === group).forEach(k => {
      const m = SPECIAL_LAGNAS_META[k];
      html += `<option value="${k}">${m.name} (${m.sanskrit})</option>`;
    });
    html += `</optgroup>`;
  });
  html += `  </select>
    </div>

    <div class="varga-control-group">
      <span class="varga-control-label">Divisional Chart:</span>
      <select id="lagnaVargaSelect" class="varga-select">`;
  Object.keys(VARGAS).forEach(key => {
    const meta = VARGAS[key];
    html += `<option value="${key}">${key} — ${meta.name} (${meta.full})</option>`;
  });
  html += `  </select>
    </div>

    <div class="varga-control-group">
      <span class="varga-control-label">Outer planets:</span>
      <label class="outer-chk"><input type="checkbox" class="outer-chk-input" ${window.__showOuter!==false?'checked':''}> <span>♅ Uranus · ♆ Neptune · ♇ Pluto</span></label>
    </div>

    <div class="varga-control-group">
      <span class="varga-control-label">Chart Style:</span>
      <div class="varga-style-toggle" id="lagnaStyleToggle">
        <button type="button" class="varga-style-btn active" data-style="north"><span>◇</span> North Indian</button>
        <button type="button" class="varga-style-btn" data-style="west"><span>◯</span> Western Wheel</button>
        <button type="button" class="varga-style-btn" data-style="south"><span>▦</span> South Indian</button>
      </div>
    </div>

    <div class="varga-control-group">
      <label class="varga-aspect-toggle-label" for="lagnaAspectToggle">
        <input type="checkbox" id="lagnaAspectToggle" class="varga-aspect-checkbox">
        <span class="varga-aspect-toggle-track"><span class="varga-aspect-toggle-thumb"></span></span>
        <span class="varga-control-label" style="text-transform:none; font-weight:600;">✦ Show Planetary Aspects (Drishti)</span>
      </label>
    </div>

    <div class="varga-quick-chips">
      <span style="font-size:11px; text-transform:uppercase; color:var(--text-subtle); align-self:center; margin-right:4px;">Quick Jump:</span>`;
  ["UL_LAGNA","AL","KL","UL","HL","GL","BL","BB","INDU","SL","PAKA"].forEach(key => {
    html += `<button type="button" class="varga-chip ${key==='UL_LAGNA'?'active':''}" data-lagna-quick="${key}">${SPECIAL_LAGNAS_META[key].sanskrit.split(' ')[0].split('/')[0]}</button>`;
  });
  html += `</div>
  </div>

  <div class="lagna-summary-strip" id="lagnaSummaryStrip"></div>

  <div class="varga-single-display" id="lagnaDisplayContainer">
    <!-- Populated by updateLagnaDisplay() -->
  </div>`;
  html += `</div>`;

  results.innerHTML = html;
  results.classList.add('show');
  document.getElementById('appTabbar').classList.add('show');
  document.body.classList.add('app-mode');
  buildHomePanel(typeof profile!=='undefined' && profile ? profile.name : '');
  switchAppTab('panel-home');
  wireRectificationPanel();
  wireTransitTimerPanel();
  wireSandhiPanel();
  wireVargaTimelinePanel();
  try{ initRectStudio(); }catch(e){ console.error('Rect Studio', e); }

  let currentSelectedVarga = 'D1';
  let currentChartStyle = 'north';
  let showAspects = false;

  function updateVargaDisplay() {
    const key = currentSelectedVarga;
    const meta = VARGAS[key];
    const vdata = chart.vargas[key];
    const ascVSign = SIGNS[vdata.ascendantSign];
    const aspectRows = showAspects ? computeVargaAspects(chart, vdata) : null;

    let singleHtml = `<div class="varga-card">
      <div class="varga-card-head">
        <div>
          <div class="varga-card-title">
            <span class="varga-code">${key}</span>
            <span class="varga-name">${meta.name}</span>
          </div>
          <div class="varga-sanskrit">${meta.full}</div>
          <div class="varga-desc">${meta.desc}</div>
        </div>
        <div class="varga-asc-tag">Lagna (Ascendant)<br><strong>${ascVSign.symbol} ${ascVSign.name} (${ascVSign.sk})</strong></div>
      </div>
      <div class="varga-body-full">
        <div class="varga-chart-container">
          <div id="vargaSvgWrapper" style="width:100%; display:flex; justify-content:center;">
            ${buildInteractiveVargaSvg(vdata, meta, currentChartStyle, aspectRows)}
          </div>
          <div style="font-size:11px; color:var(--gold-dim); margin-top:10px; font-family:var(--font-display); letter-spacing:0.05em; text-align:center;">
            ${currentChartStyle === 'north' ? 'North Indian Diamond Chart (Fixed Houses)' : currentChartStyle === 'west' ? 'Western Wheel Chart (360° Circular)' : 'South Indian Square Chart (Fixed Signs)'}${showAspects ? ' · Aspect Lines Shown' : ''}
          </div>
          <div class="chart-download-actions">
            <button type="button" class="chart-dl-btn-single" id="downloadChartBtn" title="Download High-Resolution Chart Image">
              <span>📥</span> Download Chart
            </button>
          </div>
        </div>
        <div class="varga-house-table-wrap">
          <table class="varga-house-table">
            <thead><tr><th>House</th><th>Sign</th><th>Lord</th><th>Occupants</th></tr></thead>
            <tbody>`;
    vdata.houses.forEach(h => {
      const occupantsHtml = h.isEmpty
        ? `<span class="house-empty-tag">Empty</span>`
        : h.planets.map(p => {
            const digClass = p.dignity.status==="Exalted"||p.dignity.status==="OwnSign"||p.dignity.status==="Moolatrikona" ? "dig-good" : p.dignity.status==="Debilitated" ? "dig-bad" : "";
            return `<span class="occupant-chip"><span class="planet-glyph">${PLANET_GLYPHS[p.name]}</span>${p.name}${p.retrograde?'<sup class="retro-tag-sm">R</sup>':''}${key==="RTN"?` <span class="tiny">${chart.planets[p.name].degInSign.toFixed(1)}°</span>`:''}${key==="D1"?` <span class="${digClass} tiny">${p.dignity.status!=="Neutral"&&p.dignity.status!=="Friend"&&p.dignity.status!=="Enemy"?p.dignity.status:''}</span>`:''}</span>`;
          }).join(' ');
      singleHtml += `<tr class="${h.isEmpty?'house-row-empty':''}">
        <td class="house-num-cell">H${h.houseNum}</td>
        <td>${h.signSymbol} ${h.signName} <span class="sign-sk">(${h.signSanskrit})</span></td>
        <td>${h.signLord}</td>
        <td>${occupantsHtml}</td>
      </tr>`;
    });
    singleHtml += `</tbody></table></div>
      </div>
      <div class="varga-footer">
        <span>Harmonic Division: <strong>1/${meta.n} (${meta.n} parts)</strong></span>
        <span><strong>${vdata.houses.filter(h=>!h.isEmpty).length}</strong> of 12 houses occupied</span>
      </div>
      ${typeof VGG!=='undefined' ? VGG.html(key) : ''}
      ${key==="RTN" && typeof buildRtnExtras==='function' ? buildRtnExtras(chart, vdata) : ''}
      ${aspectRows ? buildAspectsTableHtml(aspectRows, 'varga') : ''}
    </div>`;

    document.getElementById('vargaDisplayContainer').innerHTML = singleHtml;

    // Attach Single Chart Download Listener
    const dlBtn = document.getElementById('downloadChartBtn');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        downloadActiveChartImage('png', key, currentChartStyle, profile.name);
      });
    }

    // Attach Aspect Table Copy Listener
    const copyBtn = document.getElementById('vargaCopyAspectTableBtn');
    if (copyBtn && aspectRows) {
      copyBtn.addEventListener('click', () => {
        copyTextToClipboard(aspectRowsToPlainText(aspectRows, key), copyBtn, '<span>📋</span> Copy Table');
      });
    }
  }

  // Initial render of selected chart
  updateVargaDisplay();

  const vargaAspectToggleEl = document.getElementById('vargaAspectToggle');
  if (vargaAspectToggleEl) {
    vargaAspectToggleEl.checked = showAspects;
    vargaAspectToggleEl.addEventListener('change', (e) => {
      showAspects = e.target.checked;
      updateVargaDisplay();
    });
  }

  const vargaSelEl = document.getElementById('vargaSelect');
  if (vargaSelEl) {
    vargaSelEl.addEventListener('change', (e) => {
      currentSelectedVarga = e.target.value;
      document.querySelectorAll('#panel-vargas .varga-chip').forEach(c => {
        c.classList.toggle('active', c.dataset.vargaQuick === currentSelectedVarga);
      });
      updateVargaDisplay();
    });
  }

  document.querySelectorAll('#panel-vargas .varga-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      currentSelectedVarga = chip.dataset.vargaQuick;
      if (vargaSelEl) vargaSelEl.value = currentSelectedVarga;
      document.querySelectorAll('#panel-vargas .varga-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      updateVargaDisplay();
    });
  });

  document.querySelectorAll('#vargaStyleToggle .varga-style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentChartStyle = btn.dataset.style;
      document.querySelectorAll('#vargaStyleToggle .varga-style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateVargaDisplay();
    });
  });

  /* ============================================================================
     SPECIAL LAGNAS TAB LOGIC
     ============================================================================ */
  const specialLagnaSigns = computeAllSpecialLagnaSigns(chart);
  let currentSelectedLagna = 'UL_LAGNA';
  let currentLagnaVarga = 'D1';
  let currentLagnaStyle = 'north';
  let showLagnaAspects = false;

  function buildLagnaSummaryHtml(lagnaKey){
    const meta = SPECIAL_LAGNAS_META[lagnaKey];
    const signIdx = specialLagnaSigns[lagnaKey];
    const sign = SIGNS[signIdx];
    return `<div class="lagna-summary-card">
      <div class="lagna-summary-head">
        <div class="lagna-summary-title">${meta.name} <span class="lagna-summary-sk">(${meta.sanskrit})</span></div>
        <div class="lagna-summary-sign">${sign.symbol} ${sign.name} <span class="sign-sk">(${sign.sk})</span></div>
      </div>
      <div class="lagna-summary-desc">${meta.desc}</div>
    </div>`;
  }

  function updateLagnaDisplay(){
    const lagnaKey = currentSelectedLagna;
    const vargaKey = currentLagnaVarga;
    const meta = VARGAS[vargaKey];
    const lagnaMeta = SPECIAL_LAGNAS_META[lagnaKey];
    const lagnaSignIdx = specialLagnaSigns[lagnaKey];
    const vdata = buildVargaFromLagna(chart, lagnaSignIdx, vargaKey);
    const ascVSign = SIGNS[vdata.ascendantSign];
    const aspectRows = showLagnaAspects ? computeVargaAspects(chart, vdata) : null;

    document.getElementById('lagnaSummaryStrip').innerHTML = buildLagnaSummaryHtml(lagnaKey);

    let singleHtml = `<div class="varga-card">
      <div class="varga-card-head">
        <div>
          <div class="varga-card-title">
            <span class="varga-code">${vargaKey}</span>
            <span class="varga-name">${meta.name}</span>
          </div>
          <div class="varga-sanskrit">${meta.full} — cast from ${lagnaMeta.name}</div>
          <div class="varga-desc">${meta.desc}</div>
        </div>
        <div class="varga-asc-tag">${lagnaMeta.name}<br><strong>${ascVSign.symbol} ${ascVSign.name} (${ascVSign.sk})</strong></div>
      </div>
      <div class="varga-body-full">
        <div class="varga-chart-container">
          <div id="lagnaSvgWrapper" style="width:100%; display:flex; justify-content:center;">
            ${buildInteractiveVargaSvg(vdata, meta, currentLagnaStyle, aspectRows)}
          </div>
          <div style="font-size:11px; color:var(--gold-dim); margin-top:10px; font-family:var(--font-display); letter-spacing:0.05em; text-align:center;">
            ${currentLagnaStyle === 'north' ? 'North Indian Diamond Chart (Fixed Houses)' : currentLagnaStyle === 'west' ? 'Western Wheel Chart (360° Circular)' : 'South Indian Square Chart (Fixed Signs)'}${showLagnaAspects ? ' · Aspect Lines Shown' : ''}
          </div>
          <div class="chart-download-actions">
            <button type="button" class="chart-dl-btn-single" id="downloadLagnaChartBtn" title="Download High-Resolution Chart Image">
              <span>📥</span> Download Chart
            </button>
            <button type="button" class="chart-dl-btn-single chart-dl-btn-secondary" id="copyLagnaChartBtn" title="Copy this lagna's chart data as text">
              <span>📋</span> Copy Current Chart
            </button>
          </div>
        </div>
        <div class="varga-house-table-wrap">
          <table class="varga-house-table">
            <thead><tr><th>House</th><th>Sign</th><th>Lord</th><th>Occupants</th></tr></thead>
            <tbody>`;
    vdata.houses.forEach(h => {
      const occupantsHtml = h.isEmpty
        ? `<span class="house-empty-tag">Empty</span>`
        : h.planets.map(p => {
            const digClass = p.dignity.status==="Exalted"||p.dignity.status==="OwnSign"||p.dignity.status==="Moolatrikona" ? "dig-good" : p.dignity.status==="Debilitated" ? "dig-bad" : "";
            return `<span class="occupant-chip"><span class="planet-glyph">${PLANET_GLYPHS[p.name]}</span>${p.name}${p.retrograde?'<sup class="retro-tag-sm">R</sup>':''}${vargaKey==="D1"?` <span class="${digClass} tiny">${p.dignity.status!=="Neutral"&&p.dignity.status!=="Friend"&&p.dignity.status!=="Enemy"?p.dignity.status:''}</span>`:''}</span>`;
          }).join(' ');
      singleHtml += `<tr class="${h.isEmpty?'house-row-empty':''}">
        <td class="house-num-cell">H${h.houseNum}</td>
        <td>${h.signSymbol} ${h.signName} <span class="sign-sk">(${h.signSanskrit})</span></td>
        <td>${h.signLord}</td>
        <td>${occupantsHtml}</td>
      </tr>`;
    });
    singleHtml += `</tbody></table></div>
      </div>
      <div class="varga-footer">
        <span>Harmonic Division: <strong>1/${meta.n} (${meta.n} parts)</strong></span>
        <span><strong>${vdata.houses.filter(h=>!h.isEmpty).length}</strong> of 12 houses occupied</span>
      </div>
      ${typeof VGG!=='undefined' ? VGG.html(vargaKey) : ''}
      ${aspectRows ? buildAspectsTableHtml(aspectRows, 'lagna') : ''}
    </div>`;

    document.getElementById('lagnaDisplayContainer').innerHTML = singleHtml;

    const dlBtn = document.getElementById('downloadLagnaChartBtn');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        downloadActiveChartImageFromWrapper('lagnaSvgWrapper', 'png', `${lagnaKey}_${vargaKey}`, currentLagnaStyle, profile.name);
      });
    }

    const copyChartBtn = document.getElementById('copyLagnaChartBtn');
    if (copyChartBtn) {
      copyChartBtn.addEventListener('click', () => {
        const text = lagnaChartToPlainText(chart, lagnaKey, vargaKey, vdata, aspectRows);
        copyTextToClipboard(text, copyChartBtn, '<span>📋</span> Copy Current Chart');
      });
    }

    const copyBtn = document.getElementById('lagnaCopyAspectTableBtn');
    if (copyBtn && aspectRows) {
      copyBtn.addEventListener('click', () => {
        copyTextToClipboard(aspectRowsToPlainText(aspectRows, `${lagnaKey} · ${vargaKey}`), copyBtn, '<span>📋</span> Copy Table');
      });
    }
  }

  updateLagnaDisplay();

  const copyAllLagnasBtn = document.getElementById('copyAllLagnasBtn');
  if (copyAllLagnasBtn) {
    copyAllLagnasBtn.addEventListener('click', () => {
      const text = allLagnasToPlainText(chart, specialLagnaSigns, currentLagnaVarga);
      copyTextToClipboard(text, copyAllLagnasBtn, '<span>📋</span> Copy All Lagnas');
    });
  }

  const lagnaSelEl = document.getElementById('lagnaSelect');
  if (lagnaSelEl) {
    lagnaSelEl.addEventListener('change', (e) => {
      currentSelectedLagna = e.target.value;
      document.querySelectorAll('#panel-lagnas .varga-chip').forEach(c => {
        c.classList.toggle('active', c.dataset.lagnaQuick === currentSelectedLagna);
      });
      updateLagnaDisplay();
    });
  }

  const lagnaVargaSelEl = document.getElementById('lagnaVargaSelect');
  if (lagnaVargaSelEl) {
    lagnaVargaSelEl.addEventListener('change', (e) => {
      currentLagnaVarga = e.target.value;
      updateLagnaDisplay();
    });
  }

  document.querySelectorAll('#panel-lagnas .varga-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      currentSelectedLagna = chip.dataset.lagnaQuick;
      if (lagnaSelEl) lagnaSelEl.value = currentSelectedLagna;
      document.querySelectorAll('#panel-lagnas .varga-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      updateLagnaDisplay();
    });
  });

  document.querySelectorAll('#lagnaStyleToggle .varga-style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLagnaStyle = btn.dataset.style;
      document.querySelectorAll('#lagnaStyleToggle .varga-style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateLagnaDisplay();
    });
  });

  const lagnaAspectToggleEl = document.getElementById('lagnaAspectToggle');
  if (lagnaAspectToggleEl) {
    lagnaAspectToggleEl.checked = showLagnaAspects;
    lagnaAspectToggleEl.addEventListener('change', (e) => {
      showLagnaAspects = e.target.checked;
      updateLagnaDisplay();
    });
  }

  setupTransitLiveForm(chart, profile);

  document.querySelectorAll('.dasha-antardasha-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const row = document.getElementById('dasha-ad-'+btn.dataset.dashaIdx);
      const isOpen = row.style.display !== 'none';
      row.style.display = isOpen ? 'none' : '';
      btn.textContent = isOpen ? 'Sub-periods' : 'Hide sub-periods';
    });
  });

  if (!window.__dashaDrillListenerAttached){
    window.__dashaDrillListenerAttached = true;
    document.addEventListener('click', (e)=>{
      const chip = e.target.closest('.dasha-drill-chip');
      if (!chip) return;
      expandDashaLevel(chip.dataset.drillKey, chip.dataset.drillLevel);
    });
  }

  document.querySelectorAll('.dasha-segment').forEach((seg, idx)=>{
    seg.addEventListener('click', ()=>{
      const row = document.getElementById('dasha-ad-'+idx);
      if (!row) return;
      row.style.display = '';
      const toggleBtn = document.querySelector(`.dasha-antardasha-toggle[data-dasha-idx="${idx}"]`);
      if (toggleBtn) toggleBtn.textContent = 'Hide sub-periods';
      row.scrollIntoView({behavior:'smooth', block:'center'});
    });
  });

  document.querySelectorAll('.ashtaka-tab').forEach(tab=>{
    tab.addEventListener('click', ()=>{
      document.querySelectorAll('.ashtaka-tab').forEach(t=>t.classList.remove('active'));
      document.querySelectorAll('.ashtaka-panel').forEach(p=> p.style.display='none');
      tab.classList.add('active');
      document.getElementById('av-panel-'+tab.dataset.avTarget).style.display = '';
    });
  });

  window.scrollTo({top: 0, behavior: 'instant'});
}

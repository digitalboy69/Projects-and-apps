
function setupTransitLiveForm(natalChart, profile){
  populateTzSelect(document.getElementById('transitTzInput'));
  const browserTzOffset = -new Date().getTimezoneOffset()/60;
  const tzSel = document.getElementById('transitTzInput');
  let closest = TZ_OPTIONS.reduce((a,b)=> Math.abs(b-browserTzOffset)<Math.abs(a-browserTzOffset)?b:a);
  [...tzSel.options].forEach(o=>{ if (parseFloat(o.value)===closest) o.selected = true; });

  let transitLat=null, transitLon=null;
  const transitPlaceInput = document.getElementById('transitPlaceInput');
  const transitLocationResults = document.getElementById('transitLocationResults');
  let transitDebounce = null;
  try{ if (window.parent && window.parent!==window && window.parent.LocPicker) window.parent.LocPicker.attach(document, transitPlaceInput, r=>{
    transitPlaceInput.value = r.display_name; transitLat = parseFloat(r.lat); transitLon = parseFloat(r.lon);
    transitLocationResults.classList.remove('open'); setTzSelect(tzSel, estimateTz(transitLat, transitLon, r));
  }, {title:'Where are you now?', get:()=> transitLat!=null ? {lat:transitLat, lon:transitLon} : null}); }catch(e){}

  transitPlaceInput.addEventListener('input', ()=>{
    const q = transitPlaceInput.value.trim();
    transitLat=null; transitLon=null;
    clearTimeout(transitDebounce);
    if (q.length<3){ transitLocationResults.classList.remove('open'); return; }
    transitDebounce = setTimeout(async ()=>{
      try{
        const appEmail = "contact@yourdomain.com"; // Replace with your actual email
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(q)}&email=${appEmail}`;
        const res = await fetch(url, { headers:{'Accept-Language':'en'} });
        const data = await res.json();
        transitLocationResults.innerHTML = "";
        data.forEach(r=>{
          const div = document.createElement('div');
          div.className = 'location-item';
          const main = r.display_name.split(',')[0];
          div.innerHTML = `<span class="lname">${main}</span><span class="lsub">${r.display_name}</span>`;
          div.addEventListener('click', ()=>{
            transitPlaceInput.value = r.display_name;
            transitLat = parseFloat(r.lat); transitLon = parseFloat(r.lon);
            transitLocationResults.classList.remove('open');
            setTzSelect(tzSel, estimateTz(transitLat, transitLon, r));
          });
          transitLocationResults.appendChild(div);
        });
        if (data.length) transitLocationResults.classList.add('open');
      }catch(e){ }
    }, 1000); // 1000ms delay to enforce 1 req/sec limit
  });
  if (!window.__transitDropdownListenerAttached){
    window.__transitDropdownListenerAttached = true;
    document.addEventListener('click', (e)=>{
      const el = document.getElementById('transitLocationResults');
      if (el && !e.target.closest('#transitLocationForm .location-wrap')) el.classList.remove('open');
    });
  }

  document.getElementById('transitLocationForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    if (transitLat===null || transitLon===null){
      alert("Please select your current location from the suggestions list.");
      return;
    }
    const tz = parseFloat(tzSel.value);
    renderLiveTransitComparison(natalChart, profile, transitLat, transitLon, tz);
  });
}

const HOUSE_THEMES = ["Self, body, personality","Wealth, family, speech","Courage, siblings, effort","Home, mother, comfort","Children, intellect, creativity","Health, service, obstacles","Partnership, marriage","Transformation, longevity","Fortune, dharma, father","Career, status, action","Gains, aspirations, community","Loss, expenditure, liberation"];

function computeLiveSky(lat, lon, natalAscSign){
  const now = new Date();
  const jd = toJulianDay(now.getUTCFullYear(), now.getUTCMonth()+1, now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), 0);
  const ayanamsa = lahiriAyanamsa(jd);

  const tropical = {
    Sun: sunLongitude(jd), Moon: moonLongitude(jd),
    Mercury: planetGeocentricLongitude("mercury",jd), Venus: planetGeocentricLongitude("venus",jd),
    Mars: planetGeocentricLongitude("mars",jd), Jupiter: planetGeocentricLongitude("jupiter",jd),
    Saturn: planetGeocentricLongitude("saturn",jd)
  };
  const rahuTropical = rahuLongitude(jd);
  const transitSidereal = {};
  for (const p in tropical) transitSidereal[p] = normDeg(tropical[p]-ayanamsa);
  transitSidereal.Rahu = normDeg(rahuTropical-ayanamsa);
  transitSidereal.Ketu = normDeg(transitSidereal.Rahu+180);
  const transitRetro = {
    Mercury:isRetrograde("mercury",jd), Venus:isRetrograde("venus",jd), Mars:isRetrograde("mars",jd),
    Jupiter:isRetrograde("jupiter",jd), Saturn:isRetrograde("saturn",jd),
    Sun:false, Moon:false, Rahu:true, Ketu:true
  };

  const planets = {};
  PLANET_LIST.forEach(name=>{
    const lonT = transitSidereal[name];
    const signIdx = getSignIndex(lonT);
    const degInSign = getDegInSign(lonT);
    const nak = getNakshatra(lonT);
    const speed = getPlanetSpeed(name, jd);
    let natalHouse = null;
    if (natalAscSign !== null && natalAscSign !== undefined){
      natalHouse = ((signIdx - natalAscSign + 12) % 12) + 1;
    }
    planets[name] = {
      name, sign: signIdx, degInSign, degRemainingInSign: 30-degInSign,
      nakshatra: nak, retrograde: transitRetro[name], speed,
      natalHouse, natalHouseTheme: natalHouse!==null ? HOUSE_THEMES[natalHouse-1] : null
    };
  });

  return { jd, ayanamsa, now, lat, lon, planets };
}

function renderLiveTransitComparison(natalChart, profile, lat, lon, tz){
  const natalAscSign = natalChart.ascendant.sign;
  const sky = computeLiveSky(lat, lon, natalAscSign);

  let html = `<div class="transit-live-meta">Sky as of <span class="mono">${sky.now.toUTCString()}</span> · Observed from your entered location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°) · Local UTC offset ${fmtTz(tz)}</div>
  <div class="planet-table-wrap" style="margin-top:14px;">
    <table class="planet-table">
      <thead><tr><th>Planet</th><th>Transit Sign</th><th>Degree</th><th>Nakshatra</th><th>Speed</th><th>Falls in Natal House</th><th>Natal House Theme</th></tr></thead>
      <tbody>`;

  PLANET_LIST.forEach(name=>{
    const p = sky.planets[name];
    const sign = SIGNS[p.sign];
    html += `<tr>
      <td class="planet-name-cell"><span class="planet-glyph">${PLANET_GLYPHS[name]}</span>${name}${p.retrograde?'<span class="retro-tag">Retro</span>':''}</td>
      <td>${sign.symbol} ${sign.name}</td>
      <td class="mono">${formatDeg(p.degInSign)}</td>
      <td>${p.nakshatra.name} (Pada ${p.nakshatra.pada})</td>
      <td class="mono">${Math.abs(p.speed).toFixed(2)}°/day</td>
      <td><span class="dig-good">House ${p.natalHouse}</span></td>
      <td>${p.natalHouseTheme}</td>
    </tr>`;
  });
  html += `</tbody></table></div>
  <div class="transit-note">This compares today's real sky against the whole-sign houses of the natal chart above — a simplified but classically valid approach to gochara (transit) analysis. Retrograde status is reflected. Refresh the check periodically since positions shift daily (Moon) or over months/years (outer planets).</div>`;

  document.getElementById('transitLiveResults').innerHTML = html;
  window.lastLiveSkyResult = { sky, lat, lon, tz }; 
}

function populateTzSelect(sel){
  sel.innerHTML = "";
  TZ_OPTIONS.forEach(v=>{
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = fmtTz(v);
    if (v===5.5) opt.selected = true;
    sel.appendChild(opt);
  });
}

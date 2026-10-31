/* ===== My Chart / Overview (redesigned) ===== */
const OV_EL_COLORS = {fire:'#E0744A',earth:'#8FB36B',air:'#6FB7D9',water:'#5B7FD6'};
let ovStyle = 'north';
function ovChartSvg(chart){
  try { return buildInteractiveVargaSvg(chart.vargas.D1, VARGAS.D1, ovStyle, null); }
  catch(e){ return '<div class="ov-empty">Chart could not be drawn.</div>'; }
}
function buildOverviewPanel(chart, profile){
  const asc = SIGNS[chart.ascendant.sign], moon = SIGNS[chart.planets.Moon.sign], sun = SIGNS[chart.planets.Sun.sign];
  const moonNak = chart.planets.Moon.nakshatra;
  const initial = escapeHtml((profile.name||'?').trim().charAt(0).toUpperCase());

  // element balance (7 planets + lagna)
  const els = {fire:0,earth:0,air:0,water:0};
  ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'].forEach(n=>{ const e=(SIGNS[chart.planets[n].sign].element||'').toLowerCase(); if(e in els) els[e]++; });
  { const e=(asc.element||'').toLowerCase(); if(e in els) els[e]++; }
  const totEl = Object.values(els).reduce((a,b)=>a+b,0)||1;
  const domEl = Object.keys(els).sort((a,b)=>els[b]-els[a])[0];
  const elBar = Object.keys(els).map(k=>`<i style="width:${els[k]/totEl*100}%;background:${OV_EL_COLORS[k]}" title="${k}: ${els[k]}"></i>`).join('');
  const elLeg = Object.keys(els).map(k=>`<span><i style="background:${OV_EL_COLORS[k]}"></i>${k[0].toUpperCase()+k.slice(1)} ${els[k]}</span>`).join('');

  // planet rows
  const rows = [['Lagna',chart.ascendant,true]].concat(PLANET_LIST.map(n=>[n,chart.planets[n],false])).map(([n,p,isAsc])=>{
    const sg = SIGNS[p.sign], col = isAsc ? '#D4AF37' : (DASHA_PLANET_COLORS[n]||'#888');
    const nak = p.nakshatra ? p.nakshatra.name : '';
    const dig = (!isAsc && p.dignity && p.dignity.label) ? p.dignity.label : '';
    return `<div class="ov-prow" ${isAsc?'':`data-planet-click="${n}"`} style="--pc:${col}">
      <span class="ov-pdot" style="background:${col}">${isAsc?'↑':PLANET_GLYPHS[n]}</span>
      <span class="ov-pname"><b>${n}${p.retrograde?' <em>℞</em>':''}</b><small>${nak}</small></span>
      <span class="ov-psign">${sg.symbol} ${sg.name}<small>${formatDeg(p.degInSign)}</small></span>
      <span class="ov-phouse">${isAsc?'H1':'H'+p.house}${dig?`<small>${dig}</small>`:''}</span>
    </div>`;
  }).join('');

  const karakas = KARAKA_NAMES.map(name=>{
    const k = chart.charaKarakas[name], prim = name==='Atmakaraka'||name==='Darakaraka', c = DASHA_PLANET_COLORS[k.planet];
    return `<div class="karaka-card ov-kcard ${prim?'karaka-primary':''}" style="--pc:${c}">
      <div class="ov-ktop"><span class="ov-pdot" style="background:${c}">${PLANET_GLYPHS[k.planet]}</span>
      <span><b class="karaka-card-planet-name planet-clickable" data-planet-click="${k.planet}">${k.planet}</b><small>${name}</small></span></div>
      <div class="ov-kdesc">${KARAKA_SIGNIFICANCE[name]}</div><div class="ov-kdeg">${formatDeg(k.degree)} traversed</div></div>`;
  }).join('');

  const big = (label, sg, deg, planet) => `<div class="ov-big">
      <small>${label}</small><div class="ov-sym">${sg.symbol}</div>
      <b ${planet?`class="planet-clickable" data-planet-click="${planet}"`:''}>${sg.name}</b>
      <span>${sg.sk} · Lord ${sg.lord}</span><em>${formatDeg(deg)}</em></div>`;

  return `<div class="ov">
    <div class="ov-hero">
      <div class="ov-av">${initial}</div>
      <div class="ov-id"><h3>${escapeHtml(profile.name)}</h3>
        <div class="ov-chips"><span>📅 ${formatDateHuman(profile.dob)}</span><span>🕒 ${profile.tob}</span><span>📍 ${escapeHtml(profile.place.split(',')[0])}</span><span>🌐 ${fmtTz(profile.tz)}</span></div>
      </div>
    </div>

    <div class="ov-big3">${big('Lagna · Ascendant',asc,chart.ascendant.degInSign,null)}${big('Rashi · Moon sign',moon,chart.planets.Moon.degInSign,'Moon')}${big('Surya · Sun sign',sun,chart.planets.Sun.degInSign,'Sun')}</div>

    <div class="ov-sec"><h5>Birth chart (D1)</h5>
      <div class="ov-chartgrid">
        <div class="ov-chartcard">
          <div class="ov-toggle"><button type="button" class="on" data-ov-style="north">North Indian</button><button type="button" data-ov-style="south">South Indian</button></div>
          <div id="ovChartSvg" class="ov-svg">${ovChartSvg(chart)}</div>
        </div>
        <div class="ov-plist"><div class="ov-plist-h"><span style="width:30px"></span><span>Planet</span><span>Sign</span><span>House</span></div>${rows}</div>
      </div>
    </div>

    <div class="ov-sec"><h5>Moon's nakshatra</h5>
      <div class="ov-nak">
        <div class="ov-nak-main"><span class="ov-sym sm">☽</span><div><b>${moonNak.name}</b><small>Pada ${moonNak.pada} · Janma Nakshatra</small></div></div>
        <div class="ov-nak-grid">
          <div><small>Nakshatra lord</small><b>${moonNak.lord}</b></div>
          <div><small>Ruling deity</small><b>${moonNak.deity}</b></div>
          <div><small>Lagna nakshatra</small><b>${chart.ascendant.nakshatra.name} · ${chart.ascendant.nakshatra.pada}</b></div>
          <div><small>Moon element</small><b>${moon.element} · ${moon.modality}</b></div>
        </div>
      </div>
    </div>

    <div class="ov-sec"><h5>Element balance <span>Mostly ${domEl}</span></h5>
      <div class="ov-elbar">${elBar}</div><div class="ov-ellegend">${elLeg}</div>
    </div>

    <div class="ov-sec"><h5>Chara Karakas <span>Jaimini soul significators · ranked by degree</span></h5>
      <div class="ov-kscroll">${karakas}</div>
    </div>

    <details class="ov-tech"><summary>Calculation details</summary>
      <div class="ov-techgrid"><div><small>Ayanamsa</small><b>${ayanName()} ${chart.ayanamsa.toFixed(4)}°</b></div><div><small>House system</small><b>Whole Sign</b></div>
      <div><small>Coordinates</small><b>${profile.lat.toFixed(2)}°, ${profile.lon.toFixed(2)}°</b></div><div><small>Julian Day (UT)</small><b>${chart.julianDay.toFixed(4)}</b></div></div>
    </details>
  </div>`;
}
document.addEventListener('click',(e)=>{
  const b = e.target.closest('[data-ov-style]'); if(!b || !currentChartForModal) return;
  ovStyle = b.dataset.ovStyle;
  document.querySelectorAll('[data-ov-style]').forEach(x=>x.classList.toggle('on', x===b));
  document.getElementById('ovChartSvg').innerHTML = ovChartSvg(currentChartForModal);
});

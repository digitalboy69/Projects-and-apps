s=open('srcB.html',encoding='utf-8').read()
def rep(o,n,c=1):
    global s
    assert s.count(o)==c,(s.count(o),o[:60]); s=s.replace(o,n)
info=open('outer_info.js',encoding='utf-8').read()
# shared info right after OUTER defs
rep("window.__showOuter = true;","window.__showOuter = true;\n"+info)
# popup
rep("function openPlanetDetail(planetName){\n  if (!currentChartForModal) return;","""function openOuterDetail(name){
  const chart = currentChartForModal, o = chart.outer && chart.outer[name]; if (!o) return;
  pdCurrent = name; const I = OUTER_INFO[name], sign = SIGNS[o.sign], c = OUTER_COL[name];
  const nakSpan = 360/27, nakPct = Math.max(0,Math.min(100,(o.nakshatra.degInNak||0)/nakSpan*100)), degRem = nakSpan - (o.nakshatra.degInNak||0);
  document.getElementById('pdBox').style.setProperty('--pc', c);
  document.getElementById('pdGlyph').textContent = OUTER_GLYPHS[name];
  document.getElementById('pdTitle').textContent = name;
  document.getElementById('pdSubtitle').textContent = `${sign.symbol} ${sign.name} · House ${o.house} · ${I.sk}`;
  document.getElementById('pdPills').innerHTML = [`<span class="pd-pill gold">${I.role}</span>`, `<span class="pd-pill ${o.retrograde?'bad':''}">${o.retrograde?'℞ Retrograde':'Direct motion'}</span>`, '<span class="pd-pill">Outer planet</span>'].join('');
  const k = name.toLowerCase(), l1 = planetGeocentricLongitude(k, chart.julianDay-0.25), l2 = planetGeocentricLongitude(k, chart.julianDay+0.25);
  let dd = l2-l1; if (dd>180) dd-=360; if (dd<-180) dd+=360; const speed = Math.abs(dd*2);
  let h = '';
  h += pdBlock('What it means', `<div class="pd-jsub" style="font-size:13px;line-height:1.6;color:var(--text-main)">${I.about}</div>`);
  h += pdBlock(`In your chart: house ${o.house}`, `<div class="pd-jsub" style="font-size:13px;line-height:1.6;color:var(--text-main)">${outerHouseLine(name, o.house)}</div>`);
  h += pdBlock(`Journey through ${sign.name}`, `<div class="pd-journey"><div class="pd-jtrack"><i style="width:${(o.degInSign/30*100).toFixed(1)}%"></i><u style="left:${(o.degInSign/30*100).toFixed(1)}%"></u></div>
    <div class="pd-jlbl"><span>0°</span><b>${formatDeg(o.degInSign)} travelled</b><span>30°</span></div>
    <div class="pd-jsub">Typical stay in a sign: ${I.perSign}</div></div>`);
  h += `<div class="pd-mini"><div><small>Sign lord</small><b>${sign.lord}</b></div><div><small>House</small><b>${o.house}</b></div><div><small>Daily speed</small><b>${speed.toFixed(3)}°</b></div><div><small>Nakshatra lord</small><b>${o.nakshatra.lord}</b></div></div>`;
  h += pdBlock('Nakshatra', `<div class="pd-nak"><b>${o.nakshatra.name}</b><span>Pada ${o.nakshatra.pada}</span></div><div class="pd-jtrack thin"><i style="width:${nakPct.toFixed(1)}%"></i></div><div class="pd-jsub">${formatDeg(degRem)} remaining in this nakshatra</div>`);
  const tg = PLANET_LIST.map(n=>[n, chart.planets[n].longitude]).concat(OUTER_LIST.map(n=>[n, chart.outer[n].longitude])).concat([['Ascendant', chart.ascendant.longitude]]);
  const asp = outerAspectsTo(o.longitude, tg, name);
  h += pdBlock('Aspects (Western orbs)', asp.length ? asp.map(a=>`<div class="pd-alert"><b>${a.asp.symbol} ${a.asp.name} ${a.target}</b><span>${name} ${a.asp.verb} ${a.target} · ${a.dev.toFixed(1)}° orb</span></div>`).join('') : '<div class="pd-jsub">No close aspects to your planets or Ascendant.</div>');
  h += pdBlock('Key themes', `<div class="pl-achips">${I.themes.map(t=>`<span class="pl-asp">${t}</span>`).join('')}</div>`);
  h += pdBlock('Facts', `<div class="pd-mini" style="grid-template-columns:repeat(2,1fr)">${I.facts.map(f=>`<div><small>${f[0]} ${f[1]}</small><b style="font-size:12.5px">${f[2]}</b></div>`).join('')}</div>`);
  document.getElementById('pdStatGrid').innerHTML = h;
  document.getElementById('pdNote').textContent = OUTER_VEDIC_NOTE;
  document.getElementById('pdStrengthBtn').style.display = 'none';
  document.getElementById('pdBox').scrollTop = 0;
  document.getElementById('planetDetailModal').classList.add('show');
}
function openPlanetDetail(planetName){
  if (!currentChartForModal) return;
  document.getElementById('pdStrengthBtn').style.display = '';
  if (OUTER_LIST.includes(planetName)) return openOuterDetail(planetName);""")
rep("    const i = PLANET_LIST.indexOf(pdCurrent), n = PLANET_LIST.length;\n    openPlanetDetail(PLANET_LIST[(i + parseInt(go.dataset.pdGo) + n) % n]); return;","    const ALLP = PLANET_LIST.concat(OUTER_LIST), i = ALLP.indexOf(pdCurrent), n = ALLP.length;\n    openPlanetDetail(ALLP[(i + parseInt(go.dataset.pdGo) + n) % n]); return;")
# planets panel cards
rep("""    <div class="pl-grid">${cards}</div>
    <div class="pl-empty" id="plEmpty" hidden>No planets match this filter in your chart.</div>""","""    <div class="pl-grid">${cards}</div>
    <div class="pl-empty" id="plEmpty" hidden>No planets match this filter in your chart.</div>
    <div class="pl-sec"><h5>Outer planets <span>Modern · tap for details</span></h5><div class="pl-grid">${outerCards}</div>
      <div class="pl-asplist" style="margin-top:10px">${outerAsp}</div></div>""")
rep("  const asp = PLANET_LIST.map(name=>{\n    const pl = chart.planets[name], c = DASHA_PLANET_COLORS[name]||'#888';","""  const outerCards = OUTER_LIST.map(n=>{
    const o = chart.outer[n], sg = SIGNS[o.sign], c = OUTER_COL[n];
    return `<button type="button" class="pl-card" data-planet-click="${n}" data-flags="outer" style="--pc:${c}">
      <span class="pl-top"><span class="pl-dot" style="background:${c}">${OUTER_GLYPHS[n]}</span>
        <span class="pl-name"><b>${n}${o.retrograde?' <em>℞</em>':''}</b><small>${o.nakshatra.name} · Pada ${o.nakshatra.pada}</small></span>
        <span class="pl-house">H${o.house}</span></span>
      <span class="pl-sign">${sg.symbol} ${sg.name}<em>${formatDeg(o.degInSign)}</em></span>
      <span class="pl-track"><i style="width:${(o.degInSign/30*100).toFixed(1)}%"></i></span>
      <span class="pl-tags"><span class="pl-tag">${OUTER_INFO[n].role}</span></span></button>`;
  }).join('');
  const outerAsp = OUTER_LIST.map(n=>{
    const o = chart.outer[n], tg = PLANET_LIST.map(x=>[x, chart.planets[x].longitude]).concat(OUTER_LIST.map(x=>[x, chart.outer[x].longitude])).concat([['Ascendant', chart.ascendant.longitude]]);
    const a = outerAspectsTo(o.longitude, tg, n).map(r=>`<span class="pl-asp">${r.asp.symbol} ${r.target} ${r.dev.toFixed(1)}°</span>`).join('') || '<span class="pl-asp">no close aspects</span>';
    return `<div class="pl-arow" data-planet-click="${n}"><span class="pl-dot sm" style="background:${OUTER_COL[n]}">${OUTER_GLYPHS[n]}</span><span class="pl-an"><b>${n}</b><small>in House ${o.house}</small></span><span class="pl-achips">${a}</span></div>`;
  }).join('');

  const asp = PLANET_LIST.map(name=>{
    const pl = chart.planets[name], c = DASHA_PLANET_COLORS[name]||'#888';""")
# report
rep("""    subsection('Combustion Status');
    PLANET_LIST.forEach(name=>{
      const p = chart.planets[name];
      if (p.combustion""","""    subsection('Outer Planets (modern; not used in classical Vedic strength or dasha)');
    OUTER_LIST.forEach(n=>{
      const o = chart.outer[n], sg = SIGNS[o.sign];
      add(`${pad(n,10)} ${sg.name} (${sg.sk}), ${formatDeg(o.degInSign)}  |  House ${o.house}${o.retrograde ? '  |  RETROGRADE' : ''}  |  Nakshatra: ${o.nakshatra.name}, Pada ${o.nakshatra.pada}  |  Absolute sidereal longitude: ${formatDeg(normDeg(o.longitude))}`);
      add(`${pad('',10)} Themes: ${OUTER_INFO[n].themes.slice(0,4).join(', ')}  |  ${outerHouseLine(n, o.house)}`);
      const tg = PLANET_LIST.map(x=>[x, chart.planets[x].longitude]).concat(OUTER_LIST.map(x=>[x, chart.outer[x].longitude])).concat([['Ascendant', chart.ascendant.longitude]]);
      const a = outerAspectsTo(o.longitude, tg, n);
      add(`${pad('',10)} Western aspects: ${a.length ? a.map(r=>`${r.asp.name} ${r.target} (${r.dev.toFixed(1)}° orb)`).join('; ') : 'none within orb'}`);
    });

    subsection('Combustion Status');
    PLANET_LIST.forEach(name=>{
      const p = chart.planets[name];
      if (p.combustion""")
# nakshatra object degInNak guard check later
open('srcB.html','w',encoding='utf-8').write(s)

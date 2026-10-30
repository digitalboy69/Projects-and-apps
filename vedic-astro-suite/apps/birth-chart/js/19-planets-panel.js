/* ===== Planets panel + detail popup (redesigned) ===== */
function gulikaCard(chart){
  const g = chart.upagraha && chart.upagraha.Gulika; if (!g) return '';
  const sg = SIGNS[g.sign], c = OUTER_COL.Gulika;
  return `<div class="pl-grid pl-gulika"><div class="pl-card" data-flags="gulika" style="--pc:${c}">
      <span class="pl-top"><span class="pl-dot" style="background:${c}">Gu</span>
        <span class="pl-name"><b>Gulika <em>(Mandi)</em></b><small>${g.nakshatra.name} · Pada ${g.nakshatra.pada}</small></span>
        <span class="pl-house">H${g.house}</span></span>
      <span class="pl-sign">${sg.symbol} ${sg.name}<em>${formatDeg(g.degInSign)}</em></span>
      <span class="pl-track"><i style="width:${(g.degInSign/30*100).toFixed(1)}%"></i></span>
      <span class="pl-tags"><span class="pl-tag">Son of Saturn · upagraha point</span></span>
      <span class="pl-note">The rising sign at the start of Saturn's part of the ${g.isDay?'day':'night'} (part ${g.part} of 8). Teachers differ on the start, middle or end of that part. Read like a Saturn-type point: it adds delay and pressure to the house and planets it touches.</span></div></div>`;
}
function plDigInfo(pl){
  const st = pl.dignity.status;
  const good = st==='Exalted'||st==='OwnSign'||st==='Moolatrikona', bad = st==='Debilitated';
  return {good, bad, cls: good?'good':bad?'bad':''};
}
function buildPlanetsPanel(chart){
  let nRetro=0,nStrong=0,nChall=0;
  const cards = PLANET_LIST.map(name=>{
    const pl = chart.planets[name], sg = SIGNS[pl.sign], d = plDigInfo(pl), c = DASHA_PLANET_COLORS[name]||'#888';
    const combust = pl.combustion && pl.combustion.combust, warLose = pl.war && !pl.war.won;
    const flags = [];
    if (pl.retrograde){ flags.push('retro'); nRetro++; }
    if (d.good){ flags.push('strong'); nStrong++; }
    if (d.bad || combust || warLose){ flags.push('chall'); nChall++; }
    const tags = [
      d.cls ? `<span class="pl-tag ${d.cls}">${pl.dignity.label}</span>` : (pl.dignity.label && pl.dignity.label!=='—' ? `<span class="pl-tag">${pl.dignity.label}</span>` : ''),
      combust ? `<span class="pl-tag bad">Combust ${pl.combustion.separation.toFixed(1)}°</span>` : '',
      pl.war ? `<span class="pl-tag ${pl.war.won?'good':'bad'}">${pl.war.won?'Wins':'Loses'} vs ${pl.war.with}</span>` : ''
    ].join('');
    return `<button type="button" class="pl-card" data-planet-click="${name}" data-flags="${flags.join(' ')}" style="--pc:${c}">
      <span class="pl-top"><span class="pl-dot" style="background:${c}">${PLANET_GLYPHS[name]}</span>
        <span class="pl-name"><b>${name}${pl.retrograde?' <em>℞</em>':''}</b><small>${pl.nakshatra.name} · Pada ${pl.nakshatra.pada}</small></span>
        <span class="pl-house">H${pl.house}</span></span>
      <span class="pl-sign">${sg.symbol} ${sg.name}<em>${formatDeg(pl.degInSign)}</em></span>
      <span class="pl-track"><i style="width:${(pl.degInSign/30*100).toFixed(1)}%"></i></span>
      <span class="pl-tags">${tags}</span>
    </button>`;
  }).join('');

  const outerCards = OUTER_LIST.map(n=>{
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
    const pl = chart.planets[name], c = DASHA_PLANET_COLORS[name]||'#888';
    const chips = pl.aspectsHouses.map(h=>`<span class="pl-asp">H${h} ${SIGNS[(chart.ascendant.sign+h-1)%12].symbol}</span>`).join('');
    return `<div class="pl-arow" data-planet-click="${name}"><span class="pl-dot sm" style="background:${c}">${PLANET_GLYPHS[name]}</span><span class="pl-an"><b>${name}</b><small>in House ${pl.house}</small></span><span class="pl-achips">${chips}</span></div>`;
  }).join('');

  return `<div class="pl">
    <div class="pl-intro">Where every planet stood at birth. Tap any planet for its full story — use the filters to spot what stands out.</div>
    <div class="pl-chips">
      <button type="button" class="pl-chip on" data-pl-f="all">All <b>${PLANET_LIST.length}</b></button>
      <button type="button" class="pl-chip" data-pl-f="retro">℞ Retrograde <b>${nRetro}</b></button>
      <button type="button" class="pl-chip" data-pl-f="strong">💪 Strong <b>${nStrong}</b></button>
      <button type="button" class="pl-chip" data-pl-f="chall">⚠ Challenged <b>${nChall}</b></button>
    </div>
    <div class="pl-grid">${cards}</div>
    ${gulikaCard(chart)}
    <div class="pl-empty" id="plEmpty" hidden>No planets match this filter in your chart.</div>
    <div class="pl-sec"><h5>Outer planets <span>Modern · tap for details</span></h5><div class="pl-grid">${outerCards}</div>
      <div class="pl-asplist" style="margin-top:10px">${outerAsp}</div></div>
    <div class="pl-sec"><h5>Who looks at whom <span>Drishti · aspected houses</span></h5><div class="pl-asplist">${asp}</div></div></div>`;
}
document.addEventListener('click',(e)=>{
  const f = e.target.closest('[data-pl-f]'); if(!f) return;
  const k = f.dataset.plF; let shown = 0;
  document.querySelectorAll('.pl-chip').forEach(c=>c.classList.toggle('on', c===f));
  document.querySelectorAll('.pl-card').forEach(c=>{ const ok = k==='all' || c.dataset.flags.split(' ').includes(k); c.hidden = !ok; if(ok) shown++; });
  document.getElementById('plEmpty').hidden = shown>0;
});

let pdCurrent = null;
function pdBlock(title, inner){ return `<div class="pd-blk"><div class="pd-blk-t">${title}</div>${inner}</div>`; }
function openOuterDetail(name){
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
  if (OUTER_LIST.includes(planetName)) return openOuterDetail(planetName);
  const chart = currentChartForModal, pl = chart.planets[planetName];
  if (!pl) return;
  pdCurrent = planetName;
  const sign = SIGNS[pl.sign], d = plDigInfo(pl), c = DASHA_PLANET_COLORS[planetName]||'#D4AF37';
  const nakSpan = 360/27, nakPct = Math.max(0,Math.min(100,pl.nakshatra.degInNak/nakSpan*100));
  const degRemNak = nakSpan - pl.nakshatra.degInNak;
  document.getElementById('pdBox').style.setProperty('--pc', c);
  document.getElementById('pdGlyph').textContent = PLANET_GLYPHS[planetName];
  document.getElementById('pdTitle').textContent = planetName;
  document.getElementById('pdSubtitle').textContent = `${sign.symbol} ${sign.name} · House ${pl.house}`;

  // role pills
  const pills = [`<span class="pd-pill ${d.cls}">${pl.dignity.label}</span>`,
    `<span class="pd-pill ${pl.retrograde?'bad':''}">${pl.retrograde?'℞ Retrograde':'Direct motion'}</span>`];
  KARAKA_NAMES.forEach(k=>{ if (chart.charaKarakas[k] && chart.charaKarakas[k].planet===planetName) pills.push(`<span class="pd-pill gold">${k}</span>`); });
  const act = findActiveDasha(chart.dashaData.mahadashas, new Date());
  if (act){
    if (act.mahadasha.lord===planetName) pills.push('<span class="pd-pill gold">Running Mahadasha</span>');
    if (act.antardasha && act.antardasha.lord===planetName) pills.push('<span class="pd-pill gold">Running Antardasha</span>');
  }
  document.getElementById('pdPills').innerHTML = pills.join('');

  let h = '';
  h += pdBlock(`Journey through ${sign.name}`, `<div class="pd-journey"><div class="pd-jtrack"><i style="width:${(pl.degInSign/30*100).toFixed(1)}%"></i><u style="left:${(pl.degInSign/30*100).toFixed(1)}%"></u></div>
    <div class="pd-jlbl"><span>0°</span><b>${formatDeg(pl.degInSign)} travelled</b><span>30°</span></div>
    <div class="pd-jsub">${formatDeg(pl.degRemainingInSign)} left before it enters the next sign</div></div>`);
  h += `<div class="pd-mini">
    <div><small>Sign lord</small><b>${sign.lord}</b></div><div><small>House</small><b>${pl.house}</b></div>
    <div><small>Daily speed</small><b>${Math.abs(pl.speed).toFixed(3)}°</b></div><div><small>Nakshatra lord</small><b>${pl.nakshatra.lord}</b></div></div>`;
  h += pdBlock('Nakshatra', `<div class="pd-nak"><b>${pl.nakshatra.name}</b><span>Pada ${pl.nakshatra.pada}</span></div>
    <div class="pd-jtrack thin"><i style="width:${nakPct.toFixed(1)}%"></i></div><div class="pd-jsub">${formatDeg(degRemNak)} remaining in this nakshatra</div>`);
  if (chart.shadbala && chart.shadbala.planets && chart.shadbala.planets[planetName]){
    const s = chart.shadbala.planets[planetName], p = Math.min(100, s.percentOfRequired);
    h += pdBlock('Strength (Shadbala)', `<div class="pd-str"><b>${s.totalRupas.toFixed(2)} <small>/ ${s.requiredRupas} Rupas</small></b><span class="pd-pill ${s.isStrong?'good':'bad'}">${s.isStrong?'Strong':'Below threshold'}</span></div>
      <div class="pd-jtrack thin"><i style="width:${p}%;background:${s.isStrong?'var(--teal-bright)':'#C95050'}"></i></div><div class="pd-jsub">${s.percentOfRequired.toFixed(0)}% of required strength</div>`);
  }
  h += pdBlock('Aspects (Drishti)', `<div class="pl-achips">${pl.aspectsHouses.map(x=>`<span class="pl-asp">H${x} ${SIGNS[(chart.ascendant.sign+x-1)%12].symbol}</span>`).join('')}</div>`);
  if (pl.combustion && pl.combustion.separation !== undefined){
    h += `<div class="pd-alert ${pl.combustion.combust?'bad':''}"><b>${pl.combustion.combust?'🔥 Combust':'☀ Not combust'}</b><span>${pl.combustion.separation.toFixed(2)}° from the Sun (orb ${pl.combustion.orb}°)</span></div>`;
  }
  if (pl.war){
    h += `<div class="pd-alert ${pl.war.won?'':'bad'}"><b>⚔ Planetary war</b><span>${pl.war.won?'Wins against':'Loses against'} ${pl.war.with}, ${pl.war.separation.toFixed(2)}° apart</span></div>`;
  }
  document.getElementById('pdStatGrid').innerHTML = h;
  document.getElementById('pdNote').textContent = `Sidereal longitude ${formatDeg(normDeg(pl.longitude))} · Speed is instantaneous and varies through the orbit; planets slow near stations before turning retrograde or direct.`;
  const box = document.getElementById('pdBox'); box.scrollTop = 0;
  document.getElementById('planetDetailModal').classList.add('show');
}
document.addEventListener('click',(e)=>{
  const go = e.target.closest('[data-pd-go]');
  if (go && pdCurrent){
    const ALLP = PLANET_LIST.concat(OUTER_LIST), i = ALLP.indexOf(pdCurrent), n = ALLP.length;
    openPlanetDetail(ALLP[(i + parseInt(go.dataset.pdGo) + n) % n]); return;
  }
  if (e.target.closest('#pdStrengthBtn')){
    document.getElementById('planetDetailModal').classList.remove('show'); switchAppTab('panel-shadbala');
  }
});

document.addEventListener('click', (e)=>{
  const clickable = e.target.closest('[data-planet-click]');
  if (clickable){
    openPlanetDetail(clickable.dataset.planetClick);
    return;
  }
  const shadbalaCard = e.target.closest('[data-shadbala-toggle]');
  if (shadbalaCard){
    shadbalaCard.classList.toggle('expanded');
  }
});

document.getElementById('pdModalClose').addEventListener('click', ()=>{
  document.getElementById('planetDetailModal').classList.remove('show');
});
document.getElementById('planetDetailModal').addEventListener('click', (e)=>{
  if (e.target.id === 'planetDetailModal') document.getElementById('planetDetailModal').classList.remove('show');
});

// Contact & Bug Report Modal Logic
document.getElementById('contactDevBtn').addEventListener('click', () => {
  document.getElementById('mainMenuModal').classList.remove('show'); // Auto-close menu
  document.getElementById('contactModal').classList.add('show');
});
document.getElementById('contactModalClose').addEventListener('click', () => {
  document.getElementById('contactModal').classList.remove('show');
});
document.getElementById('contactModal').addEventListener('click', (e) => {
  if (e.target.id === 'contactModal') document.getElementById('contactModal').classList.remove('show');
});

// Main Menu Modal Logic
document.getElementById('openMenuBtn').addEventListener('click', () => {
  document.getElementById('mainMenuModal').classList.add('show');
});
document.getElementById('mainMenuClose').addEventListener('click', () => {
  document.getElementById('mainMenuModal').classList.remove('show');
});
document.getElementById('mainMenuModal').addEventListener('click', (e) => {
  if (e.target.id === 'mainMenuModal') document.getElementById('mainMenuModal').classList.remove('show');
});

// Auto-close menu when a profile action is taken
document.getElementById('deleteProfileBtn').addEventListener('click', () => {
  document.getElementById('mainMenuModal').classList.remove('show');
});
document.getElementById('newProfileBtn').addEventListener('click', () => {
  document.getElementById('mainMenuModal').classList.remove('show');
});
document.getElementById('exportReportBtn').addEventListener('click', () => {
  document.getElementById('mainMenuModal').classList.remove('show');
});


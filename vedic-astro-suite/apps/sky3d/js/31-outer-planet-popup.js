/* ---- Rich popup for Uranus / Neptune / Pluto (same look as the other planets) ---- */
function focusBody(name){
  if (SOL.view==='solar'){ solBuild(); }
  setCamMode('focus'); focusedPlanetKey = (SOL.view==='solar' ? 'sol_' : 'geo_') + name; autoRotate = false; SOL.lastFocus = null;
  const sel = document.getElementById('focusPlanetSelect'); if (sel) sel.value = focusedPlanetKey;
  updateLegend(); markDirty(); if (typeof syncPickBtn==='function') syncPickBtn();
}
function openOuterPlanetDetail(name, jd){
  if (jd == null) jd = currentJD;
  const I = OUTER_INFO[name], snap = snapshotPositions(jd), lon = snap.sidereal[name], si = getSignIndex(lon), sign = SIGNS[si], dms = degreeInSign(lon);
  const nakIdx = getNakshatraIndex(lon), nak = NAKSHATRAS[nakIdx], pada = getPadaIndex(lon)+1, col = PLANET_COLORS[name];
  const isRetro = !!snap.retro[name], speed = planetSpeed(name, jd);
  const card = (k,v,sb,w)=> `<div class="pdx-card pdx-in ${w?'wide':''}"><div class="k">${k}</div><div class="v">${v}</div>${sb?`<div class="s">${sb}</div>`:''}</div>`;
  const chips = a=> a.map(x=>`<span class="pdx-chip">${x}</span>`).join('');
  const pchip = n=> `<button type="button" class="pdx-pchip" style="--c:${PLANET_COLORS[n]||'#8FA3B8'}" onclick="openPlanetDetail('${n}',${jd})">${PLANET_GLYPHS[n]||'⌖'} ${n}</button>`;
  // house from Lagna (if a natal profile is active)
  let house = '', houseLine = '';
  if (isValidProfile(activeNatalProfile)){ const L = computeNatalAscendant(activeNatalProfile).lagnaLon; const h = getHouseOfLongitude(lon, getSignIndex(L));
    house = card('House from Lagna', `${h}${h===1?' · Lagna':''}`, activeNatalProfile.name); houseLine = `<div class="pdx-card wide pdx-in"><div class="k">What this means for ${activeNatalProfile.name}</div><div class="s" style="font-size:13px;line-height:1.6;color:var(--text)">${outerHouseLine(name, h)}</div></div>`; }
  const conj = PLANET_LIST.filter(n=> getSignIndex(snap.sidereal[n]) === si);
  // sign occupancy (slow planets: guard against long searches)
  let occ = {enterJD:null, exitJD:null, daysIn:null, daysLeft:null};
  try { occ = getSignOccupancy(name, jd); } catch(e){}
  const total = (occ.daysIn!=null && occ.daysLeft!=null) ? occ.daysIn + occ.daysLeft : null, prog = total ? Math.round(occ.daysIn/total*100) : Math.round(dms.raw/30*100);
  let ing = '', j = occ.exitJD, cnt = 0;
  try { while (j != null && cnt < 3){ const nj = j + 1, ns = getSignIndex(snapshotPositions(nj).sidereal[name]); ing += `<div class="pdx-row pdx-in" style="--i:${cnt}"><span>${SIGNS[ns].symbol} ${SIGNS[ns].name}</span><b>${formatFullDate(j)}</b></div>`; j = getSignOccupancy(name, nj).exitJD; cnt++; } } catch(e){}
  // Western aspects to the other planets now (transiting)
  const nowTargets = ALL_BODIES.map(n=>[n, snap.sidereal[n]]);
  const asp = outerAspectsTo(lon, nowTargets, name);
  const aspRow = (a,i,sub)=> { const t = a.target, tc = PLANET_COLORS[t]||'#8FA3B8', tg = PLANET_GLYPHS[t]||'⌖';
    return `<div class="pdx-row pdx-in" style="--i:${i};cursor:${PLANET_COLORS[t]?'pointer':'default'}" ${PLANET_COLORS[t]&&t!=='Ascendant'?`onclick="openPlanetDetail('${t}',${jd})"`:''}><span style="color:${tc};font-size:18px">${tg}</span><span>${a.asp.symbol} ${a.asp.name} <b style="color:var(--text);margin:0;font-family:inherit;font-size:13px">${t}</b><br><small style="color:var(--text-faint)">${name} ${a.asp.verb} ${t}${sub||''}</small></span><b>${a.dev.toFixed(1)}° orb</b></div>`; };
  const aspHtml = asp.map((a,i)=> aspRow(a,i)).join('');
  // aspects from transiting outer planet to the natal chart
  let natalHtml = '';
  if (isValidProfile(activeNatalProfile)){
    try {
      const nc = computeNatalAscendant(activeNatalProfile), ns = snapshotPositions(nc.jd).sidereal;
      const tg = PLANET_LIST.map(n=>[n, ns[n]]).concat(OUTER_LIST.map(n=>[n, ns[n]])).concat([['Ascendant', nc.lagnaLon]]);
      const na = outerAspectsTo(lon, tg, null);
      natalHtml = `<div class="pdx-h">To ${activeNatalProfile.name}'s birth chart</div>` + (na.length ? na.map((a,i)=> aspRow(a,i,' (natal)')).join('') : '<div class="pd-empty-note">No close aspects to the natal chart right now.</div>');
    } catch(e){}
  }
  const ratio = Math.abs(speed), spTxt = ratio < 0.003 ? 'Nearly stationary (changing direction)' : ratio < 0.02 ? 'Slow, typical for an outer planet' : 'Moving steadily';
  const html = `<div class="pdx-root" style="--pc:${col};--pca:${col}55">
    <div class="pdx-hero">
      <div class="pdx-orb"><span>${PLANET_GLYPHS[name]}</span></div>
      <div class="pdx-name">${name}</div><div class="pdx-sk">${I.sk} · ${I.role}</div>
      <div class="pdx-date">${formatFullDate(jd)}</div>
      <div class="pdx-badges"><span class="pdx-badge">${sign.symbol} ${sign.name}</span><span class="pdx-badge">${nak} · Pada ${pada}</span>
        <span class="pdx-badge ${isRetro?'bad':'good'}">${isRetro?'℞ Retrograde':'Direct'}</span><span class="pdx-badge">Outer planet</span></div>
    </div>
    <div class="pdx-tabs"><button class="pdx-tab on" onclick="pdxTab(this,'ov')">Overview</button><button class="pdx-tab" onclick="pdxTab(this,'me')">Meaning</button><button class="pdx-tab" onclick="pdxTab(this,'ti')">Timeline</button><button class="pdx-tab" onclick="pdxTab(this,'as')">Aspects</button><button class="pdx-tab" onclick="pdxTab(this,'fa')">Facts</button></div>
    <div class="pdx-pane on" data-pane="ov">
      <div class="pdx-about pdx-in">${I.about}</div>
      <div class="pdx-h">Position</div>
      <div class="pd-gauge-row pdx-in" style="--i:1">${buildDegreeGaugeSVG(dms.raw, col)}<div class="pd-gauge-label"><div class="pd-gauge-deg">${dms.deg}° ${dms.min}' ${dms.sec}"</div><div class="pd-gauge-sign">into ${sign.symbol} ${sign.name} (${sign.sk})</div></div></div>
      <div class="pdx-grid" style="margin-top:12px">
        ${card('Sidereal longitude', lon.toFixed(3)+'°', ayanName()+' ayanamsa')}${card('Nakshatra', nak, 'Lord '+NAKSHATRA_LORDS[nakIdx]+' · Pada '+pada+' of 4')}
        ${card('Sign lord', sign.lord, sign.sk+' rashi')}${house}
        ${card('Daily motion', (speed>=0?'+':'')+speed.toFixed(4)+'°/day', spTxt)}
        ${houseLine}
        ${conj.length ? `<div class="pdx-card wide pdx-in"><div class="k">Sharing the sign with</div><div class="pdx-chips" style="margin-top:8px">${conj.map(pchip).join('')}</div></div>` : ''}
      </div>
      <button type="button" class="btn-block" style="margin-top:14px" onclick="closePlanetDetail();focusBody('${name}')">🎥 Fly the camera to ${name}</button>
    </div>
    <div class="pdx-pane" data-pane="me">
      <div class="pdx-h">Key themes</div><div class="pdx-chips pdx-in">${chips(I.themes)}</div>
      <div class="pdx-h">Body &amp; areas</div><div class="pdx-chips pdx-in">${chips(I.body)}</div>
      <div class="pdx-grid" style="margin-top:12px">${card('Modern ruler of', I.rules)}${card('Cycle', I.cycle)}${card('Sanskrit name (modern use)', I.sk)}${card('Role', I.role)}</div>
      <div class="pdx-card wide pdx-in" style="margin-top:12px"><div class="k">A note on Vedic use</div><div class="s" style="font-size:12.5px;line-height:1.6">${OUTER_VEDIC_NOTE}</div></div>
    </div>
    <div class="pdx-pane" data-pane="ti">
      <div class="pdx-h">Time in ${sign.name}</div>
      <div class="pdx-card pdx-in"><div class="v">${prog}% through this sign</div><div class="pdx-bar"><i style="--w:${prog}%"></i></div>
        <div class="s" style="margin-top:8px">${occ.daysIn!=null?formatDurationDays(occ.daysIn)+' in · ':''}${occ.daysLeft!=null?formatDurationDays(occ.daysLeft)+' left':'Typical stay: '+I.perSign}</div></div>
      <div class="pdx-grid" style="margin-top:10px">${card('Entered', occ.enterJD!=null?formatFullDate(occ.enterJD):'Before the search range')}${card('Leaves', occ.exitJD!=null?formatFullDate(occ.exitJD):'After the search range')}</div>
      <div class="pdx-h">Next sign changes</div>${ing || '<div class="pd-empty-note">Beyond the calculable range (it moves very slowly).</div>'}
    </div>
    <div class="pdx-pane" data-pane="as">
      <div class="pdx-h">Aspects to the sky now (Western orbs)</div>${aspHtml || `<div class="pd-empty-note">No close aspects to other planets right now.</div>`}
      ${natalHtml}
      <div class="s" style="margin-top:12px;font-size:11.5px;color:var(--text-faint)">Orbs: conjunction 8°, opposition 8°, trine 7°, square 7°, sextile 4° (+1° for Sun, Moon and Ascendant).</div>
    </div>
    <div class="pdx-pane" data-pane="fa">
      <div class="pdx-h">Astronomy facts</div>
      <div class="pdx-grid">${I.facts.map(f=>card(f[0]+' '+f[1], f[2])).join('')}</div>
    </div>
  </div>`;
  const box = document.getElementById('planetDetailContent'); box.innerHTML = html;
  document.getElementById('planetDetailOverlay').classList.add('show');
  const m = box.closest('.pdmodal'); if (m) m.scrollTop = 0;
  requestAnimationFrame(()=> requestAnimationFrame(()=> box.querySelector('.pdx-root').classList.add('go')));
}

function closePlanetDetail(){
  document.getElementById('planetDetailOverlay').classList.remove('show');
}
document.getElementById('planetDetailClose').addEventListener('click', closePlanetDetail);


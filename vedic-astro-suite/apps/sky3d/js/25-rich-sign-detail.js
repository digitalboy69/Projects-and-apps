/* ============================================================================
   RICH SIGN DETAIL
   ============================================================================ */
const SD = [
 ['Ram','Pioneering · Bold · Impulsive','Head'],['Bull','Steady · Sensual · Loyal','Face, neck'],['Twins','Curious · Witty · Versatile','Arms, shoulders'],
 ['Crab','Nurturing · Intuitive · Protective','Chest'],['Lion','Regal · Generous · Proud','Heart, upper abdomen'],['Maiden','Analytical · Practical · Precise','Intestines'],
 ['Scales','Harmonious · Diplomatic · Aesthetic','Kidneys, lower back'],['Scorpion','Intense · Secretive · Transformative','Reproductive organs'],['Archer','Optimistic · Philosophical · Free','Thighs'],
 ['Sea-goat','Disciplined · Ambitious · Patient','Knees'],['Water-bearer','Visionary · Independent · Humanitarian','Calves, ankles'],['Fish','Dreamy · Compassionate · Spiritual','Feet']];
function openSignDetail(si){
  const jd = chartTabContextJD, snap = snapshotPositions(jd), sg = SIGNS[si], inf = SD[si], col = signHex(si);
  const el = ['Fire','Earth','Air','Water'][si%4], mod = ['Movable (Chara)','Fixed (Sthira)','Dual (Dwiswabhava)'][si%3], dir = ['East','South','West','North'][si%4];
  const card = (k,v,sb)=> `<div class="pdx-card pdx-in"><div class="k">${k}</div><div class="v">${v}</div>${sb?`<div class="s">${sb}</div>`:''}</div>`;
  const here = PLANET_LIST.filter(n=> getSignIndex(snap.sidereal[n]) === si);
  const planets = here.length ? here.map((n,i)=>{
    const o = getSignOccupancy(n, jd), tot = (o.daysIn!=null && o.daysLeft!=null) ? o.daysIn + o.daysLeft : null, pr = tot ? Math.round(o.daysIn/tot*100) : Math.round(degreeInSign(snap.sidereal[n]).raw/30*100), dm = degreeInSign(snap.sidereal[n]);
    return `<div class="pdx-card pdx-in" style="--i:${i};--pc:${PLANET_COLORS[n]};margin-bottom:10px;cursor:pointer" onclick="closeSignDetail(); openPlanetDetail('${n}', ${jd})">
      <div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px;color:${PLANET_COLORS[n]}">${PLANET_GLYPHS[n]}</span><b style="font-size:15px">${n}</b><span class="pdx-badge" style="margin-left:6px;padding:3px 9px">${dignityOf(n, si)}</span><span style="margin-left:auto;font-family:var(--font-mono);font-size:12px">${dm.deg}°${dm.min}'</span></div>
      <div class="pdx-seg"><i style="--w:${pr}%"></i></div><div class="s" style="margin-top:6px">${pr}% through · ${o.daysLeft!=null?formatDurationDays(o.daysLeft)+' left':''}</div></div>`;
  }).join('') : `<div class="pd-empty-note">No planets are in ${sg.name} right now.</div>`;
  const n0 = Math.floor(si*30/(360/27)), n1 = Math.floor((si*30+29.999)/(360/27));
  let naks = ''; for (let k=n0; k<=n1; k++) naks += `<div class="pdx-row pdx-in" style="--i:${k-n0}"><span>${NAKSHATRAS[k%27]}</span><b>Lord ${NAKSHATRA_LORDS[k%27]}</b></div>`;
  let house = '';
  if (isValidProfile(activeNatalProfile)){ const L = getSignIndex(computeNatalAscendant(activeNatalProfile).lagnaLon); house = card('House from Lagna', 'House ' + (((si - L + 12) % 12) + 1), activeNatalProfile.name); }
  const html = `<div class="pdx-root" style="--pc:${col};--pca:${col}66">
    <div class="pdx-hero"><div class="pdx-orb"><span style="font-size:52px">${sg.symbol}</span></div>
      <div class="pdx-name">${sg.name}</div><div class="pdx-sk">${sg.sk} · ${inf[0]}</div>
      <div class="pdx-badges" style="margin-top:12px"><span class="pdx-badge">${el}</span><span class="pdx-badge">${mod}</span><span class="pdx-badge">Ruled by ${sg.lord}</span></div></div>
    <div class="pdx-pane on" style="padding-top:6px">
      <div class="pdx-about pdx-in">${inf[1].split(' · ').join(', ')}. ${sg.name} is the ${si+1}${['st','nd','rd'][si]||'th'} sign of the zodiac and is ruled by ${sg.lord}.</div>
      <div class="pdx-h">Quick facts</div>
      <div class="pdx-grid">${card('Element', el)}${card('Quality', mod)}${card('Ruler', sg.lord)}${card('Gender', si%2===0?'Masculine (odd)':'Feminine (even)')}${card('Direction', dir)}${card('Body part', inf[2])}${house}${card('Degrees', (si*30)+'° – '+(si*30+30)+'°', 'Sidereal')}</div>
      <div class="pdx-h">Nature</div><div class="pdx-chips pdx-in">${inf[1].split(' · ').map(x=>`<span class="pdx-chip">${x}</span>`).join('')}</div>
      <div class="pdx-h">Nakshatras in this sign</div>${naks}
      <div class="pdx-h">Planets here now</div>${planets}
    </div></div>`;
  const box = document.getElementById('signDetailContent'); box.innerHTML = html;
  document.getElementById('signDetailOverlay').classList.add('show');
  const m = box.closest('.pdmodal'); if (m) m.scrollTop = 0;
  requestAnimationFrame(()=> requestAnimationFrame(()=> box.querySelector('.pdx-root').classList.add('go')));
}

function closeSignDetail(){
  document.getElementById('signDetailOverlay').classList.remove('show');
}
document.getElementById('signDetailClose').addEventListener('click', closeSignDetail);
document.getElementById('signDetailOverlay').addEventListener('click', (e)=>{
  if (e.target.id==='signDetailOverlay') closeSignDetail();
});

function renderAspectFocusFilter(){
  const wrap = document.getElementById('aspectFocusFilter');
  if (wrap.dataset.built) return; // build once, it's static list of planets
  wrap.dataset.built = "1";
  let html = `<button class="filter-chip active" data-focus="ALL">All Planets</button>`;
  PLANET_LIST.forEach(name=>{
    html += `<button class="filter-chip" data-focus="${name}">${name}</button>`;
  });
  wrap.innerHTML = html;
  wrap.querySelectorAll('.filter-chip').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      wrap.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      aspectFocusPlanet = chip.dataset.focus;
      renderAspectList(getChartContext());
    });
  });
}

function renderAspectList(ctx){
  const wrap = document.getElementById('aspectList');
  let aspects = computeAspects(ctx.sidereal);
  if (aspectFocusPlanet!=="ALL"){
    aspects = aspects.filter(a=> a.from===aspectFocusPlanet || a.to===aspectFocusPlanet);
  }
  if (!aspects.length){
    wrap.innerHTML = `<div class="empty-aspects">No graha drishti aspects found${aspectFocusPlanet!=="ALL" ? ` involving ${aspectFocusPlanet}` : ''} at this time.</div>`;
    return;
  }
  const houseLabel = {4:'4th (square)', 5:'5th (trine)', 7:'7th (opposition)', 8:'8th', 9:'9th (trine)', 3:'3rd', 10:'10th'};
  let html = "";
  aspects.forEach(a=>{
    html += `<div class="aspect-row">
      <div class="aspect-glyphs">
        <span style="color:${PLANET_COLORS[a.from]}; cursor:pointer;" onclick="openPlanetDetail('${a.from}', chartTabContextJD)">${PLANET_GLYPHS[a.from]}</span>
        <span class="aspect-arrow">→</span>
        <span style="color:${PLANET_COLORS[a.to]}; cursor:pointer;" onclick="openPlanetDetail('${a.to}', chartTabContextJD)">${PLANET_GLYPHS[a.to]}</span>
      </div>
      <div class="aspect-desc"><b>${a.from}</b> aspects <b>${a.to}</b> in ${SIGNS[a.sign].name}</div>
      <div class="aspect-house-tag">${houseLabel[a.houseOffset]||a.houseOffset+'th'}</div>
    </div>`;
  });
  wrap.innerHTML = html;
}


/* ============================================================================
   TRANSIT + CONJUNCTION SCANNING (cached, recomputed when jump/profile changes)
   ============================================================================ */
let cachedTransitScanFromJD = null;
let cachedTransitResults = null;
let cachedConjScanFromJD = null;
let cachedConjResults = null;

const NATAL_RELEVANT_PLANETS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"];
const CONJ_PAIRS = [];
for (let i=0;i<PLANET_LIST.length;i++){
  for (let j=i+1;j<PLANET_LIST.length;j++){
    // Skip Rahu-Ketu pair (always exactly opposite, never conjunct) and Sun-Moon w/ nodes redundancy is fine to include
    if ((PLANET_LIST[i]==="Rahu"&&PLANET_LIST[j]==="Ketu")) continue;
    CONJ_PAIRS.push([PLANET_LIST[i], PLANET_LIST[j]]);
  }
}

function scanTransits(fromJD){
  const endJD = fromJD + 730; // 2 years ahead
  const results = [];
  PLANET_LIST.forEach(name=>{
    const events = findIngresses(name, fromJD, endJD);
    events.forEach((e,idx)=>{
      const durationDays = idx+1<events.length ? events[idx+1].jd - e.jd : null;
      results.push({ type:"ingress", planet:name, jd:e.jd, toSign:e.toSign, fromSign:e.fromSign, durationDays });
    });
  });
  results.sort((a,b)=> a.jd-b.jd);
  return results;
}

function scanConjunctions(fromJD){
  const endJD = fromJD + 730;
  const results = [];
  CONJ_PAIRS.forEach(([a,b])=>{
    // Use wider orb + longer step for slow-moving outer pairs to reduce compute; findConjunctions already bisects precisely
    const events = findConjunctions(a,b,fromJD,endJD,1.0);
    events.forEach(e=> results.push({ type:"conjunction", planetA:a, planetB:b, jd:e.jd, sign:e.sign, longitude:e.longitude }));
  });
  results.sort((a,b)=> a.jd-b.jd);
  return results;
}

function getTransitResults(fromJD){
  if (cachedTransitScanFromJD===null || Math.abs(fromJD-cachedTransitScanFromJD)>1){
    cachedTransitScanFromJD = fromJD;
    cachedTransitResults = scanTransits(fromJD);
  }
  return cachedTransitResults;
}
function getConjResults(fromJD){
  if (cachedConjScanFromJD===null || Math.abs(fromJD-cachedConjScanFromJD)>1){
    cachedConjScanFromJD = fromJD;
    cachedConjResults = scanConjunctions(fromJD);
  }
  return cachedConjResults;
}

function planetSpeedTag(name){
  const speed = Math.abs(AVG_DAILY_MOTION[name]);
  if (speed > 5) return "fast";
  if (speed > 0.3) return "medium";
  return "slow";
}

function renderTransitFeed(){
  const feed = document.getElementById('transitFeed');
  const note = document.getElementById('transitScanNote');
  const results = getTransitResults(currentJD).filter(e=> transitFilterSet.has(e.planet));
  note.textContent = `Scanning ${formatHudDate(currentJD)} → ${formatHudDate(currentJD+730)} (2-year horizon)`;
  if (!results.length){
    feed.innerHTML = `<div class="empty-feed">No ingresses found for the selected planets in this window.</div>`;
    return;
  }
  let html = "";
  results.slice(0,60).forEach(e=>{
    const toSign = SIGNS[e.toSign];
    const fromSign = SIGNS[e.fromSign];
    html += `<div class="transit-card" data-jd="${e.jd}">
      <div class="transit-card-top">
        <div class="transit-card-title">${PLANET_GLYPHS[e.planet]} ${e.planet} → ${toSign.symbol} ${toSign.name}</div>
        <div class="transit-card-date">${formatHudDate(e.jd)}</div>
      </div>
      <div class="transit-card-desc">Leaves ${fromSign.name}, enters ${toSign.name} (${toSign.sk}), ruled by ${toSign.lord}.${e.durationDays ? ` Stays roughly ${Math.round(e.durationDays)} days.`:''}</div>
      <div class="transit-card-tag">${planetSpeedTag(e.planet)} mover</div>
    </div>`;
  });
  feed.innerHTML = html;
  feed.querySelectorAll('.transit-card').forEach(card=>{
    card.addEventListener('click', ()=> jumpToJD(parseFloat(card.dataset.jd)));
  });
}

let conjSignificanceMode = "major";
function renderConjunctionFeed(){
  const feed = document.getElementById('conjunctionFeed');
  const note = document.getElementById('conjScanNote');
  let results = getConjResults(currentJD);
  if (conjSignificanceMode === "major"){
    results = results.filter(e=> e.planetA!=="Moon" && e.planetB!=="Moon");
  }
  note.textContent = `Scanning ${formatHudDate(currentJD)} → ${formatHudDate(currentJD+730)} (2-year horizon) · orb 1°`;
  if (!results.length){
    feed.innerHTML = `<div class="empty-feed">No conjunctions found within orb in this window.</div>`;
    return;
  }
  let html = "";
  results.slice(0,60).forEach(e=>{
    const sign = SIGNS[e.sign];
    html += `<div class="transit-card conjunction" data-jd="${e.jd}">
      <div class="transit-card-top">
        <div class="transit-card-title">${PLANET_GLYPHS[e.planetA]} ${e.planetA} ⚯ ${PLANET_GLYPHS[e.planetB]} ${e.planetB}</div>
        <div class="transit-card-date">${formatHudDate(e.jd)}</div>
      </div>
      <div class="transit-card-desc">Exact conjunction in ${sign.symbol} ${sign.name} at ${formatDeg(getDegInSign(e.longitude))}.</div>
      <div class="transit-card-tag">conjunction</div>
    </div>`;
  });
  feed.innerHTML = html;
  feed.querySelectorAll('.transit-card').forEach(card=>{
    card.addEventListener('click', ()=> jumpToJD(parseFloat(card.dataset.jd)));
  });
}

document.getElementById('conjSignificanceFilter').querySelectorAll('.filter-chip').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    document.querySelectorAll('#conjSignificanceFilter .filter-chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    conjSignificanceMode = chip.dataset.sig;
    renderConjunctionFeed();
  });
});

function renderTransitFilters(){
  const wrap = document.getElementById('transitFilters');
  let html = "";
  PLANET_LIST.forEach(name=>{
    html += `<button class="filter-chip ${transitFilterSet.has(name)?'active':''}" data-planet="${name}">${name}</button>`;
  });
  wrap.innerHTML = html;
  wrap.querySelectorAll('.filter-chip').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      const p = chip.dataset.planet;
      if (transitFilterSet.has(p)) transitFilterSet.delete(p); else transitFilterSet.add(p);
      chip.classList.toggle('active');
      renderTransitFeed();
    });
  });
}


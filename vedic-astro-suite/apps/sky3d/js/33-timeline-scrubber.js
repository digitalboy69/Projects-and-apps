/* ============================================================================
   TIMELINE SCRUBBER
   ============================================================================ */
function renderTimeline(){
  const track = document.getElementById('tlTrack');
  const fill = document.getElementById('tlFill');
  const playhead = document.getElementById('tlPlayhead');

  const span = timelineWindowEnd - timelineWindowStart;
  const frac = Math.max(0, Math.min(1, (currentJD-timelineWindowStart)/span));
  playhead.style.left = (frac*100)+"%";
  fill.style.width = (frac*100)+"%";

  // Clear old ticks
  track.querySelectorAll('.tl-tick, .tl-tick-label').forEach(el=>el.remove());

  // Ingress ticks (Saturn, Jupiter, Mars for visibility; too many for Moon/Mercury)
  const transitResults = getTransitResults(Math.max(timelineWindowStart, currentJD-30));
  transitResults.filter(e=> ["Saturn","Jupiter","Mars","Rahu","Ketu"].includes(e.planet)).forEach(e=>{
    if (e.jd<timelineWindowStart || e.jd>timelineWindowEnd) return;
    const f = (e.jd-timelineWindowStart)/span;
    const tick = document.createElement('div');
    tick.className = 'tl-tick';
    tick.style.left = (f*100)+"%";
    tick.title = `${e.planet} enters ${SIGNS[e.toSign].name} — ${formatHudDate(e.jd)}`;
    track.appendChild(tick);
  });

  // Conjunction ticks
  const conjResults = getConjResults(Math.max(timelineWindowStart, currentJD-30));
  conjResults.forEach(e=>{
    if (e.jd<timelineWindowStart || e.jd>timelineWindowEnd) return;
    const f = (e.jd-timelineWindowStart)/span;
    const tick = document.createElement('div');
    tick.className = 'tl-tick conjunction';
    tick.style.left = (f*100)+"%";
    tick.title = `${e.planetA} ⚯ ${e.planetB} — ${formatHudDate(e.jd)}`;
    track.appendChild(tick);
  });
}

document.getElementById('tlTrack').addEventListener('click', (e)=>{
  const rect = e.currentTarget.getBoundingClientRect();
  const frac = (e.clientX-rect.left)/rect.width;
  const jd = timelineWindowStart + frac*(timelineWindowEnd-timelineWindowStart);
  jumpToJD(jd);
});

function jumpToJD(jd){
  currentJD = jd;
  if (jd < timelineWindowStart || jd > timelineWindowEnd){
    timelineWindowStart = jd-30;
    timelineWindowEnd = jd+365;
  }
  refreshAll();
}


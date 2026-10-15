/* ===== Shadbala (redesigned) ===== */
const SB_COMPS = [['sthanaBala','Positional','Sthana',true],['digBala','Directional','Dig',false],['kalaBala','Temporal','Kala',true],['chestaBala','Motional','Chesta',false],['naisargikaBala','Natural','Naisargika',false],['drikBala','Aspectual','Drik',false]];
function buildShadbalaSection(chart){
  const sb = chart.shadbala;
  const list = BALA_PLANETS.map(n=>({n, s:sb.planets[n]})).sort((a,b)=> b.s.percentOfRequired - a.s.percentOfRequired);
  const best = list[0], worst = list[list.length-1];
  const strongCount = list.filter(x=>x.s.isStrong).length;
  const maxPct = Math.max(150, ...list.map(x=>x.s.percentOfRequired));
  const reqPos = 100/maxPct*100;

  const rows = list.map((x,i)=>{
    const {n,s} = x, c = DASHA_PLANET_COLORS[n], w = Math.min(100, s.percentOfRequired/maxPct*100);
    const comps = SB_COMPS.map(([k,lab,_sk,nested])=>({lab, v:(nested?s[k].total:s[k])/60}));
    const mx = Math.max(...comps.map(c2=>Math.abs(c2.v)), 0.01);
    return `<div class="shadbala-card sb-row ${s.isStrong?'strong':'weak'}" style="--pc:${c}">
      <button type="button" class="sb-head" data-sb-open>
        <span class="sb-rank">${i+1}</span>
        <span class="sb-glyph" style="background:${c}">${PLANET_GLYPHS[n]}</span>
        <span class="sb-main">
          <span class="sb-top"><b>${n}</b><span class="sb-num">${s.totalRupas.toFixed(2)} <small>/ ${s.requiredRupas} R</small></span></span>
          <span class="sb-track"><i style="width:${w}%;background:${s.isStrong?c:'#C95050'}"></i><u style="left:${reqPos}%"></u></span>
          <span class="sb-sub"><span class="sb-badge ${s.isStrong?'ok':'low'}">${s.isStrong?'Strong':'Below threshold'}</span><span>${s.percentOfRequired.toFixed(0)}% of required</span></span>
        </span>
        <span class="sb-chev">▸</span>
      </button>
      <div class="sb-body" hidden>
        ${comps.map(c2=>`<div class="sb-comp"><span>${c2.lab}</span><span class="sb-ctrack"><i style="width:${Math.max(3,Math.abs(c2.v)/mx*100)}%;background:${c2.v<0?'#C95050':c}"></i></span><b>${c2.v.toFixed(2)}R</b></div>`).join('')}
        <button type="button" class="sb-more planet-clickable" data-planet-click="${n}">Full ${n} details →</button>
      </div>
    </div>`;
  }).join('');

  return `<div class="sb">
    <div class="sb-hero">
      <div class="sb-h strong"><small>Strongest</small><b>${PLANET_GLYPHS[best.n]} ${best.n}</b><span>${best.s.percentOfRequired.toFixed(0)}%</span></div>
      <div class="sb-h weak"><small>Weakest</small><b>${PLANET_GLYPHS[worst.n]} ${worst.n}</b><span>${worst.s.percentOfRequired.toFixed(0)}%</span></div>
      <div class="sb-h"><small>Above threshold</small><b>${strongCount} of ${list.length}</b><span>planets</span></div>
    </div>
    <div class="sb-intro">Planets ranked by total strength. The white tick on each bar marks the required minimum (100%). Tap a planet to see its six components.</div>
    <div class="sb-list">${rows}</div>
    <details class="sb-note"><summary>Time lords at birth</summary>
      <div class="shadbala-lords-row"><div class="shadbala-lord-chip">Day lord: <b>${sb.dinaLord}</b></div><div class="shadbala-lord-chip">Hour lord: <b>${sb.horaLord}</b></div><div class="shadbala-lord-chip">Year lord (approx.): <b>${sb.varshaLord}</b></div><div class="shadbala-lord-chip">Month lord (approx.): <b>${sb.masaLord}</b></div></div>
    </details>
    <details class="sb-note"><summary>How to read this</summary>
      <p>Strength combines six classical measures: positional dignity, directional placement, timing of birth, motional speed, a natural baseline, and aspects received. 1 Rupa = 60 Virupas. Year-Lord and Month-Lord follow one documented convention since classical sources differ on where the solar year/month begins.</p>
    </details>
  </div>`;
}
document.addEventListener('click', (e)=>{
  const o = e.target.closest('[data-sb-open]');
  if (!o) return;
  const row = o.closest('.sb-row'), body = row.querySelector('.sb-body');
  body.hidden = !body.hidden; row.classList.toggle('open', !body.hidden);
});

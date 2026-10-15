/* ============================================================================
   SIGN ASPECTS (Rashi Drishti) — one block per planet, listing every sign it
   is currently casting its graha-drishti gaze onto, whether occupied or not.
   This answers "exactly which area (sign) is each planet aspecting right now".
   ============================================================================ */
function renderSignAspectList(ctx){
  const wrap = document.getElementById('signAspectList');
  const houseLabel = {3:'3rd', 4:'4th (square)', 5:'5th (trine)', 7:'7th (opposition)', 8:'8th', 9:'9th (trine)', 10:'10th'};
  const rows = computeSignAspects(ctx.sidereal);
  const byPlanet = {};
  rows.forEach(r=> (byPlanet[r.from] = byPlanet[r.from]||[]).push(r));

  let html = "";
  PLANET_LIST.forEach(name=>{
    const fromSign = getSignIndex(ctx.sidereal[name]);
    const targets = byPlanet[name] || [];
    const targetsHtml = targets.map(t=>{
      const sign = SIGNS[t.targetSign];
      const occHtml = t.occupants.length
        ? t.occupants.map(p=>`<b onclick="openPlanetDetail('${p}', chartTabContextJD)">${PLANET_GLYPHS[p]} ${p}</b>`).join(', ')
        : `<span class="sa-empty-target">no planets currently there</span>`;
      return `<div class="sa-target-row">
        <span class="sa-house-tag">${houseLabel[t.houseOffset]||t.houseOffset+'th'}</span>
        <span class="sa-sign-name" style="cursor:pointer;" onclick="selectWheelSign(${t.targetSign})">${sign.symbol} ${sign.name}</span>
        <span class="sa-occupants">${occHtml}</span>
      </div>`;
    }).join('');
    html += `<div class="sa-planet-block">
      <div class="sa-planet-head" onclick="openPlanetDetail('${name}', chartTabContextJD)">
        <span class="glyph" style="color:${PLANET_COLORS[name]}">${PLANET_GLYPHS[name]}</span>
        <span class="name">${name}</span>
        <span class="in-sign">in ${SIGNS[fromSign].symbol} ${SIGNS[fromSign].name}</span>
      </div>
      ${targetsHtml}
    </div>`;
  });
  wrap.innerHTML = html;
}

document.getElementById('copySignAspectsBtn').addEventListener('click', () => {
  const ctx = getChartContext(); // Gets current context (Live Sky or Natal)
  const houseLabel = {3:'3rd', 4:'4th (square)', 5:'5th (trine)', 7:'7th (opposition)', 8:'8th', 9:'9th (trine)', 10:'10th'};
  const rows = computeSignAspects(ctx.sidereal);
  const byPlanet = {};
  rows.forEach(r => (byPlanet[r.from] = byPlanet[r.from] || []).push(r));

  let textContent = `Sign Aspects (Rashi Drishti) - ${ctx.label}\n`;
  textContent += `======================================================\n\n`;

  PLANET_LIST.forEach(name => {
    const fromSign = SIGNS[getSignIndex(ctx.sidereal[name])];
    const targets = byPlanet[name] || [];
    
    textContent += `${name} (in ${fromSign.name}):\n`;
    
    if (targets.length === 0) {
      textContent += `  No outgoing aspects.\n`;
    } else {
      targets.forEach(t => {
        const targetSign = SIGNS[t.targetSign];
        const aspectName = houseLabel[t.houseOffset] || t.houseOffset + 'th';
        const occStr = t.occupants.length ? t.occupants.join(', ') : 'empty';
        textContent += `  - ${aspectName} aspect -> ${targetSign.name} (Occupants: ${occStr})\n`;
      });
    }
    textContent += "\n";
  });

  const copyHelper = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      return new Promise((resolve, reject) => {
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed"; ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy') ? resolve() : reject(new Error('Fallback copy failed'));
          document.body.removeChild(ta);
        } catch(e) { reject(e); }
      });
    }
  };

  copyHelper(textContent.trim()).then(() => {
    const btn = document.getElementById('copySignAspectsBtn');
    const origText = btn.textContent;
    btn.textContent = "Copied to Clipboard! ✓";
    btn.style.color = "var(--cyan)";
    btn.style.borderColor = "var(--cyan)";
    setTimeout(() => {
      btn.textContent = origText;
      btn.style.color = "";
      btn.style.borderColor = "";
    }, 2000);
  }).catch(err => {
    alert("Failed to copy text: " + err);
  });
});


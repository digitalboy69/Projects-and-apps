/* ============================================================================
   DATA EXPORT WIRING
   ============================================================================ */
function generateExportData(type) {
  const ctx = getChartContext();
  const snap = snapshotPositions(currentJD);
  let text = "";

  function getSkyText() {
    let t = "--- CURRENT SKY POSITIONS ---\nDate: " + formatFullDate(snap.jd) + "\n\n";
    PLANET_LIST.forEach(name => {
      const lon = snap.sidereal[name];
      const sign = SIGNS[getSignIndex(lon)];
      const dms = degreeInSign(lon);
      const nakIdx = getNakshatraIndex(lon);
      const nak = NAKSHATRAS[nakIdx];
      const pada = getPadaIndex(lon) + 1;
      const speed = planetSpeed(name, currentJD).toFixed(4);
      t += `${name}: ${dms.deg}°${dms.min}'${dms.sec}" ${sign.name} | ${nak} Pada ${pada} | Speed: ${speed}°/d\n`;
    });
    return t + "\n";
  }

  function getTransitsText() {
    let t = "--- UPCOMING TRANSITS (2 Years) ---\n\n";
    const transits = getTransitResults(currentJD).filter(e => transitFilterSet.has(e.planet));
    if (!transits.length) return t + "No transits found in this window.\n\n";
    transits.slice(0, 75).forEach(e => {
      t += `${formatHudDate(e.jd)}: ${e.planet} enters ${SIGNS[e.toSign].name} (from ${SIGNS[e.fromSign].name})\n`;
    });
    return t + "\n";
  }

  function getConjunctionsText() {
    let t = "--- UPCOMING CONJUNCTIONS (2 Years) ---\n\n";
    let conjs = getConjResults(currentJD);
    if (conjSignificanceMode === "major") conjs = conjs.filter(e => e.planetA !== "Moon" && e.planetB !== "Moon");
    if (!conjs.length) return t + "No conjunctions found in this window.\n\n";
    conjs.slice(0, 75).forEach(e => {
      t += `${formatHudDate(e.jd)}: ${e.planetA} & ${e.planetB} in ${SIGNS[e.sign].name}\n`;
    });
    return t + "\n";
  }

  function getAspectsText() {
    let t = "--- PLANETARY ASPECTS (Graha Drishti) ---\n\n";
    const aspects = computeAspects(ctx.sidereal);
    if (!aspects.length) return t + "No aspects found.\n\n";
    aspects.forEach(a => {
      t += `${a.from} aspects ${a.to} in ${SIGNS[a.sign].name} (${a.houseOffset}th house aspect)\n`;
    });
    return t + "\n";
  }

  function getSignAspectsText() {
    let t = "--- SIGN ASPECTS (Rashi Drishti) ---\n\n";
    const rows = computeSignAspects(ctx.sidereal);
    const byPlanet = {};
    rows.forEach(r => (byPlanet[r.from] = byPlanet[r.from] || []).push(r));
    PLANET_LIST.forEach(name => {
      const targets = byPlanet[name] || [];
      t += `${name}:\n`;
      if (!targets.length) t += `  No outgoing aspects.\n`;
      targets.forEach(tgt => {
        const occStr = tgt.occupants.length ? tgt.occupants.join(', ') : 'empty';
        t += `  -> aspects ${SIGNS[tgt.targetSign].name} (${tgt.houseOffset}th aspect, occupants: ${occStr})\n`;
      });
    });
    return t + "\n";
  }

  if (type === 'sky' || type === 'all') text += getSkyText();
  if (type === 'transits' || type === 'all') text += getTransitsText();
  if (type === 'conjunctions' || type === 'all') text += getConjunctionsText();
  if (type === 'aspects' || type === 'all') text += getAspectsText();
  if (type === 'sign_aspects' || type === 'all') text += getSignAspectsText();

  return text.trim();
}

document.getElementById('copyDataBtn').addEventListener('click', () => {
  const type = document.getElementById('exportSelect').value;
  const text = generateExportData(type);
  
  const copyHelper = (txt) => {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(txt);
    } else {
      return new Promise((resolve, reject) => {
        try {
          const ta = document.createElement("textarea");
          ta.value = txt;
          ta.style.position = "fixed"; ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy') ? resolve() : reject(new Error('Fallback copy failed'));
          document.body.removeChild(ta);
        } catch(e) { reject(e); }
      });
    }
  };

  copyHelper(text).then(() => {
    const btn = document.getElementById('copyDataBtn');
    const origText = btn.textContent;
    const status = document.getElementById('exportStatus');
    
    btn.textContent = "Copied! ✓";
    btn.style.filter = "brightness(1.2)";
    status.style.display = 'block';
    
    setTimeout(() => {
      btn.textContent = origText;
      btn.style.filter = "";
      status.style.display = 'none';
    }, 3000);
  }).catch(err => {
    alert("Copy failed: " + err);
  });
});




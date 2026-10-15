/* ---------- Transits: sign-stay timeline for a slow body, Sade Sati & Dhaiya ---------- */
function trStays(name, startJD, endJD, stepDays){
  const sg = jd => getSignIndex(getSiderealLongitudeAt(name, jd));
  const stays = []; let cur = sg(startJD), curStart = null;
  for (let t = startJD + stepDays; t <= endJD; t += stepDays){
    const s = sg(t);
    if (s !== cur){
      let a = t - stepDays, b = t;
      for (let i = 0; i < 40; i++){ const m = (a + b) / 2; if (sg(m) === cur) a = m; else b = m; }
      const x = (a + b) / 2; stays.push({ sign: cur, start: curStart, end: x }); cur = s; curStart = x;
    }
  }
  stays.push({ sign: cur, start: curStart, end: null });
  return stays;
}
/* group Saturn stays whose position relative to the natal Moon is in relSet into cycles (gap < 3 years) */
function trCycles(stays, moonSign, relSet){
  const items = stays.map(s => ({ ...s, rel: (s.sign - moonSign + 12) % 12 })).filter(s => relSet.includes(s.rel));
  const cycles = []; let cur = null; const GAP = 3 * 365.25;
  items.forEach(s => {
    if (cur && s.start !== null && cur.end !== null && s.start - cur.end < GAP) cur.items.push(s);
    else { cur = { items: [s] }; cycles.push(cur); }
    cur.end = s.end;
  });
  return cycles.map(c => {
    const phases = relSet.map(r => {
      const xs = c.items.filter(i => i.rel === r); if (!xs.length) return null;
      return { rel: r, sign: xs[0].sign, start: xs[0].start, end: xs[xs.length - 1].end };
    }).filter(Boolean);
    return { start: c.items[0].start, end: c.items[c.items.length - 1].end, phases };
  });
}
function computeTransits(chart, profile){
  const t0 = chart.julianDay - 3 * 365.25, t1 = chart.julianDay + 100 * 365.25;
  const moonSign = chart.planets.Moon.sign, asc = chart.ascendant.sign;
  const stays = { Saturn: trStays('Saturn', t0, t1, 5), Jupiter: trStays('Jupiter', t0, t1, 5), Rahu: trStays('Rahu', t0, t1, 30), Ketu: trStays('Ketu', t0, t1, 30) };
  return { stays, moonSign, asc,
    sadeSati: trCycles(stays.Saturn, moonSign, [11, 0, 1]).filter(c => c.end === null || c.end > chart.julianDay),
    kantaka: trCycles(stays.Saturn, moonSign, [3]).filter(c => c.end === null || c.end > chart.julianDay),
    ashtama: trCycles(stays.Saturn, moonSign, [7]).filter(c => c.end === null || c.end > chart.julianDay) };
}


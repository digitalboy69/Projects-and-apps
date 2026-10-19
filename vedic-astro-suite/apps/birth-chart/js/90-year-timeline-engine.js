/* ============================================================================
   YEAR TIMELINE ENGINE  (data only, no wording about life)
   Scans a date range and returns facts for the "Year Timeline File": sign changes, nakshatra changes, stations,
   transit contacts with the natal chart (with orb windows), lunations and eclipses, Vimshottari changes at three levels,
   Sade Sati / Dhaiya periods and slow-planet "touch" segments (Jupiter + Saturn + nodes on each house).
   Plan and sources: docs/YEAR_TIMELINE_RESEARCH.md.  Exposes one global: YT.
   Depends on: getSiderealLongitudeAt, planetGeocentricLongitude, lahiriAyanamsa, isRetrograde, getPlanetSpeed, angDiffSigned,
   normDeg, getSignIndex, getDegInSign, getNakshatra, NAKSHATRAS, SIGNS, getAspectedHouses, jdToDate, computeTransits,
   calculateSubPeriods, findActiveDasha, dfMoonLat (optional: eclipse flag), DF_LIM_SOLAR / DF_LIM_LUNAR (optional).
   Conventions: sidereal Lahiri, whole-sign houses from the Lagna (and from the natal Moon), 365.25-day dasha years.
   ============================================================================ */
const YT = (function(){
  'use strict';
  const VERSION = 1;
  const GRAHA = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  const OUTER = ['Uranus','Neptune','Pluto'];
  const KAKSHYA = ['Saturn','Jupiter','Mars','Sun','Venus','Mercury','Moon','Lagna'];   // eight 3d45m parts of a sign, in this order
  const ORB = 1.0;                                                                       // degrees, for transit contacts
  const SAMPLE = { Sun:1, Moon:0.05, Mars:0.5, Mercury:0.5, Venus:1, Jupiter:1, Saturn:1, Rahu:2, Ketu:2, Uranus:2, Neptune:2, Pluto:2 };   // days between samples
  const HIT_PLANETS = ['Saturn','Jupiter','Mars','Rahu','Ketu'];
  // exact-angle offsets of each transiting planet's aspects: 7th = 180; Mars 4th/8th; Jupiter 5th/9th; Saturn 3rd/10th (graha drishti). Nodes: conjunction only.
  const HIT_OFFSETS = { Saturn:[[0,'conjunct'],[180,'7th aspect'],[60,'3rd aspect'],[270,'10th aspect']],
                        Jupiter:[[0,'conjunct'],[180,'7th aspect'],[120,'5th aspect'],[240,'9th aspect']],
                        Mars:[[0,'conjunct'],[180,'7th aspect'],[90,'4th aspect'],[210,'8th aspect']],
                        Rahu:[[0,'conjunct']], Ketu:[[0,'conjunct']] };
  const TYPE_ORDER = { 'DASHA-CHANGE':0, INGRESS:1, STATION:2, NAKSHATRA:3, HIT:4, LUNATION:5, ECLIPSE:5, 'SADE-SATI':6 };

  const lc = s => s.toLowerCase();
  function lon(name, jd){
    if (OUTER.indexOf(name) >= 0) return normDeg(planetGeocentricLongitude(lc(name), jd) - lahiriAyanamsa(jd));
    return getSiderealLongitudeAt(name, jd);
  }
  function retro(name, jd){
    if (name === 'Rahu' || name === 'Ketu') return true;      // mean node: always retrograde (same as the chart engine)
    if (name === 'Sun' || name === 'Moon') return false;
    return isRetrograde(lc(name), jd);
  }
  function speed(name, jd){
    if (OUTER.indexOf(name) >= 0){ const d = angDiffSigned(lon(name, jd + 0.5), lon(name, jd - 0.5)); return d; }
    return getPlanetSpeed(name, jd);
  }
  function bisect(pred, a, b){                                  // pred(a) !== pred(b); returns the switch time
    const pa = pred(a);
    for (let i = 0; i < 38; i++){ const m = (a + b) / 2; if (pred(m) === pa) a = m; else b = m; }
    return (a + b) / 2;
  }
  const jsToJD = ms => ms / 86400000 + 2440587.5;
  const dateToJD = d => jsToJD(d.getTime());
  function series(name, s0, e0){
    const st = SAMPLE[name], t = [], l = [], r = [];
    for (let x = s0; x < e0 + st * 0.999; x += st){ const tt = Math.min(x, e0); t.push(tt); l.push(lon(name, tt)); r.push(retro(name, tt)); if (tt >= e0) break; }
    return { t, l, r };
  }

  /* where a longitude sits: sign, degree, nakshatra, pada, houses from Lagna and from natal Moon, Ashtakavarga points, Kakshya part */
  function place(chart, name, L, jd){
    const asc = chart.ascendant.sign, moon = chart.planets.Moon.sign, sg = getSignIndex(L), nk = getNakshatra(L), deg = getDegInSign(L);
    const out = { name, lon: L, sign: sg, deg, nak: nk.index, pada: nk.pada, houseL: ((sg - asc + 12) % 12) + 1, houseM: ((sg - moon + 12) % 12) + 1,
                  rx: jd == null ? null : retro(name, jd), sav: chart.ashtakavarga.sav[sg],
                  kakshyaIdx: Math.floor(deg / 3.75) };
    out.kakshya = KAKSHYA[Math.min(7, out.kakshyaIdx)];
    const tb = chart.ashtakavarga.bavTables[name]; out.bav = tb ? tb[sg] : null;
    return out;
  }

  function natalPoints(chart){
    const pts = GRAHA.map(n => ({ name: n, lon: chart.siderealLongitudes[n] }));
    pts.push({ name: 'Lagna', lon: chart.ascendant.longitude });
    return pts;
  }

  /* ---- sign / nakshatra / station events from a sampled series ---- */
  function bodyEvents(chart, name, ser, ev, s0, e0){
    const sgOf = L => getSignIndex(L), nkOf = L => Math.floor(normDeg(L) / (360 / 27));
    for (let k = 1; k < ser.t.length; k++){
      const a = ser.t[k - 1], b = ser.t[k];
      if (sgOf(ser.l[k]) !== sgOf(ser.l[k - 1])){
        const x = bisect(j => sgOf(lon(name, j)) === sgOf(ser.l[k - 1]), a, b);
        if (x > s0 && x <= e0) ev.push({ type: 'INGRESS', planet: name, jd: x, from: sgOf(ser.l[k - 1]), to: sgOf(ser.l[k]), at: place(chart, name, lon(name, x + 1e-6), x + 1e-6) });
      }
      if (nkOf(ser.l[k]) !== nkOf(ser.l[k - 1])){
        const x = bisect(j => nkOf(lon(name, j)) === nkOf(ser.l[k - 1]), a, b);
        if (x > s0 && x <= e0) ev.push({ type: 'NAKSHATRA', planet: name, jd: x, from: nkOf(ser.l[k - 1]), to: nkOf(ser.l[k]), at: place(chart, name, lon(name, x + 1e-6), x + 1e-6) });
      }
      if (name !== 'Rahu' && name !== 'Ketu' && name !== 'Sun' && name !== 'Moon' && ser.r[k] !== ser.r[k - 1]){
        const x = bisect(j => retro(name, j), a, b);
        if (x > s0 && x <= e0) ev.push({ type: 'STATION', planet: name, jd: x, to: ser.r[k] ? 'retrograde' : 'direct', at: place(chart, name, lon(name, x), null) });
      }
    }
  }

  /* ---- transit planet hitting a natal point: orb windows with exact passes ---- */
  function hitEvents(chart, name, ser, pts, ev, s0, e0){
    HIT_OFFSETS[name].forEach(([off, label]) => {
      pts.forEach(p => {
        const g = j => angDiffSigned(normDeg(lon(name, j) + off), p.lon);
        const gs = ser.l.map(l => angDiffSigned(normDeg(l + off), p.lon));
        const n = gs.length; let k = 0;
        while (k < n){
          if (Math.abs(gs[k]) >= ORB){ k++; continue; }
          let i0 = k; while (k + 1 < n && Math.abs(gs[k + 1]) < ORB) k++; const i1 = k; k++;
          const clipS = i0 === 0, clipE = i1 === n - 1;
          const enter = clipS ? ser.t[0] : bisect(j => Math.abs(g(j)) < ORB, ser.t[i0 - 1], ser.t[i0]);
          const leave = clipE ? ser.t[n - 1] : bisect(j => Math.abs(g(j)) < ORB, ser.t[i1], ser.t[i1 + 1]);
          const exact = []; let minAbs = 99;
          for (let q = i0; q <= i1; q++) minAbs = Math.min(minAbs, Math.abs(gs[q]));
          for (let q = Math.max(i0 - 1, 0); q <= Math.min(i1, n - 2); q++){
            if (gs[q] * gs[q + 1] < 0 && Math.abs(gs[q]) < 30 && Math.abs(gs[q + 1]) < 30){
              const neg = gs[q] < 0; const x = bisect(j => (g(j) < 0) === neg, ser.t[q], ser.t[q + 1]);
              if (x >= s0 && x <= e0) exact.push(x);
            }
          }
          if (exact.length) minAbs = 0;
          ev.push({ type: 'HIT', planet: name, aspect: label, natal: p.name, natalLon: p.lon, jd: enter, enter, leave, exact, minOrb: minAbs,
                    clipS, clipE, at: place(chart, name, lon(name, exact[0] || enter), exact[0] || enter) });
        }
      });
    });
  }

  /* ---- new / full moons, eclipses ---- */
  function lunationEvents(chart, pts, ev, s0, e0){
    const el = j => normDeg(lon('Moon', j) - lon('Sun', j));
    let prevT = s0 - 0.25, prev = el(prevT);
    for (let x = s0; x <= e0 + 0.25; x += 0.25){
      const cur = el(x); let kind = null, pred = null;
      if (prev > 300 && cur < 60){ kind = 'new'; pred = j => el(j) < 180; }
      else if (prev < 180 && cur >= 180){ kind = 'full'; pred = j => el(j) >= 180; }
      if (kind){
        const t = bisect(pred, prevT, x);
        if (t > s0 && t <= e0){
          const sun = lon('Sun', t), moon = lon('Moon', t);
          let ecl = null;
          if (typeof dfMoonLat === 'function'){
            const lat = Math.abs(dfMoonLat(t));
            if (kind === 'new' && lat < (typeof DF_LIM_SOLAR === 'number' ? DF_LIM_SOLAR : 1.55)) ecl = 'solar';
            if (kind === 'full' && lat < (typeof DF_LIM_LUNAR === 'number' ? DF_LIM_LUNAR : 1.0)) ecl = 'lunar';
          }
          const key = kind === 'new' ? sun : moon;                  // the degree where the lunation / eclipse happens
          const contacts = [];
          pts.forEach(p => { const d = Math.abs(angDiffSigned(key, p.lon)); if (d <= 3) contacts.push({ natal: p.name, orb: d, how: 'conjunct' }); });
          ev.push({ type: ecl ? 'ECLIPSE' : 'LUNATION', kind, eclipse: ecl, jd: t, at: place(chart, kind === 'new' ? 'Sun' : 'Moon', key, null), contacts });
        }
      }
      prevT = x; prev = cur;
    }
  }

  /* ---- Vimshottari: every period that touches the range, and the change points ---- */
  function dashaPeriods(chart, jd0, jd1){
    const d0 = jdToDate(jd0), d1 = jdToDate(jd1), out = [];
    chart.dashaData.mahadashas.forEach(m => {
      if (m.endDate <= d0 || m.startDate >= d1) return;
      calculateSubPeriods(m).forEach(a => {
        if (a.endDate <= d0 || a.startDate >= d1) return;
        calculateSubPeriods(a).forEach(p => {
          if (p.endDate <= d0 || p.startDate >= d1) return;
          out.push({ md: m.lord, ad: a.lord, pd: p.lord, start: dateToJD(p.startDate), end: dateToJD(p.endDate),
                     mdStart: dateToJD(m.startDate), mdEnd: dateToJD(m.endDate), adStart: dateToJD(a.startDate), adEnd: dateToJD(a.endDate) });
        });
      });
    });
    out.sort((x, y) => x.start - y.start);
    return out;
  }
  function dashaEvents(pds, ev, s0, e0){
    for (let i = 1; i < pds.length; i++){
      const a = pds[i - 1], b = pds[i];
      if (b.start > s0 && b.start <= e0){
        const level = a.md !== b.md ? 'Mahadasha' : a.ad !== b.ad ? 'Antardasha' : 'Pratyantardasha';
        ev.push({ type: 'DASHA-CHANGE', level, jd: b.start, from: [a.md, a.ad, a.pd], to: [b.md, b.ad, b.pd] });
      }
    }
  }

  /* how a natal planet links to a house: rules it (sign lord), sits in it, aspects it (graha drishti) */
  function links(chart, planet, house){
    const out = [], asc = chart.ascendant.sign;
    if (SIGNS[(asc + house - 1) % 12].lord === planet) out.push('rules');
    const P = chart.planets[planet];
    if (P){
      if (P.house === house) out.push('sits in');
      else if (getAspectedHouses(planet, P.house).indexOf(house) >= 0) out.push('aspects');
    }
    return out;
  }

  /* ---- slow-planet touch segments: Jupiter and Saturn (occupy or aspect) + nodes (occupy), per house ---- */
  function segments(chart, pds, ev, s0, e0){
    const cut = [s0, e0];
    ev.forEach(x => { if (x.type === 'INGRESS' && (x.planet === 'Jupiter' || x.planet === 'Saturn' || x.planet === 'Rahu')) cut.push(x.jd); });
    pds.forEach(p => { if (p.start > s0 && p.start < e0) cut.push(p.start); });
    cut.sort((a, b) => a - b);
    const asc = chart.ascendant.sign, moon = chart.planets.Moon.sign, out = [];
    for (let i = 0; i < cut.length - 1; i++){
      const a = cut[i], b = cut[i + 1]; if (b - a < 1e-4) continue;
      const mid = (a + b) / 2, pd = pds.find(p => mid >= p.start && mid < p.end) || null;
      const sg = n => getSignIndex(lon(n, mid));
      const J = sg('Jupiter'), S = sg('Saturn'), Ra = sg('Rahu'), Ke = sg('Ketu');
      const frame = base => {
        const hs = s => ((s - base + 12) % 12) + 1, hJ = hs(J), hS = hs(S), hRa = hs(Ra), hKe = hs(Ke), rows = [];
        for (let h = 1; h <= 12; h++){
          const jt = (h - hJ + 12) % 12, st = (h - hS + 12) % 12;
          const j = jt === 0 ? 'occupies' : [4, 6, 8].indexOf(jt) >= 0 ? 'aspects' : null;
          const s = st === 0 ? 'occupies' : [2, 6, 9].indexOf(st) >= 0 ? 'aspects' : null;
          const nodes = []; if (h === hRa) nodes.push('Rahu'); if (h === hKe) nodes.push('Ketu');
          if (j && s) rows.push({ house: h, jupiter: j, saturn: s, nodes });
        }
        return { hJ, hS, hRa, hKe, rows };
      };
      const fL = frame(asc), fM = frame(moon);
      const chain = pd ? [['Mahadasha', pd.md], ['Antardasha', pd.ad], ['Pratyantardasha', pd.pd]] : [];
      const dl = h => chain.map(([lv, pl]) => ({ lv, pl, l: links(chart, pl, h) })).filter(x => x.l.length);
      fL.rows.forEach(r => r.dasha = dl(r.house));
      out.push({ start: a, end: b, J, S, Ra, Ke, chain: pd ? [pd.md, pd.ad, pd.pd] : null, fromLagna: fL, fromMoon: fM });
    }
    return out;
  }

  /* ---- main ---- */
  function scan(chart, profile, o){
    o = o || {};
    const s0 = o.startJD, e0 = o.endJD, tz = chart.tzOffsetHours;
    const warnings = [];
    if (!(e0 > s0)) throw new Error('End date must be after the start date');
    const yr = jd => jdToDate(jd).getUTCFullYear();
    if (yr(s0) < 1801 || yr(e0) > 2049) warnings.push('Part of this range is outside 1801-2049, where the planet formulas are not reliable.');
    const bodies = GRAHA.filter(n => n !== 'Moon' || o.moon).concat(o.outer ? OUTER : []);
    const ev = [], pts = natalPoints(chart), serByName = {};
    bodies.forEach(n => {
      const ser = series(n, s0, e0); serByName[n] = ser;
      bodyEvents(chart, n, ser, ev, s0, e0);
    });
    HIT_PLANETS.forEach(n => hitEvents(chart, n, serByName[n], pts, ev, s0, e0));
    lunationEvents(chart, pts, ev, s0, e0);
    const pdsAll = dashaPeriods(chart, s0, e0 + 3 * 365.25);
    const pds = pdsAll.filter(p => p.start < e0 && p.end > s0);
    dashaEvents(pdsAll, ev, s0, e0);

    // Sade Sati and Dhaiya periods that touch the range
    const tr = computeTransits(chart, profile), cyc = [];
    const addCycles = (list, kind) => list.forEach(c => { if ((c.end == null || c.end > s0) && c.start < e0) cyc.push({ kind, start: c.start, end: c.end, phases: c.phases.map(p => ({ rel: p.rel + 1, sign: p.sign, start: p.start, end: p.end })) }); });
    addCycles(tr.sadeSati, 'Sade Sati'); addCycles(tr.kantaka, 'Dhaiya (Saturn 4th from Moon)'); addCycles(tr.ashtama, 'Dhaiya (Saturn 8th from Moon)');
    cyc.forEach(c => c.phases.forEach(p => {
      [['start', p.start], ['end', p.end]].forEach(([w, t]) => { if (t != null && t > s0 && t <= e0) ev.push({ type: 'SADE-SATI', cycle: c.kind, phase: p.rel, sign: p.sign, edge: w, jd: t }); });
    }));

    ev.sort((a, b) => a.jd - b.jd || TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);
    ev.forEach((e, i) => { e.id = 'E' + String(i + 1).padStart(3, '0'); });

    // state at the start
    const startState = bodies.map(n => { const L = lon(n, s0); const p = place(chart, n, L, s0); p.speed = speed(n, s0); return p; });
    const active = findActiveDasha(chart.dashaData.mahadashas, jdToDate(s0));
    const startDasha = active ? { md: active.mahadasha.lord, ad: active.antardasha && active.antardasha.lord, pd: active.pratyantardasha && active.pratyantardasha.lord, sd: active.sookshmaDasha && active.sookshmaDasha.lord } : null;
    const nextAfter = pdsAll.filter(p => p.start >= e0).sort((a, b) => a.start - b.start)[0] || null;
    const counts = {}; ev.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
    return { version: VERSION, startJD: s0, endJD: e0, tz, orb: ORB, opts: { moon: !!o.moon, outer: !!o.outer, ask: o.ask !== false }, warnings, bodies,
             events: ev, startState, startDasha, nextAfter, periods: pds, cycles: cyc, segments: segments(chart, pds, ev, s0, e0), counts,
             ayanamsaStart: lahiriAyanamsa(s0) };
  }

  return { scan, lon, place, links, GRAHA, OUTER, KAKSHYA, ORB, VERSION };
})();
if (typeof window !== 'undefined') window.YT = YT;

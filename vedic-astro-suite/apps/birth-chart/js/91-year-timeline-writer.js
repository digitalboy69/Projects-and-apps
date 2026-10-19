/* ============================================================================
   YEAR TIMELINE WRITER  (turns YT.scan() output into one structured Markdown file for an AI)
   Facts only. No life predictions are written here. Plan: docs/YEAR_TIMELINE_RESEARCH.md
   Exposes: YTW.write(chart, profile, result) -> { text, tokens }
   Depends on: YT (90-), SIGNS, NAKSHATRAS, AREAS (70-), VDB (87-, optional), jdToLocalParts, getAspectedHouses, getNakshatra.
   ============================================================================ */
const YTW = (function(){
  'use strict';
  const HOUSE_WORDS = { 1:'self, body, vitality', 2:'money, family, speech, food', 3:'effort, courage, siblings, skills', 4:'home, mother, property, peace of mind',
    5:'children, intellect, creativity, romance', 6:'work/service, health problems, debts, enemies', 7:'spouse, partnerships, public dealings', 8:'sudden change, hidden matters, longevity, shared money',
    9:'luck, father, teachers, long journeys, belief', 10:'career, status, action in the world', 11:'gains, income, friends, wishes fulfilled', 12:'expenses, loss, foreign lands, sleep, retreat' };
  const NATURAL = { Sun:'soul, authority, father, government', Moon:'mind, mother, emotions, public', Mars:'energy, courage, brothers, property, conflict', Mercury:'speech, trade, learning, nerves',
    Jupiter:'wisdom, children, wealth, teachers, luck', Venus:'love, spouse, comfort, arts, vehicles', Saturn:'work, delay, discipline, servants, long effort', Rahu:'obsession, foreign things, sudden rise, illusion', Ketu:'detachment, loss, spiritual cutting-off, past-life skill' };
  const sn = i => SIGNS[i].name;
  const ord = n => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
  let TZ = 0;
  const T = jd => { const p = jdToLocalParts(jd, TZ); return p.dateStr + ' ' + p.timeStr.slice(0, 5); };
  const D = jd => jdToLocalParts(jd, TZ).dateStr;
  const dg = (L) => { const d = L % 30; return Math.floor(d) + '°' + String(Math.round((d % 1) * 60)).padStart(2, '0') + "'"; };
  const nakName = i => NAKSHATRAS[i].name;
  const tzLabel = tz => 'UTC' + (tz >= 0 ? '+' : '-') + String(Math.floor(Math.abs(tz))).padStart(2, '0') + ':' + String(Math.round((Math.abs(tz) % 1) * 60)).padStart(2, '0');

  function roleTable(chart){
    const asc = chart.ascendant.sign, fn = (typeof VDB !== 'undefined' && VDB.functionalNature) ? VDB.functionalNature(asc) : null, R = {};
    ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].forEach(n => {
      const p = chart.planets[n], rules = []; for (let h = 1; h <= 12; h++) if (SIGNS[(asc + h - 1) % 12].lord === n) rules.push(h);
      const kar = (typeof AREAS !== 'undefined' ? AREAS : []).filter(a => a.k.indexOf(n) >= 0).map(a => a.n);
      const disp = SIGNS[p.sign].lord, dp = chart.planets[disp];
      const sb = chart.shadbala && chart.shadbala.planets && chart.shadbala.planets[n];
      R[n] = { rules, house: p.house, sign: p.sign, kar, disp, dispHouse: dp ? dp.house : null, fn: fn && fn[n] ? fn[n] : null,
               dignity: (p.dignity && p.dignity.status) || '', rx: !!p.retrograde && n !== 'Rahu' && n !== 'Ketu', comb: !!(p.combustion && p.combustion.combust),
               shad: sb ? Math.round(sb.percentOfRequired) + '% of required (' + (sb.isStrong ? 'strong' : 'weak') + ')' : null,
               bavOwn: chart.ashtakavarga.bavTables[n] ? chart.ashtakavarga.bavTables[n][p.sign] : null };
    });
    return R;
  }
  const tag = (R, n) => R[n] ? '[' + n + (R[n].rules.length ? ' rules H' + R[n].rules.join(',H') : (n === 'Rahu' || n === 'Ketu') ? ' node' : '') + '; natal H' + R[n].house + ']' : '';
  const nat = (R, n) => n === 'Lagna' ? '' : tag(R, n);

  function write(chart, profile, res){
    TZ = chart.tzOffsetHours; const R = roleTable(chart), asc = chart.ascendant.sign, L = [];
    const name = (profile && profile.name) || 'Native', P = chart.planets;
    const push = s => L.push(s);
    // ---------- 0
    push('# YEAR TIMELINE FILE: ' + name);
    push('Range: ' + T(res.startJD) + ' to ' + T(res.endJD) + ' (' + tzLabel(TZ) + ', birth-place time). Made by Vedic Astro Suite, file format v' + res.version + '.');
    push('');
    push('## 0. HOW TO READ THIS FILE (rules for the AI)');
    push('1. Everything below is calculated data. Nothing is a prediction. You do the interpreting.');
    push('2. Use only the facts in this file. If something is not here, say it is not known. Do not invent dates.');
    push('3. Sidereal zodiac, Lahiri ayanamsa. Houses are whole-sign: house 1 is the Lagna sign. "H" = house from the Lagna unless the text says "from Moon".');
    push('4. Section 3 says what each planet controls in THIS native\'s life (houses it rules, where it sits, strength). Judge every event through that role, not through generic planet meaning.');
    push('5. Vimshottari dasha (Section 6) is the main timer: events matter most when they touch the running dasha lords or the houses those lords rule or sit in.');
    push('6. "Double transit" in Section 11 only means Jupiter and Saturn both occupy or aspect the same house at the same time. It is a fact, not a verdict.');
    push('7. Event IDs (E001...) are in time order. Cite them when you explain. Times are approximate to about one minute; "orb" is the angle in degrees between the two points.');
    push('8. Give themes as possibilities with the dates that support them. Mention what is uncertain.');
    push('');
    // ---------- 1
    push('## 1. NATIVE');
    push('- Name: ' + name + (profile && profile.dob ? ' | Born: ' + profile.dob + (profile.tob ? ' ' + profile.tob : '') + ' (' + tzLabel(TZ) + ')' : ''));
    push('- Lagna: ' + sn(asc) + ' ' + dg(chart.ascendant.longitude) + ', nakshatra ' + nakName(chart.ascendant.nakshatra.index) + ' pada ' + chart.ascendant.nakshatra.pada + ' | Lagna lord: ' + SIGNS[asc].lord + ' in H' + P[SIGNS[asc].lord].house);
    push('- Moon sign (Rashi): ' + sn(P.Moon.sign) + ', nakshatra ' + nakName(P.Moon.nakshatra.index) + ' pada ' + P.Moon.nakshatra.pada + ' | Sun sign: ' + sn(P.Sun.sign));
    push('- Ayanamsa (Lahiri) at start of range: ' + res.ayanamsaStart.toFixed(4) + '°');
    push('');
    // ---------- 2
    push('## 2. NATAL PLANETS');
    push('| Planet | Sign | Degree | House | Nakshatra (pada) | Motion | Dignity | Notes |');
    push('|---|---|---|---|---|---|---|---|');
    ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].forEach(n => {
      const p = P[n], r = R[n], nt = [];
      if (r.comb) nt.push('combust'); if (p.war) nt.push('planetary war');
      push('| ' + n + ' | ' + sn(p.sign) + ' | ' + dg(p.longitude) + ' | H' + p.house + ' | ' + nakName(p.nakshatra.index) + ' (' + p.nakshatra.pada + ') | ' + (n === 'Rahu' || n === 'Ketu' ? 'node' : r.rx ? 'retrograde' : 'direct') + ' | ' + (r.dignity || '-') + ' | ' + nt.join(', ') + ' |');
    });
    push('');
    // ---------- 3
    push('## 3. WHAT EACH PLANET CONTROLS IN THIS LIFE');
    push('Running dasha lords at the start: ' + (res.startDasha ? 'Mahadasha ' + res.startDasha.md + ', Antardasha ' + res.startDasha.ad + ', Pratyantardasha ' + res.startDasha.pd : 'unknown') + '. They are flagged "RUNNING" below.');
    const run = res.startDasha ? [res.startDasha.md, res.startDasha.ad, res.startDasha.pd] : [];
    const during = {}; res.periods.forEach(p => { [p.md, p.ad, p.pd].forEach(x => during[x] = true); });
    ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].forEach(n => {
      const r = R[n]; push('');
      push('### ' + n + (run.indexOf(n) >= 0 ? '  (RUNNING dasha lord at start)' : during[n] ? '  (a dasha lord during this range)' : ''));
      if (r.rules.length) push('- Rules: ' + r.rules.map(h => 'H' + h + ' (' + HOUSE_WORDS[h] + ')').join('; '));
      else push('- Rules no house (shadow planet). It acts through its sign lord ' + r.disp + ' and the house it sits in.');
      push('- Sits in: H' + r.house + ' (' + HOUSE_WORDS[r.house] + '), ' + sn(r.sign) + (r.dignity ? ', ' + r.dignity : '') + (r.rx ? ', retrograde' : '') + (r.comb ? ', combust' : ''));
      push('- Sign lord (dispositor): ' + r.disp + (r.dispHouse ? ' in H' + r.dispHouse : ''));
      if (r.fn && r.fn.tags.length) push('- Lordship type for this Lagna: ' + r.fn.tags.join(', '));
      push('- Natural meaning: ' + NATURAL[n]);
      if (r.kar.length) push('- Life areas it is a natural indicator for: ' + r.kar.join(', '));
      if (r.shad) push('- Shadbala: ' + r.shad);
      if (r.bavOwn != null) push('- Ashtakavarga points in its own natal sign: ' + r.bavOwn + '/8');
    });
    push('');
    // ---------- 4
    push('## 4. HOUSE MAP');
    push('| House | Sign | Lord (sits in) | Occupants | Aspected by (graha drishti) | SAV points | Themes |');
    push('|---|---|---|---|---|---|---|');
    for (let h = 1; h <= 12; h++){
      const sg = (asc + h - 1) % 12, lord = SIGNS[sg].lord, occ = Object.keys(P).filter(n => P[n].house === h);
      const asp = Object.keys(P).filter(n => P[n].house !== h && getAspectedHouses(n, P[n].house).indexOf(h) >= 0);
      push('| H' + h + ' | ' + sn(sg) + ' | ' + lord + ' (H' + P[lord].house + ') | ' + (occ.join(', ') || '-') + ' | ' + (asp.join(', ') || '-') + ' | ' + chart.ashtakavarga.sav[sg] + ' | ' + HOUSE_WORDS[h] + ' |');
    }
    push('Ashtakavarga note: total 337 points, average 28 per sign. Individual planet scores run 0-8.');
    push('');
    // ---------- 5
    push('## 5. NATAL LINKS BETWEEN PLANETS');
    const pn = Object.keys(P), seen = {};
    pn.forEach(a => pn.forEach(b => {
      if (a === b) return;
      if (P[a].sign === P[b].sign){ const k = [a, b].sort().join('+'); if (!seen[k]){ seen[k] = 1; push('- Conjunction: ' + a + ' + ' + b + ' in ' + sn(P[a].sign) + ' (H' + P[a].house + ')'); } }
      else if (getAspectedHouses(a, P[a].house).indexOf(P[b].house) >= 0 && a !== 'Rahu' && a !== 'Ketu') push('- ' + a + ' (H' + P[a].house + ') aspects ' + b + ' (H' + P[b].house + ')');
    }));
    push('');
    // ---------- 6
    push('## 6. VIMSHOTTARI DASHA IN THIS RANGE');
    push('Dasha years are 365.25 days. Each line is one Pratyantardasha (the third level) that touches the range.');
    push('| Mahadasha | Antardasha | Pratyantardasha | From | To |');
    push('|---|---|---|---|---|');
    res.periods.forEach(p => push('| ' + p.md + ' (to ' + D(p.mdEnd) + ') | ' + p.ad + ' (to ' + D(p.adEnd) + ') | ' + p.pd + ' | ' + D(p.start) + ' | ' + D(p.end) + ' |'));
    if (res.nextAfter) push('Next change after this range: ' + res.nextAfter.md + '/' + res.nextAfter.ad + '/' + res.nextAfter.pd + ' begins ' + D(res.nextAfter.start) + '.');
    push('');
    // ---------- 7
    push('## 7. STATE AT THE START (' + T(res.startJD) + ')');
    push('| Planet | Sign | Degree | Nakshatra (pada) | H from Lagna | H from Moon | Motion | SAV of sign | Own BAV there | Kakshya part |');
    push('|---|---|---|---|---|---|---|---|---|---|');
    res.startState.forEach(s => push('| ' + s.name + ' | ' + sn(s.sign) + ' | ' + dg(s.lon) + ' | ' + nakName(s.nak) + ' (' + s.pada + ') | H' + s.houseL + ' | ' + s.houseM + ' | ' + (s.name === 'Rahu' || s.name === 'Ketu' ? 'node' : s.rx ? 'retrograde' : 'direct') + ' | ' + s.sav + ' | ' + (s.bav == null ? '-' : s.bav) + ' | ' + s.kakshya + ' |'));
    push('');
    // ---------- 8
    push('## 8. MASTER TIMELINE (every event, in time order)');
    push('Types: DASHA-CHANGE, INGRESS (planet changes sign), NAKSHATRA (planet changes nakshatra), STATION (turns retrograde or direct), HIT (transiting planet contacts a natal point within ' + res.orb + '° orb), LUNATION / ECLIPSE (new or full moon), SADE-SATI (phase change).');
    push('Role tags in [brackets] are the natal role from Section 3.');
    push('');
    const hitLeaveTxt = e => (e.clipS ? '(already active at range start) ' : '') + D(e.enter) + ' to ' + D(e.leave) + (e.clipE ? ' (continues after range end)' : '');
    res.events.forEach(e => {
      const w = T(e.jd); let s = '';
      if (e.type === 'DASHA-CHANGE') s = e.level + ' changes: ' + e.from.join('/') + ' -> ' + e.to.join('/') + '. New lord roles: ' + e.to.map(x => nat(R, x)).join(' ');
      else if (e.type === 'INGRESS'){ const a = e.at; s = e.planet + ' ' + nat(R, e.planet) + ' enters ' + sn(e.to) + ' (from ' + sn(e.from) + ') | H' + a.houseL + ' from Lagna, ' + a.houseM + ' from Moon | SAV ' + a.sav + (a.bav != null ? ', own BAV ' + a.bav : '') + (a.rx ? ' | retrograde' : ''); }
      else if (e.type === 'NAKSHATRA'){ const a = e.at; s = e.planet + ' ' + nat(R, e.planet) + ' moves into ' + nakName(e.to) + ' (lord ' + NAKSHATRAS[e.to].lord + '), pada ' + a.pada + ' | in ' + sn(a.sign) + ', H' + a.houseL + ' from Lagna'; }
      else if (e.type === 'STATION'){ const a = e.at; s = e.planet + ' ' + nat(R, e.planet) + ' turns ' + e.to.toUpperCase() + ' at ' + dg(a.lon) + ' ' + sn(a.sign) + ' (' + nakName(a.nak) + ') | H' + a.houseL + ' from Lagna, ' + a.houseM + ' from Moon'; }
      else if (e.type === 'HIT'){ const a = e.at; s = e.planet + ' (transit) ' + e.aspect + ' natal ' + e.natal + ' ' + nat(R, e.natal) + ' at ' + dg(e.natalLon) + ' ' + sn(Math.floor(e.natalLon / 30)) + ' | within ' + res.orb + '°: ' + hitLeaveTxt(e) + ' | ' + (e.exact.length ? 'exact: ' + e.exact.map(T).join(', ') : 'closest orb ' + e.minOrb.toFixed(2) + '°') + ' | transiting planet in ' + sn(a.sign) + ', H' + a.houseL; }
      else if (e.type === 'LUNATION' || e.type === 'ECLIPSE'){ const a = e.at; s = (e.kind === 'new' ? 'New Moon' : 'Full Moon') + (e.eclipse ? ' = ' + e.eclipse.toUpperCase() + ' ECLIPSE' : '') + ' at ' + dg(a.lon) + ' ' + sn(a.sign) + ' (' + nakName(a.nak) + ') | H' + a.houseL + ' from Lagna, ' + a.houseM + ' from Moon' + (e.contacts.length ? ' | within 3° of natal: ' + e.contacts.map(c => c.natal + ' (' + c.orb.toFixed(1) + '°)').join(', ') : ''); }
      else if (e.type === 'SADE-SATI') s = e.cycle + ': Saturn in the ' + ord(e.phase) + ' sign from natal Moon (' + sn(e.sign) + ') ' + (e.edge === 'start' ? 'begins' : 'ends');
      push('- **' + e.id + '** | ' + w + ' | ' + e.type + ' | ' + s);
    });
    push('');
    // ---------- 9
    push('## 9. PERIODS ACTIVE DURING THE RANGE');
    const stat = res.events.filter(e => e.type === 'STATION');
    if (res.cycles.length){ push('### Saturn cycles from natal Moon'); res.cycles.forEach(c => push('- ' + c.kind + ': ' + D(c.start) + ' to ' + (c.end ? D(c.end) : 'open') + '; phases: ' + c.phases.map(p => p.rel + ' = Saturn in ' + sn(p.sign) + ' (' + D(p.start) + ' to ' + (p.end ? D(p.end) : '?') + ')').join('; '))); }
    else push('- No Sade Sati or Dhaiya period touches this range.');
    push('### Retrograde stretches (from the station events above)');
    if (!stat.length) push('- No station in this range.'); else stat.forEach(e => push('- ' + e.id + ': ' + e.planet + ' ' + e.to + ' on ' + D(e.jd)));
    push('### Longest contacts with natal points (30 days or more inside the orb)');
    const lg = res.events.filter(e => e.type === 'HIT' && e.leave - e.enter >= 30);
    if (!lg.length) push('- None.'); else lg.forEach(e => push('- ' + e.id + ': ' + e.planet + ' ' + e.aspect + ' natal ' + e.natal + ', ' + hitLeaveTxt(e)));
    push('');
    // ---------- 10
    push('## 10. MONTH INDEX');
    const byM = {}; res.events.forEach(e => { const m = D(e.jd).slice(0, 7); (byM[m] = byM[m] || []).push(e); });
    Object.keys(byM).sort().forEach(m => {
      const c = {}; byM[m].forEach(e => c[e.type] = (c[e.type] || 0) + 1);
      push('- ' + m + ': ' + byM[m][0].id + '-' + byM[m][byM[m].length - 1].id + ' (' + Object.keys(c).map(k => c[k] + ' ' + k).join(', ') + ')');
    });
    push('');
    // ---------- 11
    push('## 11. HOUSE ACTIVATION SEGMENTS (Jupiter + Saturn + nodes + dasha)');
    push('Each block is a stretch of time in which Jupiter, Saturn, Rahu and Ketu stay in the same signs and the dasha chain is unchanged. A house is listed only when BOTH Jupiter and Saturn touch it (occupy or aspect). Dasha links show how each running dasha lord connects to that house (rules it / sits in it / aspects it).');
    res.segments.forEach(g => {
      push('');
      push('### ' + D(g.start) + ' to ' + D(g.end) + ' | dasha ' + (g.chain ? g.chain.join('/') : '?'));
      push('- Positions: Jupiter in ' + sn(g.J) + ', Saturn in ' + sn(g.S) + ', Rahu in ' + sn(g.Ra) + ', Ketu in ' + sn(g.Ke) + '. From Lagna: Jupiter H' + g.fromLagna.hJ + ', Saturn H' + g.fromLagna.hS + ', Rahu H' + g.fromLagna.hRa + ', Ketu H' + g.fromLagna.hKe + '. From Moon: Jupiter H' + g.fromMoon.hJ + ', Saturn H' + g.fromMoon.hS + '.');
      const rowTxt = (r, ds) => 'H' + r.house + ' (' + HOUSE_WORDS[r.house] + '): Jupiter ' + r.jupiter + ', Saturn ' + r.saturn + (r.nodes.length ? ', ' + r.nodes.join('+') + ' there' : '') + (ds && r.dasha && r.dasha.length ? ' | dasha links: ' + r.dasha.map(x => x.lv + ' lord ' + x.pl + ' ' + x.l.join(' & ')).join('; ') : '');
      if (!g.fromLagna.rows.length) push('- Double transit from Lagna: none.'); else g.fromLagna.rows.forEach(r => push('- Double transit from Lagna: ' + rowTxt(r, true)));
      if (!g.fromMoon.rows.length) push('- Double transit from Moon: none.'); else g.fromMoon.rows.forEach(r => push('- Double transit from Moon: ' + rowTxt(r, false)));
    });
    push('');
    // ---------- 12
    if (res.opts.ask !== false){
    push('## 12. WHAT TO ASK');
    push('(Edit this block.) Using only the data above, describe the main themes of ' + D(res.startJD) + ' to ' + D(res.endJD) + ' for ' + name + '. Go period by period. For each theme name the planets, houses and event IDs behind it, say which life areas are touched, what looks supportive and what needs care, and which dates matter most. Do not predict exact outcomes.');
    }
    if (res.warnings.length){ push(''); push('## NOTES ON ACCURACY'); res.warnings.forEach(w => push('- ' + w)); }
    push('- Planet positions come from the app\'s own ephemeris formulas (accurate to about a minute of arc for the Sun and Moon, a little less for others). Moon layer: ' + (res.opts.moon ? 'included' : 'not included (Moon sign and nakshatra changes are left out to keep the file short)') + '. Outer planets: ' + (res.opts.outer ? 'included' : 'not included') + '.');
    const text = L.join('\n');
    return { text, tokens: Math.round(text.length / 4) };
  }
  return { write };
})();
if (typeof window !== 'undefined') window.YTW = YTW;

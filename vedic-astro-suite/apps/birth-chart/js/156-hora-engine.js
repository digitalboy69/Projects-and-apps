/* Hora (planetary hours) engine (js/156, global HORA). No new astronomy: sunrise, sunset, next sunrise, weekday lord, Rahu Kalam / Yamaganda / Gulika come from panchangaAt (js/45),
   Choghadiya from CHG (js/118), friend/enemy from VDB, planet ease in the chart from VDA (js/91).
   A Vedic day runs sunrise to next sunrise. 12 day horas = (sunset - sunrise) / 12 and 12 night horas = (next sunrise - sunset) / 12 (unequal, as Drik Panchang, Shubh Panchang and Wikipedia describe).
   Planet order is the Chaldean order Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon; the first hora of a day belongs to that weekday's lord.
   Activity table: a pair is 'good' when two or more of Drik, Shubh and Dekho Panchang agree; one page only is 'ok'; cautions on two pages are 'avoid'. See docs/HORA_PLAN.md.
   The score (about -4 to +5, bands Avoid / Neutral / Fair / Good / Excellent) is the app's own teaching aid (tendency, not a verdict). Tendency wording only. */
const HORA = (() => {
  'use strict';
  const ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
  const WEEK = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const PL = {
    Sun: { tag: 'Vigorous', tone: 'mid', color: '#f0a64a', does: 'authority, leadership, government and official work, recognition', careful: 'soft or emotional matters' },
    Moon: { tag: 'Gentle', tone: 'good', color: '#cfd8e6', does: 'travel, caring and creative work, dealing with the public, emotional healing', careful: 'high-pressure confrontation' },
    Mars: { tag: 'Sharp', tone: 'care', color: '#e0605a', does: 'sport and competition, surgery, engineering, courage, physical effort', careful: 'negotiation, peacemaking and new auspicious beginnings' },
    Mercury: { tag: 'Quick', tone: 'good', color: '#6fcf97', does: 'trade, contracts, communication, study, writing, accounts, short trips', careful: 'slow work that needs patience' },
    Jupiter: { tag: 'Fruitful', tone: 'good', color: '#f2d36b', does: 'money matters, learning and teaching, spiritual work, ceremonies, starting good things', careful: 'very little; it is the most broadly favourable' },
    Venus: { tag: 'Beneficial', tone: 'good', color: '#e98ab3', does: 'love and marriage, art and music, vehicles, jewellery and other luxuries', careful: 'austere or aggressive tasks' },
    Saturn: { tag: 'Sluggish', tone: 'care', color: '#8f9bd6', does: 'long, patient and hard work, foundations and property, iron and machinery, agriculture, deep meditation', careful: 'anything new that needs speed, and fresh auspicious beginnings' }
  };
  const ACTS = [
    { id: 'start', name: 'Start something new', icon: '✦', good: ['Jupiter', 'Venus', 'Moon'], ok: ['Mercury', 'Sun'], avoid: ['Saturn', 'Mars'] },
    { id: 'money', name: 'Money and finance', icon: '◈', good: ['Jupiter', 'Mercury'], ok: ['Venus', 'Saturn'], avoid: [] },
    { id: 'deals', name: 'Business, contracts, signing', icon: '✎', good: ['Mercury', 'Jupiter'], ok: ['Venus', 'Sun'], avoid: ['Mars', 'Saturn'] },
    { id: 'study', name: 'Study and learning', icon: '❖', good: ['Mercury', 'Jupiter'], ok: ['Moon'], avoid: [] },
    { id: 'travel', name: 'Travel', icon: '➤', good: ['Moon', 'Mercury', 'Jupiter'], ok: ['Venus'], avoid: ['Saturn'] },
    { id: 'love', name: 'Love and marriage talks', icon: '♡', good: ['Venus', 'Jupiter'], ok: ['Moon'], avoid: ['Mars', 'Saturn'] },
    { id: 'buy', name: 'Vehicle, jewellery, luxury', icon: '◆', good: ['Venus'], ok: ['Jupiter', 'Mercury', 'Moon'], avoid: [] },
    { id: 'authority', name: 'Government, court, officials', icon: '⚖', good: ['Sun'], ok: ['Mars', 'Jupiter'], avoid: [] },
    { id: 'body', name: 'Surgery and procedures', icon: '✚', good: ['Mars'], ok: ['Moon'], avoid: [] },
    { id: 'sport', name: 'Sport and competition', icon: '⚑', good: ['Mars'], ok: ['Sun'], avoid: [] },
    { id: 'spirit', name: 'Spiritual practice', icon: '☸', good: ['Jupiter'], ok: ['Saturn', 'Moon'], avoid: [] },
    { id: 'home', name: 'Property, foundation, new home', icon: '⌂', good: ['Jupiter', 'Saturn'], ok: ['Mars'], avoid: [] },
    { id: 'art', name: 'Art, music, creative work', icon: '♪', good: ['Venus', 'Moon'], ok: ['Mercury'], avoid: [] },
    { id: 'labour', name: 'Hard, long physical work', icon: '⚒', good: ['Saturn', 'Mars'], ok: ['Sun'], avoid: [] }
  ];
  const act = id => ACTS.find(a => a.id === id) || ACTS[0];
  const rel = (a, b) => { if (a === b) return 'own'; try { const r = VDB.data.planets[a].relations; return r.friends.includes(b) ? 'friend' : r.enemies.includes(b) ? 'enemy' : 'neutral'; } catch (e) { return 'neutral'; } };

  function build(P) {
    if (!P || P.sunrise == null || P.sunset == null || P.nextSunrise == null) return null;
    const dl = (P.sunset - P.sunrise) / 12, nl = (P.nextSunrise - P.sunset) / 12, st = ORDER.indexOf(P.vara.lord);
    const guards = [['Rahu Kalam', P.rahu], ['Yamaganda', P.yama], ['Gulika Kalam', P.gulika]];
    let ch = null; try { ch = (typeof CHG !== 'undefined' && CHG) ? CHG.parts(P) : null; } catch (e) { ch = null; }
    const horas = [];
    for (let i = 0; i < 24; i++) {
      const night = i >= 12, from = night ? P.sunset + (i - 12) * nl : P.sunrise + i * dl, to = from + (night ? nl : dl), lord = ORDER[(st + i) % 7], mid = (from + to) / 2;
      const over = guards.filter(g => g[1] && Math.min(to, g[1][1]) - Math.max(from, g[1][0]) > 10 / 1440).map(g => g[0]);
      let chog = null; if (ch) { const row = (night ? ch.night : ch.day) || []; const r = row.find(x => mid >= x.from && mid < x.to); if (r) chog = { name: r.name, tone: r.tone }; }
      horas.push({ i, n: i + 1, night, lord, from, to, over, chog, tone: PL[lord].tone });
    }
    return { date: P.vara.date, vara: P.vara, sunrise: P.sunrise, sunset: P.sunset, nextSunrise: P.nextSunrise, dayMin: dl * 1440, nightMin: nl * 1440, horas, P };
  }
  function dayOf(dateStr, lat, lon, tz) {
    const [y, m, d] = dateStr.split('-').map(Number), jd = toJulianDay(y, m, d, 12, 0, 0) - tz / 24;
    return build(panchangaAt(jd, lat, lon, tz));
  }
  function at(jd, lat, lon, tz) {
    const day = build(panchangaAt(jd, lat, lon, tz)); if (!day) return null;
    const idx = day.horas.findIndex(h => jd >= h.from && jd < h.to);
    return { day, idx, hora: idx >= 0 ? day.horas[idx] : null, next: idx >= 0 && idx < 23 ? day.horas[idx + 1] : null };
  }
  function week(dateStr, n, lat, lon, tz) {
    const out = []; let [y, m, d] = dateStr.split('-').map(Number);
    for (let k = 0; k < (n || 7); k++) { const t = new Date(Date.UTC(y, m - 1, d + k)), s = t.getUTCFullYear() + '-' + String(t.getUTCMonth() + 1).padStart(2, '0') + '-' + String(t.getUTCDate()).padStart(2, '0'); const dd = dayOf(s, lat, lon, tz); if (dd) out.push(dd); }
    return out;
  }
  function band(s) { return s >= 3 ? 'Excellent' : s >= 2 ? 'Good' : s >= 1 ? 'Fair' : s >= 0 ? 'Neutral' : 'Avoid'; }
  function score(h, day, actId, chart) {
    const a = act(actId), why = []; let s = 0;
    if (a.good.includes(h.lord)) { s += 2; why.push(`${h.lord} hora is traditionally good for this`); }
    else if (a.ok.includes(h.lord)) { s += 1; why.push(`${h.lord} hora is fair for this`); }
    else if (a.avoid.includes(h.lord)) { s -= 2; why.push(`${h.lord} hora is usually avoided for this`); }
    else why.push(`${h.lord} hora has no special link to this`);
    const dayLord = day.vara.lord, r = rel(h.lord, dayLord);
    if (h.lord === dayLord) { s += .5; why.push(`it is the planet of the day (${day.vara.name})`); }
    else if (r === 'friend') { s += .5; why.push(`${h.lord} is a friend of the day lord ${dayLord}`); }
    else if (r === 'enemy') { s -= .5; why.push(`${h.lord} is an enemy of the day lord ${dayLord}`); }
    h.over.forEach(n => { s -= 1.5; why.push(`it overlaps ${n}`); });
    if (h.chog) { if (h.chog.tone === 'good') { s += .5; why.push(`Choghadiya is ${h.chog.name} (good)`); } else if (h.chog.tone === 'bad') { s -= .5; why.push(`Choghadiya is ${h.chog.name} (avoid)`); } }
    if (chart && typeof VDA !== 'undefined' && VDA) { try { const e = VDA.planetEase(chart, h.lord); const v = Math.max(-1, Math.min(1, e.ease / 2)); if (v) { s += v; why.push(`in your chart ${h.lord} ${v > 0 ? 'works easily' : 'is a harder planet'}${e.why[0] ? ': ' + e.why[0] : ''}`); } } catch (e2) { /* chart link is optional */ } }
    s = Math.round(s * 10) / 10; return { score: s, band: band(s), why };
  }
  function best(actId, fromJd, days, lat, lon, tz, chart, limit) {
    const lp = jdToLocalParts(fromJd, tz), ds = week(lp.dateStr, (days || 7) + 1, lat, lon, tz), out = [];
    ds.forEach(day => day.horas.forEach(h => { if (h.to > fromJd && h.from < fromJd + (days || 7)) { const sc = score(h, day, actId, chart); out.push({ day, h, ...sc }); } }));
    out.sort((x, y) => y.score - x.score || x.h.from - y.h.from);
    return out.slice(0, limit || 8);
  }
  function forYou(chart, lord) {
    if (!chart || !chart.planets || !chart.planets[lord]) return null;
    const P = chart.planets[lord], out = { lord, house: P.house, sign: (typeof SIGNS !== 'undefined' && SIGNS[P.sign]) ? SIGNS[P.sign].name : '', dignity: (P.dignity && P.dignity.status) || '', ease: 0, why: [], toLagnaLord: null, toDashaLord: null };
    try { const e = VDA.planetEase(chart, lord); out.ease = e.ease; out.why = e.why; } catch (e) { /* optional */ }
    try { const L = VDB.data.signs[chart.ascendant.sign].lord; out.lagnaLord = L; out.toLagnaLord = rel(lord, L); } catch (e) { /* optional */ }
    try { const c = VDA.current(chart); if (c && c.md) { out.dashaLord = c.md.lord; out.toDashaLord = rel(lord, c.md.lord); } } catch (e) { /* optional */ }
    return out;
  }
  const api = { ORDER, WEEK, PL, ACTS, act, build, dayOf, at, week, score, band, best, forYou, rel };
  window.HORA = api;
  return api;
})();

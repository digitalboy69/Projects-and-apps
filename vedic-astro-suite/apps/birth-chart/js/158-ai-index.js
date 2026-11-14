/* AI variable index (js/158, global AIX). The ONE registry of every variable the AI may read. The model never receives the data up front: it receives AIX.catalogue()
   (id + one-line description + links, a few hundred tokens), decides which ids it needs, and the app fetches only those with AIX.get(id).
   Entry: { id, g (group), t (title), d (description), l (linked ids), p (allowed parameters, for ids like varga.D9), f(arg, C) -> value }.
   'raw:<dotted.path>' reaches ANY field of the chart object, so every variable is reachable even if it has no named entry.
   Context C = { chart, profile } (set by the AI panel, falling back to window.__vgC). Values are rounded and compacted; large values are cut to a character budget. */
const AIX = (() => {
  'use strict';
  const PL = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const OUT = ['Uranus', 'Neptune', 'Pluto'];
  const VG = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D16', 'RTN'];
  const ctx = { chart: null, profile: null };
  const C = () => ({ chart: ctx.chart || window.__vgC || null, profile: ctx.profile || window.__vgProf || null });
  const sname = i => (typeof SIGNS !== 'undefined' && SIGNS[i]) ? SIGNS[i].name : String(i);
  const hsOf = (from, to) => ((to - from + 12) % 12) + 1;
  const lordOf = s => { try { return VDB.data.signs[s].lord; } catch (e) { return null; } };

  function compact(v, depth) {
    depth = depth || 0;
    if (v == null || typeof v === 'function') return undefined;
    if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v * 100) / 100 : undefined;
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (Array.isArray(v)) { const a = v.slice(0, 80).map(x => compact(x, depth + 1)).filter(x => x !== undefined); if (v.length > 80) a.push('…+' + (v.length - 80) + ' more'); return a; }
    if (typeof v === 'object') { if (depth > 7) return '…'; const o = {}; Object.keys(v).forEach(k => { const c = compact(v[k], depth + 1); if (c !== undefined) o[k] = c; }); return o; }
    return v;
  }
  const planetRow = (c, n) => { const p = c.planets[n] || (c.outer && c.outer[n]); if (!p) return null;
    return { sign: sname(p.sign), house: p.house, deg: Math.round(p.degInSign * 100) / 100, lon: Math.round(p.longitude * 100) / 100, nakshatra: p.nakshatra ? p.nakshatra.name + ' pada ' + p.nakshatra.pada + ' (lord ' + p.nakshatra.lord + ')' : undefined, dignity: p.dignity && (p.dignity.label || p.dignity.status), retro: p.retrograde || undefined, combust: (p.combustion && p.combustion.combust) || undefined, aspectsHouses: p.aspectsHouses }; };

  const E = [
    { id: 'profile', g: 'Person', t: 'Birth details', d: 'name, birth date, time, place, latitude, longitude, time zone, ayanamsa', l: ['chart.summary'], f: (a, c) => { const p = c.profile || {}; return { name: p.name, dob: p.dob, tob: p.tob, place: p.place, lat: p.lat, lon: p.lon, tz: p.tz != null ? p.tz : c.chart && c.chart.tzOffsetHours, ayanamsa: c.chart && c.chart.ayanamsa, julianDay: c.chart && c.chart.julianDay }; } },
    { id: 'chart.summary', g: 'Chart', t: 'Chart summary', d: 'lagna and every planet: sign, house, degree, nakshatra+pada, dignity, retrograde (best first look; about 600 tokens)', l: ['planet.{name}', 'house.{n}', 'dasha.current'], f: (a, c) => { const ch = c.chart, o = { lagna: { sign: sname(ch.ascendant.sign), deg: ch.ascendant.degInSign, nakshatra: ch.ascendant.nakshatra && (ch.ascendant.nakshatra.name || ch.ascendant.nakshatra) } }; PL.forEach(n => { o[n] = planetRow(ch, n); }); return o; } },
    { id: 'ascendant', g: 'Chart', t: 'Ascendant (Lagna)', d: 'rising sign, degree, nakshatra, lagna lord and where it sits', l: ['house.1', 'chart.summary'], f: (a, c) => { const ch = c.chart, l = lordOf(ch.ascendant.sign); return { sign: sname(ch.ascendant.sign), deg: ch.ascendant.degInSign, nakshatra: ch.ascendant.nakshatra, lagnaLord: l, lagnaLordAt: l && planetRow(ch, l) }; } },
    { id: 'planet', g: 'Chart', t: 'One planet in full', d: 'one planet: sign, house, degree, nakshatra pada lord deity, dignity, retrograde, combustion, speed, houses it aspects', p: PL.concat(OUT, ['Gulika']), l: ['house.{n}', 'dasha.current', 'varga.D9'], f: (a, c) => { if (a === 'Gulika') return c.chart.upagraha && c.chart.upagraha.Gulika; const r = planetRow(c.chart, a); if (!r) return null; const p = c.chart.planets[a] || c.chart.outer[a]; r.deity = p.nakshatra && p.nakshatra.deity; r.speed = p.speed; r.degRemaining = p.degRemainingInSign; return r; } },
    { id: 'house', g: 'Chart', t: 'One house (bhava)', d: 'sign on the cusp, house lord and where it sits, planets inside, planets aspecting it', p: Array.from({ length: 12 }, (_, i) => String(i + 1)), l: ['planet.{name}', 'ashtakavarga.sav'], f: (a, c) => { const ch = c.chart, h = +a, sg = (ch.ascendant.sign + h - 1) % 12, lord = lordOf(sg), inH = PL.filter(n => ch.planets[n].house === h), asp = PL.filter(n => n !== 'Moon' || true).filter(n => (ch.planets[n].aspectsHouses || []).includes(h) && ch.planets[n].house !== h);
        return { house: h, sign: sname(sg), lord, lordAt: lord && ch.planets[lord] ? { house: ch.planets[lord].house, sign: sname(ch.planets[lord].sign), dignity: ch.planets[lord].dignity && ch.planets[lord].dignity.label } : undefined, planets: inH, aspectedBy: asp, sav: ch.ashtakavarga && ch.ashtakavarga.sav ? ch.ashtakavarga.sav[sg] : undefined }; } },
    { id: 'varga', g: 'Divisional charts', t: 'One divisional chart', d: 'a divisional chart (D9 navamsha, D10 dashamsha, D7, D12 ...): lagna and each planet in it', p: VG, l: ['planet.{name}', 'yogas'], f: (a, c) => c.chart.vargas && c.chart.vargas[a] },
    { id: 'yogas', g: 'Chart', t: 'Yogas', d: 'pancha mahapurusha, gaja kesari, raja yogas, parivartana, viparita raja, neecha bhanga found in the chart', l: ['chart.summary'], f: (a, c) => c.chart.yogas },
    { id: 'karakas', g: 'Chart', t: 'Chara karakas', d: 'Atmakaraka, Amatyakaraka and the other Jaimini karakas', l: ['varga.D9'], f: (a, c) => c.chart.charaKarakas },
    { id: 'shadbala', g: 'Strength', t: 'Shadbala', d: 'six-fold planetary strength numbers and the day, hora, year, month lords', l: ['planet.{name}'], f: (a, c) => c.chart.shadbala },
    { id: 'ashtakavarga.sav', g: 'Strength', t: 'Sarvashtakavarga', d: 'total ashtakavarga points per sign (and per house from lagna)', l: ['house.{n}'], f: (a, c) => { const s = c.chart.ashtakavarga && c.chart.ashtakavarga.sav; if (!s) return null; const o = {}; for (let h = 1; h <= 12; h++) o['H' + h + ' ' + sname((c.chart.ascendant.sign + h - 1) % 12)] = s[(c.chart.ascendant.sign + h - 1) % 12]; return o; } },
    { id: 'ashtakavarga.bav', g: 'Strength', t: 'Bhinnashtakavarga of one planet', d: 'a planet\'s own ashtakavarga points per sign', p: ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'], l: ['ashtakavarga.sav'], f: (a, c) => c.chart.ashtakavarga && c.chart.ashtakavarga.bavTables && c.chart.ashtakavarga.bavTables[a] },
    { id: 'dasha.current', g: 'Timing', t: 'Running dasha', d: 'Vimshottari mahadasha and antardasha running now, with dates and plain-words reading', l: ['dasha.timeline', 'dasha.upcoming', 'planet.{name}'], f: (a, c) => { const r = VDA.current(c.chart); return r && { mahadasha: r.md, antardasha: r.ad, antardashas: r.antardashas && r.antardashas.map(x => ({ lord: x.lord, start: x.start, end: x.end, status: x.status })) }; } },
    { id: 'dasha.timeline', g: 'Timing', t: 'Mahadasha timeline', d: 'all mahadashas of the life with start and end dates', l: ['dasha.current'], f: (a, c) => (c.chart.dashaData.mahadashas || []).map(m => ({ lord: m.lord, start: m.startDate, end: m.endDate, years: m.years })) },
    { id: 'dasha.upcoming', g: 'Timing', t: 'Upcoming periods', d: 'antardashas starting in the next 2 years', l: ['dasha.current'], f: (a, c) => VDA.upcoming(c.chart, 2).map(x => ({ md: x.md || undefined, lord: x.lord, start: x.start, end: x.end })) },
    { id: 'transit.now', g: 'Timing', t: 'Planets in the sky now', d: 'today\'s planets: sign, degree, nakshatra, retrograde and the natal house each one falls in', l: ['transit.slow', 'dasha.current'], f: (a, c) => { const p = c.profile || {}, sky = computeLiveSky(p.lat != null ? +p.lat : 28.61, p.lon != null ? +p.lon : 77.2, c.chart.ascendant.sign), o = { asOf: sky.now.toISOString().slice(0, 16) + 'Z' }; PL.forEach(n => { const q = sky.planets[n]; if (q) o[n] = { sign: sname(q.sign), deg: Math.round(q.degInSign * 100) / 100, nakshatra: q.nakshatra && (q.nakshatra.name || q.nakshatra), retro: q.retrograde || undefined, natalHouse: hsOf(c.chart.ascendant.sign, q.sign), fromMoon: hsOf(c.chart.planets.Moon.sign, q.sign) }; }); return o; } },
    { id: 'transit.slow', g: 'Timing', t: 'Saturn, Jupiter, nodes: stays and Sade Sati', d: 'Saturn/Jupiter/Rahu/Ketu sign stays and the Sade Sati, kantaka and ashtama Saturn cycles', l: ['transit.now'], f: (a, c) => { const t = computeTransits(c.chart, c.profile); return { sadeSati: t.sadeSati, kantaka: t.kantaka, ashtama: t.ashtama }; } },
    { id: 'hora.now', g: 'Timing', t: 'Hora now', d: 'the planetary hour running now, the day lord, sunrise and sunset, next hora', l: ['panchang.birth'], f: (a, c) => { const p = c.profile || {}, tz = p.tz != null ? +p.tz : 5.5, r = HORA.at(Date.now() / 864e5 + 2440587.5, p.lat != null ? +p.lat : 28.61, p.lon != null ? +p.lon : 77.2, tz); return r && { dayLord: r.day.vara.lord, weekday: r.day.vara.name, now: r.hora && { lord: r.hora.lord, night: r.hora.night, over: r.hora.over, choghadiya: r.hora.chog }, next: r.next && r.next.lord }; } },
    { id: 'panchang.birth', g: 'Chart', t: 'Birth panchang', d: 'vara, tithi, nakshatra, yoga, karana at birth', l: ['profile'], f: (a, c) => { const p = c.profile || {}; try { return compact(panchangaAt(c.chart.julianDay, +p.lat, +p.lon, c.chart.tzOffsetHours)); } catch (e) { return null; } } },
    { id: 'outer', g: 'Chart', t: 'Outer planets and Gulika', d: 'Uranus, Neptune, Pluto and the Gulika upagraha', l: ['chart.summary'], f: (a, c) => ({ outer: c.chart.outer, gulika: c.chart.upagraha && c.chart.upagraha.Gulika }) },
    { id: 'wars', g: 'Chart', t: 'Planetary wars', d: 'graha yuddha (planets within one degree) if any', l: ['chart.summary'], f: (a, c) => c.chart.wars },
    { id: 'raw.keys', g: 'Raw', t: 'Chart field names', d: 'the list of every top-level field of the chart, to find the exact path for raw:<path>', l: ['raw:<path>'], f: (a, c) => Object.keys(c.chart).map(k => k + ' (' + (Array.isArray(c.chart[k]) ? 'list' : typeof c.chart[k]) + ')') }
  ];
  const byBase = {}; E.forEach(e => { byBase[e.id] = e; });

  function resolve(id) {
    id = String(id || '').trim();
    if (/^raw:/i.test(id)) return { kind: 'raw', path: id.slice(4).trim() };
    if (byBase[id]) return { kind: 'e', e: byBase[id], arg: null };
    const m = id.match(/^([a-z.]+?)\.([^.]+)$/i) || null, tries = [];
    if (m) tries.push([m[1], m[2]]);
    const dot = id.lastIndexOf('.'); if (dot > 0) tries.push([id.slice(0, dot), id.slice(dot + 1)]);
    for (const [b, a] of tries) { const e = byBase[b]; if (e && e.p) { const hit = e.p.find(x => String(x).toLowerCase() === a.toLowerCase()); if (hit != null) return { kind: 'e', e, arg: hit }; } }
    return null;
  }
  function rawGet(chart, path) { let v = chart; for (const k of path.split('.').filter(Boolean)) { if (v == null) return undefined; v = v[k]; } return v; }
  function get(id, maxChars) {
    const r = resolve(id), c = C(); if (!c.chart) return { id, ok: false, text: 'No birth chart is loaded yet.' };
    if (!r) return { id, ok: false, text: 'Unknown variable "' + id + '". Use an id from the index.' };
    let v; try { v = r.kind === 'raw' ? rawGet(c.chart, r.path) : r.e.f(r.arg, c); } catch (e) { return { id, ok: false, text: 'Could not read ' + id + ': ' + (e && e.message || e) }; }
    if (v === undefined || v === null) return { id, ok: false, text: id + ' has no value for this chart.' };
    let t = JSON.stringify(compact(v)), cut = false; const max = maxChars || 6000; if (t.length > max) { t = t.slice(0, max) + '…[cut; ask for a narrower id]'; cut = true; }
    return { id, ok: true, text: t, tokens: Math.ceil(t.length / 4), cut };
  }
  function catalogue() {
    const lines = []; let g = '';
    E.forEach(e => { if (e.g !== g) { g = e.g; lines.push('## ' + g); }
      const idl = e.p ? e.id + '.{' + (e.p.length > 14 ? e.p.slice(0, 3).join('|') + '|…' : e.p.join('|')) + '}' : e.id;
      lines.push('- ' + idl + ' — ' + e.d + (e.l && e.l.length ? ' [links: ' + e.l.join(', ') + ']' : '')); });
    lines.push('## Raw', '- raw:<dotted.path> — any field of the chart by path, e.g. raw:planets.Moon.nakshatra or raw:dashaData.balanceYears');
    return lines.join('\n');
  }
  const list = () => E.map(e => ({ id: e.id, g: e.g, t: e.t, d: e.d, l: e.l || [], p: e.p || null }));
  const api = { E, list, get, resolve, catalogue, compact, setContext: (chart, profile) => { ctx.chart = chart || null; ctx.profile = profile || null; }, ctx, PL };
  window.AIX = api;
  return api;
})();

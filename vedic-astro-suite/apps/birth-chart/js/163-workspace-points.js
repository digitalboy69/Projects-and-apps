/* WORKSPACE POINT FINDER (AWP): finds any "variable" (a planet, Atmakaraka, Darakaraka, the 7th lord, Gulika, Hora Lagna ...) in the chart on screen
   and in any divisional chart (docs/WORKSPACE_FINDER_PLAN.md).
   AWP.resolve(id, chart, profile) -> { id, label, group, kind:'planet'|'point'|'sign', planet, lon, sign, via, err } (the point in the D1 chart)
   AWP.locate(chart, id, 'D9')     -> { r, key, sign, house, dignity, same, together[], lord, lordSign, lordHouse, err } (the same point in that chart)
   AWP.all(chart, id)               -> { r, rows:[locate...], summary:{own, exalted, weak, same[], total, text} } over every divisional chart
   A planet's place in a chart is the engine's own table (chart.vargas[key].planetVargaSign); a point with a longitude uses calcVarga(key, longitude);
   a sign-only point (Arudha, Upapada, Karakamsha ...) has no degree, so it has no honest place in other charts and says so. No astrology is invented here. */
(function(){
  'use strict';
  const SIGN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const PL = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'], P7 = PL.slice(0, 7), OUT = ['Uranus','Neptune','Pluto'];
  const LORD = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
  const ROLE = { AK: 'Atmakaraka', AmK: 'Amatyakaraka', BK: 'Bhratrikaraka', MK: 'Matrikaraka', PuK: 'Putrakaraka', GK: 'Gnatikaraka', DK: 'Darakaraka' };
  const ORD = n => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
  const label = id => { const a = (window.AW && AW.SUBJECTS || []).find(x => x[0] === id); return a ? a[1] : id; };
  const group = id => { const a = (window.AW && AW.SUBJECTS || []).find(x => x[0] === id); return a ? a[2] : ''; };
  const sg = lon => Math.floor((((lon % 360) + 360) % 360) / 30);
  const dsg = (n, s) => { try { return getDignity(n, s); } catch (e) { return null; } };
  const FN = { hora: 'calcHoraLagnaLongitude', ghati: 'calcGhatiLagnaLongitude', shree: 'calcShreeLagnaLongitude', prana: 'calcPranapadaLagnaLongitude', bhava: 'calcBhavaLagnaLongitude', vighati: 'calcVighatiLagnaLongitude', bb: 'calcBhriguBinduLongitude' };

  function planetPoint(c, name){
    const p = c.planets[name] || (c.outer && c.outer[name]); if (!p || p.longitude == null) return null;
    return { planet: name, lon: p.longitude, sign: p.sign != null ? p.sign : sg(p.longitude) };
  }
  function resolve(id, c, pf){
    const base = { id, label: label(id), group: group(id), kind: 'planet', planet: null, lon: null, sign: null, via: '', err: '' };
    if (!c) return Object.assign(base, { err: 'Cast a chart first.' });
    try {
      let m, x;
      if (PL.indexOf(id) >= 0 || OUT.indexOf(id) >= 0){ x = planetPoint(c, id); if (!x) return Object.assign(base, { err: id + ' is not available for this chart.' }); return Object.assign(base, x, { via: id }); }
      if ((m = /^role:(\w+)$/.exec(id))){
        const long = ROLE[m[1]], k = c.charaKarakas && c.charaKarakas[long]; if (!k) return Object.assign(base, { err: 'Chara Karakas are not available for this chart.' });
        x = planetPoint(c, k.planet); return Object.assign(base, x, { via: long + ' is ' + k.planet + (m[1] === 'AK' ? ' (the highest degree in its sign)' : m[1] === 'DK' ? ' (the lowest degree in its sign)' : '') });
      }
      if ((m = /^lord:(\d+)$/.exec(id))){
        const h = +m[1], hs = c.vargas.D1.houses[h - 1], lord = hs && hs.signLord; x = planetPoint(c, lord); if (!x) return Object.assign(base, { err: 'Not available.' });
        return Object.assign(base, x, { via: 'The ' + ORD(h) + ' house is ' + hs.signName + ', so its lord is ' + lord });
      }
      if (id === 'lagna') return Object.assign(base, { kind: 'point', lon: c.ascendant.longitude, sign: c.ascendant.sign, via: 'The rising point at birth' });
      if (id === 'pt:gulika'){ const g = c.upagraha && c.upagraha.Gulika; if (!g) return Object.assign(base, { err: 'Gulika is not available for this chart.' }); return Object.assign(base, { kind: 'point', lon: g.longitude, sign: sg(g.longitude), via: 'Gulika (Mandi)' }); }
      if ((m = /^pt:(\w+)$/.exec(id)) && FN[m[1]]){
        const f = window[FN[m[1]]]; if (typeof f !== 'function') return Object.assign(base, { err: 'Not available in this version.' });
        const lon = f(c); if (lon == null || isNaN(lon)) return Object.assign(base, { err: 'This point needs an exact birth time.' });
        return Object.assign(base, { kind: 'point', lon, sign: sg(lon), via: label(id) });
      }
      if ((m = /^dasha:(md|ad)$/.exec(id))){
        const cur = VDA.current(c), d = cur && cur[m[1]]; if (!d) return Object.assign(base, { err: 'The dasha could not be worked out.' });
        x = planetPoint(c, d.lord); return Object.assign(base, x, { via: (m[1] === 'md' ? 'Mahadasha' : 'Antardasha') + ' running now: ' + d.lord });
      }
      if (id === 'strong' || id === 'weak'){
        const S = c.shadbala && c.shadbala.planets; if (!S) return Object.assign(base, { err: 'Shadbala is not available (it needs a birth time).' });
        const arr = P7.filter(n => S[n]).map(n => [n, S[n].percentOfRequired != null ? S[n].percentOfRequired : S[n].totalRupas / S[n].requiredRupas * 100]).sort((a, b) => b[1] - a[1]);
        const pick = id === 'strong' ? arr[0] : arr[arr.length - 1]; x = planetPoint(c, pick[0]);
        return Object.assign(base, x, { via: (id === 'strong' ? 'Strongest' : 'Weakest') + ' by Shadbala: ' + pick[0] + ' (' + Math.round(pick[1]) + '% of the minimum)' });
      }
      if ((m = /^nak:(Moon|Lagna)$/.exec(id))){
        const nk = m[1] === 'Moon' ? c.planets.Moon.nakshatra : c.ascendant.nakshatra; if (!nk) return Object.assign(base, { err: 'Not available.' });
        x = planetPoint(c, nk.lord); return Object.assign(base, x, { via: 'The ' + m[1] + ' is in ' + nk.name + ', whose lord is ' + nk.lord });
      }
      if ((m = /^sg:(\w+)$/.exec(id))){
        const S = computeAllSpecialLagnaSigns(c), s = S[m[1]]; if (s == null || isNaN(s)) return Object.assign(base, { err: 'This point is not available for this chart.' });
        return Object.assign(base, { kind: 'sign', sign: s, via: 'Worked out in the main chart (D1)' });
      }
    } catch (e) { return Object.assign(base, { err: 'This point could not be worked out for this chart.' }); }
    return Object.assign(base, { err: 'Unknown point.' });
  }

  function locate(c, id, key, pf){
    const r = resolve(id, c, pf), out = { r, key, sign: null, house: null, dignity: null, same: false, together: [], lord: null, lordSign: null, lordHouse: null, err: r.err };
    if (r.err) return out;
    const V = c.vargas && c.vargas[key]; if (!V){ out.err = key + ' is not available for this chart.'; return out; }
    const asc = V.ascendantSign;
    let s = null;
    if (id === 'lagna') s = asc;
    else if (r.planet && V.planetVargaSign && V.planetVargaSign[r.planet] != null) s = V.planetVargaSign[r.planet];
    else if (r.planet && V.outerSign && V.outerSign[r.planet] != null) s = V.outerSign[r.planet];
    else if (r.kind === 'sign'){ if (key === 'D1') s = r.sign; else { out.err = 'sign-only'; out.sign = null; return out; } }
    else if (r.lon != null){ try { s = calcVarga(key, r.lon); } catch (e) { s = null; } }
    if (s == null || isNaN(s)){ out.err = 'Not available in ' + key + '.'; return out; }
    out.sign = s; out.house = ((s - asc + 12) % 12) + 1; out.asc = asc;
    out.same = key !== 'D1' && s === r.sign && r.kind !== 'sign';
    if (r.planet) out.dignity = dsg(r.planet, s);
    const pv = V.planetVargaSign || {};
    out.together = PL.filter(n => n !== r.planet && pv[n] === s);
    out.lord = LORD[s]; const ls = pv[out.lord]; if (ls != null){ out.lordSign = ls; out.lordHouse = ((ls - asc + 12) % 12) + 1; }
    return out;
  }

  function keys(c){ return Object.keys(c.vargas || {}).filter(k => k !== 'RTN' && (typeof VARGAS === 'undefined' || VARGAS[k])); }
  function all(c, id, pf){
    const r = resolve(id, c, pf), res = { r, rows: [], summary: null };
    if (r.err) return res;
    res.rows = keys(c).map(k => locate(c, id, k, pf));
    const ok = res.rows.filter(x => !x.err), nz = ok.filter(x => x.key !== 'D1');
    const own = nz.filter(x => x.dignity && /Own|Moola/.test(x.dignity.status)).map(x => x.key), exa = nz.filter(x => x.dignity && /Exalt/.test(x.dignity.status)).map(x => x.key), weak = nz.filter(x => x.dignity && /Debil/.test(x.dignity.status)).map(x => x.key), same = nz.filter(x => x.same).map(x => x.key);
    let text;
    if (r.kind === 'sign') text = 'This is a sign-only point, so it is shown in D1 only.';
    else {
      const bits = [];
      if (r.planet){ bits.push(exa.length ? 'exalted in ' + exa.join(', ') : '', own.length ? 'in its own sign in ' + own.join(', ') : '', weak.length ? 'debilitated in ' + weak.join(', ') : ''); }
      bits.push(same.length ? 'in the same sign as D1 in ' + same.join(', ') : 'in a different sign from D1 in every other chart');
      text = (r.planet ? r.planet + ' is ' : r.label + ' is ') + bits.filter(Boolean).join('; ') + '.';
    }
    res.summary = { own, exalted: exa, weak, same, total: nz.length, text };
    return res;
  }

  window.AWP = { resolve, locate, all, keys, label, SIGN, ORD };
})();

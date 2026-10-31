/* ============================================================================
   KP SYSTEM (Krishnamurti Paddhati): Placidus cusps, star lord / sub lord / sub-sub lord for every cusp and planet, planet and house significators,
   cusp sub-lord promise checks, ruling planets. Global: KP { placidus, lords, compute, html, text }, buildKpPanel(chart, profile).
   Sub-divisions follow Vimshottari proportions inside each nakshatra. Placidus is solved by the usual semi-arc iteration (fails above ~66 deg latitude).
   Promise-check house sets are common KP-Reader practice and are labelled so. Uses the ayanamsa chosen in js/124 (KP ayanamsa is the usual match).
   ============================================================================ */
const KP = (function(){
  const SEQ = DASHA_SEQUENCE, YRS = DASHA_YEARS, NAKL = 360 / 27, g = PLANET_GLYPHS;
  const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th'));
  const D2R = Math.PI / 180, R2D = 180 / Math.PI, nm = x => ((x % 360) + 360) % 360;
  function lords(lon){
    lon = nm(lon); const ni = Math.min(26, Math.floor(lon / NAKL)), star = SEQ[ni % 9]; let rem = lon - ni * NAKL, s = SEQ.indexOf(star), sub = star, span = NAKL, rem2 = rem;
    for (let k = 0; k < 9; k++){ const l = SEQ[(s + k) % 9], sp = NAKL * YRS[l] / 120; if (rem < sp - 1e-9 || k === 8){ sub = l; span = sp; rem2 = Math.max(0, rem); break; } rem -= sp; }
    let ss = sub, s2 = SEQ.indexOf(sub), r = rem2;
    for (let k = 0; k < 9; k++){ const l = SEQ[(s2 + k) % 9], sp = span * YRS[l] / 120; if (r < sp - 1e-9 || k === 8){ ss = l; break; } r -= sp; }
    const sign = Math.floor(lon / 30);
    return { lon, sign, signLord: SIGNS[sign].lord, nak: ni, star, sub, subsub: ss };
  }
  /* Placidus house cusps (tropical), returns array of 12 tropical longitudes (index 0 = 1st cusp) or null */
  function placidus(jd, lat, lon){
    const eps = obliquityOfEcliptic(jd) * D2R, ramc = nm(greenwichSiderealTime(jd) + lon), phi = lat * D2R;
    if (Math.abs(lat) > 66) return null;
    const lam = R => nm(Math.atan2(Math.sin(R * D2R), Math.cos(R * D2R) * Math.cos(eps)) * R2D);
    const mc = nm(Math.atan2(Math.sin(ramc * D2R), Math.cos(ramc * D2R) * Math.cos(eps)) * R2D), asc = ascendantLongitude(jd, lat, lon);
    function solve(f, nocturnal){
      let R = ramc + (nocturnal ? 180 - f * 60 : f * 90);   // first guess
      for (let i = 0; i < 40; i++){
        const L = lam(R), dec = Math.asin(Math.sin(eps) * Math.sin(L * D2R)), x = -Math.tan(phi) * Math.tan(dec), sda = Math.acos(Math.max(-1, Math.min(1, x))) * R2D;
        const Rn = nocturnal ? ramc + 180 - f * (180 - sda) : ramc + f * sda;
        if (Math.abs(Rn - R) < 1e-9){ R = Rn; break; } R = Rn;
      }
      return lam(R);
    }
    const c11 = solve(1 / 3, false), c12 = solve(2 / 3, false), c2 = solve(2 / 3, true), c3 = solve(1 / 3, true);
    return [asc, c2, c3, nm(mc + 180), nm(c11 + 180), nm(c12 + 180), nm(asc + 180), nm(c2 + 180), nm(c3 + 180), mc, c11, c12];
  }
  const inHouse = (lon, cusps) => { for (let h = 0; h < 12; h++){ const a = cusps[h], b = cusps[(h + 1) % 12]; if (nm(lon - a) < nm(b - a) - 1e-12) return h + 1; } return 1; };
  const REQ = [
    ['marriage', 'Marriage', 7, [2, 7, 11], [1, 6, 10]], ['job', 'Job / career', 10, [2, 6, 10, 11], [5, 9]], ['children', 'Children', 5, [2, 5, 11], [1, 4, 10]],
    ['property', 'Property / home', 4, [4, 11, 12], [3, 10]], ['education', 'Higher education', 9, [4, 9, 11], [8, 12]], ['foreign', 'Foreign travel', 9, [3, 9, 12], [2, 4]]
  ];
  function compute(chart, profile, momentJd){
    const jd = chart.julianDay, lat = Number(profile.lat), lon = Number(profile.lon), ay = chart.ayanamsa, tz = Number(profile.tz != null ? profile.tz : chart.tzOffsetHours);
    const tc = placidus(jd, lat, lon); if (!tc) return { fail: 'KP cusps (Placidus) cannot be worked out beyond about 66° latitude.' };
    const cusps = tc.map(c => nm(c - ay)), cl = cusps.map(c => lords(c)), P = {};
    const owners = {}; for (let h = 1; h <= 12; h++){
      const s0 = cl[h - 1].sign, s1 = cl[h % 12].sign, set = new Set([SIGNS[s0].lord]); for (let s = (s0 + 1) % 12, n = 0; s !== s1 && n < 12; s = (s + 1) % 12, n++) set.add(SIGNS[s].lord);
      owners[h] = [...set];
    }
    const occ = {}; for (let h = 1; h <= 12; h++) occ[h] = [];
    const ownedBy = {}; PLANET_LIST.forEach(n => ownedBy[n] = []); for (let h = 1; h <= 12; h++) owners[h].forEach(o => { if (ownedBy[o] && !ownedBy[o].includes(h)) ownedBy[o].push(h); });
    PLANET_LIST.forEach(n => { const L = lords(chart.planets[n].longitude), h = inHouse(L.lon, cusps); P[n] = Object.assign(L, { house: h, retro: !!chart.planets[n].retrograde }); occ[h].push(n); });
    PLANET_LIST.forEach(n => {
      const st = P[n].star, via = [].concat(P[st].house, ownedBy[st]), own = [].concat(P[n].house, ownedBy[n]);
      P[n].viaStar = [...new Set(via)].sort((a, b) => a - b); P[n].own = [...new Set(own)].sort((a, b) => a - b); P[n].signif = [...new Set(via.concat(own))].sort((a, b) => a - b);
    });
    const sig = {}; for (let h = 1; h <= 12; h++){
      const A = PLANET_LIST.filter(n => occ[h].includes(P[n].star)), B = occ[h], C = PLANET_LIST.filter(n => owners[h].includes(P[n].star)), D = owners[h].filter(n => PLANET_LIST.includes(n));
      sig[h] = { A, B, C, D };
    }
    const promise = REQ.map(r => { const cs = cl[r[2] - 1], sp = P[cs.sub], want = sp.signif.filter(h => r[3].includes(h)), no = sp.signif.filter(h => r[4].includes(h));
      const tone = want.length >= Math.ceil(r[3].length / 2) && want.length > no.length ? 'good' : want.length ? 'mid' : 'bad';
      return { id: r[0], name: r[1], cusp: r[2], sub: cs.sub, signif: sp.signif, want, no, need: r[3], tone }; });
    let rp = null;
    try {
      const j = momentJd != null ? momentJd : (Date.now() / 86400000 + 2440587.5), cn = computeChart(jdToLocalParts(j, tz).dateStr, jdToLocalParts(j, tz).timeStr.slice(0, 5), lat, lon, tz);
      const wd = (Math.floor(j + 0.5 + tz / 24) + 1) % 7, DAYL = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'], la = lords(cn.ascendant.longitude), lm = lords(cn.planets.Moon.longitude);
      const items = [['Day lord', DAYL[wd]], ['Moon sign lord', lm.signLord], ['Moon star lord', lm.star], ['Lagna sign lord', la.signLord], ['Lagna star lord', la.star]];
      const cnt = {}; items.forEach(i => cnt[i[1]] = (cnt[i[1]] || 0) + 1); rp = { items, uniq: Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]), cnt };
    } catch(e){ console.warn('kp ruling planets', e); }
    return { cusps, cl, P, owners, occ, sig, promise, rp, ay: ayanName() };
  }
  const dg = lon => { const d = nm(lon) % 30, m = (d - Math.floor(d)) * 60; return Math.floor(d) + '°' + String(Math.floor(m)).padStart(2, '0') + '′'; };
  const L = n => g[n] + ' ' + n;
  function text(chart, profile){
    try { const d = compute(chart, profile); if (d.fail) return d.fail;
      return 'KP system (' + d.ay + ' ayanamsa, Placidus). Cusps (sign/star/sub): ' + d.cl.map((c, i) => ord(i + 1) + ' ' + SIGNS[c.sign].name + ' ' + dg(c.lon) + ' ' + c.signLord + '/' + c.star + '/' + c.sub).join('; ')
        + '. Planets (house, star/sub): ' + PLANET_LIST.map(n => n + ' ' + SIGNS[d.P[n].sign].name + ' ' + dg(d.P[n].lon) + ', ' + ord(d.P[n].house) + ', ' + d.P[n].star + '/' + d.P[n].sub + ' signifies ' + d.P[n].signif.join(',')).join('; ')
        + '. Promise: ' + d.promise.map(p => p.name + ' cusp ' + p.cusp + ' sub ' + p.sub + ' signifies ' + p.signif.join(',') + ' (needs ' + p.need.join(',') + ')').join('; ') + '.';
    } catch(e){ return ''; }
  }
  function html(chart, profile){
    let d; try { d = compute(chart, profile); } catch(e){ console.warn('kp', e); return '<div class="meta-err">Could not work out the KP table.</div>'; }
    if (d.fail) return '<div class="meta-err">' + d.fail + '</div>';
    const kpOn = ayanKey() === 'kp';
    const adv = '<div class="kp-ayn ' + (kpOn ? 'on' : '') + '">' + (kpOn ? '✓ KP ayanamsa is on, as KP astrologers use.' : 'You are using <b>' + d.ay + '</b> ayanamsa. KP is normally read with the KP ayanamsa, which can change a sub lord.') + (kpOn ? '' : ' <button type="button" id="kpAyn" class="chgp-btn">Use KP ayanamsa</button>') + '</div>';
    const cr = d.cl.map((c, i) => '<tr><td>' + (i + 1) + '</td><td>' + SIGNS[c.sign].symbol + ' ' + dg(c.lon) + '</td><td>' + c.signLord + '</td><td>' + c.star + '</td><td><b>' + c.sub + '</b></td><td>' + c.subsub + '</td></tr>').join('');
    const pr = PLANET_LIST.map(n => { const p = d.P[n]; return '<tr><td>' + L(n) + (p.retro ? ' ℞' : '') + '</td><td>' + SIGNS[p.sign].symbol + ' ' + dg(p.lon) + '</td><td>' + ord(p.house) + '</td><td>' + p.star + '</td><td><b>' + p.sub + '</b></td><td class="kp-sg">' + p.signif.join(', ') + '</td></tr>'; }).join('');
    const hs = Array.from({ length: 12 }, (_, i) => i + 1).map(h => { const s = d.sig[h], f = a => a.length ? a.join(', ') : '—'; return '<tr><td>' + h + '</td><td>' + f(s.A) + '</td><td>' + f(s.B) + '</td><td>' + f(s.C) + '</td><td>' + f(s.D) + '</td></tr>'; }).join('');
    const pm = d.promise.map(p => '<div class="kp-p ' + p.tone + '"><b>' + p.name + ' <small>' + ord(p.cusp) + ' cusp sub lord: ' + p.sub + '</small></b><p>' + p.sub + ' signifies houses ' + p.signif.join(', ') + '. Houses KP looks for: ' + p.need.join(', ') + (p.want.length ? ' · found: ' + p.want.join(', ') : ' · none found') + (p.no.length ? ' · against: ' + p.no.join(', ') : '') + '.</p></div>').join('');
    const rp = d.rp ? '<div class="kp-rp">' + d.rp.items.map(i => '<span><small>' + i[0] + '</small><b>' + i[1] + '</b></span>').join('') + '</div><p class="pn-note">Ruling planets right now at your birth place: ' + d.rp.uniq.map(n => n + (d.rp.cnt[n] > 1 ? ' ×' + d.rp.cnt[n] : '')).join(', ') + '. Day lord taken by calendar day.</p>' : '';
    return adv
      + '<div class="pn-sec"><h5>Cusps <span>Placidus · star and sub lords</span></h5><div class="kp-w"><table class="kp-t"><tr><th>#</th><th>Cusp</th><th>Sign</th><th>Star</th><th>Sub</th><th>Sub-sub</th></tr>' + cr + '</table></div></div>'
      + '<div class="pn-sec"><h5>Planets <span>house by cusp · houses they signify</span></h5><div class="kp-w"><table class="kp-t"><tr><th>Planet</th><th>Position</th><th>House</th><th>Star</th><th>Sub</th><th>Signifies</th></tr>' + pr + '</table></div></div>'
      + '<div class="pn-sec"><h5>Is the event promised? <span>cusp sub lord check</span></h5>' + pm + '<p class="pn-note">The house sets are common KP practice from the KP Readers; this only shows the promise. When it happens is read from the running dasha lords.</p></div>'
      + '<details class="kp-d"><summary>House significators (A strongest → D)</summary><div class="kp-w"><table class="kp-t"><tr><th>House</th><th>A: in star of occupants</th><th>B: occupants</th><th>C: in star of owner</th><th>D: owners</th></tr>' + hs + '</table></div></details>'
      + '<div class="pn-sec"><h5>Ruling planets <span>for now</span></h5>' + rp + '</div>'
      + '<p class="pn-note">Owners of a house are the lords of the sign on its cusp and of any sign fully inside it. Rahu and Ketu own no house here. A traditional method, not a prediction.</p>'
      + '<button type="button" class="chgp-btn" id="kpCopy"><span>📋</span> Copy KP table</button>';
  }
  document.addEventListener('click', e => {
    const t = e.target.closest ? e.target.closest('#kpAyn,#kpCopy') : null; if (!t) return;
    if (t.id === 'kpAyn' && window.setAyanamsa){ window.setAyanamsa('kp'); let n = 0; const w = setInterval(() => { n++; const e = document.getElementById('panel-kp'); if (n > 30 || (!e && document.getElementById('results') && document.getElementById('results').classList.contains('show'))){ clearInterval(w); try { switchAppTab('panel-kp'); } catch(x){} } }, 300); }
    else if (t.id === 'kpCopy'){ const ch = window.currentChartForModal, pf = window.__vgProf; if (ch && pf) copyTextToClipboard(text(ch, pf), t, '<span>📋</span> Copy KP table'); }
  });
  window.buildKpPanel = function(chart, profile){ return '<div class="kpp"><div class="avk-intro">The KP system (Krishnamurti Paddhati) reads the chart through <b>star lords</b> and <b>sub lords</b>. Every degree of the zodiac has a sign lord, a star lord and a sub lord, and the sub lord of a house cusp decides if the matter is promised. For <b>' + escapeHtml(String(profile.name || 'you')) + '</b>.</div><div id="kpBody">' + html(chart, profile) + '</div></div>'; };
  return { placidus, lords, compute, html, text, REQ };
})();

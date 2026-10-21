/* ============================================================================
   SKY DASHBOARD (3D Sky, top-right button "▦")
   One full-screen page with everything an astrologer reads from a chart:
   panchang, highlights, a card per planet, who aspects whom, house-to-house
   relation matrix (trines, kendras...), sign + nakshatra exchanges, conjunctions,
   sign / nakshatra occupancy, houses, element balance, outer planets.
   Reads the chart at the 3D date (or the natal chart when a profile is loaded). Only standard rules; no yogas are guessed.
   Uses: snapshotPositions, getChartContext/computeNatalAscendant, dignityOf (29), COMBUST/CONDEX (40), NAKSHATRA_LORDS (32), ASPECT_OFFSETS (03).
   ============================================================================ */
const DBX = (function(){
  const TITHI = ['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi'];
  const YOGA = ['Vishkambha','Priti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma','Dhriti','Shula','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata','Variyana','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti'];
  const KARANA7 = ['Bava','Balava','Kaulava','Taitila','Garaja','Vanija','Vishti'];
  const WEEK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const ELEM = ['Fire','Earth','Air','Water'], MODE = ['Movable','Fixed','Dual'];
  const WAR = ['Mars','Mercury','Jupiter','Venus','Saturn'];
  let mode = 'sky', open = false, lastText = '';
  const el = id => document.getElementById(id);
  const nd = x => ((x % 360) + 360) % 360;
  const sg = l => Math.floor(nd(l) / 30);
  const dm = l => { const d = degreeInSign(l); return d.deg + '°' + String(d.min).padStart(2, '0') + "'"; };
  const hs = (from, to) => ((to - from + 12) % 12) + 1;
  const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th'));
  const G = n => PLANET_GLYPHS[n] || '';
  const nm = n => G(n) + ' ' + n;
  const sname = i => SIGNS[i].name;
  const navSign = l => Math.floor(nd(l) / (30 / 9)) % 12;
  const dist = (a, b) => { let d = Math.abs(nd(a) - nd(b)); return d > 180 ? 360 - d : d; };
  const pill = (t, c) => '<span class="dbx-pill ' + (c || '') + '">' + t + '</span>';
  const chips = a => a.length ? a.map(x => '<span class="dbx-chip">' + x + '</span>').join('') : '<span class="dbx-none">none</span>';
  const kv = (k, v) => '<div class="dbx-kv"><span>' + k + '</span><b>' + v + '</b></div>';

  function ctx(){
    const p = isValidProfile(activeNatalProfile) ? activeNatalProfile : null;
    let lagna = null, label;
    if (p) lagna = computeNatalAscendant(p).lagnaLon;
    if (mode === 'natal' && p){
      const c = computeNatalAscendant(p), s = snapshotPositions(c.jd);
      return { jd: c.jd, sid: s.sidereal, retro: s.retro, lagna, label: p.name + "'s birth chart", p, ayan: s.ayanamsa };
    }
    const s = snapshotPositions(currentJD);
    return { jd: currentJD, sid: s.sidereal, retro: s.retro, lagna, p, ayan: s.ayanamsa, label: 'Sky on ' + formatFullDate(currentJD) + (p ? ' · houses from ' + p.name + "'s Lagna" : '') };
  }

  function analyse(c){
    const S = c.sid, A = {};
    const lagnaSign = c.lagna == null ? null : sg(c.lagna);
    A.lagnaSign = lagnaSign;
    A.pl = {};
    PLANET_LIST.forEach(n => {
      const l = S[n], si = sg(l), ni = getNakshatraIndex(l), pada = getPadaIndex(l) + 1;
      const nl = NAKSHATRA_LORDS[ni], sl = SIGNS[si].lord;
      const sun = dist(l, S.Sun);
      const sp = planetSpeed(n, c.jd);
      A.pl[n] = { n, l, si, ni, pada, nl, sl, nav: navSign(l), dign: dignityOf(n, si), retro: n === 'Rahu' || n === 'Ketu' ? true : !!c.retro[n],
        house: lagnaSign == null ? null : hs(lagnaSign, si), fromMoon: hs(sg(S.Moon), si), speed: sp,
        station: (n !== 'Rahu' && n !== 'Ketu' && n !== 'Sun' && n !== 'Moon' && Math.abs(sp) < 0.2 * (MEAN_SPEED[n] || 1)),
        comb: !!COMBUST[n] && sun <= COMBUST[n], sunD: sun, varg: navSign(l) === si,
        gand: (nd(l) % 120 < 10 / 3) || (nd(l) % 120 > 120 - 10 / 3) };
    });
    // aspects (graha drishti, whole-sign)
    A.cast = {}; A.by = {}; PLANET_LIST.forEach(n => { A.cast[n] = []; A.by[n] = []; });
    A.castSigns = {};
    PLANET_LIST.forEach(f => {
      A.castSigns[f] = [];
      (ASPECT_OFFSETS[f] || [7]).forEach(o => {
        const ts = (A.pl[f].si + o - 1) % 12;
        A.castSigns[f].push({ o, ts });
        PLANET_LIST.forEach(t => { if (t !== f && A.pl[t].si === ts){ A.cast[f].push({ t, o }); A.by[t].push({ f, o }); } });
      });
    });
    A.mutual = [];
    PLANET_LIST.forEach((a, i) => PLANET_LIST.slice(i + 1).forEach(b => {
      const x = A.cast[a].find(r => r.t === b), y = A.cast[b].find(r => r.t === a);
      if (x && y) A.mutual.push([a, b, x.o, y.o]);
    }));
    // conjunctions (same sign) with orb
    A.conj = [];
    PLANET_LIST.forEach((a, i) => PLANET_LIST.slice(i + 1).forEach(b => {
      if (A.pl[a].si === A.pl[b].si && !((a === 'Rahu' && b === 'Ketu') || (a === 'Ketu' && b === 'Rahu'))) A.conj.push([a, b, dist(S[a], S[b])]);
    }));
    A.war = A.conj.filter(r => WAR.includes(r[0]) && WAR.includes(r[1]) && r[2] < 1);
    // exchanges
    A.parivartana = []; A.nakEx = [];
    PLANET_LIST.forEach((a, i) => PLANET_LIST.slice(i + 1).forEach(b => {
      if (A.pl[a].sl === b && A.pl[b].sl === a) A.parivartana.push([a, b]);
      if (A.pl[a].nl === b && A.pl[b].nl === a) A.nakEx.push([a, b]);
    }));
    // dispositor chains
    A.chain = {};
    PLANET_LIST.forEach(n => {
      const seen = [n]; let cur = n, end = '';
      for (let k = 0; k < 10; k++){
        const nx = SIGNS[A.pl[cur].si].lord;
        if (nx === cur){ end = 'own sign (final dispositor)'; break; }
        if (seen.includes(nx)){ end = 'loop'; seen.push(nx); break; }
        seen.push(nx); cur = nx;
      }
      A.chain[n] = { path: seen, end };
    });
    // trine / element groups
    A.elem = [0, 1, 2, 3].map(() => []); A.modes = [0, 1, 2].map(() => []);
    PLANET_LIST.forEach(n => { A.elem[A.pl[n].si % 4].push(n); A.modes[A.pl[n].si % 3].push(n); });
    // signs & nakshatras occupancy
    A.signOcc = [...Array(12)].map((_, i) => PLANET_LIST.filter(n => A.pl[n].si === i));
    A.nakOcc = {};
    PLANET_LIST.forEach(n => (A.nakOcc[A.pl[n].ni] = A.nakOcc[A.pl[n].ni] || []).push(n));
    // panchang
    const e = nd(S.Moon - S.Sun), t = Math.floor(e / 12), half = Math.floor(e / 6);
    const kar = half === 0 ? 'Kimstughna' : half >= 57 ? ['Shakuni', 'Chatushpada', 'Naga'][half - 57] : KARANA7[(half - 1) % 7];
    const tzh = (c.p && mode === 'natal') ? c.p.tz : -new Date().getTimezoneOffset() / 60;
    A.pan = { tithi: (t % 15) + 1, paksha: t < 15 ? 'Shukla (waxing)' : 'Krishna (waning)', tName: t === 14 ? 'Purnima' : t === 29 ? 'Amavasya' : TITHI[t % 15],
      yoga: YOGA[Math.floor(nd(S.Sun + S.Moon) / (360 / 27)) % 27], karana: kar, lit: Math.round((1 - Math.cos(e * Math.PI / 180)) / 2 * 100),
      vara: WEEK[(((Math.floor(c.jd + 0.5 + tzh / 24) + 1) % 7) + 7) % 7] };
    return A;
  }

  const planetCard = (A, c, n) => {
    const p = A.pl[n], col = PLANET_COLORS[n] || '#ccc';
    const flags = [];
    if (p.retro && n !== 'Rahu' && n !== 'Ketu') flags.push(pill('Retrograde', 'warn'));
    if (p.station) flags.push(pill('Near station', 'warn'));
    if (p.comb) flags.push(pill('Combust', 'bad'));
    if (p.varg) flags.push(pill('Vargottama', 'good'));
    if (p.gand) flags.push(pill('Gandanta', 'bad'));
    const dc = { 'Exalted': 'good', 'Own sign': 'good', 'Friendly': 'soft', 'Neutral': '', 'Enemy': 'warn', 'Debilitated': 'bad' }[p.dign];
    const lordAt = (x) => { const q = A.pl[x]; return x + ' (' + sname(q.si) + (q.house ? ', H' + q.house : '') + ')'; };
    return '<div class="dbx-card" style="--pc:' + col + '"><div class="dbx-ch"><span class="dbx-gl">' + G(n) + '</span><div><b>' + n + '</b><small>' + SIGNS[p.si].symbol + ' ' + sname(p.si) + ' ' + dm(p.l) + '</small></div>' + pill(p.dign, dc) + '</div>'
      + '<div class="dbx-flags">' + flags.join('') + '</div>'
      + kv('Nakshatra', NAKSHATRAS[p.ni] + ' · pada ' + p.pada) + kv('Star lord', lordAt(p.nl)) + kv('Sign lord', p.sl === n ? 'itself (own sign)' : lordAt(p.sl))
      + (p.house ? kv('House', ord(p.house)) : '') + kv('From Moon', ord(p.fromMoon) + ' house') + kv('Navamsha', sname(p.nav))
      + kv('Speed', (p.speed >= 0 ? '+' : '') + p.speed.toFixed(3) + '°/day') + (COMBUST[n] ? kv('From Sun', p.sunD.toFixed(1) + '°' + (p.comb ? ' (within ' + COMBUST[n] + '°)' : '')) : '')
      + kv('Aspects', A.cast[n].length ? A.cast[n].map(r => G(r.t) + ' ' + r.t + ' (' + ord(r.o) + ')').join(', ') : 'no planet') + kv('Aspected by', A.by[n].length ? A.by[n].map(r => G(r.f) + ' ' + r.f).join(', ') : 'no planet') + '</div>';
  };

  function matrix(A){
    let h = '<div class="dbx-mwrap"><table class="dbx-mx"><tr><th></th>' + PLANET_LIST.map(n => '<th>' + G(n) + '</th>').join('') + '</tr>';
    PLANET_LIST.forEach(r => {
      h += '<tr><th>' + G(r) + '</th>';
      PLANET_LIST.forEach(cn => {
        if (r === cn){ h += '<td class="self">·</td>'; return; }
        const d = hs(A.pl[r].si, A.pl[cn].si), asp = (ASPECT_OFFSETS[r] || [7]).includes(d);
        const k = d === 1 ? 'cj' : (d === 5 || d === 9) ? 'tr' : (d === 4 || d === 7 || d === 10) ? 'ke' : (d === 6 || d === 8 || d === 12) ? 'du' : '';
        h += '<td class="' + k + (asp ? ' as' : '') + '">' + d + '</td>';
      });
      h += '</tr>';
    });
    return h + '</table></div><div class="dbx-leg"><span class="lg-tr">5 · 9 trine</span><span class="lg-ke">4 · 7 · 10 kendra</span><span class="lg-du">6 · 8 · 12 dusthana</span><span class="lg-cj">1 together</span><span class="lg-as">underlined = aspect</span></div>'
      + '<p class="dbx-note">Read across: the number is the house the column planet sits in, counted from the row planet.</p>';
  }

  function build(){
    const c = ctx(), A = analyse(c), T = [];
    const Hs = [];
    const sec = (id, title, body) => '<section class="dbx-sec" id="dbx-' + id + '"><h3>' + title + '</h3>' + body + '</section>';
    const pn = A.pan;
    let html = '';
    T.push('SKY DASHBOARD · ' + c.label, 'Ayanamsa (Lahiri): ' + c.ayan.toFixed(4) + '°');
    // panchang
    html += sec('pan', 'Panchang', '<div class="dbx-grid4">' + kv('Weekday', pn.vara) + kv('Tithi', pn.tName + ' (' + pn.tithi + ')') + kv('Paksha', pn.paksha) + kv('Moon lit', pn.lit + '%') + kv('Moon star', NAKSHATRAS[A.pl.Moon.ni] + ' ' + A.pl.Moon.pada) + kv('Yoga', pn.yoga) + kv('Karana', pn.karana) + kv('Ayanamsa', c.ayan.toFixed(3) + '°') + (A.lagnaSign != null ? kv('Lagna', sname(A.lagnaSign) + ' ' + dm(c.lagna)) : '') + '</div>');
    T.push('PANCHANG: ' + pn.vara + ', ' + pn.paksha + ' ' + pn.tName + ', Moon in ' + NAKSHATRAS[A.pl.Moon.ni] + ' pada ' + A.pl.Moon.pada + ', Yoga ' + pn.yoga + ', Karana ' + pn.karana + (A.lagnaSign != null ? ', Lagna ' + sname(A.lagnaSign) + ' ' + dm(c.lagna) : ''));
    // highlights
    const pick = f => PLANET_LIST.filter(n => f(A.pl[n]));
    const rows = [
      ['Retrograde', pick(p => p.retro && p.n !== 'Rahu' && p.n !== 'Ketu').map(nm)],
      ['Near station (slow, intense)', pick(p => p.station).map(nm)],
      ['Combust (close to Sun)', pick(p => p.comb).map(nm)],
      ['Exalted', pick(p => p.dign === 'Exalted').map(n => nm(n) + ' in ' + sname(A.pl[n].si))],
      ['Own sign', pick(p => p.dign === 'Own sign').map(n => nm(n) + ' in ' + sname(A.pl[n].si))],
      ['Debilitated', pick(p => p.dign === 'Debilitated').map(n => nm(n) + ' in ' + sname(A.pl[n].si))],
      ['Vargottama (same sign in D1 and D9)', pick(p => p.varg).map(nm)],
      ['Gandanta (sign-junction degrees)', pick(p => p.gand).map(nm)],
      ['Planetary war (within 1°)', A.war.map(r => nm(r[0]) + ' & ' + nm(r[1]) + ' ' + r[2].toFixed(2) + '°')],
      ['Sign exchange (parivartana)', A.parivartana.map(r => nm(r[0]) + ' ⇄ ' + nm(r[1]))],
      ['Nakshatra exchange', A.nakEx.map(r => nm(r[0]) + ' ⇄ ' + nm(r[1]))],
      ['Mutual aspects', A.mutual.map(r => nm(r[0]) + ' ⇄ ' + nm(r[1]) + ' (' + ord(r[2]) + '/' + ord(r[3]) + ')')],
      ['Conjunctions (same sign)', A.conj.map(r => nm(r[0]) + ' + ' + nm(r[1]) + ' · ' + r[2].toFixed(1) + '° apart · ' + sname(A.pl[r[0]].si))]
    ];
    html += sec('hi', 'Highlights', rows.map(r => '<div class="dbx-hl"><span>' + r[0] + '</span><div>' + chips(r[1]) + '</div></div>').join(''));
    rows.forEach(r => T.push(r[0].toUpperCase() + ': ' + (r[1].length ? r[1].join('; ').replace(/<[^>]+>/g, '') : 'none')));
    // planets
    html += sec('pl', 'Planets (9 grahas)', '<div class="dbx-cards">' + PLANET_LIST.map(n => planetCard(A, c, n)).join('') + '</div>');
    T.push('', 'PLANETS (sign deg · nakshatra pada · dignity · house · navamsha · flags)');
    PLANET_LIST.forEach(n => { const p = A.pl[n]; T.push(n + ': ' + sname(p.si) + ' ' + dm(p.l) + ' · ' + NAKSHATRAS[p.ni] + ' ' + p.pada + ' (lord ' + p.nl + ') · ' + p.dign + (p.house ? ' · H' + p.house : '') + ' · D9 ' + sname(p.nav) + ' · from Moon H' + p.fromMoon + (p.retro && n !== 'Rahu' && n !== 'Ketu' ? ' · retrograde' : '') + (p.comb ? ' · combust' : '') + (p.varg ? ' · vargottama' : '') + (p.gand ? ' · gandanta' : '') + ' · aspects ' + (A.cast[n].map(r => r.t + '(' + r.o + ')').join(',') || '-') + ' · aspected by ' + (A.by[n].map(r => r.f).join(',') || '-')); });
    // aspects
    html += sec('as', 'Who aspects whom', '<div class="dbx-asp">' + PLANET_LIST.map(n => '<div class="dbx-ar"><b>' + nm(n) + '</b><div><small>looks at</small> ' + A.castSigns[n].map(x => '<span class="dbx-chip">' + ord(x.o) + ' → ' + sname(x.ts) + (A.signOcc[x.ts].filter(q => q !== n).length ? ' (' + A.signOcc[x.ts].filter(q => q !== n).map(G).join('') + ')' : '') + '</span>').join('') + '</div></div>').join('') + '</div><p class="dbx-note">Whole-sign Vedic aspects: all planets see the 7th; Mars also 4th and 8th; Jupiter and the nodes 5th and 9th; Saturn 3rd and 10th.</p>');
    // relations
    const el4 = A.elem.map((a, i) => '<div class="dbx-hl"><span>' + ELEM[i] + ' trine (signs ' + [0, 1, 2].map(k => SIGNS[i + k * 4].name.slice(0, 3)).join(' · ') + ')</span><div>' + chips(a.map(nm)) + '</div></div>').join('');
    html += sec('rel', 'Trines and house relations', '<h4>Planets in trine by element</h4>' + el4 + '<h4>Planet-to-planet house distance</h4>' + matrix(A)
      + '<h4>Exchanges</h4><div class="dbx-hl"><span>Sign exchange</span><div>' + chips(A.parivartana.map(r => nm(r[0]) + ' ⇄ ' + nm(r[1]))) + '</div></div><div class="dbx-hl"><span>Nakshatra exchange</span><div>' + chips(A.nakEx.map(r => nm(r[0]) + ' ⇄ ' + nm(r[1]))) + '</div></div>'
      + '<h4>Dispositor chains (sign lord of sign lord...)</h4>' + PLANET_LIST.map(n => '<div class="dbx-hl"><span>' + nm(n) + '</span><div><span class="dbx-chip">' + A.chain[n].path.join(' → ') + ' · ' + A.chain[n].end + '</span></div></div>').join(''));
    T.push('', 'TRINES BY ELEMENT'); A.elem.forEach((a, i) => T.push(ELEM[i] + ': ' + (a.join(', ') || 'none')));
    T.push('', 'DISPOSITOR CHAINS'); PLANET_LIST.forEach(n => T.push(n + ': ' + A.chain[n].path.join(' > ') + ' · ' + A.chain[n].end));
    T.push('', 'HOUSE DISTANCE (from row planet to column planet)'); PLANET_LIST.forEach(r => T.push(r + ': ' + PLANET_LIST.filter(x => x !== r).map(x => x + ' ' + hs(A.pl[r].si, A.pl[x].si)).join(', ')));
    // signs
    html += sec('sg', 'Signs', '<div class="dbx-signs">' + SIGNS.map((s, i) => '<div class="dbx-sign' + (A.signOcc[i].length ? ' occ' : '') + '"><b>' + s.symbol + ' ' + s.name + '</b><small>' + ELEM[i % 4] + ' · ' + MODE[i % 3] + (A.lagnaSign != null ? ' · H' + hs(A.lagnaSign, i) : '') + '</small><div>' + (A.signOcc[i].length ? A.signOcc[i].map(n => '<span class="dbx-chip">' + nm(n) + '</span>').join('') : '<span class="dbx-none">empty</span>') + '</div><small>Lord ' + s.lord + ' in ' + sname(A.pl[s.lord].si) + '</small></div>').join('') + '</div>');
    T.push('', 'SIGNS'); SIGNS.forEach((s, i) => A.signOcc[i].length && T.push(s.name + ': ' + A.signOcc[i].join(', ') + ' (lord ' + s.lord + ' in ' + sname(A.pl[s.lord].si) + ')'));
    // nakshatras
    const nks = Object.keys(A.nakOcc).map(Number).sort((a, b) => a - b);
    html += sec('nk', 'Nakshatras occupied', nks.map(i => { const lord = NAKSHATRA_LORDS[i]; return '<div class="dbx-hl"><span>' + NAKSHATRAS[i] + '<small> · lord ' + lord + ' in ' + sname(A.pl[lord].si) + '</small></span><div>' + chips(A.nakOcc[i].map(n => nm(n) + ' ' + A.pl[n].pada)) + '</div></div>'; }).join(''));
    T.push('', 'NAKSHATRAS'); nks.forEach(i => T.push(NAKSHATRAS[i] + ' (lord ' + NAKSHATRA_LORDS[i] + ' in ' + sname(A.pl[NAKSHATRA_LORDS[i]].si) + '): ' + A.nakOcc[i].map(n => n + ' pada ' + A.pl[n].pada).join(', ')));
    // houses
    if (A.lagnaSign != null){
      let hh = '';
      for (let h = 1; h <= 12; h++){
        const si = (A.lagnaSign + h - 1) % 12, lord = SIGNS[si].lord, lp = A.pl[lord];
        const occ = A.signOcc[si], seen = PLANET_LIST.filter(f => A.castSigns[f].some(x => x.ts === si) && A.pl[f].si !== si);
        hh += '<div class="dbx-hl"><span>' + ord(h) + ' · ' + sname(si) + '<small> · lord ' + lord + ' in H' + lp.house + '</small></span><div><small>in house</small> ' + chips(occ.map(nm)) + '<br><small>aspected by</small> ' + chips(seen.map(nm)) + '</div></div>';
        T.push((h === 1 ? '\nHOUSES (from Lagna ' + sname(A.lagnaSign) + ')\n' : '') + 'H' + h + ' ' + sname(si) + ' (lord ' + lord + ' in H' + lp.house + '): ' + (occ.join(', ') || 'empty') + ' · aspected by ' + (seen.join(', ') || '-'));
      }
      html += sec('hs', 'Houses', hh);
    } else html += sec('hs', 'Houses', '<p class="dbx-note">Load a birth profile (+ button) to see houses counted from the Lagna.</p>');
    // balance
    html += sec('bal', 'Balance', '<div class="dbx-hl"><span>Elements</span><div>' + A.elem.map((a, i) => '<span class="dbx-chip">' + ELEM[i] + ' ' + a.length + '</span>').join('') + '</div></div><div class="dbx-hl"><span>Modes</span><div>' + A.modes.map((a, i) => '<span class="dbx-chip">' + MODE[i] + ' ' + a.length + '</span>').join('') + '</div></div>');
    // outer planets
    html += sec('out', 'Outer planets (shown for reference, not part of the 9 grahas)', '<div class="dbx-outer">' + OUTER_LIST.map(n => { const l = c.sid[n], si = sg(l); return '<div class="dbx-card slim"><b>' + n + '</b>' + kv('Sign', sname(si) + ' ' + dm(l)) + kv('Nakshatra', NAKSHATRAS[getNakshatraIndex(l)] + ' ' + (getPadaIndex(l) + 1)) + (A.lagnaSign != null ? kv('House', ord(hs(A.lagnaSign, si))) : '') + kv('Motion', c.retro[n] ? 'Retrograde' : 'Direct') + '</div>'; }).join('') + '</div>');
    T.push('', 'OUTER: ' + OUTER_LIST.map(n => n + ' ' + sname(sg(c.sid[n])) + ' ' + dm(c.sid[n]) + (c.retro[n] ? ' R' : '')).join(' · '));
    lastText = T.join('\n');
    return { c, html };
  }

  const NAV = [['pan', 'Panchang'], ['hi', 'Highlights'], ['pl', 'Planets'], ['as', 'Aspects'], ['rel', 'Trines'], ['sg', 'Signs'], ['nk', 'Nakshatras'], ['hs', 'Houses'], ['bal', 'Balance'], ['out', 'Outer']];
  function render(){
    const b = build(), p = isValidProfile(activeNatalProfile);
    el('dbxLabel').textContent = b.c.label;
    el('dbxMode').style.display = p ? '' : 'none';
    el('dbxMode').querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.m === mode));
    el('dbxBody').innerHTML = b.html;
  }
  function show(){
    if (!el('dbxRoot')){
      const d = document.createElement('div'); d.id = 'dbxRoot'; d.className = 'dbx';
      d.innerHTML = '<div class="dbx-top"><div class="dbx-t"><b>Sky Dashboard</b><small id="dbxLabel"></small></div><div class="dbx-seg" id="dbxMode"><button data-m="sky">3D date</button><button data-m="natal">Birth chart</button></div><button class="dbx-x" id="dbxCopy" type="button">Copy summary</button><button class="dbx-x" id="dbxClose" type="button" aria-label="Close">✕</button></div>'
        + '<div class="dbx-nav" id="dbxNav">' + NAV.map(n => '<button data-s="' + n[0] + '">' + n[1] + '</button>').join('') + '</div><div class="dbx-body" id="dbxBody"></div>';
      document.body.appendChild(d);
      el('dbxClose').onclick = hide;
      el('dbxCopy').onclick = () => { try { navigator.clipboard.writeText(lastText); el('dbxCopy').textContent = 'Copied'; setTimeout(() => el('dbxCopy').textContent = 'Copy summary', 1400); } catch (e) {} };
      el('dbxMode').onclick = e => { const m = e.target.dataset && e.target.dataset.m; if (m){ mode = m; render(); } };
      el('dbxNav').onclick = e => { const s = e.target.dataset && e.target.dataset.s; if (s){ const t = el('dbx-' + s); if (t) el('dbxBody').scrollTo({ top: t.offsetTop - 4 }); } };
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) hide(); });
    }
    if (mode === 'natal' && !isValidProfile(activeNatalProfile)) mode = 'sky';
    render(); el('dbxRoot').classList.add('show'); open = true; document.body.classList.add('dbx-open'); el('dbxBody').scrollTop = 0;
  }
  function hide(){ const r = el('dbxRoot'); if (r) r.classList.remove('show'); open = false; document.body.classList.remove('dbx-open'); }
  const btn = el('dashBtn'); if (btn) btn.addEventListener('click', show);
  return { show, hide, refresh(){ if (open) render(); }, text(){ return lastText; } };
})();

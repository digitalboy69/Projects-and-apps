/* ============================================================================
   PRASHNA (horary) CHART: a chart cast for the moment a question is asked, read with the classical Tajika checks
   (lagna lord, house lord of the matter, Ithasala/Easarapha, Moon). Global: PRN { compute, html, text }, buildPrashnaPanel(chart, profile).
   Orbs (deeptamsa) are common Tajika practice, labelled as such. Retrograde and the other Tajika yogas are not covered.
   ============================================================================ */
const PRN = (function(){
  const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th'));
  const g = PLANET_GLYPHS;
  const TOPICS = [
    ['marriage','💍','Marriage / partner',7,'Venus'], ['career','💼','Job / career',10,'Sun'], ['money','💰','Money',2,'Jupiter'],
    ['gains','📈','Gains / success',11,'Jupiter'], ['children','🧸','Children',5,'Jupiter'], ['study','📚','Study / exam',5,'Mercury'],
    ['home','🏠','Home / property',4,'Mars'], ['luck','🍀','Luck / travel',9,'Jupiter'], ['abroad','✈️','Going abroad',12,'Saturn'],
    ['health','🌿','Health',6,'Sun'], ['other','❓','Something else',1,'Moon']
  ];
  const ORB = { Sun:15, Moon:12, Mars:8, Mercury:7, Jupiter:9, Venus:7, Saturn:9 };
  const SPEED = ['Moon','Mercury','Venus','Sun','Mars','Jupiter','Saturn'];   // fastest to slowest
  const BEN = ['Jupiter','Venus','Mercury'], MAL = ['Sun','Mars','Saturn','Rahu','Ketu'];
  const ASPECT = { 0:'conjunction', 2:'sextile (friendly)', 4:'trine (friendly)', 3:'square (hard)', 6:'opposition (hard)' };
  function aspKind(s1, s2){ let d = (s2 - s1 + 12) % 12; if (d > 6) d = 12 - d; const m = {0:0, 2:2, 4:4, 3:3, 6:6}; return d in m ? d : null; }
  function ithasala(a, b, P){
    if (!a || !b || a === b || !(a in ORB) || !(b in ORB)) return null;
    const pa = P[a], pb = P[b], k = aspKind(pa.sign, pb.sign); if (k == null) return null;
    const f = SPEED.indexOf(a) < SPEED.indexOf(b) ? a : b, s = f === a ? b : a, pf = P[f], ps = P[s];
    const orb = (ORB[a] + ORB[b]) / 2;
    // distance still to run by the faster planet to reach the exact aspect with the slower one, measured within the sign
    let d = ps.degInSign - pf.degInSign;
    const rx = pf.retrograde || ps.retrograde;
    let kind = null; if (d >= 0 && d <= orb) kind = 'Ithasala'; else if (d < 0 && d >= -orb) kind = 'Easarapha';
    return { a, b, fast: f, slow: s, aspect: ASPECT[k], kind, gap: Math.abs(d), orb, rx };
  }
  function strength(n, P){
    const p = P[n]; if (!p) return { score: 0, notes: [] };
    let s = 0; const notes = [], st = (p.dignity || {}).status;
    if (st === 'Exalted' || st === 'Moolatrikona' || st === 'OwnSign'){ s += 2; notes.push('strong sign (' + ((p.dignity.label) || st) + ')'); }
    else if (st === 'Friend'){ s += 1; notes.push('friendly sign'); }
    else if (st === 'Enemy'){ s -= 1; notes.push('enemy sign'); }
    else if (st === 'Debilitated'){ s -= 2; notes.push('weak sign (debilitated)'); }
    if ([1,4,7,10,5,9].includes(p.house)){ s += 1; notes.push('in the ' + ord(p.house) + ' house (supportive place)'); }
    else if ([6,8,12].includes(p.house)){ s -= 1; notes.push('in the ' + ord(p.house) + ' house (difficult place)'); }
    else notes.push('in the ' + ord(p.house) + ' house');
    if (p.combustion && p.combustion.isCombust){ s -= 1; notes.push('too close to the Sun (combust)'); }
    return { score: s, notes };
  }
  function compute(chart, topicId){
    const T = TOPICS.find(t => t[0] === topicId) || TOPICS[0], house = T[3], P = chart.planets, asc = chart.ascendant.sign;
    const lagSign = SIGNS[asc], LL = lagSign.lord, kSign = (asc + house - 1) % 12, KL = SIGNS[kSign].lord;
    const items = [], add = (tone, title, text) => items.push({ tone, title, text });
    const sl = strength(LL, P), sk = strength(KL, P);
    add(sl.score >= 1 ? 'good' : sl.score <= -1 ? 'bad' : 'mid', 'You (lagna lord ' + LL + ')', LL + ' stands for the person asking: ' + sl.notes.join(', ') + '.');
    if (topicId !== 'other'){
      add(sk.score >= 1 ? 'good' : sk.score <= -1 ? 'bad' : 'mid', 'The matter (' + ord(house) + ' lord ' + KL + ')', KL + ' stands for the matter asked about: ' + sk.notes.join(', ') + '.');
      const occ = PLANET_LIST.filter(n => P[n].house === house), ben = occ.filter(n => BEN.includes(n)), mal = occ.filter(n => MAL.includes(n));
      if (occ.length) add(ben.length >= mal.length ? 'good' : 'bad', 'Inside the ' + ord(house) + ' house', occ.join(', ') + ' ' + (occ.length > 1 ? 'are' : 'is') + ' placed here (' + (ben.length ? ben.length + ' gentle' : '0 gentle') + ', ' + (mal.length ? mal.length + ' harsh' : '0 harsh') + ').');
      else add('mid', 'Inside the ' + ord(house) + ' house', 'No planet is placed here, so the lord matters most.');
    }
    // lagna lord with matter lord
    const link = topicId === 'other' ? null : (LL === KL ? 'same' : ithasala(LL, KL, P));
    if (topicId !== 'other'){
      if (link === 'same') add('good', 'You and the matter', LL + ' rules both the lagna and the ' + ord(house) + ' house, so the question is closely tied to you.');
      else if (link && link.kind === 'Ithasala') add('good', 'Ithasala: ' + LL + ' & ' + KL, 'They are in ' + link.aspect + ' and still coming closer (' + link.gap.toFixed(1) + '° apart, orb ' + link.orb.toFixed(1) + '°). Tradition reads this as the matter moving towards fulfilment.' + (link.rx ? ' One is retrograde, so this needs a closer look.' : ''));
      else if (link && link.kind === 'Easarapha') add('bad', 'Easarapha: ' + LL + ' & ' + KL, 'They are in ' + link.aspect + ' but the meeting is already past (' + link.gap.toFixed(1) + '° apart). Tradition reads this as the chance slipping by.');
      else add('mid', 'You and the matter', LL + ' and ' + KL + ' are not linked by a close Tajika aspect. No clear link either way.');
    }
    // Moon
    const mn = P.Moon, mnS = strength('Moon', P), elong = (chart.planets.Moon.longitude - chart.planets.Sun.longitude + 360) % 360, waxing = elong < 180;
    add(waxing ? 'good' : 'mid', 'Moon phase', 'The Moon is ' + (waxing ? 'waxing (growing), a gentle sign' : 'waning (shrinking), so things may be slower') + '.');
    add(mnS.score >= 1 ? 'good' : mnS.score <= -1 ? 'bad' : 'mid', 'Moon (the mind of the question)', 'Moon ' + mnS.notes.join(', ') + '.');
    const mLinks = [LL, KL].filter((x, i, a) => a.indexOf(x) === i && x !== 'Moon').map(x => ithasala('Moon', x, P)).filter(Boolean);
    mLinks.forEach(l => { if (l.kind) add(l.kind === 'Ithasala' ? 'good' : 'bad', 'Moon ' + l.kind + ' with ' + (l.a === 'Moon' ? l.b : l.a), 'Moon is in ' + l.aspect + ' with ' + (l.a === 'Moon' ? l.b : l.a) + ', ' + l.gap.toFixed(1) + '° apart (' + (l.kind === 'Ithasala' ? 'still approaching' : 'already separating') + ').'); });
    const mod = lagSign.modality; 
    add(mod === 'Fixed' ? 'mid' : mod === 'Movable' ? 'good' : 'mid', 'Lagna is ' + mod.toLowerCase(), mod === 'Movable' ? 'A movable sign: tradition says the matter moves quickly.' : mod === 'Fixed' ? 'A fixed sign: tradition says the matter is steady and may be slow to change.' : 'A dual sign: tradition says results can be mixed or come in two stages.');
    const good = items.filter(i => i.tone === 'good').length, bad = items.filter(i => i.tone === 'bad').length;
    const lean = good - bad >= 2 ? 'More signs in favour' : bad - good >= 2 ? 'More signs against' : 'Balanced / unclear';
    return { T, house, LL, KL, items, good, bad, lean, lagSign };
  }
  function text(chart, topicId){
    try { const d = compute(chart, topicId); return 'Prashna chart (' + d.T[2] + '): lagna ' + d.lagSign.name + '. ' + d.lean + ' (' + d.good + ' in favour, ' + d.bad + ' against). ' + d.items.map(i => i.title + ': ' + i.text).join(' '); } catch(e){ return ''; }
  }
  function table(chart){
    const rows = PLANET_LIST.map(n => { const p = chart.planets[n]; return '<tr><td>' + g[n] + ' ' + n + '</td><td>' + SIGNS[p.sign].symbol + ' ' + SIGNS[p.sign].name + ' ' + p.degInSign.toFixed(1) + '°' + (p.retrograde ? ' ℞' : '') + '</td><td>' + ord(p.house) + '</td></tr>'; }).join('');
    return '<table class="prn-t"><tr><th>Planet</th><th>Sign</th><th>House</th></tr>' + rows + '</table>';
  }
  function html(chart, topicId, style){
    const d = compute(chart, topicId), v = chart.vargas.D1;
    const prev = window.__vgC; window.__vgC = chart; let svg = '';
    try { svg = style === 'south' ? buildSouthIndianSvg(v, null) : buildNorthIndianSvg(v, null); } catch(e){ console.warn('prashna svg', e); } window.__vgC = prev;
    const tone = d.lean.indexOf('favour') > -1 ? 'good' : d.lean.indexOf('against') > -1 ? 'bad' : 'mid';
    const it = d.items.map(i => '<div class="prn-i ' + i.tone + '"><b>' + i.title + '</b><p>' + i.text + '</p></div>').join('');
    return '<div class="prn-hero ' + tone + '"><small>' + d.T[1] + ' ' + d.T[2] + (d.T[0] === 'other' ? '' : ' · ' + ord(d.house) + ' house') + '</small><b>' + d.lean + '</b><span>' + d.good + ' sign' + (d.good === 1 ? '' : 's') + ' in favour · ' + d.bad + ' against. A traditional aid for thinking, not a prediction.</span></div>'
      + '<div class="prn-sw"><button type="button" data-prn-st="north" class="' + (style === 'south' ? '' : 'on') + '">North Indian</button><button type="button" data-prn-st="south" class="' + (style === 'south' ? 'on' : '') + '">South Indian</button></div>'
      + '<div class="prn-svg">' + svg + '</div>' + it
      + '<details class="prn-d"><summary>Planet positions</summary>' + table(chart) + '</details>'
      + '<p class="prn-note">Tajika orbs used (Sun 15°, Moon 12°, Mars 8°, Mercury 7°, Jupiter 9°, Venus 7°, Saturn 9°; link orb = half the sum of the two) are common practice. Retrograde planets and the other Tajika yogas are not covered. Ask one clear question only once.</p>'
      + '<button type="button" class="chgp-btn" id="prnCopy"><span>📋</span> Copy reading</button>';
  }
  let STATE = { topic: 'marriage', style: 'north', chart: null, place: null };
  function panel(chart, profile){
    const tz = Number(profile.tz != null ? profile.tz : chart.tzOffsetHours), now = jdToLocalParts(Date.now() / 86400000 + 2440587.5, tz);
    STATE.place = { lat: Number(profile.lat), lon: Number(profile.lon), tz, name: profile.place || 'your birth place' };
    const chips = TOPICS.map(t => '<button type="button" data-prn-t="' + t[0] + '" class="' + (t[0] === STATE.topic ? 'on' : '') + '">' + t[1] + ' ' + t[2] + '</button>').join('');
    return '<div class="prnp"><div class="avk-intro">A Prashna chart is cast for the moment a question is asked. Pick what you are asking about, then read the signs. The chart is made for <b id="prnWhere">' + escapeHtml(String(STATE.place.name)) + '</b>.</div>'
      + '<div class="prn-chips">' + chips + '</div>'
      + '<div class="chgp-in"><label>Date <input type="date" id="prnDate" value="' + now.dateStr + '"></label><label>Time <input type="time" id="prnTime" value="' + now.timeStr.slice(0, 5) + '"></label><button type="button" id="prnNow" class="chgp-btn">Now</button><button type="button" id="prnLoc" class="chgp-btn">📍 Where I am</button></div>'
      + '<div id="prnBody"></div></div>';
  }
  function draw(){
    const b = document.getElementById('prnBody'); if (!b || !STATE.place) return;
    const ds = document.getElementById('prnDate').value, ts = document.getElementById('prnTime').value || '12:00'; if (!ds) return;
    try {
      const c = computeChart(ds, ts, STATE.place.lat, STATE.place.lon, STATE.place.tz); STATE.chart = c;
      b.innerHTML = html(c, STATE.topic, STATE.style);
    } catch(e){ console.warn('prashna', e); b.innerHTML = '<div class="meta-err">Could not cast this chart.</div>'; }
  }
  document.addEventListener('input', e => { if (e.target.id === 'prnDate' || e.target.id === 'prnTime') draw(); });
  document.addEventListener('click', e => {
    const t = e.target.closest ? e.target.closest('[data-prn-t],[data-prn-st],#prnNow,#prnLoc,#prnCopy') : null; if (!t) return;
    if (t.dataset.prnT){ STATE.topic = t.dataset.prnT; document.querySelectorAll('[data-prn-t]').forEach(x => x.classList.toggle('on', x === t)); draw(); }
    else if (t.dataset.prnSt){ STATE.style = t.dataset.prnSt; draw(); }
    else if (t.id === 'prnNow' && STATE.place){ const n = jdToLocalParts(Date.now() / 86400000 + 2440587.5, STATE.place.tz); document.getElementById('prnDate').value = n.dateStr; document.getElementById('prnTime').value = n.timeStr.slice(0, 5); draw(); }
    else if (t.id === 'prnLoc'){
      if (!navigator.geolocation){ t.textContent = 'Not available'; return; }
      navigator.geolocation.getCurrentPosition(pos => {
        const tz = -new Date().getTimezoneOffset() / 60; STATE.place = { lat: pos.coords.latitude, lon: pos.coords.longitude, tz, name: 'where you are now' };
        const w = document.getElementById('prnWhere'); if (w) w.textContent = STATE.place.name;
        const n = jdToLocalParts(Date.now() / 86400000 + 2440587.5, tz); document.getElementById('prnDate').value = n.dateStr; document.getElementById('prnTime').value = n.timeStr.slice(0, 5); draw();
      }, () => { t.textContent = '📍 Not allowed, using birth place'; setTimeout(() => { t.textContent = '📍 Where I am'; }, 2500); }, { timeout: 8000 });
    }
    else if (t.id === 'prnCopy' && STATE.chart) copyTextToClipboard(text(STATE.chart, STATE.topic), t, '<span>📋</span> Copy reading');
  });
  window.buildPrashnaPanel = function(chart, profile){ setTimeout(draw, 0); return panel(chart, profile); };
  return { compute, html, text, ithasala, TOPICS, ORB };
})();

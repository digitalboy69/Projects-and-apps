/* Synastry (js/143): how two charts sit on each other. Facts of placement only; nothing here is a verdict on a relationship.
   Whole-sign houses: a planet of A is in house N of B when its sign is N signs from B's Lagna sign (1 = the Lagna sign itself).
   Shown: each person's planets (seven grahas plus Rahu and Ketu) in the other's houses; the two Moon signs counted both ways; each Lagna lord in the other's chart;
   contacts between the seven grahas of A and B (same sign = conjunct; aspect at sign level using the app's own rule, js/09: every planet looks at the 7th sign,
   Mars also the 4th and 8th, Jupiter the 5th and 9th, Saturn the 3rd and 10th); the existing Ashtakoota score (js/51 kmMatch), in both orders because that score is not symmetric.
   The "strongest links" ranking is THIS APP'S OWN simple rule, said on the page: each contact scores the weights of its two planets (Moon 3; Sun, Venus, Mars and a Lagna lord 2; Mercury, Jupiter, Saturn 1)
   plus 2 for a conjunction or a two-way aspect, 1 for a one-way aspect. It is a way to choose which few contacts to look at first, not a classical rule.
   Rahu and Ketu are shown in the house tables but not used for contacts (aspect rules for the nodes differ by school).
   Uses SIGNS (js/05), getAspectedHouses (js/09), kmPerson/kmMatch (js/51), loadProfiles (js/18). Classes syn- prefixed. Tendency words only. */
const SYN = (() => {
  const G7 = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const ALL = G7.concat(['Rahu', 'Ketu']);
  const W = { Moon: 3, Sun: 2, Venus: 2, Mars: 2, Mercury: 1, Jupiter: 1, Saturn: 1 };
  const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* person from a profile; pass a ready chart to avoid recomputing */
  function person(profile, chart) {
    const c = chart || computeChart(profile.dob, profile.tob.length === 5 ? profile.tob + ':00' : profile.tob, profile.lat, profile.lon, profile.tz);
    const moon = c.planets.Moon;
    return { profile, chart: c, name: (profile && profile.name) || 'Person', moonSign: moon.sign, nak: Math.floor(normDeg(moon.longitude) / (360 / 27)), pada: moon.nakshatra.pada, deg: moon.degInSign, lagna: c.ascendant.sign };
  }
  const houseIn = (sign, P) => (sign - P.lagna + 12) % 12 + 1;
  const aspectSigns = (name, sign) => getAspectedHouses(name, 1).map(h => (sign + h - 1) % 12);

  /* planets of X laid over the houses of Y */
  function overlay(X, Y) {
    return ALL.map(n => { const s = X.chart.planets[n].sign; return { planet: n, sign: s, signName: SIGNS[s].name, house: houseIn(s, Y) }; });
  }
  function moonRel(A, B) {
    const ab = (B.moonSign - A.moonSign + 12) % 12 + 1, ba = (A.moonSign - B.moonSign + 12) % 12 + 1;
    return { aToB: ab, bToA: ba, aSign: SIGNS[A.moonSign].name, bSign: SIGNS[B.moonSign].name, same: A.moonSign === B.moonSign };
  }
  function lagnaLords(A, B) {
    const one = (X, Y) => { const lord = SIGNS[X.lagna].lord, s = X.chart.planets[lord].sign; return { person: X.name, lagnaSign: SIGNS[X.lagna].name, lord, signInOwn: SIGNS[s].name, houseInOwn: houseIn(s, X), houseInOther: houseIn(s, Y), other: Y.name }; };
    return { a: one(A, B), b: one(B, A) };
  }
  /* contacts between the seven grahas of A and of B */
  function contacts(A, B) {
    const out = [], la = SIGNS[A.lagna].lord, lb = SIGNS[B.lagna].lord;
    G7.forEach(pa => G7.forEach(pb => {
      const sa = A.chart.planets[pa].sign, sb = B.chart.planets[pb].sign;
      let kind, dir;
      if (sa === sb) { kind = 'conjunct'; dir = 'mutual'; }
      else {
        const ab = aspectSigns(pa, sa).includes(sb), ba = aspectSigns(pb, sb).includes(sa);
        if (!ab && !ba) return;
        kind = 'aspect'; dir = ab && ba ? 'mutual' : ab ? 'AtoB' : 'BtoA';
      }
      const wa = Math.max(W[pa], pa === la ? 2 : 0), wb = Math.max(W[pb], pb === lb ? 2 : 0);
      const score = wa + wb + (kind === 'conjunct' || dir === 'mutual' ? 2 : 1);
      const lead = (pa === la ? ` (${A.name}'s Lagna lord)` : '');
      const lead2 = (pb === lb ? ` (${B.name}'s Lagna lord)` : '');
      let reason;
      if (kind === 'conjunct') reason = `${A.name}'s ${pa}${lead} and ${B.name}'s ${pb}${lead2} share ${SIGNS[sa].name}`;
      else if (dir === 'mutual') reason = `${A.name}'s ${pa}${lead} in ${SIGNS[sa].name} and ${B.name}'s ${pb}${lead2} in ${SIGNS[sb].name} look at each other`;
      else if (dir === 'AtoB') reason = `${A.name}'s ${pa}${lead} in ${SIGNS[sa].name} looks at ${B.name}'s ${pb}${lead2} in ${SIGNS[sb].name}`;
      else reason = `${B.name}'s ${pb}${lead2} in ${SIGNS[sb].name} looks at ${A.name}'s ${pa}${lead} in ${SIGNS[sa].name}`;
      out.push({ a: pa, b: pb, kind, dir, score, reason });
    }));
    out.sort((x, y) => y.score - x.score || G7.indexOf(x.a) - G7.indexOf(y.a) || G7.indexOf(x.b) - G7.indexOf(y.b));
    return out;
  }
  function compute(A, B) {
    const c = contacts(A, B);
    let km = null;
    try { const ab = kmMatch(A, B), ba = kmMatch(B, A); km = { ab: { total: ab.total, verdict: ab.verdict }, ba: { total: ba.total, verdict: ba.verdict } }; } catch (e) { km = null; }
    return { A: A.name, B: B.name, aInB: overlay(A, B), bInA: overlay(B, A), moon: moonRel(A, B), lords: lagnaLords(A, B), contacts: c, top: c.slice(0, 5), km };
  }

  /* ---------- screen ---------- */
  const ST = { a: 'cur', b: '' };
  function options() {
    let list = []; try { list = (typeof loadProfiles === 'function') ? loadProfiles() : []; } catch (e) { list = []; }
    return list;
  }
  function pick(v, ch, pf) {
    if (v === 'cur') return person(Object.assign({ name: (pf && pf.name) || 'You' }, pf || {}), ch);
    const p = options()[+v]; return p ? person(p) : null;
  }
  const sel = (id, val, ch, pf) => `<select id="${id}" class="syn-sel" aria-label="${id === 'synA' ? 'First person' : 'Second person'}"><option value="cur"${val === 'cur' ? ' selected' : ''}>${esc((pf && pf.name) || 'Current chart')} (on screen)</option>${options().map((p, i) => `<option value="${i}"${String(val) === String(i) ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}</select>`;
  const tbl = (rows, owner, other) => `<table class="syn-t"><thead><tr><th>${esc(owner)}'s</th><th>sign</th><th>in ${esc(other)}'s house</th></tr></thead><tbody>${rows.map(r => `<tr><td><b>${r.planet}</b></td><td>${esc(r.signName)}</td><td>${ord(r.house)}</td></tr>`).join('')}</tbody></table>`;
  function result(d) {
    const kind = k => k === 'conjunct' ? 'Conjunct' : 'Aspect';
    const top = d.top.length ? d.top.map(t => `<li class="syn-link"><span class="syn-k ${t.kind}">${kind(t.kind)}</span><span>${esc(t.reason)}</span></li>`).join('') : '<li class="syn-link"><span>No planet of one chart shares a sign with, or looks at, a planet of the other.</span></li>';
    const m = d.moon, L = d.lords;
    const lord = x => `<li><b>${esc(x.person)}</b>: Lagna ${esc(x.lagnaSign)}, lord ${x.lord} in ${esc(x.signInOwn)} (${ord(x.houseInOwn)} house of their own chart). In ${esc(x.other)}'s chart that sign is the ${ord(x.houseInOther)} house.</li>`;
    const km = d.km ? `<p class="syn-km">Ashtakoota with ${esc(d.A)} first: <b>${d.km.ab.total}/36</b> (${esc(d.km.ab.verdict)}). With ${esc(d.B)} first: <b>${d.km.ba.total}/36</b> (${esc(d.km.ba.verdict)}). The score depends on the order, so both are shown. Open Match for the full breakdown.</p>` : '';
    return `<section class="syn-sec"><h4>Strongest contacts <span>${d.contacts.length} in all</span></h4><ul class="syn-links">${top}</ul>
        <p class="syn-fine">Chosen by this app's own simple count (see How this is worked out), so you know where to look first. It is not a verdict.</p></section>
      <section class="syn-sec"><h4>The two Moons</h4><p>${esc(d.A)}'s Moon is in ${esc(m.aSign)} and ${esc(d.B)}'s in ${esc(m.bSign)}. ${m.same ? 'Both Moons are in the same sign.' : `${esc(d.B)}'s Moon is the ${ord(m.aToB)} sign from ${esc(d.A)}'s, and ${esc(d.A)}'s is the ${ord(m.bToA)} from ${esc(d.B)}'s.`}</p>${km}</section>
      <section class="syn-sec"><h4>Lagna lords</h4><ul class="syn-ll">${lord(L.a)}${lord(L.b)}</ul></section>
      <section class="syn-sec"><h4>Planets in each other's houses</h4><div class="syn-two">${tbl(d.aInB, d.A, d.B)}${tbl(d.bInA, d.B, d.A)}</div></section>`;
  }
  function body(ch, pf) {
    const A = pick(ST.a, ch, pf), B = ST.b === '' ? null : pick(ST.b, ch, pf);
    if (!B) return `<p class="syn-empty">Pick a second person. Profiles you save in the app appear in the list.</p>`;
    if (!A) return `<p class="syn-empty">The first person could not be read.</p>`;
    let d; try { d = compute(A, B); } catch (e) { return '<p class="syn-empty">Could not read one of the two charts. Check the birth details.</p>'; }
    return result(d);
  }
  function html(ch, pf) {
    const list = options();
    if (ST.b === '' && list.length) { const i = list.findIndex(p => !pf || p.name !== pf.name); ST.b = String(i >= 0 ? i : 0); }
    return `<div class="syn"><div class="syn-hero"><h3>Synastry</h3><p>How two charts sit on each other: each person's planets in the other's houses, the contacts between them and the two Moons. These are placements, not predictions.</p></div>
      <div class="syn-pick"><label><small>First</small>${sel('synA', ST.a, ch, pf)}</label><label><small>Second</small>${sel('synB', ST.b, ch, pf)}</label><button type="button" id="synSwap" class="syn-swap" aria-label="Swap the two people">⇄</button></div>
      <div id="synBody">${body(ch, pf)}</div>
      <details class="syn-note"><summary>How this is worked out</summary>
        <p>Houses are whole signs: a planet is in the ${ord(1)} house of the other chart when it is in that chart's Lagna sign, the ${ord(2)} when it is the next sign on, and so on.</p>
        <p>A contact is a planet of one chart in the same sign as, or aspecting the sign of, a planet of the other. The aspect rule is the one the rest of this app uses: every planet looks at the 7th sign from itself, Mars also at the 4th and 8th, Jupiter at the 5th and 9th, Saturn at the 3rd and 10th. Rahu and Ketu are shown in the house tables only, because teachers differ on their aspects.</p>
        <p>The strongest contacts are ranked by a simple count that is this app's own choice: the Moon counts 3; Sun, Venus, Mars and a Lagna lord count 2; Mercury, Jupiter and Saturn count 1; a conjunction or a two-way aspect adds 2 and a one-way aspect adds 1. It only picks which few to look at first.</p>
        <p>Whether a contact feels easy or hard depends on the planets, the signs and the houses involved, and on both Dashas. Read these as tendencies and as topics to talk about.</p>
      </details></div>`;
  }
  function text(ch, pf) {
    const A = pick(ST.a, ch, pf), B = ST.b === '' ? null : pick(ST.b, ch, pf); if (!A || !B) return 'Synastry: pick two people.';
    const d = compute(A, B); return `Synastry ${d.A} + ${d.B}: ` + (d.top.length ? d.top.map(t => t.reason).join('; ') : 'no contacts between the two charts');
  }
  function bind() {
    const redraw = root => { const ch = typeof currentChartForModal !== 'undefined' ? currentChartForModal : null; if (!ch) return; root.querySelector('#synBody').innerHTML = body(ch, window.__vgProf); };
    document.addEventListener('change', e => {
      if (e.target.id !== 'synA' && e.target.id !== 'synB') return; const root = e.target.closest('.syn'); if (!root) return;
      if (e.target.id === 'synA') ST.a = e.target.value; else ST.b = e.target.value; redraw(root);
    });
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('#synSwap'); if (!b) return; const root = b.closest('.syn'); if (!root) return;
      const t = ST.a; ST.a = ST.b === '' ? 'cur' : ST.b; ST.b = t; root.querySelector('#synA').value = ST.a; root.querySelector('#synB').value = ST.b; redraw(root);
    });
  }
  if (typeof document !== 'undefined' && document.addEventListener) bind();
  window.buildSynastryPanel = function (chart, profile) { ST.a = 'cur'; ST.b = ''; return html(chart, profile || window.__vgProf || {}); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-synastry', window.buildSynastryPanel);
  return { person, overlay, moonRel, lagnaLords, contacts, compute, aspectSigns, houseIn, html, text, G7, ALL, W, state: ST };
})();

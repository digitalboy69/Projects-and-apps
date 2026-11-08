/* Planetary Avasthas (js/134): the "state" of each of the seven grahas, three classical lists, from BPHS ch. 45.
   Baladi   (age, from the degree in the sign): Bala, Kumara, Yuva, Vriddha, Mrita (odd signs run forward, even signs backward).
   Jagradadi (alertness, from sign dignity): Jagrat (own or exalted sign), Swapna (friend or neutral sign), Sushupti (enemy or debilitated sign).
   Deeptadi  (mood, from sign dignity and friendship): Deepta, Swastha, Pramudita, Shanta, Deena, Khala; plus Kopa (combust) and Vikala (with a malefic) as extra notes.
   Sources: BPHS ch.45 (barbarapijan.com/bpa/Amsha/avasta_BPHS_ch45_Avasta.htm), Wikipedia "Avastha (Hindu astrology)". Rahu and Ketu are left out: the texts give these lists for the seven grahas.
   Lajjitadi (6 states) is NOT built: the two sources word its conditions differently.
   This app's own choices, said on the page: friendship is the compound (natural + temporary) one; "Pramudita" = great friend's sign; Vikala uses the BPHS "company of a malefic" reading
   (Sun, Mars, Saturn, Rahu, Ketu in the same sign); a debilitated planet takes its Deeptadi state from the sign lord's friendship because the list has no debilitation state.
   Uses SIGNS (js/05), NATURAL_RELATIONS / getDignity (js/07). Tendencies only, never fate. Classes are avs- prefixed. */
const AVS = (() => {
  const GRAHA = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const MALEFIC = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];
  const BALADI = [
    { id: 'Bala', pct: 25, line: 'young, about a quarter of its results' },
    { id: 'Kumara', pct: 50, line: 'growing, about half of its results' },
    { id: 'Yuva', pct: 100, line: 'in its prime, its full results' },
    { id: 'Vriddha', pct: 10, line: 'old, only a little of its results' },
    { id: 'Mrita', pct: 0, line: 'spent, hardly any results of its own' }
  ];
  const JAG = {
    Jagrat: { pct: 100, line: 'awake: gives its results fully' },
    Swapna: { pct: 50, line: 'dreaming: gives its results in part' },
    Sushupti: { pct: 0, line: 'asleep: gives little unless helped' }
  };
  const DEEP = {
    Deepta: 'bright, in its exaltation sign',
    Swastha: 'comfortable, in its own sign',
    Pramudita: 'delighted, in a great friend\'s sign',
    Shanta: 'peaceful, in a friend\'s sign',
    Deena: 'plain, in a neutral sign',
    Khala: 'strained, in an enemy\'s sign'
  };
  const sgn = (l) => Math.floor(((l % 360) + 360) % 360 / 30);

  /* Baladi from degree in the sign (0-30). Odd signs (Aries = index 0 is odd) run Bala to Mrita, even signs the other way. */
  function baladi(signIdx, deg) {
    const k = Math.min(4, Math.floor(deg / 6));
    const idx = signIdx % 2 === 0 ? k : 4 - k;
    return { state: BALADI[idx].id, pct: BALADI[idx].pct, line: BALADI[idx].line, why: `${deg.toFixed(1)}° in ${SIGNS[signIdx].name}, an ${signIdx % 2 === 0 ? 'odd' : 'even'} sign` };
  }

  /* Compound (panchadha) relation of planet a toward planet b, with a in sign sa and b in sign sb.
     natural friend/neutral/enemy, temporary friend when b is 2,3,4,10,11 or 12 signs from a, otherwise temporary enemy. */
  function natural(a, b) {
    const r = NATURAL_RELATIONS[a];
    return r.friends.includes(b) ? 'F' : r.enemies.includes(b) ? 'E' : 'N';
  }
  function compound(a, b, sa, sb) {
    const d = ((sb - sa + 12) % 12) + 1;
    const t = [2, 3, 4, 10, 11, 12].includes(d) ? 'F' : 'E';
    const n = natural(a, b);
    if (n === 'F') return t === 'F' ? 'AdhiMitra' : 'Sama';
    if (n === 'N') return t === 'F' ? 'Mitra' : 'Shatru';
    return t === 'F' ? 'Sama' : 'AdhiShatru';
  }
  const REL_TXT = { AdhiMitra: 'great friend', Mitra: 'friend', Sama: 'neutral', Shatru: 'enemy', AdhiShatru: 'great enemy' };

  function jagradadi(p) {
    const s = p.dignity.status;
    if (s === 'Exalted') return { state: 'Jagrat', why: 'exalted sign' };
    if (s === 'Moolatrikona' || s === 'OwnSign') return { state: 'Jagrat', why: 'own sign' };
    if (s === 'Debilitated') return { state: 'Sushupti', why: 'debilitated sign' };
    if (s === 'Enemy') return { state: 'Sushupti', why: 'sign of a natural enemy' };
    return { state: 'Swapna', why: s === 'Friend' ? 'sign of a natural friend' : 'sign of a natural neutral' };
  }

  function deeptadi(chart, name) {
    const p = chart.planets[name], s = p.dignity.status;
    let state, why;
    if (s === 'Exalted') { state = 'Deepta'; why = 'exaltation sign'; }
    else if (s === 'Moolatrikona' || s === 'OwnSign') { state = 'Swastha'; why = 'own sign'; }
    else {
      const lord = SIGNS[p.sign].lord, lp = chart.planets[lord];
      const rel = compound(name, lord, p.sign, lp.sign);
      if (rel === 'AdhiMitra') { state = 'Pramudita'; why = `sign of ${lord}, a great friend (natural and temporary friend)`; }
      else if (rel === 'Mitra') { state = 'Shanta'; why = `sign of ${lord}, a friend`; }
      else if (rel === 'Sama') { state = 'Deena'; why = `sign of ${lord}, neutral by the compound reckoning`; }
      else { state = 'Khala'; why = `sign of ${lord}, ${REL_TXT[rel]} by the compound reckoning`; }
      if (s === 'Debilitated') why += ' (debilitated; the list has no debilitation state, so the sign lord decides)';
    }
    const also = [];
    if (p.combustion && p.combustion.combust) also.push({ state: 'Kopa', why: 'combust, too close to the Sun' });
    const mates = MALEFIC.filter(m => m !== name && chart.planets[m] && chart.planets[m].sign === p.sign);
    if (mates.length) also.push({ state: 'Vikala', why: 'in the company of ' + mates.join(', ') });
    return { state, text: DEEP[state], why, also };
  }

  function compute(chart) {
    const planets = {};
    GRAHA.forEach(name => {
      const p = chart.planets[name];
      const j = jagradadi(p);
      planets[name] = {
        sign: SIGNS[p.sign].name,
        baladi: baladi(p.sign, p.degInSign),
        jagradadi: Object.assign({}, j, { pct: JAG[j.state].pct, line: JAG[j.state].line }),
        deeptadi: deeptadi(chart, name)
      };
    });
    const n = f => GRAHA.filter(f).length;
    return {
      planets,
      sum: {
        awake: n(g => planets[g].jagradadi.state === 'Jagrat'),
        asleep: n(g => planets[g].jagradadi.state === 'Sushupti'),
        yuva: n(g => planets[g].baladi.state === 'Yuva'),
        weakAge: n(g => ['Vriddha', 'Mrita'].includes(planets[g].baladi.state)),
        total: GRAHA.length
      }
    };
  }

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const chipC = { Jagrat: 'ok', Yuva: 'ok', Kumara: 'mid', Bala: 'mid', Swapna: 'mid', Vriddha: 'low', Mrita: 'low', Sushupti: 'low' };
  function html(chart, profile) {
    const D = compute(chart), s = D.sum;
    const cards = GRAHA.map(name => {
      const p = D.planets[name], g = (typeof PLANET_GLYPHS !== 'undefined' && PLANET_GLYPHS[name]) || '';
      const dc = ['Deepta', 'Swastha', 'Pramudita'].includes(p.deeptadi.state) ? 'ok' : p.deeptadi.state === 'Khala' ? 'low' : 'mid';
      return `<article class="avs-card">
        <header><span class="avs-gl">${g}</span><div><h4>${name}</h4><small>${esc(p.sign)}</small></div></header>
        <div class="avs-row"><span class="avs-k">Age</span><span class="avs-chip ${chipC[p.baladi.state]}">${p.baladi.state}</span><span class="avs-t">${esc(p.baladi.line)}<em>${esc(p.baladi.why)}</em></span></div>
        <div class="avs-row"><span class="avs-k">Alertness</span><span class="avs-chip ${chipC[p.jagradadi.state]}">${p.jagradadi.state}</span><span class="avs-t">${esc(p.jagradadi.line)}<em>${esc(p.jagradadi.why)}</em></span></div>
        <div class="avs-row"><span class="avs-k">Mood</span><span class="avs-chip ${dc}">${p.deeptadi.state}</span><span class="avs-t">${esc(p.deeptadi.text)}<em>${esc(p.deeptadi.why)}</em>${p.deeptadi.also.map(a => `<em class="avs-also"><b>${a.state}</b> ${esc(a.why)}</em>`).join('')}</span></div>
      </article>`;
    }).join('');
    return `<div class="avs">
      <div class="avs-hero"><h3>Planet States</h3><p>Avasthas describe how freely each planet can give its results: its <b>age</b>, how <b>awake</b> it is and its <b>mood</b>. In your chart <b>${s.awake} of ${s.total}</b> planets are awake (own or exalted sign), <b>${s.yuva}</b> are in their prime age and <b>${s.weakAge}</b> are old or spent by degree.</p></div>
      <div class="avs-cards">${cards}</div>
      <details class="avs-note"><summary>How these are worked out</summary>
        <p><b>Age</b> comes from the degree in the sign, in five slices of 6 degrees. Odd signs (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius) run Bala, Kumara, Yuva, Vriddha, Mrita; even signs run the other way.</p>
        <p><b>Alertness</b> comes from the sign: own or exalted is awake (Jagrat), a friend's or neutral sign is dreaming (Swapna), an enemy's or debilitated sign is asleep (Sushupti).</p>
        <p><b>Mood</b> comes from the sign and the sign lord's friendship. Kopa (combust) and Vikala (sharing the sign with Sun, Mars, Saturn, Rahu or Ketu) are shown as extra notes.</p>
        <p>This follows Brihat Parashara Hora Shastra, chapter 45. Friendship here is the compound one (natural plus temporary), a choice this app makes where texts differ. Rahu and Ketu are not given states in these lists. Lajjitadi states are not shown because teachers word their conditions differently.</p>
        <p>A state is one clue. It tends to show how easily a planet delivers; read it with the sign, house, aspects and the running Dasha.</p>
      </details></div>`;
  }

  function text(chart) {
    const D = compute(chart);
    return GRAHA.map(n => { const p = D.planets[n]; return `${n}: ${p.baladi.state}, ${p.jagradadi.state}, ${p.deeptadi.state}${p.deeptadi.also.length ? ' (' + p.deeptadi.also.map(a => a.state).join(', ') + ')' : ''}`; }).join('\n');
  }

  window.buildAvasthasPanel = function (chart, profile) { return html(chart, profile || {}); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-avasthas', window.buildAvasthasPanel);
  return { compute, html, text, baladi, compound, natural, GRAHA };
})();

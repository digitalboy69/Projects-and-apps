/* ------------------------------ TRANSITS & SADE SATI ------------------------------ */
const TR_COL = { 11: '#E0A64A', 0: '#C95050', 1: '#8A6FB8', 3: '#6B7FA3', 7: '#5B8A9E' };
const TR_PHASE = { 11: 'Rising', 0: 'Peak', 1: 'Setting' };
function trStatus(s, e, now){ if (e !== null && e <= now) return 'past'; if (s !== null && s > now) return 'next'; return 'now'; }
function trPill(st){ return st === 'now' ? '<span class="dx-pill now">Now</span>' : (st === 'next' ? '<span class="dx-pill">Upcoming</span>' : '<span class="dx-pill past">Past</span>'); }
let TR_DATA = null;
function buildTransitsPanel(chart, profile){
  const T = computeTransits(chart, profile), tz = profile.tz, now = nowJulianDay(), birth = chart.julianDay;
  TR_DATA = { T, tz, now, birth };
  const age = jd => (jd - birth) / 365.25, dt = jd => jd === null ? 'before birth' : nvDate(jd, tz);
  const curSign = n => { const s = T.stays[n].find(x => trStatus(x.start, x.end, now) === 'now'); return s ? s.sign : getSignIndex(getSiderealLongitudeAt(n, now)); };
  const rel = s => (s - T.moonSign + 12) % 12, hM = s => rel(s) + 1, hL = s => (s - T.asc + 12) % 12 + 1;
  const satS = curSign('Saturn'), jupS = curSign('Jupiter');

  // active cycle status
  const act = T.sadeSati.find(c => trStatus(c.start, c.end, now) === 'now');
  const nextC = T.sadeSati.find(c => c.start !== null && c.start > now);
  let ssHero;
  if (act){
    const ph = rel(satS) === 11 ? 'Rising' : rel(satS) === 0 ? 'Peak' : rel(satS) === 1 ? 'Setting' : 'between phases';
    ssHero = `<div class="tr-card on" style="--pc:#C95050"><small>Sade Sati</small><b>Active · ${ph} phase</b><span>Saturn in ${SIGNS[satS].name} · ends ${dt(act.end)}</span></div>`;
  } else {
    ssHero = `<div class="tr-card" style="--pc:#5EC4B7"><small>Sade Sati</small><b>Not active</b><span>${nextC ? 'Next begins ' + dt(nextC.start) + ' (in ' + nvSpan(nextC.start - now) + ')' : 'No further cycle in the next 100 years'}</span></div>`;
  }
  const actK = T.kantaka.find(c => trStatus(c.start, c.end, now) === 'now'), actA = T.ashtama.find(c => trStatus(c.start, c.end, now) === 'now');
  const nK = T.kantaka.find(c => c.start !== null && c.start > now), nA = T.ashtama.find(c => c.start !== null && c.start > now);
  const dh = (title, a, n, col) => a ? `<div class="tr-card on" style="--pc:${col}"><small>${title}</small><b>Active</b><span>Ends ${dt(a.end)}</span></div>`
    : `<div class="tr-card" style="--pc:${col}"><small>${title}</small><b>Not active</b><span>${n ? 'Next ' + dt(n.start) : '—'}</span></div>`;
  const pos = (n, s) => `<div class="tr-card" style="--pc:${DASHA_PLANET_COLORS[n]}"><small>${n} now</small><b>${PLANET_GLYPHS[n]} ${SIGNS[s].symbol} ${SIGNS[s].name}</b><span>House ${hL(s)} from Lagna · ${hM(s)} from Moon</span></div>`;

  // cycles
  const cyc = T.sadeSati.map((c, i) => {
    const st = trStatus(c.start, c.end, now), s0 = c.start === null ? birth - 3 * 365.25 : c.start, e0 = c.end === null ? birth + 100 * 365.25 : c.end, tot = e0 - s0;
    const segs = c.phases.map(p => { const a = p.start === null ? s0 : p.start, b = p.end === null ? e0 : p.end; return `<div class="tr-seg" style="flex:${Math.max(0.01, b - a)};background:${TR_COL[p.rel]}"><span>${TR_PHASE[p.rel]}</span></div>`; }).join('');
    const nowMark = st === 'now' ? `<u style="left:${Math.max(0, Math.min(100, (now - s0) / tot * 100)).toFixed(1)}%"></u>` : '';
    const rows = c.phases.map(p => `<div class="tr-ph" style="--pc:${TR_COL[p.rel]}"><i></i><b>${TR_PHASE[p.rel]}</b><span>${SIGNS[p.sign].symbol} ${SIGNS[p.sign].name} · ${dt(p.start)} → ${p.end === null ? 'beyond 100 yrs' : dt(p.end)}</span></div>`).join('');
    const ages = `${c.start === null ? 'began before birth' : 'Age ' + Math.max(0, age(c.start)).toFixed(0)}${c.end === null ? '' : ' – ' + age(c.end).toFixed(0)}`;
    return `<div class="tr-cyc ${st}"><div class="tr-cyc-h"><b>Cycle ${i + 1}</b><span>${ages}</span>${trPill(st)}</div>
      <div class="tr-cbar">${segs}${nowMark}</div><div class="tr-phs">${rows}</div></div>`;
  }).join('') || '<div class="pl-empty">No Sade Sati cycle found in this period.</div>';

  const dhRows = (arr, label, col) => arr.map(c => { const st = trStatus(c.start, c.end, now); return `<div class="dx-row ${st}"><div class="dx-row-h" style="cursor:default"><span class="dx-dot" style="background:${col}">♄</span><span class="dx-row-main"><b>${label}</b><small>${dt(c.start)} → ${c.end === null ? '—' : dt(c.end)}</small></span><span class="dx-row-side"><span class="dx-age">Age ${c.start === null ? '0' : Math.max(0, age(c.start)).toFixed(0)}–${c.end === null ? '—' : age(c.end).toFixed(0)}</span>${trPill(st)}</span></div></div>`; }).join('');

  // ingress tables
  const tabs = ['Saturn', 'Jupiter', 'Rahu', 'Ketu'];
  const lists = tabs.map((n, ti) => {
    const arr = T.stays[n].filter(s => s.end === null || s.end > birth);
    const idxNow = arr.findIndex(s => trStatus(s.start, s.end, now) === 'now');
    const rows = arr.map((s, i) => {
      const st = trStatus(s.start, s.end, now), prev = arr[i - 1];
      const retro = (n === 'Saturn' || n === 'Jupiter') && prev && prev.sign === (s.sign + 1) % 12;
      const hidden = idxNow >= 0 && (i < idxNow - 2 || i > idxNow + 7) ? ' tr-more' : '';
      return `<div class="dx-row ${st}${hidden}"><div class="dx-row-h" style="cursor:default"><span class="dx-dot" style="background:${DASHA_PLANET_COLORS[n]}">${SIGNS[s.sign].symbol}</span>
        <span class="dx-row-main"><b>${SIGNS[s.sign].name}${retro ? ' <em class="tr-retro">↺ retrograde return</em>' : ''}</b><small>${dt(s.start)} → ${s.end === null ? '—' : dt(s.end)}</small></span>
        <span class="dx-row-side"><span class="dx-age">H${hL(s.sign)} Lagna · H${hM(s.sign)} Moon</span>${trPill(st)}</span></div></div>`;
    }).join('');
    const hiddenN = (rows.match(/tr-more/g) || []).length;
    return `<div class="tr-list" data-tr-body="${n}" ${ti ? 'hidden' : ''}>${rows}${hiddenN ? `<button type="button" class="tr-showall" data-tr-all>Show full timeline (${hiddenN} more)</button>` : ''}</div>`;
  }).join('');

  return `<div class="tr">
    <div class="tr-intro">Saturn and Jupiter transit signs relative to your <b>Moon</b> (${SIGNS[T.moonSign].name}) and <b>Lagna</b> (${SIGNS[T.asc].name}). Sade Sati is Saturn in the 12th, 1st and 2nd sign from the Moon.</div>
    <div class="tr-hero">${ssHero}${dh('Kantaka Shani (4th)', actK, nK, TR_COL[3])}${dh('Ashtama Shani (8th)', actA, nA, TR_COL[7])}${pos('Saturn', satS)}${pos('Jupiter', jupS)}</div>
    <div class="tr-sec"><h5>Sade Sati cycles <span>7½ years each</span></h5><div class="tr-cycles">${cyc}</div></div>
    <div class="tr-sec"><h5>Dhaiya <span>Saturn 4th &amp; 8th from Moon</span></h5><div class="dx-list">${dhRows(T.kantaka, 'Kantaka Shani · 4th from Moon', TR_COL[3])}${dhRows(T.ashtama, 'Ashtama Shani · 8th from Moon', TR_COL[7])}</div></div>
    <div class="tr-sec"><h5>Ingress timeline <span>when each planet changes sign</span></h5>
      <div class="pl-chips tr-tabs">${tabs.map((n, i) => `<button type="button" class="pl-chip ${i ? '' : 'on'}" data-tr-tab="${n}">${PLANET_GLYPHS[n]} ${n}</button>`).join('')}</div>${lists}</div>
    <div class="pn-note">Ingress dates come from the app's compact built-in ephemeris and can differ from published almanacs by a few days for Saturn and Jupiter (Rahu/Ketu use the mean node). Sade Sati dates merge brief retrograde re-entries into one phase. Window: 3 years before birth to 100 years after.</div>
  </div>`;
}
document.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-tr-tab]');
  if (tab){ document.querySelectorAll('[data-tr-tab]').forEach(b => b.classList.toggle('on', b === tab)); document.querySelectorAll('[data-tr-body]').forEach(l => l.hidden = l.dataset.trBody !== tab.dataset.trTab); return; }
  const all = e.target.closest('[data-tr-all]');
  if (all){ all.parentElement.querySelectorAll('.tr-more').forEach(r => r.classList.remove('tr-more')); all.remove(); }
});


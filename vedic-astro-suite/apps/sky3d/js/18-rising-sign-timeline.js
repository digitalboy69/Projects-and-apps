
/* ---- Rising-sign timeline (long-press chip popup + "Rising" tab) ---- */
var riseTLc = null, risingKey = '', risingOpenedAt = 0;
function _ascSign(jd, L){ return getSignIndex(siderealAscendant(jd, L.lat, L.lon)); }
function _ascEdge(jd, L, dir){          // moment the rising sign (as at jd) changes, searching forward (+1) or backward (-1)
  const s = _ascSign(jd, L), step = dir / 1440;
  let a = jd, b = jd, n = 0;
  do { a = b; b += step; n++; } while (_ascSign(b, L) === s && n < 2000);
  if (n >= 2000) return null;
  for (let i = 0; i < 30; i++){ const m = (a + b) / 2; if (_ascSign(m, L) === s) a = m; else b = m; }
  return (a + b) / 2;
}
function riseTimeline(jd, L){           // [{i, start, end}] current sign first, then the next 11 signs
  const c = riseTLc;
  if (c && c.lat === L.lat && c.lon === L.lon && jd >= c.rows[0].start && jd < c.rows[0].end) return c.rows;
  const st = _ascEdge(jd, L, -1), en = _ascEdge(jd, L, 1);
  if (st == null || en == null) return null;
  const rows = [{ i:_ascSign(jd, L), start:st, end:en }];
  let prev = en;
  for (let k = 1; k < 12; k++){
    const probe = prev + 2 / 86400, e = _ascEdge(probe, L, 1);
    if (e == null) break;
    rows.push({ i:_ascSign(probe, L), start:prev, end:e });
    prev = e;
  }
  riseTLc = { lat:L.lat, lon:L.lon, rows };
  return rows;
}
function _rsT(jd){ const d = jdToDate(jd + 0.5/1440); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); }
function _rsD(jd){ const d = jdToDate(jd + 0.5/1440); return String(d.getDate()).padStart(2,'0') + ' ' + MONTHS[d.getMonth()]; }
function _rsDur(days){ const m = Math.max(0, Math.round(days * 1440)), h = Math.floor(m / 60); return (h ? h + 'h ' : '') + String(m % 60) + 'm'; }
/* Navamsha (9th part, 3°20' each): movable signs start from themselves, fixed from the 9th sign, dual from the 5th */
var risingSel = null, navBC = {};
function _navSign(signIdx, n){ const m = signIdx % 3; return (signIdx + (m === 0 ? 0 : m === 1 ? 8 : 4) + n) % 12; }
function _navIdx(lon){ return Math.min(8, Math.floor(degreeInSign(lon).raw / (10 / 3))); }
function _rsTs(jd){ const d = jdToDate(jd + 0.5/86400); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0'); }
function _navBounds(r, L){              // 10 times: start of the sign, 8 Navamsha changes, end of the sign
  const key = r.start + '|' + L.lat + '|' + L.lon; if (navBC[key]) return navBC[key];
  const base = r.i * 30, f = jd => { let x = (siderealAscendant(jd, L.lat, L.lon) - base) % 360; if (x < 0) x += 360; return x > 180 ? x - 360 : x; };
  const out = [r.start];
  for (let n = 1; n < 9; n++){ const T = n * 10 / 3; let a = r.start, b = r.end; for (let k = 0; k < 36; k++){ const m = (a + b) / 2; if (f(m) < T) a = m; else b = m; } out.push((a + b) / 2); }
  out.push(r.end); navBC = {}; navBC[key] = out; return out;
}
function navDetailHTML(snap, L, rows){
  const r = rows.find(x => x.i === risingSel); if (!r){ risingSel = null; return risingHTML(snap, L); }
  const g = SIGNS[r.i], b = _navBounds(r, L), nowDay = _rsD(snap.jd), isNow = snap.jd >= r.start && snap.jd < r.end;
  const dTag = jd => _rsD(jd) === nowDay ? '' : ' · ' + _rsD(jd);
  let h = `<button class="rs-btn rs-back" data-rs-back="1">← All signs</button>
    <div class="rs-hero"><div class="rs-eyebrow">${isNow ? 'Rising now' : 'Rises ' + _rsD(r.start)} · Navamsha view</div><div class="rs-sym">${g.symbol}</div><div class="rs-name">${g.name} Lagna</div>
    <div class="rs-place">${_rsT(r.start)} → ${_rsT(r.end)}${dTag(r.end)} · ${_rsDur(r.end - r.start)} · 9 parts of 3°20′</div></div><div class="rs-h">All 9 Navamshas of ${g.name}</div><div class="rs-list">`;
  const maxD = Math.max(...b.slice(1).map((t, n) => t - b[n]));
  for (let n = 0; n < 9; n++){
    const ns = SIGNS[_navSign(r.i, n)], d = b[n + 1] - b[n], cur = snap.jd >= b[n] && snap.jd < b[n + 1];
    h += `<div class="rs-row${cur ? ' now' : ''}"><div class="sy">${ns.symbol}</div>
      <div><div class="nm">${n + 1} · ${ns.name}${cur ? '<em>NOW</em>' : ''}</div><div class="tm">${_rsTs(b[n])} → ${_rsTs(b[n + 1])}${dTag(b[n + 1])}</div></div>
      <div class="du">${_rsDur(d)}</div><div class="db" style="width:${(d / maxD * 100).toFixed(0)}%"></div></div>`;
  }
  return h + `</div><div class="rs-note">${g.name} degrees 0°–30° are split into nine equal parts of 3°20′. Each part has its own Navamsha sign. Times are to the second, from the same place and clock as above.</div>`;
}
function risingHTML(snap, L){
  const rows = riseTimeline(snap.jd, L);
  if (rows && risingSel != null) return navDetailHTML(snap, L, rows);
  if (!rows) return '<div class="rs-note">Near the poles the rising sign hardly changes, so timings can\'t be shown for this place.</div>';
  const cur = rows[0], sg = SIGNS[cur.i], lon = siderealAscendant(snap.jd, L.lat, L.lon);
  const total = cur.end - cur.start, done = snap.jd - cur.start, left = cur.end - snap.jd;
  const pct = Math.max(0, Math.min(100, done / total * 100));
  const nowDay = _rsD(snap.jd), maxD = Math.max(...rows.map(r => r.end - r.start));
  const dTag = jd => _rsD(jd) === nowDay ? '' : ' · ' + _rsD(jd);
  let h = `<div class="rs-hero"><div class="rs-eyebrow">Rising now · ${hudEsc(formatHudDate(snap.jd))} ${formatHudTime(snap.jd)}</div>
    <div class="rs-sym">${sg.symbol}</div><div class="rs-name">${sg.name} Lagna</div>
    <div class="rs-nav">Navamsha now: <b>${SIGNS[_navSign(cur.i, _navIdx(lon))].symbol} ${SIGNS[_navSign(cur.i, _navIdx(lon))].name}</b> · part ${_navIdx(lon) + 1} of 9</div>
    <div class="rs-place">📍 ${L.approx ? 'time-zone estimate (set your place for exact times)' : hudEsc(L.label)} · ${degreeInSign(lon).deg}° of 30° risen</div></div>
    <div class="rs-times"><div class="rs-t"><small>Started</small><b>${_rsT(cur.start)}</b><i>${_rsD(cur.start)}</i></div><div class="rs-arrow">→</div>
    <div class="rs-t"><small>Ends</small><b>${_rsT(cur.end)}</b><i>${_rsD(cur.end)}</i></div></div>
    <div class="rs-bar"><span style="width:${pct.toFixed(1)}%"></span></div>
    <div class="rs-pct"><span><b>${Math.round(pct)}%</b> completed</span><span>${_rsDur(done)} done · ${_rsDur(left)} left</span></div>
    <div class="rs-h">All 12 signs · tap one to see its Navamshas</div><div class="rs-list">`;
  rows.forEach((r, k) => {
    const g = SIGNS[r.i], d = r.end - r.start;
    h += `<div class="rs-row rs-tap${k === 0 ? ' now' : ''}" data-rs-sign="${r.i}" role="button" tabindex="0"><div class="sy">${g.symbol}</div>
      <div><div class="nm">${g.name}${k === 0 ? '<em>NOW</em>' : ''}</div><div class="tm">${_rsT(r.start)} → ${_rsT(r.end)}${dTag(r.end)}</div></div>
      <div class="du">${_rsDur(d)}<span class="rs-go">›</span></div><div class="db" style="width:${(d / maxD * 100).toFixed(0)}%"></div></div>`;
  });
  h += `</div><div class="rs-note">Times use your device clock. Each sign rises for roughly 1½–2½ hours here; the length changes with your place and the season.</div>
    <button class="rs-btn" data-rs-place="1">📍 Change place</button>`;
  return h;
}
function renderRising(force){
  const popEl = document.getElementById('risingOverlay'), tabEl = document.getElementById('tab-rising');
  if (!popEl || !tabEl) return;
  const popOn = popEl.classList.contains('show'), tabOn = tabEl.classList.contains('active');
  if (!popOn && !tabOn) return;
  const snap = A.snap || snapshotPositions(currentJD), L = getLiveLoc();
  const key = Math.floor(snap.jd * 1440) + '|' + L.lat + '|' + L.lon;
  if (!force && key === risingKey) return;
  risingKey = key;
  const html = risingHTML(snap, L);
  if (popOn) document.getElementById('risingBody').innerHTML = html;
  if (tabOn) document.getElementById('risingTabBody').innerHTML = html;
}
function openRising(){ risingOpenedAt = Date.now(); document.getElementById('risingOverlay').classList.add('show'); renderRising(true); }
function closeRising(){ document.getElementById('risingOverlay').classList.remove('show'); risingSel = null; }
document.addEventListener('click', function(e){
  const t = e.target.closest && e.target.closest('[data-rs-sign],[data-rs-back]'); if (!t) return;
  risingSel = t.hasAttribute('data-rs-back') ? null : +t.getAttribute('data-rs-sign'); renderRising(true);
  const body = document.getElementById('risingBody'), tab = document.getElementById('risingTabBody'); if (body) body.scrollTop = 0; if (tab) tab.scrollTop = 0;
});
document.addEventListener('keydown', function(e){ if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-rs-sign]')){ e.preventDefault(); e.target.click(); } });

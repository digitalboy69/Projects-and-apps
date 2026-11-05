/* ============================================================================
   DEGREE HOUSES  (tab "Houses" + a 3D layer)
   Whole-sign houses put every planet of a sign in the same house. Degree houses start from the exact rising degree, so a planet near
   the edge of a sign can fall into the neighbouring house while staying in the same sign.
   Systems: Sripati / Bhava Chalit (each house is centred on its madhya and ends halfway to the next; needs the MC),
            Equal, Lagna in the middle (house n spans Asc + 30(n-1) -15 to +15),  Equal, Lagna as the start (house 1 begins at the Asc).
   Source: live sky at your place, or the natal chart when a profile is saved. Everything is sidereal (Lahiri unless the tab choice says otherwise).
   Global: DEG_H { cusps, place, mc } for tests.
   ============================================================================ */
(function(){
'use strict';
if (typeof siderealAscendant !== 'function') return;
const $ = id => document.getElementById(id);
const GL = { Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋' };
const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th'));
const SYS = [['sripati','Sripati (Bhava Chalit)','Each house is centred on its madhya and ends halfway to the next.'],
             ['eqmid','Equal · Lagna in the middle','House 1 runs from 15° before the rising degree to 15° after it.'],
             ['eqstart','Equal · Lagna as the start','House 1 begins exactly at the rising degree.']];
let sys = 'sripati', src = 'live';

/* ------------------------------ engine ------------------------------ */
function siderealMC(jd, lon){
  const T = (jd - J2000) / 36525;
  let gmst = normDeg(280.46061837 + 360.98564736629 * (jd - J2000) + 0.000387933 * T * T - (T * T * T) / 38710000);
  const ra = normDeg(gmst + lon) * DEG, eps = (23.4392911 - 0.0130042 * T) * DEG;
  return normDeg(Math.atan2(Math.sin(ra), Math.cos(ra) * Math.cos(eps)) * RAD - lahiriAyanamsa(jd));
}
/* start longitude of each house (index 0 = house 1), plus the madhya of each, for a moment and place */
function cusps(jd, lat, lon, system){
  const asc = siderealAscendant(jd, lat, lon), mc = siderealMC(jd, lon);
  if (system === 'eqmid'){ const b = []; for (let i = 0; i < 12; i++) b.push(normDeg(asc - 15 + 30 * i)); return { asc, mc, begin: b, madhya: b.map(x => normDeg(x + 15)) }; }
  if (system === 'eqstart'){ const b = []; for (let i = 0; i < 12; i++) b.push(normDeg(asc + 30 * i)); return { asc, mc, begin: b, madhya: b.map(x => normDeg(x + 15)) }; }
  const ic = normDeg(mc + 180), d = normDeg(asc - mc), d2 = normDeg(ic - asc), m = new Array(13);
  m[1] = asc; m[4] = ic; m[7] = normDeg(asc + 180); m[10] = mc;
  m[11] = normDeg(mc + d / 3); m[12] = normDeg(mc + 2 * d / 3); m[2] = normDeg(asc + d2 / 3); m[3] = normDeg(asc + 2 * d2 / 3);
  m[5] = normDeg(m[11] + 180); m[6] = normDeg(m[12] + 180); m[8] = normDeg(m[2] + 180); m[9] = normDeg(m[3] + 180);
  const begin = [];
  for (let i = 1; i <= 12; i++){ const p = i === 1 ? 12 : i - 1; begin.push(normDeg(m[p] + normDeg(m[i] - m[p]) / 2)); }
  return { asc, mc, begin, madhya: m.slice(1) };
}
function houseOf(lonP, begin){
  for (let i = 0; i < 12; i++){ const j = (i + 1) % 12; if (normDeg(lonP - begin[i]) < normDeg(begin[j] - begin[i])) return i + 1; }
  return 1;
}
/* sid: { planet: sidereal lon }  ->  per planet { lon, bySign, byDeg, shifted, past (deg past the house's start) } */
function place(sid, c){
  const lagSign = getSignIndex(c.asc), out = {};
  PLANET_LIST.forEach(n => {
    const L = normDeg(sid[n]), bySign = ((getSignIndex(L) - lagSign + 12) % 12) + 1, byDeg = houseOf(L, c.begin);
    out[n] = { lon: L, bySign, byDeg, shifted: bySign !== byDeg, past: normDeg(L - c.begin[byDeg - 1]), sign: getSignIndex(L) };
  });
  return out;
}
function current(){
  const live = (src !== 'natal') || !isValidProfile(activeNatalProfile);
  if (live){ const loc = getLiveLoc(), jd = (A && A.snap) ? A.snap.jd : currentJD, s = (A && A.snap) ? A.snap.sidereal : snapshotPositions(jd).sidereal, c = cusps(jd, loc.lat, loc.lon, sys); return { live: true, jd, c, p: place(s, c), name: 'Sky now · ' + (loc.label || 'your place') }; }
  const n = computeNatalAscendant(activeNatalProfile), s = snapshotPositions(n.jd).sidereal, c = cusps(n.jd, activeNatalProfile.lat, activeNatalProfile.lon, sys);
  return { live: false, jd: n.jd, c, p: place(s, c), name: (activeNatalProfile.name || 'Natal chart') };
}
window.DEG_H = { cusps, place, houseOf, siderealMC };

/* ------------------------------ tab UI ------------------------------ */
const fmtDeg = L => { const x = degreeInSign(L); return `${SIGNS[getSignIndex(L)].symbol} ${x.deg}°${String(x.min).padStart(2, '0')}'`; };
function wheelSVG(d){
  const R = 150, cx = 170, cy = 170, rot = 180 - d.c.asc;           // ascendant sits on the left
  const P = (lon, r) => { const a = normDeg(lon + rot) * DEG; return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };   // zodiac runs anticlockwise, ascendant on the left
  const arc = (l0, l1, r0, r1) => { const a = P(l0, r1), b = P(l1, r1), c = P(l1, r0), e = P(l0, r0); return `M${a} A${r1} ${r1} 0 0 0 ${b} L${c} A${r0} ${r0} 0 0 1 ${e} Z`; };
  let s = `<svg viewBox="0 0 340 340" class="dh-svg" role="img" aria-label="Degree house wheel">`;
  for (let i = 0; i < 12; i++){ const l0 = i * 30; s += `<path d="${arc(l0, l0 + 30, 132, 150)}" class="dh-sign${i % 2 ? ' alt' : ''}"/>`; const m = P(l0 + 15, 141); s += `<text x="${m[0]}" y="${m[1]}" class="dh-sg" text-anchor="middle" dominant-baseline="central">${SIGNS[i].symbol}</text>`; const t0 = P(l0, 132), t1 = P(l0, 150); s += `<line x1="${t0[0]}" y1="${t0[1]}" x2="${t1[0]}" y2="${t1[1]}" class="dh-tick"/>`; }
  for (let i = 0; i < 12; i++){ const a = P(d.c.begin[i], 128), b = P(d.c.begin[i], 62); s += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="dh-cusp${i === 0 ? ' asc' : ''}"/>`; }
  s += `<circle cx="${cx}" cy="${cy}" r="128" class="dh-ring"/><circle cx="${cx}" cy="${cy}" r="62" class="dh-ring"/>`;
  for (let i = 0; i < 12; i++){ const mid = d.c.madhya[i], q = P(mid, 72); s += `<text x="${q[0]}" y="${q[1]}" class="dh-hn" text-anchor="middle" dominant-baseline="central">${i + 1}</text>`; }
  PLANET_LIST.forEach(n => { const pl = d.p[n], q = P(pl.lon, 108); s += `<g class="dh-pl${pl.shifted ? ' sh' : ''}"><circle cx="${q[0]}" cy="${q[1]}" r="${pl.shifted ? 12 : 10}"/><text x="${q[0]}" y="${q[1]}" text-anchor="middle" dominant-baseline="central">${GL[n]}</text></g>`; });
  const a = P(d.c.asc, 160); s += `<text x="${a[0]}" y="${a[1]}" class="dh-asc" text-anchor="middle" dominant-baseline="central">ASC</text></svg>`;
  return s;
}
function render(){
  const root = $('dhOut'); if (!root) return;
  let d; try { d = current(); } catch(e){ console.warn('degree houses', e); root.innerHTML = '<div class="empty-feed">Could not work this out yet. Set your place on the Sky tab and try again.</div>'; return; }
  const moved = PLANET_LIST.filter(n => d.p[n].shifted);
  const rows = PLANET_LIST.map(n => { const p = d.p[n];
    return `<div class="dh-row${p.shifted ? ' sh' : ''}"><span class="dh-p"><b>${GL[n]}</b> ${n}</span><span class="dh-pos">${fmtDeg(p.lon)}</span><span class="dh-h"><small>by sign</small>${ord(p.bySign)}</span><span class="dh-arrow">${p.shifted ? '→' : '='}</span><span class="dh-h now"><small>by degree</small>${ord(p.byDeg)}</span>${p.shifted ? `<span class="dh-note">moves ${p.byDeg > p.bySign || (p.bySign === 12 && p.byDeg === 1) ? 'forward' : 'back'} a house, ${p.past.toFixed(1)}° past the start of the ${ord(p.byDeg)}</span>` : ''}</div>`; }).join('');
  root.innerHTML = `<div class="dh-sum"><b>${moved.length ? moved.length + (moved.length === 1 ? ' planet moves' : ' planets move') + ' to a different house' : 'No planet changes house'}</b><small>${d.name} · Rising ${fmtDeg(d.c.asc)}</small>${moved.length ? `<div class="dh-chips">${moved.map(n => `<i>${GL[n]} ${n} ${d.p[n].bySign}→${d.p[n].byDeg}</i>`).join('')}</div>` : ''}</div>
    <div class="dh-wheel">${wheelSVG(d)}</div>
    <div class="dh-legend"><span class="l-sign"></span>zodiac signs <span class="l-cusp"></span>house starts (degree) <span class="l-sh"></span>planet in a different house</div>
    <div class="dh-list">${rows}</div>
    <div class="dh-cusps"><h4>House starts</h4>${d.c.begin.map((b, i) => `<span><small>${ord(i + 1)}</small>${fmtDeg(b)}</span>`).join('')}</div>`;
}
function buildTab(){
  const t = $('tab-degreehouses'); if (!t || t.dataset.b) return; t.dataset.b = '1';
  t.innerHTML = `<div class="tab-intro"><span class="ico">⌂</span><div><b>Degree houses.</b> Whole-sign houses give a planet the house of its sign. Starting from the exact rising degree can move a planet into the next house, even inside the same sign.</div></div>
    <div class="dh-ctl"><div class="dh-seg" id="dhSrc"><button type="button" data-s="live" class="active">Sky now</button><button type="button" data-s="natal">My natal chart</button></div>
    <select id="dhSys">${SYS.map(x => `<option value="${x[0]}">${x[1]}</option>`).join('')}</select><div class="dh-sysnote" id="dhSysNote">${SYS[0][2]}</div></div>
    <div id="dhOut"></div>`;
  $('dhSys').addEventListener('change', e => { sys = e.target.value; $('dhSysNote').textContent = SYS.find(x => x[0] === sys)[2]; render(); update3D(true); });
  $('dhSrc').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.s === 'natal' && !isValidProfile(activeNatalProfile)){ $('dhOut').innerHTML = '<div class="empty-feed">Save a natal profile on the Natal tab first.</div>'; return; }
    src = b.dataset.s; $('dhSrc').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b)); render(); });
  render();
}

/* ------------------------------ 3D layer ------------------------------ */
let L3 = null, last3 = 0;
function init3D(){
  if (L3 || typeof THREE === 'undefined' || typeof zodiacRingGroup === 'undefined') return;
  const box = $('planetLabels'); if (!box) return;
  const G = new THREE.Group(); zodiacRingGroup.add(G);
  const lines = [], lbls = [];
  for (let i = 0; i < 12; i++){
    const g = new THREE.PlaneGeometry(2.2, 0.05); g.rotateX(-Math.PI / 2); g.translate(11.6, 0.03, 0);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: i === 0 ? 0xF4C45C : 0x5AD6C4, transparent: true, opacity: i === 0 ? 0.95 : 0.65, side: THREE.DoubleSide, depthWrite: false })); G.add(m); lines.push(m);
    const obj = new THREE.Object3D(); G.add(obj); const key = 'dh_h' + i; bodyMeshes[key] = obj;
    const el = document.createElement('div'); el.className = 'planet-label house dh3'; el.textContent = String(i + 1); el.style.display = 'none'; el.style.opacity = '0'; box.appendChild(el); labelNodes[key] = { el, label: key }; lbls.push({ obj, el });
  }
  L3 = { G, lines, lbls };
}
function update3D(force){
  const on = $('L_dhouses') && $('L_dhouses').checked;
  if (!on){ if (L3){ L3.G.visible = false; L3.lbls.forEach(l => l.el.style.opacity = '0'); } clearTags(); return; }
  init3D(); if (!L3) return;
  const now = performance.now(); if (!force && now - last3 < 120) return; last3 = now;
  try {
    const loc = getLiveLoc(), jd = A.snap ? A.snap.jd : currentJD, s = A.snap ? A.snap.sidereal : snapshotPositions(jd).sidereal, c = cusps(jd, loc.lat, loc.lon, sys), pl = place(s, c);
    L3.G.visible = true;
    for (let i = 0; i < 12; i++){ L3.lines[i].rotation.y = c.begin[i] * DEG; const mid = c.madhya[i]; L3.lbls[i].obj.position.set(12.3 * Math.cos(mid * DEG), 0, -12.3 * Math.sin(mid * DEG)); L3.lbls[i].el.style.opacity = ''; }
    PLANET_LIST.forEach(n => { const ln = labelNodes['geo_' + n]; if (!ln) return; let sp = ln.el.querySelector('.dhx'); if (!sp){ sp = document.createElement('span'); sp.className = 'dhx'; ln.el.appendChild(sp); }
      const t = pl[n].shifted ? ` H${pl[n].bySign}→${pl[n].byDeg}` : ''; if (sp._k !== t){ sp._k = t; sp.textContent = t; } });
  } catch(e){ console.warn('degree houses 3D', e); }
}
function clearTags(){ PLANET_LIST.forEach(n => { const ln = labelNodes['geo_' + n]; const sp = ln && ln.el.querySelector('.dhx'); if (sp && sp._k){ sp._k = ''; sp.textContent = ''; } }); }

/* hook: refresh with the scene */
if (typeof updateOverlays === 'function'){ const _o = updateOverlays; window.updateOverlays = function(snap){ _o(snap); try { update3D(false); } catch(e){} }; updateOverlays = window.updateOverlays; }
const tb = document.querySelector('[data-tab="degreehouses"]');
if (tb) tb.addEventListener('click', () => { buildTab(); render(); });
const lt = $('L_dhouses'); if (lt) lt.addEventListener('change', () => { update3D(true); if (typeof markDirty === 'function') markDirty(); });
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#natalCardWrap')) setTimeout(render, 50); });
buildTab();
})();

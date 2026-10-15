/* --------------------------------- BHAVA CHALIT --------------------------------- */
function buildBhavaPanel(chart, profile){
  const B = computeBhavaChalit(chart, profile.lat, profile.lon);
  const moved = PLANET_LIST.filter(n => B.place[n].shifted);
  const cards = B.houses.map(h => {
    const ws = (chart.ascendant.sign + h.n - 1) % 12;
    const chips = h.planets.map(n => { const p = B.place[n]; const c = DASHA_PLANET_COLORS[n];
      return `<span class="bh-p ${p.shifted ? 'moved' : ''}" style="--pc:${c}" data-planet-click="${n}">${PLANET_GLYPHS[n]} ${n}${p.shifted ? `<em>from H${p.whole}</em>` : ''}</span>`; }).join('') || '<span class="bh-empty">empty</span>';
    return `<div class="bh-card ${h.planets.length ? 'has' : ''}">
      <div class="bh-top"><span class="bh-n">${h.n}</span><span class="bh-sign">${SIGNS[ws].symbol} ${SIGNS[ws].name}<small>whole-sign house</small></span></div>
      <div class="bh-mid"><small>Madhya (centre)</small><b>${nvDeg(h.madhya)}</b></div>
      <div class="bh-span"><small>Spans</small><span>${nvDeg(h.begin)}</span><span>→ ${nvDeg(h.end)}</span></div>
      <div class="bh-pl">${chips}</div></div>`;
  }).join('');
  const shiftRows = moved.map(n => { const p = B.place[n], c = DASHA_PLANET_COLORS[n];
    return `<div class="dx-row"><div class="dx-row-h" style="cursor:default"><span class="dx-dot" style="background:${c}">${PLANET_GLYPHS[n]}</span><span class="dx-row-main"><b>${n}: House ${p.whole} → House ${p.chalit}</b><small>${nvDeg(p.lon)} · ${Math.abs(p.fromMadhya).toFixed(1)}° ${p.fromMadhya < 0 ? 'before' : 'past'} the house centre</small></span></div></div>`; }).join('');
  return `<div class="bh">
    <div class="tr-intro">Whole-sign houses give each planet the house of its sign. <b>Bhava Chalit</b> (Sripati) instead centres each house on its madhya and ends it halfway to the next, so a planet near a sign edge can shift to the neighbouring house.</div>
    <div class="tr-hero">
      <div class="tr-card" style="--pc:#D4AF37"><small>Lagna · Bhava 1 centre</small><b>${nvDeg(B.asc)}</b></div>
      <div class="tr-card" style="--pc:#5EC4B7"><small>Midheaven · Bhava 10 centre</small><b>${nvDeg(B.mc)}</b></div>
      <div class="tr-card ${moved.length ? 'on' : ''}" style="--pc:#E0A64A"><small>Planets changing house</small><b>${moved.length} of ${PLANET_LIST.length}</b><span>${moved.length ? moved.join(', ') : 'Chalit matches whole-sign'}</span></div>
    </div>
    ${moved.length ? `<div class="tr-sec"><h5>Shifted planets <span>whole-sign → Bhava Chalit</span></h5><div class="dx-list">${shiftRows}</div></div>` : ''}
    <div class="tr-sec"><h5>The 12 bhavas <span>tap a planet for details</span></h5><div class="bh-grid">${cards}</div></div>
    <div class="pn-note">Sripati method: the Lagna and Midheaven are the centres of houses 1 and 10; the arcs between them are divided into equal thirds to place the other centres; each house ends at the midpoint between neighbouring centres. Positions are sidereal (Lahiri).</div>
  </div>`;
}


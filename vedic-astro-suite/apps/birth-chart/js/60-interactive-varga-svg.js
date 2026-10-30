
function buildInteractiveVargaSvg(vdata, meta, style, aspectData){
  if (style === "north") {
    return buildNorthIndianSvg(vdata, aspectData);
  } else if (style === "west") {
    return buildWesternWheelSvg(vdata, aspectData);
  } else {
    return buildSouthIndianSvg(vdata, aspectData);
  }
}

/* ============================================================================
   PLANETARY ASPECTS (DRISHTI) FOR ANY DIVISIONAL CHART
   ============================================================================
   For a given varga chart, works out — for every planet — which house/sign it
   sits in, which planets/houses/signs it aspects (drishti), and contextual
   info (nakshatra, pada, degree) sourced from the real (D1) sidereal
   longitude, since nakshatra is always reckoned from the true longitude
   regardless of which divisional chart is being viewed.
*/
function computeVargaAspects(chart, vdata){
  const ascSign = vdata.ascendantSign;
  const houseOfSign = {}; // signIdx -> house number in this varga
  for (let h=1; h<=12; h++){
    houseOfSign[(ascSign + h - 1) % 12] = h;
  }

  // Build planet -> {sign, house} for this varga
  const placement = {};
  PLANET_LIST.forEach(name => {
    const sign = vdata.planetVargaSign[name];
    placement[name] = { sign, house: houseOfSign[sign] };
  });

  const results = [];
  PLANET_LIST.forEach(fromName => {
    const from = placement[fromName];
    const aspectedHouseNums = getAspectedHouses(fromName, from.house); // houses (1-12) this planet aspects
    const aspectedSignIdxs = aspectedHouseNums.map(h => (ascSign + h - 1) % 12);

    const aspectOffsetLabel = (houseNum) => {
      const diff = ((houseNum - from.house + 12) % 12) + 1; // 1..12, e.g. 7 = opposition
      if (diff === 7) return "7th aspect (opposition)";
      if (SPECIAL_ASPECTS[fromName] && SPECIAL_ASPECTS[fromName].includes(diff)) return `${diff}th aspect (special)`;
      return `${diff}th aspect`;
    };

    const targets = [];
    aspectedHouseNums.forEach(houseNum => {
      const signIdx = (ascSign + houseNum - 1) % 12;
      const sign = SIGNS[signIdx];
      const occupants = PLANET_LIST.filter(p => p !== fromName && placement[p].sign === signIdx);
      occupants.forEach(toName => {
        targets.push({
          toPlanet: toName,
          toHouse: houseNum,
          toSign: sign.name,
          toSignSanskrit: sign.sk,
          label: aspectOffsetLabel(houseNum)
        });
      });
      if (occupants.length === 0) {
        targets.push({
          toPlanet: null,
          toHouse: houseNum,
          toSign: sign.name,
          toSignSanskrit: sign.sk,
          label: aspectOffsetLabel(houseNum)
        });
      }
    });

    const realPlanet = chart.planets[fromName];
    const fromSign = SIGNS[from.sign];

    results.push({
      planet: fromName,
      glyph: PLANET_GLYPHS[fromName],
      fromHouse: from.house,
      fromSign: fromSign.name,
      fromSignSanskrit: fromSign.sk,
      nakshatra: realPlanet.nakshatra.name,
      nakshatraLord: realPlanet.nakshatra.lord,
      pada: realPlanet.nakshatra.pada,
      degree: formatDeg(realPlanet.degInSign),
      retrograde: realPlanet.retrograde,
      aspectedHouses: aspectedHouseNums,
      aspectedSigns: aspectedSignIdxs.map(i => SIGNS[i].name),
      targets
    });
  });

  return results;
}

function buildAspectsTableHtml(aspectRows, idPrefix){
  const prefix = idPrefix || 'varga';
  let rows = '';
  aspectRows.forEach(r => {
    const planetTargets = r.targets.filter(t => t.toPlanet);
    const targetHtml = planetTargets.length
      ? planetTargets.map(t => `<span class="occupant-chip aspect-target-chip"><span class="planet-glyph">${PLANET_GLYPHS[t.toPlanet]}</span>${t.toPlanet} <span class="tiny">(H${t.toHouse} ${t.toSign})</span></span>`).join(' ')
      : `<span class="house-empty-tag">No planets aspected</span>`;
    const housesHtml = r.aspectedHouses.map(h => `H${h}`).join(', ');

    rows += `<tr>
      <td class="planet-name-cell"><span class="planet-glyph">${r.glyph}</span>${r.planet}${r.retrograde ? '<sup class="retro-tag-sm">R</sup>' : ''}</td>
      <td>H${r.fromHouse} — ${r.fromSign} <span class="sign-sk">(${r.fromSignSanskrit})</span></td>
      <td>${r.nakshatra} <span class="sign-sk">(Pada ${r.pada})</span><br><span class="tiny">Lord: ${r.nakshatraLord} · ${r.degree}</span></td>
      <td class="mono">${housesHtml}</td>
      <td>${targetHtml}</td>
    </tr>`;
  });

  return `<div class="varga-aspect-table-wrap" id="${prefix}AspectTableWrap">
    <div class="aspect-table-head">
      <span class="section-sub" style="margin:0;">Full Aspects (Drishti) Table</span>
      <button type="button" class="chart-dl-btn-single aspect-copy-btn" id="${prefix}CopyAspectTableBtn"><span>📋</span> Copy Table</button>
    </div>
    <div class="aspect-table-scroll">
      <table class="varga-house-table aspect-table">
        <thead><tr><th>Planet</th><th>Position</th><th>Nakshatra</th><th>Aspects Houses</th><th>Aspects Planets</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

function aspectRowsToPlainText(aspectRows, vargaKey){
  let out = `PLANETARY ASPECTS (DRISHTI) — ${vargaKey}\n`;
  out += '='.repeat(60) + '\n\n';
  aspectRows.forEach(r => {
    out += `${r.planet}${r.retrograde ? ' (R)' : ''} — House ${r.fromHouse}, ${r.fromSign} (${r.fromSignSanskrit})\n`;
    out += `  Nakshatra: ${r.nakshatra}, Pada ${r.pada}, Lord ${r.nakshatraLord}, ${r.degree}\n`;
    out += `  Aspects Houses: ${r.aspectedHouses.map(h=>'H'+h).join(', ')}\n`;
    const planetTargets = r.targets.filter(t => t.toPlanet);
    if (planetTargets.length){
      out += `  Aspects Planets:\n`;
      planetTargets.forEach(t => {
        out += `    -> ${t.toPlanet} in House ${t.toHouse} (${t.toSign}) — ${t.label}\n`;
      });
    } else {
      out += `  Aspects Planets: none\n`;
    }
    out += '\n';
  });
  return out;
}

// 1. NORTH INDIAN DIAMOND CHART (Kendra-centric diamond layout)
const PCOL={Gulika:'#A8789E',Uranus:'#7DE3E0',Neptune:'#5B7CFA',Pluto:'#C9A38A',Sun:'#F4A340',Moon:'#E6EBF5',Mars:'#E2625F',Mercury:'#6FCF97',Jupiter:'#F9D976',Venus:'#F4A9D3',Saturn:'#8EA2D6',Rahu:'#B393E0',Ketu:'#C4A484'};
const ELC={Fire:'#F26B4F',Earth:'#79B868',Air:'#E7C95A',Water:'#5BA7E0'};
const HTc=h=>[1,4,7,10].includes(h)?'#D4AF37':[5,9].includes(h)?'#5EC4B7':[6,8,12].includes(h)?'#E25555':'#8C93A8';
const HAl=h=>h===1?.26:[4,7,10].includes(h)?.13:[5,9].includes(h)?.11:[6,8,12].includes(h)?.10:.04;
const dRing=s=>/Exalt/i.test(s)?'#F9D976':/Own|Moola/i.test(s)?'#5EC4B7':/Debil/i.test(s)?'#E25555':/Enemy/i.test(s)?'#C26B45':/Friend/i.test(s)?'#7FC8A9':'#6B7390';
document.addEventListener('change',e=>{
  if(e.target.classList&&e.target.classList.contains('gulika-chk-input')){window.__showGulika=e.target.checked;document.querySelectorAll('.gulika-chk-input').forEach(c=>c.checked=window.__showGulika);document.querySelectorAll('.varga-style-toggle .varga-style-btn.active').forEach(b=>b.click());return;}
  if(!e.target.classList||!e.target.classList.contains('outer-chk-input'))return;
  window.__showOuter=e.target.checked;
  document.querySelectorAll('.outer-chk-input').forEach(c=>c.checked=window.__showOuter);
  document.querySelectorAll('.varga-style-toggle .varga-style-btn.active').forEach(b=>b.click());
});

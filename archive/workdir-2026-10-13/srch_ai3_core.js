function srchDig(p){ const st = p.dignity && p.dignity.status; return st==='Exalted'?' Exalted':st==='Debilitated'?' Debilitated':st==='OwnSign'?' OwnSign':st==='Moolatrikona'?' Moolatrikona':''; }
function srchPlanetLine(ch, n){
  const p = ch.planets[n]; if (!p) return '';
  return `${n} in ${SIGNS[p.sign].name} ${Math.floor(p.degInSign)}° H${p.house}${srchDig(p)}${p.retrograde?' Retro':''}${p.combustion?' Combust':''}`;
}
function srchAspects(ch){
  const pr = ch.planets, out = [];
  PLANET_LIST.forEach(a=>{
    const p = pr[a]; if (!p) return; const t = [];
    (p.aspectsHouses||[]).forEach(h=>{
      PLANET_LIST.forEach(b=>{ if (b!==a && pr[b] && pr[b].house===h) t.push(b); });
      if (h===1) t.push('Lagna');
    });
    if (t.length) out.push(`${a}(H${p.house}) aspects ${t.join(', ')}`);
  });
  return out;
}
function srchConj(ch){
  const pr = ch.planets, L = ch.ascendant.sign, out = [];
  for (let h=1; h<=12; h++){
    const occ = PLANET_LIST.filter(n=> pr[n] && pr[n].house===h);
    if (occ.length>=2) out.push(`H${h} ${SIGNS[(L+h-1)%12].name}: ${occ.join('+')}`);
  }
  return out;
}
function srchBrief(tp, sub, cap){
  const ch = currentChartForModal; if (!ch) return '';
  const L = ch.ascendant.sign, pr = ch.planets, S = [];  // S = [priority, text]
  const lordP = pr[SIGNS[L].lord];
  S.push([0,'LAGNA: '+SIGNS[L].name+' '+Math.floor(ch.ascendant.degInSign)+'°'+(ch.ascendant.nakshatra?', '+ch.ascendant.nakshatra.name:'')+'; lord '+SIGNS[L].lord+(lordP?' in '+SIGNS[lordP.sign].name+' H'+lordP.house:'')]);
  S.push([0,'PLANETS (exact): '+PLANET_LIST.map(n=>{ const p = pr[n]; return `${n} ${SIGNS[p.sign].name} ${Math.floor(p.degInSign)}° H${p.house}${p.nakshatra?' '+p.nakshatra.name:''}${srchDig(p)}${p.retrograde?' Retro':''}${p.combustion?' Combust':''}`; }).join('; ')]);
  const cj = srchConj(ch); if (cj.length) S.push([0,'CONJUNCTIONS: '+cj.join('; ')]);
  const as = srchAspects(ch); if (as.length) S.push([0,'ASPECTS (drishti): '+as.join('; ')]);
  S.push([1,'KEY HOUSES: '+tp.h.concat(tp.s.slice(0,2)).map(h=>srchHouseLine(ch,L,h)).join(' | ')]);
  try {
    const act = findActiveDasha(ch.dashaData.mahadashas, new Date());
    if (act && act.mahadasha){
      const ds = [['MD',act.mahadasha],['AD',act.antardasha],['PD',act.pratyantardasha]].filter(x=>x[1]).map(([nm,x])=>{
        const lk = rsLinks(x.lord, L, ch), hit = Object.keys(lk).filter(h=> tp.h.indexOf(+h)>-1 || tp.s.indexOf(+h)>-1).map(h=>lk[h]);
        return `${nm} ${x.lord}${hit.length?' ('+hit.join(', ')+')':''}`; });
      S.push([1,`DASHA NOW: ${ds.join(' / ')}${act.antardasha?` (AD until ${act.antardasha.endDate.toISOString().slice(0,10)})`:''}`]);
    }
  } catch(e){}
  if (tp.id==='karma' || tp.id==='spouse' || tp.id==='marriagetime' || tp.id==='me') { try { S.push([1,'DOSHA FACTS: ' + srchDoshas(ch)]); } catch(e){} }
  if (tp.ck && ch.charaKarakas && ch.charaKarakas[tp.ck]){ const n = ch.charaKarakas[tp.ck].planet; S.push([2,`${tp.ck}: ${srchPlanetLine(ch,n)}${srchVargaPos(ch,'D9',n)?'; D9 '+srchVargaPos(ch,'D9',n):''}`]); }
  if (tp.k.length) S.push([2,'TOPIC KARAKAS: '+tp.k.map(n=>srchPlanetLine(ch,n)).filter(Boolean).join('; ')]);
  if (tp.v && tp.v!=='D1' && ch.vargas[tp.v]){
    const vv = ch.vargas[tp.v], lord = SIGNS[vv.ascendantSign].lord, kp = tp.k.map(n=>srchVargaPos(ch,tp.v,n)).filter(Boolean);
    S.push([3,`${tp.v}: lagna ${SIGNS[vv.ascendantSign].name}, lord ${lord}${srchVargaPos(ch,tp.v,lord)?' ('+srchVargaPos(ch,tp.v,lord).replace(lord+' ','')+')':''}${kp.length?'; '+kp.join(', '):''}`]);
  }
  try {
    const ar = calcAllArudhaPadas(ch, L), a = (tp.ar||[]).filter(k=>ar[k]!==undefined).map(k=>`${k} ${SIGNS[ar[k]].name} H${((ar[k]-L+12)%12)+1}`);
    if (a.length) S.push([3,'ARUDHA: ' + a.join(', ')]);
  } catch(e){}
  try {
    const jd = nowJulianDay(), mo = pr.Moon.sign, T = ['Saturn','Jupiter','Rahu'].map(n=>{ const sg = Math.floor(getSiderealLongitudeAt(n, jd)/30); return `${n} ${SIGNS[sg].name} H${rsHouseOf(sg,L)}(from Moon H${rsHouseOf(sg,mo)})`; });
    S.push([4,`TRANSITS ${new Date().toISOString().slice(0,10)}: ${T.join('; ')}`]);
  } catch(e){}
  const q = sub ? sub[1] : ('Give a precise overview of ' + tp.t.toLowerCase() + ' for me.');
  const head = `Act as an expert Vedic astrologer.\nTOPIC: ${tp.t}${sub?' › '+sub[0]:''}\nQUESTION: ${q}\n${SRCH_STYLE}\nCHART DATA (authoritative):\n`;
  let keep = S.slice();
  const len = ()=> head.length + keep.map(x=>x[1]).join('\n').length;
  while (cap && len() > cap){ const mx = Math.max.apply(null, keep.map(x=>x[0])); if (mx===0) break; const idx = keep.map(x=>x[0]).lastIndexOf(mx); keep.splice(idx,1); }
  return head + keep.map(x=>x[1]).join('\n');
}
function srchAsk(tp, sub, copyOnly){
  const full = srchBrief(tp, sub, 0); if (!full){ rsToast('Generate a chart first'); return; }
  try { if (navigator.clipboard) navigator.clipboard.writeText(full).catch(function(){}); } catch(e){}
  if (copyOnly){ rsToast('Full AI brief copied ✓ — paste it into any AI'); return; }
  const text = srchBrief(tp, sub, 2700);
  window.open('https://www.google.com/search?q=' + encodeURIComponent(text) + '&udm=50', '_blank', 'noopener');
  rsToast('Opening Google AI · full brief also copied 📋');
}

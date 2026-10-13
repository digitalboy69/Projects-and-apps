/* ---------- Ask-AI topics: builds a rich chart brief for one life area, then opens Google AI mode ---------- */
const SRCH_TOPICS = [
 {id:'career',ico:'💼',t:'Career & profession',kw:'job work profession promotion success',h:[10],s:[6,2,11],k:['Sun','Saturn','Mercury','Jupiter'],ck:'Amatyakaraka',v:'D10',ar:['A10','AL'],q:'What does my chart say about my career path, suitable fields, strengths, obstacles, and when growth or change is likely?'},
 {id:'job',ico:'🧑‍💻',t:'Job vs business',kw:'employment self employed entrepreneur startup',h:[10,7],s:[6,3,11],k:['Mercury','Saturn','Mars'],ck:'Amatyakaraka',v:'D10',ar:['A10'],q:'Am I better suited to a job or my own business? What kind, and when are favourable windows to switch or start?'},
 {id:'money',ico:'💰',t:'Wealth & finances',kw:'money income savings rich dhana',h:[2,11],s:[5,9,8],k:['Jupiter','Venus'],ck:'',v:'D2',ar:['A2','A11'],q:'What does my chart say about earning, saving and accumulating wealth, and which periods favour money gains or losses?'},
 {id:'fame',ico:'🌟',t:'Fame, status & recognition',kw:'reputation name public image authority',h:[10,1],s:[11,5],k:['Sun','Moon'],ck:'Atmakaraka',v:'D10',ar:['AL','A10'],q:'What does my chart say about reputation, public image and recognition, and when is visibility likely to rise?'},
 {id:'spouse',ico:'💍',t:'Spouse & marriage',kw:'wife husband partner relationship spouse details',h:[7],s:[2,11,12],k:['Venus','Jupiter'],ck:'Darakaraka',v:'D9',ar:['UL','A7'],q:'Describe my likely spouse (nature, background, appearance tendencies), the quality of marriage, and any challenges or remedies.'},
 {id:'marriagetime',ico:'📅',t:'Marriage timing',kw:'when will i marry wedding delay',h:[7,2,11],s:[5,12],k:['Venus','Jupiter'],ck:'Darakaraka',v:'D9',ar:['UL'],q:'When is marriage most likely according to my dashas and transits? Mention any delays and favourable windows.'},
 {id:'love',ico:'❤️',t:'Love & romance',kw:'dating affair crush relationship attraction',h:[5,7],s:[11,2],k:['Venus','Moon'],ck:'Darakaraka',v:'D9',ar:['UL'],q:'What does my chart say about romance and love relationships, their pattern, and the best periods for them?'},
 {id:'children',ico:'👶',t:'Children & progeny',kw:'kids baby child birth pregnancy fertility',h:[5],s:[2,9,11],k:['Jupiter'],ck:'Putrakaraka',v:'D7',ar:['A5'],q:'What does my chart say about having children, number/timing tendencies, and relationship with children?'},
 {id:'education',ico:'🎓',t:'Education & learning',kw:'study college exams degree knowledge',h:[4,5],s:[9,2],k:['Mercury','Jupiter'],ck:'Putrakaraka',v:'D24',ar:[],q:'What does my chart say about studies, learning style, suitable subjects, and exam/higher-education timing?'},
 {id:'health',ico:'🩺',t:'Health & vitality',kw:'disease illness body fitness immunity',h:[1,6],s:[8,12],k:['Sun','Moon','Mars'],ck:'Atmakaraka',v:'D30',ar:['A6'],q:'What are the health strengths and sensitive areas in my chart, and which periods need extra care?'},
 {id:'mind',ico:'🧠',t:'Mind & emotional peace',kw:'stress anxiety depression mood happiness',h:[4,1],s:[5,12],k:['Moon','Mercury'],ck:'Atmakaraka',v:'D1',ar:[],q:'What does my chart say about my mental and emotional nature, stress patterns, and ways to find peace?'},
 {id:'longevity',ico:'⏳',t:'Longevity & sudden events',kw:'life span accidents surgery transformation 8th house',h:[8,1],s:[3,6,12],k:['Saturn'],ck:'Atmakaraka',v:'D30',ar:['A8'],q:'What does my chart indicate about resilience, sudden changes and critical periods? Keep it balanced and non-fearful.'},
 {id:'father',ico:'👨',t:'Father & mentors',kw:'dad guru teacher blessings',h:[9],s:[10,3],k:['Sun','Jupiter'],ck:'',v:'D12',ar:['A9'],q:'What does my chart say about my father, mentors and paternal support, and any timing highlights?'},
 {id:'mother',ico:'👩',t:'Mother & home life',kw:'mom family happiness domestic',h:[4],s:[10,9],k:['Moon'],ck:'Matrikaraka',v:'D12',ar:['A4'],q:'What does my chart say about my mother, home life and domestic happiness?'},
 {id:'siblings',ico:'🧑‍🤝‍🧑',t:'Siblings & courage',kw:'brother sister effort initiative',h:[3],s:[11,1],k:['Mars'],ck:'Bhratrikaraka',v:'D3',ar:['A3'],q:'What does my chart say about siblings, courage and self-effort?'},
 {id:'property',ico:'🏠',t:'Property, home & vehicles',kw:'house land real estate car buy flat',h:[4],s:[2,11,12],k:['Mars','Venus','Saturn'],ck:'Matrikaraka',v:'D4',ar:['A4'],q:'What does my chart say about buying property, vehicles and a stable home, and favourable timing?'},
 {id:'foreign',ico:'✈️',t:'Foreign travel & settlement',kw:'abroad visa immigration relocate overseas',h:[12,9],s:[3,7,4],k:['Rahu','Moon'],ck:'',v:'D1',ar:[],q:'What does my chart say about living or working abroad, travel and relocation, and when it is most likely?'},
 {id:'enemies',ico:'⚔️',t:'Enemies, debts & disputes',kw:'litigation court competition loans conflict',h:[6],s:[8,12,3],k:['Mars','Saturn'],ck:'Gnatikaraka',v:'D1',ar:['A6'],q:'What does my chart say about opponents, debts, legal disputes and how to handle them?'},
 {id:'spiritual',ico:'🕉️',t:'Spirituality & moksha',kw:'meditation dharma karma purpose inner growth',h:[9,12],s:[5,8],k:['Ketu','Jupiter'],ck:'Atmakaraka',v:'D20',ar:[],q:'What does my chart say about spiritual inclination, suitable practices and soul purpose?'},
 {id:'purpose',ico:'🧭',t:'Personality & life purpose',kw:'nature character soul atmakaraka self',h:[1],s:[5,9],k:['Sun','Moon'],ck:'Atmakaraka',v:'D9',ar:['AL'],q:'Describe my personality, core strengths, weaknesses and likely life purpose.'},
 {id:'friends',ico:'🤝',t:'Friends, networks & gains',kw:'social circle allies fulfilment desires',h:[11],s:[3,7,5],k:['Jupiter','Mercury'],ck:'',v:'D1',ar:['A11'],q:'What does my chart say about friendships, networking and fulfilment of desires?'},
 {id:'losses',ico:'📉',t:'Expenses, losses & sleep',kw:'spending waste hospital isolation bed pleasures',h:[12],s:[2,6,8],k:['Saturn','Ketu'],ck:'',v:'D1',ar:[],q:'What does my chart say about expenses, losses, sleep and hidden drains — and how to manage them?'},
 {id:'talent',ico:'🎨',t:'Talent, creativity & arts',kw:'music art writing skill hobby entertainment',h:[5,3],s:[10,11],k:['Venus','Mercury','Moon'],ck:'Putrakaraka',v:'D9',ar:[],q:'What natural talents and creative strengths does my chart show, and how can I use them?'},
 {id:'inherit',ico:'🏦',t:'Inheritance & hidden wealth',kw:'will insurance partner money legacy 8th 2nd',h:[8,2],s:[11,7],k:['Saturn','Jupiter'],ck:'',v:'D1',ar:['A8'],q:'What does my chart say about inheritance, insurance and money from partners or hidden sources?'},
 {id:'thisyear',ico:'🗓️',t:'This year & next 12 months',kw:'forecast prediction timing dasha transit now upcoming',h:[1,10,7,2,11],s:[4,5,9],k:['Jupiter','Saturn'],ck:'',v:'D1',ar:[],q:'Give a practical forecast for the next 12 months across career, money, relationships and health, using my current dasha and transits.'}
];
function srchHouseLine(ch, L, h){
  const pr = ch.planets, si = (L+h-1)%12, s = SIGNS[si], lp = pr[s.lord];
  const occ = PLANET_LIST.filter(n=> pr[n] && pr[n].house===h);
  const asp = PLANET_LIST.filter(n=> pr[n] && pr[n].house!==h && (pr[n].aspectsHouses||[]).indexOf(h)>-1);
  return `H${h} ${s.name}: lord ${s.lord}${lp?` in H${lp.house} ${SIGNS[lp.sign].name}${lp.dignity&&lp.dignity.status&&lp.dignity.status!=='Neutral'?' ('+lp.dignity.status+')':''}${lp.retrograde?' R':''}`:''}; occupants ${occ.length?occ.join(','):'none'}; aspected by ${asp.length?asp.join(','):'none'}`;
}
function srchPlanetLine(ch, n){
  const p = ch.planets[n]; if (!p) return '';
  return `${n} in ${SIGNS[p.sign].name} H${p.house}${p.dignity&&p.dignity.status&&p.dignity.status!=='Neutral'?' ('+p.dignity.status+')':''}${p.retrograde?' R':''}${p.combustion?' combust':''}${p.nakshatra?', '+p.nakshatra.name+' p'+p.nakshatra.pada:''}`;
}
function srchVargaPos(ch, vk, name){
  try { const v = ch.vargas[vk]; for (const hh of v.houses){ if (hh.planets.some(x=>x.name===name)) return `${name} ${hh.signName} H${hh.houseNum}`; } } catch(e){} return '';
}
function srchBrief(tp){
  const ch = currentChartForModal, prof = currentProfileForExport; if (!ch) return '';
  const L = ch.ascendant.sign, pr = ch.planets, out = [];
  out.push('Act as an expert Vedic astrologer (Jyotish: sidereal Lahiri, whole-sign houses, Vimshottari dasha). Use ONLY the chart facts below; do not recalculate.');
  out.push(`CHART: Lagna ${SIGNS[L].name} ${ch.ascendant.degInSign.toFixed(1)}° (lord ${SIGNS[L].lord} in H${pr[SIGNS[L].lord]?pr[SIGNS[L].lord].house:'?'}). ${srchPlanetLine(ch,'Moon')}. ${srchPlanetLine(ch,'Sun')}.`);
  out.push(`TOPIC: ${tp.t}.`);
  out.push('KEY HOUSES: ' + tp.h.concat(tp.s.slice(0,2)).map(h=>srchHouseLine(ch,L,h)).join(' | '));
  out.push('KARAKAS: ' + tp.k.map(n=>srchPlanetLine(ch,n)).filter(Boolean).join('; '));
  if (tp.ck && ch.charaKarakas && ch.charaKarakas[tp.ck]){ const n = ch.charaKarakas[tp.ck].planet; out.push(`${tp.ck} (${tp.ck==='Amatyakaraka'?'AmK':tp.ck==='Darakaraka'?'DK':tp.ck==='Atmakaraka'?'AK':tp.ck==='Putrakaraka'?'PK':tp.ck==='Matrikaraka'?'MK':tp.ck==='Bhratrikaraka'?'BK':'GK'}): ${srchPlanetLine(ch,n)}${srchVargaPos(ch,'D9',n)?'; Navamsa '+srchVargaPos(ch,'D9',n):''}`); }
  if (tp.v && tp.v!=='D1' && ch.vargas[tp.v]){
    const vv = ch.vargas[tp.v], lord = SIGNS[vv.ascendantSign].lord, kp = tp.k.map(n=>srchVargaPos(ch,tp.v,n)).filter(Boolean);
    out.push(`${tp.v}: lagna ${SIGNS[vv.ascendantSign].name} (lord ${lord}${srchVargaPos(ch,tp.v,lord)?', '+srchVargaPos(ch,tp.v,lord).replace(lord+' ',''):''})${kp.length?'; '+kp.join(', '):''}`);
  }
  try {
    const ar = calcAllArudhaPadas(ch, L), a = (tp.ar||[]).filter(k=>ar[k]!==undefined).map(k=>`${k} ${SIGNS[ar[k]].name} (H${((ar[k]-L+12)%12)+1})`);
    if (a.length) out.push('ARUDHA: ' + a.join(', '));
  } catch(e){}
  try {
    const act = findActiveDasha(ch.dashaData.mahadashas, new Date());
    if (act && act.mahadasha){
      const ds = [['MD',act.mahadasha],['AD',act.antardasha],['PD',act.pratyantardasha]].filter(x=>x[1]).map(([nm,d])=>{
        const lk = rsLinks(d.lord, L, ch), hit = Object.keys(lk).filter(h=> tp.h.indexOf(+h)>-1 || tp.s.indexOf(+h)>-1).map(h=>lk[h]);
        return `${nm} ${d.lord}${hit.length?' ('+hit.join(', ')+')':' (no direct link)'}`; });
      out.push(`RUNNING DASHA: ${ds.join(' / ')}${act.antardasha?` until ${act.antardasha.endDate.toISOString().slice(0,10)}`:''}`);
    }
  } catch(e){}
  try {
    const jd = nowJulianDay(), mo = pr.Moon.sign, T = ['Saturn','Jupiter','Rahu','Mars'].map(n=>{ const sg = Math.floor(getSiderealLongitudeAt(n, jd)/30); return `${n} in ${SIGNS[sg].name} (H${rsHouseOf(sg,L)} from lagna, H${rsHouseOf(sg,mo)} from Moon)`; });
    out.push(`TRANSITS NOW (${new Date().toISOString().slice(0,10)}): ${T.join('; ')}`);
  } catch(e){}
  out.push(`QUESTION: ${tp.q} Cover: (1) natal promise, (2) current dasha + transit effect, (3) best timing windows, (4) practical advice and remedies, (5) what is uncertain. Keep it clear and balanced.`);
  return out.join('\n');
}
function srchAsk(tp, copyOnly){
  const text = srchBrief(tp); if (!text){ rsToast('Generate a chart first'); return; }
  try { if (navigator.clipboard) navigator.clipboard.writeText(text); } catch(e){}
  if (copyOnly){ rsToast('Full AI brief copied ✓ — paste it into any AI'); return; }
  const short = text.length > 1700 ? text.slice(0,1700) + ' …' : text;
  window.open('https://www.google.com/search?q=' + encodeURIComponent(short) + '&udm=50', '_blank', 'noopener');
  rsToast('Opening Google AI · full brief also copied 📋');
}

/* ============================================================================
   RICH PLANET DETAIL
   ============================================================================ */
const PD = {
 Sun:{sk:'Surya',ic:'☀️',dei:'Shiva / Agni',gem:'Ruby (Manikya)',met:'Gold, Copper',day:'Sunday',col:'Red, Orange',dir:'East',el:'Fire',nat:'Malefic (mild)',gen:'Male',gun:'Sattva',tas:'Pungent',sea:'Summer (Grishma)',num:'1',man:'Om Hraam Hreem Hraum Sah Suryaya Namah',yrs:6,
  body:['Heart','Bones','Head','Right eye','Vitality'],sig:['Soul','Father','Authority','Government','Ego','Leadership','Health'],own:'Leo',ex:'Aries 10°',db:'Libra 10°',mt:'Leo 0–20°',fr:['Moon','Mars','Jupiter'],ne:['Mercury'],en:['Venus','Saturn'],
  about:'The king of the chart and the giver of light. Surya shows your core identity, willpower, confidence and how you shine in the world. A strong Sun gives dignity and leadership; an afflicted Sun can bring ego clashes or low vitality.',
  facts:[['📏','Diameter','1,391,400 km'],['⚖️','Mass','333,000 × Earth'],['🌡️','Surface','≈ 5,500 °C'],['⭐','Type','G2V yellow dwarf'],['⏳','Age','4.6 billion years'],['🌍','Zodiac cycle','≈ 365.25 days']]},
 Moon:{sk:'Chandra',ic:'🌙',dei:'Parvati / Varuna',gem:'Pearl (Moti)',met:'Silver',day:'Monday',col:'White, Cream',dir:'North-West',el:'Water',nat:'Benefic (waxing)',gen:'Female',gun:'Sattva',tas:'Salty',sea:'Rainy (Varsha)',num:'2',man:'Om Shram Shreem Shraum Sah Chandraya Namah',yrs:10,
  body:['Mind','Blood','Chest','Left eye','Fluids'],sig:['Mother','Emotions','Mind','Public','Comfort','Memory','Nourishment'],own:'Cancer',ex:'Taurus 3°',db:'Scorpio 3°',mt:'Taurus 4–20°',fr:['Sun','Mercury'],ne:['Mars','Jupiter','Venus','Saturn'],en:[],
  about:'The fastest planet and the mirror of your mind. Chandra rules emotions, instincts, mother, home and public mood. Your Moon sign and nakshatra set the Vimshottari Dasha, so it is the most personal point in the chart.',
  facts:[['📏','Diameter','3,474 km'],['🛰️','Distance','384,400 km'],['🔄','Sidereal month','27.32 days'],['🌗','Phase cycle','29.53 days'],['⬇️','Gravity','1.62 m/s²'],['🌡️','Surface','−173 to 127 °C']]},
 Mars:{sk:'Mangala',ic:'🔥',dei:'Kartikeya (Skanda)',gem:'Red Coral (Moonga)',met:'Copper',day:'Tuesday',col:'Red',dir:'South',el:'Fire',nat:'Malefic',gen:'Male',gun:'Tamas',tas:'Bitter',sea:'Summer',num:'9',man:'Om Kraam Kreem Kraum Sah Bhaumaya Namah',yrs:7,
  body:['Blood','Muscles','Marrow','Head','Energy'],sig:['Courage','Siblings','Land','Property','Action','Surgery','Competition'],own:'Aries, Scorpio',ex:'Capricorn 28°',db:'Cancer 28°',mt:'Aries 0–12°',fr:['Sun','Moon','Jupiter'],ne:['Venus','Saturn'],en:['Mercury'],
  about:'The commander of the zodiac. Mangala brings drive, bravery, stamina and the will to fight for what you want. Well placed it gives success in sports, engineering and defence; afflicted it gives anger, accidents or conflict.',
  facts:[['📏','Diameter','6,779 km'],['☀️','Distance from Sun','1.52 AU'],['🔄','Orbit','687 days'],['⏱️','Day length','24 h 37 m'],['🌑','Moons','2 (Phobos, Deimos)'],['🌡️','Average temp','≈ −63 °C']]},
 Mercury:{sk:'Budha',ic:'📚',dei:'Vishnu',gem:'Emerald (Panna)',met:'Bronze, Brass',day:'Wednesday',col:'Green',dir:'North',el:'Earth',nat:'Neutral (follows company)',gen:'Neutral',gun:'Rajas',tas:'Mixed',sea:'Autumn (Sharad)',num:'5',man:'Om Braam Breem Braum Sah Budhaya Namah',yrs:17,
  body:['Nervous system','Skin','Tongue','Lungs','Hands'],sig:['Intellect','Speech','Trade','Writing','Analysis','Humour','Youth'],own:'Gemini, Virgo',ex:'Virgo 15°',db:'Pisces 15°',mt:'Virgo 16–20°',fr:['Sun','Venus'],ne:['Mars','Jupiter','Saturn'],en:['Moon'],
  about:'The prince of the planets. Budha rules thinking, communication, business, learning and wit. It takes the colour of whichever planet it sits with, so its company matters as much as its sign.',
  facts:[['📏','Diameter','4,879 km'],['☀️','Distance from Sun','0.39 AU'],['🔄','Orbit','88 days'],['⏱️','Solar day','176 Earth days'],['🌑','Moons','0'],['🌡️','Surface','−180 to 430 °C']]},
 Jupiter:{sk:'Guru / Brihaspati',ic:'🕉️',dei:'Indra / Brahma',gem:'Yellow Sapphire (Pukhraj)',met:'Gold',day:'Thursday',col:'Yellow',dir:'North-East',el:'Ether (Akasha)',nat:'Great benefic',gen:'Male',gun:'Sattva',tas:'Sweet',sea:'Winter (Hemanta)',num:'3',man:'Om Graam Greem Graum Sah Gurave Namah',yrs:16,
  body:['Liver','Fat','Thighs','Arteries','Ears'],sig:['Wisdom','Teachers','Children','Wealth','Dharma','Fortune','Expansion'],own:'Sagittarius, Pisces',ex:'Cancer 5°',db:'Capricorn 5°',mt:'Sagittarius 0–10°',fr:['Sun','Moon','Mars'],ne:['Saturn'],en:['Mercury','Venus'],
  about:'The teacher of the gods and the planet of grace. Guru expands whatever it touches: knowledge, faith, children, money and good fortune. It protects the houses it aspects and is the main benefic of the chart.',
  facts:[['📏','Diameter','139,820 km'],['☀️','Distance from Sun','5.20 AU'],['🔄','Orbit','11.86 years'],['⏱️','Day length','9 h 56 m'],['🌑','Moons','90+'],['⚖️','Mass','318 × Earth']]},
 Venus:{sk:'Shukra',ic:'💎',dei:'Lakshmi',gem:'Diamond (Heera)',met:'Silver, Platinum',day:'Friday',col:'White, Pink',dir:'South-East',el:'Water',nat:'Benefic',gen:'Female',gun:'Rajas',tas:'Sour',sea:'Spring (Vasanta)',num:'6',man:'Om Draam Dreem Draum Sah Shukraya Namah',yrs:20,
  body:['Reproductive organs','Face','Kidneys','Skin','Throat'],sig:['Love','Marriage','Beauty','Arts','Luxury','Vehicles','Pleasure'],own:'Taurus, Libra',ex:'Pisces 27°',db:'Virgo 27°',mt:'Libra 0–15°',fr:['Mercury','Saturn'],ne:['Mars','Jupiter'],en:['Sun','Moon'],
  about:'The guru of the demons and the giver of comforts. Shukra governs romance, partnerships, art, music, beauty and wealth. It shows how you love and what you find pleasing.',
  facts:[['📏','Diameter','12,104 km'],['☀️','Distance from Sun','0.72 AU'],['🔄','Orbit','224.7 days'],['⏱️','Rotation','243 days (backwards)'],['🌑','Moons','0'],['🌡️','Surface','≈ 465 °C']]},
 Saturn:{sk:'Shani',ic:'⏳',dei:'Yama / Brahma',gem:'Blue Sapphire (Neelam)',met:'Iron',day:'Saturday',col:'Black, Dark blue',dir:'West',el:'Air',nat:'Malefic (teacher)',gen:'Neutral',gun:'Tamas',tas:'Astringent',sea:'Late winter (Shishira)',num:'8',man:'Om Praam Preem Praum Sah Shanaye Namah',yrs:19,
  body:['Bones','Teeth','Knees','Nerves','Legs'],sig:['Karma','Discipline','Delay','Longevity','Hard work','Justice','Service'],own:'Capricorn, Aquarius',ex:'Libra 20°',db:'Aries 20°',mt:'Aquarius 0–20°',fr:['Mercury','Venus'],ne:['Jupiter'],en:['Sun','Moon','Mars'],
  about:'The judge and the great teacher. Shani rewards patience and effort and tests whatever is unfinished. Its delays are slow but lasting, and a well placed Saturn gives discipline, status and endurance.',
  facts:[['📏','Diameter','116,460 km'],['☀️','Distance from Sun','9.54 AU'],['🔄','Orbit','29.46 years'],['⏱️','Day length','10 h 33 m'],['🌑','Moons','140+'],['💍','Famous for','Bright ring system']]},
 Rahu:{sk:'Rahu',ic:'🐉',dei:'Durga / Naga',gem:'Hessonite (Gomed)',met:'Lead, Mixed',day:'Saturday',col:'Smoky, Dark',dir:'South-West',el:'Air',nat:'Malefic (shadow)',gen:'Neutral',gun:'Tamas',tas:'Pungent',sea:'Varies',num:'4',man:'Om Bhraam Bhreem Bhraum Sah Rahave Namah',yrs:18,
  body:['Skin','Nervous system','Poison','Feet'],sig:['Obsession','Foreign lands','Technology','Illusion','Ambition','Sudden events','Unconventional'],own:'Aquarius (co-lord)',ex:'Taurus',db:'Scorpio',mt:'Gemini / Virgo (varies)',fr:['Mercury','Venus','Saturn'],ne:['Jupiter'],en:['Sun','Moon','Mars'],
  about:'A shadow planet: the north node of the Moon. Rahu magnifies desire and ambition and pulls you toward new experiences, often unusual or foreign. It is always retrograde and brings sudden gains and tests.',
  facts:[['🌐','Nature','Lunar north node'],['🔄','Full cycle','18.6 years'],['♈','Time per sign','≈ 1.5 years'],['↩️','Motion','Always retrograde'],['🌒','Eclipses','Near Sun/Moon']]},
 Ketu:{sk:'Ketu',ic:'🪔',dei:'Ganesha',gem:"Cat's Eye (Lehsunia)",met:'Mixed',day:'Tuesday',col:'Multi-colour',dir:'South-West',el:'Fire',nat:'Malefic (spiritual)',gen:'Neutral',gun:'Tamas',tas:'Mixed',sea:'Varies',num:'7',man:'Om Sraam Sreem Sraum Sah Ketave Namah',yrs:7,
  body:['Nerves','Spine','Abdomen','Stomach'],sig:['Moksha','Detachment','Spirituality','Past karma','Intuition','Isolation','Research'],own:'Scorpio (co-lord)',ex:'Scorpio',db:'Taurus',mt:'Sagittarius (varies)',fr:['Mars','Venus','Saturn'],ne:['Mercury','Jupiter'],en:['Sun','Moon'],
  about:'The south node and the planet of release. Ketu points to past-life skill, detachment and spiritual insight. It makes the house it sits in feel empty yet deeply intuitive.',
  facts:[['🌐','Nature','Lunar south node'],['🔄','Full cycle','18.6 years'],['♈','Time per sign','≈ 1.5 years'],['↩️','Motion','Always retrograde'],['🌒','Eclipses','Opposite Rahu']]}
};
const MEAN_SPEED = { Sun:0.9856, Moon:13.176, Mars:0.524, Mercury:1.383, Jupiter:0.0831, Venus:1.2, Saturn:0.0335, Rahu:0.053, Ketu:0.053 };
const LADDER = ['Exalted','Own sign','Friendly','Neutral','Enemy','Debilitated'];
function dignityOf(n, si){
  if (CONDEX[n] === si) return 'Exalted'; if ((CONDEX[n]+6)%12 === si) return 'Debilitated';
  const sl = SIGNS[si].lord; if (sl === n) return 'Own sign';
  if (PD[n].fr.includes(sl)) return 'Friendly'; if (PD[n].en.includes(sl)) return 'Enemy'; return 'Neutral';
}
function pdxTab(btn, id){
  const root = btn.closest('.pdx-root');
  root.querySelectorAll('.pdx-tab').forEach(t=> t.classList.toggle('on', t === btn));
  root.querySelectorAll('.pdx-pane').forEach(p=> p.classList.toggle('on', p.dataset.pane === id));
  const m = btn.closest('.pdmodal'); if (m) m.scrollTo({ top: 0, behavior: 'smooth' });
}
function openPlanetDetail(name, jd){
  if (jd == null) jd = currentJD;
  if (OUTER_LIST.includes(name)) return openOuterPlanetDetail(name, jd);
  const snap = snapshotPositions(jd), lon = snap.sidereal[name], si = getSignIndex(lon), sign = SIGNS[si], dms = degreeInSign(lon);
  const nakIdx = getNakshatraIndex(lon), nak = NAKSHATRAS[nakIdx], pada = getPadaIndex(lon)+1, d = PD[name], col = PLANET_COLORS[name];
  const isNode = name === 'Rahu' || name === 'Ketu', isRetro = isNode || snap.retro[name];
  const speed = planetSpeed(name, jd), occ = getSignOccupancy(name, jd), dig = dignityOf(name, si);
  const nSign = (([0,9,6,3][si%4]) + Math.floor(dms.raw/(30/9))) % 12, varg = nSign === si;
  const sunD = Math.abs(angDiff(lon, snap.sidereal.Sun)), comb = COMBUST[name] && sunD < COMBUST[name];
  const pchip = n=> `<button type="button" class="pdx-pchip" style="--c:${PLANET_COLORS[n]}" onclick="openPlanetDetail('${n}',${jd})">${PLANET_GLYPHS[n]} ${n}</button>`;
  const chips = a=> a.length ? a.map(x=>`<span class="pdx-chip">${x}</span>`).join('') : '<span class="pdx-chip">None</span>';
  const card = (k,v,sb,w)=> `<div class="pdx-card pdx-in ${w?'wide':''}"><div class="k">${k}</div><div class="v">${v}</div>${sb?`<div class="s">${sb}</div>`:''}</div>`;
  let house = '';
  if (isValidProfile(activeNatalProfile)){ const L = computeNatalAscendant(activeNatalProfile).lagnaLon; const h = getHouseOfLongitude(lon, getSignIndex(L)); house = card('House from Lagna', `${h}${h===1?' · Lagna':''}`, activeNatalProfile.name); }
  const ratio = Math.abs(speed) / MEAN_SPEED[name], spPct = Math.min(100, ratio*50);
  const total = (occ.daysIn!=null && occ.daysLeft!=null) ? occ.daysIn + occ.daysLeft : null, prog = total ? Math.round(occ.daysIn/total*100) : Math.round(dms.raw/30*100);
  // upcoming sign changes
  let ing = '', j = occ.exitJD, cnt = 0;
  while (j != null && cnt < 4){ const nj = j + 0.5, ns = getSignIndex(snapshotPositions(nj).sidereal[name]); ing += `<div class="pdx-row pdx-in" style="--i:${cnt}"><span>${SIGNS[ns].symbol} ${SIGNS[ns].name}</span><b>${formatFullDate(j)}</b></div>`; j = getSignOccupancy(name, nj).exitJD; cnt++; }
  // aspects
  const asp = computeAspects(snap.sidereal).filter(a=> a.from===name || a.to===name), ord = {3:'3rd',4:'4th',5:'5th',7:'7th',8:'8th',9:'9th',10:'10th'};
  const aspHtml = asp.map((a,i)=>{ const f = a.from===name, o = f ? a.to : a.from;
    return `<div class="pdx-row pdx-in" style="--i:${i};cursor:pointer" onclick="openPlanetDetail('${o}',${jd})"><span style="color:${PLANET_COLORS[o]};font-size:18px">${PLANET_GLYPHS[o]}</span><span>${f?'aspects':'aspected by'} <b style="color:var(--text);margin:0;font-family:inherit;font-size:13px">${o}</b></span><b>${ord[a.houseOffset]||a.houseOffset+'th'} drishti</b></div>`; }).join('');
  const conj = PLANET_LIST.filter(n=> n!==name && getSignIndex(snap.sidereal[n]) === si);
  const html = `<div class="pdx-root" style="--pc:${col};--pca:${col}55">
    <div class="pdx-hero">
      <div class="pdx-orb"><span>${PLANET_GLYPHS[name]}</span></div>
      <div class="pdx-name">${name}</div><div class="pdx-sk">${d.sk}</div>
      <div class="pdx-date">${formatFullDate(jd)}</div>
      <div class="pdx-badges"><span class="pdx-badge">${sign.symbol} ${sign.name}</span><span class="pdx-badge">${nak} · Pada ${pada}</span>
        <span class="pdx-badge ${isRetro?'bad':'good'}">${isRetro?'℞ Retrograde':'Direct'}</span><span class="pdx-badge ${dig==='Exalted'||dig==='Own sign'?'good':dig==='Debilitated'||dig==='Enemy'?'bad':''}">${dig}</span>${comb?'<span class="pdx-badge bad">☀ Combust</span>':''}${varg?'<span class="pdx-badge good">Vargottama</span>':''}</div>
    </div>
    <div class="pdx-tabs"><button class="pdx-tab on" onclick="pdxTab(this,'ov')">Overview</button><button class="pdx-tab" onclick="pdxTab(this,'st')">Strength</button><button class="pdx-tab" onclick="pdxTab(this,'ka')">Karakas</button><button class="pdx-tab" onclick="pdxTab(this,'ti')">Timeline</button><button class="pdx-tab" onclick="pdxTab(this,'as')">Aspects</button><button class="pdx-tab" onclick="pdxTab(this,'fa')">Facts</button></div>
    <div class="pdx-pane on" data-pane="ov">
      <div class="pdx-about pdx-in">${d.about}</div>
      <div class="pdx-h">Position</div>
      <div class="pd-gauge-row pdx-in" style="--i:1">${buildDegreeGaugeSVG(dms.raw, col)}<div class="pd-gauge-label"><div class="pd-gauge-deg">${dms.deg}° ${dms.min}' ${dms.sec}"</div><div class="pd-gauge-sign">into ${sign.symbol} ${sign.name} (${sign.sk})</div></div></div>
      <div class="pdx-grid" style="margin-top:12px">
        ${card('Sidereal longitude', lon.toFixed(3)+'°', ayanName()+' ayanamsa')}${card('Nakshatra', nak, 'Lord '+NAKSHATRA_LORDS[nakIdx]+' · Pada '+pada+' of 4')}
        ${card('Sign lord', sign.lord, sign.sk+' rashi')}${card('Navamsa (D9)', SIGNS[nSign].symbol+' '+SIGNS[nSign].name, varg?'Vargottama: same sign in D1 and D9':'Soul and marriage strength')}${house}
        ${card('Daily motion', (speed>=0?'+':'')+speed.toFixed(4)+'°/day', speedCategory(name, jd))}
        ${conj.length ? `<div class="pdx-card wide pdx-in"><div class="k">Sharing the sign with</div><div class="pdx-chips" style="margin-top:8px">${conj.map(pchip).join('')}</div></div>` : ''}
      </div>
      <div class="pdx-h">Speed vs. average</div>
      <div class="pdx-card pdx-in"><div class="v">${ratio.toFixed(2)}× its average pace</div><div class="pdx-bar"><i style="--w:${spPct}%"></i></div><div class="s" style="margin-top:6px">${ratio<0.15?'Nearly stationary (station point)':ratio<0.8?'Slower than usual':ratio<1.2?'Normal speed':'Faster than usual'}</div></div>
    </div>
    <div class="pdx-pane" data-pane="st">
      <div class="pdx-h">Dignity in ${sign.name}</div>
      <div class="pdx-ladder">${LADDER.map(l=>`<div class="pdx-step ${l===dig?'cur':''}">${l}</div>`).join('')}</div>
      <div class="pdx-grid" style="margin-top:12px">
        ${card('Sign lord relation', sign.lord===name?'Rules this sign':sign.lord+' is '+(d.fr.includes(sign.lord)?'a friend':d.en.includes(sign.lord)?'an enemy':'neutral'))}
        ${card('Vargottama', varg?'Yes':'No', 'D1 sign = D9 sign')}
        ${card('Combustion', COMBUST[name] ? (comb?'Combust':'Not combust') : 'Not applicable', COMBUST[name] ? sunD.toFixed(1)+'° from Sun (limit '+COMBUST[name]+'°)' : '')}
        ${card('Motion (Cheshta)', isRetro?'Retrograde':'Direct', isRetro?'Retrograde planets act with extra intensity':'')}
      </div>
      <div class="pdx-h">Key degrees</div>
      <div class="pdx-grid">${card('Exaltation', d.ex)}${card('Debilitation', d.db)}${card('Own sign', d.own)}${card('Moolatrikona', d.mt)}</div>
      <div class="pdx-h">Natural relationships</div>
      <div class="pdx-card"><div class="k">Friends</div><div class="pdx-chips" style="margin:8px 0 12px">${d.fr.length?d.fr.map(pchip).join(''):chips([])}</div><div class="k">Neutral</div><div class="pdx-chips" style="margin:8px 0 12px">${d.ne.length?d.ne.map(pchip).join(''):chips([])}</div><div class="k">Enemies</div><div class="pdx-chips" style="margin-top:8px">${d.en.length?d.en.map(pchip).join(''):chips([])}</div></div>
    </div>
    <div class="pdx-pane" data-pane="ka">
      <div class="pdx-grid">
        ${card('Deity', d.dei)}${card('Gemstone', d.gem)}${card('Metal', d.met)}${card('Day', d.day)}${card('Colour', d.col)}${card('Direction', d.dir)}
        ${card('Element', d.el)}${card('Nature', d.nat)}${card('Gender', d.gen)}${card('Guna', d.gun)}${card('Taste', d.tas)}${card('Season', d.sea)}
        ${card('Lucky number', d.num)}${card('Dasha years', d.yrs+' years', 'Vimshottari Dasha')}${card('Bija mantra', d.man, '', true)}
      </div>
      <div class="pdx-h">Signifies</div><div class="pdx-chips pdx-in">${chips(d.sig)}</div>
      <div class="pdx-h">Body parts</div><div class="pdx-chips pdx-in">${chips(d.body)}</div>
    </div>
    <div class="pdx-pane" data-pane="ti">
      <div class="pdx-h">Time in ${sign.name}</div>
      <div class="pdx-card pdx-in"><div class="v">${prog}% through this sign</div><div class="pdx-bar"><i style="--w:${prog}%"></i></div>
        <div class="s" style="margin-top:8px">${occ.daysIn!=null?formatDurationDays(occ.daysIn)+' in · ':''}${occ.daysLeft!=null?formatDurationDays(occ.daysLeft)+' left':''}</div></div>
      <div class="pdx-grid" style="margin-top:10px">${card('Entered', occ.enterJD!=null?formatFullDate(occ.enterJD):'Beyond range')}${card('Leaves', occ.exitJD!=null?formatFullDate(occ.exitJD):'Beyond range')}</div>
      <div class="pdx-h">Next sign changes</div>${ing || '<div class="pd-empty-note">Beyond the calculable range.</div>'}
    </div>
    <div class="pdx-pane" data-pane="as">
      <div class="pdx-h">Graha Drishti</div>${aspHtml || `<div class="pd-empty-note">No planets currently in aspect with ${name}.</div>`}
    </div>
    <div class="pdx-pane" data-pane="fa">
      <div class="pdx-h">${isNode?'About the node':'Astronomy facts'}</div>
      <div class="pdx-grid">${d.facts.map(f=>card(f[0]+' '+f[1], f[2])).join('')}</div>
    </div>
  </div>`;
  const box = document.getElementById('planetDetailContent'); box.innerHTML = html;
  document.getElementById('planetDetailOverlay').classList.add('show');
  const m = box.closest('.pdmodal'); if (m) m.scrollTop = 0;
  requestAnimationFrame(()=> requestAnimationFrame(()=> box.querySelector('.pdx-root').classList.add('go')));
}


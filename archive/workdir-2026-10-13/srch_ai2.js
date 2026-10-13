/* ---------- Ask-AI: topic → small box of focused questions → Google AI mode ---------- */
const SRCH_STYLE = 'STYLE: Write for a beginner. Start with the direct answer. Be specific (real names, lists, numbers, years). Rank by likelihood. Use short bullets, no astrology jargon, and do NOT recite chart placements. Use the chart facts silently; add at most ONE short "Why:" line at the end. No filler, no disclaimers except for health. Max ~250 words unless a long list is asked.';
const SRCH_TOPICS = [
 {id:'career',ico:'💼',t:'Career & profession',kw:'job work profession promotion success',h:[10],s:[6,2,11],k:['Sun','Saturn','Mercury','Jupiter'],ck:'Amatyakaraka',v:'D10',ar:['A10','AL'],subs:[
  ['Top 20 careers for me','List 20 specific careers/professions ranked from most to least likely for me (like artist, scientist, doctor, advocate, engineer, teacher). One line each: the job + a 4-6 word reason in plain words.'],
  ['Job or business?','Say clearly: job, business, or both, with one line why. Then list 5 job roles and 5 business types that fit me.'],
  ['Best industries & work style','List my 10 best industries, then my ideal work style (solo or team, desk or field, own boss or not) in 5 short bullets.'],
  ['Next 5 years of career','Give a year-by-year list for the next 5 years: rise / stable / change / risk, one line each, with the best months or quarters to move.'],
  ['Blockers & fixes','List my 5 biggest career blockers and one practical fix for each.'],
  ['Skills to build','List my 8 strongest professional strengths and the 3 skills I should develop most.']]},
 {id:'job',ico:'🧑‍💻',t:'Job vs business',kw:'employment self employed entrepreneur startup',h:[10,7],s:[6,3,11],k:['Mercury','Saturn','Mars'],ck:'Amatyakaraka',v:'D10',ar:['A10'],subs:[
  ['Job or business: decide','Give a direct verdict (job / business / both) with a percentage split and one reason.'],
  ['15 business ideas','List 15 specific business ideas ranked by fit for me, with 4-word reasons.'],
  ['Best time to switch or start','List the 3 best years/windows to change jobs or start a business, and 2 periods to avoid.'],
  ['Solo or partners?','Should I work alone or with partners? Describe the type of partner to trust and the type to avoid.']]},
 {id:'money',ico:'💰',t:'Wealth & finances',kw:'money income savings rich dhana',h:[2,11],s:[5,9,8],k:['Jupiter','Venus'],ck:'',v:'D2',ar:['A2','A11'],subs:[
  ['10 income sources','List my 10 most likely sources of income, ranked, one line each.'],
  ['Money habits','Describe my money nature in 6 bullets: saver or spender, risk taker or safe, and what to watch.'],
  ['Wealth years ahead','Year-by-year for the next 5 years: income up/down, best years to invest, buy or save.'],
  ['Where to invest','List 8 asset types that suit my nature ranked, and 4 to avoid (general idea only, not financial advice).'],
  ['Money leaks & fixes','List my 5 biggest money leaks and a fix for each.']]},
 {id:'fame',ico:'🌟',t:'Fame, status & recognition',kw:'reputation name public image authority',h:[10,1],s:[11,5],k:['Sun','Moon'],ck:'Atmakaraka',v:'D10',ar:['AL','A10'],subs:[
  ['Will I become well known?','Give a direct verdict with a percentage and the fields where it is most likely.'],
  ['My public image','In 6 bullets: how people see me, and how to sharpen it.'],
  ['10 best fields for recognition','List 10 fields or platforms where I can get recognised, ranked.'],
  ['When recognition peaks','List the 3 best years/windows for visibility and 1 to avoid.']]},
 {id:'spouse',ico:'💍',t:'Spouse & marriage',kw:'wife husband partner relationship spouse details',h:[7],s:[2,11,12],k:['Venus','Jupiter'],ck:'Darakaraka',v:'D9',ar:['UL','A7'],subs:[
  ['Who is my likely spouse','Describe my likely spouse in bullets: personality, looks tendency, 8 most likely professions, family background, age gap tendency and how close our culture will be.'],
  ['Where & how will I meet','List the 10 most likely places or ways I meet my partner, ranked (work, college, friends, family introduction, online, travel, neighbourhood...). One line each.'],
  ['Love or arranged?','Give a direct verdict with a percentage split between love and arranged.'],
  ['Where is my partner from','Rank where my partner is likely from: same city, another city, another state, abroad, other culture. One line each.'],
  ['Marriage quality','List my marriage strengths (5) and challenges (5) in plain words.'],
  ['Making marriage smoother','Give 6 practical habits and traditional remedies for a smoother marriage.']]},
 {id:'marriagetime',ico:'📅',t:'Marriage timing',kw:'when will i marry wedding delay',h:[7,2,11],s:[5,12],k:['Venus','Jupiter'],ck:'Darakaraka',v:'D9',ar:['UL'],subs:[
  ['Likely marriage years','List the 3 most likely years/age windows for marriage, ranked, one line each.'],
  ['Any delay and why','Is there a delay? Say yes/no, give 3 plain reasons, and the first window when it eases.'],
  ['Best months next 12 months','List the best 3 months in the next 12 for engagement/marriage steps and any to avoid.']]},
 {id:'love',ico:'❤️',t:'Love & romance',kw:'dating affair crush relationship attraction',h:[5,7],s:[11,2],k:['Venus','Moon'],ck:'Darakaraka',v:'D9',ar:['UL'],subs:[
  ['My romance pattern','Describe how I love and what I need, in 6 bullets.'],
  ['Types of people I attract','List 8 types of partner I am attracted to or attract.'],
  ['Heartbreak risks & how to avoid','List 5 relationship traps for me and how to avoid each.'],
  ['Best time for new love','List the best 3 windows for new love in the next 3 years.']]},
 {id:'children',ico:'👶',t:'Children & progeny',kw:'kids baby child birth pregnancy fertility',h:[5],s:[2,9,11],k:['Jupiter'],ck:'Putrakaraka',v:'D7',ar:['A5'],subs:[
  ['Children: outlook','Give a direct outlook on having children (easy / some delay / needs care) with a one-line reason.'],
  ['Best years for children','List the 3 most favourable years/windows.'],
  ['My child\'s nature','Describe the kind of child(ren) I am likely to have in 6 bullets and my parenting style.'],
  ['Support & remedies','List 5 practical supports or traditional remedies that help.']]},
 {id:'education',ico:'🎓',t:'Education & learning',kw:'study college exams degree knowledge',h:[4,5],s:[9,2],k:['Mercury','Jupiter'],ck:'Putrakaraka',v:'D24',ar:[],subs:[
  ['15 best subjects/degrees','List 15 subjects or degrees ranked by fit.'],
  ['How I learn best','Describe my learning style and 5 study habits that work for me.'],
  ['Exam & degree timing','List the best years/windows for exams, admissions or a new course.'],
  ['Study abroad chance','Give a direct verdict on studying abroad, best regions, and best timing.']]},
 {id:'health',ico:'🩺',t:'Health & vitality',kw:'disease illness body fitness immunity',h:[1,6],s:[8,12],k:['Sun','Moon','Mars'],ck:'Atmakaraka',v:'D30',ar:['A6'],subs:[
  ['Strong & sensitive areas','List my body areas from strongest to most sensitive, one line each (traditional astrology, not medical advice).'],
  ['Habits that suit me','List 8 daily habits, foods and exercise types that suit me.'],
  ['Care periods','List the periods that need extra care and the periods of strong vitality (balanced, non-fearful).'],
  ['Stress & sleep','Give 5 tips for my stress and sleep pattern.']]},
 {id:'mind',ico:'🧠',t:'Mind & emotional peace',kw:'stress anxiety depression mood happiness',h:[4,1],s:[5,12],k:['Moon','Mercury'],ck:'Atmakaraka',v:'D1',ar:[],subs:[
  ['My stress triggers','List my top 6 stress triggers in plain words.'],
  ['Mood pattern','Describe my emotional nature and mood cycle in 6 bullets.'],
  ['Habits for peace','List 8 daily practices that bring me peace.'],
  ['Best calming practices','Rank 8 practices (meditation, music, nature, prayer, exercise...) by how well they suit me.']]},
 {id:'longevity',ico:'⏳',t:'Resilience & sudden changes',kw:'life span accidents surgery transformation 8th house',h:[8,1],s:[3,6,12],k:['Saturn'],ck:'Atmakaraka',v:'D30',ar:['A8'],subs:[
  ['Sudden-change areas','List the life areas where sudden change is most likely, ranked, with a calm tone.'],
  ['Sensitive periods','List the next 3 sensitive periods and how to handle each (balanced, no fear).'],
  ['Protective habits','List 6 habits that protect me.']]},
 {id:'father',ico:'👨',t:'Father & mentors',kw:'dad guru teacher blessings',h:[9],s:[10,3],k:['Sun','Jupiter'],ck:'',v:'D12',ar:['A9'],subs:[
  ['Bond with father','Describe my bond and support from my father in 6 bullets.'],
  ['Father\'s nature & work','Describe my father\'s likely nature and 5 likely professions.'],
  ['Mentors & gurus','Describe the type of mentor/teacher who helps me and when they appear.']]},
 {id:'mother',ico:'👩',t:'Mother & home life',kw:'mom family happiness domestic',h:[4],s:[10,9],k:['Moon'],ck:'Matrikaraka',v:'D12',ar:['A4'],subs:[
  ['Bond with mother','Describe my bond and support from my mother in 6 bullets.'],
  ['Home happiness','Rate my domestic happiness and give 5 ways to improve it.']]},
 {id:'siblings',ico:'🧑‍🤝‍🧑',t:'Siblings & courage',kw:'brother sister effort initiative',h:[3],s:[11,1],k:['Mars'],ck:'Bhratrikaraka',v:'D3',ar:['A3'],subs:[
  ['Siblings','Describe my likely siblings situation and support in 6 bullets.'],
  ['My courage & effort style','Describe how I take initiative and handle risk in 6 bullets.']]},
 {id:'property',ico:'🏠',t:'Property, home & vehicles',kw:'house land real estate car buy flat',h:[4],s:[2,11,12],k:['Mars','Venus','Saturn'],ck:'Matrikaraka',v:'D4',ar:['A4'],subs:[
  ['Will I own property?','Give a direct verdict and the likely age/year range.'],
  ['What suits me','Rank: house, flat, land, farm, commercial, vehicle, with a one-line reason each.'],
  ['Where to buy','Describe the best type of location/direction and city style for me.'],
  ['Best years to buy','List the best 3 years/windows to buy property or a vehicle.']]},
 {id:'foreign',ico:'✈️',t:'Foreign travel & settlement',kw:'abroad visa immigration relocate overseas',h:[12,9],s:[3,7,4],k:['Rahu','Moon'],ck:'',v:'D1',ar:[],subs:[
  ['Will I go abroad?','Give a direct verdict with a percentage and the type: study, work, settle, or travel.'],
  ['10 best countries/regions','List 10 countries or regions ranked by fit for me.'],
  ['Best years to go','List the best 3 years/windows to travel, move or study abroad.']]},
 {id:'enemies',ico:'⚔️',t:'Rivals, debts & disputes',kw:'enemies litigation court competition loans conflict',h:[6],s:[8,12,3],k:['Mars','Saturn'],ck:'Gnatikaraka',v:'D1',ar:['A6'],subs:[
  ['Types of rivals','Describe the kind of rivals/opponents I face in 6 bullets.'],
  ['Debt & legal risk','Give a calm verdict on debt and legal-dispute risk and 5 ways to stay safe.'],
  ['How I win','List 6 strategies that work best for me in conflicts.']]},
 {id:'spiritual',ico:'🕉️',t:'Spirituality & moksha',kw:'meditation dharma purpose inner growth',h:[9,12],s:[5,8],k:['Ketu','Jupiter'],ck:'Atmakaraka',v:'D20',ar:[],subs:[
  ['8 paths that suit me','List 8 spiritual paths/practices (bhakti, meditation, yoga, service, study...) ranked.'],
  ['Traditional mantra / deity leaning','Name the traditional deities or mantras that match my chart (3-5) and a simple daily practice.'],
  ['When spirituality deepens','List the best periods for spiritual growth.']]},
 {id:'karma',ico:'🔮',t:'Karma & past life',kw:'karmic lessons rahu ketu dosha pitru kala sarpa mangal past life debt',h:[5,9,12,8],s:[1],k:['Rahu','Ketu','Saturn'],ck:'Atmakaraka',v:'D60',ar:[],subs:[
  ['My karmic lessons','List my top 6 karmic lessons in this life in plain words, one line each.'],
  ['Past-life gifts','List 8 talents or instincts that feel naturally mine (likely carried from the past).'],
  ['Repeating patterns','List 5 relationship/life patterns that repeat for me and how to break each.'],
  ['Doshas explained simply','Using DOSHA FACTS, say which doshas apply (Mangal, Kala Sarpa, Pitru, Shani), in plain words, with how serious each is and 3 traditional remedies.'],
  ['Soul\'s mission','In 3 short lines, say my soul\'s mission and what to focus on.']]},
 {id:'purpose',ico:'🧭',t:'Personality & life purpose',kw:'nature character soul atmakaraka self',h:[1],s:[5,9],k:['Sun','Moon'],ck:'Atmakaraka',v:'D9',ar:['AL'],subs:[
  ['My top 10 strengths','List my 10 strongest traits.'],
  ['5 weaknesses & fixes','List my 5 weaknesses and a fix for each.'],
  ['Life purpose','State my life purpose in 3 lines.'],
  ['Traditional lucky aids','List my traditional lucky colour, day, number, direction and gem (for fun, traditional).']]},
 {id:'friends',ico:'🤝',t:'Friends, networks & gains',kw:'social circle allies fulfilment desires',h:[11],s:[3,7,5],k:['Jupiter','Mercury'],ck:'',v:'D1',ar:['A11'],subs:[
  ['My friend types','Describe the kind of friends I attract in 6 bullets.'],
  ['Networking strengths','List how I gain from networks and 5 ways to use it.']]},
 {id:'losses',ico:'📉',t:'Expenses, losses & sleep',kw:'spending waste hospital isolation bed',h:[12],s:[2,6,8],k:['Saturn','Ketu'],ck:'',v:'D1',ar:[],subs:[
  ['Where money leaks','List my top 6 spending leaks and a fix each.'],
  ['Sleep & rest','Describe my sleep pattern and 5 tips.'],
  ['Hidden fears','List 5 hidden fears or blocks and how to ease them.']]},
 {id:'talent',ico:'🎨',t:'Talent, creativity & arts',kw:'music art writing skill hobby entertainment',h:[5,3],s:[10,11],k:['Venus','Mercury','Moon'],ck:'Putrakaraka',v:'D9',ar:[],subs:[
  ['15 creative fields','List 15 creative fields ranked by fit for me.'],
  ['Natural talents','List my 8 natural talents.'],
  ['Hobbies that suit me','List 8 hobbies that recharge me.']]},
 {id:'inherit',ico:'🏦',t:'Inheritance & hidden wealth',kw:'will insurance partner money legacy',h:[8,2],s:[11,7],k:['Saturn','Jupiter'],ck:'',v:'D1',ar:['A8'],subs:[
  ['Inheritance outlook','Give a direct outlook on inheritance and family wealth.'],
  ['Partner / insurance money','Describe money from partners, insurance or sudden sources in 5 bullets.']]},
 {id:'thisyear',ico:'🗓️',t:'This year & next 12 months',kw:'forecast prediction timing dasha transit now upcoming',h:[1,10,7,2,11],s:[4,5,9],k:['Jupiter','Saturn'],ck:'',v:'D1',ar:[],subs:[
  ['Month-by-month next 12 months','List the next 12 months, one line each: theme + one thing to do.'],
  ['Best 3 & toughest 3 months','Name my best 3 and toughest 3 months in the next 12, with a short reason.'],
  ['Do & avoid this year','Give 6 things to do and 6 things to avoid this year.']]}
];
function srchHouseLine(ch, L, h){
  const pr = ch.planets, si = (L+h-1)%12, s = SIGNS[si], lp = pr[s.lord];
  const occ = PLANET_LIST.filter(n=> pr[n] && pr[n].house===h);
  const asp = PLANET_LIST.filter(n=> pr[n] && pr[n].house!==h && (pr[n].aspectsHouses||[]).indexOf(h)>-1);
  return `H${h} ${s.name}: lord ${s.lord}${lp?` in H${lp.house} ${SIGNS[lp.sign].name}${lp.dignity&&lp.dignity.status&&lp.dignity.status!=='Neutral'?' ('+lp.dignity.status+')':''}${lp.retrograde?' R':''}`:''}; occ ${occ.length?occ.join(','):'none'}; aspected by ${asp.length?asp.join(','):'none'}`;
}
function srchPlanetLine(ch, n){
  const p = ch.planets[n]; if (!p) return '';
  return `${n} ${SIGNS[p.sign].name} H${p.house}${p.dignity&&p.dignity.status&&p.dignity.status!=='Neutral'?' ('+p.dignity.status+')':''}${p.retrograde?' R':''}${p.combustion?' combust':''}`;
}
function srchVargaPos(ch, vk, name){
  try { const v = ch.vargas[vk]; for (const hh of v.houses){ if (hh.planets.some(x=>x.name===name)) return `${name} ${hh.signName} H${hh.houseNum}`; } } catch(e){} return '';
}
function srchDoshas(ch){
  const pr = ch.planets, L = ch.ascendant.sign, out = [];
  const mh = rsHouseOf(pr.Mars.sign, L); out.push(`Mangal dosha (Mars in H${mh}): ${[1,2,4,7,8,12].indexOf(mh)>-1?'present':'absent'}`);
  const r = pr.Rahu.longitude, k = pr.Ketu.longitude, inArc = lon=> ((lon - r + 360) % 360) < ((k - r + 360) % 360);
  const others = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'], a = others.filter(n=>inArc(pr[n].longitude)).length;
  out.push(`Kala Sarpa: ${a===7||a===0?'present (all planets on one side of Rahu-Ketu)':'absent'}`);
  const sa = pr.Sun.house; out.push(`Pitru dosha hint: Sun with ${['Rahu','Ketu','Saturn'].filter(n=>pr[n].house===sa).join('/')||'no node/Saturn'} in H${sa}; 9th house occupants ${PLANET_LIST.filter(n=>pr[n].house===9).join(',')||'none'}`);
  const sh = pr.Saturn.house; out.push(`Saturn in H${sh}${sh===7||sh===1||sh===4||sh===8||sh===12?' (Shani dosha-type placement)':''}`);
  return out.join('; ');
}
function srchBrief(tp, sub){
  const ch = currentChartForModal; if (!ch) return '';
  const L = ch.ascendant.sign, pr = ch.planets, d = [];
  d.push(`CHART FACTS (sidereal Lahiri, whole-sign, Vimshottari): Lagna ${SIGNS[L].name}; ${srchPlanetLine(ch,'Moon')}; ${srchPlanetLine(ch,'Sun')}.`);
  d.push('HOUSES: ' + tp.h.concat(tp.s.slice(0,2)).map(h=>srchHouseLine(ch,L,h)).join(' | '));
  d.push('KARAKAS: ' + tp.k.map(n=>srchPlanetLine(ch,n)).filter(Boolean).join('; '));
  if (tp.ck && ch.charaKarakas && ch.charaKarakas[tp.ck]){ const n = ch.charaKarakas[tp.ck].planet; d.push(`${tp.ck}: ${srchPlanetLine(ch,n)}${srchVargaPos(ch,'D9',n)?'; D9 '+srchVargaPos(ch,'D9',n):''}`); }
  if (tp.v && tp.v!=='D1' && ch.vargas[tp.v]){
    const vv = ch.vargas[tp.v], lord = SIGNS[vv.ascendantSign].lord, kp = tp.k.map(n=>srchVargaPos(ch,tp.v,n)).filter(Boolean);
    d.push(`${tp.v}: lagna ${SIGNS[vv.ascendantSign].name}, lord ${lord}${srchVargaPos(ch,tp.v,lord)?' ('+srchVargaPos(ch,tp.v,lord).replace(lord+' ','')+')':''}${kp.length?'; '+kp.join(', '):''}`);
  }
  try {
    const ar = calcAllArudhaPadas(ch, L), a = (tp.ar||[]).filter(k=>ar[k]!==undefined).map(k=>`${k} ${SIGNS[ar[k]].name} H${((ar[k]-L+12)%12)+1}`);
    if (a.length) d.push('ARUDHA: ' + a.join(', '));
  } catch(e){}
  try {
    const act = findActiveDasha(ch.dashaData.mahadashas, new Date());
    if (act && act.mahadasha){
      const ds = [['MD',act.mahadasha],['AD',act.antardasha],['PD',act.pratyantardasha]].filter(x=>x[1]).map(([nm,x])=>{
        const lk = rsLinks(x.lord, L, ch), hit = Object.keys(lk).filter(h=> tp.h.indexOf(+h)>-1 || tp.s.indexOf(+h)>-1).map(h=>lk[h]);
        return `${nm} ${x.lord}${hit.length?' ('+hit.join(', ')+')':''}`; });
      d.push(`DASHA NOW: ${ds.join(' / ')}${act.antardasha?` (AD until ${act.antardasha.endDate.toISOString().slice(0,10)})`:''}`);
    }
  } catch(e){}
  try {
    const jd = nowJulianDay(), mo = pr.Moon.sign, T = ['Saturn','Jupiter','Rahu'].map(n=>{ const sg = Math.floor(getSiderealLongitudeAt(n, jd)/30); return `${n} ${SIGNS[sg].name} H${rsHouseOf(sg,L)}(Moon H${rsHouseOf(sg,mo)})`; });
    d.push(`TRANSITS ${new Date().toISOString().slice(0,10)}: ${T.join('; ')}`);
  } catch(e){}
  if (tp.id==='karma' || tp.id==='spouse' || tp.id==='marriagetime') { try { d.push('DOSHA FACTS: ' + srchDoshas(ch)); } catch(e){} }
  const q = sub ? sub[1] : ('Give a quick overview of ' + tp.t.toLowerCase() + ' for me.');
  const head = `Act as an expert Vedic astrologer. TOPIC: ${tp.t}${sub?' › '+sub[0]:''}.\nQUESTION: ${q}\n${SRCH_STYLE}\n`;
  return head + d.join('\n');
}
function srchAsk(tp, sub, copyOnly){
  const text = srchBrief(tp, sub); if (!text){ rsToast('Generate a chart first'); return; }
  try { if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function(){}); } catch(e){}
  if (copyOnly){ rsToast('Full AI brief copied ✓ — paste it into any AI'); return; }
  const cut = text.length > 1900 ? text.slice(0, text.lastIndexOf('\n', 1900)) : text;
  window.open('https://www.google.com/search?q=' + encodeURIComponent(cut) + '&udm=50', '_blank', 'noopener');
  rsToast('Opening Google AI · full brief also copied 📋');
}
function srchTopicBox(i){
  const tp = SRCH_TOPICS[i], list = document.getElementById('srchList'); if (!tp || !list) return;
  srchRows = tp.subs.map(sb=>({k:'ask',ico:tp.ico,t:sb[0],s:sb[1],tp,sub:sb,q:tp.t}));
  list.innerHTML = `<div class="srch-box2"><button type="button" class="srch-back" data-back="1">← All topics</button><div class="srch-h2">${tp.ico} ${rsEsc(tp.t)} <span class="srch-sub">pick a question · opens Google AI</span></div></div>` + srchRows.map((r,j)=> srchRowHTML(r,j)).join('') +
    `<div class="srch-row" data-i="${srchRows.length}" data-k="ask"><span class="srch-ico">✨</span><div class="srch-txt"><b>Quick overview</b><small>One short summary of ${rsEsc(tp.t.toLowerCase())}</small></div><span class="srch-tag">Ask AI</span></div>`;
  srchRows.push({k:'ask',ico:'✨',t:'Quick overview',s:'',tp,sub:null,q:tp.t});
  srchSel = 0; const f = list.querySelector('.srch-row'); if (f) f.classList.add('sel');
}

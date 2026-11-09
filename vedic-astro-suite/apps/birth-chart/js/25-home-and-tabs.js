/* ============================================================================
   APP TAB SWITCHING
   ============================================================================ */

/* [panelId, icon, title, description, section, bar-group] */
const HOME_ITEMS=[
 ['panel-reading','📖','Chart Reading','Plain-language reading, life areas & timing','Your Chart','chart'],
 ['panel-problem','🧭','Problem Finder','Pick a life problem; see the chart reasons','Your Chart','chart'],
 ['panel-overview','◈','Overview','Birth chart & key details','Your Chart','chart'],
 ['panel-avakahada','🪪','Avakahada Chakra','The standard kundli table: varna, yoni, gana, nadi, paya, name sounds','Your Chart','chart'],
 ['panel-planets','☉','Planets','Positions & aspects of every planet','Your Chart','chart'],
 ['panel-bhava','⌂','Bhava Chalit','Sripati house cusps & shifted planets','Your Chart','chart'],
 ['panel-vargas','◫','Divisional Charts','D1 to D144 chart viewer','Your Chart','chart'],
 ['panel-lagnas','✧','Special Lagnas','23 alternate ascendants','Your Chart','chart'],
 ['panel-rectification','🎯','Rectification Studio','Dial, scan & confirm the time','Fix Birth Time','rectify'],
 ['panel-datefinder','🔎','Date Finder','Find the birth date from festival, tithi & day clues','Fix Birth Time','rectify'],
 ['panel-sandhi','⏱','Sandhi Table','Ascendant window across all charts','Fix Birth Time','rectify'],
 ['panel-vargatimeline','🗺️','Varga Timeline','Map the birth window on any chart','Fix Birth Time','rectify'],
 ['panel-transittimer','⏳','Transit Timer','When a planet changes house','Fix Birth Time','rectify'],
 ['panel-lifeevents','🌟','Life-Event Checker','Confirm the time with real events','Fix Birth Time','rectify'],
 ['panel-today','🌅','Today for You','Your day from your own Moon: Chandrabala, Tarabala, planets & good slots','Time & Cycles','home'],
 ['panel-prashna','🔮','Prashna Chart','Cast a chart for the moment you ask a question and read the signs','Time & Cycles','home'],
 ['panel-triggerlab','⚡','Trigger Lab','Pick the Dasha pattern and your transit rules; see when they meet and which houses they activate','Analysis','home'],
 ['panel-meaninglab','🧩','Meaning Lab','Mix any planets, houses, signs and lords; read each raw meaning side by side and write your own','Analysis','home'],
 ['panel-avasthas','🌓','Planet States','Avasthas: each planet\'s age, alertness and mood, and how freely it can give results','Analysis','home'],
 ['panel-vimshopaka','⚖️','Vimshopaka Bala','Strength out of 20 for each planet from its divisional charts','Analysis','home'],
 ['panel-upagrahas','🌑','Upagrahas','Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu and Gulika: where each shadow point falls','Analysis','home'],
 ['panel-sensitive','✨','Sensitive Degrees','Gandanta, Mrityu Bhaga and Pushkara: which of your planets sit on a marked degree','Analysis','home'],
 ['panel-sudarshana','☸️','Sudarshana Chakra','Lagna, Moon and Sun views together: what each year of life lights up','Time & Cycles','home'],
 ['panel-argala','🧲','Argala','Which planets press on each house and which obstruct them (Jaimini)','Analysis','home'],
 ['panel-bhavat','🪞','House from the House','Bhavat Bhavam and all twelve Arudha Padas: a second reading of each house','Analysis','home'],
 ['panel-asx','🧮','Ashtakavarga Workings','Prastara tables and the working behind the Ashtakavarga numbers','Analysis','home'],
 ['panel-synastry','🤝','Synastry','Two charts side by side: planets in each other\'s houses, contacts and the two Moons','Analysis','home'],
 ['panel-kp','🧭','KP System','Cusps, star and sub lords, significators, event promise, ruling planets','Analysis','home'],
 ['panel-chakra','🔱','Chakra Explorer','Sarvatobhadra, Kota and Shoola charts: what today\'s planets touch in your chart','Time & Cycles','home'],
 ['panel-choghadiya','🕰️','Choghadiya','Good and bad time slots for the day and night','Time & Cycles','home'],
 ['panel-panchanga','🌙','Panchanga','Tithi, nakshatra, yoga, karana & day timings','Time & Cycles','home'],
 ['panel-vbday','🎂','Vedic Birthday','Tithi, Nakshatra & solar birthday for any year','Time & Cycles','home'],
 ['panel-active','🔥','Life Activation','Houses lit up now · pick any date','Time & Cycles','home'],
 ['panel-yeartimeline','🗓️','Year Timeline File','Pick two dates: planet moves, transits & dashas as one file for AI','Time & Cycles','home'],
 ['panel-dasha','◷','Dasha','120-year life-period timeline','Time & Cycles','home'],
 ['panel-dashasys','🎡','36 Dasha Systems','Vimshottari, Yogini, Chara, Narayana & more','Time & Cycles','home'],
 ['panel-tithi','🪔','Tithi Pravesh','Your yearly lunar-birthday chart','Time & Cycles','home'],
 ['panel-transits','♄','Transits & Sade Sati','Saturn, Jupiter & node ingress dates','Time & Cycles','home'],
 ['panel-transit','⟲','Live Sky','Today\'s planets vs your chart','Time & Cycles','home'],
 ['panel-atlas','🧭','Astro Atlas','The basics in one place: day lords, signs, body parts, houses, 27 nakshatras, tithi, dasha, friends and rules','Analysis','home'],
 ['panel-planetency','📚','Planet Encyclopedia','Every planet in full: nature, aspects, exalted & debilitated, friends & foes','Analysis','home'],
 ['panel-numerology','🔢','Numerology','Name number & birth-date numbers with meanings','Analysis','home'],
 ['panel-dosha','🧿','Dosha Check','Manglik, Kaal Sarp, Pitru, Gand Mool & more: the reason and what softens it','Analysis','home'],
 ['panel-yogas','✦','Yogas','Notable planet combinations','Analysis','home'],
 ['panel-shadbala','⚖','Shadbala','Planet strength','Analysis','home'],
 ['panel-bhavabala','🏠','Bhava Bala','House strength — which life areas are strong','Analysis','home'],
 ['panel-fate','🌡️','Fate Meter','How much is written vs in your control','Analysis','home'],
 ['panel-sahams','⭐','Sahams','36 sensitive points with readings','Analysis','home'],
 ['panel-ashtakavarga','▦','Ashtakavarga','Point-strength system','Analysis','home'],
 ['panel-relationships','⚯','Relationships','Conjunctions & aspects','Analysis','home'],
 ['panel-match','💞','Kundali Matching','Ashtakoota 36-point match & Manglik check','Compatibility','match'],
 ['panel-export','📤','Export & Share','Download a file or copy your full report','Export & Help','export'],
 ['panel-contact','💬','Contact Developer','Bugs, ideas or astrology chat','Export & Help','export']];
const HOME_SEC_COL={'Your Chart':'#D4AF37','Fix Birth Time':'#5EC4B7','Time & Cycles':'#8A6FB8','Analysis':'#6B7FA3','Compatibility':'#D96C9B','Export & Help':'#C95050'};
function homeAskHtml(){
  if(typeof SRCH_GROUPS==='undefined'||typeof SRCH_TOPICS==='undefined') return '';
  const col=['#5EC4B7','#D96C9B','#E0A64A','#8A6FB8'];
  const grp=SRCH_GROUPS.map((g,gi)=>{const t=g[2].map(id=>SRCH_TOPICS.findIndex(x=>x.id===id)).filter(i=>i>=0);
    return `<section class="hm-sec hm-ask-sec" hidden data-sec="ask" style="--sc:${col[gi%4]}"><h3 class="hm-h"><i></i>${g[0]} ${g[1]}<em>${t.length}</em></h3><div class="hm-grid">${t.map(i=>`<button type="button" class="hm-c" data-askt="${i}"><span class="hm-ci">${SRCH_TOPICS[i].ico}</span><span class="hm-ct"><b>${escapeHtml(SRCH_TOPICS[i].t)}</b><small>${SRCH_TOPICS[i].subs.length} ready questions</small></span></button>`).join('')}</div></section>`;}).join('');
  const tool=`<section class="hm-sec hm-ask-sec" hidden data-sec="ask" style="--sc:#D4AF37"><h3 class="hm-h"><i></i>Search tools<em>1</em></h3><div class="hm-grid"><button type="button" class="hm-c" data-qstoggle="1"><span class="hm-ci">🔍</span><span class="hm-ct"><b>Tap-to-search</b><small>Tap any placement in a chart to look it up</small></span></button></div></section>`;
  return `<p class="hm-ask-note hm-ask-sec" data-sec="ask" hidden>Pick a topic and a question. Google AI opens with your exact chart details.</p>`+tool+grp;
}
function hmChartSvg(ch,style){
  const prev=window.__vgC; window.__vgC=ch;
  try{ const v=ch.vargas.D1; return style==='south'?buildSouthIndianSvg(v,null):buildNorthIndianSvg(v,null); }catch(e){ console.warn('home chart',e); return ''; }
  finally{ window.__vgC=prev; }
}
function hmBasics(ch,pr){
  if(typeof AVK==='undefined') return '';
  try{
    const d=AVK.compute(ch,pr), by={}; d.rows.forEach(r=>by[r.k]=r.v);
    const su=ch.planets.Sun, sg=SIGNS[su.sign];
    const order=[['Rising sign (Lagna)','Lagna'],['Moon sign (Rashi)','Rashi'],['Birth star (Nakshatra)','Nakshatra'],['Star lord','Nakshatra lord'],['Tithi','Tithi'],['Yoga','Yoga'],['Karana','Karana'],['Weekday (Vara)','Vara'],['__sun','Sun sign'],['Gana','Gana'],['Nadi','Nadi'],['Yoni','Yoni'],['Name sound','Name sound']];
    const cells=order.map(o=>{const v=o[0]==='__sun'?sg.symbol+' '+sg.name:by[o[0]]; return v?`<div class="hm-bs"><small>${o[1]}</small><b>${String(v).split('  (')[0]}</b></div>`:'';}).join('');
    return `<section class="hm-chart-only hm-basics"><h3 class="hm-h">Birth basics<button type="button" class="hm-more" data-go="panel-avakahada">Full table ›</button></h3><div class="hm-bgrid">${cells}</div></section>`;
  }catch(e){console.warn('home basics',e);return '';}
}
function buildHomePanel(name){
  window.__hmPage='chart';
  const secs=[...new Set(HOME_ITEMS.map(i=>i[4]))], PL=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  const pr=window.__vgProf||{}, ch=(typeof currentChartForModal!=='undefined')?currentChartForModal:null;
  const fd=d=>{try{return new Date(d+'T00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return d||'';}};
  const pct=(s,e)=>Math.max(0,Math.min(100,(Date.now()-s)/(e-s)*100));
  let h=`<div class="app-panel" id="panel-home"><div class="home-wrap hm" data-page="chart">`, top='';
  try{
    const asc=SIGNS[ch.ascendant.sign],mo=ch.planets.Moon,su=ch.planets.Sun,nk=mo.nakshatra,act=findActiveDasha(ch.dashaData.mahadashas,new Date());
    const big=(l,s,sub)=>`<button type="button" class="hm-b" data-go="panel-overview"><small>${l}</small><b>${s.symbol} ${s.name}</b><span>${sub}</span></button>`;
    const hmStyle=(function(){try{return localStorage.getItem('vax_hm_style')==='south'?'south':'north';}catch(e){return 'north';}})();
    const det=[pr.dob?'🗓 '+fd(pr.dob):'',pr.tob?'🕒 '+pr.tob.slice(0,5):'',pr.place?'📍 '+escapeHtml(String(pr.place).split(',')[0]):''].filter(Boolean).join('  ·  ');
    top+=`<section class="hm-hero hm-chart-only"><div class="hm-top"><div class="hm-av">${escapeHtml((name||'✦').trim().charAt(0).toUpperCase()||'✦')}</div><div class="hm-id"><small>Namaste 🙏 · your birth chart</small><h2>${escapeHtml(name||'Your chart')}</h2>${det?`<button type="button" class="hm-dt" data-hmdt="1" aria-expanded="false">Birth details ▾</button><p class="hm-det" hidden>${det}</p>`:''}</div><button type="button" class="hm-3d" data-3d="1">🌌 3D Sky</button></div>
      <div class="hm-cs" role="group" aria-label="Chart style"><button type="button" data-hmst="north" class="${hmStyle==='north'?'on':''}">North Indian</button><button type="button" data-hmst="south" class="${hmStyle==='south'?'on':''}">South Indian</button></div>
      <button type="button" class="hm-svg" id="hmSvg" data-go="panel-vargas" aria-label="Open your chart and divisional charts">${hmChartSvg(ch,hmStyle)}</button>
      <div class="hm-svg-cap">Tap the chart for all 24 divisional charts</div>
</section>`;
    top+=hmBasics(ch,pr);
    if(act&&act.antardasha){const m=act.mahadasha,ad=act.antardasha;
      top+=`<button type="button" class="hm-now hm-chart-only" data-go="panel-dasha"><div class="hm-now-h"><span>⏳ Running now</span><em>Open timeline ›</em></div><div class="hm-now-t">${PLANET_GLYPHS[m.lord]} ${m.lord} <i>›</i> ${PLANET_GLYPHS[ad.lord]} ${ad.lord}</div>
        <div class="hm-pb"><label>${m.lord} Mahadasha<small>until ${formatDashaDate(m.endDate)}</small></label><i><u style="width:${pct(m.startDate,m.endDate)}%"></u></i></div>
        <div class="hm-pb"><label>${ad.lord} Antardasha<small>until ${formatDashaDate(ad.endDate)}</small></label><i><u style="width:${pct(ad.startDate,ad.endDate)}%"></u></i></div></button>`;}
    top+=`<section class="hm-chart-only"><h3 class="hm-h">Your planets</h3><div class="hm-strip">${PL.map(n=>{const p=ch.planets[n],s=SIGNS[p.sign];return `<button type="button" class="hm-pl" data-go="panel-overview"><span>${PLANET_GLYPHS[n]}</span><b>${n}${p.retrograde?' ℞':''}</b><small>${s.symbol} ${s.name}</small><em>${Math.floor(p.degInSign)}° · H${p.house}</em></button>`}).join('')}</div></section>`;
    top+=`<button type="button" class="hm-cta hm-chart-only" data-hmpage="tools"><span class="hm-cta-i">🧭</span><span class="hm-cta-t"><b>Explore all tools</b><small>${HOME_ITEMS.length} tools · timing, strengths, yogas, matching, ask AI</small></span><i>›</i></button>`;
  }catch(e){top=`<section class="hm-hero"><div class="hm-id"><small>Namaste 🙏</small><h2>${escapeHtml(name||'Your chart')}</h2><p>Your chart is ready. Pick what you want to explore.</p></div></section>`;}
  const segs=[['all','All','#D4AF37']].concat(secs.map(x=>[x,x,HOME_SEC_COL[x]||'#D4AF37'])).concat([['ask','Ask AI','#5EC4B7']]);
  h+=top+`<div class="hm-tp"><button type="button" data-hmpage="chart">‹ Your chart</button><b>All tools</b><span>${HOME_ITEMS.length}</span></div><div class="hm-seg" id="hmSeg" role="tablist">${segs.map((x,i)=>`<button type="button" role="tab" data-seg="${x[0]}" style="--sc:${x[2]}" class="${i?'':'on'}"><i></i>${x[1]}</button>`).join('')}</div>`;
  const pref=['panel-reading','panel-active','panel-overview','panel-dasha','panel-vargas','panel-lagnas','panel-yogas','panel-shadbala'];
  const feat=pref.map(id=>HOME_ITEMS.find(i=>i[0]===id)).filter(Boolean).concat(HOME_ITEMS).filter((v,i,a)=>a.indexOf(v)===i).slice(0,4);
  h+=`<section class="hm-qs" data-sec="all"><h3 class="hm-h">Quick start</h3><div class="hm-feat">${feat.map(i=>`<button type="button" class="hm-f" style="--sc:${HOME_SEC_COL[i[4]]||'#D4AF37'}" data-go="${i[0]}"><span>${i[1]}</span><b>${i[2]}</b><small>${i[4]}</small></button>`).join('')}</div></section><div id="hmSecs">`;
  secs.forEach(s=>{const its=HOME_ITEMS.filter(i=>i[4]===s);
    h+=`<section class="hm-sec" data-sec="${s}" style="--sc:${HOME_SEC_COL[s]||'#D4AF37'}"><h3 class="hm-h"><i></i>${s}<em>${its.length}</em></h3><div class="hm-grid">${its.map(i=>`<button type="button" class="hm-c" data-go="${i[0]}"><span class="hm-ci">${i[1]}</span><span class="hm-ct"><b>${i[2]}</b><small>${i[3]}</small></span><span class="hm-ar">›</span></button>`).join('')}</div></section>`;});
  h+=homeAskHtml()+`</div></div></div><div class="panel-back" id="panelBack" style="display:none"><button type="button" data-go="panel-home">← Home</button><span></span></div>`;
  const r=document.getElementById('results');
  r.insertAdjacentHTML('afterbegin',h);
  const bk=document.getElementById('panelBack'); const home=document.getElementById('panel-home');
  home.after(bk);
  r.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>switchAppTab(b.dataset.go)));
  const seg=document.getElementById('hmSeg');
  seg.addEventListener('click',e=>{const b=e.target.closest('[data-seg]');if(!b)return;const k=b.dataset.seg;
    seg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
    home.querySelectorAll('.hm-sec,.hm-qs,.hm-ask-sec').forEach(sec=>{const d=sec.dataset.sec;sec.hidden=!(k==='all'?d!=='ask':d===k);});});
  home.addEventListener('click',e=>{
    const pg=e.target.closest('[data-hmpage]'); if(pg){const w=home.querySelector('.hm'); window.__hmPage=pg.dataset.hmpage; w.dataset.page=window.__hmPage; window.scrollTo(0,0); return;}
    const dt=e.target.closest('[data-hmdt]'); if(dt){const p=home.querySelector('.hm-det'); if(p){p.hidden=!p.hidden; dt.setAttribute('aria-expanded',String(!p.hidden)); dt.textContent=p.hidden?'Birth details ▾':'Hide details ▴';} return;}
    const st=e.target.closest('[data-hmst]'); if(st){try{localStorage.setItem('vax_hm_style',st.dataset.hmst);}catch(x){} home.querySelectorAll('[data-hmst]').forEach(x=>x.classList.toggle('on',x===st)); const sv=document.getElementById('hmSvg'); if(sv&&ch)sv.innerHTML=hmChartSvg(ch,st.dataset.hmst); e.stopPropagation(); return;}
  },true);
  home.addEventListener('click',e=>{const a=e.target.closest('[data-askt]');if(a&&typeof srchOpen==='function'){srchOpen();if(typeof srchTopicBox==='function')srchTopicBox(+a.dataset.askt);return;}
    if(e.target.closest('[data-qstoggle]')){const t=document.getElementById('qsearchToggle');if(t){t.click();e.target.closest('[data-qstoggle]').classList.toggle('on',typeof qsearchActive!=='undefined'&&qsearchActive);}}});
}

document.getElementById('hdrBack').addEventListener('click',()=>switchAppTab('panel-home'));
new MutationObserver(()=>{
  const on=document.getElementById('results').classList.contains('show');
  document.body.classList.toggle('app-mode',on);
  if(!on){document.body.classList.remove('on-sub');const h=document.querySelector('.brand-text h1');if(h&&h.dataset.orig)h.textContent=h.dataset.orig;}
}).observe(document.getElementById('results'),{attributes:true,attributeFilter:['class']});
function switchAppTab(panelId){
  if (panelId==='panel-export'){ openExportModal(); return; }
  if (panelId==='panel-contact'){ document.getElementById('contactModal').classList.add('show'); return; }
  document.querySelectorAll('.app-panel').forEach(p=> p.classList.remove('active'));
  document.querySelectorAll('.app-tab').forEach(t=> t.classList.remove('active'));
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
  const grp = (HOME_ITEMS.find(i=>i[0]===panelId)||[])[5] || 'home';
  const barBtn = document.querySelector(`.app-tab[data-group="${panelId==='panel-home'?'home':grp}"]`) || document.querySelector('.app-tab[data-group="home"]');
  if (barBtn) barBtn.classList.add('active');
  const it0 = HOME_ITEMS.find(i=>i[0]===panelId);
  const h1 = document.querySelector('.brand-text h1');
  if (h1){ if(!h1.dataset.orig) h1.dataset.orig=h1.textContent; if(document.body.classList.contains('app-mode')) h1.textContent = it0 ? it0[2] : 'Home'; }
  document.body.classList.toggle('on-sub', panelId!=='panel-home');
  document.body.classList.toggle('rs-open', panelId==='panel-rectification');
  const back = document.getElementById('panelBack');
  if (back){
    back.style.display = panelId==='panel-home' ? 'none' : 'flex';
    const it = HOME_ITEMS.find(i=>i[0]===panelId);
    if (it) back.querySelector('span').textContent = it[2];
  }
  window.scrollTo({ top:0, behavior:'instant' in window ? 'instant' : 'auto' });
  if (panelId==='panel-vbday' && typeof vbLazyRender==='function') vbLazyRender();   // heavy panel: built on first open
  if (panelId==='panel-tithi' && typeof window.tpRenderPending==='function') window.tpRenderPending();
}
document.querySelectorAll('.app-tab').forEach(tab=>{
  tab.addEventListener('click', ()=> switchAppTab(tab.dataset.panel));
});


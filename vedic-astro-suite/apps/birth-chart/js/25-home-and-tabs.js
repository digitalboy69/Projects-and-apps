/* ============================================================================
   APP TAB SWITCHING
   ============================================================================ */

/* [panelId, icon, title, description, section, bar-group] */
const HOME_ITEMS=[
 ['panel-reading','📖','Chart Reading','Plain-language reading, life areas & timing','Your Chart','chart'],
 ['panel-overview','◈','Overview','Birth chart & key details','Your Chart','chart'],
 ['panel-planets','☉','Planets','Positions & aspects of every planet','Your Chart','chart'],
 ['panel-bhava','⌂','Bhava Chalit','Sripati house cusps & shifted planets','Your Chart','chart'],
 ['panel-vargas','◫','Divisional Charts','D1 to D60 chart viewer','Your Chart','chart'],
 ['panel-lagnas','✧','Special Lagnas','23 alternate ascendants','Your Chart','chart'],
 ['panel-rectification','🎯','Rectification Studio','Dial, scan & confirm the time','Fix Birth Time','rectify'],
 ['panel-datefinder','🔎','Date Finder','Find the birth date from festival, tithi & day clues','Fix Birth Time','rectify'],
 ['panel-sandhi','⏱','Sandhi Table','Ascendant window across all charts','Fix Birth Time','rectify'],
 ['panel-vargatimeline','🗺️','Varga Timeline','Map the birth window on any chart','Fix Birth Time','rectify'],
 ['panel-transittimer','⏳','Transit Timer','When a planet changes house','Fix Birth Time','rectify'],
 ['panel-lifeevents','🌟','Life-Event Checker','Confirm the time with real events','Fix Birth Time','rectify'],
 ['panel-panchanga','🌙','Panchanga','Tithi, nakshatra, yoga, karana & day timings','Time & Cycles','home'],
 ['panel-vbday','🎂','Vedic Birthday','Tithi, Nakshatra & solar birthday for any year','Time & Cycles','home'],
 ['panel-active','🔥','Life Activation','Houses lit up now · pick any date','Time & Cycles','home'],
 ['panel-dasha','◷','Dasha','120-year life-period timeline','Time & Cycles','home'],
 ['panel-dashasys','◷','36 Dasha Systems','Vimshottari, Yogini, Chara, Narayana & more','Time & Cycles','home'],
 ['panel-tithi','🪔','Tithi Pravesh','Your yearly lunar-birthday chart','Time & Cycles','home'],
 ['panel-transits','♄','Transits & Sade Sati','Saturn, Jupiter & node ingress dates','Time & Cycles','home'],
 ['panel-transit','⟲','Live Sky','Today\'s planets vs your chart','Time & Cycles','home'],
 ['panel-numerology','🔢','Numerology','Name number & birth-date numbers with meanings','Analysis','home'],
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
function buildHomePanel(name){
  const secs=[...new Set(HOME_ITEMS.map(i=>i[4]))], PL=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  const pr=window.__vgProf||{}, ch=(typeof currentChartForModal!=='undefined')?currentChartForModal:null;
  const fd=d=>{try{return new Date(d+'T00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return d||'';}};
  const pct=(s,e)=>Math.max(0,Math.min(100,(Date.now()-s)/(e-s)*100));
  let h=`<div class="app-panel" id="panel-home"><div class="home-wrap hm">`, top='';
  try{
    const asc=SIGNS[ch.ascendant.sign],mo=ch.planets.Moon,su=ch.planets.Sun,nk=mo.nakshatra,act=findActiveDasha(ch.dashaData.mahadashas,new Date());
    const big=(l,s,sub)=>`<button type="button" class="hm-b" data-go="panel-overview"><small>${l}</small><b>${s.symbol} ${s.name}</b><span>${sub}</span></button>`;
    top+=`<section class="hm-hero"><div class="hm-top"><div class="hm-av">${escapeHtml((name||'✦').trim().charAt(0).toUpperCase()||'✦')}</div><div class="hm-id"><small>Namaste 🙏</small><h2>${escapeHtml(name||'Your chart')}</h2><p>${pr.dob?'🗓 '+fd(pr.dob):''}${pr.tob?' · 🕒 '+pr.tob.slice(0,5):''}${pr.place?' · 📍 '+escapeHtml(String(pr.place).split(',')[0]):''}</p></div></div>
      <div class="hm-big">${big('Rising',asc,asc.sk)}${big('Moon',SIGNS[mo.sign],nk.name+' · pada '+nk.pada)}${big('Sun',SIGNS[su.sign],su.nakshatra?su.nakshatra.name:SIGNS[su.sign].sk)}</div></section>`;
    if(act&&act.antardasha){const m=act.mahadasha,ad=act.antardasha;
      top+=`<button type="button" class="hm-now" data-go="panel-dasha"><div class="hm-now-h"><span>⏳ Running now</span><em>Open timeline ›</em></div><div class="hm-now-t">${PLANET_GLYPHS[m.lord]} ${m.lord} <i>›</i> ${PLANET_GLYPHS[ad.lord]} ${ad.lord}</div>
        <div class="hm-pb"><label>${m.lord} Mahadasha<small>until ${formatDashaDate(m.endDate)}</small></label><i><u style="width:${pct(m.startDate,m.endDate)}%"></u></i></div>
        <div class="hm-pb"><label>${ad.lord} Antardasha<small>until ${formatDashaDate(ad.endDate)}</small></label><i><u style="width:${pct(ad.startDate,ad.endDate)}%"></u></i></div></button>`;}
    top+=`<section><h3 class="hm-h">Your planets</h3><div class="hm-strip">${PL.map(n=>{const p=ch.planets[n],s=SIGNS[p.sign];return `<button type="button" class="hm-pl" data-go="panel-overview"><span>${PLANET_GLYPHS[n]}</span><b>${n}${p.retrograde?' ℞':''}</b><small>${s.symbol} ${s.name}</small><em>${Math.floor(p.degInSign)}° · H${p.house}</em></button>`}).join('')}</div></section>`;
  }catch(e){top=`<section class="hm-hero"><div class="hm-id"><small>Namaste 🙏</small><h2>${escapeHtml(name||'Your chart')}</h2><p>Your chart is ready. Pick what you want to explore.</p></div></section>`;}
  h+=top+`<div class="hm-search"><span>🔎</span><input id="hmQ" type="search" placeholder="Search tools — dasha, yoga, match…" autocomplete="off"></div>`;
  const pref=['panel-reading','panel-active','panel-overview','panel-dasha','panel-vargas','panel-lagnas','panel-yogas','panel-shadbala'];
  const feat=pref.map(id=>HOME_ITEMS.find(i=>i[0]===id)).filter(Boolean).concat(HOME_ITEMS).filter((v,i,a)=>a.indexOf(v)===i).slice(0,4);
  h+=`<section><h3 class="hm-h">Quick start</h3><div class="hm-feat">${feat.map(i=>`<button type="button" class="hm-f" style="--sc:${HOME_SEC_COL[i[4]]||'#D4AF37'}" data-go="${i[0]}"><span>${i[1]}</span><b>${i[2]}</b><small>${i[4]}</small></button>`).join('')}</div></section><div id="hmSecs">`;
  secs.forEach(s=>{const its=HOME_ITEMS.filter(i=>i[4]===s);
    h+=`<section class="hm-sec" style="--sc:${HOME_SEC_COL[s]||'#D4AF37'}"><h3 class="hm-h"><i></i>${s}<em>${its.length}</em></h3><div class="hm-grid">${its.map(i=>`<button type="button" class="hm-c" data-go="${i[0]}"><span class="hm-ci">${i[1]}</span><span class="hm-ct"><b>${i[2]}</b><small>${i[3]}</small></span><span class="hm-ar">›</span></button>`).join('')}</div></section>`;});
  h+=`</div><p class="hm-none" id="hmNone" hidden>No tool matches that search.</p></div></div><div class="panel-back" id="panelBack" style="display:none"><button type="button" data-go="panel-home">← Home</button><span></span></div>`;
  const r=document.getElementById('results');
  r.insertAdjacentHTML('afterbegin',h);
  const bk=document.getElementById('panelBack'); const home=document.getElementById('panel-home');
  home.after(bk);
  r.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>switchAppTab(b.dataset.go)));
  const q=document.getElementById('hmQ'); q.addEventListener('input',()=>{const t=q.value.trim().toLowerCase();let any=false;
    home.querySelectorAll('.hm-sec').forEach(s=>{let n=0;s.querySelectorAll('.hm-c').forEach(c=>{const ok=!t||c.textContent.toLowerCase().includes(t);c.hidden=!ok;if(ok)n++;});s.hidden=!n;if(n)any=true;});document.getElementById('hmNone').hidden=any;});
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
  const back = document.getElementById('panelBack');
  if (back){
    back.style.display = panelId==='panel-home' ? 'none' : 'flex';
    const it = HOME_ITEMS.find(i=>i[0]===panelId);
    if (it) back.querySelector('span').textContent = it[2];
  }
  window.scrollTo({ top:0, behavior:'instant' in window ? 'instant' : 'auto' });
}
document.querySelectorAll('.app-tab').forEach(tab=>{
  tab.addEventListener('click', ()=> switchAppTab(tab.dataset.panel));
});


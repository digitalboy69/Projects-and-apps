
(function(){
const AREA={D1:['🧍','Self · Body'],D2:['💰','Wealth'],D3:['🦁','Siblings · Courage'],D4:['🏡','Home · Fortune'],D5:['👑','Fame · Power'],D6:['🩺','Health · Foes'],D7:['👶','Children'],D8:['⏳','Longevity'],D9:['💍','Marriage · Dharma'],D10:['💼','Career'],D11:['📈','Gains'],D12:['🌳','Parents'],D16:['🚗','Comforts'],D20:['🕉️','Spiritual'],D24:['🎓','Learning'],D27:['💪','Strength'],D30:['⚡','Troubles'],D40:['🌙','Maternal line'],D45:['☀️','Paternal line'],D60:['🌀','Past karma'],RTN:['💞','Rasi × Navamsa'],D81:['🔍','Fine dharma'],D108:['📿','Deep karma'],D144:['🧬','Heredity']};
const P=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const KEND=[1,4,7,10],TRI=[1,5,9],DUS=[6,8,12],UPA=[3,6,10,11];
const f=(x,d)=>(typeof x==='number'&&isFinite(x))?x.toFixed(d):'—';
const dms=d=>{const t=Math.round(d*3600);return Math.floor(t/3600)+'°'+String(Math.floor(t%3600/60)).padStart(2,'0')+'′'+String(t%60).padStart(2,'0')+'″'};
const dc=s=>/Exalt|Own|Moola/i.test(s||'')?'g':/Debil|Enemy/i.test(s||'')?'b':'';
const ord=n=>n+(['th','st','nd','rd'][(n%100>10&&n%100<14)?0:Math.min(n%10,4)%4]||'th');
let tab=0;
const _b=window.buildTransitsPanel; if(typeof _b==='function') window.buildTransitsPanel=function(c){window.__vgC=c;return _b.apply(this,arguments);};
function model(c,k,v0){const v=v0||c.vargas[k],m=VARGAS[k],asc=v.ascendantSign,hs=v.houses;
  const rows=P.map(n=>{const p=c.planets[n],s=v.planetVargaSign[n],h=((s-asc+12)%12)+1,hp=hs[h-1].planets.find(x=>x.name===n)||{};
    const sb=c.shadbala&&c.shadbala.planets&&c.shadbala.planets[n];
    return {n,p,s,h,dig:hp.dignity||{status:'',label:''},vg:s===p.sign,part:Math.min(m.n,Math.floor(p.degInSign/(30/m.n))+1),sb,sg:SIGNS[s],ret:p.retrograde,own:hs.filter(x=>x.signLord===n).map(x=>x.houseNum)};});
  return {c,k,v,m,asc,hs,rows,cu:!!v0};}
const chips=(a,cl)=>a.length?a.map(x=>`<span class="vx-chip ${cl||''}">${x}</span>`).join(''):'<span class="vx-chip">None</span>';
const g=n=>`${PLANET_GLYPHS[n]} ${n}`;
function overview(M){const {rows,hs,asc,m,k,c}=M,sg=SIGNS[asc],ll=rows.find(r=>r.n===sg.lord),a1=c.vargas.D1.ascendantSign,isD1=k==='D1'&&!M.cu;
  const tag=h=>KEND.includes(h)?['K','Kendra']:TRI.includes(h)?['T','Trikona']:DUS.includes(h)?['D','Dusthana']:UPA.includes(h)?['U','Upachaya']:['','Neutral'];
  const cls=h=>KEND.includes(h)?'k':TRI.includes(h)?'t':DUS.includes(h)?'d':'';
  const emp=hs.filter(h=>h.isEmpty).map(h=>h.houseNum),ex=rows.filter(r=>/Exalt/i.test(r.dig.status)),ow=rows.filter(r=>/Own|Moola/i.test(r.dig.status)),de=rows.filter(r=>/Debil/i.test(r.dig.status)),vg=rows.filter(r=>r.vg);
  const groups={};rows.forEach(r=>(groups[r.s]=groups[r.s]||[]).push(r.n));
  const conj=Object.keys(groups).filter(s=>groups[s].length>1).map(s=>`<span class="gl-cj">${SIGNS[s].symbol}︎ ${SIGNS[s].name}<b>${groups[s].map(n=>PLANET_GLYPHS[n]).join(' ')}</b></span>`);
  const inH=a=>rows.filter(r=>a.includes(r.h)).length;
  const stack=(keys,f,cols)=>{const tot=rows.length;return `<div class="gl-stack">${keys.map((x,i)=>{const n=rows.filter(r=>f(r)===x).length;return n?`<i style="flex:${n};background:${cols[i]}" title="${x}: ${n}"><b>${n}</b></i>`:''}).join('')}</div><div class="gl-lg">${keys.map((x,i)=>`<span><u style="background:${cols[i]}"></u>${x} ${rows.filter(r=>f(r)===x).length}</span>`).join('')}</div>`;};
  const notes=[];
  if(ex.length)notes.push(['g','⭐',`Exalted: ${ex.map(r=>g(r.n)+' (H'+r.h+')').join(', ')}`]);
  if(ow.length)notes.push(['g','🏠',`Own sign: ${ow.map(r=>g(r.n)+' (H'+r.h+')').join(', ')}`]);
  if(de.length)notes.push(['b','⚠️',`Debilitated: ${de.map(r=>g(r.n)+' (H'+r.h+')').join(', ')} — needs support`]);
  if(vg.length&&!isD1)notes.push(['g','🔱',`Vargottama: ${vg.map(r=>g(r.n)).join(', ')} — same sign as D1, strengthened`]);
  notes.push(['','🧭',`Lagna lord ${g(sg.lord)} sits in the ${ord(ll.h)} house (${ll.sg.name}) — ${tag(ll.h)[1]}${KEND.includes(ll.h)?', supportive':TRI.includes(ll.h)?', fortunate':DUS.includes(ll.h)?', brings challenge and growth':''}`]);
  const row=r=>{const p=r.p,t=tag(r.h),st=(r.dig.label||r.dig.status||'').replace(/ \(.*\)/,'').replace(/ sign$/i,'');
    return `<div class="gl-r ${cls(r.h)}"><span class="gl-p"><i>${PLANET_GLYPHS[r.n]}</i><b>${r.n}</b>${r.ret?'<em title="Retrograde">℞</em>':''}</span>
     <span class="gl-s">${r.sg.symbol}︎ ${r.sg.name}</span><span class="gl-h"><b>${r.h}</b>${t[0]?`<small title="${t[1]}">${t[0]}</small>`:''}</span>
     ${isD1?'':`<span class="gl-d1${r.vg?' same':''}">${r.vg?'★ same':SIGNS[p.sign].symbol+'︎ '+SIGNS[p.sign].name}</span>`}
     <span class="gl-st">${st&&st!=='Neutral'?`<span class="vx-chip ${dc(r.dig.status)}">${st}</span>`:'<small>—</small>'}${p.combustion&&p.combustion.combust?'<span class="vx-chip b" title="Combust">🔥</span>':''}</span></div>`;};
  return `<div class="gl">
   <section class="gl-hero"><div class="gl-asc"><span class="gl-sym">${sg.symbol}︎</span><div><small>Lagna · ${k}</small><b>${sg.name}</b><em>${sg.sk} · ${sg.element} · ${sg.modality}</em></div></div>
    <div class="gl-meta"><div><small>Lagna lord</small><b>${g(sg.lord)}</b><em>H${ll.h} · ${ll.sg.name}</em></div><div><small>Division</small><b>${k} · 1/${m.n}</b><em>${m.name}</em></div><div><small>Houses filled</small><b>${12-emp.length}/12</b><em>${emp.length?'empty '+emp.join(', '):'none empty'}</em></div>${isD1?'':`<div><small>Lagna in D1</small><b>${SIGNS[a1].symbol}︎ ${SIGNS[a1].name}</b><em>${asc===a1?'★ same':'differs'}</em></div>`}</div></section>
   <section class="gl-card"><h5>Planets <span>sign · house · strength${isD1?'':' · D1 sign'}</span></h5><div class="gl-pt${isD1?' d1':''}">${rows.map(row).join('')}</div></section>
   <section class="gl-card"><h5>12 houses <span>who sits where</span></h5><div class="gl-hs">${hs.map(h=>`<div class="gl-hc ${cls(h.houseNum)}${h.isEmpty?' e':''}"><header><em>${h.houseNum}</em><span>${h.signSymbol}︎</span></header><b>${h.signName}</b><div>${h.isEmpty?'<small>empty</small>':h.planets.map(q=>`<i class="${dc(q.dignity.status)}" title="${q.name}">${PLANET_GLYPHS[q.name]}</i>`).join('')}</div></div>`).join('')}</div>
    <div class="gl-lg"><span><u style="background:#D4AF37"></u>Kendra</span><span><u style="background:#5EC4B7"></u>Trikona</span><span><u style="background:#E25555"></u>Dusthana</span></div></section>
   <div class="gl-two"><section class="gl-card"><h5>Balance</h5><label>Element</label>${stack(['Fire','Earth','Air','Water'],r=>r.sg.element,['#E8704A','#8DB36B','#7FB7E6','#5B7FD6'])}<label>Mode</label>${stack(['Movable','Fixed','Dual'],r=>r.sg.modality,['#D4AF37','#A98BD6','#5EC4B7'])}</section>
    <section class="gl-card"><h5>Planets by house type</h5><div class="gl-cnt"><div><b>${inH(KEND)}</b><small>Kendra</small></div><div><b>${inH(TRI)}</b><small>Trikona</small></div><div><b>${inH(DUS)}</b><small>Dusthana</small></div><div><b>${inH(UPA)}</b><small>Upachaya</small></div></div>${conj.length?`<label>Together in one sign</label><div class="gl-cjs">${conj.join('')}</div>`:''}</section></div>
   <section class="gl-card"><h5>Highlights</h5>${notes.map(x=>`<div class="gl-n ${x[0]}"><i>${x[1]}</i><span>${x[2]}</span></div>`).join('')}</section></div>`;}
function planets(M){const {rows,m,k,c}=M;
  return rows.map(r=>{const p=r.p,nk=p.nakshatra,sb=r.sb,kv=(l,v,w)=>`<div class="vx-kv${w?' w':''}"><label>${l}</label><span>${v}</span></div>`;
   return `<details class="vx-pl"><summary><span class="vx-gl">${PLANET_GLYPHS[r.n]}</span><div><b>${r.n}${r.ret?' ℞':''}${r.vg?' ★':''}</b><small>${r.sg.symbol} ${r.sg.name} · H${r.h}</small></div><span class="vx-chip ${dc(r.dig.status)}">${r.dig.status||'—'}</span></summary><div class="vx-body">
    ${kv(k+' sign',`${r.sg.symbol} ${r.sg.name} (${r.sg.sk})`)}${kv('Sign lord',g(r.sg.lord))}${kv('Element · Mode',r.sg.element+' · '+r.sg.modality)}${kv('House in '+k,'H'+r.h+' · '+(KEND.includes(r.h)?'Kendra':TRI.includes(r.h)?'Trikona':DUS.includes(r.h)?'Dusthana':UPA.includes(r.h)?'Upachaya':'Neutral'))}
    ${kv('Division part',r.part+' of '+m.n)}${kv('Rules houses',r.own.length?r.own.map(x=>'H'+x).join(', '):'none')}${kv('Vargottama',r.vg?'Yes ★ same as D1':'No')}${kv('Dignity here',r.dig.label||'—')}
    ${kv('D1 position',`${SIGNS[p.sign].symbol} ${SIGNS[p.sign].name} ${dms(p.degInSign)}`,1)}${kv('Nakshatra',`${nk.name} · pada ${nk.pada}`)}${kv('Nak. lord · deity',nk.lord+' · '+nk.deity)}${kv('D1 house · dignity','H'+p.house+' · '+((p.dignity||{}).label||(p.dignity||{}).status||'—'))}
    ${kv('Motion',(p.retrograde?'Retrograde ℞':'Direct')+' · '+f(Math.abs(p.speed),3)+'°/day')}${kv('Combustion',p.combustion&&p.combustion.combust?'Combust ('+f(p.combustion.separation,1)+'° < '+p.combustion.orb+'°)':'Free ('+(p.combustion?f(p.combustion.separation,1)+'° from Sun':'—')+')')}${kv('Aspects D1 houses',(p.aspectsHouses||[]).map(x=>'H'+x).join(', ')||'—')}
    ${sb?kv('Shadbala',f(sb.totalRupas,2)+' / '+sb.requiredRupas+' rupas '+(sb.isStrong?'✓ strong':'✗ weak'),1)+`<div class="vx-kv w"><div class="vx-bar" style="grid-template-columns:1fr"><i><u style="width:${Math.min(100,(sb.percentOfRequired||0)/2)}%"></u></i></div></div>`:''}
   </div></details>`}).join('');}
function houses(M){const {hs,rows,k,c}=M,sav=k==='D1'&&!M.cu&&c.ashtakavarga&&c.ashtakavarga.sav;
  return `<div class="vx-hs">`+hs.map(h=>{const lr=rows.find(r=>r.n===h.signLord),th=(typeof HOUSE_THEMES!=='undefined'&&HOUSE_THEMES[h.houseNum-1])||'';
   return `<div class="vx-h ${h.isEmpty?'':'occ'}"><header><em>${h.houseNum}</em><b>${h.signSymbol} ${h.signName}</b></header><p>${h.signSanskrit} · ${h.element} · ${h.modality}</p><p>${th}</p>
   <p>Lord: <b>${h.signLord}</b>${lr?' in H'+lr.h+' ('+lr.sg.name+')':''}</p><div>${h.isEmpty?'<span class="vx-chip">Empty</span>':h.planets.map(p=>`<span class="vx-chip ${dc(p.dignity.status)}">${PLANET_GLYPHS[p.name]} ${p.name}${p.retrograde?' ℞':''}</span>`).join('')}</div>
   ${sav?`<div class="vx-bar" style="grid-template-columns:34px 1fr 22px"><span>SAV</span><i><u style="width:${Math.min(100,sav[h.sign]/40*100)}%"></u></i><b>${sav[h.sign]}</b></div>`:''}</div>`}).join('')+`</div>`;}
function vsD1(M){const {rows,k,asc,c}=M;const a1=c.vargas.D1.ascendantSign;
  return `<div class="vx-note">Compare each planet's Rashi (D1) sign with its ${k} sign. Same sign = <b>Vargottama ★</b>.</div>
   <div class="vx-row ${asc===a1?'vg':''}"><span class="vx-gl">⬆</span><span>Lagna: ${SIGNS[a1].symbol} ${SIGNS[a1].name} → ${SIGNS[asc].symbol} ${SIGNS[asc].name}</span><b>${asc===a1?'★':''}</b></div>`+
   rows.map(r=>`<div class="vx-row ${r.vg?'vg':''}"><span class="vx-gl">${PLANET_GLYPHS[r.n]}</span><span>${SIGNS[r.p.sign].symbol} ${SIGNS[r.p.sign].name} → ${r.sg.symbol} ${r.sg.name}<br><small style="color:var(--text-muted)">House ${r.p.house} → ${r.h} · ${r.dig.label||''}</small></span><b>${r.vg?'★':''}</b></div>`).join('');}
function build(c,k,v){const M=model(c,k,v),T=['At a glance','Planet details','House details','vs D1'],B=[overview,planets,houses,vsD1];
  return `<div class="vx"><div class="vx-tabs">${T.map((t,i)=>`<button type="button" data-i="${i}" class="${i===tab?'on':''}">${['✨','🪐','🏠','⚖️'][i]} ${t}</button>`).join('')}</div>${B.map((f,i)=>`<div class="vx-pane ${i===tab?'on':''}">${f(M)}</div>`).join('')}</div>`;}
const GRP={core:['🌅','Core','#F9D976'],arudha:['🪞','Arudha','#5EC4B7'],karaka:['🧿','Karaka','#A98BD6'],kala:['⏳','Kala','#7F95C4']};
const ab=k=>k==='UL_LAGNA'?'Lagna':k;
function mk(selId,id,order){const sel=document.getElementById(selId);if(!sel)return null;let r=document.getElementById(id);if(r)return r;r=document.createElement('div');r.className='vg-rail';r.id=id;r.dataset.sel=selId;if(order)r.style.order=order;sel.closest('.varga-toolbar').prepend(r);
  r.addEventListener('click',e=>{const b=e.target.closest('.vg-tile');if(!b)return;sel.value=b.dataset.k;sel.dispatchEvent(new Event('change'));});return r;}
function fillV(r,sel){r.innerHTML=[...sel.options].map(o=>{const k=o.value,a=AREA[k]||['✦',''],nm=(o.text.split('—')[1]||k).split('(')[0].trim();return `<button type="button" class="vg-tile" data-k="${k}"><i>${a[0]}</i><b>${k}</b><small>${nm}</small><em>${a[1]}</em></button>`}).join('');}
function rail(){const c=window.__vgC;
  [['vargaSelect','vgRail'],['lagnaVargaSelect','vgRail2']].forEach(([s,id])=>{const r=mk(s,id);if(r&&!r.firstChild)fillV(r,document.getElementById(s));});
  const r=mk('lagnaSelect','lgRail',-2);
  if(r&&c&&r.dataset.jd!==String(c.julianDay)){r.dataset.jd=c.julianDay;r.dataset.cur='';const sg=computeAllSpecialLagnaSigns(c),ud=c.ascendant.sign;let h='';
    Object.keys(GRP).forEach(gp=>{h+=`<span class="lg-sep" style="--gc:${GRP[gp][2]}">${GRP[gp][0]} ${GRP[gp][1]}</span>`;SPECIAL_LAGNAS_ORDER.filter(k=>SPECIAL_LAGNAS_META[k].group===gp).forEach(k=>{const s=SIGNS[sg[k]];h+=`<button type="button" class="vg-tile lg" style="--gc:${GRP[gp][2]}" data-k="${k}"><i>${s.symbol}</i><b>${ab(k)}</b><small>${SPECIAL_LAGNAS_META[k].name}</small><em>${s.name} · H${((sg[k]-ud+12)%12)+1}</em></button>`;});});r.innerHTML=h;}
  document.querySelectorAll('.vg-rail').forEach(r=>{const s=document.getElementById(r.dataset.sel);if(!s||r.dataset.cur===s.value)return;r.dataset.cur=s.value;r.querySelectorAll('.vg-tile').forEach(t=>{const on=t.dataset.k===s.value;t.classList.toggle('active',on);if(on)t.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});});});}
function lagnaExtras(){const c=window.__vgC,sel=document.getElementById('lagnaSelect'),strip=document.getElementById('lagnaSummaryStrip');if(!c||!sel||!strip)return;
  const sg=computeAllSpecialLagnaSigns(c),ud=c.ascendant.sign;let map=document.getElementById('lagnaMap');
  if(!map||map.dataset.jd!==String(c.julianDay)){if(map)map.remove();map=document.createElement('div');map.id='lagnaMap';map.dataset.jd=c.julianDay;
    map.innerHTML=`<h4 class="vl-h">Where every lagna falls</h4><div class="vl-grid">${SIGNS.map((s,i)=>`<div class="vl-cell${i===ud?' ud':''}"><header><em>${s.symbol}</em><b>${s.name}</b><small>H${((i-ud+12)%12)+1}</small></header><div>${SPECIAL_LAGNAS_ORDER.filter(k=>sg[k]===i).map(k=>`<button type="button" class="vl-chip" style="--gc:${GRP[SPECIAL_LAGNAS_META[k].group][2]}" data-k="${k}">${ab(k)}</button>`).join('')}</div><p>${P.filter(n=>c.planets[n].sign===i).map(n=>PLANET_GLYPHS[n]).join(' ')||'·'}</p></div>`).join('')}</div><div class="vxa-leg">${Object.values(GRP).map(g=>`<span><i style="background:${g[2]}"></i>${g[1]}</span>`).join('')}<span>Bottom line = D1 planets</span></div>`;
    strip.parentNode.insertBefore(map,strip);map.addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(!b)return;sel.value=b.dataset.k;sel.dispatchEvent(new Event('change'));});}
  map.querySelectorAll('.vl-chip').forEach(x=>x.classList.toggle('on',x.dataset.k===sel.value));
  const card=strip.querySelector('.lagna-summary-card');
  if(card&&!card.dataset.vg){card.dataset.vg=1;const key=sel.value,s=sg[key],S=SIGNS[s],lr=c.planets[S.lord],h=((s-ud+12)%12)+1,occ=P.filter(n=>c.planets[n].sign===s),also=SPECIAL_LAGNAS_ORDER.filter(k=>k!==key&&sg[k]===s);
    card.style.setProperty('--gc',GRP[SPECIAL_LAGNAS_META[key].group][2]);
    card.insertAdjacentHTML('beforeend',`<div class="vx-grid" style="margin-top:12px"><div class="vx-t"><label>From Udaya Lagna</label><b>House ${h}</b><small>${h===1?'Same as the ascendant':ord(h)+' from the ascendant · '+(KEND.includes(h)?'Kendra':TRI.includes(h)?'Trikona':DUS.includes(h)?'Dusthana':UPA.includes(h)?'Upachaya':'Neutral')}</small></div><div class="vx-t"><label>Sign nature</label><b>${S.element} · ${S.modality}</b><small>${S.sk}</small></div><div class="vx-t"><label>Sign lord</label><b>${g(S.lord)}</b><small>${lr?'in '+SIGNS[lr.sign].symbol+' '+SIGNS[lr.sign].name+' · H'+lr.house+' · '+((lr.dignity||{}).label||''):''}</small></div><div class="vx-t"><label>Planets here (D1)</label>${chips(occ.map(g),'g')}</div><div class="vx-t wide"><label>Other lagnas in this sign</label>${also.length?also.map(k=>`<span class="vx-chip t">${SPECIAL_LAGNAS_META[k].name}</span>`).join(''):'<small>None — this lagna stands alone.</small>'}</div></div>`);}}
function aspects(card,k,v0){
  const c=window.__vgC,wrap=card.querySelector('.varga-aspect-table-wrap');
  if(!c||!(v0||c.vargas[k])||!wrap||wrap.dataset.vxa||typeof computeVargaAspects!=='function')return; wrap.dataset.vxa=1;
  const rows=computeVargaAspects(c,v0||c.vargas[k]),col=n=>({Mars:'#D95F5F',Jupiter:'#F9D976',Saturn:'#7F95C4',Rahu:'#A98BD6',Ketu:'#A98BD6'}[n]||'#5EC4B7'),num=l=>(String(l).match(/(\d+)/)||[,'7'])[1];
  const M={},inc={},hh={};
  rows.forEach(r=>{r.targets.filter(t=>t.toPlanet).forEach(t=>{(M[r.planet]=M[r.planet]||{})[t.toPlanet]=t.label;(inc[t.toPlanet]=inc[t.toPlanet]||[]).push(r.planet);});r.aspectedHouses.forEach(h=>(hh[h]=hh[h]||[]).push(r.planet));});
  let mut=0;const mp=[];P.forEach((a,i)=>P.slice(i+1).forEach(b=>{if(M[a]&&M[a][b]&&M[b]&&M[b][a]){mut++;mp.push(a+' ⇄ '+b);}}));
  const total=rows.reduce((s,r)=>s+r.targets.filter(t=>t.toPlanet).length,0);
  const top=Object.keys(inc).sort((a,b)=>inc[b].length-inc[a].length)[0],topH=Object.keys(hh).sort((a,b)=>hh[b].length-hh[a].length)[0];
  const cell=(a,b)=>{if(a===b)return '<i class="vxa-c self"></i>';const l=M[a]&&M[a][b];if(!l)return '<i class="vxa-c"></i>';const m=M[b]&&M[b][a];
    return `<button type="button" class="vxa-c on${m?' m':''}" style="--c:${col(a)}" data-t="${PLANET_GLYPHS[a]} ${a} → ${PLANET_GLYPHS[b]} ${b}: ${l}${m?' · 🔗 mutual':''}">${num(l)}</button>`;};
  const html=`<div class="vxa">
   <div class="vx-grid">
    <div class="vx-t"><label>Planet → planet aspects</label><b>${total}</b><small>drishti links in ${k}</small></div>
    <div class="vx-t"><label>Most aspected planet</label><b>${top?g(top):'—'}</b><small>${top?inc[top].length+' aspects from '+inc[top].join(', '):''}</small></div>
    <div class="vx-t"><label>Most aspected house</label><b>${topH?'H'+topH:'—'}</b><small>${topH?hh[topH].length+' planets look at it':''}</small></div>
    <div class="vx-t"><label>Mutual aspects 🔗</label><b>${mut}</b><small>${mp.slice(0,4).join(' · ')||'none'}</small></div></div>
   <h4>Aspect map · tap a cell</h4>
   <div class="vxa-mx">${'<i class="vxa-hd"></i>'+P.map(n=>`<b class="vxa-hd" title="${n} receives">${PLANET_GLYPHS[n]}</b>`).join('')}${P.map(a=>`<b class="vxa-hd" title="${a} aspects">${PLANET_GLYPHS[a]}</b>`+P.map(b=>cell(a,b)).join('')).join('')}</div>
   <div class="vxa-tip" id="vxaTip">Rows aspect → columns. The number is the aspect (3rd, 4th, 5th, 7th, 8th, 9th, 10th). Gold ring = mutual.</div>
   <div class="vxa-leg"><span><i style="background:#5EC4B7"></i>7th (all)</span><span><i style="background:#D95F5F"></i>Mars 4·8</span><span><i style="background:#F9D976"></i>Jupiter 5·9</span><span><i style="background:#7F95C4"></i>Saturn 3·10</span><span><i style="background:#A98BD6"></i>Rahu/Ketu 5·9</span></div>
   <h4>Houses under drishti</h4>
   <div class="vxa-hs">${Array.from({length:12},(_,i)=>{const a=hh[i+1]||[];return `<div class="vxa-h${a.length>2?' hot':''}"><b>${i+1}</b><span>${a.map(n=>PLANET_GLYPHS[n]).join('')||'·'}</span><small>${a.length} aspect${a.length===1?'':'s'}</small></div>`}).join('')}</div>
   <h4>Planet by planet</h4>
   <div class="vxa-cards">${rows.map(r=>{const pt=r.targets.filter(t=>t.toPlanet);return `<div class="vxa-p" style="--c:${col(r.planet)}"><header><span class="vx-gl">${r.glyph}</span><div><b>${r.planet}${r.retrograde?' ℞':''}</b><small>H${r.fromHouse} · ${r.fromSign} · ${r.nakshatra} p${r.pada}</small></div></header>
    <p>${r.degree} · Nak. lord ${r.nakshatraLord}</p><label>Looks at houses</label>${chips(r.aspectedHouses.map(x=>'H'+x),'t')}
    <label>Hits planets</label>${pt.length?pt.map(t=>`<span class="vx-chip" title="${t.label}">${PLANET_GLYPHS[t.toPlanet]} ${t.toPlanet} · H${t.toHouse} · ${num(t.label)}th</span>`).join(''):'<span class="vx-chip">No planets</span>'}
    <label>Receives from</label>${chips((inc[r.planet]||[]).map(n=>PLANET_GLYPHS[n]+' '+n),'g')}</div>`}).join('')}</div></div>`;
  wrap.classList.add('vxa-on');wrap.insertAdjacentHTML('beforeend',html);
  const tip=wrap.querySelector('#vxaTip'),mx=wrap.querySelector('.vxa-mx');
  mx.addEventListener('click',e=>{const b=e.target.closest('.vxa-c.on');if(!b)return;mx.querySelectorAll('.sel').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');tip.textContent=b.dataset.t;});
}
function decorate(card,lag){const c0=window.__vgC,V=(lag&&c0)?buildVargaFromLagna(c0,computeAllSpecialLagnaSigns(c0)[lag],((card.querySelector('.varga-code')||{}).textContent||'').trim()):null;const k=((card.querySelector('.varga-code')||{}).textContent||'').trim(),a=AREA[k],t=card.querySelector('.varga-card-title');
  try{aspects(card,k,V);}catch(e){console.warn('aspects',e);}
  if(a&&t)t.insertAdjacentHTML('afterend',`<div class="vg-area"><span>${a[0]}</span>${a[1]}</div>`);
  const cc=card.querySelector('.varga-chart-container');if(cc&&!cc.querySelector('.vc-leg'))cc.insertAdjacentHTML('beforeend','<div class="vc-leg"><span><i style="background:#D4AF37"></i>Kendra</span><span><i style="background:#5EC4B7"></i>Trikona</span><span><i style="background:#E25555"></i>Dusthana</span><span><i class="r" style="border-color:#F9D976"></i>Exalted</span><span><i class="r" style="border-color:#5EC4B7"></i>Own sign</span><span><i class="r" style="border-color:#E25555"></i>Debilitated</span><span style="color:#FF8A8A">R&nbsp;Retrograde</span><span style="color:#F9D976">★&nbsp;Vargottama</span></div>');
  const wrap=card.querySelector('.varga-house-table-wrap'),c=window.__vgC;
  if(wrap&&c&&(V||(c.vargas&&c.vargas[k]))){let ok=false;try{wrap.innerHTML=build(c,k,V);ok=true;}catch(e){console.warn('explorer',e);}
    const tb=ok&&wrap.querySelector('.vx-tabs');if(tb)tb.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tab=+b.dataset.i;const hh=wrap.offsetHeight;wrap.style.minHeight=hh+'px';const y=window.scrollY;wrap.querySelectorAll('.vx-tabs button').forEach((x,i)=>x.classList.toggle('on',i===tab));wrap.querySelectorAll('.vx-pane').forEach((x,i)=>x.classList.toggle('on',i===tab));window.scrollTo(0,y);setTimeout(()=>{wrap.style.minHeight='';},320);});}}
setInterval(()=>{if(document.hidden)return;rail();document.querySelectorAll('.varga-style-toggle').forEach(gp=>{const i=Math.max(0,[...gp.children].findIndex(b=>b.classList.contains('active')));if(gp.dataset.i!==String(i)){gp.dataset.i=i;gp.style.setProperty('--i',i);}});
  const card=document.querySelector('#vargaDisplayContainer .varga-card');if(card&&!card.dataset.vg){card.dataset.vg=1;try{decorate(card);}catch(e){console.warn('decorate',e);}}
  try{lagnaExtras();}catch(e){console.warn('lagna',e);}
  const lc=document.querySelector('#panel-lagnas .varga-single-display .varga-card,#panel-lagnas .varga-card');const ls=document.getElementById('lagnaSelect');if(lc&&ls&&!lc.dataset.vg){lc.dataset.vg=1;try{decorate(lc,ls.value);}catch(e){console.warn('lagna decorate',e);}}},300);
})();

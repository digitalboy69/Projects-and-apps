
function buildAshtakavargaSection(chart){
  window.__avChart=chart;
  const av=chart.ashtakavarga,asc=chart.ascendant.sign,pos={Lagna:asc};BAV_PLANETS.forEach(n=>pos[n]=chart.planets[n].sign);
  const sum=a=>a.reduce((x,y)=>x+y,0),cls=(v,k)=>k==='SAV'?(v>=32?'t3':v>=28?'t2':v>=25?'t1':'t0'):(v>=6?'t3':v>=4?'t2':v>=3?'t1':'t0');
  const occ=s=>PLANET_LIST.filter(n=>chart.planets[n].sign===s).map(n=>PLANET_GLYPHS[n]).join(' ');
  const order=Array.from({length:12},(_,h)=>(asc+h)%12), vals=k=>k==='SAV'?av.sav:av.bavTables[k];
  const sgn=s=>SIGNS[s].symbol+' '+SIGNS[s].name;
  function view(k){
    const v=vals(k),t=sum(v),avg=t/12,mx=k==='SAV'?Math.max(...v):8,hi=order.reduce((m,s)=>v[s]>v[m]?s:m,order[0]),lo=order.reduce((m,s)=>v[s]<v[m]?s:m,order[0]);
    const lim=k==='SAV'?28:Math.ceil(avg),n=order.filter(s=>v[s]>=lim).length,me=k==='SAV'?null:pos[k];
    const tiles=order.map((s,h)=>`<button type="button" class="avx-t ${cls(v[s],k)}" data-k="${k}" data-s="${s}"><em>${h+1}</em><i>${SIGNS[s].symbol}</i><b>${v[s]}</b><small>${SIGNS[s].name}</small><u style="width:${v[s]/mx*100}%"></u><span>${occ(s)||'&nbsp;'}</span></button>`).join('');
    let pr='';
    if(k==='SAV'){pr=`<table class="avx-tb"><tr><th></th>${order.map((s,h)=>`<th>${h+1}</th>`).join('')}<th>Σ</th></tr>${BAV_PLANETS.map(p=>`<tr><th>${PLANET_GLYPHS[p]}</th>${order.map(s=>`<td class="${cls(av.bavTables[p][s],p)}">${av.bavTables[p][s]}</td>`).join('')}<td><b>${sum(av.bavTables[p])}</b></td></tr>`).join('')}<tr class="tot"><th>Σ</th>${order.map(s=>`<td class="${cls(av.sav[s],'SAV')}">${av.sav[s]}</td>`).join('')}<td><b>${t}</b></td></tr></table>`;}
    else{const rows=CONTRIBUTORS.map(c=>{const g=signsFromOffsets(pos[c],CONTRIBUTION_TABLE[k][c]);return `<tr><th>${c==='Lagna'?'Lg':PLANET_GLYPHS[c]}</th>${order.map(s=>`<td class="${g.includes(s)?'on':''}">${g.includes(s)?'●':''}</td>`).join('')}<td><b>${g.length}</b></td></tr>`}).join('');
      pr=`<table class="avx-tb"><tr><th></th>${order.map((s,h)=>`<th>${h+1}</th>`).join('')}<th>Σ</th></tr>${rows}<tr class="tot"><th>Σ</th>${order.map(s=>`<td class="${cls(v[s],k)}">${v[s]}</td>`).join('')}<td><b>${t}</b></td></tr></table>`;}
    return `<div class="avx-panel${k==='SAV'?' on':''}" data-p="${k}"><div class="avx-sum"><div><label>Total</label><b>${t}</b><small>${k==='SAV'?'of 337':'fixed constant'}</small></div><div><label>Average</label><b>${avg.toFixed(1)}</b><small>per sign</small></div><div><label>Strongest</label><b>${v[hi]}</b><small>${sgn(hi)}</small></div><div><label>Weakest</label><b>${v[lo]}</b><small>${sgn(lo)}</small></div><div><label>${k==='SAV'?'Signs ≥ 28':'Signs ≥ '+lim}</label><b>${n}/12</b><small>${k==='SAV'?'above the 28 average':'above average'}</small></div>${me!=null?`<div><label>${k} sits in</label><b>${v[me]}</b><small>${sgn(me)} · ${v[me]>=4?'supported':'weak'}</small></div>`:`<div><label>Lagna sign</label><b>${v[asc]}</b><small>${sgn(asc)}</small></div>`}</div>
      <div class="avx-grid">${tiles}</div><div class="avx-det" id="avd-${k}">👆 Tap any sign to see exactly where its points come from.</div>
      <details class="avx-pr"><summary>${k==='SAV'?'All seven Bhinnashtakavarga tables, side by side':'Prastarashtakavarga — who gives each point'}</summary><div class="avx-sc">${pr}</div></details></div>`;}
  const tabs=['SAV'].concat(BAV_PLANETS).map((k,i)=>`<button type="button" class="avx-tab${i?'':' on'}" data-p="${k}"><span>${k==='SAV'?'Σ':PLANET_GLYPHS[k]}</span>${k==='SAV'?'Sarva':k}<small>${sum(vals(k))}</small></button>`).join('');
  const ok=BAV_PLANETS.every(p=>sum(av.bavTables[p])===({Sun:48,Moon:49,Mars:39,Mercury:54,Jupiter:56,Venus:52,Saturn:39})[p])&&sum(av.sav)===337;
  return `<div class="section-heading" id="sec-ashtakavarga"><h3>Ashtakavarga — Point-Strength System</h3><div class="rule"></div></div>
  <div class="avx"><div class="avx-legend"><span class="t3">Excellent</span><span class="t2">Good</span><span class="t1">Average</span><span class="t0">Weak</span><small>Signs run from your Lagna (house 1). SAV: 32+ excellent · 28+ good · 25–27 average · below 25 weak.</small></div>
  <div class="avx-tabs">${tabs}</div>${['SAV'].concat(BAV_PLANETS).map(view).join('')}
  <div class="avx-check">${ok?'✓':'✗'} Tables verified against BPHS: Sun 48 · Moon 49 · Mars 39 · Mercury 54 · Jupiter 56 · Venus 52 · Saturn 39 = 337</div></div>`;
}
if(!window.__avInit){window.__avInit=1;document.addEventListener('click',e=>{
  const tb=e.target.closest('.avx-tab');if(tb){const r=tb.closest('.avx');r.querySelectorAll('.avx-tab').forEach(x=>x.classList.toggle('on',x===tb));r.querySelectorAll('.avx-panel').forEach(x=>x.classList.toggle('on',x.dataset.p===tb.dataset.p));return;}
  const t=e.target.closest('.avx-t');if(!t)return;const c=window.__avChart,av=c.ashtakavarga,k=t.dataset.k,s=+t.dataset.s,asc=c.ascendant.sign,h=((s-asc+12)%12)+1,S=SIGNS[s],pos={Lagna:asc};BAV_PLANETS.forEach(n=>pos[n]=c.planets[n].sign);
  t.closest('.avx-panel').querySelectorAll('.avx-t').forEach(x=>x.classList.toggle('sel',x===t));let body='';
  if(k==='SAV')body=BAV_PLANETS.map(p=>`<div class="avx-r"><span>${PLANET_GLYPHS[p]} ${p}</span><i><u style="width:${av.bavTables[p][s]/8*100}%"></u></i><b>${av.bavTables[p][s]}</b></div>`).join('');
  else body=`<div class="avx-ch">`+CONTRIBUTORS.map(cn=>{const d=((s-pos[cn]+12)%12)+1,g=CONTRIBUTION_TABLE[k][cn].includes(d);return `<span class="${g?'g':'n'}">${g?'✓':'✕'} ${cn==='Lagna'?'Lagna':PLANET_GLYPHS[cn]+' '+cn}<small>${d}th from it</small></span>`}).join('')+`</div>`;
  const v=k==='SAV'?av.sav[s]:av.bavTables[k][s];
  document.getElementById('avd-'+k).innerHTML=`<div class="avx-dh"><b>${S.symbol} ${S.name}</b><span>House ${h} · ${S.sk} · lord ${S.lord}</span><em>${v} point${v===1?'':'s'}</em></div>${body}`;});}

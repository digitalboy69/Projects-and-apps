/* Every chart gets its own gradient/filter ids: the same id twice in one page (e.g. a hidden overview chart) makes browsers drop every gold stroke. */
function chUniq(s){const u=window.__chUid=(window.__chUid||0)+1;return s.replace(/id="([nws])([bgf])"/g,(m,a,b)=>`id="${a}${b}${u}"`).replace(/url\(#([nws])([bgf])\)/g,(m,a,b)=>`url(#${a}${b}${u})`);}
function chOuter(v){return (window.__showOuter!==false&&v&&v.outerSign)?OUTER_LIST:[];}
function chMeta(v){const inf={},c=window.__vgC;v.houses.forEach(h=>h.planets.forEach(p=>{inf[p.name]={st:(p.dignity||{}).status||'',rx:!!p.retrograde};}));
  chOuter(v).forEach(n=>{inf[n]={st:'',rx:!!(v.outerRx&&v.outerRx[n]),vg:false};});
  PLANET_LIST.forEach(n=>{inf[n]=inf[n]||{st:'',rx:false};inf[n].vg=!!(c&&c.planets&&c.planets[n]&&v!==c.vargas.D1&&v.planetVargaSign[n]===c.planets[n].sign);});return inf;}
function chBadge(n,x,y,r,i,lab){const c=PCOL[n],f=(r*1.3).toFixed(1);
  return `<g class="ch-pl" data-p="${n}"><title>${n}${i.rx?' (retrograde)':''}${i.st?' · '+i.st:''}${i.vg?' · Vargottama':''}</title><circle cx="${x}" cy="${y}" r="${r}" fill="${c}" fill-opacity=".17" stroke="${dRing(i.st)}" stroke-width="1.5"/><text x="${x}" y="${y+.5}" text-anchor="middle" dominant-baseline="central" font-size="${f}" fill="${c}" font-family="sans-serif" font-weight="700">${PLANET_GLYPHS[n]||OUTER_GLYPHS[n]}</text>${i.rx?`<text x="${x+r*.95}" y="${y-r*.6}" font-size="${(r*.85).toFixed(1)}" fill="#FF8A8A" font-weight="800" font-family="sans-serif" text-anchor="middle">R</text>`:''}${i.vg?`<text x="${x-r*.95}" y="${y-r*.5}" font-size="${(r*.95).toFixed(1)}" fill="#F9D976" text-anchor="middle">★</text>`:''}${lab?`<text x="${x}" y="${y+r+6}" font-size="5.6" fill="${c}" fill-opacity=".85" font-family="sans-serif" text-anchor="middle">${n.slice(0,2)}</text>`:''}</g>`;}
function chPlanets(list,inf,cx,cy,maxCols){const n=list.length;if(!n)return '';const r=n<=2?9:n<=4?8:6.5,cols=n<=2?n:(n>4&&maxCols?maxCols:2),gap=2*r+(n<=4?8:3),rows=Math.ceil(n/cols);
  return list.map((p,i)=>{const ro=Math.floor(i/cols),k=Math.min(cols,n-ro*cols),j=i%cols;return chBadge(p,+(cx+(j-(k-1)/2)*gap).toFixed(1),+(cy+(ro-(rows-1)/2)*gap).toFixed(1),r,inf[p],n<=4);}).join('');}
function chFrame(id){const g=`url(#${id}g)`,dm=(x,y,r)=>`<path d="M${x} ${y-r}L${x+r} ${y}L${x} ${y+r}L${x-r} ${y}Z" fill="${g}"/>`;
  return `<rect x="1.5" y="1.5" width="297" height="297" rx="16" fill="url(#${id}b)"/><rect x="1.5" y="1.5" width="297" height="297" rx="16" fill="none" stroke="#D4AF37" stroke-opacity=".35" stroke-width="4" filter="url(#${id}f)"/><rect x="1.5" y="1.5" width="297" height="297" rx="16" fill="none" stroke="${g}" stroke-width="2.4"/><rect x="5.6" y="5.6" width="288.8" height="288.8" rx="12" fill="none" stroke="${g}" stroke-width="1.3" stroke-dasharray=".1 3.2" stroke-linecap="round"/>`
   +[[150,3.6],[150,296.4],[3.6,150],[296.4,150]].map(([x,y])=>dm(x,y,3.4)).join('')
   +[[75,3.6],[225,3.6],[75,296.4],[225,296.4],[3.6,75],[3.6,225],[296.4,75],[296.4,225]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.1" fill="${g}"/>`).join('');}
function chDefs(id){return `<defs><radialGradient id="${id}b" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#1c2242"/><stop offset=".6" stop-color="#0d1020"/><stop offset="1" stop-color="#05060b"/></radialGradient><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F9D976"/><stop offset=".5" stop-color="#D4AF37"/><stop offset="1" stop-color="#8C7323"/></linearGradient><filter id="${id}f" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>${chFrame(id)}`+[[22,40],[270,26],[40,270],[262,262],[120,16],[285,150],[180,285],[14,150]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%3?.6:.9}" fill="#fff" opacity=".3"/>`).join('');}
function chSignDot(x,y,si,r){const el=SIGNS[si].element,c=ELC[el];return `<g><title>${SIGNS[si].name} · ${el}</title><circle cx="${x}" cy="${y}" r="${r}" fill="${c}" fill-opacity=".22" stroke="${c}" stroke-width="1"/><text x="${x}" y="${y+.5}" text-anchor="middle" dominant-baseline="central" font-size="${r*1.1}" fill="${c}" font-family="sans-serif" font-weight="700">${si+1}</text></g>`;}
function chAspects(rows,pos){let s='<g class="aspect-lines-layer">';rows.forEach(r=>{const f=pos(r.fromHouse);[...new Set(r.targets.filter(t=>t.toPlanet).map(t=>t.toHouse))].forEach(h=>{const t=pos(h);s+=`<line x1="${f[0]}" y1="${f[1]}" x2="${t[0]}" y2="${t[1]}" class="aspect-line aspect-line-${r.planet.toLowerCase()}"><title>${r.planet} aspects H${h}</title></line>`;});});return s+'</g>';}

function buildNorthIndianSvg(v,asp){
  const asc=v.ascendantSign,inf=chMeta(v),hp={};for(let h=1;h<=12;h++)hp[h]=[];PLANET_LIST.forEach(n=>hp[((v.planetVargaSign[n]-asc+12)%12)+1].push(n));chOuter(v).forEach(n=>hp[((v.outerSign[n]-asc+12)%12)+1].push(n));
  const A=[10,10],B=[290,10],C=[290,290],D=[10,290],T=[150,10],R=[290,150],Bo=[150,290],L=[10,150],O=[150,150],Q1=[80,80],Q2=[220,80],Q3=[220,220],Q4=[80,220];
  const poly={1:[T,Q2,O,Q1],2:[A,T,Q1],3:[A,Q1,L],4:[L,Q1,O,Q4],5:[L,Q4,D],6:[D,Q4,Bo],7:[Bo,Q4,O,Q3],8:[Bo,Q3,C],9:[C,Q3,R],10:[R,Q3,O,Q2],11:[R,Q2,B],12:[B,Q2,T]};
  const an={1:[150,76],2:[78,46],3:[46,78],4:[74,150],5:[46,222],6:[78,254],7:[150,224],8:[222,254],9:[254,222],10:[226,150],11:[254,78],12:[222,46]};
  const sd={1:[150,28],2:[104,20],3:[20,104],4:[28,150],5:[20,196],6:[104,280],7:[150,272],8:[196,280],9:[280,196],10:[272,150],11:[280,104],12:[196,20]};
  let s=`<svg class="varga-chart-svg" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">${chDefs('n')}`;
  for(let h=1;h<=12;h++)s+=`<polygon points="${poly[h].map(p=>p.join(',')).join(' ')}" fill="${HTc(h)}" fill-opacity="${HAl(h)}" stroke="url(#ng)" stroke-width="${h===1?1.8:1.2}" stroke-linejoin="round"/>`;
  s+=`<rect x="10" y="10" width="280" height="280" fill="none" stroke="url(#ng)" stroke-width="2.6"/><rect x="13.5" y="13.5" width="273" height="273" fill="none" stroke="#D4AF37" stroke-opacity=".4" stroke-width=".7"/><path d="M150 10L290 150L150 290L10 150Z" fill="none" stroke="url(#ng)" stroke-width="1.7" stroke-linejoin="round"/><path d="M10 10L290 290M290 10L10 290" stroke="url(#ng)" stroke-width="1.7"/>`+[[10,10],[290,10],[290,290],[10,290],[150,10],[290,150],[150,290],[10,150]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.6" fill="#0d1020" stroke="url(#ng)" stroke-width="1.2"/>`).join('')+`<circle cx="150" cy="150" r="13" fill="#0d1020" fill-opacity=".6" stroke="url(#ng)" stroke-width="1.1"/><circle cx="150" cy="150" r="9" fill="none" stroke="#D4AF37" stroke-opacity=".35" stroke-dasharray="1.5 2.5"/><circle cx="150" cy="150" r="3" fill="url(#ng)"/>`;
  if(asp)s+=chAspects(asp,h=>an[h]);
  for(let h=1;h<=12;h++){s+=chSignDot(sd[h][0],sd[h][1],(asc+h-1)%12,7.5)+chPlanets(hp[h],inf,an[h][0],an[h][1]+(h===1?4:0),3);}
  s+=`<rect x="137" y="40" width="26" height="11" rx="5.5" fill="#D4AF37"/><text x="150" y="45.8" font-size="7" fill="#1a1405" font-weight="800" font-family="sans-serif" text-anchor="middle" dominant-baseline="central">ASC</text></svg>`;
  return chUniq(s);}

function buildWesternWheelSvg(v,asp){
  const asc=v.ascendantSign,inf=chMeta(v),hp={},cx=150,cy=150,R0=136,R1=112,R2=92,R3=30;for(let h=1;h<=12;h++)hp[h]=[];PLANET_LIST.forEach(n=>hp[((v.planetVargaSign[n]-asc+12)%12)+1].push(n));chOuter(v).forEach(n=>hp[((v.outerSign[n]-asc+12)%12)+1].push(n));
  const pt=(r,a)=>[+(cx+r*Math.cos(a*Math.PI/180)).toFixed(1),+(cy+r*Math.sin(a*Math.PI/180)).toFixed(1)];
  const sec=(r1,r2,a1,a2)=>{const p1=pt(r2,a1),p2=pt(r2,a2),p3=pt(r1,a2),p4=pt(r1,a1);return `M${p1} A${r2} ${r2} 0 0 1 ${p2} L${p3} A${r1} ${r1} 0 0 0 ${p4}Z`;};
  const mid=h=>180-30*(h-1)-15;
  let s=`<svg class="varga-chart-svg" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">${chDefs('w')}`;
  for(let h=1;h<=12;h++){const a2=180-30*(h-1),a1=a2-30,si=(asc+h-1)%12,el=SIGNS[si].element,ec=ELC[el];
    s+=`<path d="${sec(R1,R0,a1,a2)}" fill="${ec}" fill-opacity=".2" stroke="url(#wg)" stroke-width=".9"><title>${SIGNS[si].name} · ${el}</title></path>`
     +`<path d="${sec(R2,R1,a1,a2)}" fill="${HTc(h)}" fill-opacity="${HAl(h)+.06}" stroke="url(#wg)" stroke-width=".7"/>`
     +`<path d="${sec(R3,R2,a1,a2)}" fill="${HTc(h)}" fill-opacity="${HAl(h)*.45}" stroke="url(#wg)" stroke-opacity=".5" stroke-width=".6"/>`;
    const sp=pt((R0+R1)/2,mid(h)),hp2=pt((R1+R2)/2,mid(h));
    s+=`<text x="${sp[0]}" y="${sp[1]}" text-anchor="middle" dominant-baseline="central" font-size="8.5" font-weight="700" fill="${ec}" font-family="sans-serif">${SIGNS[si].name.slice(0,3)}</text><text x="${hp2[0]}" y="${hp2[1]}" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="700" fill="${HTc(h)}" font-family="sans-serif">${h}</text>`;}
  s+=`<circle cx="${cx}" cy="${cy}" r="${R0+2.5}" fill="none" stroke="url(#wg)" stroke-width="2.2"/><circle cx="${cx}" cy="${cy}" r="${R0+6}" fill="none" stroke="url(#wg)" stroke-width=".8" stroke-opacity=".8"/><circle cx="${cx}" cy="${cy}" r="${R1}" fill="none" stroke="url(#wg)" stroke-width="1.3"/><circle cx="${cx}" cy="${cy}" r="${R2}" fill="none" stroke="url(#wg)" stroke-width="1.1"/>`;
  for(let d=0;d<360;d+=5){const big=d%30===0,a=pt(R0+(big?-6:-2.5),d),b=pt(R0,d);s+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#D4AF37" stroke-opacity="${big?.9:.5}" stroke-width="${big?1.1:.6}"/>`;}
  for(let h=0;h<12;h++){const a=pt(R3,180-30*h),b=pt(R0,180-30*h);s+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="url(#wg)" stroke-width="1"/>`;}
  if(asp)s+=chAspects(asp,h=>pt(R3+7,mid(h)));
  s+=`<circle cx="${cx}" cy="${cy}" r="${R3}" fill="url(#wb)" stroke="url(#wg)" stroke-width="1.4"/><text x="${cx}" y="${cy-6}" text-anchor="middle" font-size="6" letter-spacing="1" fill="#D4AF37" font-family="sans-serif" font-weight="700">LAGNA</text><text x="${cx}" y="${cy+6}" text-anchor="middle" font-size="9.5" fill="#F4F1E8" font-weight="700" font-family="sans-serif">${SIGNS[asc].name.slice(0,3)}</text>`;
  for(let h=1;h<=12;h++){const L2=hp[h],n=L2.length;if(!n)continue;const pr=n>6?3:2,rb=n<=2?8:n<=4?7.5:6.5;
    L2.forEach((p,i)=>{const row=Math.floor(i/pr),k=Math.min(pr,n-row*pr),j=i%pr,r=R2-15-row*19,sp=Math.min(24,(2*rb+3)/r*57.3),q=pt(r,mid(h)+(j-(k-1)/2)*sp);s+=chBadge(p,q[0],q[1],rb,inf[p],false);});}
  const e1=pt(R0+3,180),e2=pt(R3,180);
  s+=`<line x1="${e1[0]}" y1="${e1[1]}" x2="${e2[0]}" y2="${e2[1]}" stroke="#FF8A8A" stroke-width="2" stroke-linecap="round"/><rect x="2" y="136" width="9" height="28" rx="3" fill="#FF8A8A"/><text transform="translate(8,150) rotate(-90)" font-size="6.5" fill="#1a0a0a" font-weight="800" font-family="sans-serif" text-anchor="middle">ASC</text></svg>`;
  return chUniq(s);}

function buildSouthIndianSvg(v,asp){
  const asc=v.ascendantSign,inf=chMeta(v),cell=[[1,0],[2,0],[3,0],[3,1],[3,2],[3,3],[2,3],[1,3],[0,3],[0,2],[0,1],[0,0]],hp={};for(let i=0;i<12;i++)hp[i]=[];PLANET_LIST.forEach(n=>hp[v.planetVargaSign[n]].push(n));chOuter(v).forEach(n=>hp[v.outerSign[n]].push(n));
  const xy=si=>[10+cell[si][0]*70,10+cell[si][1]*70],ctr=h=>{const p=xy((asc+h-1)%12);return [p[0]+35,p[1]+35];};
  let s=`<svg class="varga-chart-svg" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">${chDefs('s')}`;
  s+=`<g opacity=".9"><circle cx="150" cy="150" r="58" fill="none" stroke="#D4AF37" stroke-opacity=".22"/><circle cx="150" cy="150" r="40" fill="none" stroke="#5EC4B7" stroke-opacity=".25" stroke-dasharray="3 4"/><circle cx="150" cy="150" r="3" fill="url(#sg)"/></g>`;
  for(let si=0;si<12;si++){const [x,y]=xy(si),h=((si-asc+12)%12)+1,el=SIGNS[si].element,ec=ELC[el];
    s+=`<rect x="${x}" y="${y}" width="70" height="70" fill="${ec}" fill-opacity="${si===asc?.2:.09}" stroke="url(#sg)" stroke-width="${si===asc?2:1.1}"><title>${SIGNS[si].name} · ${el}</title></rect>`
     +`<text x="${si===asc?x+31:x+5}" y="${y+10}" font-size="7.5" font-weight="700" fill="${ec}" font-family="sans-serif">${SIGNS[si].name.slice(0,3)}</text>`
     +`<circle cx="${x+60}" cy="${y+10}" r="6.5" fill="${HTc(h)}" fill-opacity=".2" stroke="${HTc(h)}" stroke-width=".9"/><text x="${x+60}" y="${y+10.5}" font-size="7.5" font-weight="700" fill="${HTc(h)}" font-family="sans-serif" text-anchor="middle" dominant-baseline="central">${h}</text>`;
    if(si===asc)s+=`<path d="M${x} ${y} L${x+26} ${y} L${x} ${y+26}Z" fill="#D4AF37" fill-opacity=".85"/><text x="${x+4.5}" y="${y+10}" font-size="6.5" font-weight="800" fill="#1a1405" font-family="sans-serif">ASC</text>`;}
  s+=`<rect x="10" y="10" width="280" height="280" fill="none" stroke="url(#sg)" stroke-width="2.8"/><rect x="13.5" y="13.5" width="273" height="273" fill="none" stroke="#D4AF37" stroke-opacity=".4" stroke-width=".7"/><rect x="80" y="80" width="140" height="140" fill="#0d1020" fill-opacity=".55" stroke="url(#sg)" stroke-width="1.8"/><rect x="85" y="85" width="130" height="130" fill="none" stroke="#D4AF37" stroke-opacity=".35" stroke-width=".7" stroke-dasharray="1.5 2.5"/>`+[[10,10],[290,10],[290,290],[10,290],[80,80],[220,80],[220,220],[80,220]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.6" fill="#0d1020" stroke="url(#sg)" stroke-width="1.2"/>`).join('');
  if(asp)s+=chAspects(asp,h=>ctr(h));
  for(let si=0;si<12;si++){const [x,y]=xy(si);s+=chPlanets(hp[si],inf,x+35,y+41,3);}
  s+=`<text x="150" y="146" text-anchor="middle" font-size="7" letter-spacing="1.5" fill="#D4AF37" font-family="sans-serif" font-weight="700">LAGNA</text><text x="150" y="160" text-anchor="middle" font-size="11" font-weight="700" fill="#F4F1E8" font-family="sans-serif">${SIGNS[asc].name}</text></svg>`;
  return chUniq(s);}

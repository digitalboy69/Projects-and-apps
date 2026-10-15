/* ===== Yogas (redesigned) ===== */
const YG_CATS = {
  maha:{label:'Mahapurusha',icon:'👑',c:'#D4AF37'}, gaja:{label:'Wisdom & Fame',icon:'🐘',c:'#5EC4B7'},
  raja:{label:'Power & Status',icon:'⚜',c:'#E0A64A'}, swap:{label:'Exchange',icon:'⇄',c:'#8A6FB8'},
  rev:{label:'Reversal',icon:'↺',c:'#C95050'}, cancel:{label:'Cancellation',icon:'✚',c:'#5B8A9E'}
};
function buildYogaSection(chart){
  const y = chart.yogas, cards = [];
  y.panchaMahapurusha.forEach(p=> cards.push({cat:'maha', name:`${p.yoga} Yoga`, pl:[p.planet],
    detail:`Formed by <b>${p.planet}</b> placed in <b>${SIGNS[p.sign].name}</b> (House ${p.house}). ${YOGA_DESCRIPTIONS[p.yoga]}`}));
  if (y.gajaKesari) cards.push({cat:'gaja', name:'Gaja Kesari Yoga', pl:['Jupiter','Moon'],
    detail:`Jupiter (House ${y.gajaKesari.jupiterHouse}) sits in a kendra from the Moon (House ${y.gajaKesari.moonHouse}). One of the most cited yogas for reputation, wisdom, and steady success.`});
  y.rajaYogas.forEach(r=> cards.push({cat:'raja', name:'Raja Yoga', pl:[r.kendraLord,r.trikonaLord],
    detail:`The lord of a kendra house (<b>${r.kendraLord}</b>) and the lord of a trikona house (<b>${r.trikonaLord}</b>) are connected by ${r.type}. Classically associated with rising status and authority.`}));
  y.parivartana.forEach(p=> cards.push({cat:'swap', name:'Parivartana Yoga', pl:[p.lordA,p.lordB],
    detail:`House ${p.houseA} and House ${p.houseB} exchange lords: <b>${p.lordA}</b> and <b>${p.lordB}</b> each sit in the other's house. Strengthens both houses through mutual support.`}));
  y.viparitaRaja.forEach(v=> cards.push({cat:'rev', caution:true, name:v.yoga||'Viparita Raja Yoga', pl:[v.lordA,v.lordB],
    detail:`<b>${v.lordA}</b> rules House ${v.houseA} and sits in House ${v.houseB} (${v.type}). A dusthana lord in a dusthana destroys its own troubles — gains and success that rise out of hardship, enemies and setbacks.`}));
  y.neechaBhanga.forEach(n=> cards.push({cat:'cancel', name:'Neecha Bhanga Raja Yoga', pl:[n.planet,n.dispositor],
    detail:`<b>${n.planet}</b>'s debilitation is cancelled: its dispositor <b>${n.dispositor}</b> is ${n.condition}. A weakness in the chart converts toward strength.`}));

  if (!cards.length) return `<div class="yg"><div class="yoga-empty-state">No major classical yogas from this detection set were found in this chart. Covered: Pancha Mahapurusha, Gaja Kesari, Raja, Parivartana, Viparita Raja and Neecha Bhanga — many more exist in the classical texts.</div></div>`;

  const counts = {}; cards.forEach(c=> counts[c.cat]=(counts[c.cat]||0)+1);
  const good = cards.filter(c=>!c.caution).length;
  const chips = `<button type="button" class="yg-chip on" data-yg-f="all">All <b>${cards.length}</b></button>` +
    Object.keys(counts).map(k=>`<button type="button" class="yg-chip" data-yg-f="${k}" style="--cc:${YG_CATS[k].c}">${YG_CATS[k].icon} ${YG_CATS[k].label} <b>${counts[k]}</b></button>`).join('');
  const grid = cards.map(c=>{
    const k = YG_CATS[c.cat], first = c.detail.split(/\.\s/)[0] + '.';
    return `<div class="yoga-card yg-card ${c.caution?'yoga-caution':''}" data-yg-cat="${c.cat}" style="--cc:${k.c}">
      <button type="button" class="yg-head" data-yg-open>
        <span class="yg-ico">${k.icon}</span>
        <span class="yg-title"><b class="yoga-card-name">${c.name}</b><em>${k.label}</em></span>
        <span class="yg-chev">▸</span>
      </button>
      <div class="yg-pl">${[...new Set(c.pl)].map(p=>`<span class="yg-p" style="--pc:${DASHA_PLANET_COLORS[p]||'#888'}">${PLANET_GLYPHS[p]||''} ${p}</span>`).join('')}</div>
      <div class="yg-sum yoga-card-detail">${first}</div>
      <div class="yg-full yoga-card-detail" hidden>${c.detail}</div>
    </div>`;
  }).join('');
  return `<div class="yg">
    <div class="yg-hero">
      <div class="yg-big"><span>${cards.length}</span><small>yogas found</small></div>
      <div class="yg-big"><span style="color:var(--teal-bright)">${good}</span><small>supportive</small></div>
      <div class="yg-big"><span style="color:#E07070">${cards.length-good}</span><small>challenging</small></div>
    </div>
    <div class="yg-intro">Yogas are classical planet-house-sign combinations believed to colour a chart's themes. Filter by type, then tap a card to read what it means. This is a focused, verified set — not every yoga in the texts.</div>
    <div class="yg-chips">${chips}</div>
    <div class="yg-grid">${grid}</div>
  </div>`;
}
document.addEventListener('click', (e)=>{
  const f = e.target.closest('[data-yg-f]');
  if (f){
    const k = f.dataset.ygF;
    document.querySelectorAll('.yg-chip').forEach(c=>c.classList.toggle('on', c===f));
    document.querySelectorAll('.yg-card').forEach(c=>{ c.hidden = !(k==='all' || c.dataset.ygCat===k); });
    return;
  }
  const o = e.target.closest('[data-yg-open]');
  if (o){
    const card = o.closest('.yg-card'), full = card.querySelector('.yg-full'), sum = card.querySelector('.yg-sum');
    const open = full.hidden; full.hidden = !open; sum.hidden = open; card.classList.toggle('open', open);
  }
});


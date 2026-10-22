/* ============================================================================
   LIFE-EVENT CHECKER PRO (global LEE) — replaces rsBuildLife / rsRenderEvents / rsRunLife of 30-life-event-checker.js
   Needs: 97-life-event-catalog.js (LEC), 16 (rectifyPoint, shiftLocalDateTime), 10 (DASHA_*), 03 (getSiderealLongitudeAt).
   What is new vs the old checker
   - The dasha is RE-COMPUTED for every candidate birth minute (Moon moves, so the whole dasha timeline shifts).
   - Links = occupy + rule + graha drishti. Transits = Jupiter, Saturn (+ Mars, Rahu, Ketu, lighter).
   - Every event has sharpness (catalog) x date precision (day / month / year) as a weight.
   - Score per event = 0.50 dasha cover + 0.25 transit cover + 0.10 karaka + 0.15 double transit (all 0..1).
   - Confidence floor = min(luck test, reshuffle test, drop-one test) x evidence factor. Honest meaning in the UI.
   ============================================================================ */
const LE_PL = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const LE_ASP = { Mars:[4,7,8], Jupiter:[5,7,9], Saturn:[3,7,10] };       // houses counted from the planet (1 = itself)
const LE_TR_W = { Jupiter:1, Saturn:1, Mars:.5, Rahu:.5, Ketu:.5 };       // transit weights (sum 3.5)
const LE_SH = { 1:.6, 2:.8, 3:1 };                                         // catalog sharpness -> weight
const LE_PREC = {
  d:{ label:'Exact day',        icon:'🎯', w:1,   offs:[0] },
  m:{ label:'Within a month',   icon:'📅', w:.75, offs:[-15,0,15] },
  y:{ label:'Only the year',    icon:'🌫️', w:.45, offs:[-182,-91,0,91,182] }
};
const LE_YR = 365.25*86400000;
const LE_F = 61;                                                           // floats per (sample, event): 12 d + 12 t + 12 j + 12 s + 9 k + 4 spare
const LE_CW = {}, LE_CAT_IDS = [];
(function(){ LEC.list.forEach(c=>{ const w = new Float32Array(12); let sum = 0;
  c.p.forEach(h=>{ w[h-1] = 2; }); c.s.forEach(h=>{ if(!w[h-1]) w[h-1] = 1; });
  for (let i=0;i<12;i++) sum += w[i];
  LE_CW[c.id] = { w, sum, kidx:c.k.map(k=>LE_PL.indexOf(k)).filter(i=>i>-1) }; LE_CAT_IDS.push(c.id); }); })();

/* ---- Vimshottari lord at a date for a given Moon longitude (same 365.25-day convention as the main engine) ---- */
function leVim(moonLon, birthMs, evMs){
  const span = 360/27, ml = normDeg(moonLon), ni = Math.floor(ml/span), frac = (span - ml%span)/span;
  const sl = NAKSHATRAS[ni].lord, sIdx = DASHA_SEQUENCE.indexOf(sl);
  let t = (evMs - birthMs)/LE_YR + DASHA_YEARS[sl]*(1 - frac), i = sIdx, guard = 0;
  while (t >= DASHA_YEARS[DASHA_SEQUENCE[i%9]] && guard++ < 60){ t -= DASHA_YEARS[DASHA_SEQUENCE[i%9]]; i++; }
  const md = DASHA_SEQUENCE[i%9]; let len = DASHA_YEARS[md]; const out = [md];
  for (let lev=0; lev<2; lev++){
    const j0 = DASHA_SEQUENCE.indexOf(out[lev]); let found = out[lev], nl = len;
    for (let k=0;k<9;k++){ const lord = DASHA_SEQUENCE[(j0+k)%9], l = len*DASHA_YEARS[lord]/DASHA_TOTAL_YEARS;
      if (t < l || k===8){ found = lord; nl = l; break; } t -= l; }
    out.push(found); len = nl;
  }
  return out;                                                              // [Mahadasha, Antardasha, Pratyantardasha]
}
/* ---- houses (1..12 -> index 0..11) a natal planet is linked to from lagna L: sits, rules, aspects ---- */
function leLinks(P, L, sg, msign){
  const out = new Float32Array(12), hh = s=> ((s - L + 12)%12);
  const put = (i,v)=>{ if (v > out[i]) out[i] = v; };
  const sgn = P==='Moon' ? msign : sg[P]; if (sgn==null) return out;
  const node = P==='Rahu' || P==='Ketu', owner = node ? SIGNS[sgn].lord : P, base = hh(sgn);
  put(base, 1);
  for (let s=0;s<12;s++) if (SIGNS[s].lord===owner) put(hh(s), node ? .7 : 1);
  if (node){ const os = owner==='Moon' ? msign : sg[owner]; if (os!=null) put(hh(os), .7); }
  else (LE_ASP[P] || [7]).forEach(o=>{ if (o>1) put((base+o-1)%12, .5); });
  return out;
}
/* ---- houses a transiting planet (in sign ts) influences from lagna L ---- */
function leTransitInfl(P, ts, L){
  const out = new Float32Array(12), b = ((ts - L + 12)%12); out[b] = 1;
  if (P==='Jupiter' || P==='Saturn' || P==='Mars') (LE_ASP[P]).forEach(o=>{ if (o>1){ const i = (b+o-1)%12; if (out[i] < .75) out[i] = P==='Mars' ? .6 : .75; } });
  return out;
}
function leRng(seed){ let a = seed>>>0; return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a>>>15, 1|a); t = t + Math.imul(t ^ t>>>7, 61|t) ^ t; return ((t ^ t>>>14)>>>0)/4294967296; }; }
function leScoreAt(F, b, cw, sum, kidx){
  let d=0, t=0, pj=0, ps=0; const w = cw;
  for (let h=0; h<12; h++){ const x = w[h]; if (x){ d += x*F[b+h]; t += x*F[b+12+h];
    if (x===2){ if (F[b+24+h] > pj) pj = F[b+24+h]; if (F[b+36+h] > ps) ps = F[b+36+h]; } } }
  let kar = 0; for (let i=0;i<kidx.length;i++) kar += F[b+48+kidx[i]]; if (kar>1) kar = 1;
  return .5*d/(sum*2.5) + .25*t/(sum*3.5) + .1*kar + .15*pj*ps;
}
const leTick = ()=> new Promise(r=> setTimeout(r, 0));

/* ---- main analysis (pure: no DOM). o = { chart, prof, events, date, time, halfHours, K, B, onProgress } ---- */
async function leAnalyse(o){
  const chart = o.chart, prof = o.prof, tz = prof.tz || 0, prog = o.onProgress || (()=>{});
  const sg = {}; LE_PL.forEach(P=>{ if (P!=='Moon' && chart.planets[P]) sg[P] = chart.planets[P].sign; });
  // events -> date points with transit signs
  const evs = o.events.filter(e=> LEC.byId[e.c]).map(e=>{
    const c = LEC.byId[e.c], pr = LE_PREC[e.pr] ? e.pr : 'd', [y,m,d] = e.d.split('-').map(Number);
    const pts = LE_PREC[pr].offs.map(od=>{
      const ms = Date.UTC(y, m-1, d+od, 12) - tz*3600000, jd = ms/86400000 + 2440587.5, ra = getSiderealLongitudeAt('Rahu', jd);
      return { ms, tr:{ Jupiter:Math.floor(getSiderealLongitudeAt('Jupiter',jd)/30), Saturn:Math.floor(getSiderealLongitudeAt('Saturn',jd)/30),
        Mars:Math.floor(getSiderealLongitudeAt('Mars',jd)/30), Rahu:Math.floor(ra/30), Ketu:Math.floor(normDeg(ra+180)/30) }, tcache:{} };
    });
    return { e, c, pr, pts, w:LE_SH[c.sh]*LE_PREC[pr].w, cwo:LE_CW[c.id] };
  });
  const n = evs.length; if (!n) return null;
  // candidate birth moments
  const half = (o.halfHours || 3)*3600, S = o.S || 360, step = (2*half)/S, samples = [];
  for (let i=0;i<S;i++){
    const off = Math.round(-half + (i+.5)*step), sh = shiftLocalDateTime(o.date, o.time, off);
    const r = rectifyPoint(sh.dateStr, sh.timeStr, prof.lat, prof.lon, tz), L = r.asc.sign, ms = (r.jd - 2440587.5)*86400000;
    const links = {}; LE_PL.forEach(P=>{ links[P] = leLinks(P, L, sg, r.moon.sign); });
    samples.push({ off, L, moon:r.moon.longitude, birthMs:ms, links });
  }
  // state per (sample, event)
  const F = new Float32Array(S*n*LE_F), LW = [1,1,.5], KW = [1,.6,.3];
  for (let s=0;s<S;s++){ const sp = samples[s];
    for (let k=0;k<n;k++){ const ev = evs[k], b = (s*n+k)*LE_F, np = ev.pts.length;
      ev.pts.forEach(pt=>{
        const lords = leVim(sp.moon, sp.birthMs, pt.ms);
        lords.forEach((P,lv)=>{ const lk = sp.links[P]; for (let h=0;h<12;h++) F[b+h] += LW[lv]*lk[h]/np; F[b+48+LE_PL.indexOf(P)] += KW[lv]/np; });
        const tc = pt.tcache[sp.L] || (pt.tcache[sp.L] = (function(){ const t = new Float32Array(12);
          Object.keys(LE_TR_W).forEach(P=>{ const x = leTransitInfl(P, pt.tr[P], sp.L); for (let h=0;h<12;h++) t[h] += LE_TR_W[P]*x[h]; });
          return { t, j:leTransitInfl('Jupiter', pt.tr.Jupiter, sp.L), s:leTransitInfl('Saturn', pt.tr.Saturn, sp.L) }; })());
        for (let h=0;h<12;h++){ F[b+12+h] += tc.t[h]/np; F[b+24+h] += tc.j[h]/np; F[b+36+h] += tc.s[h]/np; }
      });
    }
  }
  const W = evs.map(e=>e.w), sumWt = W.reduce((a,b)=>a+b, 0);
  const E = new Float32Array(S*n);
  for (let s=0;s<S;s++) for (let k=0;k<n;k++){ const c = evs[k].cwo; E[s*n+k] = leScoreAt(F, (s*n+k)*LE_F, c.w, c.sum, c.kidx); }
  const Tof = (sel, wts, sumw)=>{ const T = new Float64Array(S); for (let s=0;s<S;s++){ let a = 0; for (let j=0;j<sel.length;j++) a += wts[j]*E[s*n+sel[j]]; T[s] = a/sumw; } return T; };
  const peak = (T, only)=>{
    let mx = -1, mn = 1e9, bi = -1;
    for (let s=0;s<S;s++){ if (T[s] < mn) mn = T[s]; if (only!=null && samples[s].L!==only) continue; if (T[s] > mx){ mx = T[s]; bi = s; } }
    if (bi<0) return null;
    const L = samples[bi].L, tau = mx - .03*(mx - mn), offs = [];
    for (let s=0;s<S;s++) if (samples[s].L===L && T[s] >= tau) offs.push(samples[s].off);
    offs.sort((a,b)=>a-b);
    return { L, T:mx, off:offs[Math.floor(offs.length/2)], s:bi, tau };
  };
  const all = evs.map((_,i)=>i), Tobs = Tof(all, W, sumWt), top = peak(Tobs);
  // seed: same input -> same confidence
  let seed = 7; evs.forEach(ev=>{ for (const ch of ev.e.c + ev.e.d + ev.pr) seed = (seed*31 + ch.charCodeAt(0))>>>0; });
  const rnd = leRng(seed);
  prog(.05, 'Checking each rising sign…');
  // bootstrap (reshuffle) + drop-one
  const B = o.B || 400; let sameSign = 0; const topOffs = [];
  for (let b=0;b<B;b++){ const sel = [], wts = []; let sw = 0;
    for (let j=0;j<n;j++){ const k = Math.floor(rnd()*n); sel.push(k); wts.push(W[k]); sw += W[k]; }
    const pk = peak(Tof(sel, wts, sw)); if (pk.L===top.L){ sameSign++; topOffs.push(pk.off); } }
  let loo = 0; if (n>1) for (let i=0;i<n;i++){ const sel = all.filter(x=>x!==i); const pk = peak(Tof(sel, sel.map(x=>W[x]), sel.reduce((a,x)=>a+W[x],0))); if (pk.L===top.L) loo++; }
  const P2 = sameSign/B, P3 = n>1 ? loo/n : 0;
  topOffs.sort((a,b)=>a-b);
  const q = f=> topOffs.length ? topOffs[Math.min(topOffs.length-1, Math.floor(f*topOffs.length))] : top.off;
  prog(.15, 'Testing against random life events…');
  // luck test: random event types, same dates, best fit anywhere in the window
  const K = Math.max(60, Math.min(o.K || 300, Math.floor(2.2e8/(S*n*70)))); let ge = 0;
  const pick = new Array(n);
  for (let r=0;r<K;r++){
    for (let j=0;j<n;j++) pick[j] = LE_CW[LE_CAT_IDS[Math.floor(rnd()*LE_CAT_IDS.length)]];
    let best = -1;
    for (let s=0;s<S;s++){ let a = 0; for (let j=0;j<n;j++){ const c = pick[j]; a += W[j]*leScoreAt(F, (s*n+j)*LE_F, c.w, c.sum, c.kidx); } if (a > best) best = a; }
    if (best/sumWt >= top.T - 1e-12) ge++;
    if (r%20===19){ prog(.15 + .8*r/K, 'Testing against random life events…'); await leTick(); }
  }
  const pLuck = (ge+1)/(K+1), P1 = Math.max(0, 1 - 4*pLuck);   // strict: p=5% -> 80%, p=25% or worse -> 0%
  // evidence amount: distinct themes count fully, repeats only partly
  const themes = {}; evs.forEach(ev=>{ const h = ev.c.house; (themes[h] = themes[h] || []).push(ev.w); });
  let nEff = 0; Object.keys(themes).forEach(h=>{ const a = themes[h]; nEff += (a.reduce((x,y)=>x+y,0)/a.length)*(1 + .35*(a.length-1)); });
  const Fv = 1 - Math.exp(-nEff/2.2), floor = Math.min(.99, Math.min(P1, P2, P3)*Fv);
  // per-sign ranking with per-event percentile (how much better than other event themes at that moment)
  const catScoresAt = (s, k)=>{ let lower = 0; const obs = E[s*n+k], b = (s*n+k)*LE_F;
    for (const id of LE_CAT_IDS){ const c = LE_CW[id]; if (leScoreAt(F, b, c.w, c.sum, c.kidx) < obs - 1e-9) lower++; }
    return lower/(LE_CAT_IDS.length-1); };
  const signs = {}; samples.forEach(sp=>{ signs[sp.L] = 1; });
  const ranked = Object.keys(signs).map(Ls=>{ const L = +Ls, pk = peak(Tobs, L);
    const runs = []; let cur = null;
    for (let s=0;s<S;s++){ const ok = samples[s].L===L && Tobs[s] >= pk.tau;
      if (ok){ if (cur && cur.e===s-1){ cur.e = s; cur.max = Math.max(cur.max, Tobs[s]); } else { cur = { a:s, e:s, max:Tobs[s] }; runs.push(cur); } } }
    runs.sort((x,y)=>y.max-x.max);
    const wins = runs.slice(0,2).map(r=>({ a:samples[r.a].off - step/2, b:samples[r.e].off + step/2, mid:Math.round((samples[r.a].off + samples[r.e].off)/2) }));
    const per = evs.map((ev,k)=>({ ev, sc:E[pk.s*n+k], pct:catScoresAt(pk.s, k) }));
    const fit = per.reduce((a,x,i)=> a + x.pct*W[i], 0)/sumWt;
    return { L, T:pk.T, off:pk.off, s:pk.s, fit, wins, per };
  }).sort((a,b)=>b.T - a.T);
  // plain-words reasons for the top sign
  const sp = samples[ranked[0].s];
  ranked[0].per.forEach((x,k)=>{ const ev = evs[k], c = ev.c, mid = ev.pts[Math.floor(ev.pts.length/2)], lords = leVim(sp.moon, sp.birthMs, mid.ms), lines = [];
    ['Mahadasha','Antardasha','Pratyantardasha'].forEach((nm,i)=>{ const lk = sp.links[lords[i]], hs = [];
      c.p.forEach(h=>{ if (lk[h-1]>0) hs.push('H'+h+' ★'); }); c.s.forEach(h=>{ if (lk[h-1]>0) hs.push('H'+h); });
      lines.push(nm+' '+lords[i]+(hs.length ? ' → '+hs.join(', ') : ': no link')); });
    ['Jupiter','Saturn'].forEach(P=>{ const inf = leTransitInfl(P, mid.tr[P], sp.L), hs = []; c.p.forEach(h=>{ if (inf[h-1]>0) hs.push('H'+h+' ★'); }); c.s.forEach(h=>{ if (inf[h-1]>=.75) hs.push('H'+h); });
      if (hs.length) lines.push(P+' transit reaches '+hs.join(', ')); });
    x.lines = lines; });
  prog(1, 'Done');
  return { n, S, step, half, ranked, top:ranked[0], close: ranked.length>1 && ranked[1].T >= ranked[0].T*.93,
    conf:{ P1, P2, P3, F:Fv, floor, pLuck, nEff, K, B },
    timeWin:{ lo:q(.1), hi:q(.9), mid:ranked[0].off },
    outliers: ranked[0].per.filter(x=>x.pct < .35) };
}

/* ============================ UI ============================ */
const leUI = { view:'house', q:'', sel:null, running:false };
function leFmt(off, date, time){ const sh = shiftLocalDateTime(date, time, Math.round(off)), day = sh.dateStr===date ? '' : (sh.dateStr>date?' +1d':' −1d'); return sh.timeStr.slice(0,5)+day; }
function leSharpLabel(sh){ return sh===3 ? 'Date: exact day' : sh===2 ? 'Date: to a few weeks' : 'Date: a phase (fuzzy)'; }
function leChip(e){ return `<button type="button" class="le-chip${leUI.sel===e.id?' on':''}${e.n?' neg':''}" data-le-pick="${e.id}" title="${rsEsc(e.plain)}"><span>${e.label}</span>${e.sh===3?'<i>🎯</i>':''}</button>`; }
function leGroups(){
  const q = leUI.q.trim().toLowerCase(), H = LEC.houses;
  let list = LEC.list.filter(e=> !q || (e.label+' '+e.plain+' '+e.id+' house '+e.house+' '+H[e.house-1].name+' '+e.k.join(' ')+' '+LEC.signs[e.house-1]).toLowerCase().indexOf(q) > -1);
  const g = [];
  if (leUI.view==='house') H.forEach(h=>{ const a = list.filter(e=>e.house===h.h); if (a.length) g.push({ t:`House ${h.h} · ${h.name}`, d:h.plain, a }); });
  else if (leUI.view==='planet') LE_PL.forEach(P=>{ const a = list.filter(e=>e.planet===P); if (a.length) g.push({ t:`${LEC.planets[P].icon} ${P}`, d:LEC.planets[P].plain, a }); });
  else if (leUI.view==='sign') H.forEach(h=>{ const a = list.filter(e=>e.house===h.h); if (a.length) g.push({ t:`${SIGNS[h.sign].symbol} ${LEC.signs[h.sign]}`, d:`Natural sign of house ${h.h}: ${h.signWords}`, a }); });
  else { const a = list.filter(e=>e.sh===3); H.forEach(h=>{ const b = a.filter(e=>e.house===h.h); if (b.length) g.push({ t:`🎯 ${h.name}`, d:'Events you can date to the exact day', a:b }); }); }
  return { g, count:list.length };
}
function leRenderCats(){
  const el = document.getElementById('leCats'); if (!el) return;
  const r = leGroups(), open = !!leUI.q.trim();
  el.innerHTML = r.g.length ? r.g.map((x,i)=>`<details class="le-grp"${(open||i===0||x.a.some(e=>e.id===leUI.sel))?' open':''}><summary><b>${x.t}</b><em>${x.a.length}</em><small>${rsEsc(x.d)}</small></summary><div class="le-chips">${x.a.map(leChip).join('')}</div></details>`).join('')
    : `<div class="rs-empty">No event matches “${rsEsc(leUI.q)}”. Try a simpler word like job, home, child, loan.</div>`;
  const c = document.getElementById('leCount'); if (c) c.textContent = r.count + ' of ' + LEC.count + ' events';
}
function leRenderSel(){
  const el = document.getElementById('leSel'); if (!el) return;
  const e = LEC.byId[leUI.sel];
  if (!e){ el.innerHTML = `<div class="le-sel-empty">👆 Tap an event above. It will be linked to houses, a planet and a sign automatically.</div>`; return; }
  const H = LEC.houses, sec = e.s.length ? e.s.map(h=>'H'+h).join(', ') : '—';
  el.innerHTML = `<div class="le-sel-t">${e.label}${e.n?' <u>hard event</u>':''}</div><div class="le-sel-p">${rsEsc(e.plain)}</div>
    <div class="le-tags"><span>Main: ${e.p.map(h=>`H${h} ${H[h-1].name}`).join(' + ')}</span><span>Also: ${sec}</span>
    <span>Planet: ${e.k.join(', ')}</span><span>${SIGNS[H[e.house-1].sign].symbol} ${LEC.signs[H[e.house-1].sign]}</span><span>${leSharpLabel(e.sh)}</span></div>`;
}
function leMeterData(){
  const evs = rsState.events.filter(e=>LEC.byId[e.c]), themes = {}; let nEff = 0; const hs = {};
  evs.forEach(e=>{ const c = LEC.byId[e.c], w = LE_SH[c.sh]*LE_PREC[e.pr||'d'].w; (themes[c.house] = themes[c.house] || []).push(w); c.p.forEach(h=>{ hs[h] = 1; }); });
  Object.keys(themes).forEach(h=>{ const a = themes[h]; nEff += (a.reduce((x,y)=>x+y,0)/a.length)*(1 + .35*(a.length-1)); });
  return { n:evs.length, nEff, cap:evs.length ? 1 - Math.exp(-nEff/2.2) : 0, hs };
}
function leRenderMeter(){
  const el = document.getElementById('leMeter'); if (!el) return;
  const m = leMeterData(), pct = Math.round(m.cap*100);
  el.innerHTML = `<div class="le-meter-top"><b>Evidence strength: ${pct}% max</b><span>${m.n} event${m.n===1?'':'s'} · ${m.nEff.toFixed(1)} independent</span></div>
    <div class="le-bar"><i style="width:${pct}%"></i></div>
    <div class="le-houses">${[1,2,3,4,5,6,7,8,9,10,11,12].map(h=>`<span class="${m.hs[h]?'on':''}" title="${LEC.houses[h-1].name}">${h}</span>`).join('')}</div>
    <div class="le-meter-tip">${!m.n?'Add events to see how strong your proof can get. ':''}${m.n&&pct<85?`Your final confidence can never exceed ${pct}% with this evidence. Add events from <b>different life areas</b> (lit numbers above show houses already covered) and prefer 🎯 exact-day events.`:m.n?'Good spread of evidence. The final confidence now depends on how well the events agree on one time.':''}</div>`;
}
function rsRenderEvents(){
  const el = document.getElementById('rsEvList'); if (!el) return;
  leRenderMeter();
  if (!rsState.events.length){ el.innerHTML = `<div class="rs-empty">No events yet. Pick one above and add its date. Marriage, a job, a child, a loan, a move all work well.</div>`; return; }
  el.innerHTML = rsState.events.map((e,i)=>{ const c = LEC.byId[e.c], pr = LE_PREC[e.pr||'d'];
    return `<span class="rs-evchip"><b>${c?c.label:rsEsc(e.c)}</b> · ${rsEsc(e.d)} ${pr.icon}${e.n?` · ${rsEsc(e.n)}`:''}<button type="button" data-rs-del="${i}" aria-label="Remove">✕</button></span>`; }).join('') +
    (rsState.events.length<5 ? `<div class="rs-empty" style="margin-top:8px">Tip: ${5-rsState.events.length} more event${5-rsState.events.length>1?'s':''} from different life areas would make the result much stronger.</div>` : '');
}
function rsBuildLife(p){
  p.innerHTML = `
  <div class="rs-pane-head"><h3>🌟 Life-Event Checker</h3><p>Real events are the best proof. We test every possible rising sign (and every minute) against your dashas and slow transits.</p></div>
  <details class="rs-how"><summary>💡 How it works (and how far to trust it)</summary>
    <p>For every minute in your search window we build the chart, work out the dasha for that exact minute, and ask: <em>at the date of each event, were the running dasha lords and the slow planets (Jupiter, Saturn, Mars, Rahu, Ketu) tied to the houses that rule that kind of event?</em>
    The events are then compared with the same chart scored against <b>random event types</b> to see if the fit is more than luck, and re-shuffled many times to see if the answer stays put.</p>
    <p><b>Confidence floor</b> = the weakest of three tests (not luck · stays same when events are reshuffled · stays same when one event is dropped) × how much independent evidence you gave. It tells you how consistent the answer is with the rules used here. It does <b>not</b> prove the astrological rules themselves, and it is not a guaranteed accuracy. Use it as a strong clue and confirm with Sandhi / Varga tools.</p></details>
  <div class="le-pick">
    <div class="le-pick-top"><input type="search" id="leSearch" placeholder="🔎 Search events: marriage, surgery, visa, loan…" autocomplete="off"><span id="leCount"></span></div>
    <div class="le-views" role="tablist">
      <button type="button" data-le-view="house" class="on">🏠 Life area</button><button type="button" data-le-view="planet">🪐 Planet</button>
      <button type="button" data-le-view="sign">♈ Sign</button><button type="button" data-le-view="best">🎯 Best for accuracy</button></div>
    <div id="leCats" class="le-cats"></div>
    <div id="leSel" class="le-sel"></div>
  </div>
  <input type="hidden" id="rsEvCat" value="">
  <div class="rs-ev-form">
    <label>Date<input type="date" id="rsEvDate"></label>
    <label>How sure is the date?<select id="leEvPrec"><option value="d">🎯 Exact day</option><option value="m">📅 Within a month</option><option value="y">🌫️ Only the year</option></select></label>
    <label class="grow">Note (optional)<input type="text" id="rsEvNote" maxlength="40" placeholder="e.g. first job"></label>
    <button type="button" class="btn btn-ghost" id="rsEvAdd">＋ Add event</button>
  </div>
  <div id="leMeter" class="le-meter"></div>
  <div id="rsEvList" class="rs-ev-list"></div>
  <div class="rs-ev-opts">
    <label>Search around your working time<select id="rsEvWin">
      <option value="12">Whole day · all 12 signs</option><option value="6">± 6 hours</option><option value="3" selected>± 3 hours</option><option value="1.5">± 90 minutes</option></select></label>
    <button type="button" class="btn btn-primary" id="rsEvRun">✨ Find the best-fitting rising sign</button>
    <button type="button" class="btn btn-ghost" id="leClear">🗑️ Clear events</button>
  </div>
  <div id="rsEvOut"></div>`;
  leRenderCats(); leRenderSel(); leRenderMeter();
  p.querySelector('#leSearch').addEventListener('input', e=>{ leUI.q = e.target.value; leRenderCats(); });
  p.querySelector('.le-views').addEventListener('click', e=>{ const b = e.target.closest('[data-le-view]'); if (!b) return;
    leUI.view = b.dataset.leView; p.querySelectorAll('[data-le-view]').forEach(x=>x.classList.toggle('on', x===b)); leRenderCats(); });
  p.querySelector('#leCats').addEventListener('click', e=>{ const b = e.target.closest('[data-le-pick]'); if (!b) return;
    leUI.sel = b.dataset.lePick; document.getElementById('rsEvCat').value = leUI.sel;
    p.querySelectorAll('.le-chip').forEach(x=>x.classList.toggle('on', x.dataset.lePick===leUI.sel)); leRenderSel();
    const d = document.getElementById('rsEvDate'); if (d) d.focus({ preventScroll:true }); });
  p.querySelector('#rsEvAdd').addEventListener('click', ()=>{
    const d = document.getElementById('rsEvDate').value, c = leUI.sel, n = document.getElementById('rsEvNote').value.trim(), pr = document.getElementById('leEvPrec').value;
    if (!c){ rsToast('Pick an event type first 👆'); return; }
    if (!d){ rsToast('Pick the event date first 📅'); return; }
    const p0 = currentProfileForExport;
    if (p0 && d < p0.dob){ rsToast('That date is before the birth date'); return; }
    rsState.events.push({ c, d, n, pr }); rsState.events.sort((a,b)=> a.d<b.d?-1:1);
    rsSaveEvents(); rsRenderEvents(); document.getElementById('rsEvDate').value = ''; document.getElementById('rsEvNote').value = '';
    rsToast('Event added ✓');
  });
  p.querySelector('#rsEvList').addEventListener('click', e=>{
    const b = e.target.closest('[data-rs-del]'); if (!b) return;
    rsState.events.splice(+b.dataset.rsDel, 1); rsSaveEvents(); rsRenderEvents();
  });
  p.querySelector('#leClear').addEventListener('click', ()=>{ if (!rsState.events.length) return; if (!confirm('Remove all events for this chart?')) return;
    rsState.events = []; rsSaveEvents(); rsRenderEvents(); document.getElementById('rsEvOut').innerHTML = ''; });
  p.querySelector('#rsEvRun').addEventListener('click', rsRunLife);
  p.addEventListener('click', e=>{
    const b = e.target.closest('[data-rs-use]'); if (!b) return;
    const off = +b.dataset.rsUse, dEl = document.getElementById('rectDate');
    const base = shiftLocalDateTime(dEl.value, document.getElementById('rectCenterTime').value, off);
    dEl.value = base.dateStr;
    const pr = base.timeStr.split(':').map(Number); rectHms = { h:pr[0], m:pr[1], s:pr[2]||0 }; updateHmsDisplay();
    rsToast('Dial set to ' + base.timeStr.slice(0,5) + ' ✓'); rsShow('dial', true);
  });
}
function leGrade(f){ return f>=.8 ? ['Strong','le-g4','Very likely the right window. Confirm with Sandhi / Varga tools.'] : f>=.6 ? ['Good','le-g3','A solid lead. Worth setting the dial and checking the chart.'] : f>=.4 ? ['Fair','le-g2','A useful clue, not yet proof. More events would sharpen it.'] : ['Weak','le-g1','Too little or too mixed evidence. Add more events from different life areas.']; }
function lePctWord(p){ return p>=.85 ? ['✅','Strong fit'] : p>=.6 ? ['🟢','Supports'] : p>=.35 ? ['➖','Neutral'] : ['❌','Poor fit']; }

async function rsRunLife(){
  const out = document.getElementById('rsEvOut'); if (!out || leUI.running) return;
  const chart = currentChartForModal, prof = currentProfileForExport;
  if (!chart || !prof){ out.innerHTML = `<div class="rs-empty">Generate a chart first.</div>`; return; }
  if (!rsState.events.length){ rsToast('Add at least one event first'); out.innerHTML = `<div class="rs-empty">Add some dated events above, then press the button again.</div>`; return; }
  const date = document.getElementById('rectDate').value, time = document.getElementById('rectCenterTime').value;
  const half = parseFloat(document.getElementById('rsEvWin').value);
  leUI.running = true;
  out.innerHTML = `<div class="le-prog"><div class="le-bar"><i id="leProgBar" style="width:3%"></i></div><span id="leProgTxt">Starting…</span></div>`;
  let r = null;
  try {
    r = await leAnalyse({ chart, prof, events:rsState.events, date, time, halfHours:half,
      onProgress:(f,t)=>{ const b = document.getElementById('leProgBar'), x = document.getElementById('leProgTxt'); if (b) b.style.width = Math.round(f*100)+'%'; if (x) x.textContent = t; } });
  } catch(err){ console.error('Life events', err); out.innerHTML = `<div class="rs-empty">Something went wrong while testing. Try fewer events or a smaller window.</div>`; leUI.running = false; return; }
  leUI.running = false;
  if (!r){ out.innerHTML = `<div class="rs-empty">None of the saved events could be read.</div>`; return; }
  const c = r.conf, gr = leGrade(c.floor), fm = off=> leFmt(off, date, time), top = r.top, sg = SIGNS[top.L];
  const bar = (lab, v, tip)=>`<div class="le-test"><span>${lab}</span><div class="le-bar"><i data-w="${Math.round(v*100)}"></i></div><em>${Math.round(v*100)}%</em><small>${tip}</small></div>`;
  const spreadMin = Math.round((r.timeWin.hi - r.timeWin.lo)/60);
  out.innerHTML = `
    <div class="le-hero ${gr[1]}">
      <div class="le-gauge"><b>${Math.round(c.floor*100)}%</b><span>minimum confidence</span></div>
      <div class="le-hero-txt"><div class="le-grade">${gr[0]} evidence</div>
        <div class="le-best">${sg.symbol} <b>${sg.name} rising</b> around <b>${fm(top.off)}</b></div>
        <div class="le-sub">Likely window ${fm(r.timeWin.lo)} – ${fm(r.timeWin.hi)}${spreadMin>0?` (about ${spreadMin} min wide)`:''}</div>
        <div class="le-sub">${gr[2]}</div>
        <button type="button" class="rs-seg" data-rs-use="${top.off}">🕰️ Set the Time Dial to ${fm(top.off)} <u>use ➜</u></button></div></div>
    <div class="le-tests"><div class="le-tests-h">How the minimum was worked out (lowest of the first three, times evidence)</div>
      ${bar('🍀 Not just luck', c.P1, `Random event types fit this well in only ${(c.pLuck*100).toFixed(1)}% of ${c.K} tries (needs under 5% to score 80%)`)}
      ${bar('🔀 Survives reshuffling', c.P2, `Same rising sign won in ${Math.round(c.P2*100)}% of ${c.B} re-sampled sets of your events`)}
      ${bar('✂️ Survives dropping one event', c.P3, 'Same sign when each single event is left out')}
      ${bar('📚 Amount of evidence', c.F, `${c.nEff.toFixed(1)} independent events (different life areas count most)`)}
    </div>
    <div class="rs-res-head">Ranking of possible rising signs <span>${r.n} event${r.n>1?'s':''} · ${r.S} minutes tested</span></div>
    ${r.ranked.map((x,i)=>{ const s2 = SIGNS[x.L], pct = Math.round(x.fit*100);
      return `<div class="rs-rank ${i===0?'top':''}"><div class="rs-rank-row"><span class="rs-rank-n">${i===0?'👑':i+1}</span><b>${s2.symbol} ${s2.name}</b>
        <div class="rs-bar"><i data-w="${pct}"></i></div><em>${pct}%</em></div>
        <div class="le-fitnote">Events fit this sign better than ${pct}% of other event types, on average.</div>
        <div class="rs-rank-segs">${x.wins.map(w=>`<button type="button" class="rs-seg" data-rs-use="${w.mid}" title="Set the dial to the middle of this window">🕰️ ${fm(w.a)} – ${fm(w.b)} <u>use ➜</u></button>`).join('')}</div>
        <details class="rs-why"><summary>Event by event</summary>${x.per.map(y=>{ const v = lePctWord(y.pct); return `<div class="rs-why-ev"><b>${v[0]} ${y.ev.c.label} · ${rsEsc(y.ev.e.d)}</b> <em class="le-v">${v[1]} · ${Math.round(y.pct*100)}%</em>${y.lines?`<ul>${y.lines.map(l=>`<li>${rsEsc(l)}</li>`).join('')}</ul>`:''}</div>`; }).join('')}</details></div>`; }).join('')}
    ${r.outliers.length ? `<div class="le-out">⚠️ <b>Events that disagree with the top answer:</b> ${r.outliers.map(x=>`${x.ev.c.label} (${rsEsc(x.ev.e.d)})`).join(', ')}. Double-check those dates or remove them. One wrong date can pull the whole result.</div>` : ''}
    <div class="rs-note">${r.close?'⚖️ <b>Close call.</b> The top signs are within 7%. Add more events or use the Sandhi / Varga tools. ':''}Times use your birth timezone. Score weights: dasha 50%, slow transits 25%, natural significator 10%, Jupiter+Saturn together 15%. The percentage is a consistency check of this method, not a guarantee. It supports your judgement, it does not replace it.</div>`;
  requestAnimationFrame(()=> requestAnimationFrame(()=> out.querySelectorAll('.rs-bar i,.le-bar i[data-w]').forEach(b=> b.style.width = b.dataset.w+'%')));
  rsToast('Done ✨ Top fit: ' + sg.name + ' · min confidence ' + Math.round(c.floor*100) + '%');
}
window.LEE = { analyse:leAnalyse, vim:leVim, links:leLinks, catalog:LEC };

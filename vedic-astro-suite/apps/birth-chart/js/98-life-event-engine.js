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

/* ============================ UI (redesigned) ============================ */
const leUI = { view:'house', q:'', sel:null, running:false, mood:'all', exact:false, prec:'d' };
const LE_VIEWS = [['house','🏠','Life area'],['theme','🎨','Theme'],['planet','🪐','Planet'],['sign','♈','Sign'],['who','👥','Who'],['stage','🧭','Life stage'],['acc','📅','Date accuracy']];
const LE_MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function leFmt(off, date, time){ const sh = shiftLocalDateTime(date, time, Math.round(off)), day = sh.dateStr===date ? '' : (sh.dateStr>date?' +1d':' −1d'); return sh.timeStr.slice(0,5)+day; }
function leFind(list, id){ for (let i=0;i<list.length;i++) if (list[i].id===id) return list[i]; return null; }
/* every browse view = a list of groups; an event can sit in several groups (e.g. two main houses, several planets) */
function leDefs(view){
  const H = LEC.houses, mk = (k,icon,title,desc,color,f,kind)=>({ k, icon, title, desc, color, f, kind:kind||'' });
  if (view==='house')  return H.map(h=> mk('h'+h.h, String(h.h), h.name, h.plain, LEC.hc[h.h-1], e=> e.p.indexOf(h.h)>-1, 'num'));
  if (view==='theme')  return LEC.themes.map(t=> mk(t.id, t.icon, t.name, t.plain, t.c, e=> e.theme===t.id));
  if (view==='planet') return LE_PL.map(P=> mk(P, LEC.planets[P].icon, P, LEC.planets[P].plain, LEC.pc[P], e=> e.k.indexOf(P)>-1));
  if (view==='sign')   return H.map(h=> mk('s'+h.sign, SIGNS[h.sign].symbol, LEC.signs[h.sign], 'Natural sign of house '+h.h+': '+h.signWords, LEC.ec[SIGNS[h.sign].element], e=> e.p.indexOf(h.h)>-1, 'glyph'));
  if (view==='who')    return LEC.whoList.map(w=> mk(w.id, w.icon, w.name, w.plain, w.c, e=> e.who===w.id));
  if (view==='stage')  return LEC.stages.map(t=> mk(t.id, t.icon, t.name, t.plain, t.c, e=> e.stage===t.id));
  return LEC.accs.map(a=> mk('a'+a.id, a.icon, a.name, a.plain, a.c, e=> e.acc===a.id));
}
function leHay(e){
  if (e._hay) return e._hay;
  const hs = e.p.concat(e.s).map(h=> 'house '+h+' '+LEC.houses[h-1].name+' '+LEC.signs[h-1]);
  return e._hay = (e.name+' '+e.plain+' '+e.id+' '+e.k.join(' ')+' '+hs.join(' ')+' '+leFind(LEC.themes,e.theme).name+' '+leFind(LEC.whoList,e.who).name+' '+leFind(LEC.stages,e.stage).name+' '+leFind(LEC.moods,e.mood).name).toLowerCase();
}
function leVisible(e){
  if (leUI.mood!=='all' && e.mood!==leUI.mood) return false;
  if (leUI.exact && e.acc!==3) return false;
  const q = leUI.q.trim().toLowerCase(); if (q && q.split(/\s+/).some(w=> leHay(e).indexOf(w) < 0)) return false;
  return true;
}
function leChipHTML(e){
  return `<button type="button" class="le-chip${leUI.sel===e.id?' on':''}${e.mood==='hard'?' hard':''}" data-le-pick="${e.id}" title="${rsEsc(e.plain)}"><span class="le-cemo">${e.emoji}</span><span class="le-ctxt">${rsEsc(e.name)}</span>${e.acc===3?'<span class="le-cdot" title="Exact day"></span>':''}</button>`;
}
function leRenderCats(){
  const el = document.getElementById('leCats'); if (!el) return;
  const vis = LEC.list.filter(leVisible), filtered = !!leUI.q.trim() || leUI.mood!=='all' || leUI.exact;
  const groups = leDefs(leUI.view).map(d=>({ d, a:vis.filter(d.f) })).filter(g=> g.a.length);
  el.innerHTML = groups.length ? groups.map((g,i)=>{ const d = g.d, open = filtered || i===0 || g.a.some(e=>e.id===leUI.sel);
    return `<details class="le-grp" data-gi="${i}" style="--gc:${d.color}"${open?' open':''}><summary><span class="le-gico ${d.kind}">${d.icon}</span><span class="le-gtxt"><span class="le-gtitle">${rsEsc(d.title)}</span><span class="le-gdesc">${rsEsc(d.desc)}</span></span><span class="le-gcnt">${g.a.length}</span></summary><div class="le-chips">${open ? g.a.map(leChipHTML).join('') : ''}</div></details>`; }).join('')
    : `<div class="le-none"><div class="le-none-ico">🔍</div>No event matches. Try a simpler word like job, home, child, loan, or clear the filters.</div>`;
  leUI.groups = groups;   // closed groups fill their chips the moment they are opened (keeps the screen light)
  const c = document.getElementById('leCount'); if (c) c.innerHTML = `<b>${vis.length}</b><span class="le-cof"> of ${LEC.count} events</span>`;
}
function lePill(lab, val, color){ return `<span class="le-pill" style="--pc:${color}"><span class="le-pl">${lab}</span><span class="le-pv">${val}</span></span>`; }
function leRenderSel(){
  const el = document.getElementById('leSel'), af = document.getElementById('leAddFor'); if (!el) return;
  const e = leFind(LEC.list, leUI.sel);
  if (!e){ el.innerHTML = `<div class="le-sel-empty"><span class="le-sel-hand">👆</span><span>Tap any event above. You will see how it links to houses, planets, signs and more.</span></div>`;
    if (af) af.innerHTML = `<span class="le-addfor-none">No event picked yet</span>`; return; }
  const H = LEC.houses, th = leFind(LEC.themes,e.theme), wh = leFind(LEC.whoList,e.who), sg = leFind(LEC.stages,e.stage), md = leFind(LEC.moods,e.mood), ac = leFind(LEC.accs,e.acc);
  el.innerHTML = `<div class="le-pass" style="--gc:${th.c}"><div class="le-pass-top"><span class="le-pass-emo">${e.emoji}</span><div><div class="le-pass-t">${rsEsc(e.name)}</div><div class="le-pass-p">${rsEsc(e.plain)}</div></div></div>
    <div class="le-pills">
      ${e.p.map(h=> lePill('Main area', `H${h} · ${H[h-1].name}`, LEC.hc[h-1])).join('')}
      ${e.s.length ? lePill('Also touches', e.s.map(h=>'H'+h).join(' · '), '#94a3b8') : ''}
      ${e.k.map(k=> lePill('Planet', k, LEC.pc[k])).join('')}
      ${e.p.map(h=> lePill('Sign', SIGNS[H[h-1].sign].symbol+' '+LEC.signs[H[h-1].sign], LEC.ec[SIGNS[H[h-1].sign].element])).join('')}
      ${lePill('Theme', th.name, th.c)}${lePill('About', wh.name, wh.c)}${lePill('Life stage', sg.name, sg.c)}${lePill('Mood', md.name, md.c)}${lePill('Date', ac.name, ac.c)}
    </div></div>`;
  if (af) af.innerHTML = `<span class="le-addfor-emo">${e.emoji}</span><span class="le-addfor-t">${rsEsc(e.name)}</span><span class="le-addfor-s">${ac.name.toLowerCase()} works best</span>`;
}
/* evidence meter: 12-house wheel (lit = covered by your events) */
function leMeterData(){
  const evs = rsState.events.filter(e=>LEC.byId[e.c]), themes = {}; let nEff = 0; const hs = {};
  evs.forEach(e=>{ const c = LEC.byId[e.c], w = LE_SH[c.sh]*LE_PREC[e.pr||'d'].w; (themes[c.house] = themes[c.house] || []).push(w); c.p.forEach(h=>{ hs[h] = 1; }); });
  Object.keys(themes).forEach(h=>{ const a = themes[h]; nEff += (a.reduce((x,y)=>x+y,0)/a.length)*(1 + .35*(a.length-1)); });
  return { n:evs.length, nEff, cap:evs.length ? 1 - Math.exp(-nEff/2.2) : 0, hs };
}
function leWheel(hs, pct){
  const cx = 70, cy = 70, R = 62, r = 38, seg = [];
  const pt = (rad, a)=> [cx + rad*Math.cos(a), cy + rad*Math.sin(a)];
  for (let i=0;i<12;i++){
    const a0 = (-90 + i*30 + 1.6)*Math.PI/180, a1 = (-90 + (i+1)*30 - 1.6)*Math.PI/180, p0 = pt(R,a0), p1 = pt(R,a1), p2 = pt(r,a1), p3 = pt(r,a0), am = (a0+a1)/2, tp = pt((R+r)/2, am);
    seg.push(`<path d="M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A${R} ${R} 0 0 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${p2[0].toFixed(1)} ${p2[1].toFixed(1)} A${r} ${r} 0 0 0 ${p3[0].toFixed(1)} ${p3[1].toFixed(1)}Z" class="le-wseg${hs[i+1]?' on':''}" style="--wc:${LEC.hc[i]}"><title>House ${i+1}: ${LEC.houses[i].name}</title></path><text x="${tp[0].toFixed(1)}" y="${(tp[1]+3.4).toFixed(1)}" class="le-wnum${hs[i+1]?' on':''}" text-anchor="middle">${i+1}</text>`);
  }
  return `<svg class="le-wheel" viewBox="0 0 140 140" role="img" aria-label="Houses covered by your events">${seg.join('')}<text x="70" y="68" class="le-wpct" text-anchor="middle">${pct}%</text><text x="70" y="83" class="le-wlab" text-anchor="middle">MAX PROOF</text></svg>`;
}
function leRenderMeter(){
  const el = document.getElementById('leMeter'); if (!el) return;
  const m = leMeterData(), pct = Math.round(m.cap*100), cov = Object.keys(m.hs).length;
  el.innerHTML = `<div class="le-meter-in">${leWheel(m.hs, pct)}<div class="le-meter-txt">
    <div class="le-meter-h">Evidence strength</div>
    <div class="le-meter-stats"><span class="le-stat"><b>${m.n}</b> event${m.n===1?'':'s'}</span><span class="le-stat"><b>${m.nEff.toFixed(1)}</b> independent</span><span class="le-stat"><b>${cov}</b>/12 houses</span></div>
    <div class="le-meter-tip">${!m.n ? 'Add your first event to start building proof. Each lit slice is a house your events already cover.'
      : pct<85 ? `Your final confidence cannot exceed <b>${pct}%</b> yet. Add events from <b>different life areas</b> (dark slices) and prefer exact-day events.`
      : 'Great spread. The final confidence now depends on how well the events agree on one birth time.'}</div></div></div>`;
}
function leAge(dob, d){ if (!dob) return ''; const y = (new Date(d+'T12:00:00Z') - new Date(dob+'T12:00:00Z'))/(365.25*86400000); return y>=0 ? 'age '+Math.floor(y) : ''; }
function rsRenderEvents(){
  const el = document.getElementById('rsEvList'); if (!el) return;
  leRenderMeter();
  const cnt = document.getElementById('leEvCount'); if (cnt) cnt.textContent = rsState.events.length ? rsState.events.length+' added' : '';
  if (!rsState.events.length){ el.innerHTML = `<div class="le-empty"><div class="le-empty-ico">🌠</div><b>No events yet</b><span>Pick an event, add its date, and it appears here. Marriage, a job, a child, a loan, a move all work well.</span></div>`; return; }
  const dob = (currentProfileForExport || {}).dob;
  el.innerHTML = `<div class="le-tl">` + rsState.events.map((e,i)=>{ const c = LEC.byId[e.c], pr = LE_PREC[e.pr||'d'], th = c ? leFind(LEC.themes,c.theme) : null, p = (e.d||'').split('-');
    return `<div class="le-ev" style="--cc:${th?th.c:'#e9b949'}"><div class="le-evd"><span class="le-evd-day">${+p[2]||''}</span><span class="le-evd-mon">${LE_MON[(+p[1]||1)-1]}</span><span class="le-evd-yr">${p[0]||''}</span></div>
      <div class="le-evm"><div class="le-evt">${c?`<span class="le-evemo">${c.emoji}</span>${rsEsc(c.name)}`:rsEsc(e.c)}</div><div class="le-evs"><span class="le-evprec">${pr.icon} ${pr.label}</span>${leAge(dob,e.d)?`<span class="le-evage">${leAge(dob,e.d)}</span>`:''}${e.n?`<span class="le-evnote">“${rsEsc(e.n)}”</span>`:''}</div></div>
      <button type="button" class="le-evx" data-rs-del="${i}" aria-label="Remove">✕</button></div>`; }).join('') + `</div>` +
    (rsState.events.length<5 ? `<div class="le-tip">💡 ${5-rsState.events.length} more event${5-rsState.events.length>1?'s':''} from different life areas will make the answer much stronger.</div>` : '');
}
function rsBuildLife(p){
  p.innerHTML = `<div class="le-root">
  <div class="le-hero-head"><div class="le-orb" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="le-hh-txt"><div class="le-eyebrow">✦ Life-Event Checker</div><h3>Prove the birth time with your real life</h3>
    <p>Tell us what happened and when. We test every possible rising sign, minute by minute, against your dashas and slow transits.</p>
    <div class="le-hh-stats"><span class="le-hstat"><b>${LEC.count}</b> events</span><span class="le-hstat"><b>7</b> ways to browse</span><span class="le-hstat"><b>3</b> confidence tests</span></div></div></div>
  <details class="rs-how le-how"><summary>💡 How it works (and how far to trust it)</summary>
    <p>For every minute in your search window we build the chart, work out the dasha for that exact minute, and ask: <em>on the date of each event, were the running dasha lords and the slow planets (Jupiter, Saturn, Mars, Rahu, Ketu) tied to the houses that rule that kind of event?</em>
    The events are then compared with the same chart scored against <b>random event types</b> to see if the fit is more than luck, and re-shuffled many times to see if the answer stays put.</p>
    <p><b>Minimum confidence</b> = the weakest of three tests (not luck · stays the same when events are reshuffled · stays the same when one event is dropped) × how much independent evidence you gave. It tells you how consistent the answer is with the rules used here. It does <b>not</b> prove the astrological rules themselves and it is not a guaranteed accuracy. Use it as a strong clue and confirm with the Sandhi / Varga tools.</p></details>

  <section class="le-card"><div class="le-step-h"><span class="le-num">1</span><div><b>Pick what happened</b><small>Browse by area, theme, planet, sign, person, age or how exact the date is</small></div><span id="leCount" class="le-count"></span></div>
    <div class="le-search"><span class="le-sico">🔎</span><input type="search" id="leSearch" placeholder="Search: marriage, surgery, visa, loan, mother…" autocomplete="off"></div>
    <div class="le-views" role="tablist">${LE_VIEWS.map((v,i)=>`<button type="button" data-le-view="${v[0]}" class="le-vbtn${i===0?' on':''}"><span class="le-vi">${v[1]}</span>${v[2]}</button>`).join('')}</div>
    <div class="le-filters"><span class="le-flab">Show</span>
      <button type="button" class="le-fp on" data-le-mood="all">All</button>${LEC.moods.map(m=>`<button type="button" class="le-fp" data-le-mood="${m.id}" style="--pc:${m.c}">${m.icon} ${m.name}</button>`).join('')}
      <button type="button" class="le-fp le-fx" data-le-exact="1">🎯 Exact-day only</button></div>
    <div id="leCats" class="le-cats"></div>
    <div id="leSel" class="le-sel"></div></section>

  <input type="hidden" id="rsEvCat" value="">
  <section class="le-card" id="leAddCard"><div class="le-step-h"><span class="le-num">2</span><div><b>Add the date</b><small>An exact day is best. A month or a year still helps a little.</small></div></div>
    <div class="le-addfor" id="leAddFor"></div>
    <div class="le-form">
      <label class="le-fld"><span class="le-flbl">Date</span><input type="date" id="rsEvDate"></label>
      <div class="le-fld"><span class="le-flbl">How sure is the date?</span><div class="le-seg3" id="lePrecSeg">${Object.keys(LE_PREC).map((k,i)=>`<button type="button" class="le-sg${i===0?' on':''}" data-le-prec="${k}"><span class="le-sgi">${LE_PREC[k].icon}</span>${LE_PREC[k].label}</button>`).join('')}</div></div>
      <label class="le-fld grow"><span class="le-flbl">Note (optional)</span><input type="text" id="rsEvNote" maxlength="40" placeholder="e.g. first job in Pune"></label>
      <button type="button" class="le-btn le-btn-gold" id="rsEvAdd"><span class="le-plus">＋</span> Add event</button>
    </div></section>

  <section class="le-card"><div class="le-step-h"><span class="le-num">3</span><div><b>Your events</b><small>The more different life areas you cover, the stronger the proof</small></div><span id="leEvCount" class="le-count"></span></div>
    <div id="leMeter" class="le-meter"></div><div id="rsEvList" class="le-evlist"></div></section>

  <section class="le-card le-run"><div class="le-step-h"><span class="le-num">4</span><div><b>Find the birth time</b><small>Choose how wide to search, then run the test</small></div></div>
    <div class="le-runrow"><label class="le-fld grow"><span class="le-flbl">Search around your working time</span><select id="rsEvWin">
      <option value="12">Whole day · all 12 signs</option><option value="6">± 6 hours</option><option value="3" selected>± 3 hours</option><option value="1.5">± 90 minutes</option></select></label></div>
    <div class="le-actions"><button type="button" class="le-btn le-btn-go" id="rsEvRun"><span class="le-spark">✨</span> Find the best-fitting rising sign</button>
      <button type="button" class="le-btn le-btn-ghost" id="leClear">🗑️ Clear events</button></div></section>
  <div id="rsEvOut"></div></div>`;
  leRenderCats(); leRenderSel(); rsRenderEvents();
  const q = s=> p.querySelector(s), add = ()=> q('#rsEvAdd').click();
  q('#leSearch').addEventListener('input', e=>{ leUI.q = e.target.value; leRenderCats(); });
  q('.le-views').addEventListener('click', e=>{ const b = e.target.closest('[data-le-view]'); if (!b) return;
    leUI.view = b.dataset.leView; p.querySelectorAll('[data-le-view]').forEach(x=>x.classList.toggle('on', x===b)); leRenderCats(); });
  q('.le-filters').addEventListener('click', e=>{ const m = e.target.closest('[data-le-mood]'), x = e.target.closest('[data-le-exact]');
    if (m){ leUI.mood = m.dataset.leMood; p.querySelectorAll('[data-le-mood]').forEach(b=>b.classList.toggle('on', b===m)); }
    else if (x){ leUI.exact = !leUI.exact; x.classList.toggle('on', leUI.exact); } else return; leRenderCats(); });
  q('#leCats').addEventListener('toggle', e=>{ const d = e.target; if (!d.open || d.dataset.gi==null) return;
    const c = d.querySelector('.le-chips'), g = (leUI.groups||[])[+d.dataset.gi]; if (c && g && !c.firstChild) c.innerHTML = g.a.map(leChipHTML).join(''); }, true);
  q('#leCats').addEventListener('click', e=>{ const b = e.target.closest('[data-le-pick]'); if (!b) return;
    leUI.sel = b.dataset.lePick; q('#rsEvCat').value = leUI.sel;
    p.querySelectorAll('.le-chip').forEach(x=>x.classList.toggle('on', x.dataset.lePick===leUI.sel)); leRenderSel();
    const ev = LEC.byId[leUI.sel]; if (ev){ leUI.prec = ev.acc===3 ? 'd' : ev.acc===2 ? 'm' : 'y'; p.querySelectorAll('[data-le-prec]').forEach(x=>x.classList.toggle('on', x.dataset.lePrec===leUI.prec)); }
    const sl = q('#leSel'); if (sl && sl.scrollIntoView) sl.scrollIntoView({ block:'nearest', behavior:'smooth' }); });
  q('#lePrecSeg').addEventListener('click', e=>{ const b = e.target.closest('[data-le-prec]'); if (!b) return; leUI.prec = b.dataset.lePrec;
    p.querySelectorAll('[data-le-prec]').forEach(x=>x.classList.toggle('on', x===b)); });
  q('#rsEvDate').addEventListener('keydown', e=>{ if (e.key==='Enter'){ e.preventDefault(); add(); } });
  q('#rsEvAdd').addEventListener('click', ()=>{
    const d = q('#rsEvDate').value, c = leUI.sel, n = q('#rsEvNote').value.trim(), pr = leUI.prec;
    if (!c){ rsToast('Pick an event type first 👆'); return; }
    if (!d){ rsToast('Pick the event date first 📅'); return; }
    const p0 = currentProfileForExport;
    if (p0 && d < p0.dob){ rsToast('That date is before the birth date'); return; }
    rsState.events.push({ c, d, n, pr }); rsState.events.sort((a,b)=> a.d<b.d?-1:1);
    rsSaveEvents(); rsRenderEvents(); q('#rsEvDate').value = ''; q('#rsEvNote').value = '';
    rsToast('Event added ✓');
  });
  q('#rsEvList').addEventListener('click', e=>{
    const b = e.target.closest('[data-rs-del]'); if (!b) return;
    rsState.events.splice(+b.dataset.rsDel, 1); rsSaveEvents(); rsRenderEvents();
  });
  q('#leClear').addEventListener('click', ()=>{ if (!rsState.events.length) return; if (!confirm('Remove all events for this chart?')) return;
    rsState.events = []; rsSaveEvents(); rsRenderEvents(); q('#rsEvOut').innerHTML = ''; });
  q('#rsEvRun').addEventListener('click', rsRunLife);
  p.addEventListener('click', e=>{
    const b = e.target.closest('[data-rs-use]'); if (!b) return;
    const off = +b.dataset.rsUse, dEl = document.getElementById('rectDate');
    const base = shiftLocalDateTime(dEl.value, document.getElementById('rectCenterTime').value, off);
    dEl.value = base.dateStr;
    const pr = base.timeStr.split(':').map(Number); rectHms = { h:pr[0], m:pr[1], s:pr[2]||0 }; updateHmsDisplay();
    rsToast('Dial set to ' + base.timeStr.slice(0,5) + ' ✓'); rsShow('dial', true);
  });
}
function leGrade(f){ return f>=.8 ? ['Strong','le-g4','Very likely the right window. Confirm with the Sandhi / Varga tools.'] : f>=.6 ? ['Good','le-g3','A solid lead. Worth setting the dial and checking the chart.'] : f>=.4 ? ['Fair','le-g2','A useful clue, not yet proof. More events would sharpen it.'] : ['Weak','le-g1','Too little or too mixed evidence. Add more events from different life areas.']; }
function lePctWord(p){ return p>=.85 ? ['✅','Strong fit','#5fcf8d'] : p>=.6 ? ['🟢','Supports','#9be28f'] : p>=.35 ? ['➖','Neutral','#94a3b8'] : ['❌','Poor fit','#ff7a6b']; }
function leRing(v, size, sw, cls){
  const r = (size - sw)/2, C = 2*Math.PI*r, c = size/2;
  return `<svg class="le-ring ${cls||''}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><defs><linearGradient id="leGrad${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d775"/><stop offset="1" stop-color="#4fd1c5"/></linearGradient></defs>
    <circle class="le-ring-bg" cx="${c}" cy="${c}" r="${r}" stroke-width="${sw}"/><circle class="le-ring-fg" cx="${c}" cy="${c}" r="${r}" stroke-width="${sw}" stroke="url(#leGrad${size})" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}" data-off="${(C*(1-v)).toFixed(1)}" transform="rotate(-90 ${c} ${c})"/></svg>`;
}
async function rsRunLife(){
  const out = document.getElementById('rsEvOut'); if (!out || leUI.running) return;
  const chart = currentChartForModal, prof = currentProfileForExport;
  if (!chart || !prof){ out.innerHTML = `<div class="le-empty"><b>Generate a chart first</b></div>`; return; }
  if (!rsState.events.length){ rsToast('Add at least one event first'); out.innerHTML = `<div class="le-empty"><div class="le-empty-ico">🌠</div><b>Add some dated events first</b><span>Then press the button again.</span></div>`; return; }
  const date = document.getElementById('rectDate').value, time = document.getElementById('rectCenterTime').value;
  const half = parseFloat(document.getElementById('rsEvWin').value);
  leUI.running = true; const btn = document.getElementById('rsEvRun'); if (btn) btn.classList.add('busy');
  out.innerHTML = `<div class="le-prog"><div class="le-prog-orb"><i></i><i></i></div><div class="le-prog-txt"><b id="leProgTxt">Starting…</b><div class="le-bar"><i id="leProgBar" style="width:3%"></i></div><small>Testing minutes, signs and random look-alikes. This takes a few seconds.</small></div></div>`;
  out.scrollIntoView && out.scrollIntoView({ block:'nearest', behavior:'smooth' });
  let r = null;
  try {
    r = await leAnalyse({ chart, prof, events:rsState.events, date, time, halfHours:half,
      onProgress:(f,t)=>{ const b = document.getElementById('leProgBar'), x = document.getElementById('leProgTxt'); if (b) b.style.width = Math.round(f*100)+'%'; if (x) x.textContent = t; } });
  } catch(err){ console.error('Life events', err); out.innerHTML = `<div class="le-empty"><b>Something went wrong</b><span>Try fewer events or a smaller window.</span></div>`; leUI.running = false; if (btn) btn.classList.remove('busy'); return; }
  leUI.running = false; if (btn) btn.classList.remove('busy');
  if (!r){ out.innerHTML = `<div class="le-empty"><b>None of the saved events could be read.</b></div>`; return; }
  const c = r.conf, gr = leGrade(c.floor), fm = off=> leFmt(off, date, time), top = r.top, sg = SIGNS[top.L];
  const spreadMin = Math.round((r.timeWin.hi - r.timeWin.lo)/60);
  const tcard = (ico, lab, v, tip)=>`<div class="le-tcard">${leRing(v, 56, 6, 'mini')}<div class="le-tc-v">${Math.round(v*100)}%</div><div class="le-tc-t"><b>${lab}</b><small>${tip}</small></div></div>`;
  out.innerHTML = `
    <div class="le-result ${gr[1]}">
      <div class="le-rhero"><div class="le-gauge">${leRing(c.floor, 132, 11, 'big')}<div class="le-gauge-in"><b>${Math.round(c.floor*100)}%</b><span>minimum<br>confidence</span></div></div>
        <div class="le-rtxt"><span class="le-badge">${gr[0]} evidence</span>
          <div class="le-rbest"><span class="le-rglyph" style="color:${LEC.ec[sg.element]}">${sg.symbol}</span><span><b>${sg.name}</b> rising<small>around <b>${fm(top.off)}</b></small></span></div>
          <div class="le-rsub">Likely window <b>${fm(r.timeWin.lo)} – ${fm(r.timeWin.hi)}</b>${spreadMin>0?` · about ${spreadMin} min wide`:''}</div>
          <div class="le-rsub dim">${gr[2]}</div>
          <button type="button" class="le-btn le-btn-gold le-usebtn" data-rs-use="${top.off}">🕰️ Set the Time Dial to ${fm(top.off)} <span class="le-arrow">➜</span></button></div></div>
      <div class="le-tests-h">How the minimum was worked out <small>lowest of the first three, then times the evidence</small></div>
      <div class="le-tgrid">
        ${tcard('🍀','Not just luck', c.P1, `Random event types matched this well in ${(c.pLuck*100).toFixed(1)}% of ${c.K} tries. Under 5% scores 80%.`)}
        ${tcard('🔀','Survives reshuffling', c.P2, `Same sign won in ${Math.round(c.P2*100)}% of ${c.B} re-sampled sets of your events.`)}
        ${tcard('✂️','Survives dropping one', c.P3, 'Same sign when each single event is left out.')}
        ${tcard('📚','Amount of evidence', c.F, `${c.nEff.toFixed(1)} independent events. Different life areas count most.`)}
      </div></div>
    ${r.outliers.length ? `<div class="le-out"><span class="le-out-ico">⚠️</span><div><b>These events disagree with the top answer</b><br>${r.outliers.map(x=>`${x.ev.c.emoji} ${rsEsc(x.ev.c.name)} (${rsEsc(x.ev.e.d)})`).join(' · ')}<br><small>Double-check those dates or remove them. One wrong date can pull the whole result.</small></div></div>` : ''}
    <div class="le-rank-h">Ranking of possible rising signs <span>${r.n} event${r.n>1?'s':''} · ${r.S} minutes tested</span></div>
    ${r.ranked.map((x,i)=>{ const s2 = SIGNS[x.L], pct = Math.round(x.fit*100);
      return `<article class="le-rank${i===0?' top':''}" style="--ec:${LEC.ec[s2.element]}"><div class="le-rk-head"><span class="le-rk-n">${i===0?'👑':i+1}</span><span class="le-rk-glyph">${s2.symbol}</span><span class="le-rk-name"><b>${s2.name}</b><small>Events fit better than ${pct}% of other event types</small></span><span class="le-rk-pct">${pct}%</span></div>
        <div class="le-bar"><i data-w="${pct}"></i></div>
        <div class="le-wins">${x.wins.map(w=>`<button type="button" class="le-win" data-rs-use="${w.mid}" title="Set the dial to the middle of this window">🕰️ ${fm(w.a)} – ${fm(w.b)} <span class="le-arrow">use ➜</span></button>`).join('')}</div>
        <details class="le-why"><summary>Event by event</summary><div class="le-vlist">${x.per.map(y=>{ const v = lePctWord(y.pct);
          return `<div class="le-vrow" style="--vc:${v[2]}"><div class="le-vhead"><span class="le-vemo">${y.ev.c.emoji}</span><span class="le-vname">${rsEsc(y.ev.c.name)} <small>${rsEsc(y.ev.e.d)}</small></span><span class="le-vtag">${v[0]} ${v[1]} · ${Math.round(y.pct*100)}%</span></div>${y.lines?`<ul>${y.lines.map(l=>`<li>${rsEsc(l)}</li>`).join('')}</ul>`:''}</div>`; }).join('')}</div></details></article>`; }).join('')}
    <div class="le-note">${r.close?'⚖️ <b>Close call.</b> The top signs are within 7%. Add more events or use the Sandhi / Varga tools. ':''}Times use your birth timezone. Score weights: dasha 50%, slow transits 25%, natural significator 10%, Jupiter + Saturn together 15%. The percentage is a consistency check of this method, not a guarantee. It supports your judgement, it does not replace it.</div>`;
  requestAnimationFrame(()=> requestAnimationFrame(()=>{
    out.querySelectorAll('.le-ring-fg').forEach(b=> b.style.strokeDashoffset = b.dataset.off);
    out.querySelectorAll('.le-bar i[data-w]').forEach(b=> b.style.width = b.dataset.w+'%'); }));
  rsToast('Done ✨ Top fit: ' + sg.name + ' · min confidence ' + Math.round(c.floor*100) + '%');
}
window.LEE = { analyse:leAnalyse, vim:leVim, links:leLinks, catalog:LEC };

/* ============================================================================
   DASHA + TRANSIT TRIGGER ENGINE
   Classical rule (Parashari / B.V. Raman double-transit idea):
     1. DASHA = the promise. The running Maha / Antar / Pratyantar lords must be linked to the event's house:
        they rule it, sit in it, aspect it, or are the natural significator (supporting houses add a little).
        The Antardasha lord must be linked, plus the Mahadasha or Pratyantar lord. No dasha link -> no trigger.
     2. TRANSIT = the trigger. Jupiter AND Saturn must both occupy or aspect THAT SAME house at the same time
        (from the Lagna; from the Moon at a lower weight). Rahu/Ketu on the house and Mars add a little.
     3. ACTIVATION = slow planets crossing (or Jupiter/Saturn aspecting) the natal sign of the linked dasha lords (score booster).
   A window is flagged only when 1 and 2 meet on the same primary house. Themes with two primary houses are tested house by house.
   Everything tunable lives in W and THEMES below. Depends on: VDasha (45), siderealLongitude, SIGNS, ASPECT_OFFSETS,
   computeNatalAscendant, snapshotPositions. Exposes one global: DTrig.
   ============================================================================ */
const DTrig = (function(){
  'use strict';

  // ---- tuning knobs (all weights in one place) ----
  const W = {
    mdW:0.30, adW:0.45, pdW:0.25,   // how much each dasha level counts toward the dasha support D
    gate:0.40, linkMin:0.50,        // dasha gate: D must reach `gate`; a lord counts as "linked" at linkMin (a real rule/sit link, not just a karaka)
    aspect:0.85,                    // aspecting a house is worth 85% of occupying it
    frameMoon:0.80,                 // transit counted from the Moon is worth 80% of the same from the Lagna
    partial:0.25,                   // only ONE of Jupiter/Saturn on the house (not a double transit)
    node:0.15, mars:0.08,           // small bonuses: Rahu/Ketu on the house, Mars on/aspecting it
    tw:0.70, aw:0.30,               // trigger strength Tc = tw*transit + aw*dasha-lord activation
    dw:0.45, cw:0.55,               // final score = 100 * (dw*D + cw*Tc)
    needAct:1,                      // 1 = a double transit alone is not enough: slow planets must also touch a running dasha lord
    minTc:0.50, minScore:60, good:74, strong:86,
    step:3, gapDays:10              // scan sampling (days) and the gap that still merges two hits into one window
  };

  // Event themes: p = primary houses, s = supporting houses, k = natural significators (karakas)
  const THEMES = [
    { key:'marriage',  label:'Marriage & partnership',   icon:'💍', p:[7],     s:[2,11],   k:['Venus'] },
    { key:'career',    label:'Career & status',          icon:'💼', p:[10],    s:[6,11,2], k:['Sun','Saturn'] },
    { key:'wealth',    label:'Money & gains',            icon:'💰', p:[2,11],  s:[5,9],    k:['Jupiter'] },
    { key:'children',  label:'Children',                 icon:'👶', p:[5],     s:[2,9,11], k:['Jupiter'] },
    { key:'home',      label:'Home, property, vehicle',  icon:'🏠', p:[4],     s:[11,2],   k:['Mars','Venus'] },
    { key:'education', label:'Education & learning',     icon:'🎓', p:[4,5],   s:[9,2],    k:['Mercury','Jupiter'] },
    { key:'foreign',   label:'Travel & relocation', icon:'✈️', p:[12,9], s:[3,7],    k:['Rahu'] },
    { key:'health',    label:'Health challenges',        icon:'🩺', p:[6,8],   s:[1,12],   k:['Saturn'] }
  ];
  const THEME = {}; THEMES.forEach(t=>{ THEME[t.key] = t; });

  const ord = n => n + (n===1?'st':n===2?'nd':n===3?'rd':'th');
  const levelOf = s => s>=W.strong ? 'Strong' : s>=W.good ? 'Good' : 'Possible';

  // ---------------- natal context (cached per profile) ----------------
  let cache = { key:null, ctx:null };
  function natalCtx(p){
    const key = [p.dob,p.tob,p.tz,p.lat,p.lon].join('|');
    if (cache.key === key) return cache.ctx;
    const asc = computeNatalAscendant(p), natalJD = asc.jd;
    const lon = snapshotPositions(natalJD).sidereal;
    const L = getSignIndex(asc.lagnaLon), sign = {};
    PLANET_LIST.forEach(n=>{ sign[n] = getSignIndex(lon[n]); });
    const ctx = { name:p.name, natalJD, L, M:sign.Moon, sign, lon, tl:VDasha.build(lon.Moon, natalJD), links:{} };
    const houseOf = s => ((s - L + 12) % 12) + 1;
    THEMES.forEach(t0=>{
      ctx.links[t0.key] = {};
      t0.p.forEach(hh=>{
      const t = { p:[hh], s:t0.s, k:t0.k };            // one primary house at a time -> dasha link is house-specific
      const lk = ctx.links[t0.key][hh] = {};
      PLANET_LIST.forEach(P=>{
        const isNode = (P==='Rahu'||P==='Ketu');
        let raw = 0; const why = [];
        // rules + sits-in for planet Q, scaled by mult (nodes borrow their sign lord's results at 60%)
        const base = (Q, mult, pre, withOwn)=>{
          for (let s=0;s<12;s++) if (SIGNS[s].lord===Q){
            const h = houseOf(s);
            if (t.p.includes(h)){ raw += 3*mult; why.push(pre+'rules H'+h); }
            else if (t.s.includes(h)){ raw += 1.5*mult; why.push(pre+'rules H'+h+' (supporting)'); }
          }
          if (withOwn){
            const h = houseOf(sign[Q]);
            if (t.p.includes(h)){ raw += 3*mult; why.push(pre+'sits in H'+h); }
            else if (t.s.includes(h)){ raw += 1.5*mult; why.push(pre+'sits in H'+h+' (supporting)'); }
          }
        };
        if (!isNode) base(P, 1, '', true);
        else {
          const h = houseOf(sign[P]);
          if (t.p.includes(h)){ raw += 3; why.push('sits in H'+h); } else if (t.s.includes(h)){ raw += 1.5; why.push('sits in H'+h+' (supporting)'); }
          const agent = SIGNS[sign[P]].lord;
          if (agent !== P) base(agent, 0.6, 'via '+agent+': ', true);
        }
        (ASPECT_OFFSETS[P]||[7]).forEach(off=>{
          const h = houseOf((sign[P]+off-1)%12);
          if (t.p.includes(h)){ raw += 1; why.push('aspects H'+h); }
        });
        if (t.k.includes(P)){ raw += 1.5; why.push('natural significator'); }
        lk[P] = { score:Math.min(1, raw/4), why };
      });
      });
    });
    cache = { key, ctx };
    return ctx;
  }

  // ---------------- transit side ----------------
  function transitSigns(jd){
    const g = n => getSignIndex(siderealLongitude(n, jd));
    const r = g('Rahu');
    return { Jupiter:g('Jupiter'), Saturn:g('Saturn'), Mars:g('Mars'), Rahu:r, Ketu:(r+6)%12 };
  }
  function infl(planet, tsign, target){          // null, or {txt, v}: occupying = 1, aspecting = W.aspect
    if (tsign === target) return { txt:'occupies', v:1 };
    const offs = ASPECT_OFFSETS[planet] || [7];
    for (const o of offs) if ((tsign+o-1)%12 === target) return { txt:'aspects by its '+ord(o)+' aspect', v:W.aspect };
    return null;
  }
  // Does `planet` (in sign tsign) occupy/aspect natal house h - from the Lagna, else from the Moon?
  function onHouse(ctx, planet, tsign, h){
    const a = infl(planet, tsign, (ctx.L+h-1)%12);
    if (a) return { v:a.v, txt:`${planet} (${SIGNS[tsign].name}) ${a.txt} H${h}` };
    const b = infl(planet, tsign, (ctx.M+h-1)%12);
    if (b) return { v:b.v*W.frameMoon, txt:`${planet} (${SIGNS[tsign].name}) ${b.txt} H${h} counted from the Moon` };
    return { v:0 };
  }
  function houseTransit(ctx, h, ts){
    const j = onHouse(ctx,'Jupiter',ts.Jupiter,h), sa = onHouse(ctx,'Saturn',ts.Saturn,h);
    let v = j.v*sa.v; const dt = v>0;
    if (!dt) v = W.partial*Math.max(j.v,sa.v);
    const reasons = []; if (j.v) reasons.push(j.txt); if (sa.v) reasons.push(sa.txt);
    const lagSign = (ctx.L+h-1)%12;
    ['Rahu','Ketu'].forEach(n=>{ if (ts[n]===lagSign){ v += W.node; reasons.push(`${n} (${SIGNS[ts[n]].name}) sits on H${h}`); } });
    const mi = infl('Mars', ts.Mars, lagSign);
    if (mi){ v += W.mars; reasons.push(`Mars (${SIGNS[ts.Mars].name}) ${mi.txt} H${h}`); }
    return { v:Math.min(1,v), dt, h, reasons };
  }
  // slow planets crossing / aspecting the natal sign of the running dasha lords (only lords linked to this theme)
  function activation(ctx, lk, seg, ts){
    const lords = [['Antardasha',seg.ad,1],['Pratyantar',seg.pd,0.8],['Mahadasha',seg.md,0.5]];
    let sum = 0; const reasons = [];
    lords.forEach(([role,Q,wl])=>{
      if (lk[Q].score < W.linkMin) return;
      const qs = ctx.sign[Q];
      [['Jupiter',1,0.7],['Saturn',1,0.7],['Rahu',0.6,0],['Ketu',0.6,0],['Mars',0.4,0]].forEach(([X,hc,ha])=>{
        let h = 0, how = '';
        if (ts[X] === qs){ h = hc; how = 'crosses'; }
        else if (ha && infl(X, ts[X], qs)){ h = ha; how = 'aspects'; }
        if (h){ sum += wl*h; reasons.push(`${X} ${how} natal ${Q} (${role} lord) in ${SIGNS[qs].name}`); }
      });
    });
    return { v:Math.min(1,sum), reasons };
  }

  // ---------------- evaluate one theme at one moment ----------------
  // Tests each primary house of the theme separately (dasha link AND double transit on the same house); keeps the best house.
  function evaluate(ctx, t, jd, ts){
    const seg = VDasha.at(ctx.tl, jd); if (!seg) return null;
    ts = ts || transitSigns(jd);
    let best = null;
    t.p.forEach(h=>{
      const lk = ctx.links[t.key][h];
      const mdL = lk[seg.md].score, adL = lk[seg.ad].score, pdL = lk[seg.pd].score;
      const D = W.mdW*mdL + W.adW*adL + W.pdW*pdL;
      const gate = D >= W.gate && adL >= W.linkMin && (mdL >= W.linkMin || pdL >= W.linkMin);
      const T = houseTransit(ctx, h, ts), A = activation(ctx, lk, seg, ts);
      const Tc = Math.min(1, W.tw*T.v + W.aw*A.v);
      const score = Math.round(100*(W.dw*D + W.cw*Tc));
      const r = { jd, seg, h, mdL, adL, pdL, D, T, A, Tc, gate, score,
                  on: gate && T.dt && (!W.needAct || A.v>0) && Tc>=W.minTc && score>=W.minScore };
      if (!best || (r.on && !best.on) || (r.on === best.on && r.score > best.score)) best = r;
    });
    return best;
  }
  const isOn = (ctx,t,jd)=>{ const r = evaluate(ctx,t,jd); return !!(r && r.on); };

  // human-readable reasons for one evaluation
  function explain(ctx, t, r){
    const L = ctx.links[t.key][r.h];
    const dasha = [['Mahadasha',r.seg.md],['Antardasha',r.seg.ad],['Pratyantar',r.seg.pd]].map(([role,P])=>{
      const l = L[P];
      return `${role} ${P} — ` + (l.why.length ? l.why.join(', ') : 'no direct link to this theme') + (l.score>0 && l.score<W.linkMin ? ' (weak)' : '');
    });
    return { house:r.h, dasha, transit:r.T.reasons.concat(r.A.reasons) };
  }

  // ---------------- public: status at a moment, and window scan ----------------
  function snapshot(p, jd){
    const ctx = natalCtx(p), ts = transitSigns(jd), seg = VDasha.at(ctx.tl, jd);
    return { ctx, seg, rows: THEMES.map(t=>({ theme:t, res:evaluate(ctx,t,jd,ts) })) };
  }

  function bisect(ctx, t, a, b, aOn){            // boundary between a (state aOn) and b (opposite state)
    for (let i=0;i<18;i++){ const m = (a+b)/2; if (isOn(ctx,t,m) === aOn) a = m; else b = m; }
    return (a+b)/2;
  }

  // Resumable scanner: run(budgetMs) processes samples until the time budget is used (0 = no limit) and returns true when finished.
  function scanner(p, keys, jd0, jd1){
    const ctx = natalCtx(p), list = keys && keys.length ? keys.map(k=>THEME[k]) : THEMES;
    const st = list.map(t=>({ t, cur:null }));
    const out = [];
    let jd = jd0, done = false;
    const finalize = (s)=>{
      const c = s.cur; if (!c) return;
      const nextOff = c.lastOn + W.step;
      c.openEnd = nextOff > jd1;
      c.e = c.openEnd ? Math.min(jd1, nextOff) : bisect(ctx, s.t, c.lastOn, nextOff, true);
      c.explain = explain(ctx, s.t, c.peakRes);
      c.score = c.peakRes.score; c.level = levelOf(c.score); c.peakJD = c.peakRes.jd;
      c.dasha = { md:c.peakRes.seg.md, ad:c.peakRes.seg.ad, pd:c.peakRes.seg.pd };
      delete c.peakRes; delete c.lastOn;
      out.push(c); s.cur = null;
    };
    function run(budgetMs){
      if (done) return true;
      const t0 = Date.now();
      while (jd <= jd1){
        const ts = transitSigns(jd);
        st.forEach(s=>{
          const r = evaluate(ctx, s.t, jd, ts), on = !!(r && r.on);
          if (on){
            if (s.cur && jd - s.cur.lastOn > W.gapDays) finalize(s);
            if (!s.cur){
              const first = jd === jd0;
              s.cur = { theme:s.t.key, s: first ? jd : bisect(ctx, s.t, jd - W.step, jd, false), openStart:first, lastOn:jd, peakRes:r, dt:false };
            }
            s.cur.lastOn = jd;
            if (r.T.dt) s.cur.dt = true;
            if (r.score > s.cur.peakRes.score) s.cur.peakRes = r;
          } else if (s.cur && jd - s.cur.lastOn > W.gapDays) finalize(s);
        });
        jd += W.step;
        if (budgetMs && Date.now() - t0 > budgetMs) return false;
      }
      st.forEach(finalize);
      out.sort((a,b)=> a.s - b.s);
      done = true; return true;
    }
    return { run, progress:()=> Math.min(1, (jd-jd0)/Math.max(1,jd1-jd0)), result:()=>({ ctx, windows:out }) };
  }
  function scan(p, keys, jd0, jd1){ const sc = scanner(p, keys, jd0, jd1); sc.run(0); return sc.result(); }
  // Same result, but computed in ~25 ms slices so the page never freezes; onProgress(0..1) is called between slices.
  function scanAsync(p, keys, jd0, jd1, onProgress){
    return new Promise(resolve=>{
      const sc = scanner(p, keys, jd0, jd1);
      (function tick(){
        const fin = sc.run(25);
        if (onProgress) onProgress(sc.progress());
        if (fin) resolve(sc.result()); else setTimeout(tick, 0);
      })();
    });
  }

  return { W, THEMES, THEME, levelOf, natalCtx, snapshot, scan, scanAsync, evaluate };
})();

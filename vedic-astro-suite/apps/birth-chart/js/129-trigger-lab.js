/* ============================================================================
   TRIGGER LAB (Home > Analysis, and the left quick menu)
   The Dasha is read all the way down: Maha, Antar, Pratyantar, Sookshma, Prana, Deha (6 levels).
   Single = exactly one planet appears twice (or more) anywhere in the six levels. Double = two or more planets each appear twice anywhere.
   You do not pick the planets: the tool finds every period where the pattern runs and tells you which planets (A, B) it found.
     Single: A = the repeating planet, B = each other planet in the chain.  Double: A and B = the repeating planets (every pair if there are three).
   For every pair the Dasha clock and the transit sky run forward together; a window is a time when the pattern is running AND your transit rules hold.
     sign (A or B in a chosen sign) · lord's sign (A in B's sign, B in A's sign, both) · aspect (A→B, B→A, both, conjunct; Vedic sign aspects, optional exact orb)
     · nakshatra (A in B's nakshatra, B in A's, exchange). Each planet can be read at its transit position or its natal position.
   Output is raw: exact start, end and duration, the six-level chain, and which houses A and B activate (lordship, natal house, transit house).
   Global: TL { periods, match, scan (sync, for tests), scanAsync (UI, never freezes), aspectHolds, ... }. Depends on: calculateAntardashas, getSiderealLongitudeAt, SIGNS, NAKSHATRAS.
   ============================================================================ */
const TL = (function(){
  const PL = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  const GL = { Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋' };
  const LV = ['Maha','Antar','Pratyantar','Sookshma','Prana','Deha'];
  const ASP = { Sun:[7], Moon:[7], Mercury:[7], Venus:[7], Mars:[4,7,8], Jupiter:[5,7,9], Saturn:[3,10,7], Rahu:[5,7,9], Ketu:[5,7,9] };
  const DAY = 86400000, JD0 = 2440587.5;
  const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th'));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const toJD = ms => ms / DAY + JD0, toMs = jd => (jd - JD0) * DAY;
  const signOf = lon => Math.floor(normDeg(lon) / 30);

  /* ---- Dasha periods: every deepest-level period overlapping [fromMs, toMs], in time order ---- */
  function periods(mahas, fromMs, toMs, depth){
    depth = depth || 6; const out = [], chain = [], ov = x => x.endDate.getTime() > fromMs && x.startDate.getTime() < toMs;
    (function rec(list, lvl){
      for (const n of list){
        if (!ov(n)) continue; chain[lvl] = n.lord;
        if (lvl === depth - 1) out.push({ lords: chain.slice(0, depth), start: Math.max(n.startDate.getTime(), fromMs), end: Math.min(n.endDate.getTime(), toMs) });
        else rec(calculateAntardashas(n), lvl + 1);
      }
    })(mahas, 0);
    return out;
  }
  /* pattern -> list of [A, B] planet pairs (empty = pattern not running) */
  function match(lords, mode){
    const cnt = {}, first = {}; lords.forEach((l, i) => { cnt[l] = (cnt[l] || 0) + 1; if (first[l] === undefined) first[l] = i; });
    const byFirst = (a, b) => first[a] - first[b], rep = Object.keys(cnt).filter(l => cnt[l] >= 2).sort(byFirst);
    if (mode === 'single'){ if (rep.length !== 1) return []; return Object.keys(cnt).filter(l => l !== rep[0]).sort(byFirst).map(B => [rep[0], B]); }
    const out = []; for (let i = 0; i < rep.length; i++) for (let j = i + 1; j < rep.length; j++) out.push([rep[i], rep[j]]); return out;
  }

  /* ---- rules ---- */
  function pos(ch, planet, src, jd){ return src === 'natal' ? ch.siderealLongitudes[planet] : getSiderealLongitudeAt(planet, jd); }
  function aspectHolds(fromP, lonFrom, lonTo, orb){
    const d = ((signOf(lonTo) - signOf(lonFrom) + 12) % 12) + 1;
    return (ASP[fromP] || [7]).some(off => d === off && (!orb || Math.abs(angDiffSigned(normDeg(lonFrom + (off - 1) * 30), lonTo)) <= orb));
  }
  const lordOfSign = lon => SIGNS[signOf(lon)].lord;
  const nakLord = lon => NAKSHATRAS[Math.floor(normDeg(lon) / (360 / 27))].lord;
  /* cfg.rules: sign{on,who,sign} lordsign{on,mode} aspect{on,mode,orb} nak{on,mode}; cfg.all (AND) or any; cfg.srcA, cfg.srcB */
  function ruleTrue(ch, A, B, jd, cfg){
    const R = cfg.rules, la = pos(ch, A, cfg.srcA, jd), lb = pos(ch, B, cfg.srcB, jd), res = [];
    if (R.sign.on){ const lon = R.sign.who === 'B' ? lb : la; res.push(signOf(lon) === +R.sign.sign); }
    if (R.lordsign.on){ const m = R.lordsign.mode, x = lordOfSign(lb) === A, y = lordOfSign(la) === B;   // A in B's sign / B in A's sign
      res.push(m === 'AinB' ? x : m === 'BinA' ? y : (x && y)); }
    if (R.aspect.on){ const m = R.aspect.mode, o = +R.aspect.orb || 0;
      if (m === 'conj') res.push(signOf(la) === signOf(lb) && (!o || Math.abs(angDiffSigned(la, lb)) <= o));
      else { const ab = aspectHolds(A, la, lb, o), ba = aspectHolds(B, lb, la, o); res.push(m === 'AtoB' ? ab : m === 'BtoA' ? ba : (ab && ba)); } }
    if (R.nak.on){ const m = R.nak.mode, x = nakLord(la) === B, y = nakLord(lb) === A;               // A in B's nakshatra / B in A's
      res.push(m === 'AinB' ? x : m === 'BinA' ? y : (x && y)); }
    if (!res.length) return true;
    return cfg.all ? res.every(Boolean) : res.some(Boolean);
  }
  function usesFast(A, B, cfg){ return cfg.srcA === 'transit' && ['Moon'].includes(A) || cfg.srcB === 'transit' && ['Moon'].includes(B); }

  /* ---- scan ---- */
  // candidate intervals: for each planet pair, the (merged) times when the Dasha pattern gives that pair
  function candidates(ch, cfg, fromMs, toMs){
    const leaves = periods(ch.dashaData.mahadashas, fromMs, toMs, 6), cand = new Map();
    leaves.forEach((p, idx) => match(p.lords, cfg.mode).forEach(([A, B]) => {
      const k = A + '|' + B; let c = cand.get(k); if (!c){ c = { A, B, iv: [] }; cand.set(k, c); }
      const l = c.iv[c.iv.length - 1]; if (l && p.start - l.e <= 50) l.e = p.end; else c.iv.push({ s: p.start, e: p.end });
    }));
    return { leaves, cand };
  }
  function leafAt(leaves, ms){ let lo = 0, hi = leaves.length - 1; while (lo < hi){ const m = (lo + hi + 1) >> 1; if (leaves[m].start <= ms + 1) lo = m; else hi = m - 1; } return leaves[lo]; }
  // one interval scanned as a generator (yields now and then so the page stays responsive)
  function* scanIv(ch, cfg, A, B, a, b, out){
    const moon = usesFast(A, B, cfg) || A === 'Moon' || B === 'Moon', step = moon ? 1 / 48 : 0.25, f = jd => ruleTrue(ch, A, B, jd, cfg);
    const flip = (x, y, want) => { let lo = x, hi = y; for (let i = 0; i < 30 && hi - lo > 0.0004; i++){ const m = (lo + hi) / 2; if (f(m) === want) hi = m; else lo = m; } return (lo + hi) / 2; };
    let jd = a, cur = f(a), s = cur ? a : null, n = 0;
    while (jd < b){
      const nx = Math.min(jd + step, b), v = f(nx);
      if (v && !cur) s = flip(jd, nx, true); else if (!v && cur){ out.push({ A, B, a: s, b: flip(jd, nx, false) }); s = null; }
      cur = v; jd = nx; if (++n % 400 === 0) yield jd;
    }
    if (cur && s !== null) out.push({ A, B, a: s, b });
  }
  function finish(leaves, found){
    found.sort((x, y) => x.a - y.a || (x.A + x.B < y.A + y.B ? -1 : 1));
    found.forEach(w => { const lf = leafAt(leaves, toMs(w.a)), le = leafAt(leaves, toMs(w.b) - 1); w.lords = lf.lords; w.endLords = le.lords; });
    return found;
  }
  function scan(ch, cfg, fromMs, toMs_){                    // synchronous (tests)
    const { leaves, cand } = candidates(ch, cfg, fromMs, toMs_), found = [];
    cand.forEach(c => c.iv.forEach(iv => { for (const _ of scanIv(ch, cfg, c.A, c.B, toJD(iv.s), toJD(iv.e), found)); }));
    return finish(leaves, found);
  }
  function scanAsync(ch, cfg, fromMs, toMs_, onProgress, done){   // for the screen: time-sliced, with progress
    let leaves, tasks = [], found = [], total = 0, doneW = 0, gen = null, cur = null;
    try { const c = candidates(ch, cfg, fromMs, toMs_); leaves = c.leaves; c.cand.forEach(x => x.iv.forEach(iv => { tasks.push({ A: x.A, B: x.B, a: toJD(iv.s), b: toJD(iv.e) }); total += (iv.e - iv.s) / DAY; })); } catch(e){ done(e); return; }
    tasks.sort((x, y) => x.a - y.a);
    (function tick(){
      const t0 = performance.now();
      try {
        while (performance.now() - t0 < 40){
          if (!gen){ if (!tasks.length){ onProgress(1); done(null, finish(leaves, found)); return; } cur = tasks.shift(); gen = scanIv(ch, cfg, cur.A, cur.B, cur.a, cur.b, found); }
          const r = gen.next(); if (r.done){ doneW += cur.b - cur.a; gen = null; }
        }
      } catch(e){ done(e); return; }
      onProgress(total ? Math.min(0.99, doneW / total) : 0.5); setTimeout(tick, 0);
    })();
  }

  /* ---- houses activated (raw) ---- */
  function houseInfo(ch, planet, jdMid){
    const asc = ch.ascendant.sign, lords = [];
    for (let h = 1; h <= 12; h++) if (SIGNS[(asc + h - 1) % 12].lord === planet) lords.push(h);
    const p = ch.planets[planet], natal = p ? p.house : null, tr = ((signOf(getSiderealLongitudeAt(planet, jdMid)) - asc + 12) % 12) + 1;
    return { lords, natal, transit: tr };
  }
  return { PL, GL, LV, periods, match, ruleTrue, aspectHolds, scan, scanAsync, houseInfo, signOf, esc, ord, toJD, toMs };
})();
window.TL = TL;

/* ------------------------------ UI ------------------------------ */
const TLUI = (function(){
  const { PL, GL, esc, ord } = TL;
  const SG = () => SIGNS.map((s, i) => `<option value="${i}">${s.symbol} ${s.name}</option>`).join('');
  const plOpts = (sel) => PL.map(p => `<option${p === sel ? ' selected' : ''}>${p}</option>`).join('');
  function fmt(jd){ const d = new Date(TL.toMs(jd)), p = n => String(n).padStart(2, '0'), l = new Date(d.getTime()); return `${l.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][l.getMonth()]} ${l.getFullYear()} ${p(l.getHours())}:${p(l.getMinutes())}`; }
  function dur(d){ if (d < 1 / 24) return Math.max(1, Math.round(d * 1440)) + ' min'; if (d < 2) return (d * 24).toFixed(1) + ' h'; if (d < 60) return d.toFixed(1) + ' days'; return (d / 30.44).toFixed(1) + ' months'; }
  function html(){
    return `<div class="tlab" id="tlab">
      <div class="tl-intro"><b>Trigger Lab.</b> Pick Single or Double and your transit rules. The Dasha (Maha to Deha) and the sky run forward together, and the tool tells you every time the pattern and your rules hold at once. You do not pick planets: it finds them.</div>
      <section class="tl-card"><h4><i>1</i> Dasha pattern <small>six levels, planets found for you</small></h4>
        <div class="tl-seg" id="tlMode"><button type="button" data-m="single" class="on">Single <small>one planet repeats</small></button><button type="button" data-m="double">Double <small>two planets repeat</small></button></div>
        <div class="tl-note" id="tlPatNote">One planet appears twice anywhere from Maha to Deha (for example Mercury Maha + Mercury Antar). That planet is A. Each other planet in the chain is B, one result per pair.</div></section>
      <section class="tl-card"><h4><i>2</i> Transit rules <small>A and B are filled in from the Dasha chain</small></h4>
        <div class="tl-row"><label>Read A at<select id="tlSrcA"><option value="transit">Transit (live sky)</option><option value="natal">Natal</option></select></label><label>Read B at<select id="tlSrcB"><option value="transit">Transit (live sky)</option><option value="natal">Natal</option></select></label></div>
        <div class="tl-rule"><label class="tl-ck"><input type="checkbox" id="rSignOn"> Sign</label><div class="tl-sub"><select id="rSignWho"><option value="A">A</option><option value="B">B</option></select> is in <select id="rSign">${SG()}</select></div></div>
        <div class="tl-rule"><label class="tl-ck"><input type="checkbox" id="rLordOn"> Lord's sign</label><div class="tl-sub"><select id="rLordMode"><option value="AinB">A is in B's sign</option><option value="BinA">B is in A's sign</option><option value="both">Both (exchange)</option></select></div></div>
        <div class="tl-rule"><label class="tl-ck"><input type="checkbox" id="rAspOn"> Aspect</label><div class="tl-sub"><select id="rAspMode"><option value="AtoB">A aspects B</option><option value="BtoA">B aspects A</option><option value="both">Both aspect each other</option><option value="conj">Conjunct (same sign)</option></select><span>exact orb <input type="number" id="rOrb" min="0" max="15" step="0.5" value="0"> ° (0 = by sign)</span></div></div>
        <div class="tl-rule"><label class="tl-ck"><input type="checkbox" id="rNakOn"> Nakshatra</label><div class="tl-sub"><select id="rNakMode"><option value="AinB">A is in B's nakshatra</option><option value="BinA">B is in A's nakshatra</option><option value="both">Both (exchange)</option></select></div></div>
        <div class="tl-row"><label>Combine rules<select id="tlAll"><option value="1">All must hold</option><option value="0">Any one holds</option></select></label></div></section>
      <section class="tl-card"><h4><i>3</i> Search <small></small></h4><div class="tl-row"><label>From<input type="date" id="tlFrom"></label><label>Years<input type="number" id="tlYears" min="1" max="10" value="2"></label></div></section>
      <button type="button" class="tl-go" id="tlGo">⚡ Find triggers</button><div id="tlOut"></div></div>`;
  }
  function cfgFrom(){
    const g = id => document.getElementById(id);
    return { mode: g('tlMode').querySelector('.on').dataset.m, srcA: g('tlSrcA').value, srcB: g('tlSrcB').value, all: g('tlAll').value === '1',
      rules: { sign: { on: g('rSignOn').checked, who: g('rSignWho').value, sign: g('rSign').value }, lordsign: { on: g('rLordOn').checked, mode: g('rLordMode').value },
               aspect: { on: g('rAspOn').checked, mode: g('rAspMode').value, orb: g('rOrb').value }, nak: { on: g('rNakOn').checked, mode: g('rNakMode').value } } };
  }
  function run(){
    const out = document.getElementById('tlOut'), ch = (typeof currentChartForModal !== 'undefined') ? currentChartForModal : null; if (!ch) return;
    const cfg = cfgFrom(), from = document.getElementById('tlFrom').value, yrs = Math.max(1, Math.min(10, +document.getElementById('tlYears').value || 2));
    if (!Object.values(cfg.rules).some(r => r.on)){ out.innerHTML = '<div class="tl-msg">Tick at least one transit rule, or you will just see the Dasha pattern periods.</div>'; }
    const f = from ? new Date(from + 'T00:00:00') : new Date(), a = f.getTime(), b = a + yrs * 365.25 * 86400000;
    out.innerHTML = '<div class="tl-msg" id="tlProg">Scanning… 0%</div>';
    const rep = (l, w) => { const c = {}; w.lords.forEach(x => c[x] = (c[x] || 0) + 1); return c[l] > 1; };
    const t0 = performance.now(), go = document.getElementById('tlGo'); if (go) go.disabled = true;
    TL.scanAsync(ch, cfg, a, b, pr => { const m = document.getElementById('tlProg'); if (m) m.textContent = 'Scanning… ' + Math.round(pr * 100) + '%'; }, (err, list) => {
      if (go) go.disabled = false;
      if (err){ console.error(err); out.innerHTML = '<div class="tl-msg err">Could not scan. Please refresh and try again.</div>'; return; }
      if (!list.length){ out.innerHTML = '<div class="tl-msg">No time in this range where the pattern and your rules hold together. Try fewer rules, "Any one holds", or a longer range.</div>'; return; }
      const shown = list.slice(0, 150), hi = (p, jd) => TL.houseInfo(ch, p, jd);
      out.innerHTML = `<div class="tl-count">${list.length} matching window${list.length > 1 ? 's' : ''}${list.length > 150 ? ' (first 150 shown)' : ''}</div>` + shown.map((w, i) => {
        const mid = (w.a + w.b) / 2, A = hi(w.A, mid), B = hi(w.B, mid), act = new Set();
        [A, B].forEach(x => { x.lords.forEach(h => act.add(h)); if (x.natal) act.add(x.natal); act.add(x.transit); });
        const line = (p, x) => `<div class="tl-pl"><b>${GL[p]} ${p}</b>${x.lords.length ? x.lords.map(h => `<i class="lord">${ord(h)} lord</i>`).join('') : '<i>no house lordship</i>'}<i>natal ${x.natal ? ord(x.natal) : '?'} house</i><i>transit ${ord(x.transit)} house</i></div>`;
        const chain = (lords) => lords.map((l, k) => `<span class="${l === w.A || l === w.B ? 'rep' : ''}"><small>${TL.LV[k]}</small>${GL[l]} ${l}</span>`).join('');
        const endTxt = w.endLords.join() !== w.lords.join() ? `<div class="tl-endc">Ends in: ${w.endLords.join(' › ')}</div>` : '';
        return `<div class="tl-win"><div class="tl-wt"><span>#${i + 1}</span><b>${fmt(w.a)} → ${fmt(w.b)}</b><em>${dur(w.b - w.a)}</em></div>
          <div class="tl-pair">${GL[w.A]} ${w.A} × ${GL[w.B]} ${w.B}</div>
          <div class="tl-chain">${chain(w.lords)}</div>${endTxt}${line(w.A, A)}${line(w.B, B)}
          <div class="tl-act">Houses activated: ${[...act].sort((x, y) => x - y).map(h => `<i>${h}</i>`).join('')}</div></div>`; }).join('');
    });
  }
  document.addEventListener('click', e => {
    const m = e.target.closest ? e.target.closest('#tlMode button') : null;
    if (m){ document.querySelectorAll('#tlMode button').forEach(x => x.classList.toggle('on', x === m)); const dbl = m.dataset.m === 'double';
      document.getElementById('tlPatNote').textContent = dbl ? 'Two planets each appear twice anywhere from Maha to Deha (for example Mercury Maha + Antar and Venus Pratyantar + Sookshma). They are A and B and are compared with each other. If three repeat, every pair is checked.' : 'One planet appears twice anywhere from Maha to Deha (for example Mercury Maha + Mercury Antar). That planet is A. Each other planet in the chain is B, one result per pair.'; return; }
    if (e.target.id === 'tlGo') run();
  });
  window.buildTriggerLabPanel = function(){
    setTimeout(() => { const f = document.getElementById('tlFrom'); if (f && !f.value){ const n = new Date(), p = x => String(x).padStart(2, '0'); f.value = `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`; } }, 0);
    return html();
  };
  return { run };
})();

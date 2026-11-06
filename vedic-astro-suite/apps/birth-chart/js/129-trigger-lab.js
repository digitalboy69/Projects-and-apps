/* ============================================================================
   TRIGGER LAB (Home > Analysis, and the left quick menu)
   You choose the Vimshottari PATTERN, not the planets:
     Single = one planet repeats on two consecutive levels (e.g. Mercury Maha + Mercury Antar). Rules use that planet (A) and an "other" planet (B) you pick.
     Double = two planets each repeat (e.g. Mercury Maha+Antar, then Venus Pratyantar+Sookshma). Rules use A and B.
   The tool reads your chart's Dasha timeline, finds every period where the pattern runs, and keeps only the times when your TRANSIT RULES hold for A and B:
     sign (A or B in a chosen sign) · lord's sign (A in B's sign, B in A's sign, both) · aspect (A→B, B→A, both, conjunct; Vedic sign aspects, optional exact orb)
     · nakshatra (A in B's nakshatra, B in A's, exchange). Each planet can be read at its transit position or its natal position.
   Output is raw: the dates, the Dasha chain, and which houses A and B activate (lordship, natal house, transit house). No life-area text.
   Global: TL { periods, scan, aspectHolds, ... } (tests). Depends on: calculateAntardashas, getSiderealLongitudeAt, SIGNS, NAKSHATRAS, getNakshatra.
   ============================================================================ */
const TL = (function(){
  const PL = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  const GL = { Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋' };
  const LV = ['Maha','Antar','Pratyantar','Sookshma'];
  const PAIRS = [[0, 1], [1, 2], [2, 3]];                 // which two levels repeat
  const PAIR_NAME = ['Maha + Antar', 'Antar + Pratyantar', 'Pratyantar + Sookshma'];
  const ASP = { Sun:[7], Moon:[7], Mercury:[7], Venus:[7], Mars:[4,7,8], Jupiter:[5,7,9], Saturn:[3,10,7], Rahu:[5,7,9], Ketu:[5,7,9] };
  const DAY = 86400000, JD0 = 2440587.5;
  const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th'));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const toJD = ms => ms / DAY + JD0, toMs = jd => (jd - JD0) * DAY;
  const signOf = lon => Math.floor(normDeg(lon) / 30);

  /* ---- Dasha periods (4 levels) overlapping [fromMs, toMs] ---- */
  function periods(mahas, fromMs, toMs){
    const out = [], ov = x => x.endDate.getTime() > fromMs && x.startDate.getTime() < toMs;
    mahas.filter(ov).forEach(md => calculateAntardashas(md).filter(ov).forEach(ad => calculateAntardashas(ad).filter(ov).forEach(pd => calculateAntardashas(pd).filter(ov).forEach(sd => {
      out.push({ lords: [md.lord, ad.lord, pd.lord, sd.lord], start: Math.max(sd.startDate.getTime(), fromMs), end: Math.min(sd.endDate.getTime(), toMs) });
    }))));
    return out.sort((a, b) => a.start - b.start);
  }
  /* pattern -> planets (A, B) or null.  cfg.mode 'single'|'double'; cfg.pair1, cfg.pair2 index PAIRS; cfg.other */
  function match(lords, cfg){
    const p1 = PAIRS[cfg.pair1];
    if (lords[p1[0]] !== lords[p1[1]]) return null;
    if (cfg.mode === 'single') return [lords[p1[0]], cfg.other];
    const p2 = PAIRS[cfg.pair2];
    if (lords[p2[0]] !== lords[p2[1]]) return null;
    return [lords[p1[0]], lords[p2[0]]];
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
  function scan(ch, cfg, fromMs, toMs){
    const per = periods(ch.dashaData.mahadashas, fromMs, toMs), found = [];
    per.forEach(p => {
      const ab = match(p.lords, cfg); if (!ab) return;
      const A = ab[0], B = ab[1], a = toJD(p.start), b = toJD(p.end);
      const moon = usesFast(A, B, cfg) || A === 'Moon' || B === 'Moon', step = moon ? 1 / 48 : 0.25;
      const f = jd => ruleTrue(ch, A, B, jd, cfg);
      let jd = a, cur = f(a), s = cur ? a : null;
      const flip = (x, y, want) => { let lo = x, hi = y; for (let i = 0; i < 30 && hi - lo > 0.0004; i++){ const m = (lo + hi) / 2; if (f(m) === want) hi = m; else lo = m; } return (lo + hi) / 2; };
      while (jd < b){
        const nx = Math.min(jd + step, b), v = f(nx);
        if (v && !cur) s = flip(jd, nx, true);
        else if (!v && cur){ found.push({ A, B, lords: p.lords, a: s, b: flip(jd, nx, false) }); s = null; }
        cur = v; jd = nx;
      }
      if (cur && s !== null) found.push({ A, B, lords: p.lords, a: s, b });
    });
    found.sort((x, y) => x.a - y.a);
    const merged = [];
    found.forEach(w => { const l = merged[merged.length - 1];
      if (l && l.A === w.A && l.B === w.B && w.a - l.b < 0.002 && l.lords.slice(0, 2).join() === w.lords.slice(0, 2).join() && cfg.mode === 'single') l.b = w.b; else merged.push(Object.assign({}, w)); });
    return merged;
  }

  /* ---- houses activated (raw) ---- */
  function houseInfo(ch, planet, jdMid){
    const asc = ch.ascendant.sign, lords = [];
    for (let h = 1; h <= 12; h++) if (SIGNS[(asc + h - 1) % 12].lord === planet) lords.push(h);
    const p = ch.planets[planet], natal = p ? p.house : null, tr = ((signOf(getSiderealLongitudeAt(planet, jdMid)) - asc + 12) % 12) + 1;
    return { lords, natal, transit: tr };
  }
  return { PL, GL, LV, PAIRS, PAIR_NAME, periods, match, ruleTrue, aspectHolds, scan, houseInfo, signOf, esc, ord, toJD, toMs };
})();
window.TL = TL;

/* ------------------------------ UI ------------------------------ */
const TLUI = (function(){
  const { PL, GL, PAIR_NAME, esc, ord } = TL;
  const SG = () => SIGNS.map((s, i) => `<option value="${i}">${s.symbol} ${s.name}</option>`).join('');
  const plOpts = (sel) => PL.map(p => `<option${p === sel ? ' selected' : ''}>${p}</option>`).join('');
  const pairOpts = (sel) => PAIR_NAME.map((n, i) => `<option value="${i}"${i === sel ? ' selected' : ''}>${n}</option>`).join('');
  function fmt(jd){ const d = new Date(TL.toMs(jd)), p = n => String(n).padStart(2, '0'), l = new Date(d.getTime()); return `${l.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][l.getMonth()]} ${l.getFullYear()} ${p(l.getHours())}:${p(l.getMinutes())}`; }
  function dur(d){ if (d < 1 / 24) return Math.max(1, Math.round(d * 1440)) + ' min'; if (d < 2) return (d * 24).toFixed(1) + ' h'; if (d < 60) return d.toFixed(1) + ' days'; return (d / 30.44).toFixed(1) + ' months'; }
  function html(){
    return `<div class="tlab" id="tlab">
      <div class="tl-intro"><b>Trigger Lab.</b> Choose the Dasha pattern and your transit rules. The tool finds every time they hold together and shows which houses the Dasha planets activate. Raw facts only.</div>
      <section class="tl-card"><h4><i>1</i> Dasha pattern <small>the planets come from your chart</small></h4>
        <div class="tl-seg" id="tlMode"><button type="button" data-m="single" class="on">Single <small>one planet repeats</small></button><button type="button" data-m="double">Double <small>two planets repeat</small></button></div>
        <div class="tl-row"><label>Repeating levels<select id="tlPair1">${pairOpts(0)}</select></label>
          <label id="tlPair2Wrap" hidden>Second pair<select id="tlPair2">${pairOpts(2)}</select></label>
          <label id="tlOtherWrap">B = other planet<select id="tlOther">${plOpts('Venus')}</select></label></div>
        <div class="tl-note" id="tlPatNote">Example: Mercury Maha + Mercury Antar. A is that repeating planet.</div></section>
      <section class="tl-card"><h4><i>2</i> Transit rules <small>tick any, combine below</small></h4>
        <div class="tl-row"><label>Read A at<select id="tlSrcA"><option value="transit">Transit (live sky)</option><option value="natal">Natal</option></select></label><label>Read B at<select id="tlSrcB"><option value="transit">Transit (live sky)</option><option value="natal">Natal</option></select></label></div>
        <div class="tl-rule"><label class="tl-ck"><input type="checkbox" id="rSignOn"> Sign</label><div class="tl-sub"><select id="rSignWho"><option value="A">A</option><option value="B">B</option></select> is in <select id="rSign">${SG()}</select></div></div>
        <div class="tl-rule"><label class="tl-ck"><input type="checkbox" id="rLordOn"> Lord's sign</label><div class="tl-sub"><select id="rLordMode"><option value="AinB">A is in B's sign</option><option value="BinA">B is in A's sign</option><option value="both">Both (exchange)</option></select></div></div>
        <div class="tl-rule"><label class="tl-ck"><input type="checkbox" id="rAspOn"> Aspect</label><div class="tl-sub"><select id="rAspMode"><option value="AtoB">A aspects B</option><option value="BtoA">B aspects A</option><option value="both">Both aspect each other</option><option value="conj">Conjunct (same sign)</option></select><span>exact orb <input type="number" id="rOrb" min="0" max="15" step="0.5" value="0"> ° (0 = by sign)</span></div></div>
        <div class="tl-rule"><label class="tl-ck"><input type="checkbox" id="rNakOn"> Nakshatra</label><div class="tl-sub"><select id="rNakMode"><option value="AinB">A is in B's nakshatra</option><option value="BinA">B is in A's nakshatra</option><option value="both">Both (exchange)</option></select></div></div>
        <div class="tl-row"><label>Combine rules<select id="tlAll"><option value="1">All must hold</option><option value="0">Any one holds</option></select></label></div></section>
      <section class="tl-card"><h4><i>3</i> Search <small></small></h4><div class="tl-row"><label>From<input type="date" id="tlFrom"></label><label>Years<input type="number" id="tlYears" min="1" max="30" value="5"></label></div></section>
      <button type="button" class="tl-go" id="tlGo">⚡ Find triggers</button><div id="tlOut"></div></div>`;
  }
  function cfgFrom(){
    const g = id => document.getElementById(id);
    return { mode: g('tlMode').querySelector('.on').dataset.m, pair1: +g('tlPair1').value, pair2: +g('tlPair2').value, other: g('tlOther').value, srcA: g('tlSrcA').value, srcB: g('tlSrcB').value, all: g('tlAll').value === '1',
      rules: { sign: { on: g('rSignOn').checked, who: g('rSignWho').value, sign: g('rSign').value }, lordsign: { on: g('rLordOn').checked, mode: g('rLordMode').value },
               aspect: { on: g('rAspOn').checked, mode: g('rAspMode').value, orb: g('rOrb').value }, nak: { on: g('rNakOn').checked, mode: g('rNakMode').value } } };
  }
  function run(){
    const out = document.getElementById('tlOut'), ch = (typeof currentChartForModal !== 'undefined') ? currentChartForModal : null; if (!ch) return;
    const cfg = cfgFrom(), from = document.getElementById('tlFrom').value, yrs = Math.max(1, Math.min(30, +document.getElementById('tlYears').value || 5));
    if (!Object.values(cfg.rules).some(r => r.on)){ out.innerHTML = '<div class="tl-msg">Tick at least one transit rule, or you will just see the Dasha pattern periods.</div>'; }
    const f = from ? new Date(from + 'T00:00:00') : new Date(), a = f.getTime(), b = a + yrs * 365.25 * 86400000;
    out.innerHTML = '<div class="tl-msg">Scanning…</div>';
    setTimeout(() => {
      let list; try { list = TL.scan(ch, cfg, a, b); } catch(e){ console.error(e); out.innerHTML = '<div class="tl-msg err">Could not scan. Please refresh and try again.</div>'; return; }
      if (!list.length){ out.innerHTML = '<div class="tl-msg">No time in this range where the pattern and your rules hold together. Try fewer rules, "Any one holds", or a longer range.</div>'; return; }
      const shown = list.slice(0, 150), hi = (p, jd) => TL.houseInfo(ch, p, jd);
      out.innerHTML = `<div class="tl-count">${list.length} matching window${list.length > 1 ? 's' : ''}${list.length > 150 ? ' (first 150 shown)' : ''}</div>` + shown.map((w, i) => {
        const mid = (w.a + w.b) / 2, A = hi(w.A, mid), B = hi(w.B, mid), act = new Set();
        [A, B].forEach(x => { x.lords.forEach(h => act.add(h)); if (x.natal) act.add(x.natal); act.add(x.transit); });
        const line = (p, x) => `<div class="tl-pl"><b>${GL[p]} ${p}</b>${x.lords.length ? x.lords.map(h => `<i class="lord">${ord(h)} lord</i>`).join('') : '<i>no house lordship</i>'}<i>natal ${x.natal ? ord(x.natal) : '?'} house</i><i>transit ${ord(x.transit)} house</i></div>`;
        return `<div class="tl-win"><div class="tl-wt"><span>#${i + 1}</span><b>${fmt(w.a)} → ${fmt(w.b)}</b><em>${dur(w.b - w.a)}</em></div>
          <div class="tl-chain">${w.lords.map((l, k) => `<span><small>${TL.LV[k]}</small>${GL[l]} ${l}</span>`).join('')}</div>${line(w.A, A)}${w.B !== w.A ? line(w.B, B) : ''}
          <div class="tl-act">Houses activated: ${[...act].sort((x, y) => x - y).map(h => `<i>${h}</i>`).join('')}</div></div>`; }).join('');
    }, 30);
  }
  document.addEventListener('click', e => {
    const m = e.target.closest ? e.target.closest('#tlMode button') : null;
    if (m){ document.querySelectorAll('#tlMode button').forEach(x => x.classList.toggle('on', x === m)); const dbl = m.dataset.m === 'double';
      document.getElementById('tlPair2Wrap').hidden = !dbl; document.getElementById('tlOtherWrap').hidden = dbl;
      document.getElementById('tlPatNote').textContent = dbl ? 'Example: Mercury Maha + Mercury Antar, then Venus Pratyantar + Venus Sookshma. A and B are the two repeating planets.' : 'Example: Mercury Maha + Mercury Antar. A is that repeating planet.';
      if (dbl && document.getElementById('tlPair1').value === '2') document.getElementById('tlPair1').value = '0'; return; }
    if (e.target.id === 'tlGo') run();
  });
  window.buildTriggerLabPanel = function(){
    setTimeout(() => { const f = document.getElementById('tlFrom'); if (f && !f.value){ const n = new Date(), p = x => String(x).padStart(2, '0'); f.value = `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`; } }, 0);
    return html();
  };
  return { run };
})();

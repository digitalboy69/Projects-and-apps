/* Timeline finder (js/63, global TLF). Tools menu > Timeline finder: choose an age range (counted from today) or birth years, add conditions (planets in a sign, in a nakshatra, planets meeting,
   retrograde) and the app lists every period in that range when ALL (or ANY) of the conditions were true. Tap a result to see every planet that day, then open that date in the 3D sky.
   Engine: siderealLongitude / isRetrograde (js/01) scanned with a step set by the fastest planet used, edges bisected to about a second; the app's own engine matches Drik Panchang
   ingress dates to the hour (Saturn into Capricorn 24 Jan 2020, Jupiter into Gemini 14 May 2025). TLF.test / TLF.search are pure (no DOM) so they can be tested. See docs/TIMELINE_FINDER_PLAN.md. */
const TLF = (() => {
  'use strict';
  const P9 = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'], OUT = ['Uranus', 'Neptune', 'Pluto'], PCH = P9.concat(OUT);
  const BASE = { Moon: .2, Sun: .5, Mercury: .4, Venus: .5, Mars: .5, Jupiter: 2, Saturn: 3, Rahu: 4, Ketu: 4, Uranus: 6, Neptune: 8, Pluto: 8 };
  const REL = { conj: 0, sq: 90, tri: 120, opp: 180 }, RELN = { conj: 'meet (conjunct)', opp: 'face each other (opposite)', tri: 'trine (120°)', sq: 'square (90°)' };
  const YR = 365.2425, MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const lon = (n, jd) => siderealLongitude(n, jd), signOf = l => Math.floor(normDeg(l) / 30), nakOf = l => Math.floor(normDeg(l) / (360 / 27));
  const bodies = c => c.t === 'rel' ? [c.a, c.b] : c.planets || [];
  function test(c, jd) {
    if (c.t === 'sign' || c.t === 'nak') { const f = n => (c.t === 'sign' ? signOf(lon(n, jd)) : nakOf(lon(n, jd))) === c.v; return c.mode === 'any' ? c.planets.some(f) : c.planets.every(f); }
    if (c.t === 'retro') { const f = n => !!isRetrograde(n, jd) === (c.on !== false); return c.mode === 'any' ? c.planets.some(f) : c.planets.every(f); }
    if (c.t === 'rel') { const d = Math.abs(angDiff(lon(c.a, jd), lon(c.b, jd))); return Math.abs(d - REL[c.rel]) <= c.orb; }
    return false;
  }
  const valid = c => c.t === 'rel' ? !!(c.a && c.b && c.a !== c.b && REL[c.rel] != null) : (c.planets && c.planets.length > 0 && c.v != null || c.t === 'retro' && c.planets && c.planets.length > 0);
  const nowJD = () => { const d = new Date(); return toJulianDay(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), 0); };
  function ageRange(a0, a1, now) { now = now || nowJD(); const lo = Math.min(a0, a1), hi = Math.max(a0, a1); return { from: now - hi * YR, to: now - lo * YR }; }
  function yearRange(y0, y1) { const lo = Math.min(y0, y1), hi = Math.max(y0, y1); return { from: toJulianDay(lo, 1, 1, 0, 0, 0), to: toJulianDay(hi, 12, 31, 23, 59, 0) }; }
  async function search(conds, combine, j0, j1, opt) {
    opt = opt || {}; const list = conds.filter(valid); if (!list.length) return { error: 'Choose at least one planet in every condition.' };
    if (!(j1 > j0)) return { error: 'The end of the range must be after the start.' };
    let dt = 99; list.forEach(c => bodies(c).forEach(n => { dt = Math.min(dt, BASE[n] || 1); })); if (list.some(c => c.t === 'rel')) dt *= .5;
    const f = jd => combine === 'any' ? list.some(c => test(c, jd)) : list.every(c => test(c, jd)), out = [];
    const edge = (a, b, sa) => { for (let i = 0; i < 18; i++) { const m = (a + b) / 2; if (f(m) === sa) a = m; else b = m; } return (a + b) / 2; };
    let prevT = j0, prev = f(j0), start = prev ? j0 : null, n = 0; const total = (j1 - j0) / dt;
    for (let t = j0 + dt; ; t += dt) {
      const tt = Math.min(t, j1), cur = f(tt);
      if (cur !== prev) { const e = edge(prevT, tt, prev); if (cur) start = e; else { out.push({ from: start, to: e }); start = null; } prev = cur; }
      prevT = tt; if (tt >= j1) break;
      if (out.length >= (opt.max || 400)) break;
      if (++n % 6000 === 0) { if (opt.onProgress) opt.onProgress(Math.min(1, n / total)); if (opt.cancel && opt.cancel()) return { cancelled: true, windows: out }; await new Promise(r => setTimeout(r, 0)); }
    }
    if (prev && start != null && out.length < (opt.max || 400)) out.push({ from: start, to: j1, open: true });
    out.forEach(w => { const mid = (w.from + w.to) / 2; w.mid = mid; w.which = list.map((c, i) => test(c, mid) ? i : -1).filter(i => i >= 0); const seen = {}; w.pos = []; list.forEach(c => bodies(c).forEach(nm => { if (!seen[nm] && w.pos.length < 5) { seen[nm] = 1; const l = lon(nm, mid); w.pos.push({ n: nm, s: signOf(l), d: Math.floor(l % 30) }); } })); });
    return { windows: out, capped: out.length >= (opt.max || 400), step: dt };
  }

  /* ------------------------------ UI ------------------------------ */
  const KEY = 'sky3d_tlf';
  const S = { mode: 'age', a0: 30, a1: 40, y0: 1986, y1: 1996, combine: 'all', conds: [{ t: 'sign', planets: ['Sun'], v: 6, mode: 'all' }, { t: 'sign', planets: ['Moon'], v: 11, mode: 'all' }], res: null, open: -1, mo: 'mid', busy: false, prog: 0, msg: '', cancel: false };
  try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && Array.isArray(j.conds) && j.conds.length) Object.assign(S, { mode: j.mode, a0: j.a0, a1: j.a1, y0: j.y0, y1: j.y1, combine: j.combine, conds: j.conds }); } catch (e) { /* default */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ mode: S.mode, a0: S.a0, a1: S.a1, y0: S.y0, y1: S.y1, combine: S.combine, conds: S.conds })); } catch (e) { /* ignore */ } };
  const $ = id => document.getElementById(id), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const gl = n => (PLANET_GLYPHS[n] || '') + '︎', sy = i => SIGNS[i].symbol + '︎';
  const fd = jd => { const d = jdToDate(jd); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + yearLabel(d.getFullYear()); };
  const ft = jd => { const d = jdToDate(jd); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  function dur(days) { if (days < 1 / 24) return Math.max(1, Math.round(days * 1440)) + ' min'; if (days < 2) return Math.round(days * 24) + ' h'; if (days < 60) return Math.round(days) + ' days'; if (days < 730) return Math.round(days / 30.44) + ' months'; return (days / YR).toFixed(1) + ' years'; }
  const range = () => S.mode === 'age' ? ageRange(S.a0, S.a1) : yearRange(S.y0, S.y1);
  const chips = (c, i) => `<div class="tlf-pl">${PCH.map(n => `<button type="button" class="${c.planets.includes(n) ? 'on' : ''}" data-a="pl" data-i="${i}" data-n="${n}" style="--c:${PLANET_COLORS[n]}" aria-pressed="${c.planets.includes(n)}" aria-label="${n}"><span>${gl(n)}</span><i>${n.slice(0, 3)}</i></button>`).join('')}</div>`;
  const modeSeg = (c, i, a, b, la, lb, k) => `<div class="tlf-seg" role="group"><button type="button" class="${(c[k] || 'all') === a ? 'on' : ''}" data-a="cm" data-i="${i}" data-k="${k}" data-v="${a}">${la}</button><button type="button" class="${(c[k] || 'all') === b ? 'on' : ''}" data-a="cm" data-i="${i}" data-k="${k}" data-v="${b}">${lb}</button></div>`;
  function condHtml(c, i) {
    const top = `<div class="tlf-ch"><label class="tlf-sel"><select data-a="ct" data-i="${i}" aria-label="Condition type">${[['sign', 'Planets in a sign'], ['nak', 'Planets in a nakshatra'], ['rel', 'Planets meet or aspect'], ['retro', 'Planets retrograde']].map(x => `<option value="${x[0]}" ${c.t === x[0] ? 'selected' : ''}>${x[1]}</option>`).join('')}</select></label><button type="button" class="tlf-x" data-a="rm" data-i="${i}" aria-label="Remove condition" ${S.conds.length < 2 ? 'disabled' : ''}>✕</button></div>`;
    let b = '';
    if (c.t === 'sign') b = `<div class="tlf-sg">${SIGNS.map((s, k) => `<button type="button" class="${c.v === k ? 'on' : ''}" data-a="sv" data-i="${i}" data-v="${k}" aria-pressed="${c.v === k}" aria-label="${s.name}"><span>${sy(k)}</span><i>${s.name.slice(0, 3)}</i></button>`).join('')}</div>${chips(c, i)}${c.planets.length > 1 ? modeSeg(c, i, 'all', 'any', 'All together in it', 'Any one of them', 'mode') : ''}`;
    else if (c.t === 'nak') b = `<label class="tlf-sel wide"><select data-a="nv" data-i="${i}" aria-label="Nakshatra">${NAKSHATRAS.map((n, k) => `<option value="${k}" ${c.v === k ? 'selected' : ''}>${k + 1}. ${n}</option>`).join('')}</select></label>${chips(c, i)}${c.planets.length > 1 ? modeSeg(c, i, 'all', 'any', 'All together in it', 'Any one of them', 'mode') : ''}`;
    else if (c.t === 'retro') b = `${chips(c, i)}<div class="tlf-seg"><button type="button" class="${c.on !== false ? 'on' : ''}" data-a="ron" data-i="${i}" data-v="1">Retrograde</button><button type="button" class="${c.on === false ? 'on' : ''}" data-a="ron" data-i="${i}" data-v="0">Moving forward</button></div>${c.planets.length > 1 ? modeSeg(c, i, 'all', 'any', 'All of them', 'Any one of them', 'mode') : ''}`;
    else b = `<div class="tlf-rel"><select data-a="ra" data-i="${i}" aria-label="First planet">${PCH.map(n => `<option ${c.a === n ? 'selected' : ''}>${n}</option>`).join('')}</select><select data-a="rr" data-i="${i}" aria-label="Relation">${Object.keys(RELN).map(k => `<option value="${k}" ${c.rel === k ? 'selected' : ''}>${RELN[k]}</option>`).join('')}</select><select data-a="rb" data-i="${i}" aria-label="Second planet">${PCH.map(n => `<option ${c.b === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div><label class="tlf-orb">Closeness allowed: <b id="tlfOrb${i}">${c.orb}°</b><input type="range" min="1" max="15" step="1" value="${c.orb}" data-a="orb" data-i="${i}"></label>`;
    return `<div class="tlf-c">${top}${b}</div>`;
  }
  function resHtml() {
    if (S.busy) return `<div class="tlf-prog"><div><i style="width:${Math.round(S.prog * 100)}%"></i></div><button type="button" class="tlf-btn" data-a="stop">Stop</button></div>`;
    const r = S.res; if (!r) return S.msg ? `<div class="tlf-note bad">${esc(S.msg)}</div>` : '';
    if (r.error) return `<div class="tlf-note bad">${esc(r.error)}</div>`;
    const R = range(), w = r.windows;
    if (!w.length) return `<div class="tlf-note">No period between ${fd(R.from)} and ${fd(R.to)} matches ${S.conds.length > 1 && S.combine === 'all' ? 'all of these together' : 'this'}. Try "Any condition", a wider age range, or fewer conditions.</div>`;
    return `<div class="tlf-sum"><b>${w.length}${r.capped ? '+' : ''} period${w.length === 1 ? '' : 's'}</b> between ${fd(R.from)} and ${fd(R.to)}${r.capped ? ' (first ' + w.length + ' shown)' : ''}. Tap one to see every planet on that day.</div>` + w.map((x, k) => { const sh = x.to - x.from < 3; const age = (nowJD() - x.mid) / YR;
      const op = S.open === k;
      return `<div class="tlf-r${op ? ' open' : ''}"><button type="button" class="tlf-rh" data-a="open" data-k="${k}" aria-expanded="${op}"><div class="tlf-r1"><b>${fd(x.from)}${sh ? ' ' + ft(x.from) : ''} → ${fd(x.to)}${sh ? ' ' + ft(x.to) : ''}</b><span>${dur(x.to - x.from)}</span></div><div class="tlf-r2">Age then: ${age.toFixed(1)}${S.conds.length > 1 && S.combine === 'any' && x.which.length ? ' · matched ' + x.which.map(i => '#' + (i + 1)).join(' + ') : ''}</div><div class="tlf-r3">${x.pos.map(p => `<i><span>${gl(p.n)}</span>${p.d}° ${SIGNS[p.s].name.slice(0, 3)}</i>`).join('')}</div><div class="tlf-more">${op ? 'Hide the full sky ▴' : 'Show every planet on that day ▾'}</div></button>${op ? dayHtml(x, k) : ''}</div>`; }).join('');
  }
  function momentJD(x) { return S.mo === 'start' ? x.from : S.mo === 'end' ? x.to : x.mid; }
  function dayHtml(x, k) {
    const jd = momentJD(x), rows = PCH.map(n => { const lon = siderealLongitude(n, jd), si = Math.floor(lon / 30), dg = lon - si * 30, ni = getNakshatraIndex(lon), pada = Math.floor((lon % (360 / 27)) / (360 / 108)) + 1, rx = n !== 'Sun' && n !== 'Moon' && isRetrograde(n, jd);
      return `<div class="tlf-pr"><span class="tlf-pg" style="--c:${PLANET_COLORS[n]}">${gl(n)}</span><b>${n}${rx ? ' <em>℞</em>' : ''}</b><span>${Math.floor(dg)}°${String(Math.floor((dg % 1) * 60)).padStart(2, '0')}′ ${sy(si)} ${SIGNS[si].name}</span><small>${NAKSHATRAS[ni]} ${pada}</small></div>`; }).join('');
    const seg = [['start', 'Start'], ['mid', 'Middle'], ['end', 'End']].map(m => `<button type="button" class="${S.mo === m[0] ? 'on' : ''}" data-a="mo" data-v="${m[0]}" data-k="${k}">${m[1]}</button>`).join('');
    return `<div class="tlf-day"><div class="tlf-dh"><b>Sky on ${fd(jd)} ${ft(jd)}</b><div class="tlf-seg sm" role="group" aria-label="Moment in this period">${seg}</div></div>${rows}<button type="button" class="tlf-go2" data-a="go" data-k="${k}">Open this date in the 3D Sky</button></div>`;
  }
  function html() {
    const R = range(), y0 = jdToDate(R.from).getFullYear(), y1 = jdToDate(R.to).getFullYear();
    const when = `<section class="tlf-s"><h4>1 · When was the person born?</h4><div class="tlf-seg"><button type="button" class="${S.mode === 'age' ? 'on' : ''}" data-a="mode" data-v="age">Age (from today)</button><button type="button" class="${S.mode === 'years' ? 'on' : ''}" data-a="mode" data-v="years">Birth years</button></div>
      ${S.mode === 'age' ? `<div class="tlf-in"><label>From age<input type="number" inputmode="numeric" min="0" max="120" value="${S.a0}" data-a="a0"></label><span>to</span><label>To age<input type="number" inputmode="numeric" min="0" max="120" value="${S.a1}" data-a="a1"></label></div><div class="tlf-pre">${[[0, 10], [10, 20], [20, 30], [30, 40], [40, 50], [50, 60]].map(p => `<button type="button" class="${S.a0 === p[0] && S.a1 === p[1] ? 'on' : ''}" data-a="pre" data-a0="${p[0]}" data-a1="${p[1]}">${p[0]}–${p[1]}</button>`).join('')}</div>`
      : `<div class="tlf-in"><label>From year<input type="number" inputmode="numeric" value="${S.y0}" data-a="y0"></label><span>to</span><label>To year<input type="number" inputmode="numeric" value="${S.y1}" data-a="y1"></label></div>`}
      <p class="tlf-hint">Searching births from <b>${fd(R.from)}</b> to <b>${fd(R.to)}</b> (about ${y0}–${y1}).</p></section>`;
    const what = `<section class="tlf-s"><h4>2 · What should the sky show?</h4>${S.conds.map(condHtml).join('')}<div class="tlf-add"><button type="button" class="tlf-btn" data-a="add">＋ Add another sign + planet</button><button type="button" class="tlf-btn ghost" data-a="ex">Example: Sun in Libra + Moon in Pisces</button></div>
      ${S.conds.length > 1 ? `<div class="tlf-match"><span>Match</span><div class="tlf-seg"><button type="button" class="${S.combine === 'all' ? 'on' : ''}" data-a="comb" data-v="all">All conditions together</button><button type="button" class="${S.combine === 'any' ? 'on' : ''}" data-a="comb" data-v="any">Any condition</button></div></div>` : ''}</section>`;
    return when + what + `<button type="button" class="tlf-go" data-a="find" ${S.busy ? 'disabled' : ''}>${S.busy ? 'Searching…' : 'Find the dates'}</button><div id="tlfRes">${resHtml()}</div>`;
  }
  let open = false;
  function render() { const b = $('tlfBody'); if (!b) return; const y = b.scrollTop; b.innerHTML = html(); b.scrollTop = y; }
  function setOpen(v) { open = !!v; const s = $('tlfSheet'); if (!s) return; s.hidden = !open; if (open) { render(); const c = $('tlfClose'); if (c) c.focus(); } else { const t = $('toolsBtn'); if (t) t.focus(); } }
  async function find() {
    const R = range(), list = S.conds; S.res = null; S.msg = ''; save();
    if (list.some(c => !valid(c))) { S.res = { error: 'Choose at least one planet in every condition.' }; return render(); }
    S.busy = true; S.prog = 0; S.cancel = false; render();
    S.open = -1; const r = await search(list, S.combine, R.from, R.to, { onProgress: p => { S.prog = p; const el = document.querySelector('.tlf-prog i'); if (el) el.style.width = Math.round(p * 100) + '%'; }, cancel: () => S.cancel });
    S.busy = false; S.res = r.cancelled ? { windows: r.windows, capped: false } : r; render();
    const t = $('tlfRes'); if (t && t.scrollIntoView) t.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function onClick(e) {
    const t = e.target.closest('[data-a]'); if (!t) return; const a = t.dataset.a, i = +t.dataset.i, c = S.conds[i];
    const tog = (arr, n) => { const k = arr.indexOf(n); if (k >= 0) arr.splice(k, 1); else arr.push(n); };
    if (a === 'find') return find(); if (a === 'stop') { S.cancel = true; return; }
    if (a === 'mode') { S.mode = t.dataset.v; save(); return render(); }
    if (a === 'pre') { S.a0 = +t.dataset.a0; S.a1 = +t.dataset.a1; save(); return render(); }
    if (a === 'pl') { tog(c.planets, t.dataset.n); save(); return render(); }
    if (a === 'sv') { c.v = +t.dataset.v; save(); return render(); }
    if (a === 'cm') { c[t.dataset.k] = t.dataset.v; save(); return render(); }
    if (a === 'ron') { c.on = t.dataset.v === '1'; save(); return render(); }
    if (a === 'comb') { S.combine = t.dataset.v; save(); return render(); }
    if (a === 'rm') { if (S.conds.length > 1) S.conds.splice(i, 1); save(); return render(); }
    if (a === 'add') { S.conds.push({ t: 'sign', planets: [], v: 0, mode: 'all' }); save(); return render(); }
    if (a === 'ex') { S.conds = [{ t: 'sign', planets: ['Sun'], v: 6, mode: 'all' }, { t: 'sign', planets: ['Moon'], v: 11, mode: 'all' }]; S.combine = 'all'; S.res = null; save(); return render(); }
    if (a === 'open') { const k = +t.dataset.k; S.open = S.open === k ? -1 : k; render(); const el = document.querySelector('.tlf-r.open'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); return; }
    if (a === 'mo') { S.mo = t.dataset.v; return render(); }
    if (a === 'go') { const w = S.res && S.res.windows && S.res.windows[+t.dataset.k]; if (w) { const jd = momentJD(w); setOpen(false); if (typeof jumpToJD === 'function') jumpToJD(jd); } }
  }
  function onChange(e) {
    const t = e.target; if (!t.dataset || !t.dataset.a) return; const a = t.dataset.a, i = +t.dataset.i, c = S.conds[i];
    if (a === 'ct') { const nt = t.value; S.conds[i] = nt === 'rel' ? { t: 'rel', a: 'Sun', b: 'Moon', rel: 'opp', orb: 6 } : nt === 'nak' ? { t: 'nak', planets: c.planets || [], v: 0, mode: 'all' } : nt === 'retro' ? { t: 'retro', planets: c.planets || [], on: true, mode: 'all' } : { t: 'sign', planets: c.planets || [], v: 0, mode: 'all' }; save(); return render(); }
    if (a === 'nv') { c.v = +t.value; save(); return; } if (a === 'ra') { c.a = t.value; save(); return; } if (a === 'rb') { c.b = t.value; save(); return; } if (a === 'rr') { c.rel = t.value; save(); return; }
    if (a === 'orb') { c.orb = +t.value; save(); const b = $('tlfOrb' + i); if (b) b.textContent = c.orb + '°'; return; }
    if (a === 'a0' || a === 'a1' || a === 'y0' || a === 'y1') { const v = parseInt(t.value, 10); if (isFinite(v)) S[a] = v; save(); render(); }
  }
  function wire() {
    const btn = $('tlBtn'), sh = $('tlfSheet'); if (!btn || !sh) return;
    btn.addEventListener('click', () => setOpen(true)); $('tlfClose').addEventListener('click', () => setOpen(false));
    sh.addEventListener('click', e => { if (e.target === sh) setOpen(false); else onClick(e); }); sh.addEventListener('change', onChange);
    sh.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.a === 'orb') { const b = $('tlfOrb' + t.dataset.i); if (b) b.textContent = t.value + '°'; } });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) setOpen(false); });
  }
  const api = { test, search, ageRange, yearRange, valid, state: S, setOpen, render, get open() { return open; } };
  window.TLF = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  return api;
})();

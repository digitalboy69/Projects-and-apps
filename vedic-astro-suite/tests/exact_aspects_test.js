// Exact Aspects engine test (Node, no browser): geometry + brackets against the app's own sidereal engine.
// Run: node tests/exact_aspects_test.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const J = f => fs.readFileSync(path.join(__dirname, '..', 'apps', 'sky3d', 'js', f), 'utf8');
const doc = { getElementById: () => null, querySelector: () => ({ addEventListener(){} }), querySelectorAll: () => [] };
const ctx = { window: {}, document: doc, console, setTimeout, Math, Date, Object, Array, Number, String, JSON, isFinite, parseFloat };
ctx.window = ctx; vm.createContext(ctx);
for (const f of ['01-astro-engine.js', '02-planetary-dignity.js', '03-ascendant-houses-drishti.js']) vm.runInContext(J(f), ctx, { filename: f });
vm.runInContext('const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; window.DFU={STEP:{Sun:0.5,Moon:0.2,Mars:0.5,Mercury:0.4,Jupiter:1,Venus:0.5,Saturn:1,Rahu:4,Ketu:4},nextTick:()=>Promise.resolve()};', ctx);
vm.runInContext(J('53-exact-aspects.js'), ctx, { filename: '52' });
const AXA = ctx.AXA;
const out = []; const ok = (n, c, d) => { out.push([c ? 'PASS' : 'FAIL', n, d === undefined ? '' : String(d)]); };
(async () => {
  const now = vm.runInContext('toJulianDay(2026,11,2,0,0,0)', ctx);
  const sl = (n, jd) => vm.runInContext(`siderealLongitude(${JSON.stringify(n)}, ${jd})`, ctx);
  const ad = (a, b) => vm.runInContext(`angDiff(${a}, ${b})`, ctx);
  // The user's example: natal Mars 18 Gemini = 78 deg. Rahu 5th aspect -> Rahu at 318 (18 Aquarius); 7th -> 258; 9th -> 198; conj -> 78
  const T = 78;
  for (const [off, want] of [[5, 318], [7, 258], [9, 198], [1, 78]]) {
    const w = await AXA.findWindows({ mover: 'Rahu', off, targetFn: () => T, targetName: null, now, dir: 1, count: 3, orb: 1, tok: null });
    ok(`Rahu offset ${off}: found 3 windows`, w.length === 3, w.length);
    const e = w[0].exact[0];
    ok(`Rahu offset ${off}: Rahu stands at ${want} deg at the exact moment`, Math.abs(ad(sl('Rahu', e.jd), want)) < 1e-4, sl('Rahu', e.jd).toFixed(5));
    ok(`Rahu offset ${off}: aspect point equals target`, Math.abs(ad(sl('Rahu', e.jd) + (off - 1) * 30, T)) < 1e-4);
    ok(`Rahu offset ${off}: window brackets exact and is about 2 x orb / 0.053 deg per day (~38 d)`, w[0].start < e.jd && e.jd < w[0].end && (w[0].end - w[0].start) > 30 && (w[0].end - w[0].start) < 46, (w[0].end - w[0].start).toFixed(1));
    ok(`Rahu offset ${off}: window edges are exactly 1 deg away`, Math.abs(Math.abs(ad(sl('Rahu', w[0].start) + (off - 1) * 30, T)) - 1) < 1e-3 && Math.abs(Math.abs(ad(sl('Rahu', w[0].end) + (off - 1) * 30, T)) - 1) < 1e-3);
    ok(`Rahu offset ${off}: results are in time order and after-now`, w[0].end >= now && w[1].exact[0].jd > w[0].exact[0].jd && w[2].exact[0].jd > w[1].exact[0].jd);
  }
  // Past direction
  const wp = await AXA.findWindows({ mover: 'Rahu', off: 5, targetFn: () => T, targetName: null, now, dir: -1, count: 2, orb: 1, tok: null });
  ok('past: windows are before now and newest first', wp.length === 2 && wp[0].start <= now && wp[0].exact[0].jd > wp[1].exact[0].jd, wp.map(c => c.exact[0].jd.toFixed(1)));
  // Rahu cycle ~18.6 years between same-degree passes
  const w3 = await AXA.findWindows({ mover: 'Rahu', off: 5, targetFn: () => T, targetName: null, now, dir: 1, count: 3, orb: 1, tok: null });
  const gap = (w3[1].exact[0].jd - w3[0].exact[0].jd) / 365.25;
  ok('Rahu repeats about every 18.6 years', Math.abs(gap - 18.6) < 0.3, gap.toFixed(2));
  // Retrograde planet: Mars passes can come in 1 or 3 exacts per window; all inside one window
  const wm = await AXA.findWindows({ mover: 'Saturn', off: 7, targetFn: () => 200, targetName: null, now, dir: 1, count: 3, orb: 1, tok: null });
  ok('Saturn 7th: windows contain all their exact passes', wm.every(c => c.exact.every(e => e.jd >= c.start && e.jd <= c.end)) && wm.length === 3, wm.map(c => c.exact.length));
  ok('Saturn 7th: every exact pass really is exact', wm.every(c => c.exact.every(e => Math.abs(ad(sl('Saturn', e.jd) + 180, 200)) < 1e-4)));
  // Moon (fast): 7th aspect on a fixed point happens within ~14 days; narrow window
  const wmo = await AXA.findWindows({ mover: 'Moon', off: 7, targetFn: () => 100, targetName: null, now, dir: 1, count: 3, orb: 1, tok: null });
  ok('Moon 7th: next 3 within about 3 months and windows < 3 days', wmo.length === 3 && wmo[2].exact[0].jd - now < 90 && wmo.every(c => c.end - c.start < 3), wmo.map(c => (c.exact[0].jd - now).toFixed(1)));
  // Live-sky mode: moving target. Jupiter 5th on live Saturn
  const wl = await AXA.findWindows({ mover: 'Jupiter', off: 5, targetFn: jd => sl('Saturn', jd), targetName: 'Saturn', now, dir: 1, count: 2, orb: 1, tok: null });
  ok('live sky: Jupiter 5th aspect on moving Saturn is exact', wl.length === 2 && wl.every(c => c.exact.every(e => Math.abs(ad(sl('Jupiter', e.jd) + 120, sl('Saturn', e.jd))) < 1e-4)), wl.length);
  // A window running right now is included (Rahu inside orb of a point it is crossing today)
  const L0 = sl('Rahu', now), tNow = (L0 + 0.3 + 360) % 360;
  const wa = await AXA.findWindows({ mover: 'Rahu', off: 1, targetFn: () => tNow, targetName: null, now, dir: 1, count: 1, orb: 1, tok: null });
  ok('active window (inside orb now) is returned first', wa.length === 1 && wa[0].start <= now && wa[0].end >= now, (wa[0].exact[0].jd - now).toFixed(2));
  const bad = out.filter(r => r[0] === 'FAIL');
  out.forEach(r => console.log(r.join(' | ')));
  console.log(bad.length ? `FAILED ${bad.length}` : `ALL ${out.length} PASSED`);
  process.exit(bad.length ? 1 : 0);
})();

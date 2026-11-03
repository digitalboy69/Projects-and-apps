// A forgotten KP/Raman choice must never shift Moon or Dasha on a fresh visit (Node, no browser).
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = f => fs.readFileSync(path.join(__dirname, '..', 'apps', f), 'utf8');
let bad = 0; const ok = (n, c, d) => { console.log((c ? 'ok   ' : 'FAIL ') + n + (c ? '' : ' ' + d)); if (!c) bad++; };
for (const f of ['birth-chart/js/03-ephemeris-engine.js', 'sky3d/js/01-astro-engine.js']) {
  const store = { local: { vax_ayanamsa: 'kp' }, session: {} };   // an OLD permanent KP choice is lying in the browser
  const mk = o => ({ getItem: k => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: k => { delete o[k]; } });
  const ctx = { console, Math, Date, Object, Array, Number, String, JSON, localStorage: mk(store.local), sessionStorage: mk(store.session) }; ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(src(f), ctx, { filename: f });
  const jd = 2451545.0, lah = vm.runInContext('lahiriAyanamsa(2451545.0)', ctx);
  ok(f + ': old permanent KP choice is ignored on a fresh visit (Lahiri)', vm.runInContext('ayanKey()', ctx) === 'lahiri' && Math.abs(lah - 23.857) < 0.01, lah);
  ok(f + ': old permanent choice is erased', !('vax_ayanamsa' in store.local));
  store.session.vax_ayanamsa = 'kp';
  ok(f + ': a choice made in this tab still works (KP = Lahiri - 0.0968)', Math.abs(vm.runInContext('lahiriAyanamsa(2451545.0)', ctx) - (lah - 0.0968)) < 1e-9);
}
console.log(bad ? 'FAILED ' + bad : 'ALL PASSED'); process.exit(bad ? 1 : 0);

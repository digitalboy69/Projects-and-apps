// The 3D Sky's divisional sign rules (apps/sky3d/js/64-varga-math.js, global VG) must equal the Birth Chart app's calcVarga for every varga
// and every degree, and VG.lon('D9') must equal the Navamsha sky (lon x 9). Run: node tests/sky3d_varga_parity_test.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const R = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const base = 'const normDeg=x=>((x%360)+360)%360;const getSignIndex=l=>Math.floor(normDeg(l)/30);const getDegInSign=l=>normDeg(l)%30;';
const bc = R('apps/birth-chart/js/05-ascendant-nakshatra-vargas.js');
const a = bc.indexOf('const VARGAS = {'), b0 = bc.indexOf('function calcVarga(varga, lon){'), e = bc.indexOf('    default: return signIdx;\n  }\n}', b0) + '    default: return signIdx;\n  }\n}'.length;
const ctx = {}; vm.createContext(ctx);
vm.runInContext(base + bc.slice(a, e) + ';globalThis.BC={calcVarga,VARGAS};', ctx);
vm.runInContext(R('apps/sky3d/js/64-varga-math.js').replace('const VG', 'globalThis.VG') , ctx);
let bad = 0; const fail = m => { bad++; if (bad < 12) console.log('FAIL', m); };
const keys = Object.keys(ctx.BC.VARGAS);
if (JSON.stringify(keys) !== JSON.stringify(ctx.VG.keys)) fail('varga key lists differ');
for (const k of keys) for (let l = 0; l < 360; l += 0.0731) {
  const s1 = ctx.BC.calcVarga(k, l), s2 = ctx.VG.sign(k, l), v = ctx.VG.lon(k, l);
  if (s1 !== s2) fail(k + ' sign differs at ' + l);
  if (!(v >= 0 && v < 360) || Math.floor(v / 30) !== s1) fail(k + ' lon not in its sign at ' + l + ' -> ' + v);
}
for (let l = 0; l < 360; l += 0.0731) { const d = ctx.VG.lon('D9', l), e9 = ((l * 9) % 360 + 360) % 360, df = Math.abs(d - e9); if (Math.min(df, 360 - df) > 1e-6) fail('D9 != lon*9 at ' + l); }
// D10 by hand: Aries 0 deg (odd sign) -> part 0 -> Aries; Aries 29.9 -> 10th part -> Capricorn
if (ctx.VG.sign('D10', 0.1) !== 0 || ctx.VG.sign('D10', 29.9) !== 9) fail('D10 hand check');
// continuity: inside one division the stretched longitude rises smoothly, 0 at the start of a division
if (Math.abs(ctx.VG.lon('D10', 3) % 30) > 1e-9 || Math.abs(ctx.VG.lon('D10', 4.5) % 30 - 15) > 1e-9) fail('D10 stretch check');
console.log(bad ? 'FAILED' : 'ALL OK', keys.length, 'vargas');
process.exit(bad ? 1 : 0);

/* Formula Maker library + sharing (js/68, global FMX). ~30 ready formulas (definitions only, no predictions), the share code (VF1.<base64url>), the #f= link, plain-English card text,
   import from code / link / JSON, and the Saved list (localStorage sky3d_fm_saved). Needs FM (js/67). See docs/FORMULA_MAKER_PLAN.md. */
const FMX = (() => {
  'use strict';
  const pl = (v, of) => ({ k: 'planet', v, of: of || 'C' }), role = v => ({ k: 'role', v, of: 'C' }), pt = (v, of) => ({ k: 'point', v, of: of || 'C' }), lord = (v, of) => ({ k: 'lord', v, of: of || 'C' });
  const nk = name => Math.max(0, NAKSHATRAS.indexOf(name)), sgn = n => SIGNS.findIndex(s => s.name === n);
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUS = [6, 8, 12], OTH5 = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const R = FM.rule, F = (cat, name, about, items, g, scheme) => Object.assign(FM.formula(name, about, items, g, scheme), { cat, id: 'lib_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_') });
  const mahapurusha = (planet, signs, label) => F('Yogas', label + ' Yoga (Pancha Mahapurusha)', planet + ' in its own or exaltation sign and in a kendra (1, 4, 7 or 10) from the Lagna. Needs a birth time and place.',
    [R(pl(planet), 'in_sign', null, { signs: signs.map(sgn) }), R(pl(planet), 'in_house', null, { houses: KENDRA })]);
  const LIB = [
    F('Yogas', 'Gajakesari', 'Jupiter in a kendra (1, 4, 7, 10) from the Moon.', [R(pl('Jupiter'), 'in_house', pl('Moon'), { houses: KENDRA })]),
    F('Yogas', 'Budhaditya', 'Sun and Mercury in the same sign.', [R(pl('Sun'), 'same_sign', pl('Mercury'))]),
    F('Yogas', 'Chandra-Mangala', 'Moon and Mars in the same sign.', [R(pl('Moon'), 'same_sign', pl('Mars'))]),
    mahapurusha('Mars', ['Aries', 'Scorpio', 'Capricorn'], 'Ruchaka'), mahapurusha('Mercury', ['Gemini', 'Virgo'], 'Bhadra'), mahapurusha('Jupiter', ['Sagittarius', 'Pisces', 'Cancer'], 'Hamsa'),
    mahapurusha('Venus', ['Taurus', 'Libra', 'Pisces'], 'Malavya'), mahapurusha('Saturn', ['Capricorn', 'Aquarius', 'Libra'], 'Sasa'),
    F('Yogas', 'Sunapha', 'Any planet from Mars to Saturn in the 2nd house from the Moon.', [R(OTH5.map(n => pl(n)), 'in_house', pl('Moon'), { houses: [2] })]),
    F('Yogas', 'Anapha', 'Any planet from Mars to Saturn in the 12th house from the Moon.', [R(OTH5.map(n => pl(n)), 'in_house', pl('Moon'), { houses: [12] })]),
    F('Yogas', 'Duradhara', 'Planets (Mars to Saturn) on both sides of the Moon: 2nd and 12th from it.', [R(OTH5.map(n => pl(n)), 'in_house', pl('Moon'), { houses: [2] }), R(OTH5.map(n => pl(n)), 'in_house', pl('Moon'), { houses: [12] })]),
    F('Yogas', 'Kemadruma (simple form)', 'No planet from Mars to Saturn in the 2nd or 12th from the Moon, and none with the Moon.', [{ g: 'none', n: 1, items: [R(OTH5.map(n => pl(n)), 'in_house', pl('Moon'), { houses: [2, 12] }), R(OTH5.map(n => pl(n)), 'same_sign', pl('Moon'))] }]),
    F('Yogas', 'Guru-Chandal', 'Jupiter and Rahu in the same sign.', [R(pl('Jupiter'), 'same_sign', pl('Rahu'))]),
    F('Yogas', 'Angarak', 'Mars and Rahu in the same sign.', [R(pl('Mars'), 'same_sign', pl('Rahu'))]),
    F('Yogas', 'Grahan (eclipse) yoga', 'Sun or Moon in the same sign as Rahu or Ketu.', [R([pl('Sun'), pl('Moon')], 'same_sign', [pl('Rahu'), pl('Ketu')])]),
    F('Yogas', 'Manglik placement', 'Mars in the 1st, 2nd, 4th, 7th, 8th or 12th house from the Lagna.', [R(pl('Mars'), 'in_house', null, { houses: [1, 2, 4, 7, 8, 12] })]),
    F('Yogas', 'Dhana: lords of 2 and 11 together', 'Lord of the 2nd and lord of the 11th in the same sign.', [R(lord(2), 'same_sign', lord(11))]),
    F('Yogas', 'Raja: lords of 9 and 10 together', 'Lord of the 9th and lord of the 10th in the same sign.', [R(lord(9), 'same_sign', lord(10))]),
    F('Yogas', 'Dharma-Karmadhipati exchange', 'Lords of the 9th and 10th exchange signs.', [R(lord(9), 'exchange', lord(10))]),
    F('Yogas', 'Lords of 6 / 8 / 12 in dusthanas', 'Any lord of the 6th, 8th or 12th sitting in the 6th, 8th or 12th house (simple form of Vipareeta).', [R([lord(6), lord(8), lord(12)], 'in_house', null, { houses: DUS })]),
    F('Yogas', 'Moon is vargottama', 'The Moon is in the same sign in the D1 and the D9.', [R(pl('Moon'), 'vargottama', null, { on: true })]),
    F('Yogas', 'A planet is exalted', 'Any of the seven planets in its exaltation sign.', [R(['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].map(n => pl(n)), 'dignity', null, { digs: ['Exalted'] })]),
    F('Karakas', 'Atmakaraka in a kendra', 'The planet with the highest degree is in a kendra from the Lagna.', [R(role('AK'), 'in_house', null, { houses: KENDRA })]),
    F('Karakas', 'AK and DK in the same sign', 'Atmakaraka and Darakaraka share a sign.', [R(role('AK'), 'same_sign', role('DK'))]),
    F('Karakas', 'AK aspects DK', 'Atmakaraka and Darakaraka aspect each other (graha drishti).', [R(role('AK'), 'aspect', role('DK'), { dir: 'mutual' })]),
    F('Karakas', 'AK in own or exalted sign', 'Atmakaraka is exalted or in its own sign.', [R(role('AK'), 'dignity', null, { digs: ['Exalted', 'Own sign'] })]),
    F('Karakas', 'Darakaraka in the 7th', 'The planet with the lowest degree sits in the 7th house.', [R(role('DK'), 'in_house', null, { houses: [7] })]),
    F('Karakas', 'Karakamsa and Lagna same sign', 'The Atmakaraka\'s Navamsa sign equals the Lagna sign.', [R(pt('Karakamsa'), 'same_sign', pt('Lagna'))]),
    F('Points', 'Bhrigu Bindu in the 10th', 'Bhrigu Bindu (Moon-Rahu midpoint) sits in the 10th house.', [R(pt('BB'), 'in_house', null, { houses: [10] })]),
    F('Points', 'Yogi planet with the Moon', 'The Yogi planet shares a sign with the Moon.', [R(pt('YL'), 'same_sign', pl('Moon'))]),
    F('Points', 'Avayogi planet in a dusthana', 'The Avayogi planet sits in the 6th, 8th or 12th.', [R(pt('AL2'), 'in_house', null, { houses: DUS })]),
    F('Points', 'Arudha Lagna in a kendra', 'AL falls in a kendra from the Lagna.', [R({ k: 'arudha', v: 1, of: 'C' }, 'in_house', null, { houses: KENDRA })]),
    F('Transits', 'Sade Sati (Saturn over your Moon)', 'Transit Saturn in the 12th, 1st or 2nd sign from your natal Moon. Add a person, then use "Find dates".', [R(pl('Saturn', 'S'), 'in_house', pl('Moon', 'N'), { houses: [12, 1, 2] })]),
    F('Transits', 'Shani Dhaiya (Saturn 4th / 8th)', 'Transit Saturn in the 4th or 8th sign from your natal Moon.', [R(pl('Saturn', 'S'), 'in_house', pl('Moon', 'N'), { houses: [4, 8] })]),
    F('Transits', 'Jupiter favourable from Moon', 'Transit Jupiter in the 2nd, 5th, 7th, 9th or 11th sign from your natal Moon.', [R(pl('Jupiter', 'S'), 'in_house', pl('Moon', 'N'), { houses: [2, 5, 7, 9, 11] })]),
    F('Transits', 'Saturn over your Bhrigu Bindu', 'Transit Saturn within 3° of your natal Bhrigu Bindu.', [R(pl('Saturn', 'S'), 'conj', pt('BB', 'N'), { orb: 3 })]),
    F('Transits', 'Jupiter over your Bhrigu Bindu', 'Transit Jupiter within 3° of your natal Bhrigu Bindu.', [R(pl('Jupiter', 'S'), 'conj', pt('BB', 'N'), { orb: 3 })]),
    F('Transits', 'Jupiter over your Atmakaraka', 'Transit Jupiter within 5° of your natal Atmakaraka planet.', [R(pl('Jupiter', 'S'), 'conj', { k: 'role', v: 'AK', of: 'N' }, { orb: 5 })]),
    F('Transits', 'Saturn crosses your Lagna sign', 'Transit Saturn in the same sign as your natal Lagna.', [R(pl('Saturn', 'S'), 'same_sign', pt('Lagna', 'N'))]),
    F('Sky', 'Libra Sun + Pisces Moon', 'The Sun in Libra and the Moon in Pisces (sidereal).', [R(pl('Sun'), 'in_sign', null, { signs: [sgn('Libra')] }), R(pl('Moon'), 'in_sign', null, { signs: [sgn('Pisces')] })]),
    F('Sky', 'Mercury retrograde', 'Mercury is moving retrograde.', [R(pl('Mercury'), 'retro', null, { on: true })]),
    F('Sky', 'Full Moon (Purnima-like)', 'Sun and Moon about opposite (within 12°).', [R(pl('Sun'), 'angle', pl('Moon'), { angle: 180, orb: 12 })]),
    F('Sky', 'New Moon (Amavasya-like)', 'Sun and Moon within 12° of each other.', [R(pl('Sun'), 'conj', pl('Moon'), { orb: 12 })]),
    F('Sky', 'Pushya Moon', 'The Moon is in Pushya nakshatra.', [R(pl('Moon'), 'in_nak', null, { naks: [nk('Pushya')] })]),
    F('Sky', 'Saturn and Jupiter in trine', 'Saturn and Jupiter 120° apart within 8°.', [R(pl('Saturn'), 'angle', pl('Jupiter'), { angle: 120, orb: 8 })]),
    F('Sky', 'Moon in gandanta', 'The Moon is in a gandanta (water-fire sign junction) zone.', [R(pl('Moon'), 'gandanta', null, { on: true })])
  ];
  const cats = () => Array.from(new Set(LIB.map(f => f.cat)));
  const clone = f => JSON.parse(JSON.stringify(f));

  /* ---------------- share code ---------------- */
  const OK = { planet: 'p', role: 'r', point: 'n', lord: 'l', arudha: 'a', sign: 's', house: 'h' }, KO = Object.fromEntries(Object.entries(OK).map(([k, v]) => [v, k]));
  const opS = o => o.of && o.of !== 'C' ? [OK[o.k], o.v, o.of] : [OK[o.k], o.v];
  const opD = a => Array.isArray(a) && KO[a[0]] ? { k: KO[a[0]], v: a[1], of: a[2] || 'C' } : null;
  const nodeS = n => n.g ? { g: n.g, n: n.n > 1 ? n.n : undefined, i: n.items.map(nodeS) } : { a: n.a.map(opS), q: n.q === 'all' ? 1 : undefined, r: n.r, b: n.b.length ? n.b.map(opS) : undefined, u: n.bq === 'all' ? 1 : undefined, p: Object.keys(n.p || {}).length ? n.p : undefined, x: n.neg ? 1 : undefined };
  const nodeD = n => n.g ? { g: n.g, n: n.n || 1, items: (n.i || []).map(nodeD) } : { a: (n.a || []).map(opD).filter(Boolean), q: n.q ? 'all' : 'any', r: n.r, b: (n.b || []).map(opD).filter(Boolean), bq: n.u ? 'all' : 'any', p: n.p || {}, neg: !!n.x };
  const b64 = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64 = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4))));
  function encode(f) { const n = FM.normalize(f); if (!n) return ''; return 'VF1.' + b64(JSON.stringify({ n: n.name, d: n.about || undefined, s: n.scheme === 8 ? 8 : undefined, t: nodeS(n.root) })); }
  function decode(text) {
    let s = String(text || '').trim(); if (!s) return { error: 'Nothing to import.' };
    const m = /VF1\.([A-Za-z0-9_-]+)/.exec(s);
    try {
      if (m) { const j = JSON.parse(unb64(m[1])); const f = FM.normalize({ v: 1, name: j.n, about: j.d, scheme: j.s, root: nodeD(j.t) }); return f ? { formula: f } : { error: 'That code is not a valid formula.' }; }
      if (s[0] === '{') { const j = JSON.parse(s), f = FM.normalize(j.formula || j); return f ? { formula: f } : { error: 'That JSON is not a valid formula.' }; }
    } catch (e) { return { error: 'Could not read that code.' }; }
    return { error: 'Paste a share code (VF1…), a link or formula JSON.' };
  }
  const link = f => { const base = location.href.split('#')[0]; return base + '#f=' + encode(f); };
  const card = f => FM.describe(f) + '\n\nShare code: ' + encode(f) + '\nOpen in the 3D Sky Formula Maker: ' + link(f) + '\n— Vedic Astro Suite';

  /* ---------------- saved list ---------------- */
  const KEY = 'sky3d_fm_saved';
  const loadAll = () => { try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return (Array.isArray(a) ? a : []).map(FM.normalize).filter(Boolean); } catch (e) { return []; } };
  const store = a => { try { localStorage.setItem(KEY, JSON.stringify(a)); return true; } catch (e) { return false; } };
  const save = f => { const n = FM.normalize(f); if (!n) return false; const a = loadAll(), i = a.findIndex(x => x.id === n.id); if (i >= 0) a[i] = n; else a.unshift(n); return store(a); };
  const remove = id => store(loadAll().filter(x => x.id !== id));
  const dup = id => { const a = loadAll(), f = a.find(x => x.id === id); if (!f) return null; const c = clone(f); c.id = FM.uid(); c.name = f.name + ' (copy)'; a.unshift(c); store(a); return c; };
  const exportAll = () => JSON.stringify({ app: 'vedic-astro-suite', kind: 'formulas', v: 1, formulas: loadAll() }, null, 2);
  function importAll(text) { try { const j = JSON.parse(text), arr = Array.isArray(j) ? j : j.formulas; if (!Array.isArray(arr)) return 0; let n = 0; arr.forEach(x => { const f = FM.normalize(x); if (f) { f.id = FM.uid(); save(f); n++; } }); return n; } catch (e) { return 0; } }
  /* a link like ...#f=VF1.xxxx */
  const fromHash = () => { const m = /[#&]f=([^&]+)/.exec(location.hash || ''); if (!m) return null; const r = decode(decodeURIComponent(m[1])); return r.formula || null; };

  return { LIB, cats, clone, encode, decode, link, card, loadAll, save, remove, dup, exportAll, importAll, fromHash, pl, role, pt, lord };
})();
window.FMX = FMX;

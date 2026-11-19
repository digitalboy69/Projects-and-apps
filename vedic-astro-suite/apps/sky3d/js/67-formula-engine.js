/* Formula Maker engine (js/67, global FM). A formula is a tree of rules about a chart; every rule says "A is in relation R to B" and answers true / false / unknown (null).
   Subjects: planets, Chara Karakas AK..DK (7 or 8 scheme), Lagna, Bhrigu Bindu, Yogi / Avayogi points and planets, Duplicate Yogi, Gulika, Hora / Ghati / Indu lagna, Karakamsa, Swamsha,
   Arudha padas A1..A12, house lords, fixed signs and houses. Charts: C (the chart being checked), N (a person), S (sky moment), P (second person).
   Pure functions on top of the sky3d engine globals (snapshotPositions, siderealLongitude, siderealAscendant, SIGNS, NAKSHATRAS, VG, GK ...). See docs/FORMULA_MAKER_PLAN.md. */
const FM = (() => {
  'use strict';
  const P9 = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const K7 = ['AK', 'AmK', 'BK', 'MK', 'PuK', 'GK', 'DK'], K8 = ['AK', 'AmK', 'BK', 'MK', 'PiK', 'PuK', 'GK', 'DK'];
  const ROLE_NAME = { AK: 'Atmakaraka', AmK: 'Amatyakaraka', BK: 'Bhratrikaraka', MK: 'Matrikaraka', PiK: 'Pitrikaraka', PuK: 'Putrakaraka', GK: 'Gnatikaraka', DK: 'Darakaraka' };
  const POINTS = { Lagna: 'Lagna (Ascendant)', BB: 'Bhrigu Bindu', YP: 'Yogi point', AP: 'Avayogi point', YL: 'Yogi planet', AL2: 'Avayogi planet', DY: 'Duplicate Yogi', Gulika: 'Gulika', Hora: 'Hora Lagna', Ghati: 'Ghati Lagna', Indu: 'Indu Lagna', Karakamsa: 'Karakamsa', Swamsha: 'Swamsha' };
  const INDU = { Sun: 30, Moon: 16, Mars: 6, Mercury: 8, Jupiter: 10, Venus: 12, Saturn: 1 };
  const nd = x => ((x % 360) + 360) % 360, sg = l => Math.floor(nd(l) / 30), dist = (a, b) => { const d = Math.abs(nd(a) - nd(b)); return d > 180 ? 360 - d : d; };
  const sname = i => SIGNS[i].name, ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));
  const dms = l => { const d = nd(l) % 30, m = Math.round((d - Math.floor(d)) * 60); return (m === 60 ? Math.floor(d) + 1 : Math.floor(d)) + '°' + String(m === 60 ? 0 : m).padStart(2, '0') + "'"; };
  const hOf = (from, to) => ((to - from + 12) % 12) + 1;

  /* ---------------------------- charts ---------------------------- */
  function chart(o) { // {jd, lagna:lon|null, prof, loc, base:signIdx|null, scheme, label, birth}
    const s = snapshotPositions(o.jd), C = { jd: o.jd, sid: s.sidereal, retro: s.retro, lagna: o.lagna == null ? null : nd(o.lagna), prof: o.prof || null, loc: o.loc || o.prof || null, scheme: o.scheme === 8 ? 8 : 7, label: o.label || '', birth: !!o.birth, _: {} };
    C.base = C.lagna != null ? sg(C.lagna) : (o.base == null ? null : o.base);
    return C;
  }
  const memo = (C, k, f) => (k in C._ ? C._[k] : (C._[k] = f()));
  function karakas(C) {
    return memo(C, 'kar' + C.scheme, () => {
      const names = C.scheme === 8 ? ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu'] : ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
      const rows = names.map(n => ({ n, d: n === 'Rahu' ? 30 - (nd(C.sid[n]) % 30) : nd(C.sid[n]) % 30 })).sort((a, b) => b.d - a.d);
      const roles = C.scheme === 8 ? K8 : K7, m = {}; rows.forEach((r, i) => { m[roles[i]] = r.n; }); return { map: m, rows };
    });
  }
  const yogiPt = C => memo(C, 'yp', () => nd(C.sid.Sun + C.sid.Moon + 93 + 20 / 60));
  const avaPt = C => memo(C, 'ap', () => nd(yogiPt(C) + 186 + 40 / 60));
  const bhrigu = C => memo(C, 'bb', () => { const m = C.sid.Moon, r = C.sid.Rahu, gap = nd(r - m); let mid = nd((m + r) / 2); if (gap > 180) mid = nd(mid + 180); return mid; });
  function gulikaLon(C) {
    return memo(C, 'gk', () => { try { const r = C.birth && C.prof ? GK.natal(C.prof) : (C.loc ? GK.at(C.jd, C.loc.lat, C.loc.lon, C.loc.tz, 'start') : null); const v = r && (r.lon != null ? r.lon : r.longitude); return v == null ? null : nd(v); } catch (e) { return null; } });
  }
  function sunriseInfo(C) {
    return memo(C, 'sr', () => {
      const L = C.loc; if (!L || L.lat == null) return null;
      try {
        const loc = new Date((C.jd + L.tz / 24 - 2440587.5) * 86400000); let y = loc.getUTCFullYear(), m = loc.getUTCMonth() + 1, d = loc.getUTCDate();
        let rs = GK.riseSet(y, m, d, L.lat, L.lon, L.tz); if (!rs || rs.rise == null) return null;
        if (C.jd < rs.rise) { const t = new Date(Date.UTC(y, m - 1, d - 1)); rs = GK.riseSet(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), L.lat, L.lon, L.tz); if (!rs || rs.rise == null) return null; }
        return { jd: rs.rise, sun: siderealLongitude('Sun', rs.rise) };
      } catch (e) { return null; }
    });
  }
  const hora = C => memo(C, 'hora', () => { const s = sunriseInfo(C); return s ? nd(s.sun + (C.jd - s.jd) * 720) : null; });
  const ghati = C => memo(C, 'ghati', () => { const s = sunriseInfo(C); return s ? nd(s.sun + (C.jd - s.jd) * 1800) : null; });
  const baseSign = C => C.base;
  const houseSign = (C, h) => C.base == null ? null : (C.base + h - 1) % 12;
  function indu(C) {
    if (C.base == null) return null; const ms = sg(C.sid.Moon), lm = SIGNS[(ms + 8) % 12].lord, ll = SIGNS[(C.base + 8) % 12].lord;
    let r = ((INDU[lm] || 0) + (INDU[ll] || 0)) % 12; if (r === 0) r = 12; return (ms + r - 1) % 12;
  }
  function arudha(C, h) {
    if (C.base == null) return null; const hs = (C.base + h - 1) % 12, lord = SIGNS[hs].lord, ls = sg(C.sid[lord]); let p = (ls + ((ls - hs + 12) % 12)) % 12; const d = (p - hs + 12) % 12; if (d === 0 || d === 6) p = (p + 9) % 12; return p;
  }
  const d9 = l => VG.sign('D9', l);

  /* ---------------------------- subjects ---------------------------- */
  const PTL = { YP: 'Yogi point', AP: 'Avayogi point' };
  function resolve(op, X) {
    const ch = X[op.of || 'C']; const base = { op, ch };
    if (!ch) return Object.assign(base, { miss: 'No chart is loaded for ' + (op.of === 'P' ? 'the second person' : op.of === 'N' ? 'the person' : 'this check') });
    const mk = (name, lon, sign, planet, extra) => Object.assign(base, { name, lon, sign: sign == null ? (lon == null ? null : sg(lon)) : sign, planet: planet || null }, extra || {});
    const miss = why => Object.assign(base, { miss: why, name: opName(op) });
    const pl = n => mk(n, ch.sid[n], null, n);
    switch (op.k) {
      case 'planet': return pl(op.v);
      case 'role': { const n = karakas(ch).map[op.v]; if (!n) return miss(op.v + ' needs the 8-karaka scheme'); return mk(op.v + ' (' + n + ')', ch.sid[n], null, n, { role: op.v }); }
      case 'sign': return mk(sname(op.v), null, op.v, null, { fixed: true });
      case 'house': { const s = houseSign(ch, op.v); return s == null ? miss('houses need a Lagna (birth time and place)') : mk(ord(op.v) + ' house (' + sname(s) + ')', null, s, null, { fixed: true }); }
      case 'lord': { const s = houseSign(ch, op.v); if (s == null) return miss('house lords need a Lagna'); const n = SIGNS[s].lord; return mk('lord of ' + ord(op.v) + ' (' + n + ')', ch.sid[n], null, n); }
      case 'arudha': { const s = arudha(ch, op.v); return s == null ? miss('Arudha needs a Lagna') : mk(op.v === 1 ? 'Arudha Lagna (AL)' : op.v === 12 ? 'Upapada (UL)' : 'A' + op.v, null, s); }
      case 'point': {
        const v = op.v;
        if (v === 'Lagna') return ch.lagna == null ? miss('Lagna needs birth time and place') : mk('Lagna', ch.lagna);
        if (v === 'BB') return mk('Bhrigu Bindu', bhrigu(ch));
        if (v === 'YP') return mk('Yogi point', yogiPt(ch));
        if (v === 'AP') return mk('Avayogi point', avaPt(ch));
        if (v === 'YL') { const n = NAKSHATRA_LORDS[getNakshatraIndex(yogiPt(ch))]; return mk('Yogi planet (' + n + ')', ch.sid[n], null, n); }
        if (v === 'AL2') { const n = NAKSHATRA_LORDS[getNakshatraIndex(avaPt(ch))]; return mk('Avayogi planet (' + n + ')', ch.sid[n], null, n); }
        if (v === 'DY') { const n = SIGNS[sg(yogiPt(ch))].lord; return mk('Duplicate Yogi (' + n + ')', ch.sid[n], null, n); }
        if (v === 'Gulika') { const l = gulikaLon(ch); return l == null ? miss('Gulika needs a place') : mk('Gulika', l); }
        if (v === 'Hora') { const l = hora(ch); return l == null ? miss('Hora Lagna needs birth time and place') : mk('Hora Lagna', l); }
        if (v === 'Ghati') { const l = ghati(ch); return l == null ? miss('Ghati Lagna needs birth time and place') : mk('Ghati Lagna', l); }
        if (v === 'Indu') { const s = indu(ch); return s == null ? miss('Indu Lagna needs a Lagna') : mk('Indu Lagna', null, s); }
        if (v === 'Karakamsa') { const n = karakas(ch).map.AK; return mk('Karakamsa', null, d9(ch.sid[n])); }
        if (v === 'Swamsha') return ch.lagna == null ? miss('Swamsha needs a Lagna') : mk('Swamsha', null, d9(ch.lagna));
      }
    }
    return miss('unknown subject');
  }
  function opName(op) {
    const w = op.of && op.of !== 'C' ? { N: ' (person)', S: ' (sky)', P: ' (2nd person)' }[op.of] || '' : '';
    switch (op.k) {
      case 'planet': return op.v + w; case 'role': return op.v + w; case 'sign': return sname(op.v); case 'house': return ord(op.v) + ' house' + w; case 'lord': return 'lord of ' + ord(op.v) + w;
      case 'arudha': return 'A' + op.v + w; case 'point': return (POINTS[op.v] || op.v) + w;
    }
    return '?';
  }
  const where = s => s.sign == null ? '' : (s.lon != null ? ' ' + dms(s.lon) + ' ' : ' ') + sname(s.sign);
  const tag = s => s.name + (s.lon != null || s.sign != null ? ' [' + where(s).trim() + ']' : '');

  /* ---------------------------- relations ---------------------------- */
  const DIGS = ['Exalted', 'Own sign', 'Friendly', 'Neutral', 'Enemy', 'Debilitated'];
  const ELEM = ['Fire', 'Earth', 'Air', 'Water'], MODE = ['Movable', 'Fixed', 'Dual'];
  const lst = (a, f) => (a || []).map(f || (x => x)).join(' / ');
  const needLon = s => s.lon == null, needSign = s => s.sign == null;
  const R = {}; // id -> {label, bin:0|1|2(optional), u: params schema for UI, fn(a,b,p,X)->[true|false|null, text]}
  const def = (id, label, bin, ui, fn) => { R[id] = { id, label, bin, ui, fn }; };
  const yn = (v, t) => [v, t];
  def('in_sign', 'is in sign', 0, ['signs'], (a, b, p) => needSign(a) ? yn(null, 'sign unknown') : yn((p.signs || []).includes(a.sign), 'is in ' + sname(a.sign)));
  def('in_nak', 'is in nakshatra', 0, ['naks'], (a, b, p) => needLon(a) ? yn(null, 'no degree') : yn((p.naks || []).includes(getNakshatraIndex(a.lon)), 'is in ' + NAKSHATRAS[getNakshatraIndex(a.lon)]));
  def('in_pada', 'is in nakshatra pada', 0, ['padas'], (a, b, p) => needLon(a) ? yn(null, 'no degree') : yn((p.padas || []).includes(getPadaIndex(a.lon) + 1), 'is in pada ' + (getPadaIndex(a.lon) + 1)));
  def('in_house', 'is in house', 2, ['houses'], (a, b, p) => {
    if (needSign(a)) return yn(null, 'sign unknown'); const bs = b ? b.sign : a.ch.base; if (bs == null) return yn(null, 'no Lagna to count houses from');
    const h = hOf(bs, a.sign); return yn((p.houses || []).includes(h), 'is in the ' + ord(h) + ' house' + (b ? ' from ' + b.name : ''));
  });
  def('same_sign', 'shares a sign with', 1, [], (a, b) => needSign(a) || needSign(b) ? yn(null, 'sign unknown') : yn(a.sign === b.sign, a.sign === b.sign ? 'share ' + sname(a.sign) : 'are in different signs'));
  def('conj', 'is conjunct (within orb)', 1, ['orb'], (a, b, p) => needLon(a) || needLon(b) ? yn(null, 'no degree') : (d => yn(d <= (p.orb == null ? 10 : p.orb), 'are ' + d.toFixed(1) + '° apart'))(dist(a.lon, b.lon)));
  def('aspect', 'aspects (graha drishti)', 1, ['dir', 'only'], (a, b, p) => {
    if (needSign(a) || needSign(b)) return yn(null, 'sign unknown');
    const cast = (x, y) => { if (!x.planet) return [7].filter(o => (x.sign + o - 1) % 12 === y.sign).filter(o => !p.only || !p.only.length || p.only.includes(o)); return (ASPECT_OFFSETS[x.planet] || [7]).filter(o => (x.sign + o - 1) % 12 === y.sign && (!p.only || !p.only.length || p.only.includes(o))); };
    const ab = cast(a, b), ba = cast(b, a), dir = p.dir || 'either'; let ok, t;
    if (dir === 'a>b') { ok = ab.length > 0; t = ok ? 'aspects it with its ' + ord(ab[0]) + ' aspect' : 'does not aspect it'; }
    else if (dir === 'b>a') { ok = ba.length > 0; t = ok ? 'is aspected by it (' + ord(ba[0]) + ' aspect)' : 'is not aspected by it'; }
    else if (dir === 'mutual') { ok = ab.length > 0 && ba.length > 0; t = ok ? 'aspect each other' : 'do not aspect each other'; }
    else { ok = ab.length > 0 || ba.length > 0; t = ok ? 'have an aspect between them' : 'have no aspect between them'; }
    return yn(ok, t);
  });
  def('angle', 'makes an angle of', 1, ['angle', 'orb'], (a, b, p) => needLon(a) || needLon(b) ? yn(null, 'no degree') : (d => yn(Math.abs(d - (p.angle || 0)) <= (p.orb == null ? 6 : p.orb), 'are ' + d.toFixed(1) + '° apart'))(dist(a.lon, b.lon)));
  def('deg_range', 'has degrees in its sign between', 0, ['lo', 'hi'], (a, b, p) => needLon(a) ? yn(null, 'no degree') : (d => yn(d >= (p.lo || 0) && d <= (p.hi == null ? 30 : p.hi), 'is at ' + d.toFixed(2) + '° of its sign'))(nd(a.lon) % 30));
  def('lon_range', 'has zodiac longitude between', 0, ['lo', 'hi'], (a, b, p) => { if (needLon(a)) return yn(null, 'no degree'); const l = nd(a.lon), lo = nd(p.lo || 0), hi = nd(p.hi == null ? 360 : p.hi); return yn(lo <= hi ? l >= lo && l <= hi : l >= lo || l <= hi, 'is at ' + l.toFixed(2) + '°'); });
  def('near_lon', 'is within orb of longitude', 0, ['lon', 'orb'], (a, b, p) => needLon(a) ? yn(null, 'no degree') : (d => yn(d <= (p.orb == null ? 3 : p.orb), 'is ' + d.toFixed(1) + '° from it'))(dist(a.lon, p.lon || 0)));
  def('same_nak', 'shares a nakshatra with', 1, [], (a, b) => needLon(a) || needLon(b) ? yn(null, 'no degree') : (x => yn(x === getNakshatraIndex(b.lon), x === getNakshatraIndex(b.lon) ? 'share ' + NAKSHATRAS[x] : 'are in different nakshatras'))(getNakshatraIndex(a.lon)));
  def('rules', 'rules the sign of', 1, [], (a, b) => !a.planet || needSign(b) ? yn(null, 'not applicable') : yn(SIGNS[b.sign].lord === a.planet, SIGNS[b.sign].lord === a.planet ? 'rules ' + sname(b.sign) : 'does not rule ' + sname(b.sign)));
  def('dispositor', 'is disposited by (sign lord is)', 1, [], (a, b) => !b.planet || needSign(a) ? yn(null, 'not applicable') : yn(SIGNS[a.sign].lord === b.planet, 'sits in ' + sname(a.sign) + ' ruled by ' + SIGNS[a.sign].lord));
  def('exchange', 'exchanges signs with', 1, [], (a, b) => !a.planet || !b.planet || needSign(a) || needSign(b) ? yn(null, 'not applicable') : yn(SIGNS[a.sign].lord === b.planet && SIGNS[b.sign].lord === a.planet, 'sign exchange ' + (SIGNS[a.sign].lord === b.planet && SIGNS[b.sign].lord === a.planet ? 'present' : 'absent')));
  def('retro', 'is retrograde / direct', 0, ['on'], (a, b, p) => !a.planet ? yn(null, 'not a planet') : (r => yn(r === (p.on !== false), r ? 'is retrograde' : 'is direct'))(a.planet === 'Rahu' || a.planet === 'Ketu' ? true : !!a.ch.retro[a.planet]));
  def('combust', 'is combust', 0, ['on'], (a, b, p) => { if (!a.planet) return yn(null, 'not a planet'); const lim = COMBUST[a.planet]; const c = !!lim && dist(a.ch.sid[a.planet], a.ch.sid.Sun) <= lim; return yn(c === (p.on !== false), c ? 'is combust' : 'is not combust'); });
  def('dignity', 'has dignity', 0, ['digs'], (a, b, p) => { if (!a.planet || a.planet === 'Rahu' || a.planet === 'Ketu') return yn(null, 'not applicable'); let d; try { d = dignityOf(a.planet, sg(a.ch.sid[a.planet])); } catch (e) { return yn(null, 'not applicable'); } return yn((p.digs || []).includes(d), 'is ' + d.toLowerCase()); });
  def('vargottama', 'is vargottama', 0, ['on'], (a, b, p) => needLon(a) ? yn(null, 'no degree') : (v => yn(v === (p.on !== false), v ? 'is vargottama' : 'is not vargottama'))(d9(a.lon) === sg(a.lon)));
  def('gandanta', 'is in gandanta', 0, ['on'], (a, b, p) => needLon(a) ? yn(null, 'no degree') : (x => (v => yn(v === (p.on !== false), v ? 'is in gandanta' : 'is not in gandanta'))(x < 10 / 3 || x > 120 - 10 / 3))(nd(a.lon) % 120));
  def('varga_sign', 'is in a sign of a divisional chart', 0, ['varga', 'signs'], (a, b, p) => needLon(a) ? yn(null, 'no degree') : (s => yn((p.signs || []).includes(s), 'is in ' + sname(s) + ' in ' + (p.varga || 'D9')))(VG.sign(p.varga || 'D9', a.lon)));
  def('nak_lord', 'has nakshatra lord', 0, ['planets'], (a, b, p) => needLon(a) ? yn(null, 'no degree') : (n => yn((p.planets || []).includes(n), 'is in a nakshatra of ' + n))(NAKSHATRA_LORDS[getNakshatraIndex(a.lon)]));
  def('sign_lord', 'sits in a sign ruled by', 0, ['planets'], (a, b, p) => needSign(a) ? yn(null, 'sign unknown') : (n => yn((p.planets || []).includes(n), 'sits in a sign ruled by ' + n))(SIGNS[a.sign].lord));
  def('sign_type', 'sits in a sign of element / quality', 0, ['elem', 'mode'], (a, b, p) => needSign(a) ? yn(null, 'sign unknown') : (e => { const m = a.sign % 3 === 0 ? 0 : a.sign % 3 === 1 ? 1 : 2; const ok = (!p.elem || !p.elem.length || p.elem.includes(e)) && (!p.mode || !p.mode.length || p.mode.includes(m)); return yn(ok, 'sits in a ' + MODE[m].toLowerCase() + ' ' + ELEM[e].toLowerCase() + ' sign'); })(a.sign % 4));

  const paramText = (id, p) => {
    p = p || {};
    switch (id) {
      case 'in_sign': return lst(p.signs, sname) || '…'; case 'in_nak': return lst(p.naks, i => NAKSHATRAS[i]) || '…'; case 'in_pada': return lst(p.padas) || '…'; case 'in_house': return lst(p.houses, ord) || '…';
      case 'conj': return 'within ' + (p.orb == null ? 10 : p.orb) + '°'; case 'angle': return (p.angle || 0) + '° ±' + (p.orb == null ? 6 : p.orb) + '°';
      case 'aspect': return { 'a>b': 'A aspects B', 'b>a': 'B aspects A', mutual: 'mutual', either: 'either way' }[p.dir || 'either'] + (p.only && p.only.length ? ' (' + lst(p.only, ord) + ' only)' : '');
      case 'deg_range': return (p.lo || 0) + '° – ' + (p.hi == null ? 30 : p.hi) + '°'; case 'lon_range': return (p.lo || 0) + '° – ' + (p.hi == null ? 360 : p.hi) + '°';
      case 'near_lon': return (p.lon || 0) + '° ±' + (p.orb == null ? 3 : p.orb) + '°'; case 'retro': return p.on === false ? 'direct' : 'retrograde'; case 'dignity': return lst(p.digs) || '…';
      case 'varga_sign': return (p.varga || 'D9') + ': ' + (lst(p.signs, sname) || '…'); case 'nak_lord': case 'sign_lord': return lst(p.planets) || '…';
      case 'sign_type': return [lst(p.elem, i => ELEM[i]), lst(p.mode, i => MODE[i])].filter(Boolean).join(', ') || '…';
      case 'combust': case 'vargottama': case 'gandanta': return p.on === false ? 'not' : 'yes';
    }
    return '';
  };

  /* ---------------------------- evaluation ---------------------------- */
  const AND = a => a.some(v => v === false) ? false : a.some(v => v == null) ? null : true;
  const OR = a => a.some(v => v === true) ? true : a.some(v => v == null) ? null : false;
  const isGroup = n => n && n.g;
  function evalRule(r, X) {
    const rel = R[r.r]; if (!rel) return { t: null, text: 'Unknown relation', rule: r };
    const A = (r.a || []).map(o => resolve(o, X)), B = (r.b || []).map(o => resolve(o, X)), p = r.p || {};
    const notes = [];
    const one = (a, b) => {
      if (a.miss) return { t: null, why: a.miss };
      if (b && b.miss) return { t: null, why: b.miss };
      const [t, txt] = rel.fn(a, b, p, X); return { t, a, b, txt };
    };
    const per = A.map(a => {
      if (rel.bin === 0) return one(a, null);
      if (!B.length) return rel.bin === 2 ? one(a, null) : { t: null, why: 'choose the second subject' };
      const rows = B.map(b => one(a, b)), t = (r.bq === 'all' ? AND : OR)(rows.map(x => x.t));
      return { t, rows, a };
    });
    if (!A.length) return { t: null, text: 'Choose the first subject', rule: r };
    const t0 = (r.q === 'all' ? AND : OR)(per.map(x => x.t));
    const lines = per.map(x => {
      if (x.why) return '? ' + x.why;
      if (x.rows) return x.rows.map(y => y.why ? '? ' + y.why : tag(y.a) + ' ' + y.txt + (y.b ? ' ' + tag(y.b) : '')).join('; ');
      return tag(x.a) + ' ' + x.txt;
    });
    const t = r.neg ? (t0 == null ? null : !t0) : t0;
    return { t, rule: r, text: sentence(r), detail: lines.join(' · ') };
  }
  function sentence(r) {
    const rel = R[r.r]; if (!rel) return '?';
    const side = (l, q) => (l || []).length ? ((l.length > 1 ? (q === 'all' ? 'every one of ' : 'any of ') : '') + l.map(opName).join(' / ')) : '…';
    let s = side(r.a, r.q) + ' ' + rel.label;
    if (rel.bin === 1) s += ' ' + side(r.b, r.bq); else if (rel.bin === 2 && (r.b || []).length) s += ' ' + paramText(r.r, r.p) + ' from ' + side(r.b, r.bq); else { const pt = paramText(r.r, r.p); if (pt) s += ' ' + pt; }
    if (rel.bin === 1) { const pt = paramText(r.r, r.p); if (pt) s += ' (' + pt + ')'; }
    return r.neg ? 'NOT: ' + s : s;
  }
  function evalNode(n, X) {
    if (!isGroup(n)) return evalRule(n, X);
    const kids = (n.items || []).map(k => evalNode(k, X)), ts = kids.map(k => k.t), cnt = ts.filter(v => v === true).length, unk = ts.filter(v => v == null).length;
    let t;
    if (!kids.length) t = null;
    else if (n.g === 'all') t = AND(ts); else if (n.g === 'any') t = OR(ts); else if (n.g === 'none') t = (v => v == null ? null : !v)(OR(ts));
    else { const need = Math.max(1, n.n || 1); t = cnt >= need ? true : cnt + unk >= need ? null : false; }
    return { t, g: n.g, n: n.n, kids, text: ({ all: 'ALL of these', any: 'ANY of these', none: 'NONE of these', atleast: 'AT LEAST ' + (n.n || 1) + ' of these' })[n.g] || n.g, count: cnt };
  }
  const evaluate = (f, X) => { X = X || {}; return evalNode(f.root, X); };

  /* ---------------------------- charts for checking ---------------------------- */
  const prof = p => p && isValidProfile(p) ? p : null;
  function birthChart(p, scheme) { p = prof(p); if (!p) return null; const c = computeNatalAscendant(p); return chart({ jd: c.jd, lagna: c.lagnaLon, prof: p, birth: true, scheme, label: p.name + "'s birth chart" }); }
  function skyChart(jd, o) { o = o || {}; const lp = prof(o.loc); const lag = lp ? siderealAscendant(jd, lp.lat, lp.lon) : null; return chart({ jd, lagna: lag, loc: lp, base: o.base, scheme: o.scheme, label: o.label || 'Sky' }); }
  /* target: {type:'person', p} | {type:'sky', jd, loc}; opts: {person: N profile, other: P profile, scheme} */
  function makeCtx(target, opts) {
    opts = opts || {}; const sc = opts.scheme === 8 ? 8 : 7, X = {};
    X.N = birthChart(opts.person || (target.type === 'person' ? target.p : null), sc);
    X.P = birthChart(opts.other, sc);
    if (target.type === 'person') { X.C = birthChart(target.p, sc); X.S = skyChart(target.jd == null ? currentJD : target.jd, { loc: target.p, base: X.C ? X.C.base : null, scheme: sc, label: 'Sky' }); }
    else { X.C = skyChart(target.jd, { loc: target.loc || (X.N && X.N.prof), base: X.N ? X.N.base : null, scheme: sc, label: target.label || 'Sky' }); X.S = X.C; }
    return X;
  }

  /* ---------------------------- the chart points list ---------------------------- */
  function points(C) {
    const out = [], add = (grp, name, s) => { if (s && !s.miss) out.push({ grp, name: s.name || name, lon: s.lon, sign: s.sign }); };
    const X = { C }, rs = op => resolve(op, X);
    P9.forEach(n => add('Planets', n, rs({ k: 'planet', v: n })));
    (C.scheme === 8 ? K8 : K7).forEach(k => add('Karakas', k, rs({ k: 'role', v: k })));
    Object.keys(POINTS).forEach(k => add('Points', k, rs({ k: 'point', v: k })));
    for (let h = 1; h <= 12; h++) add('Arudha', 'A' + h, rs({ k: 'arudha', v: h }));
    return out;
  }

  /* ---------------------------- find dates ---------------------------- */
  const BASE = { Moon: .2, Sun: .5, Mercury: .4, Venus: .5, Mars: .5, Jupiter: 2, Saturn: 3, Rahu: 4, Ketu: 4 };
  function ops(n, acc) { if (isGroup(n)) (n.items || []).forEach(k => ops(k, acc)); else { (n.a || []).concat(n.b || []).forEach(o => acc.push(o)); } return acc; }
  function stepFor(f, mode) {
    let dt = 99; const all = ops(f.root, []);
    all.forEach(o => {
      let s = 99;
      if (o.k === 'planet') s = BASE[o.v] || 1;
      else if (o.k === 'role') s = .2;
      else if (o.k === 'point') s = ({ Lagna: mode === 'sky' ? .04 : 99, BB: .3, YP: .3, AP: .3, YL: .3, AL2: .3, DY: .3, Gulika: .04, Hora: .02, Ghati: .02, Indu: .5, Karakamsa: .5, Swamsha: mode === 'sky' ? .04 : 99 })[o.v] || .3;
      else if (o.k === 'lord' || o.k === 'arudha' || o.k === 'house') s = mode === 'sky' ? .04 : 1;
      dt = Math.min(dt, s);
    });
    if (all.some(o => o.k === 'planet' || o.k === 'role') && f.root && JSON.stringify(f.root).includes('"conj"')) dt = Math.min(dt, .25);
    if (dt === 99) dt = 1;
    return dt;
  }
  /* o: {mode:'sky'|'birth', j0, j1, person, other, scheme, loc, onProgress, cancel, max}; sky scans keep person N fixed. */
  async function scan(f, o) {
    const sc = f.scheme === 8 ? 8 : 7, mode = o.mode === 'birth' ? 'birth' : 'sky', N = birthChart(o.person, sc), P = birthChart(o.other, sc);
    if (!(o.j1 > o.j0)) return { error: 'The end of the range must be after the start.' };
    let dt = stepFor(f, mode); const span = o.j1 - o.j0; dt = Math.max(dt, span / 400000);
    const mkC = jd => mode === 'birth' ? chart({ jd, lagna: null, scheme: sc, birth: true }) : skyChart(jd, { loc: o.loc || (N && N.prof), base: N ? N.base : null, scheme: sc });
    const test = jd => { const C = mkC(jd); return evalNode(f.root, { C, S: C, N, P }).t === true; };
    const edge = (a, b, sa) => { for (let i = 0; i < 18; i++) { const m = (a + b) / 2; if (test(m) === sa) a = m; else b = m; } return (a + b) / 2; };
    const out = [], max = o.max || 300; let prevT = o.j0, prev = test(o.j0), start = prev ? o.j0 : null, n = 0; const total = span / dt;
    for (let t = o.j0 + dt; ; t += dt) {
      const tt = Math.min(t, o.j1), cur = test(tt);
      if (cur !== prev) { const e = edge(prevT, tt, prev); if (cur) start = e; else { out.push({ from: start, to: e }); start = null; } prev = cur; }
      prevT = tt; if (tt >= o.j1 || out.length >= max) break;
      if (++n % 1500 === 0) { if (o.onProgress) o.onProgress(Math.min(1, n / total)); if (o.cancel && o.cancel()) return { cancelled: true, windows: out, step: dt }; await new Promise(r => setTimeout(r, 0)); }
    }
    if (prev && start != null && out.length < max) out.push({ from: start, to: o.j1, open: true });
    return { windows: out, capped: out.length >= max, step: dt, mode };
  }

  /* ---------------------------- formula helpers ---------------------------- */
  const uid = () => 'f' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
  const rule = (a, r, b, p, o) => Object.assign({ a: [].concat(a), q: 'any', r, b: b ? [].concat(b) : [], bq: 'any', p: p || {} }, o || {});
  const formula = (name, about, items, g, scheme) => ({ v: 1, id: uid(), name, about: about || '', scheme: scheme || 7, root: { g: g || 'all', items } });
  function normalize(f) {
    if (!f || typeof f !== 'object' || !f.root || !isGroup(f.root)) return null;
    const fixNode = n => { if (isGroup(n)) { if (!['all', 'any', 'none', 'atleast'].includes(n.g)) return null; return { g: n.g, n: Math.max(1, +n.n || 1), items: (n.items || []).slice(0, 40).map(fixNode).filter(Boolean) }; }
      if (!n || !R[n.r]) return null; const op = o => o && o.k && o.v != null ? { k: String(o.k), v: o.v, of: ['C', 'N', 'S', 'P'].includes(o.of) ? o.of : 'C' } : null;
      return { a: (n.a || []).map(op).filter(Boolean).slice(0, 12), q: n.q === 'all' ? 'all' : 'any', r: n.r, b: (n.b || []).map(op).filter(Boolean).slice(0, 12), bq: n.bq === 'all' ? 'all' : 'any', p: n.p && typeof n.p === 'object' ? n.p : {}, neg: !!n.neg }; };
    const root = fixNode(f.root); if (!root) return null;
    return { v: 1, id: String(f.id || uid()), name: String(f.name || 'My formula').slice(0, 80), about: String(f.about || '').slice(0, 400), scheme: f.scheme === 8 ? 8 : 7, root };
  }
  function describe(f) {
    const walk = (n, d) => { const pad = '  '.repeat(d); if (!isGroup(n)) return pad + '• ' + sentence(n); return pad + ({ all: 'ALL of:', any: 'ANY of:', none: 'NONE of:', atleast: 'AT LEAST ' + (n.n || 1) + ' of:' })[n.g] + '\n' + (n.items || []).map(k => walk(k, d + 1)).join('\n'); };
    return f.name + '\n' + (f.about ? f.about + '\n' : '') + walk(f.root, 0) + (ops(f.root, []).some(o => o.k === 'role' ) ? '\n(Karakas: ' + (f.scheme === 8 ? '8' : '7') + '-karaka scheme)' : '');
  }
  const countRules = n => isGroup(n) ? (n.items || []).reduce((s, k) => s + countRules(k), 0) : 1;

  return { P9, K7, K8, ROLE_NAME, POINTS, REL: R, DIGS, ELEM, MODE, chart, karakas, bhrigu, yogiPt, avaPt, resolve, opName, sentence, paramText, evaluate, evalNode, makeCtx, birthChart, skyChart, points, scan, stepFor, uid, rule, formula, normalize, describe, countRules, ops, dms, sname, ord, tag };
})();
window.FM = FM;

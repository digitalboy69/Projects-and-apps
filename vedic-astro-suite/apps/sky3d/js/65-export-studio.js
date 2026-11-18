/* ============================================================================
   EXPORT STUDIO ENGINE (global XS) - turns the 3D Sky into ONE clean, well-labelled data model and renders it as
   Markdown (default, best for AI chats), JSON (machine readable) or plain text. No DOM here; the sheet is js/66.

   Shape of everything that comes out (so an AI always knows where it is):
     title -> reading guide -> contents -> Part A (chart sections) -> Part B (timing and forecasts) -> optional task
   Each section is {id, title, about, blocks}; a block is one of
     {type:'kv', key, rows:[{k,v}]}  {type:'table', key, cols:[{k,h}], rows:[{...}]}  {type:'list', key, items:[...]}  {type:'text', text}
   The same blocks feed all three renderers, so Markdown, text and JSON can never disagree.
   Reads: snapshotPositions, DBX.analyse (js/50), computeNatalAscendant, VDasha, VG, SKA, findIngresses, findConjunctions, TLF.state.
   ============================================================================ */
const XS = (() => {
  'use strict';
  const SCHEMA = 'vedic-sky-export/1';
  const ELEM = ['Fire', 'Earth', 'Air', 'Water'], MODE = ['Movable', 'Fixed', 'Dual'];
  const YR = 365.2425, NODES = ['Rahu', 'Ketu'];
  const nd = x => ((x % 360) + 360) % 360, pad = n => String(n).padStart(2, '0');
  const SN = i => SIGNS[i].name, sg = l => Math.floor(nd(l) / 30);
  const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));
  const hs = (from, to) => ((to - from + 12) % 12) + 1;
  const TZ = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local'; } catch (e) { return 'local'; } };

  /* ---------------- section catalogue (order = order in the export) ---------------- */
  const SECTIONS = [
    { id: 'planets',   part: 'chart',  title: 'Planets',            about: 'Where every planet is: sign, degree, nakshatra and pada, lords, house, dignity, motion and flags.' },
    { id: 'signs',     part: 'chart',  title: 'Signs',              about: 'The twelve signs in zodiac order with their element, mode, ruler and the planets standing in each.' },
    { id: 'houses',    part: 'chart',  title: 'Houses',             about: 'Whole-sign houses from the Lagna: sign, ruler and where the ruler stands, planets inside, planets aspecting.' },
    { id: 'panchang',  part: 'chart',  title: 'Panchang',           about: 'Weekday, tithi, paksha, Moon nakshatra, yoga, karana and the Moon light for this moment.' },
    { id: 'aspects',   part: 'chart',  title: 'Aspects (Graha Drishti)', about: 'Whole-sign planetary aspects: whom each planet looks at and who looks at it, plus mutual aspects.' },
    { id: 'relations', part: 'chart',  title: 'Planet relations',   about: 'Planets sharing a sign, planetary war, sign exchange, nakshatra exchange and dispositor chains.' },
    { id: 'alerts',    part: 'chart',  title: 'Sky alerts',         about: 'Notable trine, square, Jupiter, Saturn and node placements counted from the Rising sign and the Moon sign.' },
    { id: 'varga',     part: 'chart',  title: 'Divisional charts',  about: 'The sign of every planet (and the Lagna) in the divisional charts you picked.' },
    { id: 'dasha',     part: 'timing', title: 'Vimshottari Dasha',  about: 'The running Maha, Antar and Pratyantar periods at the moment and the Maha timeline (needs a birth profile).' },
    { id: 'transits',  part: 'timing', title: 'Sign changes (transits)', about: 'The dates each planet enters a new sign inside the horizon.' },
    { id: 'meetings',  part: 'timing', title: 'Planet meetings (conjunctions)', about: 'The exact dates two planets reach the same longitude inside the horizon.' },
    { id: 'retro',     part: 'timing', title: 'Retrograde periods', about: 'When Mars, Mercury, Jupiter, Venus and Saturn move backwards inside the horizon.' },
    { id: 'ephemeris', part: 'timing', title: 'Ephemeris table',    about: 'Planet positions sampled at regular steps from the moment.' },
    { id: 'finder',    part: 'timing', title: 'Timeline finder results', about: 'The last search done in the Timeline finder tool (needs a finished search).' }
  ];
  const ALL_VARGAS = ['D2', 'D3', 'D4', 'D7', 'D9', 'D10', 'D12', 'D16', 'D20', 'D24', 'D27', 'D30', 'D40', 'D45', 'D60'];
  const NO_MOON = ['Sun', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

  const PRESETS = {
    quick:      { label: 'Quick sky', hint: 'Planets and panchang only', basis: 'auto', sec: ['planets', 'panchang'] },
    ai:         { label: 'AI brief', hint: 'The full chart reading data, compact', basis: 'auto', sec: ['planets', 'signs', 'houses', 'panchang', 'aspects', 'relations', 'alerts', 'varga', 'dasha'], vargas: ['D9'] },
    forecast:   { label: 'Forecast', hint: 'Positions plus dasha, transits, meetings, retrogrades', basis: 'auto', sec: ['planets', 'dasha', 'transits', 'meetings', 'retro'] },
    everything: { label: 'Everything', hint: 'All sections, all main divisional charts', basis: 'auto', sec: SECTIONS.map(s => s.id), vargas: ALL_VARGAS }
  };

  function defaults() {
    return {
      preset: 'ai', basis: 'auto', moment: 'sky', momentISO: '', format: 'md', angle: 'dms', guide: true, rules: true, task: '',
      sec: PRESETS.ai.sec.slice(), vargas: ['D9'],
      tr: { years: 2, moon: false }, mt: { years: 2, moon: false }, rt: { years: 2 }, eph: { step: '1w', count: 12, planets: PLANET_LIST.slice() }
    };
  }
  const merge = (a, b) => { const o = Array.isArray(a) ? a.slice() : Object.assign({}, a); Object.keys(b || {}).forEach(k => { o[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') ? merge(a[k], b[k]) : b[k]; }); return o; };
  const norm = cfg => merge(defaults(), cfg || {});
  function applyPreset(cfg, key) {
    const p = PRESETS[key]; if (!p) return cfg;
    const c = merge(cfg, { preset: key, basis: p.basis, sec: p.sec.slice(), vargas: (p.vargas || ['D9']).slice() });
    if (key === 'forecast' || key === 'everything') { c.tr = merge(c.tr, { years: 2 }); }
    return c;
  }

  /* ---------------- formatting helpers ---------------- */
  const profile = () => (typeof isValidProfile === 'function' && isValidProfile(activeNatalProfile)) ? activeNatalProfile : null;
  const jdNowReal = () => { const d = new Date(); return toJulianDay(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), 0); };
  function momentJD(cfg) {
    if (cfg.moment === 'today') return jdNowReal();
    if (cfg.moment === 'custom' && cfg.momentISO) { const t = new Date(cfg.momentISO).getTime(); if (isFinite(t)) return t / 86400000 + 2440587.5; }
    return currentJD;
  }
  function fmt(jd, tzh) {   // 'YYYY-MM-DD HH:MM' in the device zone, or in a given zone (hours) for a birth moment
    if (tzh == null) { const d = jdToDate(jd); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
    const p = jdToParts(jd + tzh / 24); return p.y + '-' + pad(p.m) + '-' + pad(p.d) + ' ' + pad(p.h) + ':' + pad(p.mi);
  }
  const fmtDay = jd => fmt(jd).slice(0, 10);
  const utc = jd => { const p = jdToParts(jd); return p.y + '-' + pad(p.m) + '-' + pad(p.d) + ' ' + pad(p.h) + ':' + pad(p.mi) + ' UTC'; };
  const offStr = h => (h >= 0 ? '+' : '-') + pad(Math.floor(Math.abs(h))) + ':' + pad(Math.round((Math.abs(h) % 1) * 60));
  function posStr(lon, cfg) {
    const l = nd(lon) % 30;
    if (cfg.angle === 'dec') return l.toFixed(4) + '°';
    const t = Math.round(l * 3600), d = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return d + '°' + pad(m) + "'" + pad(s) + '"';
  }
  const fullPos = (lon, cfg) => SN(sg(lon)) + ' ' + posStr(lon, cfg);
  const span = d => d < 1 ? Math.max(1, Math.round(d * 24)) + ' hours' : d < 60 ? Math.round(d) + ' days' : d < 730 ? (d / 30.44).toFixed(1) + ' months' : (d / 365.25).toFixed(1) + ' years';
  const pr = (n, retro) => n + (retro ? ' (R)' : '');

  /* ---------------- chart contexts ---------------- */
  function chartCtx(kind, jd, p) {
    if (kind === 'natal') {
      const c = computeNatalAscendant(p), s = snapshotPositions(c.jd);
      return { kind, jd: c.jd, sid: s.sidereal, retro: s.retro, lagna: c.lagnaLon, p, ayan: s.ayanamsa, tz: p.tz,
        label: p.name + ' · birth chart', when: p.dob + ' ' + p.tob.slice(0, 5) + ' (UTC' + offStr(p.tz) + ')' };
    }
    const s = snapshotPositions(jd);
    return { kind, jd, sid: s.sidereal, retro: s.retro, lagna: p ? computeNatalAscendant(p).lagnaLon : null, p, ayan: s.ayanamsa, tz: null,
      label: 'Sky at ' + fmt(jd), when: fmt(jd) + ' (' + TZ() + ')' };
  }
  const WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const vara = (jd, tzh) => WEEK[(((Math.floor(jd + 0.5 + (tzh == null ? -new Date().getTimezoneOffset() / 60 : tzh) / 24) + 1) % 7) + 7) % 7];

  /* ---------------- section builders: (cx, A, cfg) -> blocks ---------------- */
  const B = {
    planets(cx, A, cfg) {
      const rows = [];
      if (cx.lagna != null) {
        const l = cx.lagna, ni = getNakshatraIndex(l);
        rows.push({ planet: 'Lagna (Rising)', sign: SN(sg(l)), position: posStr(l, cfg), abs_degree: +nd(l).toFixed(4), nakshatra: NAKSHATRAS[ni], pada: getPadaIndex(l) + 1, nakshatra_lord: NAKSHATRA_LORDS[ni], sign_lord: SIGNS[sg(l)].lord,
          house: 1, from_moon: hs(sg(cx.sid.Moon), sg(l)), dignity: '-', motion: '-', speed_per_day: '-', flags: '', navamsha: SN(VG.sign('D9', l)) });
      }
      PLANET_LIST.forEach(n => {
        const p = A.pl[n], fl = [];
        if (p.comb) fl.push('Combust'); if (p.varg) fl.push('Vargottama'); if (p.gand) fl.push('Gandanta'); if (p.station) fl.push('Near station');
        rows.push({ planet: n, sign: SN(p.si), position: posStr(p.l, cfg), abs_degree: +nd(p.l).toFixed(4), nakshatra: NAKSHATRAS[p.ni], pada: p.pada, nakshatra_lord: p.nl, sign_lord: p.sl,
          house: p.house == null ? '-' : p.house, from_moon: p.fromMoon, dignity: p.dign, motion: NODES.includes(n) ? 'Retrograde (mean node)' : (p.retro ? 'Retrograde' : 'Direct'),
          speed_per_day: +p.speed.toFixed(4), flags: fl.join(', '), navamsha: SN(p.nav) });
      });
      const T1 = ['planet', 'sign', 'position', 'abs_degree', 'nakshatra', 'pada', 'nakshatra_lord', 'sign_lord', 'navamsha'], T2 = ['planet', 'house', 'from_moon', 'dignity', 'motion', 'speed_per_day', 'flags'];
      const H = { planet: 'Planet', sign: 'Sign', position: 'Position in sign', abs_degree: 'Absolute degree (0-360)', nakshatra: 'Nakshatra', pada: 'Pada', nakshatra_lord: 'Nakshatra lord', sign_lord: 'Sign lord', navamsha: 'Navamsha sign',
        house: cx.lagna != null ? 'House from Lagna' : 'House (no Lagna)', from_moon: 'House from Moon', dignity: 'Dignity', motion: 'Motion', speed_per_day: 'Speed (deg/day)', flags: 'Flags' };
      const pick = ks => ({ cols: ks.map(k => ({ k, h: H[k] })), rows: rows.map(r => { const o = {}; ks.forEach(k => { o[k] = r[k]; }); return o; }) });
      return [Object.assign({ type: 'table', key: 'positions', title: 'Positions' }, pick(T1)), Object.assign({ type: 'table', key: 'condition', title: 'Condition (house, dignity, motion, flags)' }, pick(T2))];
    },
    signs(cx, A) {
      const ls = cx.lagna == null ? null : sg(cx.lagna);
      const rows = [...Array(12)].map((_, i) => ({ sign: SN(i), number: i + 1, house: ls == null ? '-' : hs(ls, i), element: ELEM[i % 4], mode: MODE[i % 3], ruler: SIGNS[i].lord,
        planets: A.signOcc[i].map(n => pr(n, A.pl[n].retro && !NODES.includes(n))).join(', ') || 'empty' }));
      return [{ type: 'table', key: 'signs', cols: [['sign', 'Sign'], ['number', '#'], ['house', 'House'], ['element', 'Element'], ['mode', 'Mode'], ['ruler', 'Ruler'], ['planets', 'Planets inside']].map(c => ({ k: c[0], h: c[1] })), rows }];
    },
    houses(cx, A) {
      if (cx.lagna == null) return [{ type: 'text', text: 'No birth profile is loaded, so there is no Lagna and no houses. Load a birth profile (Natal tab) to include houses.' }];
      const ls = sg(cx.lagna), rows = [...Array(12)].map((_, h) => {
        const si = (ls + h) % 12, lord = SIGNS[si].lord, lp = A.pl[lord];
        const by = []; PLANET_LIST.forEach(f => (A.castSigns[f] || []).forEach(x => { if (x.ts === si && A.pl[f].si !== si) by.push(f + ' (' + ord(x.o) + ' aspect)'); }));
        return { house: h + 1, sign: SN(si), ruler: lord, ruler_placed: lp ? SN(lp.si) + ', house ' + hs(ls, lp.si) : '-', planets_inside: A.signOcc[si].join(', ') || 'empty', aspected_by: by.join(', ') || 'none' };
      });
      return [{ type: 'table', key: 'houses', cols: [['house', 'House'], ['sign', 'Sign'], ['ruler', 'Ruler'], ['ruler_placed', 'Ruler stands in'], ['planets_inside', 'Planets inside'], ['aspected_by', 'Aspected by']].map(c => ({ k: c[0], h: c[1] })), rows }];
    },
    panchang(cx, A) {
      const S = cx.sid, e = nd(S.Moon - S.Sun), mn = getNakshatraIndex(S.Moon);
      return [{ type: 'kv', key: 'panchang', rows: [
        { k: 'Weekday (vara)', v: vara(cx.jd, cx.tz) }, { k: 'Tithi', v: A.pan.tName + ' (' + A.pan.tithi + ')' }, { k: 'Paksha', v: A.pan.paksha },
        { k: 'Moon nakshatra', v: NAKSHATRAS[mn] + ', pada ' + (getPadaIndex(S.Moon) + 1) + ', lord ' + NAKSHATRA_LORDS[mn] }, { k: 'Yoga', v: A.pan.yoga }, { k: 'Karana', v: A.pan.karana },
        { k: 'Moon illumination', v: A.pan.lit + '%' }, { k: 'Sun to Moon elongation', v: e.toFixed(2) + '°' }] }];
    },
    aspects(cx, A) {
      const rows = PLANET_LIST.map(f => ({ planet: f, looks_at_signs: A.castSigns[f].map(x => SN(x.ts) + ' (' + ord(x.o) + ')').join(', '),
        aspects_planets: A.cast[f].map(r => r.t + ' (' + ord(r.o) + ')').join(', ') || 'none', aspected_by: A.by[f].map(r => r.f + ' (' + ord(r.o) + ')').join(', ') || 'none' }));
      return [{ type: 'table', key: 'graha_drishti', cols: [['planet', 'Planet'], ['looks_at_signs', 'Looks at signs (aspect number)'], ['aspects_planets', 'Planets it aspects'], ['aspected_by', 'Aspected by']].map(c => ({ k: c[0], h: c[1] })), rows },
        { type: 'list', key: 'mutual_aspects', title: 'Mutual aspects (each planet aspects the other)', items: A.mutual.map(m => m[0] + ' <-> ' + m[1] + ' (' + ord(m[2]) + ' / ' + ord(m[3]) + ')') }];
    },
    relations(cx, A, cfg) {
      return [
        { type: 'table', key: 'same_sign', title: 'Planets sharing a sign', cols: [{ k: 'pair', h: 'Planets' }, { k: 'sign', h: 'Sign' }, { k: 'separation_deg', h: 'Separation (deg)' }],
          rows: A.conj.map(r => ({ pair: r[0] + ' + ' + r[1], sign: SN(A.pl[r[0]].si), separation_deg: +r[2].toFixed(2) })) },
        { type: 'list', key: 'planetary_war', title: 'Planetary war (two of Mars, Mercury, Jupiter, Venus, Saturn within 1 degree)', items: A.war.map(r => r[0] + ' vs ' + r[1] + ' (' + r[2].toFixed(2) + ' deg)') },
        { type: 'list', key: 'sign_exchange', title: 'Sign exchange (Parivartana)', items: A.parivartana.map(r => r[0] + ' in ' + SN(A.pl[r[0]].si) + ' <-> ' + r[1] + ' in ' + SN(A.pl[r[1]].si)) },
        { type: 'list', key: 'nakshatra_exchange', title: 'Nakshatra exchange', items: A.nakEx.map(r => r[0] + ' in ' + NAKSHATRAS[A.pl[r[0]].ni] + ' <-> ' + r[1] + ' in ' + NAKSHATRAS[A.pl[r[1]].ni]) },
        { type: 'table', key: 'dispositor_chains', title: 'Dispositor chains (planet -> ruler of its sign -> ...)', cols: [{ k: 'planet', h: 'Planet' }, { k: 'chain', h: 'Chain' }, { k: 'ends', h: 'Ends' }],
          rows: PLANET_LIST.map(n => ({ planet: n, chain: A.chain[n].path.join(' -> '), ends: A.chain[n].end })) }];
    },
    alerts(cx, A) {
      if (typeof SKA === 'undefined' || !SKA.calc) return [{ type: 'text', text: 'Sky alerts are not available.' }];
      const ms = sg(cx.sid.Moon), out = SKA.calc(cx.sid, cx.lagna == null ? null : sg(cx.lagna), ms) || [];
      const strip = t => String(t).replace(/[☀-➿←-⇿\u{1F300}-\u{1FAFF}]/gu, '').replace(/\s+/g, ' ').trim();
      if (!out.length) return [{ type: 'text', text: 'No notable placements are flagged for this moment.' }];
      return [{ type: 'table', key: 'alerts', cols: [{ k: 'counted_from', h: 'Counted from' }, { k: 'tone', h: 'Tone' }, { k: 'alert', h: 'Alert' }, { k: 'meaning', h: 'Meaning' }],
        rows: out.map(a => ({ counted_from: a.ref, tone: a.tone, alert: strip(a.t), meaning: strip(a.x) })) }];
    },
    varga(cx, A, cfg) {
      const keys = (cfg.vargas || []).filter(k => VG.VARGAS[k]);
      if (!keys.length) return [{ type: 'text', text: 'No divisional chart was selected.' }];
      const cols = [{ k: 'planet', h: 'Planet' }].concat(keys.map(k => ({ k, h: k + ' ' + VG.name(k) })));
      const rows = []; if (cx.lagna != null) rows.push(Object.assign({ planet: 'Lagna (Rising)' }, ...keys.map(k => ({ [k]: SN(VG.sign(k, cx.lagna)) }))));
      PLANET_LIST.forEach(n => rows.push(Object.assign({ planet: n }, ...keys.map(k => ({ [k]: SN(VG.sign(k, cx.sid[n])) })))));
      return [{ type: 'table', key: 'divisional_signs', cols, rows }];
    }
  };

  /* ---------------- timing sections (not tied to one chart) ---------------- */
  const hz = (cfg, y) => { const j0 = momentJD(cfg); return [j0, j0 + y * YR]; };
  const T = {
    dasha(cfg) {
      const p = profile(); if (!p) return [{ type: 'text', text: 'Needs a birth profile (Natal tab). None is loaded, so the Dasha is not included.' }];
      const nc = chartCtx('natal', 0, p), tl = VDasha.build(nc.sid.Moon, nc.jd), jd = momentJD(cfg), run = VDasha.at(tl, jd);
      const nk = getNakshatraIndex(nc.sid.Moon), maha = run && tl.mahas.find(m => m.lord === run.md && jd >= m.s && jd < m.e);
      const blocks = [{ type: 'kv', key: 'running', rows: [
        { k: 'Birth Moon nakshatra', v: NAKSHATRAS[nk] + ' (starting lord ' + tl.startLord + ')' }, { k: 'Balance of first Maha at birth', v: tl.balanceYears.toFixed(2) + ' years of ' + tl.startLord },
        { k: 'Moment', v: fmt(jd) }, { k: 'Running Maha', v: run ? run.md + ' (' + fmtDay(run.mdS) + ' to ' + fmtDay(run.mdE) + ')' : 'outside the 125-year timeline' },
        { k: 'Running Antar', v: run ? run.ad + ' (' + fmtDay(run.adS) + ' to ' + fmtDay(run.adE) + ')' : '-' }, { k: 'Running Pratyantar', v: run ? run.pd + ' (' + fmtDay(run.s) + ' to ' + fmtDay(run.e) + ')' : '-' }] },
        { type: 'table', key: 'maha_timeline', title: 'Maha Dasha timeline', cols: [{ k: 'maha', h: 'Maha lord' }, { k: 'from', h: 'From' }, { k: 'to', h: 'To' }, { k: 'years', h: 'Years' }, { k: 'now', h: 'Running' }],
          rows: tl.mahas.slice(0, 10).map(m => ({ maha: m.lord, from: fmtDay(m.s), to: fmtDay(m.e), years: +((m.e - m.s) / YR).toFixed(2), now: run && run.md === m.lord && jd >= m.s && jd < m.e ? 'YES' : '' })) }];
      if (maha) blocks.push({ type: 'table', key: 'antar_in_running_maha', title: 'Antar Dasha inside the running ' + maha.lord + ' Maha', cols: [{ k: 'antar', h: 'Antar lord' }, { k: 'from', h: 'From' }, { k: 'to', h: 'To' }, { k: 'now', h: 'Running' }],
        rows: VDasha.sub(maha).map(a => ({ antar: a.lord, from: fmtDay(a.s), to: fmtDay(a.e), now: jd >= a.s && jd < a.e ? 'YES' : '' })) });
      return blocks;
    },
    transits(cfg) {
      const [j0, j1] = hz(cfg, cfg.tr.years), pl = cfg.tr.moon ? PLANET_LIST : NO_MOON, rows = [];
      pl.forEach(n => { const ev = findIngresses(n, j0, j1); ev.forEach((e, i) => rows.push({ jd: e.jd, date: fmt(e.jd), planet: n, from_sign: SN(e.fromSign), to_sign: SN(e.toSign), stays_days: i + 1 < ev.length ? Math.round(ev[i + 1].jd - e.jd) : null })); });
      rows.sort((a, b) => a.jd - b.jd); const cap = 1500, cut = rows.length > cap;
      return [{ type: 'text', text: 'Window: ' + fmtDay(j0) + ' to ' + fmtDay(j1) + ' (' + cfg.tr.years + ' years). Planets: ' + pl.join(', ') + '. ' + rows.length + ' sign changes' + (cut ? ' (first ' + cap + ' shown)' : '') + '. "stays_days" is the time until that planet changes sign again (empty = after the window).' },
        { type: 'table', key: 'sign_changes', cols: [['date', 'Date (' + TZ() + ')'], ['planet', 'Planet'], ['from_sign', 'From'], ['to_sign', 'To'], ['stays_days', 'Stays (days)']].map(c => ({ k: c[0], h: c[1] })), rows: rows.slice(0, cap).map(r => { const o = Object.assign({}, r); delete o.jd; if (o.stays_days == null) o.stays_days = '-'; return o; }) }];
    },
    meetings(cfg) {
      const [j0, j1] = hz(cfg, cfg.mt.years), rows = [];
      CONJ_PAIRS.forEach(([a, b]) => { if (!cfg.mt.moon && (a === 'Moon' || b === 'Moon')) return; findConjunctions(a, b, j0, j1, 1).forEach(e => rows.push({ jd: e.jd, date: fmt(e.jd), planets: a + ' + ' + b, sign: SN(e.sign), position: fullPos(e.longitude, { angle: cfg.angle }).replace(SN(e.sign) + ' ', '') })); });
      rows.sort((a, b) => a.jd - b.jd); const cap = 1500, cut = rows.length > cap;
      return [{ type: 'text', text: 'Window: ' + fmtDay(j0) + ' to ' + fmtDay(j1) + ' (' + cfg.mt.years + ' years). ' + rows.length + ' meetings' + (cut ? ' (first ' + cap + ' shown)' : '') + (cfg.mt.moon ? '' : '; Moon meetings are left out') + '. Date = the moment both planets have the same longitude.' },
        { type: 'table', key: 'conjunctions', cols: [['date', 'Date (' + TZ() + ')'], ['planets', 'Planets'], ['sign', 'Sign'], ['position', 'Position in sign']].map(c => ({ k: c[0], h: c[1] })), rows: rows.slice(0, cap).map(r => { const o = Object.assign({}, r); delete o.jd; return o; }) }];
    },
    retro(cfg) {
      const [j0, j1] = hz(cfg, cfg.rt.years), ST = { Mercury: 1, Venus: 1, Mars: 3, Jupiter: 5, Saturn: 5 }, rows = [];
      Object.keys(ST).forEach(n => {
        let prev = !!isRetrograde(n, j0), pt = j0, start = prev ? j0 : null; const early = prev;
        for (let t = j0 + ST[n]; ; t += ST[n]) {
          const tt = Math.min(t, j1), cur = !!isRetrograde(n, tt);
          if (cur !== prev) { let a = pt, b = tt; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (!!isRetrograde(n, m) === prev) a = m; else b = m; } const e = (a + b) / 2;
            if (cur) start = e; else { rows.push({ n, s: start, e, early: early && start === j0, late: false }); start = null; } prev = cur; }
          pt = tt; if (tt >= j1) break;
        }
        if (prev && start != null) rows.push({ n, s: start, e: j1, early: early && start === j0, late: true });
      });
      rows.sort((a, b) => a.s - b.s);
      return [{ type: 'text', text: 'Window: ' + fmtDay(j0) + ' to ' + fmtDay(j1) + ' (' + cfg.rt.years + ' years). Rahu and Ketu always move backwards (mean nodes) so they are not listed.' },
        { type: 'table', key: 'retrograde_periods', cols: [['planet', 'Planet'], ['from', 'Turns retrograde'], ['to', 'Turns direct'], ['length', 'Length'], ['from_position', 'Position at start'], ['to_position', 'Position at end'], ['note', 'Note']].map(c => ({ k: c[0], h: c[1] })),
          rows: rows.map(r => ({ planet: r.n, from: r.early ? 'already retrograde at the start' : fmt(r.s), to: r.late ? 'continues after the window' : fmt(r.e), length: span(r.e - r.s), from_position: fullPos(siderealLongitude(r.n, r.s), cfg), to_position: fullPos(siderealLongitude(r.n, r.e), cfg),
            note: (r.early ? 'started before the window' : '') + (r.late ? 'ends after the window' : '') })) }];
    },
    ephemeris(cfg) {
      const e = cfg.eph, step = { '1d': 1, '1w': 7, '1m': 30.4375, '1y': 365.25 }[e.step] || 7, n = Math.max(1, Math.min(120, +e.count || 12)), j0 = momentJD(cfg);
      const pls = (e.planets && e.planets.length ? e.planets : PLANET_LIST).filter(p => PLANET_LIST.includes(p)), rows = [];
      for (let i = 0; i < n; i++) {
        const jd = j0 + i * step, o = { date: fmt(jd) };
        pls.forEach(p => { const l = siderealLongitude(p, jd), r = !NODES.includes(p) && isRetrograde(p, jd); o[p] = SN(sg(l)).slice(0, 3) + ' ' + posStr(l, cfg) + (r ? ' (R)' : ''); });
        rows.push(o);
      }
      return [{ type: 'text', text: n + ' rows, one every ' + ({ '1d': 'day', '1w': 'week', '1m': 'month', '1y': 'year' }[e.step] || 'week') + ' from ' + fmt(j0) + '. Cells read: sign (3 letters) position in sign; (R) = retrograde.' },
        { type: 'table', key: 'ephemeris', cols: [{ k: 'date', h: 'Date (' + TZ() + ')' }].concat(pls.map(p => ({ k: p, h: p }))), rows }];
    },
    finder() {
      const S = (typeof TLF !== 'undefined' && TLF.state) || null, r = S && S.res;
      if (!r || !r.windows) return [{ type: 'text', text: 'No Timeline finder search has been run yet, so there are no results to include.' }];
      const d = c => c.t === 'rel' ? c.a + ' ' + ({ conj: 'meets', opp: 'is opposite', tri: 'is in trine with', sq: 'is square to' }[c.rel] || c.rel) + ' ' + c.b + ' (orb ' + c.orb + ' deg)'
        : c.t === 'retro' ? (c.planets || []).join(' + ') + (c.on === false ? ' direct' : ' retrograde') : (c.planets || []).join(c.mode === 'any' ? ' or ' : ' + ') + ' in ' + (c.t === 'nak' ? NAKSHATRAS[c.v] : SN(c.v));
      return [{ type: 'kv', key: 'search', rows: [{ k: 'Conditions', v: S.conds.map(d).join(S.combine === 'any' ? '  OR  ' : '  AND  ') }, { k: 'Combined as', v: S.combine === 'any' ? 'ANY one condition' : 'ALL conditions together' },
        { k: 'Birth range searched', v: S.mode === 'age' ? 'ages ' + S.a0 + ' to ' + S.a1 + ' counted back from the day of the search' : 'birth years ' + S.y0 + ' to ' + S.y1 }, { k: 'Periods found', v: String(r.windows.length) + (r.capped ? ' (list was capped)' : '') }] },
        { type: 'table', key: 'periods', cols: [['from', 'From'], ['to', 'To'], ['length', 'Length'], ['positions', 'Planet positions then']].map(c => ({ k: c[0], h: c[1] })),
          rows: r.windows.map(w => ({ from: fmt(w.from), to: fmt(w.to), length: span(w.to - w.from), positions: (w.pos || []).map(p => p.n + ' ' + p.d + '° ' + SN(p.s)).join('; ') })) }];
    }
  };

  /* ---------------- build the model ---------------- */
  function safe(fn, label) { try { return fn(); } catch (e) { return [{ type: 'text', text: 'This section could not be built (' + label + '): ' + (e && e.message || e) }]; } }
  function build(cfgIn) {
    const cfg = norm(cfgIn), p = profile(), jd = momentJD(cfg), want = id => cfg.sec.includes(id);
    let basis = cfg.basis; if (basis === 'auto') basis = p ? 'both' : 'sky'; if ((basis === 'natal' || basis === 'both') && !p) basis = 'sky';
    const kinds = basis === 'both' ? ['sky', 'natal'] : [basis];
    const a = chartCtx('sky', jd, p), meta = {
      title: 'Vedic Sky Export', source: 'Vedic Astro Suite - 3D Sky', generated_at: new Date().toISOString(), device_timezone: TZ(),
      zodiac: 'Sidereal', ayanamsa: (AYAN_MODES[ayanKey()] || {}).name + ' (' + a.ayan.toFixed(4) + ' deg at the sky moment)', house_system: 'Whole-sign houses counted from the Lagna', nodes: 'Mean Rahu and Ketu',
      moment: { local: fmt(jd) + ' ' + TZ(), utc: utc(jd), julian_day: +jd.toFixed(5), source: { sky: 'the date shown in the 3D Sky', today: 'the real current time', custom: 'a custom date typed in the Export Studio' }[cfg.moment] || 'the 3D Sky date' },
      view_in_3d: (typeof NAV !== 'undefined' && NAV.on) ? NAV.key + ' ' + NAV.label + ' sky is drawn in 3D (this export always uses the REAL sky; see Divisional charts for ' + NAV.key + ' signs)' : 'normal sky',
      birth_profile: p ? { name: p.name, date: p.dob, time: p.tob, utc_offset: offStr(p.tz), latitude: p.lat, longitude: p.lon, place: p.place || '' } : null,
      lagna: p ? (() => { const l = computeNatalAscendant(p).lagnaLon; return { sign: SN(sg(l)), position: posStr(l, cfg), nakshatra: NAKSHATRAS[getNakshatraIndex(l)] }; })() : null
    };
    const groups = [];
    const ids = SECTIONS.filter(s => s.part === 'chart' && want(s.id));
    kinds.forEach(kind => {
      if (!ids.length) return;
      const cx = chartCtx(kind, jd, p), A = DBX.analyse(cx);
      A.pan.vara = vara(cx.jd, cx.tz);
      groups.push({ id: 'chart_' + kind, kind: 'chart', title: (kinds.length > 1 ? (kind === 'sky' ? 'Chart A - ' : 'Chart B - ') : '') + cx.label, when: cx.when,
        about: kind === 'natal' ? 'The birth chart: planets as they stood at the birth moment.' : 'The sky at the chosen moment' + (p ? ', with houses counted from the birth Lagna of ' + p.name + '.' : '. No birth profile is loaded, so there is no Lagna and no houses.'),
        sections: ids.map(s => ({ id: s.id, title: s.title, about: s.about, blocks: safe(() => B[s.id](cx, A, cfg), s.id) })) });
    });
    const tids = SECTIONS.filter(s => s.part === 'timing' && want(s.id));
    if (tids.length) groups.push({ id: 'timing', kind: 'timing', title: 'Timing and forecasts', when: 'starting ' + fmt(jd),
      about: 'Things that happen over time. Windows start at the chosen moment (' + fmt(jd) + ' ' + TZ() + ').', sections: tids.map(s => ({ id: s.id, title: s.title, about: s.about, blocks: safe(() => T[s.id](cfg), s.id) })) });
    return { schema: SCHEMA, cfg, meta, groups };
  }

  /* ---------------- renderers ---------------- */
  const GUIDE = [
    'Zodiac is SIDEREAL. Signs run Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces, 30 degrees each.',
    '"Position in sign" is degrees inside the sign (0-30). "Absolute degree" counts 0-360 from 0 Aries. Degrees are written degrees-minutes-seconds unless noted.',
    'Houses are WHOLE-SIGN: house 1 is the Lagna sign, house 2 the next sign, and so on. Aspects (drishti) are counted sign to sign: every planet sees the 7th; Mars also 4th and 8th; Jupiter 5th and 9th; Saturn 3rd and 10th; Rahu and Ketu 5th, 7th and 9th.',
    '(R) after a planet means retrograde. Rahu and Ketu are mean nodes and always retrograde.',
    'Dignity words: Exalted, Own sign, Friendly, Neutral, Enemy, Debilitated. Flags: Combust (too near the Sun), Vargottama (same sign in D1 and D9), Gandanta (water-fire sign junction), Near station (about to turn).',
    'Dates and times are in the device time zone unless a birth time is shown with its own UTC offset.'
  ];
  const RULES = 'Use ONLY the data in this export. Do not invent positions, dates or strengths. If something you need is not included, say it is missing and name the section that would hold it. Cite the section number when you use data.';

  const cell = v => v == null || v === '' ? '-' : Array.isArray(v) ? v.join(', ') : String(v);
  const mdc = v => cell(v).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  function sectionList(m) { let n = 0; const out = []; m.groups.forEach(g => g.sections.forEach(s => { n++; out.push({ n, g, s }); })); return out; }

  function renderMD(m) {
    const cfg = m.cfg, L = [], list = sectionList(m), mm = m.meta;
    L.push('# ' + mm.title + ' - ' + (m.groups[0] ? m.groups[0].title : 'Overview'), '', '> ' + mm.source + ' | generated ' + mm.generated_at + ' | format ' + m.schema, '');
    if (cfg.task && cfg.task.trim()) L.push('## Your task', '', cfg.task.trim(), '');
    if (cfg.rules) L.push('## Rules for the reader', '', RULES, '');
    if (cfg.guide) L.push('## How to read this export', '', ...GUIDE.map(x => '- ' + x), '');
    L.push('## Contents', '', '0. Overview');
    m.groups.forEach(g => { L.push('- ' + g.title); list.filter(x => x.g === g).forEach(x => L.push('  ' + x.n + '. ' + x.s.title)); });
    L.push('', '## 0. Overview', '');
    const ov = [['Moment (local)', mm.moment.local], ['Moment (UTC)', mm.moment.utc], ['Julian day', mm.moment.julian_day], ['Moment taken from', mm.moment.source], ['Zodiac', mm.zodiac], ['Ayanamsa', mm.ayanamsa], ['Houses', mm.house_system], ['Nodes', mm.nodes], ['3D view', mm.view_in_3d]];
    if (mm.birth_profile) { const b = mm.birth_profile; ov.push(['Birth profile', b.name + ', born ' + b.date + ' ' + b.time + ' (UTC' + b.utc_offset + '), ' + (b.place ? b.place + ' ' : '') + '(' + b.latitude + ', ' + b.longitude + ')']); ov.push(['Birth Lagna', mm.lagna.sign + ' ' + mm.lagna.position + ', ' + mm.lagna.nakshatra]); }
    else ov.push(['Birth profile', 'none loaded (no Lagna, houses or Dasha)']);
    L.push('| Field | Value |', '| --- | --- |', ...ov.map(r => '| ' + r[0] + ' | ' + mdc(r[1]) + ' |'), '');
    m.groups.forEach(g => {
      L.push('# ' + g.title, '', '_' + g.about + '_' + (g.when ? ' Moment: ' + g.when + '.' : ''), '');
      list.filter(x => x.g === g).forEach(x => {
        L.push('## ' + x.n + '. ' + x.s.title, '', '_' + x.s.about + '_', '');
        x.s.blocks.forEach(b => blockMD(b, L));
      });
    });
    return L.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }
  function blockMD(b, L) {
    if (b.title) L.push('### ' + b.title, '');
    if (b.type === 'text') L.push(b.text, '');
    else if (b.type === 'kv') L.push('| Field | Value |', '| --- | --- |', ...b.rows.map(r => '| ' + mdc(r.k) + ' | ' + mdc(r.v) + ' |'), '');
    else if (b.type === 'list') L.push(...(b.items.length ? b.items.map(i => '- ' + i) : ['- none']), '');
    else if (b.type === 'table') { if (!b.rows.length) L.push('_No rows._', ''); else L.push('| ' + b.cols.map(c => mdc(c.h)).join(' | ') + ' |', '| ' + b.cols.map(() => '---').join(' | ') + ' |', ...b.rows.map(r => '| ' + b.cols.map(c => mdc(r[c.k])).join(' | ') + ' |'), ''); }
  }

  function renderTXT(m) {
    const cfg = m.cfg, L = [], list = sectionList(m), mm = m.meta, bar = '='.repeat(72), thin = '-'.repeat(72);
    L.push(bar, (mm.title + ' - ' + (m.groups[0] ? m.groups[0].title : 'Overview')).toUpperCase(), mm.source + ' | generated ' + mm.generated_at, bar, '');
    if (cfg.task && cfg.task.trim()) L.push('YOUR TASK', thin, cfg.task.trim(), '');
    if (cfg.rules) L.push('RULES FOR THE READER', thin, RULES, '');
    if (cfg.guide) L.push('HOW TO READ THIS EXPORT', thin, ...GUIDE.map(x => '* ' + x), '');
    L.push('CONTENTS', thin, '0. Overview'); list.forEach(x => L.push(x.n + '. ' + x.s.title)); L.push('');
    L.push('0. OVERVIEW', thin);
    const ov = [['Moment (local)', mm.moment.local], ['Moment (UTC)', mm.moment.utc], ['Julian day', mm.moment.julian_day], ['Moment taken from', mm.moment.source], ['Zodiac', mm.zodiac], ['Ayanamsa', mm.ayanamsa], ['Houses', mm.house_system], ['Nodes', mm.nodes], ['3D view', mm.view_in_3d]];
    if (mm.birth_profile) { const b = mm.birth_profile; ov.push(['Birth profile', b.name + ', born ' + b.date + ' ' + b.time + ' (UTC' + b.utc_offset + ')']); ov.push(['Birth Lagna', mm.lagna.sign + ' ' + mm.lagna.position + ', ' + mm.lagna.nakshatra]); } else ov.push(['Birth profile', 'none loaded']);
    kvTXT(ov.map(r => ({ k: r[0], v: r[1] })), L); L.push('');
    m.groups.forEach(g => {
      L.push(bar, g.title.toUpperCase(), g.about, bar, '');
      list.filter(x => x.g === g).forEach(x => {
        L.push(x.n + '. ' + x.s.title.toUpperCase(), thin, x.s.about, '');
        x.s.blocks.forEach(b => {
          if (b.title) L.push(b.title + ':');
          if (b.type === 'text') L.push(b.text); else if (b.type === 'kv') kvTXT(b.rows, L); else if (b.type === 'list') L.push(...(b.items.length ? b.items.map(i => '  * ' + i) : ['  * none']));
          else if (b.type === 'table') { if (!b.rows.length) L.push('  (no rows)'); else { const w = b.cols.map(c => Math.max(c.h.length, ...b.rows.map(r => cell(r[c.k]).length))); L.push('  ' + b.cols.map((c, i) => c.h.padEnd(w[i])).join('  |  '), '  ' + w.map(n => '-'.repeat(n)).join('--+--'), ...b.rows.map(r => '  ' + b.cols.map((c, i) => cell(r[c.k]).padEnd(w[i])).join('  |  '))); } }
          L.push('');
        });
      });
    });
    return L.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }
  function kvTXT(rows, L) { const w = Math.max(...rows.map(r => String(r.k).length)); rows.forEach(r => L.push('  ' + String(r.k).padEnd(w) + ' : ' + cell(r.v))); }

  function renderJSON(m) {
    const cfg = m.cfg, out = { schema: m.schema, generated_at: m.meta.generated_at };
    if (cfg.task && cfg.task.trim()) out.task = cfg.task.trim();
    if (cfg.rules) out.rules_for_reader = RULES;
    if (cfg.guide) out.how_to_read = GUIDE;
    out.overview = Object.assign({}, m.meta); delete out.overview.generated_at; delete out.overview.title;
    m.groups.forEach(g => {
      const G = { title: g.title, about: g.about, when: g.when, sections: {} };
      g.sections.forEach(s => { const o = { title: s.title, about: s.about }; s.blocks.forEach((b, i) => { const k = b.key || ('note_' + (i + 1));
        if (b.type === 'text') o[k] = b.text; else if (b.type === 'kv') { const kv = {}; b.rows.forEach(r => { kv[r.k] = r.v; }); o[k] = kv; } else if (b.type === 'list') o[k] = b.items; else if (b.type === 'table') o[k] = b.rows.map(r => { const x = {}; b.cols.forEach(c => { x[c.k] = r[c.k] == null ? null : r[c.k]; }); return x; }); }); G.sections[s.id] = o; });
      out[g.id] = G;
    });
    return JSON.stringify(out, null, 2) + '\n';
  }

  function render(m) { return m.cfg.format === 'json' ? renderJSON(m) : m.cfg.format === 'txt' ? renderTXT(m) : renderMD(m); }
  function make(cfg) { const m = build(cfg); const text = render(m); return { text, model: m, chars: text.length, tokens: Math.round(text.length / 3.6), sections: sectionList(m).length }; }
  const ext = f => f === 'json' ? 'json' : f === 'txt' ? 'txt' : 'md', mime = f => f === 'json' ? 'application/json' : f === 'txt' ? 'text/plain' : 'text/markdown';

  return { SCHEMA, SECTIONS, PRESETS, ALL_VARGAS, defaults, norm, merge, applyPreset, build, render, make, momentJD, fmt, profile, ext, mime, GUIDE, RULES };
})();

/* ASTROLOGER WORKSPACE ENGINE (AW): the data side of the Workspace tab (docs/ASTRO_WORKSPACE_PLAN.md).
   A routine = an ordered list of steps an astrologer always checks (a D9 chart, the dasha now, strength bars, any tool of the app...).
   Saved in this device's localStorage; it holds no chart and no birth details, only the recipe, so it opens on any chart.
   AW.list() / get(id) / save(routine) / remove(id) / duplicate(id) / move(id, from, to) / touch(id)
   AW.blank() / sanitize(raw) / encode(routine) -> "AW1.<code>" / decode(text) -> routine | null / starters()
   AW.WIDGETS: catalogue of the native widgets (id, name, icon, group, about, options); AW.GROUPS
   Pure data and logic: no DOM, nothing runs at page load except defining the object. Works without storage (try/catch). */
(function(root){
  'use strict';
  const KEY = 'vax_workspace_v1', UIKEY = 'vax_workspace_ui_v1', MAXSTEPS = 40, MAXROUT = 60;
  const VARGA_KEYS = ['D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D16','D20','D24','D27','D30','D40','D45','D60','D81','D108','D144'];
  const VARGA_ABOUT = { D1: 'Rashi (the main chart)', D2: 'Hora (wealth)', D3: 'Drekkana (siblings, courage)', D4: 'Chaturthamsha (home, luck)', D5: 'Panchamsha (fame, merit)', D6: 'Shashthamsha (health, debts)', D7: 'Saptamsha (children)', D8: 'Ashtamsha (sudden change)', D9: 'Navamsha (marriage, dharma)', D10: 'Dashamsha (career)', D11: 'Rudramsha (gains, ends)', D12: 'Dwadashamsha (parents)', D16: 'Shodashamsha (vehicles, comforts)', D20: 'Vimshamsha (devotion)', D24: 'Siddhamsha (learning)', D27: 'Bhamsha (strength)', D30: 'Trimshamsha (troubles)', D40: 'Khavedamsha (maternal line)', D45: 'Akshavedamsha (paternal line)', D60: 'Shashtiamsha (past karma)', D81: 'Navanavamsha', D108: 'Ashtottaramsha', D144: 'Dwadashadwadashamsha' };
  const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  const STYLES = ['north','south'];
  const GROUPS = [['find','Find a point','⌖'],['chart','Charts','◈'],['table','Tables','▤'],['time','Time & dasha','◷'],['strength','Strength','⚖'],['combo','Combinations','✦'],['read','Plain words','✎']];
  const opt = (k, label, values, def) => ({ k, label, values, def });
  const VARGA_OPT = opt('varga', 'Divisional chart', VARGA_KEYS.map(k => [k, k + ' · ' + (VARGA_ABOUT[k] || '')]), 'D1');
  const STYLE_OPT = opt('style', 'Chart style', [['north','North Indian'],['south','South Indian']], 'north');
  const PLANET_OPT = opt('planet', 'Planet', PLANETS.map(p => [p, p]), 'Jupiter');
  /* variables a person can pick: [id, label, group]. Resolved against a chart by AWP (js/163). */
  const ORD = n => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
  const SUBJECTS = [].concat(
    PLANETS.concat(['Uranus', 'Neptune', 'Pluto']).map(p => [p, p, 'Planets']),
    [['role:AK', 'Atmakaraka (AK, the soul)', 'Chara Karakas'], ['role:AmK', 'Amatyakaraka (AmK, career)', 'Chara Karakas'], ['role:BK', 'Bhratrikaraka (BK, siblings)', 'Chara Karakas'], ['role:MK', 'Matrikaraka (MK, mother)', 'Chara Karakas'], ['role:PuK', 'Putrakaraka (PuK, children)', 'Chara Karakas'], ['role:GK', 'Gnatikaraka (GK, rivals)', 'Chara Karakas'], ['role:DK', 'Darakaraka (DK, partner)', 'Chara Karakas']],
    Array.from({ length: 12 }, (_, i) => ['lord:' + (i + 1), 'Lord of the ' + ORD(i + 1) + ' house' + (i === 0 ? ' (Lagna lord)' : ''), 'House lords']),
    [['lagna', 'Lagna (rising point)', 'Special points'], ['pt:gulika', 'Gulika (Mandi)', 'Special points'], ['pt:bb', 'Bhrigu Bindu', 'Special points'], ['pt:hora', 'Hora Lagna', 'Special points'], ['pt:ghati', 'Ghati Lagna', 'Special points'], ['pt:shree', 'Shree Lagna', 'Special points'], ['pt:prana', 'Pranapada Lagna', 'Special points'], ['pt:bhava', 'Bhava Lagna', 'Special points'], ['pt:vighati', 'Vighati Lagna', 'Special points']],
    [['dasha:md', 'Mahadasha lord now', 'Time and strength'], ['dasha:ad', 'Antardasha lord now', 'Time and strength'], ['strong', 'Strongest planet (Shadbala)', 'Time and strength'], ['weak', 'Weakest planet (Shadbala)', 'Time and strength'], ['nak:Moon', 'Nakshatra lord of the Moon', 'Time and strength'], ['nak:Lagna', 'Nakshatra lord of the Lagna', 'Time and strength']],
    [['sg:AL', 'Arudha Lagna (AL)', 'Sign-only points'], ['sg:UL', 'Upapada Lagna (UL)', 'Sign-only points'], ['sg:KL', 'Karakamsha (KL)', 'Sign-only points'], ['sg:INDU', 'Indu Lagna', 'Sign-only points'], ['sg:SWAMSHA', 'Swamsha Lagna', 'Sign-only points']]
  );
  const SUBJECT_KEYS = ['subject', 'subjects', 'planet'];
  /* every pickable variable now: the built-in ones plus the person's own (js/164) */
  function subjectList(){ let mine = []; try { mine = (root.AWV && root.AWV.list ? root.AWV.list() : []).map(v => [v.id, v.name, 'My variables']); } catch (e) {} return SUBJECTS.concat(mine); }
  const SUBJ_VALUES = SUBJECTS.map(x => [x[0], x[1], x[2]]);
  const PLANET_SUBJECTS = SUBJECTS.filter(x => /^(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu|role:|lord:|dasha:|strong|weak|nak:)/.test(x[0])).map(x => [x[0], x[1], x[2]]);
  const SUBJ_PRESETS = [['Karakas', 'role:AK,role:AmK,role:BK,role:MK,role:PuK,role:GK,role:DK'], ['Planets', PLANETS.join(',')], ['House lords', Array.from({ length: 12 }, (_, i) => 'lord:' + (i + 1)).join(',')], ['Special points', 'lagna,pt:gulika,pt:bb,pt:hora,pt:ghati,pt:shree'], ['Marriage', 'role:DK,lord:7,Venus,pt:bb,sg:UL']];
  const SUBJ_OPT = opt('subject', 'Point to find', SUBJ_VALUES, 'role:AK');
  const HOUSE_OPT = opt('house', 'House', Array.from({ length: 12 }, (_, i) => [String(i + 1), 'House ' + (i + 1)]), '7');
  /* [id, name, icon, group, about, options] */
  const W = [
    ['locate', 'Where is it? (one point, one chart)', '⌖', 'find', 'Pick a planet, Atmakaraka, Darakaraka, a house lord or a special point, and see where it stands in D9 or any divisional chart, drawn with the point lit up.', [SUBJ_OPT, Object.assign({}, VARGA_OPT, { def: 'D9' }), STYLE_OPT]],
    ['locateall', 'Everywhere (one point, all 23 charts)', '◎', 'find', 'One point across every divisional chart: its sign, house and strength in each, with a strip that shows where it is strong or weak.', [SUBJ_OPT]],
    ['points', 'Several points in one chart', '⋮⋮', 'find', 'Choose several points (for example AK, AmK and DK, or all house lords) and see all of them in one divisional chart in a single table.', [opt('subjects', 'Points to find', SUBJ_VALUES, 'role:AK,role:AmK,role:DK'), Object.assign({}, VARGA_OPT, { def: 'D9' })]],
    ['chart', 'Divisional chart', '◈', 'chart', 'Any chart from D1 to D144, drawn with its planets, in North or South style.', [VARGA_OPT, STYLE_OPT]],
    ['chart2', 'Two charts side by side', '◫', 'chart', 'Compare two charts at a glance, for example D1 with D9.', [Object.assign({}, VARGA_OPT, { k: 'a', label: 'Left chart', def: 'D1' }), Object.assign({}, VARGA_OPT, { k: 'b', label: 'Right chart', def: 'D9' }), STYLE_OPT]],
    ['moonchart', 'Chart from the Moon', '☾', 'chart', 'The chart counted from the Moon sign (Chandra Lagna).', [STYLE_OPT]],
    ['facts', 'Quick facts strip', '✺', 'read', 'Lagna, Moon sign, nakshatra, Sun sign and the dasha running now, in one band.', []],
    ['planets', 'Planet positions', '♃', 'table', 'Sign, degree, house, nakshatra, dignity and motion of every planet in any chart.', [VARGA_OPT]],
    ['houses', 'Houses and their lords', '⌂', 'table', 'The twelve houses of any chart: sign, lord, where the lord sits and who occupies it.', [VARGA_OPT]],
    ['karakas', 'Chara Karakas', '☉', 'table', 'Atmakaraka to Darakaraka: the planets ranked by degree, each with its role.', []],
    ['nakshatras', 'Nakshatras of the planets', '✧', 'table', 'The nakshatra, pada and nakshatra lord of every planet.', []],
    ['lagnas', 'Special lagnas', '⌖', 'table', 'Arudha, Hora, Ghati, Indu and other special rising points as signs and houses.', []],
    ['dashanow', 'Dasha running now', '◷', 'time', 'Mahadasha, antardasha and pratyantardasha today, with dates and progress bars.', []],
    ['dashanext', 'Coming dashas', '⏭', 'time', 'The next mahadashas and what each lord does in this chart.', []],
    ['transits', 'Transits now', '⟲', 'time', 'Where the planets are in the sky today, and which house of your chart each one crosses.', []],
    ['sadesati', 'Sade Sati and Saturn', '♄', 'time', 'Whether Saturn is moving over the Moon sign now, and where Saturn sits.', []],
    ['panchang', 'Panchang today', '☼', 'time', 'Tithi, vara, nakshatra, yoga and karana of today.', []],
    ['shadbala', 'Shadbala strength', '⚖', 'strength', 'The six-fold strength of the seven planets as bars against the needed minimum.', []],
    ['avsav', 'Ashtakavarga points by house', '▦', 'strength', 'Sarvashtakavarga points of each house with the average line.', []],
    ['yogas', 'Yogas in this chart', '✦', 'combo', 'The notable planet combinations found in the chart, with a plain meaning.', []],
    ['dosha', 'Doshas check', '🧿', 'combo', 'Manglik, Kaal Sarp and the other doshas, found or not found.', []],
    ['aspects', 'Aspects on a house', '⇆', 'combo', 'Which planets look at a chosen house and which planets sit in it.', [HOUSE_OPT]],
    ['housereading', 'Reading of a house', '✎', 'read', 'A plain-words reading of one house: its lord, its planets and what it means for you.', [HOUSE_OPT]],
    ['planetreading', 'Reading of a planet', '✎', 'read', 'A plain-words reading of one planet where it stands in this chart. Pick a planet or a role such as Atmakaraka or the 7th lord.', [opt('planet', 'Planet or role', PLANET_SUBJECTS, 'Jupiter')]],
    ['note', 'My own note', '✍', 'read', 'A card with your own words: a checklist, a question to ask, a reminder.', [opt('text', 'Your note', null, '')]]
  ];
  const WIDGETS = W.map(w => ({ id: w[0], name: w[1], icon: w[2], group: w[3], about: w[4], options: w[5] }));
  const WMAP = {}; WIDGETS.forEach(w => { WMAP[w.id] = w; });

  const COLORS = ['#D4AF37', '#5EC4B7', '#8A6FB8', '#D96C9B', '#E0A64A', '#4F8FBF', '#7FB77E', '#C95050'];
  const ICONS = ['✦', '◈', '☾', '☉', '♃', '⌂', '◷', '⚖', '✺', '❖', '☸', '🔭'];

  const multi = (x, n) => (typeof x === 'string' ? x : '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').trim().slice(0, n);
  function uid(){ return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function sid(){ return 's' + Math.random().toString(36).slice(2, 8); }
  const str = (x, n) => (typeof x === 'string' ? x : '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);

  /* defaults of one widget's options */
  function defaults(id){ const w = WMAP[id], o = {}; if (w) w.options.forEach(x => { o[x.k] = x.def; }); return o; }
  function cleanOpts(id, o){
    const w = WMAP[id], out = defaults(id); if (!w || !o || typeof o !== 'object') return out;
    w.options.forEach(x => {
      const okv = v => x.values.some(p => p[0] === v) || (SUBJECT_KEYS.indexOf(x.k) >= 0 && /^cv:[a-z0-9_]{4,20}$/.test(v));
      if (x.k === 'subjects'){ const ok = String(o[x.k] || '').split(',').filter((v, i, a2) => okv(v) && a2.indexOf(v) === i).slice(0, 12); if (ok.length) out[x.k] = ok.join(','); }
      else if (x.values){ const v = String(o[x.k]); if (okv(v)) out[x.k] = v; }
      else if (typeof o[x.k] === 'string') out[x.k] = multi(o[x.k], 1200);
    });
    return out;
  }
  function step(kind, target, o, label, note){
    kind = kind === 'p' ? 'p' : 'w';
    return { id: sid(), k: kind, t: str(target, 60), o: kind === 'w' ? cleanOpts(target, o) : {}, label: str(label, 60), note: str(note, 400) };
  }
  function sanitizeStep(s){
    if (!s || typeof s !== 'object' || !s.t) return null;
    const k = s.k === 'p' ? 'p' : 'w', t = str(s.t, 60);
    if (!/^[a-z0-9_-]+$/i.test(t)) return null;
    return { id: /^s[a-z0-9]{3,10}$/.test(s.id || '') ? s.id : sid(), k, t, o: k === 'w' ? cleanOpts(t, s.o) : {}, label: str(s.label, 60), note: str(s.note, 400) };
  }
  function blank(name){
    return { v: 1, id: uid(), name: str(name || 'My routine', 60) || 'My routine', icon: ICONS[0], color: COLORS[0], note: '', layout: 'flow', steps: [], made: Date.now(), used: 0, uses: 0, pin: false };
  }
  function sanitize(raw){
    if (!raw || typeof raw !== 'object') return null;
    const r = blank(raw.name);
    r.id = /^r[a-z0-9]{4,24}$/.test(raw.id || '') ? raw.id : r.id;
    r.icon = str(raw.icon, 4) || r.icon; r.color = COLORS.indexOf(raw.color) >= 0 ? raw.color : (/^#[0-9a-f]{6}$/i.test(raw.color || '') ? raw.color : r.color);
    r.note = str(raw.note, 400); r.layout = raw.layout === 'board' ? 'board' : 'flow';
    r.steps = (Array.isArray(raw.steps) ? raw.steps : []).slice(0, MAXSTEPS).map(sanitizeStep).filter(Boolean);
    r.made = +raw.made > 0 ? +raw.made : r.made; r.used = +raw.used > 0 ? +raw.used : 0; r.uses = +raw.uses > 0 ? Math.floor(+raw.uses) : 0; r.pin = !!raw.pin;
    if (raw.starter) r.starter = str(raw.starter, 30);
    return r;
  }

  /* ---------- storage ---------- */
  function readAll(){ try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a.map(sanitize).filter(Boolean).slice(0, MAXROUT) : []; } catch (e) { return mem.slice(); } }
  let mem = [];
  function writeAll(a){ mem = a.slice(); try { localStorage.setItem(KEY, JSON.stringify(a)); return true; } catch (e) { return false; } }
  function list(){ return readAll(); }
  function get(id){ return readAll().find(r => r.id === id) || null; }
  function save(r){
    const c = sanitize(r); if (!c) return null; const a = readAll(), i = a.findIndex(x => x.id === c.id);
    if (i >= 0) a[i] = c; else a.unshift(c); writeAll(a.slice(0, MAXROUT)); return c;
  }
  function remove(id){ const a = readAll(), i = a.findIndex(x => x.id === id); if (i < 0) return null; const gone = a.splice(i, 1)[0]; writeAll(a); return gone; }
  function duplicate(id){ const r = get(id); if (!r) return null; const c = sanitize(r); c.id = uid(); c.name = str(r.name + ' (copy)', 60); c.made = Date.now(); c.used = 0; c.uses = 0; c.pin = false; delete c.starter; c.steps.forEach(s => { s.id = sid(); }); return save(c); }
  function touch(id){ const r = get(id); if (!r) return; r.used = Date.now(); r.uses = (r.uses || 0) + 1; save(r); }
  function move(arr, from, to){ if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr; const x = arr.splice(from, 1)[0]; arr.splice(to, 0, x); return arr; }
  function ui(){ try { const o = JSON.parse(localStorage.getItem(UIKEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
  function setUi(patch){ try { localStorage.setItem(UIKEY, JSON.stringify(Object.assign(ui(), patch))); } catch (e) {} }

  /* ---------- sharing: AW1.<base64url of short JSON> ---------- */
  function b64e(s){ const b = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64'); return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64d(s){ s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return typeof atob === 'function' ? decodeURIComponent(escape(atob(s))) : Buffer.from(s, 'base64').toString('utf8'); }
  function encode(r, vars){
    const c = sanitize(r); if (!c) return '';
    const short = { n: c.name, i: c.icon, c: c.color, d: c.note, l: c.layout === 'board' ? 'b' : 'f', s: c.steps.map(s => { const o = { k: s.k, t: s.t }; if (s.k === 'w' && Object.keys(s.o).length) o.o = s.o; if (s.label) o.a = s.label; if (s.note) o.m = s.note; return o; }) };
    if (Array.isArray(vars) && vars.length) short.v = vars.slice(0, 12);
    return 'AW1.' + b64e(JSON.stringify(short));
  }
  function decode(text){
    try {
      let t = String(text || '').trim(); const m = t.match(/AW1\.[A-Za-z0-9_-]+/); if (m) t = m[0];
      let raw;
      if (/^AW1\./.test(t)){
        const s = JSON.parse(b64d(t.slice(4)));
        raw = { name: s.n, icon: s.i, color: s.c, note: s.d, layout: s.l === 'b' ? 'board' : 'flow', steps: (s.s || []).map(x => ({ k: x.k, t: x.t, o: x.o, label: x.a, note: x.m })), vars: s.v };
      } else if (t[0] === '{'){ raw = JSON.parse(t); }
      else return null;
      const r = sanitize(raw); if (!r) return null;
      if (Array.isArray(raw.vars)) r.vars = raw.vars.slice(0, 12);
      r.id = uid(); r.made = Date.now(); r.used = 0; r.uses = 0; r.pin = false; delete r.starter; r.steps.forEach(s => { s.id = sid(); });
      return r;
    } catch (e) { return null; }
  }

  /* ---------- starter routines (copied into the person's list the first time the tab opens; fully editable) ---------- */
  const S = (name, icon, color, note, steps) => { const r = blank(name); r.icon = icon; r.color = color; r.note = note; r.starter = name; r.steps = steps.map(x => step(x[0], x[1], x[2], x[3])); return r; };
  function starters(){
    return [
      S('Quick read', '✦', '#D4AF37', 'The first five minutes with any chart.', [['w', 'facts'], ['w', 'chart', { varga: 'D1' }], ['w', 'planets', { varga: 'D1' }], ['w', 'dashanow'], ['w', 'yogas']]),
      S('Marriage check', '💞', '#D96C9B', 'Rashi, Navamsha, the 7th house and the timing around it.', [['w', 'chart2', { a: 'D1', b: 'D9' }], ['w', 'housereading', { house: '7' }], ['w', 'aspects', { house: '7' }], ['w', 'dosha'], ['w', 'dashanow']]),
      S('Career check', '◆', '#4F8FBF', 'Rashi, Dashamsha, the 10th house, strength and timing.', [['w', 'chart2', { a: 'D1', b: 'D10' }], ['w', 'housereading', { house: '10' }], ['w', 'aspects', { house: '10' }], ['w', 'shadbala'], ['w', 'dashanow'], ['w', 'transits']]),
      S('Dasha and transit', '◷', '#8A6FB8', 'What period is running and what the sky is doing over it.', [['w', 'dashanow'], ['w', 'dashanext'], ['w', 'transits'], ['w', 'sadesati']]),
      S('Strength audit', '⚖', '#5EC4B7', 'Which planets and houses carry weight.', [['w', 'shadbala'], ['w', 'avsav'], ['w', 'planets', { varga: 'D1' }], ['w', 'houses', { varga: 'D1' }]])
    ];
  }

  const api = { subjectList, SUBJECTS, SUBJ_PRESETS, PLANET_SUBJECTS, KEY, UIKEY, MAXSTEPS, WIDGETS, WMAP, GROUPS, COLORS, ICONS, VARGA_KEYS, VARGA_ABOUT, PLANETS, STYLES, uid, sid, defaults, cleanOpts, step, blank, sanitize, list, get, save, remove, duplicate, touch, move, ui, setUi, encode, decode, starters };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.AW = api;
})(typeof window !== 'undefined' ? window : globalThis);

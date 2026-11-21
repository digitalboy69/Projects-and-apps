/* WORKSPACE MY VARIABLES (AWV): variables made by the user (docs/WORKSPACE_VARIABLES_PLAN.md).
   A variable is a small recipe, never code: a START (any variable, or a PICK among variables by Shadbala or degree) plus STEPS:
   'lord' = the lord of the sign it stands in, 'nak' = its nakshatra lord, 'from' (n) = the nth house from it.
   AWV.list() / get(id) / save(def) / remove(id) / blank() / sanitize(raw) / describe(def) / collect(routine) / importDefs(defs)
   AWV.resolve('cv:xxxx', chart, profile) -> the same shape as AWP.resolve (planet, point or sign-only), used by AWP.
   Saved on this device (localStorage vax_workspace_vars_v1). Loops and deep chains are refused. Nothing runs until a variable is resolved. */
(function(root){
  'use strict';
  const KEY = 'vax_workspace_vars_v1', MAXV = 40, MAXSTEP = 6, MAXDEPTH = 4;
  const LORD = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
  const str = (x, n) => (typeof x === 'string' ? x : '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);
  const ORD = n => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
  const ID = /^cv:[a-z0-9]{4,12}$/;
  let mem = [], draft = null, depth = 0;

  function uid(){ return 'cv:' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3); }
  const okId = v => typeof v === 'string' && v.length < 40 && /^[A-Za-z0-9:_]+$/.test(v);
  function sanitize(raw){
    if (!raw || typeof raw !== 'object') return null;
    const d = { id: ID.test(raw.id || '') ? raw.id : uid(), name: str(raw.name, 40) || 'My variable', note: str(raw.note, 300), start: null, pick: null, steps: [], made: +raw.made > 0 ? +raw.made : Date.now() };
    if (raw.pick && typeof raw.pick === 'object'){
      const among = String(raw.pick.among || '').split(',').filter((v, i, a) => okId(v) && a.indexOf(v) === i).slice(0, 12);
      if (among.length) d.pick = { m: raw.pick.m === 'degree' ? 'degree' : 'shadbala', d: raw.pick.d === 'min' ? 'min' : 'max', among: among.join(',') };
    }
    if (!d.pick) d.start = okId(raw.start) ? raw.start : 'role:AK';
    (Array.isArray(raw.steps) ? raw.steps : []).slice(0, MAXSTEP).forEach(s => {
      if (!s || typeof s !== 'object') return;
      if (s.op === 'lord' || s.op === 'nak') d.steps.push({ op: s.op });
      else if (s.op === 'from'){ const n = Math.max(1, Math.min(12, Math.floor(+s.n || 1))); d.steps.push({ op: 'from', n }); }
    });
    return d;
  }
  function blank(name){ return sanitize({ name: name || 'My variable', start: 'role:DK', steps: [] }); }

  /* ---------- storage ---------- */
  function readAll(){ try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a.map(sanitize).filter(Boolean).slice(0, MAXV) : []; } catch (e) { return mem.slice(); } }
  function writeAll(a){ mem = a.slice(); try { localStorage.setItem(KEY, JSON.stringify(a)); return true; } catch (e) { return false; } }
  function list(){ return readAll(); }
  function get(id){ if (id === 'cv:__draft') return draft; return readAll().find(v => v.id === id) || null; }
  function save(v){ const d = sanitize(v); if (!d) return null; const a = readAll(), i = a.findIndex(x => x.id === d.id); if (i >= 0) a[i] = d; else a.unshift(d); writeAll(a.slice(0, MAXV)); return d; }
  function remove(id){ const a = readAll(), i = a.findIndex(x => x.id === id); if (i < 0) return null; const g = a.splice(i, 1)[0]; writeAll(a); return g; }
  function setDraft(v){ draft = v ? Object.assign(sanitize(v), { id: 'cv:__draft' }) : null; return draft; }
  const nameOf = id => { if (/^cv:/.test(id)){ const v = get(id); return v ? v.name : 'a removed variable'; } const a = root.AW && AW.SUBJECTS && AW.SUBJECTS.find(x => x[0] === id); return a ? a[1].replace(/ \(.*$/, '') : id; };

  /* ---------- plain-English description ---------- */
  function describe(d){
    let t;
    if (d.pick){ const names = d.pick.among.split(',').map(nameOf); t = (d.pick.m === 'shadbala' ? (d.pick.d === 'max' ? 'the strongest (by Shadbala)' : 'the weakest (by Shadbala)') : (d.pick.d === 'max' ? 'the planet furthest along its sign' : 'the planet least far along its sign')) + ' of ' + (names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0]); }
    else t = nameOf(d.start);
    d.steps.forEach(s => { t += ', then ' + (s.op === 'lord' ? 'the lord of the sign it stands in' : s.op === 'nak' ? 'its nakshatra lord' : s.n === 1 ? 'the same sign' : 'the ' + ORD(s.n) + ' house from it'); });
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  /* ---------- evaluation (uses AWP for everything built in) ---------- */
  function fail(base, msg){ return Object.assign(base, { err: msg }); }
  function resolve(id, c, pf){
    const d = get(id), base = { id, label: d ? d.name : 'My variable', group: 'My variables', kind: 'planet', planet: null, lon: null, sign: null, via: '', err: '' };
    if (!d) return fail(base, 'This variable was removed.');
    if (depth >= MAXDEPTH) return fail(base, 'This variable refers to other variables too many times, or to itself.');
    depth++;
    try {
      let cur;
      if (d.pick){
        const ids = d.pick.among.split(','), items = ids.map(i => ({ r: AWP.resolve(i, c, pf) })).filter(x => !x.r.err && x.r.planet);
        if (!items.length) return fail(base, 'None of the points in this pick can be worked out for this chart.');
        const S = c.shadbala && c.shadbala.planets;
        items.forEach(x => { x.v = d.pick.m === 'shadbala' ? (S && S[x.r.planet] ? (S[x.r.planet].percentOfRequired != null ? S[x.r.planet].percentOfRequired : S[x.r.planet].totalRupas / S[x.r.planet].requiredRupas * 100) : null) : (c.planets[x.r.planet] ? c.planets[x.r.planet].degInSign : null); });
        const ok = items.filter(x => x.v != null);
        if (!ok.length) return fail(base, d.pick.m === 'shadbala' ? 'Shadbala is not available for this chart (it needs a birth time), or the chosen points are not among the seven planets.' : 'Not available.');
        ok.sort((a, b) => d.pick.d === 'max' ? b.v - a.v : a.v - b.v); cur = ok[0].r;
      } else cur = AWP.resolve(d.start, c, pf);
      if (cur.err) return fail(base, cur.err);
      let via = describe(d) + ' = ';
      for (const s of d.steps){
        if (s.op === 'lord'){ if (cur.sign == null) return fail(base, 'This step needs something with a sign.'); const pl = LORD[cur.sign]; cur = AWP.point(c, pl) ? Object.assign({ kind: 'planet' }, AWP.point(c, pl)) : null; if (!cur) return fail(base, 'The lord is not available.'); }
        else if (s.op === 'nak'){ if (cur.lon == null) return fail(base, 'A nakshatra lord needs a point with a degree; a sign-only point has none.'); const pl = getNakshatra(cur.lon).lord; cur = Object.assign({ kind: 'planet' }, AWP.point(c, pl) || {}); if (!cur.planet) return fail(base, 'The nakshatra lord is not available.'); }
        else if (s.op === 'from'){ if (cur.sign == null) return fail(base, 'This step needs something with a sign.'); cur = { kind: 'sign', planet: null, lon: null, sign: (cur.sign + s.n - 1) % 12 }; }
      }
      const out = Object.assign(base, { kind: cur.kind || 'planet', planet: cur.planet || null, lon: cur.lon != null ? cur.lon : null, sign: cur.sign });
      out.via = via + (out.planet || (AWP.SIGN[out.sign] + ' (a sign, no degree)'));
      return out;
    } catch (e) { return fail(base, 'This variable could not be worked out for this chart.'); }
    finally { depth--; }
  }

  /* ---------- sharing: a routine carries the variables it uses ---------- */
  function idsIn(routine){
    const found = {}; (routine.steps || []).forEach(s => { const o = s.o || {}; [o.subject, o.planet].concat(String(o.subjects || '').split(',')).forEach(v => { if (v && /^cv:/.test(v)) found[v] = 1; }); });
    return Object.keys(found);
  }
  function collect(routine){
    const out = [], seen = {};
    (function add(ids){ ids.forEach(id => { if (seen[id] || out.length >= 12) return; seen[id] = 1; const v = get(id); if (!v) return; out.push(v); add([v.start].concat(v.pick ? v.pick.among.split(',') : []).filter(x => x && /^cv:/.test(x))); }); })(idsIn(routine));
    return out;
  }
  const remapStr = (s, map) => String(s || '').split(',').map(x => map[x] || x).join(',');
  function importDefs(defs){
    const map = {}, clean = (Array.isArray(defs) ? defs : []).slice(0, 12).map(sanitize).filter(Boolean);
    const olds = (Array.isArray(defs) ? defs : []).slice(0, 12).map(d => d && d.id);
    clean.forEach((d, i) => { map[olds[i]] = uid(); });
    clean.forEach((d, i) => { const n = Object.assign({}, d, { id: map[olds[i]], start: d.start ? remapStr(d.start, map) : null, pick: d.pick ? Object.assign({}, d.pick, { among: remapStr(d.pick.among, map) }) : null }); save(n); });
    return map;
  }
  function remapRoutine(r, map){
    (r.steps || []).forEach(s => { const o = s.o || {}; ['subject', 'planet', 'subjects'].forEach(k => { if (o[k]) o[k] = remapStr(o[k], map); }); });
    return r;
  }

  root.AWV = { KEY, MAXV, MAXSTEP, uid, sanitize, blank, list, get, save, remove, setDraft, describe, resolve, collect, importDefs, remapRoutine, nameOf, ID };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.AWV;
})(typeof window !== 'undefined' ? window : globalThis);

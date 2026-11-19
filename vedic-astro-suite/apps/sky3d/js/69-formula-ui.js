/* Formula Maker UI (js/69, global FMU). Tools menu > Formula maker (#fmBtn): full-screen sheet with tabs Build / Result / Library / Saved, a rule editor and an operand picker (bottom sheets),
   check on a person / the sky, Find dates (scan), share (code, link, text card, JSON, PNG card), import, and #f= links. All sheets are created here. Prefix fm-. See docs/FORMULA_MAKER_PLAN.md. */
const FMU = (() => {
  'use strict';
  const $ = id => document.getElementById(id), esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const gl = n => (PLANET_GLYPHS[n] || '') + '︎', sy = i => SIGNS[i].symbol + '︎';
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], KEY = 'sky3d_fm_cur';
  const REL_GROUPS = [['Where it is', ['in_sign', 'in_nak', 'in_pada', 'in_house', 'sign_type', 'deg_range', 'lon_range', 'near_lon', 'varga_sign']], ['Between two things', ['same_sign', 'conj', 'aspect', 'angle', 'same_nak', 'rules', 'dispositor', 'exchange']],
    ['Condition of a planet', ['retro', 'combust', 'dignity', 'vargottama', 'gandanta', 'nak_lord', 'sign_lord']]];
  const blank = () => FM.formula('My formula', '', [], 'all', 7);
  const S = { f: blank(), tab: 'build', lib: { cat: 'All', q: '' }, tgt: 'person', person: '', other: '', date: '', edit: null, pick: null, ofSel: 'C', msg: '', scan: { y0: new Date().getFullYear(), y1: new Date().getFullYear() + 10, mode: 'sky', busy: false, prog: 0, cancel: false, res: null }, open: false, imp: '' };
  try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j) { const f = FM.normalize(j.f); if (f) S.f = f; ['tgt', 'person', 'other', 'date'].forEach(k => { if (typeof j[k] === 'string') S[k] = j[k]; }); } } catch (e) { /* ignore */ }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify({ f: S.f, tgt: S.tgt, person: S.person, other: S.other, date: S.date })); } catch (e) { /* ignore */ } };
  const nowJD = () => Date.now() / 86400000 + 2440587.5;
  const fd = jd => { const d = jdToDate(jd); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + yearLabel(d.getFullYear()); };
  function dur(days) { if (days < 1 / 24) return Math.max(1, Math.round(days * 1440)) + ' min'; if (days < 2) return Math.round(days * 24) + ' h'; if (days < 60) return Math.round(days) + ' days'; if (days < 700) return (days / 30.44).toFixed(1).replace(/\.0$/, '') + ' months'; return (days / 365.25).toFixed(1).replace(/\.0$/, '') + ' years'; }
  const toast = t => { S.msg = t; const el = $('fmToast'); if (el) { el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2600); } };

  /* ---------- people & targets ---------- */
  const pkey = p => [p.name, p.dob, p.tob].join('|');
  function people() {
    let a = []; try { a = loadNatalProfiles().filter(isValidProfile); } catch (e) { a = []; }
    if (isValidProfile(activeNatalProfile) && !a.some(p => pkey(p) === pkey(activeNatalProfile))) a.unshift(activeNatalProfile);
    return a;
  }
  const personOf = k => { const a = people(); return k ? a.find(p => pkey(p) === k) || null : null; };
  const defPerson = () => { if (!personOf(S.person)) { const p = isValidProfile(activeNatalProfile) ? activeNatalProfile : people()[0]; S.person = p ? pkey(p) : ''; } };
  function ctx() {
    defPerson(); const per = personOf(S.person), oth = personOf(S.other); let target;
    if (S.tgt === 'person') { if (!per) return { err: 'Add a person first (Profile tool) to check a birth chart, or choose the sky.' }; target = { type: 'person', p: per, jd: currentJD }; }
    else if (S.tgt === 'sky3d') target = { type: 'sky', jd: currentJD, label: 'Sky on ' + formatFullDate(currentJD) };
    else if (S.tgt === 'now') target = { type: 'sky', jd: nowJD(), label: 'Sky right now' };
    else { const d = parseDob(S.date); if (!d) return { err: 'Pick a date for the sky.' }; target = { type: 'sky', jd: toJulianDay(d[0], d[1], d[2], 12, 0, 0), label: 'Sky on ' + S.date }; }
    try { return { X: FM.makeCtx(target, { person: per, other: oth, scheme: S.f.scheme }), target, per }; } catch (e) { return { err: 'Could not build the chart: ' + e.message }; }
  }

  /* ---------- tree helpers ---------- */
  const at = path => path.reduce((n, i) => n.items[i], S.f.root);
  const parent = path => at(path.slice(0, -1));
  const newRule = () => FM.rule([], 'in_sign', null, {});
  const isG = n => n && n.g;
  const cnt = () => FM.countRules(S.f.root);
  const pstr = p => p.join('.'), pparse = s => s === '' ? [] : s.split('.').map(Number);

  /* ---------- rendering: build ---------- */
  const seg = (items, cur, a, extra) => `<div class="fm-seg" role="group">${items.map(([v, l]) => `<button type="button" class="${String(cur) === String(v) ? 'on' : ''}" data-a="${a}" data-v="${v}" ${extra || ''}>${l}</button>`).join('')}</div>`;
  function groupHtml(g, path) {
    const p = pstr(path), top = path.length === 0;
    let h = `<div class="fm-g ${top ? 'top' : ''}"><div class="fm-gh">${seg([['all', 'All'], ['any', 'Any'], ['none', 'None'], ['atleast', 'At least']], g.g, 'gt', `data-p="${p}"`)}`;
    if (g.g === 'atleast') h += `<span class="fm-step"><button type="button" data-a="gn" data-d="-1" data-p="${p}" aria-label="Fewer">−</button><b>${g.n || 1}</b><button type="button" data-a="gn" data-d="1" data-p="${p}" aria-label="More">+</button></span>`;
    h += `<span class="fm-gl">of these must be true</span>`;
    if (!top) h += `<button type="button" class="fm-x" data-a="del" data-p="${p}" aria-label="Remove group">✕</button>`;
    h += '</div>';
    g.items.forEach((n, i) => { const q = path.concat(i); h += isG(n) ? groupHtml(n, q) : ruleHtml(n, q); });
    h += `<div class="fm-add"><button type="button" class="fm-btn" data-a="addr" data-p="${p}">＋ Rule</button><button type="button" class="fm-btn ghost" data-a="addg" data-p="${p}">＋ Group</button></div></div>`;
    return h;
  }
  function ruleHtml(r, path) {
    const p = pstr(path), ok = r.a.length > 0 && (FM.REL[r.r].bin !== 1 || r.b.length > 0);
    return `<div class="fm-r ${ok ? '' : 'warn'}"><button type="button" class="fm-rt" data-a="edit" data-p="${p}"><b>${esc(FM.sentence(r))}</b>${ok ? '' : '<small>Tap to finish this rule</small>'}</button>
      <div class="fm-ra"><button type="button" data-a="neg" data-p="${p}" class="${r.neg ? 'on' : ''}" aria-pressed="${!!r.neg}">NOT</button><button type="button" data-a="dup" data-p="${p}" aria-label="Duplicate rule">⧉</button><button type="button" data-a="del" data-p="${p}" aria-label="Delete rule">✕</button></div></div>`;
  }
  function renderBuild() {
    const f = S.f, c = ctx(); let badge = '';
    if (!c.err) { try { const n = FM.evaluate(f, c.X); badge = cnt() ? verdict(n.t, true) : ''; } catch (e) { badge = ''; } }
    return `<div class="fm-card"><label class="fm-lab">Name<input id="fmName" class="fm-in" value="${esc(f.name)}" maxlength="80" autocomplete="off"></label>
      <label class="fm-lab">What it means (optional)<input id="fmAbout" class="fm-in" value="${esc(f.about)}" maxlength="400" autocomplete="off"></label>
      <div class="fm-row"><span class="fm-lab">Karaka scheme</span>${seg([[7, '7 karakas'], [8, '8 (Rahu + Pitri)']], f.scheme, 'sch')}</div>
      <div class="fm-bar">${badge}<span class="fm-sp"></span><button type="button" class="fm-btn" data-a="save">Save</button><button type="button" class="fm-btn" data-a="share">Share</button><button type="button" class="fm-btn ghost" data-a="new">New</button></div></div>
      ${groupHtml(f.root, [])}
      <p class="fm-hint">A formula is a list of rules. <b>Tap a rule</b> to change it. Rules about a person's Lagna, houses, Arudha or Hora need a birth time and place; if a rule can't be decided it shows <b>?</b>, never a guess.</p>
      ${cnt() ? '<button type="button" class="fm-go" data-a="tores">Check this formula ▸</button>' : ''}`;
  }
  function verdict(t, small) {
    const k = t === true ? 'yes' : t === false ? 'no' : 'unk', tx = t === true ? '✓ True' : t === false ? '✗ False' : '? Unknown';
    return `<span class="fm-v ${k} ${small ? 'sm' : ''}">${tx}</span>`;
  }

  /* ---------- rendering: result ---------- */
  function treeHtml(n) {
    const k = n.t === true ? 'yes' : n.t === false ? 'no' : 'unk', ic = n.t === true ? '✓' : n.t === false ? '✗' : '?';
    if (n.kids) return `<div class="fm-n g ${k}"><div class="fm-nh"><i>${ic}</i><b>${esc(n.text)}</b><small>${n.count}/${n.kids.length}</small></div><div class="fm-kids">${n.kids.map(treeHtml).join('')}</div></div>`;
    return `<div class="fm-n ${k}"><div class="fm-nh"><i>${ic}</i><b>${esc(n.text)}</b></div>${n.detail ? `<div class="fm-nd">${esc(n.detail)}</div>` : ''}</div>`;
  }
  function pointsHtml(C) {
    const rows = FM.points(C), groups = {}; rows.forEach(r => { (groups[r.grp] = groups[r.grp] || []).push(r); });
    return Object.keys(groups).map(g => `<h5>${g}</h5><div class="fm-pts">${groups[g].map(r => `<div class="fm-pt"><b>${esc(r.name)}</b><span>${r.sign == null ? '' : sy(r.sign) + ' ' + (r.lon != null ? FM.dms(r.lon) + ' ' : '') + SIGNS[r.sign].name}</span></div>`).join('')}</div>`).join('');
  }
  const pplSel = (id, cur, none) => `<select id="${id}" class="fm-in">${none ? `<option value="">${none}</option>` : ''}${people().map(p => `<option value="${esc(pkey(p))}" ${pkey(p) === cur ? 'selected' : ''}>${esc(p.name || 'Unnamed')} · ${esc(p.dob)}</option>`).join('')}</select>`;
  function scanNote(c) {
    const sc = S.scan; let h = '';
    if (sc.busy) h = `<div class="fm-prog"><div><i style="width:${Math.round(sc.prog * 100)}%"></i></div><button type="button" class="fm-btn" data-a="scancancel">Stop</button></div>`;
    else if (sc.res) {
      const r = sc.res;
      if (r.error) h = `<div class="fm-note bad">${esc(r.error)}</div>`;
      else {
        const w = r.windows || [];
        h = `<p class="fm-sum"><b>${w.length}</b>${r.capped ? '+' : ''} time${w.length === 1 ? '' : 's'} found${r.cancelled ? ' (stopped early)' : ''}. Tap one to open that day in the 3D sky.</p>` +
          w.map((x, i) => `<button type="button" class="fm-w" data-a="goto" data-i="${i}"><b>${fd(x.from)}${x.open ? ' →' : x.to - x.from > 0.5 ? ' → ' + fd(x.to) : ''}</b><span>${x.open ? 'range end' : dur(x.to - x.from)}</span></button>`).join('');
        if (!w.length) h += `<div class="fm-note">Never true in that range${r.why ? '. ' + esc(r.why) : '.'}</div>`;
        else if (r.why) h += `<div class="fm-note">${esc(r.why)}</div>`;
      }
    }
    return h;
  }
  function renderResult() {
    const c = ctx(), sc = S.scan; let h = `<div class="fm-card"><div class="fm-lab">Check on</div>${seg([['person', 'Birth chart'], ['sky3d', '3D date'], ['now', 'Now'], ['date', 'A date']], S.tgt, 'tgt')}`;
    h += `<label class="fm-lab">Person (their birth chart, and the “Person” part of transit formulas)${pplSel('fmPerson', S.person)}</label>`;
    if (S.tgt === 'date') h += `<label class="fm-lab">Date<input type="date" id="fmDate" class="fm-in" value="${esc(S.date)}"></label>`;
    h += `<label class="fm-lab">Second person (optional)${pplSel('fmOther', S.other, 'None')}</label></div>`;
    if (c.err) return h + `<div class="fm-note bad">${esc(c.err)}</div>`;
    const n = FM.evaluate(S.f, c.X);
    h += `<div class="fm-card"><div class="fm-top">${verdict(n.t)}<div><b>${esc(S.f.name)}</b><small>${esc(c.X.C.label || c.target.label || '')}</small></div></div>${cnt() ? treeHtml(n) : '<p class="fm-hint">Add some rules in Build first.</p>'}
      <div class="fm-bar"><button type="button" class="fm-btn" data-a="open3d">Open this moment in 3D</button><button type="button" class="fm-btn" data-a="share">Share</button></div></div>`;
    h += `<div class="fm-card"><h4>Find dates</h4><p class="fm-hint">List every time this formula is true. <b>Sky</b> = the planets in the sky (transits). <b>Birth charts</b> = which birth dates match (uses noon; Lagna rules stay unknown).</p>
      ${seg([['sky', 'Sky (transits)'], ['birth', 'Birth dates']], sc.mode, 'smode')}
      <div class="fm-in2"><label>From year<input id="fmY0" type="number" class="fm-in" value="${sc.y0}"></label><span>to</span><label>To year<input id="fmY1" type="number" class="fm-in" value="${sc.y1}"></label></div>
      <div class="fm-pre"><button type="button" data-a="pre" data-v="n10">Next 10 yrs</button><button type="button" data-a="pre" data-v="n30">Next 30 yrs</button><button type="button" data-a="pre" data-v="p30">Past 30 yrs</button><button type="button" data-a="pre" data-v="b">Birth years 1950–2010</button></div>
      <button type="button" class="fm-go" data-a="scan" ${sc.busy || !cnt() ? 'disabled' : ''}>${sc.busy ? 'Searching…' : 'Find dates ▸'}</button>${scanNote(c)}</div>
      <div class="fm-card"><h4>Chart points</h4><p class="fm-hint">Everything you can use in a rule, for this chart.</p>${pointsHtml(c.X.C)}</div>`;
    return h;
  }

  /* ---------- rendering: library & saved ---------- */
  function renderLib() {
    const L = S.lib, cats = ['All'].concat(FMX.cats()), q = L.q.toLowerCase();
    const list = FMX.LIB.filter(f => (L.cat === 'All' || f.cat === L.cat) && (!q || (f.name + ' ' + f.about).toLowerCase().includes(q)));
    return `<div class="fm-card"><input id="fmQ" class="fm-in" type="search" placeholder="Search ${FMX.LIB.length} formulas" value="${esc(L.q)}"><div class="fm-chips">${cats.map(c => `<button type="button" class="${L.cat === c ? 'on' : ''}" data-a="cat" data-v="${c}">${c}</button>`).join('')}</div></div>` +
      list.map(f => `<div class="fm-lc"><b>${esc(f.name)}</b><small>${esc(f.cat)}</small><p>${esc(f.about)}</p><div class="fm-bar"><button type="button" class="fm-btn" data-a="use" data-id="${f.id}">Use</button><button type="button" class="fm-btn" data-a="usechk" data-id="${f.id}">Check now</button></div></div>`).join('') + (list.length ? '' : '<p class="fm-hint">Nothing matches.</p>');
  }
  function renderSaved() {
    const a = FMX.loadAll();
    return `<div class="fm-card"><h4>Import a formula</h4><textarea id="fmImp" class="fm-ta" rows="3" placeholder="Paste a share code (VF1…), a link or formula JSON">${esc(S.imp)}</textarea><div class="fm-bar"><button type="button" class="fm-btn" data-a="import">Import</button><button type="button" class="fm-btn" data-a="exall">Export all</button><button type="button" class="fm-btn" data-a="imfile">Import backup</button></div><input type="file" id="fmFile" accept="application/json,.json" hidden></div>` +
      (a.length ? a.map(f => `<div class="fm-lc"><b>${esc(f.name)}</b><small>${FM.countRules(f.root)} rule${FM.countRules(f.root) === 1 ? '' : 's'}</small><p>${esc(f.about)}</p><div class="fm-bar"><button type="button" class="fm-btn" data-a="open" data-id="${f.id}">Open</button><button type="button" class="fm-btn" data-a="sdup" data-id="${f.id}">Duplicate</button><button type="button" class="fm-btn" data-a="sshare" data-id="${f.id}">Share</button><button type="button" class="fm-x" data-a="sdel" data-id="${f.id}" aria-label="Delete">✕</button></div></div>`).join('') : '<p class="fm-hint">Nothing saved yet. Build a formula and tap Save.</p>');
  }
  function render() {
    const b = $('fmBody'); if (!b) return; const top = b.scrollTop;
    b.innerHTML = S.tab === 'build' ? renderBuild() : S.tab === 'result' ? renderResult() : S.tab === 'library' ? renderLib() : renderSaved();
    document.querySelectorAll('#fmTabs button').forEach(t => { const on = t.dataset.v === S.tab; t.classList.toggle('on', on); t.setAttribute('aria-selected', String(on)); });
    b.scrollTop = top;
  }

  /* ---------- rule editor ---------- */
  const chips = (arr, label, a, cur, multi) => `<div class="fm-chips sm">${arr.map(([v, l]) => `<button type="button" class="${(multi ? (cur || []).includes(v) : cur === v) ? 'on' : ''}" data-a="${a}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const num = (k, v, lab, step) => `<label class="fm-lab sm">${lab}<input class="fm-in" type="number" step="${step || 1}" data-a="pn" data-k="${k}" value="${v}"></label>`;
  function paramsHtml(r) {
    const rel = FM.REL[r.r], p = r.p, h = [];
    rel.ui.forEach(u => {
      if (u === 'signs') h.push('<div class="fm-lab">Signs</div>' + `<div class="fm-sg">${SIGNS.map((s, i) => `<button type="button" class="${(p.signs || []).includes(i) ? 'on' : ''}" data-a="pt" data-k="signs" data-v="${i}" aria-label="${s.name}"><span>${sy(i)}</span><i>${s.name.slice(0, 3)}</i></button>`).join('')}</div>`);
      else if (u === 'naks') h.push(`<label class="fm-lab">Add nakshatra<select class="fm-in" data-a="nk"><option value="">Choose…</option>${NAKSHATRAS.map((n, i) => `<option value="${i}">${n}</option>`).join('')}</select></label>` + chips((p.naks || []).map(i => [i, NAKSHATRAS[i] + ' ✕']), '', 'pt', null, false).replace(/data-a="pt"/g, 'data-a="pt" data-k="naks"').replace(/class=""/g, 'class="on"'));
      else if (u === 'padas') h.push('<div class="fm-lab">Pada</div>' + chips([1, 2, 3, 4].map(i => [i, i]), '', 'ptk', p.padas, true).replace(/data-a="ptk"/g, 'data-a="pt" data-k="padas"'));
      else if (u === 'houses') h.push('<div class="fm-lab">Houses</div>' + chips(Array.from({ length: 12 }, (_, i) => [i + 1, i + 1]), '', 'pt', p.houses, true).replace(/data-a="pt"/g, 'data-a="pt" data-k="houses"'));
      else if (u === 'only') h.push('<div class="fm-lab">Only these aspects (empty = any)</div>' + chips([3, 4, 5, 7, 8, 9, 10].map(i => [i, ord(i)]), '', 'pt', p.only, true).replace(/data-a="pt"/g, 'data-a="pt" data-k="only"'));
      else if (u === 'dir') h.push('<div class="fm-lab">Direction</div>' + seg([['either', 'Either way'], ['a>b', 'A → B'], ['b>a', 'B → A'], ['mutual', 'Mutual']], p.dir || 'either', 'pd'));
      else if (u === 'on') h.push(seg([[1, r.r === 'retro' ? 'Retrograde' : 'Yes'], [0, r.r === 'retro' ? 'Direct' : 'No']], p.on === false ? 0 : 1, 'pon'));
      else if (u === 'digs') h.push('<div class="fm-lab">Dignity</div>' + chips(FM.DIGS.map(d => [d, d]), '', 'pt', p.digs, true).replace(/data-a="pt"/g, 'data-a="pt" data-k="digs"'));
      else if (u === 'planets') h.push('<div class="fm-lab">Planets</div>' + chips(FM.P9.map(n => [n, gl(n) + ' ' + n]), '', 'pt', p.planets, true).replace(/data-a="pt"/g, 'data-a="pt" data-k="planets"'));
      else if (u === 'elem') h.push('<div class="fm-lab">Element</div>' + chips(FM.ELEM.map((n, i) => [i, n]), '', 'pt', p.elem, true).replace(/data-a="pt"/g, 'data-a="pt" data-k="elem"'));
      else if (u === 'mode') h.push('<div class="fm-lab">Quality</div>' + chips(FM.MODE.map((n, i) => [i, n]), '', 'pt', p.mode, true).replace(/data-a="pt"/g, 'data-a="pt" data-k="mode"'));
      else if (u === 'varga') h.push(`<label class="fm-lab">Divisional chart<select class="fm-in" data-a="pv">${VG.keys.map(k => `<option value="${k}" ${(p.varga || 'D9') === k ? 'selected' : ''}>${k} · ${esc(VG.name(k))}</option>`).join('')}</select></label>`);
      else if (u === 'orb') h.push(num('orb', p.orb == null ? (r.r === 'conj' ? 10 : r.r === 'near_lon' ? 3 : 6) : p.orb, 'Orb (degrees)', 0.5));
      else if (u === 'angle') h.push(`<label class="fm-lab sm">Angle<select class="fm-in" data-a="pa">${[0, 30, 45, 60, 90, 120, 150, 180].map(a => `<option value="${a}" ${(p.angle || 0) === a ? 'selected' : ''}>${a}°</option>`).join('')}</select></label>`);
      else if (u === 'lo') h.push(num('lo', p.lo || 0, r.r === 'deg_range' ? 'From degree (0–30)' : 'From longitude', 0.01));
      else if (u === 'hi') h.push(num('hi', p.hi == null ? (r.r === 'deg_range' ? 30 : 360) : p.hi, r.r === 'deg_range' ? 'To degree (0–30)' : 'To longitude', 0.01));
      else if (u === 'lon') h.push(num('lon', p.lon || 0, 'Zodiac longitude (0–360, sidereal)', 0.01));
    });
    return h.join('');
  }
  const ord = FM.ord;
  const opList = (r, side) => { const l = r[side], q = side === 'a' ? r.q : r.bq;
    return `<div class="fm-ops">${l.map((o, i) => `<span class="fm-op">${esc(FM.opName(o))}<button type="button" data-a="opx" data-side="${side}" data-i="${i}" aria-label="Remove">✕</button></span>`).join('')}<button type="button" class="fm-op add" data-a="pick" data-side="${side}">＋ ${l.length ? 'Add more' : 'Choose'}</button></div>` +
      (l.length > 1 ? `<div class="fm-row"><span class="fm-lab sm">Needs</span>${seg([['any', 'Any one'], ['all', 'All of them']], q, 'q' + side)}</div>` : ''); };
  function renderEdit() {
    const r = at(S.edit), rel = FM.REL[r.r], bn = rel.bin;
    const relSel = REL_GROUPS.map(([g, ids]) => `<optgroup label="${g}">${ids.map(id => `<option value="${id}" ${r.r === id ? 'selected' : ''}>${esc(FM.REL[id].label)}</option>`).join('')}</optgroup>`).join('');
    return `<div class="fm-pc"><header><b>Edit rule</b><button type="button" data-a="editdone" class="fm-done">Done</button></header><div class="fm-pb" id="fmEditBody">
      <p class="fm-pre-s">${esc(FM.sentence(r))}</p>
      <div class="fm-lab">First ${bn === 1 ? 'thing (A)' : 'subject'}</div>${opList(r, 'a')}
      <label class="fm-lab">Relation<select class="fm-in" data-a="rel">${relSel}</select></label>
      ${bn === 1 ? `<div class="fm-lab">Second thing (B)</div>${opList(r, 'b')}` : bn === 2 ? `<div class="fm-lab">…counted from (optional, default Lagna)</div>${opList(r, 'b')}` : ''}
      ${paramsHtml(r)}
      <div class="fm-row"><span class="fm-lab sm">Reverse the answer</span>${seg([[0, 'Normal'], [1, 'NOT']], r.neg ? 1 : 0, 'rneg')}</div></div></div>`;
  }
  function pickCatalog() {
    const roles = S.f.scheme === 8 ? FM.K8 : FM.K7;
    return [['Planets', FM.P9.map(n => ({ k: 'planet', v: n, t: gl(n) + ' ' + n }))], ['Karakas (by degree)', roles.map(k => ({ k: 'role', v: k, t: k + ' · ' + FM.ROLE_NAME[k] }))],
      ['Points', Object.keys(FM.POINTS).map(k => ({ k: 'point', v: k, t: FM.POINTS[k] }))], ['House lords', Array.from({ length: 12 }, (_, i) => ({ k: 'lord', v: i + 1, t: 'Lord of ' + ord(i + 1) }))],
      ['Houses (as a sign)', Array.from({ length: 12 }, (_, i) => ({ k: 'house', v: i + 1, t: ord(i + 1) + ' house' }))], ['Arudha padas', Array.from({ length: 12 }, (_, i) => ({ k: 'arudha', v: i + 1, t: i === 0 ? 'AL · Arudha Lagna' : i === 11 ? 'UL · Upapada (A12)' : 'A' + (i + 1) }))],
      ['Signs', SIGNS.map((s, i) => ({ k: 'sign', v: i, t: sy(i) + ' ' + s.name }))]];
  }
  function renderPick() {
    const r = at(S.edit), side = S.pick, list = r[side], of = S.ofSel;
    const has = (k, v) => list.some(o => o.k === k && String(o.v) === String(v) && ((o.of || 'C') === of || k === 'sign'));
    return `<div class="fm-pc"><header><b>Choose ${side === 'a' ? 'first' : 'second'} thing</b><button type="button" data-a="pickdone" class="fm-done">Done</button></header><div class="fm-pb" id="fmPickBody">
      <div class="fm-lab">Take it from</div>${seg([['C', 'This chart'], ['N', 'Person (birth)'], ['S', 'Sky moment'], ['P', '2nd person']], of, 'of')}
      <p class="fm-hint">“This chart” = whatever you check the formula on. Use Person + Sky moment for transit formulas, like Saturn over your Moon.</p>
      ${pickCatalog().map(([g, items]) => `<h5>${g}</h5><div class="fm-chips pk">${items.map(it => `<button type="button" class="${has(it.k, it.v) ? 'on' : ''}" data-a="pk" data-k="${it.k}" data-v="${it.v}">${esc(it.t)}</button>`).join('')}</div>`).join('')}</div></div>`;
  }
  const layer = (id, html, on) => { const e = $(id); if (!e) return; e.hidden = !on; if (on) { const b = e.querySelector('.fm-pb'), top = b ? b.scrollTop : 0; e.innerHTML = html; const nb = e.querySelector('.fm-pb'); if (nb) nb.scrollTop = top; } };
  const refreshLayers = () => { if (S.share) layer('fmEdit', renderShare(), true); else layer('fmEdit', S.edit ? renderEdit() : '', !!S.edit); layer('fmPick', S.pick && S.edit ? renderPick() : '', !!(S.pick && S.edit)); };

  /* ---------- share ---------- */
  function renderShare() {
    const f = S.share, code = FMX.encode(f);
    return `<div class="fm-pc"><header><b>Share “${esc(f.name)}”</b><button type="button" data-a="sharedone" class="fm-done">Done</button></header><div class="fm-pb">
      <pre class="fm-card-t">${esc(FM.describe(f))}</pre>
      <label class="fm-lab">Share code<textarea class="fm-ta" rows="3" readonly id="fmCode">${esc(code)}</textarea></label>
      <div class="fm-grid"><button type="button" class="fm-btn pri" data-a="sh-native">Share…</button><button type="button" class="fm-btn" data-a="sh-link">Link to clipboard</button><button type="button" class="fm-btn" data-a="sh-code">Code to clipboard</button><button type="button" class="fm-btn" data-a="sh-text">Text card to clipboard</button><button type="button" class="fm-btn" data-a="sh-json">Download JSON</button><button type="button" class="fm-btn" data-a="sh-png">Save picture</button></div>
      <p class="fm-hint">Anyone who opens the link gets this formula in their own Formula Maker. Nothing about you or any birth data is inside it, only the rules.</p></div></div>`;
  }
  function openShare(f) { S.share = f; layer('fmEdit', renderShare(), true); }
  function clip(t, ok) { const done = () => toast(ok || 'Done'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, () => fb(t, done)); else fb(t, done); }
  function fb(t, done) { const a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Could not use the clipboard'); } a.remove(); }
  const fileName = f => (f.name || 'formula').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'formula';
  function download(name, text, type) { const u = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }
  function png(f) {
    const lines = FM.describe(f).split('\n'), W = 1080, pad = 60, cv = document.createElement('canvas'), g = cv.getContext('2d'), wrap = [];
    g.font = '30px system-ui,sans-serif';
    lines.forEach((ln, i) => { const ind = (ln.match(/^ */) || [''])[0].length * 14, words = ln.trim().split(/\s+/); let cur = ''; words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > W - pad * 2 - ind && cur) { wrap.push([cur, ind, i]); cur = w; } else cur = t; }); wrap.push([cur, ind, i]); });
    const H = Math.max(700, 220 + wrap.length * 44 + 140); cv.width = W; cv.height = H;
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#0d1424'); gr.addColorStop(1, '#1b1630'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(212,162,74,.6)'; g.lineWidth = 3; g.strokeRect(24, 24, W - 48, H - 48);
    g.fillStyle = '#f6d775'; g.font = '700 54px Georgia,serif'; g.fillText(f.name.slice(0, 34), pad, 120);
    g.font = '30px system-ui,sans-serif'; let y = 190; wrap.forEach(([t, ind, i]) => { if (i === 0) return; g.fillStyle = /^(ALL|ANY|NONE|AT LEAST)/.test(t.trim()) ? '#f6dc8a' : '#e8ecf4'; g.fillText(t, pad + ind, y); y += 44; });
    g.fillStyle = '#9aa5b8'; g.font = '26px system-ui,sans-serif'; g.fillText('Vedic Astro Suite · 3D Sky Formula Maker', pad, H - 70); g.fillText(FMX.encode(f).slice(0, 52) + '…', pad, H - 36);
    cv.toBlob(b => { if (!b) return toast('Could not make the picture'); const u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = fileName(f) + '.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); toast('Picture saved'); });
  }

  /* ---------- scan ---------- */
  async function runScan() {
    const sc = S.scan, c = ctx(); defPerson(); const per = personOf(S.person);
    const j0 = toJulianDay(Math.min(sc.y0, sc.y1), 1, 1, 0, 0, 0), j1 = toJulianDay(Math.max(sc.y0, sc.y1), 12, 31, 23, 59, 0);
    sc.busy = true; sc.prog = 0; sc.cancel = false; sc.res = null; render();
    const r = await FM.scan(S.f, { mode: sc.mode, j0, j1, person: per, other: personOf(S.other), loc: per, onProgress: p => { sc.prog = p; const el = document.querySelector('.fm-prog i'); if (el) el.style.width = Math.round(p * 100) + '%'; }, cancel: () => sc.cancel });
    sc.busy = false;
    if (!r.error && !(r.windows || []).length) { try { const C = sc.mode === 'birth' ? FM.chart({ jd: (j0 + j1) / 2, scheme: S.f.scheme, birth: true }) : FM.skyChart((j0 + j1) / 2, { loc: per, base: per ? FM.birthChart(per, S.f.scheme).base : null, scheme: S.f.scheme }); const n = FM.evaluate(S.f, { C, S: C, N: FM.birthChart(per, S.f.scheme), P: FM.birthChart(personOf(S.other), S.f.scheme) }); if (n.t === null) r.why = 'Some rules cannot be decided here (they need a person, a Lagna or a place).'; } catch (e) { /* ignore */ } }
    sc.res = r; sc.last = { j0, j1 }; render();
  }

  /* ---------- events ---------- */
  function setTab(t) { S.tab = t; render(); const b = $('fmBody'); if (b) b.scrollTop = 0; }
  function onClick(e) {
    const t = e.target.closest('[data-a]'); if (!t) return; const a = t.dataset.a, p = t.dataset.p != null ? pparse(t.dataset.p) : null, v = t.dataset.v;
    const pop = !!t.closest('#fmEdit, #fmPick');
    switch (a) {
      case 'tab': return setTab(v);
      case 'gt': { const g = at(p); g.g = v; if (v === 'atleast' && !g.n) g.n = 1; persist(); return render(); }
      case 'gn': { const g = at(p); g.n = Math.max(1, Math.min(20, (g.n || 1) + (+t.dataset.d))); persist(); return render(); }
      case 'addr': { const g = at(p); g.items.push(newRule()); persist(); S.edit = p.concat(g.items.length - 1); render(); return refreshLayers(); }
      case 'addg': { at(p).items.push({ g: 'any', n: 1, items: [] }); persist(); return render(); }
      case 'del': { const par = parent(p); par.items.splice(p[p.length - 1], 1); persist(); return render(); }
      case 'dup': { const par = parent(p), i = p[p.length - 1]; par.items.splice(i + 1, 0, JSON.parse(JSON.stringify(par.items[i]))); persist(); return render(); }
      case 'neg': { const r = at(p); r.neg = !r.neg; persist(); return render(); }
      case 'edit': S.edit = p; S.pick = null; return refreshLayers();
      case 'editdone': S.edit = null; S.pick = null; persist(); render(); return refreshLayers();
      case 'sch': S.f.scheme = +v; persist(); return render();
      case 'save': { S.f.name = ($('fmName') || {}).value || S.f.name; if (FMX.save(S.f)) toast('Saved'); else toast('Could not save'); return; }
      case 'new': S.f = blank(); persist(); return render();
      case 'tores': return setTab('result');
      case 'share': return openShare(S.f);
      case 'sharedone': S.share = null; return refreshLayers();
      case 'sh-native': { const f = S.share, d = { title: f.name, text: FM.describe(f), url: FMX.link(f) }; if (navigator.share) navigator.share(d).catch(() => { }); else clip(FMX.card(f), 'Card text on clipboard'); return; }
      case 'sh-link': return clip(FMX.link(S.share), 'Link on clipboard');
      case 'sh-code': return clip(FMX.encode(S.share), 'Code on clipboard');
      case 'sh-text': return clip(FMX.card(S.share), 'Card text on clipboard');
      case 'sh-json': return download(fileName(S.share) + '.formula.json', JSON.stringify({ app: 'vedic-astro-suite', kind: 'formula', v: 1, formula: S.share }, null, 2), 'application/json');
      case 'sh-png': return png(S.share);
      /* rule editor */
      case 'rel': return;
      case 'pick': S.pick = t.dataset.side; return refreshLayers();
      case 'pickdone': S.pick = null; return refreshLayers();
      case 'of': S.ofSel = v; return refreshLayers();
      case 'pk': { const r = at(S.edit), l = r[S.pick], k = t.dataset.k, val = k === 'sign' || k === 'lord' || k === 'house' || k === 'arudha' ? +v : v, i = l.findIndex(o => o.k === k && String(o.v) === String(val) && ((o.of || 'C') === S.ofSel || k === 'sign'));
        if (i >= 0) l.splice(i, 1); else if (l.length < 12) l.push({ k, v: val, of: k === 'sign' ? 'C' : S.ofSel }); persist(); refreshLayers(); return render(); }
      case 'opx': { const r = at(S.edit); r[t.dataset.side].splice(+t.dataset.i, 1); persist(); refreshLayers(); return render(); }
      case 'qa': case 'qb': { const r = at(S.edit); if (a === 'qa') r.q = v; else r.bq = v; persist(); refreshLayers(); return render(); }
      case 'rneg': { at(S.edit).neg = v === '1'; persist(); refreshLayers(); return render(); }
      case 'pt': { const r = at(S.edit), k = t.dataset.k, val = /^\d+$/.test(v) && k !== 'digs' && k !== 'planets' ? +v : v, arr = r.p[k] = r.p[k] || [], i = arr.indexOf(val); if (i >= 0) arr.splice(i, 1); else arr.push(val); persist(); refreshLayers(); return render(); }
      case 'pd': { at(S.edit).p.dir = v; persist(); refreshLayers(); return render(); }
      case 'pon': { at(S.edit).p.on = v === '1'; persist(); refreshLayers(); return render(); }
      /* result */
      case 'tgt': S.tgt = v; persist(); return render();
      case 'smode': S.scan.mode = v; S.scan.res = null; if (v === 'birth' && S.scan.y0 > 2000) { S.scan.y0 = 1950; S.scan.y1 = 2010; } render(); return;
      case 'pre': { const y = new Date().getFullYear(), s = S.scan; if (v === 'n10') { s.y0 = y; s.y1 = y + 10; } else if (v === 'n30') { s.y0 = y; s.y1 = y + 30; } else if (v === 'p30') { s.y0 = y - 30; s.y1 = y; } else { s.y0 = 1950; s.y1 = 2010; s.mode = 'birth'; } return render(); }
      case 'scan': return runScan();
      case 'scancancel': S.scan.cancel = true; return;
      case 'goto': { const w = S.scan.res.windows[+t.dataset.i]; if (!w) return; const jd = S.scan.mode === 'birth' ? (w.from + Math.min(w.to, w.from + 0.5)) / 2 : (w.from + w.to) / 2; setOpen(false); if (typeof jumpToJD === 'function') jumpToJD(jd); return; }
      case 'open3d': { const c = ctx(); if (c.err) return toast(c.err); setOpen(false); if (typeof jumpToJD === 'function') jumpToJD(c.X.C.jd); return; }
      /* library & saved */
      case 'cat': S.lib.cat = v; return render();
      case 'use': case 'usechk': { const f = FMX.LIB.find(x => x.id === t.dataset.id); if (!f) return; const c = FMX.clone(f); c.id = FM.uid(); delete c.cat; S.f = FM.normalize(c); persist(); return setTab(a === 'use' ? 'build' : 'result'); }
      case 'open': { const f = FMX.loadAll().find(x => x.id === t.dataset.id); if (f) { S.f = f; persist(); setTab('build'); } return; }
      case 'sdup': FMX.dup(t.dataset.id); return render();
      case 'sdel': FMX.remove(t.dataset.id); return render();
      case 'sshare': { const f = FMX.loadAll().find(x => x.id === t.dataset.id); if (f) openShare(f); return; }
      case 'import': { const r = FMX.decode(($('fmImp') || {}).value || S.imp); if (r.error) return toast(r.error); S.f = r.formula; persist(); toast('Imported “' + r.formula.name + '”'); return setTab('build'); }
      case 'exall': return download('formulas-backup.json', FMX.exportAll(), 'application/json');
      case 'imfile': { const i = $('fmFile'); if (i) i.click(); return; }
    }
    void pop;
  }
  function onChange(e) {
    const t = e.target, a = t.dataset && t.dataset.a, id = t.id;
    if (id === 'fmName') { S.f.name = t.value.slice(0, 80) || 'My formula'; return persist(); }
    if (id === 'fmAbout') { S.f.about = t.value.slice(0, 400); return persist(); }
    if (id === 'fmPerson') { S.person = t.value; persist(); return render(); }
    if (id === 'fmOther') { S.other = t.value; persist(); return render(); }
    if (id === 'fmDate') { S.date = t.value; persist(); return render(); }
    if (id === 'fmY0' || id === 'fmY1') { const v = parseInt(t.value, 10); if (isFinite(v)) S.scan[id === 'fmY0' ? 'y0' : 'y1'] = v; return; }
    if (id === 'fmFile') { const f = t.files && t.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const n = FMX.importAll(String(rd.result)); if (n) { toast(n + ' formula' + (n === 1 ? '' : 's') + ' imported'); setTab('saved'); } else { const r = FMX.decode(String(rd.result)); if (r.formula) { S.f = r.formula; persist(); toast('Imported'); setTab('build'); } else toast('That file has no formulas'); } }; rd.readAsText(f); t.value = ''; return; }
    if (!a || !S.edit) return; const r = at(S.edit);
    if (a === 'rel') { r.r = t.value; r.p = {}; if (FM.REL[r.r].bin === 0) r.b = []; persist(); refreshLayers(); return render(); }
    if (a === 'nk') { const i = parseInt(t.value, 10); if (isFinite(i)) { const arr = r.p.naks = r.p.naks || []; if (!arr.includes(i)) arr.push(i); } persist(); refreshLayers(); return render(); }
    if (a === 'pv') { r.p.varga = t.value; persist(); refreshLayers(); return render(); }
    if (a === 'pa') { r.p.angle = +t.value; persist(); refreshLayers(); return render(); }
    if (a === 'pn') { const v = parseFloat(t.value); if (isFinite(v)) r.p[t.dataset.k] = v; persist(); render(); const s = document.querySelector('#fmEdit .fm-pre-s'); if (s) s.textContent = FM.sentence(r); }
  }
  function onInput(e) { const t = e.target; if (t.id === 'fmQ') { S.lib.q = t.value; const pos = t.selectionStart; render(); const q = $('fmQ'); if (q) { q.focus(); q.setSelectionRange(pos, pos); } } if (t.id === 'fmImp') S.imp = t.value; if (t.id === 'fmName') { S.f.name = t.value.slice(0, 80); persist(); } }

  /* ---------- shell ---------- */
  function setOpen(v) {
    S.open = !!v; const s = $('fmSheet'); if (!s) return; s.hidden = !S.open;
    if (S.open) { render(); refreshLayers(); const c = $('fmClose'); if (c) c.focus(); } else { S.edit = null; S.pick = null; S.share = null; refreshLayers(); const t = $('toolsBtn'); if (t) t.focus(); }
  }
  function build() {
    const mk = (id, cls, html) => { const d = document.createElement('div'); d.id = id; d.className = cls + ' vax-skip'; d.hidden = true; d.innerHTML = html || ''; document.body.appendChild(d); return d; };
    const s = mk('fmSheet', 'fm-sheet', `<div class="fm-card-s" role="dialog" aria-modal="true" aria-label="Formula maker"><header><div><b>Formula maker</b><small>Build, test, find and share your own astrology formulas</small></div><button type="button" id="fmClose" aria-label="Close">✕</button></header>
      <div class="fm-tabs" id="fmTabs" role="tablist">${[['build', 'Build'], ['result', 'Result'], ['library', 'Library'], ['saved', 'Saved']].map(([k, l]) => `<button type="button" role="tab" data-a="tab" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="fm-body" id="fmBody"></div><div class="fm-toast" id="fmToast" role="status" aria-live="polite"></div></div>`);
    mk('fmEdit', 'fm-pop'); mk('fmPick', 'fm-pop fm-pop2');
    $('fmClose').addEventListener('click', () => setOpen(false));
    s.addEventListener('click', e => { if (e.target === s) setOpen(false); else onClick(e); });
    ['fmEdit', 'fmPick'].forEach(id => { const p = $(id); p.addEventListener('click', e => { if (e.target === p) { if (id === 'fmPick') S.pick = null; else if (S.share) S.share = null; else { S.edit = null; S.pick = null; render(); } refreshLayers(); } else onClick(e); }); p.addEventListener('change', onChange); });
    s.addEventListener('change', onChange); s.addEventListener('input', onInput);
    document.addEventListener('keydown', e => { if (e.key !== 'Escape' || !S.open) return; if (S.pick) S.pick = null; else if (S.share) S.share = null; else if (S.edit) { S.edit = null; render(); } else return setOpen(false); refreshLayers(); });
    const b = $('fmBtn'); if (b) b.addEventListener('click', () => setOpen(true));
    const h = FMX.fromHash(); if (h) { S.f = h; persist(); S.tab = 'build'; setOpen(true); toast('Shared formula imported. Tap Save to keep it.'); try { history.replaceState(null, '', location.href.split('#')[0]); } catch (e) { /* ignore */ } }
    window.addEventListener('hashchange', () => { const x = FMX.fromHash(); if (x) { S.f = x; persist(); S.tab = 'build'; setOpen(true); toast('Shared formula imported'); } });
  }
  const api = { state: S, setOpen, render, ctx, get open() { return S.open; }, load: f => { S.f = FM.normalize(f) || S.f; persist(); render(); } };
  window.FMU = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
  return api;
})();

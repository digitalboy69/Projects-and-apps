/* ASTROLOGER WORKSPACE UI (AWUI): the Workspace tab (docs/ASTRO_WORKSPACE_PLAN.md).
   List of saved routines -> open one on the chart on screen (Flow: one step at a time with a rail; Board: all steps stacked; Present: clean view)
   -> editor (name, icon, colour, steps, order) -> Add-step sheet (cards and every tool of the app, with a live preview) -> share / import.
   Uses AW (js/160) for storage, AWW (js/161) for the native cards, HOME_ITEMS (js/25) for the tool list, registerLatePanel / ensureLatePanel (js/120).
   Nothing is built until the tab is first opened. A tool step is the real panel of the app, moved into the step card and put back afterwards.
   Sheets and the toast live on <body>. Only opacity/transform animate. Classes aw- (css/90-workspace.css). */
(function(){
  'use strict';
  if (typeof AW === 'undefined' || typeof AWW === 'undefined') return;
  const esc = AWW.esc;
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [].slice.call((r || document).querySelectorAll(s));
  const ST = { view: 'list', rid: null, step: 0, layout: 'flow', ed: null, sheet: null, pick: null, gen: 0 };
  const embedded = new Map(), collapsed = {};
  const SKIPPED = { 'panel-home': 1, 'panel-export': 1, 'panel-contact': 1, 'panel-workspace': 1, 'panel-tools': 1 };
  let root = null, bound = false, toastT = 0, sheetEl = null, toastEl = null, exitEl = null, imported = '';

  const SUBJ_KEYS = ['subject', 'subjects', 'planet'];
  const valuesOf = x => SUBJ_KEYS.indexOf(x.k) >= 0 && window.AWV ? x.values.concat(AWV.list().map(v => [v.id, v.name, 'My variables'])) : x.values;
  const tools = () => (typeof HOME_ITEMS !== 'undefined' ? HOME_ITEMS : []).filter(i => !SKIPPED[i[0]]);
  const toolOf = id => tools().find(i => i[0] === id);
  const chart = () => (typeof currentChartForModal !== 'undefined' ? currentChartForModal : null);
  const prof = () => window.__vgProf || (typeof currentProfileForExport !== 'undefined' ? currentProfileForExport : {}) || {};
  const SIGN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

  /* ---------- small helpers ---------- */
  function stepIcon(s){ if (s.k === 'p'){ const t = toolOf(s.t); return t ? t[1] : '▣'; } const w = AW.WMAP[s.t]; return w ? w.icon : '?'; }
  function stepTitle(s){
    if (s.label) return s.label;
    if (s.k === 'p'){ const t = toolOf(s.t); return t ? t[2] : 'Tool'; }
    const w = AW.WMAP[s.t]; if (!w) return 'Missing card'; const o = s.o || {};
    const sl = id => { const x = (AW.subjectList ? AW.subjectList() : AW.SUBJECTS || []).find(q => q[0] === id); return x ? x[1].replace(/ \(.*$/, '') : id; };
    const bit = s.t === 'chart2' ? ' · ' + o.a + ' and ' + o.b : o.subject ? ' · ' + sl(o.subject) + (o.varga ? ' in ' + o.varga : '') : o.subjects ? ' · ' + String(o.subjects).split(',').length + ' points in ' + o.varga : o.varga ? ' · ' + o.varga : o.house ? ' · house ' + o.house : o.planet ? ' · ' + sl(o.planet) : '';
    return w.name + bit;
  }
  function stepSummary(s){
    if (s.k === 'p'){ const t = toolOf(s.t); return t ? 'Tool · ' + t[3] : 'This tool is not in this version.'; }
    const w = AW.WMAP[s.t]; if (!w) return 'This card is not in this version.';
    const bits = w.options.filter(x => x.values).map(x => { const v = (s.o || {})[x.k]; if (x.k === 'subjects') return String(v || '').split(',').filter(Boolean).length + ' points'; const p = valuesOf(x).find(q => q[0] === v); return p ? p[1].replace(/ \(.*$/, '') : ''; }).filter(Boolean);
    return bits.length ? bits.join(' · ') : w.about;
  }
  function toast(msg, undo){
    if (!toastEl){ toastEl = document.createElement('div'); toastEl.className = 'aw-toast vax-skip'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); toastEl.addEventListener('click', e => { if (e.target.closest('[data-act="undo"]') && toastEl._undo){ const f = toastEl._undo; toastEl._undo = null; toastEl.classList.remove('on'); f(); } }); }
    toastEl._undo = undo || null; toastEl.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button type="button" data-act="undo">Undo</button>' : ''}`;
    toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), undo ? 6000 : 2600);
  }
  function copyText(t){ try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(() => true, () => false); } catch (e) {} return Promise.resolve(false); }
  function download(name, text, type){ try { const b = new Blob([text], { type: type || 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800); } catch (e) { toast('Could not make the file.'); } }
  const slug = s => String(s || 'routine').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'routine';

  /* ---------- panels moved into step cards ---------- */
  function restoreAll(){
    embedded.forEach(e => { try { e.n.classList.remove('aw-embed'); if (e.ph.parentNode) e.ph.parentNode.replaceChild(e.n, e.ph); } catch (x) {} });
    embedded.clear();
  }
  function embed(id, host){
    try { if (typeof window.ensureLatePanel === 'function') window.ensureLatePanel(id); } catch (e) {}
    const n = document.getElementById(id);
    if (!n){ host.innerHTML = `<p class="aw-msg">This tool needs your chart. Cast a chart, then open it once from Home.</p>`; return; }
    if (embedded.has(id)) restoreOne(id);
    const ph = document.createComment('aw:' + id); n.parentNode.insertBefore(ph, n); embedded.set(id, { n, ph });
    n.classList.add('aw-embed'); host.appendChild(n);
    try { if (id === 'panel-vbday' && typeof vbLazyRender === 'function') vbLazyRender(); if (id === 'panel-tithi' && typeof window.tpRenderPending === 'function') window.tpRenderPending(); } catch (e) {}
  }
  function restoreOne(id){ const e = embedded.get(id); if (!e) return; try { e.n.classList.remove('aw-embed'); if (e.ph.parentNode) e.ph.parentNode.replaceChild(e.n, e.ph); } catch (x) {} embedded.delete(id); }

  /* ---------- views ---------- */
  function set(html){ root.innerHTML = html; }
  function chartPill(){ const p = prof(), c = chart(); if (!c) return '<span class="aw-pill off">No chart yet</span>'; return `<span class="aw-pill"><i></i>${esc(p.name || 'Your chart')} · ${esc(SIGN[c.ascendant.sign])} rising</span>`; }
  const MANDALA = `<svg class="aw-mandala" viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".7"><circle cx="100" cy="100" r="92"/><circle cx="100" cy="100" r="70"/><circle cx="100" cy="100" r="46"/><circle cx="100" cy="100" r="22"/>${Array.from({ length: 12 }, (_, i) => `<line x1="100" y1="8" x2="100" y2="192" transform="rotate(${i * 15} 100 100)"/>`).join('')}<path d="M100 8 L192 100 L100 192 L8 100Z"/></g></svg>`;

  function viewList(){
    ST.view = 'list'; ST.rid = null; restoreAll(); document.body.classList.remove('aw-present');
    const all = AW.list(), ui = AW.ui(), sorted = all.map((r, i) => [r, i]).sort((a, b) => (b[0].pin ? 1 : 0) - (a[0].pin ? 1 : 0) || (b[0].used || 0) - (a[0].used || 0) || a[1] - b[1]).map(x => x[0]);
    let h = `<header class="aw-hero">${MANDALA}<small>Astrologer Workspace</small><h2>Your routines</h2><p>Build what you always check, once, in your own order. Open it on any chart and every item comes up in sequence.</p>${chartPill()}<div class="aw-hero-act"><button type="button" class="aw-btn pri" data-act="new">＋ New routine</button><button type="button" class="aw-btn" data-act="finder">⌖ Find a point</button><button type="button" class="aw-btn" data-act="import">Import</button>${all.length ? '<button type="button" class="aw-btn" data-act="backup">Back up all</button>' : ''}</div></header>`;
    if (imported){ h += `<div class="aw-banner">Imported from a link: <b>${esc(imported)}</b>. It is in your list below.</div>`; imported = ''; }
    if (!all.length) h += `<div class="aw-empty"><b>No routines yet</b><p>Make your first one, or bring back the starter set.</p><button type="button" class="aw-btn pri" data-act="starters">Add the starter routines</button></div>`;
    else h += `<section class="aw-grid">${sorted.map((r, i) => `<article class="aw-rc${r.pin ? ' pin' : ''}" style="--c:${esc(r.color)};--d:${Math.min(i, 8) * 45}ms"><button type="button" class="aw-rc-main" data-act="open" data-id="${esc(r.id)}" aria-label="Open ${esc(r.name)}"><span class="aw-rc-top"><span class="aw-ic">${esc(r.icon)}</span><b>${esc(r.name)}</b>${r.pin ? '<em title="Pinned">★</em>' : ''}</span>${r.note ? `<span class="aw-rc-note">${esc(r.note)}</span>` : ''}<span class="aw-rc-steps">${r.steps.slice(0, 9).map(s => `<i title="${esc(stepTitle(s))}">${esc(stepIcon(s))}</i>`).join('')}${r.steps.length > 9 ? `<i class="more">+${r.steps.length - 9}</i>` : ''}</span><span class="aw-rc-meta">${r.steps.length} step${r.steps.length === 1 ? '' : 's'}${r.uses ? ' · opened ' + r.uses + '×' : ''}${r.layout === 'board' ? ' · board' : ''}</span></button><span class="aw-rc-act"><button type="button" data-act="edit" data-id="${esc(r.id)}">Edit</button><button type="button" data-act="share" data-id="${esc(r.id)}">Share</button><button type="button" data-act="more" data-id="${esc(r.id)}" aria-label="More">⋯</button></span></article>`).join('')}</section>`;
    h += varsSection();
    h += `<p class="aw-foot">Routines are saved on this device only. They hold no birth details, only what you check and in what order.</p>`;
    set(h); AW.setUi({ lastView: 'list' });
  }

  function varsSection(){
    if (!window.AWV) return '';
    const vs = AWV.list(), c = chart(), pf = prof();
    const cards = vs.map(v => { let res = ''; if (c){ const r = AWP.resolve(v.id, c, pf); res = r.err ? `<em class="bad">${esc(r.err)}</em>` : `<em>= ${esc(r.planet || SIGN[r.sign])}${r.kind === 'sign' ? ' (sign)' : ''}</em>`; } return `<article class="aw-vc"><button type="button" class="aw-vc-main" data-act="editvar" data-id="${esc(v.id)}"><b>${esc(v.name)}</b>${res}<small>${esc(AWV.describe(v))}.</small></button><span class="aw-vc-act"><button type="button" data-act="findvar" data-id="${esc(v.id)}">Find</button><button type="button" data-act="editvar" data-id="${esc(v.id)}">Edit</button></span></article>`; }).join('');
    return `<section class="aw-vars"><div class="aw-sech"><h3>My variables</h3><button type="button" class="aw-btn sm" data-act="newvar">＋ New variable</button></div>${vs.length ? `<div class="aw-vgrid">${cards}</div>` : `<p class="aw-empty-s">Make your own: for example "my marriage planet" = the lord of the sign the Darakaraka stands in. Then find it in D9 or any chart, or use it in a routine.</p>`}</section>`;
  }
  function viewVar(id){
    const v = AWV.get(id); if (!v){ viewList(); return; }
    ST.view = 'var'; ST.vid = id; restoreAll(); drawVar(true);
  }
  function varPreview(){
    const el = $('#awVPrev'), v = AWV.get(ST.vid); if (!el || !v) return;
    const c = chart(), vg = ST.vvarga || 'D9';
    el.innerHTML = c ? AWW.render('locate', c, prof(), { subject: v.id, varga: vg, style: 'north' }) : '<p class="aw-msg">Cast a chart to see what this variable equals.</p>';
    const d = $('#awVDesc'); if (d) d.textContent = AWV.describe(v) + '.';
  }
  function varStepsHtml(v){
    return v.steps.length ? v.steps.map((s, i) => `<li class="aw-es aw-vs" data-i="${i}"><span class="aw-n">${i + 1}</span><div class="aw-vsel"><select data-vf="op" data-i="${i}" aria-label="Step ${i + 1}"><option value="lord"${s.op === 'lord' ? ' selected' : ''}>Then: the lord of its sign</option><option value="nak"${s.op === 'nak' ? ' selected' : ''}>Then: its nakshatra lord</option><option value="from"${s.op === 'from' ? ' selected' : ''}>Then: the Nth house from it</option></select>${s.op === 'from' ? `<select data-vf="n" data-i="${i}" aria-label="Which house">${Array.from({ length: 12 }, (_, k) => `<option value="${k + 1}"${s.n === k + 1 ? ' selected' : ''}>${k === 0 ? 'the same sign (1st)' : AWP.ORD(k + 1) + ' from it'}</option>`).join('')}</select>` : ''}</div><span class="aw-es-a"><button type="button" data-act="vup" data-i="${i}" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>▲</button><button type="button" data-act="vdown" data-i="${i}" aria-label="Move down" ${i === v.steps.length - 1 ? 'disabled' : ''}>▼</button><button type="button" class="x" data-act="vdel" data-i="${i}" aria-label="Remove step">✕</button></span></li>`).join('') : '<li class="aw-es-empty">No steps: the variable is just its start. Add a step to follow a rule.</li>';
  }
  function drawVar(full){
    const v = AWV.get(ST.vid); if (!v) return;
    const mode = v.pick ? 'pick' : 'one';
    if (!full && $('#awVSteps')){ $('#awVSteps').innerHTML = varStepsHtml(v); varPreview(); return; }
    const startSel = AW.WMAP.locate.options[0];
    set(`<div class="aw-var"><div class="aw-topbar"><button type="button" class="aw-ib" data-act="vdone" aria-label="Done">‹</button><div class="aw-tt"><b>My variable</b><small>Saved as you type</small></div><button type="button" class="aw-btn pri sm" data-act="findvar" data-id="${esc(v.id)}">Find it</button></div>
      <div class="aw-form"><label class="aw-lab">Name<input data-vf="name" type="text" maxlength="40" value="${esc(v.name)}" autocomplete="off"></label>
      <p class="aw-vdesc" id="awVDesc">${esc(AWV.describe(v))}.</p>
      <div class="aw-lab">Start from<div class="aw-seg wide"><button type="button" data-act="vmode" data-v="one" class="${mode === 'one' ? 'on' : ''}">One point</button><button type="button" data-act="vmode" data-v="pick" class="${mode === 'pick' ? 'on' : ''}">Pick the best of several</button></div></div>
      ${mode === 'one' ? `<label class="aw-lab">Which point${selectHtml(startSel, v.start).replace('data-opt="subject"', 'data-vf="start"')}</label>` :
      `<div class="aw-two2"><label class="aw-lab">Measure<select data-vf="pm"><option value="shadbala"${v.pick.m === 'shadbala' ? ' selected' : ''}>By Shadbala strength</option><option value="degree"${v.pick.m === 'degree' ? ' selected' : ''}>By degree in its sign</option></select></label><label class="aw-lab">Take the<select data-vf="pd"><option value="max"${v.pick.d === 'max' ? ' selected' : ''}>${v.pick.m === 'shadbala' ? 'Strongest' : 'Highest degree'}</option><option value="min"${v.pick.d === 'min' ? ' selected' : ''}>${v.pick.m === 'shadbala' ? 'Weakest' : 'Lowest degree'}</option></select></label></div><div class="aw-lab">Among<div id="awVAmong">${amongChips(v.pick.among)}</div></div>`}
      </div>
      <div class="aw-sech"><h3>Then follow these steps</h3><span>${v.steps.length} of ${AWV.MAXSTEP}</span></div><ol class="aw-es-list" id="awVSteps">${varStepsHtml(v)}</ol>
      <button type="button" class="aw-add" data-act="vadd">＋ Add a step</button>
      <div class="aw-sech"><h3>What it equals now</h3><select id="awVVarga" class="aw-mini" aria-label="Chart">${AW.VARGA_KEYS.map(k => `<option value="${k}"${(ST.vvarga || 'D9') === k ? ' selected' : ''}>${k}</option>`).join('')}</select></div>
      <div class="aw-step ready aw-fstep"><div class="aw-sbody" id="awVPrev"></div></div>
      <div class="aw-ed-foot"><button type="button" class="aw-btn" data-act="vdup" data-id="${esc(v.id)}">Duplicate</button><button type="button" class="aw-btn danger" data-act="vremove" data-id="${esc(v.id)}">Delete</button></div></div>`);
    varPreview();
  }
  function amongChips(cur){
    const on = String(cur || '').split(',').filter(Boolean), list = AW.subjectList().filter(x => x[0] !== ST.vid && /^(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu|role:|lord:|dasha:|nak:|cv:)/.test(x[0]));
    const presets = [['Benefics', 'Jupiter,Venus,Mercury,Moon'], ['Malefics', 'Sun,Mars,Saturn'], ['Seven planets', 'Sun,Moon,Mars,Mercury,Jupiter,Venus,Saturn'], ['Karakas', 'role:AK,role:AmK,role:BK,role:MK,role:PuK,role:GK,role:DK']];
    return `<div class="aw-presets">${presets.map(p => `<button type="button" data-act="vpreset" data-v="${p[1]}">${p[0]}</button>`).join('')}</div><div class="aw-sc aw-sc0">${list.map(x => `<button type="button" data-act="vtoggle" data-v="${esc(x[0])}" aria-pressed="${on.indexOf(x[0]) >= 0}" class="${on.indexOf(x[0]) >= 0 ? 'on' : ''}">${esc(x[1].replace(/ \(.*$/, ''))}</button>`).join('')}</div>`;
  }
  function varMut(fn){ const v = AWV.get(ST.vid); if (!v) return; fn(v); AWV.save(v); }
  function viewRun(id, startAt){
    const r = AW.get(id); if (!r){ viewList(); return; }
    if (ST.rid !== id){ AW.touch(id); } ST.rid = id; ST.view = 'run'; ST.layout = r.layout; ST.step = Math.max(0, Math.min(r.steps.length - 1, startAt || 0)); AW.setUi({ last: id }); restoreAll();
    const c = chart();
    let h = `<div class="aw-run" style="--c:${esc(r.color)}"><div class="aw-topbar"><button type="button" class="aw-ib" data-act="list" aria-label="Back to routines">‹</button><div class="aw-tt"><b>${esc(r.name)}</b><small>${chartPill().replace(/<[^>]+>/g, '')}</small></div><button type="button" class="aw-ib" data-act="present" aria-label="Present full screen">⛶</button><button type="button" class="aw-ib" data-act="edit" data-id="${esc(r.id)}" aria-label="Edit routine">✎</button></div><div class="aw-modebar"><div class="aw-seg wide" role="group" aria-label="Layout"><button type="button" data-act="layout" data-v="flow" class="${r.layout === 'flow' ? 'on' : ''}">Flow · one at a time</button><button type="button" data-act="layout" data-v="board" class="${r.layout === 'board' ? 'on' : ''}">Board · all stacked</button></div></div>`;
    if (!c) h += `<div class="aw-empty"><b>Cast a chart first</b><p>A routine shows the chart you have open. Enter birth details on the Home screen, then come back.</p></div></div>`;
    else if (!r.steps.length) h += `<div class="aw-empty"><b>This routine is empty</b><p>Add the first thing you always check.</p><button type="button" class="aw-btn pri" data-act="edit" data-id="${esc(r.id)}">Add steps</button></div></div>`;
    else h += `<div class="aw-rail" id="awRail">${r.steps.map((s, i) => `<button type="button" data-act="go" data-i="${i}" class="${i === ST.step ? 'on' : ''}" title="${esc(stepTitle(s))}"><em>${i + 1}</em><i>${esc(stepIcon(s))}</i><span>${esc(stepTitle(s))}</span></button>`).join('')}<u id="awProg"></u></div><div class="aw-stage" id="awStage"></div><div class="aw-nav" id="awNav"><button type="button" data-act="prev">‹ Previous</button><span id="awCount"></span><button type="button" data-act="next">Next ›</button></div></div>`;
    set(h); if (c && r.steps.length) paintStage(r);
  }

  function stepCard(r, s, i){
    const w = s.k === 'w' ? AW.WMAP[s.t] : null, gname = w ? (AW.GROUPS.find(g => g[0] === w.group) || [])[1] : 'Tool';
    return `<section class="aw-step${collapsed[s.id] ? ' shut' : ''}" data-i="${i}" data-sid="${esc(s.id)}"><header><span class="aw-n">${i + 1}</span><span class="aw-ic">${esc(stepIcon(s))}</span><div class="aw-st"><h3>${esc(stepTitle(s))}</h3><small>${esc(gname || '')}</small></div>${r.layout === 'board' ? `<button type="button" class="aw-ib sm" data-act="fold" data-sid="${esc(s.id)}" aria-label="Fold or unfold">▾</button>` : ''}</header>${s.note ? `<p class="aw-snote">${esc(s.note)}</p>` : ''}<div class="aw-sbody"><div class="aw-skel"><i></i><i></i><i></i></div></div></section>`;
  }
  function fillStep(r, s, el){
    const host = $('.aw-sbody', el); if (!host) return;
    if (s.k === 'p') embed(s.t, host); else host.innerHTML = AWW.render(s.t, chart(), prof(), s.o || {});
    el.classList.add('ready');
  }
  function paintStage(r){
    const stage = $('#awStage'); if (!stage) return; const gen = ++ST.gen; restoreAll();
    document.body.classList.toggle('aw-boardmode', r.layout === 'board');
    if (r.layout === 'board'){
      stage.innerHTML = r.steps.map((s, i) => stepCard(r, s, i)).join('');
      $('#awNav').hidden = true;
      const els = $$('.aw-step', stage); let k = 0;
      (function next(){ if (gen !== ST.gen || k >= els.length) return; const i = k++; fillStep(r, r.steps[i], els[i]); (window.requestIdleCallback || (f => setTimeout(f, 24)))(next); })();
    } else {
      const s = r.steps[ST.step]; stage.innerHTML = stepCard(r, s, ST.step); $('#awNav').hidden = false;
      fillStep(r, s, $('.aw-step', stage));
    }
    updateRail(r);
  }
  function updateRail(r){
    const rail = $('#awRail'); if (!rail) return;
    $$('button', rail).forEach((b, i) => b.classList.toggle('on', r.layout === 'board' ? false : i === ST.step));
    const pr = $('#awProg'); if (pr) pr.style.transform = `scaleX(${r.layout === 'board' ? 1 : (ST.step + 1) / r.steps.length})`;
    const cnt = $('#awCount'); if (cnt) cnt.textContent = (ST.step + 1) + ' of ' + r.steps.length;
    const on = $('button.on', rail); if (on && on.scrollIntoView) { try { rail.scrollTo({ left: on.offsetLeft - rail.clientWidth / 2 + on.clientWidth / 2, behavior: 'smooth' }); } catch (e) {} }
    const pv = $('[data-act="prev"]'), nx = $('[data-act="next"]'); if (pv) pv.disabled = ST.step <= 0; if (nx) nx.disabled = ST.step >= r.steps.length - 1;
  }
  function go(i){
    const r = AW.get(ST.rid); if (!r) return; i = Math.max(0, Math.min(r.steps.length - 1, i));
    if (r.layout === 'board'){ const el = $(`.aw-step[data-i="${i}"]`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); ST.step = i; updateRail(r); $$('#awRail button').forEach((b, k) => b.classList.toggle('on', k === i)); return; }
    if (i === ST.step && $('.aw-step.ready')) return;
    ST.step = i; paintStage(r); window.scrollTo({ top: ($('.aw-run') || document.body).getBoundingClientRect().top + window.scrollY - 60, behavior: 'auto' });
  }

  /* ---------- editor ---------- */
  function persist(){ if (ST.ed) AW.save(ST.ed); }
  function viewEdit(id){
    const r = id ? AW.get(id) : null; if (!r){ viewList(); return; }
    ST.ed = r; ST.view = 'edit'; restoreAll(); document.body.classList.remove('aw-present');
    drawEditor();
  }
  function drawEditor(){
    const r = ST.ed; if (!r) return;
    const sc = $('#awEdSteps'), keepY = window.scrollY;
    const stepsHtml = r.steps.length ? r.steps.map((s, i) => `<li class="aw-es" data-sid="${esc(s.id)}"><span class="aw-n">${i + 1}</span><span class="aw-ic">${esc(stepIcon(s))}</span><button type="button" class="aw-es-t" data-act="editstep" data-sid="${esc(s.id)}"><b>${esc(stepTitle(s))}</b><small>${esc(stepSummary(s))}</small></button><span class="aw-es-a"><button type="button" data-act="up" data-sid="${esc(s.id)}" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>▲</button><button type="button" data-act="down" data-sid="${esc(s.id)}" aria-label="Move down" ${i === r.steps.length - 1 ? 'disabled' : ''}>▼</button><button type="button" data-act="dupstep" data-sid="${esc(s.id)}" aria-label="Duplicate step">⧉</button><button type="button" class="x" data-act="delstep" data-sid="${esc(s.id)}" aria-label="Remove step">✕</button></span></li>`).join('') : `<li class="aw-es-empty">No steps yet. Add the first thing you always check.</li>`;
    if (sc && root.querySelector('.aw-ed')){ sc.innerHTML = stepsHtml; $('#awEdCount').textContent = r.steps.length + ' of ' + AW.MAXSTEPS; window.scrollTo(0, keepY); return; }
    set(`<div class="aw-ed" style="--c:${esc(r.color)}"><div class="aw-topbar"><button type="button" class="aw-ib" data-act="done" aria-label="Done">‹</button><div class="aw-tt"><b>Edit routine</b><small>Saved as you type</small></div><button type="button" class="aw-btn pri sm" data-act="run" data-id="${esc(r.id)}">Open</button></div>
      <div class="aw-form"><label class="aw-lab">Name<input id="awName" type="text" maxlength="60" value="${esc(r.name)}" autocomplete="off"></label>
      <label class="aw-lab">What it is for<input id="awNote" type="text" maxlength="400" value="${esc(r.note)}" placeholder="Example: first look at a marriage question" autocomplete="off"></label>
      <div class="aw-lab">Icon<div class="aw-icons" id="awIcons">${AW.ICONS.map(x => `<button type="button" data-act="icon" data-v="${esc(x)}" class="${x === r.icon ? 'on' : ''}">${esc(x)}</button>`).join('')}</div></div>
      <div class="aw-lab">Colour<div class="aw-swatches" id="awColors">${AW.COLORS.map(x => `<button type="button" data-act="color" data-v="${x}" class="${x === r.color ? 'on' : ''}" style="--k:${x}" aria-label="Colour ${x}"></button>`).join('')}</div></div>
      <div class="aw-lab">Opens as<div class="aw-seg wide"><button type="button" data-act="edlayout" data-v="flow" class="${r.layout === 'flow' ? 'on' : ''}">Flow · one at a time</button><button type="button" data-act="edlayout" data-v="board" class="${r.layout === 'board' ? 'on' : ''}">Board · all stacked</button></div></div></div>
      <div class="aw-sech"><h3>Steps, in your order</h3><span id="awEdCount">${r.steps.length} of ${AW.MAXSTEPS}</span></div><ol class="aw-es-list" id="awEdSteps">${stepsHtml}</ol>
      <button type="button" class="aw-add" data-act="addstep">＋ Add a step</button>
      <div class="aw-ed-foot"><button type="button" class="aw-btn" data-act="share" data-id="${esc(r.id)}">Share</button><button type="button" class="aw-btn" data-act="dup" data-id="${esc(r.id)}">Duplicate</button><button type="button" class="aw-btn danger" data-act="del" data-id="${esc(r.id)}">Delete</button></div></div>`);
  }

  /* ---------- point finder ---------- */
  function findOut(){
    const f = ST.find, el = $('#awFindOut'); if (!el) return;
    el.innerHTML = chart() ? AWW.render(f.mode === 'all' ? 'locateall' : 'locate', chart(), prof(), { subject: f.subject, varga: f.varga, style: 'north' }) : '<p class="aw-msg">Cast a chart first.</p>';
    $$('[data-act="fmode"]').forEach(b => b.classList.toggle('on', b.dataset.v === f.mode));
    const cs = $('#awFindChart'); if (cs) cs.hidden = f.mode === 'all';
    AW.setUi({ find: f });
  }
  function viewFinder(){
    ST.view = 'finder'; ST.rid = null; restoreAll(); document.body.classList.remove('aw-present');
    const saved = AW.ui().find || {}; ST.find = ST.find || { subject: saved.subject || 'role:AK', varga: saved.varga || 'D9', mode: saved.mode === 'all' ? 'all' : 'one' };
    const f = ST.find, subj = AW.WMAP.locate.options[0], vg = AW.WMAP.locate.options[1];
    const quick = [['role:AK', 'Atmakaraka'], ['role:DK', 'Darakaraka'], ['lord:1', 'Lagna lord'], ['lord:7', '7th lord'], ['dasha:md', 'Dasha lord'], ['lagna', 'Lagna'], ['pt:gulika', 'Gulika']];
    set(`<div class="aw-find-view"><div class="aw-topbar"><button type="button" class="aw-ib" data-act="list" aria-label="Back to routines">‹</button><div class="aw-tt"><b>Point finder</b><small>${chartPill().replace(/<[^>]+>/g, '')}</small></div><button type="button" class="aw-btn pri sm" data-act="addtopick">＋ Routine</button></div>
      <p class="aw-dim aw-lead">Pick anything: a planet, Atmakaraka, Darakaraka, a house lord, a special lagna. See where it stands in the main chart and in D9 or any divisional chart.</p>
      <div class="aw-quick">${quick.map(q => `<button type="button" data-act="fquick" data-v="${esc(q[0])}" class="${f.subject === q[0] ? 'on' : ''}">${esc(q[1])}</button>`).join('')}</div>
      <div class="aw-form"><label class="aw-lab">Point to find${selectHtml(subj, f.subject).replace('data-opt="subject"', 'id="awFSubj"')}</label>
      <div class="aw-lab">Look in<div class="aw-seg wide"><button type="button" data-act="fmode" data-v="one" class="${f.mode === 'one' ? 'on' : ''}">One chart</button><button type="button" data-act="fmode" data-v="all" class="${f.mode === 'all' ? 'on' : ''}">All 23 charts</button></div></div>
      <label class="aw-lab" id="awFindChart"${f.mode === 'all' ? ' hidden' : ''}>Divisional chart${selectHtml(vg, f.varga).replace('data-opt="varga"', 'id="awFVarga"')}</label></div>
      <div class="aw-step ready aw-fstep"><div class="aw-sbody" id="awFindOut"></div></div><button type="button" class="aw-btn full" data-act="newvar">＋ Make my own variable</button></div>`);
    findOut();
  }

  /* ---------- sheets ---------- */
  function sheet(title, body, cls){
    if (!sheetEl){ sheetEl = document.createElement('div'); sheetEl.className = 'aw-sheet vax-skip'; sheetEl.setAttribute('role', 'dialog'); sheetEl.setAttribute('aria-modal', 'true'); document.body.appendChild(sheetEl);
      sheetEl.addEventListener('click', onSheetClick); sheetEl.addEventListener('input', onSheetInput); sheetEl.addEventListener('change', onSheetInput); }
    sheetEl.className = 'aw-sheet vax-skip ' + (cls || ''); sheetEl.innerHTML = `<div class="aw-sh-back" data-act="close"></div><div class="aw-sh-box"><div class="aw-sh-h"><b>${esc(title)}</b><button type="button" class="aw-ib sm" data-act="close" aria-label="Close">✕</button></div><div class="aw-sh-b">${body}</div></div>`;
    void sheetEl.offsetWidth; sheetEl.classList.add('on'); document.documentElement.classList.add('aw-lock');
  }
  function closeSheet(){ if (!sheetEl) return; sheetEl.classList.remove('on'); sheetEl.innerHTML = ''; document.documentElement.classList.remove('aw-lock'); ST.pick = null; }

  function pickerHtml(){
    const q = (ST.pick && ST.pick.q || '').toLowerCase(), tab = ST.pick.tab, grp = ST.pick.grp;
    let list;
    if (tab === 'tools'){
      list = tools().filter(t => !q || (t[2] + ' ' + t[3] + ' ' + t[4]).toLowerCase().indexOf(q) >= 0).map(t => `<button type="button" class="aw-pr" data-act="picktool" data-id="${esc(t[0])}"><span class="aw-ic">${esc(t[1])}</span><span><b>${esc(t[2])}</b><small>${esc(t[3])}</small></span></button>`).join('');
    } else {
      list = AW.WIDGETS.filter(w => (!grp || w.group === grp) && (!q || (w.name + ' ' + w.about).toLowerCase().indexOf(q) >= 0)).map(w => `<button type="button" class="aw-pr" data-act="pickw" data-id="${esc(w.id)}"><span class="aw-ic">${esc(w.icon)}</span><span><b>${esc(w.name)}</b><small>${esc(w.about)}</small></span></button>`).join('');
    }
    return `<div class="aw-seg wide"><button type="button" data-act="ptab" data-v="cards" class="${tab === 'cards' ? 'on' : ''}">Cards (${AW.WIDGETS.length})</button><button type="button" data-act="ptab" data-v="tools" class="${tab === 'tools' ? 'on' : ''}">Any tool (${tools().length})</button></div>` +
      `<input id="awQ" class="aw-search" type="search" placeholder="${tab === 'tools' ? 'Search every tool of the app' : 'Search cards: chart, dasha, yoga, strength'}" value="${esc(ST.pick.q || '')}" autocomplete="off">` +
      (tab === 'cards' ? `<div class="aw-chips-row">${[['', 'All', '✦']].concat(AW.GROUPS).map(g => `<button type="button" data-act="pgrp" data-v="${esc(g[0])}" class="${(grp || '') === g[0] ? 'on' : ''}">${esc(g[2])} ${esc(g[1])}</button>`).join('')}</div>` : '') +
      `<div class="aw-plist">${list || '<p class="aw-msg">Nothing matches that search.</p>'}</div>`;
  }
  function openPicker(at){ ST.pick = { tab: 'cards', q: '', grp: '', at: at == null ? null : at }; sheet('Add a step', pickerHtml(), 'tall'); }
  function repaintPicker(keep){ const b = $('.aw-sh-b', sheetEl); if (!b) return; const q = $('#awQ', sheetEl), pos = q ? q.selectionStart : 0; b.innerHTML = pickerHtml(); if (keep){ const n = $('#awQ', sheetEl); if (n){ n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } } }

  function subjChips(cur){
    const on = String(cur || '').split(',').filter(Boolean), groups = [];
    AW.subjectList().forEach(x => { let g = groups.find(q => q[0] === x[2]); if (!g){ g = [x[2], []]; groups.push(g); } g[1].push(x); });
    return `<div class="aw-presets">${AW.SUBJ_PRESETS.map(p => `<button type="button" data-act="preset" data-v="${esc(p[1])}">${esc(p[0])}</button>`).join('')}<button type="button" data-act="preset" data-v="">Clear</button></div>` + groups.map(g => `<details class="aw-sg"${g[1].some(x => on.indexOf(x[0]) >= 0) ? ' open' : ''}><summary>${esc(g[0])}<em>${g[1].filter(x => on.indexOf(x[0]) >= 0).length || ''}</em></summary><div class="aw-sc">${g[1].map(x => `<button type="button" data-act="subjtoggle" data-v="${esc(x[0])}" aria-pressed="${on.indexOf(x[0]) >= 0}" class="${on.indexOf(x[0]) >= 0 ? 'on' : ''}">${esc(x[1].replace(/ \(.*$/, ''))}</button>`).join('')}</div></details>`).join('');
  }
  function selectHtml(x, val){
    const vals = valuesOf(x), grouped = vals.length && vals[0][2], opts = grouped ? vals.reduce((a, v) => { (a[v[2]] = a[v[2]] || []).push(v); return a; }, {}) : null;
    const one = v => `<option value="${esc(v[0])}"${val === v[0] ? ' selected' : ''}>${esc(v[1])}</option>`;
    return `<select data-opt="${esc(x.k)}">${grouped ? Object.keys(opts).map(g => `<optgroup label="${esc(g)}">${opts[g].map(one).join('')}</optgroup>`).join('') : vals.map(one).join('')}</select>`;
  }
  function optionsHtml(w, o){
    return w.options.map(x => x.k === 'subjects' ? `<div class="aw-lab">${esc(x.label)}<div id="awSubj">${subjChips(o[x.k])}</div></div>` : x.values ? `<label class="aw-lab">${esc(x.label)}${selectHtml(x, o[x.k])}</label>` : `<label class="aw-lab">${esc(x.label)}<textarea data-opt="${esc(x.k)}" rows="5" maxlength="1200" placeholder="Write a line or a checklist. Start a line with - for a tick box.">${esc(o[x.k] || '')}</textarea></label>`).join('');
  }
  function openConfig(w, step){
    const o = step ? Object.assign({}, step.o) : AW.defaults(w.id);
    ST.pick = Object.assign(ST.pick || {}, { cfg: { w: w.id, o, sid: step ? step.id : null, label: step ? step.label : '', note: step ? step.note : '' } });
    sheet(step ? 'Edit step' : w.name, `<p class="aw-dim">${esc(w.about)}</p>${w.options.length ? `<div class="aw-opts">${optionsHtml(w, o)}</div>` : ''}<label class="aw-lab">Your own title (optional)<input id="awLabel" type="text" maxlength="60" value="${esc(step ? step.label : '')}" placeholder="${esc(w.name)}"></label><label class="aw-lab">A note for this step (optional)<input id="awSNote" type="text" maxlength="400" value="${esc(step ? step.note : '')}" placeholder="Example: look at the 7th lord first"></label><div class="aw-prev"><small>Preview with the chart on screen</small><div id="awPrev" class="aw-prev-b"></div></div><button type="button" class="aw-btn pri full" data-act="savestep">${step ? 'Save step' : 'Add to routine'}</button>`, 'tall');
    previewCfg();
  }
  function previewCfg(){ const c = ST.pick && ST.pick.cfg, el = $('#awPrev', sheetEl); if (!c || !el) return; el.innerHTML = chart() ? AWW.render(c.w, chart(), prof(), c.o) : '<p class="aw-msg">Cast a chart to see a preview.</p>'; }
  function openToolConfig(id, step){
    const t = toolOf(id); if (!t) return;
    ST.pick = Object.assign(ST.pick || {}, { cfg: { tool: id, sid: step ? step.id : null } });
    sheet(step ? 'Edit step' : t[2], `<p class="aw-dim">${esc(t[3])}</p><p class="aw-dim">The real tool opens inside this step, fully usable.</p><label class="aw-lab">Your own title (optional)<input id="awLabel" type="text" maxlength="60" value="${esc(step ? step.label : '')}" placeholder="${esc(t[2])}"></label><label class="aw-lab">A note for this step (optional)<input id="awSNote" type="text" maxlength="400" value="${esc(step ? step.note : '')}"></label><button type="button" class="aw-btn pri full" data-act="savestep">${step ? 'Save step' : 'Add to routine'}</button>`, '');
  }
  function saveStep(){
    const cfg = ST.pick && ST.pick.cfg, r = ST.ed; if (!cfg || !r) return;
    const label = ($('#awLabel', sheetEl) || {}).value || '', note = ($('#awSNote', sheetEl) || {}).value || '';
    let s = cfg.sid ? r.steps.find(x => x.id === cfg.sid) : null;
    if (!s){ if (r.steps.length >= AW.MAXSTEPS){ toast('A routine can hold ' + AW.MAXSTEPS + ' steps.'); return; } s = AW.step(cfg.tool ? 'p' : 'w', cfg.tool || cfg.w, cfg.o || {}, label, note); r.steps.push(s); }
    else { s.label = label.trim().slice(0, 60); s.note = note.trim().slice(0, 400); if (cfg.w) s.o = AW.cleanOpts(cfg.w, cfg.o); }
    persist(); closeSheet(); drawEditor(); toast(cfg.sid ? 'Step saved.' : 'Step added.');
  }

  function shareSheet(id){
    const r = AW.get(id); if (!r) return; const code = AW.encode(r, window.AWV ? AWV.collect(r) : []), link = location.href.split('#')[0] + '#w=' + code;
    sheet('Share "' + r.name + '"', `<p class="aw-dim">Anyone who opens this code gets the same routine, ready for their own charts. It holds no birth details.</p><textarea class="aw-code" id="awCode" rows="4" readonly>${esc(code)}</textarea><div class="aw-sh-act"><button type="button" class="aw-btn pri" data-act="sharecode" data-id="${esc(id)}">Share the code</button><button type="button" class="aw-btn" data-act="sharelink" data-id="${esc(id)}">Share as a link</button><button type="button" class="aw-btn" data-act="dl" data-id="${esc(id)}">Save as a file</button></div>`, '');
  }
  function importSheet(){
    sheet('Import routines', `<p class="aw-dim">Paste a routine code, a link, or the contents of a backup file.</p><textarea class="aw-code" id="awImp" rows="5" placeholder="AW1.…" autocomplete="off"></textarea><div class="aw-sh-act"><button type="button" class="aw-btn pri" data-act="doimport">Import</button><label class="aw-btn file">Choose a file<input type="file" id="awFile" accept=".json,.txt,application/json,text/plain" hidden></label></div>`, '');
  }
  function importText(t){
    t = String(t || '').trim(); const found = []; let r, nv = 0;
    const take = d => { if (!d) return; if (d.vars && window.AWV){ const map = AWV.importDefs(d.vars); nv += Object.keys(map).length; AWV.remapRoutine(d, map); } delete d.vars; found.push(d); };
    if (t[0] === '['){ try { JSON.parse(t).forEach(x => take(AW.decode(JSON.stringify(x)))); } catch (e) {} }
    else if (t[0] === '{' && /"routines"\s*:/.test(t)){ try { const o = JSON.parse(t); if (window.AWV && Array.isArray(o.vars) && !(o.routines || []).length){ nv += Object.keys(AWV.importDefs(o.vars)).length; } else if (window.AWV && Array.isArray(o.vars)){ const map = AWV.importDefs(o.vars); nv += Object.keys(map).length; (o.routines || []).forEach(x => { const d = AW.decode(JSON.stringify(x)); if (d){ AWV.remapRoutine(d, map); delete d.vars; found.push(d); } }); } else (o.routines || []).forEach(x => take(AW.decode(JSON.stringify(x)))); } catch (e) {} }
    else if (/AW1\./.test(t)){ (t.match(/AW1\.[A-Za-z0-9_-]+/g) || []).forEach(c => take(AW.decode(c))); }
    else take(AW.decode(t));
    found.slice(0, 20).forEach(x => AW.save(x)); found.vars = nv; return found;
  }
  function moreSheet(id){
    const r = AW.get(id); if (!r) return;
    sheet(r.name, `<div class="aw-menu"><button type="button" data-act="pin" data-id="${esc(id)}">${r.pin ? '☆ Unpin from the top' : '★ Pin to the top'}</button><button type="button" data-act="dup" data-id="${esc(id)}">⧉ Duplicate</button><button type="button" data-act="share" data-id="${esc(id)}">⇪ Share</button><button type="button" class="danger" data-act="del" data-id="${esc(id)}">🗑 Delete</button></div>`, '');
  }

  /* ---------- present mode ---------- */
  function present(on){
    document.body.classList.toggle('aw-present', on);
    if (on && !exitEl){ exitEl = document.createElement('button'); exitEl.type = 'button'; exitEl.className = 'aw-exit vax-skip'; exitEl.textContent = '✕ Exit'; exitEl.setAttribute('data-act', 'unpresent'); document.body.appendChild(exitEl); exitEl.addEventListener('click', () => present(false)); }
    if (exitEl) exitEl.hidden = !on;
  }

  /* ---------- events ---------- */
  function mutateSteps(fn){ const r = ST.ed; if (!r) return; fn(r.steps); persist(); drawEditor(); }
  function onClick(e){
    const b = e.target.closest('[data-act]'); if (!b || !root.contains(b)) return; const a = b.dataset.act, id = b.dataset.id, sid = b.dataset.sid;
    act(a, b, id, sid);
  }
  function act(a, b, id, sid){
    const r = ST.ed;
    switch (a){
      case 'new': { const n = AW.blank('My routine'); AW.save(n); viewEdit(n.id); break; }
      case 'open': viewRun(id); break;
      case 'run': viewRun(id); break;
      case 'list': case 'done': ST.ed = null; viewList(); break;
      case 'edit': viewEdit(id); break;
      case 'share': closeSheet(); shareSheet(id); break;
      case 'more': moreSheet(id); break;
      case 'import': importSheet(); break;
      case 'finder': ST.find = null; viewFinder(); break;
      case 'newvar': { const n = AWV.blank('My variable'); AWV.save(n); viewVar(n.id); break; }
      case 'editvar': viewVar(id); break;
      case 'vdone': ST.vid = null; viewList(); break;
      case 'findvar': { ST.find = { subject: id, varga: 'D9', mode: 'one' }; AW.setUi({ find: ST.find }); viewFinder(); break; }
      case 'vmode': varMut(v => { if (b.dataset.v === 'pick'){ v.pick = v.pick || { m: 'shadbala', d: 'max', among: 'Jupiter,Venus,Mercury,Moon' }; } else { v.pick = null; v.start = v.start || 'role:DK'; } }); drawVar(true); break;
      case 'vadd': varMut(v => { if (v.steps.length >= AWV.MAXSTEP){ toast('Up to ' + AWV.MAXSTEP + ' steps.'); return; } v.steps.push({ op: 'lord' }); }); drawVar(true); break;
      case 'vdel': varMut(v => { v.steps.splice(+b.dataset.i, 1); }); drawVar(true); break;
      case 'vup': varMut(v => { AW.move(v.steps, +b.dataset.i, +b.dataset.i - 1); }); drawVar(true); break;
      case 'vdown': varMut(v => { AW.move(v.steps, +b.dataset.i, +b.dataset.i + 1); }); drawVar(true); break;
      case 'vpreset': varMut(v => { if (v.pick) v.pick.among = b.dataset.v; }); $('#awVAmong').innerHTML = amongChips((AWV.get(ST.vid).pick || {}).among); varPreview(); break;
      case 'vtoggle': varMut(v => { if (!v.pick) return; let cur = v.pick.among.split(',').filter(Boolean); const k = cur.indexOf(b.dataset.v); if (k >= 0){ if (cur.length > 1) cur.splice(k, 1); else toast('Keep at least one point.'); } else if (cur.length < 12) cur.push(b.dataset.v); v.pick.among = cur.join(','); }); $('#awVAmong').innerHTML = amongChips((AWV.get(ST.vid).pick || {}).among); varPreview(); break;
      case 'vdup': { const v = AWV.get(id); if (!v) break; const c = Object.assign({}, JSON.parse(JSON.stringify(v)), { id: AWV.uid(), name: (v.name + ' (copy)').slice(0, 40) }); const sv = AWV.save(c); toast('Duplicated.'); viewVar(sv.id); break; }
      case 'vremove': { const gone = AWV.remove(id); if (!gone) break; ST.vid = null; viewList(); toast('Variable deleted.', () => { AWV.save(gone); viewList(); }); break; }
      case 'fmode': ST.find.mode = b.dataset.v; findOut(); break;
      case 'fquick': ST.find.subject = b.dataset.v; { const sel = $('#awFSubj'); if (sel) sel.value = ST.find.subject; } $$('.aw-quick button').forEach(k => k.classList.toggle('on', k === b)); findOut(); break;
      case 'addtopick': { const all = AW.list(); sheet('Add to which routine?', all.length ? `<div class="aw-menu">${all.map(r => `<button type="button" data-act="addto" data-id="${esc(r.id)}">${esc(r.icon)} ${esc(r.name)} <small>· ${r.steps.length} steps</small></button>`).join('')}</div>` : '<p class="aw-msg">Make a routine first.</p>', ''); break; }
      case 'backup': download('astro-workspace-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify({ routines: AW.list(), vars: window.AWV ? AWV.list() : [] }, null, 1)); toast('Backup saved as a file.'); break;
      case 'starters': AW.starters().reverse().forEach(s => AW.save(s)); AW.setUi({ seeded: 1 }); viewList(); break;
      case 'go': go(+b.dataset.i); break;
      case 'prev': go(ST.step - 1); break;
      case 'next': go(ST.step + 1); break;
      case 'layout': { const x = AW.get(ST.rid); if (!x || x.layout === b.dataset.v) break; x.layout = b.dataset.v; AW.save(x); $$('.aw-modebar .aw-seg button').forEach(k => k.classList.toggle('on', k.dataset.v === x.layout)); paintStage(x); break; }
      case 'present': present(true); break;
      case 'fold': { collapsed[sid] = !collapsed[sid]; const el = b.closest('.aw-step'); if (el) el.classList.toggle('shut', !!collapsed[sid]); break; }
      case 'icon': if (r){ r.icon = b.dataset.v; persist(); $$('#awIcons button').forEach(k => k.classList.toggle('on', k === b)); } break;
      case 'color': if (r){ r.color = b.dataset.v; persist(); $$('#awColors button').forEach(k => k.classList.toggle('on', k === b)); $('.aw-ed').style.setProperty('--c', r.color); } break;
      case 'edlayout': if (r){ r.layout = b.dataset.v; persist(); $$('.aw-ed .aw-seg button').forEach(k => k.classList.toggle('on', k.dataset.v === r.layout)); } break;
      case 'addstep': openPicker(); break;
      case 'editstep': { const s = r && r.steps.find(x => x.id === sid); if (!s) break; ST.pick = {}; if (s.k === 'p') openToolConfig(s.t, s); else if (AW.WMAP[s.t]) openConfig(AW.WMAP[s.t], s); else toast('This card is not in this version.'); break; }
      case 'up': mutateSteps(st => { const i = st.findIndex(x => x.id === sid); AW.move(st, i, i - 1); }); break;
      case 'down': mutateSteps(st => { const i = st.findIndex(x => x.id === sid); AW.move(st, i, i + 1); }); break;
      case 'dupstep': mutateSteps(st => { const i = st.findIndex(x => x.id === sid); if (i < 0 || st.length >= AW.MAXSTEPS) return; const c = JSON.parse(JSON.stringify(st[i])); c.id = AW.sid(); st.splice(i + 1, 0, c); }); break;
      case 'delstep': { if (!r) break; const i = r.steps.findIndex(x => x.id === sid); if (i < 0) break; const gone = r.steps.splice(i, 1)[0]; persist(); drawEditor(); toast('Step removed.', () => { r.steps.splice(Math.min(i, r.steps.length), 0, gone); persist(); drawEditor(); }); break; }
      case 'dup': { closeSheet(); const d = AW.duplicate(id); if (d){ toast('Duplicated.'); if (ST.view === 'edit') viewEdit(d.id); else viewList(); } break; }
      case 'pin': { const x = AW.get(id); if (x){ x.pin = !x.pin; AW.save(x); } closeSheet(); viewList(); break; }
      case 'del': { closeSheet(); const gone = AW.remove(id); if (!gone) break; ST.ed = null; viewList(); toast('Routine deleted.', () => { AW.save(gone); viewList(); }); break; }
    }
  }
  function onSheetClick(e){
    const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act, id = b.dataset.id;
    switch (a){
      case 'close': closeSheet(); break;
      case 'ptab': ST.pick.tab = b.dataset.v; ST.pick.grp = ''; repaintPicker(); break;
      case 'pgrp': ST.pick.grp = b.dataset.v; repaintPicker(); break;
      case 'pickw': openConfig(AW.WMAP[id]); break;
      case 'picktool': openToolConfig(id); break;
      case 'savestep': saveStep(); break;
      case 'preset': case 'subjtoggle': { const cfg = ST.pick && ST.pick.cfg; if (!cfg) break; let cur = String(cfg.o.subjects || '').split(',').filter(Boolean);
        if (a === 'preset') cur = b.dataset.v ? b.dataset.v.split(',') : []; else { const v = b.dataset.v, i = cur.indexOf(v); if (i >= 0) cur.splice(i, 1); else if (cur.length < 12) cur.push(v); else toast('Up to 12 points.'); }
        cfg.o.subjects = cur.join(','); const box = $('#awSubj', sheetEl); if (box) box.innerHTML = subjChips(cfg.o.subjects); previewCfg(); break; }
      case 'addto': { const r = AW.get(id), f = ST.find; if (!r || !f) break; if (r.steps.length >= AW.MAXSTEPS){ toast('A routine can hold ' + AW.MAXSTEPS + ' steps.'); break; } r.steps.push(f.mode === 'all' ? AW.step('w', 'locateall', { subject: f.subject }) : AW.step('w', 'locate', { subject: f.subject, varga: f.varga })); AW.save(r); closeSheet(); toast('Added to "' + r.name + '".'); break; }
      case 'share': closeSheet(); shareSheet(id); break;
      case 'dup': case 'pin': case 'del': closeSheet(); act(a, b, id); break;
      case 'sharecode': { const r = AW.get(id); if (!r) break; const code = AW.encode(r, window.AWV ? AWV.collect(r) : []); if (navigator.share){ navigator.share({ title: r.name, text: code }).catch(() => {}); } else copyText(code).then(ok => toast(ok ? 'Code copied.' : 'Select the code and copy it.')); break; }
      case 'sharelink': { const r = AW.get(id); if (!r) break; const link = location.href.split('#')[0] + '#w=' + AW.encode(r, window.AWV ? AWV.collect(r) : []); if (navigator.share){ navigator.share({ title: r.name, url: link }).catch(() => {}); } else copyText(link).then(ok => toast(ok ? 'Link copied.' : 'Could not copy the link.')); break; }
      case 'dl': { const r = AW.get(id); if (r) download('routine-' + slug(r.name) + '.json', JSON.stringify(Object.assign({}, r, { vars: window.AWV ? AWV.collect(r) : [] }), null, 1)); break; }
      case 'doimport': { const f = importText(($('#awImp', sheetEl) || {}).value); if (!f.length && !f.vars){ toast('That does not look like a routine code.'); break; } closeSheet(); viewList(); toast(!f.length ? 'Imported ' + f.vars + ' variable' + (f.vars === 1 ? '.' : 's.') : f.length === 1 ? 'Imported "' + f[0].name + '".' : 'Imported ' + f.length + ' routines.'); break; }
    }
  }
  function onSheetInput(e){
    const t = e.target;
    if (t.id === 'awQ'){ ST.pick.q = t.value; repaintPicker(true); return; }
    if (t.id === 'awFile' && t.files && t.files[0]){ const rd = new FileReader(); rd.onload = () => { const f = importText(String(rd.result || '')); if (!f.length){ toast('That file has no routines.'); return; } closeSheet(); viewList(); toast('Imported ' + f.length + (f.length === 1 ? ' routine.' : ' routines.')); }; rd.readAsText(t.files[0]); return; }
    if (t.dataset && t.dataset.opt && ST.pick && ST.pick.cfg){ ST.pick.cfg.o[t.dataset.opt] = t.value; if (t.tagName === 'TEXTAREA'){ clearTimeout(onSheetInput.t); onSheetInput.t = setTimeout(previewCfg, 250); } else previewCfg(); }
  }
  function onInput(e){
    if (ST.view === 'var' && ST.vid){
      const t = e.target, f = t.dataset && t.dataset.vf;
      if (t.id === 'awVVarga'){ ST.vvarga = t.value; varPreview(); return; }
      if (!f) return;
      varMut(v => {
        if (f === 'name') v.name = t.value.slice(0, 40) || 'My variable';
        else if (f === 'start') v.start = t.value;
        else if (f === 'pm' && v.pick) v.pick.m = t.value;
        else if (f === 'pd' && v.pick) v.pick.d = t.value;
        else if (f === 'op'){ const s = v.steps[+t.dataset.i]; if (s){ s.op = t.value; if (s.op === 'from') s.n = s.n || 7; else delete s.n; } }
        else if (f === 'n'){ const s = v.steps[+t.dataset.i]; if (s) s.n = +t.value; }
      });
      if (f === 'name') { const d = $('#awVDesc'); if (d) d.textContent = AWV.describe(AWV.get(ST.vid)) + '.'; return; }
      if (f === 'pm' || f === 'op') drawVar(true); else varPreview();
      return;
    }
    if (ST.view === 'finder' && ST.find){ if (e.target.id === 'awFSubj'){ ST.find.subject = e.target.value; $$('.aw-quick button').forEach(k => k.classList.toggle('on', k.dataset.v === ST.find.subject)); findOut(); } else if (e.target.id === 'awFVarga'){ ST.find.varga = e.target.value; findOut(); } return; }
    const r = ST.ed; if (!r) return;
    if (e.target.id === 'awName'){ r.name = e.target.value.slice(0, 60) || 'My routine'; persist(); }
    else if (e.target.id === 'awNote'){ r.note = e.target.value.slice(0, 400); persist(); }
  }
  function onKey(e){
    if (!root || !document.getElementById('awRoot') || e.target.matches('input,textarea,select')) return;
    if (e.key === 'Escape'){ if (sheetEl && sheetEl.classList.contains('on')) closeSheet(); else if (document.body.classList.contains('aw-present')) present(false); return; }
    if (ST.view !== 'run' || !document.querySelector('#panel-workspace.active')) return;
    if (e.key === 'ArrowRight') go(ST.step + 1); else if (e.key === 'ArrowLeft') go(ST.step - 1);
  }
  let tx = 0, ty = 0, tOK = false;
  function onTouchStart(e){ const t = e.touches[0]; tx = t.clientX; ty = t.clientY; tOK = !e.target.closest('.aw-scroll,svg,.aw-embed,.aw-rail,input,textarea,select,.aw-cols'); }
  function onTouchEnd(e){ if (!tOK || ST.view !== 'run') return; const t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty; const r = AW.get(ST.rid); if (!r || r.layout !== 'flow') return; if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) go(ST.step + (dx < 0 ? 1 : -1)); }

  function bind(){
    if (bound && root.dataset.bound === '1') return;
    root.dataset.bound = '1'; bound = true;
    root.addEventListener('click', onClick); root.addEventListener('input', onInput); root.addEventListener('change', onInput);
    root.addEventListener('touchstart', onTouchStart, { passive: true }); root.addEventListener('touchend', onTouchEnd, { passive: true });
  }
  if (!window.__awKeys){ window.__awKeys = true; document.addEventListener('keydown', onKey); }

  /* ---------- opening the tab ---------- */
  function mount(){
    root = document.getElementById('awRoot'); if (!root) return;
    bind();
    const ui = AW.ui();
    if (!ui.seeded && !AW.list().length){ AW.starters().reverse().forEach(s => AW.save(s)); }
    AW.setUi({ seeded: 1 });
    if (ST.view === 'run' && ST.rid && AW.get(ST.rid)) viewRun(ST.rid, ST.step);
    else if (ST.view === 'edit' && ST.ed) viewEdit(ST.ed.id);
    else if (ST.view === 'finder') viewFinder();
    else if (ST.view === 'var' && ST.vid) viewVar(ST.vid);
    else viewList();
  }
  function leave(){ restoreAll(); present(false); closeSheet(); }

  if (typeof registerLatePanel === 'function') registerLatePanel('panel-workspace', () => '<div class="aw" id="awRoot"></div>');
  if (typeof window.switchAppTab === 'function'){
    const _s = window.switchAppTab;
    window.switchAppTab = function(id){
      if (id !== 'panel-workspace' && root && document.getElementById('awRoot')) leave();
      const out = _s.apply(this, arguments);
      if (id === 'panel-workspace'){ try { mount(); } catch (e) { if (window.console) console.warn('workspace', e); } }
      return out;
    };
  }
  /* a #w=AW1... link brings the routine in (a few bytes of work; nothing is drawn) */
  try { const m = /[#&]w=(AW1\.[A-Za-z0-9_-]+)/.exec(location.hash || ''); if (m){ const r = AW.decode(m[1]); if (r){ if (r.vars && window.AWV){ AWV.remapRoutine(r, AWV.importDefs(r.vars)); } delete r.vars; AW.save(r); imported = r.name; } } } catch (e) {}
  window.AWUI = { open: mount, openRoutine: id => { if (typeof switchAppTab === 'function') switchAppTab('panel-workspace'); setTimeout(() => viewRun(id), 0); }, restore: restoreAll };
})();

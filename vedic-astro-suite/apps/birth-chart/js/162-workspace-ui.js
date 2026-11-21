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
    const bit = s.t === 'chart2' ? ' · ' + o.a + ' and ' + o.b : o.varga ? ' · ' + o.varga : o.house ? ' · house ' + o.house : o.planet ? ' · ' + o.planet : '';
    return w.name + bit;
  }
  function stepSummary(s){
    if (s.k === 'p'){ const t = toolOf(s.t); return t ? 'Tool · ' + t[3] : 'This tool is not in this version.'; }
    const w = AW.WMAP[s.t]; if (!w) return 'This card is not in this version.';
    const bits = w.options.filter(x => x.values).map(x => { const v = (s.o || {})[x.k], p = x.values.find(q => q[0] === v); return p ? (p[1].length > 26 ? p[0] : p[1]) : ''; }).filter(Boolean);
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
    let h = `<header class="aw-hero">${MANDALA}<small>Astrologer Workspace</small><h2>Your routines</h2><p>Build what you always check, once, in your own order. Open it on any chart and every item comes up in sequence.</p>${chartPill()}<div class="aw-hero-act"><button type="button" class="aw-btn pri" data-act="new">＋ New routine</button><button type="button" class="aw-btn" data-act="import">Import</button>${all.length ? '<button type="button" class="aw-btn" data-act="backup">Back up all</button>' : ''}</div></header>`;
    if (imported){ h += `<div class="aw-banner">Imported from a link: <b>${esc(imported)}</b>. It is in your list below.</div>`; imported = ''; }
    if (!all.length) h += `<div class="aw-empty"><b>No routines yet</b><p>Make your first one, or bring back the starter set.</p><button type="button" class="aw-btn pri" data-act="starters">Add the starter routines</button></div>`;
    else h += `<section class="aw-grid">${sorted.map((r, i) => `<article class="aw-rc${r.pin ? ' pin' : ''}" style="--c:${esc(r.color)};--d:${Math.min(i, 8) * 45}ms"><button type="button" class="aw-rc-main" data-act="open" data-id="${esc(r.id)}" aria-label="Open ${esc(r.name)}"><span class="aw-rc-top"><span class="aw-ic">${esc(r.icon)}</span><b>${esc(r.name)}</b>${r.pin ? '<em title="Pinned">★</em>' : ''}</span>${r.note ? `<span class="aw-rc-note">${esc(r.note)}</span>` : ''}<span class="aw-rc-steps">${r.steps.slice(0, 9).map(s => `<i title="${esc(stepTitle(s))}">${esc(stepIcon(s))}</i>`).join('')}${r.steps.length > 9 ? `<i class="more">+${r.steps.length - 9}</i>` : ''}</span><span class="aw-rc-meta">${r.steps.length} step${r.steps.length === 1 ? '' : 's'}${r.uses ? ' · opened ' + r.uses + '×' : ''}${r.layout === 'board' ? ' · board' : ''}</span></button><span class="aw-rc-act"><button type="button" data-act="edit" data-id="${esc(r.id)}">Edit</button><button type="button" data-act="share" data-id="${esc(r.id)}">Share</button><button type="button" data-act="more" data-id="${esc(r.id)}" aria-label="More">⋯</button></span></article>`).join('')}</section>`;
    h += `<p class="aw-foot">Routines are saved on this device only. They hold no birth details, only what you check and in what order.</p>`;
    set(h); AW.setUi({ lastView: 'list' });
  }

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

  function optionsHtml(w, o){
    return w.options.map(x => x.values ? `<label class="aw-lab">${esc(x.label)}<select data-opt="${esc(x.k)}">${x.values.map(v => `<option value="${esc(v[0])}"${o[x.k] === v[0] ? ' selected' : ''}>${esc(v[1])}</option>`).join('')}</select></label>` : `<label class="aw-lab">${esc(x.label)}<textarea data-opt="${esc(x.k)}" rows="5" maxlength="1200" placeholder="Write a line or a checklist. Start a line with - for a tick box.">${esc(o[x.k] || '')}</textarea></label>`).join('');
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
    const r = AW.get(id); if (!r) return; const code = AW.encode(r), link = location.href.split('#')[0] + '#w=' + code;
    sheet('Share "' + r.name + '"', `<p class="aw-dim">Anyone who opens this code gets the same routine, ready for their own charts. It holds no birth details.</p><textarea class="aw-code" id="awCode" rows="4" readonly>${esc(code)}</textarea><div class="aw-sh-act"><button type="button" class="aw-btn pri" data-act="sharecode" data-id="${esc(id)}">Share the code</button><button type="button" class="aw-btn" data-act="sharelink" data-id="${esc(id)}">Share as a link</button><button type="button" class="aw-btn" data-act="dl" data-id="${esc(id)}">Save as a file</button></div>`, '');
  }
  function importSheet(){
    sheet('Import routines', `<p class="aw-dim">Paste a routine code, a link, or the contents of a backup file.</p><textarea class="aw-code" id="awImp" rows="5" placeholder="AW1.…" autocomplete="off"></textarea><div class="aw-sh-act"><button type="button" class="aw-btn pri" data-act="doimport">Import</button><label class="aw-btn file">Choose a file<input type="file" id="awFile" accept=".json,.txt,application/json,text/plain" hidden></label></div>`, '');
  }
  function importText(t){
    t = String(t || '').trim(); const found = []; let r;
    if (t[0] === '['){ try { JSON.parse(t).forEach(x => { const d = AW.decode(JSON.stringify(x)); if (d) found.push(d); }); } catch (e) {} }
    else if (/AW1\./.test(t)){ (t.match(/AW1\.[A-Za-z0-9_-]+/g) || []).forEach(c => { r = AW.decode(c); if (r) found.push(r); }); }
    else { r = AW.decode(t); if (r) found.push(r); }
    found.slice(0, 20).forEach(x => AW.save(x)); return found;
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
      case 'backup': download('astro-workspace-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(AW.list(), null, 1)); toast('Backup saved as a file.'); break;
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
      case 'share': closeSheet(); shareSheet(id); break;
      case 'dup': case 'pin': case 'del': closeSheet(); act(a, b, id); break;
      case 'sharecode': { const r = AW.get(id); if (!r) break; const code = AW.encode(r); if (navigator.share){ navigator.share({ title: r.name, text: code }).catch(() => {}); } else copyText(code).then(ok => toast(ok ? 'Code copied.' : 'Select the code and copy it.')); break; }
      case 'sharelink': { const r = AW.get(id); if (!r) break; const link = location.href.split('#')[0] + '#w=' + AW.encode(r); if (navigator.share){ navigator.share({ title: r.name, url: link }).catch(() => {}); } else copyText(link).then(ok => toast(ok ? 'Link copied.' : 'Could not copy the link.')); break; }
      case 'dl': { const r = AW.get(id); if (r) download('routine-' + slug(r.name) + '.json', JSON.stringify(r, null, 1)); break; }
      case 'doimport': { const f = importText(($('#awImp', sheetEl) || {}).value); if (!f.length){ toast('That does not look like a routine code.'); break; } closeSheet(); viewList(); toast(f.length === 1 ? 'Imported "' + f[0].name + '".' : 'Imported ' + f.length + ' routines.'); break; }
    }
  }
  function onSheetInput(e){
    const t = e.target;
    if (t.id === 'awQ'){ ST.pick.q = t.value; repaintPicker(true); return; }
    if (t.id === 'awFile' && t.files && t.files[0]){ const rd = new FileReader(); rd.onload = () => { const f = importText(String(rd.result || '')); if (!f.length){ toast('That file has no routines.'); return; } closeSheet(); viewList(); toast('Imported ' + f.length + (f.length === 1 ? ' routine.' : ' routines.')); }; rd.readAsText(t.files[0]); return; }
    if (t.dataset && t.dataset.opt && ST.pick && ST.pick.cfg){ ST.pick.cfg.o[t.dataset.opt] = t.value; if (t.tagName === 'TEXTAREA'){ clearTimeout(onSheetInput.t); onSheetInput.t = setTimeout(previewCfg, 250); } else previewCfg(); }
  }
  function onInput(e){
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
    root.addEventListener('click', onClick); root.addEventListener('input', onInput);
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
  try { const m = /[#&]w=(AW1\.[A-Za-z0-9_-]+)/.exec(location.hash || ''); if (m){ const r = AW.decode(m[1]); if (r){ AW.save(r); imported = r.name; } } } catch (e) {}
  window.AWUI = { open: mount, openRoutine: id => { if (typeof switchAppTab === 'function') switchAppTab('panel-workspace'); setTimeout(() => viewRun(id), 0); }, restore: restoreAll };
})();

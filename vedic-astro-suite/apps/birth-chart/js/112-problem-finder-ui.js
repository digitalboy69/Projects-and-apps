/* PROBLEM FINDER screens (PFUI): a guided questionnaire (what set it off, how it shows up, area of life, exact problem, how long)
   followed by the chart reasons from PRB.assess. Tab "🧭 Problem finder" in Chart Reading; Home tile opens the same tab.
   State lives on the .pf root element. */
const PFUI = (() => {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const STEPS = ['trigger', 'feel', 'area', 'problem', 'span'];
  const OPT = {
    trigger: { q: 'What set the problem off?', s: 'Think about where it started. Someone or something outside you, or something in your own mind and habits?', o: [
      ['ext', '⚡', 'From outside', 'A person, an event or a situation did it or caused it'], ['int', '🪞', 'From inside', 'My own thoughts, feelings, fears or habits'], ['both', '🔀', 'Both, or not sure', 'Outside and inside are mixed together']] },
    feel: { q: 'How does it show up for you?', s: 'Inner pain and real events are read from different parts of the chart.', o: [
      ['int', '💔', 'I feel it inside', 'Emotional or mental pain: sadness, worry, anger, emptiness'], ['ext', '🧱', 'It is happening for real', 'Harm, loss, conflict, money, health or a real-life situation'], ['both', '🌗', 'Both', 'I feel it inside and it is also happening outside']] },
    span: { q: 'How long has it been with you?', s: 'This decides whether to lean on your birth pattern or on today\'s sky.', o: [
      ['new', '🌱', 'Just started', 'Days or a few weeks'], ['months', '🗓️', 'A few months', 'It has been building'], ['years', '⏳', 'Years', 'It keeps coming back'], ['life', '♾️', 'As long as I remember', 'It feels part of my life']] }
  };
  const GRP = { delay: 'Delays and waiting', conflict: 'Conflict and arguments', loss: 'Loss and endings', pain: 'Hurt and pain', betrayal: 'Trust and betrayal', pressure: 'Pressure and strain', lack: 'Distance and emptiness', instability: 'Ups, downs and instability', harm: 'Harm and danger', confusion: 'Confusion and direction', general: 'Other' };
  const chart = () => (typeof currentChartForModal !== 'undefined' ? currentChartForModal : null);
  const st = root => root._pf || (root._pf = { step: 0, sel: {} });
  const dots = i => `<div class="pf-dots" aria-label="Step ${i + 1} of 5">${STEPS.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'on' : ''}"></i>`).join('')}</div>`;
  const crumbs = sel => {
    const a = sel.area && PRB.area(sel.area), p = a && sel.problem && a.problems.find(x => x.id === sel.problem), L = [];
    if (sel.trigger) L.push(sel.trigger === 'ext' ? 'From outside' : sel.trigger === 'int' ? 'From inside' : 'Outside and inside');
    if (sel.feel) L.push(sel.feel === 'int' ? 'Felt inside' : sel.feel === 'ext' ? 'Real events' : 'Inside and real events');
    if (a) L.push(a.emoji + ' ' + a.name); if (p) L.push(p.label);
    return L.length ? `<div class="pf-crumbs">${L.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : '';
  };
  function stepHtml(root) {
    const S = st(root), key = STEPS[S.step], sel = S.sel; let body = '', q, sub;
    if (OPT[key]) { q = OPT[key].q; sub = OPT[key].s; body = `<div class="pf-opts">${OPT[key].o.map(o => `<button type="button" class="pf-o${sel[key] === o[0] ? ' on' : ''}" data-pf="pick" data-k="${key}" data-v="${o[0]}"><b class="pf-oi">${o[1]}</b><span><strong>${esc(o[2])}</strong><small>${esc(o[3])}</small></span></button>`).join('')}</div>`; }
    else if (key === 'area') { q = 'Which part of life is it in?'; sub = 'Pick the area that hurts most right now.'; body = `<div class="pf-areas">${PRB.areas.map(a => `<button type="button" class="pf-a${sel.area === a.id ? ' on' : ''}" data-pf="pick" data-k="area" data-v="${a.id}"><span>${a.emoji}</span><b>${esc(a.name)}</b></button>`).join('')}</div>`; }
    else { const a = PRB.area(sel.area); q = 'What exactly is the problem?'; sub = `${a.problems.length} options for ${a.name.toLowerCase()}. Choose the one that fits ${a.who} best.`; const G = []; a.problems.forEach(p => { let g = G.find(x => x.n === p.nature); if (!g) G.push(g = { n: p.nature, l: [] }); g.l.push(p); });
      body = `${a.problems.length > 10 ? '<input type="search" class="pf-find" placeholder="Type a word to find your problem" aria-label="Find your problem" autocomplete="off">' : ''}<div class="pf-groups">${G.map(g => `<div class="pf-grp" data-n="${g.n}"><h5 class="pf-gh">${esc(GRP[g.n] || 'Other')}</h5><div class="pf-list">${g.l.map(p => `<button type="button" class="pf-p${sel.problem === p.id ? ' on' : ''}" data-pf="pick" data-k="problem" data-v="${p.id}"><i></i><span>${esc(p.label)}</span></button>`).join('')}</div></div>`).join('')}<p class="pf-none" hidden>Nothing matches. Try another word, or clear the box.</p></div>`; }
    return `${dots(S.step)}${crumbs(sel)}<h4 class="pf-q">${esc(q)}</h4><p class="pf-s">${esc(sub)}</p>${body}<div class="pf-nav">${S.step ? '<button type="button" class="pf-back" data-pf="back">← Back</button>' : '<span></span>'}<button type="button" class="pf-link" data-pf="reset">Start over</button></div>`;
  }
  function resultHtml(root) {
    const S = st(root), c = chart(); let R; try { R = PRB.assess(c, S.sel, { now: new Date() }); } catch (e) { R = null; }
    if (!R) return `<p class="pf-s">The reading could not be built for this chart.</p><div class="pf-nav"><button type="button" class="pf-back" data-pf="reset">Start over</button></div>`;
    const lv = { light: 1, clear: 2, strong: 3 }[R.level], lt = { light: 'Light indications', clear: 'Clear indications', strong: 'Strong indications' }[R.level];
    const sec = (s, i) => `<details class="pf-sec"${s.id === 'check' || s.id === 'signature' || s.id === 'timing' ? ' open' : ''}><summary><span class="pf-se">${s.emoji}</span><b>${esc(s.title)}</b><i></i></summary><p class="pf-si">${esc(s.intro)}</p><ul>${s.items.map(it => `<li class="t-${it.tone}"><i></i><span>${esc(it.text)}</span></li>`).join('')}</ul></details>`;
    return `${crumbs(S.sel)}<div class="pf-res"><div class="pf-top"><div class="pf-lv" data-lv="${lv}"><span><i></i><i></i><i></i></span><b>${lt}</b></div><p class="pf-lt">${esc(R.levelText)}</p></div>
      <div class="pf-rk"><h5 class="pf-h5">${R.ranked.length ? `Most likely reasons for "${esc(R.problemLabel)}"` : 'No strong reason found'}</h5>${R.ranked.length ? '<p class="pf-rkn">Ranked for this exact problem, strongest first. This is a relative ranking from your chart, not a statistic.</p>' : `<p class="pf-rkn">${esc(R.sections[0].items[0].text)}</p>`}
        <ol class="pf-rank">${R.ranked.map(r => `<li class="pf-r pf-l-${r.label.toLowerCase()}"><div class="pf-rh"><b class="pf-rn">${r.rank}</b><span class="pf-rt">${esc(r.head)}</span></div><div class="pf-rm"><i class="pf-chip">${esc(r.label)}</i><i class="pf-chip pf-when">${esc(r.when)}</i></div><p>${esc(r.text)}</p>${r.also && r.also.length ? `<p class="pf-also">Also pointing the same way: ${esc(r.also.join('; '))}.</p>` : ''}</li>`).join('')}</ol></div>
      <details class="pf-more"><summary><b>Read more</b><span>${R.others ? R.others + ' more possible reason' + (R.others > 1 ? 's' : '') + ' and ' : ''}the full chart check, house by house</span><i></i></summary>${R.sections.map(sec).join('')}</details>
      <div class="pf-help"><h5 class="pf-h5">What tends to help</h5><ul>${R.help.map(h => `<li>${esc(h)}</li>`).join('')}</ul><p class="pf-safe">${esc(R.safety)}</p></div>
      <div class="pf-nav pf-end"><button type="button" class="pf-back" data-pf="again">Another problem</button><button type="button" class="pf-link" data-pf="reset">Start over</button></div></div>`;
  }
  function render(root) {
    const S = st(root), stage = root.querySelector('.pf-stage'); if (!stage) return;
    const html = S.step >= STEPS.length ? resultHtml(root) : stepHtml(root);
    stage.classList.remove('in'); stage.innerHTML = html; void stage.offsetWidth; stage.classList.add('in');
    root.classList.toggle('pf-done', S.step >= STEPS.length);
    if (S.step >= STEPS.length || S.moved) { const top = root.getBoundingClientRect().top; if (top < 0 || top > innerHeight * 0.6) root.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
  }
  function onClick(e) {
    const b = e.target.closest && e.target.closest('[data-pf]'); if (!b) return; const root = b.closest('.pf'); if (!root) return; const S = st(root), act = b.dataset.pf; S.moved = true;
    if (act === 'pick') { const k = b.dataset.k; S.sel[k] = b.dataset.v; if (k === 'area') delete S.sel.problem; b.parentNode.querySelectorAll('.on').forEach(x => x.classList.remove('on')); b.classList.add('on'); setTimeout(() => { S.step = Math.min(STEPS.length, S.step + 1); render(root); }, 220); }
    else if (act === 'back') { S.step = Math.max(0, S.step - 1); render(root); }
    else if (act === 'reset') { root._pf = null; render(root); }
    else if (act === 'again') { S.step = 2; delete S.sel.area; delete S.sel.problem; render(root); }
  }
  document.addEventListener('click', onClick);
  document.addEventListener('input', e => { const f = e.target.closest && e.target.closest('.pf-find'); if (!f) return; const q = f.value.trim().toLowerCase(), root = f.closest('.pf'); let any = false;
    root.querySelectorAll('.pf-grp').forEach(g => { let n = 0; g.querySelectorAll('.pf-p').forEach(b => { const hit = !q || b.textContent.toLowerCase().indexOf(q) >= 0; b.hidden = !hit; if (hit) n++; }); g.hidden = !n; if (n) any = true; });
    const none = root.querySelector('.pf-none'); if (none) none.hidden = any; });
  function pane() { const r = document.createElement('div'); return `<div class="pf" data-pf-root><div class="pf-hero"><div class="pf-ico">🧭</div><div><h3>Problem finder</h3><p>Choose what is troubling you, step by step. You get the reasons your chart gives for it, in plain words.</p></div></div><div class="pf-stage in">${stepHtml({ _pf: { step: 0, sel: {} } })}</div></div>`; }
  /* the stage inside a freshly built pane is plain HTML; bind its state lazily on first click */
  document.addEventListener('click', e => { const root = e.target.closest && e.target.closest('.pf'); if (root && !root._pf) root._pf = { step: 0, sel: {} }; }, true);
  function open() {
    try { if (typeof switchAppTab === 'function') switchAppTab('panel-reading'); } catch (x) {}
    let n = 0; const t = setInterval(() => { const b = [...document.querySelectorAll('#panel-reading .rd>.vx-tabs button')].find(x => /Problem finder/.test(x.textContent)); if (b) { clearInterval(t); b.click(); try { b.scrollIntoView({ inline: 'center', block: 'nearest' }); } catch (x) {} const r = document.querySelector('#panel-reading .pf'); if (r) r.scrollIntoView({ block: 'start', behavior: 'smooth' }); } else if (++n > 40) clearInterval(t); }, 100);
  }
  const prev = window.switchAppTab; if (typeof prev === 'function') window.switchAppTab = function (id) { if (id === 'panel-problem') return open(); return prev.apply(this, arguments); };
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-go="panel-problem"]'); if (b) { e.preventDefault(); e.stopImmediatePropagation(); open(); } }, true);
  return { pane, render, open };
})();
window.PFUI = PFUI;

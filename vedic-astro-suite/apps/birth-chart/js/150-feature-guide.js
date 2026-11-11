/* Feature Guide (js/150): a searchable, illustrated manual for every tool. Data lives in js/149 (FG_DATA); tool names, icons and groups come from
   HOME_ITEMS (js/25) and THB.CATS (js/147), so it can never drift from the app. Cards open one at a time; "Open this tool" uses switchAppTab.
   Search looks at the title, description, what/when text, steps, key terms and the everyday words in THB.WORDS. Classes fg- prefixed; animates only opacity/transform.
   Registered as panel-guide (registerLatePanel, js/120). Tests: tests/feature_guide_test.js, tests/feature_guide_browser_test.py. */
const FG = (() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const item = id => (typeof HOME_ITEMS !== 'undefined' ? HOME_ITEMS : []).find(i => i[0] === id);
  const ST = { q: '', cat: 'all', open: '' };
  const groups = () => (typeof THB !== 'undefined' ? THB.groups() : [{ id: 'all', title: 'All tools', col: '#D4AF37', items: (typeof HOME_ITEMS !== 'undefined' ? HOME_ITEMS : []) }]);
  const words = id => (typeof THB !== 'undefined' && THB.WORDS[id]) || '';
  const entry = id => (FG_DATA.e[id] || null);
  function hay(i, g) {
    const e = entry(i[0]) || {};
    return [i[2], i[3], g.title, words(i[0]), e.what, e.when, (e.how || []).join(' '), (e.terms || []).map(t => t.join(' ')).join(' '), e.tip].join(' ').toLowerCase();
  }
  function search(q) {
    const t = String(q || '').toLowerCase().split(/\s+/).filter(Boolean); if (!t.length) return null;
    const out = [];
    groups().forEach(g => g.items.forEach(i => {
      const h = hay(i, g), ti = i[2].toLowerCase();
      if (t.every(w => h.indexOf(w) >= 0)) out.push({ i, g, score: t.reduce((s, w) => s + (ti.indexOf(w) === 0 ? 5 : ti.indexOf(w) > 0 ? 4 : (words(i[0]).indexOf(w) >= 0 ? 2 : 1)), 0) });
    }));
    return out.sort((a, b) => b.score - a.score);
  }
  function card(i, g) {
    const e = entry(i[0]), on = ST.open === i[0];
    if (!e) return '';
    const see = (e.see || []).map(item).filter(Boolean);
    const body = on ? `<div class="fg-body" role="region">
        <div class="fg-blk"><h5>What it does</h5><p>${esc(e.what)}</p></div>
        <div class="fg-blk"><h5>Use it when</h5><p>${esc(e.when)}</p></div>
        <div class="fg-blk"><h5>How to use it</h5><ol class="fg-steps">${e.how.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol></div>
        ${e.terms && e.terms.length ? `<div class="fg-blk"><h5>Words you will see</h5><dl class="fg-terms">${e.terms.map(t => `<dt>${esc(t[0])}</dt><dd>${esc(t[1])}</dd>`).join('')}</dl></div>` : ''}
        <div class="fg-tip"><b>Good to know</b><span>${esc(e.tip)}</span></div>
        ${see.length ? `<div class="fg-blk"><h5>Read it with</h5><div class="fg-see">${see.map(s => `<button type="button" class="fg-chip" data-fg="open" data-id="${s[0]}">${s[1]} ${esc(s[2])}</button>`).join('')}</div></div>` : ''}
        <button type="button" class="fg-go" data-fg="go" data-id="${i[0]}">Open ${esc(i[2])} <span aria-hidden="true">→</span></button>
      </div>` : '';
    return `<article class="fg-card${on ? ' on' : ''}" id="fg-${i[0]}" style="--c:${g.col}"><button type="button" class="fg-head" data-fg="tog" data-id="${i[0]}" aria-expanded="${on}"><span class="fg-i">${i[1]}</span><span class="fg-t"><b>${esc(i[2])}</b><small>${esc(e.what.split('. ')[0].replace(/\.$/, ''))}.</small></span><span class="fg-ch" aria-hidden="true">›</span></button>${body}</article>`;
  }
  function list() {
    const s = search(ST.q);
    if (s) return s.length ? `<div class="fg-cnt">${s.length} ${s.length === 1 ? 'tool' : 'tools'} found</div>${s.map(x => card(x.i, x.g)).join('')}` : `<div class="fg-empty"><b>Nothing matches "${esc(ST.q)}"</b><span>Try one plain word, like marriage, time, strength or today.</span></div>`;
    let h = '';
    if (ST.cat === 'all') h += `<section class="fg-sec fg-tabs"><h3><i></i>The six tabs at the bottom</h3><div class="fg-tg">${FG_DATA.tabs.map(t => `<div class="fg-tab"><span>${t[0]}</span><b>${esc(t[1])}</b><small>${esc(t[2])}</small></div>`).join('')}</div></section>`;
    groups().filter(g => ST.cat === 'all' || g.id === ST.cat).forEach(g => { h += `<section class="fg-sec" style="--c:${g.col}"><h3><i></i>${esc(g.title)}<em>${g.items.length}</em></h3><p class="fg-use">${esc(g.use)}</p>${g.items.map(i => card(i, g)).join('')}</section>`; });
    return h;
  }
  function html() {
    const G = groups(), n = G.reduce((a, g) => a + g.items.length, 0);
    return `<div class="fg"><div class="fg-hero"><div class="fg-glow" aria-hidden="true"></div><span class="fg-kick">FEATURE GUIDE</span><h3>Every tool, explained</h3><p>${n} tools. Search a word, or pick a group. Tap any card to see what it does, when to use it and the steps.</p></div>
      <div class="fg-sb"><input type="search" id="fgQ" class="fg-q" placeholder="Search: marriage, time, strength…" aria-label="Search the guide" autocomplete="off" value="${esc(ST.q)}"></div>
      <div class="fg-chips" id="fgChips" role="tablist" aria-label="Groups"><button type="button" role="tab" class="${ST.cat === 'all' ? 'on' : ''}" data-fg="cat" data-c="all">All</button>${G.map(g => `<button type="button" role="tab" class="${ST.cat === g.id ? 'on' : ''}" data-fg="cat" data-c="${g.id}" style="--c:${g.col}">${esc(g.title)}</button>`).join('')}</div>
      <div id="fgBody">${list()}</div></div>`;
  }
  const redraw = () => { const b = document.getElementById('fgBody'); if (b) b.innerHTML = list(); };
  function bind() {
    document.addEventListener('input', e => { if (e.target.id !== 'fgQ') return; ST.q = e.target.value; ST.open = ''; redraw(); });
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-fg]'); if (!b) return; const root = b.closest('.fg'); if (!root) return;
      const k = b.dataset.fg, id = b.dataset.id;
      if (k === 'tog') { ST.open = ST.open === id ? '' : id; redraw(); const c = document.getElementById('fg-' + id); if (c && ST.open && c.scrollIntoView) c.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
      if (k === 'go') { if (typeof switchAppTab === 'function') switchAppTab(id); return; }
      if (k === 'open') { ST.q = ''; ST.cat = 'all'; ST.open = id; const q = root.querySelector('#fgQ'); if (q) q.value = ''; root.querySelectorAll('#fgChips button').forEach((x, n) => x.classList.toggle('on', n === 0)); redraw(); const c = document.getElementById('fg-' + id); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
      if (k === 'cat') { ST.cat = b.dataset.c; ST.q = ''; ST.open = ''; const q = root.querySelector('#fgQ'); if (q) q.value = ''; root.querySelectorAll('#fgChips button').forEach(x => x.classList.toggle('on', x === b)); redraw(); }
    });
  }
  if (typeof document !== 'undefined' && document.addEventListener) bind();
  window.buildGuidePanel = function () { ST.q = ''; ST.cat = 'all'; ST.open = ''; return html(); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-guide', window.buildGuidePanel);
  return { ST, groups, search, html, entry };
})();

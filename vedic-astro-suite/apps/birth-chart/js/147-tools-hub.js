/* Tools hub (js/147): one tab that lists EVERY tool in the app (HOME_ITEMS, js/25), grouped by what the person wants to do, with a live search,
   "I want to..." chips, and a Recently used row. It adds no astrology; it only organises what exists.
   Any tool missing from CATS below lands in "More tools", so a new Home tile can never be lost (tests/tools_hub_test.js checks every tool is listed once).
   Search looks at the tool's title, description, its group name and the plain words in WORDS (everyday phrases people type, e.g. "marriage" for matching).
   Recently used is kept in localStorage (try/catch; the page works without it). Classes th- prefixed. Uses HOME_ITEMS, switchAppTab (js/25), registerLatePanel (js/120). */
const THB = (() => {
  /* [id, title, "use it when you want to...", color, [panel ids]] */
  const CATS = [
    ['read', 'Read my chart', 'Understand my chart in plain words', '#D4AF37', ['panel-reading', 'panel-problem', 'panel-overview', 'panel-avakahada', 'panel-planets', 'panel-bhava', 'panel-vargas', 'panel-lagnas']],
    ['now', 'Today & now', 'See what the sky is doing today', '#5EC4B7', ['panel-today', 'panel-active', 'panel-transit', 'panel-choghadiya', 'panel-panchanga', 'panel-pcal', 'panel-prashna', 'panel-chakra']],
    ['timing', 'Life timing & cycles', 'Know which period of life is running and what comes next', '#8A6FB8', ['panel-dasha', 'panel-dashasys', 'panel-transits', 'panel-sudarshana', 'panel-tithi', 'panel-vbday', 'panel-yeartimeline']],
    ['strength', 'Planet & house strength', 'Check how strong or weak each planet and house is', '#6B7FA3', ['panel-shadbala', 'panel-bhavabala', 'panel-vimshopaka', 'panel-avasthas', 'panel-ashtakavarga', 'panel-asx', 'panel-fate', 'panel-sensitive', 'panel-upagrahas']],
    ['deeper', 'Combinations & deeper study', 'Look for yogas, doshas and a second opinion on a house', '#4F8FBF', ['panel-yogas', 'panel-dosha', 'panel-argala', 'panel-bhavat', 'panel-kp', 'panel-sahams', 'panel-relationships', 'panel-triggerlab', 'panel-meaninglab']],
    ['people', 'People & compatibility', 'Compare my chart with someone else', '#D96C9B', ['panel-match', 'panel-synastry']],
    ['fix', 'Fix the birth time or date', 'Correct an uncertain birth time or find a forgotten birth date', '#E0A64A', ['panel-rectification', 'panel-lifeevents', 'panel-sandhi', 'panel-vargatimeline', 'panel-transittimer', 'panel-datefinder']],
    ['learn', 'Learn & look things up', 'Learn the basics or look up a planet, sign or number', '#7FB77E', ['panel-atlas', 'panel-planetency', 'panel-numerology']],
    ['share', 'Export & help', 'Save, share or ask the developer', '#C95050', ['panel-export', 'panel-contact']]
  ];
  /* everyday words people type; added to the search text only */
  const WORDS = {
    'panel-reading': 'summary report life areas career money health love explain', 'panel-problem': 'worry trouble issue question why delay struggle',
    'panel-overview': 'kundli horoscope birth chart lagna rashi', 'panel-avakahada': 'kundli table varna yoni gana nadi paya name letter',
    'panel-today': 'daily horoscope good day chandrabala tarabala', 'panel-active': 'now current houses lit',
    'panel-transit': 'gochar current planets live today sky', 'panel-choghadiya': 'muhurat good time bad time rahu kalam slot',
    'panel-panchanga': 'panchang almanac tithi nakshatra yoga karana sunrise sunset', 'panel-pcal': 'festival ekadashi purnima amavasya eclipse holiday diwali month',
    'panel-prashna': 'horary ask question now', 'panel-chakra': 'sarvatobhadra kota shoola vedha',
    'panel-dasha': 'mahadasha antardasha vimshottari period running', 'panel-transits': 'sade sati saturn jupiter rahu ketu ingress',
    'panel-match': 'marriage matching gun milan ashtakoota partner manglik', 'panel-synastry': 'marriage compatibility couple partner two charts relationship',
    'panel-dosha': 'manglik kaal sarp pitru gand mool remedy problem', 'panel-yogas': 'raj yoga dhana combination',
    'panel-rectification': 'birth time wrong unsure correct fix', 'panel-datefinder': 'forgotten birth date festival family remembers',
    'panel-numerology': 'name number lucky', 'panel-atlas': 'basics beginner learn glossary', 'panel-shadbala': 'planet power strength', 'panel-ashtakavarga': 'bindu points sarvashtakavarga',
    'panel-asx': 'prastara sodhana kakshya reduction transit points', 'panel-export': 'download pdf copy share save report', 'panel-contact': 'bug feedback help support'
  };
  const KEY = 'vax_tools_recent';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const item = id => (typeof HOME_ITEMS !== 'undefined' ? HOME_ITEMS : []).find(i => i[0] === id);

  /* final grouping: the lists above plus anything not named in them */
  function groups() {
    const all = (typeof HOME_ITEMS !== 'undefined' ? HOME_ITEMS : []), placed = new Set(), out = [];
    CATS.forEach(c => { const its = c[4].map(item).filter(Boolean); its.forEach(i => placed.add(i[0])); out.push({ id: c[0], title: c[1], use: c[2], col: c[3], items: its }); });
    const rest = all.filter(i => !placed.has(i[0]));
    if (rest.length) out.push({ id: 'more', title: 'More tools', use: 'Everything else', col: '#9aa3bd', items: rest });
    return out;
  }
  function recent() { try { return JSON.parse(localStorage.getItem(KEY) || '[]').filter(item).slice(0, 4); } catch (e) { return []; } }
  function remember(id) {
    if (!item(id) || id === 'panel-export' || id === 'panel-contact') return;
    try { const r = [id].concat(JSON.parse(localStorage.getItem(KEY) || '[]').filter(x => x !== id)).slice(0, 8); localStorage.setItem(KEY, JSON.stringify(r)); } catch (e) { /* no storage: fine */ }
  }
  /* search: every word typed must appear somewhere in title, description, group or everyday words */
  function search(q) {
    const t = String(q || '').toLowerCase().split(/\s+/).filter(Boolean); if (!t.length) return null;
    const res = [];
    groups().forEach(g => g.items.forEach(i => {
      const hay = (i[2] + ' ' + i[3] + ' ' + g.title + ' ' + i[4] + ' ' + (WORDS[i[0]] || '')).toLowerCase(), title = i[2].toLowerCase();
      if (!t.every(w => hay.indexOf(w) >= 0)) return;
      res.push({ item: i, group: g, score: t.reduce((s, w) => s + (title.indexOf(w) === 0 ? 4 : title.indexOf(w) > 0 ? 3 : 1), 0) });
    }));
    return res.sort((a, b) => b.score - a.score);
  }
  const row = (i, g, showGroup) => `<button type="button" class="th-r" data-th="go" data-id="${i[0]}" style="--c:${g.col}"><span class="th-i">${i[1]}</span><span class="th-t"><b>${esc(i[2])}</b><small>${esc(i[3])}</small>${showGroup ? `<em>${esc(g.title)}</em>` : ''}</span><i class="th-ch" aria-hidden="true">›</i></button>`;
  const ST = { q: '', cat: 'all' };
  function list() {
    const s = search(ST.q);
    if (s) return s.length ? `<div class="th-res"><div class="th-cnt">${s.length} ${s.length === 1 ? 'tool' : 'tools'} found</div>${s.map(x => row(x.item, x.group, true)).join('')}</div>` : `<div class="th-empty"><b>No tool matches "${esc(ST.q)}"</b><span>Try a simpler word such as marriage, today, strength or time.</span></div>`;
    const G = groups().filter(g => ST.cat === 'all' || g.id === ST.cat);
    let h = '';
    if (ST.cat === 'all') { const r = recent(); if (r.length) h += `<section class="th-sec" style="--c:#D4AF37"><h3><i></i>Recently used<em>${r.length}</em></h3><div class="th-list">${r.map(id => row(item(id), groups().find(g => g.items.some(i => i[0] === id)) || { col: '#D4AF37', title: '' }, false)).join('')}</div></section>`; }
    h += G.map(g => `<section class="th-sec" id="th-${g.id}" style="--c:${g.col}"><h3><i></i>${esc(g.title)}<em>${g.items.length}</em></h3><p class="th-use">${esc(g.use)}</p><div class="th-list">${g.items.map(i => row(i, g, false)).join('')}</div></section>`).join('');
    return h;
  }
  function html() {
    const G = groups(), n = G.reduce((a, g) => a + g.items.length, 0);
    return `<div class="th"><div class="th-hero"><h3>All Tools</h3><p>${n} tools, grouped by what you want to do. Search, or pick a group.</p></div>
      <div class="th-sb"><input type="search" id="thQ" class="th-q" placeholder="Try: marriage, today, strength" aria-label="Search tools" autocomplete="off" value="${esc(ST.q)}"></div>
      <div class="th-chips" id="thChips" role="tablist" aria-label="Tool groups"><button type="button" role="tab" class="${ST.cat === 'all' ? 'on' : ''}" data-th="cat" data-c="all">All</button>${G.map(g => `<button type="button" role="tab" class="${ST.cat === g.id ? 'on' : ''}" data-th="cat" data-c="${g.id}" style="--c:${g.col}">${esc(g.title)}</button>`).join('')}</div>
      <div id="thBody">${list()}</div></div>`;
  }
  function bind() {
    document.addEventListener('input', e => { if (e.target.id !== 'thQ') return; ST.q = e.target.value; const b = document.getElementById('thBody'); if (b) b.innerHTML = list(); });
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-th]'); if (!b) return; const root = b.closest('.th'); if (!root) return;
      if (b.dataset.th === 'go') { if (typeof switchAppTab === 'function') switchAppTab(b.dataset.id); return; }
      if (b.dataset.th === 'cat') { ST.cat = b.dataset.c; ST.q = ''; const q = root.querySelector('#thQ'); if (q) q.value = ''; root.querySelectorAll('#thChips button').forEach(x => x.classList.toggle('on', x === b)); root.querySelector('#thBody').innerHTML = list(); try { b.scrollIntoView({ inline: 'center', block: 'nearest' }); } catch (x) { /* older browser */ } }
    });
  }
  if (typeof document !== 'undefined' && document.addEventListener) bind();
  /* the bottom bar: highlight Tools, show its title, remember opened tools */
  if (typeof switchAppTab === 'function') {
    const _s = window.switchAppTab || switchAppTab;
    window.switchAppTab = function (id) {
      const r = _s.apply(this, arguments);
      try {
        remember(id);
        if (id === 'panel-tools') {
          document.querySelectorAll('.app-tab').forEach(t => t.classList.toggle('active', t.dataset.group === 'tools'));
          const h1 = document.querySelector('.brand-text h1'); if (h1 && document.body.classList.contains('app-mode')) { if (!h1.dataset.orig) h1.dataset.orig = h1.textContent; h1.textContent = 'All Tools'; }
          const bk = document.getElementById('panelBack'); if (bk) { bk.style.display = 'none'; }
          document.body.classList.remove('on-sub');
          if (ST.q === '' && ST.cat === 'all') { const b = document.getElementById('thBody'); if (b) b.innerHTML = list(); }
        }
      } catch (e) { /* the tab still works */ }
      return r;
    };
  }
  window.buildToolsPanel = function () { ST.q = ''; ST.cat = 'all'; return html(); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-tools', window.buildToolsPanel);
  return { CATS, WORDS, groups, search, recent, remember, html, state: ST };
})();

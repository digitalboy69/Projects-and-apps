/* Quick Menu: a top-left menu button inside every tool. Tap it to jump to any tool or tab, pin favourites and make your own groups.
   Pins and groups are saved in localStorage (key vedicQuickMenu_v1) and shared by all tools. Each item keeps its own icon and label,
   so a pin made in one tool still shows correctly in the others. Tool switching goes through the shell (postMessage {vqm:'go'}). */
(function(){
  if (window.VQM) return;
  var D = document, KEY = 'vedicQuickMenu_v1';
  var TOOLS = [['A', '\uD83C\uDF0C', '3D Sky'], ['B', '\uD83E\uDDED', 'Birth Chart'], ['N', '\uD83D\uDCDD', 'Notepad']];
  var me = D.getElementById('appTabbar') ? 'B' : D.querySelector('.panel-tab[data-tab]') ? 'A' : 'N';
  var S = { pins: [], groups: [], open: {}, recent: [] }, picking = '', org = false, box, panel, list, q, btnEl, orgBtn, cnt;
  var nameOf = function(k){ for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i][0] === k) return TOOLS[i][2]; return ''; };

  function load(){ try{ var j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && Array.isArray(j.pins) && Array.isArray(j.groups)) S = j; }catch(e){} if (!S.open) S.open = {}; if (!Array.isArray(S.recent)) S.recent = []; }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
  function h(t, c, x){ var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function btn(c, x, label, fn){ var b = h('button', c, x); b.type = 'button'; if (label) b.setAttribute('aria-label', label); b.onclick = function(ev){ ev.stopPropagation(); fn(); }; return b; }
  function toast(m){ var t = h('div', 'vq-toast', m); D.body.appendChild(t); setTimeout(function(){ t.remove(); }, 2600); }

  /* ---- what can I jump to inside THIS tool ---- */
  function tabs(){
    var out = [];
    if (me === 'B' && typeof HOME_ITEMS !== 'undefined'){
      out.push({ k: 'B:panel-home', tool: 'B', id: 'panel-home', ic: '\uD83C\uDFE0', t: 'Home', s: 'Start' });
      HOME_ITEMS.forEach(function(i){ out.push({ k: 'B:' + i[0], tool: 'B', id: i[0], ic: i[1], t: i[2], s: i[4], d: i[3] || '' }); });
    } else if (me === 'A'){
      D.querySelectorAll('.panel-tab[data-tab]').forEach(function(b){
        var t = b.lastElementChild, ic = b.querySelector('.ti');   /* last child = the label; the icon script may wrap emoji in extra spans */
        out.push({ k: 'A:' + b.dataset.tab, tool: 'A', id: b.dataset.tab, ic: ic ? ic.textContent : '\u2022', t: t ? t.textContent : b.dataset.tab, s: 'Tabs' });
      });
    }
    return out;
  }
  function toolItem(t){ return { k: 'T:' + t[0], tool: t[0], id: '', ic: t[1], t: t[2], s: 'Tools' }; }
  function curTab(){
    if (me === 'B'){ var p = D.querySelector('.app-panel.active'); return p ? 'B:' + p.id : ''; }
    if (me === 'A'){ var b = D.querySelector('.panel-tab.active'); return b ? 'A:' + b.dataset.tab : ''; }
    return '';
  }

  /* ---- go ---- */
  function goTab(id){
    if (!id) return;
    if (me === 'B'){ var r = D.getElementById('results'); if (r && r.classList.contains('show')) switchAppTab(id); else toast('Create a chart first, then pick a tab'); }
    else if (me === 'A'){ var b = D.querySelector('.panel-tab[data-tab="' + id + '"]'); if (b) b.click(); }
  }
  function go(it){
    close();
    if (it.id){ S.recent = [{ k: it.k, tool: it.tool, id: it.id, ic: it.ic, t: it.t }].concat((S.recent || []).filter(function(x){ return x.k !== it.k; })).slice(0, 5); save(); }
    if (it.tool === me){ goTab(it.id); return; }
    try{ parent.postMessage({ vqm: 'go', tool: it.tool, id: it.id }, '*'); }catch(e){}
  }

  /* ---- pins and groups ---- */
  var isPin = function(k){ return S.pins.some(function(x){ return x.k === k; }); };
  function togglePin(it){ if (isPin(it.k)) S.pins = S.pins.filter(function(x){ return x.k !== it.k; }); else S.pins.push({ k: it.k, tool: it.tool, id: it.id, ic: it.ic, t: it.t }); save(); render(); }
  var inGrp = function(g, k){ return g.items.some(function(x){ return x.k === k; }); };
  function toggleGrp(g, it){ if (inGrp(g, it.k)) g.items = g.items.filter(function(x){ return x.k !== it.k; }); else g.items.push({ k: it.k, tool: it.tool, id: it.id, ic: it.ic, t: it.t }); save(); render(); }
  function newGroup(it){
    var n = prompt('Name your group', ''); if (!n || !n.trim()) return;
    var g = { id: 'g' + Date.now().toString(36), name: n.trim().slice(0, 30), items: [] };
    S.groups.push(g); if (it) g.items.push({ k: it.k, tool: it.tool, id: it.id, ic: it.ic, t: it.t }); save(); picking = ''; render();
  }

  /* ---- drawing ---- */
  function chooser(it){
    var c = h('div', 'vq-pick');
    S.groups.forEach(function(g){ c.appendChild(btn('vq-chip' + (inGrp(g, it.k) ? ' on' : ''), (inGrp(g, it.k) ? '✓ ' : '') + g.name, null, function(){ toggleGrp(g, it); })); });
    c.appendChild(btn('vq-chip add', '＋ New group', null, function(){ newGroup(it); }));
    return c;
  }
  function row(it, ctx){
    var on = it.k === curTab() || it.k === 'T:' + me, r = h('div', 'vq-r' + (on ? ' on' : ''));
    var m = btn('vq-m', '', null, function(){ go(it); });
    m.appendChild(h('i', 'vq-i', it.ic));
    var tx = h('span', 'vq-t'); tx.appendChild(h('b', '', it.t)); if (it.d) tx.appendChild(h('em', '', it.d)); m.appendChild(tx);
    if (it.tool !== me && it.id) m.appendChild(h('small', '', nameOf(it.tool))); else if (on) m.appendChild(h('small', 'vq-here', 'you are here'));
    r.appendChild(m);
    if (org){
      r.appendChild(btn('vq-a' + (isPin(it.k) ? ' on' : ''), '📌', (isPin(it.k) ? 'Unpin ' : 'Pin ') + it.t, function(){ togglePin(it); }));
      r.appendChild(btn('vq-a' + (picking === ctx + it.k ? ' on' : ''), '🗂', 'Add ' + it.t + ' to a group', function(){ picking = picking === ctx + it.k ? '' : ctx + it.k; render(); }));
    }
    return r;
  }
  var isOpen = function(key, dflt){ return S.open[key] === undefined ? dflt : !!S.open[key]; };
  function head(key, label, n, dflt, extra){
    var o = isOpen(key, dflt), hd = h('div', 'vq-gh');
    hd.appendChild(btn('vq-gt', '', null, function(){ S.open[key] = !o; save(); render(); }));
    hd.firstChild.appendChild(h('i', 'vq-ch' + (o ? ' o' : ''), '▸')); hd.firstChild.appendChild(h('span', '', label)); if (n != null) hd.firstChild.appendChild(h('small', '', String(n)));
    if (extra) extra.forEach(function(x){ hd.appendChild(x); });
    return { hd: hd, open: o };
  }
  function render(){
    list.textContent = '';
    var f = (q.value || '').trim().toLowerCase(), searching = !!f, shown = 0;
    var vis = function(a){ return a.filter(function(it){ return !f || (it.t + ' ' + (it.s || '') + ' ' + (it.d || '')).toLowerCase().indexOf(f) > -1; }); };
    function put(items, ctx){ items.forEach(function(it){ shown++; list.appendChild(row(it, ctx)); if (picking === ctx + it.k) list.appendChild(chooser(it)); }); }
    function section(key, label, items, ctx, dflt, hint, extra){
      var hd = head(key, label, items.length, searching ? true : dflt, extra); if (!searching || items.length) list.appendChild(hd.hd);
      if (hd.open || searching){ if (items.length) put(items, ctx); else if (hint) list.appendChild(h('p', 'vq-hint', hint)); }
    }

    var cur = curTab();
    var rv = vis((S.recent || []).filter(function(x){ return x.k !== cur; }));
    if (!searching && rv.length) section('sec:recent', '🕘 Recent', rv, 'r', true);
    var pv = vis(S.pins);
    if (!searching || pv.length) section('sec:pins', '📌 Pinned', pv, 'p', true, org ? 'Tap 📌 on anything below to keep it here.' : 'Nothing pinned yet. Tap Organise, then 📌 on anything.');
    S.groups.forEach(function(g){
      var gv = vis(g.items); if (searching && !gv.length) return;
      var ex = org ? [btn('vq-a', '✎', 'Rename ' + g.name, function(){ var n = prompt('Rename group', g.name); if (n && n.trim()){ g.name = n.trim().slice(0, 30); save(); render(); } }),
        btn('vq-a', '🗑', 'Delete ' + g.name, function(){ if (confirm('Delete group "' + g.name + '"? Your pins and tabs stay.')){ S.groups = S.groups.filter(function(x){ return x !== g; }); save(); render(); } })] : null;
      var hd = head('g:' + g.id, '🗂 ' + g.name, g.items.length, S.open[g.id] !== false, ex); list.appendChild(hd.hd);
      if (hd.open || searching){ if (gv.length) put(gv, g.id); else list.appendChild(h('p', 'vq-hint', 'Empty. Tap Organise, then 🗂 on any item to add it.')); }
    });
    if (org && !searching) list.appendChild(btn('vq-new', '＋ New group', null, function(){ newGroup(null); }));

    var tv = vis(TOOLS.map(toolItem));
    if (tv.length){
      list.appendChild(h('h4', 'vq-h', '🧭 Open another tool'));
      var tg = h('div', 'vq-tools'); tv.forEach(function(it){ shown++; var on = it.k === 'T:' + me, b2 = btn('vq-tool' + (on ? ' on' : ''), '', null, function(){ go(it); }); b2.appendChild(h('i', '', it.ic)); b2.appendChild(h('span', '', it.t)); tg.appendChild(b2); }); list.appendChild(tg);
    }
    var tb = vis(tabs());
    if (tb.length){
      list.appendChild(h('h4', 'vq-h', 'Inside ' + nameOf(me) + (searching ? '' : '  ·  ' + tb.length)));
      if (me === 'B'){
        var order = [], by = {}; tb.forEach(function(it){ if (!by[it.s]){ by[it.s] = []; order.push(it.s); } by[it.s].push(it); });
        order.forEach(function(sn){ var has = by[sn].some(function(it){ return it.k === cur; }); section('sub:' + sn, sn, by[sn], 'x', has || sn === 'Start'); });
      } else put(tb, 'x');
    }
    cnt.textContent = searching ? (shown ? shown + (shown === 1 ? ' match' : ' matches') : '') : '';
    if (searching && !shown) list.appendChild(h('p', 'vq-hint vq-none', 'Nothing matches "' + f + '". Try a simpler word, like "dasha" or "marriage".'));
  }

  function open(){ load(); picking = ''; org = false; if (orgBtn) orgBtn.classList.remove('on'); q.value = ''; render(); box.classList.add('on'); btnEl.setAttribute('aria-expanded', 'true');
    try{ var c = list.querySelector('.vq-r.on'); if (c) c.scrollIntoView({ block: 'center' }); else list.scrollTop = 0; if (window.matchMedia && matchMedia('(pointer:fine)').matches) q.focus(); }catch(e){} }
  function close(){ if (!box) return; box.classList.remove('on'); btnEl.setAttribute('aria-expanded', 'false'); }

  function build(){
    var st = h('style'); st.textContent =
      '#vqBtn{position:fixed;top:calc(env(safe-area-inset-top,0px) + 8px);left:8px;z-index:9500;width:40px;height:40px;border-radius:50%;border:1px solid rgba(212,175,55,.45);background:rgba(20,17,13,.88);color:#e8c766;font:600 19px/1 system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}' +
      '#vqBtn:focus-visible{outline:2px solid #e8c766;outline-offset:2px}' +
      '#vqBox{position:fixed;inset:0;z-index:2147483000;display:none}#vqBox.on{display:block}' +
      '#vqBox .vq-bk{position:absolute;inset:0;background:rgba(0,0,0,.6)}' +
      '#vqBox .vq-p{position:absolute;top:0;left:0;bottom:0;width:min(90vw,380px);background:linear-gradient(180deg,#1a1610,#120f0b);color:#f1e9d6;border-right:1px solid rgba(212,175,55,.3);box-shadow:8px 0 40px rgba(0,0,0,.5);display:flex;flex-direction:column;padding-top:env(safe-area-inset-top,0px);font:14px/1.35 system-ui,sans-serif;animation:vqIn .16s ease-out}' +
      '@keyframes vqIn{from{opacity:0}to{opacity:1}}@media(prefers-reduced-motion:reduce){#vqBox .vq-p{animation:none}}' +
      '.vq-top{display:flex;gap:8px;align-items:center;padding:14px 12px 8px 16px}.vq-top b{color:#e8c766;font:600 17px Georgia,serif;flex:1;letter-spacing:.01em}' +
      '.vq-org{border:1px solid rgba(212,175,55,.35);background:none;color:#e8c766;border-radius:999px;padding:6px 12px;font-size:12.5px;cursor:pointer}.vq-org.on{background:#d4af37;color:#16130f;font-weight:600}' +
      '.vq-x{background:none;border:0;color:#f1e9d6;font-size:20px;cursor:pointer;padding:4px 8px;border-radius:8px}.vq-x:hover{background:rgba(255,255,255,.07)}' +
      '.vq-sw{position:relative;margin:0 14px 4px}.vq-sw:before{content:"\\1F50E";position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:14px;opacity:.6;pointer-events:none}' +
      '.vq-q{width:100%;box-sizing:border-box;padding:11px 12px 11px 36px;border-radius:12px;border:1px solid rgba(212,175,55,.25);background:#0f0d0a;color:#f1e9d6;font-size:15px;outline:none}.vq-q:focus{border-color:#d4af37;box-shadow:0 0 0 3px rgba(212,175,55,.15)}' +
      '.vq-cnt{margin:0 16px;min-height:16px;font-size:11.5px;color:#a89b82}' +
      '.vq-l{flex:1;overflow-y:auto;padding:0 10px calc(18px + env(safe-area-inset-bottom,0px));-webkit-overflow-scrolling:touch;overscroll-behavior:contain}' +
      '.vq-h{margin:16px 6px 6px;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:#d4af37;font-weight:600}' +
      '.vq-hint{margin:4px 10px 8px;font-size:12.5px;line-height:1.5;color:#a89b82}.vq-none{text-align:center;padding:24px 8px}' +
      '.vq-r{display:flex;align-items:center;gap:2px;border-radius:12px;margin:1px 0}.vq-r:hover{background:rgba(255,255,255,.04)}.vq-r.on{background:rgba(212,175,55,.14);box-shadow:inset 3px 0 0 #d4af37}' +
      '.vq-m{flex:1;min-width:0;display:flex;align-items:center;gap:11px;background:none;border:0;color:inherit;font:inherit;text-align:left;padding:8px 8px;cursor:pointer;border-radius:12px}.vq-m:focus-visible{outline:2px solid #d4af37}' +
      '.vq-i{flex:none;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:rgba(212,175,55,.1);font-style:normal;font-size:16px}.vq-r.on .vq-i{background:rgba(212,175,55,.25)}' +
      '.vq-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}.vq-t b{font-weight:600;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.vq-t em{font-style:normal;font-size:12px;color:#a89b82;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.vq-m small{flex:none;color:#a89b82;font-size:11px;border:1px solid rgba(255,255,255,.12);border-radius:99px;padding:1px 8px}.vq-m small.vq-here{color:#e8c766;border-color:rgba(212,175,55,.4)}' +
      '.vq-a{background:none;border:0;cursor:pointer;font-size:15px;padding:8px;opacity:.45;border-radius:8px;color:inherit}.vq-a.on{opacity:1;background:rgba(212,175,55,.2)}' +
      '.vq-gh{display:flex;align-items:center;margin-top:10px}.vq-gt{flex:1;display:flex;align-items:center;gap:8px;text-align:left;background:none;border:0;color:#e8c766;font:600 14px system-ui,sans-serif;padding:9px 6px;cursor:pointer;border-radius:8px}.vq-gt:hover{background:rgba(255,255,255,.04)}' +
      '.vq-gt span{flex:1}.vq-gt small{color:#a89b82;font-weight:400;font-size:12px}.vq-ch{font-style:normal;font-size:11px;color:#a89b82;transition:transform .12s}.vq-ch.o{transform:rotate(90deg)}' +
      '.vq-pick{display:flex;flex-wrap:wrap;gap:6px;padding:2px 8px 8px 46px}' +
      '.vq-chip{border:1px solid rgba(212,175,55,.35);background:none;color:#f1e9d6;border-radius:999px;padding:6px 12px;font-size:12.5px;cursor:pointer}.vq-chip.on{background:#d4af37;color:#16130f;font-weight:600}.vq-chip.add{border-style:dashed}' +
      '.vq-new{margin:10px 4px 0;width:calc(100% - 8px);padding:10px;border-radius:12px;border:1px dashed rgba(212,175,55,.5);background:none;color:#e8c766;font-size:14px;cursor:pointer}' +
      '.vq-tools{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 4px}' +
      '.vq-tool{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 4px 10px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:#f1e9d6;font-size:12.5px;cursor:pointer}.vq-tool i{font-style:normal;font-size:20px}.vq-tool.on{border-color:#d4af37;background:rgba(212,175,55,.14);color:#e8c766}' +
      '.vq-toast{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147483100;background:#16130f;color:#f1e9d6;border:1px solid rgba(212,175,55,.5);padding:10px 16px;border-radius:12px;font:14px system-ui,sans-serif;max-width:86vw;text-align:center}';
    D.head.appendChild(st);

    btnEl = btn('', '\u2630', 'Open quick menu', open); btnEl.id = 'vqBtn'; btnEl.setAttribute('aria-haspopup', 'dialog'); btnEl.setAttribute('aria-expanded', 'false');
    D.body.appendChild(btnEl);

    box = h('div'); box.id = 'vqBox';
    var bk = h('div', 'vq-bk'); bk.onclick = close;
    panel = h('div', 'vq-p'); panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Quick menu');
    var top = h('div', 'vq-top'); top.appendChild(h('b', '', '\u2630 Quick menu'));
    orgBtn = btn('vq-org', '\u270E Organise', 'Pin tabs and make groups', function(){ org = !org; picking = ''; orgBtn.classList.toggle('on', org); render(); }); top.appendChild(orgBtn);
    top.appendChild(btn('vq-x', '\u2715', 'Close', close));
    q = h('input', 'vq-q'); q.type = 'search'; q.placeholder = 'Search tools and tabs\u2026'; q.setAttribute('aria-label', 'Search tools and tabs'); q.oninput = render;
    q.onkeydown = function(e){ if (e.key === 'Enter'){ var m = list.querySelector('.vq-m'); if (m) m.click(); } };
    var sw = h('div', 'vq-sw'); sw.appendChild(q); cnt = h('div', 'vq-cnt');
    list = h('div', 'vq-l');
    panel.appendChild(top); panel.appendChild(sw); panel.appendChild(cnt); panel.appendChild(list); box.appendChild(bk); box.appendChild(panel); D.body.appendChild(box);
    D.addEventListener('keydown', function(e){ if (e.key === 'Escape' && box.classList.contains('on')) close(); });
    D.body.classList.add('vqm-on', 'vqm-' + me.toLowerCase());
  }

  window.VQM = { go: goTab, open: open, close: close };
  if (D.body) build(); else D.addEventListener('DOMContentLoaded', build);
})();

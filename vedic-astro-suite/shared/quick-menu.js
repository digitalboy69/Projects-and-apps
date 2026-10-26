/* Quick Menu: a top-left menu button inside every tool. Tap it to jump to any tool or tab, pin favourites and make your own groups.
   Pins and groups are saved in localStorage (key vedicQuickMenu_v1) and shared by all tools. Each item keeps its own icon and label,
   so a pin made in one tool still shows correctly in the others. Tool switching goes through the shell (postMessage {vqm:'go'}). */
(function(){
  if (window.VQM) return;
  var D = document, KEY = 'vedicQuickMenu_v1';
  var TOOLS = [['A', '\uD83C\uDF0C', '3D Sky'], ['B', '\uD83E\uDDED', 'Birth Chart'], ['N', '\uD83D\uDCDD', 'Notepad']];
  var me = D.getElementById('appTabbar') ? 'B' : D.querySelector('.panel-tab[data-tab]') ? 'A' : 'N';
  var S = { pins: [], groups: [], open: {} }, picking = '', box, panel, list, q, btnEl;
  var nameOf = function(k){ for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i][0] === k) return TOOLS[i][2]; return ''; };

  function load(){ try{ var j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && Array.isArray(j.pins) && Array.isArray(j.groups)) S = j; }catch(e){} if (!S.open) S.open = {}; }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
  function h(t, c, x){ var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function btn(c, x, label, fn){ var b = h('button', c, x); b.type = 'button'; if (label) b.setAttribute('aria-label', label); b.onclick = function(ev){ ev.stopPropagation(); fn(); }; return b; }
  function toast(m){ var t = h('div', 'vq-toast', m); D.body.appendChild(t); setTimeout(function(){ t.remove(); }, 2600); }

  /* ---- what can I jump to inside THIS tool ---- */
  function tabs(){
    var out = [];
    if (me === 'B' && typeof HOME_ITEMS !== 'undefined'){
      out.push({ k: 'B:panel-home', tool: 'B', id: 'panel-home', ic: '\uD83C\uDFE0', t: 'Home', s: 'Start' });
      HOME_ITEMS.forEach(function(i){ out.push({ k: 'B:' + i[0], tool: 'B', id: i[0], ic: i[1], t: i[2], s: i[4] }); });
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
    S.groups.forEach(function(g){ c.appendChild(btn('vq-chip' + (inGrp(g, it.k) ? ' on' : ''), (inGrp(g, it.k) ? '\u2713 ' : '') + g.name, null, function(){ toggleGrp(g, it); })); });
    c.appendChild(btn('vq-chip add', '\uFF0B New group', null, function(){ newGroup(it); }));
    return c;
  }
  function row(it, ctx){
    var on = it.k === curTab() || it.k === 'T:' + me, r = h('div', 'vq-r' + (on ? ' on' : ''));
    var m = btn('vq-m', '', null, function(){ go(it); });
    m.appendChild(h('i', '', it.ic)); m.appendChild(h('span', '', it.t));
    if (it.tool !== me && it.id) m.appendChild(h('small', '', nameOf(it.tool)));
    r.appendChild(m);
    r.appendChild(btn('vq-a' + (isPin(it.k) ? ' on' : ''), '\uD83D\uDCCC', 'Pin ' + it.t, function(){ togglePin(it); }));
    r.appendChild(btn('vq-a' + (picking === ctx + it.k ? ' on' : ''), '\uD83D\uDDC2', 'Add ' + it.t + ' to a group', function(){ picking = picking === ctx + it.k ? '' : ctx + it.k; render(); }));
    return r;
  }
  function render(){
    list.textContent = '';
    var f = (q.value || '').trim().toLowerCase();
    var vis = function(a){ return a.filter(function(it){ return !f || (it.t + ' ' + (it.s || '')).toLowerCase().indexOf(f) > -1; }); };
    function put(items, ctx){ items.forEach(function(it){ list.appendChild(row(it, ctx)); if (picking === ctx + it.k) list.appendChild(chooser(it)); }); }

    var pv = vis(S.pins);
    if (!f || pv.length){
      list.appendChild(h('h4', 'vq-h', '\uD83D\uDCCC Pinned'));
      if (pv.length) put(pv, 'p'); else list.appendChild(h('p', 'vq-hint', 'Tap \uD83D\uDCCC on anything below to keep it here.'));
    }
    S.groups.forEach(function(g){
      var gv = vis(g.items); if (f && !gv.length) return;
      var open = S.open[g.id] !== false, hd = h('div', 'vq-gh');
      hd.appendChild(btn('vq-gt', (open ? '\u25BE ' : '\u25B8 ') + g.name + '  (' + g.items.length + ')', null, function(){ S.open[g.id] = !open; save(); render(); }));
      hd.appendChild(btn('vq-a', '\u270E', 'Rename ' + g.name, function(){ var n = prompt('Rename group', g.name); if (n && n.trim()){ g.name = n.trim().slice(0, 30); save(); render(); } }));
      hd.appendChild(btn('vq-a', '\uD83D\uDDD1', 'Delete ' + g.name, function(){ if (confirm('Delete group "' + g.name + '"? Your pins and tabs stay.')){ S.groups = S.groups.filter(function(x){ return x !== g; }); save(); render(); } }));
      list.appendChild(hd);
      if (open){ if (gv.length) put(gv, g.id); else list.appendChild(h('p', 'vq-hint', 'Empty. Tap \uD83D\uDDC2 on any item to add it.')); }
    });
    if (!f) list.appendChild(btn('vq-new', '\uFF0B New group', null, function(){ newGroup(null); }));

    var tv = vis(TOOLS.map(toolItem));
    if (tv.length){ list.appendChild(h('h4', 'vq-h', '\uD83E\uDDED Tools')); put(tv, 't'); }
    var tb = vis(tabs()), last = '';
    if (tb.length){
      list.appendChild(h('h4', 'vq-h', 'Inside ' + nameOf(me)));
      tb.forEach(function(it){ if (me === 'B' && it.s !== last){ last = it.s; list.appendChild(h('div', 'vq-s', it.s)); } put([it], 'x'); });
    }
    if (f && !list.children.length) list.appendChild(h('p', 'vq-hint', 'Nothing matches "' + f + '".'));
  }

  function open(){ load(); picking = ''; q.value = ''; render(); box.classList.add('on'); btnEl.setAttribute('aria-expanded', 'true'); }
  function close(){ if (!box) return; box.classList.remove('on'); btnEl.setAttribute('aria-expanded', 'false'); }

  function build(){
    var st = h('style'); st.textContent =
      '#vqBtn{position:fixed;top:calc(env(safe-area-inset-top,0px) + 8px);left:8px;z-index:9500;width:40px;height:40px;border-radius:50%;border:1px solid rgba(212,175,55,.45);background:rgba(20,17,13,.88);color:#e8c766;font:600 19px/1 system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent}' +
      '#vqBtn:active{transform:scale(.93)}' +
      '#vqBox{position:fixed;inset:0;z-index:2147483000;display:none}#vqBox.on{display:block}' +
      '#vqBox .vq-bk{position:absolute;inset:0;background:rgba(0,0,0,.55)}' +
      '#vqBox .vq-p{position:absolute;top:0;left:0;bottom:0;width:min(88vw,350px);background:#16130f;color:#f1e9d6;border-right:1px solid rgba(212,175,55,.3);display:flex;flex-direction:column;padding-top:env(safe-area-inset-top,0px);font:14px/1.35 system-ui,sans-serif;animation:vqIn .18s ease-out}' +
      '@keyframes vqIn{from{transform:translateX(-30px);opacity:0}to{transform:none;opacity:1}}@media(prefers-reduced-motion:reduce){#vqBox .vq-p{animation:none}}' +
      '.vq-top{display:flex;gap:8px;align-items:center;padding:10px 10px 6px}.vq-top b{color:#e8c766;font-size:15px;flex:1}' +
      '.vq-x{background:none;border:0;color:#f1e9d6;font-size:20px;cursor:pointer;padding:4px 8px}' +
      '.vq-q{margin:0 10px 6px;padding:9px 12px;border-radius:10px;border:1px solid rgba(212,175,55,.25);background:#0f0d0a;color:#f1e9d6;font-size:14px;outline:none}.vq-q:focus{border-color:#d4af37}' +
      '.vq-l{flex:1;overflow-y:auto;padding:0 8px calc(16px + env(safe-area-inset-bottom,0px));-webkit-overflow-scrolling:touch}' +
      '.vq-h{margin:14px 4px 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#d4af37}' +
      '.vq-s{margin:8px 6px 2px;font-size:11px;color:#8d8472}' +
      '.vq-hint{margin:4px 8px;font-size:12px;color:#8d8472}' +
      '.vq-r{display:flex;align-items:center;gap:2px;border-radius:10px}.vq-r.on{background:rgba(212,175,55,.14)}' +
      '.vq-m{flex:1;min-width:0;display:flex;align-items:center;gap:10px;background:none;border:0;color:inherit;font:inherit;text-align:left;padding:10px 8px;cursor:pointer;border-radius:10px}' +
      '.vq-m i{font-style:normal;width:24px;text-align:center;font-size:16px}.vq-m span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.vq-m small{color:#8d8472;font-size:11px}' +
      '.vq-a{background:none;border:0;cursor:pointer;font-size:15px;padding:8px;opacity:.38;border-radius:8px;color:inherit}.vq-a.on{opacity:1;background:rgba(212,175,55,.18)}' +
      '.vq-gh{display:flex;align-items:center;margin-top:12px}.vq-gt{flex:1;text-align:left;background:none;border:0;color:#e8c766;font:600 14px system-ui,sans-serif;padding:8px 4px;cursor:pointer}' +
      '.vq-pick{display:flex;flex-wrap:wrap;gap:6px;padding:2px 8px 8px 40px}' +
      '.vq-chip{border:1px solid rgba(212,175,55,.35);background:none;color:#f1e9d6;border-radius:999px;padding:6px 12px;font-size:12.5px;cursor:pointer}.vq-chip.on{background:#d4af37;color:#16130f;font-weight:600}.vq-chip.add{border-style:dashed}' +
      '.vq-new{margin:10px 4px 0;width:calc(100% - 8px);padding:10px;border-radius:10px;border:1px dashed rgba(212,175,55,.5);background:none;color:#e8c766;font-size:14px;cursor:pointer}' +
      '.vq-toast{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147483100;background:#16130f;color:#f1e9d6;border:1px solid rgba(212,175,55,.5);padding:10px 16px;border-radius:12px;font:14px system-ui,sans-serif;max-width:86vw;text-align:center}';
    D.head.appendChild(st);

    btnEl = btn('', '\u2630', 'Open quick menu', open); btnEl.id = 'vqBtn'; btnEl.setAttribute('aria-haspopup', 'dialog'); btnEl.setAttribute('aria-expanded', 'false');
    D.body.appendChild(btnEl);

    box = h('div'); box.id = 'vqBox';
    var bk = h('div', 'vq-bk'); bk.onclick = close;
    panel = h('div', 'vq-p'); panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Quick menu');
    var top = h('div', 'vq-top'); top.appendChild(h('b', '', '\u2630 Quick menu')); top.appendChild(btn('vq-x', '\u2715', 'Close', close));
    q = h('input', 'vq-q'); q.type = 'search'; q.placeholder = 'Search tools and tabs\u2026'; q.setAttribute('aria-label', 'Search tools and tabs'); q.oninput = render;
    list = h('div', 'vq-l');
    panel.appendChild(top); panel.appendChild(q); panel.appendChild(list); box.appendChild(bk); box.appendChild(panel); D.body.appendChild(box);
    D.addEventListener('keydown', function(e){ if (e.key === 'Escape' && box.classList.contains('on')) close(); });
    D.body.classList.add('vqm-on', 'vqm-' + me.toLowerCase());
  }

  window.VQM = { go: goTab, open: open, close: close };
  if (D.body) build(); else D.addEventListener('DOMContentLoaded', build);
})();

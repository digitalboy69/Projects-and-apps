/* ============================================================================
   EXPORT STUDIO SHEET (global XSU) - the full-control screen for js/65. Opened from the Export tab.
   Cards: 1 Preset, 2 Chart and moment, 3 What to include (with per-section options), 4 Format, 5 Preview. Sticky bar: Copy / Download / Share.
   Settings are remembered in localStorage (sky3d_xs). Prefix xs-. Only opacity/transform animate; no backdrop-filter; tap targets >= 40px.
   ============================================================================ */
const XSU = (() => {
  'use strict';
  const KEY = 'sky3d_xs', $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let cfg = XS.defaults(), root = null, built = false, openOpt = null, timer = 0, last = null;
  try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && j.sec) cfg = XS.norm(j); } catch (e) { /* defaults */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* private mode */ } };
  const hasProfile = () => !!XS.profile();
  const OPTS = { varga: 1, transits: 1, meetings: 1, retro: 1, ephemeris: 1 };
  const HOR = [1, 2, 5, 10, 20];
  const seg = (a, cur, items) => '<div class="xs-seg" role="group">' + items.map(i => '<button type="button" class="' + (String(cur) === String(i[0]) ? 'on' : '') + '" data-a="' + a + '" data-v="' + i[0] + '"' + (i[2] ? ' disabled' : '') + (i[3] ? ' title="' + esc(i[3]) + '"' : '') + '>' + i[1] + '</button>').join('') + '</div>';
  const sw = (a, on, label, sub) => '<button type="button" class="xs-sw' + (on ? ' on' : '') + '" role="switch" aria-checked="' + !!on + '" data-a="' + a + '"><span class="xs-knob"></span><span class="xs-swt"><b>' + label + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span></button>';

  function optsHtml(id) {
    if (id === 'varga') return '<div class="xs-chips">' + XS.ALL_VARGAS.map(k => '<button type="button" class="' + (cfg.vargas.includes(k) ? 'on' : '') + '" data-a="vg" data-v="' + k + '">' + k + '<small>' + VG.name(k) + '</small></button>').join('') + '</div><div class="xs-mini"><button type="button" data-a="vgall">All</button><button type="button" data-a="vgnone">None</button><button type="button" data-a="vgmain">D9 D10 D60</button></div>';
    if (id === 'transits') return '<div class="xs-lab">How far ahead</div>' + seg('trY', cfg.tr.years, HOR.map(y => [y, y + ' yr'])) + sw('trMoon', cfg.tr.moon, 'Include the Moon', 'The Moon changes sign every 2 days, so this adds many rows');
    if (id === 'meetings') return '<div class="xs-lab">How far ahead</div>' + seg('mtY', cfg.mt.years, HOR.map(y => [y, y + ' yr'])) + sw('mtMoon', cfg.mt.moon, 'Include the Moon', 'Moon meetings happen about every month for each planet');
    if (id === 'retro') return '<div class="xs-lab">How far ahead</div>' + seg('rtY', cfg.rt.years, HOR.map(y => [y, y + ' yr']));
    if (id === 'ephemeris') return '<div class="xs-lab">One row every</div>' + seg('ephS', cfg.eph.step, [['1d', 'Day'], ['1w', 'Week'], ['1m', 'Month'], ['1y', 'Year']])
      + '<div class="xs-lab">Rows <b>' + cfg.eph.count + '</b></div><div class="xs-step"><button type="button" data-a="ephC" data-v="-1" aria-label="Fewer rows">-</button><input type="range" min="1" max="120" value="' + cfg.eph.count + '" data-a="ephR" aria-label="Rows"><button type="button" data-a="ephC" data-v="1" aria-label="More rows">+</button></div>'
      + '<div class="xs-lab">Planets</div><div class="xs-chips six">' + PLANET_LIST.map(n => '<button type="button" class="' + (cfg.eph.planets.includes(n) ? 'on' : '') + '" data-a="ephP" data-v="' + n + '"><span style="color:' + PLANET_COLORS[n] + '">' + PLANET_GLYPHS[n] + '</span><small>' + n.slice(0, 3) + '</small></button>').join('') + '</div>';
    return '';
  }
  function secRow(s) {
    const on = cfg.sec.includes(s.id), o = OPTS[s.id], op = openOpt === s.id, need = (s.id === 'dasha' && !hasProfile());
    return '<div class="xs-row' + (on ? ' on' : '') + (need ? ' dim' : '') + '"><div class="xs-rh"><button type="button" class="xs-chk" role="switch" aria-checked="' + on + '" data-a="sec" data-v="' + s.id + '" aria-label="' + esc(s.title) + '"><i></i></button>'
      + '<div class="xs-rt" data-a="sec" data-v="' + s.id + '"><b>' + s.title + '</b><small>' + s.about + (need ? ' <em>Needs a birth profile.</em>' : '') + '</small></div>'
      + (o ? '<button type="button" class="xs-gear' + (op ? ' on' : '') + '" data-a="opt" data-v="' + s.id + '" aria-expanded="' + op + '" aria-label="Options for ' + esc(s.title) + '">⚙</button>' : '') + '</div>'
      + (o && op ? '<div class="xs-opts">' + optsHtml(s.id) + '</div>' : '') + '</div>';
  }
  function form() {
    const p = XS.profile(), jd = XS.momentJD(cfg), pre = XS.PRESETS;
    const presets = Object.keys(pre).map(k => '<button type="button" class="xs-p' + (cfg.preset === k ? ' on' : '') + '" data-a="preset" data-v="' + k + '"><b>' + pre[k].label + '</b><small>' + pre[k].hint + '</small></button>').join('');
    const grp = (part, title) => '<h4>' + title + '<span><button type="button" data-a="grpOn" data-v="' + part + '">All</button><button type="button" data-a="grpOff" data-v="' + part + '">None</button></span></h4>' + XS.SECTIONS.filter(s => s.part === part).map(secRow).join('');
    return '<section class="xs-card"><h3><i>1</i>Start from</h3><div class="xs-presets">' + presets + (cfg.preset === 'custom' ? '<div class="xs-p on cus"><b>Custom</b><small>Your own mix</small></div>' : '') + '</div></section>'
      + '<section class="xs-card"><h3><i>2</i>Chart and moment</h3><div class="xs-lab">Which chart</div>'
      + seg('basis', cfg.basis, [['auto', 'Auto'], ['sky', 'Sky'], ['natal', 'Birth', !p, 'Load a birth profile first'], ['both', 'Both', !p, 'Load a birth profile first']])
      + '<p class="xs-hint"><b>Auto</b> = the sky, plus the birth chart when a birth profile is loaded.</p><p class="xs-hint">' + (p ? '<b>' + esc(p.name) + '</b> is loaded: houses and Dasha are counted from the birth Lagna.' : 'No birth profile is loaded, so houses, Lagna and Dasha are left out. Open the Natal tab to load one.') + '</p>'
      + '<div class="xs-lab">Which moment</div>' + seg('moment', cfg.moment, [['sky', '3D date'], ['today', 'Right now'], ['custom', 'Pick']])
      + (cfg.moment === 'custom' ? '<input type="datetime-local" class="xs-dt" data-a="dt" value="' + esc(cfg.momentISO || '') + '" aria-label="Moment to export">' : '')
      + '<p class="xs-hint">Exporting <b>' + XS.fmt(jd) + '</b>. Forecast windows start from this moment.</p></section>'
      + '<section class="xs-card"><h3><i>3</i>What to include</h3>' + grp('chart', 'Chart data') + grp('timing', 'Timing and forecasts') + '</section>'
      + '<section class="xs-card"><h3><i>4</i>Format</h3><div class="xs-lab">File style</div>'
      + seg('format', cfg.format, [['md', 'Markdown'], ['json', 'JSON'], ['txt', 'Plain text']])
      + '<p class="xs-hint">' + ({ md: '<b>Markdown</b> is best for AI chats: headings and tables the model reads cleanly.', json: '<b>JSON</b> is for programs and agents: every value has a fixed key.', txt: '<b>Plain text</b> works anywhere: aligned columns, no symbols.' }[cfg.format]) + '</p>'
      + '<div class="xs-lab">Degrees</div>' + seg('angle', cfg.angle, [['dms', "12°34'56\""], ['dec', '12.5822°']])
      + '<div class="xs-sws">' + sw('guide', cfg.guide, 'Add a how-to-read guide', 'Explains signs, houses, aspects and the (R) mark') + sw('rules', cfg.rules, 'Add rules for the AI', 'Use only this data, never invent, cite sections') + '</div>'
      + '<div class="xs-lab">Your question for the AI <small>(optional, goes at the top)</small></div><textarea class="xs-task" data-a="task" rows="3" maxlength="1500" placeholder="For example: When is a good period for a career change, and why?">' + esc(cfg.task) + '</textarea></section>'
      + '<section class="xs-card"><h3><i>5</i>Preview</h3><div class="xs-stats" id="xsStats"></div><pre class="xs-pre" id="xsPre" tabindex="0" aria-label="Export preview"></pre></section>';
  }
  function frame() {
    root = document.createElement('div'); root.id = 'xsSheet'; root.className = 'xs-sheet vax-skip'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Export Studio');
    root.innerHTML = '<div class="xs-wrap"><header><div><b>Export Studio</b><small>Build the exact data you want, then copy it into an AI chat</small></div><button type="button" id="xsClose" aria-label="Close">✕</button></header><div class="xs-body" id="xsBody"></div>'
      + '<footer><div class="xs-msg" id="xsMsg" aria-live="polite"></div><div class="xs-act"><button type="button" class="xs-copy" data-a="copy">Export to clipboard</button><button type="button" data-a="dl">Download</button><button type="button" data-a="share" id="xsShare">Share</button></div></footer></div>';
    document.body.appendChild(root); built = true;
    if (!navigator.share) $('xsShare').style.display = 'none';
    $('xsClose').addEventListener('click', close);
    root.addEventListener('click', e => { if (e.target === root) close(); const t = e.target.closest('[data-a]'); if (t) act(t, 'click'); });
    root.addEventListener('input', e => { const t = e.target.closest('[data-a]'); if (t) act(t, 'input'); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && root && !root.hidden) close(); });
  }
  function draw() { const b = $('xsBody'), y = b.scrollTop; b.innerHTML = form(); b.scrollTop = y; preview(); }
  function custom() { cfg.preset = 'custom'; }
  function toggle(arr, v) { const i = arr.indexOf(v); if (i < 0) arr.push(v); else arr.splice(i, 1); }
  function act(t, kind) {
    const a = t.dataset.a, v = t.dataset.v;
    if (kind === 'input') {
      if (a === 'task') { cfg.task = t.value; save(); return later(); }
      if (a === 'dt') { cfg.momentISO = t.value; save(); return later(true); }
      if (a === 'ephR') { cfg.eph.count = +t.value; custom(); save(); const lab = t.closest('.xs-opts').querySelector('.xs-lab b'); if (lab) lab.textContent = t.value; return later(); }
      return;
    }
    if (a === 'preset') { cfg = XS.applyPreset(cfg, v); openOpt = null; }
    else if (a === 'basis') { cfg.basis = v; custom(); }
    else if (a === 'moment') { cfg.moment = v; if (v === 'custom' && !cfg.momentISO) { const d = new Date(); cfg.momentISO = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); } custom(); }
    else if (a === 'dt') return;
    else if (a === 'sec') { toggle(cfg.sec, v); custom(); }
    else if (a === 'opt') openOpt = openOpt === v ? null : v;
    else if (a === 'grpOn' || a === 'grpOff') { XS.SECTIONS.filter(s => s.part === v).forEach(s => { const i = cfg.sec.indexOf(s.id); if (a === 'grpOn' && i < 0) cfg.sec.push(s.id); if (a === 'grpOff' && i >= 0) cfg.sec.splice(i, 1); }); custom(); }
    else if (a === 'vg') { toggle(cfg.vargas, v); custom(); }
    else if (a === 'vgall') { cfg.vargas = XS.ALL_VARGAS.slice(); custom(); } else if (a === 'vgnone') { cfg.vargas = []; custom(); } else if (a === 'vgmain') { cfg.vargas = ['D9', 'D10', 'D60']; custom(); }
    else if (a === 'trY') { cfg.tr.years = +v; custom(); } else if (a === 'trMoon') { cfg.tr.moon = !cfg.tr.moon; custom(); }
    else if (a === 'mtY') { cfg.mt.years = +v; custom(); } else if (a === 'mtMoon') { cfg.mt.moon = !cfg.mt.moon; custom(); }
    else if (a === 'rtY') { cfg.rt.years = +v; custom(); }
    else if (a === 'ephS') { cfg.eph.step = v; custom(); } else if (a === 'ephC') { cfg.eph.count = Math.max(1, Math.min(120, cfg.eph.count + (+v))); custom(); }
    else if (a === 'ephP') { toggle(cfg.eph.planets, v); if (!cfg.eph.planets.length) cfg.eph.planets = [v]; custom(); }
    else if (a === 'format') cfg.format = v; else if (a === 'angle') cfg.angle = v; else if (a === 'guide') cfg.guide = !cfg.guide; else if (a === 'rules') cfg.rules = !cfg.rules;
    else if (a === 'copy') return copy(); else if (a === 'dl') return download(); else if (a === 'share') return share();
    else return;
    save(); draw();
  }
  function later(now) { clearTimeout(timer); timer = setTimeout(preview, now ? 0 : 220); }
  function preview() {
    const st = $('xsStats'), pre = $('xsPre'); if (!st) return;
    try { last = XS.make(cfg); } catch (e) { last = null; pre.textContent = 'The export could not be built: ' + e.message; st.innerHTML = ''; return; }
    const sh = last.text.length > 40000 ? last.text.slice(0, 40000) + '\n\n... preview shortened (' + (last.text.length - 40000).toLocaleString() + ' more characters). Copy and Download include everything.' : last.text;
    pre.textContent = sh;
    st.innerHTML = '<span><b>' + last.sections + '</b> sections</span><span><b>' + last.chars.toLocaleString() + '</b> characters</span><span>about <b>' + last.tokens.toLocaleString() + '</b> tokens</span>';
  }
  function say(m, bad) { const e = $('xsMsg'); if (!e) return; e.textContent = m; e.className = 'xs-msg show' + (bad ? ' bad' : ''); clearTimeout(say.t); say.t = setTimeout(() => { e.className = 'xs-msg'; }, 2600); }
  function clip(txt) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(txt);
    return new Promise((res, rej) => { try { const ta = document.createElement('textarea'); ta.value = txt; ta.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); document.body.removeChild(ta); ok ? res() : rej(new Error('copy blocked')); } catch (e) { rej(e); } });
  }
  function fresh() { last = XS.make(cfg); return last; }
  function copy() { const o = fresh(); clip(o.text).then(() => say('Copied ' + o.chars.toLocaleString() + ' characters')).catch(() => say('Copy was blocked. Use Download or Share.', true)); }
  function fname(o) { const d = new Date(), p = n => String(n).padStart(2, '0'); return 'vedic-sky-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + '.' + XS.ext(cfg.format); }
  function download() {
    const o = fresh();
    try { const u = URL.createObjectURL(new Blob([o.text], { type: XS.mime(cfg.format) + ';charset=utf-8' })), a = document.createElement('a'); a.href = u; a.download = fname(o); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); say('Saved ' + a.download); }
    catch (e) { say('Download is not available here. Use Copy.', true); }
  }
  function share() { const o = fresh(); if (!navigator.share) return say('Sharing is not available here.', true); navigator.share({ title: 'Vedic sky export', text: o.text }).catch(() => { /* cancelled */ }); }
  function open() { if (!built) frame(); draw(); root.hidden = false; document.body.classList.add('xs-open'); $('xsBody').scrollTop = 0; }
  function close() { if (root) root.hidden = true; document.body.classList.remove('xs-open'); }
  /* NOTE: the app has a Settings switch that hides every button whose label starts with 'Copy' (shared/copy-toggle.js), so the Studio's own buttons are worded 'Export to clipboard'. */
  /* quick copy from the Export tab: a preset with the user's saved format, moment and question */
  function quick(key) { const c = XS.applyPreset(cfg, key); const o = XS.make(c); return clip(o.text).then(() => o); }
  document.addEventListener('click', e => {
    const b = e.target.closest('#xsOpenBtn,[data-xq]'); if (!b) return;
    if (b.id === 'xsOpenBtn') return open();
    const st = $('exportStatus'); quick(b.dataset.xq).then(o => { if (st) { st.textContent = 'Copied ' + o.chars.toLocaleString() + ' characters (' + XS.PRESETS[b.dataset.xq].label + ') ✓'; st.style.display = 'block'; clearTimeout(quick.t); quick.t = setTimeout(() => { st.style.display = 'none'; }, 3500); } }).catch(() => { if (st) { st.textContent = 'Copy was blocked. Open the Export Studio and use Download.'; st.style.display = 'block'; } });
  });
  return { open, close, quick, get cfg() { return cfg; }, set cfg(v) { cfg = XS.norm(v); } };
})();

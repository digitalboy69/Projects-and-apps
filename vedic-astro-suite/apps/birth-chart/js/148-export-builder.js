/* Export builder (js/148): the Export tab as a plain, structured screen. It REPLACES the old pop-up window for the Export tab and the header Export button
   (the old window code in js/44 stays as a fallback if this file is missing). It uses the same report engine, buildFullReportText (js/43, plus the extra
   sections shared/export-addon.js adds), so a report built here is the same text as before; only the choosing and the output are new.
   Screen: 1) presets  2) output options (format, split into parts, sky-right-now place)  3) sections in groups, each with its own All / None, its size and a short note;
   a sticky bar shows sections, characters and approximate AI tokens, and the Copy / Download buttons.
   Sizes are measured by building each section alone (lazily, so the screen opens at once); the bar adds them up, so the total is approximate until you copy or download,
   when the exact length is shown. Nothing is sent anywhere; all of it stays on the device. The last selection and options are remembered in localStorage (try/catch).
   NOTE: buildFullReportText treats a base section as ON unless it is passed false, so this file always passes every base section explicitly.
   Uses buildFullReportText, computeLiveSky (js/59), VARGAS, HOME_ITEMS, THB.groups (js/147), currentChartForModal, currentProfileForExport. Classes exb- prefixed. */
const EXB = (() => {
  const BASE = ['birthDetails', 'chartSummary', 'karakas', 'planetTable', 'aspects', 'yogas', 'deepReading', 'shadbala', 'ashtakavarga', 'dasha', 'vargas', 'rawLongitudes'];
  const SKIPP = { 'panel-export': 1, 'panel-contact': 1, 'panel-rectification': 1, 'panel-vargatimeline': 1, 'panel-transittimer': 1, 'panel-lifeevents': 1, 'panel-datefinder': 1, 'panel-tools': 1 };
  const COVERED = { 'panel-overview': 1, 'panel-planets': 1, 'panel-yogas': 1, 'panel-shadbala': 1, 'panel-ashtakavarga': 1, 'panel-dasha': 1, 'panel-transit': 1 };
  const KEY = 'vax_export_sel_v2';
  const PRESETS = {
    essentials: ['birthDetails', 'chartSummary', 'planetTable', 'xp_houses', 'yogas', 'dasha'],
    ai: ['birthDetails', 'chartSummary', 'karakas', 'planetTable', 'aspects', 'yogas', 'shadbala', 'ashtakavarga', 'dasha', 'vargas', 'xp_houses', 'xp_aiPrompt'],
    all: null, none: []
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtN = n => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e4 ? Math.round(n / 1e3) + 'K' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n);

  /* the list of choices, in groups; pages come from HOME_ITEMS so a new tool appears here by itself */
  function defs() {
    const G = [
      { id: 'data', title: 'Chart data', items: [['birthDetails', 'Birth details', 'Name, date, time, place, ayanamsa'], ['chartSummary', 'Chart summary', 'Lagna, Moon sign, Sun sign, nakshatra'], ['planetTable', 'Planet positions', 'Sign, degree, house, nakshatra, dignity, speed'], ['aspects', 'Aspects', 'Houses each planet aspects'], ['xp_houses', 'House-by-house summary', 'Sign, lord, occupants, aspects received'], ['karakas', 'Chara karakas', 'Atmakaraka to Darakaraka (Jaimini)'], ['rawLongitudes', 'Raw longitudes', 'For cross-checking other software']] },
      { id: 'vargas', title: 'Divisional charts', items: [['vargas', 'Divisional charts', 'House by house with dignity; choose which charts below']] },
      { id: 'strength', title: 'Strength and combinations', items: [['yogas', 'Yogas', 'Combinations found in the chart'], ['shadbala', 'Shadbala', 'Six-fold planet strength, all parts'], ['ashtakavarga', 'Ashtakavarga', 'Seven planet tables and the total']] },
      { id: 'timing', title: 'Timing', items: [['dasha', 'Vimshottari Dasha', 'Every Mahadasha and Antardasha'], ['liveSky', 'Sky right now', 'Today\'s planets against this chart (needs a place)']] },
      { id: 'reading', title: 'Written reading', items: [['deepReading', 'Deep reading', 'Classical meaning of each planet, aspect, house lord and house']] }
    ];
    const pages = (typeof HOME_ITEMS !== 'undefined' ? HOME_ITEMS : []).filter(i => !SKIPP[i[0]]);
    const byId = {}; pages.forEach(i => byId[i[0]] = i);
    const sub = []; const seen = {};
    if (typeof THB !== 'undefined') THB.groups().forEach(g => { const its = g.items.filter(i => byId[i[0]]); its.forEach(i => seen[i[0]] = 1); if (its.length) sub.push({ title: g.title, items: its }); });
    const rest = pages.filter(i => !seen[i[0]]); if (rest.length) sub.push({ title: 'More tools', items: rest });
    G.push({ id: 'pages', title: 'Tool pages as shown in the app', note: 'The written text of each tool\'s screen. Off by default.', sub: sub.map(s => ({ title: s.title, items: s.items.map(i => ['xp_' + i[0], i[2], COVERED[i[0]] ? 'Adds the written reading; the data is already in the sections above' : i[3], i[0]]) })) });
    G.push({ id: 'ai', title: 'For an AI', items: [['xp_aiPrompt', 'AI instructions', 'A short note at the top telling an AI how to read the file'], ['xp_json', 'Raw data (JSON) inside the text', 'Every computed value, added at the end']] });
    return G;
  }
  const flat = () => { const o = []; defs().forEach(g => { (g.items || []).forEach(i => o.push(i)); (g.sub || []).forEach(s => s.items.forEach(i => o.push(i))); }); return o; };

  const ST = { sel: {}, vg: null, fmt: 'txt', split: 0, live: { mode: 'birth', lat: '', lon: '', tz: '' }, sizes: {}, base: 0, open: { data: 1, strength: 1 }, parts: null, pid: '' };
  function load() {
    let s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
    const keys = flat().map(i => i[0]);
    ST.sel = {}; keys.forEach(k => ST.sel[k] = false);
    (s && s.sel ? s.sel : PRESETS.essentials).forEach(k => { if (k in ST.sel) ST.sel[k] = true; });
    ST.vg = new Set((s && s.vg) ? s.vg.filter(k => typeof VARGAS !== 'undefined' && VARGAS[k]) : Object.keys(typeof VARGAS !== 'undefined' ? VARGAS : {}));
    if (!ST.vg.size && typeof VARGAS !== 'undefined') ST.vg = new Set(Object.keys(VARGAS));
    ST.fmt = s && s.fmt === 'json' ? 'json' : 'txt'; ST.split = s && [0, 20000, 50000, 100000].includes(s.split) ? s.split : 0;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ sel: Object.keys(ST.sel).filter(k => ST.sel[k]), vg: [...ST.vg], fmt: ST.fmt, split: ST.split })); } catch (e) { /* no storage: fine */ } }
  const chartOk = () => typeof currentChartForModal !== 'undefined' && currentChartForModal && typeof currentProfileForExport !== 'undefined' && currentProfileForExport;

  /* ---- build the text ---- */
  function ensurePages(keys) {
    /* a tool page that was never opened has no screen to read yet: open it quietly, then come back */
    const miss = keys.filter(k => k.indexOf('xp_panel-') === 0).map(k => k.slice(3)).filter(id => !document.getElementById(id));
    if (!miss.length || typeof switchAppTab !== 'function') return;
    window.__thbQuiet = true; try { miss.forEach(id => { try { switchAppTab(id); } catch (e) { /* skip */ } }); switchAppTab('panel-export'); } finally { window.__thbQuiet = false; }
  }
  function sectionsFor(only) {
    const S = {}; BASE.forEach(k => S[k] = false); S.vargaKeys = [...ST.vg]; S.liveSky = false;
    flat().forEach(i => { if (i[0].indexOf('xp_') === 0) S[i[0]] = false; });
    (only || Object.keys(ST.sel).filter(k => ST.sel[k])).forEach(k => { S[k] = true; });
    return S;
  }
  function liveData() {
    const p = currentProfileForExport, L = ST.live;
    const lat = L.mode === 'birth' ? p.lat : parseFloat(L.lat), lon = L.mode === 'birth' ? p.lon : parseFloat(L.lon), tz = L.mode === 'birth' ? Number(p.tz) : parseFloat(L.tz);
    if (!isFinite(lat) || !isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180 || !isFinite(tz)) return { error: 'Enter a latitude (-90 to 90), a longitude (-180 to 180) and a timezone for the sky-right-now section, or untick it.' };
    return { sky: computeLiveSky(lat, lon, currentChartForModal.ascendant.sign), lat, lon, tz, locationLabel: L.mode === 'birth' ? (p.place || 'birth place') : (lat.toFixed(4) + '°, ' + lon.toFixed(4) + '°') };
  }
  function buildText() {
    if (!chartOk()) return { error: 'Make a chart first.' };
    const on = Object.keys(ST.sel).filter(k => ST.sel[k]);
    if (!on.length) return { error: 'Pick at least one section.' };
    ensurePages(on);
    const S = sectionsFor(), wantLive = !!ST.sel.liveSky; let live = null;
    if (wantLive) { live = liveData(); if (live.error) return { error: live.error }; S.liveSky = true; }
    return { text: buildFullReportText(currentChartForModal, currentProfileForExport, S, live) };
  }
  function rawJSON() {
    if (!chartOk()) return { error: 'Make a chart first.' };
    const stack = [];
    return { text: JSON.stringify({ profile: currentProfileForExport, chart: currentChartForModal }, function (k, v) {
      if (typeof v === 'function') return undefined; if (typeof v === 'number') return isFinite(v) ? Math.round(v * 1e5) / 1e5 : null; if (v instanceof Date) return v.toISOString();
      if (v && typeof v === 'object') { while (stack.length && stack[stack.length - 1] !== this) stack.pop(); if (stack.indexOf(v) > -1) return '[circular]'; stack.push(v); } return v; }, 1) };
  }
  /* cut a long text into parts at line breaks, preferring a blank line */
  function splitText(t, n) {
    if (!n || t.length <= n) return [t];
    const out = []; let i = 0;
    while (i < t.length) {
      if (t.length - i <= n) { out.push(t.slice(i)); break; }
      let cut = t.lastIndexOf('\n\n', i + n); if (cut <= i + n * 0.5) cut = t.lastIndexOf('\n', i + n); if (cut <= i) cut = i + n;
      out.push(t.slice(i, cut)); i = cut; while (t[i] === '\n') i++;
    }
    return out.map((p, k) => `[Part ${k + 1} of ${out.length}]\n${p}${k < out.length - 1 ? '\n[Continued in the next part]' : '\n[End]'}`);
  }

  /* ---- sizes (lazy) ---- */
  let sizeRun = 0;
  function measure() {
    const run = ++sizeRun; ST.sizes = {}; ST.base = 0;
    if (!chartOk()) return;
    const keys = flat().map(i => i[0]).filter(k => k !== 'liveSky');
    try { ST.base = buildFullReportText(currentChartForModal, currentProfileForExport, sectionsFor([]), null).length; } catch (e) { ST.base = 0; }
    let i = 0;
    (function step() {
      if (run !== sizeRun || i >= keys.length) { paintTotals(); return; }
      const k = keys[i++];
      try { ensurePages([k]); ST.sizes[k] = Math.max(0, buildFullReportText(currentChartForModal, currentProfileForExport, sectionsFor([k]), null).length - ST.base); } catch (e) { ST.sizes[k] = 0; }
      const el = document.querySelector(`.exb [data-size="${k}"]`); if (el) el.textContent = fmtN(ST.sizes[k]);
      paintGroups(); paintTotals(); setTimeout(step, 0);
    })();
  }
  const sizeOf = k => ST.sizes[k];
  function total() {
    const on = Object.keys(ST.sel).filter(k => ST.sel[k]); let n = ST.base, pending = 0;
    on.forEach(k => { if (k === 'liveSky') n += 2500; else if (k === 'vargas' && ST.sizes.vargas != null) n += Math.round(ST.sizes.vargas * (ST.vg.size / Math.max(1, Object.keys(VARGAS).length))); else if (ST.sizes[k] != null) n += ST.sizes[k]; else pending++; });
    return { on: on.length, chars: n, pending };
  }

  /* ---- screen ---- */
  function row(i) {
    const k = i[0];
    return `<label class="exb-r${ST.sel[k] ? ' on' : ''}"><input type="checkbox" data-exb="sel" data-k="${k}"${ST.sel[k] ? ' checked' : ''}><span class="exb-rt"><b>${esc(i[1])}</b><small>${esc(i[2])}</small></span><em data-size="${k}">${k === 'liveSky' ? '~2K' : sizeOf(k) != null ? fmtN(sizeOf(k)) : '…'}</em></label>` + (k === 'vargas' ? vargaBox() : '') + (k === 'liveSky' ? liveBox() : '');
  }
  function vargaBox() {
    const keys = Object.keys(typeof VARGAS !== 'undefined' ? VARGAS : {});
    return `<div class="exb-sub" data-for="vargas"${ST.sel.vargas ? '' : ' hidden'}><div class="exb-sh"><span>Charts to include (${ST.vg.size} of ${keys.length})</span><button type="button" data-exb="vgall">All</button><button type="button" data-exb="vgnone">None</button></div><div class="exb-vg">${keys.map(k => `<button type="button" class="${ST.vg.has(k) ? 'on' : ''}" data-exb="vg" data-k="${esc(k)}">${esc(k)}</button>`).join('')}</div></div>`;
  }
  function liveBox() {
    const L = ST.live, p = chartOk() ? currentProfileForExport : {};
    return `<div class="exb-sub" data-for="liveSky"${ST.sel.liveSky ? '' : ' hidden'}><div class="exb-seg" role="group" aria-label="Place for the sky"><button type="button" class="${L.mode === 'birth' ? 'on' : ''}" data-exb="livemode" data-m="birth">Birth place${p.place ? ': ' + esc(String(p.place).split(',')[0]) : ''}</button><button type="button" class="${L.mode === 'coords' ? 'on' : ''}" data-exb="livemode" data-m="coords">Other place</button></div>
      <div class="exb-coords"${L.mode === 'coords' ? '' : ' hidden'}><label>Latitude<input type="number" inputmode="decimal" step="0.0001" min="-90" max="90" data-exb="lat" value="${esc(L.lat)}" placeholder="28.6139"></label><label>Longitude<input type="number" inputmode="decimal" step="0.0001" min="-180" max="180" data-exb="lon" value="${esc(L.lon)}" placeholder="77.2090"></label><label>Timezone (UTC)<input type="number" inputmode="decimal" step="0.25" min="-12" max="14" data-exb="tz" value="${esc(L.tz)}" placeholder="5.5"></label></div></div>`;
  }
  function groupHtml(g) {
    const items = g.items || [], subs = g.sub || [], all = items.concat(...subs.map(s => s.items)), n = all.filter(i => ST.sel[i[0]]).length;
    const sz = all.reduce((a, i) => a + (ST.sel[i[0]] && ST.sizes[i[0]] != null ? ST.sizes[i[0]] : 0), 0), open = !!ST.open[g.id];
    return `<section class="exb-g${open ? ' open' : ''}" data-g="${g.id}"><div class="exb-gh"><button type="button" class="exb-gt" data-exb="toggle" data-g="${g.id}" aria-expanded="${open}"><i aria-hidden="true">›</i><span><b>${esc(g.title)}</b><small data-gcount="${g.id}">${n} of ${all.length} selected${n ? ' · ' + fmtN(sz) : ''}</small></span></button><button type="button" class="exb-mini" data-exb="gall" data-g="${g.id}">All</button><button type="button" class="exb-mini" data-exb="gnone" data-g="${g.id}">None</button></div>
      <div class="exb-gb"${open ? '' : ' hidden'}>${g.note ? `<p class="exb-note">${esc(g.note)}</p>` : ''}${items.map(row).join('')}${subs.map(s => `<h5 class="exb-sh5">${esc(s.title)}</h5>${s.items.map(row).join('')}`).join('')}</div></section>`;
  }
  function groupsHtml() { return defs().map(groupHtml).join(''); }
  function presetOn(name) {
    const on = Object.keys(ST.sel).filter(k => ST.sel[k]), want = name === 'all' ? flat().map(i => i[0]).filter(k => k !== 'liveSky') : PRESETS[name];
    return on.length === want.length && want.every(k => ST.sel[k]);
  }
  function html() {
    const p = chartOk() ? currentProfileForExport : null;
    return `<div class="exb"><div class="exb-hero"><h3>Export</h3><p>${p ? `<b>${esc(p.name || 'Chart')}</b> · ${esc(p.dob || '')} ${esc(String(p.tob || '').slice(0, 5))} · ${esc(String(p.place || '').split(',')[0])}` : 'Make a chart first.'}</p></div>
      <div class="exb-step"><h4><span>1</span>Start from</h4><div class="exb-pre" id="exbPre">${[['essentials', 'Essentials'], ['ai', 'For an AI'], ['all', 'Everything'], ['none', 'Nothing']].map(a => `<button type="button" data-exb="preset" data-p="${a[0]}" class="${presetOn(a[0]) ? 'on' : ''}">${a[1]}</button>`).join('')}</div></div>
      <div class="exb-step"><h4><span>2</span>Output</h4>
        <div class="exb-opt"><label>File type</label><div class="exb-seg" role="group" aria-label="File type"><button type="button" class="${ST.fmt === 'txt' ? 'on' : ''}" data-exb="fmt" data-f="txt">Text report</button><button type="button" class="${ST.fmt === 'json' ? 'on' : ''}" data-exb="fmt" data-f="json">Raw data (JSON)</button></div></div>
        <div class="exb-opt" id="exbSplitWrap"${ST.fmt === 'json' ? ' hidden' : ''}><label>Split into parts <small>for AI chats with a size limit</small></label><div class="exb-seg" role="group" aria-label="Split size">${[[0, 'No split'], [20000, '20K'], [50000, '50K'], [100000, '100K']].map(a => `<button type="button" class="${ST.split === a[0] ? 'on' : ''}" data-exb="split" data-n="${a[0]}">${a[1]}</button>`).join('')}</div></div>
        <button type="button" class="exb-pdf" data-pdf-studio>Make a PDF report instead</button></div>
      <div class="exb-step"><h4><span>3</span>Choose sections <input type="search" id="exbQ" class="exb-q" placeholder="Search sections" aria-label="Search sections" autocomplete="off"></h4><div id="exbGroups">${groupsHtml()}</div></div>
      <div id="exbParts"></div>
      <div class="exb-bar" id="exbBar"><div class="exb-tot" id="exbTot" aria-live="polite"></div><div class="exb-act"><button type="button" class="exb-b2" data-exb="download" id="exbDl">Download</button><button type="button" class="exb-b1" data-exb="copy" id="exbCp">Copy</button></div></div></div>`;
  }
  function paintTotals() {
    const el = document.getElementById('exbTot'); if (!el) return;
    const t = total(), json = ST.fmt === 'json';
    if (json) el.innerHTML = `<b>Raw chart data</b><small>JSON file of the whole computed chart</small>`;
    else {
      const tok = Math.round(t.chars / 4), big = tok > 150000;
      el.innerHTML = `<b>${t.on} section${t.on === 1 ? '' : 's'}</b><small>${t.pending ? 'measuring… ' : '≈ '}${fmtN(t.chars)} characters · ≈ ${fmtN(tok)} AI tokens</small>${big && !ST.split ? '<small class="exb-warn">Large. Some AI chats cannot take this much: use Split.</small>' : ''}`;
    }
    const none = !json && t.on === 0; ['exbDl', 'exbCp'].forEach(id => { const b = document.getElementById(id); if (b) b.disabled = none; });
  }
  function paintGroups() {
    defs().forEach(g => {
      const all = (g.items || []).concat(...(g.sub || []).map(s => s.items)), n = all.filter(i => ST.sel[i[0]]).length, sz = all.reduce((a, i) => a + (ST.sel[i[0]] && ST.sizes[i[0]] != null ? ST.sizes[i[0]] : 0), 0);
      const c = document.querySelector(`[data-gcount="${g.id}"]`); if (c) c.textContent = `${n} of ${all.length} selected${n ? ' · ' + fmtN(sz) : ''}`;
    });
    document.querySelectorAll('.exb-r').forEach(r => { const cb = r.querySelector('input'); if (cb) { cb.checked = !!ST.sel[cb.dataset.k]; r.classList.toggle('on', cb.checked); } });
    document.querySelectorAll('#exbPre button').forEach(b => b.classList.toggle('on', presetOn(b.dataset.p)));
    ['vargas', 'liveSky'].forEach(k => { const s = document.querySelector(`.exb-sub[data-for="${k}"]`); if (s) s.hidden = !ST.sel[k]; });
    const sh = document.querySelector('.exb-sh span'); if (sh) sh.textContent = `Charts to include (${ST.vg.size} of ${Object.keys(VARGAS).length})`;
    document.querySelectorAll('.exb-vg button').forEach(b => b.classList.toggle('on', ST.vg.has(b.dataset.k)));
  }
  function setGroup(id, v) { const g = defs().find(x => x.id === id); if (!g) return; (g.items || []).concat(...(g.sub || []).map(s => s.items)).forEach(i => { ST.sel[i[0]] = v; }); }
  function flash(msg, bad) {
    const t = document.getElementById('exbTot'); if (!t) return;
    const f = document.createElement('div'); f.className = 'exb-flash' + (bad ? ' bad' : ''); f.textContent = msg; t.parentNode.insertBefore(f, t); setTimeout(() => f.remove(), 3200);
  }
  const fname = ext => ((currentProfileForExport.name || 'chart').replace(/[^a-z0-9]/gi, '_')) + '_vedic_chart' + ext;
  function save1(text, name, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function copy1(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall back */ }
    try { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(ta); ta.focus(); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e) { return false; }
  }
  function showParts(parts) {
    const box = document.getElementById('exbParts'); if (!box) return; ST.parts = parts;
    box.innerHTML = parts.length < 2 ? '' : `<div class="exb-step"><h4><span>✓</span>${parts.length} parts ready</h4><p class="exb-note">Paste them in order, one message each.</p>${parts.map((p, i) => `<div class="exb-pt"><b>Part ${i + 1} of ${parts.length}</b><small>${fmtN(p.length)} characters</small><button type="button" class="exb-mini" data-exb="pcopy" data-i="${i}">Copy</button><button type="button" class="exb-mini" data-exb="psave" data-i="${i}">Save</button></div>`).join('')}</div>`;
    if (parts.length > 1) box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  async function act(kind) {
    const json = ST.fmt === 'json', r = json ? rawJSON() : buildText();
    if (r.error) { flash(r.error, true); return; }
    const parts = json ? [r.text] : splitText(r.text, ST.split);
    if (parts.length > 1) { showParts(parts); flash(`Split into ${parts.length} parts of up to ${fmtN(ST.split)} characters. Use the buttons below.`); return; }
    showParts(parts);
    if (kind === 'copy') flash((await copy1(r.text)) ? `Copied ${r.text.length.toLocaleString('en')} characters` : 'The browser blocked copying. Use Download.', false);
    else { save1(r.text, fname(json ? '.json' : '.txt'), json ? 'application/json' : 'text/plain'); flash(`Downloaded ${r.text.length.toLocaleString('en')} characters`, false); }
  }
  function bind() {
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-exb]'); if (!b) return; const root = b.closest('.exb'); if (!root) return; const a = b.dataset.exb;
      if (a === 'toggle') { ST.open[b.dataset.g] = !ST.open[b.dataset.g]; const g = b.closest('.exb-g'); g.classList.toggle('open', !!ST.open[b.dataset.g]); g.querySelector('.exb-gb').hidden = !ST.open[b.dataset.g]; b.setAttribute('aria-expanded', String(!!ST.open[b.dataset.g])); return; }
      if (a === 'gall' || a === 'gnone') { setGroup(b.dataset.g, a === 'gall'); }
      else if (a === 'preset') { const p = b.dataset.p, keys = flat().map(x => x[0]); keys.forEach(k => ST.sel[k] = false); (p === 'all' ? keys.filter(k => k !== 'liveSky') : PRESETS[p]).forEach(k => { if (k in ST.sel) ST.sel[k] = true; }); }
      else if (a === 'fmt') { ST.fmt = b.dataset.f; root.querySelectorAll('[data-exb=fmt]').forEach(x => x.classList.toggle('on', x === b)); document.getElementById('exbSplitWrap').hidden = ST.fmt === 'json'; }
      else if (a === 'split') { ST.split = parseInt(b.dataset.n, 10); root.querySelectorAll('[data-exb=split]').forEach(x => x.classList.toggle('on', x === b)); }
      else if (a === 'vg') { const k = b.dataset.k; if (ST.vg.has(k)) ST.vg.delete(k); else ST.vg.add(k); }
      else if (a === 'vgall') ST.vg = new Set(Object.keys(VARGAS)); else if (a === 'vgnone') ST.vg = new Set();
      else if (a === 'livemode') { ST.live.mode = b.dataset.m; root.querySelectorAll('[data-exb=livemode]').forEach(x => x.classList.toggle('on', x === b)); root.querySelector('.exb-coords').hidden = ST.live.mode !== 'coords'; }
      else if (a === 'copy' || a === 'download') { act(a === 'copy' ? 'copy' : 'download'); return; }
      else if (a === 'pcopy') { const i = +b.dataset.i; copy1(ST.parts[i]).then(ok => flash(ok ? `Copied part ${i + 1}` : 'The browser blocked copying. Use Save.', !ok)); return; }
      else if (a === 'psave') { const i = +b.dataset.i; save1(ST.parts[i], fname('_part' + (i + 1) + 'of' + ST.parts.length + '.txt'), 'text/plain'); return; }
      else return;
      save(); paintGroups(); paintTotals();
    });
    document.addEventListener('change', e => {
      const t = e.target; if (!t.dataset || !t.dataset.exb) return;
      if (t.dataset.exb === 'sel') { ST.sel[t.dataset.k] = t.checked; save(); paintGroups(); paintTotals(); }
    });
    document.addEventListener('input', e => {
      const t = e.target;
      if (t.id === 'exbQ') { const q = t.value.trim().toLowerCase(); document.querySelectorAll('#exbGroups .exb-g').forEach(g => { let any = false; g.querySelectorAll('.exb-r').forEach(r => { const m = !q || r.textContent.toLowerCase().indexOf(q) >= 0; r.style.display = m ? '' : 'none'; if (m) any = true; }); g.querySelectorAll('.exb-sh5').forEach(h => { let n = h.nextElementSibling, vis = false; while (n && n.classList.contains('exb-r')) { if (n.style.display !== 'none') vis = true; n = n.nextElementSibling; } h.style.display = vis || !q ? '' : 'none'; }); g.style.display = any ? '' : 'none'; if (q && any) { g.classList.add('open'); g.querySelector('.exb-gb').hidden = false; } }); return; }
      if (t.dataset && (t.dataset.exb === 'lat' || t.dataset.exb === 'lon' || t.dataset.exb === 'tz')) ST.live[t.dataset.exb] = t.value;
    });
  }
  if (typeof document !== 'undefined' && document.addEventListener) bind();

  let lastPid = '';
  function pid() { return chartOk() ? [currentProfileForExport.name, currentProfileForExport.dob, currentProfileForExport.tob, currentProfileForExport.lat, currentProfileForExport.lon].join('|') : ''; }
  function render() {
    const root = document.getElementById('panel-export'); if (!root) return;
    if (!Object.keys(ST.sel).length) load();
    root.innerHTML = html(); paintTotals(); lastPid = pid(); measure();
  }
  if (typeof switchAppTab === 'function') {
    const _s = window.switchAppTab || switchAppTab;
    window.switchAppTab = function (id) {
      const r = _s.apply(this, arguments);
      try { if (id === 'panel-export' && !window.__thbQuiet && (lastPid !== pid() || !document.querySelector('#panel-export .exb'))) render(); } catch (e) { console.warn('export builder', e); }
      return r;
    };
  }
  window.openExportBuilder = function () { if (!chartOk()) { alert('Please generate a chart first before exporting a report.'); return; } window.switchAppTab('panel-export'); };
  window.buildExportBuilderPanel = function () { load(); return html(); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-export', window.buildExportBuilderPanel);
  return { defs, flat, sectionsFor, splitText, total, buildText, rawJSON, load, state: ST, BASE, PRESETS, presetOn, sizeOf, measure, html };
})();

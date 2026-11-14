/* AI Astrologer panel (js/160, global AIUI, panel-ai). Tabs: Chat, Variables (browse the AIX index, preview a value, pin "always include"), Persona, Skills (upload instructions), Settings (providers, limits, privacy).
   All logic is in AIS/AIE (js/159) and AIX (js/158). Class-scoped (aix-) only. Only transform/opacity animate; no backdrop-filter; 40px tap targets. */
const AIUI = (() => {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = { tab: 'chat', busy: false, stage: '', prev: null, pv: {}, edit: null, msg: '', sk: null, test: null, show: false, q: '' };
  const $ = id => document.getElementById(id), D = () => AIS.load();
  const TABS = [['chat', 'Chat'], ['vars', 'Variables'], ['persona', 'Persona'], ['skills', 'Skills'], ['set', 'Settings']];
  const ex = ['Give me a short summary of my chart', 'Which dasha is running and what does it mean?', 'How does my 10th house look for career?', 'What is the hora right now, and is it good to start something?'];
  const fmt = t => esc(t).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\[((?:raw:)?[A-Za-z0-9_.]+)\]/g, '<i class="aix-ref">$1</i>').split('\n').map(l => /^\s*[-*•]\s+/.test(l) ? '<div class="aix-li">' + l.replace(/^\s*[-*•]\s+/, '') + '</div>' : (l.trim() ? '<div>' + l + '</div>' : '<div class="aix-sp"></div>')).join('');
  const ready = () => { const p = AIS.provider(); return !!(p && (p.baseUrl || p.kind !== 'openai') && (p.model || p.kind === 'gemini') && (p.apiKey || p.auth === 'none')); };

  function head() { const p = AIS.provider(), per = AIS.persona();
    return `<div class="aix-head"><div><h2>AI Astrologer</h2><p>Your model, your key, your rules. It reads only the chart variables each question needs.</p></div><button type="button" class="aix-chip ${ready() ? 'aix-ok' : 'aix-warn'}" data-tab="set">${ready() ? esc(p.name) + ' · ' + esc(p.model || 'default model') : 'Set up a provider'}</button></div>
    <div class="aix-tabs" role="tablist">${TABS.map(t => `<button type="button" role="tab" data-tab="${t[0]}" class="${S.tab === t[0] ? 'aix-on' : ''}" aria-selected="${S.tab === t[0]}">${t[1]}</button>`).join('')}</div>`; }

  /* ---------- Chat ---------- */
  function chat() {
    const s = D(), per = AIS.persona(), act = AIE.activeSkills().map(k => k.id), msgs = s.chat || [];
    const notice = s.settings.noticeOk ? '' : `<div class="aix-note"><b>Before you chat.</b> Your question and the chart variables it needs are sent to the provider you set up, from this device, using your key. Nothing goes through our servers. Keys stay in this app's storage on this device only.<button type="button" class="aix-btn aix-gold" data-act="ok-notice">I understand</button></div>`;
    const bar = `<div class="aix-bar"><label class="aix-sel"><span>${esc(per.icon || '✦')}</span><select data-f="activePersona" aria-label="Persona">${AIS.personas().map(p => `<option value="${p.id}" ${p.id === per.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>${s.skills.map(k => `<button type="button" class="aix-chip ${act.includes(k.id) ? 'aix-ok' : ''}" data-act="skill-use" data-id="${k.id}" title="Use this skill in the chat">${esc(k.name)}</button>`).join('')}${msgs.length ? '<button type="button" class="aix-chip" data-act="clear">Clear</button>' : ''}</div>`;
    const list = msgs.length ? msgs.map((m, i) => m.role === 'user' ? `<div class="aix-m aix-u"><div class="aix-b">${fmt(m.text)}</div></div>` : `<div class="aix-m aix-a"><div class="aix-b ${m.err ? 'aix-err' : ''}">${fmt(m.text)}</div>${m.meta ? `<div class="aix-used"><span>${esc(m.meta.persona)}${m.meta.skills && m.meta.skills.length ? ' + ' + esc(m.meta.skills.join(', ')) : ''}</span>${(m.meta.used || []).map(u => `<i class="${u.ok ? '' : 'aix-bad'}" title="${u.ok ? '≈' + u.tokens + ' tokens' : 'no value'}">${esc(u.id)}</i>`).join('')}</div>` : ''}${!m.err ? `<div class="aix-acts"><button type="button" data-act="copy" data-i="${i}">Copy</button></div>` : ''}</div>`).join('')
      : `<div class="aix-empty"><div class="aix-orb" aria-hidden="true">✦</div><p>Ask anything about this chart. The AI first looks at the index, then asks the app for only the variables it needs.</p><div class="aix-ex">${ex.map(x => `<button type="button" data-act="ex" data-q="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`;
    return `${notice}${bar}<div class="aix-list" id="aixList">${list}${S.busy ? `<div class="aix-m aix-a"><div class="aix-b aix-typing"><span class="aix-dots"><i></i><i></i><i></i></span> ${esc(S.stage)}</div></div>` : ''}</div>
      <div class="aix-comp"><textarea id="aixIn" rows="1" placeholder="${ready() ? 'Ask about your chart…' : 'Set up a provider in Settings first'}" aria-label="Your question">${esc(S.q)}</textarea><button type="button" class="aix-send" data-act="send" aria-label="Send" ${S.busy ? 'disabled' : ''}>➤</button></div>`;
  }
  async function send(q) {
    q = (q || '').trim(); if (!q || S.busy) return;
    if (!ready()) { S.tab = 'set'; S.msg = 'Add your provider details first.'; return render(); }
    const s = D(); s.chat = (s.chat || []).concat([{ role: 'user', text: q }]); S.q = ''; S.busy = true; S.stage = 'Choosing the data it needs…'; AIS.save(); render(); scrollEnd();
    try {
      const r = await AIE.ask(q, { onStage: g => { S.stage = g === 'routing' ? 'Choosing the data it needs…' : g === 'fetching' ? 'Reading those variables…' : 'Writing the answer…'; const t = $('aixList'); const el = t && t.querySelector('.aix-typing'); if (el) el.lastChild.textContent = ' ' + S.stage; } });
      s.chat.push({ role: 'assistant', text: r.answer, meta: { used: r.used, persona: r.persona, skills: r.skills } });
    } catch (e) { s.chat.push({ role: 'assistant', text: String(e.message || e), err: true }); }
    s.chat = s.chat.slice(-60); S.busy = false; AIS.save(); render(); scrollEnd();
  }
  function scrollEnd() { const l = $('aixList'); if (l) l.lastElementChild && l.lastElementChild.scrollIntoView({ block: 'end', behavior: 'smooth' }); }

  /* ---------- Variables ---------- */
  function vars() {
    const pins = D().settings.pinned || [], q = (S.vq || '').toLowerCase(), all = AIX.list().filter(e => !q || (e.id + ' ' + e.t + ' ' + e.d + ' ' + e.g).toLowerCase().includes(q));
    let g = '', out = '';
    all.forEach(e => { if (e.g !== g) { g = e.g; out += `<h4 class="aix-gh">${esc(g)}</h4>`; }
      const sel = S.pv[e.id] || (e.p ? e.p[0] : ''), id = e.p ? e.id + '.' + sel : e.id, open = S.prev === id;
      out += `<div class="aix-v"><div class="aix-vh"><div><code>${esc(e.p ? e.id + '.{…}' : e.id)}</code><b>${esc(e.t)}</b></div><button type="button" class="aix-pin ${pins.includes(id) ? 'aix-on' : ''}" data-act="pin" data-id="${esc(id)}" aria-label="Always include ${esc(id)}" title="Always include in every question">★</button></div><p>${esc(e.d)}</p>
        ${e.p ? `<div class="aix-prm"><select data-pv="${e.id}" aria-label="Parameter">${e.p.map(x => `<option ${x === sel ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>` : ''}
        <div class="aix-vf">${(e.l || []).map(l => `<span class="aix-ref">${esc(l)}</span>`).join('')}<button type="button" class="aix-btn" data-act="prev" data-id="${esc(id)}">${open ? 'Hide' : 'Preview'}</button></div>${open ? preview(id) : ''}</div>`; });
    return `<div class="aix-vtop"><p class="aix-lead">This is the index the AI reads. Each question, it picks ids from here and the app fetches only those. Tap ★ to include a variable in every question.</p><input type="search" id="aixVq" placeholder="Search variables…" value="${esc(S.vq || '')}" aria-label="Search variables"><div class="aix-raw"><input id="aixRaw" placeholder="raw:planets.Moon.nakshatra" value="${esc(S.rawQ || '')}" aria-label="Raw path"><button type="button" class="aix-btn" data-act="prev-raw">Preview raw</button></div>${S.prev && /^raw:/.test(S.prev) ? preview(S.prev) : ''}</div>${out || '<p class="aix-lead">No variable matches.</p>'}`;
  }
  function preview(id) { const g = AIX.get(id, 3000); return `<pre class="aix-pre ${g.ok ? '' : 'aix-err'}">${esc(g.text)}</pre>${g.ok ? `<div class="aix-tok">≈ ${g.tokens} tokens</div>` : ''}`; }

  /* ---------- Persona ---------- */
  function persona() {
    const s = D(), cur = AIS.persona().id, e = S.edit && S.edit.kind === 'persona' ? S.edit.v : null;
    const row = p => `<div class="aix-card ${p.id === cur ? 'aix-sel-on' : ''}"><div class="aix-ch"><span class="aix-em">${esc(p.icon || '✦')}</span><div><b>${esc(p.name)}</b><small>${p.builtin ? 'Built in' : 'Custom'}${p.language ? ' · ' + esc(p.language) : ''}</small></div></div><p>${esc(p.system.slice(0, 160))}${p.system.length > 160 ? '…' : ''}</p><div class="aix-row"><button type="button" class="aix-btn ${p.id === cur ? 'aix-gold' : ''}" data-act="use-persona" data-id="${p.id}">${p.id === cur ? 'Active' : 'Use'}</button><button type="button" class="aix-btn" data-act="${p.builtin ? 'dup-persona' : 'edit-persona'}" data-id="${p.id}">${p.builtin ? 'Copy to edit' : 'Edit'}</button>${p.builtin ? '' : `<button type="button" class="aix-btn aix-danger" data-act="del-persona" data-id="${p.id}">Delete</button>`}</div></div>`;
    const form = e ? `<div class="aix-form"><h4>${e.isNew ? 'New persona' : 'Edit persona'}</h4><label>Name<input data-pe="name" value="${esc(e.name)}"></label><label>Icon (one emoji)<input data-pe="icon" value="${esc(e.icon || '')}" maxlength="4"></label><label>Always answer in (optional)<input data-pe="language" value="${esc(e.language || '')}" placeholder="e.g. Hindi, Tamil, English"></label><label>Persona instructions<textarea data-pe="system" rows="7">${esc(e.system)}</textarea></label><div class="aix-row"><button type="button" class="aix-btn aix-gold" data-act="save-persona">Save</button><button type="button" class="aix-btn" data-act="cancel-edit">Cancel</button></div></div>` : '';
    return `<p class="aix-lead">A persona is the voice and attitude the AI answers in. Switch any time; it also shows in the chat bar.</p>${AIS.personas().map(row).join('')}<button type="button" class="aix-btn aix-wide" data-act="new-persona">＋ New persona</button>${form}`;
  }

  /* ---------- Skills ---------- */
  function skills() {
    const s = D(), act = s.activeSkills;
    const row = k => `<div class="aix-card ${act.includes(k.id) ? 'aix-sel-on' : ''}"><div class="aix-ch"><span class="aix-em">⚙</span><div><b>${esc(k.name)}</b><small>${esc(k.description || 'Uploaded skill')} · ${k.instructions.length} characters</small></div></div>${k.variables && k.variables.length ? `<div class="aix-vf">${k.variables.map(v => `<span class="aix-ref">${esc(v)}</span>`).join('')}</div>` : ''}${S.sk === k.id ? `<pre class="aix-pre">${esc(k.instructions)}</pre>` : ''}<div class="aix-row"><button type="button" class="aix-btn ${act.includes(k.id) ? 'aix-gold' : ''}" data-act="skill-use" data-id="${k.id}">${act.includes(k.id) ? 'In use' : 'Use in chat'}</button><button type="button" class="aix-btn" data-act="skill-view" data-id="${k.id}">${S.sk === k.id ? 'Hide' : 'View'}</button><button type="button" class="aix-btn" data-act="skill-exp" data-id="${k.id}">Export</button><button type="button" class="aix-btn aix-danger" data-act="skill-del" data-id="${k.id}">Delete</button></div></div>`;
    return `<p class="aix-lead">A skill is a set of instructions you upload. When it is switched on, the AI follows it exactly, before its own style. Skills can also list variables they always need.</p>
      ${S.msg ? `<div class="aix-note">${esc(S.msg)}</div>` : ''}<label class="aix-up"><input type="file" id="aixFile" accept=".md,.txt,.json,text/plain,application/json,text/markdown" multiple hidden><span>⬆ Upload skill file(s)</span><small>.md, .txt or .json</small></label>
      ${s.skills.map(row).join('') || '<p class="aix-lead">No skills yet.</p>'}
      <details class="aix-det"><summary>Or paste a skill</summary><label>Name<input id="aixSkN" placeholder="My skill"></label><label>Instructions<textarea id="aixSkT" rows="6" placeholder="Follow these steps exactly…"></textarea></label><button type="button" class="aix-btn aix-gold" data-act="skill-paste">Add skill</button></details>
      <details class="aix-det"><summary>File format</summary><pre class="aix-pre">Markdown (.md / .txt):\n---\nname: Career reader\ndescription: 10th house focus\nvariables: house.10, dasha.current, planet.Saturn\n---\nYour instructions here, written exactly as you want them followed.\n\nJSON (.json):\n{"name":"Career reader","instructions":"…","variables":["house.10","dasha.current"]}</pre></details>`;
  }

  /* ---------- Settings ---------- */
  function settings() {
    const s = D(), p = AIS.provider(), c = s.settings, f = (k, l, t, ph) => `<label>${l}<input data-pf="${k}" type="${t || 'text'}" value="${esc(p[k] || '')}" ${ph ? `placeholder="${esc(ph)}"` : ''} autocomplete="off" autocapitalize="off" spellcheck="false"></label>`;
    return `${S.msg ? `<div class="aix-note">${esc(S.msg)}</div>` : ''}<h4 class="aix-gh">Provider</h4>
      <div class="aix-row"><label class="aix-grow">Saved provider<select data-f="activeProvider">${s.providers.map(x => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label><button type="button" class="aix-btn" data-act="add-prov">＋ New</button>${s.providers.length > 1 ? '<button type="button" class="aix-btn aix-danger" data-act="del-prov">Delete</button>' : ''}</div>
      <label>Start from a preset<select data-f="preset"><option value="">Choose to fill the fields…</option>${AIS.PRESETS.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>
      ${f('name', 'Name')}<label>Type<select data-pf="kind">${[['openai', 'OpenAI-compatible (most servers)'], ['anthropic', 'Anthropic Messages'], ['gemini', 'Google Gemini']].map(x => `<option value="${x[0]}" ${p.kind === x[0] ? 'selected' : ''}>${x[1]}</option>`).join('')}</select></label>
      ${f('baseUrl', 'Base URL', 'url', 'https://api.example.com/v1')}${f('path', 'Path override (optional)', 'text', '/chat/completions')}
      <label>API key <small>stored only on this device</small><span class="aix-key"><input data-pf="apiKey" type="${S.show ? 'text' : 'password'}" value="${esc(p.apiKey || '')}" autocomplete="off" autocapitalize="off" spellcheck="false"><button type="button" class="aix-btn" data-act="show-key">${S.show ? 'Hide' : 'Show'}</button></span></label>
      ${f('model', 'Model name', 'text', 'e.g. gpt-4o-mini, claude-…, gemini-2.0-flash, llama3.1')}
      <label>Auth style<select data-pf="auth">${[['bearer', 'Authorization: Bearer key'], ['x-api-key', 'x-api-key header'], ['query', '?key= in the URL'], ['none', 'No key (local server)']].map(x => `<option value="${x[0]}" ${p.auth === x[0] ? 'selected' : ''}>${x[1]}</option>`).join('')}</select></label>
      <label>Extra headers (JSON, optional)<textarea data-pf="headers" rows="2" placeholder='{"HTTP-Referer":"https://…"}'>${esc(p.headers || '')}</textarea></label>
      <label>Extra body fields (JSON, optional)<textarea data-pf="extraBody" rows="2" placeholder='{"top_p":0.9}'>${esc(p.extraBody || '')}</textarea></label>
      <div class="aix-row"><button type="button" class="aix-btn aix-gold" data-act="test" ${S.test === 'busy' ? 'disabled' : ''}>${S.test === 'busy' ? 'Testing…' : 'Test connection'}</button></div>${S.test && S.test !== 'busy' ? `<div class="aix-note ${S.test.ok ? 'aix-good' : 'aix-bad'}">${S.test.ok ? '✓ Connected in ' + S.test.ms + ' ms. Reply: ' + esc(S.test.reply) : esc(S.test.err)}</div>` : ''}
      <h4 class="aix-gh">How it answers</h4>
      <label class="aix-tg"><input type="checkbox" data-sf="router" ${c.router ? 'checked' : ''}><span>Smart data routing <small>the AI picks only the variables it needs (recommended). Turn off for very small models: pinned variables are used instead.</small></span></label>
      ${[['maxVars', 'Max variables per question', 1, 12, 1], ['varChars', 'Max characters per variable', 1000, 20000, 500], ['temperature', 'Creativity (temperature)', 0, 1.5, 0.1], ['maxTokens', 'Max answer length (tokens)', 200, 8000, 100], ['history', 'Earlier turns remembered', 0, 20, 1]].map(r => `<label>${r[1]}: <b id="aixv-${r[0]}">${c[r[0]]}</b><input type="range" data-sf="${r[0]}" min="${r[2]}" max="${r[3]}" step="${r[4]}" value="${c[r[0]]}"></label>`).join('')}
      <p class="aix-lead">Always included: ${(c.pinned || []).map(x => `<span class="aix-ref">${esc(x)}</span>`).join('') || 'nothing'} (change with ★ in Variables).</p>
      <h4 class="aix-gh">Backup and privacy</h4>
      <div class="aix-row"><button type="button" class="aix-btn" data-act="exp">Export settings</button><button type="button" class="aix-btn" data-act="exp-keys">Export with keys</button><label class="aix-btn aix-filebtn">Import<input type="file" id="aixImp" accept=".json,application/json" hidden></label></div>
      <p class="aix-lead">Exports leave API keys out unless you choose "with keys". Chat history is never exported. Questions and the variables they need go only to the provider above.</p>
      <div class="aix-row"><button type="button" class="aix-btn aix-danger" data-act="reset">Erase all AI settings and keys</button></div>`;
  }

  function pane() { return S.tab === 'vars' ? vars() : S.tab === 'persona' ? persona() : S.tab === 'skills' ? skills() : S.tab === 'set' ? settings() : chat(); }
  function render() { const r = $('aixRoot'); if (!r) return; const kp = document.activeElement && document.activeElement.id, ss = r.querySelector('.aix-main'), y = ss ? ss.scrollTop : 0; r.innerHTML = head() + '<div class="aix-main">' + pane() + '</div>'; const m = r.querySelector('.aix-main'); if (m && S.tab !== 'chat') m.scrollTop = y; if (kp === 'aixIn') { const t = $('aixIn'); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } } }
  function html(chart, profile) { AIX.setContext(chart, profile); return '<div class="aix" id="aixRoot">' + head() + '<div class="aix-main">' + pane() + '</div></div>'; }

  /* ---------- events ---------- */
  const inP = e => e.target && e.target.closest && e.target.closest('#panel-ai');
  const dl = (name, text) => { const b = new Blob([text], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  document.addEventListener('click', e => {
    if (!inP(e)) return; const t = e.target.closest('[data-tab],[data-act]'); if (!t) return; const s = D(), id = t.getAttribute('data-id');
    if (t.hasAttribute('data-tab')) { S.tab = t.getAttribute('data-tab'); S.msg = ''; return render(); }
    const a = t.getAttribute('data-act');
    if (a === 'send') return send(($('aixIn') || {}).value);
    if (a === 'ex') return send(t.getAttribute('data-q'));
    if (a === 'ok-notice') { s.settings.noticeOk = true; AIS.save(); return render(); }
    if (a === 'clear') { s.chat = []; AIS.save(); return render(); }
    if (a === 'copy') { const m = (s.chat || [])[+t.getAttribute('data-i')]; if (m && navigator.clipboard) navigator.clipboard.writeText(m.text).then(() => { t.textContent = 'Copied'; setTimeout(() => { t.textContent = 'Copy'; }, 1200); }); return; }
    if (a === 'skill-use') { const i = s.activeSkills.indexOf(id); if (i >= 0) s.activeSkills.splice(i, 1); else s.activeSkills.push(id); AIS.save(); return render(); }
    if (a === 'skill-view') { S.sk = S.sk === id ? null : id; return render(); }
    if (a === 'skill-del') { s.skills = s.skills.filter(k => k.id !== id); s.activeSkills = s.activeSkills.filter(x => x !== id); AIS.save(); return render(); }
    if (a === 'skill-exp') { const k = s.skills.find(x => x.id === id); if (k) dl((k.name || 'skill').replace(/[^\w-]+/g, '_') + '.json', JSON.stringify({ name: k.name, description: k.description, instructions: k.instructions, variables: k.variables }, null, 2)); return; }
    if (a === 'skill-paste') { const n = ($('aixSkN') || {}).value || 'Pasted skill', r = AIS.parseSkill(($('aixSkT') || {}).value, n); if (r.error) { S.msg = r.error; return render(); } r.skill.name = n; s.skills.push(r.skill); s.activeSkills.push(r.skill.id); S.msg = 'Added “' + n + '” and switched it on.'; AIS.save(); return render(); }
    if (a === 'pin') { const p = s.settings.pinned, i = p.indexOf(id); if (i >= 0) p.splice(i, 1); else p.push(id); AIS.save(); return render(); }
    if (a === 'prev') { S.prev = S.prev === id ? null : id; return render(); }
    if (a === 'prev-raw') { const v = ($('aixRaw') || {}).value || ''; S.rawQ = v; S.prev = /^raw:/i.test(v) ? v : 'raw:' + v; return render(); }
    if (a === 'use-persona') { s.activePersona = id; AIS.save(); return render(); }
    if (a === 'dup-persona') { const b = AIS.persona(id); S.edit = { kind: 'persona', v: { id: AIS.uid('p'), name: b.name + ' (mine)', icon: b.icon, system: b.system, language: '', isNew: true } }; return render(); }
    if (a === 'new-persona') { S.edit = { kind: 'persona', v: { id: AIS.uid('p'), name: '', icon: '🔮', system: '', language: '', isNew: true } }; return render(); }
    if (a === 'edit-persona') { const p = s.personas.find(x => x.id === id); S.edit = { kind: 'persona', v: Object.assign({}, p) }; return render(); }
    if (a === 'del-persona') { s.personas = s.personas.filter(x => x.id !== id); if (s.activePersona === id) s.activePersona = 'classic'; AIS.save(); return render(); }
    if (a === 'cancel-edit') { S.edit = null; return render(); }
    if (a === 'save-persona') { const v = S.edit && S.edit.v; if (!v || !v.name.trim() || !v.system.trim()) { S.msg = 'A persona needs a name and instructions.'; return render(); } const o = { id: v.id, name: v.name.trim(), icon: v.icon || '✦', system: v.system.trim(), language: (v.language || '').trim() }, i = s.personas.findIndex(x => x.id === v.id); if (i >= 0) s.personas[i] = o; else s.personas.push(o); s.activePersona = o.id; S.edit = null; S.msg = ''; AIS.save(); return render(); }
    if (a === 'show-key') { S.show = !S.show; return render(); }
    if (a === 'add-prov') { const p = { id: AIS.uid('p'), name: 'Provider ' + (s.providers.length + 1), preset: 'custom', kind: 'openai', baseUrl: '', path: '', apiKey: '', model: '', auth: 'bearer', headers: '', extraBody: '' }; s.providers.push(p); s.activeProvider = p.id; S.test = null; AIS.save(); return render(); }
    if (a === 'del-prov') { s.providers = s.providers.filter(x => x.id !== s.activeProvider); s.activeProvider = s.providers[0].id; S.test = null; AIS.save(); return render(); }
    if (a === 'test') { S.test = 'busy'; render(); AIE.test(AIS.provider()).then(r => { S.test = r; render(); }).catch(er => { S.test = { ok: false, err: String(er.message || er) }; render(); }); return; }
    if (a === 'exp') return dl('vedic-ai-settings.json', AIS.exportJSON(false));
    if (a === 'exp-keys') { if (window.confirm('This file will contain your API keys. Keep it private. Export anyway?')) dl('vedic-ai-settings-with-keys.json', AIS.exportJSON(true)); return; }
    if (a === 'reset') { if (window.confirm('Erase all AI providers, keys, personas, skills and chat on this device?')) { AIS.reset(); S.test = null; S.msg = 'All AI settings were erased.'; render(); } return; }
  });
  document.addEventListener('change', e => {
    if (!inP(e)) return; const t = e.target, s = D();
    if (t.id === 'aixFile') { const files = [...t.files]; let n = 0, bad = []; Promise.all(files.map(f => f.text().then(x => { const r = AIS.parseSkill(x, f.name); if (r.error) bad.push(f.name + ': ' + r.error); else { s.skills.push(r.skill); s.activeSkills.push(r.skill.id); n++; } }))).then(() => { S.msg = (n ? 'Added ' + n + ' skill' + (n > 1 ? 's' : '') + ' and switched on. ' : '') + bad.join(' '); AIS.save(); render(); }); return; }
    if (t.id === 'aixImp') { const f = t.files[0]; if (f) f.text().then(x => { const r = AIS.importJSON(x); S.msg = r.error || 'Settings imported.'; render(); }); return; }
    if (t.hasAttribute('data-pv')) { S.pv[t.getAttribute('data-pv')] = t.value; S.prev = null; return render(); }
    if (t.hasAttribute('data-pf')) { const p = AIS.provider(), k = t.getAttribute('data-pf'); p[k] = t.value.trim(); if (k === 'kind') { p.preset = 'custom'; } AIS.save(); S.test = null; if (k === 'kind' || k === 'auth') render(); return; }
    if (t.hasAttribute('data-sf')) { const k = t.getAttribute('data-sf'); s.settings[k] = t.type === 'checkbox' ? t.checked : +t.value; AIS.save(); const b = $('aixv-' + k); if (b) b.textContent = s.settings[k]; return; }
    if (t.hasAttribute('data-f')) { const k = t.getAttribute('data-f'); if (k === 'preset') { const pr = AIS.PRESETS.find(x => x.id === t.value); if (pr) { const p = AIS.provider(); Object.assign(p, { kind: pr.kind, baseUrl: pr.baseUrl, model: pr.model || p.model, auth: pr.auth, preset: pr.id, path: '' }); if (!p.name || /^(My provider|Provider \d+)$/.test(p.name)) p.name = pr.name; AIS.save(); S.test = null; render(); } return; } s[k] = t.value; AIS.save(); S.test = null; return render(); }
  });
  document.addEventListener('input', e => {
    if (!inP(e)) return; const t = e.target;
    if (t.id === 'aixIn') { S.q = t.value; t.style.height = 'auto'; t.style.height = Math.min(140, t.scrollHeight) + 'px'; return; }
    if (t.id === 'aixVq') { S.vq = t.value; const pos = t.selectionStart; render(); const n = $('aixVq'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } return; }
    if (t.hasAttribute('data-pe') && S.edit) { S.edit.v[t.getAttribute('data-pe')] = t.value; return; }
    if (t.type === 'range' && t.hasAttribute('data-sf')) { const b = $('aixv-' + t.getAttribute('data-sf')); if (b) b.textContent = t.value; }
  });
  document.addEventListener('keydown', e => { if (e.target && e.target.id === 'aixIn' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(e.target.value); } });
  window.buildAiPanel = function (chart, profile) { return html(chart, profile); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-ai', window.buildAiPanel);
  const api = { html, render, S, send };
  window.AIUI = api; return api;
})();

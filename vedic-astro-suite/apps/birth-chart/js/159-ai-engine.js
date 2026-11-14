/* AI store + engine (js/159, globals AIS, AIE). Everything is stored in this device's localStorage ('vas_ai_v1'): providers (with their API keys), personas, skills, settings, chat.
   Flow for one question (AIE.ask): ROUTE (small call: question + AIX.catalogue() -> JSON {need:[ids]}) -> FETCH (AIX.get for just those ids, plus pinned and skill variables, trimmed to a budget)
   -> ANSWER (persona + uploaded skills followed exactly + the fetched DATA + a "do not invent" rule). Routing is plain JSON so it works on any model; turn it off for tiny local models.
   Providers: kind 'openai' (any OpenAI-compatible server: OpenAI, OpenRouter, Groq, Ollama, LM Studio, vLLM ...), 'anthropic' (Messages API), 'gemini' (generateContent). Base URL, path,
   auth style, extra headers and extra body are all editable. Calls go straight from the app to the URL the owner entered; nothing passes through any server of ours. */
const AIS = (() => {
  'use strict';
  const KEY = 'vas_ai_v1';
  const PRESETS = [
    { id: 'openai', name: 'OpenAI', kind: 'openai', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', auth: 'bearer' },
    { id: 'openrouter', name: 'OpenRouter', kind: 'openai', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini', auth: 'bearer' },
    { id: 'groq', name: 'Groq', kind: 'openai', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', auth: 'bearer' },
    { id: 'anthropic', name: 'Anthropic (Claude)', kind: 'anthropic', baseUrl: 'https://api.anthropic.com', model: '', auth: 'x-api-key' },
    { id: 'gemini', name: 'Google Gemini', kind: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.0-flash', auth: 'query' },
    { id: 'ollama', name: 'Ollama (local)', kind: 'openai', baseUrl: 'http://localhost:11434/v1', model: 'llama3.1', auth: 'none' },
    { id: 'lmstudio', name: 'LM Studio (local)', kind: 'openai', baseUrl: 'http://localhost:1234/v1', model: 'local-model', auth: 'none' },
    { id: 'custom', name: 'Custom', kind: 'openai', baseUrl: '', model: '', auth: 'bearer' }
  ];
  const BUILTIN_PERSONAS = [
    { id: 'classic', builtin: true, name: 'Classical Jyotishi', icon: '🪔', system: 'You are a thoughtful Vedic astrologer in the Parashari tradition. Explain chart facts in plain, kind language. Give tendencies, not certainties, and never frighten the person. Mention the relevant house, sign, nakshatra or dasha behind each point.' },
    { id: 'friend', builtin: true, name: 'Friendly guide', icon: '🌿', system: 'You are a warm, encouraging guide who explains Vedic astrology in everyday words, with short sentences and simple examples. Avoid jargon unless you explain it in half a sentence.' },
    { id: 'analyst', builtin: true, name: 'Strict analyst', icon: '📐', system: 'You are a precise analyst. Be concise and structured: findings first, then the chart facts that support each finding, in short bullet points. No filler, no reassurance, no predictions beyond what the data supports.' }
  ];
  const DEF = () => ({ v: 1, activeProvider: 'p1', providers: [{ id: 'p1', name: 'My provider', preset: 'custom', kind: 'openai', baseUrl: '', path: '', apiKey: '', model: '', auth: 'bearer', headers: '', extraBody: '' }], personas: [], activePersona: 'classic', skills: [], activeSkills: [],
    settings: { router: true, maxVars: 6, varChars: 5000, temperature: 0.4, maxTokens: 1200, history: 6, pinned: ['chart.summary'], noticeOk: false }, chat: [] });
  let st = null;
  const merge = (a, b) => { const o = Object.assign({}, a); Object.keys(b || {}).forEach(k => { o[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') ? merge(a[k], b[k]) : b[k]; }); return o; };
  function load() { if (st) return st; let r = null; try { r = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { r = null; } st = merge(DEF(), r || {}); if (!st.providers.length) st.providers = DEF().providers; return st; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(load())); return true; } catch (e) { return false; } }
  const uid = p => p + Math.random().toString(36).slice(2, 8);
  const personas = () => BUILTIN_PERSONAS.concat(load().personas);
  const persona = id => personas().find(p => p.id === (id || load().activePersona)) || BUILTIN_PERSONAS[0];
  const provider = id => load().providers.find(p => p.id === (id || load().activeProvider)) || load().providers[0];
  const skills = () => load().skills;

  function parseSkill(text, filename) {
    text = String(text || '').replace(/^﻿/, '');
    const base = String(filename || 'Skill').replace(/\.[a-z0-9]+$/i, '');
    let o = null;
    if (/^\s*[{\[]/.test(text)) { try { const j = JSON.parse(text); const s = Array.isArray(j) ? j[0] : j; if (s && (s.instructions || s.prompt || s.system)) o = { name: s.name || base, description: s.description || '', instructions: String(s.instructions || s.prompt || s.system), variables: [].concat(s.variables || s.vars || []).map(String) }; } catch (e) { return { error: 'This file looks like JSON but could not be read: ' + e.message }; } }
    if (!o) { let body = text, meta = {}; const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/); if (m) { m[1].split('\n').forEach(l => { const i = l.indexOf(':'); if (i > 0) meta[l.slice(0, i).trim().toLowerCase()] = l.slice(i + 1).trim(); }); body = m[2]; }
      o = { name: meta.name || base, description: meta.description || '', instructions: body.trim(), variables: (meta.variables || meta.vars || '').split(/[,\s]+/).filter(Boolean) }; }
    if (!o.instructions) return { error: 'The file has no instructions in it.' };
    if (o.instructions.length > 30000) return { error: 'Instructions are longer than 30,000 characters.' };
    o.variables = o.variables.filter(v => !AIX.resolve || AIX.resolve(v));
    return { skill: Object.assign({ id: uid('s'), on: true }, o) };
  }
  function exportJSON(withKeys) { const s = JSON.parse(JSON.stringify(load())); if (!withKeys) s.providers.forEach(p => { p.apiKey = ''; }); s.chat = []; return JSON.stringify(s, null, 2); }
  function importJSON(text) { let j; try { j = JSON.parse(text); } catch (e) { return { error: 'Not valid JSON.' }; } if (!j || typeof j !== 'object' || !Array.isArray(j.providers)) return { error: 'This is not an exported AI settings file.' };
    const cur = load(), keep = {}; cur.providers.forEach(p => { keep[p.id] = p.apiKey; }); j.providers.forEach(p => { if (!p.apiKey && keep[p.id]) p.apiKey = keep[p.id]; });
    st = merge(DEF(), j); st.chat = cur.chat; save(); return { ok: true }; }
  const api = { PRESETS, BUILTIN_PERSONAS, load, save, uid, personas, persona, provider, skills, parseSkill, exportJSON, importJSON, reset() { st = DEF(); save(); return st; } };
  window.AIS = api; return api;
})();

const AIE = (() => {
  'use strict';
  const tj = (s) => { if (!s || !String(s).trim()) return {}; try { const j = JSON.parse(s); return (j && typeof j === 'object') ? j : {}; } catch (e) { throw new Error('Extra headers / body must be valid JSON: ' + e.message); } };
  const trimSlash = s => String(s || '').replace(/\/+$/, '');

  async function callProvider(p, o) {
    if (!p.baseUrl && p.kind !== 'anthropic') throw new Error('Add the provider\'s base URL first (Settings tab).');
    if (!p.model && p.kind !== 'gemini') throw new Error('Add a model name first (Settings tab).');
    const temp = o.temperature != null ? o.temperature : 0.4, max = o.maxTokens || 1200, extraH = tj(p.headers), extraB = tj(p.extraBody);
    let url, headers = { 'Content-Type': 'application/json' }, body;
    if (p.kind === 'anthropic') {
      url = trimSlash(p.baseUrl || 'https://api.anthropic.com') + (p.path || '/v1/messages');
      headers['anthropic-version'] = '2023-06-01'; headers['anthropic-dangerous-direct-browser-access'] = 'true'; if (p.apiKey) headers['x-api-key'] = p.apiKey;
      body = { model: p.model, max_tokens: max, temperature: temp, system: o.system, messages: o.messages };
    } else if (p.kind === 'gemini') {
      const model = p.model || 'gemini-2.0-flash';
      url = trimSlash(p.baseUrl || 'https://generativelanguage.googleapis.com/v1beta') + (p.path || '/models/' + model + ':generateContent'); if (p.apiKey) url += (url.includes('?') ? '&' : '?') + 'key=' + encodeURIComponent(p.apiKey);
      body = { systemInstruction: { parts: [{ text: o.system }] }, contents: o.messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })), generationConfig: { temperature: temp, maxOutputTokens: max } };
    } else {
      url = trimSlash(p.baseUrl) + (p.path || '/chat/completions');
      if (p.auth === 'bearer' && p.apiKey) headers.Authorization = 'Bearer ' + p.apiKey; else if (p.auth === 'x-api-key' && p.apiKey) headers['x-api-key'] = p.apiKey; else if (p.auth === 'query' && p.apiKey) url += (url.includes('?') ? '&' : '?') + 'key=' + encodeURIComponent(p.apiKey);
      body = { model: p.model, messages: [{ role: 'system', content: o.system }].concat(o.messages), temperature: temp, max_tokens: max };
    }
    Object.assign(headers, extraH); Object.assign(body, extraB);
    const ac = new AbortController(), to = setTimeout(() => ac.abort(), o.timeout || 90000);
    let res; try { res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: ac.signal }); }
    catch (e) { clearTimeout(to); throw new Error(e.name === 'AbortError' ? 'The provider took too long to answer (90 s).' : 'Could not reach ' + url.replace(/\?.*$/, '') + '. Check the address, your connection and that the server allows browser (CORS) requests. (' + (e.message || e) + ')'); }
    clearTimeout(to);
    const raw = await res.text(); let j = null; try { j = JSON.parse(raw); } catch (e) { j = null; }
    if (!res.ok) { const m = j && (j.error && (j.error.message || j.error) || j.message) || raw.slice(0, 300); throw new Error('Provider said ' + res.status + ': ' + (typeof m === 'string' ? m : JSON.stringify(m))); }
    let text = '';
    if (p.kind === 'anthropic') text = ((j && j.content) || []).filter(b => b.type === 'text').map(b => b.text).join('');
    else if (p.kind === 'gemini') text = (((j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(x => x.text || '')).join('');
    else { const c = j && j.choices && j.choices[0]; text = c && ((c.message && (typeof c.message.content === 'string' ? c.message.content : (c.message.content || []).map(x => x.text || '').join(''))) || c.text) || ''; }
    if (!text) throw new Error('The provider answered, but with no text. ' + (raw.slice(0, 200)));
    return text.trim();
  }
  async function test(p) { const t0 = Date.now(), r = await callProvider(p, { system: 'Reply with the single word OK.', messages: [{ role: 'user', content: 'ping' }], maxTokens: 20, temperature: 0, timeout: 30000 }); return { ok: true, reply: r.slice(0, 60), ms: Date.now() - t0 }; }

  const ROUTER_SYS = 'You are the data router of a Vedic astrology assistant. You will see the user\'s question and an INDEX of data variables that the app can supply. Choose the SMALLEST set of variable ids needed to answer well (at most {N}). Prefer specific ids (house.7, planet.Mars, varga.D9) over broad ones. Follow the [links] when the question needs related data. Parameter ids are written like varga.D9, house.7, planet.Mars, raw:planets.Moon.nakshatra. Reply with ONLY a JSON object: {"need":["id","id"],"note":"one short sentence"}. If no chart data is needed, reply {"need":[],"note":"general question"}.';
  function parseRouter(text) { let ids = [], note = ''; const m = String(text).match(/\{[\s\S]*\}/); if (m) { try { const j = JSON.parse(m[0]); ids = [].concat(j.need || j.ids || []).map(String); note = String(j.note || ''); } catch (e) { ids = []; } }
    if (!ids.length) { const re = /\b(?:raw:[\w.]+|[a-z]+(?:\.[A-Za-z0-9]+)+|profile|ascendant|yogas|karakas|shadbala|outer|wars)\b/g; (String(text).match(re) || []).forEach(x => ids.push(x)); }
    return { ids, note }; }
  function activeSkills() { const s = AIS.load(); return s.skills.filter(k => k.on && s.activeSkills.includes(k.id)); }

  async function ask(question, opt) {
    opt = opt || {}; const S = AIS.load(), cfg = S.settings, prov = AIS.provider(), per = AIS.persona(), sk = activeSkills(), stage = opt.onStage || (() => {});
    if (!prov) throw new Error('Set up a provider first (Settings tab).');
    const hist = (S.chat || []).slice(-cfg.history * 2).map(m => ({ role: m.role, content: m.text })), chartOk = !!(AIX.ctx.chart || window.__vgC);
    let ids = [], note = '', routed = false;
    const forced = []; (cfg.pinned || []).forEach(i => forced.push(i)); sk.forEach(k => (k.variables || []).forEach(i => forced.push(i)));
    if (chartOk && cfg.router) {
      stage('routing');
      try { const r = await callProvider(prov, { system: ROUTER_SYS.replace('{N}', cfg.maxVars), messages: [{ role: 'user', content: 'INDEX:\n' + AIX.catalogue() + (sk.length ? '\n\nACTIVE SKILL NAMES: ' + sk.map(k => k.name).join(', ') : '') + '\n\nQUESTION: ' + question }], temperature: 0, maxTokens: 300 });
        const pr = parseRouter(r); ids = pr.ids; note = pr.note; routed = true; } catch (e) { if (/CORS|reach|401|403|429/.test(String(e.message))) throw e; ids = []; }
    }
    if (chartOk && !routed) ids = ids.concat([]);
    const seen = {}, want = []; ids.slice(0, cfg.maxVars).concat(forced).forEach(i => { const r = AIX.resolve(i); if (!r) return; const k = r.kind === 'raw' ? 'raw:' + r.path : r.e.id + '.' + (r.arg || ''); if (!seen[k]) { seen[k] = 1; want.push(i); } });
    stage('fetching'); const used = [], blocks = [];
    if (chartOk) want.forEach(i => { const g = AIX.get(i, cfg.varChars); used.push({ id: i, ok: g.ok, tokens: g.tokens || 0, cut: g.cut }); blocks.push('[' + i + ']\n' + g.text); });
    const sys = [per.system + (per.language ? '\nAlways answer in ' + per.language + '.' : ''),
      sk.length ? 'ACTIVE SKILLS. Follow these instructions exactly, in order, as written. They override your default style and format:\n' + sk.map(k => '### Skill: ' + k.name + '\n' + k.instructions).join('\n\n') : '',
      'RULES: Use ONLY the DATA below for facts about this person\'s chart: never invent planetary positions, dates, yogas or periods. If you need something that is not in DATA, say exactly which variable id from the index would give it instead of guessing. Mention the id in square brackets, e.g. [planet.Mars], when you rely on it. Give tendencies, not certainties, and no medical, legal or financial instructions.',
      chartOk ? 'DATA (fetched from the app for this question):\n' + (blocks.join('\n\n') || '(nothing fetched)') : 'No birth chart is loaded, so answer generally and say that a chart is needed for personal readings.'].filter(Boolean).join('\n\n');
    stage('answering');
    const answer = await callProvider(prov, { system: sys, messages: hist.concat([{ role: 'user', content: question }]), temperature: cfg.temperature, maxTokens: cfg.maxTokens });
    return { answer, used, note, routed, persona: per.name, skills: sk.map(k => k.name), model: prov.model, sysTokens: Math.ceil(sys.length / 4) };
  }
  const api = { ask, test, callProvider, parseRouter, activeSkills };
  window.AIE = api; return api;
})();

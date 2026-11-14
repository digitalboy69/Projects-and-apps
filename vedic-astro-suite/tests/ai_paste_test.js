// Paste-to-fill parser (AIS.parseRequest in js/159): cURL, JS fetch/axios/SDK, Python requests/SDK, placeholders.  Run: node tests/ai_paste_test.js
const fs = require('fs'); global.window = global; global.localStorage = { getItem: () => null, setItem() {} }; global.AIX = { resolve: () => true };
new Function(fs.readFileSync(__dirname + '/../apps/birth-chart/js/159-ai-engine.js', 'utf8').replace(/const AIE = [\s\S]*$/, '') + '; global.AIS = AIS;')();
let bad = 0; const eq = (n, a, b) => { const ok = JSON.stringify(a) === JSON.stringify(b); if (!ok) bad++; console.log((ok ? 'ok   ' : 'FAIL ') + n + (ok ? '' : '\n   got  ' + JSON.stringify(a) + '\n   want ' + JSON.stringify(b))); };
const P = t => AIS.parseRequest(t).p || AIS.parseRequest(t);
let r = P(`curl https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-abc123XYZ" \\
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"hi"}],"temperature":0.7,"top_p":0.9}'`);
eq('openai curl', [r.kind, r.baseUrl, r.path, r.model, r.auth, r.apiKey, r.extraBody], ['openai', 'https://api.openai.com/v1', '', 'gpt-4o-mini', 'bearer', 'sk-abc123XYZ', { top_p: 0.9 }]);
r = P(`curl https://api.anthropic.com/v1/messages -H "x-api-key: sk-ant-1" -H "anthropic-version: 2023-06-01" -H "content-type: application/json" -d '{"model":"claude-x","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'`);
eq('anthropic curl', [r.kind, r.baseUrl, r.path, r.model, r.auth, r.apiKey, r.headers], ['anthropic', 'https://api.anthropic.com', '', 'claude-x', 'x-api-key', 'sk-ant-1', {}]);
r = P(`curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyTEST" -H 'Content-Type: application/json' -X POST -d '{"contents":[{"parts":[{"text":"Explain"}]}]}'`);
eq('gemini curl with ?key=', [r.kind, r.baseUrl, r.path, r.model, r.auth, r.apiKey], ['gemini', 'https://generativelanguage.googleapis.com/v1beta', '', 'gemini-2.0-flash', 'query', 'AIzaSyTEST']);
r = P(`fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: { "Authorization": "Bearer sk-or-v1-zzz", "HTTP-Referer": "https://mysite.com", "Content-Type": "application/json" },
  body: JSON.stringify({ model: "openai/gpt-4o", messages: [{ role: "user", content: "hi" }] })
});`);
eq('js fetch openrouter (extra header kept)', [r.baseUrl, r.model, r.apiKey, r.headers], ['https://openrouter.ai/api/v1', 'openai/gpt-4o', 'sk-or-v1-zzz', { 'http-referer': 'https://mysite.com' }]);
r = P(`import requests
r = requests.post("https://api.groq.com/openai/v1/chat/completions",
  headers={"Authorization": "Bearer gsk_123", "Content-Type": "application/json"},
  json={"model": "llama-3.3-70b-versatile", "messages": [{"role": "user", "content": "x"}], "stream": False, "top_p": 0.8})`);
eq('python requests groq', [r.baseUrl, r.model, r.apiKey, r.extraBody], ['https://api.groq.com/openai/v1', 'llama-3.3-70b-versatile', 'gsk_123', { top_p: 0.8 }]);
r = P(`const client = new OpenAI({ apiKey: "sk-sdk-777", baseURL: "https://api.deepseek.com/v1" });
const c = await client.chat.completions.create({ model: "deepseek-chat", messages: [] });`);
eq('node SDK with baseURL', [r.baseUrl, r.model, r.apiKey], ['https://api.deepseek.com/v1', 'deepseek-chat', 'sk-sdk-777']);
r = P(`curl http://localhost:11434/v1/chat/completions -d '{"model":"llama3.1","messages":[]}'`);
eq('ollama local, no key', [r.baseUrl, r.model, r.auth, r.apiKey, r.notes.length], ['http://localhost:11434/v1', 'llama3.1', 'none', '', 0]);
r = P(`curl https://api.openai.com/v1/chat/completions -H "Authorization: Bearer $OPENAI_API_KEY" -d '{"model":"gpt-4o"}'`);
eq('env placeholder is not used as a key', [r.apiKey, r.auth, r.notes.some(n => /placeholder/.test(n))], ['', 'bearer', true]);
r = P(`curl --url https://example.com/api/ai/chat/completions --header 'Authorization: Bearer tok' --data-raw '{"model":"m"}'`);
eq('custom host with long flags', [r.baseUrl, r.path, r.model, r.apiKey], ['https://example.com/api/ai', '', 'm', 'tok']);
r = P('curl ^\n https://api.openai.com/v1/chat/completions ^\n -H "Authorization: Bearer sk-win" ^\n -d "{\\"model\\":\\"gpt-4o\\"}"');
eq('windows cmd carets and escaped quotes', [r.apiKey, r.model], ['sk-win', 'gpt-4o']);
eq('garbage is refused politely', typeof AIS.parseRequest('hello there my friend').error, 'string');
console.log(bad ? 'FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);

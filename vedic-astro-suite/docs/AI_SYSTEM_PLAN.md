# AI system (custom model, API, skills, personas) — plan
Owner request 2026-11-14: "add a system inside the app, an architecture to get every single variable and integrate an AI system with custom model and API, custom skills and custom AI persona changing. Full root-level configuration."
Owner answers: (1) provider, API URL, key and every detail fully custom and stored locally in the app only; (2) ONE interlinked index file where every variable is listed and the AI reads/calls exactly what it needs instead of getting everything (no overload, no hallucination); (3) skills = the owner uploads instructions as a skill and the AI follows them exactly.

## Architecture (three layers, no server)
1. **Index (`js/158-ai-index.js`, global `AIX`)** — the ONE registry. Every variable of the app's data is an entry: `id`, group, title, one-line description, `links` to related ids, optional parameter list, and a `get()` that returns compact JSON. `AIX.catalogue()` gives the model a short list (id + description + links, about 700 tokens) — never the data. `AIX.get(id)` fetches one variable on demand. `raw:<path>` reaches ANY field of the chart object by dotted path, so literally every variable is reachable.
2. **Engine (`js/159-ai-engine.js`, global `AIE`; store `AIS`)** — providers (OpenAI-compatible, Anthropic, Gemini, any custom base URL, path, headers, extra body), key kept in this device's localStorage, personas, skills, settings. Flow per question: **Route** (small call: question + catalogue → JSON list of the variable ids needed, max N) → **Fetch** (the app resolves only those ids, trimmed to a token budget) → **Answer** (persona + skills followed exactly + only the fetched data + a rule to say "not in the data" instead of guessing). Works on any model because routing is plain JSON, not provider tool-calling. Router can be turned off (single call with default variables) for tiny local models.
3. **Panel (`js/160-ai-panel.js`, `css/86-ai.css`, `panel-ai`, prefix `aix-`)** — tabs Chat, Variables (browse the index, preview any value, pin "always include"), Personas, Skills (upload .md/.txt/.json), Settings (providers, test connection, limits, import/export, privacy). Chat shows which variables each answer used.

## Rules
- Keys never leave the device except in the request to the provider the owner configured; export excludes keys unless the owner ticks it.
- Birth data goes to the chosen provider: show a one-time notice, and a per-chat "Used variables" list.
- Tendency wording; the AI is told to answer only from fetched data and to name any variable it still needs.
- Research (2026-11-14): Anthropic Messages API (platform.claude.com/docs/en/api/messages: POST /v1/messages, content is an array of typed blocks), Gemini generateContent (ai.google.dev/api/generate-content: key as ?key=, systemInstruction, generationConfig, text in candidates[0].content.parts[].text), OpenAI Chat Completions (messages with system/user/assistant, choices[0].message.content). Headers/paths are editable in the UI because compatible servers differ.

## Checklist
- [x] S1 Plan + research
- [x] S2 Index `AIX` + node-free browser test of resolve/catalogue
- [x] S3 Engine `AIE`/`AIS` + test with a stubbed provider (route → fetch → answer)
- [x] S4 Panel + CSS + wiring (HOME_ITEMS, js/120, Tools hub, Feature Guide, STRUCTURE, AI_GUIDE) + phone screenshots
- [x] S5 Android: CapacitorHttp is already enabled in mobile/capacitor.config.json, so provider calls from the APK are not blocked by CORS

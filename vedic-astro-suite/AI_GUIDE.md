# AI_GUIDE.md — read this FIRST (written for AI assistants, not humans)

You are working on the **Vedic Astro Suite**: a folder project made of a shell + 4 apps (each app = its own folder with `index.html`, `css/`, `js/`). Single-file builds are generated into `dist/`. The owner is a student on free plans with tiny usage limits and several accounts. **Every token matters.** Follow this file exactly; it tells you where things are so you do not have to explore.

## 0. The 13 rules (token savers)
1. **Never read the built HTML files** (`dist/*.html`, 1.8–2.5 MB). They are build outputs. Never `cat` or `Read` them.
2. **Read only the range you need.** Source files are small topic files (20–750 lines). Find the symbol with `grep -P "^name\t" symbols.idx` (gives the real `file:line`), then `Read` with `offset` and `limit` (40–120 lines).
3. **Never read `symbols.idx` whole** (grep it) and never print the AUTO section map unless you need it.
4. Use **Grep/`grep -n`** inside one app folder (`apps/<app>/js`) to find strings; do not open many files "to look around".
5. Edit with the **Edit tool** (exact `old_string`) or a small Python `str.replace` with an `assert count==1`. Do not rewrite whole files, do not re-paste big blocks.
6. Test only what you changed (see section 5). Do not re-run every test after a one-line change; run the one that covers the feature plus the wrapper smoke test.
7. Reply short. The user wants the files, one clear summary, and what could not be tested. No long recaps, no re-listing every step.
8. Do **not** spawn sub-agents or web-search for things already in this file. Do not research astrology formulas again; they are already implemented (see Rules, section 4).
9. Prefer one build at the end (`python3 build.py`), not after every edit.
10. When the task is only data/text (e.g. a new description string), edit the string; do not touch engines.
11. If a request is ambiguous and cheap to redo, make the most reasonable choice and say which one; ask only for expensive or irreversible choices.
12. **Read `STRUCTURE.md` once (every file + feature + path). Whenever you add/rename/move/delete a file or add a feature, update `STRUCTURE.md` too** (checked by `tools/check_structure.py`).
13. **Before finishing, update this file** (section 7 changelog) and run `python3 build.py` — it regenerates `symbols.idx` and the AUTO block below by itself.

## 1. Architecture in 10 lines
- Source of truth = the **folder tree** (see `README.md`): `index.html` + `shell/` (loader, floating switcher, location picker) + `apps/{sky3d,birth-chart,notepad,developer}/` + `shared/export-addon.js` + `vendor/qrlibs.js` + `editions/customer/`.
- Each app is `apps/<name>/index.html` (markup) plus `css/NN-topic.css` and `js/NN-topic.js`, listed in the html as plain `<link>`/`<script src>` tags. **Load order = number order. Never renumber or reorder** (later files use earlier definitions; top-level `const`/`let`/functions are shared globals like before). New topic file → pick the next number or a free number in the right place and add the tag in `index.html`.
- **sky3d** = 3D Sky (Three.js r128 from CDN). **birth-chart** = Birth Chart / Vedic app. **notepad** = Notepad. **developer** = Developer card overlay.
- Hosted/dev mode: the shell opens each app as an iframe `src=apps/<name>/index.html` (needs a web server; on `file://` it redirects to the single-file build).
- `python3 build.py` (runs `tools/build.py`) inlines every css/js into `dist/vedic-astro-suite-readable.html` (main deliverable, plain code) and `dist/vedic-astro-suite-2.html` (base64 copy; apps sit in `<script type="text/plain" id="srcA|srcB|srcN|srcDev" data-enc=…>` and load via `srcdoc`). It also regenerates `symbols.idx` + the AUTO block below. `python3 build.py --guide` only regenerates the index (fast). `python3 tools/build_customer.py` → `dist/customer-edition.html`.
- Escaping (single-file build only): `</script` becomes `<\/script` and `<!--` becomes `<\!--` inside the text/plain blocks; the shell's `decode()` reverses it. **Never write a literal `</script` or `<!--` inside JS strings** — write `<\/script` / `<\!--`.
- Frames are same-origin (parent ↔ app calls like `parent.LocPicker`, `postMessage`). That is why the folder version must be served over http(s).
- Plain ES2020, no modules, no bundler. Top-level scripts run in order; do not call a function from another file at top level before that file has loaded.

## 2. Prompt router — "if the user says X, go to Y"
(Find the exact line with `grep -P "^symbol\t" symbols.idx`. File names below are `apps/<app>/js/<file>`; `shell/` and `shared/` are written in full.)

| User talks about | App / file | Symbols to start from |
|---|---|---|
| Birth form, place field, profiles, menu | `birth-chart/58-render-results.js`, `birth-chart/15-chart-core-compute.js` | `renderResults`, `computeChart`, form handler in "FORM SUBMIT -> COMPUTE -> RENDER" |
| Planet positions, houses, dignity, combustion | `birth-chart/15-chart-core-compute.js`, `birth-chart/07-planetary-dignity.js`, `birth-chart/08-combustion-and-war.js` | `computeChart`, `getDignity`, `getCombustion`, `siderealLongitudes` |
| D-charts (D1–D60), chart images (North/South/West) | `birth-chart/05-ascendant-nakshatra-vargas.js`, `birth-chart/61-varga-chart-svg.js`, `birth-chart/58-render-results.js` | `calcVarga`, `buildNorthIndianSvg`, `buildSouthIndianSvg`, `buildWesternWheelSvg`, `chBadge`, `chOuter`, `updateVargaDisplay` |
| Dasha, Vimshottari | `birth-chart/10-vimshottari-dasha-engine.js` | `calculateVimshottariDasha`, `findActiveDasha` |
| Ashtakavarga | `birth-chart/11-ashtakavarga-engine.js` | `computeFullAshtakavarga`, panel `panel-ashtakavarga` |
| Shadbala, Bhava Bala | `birth-chart/14-shadbala-engine.js`, `birth-chart/72-bhava-bala.js` | `computeShadbala`, `computeBhavaBala` |
| Fate Meter, Sahams (Tajika), Life Activation, Tithi Pravesh, Chart Reading | `birth-chart/75-fate-meter.js`, `birth-chart/74-sahams.js` | `computeFate`, `buildFatePanel`, `buildSahamPanel`, panels `panel-fate`, `panel-sahams`, `panel-tithi`, `panel-active`, `panel-reading` |
| Find birth DATE from memory clues (tithi, weekday, festival, eclipse, Saturn…) | `birth-chart/27-date-finder-core.js`, `birth-chart/29-date-finder-ui.js` | `dfGen` (engine, generator), `DF_FEST` (festival rules, Amanta months), `dfBuild` (UI), `dfOpenModal` (popup from the birth form), `dfUse` |
| Rectification / birth time tools / life events | `birth-chart/26-rectification-studio.js`, `birth-chart/30-life-event-checker.js`, `birth-chart/25-home-and-tabs.js`, `birth-chart/65-error-boundaries.js` | `initRectStudio` ("RECTIFICATION STUDIO" banner, tabs dial/scan/sandhi/vt/tt/life), `rsRunLife`, `rsEvalLagna`; old panel ids route via `RS_ROUTE` in `switchAppTab` hook |
| Panchang, transits, Sade Sati | `birth-chart/45-panchanga-engine.js`, `birth-chart/59-live-transit-form.js` | `panchangaAt`, `computeLiveSky`, "PHASE 1 ENGINES" banner |
| Special lagnas / Arudha | `birth-chart/17-special-lagnas.js` | `buildVargaFromLagna`, `computeAllSpecialLagnaSigns` |
| Home dashboard, tab bar, new panel/tool | `birth-chart/25-home-and-tabs.js`, `birth-chart/65-error-boundaries.js`, `birth-chart/58-render-results.js` | `HOME_ITEMS` (add a row), `switchAppTab`, panels are `html += \`<div class="app-panel" id="panel-X">\`` in `renderResults` |
| Planet popup (Birth Chart) | `birth-chart/19-planets-panel.js`, `sky3d/29-planet-detail-content.js` | `openPlanetDetail`, `openOuterDetail`, `buildPlanetsPanel` |
| Uranus/Neptune/Pluto | `birth-chart/05-ascendant-nakshatra-vargas.js`, `sky3d/02-planetary-dignity.js`, `birth-chart/06-outer-planet-knowledge.js`, `sky3d/30-outer-planet-knowledge.js` | `OUTER_LIST`, `OUTER_INFO`, `outerAspectsTo`, `planetGeocentricLongitude` (elements in `PLANET_ELEMENTS`), A: `openOuterPlanetDetail`, B: `openOuterDetail`, `chOuter`. They are **not** in `PLANET_LIST` on purpose (no Vedic aspects/yogas/dasha). |
| Export / Copy for AI / JSON | `birth-chart/43-full-report-text.js`, `shared/export-addon.js`, `birth-chart/44-export-modal.js` | `buildFullReportText`, `openExportModal`, add-on `window.VAX` |
| 3D planets, zodiac ring, labels, camera | `sky3d/08-scene-setup-and-camera.js`, `sky3d/10-procedural-textures.js`, `sky3d/11-planet-visuals.js`, `sky3d/15-planet-labels.js` | `initScene`, `buildZodiacRingGroup`, `updateSceneForJD`, `rebuildLabelNodes`, `renderLoop`, `setCamMode` |
| 3D "Solar System" view / scale / real distances | `sky3d/12-solar-system-view.js` | `SOL`, `solBuild`, `setSceneView`, `solMapPos`, `solRadius`, `solRenderTable`, tab `tab-solar` |
| 3D rising-sign timings (long-press chip popup + Rising tab) | `sky3d/18-rising-sign-timeline.js` | `riseTimeline`, `risingHTML`, `renderRising`, `openRising`, `setupRisingPress` |
| 3D sky table, planet picker | `sky3d/19-hud-render.js`, `sky3d/41-quick-planet-picker.js` | `buildSkyTableRows`, `renderSkyTable`, `initPlanetPicker` |
| 3D popups for planets | `birth-chart/19-planets-panel.js`, `sky3d/29-planet-detail-content.js`, `sky3d/31-outer-planet-popup.js` | `openPlanetDetail` (Vedic planets, `PD` table), `openOuterPlanetDetail` |
| Transits / meetings / returns / retro planner / degree finder (3D) | `sky3d/06-planet-detail-helpers.js` | sections "TRANSIT + CONJUNCTION SCANNING", "RETROGRADE", returns code; `findIngresses`, `stayEdges` |
| Ephemeris math (Sun, Moon, planets, ayanamsa) | `birth-chart/03-ephemeris-engine.js`, `sky3d/01-astro-engine.js` | `sunLongitude`, `moonLongitude`, `planetHeliocentric`, `planetGeocentricLongitude`, `lahiriAyanamsa`. The engines are duplicated in A and B — **change both** |
| Notepad / notes / templates / client cards | `notepad/01-notepad.js` (+ `apps/notepad/css/01-notepad.css`) | functions `newNote`, `welcome`, key `vedicNotepad_v1` |
| "Pick location", map, coordinates, Google link | `shell/js/locpicker.js` | `LocPicker.open`, `LocPicker.attach` (wired in each app next to place fields) |
| Floating switcher, loader, default screen, dev overlay | `index.html`, `shell/css/shell.css`, `shell/js/shell.js` (small, safe to read whole) | |
| Mobile layout / spacing / theme | the app's `css/` files (grep the class name inside `apps/<app>/css`) | |
| Add-on export UI | `shared/export-addon.js` — **do not edit unless asked**; both apps load this one file | |

Cross-app messages: Notepad → shell `postMessage('vedic-open-chart')`; the shell handles `vedic-dev-close`.

## 3. Token-saving playbook (concrete)
- Locate: `grep -P "^computeFate\t" symbols.idx` → `apps/birth-chart/js/75-fate-meter.js:14` → `Read file offset=14 limit=60`.
- Many symbols near each other? Read the banner range once, not each function.
- To add a UI block, copy the pattern of a neighbouring panel (grep its id) instead of reading the whole renderer.
- CSS: add rules in the app's existing `<style>` using existing variables (`var(--gold)`, `var(--teal-bright)`, `--cyan`, `--glass-border`…). Grep one similar class for style.
- Large data tables (texts, facts): put them in a small shared `const` block and reference it; put the same block in A and B only if both need it (see `OUTER_INFO`).
- Do not re-verify astrology formulas from the web. Validate numbers with the existing test pattern (compare to a known date) instead.
- When showing a diff to the user is unnecessary, don't. State what changed in 3–6 lines.
- If a Playwright run is needed, write ONE script that does several checks and prints one summary.

## 4. Rules & gotchas (learned the hard way)
- Sidereal Lahiri everywhere. Planet elements are JPL/Standish Keplerian (valid ~1800–2050); the code adds general precession `1.3969713*T` in `planetGeocentricLongitude` so planets share the tropical-of-date frame with Sun/Moon/Rahu before subtracting ayanamsa.
- `PLANET_LIST` = 9 Vedic grahas and is used by hundreds of places (aspects, yogas, dasha, shadbala, exports). Do **not** append planets to it. Extra bodies go in `OUTER_LIST`/`ALL_BODIES` (A) or `chart.outer` (B).
- Do not add sahams/yogas without a verifiable source (Kama saham is intentionally missing).
- Birth Chart chart objects: `chart.planets[name]`, `chart.outer[name]`, `chart.vargas[key].planetVargaSign / outerSign / houses`, `chart.ascendant`, `chart.shadbala`, `chart.ashtakavarga.sav`, `chart.dashaData`.
- 3D scene axes: ecliptic longitude θ → `x=r·cosθ, z=-r·sinθ`, y up. Zodiac planets are children of `zodiacRingGroup`; the Solar view uses `SOL.group`. Raycasts ignore `visible`, so click code filters by parent visibility.
- Labels are HTML nodes in `labelNodes`; they hide when `mesh.parent.visible===false`.
- `LocPicker` onPick gives a Nominatim-shaped object `{display_name,lat,lon,address:{country_code},source}`.
- Everything must work on a phone (≥360 px) — test at 390×800 when touching layout.
- Storage: Notepad uses localStorage key `vedicNotepad_v1` (wrap in try/catch). Never store secrets.
- Do not edit anything in `dist/`; it is generated.

## 5. Build, test, deliver (do exactly this)
1. Edit the topic file under `apps/<app>/css|js/` (or `shell/`, `shared/`). Never renumber files.
2. `python3 build.py` (≈2 s). It prints `built` and `guide: N symbols`.
3. Syntax check without a browser: `python3 tests/syntax_check.py` (`node --check` on every js file).
4. Smoke tests (Playwright, headless): `python3 tests/smoke.py` (shell loads, chart casts, export modal, 3D solar view if Three is available). Other tests: `rising_popup_test.py`, `rising_lines_test.py`, `camera_motion_test.py`, `datefinder_test.py`, `customer_smoke.py`. Every test runs against the single file by default; `VAX_TARGET=hosted` serves the folder over a local web server and tests the multi-file version (run both before pushing a structural change). Needs `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` and `executable_path='/opt/pw-browsers/chromium'`.
5. Three.js r128 is blocked on the CDN in the sandbox. Get it once: `git clone --depth 1 --filter=blob:none --sparse --branch r128 https://github.com/mrdoob/three.js tj && cd tj && git sparse-checkout set build` → `build/three.min.js`, then route `**/three.min.js` to it (see `tests/smoke.py`, env `THREE_JS=/path/three.min.js`). WebGL flags: `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`. Without it, 3D can only be syntax-tested — say so honestly.
6. Test a feature in the Birth Chart: fill `#profileName`, `#dobInput`, time input, pick a place (or set coordinates), click `#castBtn`, wait ~5 s, then `switchAppTab('panel-…')`. Chart objects are `currentChartForModal` / `currentProfileForExport`.
7. Deliver (the user prefers files, short reply): `SendUserFile` `dist/vedic-astro-suite-readable.html` (main file) and, if asked, a zip of the folder (without `dist/`). The pushed repo is the real deliverable: GitHub Pages serves the folder version.
8. Git: from the repo root `git add -A && git commit -m "<what>" && git push` (follow any attribution lines the environment gives). The hook below keeps this file fresh.

## 6. Keeping this file alive (automatic)
- `python3 build.py` rewrites the AUTO block + `symbols.idx` every time.
- A git hook does the same on every commit: run **once per clone** `sh install-hooks.sh` (sets `core.hooksPath=.githooks`). The pre-commit hook runs `python3 build.py --guide` and stages `AI_GUIDE.md` + `symbols.idx`, so they can never go stale.
- Hand-written parts (sections 0–5, 7) only change when behaviour or workflow changes. **After every task add one line to section 7** and, if you added a new feature, one row to the router table in section 2.

## 7. State & changelog (newest last; keep ≤ 25 lines, merge old ones)
- **Old names in the entries below** (written before the folder restructure): srcA = `apps/sky3d`, srcB = `apps/birth-chart`, srcN = `apps/notepad`, srcDev = `apps/developer`, wrapper = `index.html` + `shell/`, `parts/` no longer exists (use `symbols.idx` for the real file). Also: `tools_customer.py` → `tools/build_customer.py`, `wrapper_template.html` → `index.html`.
- Restructure: the single HTML file is now a folder project. Each app = `index.html` + topic-named `css/NN-*.css` and `js/NN-*.js` (cut at the old section banners, order kept, content byte-identical: verified by comparing all style/script text before/after). Shell split into `index.html` + `shell/`; `shared/export-addon.js` (one copy, was pasted into two apps), `vendor/qrlibs.js`, `editions/customer/`, `tools/` (assemble/build/build_customer/guide/encrypt). `python3 build.py` writes `dist/` (single-file builds, same names as before). Hosted folder version loads app frames by `src` (needs http; on file:// it redirects to dist). Dead `<script src="formula-scanner.js">` tag removed. Tests use `tests/_helpers.py` (`VAX_TARGET=hosted`).
- Done: 3D sky (degree finder, returns, retrograde planner), D-charts + images (North/South/Western wheel), aspects, special lagnas, Home dashboard, Ashtakavarga, Chart Reading, Life Activation, Bhava Bala, Tithi Pravesh, 36 Tajika sahams, Fate Meter (Ashtakavarga + transits), Notepad (Jyotish Notebook), LocPicker everywhere, Export/Copy add-on, Uranus/Neptune/Pluto (3D + charts + popups + Western aspects + report), 3D Solar System view (Easy fit / True scale, Solar tab).
- Rectification Studio (hero clock + confidence chips, 3-step rail, 6 tabs; sandhi/vt/tt panels are MOVED into panes keeping ids; Life-Event checker scores 12 lagnas by dasha lords + Jup/Sat transit, events saved in localStorage). Code in srcB part 04/05 (JS) and style block end.
- Welcome loader (index.html + `shell/css/shell.css`: .wel, .zring, `welHi`; greeting by time of day, min 2.4s on first start only, then `.compact`).
- Smart Search (replaces old Quick Search popover; button `#quickSearchBtn` now opens `srchOpen()`; Ctrl/Cmd+K or `/`): index built by `srchBuild()` = tools (HOME_ITEMS) + your chart facts + signs/nakshatras/planet meanings; Google/Google AI fallback; click-to-Google toggle kept in footer. Code: srcB "SMART SEARCH" banner.
- Ask-AI in Smart Search: `SRCH_TOPICS` = 38 areas, + moneyblocks, wealthboost, remedies, karma, karmarel (incl. love set: love, lovers, soulmate, chemistry, breakup, partnerfit, marriedlife) (first = 🪞 'This is me' verify/personality blend/aspects) × ~128 questions (`subs`: [label, instruction]); every non-'me' topic auto-gets a '🪞 10 precise checks' sub. `srchBrief(tp,sub,cap)` = instruction + universal `SRCH_STYLE` (anti-hallucination, anti-generic, blend, 'Because' tags, emoji format) + CHART DATA by priority (planet table, conjunctions, aspects always kept; extras dropped to fit cap 2700 for the URL; clipboard gets full). `srchAsk` opens Google AI (udm=50). BUG FIXED: `p.combustion` is an object — use `.combustion.combust`. Change tone/format of ALL answers by editing `SRCH_STYLE` only.
- Friendly intake page (NT-simple): `intake.css`/`intake.js` blocks in srcB. `inBuildFriendly()` hides the native date/time inputs and adds dropdowns `#inDay/#inMon/#inYear/#inHr/#inMin`, AM/PM `#inAp`, quick-time chips `#inChips` (Morning/Afternoon/Evening/Night/No idea). They write the HIDDEN `#dobInput`/`#tobInput` (so tests must set those via evaluate, not fill). `inSyncFriendly()` syncs controls from hidden inputs (called by `loadProfileIntoForm`); `inFoundUpdate()` shows the found-place box; `#inEx` fills an example (Mumbai); tz/coords live in a collapsed `<details class=in-adv>`.
- GATED DELIVERY (step 3): see docs/SUPABASE.md. Public gate repo = `gate/index.html` + `app.enc` (encrypted). Edge Function `get-app` decrypts for members only. Release = build.py -> tools_encrypt.py -> push to gate repo. Never commit the AES key or the plain built HTML to any public repo.
- Admin panel (step 2): cloud block `openAdmin()`; RPCs `is_admin`, `admin_list_members`, `admin_set_access` (SECURITY DEFINER, each re-checks `private.app_admins`; granted to authenticated only). Admin = owner Gmail row in private.app_admins. Add admins via SQL: insert into private.app_admins(user_id) select id from auth.users where email=...
- Cloud account (step 1 of paid plan): block at END of srcB (`cloud.js` source) — Supabase project `pbnfpbugxcndmrgpuved` (Vedic Astro Suite, ap-south-1), REST via fetch, no library. Email+password auth (`signIn/signUp/recover/signOut`), session in localStorage `vax_sb_session`. `saveProfiles` is wrapped to push diffs; `fullSync()` merges local+cloud by `cid(p)`. Tables: `chart_profiles` (RLS owner-only), `member_access` (status trial/active/blocked; read-only for users), `private.app_admins`. UI: `.cl-acct` cards (menu + intake), modal `#clModal`. NEXT: admin page (grant access), Razorpay, gate delivery of the app. Publishable key in code is public by design; NEVER put the service_role key in code.
- Dev card made calm again: removed 3D tilt/stars/orbit/typewriter; added WhatsApp community card (`.dc-community`) linking the group invite.
- Search UI v2: grouped topic tiles (`SRCH_GROUPS`, `srchGroupsHTML`), mobile bottom-sheet (<=640px), clear/Done buttons, sticky topic header; CSS block "Search UI v2". Duplicate id fixed: new karmic topic id is `karmapat`.
- 3D loader: wrapper `mount()` -> `settle()` keeps the loading screen ("WARMING UP THE SKY…") until the 3D iframe renders 10 consecutive frames <45ms (cap 6s) so the heavy first build is not visible.
- Dev card perf fix: removed animated conic border/blur/drop-shadow, 28 stars, tilt via rAF lerp (no CSS transition), touch ignored, zodiac glyphs centered with negative margins.
- Developer card "awe layer" (srcDev.html): twinkling stars, 3D pointer/gyro tilt, rotating gold border (@property --ang), zodiac orbit around avatar, typewriter role, status pill, tap-avatar sparkles. Test standalone by opening parts/srcDev.html.
- Share/QR UI v2: restyled input-page box (`.in-share*`) and modals (`.sh-*`: gold QR frame, 3 steps, option tiles, scan-frame animation); CSS blocks "share / QR UI v2" near .prof-del.
- UI polish layer: CSS block "UI polish layer" in srcB (panel entrance stagger, card hover lift, button shine, glass tabbar/header, modal pop, focus rings, ambient background). Pure CSS; remove the block to undo.
- Share by link/QR: block at END of srcB (`share.js` source) — URL hash `#c=` = base64url JSON [1,name,dob,tob,lat,lon,tz,place]. `/*QRLIBS*/` placeholder (own <script>) is replaced by build.py/build2.py with `parts/qrlibs.js` (qrcode-generator MIT + jsQR Apache-2.0; do not edit). `qrCanvas`, `showShare(p)`, `showScan()` (camera via getUserMedia, upload image, paste link), `openShared(p)` = loadProfileIntoForm + submit. UI: `#inShare` box under the intake form + 📤 on profile cards. Wrapper saves the original hash to `window.__vaxHash` (wrapper rewrites location.hash to #chart) and iframes get `allow=camera`. Base URL = parent page URL (http/https) else FALLBACK_BASE in share.js.
- FIXED intake glitch (could not change DOB/time after first pick): native `input` events from `#inDay..#inMin` bubbled to the form and `inSyncFriendly` overwrote the pick from OLD hidden values; now `stopPropagation` on those selects. Profile edit: ✏️ on each menu profile card -> `openProfEdit(idx)` modal (name/date/time, saves + re-renders via profileSelect change).
- 3D HUD: top-right ☍ button `#aspExpBtn` opens the Aspect Explorer popup (`openAspExp`/`closeAspExp`; the real `#explorerBlock` is moved into `#aspExpOverlay` and back). HUD line `#hudAsc` = CURRENT Rising sign at the viewer's place (`getLiveLoc()`: saved `vax_live_loc` else time-zone estimate; tap the chip -> parent `LocPicker.open` -> `askLiveLoc`). Same place feeds the gold start/end lines `T.riseG` (toggle `L_rise`), the ASC pointer/houses and `A.lagnaLon` (no birth place involved). Phone: view-switch at 190px.
- Date Finder (new Rectify tab 🔎 + popup button `#inFindDate` on the birth form, works before any chart): clues -> every day of a 1-40 year range is checked (sunrise-to-sunrise day, tithi/nakshatra match at sunrise OR during the day; Amanta months, `purn` option = North-India names). Festival table `DF_FEST` [id,name,kind,month,tithi,moment(+shift)]; eclipses from Moon latitude at new/full moon (solar <1.55°, lunar umbral <1.0°); Saturn/Jupiter/Rahu signs sampled every 6 days. 3+ clues also shows 'miss one clue' matches. One shared `#dfRoot` moves between the studio pane and the popup. Tests: `tests/datefinder_test.py`. Also fixed Shaka-year slip in `panchangaAt` for early-January (Margashirsha) dates; `'panel-datefinder'` added to export SKIPP.
- 3D premium polish: CSS block "PREMIUM POLISH LAYER" in srcA (champagne-gold glass, vignette `.viewport::after`, eased tab/modal motion, `--ease`); camera drag momentum + eased wheel zoom (`spinVT/spinVP`, `zoomGoal/zoomSet` in renderLoop; skipped under reduced-motion); magnetic hover `setupMagnetic` (sets `--tx/--ty/--mx/--my`, uses CSS `translate`, mouse devices only).
- 3D Rising timeline: LONG-PRESS (550ms, `setupRisingPress`, `.pressing` fill, click suppressed after a hold) on `#hudAsc` opens popup `#risingOverlay`; tap still opens the place picker. Same content in new side-panel tab `tab-rising` (`#risingTabBody`). Model `riseTimeline(jd,L)` (cached; `_ascEdge` steps 1 min + bisects) -> 12 signs start/end/duration; `risingHTML`, `renderRising(force)` (called from `renderHUD`, per-minute key), `openRising`/`closeRising`.
- 3D: removed the + / − zoom buttons (`zoomInBtn`/`zoomOutBtn`); zoom is by pinch / mouse wheel only.
- 36 Dasha Systems panel (`panel-dashasys`, Home → Time & Cycles; UI folds the 36 into 7 `GROUPS` in `js/82-…` with a side-by-side compare view per group): engines `js/78-82` + `css/35`. Registry `DashaSys.register({id,name,blurb,family,keyType,conf,applic,build,sub})`; periods laid out from birth, sub-periods on the FULL parent length then clipped (like Vimshottari). Vimshottari there == main engine (tested). Disputed rules (Kala Chakra, Sudasa, Paryaya, Padanadhamsa, Mandooka, Moola, Brahma, Drig, Chara AD patterns) are flagged `conf:'varies'` in the UI. Iranganti needs Male/Female toggle.
- Added nested vargas D81 (D9 in D9), D108 (D12 in D9), D144 (D12 in D12): `VARGAS` + `calcVarga` cases + `nestedVargaLon()` in `js/05-…`; every varga picker/export iterates `VARGAS`, so they appear automatically (verified vs independent formula, 4000 random longitudes).
- Icons for the new stuff: 12 new SVGs in `shared/icons.js` (hexagram, octagram, wheel, daynight, swap, triangle, kendra, feet, anchor, trident, beads, dna) + extra emoji keys on existing icons. Dasha cards use `ICO` map (system id → emoji key) in `js/82-…`; D81/D108/D144 icons are in `AREA` in `js/69-…`; Home row uses 🎡.
- Added RTN (Rasi Tulya Navamsa) as a varga key: planets = D9 signs, lagna = D1 lagna (special-cased in `computeChart`); `noTimer:true` keeps it out of the transit/sandhi/timeline pickers.
- Open ideas: Kama saham (needs verifiable formula), PDF client report, remedies, karma, karmarel, link Fate Meter/Sahams into Chart Reading, outer planets in matchmaking/transit-timing tabs.
- Known limits: Standish elements degrade outside 1800–2050; 3D can't be browser-tested without a local Three r128; Pluto/Uranus/Neptune have no dasha/shadbala by design.

---

## 8. Auto-generated map (do not edit)
<!-- AUTO:START (rewritten by build.py on every build; do not edit by hand) -->
_Generated 2026-10-16 - 1113 symbols in `symbols.idx` (paths are real files now: `Read` them with offset/limit)._

### File map (lines / KB) - file names say what is inside

**birth-chart** - 118 files, 13834 lines, 959 KB
```
index.html                                         531 lines   30 KB
js/01-dev-contact.js                                 7 lines    0 KB
js/02-app-meta-layer.js                             74 lines    4 KB
js/03-ephemeris-engine.js                          164 lines    7 KB
js/04-transit-timing-engine.js                     249 lines   11 KB
js/05-ascendant-nakshatra-vargas.js                210 lines   12 KB
js/06-outer-planet-knowledge.js                     37 lines    5 KB
js/07-planetary-dignity.js                          77 lines    3 KB
js/08-combustion-and-war.js                         30 lines    1 KB
js/09-aspect-events.js                              69 lines    2 KB
js/10-vimshottari-dasha-engine.js                   94 lines    4 KB
js/11-ashtakavarga-engine.js                        32 lines    2 KB
js/12-yoga-detection.js                            117 lines    4 KB
js/13-chara-karakas.js                              24 lines    1 KB
js/14-shadbala-engine.js                           279 lines   12 KB
js/15-chart-core-compute.js                        155 lines    7 KB
js/16-rectification-engine.js                       38 lines    2 KB
js/17-special-lagnas.js                            404 lines   23 KB
js/18-ui-location-profiles.js                      124 lines    5 KB
js/19-planets-panel.js                             223 lines   16 KB
js/20-rectification-scan-tab.js                    271 lines   11 KB
js/21-transit-timer-tab.js                         100 lines    4 KB
js/22-sandhi-table-tab.js                           68 lines    2 KB
js/23-varga-timeline-tab.js                         79 lines    3 KB
js/24-profile-backup.js                             80 lines    4 KB
js/25-home-and-tabs.js                             104 lines   10 KB
js/26-rectification-studio.js                      227 lines   13 KB
js/27-date-finder-core.js                           50 lines    3 KB
js/28-date-finder-engine.js                        186 lines   11 KB
js/29-date-finder-ui.js                            191 lines   18 KB
js/30-life-event-checker.js                        160 lines   10 KB
js/31-smart-search.js                              190 lines   16 KB
js/32-ask-ai.js                                    317 lines   39 KB
js/33-quick-search.js                               99 lines    4 KB
js/34-relationships-tab.js                         210 lines    8 KB
js/35-form-submit-compute-render.js                 55 lines    2 KB
js/36-render-helpers.js                             43 lines    2 KB
js/37-dasha-check-date.js                           30 lines    1 KB
js/38-dasha-navigator.js                           188 lines   13 KB
js/39-yogas.js                                      67 lines    4 KB
js/40-shadbala.js                                   55 lines    3 KB
js/41-ashtakavarga-section.js                       35 lines    5 KB
js/42-relationships-section.js                      21 lines    1 KB
js/43-full-report-text.js                          244 lines   13 KB
js/44-export-modal.js                              203 lines    9 KB
js/45-panchanga-engine.js                          107 lines    7 KB
js/46-transit-stays-engine.js                       43 lines    2 KB
js/47-bhava-chalit-engine.js                        29 lines    1 KB
js/48-panchanga-panel.js                            96 lines    7 KB
js/49-transits-panel.js                             78 lines    7 KB
js/50-bhava-chalit-panel.js                         30 lines    2 KB
js/51-kundali-matching-engine.js                    94 lines    7 KB
js/52-kundali-matching-ui.js                       180 lines   16 KB
js/53-vedic-birthday-engine.js                      76 lines    4 KB
js/54-vedic-birthday-ui.js                         152 lines   12 KB
js/55-numerology-engine.js                          54 lines    9 KB
js/56-numerology-ui.js                             126 lines   13 KB
js/57-my-chart-overview.js                         100 lines    6 KB
js/58-render-results.js                            752 lines   34 KB
js/59-live-transit-form.js                         150 lines    7 KB
js/60-interactive-varga-svg.js                     162 lines    6 KB
js/61-varga-chart-svg.js                            61 lines    9 KB
js/62-clipboard-download-helpers.js                121 lines    4 KB
js/63-profile-cards.js                              32 lines    2 KB
js/64-edit-saved-profile.js                         32 lines    2 KB
js/65-error-boundaries.js                           32 lines    1 KB
js/66-modal-accessibility.js                        23 lines    1 KB
js/67-friendly-input-page.js                        96 lines    8 KB
js/68-intake-progress.js                            65 lines    3 KB
js/69-divisional-areas.js                          131 lines   20 KB
js/70-chart-reading.js                              75 lines   16 KB
js/71-life-activation.js                            50 lines    9 KB
js/72-bhava-bala.js                                 47 lines    7 KB
js/73-tithi-pravesh.js                              62 lines   14 KB
js/74-sahams.js                                     67 lines   15 KB
js/75-fate-meter.js                                 76 lines   20 KB
js/76-share-link-qr.js                             129 lines   10 KB
js/77-cloud-account.js                             142 lines   14 KB
js/78-dasha-systems-core.js                        244 lines   11 KB
js/79-dasha-systems-nakshatra.js                   150 lines    9 KB
js/80-dasha-systems-rasi.js                        149 lines    8 KB
js/81-dasha-systems-ayur-special.js                146 lines    7 KB
js/82-dasha-systems-ui.js                          200 lines   14 KB
css/01-premium-tokens-reset.css                     85 lines    2 KB
css/02-header.css                                   55 lines    3 KB
css/03-hero-intake-form.css                         78 lines    4 KB
css/04-app-tab-navigation.css                       50 lines    2 KB
css/05-results-sections.css                        970 lines   59 KB
css/06-quick-search.css                             61 lines    3 KB
css/07-ai-jyotish-chatbot.css                      297 lines   13 KB
css/08-responsive.css                               71 lines    3 KB
css/09-home-launcher.css                            34 lines    2 KB
css/10-dasha-redesign.css                           71 lines    5 KB
css/11-yogas-shadbala-redesign.css                  74 lines    6 KB
css/12-export-and-profiles.css                      46 lines    4 KB
css/13-ui-polish-layer.css                          31 lines    3 KB
css/14-share-qr.css                                 39 lines    4 KB
css/15-search-ui.css                                52 lines    5 KB
css/16-cloud-account-ui.css                         35 lines    5 KB
css/17-my-chart-redesign.css                        63 lines    6 KB
css/18-intake-redesign.css                          53 lines    4 KB
css/19-planets-popup-redesign.css                   75 lines    7 KB
css/20-meta-layer.css                               34 lines    3 KB
css/21-panchanga-transits-bhava.css                 72 lines    8 KB
css/22-kundali-matching.css                         79 lines    9 KB
css/23-vedic-birthday.css                           59 lines    6 KB
css/24-dasha-navigator.css                          32 lines    4 KB
css/25-vedic-birthday-hero.css                      97 lines   12 KB
css/26-developer-card.css                           59 lines    7 KB
css/27-d-chart-explorer.css                         60 lines    7 KB
css/28-drishti-explorer.css                         31 lines    3 KB
css/29-special-lagnas.css                           63 lines    9 KB
css/30-ashtakavarga.css                             99 lines   16 KB
css/31-rectification-studio.css                    100 lines   10 KB
css/32-date-finder.css                              66 lines    6 KB
css/33-friendly-input-page.css                      47 lines    4 KB
css/34-smart-search.css                             30 lines    3 KB
css/35-dasha-systems.css                            96 lines    8 KB
```

**developer** - 4 files, 180 lines, 13 KB
```
index.html                                          40 lines    3 KB
js/01-dev-card.js                                   12 lines    0 KB
css/01-base.css                                     62 lines    2 KB
css/02-developer-card.css                           66 lines    8 KB
```

**notepad** - 3 files, 534 lines, 92 KB
```
index.html                                          47 lines    2 KB
js/01-notepad.js                                   319 lines   65 KB
css/01-notepad.css                                 168 lines   25 KB
```

**sky3d** - 66 files, 5795 lines, 318 KB
```
index.html                                         437 lines   26 KB
js/01-astro-engine.js                              143 lines    7 KB
js/02-planetary-dignity.js                          50 lines    3 KB
js/03-ascendant-houses-drishti.js                   52 lines    1 KB
js/04-sign-level-aspects.js                         22 lines    0 KB
js/05-aspect-resolver.js                            58 lines    2 KB
js/06-planet-detail-helpers.js                     154 lines    6 KB
js/07-position-snapshot.js                          27 lines    1 KB
js/08-scene-setup-and-camera.js                    399 lines   16 KB
js/09-free-fly-joystick.js                          60 lines    2 KB
js/10-procedural-textures.js                       315 lines   13 KB
js/11-planet-visuals.js                            253 lines   14 KB
js/12-solar-system-view.js                         194 lines   12 KB
js/13-camera-mode-control.js                        50 lines    2 KB
js/14-line-visibility-toggles.js                    68 lines    2 KB
js/15-planet-labels.js                              58 lines    2 KB
js/16-app-state.js                                  34 lines    1 KB
js/17-render-sky-table.js                           23 lines    1 KB
js/18-rising-sign-timeline.js                       73 lines    4 KB
js/19-hud-render.js                                 63 lines    2 KB
js/20-transit-conjunction-scanner.js               152 lines    6 KB
js/21-natal-profile.js                              50 lines    2 KB
js/22-chart-tab.js                                  38 lines    1 KB
js/23-north-indian-wheel.js                         78 lines    4 KB
js/24-sign-selector.js                              83 lines    4 KB
js/25-rich-sign-detail.js                           95 lines    7 KB
js/26-sign-aspects.js                              103 lines    4 KB
js/27-aspect-explorer-ui.js                        144 lines    6 KB
js/28-planet-detail-popup.js                       149 lines    6 KB
js/29-planet-detail-content.js                     145 lines   18 KB
js/30-outer-planet-knowledge.js                     38 lines    5 KB
js/31-outer-planet-popup.js                        100 lines    8 KB
js/32-aspect-explorer-popup.js                      74 lines    4 KB
js/33-timeline-scrubber.js                          58 lines    2 KB
js/34-main-refresh-loop.js                          59 lines    2 KB
js/35-ui-wiring.js                                  21 lines    1 KB
js/36-mobile-bottom-sheet.js                        75 lines    3 KB
js/37-natal-form-location.js                        90 lines    5 KB
js/38-data-export-wiring.js                        124 lines    4 KB
js/39-smoothness.js                                 51 lines    3 KB
js/40-3d-astro-layers.js                           135 lines   10 KB
js/41-quick-planet-picker.js                        47 lines    3 KB
js/42-init.js                                       24 lines    0 KB
js/43-degree-finder-returns.js                     211 lines   13 KB
js/44-retrograde-planner.js                         41 lines    7 KB
css/01-base-tokens.css                              51 lines    1 KB
css/02-app-shell.css                                48 lines    1 KB
css/03-3d-viewport.css                              63 lines    5 KB
css/04-side-panel.css                              115 lines    7 KB
css/05-timeline-scrubber.css                        87 lines    5 KB
css/06-chart-wheel.css                              31 lines    2 KB
css/07-aspect-list.css                              27 lines    2 KB
css/08-aspect-explorer.css                          42 lines    3 KB
css/09-mobile-free-fly-joystick.css                 42 lines    2 KB
css/10-planet-detail-header.css                     48 lines    3 KB
css/11-sign-selector-dropdown.css                   31 lines    2 KB
css/12-polish-layer.css                             54 lines    4 KB
css/13-tablet.css                                  111 lines    6 KB
css/14-structure-visual-layer.css                   54 lines    4 KB
css/15-smoothness.css                               36 lines    3 KB
css/16-astro-layers.css                             52 lines    6 KB
css/17-polish-rest-of-app.css                       27 lines    3 KB
css/18-planet-picker.css                            40 lines    3 KB
css/19-retrograde-planner.css                       35 lines    4 KB
css/20-hud-ascendant-rising.css                     51 lines    4 KB
css/21-premium-polish.css                           32 lines    3 KB
```

**shell** - 4 files, 399 lines, 52 KB
```
index.html                                           2 lines    2 KB
shell/css/shell.css                                 72 lines    8 KB
shell/js/locpicker.js                              202 lines   34 KB
shell/js/shell.js                                  123 lines    8 KB
```

**shared** - 3 files, 906 lines, 69 KB
```
shared/export-addon.js                             643 lines   47 KB
shared/icons.js                                    165 lines   17 KB
shared/meta.css                                     98 lines    5 KB
```
<!-- AUTO:END -->
- Door v2 (login→Razorpay pay→app + local admin): see docs/DOOR.md and ../door-site/. Customer edition is DERIVED by tools/build_customer.py (editions/customer/customer-layer.js, customer_top.js); originals untouched. Old gate/ (encrypted blob) is superseded.

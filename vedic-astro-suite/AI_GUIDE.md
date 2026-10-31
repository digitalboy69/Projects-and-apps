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
| Rectification / birth time tools / life events | `birth-chart/26-rectification-studio.js`, `birth-chart/30-life-event-checker.js`, `birth-chart/25-home-and-tabs.js`, `birth-chart/65-error-boundaries.js` | `initRectStudio` ("RECTIFICATION STUDIO" banner, tabs dial/scan/sandhi/vt/tt/life), `rsRunLife`, `rsEvalLagna`; old panel ids route via `RS_ROUTE` in `switchAppTab` hook. Life-Event Pro (later files win): events catalog `js/97` (`LEC`, 278 events), engine + UI `js/98` (`leAnalyse`, `rsBuildLife`, `rsRunLife`) |
| Panchang, transits, Sade Sati | `birth-chart/45-panchanga-engine.js`, `birth-chart/59-live-transit-form.js` | `panchangaAt`, `computeLiveSky`, "PHASE 1 ENGINES" banner |
| Special lagnas / Arudha | `birth-chart/17-special-lagnas.js` | `buildVargaFromLagna`, `computeAllSpecialLagnaSigns` |
| Home dashboard, tab bar, new panel/tool | `birth-chart/25-home-and-tabs.js`, `birth-chart/65-error-boundaries.js`, `birth-chart/58-render-results.js` | `HOME_ITEMS` (add a row), `switchAppTab`, panels are `html += \`<div class="app-panel" id="panel-X">\`` in `renderResults` |
| Popular charts gallery (famous people under the 3-step form), add/change a person | `birth-chart/85-popular-charts-data.js`, `birth-chart/86-popular-charts.js` | `PC_PEOPLE` (add a row), `PC_CATS`, `cast()` (tz option + `loadProfileIntoForm`), `fetchImg` (Wikipedia photo) |
| Interpretation texts: planet in house/sign, house lord in house, aspects, conjunctions, nakshatras, yogas | `birth-chart/87-vedic-knowledge-db.js` | `VDB_DATA` (edit text), `VDB.planetInHouse/planetInSign/lordInHouse/aspectOnHouse/planetAspect/conjunction/nakshatra`, `VDB.reading(chart)`, `VDB.functionalNature` |
| Deep reading tab / planet-card text / report section (how the database is shown) | `birth-chart/88-deep-reading.js`, hooks in `70-chart-reading.js`, `43-full-report-text.js` | `VDR.pane`, `VDR.planetBlock`, `VDR.dashaBlock`, `VDR.reportText` |
| Nakshatra facets / any planet-in-nakshatra-pada text, birth star, rising nakshatra | `birth-chart/89-vedic-nakshatra-db.js` | `VNK_DATA` (edit facets), `VNK.placement/lagna/moon/forChart/each/find` |
| "In real life" scenes / self-check questions / rising profile / signature at a glance | `birth-chart/90-reading-manifest.js` | `VMF_DATA` (behave, arena, manner, rising), `VMF.placement/lagna/lagnaArc/signature` |
| What a Mahadasha/Antardasha feels like, life timeline, next 5 years | `birth-chart/91-dasha-reading.js` | `VDA_DATA` (planet theme/feelsLike/helps/watch/lens, houseRel), `VDA.timeline/antardashas/upcoming/current/pair` |
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
- 3D Sky: new "Triggers" tab (Vimshottari dasha + Jupiter/Saturn double-transit life-area triggers, window scan) — sky3d js 45/46/47, css 22.
- Birth chart UI overhaul: input page = full screen, no header (floating profile button); app header = [back][search pill][avatar]; Home = segmented section chips (All / sections / Ask AI) + tiles, Smart-Search "Ask AI" topics and Tap-to-search moved into Home as sections; profile sheet with hero. css 36, js 83, edits in js 25.
- Bridge main ⇄ 3D: sky3d js 48 merges the main app's saved profiles (key "Vedic Astrology_profiles_v1") into its dropdown and follows "vax_active_profile_v1" (written by birth-chart js 83 on every renderResults); 3D-only profiles stay in their own key.
- 3D Sky: "Time Machine" picker replaces the native datetime-local (sky3d js 49, css 23): year slider 1800–2200, hold-to-repeat ±100y…±1h, typed dates, month/day tiles, Birth jump; timeline is draggable with 1M/1Y/10Y/100Y zoom; whole 3D UI re-skinned in css 23.
- Triggers: 15 new life areas (love, infatuation, luck, promotion, fame, relationship strain, windfall/inheritance, legal, debt, father, mother, siblings, business, job change, spiritual) in sky3d js 46 THEMES; per-area transit style `tp` (dbl/jup/sat/press/node), `rule` text and `src` links (checked against astromedha, jagannathhora, astrologertripathi, Parashara, shreekundli) shown in the UI.
- Popular charts: new section UNDER the 3-step form on the Birth Chart input page (`#popCharts` inside `#intakeSection`, after `</form>`). 100 public figures in 10 groups x 10 (`PC_CATS`, `PC_PEOPLE` in `js/85-popular-charts-data.js`; UI `js/86-popular-charts.js`; `css/38`). Cards show Lahiri Sun/Moon (precomputed with the app engine; two names = the sign changed that day, nakshatra/rising only when stable); birth TIME only for Obama 19:24 and Einstein 11:30 (documented), everyone else cast at noon and labelled so. Photos = Wikipedia REST summary at runtime (guarded: must be a standard page mentioning the name; initials fallback), lazy via IntersectionObserver. "Show this chart" = `cast()`: adds a one-off `<option data-pc>` to `#tzInput` when the offset is not in `TZ_OPTIONS` (25 old births use local mean time) then `loadProfileIntoForm` + submit, so it is saved in profiles like any chart. Test: `tests/popular_charts_test.py` (also cross-checked all 100 Sun/Moon sign sets against `getSiderealLongitudeAt`, 0 differences).
- Knowledge database: `js/87-vedic-knowledge-db.js` = `VDB_DATA` (625 entries) + `VDB` lookup API, NOT yet used by any UI. planet-in-house 9x12 (hand-written), planet-in-sign 9x12, house-lord-in-house 12x12, planet-aspect-on-house 9x12, planet-aspects-planet 9x8 (all rule-based, wording from small tables), 35 conjunctions, 27 nakshatras (name/lord/deity equal `NAKSHATRAS`), 23 yogas, dasha lords, retro/combust/vargottama/dignity texts, `functionalNature(lagna)`. `VDB.reading(computeChart(...))` returns every applicable entry for a chart. Keys/aspect rule/dignity/relations are cross-checked against the app's own tables in `tests/knowledge_db_test.py` (0 differences; nodes follow the app: only exalted/debilitated/neutral). Next step if wanted: feed `VDB.reading()` into `70-chart-reading.js` (`planetRead`) and the full report.
- Deep reading (wired): `js/88-deep-reading.js` (`window.VDR`) shows the knowledge database in the app. Hooks: `70-chart-reading.js` (planet cards get `VDR.planetBlock`, 6th tab `📖 Deep reading` = `VDR.pane`, Now tab gets `VDR.dashaBlock`) and `43-full-report-text.js` (section `deepReading`, checkbox `data-section="deepReading"` in the export dialog, text = `VDR.reportText`). No new calculation: planets/houses/aspects come from `computeChart`, wording from `VDB.reading(chart)` (cached per chart in a WeakMap). `functionalNature` no longer calls the Sun/Moon 8th lord malefic. Test: `tests/deep_reading_test.py` (asserts every on-screen text equals the VDB text for the chart's real placements).
- Full reading plan: see `docs/FULL_READING_PLAN.md` (audit, gaps, 12 sessions S1-S12 with checklist, merge milestones M1-M4, decisions). Read it first when working on readings/PDF; update its checklist each session.
- Nakshatra layer (S1 of docs/FULL_READING_PLAN.md): `js/89-vedic-nakshatra-db.js` (`VNK`) = Layer schema v1: facets (style/keywords/strengths/shadows/relating/wellbeing/practices) + ease score + tone + tags, text composed on demand for all 972 planet-nakshatra-pada placements, Lagna and the Moon birth star; shown by `88-deep-reading` (planet cards, birth-star and rising-nakshatra notes, report). Test `tests/nakshatra_db_test.py` (pada->navamsa = app D9, Moon star = dasha start). Wording rule for all reading layers: tendencies, never fate; tests ban absolute words.
- Manifestation layer (S2 of docs/FULL_READING_PLAN.md, schema v1.1): `js/90-reading-manifest.js` (`VMF`) makes readings personal: planet=what you do, house=arena scenes, sign=manner -> 3 concrete everyday lines + others/inside/at best/under strain + 2 self-check questions for every planet-house-sign (1296), 12 rising profiles, `lagnaArc`, `signature(chart)`. `js/89` nakshatras also carry manifest facets. Shown by `88-deep-reading` (signature at top, `In real life` block first in each planet card, report). Rule for ALL future layers: second person, tendencies, concrete scenes, self-check questions. Test `tests/manifest_test.py`.
- Dasha layer (S3): `js/91-dasha-reading.js` (`VDA`) = timeline of every Mahadasha (theme/feelsLike per planet + arena + ruled houses + VMF lines + tone from functional nature/dignity/house + self-check), Antardashas via the app's `calculateAntardashas`, `upcoming(chart,5)`, `current(chart)`, `pair(md,ad)`. Deep reading tab: Life timeline cards + next-5-years rows; Now tab: running MD+AD (old generic VDB dasha text superseded); report: LIFE TIMELINE. Charts older than the 120-year cycle have no running period (handled). Test `tests/dasha_reading_test.py`.
- AI session system: start every session with `docs/AI_START_HERE.md` (session loop, `tools/ai/session.sh start|check|test|ship`, token hygiene, lessons). The four reading databases (js/87, 89, 90, 91) are GENERATED from `tools/reading_gen/*.py`: edit the tables there and run `regen.sh`, never the JS. `.gitattributes` auto-merges STRUCTURE.md/AI_GUIDE.md (union) and dist/symbols.idx (ours, then build.py).
- Navigation plan: see `docs/APP_NAVIGATION_PLAN.md` (audit: 32 tools / 26 panels, Home = 4 screens, 17 tools with no bottom tab; target hubs Start / Chart / Time / Strength / Tools, one `TOOLS` registry, 9 sessions N1-N9). Nothing built yet; read AI_START_HERE first.
- Open ideas: Kama saham (needs verifiable formula), PDF client report, remedies, karma, karmarel, link Fate Meter/Sahams into Chart Reading, outer planets in matchmaking/transit-timing tabs.
- Vimshottari now has 6 levels (Deha added: js/10 `dehaDasha`/`allDehaDashas`, js/36 DX_LEVELS, js/37, js/38, js/43, js/93). Ephemeris uses delta-T (js/03 `deltaTSeconds`, switch `EPH_DELTA_T`). Verified against Swiss Ephemeris: `node tests/ephemeris_vs_swiss_test.js`. Known: Lahiri here follows the official ICRC value (23 15 00.658 on 21 Mar 1956), about 15" above the Swiss Ephemeris Lahiri.
- Dasha Lens (studio tab, js/99-dasha-lens.js, css/44) + 3D jump (js/99-jump-3d-bridge.js -> apps/sky3d/js/51-jump-from-rectification.js via localStorage 'vax_jump_3d' + the shell's 'vedic-open-3d'). Test: `node tests/dasha_lens_test.js`.
- Rectification Studio redesign + speed: css/31 + css/32 rewritten (class selectors only); scan table is virtual + chunked (js/20); panels Vedic Birthday (js/54) and Tithi Pravesh (js/73) build lazily (`vxEnsurePanels` before export); moonLongitude uses a hoisted term table (js/03); icons.js pre-check; studio excluded from the global `-card` hover rules (css/13).
- Life-Event Checker Pro: `js/97-life-event-catalog.js` (278 events by house/planet/sign, plain words, sharpness) + `js/98-life-event-engine.js` (dasha recomputed per candidate minute, aspects, Jup/Sat/Mars/Rahu/Ketu transits, Monte-Carlo luck test, bootstrap + drop-one, confidence floor) + `css/42`. Overrides the functions of js/30. Catalog facets (js/97 end): theme, who, mood, life stage, date accuracy + house/planet/sign; browse views are built by `leDefs` in js/98; UI styles use only `.le-` classes (never bare span/i/b, the icon layer inserts `.vxi` spans). Test: `node tests/life_event_pro_test.js`. Floor is a consistency check of the rules, not proof of astrology.
- Known limits: Standish elements degrade outside 1800–2050; 3D can't be browser-tested without a local Three r128; Pluto/Uranus/Neptune have no dasha/shadbala by design.
- S13 Area deep dive: `js/99-area-deep.js` (ADD, GENERATED by `tools/reading_gen/build_dd.py`) gives about 1,900 words per life area from all divisional charts, Ashtakavarga, Shadbala, drishti, yogas and timing; shown as a fold-out in Deep reading, in the report text and as `.plate.deep` pages in the PDF. Test: `tests/area_deep_test.py`.
- S14 Right now: `js/100-house-now.js` (HNW, GENERATED by `tools/reading_gen/build_hn.py`) reads each of the 12 houses at today's date (sign, lord, natal planets, transits, aspects, nakshatras, Mahadasha/Antardasha/Pratyantar); `js/101-house-now-ui.js` shows it as the FIRST Chart Reading tab (`.hn-tab`/`.hn-pane`, which older tests skip), in the report text and as PDF section 'now'. Test: `tests/house_now_test.py`.
- S15 Planet states: `js/102-planet-states.js` (PST, GENERATED by `tools/reading_gen/build_ps.py` from `ps_data.py`) gives each planet's state (exalted/own/friend/neutral/enemy/debilitated + cancellation, retrograde, combust, vargottama, navamsa, house, star), `PST.periods` reads the running dasha lords by state and `PST.yogaStates` reads yogas by their planets' state; `js/103-planet-states-ui.js` adds them to the Planets tab cards, Now tab, Deep reading yogas, report text and PDF (planet pages, dasha page, yoga cards). Test: `tests/planet_states_test.py`.
- S16 Reading style: `css/44-reading-style.css` + `js/104-reading-style.js` (MutationObserver adds progress bar, explored dots, next-up buttons and bold hooks to every `.rd`); Right now has a hero and a short version per house. Test: `tests/reading_style_test.py`. Keep the style unnamed in the product and docs (the test checks).
- S17 Shadbala reading: `js/105-shadbala-reading.js` (SBR, GENERATED by `tools/reading_gen/build_sb.py`) + `js/106-shadbala-ui.js` (SBRUI) give the last Chart Reading tab '💪 Strength' (tab/pane carry `.sbr-tab`/`.sbr-pane`, which older tests skip), report text and PDF Shadbala pages. CSS classes use the `sbr-` prefix because `sb-` belongs to the older Shadbala screen. Test: `tests/shadbala_reading_test.py`.
- S18 Ashtakavarga reading: `js/107-ashtakavarga-reading.js` (AVR, GENERATED by `tools/reading_gen/build_av.py`) + `js/108-ashtakavarga-ui.js` (AVRUI) give the last Chart Reading tab '🔢 Ashtakavarga' (combined map, planet readings, each planet in each house), report and PDF. CSS prefix `avr-`. Test: `ashtakavarga_reading_test`.
- Silent updater: `shell/js/updater.js` reads `version.json` (GENERATED by `tools/version.py` from build.py); when the build id changed it re-downloads every file with cache reload and reloads once behind the loader (also when you return to the app, only if no chart is open). Fixes new tabs missing until a manual refresh. Test: `updater_test`.
- PDF download: `js/109-pdf-download.js` (PDFD) makes the PDF book into a .pdf file directly (no print window): book laid out in a hidden 794px frame, cut at block ends, each page drawn by the browser (SVG foreignObject to canvas, data: URL, else the canvas is tainted) as JPEG into a built-in PDF writer. `PDFR.download` = PDFD with print fallback (`PDFR.print`). Pages are images, so text is not selectable. Test: `pdf_download_test`.
- Reading polish: `css/48-reading-polish.css` (loaded last, scoped to `.rd`) is the final look layer for Chart Reading; change the look there, not in the per-tab css. Rules: one accent per meaning, hairline borders, no loud fills, headings without emoji, motion off for reduced-motion.
- Intake polish: `css/49-intake-polish.css` (loaded last, scoped to `.in-wrap`) is the look layer of the birth-details page; the step logic stays in `js/68-intake-progress.js` (classes `done`/`current` drive the timeline).
- Home polish: `css/50-home-polish.css` (loaded last, scoped to `#panel-home`) is the look layer of the Home tool hub (chips, Quick start tiles, tool cards); the markup comes from `js/25-home-and-tabs.js`.
- Problem finder: `js/111-problem-finder.js` (PRB, hand-written data and engine: AREAS list, NAT natures, planetFindings/houseFindings/culpritFindings/timing) + `js/112-problem-finder-ui.js` (PFUI) give the last Chart Reading tab '🧭 Problem finder' and the Home tile (panel-problem). To add a problem, add a row to its area in AREAS (id, label, nature, extra houses, extra planets). Test: `problem_finder_test`.
- Problem finder S20: 20 areas with 11-23 exact problems each (MORE list in `js/111`), grouped by kind with a find box in `js/112`; new first section `check` = `chartCheck()` lists harsh planets (Saturn, Mars, Rahu, Ketu, Sun) sitting in or looking at each house and significator, harsh or kind running periods, today's sky, and says plainly when nothing is found (verdict clear|found). Harsh planets in houses 3, 6, 11 are read as mild. Chart check lines are one paragraph per planet (sign, house, Nth aspect and the sign it falls on) plus an area-kind effect and help from FX (people/material/inner), for the birth chart and today's sky alike. Result now leads with `R.ranked` (top 5 reasons for THIS problem, merged per planet and timing, scored by planet weight x touches x problem-specific houses x culprit planet, with the span answer shifting birth vs sky weight; labels Strong/Moderate/Mild; a relative ranking, not a statistic); all sections sit under a closed 'Read more'. S21: `fnature(lagna)` classes planets for the ascendant (yoga/benefic/neutral/malefic); `harshKind` turns naturally harsh planets into harsh|mild|helper|yoga, and helpers/yogakarakas read as support in every layer. S22: level is the percentile of this problem's strain ratio among all problems of the same chart (`baseline`, cached on `chart.__prbBase`): top 20% strong, 40-80% moderate, below 40% light; verdict 'clear' forces light; 'found' needs a pressing (non-mild, non-helper) planet. S23: houses = area houses + the problem's `eh` + its nature's `nh`; weights W (eh 1, area first house 0.8, other area 0.5, nature 0.35) and KWT scale area findings, check scores and ranked candidates (items from the trigger/pain layers count 0.35); `chartCheck` also reads the divisional chart for love/marriage (D9), career (D10), children (D7), mother/father (D12), home (D4), study (D24): karaka dignity there and harsh planets in the key house. S24: `ingress(planet, now)` scans the app ephemeris (getSiderealLongitudeAt) to date when a slow planet entered its sign and moves on (cached per hour); dasha lines show end dates and dusthana (6/8/12) rulership; Saturn (4th/8th from the Moon = harsh, 3/6/11 = easy) and Jupiter (2/5/7/9/11 = supportive) are counted from the Moon. Check items carry w 0 so the level calibration is unchanged.
- Date entry S26: `js/113-date-entry.js` panel (day, month, year, AD/BC) feeds `inDobValue()`/`inLoadDob()`; engine in `js/03` has `toJulianDay` (Julian before 1582-10-15), `parseDob` (handles negative years, never use split("-") or Date.UTC for dob), `formatDobStr`, `deltaT`, `jdToParts`. Astronomical years (1 BC = 0). Far dates are approximate; modern-date tools (Panchanga, date finder, Vedic birthday) not verified for them.
- Date entry S27 (3D app): `apps/sky3d/js/01` has the same `toJulianDay` (Julian before 1582-10-15), `parseDob`, `formatDobStr`, `dobHuman`; `js/37` builds the hidden `#natalDob` from `#ndDay/#ndMon/#ndYear/#ndEra` (`ndCheck`, `ndSet`). Time Machine (`js/49`) works on plain {y,m,d,h,mi} parts; `jdToDate` in the 3D engine now returns a Date-like object (BC and Julian exact), `jdToParts`, `yearLabel`, `localOffsetMin` live in `js/01`. No ΔT correction in the 3D engine; never `split("-")` a dob.
- Updater fix: `shell/js/updater.js` no longer reloads the page by itself after a new build (that made the app load twice); it downloads quietly and shows the new build on the next open or when you return to a tab with no chart open.
- Performance rule for the polish layers (css/48-50): animate only transform and opacity, no backdrop-filter, no mask-image, no looping box-shadow or text-shadow animation, no scroll-timeline on lists; use `contain:layout paint` on repeated cards.

---

- Quick Menu: `shared/quick-menu.js` adds a top-left ☰ button to 3D Sky, Birth Chart and Notepad (one tap to jump to any tool or tab, 📌 pins, user-named groups; saved in localStorage `vedicQuickMenu_v1`). Tool switching: app posts `{vqm:'go',tool,id}` to the shell (handler above the floating switcher in `shell/js/shell.js`). Birth Chart header gets 40px left padding in app mode (`09-home-launcher.css`). Tested in a browser: tab jump, tool jump, pins across tools; smoke 5/5.
- D-chart images (North, South, West) now have a full gold border: glowing double outer frame with beaded inner line and edge diamonds, thick chart-body border with corner studs, centre diamond/box, and degree ticks plus extra rings on the wheel (`chFrame` in birth-chart/js/61-varga-chart-svg.js).
- D-chart borders were missing in the app because every chart reused the same gradient ids (`ng`, `sg`, `wg`); a hidden copy (My Chart overview) earlier in the page made browsers drop all gold strokes. `chUniq` in birth-chart/js/61-varga-chart-svg.js now gives each chart unique ids.
- Divisional Charts page tidied (step 1 of the layout clean-up): shorter title, compact controls card (picker, style, one options row), compact chart head so the chart shows on the first screen (css/27 end block, text in js/58 and js/84).
- Compare Lab (experiment, 🧪 button on Divisional Charts): full-screen canvas, three-dot menu adds up to 4 charts (D1 vs D9, any vs any), per-chart style, tap a planet to follow it across charts, planet-by-chart table, plain-language notes, copy as text (hidden while the app's Copy-buttons setting is off). js/115-compare-lab.js (CMPLAB), css/54-compare-lab.css, test tests/compare_lab_test.py; planet badges in js/61 now carry class ch-pl + data-p.


## 8. Auto-generated map (do not edit)
<!-- AUTO:START (rewritten by build.py on every build; do not edit by hand) -->
_Generated 2026-10-31 - 1699 symbols in `symbols.idx` (paths are real files now: `Read` them with offset/limit)._

### File map (lines / KB) - file names say what is inside

**birth-chart** - 187 files, 29567 lines, 2373 KB
```
index.html                                         609 lines   34 KB
js/01-dev-contact.js                                 7 lines    0 KB
js/02-app-meta-layer.js                             74 lines    4 KB
js/03-ephemeris-engine.js                          280 lines   13 KB
js/04-transit-timing-engine.js                     247 lines   11 KB
js/05-ascendant-nakshatra-vargas.js                211 lines   12 KB
js/06-outer-planet-knowledge.js                     37 lines    5 KB
js/07-planetary-dignity.js                          77 lines    3 KB
js/08-combustion-and-war.js                         30 lines    1 KB
js/09-aspect-events.js                              69 lines    2 KB
js/10-vimshottari-dasha-engine.js                   99 lines    4 KB
js/100-house-now.js                                300 lines   21 KB
js/101-house-now-ui.js                              61 lines    8 KB
js/102-planet-states.js                            451 lines   47 KB
js/103-planet-states-ui.js                          27 lines    3 KB
js/104-reading-style.js                             42 lines    3 KB
js/105-shadbala-reading.js                         454 lines   36 KB
js/106-shadbala-ui.js                               43 lines    5 KB
js/107-ashtakavarga-reading.js                     324 lines   26 KB
js/108-ashtakavarga-ui.js                           50 lines    6 KB
js/109-pdf-download.js                             145 lines    9 KB
js/11-ashtakavarga-engine.js                        32 lines    2 KB
js/111-problem-finder.js                           406 lines   85 KB
js/112-problem-finder-ui.js                         77 lines   10 KB
js/113-date-entry.js                                86 lines    7 KB
js/114-varga-guide.js                              522 lines  113 KB
js/115-compare-lab.js                              224 lines   16 KB
js/116-planet-encyclopedia.js                      350 lines   42 KB
js/117-gulika.js                                    34 lines    3 KB
js/118-choghadiya.js                                65 lines    6 KB
js/119-avakahada.js                                 58 lines    6 KB
js/12-yoga-detection.js                            117 lines    4 KB
js/120-late-panels.js                               39 lines    2 KB
js/121-dosha.js                                     65 lines    7 KB
js/13-chara-karakas.js                              24 lines    1 KB
js/14-shadbala-engine.js                           279 lines   12 KB
js/15-chart-core-compute.js                        161 lines    7 KB
js/16-rectification-engine.js                       36 lines    2 KB
js/17-special-lagnas.js                            404 lines   23 KB
js/18-ui-location-profiles.js                      124 lines    5 KB
js/19-planets-panel.js                             236 lines   17 KB
js/20-rectification-scan-tab.js                    302 lines   15 KB
js/21-transit-timer-tab.js                         101 lines    4 KB
js/22-sandhi-table-tab.js                           69 lines    3 KB
js/23-varga-timeline-tab.js                         79 lines    3 KB
js/24-profile-backup.js                             80 lines    4 KB
js/25-home-and-tabs.js                             126 lines   13 KB
js/26-rectification-studio.js                      246 lines   14 KB
js/27-date-finder-core.js                           50 lines    3 KB
js/28-date-finder-engine.js                        186 lines   11 KB
js/29-date-finder-ui.js                            191 lines   18 KB
js/30-life-event-checker.js                        160 lines   10 KB
js/31-smart-search.js                              190 lines   16 KB
js/32-ask-ai.js                                    317 lines   39 KB
js/33-quick-search.js                               99 lines    4 KB
js/34-relationships-tab.js                         211 lines    8 KB
js/35-form-submit-compute-render.js                 55 lines    2 KB
js/36-render-helpers.js                             43 lines    2 KB
js/37-dasha-check-date.js                           30 lines    1 KB
js/38-dasha-navigator.js                           188 lines   13 KB
js/39-yogas.js                                      67 lines    4 KB
js/40-shadbala.js                                   55 lines    3 KB
js/41-ashtakavarga-section.js                       35 lines    5 KB
js/42-relationships-section.js                      21 lines    1 KB
js/43-full-report-text.js                          268 lines   14 KB
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
js/54-vedic-birthday-ui.js                         156 lines   13 KB
js/55-numerology-engine.js                          54 lines    9 KB
js/56-numerology-ui.js                             126 lines   13 KB
js/57-my-chart-overview.js                         100 lines    6 KB
js/58-render-results.js                            761 lines   35 KB
js/59-live-transit-form.js                         150 lines    7 KB
js/60-interactive-varga-svg.js                     163 lines    7 KB
js/61-varga-chart-svg.js                            71 lines   13 KB
js/62-clipboard-download-helpers.js                121 lines    4 KB
js/63-profile-cards.js                              32 lines    2 KB
js/64-edit-saved-profile.js                         32 lines    2 KB
js/65-error-boundaries.js                           32 lines    1 KB
js/66-modal-accessibility.js                        23 lines    1 KB
js/67-friendly-input-page.js                       107 lines    9 KB
js/68-intake-progress.js                            65 lines    3 KB
js/69-divisional-areas.js                          132 lines   22 KB
js/70-chart-reading.js                              76 lines   17 KB
js/71-life-activation.js                            50 lines    9 KB
js/72-bhava-bala.js                                 47 lines    7 KB
js/73-tithi-pravesh.js                              64 lines   15 KB
js/74-sahams.js                                     67 lines   15 KB
js/75-fate-meter.js                                 76 lines   20 KB
js/76-share-link-qr.js                             129 lines   10 KB
js/77-cloud-account.js                             142 lines   14 KB
js/78-dasha-systems-core.js                        244 lines   11 KB
js/79-dasha-systems-nakshatra.js                   150 lines    9 KB
js/80-dasha-systems-rasi.js                        149 lines    8 KB
js/81-dasha-systems-ayur-special.js                146 lines    7 KB
js/82-dasha-systems-ui.js                          200 lines   14 KB
js/83-ui-overhaul.js                                68 lines    5 KB
js/84-bridge-3d.js                                  38 lines    2 KB
js/85-popular-charts-data.js                       116 lines   26 KB
js/86-popular-charts.js                            120 lines    7 KB
js/87-vedic-knowledge-db.js                       2269 lines  202 KB
js/88-deep-reading.js                              262 lines   31 KB
js/89-vedic-nakshatra-db.js                       1187 lines   38 KB
js/90-reading-manifest.js                          527 lines   26 KB
js/90-year-timeline-engine.js                      265 lines   15 KB
js/91-dasha-reading.js                             274 lines   14 KB
js/91-year-timeline-writer.js                      190 lines   18 KB
js/92-year-timeline-ui.js                           57 lines    4 KB
js/92-yoga-engine.js                              1379 lines   63 KB
js/93-dasha-time-finder.js                         163 lines   10 KB
js/93-pdf-report.js                                405 lines   57 KB
js/94-life-areas.js                                416 lines   16 KB
js/95-life-narratives.js                           331 lines   21 KB
js/96-varga-reading.js                             189 lines   11 KB
js/97-life-event-catalog.js                        451 lines   43 KB
js/97-transit-reading.js                           224 lines   17 KB
js/98-life-event-engine.js                         421 lines   39 KB
js/98-pdf-pages.js                                 176 lines   32 KB
js/99-area-deep.js                                 268 lines   37 KB
js/99-dasha-lens.js                                324 lines   36 KB
js/99-jump-3d-bridge.js                             37 lines    2 KB
css/01-premium-tokens-reset.css                     85 lines    2 KB
css/02-header.css                                   55 lines    3 KB
css/03-hero-intake-form.css                         78 lines    4 KB
css/04-app-tab-navigation.css                       50 lines    2 KB
css/05-results-sections.css                        970 lines   59 KB
css/06-quick-search.css                             61 lines    3 KB
css/07-ai-jyotish-chatbot.css                      297 lines   13 KB
css/08-responsive.css                               71 lines    3 KB
css/09-home-launcher.css                            35 lines    2 KB
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
css/27-d-chart-explorer.css                         80 lines    8 KB
css/28-drishti-explorer.css                         31 lines    3 KB
css/29-special-lagnas.css                           63 lines    9 KB
css/30-ashtakavarga.css                             99 lines   16 KB
css/31-rectification-studio.css                    183 lines   19 KB
css/32-date-finder.css                              60 lines    7 KB
css/33-friendly-input-page.css                      47 lines    4 KB
css/34-smart-search.css                             30 lines    3 KB
css/35-dasha-systems.css                            96 lines    8 KB
css/36-ui-overhaul.css                             126 lines   11 KB
css/37-d-chart-overview.css                         76 lines    6 KB
css/38-popular-charts.css                           35 lines    4 KB
css/39-deep-reading.css                             47 lines    5 KB
css/40-pdf-studio.css                                4 lines    0 KB
css/40-year-timeline.css                             8 lines    0 KB
css/41-dasha-time-finder.css                        63 lines    5 KB
css/42-life-event-pro.css                          193 lines   22 KB
css/43-house-now.css                                 8 lines    1 KB
css/44-dasha-lens.css                              124 lines   15 KB
css/44-reading-style.css                            47 lines    6 KB
css/45-shadbala-reading.css                         11 lines    2 KB
css/46-ashtakavarga-reading.css                     10 lines    2 KB
css/47-pdf-download.css                              7 lines    1 KB
css/48-reading-polish.css                           84 lines    8 KB
css/49-intake-polish.css                           102 lines   12 KB
css/50-home-polish.css                              52 lines    7 KB
css/51-problem-finder.css                           66 lines    9 KB
css/52-date-entry.css                               13 lines    1 KB
css/53-varga-guide.css                              32 lines    2 KB
css/54-compare-lab.css                              63 lines    7 KB
css/55-planet-encyclopedia.css                      89 lines    7 KB
css/56-choghadiya-avakahada.css                     42 lines    4 KB
```

**developer** - 4 files, 183 lines, 13 KB
```
index.html                                          43 lines    3 KB
js/01-dev-card.js                                   12 lines    0 KB
css/01-base.css                                     62 lines    2 KB
css/02-developer-card.css                           66 lines    8 KB
```

**notepad** - 3 files, 592 lines, 100 KB
```
index.html                                          50 lines    2 KB
js/01-notepad.js                                   351 lines   71 KB
css/01-notepad.css                                 191 lines   27 KB
```

**sky3d** - 79 files, 7390 lines, 442 KB
```
index.html                                         468 lines   29 KB
js/01-astro-engine.js                              157 lines    9 KB
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
js/18-rising-sign-timeline.js                      109 lines    8 KB
js/19-hud-render.js                                 63 lines    2 KB
js/20-transit-conjunction-scanner.js               152 lines    6 KB
js/21-natal-profile.js                              50 lines    2 KB
js/22-chart-tab.js                                  38 lines    1 KB
js/23-north-indian-wheel.js                         78 lines    4 KB
js/24-sign-selector.js                              83 lines    4 KB
js/25-rich-sign-detail.js                           95 lines    7 KB
js/26-sign-aspects.js                              103 lines    4 KB
js/27-aspect-explorer-ui.js                        159 lines    7 KB
js/28-planet-detail-popup.js                       149 lines    6 KB
js/29-planet-detail-content.js                     145 lines   18 KB
js/30-outer-planet-knowledge.js                     38 lines    5 KB
js/31-outer-planet-popup.js                        100 lines    8 KB
js/32-aspect-explorer-popup.js                      74 lines    4 KB
js/33-timeline-scrubber.js                          58 lines    2 KB
js/34-main-refresh-loop.js                          60 lines    2 KB
js/35-ui-wiring.js                                  21 lines    1 KB
js/36-mobile-bottom-sheet.js                        90 lines    4 KB
js/37-natal-form-location.js                       118 lines    7 KB
js/38-data-export-wiring.js                        124 lines    4 KB
js/39-smoothness.js                                 51 lines    3 KB
js/40-3d-astro-layers.js                           145 lines   11 KB
js/41-quick-planet-picker.js                        47 lines    3 KB
js/42-init.js                                       24 lines    0 KB
js/43-degree-finder-returns.js                     211 lines   13 KB
js/44-retrograde-planner.js                         41 lines    7 KB
js/45-vimshottari-dasha.js                          60 lines    2 KB
js/46-dasha-transit-engine.js                      319 lines   21 KB
js/47-dasha-transit-ui.js                          145 lines   10 KB
js/48-profile-bridge.js                             48 lines    2 KB
js/49-time-machine.js                              189 lines   15 KB
js/50-sky-dashboard.js                             295 lines   26 KB
js/51-jump-from-rectification.js                    33 lines    2 KB
js/52-gulika.js                                     53 lines    4 KB
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
css/13-tablet.css                                  120 lines    7 KB
css/14-structure-visual-layer.css                   54 lines    4 KB
css/15-smoothness.css                               36 lines    3 KB
css/16-astro-layers.css                             52 lines    6 KB
css/17-polish-rest-of-app.css                       27 lines    3 KB
css/18-planet-picker.css                            40 lines    3 KB
css/19-retrograde-planner.css                       35 lines    4 KB
css/20-hud-ascendant-rising.css                     56 lines    4 KB
css/21-premium-polish.css                           32 lines    3 KB
css/22-dasha-transit-triggers.css                   31 lines    3 KB
css/23-time-machine-polish.css                     126 lines   12 KB
css/24-sky-dashboard.css                            92 lines    8 KB
css/25-date-entry.css                                8 lines    0 KB
css/25-solid-panels.css                             32 lines    4 KB
```

**shell** - 5 files, 595 lines, 67 KB
```
index.html                                           2 lines    2 KB
shell/css/shell.css                                110 lines   11 KB
shell/js/locpicker.js                              202 lines   34 KB
shell/js/shell.js                                  248 lines   18 KB
shell/js/updater.js                                 33 lines    2 KB
```

**shared** - 7 files, 1157 lines, 87 KB
```
shared/copy-toggle.js                               28 lines    1 KB
shared/export-addon.js                             643 lines   47 KB
shared/icons.js                                    169 lines   17 KB
shared/liquid-glass.css                             46 lines    5 KB
shared/liquid-glass.js                              16 lines    0 KB
shared/meta.css                                     98 lines    5 KB
shared/quick-menu.js                               157 lines   12 KB
```
<!-- AUTO:END -->
- Door v2 (login→Razorpay pay→app + local admin): see docs/DOOR.md and ../door-site/. Customer edition is DERIVED by tools/build_customer.py (editions/customer/customer-layer.js, customer_top.js); originals untouched. Old gate/ (encrypted blob) is superseded.
- D-chart info redesigned as one 'At a glance' dashboard (js/69 overview(), css/37).
- D-chart tabs: no jump on switch (fade only, scroll+height locked), touch-friendly, hover motion only on mouse devices.
- Divisional Charts: all hover/tap lift, slide animations and page-scrolling rail removed so nothing jumps on tap.
- Loader fix (shell/js/shell.js): per-view ready state so the loader hides whenever the current view is ready (switching views mid-load no longer leaves it stuck); starts on DOMContentLoaded not frame load (slow fonts/images no longer hold it); after 10 s shows a "Taking long? Tap to reload" button; shorter waits (6 s / 3 s). Google Fonts links in birth-chart, sky3d, developer are non-blocking (media=print swap).
- 3D Sky phone controls: new "Hide controls" eye button (`#clearViewBtn`, right column; css/13-tablet.css mobile block, js/36-mobile-bottom-sheet.js). Hides sub-lines, view switch, time dock and tab strip (thin handle stays; opening the sheet still shows tabs). Remembered in localStorage `vedic3dClean`; short landscape phones start hidden. Desktop unchanged.
- Quick note (shell/js/shell.js, shell/css/shell.css, apps/notepad/js/01-notepad.js `vedicQuickAdd`): long-press (or right-click) the Notepad item in the switcher menu opens a small draggable note window over any view; Save adds a note ("quick note" tag, unfiled; chart name in title) to the Notepad data (`vedicNotepad_v1`) via the open app or straight to storage; draft kept in `vedicQuickDraft`. A short tap still opens Notepad.
- Year Timeline Pack: research + plan only (docs/YEAR_TIMELINE_RESEARCH.md). Data-only file for a chosen date range for any AI; no code yet. Next: S1 range scanner.
- Year Timeline File (Birth Chart): js/90-year-timeline-engine.js (scan, facts only) + 91-writer (Markdown) + 92-ui (panel-yeartimeline, Home > Time & Cycles); test tests/year_timeline_test.py; v1 has no Tajika, no auto-split for very long ranges.
- Planet Encyclopedia (Birth Chart): js/116-planet-encyclopedia.js (PEN) + css/55; panel-planetency, Home > Analysis; per-planet nature, aspects, dignities, relations, houses; edit texts in PEN_DATA; test tests/planet_encyclopedia_test.py.
- Gulika (Mandi): birth-chart js/117-gulika.js (computeGulika, GUL; chart.upagraha.Gulika; drawn like outer planets, checkbox .gulika-chk-input; Planets card in 19-planets-panel) + sky3d js/52-gulika.js (GK; ring marker in 40-3d-astro-layers, switch L_gulika, card in 50-sky-dashboard). Default = start of Saturn's part; schools differ. Change both engines. Test tests/gulika_test.py.
- Choghadiya + Avakahada Chakra (Birth Chart): js/118-choghadiya.js (CHG, inside Panchanga panel) and js/119-avakahada.js (AVK, panel-avakahada); tables for Choghadiya are almanac practice, Avakahada tables equal KM_* in js/51; test tests/choghadiya_avakahada_test.py.
- Dosha Check (js/121-dosha.js, DSH; reuses YGE detectors + new Pitru and Gand Mool) and js/120-late-panels.js (registerLatePanel: new panels build on first open so a stale cached js/58 cannot leave a blank screen; use it for every new Home card). Choghadiya got its own panel (js/118). Test tests/dosha_late_panels_test.py.
- Notepad: fixed typing cursor jump, note-link exit, template-from-Tasks, open side menu; new Settings tab (view settings) with switches stored in S.set.o (defaults in OPT_DEF; line copy + card copy OFF); test tests/notepad_test.py.
- Notepad phone: added a menu button (☰) to the note-list header and made the drawer open in focus mode, so every screen has a way back to the menu (not tested).
- Main menu Settings (shell): popup with one switch "Copy buttons" (off by default, key vedicCopyBtns); shared/copy-toggle.js in every app hides/shows buttons whose label starts with "Copy" (not tested).
- 3D Rising view: "Navamsha now" line + tap any of the 12 signs for its 9 Navamshas with start/end to the second (`_navSign`, `_navBounds`, `navDetailHTML`, `risingSel` in sky3d/js/18); test tests/rising_navamsha_test.py.
- Liquid glass UI: shared/liquid-glass.css + .js loaded by shell and all 4 apps (<html data-app="bc|3d|np|dev">); rules only under `html.lg`; switch in main-menu Settings (vedicGlass, default on). To restyle a new card class, add it to the :is(...) list for its app. Copy-toggle now also hides the floating `.vax-fb` button.
- 3D date picker redesigned (sky3d/js/49): five snap-scroll wheels (`W`, `pick`, `place`, `paint`), steppers, year scrub, typed date; test tests/time_wheels_test.py. HUD buttons hide while it is open (`body.tm-open`).
- Glass look redone (shared/liquid-glass.css): calm dark, uniform translucent fills, blur only on bars/menus/popups, gold accents; setting renamed "Glass look".
- 3D Sky Dashboard (top-right ▦): sky3d/js/50-sky-dashboard.js (`DBX`, `analyse`, `build`), css/24-sky-dashboard.css; test tests/sky_dashboard_test.py. Dasha not included yet; no yogas on purpose.
- Session 4: S2b - VMF.role (84 roles by rising sign) and VMF.moonProfile (12), wired into Deep reading + report; S2 complete. Next: S4 Yogas I.
- Session 4 (cont.): S4 yoga engine `js/92-yoga-engine.js` (`YGE.detect(chart)`, 41 yogas, generated by build_yg.py), wired into Deep reading + report, tests/yoga_engine_test.py. Next: S5.
- Session 5: S5 - YGE now 83 yogas/doshas with strength level + dasha timing hint; M2 passed. Next: S6.
- Session 5 (cont.): Deep reading pane() now builds buckets S{intro,you,planets,yogas,doshas,time,houses} -> numbered sections + `.dr-nav` jump bar (css/39). Add new content to a bucket, not to a flat list.
- Session 5 (cont.): PDF Studio `js/93-pdf-report.js` (`PDFR.build/open`) + css/40; add a new reading layer to the PDF by adding a builder to BUILD, an entry to SECTIONS and SUB. Test: tests/pdf_report_test.py.
- Session 6: S6 life-area engine `js/94-life-areas.js` (`LAE.assess`), wired into Deep reading/report/PDF; tests/life_areas_test.py. If you change weights or inputs, re-run the 12-chart calibration (see tests) and update CAL in build_la.py. Next: S7.
- Session 6 (cont.): S7 narratives `js/95-life-narratives.js` (`LAN.all/area`), composed from LAE facts; shown in Deep reading (fold-out), report and PDF. Edit tables in build_ln.py only. Next: S8.
- Session 7: S8 `js/96-varga-reading.js` (`VGR.chart/all`) wired into Deep reading (bucket S.vargas), report and PDF (section 'vargas'); tests/varga_reading_test.py. Next: S9.
- Session 8: S9 `js/97-transit-reading.js` (`TRS.assess`) wired into Deep reading ('transits'), report and PDF; tests/transit_reading_test.py. Edit tables in build_ts.py only. Next: S11 QA.
- Session 9: S11 QA `tests/reading_qa_test.py` (12 charts, invariants, `--sheet` makes docs/ASTROLOGER_REVIEW_SHEET.md). M4 passed. Next: S12 polish.
- Session 9 (cont.): PDF is now a one-click book (`PDFR.generate`, no settings). Core + design in js/93, extra sections in js/98 via `PDFR.reg`. A new section = a builder + `PDFR.reg` + an entry in PARTS (js/93). Beware: never give a CSS class the same name as a status value used on rows (e.g. 'ahead'); keep tables narrower than the page or Chrome shrinks the whole book.
- Session 9 (fix): PDF printed twice (a blank print window first). An iframe fires 'load' for its empty about:blank before srcdoc; `generate()` now sets srcdoc first and prints only when `.cover` is in the frame, once. Test: print count must equal ['book'].
- Session 10: S12 done: PDF brand (`brand()` in js/93 reads window.__VAX_BRAND), disclaimers, budgets in pdf_report_test, docs/RELEASE_CHECKLIST.md. Plan complete.
- Sky Dashboard v2: zodiac-wheel hero + Moon phase, element colours, degree rings, scroll-spy nav, soft one-time fade-in (js/50, css/24).
- Aspect Explorer now uses the time selected in the app even with a profile loaded (`getExplorerContext` in sky3d/js/27; profile only gives the Lagna); test tests/explorer_time_test.py.
- 3D panels made solid (no see-through tab bar), calm motion, gold accent: sky3d/css/25-solid-panels.css (loaded last).
- Divisional chart guide for all 24 charts (D1 to D144 + RTN): birth-chart/js/114-varga-guide.js (`VGG.html/text`), css/53-varga-guide.css, shown as a collapsible block under every D-chart in js/58; rules tagged From the texts / Common practice; test tests/varga_guide_test.py. If calcVarga changes, update the "how this app divides it" lines.
- Divisional chart guide made full (v2): per chart lords from BPHS ch.6, your-chart facts, 12 houses, 9 planets, 5 to 15 tagged rules, combos, states, cross-checks; D30 part-lords and D60 parts per planet; `VGG.html(key, chart)`; test updated.

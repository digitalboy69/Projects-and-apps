# AI_GUIDE.md — read this FIRST (written for AI assistants, not humans)

You are working on the **Vedic Astro Suite**: one HTML file made of 4 embedded apps. The owner is a student on free plans with tiny usage limits and several accounts. **Every token matters.** Follow this file exactly; it tells you where things are so you do not have to explore.

## 0. The 12 rules (token savers)
1. **Never read the built HTML files** (`vedic-astro-suite-*.html`, 1.2–1.7 MB). They are build outputs. Never `cat` or `Read` them.
2. **Never read a whole part.** `parts/srcA.html` is 370 KB, each `srcB_NN.part` ~100 KB. Find the symbol with `grep -P "^name\t" symbols.idx` (gives `file:line`), then `Read` with `offset` and `limit` (40–120 lines).
3. **Never read `symbols.idx` whole** (grep it) and never print the AUTO section map unless you need it.
4. Use **Grep/`grep -n`** inside one part to find strings; do not open several parts "to look around".
5. Edit with the **Edit tool** (exact `old_string`) or a small Python `str.replace` with an `assert count==1`. Do not rewrite whole files, do not re-paste big blocks.
6. Test only what you changed (see section 5). Do not re-run every test after a one-line change; run the one that covers the feature plus the wrapper smoke test.
7. Reply short. The user wants the files, one clear summary, and what could not be tested. No long recaps, no re-listing every step.
8. Do **not** spawn sub-agents or web-search for things already in this file. Do not research astrology formulas again; they are already implemented (see Rules, section 4).
9. Prefer one build at the end (`python3 build.py`), not after every edit.
10. When the task is only data/text (e.g. a new description string), edit the string; do not touch engines.
11. If a request is ambiguous and cheap to redo, make the most reasonable choice and say which one; ask only for expensive or irreversible choices.
12. **Before finishing, update this file** (section 7 changelog) and run `python3 build.py` — it regenerates `symbols.idx` and the AUTO block below by itself.

## 1. Architecture in 10 lines
- Output = `wrapper_template.html` + 4 apps embedded as `<script type="text/plain" id="srcA|srcB|srcN|srcDev">` and mounted into iframes via `srcdoc`. The wrapper also holds the floating switcher, the single loader, the default screen (Birth Chart; `#sky` → 3D, `#notes` → Notepad) and the shared location picker.
- **srcA** = 3D Sky (Three.js r128 from CDN) → `parts/srcA.html`. **srcB** = Birth Chart / Vedic app → `parts/srcB_01..07.part` (consecutive pieces of ONE file; build joins them in name order). **srcN** = Notepad → `parts/srcN.html`. **srcDev** = developer card. **locpicker.js** = shared "Pick location" popup (map + coordinates), lives in the wrapper. **export_addon.js** = Export/Copy add-on, pasted as an inline `<script>` at the end of BOTH srcA.html and srcB (last part), before `</body>`.
- Each app is a single file with inline `<style>` + `<script>`; no modules, no build tools. Plain ES2020.
- `python3 build.py` writes `vedic-astro-suite-readable.html` (main deliverable, plain code) and `vedic-astro-suite-2.html` (base64 copy), then regenerates `symbols.idx` + AUTO block here. `python3 build.py --guide` only regenerates the index (fast).
- Escaping: the plain build writes `</script` as `<\/script` and `<!--` as `<\!--` inside the text/plain blocks and the wrapper's `decode()` reverses it. **Never write a literal `</script` or `<!--` inside JS strings in the parts** — write `<\/script` / `<\!--` or split the string.

## 2. Prompt router — "if the user says X, go to Y"
(Find the exact line with `grep -P "^symbol\t" symbols.idx`.)

| User talks about | App / file | Symbols to start from |
|---|---|---|
| Birth form, place field, profiles, menu | srcB (04–06) | `renderResults`, `computeChart`, form handler in "FORM SUBMIT -> COMPUTE -> RENDER" |
| Planet positions, houses, dignity, combustion | srcB 03 | `computeChart`, `getDignity`, `getCombustion`, `siderealLongitudes` |
| D-charts (D1–D60), chart images (North/South/West) | srcB 03 + 07 | `calcVarga`, `buildNorthIndianSvg`, `buildSouthIndianSvg`, `buildWesternWheelSvg`, `chBadge`, `chOuter`, `updateVargaDisplay` |
| Dasha, Vimshottari | srcB 03 | `calculateVimshottariDasha`, `findActiveDasha` |
| Ashtakavarga | srcB 03 | `computeFullAshtakavarga`, panel `panel-ashtakavarga` |
| Shadbala, Bhava Bala | srcB 03 / 07 | `computeShadbala`, `computeBhavaBala` |
| Fate Meter, Sahams (Tajika), Life Activation, Tithi Pravesh, Chart Reading | srcB 07 | `computeFate`, `buildFatePanel`, `buildSahamPanel`, panels `panel-fate`, `panel-sahams`, `panel-tithi`, `panel-active`, `panel-reading` |
| Panchang, transits, Sade Sati | srcB 05/06 | `panchangaAt`, `computeLiveSky`, "PHASE 1 ENGINES" banner |
| Special lagnas / Arudha | srcB 03 | `buildVargaFromLagna`, `computeAllSpecialLagnaSigns` |
| Home dashboard, tab bar, new panel/tool | srcB 04 | `HOME_ITEMS` (add a row), `switchAppTab`, panels are `html += \`<div class="app-panel" id="panel-X">\`` in `renderResults` |
| Planet popup (Birth Chart) | srcB 04 | `openPlanetDetail`, `openOuterDetail`, `buildPlanetsPanel` |
| Uranus/Neptune/Pluto | srcA + srcB | `OUTER_LIST`, `OUTER_INFO`, `outerAspectsTo`, `planetGeocentricLongitude` (elements in `PLANET_ELEMENTS`), A: `openOuterPlanetDetail`, B: `openOuterDetail`, `chOuter`. They are **not** in `PLANET_LIST` on purpose (no Vedic aspects/yogas/dasha). |
| Export / Copy for AI / JSON | srcB 05 + `export_addon.js` | `buildFullReportText`, `openExportModal`, add-on `window.VAX` |
| 3D planets, zodiac ring, labels, camera | srcA | `initScene`, `buildZodiacRingGroup`, `updateSceneForJD`, `rebuildLabelNodes`, `renderLoop`, `setCamMode` |
| 3D "Solar System" view / scale / real distances | srcA | `SOL`, `solBuild`, `setSceneView`, `solMapPos`, `solRadius`, `solRenderTable`, tab `tab-solar` |
| 3D sky table, planet picker | srcA | `buildSkyTableRows`, `renderSkyTable`, `initPlanetPicker` |
| 3D popups for planets | srcA | `openPlanetDetail` (Vedic planets, `PD` table), `openOuterPlanetDetail` |
| Transits / meetings / returns / retro planner / degree finder (3D) | srcA | sections "TRANSIT + CONJUNCTION SCANNING", "RETROGRADE", returns code; `findIngresses`, `stayEdges` |
| Ephemeris math (Sun, Moon, planets, ayanamsa) | srcA (and copy in srcB 03) | `sunLongitude`, `moonLongitude`, `planetHeliocentric`, `planetGeocentricLongitude`, `lahiriAyanamsa`. The engines are duplicated in A and B — **change both** |
| Notepad / notes / templates / client cards | `parts/srcN.html` (small, ~90 KB; safe to read in chunks) | functions `newNote`, `welcome`, key `vedicNotepad_v1` |
| "Pick location", map, coordinates, Google link | `parts/locpicker.js` | `LocPicker.open`, `LocPicker.attach` (wired in each app next to place fields) |
| Floating switcher, loader, default screen, dev overlay | `wrapper_template.html` (~10 KB, safe to read whole) | |
| Mobile layout / spacing / theme | the `<style>` of that app (grep the class name) | |
| Add-on export UI | `parts/export_addon.js` — **do not edit unless asked**; it is pasted verbatim into A and B | |

Cross-app messages: Notepad → wrapper `postMessage('vedic-open-chart')`; wrapper handles `vedic-dev-close`.

## 3. Token-saving playbook (concrete)
- Locate: `grep -P "^computeFate\t" symbols.idx` → `parts/srcB_07.part:873` → `Read file offset=873 limit=60`.
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
- srcB chart objects: `chart.planets[name]`, `chart.outer[name]`, `chart.vargas[key].planetVargaSign / outerSign / houses`, `chart.ascendant`, `chart.shadbala`, `chart.ashtakavarga.sav`, `chart.dashaData`.
- 3D scene axes: ecliptic longitude θ → `x=r·cosθ, z=-r·sinθ`, y up. Zodiac planets are children of `zodiacRingGroup`; the Solar view uses `SOL.group`. Raycasts ignore `visible`, so click code filters by parent visibility.
- Labels are HTML nodes in `labelNodes`; they hide when `mesh.parent.visible===false`.
- `LocPicker` onPick gives a Nominatim-shaped object `{display_name,lat,lon,address:{country_code},source}`.
- Everything must work on a phone (≥360 px) — test at 390×800 when touching layout.
- Storage: Notepad uses localStorage key `vedicNotepad_v1` (wrap in try/catch). Never store secrets.
- Do not edit `vedic-astro-suite-*.html`; they are generated.

## 5. Build, test, deliver (do exactly this)
1. Edit files in `parts/` (and `wrapper_template.html` if the wrapper changes).
2. `python3 build.py` (≈2 s). It prints `built` and `guide: N symbols`.
3. Syntax check without a browser: extract `<script>` bodies and `node --check` (see `tests/syntax_check.py`).
4. Smoke tests (Playwright, headless): `python3 tests/smoke.py` (wrapper loads, chart casts, export modal, 3D solar view if Three is available). Needs `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` and `executable_path='/opt/pw-browsers/chromium'`.
5. Three.js r128 is blocked on the CDN in the sandbox. Get it once: `git clone --depth 1 --filter=blob:none --sparse --branch r128 https://github.com/mrdoob/three.js tj && cd tj && git sparse-checkout set build` → `build/three.min.js`, then route `**/three.min.js` to it (see `tests/smoke.py`, env `THREE_JS=/path/three.min.js`). WebGL flags: `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`. Without it, 3D can only be syntax-tested — say so honestly.
6. Test a feature in the Birth Chart: fill `#profileName`, `#dobInput`, time input, pick a place (or set coordinates), click `#castBtn`, wait ~5 s, then `switchAppTab('panel-…')`. Chart objects are `currentChartForModal` / `currentProfileForExport`.
7. Deliver (the user prefers files, short reply): copy the two HTML files + `vedic-project.zip` (zip of this folder without the HTML) to the outputs folder and `SendUserFile` them. The **readable** HTML is the main file.
8. Git: from the repo root `git add -A && git commit -m "<what>" && git push` (follow any attribution lines the environment gives). The hook below keeps this file fresh.

## 6. Keeping this file alive (automatic)
- `python3 build.py` rewrites the AUTO block + `symbols.idx` every time.
- A git hook does the same on every commit: run **once per clone** `sh install-hooks.sh` (sets `core.hooksPath=.githooks`). The pre-commit hook runs `python3 build.py --guide` and stages `AI_GUIDE.md` + `symbols.idx`, so they can never go stale.
- Hand-written parts (sections 0–5, 7) only change when behaviour or workflow changes. **After every task add one line to section 7** and, if you added a new feature, one row to the router table in section 2.

## 7. State & changelog (newest last; keep ≤ 25 lines, merge old ones)
- Done: 3D sky (degree finder, returns, retrograde planner), D-charts + images (North/South/Western wheel), aspects, special lagnas, Home dashboard, Ashtakavarga, Chart Reading, Life Activation, Bhava Bala, Tithi Pravesh, 36 Tajika sahams, Fate Meter (Ashtakavarga + transits), Notepad (Jyotish Notebook), LocPicker everywhere, Export/Copy add-on, Uranus/Neptune/Pluto (3D + charts + popups + Western aspects + report), 3D Solar System view (Easy fit / True scale, Solar tab).
- Open ideas: Kama saham (needs verifiable formula), PDF client report, remedies, link Fate Meter/Sahams into Chart Reading, outer planets in matchmaking/transit-timing tabs.
- Known limits: Standish elements degrade outside 1800–2050; 3D can't be browser-tested without a local Three r128; Pluto/Uranus/Neptune have no dasha/shadbala by design.

---

## 8. Auto-generated map (do not edit)
<!-- AUTO:START (rewritten by build.py on every build; do not edit by hand) -->
_Generated 2026-10-10 - 973 symbols in `symbols.idx`._

### File sizes (read only what you need)
| App | Lines | KB | Files |
|---|---|---|---|
| srcA | 6025 | 369 | srcA.html |
| srcB | 11132 | 800 | srcB_01.part, srcB_02.part, srcB_03.part, srcB_04.part, srcB_05.part, srcB_06.part, srcB_07.part |
| srcN | 530 | 93 | srcN.html |
| srcDev | 151 | 12 | srcDev.html |
| locpicker | 202 | 34 | locpicker.js |
| export_addon | 647 | 47 | export_addon.js |

### Section map (banner titles, logical line numbers - use `Read` with offset/limit)
**srcB**
PREMIUM TOKENS & RESET @srcB_01.part:16; HEADER @srcB_01.part:99; HERO & INTAKE FORM @srcB_01.part:153; APP TAB NAVIGATION (Responsive iOS-style bottom bar on mobile) @srcB_01.part:230; RESULTS SECTIONS @srcB_01.part:277; QUICK SEARCH (click-any-placement Google lookup) @srcB_01.part:1244; PREMIUM FULL-SCREEN AI JYOTISH CHATBOT STYLES @srcB_01.part:1304; RESPONSIVE @srcB_02.part:9; META LAYER — global design tokens, accessibility, polish, print @srcB_02.part:464; APP META LAYER · v2.0.0 @srcB_02.part:1538; ENGINE (embedded) — Sidereal Lahiri Vedic calculations @srcB_03.part:19; DIVISIONAL TRANSIT TIMING ENGINE @srcB_03.part:182; BIRTH TIME RECTIFICATION — lightweight per-second Ascendant D60 scan. @srcB_03.part:1529; SPECIAL LAGNAS (UDAYA, ARUDHA PADAS, HORA, GHATI, INDU, SHREE, ETC.) @srcB_03.part:1566; UI & DOM LOGIC @srcB_04.part:364; BIRTH TIME RECTIFICATION — full-screen tab panel (rewired on every render, @srcB_04.part:709; TRANSIT TIMER TAB @srcB_04.part:979; SANDHI TABLE TAB @srcB_04.part:1078; VARGA TIMELINE TAB — anchored to the BIRTH TIME, not live "now" @srcB_04.part:1145; EXPORT IMPORT ALL PROFILES (backup & restore via copy-paste) @srcB_04.part:1223; APP TAB SWITCHING @srcB_04.part:1302; QUICK SEARCH — click any placement in the chart to Google it @srcB_04.part:1402; RELATIONSHIPS TAB @srcB_04.part:1500; FORM SUBMIT -> COMPUTE -> RENDER @srcB_05.part:117; RENDERING @srcB_05.part:201; PHASE 1 ENGINES — Panchanga · Transits & Sade Sati · Bhava Chalit (Sripati) @srcB_05.part:1078; PHASE 1 UI — Panchanga · Transits & Sade Sati · Bhava Chalit @srcB_05.part:1254; KUNDALI MATCHING — Ashtakoota (36 gunas) + Manglik + bonus checks @srcB_05.part:1455; VEDIC BIRTHDAY ENGINE — Tithi birthday · Nakshatra birthday · Solar return @srcB_06.part:136; NUMEROLOGY — Name number (Chaldean Pythagorean) + Date-of-birth numbers + Lo Shu grid @srcB_06.part:362; SPECIAL LAGNAS TAB LOGIC @srcB_06.part:1173; PLANETARY ASPECTS (DRISHTI) FOR ANY DIVISIONAL CHART @srcB_06.part:1547; VEDIC ASTRO SUITE — EXPORT + COPY ADD-ON (v1.0) @srcB_07.part:937; BIRTH CHART APP (B) @srcB_07.part:1133; EXPORT WINDOW REDESIGN (Birth Chart app) - restyles + regroups the existing @srcB_07.part:1239; 3D SKY APP (A) @srcB_07.part:1488

**srcA**
ASTRONOMICAL ENGINE — sidereal (Lahiri), validated against India Independence @srcA.html:1323; ASCENDANT (LAGNA) + HOUSES + GRAHA DRISHTI (VEDIC ASPECTS) @srcA.html:1513; PLANET DETAIL HELPERS — degree-in-sign, nakshatra pada, instantaneous speed, @srcA.html:1642; 3D SCENE — dual mode: Heliocentric solar system Geocentric zodiac wheel @srcA.html:1808; VISUAL ENHANCEMENT: atmospheres, coronas, Saturn rings, orbit tracks, elemental zodiac @srcA.html:2586; SOLAR SYSTEM VIEW — heliocentric, planets at their real positions for the @srcA.html:2823; CAMERA MODE CONTROL (Orbit Focus Planet Free Fly) @srcA.html:3016; LINE VISIBILITY TOGGLES @srcA.html:3065; APP STATE @srcA.html:3189; RENDER: HUD + Sky table @srcA.html:3222; TRANSIT + CONJUNCTION SCANNING (cached, recomputed when jump profile changes) @srcA.html:3281; NATAL PROFILE @srcA.html:3432; CHART TAB — Rasi wheel (houses labeled with sign), house table, graha drishti @srcA.html:3481; SIGN SELECTOR — pick any sign from a dropdown (or tap a wheel cell) to see @srcA.html:3595; RICH SIGN DETAIL @srcA.html:3677; SIGN ASPECTS (Rashi Drishti) — one block per planet, listing every sign it @srcA.html:3771; ASPECT EXPLORER — pick a planet or a sign and see exactly what it aspects @srcA.html:3873; PLANET DETAIL POPUP @srcA.html:4016; RICH PLANET DETAIL @srcA.html:4164; TIMELINE SCRUBBER @srcA.html:4459; MAIN REFRESH LOOP @srcA.html:4516; UI WIRING @srcA.html:4574; DATA EXPORT WIRING @srcA.html:4758; STRUCTURE: numbered accordions + help @srcA.html:4894; 3D ASTRO LAYERS: natal ghosts + transit arcs, live Lagna, houses, conditions, @srcA.html:4931; QUICK PLANET PICKER @srcA.html:5053; INIT @srcA.html:5099; DEGREE FINDER + PLANET RETURNS @srcA.html:5124; VEDIC ASTRO SUITE — EXPORT + COPY ADD-ON (v1.0) @srcA.html:5376; BIRTH CHART APP (B) @srcA.html:5572; EXPORT WINDOW REDESIGN (Birth Chart app) - restyles + regroups the existing @srcA.html:5678; 3D SKY APP (A) @srcA.html:5927

**export_addon**
VEDIC ASTRO SUITE — EXPORT + COPY ADD-ON (v1.0) @export_addon.js:1; BIRTH CHART APP (B) @export_addon.js:197; EXPORT WINDOW REDESIGN (Birth Chart app) - restyles + regroups the existing @export_addon.js:303; 3D SKY APP (A) @export_addon.js:552

<!-- AUTO:END -->

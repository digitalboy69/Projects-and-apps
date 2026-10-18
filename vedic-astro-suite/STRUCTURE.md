# STRUCTURE.md — map of every file, its job and its feature (read this once, then AI_GUIDE.md)

**For AI assistants:** this file lists *every* file in the project with its path, what it does and which feature it belongs to. After reading it you know where everything is. Then use `AI_GUIDE.md` (rules, prompt router) and `grep -P "^symbol\t" symbols.idx` for exact lines.

## MAINTENANCE RULE (must follow)
Whenever you **add, rename, move or delete a file**, or **add/change a feature**, update this file in the same change. A checker (`python3 tools/check_structure.py`, run by `build.py` and the pre-commit hook) fails if a project file is missing from this map or a listed file no longer exists. Keep each line: `` `path` — what it does ``.

## 1. Big picture
- **shell** (`index.html`, `shell/`): loading screen, floating switcher, location picker. Opens each app in an iframe.
- **apps/** four independent apps, each = `index.html` + `css/NN-topic.css` + `js/NN-topic.js` (load order = number order, never renumber).
- **shared/**, **vendor/**: code used by several apps. **editions/**, **gate/**: customer (locked) edition. **tools/**: build scripts. **tests/**: Playwright tests. **dist/**: generated single-file builds (never read, never hand-edit).
- Hosted mode: iframe `src=apps/<name>/index.html`. Single-file mode: app text embedded in `<script type="text/plain" id="srcX">`.

## 2. Features -> where they live
| Feature | App | Files |
|---|---|---|
| Birth chart calculation | birth-chart | `js/03-ephemeris-engine.js`, `js/15-chart-core-compute.js`, `js/35-form-submit-compute-render.js` |
| Dashas | birth-chart | `js/10-…`, `js/37-…`, `js/38-…` |
| 36 Dasha Systems (Vimshottari, Yogini, Chara, Narayana, Kala Chakra …) | birth-chart | `js/78-…` core, `js/79-…` nakshatra, `js/80-…` rasi, `js/81-…` ayur+special, `js/82-…` UI, `css/35-…` |
| Divisional charts / SVG | birth-chart | `js/05-…`, `js/60-…`, `js/61-…` |
| Panchanga / Transits / Bhava | birth-chart | `js/45-…` to `js/50-…`, `js/59-…` |
| Kundali matching, Vedic birthday, numerology | birth-chart | `js/51-…` to `js/56-…` |
| Date Finder | birth-chart | `js/27-…`, `js/28-…`, `js/29-…` |
| Rectification | birth-chart | `js/16-…`, `js/20-…`, `js/26-…` |
| Chart reading, Fate Meter, Sahams, Life Activation, Tithi Pravesh | birth-chart | `js/70-…` to `js/75-…` |
| Export / share / cloud | birth-chart + shared | `js/43-…`, `js/44-…`, `js/76-…`, `js/77-…`, `shared/export-addon.js` |
| 3D scene, planets, camera | sky3d | `js/08-…` to `js/15-…`, `js/40-…` |
| Solar System view | sky3d | `js/12-solar-system-view.js` |
| Rising sign popup + tab | sky3d | `js/18-…`, `js/19-…`, `js/32-…`, `css/20-…`, `css/21-…` |
| App-wide smoothness / responsiveness / feel | all | `shared/meta.css` |
| Icons (emoji -> premium SVG) | all | `shared/icons.js` (+ `.vxi` css in `shared/meta.css`) |
| Notepad | notepad | `js/01-notepad.js` |
| Location picker | shell | `shell/js/locpicker.js` |

## 3. Every file

### Root of vedic-astro-suite/
- `index.html` — shell page (one line, on purpose): loading screen, switcher markup, loads shell.js
- `vedic-astro-suite-readable.html` — redirect stub to index.html (old URL)
- `vedic-astro-suite-2.html` — redirect stub to index.html (old URL)
- `build.py` — shim: runs tools/build.py
- `install-hooks.sh` — installs the git pre-commit hook
- `symbols.idx` — generated symbol -> file:line index (grep only)
- `AI_GUIDE.md` — rules + prompt router for AI (partly auto-generated)
- `CLAUDE.md` — pointer to AI_GUIDE.md and STRUCTURE.md
- `STRUCTURE.md` — this file
- `README.md` — human readme
- `.githooks/pre-commit` — regenerates guide/index and checks this file

### shell/
- `shell/css/shell.css` — loader, switcher, dev overlay styles
- `shell/js/shell.js` — mounts app iframes, loader timing, switcher, dev overlay
- `shell/js/locpicker.js` — map / location picker used by every app (LocPicker)

### apps/birth-chart/ — Birth Chart / Vedic app (the main app)
- `apps/birth-chart/index.html` — markup of this app; lists its css/js in load order
- `apps/birth-chart/js/01-dev-contact.js` — developer contact details used by the dev card
- `apps/birth-chart/js/02-app-meta-layer.js` — app-wide meta layer: version, feature flags, global helpers
- `apps/birth-chart/js/03-ephemeris-engine.js` — ephemeris math: Sun/Moon/planets, ayanamsa, Julian day
- `apps/birth-chart/js/04-transit-timing-engine.js` — finds exact transit / ingress timings
- `apps/birth-chart/js/05-ascendant-nakshatra-vargas.js` — ascendant, nakshatra/pada, divisional (varga) calculation incl. outer planets
- `apps/birth-chart/js/06-outer-planet-knowledge.js` — text knowledge for Uranus/Neptune/Pluto
- `apps/birth-chart/js/07-planetary-dignity.js` — exaltation, debilitation, own sign, dignity tables
- `apps/birth-chart/js/08-combustion-and-war.js` — combustion and planetary war rules
- `apps/birth-chart/js/09-aspect-events.js` — aspect (drishti) events between planets
- `apps/birth-chart/js/10-vimshottari-dasha-engine.js` — Vimshottari dasha engine (5 levels)
- `apps/birth-chart/js/11-ashtakavarga-engine.js` — Ashtakavarga bindu engine
- `apps/birth-chart/js/12-yoga-detection.js` — yoga detection rules
- `apps/birth-chart/js/13-chara-karakas.js` — Jaimini chara karakas
- `apps/birth-chart/js/14-shadbala-engine.js` — Shadbala six-fold strength engine
- `apps/birth-chart/js/15-chart-core-compute.js` — computeChart: main chart calculation (planets, houses, sunrise)
- `apps/birth-chart/js/16-rectification-engine.js` — birth-time rectification scoring engine
- `apps/birth-chart/js/17-special-lagnas.js` — special lagnas and arudha padas
- `apps/birth-chart/js/18-ui-location-profiles.js` — location field + saved profiles UI
- `apps/birth-chart/js/19-planets-panel.js` — Planets panel and planet detail popup
- `apps/birth-chart/js/20-rectification-scan-tab.js` — rectification scan tab
- `apps/birth-chart/js/21-transit-timer-tab.js` — transit timer tab
- `apps/birth-chart/js/22-sandhi-table-tab.js` — sandhi (sign-edge) table tab
- `apps/birth-chart/js/23-varga-timeline-tab.js` — varga timeline tab
- `apps/birth-chart/js/24-profile-backup.js` — backup / restore of saved profiles
- `apps/birth-chart/js/25-home-and-tabs.js` — home dashboard (HOME_ITEMS), tab bar, switchAppTab
- `apps/birth-chart/js/26-rectification-studio.js` — Rectification Studio UI
- `apps/birth-chart/js/27-date-finder-core.js` — Date Finder: clues data, festivals, eclipse helpers
- `apps/birth-chart/js/28-date-finder-engine.js` — Date Finder search engine (dfGen)
- `apps/birth-chart/js/29-date-finder-ui.js` — Date Finder screen
- `apps/birth-chart/js/30-life-event-checker.js` — life-event checker against dashas/transits
- `apps/birth-chart/js/31-smart-search.js` — Smart Search (find any feature by typing)
- `apps/birth-chart/js/32-ask-ai.js` — Ask-AI: question boxes opening Google AI mode
- `apps/birth-chart/js/33-quick-search.js` — quick search bar
- `apps/birth-chart/js/34-relationships-tab.js` — relationships tab
- `apps/birth-chart/js/35-form-submit-compute-render.js` — birth form submit -> compute -> render pipeline
- `apps/birth-chart/js/36-render-helpers.js` — shared render helpers (tables, chips, cards)
- `apps/birth-chart/js/37-dasha-check-date.js` — check any date/time in all 5 dasha levels
- `apps/birth-chart/js/38-dasha-navigator.js` — drill-down dasha navigator
- `apps/birth-chart/js/39-yogas.js` — Yogas panel
- `apps/birth-chart/js/40-shadbala.js` — Shadbala panel
- `apps/birth-chart/js/41-ashtakavarga-section.js` — Ashtakavarga panel
- `apps/birth-chart/js/42-relationships-section.js` — relationships section content
- `apps/birth-chart/js/43-full-report-text.js` — buildFullReportText: full text report / Copy for AI
- `apps/birth-chart/js/44-export-modal.js` — export modal (copy, JSON, download)
- `apps/birth-chart/js/45-panchanga-engine.js` — Panchanga engine (tithi, nakshatra, yoga, karana, vara)
- `apps/birth-chart/js/46-transit-stays-engine.js` — sign-stay timeline, Sade Sati and Dhaiya
- `apps/birth-chart/js/47-bhava-chalit-engine.js` — Bhava Chalit (Sripati) engine
- `apps/birth-chart/js/48-panchanga-panel.js` — Panchanga panel
- `apps/birth-chart/js/49-transits-panel.js` — Transits and Sade Sati panel
- `apps/birth-chart/js/50-bhava-chalit-panel.js` — Bhava Chalit panel
- `apps/birth-chart/js/51-kundali-matching-engine.js` — Kundali matching (Ashtakoota) engine
- `apps/birth-chart/js/52-kundali-matching-ui.js` — Kundali matching screen
- `apps/birth-chart/js/53-vedic-birthday-engine.js` — Vedic (tithi) birthday engine
- `apps/birth-chart/js/54-vedic-birthday-ui.js` — Vedic birthday screen
- `apps/birth-chart/js/55-numerology-engine.js` — numerology engine
- `apps/birth-chart/js/56-numerology-ui.js` — numerology screen
- `apps/birth-chart/js/57-my-chart-overview.js` — My Chart / Overview panel
- `apps/birth-chart/js/58-render-results.js` — renderResults: builds all result panels
- `apps/birth-chart/js/59-live-transit-form.js` — live transit form (computeLiveSky)
- `apps/birth-chart/js/60-interactive-varga-svg.js` — interactive D-chart explorer
- `apps/birth-chart/js/61-varga-chart-svg.js` — North/South/West chart SVG drawing
- `apps/birth-chart/js/62-clipboard-download-helpers.js` — clipboard copy and file download helpers
- `apps/birth-chart/js/63-profile-cards.js` — saved profile cards in the menu
- `apps/birth-chart/js/64-edit-saved-profile.js` — edit a saved profile name/date/time
- `apps/birth-chart/js/65-error-boundaries.js` — error boundaries around every panel builder
- `apps/birth-chart/js/66-modal-accessibility.js` — keyboard, scroll-lock and a11y for modals
- `apps/birth-chart/js/67-friendly-input-page.js` — friendly input page (dropdown date/time, guesses)
- `apps/birth-chart/js/68-intake-progress.js` — intake progress and welcome-back chips
- `apps/birth-chart/js/69-divisional-areas.js` — divisional chart area helpers
- `apps/birth-chart/js/70-chart-reading.js` — plain-language chart reading engine
- `apps/birth-chart/js/71-life-activation.js` — Life Activation: houses lit on any date
- `apps/birth-chart/js/72-bhava-bala.js` — Bhava Bala house strength
- `apps/birth-chart/js/73-tithi-pravesh.js` — Tithi Pravesh yearly chart
- `apps/birth-chart/js/74-sahams.js` — Sahams (36 Tajika sensitive points)
- `apps/birth-chart/js/75-fate-meter.js` — Fate Meter
- `apps/birth-chart/js/76-share-link-qr.js` — share chart by link / QR (data in URL hash)
- `apps/birth-chart/js/77-cloud-account.js` — cloud sign-in and profile sync (Supabase REST)
- `apps/birth-chart/js/78-dasha-systems-core.js` — 36 Dasha Systems: helpers (sign strength, rashi drishti, padakrama, durations), registry `DashaSys.register`, layout engine (`compute`, `children`, `active`)
- `apps/birth-chart/js/79-dasha-systems-nakshatra.js` — 36 Dasha Systems: 12 nakshatra systems (Vimshottari, Ashtottari, Kala Chakra, Yogini + 8 conditional: Shodasottari, Shattrimsa Sama, Dwadasottari, Dwisaptati Sama, Sataabdika, Chaturaseeti Sama, Shashtihayani, Panchottari)
- `apps/birth-chart/js/80-dasha-systems-rasi.js` — 36 Dasha Systems: 14 phalita rasi systems (Chara Parasara/K.N. Rao/Iranganti 1 & 2, Narayana, Sudasa, Drig, Trikona, Lagnamsaka, Yogardha, Kendradi, Padanadhamsa, Paryaya, Moola)
- `apps/birth-chart/js/81-dasha-systems-ayur-special.js` — 36 Dasha Systems: 5 Ayur (Sthira, Shoola, Niryana Shoola, Mandooka, Brahma) + 5 Special (Varnada, Navamsa, Sandhya, Chakra, Tara Lagna)
- `apps/birth-chart/js/82-dasha-systems-ui.js` — 36 Dasha Systems panel `buildDashaSystemsPanel` (7 groups → side-by-side compare of each group's systems → per-system running-now ladder + level-by-level drill-down with start/end of every period; gender + sub-period toggles; conditional dashas sorted by whether the chart qualifies)
- `apps/birth-chart/js/83-ui-overhaul.js` — UI overhaul glue: floating profile button (input page), search pill label, avatar initial, profile sheet hero (rising/moon/sun/star)
- `apps/birth-chart/js/84-bridge-3d.js` — "View this chart in 3D" button: stores the open chart (all vargas) under `vax_bridge_3d` and asks the shell to open 3D Sky
- `apps/birth-chart/js/85-popular-charts-data.js` — Popular charts data: 100 public figures (10 groups x 10), birth date/place/tz, Lahiri Sun/Moon/nakshatra/rising, Wikipedia titles; add a person = append a row
- `apps/birth-chart/js/86-popular-charts.js` — Popular charts UI under the 3-step form on the input page: group chips, photo cards (Wikipedia, lazy), detail sheet, "Show this chart" casts it via loadProfileIntoForm + submit
- `apps/birth-chart/js/87-vedic-knowledge-db.js` — Vedic Knowledge Database (VDB): 625 entries — planet-in-house 108, planet-in-sign 108, house-lord-in-house 144, planet-aspect-on-house 108, planet-aspects-planet 72, conjunctions 35, 27 nakshatras, 23 yogas, dasha lords, status modifiers, functional nature by rising sign; lookup API + `VDB.reading(chart)`
- `apps/birth-chart/js/88-deep-reading.js` — Deep reading (window.VDR): the "📖 Deep reading" tab (rising, Moon, functional nature, conjunctions, 12 house cards), extra block in each Planets-tab card, dasha-lord text in the Now tab, and the DEEP READING section of the full report; all text from VDB
- `apps/birth-chart/css/01-premium-tokens-reset.css` — design tokens (colors, fonts) and reset
- `apps/birth-chart/css/02-header.css` — header
- `apps/birth-chart/css/03-hero-intake-form.css` — hero and birth intake form
- `apps/birth-chart/css/04-app-tab-navigation.css` — tab navigation
- `apps/birth-chart/css/05-results-sections.css` — result sections, cards, tables, loading overlay
- `apps/birth-chart/css/06-quick-search.css` — quick search
- `apps/birth-chart/css/07-ai-jyotish-chatbot.css` — AI Jyotish chat styles
- `apps/birth-chart/css/08-responsive.css` — responsive / mobile rules
- `apps/birth-chart/css/09-home-launcher.css` — home launcher grid
- `apps/birth-chart/css/10-dasha-redesign.css` — dasha panel
- `apps/birth-chart/css/11-yogas-shadbala-redesign.css` — yogas + shadbala panels
- `apps/birth-chart/css/12-export-and-profiles.css` — export modal + profiles
- `apps/birth-chart/css/13-ui-polish-layer.css` — polish layer (glass, motion)
- `apps/birth-chart/css/14-share-qr.css` — share / QR UI
- `apps/birth-chart/css/15-search-ui.css` — search UI
- `apps/birth-chart/css/16-cloud-account-ui.css` — cloud account UI
- `apps/birth-chart/css/17-my-chart-redesign.css` — My Chart panel
- `apps/birth-chart/css/18-intake-redesign.css` — intake form redesign
- `apps/birth-chart/css/19-planets-popup-redesign.css` — planets panel + popup
- `apps/birth-chart/css/20-meta-layer.css` — meta layer (errors, modals)
- `apps/birth-chart/css/21-panchanga-transits-bhava.css` — Panchanga, Transits, Bhava panels
- `apps/birth-chart/css/22-kundali-matching.css` — Kundali matching
- `apps/birth-chart/css/23-vedic-birthday.css` — Vedic birthday
- `apps/birth-chart/css/24-dasha-navigator.css` — dasha navigator
- `apps/birth-chart/css/25-vedic-birthday-hero.css` — Vedic birthday hero
- `apps/birth-chart/css/26-developer-card.css` — developer card
- `apps/birth-chart/css/27-d-chart-explorer.css` — D-chart explorer
- `apps/birth-chart/css/28-drishti-explorer.css` — Drishti explorer
- `apps/birth-chart/css/29-special-lagnas.css` — special lagnas
- `apps/birth-chart/css/30-ashtakavarga.css` — ashtakavarga
- `apps/birth-chart/css/31-rectification-studio.css` — Rectification Studio
- `apps/birth-chart/css/32-date-finder.css` — Date Finder
- `apps/birth-chart/css/33-friendly-input-page.css` — friendly input page
- `apps/birth-chart/css/34-smart-search.css` — Smart Search
- `apps/birth-chart/css/35-dasha-systems.css` — 36 Dasha Systems panel styles (`ds-*`)
- `apps/birth-chart/css/36-ui-overhaul.css` — UI overhaul: clean full-screen input page, search-first header, segmented tile Home, profile sheet
- `apps/birth-chart/css/37-d-chart-overview.css` — Divisional charts "At a glance" dashboard (hero, planet table, 12-house grid, balance bars, highlights)
- `apps/birth-chart/css/38-popular-charts.css` — Popular charts section + detail sheet styles
- `apps/birth-chart/css/39-deep-reading.css` — Deep reading lines (dr-l) and small text in notes/cards

### apps/sky3d/ — 3D Sky (Three.js r128 from CDN)
- `apps/sky3d/index.html` — markup of this app; lists its css/js in load order
- `apps/sky3d/js/01-astro-engine.js` — core astronomy engine (Sun, Moon, planets, ayanamsa)
- `apps/sky3d/js/02-planetary-dignity.js` — dignity tables incl. outer planets
- `apps/sky3d/js/03-ascendant-houses-drishti.js` — ascendant, houses, drishti
- `apps/sky3d/js/04-sign-level-aspects.js` — sign-level aspects
- `apps/sky3d/js/05-aspect-resolver.js` — aspect resolver
- `apps/sky3d/js/06-planet-detail-helpers.js` — transit/conjunction scanning, retrogrades, returns helpers (findIngresses...)
- `apps/sky3d/js/07-position-snapshot.js` — full position snapshot at a Julian day
- `apps/sky3d/js/08-scene-setup-and-camera.js` — Three.js scene, camera modes, zodiac ring
- `apps/sky3d/js/09-free-fly-joystick.js` — mobile free-fly joystick
- `apps/sky3d/js/10-procedural-textures.js` — procedural planet textures
- `apps/sky3d/js/11-planet-visuals.js` — planet meshes and visuals
- `apps/sky3d/js/12-solar-system-view.js` — Solar System view (SOL, setSceneView, real distances)
- `apps/sky3d/js/13-camera-mode-control.js` — camera mode control (orbit/focus/free)
- `apps/sky3d/js/14-line-visibility-toggles.js` — line visibility toggles
- `apps/sky3d/js/15-planet-labels.js` — 3D planet labels
- `apps/sky3d/js/16-app-state.js` — global app state
- `apps/sky3d/js/17-render-sky-table.js` — sky table renderer
- `apps/sky3d/js/18-rising-sign-timeline.js` — rising-sign timings (long-press popup + Rising tab)
- `apps/sky3d/js/19-hud-render.js` — HUD (ascendant chip, rising chip) rendering
- `apps/sky3d/js/20-transit-conjunction-scanner.js` — transit/conjunction scanner UI
- `apps/sky3d/js/21-natal-profile.js` — natal profile
- `apps/sky3d/js/22-chart-tab.js` — Chart tab
- `apps/sky3d/js/23-north-indian-wheel.js` — North-Indian diamond wheel (SVG)
- `apps/sky3d/js/24-sign-selector.js` — sign selector dropdown
- `apps/sky3d/js/25-rich-sign-detail.js` — rich sign detail
- `apps/sky3d/js/26-sign-aspects.js` — sign aspects UI
- `apps/sky3d/js/27-aspect-explorer-ui.js` — aspect explorer UI
- `apps/sky3d/js/28-planet-detail-popup.js` — planet detail popup
- `apps/sky3d/js/29-planet-detail-content.js` — planet detail content (PD table)
- `apps/sky3d/js/30-outer-planet-knowledge.js` — outer planet knowledge text
- `apps/sky3d/js/31-outer-planet-popup.js` — Uranus/Neptune/Pluto popup
- `apps/sky3d/js/32-aspect-explorer-popup.js` — aspect explorer popup, long-press + magnetic wiring
- `apps/sky3d/js/33-timeline-scrubber.js` — timeline scrubber
- `apps/sky3d/js/34-main-refresh-loop.js` — main refresh loop
- `apps/sky3d/js/35-ui-wiring.js` — UI event wiring
- `apps/sky3d/js/36-mobile-bottom-sheet.js` — mobile bottom sheet
- `apps/sky3d/js/37-natal-form-location.js` — natal form + location autocomplete
- `apps/sky3d/js/38-data-export-wiring.js` — data export wiring
- `apps/sky3d/js/39-smoothness.js` — smoothness: skip no-op DOM writes
- `apps/sky3d/js/40-3d-astro-layers.js` — 3D astro layers (lines, houses)
- `apps/sky3d/js/41-quick-planet-picker.js` — quick planet picker
- `apps/sky3d/js/42-init.js` — startup / init
- `apps/sky3d/js/43-degree-finder-returns.js` — degree finder and returns
- `apps/sky3d/js/44-retrograde-planner.js` — retrograde planner
- `apps/sky3d/js/45-vimshottari-dasha.js` — Vimshottari dasha engine in Julian Days (VDasha: build timeline, at(jd) -> Maha/Antar/Pratyantar)
- `apps/sky3d/js/46-dasha-transit-engine.js` — Dasha + Transit trigger engine (DTrig): 23 life areas with sourced rules (double transit, Jupiter, Saturn, Saturn+node, node triggers), dasha link per house, dasha-lord activation, window scan
- `apps/sky3d/js/47-dasha-transit-ui.js` — Triggers tab UI: running dashas, live strength per life area, scan windows, why details, tap = jump to date
- `apps/sky3d/js/48-profile-bridge.js` — Profile bridge: all Birth Chart profiles appear in 3D (marked ✦, live), and the chart opened in the main app is auto-selected in 3D
- `apps/sky3d/js/49-time-machine.js` — Time Machine date picker (year slider, hold-to-repeat steps, typed dates, month/day tiles, birth jump) + draggable, zoomable timeline
- `apps/sky3d/css/01-base-tokens.css` — base + design tokens
- `apps/sky3d/css/02-app-shell.css` — app shell (desktop)
- `apps/sky3d/css/03-3d-viewport.css` — 3D viewport
- `apps/sky3d/css/04-side-panel.css` — side panel (glass)
- `apps/sky3d/css/05-timeline-scrubber.css` — timeline scrubber
- `apps/sky3d/css/06-chart-wheel.css` — chart wheel
- `apps/sky3d/css/07-aspect-list.css` — aspect list
- `apps/sky3d/css/08-aspect-explorer.css` — aspect explorer
- `apps/sky3d/css/09-mobile-free-fly-joystick.css` — joystick
- `apps/sky3d/css/10-planet-detail-header.css` — planet detail header
- `apps/sky3d/css/11-sign-selector-dropdown.css` — sign selector
- `apps/sky3d/css/12-polish-layer.css` — polish layer
- `apps/sky3d/css/13-tablet.css` — tablet rules
- `apps/sky3d/css/14-structure-visual-layer.css` — structure + visual layer
- `apps/sky3d/css/15-smoothness.css` — smoothness
- `apps/sky3d/css/16-astro-layers.css` — astro layers
- `apps/sky3d/css/17-polish-rest-of-app.css` — polish rest of app
- `apps/sky3d/css/18-planet-picker.css` — planet picker
- `apps/sky3d/css/19-retrograde-planner.css` — retrograde planner (also hides old loadingMask)
- `apps/sky3d/css/20-hud-ascendant-rising.css` — HUD ascendant/rising chips, popups
- `apps/sky3d/css/21-premium-polish.css` — premium gold glass, magnetic hover
- `apps/sky3d/css/22-dasha-transit-triggers.css` — Triggers tab (dasha + transit) styles
- `apps/sky3d/css/23-time-machine-polish.css` — Time Machine styles + 3D Sky visual polish (top bar, tabs, timeline dock, buttons)

### apps/notepad/ — Notepad
- `apps/notepad/index.html` — markup of this app; lists its css/js in load order
- `apps/notepad/js/01-notepad.js` — notepad: notes, templates, client cards (key vedicNotepad_v1)
- `apps/notepad/css/01-notepad.css` — notepad styles

### apps/developer/ — Developer card overlay
- `apps/developer/index.html` — markup of this app; lists its css/js in load order
- `apps/developer/js/01-dev-card.js` — developer card logic
- `apps/developer/css/01-base.css` — base reset
- `apps/developer/css/02-developer-card.css` — developer card styles

### shared/, vendor/, editions/, gate/
- `shared/meta.css` — META LAYER: one global file for feel (smooth transitions, touch press feedback, gold focus/selection/scrollbars, text wrapping, safe areas, reduced motion). Linked LAST by the shell and every app; all rules are `:where()` zero-specificity so app css always wins. Edit this file for any app-wide smoothness/responsiveness change
- `shared/icons.js` — ICON LIBRARY: premium duotone line SVG icons that automatically replace UI emojis in every app + shell (MutationObserver, original emoji kept as hidden text). To add/change an icon edit `I` (svg) and `M` (emoji map) in this file. Astro glyphs, arrows, ✓ ✕ are intentionally left as text. Styles in `shared/meta.css`
- `shared/export-addon.js` — export add-on UI used by apps (window.VAX); do not edit unless asked
- `vendor/qrlibs.js` — QR code libraries (third party)
- `editions/customer/customer-layer.js` — customer edition behaviour layer
- `editions/customer/customer-top.js` — customer edition top-of-page code
- `gate/index.html` — access gate page for the locked edition
- `gate/get-app.ts` — edge function that serves the locked app

### tools/
- `tools/assemble.py` — shared helpers: inline css/js, build the shell with embedded apps
- `tools/build.py` — python3 build.py: writes dist/*, symbols.idx, AI_GUIDE auto block
- `tools/build_customer.py` — builds dist/customer-edition.html (locked edition)
- `tools/encrypt.py` — encryption helper for the customer edition
- `tools/guide.py` — generates symbols.idx and the AI_GUIDE auto map
- `tools/check_structure.py` — verifies STRUCTURE.md lists every project file

### tests/
- `tests/_helpers.py` — shared Playwright helpers (VAX_TARGET=hosted tests the folder version)
- `tests/smoke.py` — main end-to-end smoke test
- `tests/popular_charts_test.py` — Popular charts section: 10 groups x 10 people, lazy Wikipedia photos (wrong-person guard), detail sheet, casting a chart incl. old-timezone option, no JS errors
- `tests/knowledge_db_test.py` — Knowledge database: completeness, quality gates, cross-check of signs/nakshatras/aspects/dignity against the app tables, `VDB.reading()` on real charts
- `tests/deep_reading_test.py` — Deep reading: 6 tabs, 12 house cards, every on-screen text equals the database text for the chart's real placements, report section + export checkbox, 6 more charts, phone layout
- `tests/customer_smoke.py` — customer edition smoke test
- `tests/datefinder_test.py` — Date Finder test
- `tests/syntax_check.py` — node --check over every js file
- `tests/rising_popup_test.py` — rising popup test
- `tests/rising_lines_test.py` — rising lines test
- `tests/camera_motion_test.py` — camera momentum test

### docs/, dist/
- `docs/DOOR.md` — door / licensing site notes
- `docs/HANDOFF.md` — handoff notes
- `docs/SUPABASE.md` — Supabase cloud-sync notes
- `docs/THIRD_PARTY_LICENSES.md` — third-party licences
- `dist/vedic-astro-suite-readable.html` — GENERATED single-file build (plain code). Never read or hand-edit
- `dist/vedic-astro-suite-2.html` — GENERATED single-file build (base64 apps). Never read or hand-edit

### Repo root (one level above, `projects-and-apps/`)
- `index.html`, `vedic-astro-suite.html`, `vedic-astro-suite-readable.html`, `vedic-astro-suite-2.html` — redirect pages into `vedic-astro-suite/` so every old link works
- `Project_manager_new_virtion.html` — project manager page
- `door-site/` — licensing/door website (see `docs/DOOR.md`, its own README)
- `archive/` — old work, not used
- `README.md`, `.gitignore`, `.nojekyll` — repo basics

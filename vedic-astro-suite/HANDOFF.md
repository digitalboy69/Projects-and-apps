# Vedic Astro Suite - project handoff
One HTML file made of 4 embedded apps: srcA (3D sky, Three.js), srcB (Vedic chart app), srcN (Notepad / Jyotish Notebook, localStorage key vedicNotepad_v1), srcDev (developer card).
Edit the readable files in `parts/`, then run `python3 build.py` to rebuild `vedic-astro-suite-2.html`.
srcB is split into srcB_NN.part files (concatenated in order).

## Where things are
- `computeFate` -> srcB_07.part (line 10262)
- `buildFatePanel` -> srcB_07.part (line 10320)
- `buildSahamPanel` -> srcB_07.part (line 10232)
- `computeBhavaBala` -> srcB_07.part (line 10085)
- `calcVarga` -> srcB_03.part (line 3689)
- `calculateVimshottariDasha` -> srcB_03.part (line 3976)
- `computeFullAshtakavarga` -> srcB_03.part (line 4083)
- `computeVargaAspects` -> srcB_07.part (line 9362)
- `panchangaAt` -> srcB_05.part (line 7372)
- `calcHoraLagnaLongitude` -> srcB_04.part (line 4753)
- `computeChart` -> srcB_03.part (line 4536)
- `computeLiveSky` -> srcB_07.part (line 9260)

## Features done
3D sky (degree finder, planet returns, retrograde planner), D-charts, aspects, special lagnas, Home dashboard, Ashtakavarga, chart images, Chart Reading, Life Activation, Bhava Bala, Tithi Pravesh, 36 Sahams (Tajika Neelakanthi), Fate Meter (6 layers incl. Ashtakavarga + Jupiter/Saturn transits).

Notepad (srcN): rich text editor, notebooks, tags, client cards, 10 templates, astro palette, North/South chart inserter, tasks view, prediction tracker, version history, export md/html/txt/json, PIN lock, themes. Notepad can ask the wrapper to open the Birth Chart via postMessage('vedic-open-chart').

Location picker (parts/locpicker.js, lives in wrapper): LocPicker.open({mode:'map'|'coords',lat,lon,name,title,onPick}) and LocPicker.attach(doc,input,apply,{get,title}). onPick gets a Nominatim-shaped object {display_name,lat,lon,address:{country_code},source}. Wired into: birth form, live transit, export, matchmaking, 3D natal form, Notepad client card. Own tile-map engine (no Leaflet); tiles from OSM/CARTO/Esri; search/reverse via Nominatim. Real Google Maps embed needs a paid API key, so not used.

## Rules
- Sidereal Lahiri; precession fix 1.3969713*T in planetGeocentricLongitude.
- Panels: `html += <div class="app-panel" id="panel-...">` in renderResults; Home items in HOME_ITEMS.
- Do not add sahams without a verifiable formula source (Kama pending).
## Ideas next
Kama (labelled unverified), PDF client report, remedies, link Fate Meter/Sahams into Chart Reading.

- Export/Copy add-on merged (srcA + srcB). Original file kept as parts/export_addon.js. Tested in Birth Chart (modal, 30 sections, full report ~220K chars); 3D side not testable in sandbox (no Three.js CDN).

- Added Uranus/Neptune/Pluto (JPL Standish elements) to 3D wheel + Birth Chart wheels (toggle "Outer planets"); kept out of Vedic aspect/yoga engines (OUTER_LIST, separate from PLANET_LIST).
- 3D: "Solar System" switch (srcA: SOL / solBuild / setSceneView), Easy-fit and True-scale modes, new Solar tab. Tested with Three r128 + swiftshader.

# Vedic Astro Suite

Four small apps behind one floating switcher: **3D Sky**, **Birth Chart** (Vedic charts, rectification, Date Finder, Smart Search, Ask-AI, numerology, matching…), **Notepad** and the **Developer** card.

## Folder map
```
vedic-astro-suite/
├── index.html              Shell: loader, floating switcher, opens the apps in frames
├── shell/
│   ├── css/shell.css       Shell styles
│   └── js/                 shell.js (switcher, loader) · locpicker.js (shared "Pick location" map popup)
├── apps/
│   ├── sky3d/              3D Sky (Three.js r128 from CDN)
│   ├── birth-chart/        Birth Chart / Vedic app
│   ├── notepad/            Jyotish Notebook
│   └── developer/          Developer card overlay
│       each app:  index.html (markup) · css/NN-topic.css · js/NN-topic.js   (files load in number order)
├── shared/export-addon.js  "Copy / Export" add-on used by 3D Sky and Birth Chart
├── vendor/qrlibs.js        QR libraries for share-by-link (see docs/THIRD_PARTY_LICENSES.md)
├── editions/customer/      Layer added only to the customer edition (brand, locked copy)
├── tools/                  build.py · assemble.py · build_customer.py · guide.py · encrypt.py
├── dist/                   GENERATED single-file builds (never edit)
├── tests/                  syntax_check.py · smoke.py · feature tests · _helpers.py
├── docs/                   HANDOFF.md · DOOR.md · SUPABASE.md · THIRD_PARTY_LICENSES.md
├── gate/                   Access gate (encrypted app delivery)
├── AI_GUIDE.md             Instructions + changelog for AI assistants (auto-updated section at the end)
├── symbols.idx             Generated index: function / const / panel id -> file:line
└── build.py                Entry point: `python3 build.py`
```
File names say what is inside (`js/14-shadbala-engine.js`, `css/08-aspect-explorer.css`). The number only sets the load order — **never reorder files**: later files use things defined in earlier ones.

## Run it
| How | Command | Notes |
|---|---|---|
| Folder version (what the website serves) | `python3 -m http.server 8000` then open `http://localhost:8000/` | Needs a web server: browsers block frames from talking to each other on `file://`. Opening `index.html` from disk redirects to the single-file build. |
| Single-file version (offline, double-click) | open `dist/vedic-astro-suite-readable.html` | Made by `python3 build.py`. `dist/vedic-astro-suite-2.html` is the same app base64-encoded. |
| Customer edition | `python3 tools/build_customer.py` → `dist/customer-edition.html` | See `docs/DOOR.md`. |

Hosted on GitHub Pages the folder version loads only the apps you open, and the browser caches every css/js file.

## Work on it
1. Find the file: `grep -P "^computeFate\t" symbols.idx` → `apps/birth-chart/js/75-fate-meter.js:14`, then read just that range.
2. Edit it. Add new CSS/JS as a new numbered file only if it is a new topic; list it in the app's `index.html` in the right place.
3. `python3 build.py` (regenerates `dist/`, `symbols.idx`, AI_GUIDE auto-section).
4. Tests: `python3 tests/syntax_check.py`, then `python3 tests/smoke.py` (add `THREE_JS=/path/to/three.min.js` for 3D checks). `VAX_TARGET=hosted` runs a test against the folder version over a local server instead of the single file.
5. Commit. Run `sh install-hooks.sh` once per clone so the guide and index refresh automatically.

## Is the folder version "protected"?
No — a folder served on the web is as readable as the single file; both are plain JavaScript in the browser. The protection is the access gate and the customer edition (`docs/DOOR.md`), which delivers the app only to paid, signed-in users.

# Projects & Apps

| Folder / file | What it is |
|---|---|
| [`vedic-astro-suite/`](vedic-astro-suite/) | **Vedic Astro Suite**: 3D sky, birth chart, rectification, Smart Search + Ask-AI, notepad, share by link/QR. A structured folder project (single-file builds in `dist/`). |
| `index.html` | Redirects to the live app. |
| `Project_manager_new_virtion.html` | Project manager page. |
| `.nojekyll` | Tells GitHub Pages to serve files as they are. |

## Open the app
Enable GitHub Pages for this repo (branch `main` or `Root`, folder `/ (root)`), then open the Pages URL. It redirects to `vedic-astro-suite/` (the multi-file version). To run it locally use a web server, e.g. `cd vedic-astro-suite && python3 -m http.server 8000`; for offline double-click use `vedic-astro-suite/dist/vedic-astro-suite-readable.html`.

## Working on it (humans & AI)
Start in [`vedic-astro-suite/README.md`](vedic-astro-suite/README.md) (file map) and [`vedic-astro-suite/AI_GUIDE.md`](vedic-astro-suite/AI_GUIDE.md) (where to look for each kind of change, build and test steps).

```
vedic-astro-suite/
├─ index.html          shell: loader, floating switcher, opens the apps
├─ shell/              shell css + js (+ the shared location picker)
├─ apps/               the 4 apps, one folder each: index.html + css/ + js/
│  ├─ sky3d/  birth-chart/  notepad/  developer/
├─ shared/ vendor/     code used by several apps / third-party libs
├─ editions/customer/  extra layer for the paid customer edition
├─ tools/              build + index tools (python3 build.py runs them)
├─ dist/               generated single-file builds (do not edit)
├─ tests/ docs/ gate/  tests, notes, access gate
└─ AI_GUIDE.md, symbols.idx   auto-maintained guide + index
```

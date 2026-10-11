# Projects & Apps

| Folder / file | What it is |
|---|---|
| [`vedic-astro-suite/`](vedic-astro-suite/) | **Vedic Astro Suite**: 3D sky, birth chart, rectification, Smart Search + Ask-AI, notepad, share by link/QR. One HTML file. |
| `index.html` | Redirects to the live app. |
| `Project_manager_new_virtion.html` | Project manager page. |
| `.nojekyll` | Tells GitHub Pages to serve files as they are. |

## Open the app
Enable GitHub Pages for this repo (branch `main` or `Root`, folder `/ (root)`), then open the Pages URL. It redirects to `vedic-astro-suite/vedic-astro-suite-readable.html`.

## Working on it (humans & AI)
Start in [`vedic-astro-suite/README.md`](vedic-astro-suite/README.md) (file map) and [`vedic-astro-suite/AI_GUIDE.md`](vedic-astro-suite/AI_GUIDE.md) (where to look for each kind of change, build and test steps).

```
vedic-astro-suite/
├─ parts/            source of the 4 apps (edit these)
├─ tests/            syntax_check.py, smoke.py
├─ docs/             HANDOFF.md, THIRD_PARTY_LICENSES.md
├─ wrapper_template.html   outer shell
├─ build.py          joins parts into the two HTML outputs
├─ vedic-astro-suite-readable.html / -2.html   built files (do not edit)
└─ AI_GUIDE.md, symbols.idx   auto-maintained guide + index
```

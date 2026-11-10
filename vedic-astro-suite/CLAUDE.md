# Vedic Astro Suite
Read `AI_GUIDE.md` in this folder FIRST (where to look for each request, token-saving rules, build/test/deliver steps). Never read the built `dist/*.html` files; grep `symbols.idx` for the real file:line, then read only that range. After each task: `python3 build.py` and add one line to section 7 of AI_GUIDE.md.

Then read `STRUCTURE.md` (map of every file + feature + path). **Whenever you add, rename, move or delete a file or add a feature, update `STRUCTURE.md` in the same change** (`python3 tools/check_structure.py` enforces it; the pre-commit hook blocks the commit otherwise).

**The owner's working method is in `AI_GUIDE.md` section 0a: plan file, rebase before every step, two-source research, tests plus phone screenshots, wire the tool into HOME_ITEMS + js/120 + the Tools tab (js/147), push live after each backend step, and for visible UI changes show screenshots and wait for approval before pushing. Do exactly like that.**

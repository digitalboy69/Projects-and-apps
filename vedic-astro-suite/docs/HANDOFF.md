# Handoff (short)
Everything an AI needs is in **`AI_GUIDE.md`** (prompt router, token-saving rules, build/test/deliver steps, changelog). Start every new chat with:

> Read AI_GUIDE.md first, then do: [task]. Return the readable HTML + zip, keep the reply short.

Project = a folder project: a shell (`index.html`, `shell/`) + 4 apps (`apps/sky3d`, `apps/birth-chart`, `apps/notepad`, `apps/developer`), each with its own `index.html`, `css/` and `js/` files. Edit the file that holds the feature (find it with `grep -P "^name\t" symbols.idx`), run `python3 build.py` (writes the single-file builds into `dist/`), test with `python3 tests/smoke.py`, commit.

# AI start here (read this first, then docs/FULL_READING_PLAN.md and AI_GUIDE.md)

Start prompt the owner pastes in a new chat:
> Read vedic-astro-suite/docs/AI_START_HERE.md in digitalboy69/Projects-and-apps (main) and follow it. Task: continue the READING plan (or: continue the NAVIGATION plan). Keep replies short.

Two plans live in docs/: `FULL_READING_PLAN.md` (deeper readings / PDF) and `APP_NAVIGATION_PLAN.md` (fast, simple navigation: hubs, Start screen, search, one registry). Work on the one the owner names; `session.sh start` shows the next unchecked item of both. Do not mix them in one session.

## Session loop (the same every time)
1. `git clone` the repo (GitHub connector is read-only; use plain git). `sh vedic-astro-suite/tools/ai/session.sh start` shows the next plan item and whether main moved.
2. Build the next unchecked item of the plan you were asked to continue. Hand-written data lives in `tools/reading_gen/*.py` -> run `sh tools/reading_gen/regen.sh` (never hand-edit js/87, 89, 90, 91).
3. `session.sh check` (build + structure + syntax), then `session.sh test <only the tests for what you touched>`.
4. `GH_TOKEN=... session.sh ship "message"` commits, rebases on a moved main (auto-merge rules in .gitattributes + build.py), checks, pushes `feature/full-reading` and fast-forwards main. Use `--branch-only` mid-session, `--dry` to rehearse.
5. Tick the box in the plan, add one line to its notes and one to the AI_GUIDE changelog, in the same ship.

## Token hygiene (the owner's usage limit is real)
Short replies. Compact outputs (the helper already trims). No screenshots unless a layout is in doubt. Do not dump big files: use `symbols.idx`, `grep -n`, `sed -n a,bp`. Run only the tests that cover the change; the full set (`session.sh test dasha_reading_test manifest_test nakshatra_db_test deep_reading_test knowledge_db_test popular_charts_test smoke customer prod`) only at milestones M2-M4. Do not re-read what this file or the plan already says.

## Where things are
Reading stack: js/87 `VDB` (625 interpretation entries) -> 89 `VNK` nakshatra -> 90 `VMF` real-life manifestation -> 91 `VDA` dasha -> 88 `VDR` shows it (Deep reading tab, planet cards, Now tab, report); hooks are 3 spots in `70-chart-reading.js` and 1 in `43-full-report-text.js`. Chart object: `computeChart` (planets, ascendant, vargas, dashaData, shadbala, ashtakavarga...). Generated, never hand-edit: `dist/*`, `symbols.idx`, AI_GUIDE auto block.

## Layer rules (schema v1.1)
Facts in -> facets out (style, strengths, shadows, practices) + score/tone + tags -> text composed from facets. Second person, tendencies not fate, concrete scenes, 2 self-check questions. Tests ban absolute/fatalistic words. Every layer gets a test that cross-checks it against the app's own engine (see tests/nakshatra_db_test.py, dasha_reading_test.py).

## Lessons learned (each cost time once)
- Run python commands from `vedic-astro-suite/` (many `cd ..` mistakes). New files must be listed in STRUCTURE.md or `check_structure` fails. Tests need `CHROMIUM` (the helper finds it); `customer_smoke.py` has a hard-coded browser path (the helper patches a temp copy).
- `main` moves often (the owner works in parallel). Never force over it; `ship` rebases. Docs/generated conflicts are expected and auto-handled; code conflicts mean stop and read.
- Edge cases: a chart older than 120 years has no running dasha; the first Mahadasha is partial (fewer than 9 Antardashas); old births need a local-mean-time zone option (not in the dropdown); the Deep reading tab has Mahadasha cards + 12 house cards (tests count the last 12); Rahu/Ketu have no sign rulership and only the 7th aspect in this app.
- Wording tests: scenes may contain commas; "the person who raised you" is legitimate; future-period self-checks are statements, not questions. Check the test is not the thing that is wrong before changing text.
- Verify generators: `sh tools/reading_gen/regen.sh` followed by `git status` must show no change if nothing was edited.
- Token: the GitHub connector cannot write. The owner pasted a classic token in chat once; it is passed only as `GH_TOKEN` env, never written to disk (ship prints how many files contain it: must be 0). Ask the owner to rotate it and use a fine-grained token (Contents read+write, one repo, short expiry).
- Not deployed by git: door-site and pay-hub deploy elsewhere (Cloudflare); the app on main deploys on push.

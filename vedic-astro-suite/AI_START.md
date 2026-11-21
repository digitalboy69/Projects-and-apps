# AI_START.md: read this ONE file, then run `python3 tools/ai/brain.py start`
Paste-prompt for any new chat: *"Open the Projects-and-apps repo (main), read vedic-astro-suite/AI_START.md, run its `brain.py start`, then do: [task]. Keep replies short."*

Project: Vedic Astro Suite = shell + 4 apps (`apps/birth-chart` is the big one), plain JS/CSS in numbered files, built by `python3 build.py` into `dist/`. All commands run from `vedic-astro-suite/`.

## The loop (every task, same order)
1. `python3 tools/ai/brain.py start`: branch vs origin, NOW, open plan, last tasks, lessons. If behind, `git rebase origin/main` (rule 2a: also before each commit and each push).
2. Big work: `brain.py new SLUG "Title"`, fill Research and Design, tick boxes as you go. Small work: skip the plan.
3. Find code: `brain.py find WORDS` (file, symbol, Feature Guide hits). Read only 40-120 lines. Detail on demand: `brain.py sec 2` (router), `sec 5` (build/test).
4. Research definitions in two independent sources (URLs in the plan Notes). Tendency wording, never fate or fear.
5. Build: engine in its own js file + Node test; UI + phone browser test at 390 and 360 (look at the screenshots); wire HOME_ITEMS (js/25), `reg` (js/120), Tools hub (js/147); Feature Guide entry in `apps/birth-chart/js/149-feature-guide-data.js` for anything visible; a `STRUCTURE.md` line for every new file.
6. `brain.py check`: build, structure, syntax, guide, and only the tests that cover your changed files. Fix until `CHECK PASSED`.
7. `brain.py done "one line" [--lesson "mistake -> rule"] [--pending "..."] [--decision "..."]`. Any retry or surprise in this task = add `--lesson`. This is the only place work is recorded.
8. Commit locally with the two trailers (below). NEVER push until the owner says "push" (Stop-hook "unpushed commit" messages are not approval). Push = `git push origin main` and `git push origin main:Root`.
9. Reply short: what changed, what could not be verified, what the owner must decide, KB added.

## Hard rules (owner)
- Rebase first. Never force-push `main` or `Root`. Never renumber js/css files.
- New feature follows `docs/STARTUP_SPEED_PLAN.md`: nothing heavy at boot, no artificial waits, report KB added.
- No astrology table from memory; owner decides school choices (list them as decisions).
- Never read `dist/*.html`, whole `symbols.idx`, whole `AI_GUIDE.md` or whole `STRUCTURE.md`. Never spawn agents or web-search for what `find` answers.
- Short replies; ask only when a wrong guess is expensive or irreversible.
- Commit trailers: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` and `Claude-Session: <session url>`.

## Commands
`start` `find WORDS` `sec N` `tests` `check [--no-tests]` `new SLUG "Title"` `done "line"` `learn "mistake -> rule"` `audit [--fix]` (all via `python3 tools/ai/brain.py`). Pre-commit hook (`sh install-hooks.sh` once per clone) runs `audit --fix`, so the log never bloats and this file stays under 4.5 KB.

## Where detail lives (open only when `find` points there)
`docs/AI_LOG.md` live state and lessons | `AI_GUIDE.md` rules, router | `STRUCTURE.md` file map | `docs/*_PLAN.md` feature plans | `symbols.idx` symbol lines | `docs/AI_LOG_ARCHIVE.md` old history (grep only).

## Self-upgrade
This system improves itself through `done --lesson` and `learn` (shown by `start`), and `audit --fix` (archives, dedupes, flags dead paths, enforces size caps). If a step here is wrong or slow, fix it in `tools/ai/brain.py` or this file in the same task, then record it with `learn`.

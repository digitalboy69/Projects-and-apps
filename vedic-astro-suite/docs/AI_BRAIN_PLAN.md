# AI Brain: a self-updating, token-cheap workflow (plan)
Owner request 2026-11-21: upgrade the repo's AI architecture so any new chat understands everything from ONE prompt, documents its work in ONE file, saves the most tokens, and improves itself each task.

## What costs tokens today (measured)
- `CLAUDE.md` says "read AI_GUIDE.md FIRST". AI_GUIDE.md is ~118 KB (~30k tokens): sections 0-6 about 22 KB of rules, section 7 changelog 34 KB (promised "<= 25 lines", it is ~85 lines), section 8 auto map 62 KB (never needed).
- STRUCTURE.md 88 KB: must be read "once", really it is grepped.
- State lives in 5 places (AI_GUIDE sec 7, docs/*_PLAN.md logs, AI_START_HERE, HANDOFF, session.sh). A new chat has to guess which is current.
- Every task repeats the same manual steps (rebase, build, structure, guide test, pick tests, changelog line, plan tick). Each is a chance for a typo and a retry.

## Design (four layers, cheapest first)
1. **Entry (about 1k tokens): `AI_START.md`.** The only file a new chat must read, plus one paste-prompt. Holds: the loop in 8 steps, the 10 hard owner rules in one line each, command list, where deep detail lives. CLAUDE.md points to it. Hard size cap 4.5 KB (audit enforces it).
2. **Tool (0 tokens until used): `tools/ai/brain.py`.** One command with subcommands that print short, decision-ready output:
   - `start`: branch vs origin, unpushed commits, NOW block, next unchecked plan item, last 5 log lines, top lessons, token estimate of what you loaded.
   - `find WORDS`: ranks STRUCTURE.md, symbols.idx, router rows, Feature Guide keys by keyword and prints at most 8 `file:line` hits. Replaces reading the router and STRUCTURE.
   - `sec N`: prints one AI_GUIDE section only.
   - `tests`: maps changed files to the tests that cover them (derived from test file contents, never a hand list, so it cannot go stale).
   - `check`: rebase state, build, structure, syntax, feature guide, then only the mapped tests, one line each.
   - `new SLUG "title"`: scaffolds docs/SLUG_PLAN.md from the standard template.
   - `done "one line" [--lesson "..."]`: writes the single living record (below), ticks nothing silently, refuses if build/structure fail.
   - `learn "lesson"`: appends a lesson (mistake and rule).
   - `audit [--fix]`: the self-upgrade pass (below). Runs in the pre-commit hook with `--fix`.
3. **One living record: `docs/AI_LOG.md`.** Three blocks in one file: `NOW` (rewritten by `done`: last commit, what is live, what is pending, owner decisions waiting), `LOG` (newest first, capped at 40 lines, one line per task), `LESSONS` (mistake -> rule, deduplicated). Overflow moves to `docs/AI_LOG_ARCHIVE.md` (grep only). AI_GUIDE section 7 (34 KB) moves to the archive.
4. **Deep detail on demand:** AI_GUIDE.md (rules, router), STRUCTURE.md, plan docs, symbols.idx. Reached through `find` and `sec`, never read whole.

## How it upgrades itself
- `done --lesson` and `learn` turn every retry or mistake into a rule that `start` shows next time.
- `audit --fix`: caps and archives the log, dedupes lessons, flags dead paths in AI_START/CLAUDE/AI_GUIDE, flags plans whose boxes are all ticked, fails if AI_START.md grows past its cap, warns if a file in the entry path grows, prints the token cost of the entry path.
- The pre-commit hook runs `audit --fix`, so the record cannot be forgotten or bloat.
- Rule in AI_START: when a step needed a retry or a surprise, run `learn` before `done`.

## Token budget (target)
| Path | Before | After |
|---|---|---|
| New chat orientation | ~30k tokens (AI_GUIDE) | ~1.2k (AI_START) + ~0.8k (`start`) |
| Find where a feature lives | read router + STRUCTURE | one `find` call, under 400 tokens |
| Pick tests | guess or run all | `tests` prints the list |
| Record the work | 3-4 edits in different files | one `done` call |

## Rules for this work
- Never delete history: AI_GUIDE section 7 content is moved to the archive, not dropped. Existing instructions that said "add a line to section 7" are updated to `brain.py done`.
- Stdlib Python only, no network, no dependency. Works from any directory inside the repo.
- Tests: `tests/ai_brain_test.py` runs every subcommand on a temporary fixture copy (never edits the real log).
- Owner rules stay: rebase first (2a), push only after the owner says push, Feature Guide not needed (no visible app change), STRUCTURE entries for every new file, AI_GUIDE one line.

## Checklist
- [x] S1 Plan (this file)
- [x] S2 `tools/ai/brain.py` with all subcommands
- [x] S3 `docs/AI_LOG.md` seeded (NOW, LOG, LESSONS) and section 7 moved to `docs/AI_LOG_ARCHIVE.md`
- [x] S4 `AI_START.md` (<= 4.5 KB) and CLAUDE.md, README, HANDOFF, AI_START_HERE, AI_GUIDE pointers updated
- [x] S5 Pre-commit hook runs `audit --fix`; build.py unaffected
- [x] S6 `tests/ai_brain_test.py` passes; STRUCTURE entries; measured before/after token numbers
- [ ] S7 Commit locally, wait for "push"

## Notes
- Existing `tools/ai/session.sh` belongs to the old feature-branch flow (ship to feature/full-reading). It stays; AI_START tells chats to use brain.py and the owner's current push rule (main and Root, only after "push").

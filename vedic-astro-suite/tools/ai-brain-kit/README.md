# AI Brain Kit 2.0 - the fastest way to understand and change any codebase with an AI

One folder (`brain/`) that gives a project a memory and makes every AI session cheap: it finds the right files by meaning, shows only the code you need, tells you what a change will break, runs tests without flooding the chat, and remembers what went wrong. Pure Python 3 standard library, no network, no dependencies, never runs your code. Works with **Claude Code, Cursor, Copilot, Windsurf, Gemini CLI, Codex / AGENTS.md tools, Cline, Aider**.

## Why it saves tokens (measured on a real 588-file, 2.1M-token project)
| Moment | Without | With the brain |
|---|---|---|
| Cold start (read AI_GUIDE + STRUCTURE) | ~45,900 tokens | `brief` ~830 (**-98%**) |
| "Where is X?" | grep / open many files | `ctx "X"` ~300-1,500 |
| Read one function | read the whole file | `show NAME` ~100-600 |
| Test run with 300 passing lines | ~3,000 tokens | `run` ~60, full log kept on disk |
| Resume after a dead chat | re-explain, re-explore | `handoff` + `brief` |
Every command runs in 0.1-1 s on that project.

## Install in 3 commands
```bash
unzip ai-brain-kit.zip
python3 ai-brain-kit/install.py /path/to/project --tool all    # or --tool claude,cursor ; add --no-hooks / --no-skill if unwanted
cd /path/to/project && python3 brain/brain.py selftest && python3 brain/brain.py brief
```
Then tell an AI: *"Use the codebase-brain skill. Fill AI_GUIDE.md (Project in 10 lines, Architecture, Router, Gotchas) and every 'describe me' line in STRUCTURE.md from the real code. Do not change source code."* That is the only thing a tool cannot write for you.

## Commands (`python3 brain/brain.py <cmd>`)
| Group | Command | What it does |
|---|---|---|
| **Start** | `brief ["task"]` | Terse-output rules + project + git status (behind the base?) + plan step + last handoff + task context. ~600-900 tokens. Replaces reading the guide. |
| **Find** | `ctx "task"` | Retrieval by meaning (BM25 over file purposes, names, symbols, router): best files, symbols with lines, tests, lessons. `--max TOKENS`. |
| | `find NAME` / `outline FILE` / `show NAME [--lines N]` | Where is it / every symbol of a file / the body of one symbol. |
| | `map [DIR]` / `guide [SECTION]` | STRUCTURE.md for one folder / one AI_GUIDE section (no arg = sections with token cost). |
| **Impact** | `impact NAME` | Every call site, import and mention (grouped, capped), importing modules, tests, **blast radius** LOW/MEDIUM/HIGH. |
| | `tests-for FILE\|NAME` | Tests that cover it, with the command to run each. |
| **Run** | `run "cmd" [--max N]` | Runs it; prints failures, tracebacks and the summary only (ANSI stripped, repeats folded). Full log: `brain/.cache/last_run.log`. |
| | `diff [--hunks]` | Changed files with purpose and size; flags new files missing from STRUCTURE.md. |
| | `check [--changed]` | Index + STRUCTURE + secrets + build + syntax + tests (`--changed` = only tests that cover your changes) + audit. |
| **Keep** | `learn "text" --ref a,b` | Add a lesson to `docs/LESSONS.md` (refs = files/symbols). |
| | `audit` | Lessons pointing to vanished files/symbols or older than the file's last change (git date), contradicting or duplicate lessons, guide/router mentioning things that no longer exist, unfilled sections, stale plans, huge files, changelog too long. |
| | `handoff ["note"]` | Writes `docs/HANDOFF.md` (notes, plan step, branch, commits, uncommitted). `brief`/`start` show it to the next chat. |
| | `secrets [--staged\|--all]` | Finds tokens/keys/private keys (GitHub, AWS, Google, Slack, Stripe, Razorpay, JWT, hard-coded passwords). The hook blocks the commit. |
| **System** | `init`, `index`, `structure [--draft]`, `inventory`, `cost`, `hooks`, `start`, `selftest`, `version` | Set-up, index, keep STRUCTURE.md honest (`--draft` adds missing files), one-file inventory (`docs/ALL_FEATURES.md`), token cost of things, git hook, self-test. |

## What `init` creates
`brain/brain.json` (config, auto-detects npm/Python/Go/Cargo/make commands) · `AI_GUIDE.md` · `STRUCTURE.md` (drafted from every file's first comment) · `symbols.idx` · `docs/{AI_START_HERE,PLAN_TEMPLATE,LESSONS}.md` · `.githooks/pre-commit` (fresh index, secret scan, STRUCTURE check, audit warnings) · and tiny pointer files that tell each tool to run `brief` first and to answer tersely:

| `--tool` | File(s) written (an existing file is appended to inside a marked block, never overwritten) |
|---|---|
| `claude` | `CLAUDE.md` (+ the skill in `.claude/skills/codebase-brain/` unless `--no-skill`) |
| `agents` | `AGENTS.md` (Codex, Jules, Amp, Zed, Warp, Factory and others) |
| `cursor` | `.cursor/rules/brain.mdc` (alwaysApply) + `.cursorrules` |
| `copilot` | `.github/copilot-instructions.md` |
| `windsurf` | `.windsurf/rules/brain.md` + `.windsurfrules` |
| `gemini` | `GEMINI.md` |
| `cline` / `aider` | `.clinerules` / `CONVENTIONS.md` |
Default is `claude,agents`. `--tool all` writes everything. Re-running is safe.

## The Claude skill
Per project it is installed automatically. For all your projects / claude.ai: upload `ai-brain-skill.zip` in Settings -> Capabilities -> Skills (Claude Code personal: copy the folder to `~/.claude/skills/`).

## Config (`brain/brain.json`)
`commands.build|syntax|tests[]` · `test_cmd` (template with `{test}`) · `ignore_dirs` · `ignore_globs` · `structure_ignore` · `index_ignore_globs` · `plans_glob` · `main_branch`. List settings are merged with the defaults, so upgrading never loses a built-in ignore.

## Languages indexed
Python, JS/TS/JSX/TSX/Vue/Svelte, Go, Rust, Java/Kotlin/C#/Scala, Ruby, PHP, C/C++, Swift, Dart, shell, SQL, HTML ids, CSS classes. Line-pattern based: fast and forgiving, may miss exotic syntax. Add a language: a regex list in `LANG` and an extension in `EXT` in `brain.py`.

## The method it teaches (`AI_GUIDE.md` section 0a)
Plan in a file -> rebase on the latest base -> research with 2+ sources -> done = test + build + screenshot you looked at + STRUCTURE.md + changelog + `learn` -> wire the feature everywhere it must appear -> push after each finished step -> UI: show first, push after approval -> park owner decisions -> terse replies.

## Notes
- Token counts are estimates (chars / 3.8), within ~15% of real tokenizers.
- `ctx` is keyword retrieval (BM25-style, stemming, camelCase/snake_case splitting), not embeddings: it works offline and instantly; it is only as good as your STRUCTURE.md purposes and symbol names, which is why filling them in matters.
- `impact` is text-based (word-boundary search), not a type-aware call graph: it can over-report same-named symbols and miss dynamic dispatch. It is a fast first look, not a proof.
- `run`'s compression is heuristic; if something looks too clean, grep the saved log.
- No secrets, tokens or personal data belong in any brain file.
- Tested: `python3 brain/brain.py selftest` (29 checks, throw-away project) and on a real 588-file project.

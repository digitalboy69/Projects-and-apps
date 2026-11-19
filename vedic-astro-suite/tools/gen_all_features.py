#!/usr/bin/env python3
"""Generates docs/ALL_FEATURES.md: ONE file that explains the whole suite (what it is, every feature and what it does,
every file with its line count, size and purpose, tests, storage keys, build/deploy). Re-run after any change:
    python3 tools/gen_all_features.py        (build.py does NOT run it; run it before a release or after adding a tool/file)
Sources: the files themselves (counted), STRUCTURE.md (purposes), js/25 HOME_ITEMS + js/147 THB.CATS + js/149 FG_DATA (via tools/dump_features.js)."""
import os, re, json, subprocess, datetime, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SKIP_DIRS = {'.git', 'node_modules', 'dist', '__pycache__'}
GEN = {'symbols.idx', 'version.json'}

def files():
    out = []
    for d, ds, fs in os.walk('.'):
        ds[:] = sorted(x for x in ds if x not in SKIP_DIRS and not x.startswith('.git'))
        if d == '.': ds[:] = [x for x in ds if x != '.githooks' or True]
        for f in sorted(fs):
            p = os.path.join(d, f)[2:]
            out.append(p)
    return out

def stat(p):
    b = open(p, 'rb').read()
    try: n = b.count(b'\n') + (1 if b and not b.endswith(b'\n') else 0)
    except Exception: n = 0
    binary = b'\0' in b[:2000]
    return (0 if binary else n), len(b)

# purposes from STRUCTURE.md
PURP = {}
for ln in open('STRUCTURE.md', encoding='utf8'):
    m = re.match(r'^- `([^`]+)` — (.*)$', ln.rstrip('\n'))
    if m: PURP.setdefault(m.group(1), m.group(2).strip())
    m = re.match(r'^- `([^`]+)(?:` — |`: )(.*)$', ln.rstrip('\n'))
APP_PREFIX = {}
def purpose(p):
    if p in PURP: return PURP[p]
    return ''
# STRUCTURE.md lists sky3d / notepad / developer paths without the apps/<name>/ prefix in places: map by section
cur = None
for ln in open('STRUCTURE.md', encoding='utf8'):
    h = re.match(r'^### (apps/[a-z0-9-]+)/', ln)
    if h: cur = h.group(1) + '/'; continue
    if ln.startswith('### '): cur = None; continue
    m = re.match(r'^- `((?:js|css|index)[^`]*)` — (.*)$', ln.rstrip('\n'))
    if m and cur: PURP.setdefault(cur + m.group(1), m.group(2).strip())
    m = re.match(r'^- `(tests/[^`]+|docs/[^`]+)` — (.*)$', ln.rstrip('\n'))

allf = files()
rows = []
for p in allf:
    n, b = stat(p)
    rows.append((p, n, b, purpose(p)))
tot_lines = sum(r[1] for r in rows); tot_bytes = sum(r[2] for r in rows)

def area(p):
    if p.startswith('apps/'): return '/'.join(p.split('/')[:2])
    top = p.split('/')[0]
    return top if '/' in p else '(root files)'
def ext(p): return os.path.splitext(p)[1].lower() or '(none)'

by_area = collections.OrderedDict()
for r in rows:
    a = by_area.setdefault(area(r[0]), [0, 0, 0]); a[0] += 1; a[1] += r[1]; a[2] += r[2]
by_ext = collections.defaultdict(lambda: [0, 0, 0])
for r in rows:
    if r[0].endswith('index.bundle.html'): continue
    e = by_ext[ext(r[0])]; e[0] += 1; e[1] += r[1]; e[2] += r[2]

d = json.loads(subprocess.check_output(['node', 'tools/dump_features.js']))
items = d['items']; cats = d['cats']; fg = d['fg']; E = fg['e']; byid = {i[0]: i for i in items}
def src_file_for(pid):
    return ''
# map tool id -> js/css files by scanning registrations
reg = {}
for p in allf:
    if p.startswith('apps/birth-chart/js/') and p.endswith('.js'):
        t = open(p, encoding='utf8', errors='ignore').read()
        for m in re.finditer(r"""['"](panel-[a-z0-9-]+)['"]""", t):
            reg.setdefault(m.group(1), set()).add(p.split('/')[-1])
sizes = {r[0]: r for r in rows}
def tool_files(pid):
    # files that define the panel: a js file whose name stem is mentioned plus panel id; keep it simple: files containing id="panel-x" or reg('panel-x'
    out = []
    for f in sorted(reg.get(pid, [])):
        if re.match(r'(25|120|147|149|150)-', f): continue
        p = 'apps/birth-chart/js/' + f
        t = open(p, encoding='utf8', errors='ignore').read()
        if re.search(r"""(id=["']%s["']|reg\(\s*["']%s["']|registerLatePanel\(\s*["']%s["'])""" % ((pid,) * 3), t):
            out.append(p)
    return out

def kb(b): return '%.1f KB' % (b / 1024) if b < 1048576 else '%.2f MB' % (b / 1048576)

# storage keys
keys = collections.defaultdict(set)
for p in allf:
    if p.endswith(('.js', '.html')) and not p.endswith('index.bundle.html') and not p.startswith(('tests/', 'mobile/', 'door-site/')):
        t = open(p, encoding='utf8', errors='ignore').read()
        for m in re.finditer(r"""(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*['"]([A-Za-z0-9_.:-]+)['"]""", t):
            keys[m.group(1)].add(area(p))
        for m in re.finditer(r"""\bLS_KEY\s*=\s*['"]([A-Za-z0-9_.:-]+)['"]""", t):
            keys[m.group(1)].add(area(p))

W = []
w = W.append
today = datetime.date.today().isoformat()
w('# Vedic Astro Suite — ALL FEATURES (one-file guide to everything inside the app)\n')
w('> Generated %s by `python3 tools/gen_all_features.py` — do not hand-edit; re-run it after adding a tool or file. '
  'Totals below are counted from the real files (lines = newline count, size = bytes on disk).\n' % today)
w('**Owner:** Madhu Yadav · **Repo:** `digitalboy69/Projects-and-apps`, folder `vedic-astro-suite/` · **Stack:** plain HTML + CSS + JavaScript (no framework), dark-and-gold, phone-first · **Host:** Vercel from `main`\n')
w('## Contents\n')
for t in ['1. What the app is (in one minute)', '2. Numbers at a glance', '3. How the suite is built (architecture, build, deploy)', '4. The six bottom-bar tabs',
          '5. Every tool in the Birth Chart app (%d tools, grouped as in the Tools tab)' % len(items), '6. The 3D Sky app: every feature', '7. Notepad, Developer card, Shell, Shared layers',
          '8. Data the app keeps on the device (storage keys)', '9. Every file: path, lines, size, purpose', '10. Tests', '11. Docs and plans', '12. Rules every contributor (human or AI) follows', '13. How to keep this file true']:
    w('- ' + t)
w('')
w('## 1. What the app is (in one minute)\n')
w('The Vedic Astro Suite is a free-to-run, offline-capable Vedic (Jyotish) astrology toolkit. You enter a birth date, time and place and it builds the chart, then offers dozens of tools '
  'to read it (dashas, divisional charts, strengths, yogas, transits, matching, panchang, remedies, an AI astrologer) and a real-time 3D sky. '
  'It is four small apps inside one shell:\n')
w('| App | What it is for |\n|---|---|')
w('| **Birth Chart** (`apps/birth-chart/`) | The main app: chart creation, %d tools, profiles, matching, rectification, export, AI astrologer. |' % len(items))
w('| **3D Sky** (`apps/sky3d/`) | A live Three.js sky: zodiac wheel, solar system, rising signs, aspects, dasha triggers, Formula Maker, export studio. |')
w('| **Notepad** (`apps/notepad/`) | Notes, templates and client cards for an astrologer. |')
w('| **Developer card** (`apps/developer/`) | Overlay card with the developer contact details. |')
w('')
w('Wording rule across the whole app: *tendencies*, never fate or fear words.\n')

w('## 2. Numbers at a glance\n')
w('- Project files counted: **%d** (excluding generated `dist/`, `.git`, `node_modules`)' % len(rows))
w('- Total lines: **{:,}** · Total size: **{}**'.format(tot_lines, kb(tot_bytes)))
w('- Tools in the Birth Chart app: **%d** (Home tiles / Tools tab / Feature Guide)' % len(items))
w('')
w('### By area\n')
w('| Area | Files | Lines | Size |\n|---|---:|---:|---:|')
for a, v in sorted(by_area.items(), key=lambda kv: -kv[1][1]):
    w('| `%s` | %d | {:,} | %s |'.replace('{:,}', '%s') % (a, v[0], format(v[1], ','), kb(v[2])))
w('')
w('### By file type (hand-written files; the generated `index.bundle.html` copies are left out to avoid double counting)\n')
w('| Type | Files | Lines | Size |\n|---|---:|---:|---:|')
for e, v in sorted(by_ext.items(), key=lambda kv: -kv[1][1]):
    w('| `%s` | %d | %s | %s |' % (e, v[0], format(v[1], ','), kb(v[2])))
w('')

w('## 3. How the suite is built\n')
w('''- **Shell** (`index.html`, `shell/`): the loading screen, floating app switcher, location/map picker and the silent updater. It opens each app inside an iframe.
- **Apps** (`apps/<name>/`): each is `index.html` + `css/NN-topic.css` + `js/NN-topic.js`. Files load in **number order** and are never renumbered. Late panels register through `registerLatePanel(id, fn)` (js/120) so nothing heavy runs at boot.
- **Shared** (`shared/`, `vendor/`): the global feel layer (`meta.css`), icon library (`icons.js`), liquid-glass look, quick menu, copy-button toggle, export add-on, QR libraries.
- **Editions** (`editions/customer`, `gate/`): the locked customer edition and its access gate.
- **Build** (`python3 build.py` → `tools/build.py`): writes `dist/*` single-file builds, `symbols.idx` (symbol → file:line), the AI_GUIDE auto-map, one `index.bundle.html` per app (the shell loads 1 file instead of ~260) and `version.json` (the silent updater reloads once when the build id changes).
- **Hooks**: `.githooks/pre-commit` regenerates the bundles/guide and checks `STRUCTURE.md` lists every file (`tools/check_structure.py`).
- **Deploy**: push to `main` → Vercel publishes. The working branch is `feature/astro-roadmap`; `Root` mirrors main. Never force-push `main` or `Root`.
- **Mobile** (`mobile/`): Capacitor wrapper for Android/iOS.
- **Door site** (`../door-site/`): licensing/door website with admin, functions and tests (own README).
- **Startup speed** (`docs/STARTUP_SPEED_PLAN.md`): nothing heavy at boot, rare features load on first open, no artificial waits.
''')

w('## 4. The six bottom-bar tabs\n')
w('| | Tab | What it does |\n|---|---|---|')
for t in fg['tabs']:
    w('| %s | **%s** | %s |' % (t[0], t[1], t[2]))
w('')

w('## 5. Every tool in the Birth Chart app\n')
w('Each entry: what it does, when to use it, how, key words and the files behind it. Text comes from the in-app Feature Guide (`js/149`), so this file and the app say the same thing.\n')
seen = set()
n = 0
def tool_block(pid):
    global n
    it = byid.get(pid)
    if not it: return
    n += 1; seen.add(pid)
    e = E.get(pid, {})
    w('#### %s %s `%s`\n' % (it[1], it[2], pid))
    w('*%s* · Home section: %s' % (it[3], it[4]))
    if e.get('what'): w('\n- **What it does:** ' + e['what'])
    if e.get('when'): w('- **When to use it:** ' + e['when'])
    if e.get('how'):
        w('- **How:**')
        for i, s in enumerate(e['how'], 1): w('  %d. %s' % (i, s))
    if e.get('terms'):
        w('- **Key words:** ' + '; '.join('**%s** — %s' % (a, b) for a, b in e['terms']))
    if e.get('tip'): w('- **Tip:** ' + e['tip'])
    if e.get('see'): w('- **Read with:** ' + ', '.join('%s (`%s`)' % (byid[s][2], s) for s in e['see'] if s in byid))
    tf = tool_files(pid)
    if tf:
        w('- **Code (file where the panel is defined or its markup lives):** ' + ', '.join('`%s` (%s lines)' % (f.replace('apps/birth-chart/', ''), format(sizes[f][1], ',')) for f in tf))
    w('')
for c in cats:
    w('### %s — %s\n' % (c[1], c[2]))
    for pid in c[3]: tool_block(pid)
rest = [i[0] for i in items if i[0] not in seen]
if rest:
    w('### More tools\n')
    for pid in rest: tool_block(pid)

w('## 6. The 3D Sky app: every feature\n')
w('Three.js r128 loaded from a CDN. Open it from the switcher. Tabs and tools (from `apps/sky3d/js` and the Feature Guide):\n')
for c in fg.get('sky3d', []):
    w('- **%s %s** — %s' % (c[0], c[1], ' '.join(x for x in c[2:3] if isinstance(x, str))))
w('')
w('Files and what each does (full table is in section 9; the 3D Sky part, in load order):\n')
w('| File | Lines | What it does |\n|---|---:|---|')
for r in rows:
    if r[0].startswith('apps/sky3d/js/') or r[0].startswith('apps/sky3d/index'):
        w('| `%s` | %s | %s |' % (r[0].replace('apps/sky3d/', ''), format(r[1], ','), (r[3] or '').replace('|', '\\|')))
w('')

w('## 7. Notepad, Developer card, Shell, Shared layers\n')
for pre, title in [('apps/notepad/', 'Notepad'), ('apps/developer/', 'Developer card'), ('shell/', 'Shell'), ('shared/', 'Shared'), ('vendor/', 'Vendor'), ('editions/', 'Editions'), ('gate/', 'Gate')]:
    w('**%s**\n' % title)
    for r in rows:
        if r[0].startswith(pre) and not r[0].endswith('index.bundle.html'):
            w('- `%s` (%s lines, %s) — %s' % (r[0], format(r[1], ','), kb(r[2]), r[3] or '—'))
    w('')

w('## 8. Data kept on the device (storage keys)\n')
w('Found by scanning the code for `localStorage` / `sessionStorage` calls. Nothing leaves the device unless the owner turns on cloud sync, export or the AI provider.\n')
w('| Key | Used in |\n|---|---|')
for k in sorted(keys):
    w('| `%s` | %s |' % (k, ', '.join('`%s`' % a for a in sorted(keys[k]))))
w('')

w('## 9. Every file: path, lines, size, purpose\n')
w('Sorted by folder. "Purpose" is the one-line description kept in `STRUCTURE.md` (empty = folder-level file listed there as a group).\n')
grp = collections.OrderedDict()
for r in rows: grp.setdefault(os.path.dirname(r[0]) or '(root)', []).append(r)
for g, rs in grp.items():
    w('### `%s/` — %d files, %s lines\n' % (g, len(rs), format(sum(x[1] for x in rs), ',')))
    w('| File | Lines | Size | Purpose |\n|---|---:|---:|---|')
    for r in rs:
        w('| `%s` | %s | %s | %s |' % (os.path.basename(r[0]), format(r[1], ','), kb(r[2]), (r[3] or '').replace('|', '\\|')))
    w('')

w('## 10. Tests\n')
tl = [r for r in rows if r[0].startswith('tests/')]
w('%d test files, %s lines. Node `vm` tests check the maths against hand-worked values and published sources; Playwright `*_browser_test.py` tests open each screen at 390 px and 360 px and check there is no sideways scroll. Run with `node tests/<name>.js` or `python3 tests/<name>.py`; `python3 tests/syntax_check.py` checks every file.\n' % (len(tl), format(sum(r[1] for r in tl), ',')))
w('| Test | Lines | What it checks |\n|---|---:|---|')
for r in tl: w('| `%s` | %s | %s |' % (r[0].replace('tests/', ''), format(r[1], ','), (r[3] or '').replace('|', '\\|')))
w('')

w('## 11. Docs and plans\n')
for r in rows:
    if r[0].startswith('docs/') or r[0] in ('AI_GUIDE.md', 'CLAUDE.md', 'STRUCTURE.md', 'README.md'):
        w('- `%s` (%s lines) — %s' % (r[0], format(r[1], ','), r[3] or '—'))
w('')

w('## 12. Rules every contributor follows\n')
w('''1. Read `AI_GUIDE.md` then `STRUCTURE.md`; never read `dist/`. Find code with `grep -P "^symbol\\t" symbols.idx`.
2. Keep a plan file; **rebase on the latest `origin/main`** at the start, before each commit and before each push.
3. Research each feature in at least two sources; tendency wording only.
4. Test: node `vm` tests plus Playwright at phone width (360 px must work); look at the screenshots.
5. New tool = `HOME_ITEMS` row (js/25) + `reg()` (js/120) + `THB.CATS` group (js/147) + a **Feature Guide entry** (js/149, `FG_DATA.e`) + `STRUCTURE.md` + an AI_GUIDE changelog line.
6. New feature follows the startup-speed plan: load on first open, no heavy boot work, report the KB added.
7. Own CSS class prefix per feature; animate only `transform` and `opacity`.
8. Visible UI change: show screenshots, commit locally, wait for approval before pushing. Backend/doc steps are pushed straight away to `main`, `Root` and `feature/astro-roadmap`.
''')
w('## 13. How to keep this file true\n')
w('Run `python3 tools/gen_all_features.py` after adding or changing a tool or file. It re-counts every file, re-reads `STRUCTURE.md`, and re-reads the tool list and Feature Guide from the code, then rewrites this file. '
  'Because the tool texts come from `FG_DATA`, updating the Feature Guide (rule 5) updates this file automatically.\n')
open('docs/ALL_FEATURES.md', 'w', encoding='utf8').write('\n'.join(W))
print('wrote docs/ALL_FEATURES.md', len(rows), 'files', tot_lines, 'lines', len('\n'.join(W)) // 1024, 'KB')

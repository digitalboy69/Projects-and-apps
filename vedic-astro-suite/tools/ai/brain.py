#!/usr/bin/env python3
"""AI Brain: one command that orients an AI session, finds code cheaply, runs only the needed checks and keeps ONE living record.

  python3 tools/ai/brain.py start                  where am I, what is pending, lessons (about 800 tokens)
  python3 tools/ai/brain.py find WORDS...          best file:line hits from STRUCTURE, symbols, Feature Guide (max 9 lines)
  python3 tools/ai/brain.py sec N                  print one AI_GUIDE section (0a, 0, 1 ... 7) instead of the whole file
  python3 tools/ai/brain.py tests [--all]          tests that cover the files you changed (derived, never a hand list)
  python3 tools/ai/brain.py check [--no-tests]     rebase state + build + structure + syntax + feature guide + mapped tests
  python3 tools/ai/brain.py new SLUG "Title"       scaffold docs/SLUG_PLAN.md and its STRUCTURE.md line
  python3 tools/ai/brain.py done "one line" [--lesson "..."] [--pending "..."] [--decision "..."] [--clear] [--force]
  python3 tools/ai/brain.py learn "mistake -> rule"
  python3 tools/ai/brain.py audit [--fix]          self-upgrade pass (cap + archive the log, dedupe lessons, dead paths, size caps)
  Navigation / token savers (tools/ai/brain_nav.py, loaded only when used):
  ctx "task" | show NAME | outline FILE | impact NAME | tests-for FILE | run "cmd" | diff | secrets [--all] | handoff | cost | map [DIR]

Stdlib only, no network (except an optional git fetch). Set BRAIN_ROOT to run against another tree (the tests do).
"""
import datetime, difflib, glob, os, re, subprocess, sys

ROOT = os.path.abspath(os.environ.get('BRAIN_ROOT') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
LOG = os.path.join(ROOT, 'docs', 'AI_LOG.md')
ARC = os.path.join(ROOT, 'docs', 'AI_LOG_ARCHIVE.md')
START = os.path.join(ROOT, 'AI_START.md')
START_CAP = 4608          # bytes, hard cap for the entry file
LOG_CAP = 40              # lines kept in LOG
LES_CAP = 40              # lessons kept
M = {'now': ('<!--NOW-->', '<!--/NOW-->'), 'log': ('<!--LOG-->', '<!--/LOG-->'), 'les': ('<!--LESSONS-->', '<!--/LESSONS-->')}


def sh(cmd, timeout=600, env=None):
    try:
        p = subprocess.run(cmd, shell=True, cwd=ROOT, capture_output=True, text=True, timeout=timeout, env=env)
        return p.returncode, (p.stdout or '') + (p.stderr or '')
    except subprocess.TimeoutExpired:
        return 124, 'timeout'


def rd(p):
    try:
        return open(p, encoding='utf-8').read()
    except OSError:
        return ''


def wr(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(s)


def tok(s):
    return (len(s.encode('utf-8')) + 3) // 4


def block(text, key):
    a, b = M[key]
    i, j = text.find(a), text.find(b)
    if i < 0 or j < 0:
        return None
    return text[i + len(a):j].strip('\n')


def put(text, key, body):
    a, b = M[key]
    i, j = text.find(a), text.find(b)
    if i < 0 or j < 0:
        text = text.rstrip('\n') + '\n\n' + a + '\n' + b + '\n'
        i, j = text.find(a), text.find(b)
    return text[:i + len(a)] + '\n' + body.strip('\n') + '\n' + text[j:]


def today():
    return datetime.date.today().isoformat()


def git_state():
    sh('git fetch -q origin 2>/dev/null', 40)
    _, br = sh('git rev-parse --abbrev-ref HEAD'); br = br.strip()
    _, hd = sh('git rev-parse --short HEAD'); hd = hd.strip()
    rc, cnt = sh('git rev-list --left-right --count origin/main...HEAD 2>/dev/null')
    behind = ahead = None
    if rc == 0 and cnt.split():
        behind, ahead = [int(x) for x in cnt.split()[:2]]
    _, dirty = sh('git status --porcelain')
    return br, hd, behind, ahead, [l for l in dirty.splitlines() if l.strip()]


# ------------------------------------------------------------------ start
def open_plans(limit=2):
    out = []
    for f in glob.glob(os.path.join(ROOT, 'docs', '*_PLAN.md')):
        t = rd(f)
        todo = [l for l in t.splitlines() if re.match(r'\s*- \[( |~)\]', l)]
        if not todo:
            continue
        rc, ts = sh('git log -1 --format=%%ct -- "%s"' % os.path.relpath(f, ROOT))
        stamp = max(int(ts.strip() or 0) if rc == 0 else 0, int(os.path.getmtime(f)))
        todo = [l for l in todo if 'on purpose' not in l.lower()] or todo
        out.append((stamp, os.path.basename(f), todo[0].strip()))
    out.sort(reverse=True)
    return out[:limit]


def cmd_start(a):
    br, hd, behind, ahead, dirty = git_state()
    o = []
    if behind is None:
        o.append('git: %s @ %s (origin/main not reachable)' % (br, hd))
    else:
        o.append('git: %s @ %s | behind origin/main: %d%s | unpushed: %d | changed files: %d' % (br, hd, behind, '  -> REBASE FIRST (git rebase origin/main)' if behind else '', ahead, len(dirty)))
    now = block(rd(LOG), 'now')
    o.append('\nNOW\n' + (now if now else '(empty: the first `brain.py done "..."` fills it)'))
    pl = open_plans()
    if pl:
        o.append('\nOPEN PLANS (newest first)')
        for _, n, t in pl:
            o.append('- %s: %s' % (n, t[:150]))
    lg = [l for l in (block(rd(LOG), 'log') or '').splitlines() if l.strip()][:5]
    if lg:
        o.append('\nLAST 5 DONE\n' + '\n'.join(l[:170] for l in lg))
    ls = [l for l in (block(rd(LOG), 'les') or '').splitlines() if l.strip()][:8]
    if ls:
        o.append('\nLESSONS (do not repeat)\n' + '\n'.join(l[:170] for l in ls))
    body = '\n'.join(o)
    o2 = body + '\n\nloaded this session so far: about %d tokens (AI_START %d + this output %d). Next: brain.py find WORDS for the code you need.' % (tok(rd(START)) + tok(body), tok(rd(START)), tok(body))
    print(o2)


# ------------------------------------------------------------------ find
def words(a):
    return [w.lower() for w in re.split(r'[\s,]+', ' '.join(a)) if len(w) > 1]


def cmd_find(a):
    ws = words(a)
    if not ws:
        print('usage: brain.py find WORDS...'); return 2
    hits = []
    for l in rd(os.path.join(ROOT, 'STRUCTURE.md')).splitlines():
        if l.startswith('- `'):
            low = l.lower(); n = sum(1 for w in ws if w in low)
            if n:
                m = re.match(r'- `([^`]+)`\s*[—-]*\s*(.*)', l)
                hits.append((n, 'S', '%s — %s' % (m.group(1), m.group(2)[:120]) if m else l[:140]))
    for l in rd(os.path.join(ROOT, 'symbols.idx')).splitlines():
        if l.startswith('#'):
            continue
        p = l.split('\t')
        if len(p) >= 3:
            low = p[0].lower(); n = sum(1 for w in ws if w in low)
            if n:
                hits.append((n, 'Y', '%s (%s) %s' % (p[0], p[1], p[2])))
    g = os.path.join(ROOT, 'apps', 'birth-chart', 'js', '149-feature-guide-data.js')
    for i, l in enumerate(rd(g).splitlines(), 1):
        m = re.match(r"\s*'([\w-]+)':\s*\{\s*what:\s*'(.{0,90})", l)
        if m:
            low = l.lower(); n = sum(1 for w in ws if w in low)
            if n:
                hits.append((n, 'G', 'guide %s:%d  %s' % (m.group(1), i, m.group(2))))
    hits.sort(key=lambda h: (-h[0], h[1]))
    take = []
    for kind, cap in (('S', 5), ('Y', 3), ('G', 2)):
        take += [h for h in hits if h[1] == kind][:cap]
    take.sort(key=lambda h: -h[0])
    if not take:
        print('no match for: ' + ' '.join(ws) + '. Try fewer or different words (feature name, file topic, symbol).'); return 1
    for n, k, t in take[:9]:
        print('%d/%d %s %s' % (n, len(ws), {'S': 'file  ', 'Y': 'symbol', 'G': 'guide '}[k], t))
    return 0


# ------------------------------------------------------------------ sec
def cmd_sec(a):
    if not a:
        print('usage: brain.py sec N   (0a, 0, 1, 2, 3, 4, 5, 6, 7)'); return 2
    t = rd(os.path.join(ROOT, 'AI_GUIDE.md')).splitlines()
    want = a[0].lower().rstrip('.')
    out, on = [], False
    for l in t:
        m = re.match(r'##\s+(\w+)\.', l)
        if m:
            if on:
                break
            on = m.group(1).lower() == want
        if on:
            out.append(l)
    print('\n'.join(out)[:9000] if out else 'section %s not found' % want)
    return 0 if out else 1


# ------------------------------------------------------------------ tests
def changed_files():
    s = set()
    _, a = sh('git status --porcelain -uall')
    for l in a.splitlines():
        p = l[3:].strip().strip('"')
        if ' -> ' in p:
            p = p.split(' -> ')[1]
        s.add(p)
    _, b = sh('git diff --name-only origin/main...HEAD 2>/dev/null')
    s.update(x.strip() for x in b.splitlines() if x.strip())
    pre = os.path.relpath(ROOT, os.path.dirname(os.path.join(ROOT, '.git'))) if False else ''
    _, top = sh('git rev-parse --show-prefix')
    pre = top.strip()
    return sorted(x[len(pre):] if pre and x.startswith(pre) else x for x in s)


def stem(path):
    b = os.path.splitext(os.path.basename(path))[0]
    return re.sub(r'^\d+[a-z]?-', '', b)


def map_tests(files):
    tdir = os.path.join(ROOT, 'tests')
    tests = [f for f in sorted(os.listdir(tdir)) if re.search(r'(_test|_check|_smoke)\.(py|js)$', f) or f in ('smoke.py',)] if os.path.isdir(tdir) else []
    texts = {t: rd(os.path.join(tdir, t)) for t in tests}
    pick = set()
    for f in files:
        if f.startswith('tests/') and os.path.basename(f) in texts:
            pick.add(os.path.basename(f)); continue
        if not re.search(r'\.(js|css|py|html)$', f) or f.startswith(('docs/', 'dist/')):
            continue
        base = os.path.splitext(os.path.basename(f))[0]
        st = stem(f); st_us = st.replace('-', '_'); fam = re.split(r'[-_]', st)[0]
        for t, tx in texts.items():
            tn = t.rsplit('.', 1)[0]
            if base in tx or st_us in tn or (len(fam) > 3 and tn.startswith(fam + '_') and f.startswith('apps/')):
                pick.add(t)
    return sorted(pick)


def cmd_tests(a):
    if '--all' in a:
        names = map_tests(['tests/' + f for f in os.listdir(os.path.join(ROOT, 'tests'))])
        print('\n'.join(names)); return 0
    ch = changed_files()
    names = map_tests(ch)
    print('changed: %d files | tests that cover them: %s' % (len(ch), ' '.join(names) if names else '(none mapped: run smoke.py for a wrapper check)'))
    return 0


# ------------------------------------------------------------------ check
def last_line(out):
    keep = [l for l in out.splitlines() if re.search(r'^FAIL|ALL PASS|ALL PASSED|FAILED|SOME FAILED|Error|^ok |passed|PASS no page errors', l)]
    return (keep[-1] if keep else (out.strip().splitlines() or [''])[-1])[:150]


def run_test(name):
    p = os.path.join('tests', name)
    env = dict(os.environ)
    if not env.get('CHROMIUM'):
        for c in glob.glob('/opt/pw-browsers/chromium-*/chrome-linux/chrome') + ['/opt/pw-browsers/chromium']:
            if os.access(c, os.X_OK):
                env['CHROMIUM'] = c; break
    cmd = ('node ' if name.endswith('.js') else 'python3 ') + p
    rc, out = sh(cmd, 280, env)
    bad = rc != 0 or re.search(r'^FAIL|SOME FAILED|FAILED', out, re.M)
    return (not bad), last_line(out)


def cmd_check(a):
    ok = True
    br, hd, behind, ahead, dirty = git_state()
    if behind:
        print('WARN behind origin/main by %d: rebase before commit and before push (rule 2a)' % behind)
    for label, cmd in (('build', 'python3 build.py'), ('structure', 'python3 tools/check_structure.py'), ('syntax', 'python3 tests/syntax_check.py'), ('guide', 'node tests/feature_guide_test.js')):
        if not os.path.exists(os.path.join(ROOT, cmd.split()[-1])) and label != 'build':
            continue
        rc, out = sh(cmd, 280)
        good = rc == 0 and not re.search(r'^FAIL|FAILED|Error', out, re.M)
        ok &= good
        print('%-10s %s  %s' % (label, 'ok  ' if good else 'FAIL', last_line(out)))
    if '--no-tests' not in a:
        names = map_tests(changed_files())
        for n in names:
            good, ln = run_test(n)
            ok &= good
            print('%-28s %s  %s' % (n[:28], 'ok  ' if good else 'FAIL', ln))
        if not names:
            print('tests      none mapped to your changes (add a test, or run smoke.py for a wrapper check)')
    print('CHECK ' + ('PASSED' if ok else 'FAILED'))
    return 0 if ok else 1


# ------------------------------------------------------------------ new
TEMPLATE = """# {title} (plan)
Owner request {date}: {title}

## Research (two independent sources for any definition; URLs here)
-

## Design
-

## Rules for this work
- Rebase on origin/main first (rule 2a). Nothing heavy at boot (STARTUP_SPEED_PLAN). Feature Guide entry for anything visible. STRUCTURE.md line for every new file.

## Checklist
- [ ] S1 Plan (this file)
- [ ] S2 Engine and its test
- [ ] S3 UI, phone screenshots at 390 and 360
- [ ] S4 `brain.py check`, Feature Guide, `brain.py done "..."`
- [ ] S5 Commit locally, wait for "push"

## Notes
"""


def cmd_new(a):
    if len(a) < 2:
        print('usage: brain.py new SLUG "Title"'); return 2
    slug = re.sub(r'[^A-Za-z0-9]+', '_', a[0]).strip('_').upper()
    rel = 'docs/%s_PLAN.md' % slug
    p = os.path.join(ROOT, rel)
    if os.path.exists(p):
        print('exists: ' + rel); return 1
    wr(p, TEMPLATE.format(title=' '.join(a[1:]), date=today()))
    sp = os.path.join(ROOT, 'STRUCTURE.md')
    lines = rd(sp).split('\n')
    idx = max([i for i, l in enumerate(lines) if l.startswith('- `docs/')] or [len(lines) - 1])
    lines.insert(idx + 1, '- `%s` — plan: %s' % (rel, ' '.join(a[1:])))
    wr(sp, '\n'.join(lines))
    print('created %s and its STRUCTURE.md line. Fill Research, then tick boxes as you go.' % rel)
    return 0


# ------------------------------------------------------------------ learn / done
def similar(a, b):
    n = lambda s: re.sub(r'\W+', ' ', s.lower()).strip()
    return difflib.SequenceMatcher(None, n(a), n(b)).ratio() > 0.85


def cmd_learn(a):
    if not a:
        print('usage: brain.py learn "mistake -> rule"'); return 2
    text = ' '.join(a).strip()
    t = rd(LOG)
    cur = [l for l in (block(t, 'les') or '').splitlines() if l.strip()]
    if any(similar(text, re.sub(r'^- \d{4}-\d\d-\d\d\s*', '', l)) for l in cur):
        print('lesson already recorded'); return 0
    cur.insert(0, '- %s %s' % (today(), text))
    wr(LOG, put(t, 'les', '\n'.join(cur)))
    print('lesson saved (shown by `start` next time)')
    return 0


def cmd_done(a):
    args = list(a); lesson, pend, dec, clear, force, parts = [], [], [], False, False, []
    i = 0
    while i < len(args):
        x = args[i]
        if x == '--lesson' and i + 1 < len(args): lesson.append(args[i + 1]); i += 1
        elif x == '--pending' and i + 1 < len(args): pend.append(args[i + 1]); i += 1
        elif x == '--decision' and i + 1 < len(args): dec.append(args[i + 1]); i += 1
        elif x == '--clear': clear = True
        elif x == '--force': force = True
        else: parts.append(x)
        i += 1
    line = ' '.join(parts).strip()
    if not line:
        print('usage: brain.py done "one line" [--lesson "..."] [--pending "..."] [--decision "..."] [--clear] [--force]'); return 2
    if not force and not os.environ.get('BRAIN_NO_GATE'):
        for label, cmd in (('build', 'python3 build.py'), ('structure', 'python3 tools/check_structure.py')):
            rc, out = sh(cmd, 280)
            if rc != 0:
                print('refused: %s failed (%s). Fix it or use --force.' % (label, last_line(out))); return 1
    if not os.path.exists(LOG):
        wr(LOG, SEED)
    t = rd(LOG)
    old = block(t, 'now') or ''
    keep = lambda pre: next((l.split(':', 1)[1].strip() for l in old.splitlines() if l.startswith('- ' + pre)), '')
    pending = '; '.join(pend) if (pend or clear) else keep('Pending')
    decisions = '; '.join(dec) if (dec or clear) else keep('Owner decisions waiting')
    now = ['- Updated: %s' % today(),
           '- Last task: %s' % line,
           '- Pending: %s' % (pending or 'nothing'),
           '- Owner decisions waiting: %s' % (decisions or 'none')]
    t = put(t, 'now', '\n'.join(now))
    lg = [l for l in (block(t, 'log') or '').splitlines() if l.strip()]
    lg.insert(0, '- %s %s' % (today(), line))
    t = put(t, 'log', '\n'.join(lg))
    wr(LOG, t)
    for l in lesson:
        cmd_learn([l])
    cmd_audit(['--fix'], quiet=True)
    print('recorded in docs/AI_LOG.md (NOW + LOG%s). Commit it with your change.' % (' + LESSONS' if lesson else ''))
    return 0


# ------------------------------------------------------------------ audit
SEED = """# AI log: the ONE living record (read by `brain.py start`; edited only by `brain.py done|learn|audit`)
Newest first. Old lines move to docs/AI_LOG_ARCHIVE.md (grep it, never read it whole).

## NOW
<!--NOW-->
<!--/NOW-->

## LOG (one line per finished task)
<!--LOG-->
<!--/LOG-->

## LESSONS (mistake -> rule; shown at the start of every session)
<!--LESSONS-->
<!--/LESSONS-->
"""


def cmd_audit(a, quiet=False):
    fix = '--fix' in a
    notes, bad = [], False
    if not os.path.exists(LOG):
        if fix:
            wr(LOG, SEED); notes.append('created docs/AI_LOG.md')
        else:
            notes.append('MISSING docs/AI_LOG.md (run audit --fix)')
    t = rd(LOG); moved = []
    lg = [l for l in (block(t, 'log') or '').splitlines() if l.strip()]
    if len(lg) > LOG_CAP:
        moved += lg[LOG_CAP:]; lg = lg[:LOG_CAP]; t = put(t, 'log', '\n'.join(lg)); notes.append('log capped at %d lines' % LOG_CAP)
    ls = [l for l in (block(t, 'les') or '').splitlines() if l.strip()]
    ded = []
    for l in ls:
        if not any(similar(l, k) for k in ded):
            ded.append(l)
    if len(ded) != len(ls):
        notes.append('%d duplicate lesson(s) merged' % (len(ls) - len(ded)))
    if len(ded) > LES_CAP:
        moved += ded[LES_CAP:]; ded = ded[:LES_CAP]; notes.append('lessons capped at %d' % LES_CAP)
    if len(ded) != len(ls) or moved:
        t = put(t, 'les', '\n'.join(ded))
        if fix:
            wr(LOG, t)
            if moved:
                wr(ARC, (rd(ARC) or '# AI log archive (grep only)\n') .rstrip('\n') + '\n\n## Moved %s\n' % today() + '\n'.join(moved) + '\n')
    n = len(rd(START).encode('utf-8'))
    if not os.path.exists(START):
        notes.append('MISSING AI_START.md'); bad = True
    elif n > START_CAP:
        notes.append('FAIL AI_START.md is %d bytes, cap %d: shorten it (move detail to AI_GUIDE or the log)' % (n, START_CAP)); bad = True
    dead = []
    repo_top = os.path.abspath(os.path.join(ROOT, '..'))
    for f in (START, os.path.join(ROOT, 'CLAUDE.md')):
        for m in re.finditer(r'`([\w./-]+\.(?:py|js|md|sh|html|css|idx))`', rd(f)):
            p = m.group(1)
            if re.search(r'NN|\*|<|\.\.\.', p) or p.startswith(('dist/', 'http')):
                continue
            if not any(os.path.exists(os.path.join(b, p)) for b in (ROOT, repo_top, os.path.join(ROOT, 'docs'), os.path.join(ROOT, 'tools', 'ai'), os.path.join(ROOT, 'tests'))):
                dead.append('%s -> %s' % (os.path.basename(f), p))
    if dead:
        notes.append('DEAD PATH(S): ' + ', '.join(sorted(set(dead))[:6])); bad = True
    entry = tok(rd(START)) + tok(rd(os.path.join(ROOT, 'CLAUDE.md')))
    notes.append('entry path: AI_START + CLAUDE = about %d tokens; AI_LOG about %d tokens' % (entry, tok(rd(LOG))))
    done = [os.path.basename(f) for f in glob.glob(os.path.join(ROOT, 'docs', '*_PLAN.md')) if re.search(r'- \[x\]', rd(f)) and not re.search(r'- \[( |~)\]', rd(f))]
    if done:
        notes.append('%d plan(s) fully ticked (finished)' % len(done))
    if not quiet or bad:
        print('audit%s:\n  ' % (' --fix' if fix else '') + '\n  '.join(notes))
    return 1 if bad else 0


NAV = ('ctx', 'show', 'outline', 'impact', 'tests-for', 'run', 'diff', 'secrets', 'handoff', 'cost', 'map')


def main():
    a = sys.argv[1:]
    if not a or a[0] in ('-h', '--help', 'help'):
        print(__doc__); return 0
    c, r = a[0], a[1:]
    if c in NAV:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import brain_nav
        return brain_nav.dispatch(c, r, ROOT, sh, rd, tok) or 0
    fn = {'start': cmd_start, 'find': cmd_find, 'sec': cmd_sec, 'tests': cmd_tests, 'check': cmd_check, 'new': cmd_new, 'done': cmd_done, 'learn': cmd_learn, 'audit': cmd_audit}.get(c)
    if not fn:
        print('unknown command: %s\n' % c + __doc__); return 2
    return fn(r) or 0


if __name__ == '__main__':
    sys.exit(main())

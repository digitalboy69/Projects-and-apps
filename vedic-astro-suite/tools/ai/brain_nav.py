"""Navigation + token-saving commands for tools/ai/brain.py (loaded lazily, so `start`/`find`/`done` stay fast).

  ctx "task" [--max N]    ranked files, symbols, tests, lessons for a task (BM25-lite over paths, STRUCTURE purposes, symbols)
  show NAME [--lines N]   one function/class body by name (from symbols.idx), not the whole file
  outline FILE            symbols of one file with line numbers
  impact NAME             who uses a symbol: blast radius, call sites, tests
  tests-for FILE|NAME     tests that cover a file or mention a symbol, with the command to run
  run "cmd" [--max N]     run a command, print only errors + summary; full log in tools/ai/.cache/last_run.log
  diff [--hunks]          changed files vs HEAD with their STRUCTURE purpose; flags files missing from STRUCTURE.md
  secrets [--all]         scan staged additions (or all tracked files) for keys, tokens, passwords
  handoff                 write docs/HANDOFF.md (state for the next AI or device)
  cost                    what a cold start costs vs `start`
  map [DIR]               folder overview with file counts and tokens

Stdlib only. Never reads dist/, vendor/ or symbols.idx whole into the output.
"""
import math, os, re, subprocess

SKIP = ('dist/', 'vendor/', 'tools/ai-brain-kit/', 'tools/ai/.cache/')
CODE = ('.js', '.mjs', '.py', '.html', '.css', '.sh', '.json')
STOP = set('a an the of to in on for and or with is are be do does how what when where why which that this it its at by from as into can should would '
           'i me my we our you your add make fix change update create use using get set new old all any need want please code file files function'.split())
ANSI = re.compile(r'\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07]*\x07')
BAD = re.compile(r'(?i)\b(fail(ed|ure|ing)?|error|exception|traceback|fatal|assert(ion)?|denied|cannot|not found|undefined|timeout|✗|✖)\b|^E\s{2,}|FAILED|npm ERR|warning:')
SUMMARY = re.compile(r'(?i)(\d+\s+(passed|failed|passing|failing|errors?|warnings?|skipped|tests?)\b|^tests?:|^ran \d+|^all pass|^some failed|^=+ .* =+$|^real\s)')
PASSY = re.compile(r'(?i)^\s*(ok\b|pass(ed)?\b|✓|✔|\.+\s*$|-+\s*$|running |compiling )')
SECRETS = [('GitHub token', r'gh[pousr]_[A-Za-z0-9]{30,}'), ('GitHub fine-grained token', r'github_pat_[A-Za-z0-9_]{40,}'), ('AWS access key', r'\bAKIA[0-9A-Z]{16}\b'),
           ('Private key block', r'-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----'), ('API key (sk-)', r'\bsk-[A-Za-z0-9_-]{20,}'),
           ('Slack token', r'\bxox[baprs]-[A-Za-z0-9-]{10,}'), ('Google API key', r'\bAIza[0-9A-Za-z_-]{35}\b'), ('Stripe live key', r'\b[sr]k_live_[0-9A-Za-z]{16,}'),
           ('Razorpay key', r'\brzp_(?:live|test)_[0-9A-Za-z]{10,}'), ('Razorpay secret', r'(?i)razorpay[_-]?(?:key[_-]?)?secret[\'"]?\s*[:=]\s*[\'"][A-Za-z0-9]{16,}'),
           ('JWT', r'\beyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}'),
           ('Hard-coded secret', r'''(?i)\b(?:secret|passwd|password|api[_-]?key|access[_-]?token|auth[_-]?token)\b['"]?\s*[:=]\s*['"][A-Za-z0-9/+_=.-]{16,}['"]''')]


class Nav:
    """Holds the shared helpers from brain.py so this file never imports it back (no cycles)."""
    def __init__(self, root, sh, rd, tok):
        self.root, self.sh, self.rd, self.tok = root, sh, rd, tok
        self._files = None; self._text = {}; self._idx = None

    def p(self, rel):
        return os.path.join(self.root, rel)

    def files(self):
        if self._files is None:
            rc, o = self.sh('git ls-files')
            fs = [f for f in o.splitlines() if f] if rc == 0 and o.strip() else []
            if not fs:
                for d, ds, fn in os.walk(self.root):
                    ds[:] = [x for x in ds if x not in ('.git', 'node_modules', '__pycache__')]
                    fs += [os.path.relpath(os.path.join(d, f), self.root) for f in fn]
            self._files = sorted(f for f in fs if not f.startswith(SKIP) and os.path.isfile(self.p(f)))
        return self._files

    def text(self, rel):
        if rel not in self._text:
            try:
                self._text[rel] = '' if os.path.getsize(self.p(rel)) > 2_000_000 else self.rd(self.p(rel))
            except (OSError, UnicodeDecodeError):
                self._text[rel] = ''
        return self._text[rel]

    def idx(self):
        if self._idx is None:
            self._idx = []
            for l in self.rd(self.p('symbols.idx')).splitlines():
                a = l.split('\t')
                if l.startswith('#') or len(a) < 3 or ':' not in a[2]:
                    continue
                f, _, n = a[2].rpartition(':')
                if n.isdigit():
                    self._idx.append((a[0], a[1], f, int(n)))
        return self._idx

    def structure(self):
        d = {}
        for l in self.rd(self.p('STRUCTURE.md')).splitlines():
            m = re.match(r'- `([^`]+)`\s*[—-]*\s*(.*)', l)
            if m:
                d[m.group(1)] = m.group(2)
        return d

    @staticmethod
    def is_test(rel):
        return rel.startswith('tests/') or '/tests/' in rel or bool(re.search(r'(_test|\.test|test_)[^/]*$', rel))

    @staticmethod
    def stem(w):
        for suf in ('ing', 'ed', 'es', 's', 'ly'):
            if w.endswith(suf) and len(w) - len(suf) >= 3:
                return w[:-len(suf)]
        return w

    def toks(self, s, keep=False):
        out = []
        for m in re.findall(r'[A-Z]+(?![a-z])|[A-Z]?[a-z]+|\d+', s.replace('_', ' ').replace('-', ' ')):
            w = m.lower()
            if len(w) < 2 or (w in STOP and not keep):
                continue
            out.append(self.stem(w))
        return out

    def lessons(self):
        t = self.rd(self.p('docs/AI_LOG.md'))
        i, j = t.find('<!--LESSONS-->'), t.find('<!--/LESSONS-->')
        return [l.strip('- ').strip() for l in t[i:j].splitlines() if l.startswith('-')] if 0 <= i < j else []

    # ---------------------------------------------------------------- ctx
    def ctx(self, args):
        mx = 1500
        if '--max' in args:
            i = args.index('--max'); mx = int(args[i + 1]); args = args[:i] + args[i + 2:]
        task = ' '.join(args).strip()
        q = list(dict.fromkeys(self.toks(task)))
        if not q:
            print('usage: ctx "what you are about to do" [--max TOKENS]'); return 2
        st, idx = self.structure(), self.idx()
        by = {}
        for n, k, f, ln in idx:
            by.setdefault(f, []).append((n, ln))
        docs = {}
        for rel in self.files():
            if rel == 'symbols.idx':
                continue
            w = {}
            def add(ts, wt):
                for t in ts:
                    w[t] = w.get(t, 0) + wt
            parts = rel.split('/')
            add(self.toks('/'.join(parts[:-1])), 1.0); add(self.toks(parts[-1]), 3.0); add(self.toks(st.get(rel, '')), 2.0)
            for n, ln in by.get(rel, [])[:300]:
                add(self.toks(n), 1.5)
            docs[rel] = w
        N = max(1, len(docs)); df = {}
        for w in docs.values():
            for t in w:
                df[t] = df.get(t, 0) + 1
        scored = []
        for rel, w in docs.items():
            s, hit = 0.0, 0
            for t in q:
                tf = w.get(t, 0)
                if tf:
                    hit += 1; s += math.log(1 + N / (1 + df.get(t, 0))) * (tf / (tf + 1.5))
            if hit:
                s *= 0.55 + 0.45 * hit / len(q)
                if self.is_test(rel): s *= 0.8
                if re.search(r'(?i)\bgenerated\b|do not (hand-)?edit', st.get(rel, '')[:200]) or rel.endswith(('.bundle.html', '.min.js')): s *= 0.1
                scored.append((s, rel))
        if not scored:
            q = list(dict.fromkeys(self.toks(task, True)))
            for rel, w in docs.items():
                hit = [t for t in q if w.get(t)]
                if hit:
                    scored.append((sum(math.log(1 + N / (1 + df.get(t, 0))) for t in hit) / len(q), rel))
        scored.sort(key=lambda x: (-x[0], x[1]))
        top = [r for _, r in scored[:8]]
        out = ['ctx: "%s"   words: %s' % (task[:80], ' '.join(q[:10]))]
        if not top:
            out.append('nothing matched. Try other words, `map`, or `find NAME`.')
        else:
            out.append('FILES (best first)')
        for i, rel in enumerate(top, 1):
            syms = [(n, ln) for n, ln in by.get(rel, []) if set(self.toks(n)) & set(q)][:4]
            out.append('%d. %s%s' % (i, rel, (' - ' + st[rel][:100]) if st.get(rel) else ''))
            if syms:
                out.append('   symbols: ' + ', '.join('%s:%d' % s for s in syms))
        tests = []
        for rel in top[:4]:
            if not self.is_test(rel):
                tests += [t for t in self.tests_of(rel) if t not in tests and t not in top]
        if tests:
            out.append('TESTS likely relevant: ' + ', '.join(tests[:5]))
        ls = sorted(((len(set(self.toks(l)) & set(q)), l) for l in self.lessons()), key=lambda x: -x[0])
        ls = [l for s, l in ls if s >= 2][:4]
        if ls:
            out.append('LESSONS'); out += ['- ' + l[:200] for l in ls]
        out.append('NEXT: outline FILE | show SYMBOL | impact SYMBOL | tests-for FILE')
        text, total = [], 0
        for ln in out:
            t = self.tok(ln) + 1
            if total + t > mx:
                text.append('... (trimmed to ~%d tokens; --max for more)' % mx); break
            text.append(ln); total += t
        print('\n'.join(text)); return 0

    def tests_of(self, rel):
        s = re.sub(r'^\d+[-_.]', '', os.path.splitext(os.path.basename(rel))[0])
        bare = re.sub(r'[-_]', '', s).lower()
        syms = [r[0] for r in self.idx() if r[2] == rel and len(r[0]) > 5][:12]
        out = []
        for f in self.files():
            if not self.is_test(f) or f == rel:
                continue
            sc = 0
            if bare and bare in re.sub(r'[-_.]', '', os.path.basename(f).lower()): sc += 3
            t = self.text(f)
            if s and re.search(r'(?<![\w])%s(?![\w])' % re.escape(s), t): sc += 2
            sc += sum(1 for x in syms if x in t)
            if sc >= 2: out.append((sc, f))
        return [f for _, f in sorted(out, key=lambda x: (-x[0], x[1]))][:6]

    # ---------------------------------------------------------------- outline / show
    def outline(self, args):
        if not args:
            print('usage: outline FILE'); return 2
        c = [f for f in self.files() if f == args[0] or f.endswith('/' + args[0])]
        if not c:
            print('no such file: %s' % args[0]); return 1
        rel = c[0]; t = self.text(rel)
        print('%s  (%d lines, ~%d tokens)%s' % (rel, t.count('\n') + 1, self.tok(t), (' - ' + self.structure().get(rel, '')[:100]) if self.structure().get(rel) else ''))
        syms = sorted([r for r in self.idx() if r[2] == rel], key=lambda r: r[3])
        for n, k, _, ln in syms[:200]:
            print('%5d %-5s %s' % (ln, k, n))
        if not syms:
            print('(no indexed symbols; Read with offset)')
        return 0

    @staticmethod
    def body_range(lines, i0, py, maxn):
        n = len(lines); first = lines[i0]
        if py:
            ind = len(first) - len(first.lstrip()); last = i0; j = i0 + 1
            while j < n and j - i0 < 400:
                if lines[j].strip():
                    if len(lines[j]) - len(lines[j].lstrip()) <= ind and not lines[j].lstrip().startswith((')', ']', '}')):
                        break
                    last = j
                j += 1
            return i0, last
        depth, seen = 0, False
        for j in range(i0, min(n, i0 + 500)):
            s = re.sub(r'''("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)''', '', lines[j])
            s = re.sub(r'//.*$', '', s)
            depth += s.count('{') - s.count('}')
            if '{' in s: seen = True
            if seen and depth <= 0: return i0, j
            if not seen and j - i0 <= 3 and s.rstrip().endswith(';'): return i0, j
        return i0, min(n - 1, i0 + maxn)

    def show(self, args):
        if not args:
            print('usage: show NAME [--lines N] [--file PATH]'); return 2
        maxn = int(args[args.index('--lines') + 1]) if '--lines' in args else 80
        want = args[args.index('--file') + 1] if '--file' in args else None
        name = args[0]
        rows = [r for r in self.idx() if r[0] == name and (not want or r[2].endswith(want))] or \
               [r for r in self.idx() if r[0].lower() == name.lower() and (not want or r[2].endswith(want))]
        if not rows:
            print('no symbol "%s"; try: find %s' % (name, name[:6])); return 1
        if len(rows) > 1:
            print('%d definitions; showing the first. Others: %s' % (len(rows), ', '.join('%s:%d' % (r[2], r[3]) for r in rows[1:6])))
        _, _, rel, ln = rows[0]
        lines = self.text(rel).split('\n')
        a, b = self.body_range(lines, ln - 1, rel.endswith('.py'), maxn)
        seg = lines[a:b + 1]
        print('%s:%d-%d (%d lines)' % (rel, a + 1, b + 1, len(seg)))
        print('\n'.join(seg[:maxn]))
        if len(seg) > maxn:
            print('... +%d more lines (show %s --lines %d)' % (len(seg) - maxn, name, len(seg)))
        return 0

    # ---------------------------------------------------------------- impact / tests-for
    def impact(self, args):
        if not args:
            print('usage: impact NAME'); return 2
        name = args[0]
        defs = [r for r in self.idx() if r[0] == name]; defset = {(r[2], r[3]) for r in defs}
        rx = re.compile(r'(?<![\w$])%s(?![\w$])' % re.escape(name))
        call = re.compile(r'(?<![\w$])%s\s*\(' % re.escape(name))
        per = {}
        for f in self.files():
            if not f.endswith(CODE) or f == 'symbols.idx':
                continue
            t = self.text(f)
            if name not in t:
                continue
            for i, ln in enumerate(t.split('\n'), 1):
                if len(ln) > 600 or (f, i) in defset or not rx.search(ln):
                    continue
                per.setdefault(f, []).append((i, 'call' if call.search(ln) else 'ref'))
        tests = [f for f in per if self.is_test(f)]; srcs = sorted(f for f in per if not self.is_test(f))
        calls = sum(1 for f in srcs for _, k in per[f] if k == 'call')
        radius = 'HIGH' if len(srcs) > 12 else ('MEDIUM' if len(srcs) > 3 else 'LOW')
        print('%s: %s' % (name, ('defined ' + ', '.join('%s:%d' % (r[2], r[3]) for r in defs[:3])) if defs else 'no definition in symbols.idx (global, external or plain word?)'))
        print('blast radius: %s - %d source files (%d call sites), %d test files' % (radius, len(srcs), calls, len(tests)))
        for f in srcs[:30]:
            locs = per[f]
            print('  %s  %s' % (f, ' '.join('%d%s' % (n, '' if k == 'call' else 'r') for n, k in locs[:8]) + (' +%d' % (len(locs) - 8) if len(locs) > 8 else '')))
        if len(srcs) > 30:
            print('  ... +%d more files' % (len(srcs) - 30))
        if tests:
            print('tests that mention it: ' + ', '.join(tests[:8]))
        print('legend: 12=call 12r=mention')
        return 0

    def test_cmd(self, t):
        return ('node ' if t.endswith(('.js', '.mjs')) else 'python3 ') + t

    def tests_for(self, args):
        if not args:
            print('usage: tests-for FILE|SYMBOL'); return 2
        c = [f for f in self.files() if f == args[0] or f.endswith('/' + args[0])]
        if c:
            ts = self.tests_of(c[0])
        else:
            rx = re.compile(r'(?<![\w$])%s(?![\w$])' % re.escape(args[0]))
            ts = [f for f in self.files() if self.is_test(f) and rx.search(self.text(f))][:8]
        if not ts:
            print('no test mentions %s. Write one, or run brain.py tests --all.' % args[0]); return 0
        for t in ts:
            print('%s    %s' % (t, self.test_cmd(t)))
        return 0

    # ---------------------------------------------------------------- run
    @staticmethod
    def compress(text, rc, maxn=30):
        raw = [l.split('\r')[-1].rstrip() for l in ANSI.sub('', text).replace('\r\n', '\n').split('\n')]
        raw = [l for l in raw if l.strip()]
        n = len(raw); keep = set(); i = 0
        while i < n:
            l = raw[i]
            if l.startswith('Traceback'):
                j = i
                while j + 1 < n and raw[j + 1].startswith((' ', '\t')) and j - i < 40:
                    j += 1
                keep.update(range(i, min(n, j + 2))); i = j + 2; continue
            if BAD.search(l) and not PASSY.match(l):
                keep.update(range(max(0, i - 1), min(n, i + 3)))
            elif SUMMARY.search(l):
                keep.add(i)
            i += 1
        keep.update(range(max(0, n - 3), n))
        if rc == 0 and not any(BAD.search(x) and not PASSY.match(x) for x in raw):
            keep = set(range(max(0, n - 3), n)) | {k for k in range(n) if SUMMARY.search(raw[k])}
        out, prev, cnt = [], None, 0
        for k in sorted(keep):
            l = raw[k][:220]
            if l == prev:
                cnt += 1; continue
            if cnt: out[-1] += '  (x%d)' % (cnt + 1)
            prev, cnt = l, 0; out.append(l)
        if cnt: out[-1] += '  (x%d)' % (cnt + 1)
        if len(out) > maxn:
            out = out[:maxn - 8] + ['... (%d more kept lines hidden)' % (len(out) - maxn + 2)] + out[-6:]
        return out, n

    def run(self, args):
        maxn = 30
        if '--max' in args:
            i = args.index('--max'); maxn = int(args[i + 1]); args = args[:i] + args[i + 2:]
        cmd = ' '.join(args).strip()
        if not cmd:
            print('usage: run "command" [--max N]'); return 2
        rc, full = self.sh(cmd, 900)
        cache = os.path.join(self.root, 'tools', 'ai', '.cache'); os.makedirs(cache, exist_ok=True)
        open(os.path.join(cache, 'last_run.log'), 'w', encoding='utf-8').write('$ %s\nexit=%d\n%s\n' % (cmd, rc, full))
        lines, n = self.compress(full, rc, maxn)
        print('exit=%d  %d lines -> %d shown  (full: tools/ai/.cache/last_run.log; grep it)' % (rc, n, len(lines)))
        print('\n'.join(lines)); return rc

    # ---------------------------------------------------------------- diff / secrets
    def diff(self, args):
        rc, out = self.sh('git diff --numstat HEAD')
        if rc != 0:
            print('not a git repo or no commits'); return 1
        st = self.structure(); rows = []
        pre = self.sh('git rev-parse --show-prefix')[1].strip()
        for ln in out.splitlines():
            a = ln.split('\t')
            if len(a) == 3 and a[2].startswith(pre):
                rows.append((a[2][len(pre):], '+%s -%s' % (a[0], a[1])))
        for f in self.sh('git ls-files --others --exclude-standard')[1].splitlines():
            if f and f not in [r[0] for r in rows]:
                rows.append((f, 'new'))
        if not rows:
            print('no changes vs HEAD'); return 0
        print('%d files changed' % len(rows))
        for f, d in rows[:60]:
            print('%-12s %s  %s' % (d, f, ('- ' + st[f][:70]) if f in st else ''))
        new = [f for f, d in rows if d == 'new' and f not in st]
        if new:
            print('NOT YET IN STRUCTURE.md: ' + ', '.join(new[:10]))
        return 0

    def secrets(self, args):
        scan = []
        if '--all' in args:
            scan = [(f, i, l) for f in self.files() if f.endswith(CODE + ('.md', '.txt', '.env')) for i, l in enumerate(self.text(f).split('\n'), 1)]
        else:
            cur = None; ln = 0
            for l in self.sh('git diff --cached -U0')[1].split('\n'):
                if l.startswith('+++ b/'): cur = l[6:]
                elif l.startswith('@@'):
                    m = re.search(r'\+(\d+)', l); ln = int(m.group(1)) - 1 if m else 0
                elif l.startswith('+') and not l.startswith('+++'):
                    ln += 1; scan.append((cur, ln, l[1:]))
        hits = []
        for f, i, l in scan:
            if 'brain:allow-secret' in l or len(l) > 2000 or (f or '').endswith('tools/ai/brain_nav.py'):
                continue
            for name, rx in SECRETS:
                m = re.search(rx, l)
                if m:
                    v = m.group(0); hits.append((name, f, i, v[:6] + '...' + v[-2:])); break
        for name, f, i, v in hits[:30]:
            print('SECRET? %s  %s:%d  %s' % (name, f, i, v))
        print('secrets: %s' % ('%d suspicious lines (add `brain:allow-secret` on the line to whitelist)' % len(hits) if hits else 'none found'))
        return 1 if hits else 0

    # ---------------------------------------------------------------- handoff / cost / map
    def handoff(self, args):
        now = ''
        t = self.rd(self.p('docs/AI_LOG.md')); i, j = t.find('<!--NOW-->'), t.find('<!--/NOW-->')
        if 0 <= i < j:
            now = t[i + 10:j].strip()
        lg = [l for l in (t[t.find('<!--LOG-->'):t.find('<!--/LOG-->')].splitlines() if '<!--LOG-->' in t else []) if l.startswith('-')][:8]
        _, br = self.sh('git rev-parse --abbrev-ref HEAD'); _, ch = self.sh('git status --porcelain')
        md = ['# Handoff (generated by `brain.py handoff`)', '', '## Where things stand', now or '(nothing recorded yet)', '',
              '## Branch', '`%s`, %d changed files' % (br.strip(), len([x for x in ch.splitlines() if x.strip()])), '', '## Recent work'] + lg + \
             ['', '## Read first', '`AI_START.md`, then `python3 tools/ai/brain.py start`. Use `ctx "task"` before opening any file.']
        open(self.p('docs/HANDOFF.md'), 'w', encoding='utf-8').write('\n'.join(md) + '\n')
        print('wrote docs/HANDOFF.md (%d lines)' % len(md)); return 0

    def cost(self, args):
        import io, contextlib
        g, s = self.rd(self.p('AI_GUIDE.md')), self.rd(self.p('STRUCTURE.md'))
        files = self.files()
        rows = sorted(((self.tok(self.text(f)), f) for f in files), reverse=True)[:6]
        cold = self.tok(g) + self.tok(s)
        print('cold start (AI_GUIDE + STRUCTURE whole): ~%d tokens' % cold)
        print('AI_START.md: ~%d tokens (the new entry point)' % self.tok(self.rd(self.p('AI_START.md'))))
        print('whole tracked source (excluding dist/vendor): %d files, ~%s tokens. Never read it; use ctx/show.' % (len(files), format(sum(self.tok(self.text(f)) for f in files), ',')))
        print('costliest files to read whole:')
        for t, f in rows:
            print('  ~%7d  %s' % (t, f))
        return 0

    def map(self, args):
        d = (args[0] if args else '').strip('/'); depth = d.count('/') + 1 if d else 0
        agg = {}
        for f in self.files():
            if d and not f.startswith(d + '/'):
                continue
            parts = f.split('/')
            k = '/'.join(parts[:depth + 1]) + ('/' if len(parts) > depth + 1 else '')
            n, t = agg.get(k, (0, 0)); agg[k] = (n + 1, t + self.tok(self.text(f)))
        for k, (n, t) in sorted(agg.items(), key=lambda x: -x[1][1])[:40]:
            print('%-48s %5d files  ~%s tokens' % (k, n, format(t, ',')))
        return 0


def dispatch(cmd, args, root, sh, rd, tok):
    nav = Nav(root, sh, rd, tok)
    fn = {'ctx': nav.ctx, 'show': nav.show, 'outline': nav.outline, 'impact': nav.impact, 'tests-for': nav.tests_for, 'run': nav.run,
          'diff': nav.diff, 'secrets': nav.secrets, 'handoff': nav.handoff, 'cost': nav.cost, 'map': nav.map}[cmd]
    return fn(args)

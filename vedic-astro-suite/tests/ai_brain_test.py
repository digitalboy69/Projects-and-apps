# Test of tools/ai/brain.py on a temporary fixture tree (never touches the real log). Run: python3 tests/ai_brain_test.py
import os, subprocess, sys, tempfile, shutil
HERE = os.path.dirname(os.path.abspath(__file__)); BRAIN = os.path.join(HERE, '..', 'tools', 'ai', 'brain.py')
T = tempfile.mkdtemp(); res = []
def w(p, s):
    p = os.path.join(T, p); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'w').write(s)
def b(*a):
    e = dict(os.environ, BRAIN_ROOT=T, BRAIN_NO_GATE='1')
    r = subprocess.run([sys.executable, BRAIN] + list(a), capture_output=True, text=True, env=e, cwd=T)
    return r.returncode, r.stdout + r.stderr
def ok(n, c, d=''):
    res.append(bool(c)); print(('PASS ' if c else 'FAIL ') + n + ('' if c else ' - ' + str(d)[:200]))
w('AI_START.md', '# start\nSee `docs/AI_LOG.md` and `tools/ai/brain.py`.\n')
w('CLAUDE.md', 'Read `AI_START.md`.\n')
w('STRUCTURE.md', '# map\n- `docs/OLD_PLAN.md` — old plan\n- `apps/birth-chart/js/164-workspace-vars.js` — Workspace My variables engine\n- `apps/birth-chart/js/30-life-event-checker.js` — Life event checker for dasha events\n')
w('symbols.idx', '# header\nAWV\tobj\tapps/birth-chart/js/164-workspace-vars.js:5\tbirth-chart\ncomputeFate\tfn\tapps/birth-chart/js/75-fate-meter.js:14\tbirth-chart\n')
w('docs/OLD_PLAN.md', '# p\n- [x] a\n')
w('docs/SOME_PLAN.md', '# p\n- [x] a\n- [ ] next thing to do\n')
w('AI_GUIDE.md', '# g\n## 0a. Method\nmethod text\n## 2. Router\nrouter text\n## 3. Playbook\nplay\n')
w('tests/workspace_vars_test.js', '// covers 164-workspace-vars\n')
w('tests/workspace_other_test.py', '# other\n')
w('tests/pdf_x_test.py', '# pdf\n')
subprocess.run('git init -q && git add -A && git -c user.email=a@b -c user.name=t commit -qm init', shell=True, cwd=T)
# audit creates the log
rc, o = b('audit', '--fix'); ok('audit --fix creates docs/AI_LOG.md with its three blocks', os.path.exists(os.path.join(T, 'docs/AI_LOG.md')) and all(k in open(os.path.join(T, 'docs/AI_LOG.md')).read() for k in ('<!--NOW-->', '<!--LOG-->', '<!--LESSONS-->')), o)
rc, o = b('find', 'workspace', 'variables'); ok('find ranks the file with both words first', o.splitlines()[0].startswith('2/2') and '164-workspace-vars' in o.splitlines()[0], o)
rc, o = b('find', 'computefate'); ok('find returns symbol file:line', '75-fate-meter.js:14' in o, o)
rc, o = b('find', 'zzzznothing'); ok('find says when nothing matches', 'no match' in o and rc == 1, o)
rc, o = b('sec', '2'); ok('sec prints one section only', 'router text' in o and 'method text' not in o and 'play' not in o, o)
rc, o = b('sec', '0a'); ok('sec accepts 0a', 'method text' in o, o)
rc, o = b('start'); ok('start shows open plan with its next unchecked item, not finished plans', 'SOME_PLAN.md' in o and 'next thing to do' in o and 'OLD_PLAN' not in o, o)
ok('start reports a token estimate', 'tokens' in o)
rc, o = b('done', 'built the thing', '--lesson', 'Never do X -> do Y', '--pending', 'wait for push', '--decision', 'tone?')
log = open(os.path.join(T, 'docs/AI_LOG.md')).read()
ok('done writes LOG line, NOW block and the lesson', rc == 0 and 'built the thing' in log and 'Last task: built the thing' in log and 'Pending: wait for push' in log and 'Owner decisions waiting: tone?' in log and 'Never do X' in log, o + log)
rc, o = b('done', 'second task'); log = open(os.path.join(T, 'docs/AI_LOG.md')).read()
ok('done keeps the previous pending and decision when not given', 'Pending: wait for push' in log and 'Last task: second task' in log and log.index('second task') < log.index('built the thing'), log)
rc, o = b('done', 'third', '--clear'); log = open(os.path.join(T, 'docs/AI_LOG.md')).read()
ok('done --clear resets pending and decisions', 'Pending: nothing' in log and 'decisions waiting: none' in log, log)
b('learn', 'Never do X -> do Y!'); log = open(os.path.join(T, 'docs/AI_LOG.md')).read()
ok('learn does not store a near duplicate', log.count('Never do X') == 1, log)
b('learn', 'A totally different lesson'); log = open(os.path.join(T, 'docs/AI_LOG.md')).read()
ok('learn stores a new lesson', 'A totally different lesson' in log)
rc, o = b('start'); ok('start shows the lessons and last tasks', 'Never do X' in o and 'third' in o, o)
# cap + archive
for i in range(45): b('done', 'task number %d' % i)
log = open(os.path.join(T, 'docs/AI_LOG.md')).read(); arc = open(os.path.join(T, 'docs/AI_LOG_ARCHIVE.md')).read() if os.path.exists(os.path.join(T, 'docs/AI_LOG_ARCHIVE.md')) else ''
ok('log is capped at 40 lines and the overflow is archived, not lost', log.count('- 20') <= 40 + 2 and 'built the thing' in arc and 'task number 44' in log, (log.count('- 20'), arc[:100]))
# tests mapping
w('apps/birth-chart/js/164-workspace-vars.js', '//x\n'); w('apps/birth-chart/js/160-workspace-engine.js', '//y\n'); w('apps/birth-chart/js/110-pdf-x.js', '//z\n')
rc, o = b('tests'); ok('tests maps changed files to covering tests', 'workspace_vars_test.js' in o and 'workspace_other_test.py' in o and 'pdf_x_test.py' in o, o)
# entry-size cap and dead path
w('AI_START.md', '# start\n' + 'x' * 5000)
rc, o = b('audit'); ok('audit fails when AI_START.md is over the cap', rc == 1 and 'cap' in o, o)
w('AI_START.md', '# start\nUse `tools/ai/nothere.py` please.\n')
rc, o = b('audit'); ok('audit flags a dead path in AI_START.md', rc == 1 and 'nothere.py' in o, o)
w('AI_START.md', '# start\nUse `docs/AI_LOG.md`.\n')
rc, o = b('audit'); ok('audit passes again when fixed', rc == 0, o)
rc, o = b('new', 'my feat', 'My feature'); ok('new scaffolds a plan and its STRUCTURE line', rc == 0 and os.path.exists(os.path.join(T, 'docs/MY_FEAT_PLAN.md')) and 'docs/MY_FEAT_PLAN.md' in open(os.path.join(T, 'STRUCTURE.md')).read(), o)
rc, o = b('new', 'my feat', 'again'); ok('new refuses to overwrite', rc == 1, o)
# navigation commands (tools/ai/brain_nav.py) on the REAL repo, read-only
def real(*a):
    r = subprocess.run([sys.executable, BRAIN] + list(a), capture_output=True, text=True, cwd=os.path.join(HERE, '..'), env=dict(os.environ))
    return r.returncode, r.stdout + r.stderr
rc, o = real('ctx', 'fate meter score'); ok('ctx ranks the fate meter file first', rc == 0 and '75-fate-meter.js' in o.split('\n')[2], o)
rc, o = real('show', 'computeFate', '--lines', '3'); ok('show prints one function body, capped', rc == 0 and 'window.computeFate' in o and 'more lines' in o, o)
rc, o = real('outline', '75-fate-meter.js'); ok('outline lists symbols with line numbers', rc == 0 and 'computeFate' in o, o)
rc, o = real('impact', 'computeFate'); ok('impact reports a blast radius', rc == 0 and 'blast radius' in o, o)
rc, o = real('tests-for', 'apps/birth-chart/js/164-workspace-vars.js'); ok('tests-for maps a file to its test', 'workspace_vars_test.js' in o, o)
rc, o = real('run', 'python3 -c "import sys;print(1);sys.exit(3)"'); ok('run keeps the exit code and compresses', rc == 3 and 'exit=3' in o, o)
rc, o = real('secrets', '--all'); ok('secrets finds nothing in tracked files', rc == 0 and 'none found' in o, o)
rc, o = real('map'); ok('map lists folders with token counts', rc == 0 and 'apps/' in o and 'tokens' in o, o)
rc, o = real('ctx'); ok('ctx without words prints usage', rc == 2, o)
# real repo: the entry file really is under the cap and has no dead path
r = subprocess.run([sys.executable, BRAIN, 'audit'], capture_output=True, text=True, cwd=os.path.join(HERE, '..'), env=dict(os.environ))
ok('the real AI_START.md is under 4.5 KB with no dead paths', r.returncode == 0, r.stdout)
shutil.rmtree(T, ignore_errors=True)
print('ALL PASS' if all(res) else 'SOME FAILED'); sys.exit(0 if all(res) else 1)

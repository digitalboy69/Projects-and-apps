# Usage: python3 tests/syntax_check.py
# Runs `node --check` on every .js file of the project (apps, shell, shared, vendor, editions) and on every inline <script> in the index.html files. No browser needed.
import glob, os, re, subprocess, sys, tempfile
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); os.chdir(ROOT)
files = sorted(glob.glob('apps/*/js/*.js') + glob.glob('shell/js/*.js') + glob.glob('shared/*.js') + glob.glob('vendor/*.js') + glob.glob('editions/*/*.js'))
bad = 0
for p in files:
    r = subprocess.run(['node', '--check', p], capture_output=True, text=True)
    if r.returncode: bad += 1; print('SYNTAX ERROR', p, r.stderr[:600])
for p in ['index.html'] + sorted(glob.glob('apps/*/index.html')):
    html = open(p, encoding='utf-8').read()
    for i, js in enumerate(re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', html, re.S)):
        if not js.strip(): continue
        with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(js)
        r = subprocess.run(['node', '--check', f.name], capture_output=True, text=True); os.unlink(f.name)
        if r.returncode: bad += 1; print(f'SYNTAX ERROR in {p} inline script #{i}:\n{r.stderr[:600]}')
print(f'syntax: OK ({len(files)} files)' if not bad else f'syntax: {bad} problem(s)'); sys.exit(1 if bad else 0)

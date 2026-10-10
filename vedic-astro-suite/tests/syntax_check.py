# Usage: python3 tests/syntax_check.py [html]   (default: vedic-astro-suite-readable.html is not parsed; checks parts directly)
# Extracts every <script> body from the app parts and runs `node --check` on each. No browser needed.
import re, subprocess, glob, tempfile, os, sys
os.chdir(os.path.join(os.path.dirname(__file__), '..'))
apps = {'srcA': open('parts/srcA.html', encoding='utf-8').read(),
        'srcB': ''.join(open(p, encoding='utf-8').read() for p in sorted(glob.glob('parts/srcB_*.part'))),
        'srcN': open('parts/srcN.html', encoding='utf-8').read(), 'srcDev': open('parts/srcDev.html', encoding='utf-8').read()}
bad = 0
for name, html in apps.items():
    for i, js in enumerate(re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', html, re.S)):
        if not js.strip(): continue
        with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(js)
        r = subprocess.run(['node', '--check', f.name], capture_output=True, text=True); os.unlink(f.name)
        if r.returncode: bad += 1; print(f'SYNTAX ERROR in {name} script #{i}:\n{r.stderr[:600]}')
for p in ('parts/locpicker.js', 'parts/export_addon.js'):
    r = subprocess.run(['node', '--check', p], capture_output=True, text=True)
    if r.returncode: bad += 1; print('SYNTAX ERROR', p, r.stderr[:600])
print('syntax: OK' if not bad else f'syntax: {bad} problem(s)'); sys.exit(1 if bad else 0)

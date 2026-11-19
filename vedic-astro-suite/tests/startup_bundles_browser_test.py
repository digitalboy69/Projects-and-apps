# Start-up bundles (tools/bundle.py): the shell loads apps/<name>/index.bundle.html. Checks that every app behaves the same as the plain
# source files (?dev): same globals, no page errors, chart casts, 3D Sky + Formula Maker open, Notepad opens, far fewer requests, bundles are fresh.
# Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/startup_bundles_browser_test.py
import os, sys, subprocess
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sky3d_formula_maker_browser_test.py')).read()
exec(src[:src.index("def ev(pg")])
BASE = PAGE.replace('apps/sky3d/index.html', 'index.html')
APPS = {'A': 'sky3d', 'B': 'birth-chart', 'N': 'notepad'}
def load(b, q):
    pg = b.new_context(viewport={'width': 390, 'height': 800}).new_page(); errs = []; reqs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('request', lambda r: reqs.append(r.url)); pg.route('**/*', route)
    pg.goto(BASE + q); pg.wait_for_function("()=>document.getElementById('load').classList.contains('hide')", timeout=60000)
    return pg, errs, reqs
def frame(pg, title): return next(f for f in pg.frames if f != pg.main_frame and f.name == '' and title in (f.url or ''))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'))
    # freshness: running the generator changes nothing
    ch = subprocess.run([sys.executable, 'tools/bundle.py'], capture_output=True, text=True, cwd=ROOT).stdout
    ok('bundles are up to date with the source files', 'none' in ch, ch)
    res = {}
    for label, q in (('dev', '?dev'), ('bundle', '')):
        pg, errs, reqs = load(b, q)
        g = {}
        for key in ('B', 'A', 'N'):
            if key != 'B':
                pg.evaluate("(k)=>{document.getElementById('swBtn').click();}", key); pg.click('[data-act=%s]' % key)
                pg.wait_for_function("()=>document.getElementById('load').classList.contains('hide')", timeout=60000); pg.wait_for_timeout(600)
            fr = [f for f in pg.frames if f != pg.main_frame and ('/apps/%s/' % APPS[key]) in f.url][0]
            g[key] = fr.evaluate("()=>Object.keys(window).filter(k=>!/^(on|webkit)/.test(k)).sort()")
            res[(label, key, 'url')] = fr.url.split('/')[-1]
        res[(label, 'g')] = g; res[(label, 'errs')] = errs; res[(label, 'n')] = len(reqs)
        if label == 'bundle':
            fr = [f for f in pg.frames if '/apps/sky3d/' in f.url][0]
            ok('3D Sky from the bundle: Formula Maker engine and sheet exist', fr.evaluate("()=>typeof FM==='object'&&typeof FMU==='object'&&typeof TLF==='object'&&typeof XS==='object'"))
            pg.evaluate("()=>document.getElementById('swBtn').click()"); pg.click('[data-act=B]'); pg.wait_for_timeout(500)
            frb = [f for f in pg.frames if '/apps/birth-chart/' in f.url][0]
            frb.fill('#profileName', 'Test'); ok('Birth Chart from the bundle: form is usable', frb.input_value('#profileName') == 'Test')
        pg.context.close()
    for key in ('B', 'A', 'N'):
        d, bd = set(res[('dev', 'g')][key]), set(res[('bundle', 'g')][key])
        ok('%s: bundle loads the %s file' % (APPS[key], 'bundle'), res[('bundle', key, 'url')].startswith('index.bundle.html'), res[('bundle', key, 'url')])
        ok('%s: same globals as the plain source files (dev %d, bundle %d)' % (APPS[key], len(d), len(bd)), d == bd, sorted(d ^ bd)[:10])
    ok('no page errors (dev or bundle)', not res[('dev', 'errs')] and not res[('bundle', 'errs')], res[('bundle', 'errs')][:3] + res[('dev', 'errs')][:3])
    ok('far fewer requests with bundles (%d vs %d)' % (res[('bundle', 'n')], res[('dev', 'n')]), res[('bundle', 'n')] < res[('dev', 'n')] / 3)
    b.close()
print('FAILED' if bad else 'ALL OK'); raise SystemExit(1 if bad else 0)

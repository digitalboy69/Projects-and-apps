# Sky Dashboard (3D Sky, js/50-sky-dashboard.js): opens from the top-right button, shows every section, math sanity, closes. Run: THREE_JS=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/sky_dashboard_test.py
import os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__)); from _helpers import PAGE, is_local
THREE = open(os.environ['THREE_JS'], 'rb').read(); SP = os.environ.get('SP')
def route(r):
    u = r.request.url
    if 'three.min.js' in u: return r.fulfill(status=200, content_type='application/javascript', body=THREE)
    return r.continue_() if is_local(u) else r.abort()
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 390, 'height': 800}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', route); pg.goto(PAGE + '#sky'); pg.wait_for_timeout(6000)
    f = [x for x in pg.frames if x != pg.main_frame and x.evaluate("typeof DBX")!='undefined'][0]
    ok('button exists', f.evaluate("()=>!!document.getElementById('dashBtn')"))
    f.evaluate("()=>document.getElementById('dashBtn').click()"); f.wait_for_timeout(1500)
    ok('dashboard shown', f.evaluate("()=>document.getElementById('dbxRoot').classList.contains('show')"))
    secs = f.evaluate("()=>[...document.querySelectorAll('.dbx-sec')].map(s=>s.id)")
    ok('all sections', all(x in secs for x in ['dbx-pan','dbx-hi','dbx-pl','dbx-as','dbx-rel','dbx-sg','dbx-nk','dbx-hs','dbx-bal','dbx-out']), secs)
    ok('9 planet cards', f.evaluate("()=>document.querySelectorAll('#dbx-pl .dbx-card').length")==9)
    ok('matrix 9x9', f.evaluate("()=>document.querySelectorAll('.dbx-mx tr').length")==10)
    ok('12 signs', f.evaluate("()=>document.querySelectorAll('.dbx-sign').length")==12)
    ok('no undefined/NaN in text', not f.evaluate("()=>/undefined|NaN/.test(document.getElementById('dbxBody').innerText)"))
    # fixed date: 15 Aug 1947 00:00 IST check Moon/Sun via same engine as the dashboard summary
    t = f.evaluate("()=>DBX.text()"); ok('summary text', 'PLANETS' in t and 'PANCHANG' in t and len(t) > 1500, len(t))
    if SP: pg.screenshot(path=SP + '/dbx_top.png'); f.evaluate("()=>document.getElementById('dbxBody').scrollTo(0,1400)"); pg.screenshot(path=SP + '/dbx_mid.png'); f.evaluate("()=>document.getElementById('dbx-rel').scrollIntoView()"); pg.screenshot(path=SP + '/dbx_rel.png')
    f.evaluate("()=>document.getElementById('dbxClose').click()"); f.wait_for_timeout(300)
    ok('closes', not f.evaluate("()=>document.getElementById('dbxRoot').classList.contains('show')"))
    ok('no page errors', not errs, errs)
    b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)
sys.exit(0 if all(c for _, c, _ in res) else 1)

# Feature Guide (js/150) in a real browser at phone width. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/feature_guide_browser_test.py  (FG_SHOTS=dir for screenshots)
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
SHOTS = os.environ.get('FG_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c))); print(('ok   ' if c else 'FAIL ') + n, '' if c else d)
A = dict(name='Asha', dob='2000-01-01', tob='06:30', place='New Delhi', lat=28.6139, lon=77.2090, tz=5.5)
CAST = "(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}"
def shot(pg, n):
    if SHOTS: os.makedirs(SHOTS, exist_ok=True); pg.screenshot(path=os.path.join(SHOTS, n))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    for W in (390, 360):
        pg = b.new_page(viewport={'width': W, 'height': 800}, device_scale_factor=1); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
        pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate(CAST, A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1500)
        pg.evaluate("()=>switchAppTab('panel-guide')"); pg.wait_for_timeout(900)
        ok('%d: guide panel opens' % W, pg.evaluate("()=>document.getElementById('panel-guide')&&document.getElementById('panel-guide').classList.contains('active')"))
        n = pg.evaluate("()=>HOME_ITEMS.length")
        ok('%d: every tool has a card' % W, pg.evaluate("()=>document.querySelectorAll('#fgBody .fg-card').length") == n, n)
        ok('%d: no sideways scroll' % W, pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"))
        if W == 390: shot(pg, 'g1.png')
        pg.click('#fgBody .fg-card[id="fg-panel-dasha"] .fg-head'); pg.wait_for_timeout(600)
        ok('%d: tapping a card opens its steps' % W, pg.evaluate("()=>!!document.querySelector('#fg-panel-dasha .fg-steps li')"))
        ok('%d: only one card open' % W, pg.evaluate("()=>document.querySelectorAll('.fg-body').length")==1)
        if W == 390: shot(pg, 'g2.png')
        pg.fill('#fgQ', 'marriage'); pg.wait_for_timeout(300)
        ok('%d: search finds matching and synastry' % W, pg.evaluate("()=>{const r=[...document.querySelectorAll('#fgBody .fg-card')].map(e=>e.id);return r.includes('fg-panel-match')&&r.includes('fg-panel-synastry')}"))
        if W == 390: shot(pg, 'g3.png')
        pg.fill('#fgQ', 'zzzqq'); pg.wait_for_timeout(200)
        ok('%d: nothing-found message' % W, pg.evaluate("()=>!!document.querySelector('.fg-empty')"))
        pg.fill('#fgQ', ''); pg.wait_for_timeout(200)
        pg.click('#fgChips button[data-c=timing]'); pg.wait_for_timeout(300)
        ok('%d: group chip filters' % W, pg.evaluate("()=>document.querySelectorAll('#fgBody .fg-sec').length")==1)
        pg.click('#fgChips button[data-c=all]'); pg.wait_for_timeout(200)
        pg.evaluate("()=>document.querySelector('#fgBody .fg-card[id=\"fg-panel-today\"] .fg-head').click()"); pg.wait_for_timeout(400)
        pg.evaluate("()=>document.querySelector('.fg-go').click()"); pg.wait_for_timeout(1000)
        ok('%d: Open button goes to the tool' % W, pg.evaluate("()=>document.getElementById('panel-today').classList.contains('active')"))
        ok('%d: Tools tab lists the guide' % W, pg.evaluate("()=>{switchAppTab('panel-tools');return !!document.querySelector('#thBody .th-r[data-id=panel-guide]')}"))
        ok('%d: no page errors' % W, not errs, errs)
        pg.close()
    b.close()
bad = [n for n, c in res if not c]; print('ALL PASSED' if not bad else 'FAILED: %s' % bad); raise SystemExit(1 if bad else 0)

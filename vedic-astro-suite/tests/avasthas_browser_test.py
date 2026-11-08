# Planet States (js/134) in the real app: Home tile, panel, cards, phone width. Run: python3 tests/avasthas_browser_test.py  (AVS_SHOTS=dir saves screenshots)
import functools, http.server, os, socketserver, threading, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
SHOTS = os.environ.get('AVS_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
CAST = "(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}"
A = dict(name='Demo A', dob='2000-01-01', tob='06:30', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)
with sync_playwright() as p:
    kw = {'executable_path': CHROME} if os.path.exists(CHROME) else {}
    b = p.chromium.launch(**kw); pg = b.new_page(viewport={'width': 390, 'height': 800}, device_scale_factor=1); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate(CAST, A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1500)
    ok('Home has the Planet States tile', pg.evaluate("()=>!!document.querySelector('#panel-home [data-go=panel-avasthas]')"))
    pg.evaluate("()=>document.querySelector('#panel-home [data-go=panel-avasthas]').click()"); pg.wait_for_timeout(1000)
    ok('tile opens the active panel', pg.evaluate("()=>{const e=document.getElementById('panel-avasthas');return !!e&&e.classList.contains('active')}"))
    ok('seven planet cards with three chips each', pg.evaluate("()=>document.querySelectorAll('#panel-avasthas .avs-card').length===7&&document.querySelectorAll('#panel-avasthas .avs-card .avs-chip').length===21"))
    ok('no undefined/NaN in the panel', pg.evaluate("()=>!/undefined|NaN|\\[object/.test(document.getElementById('panel-avasthas').textContent)"))
    ok('no sideways scroll at 390px', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"))
    ok('Sun card matches the engine', pg.evaluate("()=>{const c=currentChartForModal;const D=AVS.compute(c).planets.Sun;const t=document.querySelector('#panel-avasthas .avs-card').textContent;return t.includes(D.baladi.state)&&t.includes(D.jagradadi.state)&&t.includes(D.deeptadi.state)}"))
    ok('no page errors', not errs, '; '.join(errs)[:200])
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        pg.evaluate("()=>window.scrollTo(0,0)"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(SHOTS, 'a0.png'))
        pg.evaluate("()=>document.querySelectorAll('#panel-avasthas .avs-card')[3].scrollIntoView()"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(SHOTS, 'a1.png'))
    b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print('ok  ' if c else 'FAIL', n, ('(' + d + ')') if (d and not c) else '')
sys.exit(1 if bad else 0)

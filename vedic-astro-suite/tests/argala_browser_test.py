# Argala (js/139) in the real app: Home tile, panel, cards, phone width. Run: python3 tests/argala_browser_test.py  (ARG_SHOTS=dir saves screenshots)
import functools, http.server, os, socketserver, threading, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
SHOTS = os.environ.get('ARG_SHOTS')
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
    ok('Home has the Argala tile', pg.evaluate("()=>!!document.querySelector('#panel-home [data-go=panel-argala]')"))
    pg.evaluate("()=>document.querySelector('#panel-home [data-go=panel-argala]').click()"); pg.wait_for_timeout(1000)
    ok('tile opens the active panel', pg.evaluate("()=>{const e=document.getElementById('panel-argala');return !!e&&e.classList.contains('active')}"))
    ok('twelve house rows, first one open', pg.evaluate("()=>document.querySelectorAll('#panel-argala .arg-row').length===12&&document.querySelectorAll('#panel-argala .arg-h.on').length===1&&!!document.querySelector('#panel-argala .arg-h.on .arg-d')"))
    ok('open house shows 4 pairs (3 + the special 5th) at least', pg.evaluate("()=>document.querySelectorAll('#panel-argala .arg-h.on .arg-p').length>=4"))
    pg.evaluate("()=>document.querySelector('#panel-argala [data-arg=\"7\"]').click()"); pg.wait_for_timeout(200)
    ok('tapping house 7 opens it and closes house 1', pg.evaluate("()=>document.querySelectorAll('#panel-argala .arg-h.on').length===1&&document.querySelector('#panel-argala .arg-h.on .arg-n').textContent==='7'"))
    ok('shown pairs match the engine for house 7', pg.evaluate("()=>{const h=ARG.compute(currentChartForModal)[6];const r=document.querySelectorAll('#panel-argala .arg-h.on .arg-p');return r.length===h.pairs.length&&[...r].every((e,i)=>e.classList.contains(h.pairs[i].state))}"))
    ok('standing count in the row equals the engine', pg.evaluate("()=>{const H=ARG.compute(currentChartForModal);return [...document.querySelectorAll('#panel-argala .arg-row .arg-c')].every((e,i)=>e.textContent===H[i].standing+' of 3 stand')}"))
    pg.evaluate("()=>document.querySelector('#panel-argala [data-arg=\"7\"]').click()"); pg.wait_for_timeout(200)
    ok('tapping again closes it', pg.evaluate("()=>document.querySelectorAll('#panel-argala .arg-h.on').length===0"))
    pg.evaluate("()=>document.querySelector('#panel-argala [data-arg=\"1\"]').click()"); pg.wait_for_timeout(200)
    ok('no undefined/NaN, no sideways scroll', pg.evaluate("()=>!/undefined|NaN|\\[object/.test(document.getElementById('panel-argala').textContent)&&document.documentElement.scrollWidth<=window.innerWidth+1"))
    ok('no page errors', not errs, '; '.join(errs)[:200])
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        pg.evaluate("()=>window.scrollTo(0,0)"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(SHOTS, 'g0.png')); pg.evaluate("()=>document.querySelector('#panel-argala .arg-h.on').scrollIntoView()"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(SHOTS, 'g1.png'))
    b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print('ok  ' if c else 'FAIL', n, ('(' + d + ')') if (d and not c) else '')
sys.exit(1 if bad else 0)

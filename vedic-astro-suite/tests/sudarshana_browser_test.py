# Sudarshana Chakra (js/138) in the real app: Home tile, panel, cards, phone width. Run: python3 tests/sudarshana_browser_test.py  (SDC_SHOTS=dir saves screenshots)
import functools, http.server, os, socketserver, threading, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
SHOTS = os.environ.get('SDC_SHOTS')
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
    ok('Home has the Sudarshana tile', pg.evaluate("()=>!!document.querySelector('#panel-home [data-go=panel-sudarshana]')"))
    pg.evaluate("()=>document.querySelector('#panel-home [data-go=panel-sudarshana]').click()"); pg.wait_for_timeout(1000)
    ok('tile opens the active panel', pg.evaluate("()=>{const e=document.getElementById('panel-sudarshana');return !!e&&e.classList.contains('active')}"))
    ok('drawing has 36 cells and 27 planet glyphs', pg.evaluate("()=>document.querySelectorAll('#panel-sudarshana .sdc-cell').length===36&&document.querySelectorAll('#panel-sudarshana .sdc-pl').length===27"))
    ok('exactly 3 highlighted cells (one per ring) carry the gold fill', pg.evaluate("()=>document.querySelectorAll('#panel-sudarshana .sdc-cell.on').length===3&&[...document.querySelectorAll('#panel-sudarshana .sdc-cell.on')].every(e=>getComputedStyle(e).fill.indexOf('url')===0||e.getAttribute('style').indexOf('sdcGold')>0)"))
    y0 = pg.evaluate("()=>+document.getElementById('sdcYear').value")
    pg.evaluate("()=>document.querySelector('#panel-sudarshana [data-sdc=step][data-d=\"1\"]').click()"); pg.wait_for_timeout(200)
    y1 = pg.evaluate("()=>+document.getElementById('sdcYear').value")
    ok('plus button moves the year and the centre label follows', y1 == y0 + 1 and pg.evaluate("()=>document.querySelector('#panel-sudarshana .sdc-cn').textContent")==str(y1), '%s->%s' % (y0, y1))
    ok('active house matches the engine for that year', pg.evaluate("()=>{const y=+document.getElementById('sdcYear').value;const D=SDC.compute(currentChartForModal,y);const o=D.house+(['st','nd','rd'][D.house-1]||'th')+' house';return document.querySelector('#panel-sudarshana .sdc-sum').textContent.indexOf(o)>=0}"))
    pg.evaluate("()=>{const i=document.getElementById('sdcYear');i.value=13;i.dispatchEvent(new Event('change',{bubbles:true}))}"); pg.wait_for_timeout(200)
    ok('typing year 13 shows the 1st house again', pg.evaluate("()=>/1st house/.test(document.querySelector('#panel-sudarshana .sdc-sum').textContent)"))
    pg.evaluate("()=>document.querySelector('#panel-sudarshana [data-sdc=now]').click()"); pg.wait_for_timeout(200)
    ok('Now returns to the current year of life', pg.evaluate("()=>+document.getElementById('sdcYear').value===SDC.currentYear(currentChartForModal)"))
    ok('three ring rows', pg.evaluate("()=>document.querySelectorAll('#panel-sudarshana .sdc-r').length===3"))
    ok('no undefined/NaN, no sideways scroll', pg.evaluate("()=>!/undefined|NaN|\\[object/.test(document.getElementById('panel-sudarshana').textContent)&&document.documentElement.scrollWidth<=window.innerWidth+1"))
    ok('no page errors', not errs, '; '.join(errs)[:200])
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        pg.evaluate("()=>window.scrollTo(0,0)"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(SHOTS, 'c0.png')); pg.evaluate("()=>document.querySelector('#panel-sudarshana .sdc-sum').scrollIntoView()"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(SHOTS, 'c1.png'))
    b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print('ok  ' if c else 'FAIL', n, ('(' + d + ')') if (d and not c) else '')
sys.exit(1 if bad else 0)

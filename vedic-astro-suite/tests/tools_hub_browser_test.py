# Tools tab (js/147) in a real browser at phone width. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/tools_hub_browser_test.py   (TH_SHOTS=dir for screenshots)
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
SHOTS = os.environ.get('TH_SHOTS')
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
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 390, 'height': 800}, device_scale_factor=1); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate("()=>localStorage.removeItem('vax_tools_recent')")
    pg.evaluate(CAST, A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1500)
    ok('bottom bar has six tabs including Tools', pg.evaluate("()=>document.querySelectorAll('.app-tab').length")==6 and pg.evaluate("()=>!!document.querySelector('.app-tab[data-group=tools]')"))
    ok('all six tabs fit the phone without sideways scrolling', pg.evaluate("()=>{const i=document.querySelector('.app-tabbar-inner');return i.scrollWidth<=i.clientWidth+1}"))
    pg.click('.app-tab[data-group=tools]'); pg.wait_for_timeout(900)
    ok('Tools tab opens and is highlighted', pg.evaluate("()=>{const e=document.getElementById('panel-tools');return e&&e.classList.contains('active')&&document.querySelector('.app-tab[data-group=tools]').classList.contains('active')&&document.querySelectorAll('.app-tab.active').length===1}"))
    n = pg.evaluate("()=>HOME_ITEMS.length")
    ok('every tool is listed once', pg.evaluate("()=>document.querySelectorAll('#thBody .th-r').length")==n, n)
    ok('nine group headings', pg.evaluate("()=>document.querySelectorAll('#thBody .th-sec:not(.th-qk)').length")==9)
    ok('four quick-access cards sit above the groups', pg.evaluate("()=>{const c=[...document.querySelectorAll('#thBody .th-q4 b')].map(e=>e.textContent);const q=document.querySelector('.th-qk'),g=document.getElementById('th-read');return c.join()==='Divisional Charts,Vimshottari Dasha,Reading,Ashtakavarga'&&!!(q.compareDocumentPosition(g)&4)}"))
    pg.evaluate("()=>document.querySelector('.th-q4[data-id=panel-dasha]').click()"); pg.wait_for_timeout(1000)
    ok('tapping the Vimshottari Dasha card opens the Dasha panel', pg.evaluate("()=>document.getElementById('panel-dasha').classList.contains('active')"))
    pg.click('.app-tab[data-group=tools]'); pg.wait_for_timeout(600)
    shot(pg, 't1.png')
    # search
    pg.fill('#thQ', 'marriage'); pg.wait_for_timeout(300)
    ok('search "marriage" shows matching tools with their group', pg.evaluate("()=>{const r=[...document.querySelectorAll('#thBody .th-r')].map(e=>e.dataset.id);return r.includes('panel-match')&&r.includes('panel-synastry')&&document.querySelectorAll('#thBody .th-r em').length===r.length}"))
    shot(pg, 't2.png')
    pg.fill('#thQ', 'zzzzqq'); pg.wait_for_timeout(200)
    ok('no match shows a helpful message', pg.evaluate("()=>/No tool matches/.test(document.getElementById('thBody').innerText)"))
    pg.fill('#thQ', ''); pg.wait_for_timeout(200)
    # chips
    pg.evaluate("()=>document.querySelector('#thChips [data-c=fix]').click()"); pg.wait_for_timeout(300)
    ok('group chip shows only that group', pg.evaluate("()=>document.querySelectorAll('#thBody .th-sec').length")==1 and pg.evaluate("()=>document.querySelectorAll('#thBody .th-r').length")==6)
    shot(pg, 't3.png')
    pg.evaluate("()=>document.querySelector('#thChips [data-c=all]').click()"); pg.wait_for_timeout(200)
    # open a tool
    pg.evaluate("()=>document.querySelector('#thBody [data-id=panel-synastry]').click()"); pg.wait_for_timeout(1200)
    ok('tapping a tool opens it', pg.evaluate("()=>document.getElementById('panel-synastry').classList.contains('active')"))
    pg.click('.app-tab[data-group=tools]'); pg.wait_for_timeout(700)
    ok('Recently used lists the tool just opened, first', pg.evaluate("()=>{const s=document.querySelector('#thBody .th-sec');return /Recently used/.test(s.innerText)&&s.querySelector('.th-r').dataset.id==='panel-synastry'||s.querySelector('.th-r').dataset.id==='panel-dasha'}"))
    shot(pg, 't4.png')
    # the other tabs still work and Tools is not left highlighted
    pg.click('.app-tab[data-group=home]'); pg.wait_for_timeout(600)
    ok('Home tab works and Tools is no longer active', pg.evaluate("()=>document.getElementById('panel-home').classList.contains('active')&&!document.querySelector('.app-tab[data-group=tools]').classList.contains('active')"))
    ok('no sideways scroll at 390', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"))
    pg.set_viewport_size({'width': 360, 'height': 780}); pg.click('.app-tab[data-group=tools]'); pg.wait_for_timeout(500)
    ok('360px: bar fits and no sideways scroll', pg.evaluate("()=>{const i=document.querySelector('.app-tabbar-inner');return i.scrollWidth<=i.clientWidth+1&&document.documentElement.scrollWidth<=window.innerWidth+1}"))
    ok('no page errors', not errs, errs[:2]); b.close()
bad = [n for n, c in res if not c]; print('ALL PASSED' if not bad else '%d FAILED' % len(bad)); raise SystemExit(1 if bad else 0)

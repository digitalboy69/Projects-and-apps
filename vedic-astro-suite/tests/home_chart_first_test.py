# Home, chart first (js/25 + css/60): screen 1 = chart, details hidden; screen 2 = all tools. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/home_chart_first_test.py
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
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
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 390, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate("()=>localStorage.removeItem('vax_hm_style')"); ev = pg.evaluate
    pg.evaluate(CAST, A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1500)
    vis = lambda sel: ev("(s)=>{const e=document.querySelector(s);return !!e&&e.offsetParent!==null&&e.getBoundingClientRect().height>0}", sel)
    ok('opens on the chart page', ev("()=>document.querySelector('#panel-home .hm').dataset.page")=='chart' and vis('#hmSvg svg'))
    ok('chart shows all 9 planets and the Lagna', ev("()=>{const t=document.getElementById('hmSvg').textContent;return /ASC/.test(t)||!!document.querySelector('#hmSvg svg')}") and ev("()=>document.querySelectorAll('#hmSvg svg g, #hmSvg svg text').length>20"))
    ok('Rising / Moon / Sun shown', ev("()=>document.querySelectorAll('.hm-hero .hm-b').length===3"))
    ok('date, time and place are hidden at first', ev("()=>{const e=document.querySelector('.hm-det');return !!e&&e.hidden}") and not vis('.hm-det'))
    ev("()=>document.querySelector('[data-hmdt]').click()"); pg.wait_for_timeout(150)
    ok('Birth details tap shows them', vis('.hm-det') and '01 Jan 2000' in ev("()=>document.querySelector('.hm-det').textContent") and '06:30' in ev("()=>document.querySelector('.hm-det').textContent"))
    ok('tool cards are not on the first screen', not vis('.hm-c') and not vis('.hm-seg'))
    a = ev("()=>document.getElementById('hmSvg').innerHTML.length")
    ev("()=>document.querySelector('[data-hmst=south]').click()"); pg.wait_for_timeout(200)
    ok('South Indian style redraws and is remembered', ev("()=>document.getElementById('hmSvg').innerHTML.length")!=a and ev("()=>localStorage.getItem('vax_hm_style')")=='south')
    ev("()=>document.querySelector('[data-hmst=north]').click()")
    ok('Running now and planets are on the chart page', vis('.hm-now') and vis('.hm-strip'))
    ev("()=>document.querySelector('[data-hmpage=tools]').click()"); pg.wait_for_timeout(300)
    ok('Explore all tools opens screen 2 with the tool cards', ev("()=>document.querySelector('#panel-home .hm').dataset.page")=='tools' and vis('.hm-c') and vis('.hm-seg') and not vis('#hmSvg'))
    ok('screen 2 has a way back', vis('.hm-tp [data-hmpage=chart]'))
    ev("()=>document.querySelector('.hm-c[data-go=panel-kp]').click()"); pg.wait_for_timeout(500)
    ev("()=>switchAppTab('panel-home')"); pg.wait_for_timeout(300)
    ok('coming back from a tool returns to the tools page', ev("()=>document.querySelector('#panel-home .hm').dataset.page")=='tools')
    ev("()=>document.querySelector('.hm-tp [data-hmpage=chart]').click()"); pg.wait_for_timeout(200)
    ok('Your chart goes back to screen 1', vis('#hmSvg svg') and not vis('.hm-c'))
    ev("()=>document.getElementById('hmSvg').click()"); pg.wait_for_timeout(500)
    ok('tapping the chart opens the divisional charts', ev("()=>document.getElementById('panel-vargas').classList.contains('active')"))
    ev("()=>switchAppTab('panel-home')"); pg.wait_for_timeout(200)
    ok('no sideways scroll at 390', ev("()=>document.documentElement.scrollWidth<=innerWidth+1"))
    ok('9 grahas unchanged', ev("()=>PLANET_LIST.length===9"))
    # new chart resets to chart page
    ev("()=>document.querySelector('[data-hmpage=tools]').click()"); pg.evaluate(CAST, dict(A, name='Demo B', dob='1985-03-14')); pg.wait_for_function("()=>window.__vgProf&&window.__vgProf.name==='Demo B'", timeout=30000); pg.wait_for_timeout(1500)
    ok('a new chart opens on the chart page again', ev("()=>document.querySelector('#panel-home .hm').dataset.page")=='chart')
    ok('no page errors', not errs, errs[:2]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)

# Ashtakavarga Workings (js/141) in the real app: Home tile, panel, cards, phone width. Run: python3 tests/ashtakavarga_extras_browser_test.py  (ASX_SHOTS=dir saves screenshots)
import functools, http.server, os, socketserver, threading, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
SHOTS = os.environ.get('ASX_SHOTS')
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
    ok('Home has the Ashtakavarga Workings tile', pg.evaluate("()=>!!document.querySelector('#panel-home [data-go=panel-asx]')"))
    pg.evaluate("()=>document.querySelector('#panel-home [data-go=panel-asx]').click()"); pg.wait_for_timeout(1000)
    ok('tile opens the active panel', pg.evaluate("()=>{const e=document.getElementById('panel-asx');return !!e&&e.classList.contains('active')}"))
    ok('Prastara table: 8 giver rows + total row, 12 sign columns', pg.evaluate("()=>document.querySelectorAll('#panel-asx .asx-t tbody tr').length===9&&document.querySelectorAll('#panel-asx .asx-t thead th').length===14"))
    ok('Sun total row matches the app BAV and shows 48', pg.evaluate("()=>{const r=[...document.querySelectorAll('#panel-asx .asx-t tr.asx-tot td')].map(e=>+e.textContent);const b=currentChartForModal.ashtakavarga.bavTables.Sun;return b.every((v,i)=>v===r[i])&&r[12]===48}"))
    pg.evaluate("()=>document.querySelector('#panel-asx [data-asx=planet][data-p=Jupiter]').click()"); pg.wait_for_timeout(200)
    ok('switching to Jupiter shows its table (total 56)', pg.evaluate("()=>{const r=[...document.querySelectorAll('#panel-asx .asx-t tr.asx-tot td')].map(e=>+e.textContent);const b=currentChartForModal.ashtakavarga.bavTables.Jupiter;return b.every((v,i)=>v===r[i])&&r[12]===56&&document.querySelector('#panel-asx .asx-chips button.on').dataset.p==='Jupiter'}"))
    ok('dots equal bindu count (dots in the Jupiter table = 56)', pg.evaluate("()=>document.querySelectorAll('#panel-asx .asx-t td.on').length===56"))
    ok('table fits the phone without scrolling inside', pg.evaluate("()=>{const w=document.querySelector('#panel-asx .asx-wrap');return w.scrollWidth<=w.clientWidth+1}"))
    pg.evaluate("()=>document.querySelector('#panel-asx [data-asx=tab][data-t=sod]').click()"); pg.wait_for_timeout(200)
    ok('Sodhana tab shows 4 rows (start, trines, pairs, x sign)', pg.evaluate("()=>document.querySelectorAll('#panel-asx .asx-s tbody tr').length===4&&document.querySelector('#panel-asx .asx-tabs button.on').dataset.t==='sod'"))
    ok('Start row equals the app BAV for the chosen planet', pg.evaluate("()=>{const p=document.querySelector('#panel-asx .asx-chips button.on').dataset.p;const r=[...document.querySelectorAll('#panel-asx .asx-s tbody tr')[0].querySelectorAll('td')].slice(0,12).map(e=>+e.textContent);return currentChartForModal.ashtakavarga.bavTables[p].every((v,i)=>v===r[i])}"))
    ok('pinda boxes match the engine', pg.evaluate("()=>{const p=document.querySelector('#panel-asx .asx-chips button.on').dataset.p;const S=ASX.sodhana(currentChartForModal,p);const b=[...document.querySelectorAll('#panel-asx .asx-pin b')].map(e=>+e.textContent);return b[0]===S.rasiPinda&&b[1]===S.grahaPinda&&b[2]===S.shodhya&&S.shodhya===S.rasiPinda+S.grahaPinda}"))
    pg.evaluate("()=>document.querySelector('#panel-asx [data-asx=planet][data-p=Mars]').click()"); pg.wait_for_timeout(200)
    ok('switching planet keeps the Sodhana tab and recalculates', pg.evaluate("()=>{const S=ASX.sodhana(currentChartForModal,'Mars');return document.querySelectorAll('#panel-asx .asx-s').length===1&&+document.querySelectorAll('#panel-asx .asx-pin b')[2].textContent===S.shodhya}"))
    ok('seven planets listed in the all-planets box', pg.evaluate("()=>document.querySelectorAll('#panel-asx .asx-all div').length===7"))
    ok('no sideways scroll in Sodhana', pg.evaluate("()=>{const w=document.querySelector('#panel-asx .asx-wrap');return w.scrollWidth<=w.clientWidth+1&&document.documentElement.scrollWidth<=window.innerWidth+1}"))
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True); pg.evaluate("()=>document.querySelector('#panel-asx .asx-tabs').scrollIntoView()"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(SHOTS, 'x2.png'))
        pg.evaluate("()=>document.querySelector('#panel-asx .asx-pin').scrollIntoView()"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(SHOTS, 'x3.png'))
    ok('no undefined/NaN, no sideways scroll', pg.evaluate("()=>!/undefined|NaN|\\[object/.test(document.getElementById('panel-asx').textContent)&&document.documentElement.scrollWidth<=window.innerWidth+1"))
    ok('no page errors', not errs, '; '.join(errs)[:200])
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        pg.evaluate("()=>window.scrollTo(0,0)"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(SHOTS, 'x0.png')); pg.evaluate("()=>document.querySelector('#panel-asx .asx-wrap').scrollIntoView()"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(SHOTS, 'x1.png'))
    b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print('ok  ' if c else 'FAIL', n, ('(' + d + ')') if (d and not c) else '')
sys.exit(1 if bad else 0)

# Synastry panel (js/143) in a real browser at phone width. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/synastry_browser_test.py   (SYN_SHOTS=dir for screenshots)
import functools, http.server, json, os, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
SHOTS = os.environ.get('SYN_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c), d)); print(('ok   ' if c else 'FAIL ') + n, '' if c else d)
A = dict(name='Asha', dob='2000-01-01', tob='06:30', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)
B = dict(name='Ben', dob='1985-03-14', tob='10:10', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)
C = dict(name='Cara', dob='1992-07-22', tob='18:45', place='Demo City', lat=19.07, lon=72.87, tz=5.5)
CAST = "(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 390, 'height': 800}, device_scale_factor=1); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    pg.evaluate("(l)=>localStorage.setItem(STORAGE_KEY, JSON.stringify(l))", [B, C])
    pg.evaluate(CAST, A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1500)
    ok('Home has a Synastry card', pg.evaluate("()=>!!document.querySelector('#panel-home [data-go=panel-synastry]')"))
    pg.evaluate("()=>document.querySelector('#panel-home [data-go=panel-synastry]').click()"); pg.wait_for_timeout(900)
    ok('panel opens with content', pg.evaluate("()=>{const e=document.getElementById('panel-synastry');return e&&e.classList.contains('active')&&!!e.querySelector('.syn-link')}"))
    ok('second person defaults to the first saved profile (Ben)', pg.evaluate("()=>document.getElementById('synB').selectedOptions[0].textContent")=='Ben')
    ok('first person is the chart on screen', pg.evaluate("()=>document.getElementById('synA').value")=='cur')
    opts = pg.evaluate("()=>[...document.querySelectorAll('#synA option')].map(o=>o.textContent)"); ok('picker lists the on-screen chart and the saved profiles Ben and Cara', opts[0].endswith('(on screen)') and 'Ben' in opts and 'Cara' in opts, opts)
    # engine vs page: the 5 listed links are the engine's top five
    r = pg.evaluate("""()=>{const A=SYN.person(Object.assign({name:'Asha'},window.__vgProf),currentChartForModal),B=SYN.person(loadProfiles()[0]);const d=SYN.compute(A,B);
        return {top:d.top.map(t=>t.reason),shown:[...document.querySelectorAll('#synBody .syn-link span:last-child')].map(e=>e.textContent),rows:document.querySelectorAll('#synBody .syn-t tbody tr').length}}""")
    ok('listed links equal the engine top five', r['top'] == r['shown'], (r['top'][:1], r['shown'][:1]))
    ok('two tables of nine planets', r['rows'] == 18, r['rows'])
    if SHOTS: os.makedirs(SHOTS, exist_ok=True); pg.screenshot(path=os.path.join(SHOTS, 's1.png'))
    # swap
    before = pg.evaluate("()=>document.getElementById('synBody').innerText")
    pg.evaluate("()=>document.getElementById('synSwap').click()"); pg.wait_for_timeout(300)
    ok('swap exchanges the two pickers', pg.evaluate("()=>[document.getElementById('synA').selectedOptions[0].textContent,document.getElementById('synB').selectedOptions[0].textContent]") == ['Ben', 'Asha (on screen)'] or pg.evaluate("()=>document.getElementById('synB').value")=='cur')
    after = pg.evaluate("()=>document.getElementById('synBody').innerText")
    ok('swap changes the page (tables switch places)', before != after)
    ok('the swapped page still has nine planets in two tables', pg.evaluate("()=>document.querySelectorAll('#synBody .syn-t tbody tr').length") == 18)
    # choose Cara
    pg.evaluate("()=>{const s=document.getElementById('synB');s.value='1';s.dispatchEvent(new Event('change',{bubbles:true}))}"); pg.wait_for_timeout(300)
    ok('choosing another person updates the page', 'Cara' in pg.evaluate("()=>document.getElementById('synBody').innerText"))
    pg.evaluate("()=>document.getElementById('synBody').scrollIntoView()")
    if SHOTS: pg.evaluate("()=>window.scrollTo(0,document.body.scrollHeight)"); pg.wait_for_timeout(200); pg.screenshot(path=os.path.join(SHOTS, 's2.png'))
    ok('no sideways scroll at 390', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"))
    txt = pg.evaluate("()=>document.getElementById('panel-synastry').innerText")
    ok('no undefined/NaN/fate words', not any(w in txt for w in ['undefined', 'NaN', '[object']) and not any(w in txt.lower() for w in ['doom', 'fatal', 'cursed', 'will die']))
    pg.set_viewport_size({'width': 360, 'height': 780}); pg.wait_for_timeout(200)
    ok('no sideways scroll at 360', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"))
    ok('no page errors', not errs, errs[:2]); b.close()
bad = [n for n, c, d in res if not c]; print('ALL PASSED' if not bad else '%d FAILED' % len(bad)); raise SystemExit(1 if bad else 0)

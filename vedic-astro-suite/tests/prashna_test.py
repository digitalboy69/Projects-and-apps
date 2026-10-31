# Prashna chart (js/123-prashna.js): Ithasala maths, topic houses, panel behaviour. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/prashna_test.py
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
    pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate(CAST, A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1500)
    k = lambda ms, md, ss, sd, mr=False: pg.evaluate("([ms,md,ss,sd])=>{const r=PRN.ithasala('Moon','Saturn',{Moon:{sign:ms,degInSign:md},Saturn:{sign:ss,degInSign:sd}});return r&&r.kind}", [ms, md, ss, sd])
    ok('Ithasala: faster Moon behind slower Saturn in trine', k(0, 10, 4, 15) == 'Ithasala')
    ok('Easarapha: Moon already past Saturn', k(0, 20, 4, 15) == 'Easarapha')
    ok('No link when gap beyond orb', k(0, 0, 4, 15) is None)
    ok('No link without a Tajika aspect', k(0, 10, 1, 15) is None)
    ok('Sextile and opposition count', k(0, 10, 2, 12) == 'Ithasala' and k(0, 10, 6, 12) == 'Ithasala')
    ok('Topic houses', pg.evaluate("()=>{const m=Object.fromEntries(PRN.TOPICS.map(t=>[t[0],t[3]]));return m.marriage===7&&m.career===10&&m.money===2&&m.gains===11&&m.children===5&&m.home===4&&m.abroad===12}"))
    ok('Compute gives reading for every topic', pg.evaluate("()=>PRN.TOPICS.every(t=>{const d=PRN.compute(currentChartForModal,t[0]);return d.items.length>=4&&d.house>=1&&d.lean})"))
    pg.evaluate("()=>document.querySelector('#panel-home [data-go=panel-prashna]').click()"); pg.wait_for_timeout(900)
    ok('Home card opens Prashna with chart and readings', pg.evaluate("()=>{const e=document.getElementById('panel-prashna');return e&&e.classList.contains('active')&&!!e.querySelector('.prn-svg svg')&&e.querySelectorAll('.prn-i').length>=4&&!!e.querySelector('.prn-hero')}"))
    pg.evaluate("()=>document.querySelector('[data-prn-t=career]').click()"); pg.wait_for_timeout(300)
    ok('Topic chip redraws', 'Job / career' in pg.evaluate("()=>document.querySelector('.prn-hero').innerText") and '10th house' in pg.evaluate("()=>document.querySelector('.prn-hero').innerText"))
    pg.evaluate("()=>document.querySelector('[data-prn-st=south]').click()"); pg.wait_for_timeout(300)
    ok('South Indian style draws', pg.evaluate("()=>!!document.querySelector('.prn-svg svg')&&document.querySelector('[data-prn-st=south]').classList.contains('on')"))
    pg.evaluate("()=>{const d=document.getElementById('prnDate');d.value='2026-11-04';d.dispatchEvent(new Event('input',{bubbles:true}))}"); pg.wait_for_timeout(300)
    ok('Date change keeps panel working', pg.evaluate("()=>document.querySelectorAll('.prn-i').length>=4"))
    pg.evaluate("()=>document.getElementById('prnNow').click()"); pg.wait_for_timeout(300)
    ok('Now button works', pg.evaluate("()=>document.querySelectorAll('.prn-i').length>=4"))
    ok('Text summary', 'Prashna' in pg.evaluate("()=>PRN.text(currentChartForModal,'marriage')"))
    ok('no sideways scroll at 390', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"))
    # stale js/58 safety: remove panel, open again
    pg.evaluate("()=>{const e=document.getElementById('panel-prashna');e.remove();switchAppTab('panel-prashna')}"); pg.wait_for_timeout(600)
    ok('Panel rebuilds if missing', pg.evaluate("()=>document.querySelectorAll('#panel-prashna .prn-i').length>=4"))
    ok('9 grahas unchanged', pg.evaluate("()=>PLANET_LIST.length===9"))
    ok('no page errors', not errs, errs[:2]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)

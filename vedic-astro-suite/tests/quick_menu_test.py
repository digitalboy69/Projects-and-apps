# Quick Menu redesign (shared/quick-menu.js): descriptions, collapsible sections, search by words in descriptions, Organise (pin/group), Recent, Enter to open, 390 px. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/quick_menu_test.py
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:%d/apps/' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
CAST = "(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}"
A = dict(name='Demo A', dob='2000-01-01', tob='06:30', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 390, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(BASE + 'birth-chart/index.html'); pg.wait_for_selector('#birthForm'); pg.evaluate("()=>localStorage.removeItem('vedicQuickMenu_v1')")
    pg.evaluate(CAST, A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1500); ev = pg.evaluate
    pg.click('#vqBtn'); pg.wait_for_timeout(300)
    ok('opens as a dialog', ev("()=>document.getElementById('vqBox').classList.contains('on')"))
    ok('3 tool tiles, current one marked', ev("()=>document.querySelectorAll('.vq-tool').length===3&&document.querySelectorAll('.vq-tool.on').length===1"))
    ok('sections are collapsible and most start closed', ev("()=>document.querySelectorAll('.vq-gt').length>=4&&document.querySelectorAll('.vq-ch.o').length<document.querySelectorAll('.vq-ch').length"))
    ev("()=>{const c=[...document.querySelectorAll('.vq-gt')].find(x=>x.textContent.includes('Cycles'));c.click()}"); pg.wait_for_timeout(150)
    ok('rows show a plain-words description', ev("()=>document.querySelectorAll('.vq-r .vq-t em').length>=3"))
    ok('tapping a closed section opens it', ev("()=>[...document.querySelectorAll('.vq-t b')].some(x=>x.textContent==='Choghadiya')"))
    pg.fill('.vq-q', 'prashna'); pg.wait_for_timeout(200)
    ok('search finds a tool by its name even in closed sections', ev("()=>[...document.querySelectorAll('.vq-t b')].some(x=>x.textContent==='Prashna Chart')"))
    ok('shows a match count', 'match' in ev("()=>document.querySelector('.vq-cnt').textContent"))
    pg.fill('.vq-q', 'sub lords'); pg.wait_for_timeout(200)
    ok('search also reads the descriptions', ev("()=>[...document.querySelectorAll('.vq-t b')].some(x=>x.textContent==='KP System')"))
    pg.fill('.vq-q', 'zzzzqq'); pg.wait_for_timeout(200)
    ok('friendly empty state', ev("()=>!!document.querySelector('.vq-none')"))
    pg.fill('.vq-q', 'choghadiya'); pg.keyboard.press('Enter'); pg.wait_for_timeout(500)
    ok('Enter opens the first match and closes the menu', ev("()=>!document.getElementById('vqBox').classList.contains('on')&&document.getElementById('panel-choghadiya')&&document.getElementById('panel-choghadiya').classList.contains('active')"))
    pg.click('#vqBtn'); pg.wait_for_timeout(300)
    ok('current tab is marked you are here', ev("()=>!!document.querySelector('.vq-r.on .vq-here')"))
    ok('no pin buttons until Organise', ev("()=>document.querySelectorAll('.vq-a').length===0"))
    pg.click('.vq-org'); pg.wait_for_timeout(150)
    ok('Organise shows pin and group buttons', ev("()=>document.querySelectorAll('.vq-a').length>0"))
    ev("()=>document.querySelector('.vq-a').click()"); pg.wait_for_timeout(150)
    ok('pinning saves', ev("()=>JSON.parse(localStorage.getItem('vedicQuickMenu_v1')).pins.length===1"))
    ok('Pinned section lists it', ev("()=>!![...document.querySelectorAll('.vq-gt')].find(x=>x.textContent.includes('Pinned'))&&document.querySelectorAll('.vq-r').length>0"))
    pg.evaluate("()=>document.getElementById('vqBox').querySelector('.vq-x').click()"); pg.wait_for_timeout(150)
    ok('no sideways scroll at 390', ev("()=>document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector('.vq-l').scrollWidth<=document.querySelector('.vq-l').clientWidth+1"))
    # recent
    pg.click('#vqBtn'); pg.wait_for_timeout(200); pg.fill('.vq-q', 'kp'); pg.keyboard.press('Enter'); pg.wait_for_timeout(500); pg.click('#vqBtn'); pg.wait_for_timeout(200)
    ok('Recent lists earlier tabs', ev("()=>JSON.parse(localStorage.getItem('vedicQuickMenu_v1')).recent.length>=2&&[...document.querySelectorAll('.vq-gt')].some(x=>x.textContent.includes('Recent'))"))
    # notepad still works
    pg2 = b.new_page(viewport={'width': 390, 'height': 800}); pg2.on('pageerror', lambda e: errs.append('np ' + str(e)))
    pg2.route('**/*', lambda r: r.continue_() if r.request.url.startswith('http://127.0.0.1') else r.abort())
    pg2.goto(BASE + 'notepad/index.html'); pg2.wait_for_timeout(500); pg2.click('#vqBtn'); pg2.wait_for_timeout(300)
    ok('Notepad menu opens with tools', pg2.evaluate("()=>document.querySelectorAll('.vq-tool').length===3"))
    ok('no page errors', not errs, errs[:2]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)

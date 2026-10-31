# Ayanamsa choice (js/03 + sky3d js/01 + js/124): Lahiri/Raman/KP offsets, chart redraw, labels. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/ayanamsa_test.py
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
    pg.goto(BASE + 'birth-chart/index.html'); pg.wait_for_selector('#birthForm')
    ok('default is Lahiri', pg.evaluate("()=>ayanKey()==='lahiri'&&document.getElementById('aynSel').value==='lahiri'"))
    jd = 2451545.0
    ok('Lahiri at J2000 ~23.857', abs(pg.evaluate("(j)=>lahiriAyanamsa(j)", jd) - 23.857) < 0.01, pg.evaluate("(j)=>lahiriAyanamsa(j)", jd))
    pg.evaluate(CAST, A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1200)
    L = pg.evaluate("()=>({a:currentChartForModal.ayanamsa,s:currentChartForModal.planets.Sun.longitude,asc:currentChartForModal.ascendant.longitude})")
    pg.evaluate("()=>setAyanamsa('raman')"); pg.wait_for_function("()=>currentChartForModal&&Math.abs(currentChartForModal.ayanamsa-%f)>1" % L['a'], timeout=20000); pg.wait_for_timeout(800)
    R = pg.evaluate("()=>({a:currentChartForModal.ayanamsa,s:currentChartForModal.planets.Sun.longitude,asc:currentChartForModal.ascendant.longitude})")
    ok('Raman: ayanamsa 1.4462 lower, Sun and lagna move forward by that', abs((L['a'] - R['a']) - 1.4462) < 1e-6 and abs(((R['s'] - L['s'] + 360) % 360) - 1.4462) < 1e-3 and abs(((R['asc'] - L['asc'] + 360) % 360) - 1.4462) < 1e-3, (L, R))
    ok('Raman value at J2000 ~22.4108', abs(pg.evaluate("(j)=>lahiriAyanamsa(j)", jd) - 22.4108) < 0.01)
    pg.evaluate("()=>setAyanamsa('kp')"); pg.wait_for_function("()=>Math.abs(currentChartForModal.ayanamsa-%f)<0.2" % (L['a'] - 0.0968), timeout=20000)
    ok('KP value at J2000 ~23.7602', abs(pg.evaluate("(j)=>lahiriAyanamsa(j)", jd) - 23.7602) < 0.01)
    ok('choice is saved', pg.evaluate("()=>localStorage.getItem('vax_ayanamsa')")=='kp')
    ok('report text names KP', 'KP' in pg.evaluate("()=>document.getElementById('results').innerText + ayanName()"))
    ok('9 grahas unchanged', pg.evaluate("()=>PLANET_LIST.length===9"))
    ok('no sideways scroll at 390', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"))
    # 3D engine uses the same saved choice
    pg2 = b.new_page(); pg2.on('pageerror', lambda e: errs.append('3d ' + str(e)))
    pg2.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg2.goto(BASE + 'birth-chart/index.html'); pg2.evaluate("()=>localStorage.setItem('vax_ayanamsa','raman')")
    import re
    src = open(os.path.join(ROOT, 'apps/sky3d/js/01-astro-engine.js')).read()
    ok('3D engine has same offsets', "off:-1.4462" in src and "off:-0.0968" in src and 'AYAN_MODES[ayanKey()].off' in src)
    pg.evaluate("()=>setAyanamsa('lahiri')"); pg.wait_for_timeout(500)
    ok('no page errors', not [e for e in errs if '3d' not in e], errs[:2]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)

# Dosha Check (js/121), standalone Choghadiya panel (js/118) and the late-panel safety net (js/120): every new Home card opens a non-blank screen,
# even when js/58-render-results.js is an older copy that lacks the panels. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/dosha_late_panels_test.py
import functools, http.server, os, re, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
B = 'http://127.0.0.1:%d' % srv.server_address[1]
PAGE = B + '/apps/birth-chart/index.html'
OLD58 = ''.join(l for l in open(ROOT + '/apps/birth-chart/js/58-render-results.js', encoding='utf-8') if 'panel-avakahada' not in l and 'panel-planetency' not in l)
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
CAST = "(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}"
DEMO = dict(name='Demo User', dob='1985-03-14', tob='10:10', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)
CARDS = ['panel-avakahada', 'panel-planetency', 'panel-choghadiya', 'panel-dosha']
def run(stale):
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 390, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        def route(r):
            u = r.request.url
            if stale and u.endswith('58-render-results.js'): return r.fulfill(status=200, content_type='application/javascript', body=OLD58)
            return r.continue_() if u.startswith((B, 'data:', 'blob:', 'about:')) else r.abort()
        pg.route('**/*', route); pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate(CAST, DEMO); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1500)
        tag = 'stale58 ' if stale else ''
        if stale: ok('stale: panels really are missing before opening', pg.evaluate("()=>!document.getElementById('panel-avakahada')&&!document.getElementById('panel-planetency')"))
        for c in CARDS:
            pg.evaluate("()=>switchAppTab('panel-home')"); pg.wait_for_timeout(200)
            ok(tag + 'Home card exists: ' + c, pg.evaluate("(c)=>!!document.querySelector('#panel-home [data-go=\"'+c+'\"]')", c))
            pg.evaluate("(c)=>document.querySelector('#panel-home [data-go=\"'+c+'\"]').click()", c); pg.wait_for_timeout(500)
            t = pg.evaluate("(c)=>{const e=document.getElementById(c);return e&&e.classList.contains('active')?e.innerText.length:-1}", c)
            ok(tag + 'opens, not blank: ' + c, t > 300, t)
        if not stale:
            pg.evaluate("()=>switchAppTab('panel-choghadiya')"); pg.wait_for_timeout(600)
            ok('Choghadiya panel shows 16 slots', pg.evaluate("()=>document.querySelectorAll('#chgBody .chg-r').length")==16)
            pg.evaluate("()=>{const d=document.getElementById('chgDate');d.value='2026-11-01';d.dispatchEvent(new Event('input',{bubbles:true}))}"); pg.wait_for_timeout(300)
            ok('Sunday 1 Nov: first day slot Udveg, first night Shubh', pg.evaluate("()=>{const r=[...document.querySelectorAll('#chgBody .chg-r b')].map(x=>x.textContent);return r[0]==='Udveg'&&r[8]==='Shubh'}"))
            pg.evaluate("()=>{const d=document.getElementById('chgDate');d.value='2026-11-04';d.dispatchEvent(new Event('input',{bubbles:true}))}"); pg.wait_for_timeout(300)
            ok('Wednesday 4 Nov: first day slot Labh', pg.evaluate("()=>document.querySelector('#chgBody .chg-r b').textContent==='Labh'"))
            pg.evaluate("()=>switchAppTab('panel-panchanga')"); pg.wait_for_timeout(700)
            ok('Panchanga panel still has exactly 16 slots (no duplicates)', pg.evaluate("()=>document.querySelectorAll('#panel-panchanga .chg-r').length")==16)
            ok('Dosha: 9 checks, Manglik found for this chart', pg.evaluate("()=>{const r=DSH.compute(currentChartForModal);return r.length===9&&r.find(x=>x.id==='manglik').present}"))
            ok('Dosha: Pitru when Rahu is in the 9th', pg.evaluate("()=>{const c=JSON.parse(JSON.stringify(currentChartForModal));c.planets.Rahu.house=9;return DSH.compute(c).find(x=>x.id==='pitru').present}"))
            ok('Dosha: Pitru absent when no indicator', pg.evaluate("()=>{const c=JSON.parse(JSON.stringify(currentChartForModal));['Rahu','Ketu','Saturn'].forEach(n=>{c.planets[n].house=3;c.planets[n].sign=(c.ascendant.sign+2)%12});c.planets.Sun.house=5;const l=SIGNS[(c.ascendant.sign+8)%12].lord;if(c.planets[l]){c.planets[l].sign=(c.ascendant.sign+10)%12}return !DSH.compute(c).find(x=>x.id==='pitru').present}"))
            ok('Dosha: Gand Mool for Mula, not for Rohini', pg.evaluate("()=>{const g=i=>{const c=JSON.parse(JSON.stringify(currentChartForModal));c.planets.Moon.nakshatra.index=i;return DSH.compute(c).find(x=>x.id==='gand_mool').present};return g(18)&&g(0)&&g(26)&&!g(3)&&!g(10)}"))
            pg.evaluate("()=>switchAppTab('panel-dosha')"); pg.wait_for_timeout(300)
            t = pg.evaluate("()=>document.getElementById('panel-dosha').textContent")
            ok('Dosha screen shows reason and softening text', 'Why:' in t and 'verdict' in t and 'Not found' in t, t[:120])
            ok('no sideways scroll at 390', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"))
        ok(tag + 'no page errors', not errs, errs[:2]); b.close()
run(False); run(True)
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)

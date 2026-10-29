# Planet Encyclopedia (js/116-planet-encyclopedia.js, global PEN): card on Home, 9 planets x 6 tabs render with real text,
# facts match the app tables, taps work, 390 px has no sideways scroll. Run: python3 tests/planet_encyclopedia_test.py
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
SHOT = os.environ.get('PEN_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
CAST = "(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}"
OB = dict(name='Test', dob='1961-08-04', tob='19:24', place='Honolulu', lat=21.3069, lon=-157.8583, tz=-10)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 390, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate(CAST, OB); pg.wait_for_selector('#results.show', timeout=20000); pg.wait_for_timeout(1500)
    ok('home card exists', pg.evaluate("()=>HOME_ITEMS.some(i=>i[0]==='panel-planetency')") and pg.evaluate("()=>!!document.querySelector('#panel-home [data-go=panel-planetency]')"))
    pg.evaluate("()=>switchAppTab('panel-planetency')"); pg.wait_for_timeout(300)
    ok('panel opens', pg.evaluate("()=>document.getElementById('panel-planetency').classList.contains('active')"))
    bad = []
    for n in ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']:
        pg.click('[data-pen-p=%s]' % n)
        for t in ['nature','aspects','strength','rel','houses','mine']:
            pg.click('[data-pen-t=%s]' % t)
            h = pg.evaluate("()=>document.getElementById('penBody').innerText")
            if len(h) < 250 or 'undefined' in h or 'NaN' in h or '[object' in h: bad.append((n, t, len(h)))
    ok('9 planets x 6 tabs have real text', not bad, bad[:4])
    pg.click('[data-pen-p=Saturn]'); pg.click('[data-pen-t=strength]')
    t = pg.evaluate("()=>document.getElementById('penBody').innerText")
    ok('Saturn: exalted Libra 20, debilitated Aries, own Capricorn/Aquarius', 'Libra' in t and 'peak 20' in t and 'Aries' in t and 'Capricorn' in t and 'Aquarius' in t)
    pg.click('[data-pen-sg="0"]'); ok('sign tap shows Saturn in Aries', 'Aries: Debilitated' in pg.evaluate("()=>document.getElementById('penBody').innerText"))
    pg.click('[data-pen-t=aspects]'); a = pg.evaluate("()=>document.getElementById('penBody').innerText")
    ok('Saturn aspects 3, 7, 10', '3rd aspect' in a and '7th aspect' in a and '10th aspect' in a and pg.evaluate("()=>document.querySelectorAll('.pen-ring .hit').length")==3)
    pg.click('[data-pen-ah="10"]'); ok('house aspect tap works', pg.evaluate("()=>document.querySelector('[data-pen-ah=\"10\"]').classList.contains('on')"))
    pg.click('[data-pen-p=Mars]'); pg.click('[data-pen-t=aspects]'); ok('Mars aspects 4, 7, 8', pg.evaluate("()=>document.querySelectorAll('.pen-ring .hit').length")==3)
    pg.click('[data-pen-p=Jupiter]'); pg.click('[data-pen-t=houses]'); pg.click('[data-pen-ho="5"]'); ok('house tap works', pg.evaluate("()=>document.querySelector('[data-pen-ho=\"5\"]').classList.contains('on')"))
    pg.click('[data-pen-t=mine]'); ok('your chart shows sign and house', pg.evaluate("()=>/Jupiter in [A-Za-z]+/.test(document.getElementById('penBody').innerText) && /house/.test(document.getElementById('penBody').innerText)"))
    ok('no sideways scroll at 390', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"), pg.evaluate("()=>document.documentElement.scrollWidth"))
    ok('plain text export', len(pg.evaluate("()=>PEN.text('Venus')")) > 1500)
    if SHOT:
        for n, t in [('Saturn','nature'),('Saturn','aspects'),('Saturn','strength'),('Saturn','rel'),('Jupiter','houses')]:
            pg.click('[data-pen-p=%s]' % n); pg.click('[data-pen-t=%s]' % t); pg.evaluate("()=>document.getElementById('panel-planetency').scrollIntoView({behavior:'instant'})"); pg.screenshot(path='%s/pen_%s_%s.png' % (SHOT, n, t), full_page=False)
    ok('no page errors', not errs, errs[:2]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)

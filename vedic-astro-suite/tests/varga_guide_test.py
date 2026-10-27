# Divisional chart guide (js/114-varga-guide.js, global VGG): one guide for every chart in VARGAS, all sections present, rules tagged,
# no placeholder text, the shown guide follows the selected chart and appears in the Lagna-cast view. Run: python3 tests/varga_guide_test.py
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
OB = dict(name='Test', dob='1961-08-04', tob='19:24', place='Honolulu', lat=21.3069, lon=-157.8583, tz=-10)
SECT = ['How this app divides it', 'Rising sign and houses in this chart', 'How to read it, step by step', 'Rules astrologers use', 'Planets to check', 'How to judge strength', 'Timing', 'Be careful', 'Rules for every divisional chart']
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate(CAST, OB); pg.wait_for_selector('#results.show', timeout=20000); pg.wait_for_timeout(1500)
    keys = pg.evaluate("()=>Object.keys(VARGAS)")
    ok('a guide exists for every chart', all(pg.evaluate("(k)=>VGG.keys().includes(k)", k) for k in keys), keys)
    bad = []
    for k in keys:
        h = pg.evaluate("(k)=>VGG.html(k)", k)
        miss = [s for s in SECT if s not in h]
        if miss or h.count('vgg-tag') < 3 or len(h) < 3000 or 'undefined' in h or 'TODO' in h or 'NaN' in h: bad.append((k, miss, len(h)))
    ok('every guide complete (sections, tagged rules, length)', not bad, bad[:3])
    ok('plain text version for each', all(len(pg.evaluate("(k)=>VGG.text(k)", k)) > 1500 for k in keys))
    ok('birth-time line says how often the rising sign changes', 'about every 13 minutes' in pg.evaluate("()=>VGG.html('D9')") and 'about every 50 seconds' in pg.evaluate("()=>VGG.html('D144')"))
    # on screen, follows the selected chart
    seen = {}
    for k in ['D1', 'D9', 'D60', 'RTN', 'D144']:
        pg.evaluate("(k)=>{const s=document.getElementById('vargaSelect');s.value=k;s.dispatchEvent(new Event('change',{bubbles:true}))}", k); pg.wait_for_timeout(500)
        seen[k] = pg.evaluate("()=>{const d=document.querySelector('#vargaDisplayContainer .vgg');return d?d.querySelector('h4').textContent:null}")
    ok('guide shows under the chart and follows the picker', all(seen.values()) and len(set(seen.values())) == 5, seen)
    ok('guide opens and shows text', pg.evaluate("()=>{const d=document.querySelector('#vargaDisplayContainer .vgg');d.open=true;return d.innerText.length>1500}"))
    ok('no page errors', not errs, errs[:2]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)
raise SystemExit(0 if all(c for _, c, _ in res) else 1)

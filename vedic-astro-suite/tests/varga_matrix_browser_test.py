# Varga Matrix (js/153) in the real app at phone width 390 and 360. Run: python3 tests/varga_matrix_browser_test.py  (VMX_SHOTS=dir saves screenshots)
import functools, http.server, os, socketserver, threading, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
SHOTS = os.environ.get('VMX_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
A = dict(name='Demo A', dob='2000-01-01', tob='06:30', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)
def shot(pg, name):
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(SHOTS, name))
with sync_playwright() as p:
    kw = {'executable_path': CHROME} if os.path.exists(CHROME) else {}
    b = p.chromium.launch(**kw)
    for W in (390, 360):
        pg = b.new_page(viewport={'width': W, 'height': 800}, device_scale_factor=1); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
        pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate("(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}", A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1500)
        t = '%d: ' % W
        ok(t + 'Home has the Varga Matrix tile', pg.evaluate("()=>!!document.querySelector('#panel-home [data-go=panel-vargamatrix]')"))
        pg.evaluate("()=>document.querySelector('#panel-home [data-go=panel-vargamatrix]').click()"); pg.wait_for_timeout(1000)
        ok(t + 'tile opens the active panel', pg.evaluate("()=>{const e=document.getElementById('panel-vargamatrix');return !!e&&e.classList.contains('active')}"))
        ok(t + 'default Shodasha: 16 chart rows x 9 planet cells', pg.evaluate("()=>document.querySelectorAll('#panel-vargamatrix .vmx-r:not(.vmx-hd)').length===16&&document.querySelectorAll('#panel-vargamatrix .vmx-c').length===16*9"))
        ok(t + '4 stat boxes and 6 legend colours', pg.evaluate("()=>document.querySelectorAll('#panel-vargamatrix .vmx-stats>div').length===4&&document.querySelectorAll('#panel-vargamatrix .vmx-legend:not(.vmx-key) span').length===6"))
        ok(t + 'cells match the engine', pg.evaluate("()=>{const c=currentChartForModal;return [...document.querySelectorAll('#panel-vargamatrix .vmx-c[data-k]')].every(e=>{const x=VMX.cellOf(c,e.dataset.k,e.dataset.p);return x&&e.textContent.indexOf(SIGNS[x.sign].symbol)>=0})}"))
        shot(pg, 'v%d-top.png' % W)
        pg.evaluate("()=>document.querySelector('#panel-vargamatrix .vmx-mx').scrollIntoView()"); shot(pg, 'v%d-matrix.png' % W)
        pg.evaluate("()=>document.querySelector('#panel-vargamatrix .vmx-c[data-k=D9][data-p=Mars]').click()"); pg.wait_for_timeout(250)
        ok(t + 'tapping Mars in D9 shows its detail', pg.evaluate("()=>/Mars in D9 Navamsa/.test(document.getElementById('vmxDetail').textContent)&&document.querySelectorAll('.vmx-c.vmx-on').length===1"))
        pg.evaluate("()=>document.getElementById('vmxDetail').scrollIntoView()"); shot(pg, 'v%d-detail.png' % W)
        pg.evaluate("()=>document.querySelector('#panel-vargamatrix .vmx-sum').scrollIntoView()"); shot(pg, 'v%d-summary.png' % W)
        pg.evaluate("()=>document.querySelector('#panel-vargamatrix [data-set=sapta]').click()"); pg.wait_for_timeout(250)
        ok(t + 'Sapta shows 7 rows', pg.evaluate("()=>document.querySelectorAll('#panel-vargamatrix .vmx-r:not(.vmx-hd)').length===7&&document.querySelector('[data-set=sapta]').classList.contains('vmx-on')"))
        pg.evaluate("()=>document.querySelector('#panel-vargamatrix [data-set=all]').click()"); pg.wait_for_timeout(250)
        ok(t + 'All shows every chart (24)', pg.evaluate("()=>document.querySelectorAll('#panel-vargamatrix .vmx-r:not(.vmx-hd)').length===Object.keys(currentChartForModal.vargas).length"))
        pg.evaluate("()=>window.scrollTo(0,0)"); pg.evaluate("()=>document.querySelector('#panel-vargamatrix .vmx-mx').scrollIntoView()"); shot(pg, 'v%d-all.png' % W)
        ok(t + 'no undefined/NaN', pg.evaluate("()=>!/undefined|NaN|\\[object/.test(document.getElementById('panel-vargamatrix').textContent)"))
        ok(t + 'no sideways scroll', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1&&document.getElementById('panel-vargamatrix').scrollWidth<=window.innerWidth+1"))
        ok(t + 'matrix cells at least 24px wide and 34px tall', pg.evaluate("()=>[...document.querySelectorAll('#panel-vargamatrix .vmx-c[data-k]')].slice(0,40).every(e=>{const r=e.getBoundingClientRect();return r.width>=24&&r.height>=34})"))
        ok(t + 'set tabs at least 40px tall', pg.evaluate("()=>[...document.querySelectorAll('#panel-vargamatrix .vmx-sets button')].every(e=>e.getBoundingClientRect().height>=40)"))
        ok(t + 'no page errors', not errs, '; '.join(errs)[:200])
        pg.close()
    b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print('ok  ' if c else 'FAIL', n, ('(' + d + ')') if (d and not c) else '')
sys.exit(1 if bad else 0)

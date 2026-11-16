# Birth Chart > Divisional Charts > "Open in 3D": the 3D Sky opens at the birth moment with that divisional chart drawn as the sky.
# Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/varga_open_3d_browser_test.py  (V3_SHOTS=dir saves screenshots)
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); SHOTS = os.environ.get('V3_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
STUB = """(()=>{const mk=()=>{const f=function(){};const p=new Proxy(f,{get:(t,k)=>k===Symbol.toPrimitive?()=>0:(k==='domElement'?(window.__cv||(window.__cv=document.createElement('canvas'))):(k==='length'?0:(k==='children'?[]:p))),apply:()=>p,construct:()=>p,set:()=>true});return p};window.THREE=mk();})();"""
A = dict(name='Demo A', dob='2000-01-01', tob='06:30', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)
bad = 0
def ok(n, c, d=''):
    global bad; bad += (not c); print(('ok   ' if c else 'FAIL ') + n, '' if c else d)
def route(r):
    u = r.request.url
    if 'three.min.js' in u: r.fulfill(body=STUB, content_type='application/javascript')
    elif u.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')): r.continue_()
    else: r.abort()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'))
    for W, H in ((390, 800), (360, 640)):
        ctx = b.new_context(viewport={'width': W, 'height': H}, timezone_id='Asia/Kolkata'); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('**/*', route)
        pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate("(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}", A); pg.wait_for_selector('#results.show', timeout=20000)
        t = '%dx%d: ' % (W, H)
        pg.evaluate("()=>document.querySelector('[data-go=panel-vargas]').click()"); pg.wait_for_timeout(1200)
        pg.evaluate("()=>{const s=document.getElementById('vargaSelect');s.value='D10';s.dispatchEvent(new Event('change'))}"); pg.wait_for_timeout(800)
        ok(t + 'button is in the divisional toolbar and labelled Open in 3D', pg.evaluate("()=>{const b=document.getElementById('vx3dBtn');return !!b&&/Open in 3D/.test(b.textContent)&&b.getBoundingClientRect().height>=40}"))
        pg.click('#vx3dBtn'); pg.wait_for_url('**/sky3d/index.html', timeout=15000); pg.wait_for_timeout(3500)
        ok(t + '3D Sky draws the D10 sky', pg.evaluate("()=>NAV.on&&NAV.key==='D10'"))
        jd = 2451544.5 + (6.5 - 5.5) / 24
        ok(t + 'sky is at the birth moment', pg.evaluate("(j)=>Math.abs(currentJD-j)<0.002", jd), pg.evaluate("()=>currentJD"))
        ok(t + 'planets are at their D10 places', pg.evaluate("()=>{const s=NAV.snap(currentJD);return ALL_BODIES.every(n=>Math.abs(s.sidereal[n]-VG.lon('D10',s.raw[n]))<1e-6)&&s.nav}"))
        ok(t + 'badge says D10 and fits', pg.evaluate("()=>{const g=document.getElementById('navBadge');const r=g.getBoundingClientRect();return g.style.display!=='none'&&/D10/.test(g.textContent)&&r.right<=innerWidth&&r.left>=0}"))
        ok(t + 'rising line names Dasamsa', pg.evaluate("()=>/Dasamsa/.test(document.body.innerText)"))
        if SHOTS: os.makedirs(SHOTS, exist_ok=True); pg.screenshot(path=f'{SHOTS}/v3_{W}_d10.png')
        pg.click('#navBadge'); pg.wait_for_timeout(500)
        ok(t + 'badge returns to the normal sky', pg.evaluate("()=>!NAV.on"))
        ok(t + 'no page errors', not errs, errs)
        ctx.close()
    b.close()
print('FAILED' if bad else 'ALL OK'); raise SystemExit(1 if bad else 0)

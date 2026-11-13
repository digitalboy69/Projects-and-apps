# 3D Sky Tools drop-down + Navamsha sky (js/61, css/32) at phone widths, Three.js stubbed.
# Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/sky3d_navamsha_tools_browser_test.py  (S3_SHOTS=dir for screenshots)
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'); SHOTS = os.environ.get('S3_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/sky3d/index.html' % srv.server_address[1]
STUB = """(()=>{const mk=()=>{const f=function(){};const p=new Proxy(f,{get:(t,k)=>k===Symbol.toPrimitive?()=>0:(k==='domElement'?(window.__cv||(window.__cv=document.createElement('canvas'))):(k==='length'?0:(k==='children'?[]:p))),apply:()=>p,construct:()=>p,set:()=>true});return p};window.THREE=mk();})();"""
bad = 0
def ok(n, c, d=''):
    global bad; bad += (not c); print(('ok   ' if c else 'FAIL ') + n, '' if c else d)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    for W, H in ((390, 800), (360, 640)):
        ctx = b.new_context(viewport={'width': W, 'height': H}, timezone_id='Asia/Kolkata'); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        def route(r):
            u = r.request.url
            if 'three.min.js' in u: r.fulfill(body=STUB, content_type='application/javascript')
            elif u.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')): r.continue_()
            else: r.abort()
        pg.route('**/*', route); pg.goto(PAGE); pg.wait_for_timeout(2500)
        T = '%dx%d: ' % (W, H); vis = lambda i: pg.evaluate("i=>{const e=document.getElementById(i);if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'}", i)
        # math
        m = pg.evaluate("()=>[NAV.d9(0),NAV.d9(30),NAV.d9(60),NAV.d9(15)].map(x=>Math.floor(x/30))")
        ok(T + 'D9: Aries 0 = Aries, Taurus 0 = Capricorn, Gemini 0 = Libra, Aries 15 = Leo(4)', m == [0, 9, 6, 4], m)
        ok(T + 'closed: only Eye and Tools visible, menu hidden', vis('clearViewBtn') and vis('toolsBtn') and not vis('toolsMenu') and not vis('navBtn'))
        if SHOTS: pg.screenshot(path=f'{SHOTS}/nav_{W}_closed.png')
        pg.click('#toolsBtn'); pg.wait_for_timeout(300)
        ok(T + 'Tools opens all five tools', all(vis(i) for i in ('dashBtn', 'aspExpBtn', 'planetPickBtn', 'resetViewBtn', 'navBtn')))
        hs = pg.evaluate("()=>['dashBtn','aspExpBtn','planetPickBtn','resetViewBtn','navBtn'].map(i=>document.getElementById(i).getBoundingClientRect().height)")
        ok(T + 'tap targets 40px+', all(h >= 40 for h in hs), hs)
        inside = pg.evaluate("()=>{const r=document.getElementById('toolsMenu').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}")
        ok(T + 'menu fits the screen', inside)
        if SHOTS: pg.screenshot(path=f'{SHOTS}/nav_{W}_tools.png')
        pg.click('#navBtn'); pg.wait_for_timeout(500)
        ok(T + 'Navamsha on: menu closed, badge shown, pressed', not vis('toolsMenu') and vis('navBadge') and pg.get_attribute('#navBtn', 'aria-pressed') == 'true')
        hub = pg.evaluate("()=>document.getElementById('hudSub').textContent")
        ok(T + 'HUD says NAVAMSHA SKY', 'NAVAMSHA SKY' in hub, hub)
        if SHOTS: pg.screenshot(path=f'{SHOTS}/nav_{W}_on.png')
        pg.click('#clearViewBtn'); pg.wait_for_timeout(300)
        ok(T + 'Eye hides Tools', not vis('toolsBtn'))
        pg.click('#clearViewBtn'); pg.wait_for_timeout(300)
        ok(T + 'Eye again brings Tools back', vis('toolsBtn'))
        pg.click('#navBadge'); pg.wait_for_timeout(300)
        ok(T + 'badge tap returns to normal sky', not vis('navBadge') and not pg.evaluate('()=>NAV.on'))
        pg.click('#toolsBtn'); pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
        ok(T + 'Escape closes menu', not vis('toolsMenu'))
        ok(T + 'no page errors', not errs, errs)
    b.close()
print('FAILED' if bad else 'ALL OK'); raise SystemExit(1 if bad else 0)

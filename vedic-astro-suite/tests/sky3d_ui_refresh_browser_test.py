# 3D Sky interface refresh (css/31 + js/58) at phone widths, Three.js stubbed (see sky3d_profile_moment_browser_test.py).
# Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/sky3d_ui_refresh_browser_test.py  (S3_SHOTS=dir for screenshots)
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
res = []
def ok(n, c, d=''): res.append((n, bool(c))); print(('ok   ' if c else 'FAIL ') + n, '' if c else d)
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
        T = '%dx%d: ' % (W, H)
        dock = pg.evaluate("()=>document.getElementById('timelineDock').getBoundingClientRect().height")
        ok(T + 'timeline bar is slim (under 25% of the screen height)', dock < H * 0.25, dock)
        bt = pg.evaluate("()=>['tlStepBack','tlPlayRev','tlPlayPause','tlStepFwd','tlMkProfile','tlJumpToggle'].map(i=>{const r=document.getElementById(i).getBoundingClientRect();return [r.left,r.right,r.height]})")
        ok(T + 'six transport buttons in one row, no overlap, 34px+ tall', all(bt[i][1] <= bt[i+1][0] + 0.5 for i in range(5)) and all(x[2] >= 34 for x in bt), bt)
        ok(T + 'speed and range chips each in one row', pg.evaluate("()=>{const a=document.getElementById('tlSpeed').getBoundingClientRect(),z=document.querySelector('.tl-zoom').getBoundingClientRect();return Math.abs(a.top-z.top)<2&&a.right<=z.left+1&&a.height<46}"))
        ok(T + 'no sideways page scroll', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"))
        ok(T + 'stray logo mark hidden on phone', pg.evaluate("()=>getComputedStyle(document.querySelector('.brand')).display==='none'"))
        ok(T + 'tab strip fits the collapsed sheet (no clipped labels)', pg.evaluate("()=>{const s=document.getElementById('sidepanel').getBoundingClientRect(),t=document.querySelector('.panel-tab.active').getBoundingClientRect();return t.bottom<=s.bottom+1}"))
        ok(T + 'All button is the first item in the strip', pg.evaluate("()=>document.querySelector('.panel-tabs').firstElementChild.classList.contains('ui-all')"))
        pg.click('.ui-all'); pg.wait_for_timeout(300)
        n = pg.evaluate("()=>document.querySelectorAll('.panel-tab').length")
        ok(T + 'grid shows every tab (%d)' % n, pg.evaluate("()=>document.querySelectorAll('.ui-t').length")==n and n>=15)
        names = pg.evaluate("()=>[...document.querySelectorAll('.ui-t > span')].map(e=>e.textContent)")
        ok(T + 'each tile has one clean name (no icon glyph as name)', all(len(x)>2 and x.replace(' ','').isalpha() for x in names), names)
        ok(T + 'grid fits the screen without sideways scroll', pg.evaluate("()=>{const c=document.querySelector('.ui-card');return c.scrollWidth<=c.clientWidth+1}"))
        if SHOTS and W == 390: os.makedirs(SHOTS, exist_ok=True); pg.screenshot(path=SHOTS + '/u_grid.png')
        pg.click('.ui-t[data-tab=retro]'); pg.wait_for_timeout(800)
        ok(T + 'tapping a tile closes the grid, opens that tab and the sheet', pg.evaluate("()=>!document.querySelector('.ui-ov').classList.contains('show')&&document.getElementById('tab-retro').classList.contains('active')&&document.getElementById('sidepanel').classList.contains('expanded')"))
        ok(T + 'the opened tab is scrolled into view in the strip', pg.evaluate("()=>{const s=document.querySelector('.panel-tabs').getBoundingClientRect(),t=document.querySelector('.panel-tab.active').getBoundingClientRect();return t.left>=s.left-1&&t.right<=s.right+1}"))
        ok(T + 'All button still reachable while scrolled (sticky)', pg.evaluate("()=>{const s=document.querySelector('.panel-tabs').getBoundingClientRect(),t=document.querySelector('.ui-all').getBoundingClientRect();return t.left>=s.left-1&&t.right<=s.right+60}"))
        ok(T + 'wheel is framed from the screen shape (zoomed out to fit, not the old fixed 26)', pg.evaluate("()=>wheelFitDist()")>40, pg.evaluate("()=>wheelFitDist()"))
        pg.evaluate("()=>document.getElementById('sidepanel').classList.remove('expanded')"); pg.wait_for_timeout(700)
        bd = pg.evaluate("()=>wheelBand()")
        ok(T + 'a free band is found between the cards and the timeline bar', bd and bd['h']>120 and bd['top']>60 and bd['bottom']<H, bd)
        ok(T + 'no page errors', not errs, errs[:3])
        ctx.close()
    ctx = b.new_context(viewport={'width': 1280, 'height': 720}); pg = ctx.new_page(); pg.route('**/*', route); pg.goto(PAGE); pg.wait_for_timeout(2000)
    ok('desktop: wheel distance stays 26 and no band shift', pg.evaluate("()=>wheelFitDist()")==26 and pg.evaluate("()=>wheelBand()")is None)
    ctx.close()
    if False:
        ctx.close()
    b.close()
bad = [n for n, c in res if not c]; print('ALL PASSED' if not bad else 'FAILED: %s' % bad); raise SystemExit(1 if bad else 0)

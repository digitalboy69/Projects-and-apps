# Divisional Charts > House details tab (js/69 houses(), css/27 .vxh-*) at phone width 390 and 360.
# Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/varga_house_details_browser_test.py  (HD_SHOTS=dir saves screenshots)
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); SHOTS = os.environ.get('HD_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
A = dict(name='Demo A', dob='2000-01-01', tob='06:30', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)
bad = 0
def ok(n, c, d=''):
    global bad; bad += (not c); print(('ok   ' if c else 'FAIL ') + n, '' if c else d)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'))
    for W in (390, 360):
        pg = b.new_page(viewport={'width': W, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
        pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate("(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}", A); pg.wait_for_selector('#results.show', timeout=20000)
        t = '%d: ' % W
        pg.evaluate("()=>document.querySelector('[data-go=panel-vargas]').click()"); pg.wait_for_timeout(1200)
        pg.evaluate("()=>{const s=document.getElementById('vargaSelect');if(s){s.value='D9';s.dispatchEvent(new Event('change'))}}"); pg.wait_for_timeout(1000)
        pg.evaluate("()=>{const b=[...document.querySelectorAll('.vx-tabs button')].find(x=>/House details/.test(x.textContent));b.click()}"); pg.wait_for_timeout(500)
        ok(t + '12 house cards in one column', pg.evaluate("()=>{const c=[...document.querySelectorAll('.vx-pane.on .vxh-c')];if(c.length!==12)return false;return new Set(c.map(e=>Math.round(e.getBoundingClientRect().left))).size===1}"))
        ok(t + 'old element/nature lines are gone', pg.evaluate("()=>!/Fire|Earth|Air|Water|Movable|Fixed|Dual/.test([...document.querySelectorAll('.vx-pane.on .vxh-c')].map(e=>e.textContent).join(' '))"))
        r = pg.evaluate("()=>{const P=[...document.querySelectorAll('.vx-pane.on .vxh-p')];return {n:P.length,nak:P.every(e=>/Pada [1-4] · ruled by/.test(e.querySelector('.vxh-l2').textContent)),asp:P.every(e=>e.querySelectorAll('.vxh-l3 em').length>=1),dig:P.every(e=>e.querySelector('.vxh-l1 .vx-chip,.vxh-nt'))}}")
        ok(t + '9 planets each with nakshatra, pada, lord, aspects, dignity', r['n'] == 9 and r['nak'] and r['asp'] and r['dig'], r)
        ok(t + 'planet nakshatra matches the chart', pg.evaluate("()=>{const c=window.__vgC;const e=[...document.querySelectorAll('.vx-pane.on .vxh-p')].find(x=>/^Mars/.test(x.querySelector('.vxh-l1 b').textContent));return e.querySelector('.vxh-l2').textContent.includes(c.planets.Mars.nakshatra.name)}"))
        ok(t + 'no horizontal overflow', pg.evaluate("()=>document.documentElement.scrollWidth<=innerWidth+1"))
        ok(t + 'no page errors', not errs, errs)
        if SHOTS:
            os.makedirs(SHOTS, exist_ok=True)
            for i, n in enumerate(('top', 'mid')):
                pg.evaluate("(i)=>document.querySelectorAll('.vx-pane.on .vxh-c')[i].scrollIntoView({block:'start'})", [0, 4][i]); pg.evaluate("()=>window.scrollBy(0,-70)"); pg.wait_for_timeout(300); pg.screenshot(path=f'{SHOTS}/hd_{W}_{n}.png')
        pg.close()
    b.close()
print('FAILED' if bad else 'ALL OK'); raise SystemExit(1 if bad else 0)

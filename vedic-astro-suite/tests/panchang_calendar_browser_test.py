# Panchang Calendar panel (js/146) in a real browser at phone width. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/panchang_calendar_browser_test.py   (PCAL_SHOTS=dir for screenshots)
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
SHOTS = os.environ.get('PCAL_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c))); print(('ok   ' if c else 'FAIL ') + n, '' if c else d)
A = dict(name='Asha', dob='2000-01-01', tob='06:30', place='New Delhi', lat=28.6139, lon=77.2090, tz=5.5)
CAST = "(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 390, 'height': 800}, device_scale_factor=1); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate(CAST, A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1500)
    ok('Home has a Panchang Calendar card', pg.evaluate("()=>!!document.querySelector('#panel-home [data-go=panel-pcal]')"))
    pg.evaluate("()=>document.querySelector('#panel-home [data-go=panel-pcal]').click()"); pg.wait_for_timeout(1200)
    ok('panel opens with a month grid', pg.evaluate("()=>{const e=document.getElementById('panel-pcal');return e&&e.classList.contains('active')&&e.querySelectorAll('.pcal-c[data-pcal=day]').length>=28}"))
    ok('current month is shown, today highlighted', pg.evaluate("()=>{const n=new Date();return document.getElementById('pcalTitle').textContent.includes(String(n.getFullYear()))&&!!document.querySelector('.pcal-c.today')}"))
    # go to October 2026 then Next -> November 2026
    pg.evaluate("()=>{PCAL.state.y=2026;PCAL.state.m=10;}"); pg.evaluate("()=>document.querySelector('[data-pcal=next]').click()"); pg.wait_for_timeout(500)
    ok('Next goes to November 2026', pg.evaluate("()=>document.getElementById('pcalTitle').textContent")=='November 2026')
    ok('30 day cells for November', pg.evaluate("()=>document.querySelectorAll('.pcal-c[data-pcal=day]').length")==30)
    ok('November 2026 starts on a Sunday: no leading blanks', pg.evaluate("()=>document.querySelectorAll('.pcal-c.off').length")==0)
    ok('Diwali day (8) has a festival dot', pg.evaluate("()=>!!document.querySelector('.pcal-c[data-d=\"8\"] .pcal-d.f')"))
    pg.evaluate("()=>document.querySelector('.pcal-c[data-d=\"8\"]').click()"); pg.wait_for_timeout(300)
    t = pg.evaluate("()=>document.querySelector('.pcal-det').innerText")
    ok('tapping 8 Nov shows Diwali, tithi and nakshatra', all(w in t for w in ['Diwali', 'Chaturdashi', 'Nakshatra', '8 November 2026']), t[:200])
    ok('20 Nov detail names Dev Uthani Ekadashi and says its tithi begins after sunrise', pg.evaluate("()=>{document.querySelector('.pcal-c[data-d=\"20\"]').click();const t=document.querySelector('.pcal-det').innerText;return /Dev Uthani/.test(t)&&/begins today after sunrise/.test(t)}"))
    if SHOTS: os.makedirs(SHOTS, exist_ok=True); pg.screenshot(path=os.path.join(SHOTS, 'c1.png'))
    ok('no sideways scroll at 390', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"))
    # purnimanta
    before = pg.evaluate("()=>document.querySelector('.pcal-sub').innerText")
    pg.evaluate("()=>{const c=document.getElementById('pcalPurn');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))}"); pg.wait_for_timeout(400)
    after = pg.evaluate("()=>document.querySelector('.pcal-sub').innerText")
    ok('Purnimanta changes the month names line', before != after, (before, after))
    pg.evaluate("()=>{const c=document.getElementById('pcalPurn');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}))}"); pg.wait_for_timeout(300)
    # eclipse month
    pg.evaluate("()=>{PCAL.state.y=2026;PCAL.state.m=7}"); pg.evaluate("()=>document.querySelector('[data-pcal=next]').click()"); pg.wait_for_timeout(500)
    pg.evaluate("()=>document.querySelector('.pcal-c[data-d=\"12\"]').click()"); pg.wait_for_timeout(300)
    ok('12 Aug 2026 shows the solar eclipse', pg.evaluate("()=>/Solar eclipse/.test(document.querySelector('.pcal-det').innerText)&&!!document.querySelector('.pcal-c[data-d=\"12\"] .pcal-d.x')"))
    if SHOTS: pg.screenshot(path=os.path.join(SHOTS, 'c2.png'))
    # open full Panchanga
    pg.evaluate("()=>document.querySelector('[data-pcal=open]').click()"); pg.wait_for_timeout(1500)
    ok('Open full Panchanga switches panel and sets the date', pg.evaluate("()=>{const e=document.getElementById('panel-panchanga'),d=document.getElementById('pnDate');return e&&e.classList.contains('active')&&d&&d.value==='2026-08-12'}"))
    # Today and wide navigation
    pg.evaluate("()=>document.querySelector('#panel-home [data-go=panel-pcal]').click()"); pg.wait_for_timeout(600)
    pg.evaluate("()=>document.querySelector('[data-pcal=today]').click()"); pg.wait_for_timeout(400)
    ok('Today returns to the current month', pg.evaluate("()=>{const n=new Date();return document.getElementById('pcalTitle').textContent.includes(String(n.getFullYear()))}"))
    txt = pg.evaluate("()=>document.getElementById('panel-pcal').innerText")
    ok('no undefined/NaN on the page', not any(w in txt for w in ['undefined', 'NaN', '[object']))
    pg.set_viewport_size({'width': 360, 'height': 780}); pg.wait_for_timeout(300)
    ok('no sideways scroll at 360', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"))
    ok('no page errors', not errs, errs[:2]); b.close()
bad = [n for n, c in res if not c]; print('ALL PASSED' if not bad else '%d FAILED' % len(bad)); raise SystemExit(1 if bad else 0)

# Slow connection + saved profile: the chart used to be drawn before the later scripts had loaded, leaving blank tabs (Year Timeline File, Avakahada ...).
# Simulates a slow connection by delaying js/92 (Year Timeline) by 2.5 s while the page restores the last profile. Also checks the one-time self-heal.
# Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/slow_load_restore_browser_test.py
import functools, http.server, os, socketserver, threading, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        if '/js/92-year-timeline-ui.js' in self.path or '/js/116-planet-encyclopedia.js' in self.path: time.sleep(2.5)
        return super().do_GET()
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
B = 'http://127.0.0.1:%d' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c))); print('ok  ' if c else 'FAIL', n, '' if c else d)
DEMO = dict(name='Mohan', dob='1985-03-14', tob='10:10', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)
STATE = "()=>{const p=document.getElementById('panel-yeartimeline');const e=document.getElementById('panel-planetency');return {yt:!!p,pe:!!e,shown:!!document.querySelector('#results.show')}}"
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')); pg = b.new_context(viewport={'width': 390, 'height': 800}).new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith((B, 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(B + '/apps/birth-chart/index.html', wait_until='commit'); pg.wait_for_selector('#birthForm', state='attached', timeout=60000)
    pg.wait_for_function("()=>typeof window.buildYearTimelinePanel==='function'", timeout=60000)
    pg.evaluate("(d)=>{saveProfiles([d]);localStorage.setItem('VedicAstrology_lastProfileIdx','0')}", DEMO)
    pg.goto(B + '/apps/birth-chart/index.html', wait_until='commit'); pg.wait_for_function("()=>typeof window.buildYearTimelinePanel==='function'", timeout=60000); pg.wait_for_timeout(4500)
    st = pg.evaluate(STATE); ok('slow load + saved profile: chart is showing', st['shown'], st)
    ok('slow load + saved profile: Year Timeline and Planet Encyclopedia panels exist', st['yt'] and st['pe'], st)
    pg.evaluate("()=>switchAppTab('panel-yeartimeline')"); pg.wait_for_timeout(500)
    ok('Year Timeline opens with its form (not blank)', pg.evaluate("()=>{const p=document.getElementById('panel-yeartimeline');return !!p&&p.classList.contains('active')&&p.innerText.length>200}"))
    # self-heal: remove the panel as if it had been skipped, then open it
    pg.evaluate("()=>{document.getElementById('panel-yeartimeline').remove()}"); pg.evaluate("()=>switchAppTab('panel-yeartimeline')"); pg.wait_for_timeout(2500)
    ok('self-heal: a missing tool panel is rebuilt and opens', pg.evaluate("()=>{const p=document.getElementById('panel-yeartimeline');return !!p&&p.classList.contains('active')&&p.innerText.length>200}"), pg.evaluate(STATE))
    ok('no page errors', not errs, errs[:3])
    b.close()
bad = [n for n, c in res if not c]; print('FAILED' if bad else 'ALL OK'); raise SystemExit(1 if bad else 0)

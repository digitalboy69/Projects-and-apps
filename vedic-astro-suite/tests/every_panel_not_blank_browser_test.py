# Every Birth Chart panel opens and is not blank (after casting a chart). Lists blank / tiny panels and page errors raised while opening each one.
# Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/every_panel_not_blank_browser_test.py [bundle] [nocast] [profile=demo|notime|south|west|old|polar]   (bundle = the generated one-file copy; nocast = open panels before any chart is made)
import functools, http.server, os, socketserver, sys, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
B = 'http://127.0.0.1:%d' % srv.server_address[1]
PAGE = B + '/apps/birth-chart/' + ('index.bundle.html' if 'bundle' in sys.argv else 'index.html')
PROFILES = {'demo': dict(name='Demo User', dob='1985-03-14', tob='10:10', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5),
  'notime': dict(name='No Time', dob='1990-07-01', tob='', place='Mumbai', lat=19.076, lon=72.8777, tz=5.5),
  'south': dict(name='South', dob='1978-12-25', tob='23:55', place='Sydney', lat=-33.8688, lon=151.2093, tz=10),
  'west': dict(name='West', dob='2001-01-01', tob='00:05', place='New York', lat=40.7128, lon=-74.006, tz=-5),
  'old': dict(name='Old', dob='1925-06-15', tob='06:30', place='Chennai', lat=13.0827, lon=80.2707, tz=5.5),
  'polar': dict(name='Polar', dob='1999-06-21', tob='12:00', place='Tromso', lat=69.6492, lon=18.9553, tz=2)}
DEMO = PROFILES[next((a[8:] for a in sys.argv if a.startswith('profile='))," ".join(["demo"]))]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')); pg = b.new_page(viewport={'width': 390, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); warns = []; pg.on('console', lambda m: warns.append(m.text[:160]) if m.type in ('warning', 'error') else None)
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith((B, 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    if 'nocast' not in sys.argv:
        pg.evaluate("(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}", DEMO); pg.wait_for_selector('#results.show', timeout=30000)
    pg.wait_for_timeout(1500)
    ids = pg.evaluate("()=>[...new Set([...HOME_ITEMS.map(i=>i[0]),...[...document.querySelectorAll('.app-panel')].map(e=>e.id)])]")
    bad = []; print('panels to check:', len(ids))
    for i in ids:
        n0 = len(errs)
        pg.evaluate("(i)=>switchAppTab(i)", i); pg.wait_for_timeout(450)
        r = pg.evaluate("(i)=>{const e=document.getElementById(i);if(!e)return {missing:true};const a=e.classList.contains('active');const r=e.getBoundingClientRect();return {active:a,text:e.innerText.trim().length,h:Math.round(r.height),kids:e.children.length}}", i)
        new = errs[n0:]
        if r.get('missing') or not r['active'] or r['text'] < 60 or r['h'] < 60 or new:
            bad.append((i, r, new[:2])); print('BLANK/ERR', i, r, [x[:120] for x in new[:2]])
    print('console warnings/errors during cast and open:', sorted(set(warns))[:12])
    print('blank or erroring panels: %d of %d' % (len(bad), len(ids)))
    b.close()
raise SystemExit(1 if bad else 0)

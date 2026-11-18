# Export tab (apps/birth-chart js/148 + css/79): opening it must not flicker. While it measures every tool page in the background the visible screen must stay on
# the Export panel, keep its scroll, and never replay the panel fade-in; the sizes must still fill in. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/export_no_flicker_browser_test.py
import functools, http.server, os, socketserver, threading, json
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
A = dict(name='Demo A', dob='2000-01-01', tob='06:30', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)
bad = 0
def ok(n, c, d=''):
    global bad; bad += (not c); print(('ok   ' if c else 'FAIL ') + n, '' if c else d)
SAMPLER = """()=>{window.__fr=[];window.__stop=false;window.__t0=performance.now();
  (function f(){const a=document.querySelector('.app-panel.active'),p=document.getElementById('panel-export');let mo=1;
    if(p){const els=[p,...p.querySelectorAll(':scope > *, .exb > *, .exb-g, .exb-pre, .exb-r')].slice(0,40);mo=Math.min(...els.map(e=>parseFloat(getComputedStyle(e).opacity)))}
    window.__fr.push([a?a.id:'none',Math.round(window.scrollY),performance.now()-window.__t0,mo,p?getComputedStyle(p).display:'x']);if(!window.__stop)requestAnimationFrame(f)})()}"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'))
    for W, H in ((390, 800), (360, 640)):
        pg = b.new_page(viewport={'width': W, 'height': H}); errs = []; T = '%dx%d: ' % (W, H)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
        pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate("(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}", A); pg.wait_for_selector('#results.show', timeout=20000); pg.wait_for_timeout(1500)
        pg.evaluate("()=>window.scrollTo(0,0)")
        pg.evaluate(SAMPLER)
        pg.evaluate("()=>document.querySelector('.app-tab[data-group=export]').click()"); pg.wait_for_timeout(5000)
        pg.evaluate("()=>{window.__stop=true}"); pg.wait_for_timeout(100)
        fr = pg.evaluate("()=>window.__fr"); on_export = [f for f in fr if f[0] == 'panel-export']
        ok(T + 'every painted frame after opening shows the Export panel (no tab flips)', all(f[0] == 'panel-export' for f in fr[3:]), sorted(set(f[0] for f in fr)))
        ok(T + 'scroll never jumps while measuring', len(set(f[1] for f in on_export)) <= 1, sorted(set(f[1] for f in on_export)))
        late = [f for f in fr if f[2] > 1800 and f[4] != 'none']
        ok(T + 'after the 1.8 s opening fade the screen never dims again (lowest opacity %.2f over %d frames)' % (min([f[3] for f in late] or [1]), len(late)), len(late) > 20 and min(f[3] for f in late) > 0.99, min([f[3] for f in late] or [1]))
        ok(T + 'sizes fill in: nothing still says measuring', pg.evaluate("()=>!/measuring/.test(document.getElementById('exbTot').textContent)&&[...document.querySelectorAll('.exb [data-size]')].filter(e=>!e.textContent.trim()).length<=3"), pg.evaluate("()=>document.getElementById('exbTot').textContent"))
        ok(T + 'the hold class is gone afterwards', pg.evaluate("()=>!document.documentElement.classList.contains('exb-hold')"))
        # scrolled down in the tab: measuring again (change a preset) must not move the page
        pg.evaluate("()=>window.scrollTo(0,300)"); y0 = pg.evaluate("()=>window.scrollY")
        pg.evaluate("()=>{document.querySelector('#exbPre button[data-p=all]').click()}"); pg.wait_for_timeout(1500)
        ok(T + 'scroll stays put after choosing a preset', abs(pg.evaluate("()=>window.scrollY") - y0) < 2, (y0, pg.evaluate("()=>window.scrollY")))
        ok(T + 'no page errors', not errs, errs)
        pg.close()
    b.close()
print('FAILED' if bad else 'ALL OK'); raise SystemExit(1 if bad else 0)

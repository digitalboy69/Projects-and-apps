# Past · Present · Future (js/155) in the real app at phone width 390 and 360. Run: python3 tests/past_present_future_browser_test.py  (PPF_SHOTS=dir saves screenshots)
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
SHOTS = os.environ.get('PPF_SHOTS')
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
def sc(pg, sel, off=70): pg.evaluate("([s,o])=>{const e=document.querySelector(s);window.scrollTo(0,e.getBoundingClientRect().top+scrollY-o)}", [sel, off]); pg.wait_for_timeout(250)
with sync_playwright() as p:
    kw = {'executable_path': CHROME} if os.path.exists(CHROME) else {}
    b = p.chromium.launch(**kw)
    for W in (390, 360):
        pg = b.new_page(viewport={'width': W, 'height': 800}, device_scale_factor=1); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
        pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate("(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}", A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1200)
        t = '%d: ' % W
        ok(t + 'Home has the tile', pg.evaluate("()=>!!document.querySelector('#panel-home [data-go=panel-ppf]')"))
        pg.evaluate("()=>document.querySelector('#panel-home [data-go=panel-ppf]').click()"); pg.wait_for_timeout(1000)
        ok(t + 'tile opens the active panel', pg.evaluate("()=>{const e=document.getElementById('panel-ppf');return !!e&&e.classList.contains('active')}"))
        ok(t + 'river has one block per Mahadasha', pg.evaluate("()=>document.querySelectorAll('#panel-ppf .ppf-seg').length===currentChartForModal.dashaData.mahadashas.length"))
        ok(t + 'exactly one running block (not faded) matches the engine', pg.evaluate("()=>{const T=VDA.timeline(currentChartForModal);const n=T.periods.filter(x=>x.status==='now').length;return n===1&&document.querySelectorAll('#panel-ppf .ppf-seg:not(.ppf-past)').length===T.periods.length-T.periods.filter(x=>x.status==='past').length}"))
        ok(t + 'ease bars drawn', pg.evaluate("()=>document.querySelectorAll('#panel-ppf .ppf-bar').length>=8"))
        ok(t + 'Now banner shows engine lords', pg.evaluate("()=>{const c=VDA.current(currentChartForModal);return document.querySelector('#panel-ppf .ppf-now-r').textContent.includes(c.md.lord)&&document.querySelector('#panel-ppf .ppf-now-r').textContent.includes(c.ad.lord)}"))
        shot(pg, 'p%d-top.png' % W)
        pg.evaluate("()=>document.querySelector('#panel-ppf .ppf-seg:not(.ppf-past)').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); pg.wait_for_timeout(200)
        ok(t + 'tapping a block shows its reading', pg.evaluate("()=>/Mahadasha/.test(document.getElementById('ppfPick').textContent)&&document.querySelectorAll('#panel-ppf .ppf-seg.ppf-on').length===1"))
        sc(pg, '#ppfEase', 120)
        pg.evaluate("()=>document.querySelector('#panel-ppf .ppf-bar').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); pg.wait_for_timeout(200)
        ok(t + 'tapping a bar shows its reading', pg.evaluate("()=>/to/.test(document.getElementById('ppfBar').textContent)&&document.querySelectorAll('#panel-ppf .ppf-bar.ppf-on').length===1"))
        shot(pg, 'p%d-chart.png' % W)
        sc(pg, '.ppf-tabs', 60); shot(pg, 'p%d-present.png' % W)
        ok(t + 'Present shows 3 clocks and 12 house boxes', pg.evaluate("()=>document.querySelectorAll('#ppfBody .ppf-pg').length>=2&&document.querySelectorAll('#ppfBody .ppf-hs span').length===12"))
        pg.evaluate("()=>document.querySelector('#ppfBody .ppf-hs').scrollIntoView({block:'center'})"); shot(pg, 'p%d-houses.png' % W)
        pg.evaluate("()=>document.querySelector('.ppf-tabs [data-tab=future]').click()"); pg.wait_for_timeout(250); sc(pg, '.ppf-tabs', 60)
        ok(t + 'Future lists upcoming sub-periods', pg.evaluate("()=>document.querySelectorAll('#ppfBody .ppf-row').length>=3"))
        shot(pg, 'p%d-future.png' % W)
        pg.evaluate("()=>window.scrollBy(0,650)"); shot(pg, 'p%d-future2.png' % W)
        pg.evaluate("()=>document.querySelector('.ppf-tabs [data-tab=past]').click()"); pg.wait_for_timeout(250); sc(pg, '.ppf-tabs', 60)
        ok(t + 'Past shows cards with a sub-period strip', pg.evaluate("()=>document.querySelectorAll('#ppfBody .ppf-card').length>=1&&document.querySelectorAll('#ppfBody .ppf-strip').length>=1"))
        pg.evaluate("()=>{const d=document.querySelector('#ppfBody details');if(d)d.open=true}"); shot(pg, 'p%d-past.png' % W)
        ok(t + 'no horizontal page scroll', pg.evaluate("()=>document.documentElement.scrollWidth<=innerWidth+1"))
        ok(t + 'tabs and summaries are tap-friendly (>=40px)', pg.evaluate("()=>[...document.querySelectorAll('#panel-ppf .ppf-tabs button,#panel-ppf summary')].every(e=>e.getBoundingClientRect().height>=40)"))
        ok(t + 'no emoji sign glyph clipping: tabs fit', pg.evaluate("()=>[...document.querySelectorAll('#panel-ppf .ppf-tabs button')].every(e=>e.scrollWidth<=e.clientWidth+1)"))
        ok(t + 'no page errors', not errs, str(errs[:2]))
        pg.close()
    b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('ok   ' if c else 'FAIL ') + n + ((' :: ' + d) if d and not c else ''))
print('%d checks, %d failed' % (len(res), len(bad)))
raise SystemExit(1 if bad else 0)

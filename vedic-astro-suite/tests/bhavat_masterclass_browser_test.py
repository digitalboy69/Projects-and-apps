# Bhavat Bhavam Masterclass (js/151-152) in the real app: Home tile, tabs, rows, explorer, recipes, phone width 390 and 360. Run: python3 tests/bhavat_masterclass_browser_test.py  (BMC_SHOTS=dir saves screenshots)
import functools, http.server, os, socketserver, threading, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
SHOTS = os.environ.get('BMC_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
CAST = "(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}"
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
        pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate(CAST, A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1500)
        t = '%d: ' % W
        ok(t + 'Home has the Masterclass tile', pg.evaluate("()=>!!document.querySelector('#panel-home [data-go=panel-bhavatclass]')"))
        pg.evaluate("()=>document.querySelector('#panel-home [data-go=panel-bhavatclass]').click()"); pg.wait_for_timeout(1000)
        ok(t + 'tile opens the active panel', pg.evaluate("()=>{const e=document.getElementById('panel-bhavatclass');return !!e&&e.classList.contains('active')}"))
        ok(t + '12 pair rows in My chart', pg.evaluate("()=>document.querySelectorAll('#panel-bhavatclass [data-bmc-pane=chart] .bmc-h').length===12"))
        ok(t + 'row 7 reads 7th from the 7th is the 1st', pg.evaluate("()=>/7th from the 7th is the 1st/.test(document.querySelectorAll('#panel-bhavatclass [data-bmc-pane=chart] .bmc-h')[6].textContent)"))
        ok(t + 'rows match the engine', pg.evaluate("()=>{const C=BMC.compute(currentChartForModal),r=document.querySelectorAll('#panel-bhavatclass [data-bmc-pane=chart] .bmc-h');return C.rows.every((x,i)=>r[i].textContent.indexOf(x.qf.signName)>=0&&r[i].textContent.indexOf(x.ps.label)>=0)}"))
        shot(pg, 'm%d-chart.png' % W)
        ok(t + 'pair map has 12 houses, 11 arrows and a self ring', pg.evaluate("()=>{const s=document.querySelector('#panel-bhavatclass [data-bmc-pane=chart] .bmc-wheel');return !!s&&s.querySelectorAll('.bmc-wn').length===12&&s.querySelectorAll('.bmc-wa').length===11&&!!s.querySelector('.bmc-wself')}"))
        ok(t + 'ring, 4 stats, 12 snapshot lines and a legend', pg.evaluate("()=>document.querySelectorAll('#panel-bhavatclass .bmc-rg').length===12&&document.querySelectorAll('#panel-bhavatclass .bmc-stats>div').length===4&&document.querySelectorAll('#panel-bhavatclass .bmc-snap').length===12&&document.querySelectorAll('#panel-bhavatclass .bmc-legend:not(.key) span').length===5"))
        pg.evaluate("()=>document.querySelector('#panel-bhavatclass .bmc-wheel').scrollIntoView()"); shot(pg, 'm%d-wheel.png' % W)
        pg.evaluate("()=>document.querySelector('#panel-bhavatclass .bmc-snaps').scrollIntoView()"); shot(pg, 'm%d-snaps.png' % W)
        pg.evaluate("()=>document.querySelectorAll('#panel-bhavatclass .bmc-snap')[8].click()"); pg.wait_for_timeout(900)
        ok(t + 'tapping snapshot line 9 opens the 9th row', pg.evaluate("()=>document.getElementById('bmcRow9').open===true"))
        pg.evaluate("()=>document.getElementById('bmcRow9').open=false")
        pg.evaluate("()=>document.querySelectorAll('#panel-bhavatclass .bmc-wheel .bmc-wn')[3].dispatchEvent(new MouseEvent('click',{bubbles:true}))"); pg.wait_for_timeout(600)
        ok(t + 'tapping house 4 on the wheel opens the 4th row', pg.evaluate("()=>document.getElementById('bmcRow4').open===true"))
        pg.evaluate("()=>document.getElementById('bmcRow4').open=false")
        pg.evaluate("()=>document.querySelectorAll('#panel-bhavatclass [data-bmc-pane=chart] .bmc-h')[6].open=true"); pg.wait_for_timeout(200)
        ok(t + 'an open row shows both layers, agreement, timing, pair meaning', pg.evaluate("()=>{const e=document.querySelectorAll('#panel-bhavatclass [data-bmc-pane=chart] .bmc-h')[6];return !!e.querySelector('.bmc-layer')&&e.querySelectorAll('.bmc-layer').length===2&&!!e.querySelector('.bmc-rel')&&!!e.querySelector('.bmc-tm')&&!!e.querySelector('.bmc-pair')}"))
        pg.evaluate("()=>document.querySelectorAll('#panel-bhavatclass [data-bmc-pane=chart] .bmc-h')[6].scrollIntoView()"); shot(pg, 'm%d-row.png' % W)
        # tabs
        for tab in ('explore', 'recipes', 'learn'):
            pg.evaluate("(k)=>document.querySelector('#panel-bhavatclass [data-bmc-tab='+k+']').click()", tab); pg.wait_for_timeout(200)
            ok(t + 'tab ' + tab + ' shows only its pane', pg.evaluate("(k)=>[...document.querySelectorAll('#panel-bhavatclass [data-bmc-pane]')].every(s=>s.hidden===(s.getAttribute('data-bmc-pane')!==k))", tab))
            pg.evaluate("()=>window.scrollTo(0,0)")
            if tab == 'explore':
                ok(t + 'explorer selects are at least 40px tall', pg.evaluate("()=>[...document.querySelectorAll('#bmcY,#bmcX,#bmcH')].every(e=>e.getBoundingClientRect().height>=40)"))
                ok(t + 'matrix has 144 squares, 12 on the gold diagonal', pg.evaluate("()=>document.querySelectorAll('#panel-bhavatclass .bmc-mb').length===144&&document.querySelectorAll('#panel-bhavatclass .bmc-mb.same').length===12"))
                pg.evaluate("()=>document.querySelector('#panel-bhavatclass .bmc-mx').scrollIntoView()"); shot(pg, 'm%d-matrix.png' % W)
                pg.evaluate("()=>document.querySelector('#panel-bhavatclass .bmc-mb[data-y=\"5\"][data-x=\"5\"]').click()"); pg.wait_for_timeout(200)
                ok(t + 'tapping the 5th-from-5th square shows the 9th house', pg.evaluate("()=>/5th from the 5th is the\\s*9th house/.test(document.getElementById('bmcCell').textContent)&&document.getElementById('bmcY').value==='5'&&document.querySelectorAll('.bmc-mb.on').length===1"))
                pg.evaluate("()=>window.scrollTo(0,0)")
                pg.select_option('#bmcY', '3'); pg.select_option('#bmcX', '12'); pg.wait_for_timeout(200)
                ok(t + 'explorer: 12th from the 3rd is the 2nd house', pg.evaluate("()=>/12th from the 3rd is the\\s*2nd house/.test(document.getElementById('bmcCell').textContent)&&/siblings/.test(document.getElementById('bmcCell').textContent)"))
                pg.select_option('#bmcH', '7'); pg.wait_for_timeout(200)
                ok(t + 'twelve hats: 12 rows and 1st from the 7th present', pg.evaluate("()=>document.querySelectorAll('#bmcHats li').length===12&&/1st from the 7th/.test(document.getElementById('bmcHats').textContent)"))
            if tab == 'recipes':
                ok(t + 'recipes: 12 topics', pg.evaluate("()=>document.querySelectorAll('#panel-bhavatclass [data-bmc-pane=recipes] .bmc-h').length===12"))
                pg.evaluate("()=>document.querySelector('#panel-bhavatclass [data-bmc-pane=recipes] .bmc-h').open=true")
            if tab == 'learn':
                ok(t + 'learn: 7 chapters and source links', pg.evaluate("()=>document.querySelectorAll('#panel-bhavatclass [data-bmc-pane=learn] .bmc-ch').length===7&&document.querySelectorAll('#panel-bhavatclass [data-bmc-pane=learn] a[href^=https]').length===4"))
            if tab == 'learn':
                pg.evaluate("()=>{const c=document.querySelectorAll('#panel-bhavatclass .bmc-ch');c[2].open=true;c[1].open=true;c[2].scrollIntoView()}"); shot(pg, 'm%d-learn3.png' % W)
                ok(t + 'learn pair map is a plain wheel with 12 houses', pg.evaluate("()=>document.querySelectorAll('#panel-bhavatclass [data-bmc-pane=learn] .bmc-wheel .bmc-wn').length===12"))
            shot(pg, 'm%d-%s.png' % (W, tab))
        ok(t + 'no undefined/NaN in the panel', pg.evaluate("()=>!/undefined|NaN|\\[object/.test(document.getElementById('panel-bhavatclass').textContent)"))
        ok(t + 'no sideways scroll', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1&&document.getElementById('panel-bhavatclass').scrollWidth<=window.innerWidth+1"))
        ok(t + 'tap targets at least 40px (tabs, selects)', pg.evaluate("()=>(()=>{const l=[...document.querySelectorAll('#panel-bhavatclass .bmc-tabs button,#panel-bhavatclass select')].filter(e=>e.offsetParent!==null);return l.length>=4&&l.every(e=>e.getBoundingClientRect().height>=40)})()"))
        # old panel links here
        pg.evaluate("()=>switchAppTab('panel-bhavat')"); pg.wait_for_timeout(500)
        ok(t + 'House from the House has a button to the Masterclass', pg.evaluate("()=>!!document.querySelector('#panel-bhavat .bbh-go')"))
        pg.evaluate("()=>document.querySelector('#panel-bhavat .bbh-go').click()"); pg.wait_for_timeout(500)
        ok(t + 'that button opens the Masterclass', pg.evaluate("()=>document.getElementById('panel-bhavatclass').classList.contains('active')"))
        ok(t + 'no page errors', not errs, '; '.join(errs)[:200])
        pg.close()
    b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print('ok  ' if c else 'FAIL', n, ('(' + d + ')') if (d and not c) else '')
sys.exit(1 if bad else 0)

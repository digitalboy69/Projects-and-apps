# Chakra Explorer in the real app (js/130): Home tile, panel, time controls, toggles, phone width. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/chakra_explorer_browser_test.py
# Optional: CHX_SHOTS=/some/dir saves screenshots.
import functools, http.server, os, socketserver, threading, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
SHOTS = os.environ.get('CHX_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
CAST = "(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}"
A = dict(name='Demo A', dob='2000-01-01', tob='06:30', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)
with sync_playwright() as p:
    kw = {'executable_path': CHROME} if os.path.exists(CHROME) else {}
    b = p.chromium.launch(**kw); pg = b.new_page(viewport={'width': 390, 'height': 800}, device_scale_factor=1); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate(CAST, A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1500)
    ok('Home has the Chakra Explorer tile', pg.evaluate("()=>!!document.querySelector('#panel-home [data-go=panel-chakra]')"))
    pg.evaluate("()=>document.querySelector('#panel-home [data-go=panel-chakra]').click()"); pg.wait_for_timeout(1200)
    ok('tile opens the active panel', pg.evaluate("()=>{const e=document.getElementById('panel-chakra');return !!e&&e.classList.contains('active')}"))
    ok('three drawings and the date field is filled', pg.evaluate("()=>document.querySelectorAll('#panel-chakra svg.chx-svg').length===3&&/\\d{4}-\\d\\d-\\d\\d/.test(document.getElementById('chxDate').value)"))
    ok('date shown = today in the chart time zone (within a day)', pg.evaluate("""()=>{const d=document.getElementById('chxDate').value.split('-').map(Number);const t=Date.UTC(d[0],d[1]-1,d[2]);return Math.abs(t-Date.now())<2*86400000}"""))
    ok('the grid has 81 cells', pg.evaluate("()=>document.querySelectorAll('#panel-chakra svg.chx-svg:first-of-type .chx-c').length===81"))
    ok('Janma cell is lit and the five pillars are listed', pg.evaluate("()=>document.querySelectorAll('#panel-chakra .chx-c.nat').length>=3&&document.querySelectorAll('#panel-chakra .chx-tile').length===5"))
    ok('nine planet chips', pg.evaluate("()=>document.querySelectorAll('#panel-chakra .chx-chip').length===9"))
    ok('no page errors on open', not errs, '; '.join(errs)[:200])
    # time controls
    d0 = pg.evaluate("()=>document.getElementById('chxDate').value")
    pg.evaluate("()=>document.querySelector('#panel-chakra [data-u=day][data-d=\"1\"]').click()"); pg.wait_for_timeout(300)
    d1 = pg.evaluate("()=>document.getElementById('chxDate').value")
    ok('+1 Day moves the date forward by one day', d0 != d1, d0 + ' -> ' + d1)
    pg.evaluate("()=>{for(let i=0;i<3;i++)document.querySelector('#panel-chakra [data-u=month][data-d=\"1\"]').click()}"); pg.wait_for_timeout(300)
    d2 = pg.evaluate("()=>document.getElementById('chxDate').value")
    ok('+3 Month moves forward ~3 months', abs((int(d2[5:7]) - int(d1[5:7])) % 12) == 3, d1 + ' -> ' + d2)
    pg.evaluate("()=>document.getElementById('chxNow').click()"); pg.wait_for_timeout(300)
    ok('Now returns to today', pg.evaluate("()=>document.getElementById('chxDate').value")==d0)
    # moving a long way changes the Kota / planet picture without errors
    before = pg.evaluate("()=>document.getElementById('chxBody').textContent.length")
    pg.evaluate("()=>{const i=document.getElementById('chxDate');i.value='1999-05-05';i.dispatchEvent(new Event('input',{bubbles:true}))}"); pg.wait_for_timeout(400)
    ok('typing a far date redraws cleanly', pg.evaluate("()=>document.querySelectorAll('#panel-chakra svg.chx-svg').length===3&&!/NaN|undefined/.test(document.getElementById('chxBody').textContent)"))
    pg.evaluate("()=>document.getElementById('chxNow').click()"); pg.wait_for_timeout(300)
    # toggles
    pg.evaluate("()=>{const c=document.getElementById('chxVara');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))}"); pg.wait_for_timeout(250)
    ok('weekday toggle puts weekday names in the centre', pg.evaluate("()=>/Thu|Sat|Sun/.test(document.querySelector('#panel-chakra svg.chx-svg').textContent)&&!/Nanda/.test(document.querySelector('#panel-chakra svg.chx-svg').textContent)"))
    pg.evaluate("()=>{const c=document.getElementById('chxLatta');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))}"); pg.wait_for_timeout(250)
    ok('Latta toggle adds kicks', pg.evaluate("()=>document.querySelectorAll('#panel-chakra .chx-lt').length>=1&&/Latta kicks/.test(document.getElementById('chxBody').textContent)"))
    pg.evaluate("()=>{const c=document.getElementById('chxRays');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}))}"); pg.wait_for_timeout(250)
    ok('rays toggle removes ray lines', pg.evaluate("()=>document.querySelectorAll('#panel-chakra .chx-ray').length===0"))
    pg.evaluate("()=>{const c=document.getElementById('chxRays');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))}"); pg.wait_for_timeout(250)
    ok('rays are drawn when on', pg.evaluate("()=>document.querySelectorAll('#panel-chakra .chx-ray').length>=9"))
    rays0 = pg.evaluate("()=>document.querySelectorAll('#panel-chakra .chx-ray').length"); kota0 = pg.evaluate("()=>document.querySelectorAll('#panel-chakra .chx-sec:nth-of-type(2) .chx-pr').length")
    pg.evaluate("()=>document.querySelector('#panel-chakra [data-chx=pl][data-p=Saturn]').click()"); pg.wait_for_timeout(250)
    rays1 = pg.evaluate("()=>document.querySelectorAll('#panel-chakra .chx-ray').length"); kota1 = pg.evaluate("()=>document.querySelectorAll('#panel-chakra .chx-sec:nth-of-type(2) .chx-pr').length")
    ok('hiding Saturn removes exactly its one ray', rays1 == rays0 - 1, '%d -> %d' % (rays0, rays1))
    ok('hiding Saturn keeps it in the Kota fort list', kota0 == kota1 == 9, '%d / %d' % (kota0, kota1))
    pg.evaluate("()=>{const s=document.getElementById('chxNaam');s.selectedIndex=5;s.dispatchEvent(new Event('change',{bubbles:true}))}"); pg.wait_for_timeout(250)
    ok('Naam Akshara lights a teal cell', pg.evaluate("()=>document.querySelectorAll('#panel-chakra .chx-c.naam').length===1"))
    pg.evaluate("()=>{const s=document.getElementById('chxPaala');s.value='Saturn';s.dispatchEvent(new Event('change',{bubbles:true}))}"); pg.wait_for_timeout(250)
    ok('Kota Paala override shows Saturn', pg.evaluate("()=>/Kota Paala[^]*Saturn/.test(document.querySelector('.chx-two').textContent)&&/planet you picked/.test(document.getElementById('chxBody').textContent)"))
    pg.evaluate("()=>document.querySelector('#panel-chakra [data-chx=sb][data-v=sun]').click()"); pg.wait_for_timeout(250)
    ok('Shoola can switch to the natal Sun', pg.evaluate("()=>/natal Sun nakshatra/.test(document.getElementById('chxBody').textContent)"))
    # phone width: nothing wider than the screen
    ok('no horizontal overflow at 390 px', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"), str(pg.evaluate("()=>document.documentElement.scrollWidth")))
    ok('all three drawings fit the panel width', pg.evaluate("()=>[...document.querySelectorAll('#panel-chakra svg.chx-svg')].every(s=>s.getBoundingClientRect().width<=window.innerWidth)"))
    # panel rebuilds if missing (late-panel path)
    pg.evaluate("()=>{document.getElementById('panel-chakra').remove();switchAppTab('panel-chakra')}"); pg.wait_for_timeout(900)
    ok('panel rebuilds if missing', pg.evaluate("()=>document.querySelectorAll('#panel-chakra svg.chx-svg').length===3"))
    ok('no page errors after all interactions', not errs, '; '.join(errs)[:300])
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        pg.evaluate("()=>{document.getElementById('chxNow').click()}"); pg.wait_for_timeout(400)
        for i, sel in enumerate(['.chx-ctl', '#chxBody .chx-sec:nth-of-type(1)', '#chxBody .chx-sec:nth-of-type(2)', '#chxBody .chx-sec:nth-of-type(3)']):
            el = pg.query_selector('#panel-chakra ' + sel)
            if el: el.scroll_into_view_if_needed(); pg.wait_for_timeout(200); el.screenshot(path=os.path.join(SHOTS, 'chx%d.png' % i))
    b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print('ok  ' if c else 'FAIL', n, ('(' + d + ')') if (d and not c) else '')
print('%d/%d passed' % (len(res) - len(bad), len(res)))
sys.exit(1 if bad else 0)

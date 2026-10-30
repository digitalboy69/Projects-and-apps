# Gulika (Mandi) in the Birth Chart (js/117-gulika.js) and 3D Sky (js/52-gulika.js): day/night tables, previous-day rule before sunrise, start<middle<end,
# chart wheels, Planets panel, report text, both engines agree, 3D dashboard row. Run: THREE_JS=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/gulika_test.py
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
THREE = open(os.environ['THREE_JS'], 'rb').read() if os.environ.get('THREE_JS') else None
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
B = 'http://127.0.0.1:%d' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
def route(r):
    u = r.request.url
    if 'three.min.js' in u and THREE: return r.fulfill(status=200, content_type='application/javascript', body=THREE)
    return r.continue_() if u.startswith((B, 'data:', 'blob:', 'about:')) else r.abort()
CAST = "(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}"
DEMO = dict(name='Demo', dob='2026-11-01', tob='12:00', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)   # a Sunday
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 390, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('**/*', route)
    pg.goto(B + '/apps/birth-chart/index.html'); pg.wait_for_selector('#birthForm'); pg.evaluate(CAST, DEMO); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1500)
    JD = "(h,m)=>toJulianDay(2026,11,1,h,m,0)-5.5/24"
    day = pg.evaluate("()=>{const jd=toJulianDay(2026,11,1,12,0,0)-5.5/24,g=computeGulika(jd,28.6139,77.2090,5.5,'start'),r=pnRiseSet(2026,11,1,28.6139,77.2090,5.5);return {g,r,exp:r.rise+6/8*(r.set-r.rise)}}")
    ok('Sunday day birth: part 7 of the day, asc at that moment', day['g']['isDay'] and day['g']['part'] == 7 and abs(day['g']['jd'] - day['exp']) < 1e-6, day['g'])
    night = pg.evaluate("()=>{const jd=toJulianDay(2026,11,1,20,0,0)-5.5/24,g=computeGulika(jd,28.6139,77.2090,5.5,'start'),r=pnRiseSet(2026,11,1,28.6139,77.2090,5.5),n=pnRiseSet(2026,11,2,28.6139,77.2090,5.5);return {g,exp:r.set+2/8*(n.rise-r.set)}}")
    ok('Sunday night birth: part 3 of the night', (not night['g']['isDay']) and night['g']['part'] == 3 and abs(night['g']['jd'] - night['exp']) < 1e-6, night['g'])
    pre = pg.evaluate("()=>computeGulika(toJulianDay(2026,11,1,4,0,0)-5.5/24,28.6139,77.2090,5.5,'start')")
    ok('before sunrise uses the night before (Saturday, part 4)', (not pre['isDay']) and pre['weekday'] == 6 and pre['part'] == 4, pre)
    m = pg.evaluate("()=>{const jd=toJulianDay(2026,11,1,12,0,0)-5.5/24;return ['start','middle','end'].map(w=>computeGulika(jd,28.6139,77.2090,5.5,w).jd)}")
    ok('start < middle < end', m[0] < m[1] < m[2], m)
    ok('night table has Saturn parts 3,2,1,7,6,5,4 and day 7..1', pg.evaluate("()=>JSON.stringify(GUL_NIGHT)+JSON.stringify(GUL_DAY)")=='[3,2,1,7,6,5,4][7,6,5,4,3,2,1]')
    ok('polar night returns null, no crash', pg.evaluate("()=>computeGulika(toJulianDay(2026,12,21,12,0,0),80,20,1,'start')")  is None)
    # chart integration
    ok('chart has Gulika with house and nakshatra', pg.evaluate("()=>{const g=currentChartForModal.upagraha.Gulika;return g&&g.house>=1&&g.house<=12&&g.nakshatra&&g.nakshatra.name&&g.where==='start'}"))
    ok('Gulika is in every divisional chart', pg.evaluate("()=>Object.keys(currentChartForModal.vargas).every(k=>Number.isInteger(currentChartForModal.vargas[k].outerSign.Gulika))"))
    ok('9 grahas stay 9', pg.evaluate("()=>PLANET_LIST.length===9&&!PLANET_LIST.includes('Gulika')&&OUTER_LIST.length===3"))
    pg.evaluate("()=>switchAppTab('panel-planets')"); pg.wait_for_timeout(400)
    ok('Planets panel shows Gulika card', pg.evaluate("()=>/Gulika/.test(document.getElementById('panel-planets').innerText)&&!!document.querySelector('.pl-gulika .pl-card')"))
    pg.evaluate("()=>switchAppTab('panel-vargas')"); pg.wait_for_timeout(500)
    ok('D1 wheel draws Gulika, checkbox hides it', pg.evaluate("()=>document.querySelectorAll('#vargaDisplayContainer [data-p=Gulika]').length>=1"))
    pg.evaluate("()=>{const c=document.querySelector('.gulika-chk-input');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}))}"); pg.wait_for_timeout(500)
    ok('checkbox off removes it', pg.evaluate("()=>document.querySelectorAll('#vargaDisplayContainer [data-p=Gulika]').length===0"))
    pg.evaluate("()=>{const c=document.querySelector('.gulika-chk-input');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))}")
    ok('report text mentions Gulika', pg.evaluate("()=>GUL.text(currentChartForModal).includes('Gulika (Mandi)')"))
    ok('no page errors (birth chart)', not errs, errs[:2])
    if THREE:
        s = b.new_page(viewport={'width': 390, 'height': 800}); e2 = []; s.on('pageerror', lambda e: e2.append(str(e))); s.route('**/*', route)
        s.goto(B + '/apps/sky3d/index.html'); s.wait_for_timeout(6000)
        a = s.evaluate("()=>{const jd=toJulianDay(2026,11,1,12,0,0)-5.5/24,g=GK.at(jd,28.6139,77.2090,5.5);return {l:g.lon,p:g.part,d:g.isDay}}")
        bb = pg.evaluate("()=>computeGulika(toJulianDay(2026,11,1,12,0,0)-5.5/24,28.6139,77.2090,5.5,'start').longitude")
        dd = abs((a['l'] - bb + 180) % 360 - 180)
        ok('3D and Birth Chart engines agree (< 0.3 deg)', a['p'] == 7 and a['d'] and dd < 0.3, (a, bb, dd))
        ok('3D has a Gulika switch and marker', s.evaluate("()=>!!document.getElementById('L_gulika')&&!!A.T.gulL&&!!A.T.gulN"))
        ok('3D label shows after refresh', s.evaluate("()=>{updateOverlays(snapshotPositions(currentJD));return /Gu/.test(labelNodes.ghost_gul.el.innerText)}"))
        s.evaluate("()=>document.getElementById('dashBtn').click()"); s.wait_for_timeout(1500)
        f = [x for x in s.frames][0]
        ok('3D dashboard has a Gulika card and text line', s.evaluate("()=>/Gulika \\(Mandi\\)/.test((document.getElementById('dbx-out')||{}).textContent||'')&&/GULIKA/.test(DBX.text())"))
        ok('no page errors (3D)', not e2, e2[:2])
    b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)

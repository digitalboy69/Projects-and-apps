# Today for You (js/122-today-for-you.js): Chandrabala, Tarabala, Gochara maths, good slots vs Rahu Kalam, panel behaviour. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/today_for_you_test.py
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
CAST = "(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}"
A = dict(name='Demo A', dob='2000-01-01', tob='06:30', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)   # Moon Libra, Swati
B = dict(name='Demo B', dob='1985-03-14', tob='10:10', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)
GOOD = {'Sun':[3,6,10,11],'Moon':[1,3,6,7,10,11],'Mars':[3,6,11],'Mercury':[2,4,6,8,10,11],'Jupiter':[2,5,7,9,11],'Venus':[1,2,3,4,5,8,9,11,12],'Saturn':[3,6,11],'Rahu':[3,6,11],'Ketu':[3,6,11]}
TN = ['Janma','Sampat','Vipat','Kshema','Pratyak','Sadhana','Naidhana','Mitra','Parama Mitra']
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 390, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate(CAST, A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1500)
    bad = []
    for d in range(1, 11):
        r = pg.evaluate("""(d)=>{const c=currentChartForModal,pf=window.__vgProf,jd=toJulianDay(2026,11,d,9,0,0)-5.5/24,x=TDY.compute(c,pf,jd);
          return {cb:x.cb,tr:x.tr,trName:x.trName,tNak:x.tNak,mSign:x.P.moonSign,bSign:c.planets.Moon.sign,bNak:c.planets.Moon.nakshatra.index,goch:x.goch.map(g=>[g.n,g.house,g.good,g.sign]),tone:x.tone,cbGood:x.cbGood,tGood:x.tGood}}""", d)
        cb = (r['mSign'] - r['bSign'] + 12) % 12 + 1; c = (r['tNak'] - r['bNak'] + 27) % 27 + 1; tr = 9 if c % 9 == 0 else c % 9
        if r['cb'] != cb or r['tr'] != tr or r['trName'] != TN[tr - 1]: bad.append(('cb/tr', d, r['cb'], cb, r['tr'], tr))
        if r['cbGood'] != (cb in [1,3,6,7,10,11]) or r['tGood'] != (tr not in [3,5,7]): bad.append(('good', d))
        for n, h, g, s in r['goch']:
            if h != (s - r['bSign'] + 12) % 12 + 1 or g != (h in GOOD[n]): bad.append(('goch', d, n, h, g))
        exp = 'Supportive' if (r['cbGood'] and r['tGood']) else 'Mixed' if (r['cbGood'] or r['tGood']) else 'Go gently'
        if r['tone'] != exp: bad.append(('tone', d, r['tone'], exp))
    ok('Chandrabala, Tarabala, Gochara and tone are right for 10 days', not bad, bad[:3])
    PR = {'Sun':{3:9,6:12,10:4,11:5},'Moon':{1:5,3:9,6:12,7:2,10:4,11:8},'Mars':{3:12,6:9,11:5},'Mercury':{2:5,4:3,6:9,8:1,10:8,11:12},'Jupiter':{2:12,5:4,7:3,9:10,11:8},
          'Venus':{1:8,2:7,3:1,4:10,5:9,8:5,9:11,11:6,12:3},'Saturn':{3:12,6:9,11:5}}
    EX = [{'Sun','Saturn'},{'Moon','Mercury'}]
    vbad = []; seen = 0; clean_ok = True; shot_day = None
    for d in range(1, 31):
        r = pg.evaluate("""(d)=>{const x=TDY.compute(currentChartForModal,window.__vgProf,toJulianDay(2026,11,d,9,0,0)-5.5/24);
          return {g:x.goch.map(g=>[g.n,g.house,g.good,g.blockedBy||[]]),html:TDY.html(currentChartForModal,window.__vgProf,toJulianDay(2026,11,d,9,0,0)-5.5/24)}}""", d)
        hs = {n: h for n, h, g, bl in r['g']}
        any_b = False
        for n, h, g, bl in r['g']:
            if n not in PR: 
                if bl: vbad.append(('node', d, n))
                continue
            exp = [o for o in PR if o != n and h in PR[n] and hs[o] == PR[n][h] and {n, o} not in EX]
            if sorted(bl) != sorted(exp): vbad.append((d, n, h, bl, exp))
            if bl and not g: vbad.append(('blocked but not good', d, n))
            any_b = any_b or bool(bl)
        if any_b: seen += 1; shot_day = shot_day or d
        if ('tdy-gv' in r['html']) != any_b or ('Vedha:' in r['html']) != any_b: vbad.append(('html', d))
    ok('vedha marks match an independent copy of the table for 30 days; html shows them only when one applies', not vbad, vbad[:3])
    ok('at least one day in the month has a vedha, and one has none (both paths exercised)', 0 < seen < 30, seen)
    if os.environ.get('GV_SHOTS') and shot_day:
        os.makedirs(os.environ['GV_SHOTS'], exist_ok=True)
        pg.evaluate("()=>document.querySelector('#panel-home [data-go=panel-today]').click()"); pg.wait_for_timeout(600)
        pg.evaluate("(d)=>{document.getElementById('tdyTime').value='09:00';const e=document.getElementById('tdyDate');e.value='2026-11-'+String(d).padStart(2,'0');e.dispatchEvent(new Event('input',{bubbles:true}))}", shot_day); pg.wait_for_timeout(400)
        pg.evaluate("()=>{const e=document.querySelector('.tdy-gv');if(e)e.scrollIntoView({block:'center'})}"); pg.wait_for_timeout(300)
        pg.screenshot(path=os.path.join(os.environ['GV_SHOTS'], 'gv1.png'))
    ok('9 planets in the gochara list', pg.evaluate("()=>TDY.compute(currentChartForModal,window.__vgProf,toJulianDay(2026,11,3,9,0,0)-5.5/24).goch.length")==9)
    ok('slots flagged when they overlap Rahu Kalam', pg.evaluate("""()=>{const jd=toJulianDay(2026,11,3,9,0,0)-5.5/24,x=TDY.compute(currentChartForModal,window.__vgProf,jd),rk=x.P.rahu;return x.slots.length>0&&x.slots.every(s=>s.rahu===(s.from<rk[1]&&s.to>rk[0]))&&x.slots.every(s=>['Amrit','Shubh','Labh'].includes(s.name))}"""))
    pg.evaluate("()=>document.querySelector('#panel-home [data-go=panel-today]').click()"); pg.wait_for_timeout(800)
    ok('Home card opens Today for You with content', pg.evaluate("()=>{const e=document.getElementById('panel-today');return e&&e.classList.contains('active')&&e.querySelectorAll('.tdy-g').length===9&&!!e.querySelector('.tdy-hero')}"))
    pg.evaluate("()=>{document.getElementById('tdyTime').value='12:00';const d=document.getElementById('tdyDate');d.value='2026-11-04';d.dispatchEvent(new Event('input',{bubbles:true}))}"); pg.wait_for_timeout(300)
    t = pg.evaluate("()=>document.getElementById('tdyBody').innerText")
    ok('date change redraws for Wednesday 4 Nov', 'Wednesday' in t and '4 Nov 2026' in t, t[:80])
    pg.evaluate("()=>document.getElementById('tdyNow').click()"); pg.wait_for_timeout(300)
    ok('Now button works', pg.evaluate("()=>document.querySelectorAll('#tdyBody .tdy-g').length===9"))
    ok('no sideways scroll at 390', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"))
    # second profile gets its own screen
    pg.evaluate(CAST, B); pg.wait_for_function("()=>window.__vgProf&&window.__vgProf.name==='Demo B'"); pg.wait_for_timeout(1500)
    pg.evaluate("()=>switchAppTab('panel-today')"); pg.wait_for_timeout(600)
    t = pg.evaluate("()=>document.getElementById('panel-today').innerText")
    ok('new profile shows its own name', 'Demo B' in t and 'Demo A' not in t, t[:90])
    ok('text summary', 'Chandrabala' in pg.evaluate("()=>TDY.text(currentChartForModal,window.__vgProf,toJulianDay(2026,11,3,9,0,0)-5.5/24)"))
    ok('no page errors', not errs, errs[:2]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)

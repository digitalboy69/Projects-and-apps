# 3D Sky Timeline finder (js/63 TLF, css/34): ingress dates vs known sidereal values, Sun in Libra + Moon in Pisces, ALL vs ANY, planets meet, retrograde, and the sheet at 390 and 360.
# Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/sky3d_timeline_finder_browser_test.py  (TL_SHOTS=dir saves screenshots)
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); SHOTS = os.environ.get('TL_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/sky3d/index.html' % srv.server_address[1]
STUB = """(()=>{const mk=()=>{const f=function(){};const p=new Proxy(f,{get:(t,k)=>k===Symbol.toPrimitive?()=>0:(k==='domElement'?(window.__cv||(window.__cv=document.createElement('canvas'))):(k==='length'?0:(k==='children'?[]:p))),apply:()=>p,construct:()=>p,set:()=>true});return p};window.THREE=mk();})();"""
bad = 0
def ok(n, c, d=''):
    global bad; bad += (not c); print(('ok   ' if c else 'FAIL ') + n, '' if c else d)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'))
    for W, H in ((390, 800), (360, 640)):
        ctx = b.new_context(viewport={'width': W, 'height': H}, timezone_id='Asia/Kolkata'); pg = ctx.new_page(); errs = []; T = '%dx%d: ' % (W, H)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        def route(r):
            u = r.request.url
            if 'three.min.js' in u: r.fulfill(body=STUB, content_type='application/javascript')
            elif u.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')): r.continue_()
            else: r.abort()
        pg.route('**/*', route); pg.goto(PAGE); pg.wait_for_timeout(2500)
        pg.evaluate("()=>localStorage.removeItem('sky3d_tlf')")
        jd = lambda y, m, d: pg.evaluate("([y,m,d])=>toJulianDay(y,m,d,0,0,0)", [y, m, d])
        if W == 390:
            # Saturn in Capricorn (sidereal) 2019-06 .. 2023-06: two stays (one after a retrograde dip back)
            r = pg.evaluate("""async()=>{const r=await TLF.search([{t:'sign',planets:['Saturn'],v:9,mode:'all'}],'all',toJulianDay(2019,6,1,0,0,0),toJulianDay(2023,6,1,0,0,0));return r.windows.map(w=>[jdToParts(w.from),jdToParts(w.to)].map(p=>p.y+'-'+p.m+'-'+p.d))}""")
            exp = [('2020-1-23', '2022-4-29'), ('2022-7-12', '2023-1-17')]
            near = lambda a, e: abs(pg.evaluate("([a,e])=>{const f=s=>{const [y,m,d]=s.split('-').map(Number);return toJulianDay(y,m,d,0,0,0)};return Math.abs(f(a)-f(e))}", [a, e])) <= 2
            ok(T + 'Saturn in Capricorn: two stays at the known dates (retrograde dip back included)', len(r) == 2 and all(near(r[i][0], exp[i][0]) and near(r[i][1], exp[i][1]) for i in range(2)), r)
            r = pg.evaluate("""async()=>{const R=[['Jupiter',1,2024,5,1],['Jupiter',2,2025,5,14]];const o=[];for(const [n,v,y,m,d] of R){const x=await TLF.search([{t:'sign',planets:[n],v,mode:'all'}],'all',toJulianDay(y,m-1,1,0,0,0),toJulianDay(y,m+1,28,0,0,0));const p=jdToParts(x.windows[0].from);o.push(p.y+'-'+p.m+'-'+p.d)}return o}""")
            ok(T + 'Jupiter into Taurus 1 May 2024 and into Gemini 14 May 2025', r == ['2024-5-1', '2025-5-14'], r)
            # Sun in Libra + Moon in Pisces over the last 10 years of ages 30-40
            r = pg.evaluate("""async()=>{const rg=TLF.ageRange(30,40);const x=await TLF.search([{t:'sign',planets:['Sun'],v:6,mode:'all'},{t:'sign',planets:['Moon'],v:11,mode:'all'}],'all',rg.from,rg.to);
              const good=x.windows.every(w=>{const m=w.mid;return Math.floor(siderealLongitude('Sun',m)/30)===6&&Math.floor(siderealLongitude('Moon',m)/30)===11});
              return {n:x.windows.length,good,maxDays:Math.max(...x.windows.map(w=>w.to-w.from)),minDays:Math.min(...x.windows.map(w=>w.to-w.from)),span:(rg.to-rg.from)/365.2425}}""")
            ok(T + 'Sun in Libra + Moon in Pisces over a 10-year span: about one 2-day window a year', abs(r['span'] - 10) < .01 and 9 <= r['n'] <= 11 and r['good'] and r['maxDays'] < 3 and r['minDays'] > .5, r)
            r = pg.evaluate("""async()=>{const rg=TLF.yearRange(1990,1999);const A=[{t:'sign',planets:['Sun'],v:6,mode:'all'},{t:'sign',planets:['Moon'],v:11,mode:'all'}];
              const all=await TLF.search(A,'all',rg.from,rg.to),any=await TLF.search(A,'any',rg.from,rg.to);return [all.windows.length,any.windows.length]}""")
            ok(T + 'ANY gives more periods than ALL', r[1] > r[0] and r[0] >= 9, r)
            r = pg.evaluate("""async()=>{const x=await TLF.search([{t:'rel',a:'Sun',b:'Moon',rel:'opp',orb:6}],'all',toJulianDay(2024,1,1,0,0,0),toJulianDay(2025,1,1,0,0,0));return x.windows.length}""")
            ok(T + 'Sun-Moon opposite (full moon) about 12 or 13 times a year', r in (12, 13), r)
            r = pg.evaluate("""async()=>{const x=await TLF.search([{t:'retro',planets:['Mercury'],on:true,mode:'all'}],'all',toJulianDay(2024,2,1,0,0,0),toJulianDay(2025,1,1,0,0,0));return [x.windows.length,Math.round(x.windows[0].to-x.windows[0].from)]}""")
            ok(T + 'Mercury retrograde: three stretches of about 3 weeks between Feb 2024 and Jan 2025', r[0] == 3 and 18 <= r[1] <= 26, r)
            r = pg.evaluate("""async()=>{const x=await TLF.search([{t:'nak',planets:['Moon'],v:0,mode:'all'}],'all',toJulianDay(2024,1,1,0,0,0),toJulianDay(2024,3,1,0,0,0));return [x.windows.length,Math.round((x.windows[0].to-x.windows[0].from)*10)/10]}""")
            ok(T + 'Moon in Ashwini: a visit about every 27 days lasting about a day', 2 <= r[0] <= 3 and .8 <= r[1] <= 1.2, r)
        # UI
        pg.click('#toolsBtn'); pg.wait_for_timeout(250)
        ok(T + 'Timeline finder button is in the Tools menu', pg.evaluate("()=>!!document.getElementById('tlBtn')&&document.getElementById('tlBtn').getBoundingClientRect().height>=40"))
        pg.click('#tlBtn'); pg.wait_for_timeout(400)
        ok(T + 'sheet opens with 2 default conditions (Sun in Libra, Moon in Pisces)', pg.evaluate("()=>document.getElementById('tlfSheet').offsetHeight>0&&document.querySelectorAll('#tlfBody .tlf-c').length===2"))
        if SHOTS: os.makedirs(SHOTS, exist_ok=True); pg.screenshot(path=f'{SHOTS}/tl_{W}_form.png')
        pg.click('[data-a=find]'); pg.wait_for_selector('.tlf-r', timeout=20000); pg.wait_for_timeout(400)
        n = pg.evaluate("()=>document.querySelectorAll('.tlf-r').length"); ok(T + 'Find lists periods', 9 <= n <= 12, n)
        if SHOTS: pg.screenshot(path=f'{SHOTS}/tl_{W}_results.png')
        pg.locator('.tlf-rh').nth(2).click(); pg.wait_for_timeout(300)
        ok(T + 'tapping a result opens every planet on that day (12 rows, Sun in Libra, Moon in Pisces)', pg.evaluate("()=>{const r=[...document.querySelectorAll('.tlf-day .tlf-pr')].map(x=>x.textContent);return r.length===12&&/Sun[^]*Libra/.test(r[0])&&/Moon[^]*Pisces/.test(r[1])}"))
        t1 = pg.evaluate("()=>document.querySelector('.tlf-dh b').textContent"); pg.click('.tlf-day [data-a=mo][data-v=start]'); pg.wait_for_timeout(200)
        t2 = pg.evaluate("()=>document.querySelector('.tlf-dh b').textContent"); ok(T + 'Start / Middle / End changes the moment', t1 != t2, (t1, t2))
        ok(T + 'open card fits width', pg.evaluate("()=>{const b=document.getElementById('tlfBody');return b.scrollWidth<=b.clientWidth+1}"))
        if SHOTS: pg.locator('.tlf-r.open').scroll_into_view_if_needed(); pg.screenshot(path=f'{SHOTS}/tl_{W}_day.png')
        before = pg.evaluate("()=>currentJD"); pg.click('.tlf-go2'); pg.wait_for_timeout(400)
        ok(T + 'Open this date closes the sheet and jumps the sky there', pg.evaluate("(b)=>!document.getElementById('tlfSheet').offsetHeight&&Math.abs(currentJD-b)>300", before))
        pg.click('#toolsBtn'); pg.click('#tlBtn'); pg.wait_for_timeout(300)
        pg.click('[data-a=add]'); pg.wait_for_timeout(200)
        ok(T + 'add another condition (3 now), planets can be picked, ALL/ANY toggle shown', pg.evaluate("()=>document.querySelectorAll('#tlfBody .tlf-c').length===3&&!!document.querySelector('#tlfBody .tlf-match')"))
        pg.evaluate("()=>{const s=document.getElementById('tlfBody');s.scrollTop=s.scrollHeight}"); pg.wait_for_timeout(200)
        ok(T + 'no horizontal overflow', pg.evaluate("()=>document.getElementById('tlfBody').scrollWidth<=document.getElementById('tlfBody').clientWidth+1"))
        if SHOTS: pg.screenshot(path=f'{SHOTS}/tl_{W}_three.png')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
        ok(T + 'Escape closes the sheet', pg.evaluate("()=>!document.getElementById('tlfSheet').offsetHeight"))
        ok(T + 'no page errors', not errs, errs)
        ctx.close()
    b.close()
print('FAILED' if bad else 'ALL OK'); raise SystemExit(1 if bad else 0)

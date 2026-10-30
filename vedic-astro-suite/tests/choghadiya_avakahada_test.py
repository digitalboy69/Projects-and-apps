# Choghadiya (js/118) and Avakahada Chakra (js/119): weekday start tables, 8 equal parts, panel in Panchanga, Avakahada values for a known Moon (Libra, Swati pada 3),
# Home card, 390 px. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/choghadiya_avakahada_test.py
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
DEMO = dict(name='Demo User', dob='2000-01-01', tob='06:30', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 390, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate(CAST, DEMO); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1500)
    # weekday tables: build P for each weekday of Nov 2026 (Sun Nov 1 .. Sat Nov 7) at noon
    names = pg.evaluate("""()=>{const o=[];for(let d=1;d<=7;d++){const jd=toJulianDay(2026,11,d,12,0,0)-5.5/24,P=panchangaAt(jd,28.6139,77.2090,5.5),c=CHG.parts(P);o.push([P.vara.name,c.day.map(x=>x.name).join(' '),c.night.map(x=>x.name).join(' ')]);}return o}""")
    exp_day = {'Sunday':'Udveg Chal Labh Amrit Kaal Shubh Rog Udveg','Monday':'Amrit Kaal Shubh Rog Udveg Chal Labh Amrit','Tuesday':'Rog Udveg Chal Labh Amrit Kaal Shubh Rog','Wednesday':'Labh Amrit Kaal Shubh Rog Udveg Chal Labh','Thursday':'Shubh Rog Udveg Chal Labh Amrit Kaal Shubh','Friday':'Chal Labh Amrit Kaal Shubh Rog Udveg Chal','Saturday':'Kaal Shubh Rog Udveg Chal Labh Amrit Kaal'}
    exp_night = {'Sunday':'Shubh Amrit Chal Rog Kaal Labh Udveg Shubh','Monday':'Chal Rog Kaal Labh Udveg Shubh Amrit Chal','Tuesday':'Kaal Labh Udveg Shubh Amrit Chal Rog Kaal','Wednesday':'Udveg Shubh Amrit Chal Rog Kaal Labh Udveg','Thursday':'Amrit Chal Rog Kaal Labh Udveg Shubh Amrit','Friday':'Rog Kaal Labh Udveg Shubh Amrit Chal Rog','Saturday':'Labh Udveg Shubh Amrit Chal Rog Kaal Labh'}
    ok('day order for all 7 weekdays', all(exp_day[n] == d for n, d, _ in names), [n for n, d, _ in names if exp_day[n] != d])
    ok('night order for all 7 weekdays', all(exp_night[n] == nn for n, _, nn in names), [n for n, _, nn in names if exp_night[n] != nn])
    eq = pg.evaluate("""()=>{const jd=toJulianDay(2026,11,1,12,0,0)-5.5/24,P=panchangaAt(jd,28.6139,77.2090,5.5),c=CHG.parts(P),l=c.day[0].to-c.day[0].from;return c.day.every((x,i)=>Math.abs((x.to-x.from)-l)<1e-9&&(i==0||Math.abs(x.from-c.day[i-1].to)<1e-9))&&Math.abs(c.day[0].from-P.sunrise)<1e-9&&Math.abs(c.day[7].to-P.sunset)<1e-9&&Math.abs(c.night[7].to-P.nextSunrise)<1e-9}""")
    ok('8 equal slots from sunrise to sunset, night to next sunrise', eq)
    pg.evaluate("()=>switchAppTab('panel-panchanga')"); pg.wait_for_timeout(800)
    ok('Panchanga panel shows Choghadiya', pg.evaluate("()=>document.querySelectorAll('#panel-panchanga .chg-r').length===16"))
    ok('exactly one slot or none marked now', pg.evaluate("()=>document.querySelectorAll('#panel-panchanga .chg-r.now').length<=1"))
    ok('Home card for Avakahada', pg.evaluate("()=>!!document.querySelector('#panel-home [data-go=panel-avakahada]')"))
    pg.evaluate("()=>switchAppTab('panel-avakahada')"); pg.wait_for_timeout(500)
    t = pg.evaluate("()=>document.getElementById('panel-avakahada').innerText.replace(/\\s+/g,' ')")
    for k, v in [('Varna','Shudra'),('Vashya','Manav'),('Yoni','Buffalo'),('Gana','Deva'),('Nadi','Antya'),('Paya','Gold'),('Name sound','Ro'),('Sign lord','Venus'),('Star lord','Rahu')]:
        ok('Avakahada %s = %s' % (k, v), (k + ' ' + v).lower() in t.lower() or (k in t and v in t), t[:80])
    ok('Tithi, Karana, Yoga, weekday present', all(x in t for x in ['Tithi','Karana','Yoga','Weekday']))
    ok('no sideways scroll at 390', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"))
    ok('tables match the Kundali Matching engine', pg.evaluate("()=>JSON.stringify(AVK.tables.VARNA)===JSON.stringify(KM_VARNA)&&JSON.stringify(AVK.tables.GANA)===JSON.stringify(KM_GANA)&&JSON.stringify(AVK.tables.YONI)===JSON.stringify(KM_YONI_NAK)&&JSON.stringify(AVK.tables.NADI)===JSON.stringify(KM_NADI.map(i=>['Adi','Madhya','Antya'][i]))"))
    ok('plain text', len(pg.evaluate("()=>AVK.text(currentChartForModal,window.__vgProf)")) > 200)
    ok('no page errors', not errs, errs[:2]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)

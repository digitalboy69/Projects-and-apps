# KP system (js/125-kp-system.js): sub-lord table, Placidus cusps, significators, panel. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/kp_test.py
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
A = dict(name='Demo A', dob='2000-01-01', tob='06:30', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)
SEQ = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"]; Y = dict(Ketu=7,Venus=20,Sun=6,Moon=10,Mars=7,Rahu=18,Jupiter=16,Saturn=19,Mercury=17)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 390, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate(CAST, A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1500)
    # sub lords: first degree of Ashwini = Ketu/Ketu/Ketu; sub lengths follow Vimshottari; whole nakshatra covers all 9 subs once
    ok('0 deg Aries: Ketu star, Ketu sub', pg.evaluate("()=>{const l=KP.lords(0.001);return l.star==='Ketu'&&l.sub==='Ketu'&&l.signLord==='Mars'}"))
    ok('Ashwini subs: Ketu 0.7778 deg then Venus', pg.evaluate("()=>KP.lords(0.7).sub==='Ketu'&&KP.lords(0.8).sub==='Venus'&&KP.lords(0.8).star==='Ketu'"))
    ok('Sub spans proportional (bisect all 27 nakshatras)', pg.evaluate("""()=>{const SEQ=%s,Y=%s,N=360/27;let bad=0;for(let n=0;n<27;n++){let pos=n*N,s=n%%9;for(let k=0;k<9;k++){const l=SEQ[(s+k)%%9],sp=N*Y[l]/120,mid=pos+sp/2,x=KP.lords(mid);if(x.sub!==l||x.star!==SEQ[s])bad++;pos+=sp}}return bad===0}""" % (SEQ, Y)))
    ok('Sub-sub spans proportional (bisect all subs)', pg.evaluate("""()=>{const SEQ=%s,Y=%s,N=360/27;let bad=0;for(let n=0;n<27;n++){let pos=n*N,s=n%%9;for(let k=0;k<9;k++){const sl=SEQ[(s+k)%%9],sp=N*Y[sl]/120;let p2=pos;for(let j=0;j<9;j++){const l2=SEQ[((s+k)%%9+j)%%9],sp2=sp*Y[l2]/120,x=KP.lords(p2+sp2/2);if(x.subsub!==l2||x.sub!==sl)bad++;p2+=sp2}pos+=sp}}return bad===0}""" % (SEQ, Y)))
    # Placidus: lat 0 closed form; asc agrees with engine; MC; order
    ok('Placidus at equator: cusps 11/12 are 30/60 deg of RA from MC', pg.evaluate("""()=>{const jd=2451545.5,c=KP.placidus(jd,0,77.2),eps=obliquityOfEcliptic(jd)*Math.PI/180,ramc=(greenwichSiderealTime(jd)+77.2)%360,f=r=>((Math.atan2(Math.sin(r*Math.PI/180),Math.cos(r*Math.PI/180)*Math.cos(eps))*180/Math.PI)%360+360)%360,d=(a,b)=>Math.abs(((a-b+540)%360)-180);return d(c[10],f(ramc+30))<1e-4&&d(c[11],f(ramc+60))<1e-4&&d(c[9],f(ramc))<1e-6}"""))
    ok('Cusp 1 equals the engine ascendant, order is increasing', pg.evaluate("""()=>{const jd=currentChartForModal.julianDay,c=KP.placidus(jd,28.6139,77.209),a=ascendantLongitude(jd,28.6139,77.209);let ok=Math.abs(c[0]-a)<1e-6;for(let i=0;i<12;i++){const d=(c[(i+1)%12]-c[i]+360)%360;if(d<=0||d>=90)ok=false}return ok}"""))
    ok('Opposite cusps are 180 apart', pg.evaluate("()=>{const c=KP.placidus(currentChartForModal.julianDay,28.6139,77.209);return [0,1,2,3,4,5].every(i=>Math.abs((((c[i+6]-c[i])%360+360)%360)-180)<1e-6)}"))
    ok('Placidus gives up beyond 66 deg', pg.evaluate("()=>KP.placidus(2451545.5,70,20)===null"))
    ok('Planet 12-house partition and 9 grahas', pg.evaluate("()=>{const d=KP.compute(currentChartForModal,window.__vgProf);return PLANET_LIST.length===9&&Object.values(d.occ).flat().length===9&&PLANET_LIST.every(n=>d.P[n].house>=1&&d.P[n].house<=12&&d.P[n].signif.length>=1)}"))
    ok('Signifies = star-lord houses plus own houses', pg.evaluate("""()=>{const d=KP.compute(currentChartForModal,window.__vgProf);return PLANET_LIST.every(n=>{const p=d.P[n],s=d.P[p.star],own=[...Object.entries(d.owners)].filter(([h,o])=>o.includes(n)).map(x=>+x[0]),stw=[...Object.entries(d.owners)].filter(([h,o])=>o.includes(p.star)).map(x=>+x[0]);const exp=new Set([p.house,...own,s.house,...stw]);return exp.size===p.signif.length&&p.signif.every(h=>exp.has(h))})}"""))
    ok('Promise checks and ruling planets present', pg.evaluate("()=>{const d=KP.compute(currentChartForModal,window.__vgProf);return d.promise.length===6&&d.rp&&d.rp.items.length===5}"))
    pg.evaluate("()=>document.querySelector('#panel-home [data-go=panel-kp]').click()"); pg.wait_for_timeout(900)
    ok('Home card opens KP with cusps, planets, promise', pg.evaluate("()=>{const e=document.getElementById('panel-kp');return e&&e.classList.contains('active')&&e.querySelectorAll('.kp-t').length>=3&&e.querySelectorAll('.kp-p').length===6}"))
    ok('KP ayanamsa button shown when not KP', pg.evaluate("()=>!!document.getElementById('kpAyn')"))
    pg.evaluate("()=>document.getElementById('kpAyn').click()"); pg.wait_for_function("()=>{const e=document.getElementById('panel-kp');return e&&e.classList.contains('active')&&document.querySelector('.kp-ayn.on')}", timeout=20000)
    ok('Button switches to KP ayanamsa and refreshes', pg.evaluate("()=>ayanKey()==='kp'&&!document.getElementById('kpAyn')&&document.querySelector('.kp-ayn').classList.contains('on')"))
    ok('Tables scroll inside their own box (no page sideways scroll)', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"))
    ok('Text summary', 'KP system' in pg.evaluate("()=>KP.text(currentChartForModal,window.__vgProf)"))
    pg.evaluate("()=>{document.getElementById('panel-kp').remove();switchAppTab('panel-kp')}"); pg.wait_for_timeout(600)
    ok('Panel rebuilds if missing', pg.evaluate("()=>document.querySelectorAll('#panel-kp .kp-t').length>=3"))
    pg.evaluate("()=>setAyanamsa('lahiri')"); pg.wait_for_timeout(500)
    ok('no page errors', not errs, errs[:2]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)

# Hora engine (js/156) checked inside the real app against panchangaAt. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/hora_test.py
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
A = dict(name='Demo A', dob='2000-01-01', tob='06:30', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)
L = "28.6139,77.2090,5.5"
with sync_playwright() as p:
    kw = {'executable_path': CHROME} if os.path.exists(CHROME) else {}
    b = p.chromium.launch(**kw); pg = b.new_page(viewport={'width': 390, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate("(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}", A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1200)
    ev = lambda js: pg.evaluate(js)
    ok('HORA is loaded', ev("()=>typeof HORA==='object'&&HORA.ORDER.join()==='Saturn,Jupiter,Mars,Sun,Venus,Mercury,Moon'"))
    days = ev("()=>HORA.week('2026-11-01',7,%s)" % L) if False else None
    chk = ev("""()=>{const D=HORA.week('2026-11-01',7,28.6139,77.2090,5.5),W=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'],O=HORA.ORDER,r={};
      r.n=D.length; r.dates=D.map(d=>d.date).join();
      r.firstLord=D.every((d,i)=>d.horas[0].lord===W[i]&&d.vara.lord===W[i]);
      r.chaldean=D.every(d=>d.horas.every((h,i)=>h.lord===O[(O.indexOf(d.horas[0].lord)+i)%7]));
      r.contig=D.every(d=>d.horas.every((h,i)=>i===0||Math.abs(h.from-d.horas[i-1].to)<1e-9));
      r.edges=D.every(d=>Math.abs(d.horas[0].from-d.sunrise)<1e-9&&Math.abs(d.horas[11].to-d.sunset)<1e-9&&Math.abs(d.horas[23].to-d.nextSunrise)<1e-9);
      r.equalWithin=D.every(d=>{const a=d.horas.slice(0,12),n=d.horas.slice(12);const l=a[0].to-a[0].from,m=n[0].to-n[0].from;return a.every(h=>Math.abs((h.to-h.from)-l)<1e-9)&&n.every(h=>Math.abs((h.to-h.from)-m)<1e-9)});
      r.nextDay=D.slice(0,6).every((d,i)=>D[i+1].horas[0].lord===O[(O.indexOf(d.horas[0].lord)+24)%7]);
      r.counts=D.every(d=>d.horas.length===24&&d.horas.filter(h=>!h.night).length===12);
      r.rahu=D.every(d=>{const k=d.horas.filter(h=>h.over.includes('Rahu Kalam')).length;return k>=1&&k<=3});
      return r}""")
    ok('7 consecutive days Sun..Sat', chk['n'] == 7 and chk['dates'] == '2026-11-01,2026-11-02,2026-11-03,2026-11-04,2026-11-05,2026-11-06,2026-11-07', chk['dates'])
    ok('first hora lord = weekday lord, all 7 days', chk['firstLord'])
    ok('every hora follows the Chaldean order', chk['chaldean'])
    ok('24 horas, 12 day + 12 night, contiguous', chk['counts'] and chk['contig'])
    ok('first starts at sunrise, 12th ends at sunset, 24th ends at next sunrise', chk['edges'])
    ok('day horas equal, night horas equal (unequal day vs night)', chk['equalWithin'])
    ok("next day's first hora continues the cycle (24 horas later)", chk['nextDay'])
    ok('Rahu Kalam overlaps 1 to 3 horas each day', chk['rahu'])
    dn = ev("()=>{const d=HORA.dayOf('2026-11-13',28.6139,77.2090,5.5);return [d.dayMin,d.nightMin,d.vara.name]}")
    ok('13 Nov 2026 Delhi: day horas ~54 min, night ~66 min (Drik Panchang) and Friday', abs(dn[0] - 54) < 1.6 and abs(dn[1] - 66) < 1.6 and dn[2] == 'Friday', dn)
    cx = ev("""()=>{let bad=[],n=0;const H=[[2026,11,13,6,0],[2026,11,13,9,30],[2026,11,13,13,15],[2026,11,13,17,50],[2026,11,13,19,40],[2026,11,13,23,50],[2026,11,14,3,10],[2026,11,14,5,20],[2026,3,21,12,0],[2026,6,21,22,30]];
      H.forEach(h=>{const jd=toJulianDay(h[0],h[1],h[2],h[3],h[4],0)-5.5/24,P=panchangaAt(jd,28.6139,77.2090,5.5),a=HORA.at(jd,28.6139,77.2090,5.5);n++;if(!a||!a.hora||a.hora.lord!==P.hora)bad.push(h.join('-')+':'+(a&&a.hora&&a.hora.lord)+'/'+P.hora)});return {n,bad}}""")
    ok('HORA.at agrees with the Panchang card "Hora now" at 10 moments', cx['n'] == 10 and not cx['bad'], cx['bad'])
    sc = ev("""()=>{const day=HORA.dayOf('2026-11-13',28.6139,77.2090,5.5),mk=l=>({lord:l,over:[],chog:null});const j=HORA.score(mk('Jupiter'),day,'start'),s=HORA.score(mk('Saturn'),day,'start'),m=HORA.score(mk('Mercury'),day,'deals'),r=HORA.score({lord:'Jupiter',over:['Rahu Kalam'],chog:null},day,'start');return {j:j.score,s:s.score,m:m.score,r:r.score,jb:j.band,sb:s.band,why:j.why.length}}""")
    ok('Friday: Jupiter is an enemy of the day lord Venus, so 2 - 0.5 = 1.5 (Fair); Saturn avoided', abs(sc['j'] - 1.5) < 1e-9 and sc['jb'] == 'Fair' and sc['s'] < 0 and sc['sb'] == 'Avoid', sc)
    th = ev("()=>{const day=HORA.dayOf('2026-11-12',28.6139,77.2090,5.5),r=HORA.score({lord:'Jupiter',over:[],chog:null},day,'start');return [r.score,r.band,day.vara.name]}")
    ok('Thursday: Jupiter is the day lord, 2 + 0.5 = 2.5 (Good) for starting something', th[2] == 'Thursday' and abs(th[0] - 2.5) < 1e-9 and th[1] == 'Good', th)
    ok('an overlap with Rahu Kalam lowers the score by 1.5', abs((sc['j'] - sc['r']) - 1.5) < 1e-9, sc)
    bt = ev("""()=>{const jd=toJulianDay(2026,11,13,10,0,0)-5.5/24,B=HORA.best('money',jd,7,28.6139,77.2090,5.5,currentChartForModal,8);return {n:B.length,sorted:B.every((x,i)=>i===0||B[i-1].score>=x.score),future:B.every(x=>x.h.to>jd),top:B[0].h.lord,reasons:B.every(x=>x.why.length>=2)}}""")
    ok('best(): 8 results, sorted, all in the future, each with reasons', bt['n'] == 8 and bt['sorted'] and bt['future'] and bt['reasons'], bt)
    ok('best(): top hora for money is a Jupiter or Mercury hora', bt['top'] in ('Jupiter', 'Mercury'), bt['top'])
    fy = ev("()=>{const c=currentChartForModal,f=HORA.forYou(c,'Jupiter');return {h:f.house===c.planets.Jupiter.house,l:!!f.lagnaLord,d:!!f.dashaLord,e:typeof f.ease==='number'}}")
    ok('forYou(): house matches the chart and Lagna lord and dasha lord are found', all(fy.values()), fy)
    bh = ev("()=>{const c=currentChartForModal,a=HORA.at(c.julianDay,28.6139,77.2090,5.5);return a&&a.hora?a.hora.lord:null}")
    ok('birth hora found for the demo chart', bh in ('Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'), bh)
    ok('14 activities, each id unique, lists use only the 7 planets', ev("()=>{const A=HORA.ACTS,P=HORA.ORDER;return A.length===14&&new Set(A.map(a=>a.id)).size===14&&A.every(a=>[...a.good,...a.ok,...a.avoid].every(x=>P.includes(x))&&a.good.length>0)}"))
    ok('polar day does not throw', ev("()=>{try{HORA.dayOf('2026-06-21',80,10,2);return true}catch(e){return String(e)}}") is True)
    ok('no page errors', not errs, str(errs[:2]))
    b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('ok   ' if c else 'FAIL ') + n + ((' :: ' + str(d)) if d and not c else ''))
print('%d checks, %d failed' % (len(res), len(bad)))
raise SystemExit(1 if bad else 0)

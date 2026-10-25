# Test of the Ashtakavarga reading (js/107-ashtakavarga-reading.js AVR + js/108 screens): every point, total, rank, tier, house, sign and contributor checked against
# chart.ashtakavarga independently over 12 charts; 7 planets x 12 houses; wording; Ashtakavarga tab, report and PDF. Run: python3 tests/ashtakavarga_reading_test.py
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
CHARTS = [('1995-03-14', '11:00', 17.385, 78.4867, 5.5), ('1961-08-04', '19:24', 21.3069, -157.8583, -10), ('2000-01-01', '00:00', -33.87, 151.21, 11), ('1947-08-15', '00:00', 28.61, 77.21, 5.5),
          ('1988-12-21', '03:15', 64.15, -21.94, 0), ('1975-06-30', '23:50', -0.18, -78.47, -5), ('1930-08-30', '15:00', 41.26, -95.93, -6), ('1992-02-29', '09:10', 13.08, 80.27, 5.5),
          ('1984-04-10', '06:30', 27.7, 85.32, 5.75), ('1879-03-14', '11:30', 48.4011, 9.9876, 0.6667), ('2012-05-21', '14:30', 51.5, -0.12, 1), ('2024-02-10', '08:45', -36.85, 174.76, 13)]
BAN = r"/\b(always|never|certainly|definitely|guaranteed|doomed|destined|fatal|cursed|will die|death|you will|you are going to)\b/i"
CHECK = """()=>{const BAN=__BAN__,ch=currentChartForModal,now=new Date('2026-10-23T00:00:00Z'),A=AVR.assess(ch,{now}),A2=AVR.assess(ch,{now}),bad=[],AV=ch.ashtakavarga,asc=ch.ascendant.sign,H1=ch.vargas.D1.houses,P=ch.planets;
 const SIGN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'],ordn=n=>n+(['th','st','nd','rd'][(n%100>10&&n%100<14)?0:Math.min(n%10,4)%4]||'th');
 if(JSON.stringify(A)!==JSON.stringify(A2))bad.push('not deterministic');if(A.planets.length!==7)bad.push('7 planets');
 const total=AV.sav.reduce((a,b)=>a+b,0),avg=total/12,jd=toJulianDay(now.getUTCFullYear(),now.getUTCMonth()+1,now.getUTCDate(),now.getUTCHours(),now.getUTCMinutes(),now.getUTCSeconds());
 // combined map
 if(A.sav.houses.length!==12)bad.push('sav houses');A.sav.houses.forEach(x=>{const s=(asc+x.h-1)%12;if(x.points!==AV.sav[s]||x.sign!==SIGN[s])bad.push('sav '+x.h);const t=x.text;if(!t.includes(x.points+' points against an average of '+avg.toFixed(1)))bad.push('sav text '+x.h);
   const c=Object.keys(AV.bavTables).map(n=>[n,AV.bavTables[n][s]]).sort((a,b)=>b[1]-a[1]);if(!t.includes('The fullest contributor is '+c[0][0]+' ('+c[0][1]+')'))bad.push('sav contributor '+x.h);
   const lord=H1[x.h-1].signLord;if(!t.includes('ruled by '+lord))bad.push('sav lord '+x.h);const occ=Object.keys(P).filter(n=>P[n].house===x.h);if(occ.length&&!occ.every(n=>t.includes(n)))bad.push('sav occupants '+x.h);if(BAN.test(t)||/undefined|NaN|\\{|\\}/.test(t))bad.push('sav junk '+x.h)});
 const order=A.sav.houses.slice().sort((a,b)=>b.points-a.points||a.h-b.h);if(A.sav.best!==order[0].h||A.sav.thin!==order[11].h)bad.push('best/thin');
 A.sav.axes.forEach(a=>{const v=AV.sav[(asc+a.houses[0]-1)%12]+AV.sav[(asc+a.houses[1]-1)%12];if(a.points!==v||!a.text.includes(v+' points together'))bad.push('axis '+a.name)});
 A.planets.forEach(x=>{const n=x.planet,B=AV.bavTables[n],tot=B.reduce((a,b)=>a+b,0),txt=x.sections.map(s=>s.text).join(' ');
  if(x.total!==tot||!txt.includes('fixed budget of '+tot+' points'))bad.push(n+' total');if(x.houses.length!==12)bad.push(n+' houses');
  const ids=x.sections.map(s=>s.id).join();if(!/^overview,best,thin,balance,home,now,use$/.test(ids))bad.push(n+' sections '+ids);
  const hs=[];for(let h=1;h<=12;h++)hs.push([h,B[(asc+h-1)%12]]);const best=hs.slice().sort((a,b)=>b[1]-a[1]||a[0]-b[0]).slice(0,3).map(a=>a[0]),thin=hs.slice().sort((a,b)=>a[1]-b[1]||a[0]-b[0]).slice(0,3).map(a=>a[0]);
  if(x.best.join()!==best.join()||x.thin.join()!==thin.join())bad.push(n+' best/thin');
  const good=[1,4,5,7,9,10].reduce((a,h)=>a+B[(asc+h-1)%12],0),badS=[6,8,12].reduce((a,h)=>a+B[(asc+h-1)%12],0);if(!txt.includes('('+good+' of '+tot+')')||!txt.includes('('+badS+')'))bad.push(n+' balance');
  if(P[n]){const own=B[P[n].sign];if(!txt.includes('gives '+own+' of 8 points'))bad.push(n+' home');}
  const nt=getSignIndex(getSiderealLongitudeAt(n,jd)),nh=((nt-asc+12)%12)+1;if(!txt.includes('moving through '+SIGN[nt]+', your '+ordn(nh)+' house')||!txt.includes('gives '+B[nt]+' of 8 points'))bad.push(n+' now');
  x.houses.forEach(hh=>{const s=(asc+hh.h-1)%12,b=B[s],t=hh.text;if(hh.b!==b||hh.sign!==SIGN[s])bad.push(n+' h'+hh.h+' value');
    if(!t.includes(SIGN[s])||!t.includes(ordn(hh.h)+' house')||!(t.includes(b+' of 8 points')||t.includes(b+' of its 8 points')||t.includes('gives '+b+' of 8')))bad.push(n+' h'+hh.h+' numbers');
    const tier=b<=2?'low':b<=4?'mid':b===5?'high':'top';if(hh.tier!==tier)bad.push(n+' h'+hh.h+' tier');
    if(!(t.includes(AV.sav[s]+' points against an average of '+avg.toFixed(1))||t.includes(AV.sav[s]+' points overall against an average of '+avg.toFixed(1))))bad.push(n+' h'+hh.h+' sav');
    if(H1[hh.h-1].signLord===n&&!t.includes('also rules this house'))bad.push(n+' h'+hh.h+' rules');if(P[n]&&P[n].house===hh.h&&!t.includes('also stands in this house at birth'))bad.push(n+' h'+hh.h+' occupies');
    if(nh===hh.h&&!t.includes('is passing through this very house'))bad.push(n+' h'+hh.h+' transit');
    if(/\\b1 points\\b/.test(t)||BAN.test(t)||/undefined|NaN|\\[object|\\bnull\\b|\\{|\\}|  /.test(t)||/(^|[.!?] )[a-z]/.test(t))bad.push(n+' h'+hh.h+' junk');
    if(hh.text.split(/\\s+/).length<70)bad.push(n+' h'+hh.h+' short')});
  if(BAN.test(txt)||/(^|[.!?] )[a-z]/.test(txt)||/\\b1 points\\b/.test(txt))bad.push(n+' sections junk');
  if(x.words<1000)bad.push(n+' short '+x.words)});
 const all=A.planets.flatMap(p=>p.houses.map(h=>h.text));if(new Set(all).size<all.length*0.98)bad.push('duplicates');if(A.words<12000)bad.push('words '+A.words);
 return bad.slice(0,8)}""".replace('__BAN__', BAN)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    ok('AVR loaded', pg.evaluate("typeof AVR==='object'&&AVR!==null&&typeof AVRUI==='object'"))
    for i, c in enumerate(CHARTS):
        pg.evaluate(CAST, dict(name='x', dob=c[0], tob=c[1], place='x', lat=c[2], lon=c[3], tz=c[4])); pg.wait_for_selector('#results.show', timeout=15000)
        bad = pg.evaluate(CHECK)
        ok('chart %d: every point, total, rank, tier, sign, house, lord, occupant, contributor and transit in the Ashtakavarga reading matches the chart; 7 planets x 12 houses; clean wording' % (i + 1), not bad, bad)
    pg.evaluate(CAST, dict(name='Asha', dob='1995-03-14', tob='11:00', place='Hyderabad', lat=17.385, lon=78.4867, tz=5.5)); pg.wait_for_selector('#results.show', timeout=15000)
    pg.evaluate("document.querySelectorAll('.app-panel').forEach(p=>p.classList.remove('active'));document.getElementById('panel-reading').classList.add('active')"); pg.wait_for_timeout(500)
    s = pg.evaluate("""()=>{const bad=[],ch=currentChartForModal,rd=document.querySelector('#panel-reading .rd'),tabs=[...rd.querySelectorAll(':scope>.vx-tabs button')],panes=[...rd.querySelectorAll(':scope>.vx-pane')];
      const i=tabs.findIndex(b=>/Ashtakavarga/.test(b.textContent));if(i!==tabs.length-2)bad.push('tab position '+i);tabs[i].click();const pane=panes[i];
      if(pane.querySelectorAll('.avr-bar').length!==12)bad.push('bars');if(pane.querySelectorAll('details.avr-card:not(.avr-pl)').length!==12)bad.push('house cards');if(pane.querySelectorAll('details.avr-pl').length!==7)bad.push('planet cards');
      const d=pane.querySelector('details.avr-pl');d.open=true;if(d.querySelectorAll('.avr-cell').length!==12)bad.push('strip');if(d.querySelectorAll('.avr-hs').length!==12)bad.push('house entries '+d.querySelectorAll('.avr-hs').length);if(d.querySelectorAll('.avr-l').length!==19)bad.push('blocks '+d.querySelectorAll('.avr-l').length);
      const rep=buildFullReportText(ch,currentProfileForExport,{});if(!/ASHTAKAVARGA READING: POINTS, PLANET BY PLANET/.test(rep)||!/Saturn in the 10th house/.test(rep))bad.push('report');
      const doc=new DOMParser().parseFromString(PDFR.build(ch,currentProfileForExport,{sections:['ashtakavarga']}),'text/html');if(doc.querySelectorAll('#s-ashtakavarga .hn-plate').length!==7||!/Life axes/.test(doc.body.textContent))bad.push('pdf');
      return {bad:bad.slice(0,6),over:document.documentElement.scrollWidth>window.innerWidth+1}}""")
    ok('Ashtakavarga tab (last tab): 12 bars, 12 house cards, 7 planet cards with a strip, 6 sections and 12 house entries each; report and PDF carry it', not s['bad'], s)
    ok('phone: no horizontal scroll', not s.get('over'))
    pg.screenshot(path='/tmp/claude-0/av.png')
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:400]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

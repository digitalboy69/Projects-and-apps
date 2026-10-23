# Test of the transit reading (js/97-transit-reading.js, global TRS): every position, sign-change date, Sade Sati phase and double-transit window is
# checked against the app's ephemeris (getSiderealLongitudeAt) independently of the module; outlooks are bounded and follow their inputs; screens show them.
# Run: python3 tests/transit_reading_test.py   (CHROMIUM=/path/to/chrome if not at the default)
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
CHARTS = [('1879-03-14', '11:30', 48.4011, 9.9876, 0.6667), ('1961-08-04', '19:24', 21.3069, -157.8583, -10), ('1995-03-14', '11:00', 17.385, 78.4867, 5.5), ('2000-01-01', '00:00', -33.87, 151.21, 11),
          ('1947-08-15', '00:00', 28.61, 77.21, 5.5), ('1988-12-21', '03:15', 64.15, -21.94, 0), ('1975-06-30', '23:50', -0.18, -78.47, -5), ('1930-08-30', '15:00', 41.26, -95.93, -6),
          ('1983-11-09', '06:45', 19.07, 72.88, 5.5), ('1969-07-20', '20:17', 40.71, -74.0, -5), ('2012-05-21', '14:30', 51.5, -0.12, 1), ('1992-02-29', '09:10', 13.08, 80.27, 5.5)]
NOW = "new Date('2026-10-22T00:00:00Z')"
BAN = r"/\b(always|never|certainly|definitely|guaranteed|doomed|destined|fatal|cursed|will die|death|you will|you are going to)\b/i"
avail = 0
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    ok('TRS loaded with phase and gochar tables', pg.evaluate("typeof TRS==='object'&&TRS!==null&&Object.keys(TRS.data.phases).length===3&&Object.keys(TRS.data.gochar).join()==='Saturn,Jupiter,Rahu,Ketu'&&Object.values(TRS.data.phases).every(g=>Object.values(g).every(f=>f.name&&f.sub&&f.theme&&f.feels&&f.helps.length===3&&f.watch&&/\\?$/.test(f.ask)))"))
    for i, c in enumerate(CHARTS):
        pg.evaluate(CAST, dict(name='x', dob=c[0], tob=c[1], place='x', lat=c[2], lon=c[3], tz=c[4])); pg.wait_for_selector('#results.show', timeout=15000)
        o = pg.evaluate("""()=>{const BAN=%s,ch=currentChartForModal,pr=currentProfileForExport,now=%s,T=TRS.assess(ch,pr,{now}),T2=TRS.assess(ch,pr,{now}),bad=[],B=LAE.data.bands;
          const jd=d=>toJulianDay(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),d.getUTCHours(),d.getUTCMinutes(),d.getUTCSeconds()),nowJD=jd(now),sgn=(p,j)=>getSignIndex(getSiderealLongitudeAt(p,j)),moon=ch.planets.Moon.sign,asc=ch.ascendant.sign;
          const old=nowJD>ch.julianDay+97*365.25;if(old){return {avail:false,bad:(T.available||!T.notes.length||!T.text)?['old chart should be unavailable']:[]}}
          if(!T.available)bad.push('unavailable');if(JSON.stringify(T.summary)!==JSON.stringify(T2.summary)||JSON.stringify(T.outlook)!==JSON.stringify(T2.outlook))bad.push('not deterministic');
          // positions now
          if(T.gochar.length!==4)bad.push('gochar count');T.gochar.forEach(g=>{const s=sgn(g.planet,nowJD);if(g.signIndex!==s)bad.push('sign '+g.planet);if(g.houseFromMoon!==((s-moon+12)%%12)+1)bad.push('hM '+g.planet);if(g.houseFromLagna!==((s-asc+12)%%12)+1)bad.push('hL '+g.planet);
            const fav=TRS.data.gochar[g.planet].fav.includes(g.houseFromMoon);if((g.tone==='helpful')!==fav)bad.push('tone '+g.planet);if(g.to!=null&&!(g.to>nowJD))bad.push('to '+g.planet)});
          // sign-change calendar against the ephemeris
          let prev=0;T.calendar.forEach(x=>{if(x.jd<=nowJD||x.jd>nowJD+3*365.25+1)bad.push('cal range');if(x.jd<prev)bad.push('cal order');prev=x.jd;
            if(sgn(x.planet,x.jd+1.5)!==SIGN_IDX(x.sign)||sgn(x.planet,x.jd-1.5)===SIGN_IDX(x.sign))bad.push('cal date '+x.planet+x.sign)});
          function SIGN_IDX(n){return ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'].indexOf(n)}
          // Sade Sati / Dhaiya now against Saturn's real sign
          const rel=(sgn('Saturn',nowJD)-moon+12)%%12,expSade=[11,0,1].includes(rel)?({11:1,0:2,1:3})[rel]:0,expDh=rel===3?4:rel===7?8:0,act=T.sade.active;
          const gotSade=act.find(a=>a.kind==='Sade Sati'),gotDh=act.find(a=>a.kind!=='Sade Sati');
          if((gotSade?gotSade.phase:0)!==expSade)bad.push('sade phase '+(gotSade?gotSade.phase:0)+' vs '+expSade);if((gotDh?gotDh.phase:0)!==expDh)bad.push('dhaiya '+(gotDh?gotDh.phase:0)+' vs '+expDh);
          act.forEach(a=>{if(!['lighter','moderate','heavier'].includes(a.level)||!a.reasons.length||!a.text.includes(a.name)||!/Watch for/.test(a.text))bad.push('active text')});
          if(!act.length&&T.sade.next&&!(T.sade.next.start>nowJD))bad.push('next in the past');
          T.sade.cycles.forEach(cy=>{cy.phases.forEach(p=>{if(p.start!=null&&p.end!=null&&!(p.end>p.start))bad.push('phase dates')})});
          // double transit windows: both planets really touch the house at the middle of every window
          const ASP={Jupiter:[5,7,9],Saturn:[3,7,10]},touch=(pl,j,h)=>{const h0=((sgn(pl,j)-asc+12)%%12)+1;return h0===h||ASP[pl].some(o=>((h0+o-2)%%12)+1===h)};let nw=0;
          Object.keys(T.double).forEach(id=>T.double[id].forEach(w=>{nw++;const m=(w.start+w.end)/2;if(!touch('Jupiter',m,w.house)||!touch('Saturn',m,w.house))bad.push('double '+id);if(!(w.end>w.start)||w.start<nowJD-1||w.end>nowJD+3*365.25+1)bad.push('double range')}));
          // outlook
          const ids=LAE.ids;ids.forEach(id=>{const O=T.outlook[id];if(!O||O.length!==3){bad.push('outlook '+id);return}O.forEach((o,k)=>{if(o.year!==k+1||!Number.isInteger(o.score)||o.score<3||o.score>97||B.find(x=>o.score>=x[0])[1]!==o.band)bad.push('score '+id+k);
            const t40=o.parts.transit;if((o.doubleMonths>0)!==(t40>40))bad.push('transit part '+id+k);if(t40<40||t40>100)bad.push('transit range');if(!o.text.startsWith(o.label))bad.push('label '+id+k)})});
          const allT=[T.text,...T.summary,...T.notes,...act.map(a=>a.text),...T.gochar.map(g=>g.text),...T.calendar.map(x=>x.text),...ids.flatMap(id=>T.outlook[id].map(o=>o.text)),...ids.flatMap(id=>T.double[id].map(w=>w.text))].join(' ');
          if(/undefined|NaN|\\[object|\\bnull\\b|  |\\{|\\}/.test(allT)||BAN.test(allT))bad.push('text');if(!/\\byou/i.test(act.map(a=>a.text).join(' ')+T.gochar.map(g=>g.text).join(' ')+T.summary.join(' ')))bad.push('voice');
          return {avail:true,bad:bad.slice(0,8),nw,active:act.length,cal:T.calendar.length}}""" % (BAN, NOW))
        if o['avail']: avail += 1
        ok('chart %d: %s' % (i + 1, 'too old for the 100-year transit tables: reported as unavailable with a note' if not o['avail'] else 'positions, sign-change dates, Sade Sati/Dhaiya phase, double-transit windows and outlooks agree with the ephemeris; clean text; deterministic'), not o['bad'], o['bad'])
    ok('at least 10 of 12 charts get a full transit reading', avail >= 10, avail)
    # ---- sensitivity ----
    pg.evaluate(CAST, dict(name='Asha', dob='1995-03-14', tob='11:00', place='Hyderabad', lat=17.385, lon=78.4867, tz=5.5)); pg.wait_for_selector('#results.show', timeout=15000)
    sn = pg.evaluate("""()=>{const ch=currentChartForModal,pr=currentProfileForExport,a=TRS.assess(ch,pr,{now:%s}),b=TRS.assess(ch,pr,{now:new Date('2031-06-01T00:00:00Z')});
      return {gochar:JSON.stringify(a.gochar.map(g=>g.sign))!==JSON.stringify(b.gochar.map(g=>g.sign)),sade:[2026,2030,2034,2038,2042,2046].some(y=>TRS.assess(ch,pr,{now:new Date(y+'-06-01T00:00:00Z')}).sade.active.length>0),outlook:a.outlook.career[0].label!==b.outlook.career[0].label,
        later:b.calendar[0].jd>a.calendar[0].jd}}""" % NOW)
    ok('moving the date moves the planets, the calendar and the outlook; a Sade Sati or Dhaiya phase is active on some date between 2026 and 2046', all(sn.values()), sn)
    # ---- screens ----
    s = pg.evaluate("""()=>{const ch=currentChartForModal,T=TRS.assess(ch,currentProfileForExport),rd=document.querySelector('#panel-reading .rd'),pane=[...rd.querySelectorAll(':scope>.vx-pane:not(.hn-pane)')][5],bad=[],norm=s=>s.replace(/\\s+/g,' ');
      const sec=pane.querySelector('.dr-sec[data-sec=transits]');if(!sec)return {bad:['no section']};if(![...pane.querySelectorAll('.dr-nb')].some(b=>b.dataset.sec==='transits'))bad.push('nav');
      const tx=norm(sec.textContent);T.gochar.forEach(g=>{if(!tx.includes(norm(g.text)))bad.push('gochar '+g.planet)});if(sec.querySelectorAll('.dr-ol .dr-or:not(.dr-oh)').length!==9)bad.push('outlook rows');
      if(sec.querySelectorAll('.dr-oc').length!==27)bad.push('outlook cells');if(!tx.includes('Sade Sati'))bad.push('sade');if(!tx.includes('Double-transit windows'))bad.push('double');
      const rep=buildFullReportText(ch,currentProfileForExport,{}).replace(/\\s+/g,' ');if(!rep.includes('TRANSITS AND SADE SATI'))bad.push('report title');T.gochar.forEach(g=>{if(!rep.includes(norm(g.text).slice(0,70)))bad.push('report '+g.planet)});
      const d=new DOMParser().parseFromString(PDFR.build(ch,currentProfileForExport,{sections:['transits']}),'text/html');if(d.querySelectorAll('#s-transits table').length<4)bad.push('pdf tables');if(d.querySelectorAll('#s-transits tbody tr').length<T.calendar.length+9+4)bad.push('pdf rows');
      return {bad:bad.slice(0,6),overflow:document.documentElement.scrollWidth>window.innerWidth+1}}""")
    ok('Deep reading (planets now, cycles, calendar, year-by-year grid, double-transit windows), the report and the PDF show the same reading', not s['bad'], s)
    ok('phone: no horizontal scroll', not s.get('overflow'))
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:300]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

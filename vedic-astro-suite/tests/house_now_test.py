# Test of "Right now" (js/100-house-now.js HNW + js/101 screens): every fact checked against the engines independently, wording rules, determinism,
# first tab of Chart Reading, report text and PDF section. Run: python3 tests/house_now_test.py   (CHROMIUM=/path/to/chrome if not at the default)
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
CHECK = """()=>{const BAN=__BAN__,ch=currentChartForModal,N=[new Date('2026-10-23T00:00:00Z'),new Date('2030-03-01T12:00:00Z')],bad=[];
 N.forEach(now=>{const A=HNW.assess(ch,{now}),A2=HNW.assess(ch,{now}),P=ch.planets,H1=ch.vargas.D1.houses,asc=ch.ascendant.sign,SAV=ch.ashtakavarga.sav;
  if(A!==A2&&JSON.stringify(A)!==JSON.stringify(A2))bad.push('not deterministic');
  const jd=toJulianDay(now.getUTCFullYear(),now.getUTCMonth()+1,now.getUTCDate(),now.getUTCHours(),now.getUTCMinutes(),now.getUTCSeconds());
  A.sky.forEach(x=>{const lon=getSiderealLongitudeAt(x.n,jd),s=getSignIndex(lon);if(x.sign!==s||x.house!==((s-asc+12)%12)+1||x.nak!==getNakshatra(lon).name||x.pada!==getNakshatra(lon).pada)bad.push('sky '+x.n)});
  const act=findActiveDasha(ch.dashaData.mahadashas,now);['mahadasha','antardasha','pratyantardasha'].forEach((k,i)=>{const d=[A.dasha.md,A.dasha.ad,A.dasha.pd][i];if(act&&act[k]&&(!d||d.lord!==act[k].lord))bad.push('dasha '+k)});
  if(A.houses.length!==12)bad.push('12 houses');
  A.houses.forEach(x=>{const h=x.h,hs=H1[h-1],t=x.sections.map(s=>s.lines.join(' ')).join(' ');
   if(x.sign!==['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][hs.sign]||x.lord!==hs.signLord)bad.push('sign/lord '+h);
   if(x.facts.sav!==SAV[hs.sign]||!t.includes(SAV[hs.sign]+' Ashtakavarga points'))bad.push('sav '+h);
   const tocc=A.sky.filter(s=>s.house===h).map(s=>s.n);if(tocc.join()!==x.facts.tOcc.join())bad.push('transit occupants '+h);
   const nocc=Object.keys(P).filter(n=>P[n].house===h);if(nocc.join()!==x.facts.natalOcc.join())bad.push('natal occupants '+h);
   const lt=A.sky.find(s=>s.n===hs.signLord);if(x.facts.lordHouseNow!==lt.house)bad.push('lord now '+h);
   if(x.score<5||x.score>95||x.band!==LAE.data.bands.find(b=>x.score>=b[0])[1])bad.push('score/band '+h);
   if(x.sections.length!==9)bad.push('sections '+h);x.sections.forEach(s=>{if(!s.lines.length||/undefined|NaN|\\[object|\\bnull\\b|  |\\.\\./.test(s.text.replace(/\\.\\.\\./g,'')))bad.push('junk '+h+' '+s.id)});
   if(BAN.test(t.replace(/Death & rebirth/gi,'')))bad.push('banned '+h+': '+t.match(BAN)[0]);
   if(A.dasha.md&&!['Mahadasha','Antardasha','Pratyantar'].every(l=>x.sections.find(s=>s.id==='dasha').text.includes(l)))bad.push('dasha lines '+h);
   if(x.sections.map(s=>s.text.split(/\\s+/).length).reduce((a,b)=>a+b,0)<300)bad.push('short '+h)});
  if(A.areas.length!==9||A.best.length!==3||A.care.length!==3)bad.push('areas/best/care');
  const sc=A.houses.map(x=>x.score);if(Math.max.apply(0,sc)===Math.min.apply(0,sc))bad.push('flat scores');
 });return bad.slice(0,8)}""".replace('__BAN__', BAN)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    ok('HNW loaded', pg.evaluate("typeof HNW==='object'&&HNW!==null&&typeof HNW.pane==='function'"))
    for i, c in enumerate(CHARTS):
        pg.evaluate(CAST, dict(name='x', dob=c[0], tob=c[1], place='x', lat=c[2], lon=c[3], tz=c[4])); pg.wait_for_selector('#results.show', timeout=15000)
        bad = pg.evaluate(CHECK)
        ok('chart %d: sky, dasha chain, signs, lords, Ashtakavarga, occupants and scores match the engines at two dates; clean wording' % (i + 1), not bad, bad)
    pg.evaluate(CAST, dict(name='Asha', dob='1995-03-14', tob='11:00', place='Hyderabad', lat=17.385, lon=78.4867, tz=5.5)); pg.wait_for_selector('#results.show', timeout=15000)
    pg.evaluate("document.querySelectorAll('.app-panel').forEach(p=>p.classList.remove('active'));document.getElementById('panel-reading').classList.add('active')"); pg.wait_for_timeout(400)
    s = pg.evaluate("""()=>{const bad=[],tabs=[...document.querySelectorAll('#panel-reading .rd .vx-tabs button')],pane=document.querySelector('#panel-reading .rd .vx-pane');
      if(!tabs.length||!/Right now/.test(tabs[0].textContent)||!tabs[0].classList.contains('on'))bad.push('first tab');if(!pane.classList.contains('on')||!pane.querySelector('.hn'))bad.push('first pane');
      if(pane.querySelectorAll('details.hn-card').length!==12)bad.push('cards');if(pane.querySelectorAll('.hn-chip').length!==12)bad.push('chips');if(pane.querySelectorAll('.hn-sk').length!==9)bad.push('sky');if(pane.querySelectorAll('.hn-ar').length!==9)bad.push('areas');
      if(pane.querySelectorAll('.vx-grid .vx-t').length<3)bad.push('dasha tiles');pane.querySelector('.hn-chip[data-hn="2"]').click();const c2=document.getElementById('hn-h2');if(!c2.open)bad.push('chip opens card');
      if(c2.querySelectorAll('h5').length!==9)bad.push('headings');if(!/Right now/.test(c2.textContent)&&!/2nd house/.test(c2.textContent))bad.push('card text');
      const rep=buildFullReportText(currentChartForModal,currentProfileForExport,{});if(!/LIFE RIGHT NOW: THE TWELVE HOUSES/.test(rep)||!/2nd house: money/.test(rep))bad.push('report');
      const d=new DOMParser().parseFromString(PDFR.build(currentChartForModal,currentProfileForExport,{sections:['now']}),'text/html');if(d.querySelectorAll('#s-now .hn-plate').length!==12||!d.querySelector('#s-now .hn-tiles'))bad.push('pdf now');
      const secs=PDFR.parts.find(p=>p.secs.includes('timeline')).secs;if(secs[0]!=='now')bad.push('pdf order');
      return {bad:bad.slice(0,6),overflow:document.documentElement.scrollWidth>window.innerWidth+1}}""")
    ok('Chart Reading opens on the Right now tab with tiles, area bars, chips, sky and 12 house cards; report and PDF carry it', not s['bad'], s)
    ok('phone: no horizontal scroll', not s.get('overflow'))
    pg.screenshot(path='/tmp/claude-0/hn.png', full_page=False)
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:400]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

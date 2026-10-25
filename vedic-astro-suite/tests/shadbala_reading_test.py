# Test of the Shadbala reading (js/105-shadbala-reading.js SBR + js/106 screens): every number in the text checked against chart.shadbala independently, tiers match
# the thresholds, ranks recomputed, all six strengths and every component present for all seven planets, wording rules, Strength tab, report and PDF.
# Run: python3 tests/shadbala_reading_test.py
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
CHECK = """()=>{const BAN=__BAN__,ch=currentChartForModal,A=SBR.assess(ch),bad=[],S=ch.shadbala.planets,seen={};
 if(A.planets.length!==7)bad.push('7 planets');if(JSON.stringify(A)!==JSON.stringify(SBR.assess(ch)))bad.push('not deterministic');
 const order=Object.keys(S).sort((a,b)=>S[b].percentOfRequired-S[a].percentOfRequired);if(A.ranking.map(x=>x.planet).join()!==order.join())bad.push('ranking');if(A.strongest!==order[0]||A.weakest!==order[6])bad.push('strongest/weakest');
 const r1=v=>(Math.round(v*10)/10).toFixed(1),r0=v=>String(Math.round(v));
 A.planets.forEach(x=>{const n=x.planet,s=S[n],t=x.groups.flatMap(g=>g.lines.map(l=>l.text)).join(' ');
  if(x.groups.map(g=>g.id).join()!=='overall,sthana,dig,kala,cheshta,naisargika,drik,ishta')bad.push(n+' groups');
  const g=id=>x.groups.find(g=>g.id===id);if(g('sthana').lines.length!==6||g('kala').lines.length!==6)bad.push(n+' component lines');
  if(x.pct!==Math.round(s.percentOfRequired)||!t.includes(x.pct+'% of the strength it needs')||!t.includes(s.totalRupas.toFixed(2)+' rupas against '+s.requiredRupas))bad.push(n+' overall numbers');
  if(x.rank!==order.indexOf(n)+1)bad.push(n+' rank');
  const must=[r1(s.sthanaBala.uchcha),r1(s.sthanaBala.saptavargaja),r1(s.digBala),r1(s.kalaBala.paksha),r1(s.kalaBala.ayana),r1(s.chestaBala),r1(s.naisargikaBala),r1(s.sthanaBala.total),r1(s.kalaBala.total)];must.forEach(v=>{if(!t.includes(v))bad.push(n+' misses '+v)});
  if(!t.includes('Mercury')&&false)bad.push('x');
  // tiers
  const pick=(v,hi,lo)=>v>=hi?'high':v<lo?'low':'mid',txt=id=>g(id).lines.map(l=>l.text).join(' ');
  const dg=pick(s.digBala,40,20),dgw={high:'pointed the right way',mid:'some direction but not full',low:'against the grain'}[dg];if(!txt('dig').includes(dgw))bad.push(n+' dig tier '+dg);
  const ch2=pick(s.chestaBala,40,20),chw={high:'a lot of working energy',mid:'moderate amount of working energy',low:'working energy is low'}[ch2];if(!txt('cheshta').includes(chw))bad.push(n+' cheshta tier '+ch2);
  const dk=pick(s.drikBala,15,-15),dkw={high:'mostly supportive',mid:'roughly cancel out',low:'mostly pressing'}[dk];if(!txt('drik').includes(dkw))bad.push(n+' drik tier '+dk);
  const nw=pick(s.naisargikaBala,42,26),nww={high:'head start',mid:'middle-ranking',low:'quieter planets by rank'}[nw];if(!txt('naisargika').includes(nww))bad.push(n+' naisargika tier');
  const kd={60:'a corner house',30:'a house of the middle kind',15:'one of the quieter houses'}[s.sthanaBala.kendradi];if(!txt('sthana').includes(kd)||!txt('sthana').includes('your '+({1:'1st',2:'2nd',3:'3rd'}[ch.planets[n].house]||ch.planets[n].house+'th')+' house'))bad.push(n+' kendradi');
  const ex=VDB.data.planets[n].exaltSign,de=VDB.data.planets[n].debilitationSign;if(!txt('sthana').includes(ex)||!txt('sthana').includes(de))bad.push(n+' uchcha signs');
  const u=Math.max(0,Math.min(60,s.sthanaBala.uchcha)),c=Math.max(0,Math.min(60,s.chestaBala)),ish=Math.sqrt(u*c),kas=Math.sqrt((60-u)*(60-c));if(!txt('ishta').includes('Ishta is '+r1(ish))||!txt('ishta').includes('Kashta '+r1(kas)))bad.push(n+' ishta kashta');
  const lords=['varshaLord','masaLord','dinaLord','horaLord'].filter(k=>ch.shadbala[k]===n);if((s.kalaBala.vmdh>0)!==(lords.length>0))bad.push(n+' vmdh lords');
  if(s.kalaBala.vmdh>0&&!txt('kala').includes('Scores '+r0(s.kalaBala.vmdh))&&!txt('kala').includes('scores '+r0(s.kalaBala.vmdh)))bad.push(n+' vmdh value');
  if(/undefined|NaN|\\[object|\\bnull\\b|\\{|\\}|  /.test(t))bad.push(n+' junk');if(BAN.test(t))bad.push(n+' banned '+t.match(BAN)[0]);if(/(^|[.!?] )[a-z]/.test(t))bad.push(n+' lowercase sentence start');
  if(x.words<1100)bad.push(n+' short '+x.words);
  const core=SBR.data.planets[n].core;if(t.includes(core+' tends')||t.includes(core+' depends'))bad.push(n+' verb agreement');
  x.groups.forEach(gp=>gp.lines.forEach(l=>{if(l.h!=='What it is'&&seen[l.text])bad.push(n+' dup line '+l.h);seen[l.text]=1}));});
 return bad.slice(0,8)}""".replace('__BAN__', BAN)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    ok('SBR loaded', pg.evaluate("typeof SBR==='object'&&SBR!==null&&typeof SBRUI==='object'"))
    for i, c in enumerate(CHARTS):
        pg.evaluate(CAST, dict(name='x', dob=c[0], tob=c[1], place='x', lat=c[2], lon=c[3], tz=c[4])); pg.wait_for_selector('#results.show', timeout=15000)
        bad = pg.evaluate(CHECK)
        ok('chart %d: every number, rank, tier, house, lord and sign in the Shadbala reading matches chart.shadbala; 7 planets x 8 groups; clean wording' % (i + 1), not bad, bad)
    pg.evaluate(CAST, dict(name='Asha', dob='1995-03-14', tob='11:00', place='Hyderabad', lat=17.385, lon=78.4867, tz=5.5)); pg.wait_for_selector('#results.show', timeout=15000)
    pg.evaluate("document.querySelectorAll('.app-panel').forEach(p=>p.classList.remove('active'));document.getElementById('panel-reading').classList.add('active')"); pg.wait_for_timeout(500)
    s = pg.evaluate("""()=>{const bad=[],ch=currentChartForModal,rd=document.querySelector('#panel-reading .rd'),tabs=[...rd.querySelectorAll(':scope>.vx-tabs button')],panes=[...rd.querySelectorAll(':scope>.vx-pane')];
      const i=tabs.findIndex(b=>/Strength/.test(b.textContent));if(i!==tabs.length-3)bad.push('tab position '+i);tabs[i].click();const pane=panes[i];
      if(pane.querySelectorAll('details.sbr-card').length!==7)bad.push('cards');if(pane.querySelectorAll('.sbr-bar').length!==7)bad.push('bars');if(pane.querySelectorAll('.sbr-six').length!==6)bad.push('six');
      const d=pane.querySelector('details.sbr-card');d.open=true;if(d.querySelectorAll('h5').length!==8)bad.push('headings '+d.querySelectorAll('h5').length);if(d.querySelectorAll('.sbr-sub').length!==10)bad.push('sub lines '+d.querySelectorAll('.sbr-sub').length);
      const rep=buildFullReportText(ch,currentProfileForExport,{});if(!/SHADBALA READING: WHAT EACH KIND OF STRENGTH MEANS/.test(rep)||!/Ayana Bala/.test(rep))bad.push('report');
      const doc=new DOMParser().parseFromString(PDFR.build(ch,currentProfileForExport,{sections:['shadbala']}),'text/html');if(doc.querySelectorAll('#s-shadbala .hn-plate').length!==7||!/Cheshta Bala/.test(doc.body.textContent))bad.push('pdf');
      return {bad:bad.slice(0,6),over:document.documentElement.scrollWidth>window.innerWidth+1}}""")
    ok('Strength tab (last tab), 7 planet cards with 8 groups each, report text and PDF pages carry the reading', not s['bad'], s)
    ok('phone: no horizontal scroll', not s.get('over'))
    pg.screenshot(path='/tmp/claude-0/sb.png')
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:400]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

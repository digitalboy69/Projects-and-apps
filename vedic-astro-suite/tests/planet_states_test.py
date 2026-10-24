# Test of the planet states layer (js/102-planet-states.js PST + js/103 screens): tags and numbers checked against the chart independently, full coverage of every
# planet x state paragraph, wording rules, wiring into the Planets tab, report and PDF pages. Run: python3 tests/planet_states_test.py
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
COVER = """()=>{const BAN=__BAN__,bad=[],P7=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'],D=PST.data;
 P7.forEach(n=>{['Exalted','Debilitated','OwnSign','Moolatrikona','Friend','Neutral','Enemy'].forEach(st=>{const t=PST.text(n,st,{sign:3});if(!t||t.split(/\\s+/).length<40||/[{}]|undefined/.test(t)||BAN.test(t))bad.push(n+' '+st)});
  ['retro','combust'].forEach(k=>{const t=D.planets[n][k];const should=!((k==='retro'&&['Sun','Moon'].includes(n))||(k==='combust'&&n==='Sun'));if(should&&(!t||t.split(/\\s+/).length<45||BAN.test(t)))bad.push(n+' '+k);if(!should&&t)bad.push(n+' '+k+' should be empty')});
  ['exalted','debilitated'].forEach(k=>{if(D.planets[n][k].split(/\\s+/).length<80)bad.push(n+' '+k+' short')})});
 Object.keys(D.combos).forEach(k=>{if(/[^{}a-z]\\{(?!core)/.test(D.combos[k])||BAN.test(D.combos[k]))bad.push('combo '+k)});return bad.slice(0,8)}""".replace('__BAN__', BAN)
CHECK = """()=>{const BAN=__BAN__,ch=currentChartForModal,A=PST.all(ch),bad=[],P=ch.planets;
 if(A.length!==9)bad.push('9 blocks');if(JSON.stringify(A)!==JSON.stringify(PST.all(ch)))bad.push('not deterministic');
 A.forEach(b=>{const p=P[b.planet],t=b.lines.map(l=>l.text).join(' ');
  if(/[{}]|undefined|NaN|\\[object|\\bnull\\b|  |\\.\\./.test(t.replace(/\\.\\.\\./g,'')))bad.push('junk '+b.planet);if(BAN.test(t))bad.push('banned '+b.planet+': '+t.match(BAN)[0]);
  if(b.words<100)bad.push('short '+b.planet);
  if(b.planet==='Rahu'||b.planet==='Ketu')return;
  const st=p.dignity.status,lab={Exalted:'Exalted',OwnSign:'Own sign',Moolatrikona:'Moolatrikona',Friend:"Friend's sign",Neutral:'Neutral sign',Enemy:"Enemy's sign",Debilitated:'Debilitated'}[st];
  if(b.tags[0]!==lab)bad.push('dignity tag '+b.planet);
  const hasR=b.tags.includes('Retrograde'),wantR=!!p.retrograde&&!['Sun','Moon'].includes(b.planet);if(hasR!==wantR)bad.push('retro tag '+b.planet);
  const hasC=b.tags.includes('Combust'),wantC=!!(p.combustion&&p.combustion.combust)&&b.planet!=='Sun';if(hasC!==wantC)bad.push('combust tag '+b.planet);
  const d9=ch.vargas.D9.planetVargaSign[b.planet],hasV=b.tags.includes('Vargottama');if(hasV!==(d9===p.sign))bad.push('vargottama tag '+b.planet);
  if(st==='Debilitated'&&!b.lines.some(l=>/Cancellation check/.test(l.h)))bad.push('cancellation line '+b.planet);if(st!=='Debilitated'&&b.lines.some(l=>/Cancellation check/.test(l.h)))bad.push('cancellation wrongly '+b.planet);
  if(wantC&&!t.includes(p.combustion.separation.toFixed(1)+' degrees'))bad.push('combust degrees '+b.planet);
  if(!t.includes('your '+(['1st','2nd','3rd'][p.house-1]||p.house+'th')+' house'))bad.push('house mention '+b.planet);
  if(!b.lines.some(l=>/navamsa/i.test(l.h)))bad.push('navamsa '+b.planet);
  if(!b.lines.some(l=>/^In your \\d+(st|nd|rd|th) house/.test(l.h)))bad.push('house line '+b.planet);
  const sl=b.lines.find(l=>l.h==='Sign and star together');if(!sl||!sl.text.includes(p.nakshatra.name)||!sl.text.includes(p.nakshatra.lord))bad.push('star line '+b.planet);
  const states=b.tags.length-(0);if([hasR,hasC,hasV].filter(Boolean).length+(st==='Debilitated'||st==='Exalted'?1:0)>=2&&!b.lines.some(l=>l.h==='States together')&&((hasR&&(st==='Exalted'||st==='Debilitated'||st==='Enemy'))||(hasC)))bad.push('combination line '+b.planet)});
 return bad.slice(0,8)}""".replace('__BAN__', BAN)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    ok('PST loaded', pg.evaluate("typeof PST==='object'&&PST!==null&&typeof PSTUI==='object'"))
    cv = pg.evaluate(COVER); ok('every planet x state paragraph exists, is long enough, has no placeholders or banned words (7 planets x 7 dignities, retrograde, combust, combinations)', not cv, cv)
    seen = set()
    for i, c in enumerate(CHARTS):
        pg.evaluate(CAST, dict(name='x', dob=c[0], tob=c[1], place='x', lat=c[2], lon=c[3], tz=c[4])); pg.wait_for_selector('#results.show', timeout=15000)
        yb = pg.evaluate("""()=>{const BAN=__BAN__,ch=currentChartForModal,bad=[];YGE.detect(ch).forEach(y=>{const L=PST.yogaStates(ch,y),t=L.map(l=>l.text).join(' ');if(!L.length){if(y.planets&&y.planets.length)bad.push('none '+y.id);return}
          if(BAN.test(t)||/[{}]|undefined|NaN/.test(t))bad.push('text '+y.id);y.planets.forEach(n=>{if(!t.includes(n+' is '))bad.push(y.id+' misses '+n);const p=ch.planets[n];if(p.retrograde&&!['Sun','Moon','Rahu','Ketu'].includes(n)&&!new RegExp(n+' is [^.;]*retrograde').test(t))bad.push(y.id+' retro '+n);if(p.combustion&&p.combustion.combust&&n!=='Sun'&&!new RegExp(n+' is [^.;]*combust').test(t))bad.push(y.id+' combust '+n)});
          if(!L.some(l=>l.h==='What the states do to this combination'))bad.push('verdict '+y.id)});return bad.slice(0,6)}""".replace('__BAN__', BAN))
        ok('chart %d: yoga combinations are read by the state of their planets (retrograde, combust and so on match the chart)' % (i + 1), not yb, yb)
        bad = pg.evaluate(CHECK); ok('chart %d: state tags, degrees, cancellation, navamsa and combinations match the chart; clean wording' % (i + 1), not bad, bad)
        seen.update(pg.evaluate("PST.all(currentChartForModal).flatMap(b=>b.tags)"))
    ok('the 12 charts together exercise retrograde, combust, vargottama and weak and strong signs', {'Retrograde', 'Combust', 'Vargottama', 'Debilitated', 'Exalted'} <= seen, sorted(seen))
    pg.evaluate(CAST, dict(name='Asha', dob='1995-03-14', tob='11:00', place='Hyderabad', lat=17.385, lon=78.4867, tz=5.5)); pg.wait_for_selector('#results.show', timeout=15000)
    pg.evaluate("document.querySelectorAll('.app-panel').forEach(p=>p.classList.remove('active'));document.getElementById('panel-reading').classList.add('active')")
    pg.evaluate("document.querySelectorAll('#panel-reading .rd .vx-tabs button:not(.hn-tab):not(.sbr-tab)')[2].click()"); pg.wait_for_timeout(300)
    s = pg.evaluate("""()=>{const bad=[],ch=currentChartForModal,pane=document.querySelector('#panel-reading .rd .vx-pane.on');const cards=pane.querySelectorAll('details.vx-pl');if(cards.length!==9)bad.push('cards '+cards.length);
      cards.forEach((c,i)=>{if(!c.querySelector('.ps'))bad.push('no .ps '+i)});
      const rep=buildFullReportText(ch,currentProfileForExport,{});if(!/PLANET STATES/.test(rep))bad.push('report');
      const d=new DOMParser().parseFromString(PDFR.build(ch,currentProfileForExport,{sections:['planets']}),'text/html'),pl=d.querySelectorAll('#s-planets .plate');if(pl.length!==9)bad.push('pdf plates '+pl.length);pl.forEach((e,i)=>{if(!/Its sign state|What Rahu is about|What Ketu is about/.test(e.textContent))bad.push('pdf state '+i)});
      return {bad:bad.slice(0,6),overflow:document.documentElement.scrollWidth>window.innerWidth+1}}""")
    ok('Planets tab cards, report and PDF planet pages carry the state blocks', not s['bad'], s)
    pd = pg.evaluate("""()=>{const BAN=__BAN__,ch=currentChartForModal,now=new Date('2026-10-23T00:00:00Z'),A=PST.periods(ch,now),bad=[],act=findActiveDasha(ch.dashaData.mahadashas,now);
      if(A.length!==3)bad.push('3 periods '+A.length);const want=[act.mahadasha,act.antardasha,act.pratyantardasha].map(d=>d.lord);A.forEach((b,i)=>{if(b.planet!==want[i])bad.push('lord '+i);const t=b.lines.map(l=>l.text).join(' ');
        if(b.words<110||BAN.test(t)||/[{}]|undefined|NaN/.test(t))bad.push('text '+i);if(!t.includes('rules')||!t.includes(' house'))bad.push('houses '+i);
        const p=ch.planets[b.planet];if(!!p.retrograde&&!['Sun','Moon'].includes(b.planet)&&!b.lines.some(l=>l.h==='Retrograde lord'))bad.push('retro '+i);if(!(p.retrograde&&!['Sun','Moon'].includes(b.planet))&&b.lines.some(l=>l.h==='Retrograde lord'))bad.push('retro wrongly '+i)});
      const h=VDR.dashaBlock(ch,act.mahadasha.lord,act.antardasha.lord);if(!/colours the running periods/.test(h))bad.push('now tab');return bad}""".replace('__BAN__', BAN))
    ok('running Mahadasha, Antardasha and Pratyantar lords are read by their state, with houses, in the Now tab', not pd, pd)
    ok('phone: no horizontal scroll', not s.get('overflow'))
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:400]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

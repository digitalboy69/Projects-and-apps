# Test of the area deep dive (js/99-area-deep.js, global ADD): long connected readings per life area, every quoted number checked against the chart
# independently of the module; wording rules; determinism; links; Deep reading, report and PDF wiring.
# Run: python3 tests/area_deep_test.py   (CHROMIUM=/path/to/chrome if not at the default)
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
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    ok('ADD loaded with 9 areas', pg.evaluate("typeof ADD==='object'&&ADD!==null&&ADD.ids.length===9&&Object.keys(ADD.data.areas).length===9"))
    for i, c in enumerate(CHARTS):
        pg.evaluate(CAST, dict(name='x', dob=c[0], tob=c[1], place='x', lat=c[2], lon=c[3], tz=c[4])); pg.wait_for_selector('#results.show', timeout=15000)
        o = pg.evaluate("""()=>{const BAN=__BAN__,ch=currentChartForModal,now=new Date('2026-10-22T00:00:00Z'),A=ADD.all(ch,{now}),A2=ADD.all(ch,{now}),bad=[],P=ch.planets,SB=ch.shadbala.planets,SAV=ch.ashtakavarga.sav,BAV=ch.ashtakavarga.bavTables,H1=ch.vargas.D1.houses;
          if(JSON.stringify(A)!==JSON.stringify(A2))bad.push('not deterministic');if(A.length!==9)bad.push('9 areas');const seen=new Set();let total=0;
          A.forEach(a=>{const t=a.sections.map(s=>s.text).join(' ');total+=a.words;
            if(a.sections.length<11)bad.push(a.id+' sections '+a.sections.length);a.sections.forEach(s=>{if(s.text.split(/\\s+/).length<60)bad.push(a.id+' short '+s.id);if(seen.has(s.text))bad.push('duplicate '+s.id);seen.add(s.text)});
            if(a.words<1250||a.words>3400)bad.push(a.id+' words '+a.words);if(/undefined|NaN|\\[object|\\bnull\\b|  |\\{|\\}|\\.\\./.test(t.replace(/\\.\\.\\./g,'')))bad.push(a.id+' junk');if(BAN.test(t.replace(/Death & rebirth/gi,'')))bad.push(a.id+' banned: '+t.match(BAN)[0]);
            // facts against the chart, independently
            a.facts.primary.forEach(f=>{const h=H1[f.h-1];if(f.sav!==SAV[h.sign]||f.lord!==h.signLord||f.lordHouse!==P[h.signLord].house||(SB[f.lord]&&f.lordPct!==Math.round(SB[f.lord].percentOfRequired)))bad.push(a.id+' primary fact '+f.h);
              const occ=Object.keys(P).filter(n=>P[n].house===f.h);if(occ.join()!==f.occ.join())bad.push(a.id+' occupants '+f.h);
              const asp=Object.keys(P).filter(n=>(P[n].aspectsHouses||[]).indexOf(f.h)>=0&&P[n].house!==f.h);if(asp.join()!==f.asp.join())bad.push(a.id+' aspects '+f.h);
              if(!t.includes(f.sav+' points'))bad.push(a.id+' text lacks sav '+f.h);if(f.lordPct!=null&&!t.includes(f.lordPct+'%'))bad.push(a.id+' text lacks pct')});
            a.facts.karakas.forEach(k=>{if(k.house!==P[k.n].house||k.dig!==P[k.n].dignity.status||(BAV[k.n]&&k.bav!==BAV[k.n][P[k.n].sign]))bad.push(a.id+' karaka '+k.n)});
            Object.keys(a.facts.vp).forEach(n=>{const o=a.facts.vp[n];let st=0,wk=0,tt=0;Object.keys(ch.vargas).filter(k=>/^D\\d+$/.test(k)&&ch.vargas[k].planetVargaSign).forEach(k=>{const sg=ch.vargas[k].planetVargaSign[n];if(sg==null)return;tt++;const s=getDignity(n,sg,15).status;if(['Exalted','OwnSign','Moolatrikona'].includes(s))st++;else if(['Enemy','Debilitated'].includes(s))wk++});
              if(o.strong!==st||o.weak!==wk||o.total!==tt||tt<20)bad.push(a.id+' varga pattern '+n);if(!t.includes(st+' of '+tt+' charts'))bad.push(a.id+' text lacks varga count')});
            a.facts.links.forEach(k=>{if(!ADD.ids.includes(k)||k===a.id)bad.push(a.id+' bad link')});
            if(a.id==='marriage'&&!(a.sections.some(s=>s.id==='love')&&a.sections.some(s=>s.id==='partner')))bad.push('marriage extras');
            if(a.id==='career'&&!a.sections.some(s=>s.id==='workstyle'))bad.push('career extra');if(a.id==='money'&&!a.sections.some(s=>s.id==='keeping'))bad.push('money extra');if(a.id==='spirit'&&!a.sections.some(s=>s.id==='path'))bad.push('spirit extra');
          });
          return {bad:bad.slice(0,8),total}}""".replace("__BAN__", BAN))
        ok('chart %d: 9 deep dives, every quoted number matches the chart (Ashtakavarga, Shadbala, houses, aspects, 23 divisional charts), clean wording, deterministic; %d words' % (i + 1, o['total']), not o['bad'], o['bad'])
    # ---- the readings differ between areas and between charts ----
    pg.evaluate(CAST, dict(name='x', dob='1995-03-14', tob='11:00', place='x', lat=17.385, lon=78.4867, tz=5.5)); pg.wait_for_selector('#results.show', timeout=15000)
    a1 = pg.evaluate("ADD.all(currentChartForModal,{now:new Date('2026-10-22T00:00:00Z')}).map(a=>a.sections.map(s=>s.text).join(' '))")
    pg.evaluate(CAST, dict(name='x', dob='1975-06-30', tob='23:50', place='x', lat=-0.18, lon=-78.47, tz=-5)); pg.wait_for_selector('#results.show', timeout=15000)
    a2 = pg.evaluate("ADD.all(currentChartForModal,{now:new Date('2026-10-22T00:00:00Z')}).map(a=>a.sections.map(s=>s.text).join(' '))")
    def sim(x, y):
        X, Y = set(x.split()), set(y.split()); return len(X & Y) / len(X | Y)
    ok('different areas and different charts give clearly different readings', max(sim(a1[i], a1[j]) for i in range(9) for j in range(i + 1, 9)) < .8 and max(sim(a1[i], a2[i]) for i in range(9)) < .85, (round(max(sim(a1[i], a1[j]) for i in range(9) for j in range(i + 1, 9)), 2), round(max(sim(a1[i], a2[i]) for i in range(9)), 2)))
    # ---- screens ----
    pg.evaluate(CAST, dict(name='Asha', dob='1995-03-14', tob='11:00', place='Hyderabad', lat=17.385, lon=78.4867, tz=5.5)); pg.wait_for_selector('#results.show', timeout=15000)
    pg.evaluate("document.querySelectorAll('.app-panel').forEach(p=>p.classList.remove('active'));document.getElementById('panel-reading').classList.add('active')")
    pg.evaluate("document.querySelectorAll('#panel-reading .rd .vx-tabs button:not(.hn-tab):not(.sbr-tab):not(.avr-tab):not(.pf-tab)')[5].click()"); pg.wait_for_timeout(400)
    s = pg.evaluate("""()=>{const ch=currentChartForModal,D=ADD.all(ch),bad=[],sec=document.querySelector('.dr-sec[data-sec=areas]'),norm=s=>s.replace(/\\s+/g,' ');
      const ds=sec.querySelectorAll('details.dr-deep');if(ds.length!==9)bad.push('deep folds '+ds.length);ds.forEach((d,i)=>{if(d.querySelectorAll('h5').length!==D[i].sections.length)bad.push('headings '+i);if(!norm(d.textContent).includes(norm(D[i].sections[1].text).slice(0,80)))bad.push('text '+i)});
      const rep=norm(buildFullReportText(ch,currentProfileForExport,{}));if((rep.match(/DEEP DIVE \\(ALL CHARTS\\)/g)||[]).length!==9)bad.push('report titles');D.forEach(a=>{if(!rep.includes(norm(a.sections[2].text).slice(0,70)))bad.push('report '+a.id)});
      const d=new DOMParser().parseFromString(PDFR.build(ch,currentProfileForExport,{sections:['areas']}),'text/html'),pl=d.querySelectorAll('#s-areas .plate.deep');if(pl.length!==9)bad.push('pdf plates '+pl.length);pl.forEach((e,i)=>{if(e.querySelectorAll('h5').length!==D[i].sections.length)bad.push('pdf headings '+i)});
      return {bad:bad.slice(0,6),overflow:document.documentElement.scrollWidth>window.innerWidth+1}}""")
    ok('Deep reading (a fold-out under each area), the report and the PDF carry the same 9 deep dives', not s['bad'], s)
    ok('phone: no horizontal scroll', not s.get('overflow'))
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:400]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

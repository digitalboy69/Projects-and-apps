# Test of the divisional chart readings (js/96-varga-reading.js, global VGR): every position, dignity, vargottama flag and domain house is cross-checked
# against the app's own varga data (chart.vargas) and VDB's D9 vargottama status; texts are clean; they vary by chart and react to changed facts; screens show them.
# Run: python3 tests/varga_reading_test.py   (CHROMIUM=/path/to/chrome if not at the default)
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
BAN = r"/\b(always|never|certainly|definitely|guaranteed|doomed|destined|fatal|cursed|will die|death|you will|you are going to)\b/i"
HEADS = ['What this chart shows', 'How it begins', 'Planet by planet', 'Strength at a glance', 'Check this against your life']
texts, scores, words = {}, [], []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    ok('VGR loaded with the six varga tables', pg.evaluate("typeof VGR==='object'&&VGR!==null&&VGR.keys.join()==='D9,D10,D7,D4,D24,D20'&&Object.values(VGR.data.vargas).every(a=>a.name&&a.noun&&a.houses.length&&a.key.length&&a.intro&&a.lagna&&a.asks.length===2)"))
    for i, c in enumerate(CHARTS):
        pg.evaluate(CAST, dict(name='x', dob=c[0], tob=c[1], place='x', lat=c[2], lon=c[3], tz=c[4])); pg.wait_for_selector('#results.show', timeout=15000)
        o = pg.evaluate("""()=>{const BAN=%s,HEADS=%s,c=currentChartForModal,SIGN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'],bad=[],L=VGR.all(c),r=VDB.reading(c),
          bands=VGR.data&&[[62,'Strong'],[50,'Steady'],[38,'Mixed'],[0,'Needs care']];
          if(L.length!==6)bad.push('count');
          L.forEach(x=>{const V=c.vargas[x.key],A=VGR.data.vargas[x.key],T=x.text,k=x.key;
            if(x.lagna.sign!==SIGN[V.houses[0].sign])bad.push('lagna '+k);
            if(x.planets.length!==9)bad.push('planets '+k);
            x.planets.forEach(p=>{const hh=V.houses.find(h=>h.planets.some(q=>q.name===p.planet));
              if(p.sign!==SIGN[V.planetVargaSign[p.planet]])bad.push('sign '+k+p.planet);
              if(!hh||p.house!==hh.houseNum)bad.push('house '+k+p.planet);
              const dd=hh&&hh.planets.find(q=>q.name===p.planet).dignity.status;if(dd!==p.dignity)bad.push('dignity '+k+p.planet+' '+dd+' vs '+p.dignity);
              if(p.vargottama!==(c.planets[p.planet].sign===V.planetVargaSign[p.planet]))bad.push('vargottama '+k+p.planet);
              if(k==='D9'&&['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'].includes(p.planet)){const app=(r.planets[p.planet].status||[]).some(s=>s.key==='vargottama');if(app!==p.vargottama)bad.push('app vargottama '+p.planet)}
              if(p.strong&&!/in a strong sign/.test(p.text))bad.push('strong text '+k+p.planet);if(p.weak&&!/in a weaker sign/.test(p.text))bad.push('weak text '+k+p.planet);
              if(!p.strong&&/in a strong sign/.test(p.text))bad.push('false strong '+k+p.planet);if(!p.weak&&/in a weaker sign/.test(p.text))bad.push('false weak '+k+p.planet);
              if(p.vargottama!==/vargottama/.test(p.text))bad.push('vargottama text '+k+p.planet);if(p.key!==A.key.includes(p.planet))bad.push('key '+k+p.planet)});
            if(x.houses.length!==A.houses.length)bad.push('domain houses '+k);
            x.houses.forEach(h=>{const H=V.houses[h.house-1];if(h.sign!==H.signName||h.lord!==H.signLord)bad.push('dh sign/lord '+k+h.house);if(JSON.stringify(h.occupants)!==JSON.stringify(H.planets.map(q=>q.name)))bad.push('dh occupants '+k+h.house);
              if(!h.text.includes('ruled by '+h.lord))bad.push('dh text '+k+h.house)});
            const S=x.summary;if(JSON.stringify(S.strong)!==JSON.stringify(x.planets.filter(p=>p.strong).map(p=>p.planet))||JSON.stringify(S.weak)!==JSON.stringify(x.planets.filter(p=>p.weak).map(p=>p.planet)))bad.push('summary '+k);
            if(!Number.isInteger(x.score)||x.score<3||x.score>97||bands.find(b=>x.score>=b[0])[1]!==x.band)bad.push('score/band '+k);
            if(!S.text.includes('('+x.score+'/100)'))bad.push('summary score '+k);
            if(JSON.stringify(x.paragraphs.map(p=>p.h).filter(h=>!h.startsWith('The houses that matter')))!==JSON.stringify(HEADS))bad.push('headings '+k);
            if(x.words<380||x.words>780)bad.push('words '+k+' '+x.words);
            if(/undefined|NaN|\\[object|\\bnull\\b|  |\\{|\\}/.test(T)||BAN.test(T))bad.push('text '+k);
            if(!/\\byou\\b/i.test(T)||/\\b(the native|he is|she is)\\b/i.test(T))bad.push('voice '+k);
            if(x.questions.length!==2||!x.questions.every(q=>/\\?$/.test(q)))bad.push('questions '+k)});
          return {bad:bad.slice(0,8),texts:L.map(x=>x.text),scores:L.map(x=>x.score),words:L.map(x=>x.words)}}""" % (BAN, HEADS))
        ok('chart %d: 6 varga readings agree with the app\'s own varga data (sign, house, dignity, vargottama, domain houses, lord, occupants), clean text, 380-780 words' % (i + 1), not o['bad'], o['bad'])
        scores += o['scores']; words += o['words']
        for k, t in enumerate(o['texts']): texts.setdefault(k, set()).add(t)
    ok('readings vary with the chart (each varga has at least 10 different texts across 12 charts)', all(len(v) >= 10 for v in texts.values()), {k: len(v) for k, v in texts.items()})
    ok('scores spread out (sd >= 7, range >= 30) and words average 450-650', max(scores) - min(scores) >= 30 and (sum((s - sum(scores) / len(scores)) ** 2 for s in scores) / len(scores)) ** .5 >= 7 and 450 <= sum(words) / len(words) <= 650, (min(scores), max(scores), round(sum(words) / len(words))))
    # ---- sensitivity: change ONE fact (Venus's sign in D9) ----
    pg.evaluate(CAST, dict(name='Asha', dob='1995-03-14', tob='11:00', place='Hyderabad', lat=17.385, lon=78.4867, tz=5.5)); pg.wait_for_selector('#results.show', timeout=15000)
    sn = pg.evaluate("""()=>{const c=currentChartForModal,mk=s=>{const V=c.vargas.D9,pvs=Object.assign({},V.planetVargaSign,{Venus:s});return Object.assign({},c,{vargas:Object.assign({},c.vargas,{D9:Object.assign({},V,{planetVargaSign:pvs})})})};
      const base=VGR.chart(c,'D9'),ex=VGR.chart(mk(11),'D9'),de=VGR.chart(mk(5),'D9'),v=x=>x.planets.find(p=>p.planet==='Venus');
      return {exStrong:v(ex).strong&&ex.summary.strong.includes('Venus')&&/in a strong sign/.test(v(ex).text),deWeak:v(de).weak&&de.summary.weak.includes('Venus')&&/in a weaker sign/.test(v(de).text),
        up:ex.score>=base.score&&ex.score>de.score,down:de.score<=base.score,textChanged:ex.text!==base.text&&de.text!==base.text,otherUnchanged:JSON.stringify(VGR.chart(mk(11),'D10').planets)===JSON.stringify(VGR.chart(c,'D10').planets)}}""")
    ok('the reading follows the facts: Venus exalted in D9 reads strong and lifts the score; debilitated reads weaker and lowers it; other charts do not change', all(sn.values()), sn)
    # ---- screens ----
    s = pg.evaluate("""()=>{const c=currentChartForModal,L=VGR.all(c),rd=document.querySelector('#panel-reading .rd'),pane=[...rd.querySelectorAll(':scope>.vx-pane:not(.hn-pane)')][5],bad=[],norm=s=>s.replace(/\\s+/g,' ');
      const sec=pane.querySelector('.dr-sec[data-sec=vargas]');if(!sec)return {bad:['no section']};const ds=[...sec.querySelectorAll('details.dr-vg')];if(ds.length!==6)bad.push('cards');
      if(![...pane.querySelectorAll('.dr-nb')].some(b=>b.dataset.sec==='vargas'))bad.push('nav');
      ds.forEach((e,i)=>{if(e.querySelectorAll('h5').length!==L[i].paragraphs.length)bad.push('h5 '+i);if(!norm(e.textContent).includes(norm(L[i].paragraphs[3].text.slice(0,90))))bad.push('text '+i);if(e.querySelector('.dr-as').textContent!==String(L[i].score))bad.push('score '+i)});
      const rep=buildFullReportText(c,currentProfileForExport,{}).replace(/\\s+/g,' ');if(!rep.includes('DIVISIONAL CHARTS'))bad.push('report title');L.forEach(x=>{if(!rep.includes(x.name+' - '+x.band+' ('+x.score+')'))bad.push('report '+x.key)});
      const d=new DOMParser().parseFromString(PDFR.build(c,currentProfileForExport,{sections:['vargas']}),'text/html');if(d.querySelectorAll('#s-vargas .card').length!==6||d.querySelectorAll('#s-vargas tbody tr').length!==6)bad.push('pdf');
      return {bad:bad.slice(0,6),overflow:document.documentElement.scrollWidth>window.innerWidth+1}}""")
    ok('Deep reading (six fold-outs with scores), the report text and the PDF carry the same six readings', not s['bad'], s)
    ok('phone: no horizontal scroll', not s.get('overflow'))
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:300]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

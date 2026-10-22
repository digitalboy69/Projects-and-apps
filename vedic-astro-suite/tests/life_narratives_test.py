# Test of the Life-area narratives (js/95-life-narratives.js, global LAN): 9 personal readings per chart, 400-720 words each, composed from the engine's facts,
# consistent with the scores (no strong-sounding sentence for a weak part), varied across charts, and shown in Deep reading, the report and the PDF.
# Run: python3 tests/life_narratives_test.py   (CHROMIUM=/path/to/chrome if not at the default)
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
NOW = "new Date('2026-10-22')"
BAN = r"/\b(always|never|certainly|definitely|guaranteed|doomed|destined|fatal|cursed|will die|death|you will|you are going to)\b/i"
HEADS = ['The big picture', 'How it shows up in daily life', 'Where you may notice it', 'What supports you here', 'What deserves care', 'Timing', 'How the score is built', 'What helps', 'Check this against your life', 'In short']
words_all, texts = [], {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    ok('LAN loaded with the 9 areas\' tables', pg.evaluate("typeof LAN==='object'&&LAN!==null&&Object.keys(LAN.data.areas).length===9&&Object.values(LAN.data.areas).every(a=>a.stance.length===4&&a.practices.length===4&&a.ask.length===2&&a.noun&&a.win&&a.slip&&a.means)&&LAN.data.closing.length===4"))
    for i, c in enumerate(CHARTS):
        pg.evaluate(CAST, dict(name='x', dob=c[0], tob=c[1], place='x', lat=c[2], lon=c[3], tz=c[4])); pg.wait_for_selector('#results.show', timeout=15000)
        o = pg.evaluate("""()=>{const BAN=%s,HEADS=%s,D=LAN.data,la=LAE.assess(currentChartForModal,{now:%s}),L=LAN.all(currentChartForModal,{now:%s}),bad=[],bands=['Strong','Steady','Mixed','Needs care'];
          const fill=(t,a)=>t.replace('{n}',a.noun).replace('{w}',a.win).replace('{s}',a.slip).replace('{m}',a.means);
          if(L.length!==9)bad.push('count');if(new Set(L.map(x=>x.text)).size!==9)bad.push('areas identical');
          L.forEach((n,k)=>{const x=la.areas[k],a=D.areas[x.id],T=n.text,bi=bands.indexOf(x.band);
            if(n.id!==x.id||n.score!==x.score||n.band!==x.band)bad.push('mismatch '+x.id);
            if(JSON.stringify(n.paragraphs.map(p=>p.h).filter(h=>h!=='Combinations that shape it'))!==JSON.stringify(HEADS))bad.push('headings '+x.id+' '+n.paragraphs.map(p=>p.h).join('|'));
            if(n.words<400||n.words>720)bad.push('words '+x.id+' '+n.words);
            if(/undefined|NaN|\\[object|\\bnull\\b|  |\\{|\\}/.test(T)||BAN.test(T))bad.push('text '+x.id);
            if(!/\\byou\\b/i.test(T)||/\\b(the native|he is|she is)\\b/i.test(T))bad.push('voice '+x.id);
            if(!T.includes(a.stance[bi]))bad.push('stance '+x.id);a.stance.forEach((s,j)=>{if(j!==bi&&T.includes(s))bad.push('other stance '+x.id)});
            if(!T.includes('Your score here is '+x.score+' out of 100 ('+x.band.toLowerCase()+')'))bad.push('score line '+x.id);
            n.parts.high.forEach(k2=>{if(x.parts[k2]<60)bad.push('high part '+x.id+k2)});n.parts.low.forEach(k2=>{if(x.parts[k2]>45)bad.push('low part '+x.id+k2)});
            Object.keys(D.parts).forEach(k2=>{const hi=fill(D.parts[k2][0],a),lo=fill(D.parts[k2][1],a);
              if(n.parts.high.includes(k2)!==T.includes(hi))bad.push('high sentence '+x.id+k2);if(n.parts.low.includes(k2)!==T.includes(lo))bad.push('low sentence '+x.id+k2);
              if(x.parts[k2]<=45&&T.includes(hi))bad.push('contradiction hi '+x.id+k2);if(x.parts[k2]>=60&&T.includes(lo))bad.push('contradiction lo '+x.id+k2)});
            if(n.questions.length<2||!n.questions.every(q=>/\\?$/.test(q)))bad.push('questions '+x.id);
            const p5=n.paragraphs.find(p=>p.h==='Timing').text;if(!/Right now/.test(p5))bad.push('timing '+x.id);
            if(x.id==='health'&&bi===3&&!/not a medical statement/.test(T))bad.push('health disclaimer')});
          return {bad:bad.slice(0,6),words:L.map(n=>n.words),texts:L.map(n=>n.text)}}""" % (BAN, HEADS, NOW, NOW))
        ok('chart %d: 9 narratives, 400-720 words, fixed structure, voice and wording clean, consistent with the scores (no contradicting sentences)' % (i + 1), not o['bad'], o['bad'])
        words_all += o['words']
        for k, t in enumerate(o['texts']): texts.setdefault(k, set()).add(t)
    ok('narratives vary with the chart (each area has at least 10 different texts across 12 charts)', all(len(v) >= 10 for v in texts.values()), {k: len(v) for k, v in texts.items()})
    ok('length: average 450-650 words, shortest >= 400', 450 <= sum(words_all) / len(words_all) <= 650 and min(words_all) >= 400, (round(sum(words_all) / len(words_all)), min(words_all), max(words_all)))
    # ---- sensitivity: the story follows the facts ----
    pg.evaluate(CAST, dict(name='Asha', dob='1995-03-14', tob='11:00', place='Hyderabad', lat=17.385, lon=78.4867, tz=5.5)); pg.wait_for_selector('#results.show', timeout=15000)
    sn = pg.evaluate("""()=>{const c=currentChartForModal,now=%s,base=LAN.area(c,'career',{now}),H1=c.vargas.D1.houses,si=H1[9].sign,sav=c.ashtakavarga.sav.slice();sav[si]+=14;
      const up=LAN.area(Object.assign({},c,{ashtakavarga:Object.assign({},c.ashtakavarga,{sav})}),'career',{now});
      const pl=Object.assign({},c.shadbala.planets),l=H1[9].signLord;pl[l]=Object.assign({},pl[l],{percentOfRequired:Math.max(30,pl[l].percentOfRequired-60)});
      const dn=LAN.area(Object.assign({},c,{shadbala:Object.assign({},c.shadbala,{planets:pl})}),'career',{now});
      const far=LAN.area(c,'career',{now:new Date('2045-06-01')}),t=n=>n.paragraphs.find(p=>p.h==='Timing').text;
      return {scoreUp:up.score>=base.score,textChanged:up.text!==base.text,lordsDown:dn.text!==base.text,timingChanged:t(far)!==t(base),mentionsLord:base.text.includes('The lord of your 10th house is '+l)}}""" % NOW)
    ok('the story follows the facts: more house support changes the text and does not lower the score; weaker lord changes it; moving the date changes the timing paragraph; names the real house lord', all(sn.values()), sn)
    # ---- screens ----
    s = pg.evaluate("""()=>{const c=currentChartForModal,L=LAN.all(c),rd=document.querySelector('#panel-reading .rd'),pane=[...rd.querySelectorAll(':scope>.vx-pane')][5],bad=[],norm=s=>s.replace(/\\s+/g,' ');
      const cards=[...pane.querySelectorAll('.dr-sec[data-sec=areas] .dr-area')];if(cards.length!==9)bad.push('cards');
      cards.forEach((e,i)=>{const d=e.querySelector('details.dr-story');if(!d){bad.push('no story '+i);return}if(d.querySelectorAll('h5').length!==L[i].paragraphs.length)bad.push('headings '+i);if(!norm(d.textContent).includes(norm(L[i].paragraphs[0].text)))bad.push('text '+i)});
      const rep=buildFullReportText(c,currentProfileForExport,{}).replace(/\\s+/g,' ');L.forEach(n=>{if(!rep.includes(n.name.toUpperCase()+' - THE FULL STORY'))bad.push('report '+n.id);if(!rep.includes(norm(n.paragraphs[1].text.slice(0,80))))bad.push('report text '+n.id)});
      const d=new DOMParser().parseFromString(PDFR.build(c,currentProfileForExport,{sections:['areas']}),'text/html'),cs=[...d.querySelectorAll('#s-areas .card')];if(cs.length!==9)bad.push('pdf cards');
      cs.forEach((e,i)=>{if(e.querySelectorAll('h5').length!==L[i].paragraphs.length)bad.push('pdf headings '+i);if(!e.classList.contains('long'))bad.push('pdf long '+i)});
      return {bad:bad.slice(0,6),overflow:document.documentElement.scrollWidth>window.innerWidth+1}}""")
    ok('Deep reading (fold-out story under each area), the report text and the PDF carry the same 9 narratives', not s['bad'], s)
    ok('phone: no horizontal scroll', not s.get('overflow'))
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:300]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

# Test of the Life-area engine (js/94-life-areas.js, global LAE): scores are bounded, explained, calibrated (they spread out),
# react to the facts they claim to use (each input changed on its own), and appear in Deep reading, the report and the PDF.
# Run: python3 tests/life_areas_test.py   (CHROMIUM=/path/to/chrome if not at the default)
import functools, http.server, os, socketserver, statistics as st, threading
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
BAN = r"/\b(always|never|certainly|definitely|guaranteed|doomed|destined|fatal|cursed|will die|death|you will)\b/i"
scores, spreads, bandsAll, areaMeans = [], [], [], {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    ok('LAE loaded with 9 areas', pg.evaluate("typeof LAE==='object'&&LAE!==null&&LAE.ids.length===9&&LAE.data.areas.every(a=>a.primary.length&&a.karakas.length&&a.varga&&a.theme)"))
    for i, c in enumerate(CHARTS):
        pg.evaluate(CAST, dict(name='x', dob=c[0], tob=c[1], place='x', lat=c[2], lon=c[3], tz=c[4])); pg.wait_for_selector('#results.show', timeout=15000)
        o = pg.evaluate("""()=>{const BAN=%s,a=LAE.assess(currentChartForModal,{now:%s}),a2=LAE.assess(currentChartForModal,{now:%s}),bad=[],B=LAE.data.bands;
          if(a.areas.length!==9)bad.push('count');if(JSON.stringify(a)!==JSON.stringify(a2))bad.push('not deterministic');
          a.areas.forEach(x=>{const t=[x.headline,...x.pos,...x.neg,...x.now.why,...x.next5.why].join(' ');
            if(!Number.isInteger(x.score)||x.score<3||x.score>97)bad.push('score '+x.id);
            if(Object.values(x.parts).some(v=>!Number.isFinite(v)||v<0||v>100))bad.push('part '+x.id);
            if(B.find(b=>x.score>=b[0])[1]!==x.band)bad.push('band '+x.id);
            if(/undefined|NaN|\\[object|\\bnull\\b|  /.test(t)||BAN.test(t))bad.push('text '+x.id);
            if(!x.headline.startsWith(x.name))bad.push('headline '+x.id);if(!x.pos.length&&!x.neg.length)bad.push('no reasons '+x.id);
            if(!x.now.why.length||!x.next5.why.length)bad.push('timing text '+x.id);if(!Number.isFinite(x.now.score)||!Number.isFinite(x.next5.score))bad.push('timing score '+x.id)});
          if(a.order.length!==9||a.areas.find(x=>x.id===a.strongest).score!==Math.max(...a.areas.map(x=>x.score)))bad.push('order');
          return {bad:bad.slice(0,5),s:a.areas.map(x=>[x.id,x.score,x.band])}}""" % (BAN, NOW, NOW))
        ok('chart %d: 9 bounded, explained, deterministic scores; bands match; texts clean' % (i + 1), not o['bad'], o['bad'])
        sc = [x[1] for x in o['s']]; scores += sc; spreads.append(max(sc) - min(sc)); bandsAll += [x[2] for x in o['s']]
        for x in o['s']: areaMeans.setdefault(x[0], []).append(x[1])
        if i == 2:  # sensitivity on one chart: change ONE input at a time
            sn = pg.evaluate("""()=>{const c=currentChartForModal,now=%s,base=LAE.assess(c,{now}),out={house:[],lords:[],yogas:0,dasha:0},H1=c.vargas.D1.houses;
              base.areas.forEach(A=>{const h=A.primary[0],si=H1[h-1].sign,sav=c.ashtakavarga.sav.slice();sav[si]+=10;
                const up=LAE.assess(Object.assign({},c,{ashtakavarga:Object.assign({},c.ashtakavarga,{sav})}),{now}).areas.find(x=>x.id===A.id);
                out.house.push(up.parts.house>A.parts.house&&up.score>=A.score);
                const l=H1[h-1].signLord,pl=Object.assign({},c.shadbala.planets);pl[l]=Object.assign({},pl[l],{percentOfRequired:pl[l].percentOfRequired-40});
                const dn=LAE.assess(Object.assign({},c,{shadbala:Object.assign({},c.shadbala,{planets:pl})}),{now}).areas.find(x=>x.id===A.id);
                out.lords.push(dn.parts.lords<A.parts.lords&&dn.score<=A.score)});
              const far=LAE.assess(c,{now:new Date('2045-06-01')});out.dasha=far.areas.filter((x,i)=>x.now.score!==base.areas[i].now.score).length;
              out.yogaKinds=new Set(base.areas.flatMap(x=>x.yogas.map(y=>y.tone))).size;out.yogaAreas=base.areas.filter(x=>x.yogas.length).length;return out}""" % NOW)
            ok('raising the Ashtakavarga points of an area\'s house lifts its house part and never lowers the score (9/9 areas)', all(sn['house']), sn['house'])
            ok('lowering the strength of an area\'s house lord lowers its lords part and never raises the score (9/9 areas)', all(sn['lords']), sn['lords'])
            ok('moving "now" 19 years on changes the timing score of most areas (the dasha input is live)', sn['dasha'] >= 5, sn['dasha'])
            ok('yogas feed the areas (at least 5 areas carry related yogas)', sn['yogaAreas'] >= 5, sn)
    # ---- calibration over 12 charts x 9 areas ----
    mean, sd = st.mean(scores), st.pstdev(scores); share = {k: bandsAll.count(k) / len(bandsAll) for k in set(bandsAll)}
    ok('calibration: scores spread out (sd >= 9, range >= 40, mean 42-58) instead of everything being strong', sd >= 9 and max(scores) - min(scores) >= 40 and 42 <= mean <= 58, (round(mean, 1), round(sd, 1), min(scores), max(scores)))
    ok('calibration: at least 3 bands used and none holds more than 50% of the scores', len(share) >= 3 and max(share.values()) <= 0.5, share)
    ok('calibration: inside a chart the areas differ (spread >= 12 points in at least 10 of 12 charts)', sum(1 for s in spreads if s >= 12) >= 10, spreads)
    ok('calibration: no area is always high or always low (each area mean between 40 and 60)', all(40 <= st.mean(v) <= 60 for v in areaMeans.values()), {k: round(st.mean(v)) for k, v in areaMeans.items()})
    # ---- screens ----
    pg.evaluate(CAST, dict(name='Asha', dob='1995-03-14', tob='11:00', place='Hyderabad', lat=17.385, lon=78.4867, tz=5.5)); pg.wait_for_selector('#results.show', timeout=15000)
    s = pg.evaluate("""()=>{const c=currentChartForModal,A=LAE.assess(c),rd=document.querySelector('#panel-reading .rd'),pane=[...rd.querySelectorAll(':scope>.vx-pane')][5],bad=[],norm=s=>s.replace(/\\s+/g,' ');
      const sec=pane.querySelector('.dr-sec[data-sec=areas]');if(!sec)return {bad:['no section']};if(sec.querySelectorAll('.dr-area').length!==9)bad.push('cards');
      if(![...pane.querySelectorAll('.dr-nb')].some(b=>b.dataset.sec==='areas'))bad.push('nav');
      A.areas.forEach((x,i)=>{const e=sec.querySelectorAll('.dr-area')[i];if(!e)return;if(!e.textContent.includes(x.name))bad.push('name '+x.id);if(e.querySelector('.dr-as').textContent!==String(x.score))bad.push('score '+x.id);if(e.querySelector('.dr-bar i').style.width!==x.score+'%')bad.push('bar '+x.id)});
      const rep=buildFullReportText(c,currentProfileForExport,{}).replace(/\\s+/g,' ');if(!rep.includes('LIFE AREAS'))bad.push('report title');A.areas.forEach(x=>{if(!rep.includes(x.name+' - '+x.band+' ('+x.score+')'))bad.push('report '+x.id)});
      const d=new DOMParser().parseFromString(PDFR.build(c,currentProfileForExport,{sections:['areas']}),'text/html');if(d.querySelectorAll('#s-areas .card').length!==9||d.querySelectorAll('#s-areas tbody tr').length!==9)bad.push('pdf cards');
      if(!d.querySelector('#s-areas .abar i'))bad.push('pdf bars');
      return {bad:bad.slice(0,6),overflow:document.documentElement.scrollWidth>window.innerWidth+1}}""")
    ok('Deep reading has a "Life areas" section (9 cards, scores, bars, nav button); the report and the PDF list the same scores', not s['bad'], s)
    ok('phone: no horizontal scroll', not s.get('overflow'))
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:300]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

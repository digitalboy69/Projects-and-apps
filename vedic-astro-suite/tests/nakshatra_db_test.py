# Test of the Nakshatra layer (js/89-vedic-nakshatra-db.js, global VNK) inside the real Birth Chart app.
# Run: python3 tests/nakshatra_db_test.py   (CHROMIUM=/path/to/chrome if not at the default)
import functools, http.server, json, os, socketserver, threading
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
          ('1947-08-15', '00:00', 28.61, 77.21, 5.5), ('1988-12-21', '03:15', 64.15, -21.94, 0), ('1975-06-30', '23:50', -0.18, -78.47, -5), ('1930-08-30', '15:00', 41.26, -95.93, -6)]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    ok('VNK loaded', pg.evaluate("typeof VNK==='object' && VNK!==null && typeof VNK_DATA==='object'"))
    # ---- facets vs the app's own nakshatra table ----
    f = pg.evaluate("""()=>{const D=VNK.data,o={};
      o.n=D.nakshatras.length;o.same=D.nakshatras.every((x,i)=>{const m=VNK.nakshatra(i);return m.name===NAKSHATRAS[i].name&&m.lord===NAKSHATRAS[i].lord&&m.deity===NAKSHATRAS[i].deity});
      o.shape=D.nakshatras.every(x=>x.keywords.length===4&&x.strengths.length===3&&x.shadows.length===3&&x.practices.length===2&&x.style&&x.relating&&x.wellbeing&&D.nature[x.nature]);
      const cnt={};D.nakshatras.forEach(x=>cnt[x.nature]=(cnt[x.nature]||0)+1);o.nature=cnt;
      o.planets=Object.keys(D.planet).length===9&&Object.values(D.planet).every(x=>x.drive&&x.gives.length===2&&x.shadows.length===2&&x.practice);return o}""")
    ok('27 nakshatras: name/lord/deity equal the app; every facet present', f['n'] == 27 and f['same'] and f['shape'] and f['planets'], f)
    ok('7 classical nature groups with the right sizes (3,4,5,4,5,4,2)', f['nature'] == {'Swift': 3, 'Fixed': 4, 'Movable': 5, 'Sharp': 4, 'Fierce': 5, 'Soft': 4, 'Mixed': 2}, f['nature'])
    # ---- coverage + quality over ALL 972 placements ----
    q = pg.evaluate("""()=>{const T=[],K=new Set(),bad=[],BAN=/\\b(always|never|certainly|definitely|guaranteed|doomed|destined|fatal|cursed|will die|death)\\b/i;let n=0;
      VNK.each(x=>{n++;if(!x||!x.text){bad.push('empty');return;}T.push(x.text);K.add(x.key);
        if(/undefined|NaN|\\[object|\\{|\\}|null/.test(x.text))bad.push('placeholder '+x.key);if(BAN.test(x.text))bad.push('absolute/fatalistic '+x.key);
        if(x.strengths.length!==3||x.shadows.length!==3||x.practices.length!==2||!x.tags.length||typeof x.score!=='number')bad.push('facets '+x.key);
        if(!/ (a|an) (Dharma|Artha|Kama|Moksha) flavour/.test(x.text))bad.push('pada '+x.key);});
      const uniq=new Set(T).size;const lg=[];for(let i=0;i<27;i++)for(let p=1;p<=4;p++){const g=VNK.lagna(i,p);if(!g||!g.text||BAN.test(g.text)||/undefined|NaN/.test(g.text))lg.push(i+'/'+p);}
      return {n,keys:K.size,uniq,bad:bad.slice(0,6),lagnaBad:lg.length,words:Math.round(T.join(' ').split(/\\s+/).length/1000)}}""")
    ok('972 placements (9 planets x 27 nakshatras x 4 padas), all with unique keys and unique texts', q['n'] == 972 and q['keys'] == 972 and q['uniq'] == 972, q)
    ok('wording gates: no placeholders, no absolute or fatalistic words, every text has a pada/purushartha flavour; 108 lagna texts clean', not q['bad'] and q['lagnaBad'] == 0, q)
    # ---- the pada rotation really makes padas differ; relation logic ----
    r = pg.evaluate("""()=>{const a=VNK.placement('Mars',3,1),c=VNK.placement('Mars',3,2),o={};
      o.padasDiffer=a.text!==c.text&&JSON.stringify(a.strengths)!==JSON.stringify(c.strengths);
      o.own=VNK.placement('Moon',3,1).relation.kind==='own'&&VNK.placement('Sun',2,1).relation.kind==='own'&&VNK.placement('Saturn',7,1).relation.kind==='own';
      o.ease=VNK.placement('Moon',3,1).ease===1&&VNK.placement('Mars',0,1).relation.kind==='neutral';
      o.enemy=VNK.find({planet:'Sun',relation:'enemy'}).every(x=>VDB.data.planets.Sun.relations.enemies.includes(x.nakLord))&&VNK.find({planet:'Sun',relation:'enemy'}).length>0;
      o.filters=VNK.find({tone:'supportive',planet:'Moon'}).length>0&&VNK.find({nature:'Sharp',pada:1}).length===4*9;
      o.bad=[VNK.placement('Pluto',3,1),VNK.placement('Sun',27,1),VNK.placement('Sun',3,5),VNK.pada(3,0),VNK.nakshatra(-1),VNK.lagna(30,1)].every(v=>v===null);return o}""")
    ok('pada changes the result; own-star/friend/enemy logic correct; find() filters work; bad input returns null', all(r.values()), r)
    # ---- cross-check against the app's own D9 (navamsa) and dasha start, on real charts ----
    bad = []
    for d, t, la, lo, tz in CHARTS:
        pg.evaluate(CAST, dict(name='x', dob=d, tob=t, place='x', lat=la, lon=lo, tz=tz)); pg.wait_for_selector('#results.show', timeout=15000)
        o = pg.evaluate("""()=>{const c=currentChartForModal,R=VNK.forChart(c),d9=c.vargas.D9,bad=[];
          Object.keys(c.planets).forEach(n=>{const e=c.planets[n],x=R.planets[n];if(!x){bad.push(n+' missing');return;}
            if(x.pada.navamsaIndex!==d9.planetVargaSign[n])bad.push(n+' navamsa '+x.pada.navamsaSign+' vs D9 '+d9.planetVargaSign[n]);
            if(x.nakIndex!==e.nakshatra.index||x.pada.pada!==e.nakshatra.pada)bad.push(n+' nak');if(!x.lordPlacement||!x.lordNote)bad.push(n+' lord');});
          if(R.lagna.pada.navamsaIndex!==d9.ascendantSign)bad.push('lagna navamsa '+R.lagna.pada.navamsaIndex+' vs D9 '+d9.ascendantSign);
          if(R.moon.nakLord!==c.dashaData.startLord)bad.push('moon star lord '+R.moon.nakLord+' vs dasha start '+c.dashaData.startLord);
          if(R.moon.nakIndex!==c.dashaData.nakIndex)bad.push('moon nak index');if(Math.abs(R.moon.dashaStart.balanceYears-c.dashaData.balanceYears)>1e-9)bad.push('balance');
          return bad}""")
        if o: bad.append((d, o[:4]))
    ok('8 real charts: for all 9 planets + Lagna the pada->navamsa sign equals the app\'s own D9; Moon star lord equals the app\'s dasha start lord and balance', not bad, bad[:2])
    # ---- on-screen: Deep reading shows the layer for the last chart cast ----
    s = pg.evaluate("""()=>{const c=currentChartForModal,R=VNK.forChart(c),rd=document.querySelector('#panel-reading .rd'),panes=[...rd.querySelectorAll(':scope>.vx-pane')],norm=s=>s.replace(/\\s+/g,' ');
      const deep=norm(panes[5].textContent),cards=[...panes[2].querySelectorAll('details.vx-pl')].map(d=>norm(d.textContent)),bad=[];
      if(!deep.includes('Birth star: '+R.moon.nakshatra+', pada '+R.moon.pada.pada))bad.push('birth star note');if(!deep.includes('Rising nakshatra: '+R.lagna.nakshatra))bad.push('rising note');
      if(!deep.includes(norm(R.moon.wellbeing)))bad.push('wellbeing');
      Object.keys(R.planets).forEach((n,i)=>{const x=R.planets[n];if(!cards[i].includes('Nakshatra: '+x.nakshatra+', pada '+x.pada.pada))bad.push(n+' title');if(!cards[i].includes(norm(x.how)))bad.push(n+' how');
        if(!cards[i].includes(norm(x.relationText)))bad.push(n+' relation');x.strengths.forEach(s=>{if(!cards[i].includes(s))bad.push(n+' strength')});if(!cards[i].includes(norm(x.lordNote)))bad.push(n+' lordNote');});
      const rep=buildFullReportText(c,currentProfileForExport,{}).replace(/\\s+/g,' ');
      if(!rep.includes('Birth star:')||!rep.includes('Rising nakshatra:'))bad.push('report');
      if(!rep.includes(norm(R.planets.Sun.how)))bad.push('report planet');
      return {bad:bad.slice(0,6),overflow:document.documentElement.scrollWidth>window.innerWidth+1}}""")
    ok('Deep reading screens + report show the layer for the real chart (birth star, rising nakshatra, every planet card with relation, strengths, lord note)', not s['bad'], s['bad'])
    ok('phone: no horizontal scroll', not s['overflow'])
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:300]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

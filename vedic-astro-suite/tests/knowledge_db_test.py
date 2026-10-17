# Test of the Vedic Knowledge Database (js/87-vedic-knowledge-db.js) inside the real Birth Chart app.
# Run: python3 tests/knowledge_db_test.py   (CHROMIUM=/path/to/chrome if not at the default)
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
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    ok('VDB is loaded as a global', pg.evaluate("typeof VDB==='object' && typeof VDB_DATA==='object'"))
    cnt = pg.evaluate("""()=>{const D=VDB.data,n=o=>Array.isArray(o)?o.reduce((a,x)=>a+n(x),0):typeof o==='object'?Object.values(o).reduce((a,x)=>a+n(x),0):1;
      return {pih:n(D.planetInHouse),pis:n(D.planetInSign),lih:n(D.lordInHouse),aoh:n(D.aspectOnHouse),pa:Object.keys(D.planetAspect).length,cj:Object.keys(D.conjunction).length,nk:D.nakshatras.length,yg:D.yogas.length,hs:D.houses.length,sg:D.signs.length,ds:Object.keys(D.dasha).length}}""")
    ok('table sizes: 108/108/144/108/72/35/27/23 + 12 houses, 12 signs, 9 dashas', cnt == dict(pih=108, pis=108, lih=144, aoh=108, pa=72, cj=35, nk=27, yg=23, hs=12, sg=12, ds=9), cnt)
    q = pg.evaluate("""()=>{const D=VDB.data,T=[];const w=(o,p)=>{if(typeof o==='string')T.push([p,o]);else if(Array.isArray(o))o.forEach((v,i)=>w(v,p+'['+i+']'));else if(o&&typeof o==='object')Object.keys(o).forEach(k=>w(o[k],p+'.'+k));};
      ['planetInHouse','planetInSign','lordInHouse','aspectOnHouse','planetAspect','conjunction','rising','moonSign'].forEach(k=>w(D[k],k));
      const seen={},dup=[];T.forEach(([p,t])=>{if(seen[t])dup.push(p);seen[t]=1;});
      const bad=T.filter(([p,t])=>/undefined|NaN|\\{|\\}|TODO|\\bnull\\b|  /.test(t)||t.split(/\\s+/).length<10||!/[.)]$/.test(t.trim())).map(x=>x[0]);
      const art=T.filter(([p,t])=>/\\ba [aeiou]|\\bThe (sun|moon)\\b|\\bthe (sun|moon)'s [a-z]+ show/.test(t)).map(x=>x[0]);
      return {n:T.length,dup,bad,art}}""")
    ok('quality gates: no duplicate / empty / placeholder texts, grammar a/an + Sun/Moon', q['n'] >= 599 and not q['dup'] and not q['bad'] and not q['art'], q)
    # ---- cross-checks against the app's own tables ----
    x = pg.evaluate("""()=>{const D=VDB.data,o={};
      o.signs=D.signs.every((s,i)=>s.name===SIGNS[i].name&&s.lord===SIGNS[i].lord&&s.element===SIGNS[i].element&&s.quality===SIGNS[i].modality);
      o.nak=D.nakshatras.every((n,i)=>n.name===NAKSHATRAS[i].name&&n.lord===NAKSHATRAS[i].lord&&n.deity===NAKSHATRAS[i].deity);
      let badA=[];PLANET_LIST.forEach(p=>{for(let h=1;h<=12;h++){const a=JSON.stringify(VDB.aspectedHouses(p,h)),b=JSON.stringify(getAspectedHouses(p,h));if(a!==b)badA.push(p+h);}});o.aspects=badA;
      const MAP={Exalted:'Exalted',Debilitated:'Debilitated',Own:'OwnSign',Moolatrikona:'OwnSign',Friend:'Friend',Enemy:'Enemy',Neutral:'Neutral'};let badD=[];
      PLANET_LIST.forEach(p=>{for(let s=0;s<12;s++){const mine=MAP[D.planetInSignDignity[p][s]],app=getDignity(p,s,25).status;if(mine!==app)badD.push(p+'@'+SIGNS[s].name+':'+mine+'/'+app);}});o.dignity=badD;
      o.rel=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'].every(p=>['friends','enemies','neutrals'].every(k=>JSON.stringify([...NATURAL_RELATIONS[p][k]].sort())===JSON.stringify([...D.planets[p].relations[k]].sort())));
      o.exalt=PLANET_LIST.every(p=>D.planets[p].exaltSign===SIGNS[EXALTATION[p].sign].name);
      o.own=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'].every(p=>JSON.stringify(D.planets[p].ownSigns.map(n=>SIGNS.findIndex(s=>s.name===n)).sort((a,b)=>a-b))===JSON.stringify([...OWN_SIGNS[p]].sort((a,b)=>a-b)));
      o.house12=D.houses.map(h=>h.n).join()==='1,2,3,4,5,6,7,8,9,10,11,12';
      o.nakSpan=D.nakshatras.every((n,i)=>Math.abs(n.span[0]-i*360/27)<1e-3);
      o.pada=VDB.nakshatra(0,1).navamsaSign==='Aries'&&VDB.nakshatra(0,4).navamsaSign==='Cancer'&&VDB.nakshatra(26,4).navamsaSign==='Pisces';
      o.yk=(()=>{const g=i=>Object.entries(VDB.functionalNature(i)).filter(([p,v])=>v.kind==='Yogakaraka').map(x=>x[0]).join();return [g(1),g(6),g(3),g(4),g(9),g(10),g(0)].join('|')})();
      return o}""")
    ok('signs: names, rulers, elements, qualities equal the app', x['signs'])
    ok('27 nakshatras: names, lords, deities equal the app', x['nak'])
    ok('aspect rule equals the app for all 9 planets x 12 houses', not x['aspects'], x['aspects'][:5])
    ok('sign-level dignity (108 combos) equals the app (exalted/debilitated/own/friend/neutral/enemy)', not x['dignity'], x['dignity'][:5])
    ok('natural friend/enemy/neutral tables equal the app', x['rel']); ok('exaltation signs equal the app', x['exalt']); ok('own signs equal the app', x['own'])
    ok('houses 1..12 in order; nakshatra spans exact; padas map to navamsa signs', x['house12'] and x['nakSpan'] and x['pada'])
    ok('yogakarakas by rising sign: Taurus/Libra Saturn, Cancer/Leo Mars, Capricorn/Aquarius Venus, Aries none', x['yk'] == 'Saturn|Saturn|Mars|Mars|Venus|Venus|', x['yk'])
    # ---- lookups: bad input is handled, not thrown ----
    n = pg.evaluate("[VDB.planetInHouse('Sun',0),VDB.planetInHouse('Pluto',3),VDB.planetInSign('Moon',12),VDB.lordInHouse(13,1),VDB.conjunction('Rahu','Ketu'),VDB.conjunction('Sun','Sun'),VDB.planetAspect('Sun','Sun'),VDB.nakshatra(27)].every(v=>v===null)")
    ok('invalid lookups return null (no exceptions)', n)
    ok('Rahu+Ketu never conjoin, Sun+Mercury is Budhaditya', pg.evaluate("VDB.conjunction('Mercury','Sun').includes('Budhaditya')"))
    # ---- real charts through the app, then VDB.reading ----
    cases = [('1879-03-14', '11:30:00', 48.4011, 9.9876, 0.6667), ('1961-08-04', '19:24:00', 21.3069, -157.8583, -10), ('1995-03-14', '11:00:00', 17.385, 78.4867, 5.5), ('2000-01-01', '00:00:00', -33.87, 151.21, 11), ('1947-08-15', '00:00:00', 28.61, 77.21, 5.5)]
    for d, t, la, lo, tz in cases:
        r = pg.evaluate("""([d,t,la,lo,tz])=>{const c=computeChart(d,t,la,lo,tz),R=VDB.reading(c);const bad=[];
          const P=Object.keys(R.planets);if(P.length!==9)bad.push('planets '+P.length);
          P.forEach(n=>{const e=R.planets[n];if(!e.inHouse||!e.inHouse.text)bad.push(n+' house');if(!e.inSign||!e.inSign.text)bad.push(n+' sign');if(!e.nakshatra||!e.nakshatra.trait)bad.push(n+' nak');
            if(e.aspectsHouses.some(a=>!a.text))bad.push(n+' aspH');if(e.aspectsPlanets.some(a=>!a.text))bad.push(n+' aspP');if(e.aspectedBy.some(a=>!a.text))bad.push(n+' aspBy');if(e.conjunct.some(a=>!a.text))bad.push(n+' conj');});
          if(R.houseLords.length!==12||R.houseLords.some(h=>!h.text||!h.lord||!h.placedIn))bad.push('houseLords');
          const lordOfAll=[].concat(...P.map(n=>R.planets[n].lordOf)).sort((a,b)=>a-b).join();if(lordOfAll!=='1,2,3,4,5,6,7,8,9,10,11,12')bad.push('lordOf '+lordOfAll);
          // planet-planet aspect symmetry: if A aspects B then B lists A in aspectedBy
          P.forEach(a=>R.planets[a].aspectsPlanets.forEach(x=>{if(!R.planets[x.to].aspectedBy.some(y=>y.from===a))bad.push('asym '+a+x.to);}));
          return {bad,lagna:R.lagna.sign,mars:R.planets.Mars.house+'/'+R.planets.Mars.sign}}""", [d, t, la, lo, tz])
        ok(f'reading() on a real chart {d}: all lookups resolve, lordships cover 12 houses, aspects symmetric', not r['bad'], r)
    e = pg.evaluate("VDB.reading(computeChart('1879-03-14','11:30:00',48.4011,9.9876,0.6667)).lagna.sign")
    ok('Einstein chart: app and database agree the rising sign is Gemini', e == 'Gemini', e)
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:300]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

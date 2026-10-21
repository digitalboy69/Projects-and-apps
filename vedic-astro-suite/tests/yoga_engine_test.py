# Test of the Yoga engine (js/92-yoga-engine.js, global YGE): every yoga has a hand-built chart that HAS it and one that does NOT;
# real charts are cross-checked against the app's own detectors (computeChart().yogas); texts are clean; screens + report show them.
# Run: python3 tests/yoga_engine_test.py   (CHROMIUM=/path/to/chrome if not at the default)
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
# id: (rising sign index, signs of [Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu] in a chart that HAS it, same in a chart that does NOT)
FX = {
 'sunapha': (0, [6,0,5,7,8,1,9,3,9], [6,0,5,7,8,4,9,3,9]),
 'anapha': (0, [6,0,5,7,8,11,9,3,9], [6,0,5,7,8,4,9,3,9]),
 'durudhara': (0, [6,0,5,7,11,1,9,3,9], [6,0,5,7,11,4,9,3,9]),
 'kemadruma': (0, [4,1,4,5,8,7,10,2,8], [4,1,4,5,2,7,10,2,8]),
 'adhi': (0, [4,0,9,11,5,6,2,1,7], [4,0,9,11,8,9,2,1,7]),
 'gajakesari': (0, [4,0,9,11,3,6,2,1,7], [4,0,9,11,4,6,2,1,7]),
 'chandramangala': (0, [4,2,2,8,11,5,9,0,6], [4,2,3,8,11,5,9,0,6]),
 'shakata': (0, [4,5,9,11,0,7,2,1,7], [4,3,9,11,0,7,2,1,7]),
 'amala': (0, [4,0,2,11,9,6,5,1,7], [4,0,2,11,9,6,9,1,7]),
 'vesi': (0, [4,0,5,8,10,7,1,2,8], [4,0,9,8,10,7,1,2,8]),
 'vasi': (0, [4,0,9,8,10,3,1,2,8], [4,0,9,8,10,7,1,2,8]),
 'ubhayachari': (0, [4,0,5,8,10,3,1,2,8], [4,0,5,8,10,7,1,2,8]),
 'budhaditya': (0, [4,0,9,4,10,7,1,2,8], [4,0,9,5,10,7,1,2,8]),
 'gurumangala': (0, [4,0,8,11,8,7,1,2,8], [4,0,9,11,8,7,1,2,8]),
 'lakshmi': (0, [4,0,9,11,8,7,1,2,8], [4,0,9,11,7,7,1,2,8]),
 'saraswati': (0, [4,0,9,4,8,6,1,2,8], [4,0,9,4,7,6,1,2,8]),
 'dhana': (0, [4,0,9,11,8,8,5,2,8], [4,0,9,11,8,7,5,2,8]),
 'maha_parivartana': (0, [4,3,8,11,0,6,5,2,8], [4,3,8,11,1,6,5,2,8]),
 'khala_parivartana': (0, [4,0,5,9,10,7,2,3,9], [4,0,5,9,10,7,1,3,9]),
 'dainya_parivartana': (0, [7,0,4,11,10,3,5,2,8], [6,0,4,11,10,3,5,2,8]),
 'harsha': (0, [4,0,9,5,10,7,1,2,8], [4,0,9,4,10,7,1,2,8]),
 'sarala': (0, [4,0,7,11,10,3,1,2,8], [4,0,9,11,10,3,1,2,8]),
 'vimala': (0, [4,0,9,8,11,3,1,2,8], [4,0,9,8,10,3,1,2,8]),
 'neecha_bhanga': (0, [4,6,3,11,2,9,5,2,8], [4,4,3,11,2,9,5,2,8]),
 'dharma_karmadhipati': (0, [4,0,9,11,10,3,10,2,8], [4,0,9,11,10,3,11,2,8]),
 'raja_kt': (0, [4,4,9,11,10,3,1,2,8], [4,5,9,11,10,3,1,2,8]),
 'ruchaka': (0, [4,1,0,11,10,7,5,2,8], [4,1,1,11,10,7,5,2,8]),
 'bhadra': (2, [4,0,9,2,10,7,1,2,8], [4,0,9,3,10,7,1,2,8]),
 'hamsa': (0, [4,0,9,11,3,7,5,2,8], [4,0,9,11,4,7,5,2,8]),
 'malavya': (0, [4,0,5,11,10,6,1,2,8], [4,0,5,11,10,7,1,2,8]),
 'sasa': (0, [4,0,5,11,10,7,9,2,8], [4,0,5,11,10,7,10,2,8]),
 'chamara': (0, [4,0,9,11,5,7,1,2,8], [4,0,9,11,6,7,1,2,8]),
 'sankha': (0, [4,0,9,7,10,3,1,2,8], [4,0,9,5,10,3,1,2,8]),
 'kalanidhi': (0, [7,0,9,4,4,10,5,2,8], [7,0,9,4,4,9,5,2,8]),
 'vasumati': (0, [4,0,3,9,2,5,1,7,1], [4,0,3,9,2,6,1,7,1]),
 'subha_kartari_l': (0, [4,0,9,6,1,11,5,2,8], [4,0,9,6,1,10,5,2,8]),
 'papa_kartari_l': (0, [4,3,11,6,8,7,1,2,8], [4,3,10,6,8,7,1,2,8]),
 'subha_kartari_m': (0, [7,5,9,10,6,4,0,2,8], [7,5,9,10,6,3,0,2,8]),
 'papa_kartari_m': (0, [8,5,4,10,0,11,6,2,8], [8,5,3,10,0,11,6,2,8]),
 'chatussagara': (0, [0,3,6,9,10,11,1,2,8], [0,3,6,10,10,11,1,2,8]),
 'daridra': (0, [4,0,9,11,10,7,5,2,8], [4,0,9,11,10,7,1,2,8]),
 'kahala': (0, [4,0,9,11,3,7,1,2,8], [4,0,9,11,4,7,1,2,8]),
 'parvata': (0, [4,0,9,11,3,6,1,2,8], [4,0,9,11,3,6,5,2,8]),
 'mridanga': (0, [4,1,0,11,10,7,5,2,8], [4,1,1,11,10,7,5,2,8]),
 'lagnadhi': (0, [4,0,9,7,10,6,1,2,8], [4,0,9,11,10,9,1,2,8]),
 'yogakaraka': (1, [4,0,9,11,10,7,1,2,8], [4,0,9,11,10,7,1,2,8], 0),
 'trikona_link': (0, [4,0,9,11,4,7,1,2,8], [4,0,9,11,8,7,1,2,8]),
 'labha_dhana': (0, [4,0,9,11,8,10,5,2,8], [4,0,9,11,8,9,5,2,8]),
 'bhagya': (0, [4,0,9,11,8,7,1,2,8], [4,0,9,11,7,7,1,2,8]),
 'karma_yoga': (0, [4,0,5,11,10,7,9,2,8], [4,0,5,11,10,7,10,2,8]),
 'amavasya': (0, [4,4,9,11,10,7,1,2,8], [4,5,9,11,10,7,1,2,8]),
 'purnima': (0, [4,10,9,11,8,7,1,2,8], [4,9,9,11,8,7,1,2,8]),
 'lakshmi_narayana': (0, [4,0,9,7,10,7,1,2,8], [4,0,9,5,10,7,1,2,8]),
 'shani_mangal': (0, [4,0,9,11,10,7,9,2,8], [4,0,9,11,10,7,1,2,8]),
 'surya_shani': (0, [4,0,9,11,10,7,4,2,8], [4,0,9,11,10,7,1,2,8]),
 'vish': (0, [4,0,9,11,10,7,0,2,8], [4,0,9,11,10,7,1,2,8]),
 'digbala': (0, [4,1,5,11,0,7,5,2,8], [4,1,5,11,1,7,5,2,8]),
 'manglik': (0, [4,0,6,11,8,7,1,2,8], [4,0,4,11,8,7,1,2,8]),
 'kaal_sarp': (0, [3,4,5,6,7,5,4,2,8], [3,4,5,6,7,5,9,2,8]),
 'guru_chandala': (0, [4,0,9,11,2,7,1,2,8], [4,0,9,11,10,7,1,2,8]),
 'surya_grahan': (0, [2,0,9,11,10,7,1,2,8], [4,0,9,11,10,7,1,2,8]),
 'chandra_grahan': (0, [4,2,9,11,10,7,1,2,8], [4,0,9,11,10,7,1,2,8]),
 'shrapit': (0, [4,0,9,11,10,7,2,2,8], [4,0,9,11,10,7,1,2,8]),
 'angaraka': (0, [4,0,2,11,10,7,1,2,8], [4,0,9,11,10,7,1,2,8]),
 'rajju': (0, [0,3,6,9,0,3,6,2,8], [0,3,6,9,0,3,1,2,8]),
 'musala': (0, [1,4,7,10,1,4,7,2,8], [1,4,7,10,1,4,8,2,8]),
 'nala': (0, [2,5,8,11,2,5,8,2,8], [2,5,8,11,2,5,7,2,8]),
 'maala': (0, [4,2,5,6,0,3,1,2,8], [4,2,5,6,0,3,9,2,8]),
 'sarpa_dala': (0, [0,2,3,5,4,1,6,2,8], [0,2,3,5,9,1,6,2,8]),
 'gada': (0, [0,3,0,3,0,3,0,2,8], [0,3,0,3,0,3,6,2,8]),
 'sakata_n': (0, [0,6,0,6,0,6,0,2,8], [0,6,0,6,0,6,3,2,8]),
 'vihaga': (0, [3,9,3,9,3,9,3,2,8], [3,9,3,9,3,9,0,2,8]),
 'sringataka': (0, [0,4,8,0,4,8,0,2,8], [0,4,8,0,4,8,1,2,8]),
 'hala': (0, [1,5,9,1,5,9,1,2,8], [1,5,9,1,5,9,0,2,8]),
 'vajra': (0, [3,0,9,6,6,0,3,2,8], [3,0,9,6,6,0,1,2,8]),
 'yava': (0, [0,3,6,9,3,9,0,2,8], [0,3,6,9,3,1,0,2,8]),
 'gola': (0, [4,4,4,4,4,4,4,2,8], [4,4,4,4,4,4,5,2,8]),
 'yuga': (0, [4,4,5,5,4,5,4,2,8], [4,4,5,5,4,5,6,2,8]),
 'sula': (0, [4,5,6,4,5,6,4,2,8], [4,5,6,4,5,6,7,2,8]),
 'kedara': (0, [4,5,6,7,4,5,6,2,8], [4,5,6,7,8,5,6,2,8]),
 'pasha': (0, [4,5,6,7,8,4,5,2,8], [4,5,6,7,4,4,5,2,8]),
 'dama': (0, [4,5,6,7,8,9,4,2,8], [4,5,6,7,8,4,4,2,8]),
 'veena': (0, [0,1,2,3,4,5,6,2,8], [0,1,2,3,4,5,5,2,8]),
}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    ok('YGE loaded with 83 yogas and doshas', pg.evaluate("typeof YGE==='object'&&YGE!==null&&YGE.ids.length===83&&YGE.data.yogas.every(y=>y.name&&y.meaning&&y.scenes.length===2&&y.best&&y.watch&&y.ask&&/\\?$/.test(y.ask))"))
    ok('fixtures cover all 83 yogas and doshas', sorted(FX) == sorted(pg.evaluate("YGE.ids")))
    # ---- hand-built charts: each yoga present where it should be, absent where it should not ----
    r = pg.evaluate("""(FX)=>{
      const NAMES=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'],OFF={Mars:[4,7,8],Jupiter:[5,7,9],Saturn:[3,7,10]};
      const mk=(asc,signs)=>{const planets={};NAMES.forEach((n,i)=>{const sign=signs[i],house=((sign-asc+12)%12)+1,offs=OFF[n]||[7];
        const st=(OWN_SIGNS[n]||[]).includes(sign)?'OwnSign':(EXALTATION[n]&&EXALTATION[n].sign===sign)?'Exalted':(EXALTATION[n]&&getDebilitation(n).sign===sign)?'Debilitated':'Neutral';
        planets[n]={name:n,sign,house,longitude:sign*30+10+i*0.5,aspectsHouses:offs.map(o=>((house-1+o-1)%12)+1),dignity:{status:st},combustion:{combust:false}};});
        return {planets,ascendant:{sign:asc},dashaData:{mahadashas:[{lord:'Venus',startDate:new Date(1990,0,1),endDate:new Date(2010,0,1)},{lord:'Sun',startDate:new Date(2010,0,1),endDate:new Date(2016,0,1)},{lord:'Moon',startDate:new Date(2016,0,1),endDate:new Date(2026,0,1)},{lord:'Mars',startDate:new Date(2026,0,1),endDate:new Date(2033,0,1)}]}}};
      const miss=[],leak=[];
      for(const id in FX){const [asc,pos,neg,nasc]=FX[id];
        const a=YGE.detect(mk(asc,pos)).filter(x=>x.id===id),c=YGE.detect(mk(nasc===undefined?asc:nasc,neg)).filter(x=>x.id===id);
        if(!a.length)miss.push(id);if(c.length)leak.push(id);}
      const kc=YGE.detect(mk(0,FX.kemadruma[1])).find(x=>x.id==='kemadruma'),kcc=YGE.detect(mk(0,[4,1,6,5,8,7,10,2,8])).find(x=>x.id==='kemadruma');
      const sk=YGE.detect(mk(0,FX.shakata[1])).find(x=>x.id==='shakata'),skc=YGE.detect(mk(0,[4,3,9,11,10,7,2,1,7])).find(x=>x.id==='shakata');
      const nb=YGE.detect(mk(0,FX.neecha_bhanga[1])).find(x=>x.id==='neecha_bhanga');
      const mgc=YGE.detect(mk(0,[4,0,7,11,8,7,1,2,8])).find(x=>x.id==='manglik'),mgo=YGE.detect(mk(0,FX.manglik[1])).find(x=>x.id==='manglik');
      const hm=YGE.detect(mk(0,FX.hamsa[1]),{now:new Date(2012,5,1)}).find(x=>x.id==='hamsa'),hm2=YGE.detect(mk(0,[4,0,9,11,3,7,5,2,8]),{now:new Date(2012,5,1)}).find(x=>x.id==='hamsa');
      const sunY=YGE.detect(mk(0,FX.vesi[1]),{now:new Date(2012,5,1)}).find(x=>x.id==='vesi'),strongY=YGE.detect(mk(0,FX.malavya[1])).find(x=>x.id==='malavya'),mildY=YGE.detect(mk(0,[4,0,5,11,10,6,1,2,8])).find(x=>x.id==='malavya');
      const du=YGE.detect(mk(0,FX.durudhara[1])).map(x=>x.id);
      return {miss,leak,kemOpen:kc&&!kc.cancelled,kemCancel:kcc&&kcc.cancelled&&/eased/.test(kcc.note),shakOpen:sk&&!sk.cancelled,shakCancel:skc&&skc.cancelled,nbPlanet:nb&&nb.planet,mgCancel:mgc&&mgc.cancelled&&mgc.level==='mild'&&mgo&&!mgo.cancelled&&mgo.level==='strong',strongLvl:strongY&&strongY.level==='strong'&&/Venus strong/.test(strongY.levelWhy),timingNow:!!(sunY&&/Sun Mahadasha|Mars Mahadasha|Moon Mahadasha|Venus Mahadasha/.test(sunY.timing||'')),duOnly:du.includes('durudhara')&&!du.includes('sunapha')&&!du.includes('anapha')}}""", FX)
    ok('each yoga is found in its chart (83/83)', not r['miss'], r['miss'])
    ok('each yoga is absent from the chart built without it (83/83)', not r['leak'], r['leak'])
    ok('Kemadruma: open when nothing supports it, cancelled (with a reason) when a planet is in a kendra; Shakata cancelled when the Moon is in a kendra', r['kemOpen'] and r['kemCancel'] and r['shakOpen'] and r['shakCancel'], r)
    ok('Neecha Bhanga names the weak planet; Durudhara replaces Sunapha/Anapha', r['nbPlanet'] == 'Mars' and r['duOnly'], r)
    ok('Manglik: eased (mild) when Mars is in its own sign, strong when it touches Lagna, Moon and Venus; strength rating reads planet dignity; timing hint names a Mahadasha', r['mgCancel'] and r['strongLvl'] and r['timingNow'], r)
    # ---- real charts: cross-check against the app's own detectors, clean texts ----
    BAN = "/\\b(always|never|certainly|definitely|guaranteed|doomed|destined|fatal|cursed|will die|death|you will)\\b/i"
    tot = 0
    for c in CHARTS:
        pg.evaluate(CAST, dict(name='x', dob=c[0], tob=c[1], place='x', lat=c[2], lon=c[3], tz=c[4])); pg.wait_for_selector('#results.show', timeout=15000)
        o = pg.evaluate("""()=>{const c=currentChartForModal,Y=YGE.detect(c),ids=Y.map(x=>x.id),bad=[],BAN=%s,Yg=c.yogas;
          const mine=s=>ids.includes(s),NAME={Ruchaka:'ruchaka',Bhadra:'bhadra',Hamsa:'hamsa',Malavya:'malavya',Sasa:'sasa'};
          (Yg.panchaMahapurusha||[]).forEach(x=>{if(!mine(NAME[x.yoga]))bad.push('missing '+x.yoga)});ids.filter(i=>['ruchaka','bhadra','hamsa','malavya','sasa'].includes(i)).forEach(i=>{if(!(Yg.panchaMahapurusha||[]).some(x=>NAME[x.yoga]===i))bad.push('extra '+i)});
          if(!!Yg.gajaKesari!==mine('gajakesari'))bad.push('gajakesari differs');
          const V={6:'harsha',8:'sarala',12:'vimala'};(Yg.viparitaRaja||[]).forEach(x=>{if(!mine(V[x.houseA]))bad.push('missing viparita '+x.houseA)});
          ['harsha','sarala','vimala'].forEach(i=>{if(mine(i)&&!(Yg.viparitaRaja||[]).some(x=>V[x.houseA]===i))bad.push('extra '+i)});
          const pv=new Set((Yg.parivartana||[]).map(x=>[x.houseA,x.houseB].sort((a,b)=>a-b).join('-')));Y.filter(x=>/parivartana/.test(x.id)).forEach(x=>{if(!pv.has(x.houses.slice().sort((a,b)=>a-b).join('-')))bad.push('extra exchange '+x.id)});
          const nbApp=new Set((Yg.neechaBhanga||[]).map(x=>x.planet));Y.filter(x=>x.id==='neecha_bhanga').forEach(x=>{if(!nbApp.has(x.planet))bad.push('extra NB '+x.planet)});
          Y.forEach(x=>{if(!x.text||/undefined|NaN|\\[object|null|\\{|\\}|  /.test(x.text)||BAN.test(x.text))bad.push('text '+x.id);if(!x.why||!x.planets.length||!x.houses.length)bad.push('why '+x.id);if(!/Check this against your life: .*\\?$/.test(x.text))bad.push('question '+x.id);if(!/\\byou\\b/i.test(x.text))bad.push('voice '+x.id);});
          if(new Set(ids).size!==ids.length&&!ids.every(i=>i==='neecha_bhanga'||new Set(ids.filter(j=>j===i)).size))bad.push('dup');
          return {n:Y.length,bad:bad.slice(0,6)}}""" % BAN)
        tot += o['n']; ok('real chart %s %s: yogas consistent with the app\'s own detectors, texts clean (%d found)' % (c[0], c[1], o['n']), not o['bad'], o)
    ok('real charts together show a spread of yogas (not none, not everything)', 8 <= tot <= 8 * 45, tot)
    lt = pg.evaluate("""()=>{const Y=YGE.detect(currentChartForModal),bad=[];Y.forEach(x=>{if(!x.level||!['strong','moderate','mild'].includes(x.level)||!x.levelWhy)bad.push('level '+x.id);
      if(x.timing&&!/Mahadasha/.test(x.timing))bad.push('timing '+x.id);if(!/How strongly it shows/.test(x.text))bad.push('text level '+x.id)});
      const past=YGE.detect(currentChartForModal,{now:new Date('2200-01-01')});return {n:Y.length,bad:bad.slice(0,6),noTimingAfterLife:past.every(x=>!x.timing||!/running now/.test(x.timing))}}""")
    ok('every yoga carries a strength level with its reason; timing hints name a Mahadasha and never say "running now" after the last one', not lt['bad'] and lt['noTimingAfterLife'], lt)
    # ---- on screen + report ----
    s = pg.evaluate("""()=>{const c=currentChartForModal,Y=YGE.detect(c),rd=document.querySelector('#panel-reading .rd'),norm=s=>s.replace(/\\s+/g,' '),panes=[...rd.querySelectorAll(':scope>.vx-pane')],deep=norm(panes[5].textContent),bad=[];
      if(!Y.length)return {bad:['no yogas']};if(!deep.includes('Yogas in your chart'))bad.push('title');Y.forEach(x=>{if(!deep.includes(norm(x.name)))bad.push('name '+x.id);if(!deep.includes(norm(x.why)))bad.push('why '+x.id)});
      const rep=buildFullReportText(c,currentProfileForExport,{}).replace(/\\s+/g,' ');if(!rep.includes('YOGAS IN YOUR CHART'))bad.push('report title');Y.forEach(x=>{if(!rep.includes(norm(x.name)))bad.push('report '+x.id)});
      return {n:Y.length,bad:bad.slice(0,6),overflow:document.documentElement.scrollWidth>window.innerWidth+1}}""")
    ok('Deep reading shows "Yogas in your chart" with every detected yoga and its rule; the report lists them too', not s['bad'], s)
    ok('phone: no horizontal scroll', not s.get('overflow'))
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:300]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

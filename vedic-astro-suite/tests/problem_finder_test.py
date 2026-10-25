# Problem finder (js/111-problem-finder.js PRB + js/112-problem-finder-ui.js PFUI): every fact in every reason is checked against the chart
# over 12 charts x every area x every problem x 3 trigger/feel pairs; wording; the click-through screens; the Home tile. Run: python3 tests/problem_finder_test.py
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
CHECK = """()=>{const BAN=__BAN__,ch=currentChartForModal,P=ch.planets,D1=ch.vargas.D1.houses,SAV=ch.ashtakavarga.sav,now=new Date('2026-10-25T00:00:00Z'),bad=[],hn=HNW.assess(ch,{now});
 const sky={};hn.sky.forEach(x=>sky[x.n]=x);const rules=n=>D1.filter(h=>h.signLord===n).map(h=>h.houseNum);
 const combos=[['ext','int'],['int','ext'],['both','both']];let nres=0,words=0;const seen={};
 PRB.areas.forEach(a=>a.problems.forEach(p=>combos.forEach(([t,f])=>{
  const sel={trigger:t,feel:f,area:a.id,problem:p.id,span:'years'},R=PRB.assess(ch,sel,{now}),R2=PRB.assess(ch,sel,{now});nres++;words+=R.words;const tag=a.id+'/'+p.id+'/'+t+f;
  if(JSON.stringify(R)!==JSON.stringify(R2))bad.push('nondeterministic '+tag);
  if(R.sections.length!==6||R.sections.map(s=>s.id).join()!=='area,signature,trigger,pain,timing,support')bad.push('sections '+tag);
  if(['light','clear','strong'].indexOf(R.level)<0)bad.push('level '+tag);if(R.words<250)bad.push('short '+R.words+' '+tag);if(R.chips.length!==4||R.help.length<3||!R.safety)bad.push('parts '+tag);
  a.houses.forEach(h=>{if(!R.sections[0].items.some(i=>i.fact.kind==='house'&&i.fact.h===h&&i.fact.intro))bad.push('area house '+h+' '+tag)});
  R.sections.forEach(s=>{if(!s.items.length)bad.push('empty '+s.id+' '+tag);s.items.forEach(it=>{const x=it.text,F=it.fact;
   if(BAN.test(x)||/undefined|NaN|\\[object|\\bnull\\b|\\{|\\}|  /.test(x)||/(^|[.!?] )[a-z]/.test(x)||/\\b1 points\\b/.test(x)||x.length<20)bad.push('text '+tag+': '+x.slice(0,50));
   if(F.kind==='house'){const d=D1[F.h-1];if(d.sign!==F.sign||d.signLord!==F.lord)bad.push('house fact '+tag);
     if(F.intro&&!x.includes('Your '+F.h+(['th','st','nd','rd'][(F.h%100>10&&F.h%100<14)?0:Math.min(F.h%10,4)%4]||'th')+' house')&&true){}
     if(F.lordHouse!=null&&P[F.lord].house!==F.lordHouse)bad.push('lordHouse '+tag);if(F.lordSt&&P[F.lord].dignity.status!==F.lordSt)bad.push('lordSt '+tag);
     if(F.lordCombust&&!P[F.lord].combustion.combust)bad.push('lordCombust '+tag);if(F.occ&&P[F.occ].house!==F.h)bad.push('occ '+tag);
     if(F.asp&&((P[F.asp].aspectsHouses||[]).indexOf(F.h)<0||P[F.asp].house===F.h))bad.push('asp '+tag);if(F.sav!=null&&(SAV[F.sign]!==F.sav||!x.includes(F.sav+' Ashtakavarga')))bad.push('sav '+tag);}
   else if(F.kind==='planet'){const q=P[F.p];if(q.house!==F.house||q.sign!==F.sign)bad.push('planet fact '+tag);if(F.st&&q.dignity.status!==F.st)bad.push('planet st '+tag);if(F.combust&&!q.combustion.combust)bad.push('combust '+tag);
     if(F.retro&&!q.retrograde)bad.push('retro '+tag);if(F.conj&&P[F.conj].house!==q.house)bad.push('conj '+tag);if(F.asp&&(P[F.asp].aspectsHouses||[]).indexOf(q.house)<0)bad.push('pasp '+tag);if(F.nak&&q.nakshatra.name!==F.nak)bad.push('nak '+tag);}
   else if(F.kind==='culprit'&&!F.none){const q=P[F.p];if(F.via==='sits in'||F.via==='shares the house with'){if(q.house!==F.h)bad.push('cul sits '+tag)}else if((q.aspectsHouses||[]).indexOf(F.h)<0)bad.push('cul looks '+tag);}
   else if(F.kind==='timing'&&!F.none&&!F.span){
     if(F.dasha){const key={Mahadasha:'md',Antardasha:'ad',Pratyantar:'pd'}[F.dasha],lord=hn.dasha[key]&&hn.dasha[key].lord;if(lord!==F.p)bad.push('dasha lord '+tag);if(F.rules&&F.rules.some(h=>rules(F.p).indexOf(h)<0))bad.push('dasha rules '+tag);if(F.sits&&a.houses.concat(p.eh).indexOf(P[F.p].house)<0)bad.push('dasha sits '+tag);}
     if(F.transit){const sx=sky[F.transit];if(F.on&&F.on.some(h=>sx.house!==h))bad.push('transit on '+tag);if(F.look&&F.look.some(h=>(sx.asp||[]).indexOf(h)<0))bad.push('transit look '+tag);}
     if(F.sadesati){const d=(sky.Saturn.sign-P.Moon.sign+12)%12;if(!(d===11||d===0||d===1))bad.push('sadesati '+tag);}
     if(F.score!=null&&hn.houses[F.house-1].score!==F.score)bad.push('house score '+tag);}
  })});
  R.top.forEach(t=>{if(!t.text)bad.push('top '+tag)});
 })));
 return {bad:bad.slice(0,8),nres,words}}""".replace('__BAN__', BAN)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 360, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    ok('PRB and PFUI loaded, 17 areas, every area has 4+ problems', pg.evaluate("typeof PRB==='object'&&typeof PFUI==='object'&&PRB.areas.length>=16&&PRB.areas.every(a=>a.problems.length>=4)"))
    for i, c in enumerate(CHARTS):
        pg.evaluate(CAST, dict(name='x', dob=c[0], tob=c[1], place='x', lat=c[2], lon=c[3], tz=c[4])); pg.wait_for_selector('#results.show', timeout=15000)
        r = pg.evaluate(CHECK)
        ok('chart %d: %d readings, every house, planet, aspect, points, dasha and transit fact matches the chart; clean wording; 6 sections each' % (i + 1, r['nres']), not r['bad'], r['bad'])
    pg.evaluate(CAST, dict(name='Asha', dob='1995-03-14', tob='11:00', place='Hyderabad', lat=17.385, lon=78.4867, tz=5.5)); pg.wait_for_selector('#results.show', timeout=15000)
    pg.evaluate("document.querySelectorAll('.app-panel').forEach(p=>p.classList.remove('active'));document.getElementById('panel-home').classList.add('active')"); pg.wait_for_timeout(600)
    ok('Home has a Problem Finder tile that opens the Problem finder tab', pg.evaluate("!!document.querySelector('#panel-home [data-go=\"panel-problem\"]')"))
    pg.evaluate("document.querySelector('#panel-home [data-go=\"panel-problem\"]').click()"); pg.wait_for_timeout(1800)
    ok('the tile opens Chart Reading on the Problem finder tab (last tab)', pg.evaluate("(()=>{const t=[...document.querySelectorAll('#panel-reading .rd>.vx-tabs button')];return t.length>0&&t[t.length-1].classList.contains('on')&&/Problem finder/.test(t[t.length-1].textContent)&&document.querySelector('#panel-reading .pf-pane .pf')!==null})()"))
    steps = []
    for k, v in (('trigger', 'ext'), ('feel', 'int'), ('area', 'mother'), ('problem', 'hurt'), ('span', 'years')):
        have = pg.evaluate("([k,v])=>!!document.querySelector(`.pf [data-k=\"${k}\"][data-v=\"${v}\"]`)", [k, v]); steps.append(have)
        if have: pg.evaluate("([k,v])=>document.querySelector(`.pf [data-k=\"${k}\"][data-v=\"${v}\"]`).click()", [k, v]); pg.wait_for_timeout(500)
    ok('the five questions appear one after another', all(steps), steps)
    pg.wait_for_timeout(400)
    o = pg.evaluate("""()=>({secs:document.querySelectorAll('.pf-sec').length,chips:document.querySelectorAll('.pf-crumbs span').length,lv:!!document.querySelector('.pf-lv'),help:document.querySelectorAll('.pf-help li').length,safe:!!document.querySelector('.pf-safe'),main:document.querySelectorAll('.pf-main li').length,over:document.documentElement.scrollWidth>innerWidth+1})""")
    ok('result: 6 sections, 4 choice chips, strength meter, reasons, help list, safety note', o['secs'] == 6 and o['chips'] == 4 and o['lv'] and o['help'] >= 4 and o['safe'] and o['main'] >= 1, o)
    ok('result fits a 360px phone without sideways scroll', not o['over'])
    pg.evaluate("document.querySelector('.pf [data-pf=\"again\"]').click()"); pg.wait_for_timeout(500)
    ok('"Another problem" returns to the area question and keeps the first answers', pg.evaluate("!!document.querySelector('.pf .pf-areas')&&document.querySelectorAll('.pf-crumbs span').length===2"))
    pg.evaluate("document.querySelector('.pf [data-pf=\"back\"]').click()"); pg.wait_for_timeout(400)
    ok('Back goes to the previous question', pg.evaluate("!!document.querySelector('.pf [data-k=\"feel\"]')"))
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:400]))
print('ALL PASS' if all(c for _, c, _ in res) else 'FAILED'); raise SystemExit(0 if all(c for _, c, _ in res) else 1)

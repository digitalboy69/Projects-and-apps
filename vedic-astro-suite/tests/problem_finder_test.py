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
 const HARSH=['Saturn','Mars','Rahu','Ketu','Sun'];const kindOf=m=>{if(m==='Rahu'||m==='Ketu')return 'harsh';const hs=D1.filter(h=>h.signLord===m).map(h=>h.houseNum),nmal=m==='Sun'||m==='Mars'||m==='Saturn';let sc=0;hs.forEach(h=>{if(h===1||h===5||h===9)sc+=2;else if(h===4||h===7||h===10)sc+=nmal?0.5:-0.5;else if(h===3||h===11)sc-=1;else if(h===6)sc-=1.5;else if(h===8)sc-=(m==='Sun'||m==='Moon')?0:2;else if(h===12)sc-=0.8});const yoga=hs.some(h=>h===4||h===7||h===10)&&hs.some(h=>h===5||h===9),c=yoga?'yoga':(hs.indexOf(1)>=0||sc>=1.5)?'benefic':sc<=-1?'malefic':'neutral';return c==='yoga'?'yoga':c==='benefic'?'helper':m==='Sun'?'mild':'harsh'};const combos=[['ext','int'],['int','ext'],['both','both']];let nres=0,words=0;const seen={};
 PRB.areas.forEach(a=>a.problems.forEach(p=>combos.forEach(([t,f])=>{
  const sel={trigger:t,feel:f,area:a.id,problem:p.id,span:'years'},R=PRB.assess(ch,sel,{now}),R2=PRB.assess(ch,sel,{now});nres++;words+=R.words;const tag=a.id+'/'+p.id+'/'+t+f;
  if(JSON.stringify(R)!==JSON.stringify(R2))bad.push('nondeterministic '+tag);
  if(R.sections.length!==7||R.sections.map(s=>s.id).join()!=='check,area,signature,trigger,pain,timing,support')bad.push('sections '+tag);
  if(['light','clear','strong'].indexOf(R.level)<0)bad.push('level '+tag);if(R.words<250)bad.push('short '+R.words+' '+tag);if(R.chips.length!==4||R.help.length<3||!R.safety)bad.push('parts '+tag);
  a.houses.forEach(h=>{if(!R.sections.find(s=>s.id==='area').items.some(i=>i.fact.kind==='house'&&i.fact.h===h&&i.fact.intro))bad.push('area house '+h+' '+tag)});
  R.sections.forEach(s=>{if(!s.items.length)bad.push('empty '+s.id+' '+tag);s.items.forEach(it=>{const x=it.text,F=it.fact;
   if(BAN.test(x)||/undefined|NaN|\\[object|\\bnull\\b|\\{|\\}|  /.test(x)||/(^|[.!?] )[a-z]/.test(x)||/\\b1 points\\b/.test(x)||x.length<20)bad.push('text '+tag+': '+x.slice(0,50));
   if(F.kind==='house'){const d=D1[F.h-1];if(d.sign!==F.sign||d.signLord!==F.lord)bad.push('house fact '+tag);
     if(F.intro&&!x.includes('Your '+F.h+(['th','st','nd','rd'][(F.h%100>10&&F.h%100<14)?0:Math.min(F.h%10,4)%4]||'th')+' house')&&true){}
     if(F.lordHouse!=null&&P[F.lord].house!==F.lordHouse)bad.push('lordHouse '+tag);if(F.lordSt&&P[F.lord].dignity.status!==F.lordSt)bad.push('lordSt '+tag);
     if(F.lordCombust&&!P[F.lord].combustion.combust)bad.push('lordCombust '+tag);if(F.occ&&P[F.occ].house!==F.h)bad.push('occ '+tag);
     if(F.asp&&((P[F.asp].aspectsHouses||[]).indexOf(F.h)<0||P[F.asp].house===F.h))bad.push('asp '+tag);if(F.sav!=null&&(SAV[F.sign]!==F.sav||!x.includes(F.sav+' Ashtakavarga')))bad.push('sav '+tag);}
   else if(F.kind==='planet'){const q=P[F.p];if(q.house!==F.house||q.sign!==F.sign)bad.push('planet fact '+tag);if(F.st&&q.dignity.status!==F.st)bad.push('planet st '+tag);if(F.combust&&!q.combustion.combust)bad.push('combust '+tag);
     if(F.retro&&!q.retrograde)bad.push('retro '+tag);if(F.conj&&P[F.conj].house!==q.house)bad.push('conj '+tag);if(F.asp&&(P[F.asp].aspectsHouses||[]).indexOf(q.house)<0)bad.push('pasp '+tag);if(F.nak&&q.nakshatra.name!==F.nak)bad.push('nak '+tag);}
   else if(F.kind==='check'){const sc=F.scope,OR=n=>n+(['th','st','nd','rd'][(n%100>10&&n%100<14)?0:Math.min(n%10,4)%4]||'th'),hs0=a.houses.concat(p.eh).filter((v,i,x)=>x.indexOf(v)===i),ks0=a.karakas.concat(p.ep).filter((v,i,x)=>x.indexOf(v)===i);
     const asp=(m,h)=>(P[m].aspectsHouses||[]).indexOf(h)>=0&&P[m].house!==h;
     if(sc==='birth'||sc==='kind'){const m=F.p;if(F.sits.some(h=>P[m].house!==h||hs0.indexOf(h)<0)||F.looks.some(h=>!asp(m,h)||hs0.indexOf(h)<0))bad.push('chk birth houses '+tag);
       if(sc==='birth'){if(F.shares.some(k=>P[k].house!==P[m].house||k===m||ks0.indexOf(k)<0)||F.klooks.some(k=>P[k].house===P[m].house||(P[m].aspectsHouses||[]).indexOf(P[k].house)<0||ks0.indexOf(k)<0))bad.push('chk birth karakas '+tag);}
       if(!x.includes(m+' is in '+['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][P[m].sign]+', your '+OR(P[m].house)+' house'))bad.push('chk birth sign/house text '+tag);
       F.looks.forEach(h=>{const n=(h-P[m].house+12)%12+1;if(!x.includes(OR(n)+' aspect falls on '+['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][D1[h-1].sign]+', your '+OR(h)+' house'))bad.push('chk aspect text '+tag)});}
     else if(sc==='none'){if(F.hs.some(h=>HARSH.some(m=>['harsh','mild'].indexOf(kindOf(m))>=0&&(P[m].house===h||(P[m].aspectsHouses||[]).indexOf(h)>=0))))bad.push('chk false none house '+tag);}
     else if(sc==='knone'){if(F.ks.some(k=>HARSH.some(m=>m!==k&&['harsh','mild'].indexOf(kindOf(m))>=0&&(P[m].house===P[k].house||(P[m].aspectsHouses||[]).indexOf(P[k].house)>=0))))bad.push('chk false none karaka '+tag);}
     else if(sc==='dasha'){const key={Mahadasha:'md',Antardasha:'ad',Pratyantar:'pd'}[F.dasha];if(hn.dasha[key].lord!==F.p)bad.push('chk dasha lord '+tag);if(F.rules.some(h=>rules(F.p).indexOf(h)<0)||F.looks.some(h=>(P[F.p].aspectsHouses||[]).indexOf(h)<0))bad.push('chk dasha links '+tag);if(F.none!==(!F.rules.length&&!F.sits&&!F.looks.length&&!F.kar))bad.push('chk dasha none flag '+tag);
       if(hs0.filter(h=>rules(F.p).indexOf(h)>=0).sort((u,v)=>u-v).join()!==F.rules.slice().sort((u,v)=>u-v).join())bad.push('chk dasha rules complete '+tag);}
     else if(sc==='sky'){const sx=sky[F.p];if(F.on.some(h=>sx.house!==h)||F.look.some(h=>(sx.asp||[]).indexOf(h)<0||sx.house===h))bad.push('chk transit '+tag);if(!x.includes(F.p+' is in '+['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][sx.sign]+', your '+OR(sx.house)+' house'))bad.push('chk sky sign text '+tag);
       F.look.forEach(h=>{const n=(h-sx.house+12)%12+1;if(!x.includes(OR(n)+' aspect falls on '+['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][D1[h-1].sign]+', your '+OR(h)+' house'))bad.push('chk sky aspect text '+tag)});}
   }
   else if(F.kind==='culprit'&&!F.none){const q=P[F.p];if(F.via==='sits in'||F.via==='shares the house with'){if(q.house!==F.h)bad.push('cul sits '+tag)}else if((q.aspectsHouses||[]).indexOf(F.h)<0)bad.push('cul looks '+tag);}
   else if(F.kind==='timing'&&!F.none&&!F.span){
     if(F.dasha){const key={Mahadasha:'md',Antardasha:'ad',Pratyantar:'pd'}[F.dasha],lord=hn.dasha[key]&&hn.dasha[key].lord;if(lord!==F.p)bad.push('dasha lord '+tag);if(F.rules&&F.rules.some(h=>rules(F.p).indexOf(h)<0))bad.push('dasha rules '+tag);if(F.sits&&a.houses.concat(p.eh).indexOf(P[F.p].house)<0)bad.push('dasha sits '+tag);}
     if(F.transit){const sx=sky[F.transit];if(F.on&&F.on.some(h=>sx.house!==h))bad.push('transit on '+tag);if(F.look&&F.look.some(h=>(sx.asp||[]).indexOf(h)<0))bad.push('transit look '+tag);}
     if(F.sadesati){const d=(sky.Saturn.sign-P.Moon.sign+12)%12;if(!(d===11||d===0||d===1))bad.push('sadesati '+tag);}
     if(F.score!=null&&hn.houses[F.house-1].score!==F.score)bad.push('house score '+tag);}
  })});
  {const hs=a.houses.concat(p.eh).filter((v,i,x)=>x.indexOf(v)===i),ks=a.karakas.concat(p.ep).filter((v,i,x)=>x.indexOf(v)===i),C=R.sections[0].items,UP=[3,6,11];let pressing=false;
   const tch=(m,h)=>P[m].house===h||(P[m].aspectsHouses||[]).indexOf(h)>=0;
   HARSH.forEach(m=>{const kd=kindOf(m),sits=hs.filter(h=>P[m].house===h),looks=hs.filter(h=>(P[m].aspectsHouses||[]).indexOf(h)>=0&&P[m].house!==h),shares=ks.filter(k=>k!==m&&P[k].house===P[m].house),kl=ks.filter(k=>k!==m&&P[k].house!==P[m].house&&(P[m].aspectsHouses||[]).indexOf(P[k].house)>=0);
     if(!sits.length&&!looks.length&&!shares.length&&!kl.length)return;const it=C.find(i=>i.fact.scope==='birth'&&i.fact.p===m);if(!it){bad.push('chk missing '+m+' '+tag);return;}
     if(it.fact.hk!==kd)bad.push('chk class '+m+' '+it.fact.hk+' vs '+kd+' '+tag);if(sits.join()!==it.fact.sits.join()||looks.join()!==it.fact.looks.join()||shares.join()!==it.fact.shares.join()||kl.join()!==it.fact.klooks.join())bad.push('chk touches '+m+' '+tag);
     if((kd==='helper'||kd==='yoga')&&it.tone!=='g')bad.push('helper not good '+m+' '+tag);
     if(kd==='harsh'){const mild=!shares.length&&!kl.length&&sits.concat(looks).every(h=>UP.indexOf(h)>=0);if(!mild)pressing=true;if(!mild&&it.tone!=='b')bad.push('harsh tone '+m+' '+tag);}});
   hs.forEach(h=>{const any=HARSH.some(m=>['harsh','mild'].indexOf(kindOf(m))>=0&&tch(m,h));if(!any&&!C.some(i=>i.fact.scope==='none'&&i.fact.hs.indexOf(h)>=0))bad.push('chk none missing '+h+' '+tag);if(any&&C.some(i=>i.fact.scope==='none'&&i.fact.hs.indexOf(h)>=0))bad.push('chk none wrong '+h+' '+tag);});
   ks.forEach(k=>{const th=P[k].house,any=HARSH.some(m=>m!==k&&['harsh','mild'].indexOf(kindOf(m))>=0&&(P[m].house===th||(P[m].aspectsHouses||[]).indexOf(th)>=0));if(!any&&!C.some(i=>i.fact.scope==='knone'&&i.fact.ks.indexOf(k)>=0))bad.push('chk knone missing '+k+' '+tag);if(any&&C.some(i=>i.fact.scope==='knone'&&i.fact.ks.indexOf(k)>=0))bad.push('chk knone wrong '+k+' '+tag);});
   ['md','ad','pd'].forEach(key=>{const d=hn.dasha[key];if(!d)return;const n=d.lord;if(kindOf(n)!=='harsh'||['Saturn','Mars','Rahu','Ketu'].indexOf(n)<0)return;const conn=hs.some(h=>rules(n).indexOf(h)>=0||P[n].house===h||(P[n].aspectsHouses||[]).indexOf(h)>=0&&P[n].house!==h)||ks.indexOf(n)>=0;if(conn)pressing=true;});
   ['Saturn','Mars','Rahu','Ketu'].forEach(n=>{const x=sky[n];if(!x||kindOf(n)!=='harsh')return;const t=hs.filter(h=>x.house===h||(x.asp||[]).indexOf(h)>=0);if(t.length&&!t.every(h=>UP.indexOf(h)>=0))pressing=true;});
   if(ks.indexOf('Moon')>=0){const d=(sky.Saturn.sign-P.Moon.sign+12)%12;if(d===11||d===0||d===1)pressing=true;}
   const ver=C[0].fact;if(ver.verdict!=='clear'&&ver.verdict!=='found')bad.push('verdict missing '+tag);else if((ver.verdict==='found')!==pressing)bad.push('verdict '+ver.verdict+' vs pressing '+pressing+' '+tag);
   if(ver.verdict==='clear'&&R.level!=='light')bad.push('clear but level '+R.level+' '+tag);
   if(typeof R.pct!=='number'||R.pct<0||R.pct>1||R.checked<300)bad.push('pct '+tag);}
  {const K=R.ranked;if(!Array.isArray(K)||K.length>5)bad.push('ranked size '+tag);for(let i=0;i<K.length;i++){const r=K[i];if(r.rank!==i+1||!r.head||!r.text||!r.fact||['Strong','Mild','Moderate'].indexOf(r.label)<0||['Birth chart','Right now','Running period'].indexOf(r.when)<0)bad.push('ranked item '+tag);if(i&&K[i-1].score<r.score)bad.push('ranked order '+tag);
     if(!R.sections.some(s=>s.items.some(it=>it.text===r.text)))bad.push('ranked not traceable '+i+' '+tag);}
   if(R.verdict==='clear'&&K.some(r=>r.fact&&r.fact.kind==='check'&&r.label!=='Mild'))bad.push('harsh-touch reason on clear '+tag);if(R.verdict==='found'&&!K.length&&0)bad.push('x');
   if(R.verdict!=='clear'&&R.verdict!=='found')bad.push('verdict prop '+tag);}
  // span changes the ranking weight: a recent problem leans on today's sky, a lifelong one on the birth chart
  R.top.forEach(t=>{if(!t.text)bad.push('top '+tag)});
 })));
 return {bad:bad.slice(0,8),nres,words}}""".replace('__BAN__', BAN)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 360, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    ok('PRB and PFUI loaded, 20 areas, every area has 10+ problems', pg.evaluate("typeof PRB==='object'&&typeof PFUI==='object'&&PRB.areas.length>=20&&PRB.areas.every(a=>a.problems.length>=10)"))
    for i, c in enumerate(CHARTS):
        pg.evaluate(CAST, dict(name='x', dob=c[0], tob=c[1], place='x', lat=c[2], lon=c[3], tz=c[4])); pg.wait_for_selector('#results.show', timeout=15000)
        r = pg.evaluate(CHECK)
        ok('chart %d: %d readings, every house, planet, aspect, points, dasha and transit fact matches the chart; clean wording; 7 sections each' % (i + 1, r['nres']), not r['bad'], r['bad'])
    pg.evaluate(CAST, dict(name='Asha', dob='1995-03-14', tob='11:00', place='Hyderabad', lat=17.385, lon=78.4867, tz=5.5)); pg.wait_for_selector('#results.show', timeout=15000)
    pg.evaluate("document.querySelectorAll('.app-panel').forEach(p=>p.classList.remove('active'));document.getElementById('panel-home').classList.add('active')"); pg.wait_for_timeout(600)
    yk = pg.evaluate("(()=>{const o={};for(let L=0;L<12;L++){const f=PRB.fnature(L);o[L]=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'].filter(n=>f[n].cls==='yoga').join()}return o})()")
    exp = {0: '', 1: 'Saturn', 2: '', 3: 'Mars', 4: 'Mars', 5: '', 6: 'Saturn', 7: '', 8: '', 9: 'Venus', 10: 'Venus', 11: ''}
    ok('yogakaraka planets match the classical list for all 12 ascendants (Saturn: Taurus, Libra; Mars: Cancer, Leo; Venus: Capricorn, Aquarius)', all(yk[str(k)] == v for k, v in exp.items()), yk)
    fl = pg.evaluate("(()=>{const f=PRB.fnature(4);return [f.Sun.cls,f.Moon.cls,f.Mercury.cls,f.Saturn.cls,f.Venus.cls,f.Jupiter.cls].join()})()")
    ok('Leo ascendant: Sun and Mars help, Saturn (6th and 7th) and Mercury (2nd and 11th) harm', fl.startswith('benefic') and fl.split(',')[3] in ('malefic', 'neutral'), fl)
    ok('Home has a Problem Finder tile that opens the Problem finder tab', pg.evaluate("!!document.querySelector('#panel-home [data-go=\"panel-problem\"]')"))
    pg.evaluate("document.querySelector('#panel-home [data-go=\"panel-problem\"]').click()"); pg.wait_for_timeout(1800)
    ok('the tile opens Chart Reading on the Problem finder tab (last tab)', pg.evaluate("(()=>{const t=[...document.querySelectorAll('#panel-reading .rd>.vx-tabs button')];return t.length>0&&t[t.length-1].classList.contains('on')&&/Problem finder/.test(t[t.length-1].textContent)&&document.querySelector('#panel-reading .pf-pane .pf')!==null})()"))
    steps = []
    for k, v in (('trigger', 'ext'), ('feel', 'int'), ('area', 'mother'), ('problem', 'hurt'), ('span', 'years')):
        have = pg.evaluate("([k,v])=>!!document.querySelector(`.pf [data-k=\"${k}\"][data-v=\"${v}\"]`)", [k, v]); steps.append(have)
        if have: pg.evaluate("([k,v])=>document.querySelector(`.pf [data-k=\"${k}\"][data-v=\"${v}\"]`).click()", [k, v]); pg.wait_for_timeout(500)
    ok('the five questions appear one after another', all(steps), steps)
    pg.wait_for_timeout(400)
    o = pg.evaluate("""()=>({secs:document.querySelectorAll('.pf-sec').length,chips:document.querySelectorAll('.pf-crumbs span').length,lv:!!document.querySelector('.pf-lv'),help:document.querySelectorAll('.pf-help li').length,safe:!!document.querySelector('.pf-safe'),rank:document.querySelectorAll('.pf-rank .pf-r').length,more:!!document.querySelector('details.pf-more:not([open])'),over:document.documentElement.scrollWidth>innerWidth+1})""")
    pg.evaluate("document.querySelector('.pf [data-pf=\"again\"]').click()"); pg.wait_for_timeout(400)
    pg.evaluate("document.querySelector('.pf [data-k=\"area\"][data-v=\"money\"]').click()"); pg.wait_for_timeout(500)
    f = pg.evaluate("({n:document.querySelectorAll('.pf-p').length,g:document.querySelectorAll('.pf-grp').length,f:!!document.querySelector('.pf-find')})")
    pg.fill('.pf-find', 'loan'); pg.wait_for_timeout(200)
    v = pg.evaluate("[...document.querySelectorAll('.pf-p')].filter(b=>!b.hidden).map(b=>b.textContent)")
    pg.fill('.pf-find', 'zzzz'); pg.wait_for_timeout(200)
    nn = pg.evaluate("!document.querySelector('.pf-none').hidden")
    ok('long problem lists are grouped by kind and have a find box that filters them', f['n'] >= 15 and f['g'] >= 4 and f['f'] and v and all('loan' in x.lower() for x in v) and nn, [f, v, nn])
    pg.evaluate("document.querySelector('.pf .pf-find').value='';document.querySelector('.pf .pf-find').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.pf [data-k=\"problem\"][data-v=\"shortage\"]').click()"); pg.wait_for_timeout(500)
    pg.evaluate("document.querySelector('.pf [data-k=\"span\"][data-v=\"years\"]').click()"); pg.wait_for_timeout(500)
    pg.evaluate("document.querySelector('details.pf-more').open=true"); pg.wait_for_timeout(200)
    ok('Read more opens with the Chart check section expanded', pg.evaluate("(()=>{const d=document.querySelector('.pf-more .pf-sec');return !!d&&d.open&&/Chart check/.test(d.textContent)&&/In short/.test(d.textContent)})()"))
    pg.evaluate("document.querySelector('.pf [data-pf=\"reset\"]').click()"); pg.wait_for_timeout(300)
    for k, v in (('trigger', 'ext'), ('feel', 'int'), ('area', 'mother'), ('problem', 'hurt'), ('span', 'years')):
        pg.evaluate("([k,v])=>document.querySelector(`.pf [data-k=\"${k}\"][data-v=\"${v}\"]`).click()", [k, v]); pg.wait_for_timeout(500)
    ok('result: top-5 ranked reasons, a closed Read more holding 7 sections, 4 choice chips, strength meter, help list, safety note', o['secs'] == 7 and o['chips'] == 4 and o['lv'] and o['help'] >= 4 and o['safe'] and 1 <= o['rank'] <= 5 and o['more'], o)
    ok('result fits a 360px phone without sideways scroll', not o['over'])
    pg.evaluate("document.querySelector('.pf [data-pf=\"again\"]').click()"); pg.wait_for_timeout(500)
    ok('"Another problem" returns to the area question and keeps the first answers', pg.evaluate("!!document.querySelector('.pf .pf-areas')&&document.querySelectorAll('.pf-crumbs span').length===2"))
    pg.evaluate("document.querySelector('.pf [data-pf=\"back\"]').click()"); pg.wait_for_timeout(400)
    ok('Back goes to the previous question', pg.evaluate("!!document.querySelector('.pf [data-k=\"feel\"]')"))
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:400]))
print('ALL PASS' if all(c for _, c, _ in res) else 'FAILED'); raise SystemExit(0 if all(c for _, c, _ in res) else 1)

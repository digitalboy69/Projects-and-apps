# Test of the Manifestation layer (js/90-reading-manifest.js, global VMF): "how it shows up in real life", personal, second person.
# Run: python3 tests/manifest_test.py   (CHROMIUM=/path/to/chrome if not at the default)
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
    ok('VMF loaded', pg.evaluate("typeof VMF==='object'&&VMF!==null&&typeof VMF_DATA==='object'"))
    # ---- data shape ----
    s = pg.evaluate("""()=>{const D=VMF.data;return {planets:Object.keys(D.behave).length===9&&Object.values(D.behave).every(x=>x.does.length===4&&x.atBest&&x.underStress&&x.others&&x.inside),
      arena:D.arena.length===12&&D.arena.every(a=>a.theme&&a.scenes.length===4),manner:D.manner.length===12,rising:D.rising.length===12&&D.rising.every(r=>r.first&&r.body&&r.reaction&&r.described&&r.arc)}}""")
    ok('tables complete: 9 planets x 4 habits, 12 arenas x 4 scenes, 12 manners, 12 rising profiles', all(s.values()), s)
    # ---- all 1296 combinations ----
    q = pg.evaluate("""()=>{const T=[],K=new Set(),bad=[],BAN=/\\b(always|never|certainly|definitely|guaranteed|doomed|destined|fatal|cursed|will die|death|you will)\\b/i;let n=0;
      VMF.each(x=>{n++;if(!x||!x.text){bad.push('empty');return;}T.push(x.text);K.add(x.key);
        if(/undefined|NaN|\\[object|\\{|\\}|null|\\byou you\\b|  /.test(x.text))bad.push('placeholder/dup '+x.key);if(BAN.test(x.text))bad.push('absolute '+x.key);
        if(x.practice.length!==3||new Set(x.practice.map(y=>y.scene)).size!==3||new Set(x.practice.map(y=>y.does)).size!==3)bad.push('pairs '+x.key);
        if(!x.practice.every(y=>/^[A-Z].*, (you tend to|you often|it is common for you to) [a-z]/.test(y.line)&&/\\.$/.test(y.line)))bad.push('grammar '+x.key);
        if(x.reflect.length!==2||!x.reflect.every(r=>/\\?$/.test(r)))bad.push('reflect '+x.key);if(!/\\byou\\b/i.test(x.text)||/\\b(the person|the native|he|she|they) (is|tends|has|may|can|will)\\b/i.test(x.text))bad.push('voice '+x.key);});
      const lg=[];for(let i=0;i<12;i++){const g=VMF.lagna(i);if(!g||!g.text||BAN.test(g.text)||/undefined|NaN/.test(g.text))lg.push(i);}
      return {n,keys:K.size,uniq:new Set(T).size,bad:bad.slice(0,6),lagnaBad:lg,lagnaUniq:new Set([...Array(12).keys()].map(i=>VMF.lagna(i).text)).size}}""")
    ok('1296 combinations (9 planets x 12 houses x 12 signs): unique keys + texts; 3 different scenes and habits each; grammar, voice (you), questions, no absolute words', q['n'] == 1296 and q['keys'] == 1296 and q['uniq'] == 1296 and not q['bad'], q)
    ok('12 rising-sign profiles clean and different', not q['lagnaBad'] and q['lagnaUniq'] == 12, q)
    # ---- S2b: role by rising sign (84) + Moon-sign profiles (12) ----
    r = pg.evaluate("""()=>{const BAN=/\\b(always|never|certainly|definitely|guaranteed|doomed|destined|fatal|cursed|will die|death|you will)\\b/i,PL7=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'],bad=[],T=new Set();let n=0;
      for(let a=0;a<12;a++){const F=VDB.functionalNature(a);PL7.forEach(p=>{const x=VMF.role(p,a);n++;if(!x||!x.text){bad.push('empty '+p+a);return;}T.add(x.text);
        if(x.kind!==F[p].kind||JSON.stringify(x.rules)!==JSON.stringify(F[p].rules))bad.push('engine mismatch '+p+a);
        if(/undefined|NaN|\\[object|null|  /.test(x.text)||BAN.test(x.text))bad.push('text '+p+a);if(!/\\?$/.test(x.reflect))bad.push('reflect '+p+a);});}
      const mp=[];for(let i=0;i<12;i++){const m=VMF.moonProfile(i);if(!m||!m.text||BAN.test(m.text)||/undefined|NaN/.test(m.text)||!/\\?$/.test(m.reflect)||!/\\byou\\b/i.test(m.text))mp.push(i);}
      return {n,uniq:T.size,bad:bad.slice(0,6),nodes:VMF.role('Rahu',0)===null&&VMF.role('Ketu',5)===null,mp,mpUniq:new Set([...Array(12).keys()].map(i=>VMF.moonProfile(i).text)).size,badIn:VMF.role('Sun',12)===null&&VMF.moonProfile(-1)===null}}""")
    ok('S2b: 84 roles (7 planets x 12 rising signs) match the engine kind and houses, clean, unique; nodes return null; 12 Moon-sign profiles clean and different', r['n'] == 84 and r['uniq'] == 84 and not r['bad'] and r['nodes'] and not r['mp'] and r['mpUniq'] == 12 and r['badIn'], r)
    v = pg.evaluate("""()=>{const a=VMF.placement('Mars',7,0),b=VMF.placement('Mars',7,1),c=VMF.placement('Saturn',7,0),d=VMF.placement('Mars',10,0),o={};
      o.signChanges=a.text!==b.text;o.planetChanges=a.text!==c.text;o.houseChanges=JSON.stringify(a.practice.map(x=>x.scene))!==JSON.stringify(d.practice.map(x=>x.scene));
      o.scene7=VMF.data.arena[6].scenes.includes(a.practice[0].scene);o.cueS=VMF.placement('Mars',1,9,'Exalted').cue.includes('comfortable');o.cueW=VMF.placement('Mars',1,3,'Debilitated').cue.includes('strain');o.cueN=VMF.placement('Mars',1,3,'Neutral').cue==='';
      o.bad=[VMF.placement('Pluto',1,1),VMF.placement('Sun',0,1),VMF.placement('Sun',13,1),VMF.placement('Sun',1,12),VMF.lagna(12)].every(x=>x===null);return o}""")
    ok('house changes the scenes, planet changes the habits, sign changes the style; dignity cue works; bad input returns null', all(v.values()), v)
    # ---- real charts: signature + placements use the chart's real data ----
    bad = []
    for d, t, la, lo, tz in CHARTS:
        pg.evaluate(CAST, dict(name='x', dob=d, tob=t, place='x', lat=la, lon=lo, tz=tz)); pg.wait_for_selector('#results.show', timeout=15000)
        o = pg.evaluate("""()=>{const c=currentChartForModal,S=VMF.signature(c),SIGN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'],bad=[];
          const ord=n=>n+(['th','st','nd','rd'][(n%100>10&&n%100<14)?0:Math.min(n%10,4)%4]||'th');
          if(S.items.length<4||S.items.length>7)bad.push('items '+S.items.length);S.items.forEach(x=>{if(!x.title||!x.text||/undefined|NaN/.test(x.text))bad.push('item '+x.title);});
          const titles=S.items.map(x=>x.title);['How you come across','Your inner weather','What drives you','Your life direction'].forEach(t=>{if(!titles.includes(t))bad.push('missing '+t)});
          const lg=VMF.lagna(c.ascendant.sign);if(!S.items[0].text.includes(lg.first)||!S.items[0].text.includes(lg.described))bad.push('rising item');
          const su=c.planets.Sun;if(!S.items.find(x=>x.title==='What drives you').text.includes('Sun is in '+SIGN[su.sign]+' in the '+ord(su.house)+' house'))bad.push('sun item');
          const arc=VMF.lagnaArc(c),lord=VDB.data.signs[c.ascendant.sign].lord;if(arc.lord!==lord||arc.house!==c.planets[lord].house)bad.push('lagna arc');
          const st=['Exalted','OwnSign'],weak=['Debilitated'];const strong=Object.keys(c.planets).filter(n=>st.some(x=>(c.planets[n].dignity.status||'').includes(x))).slice(0,2),wk=Object.keys(c.planets).filter(n=>weak.some(x=>(c.planets[n].dignity.status||'').includes(x))).slice(0,2);
          const si=S.items.find(x=>x.title==='Where you are strongly supported'),wi=S.items.find(x=>x.title==='Where you may need extra care');
          if(!!si!==!!strong.length||(si&&!strong.every(n=>si.text.includes(n+' is strongly placed'))))bad.push('strong set');if(!!wi!==!!wk.length||(wi&&!wk.every(n=>wi.text.includes(n+' sits in a weaker sign'))))bad.push('weak set');
          Object.keys(c.planets).forEach(n=>{const e=c.planets[n],m=VMF.placement(n,e.house,e.sign,e.dignity.status);if(!m||m.headline!==n+' in the '+ord(e.house)+' house in '+SIGN[e.sign])bad.push(n+' headline');});
          return bad.slice(0,5)}""")
        if o: bad.append((d, o))
    ok('8 real charts: signature has 4-7 items, rising/Sun/Lagna-lord lines match the chart, strong/weak planets match the real dignity, all 9 headlines use the real house and sign', not bad, bad[:2])
    # ---- on screen (last chart cast) ----
    s2 = pg.evaluate("""()=>{const c=currentChartForModal,rd=document.querySelector('#panel-reading .rd'),panes=[...rd.querySelectorAll(':scope>.vx-pane:not(.hn-pane)')],norm=s=>s.replace(/\\s+/g,' '),bad=[];
      const deep=norm(panes[5].textContent),cards=[...panes[2].querySelectorAll('details.vx-pl')].map(d=>norm(d.textContent)),S=VMF.signature(c);
      if(!deep.includes('Your signature at a glance'))bad.push('signature title');S.items.forEach(x=>{if(!deep.includes(norm(x.text)))bad.push('sig '+x.title)});
      Object.keys(c.planets).forEach((n,i)=>{const e=c.planets[n],m=VMF.placement(n,e.house,e.sign,e.dignity.status);if(!cards[i].includes('In real life: '+m.headline))bad.push(n+' headline');
        m.practice.forEach(x=>{if(!cards[i].includes(norm(x.line)))bad.push(n+' line')});m.reflect.forEach(r=>{if(!cards[i].includes(norm(r)))bad.push(n+' question')});
        if(!cards[i].includes('Check this against your life'))bad.push(n+' check');if(!cards[i].includes('In everyday life, you may'))bad.push(n+' nak scene');});
      const sf=VMF.moonProfile(c.planets.Moon.sign);if(!deep.includes(norm(sf.text)))bad.push('moon profile');if(!deep.includes("What each planet's role means for you"))bad.push('roles block');
      const rr=VMF.role('Saturn',c.ascendant.sign);if(!deep.includes(norm(rr.gives)))bad.push('role text');
      const rep=buildFullReportText(c,currentProfileForExport,{}).replace(/\\s+/g,' ');
      ['YOUR SIGNATURE AT A GLANCE','In real life:','Check this against your life:','Your Moon in more detail:','Saturn as '].forEach(k=>{if(!rep.includes(k))bad.push('report '+k)});
      return {bad:bad.slice(0,6),overflow:document.documentElement.scrollWidth>window.innerWidth+1}}""")
    ok('on screen + in the report: signature at the top of Deep reading; every planet card has the "In real life" block with its 3 lines, self-check questions and the nakshatra scene', not s2['bad'], s2['bad'])
    ok('phone: no horizontal scroll', not s2['overflow'])
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:300]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

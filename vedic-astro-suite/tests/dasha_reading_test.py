# Test of the Dasha layer (js/91-dasha-reading.js, VDA): dates/lords come from the app's own engine; texts are clean; screens show them.
# Run: python3 tests/dasha_reading_test.py   (CHROMIUM=/path/to/chrome if not at the default)
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
          ('1947-08-15', '00:00', 28.61, 77.21, 5.5), ('1988-12-21', '03:15', 64.15, -21.94, 0), ('1975-06-30', '23:50', -0.18, -78.47, -5), ('1930-08-30', '15:00', 41.26, -95.93, -6)]
CHECK = """()=>{const c=currentChartForModal,M=c.dashaData.mahadashas,now=new Date(),bad=[],BAN=/\\b(always|never|certainly|definitely|guaranteed|doomed|destined|fatal|cursed|will die|death|you will)\\b/i,BAD=/undefined|NaN|\\[object|\\{|\\}|null|  /;
  const T=VDA.timeline(c,now);if(T.periods.length!==M.length)bad.push('count');
  T.periods.forEach((p,i)=>{if(p.lord!==M[i].lord||p.start.getTime()!==M[i].startDate.getTime()||p.end.getTime()!==M[i].endDate.getTime())bad.push('md '+i);
    if(BAD.test(p.text)||BAN.test(p.text)||typeof p.ease!=='number'||!['supportive','mixed','challenging'].includes(p.tone)||p.scenes.length!==2||!/[?.]$/.test(p.reflect))bad.push('text '+i);
    if(p.house!==c.planets[p.lord].house)bad.push('house '+i);
    const ads=VDA.antardashas(c,i,now),ref=calculateAntardashas(M[i]);if(ads.length!==ref.length||ads.length<1||ads.some((r,k)=>r.lord!==ref[k].lord||r.start.getTime()!==ref[k].startDate.getTime()||r.end.getTime()!==ref[k].endDate.getTime()))bad.push('ad '+i);
    ads.forEach(r=>{if(BAD.test(r.blend+r.houseNote+r.scene)||BAN.test(r.blend+r.houseNote)||typeof r.ease!=='number')bad.push('adtext '+i)});});
  const birth=new Date((c.julianDay-2440587.5)*864e5);if(Math.abs(T.birth-birth)>2*864e5)bad.push('birth');
  const act=findActiveDasha(M,now),cur=VDA.current(c,now),up=VDA.upcoming(c,5,now);
  if(act&&act.mahadasha){if(!cur||cur.md.lord!==act.mahadasha.lord||cur.ad.lord!==act.antardasha.lord||T.periods[T.currentIndex].lord!==act.mahadasha.lord)bad.push('current');
    const lim=Math.min(now.getTime()+5*365.2425*864e5-864e5*40,M[M.length-1].endDate.getTime()-2*864e5);if(!up.length||up[0].start>now||up[up.length-1].end.getTime()<lim)bad.push('upcoming window');}
  else if(cur!==null||T.currentIndex!==-1||up.length!==0)bad.push('past the cycle should have no running period');
  for(let k=1;k<up.length;k++)if(Math.abs(up[k].start-up[k-1].end)>2*864e5)bad.push('gap '+k);
  return {bad:bad.slice(0,5),n:M.length,up:up.length}}"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    ok('VDA loaded', pg.evaluate("typeof VDA==='object'&&VDA!==null&&typeof VDA_DATA==='object'"))
    q = pg.evaluate("""()=>{const P=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'],T=new Set(),bad=[];let n=0;
      P.forEach(a=>P.forEach(b=>{const x=VDA.pair(a,b);n++;if(!x||!x.text||/undefined|NaN/.test(x.text)||/\\b(always|never|destined|doomed)\\b/i.test(x.text))bad.push(a+b);T.add(x.text)}));
      const r=VDA.pair('Sun','Sun').relation+VDA.pair('Sun','Moon').relation+VDA.pair('Sun','Saturn').relation+VDA.pair('Sun','Mercury').relation;return {n,u:T.size,bad,r}}""")
    ok('81 main-lord x sub-lord blends unique and clean; relations own/friend/enemy/neutral correct', q['n'] == 81 and q['u'] == 81 and not q['bad'] and q['r'] == 'ownfriendenemyneutral', q)
    bad = []
    for d, t, la, lo, tz in CHARTS:
        pg.evaluate(CAST, dict(name='x', dob=d, tob=t, place='x', lat=la, lon=lo, tz=tz)); pg.wait_for_selector('#results.show', timeout=15000)
        o = pg.evaluate(CHECK)
        if o['bad']: bad.append((d, o['bad']))
    ok('8 real charts: every Mahadasha and all 9 Antardashas match the app\'s own dasha engine (lords, exact dates), birth date matches, current period equals findActiveDasha, 5-year window is gap-free, texts clean', not bad, bad[:2])
    s = pg.evaluate("""()=>{const c=currentChartForModal,rd=document.querySelector('#panel-reading .rd'),panes=[...rd.querySelectorAll(':scope>.vx-pane')],norm=s=>s.replace(/\\s+/g,' '),bad=[];
      const deep=norm(panes[5].textContent),T=VDA.timeline(c),cur=VDA.current(c),up=VDA.upcoming(c,5),now=norm(panes[3].textContent);
      const tl=[...panes[5].querySelectorAll('details.vx-pl')].slice(0,T.periods.length);
      if(!deep.includes('Life timeline')||!deep.includes('Next 5 years'))bad.push('headings');if(tl.length!==T.periods.length)bad.push('cards');
      T.periods.forEach((p,i)=>{if(!norm(tl[i].textContent).includes(p.lord+' Mahadasha: '+p.startYear+' to '+p.endYear))bad.push('card '+i)});
      if(!tl[T.currentIndex].open||!tl[T.currentIndex].textContent.includes('now'))bad.push('current open');
      if(!now.includes(norm(cur.md.arenaText))||!now.includes(norm(cur.ad.blend)))bad.push('now tab');
      if(!deep.includes(norm(up[0].blend)))bad.push('upcoming row');
      const rep=buildFullReportText(c,currentProfileForExport,{}).replace(/\\s+/g,' ');
      ['LIFE TIMELINE (Vimshottari dasha)','NEXT 5 YEARS, SUB-PERIOD BY SUB-PERIOD'].forEach(k=>{if(!rep.includes(k))bad.push('report '+k)});T.periods.forEach((p,i)=>{if(!rep.includes(norm(p.text)))bad.push('report period '+i)});
      return {bad:bad.slice(0,5),overflow:document.documentElement.scrollWidth>window.innerWidth+1}}""")
    ok('on screen + report: life timeline card per Mahadasha (current one open, marked now), next-5-years rows, Now tab shows the running Mahadasha and Antardasha, report has every period', not s['bad'], s['bad'])
    ok('phone: no horizontal scroll', not s['overflow']); ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:300]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

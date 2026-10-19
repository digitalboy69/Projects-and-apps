# Test of the Year Timeline File (js/90-92) in the real Birth Chart app. Run: python3 tests/year_timeline_test.py
# Checks: events sorted + unique ids, known slow-planet ingress dates (Saturn -> Aries Jun 2027, Rahu -> Capricorn Dec 2026),
# dasha changes match the dasha engine, every cited ID exists, panel works (copy/download buttons), file size.
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
OBAMA = dict(name='Barack Obama', dob='1961-08-04', tob='19:24', place='Honolulu', lat=21.3069, lon=-157.8583, tz=-10)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    pg = b.new_page(viewport={'width': 400, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate(CAST, OBAMA); pg.wait_for_selector('#results.show', timeout=15000)
    r = pg.evaluate("""()=>{const c=currentChartForModal,P=currentProfileForExport,tz=c.tzOffsetHours;
      const s=toJulianDay(2026,10,19,0,0,0)-tz/24,e=toJulianDay(2027,10,19,0,0,0)-tz/24;
      const t0=performance.now();const R=YT.scan(c,P,{startJD:s,endJD:e});const t1=performance.now();const W=YTW.write(c,P,R);
      const ids=R.events.map(x=>x.id);const sorted=R.events.every((x,i)=>i==0||x.jd>=R.events[i-1].jd);
      const ing=(pl,to)=>R.events.filter(x=>x.type=='INGRESS'&&x.planet==pl&&x.to==to).map(x=>jdToLocalParts(x.jd,0).dateStr);
      const dc=R.events.filter(x=>x.type=='DASHA-CHANGE');
      const cited=[...W.text.matchAll(/\\bE\\d{3}\\b/g)].map(m=>m[0]);
      return {n:R.events.length,uniq:new Set(ids).size==ids.length,sorted,satAries:ing('Saturn',0),rahuCap:ing('Rahu',9),dasha:dc.map(x=>x.level+' '+x.to.join('/')+' '+jdToLocalParts(x.jd,tz).dateStr),
        missing:cited.filter(x=>!ids.includes(x)).length,tokens:W.tokens,counts:R.counts,ms:Math.round(t1-t0),warn:R.warnings,text:W.text,
        nanFree:!/NaN|undefined|\\[object/.test(W.text)}}""")
    ok('events unique ids', r['uniq']); ok('events in time order', r['sorted'])
    ok('Saturn enters Aries Jun 2027', any(d.startswith('2027-06') for d in r['satAries']), r['satAries'])
    ok('Rahu enters Capricorn Dec 2026', any(d.startswith('2026-12') for d in r['rahuCap']), r['rahuCap'])
    ok('cited ids all exist', r['missing'] == 0); ok('no NaN/undefined in file', r['nanFree'])
    ok('size under 40k tokens', r['tokens'] < 40000, r['tokens']); ok('scan fast (<8s)', r['ms'] < 8000, str(r['ms']) + ' ms')
    print('counts', r['counts'], 'tokens', r['tokens'], 'ms', r['ms']); print('dasha', r['dasha']); print('warn', r['warn'])
    open(os.environ.get('YT_OUT', '/tmp/yt_sample.md'), 'w').write(r['text'])
    # panel
    pg.evaluate("()=>{document.querySelectorAll('.app-panel').forEach(x=>x.classList.remove('active'));const p=document.getElementById('panel-yeartimeline');p.classList.add('active');p.style.display='block'}")
    pg.click('#ytGo'); pg.wait_for_selector('#ytCopy', timeout=20000)
    ok('panel makes file + buttons', pg.evaluate("()=>!!document.getElementById('ytDl')&&document.querySelector('.yt-pre').textContent.length>5000"))
    ok('panel fits 400px (no sideways scroll)', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"))
    ok('no page errors', not errs, errs[:2])
    b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, d if (not c or d) else '')
raise SystemExit(0 if all(c for _, c, _ in res) else 1)

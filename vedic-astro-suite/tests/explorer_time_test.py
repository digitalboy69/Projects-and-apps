# Aspect Explorer must follow the time selected in the app, not the birth time of the loaded profile. Run: THREE_JS=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/explorer_time_test.py
import os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__)); from _helpers import PAGE, is_local
THREE = open(os.environ['THREE_JS'], 'rb').read()
def route(r):
    u = r.request.url
    if 'three.min.js' in u: return r.fulfill(status=200, content_type='application/javascript', body=THREE)
    return r.continue_() if is_local(u) else r.abort()
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 390, 'height': 800}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', route); pg.goto(PAGE + '#sky'); pg.wait_for_timeout(6000)
    f = [x for x in pg.frames if x != pg.main_frame and x.evaluate("typeof getExplorerContext")=='function'][0]
    r = f.evaluate("""()=>{
      activeNatalProfile={name:'T',dob:'1990-01-15',tob:'06:30',tz:5.5,lat:19.07,lon:72.87};
      currentJD=toJulianDay(2026,10,26,12,0,0);
      const sel=document.getElementById('explorerTargetSelect');
      const ex=getExplorerContext(), nat=getChartContext();
      const same=Math.abs(ex.sidereal.Sun-snapshotPositions(currentJD).sidereal.Sun)<1e-6;
      const differs=Math.abs(ex.sidereal.Sun-nat.sidereal.Sun)>10;
      const mode=document.querySelector('#explorerModeToggle .cam-mode-btn[data-mode=planet]'); if(mode) mode.click();
      renderExplorer(getExplorerContext()); explorerTarget='Sun'; renderExplorerResult();
      const txt=document.getElementById('explorerResult').innerText;
      return {same,differs,txt:txt.slice(0,200),sign:SIGNS[getSignIndex(ex.sidereal.Sun)].name,natSign:SIGNS[getSignIndex(nat.sidereal.Sun)].name};
    }""")
    ok('explorer uses selected time', r['same'] and r['differs'], r)
    ok('result shows selected-time sign', ('Currently in' in r['txt']) and r['sign'] in r['txt'] and r['natSign'] not in r['txt'].split('Showing')[0], r)
    ok('note about the time', 'Showing the sky on' in r['txt'], r['txt'])
    ok('no page errors', not errs, errs[:2]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)
sys.exit(0 if all(c for _, c, _ in res) else 1)

# Rising view Navamsha: current Navamsha line, tap a sign -> 9 Navamshas with times, back button (3D app).
# Run: THREE_JS=/path/three.min.js PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/rising_navamsha_test.py   (VAX_TARGET=hosted for the folder version)
import os, sys, json
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
    f = [x for x in pg.frames if x != pg.main_frame and x.evaluate("typeof openRising")=='function'][0]
    f.evaluate("()=>openRising()"); f.wait_for_timeout(500)
    ok('Navamsha now line shows', f.evaluate("()=>!!document.querySelector('#risingBody .rs-nav')"))
    ok('12 tappable signs', f.evaluate("()=>document.querySelectorAll('#risingBody [data-rs-sign]').length")==12)
    r = f.evaluate("""()=>{const out=[];for(let i=0;i<12;i++){risingSel=i;renderRising(true);const rows=document.querySelectorAll('#risingBody .rs-row');const t=[...rows].map(x=>x.querySelector('.tm').textContent);
      const names=[...rows].map(x=>x.querySelector('.nm').textContent.replace('NOW','').trim());out.push({i,n:rows.length,first:names[0],last:names[8],t0:t[0],t8:t[8]});}risingSel=null;renderRising(true);return out}""")
    ok('each of 12 signs lists 9 Navamshas', all(x['n']==9 for x in r), r[:2])
    # Scorpio (7): first Navamsha Cancer, last Pisces; Aries (0): Aries..Sagittarius; Gemini (2): Libra..Gemini
    ok('Scorpio starts Cancer ends Pisces', r[7]['first'].endswith('Cancer') and r[7]['last'].endswith('Pisces'), r[7])
    ok('Aries starts Aries ends Sagittarius', r[0]['first'].endswith('Aries') and r[0]['last'].endswith('Sagittarius'), r[0])
    ok('Gemini starts Libra ends Gemini', r[2]['first'].endswith('Libra') and r[2]['last'].endswith('Gemini'), r[2])
    # times: consecutive, first = sign start, nine parts add up to the sign length
    c = f.evaluate("""()=>{const L=getLiveLoc(),snap=A.snap||snapshotPositions(currentJD),rows=riseTimeline(snap.jd,L),res=[];rows.forEach(r=>{const b=_navBounds(r,L);let inc=true;for(let k=1;k<b.length;k++)if(!(b[k]>b[k-1]))inc=false;
      const mid=_navBounds(r,L);const lonAt=jd=>siderealAscendant(jd,L.lat,L.lon);const err=Math.max(...[1,4,8].map(n=>Math.abs(((lonAt(b[n])-(r.i*30+n*10/3)+540)%360)-180)));res.push({inc,err});});return res}""")
    ok('Navamsha times increase for all 12 signs', all(x['inc'] for x in c))
    ok('boundary degrees accurate (<0.001 deg)', all(x['err']<0.001 for x in c), max(x['err'] for x in c))
    # tap flow + back
    f.evaluate("()=>document.querySelector('#risingBody [data-rs-sign]').click()"); f.wait_for_timeout(300)
    ok('tap opens Navamsha view', f.evaluate("()=>!!document.querySelector('#risingBody .rs-back')&&document.querySelectorAll('#risingBody .rs-row').length==9"))
    ok('current Navamsha highlighted', f.evaluate("()=>document.querySelectorAll('#risingBody .rs-row.now').length")==1)
    f.evaluate("()=>document.querySelector('#risingBody [data-rs-back]').click()"); f.wait_for_timeout(300)
    ok('back returns to 12 signs', f.evaluate("()=>document.querySelectorAll('#risingBody [data-rs-sign]').length")==12)
    ok('no page errors', not errs, errs[:2]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)
raise SystemExit(0 if all(c for _, c, _ in res) else 1)

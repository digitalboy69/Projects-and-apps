# 3D date picker (js/49-time-machine.js): five snap wheels, steppers, typed date, year scrub. Run: THREE_JS=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/time_wheels_test.py
import os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__)); from _helpers import PAGE, is_local
THREE = open(os.environ['THREE_JS'], 'rb').read(); SP = os.environ.get('SP')
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
    f = [x for x in pg.frames if x != pg.main_frame and x.evaluate("typeof openTimeMachine")=='function'][0]
    f.evaluate("()=>openTimeMachine()"); f.wait_for_timeout(2500)
    f.wait_for_timeout(1500)
    if SP: pg.screenshot(path=SP + '/tm_wheels.png')
    ok('5 wheels built', f.evaluate("()=>document.querySelectorAll('#tmOv .tm-wl').length")==5)
    s0 = f.evaluate("()=>({d:document.getElementById('tmDate').textContent,jd:currentJD,on:[...document.querySelectorAll('#tmOv .tm-wl')].map(w=>(w.querySelector('.on')||{}).textContent)})")
    ok('wheels show current date', len([x for x in s0['on'] if x])==5, s0)
    # turn the month wheel to March by scrolling
    f.evaluate("()=>{const w=document.querySelector('#tmOv [data-w=m]');w.scrollTo({top:2*34,behavior:'auto'})}"); f.wait_for_timeout(2500)
    s1 = f.evaluate("()=>({d:document.getElementById('tmDate').textContent})"); ok('month wheel changes date', ' Mar ' in s1['d'], s1)
    f.evaluate("()=>{const w=document.querySelector('#tmOv [data-w=y]');w.scrollTo({top:(1998-1800)*34,behavior:'auto'})}"); f.wait_for_timeout(2500)
    s2 = f.evaluate("()=>document.getElementById('tmDate').textContent"); ok('year wheel changes date', s2.endswith('1998'), s2)
    f.evaluate("()=>{const w=document.querySelector('#tmOv [data-w=d]');w.scrollTo({top:14*34,behavior:'auto'})}"); f.wait_for_timeout(2500)
    s3 = f.evaluate("()=>document.getElementById('tmDate').textContent"); ok('day wheel changes date', s3.startswith('15 '), s3)
    f.evaluate("()=>{const w=document.querySelector('#tmOv [data-w=h]');w.scrollTo({top:7*34,behavior:'auto'})}"); f.wait_for_timeout(2500)
    ok('hour wheel changes time', ' 07:' in f.evaluate("()=>document.getElementById('tmSub').textContent"), f.evaluate("()=>document.getElementById('tmSub').textContent"))
    # tapping an item scrolls it in
    f.evaluate("()=>document.querySelector('#tmOv [data-w=m] .tm-it[data-i=\"9\"]').click()"); f.wait_for_timeout(2500)
    ok('tap on item selects it', ' Oct ' in f.evaluate("()=>document.getElementById('tmDate').textContent"), f.evaluate("()=>document.getElementById('tmDate').textContent"))
    # Feb 2024 has 29 days; jump to 31 Jan then step +1mo -> day clamps
    f.evaluate("()=>{go(mk(2024,0,31,10,0));}") if False else None
    f.fill('#tmIn', '31 Jan 2024 10:30'); f.press('#tmIn', 'Enter'); f.wait_for_timeout(2500)
    ok('typed date works', f.evaluate("()=>document.getElementById('tmDate').textContent")=='31 Jan 2024')
    f.evaluate("()=>document.querySelector('#tmOv .tm-st button[data-u=mo][data-n=\"1\"]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))"); f.evaluate("()=>document.querySelector('#tmOv .tm-st').dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))"); f.wait_for_timeout(2500)
    ok('+1 month clamps to 29 Feb 2024', f.evaluate("()=>document.getElementById('tmDate').textContent")=='29 Feb 2024', f.evaluate("()=>document.getElementById('tmDate').textContent"))
    ok('day wheel has 29 days in Feb 2024', f.evaluate("()=>document.querySelectorAll('#tmOv [data-w=d] .tm-it').length")==29)
    ok('wheels follow the date after a step', f.evaluate("()=>(document.querySelector('#tmOv [data-w=d] .on')||{}).textContent").startswith('29'))
    ok('no sideways scroll', f.evaluate("()=>document.querySelector('#tmOv .tm-card').scrollWidth<=document.querySelector('#tmOv .tm-card').clientWidth+1"))
    ok('no page errors', not errs, errs[:2]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)
raise SystemExit(0 if all(c for _, c, _ in res) else 1)

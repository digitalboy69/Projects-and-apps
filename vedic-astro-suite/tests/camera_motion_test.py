# Drag momentum, eased zoom, magnetic hover (3D app). Slow software GL: waits are generous.
# Run: THREE_JS=/path/three.min.js PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/camera_motion_test.py   (VAX_TARGET=hosted for the folder version)
import os
from playwright.sync_api import sync_playwright
import sys; sys.path.insert(0, os.path.dirname(__file__)); from _helpers import PAGE, is_local
SP=os.environ.get('SP')
THREE=open(os.environ['THREE_JS'],'rb').read()
def route(r):
    u=r.request.url
    if 'three.min.js' in u: return r.fulfill(status=200,content_type='application/javascript',body=THREE)
    if is_local(u): return r.continue_()
    return r.abort()
out=[]; ok=lambda n,c,d='': out.append(('PASS' if c else 'FAIL',n,str(d)[:140]))
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    ctx=b.new_context(viewport={'width':1280,'height':860},timezone_id='Asia/Kolkata'); ctx.route('**/*',route); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(PAGE+'#sky',wait_until='commit',timeout=90000); pg.wait_for_timeout(26000)
    f=[x for x in pg.frames if x!=pg.main_frame and x.evaluate("typeof setSceneView")=='function'][0]
    off=pg.evaluate("(()=>{const r=document.querySelector('iframe').getBoundingClientRect();return [r.x,r.y]})()")
    # momentum: fast drag then release -> angle keeps moving
    th0=f.evaluate("orbitAngleTheta"); pg.mouse.move(off[0]+400,off[1]+400); pg.mouse.down()
    for i in range(8): pg.mouse.move(off[0]+400+i*18,off[1]+400); pg.wait_for_timeout(16)
    th1=f.evaluate("orbitAngleTheta"); pg.mouse.up(); pg.wait_for_timeout(1200)
    th2=f.evaluate("orbitAngleTheta"); pg.wait_for_timeout(9000); th3=f.evaluate("orbitAngleTheta"); pg.wait_for_timeout(600); th4=f.evaluate("orbitAngleTheta")
    ok('drag moves camera',abs(th1-th0)>0.1,[th0,th1])
    ok('momentum continues after release',abs(th2-th1)>0.01,[th1,th2])
    ok('momentum settles (stops)',abs(th4-th3)<0.002,[th3,th4])
    # held still then release -> no fling
    pg.mouse.move(off[0]+400,off[1]+400); pg.mouse.down(); pg.mouse.move(off[0]+460,off[1]+400); pg.wait_for_timeout(300); a=f.evaluate("orbitAngleTheta"); pg.mouse.up(); pg.wait_for_timeout(400); c=f.evaluate("orbitAngleTheta")
    ok('hold-still release does not fling',abs(c-a)<0.005,[a,c])
    # eased zoom
    d0=f.evaluate("orbitDist"); pg.mouse.move(off[0]+400,off[1]+400); pg.mouse.wheel(0,-300); pg.wait_for_timeout(60)
    d1=f.evaluate("orbitDist"); g=f.evaluate("zoomGoal"); pg.wait_for_timeout(8000); d2=f.evaluate("orbitDist")
    ok('zoom eases (not instant)',g is not None and abs(g-d0)>abs(d1-d0)+1e-6,[d0,d1,g,d2]); ok('zoom reaches goal',abs(d2-(g if g is not None else d2))<1e-3 and f.evaluate("zoomGoal") is None,[d2,g])
    # magnetic hover
    tab=f.locator('.panel-tab[data-tab=transits]'); bb=tab.bounding_box()
    pg.mouse.move(off[0]+bb['x']+bb['width']*0.85,off[1]+bb['y']+bb['height']*0.8); pg.wait_for_timeout(200)
    tx=f.evaluate("document.querySelector('.panel-tab[data-tab=transits]').style.getPropertyValue('--tx')")
    ok('magnetic offset set on hover',tx not in ('','0px'),tx)
    pg.mouse.move(off[0]+300,off[1]+300); pg.wait_for_timeout(100)
    ok('offset cleared after leaving',f.evaluate("document.querySelector('.panel-tab[data-tab=transits]').style.getPropertyValue('--tx')")=='')
    f.evaluate("document.querySelector('.panel-tab[data-tab=transits]').click()"); pg.wait_for_timeout(2500)
    pg.mouse.move(off[0]+bb['x']+30,off[1]+bb['y']+10); pg.wait_for_timeout(1200)
    (SP and pg.screenshot(path=f'{SP}/prem_desktop.png'))
    ok('no page errors',not errs,errs)
    b.close()
for o in out: print(*o)

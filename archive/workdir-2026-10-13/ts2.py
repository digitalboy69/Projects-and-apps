from playwright.sync_api import sync_playwright
import json
TH=open('/home/claude/w/three.r128.js','rb').read()
def handler(route):
    u=route.request.url
    if 'three.min.js' in u: return route.fulfill(status=200,content_type='application/javascript',body=TH)
    if u.startswith('file:') or u.startswith('data:') or u.startswith('blob:'): return route.continue_()
    return route.abort()
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    ctx=b.new_context(viewport={'width':1280,'height':820});ctx.route('**/*',handler);pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('PE '+str(e)))
    pg.on('console',lambda m: errs.append('CE '+m.text) if m.type=='error' and 'Failed to load resource' not in m.text else None)
    pg.goto('file:///home/claude/w/out_plain.html#sky');pg.wait_for_timeout(5000)
    fr=[f for f in pg.frames if f!=pg.main_frame and 'THREE' in (f.evaluate("typeof THREE") and 'THREE')][0]
    print('three ok',fr.evaluate("typeof THREE"), fr.evaluate("typeof setSceneView"))
    pg.screenshot(path='s_wheel.png')
    print('sky rows',fr.evaluate("document.querySelectorAll('#skyTable .sky-row').length"), fr.evaluate("document.querySelector('#skyTable').innerText.slice(-260)"))
    fr.evaluate("()=>{activeNatalProfile={name:'Test',dob:'1990-05-15',tob:'10:30',lat:19.076,lon:72.8777,tz:5.5};openPlanetDetail('Neptune');}");pg.wait_for_timeout(900)
    pg.screenshot(path='po_ov.png')
    for t,n in [('me','po_me'),('ti','po_ti'),('as','po_as'),('fa','po_fa')]:
        fr.evaluate("(t)=>[...document.querySelectorAll('.pdx-tab')].find(b=>b.getAttribute('onclick').includes(\"'\"+t+\"'\")).click()",t);pg.wait_for_timeout(1600)
        pg.screenshot(path=n+'.png')
    print(fr.evaluate("()=>document.querySelector('[data-pane=as]').innerText.slice(0,600)"))
    print(fr.evaluate("()=>document.querySelector('[data-pane=ti]').innerText.slice(0,300)"))
    fr.evaluate("()=>{closePlanetDetail();document.querySelector('#skyTable .sky-row:last-child').click()}");pg.wait_for_timeout(500)
    print('pluto row ->',fr.evaluate("()=>document.querySelector('.pdx-name').textContent"))
    print('ERR',errs)
    b.close()

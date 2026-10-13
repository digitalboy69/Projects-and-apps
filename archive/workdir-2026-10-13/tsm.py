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
    ctx=b.new_context(viewport={'width':390,'height':800});ctx.route('**/*',handler);pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('PE '+str(e)))
    pg.on('console',lambda m: errs.append('CE '+m.text) if m.type=='error' and 'Failed to load resource' not in m.text else None)
    pg.goto('file:///home/claude/w/out_plain.html#sky');pg.wait_for_timeout(5000)
    fr=[f for f in pg.frames if f!=pg.main_frame and 'THREE' in (f.evaluate("typeof THREE") and 'THREE')][0]
    print('three ok',fr.evaluate("typeof THREE"), fr.evaluate("typeof setSceneView"))
    pg.screenshot(path='m_wheel.png')
    print('sky rows',fr.evaluate("document.querySelectorAll('#skyTable .sky-row').length"), fr.evaluate("document.querySelector('#skyTable').innerText.slice(-260)"))
    fr.click('#viewSwitch [data-v=solar]');pg.wait_for_timeout(1500);pg.screenshot(path='m_easy.png')
    fr.click('#solPresets [data-p=inner]');pg.wait_for_timeout(800);pg.screenshot(path='m_inner.png')
    fr.click('#solScale [data-s=real]');pg.wait_for_timeout(1200)
    fr.click('#solPresets [data-p=all]');pg.wait_for_timeout(1000);pg.screenshot(path='m_real.png')
    fr.evaluate("()=>{setCamMode('focus');focusedPlanetKey='sol_Jupiter';autoRotate=false;markDirty();}");pg.wait_for_timeout(1200);pg.screenshot(path='m_focus.png')
    print('orbitDist',fr.evaluate("orbitDist"),'near',fr.evaluate("camera.near"))
    fr.evaluate("()=>document.querySelector('[data-tab=solar]').click()");pg.wait_for_timeout(600);pg.screenshot(path='m_tab.png')
    fr.click('#viewSwitch [data-v=wheel]');pg.wait_for_timeout(1000);pg.screenshot(path='m_back.png')
    print('ERR',errs[:8])
    b.close()

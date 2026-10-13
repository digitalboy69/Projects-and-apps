from playwright.sync_api import sync_playwright
import json
TILE=open('tile.png','rb').read()
def handler(route):
    u=route.request.url
    if 'tile.openstreetmap' in u or 'cartocdn' in u or 'arcgisonline' in u: return route.fulfill(status=200,content_type='image/png',body=TILE)
    if 'nominatim' in u and '/search' in u: return route.fulfill(status=200,content_type='application/json',body=json.dumps([{"display_name":"Mumbai, Maharashtra, India","lat":"19.076","lon":"72.8777","type":"city","address":{"country_code":"in"}}]))
    if 'nominatim' in u and '/reverse' in u: return route.fulfill(status=200,content_type='application/json',body=json.dumps({"display_name":"Reverse Town, India","address":{"country_code":"in"}}))
    if 'googleapis' in u or 'gstatic' in u: return route.abort()
    return route.continue_()
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':1280,'height':900});ctx.route('**/*',handler);pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append('PE '+str(e)))
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(2500)
    fr=[f for f in pg.frames if 'Rectification' in (f.title() or '')][0]
    # fill birth form via picker then cast
    fr.fill('#profileName','Test User');fr.evaluate("()=>{const d=document.getElementById('dobInput');d.value='1990-05-15';d.dispatchEvent(new Event('input',{bubbles:true}));}")
    fr.evaluate("()=>{const t=document.querySelector('#birthForm input[type=time]');if(t){t.value='10:30';t.dispatchEvent(new Event('input',{bubbles:true}));}}")
    fr.click('.lp-tools [data-m=map]');pg.wait_for_timeout(400);pg.fill('#lpQ','Mumbai');pg.wait_for_timeout(1000);pg.keyboard.press('Enter');pg.wait_for_timeout(500);pg.click('#lpUse');pg.wait_for_timeout(300)
    fr.click('#castBtn');pg.wait_for_timeout(5000)
    print('chart rendered',fr.evaluate("()=>!!document.getElementById('panel-match')"))
    # transit form
    print('transit tools',fr.evaluate("()=>document.querySelectorAll('#transitLocationForm .lp-tools').length"))
    pid=fr.evaluate("()=>document.getElementById('transitLocationForm').closest('.app-panel').id");print('transit panel',pid)
    fr.evaluate("(pid)=>{const t=document.querySelector('.app-tab[data-panel=\"'+pid+'\"]');t&&t.click();}",pid);pg.wait_for_timeout(700)
    fr.evaluate("()=>document.querySelector('#transitLocationForm .lp-tools [data-m=map]').click()");pg.wait_for_timeout(500);pg.fill('#lpQ','Mumbai');pg.wait_for_timeout(900);pg.keyboard.press('Enter');pg.wait_for_timeout(400);pg.click('#lpUse');pg.wait_for_timeout(300)
    print('transit val',fr.evaluate("()=>document.getElementById('transitPlaceInput').value"))
    # matchmaking
    fr.evaluate("()=>{const t=document.querySelector('.app-tab[data-panel=panel-match]');t&&t.click();}");pg.wait_for_timeout(600)
    fr.evaluate("()=>{const b=document.querySelector('[data-mt-mode=\"2:new\"]');b&&b.click();}");pg.wait_for_timeout(300)
    print('mt buttons',fr.evaluate("()=>document.querySelectorAll('[data-mt-loc]').length"))
    fr.evaluate("()=>document.querySelector('[data-mt-loc=\"2:coords\"]').click()");pg.wait_for_timeout(400)
    pg.fill('#lpLat','12.9716');pg.fill('#lpLon','77.5946');pg.click('#lpUse2');pg.wait_for_timeout(900)
    print('mt coord text',fr.evaluate("()=>document.getElementById('mtCoord2').textContent"))
    print('errs',errs[:5])
    # Notepad
    pg.click('#swBtn');pg.click('[data-act=N]');pg.wait_for_timeout(1200)
    nf=[f for f in pg.frames if 'Jyotish' in (f.title() or '')][0]
    nf.evaluate("()=>document.getElementById('bNew').click()");pg.wait_for_timeout(300)
    nf.evaluate("()=>document.querySelector('[data-a=clientT]').click()");pg.wait_for_timeout(300)
    nf.evaluate("()=>document.querySelector('[data-a=pickmap]').click()");pg.wait_for_timeout(500)
    pg.fill('#lpQ','Mumbai');pg.wait_for_timeout(900);pg.keyboard.press('Enter');pg.wait_for_timeout(300);pg.click('#lpUse');pg.wait_for_timeout(400)
    print('notepad pob',nf.evaluate("()=>document.querySelector('[data-cf=pob]').value+' | '+document.getElementById('client').innerText.slice(-60)"))
    print('errs',errs[:5])
    # mobile popup
    pg2=ctx.new_page();pg2.set_viewport_size({'width':390,'height':800});pg2.goto("file:///home/claude/w/out_plain.html");pg2.wait_for_timeout(2500)
    f2=[f for f in pg2.frames if 'Rectification' in (f.title() or '')][0]
    f2.evaluate("()=>document.querySelector('.lp-tools [data-m=map]').click()");pg2.wait_for_timeout(600);pg2.fill('#lpQ','Mumbai');pg2.wait_for_timeout(1000);pg2.screenshot(path='lp_m1.png')
    pg2.keyboard.press('Enter');pg2.wait_for_timeout(1300);pg2.screenshot(path='lp_m2.png')
    b.close()

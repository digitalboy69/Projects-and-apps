from playwright.sync_api import sync_playwright
import json
TILE=open('tile.png','rb').read()
def handler(route):
    u=route.request.url
    if 'tile.openstreetmap' in u or 'cartocdn' in u or 'arcgisonline' in u: return route.fulfill(status=200,content_type='image/png',body=TILE)
    if 'nominatim' in u and '/search' in u:
        return route.fulfill(status=200,content_type='application/json',body=json.dumps([{"display_name":"Pune, Pune District, Maharashtra, India","lat":"18.5204","lon":"73.8567","type":"city","address":{"country_code":"in"}},{"display_name":"Pune Cantonment, Maharashtra, India","lat":"18.50","lon":"73.89","type":"suburb","address":{"country_code":"in"}}]))
    if 'nominatim' in u and '/reverse' in u:
        return route.fulfill(status=200,content_type='application/json',body=json.dumps({"display_name":"Somewhere Nice, Maharashtra, India","address":{"country_code":"in"}}))
    if 'googleapis' in u or 'gstatic' in u: return route.abort()
    return route.continue_()
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':1280,'height':800});ctx.route('**/*',handler);pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append('PE '+str(e)))
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(2500)
    fr=[f for f in pg.frames if 'Vedic' in (f.title() or '') and 'Rectification' in (f.title() or '')][0]
    print('tools in form:',fr.evaluate("()=>document.querySelectorAll('.lp-tools').length"))
    fr.click('.lp-tools [data-m=map]');pg.wait_for_timeout(500);print('popup open',pg.evaluate("()=>document.querySelector('.lp').classList.contains('on')"))
    pg.screenshot(path='lp1.png')
    pg.fill('#lpQ','Pune');pg.wait_for_timeout(1200);print('results',pg.evaluate("()=>document.querySelectorAll('#lpR button').length"));pg.screenshot(path='lp2.png')
    pg.keyboard.press('Enter');pg.wait_for_timeout(1500);print('sheet',pg.inner_text('#lpPl'));pg.screenshot(path='lp3.png')
    pg.click('#lpUse');pg.wait_for_timeout(400)
    print('form',fr.evaluate("()=>[document.getElementById('placeInput').value,document.getElementById('coordReadout').textContent,document.getElementById('tzInput').value]"))
    # coords tab with google link
    fr.click('.lp-tools [data-m=coords]');pg.wait_for_timeout(300)
    pg.fill('#lpPaste','https://www.google.com/maps/place/Delhi/@28.6139,77.2090,11z');pg.wait_for_timeout(300);print('lat/lon',pg.input_value('#lpLat'),pg.input_value('#lpLon'));pg.screenshot(path='lp4.png')
    pg.click('#lpUse2');pg.wait_for_timeout(900)
    print('form2',fr.evaluate("()=>[document.getElementById('placeInput').value,document.getElementById('coordReadout').textContent,document.getElementById('tzInput').value]"))
    # map click, wheel, layer, drag marker
    fr.click('.lp-tools [data-m=map]');pg.wait_for_timeout(500)
    box=pg.locator('#lpMapBox').bounding_box();cx,cy=box['x']+box['width']/2,box['y']+box['height']/2+40
    pg.mouse.move(cx,cy);pg.mouse.wheel(0,-400);pg.wait_for_timeout(300)
    z1=pg.evaluate("()=>1");pg.mouse.click(cx,cy);pg.wait_for_timeout(900);print('click sheet',pg.inner_text('#lpPl')[:90])
    pg.mouse.move(cx+60,cy+60);pg.mouse.down();pg.mouse.move(cx-100,cy-30,steps=6);pg.mouse.up();pg.wait_for_timeout(300)
    pg.click('#lpLy');pg.wait_for_timeout(300);print('layer',pg.inner_text('#lpLy'));pg.click('#lpLy');pg.screenshot(path='lp5.png')
    pg.click('#lpZi');pg.wait_for_timeout(400)
    pg.keyboard.press('Escape');pg.wait_for_timeout(300);print('closed',not pg.evaluate("()=>document.querySelector('.lp').classList.contains('on')"))
    print('errs',errs[:5])
    # mobile
    pg.set_viewport_size({'width':390,'height':780});fr.click('.lp-tools [data-m=map]',force=True) if False else None
    b.close()

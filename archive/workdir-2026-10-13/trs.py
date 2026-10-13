from playwright.sync_api import sync_playwright
import json,sys
TILE=open('tile.png','rb').read()
def handler(route):
    u=route.request.url
    if 'tile.openstreetmap' in u or 'cartocdn' in u or 'arcgisonline' in u: return route.fulfill(status=200,content_type='image/png',body=TILE)
    if 'nominatim' in u and '/search' in u: return route.fulfill(status=200,content_type='application/json',body=json.dumps([{"display_name":"Mumbai, Maharashtra, India","lat":"19.076","lon":"72.8777","type":"city","address":{"country_code":"in"}}]))
    if 'nominatim' in u: return route.fulfill(status=200,content_type='application/json',body=json.dumps({"display_name":"Mumbai","address":{"country_code":"in"}}))
    if 'googleapis' in u or 'gstatic' in u: return route.abort()
    return route.continue_()
def run(w,h,tag):
  with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':w,'height':h});ctx.route('**/*',handler);pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append('PE '+str(e)))
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(2500)
    fr=[f for f in pg.frames if 'Rectification' in (f.title() or '')][0]
    fr.fill('#profileName','Test User');fr.evaluate("()=>{const d=document.getElementById('dobInput');d.value='1990-05-15';d.dispatchEvent(new Event('input',{bubbles:true}));}")
    fr.evaluate("()=>{const t=document.querySelector('#birthForm input[type=time]');if(t){t.value='10:30';t.dispatchEvent(new Event('input',{bubbles:true}));}}")
    fr.click('.lp-tools [data-m=map]');pg.wait_for_timeout(400);pg.fill('#lpQ','Mumbai');pg.wait_for_timeout(1000);pg.keyboard.press('Enter');pg.wait_for_timeout(500);pg.click('#lpUse');pg.wait_for_timeout(300)
    fr.click('#castBtn');pg.wait_for_timeout(5000)
    fr.evaluate("()=>switchAppTab('panel-rectification')");pg.wait_for_timeout(1200)
    pg.screenshot(path=f'rs_{tag}_hero.png')
    fr.click('[data-rs-chip=half]');pg.wait_for_timeout(900);pg.screenshot(path=f'rs_{tag}_scan.png')
    fr.click('#rectScanBtn');pg.wait_for_timeout(2500)
    print('scan rows',fr.evaluate("()=>document.querySelectorAll('#rectResultsWrap tr').length"))
    fr.evaluate("()=>switchAppTab('panel-sandhi')");pg.wait_for_timeout(500)
    print('sandhi tab active',fr.evaluate("()=>document.querySelector('.rs-pane.active').dataset.rsPane"))
    fr.click('#sandhiCalcBtn');pg.wait_for_timeout(1500);pg.screenshot(path=f'rs_{tag}_sandhi.png')
    fr.evaluate("()=>switchAppTab('panel-lifeevents')");pg.wait_for_timeout(500)
    for c,d in [('marriage','2016-02-10'),('career','2013-07-01'),('child','2019-03-20')]:
        fr.select_option('#rsEvCat',c);fr.fill('#rsEvDate',d);fr.click('#rsEvAdd');pg.wait_for_timeout(150)
    fr.click('#rsEvRun');pg.wait_for_timeout(2500)
    print('ranks',fr.evaluate("()=>[...document.querySelectorAll('.rs-rank b')].map(x=>x.textContent)"))
    pg.screenshot(path=f'rs_{tag}_life.png',full_page=False)
    fr.click('.rs-rank.top .rs-seg');pg.wait_for_timeout(800)
    print('dial',fr.evaluate("()=>[rectHms.h,rectHms.m,rectHms.s,document.getElementById('rsPill').textContent]"))
    pg.screenshot(path=f'rs_{tag}_dial.png')
    fr.click('#rectFullCalcBtn');pg.wait_for_timeout(3000)
    print('full chart landed on',fr.evaluate("()=>document.querySelector('.app-panel.active')&&document.querySelector('.app-panel.active').id"))
    print('ERR',errs);b.close()
run(1280,900,'d');run(390,800,'m')

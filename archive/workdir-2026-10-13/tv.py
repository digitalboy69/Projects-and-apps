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
    fr.evaluate("()=>openExportModal()");pg.wait_for_timeout(800)
    print(fr.evaluate("()=>({grp:document.querySelectorAll('#exportModal [class*=vax]').length,lp:document.querySelectorAll('#exportModal .lp-tools').length,fab:!!document.getElementById('vaxFab'),opts:document.querySelectorAll('#exportModal input[type=checkbox]').length})"))
    pg.screenshot(path='vax1.png')
    rep=fr.evaluate("()=>{const c=currentChartForModal,p=currentProfileForExport;return buildFullReportText(c,p,null).length}")
    full=fr.evaluate("()=>VAX.fullReport?String(VAX.fullReport().length||VAX.fullReport()).slice(0,50):0")
    print('report len',rep,full)
    fr.evaluate("()=>closeExportModal()")
    fr.evaluate("()=>document.getElementById('vaxFab').click()");pg.wait_for_timeout(500);pg.screenshot(path='vax2.png')
    print('ERR',errs)
    b.close()

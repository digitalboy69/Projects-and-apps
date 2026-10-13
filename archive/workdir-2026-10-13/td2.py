from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1280,'height':800});errs=[]
    pg.on("pageerror",lambda e:errs.append('PE '+str(e)));pg.on("console",lambda m:errs.append('C '+m.text))
    pg.goto("file:///home/claude/w/srcN.html");pg.wait_for_timeout(800)
    pg.click('.it');pg.wait_for_timeout(300);pg.click('#bNew');pg.wait_for_timeout(200);pg.keyboard.type('My first case');pg.wait_for_timeout(300)
    print(pg.evaluate("()=>({ed:!!document.getElementById('ed'),vis:document.getElementById('ed')&&document.getElementById('ed').getBoundingClientRect().toJSON(),mb:document.getElementById('mainBody').innerHTML.length})"))
    print(errs)
    pg.screenshot(path='dbg.png');b.close()

from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1280,'height':800});errs=[]
    pg.on("pageerror",lambda e:errs.append('PE '+str(e)));pg.on("console",lambda m:errs.append('C '+m.text))
    pg.goto("file:///home/claude/w/srcN.html");pg.wait_for_timeout(800)
    pg.click('.it');pg.wait_for_timeout(300)
    print(pg.evaluate("()=>({ed:!!document.getElementById('ed'),sel:__np.ui.sel,view:__np.ui.view})"))
    pg.click('#bNew');pg.wait_for_timeout(300)
    print(pg.evaluate("()=>({ed:!!document.getElementById('ed'),sel:__np.ui.sel,view:__np.ui.view,mb:document.getElementById('mainBody').innerHTML.slice(0,200)})"))
    print(errs)
    b.close()

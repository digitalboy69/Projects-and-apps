from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':800});errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/w/srcDev.html");pg.wait_for_timeout(2500)
    pg.wait_for_timeout(800);pg.screenshot(path='dv.png')
    print(errs)

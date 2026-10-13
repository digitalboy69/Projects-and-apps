from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,t in [(1280,800,'d'),(390,800,'m')]:
        pg=b.new_page(viewport={'width':w,'height':h});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
        pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(1500);pg.screenshot(path=f'wel_{t}.png')
        pg.wait_for_timeout(4500);print(t,'hidden',pg.evaluate("document.getElementById('load').classList.contains('hide')"),errs)
    b.close()

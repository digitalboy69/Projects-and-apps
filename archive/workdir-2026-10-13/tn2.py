from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1280,'height':800});errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/w/srcN.html");pg.wait_for_timeout(600)
    pg.keyboard.press('Control+k');pg.wait_for_timeout(200);pg.keyboard.type('set');pg.wait_for_timeout(200)
    print(pg.evaluate("()=>[...document.querySelectorAll('#cres button')].map(b=>b.textContent)"))
    pg.keyboard.press('Enter');pg.wait_for_timeout(300)
    print(pg.evaluate("()=>[document.getElementById('ov').className,document.getElementById('ovc').className,document.getElementById('md').innerText.slice(0,40)]"),errs)
    b.close()

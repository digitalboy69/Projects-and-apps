from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1280,'height':800})
    pg.goto("file:///home/claude/w/srcN.html");pg.wait_for_timeout(600)
    pg.click('#bNew');pg.wait_for_timeout(200);pg.click('#ed');pg.keyboard.type('x ');pg.wait_for_timeout(100)
    print('after type',pg.evaluate("()=>__np.sr()"))
    pg.click('[data-a=pal]');print('after pal',pg.evaluate("()=>__np.sr()"))
    pg.click('#pal .grid button >> nth=0');print(pg.evaluate("()=>[__np.sr(),document.getElementById('ed').innerHTML]"))
    b.close()

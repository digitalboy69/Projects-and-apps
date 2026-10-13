from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1280,'height':800})
    pg.goto("file:///home/claude/w/srcN.html");pg.wait_for_timeout(600)
    pg.click('#bNew');pg.wait_for_timeout(200);pg.click('#ed');pg.keyboard.type('[] task');pg.keyboard.press('Enter');pg.keyboard.type('beta')
    pg.click('[data-a=pal]');pg.click('#pal .grid button >> nth=0');pg.click('[data-pt="1"]');pg.click('#pal .grid button >> nth=4');pg.wait_for_timeout(200)
    print(pg.evaluate("()=>document.getElementById('ed').innerHTML"))
    b.close()

from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':430,'height':900})
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(2500)
    pg.evaluate("()=>{const l=document.getElementById('load');l.classList.remove('hide');l.style.transition='none'}");pg.wait_for_timeout(600)
    pg.screenshot(path='loader.png');b.close()

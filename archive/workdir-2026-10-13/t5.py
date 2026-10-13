from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch()
    for f in ('out_plain.html','out_b64.html'):
        pg=b.new_page(viewport={'width':430,'height':900});e=[];pg.on("pageerror",lambda x:e.append(str(x)))
        pg.goto("file:///home/claude/w/"+f);pg.wait_for_timeout(300);pg.screenshot(path=f+'_load.png')
        pg.wait_for_timeout(3000)
        print(f,pg.evaluate("()=>({hash:location.hash,loadHidden:document.getElementById('load').classList.contains('hide'),frames:[...document.querySelectorAll('.stage iframe')].map(x=>x.title+':'+x.className),ico:document.getElementById('swIco').textContent,activeItem:document.querySelector('.sw-item.on').dataset.act})"),e[:3])
        pg.evaluate("()=>document.querySelector('[data-act=A]').click()");pg.wait_for_timeout(1500)
        print(' after A:',pg.evaluate("()=>({loadHidden:document.getElementById('load').classList.contains('hide'),cls:[...document.querySelectorAll('.stage iframe')].map(x=>x.title+':'+x.className)})"),e[:3])
    b.close()

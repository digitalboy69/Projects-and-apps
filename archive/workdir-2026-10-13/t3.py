from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch()
    for f in ('new.html','plain.html'):
        pg=b.new_page(viewport={'width':430,'height':900});e=[];pg.on("pageerror",lambda x:e.append(str(x)))
        pg.goto("file:///home/claude/w/"+f);pg.wait_for_timeout(2500)
        pg.evaluate("()=>{const b=[...document.querySelectorAll('[data-act]')];}")
        # force-mount vedic app: click its switcher
        r=pg.evaluate("""()=>{const fr=[...document.querySelectorAll('iframe')];return fr.map(x=>x.srcdoc?x.srcdoc.length:0)}""")
        print(f,r,e[:3])
    b.close()

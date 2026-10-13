from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();out={}
    for f in ('new.html','plain.html'):
        pg=b.new_page(viewport={'width':430,'height':900});pg.goto("file:///home/claude/w/"+f);pg.wait_for_timeout(1500)
        pg.evaluate("()=>{const b=document.querySelector('[data-act=\"B\"]')||document.querySelector('[data-act=\"chart\"]');if(b)b.click();}")
        pg.wait_for_timeout(1500)
        pg.evaluate("()=>{const x=document.querySelector('.sw-main,#swMain,.fab,#swBtn');}")
        out[f]=pg.evaluate("()=>[...document.querySelectorAll('iframe')].map(x=>[x.id,(x.srcdoc||'').length])")
        # dev card
        pg.evaluate("()=>{const d=document.querySelector('[data-act=\"dev\"]');if(d)d.click();}");pg.wait_for_timeout(800)
        out[f+'dev']=pg.evaluate("()=>[...document.querySelectorAll('iframe')].map(x=>[x.id,(x.srcdoc||'').length])")
    print(out);b.close()

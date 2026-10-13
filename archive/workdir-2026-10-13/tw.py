from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch()
    for f in ('out_plain.html','out_b64.html'):
        ctx=b.new_context(viewport={'width':430,'height':880});pg=ctx.new_page();e=[];pg.on("pageerror",lambda x:e.append(str(x)))
        pg.goto("file:///home/claude/w/"+f);pg.wait_for_timeout(2000)
        pg.click('#swBtn');pg.click('[data-act=N]');pg.wait_for_timeout(1200)
        fr=[x for x in pg.frames if 'Jyotish' in (x.title() or '')]
        print(f,'frames',[x.title() for x in pg.frames][:5],'ico',pg.inner_text('#swIco'),'hash',pg.evaluate('location.hash'),'load hidden',pg.evaluate("document.getElementById('load').classList.contains('hide')"))
        n=fr[0]
        n.click('#bNew2');n.wait_for_timeout(200);pg.keyboard.type('Wrapper test');n.wait_for_timeout(700)
        print('notes',n.evaluate("()=>__np.S().notes.length"))
        pg.screenshot(path=f+'_n.png')
        pg.reload();pg.wait_for_timeout(1800);print('after reload hash',pg.evaluate('location.hash'),[x.title() for x in pg.frames][1:3])
        fr=[x for x in pg.frames if 'Jyotish' in (x.title() or '')];print('persist notes',fr[0].evaluate("()=>__np.S().notes.length") if fr else 'no frame')
        print('errs',e[:3])
        # back to chart from notepad message
        fr[0].evaluate("()=>parent.postMessage('vedic-open-chart','*')");pg.wait_for_timeout(1200);print('now',pg.inner_text('#swIco'))
    b.close()

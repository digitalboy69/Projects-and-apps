exec(open('trs.py').read().split("def run")[0])
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':800});ctx.route('**/*',handler);pg=ctx.new_page()
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(3500)
    fr=[f for f in pg.frames if 'Rectification' in (f.title() or '')][0]
    fr.evaluate("()=>document.getElementById('inShare').scrollIntoView({block:'center'})");pg.wait_for_timeout(300)
    pg.screenshot(path='in_share2.png')
    fr.click('#inScanBtn');pg.wait_for_timeout(300);pg.screenshot(path='in_scan.png')

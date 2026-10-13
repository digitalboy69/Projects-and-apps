exec(open('trs.py').read().split("def run")[0])
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':800});ctx.route('**/*',handler);pg=ctx.new_page()
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(3500)
    fr=[f for f in pg.frames if 'Rectification' in (f.title() or '')][0]
    fr.click('#inEx');pg.wait_for_timeout(500);fr.click('#castBtn');pg.wait_for_timeout(4000)
    pg.screenshot(path='ui_home.png')
    for t in ('panel-overview','panel-dasha','panel-planets'):
        fr.evaluate(f"()=>switchAppTab('{t}')");pg.wait_for_timeout(600);pg.screenshot(path=f'ui_{t}.png')

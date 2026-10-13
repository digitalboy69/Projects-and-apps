exec(open('trs.py').read().split("def run")[0])
with sync_playwright() as p:
  b=p.chromium.launch()
  for w,h,t in ((390,800,'m'),(1100,800,'d')):
    ctx=b.new_context(viewport={'width':w,'height':h});ctx.route('**/*',handler);pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(3500)
    fr=[f for f in pg.frames if 'Rectification' in (f.title() or '')][0]
    fr.click('#inEx');pg.wait_for_timeout(500);fr.click('#castBtn');pg.wait_for_timeout(4000)
    fr.evaluate("()=>srchOpen()");pg.wait_for_timeout(1200);pg.screenshot(path=f'ss_{t}1.png')
    fr.click('[data-ask="12"]');pg.wait_for_timeout(500);pg.screenshot(path=f'ss_{t}2.png')
    fr.click('[data-back]');fr.fill('#srchIn','soul');pg.wait_for_timeout(500);pg.screenshot(path=f'ss_{t}3.png');print(t,errs)

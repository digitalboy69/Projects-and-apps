exec(open('trs.py').read().split("def run")[0])
def run(w,h,t):
  with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':w,'height':h});ctx.route('**/*',handler);pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(3500)
    fr=[f for f in pg.frames if 'Rectification' in (f.title() or '')][0]
    pg.screenshot(path=f'in_{t}_0.png',full_page=True)
    fr.fill('#profileName','Asha');fr.select_option('#inDay','15');fr.select_option('#inMon','5');fr.select_option('#inYear','1990')
    fr.select_option('#inHr','10');fr.click('#inAp [data-ap=AM]')
    print('dob/tob',fr.evaluate("()=>[document.getElementById('dobInput').value,document.getElementById('tobInput').value]"))
    fr.click('.lp-tools [data-m=map]');pg.wait_for_timeout(400);pg.fill('#lpQ','Mumbai');pg.wait_for_timeout(1000);pg.keyboard.press('Enter');pg.wait_for_timeout(500);pg.click('#lpUse');pg.wait_for_timeout(500)
    pg.screenshot(path=f'in_{t}_1.png',full_page=True)
    print('label',fr.evaluate("()=>document.getElementById('inStepLbl').textContent+' | '+document.getElementById('inFound').textContent"))
    fr.click('#castBtn');pg.wait_for_timeout(5000)
    print('chart',fr.evaluate("()=>!!document.getElementById('panel-match')"))
    # example flow
    fr.evaluate("()=>{location.reload()}") if False else None
    print('ERR',errs);b.close()
run(1280,900,'d');run(390,800,'m')

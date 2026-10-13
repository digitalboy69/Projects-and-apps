exec(open('trs.py').read().split("def run")[0])
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':800});ctx.route('**/*',handler);pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(3500)
    fr=[f for f in pg.frames if 'Rectification' in (f.title() or '')][0]
    fr.click('#inEx');pg.wait_for_timeout(500);fr.click('#castBtn');pg.wait_for_timeout(4000)
    fr.click('#openMenuBtn');pg.wait_for_timeout(500)
    fr.click('[data-prof-edit="0"]');pg.wait_for_timeout(400)
    pg.screenshot(path='pe.png')
    fr.fill('#peDob','1992-03-20');fr.fill('#peTob','06:15');fr.click('#peSave');pg.wait_for_timeout(4000)
    print(fr.evaluate("()=>JSON.parse(localStorage.getItem(STORAGE_KEY))[0]"),fr.evaluate("()=>[currentProfileForExport.dob,currentProfileForExport.tob]"))
    print(errs)

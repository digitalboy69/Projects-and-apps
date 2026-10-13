exec(open('trs.py').read().split("def run")[0])
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':800});ctx.route('**/*',handler);pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(3500)
    fr=[f for f in pg.frames if 'Rectification' in (f.title() or '')][0]
    fr.click('#inEx');pg.wait_for_timeout(800)
    print(fr.evaluate("()=>[profileName.value,inDay.value,inMon.value,inYear.value,inHr.value,inMin.value,inAp.querySelector('.on,.active,[aria-pressed=true]')&&inAp.querySelector('.on,.active,[aria-pressed=true]').textContent,document.getElementById('inFound').textContent,castBtn.disabled]"))
    fr.click('#castBtn');pg.wait_for_timeout(4000)
    print('cast',fr.evaluate("()=>typeof currentChartForModal!=='undefined'&&!!currentChartForModal"))
    fr.evaluate("()=>{if(window.loadProfileIntoForm){const ps=JSON.parse(localStorage.getItem('vedicProfiles')||'[]');console.log(ps.length)}}")
    print(errs)

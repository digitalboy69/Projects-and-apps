exec(open('trs.py').read().split("def run")[0])
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':800});ctx.route('**/*',handler);pg=ctx.new_page()
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(3500)
    fr=[f for f in pg.frames if 'Rectification' in (f.title() or '')][0]
    fr.evaluate("()=>loadProfileIntoForm({name:'Ravi',dob:'1985-11-03',tob:'18:45',place:'Pune',lat:18.52,lon:73.85,tz:5.5})")
    print(fr.evaluate("()=>[inDay.value,inMon.value,inYear.value,inHr.value,inMin.value,tobInput.value,inAp.innerText]"))

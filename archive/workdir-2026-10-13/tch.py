exec(open('trs.py').read().split("def run")[0])
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':800});ctx.route('**/*',handler);pg=ctx.new_page()
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(3500)
    fr=[f for f in pg.frames if 'Rectification' in (f.title() or '')][0]
    S="()=>[inDay.value,inMon.value,inYear.value,inHr.value,inMin.value,dobInput.value,tobInput.value]"
    fr.select_option('#inDay','15');fr.select_option('#inMon','5');fr.select_option('#inYear','1990');fr.select_option('#inHr','10');fr.click('#inAp [data-ap=AM]')
    print(fr.evaluate(S))
    fr.select_option('#inHr','7');print(fr.evaluate(S))
    fr.click('#inAp [data-ap=PM]');print(fr.evaluate(S))
    fr.select_option('#inYear','1985');fr.select_option('#inDay','3');print(fr.evaluate(S))
    fr.click('#inChips [data-t="18:00"]');print(fr.evaluate(S))
    fr.select_option('#inMin','45');print(fr.evaluate(S))
    print(fr.evaluate("()=>[...document.querySelectorAll('#inHr,#inMin,#inDay,#inMon,#inYear')].map(e=>e.disabled+':'+getComputedStyle(e).pointerEvents)"))

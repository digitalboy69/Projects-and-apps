exec(open('trs.py').read().split("def run")[0])
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context();ctx.route('**/*',handler);pg=ctx.new_page()
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(3500)
    fr=[f for f in pg.frames if 'Rectification' in (f.title() or '')][0]
    fr.click('#inEx');pg.wait_for_timeout(500);fr.click('#castBtn');pg.wait_for_timeout(4000)
    print(fr.evaluate("()=>{const t=SRCH_TOPICS.find(x=>x.id==='karma');const b=srchBrief(t,t.subs[0],2700);return [t.subs[1][1].includes(\"'\"),b.length,/Rahu/.test(b),/arak/i.test(b)]}"))
    print(fr.evaluate("()=>JSON.stringify(Object.keys(currentChartForModal.charaKarakas||{}))"))
    print(fr.evaluate("()=>{const r=[];for(const id of ['fame','karma']){const t=SRCH_TOPICS.find(x=>x.id===id);r.push(id+':'+/Atmakaraka/.test(srchBrief(t,t.subs[0],2700))+'/'+/Atmakaraka/.test(srchBrief(t,t.subs[0],9000)))}return r}"))

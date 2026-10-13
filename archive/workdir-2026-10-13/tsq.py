exec(open('trs.py').read().split("def run")[0])
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':800});ctx.route('**/*',handler);pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(3500)
    fr=[f for f in pg.frames if 'Rectification' in (f.title() or '')][0]
    fr.click('#inEx');pg.wait_for_timeout(500);fr.click('#castBtn');pg.wait_for_timeout(4000)
    print(fr.evaluate("()=>[SRCH_TOPICS.length,SRCH_TOPICS.filter(t=>/love|soul|chem|break|partner|married/.test(t.id)).map(t=>t.id+':'+t.subs.length).join(' ')]"))
    print(fr.evaluate("()=>{const t=SRCH_TOPICS.find(x=>x.id==='soulmate');const b=srchBrief(t,t.subs[2],2700);return [b.length,b.slice(0,300)]}"))
    print(fr.evaluate("()=>{try{srchBuild();}catch(e){}return 1}"),errs)

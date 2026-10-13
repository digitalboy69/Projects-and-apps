exec(open('trs.py').read().split("def run")[0])
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':1280,'height':900});ctx.route('**/*',handler);pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(2500)
    fr=[f for f in pg.frames if 'Rectification' in (f.title() or '')][0]
    fr.fill('#profileName','Test User');fr.evaluate("()=>{const d=document.getElementById('dobInput');d.value='1990-05-15';d.dispatchEvent(new Event('input',{bubbles:true}));}")
    fr.evaluate("()=>{const t=document.querySelector('#birthForm input[type=time]');if(t){t.value='10:30';t.dispatchEvent(new Event('input',{bubbles:true}));}}")
    fr.click('.lp-tools [data-m=map]');pg.wait_for_timeout(400);pg.fill('#lpQ','Mumbai');pg.wait_for_timeout(1000);pg.keyboard.press('Enter');pg.wait_for_timeout(500);pg.click('#lpUse');pg.wait_for_timeout(300)
    fr.click('#castBtn');pg.wait_for_timeout(5000)
    fr.evaluate("()=>{window.__open=[];window.open=(u)=>{window.__open.push(u);}}")
    fr.click('#quickSearchBtn');pg.wait_for_timeout(500);pg.screenshot(path='ai_d.png')
    print('topics',fr.evaluate("()=>document.querySelectorAll('.srch-topics button').length"))
    fr.click('[data-ask="0"]');pg.wait_for_timeout(300)
    u=fr.evaluate("()=>window.__open[0]");import urllib.parse as up
    q=up.parse_qs(up.urlparse(u).query);print(len(u),q.get('udm'));print(q['q'][0])
    fr.fill('#srchIn','spouse');pg.wait_for_timeout(200)
    print(fr.evaluate("()=>[...document.querySelectorAll('.srch-row b')].slice(0,3).map(x=>x.textContent)"))
    # all topics build w/o error
    print('all',fr.evaluate("()=>SRCH_TOPICS.map(t=>srchBrief(t).length).join(',')"))
    print(fr.evaluate("()=>srchBrief(SRCH_TOPICS[4])"))
    print('ERR',errs);b.close()

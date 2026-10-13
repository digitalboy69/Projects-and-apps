from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':1280,'height':800},permissions=['clipboard-read','clipboard-write']);pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append('PE '+str(e)));pg.on("console",lambda m:errs.append('C '+m.text) if m.type=='error' else None)
    pg.goto("file:///home/claude/w/srcN.html");pg.wait_for_timeout(800)
    def S(): return pg.evaluate("()=>{const s=__np.S();return {notes:s.notes.length,preds:s.preds.length,sel:__np.ui.sel}}")
    print('start',S())
    pg.screenshot(path='n_home.png')
    # open welcome note
    pg.click('.it'); pg.wait_for_timeout(300); pg.screenshot(path='n_note.png')
    # new note, type, format
    pg.click('#bNew');pg.wait_for_timeout(200);pg.keyboard.type('My first case');pg.click('#ed');pg.keyboard.type('# Heading here')
    pg.keyboard.press('Enter');pg.keyboard.type('- bullet one');pg.keyboard.press('Enter');pg.keyboard.type('bullet two');pg.keyboard.press('Enter');pg.keyboard.press('Enter')
    pg.keyboard.type('[] task alpha');pg.keyboard.press('Enter');pg.keyboard.type('task beta');
    pg.wait_for_timeout(600)
    print('html',pg.evaluate("()=>document.getElementById('ed').innerHTML")[:400])
    # astro palette insert
    pg.click('[data-a=pal]');pg.wait_for_timeout(200);pg.click('#pal .grid button >> nth=0');pg.click('[data-pt="1"]');pg.click('#pal .grid button >> nth=4')
    pg.keyboard.press('Escape')
    # checklist toggle: click left of first li
    pg.evaluate("()=>{const li=document.querySelector('#ed ul.cl li');const r=li.getBoundingClientRect();window.__p=[r.left+8,r.top+10]}")
    pt=pg.evaluate("()=>window.__p");pg.mouse.click(pt[0],pt[1]);pg.wait_for_timeout(200)
    print('done li',pg.evaluate("()=>document.querySelectorAll('#ed ul.cl li.done').length"))
    # table
    pg.click('[data-a=table]');pg.click('[data-a=mktable]')
    # chart
    pg.click('[data-a=chart]');pg.fill('#cin2 input[data-k="1"]','Su Me');pg.fill('#cin2 input[data-k="4"]','Mo');pg.fill('#ct','Rashi test');pg.click('[data-a=doChart]');pg.wait_for_timeout(300)
    pg.click('[data-a=chart]');pg.select_option('#cs','s');pg.select_option('#cl','5');pg.fill('#cin2 input[data-k="5"]','Su Ma');pg.click('[data-a=doChart]')
    pg.wait_for_timeout(700)
    print('figs',pg.evaluate("()=>document.querySelectorAll('#ed figure svg').length"),S())
    pg.screenshot(path='n_edit.png')
    # callout, client
    pg.click('[data-a=callout]');pg.click('[data-ct=warn]')
    pg.click('[data-a=clientT]');pg.fill('[data-cf=name]','Ananya');pg.fill('[data-cf=pob]','Pune')
    pg.click('[data-a=pin]')
    pg.fill('#tgadd','vip');pg.press('#tgadd','Enter')
    # wiki link: make second note then link
    # prediction from selection
    pg.click('#ed');pg.keyboard.press('Control+a');pg.click('[data-a=pred]');pg.fill('#pt','Job change in 2027');pg.fill('#pd','2026-01-01');pg.click('[data-a=savepred]')
    pg.wait_for_timeout(300);print('preds',S())
    # views
    for v in ['tasks','pred','home','trash','pinned']:
        pg.click(f'.nv[data-v="{v}"]');pg.wait_for_timeout(250)
    pg.click('.nv[data-v="tasks"]');pg.wait_for_timeout(200);print('task cards',pg.evaluate("()=>document.querySelectorAll('.card').length"))
    pg.screenshot(path='n_tasks.png')
    pg.click('.nv[data-v="pred"]');pg.wait_for_timeout(200);pg.click('[data-a=editpred]');pg.select_option('#ps','hit');pg.click('[data-a=savepred]');pg.screenshot(path='n_pred.png')
    # search
    pg.click('.nv[data-v="all"]');pg.fill('#q','Ananya');pg.wait_for_timeout(200);print('search res',pg.evaluate("()=>document.querySelectorAll('#items .it').length"));pg.fill('#q','')
    # templates
    pg.click('#bTpl');pg.wait_for_timeout(200);pg.screenshot(path='n_tpl.png')
    for t in ['consult','analysis','prashna','muhurta','remedy','transit','yoga','panch','call','study','blank']:
        pg.click('#bTpl') if not pg.evaluate("()=>document.getElementById('ov').classList.contains('on')") else None
        pg.click(f'[data-tpl={t}]');pg.wait_for_timeout(120)
    print('after tpl',S())
    # command palette
    pg.keyboard.press('Control+k');pg.wait_for_timeout(200);pg.keyboard.type('set');pg.wait_for_timeout(200);print('cmd',pg.evaluate("()=>[document.getElementById('ov').className,document.getElementById('ovc').className,[...document.querySelectorAll('#cres button')].map(b=>b.textContent.slice(0,20))]"));pg.keyboard.press('Enter');pg.wait_for_timeout(300);pg.screenshot(path='n_set.png')
    pg.click('[data-a=close]')
    # export/more
    pg.click('.it >> nth=2');pg.click('[data-a=more]');pg.screenshot(path='n_more.png')
    with pg.expect_download() as d: pg.click('[data-a=exp][data-t=md]')
    print('dl',d.value.suggested_filename)
    pg.click('[data-a=more]');pg.click('[data-a=hist]');pg.click('[data-a=close]')
    # trash / restore
    pg.click('[data-a=more]');pg.click('[data-a=trash]');pg.click('.nv[data-v="trash"]');pg.wait_for_timeout(200);print('trash',pg.evaluate("()=>document.querySelectorAll('#items .it').length"))
    pg.click('.it');pg.click('[data-a=restore]')
    # theme / pin lock
    pg.click('#bSet');pg.select_option('#sth','parch');pg.select_option('#sac','teal');pg.fill('#pin1','1234');pg.click('[data-a=setpin]');pg.wait_for_timeout(400)
    pg.click('[data-a=close]');pg.screenshot(path='n_light.png')
    pg.click('#bLock');pg.fill('#lpin','1234');pg.wait_for_timeout(700);print('unlocked',not pg.evaluate("()=>document.getElementById('lock').classList.contains('on')"))
    # persistence
    pg.reload();pg.wait_for_timeout(800);print('after reload lock',pg.evaluate("()=>document.getElementById('lock').classList.contains('on')"));pg.fill('#lpin','1234');pg.wait_for_timeout(700);print('persist',S())
    print('errs',errs[:8])
    # mobile
    pg.set_viewport_size({'width':390,'height':800});pg.wait_for_timeout(300);pg.screenshot(path='n_mob.png')
    b.close()

exec(open('trs.py').read().split("def run")[0])
import re
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':800});ctx.route('**/*',handler);pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(3500)
    fr=[f for f in pg.frames if 'Rectification' in (f.title() or '')][0]
    fr.click('#inShareBtn');print('empty:',fr.inner_text('#inShareN'))
    fr.click('#inEx');pg.wait_for_timeout(600);fr.click('#inShareBtn');pg.wait_for_timeout(500)
    pg.screenshot(path='sh.png')
    url=fr.evaluate("()=>document.querySelector('.sh-qr')&&1")
    print('qr',url)
    # download QR & decode by uploading
    with pg.expect_download() as d: fr.click('#shDl')
    d.value.save_as('qr.png')
    fr.click('.sh-x');fr.click('#inScanBtn');pg.wait_for_timeout(300)
    fr.evaluate("()=>{document.getElementById('profileName').value='';}")
    fr.set_input_files('#shFile','qr.png');pg.wait_for_timeout(5000)
    print('after upload cast:',fr.evaluate("()=>[currentProfileForExport&&currentProfileForExport.name,currentProfileForExport&&currentProfileForExport.dob,currentProfileForExport&&currentProfileForExport.tob]"))
    print(errs)

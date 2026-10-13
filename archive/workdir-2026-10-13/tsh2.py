exec(open('trs.py').read().split("def run")[0])
import json,base64
a=[1,'Meera','1993-08-21','06:40',18.52,73.8567,5.5,'Pune, Maharashtra']
tok=base64.urlsafe_b64encode(json.dumps(a).encode()).decode().rstrip('=')
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':800});ctx.route('**/*',handler);pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/w/out_plain.html#c="+tok);pg.wait_for_timeout(6500)
    fr=[f for f in pg.frames if 'Rectification' in (f.title() or '')][0]
    print(fr.evaluate("()=>[currentProfileForExport&&currentProfileForExport.name,currentProfileForExport&&currentProfileForExport.dob,currentProfileForExport&&currentProfileForExport.place]"),errs)
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(3500)
    pg.screenshot(path='in_share.png',full_page=True)

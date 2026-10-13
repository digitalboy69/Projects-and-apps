exec(open('trs.py').read().split("def run")[0])
import json,base64
a=[1,'Meera','1993-08-21','06:40',18.52,73.8567,5.5,'Pune, Maharashtra']
tok=base64.urlsafe_b64encode(json.dumps(a).encode()).decode().rstrip('=')
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':800});ctx.route('**/*',handler);pg=ctx.new_page()
    pg.goto("file:///home/claude/w/out_plain.html#c="+tok);pg.wait_for_timeout(5000)
    fr=[f for f in pg.frames if 'Rectification' in (f.title() or '')][0]
    print(fr.evaluate("()=>{try{return [window.parent.location.hash,location.href,profileName.value,typeof fromText]}catch(e){return String(e)}}"))
    print(pg.url)

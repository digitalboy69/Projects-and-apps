exec(open('trs.py').read().split("def run")[0])
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':800});T=open('three.r128.js','rb').read()
    def h2(r):
        if 'three.min.js' in r.request.url: return r.fulfill(status=200,content_type='application/javascript',body=T)
        return handler(r)
    ctx.route('**/*',h2);pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(5000)
    pg.screenshot(path='ld0.png')
    pg.evaluate("()=>document.querySelector('.sw-item[data-act=A]').click()") if pg.query_selector('.sw-item[data-act=A]') else None
    import time
    for i in range(2):
        pg.wait_for_timeout(500);print(i,round(__import__('time').time()%100,1),pg.evaluate("()=>[document.getElementById('load').className,document.getElementById('loadTxt').textContent]"))
    pg.screenshot(path='ld1.png');print(errs)

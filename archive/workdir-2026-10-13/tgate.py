exec(open('trs.py').read().split("def run")[0])
import json,gzip,base64,os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
key=bytes.fromhex(open('.appkey').read().strip())
raw=base64.b64decode(open('gate/app.enc').read()); html=gzip.decompress(AESGCM(key).decrypt(raw[:12],raw[12:],None))
print('decrypt ok',len(html), html[:15])
MODE={'v':'ok'}
def sb(r):
    u=r.request.url; m=r.request.method
    H={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}
    J=lambda o,s=200:r.fulfill(status=s,content_type='application/json',headers=H,body=json.dumps(o))
    if m=='OPTIONS': return r.fulfill(status=204,headers=H)
    if '/auth/v1/token' in u: return J({'access_token':'tok','refresh_token':'r','expires_in':3600,'user':{'id':'u1','email':'a@b.com'}})
    if '/functions/v1/get-app' in u:
        if MODE['v']=='ok': return r.fulfill(status=200,content_type='text/html',headers=H,body=html)
        return J({'reason':MODE['v']},402)
    if '/rest/v1/' in u: return J([])
    return J({},404)
with sync_playwright() as p:
    b=p.chromium.launch()
    for mode in ('trial_over','ok'):
        MODE['v']=mode
        ctx=b.new_context(viewport={'width':390,'height':800});ctx.route('**/*',handler);ctx.route('**/*.supabase.co/**',sb);pg=ctx.new_page();errs=[]
        pg.on("pageerror",lambda e:errs.append(str(e)))
        pg.goto("file:///home/claude/w/gate/index.html#c=abc");pg.wait_for_timeout(500)
        if mode=='trial_over': pg.screenshot(path='g1.png')
        pg.fill('#em','a@b.com');pg.fill('#pw','secret1');pg.click('#go');pg.wait_for_timeout(5000 if mode=='ok' else 1500)
        if mode=='trial_over': pg.screenshot(path='g2.png');print('locked:',pg.inner_text('#lkT'))
        else:
            print('title',pg.title(),'frames',len(pg.frames),'sess in ls:',pg.evaluate("()=>!!localStorage.getItem('vax_sb_session')"));pg.screenshot(path='g3.png')
        print(mode,errs[:3])

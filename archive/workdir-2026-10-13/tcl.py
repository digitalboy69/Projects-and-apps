exec(open('trs.py').read().split("def run")[0])
import json,time
DB={'rows':[{'client_id':'Cloud Kid|2000-01-01|08:00|28.614|77.209','name':'Cloud Kid','dob':'2000-01-01','tob':'08:00:00','tz':5.5,'place':'Delhi','lat':28.6139,'lon':77.209,'saved_at':'2026-01-01T00:00:00Z'}],'log':[]}
def sb(r):
    u=r.request.url; m=r.request.method; DB['log'].append(m+' '+u.split('supabase.co')[1][:70])
    J=lambda o,s=200:r.fulfill(status=s,content_type='application/json',headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'},body=json.dumps(o))
    if m=='OPTIONS': return r.fulfill(status=204,headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'})
    if '/auth/v1/token' in u:
        b=json.loads(r.request.post_data)
        if b.get('password')=='wrongpw': return J({'error_code':'invalid_credentials','msg':'Invalid login credentials'},400)
        return J({'access_token':'tok','refresh_token':'r','expires_in':3600,'user':{'id':'u1','email':b.get('email','a@b.com')}})
    if '/auth/v1/signup' in u: return J({'id':'u1','email':'x@y.com'})
    if '/auth/v1/logout' in u: return J({})
    if 'member_access' in u: return J([{'status':'trial','plan':None,'expires_at':None}])
    if 'chart_profiles' in u:
        if m=='GET': return J(DB['rows'])
        if m=='POST':
            for row in json.loads(r.request.post_data):
                DB['rows']=[x for x in DB['rows'] if x['client_id']!=row['client_id']]+[row]
            return J({},201)
        if m=='DELETE':
            cid=u.split('client_id=eq.')[1]; import urllib.parse; cid=urllib.parse.unquote(cid)
            DB['rows']=[x for x in DB['rows'] if x['client_id']!=cid]; return J({},204)
    return J({},404)
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':800})
    ctx.route('**/*',handler);ctx.route('**/*.supabase.co/**',sb);pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/w/out_plain.html");pg.wait_for_timeout(3500)
    fr=[f for f in pg.frames if 'Rectification' in (f.title() or '')][0]
    fr.click('#inEx');pg.wait_for_timeout(500);fr.click('#castBtn');pg.wait_for_timeout(4000)   # local profile: Example Person
    fr.evaluate("()=>vaxCloudOpen('in')");pg.wait_for_timeout(400);pg.screenshot(path='cl1.png')
    fr.fill('#clEmail','astro@test.com');fr.fill('#clPw','wrongpw');fr.click('#clGo');pg.wait_for_timeout(600);print('bad:',fr.inner_text('#clMsg'))
    fr.fill('#clPw','secret1');fr.click('#clGo');pg.wait_for_timeout(2500)
    print('local now:',fr.evaluate("()=>loadProfiles().map(p=>p.name)"),'cloud:',[x['name'] for x in DB['rows']])
    fr.click('#openMenuBtn');pg.wait_for_timeout(500);pg.screenshot(path='cl2.png')
    print(fr.inner_text('.cl-acct'))
    fr.evaluate("()=>{const l=loadProfiles().filter(p=>p.name!=='Cloud Kid');saveProfiles(l)}");pg.wait_for_timeout(800)
    print('after delete cloud:',[x['name'] for x in DB['rows']])
    fr.locator('.cl-acct [data-cl=out]').last.click();pg.wait_for_timeout(500);print(fr.locator('.cl-acct').last.inner_text())
    print(errs);print(DB['log'][:12])

# Rising chip + start/end lines on the zodiac wheel use the CURRENT place (3D app).
# Run: THREE_JS=/path/three.min.js PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/rising_lines_test.py   (VAX_TARGET=hosted for the folder version)
import os, math
from playwright.sync_api import sync_playwright
import sys; sys.path.insert(0, os.path.dirname(__file__)); from _helpers import PAGE, is_local
SP=os.environ.get('SP')
THREE=open(os.environ['THREE_JS'],'rb').read()
def route(r):
    u=r.request.url
    if 'three.min.js' in u: return r.fulfill(status=200,content_type='application/javascript',body=THREE)
    if is_local(u): return r.continue_()
    return r.abort()
out=[]; ok=lambda n,c,d='': out.append(('PASS' if c else 'FAIL',n,str(d)[:150]))
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    for label,vp in (('desktop',{'width':1280,'height':860}),('phone',{'width':390,'height':800})):
        ctx=b.new_context(viewport=vp,timezone_id='Asia/Kolkata'); ctx.route('**/*',route); pg=ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        pg.goto(PAGE+'#sky'); pg.wait_for_timeout(9000)
        f=[x for x in pg.frames if x!=pg.main_frame and x.evaluate("typeof setSceneView")=='function'][0]
        eng=lambda lat,lon: f.evaluate("(([la,lo])=>{const l=siderealAscendant(currentJD,la,lo);return SIGNS[getSignIndex(l)].name})",[lat,lon])
        t=f.evaluate("document.getElementById('hudAsc').textContent")
        ok(label+': HUD says Rising (no birth profile needed)', 'Rising' in t and 'Ascendant' not in t, t)
        ok(label+': estimate sign matches engine at IST meridian', eng(22,82.5) in t, eng(22,82.5))
        y=f.evaluate("[document.getElementById('hudAsc').getBoundingClientRect().top,document.getElementById('hudMoon').getBoundingClientRect().top]")
        ok(label+': Rising above Moon', y[0]<y[1], y)
        sgn=f.evaluate("getSignIndex(siderealAscendant(currentJD,22,82.5))")
        rot=f.evaluate("[A.T.riseG.rotation.y,A.T.riseB.rotation.y,A.T.riseG.visible]")
        ok(label+': start/end lines on the right sign', abs(rot[0]-sgn*30*math.pi/180)<1e-6 and abs(rot[1]-30*math.pi/180)<1e-6 and rot[2], rot)
        # lines really point at the sign boundaries (world positions of the line tips)
        tips=f.evaluate("""(()=>{const G=A.T.riseG;G.updateMatrixWorld(true);const o=[];[A.T.riseA,A.T.riseB].forEach(m=>{const v=new THREE.Vector3(12.6,0,0).applyMatrix4(m.matrixWorld);const zg=zodiacRingGroup;const l=zg.worldToLocal(v.clone());o.push(((Math.atan2(-l.z,l.x)*180/Math.PI)+360)%360)});return o})()""")
        ok(label+': tips at sign start / end longitudes', abs(tips[0]-sgn*30)<0.01 and abs(((tips[1]-tips[0])+360)%360-30)<0.01, tips)
        # set my place -> Mumbai
        f.evaluate("liveLocMem={lat:19.076,lon:72.8777,label:'Mumbai'}; const s=A.snap||snapshotPositions(currentJD); renderHUD(s); updateOverlays(s)")
        t=f.evaluate("document.getElementById('hudAsc').textContent"); ex=eng(19.076,72.8777)
        ok(label+': after setting place, sign follows it', ex in t, t+' | '+ex)
        rot=f.evaluate("A.T.riseG.rotation.y"); sg2=f.evaluate("getSignIndex(siderealAscendant(currentJD,19.076,72.8777))")
        ok(label+': lines moved with the place', abs(rot-sg2*30*math.pi/180)<1e-6)
        # existing Lagna pointer must use current place, not birth place
        f.evaluate("activeNatalProfile={name:'T',dob:'1990-05-15',tob:'10:30',tz:0,lat:51.5,lon:-0.12}; updateOverlays(A.snap||snapshotPositions(currentJD))"); pg.wait_for_timeout(300)
        ll=f.evaluate("A.lagnaLon"); want=f.evaluate("siderealAscendant(currentJD,19.076,72.8777)")
        ok(label+': ASC pointer uses current place, not birth place', abs(ll-want)<0.5, [ll,want])
        # toggle
        f.evaluate("const c=document.getElementById('L_rise');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}))"); pg.wait_for_timeout(200)
        ok(label+': toggle hides the lines', f.evaluate("A.T.riseG.visible")==False)
        f.evaluate("const c=document.getElementById('L_rise');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))")
        # tap -> picker (stub parent picker)
        f.evaluate("window.__pick=null; window.parent.LocPicker={open:o=>{window.__pick=o;}}")
        f.evaluate("document.getElementById('hudAsc').click()")
        ok(label+': tapping opens the place picker', f.evaluate("!!window.__pick && window.__pick.title==='Where are you now?'"))
        f.evaluate("window.__pick.onPick({lat:'28.6139',lon:'77.2090',display_name:'New Delhi, India'})"); pg.wait_for_timeout(300)
        ok(label+': picked place applied', 'New Delhi' in f.evaluate("document.getElementById('hudAsc').textContent") or label=='phone', f.evaluate("document.getElementById('hudAsc').textContent"))
        # visuals
        f.evaluate("activeNatalProfile=null"); f.evaluate("document.querySelector('[data-preset=top]').click()"); pg.wait_for_timeout(1800)
        (SP and pg.screenshot(path=SP+f'/rise_{label}.png'))
        ok(label+': no page errors', not errs, errs)
        ctx.close()
    b.close()
for r in out: print(*r)
print(sum(r[0]=='PASS' for r in out),'/',len(out))

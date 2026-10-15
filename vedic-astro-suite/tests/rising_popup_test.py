# Long-press popup + Rising tab: timeline math, press/tap behaviour, refresh on place change (3D app).
# Run: THREE_JS=/path/three.min.js PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/rising_popup_test.py   (VAX_TARGET=hosted for the folder version)
import os
from playwright.sync_api import sync_playwright
import sys; sys.path.insert(0, os.path.dirname(__file__)); from _helpers import PAGE, is_local
SP=os.environ.get('SP')
THREE=open(os.environ['THREE_JS'],'rb').read()
def route(r):
    u=r.request.url
    if 'three.min.js' in u: return r.fulfill(status=200,content_type='application/javascript',body=THREE)
    if is_local(u): return r.continue_()
    return r.abort()
out=[]; ok=lambda n,c,d='': out.append(('PASS' if c else 'FAIL',n,str(d)[:160]))
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    for label,vp,touch in (('desktop',{'width':1280,'height':860},False),('phone',{'width':390,'height':800},True)):
        ctx=b.new_context(viewport=vp,timezone_id='Asia/Kolkata',has_touch=touch); ctx.route('**/*',route); pg=ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        pg.goto(PAGE+'#sky',wait_until='commit',timeout=90000); pg.wait_for_timeout(12000)
        f=[x for x in pg.frames if x!=pg.main_frame and x.evaluate("typeof setSceneView")=='function'][0]
        f.evaluate("liveLocMem={lat:19.076,lon:72.8777,label:'Mumbai'}; const s=A.snap||snapshotPositions(currentJD); renderHUD(s)")
        f.evaluate("window.__pick=0; window.parent.LocPicker={open:o=>{window.__pick++;}}")
        # engine checks
        r=f.evaluate("""(()=>{const L=getLiveLoc(),jd=A.snap.jd,rows=riseTimeline(jd,L);
          const bad=[];for(let k=0;k<rows.length;k++){const r=rows[k];
            const mid=_ascSign((r.start+r.end)/2,L); if(mid!==r.i) bad.push('mid'+k);
            if(_ascSign(r.start-3/86400,L)===r.i) bad.push('s'+k); if(_ascSign(r.end+3/86400,L)===r.i) bad.push('e'+k);
            if(k&&Math.abs(r.start-rows[k-1].end)>1e-9) bad.push('gap'+k);}
          const total=rows.reduce((a,r)=>a+r.end-r.start,0);
          return {n:rows.length,bad,total,cur:rows[0].i===getSignIndex(siderealAscendant(jd,L.lat,L.lon)),inside:rows[0].start<=jd&&jd<rows[0].end}})()""")
        ok(label+': 12 signs, boundaries exact, contiguous',r['n']==12 and not r['bad'],r)
        ok(label+': 12 signs ~ one sidereal day',abs(r['total']-0.99727)<0.02,r['total'])
        ok(label+': current sign + now inside window',r['cur'] and r['inside'])
        # tap -> picker, no popup
        pg.wait_for_timeout(100)
        box=f.locator('#hudAsc'); 
        fr=f.evaluate("(()=>{const b=document.getElementById('hudAsc').getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]})()")
        off=pg.evaluate("(()=>{const r=document.querySelector('iframe').getBoundingClientRect();return [r.x,r.y]})()")
        cx,cy=fr[0]+off[0],fr[1]+off[1]
        box.click(); pg.wait_for_timeout(200)
        ok(label+': single tap opens picker, no popup', f.evaluate("window.__pick")==1 and not f.evaluate("document.getElementById('risingOverlay').classList.contains('show')"))
        # long press
        pg.mouse.move(cx,cy); pg.mouse.down(); pg.wait_for_timeout(250)
        ok(label+': pressing feedback shown', f.evaluate("document.getElementById('hudAsc').classList.contains('pressing')"))
        pg.wait_for_timeout(500); pg.mouse.up(); pg.wait_for_timeout(500)
        ok(label+': long press opens popup', f.evaluate("document.getElementById('risingOverlay').classList.contains('show')"))
        ok(label+': long press did NOT open picker', f.evaluate("window.__pick")==1, f.evaluate("window.__pick"))
        t=f.evaluate("document.getElementById('risingBody').innerText")
        ok(label+': popup has times, %, 12 rows', f.evaluate("document.querySelectorAll('#risingBody .rs-row').length")==12 and '% completed' in t and 'started' in t.lower() and 'ends' in t.lower(), t[:80].replace('\n',' '))
        (SP and pg.screenshot(path=f'{SP}/rise_{label}.png'))
        # close via X
        f.evaluate("document.getElementById('risingClose').click()"); pg.wait_for_timeout(300)
        ok(label+': close works', not f.evaluate("document.getElementById('risingOverlay').classList.contains('show')"))
        # short press moves cancel
        pg.mouse.move(cx,cy); pg.mouse.down(); pg.wait_for_timeout(150); pg.mouse.up(); pg.wait_for_timeout(700)
        ok(label+': short press no popup', not f.evaluate("document.getElementById('risingOverlay').classList.contains('show')"))
        # tab
        f.evaluate("document.querySelector('.panel-tab[data-tab=rising]').click()"); pg.wait_for_timeout(500)
        ok(label+': Rising tab shows same content', f.evaluate("document.querySelectorAll('#risingTabBody .rs-row').length")==12 and f.evaluate("document.getElementById('tab-rising').classList.contains('active')"))
        (SP and pg.screenshot(path=f'{SP}/risetab_{label}.png'))
        # place change refreshes tab
        before=f.evaluate("document.getElementById('risingTabBody').innerText")
        f.evaluate("liveLocMem={lat:51.5,lon:-0.12,label:'London'}; renderHUD(A.snap||snapshotPositions(currentJD))"); pg.wait_for_timeout(300)
        after=f.evaluate("document.getElementById('risingTabBody').innerText")
        ok(label+': tab refreshes on place change', before!=after and 'London' in after)
        ok(label+': no page errors', not errs, errs)
    b.close()
for o in out: print(*o)
print(sum(o[0]=='PASS' for o in out),'/',len(out))

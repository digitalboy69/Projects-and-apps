# Test of the Workspace Point Finder (js/163 AWP + the finder cards and view): points are placed correctly in every divisional chart,
# for two charts, and the finder / routine steps show the same answer. Run: python3 tests/workspace_points_test.py [shots_dir]
import functools, http.server, os, socketserver, sys, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
SHOTS = sys.argv[1] if len(sys.argv) > 1 else None
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append(bool(c)); print(('PASS ' if c else 'FAIL ') + n + (' - ' + str(d)[:200] if d and not c else ''))
CAST = "(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}"
CH = [dict(name='Asha', dob='1995-03-14', tob='11:00', place='Hyderabad', lat=17.385, lon=78.4867, tz=5.5), dict(name='Ravi', dob='1982-07-02', tob='06:40', place='Delhi', lat=28.61, lon=77.21, tz=5.5), dict(name='Kai', dob='1970-12-30', tob='22:10', place='Reykjavik', lat=64.15, lon=-21.94, tz=0)]
def shot(pg, n):
    if SHOTS: pg.screenshot(path=os.path.join(SHOTS, n + '.png'))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    for W in (390, 360):
        pg = b.new_page(viewport={'width': W, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
        pg.goto(PAGE); pg.wait_for_selector('#birthForm')
        aks = []
        for ci, ch in enumerate(CH):
            pg.evaluate(CAST, ch); pg.wait_for_selector('#results.show', timeout=15000)
            r = pg.evaluate("""()=>{const c=currentChartForModal,bad=[],P=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'],P7=P.slice(0,7);
              AWP.keys(c).forEach(k=>P.forEach(n=>{const a=AWP.locate(c,n,k).sign,v=c.vargas[k].planetVargaSign[n],d=calcVarga(k,c.planets[n].longitude);if(a!==v||v!==d)bad.push(k+n+':'+a+'/'+v+'/'+d)}));
              const ak=AWP.resolve('role:AK',c).planet,dk=AWP.resolve('role:DK',c).planet,mx=P7.slice().sort((a,b)=>c.planets[b].degInSign-c.planets[a].degInSign),
                l7=AWP.resolve('lord:7',c).planet,l1=AWP.resolve('lord:1',c).planet;
              const lg=AWP.locate(c,'lagna','D9');
              return {bad:bad.slice(0,4),nb:bad.length,ak,dk,akOk:ak===mx[0],dkOk:dk===mx[6],l7ok:l7===c.vargas.D1.houses[6].signLord,l1ok:l1===c.vargas.D1.houses[0].signLord,lagnaOk:lg.sign===c.vargas.D9.ascendantSign&&lg.house===1,n:AWP.keys(c).length,
                d9:AWP.locate(c,'role:AK','D9'),sg:AWP.locate(c,'sg:AL','D9').err,card:AWW.render('locate',c,window.__vgProf,{subject:'role:AK',varga:'D9',style:'north'}).replace(/<[^>]+>/g,' ')}}""")
            ok('[%d] chart %d: every planet in every chart agrees with the engine tables' % (W, ci + 1), r['nb'] == 0 and r['n'] >= 22, r['bad'])
            ok('[%d] chart %d: AK is the highest degree, DK the lowest, 7th and 1st lords match the house table' % (W, ci + 1), r['akOk'] and r['dkOk'] and r['l7ok'] and r['l1ok'], r)
            ok('[%d] chart %d: Lagna in D9 is the D9 ascendant, sign-only points refuse D9 honestly' % (W, ci + 1), r['lagnaOk'] and r['sg'] == 'sign-only')
            sign9 = pg.evaluate("(a)=>AWP.SIGN[a]", r['d9']['sign'])
            ok('[%d] chart %d: the AK card names the D9 sign and house' % (W, ci + 1), sign9 in r['card'] and (str(r['d9']['house']) in r['card']), (sign9, r['card'][:200]))
            aks.append((r['ak'], sign9))
        ok('[%d] different charts give different answers' % W, len(set(aks)) > 1, aks)
        # the finder view
        pg.evaluate(CAST, CH[0]); pg.wait_for_selector('#results.show', timeout=15000)
        pg.click('.app-tab[data-group=workspace]'); pg.wait_for_selector('.aw-hero'); pg.click('[data-act=finder]'); pg.wait_for_selector('#awFindOut .aw-fc.hi', timeout=6000); pg.wait_for_timeout(500)
        exp = pg.evaluate("(()=>{const c=currentChartForModal,l=AWP.locate(c,'role:AK','D9');return AWP.SIGN[l.sign]})()")
        ok('[%d] finder opens on Atmakaraka in D9 and shows its sign' % W, pg.inner_text('#awFindOut .aw-fc.hi b') == exp, (pg.inner_text('#awFindOut .aw-fc.hi b'), exp))
        ok('[%d] the point is lit on the chart' % W, pg.locator('#awFindOut .aw-hl').count() == 1)
        shot(pg, '%d-finder' % W)
        pg.click('[data-act=fquick][data-v=role\\:DK]'); pg.wait_for_timeout(300)
        expd = pg.evaluate("(()=>{const c=currentChartForModal;return AWP.SIGN[AWP.locate(c,'role:DK','D9').sign]})()")
        ok('[%d] Darakaraka quick button updates the answer' % W, pg.inner_text('#awFindOut .aw-fc.hi b') == expd)
        pg.select_option('#awFVarga', 'D10'); pg.wait_for_timeout(300)
        ok('[%d] changing the chart to D10 updates the answer' % W, 'D10' in pg.inner_text('#awFindOut .aw-fc.hi small'))
        pg.select_option('#awFSubj', 'pt:gulika'); pg.wait_for_timeout(300)
        ok('[%d] a special point (Gulika) is found too' % W, pg.locator('#awFindOut .aw-fc.hi').count() == 1 and 'Gulika' in pg.inner_text('#awFindOut'))
        pg.click('[data-act=fmode][data-v=all]'); pg.wait_for_timeout(400)
        ok('[%d] all-charts mode lists every chart with a strip' % W, pg.locator('#awFindOut .aw-cell').count() >= 22 and pg.locator('#awFindOut tbody tr').count() >= 22, pg.locator('#awFindOut .aw-cell').count())
        shot(pg, '%d-finder-all' % W)
        pg.click('[data-act=addtopick]'); pg.wait_for_selector('[data-act=addto]'); pg.locator('[data-act=addto]').first.click(); pg.wait_for_timeout(300)
        ok('[%d] "Add to a routine" puts the step into the first routine' % W, pg.evaluate("AW.list().some(r=>r.steps.some(s=>s.t==='locateall'&&s.o.subject==='pt:gulika'))"))
        # a routine step with the multi-point card
        pg.click('[data-act=list]'); pg.click('[data-act=new]'); pg.wait_for_selector('#awName'); pg.click('[data-act=addstep]'); pg.fill('#awQ', 'several'); pg.click('.aw-pr[data-id=points]'); pg.wait_for_selector('#awSubj')
        pg.click('[data-act=preset][data-v^="role:AK,role:AmK"]'); pg.wait_for_timeout(400)
        ok('[%d] Karakas preset ticks all seven and the preview shows seven rows' % W, pg.locator('#awPrev tbody tr').count() == 7, pg.locator('#awPrev tbody tr').count())
        pg.select_option('select[data-opt=varga]', 'D9'); pg.wait_for_timeout(300); shot(pg, '%d-points-config' % W)
        pg.click('[data-act=savestep]'); pg.click('[data-act=run]'); pg.wait_for_selector('.aw-step.ready', timeout=8000); pg.wait_for_timeout(400)
        ok('[%d] the routine opens with the points table' % W, pg.locator('.aw-sbody tbody tr').count() == 7)
        shot(pg, '%d-points-run' % W)
        ok('[%d] no JavaScript errors' % W, not errs, errs[:2])
        pg.close()
    b.close()
print('ALL PASS' if all(res) else 'SOME FAILED'); sys.exit(0 if all(res) else 1)

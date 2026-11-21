# Browser test of "My variables" in the Workspace: built in the editor, compared with independent calculations on three charts,
# used in the Point finder and in a routine, carried by a share code. Run: python3 tests/workspace_vars_browser_test.py [shots_dir]
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
def ok(n, c, d=''): res.append(bool(c)); print(('PASS ' if c else 'FAIL ') + n + (' - ' + str(d)[:220] if d and not c else ''))
CAST = "(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}"
CH = [dict(name='Asha', dob='1995-03-14', tob='11:00', place='Hyderabad', lat=17.385, lon=78.4867, tz=5.5), dict(name='Ravi', dob='1982-07-02', tob='06:40', place='Delhi', lat=28.61, lon=77.21, tz=5.5), dict(name='Kai', dob='1970-12-30', tob='22:10', place='Reykjavik', lat=64.15, lon=-21.94, tz=0)]
CHECK = """()=>{const c=currentChartForModal,L=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'],out={};
  const byName=n=>AWV.list().find(v=>v.name===n);
  const dk=c.charaKarakas.Darakaraka.planet; out.marriage=[AWP.resolve(byName('My marriage planet').id,c).planet,L[c.planets[dk].sign]];
  out.seventh=[AWP.resolve(byName('7th lord from Moon').id,c).planet,L[(c.planets.Moon.sign+6)%12]];
  const S=c.shadbala&&c.shadbala.planets; if(S){const best=['Jupiter','Venus','Mercury'].map(n=>[n,S[n].percentOfRequired]).sort((a,b)=>b[1]-a[1])[0][0];out.best=[AWP.resolve(byName('Best benefic').id,c).planet,best]}else out.best=['nochart','nochart'];
  out.nak=[AWP.resolve(byName('Moon nakshatra lord').id,c).planet,c.planets.Moon.nakshatra.lord];
  const sg=AWP.resolve(byName('Sign 5th from Sun').id,c);out.sign=[sg.kind+':'+sg.sign,'sign:'+((c.planets.Sun.sign+4)%12)];
  const loc=AWP.locate(c,byName('My marriage planet').id,'D9');out.loc=[loc.sign,c.vargas.D9.planetVargaSign[out.marriage[1]]];
  const lc=AWP.locate(c,byName('Sign 5th from Sun').id,'D9');out.signD9=lc.err;
  return out}"""
def shot(pg, n):
    if SHOTS: pg.screenshot(path=os.path.join(SHOTS, n + '.png'))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    for W in (390, 360):
        ctx = b.new_context(viewport={'width': W, 'height': 800}); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
        pg.goto(PAGE); pg.wait_for_selector('#birthForm')
        pg.evaluate(CAST, CH[0]); pg.wait_for_selector('#results.show', timeout=15000)
        pg.click('.app-tab[data-group=workspace]'); pg.wait_for_selector('.aw-hero'); pg.wait_for_timeout(400)
        ok('[%d] My variables section shows its empty hint' % W, pg.locator('.aw-vars .aw-empty-s').count() == 1)
        shot(pg, '%d-vars-empty' % W)
        # 1. built in the editor: marriage planet = lord of the sign the Darakaraka stands in
        pg.click('[data-act=newvar]'); pg.wait_for_selector('[data-vf=name]')
        pg.fill('[data-vf=name]', 'My marriage planet'); pg.select_option('[data-vf=start]', 'role:DK')
        pg.click('[data-act=vadd]'); pg.wait_for_selector('[data-vf=op]'); pg.wait_for_timeout(300)
        ok('[%d] editor description updates in plain words' % W, 'Darakaraka, then the lord of the sign it stands in' in pg.inner_text('#awVDesc'), pg.inner_text('#awVDesc'))
        ok('[%d] live preview names the planet and where it is in D9' % W, pg.locator('#awVPrev .aw-fc.hi').count() == 1, pg.inner_text('#awVPrev')[:120])
        shot(pg, '%d-var-editor' % W)
        # 2. 7th lord from the Moon: Moon, 7th from it, lord
        pg.click('[data-act=vdone]'); pg.click('[data-act=newvar]'); pg.wait_for_selector('[data-vf=name]')
        pg.fill('[data-vf=name]', '7th lord from Moon'); pg.select_option('[data-vf=start]', 'Moon')
        pg.click('[data-act=vadd]'); pg.select_option('[data-vf=op][data-i="0"]', 'from'); pg.wait_for_selector('[data-vf=n]'); pg.select_option('[data-vf=n]', '7')
        pg.click('[data-act=vadd]'); pg.wait_for_selector('[data-vf=op][data-i="1"]'); pg.wait_for_timeout(300)
        ok('[%d] two steps in order: 7th house from it, then its lord' % W, pg.evaluate("AWV.list()[0].steps.map(s=>s.op+(s.n||'')).join()") == 'from7,lord')
        # 3. pick among benefics minus the Moon
        pg.click('[data-act=vdone]'); pg.click('[data-act=newvar]'); pg.wait_for_selector('[data-vf=name]')
        pg.fill('[data-vf=name]', 'Best benefic'); pg.click('[data-act=vmode][data-v=pick]'); pg.wait_for_selector('#awVAmong')
        pg.click('[data-act=vpreset][data-v="Jupiter,Venus,Mercury,Moon"]'); pg.click('#awVAmong [data-act=vtoggle][data-v=Moon]'); pg.wait_for_timeout(300)
        ok('[%d] pick set holds Jupiter, Venus, Mercury' % W, pg.evaluate("AWV.list()[0].pick.among") == 'Jupiter,Venus,Mercury', pg.evaluate("AWV.list()[0].pick.among"))
        shot(pg, '%d-var-pick' % W)
        pg.evaluate("AWV.save(AWV.sanitize({name:'Moon nakshatra lord',start:'Moon',steps:[{op:'nak'}]}));AWV.save(AWV.sanitize({name:'Sign 5th from Sun',start:'Sun',steps:[{op:'from',n:5}]}))")
        pg.click('[data-act=vdone]'); pg.wait_for_selector('.aw-vc'); pg.wait_for_timeout(300)
        ok('[%d] five variables listed with plain descriptions and results' % W, pg.locator('.aw-vc').count() == 5 and pg.locator('.aw-vc em').count() == 5, pg.locator('.aw-vc').count())
        shot(pg, '%d-vars-list' % W)
        # independent comparison on three charts
        for ci, ch in enumerate(CH):
            pg.evaluate(CAST, ch); pg.wait_for_selector('#results.show', timeout=15000)
            r = pg.evaluate(CHECK)
            ok('[%d] chart %d: marriage planet = lord of the DK sign' % (W, ci + 1), r['marriage'][0] == r['marriage'][1], r['marriage'])
            ok('[%d] chart %d: 7th lord from Moon matches' % (W, ci + 1), r['seventh'][0] == r['seventh'][1], r['seventh'])
            ok('[%d] chart %d: strongest of Jupiter, Venus, Mercury matches Shadbala' % (W, ci + 1), r['best'][0] == r['best'][1], r['best'])
            ok('[%d] chart %d: nakshatra lord of the Moon matches' % (W, ci + 1), r['nak'][0] == r['nak'][1], r['nak'])
            ok('[%d] chart %d: a sign result is the right sign, and is D1 only' % (W, ci + 1), r['sign'][0] == r['sign'][1] and r['signD9'] == 'sign-only', (r['sign'], r['signD9']))
            ok('[%d] chart %d: a variable that is a planet is placed in D9 like a built-in' % (W, ci + 1), r['loc'][0] == r['loc'][1], r['loc'])
        # used in the finder
        pg.evaluate(CAST, CH[0]); pg.wait_for_selector('#results.show', timeout=15000)
        pg.click('.app-tab[data-group=workspace]'); pg.wait_for_selector('.aw-hero'); pg.click('[data-act=finder]'); pg.wait_for_selector('#awFSubj')
        mid = pg.evaluate("AWV.list().find(v=>v.name==='My marriage planet').id")
        ok('[%d] finder picker lists My variables' % W, pg.locator('#awFSubj optgroup[label="My variables"] option').count() == 5)
        pg.select_option('#awFSubj', mid); pg.wait_for_timeout(400)
        exp = pg.evaluate("(()=>{const c=currentChartForModal,l=AWP.locate(c,'%s','D9');return AWP.SIGN[l.sign]})()" % mid)
        ok('[%d] finder shows my variable in D9' % W, pg.inner_text('#awFindOut .aw-fc.hi b') == exp and 'My marriage planet' in pg.inner_text('#awFindOut'))
        shot(pg, '%d-var-finder' % W)
        # used in a routine step, then carried by a share code into a clean browser profile
        pg.click('[data-act=list]'); pg.click('[data-act=new]'); pg.wait_for_selector('#awName'); pg.fill('#awName', 'Marriage with my planet')
        pg.click('[data-act=addstep]'); pg.fill('#awQ', 'where'); pg.click('.aw-pr[data-id=locate]'); pg.wait_for_selector('select[data-opt=subject]')
        pg.select_option('select[data-opt=subject]', mid); pg.wait_for_timeout(400)
        ok('[%d] step preview works with my variable' % W, pg.locator('#awPrev .aw-fc.hi').count() == 1)
        pg.click('[data-act=savestep]'); pg.wait_for_selector('.aw-es')
        ok('[%d] step title names my variable' % W, 'My marriage planet' in pg.inner_text('.aw-es-t b'), pg.inner_text('.aw-es-t b'))
        code = pg.evaluate("(()=>{const r=AW.list().find(x=>x.name==='Marriage with my planet');return AW.encode(r,AWV.collect(r))})()")
        ctx2 = b.new_context(viewport={'width': W, 'height': 800}); pg2 = ctx2.new_page()
        pg2.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
        pg2.goto(PAGE); pg2.wait_for_selector('#birthForm', state='attached')
        pg2.evaluate(CAST, CH[1]); pg2.wait_for_selector('#results.show', timeout=15000)
        pg2.click('.app-tab[data-group=workspace]'); pg2.wait_for_selector('.aw-hero'); pg2.click('[data-act=import]'); pg2.fill('#awImp', code); pg2.click('[data-act=doimport]'); pg2.wait_for_timeout(500)
        ok('[%d] share code brings the routine and its variable' % W, pg2.evaluate("AW.list().some(r=>r.name==='Marriage with my planet')&&AWV.list().some(v=>v.name==='My marriage planet')"))
        pg2.locator('.aw-rc-main', has_text='Marriage with my planet').click(); pg2.wait_for_selector('.aw-step.ready', timeout=8000); pg2.wait_for_timeout(400)
        exp2 = pg2.evaluate("(()=>{const c=currentChartForModal,v=AWV.list().find(v=>v.name==='My marriage planet'),l=AWP.locate(c,v.id,'D9');return AWP.SIGN[l.sign]})()")
        ok('[%d] the imported routine shows the new chart own values' % W, pg2.inner_text('.aw-sbody .aw-fc.hi b') == exp2)
        shot(pg2, '%d-var-imported' % W)
        # delete with undo
        pg.click('[data-act=done]'); pg.click('[data-act=editvar] >> nth=0'); pg.wait_for_selector('[data-vf=name]'); pg.click('[data-act=vremove]'); pg.wait_for_timeout(300)
        n1 = pg.evaluate("AWV.list().length"); pg.click('.aw-toast [data-act=undo]'); pg.wait_for_timeout(300)
        ok('[%d] delete then undo brings it back' % W, n1 == 4 and pg.evaluate("AWV.list().length") == 5, n1)
        ok('[%d] no JavaScript errors' % W, not errs, errs[:2])
        ctx.close(); ctx2.close()
    b.close()
print('ALL PASS' if all(res) else 'SOME FAILED'); sys.exit(0 if all(res) else 1)

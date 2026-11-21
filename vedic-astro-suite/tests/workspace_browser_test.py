# Browser test of the Workspace tab (js/160-162): build a routine, open it on two different charts, panel steps, Board, Present, share, persistence.
# Run: python3 tests/workspace_browser_test.py [shots_dir]   (shots at 390 and 360 px are saved when a folder is given)
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
def ok(n, c, d=''): res.append(bool(c)); print(('PASS ' if c else 'FAIL ') + n + (' - ' + str(d) if d and not c else ''))
CAST = "(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}"
A = dict(name='Asha', dob='1995-03-14', tob='11:00', place='Hyderabad', lat=17.385, lon=78.4867, tz=5.5)
B = dict(name='Ravi', dob='1982-07-02', tob='06:40', place='Delhi', lat=28.61, lon=77.21, tz=5.5)
def shot(pg, n):
    if SHOTS: pg.screenshot(path=os.path.join(SHOTS, n + '.png'))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    for W in (390, 360):
        pg = b.new_page(viewport={'width': W, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
        pg.goto(PAGE); pg.wait_for_selector('#birthForm')
        ok('[%d] AW, AWW, AWUI loaded; nothing drawn before the tab opens' % W, pg.evaluate("typeof AW==='object'&&typeof AWW==='object'&&typeof AWUI==='object'&&!document.getElementById('awRoot')"))
        pg.evaluate(CAST, A); pg.wait_for_selector('#results.show', timeout=15000)
        tabs = pg.evaluate("[...document.querySelectorAll('.app-tab')].map(t=>t.dataset.group)")
        ok('[%d] Workspace tab sits just before Export' % W, tabs[-2:] == ['workspace', 'export'], tabs)
        pg.click('.app-tab[data-group=workspace]'); pg.wait_for_selector('.aw-hero'); pg.wait_for_timeout(500)
        ok('[%d] five starter routines on first open' % W, pg.locator('.aw-rc').count() == 5, pg.locator('.aw-rc').count())
        ok('[%d] first card is Quick read' % W, 'Quick read' in pg.locator('.aw-rc b').first.inner_text())
        shot(pg, '%d-list' % W)
        # build my own routine
        pg.click('[data-act=new]'); pg.wait_for_selector('#awName')
        pg.fill('#awName', 'My D9 morning'); pg.fill('#awNote', 'Always in this order')
        pg.click('[data-act=addstep]'); pg.wait_for_selector('.aw-pr'); shot(pg, '%d-picker' % W)
        pg.click('.aw-pr[data-id=chart]'); pg.wait_for_selector('#awPrev svg', timeout=5000)
        pg.select_option('select[data-opt=varga]', 'D9'); pg.wait_for_timeout(400); shot(pg, '%d-config' % W)
        ok('[%d] live preview draws the chart' % W, pg.locator('#awPrev svg').count() >= 1)
        pg.click('[data-act=savestep]'); pg.wait_for_selector('.aw-es')
        pg.click('[data-act=addstep]'); pg.fill('#awQ', 'dasha'); pg.click('.aw-pr[data-id=dashanow]'); pg.click('[data-act=savestep]')
        pg.click('[data-act=addstep]'); pg.click('[data-act=ptab][data-v=tools]'); pg.fill('#awQ', 'ashtakavarga'); pg.wait_for_selector('.aw-pr[data-act=picktool]')
        pg.locator('.aw-pr[data-act=picktool]').first.click(); pg.click('[data-act=savestep]')
        pg.click('[data-act=addstep]'); pg.click('.aw-pr[data-id=note]'); pg.fill('textarea[data-opt=text]', '- check the 7th lord\n- ask about timing'); pg.click('[data-act=savestep]')
        ok('[%d] four steps in the editor' % W, pg.locator('.aw-es').count() == 4, pg.locator('.aw-es').count())
        shot(pg, '%d-editor' % W)
        pg.click('.aw-es >> nth=3 >> [data-act=up]'); pg.wait_for_timeout(200)
        ok('[%d] step moved up' % W, 'My own note' in pg.locator('.aw-es').nth(2).inner_text())
        stored = pg.evaluate("AW.list().find(r=>r.name==='My D9 morning')")
        ok('[%d] saved in local storage with order' % W, stored and [s['t'] for s in stored['steps']][:2] == ['chart', 'dashanow'] and stored['steps'][0]['o']['varga'] == 'D9', stored)
        # run it on chart A
        pg.click('[data-act=run]'); pg.wait_for_selector('.aw-step.ready', timeout=8000); pg.wait_for_timeout(500)
        ok('[%d] flow shows step 1 of 4' % W, '1 of 4' in pg.inner_text('#awCount'))
        factsA = pg.evaluate("document.querySelector('.aw-chartbox figcaption').innerText")
        shot(pg, '%d-flow-chart' % W)
        pg.click('[data-act=next]'); pg.wait_for_timeout(500)
        domA = pg.inner_text('.aw-sbody'); shot(pg, '%d-flow-dasha' % W)
        pg.click('[data-act=next]'); pg.wait_for_timeout(500)
        ok('[%d] note step shows ticks' % W, pg.locator('.aw-nl').count() == 2, str(pg.locator('.aw-nl').count()) + pg.evaluate("JSON.stringify(AW.list().find(r=>r.name==='My D9 morning').steps.map(s=>[s.t,s.o]))+document.querySelector('.aw-sbody').innerText.slice(0,80)"))
        pg.click('[data-act=next]'); pg.wait_for_timeout(1200)
        ok('[%d] a real tool panel is moved into the step and works' % W, pg.evaluate("(()=>{const e=document.querySelector('.aw-sbody .app-panel.aw-embed');return !!e&&e.offsetHeight>100})()"))
        shot(pg, '%d-flow-tool' % W)
        pg.click('[data-act=prev]'); pg.wait_for_timeout(500)
        ok('[%d] leaving the tool step puts the panel back' % W, pg.evaluate("(()=>{const e=document.getElementById('panel-ashtakavarga');return !!e&&e.parentElement&&e.parentElement.id==='results'&&!e.classList.contains('aw-embed')})()"))
        pg.click('[data-act=layout][data-v=board]'); pg.wait_for_timeout(2500)
        ok('[%d] board shows all four steps' % W, pg.locator('.aw-step.ready').count() == 4, pg.locator('.aw-step.ready').count())
        shot(pg, '%d-board' % W)
        pg.click('[data-act=present]'); pg.wait_for_timeout(400)
        ok('[%d] present hides the app chrome' % W, pg.evaluate("getComputedStyle(document.querySelector('.app-tabbar')).display==='none'&&!document.querySelector('.aw-exit').hidden"))
        pg.click('.aw-exit'); pg.wait_for_timeout(200)
        # same routine on a different chart
        pg.click('[data-act=list]'); pg.evaluate(CAST, B); pg.wait_for_selector('#results.show', timeout=15000); pg.wait_for_timeout(500)
        pg.click('.app-tab[data-group=workspace]'); pg.wait_for_selector('.aw-hero')
        ok('[%d] my routine survived the new chart' % W, pg.locator('.aw-rc b', has_text='My D9 morning').count() == 1)
        pg.locator('.aw-rc-main', has_text='My D9 morning').click(); pg.wait_for_selector('.aw-step.ready', timeout=8000); pg.wait_for_timeout(500)
        factsB = pg.evaluate("document.querySelector('.aw-chartbox figcaption').innerText")
        ok('[%d] same routine, new chart: new values' % W, factsA != factsB and 'D9' in factsB or factsA != factsB, (factsA, factsB))
        # persistence after reload
        pg.reload(); pg.wait_for_selector('#birthForm', state='attached')
        ok('[%d] routines survive a reload' % W, pg.evaluate("AW.list().some(r=>r.name==='My D9 morning')"))
        # share code round trip
        code = pg.evaluate("AW.encode(AW.list().find(r=>r.name==='My D9 morning'))")
        ok('[%d] share code decodes' % W, pg.evaluate("(c)=>{const r=AW.decode(c);return r&&r.steps.length===4}", code))
        ok('[%d] no JavaScript errors' % W, not errs, errs[:2])
        pg.close()
    b.close()
print('ALL PASS' if all(res) else 'SOME FAILED'); sys.exit(0 if all(res) else 1)

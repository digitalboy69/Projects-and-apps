# 3D Sky alerts (js/62 SKA, css/33): pure rules + HUD pill + bottom sheet at 390 and 360, Three.js stubbed.
# Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/sky3d_sky_alerts_browser_test.py  (SK_SHOTS=dir for screenshots)
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); SHOTS = os.environ.get('SK_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/sky3d/index.html' % srv.server_address[1]
STUB = """(()=>{const mk=()=>{const f=function(){};const p=new Proxy(f,{get:(t,k)=>k===Symbol.toPrimitive?()=>0:(k==='domElement'?(window.__cv||(window.__cv=document.createElement('canvas'))):(k==='length'?0:(k==='children'?[]:p))),apply:()=>p,construct:()=>p,set:()=>true});return p};window.THREE=mk();})();"""
bad = 0
def ok(n, c, d=''):
    global bad; bad += (not c); print(('ok   ' if c else 'FAIL ') + n, '' if c else d)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'))
    for W, H in ((390, 800), (360, 640)):
        ctx = b.new_context(viewport={'width': W, 'height': H}, timezone_id='Asia/Kolkata'); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        def route(r):
            u = r.request.url
            if 'three.min.js' in u: r.fulfill(body=STUB, content_type='application/javascript')
            elif u.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')): r.continue_()
            else: r.abort()
        pg.route('**/*', route); pg.goto(PAGE); pg.wait_for_timeout(2500); T = '%dx%d: ' % (W, H)
        vis = lambda i: pg.evaluate("i=>{const e=document.getElementById(i);if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0}", i)
        # pure rules: Aries rising, Moon in Leo (5th from Aries). Jupiter in Leo (trine from both Rising and... Moon 1st), Saturn in Cancer (4th from Aries, 12th from Leo = Sade Sati rising)
        r = pg.evaluate("""()=>{const L=s=>s*30+10;const sid={Sun:L(0),Moon:L(4),Mars:L(7),Mercury:L(1),Jupiter:L(8),Venus:L(2),Saturn:L(3),Rahu:L(5),Ketu:L(11)};
          const a=SKA.calc(sid,0,4);const f=(g,ref,n)=>a.some(x=>x.g===g&&x.ref===ref&&x.n===n);
          return {jTri:f('tri','Rising','Jupiter'),sSq:f('sq','Rising','Saturn'),mOpp:f('opp','Rising','Mars'),moon5:f('tri','Rising','Moon'),sade:a.some(x=>/Sade Sati/.test(x.t)),
                  nodeSq:f('sq','Moon','Rahu')||f('sq','Rising','Rahu'),ven:a.some(x=>x.n==='Venus'&&x.g==='one'===false&&x.ref==='Moon'),cnt:SKA.counts(a)}}""")
        ok(T + 'Jupiter in the 9th from Aries is a supportive trine', r['jTri'], r)
        ok(T + 'Saturn in the 4th is a square; Mars in the 8th is not listed as opposite', r['sSq'] and not r['mOpp'], r)
        ok(T + 'Moon in the 5th from Rising is a trine', r['moon5'], r)
        ok(T + 'Sade Sati when Saturn is 12th from the Moon', r['sade'], r)
        ok(T + 'HUD pill shows trine, square and opposite counts', pg.evaluate("()=>/△\\d+/.test(document.getElementById('skaPill').textContent)&&/□\\d+/.test(document.getElementById('skaPill').textContent)&&/☍\\d+/.test(document.getElementById('skaPill').textContent)"))
        ok(T + 'pill is visible and 28px+ tall', vis('skaPill') and pg.evaluate("()=>document.getElementById('skaPill').getBoundingClientRect().height>=28"))
        if SHOTS: os.makedirs(SHOTS, exist_ok=True); pg.screenshot(path=f'{SHOTS}/ska_{W}_pill.png')
        pg.click('#skaPill'); pg.wait_for_timeout(400)
        ok(T + 'tap opens the sheet with sections and a summary', vis('skaSheet') and pg.evaluate("()=>document.querySelectorAll('#skaBody .ska-s').length>=1&&!!document.querySelector('#skaBody .ska-sum')"))
        ok(T + '"For you" is disabled without a profile', pg.evaluate("()=>document.querySelector('#skaTabs [data-m=you]').disabled"))
        if SHOTS: pg.screenshot(path=f'{SHOTS}/ska_{W}_sheet.png')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
        ok(T + 'Escape closes the sheet', not vis('skaSheet'))
        pg.evaluate("()=>NAV.set(true)"); pg.wait_for_timeout(300)
        ok(T + 'pill hidden in the Navamsha sky', not vis('skaPill'))
        ok(T + 'no page errors', not errs, errs)
        ctx.close()
    b.close()
print('FAILED' if bad else 'ALL OK'); raise SystemExit(1 if bad else 0)

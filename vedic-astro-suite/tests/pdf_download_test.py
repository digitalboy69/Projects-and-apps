# PDF download (js/109-pdf-download.js): the button saves a real multi-page .pdf file directly (no print window); the page plan never cuts inside a card;
# the file opens with a PDF reader and every page is A4. Run: python3 tests/pdf_download_test.py
import functools, http.server, os, socketserver, subprocess, threading, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
OUT = '/tmp/claude-0/dl.pdf'
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); ctx = b.new_context(accept_downloads=True, viewport={'width': 1200, 'height': 900}); pg = ctx.new_page(); errs = []; printed = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    pg.add_init_script("window.__p=0")
    ok('PDFD loaded', pg.evaluate("typeof PDFD==='object'&&PDFD.ok===true&&typeof PDFR.download==='function'"))
    pl = pg.evaluate("""()=>{const P=PDFD.plan([{height:1000,cuts:[]},{height:3000,cuts:[400,900,1500,2000,2500]},{height:2400,cuts:[]}]);return P.map(x=>[x.ui,x.from,x.to])}""")
    ok('plan: single page, cuts at block ends only, fixed cut when no block fits', pl[0] == [0, 0, 1000] and all(x[2] in (400, 900, 1500, 2000, 2500, 3000) for x in pl if x[0] == 1) and pl[-1][2] == 2400 and all(x[2] > x[1] for x in pl), pl)
    pg.evaluate("(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}", dict(name='Asha', dob='1995-03-14', tob='11:00', place='Hyderabad', lat=17.385, lon=78.4867, tz=5.5)); pg.wait_for_selector('#results.show', timeout=15000)
    pg.evaluate("window.__p=0;window.print=()=>{window.__p++;window.__s=1};0")
    t0 = time.time()
    with pg.expect_download(timeout=280000) as dl: pg.evaluate("setTimeout(()=>PDFR.download(),50)")
    d = dl.value; d.save_as(OUT); dt = time.time() - t0
    size = os.path.getsize(OUT)
    ok('a .pdf file is downloaded directly (%.0fs, %d KB, name %s)' % (dt, size // 1024, d.suggested_filename), d.suggested_filename.endswith('.pdf') and d.suggested_filename.startswith('Vedic-Reading-Asha') and 1000 < size // 1024 < 60000)
    try:
        info = subprocess.run(['pdfinfo', OUT], capture_output=True, text=True).stdout
    except Exception: info = ''
    if not info:
        import pypdf; r = pypdf.PdfReader(OUT); info = 'Pages: %d\nPage size: %s' % (len(r.pages), r.pages[0].mediabox)
    pages = int([l for l in info.split('\n') if l.startswith('Pages')][0].split()[-1])
    ok('the file opens in a PDF reader: %d A4 pages' % pages, 90 <= pages <= 320 and ('595' in info and '841' in info), info[:200])
    pv = pg.evaluate('window.__p'); ok('the print window was not used', pv == 0, pv)
    ok('the progress card hides again', pg.evaluate("new Promise(r=>setTimeout(()=>r(document.getElementById('pdfd')&&document.getElementById('pdfd').classList.contains('on')),6500))") is False)
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:300]))
print('ALL PASS' if all(c for _, c, _ in res) else 'FAILED'); raise SystemExit(0 if all(c for _, c, _ in res) else 1)

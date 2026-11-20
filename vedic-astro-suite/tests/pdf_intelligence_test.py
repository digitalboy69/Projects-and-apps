# Prints the PDF book with Chromium (the real text PDF route) and checks the page cuts with and without the PDFI rules.
# Needs pdftotext/pdffonts (poppler). Run: python3 tests/pdf_intelligence_test.py
import functools, http.server, os, re, socketserver, subprocess, sys, tempfile, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c), d)); print(('PASS ' if c else 'FAIL ') + n + (' - ' + d if d and not c else ''))
def pages_of(pdf):
    t = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True).stdout
    return t.split('\f')
def endings(pages):
    bad = 0; n = 0
    for pg in pages[3:]:
        lines = [l.strip() for l in pg.split('\n') if l.strip()]
        lines = [l for l in lines if not re.fullmatch(r'\d+', l) and 'Vedic' not in l[:6]]
        if len(lines) < 12: continue
        n += 1; last = lines[-1]
        if len(last) > 40 and not re.search(r'[.!?:;)\]”"’0-9]$', last): bad += 1
    return bad, n
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    pg.evaluate("(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}", dict(name='Asha', dob='1995-03-14', tob='11:00', place='X', lat=17.385, lon=78.4867, tz=5.5))
    pg.wait_for_selector('#results.show', timeout=15000)
    ok('PDFI loaded', pg.evaluate("typeof PDFI==='object'&&typeof PDFI.prepare==='function'"))
    html = pg.evaluate("PDFR.build(currentChartForModal,currentProfileForExport)")
    out = {}
    for mode in ('plain', 'smart'):
        h = html if mode == 'smart' else html.replace(pg.evaluate("PDFI.css()"), '')
        pg2 = b.new_page(viewport={'width': 794, 'height': 1123}); pg2.set_content(h); pg2.add_script_tag(path=os.path.join(ROOT, 'apps/birth-chart/js/110-pdf-intelligence.js')); pg2.wait_for_timeout(400)
        if mode == 'smart': ok('prepare marks paragraphs and headings', (lambda r: r['kept'] > 100 and r['tied'] > 50)(pg2.evaluate("PDFI.prepare(document)")), '')
        f = os.path.join(tempfile.gettempdir(), 'pdfi_%s.pdf' % mode); pg2.pdf(path=f, format='A4', print_background=True, prefer_css_page_size=True); pg2.close(); out[mode] = f
    for m, f in list(out.items()):
        fonts = subprocess.run(['pdffonts', f], capture_output=True, text=True).stdout; imgs = subprocess.run(['pdfimages', '-list', f], capture_output=True, text=True).stdout
        pgs = pages_of(f); bad, n = endings(pgs); out[m + '_s'] = (bad, n, len(pgs))
        print(m, 'pages', len(pgs), 'mid-sentence page ends', bad, 'of', n)
        if m == 'smart':
            ok('words are real text (fonts embedded, text extractable)', len(fonts.strip().split('\n')) > 3 and sum(len(x) for x in pgs) > 50000)
    ok('smart cuts leave fewer or equal mid-sentence page ends than plain', out['smart_s'][0] <= out['plain_s'][0], str(out['smart_s']) + ' vs ' + str(out['plain_s']))
    ok('under 8% of text pages end mid-sentence', out['smart_s'][0] <= max(1, int(out['smart_s'][1] * 0.08)), str(out['smart_s']))
    ok('no JavaScript errors', not errs, '; '.join(errs[:2]))
print('ALL PASS' if all(r[1] for r in res) else 'SOME FAILED'); sys.exit(0 if all(r[1] for r in res) else 1)

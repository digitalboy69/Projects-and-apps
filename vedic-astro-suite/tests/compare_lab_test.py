# Compare Lab (js/115-compare-lab.js, global CMPLAB): opens from the Divisional Charts tab, three-dot menu adds charts, D1 vs D9 and any vs any,
# follow a planet across charts, table + notes + copy text, no banned words in notes. Run: python3 tests/compare_lab_test.py
import functools, http.server, os, re, socketserver, threading
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
OB = dict(name='Test', dob='1961-08-04', tob='19:24', place='Honolulu', lat=21.3069, lon=-157.8583, tz=-10)
BAN = re.compile(r"\b(always|never|certainly|definitely|guaranteed|doomed|destined|fatal|cursed|death|you will|you are going to)\b", re.I)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate("(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}", OB)
    pg.wait_for_selector('#results.show', timeout=20000); pg.wait_for_timeout(1200)
    pg.evaluate("()=>{try{localStorage.removeItem('vx-cmplab-v1')}catch(e){}}"); pg.evaluate("()=>switchAppTab('panel-vargas')"); pg.wait_for_timeout(500)
    ok('Compare Lab button is on the Divisional Charts page', pg.locator('#vxLabBtn').count() == 1)
    pg.click('#vxLabBtn'); pg.wait_for_selector('#cmpLab .cl-card')
    ok('opens with D1 and D9', pg.evaluate("()=>CMPLAB.cards()") == ['D1', 'D9'], pg.evaluate("()=>CMPLAB.cards()"))
    ok('two chart images drawn', pg.locator('#cmpLab .cl-card svg.varga-chart-svg').count() == 2)
    ok('table has Lagna + 9 planets + count row', pg.locator('#cmpLab .cl-tbl tbody tr').count() == 11, pg.locator('#cmpLab .cl-tbl tbody tr').count())
    ok('notes are shown', pg.locator('#cmpLab .cl-note li').count() >= 3)
    notes = pg.evaluate("()=>[...document.querySelectorAll('#cmpLab .cl-note')].map(n=>n.innerText).join(' ')")
    ok('notes use no banned words', not BAN.search(notes), BAN.findall(notes))
    # three-dot menu
    pg.click('#cmpLab .cl-dots'); ok('three-dot menu opens', pg.locator('#cmpLab .cl-menu').count() == 1)
    pg.click('#cmpLab .cl-menu [data-act="add"][data-k="D10"]'); ok('add D10 from the menu', pg.evaluate("()=>CMPLAB.cards()") == ['D1', 'D9', 'D10'])
    pg.click('#cmpLab .cl-dots'); pg.click('#cmpLab .cl-menu [data-act="add"][data-k="D2"]'); pg.click('#cmpLab .cl-dots')
    ok('maximum is 4, add buttons disabled', pg.evaluate("()=>CMPLAB.cards().length") == 4 and pg.locator('#cmpLab .cl-menu [data-act="add"]:not([disabled])').count() == 0)
    pg.click('#cmpLab .cl-menu [data-act="pair"][data-i="0"]'); ok('quick pair D1 vs D9', pg.evaluate("()=>CMPLAB.cards()") == ['D1', 'D9'])
    # any chart vs any other chart
    pg.select_option('#cmpLab select[data-act="pick"] >> nth=1', 'D60'); ok('change a card to D60', pg.evaluate("()=>CMPLAB.cards()") == ['D1', 'D60'])
    # follow a planet
    pg.click('#cmpLab .cl-tbl tr[data-p="Jupiter"] th'); pg.wait_for_timeout(200)
    hit = pg.evaluate("()=>[document.querySelectorAll('#cmpLab .ch-pl.cl-hit').length,document.querySelectorAll('#cmpLab .ch-pl.cl-dim').length]")
    ok('following Jupiter lights it in both charts and dims the rest', hit[0] == 2 and hit[1] >= 10, hit)
    ok('journey strip shows one box per chart', pg.locator('#cmpLab .cl-j div').count() == 2)
    pg.click('#cmpLab .cl-svg .ch-pl[data-p="Saturn"] >> nth=0'); ok('tapping a planet in a chart follows it', 'Saturn' in pg.inner_text('#cmpLab .cl-focus h3'))
    # style + order + delete
    pg.click('#cmpLab .cl-card >> nth=0 >> [data-act="style"][data-v="west"]'); ok('per-chart style (western wheel)', pg.locator('#cmpLab .cl-card >> nth=0 >> svg circle').count() > 10)
    pg.click('#cmpLab [data-act="first"]'); ok('make second chart the baseline', pg.evaluate("()=>CMPLAB.cards()") == ['D60', 'D1'])
    ok('copy text lists both charts', all(s in pg.evaluate("()=>CMPLAB.text()") for s in ['D60', 'D1', 'Jupiter']))
    pg.click('#cmpLab [data-act="del"] >> nth=1'); ok('remove a chart', pg.evaluate("()=>CMPLAB.cards()") == ['D60'] and 'Add a second chart' in pg.inner_text('#cmpLab .cl-hint'))
    # persistence + close
    pg.keyboard.press('Escape'); ok('Escape closes', pg.locator('#cmpLab').count() == 0)
    pg.click('#vxLabBtn'); pg.wait_for_selector('#cmpLab .cl-card'); ok('workspace is remembered after closing', pg.evaluate("()=>CMPLAB.cards()") == ['D60'], pg.evaluate("()=>CMPLAB.cards()"))
    pg.click('#cmpLab [data-act="close"]'); ok('close button', pg.locator('#cmpLab').count() == 0)
    ok('no page errors', not errs, errs[:2]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)
raise SystemExit(0 if all(c for _, c, _ in res) else 1)

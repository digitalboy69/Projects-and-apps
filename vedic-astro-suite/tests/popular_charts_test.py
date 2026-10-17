# Test of the "Popular charts" section under the 3-step form (Birth Chart input page).
# Run: python3 tests/popular_charts_test.py   (Wikipedia is simulated; no internet needed. CHROMIUM=/path/to/chrome if not default.)
import functools, http.server, json, os, re, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:%d' % srv.server_address[1]
PAGE = BASE + '/apps/birth-chart/index.html'
import base64
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')
wiki_calls = []
J = lambda r, o, s=200: r.fulfill(status=s, content_type='application/json', headers={'access-control-allow-origin': '*'}, body=json.dumps(o))
def route(r):
    u = r.request.url
    if u.startswith(('data:', 'blob:', BASE)): return r.continue_()
    if 'en.wikipedia.org' in u:
        t = re.sub(r'^.*/page/summary/', '', u); wiki_calls.append(t)
        if t == 'Warren_Buffett': return J(r, {'type': 'standard', 'title': 'Warren Buffett', 'extract': 'American investor', 'thumbnail': {'source': 'https://upload.wikimedia.org/x/b.png'}})
        if t == 'Bill_Gates': return J(r, {'type': 'standard', 'title': 'Someone Else', 'extract': 'unrelated', 'thumbnail': {'source': 'https://upload.wikimedia.org/x/w.png'}})  # must be rejected
        return J(r, {'type': 'standard', 'title': 'x', 'extract': 'x'})
    if 'upload.wikimedia.org' in u: return r.fulfill(status=200, content_type='image/png', headers={'access-control-allow-origin': '*'}, body=PNG)
    return r.abort()
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    def newpage(w=1100, h=900):
        ctx = b.new_context(viewport={'width': w, 'height': h}); ctx.route('**/*', route); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); return ctx, pg, errs
    ctx, pg, errs = newpage(390, 844); pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.wait_for_timeout(500)
    ok('no Wikipedia traffic before the gallery is near the screen (lazy)', len(wiki_calls) == 0, wiki_calls[:2])
    ok('gallery sits INSIDE the input section, AFTER the form', pg.evaluate("(()=>{var s=document.getElementById('intakeSection'),f=document.getElementById('birthForm'),g=document.getElementById('popCharts');return s.contains(g)&&!f.contains(g)&&(f.compareDocumentPosition(g)&4)>0})()"))
    pg.locator('#popCharts').scroll_into_view_if_needed(); pg.wait_for_selector('.pc-card'); pg.wait_for_timeout(900)
    chips = pg.locator('.pc-chip'); ok('10 group chips', chips.count() == 10, chips.count())
    names = set(); sizes = []
    for i in range(10):
        chips.nth(i).click(); pg.wait_for_timeout(50); n = pg.locator('.pc-card .pc-n').all_inner_texts(); sizes.append(len(n)); names.update(n)
    ok('every group shows 10 people', sizes == [10] * 10, sizes); ok('100 distinct people', len(names) == 100, len(names))
    chips.nth(0).click(); pg.wait_for_timeout(900)
    has = lambda nm: pg.locator('.pc-card', has_text=nm).locator('img.ok').count() == 1
    ok('photo loads for a correct page; wrong-person page rejected', has('Warren Buffett') and not has('Bill Gates'))
    ok('page has no horizontal scroll on a phone', pg.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'))
    ok('card row scrolls sideways', pg.evaluate("(()=>{var r=document.getElementById('pcRow');return r.scrollWidth>r.clientWidth})()"))
    pg.screenshot(path='/tmp/shots/app_gallery.png'); 
    # open a sheet, check honest wording, close
    chips.nth(1).click(); pg.locator('.pc-card', has_text='Albert Einstein').click(); pg.wait_for_selector('.pc-sheet'); t = pg.inner_text('.pc-sheet')
    ok('Einstein sheet: documented time, Pisces/Scorpio/Jyeshtha, rising Gemini', all(x in t for x in ['14 Mar 1879, 11:30', 'Pisces', 'Scorpio', 'Jyeshtha', 'Gemini']), t.replace('\n', ' | ')[:170])
    pg.keyboard.press('Escape'); ok('Esc closes', pg.locator('.pc-sheet').count() == 0)
    # CAST Einstein (timezone 0.6667 is NOT in the dropdown -> must be added and selected)
    pg.locator('.pc-card', has_text='Albert Einstein').click(); pg.click('.pc-go'); pg.wait_for_selector('#results.show', timeout=15000)
    f = pg.evaluate("({n:profileName.value,d:dobInput.value,t:tobInput.value,tz:tzInput.value,tzt:tzInput.selectedOptions[0].textContent,pl:placeInput.value,lat:selectedLat})")
    ok('Einstein cast: form filled exactly', f['n'] == 'Albert Einstein' and f['d'] == '1879-03-14' and f['t'] == '11:30' and f['pl'] == 'Ulm, Germany' and abs(f['lat'] - 48.4011) < 1e-3, f)
    ok('old-timezone option added + selected (not left on the previous zone)', abs(float(f['tz']) - 0.6667) < 1e-6 and 'local mean time' in f['tzt'], f['tz'] + ' ' + f['tzt'])
    txt = pg.inner_text('#results')
    ok('chart really computed (results show Gemini rising for Einstein)', 'Gemini' in txt and len(txt) > 2000, len(txt))
    saved = pg.evaluate("loadProfiles().map(p=>p.name)"); ok('cast chart saved in profiles like any chart', 'Albert Einstein' in saved, saved)
    ctx.close()
    # Gandhi (LMT +5:53) then Obama (-10, standard option): custom option must be replaced, right zone each time
    ctx, pg, errs = newpage(1100, 900); pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.locator('#popCharts').scroll_into_view_if_needed(); pg.wait_for_selector('.pc-card')
    pg.locator('.pc-chip', has_text='World leaders').click(); pg.locator('.pc-card', has_text='Mahatma Gandhi').click(); pg.click('.pc-go'); pg.wait_for_selector('#results.show', timeout=15000)
    g = pg.evaluate("({tz:tzInput.value,n:[...tzInput.options].filter(o=>o.dataset.pc).length,t:tobInput.value})")
    ok('Gandhi: tz 5.8833 selected, noon chart (time unknown)', abs(float(g['tz']) - 5.8833) < 1e-6 and g['n'] == 1 and g['t'] == '12:00', g)
    pg.evaluate("document.getElementById('intakeSection').scrollIntoView()")
    # go back to the input page via the app's own new-profile button, then cast Obama
    pg.evaluate("document.getElementById('newProfileBtn')&&document.getElementById('newProfileBtn').click()"); pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('intakeSection').style.display=''"); 
    pg.locator('.pc-card', has_text='Barack Obama').scroll_into_view_if_needed(); pg.locator('.pc-card', has_text='Barack Obama').click(); pg.click('.pc-go'); pg.wait_for_function("profileName.value==='Barack Obama'", timeout=8000); pg.wait_for_timeout(800)
    o = pg.evaluate("({tz:tzInput.value,custom:[...tzInput.options].filter(o=>o.dataset.pc).length,t:tobInput.value})")
    ok('Obama: standard -10 zone, leftover custom option removed, time 19:24', float(o['tz']) == -10 and o['custom'] == 0 and o['t'] == '19:24', o)
    ok('no JavaScript errors anywhere', not errs, errs[:3]); ctx.close(); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:220]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

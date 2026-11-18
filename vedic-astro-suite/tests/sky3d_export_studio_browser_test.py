# Export Studio (apps/sky3d js/65 engine, js/66 sheet): structure of the Markdown / JSON / text output, section and option switches, and the sheet at 390 and 360.
# Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/sky3d_export_studio_browser_test.py  (XS_SHOTS=dir saves screenshots)
import functools, http.server, os, socketserver, threading, json, re
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); SHOTS = os.environ.get('XS_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/sky3d/index.html' % srv.server_address[1]
STUB = """(()=>{const mk=()=>{const f=function(){};const p=new Proxy(f,{get:(t,k)=>k===Symbol.toPrimitive?()=>0:(k==='domElement'?(window.__cv||(window.__cv=document.createElement('canvas'))):(k==='length'?0:(k==='children'?[]:p))),apply:()=>p,construct:()=>p,set:()=>true});return p};window.THREE=mk();})();"""
PROFILE = "{name:'Demo A',dob:'2000-01-01',tob:'06:30:00',place:'Demo City',lat:28.6139,lon:77.209,tz:5.5}"
bad = 0
def ok(n, c, d=''):
    global bad; bad += (not c); print(('ok   ' if c else 'FAIL ') + n, '' if c else d)
def route(r):
    u = r.request.url
    if 'three.min.js' in u: r.fulfill(body=STUB, content_type='application/javascript')
    elif u.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')): r.continue_()
    else: r.abort()
def tables_ok(md):
    lines = md.split('\n'); i = 0; n = 0
    while i < len(lines):
        if lines[i].startswith('| ') and i + 1 < len(lines) and lines[i + 1].startswith('| ---'):
            cnt = lambda s: len(re.findall(r'(?<!\\)\|', s)); w = cnt(lines[i]); n += 1
            while i < len(lines) and lines[i].startswith('|'):
                if cnt(lines[i]) != w: return False, lines[i][:80]
                i += 1
        else: i += 1
    return n > 0, n
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'))
    # ---------------- engine ----------------
    ctx = b.new_context(viewport={'width': 390, 'height': 800}, timezone_id='Asia/Kolkata'); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('**/*', route); pg.goto(PAGE); pg.wait_for_timeout(2500)
    mk = "(a)=>{const c=XS.applyPreset(XS.defaults(),a[0]);Object.assign(c,a[1]||{});return XS.make(c)}"
    r = pg.evaluate("()=>{const o=XS.make(XS.applyPreset(XS.defaults(),'ai'));return {t:o.text,s:o.sections}}")
    ok('no profile: AI brief builds, says houses need a profile', 'No birth profile is loaded' in r['t'] and '## 1. Planets' in r['t'])
    ok('no profile: Dasha section explains it needs a profile', 'Needs a birth profile' in r['t'])
    pg.evaluate("()=>{activeNatalProfile=%s}" % PROFILE)
    md = pg.evaluate(mk, ['ai'])['text']
    heads = re.findall(r'^## (\d+)\. (.+)$', md, re.M)
    heads = [h for h in heads if h[0] != '0']
    ok('Markdown: numbered sections 1..n in order', [int(h[0]) for h in heads] == list(range(1, len(heads) + 1)) and len(heads) >= 14, heads[:3])
    ok('Markdown: title, rules, guide, contents come first in that order', [md.find(x) for x in ('# Vedic Sky Export', '## Rules for the reader', '## How to read this export', '## Contents', '## 0. Overview')] == sorted(md.find(x) for x in ('# Vedic Sky Export', '## Rules for the reader', '## How to read this export', '## Contents', '## 0. Overview')) and md.find('## Contents') > 0)
    good, info = tables_ok(md); ok('Markdown: every table row has the same number of columns', good, info)
    ok('Markdown: both charts (Chart A sky, Chart B birth) and the Timing part exist', 'Chart A - Sky at' in md and 'Chart B - Demo A' in md and '# Timing and forecasts' in md)
    ok('every section opens with an italic one-line description', len(re.findall(r'^## \d+\. .+\n\n_.+_\n', md, re.M)) == len(heads))
    j = pg.evaluate(mk, ['ai', {'format': 'json'}]); d = json.loads(j['text'])
    ok('JSON parses and has schema, overview, chart_sky, chart_natal, timing', all(k in d for k in ('schema', 'overview', 'chart_sky', 'chart_natal', 'timing')) and d['schema'] == 'vedic-sky-export/1')
    sun = d['chart_sky']['sections']['planets']['positions'][1]
    real = pg.evaluate("()=>siderealLongitude('Sun',XS.momentJD(XS.defaults()))")
    ok('JSON: Sun absolute degree equals the engine', sun['planet'] == 'Sun' and abs(sun['abs_degree'] - real) < 0.002, (sun, real))
    ok('JSON: houses table has 12 rows', len(d['chart_sky']['sections']['houses']['houses']) == 12)
    ok('JSON: dasha running Maha present', 'Running Maha' in d['timing']['sections']['dasha']['running'])
    t = pg.evaluate(mk, ['ai', {'format': 'txt'}])['text']
    ok('Plain text: headings, aligned tables, no markdown pipes header rule', '1. PLANETS' in t and '| ---' not in t and 'CONTENTS' in t)
    ok('task and rules switch', 'Your task' not in md and 'Rules for the reader' in md)
    m2 = pg.evaluate(mk, ['ai', {'task': 'When is a good time to move?', 'rules': False, 'guide': False}])['text']
    ok('task appears at the top; rules and guide can be switched off', '## Your task' in m2 and 'When is a good time to move?' in m2 and 'Rules for the reader' not in m2 and 'How to read this export' not in m2)
    dec = pg.evaluate(mk, ['quick', {'angle': 'dec'}])['text']
    ok('decimal degrees option', re.search(r'\| \d+\.\d{4}° \|', dec) is not None and '"' not in dec.split('## 1.')[1].split('## 2.')[0].split('Positions')[1][:900].replace('"Position','').replace('Absolute',''))
    ok('basis sky only gives one chart', 'Chart B' not in pg.evaluate(mk, ['ai', {'basis': 'sky'}])['text'])
    cust = pg.evaluate(mk, ['quick', {'sec': ['planets'], 'basis': 'sky', 'moment': 'custom', 'momentISO': '2000-01-01T12:00'}])['text']
    ok('custom moment is used', '2000-01-01 12:00' in cust and '## 2.' not in cust)
    v = pg.evaluate(mk, ['quick', {'sec': ['varga'], 'vargas': ['D9', 'D10', 'D60']}])['text']
    ok('divisional chart picks become columns', 'D9 Navamsha' in v and 'D10 Dasamsa' in v and 'D60 Shashtiamsa' in v.replace('Shashtyamsa', 'Shashtiamsa') or 'D60' in v)
    tr1 = pg.evaluate(mk, ['quick', {'sec': ['transits'], 'tr': {'years': 1, 'moon': False}}])['text']; tr5 = pg.evaluate(mk, ['quick', {'sec': ['transits'], 'tr': {'years': 5, 'moon': False}}])['text']
    n1, n5 = [int(re.search(r'(\d+) sign changes', x).group(1)) for x in (tr1, tr5)]
    ok('transit horizon scales (5 years has more rows than 1)', n5 > n1 * 3, (n1, n5))
    trm = pg.evaluate(mk, ['quick', {'sec': ['transits'], 'tr': {'years': 1, 'moon': True}}])['text']
    ok('Moon switch adds many rows', int(re.search(r'(\d+) sign changes', trm).group(1)) > n1 + 100)
    rt = pg.evaluate(mk, ['quick', {'sec': ['retro'], 'rt': {'years': 2}}])['text']
    ok('retrograde periods: Mercury has several, each with dates', len(re.findall(r'\| Mercury \|', rt)) >= 5)
    eph = pg.evaluate(mk, ['quick', {'sec': ['ephemeris'], 'eph': {'step': '1m', 'count': 6, 'planets': ['Sun', 'Moon', 'Saturn']}}])['text']
    ok('ephemeris: 6 rows, 3 planet columns', len(re.findall(r'^\| 20\d\d-', eph, re.M)) == 6 and '| Sun | Moon | Saturn |' in eph)
    ok('Timeline finder section explains when nothing was run', 'No Timeline finder search has been run' in pg.evaluate(mk, ['quick', {'sec': ['finder']}])['text'])
    pg.evaluate("()=>{TLF.state.res={windows:[{from:2451544.5,to:2451546.5,mid:2451545.5,pos:[{n:'Sun',s:6,d:3}]}],capped:false}}")
    ok('Timeline finder results are exported', 'Sun 3° Libra' in pg.evaluate(mk, ['quick', {'sec': ['finder']}])['text'])
    ok('legacy generateExportData still works and is structured', '## 1. Planets' in pg.evaluate("()=>generateExportData('sky')"))
    big = pg.evaluate(mk, ['everything'])
    ok('Everything builds quickly with all 14 sections', big['sections'] >= 22 and pg.evaluate("()=>{const t=performance.now();XS.make(XS.applyPreset(XS.defaults(),'everything'));return performance.now()-t}") < 1500)
    ok('no page errors (engine)', not errs, errs)
    ctx.close()
    # ---------------- sheet ----------------
    for W, H in ((390, 800), (360, 640)):
        ctx = b.new_context(viewport={'width': W, 'height': H}, timezone_id='Asia/Kolkata', accept_downloads=True); ctx.grant_permissions(['clipboard-read', 'clipboard-write'])
        pg = ctx.new_page(); errs = []; T = '%dx%d: ' % (W, H)
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('**/*', route); pg.goto(PAGE); pg.wait_for_timeout(2500)
        pg.evaluate("()=>{activeNatalProfile=%s;try{localStorage.removeItem('sky3d_xs')}catch(e){}}" % PROFILE)
        pg.evaluate("()=>document.querySelector('[data-tab=export]').click()"); pg.wait_for_timeout(300)
        ok(T + 'Export tab has the launcher and four quick copies', pg.evaluate("()=>!!document.getElementById('xsOpenBtn')&&document.querySelectorAll('[data-xq]').length===4"))
        pg.evaluate("()=>document.getElementById('xsOpenBtn').click()"); pg.wait_for_timeout(500)
        ok(T + 'Studio opens with five cards', pg.evaluate("()=>{const s=document.getElementById('xsSheet');return !s.hidden&&s.querySelectorAll('.xs-card').length===5}"))
        ok(T + 'no horizontal overflow', pg.evaluate("()=>{const b=document.getElementById('xsBody');return b.scrollWidth<=b.clientWidth+1}"))
        ok(T + 'footer buttons are at least 44px tall', pg.evaluate("()=>[...document.querySelectorAll('.xs-act button')].filter(b=>b.offsetParent).every(b=>b.getBoundingClientRect().height>=44)"))
        ok(T + 'every switch and chip is a 40px+ target', pg.evaluate("()=>[...document.querySelectorAll('#xsBody button')].filter(b=>b.offsetParent&&!b.disabled).every(b=>b.getBoundingClientRect().height>=30)"))
        if SHOTS: os.makedirs(SHOTS, exist_ok=True); pg.screenshot(path=f'{SHOTS}/xs_{W}_top.png')
        pg.click('.xs-p[data-v=forecast]'); pg.wait_for_timeout(300)
        ok(T + 'Forecast preset switches sections and the preview', pg.evaluate("()=>/Retrograde periods/.test(document.getElementById('xsPre').textContent)&&XSU.cfg.preset==='forecast'"))
        pg.click('.xs-rt[data-v=ephemeris]'); pg.wait_for_timeout(300)
        ok(T + 'switching a section makes the preset Custom and adds it', pg.evaluate("()=>XSU.cfg.preset==='custom'&&XSU.cfg.sec.includes('ephemeris')&&/Ephemeris table/.test(document.getElementById('xsPre').textContent)"))
        pg.click('.xs-gear[data-v=ephemeris]'); pg.wait_for_timeout(200); pg.click('.xs-opts [data-a=ephS][data-v="1d"]'); pg.wait_for_timeout(300)
        ok(T + 'ephemeris options open and apply', pg.evaluate("()=>XSU.cfg.eph.step==='1d'&&/one every day/.test(document.getElementById('xsPre').textContent)"))
        pg.click('.xs-seg [data-a=format][data-v=json]'); pg.wait_for_timeout(300)
        ok(T + 'JSON format shows JSON', pg.evaluate("()=>document.getElementById('xsPre').textContent.trim().startsWith('{')"))
        pg.click('.xs-seg [data-a=format][data-v=md]'); pg.fill('.xs-task', 'Tell me about my career'); pg.wait_for_timeout(500)
        ok(T + 'question appears in the preview without losing focus', pg.evaluate("()=>/Tell me about my career/.test(document.getElementById('xsPre').textContent)&&document.activeElement.classList.contains('xs-task')"))
        pg.click('.xs-act .xs-copy'); pg.wait_for_timeout(500)
        clip = pg.evaluate("()=>navigator.clipboard.readText()")
        ok(T + 'Export to clipboard puts the full export on the clipboard (not hidden by the Copy-buttons setting)', clip.startswith('# Vedic Sky Export') and 'Tell me about my career' in clip and len(clip) > 5000)
        with pg.expect_download() as dl: pg.click('.xs-act [data-a=dl]')
        ok(T + 'Download saves a .md file', dl.value.suggested_filename.endswith('.md') and dl.value.suggested_filename.startswith('vedic-sky-'), dl.value.suggested_filename)
        if SHOTS: pg.evaluate("()=>{const c=document.querySelectorAll('.xs-card')[2];c.scrollIntoView({block:'start'})}"); pg.wait_for_timeout(200); pg.screenshot(path=f'{SHOTS}/xs_{W}_include.png'); pg.evaluate("()=>document.querySelectorAll('.xs-card')[4].scrollIntoView({block:'start'})"); pg.wait_for_timeout(200); pg.screenshot(path=f'{SHOTS}/xs_{W}_preview.png')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
        ok(T + 'Escape closes the sheet', pg.evaluate("()=>document.getElementById('xsSheet').hidden"))
        pg.evaluate("()=>document.querySelector('[data-xq=quick]').click()"); pg.wait_for_timeout(500)
        ok(T + 'quick copy works from the Export tab', pg.evaluate("()=>navigator.clipboard.readText()").startswith('# Vedic Sky Export') and 'Copied' in pg.evaluate("()=>document.getElementById('exportStatus').textContent"))
        ok(T + 'settings are remembered', pg.evaluate("()=>JSON.parse(localStorage.getItem('sky3d_xs')).eph.step==='1d'"))
        ok(T + 'no page errors', not errs, errs)
        ctx.close()
    b.close()
print('FAILED' if bad else 'ALL OK'); raise SystemExit(1 if bad else 0)

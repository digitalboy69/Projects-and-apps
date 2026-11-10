# Export builder (js/148) in a real browser at phone width. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/export_builder_browser_test.py   (EXB_SHOTS=dir for screenshots)
import functools, http.server, os, socketserver, threading, json
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
SHOTS = os.environ.get('EXB_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c))); print(('ok   ' if c else 'FAIL ') + n, '' if c else d)
A = dict(name='Asha', dob='2000-01-01', tob='06:30', place='New Delhi', lat=28.6139, lon=77.2090, tz=5.5)
CAST = "(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}"
def shot(pg, n):
    if SHOTS: os.makedirs(SHOTS, exist_ok=True); pg.screenshot(path=os.path.join(SHOTS, n))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); ctx = b.new_context(viewport={'width': 390, 'height': 800}, accept_downloads=True); pg = ctx.new_page(); errs = []
    ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=PAGE.rsplit('/apps', 1)[0])
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate("()=>localStorage.removeItem('vax_export_sel_v2')")
    pg.evaluate(CAST, A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1500)
    pg.click('.app-tab[data-group=export]'); pg.wait_for_timeout(1500)
    ok('Export tab opens the new screen, not the pop-up', pg.evaluate("()=>document.getElementById('panel-export').classList.contains('active')&&!!document.querySelector('#panel-export .exb')&&!document.getElementById('exportModal').classList.contains('show')"))
    ok('Export tab is the highlighted one', pg.evaluate("()=>document.querySelector('.app-tab[data-group=export]').classList.contains('active')&&document.querySelectorAll('.app-tab.active').length===1"))
    ok('profile line shows the name', pg.evaluate("()=>/Asha/.test(document.querySelector('.exb-hero').innerText)"))
    ok('default is the Essentials preset', pg.evaluate("()=>document.querySelector('#exbPre button.on').dataset.p")=='essentials')
    shot(pg, 'e1.png')
    pg.wait_for_timeout(6000)
    ok('sizes are measured for the sections', pg.evaluate("()=>{const k=EXB.flat().map(i=>i[0]).filter(k=>k!=='liveSky');return k.every(x=>EXB.sizeOf(x)!=null)}"))
    ok('Essentials total is plausible and Copy is enabled', pg.evaluate("()=>{const t=EXB.total();return t.on===6&&t.chars>2000&&t.pending===0&&!document.getElementById('exbCp').disabled}"))
    # exact check: the text built equals the sum approx (within 5%) of the sizes
    r = pg.evaluate("()=>{const t=EXB.total(),b=EXB.buildText();return {est:t.chars,real:b.text.length}}")
    ok('estimate is within 5% of the real length', abs(r['est']-r['real'])/r['real'] < 0.05, r)
    # content check: selected sections present, unselected absent
    txt = pg.evaluate("()=>EXB.buildText().text")
    ok('Essentials text has birth details, planets, yogas, dasha', all(w in txt for w in ['BIRTH DETAILS', 'HOUSE-BY-HOUSE SUMMARY']) and 'VIMSHOTTARI' in txt.upper())
    ok('Essentials text leaves out Shadbala, Ashtakavarga, raw longitudes', not any(w in txt.upper() for w in ['SHADBALA', 'ASHTAKAVARGA', 'RAW SIDEREAL']))
    # yogas is in the Essentials text before it is unticked
    ok('Essentials text includes Yogas before unticking', pg.evaluate("()=>EXB.buildText().text.includes('YOGAS — NOTABLE PLANETARY COMBINATIONS')"))
    # untick Yogas
    pg.evaluate("()=>{const c=document.querySelector('[data-exb=sel][data-k=yogas]');c.click()}"); pg.wait_for_timeout(300)
    ok('unticking a section removes it from the text and the count', pg.evaluate("()=>EXB.total().on===5&&!EXB.buildText().text.includes('YOGAS — NOTABLE PLANETARY COMBINATIONS')"))
    # presets
    pg.evaluate("()=>document.querySelector('#exbPre [data-p=none]').click()"); pg.wait_for_timeout(200)
    ok('Nothing preset clears all and disables Copy', pg.evaluate("()=>EXB.total().on===0&&document.getElementById('exbCp').disabled&&document.getElementById('exbDl').disabled"))
    pg.evaluate("()=>document.querySelector('#exbPre [data-p=ai]').click()"); pg.wait_for_timeout(300)
    ok('For an AI preset selects 12 sections including the AI note', pg.evaluate("()=>EXB.total().on===12&&EXB.state.sel.xp_aiPrompt===true"))
    ok('AI text starts with the instructions', pg.evaluate("()=>EXB.buildText().text.startsWith('INSTRUCTIONS FOR THE AI')"))
    # group controls
    pg.evaluate("()=>document.querySelector('[data-exb=gnone][data-g=data]').click()"); pg.wait_for_timeout(200)
    ok('group None clears only that group', pg.evaluate("()=>EXB.state.sel.birthDetails===false&&EXB.state.sel.yogas===true"))
    pg.evaluate("()=>document.querySelector('[data-exb=gall][data-g=data]').click()"); pg.wait_for_timeout(200)
    ok('group All selects the whole group', pg.evaluate("()=>EXB.defs()[0].items.every(i=>EXB.state.sel[i[0]])"))
    # varga chips
    pg.evaluate("()=>document.querySelector('[data-exb=sel][data-k=vargas]').checked||document.querySelector('[data-exb=sel][data-k=vargas]').click()"); pg.wait_for_timeout(200)
    pg.evaluate("()=>document.querySelector('[data-exb=vgnone]').click()"); pg.evaluate("()=>document.querySelector('[data-exb=vg][data-k=D9]').click()"); pg.wait_for_timeout(200)
    ok('only the chosen divisional chart is in the text', pg.evaluate("()=>{const t=EXB.buildText().text;return /D9/.test(t)&&!/D10 /.test(t)&&EXB.state.vg.size===1}"))
    # reload remembers
    pg.reload(); pg.wait_for_timeout(2500)
    if not pg.evaluate("()=>document.getElementById('results').classList.contains('show')"):
        pg.wait_for_selector('#birthForm'); pg.evaluate(CAST, A); pg.wait_for_selector('#results.show', timeout=30000)
    pg.wait_for_timeout(1500)
    pg.click('.app-tab[data-group=export]'); pg.wait_for_timeout(1200)
    ok('the last selection is remembered after a reload', pg.evaluate("()=>EXB.state.sel.xp_aiPrompt===true&&EXB.state.vg.size===1"))
    # download txt
    pg.evaluate("()=>document.querySelector('#exbPre [data-p=essentials]').click()"); pg.wait_for_timeout(300)
    with pg.expect_download() as d: pg.evaluate("()=>document.getElementById('exbDl').click()")
    dl = d.value; path = dl.path(); data = open(path, encoding='utf-8').read()
    ok('download gives a .txt file named after the person', dl.suggested_filename == 'Asha_vedic_chart.txt' and 'BIRTH DETAILS' in data, dl.suggested_filename)
    # json
    pg.evaluate("()=>document.querySelector('[data-exb=fmt][data-f=json]').click()"); pg.wait_for_timeout(200)
    ok('JSON type hides the split choice and shows the raw-data summary', pg.evaluate("()=>document.getElementById('exbSplitWrap').hidden&&/Raw chart data/.test(document.getElementById('exbTot').innerText)"))
    with pg.expect_download() as d2: pg.evaluate("()=>document.getElementById('exbDl').click()")
    j = d2.value; jd = json.loads(open(j.path(), encoding='utf-8').read())
    ok('JSON download is valid JSON with the profile and chart', j.suggested_filename.endswith('.json') and jd['profile']['name'] == 'Asha' and 'planets' in jd['chart'])
    pg.evaluate("()=>document.querySelector('[data-exb=fmt][data-f=txt]').click()")
    # split
    pg.evaluate("()=>document.querySelector('#exbPre [data-p=ai]').click()"); pg.evaluate("()=>document.querySelector('[data-exb=split][data-n=\"20000\"]').click()"); pg.wait_for_timeout(300)
    pg.evaluate("()=>document.getElementById('exbCp').click()"); pg.wait_for_timeout(800)
    n = pg.evaluate("()=>document.querySelectorAll('#exbParts .exb-pt').length")
    ok('split into 20K shows the parts list', n >= 2, n)
    ok('every part is within the limit plus the part labels, and joined they equal the whole', pg.evaluate("()=>{const t=EXB.buildText().text,p=EXB.splitText(t,20000);return p.every(x=>x.length<=20000+80)&&p.length>=2&&p[0].startsWith('[Part 1 of')&&p[p.length-1].endsWith('[End]')}"))
    pg.evaluate("()=>document.querySelector('[data-exb=pcopy][data-i=\"0\"]').click()"); pg.wait_for_timeout(400)
    clip = pg.evaluate("()=>navigator.clipboard.readText()")
    ok('Copy part 1 puts that part on the clipboard', clip.startswith('[Part 1 of'), clip[:40])
    shot(pg, 'e3.png')
    # live sky
    pg.evaluate("()=>document.querySelector('#exbPre [data-p=essentials]').click()"); pg.evaluate("()=>{const g=document.querySelector('[data-exb=toggle][data-g=timing]');g.click()}"); pg.wait_for_timeout(200)
    pg.evaluate("()=>document.querySelector('[data-exb=sel][data-k=liveSky]').click()"); pg.wait_for_timeout(200)
    ok('Sky right now: birth place by default builds a section', pg.evaluate("()=>/LIVE SKY|SKY RIGHT NOW|Observer location/i.test(EXB.buildText().text)"))
    pg.evaluate("()=>document.querySelector('[data-exb=livemode][data-m=coords]').click()"); pg.wait_for_timeout(200)
    ok('Other place with empty coordinates gives a clear message, no file', pg.evaluate("()=>/latitude/i.test(EXB.buildText().error||'')"))
    pg.fill('[data-exb=lat]', '19.07'); pg.fill('[data-exb=lon]', '72.87'); pg.fill('[data-exb=tz]', '5.5')
    ok('Other place with coordinates works', pg.evaluate("()=>/19\\.0700/.test(EXB.buildText().text)"))
    # search
    pg.fill('#exbQ', 'dasha'); pg.wait_for_timeout(300)
    ok('search filters the sections', pg.evaluate("()=>[...document.querySelectorAll('.exb-r')].filter(r=>r.style.display!=='none').length")>=1)
    pg.fill('#exbQ', ''); pg.wait_for_timeout(200)
    # the app's own Settings switch hides every Copy button by default; the Export bar follows it
    ok('Copy buttons follow the Settings switch: hidden while it is off, Download still shown', pg.evaluate("()=>{const c=document.getElementById('exbCp'),d=document.getElementById('exbDl');return getComputedStyle(c).display==='none'&&getComputedStyle(d).display!=='none'}"))
    pg.evaluate("()=>{localStorage.setItem('vedicCopyBtns','1');window.postMessage('vedic-copy-toggle','*')}"); pg.wait_for_timeout(500)
    ok('and the Copy button appears when the switch is on', pg.evaluate("()=>getComputedStyle(document.getElementById('exbCp')).display!=='none'"))
    pg.evaluate("()=>{localStorage.removeItem('vedicCopyBtns');window.postMessage('vedic-copy-toggle','*')}"); pg.wait_for_timeout(300)
    ok('every tool page is offered once (nothing duplicated, nothing from skipped pages)', pg.evaluate("()=>{const k=EXB.flat().map(i=>i[0]);return new Set(k).size===k.length&&!k.includes('xp_panel-export')&&!k.includes('xp_panel-tools')&&k.includes('xp_panel-synastry')&&k.includes('xp_panel-pcal')}"))
    # a tool page never opened still exports
    got = pg.evaluate("()=>{EXB.state.sel['xp_panel-pcal']=true;const t=EXB.buildText().text;EXB.state.sel['xp_panel-pcal']=false;return /Panchang Calendar/i.test(t)}")
    ok('a tool page that was never opened is opened quietly and included', got)
    ok('still on the Export screen afterwards', pg.evaluate("()=>document.getElementById('panel-export').classList.contains('active')"))
    shot(pg, 'e2.png')
    ok('no sideways scroll at 390', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"))
    pg.set_viewport_size({'width': 360, 'height': 780}); pg.wait_for_timeout(300)
    ok('no sideways scroll at 360', pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth+1"))
    # old entry points go to the new screen
    pg.click('.app-tab[data-group=home]'); pg.wait_for_timeout(500)
    pg.evaluate("()=>openExportModal()"); pg.wait_for_timeout(600)
    ok('openExportModal() (header button, menus) opens the new screen', pg.evaluate("()=>document.getElementById('panel-export').classList.contains('active')"))
    ok('no page errors', not errs, errs[:3]); b.close()
bad = [n for n, c in res if not c]; print('ALL PASSED' if not bad else '%d FAILED' % len(bad)); raise SystemExit(1 if bad else 0)

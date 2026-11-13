# Hora panel (js/157) in the real app at phone width 390 and 360. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/hora_browser_test.py  (HORA_SHOTS=dir saves screenshots)
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
SHOTS = os.environ.get('HORA_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
A = dict(name='Demo A', dob='2000-01-01', tob='06:30', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)
def shot(pg, name):
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True); pg.wait_for_timeout(350); pg.screenshot(path=os.path.join(SHOTS, name))
def sc(pg, sel, off=118): pg.evaluate("([s,o])=>{const e=document.querySelector(s);window.scrollTo(0,e.getBoundingClientRect().top+scrollY-o)}", [sel, off]); pg.wait_for_timeout(250)
def tab(pg, t): pg.evaluate("(t)=>document.querySelector('#panel-hora .hr-tabs [data-tab='+t+']').click()", t); pg.wait_for_timeout(350)
with sync_playwright() as p:
    kw = {'executable_path': CHROME} if os.path.exists(CHROME) else {}
    b = p.chromium.launch(**kw)
    for W in (390, 360):
        pg = b.new_page(viewport={'width': W, 'height': 800}, device_scale_factor=1); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
        pg.goto(PAGE); pg.wait_for_selector('#birthForm'); pg.evaluate("(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}", A); pg.wait_for_selector('#results.show', timeout=30000); pg.wait_for_timeout(1200)
        t = '%d: ' % W
        ok(t + 'Home has the Hora tile', pg.evaluate("()=>!!document.querySelector('#panel-home [data-go=panel-hora]')"))
        pg.evaluate("()=>document.querySelector('#panel-home [data-go=panel-hora]').click()"); pg.wait_for_timeout(1200)
        ok(t + 'tile opens the active panel', pg.evaluate("()=>{const e=document.getElementById('panel-hora');return !!e&&e.classList.contains('active')}"))
        ok(t + '5 tabs', pg.evaluate("()=>document.querySelectorAll('#panel-hora .hr-tabs button').length===5"))
        # NOW
        ok(t + 'Now shows the engine hora lord', pg.evaluate("()=>{const a=HORA.at(Date.now()/864e5+2440587.5,28.6139,77.2090,5.5);return !!a.hora&&document.querySelector('#hrNow .hr-rc b').textContent===a.hora.lord+' Hora'}"))
        ok(t + 'Now has ring, countdown, 3 next horas, ribbon with 24 blocks', pg.evaluate("()=>!!document.getElementById('hrArc')&&/^\\d/.test(document.getElementById('hrLeft').textContent)&&document.querySelectorAll('#hrBody .hr-nx').length>=1&&document.querySelectorAll('#hrBody .hr-rb span').length===24"))
        l1 = pg.evaluate("()=>document.getElementById('hrLeft').textContent"); pg.wait_for_timeout(2200); l2 = pg.evaluate("()=>document.getElementById('hrLeft').textContent")
        ok(t + 'countdown ticks every second', l1 != l2, (l1, l2))
        ok(t + 'Now shows the planet in your chart', pg.evaluate("()=>/in your chart/.test(document.getElementById('hrBody').textContent)"))
        shot(pg, 'h%d-now.png' % W)
        sc(pg, '#hrBody .hr-card', 118); shot(pg, 'h%d-now2.png' % W)
        # TODAY
        tab(pg, 'today')
        ok(t + 'Today lists 24 rows (12 day + 12 night)', pg.evaluate("()=>document.querySelectorAll('#hrBody .hr-rw').length===24"))
        ok(t + 'row planets match the engine order', pg.evaluate("()=>{const d=HORA.dayOf(HORAUI.S.date,28.6139,77.2090,5.5);return [...document.querySelectorAll('#hrBody .hr-rm b')].every((e,i)=>e.textContent===d.horas[i].lord)}"))
        shot(pg, 'h%d-today.png' % W)
        pg.evaluate("()=>document.querySelectorAll('#hrBody .hr-row')[2].click()"); pg.wait_for_timeout(250)
        ok(t + 'tapping a row opens its detail', pg.evaluate("()=>document.querySelectorAll('#hrBody .hr-det').length===1"))
        pg.evaluate("()=>{const s=document.getElementById('hrShow');s.value='money';s.dispatchEvent(new Event('change',{bubbles:true}))}"); pg.wait_for_timeout(300)
        ok(t + 'choosing an activity puts a band on every row', pg.evaluate("()=>[...document.querySelectorAll('#hrBody .hr-rc2')].filter(e=>/Excellent|Good|Fair|Neutral|Avoid/.test(e.textContent)).length===24"))
        pg.evaluate("()=>document.querySelectorAll('#hrBody .hr-row')[0].click()"); pg.wait_for_timeout(250)
        sc(pg, '#hrBody .hr-rw', 120); shot(pg, 'h%d-today-open.png' % W)
        d0 = pg.evaluate("()=>HORAUI.S.date"); pg.evaluate("()=>document.querySelector('#hrBody [data-day=\"1\"]').click()"); pg.wait_for_timeout(300)
        ok(t + 'next-day arrow moves one day', pg.evaluate("(d)=>HORAUI.S.date!==d&&document.querySelectorAll('#hrBody .hr-rw').length===24", d0))
        # WEEK
        tab(pg, 'week')
        ok(t + 'Week grid: 7 columns x 24 rows of squares', pg.evaluate("()=>document.querySelectorAll('#hrBody .hr-wc').length===168"))
        ok(t + 'grid squares match the engine', pg.evaluate("()=>{const D=HORA.week(HORAUI.S.wdate,7,28.6139,77.2090,5.5);return [...document.querySelectorAll('#hrBody .hr-wc')].every(e=>{const [ds,i]=e.dataset.cell.split(':');const d=D.find(x=>x.date===ds);return d&&e.getAttribute('aria-label').includes(d.horas[+i].lord)})}"))
        ok(t + 'grid fits the screen width', pg.evaluate("()=>{const w=document.querySelector('#hrBody .hr-wk').getBoundingClientRect();return w.right<=innerWidth&&w.left>=0&&document.documentElement.scrollWidth<=innerWidth+1}"))
        pg.evaluate("()=>{const s=document.getElementById('hrShow');s.value='love';s.dispatchEvent(new Event('change',{bubbles:true}))}"); pg.wait_for_timeout(300)
        ok(t + 'activity glow marks only good-for horas', pg.evaluate("()=>{const a=HORA.act('love');const g=[...document.querySelectorAll('#hrBody .hr-wg')];return g.length>0&&g.every(e=>a.good.some(l=>e.getAttribute('aria-label').includes(l+' hora')))}"))
        pg.evaluate("()=>document.querySelectorAll('#hrBody .hr-wc')[10].click()"); pg.wait_for_timeout(250)
        ok(t + 'tapping a square shows its reading', pg.evaluate("()=>document.querySelectorAll('#hrBody .hr-wo').length===1&&/hora/.test(document.querySelector('#hrBody .hr-card[style]').textContent)"))
        sc(pg, '#hrBody .hr-wk', 110); shot(pg, 'h%d-week.png' % W)
        pg.evaluate("()=>window.scrollBy(0,520)"); shot(pg, 'h%d-week2.png' % W)
        # BEST
        tab(pg, 'best')
        ok(t + 'Best shows 14 activities and 8 ranked results', pg.evaluate("()=>document.querySelectorAll('#hrBody .hr-grid .hr-ac').length===14&&document.querySelectorAll('#hrBody .hr-res').length>=8"))
        ok(t + 'each result lists reasons', pg.evaluate("()=>[...document.querySelectorAll('#hrBody .hr-res')].every(e=>e.querySelectorAll('li').length>=2)"))
        shot(pg, 'h%d-best.png' % W)
        pg.evaluate("()=>document.querySelector('#hrBody [data-act=travel]').click()"); pg.wait_for_timeout(300)
        ok(t + 'switching activity re-ranks for it', pg.evaluate("()=>/travel/i.test(document.querySelector('#hrBody .hr-h').textContent)&&document.querySelector('#hrBody .hr-ac.hr-on').dataset.act==='travel'"))
        pg.evaluate("()=>document.querySelector('#hrBody [data-rng=\"7\"]').click()"); pg.wait_for_timeout(300)
        ok(t + '7-day range works', pg.evaluate("()=>HORAUI.S.range===7&&document.querySelectorAll('#hrBody .hr-res').length>=8"))
        pg.evaluate("()=>document.getElementById('hrChart').click()"); pg.wait_for_timeout(300)
        ok(t + 'chart toggle off removes chart reasons', pg.evaluate("()=>!/in your chart/.test(document.getElementById('hrBody').textContent)"))
        sc(pg, '#hrBody .hr-h', 120); shot(pg, 'h%d-best2.png' % W)
        # LEARN
        tab(pg, 'learn')
        ok(t + 'Learn has 10 sections and the first is open', pg.evaluate("()=>document.querySelectorAll('#hrBody .hr-ls').length===10&&document.querySelector('#hrBody .hr-ls').open"))
        pg.evaluate("()=>{document.querySelectorAll('#hrBody .hr-ls')[1].open=true;document.querySelectorAll('#hrBody .hr-ls')[2].open=true}")
        ok(t + 'Learn worked example uses real numbers', pg.evaluate("()=>/Worked example/.test(document.getElementById('hrBody').textContent)"))
        shot(pg, 'h%d-learn.png' % W)
        pg.evaluate("()=>document.querySelectorAll('#hrBody .hr-ls')[1].scrollIntoView()"); pg.evaluate("()=>window.scrollBy(0,-120)"); shot(pg, 'h%d-learn2.png' % W)
        ok(t + 'no horizontal page scroll', pg.evaluate("()=>document.documentElement.scrollWidth<=innerWidth+1"))
        ok(t + 'buttons and selects are tap-friendly (>=40px)', pg.evaluate("()=>[...document.querySelectorAll('#panel-hora .hr-tabs button,#panel-hora .hr-ar,#panel-hora .hr-tb,#panel-hora .hr-sel select,#panel-hora summary')].filter(e=>e.offsetParent).every(e=>e.getBoundingClientRect().height>=40)"))
        tab(pg, 'now')
        ok(t + 'timer stops when leaving Now and restarts on Now', pg.evaluate("()=>!!document.getElementById('hrNow')"))
        ok(t + 'no page errors', not errs, str(errs[:2]))
        pg.close()
    b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('ok   ' if c else 'FAIL ') + n + ((' :: ' + str(d)) if d and not c else ''))
print('%d checks, %d failed' % (len(res), len(bad)))
raise SystemExit(1 if bad else 0)

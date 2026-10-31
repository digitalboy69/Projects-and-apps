# Notepad side menu redesign: stats, quick find, collapsible sections (saved), tag chips + show all, recent notes, solid drawer on phone. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/notepad_sidemenu_test.py
import functools, http.server, os, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = 'http://127.0.0.1:%d/apps/notepad/index.html' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
SEED = """()=>{const S=__np.S(),T=['marriage','career','dasha','client','saturn','jupiter','remedy','muhurta','transit','sade-sati','rahu','ketu'];
 for(let i=0;i<5;i++)S.notes.push({id:'x'+i,title:['Rahul chart','Priya marriage query','Saturn transit notes','Muhurta list','Remedies draft'][i],html:'<p>text</p>',color:'',tags:T.slice(i,i+8),nb:S.nbs[0].id,pin:i==0,trash:false,created:Date.now(),updated:Date.now()-i*1000});
 document.querySelector('.nv[data-v=all]').click()}"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    for W, H in ((1100, 760), (390, 800)):
        tag = '%dpx ' % W; phone = W < 760; errs = []
        pg = b.new_page(viewport={'width': W, 'height': H}); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('http://127.0.0.1') else r.abort())
        pg.goto(URL); pg.wait_for_timeout(500); ev = pg.evaluate; ev(SEED); pg.wait_for_timeout(200)
        if phone: ev("()=>document.getElementById('app').classList.add('sidev')"); pg.wait_for_timeout(200)
        ok(tag + 'stats tiles show notes, to do, waiting', ev("()=>document.querySelectorAll('#sst .st').length===3&&+document.querySelector('#sst .st b').textContent>=5"))
        ok(tag + 'tag chips shown, only 10 until Show all', ev("()=>document.querySelectorAll('.tgc .tagc').length===10&&!!document.querySelector('.nmore')"))
        ev("()=>document.querySelector('.nmore').click()"); ok(tag + 'Show all lists every tag', ev("()=>document.querySelectorAll('.tgc .tagc').length>10"))
        if phone: ev("()=>document.getElementById('app').classList.add('sidev')")
        ev("()=>document.querySelector('.tagc').click()"); pg.wait_for_timeout(250)
        ok(tag + 'tag chip opens that tag view', ev("()=>__np.ui.view.startsWith('tag:')"))
        if phone: ev("()=>document.getElementById('app').classList.add('sidev')"); pg.wait_for_timeout(150)
        ev("()=>document.querySelector('.nht[data-sec=nb]').click()"); pg.wait_for_timeout(150)
        ok(tag + 'section collapses and is remembered', ev("()=>document.querySelectorAll('.ng')[1].classList.contains('shut')||[...document.querySelectorAll('.ng')].some(g=>g.previousElementSibling.querySelector('[data-sec=nb]')&&g.classList.contains('shut'))") and ev("()=>JSON.parse(localStorage.getItem('jn_nvc')).nb===true"))
        ev("()=>document.querySelector('.nht[data-sec=nb]').click()")
        ok(tag + 'recent lists latest notes', ev("()=>document.querySelectorAll('.nv.rc').length===3&&document.querySelector('.nv.rc .l').textContent==='Rahul chart'"))
        ev("()=>document.querySelector('.nv.rc').click()"); pg.wait_for_timeout(300)
        ok(tag + 'recent note opens it', ev("()=>__np.ui.sel==='x0'"))
        if phone: ev("()=>document.getElementById('app').classList.add('sidev')"); pg.wait_for_timeout(150)
        ev("()=>document.getElementById('bFind').click()"); pg.wait_for_timeout(300)
        ok(tag + 'quick find opens the command palette', ev("()=>document.getElementById('ovc').classList.contains('on')||getComputedStyle(document.getElementById('ovc')).display!=='none'"))
        ev("()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))")
        if phone:
            ev("()=>document.getElementById('app').classList.add('sidev')"); pg.wait_for_timeout(150)
            a = ev("()=>getComputedStyle(document.getElementById('side')).backgroundColor")
            ok(tag + 'drawer is solid (not see-through)', a.startswith('rgb(') or a.endswith(', 1)'), a)
            ok(tag + 'tapping outside closes it', ev("()=>{document.getElementById('lst').click();return !document.getElementById('app').classList.contains('sidev')}"))
        ok(tag + 'no sideways scroll', ev("()=>document.documentElement.scrollWidth<=innerWidth+1"))
        ok(tag + 'no page errors', not errs, errs[:2]); pg.close()
    b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)

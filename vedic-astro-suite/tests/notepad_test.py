# Test of the Notepad app (apps/notepad): typing, links, templates from every view, side menu, Settings tab and its on/off switches.
# Run: python3 tests/notepad_test.py   (CHROMIUM=/path/to/chrome if not at the default)
import functools, http.server, os, socketserver, sys, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = 'http://127.0.0.1:%d/apps/notepad/index.html' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
def run(b, W, H):
    tag = '%dpx ' % W
    ctx = b.new_context(viewport={'width': W, 'height': H}); ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=URL.rsplit('/apps', 1)[0])
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('dialog', lambda d: d.accept())
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('http://127.0.0.1') else r.abort())
    pg.goto(URL); pg.wait_for_timeout(500); ev = pg.evaluate
    S = lambda: ev("()=>JSON.parse(JSON.stringify(__np.S()))")
    phone = W <= 760
    def drawer():
        if phone: ev("()=>document.getElementById('app').classList.add('sidev')"); pg.wait_for_timeout(150)
    def new():
        pg.click('#bNew2' if phone else '#bNew'); pg.wait_for_timeout(300)
    # typing keeps the cursor at the end
    new(); pg.click('#ed'); pg.keyboard.type('hello brave new world'); pg.wait_for_timeout(250)
    ok(tag + 'typing keeps order', ev("()=>document.getElementById('ed').innerText.trim()") == 'hello brave new world', ev("()=>document.getElementById('ed').innerText"))
    pg.keyboard.press('Enter'); pg.keyboard.type('# '); pg.keyboard.type('Head'); ok(tag + '# + space still makes heading', ev("()=>!!document.querySelector('#ed h1')"))
    # settings tab
    drawer(); pg.click('.nv[data-v=settings]'); pg.wait_for_timeout(300)
    ok(tag + 'settings tab opens', ev("()=>document.querySelectorAll('.sw input[data-opt]').length") >= 8)
    dflt = ev("()=>({l:document.querySelector('[data-opt=lineCopy]').checked,c:document.querySelector('[data-opt=cardCopy]').checked})")
    ok(tag + 'copy buttons are OFF by default', dflt == {'l': False, 'c': False}, dflt)
    ok(tag + 'no line-copy button when off', ev("()=>document.getElementById('lineCopy').hidden"))
    ok(tag + 'no sideways scroll in settings', ev("()=>document.documentElement.scrollWidth<=innerWidth+1"))
    # switch things on
    for k in ['lineCopy', 'cardCopy']: pg.evaluate("(k)=>{const i=document.querySelector('[data-opt='+k+']');i.checked=true;i.dispatchEvent(new Event('change',{bubbles:true}))}", k)
    pg.wait_for_timeout(300)
    ok(tag + 'switch saved', S()['set']['o']['lineCopy'] is True and S()['set']['o']['cardCopy'] is True)
    # note list shows card copy
    drawer(); pg.click('.nv[data-v=all]'); pg.wait_for_timeout(300)
    ok(tag + 'card copy button shows when on', ev("()=>getComputedStyle(document.querySelector('#items .cc')).display")!='none')
    ev("()=>document.querySelector('#items [data-id]').click()"); pg.wait_for_timeout(300)
    # line copy button follows the line and copies it
    pg.click('#ed h1'); pg.wait_for_timeout(300)
    ok(tag + 'line copy button appears when on', ev("()=>!document.getElementById('lineCopy').hidden"))
    pg.click('#lineCopy'); pg.wait_for_timeout(300)
    clip = ev("()=>navigator.clipboard.readText()"); ok(tag + 'line copy copies that line', clip.strip() == 'Head', repr(clip))
    # card copy copies the whole note
    if phone: ev("()=>document.getElementById('app').classList.remove('edit')")
    pg.wait_for_timeout(200); pg.click('#items .cc'); pg.wait_for_timeout(300)
    ok(tag + 'card copy copies note', 'hello brave new world' in ev("()=>navigator.clipboard.readText()"))
    # more switches
    def sw(k, v): pg.evaluate("([k,v])=>{const i=document.querySelector('[data-opt='+k+']');i.checked=v;i.dispatchEvent(new Event('change',{bubbles:true}))}", [k, v]); pg.wait_for_timeout(200)
    drawer(); pg.click('.nv[data-v=settings]'); pg.wait_for_timeout(300)
    sw('toolbar', False); drawer(); pg.click('.nv[data-v=all]'); pg.wait_for_timeout(200); ev("()=>document.querySelector('#items [data-id]').click()"); pg.wait_for_timeout(300)
    ok(tag + 'toolbar can be hidden', ev("()=>getComputedStyle(document.getElementById('tb')).display")=='none')
    drawer(); pg.click('.nv[data-v=settings]'); pg.wait_for_timeout(300); sw('toolbar', True); sw('md', False); sw('compact', True)
    ok(tag + 'compact class set', ev("()=>document.getElementById('app').classList.contains('compact')"))
    drawer(); pg.click('.nv[data-v=all]'); pg.wait_for_timeout(200); ev("()=>document.querySelector('#items [data-id]').click()"); pg.wait_for_timeout(300)
    pg.click('#ed'); pg.keyboard.press('Control+End'); pg.keyboard.press('Enter'); pg.keyboard.type('- plain')
    ok(tag + 'typing shortcuts can be turned off', ev("()=>document.querySelectorAll('#ed ul').length")==0)
    # persists after reload
    pg.reload(); pg.wait_for_timeout(500)
    o = S()['set']['o']; ok(tag + 'switches survive reload', o['lineCopy'] and o['cardCopy'] and not o['md'] and o['compact'] and o['toolbar'], o)
    # reset
    drawer(); pg.click('.nv[data-v=settings]'); pg.wait_for_timeout(300); pg.click('[data-a=resetopt]'); pg.wait_for_timeout(300)
    o = S()['set']['o']; ok(tag + 'reset puts defaults back', not o['lineCopy'] and not o['cardCopy'] and o['md'] and not o['compact'], o)
    # template from the Tasks view opens the note (was a bug)
    drawer(); pg.click('.nv[data-v=tasks]'); pg.wait_for_timeout(300); drawer(); pg.click('#bTpl'); pg.wait_for_timeout(300); pg.click('[data-tpl]:nth-child(2)'); pg.wait_for_timeout(500)
    ok(tag + 'template from Tasks view opens editor', ev("()=>!!document.getElementById('ttl')"))
    ok(tag + 'drawer closed after template', not ev("()=>document.getElementById('app').classList.contains('sidev')"))
    # link to a note keeps the note open (was a bug)
    new(); pg.fill('#ttl', 'Source'); pg.click('#ed'); pg.keyboard.type('see '); pg.click('[data-a=wiki]'); pg.wait_for_timeout(300); pg.click('#wl [data-wk]'); pg.wait_for_timeout(300)
    ok(tag + 'note link inserted and note stays open', ev("()=>document.getElementById('ttl')&&document.getElementById('ttl').value")=='Source' and ev("()=>!!document.querySelector('#ed a.wl')"))
    ok(tag + 'link lands after the typed text', ev("()=>document.getElementById('ed').innerText.trim().startsWith('see')"), ev("()=>document.getElementById('ed').innerText"))
    if phone:
        ev("()=>document.getElementById('app').classList.add('sidev')"); pg.wait_for_timeout(150); pg.mouse.click(W - 6, 400); pg.wait_for_timeout(200)
        ok(tag + 'drawer closes when tapping outside', not ev("()=>document.getElementById('app').classList.contains('sidev')"))
    ok(tag + 'no page errors', not errs, errs[:2])
    ctx.close()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    run(b, 390, 800); run(b, 1280, 800); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, '' if c else d)
raise SystemExit(0 if all(c for _, c, _ in res) else 1)

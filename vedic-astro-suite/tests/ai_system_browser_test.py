# AI system (js/158 AIX, js/159 AIS+AIE, js/160 panel): index resolve/get for EVERY entry, route -> fetch -> answer with a stubbed provider,
# skills followed exactly, persona switch, router off, key export rules, and the panel at 390 and 360. AI_SHOTS=dir saves screenshots.
import functools, http.server, json, os, socketserver, threading, tempfile
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); SHOTS = os.environ.get('AI_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
A = dict(name='Demo A', dob='2000-01-01', tob='06:30', place='Demo City', lat=28.6139, lon=77.2090, tz=5.5)
bad = 0
def ok(n, c, d=''):
    global bad; bad += (not c); print(('ok   ' if c else 'FAIL ') + n, '' if c else d)
calls = []
def stub(route):
    req = route.request; body = json.loads(req.post_data or '{}'); sysm = body['messages'][0]['content']; calls.append({'sys': sysm, 'body': body, 'auth': req.headers.get('authorization')})
    if 'data router' in sysm:
        txt = '{"need":["house.10","planet.Saturn","varga.D9","raw:planets.Moon.nakshatra.name","bogus.id"],"note":"career"}'
    else:
        txt = 'Saturn in the 10th [house.10] gives slow, steady career growth.\n- Point one\n- Point two'
    route.fulfill(status=200, content_type='application/json', headers={'access-control-allow-origin': '*'}, body=json.dumps({'choices': [{'message': {'content': txt}}]}))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'))
    for W in (390, 360):
        pg = b.new_page(viewport={'width': W, 'height': 800}); errs = []; t = '%d: ' % W
        pg.on('pageerror', lambda e: errs.append(str(e)))
        def route(r):
            u = r.request.url
            if u.startswith('https://api.stub.test/'):
                if r.request.method == 'OPTIONS': r.fulfill(status=204, headers={'access-control-allow-origin': '*', 'access-control-allow-headers': '*'}); return
                stub(r); return
            r.continue_() if u.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort()
        pg.route('**/*', route); pg.goto(PAGE); pg.wait_for_selector('#birthForm')
        pg.evaluate("(p)=>{localStorage.removeItem('vas_ai_v1');loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}", A); pg.wait_for_selector('#results.show', timeout=20000); pg.wait_for_timeout(1200)
        pg.evaluate("()=>switchAppTab('panel-ai')"); pg.wait_for_timeout(600)
        # 1 every index entry resolves
        r = pg.evaluate("()=>{const bad=[];AIX.list().forEach(e=>{const id=e.p?e.id+'.'+e.p[0]:e.id;const g=AIX.get(id);if(!g.ok)bad.push(id+': '+g.text)});return bad}")
        ok(t + 'every index entry returns a value for a real chart', not r, r)
        r = pg.evaluate("()=>[AIX.get('raw:planets.Moon.nakshatra.name').ok,AIX.get('house.10').ok,AIX.get('varga.D9').ok,AIX.get('planet.Ketu').ok,AIX.get('nope.x').ok,AIX.get('raw:no.such.path').ok,AIX.get('house.13').ok,AIX.catalogue().length<4200]")
        ok(t + 'raw path, house, varga resolve; unknown ids are refused; catalogue stays small', r == [True, True, True, True, False, False, False, True], r)
        # skill parsing
        r = pg.evaluate("()=>{const s=AIS.parseSkill('---\\nname: Career\\ndescription: d\\nvariables: house.10, bad.var, dasha.current\\n---\\nAlways start with the word SATURN.','c.md').skill;return [s.name,s.variables.join(','),s.instructions]}")
        ok(t + 'markdown skill parsed, bad variable ids dropped', r == ['Career', 'house.10,dasha.current', 'Always start with the word SATURN.'], r)
        # provider
        pg.evaluate("()=>{const s=AIS.load();Object.assign(s.providers[0],{name:'Stub',kind:'openai',baseUrl:'https://api.stub.test/v1',apiKey:'sk-test-123',model:'m1',auth:'bearer'});s.settings.noticeOk=true;AIS.save()}")
        pg.evaluate("()=>AIUI.render()"); pg.wait_for_timeout(300)
        # skill upload via file input
        pg.evaluate("()=>{AIUI.S.tab='skills';AIUI.render()}")
        tf = tempfile.NamedTemporaryFile('w', suffix='.md', delete=False, prefix='career-'); tf.write('---\nname: Career reader\nvariables: dasha.current\n---\nBegin every answer with the exact words: SATURN SAYS.'); tf.close()
        pg.set_input_files('#aixFile', tf.name); pg.wait_for_timeout(600)
        ok(t + 'skill uploaded and switched on', pg.evaluate("()=>AIS.load().skills.length===1&&AIE.activeSkills().length===1"))
        if SHOTS: os.makedirs(SHOTS, exist_ok=True); pg.screenshot(path=f'{SHOTS}/ai_{W}_skills.png')
        # chat flow
        pg.evaluate("()=>{AIUI.S.tab='chat';AIUI.render()}"); calls.clear()
        pg.fill('#aixIn', 'How is my career?'); pg.click('[data-act=send]'); pg.wait_for_selector('.aix-a .aix-used', timeout=15000)
        ok(t + 'two calls: route then answer', len(calls) == 2 and 'data router' in calls[0]['sys'] and 'data router' not in calls[1]['sys'], len(calls))
        ok(t + 'key sent only as the Authorization header', all(c['auth'] == 'Bearer sk-test-123' for c in calls))
        a = calls[1]['sys']
        ok(t + 'answer prompt has the fetched variables, pinned summary and skill variable', all(('[' + i + ']') in a for i in ('house.10', 'planet.Saturn', 'varga.D9', 'raw:planets.Moon.nakshatra.name', 'chart.summary', 'dasha.current')), [i for i in ('house.10','chart.summary','dasha.current') if ('['+i+']') not in a])
        ok(t + 'unrequested variables are NOT sent (no overload)', all(('[' + i + ']') not in a for i in ('yogas', 'shadbala', 'ashtakavarga.sav', 'bogus.id', 'transit.now')))
        ok(t + 'skill instructions are in the prompt verbatim', 'Begin every answer with the exact words: SATURN SAYS.' in a and a.index('ACTIVE SKILLS') < a.index('RULES'))
        ok(t + 'router saw the catalogue, not chart data', 'INDEX:' in calls[0]['body']['messages'][1]['content'] and '"longitude"' not in calls[0]['body']['messages'][1]['content'])
        ok(t + 'chat shows answer and the used variable chips', pg.evaluate("()=>{const u=[...document.querySelectorAll('.aix-used i')].map(x=>x.textContent);return u.includes('house.10')&&u.includes('varga.D9')&&!u.includes('bogus.id')}"))
        if SHOTS: pg.screenshot(path=f'{SHOTS}/ai_{W}_chat.png')
        # persona switch
        pg.evaluate("()=>{AIS.load().activePersona='analyst';AIS.save()}"); calls.clear()
        pg.fill('#aixIn', 'Next'); pg.click('[data-act=send]'); pg.wait_for_function("()=>document.querySelectorAll('.aix-a .aix-used').length>=2", timeout=15000)
        ok(t + 'persona switch changes the system prompt', 'precise analyst' in calls[1]['sys'])
        # router off
        pg.evaluate("()=>{AIS.load().settings.router=false;AIS.save()}"); calls.clear()
        pg.fill('#aixIn', 'Again'); pg.click('[data-act=send]'); pg.wait_for_function("()=>document.querySelectorAll('.aix-a .aix-used').length>=3", timeout=15000)
        ok(t + 'router off: one call using pinned + skill variables', len(calls) == 1 and '[chart.summary]' in calls[0]['sys'] and '[house.10]' not in calls[0]['sys'], len(calls))
        # export rules
        r = pg.evaluate("()=>[AIS.exportJSON(false).includes('sk-test-123'),AIS.exportJSON(true).includes('sk-test-123')]")
        ok(t + 'export hides keys unless asked', r == [False, True], r)
        # tabs render at phone width
        for tab in ('vars', 'persona', 'skills', 'set'):
            pg.evaluate("(x)=>{AIUI.S.tab=x;AIUI.render()}", tab); pg.wait_for_timeout(250)
            ok(t + tab + ' tab: no horizontal overflow', pg.evaluate("()=>document.documentElement.scrollWidth<=innerWidth+1"))
            if SHOTS: pg.screenshot(path=f'{SHOTS}/ai_{W}_{tab}.png')
        pg.evaluate("()=>{AIUI.S.tab='vars';AIUI.S.prev='house.10';AIUI.render()}"); pg.wait_for_timeout(200)
        if SHOTS: pg.screenshot(path=f'{SHOTS}/ai_{W}_vars_preview.png')
        ok(t + 'no page errors', not errs, errs)
        pg.close()
    b.close()
print('FAILED' if bad else 'ALL OK'); raise SystemExit(1 if bad else 0)

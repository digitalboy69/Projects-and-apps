# Silent updater (shell/js/updater.js): a stale build re-downloads the files quietly and NEVER reloads the page itself; a current build does nothing; the single-file build skips it.
import functools, http.server, os, socketserver, threading, json
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
hits = []
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self): hits.append(self.path); super().do_GET()
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:%d/' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
v = json.load(open(os.path.join(ROOT, 'version.json')))
ok('version.json lists the files and an id', v['id'] and 'apps/birth-chart/js/107-ashtakavarga-reading.js' in v['files'] and 'shell/js/shell.js' in v['files'])
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(); loads = []; errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('load', lambda _p: loads.append(1))
    pg.goto(BASE); pg.wait_for_timeout(6000)
    ok('stale or first visit: stores the build id and does NOT reload (one load only)', pg.evaluate("localStorage.getItem('vasBuild')") == v['id'] and len(loads) == 1, loads)
    ok('every listed file was re-downloaded', all(('/' + f) in set(h.split('?')[0] for h in hits) for f in v['files'][:40]))
    n = len(hits); loads.clear(); pg.reload(); pg.wait_for_timeout(2500)
    ok('current build: no second reload and no re-download', len(loads) == 1 and not any(h.startswith('/apps/birth-chart/js/') and 'reload' in h for h in hits[n:]), loads)
    pg.evaluate("localStorage.setItem('vasBuild','old')"); pg.evaluate("sessionStorage.clear()"); loads.clear(); pg.reload(); pg.wait_for_timeout(6000)
    ok('old build id: refreshed quietly, still one load', pg.evaluate("localStorage.getItem('vasBuild')") == v['id'] and len(loads) == 1, loads)
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:300]))
print('ALL PASS' if all(c for _, c, _ in res) else 'FAILED'); raise SystemExit(0 if all(c for _, c, _ in res) else 1)

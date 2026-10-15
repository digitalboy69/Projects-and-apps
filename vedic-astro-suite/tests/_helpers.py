"""Shared test helpers. VAX_TARGET=dist (default): open dist/vedic-astro-suite-readable.html from disk.
VAX_TARGET=hosted: serve the project folder on a local web server and open index.html (the multi-file version)."""
import functools, http.server, os, socketserver, threading
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TARGET = os.environ.get('VAX_TARGET', 'dist')
BASE = None
if TARGET == 'hosted':
    class _Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    _srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(_Quiet, directory=ROOT))
    _srv.daemon_threads = True
    threading.Thread(target=_srv.serve_forever, daemon=True).start()
    BASE = 'http://127.0.0.1:%d' % _srv.server_address[1]
    PAGE = BASE + '/index.html'
else:
    PAGE = 'file://' + os.path.join(ROOT, 'dist', 'vedic-astro-suite-readable.html')
CUSTOMER = 'file://' + os.path.join(ROOT, 'dist', 'customer-edition.html')
def is_local(u):
    return u.startswith(('file:', 'data:', 'blob:')) or bool(BASE and u.startswith(BASE))

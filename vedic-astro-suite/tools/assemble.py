"""Shared helpers: turn the folder project into single-file documents.

The source of truth is the folder tree (index.html, shell/, apps/*, shared/, vendor/).
Single-file builds are made by inlining every local <link rel=stylesheet> / <script src> and by
embedding the four apps in <script type="text/plain"> slots inside the shell (loaded through srcdoc).
"""
import base64, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPS = {'A': 'sky3d', 'B': 'birth-chart', 'N': 'notepad', 'Dev': 'developer'}   # shell key -> folder in apps/


def rd(path):
    with open(os.path.join(ROOT, path) if not os.path.isabs(path) else path, encoding='utf-8') as f:
        return f.read()


def _is_local(url):
    return not re.match(r'(?:[a-z][a-z0-9+.-]*:|//)', url, re.I)


def inline_assets(html, base_dir):
    """Replace local stylesheet links and script tags with inline <style>/<script> blocks."""
    def css(m):
        href = re.search(r'href="([^"]+)"', m.group(0))
        if 'stylesheet' not in m.group(0) or not href or not _is_local(href.group(1)):
            return m.group(0)
        return '<style>\n' + rd(os.path.normpath(os.path.join(base_dir, href.group(1)))).strip('\n') + '\n</style>'

    def js(m):
        src = re.search(r'src="([^"]+)"', m.group(1))
        if not src or not _is_local(src.group(1)):
            return m.group(0)
        code = rd(os.path.normpath(os.path.join(base_dir, src.group(1)))).replace('</script', '<\\/script')
        return '<script>\n' + code.strip('\n') + '\n</script>'

    html = re.sub(r'<link\b[^>]*>', css, html)
    html = re.sub(r'<script\b([^>]*)>\s*</script>', js, html)
    return html


def load_app(name):
    """Full single document of one app (all css/js inlined)."""
    d = os.path.join(ROOT, 'apps', name)
    return inline_assets(rd(os.path.join(d, 'index.html')), d)


def shell_html(slots, enc, patch=None):
    """The shell with its assets inlined and the app documents embedded.
    slots: {'A': html, 'B': html, 'N': html, 'Dev': html}; enc: 'plain' or 'b64'."""
    t = rd('index.html')
    t = re.sub(r'<!--HOSTED-ONLY-->.*?<!--/HOSTED-ONLY-->\n?', '', t, flags=re.S)      # folder-only guard
    blocks = []
    for k, html in slots.items():
        if enc == 'b64':
            body = base64.b64encode(html.encode('utf-8')).decode()
        else:
            body = '\n' + html.replace('</script', '<\\/script').replace('<!--', '<\\!--')
        blocks.append(f'<script type="text/plain" id="src{k}" data-enc="{enc}">{body}</script>\n')
    marker = '<script src="shell/js/shell.js"></script>'
    assert t.count(marker) == 1
    t = t.replace(marker, '<!--APP_SLOTS-->' + marker)
    t = inline_assets(t, ROOT)                      # shell css/js first, so app text can never be touched by this step
    t = t.replace('<!--APP_SLOTS-->', ''.join(blocks))
    if patch:
        t = patch(t)
    return t

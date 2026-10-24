# Writes version.json at the project root: a build id (hash of every web file) and the list of those files.
# shell/js/updater.js reads it to refresh stale cached files silently. Run by build.py.
import hashlib, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def gen():
    files = ['index.html']
    for top in ('apps', 'shared', 'shell', 'vendor'):
        for d, _, fs in os.walk(os.path.join(ROOT, top)):
            for f in fs:
                if f.endswith(('.js', '.css', '.html', '.json')):
                    files.append(os.path.relpath(os.path.join(d, f), ROOT).replace(os.sep, '/'))
    files.sort(); h = hashlib.sha1()
    for p in files:
        h.update(p.encode()); h.update(open(os.path.join(ROOT, p), 'rb').read())
    out = json.dumps({'id': h.hexdigest()[:12], 'files': files}, separators=(',', ':'))
    cur = open(os.path.join(ROOT, 'version.json')).read() if os.path.exists(os.path.join(ROOT, 'version.json')) else ''
    if cur != out: open(os.path.join(ROOT, 'version.json'), 'w').write(out)
if __name__ == '__main__': gen()

"""Makes one ready-to-load file per app: apps/<name>/index.bundle.html = the app's index.html with every local
stylesheet and script inlined, each script still its own <script> block (so behaviour is identical to the folder version,
only the ~260 network requests become 1). The shell loads these; the plain index.html + css/ + js/ stay for editing and tests.
Run by build.py (and --bundles, used by the git hook). Open the shell with ?dev to load the plain source files instead."""
import os, assemble

def gen():
    changed = []
    for name in assemble.APPS.values():
        html = assemble.load_app(name)
        path = os.path.join(assemble.ROOT, 'apps', name, 'index.bundle.html')
        old = open(path, encoding='utf-8').read() if os.path.exists(path) else None
        if old != html:
            with open(path, 'w', encoding='utf-8', newline='') as f: f.write(html)
            changed.append(name)
    return changed

if __name__ == '__main__':
    print('bundles updated:', gen() or 'none')

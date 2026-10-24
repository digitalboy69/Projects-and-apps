# Usage: python3 build.py            (from the project root; this file is what it runs)
#   -> dist/vedic-astro-suite-readable.html  (single file, plain code)
#   -> dist/vedic-astro-suite-2.html         (single file, base64 copy)
#   -> regenerates symbols.idx + the AUTO block of AI_GUIDE.md
#        python3 build.py --guide    only regenerate symbols.idx + AI_GUIDE.md (fast; used by the git hook)
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
os.chdir(os.path.dirname(HERE))
import assemble, guide

if '--guide' in sys.argv:
    guide.gen_guide(); sys.exit(0)
os.makedirs('dist', exist_ok=True)
slots = {k: assemble.load_app(v) for k, v in assemble.APPS.items()}
for name, enc in (('vedic-astro-suite-readable.html', 'plain'), ('vedic-astro-suite-2.html', 'b64')):
    with open(os.path.join('dist', name), 'w', encoding='utf-8') as f:
        f.write(assemble.shell_html(slots, enc))
import version; version.gen()
print('built')
guide.gen_guide()
import subprocess; subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'check_structure.py')])

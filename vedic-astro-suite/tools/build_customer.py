# Builds the CUSTOMER EDITION (dist/customer-edition.html) from the folder project WITHOUT modifying it.
# Differences: no Developer card/menu, no "Copy" controls, brand + feature hooks (editions/customer/*.js).
# Usage: python3 tools/build_customer.py
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
os.chdir(os.path.dirname(HERE))
import assemble
rd = assemble.rd

def sub1(pat, rep, s, flags=re.S, min_n=1):
    s2, n = re.subn(pat, lambda m: rep, s, flags=flags); assert n >= min_n, ('no match: ' + pat[:60]); return s2

slots = {k: assemble.load_app(v) for k, v in assemble.APPS.items()}
slots['Dev'] = '<!DOCTYPE html><html><head><meta charset="utf-8"><title></title></head><body></body></html>'
# --- Birth Chart: remove the 'Contact Developer' tile from the home grid
n0 = len(slots['B'])
slots['B'] = sub1(r"\n ?\['panel-contact','[^\]]*\]\];", '\n];', slots['B'])
assert len(slots['B']) < n0
# --- brand/feature layer into every app document
layer = '<script>' + rd('editions/customer/customer-layer.js').replace('</script', '<\\/script') + '</script>'
for k in ('A', 'B', 'N'):
    slots[k] = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + layer, slots[k], count=1, flags=re.I)
    assert 'CUSTOMER LAYER' in slots[k]

def patch_shell(t):
    t = sub1(r'\s*<button class="sw-item"[^>]*data-act="dev">.*?</button>', '', t)            # no Developer entry
    t = sub1(r"\n\s*if \(location\.hash === '#developer'\) openDev\(\);", '', t)               # no #developer deep link
    t = t.replace('</body>', '<script>' + rd('editions/customer/customer-top.js') + '</script></body>', 1)
    assert 'customer_top' in t or 'vcxBrand' in t
    return t

html = assemble.shell_html(slots, 'b64', patch_shell)
os.makedirs('dist', exist_ok=True)
with open('dist/customer-edition.html', 'w', encoding='utf-8') as f: f.write(html)
print('dist/customer-edition.html', len(html) // 1024, 'KB')

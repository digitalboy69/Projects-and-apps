# Usage: python3 tools/build_customer.py && python3 tests/customer_smoke.py   (env THREE_JS optional)
import os, sys, json
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.dirname(__file__)); from _helpers import PAGE, CUSTOMER, is_local; PAGE = CUSTOMER
def route(r):
    u = r.request.url
    if is_local(u): return r.continue_()
    if 'nominatim' in u: return r.fulfill(status=200, content_type='application/json', body=json.dumps([{"display_name": "Mumbai, India", "lat": "19.076", "lon": "72.877"}]))
    return r.abort()
res = []; ok = lambda n, c, d='': res.append((n, bool(c), d))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    ctx = b.new_context(viewport={'width': 1280, 'height': 860}); ctx.route('**/*', route)
    ctx.add_init_script("window.__VAX_BRAND={brand_name:'Acharya Test',tagline:'Vedic guidance',phone:'99999',accent:'#3aa0ff',logo:''};window.__VAX_FEATURES={};")
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(PAGE); pg.wait_for_timeout(3500)
    ok('no Developer menu item', pg.evaluate("()=>!document.querySelector('.sw-item[data-act=dev]')"))
    ok('brand badge', pg.evaluate("()=>!!document.getElementById('vcxBrand')&&document.getElementById('vcxBrand').textContent.includes('Acharya Test')"))
    ok('page title = brand', pg.title() == 'Acharya Test', pg.title())
    fr = [f for f in pg.frames if f != pg.main_frame and 'Rectification' in (f.title() or '')]
    ok('chart frame', fr)
    if fr:
        fr = fr[0]
        fr.fill('#profileName', 'Test'); fr.evaluate("()=>{const d=document.getElementById('dobInput');d.value='1990-05-15';d.dispatchEvent(new Event('input',{bubbles:true}))}")
        fr.evaluate("()=>{const t=document.querySelector('#birthForm input[type=time]');if(t){t.value='10:30';t.dispatchEvent(new Event('input',{bubbles:true}))}}")
        fr.click('.lp-tools [data-m=map]'); pg.wait_for_timeout(400); pg.fill('#lpQ', 'Mumbai'); pg.wait_for_timeout(900); pg.keyboard.press('Enter'); pg.wait_for_timeout(500); pg.click('#lpUse'); pg.wait_for_timeout(300)
        fr.click('#castBtn'); pg.wait_for_timeout(5000)
        fr.evaluate("()=>openExportModal()"); pg.wait_for_timeout(700)
        ok('Copy data button hidden', fr.evaluate("()=>getComputedStyle(document.getElementById('exportCopyBtn')).display==='none'"))
        ok('Download button still visible', fr.evaluate("()=>getComputedStyle(document.getElementById('exportDownloadBtn')).display!=='none'"))
        ok('developer strip hidden', fr.evaluate("()=>{const e=document.querySelector('.export-dev');return !e||getComputedStyle(e).display==='none'}"))
        ok('contact dev button hidden', fr.evaluate("()=>getComputedStyle(document.getElementById('contactDevBtn')).display==='none'"))
        ok('clipboard text blocked', fr.evaluate("()=>navigator.clipboard.writeText('secret data here').then(()=>false,()=>true)"))
        ok('execCommand copy blocked', fr.evaluate("()=>{const t=document.createElement('textarea');t.value='secret data';document.body.appendChild(t);t.select();const r=document.execCommand('copy');t.remove();return r===false}"))
        rep = fr.evaluate("()=>buildFullReportText(currentChartForModal,currentProfileForExport,null)")
        ok('report has brand header', rep.startswith('Acharya Test'), rep[:40])
        ok('accent applied', fr.evaluate("()=>getComputedStyle(document.documentElement).getPropertyValue('--gold').trim()")=='#3aa0ff')
        ok('home grid lacks Contact Developer', fr.evaluate("()=>!document.body.innerText.includes('Contact Developer')"))
        ok('text not selectable', fr.evaluate("()=>getComputedStyle(document.body).userSelect")=='none')
    ok('no page errors', not errs, '; '.join(errs)[:300])
    b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n, d)
print(sum(c for _, c, _ in res), '/', len(res))

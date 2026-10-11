# Usage: python3 tests/smoke.py            (after python3 build.py)
# Env: THREE_JS=/path/to/three.min.js (r128) enables the 3D checks. CHROMIUM=/opt/pw-browsers/chromium by default.
# Checks: wrapper loads without page errors, birth chart casts, outer planets present, export modal + report, 3D solar view (if THREE_JS).
import os, sys, json
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PAGE = os.environ.get('PAGE') or ('file://' + os.path.join(ROOT, 'vedic-astro-suite-readable.html'))
THREE = open(os.environ['THREE_JS'], 'rb').read() if os.environ.get('THREE_JS') else None
def route(r):
    u = r.request.url
    if THREE and 'three.min.js' in u: return r.fulfill(status=200, content_type='application/javascript', body=THREE)
    if u.startswith(('file:', 'data:', 'blob:')): return r.continue_()
    if 'nominatim' in u: return r.fulfill(status=200, content_type='application/json', body=json.dumps([{"display_name": "Mumbai, India", "lat": "19.076", "lon": "72.8777", "address": {"country_code": "in"}}]))
    return r.abort()
res = []; ok = lambda n, c, d='': res.append((n, bool(c), d))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'), args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    ctx = b.new_context(viewport={'width': 1280, 'height': 860}); ctx.route('**/*', route); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(PAGE); pg.wait_for_timeout(4000)
    fr = [f for f in pg.frames if f != pg.main_frame and 'Rectification' in (f.title() or '')]
    ok('birth chart frame loads', fr)
    if fr:
        fr = fr[0]
        fr.fill('#profileName', 'Test'); fr.fill('#dobInput', '1990-05-15')
        fr.evaluate("()=>{const t=document.querySelector('#birthForm input[type=time]');if(t){t.value='10:30';t.dispatchEvent(new Event('input',{bubbles:true}));}}")
        # place: use the shared LocPicker (search is mocked above)
        fr.click('.lp-tools [data-m=map]'); pg.wait_for_timeout(400); pg.fill('#lpQ', 'Mumbai'); pg.wait_for_timeout(900); pg.keyboard.press('Enter'); pg.wait_for_timeout(500); pg.click('#lpUse'); pg.wait_for_timeout(300)
        fr.click('#castBtn'); pg.wait_for_timeout(5000)
        ok('chart cast', fr.evaluate("()=>!!window.currentChartForModal || typeof currentChartForModal!=='undefined' && !!currentChartForModal"))
        ok('outer planets in chart', fr.evaluate("()=>Object.keys(currentChartForModal.outer||{}).join()")=='Uranus,Neptune,Pluto')
        fr.evaluate("()=>openExportModal()"); pg.wait_for_timeout(500)
        rep = fr.evaluate("()=>buildFullReportText(currentChartForModal,currentProfileForExport,null)")
        ok('report has Outer Planets block', 'Outer Planets' in rep, f'{len(rep)} chars')
    if THREE:
        pg2 = ctx.new_page(); pg2.on('pageerror', lambda e: errs.append('3D:' + str(e)))
        pg2.goto(PAGE + '#sky'); pg2.wait_for_timeout(5000)
        f3 = [f for f in pg2.frames if f != pg2.main_frame and f.evaluate("typeof setSceneView")=='function']
        ok('3D frame + setSceneView', f3)
        if f3:
            f3 = f3[0]; f3.click('#viewSwitch [data-v=solar]'); pg2.wait_for_timeout(1500)
            ok('solar view builds', f3.evaluate("()=>SOL.built && SOL.view==='solar'"))
            f3.click('#solScale [data-s=real]'); pg2.wait_for_timeout(800)
            f3.evaluate("()=>openPlanetDetail('Pluto')"); pg2.wait_for_timeout(600)
            ok('outer popup opens', f3.evaluate("()=>document.querySelector('.pdx-name')&&document.querySelector('.pdx-name').textContent")=='Pluto')
    ok('no page errors', not errs, '; '.join(errs[:3]))
    b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + (f'  ({d})' if d else ''))
sys.exit(0 if all(c for _, c, _ in res) else 1)

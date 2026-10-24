# Checks the Deep reading inside the real production forms (single-file build + customer edition), not the folder version.
# Run: python3 tests/prod_forms_check.py [file ...]   (defaults to dist/vedic-astro-suite-readable.html and dist/customer-edition.html; CHROMIUM=... if needed)
import os, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
files = sys.argv[1:] or [os.path.join(ROOT, 'dist', 'vedic-astro-suite-readable.html'), os.path.join(ROOT, 'dist', 'customer-edition.html')]
bad = 0
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    for f in files:
        pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('file:', 'data:', 'blob:')) else r.abort())
        pg.goto('file://' + f); pg.wait_for_timeout(5000)
        fr = [x for x in pg.frames if x.query_selector('#birthForm')][0]
        fr.evaluate("loadProfileIntoForm({name:'Test',dob:'1995-03-14',tob:'11:00',place:'Hyderabad',lat:17.385,lon:78.4867,tz:5.5});document.getElementById('birthForm').requestSubmit()")
        fr.wait_for_selector('#results.show', timeout=20000)
        o = fr.evaluate("""()=>{const rd=document.querySelector('#panel-reading .rd'),t=[...rd.querySelectorAll('.vx-tabs button:not(.hn-tab):not(.sbr-tab)')].map(b=>b.textContent),pn=[...rd.querySelectorAll(':scope>.vx-pane:not(.hn-pane):not(.sbr-pane)')],c=currentChartForModal;
          return {tabs:t.length,last:t[t.length-1],cards:pn[5].querySelectorAll('details.vx-pl').length-c.dashaData.mahadashas.length,planets:[...pn[2].querySelectorAll('details.vx-pl')].filter(d=>/In real life/.test(d.textContent)).length,
            layers:[typeof VDB,typeof VNK,typeof VMF,typeof VDA,typeof VDR].every(x=>x==='object'),report:/LIFE TIMELINE/.test(buildFullReportText(c,currentProfileForExport,{}))}}""")
        good = o['tabs'] == 6 and o['cards'] == 12 and o['planets'] == 9 and o['layers'] and o['report'] and not errs
        bad += 0 if good else 1
        print(('PASS ' if good else 'FAIL ') + os.path.basename(f), o if not good else '', errs[:2] if errs else ''); pg.close()
    b.close()
raise SystemExit(1 if bad else 0)

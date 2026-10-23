# Test of the PDF book (js/93-pdf-report.js + js/98-pdf-pages.js, global PDFR): one click, no settings; a self-contained, complete document; a real PDF render.
# Run: python3 tests/pdf_report_test.py   (CHROMIUM=/path/to/chrome if not at the default)
import functools, http.server, os, re, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
res = []
def ok(n, c, d=''): res.append((n, bool(c), d))
CAST = "(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}"
CHARTS = [('1995-03-14', '11:00', 17.385, 78.4867, 5.5), ('1947-08-15', '00:00', 28.61, 77.21, 5.5), ('1988-12-21', '03:15', 64.15, -21.94, 0), ('2000-01-01', '00:00', -33.87, 151.21, 11), ('1930-08-30', '15:00', 41.26, -95.93, -6)]
BAN = r"/\b(always|never|certainly|definitely|guaranteed|doomed|destined|fatal|cursed|will die|you will)\b/i"
EXPECT = ['overview', 'chart', 'panchang', 'planets', 'lagnas', 'foundation', 'roles', 'shadbala', 'ashtakavarga', 'strength', 'yogas', 'cautions', 'areas', 'vargas', 'gallery', 'timeline', 'dashas', 'transits', 'houses', 'glossary', 'notes']
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []; warns = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: warns.append(m.text) if 'PDFR' in m.text else None)
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.add_init_script("window.print=function(){try{(window.top.__prints=window.top.__prints||[]).push(document.querySelector('.cover')?'book':'blank')}catch(e){}}")
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    ok('PDFR loaded: 21 sections registered, 9 parts, no settings dialog code', pg.evaluate("typeof PDFR==='object'&&PDFR.sections().length===21&&PDFR.parts.length===9&&typeof PDFR.generate==='function'&&!document.querySelector('.pdfs')&&PDFR.themes===undefined"))
    html0 = ''
    for i, c in enumerate(CHARTS):
        pg.evaluate(CAST, dict(name='Asha <b>Rao</b>', dob=c[0], tob=c[1], place='Test & Place', lat=c[2], lon=c[3], tz=c[4])); pg.wait_for_selector('#results.show', timeout=15000)
        o = pg.evaluate("""()=>{const BAN=%s,ch=currentChartForModal,h=PDFR.build(ch,currentProfileForExport),d=new DOMParser().parseFromString(h,'text/html'),bad=[],t=d.body.textContent.replace(/\\s+/g,' ');
          if(/undefined|NaN|\\[object|\\bnull\\b/.test(t))bad.push('placeholder');if(BAN.test(t.replace(/Death & (rebirth|destruction)/gi,'')))bad.push('absolute word: '+t.match(BAN)[0]);
          if(/(src|href)\\s*=\\s*["']?https?:/i.test(h)||/@import|url\\(\\s*["']?https?:|<script|<link/i.test(h))bad.push('external/script');
          const secs=[...d.querySelectorAll('section.sec')].map(s=>s.id.slice(2));const miss=%s.filter(x=>secs.indexOf(x)<0);if(miss.length)bad.push('missing '+miss.join());
          if(d.querySelectorAll('.divider').length!==9)bad.push('dividers '+d.querySelectorAll('.divider').length);if(!d.querySelector('.cover svg.wheel')||!d.querySelector('.end'))bad.push('cover/end');
          if(d.querySelectorAll('.toc li').length!==secs.length||d.querySelectorAll('.toc .tp').length!==9)bad.push('toc');
          if(d.querySelectorAll('#s-houses .plate').length!==12)bad.push('house plates');if(d.querySelectorAll('#s-areas .plate:not(.deep)').length!==9)bad.push('area plates '+d.querySelectorAll('#s-areas .plate').length);
          if(d.querySelectorAll('#s-planets .plate').length!==9)bad.push('planet plates');
          const nv=Object.keys(ch.vargas).filter(k=>typeof VARGAS!=='undefined'&&VARGAS[k]).length;if(d.querySelectorAll('#s-gallery .vplate').length!==nv||nv<20)bad.push('varga charts '+d.querySelectorAll('#s-gallery .vplate').length+' vs '+nv);
          if(d.querySelectorAll('#s-gallery svg.chart-svg polygon').length!==nv*12)bad.push('gallery houses');
          const per=VDA.timeline(ch).periods.length;if(d.querySelectorAll('#s-dashas .dblock').length!==per)bad.push('dasha blocks');
          const ads=VDA.timeline(ch).periods.reduce((a,p,k)=>a+VDA.antardashas(ch,k).length,0);if(d.querySelectorAll('#s-dashas .dblock tbody tr').length!==ads)bad.push('antardasha rows');
          if(d.querySelectorAll('#s-shadbala table')[0].querySelectorAll('tbody tr').length!==7)bad.push('shadbala rows');if(d.querySelectorAll('#s-ashtakavarga table.heat tbody tr').length!==8)bad.push('ashtakavarga rows');
          if(d.querySelectorAll('#s-ashtakavarga .grid2 figure').length!==7)bad.push('bav charts');if(d.querySelectorAll('#s-panchang .facts>div').length!==9)bad.push('panchang facts');
          if(d.querySelectorAll('#s-chart svg.chart-svg').length!==3||d.querySelectorAll('#s-chart tbody tr').length!==9)bad.push('chart page');
          const y=YGE.detect(ch),gy=d.querySelectorAll('#s-yogas .card').length+d.querySelectorAll('#s-cautions .card').length;if(gy!==y.length)bad.push('yoga cards '+gy+' vs '+y.length);
          if(h.includes('<b>Rao</b>')||!h.includes('Asha &lt;b&gt;Rao&lt;/b&gt;'))bad.push('name not escaped');
          if(!h.includes('size:A4'))bad.push('paper');return {bad:bad.slice(0,6),kb:Math.round(h.length/1024)}}""" % (BAN, str(EXPECT)))
        ok('chart %d: the book is complete (21 sections, 9 dividers, all divisional charts, every dasha, Shadbala, Ashtakavarga, panchang), clean and self-contained; %s KB' % (i + 1, o['kb']), not o['bad'], o['bad'])
        if i == 0: html0 = pg.evaluate("PDFR.build(currentChartForModal,currentProfileForExport)")
    ok('no section failed to build on any chart', not warns, warns[:3])
    # ---- one click, no dialog ----
    pg.evaluate("document.querySelectorAll('.app-panel').forEach(p=>p.classList.remove('active'));document.getElementById('panel-reading').classList.add('active')")
    pg.evaluate("document.querySelectorAll('#panel-reading .rd .vx-tabs button')[5].click()"); pg.wait_for_timeout(300)
    ok('Deep reading overview has the "Generate the full PDF book" button', pg.evaluate("!!document.querySelector('.dr-sec[data-sec=intro] .dr-pdf')&&/full PDF/i.test(document.querySelector('.dr-pdf').textContent)"))
    n0 = pg.evaluate("document.querySelectorAll('body>iframe').length"); pg.evaluate("document.querySelector('.dr-pdf').click()"); pg.wait_for_timeout(3500)
    ok('one click builds the book and prints it inside a hidden iframe: no dialog, no settings', pg.evaluate("document.querySelectorAll('body>iframe').length") == n0 + 1 and not pg.evaluate("!!document.querySelector('.pdfs')") and pg.evaluate("!!document.getElementById('pdfr-note')"))
    ok('the print window opens exactly once, and for the finished book (never for a blank frame, no second print)', pg.evaluate("window.__prints||[]") == ['book'], pg.evaluate("window.__prints||[]"))
    ok('export dialog has a single "Generate full PDF" button', pg.evaluate("(document.getElementById('exportPdfBtn')||{}).textContent||''").find('Generate full PDF') >= 0)
    ok('phone: no horizontal scroll', not pg.evaluate("document.documentElement.scrollWidth>window.innerWidth+1"))
    # ---- print layout: nothing wider than the page (Chrome would shrink the whole book), then a real PDF ----
    pg3 = b.new_page(viewport={'width': 680, 'height': 1000}); pg3.emulate_media(media='print'); pg3.set_content(html0, wait_until='load')
    ok('print layout: no element is wider than the page content area (the book is not shrunk)', pg3.evaluate("document.documentElement.scrollWidth<=document.documentElement.clientWidth"), pg3.evaluate("[document.documentElement.scrollWidth,document.documentElement.clientWidth]"))
    pg2 = b.new_page(); pg2.set_content(html0, wait_until='load'); pdf = pg2.pdf(prefer_css_page_size=True, print_background=True)
    pages = len(re.findall(rb'/Type\s*/Page[^s]', pdf)); open('/tmp/pdfs_sample.pdf', 'wb').write(pdf)
    ok('a real A4 PDF renders: 100 to 220 pages, under 6 MB', pdf[:4] == b'%PDF' and 100 <= pages <= 220 and len(pdf) < 6_000_000, (pages, len(pdf) // 1024))
    # ---- budgets: speed and size ----
    sp = pg.evaluate("()=>{const t=performance.now(),h=PDFR.build(currentChartForModal,currentProfileForExport);return {ms:Math.round(performance.now()-t),kb:Math.round(h.length/1024)}}")
    ok('speed and size budget: the book builds in under 4 s and the HTML stays under 900 KB', sp['ms'] < 4000 and sp['kb'] < 900, sp)
    # ---- customer edition: brand from the wrapper page ----
    pb = b.new_page(viewport={'width': 430, 'height': 900}); pb.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pb.add_init_script("window.__VAX_BRAND={brand_name:'Acharya <b>Test</b>',tagline:'Vedic guidance',phone:'99999 12345',logo:'data:image/png;base64,iVBORw0KGgo='};")
    pb.goto(PAGE); pb.wait_for_selector('#birthForm'); pb.evaluate(CAST, dict(name='Asha', dob='1995-03-14', tob='11:00', place='Hyderabad', lat=17.385, lon=78.4867, tz=5.5)); pb.wait_for_selector('#results.show', timeout=15000)
    br = pb.evaluate("""()=>{const h=PDFR.build(currentChartForModal,currentProfileForExport),d=new DOMParser().parseFromString(h,'text/html'),bad=[];
      if(!/Prepared by Acharya/.test(d.querySelector('.cover .foot').textContent)||!/Vedic guidance/.test(d.querySelector('.cover .foot').textContent))bad.push('cover brand');
      if(!d.querySelector('.cover img.logo')||!d.querySelector('.end .bk img.logo'))bad.push('logo');if(!/Acharya/.test(d.querySelector('.end .bk').textContent)||!/99999 12345/.test(d.querySelector('.end .bk').textContent))bad.push('closing brand');
      const st=d.querySelector('style').textContent;if(!/@top-left\{content:"Acharya +Test"/.test(st))bad.push('page header brand: '+(st.match(/@top-left\{[^}]{0,60}/)||[''])[0]);
      if(h.includes('<b>Test</b>'))bad.push('brand not escaped');
      window.__VAX_BRAND={brand_name:'X',logo:'javascript:alert(1)'};const h2=PDFR.build(currentChartForModal,currentProfileForExport);if(/javascript:/.test(h2)||/<img class="logo"/.test(h2))bad.push('unsafe logo accepted');
      window.__VAX_BRAND=undefined;const h3=PDFR.build(currentChartForModal,currentProfileForExport);if(!/Prepared with care/.test(h3)||/@top-left\{content:"[A-Za-z]/.test(h3))bad.push('no-brand fallback');
      return bad}""")
    ok('customer edition: brand name, tagline, phone and logo on the cover, page headers and closing page; unsafe logo rejected; plain fallback without a brand', not br, br)
    ok('the book carries the "not advice" and birth-time notes', pg.evaluate("(()=>{const t=PDFR.build(currentChartForModal,currentProfileForExport);return /not medical, legal, financial or psychological advice/.test(t)&&/difference of a few minutes/.test(t)})()"))
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:300]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

# Test of the PDF report (js/93-pdf-report.js, PDFR): self-contained document, all sections, themes, Studio dialog, real PDF render.
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
CHARTS = [('1995-03-14', '11:00', 17.385, 78.4867, 5.5), ('1947-08-15', '00:00', 28.61, 77.21, 5.5), ('1988-12-21', '03:15', 64.15, -21.94, 0), ('2000-01-01', '00:00', -33.87, 151.21, 11)]
BAN = r"/\b(always|never|certainly|definitely|guaranteed|doomed|destined|fatal|cursed|will die|death|you will)\b/i"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 430, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    ok('PDFR loaded with 12 sections and 2 themes', pg.evaluate("typeof PDFR==='object'&&PDFR!==null&&PDFR.sections.length===12&&PDFR.themes.length===2"))
    html0 = ''
    for i, c in enumerate(CHARTS):
        pg.evaluate(CAST, dict(name='Asha <b>Rao</b>', dob=c[0], tob=c[1], place='Test & Place', lat=c[2], lon=c[3], tz=c[4])); pg.wait_for_selector('#results.show', timeout=15000)
        o = pg.evaluate("""()=>{const out={},BAN=%s;for(const th of PDFR.themes)for(const paper of ['A4','Letter']){const h=PDFR.build(currentChartForModal,currentProfileForExport,{theme:th,paper});const d=new DOMParser().parseFromString(h,'text/html'),t=d.body.textContent,bad=[];
          if(/undefined|NaN|\\[object|\\bnull\\b/.test(t))bad.push('placeholder');if(BAN.test(t))bad.push('absolute word');
          if(/(src|href)\\s*=\\s*["']?https?:/i.test(h)||/@import|url\\(\\s*["']?https?:|<script|<link/i.test(h))bad.push('external/script');
          const secs=[...d.querySelectorAll('section.sec')].map(s=>s.id.slice(2));if(secs.length<8)bad.push('sections '+secs.join());
          if(!d.querySelector('.cover')||!d.querySelector('.toc'))bad.push('cover/toc');if(d.querySelectorAll('.toc li').length!==secs.length)bad.push('toc count');
          if(!d.querySelector('svg.chart-svg')||!d.querySelector('svg.bar-svg'))bad.push('svg');if(d.querySelectorAll('.chart-svg polygon').length!==12)bad.push('12 houses');
          if(d.querySelectorAll('#s-houses .card').length!==12)bad.push('house cards');if(!h.includes('size:'+paper))bad.push('paper');
          if(h.includes('<b>Rao</b>')||!h.includes('Asha &lt;b&gt;Rao&lt;/b&gt;'))bad.push('name not escaped');
          const planets=d.querySelectorAll('#s-chart tbody tr').length;if(planets!==9)bad.push('planet rows '+planets);
          const y=YGE.detect(currentChartForModal),gy=d.querySelectorAll('#s-yogas .card').length+d.querySelectorAll('#s-cautions .card').length;if(gy!==y.length)bad.push('yoga cards '+gy+' vs '+y.length);
          out[th+paper]=bad.slice(0,4);}
        const sub=PDFR.build(currentChartForModal,currentProfileForExport,{sections:['overview','houses'],asks:false,why:false}),sd=new DOMParser().parseFromString(sub,'text/html');
        out.subset=[...sd.querySelectorAll('section.sec')].map(s=>s.id).join()==='s-overview,s-houses'&&!sd.querySelector('.ask')&&sd.querySelectorAll('.toc li').length===2;out.size=Math.round(sub.length/1024);return out}""" % BAN)
        bad = {k: v for k, v in o.items() if k not in ('subset', 'size') and v}
        ok('chart %d: all 4 theme/paper variants are clean, self-contained, complete (cover, contents, 12 houses, SVGs, yoga cards match the engine, name escaped)' % (i + 1), not bad, bad)
        ok('chart %d: choosing sections/questions changes the document (subset, no questions, contents match)' % (i + 1), o['subset'], o)
        if i == 0: html0 = pg.evaluate("PDFR.build(currentChartForModal,currentProfileForExport,{theme:'midnight',preparedBy:'Test Studio'})")
    # ---- Studio dialog ----
    pg.evaluate("document.querySelectorAll('.app-panel').forEach(p=>p.classList.remove('active'));document.getElementById('panel-reading').classList.add('active')")
    pg.evaluate("document.querySelectorAll('#panel-reading .rd .vx-tabs button')[5].click()"); pg.wait_for_timeout(300)
    ok('Deep reading overview has the "Create a beautiful PDF" button', pg.evaluate("!!document.querySelector('.dr-sec[data-sec=intro] .dr-pdf')"))
    pg.evaluate("document.querySelector('.dr-pdf').click()"); pg.wait_for_selector('.pdfs.on'); pg.wait_for_timeout(700)
    st = pg.evaluate("""()=>{const f=document.getElementById('pdfs-frame'),d=f.contentDocument;return {n:d&&d.querySelectorAll('section.sec').length,cover:!!(d&&d.querySelector('.cover')),secs:document.querySelectorAll('.pdfs-sec input').length,count:document.getElementById('pdfs-count').textContent}}""")
    ok('Studio opens with a live preview of the full report and 12 section toggles', st['cover'] and st['n'] >= 8 and st['secs'] == 12, st)
    pg.evaluate("document.querySelector('.pdfs-sec input[value=houses]').click()"); pg.wait_for_timeout(700)
    pg.fill('#pdfs-title', 'My Custom Title'); pg.evaluate("document.querySelector('.pdfs-theme.t-midnight input').click()"); pg.wait_for_timeout(700)
    st2 = pg.evaluate("""()=>{const d=document.getElementById('pdfs-frame').contentDocument;return {noHouses:!d.querySelector('#s-houses'),title:/My Custom Title/.test(d.querySelector('.cover h1').textContent),theme:/#10142b/i.test(d.querySelector('style').textContent),count:document.getElementById('pdfs-count').textContent}}""")
    ok('Studio preview updates when a section, the title and the style change', st2['noHouses'] and st2['title'] and st2['theme'] and st2['count'].startswith('11 of 12'), st2)
    pg.screenshot(path='/tmp/pdfs_studio_phone.png')
    n0 = pg.evaluate("document.querySelectorAll('body>iframe').length"); pg.evaluate("document.getElementById('pdfs-print').click()"); pg.wait_for_timeout(500)
    ok('Save as PDF prints the report inside a hidden iframe (the page itself is not printed)', pg.evaluate("document.querySelectorAll('body>iframe').length") == n0 + 1)
    pg.keyboard.press('Escape'); ok('Escape closes the Studio', not pg.evaluate("document.querySelector('.pdfs').classList.contains('on')"))
    ok('phone: no horizontal scroll', not pg.evaluate("document.documentElement.scrollWidth>window.innerWidth+1"))
    # ---- real PDF render ----
    pg2 = b.new_page(); pg2.set_content(html0, wait_until='load'); pdf = pg2.pdf(prefer_css_page_size=True, print_background=True)
    pages = len(re.findall(rb'/Type\s*/Page[^s]', pdf)); open('/tmp/pdfs_sample.pdf', 'wb').write(pdf)
    ok('a real A4 PDF renders from the report (8+ pages, a few hundred KB at most)', pdf[:4] == b'%PDF' and 8 <= pages <= 80 and len(pdf) < 3_000_000, (pages, len(pdf) // 1024))
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:300]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

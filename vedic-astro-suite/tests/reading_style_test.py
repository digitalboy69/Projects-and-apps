# Test of the reading style (css/44-reading-style.css + js/104-reading-style.js): hooks, progress, explored dots, next-up buttons, big headlines, hero,
# short versions, phone widths, reduced motion, and that the app text never uses the internal label for this style. Run: python3 tests/reading_style_test.py
import functools, glob, http.server, os, re, socketserver, threading
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
# the style is never named in the product, the docs or the generated files
word = 'AD' + 'HD'; hits = []
for pat in ('apps/**/*.js', 'apps/**/*.css', 'apps/**/*.html', 'docs/*.md', 'tools/reading_gen/*.py', 'AI_GUIDE.md', 'STRUCTURE.md'):
    for f in glob.glob(os.path.join(ROOT, pat), recursive=True):
        if re.search(word, open(f, encoding='utf-8', errors='ignore').read(), re.I): hits.append(os.path.relpath(f, ROOT))
ok('the style is not named anywhere in the app, docs or generator', not hits, hits)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); errs = []
    for w in (360, 430, 820):
        pg = b.new_page(viewport={'width': w, 'height': 900}); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
        pg.goto(PAGE); pg.wait_for_selector('#birthForm')
        pg.evaluate(CAST, dict(name='Asha', dob='1995-03-14', tob='11:00', place='Hyderabad', lat=17.385, lon=78.4867, tz=5.5)); pg.wait_for_selector('#results.show', timeout=15000)
        pg.evaluate("document.querySelectorAll('.app-panel').forEach(p=>p.classList.remove('active'));document.getElementById('panel-reading').classList.add('active')"); pg.wait_for_timeout(700)
        s = pg.evaluate("""()=>{const bad=[],rd=document.querySelector('#panel-reading .rd'),tabs=[...rd.querySelectorAll(':scope>.vx-tabs button')],panes=[...rd.querySelectorAll(':scope>.vx-pane')];
          if(!rd.querySelector(':scope>.rs-progress'))bad.push('progress');const ex=rd.querySelector(':scope>.rs-explored');if(!ex||!/Explored 1 of \\d+/.test(ex.textContent))bad.push('explored');
          if(rd.querySelectorAll('.rs-next').length!==panes.length-1)bad.push('next buttons '+rd.querySelectorAll('.rs-next').length+'/'+(panes.length-1));
          if(!tabs[0].classList.contains('seen'))bad.push('first seen');
          const hero=rd.querySelector('.hn-hero');if(!hero||!hero.querySelector('.hn-ring')||hero.querySelectorAll('.hn-tag').length!==2)bad.push('hero');
          const h=getComputedStyle(rd.querySelector('.rd-h')).fontSize;if(parseFloat(h)<19)bad.push('headline size '+h);const hh=getComputedStyle(hero.querySelector('h2')).fontSize;if(parseFloat(hh)<26)bad.push('hero size '+hh);
          const cards=rd.querySelectorAll('details.hn-card');if(cards.length!==12)bad.push('cards');cards.forEach((c,i)=>{if(!c.querySelector('.hn-short'))bad.push('short '+i)});
          const ps=[...rd.querySelectorAll('.hn-card .dr-p')];const multi=ps.filter(e=>{const t=e.textContent.trim(),m=/^([^.!?]{18,170}[.!?])\\s/.exec(t);return m&&t.length>m[1].length+20}),hk=multi.filter(e=>e.querySelector('strong.hk')).length;if(multi.length<50||hk<multi.length*0.95)bad.push('hooks '+hk+'/'+multi.length);
          if(rd.querySelectorAll('.hn-card .dr-vg-b h5 .hn-bub').length<100)bad.push('bubbles');
          // next up moves to the next tab and marks it
          rd.querySelector('.rs-next').click();const t1=tabs[1];if(!t1.classList.contains('on')||!t1.classList.contains('seen'))bad.push('next up');if(!/Explored 2 of/.test(rd.querySelector(':scope>.rs-explored').textContent))bad.push('explored 2');
          if(rd.querySelectorAll('.rs-dots span.on').length!==2)bad.push('dots');
          const txt=rd.textContent;if(/(AD)(HD)/i.test(txt))bad.push('name shown');
          return {bad:bad.slice(0,8),over:document.documentElement.scrollWidth>window.innerWidth+1,rm:[...document.styleSheets].some(s=>{try{return [...s.cssRules].some(r=>r.conditionText&&/reduced-motion/.test(r.conditionText)&&/rs-/.test(r.cssText))}catch(e){return false}})}}""")
        ok('width %d: progress, explored dots, next-up, hero, big headlines, hooks, short versions and bubbles all work' % w, not s['bad'], s['bad'])
        ok('width %d: no horizontal scroll' % w, not s['over'])
        ok('reduced-motion rule present', s['rm'])
        # scroll progress moves
        pg.evaluate("document.querySelector('#panel-reading .rd .vx-tabs button').click()"); pg.evaluate("window.scrollTo(0, 1500)"); pg.wait_for_timeout(300)
        wd = pg.evaluate("parseFloat(document.querySelector('.rs-progress i').style.width)"); ok('width %d: progress bar fills while scrolling' % w, wd > 0, wd)
        if w == 430: pg.screenshot(path='/tmp/claude-0/rs.png')
        pg.close()
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:400]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

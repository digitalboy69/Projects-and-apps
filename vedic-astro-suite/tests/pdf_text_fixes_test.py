# Checks four PDF text bugs: doubled 'At its best' wording, blank Bhava Chalit column, repeated key planets, lowercased planet names.
# Run: python3 tests/pdf_text_fixes_test.py
import functools, http.server, os, re, socketserver, threading, sys
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT));srv.daemon_threads=True
threading.Thread(target=srv.serve_forever,daemon=True).start()
PAGE='http://127.0.0.1:%d/apps/birth-chart/index.html'%srv.server_address[1]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/opt/pw-browsers/chromium'));pg=b.new_page(viewport={'width':430,'height':900})
    pg.route('**/*',lambda r:r.continue_() if r.request.url.startswith(('http://127.0.0.1','data:','blob:','about:')) else r.abort())
    pg.goto(PAGE);pg.wait_for_selector('#birthForm')
    pg.evaluate("(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}",dict(name='Asha',dob='1995-03-14',tob='11:00',place='X',lat=17.385,lon=78.4867,tz=5.5))
    pg.wait_for_selector('#results.show',timeout=15000)
    t=pg.evaluate("()=>{const h=PDFR.build(currentChartForModal,currentProfileForExport);const d=new DOMParser().parseFromString(h,'text/html');const tb=[...d.querySelectorAll('table')].filter(x=>/House in Bhava Chalit/.test(x.textContent))[0];return {t:d.body.textContent.replace(/\\s+/g,' '),bc:tb?[...tb.querySelectorAll('tbody tr')].map(r=>[...r.children].map(c=>c.textContent.trim())):[]}}")
    T=t['t'];bad=[]
    if re.search(r'At its best, you At its best|you may Under strain',T): bad.append('double prefix')
    if len(t['bc'])!=9 or any(not re.fullmatch(r'\d+',r[2]) for r in t['bc']): bad.append('bhava chalit column empty')
    if re.search(r'are these: (sun|moon|mars|mercury|jupiter|venus|saturn|rahu|ketu|[a-z]+ Kesari)\b',T) or re.search(r'\. (sun|moon|venus|saturn|jupiter|mars|mercury)[ ,]',T): bad.append('lowercased name')
    for m in re.finditer(r'key planets there read: ([^.]*)\.',T):
        n=re.findall(r'(\w+) in \w+ \(',m.group(1))
        if len(n)!=len(set(n)): bad.append('duplicate key planet: '+m.group(1))
    print('FAIL '+'; '.join(bad) if bad else 'PASS pdf text fixes'); sys.exit(1 if bad else 0)

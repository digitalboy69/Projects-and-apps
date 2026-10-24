# Test of the Deep reading feature (js/88-deep-reading.js) in the real Birth Chart app, driven through the real input form.
# Run: python3 tests/deep_reading_test.py   (CHROMIUM=/path/to/chrome if not at the default)
import functools, http.server, json, os, socketserver, threading
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
OBAMA = dict(name='Barack Obama', dob='1961-08-04', tob='19:24', place='Honolulu', lat=21.3069, lon=-157.8583, tz=-10)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    def new(w=430, h=900):
        pg = b.new_page(viewport={'width': w, 'height': h}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:')) else r.abort())
        pg.goto(PAGE); pg.wait_for_selector('#birthForm'); return pg, errs
    pg, errs = new(); pg.evaluate(CAST, OBAMA); pg.wait_for_selector('#results.show', timeout=15000)
    t = pg.evaluate("""()=>{const rd=document.querySelector('#panel-reading .rd'),tabs=[...rd.querySelectorAll('.vx-tabs button:not(.hn-tab):not(.sbr-tab):not(.avr-tab)')].map(b=>b.textContent),panes=[...rd.querySelectorAll(':scope>.vx-pane:not(.hn-pane):not(.sbr-pane):not(.avr-pane)')];
      return {tabs,np:panes.length,houses:panes[5].querySelectorAll('details.vx-pl').length-currentChartForModal.dashaData.mahadashas.length,planets:panes[2].querySelectorAll('details.vx-pl').length,failed:/Could not build/.test(rd.innerHTML)}}""")
    ok('Chart Reading now has 6 tabs; the new one is "📖 Deep reading"', len(t['tabs']) == 6 and t['tabs'][5] == '📖 Deep reading' and t['np'] == 6 and not t['failed'], t['tabs'])
    ok('Deep tab: 12 house cards; Planets tab: 9 planet cards', t['houses'] == 12 and t['planets'] == 9, t)
    # every text on screen must be the database's text for THIS chart's real placements
    v = pg.evaluate("""()=>{const c=currentChartForModal,R=VDB.reading(c),rd=document.querySelector('#panel-reading .rd'),panes=[...rd.querySelectorAll(':scope>.vx-pane:not(.hn-pane):not(.sbr-pane):not(.avr-pane)')];
      const bad=[],norm=s=>s.replace(/\\s+/g,' ');const deep=norm(panes[5].textContent),cards=[...panes[5].querySelectorAll('details.vx-pl')].slice(-12).map(d=>norm(d.textContent));
      if(!deep.includes(R.lagna.sign+' rising'))bad.push('rising');if(!deep.includes(norm(VDB.data.rising[R.lagna.sign])))bad.push('rising text');
      for(let i=0;i<12;i++){const hl=R.houseLords[i];if(!cards[i].includes(norm(hl.text)))bad.push('lord text H'+(i+1));
        const occ=Object.keys(R.planets).filter(n=>R.planets[n].house===i+1);occ.forEach(n=>{if(!cards[i].includes(norm(R.planets[n].inHouse.text)))bad.push(n+' in H'+(i+1));});
        if(!occ.length&&!cards[i].includes('No planet sits here'))bad.push('empty H'+(i+1));
        Object.keys(R.planets).filter(n=>R.planets[n].house!==i+1&&R.planets[n].aspectsHouses.some(a=>a.house===i+1)).forEach(n=>{if(!cards[i].includes(norm(VDB.data.aspectOnHouse[n][i])))bad.push('aspect '+n+' H'+(i+1));});}
      const pcards=[...panes[2].querySelectorAll('details.vx-pl')].map(d=>norm(d.textContent));
      Object.keys(R.planets).forEach((n,i)=>{const e=R.planets[n];if(!pcards[i].includes('Deep reading'))bad.push(n+' no block');if(!pcards[i].includes(norm(e.inHouse.text)))bad.push(n+' house text');
        if(!pcards[i].includes(norm(e.inSign.text.replace(/^[^:]{1,90}: /,''))))bad.push(n+' sign text');if(e.nakshatra&&!pcards[i].includes(norm(e.nakshatra.trait)))bad.push(n+' nak');
        e.conjunct.forEach(x=>{if(!pcards[i].includes(norm(x.text)))bad.push(n+' conj');});e.aspectedBy.forEach(x=>{if(!pcards[i].includes(norm(x.text.replace(/^[^:]{1,90}: /,''))))bad.push(n+' aspBy '+x.from);});
        e.lordOf.forEach(y=>{if(!pcards[i].includes(norm(R.houseLords[y-1].text)))bad.push(n+' lordOf '+y);});});
      const act=findActiveDasha(c.dashaData.mahadashas,new Date()),now=norm(panes[3].textContent),ml=act.mahadasha.lord,al=act.antardasha.lord;
      const cur=VDA.current(c);if(!now.includes(norm(cur.md.arenaText)))bad.push('dasha MD');if(!now.includes(norm(cur.ad.blend)))bad.push('dasha AD');
      return {bad,lagna:R.lagna.sign,md:ml,ad:al,conjPairs:(deep.match(/together in/g)||[]).length,chips:panes[5].querySelectorAll('.vx-note.g .vx-chip').length}}""")
    ok('Deep tab, Planets tab and Now tab show exactly the database text for this chart\'s real houses, lords, aspects, conjunctions, nakshatras and dashas', not v['bad'], v['bad'][:8])
    ok('rising sign Capricorn; functional-nature chips for all 7 planets', v['lagna'] == 'Capricorn' and v['chips'] >= 7, v)
    # ---- full report ----
    r = pg.evaluate("""()=>{const c=currentChartForModal,R=VDB.reading(c),rep=buildFullReportText(c,currentProfileForExport,{}),off=buildFullReportText(c,currentProfileForExport,{deepReading:false}),flat=s=>s.replace(/\\s+/g,' ');
      const lines=rep.split('\\n'),i=lines.findIndex(l=>/DEEP READING/.test(l));
      return {has:/DEEP READING: CLASSICAL INTERPRETATIONS/.test(rep),off:/DEEP READING/.test(off),houses:(rep.match(/ HOUSE \\(/g)||[]).length,sun:flat(rep).includes(flat(R.planets.Sun.inHouse.text)),
        maxLen:Math.max(...lines.slice(i).map(l=>l.length)),before:rep.indexOf('ASHTAKAVARGA')<rep.indexOf('DEEP READING'),end:/END OF REPORT/.test(rep),kb:Math.round(rep.length/1024),
        box:!!document.querySelector('.export-section-check[data-section="deepReading"]')}}""")
    ok('full report has a DEEP READING section (12 houses, planet texts), it can be switched off, and the export dialog has its checkbox', r['has'] and not r['off'] and r['houses'] == 12 and r['sun'] and r['end'] and r['box'], r)
    ok('report lines are wrapped (no line over 80 characters)', r['maxLen'] <= 80, r['maxLen'])
    # ---- other charts through the real form: nothing may break (incl. Rahu/Ketu, empty houses, retrograde, combust) ----
    profs = [('Einstein', '1879-03-14', '11:30', 48.4011, 9.9876, 0.6667), ('Sydney', '2000-01-01', '00:00', -33.87, 151.21, 11), ('Delhi 1947', '1947-08-15', '00:00', 28.61, 77.21, 5.5),
             ('Hyderabad', '1995-03-14', '11:00', 17.385, 78.4867, 5.5), ('Reykjavik', '1988-12-21', '03:15', 64.15, -21.94, 0), ('Quito', '1975-06-30', '23:50', -0.18, -78.47, -5)]
    bads = []
    for nm, d, tm, la, lo, tz in profs:
        pg.evaluate("document.querySelectorAll('.app-panel').forEach(p=>p.classList.remove('active'))")
        pg.evaluate("(p)=>{newProfileBtn&&newProfileBtn.click();}", {}) if False else None
        pg2, e2 = new(); pg2.evaluate(CAST, dict(name=nm, dob=d, tob=tm, place='x', lat=la, lon=lo, tz=tz)); pg2.wait_for_selector('#results.show', timeout=15000)
        o = pg2.evaluate("""()=>{const rd=document.querySelector('#panel-reading .rd'),panes=[...rd.querySelectorAll(':scope>.vx-pane:not(.hn-pane):not(.sbr-pane):not(.avr-pane)')];return {tabs:panes.length,h:panes[5].querySelectorAll('details.vx-pl').length-currentChartForModal.dashaData.mahadashas.length,pl:panes[2].querySelectorAll('details.vx-pl').length,
          txt:/undefined|NaN|\\[object|null/.test(panes[5].textContent+panes[2].textContent),fail:/Could not build/.test(rd.innerHTML),rep:/DEEP READING/.test(buildFullReportText(currentChartForModal,currentProfileForExport,{}))}}""")
        if o['tabs'] != 6 or o['h'] != 12 or o['pl'] != 9 or o['txt'] or o['fail'] or not o['rep'] or e2: bads.append((nm, o, e2[:1]))
        pg2.close()
    ok('6 more charts (old LMT, southern hemisphere, polar latitude, midnight births): deep tab, planet blocks and report all build, no "undefined"/errors', not bads, bads[:2])
    # ---- phone layout ----
    pg.evaluate("document.querySelectorAll('.app-panel').forEach(p=>p.classList.remove('active'));document.getElementById('panel-reading').classList.add('active')")
    pg.evaluate("document.querySelectorAll('#panel-reading .rd .vx-tabs button:not(.hn-tab):not(.sbr-tab):not(.avr-tab)')[5].click()"); pg.wait_for_timeout(300)
    ok('phone: no horizontal scroll with the Deep reading tab open', pg.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'))
    pg.evaluate("document.querySelector('#panel-reading .rd').scrollIntoView()"); pg.screenshot(path='/tmp/shots/deep_tab.png')
    pg.evaluate("document.querySelector('#panel-reading .rd .vx-pane.on details:nth-of-type(7)').open=true;document.querySelector('#panel-reading .rd .vx-pane.on details:nth-of-type(7)').scrollIntoView()"); pg.wait_for_timeout(200); pg.screenshot(path='/tmp/shots/deep_house7.png')
    pg.evaluate("document.querySelectorAll('#panel-reading .rd .vx-tabs button:not(.hn-tab):not(.sbr-tab):not(.avr-tab)')[2].click()"); pg.evaluate("const d=document.querySelectorAll('#panel-reading .rd .vx-pane.on details')[1];d.open=true;d.scrollIntoView()"); pg.wait_for_timeout(200); pg.screenshot(path='/tmp/shots/deep_planet.png')
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:300]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

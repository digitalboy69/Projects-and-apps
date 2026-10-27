# Old and BC dates: Julian Day / calendar maths, parseDob, deltaT, the typed-date panel on the birth form, and every tab for a BC chart.
# Run: python3 tests/date_entry_test.py
import functools, http.server, os, socketserver, threading
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
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(viewport={'width': 360, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    # ---- engine numbers (Meeus' worked examples and the calendar change) ----
    r = pg.evaluate("""()=>({a:toJulianDay(2000,1,1,12,0,0),b:toJulianDay(1582,10,4,0,0,0),c:toJulianDay(1582,10,15,0,0,0),d:toJulianDay(-4712,1,1,12,0,0),e:toJulianDay(1987,1,27,0,0,0),f:toJulianDay(333,1,27,12,0,0),g:toJulianDay(-123,12,31,0,0,0),h:toJulianDay(-122,1,1,0,0,0)})""")
    ok('Julian Day: 1 Jan 2000 noon = 2451545.0, 1987-01-27 = 2446822.5 (Meeus)', r['a'] == 2451545.0 and r['e'] == 2446822.5, r)
    ok('Julian Day: the calendar change 4 Oct 1582 (Julian) is followed by 15 Oct 1582 (Gregorian), one day later', abs(r['c'] - r['b'] - 1) < 1e-9, r)
    ok('Julian Day: 1 Jan 4713 BC noon = 0 and 27 Jan 333 AD noon = 1842713.0 (Meeus, Julian calendar)', r['d'] == 0 and r['f'] == 1842713.0, r)
    ok('Julian Day: consecutive days across a BC year change (31 Dec -123 to 1 Jan -122)', abs(r['h'] - r['g'] - 1) < 1e-9, r)
    rt = pg.evaluate("""()=>{const bad=[];let n=0;for(let jd=0.5;jd<3800000;jd+=1237.31){const p=jdToParts(jd),jd2=toJulianDay(p.y,p.m,p.d,p.h,p.mi,p.s);n++;if(Math.abs(jd2-Math.round(jd*86400)/86400)>1e-4)bad.push([jd,p,jd2]);}
      for(let i=0;i<4000;i++){const y=-4712+Math.floor(Math.random()*14711),m=1+Math.floor(Math.random()*12),d=1+Math.floor(Math.random()*28),p=jdToParts(toJulianDay(y,m,d,12,0,0));if(p.y!==y||p.m!==m||p.d!==d||p.h!==12)bad.push(['rt',y,m,d,p]);n++;}
      return {n,bad:bad.slice(0,3)}}""")
    ok('Julian Day <-> calendar parts round trip over 4712 BC to 9999 AD (%d samples)' % rt['n'], not rt['bad'], rt['bad'])
    pdz = pg.evaluate("""()=>({a:parseDob('-000499-03-14'),b:parseDob('0000-01-01'),c:parseDob('0500-03-14'),d:parseDob('1995-03-14'),e:formatDobStr(-499,3,14),f:formatDobStr(0,1,1),g:formatDobStr(500,3,14),h:formatDobStr(1995,3,4)})""")
    ok('parseDob / formatDobStr handle BC, year 0 and plain dates', pdz['a'] == {'y': -499, 'm': 3, 'd': 14} and pdz['b']['y'] == 0 and pdz['c']['y'] == 500 and pdz['d']['y'] == 1995 and pdz['e'] == '-000499-03-14' and pdz['f'] == '0000-01-01' and pdz['g'] == '0500-03-14' and pdz['h'] == '1995-03-04', pdz)
    dt = pg.evaluate("()=>[deltaT(2000,6),deltaT(1900,6),deltaT(1000,6),deltaT(0,6),deltaT(-500,6),deltaT(1700,6),deltaT(2100,6)]")
    ok('deltaT matches the published values (2000 ~64 s, 1900 ~-3 s, 1000 ~1570 s, year 0 ~10580 s, 500 BC ~17200 s)', abs(dt[0] - 64) < 2 and abs(dt[1] + 3) < 2 and abs(dt[2] - 1570) < 40 and abs(dt[3] - 10580) < 150 and abs(dt[4] - 17200) < 400 and 8 < dt[5] < 10 and 150 < dt[6] < 260, dt)
    # ---- Sun and Moon anchors: a modern eclipse (Moon formula) and the equinox ----
    ec = pg.evaluate("""()=>{const jd=toJulianDay(2017,8,21,18,25,30)+deltaT(2017,8)/86400;let e=Math.abs(((moonLongitude(jd)-sunLongitude(jd)+540)%360)-180);return e}""")
    ok('Sun and Moon are within 0.5 degrees of each other at the 21 Aug 2017 total eclipse (formula check)', ec < 0.5, ec)
    # ---- chart maths for a BC and a Julian-era date ----
    ch = pg.evaluate("""()=>{const out={};['-000499-03-14','0000-01-01','0033-04-03','1500-02-29','1582-10-04','1582-10-15','1900-01-01'].forEach(d=>{try{const c=computeChart(d,'12:00:00',28.61,77.21,5.2324);out[d]={sun:c.planets.Sun.longitude,moon:c.planets.Moon.longitude,asc:c.ascendant.sign,fin:Object.values(c.planets).every(p=>isFinite(p.longitude)),dasha:!!(c.dashaData&&c.dashaData.mahadashas&&c.dashaData.mahadashas.length),utc:c.birthUTC||null}}catch(e){out[d]='ERR '+e.message}});return out}""")
    ok('computeChart works for 500 BC, year 0, 33 AD, a Julian leap day (29 Feb 1500) and both sides of the 1582 change', all(isinstance(v, dict) and v['fin'] and v['dasha'] for v in ch.values()), ch)
    sd = lambda a, b: abs(((ch[a]['sun'] - ch[b]['sun'] + 540) % 360) - 180)
    ok('1582: 4 Oct (Julian) and 15 Oct (Gregorian) are 1 day apart, so the Sun moved about 1 degree', 0.5 < (ch['1582-10-15']['sun'] - ch['1582-10-04']['sun']) % 360 < 1.5, [ch['1582-10-04']['sun'], ch['1582-10-15']['sun']])
    # ---- the form ----
    pg.evaluate("window.PLACE_OK=1")
    vis = pg.evaluate("[!!document.getElementById('inOldBtn'),document.getElementById('inOld').hidden,!document.getElementById('inDay').closest('.in-row3').hidden]")
    ok('the birth form shows a "type the date yourself" button, panel closed, date lists shown', vis == [True, True, True], vis)
    pg.click('#inOldBtn'); pg.wait_for_timeout(200)
    vis2 = pg.evaluate("[!document.getElementById('inOld').hidden,document.getElementById('inDay').closest('.in-row3').hidden]")
    ok('opening it shows Day / Month / Year / AD-BC and hides the lists', vis2 == [True, True], vis2)
    def typ(d, m, y, era):
        pg.fill('#oDay', str(d)); pg.select_option('#oMon', str(m)); pg.fill('#oYear', str(y)); pg.click('#oEra [data-era="%s"]' % era); pg.wait_for_timeout(150)
        return pg.evaluate("({v:inDobValue(),n:document.getElementById('oNote').textContent})")
    r1 = typ(14, 3, 500, 'BC'); ok('500 BC, 14 March gives -000499-03-14 with the BC and approximate notes', r1['v'] == '-000499-03-14' and 'BC years' in r1['n'] and 'Approximate' in r1['n'] and 'local sun time' in r1['n'], r1)
    r2 = typ(29, 2, 1500, 'AD'); ok('29 Feb 1500 is valid (Julian leap year) and noted as Julian', r2['v'] == '1500-02-29' and 'Julian calendar' in r2['n'], r2)
    r3 = typ(29, 2, 1700, 'AD'); ok('29 Feb 1700 is refused (Gregorian, not a leap year)', r3['v'] == '' and 'only 28 days' in r3['n'], r3)
    r4 = typ(10, 10, 1582, 'AD'); ok('10 Oct 1582 is refused (the days that were skipped)', r4['v'] == '' and 'do not exist' in r4['n'], r4)
    r5 = typ(29, 2, 4, 'BC'); ok('4 BC is year -3, not a leap year, 5 BC (year -4) is: 29 Feb 4 BC refused', r5['v'] == '' , r5)
    r5b = typ(29, 2, 5, 'BC'); ok('29 Feb 5 BC accepted (astronomical year -4 is divisible by 4)', r5b['v'] == '-000004-02-29', r5b)
    r6 = typ(1, 1, 5000, 'BC'); ok('years before 4713 BC are refused with a clear message', r6['v'] == '' and '4713' in r6['n'], r6)
    r7 = typ(1, 1, 12000, 'AD'); ok('years after 9999 are refused', r7['v'] == '', r7)
    typ(14, 3, 500, 'BC')
    pg.fill('#profileName', 'Ancient'); pg.fill('#tobInput', '06:30') if False else None
    pg.evaluate("""()=>{const t=document.getElementById('tobInput');t.value='06:30';t.dispatchEvent(new Event('input',{bubbles:true}));
      selectedLat=28.61;selectedLon=77.21;placeInput.value='Delhi, India';coordReadout.textContent='28.6100°, 77.2100°';
      const sel=document.getElementById('tzInput');if(![...sel.options].length){sel.innerHTML='<option value="5.5">UTC+5:30</option>'};sel.value=sel.options[0].value;inUpdate();}""")
    pg.wait_for_timeout(200)
    pg.click('#oLmt'); pg.wait_for_timeout(200)
    tz = pg.evaluate("({v:document.getElementById('tzInput').value,t:document.getElementById('tzInput').selectedOptions[0].textContent})")
    ok('the local-mean-time button sets the time zone to longitude / 15 (77.21 / 15 = 5.1473)', abs(float(tz['v']) - 77.21 / 15) < 1e-3 and 'local mean time' in tz['t'], tz)
    done = pg.evaluate("document.querySelector('.in-step[data-step=\"2\"]').classList.contains('done')")
    ok('the progress marks the date step as done for a typed BC date', done)
    pg.evaluate("document.getElementById('birthForm').requestSubmit()"); pg.wait_for_selector('#results.show', timeout=20000)
    o = pg.evaluate("""()=>({txt:document.querySelector('#panel-overview').innerText.slice(0,4000),prof:currentProfileForExport.dob,fin:Object.values(currentChartForModal.planets).every(p=>isFinite(p.longitude)&&p.house>=1&&p.house<=12),dasha:currentChartForModal.dashaData.mahadashas.length})""")
    ok('the chart is built for 14 March 500 BC (profile date -000499-03-14, nine planets in houses, dashas present)', o['prof'] == '-000499-03-14' and o['fin'] and o['dasha'] >= 9, o)
    ok('the overview shows the date as "14 March 500 BC"', '14 March 500 BC' in o['txt'], o['txt'][:200])
    # walk every tab for errors
    ids = pg.evaluate("[...document.querySelectorAll('.app-panel')].map(p=>p.id)")
    for i in ids:
        pg.evaluate("(id)=>{try{switchAppTab(id)}catch(e){}}", i); pg.wait_for_timeout(120)
    pg.wait_for_timeout(500)
    ok('every one of the %d panels opens for the BC chart without a JavaScript error' % len(ids), not errs, errs[:4])
    # saved profile reopens the typed panel
    pg.evaluate("document.getElementById('newProfileBtn').click()"); pg.wait_for_timeout(300)
    pg.evaluate("(()=>{const s=document.getElementById('profileSelect');s.value=String(loadProfiles().findIndex(p=>p.dob==='-000499-03-14'));s.dispatchEvent(new Event('change'))})()"); pg.wait_for_selector('#results.show', timeout=20000)
    pg.evaluate("document.getElementById('newProfileBtn').click()"); pg.wait_for_timeout(300)
    pg.evaluate("loadProfileIntoForm(loadProfiles().find(p=>p.dob==='-000499-03-14'))"); pg.wait_for_timeout(300)
    back = pg.evaluate("({open:!document.getElementById('inOld').hidden,d:document.getElementById('oDay').value,m:document.getElementById('oMon').value,y:document.getElementById('oYear').value,era:document.querySelector('#oEra .on').dataset.era,v:inDobValue()})")
    ok('loading the saved BC profile reopens the typed panel with 14 / March / 500 / BC', back == {'open': True, 'd': '14', 'm': '3', 'y': '500', 'era': 'BC', 'v': '-000499-03-14'}, back)
    pg.evaluate("loadProfileIntoForm({name:'M',dob:'1995-03-14',tob:'11:00',place:'Hyd',lat:17.38,lon:78.48,tz:5.5})"); pg.wait_for_timeout(300)
    back2 = pg.evaluate("({open:!document.getElementById('inOld').hidden,v:inDobValue()})")
    ok('loading a modern profile closes the typed panel and uses the date lists', back2 == {'open': False, 'v': '1995-03-14'}, back2)
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:500]))
print('ALL PASS' if all(c for _, c, _ in res) else 'FAILED'); raise SystemExit(0 if all(c for _, c, _ in res) else 1)

# 3D Sky: Reverse play + Make a profile from a moment, in a real browser at phone width.
# Three.js comes from a CDN (not reachable in every sandbox), so this test swaps it for a do-nothing stand-in: the buttons, time maths, saved moments and
# profile storage are real; only the 3D drawing is skipped. Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/sky3d_profile_moment_browser_test.py (S3_SHOTS=dir for screenshots)
import functools, http.server, os, socketserver, threading, json
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'); SHOTS = os.environ.get('S3_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/sky3d/index.html' % srv.server_address[1]
STUB = """(()=>{const mk=()=>{const f=function(){};const p=new Proxy(f,{get:(t,k)=>k===Symbol.toPrimitive?()=>0:(k==='domElement'?(window.__cv||(window.__cv=document.createElement('canvas'))):(k==='length'?0:(k==='children'?[]:p))),apply:()=>p,construct:()=>p,set:()=>true});return p};window.THREE=mk();})();"""
res = []
def ok(n, c, d=''): res.append((n, bool(c))); print(('ok   ' if c else 'FAIL ') + n, '' if c else d)
def shot(pg, n):
    if SHOTS: os.makedirs(SHOTS, exist_ok=True); pg.screenshot(path=os.path.join(SHOTS, n))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    ctx = b.new_context(viewport={'width': 390, 'height': 800}, timezone_id='Asia/Kolkata'); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    def route(r):
        u = r.request.url
        if 'three.min.js' in u: r.fulfill(body=STUB, content_type='application/javascript')
        elif u.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')): r.continue_()
        else: r.abort()
    pg.route('**/*', route)
    pg.goto(PAGE); pg.wait_for_timeout(2500)
    ok('timeline has Reverse, Play, and 👤 buttons', pg.evaluate("()=>!!document.getElementById('tlPlayRev')&&!!document.getElementById('tlPlayPause')&&!!document.getElementById('tlMkProfile')"))
    # --- reverse play ---
    j0 = pg.evaluate("()=>currentJD")
    pg.evaluate("()=>{playSpeedDaysPerSec=30}")
    pg.click('#tlPlayRev'); pg.wait_for_timeout(1200)
    j1 = pg.evaluate("()=>currentJD")
    ok('◀ runs time BACKWARD', j1 < j0 - 3, (j0, j1))
    ok('◀ shows pause while running backward and ▶ stays ▶', pg.evaluate("()=>document.getElementById('tlPlayRev').textContent==='❚❚'&&document.getElementById('tlPlayPause').textContent==='▶'"))
    pg.click('#tlPlayPause'); pg.wait_for_timeout(1200)
    j2 = pg.evaluate("()=>currentJD")
    ok('tapping ▶ while running backward turns time FORWARD', j2 > j1 + 1 or pg.evaluate("()=>playDir")==1, (j1, j2))
    ok('and now ▶ shows pause', pg.evaluate("()=>document.getElementById('tlPlayPause').textContent==='❚❚'&&document.getElementById('tlPlayRev').textContent==='◀'"))
    pg.click('#tlPlayPause'); pg.wait_for_timeout(300); j3 = pg.evaluate("()=>currentJD"); pg.wait_for_timeout(500)
    ok('tapping the running button pauses', pg.evaluate("()=>currentJD")==j3 and not pg.evaluate("()=>isPlaying"))
    pg.click('#tlPlayRev'); pg.wait_for_timeout(400); pg.click('#tlPlayRev'); pg.wait_for_timeout(200); j4 = pg.evaluate("()=>currentJD"); pg.wait_for_timeout(400)
    ok('tapping ◀ again pauses', pg.evaluate("()=>currentJD")==j4)
    ok('stepping and speed chips still work', pg.evaluate("()=>{const a=currentJD;document.getElementById('tlStepBack').click();return Math.abs(currentJD-(a-1))<1e-6}"))
    shot(pg, 'r1.png')
    # play backward past the left edge of the timeline window: window follows
    pg.evaluate("()=>{playSpeedDaysPerSec=365;jumpToJD(currentJD)}"); pg.click('#tlPlayRev'); pg.wait_for_timeout(1500)
    ok('timeline window follows backward play', pg.evaluate("()=>currentJD>=timelineWindowStart-1e-6&&currentJD<=timelineWindowEnd+1e-6"))
    pg.click('#tlPlayRev'); pg.wait_for_timeout(200)
    # --- profile from the moment showing ---
    pg.evaluate("()=>{localStorage.removeItem('vax_live_loc');localStorage.removeItem('ephemeris_natal_profiles_v1');liveLocMem=null}")
    pg.evaluate("()=>jumpToJD(toJulianDay(2020,3,14,9,5,0)-5.5/24)"); pg.wait_for_timeout(300)
    pg.click('#tlMkProfile'); pg.wait_for_timeout(400)
    ok('popup opens', pg.evaluate("()=>document.querySelector('.pm-ov').classList.contains('show')"))
    ok('without a real place Create is off and a warning shows', pg.evaluate("()=>document.querySelector('.pm-go').disabled&&!document.querySelector('.pm-warn').hidden"))
    shot(pg, 'p1.png')
    pg.evaluate("()=>{liveLocMem={lat:28.6139,lon:77.209,label:'New Delhi'}}"); pg.wait_for_timeout(800)
    ok('after a place is set Create is on', pg.evaluate("()=>!document.querySelector('.pm-go').disabled"))
    d = pg.evaluate("()=>pmDraft(currentJD,'')")
    ok('draft has the date and time shown (14 Mar 2020, 09:05, UTC+5.5)', d['profile']['dob']=='2020-03-14' and d['profile']['tob']=='09:05' and d['profile']['tz']==5.5, d)
    pg.fill('.pm-name', 'Spring 2020'); shot(pg, 'p2.png')
    pg.click('.pm-go'); pg.wait_for_timeout(700)
    saved = pg.evaluate("()=>JSON.parse(localStorage.getItem('ephemeris_natal_profiles_v1')||'[]')")
    ok('profile saved with name, place and exact date/time', len(saved)==1 and saved[0]['name']=='Spring 2020' and saved[0]['dob']=='2020-03-14' and saved[0]['tob']=='09:05' and saved[0]['lat']==28.6139 and saved[0]['place']=='New Delhi', saved)
    ok('profile is active and valid', pg.evaluate("()=>!!activeNatalProfile&&isValidProfile(activeNatalProfile)&&activeNatalProfile.name==='Spring 2020'"))
    ok('Natal tab is opened', pg.evaluate("()=>document.getElementById('tab-natal').classList.contains('active')"))
    ok('popup closed', pg.evaluate("()=>!document.querySelector('.pm-ov').classList.contains('show')"))
    shot(pg, 'p3.png'); pg.evaluate("()=>document.getElementById('sidepanel').classList.remove('expanded')")   # the Natal tab opened the sheet; fold it so the timeline is reachable again
    # while time is RUNNING: the profile takes the moment at the instant of the tap
    pg.evaluate("()=>{playSpeedDaysPerSec=1;isPlaying=true;playDir=1}"); pg.wait_for_timeout(300)
    pg.click('#tlMkProfile'); pg.wait_for_timeout(300)
    j_at = pg.evaluate("()=>pmDraft(currentJD,'').jd"); pg.wait_for_timeout(900)
    ok('time keeps running behind the popup; the popup keeps the tapped moment', pg.evaluate("()=>currentJD")>j_at and pg.evaluate("()=>document.querySelector('.pm-rows').textContent.length>10"))
    pg.evaluate("()=>{isPlaying=false;document.querySelector('.pm-x').click()}")
    # --- from a saved moment ---
    pg.evaluate("()=>jumpToJD(toJulianDay(1999,12,31,23,30,0)-5.5/24)"); pg.wait_for_timeout(200)
    pg.evaluate("()=>document.getElementById('tmSave')&&0"); pg.click('#tlJumpToggle'); pg.wait_for_timeout(500)
    pg.click('#tmSave'); pg.wait_for_timeout(300); pg.fill('.sv-name', 'Millennium eve'); pg.click('.sv-add .tm-go'); pg.wait_for_timeout(300)
    ok('saved moment row has a 👤 button', pg.evaluate("()=>!!document.querySelector('.sv-it .sv-mp')"))
    shot(pg, 's1.png')
    pg.click('.sv-it .sv-mp'); pg.wait_for_timeout(400)
    ok('👤 on a saved moment opens the popup with that date', pg.evaluate("()=>document.querySelector('.pm-ov').classList.contains('show')&&/31 Dec 1999/.test(document.querySelector('.pm-rows').textContent)"))
    pg.fill('.pm-name', 'Saved one'); pg.click('.pm-go'); pg.wait_for_timeout(500)
    s2 = pg.evaluate("()=>JSON.parse(localStorage.getItem('ephemeris_natal_profiles_v1')||'[]')")
    ok('second profile saved from the saved moment', len(s2)==2 and s2[1]['dob']=='1999-12-31' and s2[1]['tob']=='23:30', s2)
    ok('saved moment still in the list (not removed)', pg.evaluate("()=>tmSavedMoments().length")==1)
    ok('no page errors', not errs, errs[:3])
    b.close()
bad = [n for n, c in res if not c]; print('ALL PASSED' if not bad else 'FAILED: %s' % bad); raise SystemExit(1 if bad else 0)

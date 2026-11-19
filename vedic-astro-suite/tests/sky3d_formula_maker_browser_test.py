# Formula Maker (apps/sky3d js/67 engine, js/68 library + codec, js/69 sheet): karakas, Bhrigu Bindu, Yogi points, relations, tri-state, scan, share round-trip and the sheet at 390 and 360.
# Run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers python3 tests/sky3d_formula_maker_browser_test.py  (FM_SHOTS=dir saves screenshots)
import functools, http.server, os, socketserver, threading, json, re
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); SHOTS = os.environ.get('FM_SHOTS')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/sky3d/index.html' % srv.server_address[1]
STUB = """(()=>{const mk=()=>{const f=function(){};const p=new Proxy(f,{get:(t,k)=>k===Symbol.toPrimitive?()=>0:(k==='domElement'?(window.__cv||(window.__cv=document.createElement('canvas'))):(k==='length'?0:(k==='children'?[]:p))),apply:()=>p,construct:()=>p,set:()=>true});return p};window.THREE=mk();})();"""
PROFILE = "{name:'Demo A',dob:'2000-01-01',tob:'06:30:00',place:'Demo City',lat:28.6139,lon:77.209,tz:5.5}"
bad = 0
def ok(n, c, d=''):
    global bad; bad += (not c); print(('ok   ' if c else 'FAIL ') + n, '' if c else d)
def route(r):
    u = r.request.url
    if 'three.min.js' in u: r.fulfill(body=STUB, content_type='application/javascript')
    elif u.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')): r.continue_()
    else: r.abort()
def tables_ok(md):
    lines = md.split('\n'); i = 0; n = 0
    while i < len(lines):
        if lines[i].startswith('| ') and i + 1 < len(lines) and lines[i + 1].startswith('| ---'):
            cnt = lambda s: len(re.findall(r'(?<!\\)\|', s)); w = cnt(lines[i]); n += 1
            while i < len(lines) and lines[i].startswith('|'):
                if cnt(lines[i]) != w: return False, lines[i][:80]
                i += 1
        else: i += 1
    return n > 0, n

def ev(pg, js, arg=None): return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'))
    ctx = b.new_context(viewport={'width': 390, 'height': 800}, timezone_id='Asia/Kolkata'); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('**/*', route); pg.goto(PAGE); pg.wait_for_timeout(2500)
    pg.evaluate("()=>{activeNatalProfile=%s}" % PROFILE)
    # ---- karakas & points on a fixed chart
    r = ev(pg, """()=>{const C=FM.chart({jd:2451545.0,lagna:100,scheme:7});const k=FM.karakas(C);
      const rows=k.rows.map(x=>x.n+':'+x.d.toFixed(2));const degs=k.rows.map(x=>x.d);
      const C8=FM.chart({jd:2451545.0,lagna:100,scheme:8});const k8=FM.karakas(C8);
      const bb=FM.bhrigu(C), yp=FM.yogiPt(C), ap=FM.avaPt(C);
      const m=C.sid.Moon, r=C.sid.Rahu;
      return {sorted:degs.every((d,i)=>i==0||degs[i-1]>=d), n7:Object.keys(k.map).length, n8:Object.keys(k8.map).join(','), rahuIn8:Object.values(k8.map).includes('Rahu')||k8.rows.some(x=>x.n==='Rahu'),
        bbMid:Math.min(Math.abs(((bb-m+540)%360)-180),999), bbToRahu:Math.abs(((bb-r+540)%360)-180), bbToMoon:Math.abs(((bb-m+540)%360)-180),
        yp:yp, ypCalc:((C.sid.Sun+C.sid.Moon+93+20/60)%360+360)%360, apDiff:(((ap-yp)%360)+360)%360}}""")
    ok('7 karakas ranked by degree, highest first', r['sorted'] and r['n7'] == 7, r)
    ok('8-scheme adds Rahu and Pitrikaraka', r['n8'] == 'AK,AmK,BK,MK,PiK,PuK,GK,DK' and r['rahuIn8'], r)
    ok('Bhrigu Bindu is equally far from Moon and Rahu', abs(r['bbToRahu'] - r['bbToMoon']) < 1e-6, r)
    ok('Yogi point = Sun + Moon + 93d20m', abs(r['yp'] - r['ypCalc']) < 1e-6, r)
    ok('Avayogi point = Yogi + 186d40m', abs(r['apDiff'] - (186 + 40 / 60)) < 1e-6, r)
    # ---- relations by hand
    ex = ev(pg, """()=>{const C=FM.chart({jd:2451545.0,lagna:100,scheme:7}), X={C,S:C};
      const sun=C.sid.Sun, moon=C.sid.Moon, sg=l=>Math.floor(((l%360)+360)%360/30);
      const t=(r)=>FM.evaluate({root:{g:'all',items:[r]}},X).t;
      const R=FM.rule, pl=v=>({k:'planet',v,of:'C'});
      return {
        sunSign: t(R(pl('Sun'),'in_sign',null,{signs:[sg(sun)]})), sunNot: t(R(pl('Sun'),'in_sign',null,{signs:[(sg(sun)+1)%12]})),
        same: t(R(pl('Sun'),'same_sign',pl('Moon'))) === (sg(sun)===sg(moon)),
        conj: t(R(pl('Sun'),'conj',pl('Sun'),{orb:1})), opp: t(R(pl('Rahu'),'angle',pl('Ketu'),{angle:180,orb:0.5})),
        house1: t(R({k:'point',v:'Lagna',of:'C'},'in_house',null,{houses:[1]})),
        lord1: FM.resolve({k:'lord',v:1,of:'C'},X).planet===SIGNS[sg(100)].lord,
        noN: FM.evaluate({root:{g:'all',items:[R({k:'planet',v:'Sun',of:'N'},'in_sign',null,{signs:[0]})]}},X).t,
        noLagna: FM.evaluate({root:{g:'all',items:[R({k:'point',v:'Lagna',of:'C'},'in_house',null,{houses:[1]})]}},{C:FM.chart({jd:2451545.0,lagna:null})}).t,
        negT: t(R(pl('Sun'),'in_sign',null,{signs:[sg(sun)]},{neg:true})),
        grpNone: FM.evaluate({root:{g:'none',items:[R(pl('Sun'),'in_sign',null,{signs:[(sg(sun)+1)%12]})]}},X).t,
        atleast: FM.evaluate({root:{g:'atleast',n:2,items:[R(pl('Sun'),'in_sign',null,{signs:[sg(sun)]}),R(pl('Moon'),'in_sign',null,{signs:[sg(moon)]}),R(pl('Sun'),'in_sign',null,{signs:[(sg(sun)+1)%12]})]}},X).t,
        arud: [1,2,3,4,5,6,7,8,9,10,11,12].every(h=>FM.resolve({k:'arudha',v:h,of:'C'},X).sign!=null),
        nonSignDeg: FM.evaluate({root:{g:'all',items:[R({k:'arudha',v:1,of:'C'},'deg_range',null,{lo:0,hi:10})]}},X).t
      }}""")
    ok('in sign true / false', ex['sunSign'] is True and ex['sunNot'] is False, ex)
    ok('same sign matches arithmetic', ex['same'] is True, ex)
    ok('conj with itself 0 deg, Rahu-Ketu exactly opposite', ex['conj'] is True and ex['opp'] is True, ex)
    ok('Lagna in 1st house, lord of 1st resolves', ex['house1'] is True and ex['lord1'] is True, ex)
    ok('missing chart and missing Lagna give unknown, never false', ex['noN'] is None and ex['noLagna'] is None, ex)
    ok('NOT, none and at-least groups', ex['negT'] is False and ex['grpNone'] is True and ex['atleast'] is True, ex)
    ok('Arudha resolves for every house; degree rule on a sign-only point is unknown', ex['arud'] and ex['nonSignDeg'] is None, ex)
    # ---- library formulas all evaluate, on a person and on the sky
    lib = ev(pg, """()=>{const out=[];const per=activeNatalProfile;FMX.LIB.forEach(f=>{const n=FM.normalize(f);if(!n){out.push(f.name+': invalid');return;}
      try{const X=FM.makeCtx({type:'person',p:per,jd:currentJD},{person:per,scheme:f.scheme});const r=FM.evaluate(n,X);if(![true,false,null].includes(r.t))out.push(f.name+': bad');
          const Y=FM.makeCtx({type:'sky',jd:currentJD},{person:per});FM.evaluate(n,Y);const Z=FM.makeCtx({type:'sky',jd:currentJD},{});FM.evaluate(n,Z);}catch(e){out.push(f.name+': '+e.message)}});return {bad:out,n:FMX.LIB.length}}""")
    ok('every library formula (%d) is valid and evaluates on person, sky+person, bare sky' % lib['n'], not lib['bad'] and lib['n'] >= 40, lib)
    tr = ev(pg, """()=>{const per=activeNatalProfile,f=FM.normalize(FMX.LIB.find(x=>x.id==='lib_sade_sati_saturn_over_your_moon_'));
      const Z=FM.makeCtx({type:'sky',jd:currentJD},{});return {noPerson:FM.evaluate(f,Z).t, withP:[true,false].includes(FM.evaluate(f,FM.makeCtx({type:'sky',jd:currentJD},{person:per})).t)}}""")
    ok('transit formula is unknown without a person, decided with one', tr['noPerson'] is None and tr['withP'], tr)
    # ---- share round trip
    rt = ev(pg, """()=>{let bad=[];FMX.LIB.forEach(f=>{const c=FMX.encode(f);const d=FMX.decode(c);if(!d.formula||JSON.stringify(FM.normalize(f).root)!==JSON.stringify(d.formula.root))bad.push(f.name);});
      const f=FMX.LIB[0];const link=FMX.link(f);const d2=FMX.decode(link);const j=FMX.decode(JSON.stringify(f));const g=FMX.decode('hello');
      const u=FM.formula('Ünï ✦ test','café',[FM.rule({k:'planet',v:'Sun',of:'N'},'in_sign',null,{signs:[1,2]})]);const d3=FMX.decode(FMX.encode(u));
      return {bad,link:!!d2.formula,json:!!j.formula,junk:!!g.error,uni:d3.formula&&d3.formula.name==='Ünï ✦ test'&&d3.formula.root.items[0].a[0].of==='N',len:FMX.encode(f).length}}""")
    ok('share code round-trips for every library formula', not rt['bad'], rt)
    ok('link, JSON and junk import behave; unicode and chart-of survive; code is short', rt['link'] and rt['json'] and rt['junk'] and rt['uni'] and rt['len'] < 600, rt)
    sv = ev(pg, """()=>{localStorage.removeItem('sky3d_fm_saved');const f=FM.formula('S1','',[FM.rule({k:'planet',v:'Sun',of:'C'},'in_sign',null,{signs:[0]})]);FMX.save(f);const a=FMX.dup(f.id);const n=FMX.loadAll().length;FMX.remove(f.id);
      const ex=FMX.exportAll();localStorage.removeItem('sky3d_fm_saved');return {n,after:n-1,imp:FMX.importAll(ex)}}""")
    ok('saved list: save, duplicate, remove, export and import all', sv['n'] == 2 and sv['imp'] == 1, sv)
    # ---- scan
    sc = ev(pg, """async()=>{const f=FM.normalize(FMX.LIB.find(x=>x.id==='lib_libra_sun_pisces_moon'));const r=await FM.scan(f,{mode:'sky',j0:toJulianDay(2024,1,1,0,0,0),j1:toJulianDay(2026,12,31,0,0,0)});
      const ok=r.windows.every(w=>{const m=(w.from+w.to)/2,s=siderealLongitude('Sun',m),mo=siderealLongitude('Moon',m);return Math.floor(s/30)===6&&Math.floor(mo/30)===11});
      const mer=await FM.scan(FM.normalize(FMX.LIB.find(x=>x.id==='lib_mercury_retrograde')),{mode:'sky',j0:toJulianDay(2024,2,1,0,0,0),j1:toJulianDay(2025,2,1,0,0,0)});
      const bb=await FM.scan(FM.formula('bb','',[FM.rule({k:'planet',v:'Saturn',of:'C'},'in_sign',null,{signs:[0]})]),{mode:'birth',j0:toJulianDay(1990,1,1,0,0,0),j1:toJulianDay(2000,1,1,0,0,0)});
      return {n:r.windows.length,ok,mer:mer.windows.length,satN:bb.windows.length,sat:bb.windows.every(w=>Math.floor(siderealLongitude('Saturn',(w.from+w.to)/2)/30)===0)}}""")
    ok('scan: Libra Sun + Pisces Moon windows are all true at their midpoints (found %d)' % sc['n'], sc['n'] >= 3 and sc['ok'], sc)
    ok('scan: Mercury retrograde 4 times in Feb 2024 to Feb 2025 (3 full + tail)', sc['mer'] in (3, 4), sc)
    ok('scan (birth mode): Saturn in Aries windows in 1990-2000 are real (sidereal Saturn entered Aries in the late 1990s)', sc['satN'] >= 1 and sc['sat'], sc)
    # ---- UI
    errs.clear(); pg.evaluate("()=>{localStorage.removeItem('sky3d_fm_cur')}")
    pg.click('#toolsBtn'); pg.wait_for_timeout(200); vis = pg.is_visible('#fmBtn'); ok('Tools menu shows the Formula maker button', vis)
    pg.click('#fmBtn'); pg.wait_for_timeout(500); ok('sheet opens on Build', pg.is_visible('#fmSheet') and pg.is_visible('#fmName'))
    def shot(n):
        if SHOTS: os.makedirs(SHOTS, exist_ok=True); pg.screenshot(path=os.path.join(SHOTS, n + '.png'))
    shot('390_build_empty')
    pg.click('[data-a="addr"]'); pg.wait_for_timeout(300); ok('Add rule opens the editor', pg.is_visible('#fmEdit'))
    pg.click('[data-a="pick"][data-side="a"]'); pg.wait_for_timeout(500); shot('390_picker')
    ok('picker lists karakas, points, arudha', pg.locator('#fmPick [data-a="pk"]').count() > 60 and 'Atmakaraka' in pg.inner_text('#fmPick') and 'Bhrigu Bindu' in pg.inner_text('#fmPick'))
    pg.click('#fmPick [data-a="pk"][data-k="role"][data-v="AK"]'); pg.click('#fmPick [data-a="pickdone"]'); pg.wait_for_timeout(200)
    pg.select_option('#fmEdit [data-a="rel"]', 'in_house'); pg.wait_for_timeout(200)
    for h in (1, 4, 7, 10): pg.click('#fmEdit [data-a="pt"][data-k="houses"][data-v="%d"]' % h)
    pg.wait_for_timeout(400); shot('390_editor'); ok('editor sentence updates', 'AK' in pg.inner_text('#fmEdit .fm-pre-s') and '1st' in pg.inner_text('#fmEdit .fm-pre-s'), pg.inner_text('#fmEdit .fm-pre-s'))
    pg.click('#fmEdit [data-a="editdone"]'); pg.wait_for_timeout(200); ok('rule appears in the builder', 'AK' in pg.inner_text('#fmBody'))
    pg.click('[data-a="tab"][data-v="result"]'); pg.wait_for_timeout(400); shot('390_result')
    ok('result shows a verdict and chart points', pg.locator('.fm-v').count() >= 1 and 'chart points' in pg.inner_text('#fmBody').lower() and 'bhrigu bindu' in pg.inner_text('#fmBody').lower())
    pg.click('[data-a="tab"][data-v="library"]'); pg.wait_for_timeout(300); shot('390_library'); ok('library lists formulas', pg.locator('.fm-lc').count() >= 20)
    pg.fill('#fmQ', 'gajak'); pg.wait_for_timeout(200); ok('library search filters', pg.locator('.fm-lc').count() == 1)
    pg.click('[data-a="usechk"]'); pg.wait_for_timeout(400); ok('Check now loads the formula and shows the result', 'Gajakesari' in pg.inner_text('#fmBody'))
    pg.click('[data-a="share"]'); pg.wait_for_timeout(500); shot('390_share'); ok('share sheet shows VF1 code and link actions', 'VF1.' in pg.input_value('#fmCode') and pg.is_visible('[data-a="sh-link"]'))
    pg.click('[data-a="sharedone"]'); pg.wait_for_timeout(200)
    pg.click('[data-a="scan"]'); pg.wait_for_function("()=>document.querySelectorAll('.fm-w').length>0||document.querySelector('.fm-note')", timeout=60000); shot('390_scan')
    ok('Find dates lists windows', pg.locator('.fm-w').count() > 0 or 'Never' in pg.inner_text('#fmBody'))
    if pg.locator('.fm-w').count():
        pg.locator('.fm-w').first.click(); pg.wait_for_timeout(500); ok('tapping a window closes the sheet and jumps the 3D date', not pg.is_visible('#fmSheet'))
    # link import
    pg2 = ctx.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e))); pg2.route('**/*', route)
    code = ev(pg, "()=>FMX.encode(FM.formula('Linked','x',[FM.rule({k:'planet',v:'Sun',of:'C'},'in_sign',null,{signs:[0]})]))")
    pg2.goto(PAGE + '#f=' + code); pg2.wait_for_timeout(2500); ok('#f= link imports and opens the maker', pg2.is_visible('#fmSheet') and pg2.input_value('#fmName') == 'Linked')
    # overflow and tap targets at 390 and 360
    for w in (390, 360):
        pg2.set_viewport_size({'width': w, 'height': 800}); pg2.wait_for_timeout(300)
        for tab in ('build', 'result', 'library', 'saved'):
            pg2.click('[data-a="tab"][data-v="%s"]' % tab); pg2.wait_for_timeout(250)
            m = pg2.evaluate("()=>{const b=document.getElementById('fmBody');const small=[...document.querySelectorAll('#fmSheet button,#fmSheet select,#fmSheet input')].filter(e=>e.offsetParent&&!e.hidden&&e.type!=='file'&&(e.getBoundingClientRect().height<38)).map(e=>(e.dataset.a||e.id)+':'+Math.round(e.getBoundingClientRect().height));return {over:b.scrollWidth>b.clientWidth+1,small}}")
            ok('%d: %s tab has no sideways overflow' % (w, tab), not m['over'], m)
            ok('%d: %s tab tap targets are at least 38px' % (w, tab), not m['small'], m['small'][:5])
        if SHOTS and w == 360:
            os.makedirs(SHOTS, exist_ok=True); pg2.click('[data-a="tab"][data-v="build"]'); pg2.wait_for_timeout(200); pg2.screenshot(path=os.path.join(SHOTS, '360_build.png'))
            pg2.click('[data-a="tab"][data-v="saved"]'); pg2.wait_for_timeout(200); pg2.screenshot(path=os.path.join(SHOTS, '360_saved.png'))
    ok('no page errors', not errs, errs[:3])
    b.close()
print('FAILED' if bad else 'ALL OK'); raise SystemExit(1 if bad else 0)

# Date Finder engine checks: known festival dates (Delhi), 16 solar + 11 lunar eclipses 2000-2030, combined-clue search, Samvatsara.
# Usage: python3 tests/datefinder_test.py   (after python3 build.py). Festival dates may differ by 1 day for regional reasons ('~' is fine, 'X' is not).
import os, sys, json, time
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
sys.path.insert(0, os.path.dirname(__file__)); from _helpers import PAGE, CUSTOMER, is_local
def route(r):
    u=r.request.url
    if is_local(u): return r.continue_()
    return r.abort()
RUN="""(q)=>{const g=dfGen(q);let r;do{r=g.next();}while(!r.done);const R=r.value;return {rows:R.rows.map(x=>({d:x.date,m:x.miss,c:x.chips.map(c=>c.txt)})),nFull:R.nFull,nAlmost:R.nAlmost}}"""
BASE=dict(lat=28.6139,lon=77.2090,tz=5.5,pak='',tithi='',wd='',fest='',tol='0',ecl='',nak='',moon='',masa='',sun='',sam='',mon='',dom='',sat='',jup='',rahu='',purn=False)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    ctx=b.new_context(viewport={'width':1100,'height':900}); ctx.route('**/*',route); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(PAGE); pg.wait_for_timeout(4500)
    fr=[f for f in pg.frames if f!=pg.main_frame and f.evaluate("typeof dfGen")=='function']
    print('frame with dfGen:',bool(fr)); f=fr[0]
    def run(**kw):
        q=dict(BASE); q.update(kw); return f.evaluate(RUN,q)
    # --- festival dates
    EXP={
     'diwali':['2017-10-19','2018-11-07','2019-10-27','2020-11-14','2021-11-04','2022-10-24','2023-11-12','2024-10-31','2025-10-20'],
     'holika':['2023-03-07','2024-03-24','2025-03-13'],
     'holi':['2023-03-08','2024-03-25','2025-03-14'],
     'shivratri':['2022-03-01','2023-02-18','2024-03-08','2025-02-26'],
     'janmashtami':['2022-08-18','2023-09-06','2024-08-26'],
     'ganesh':['2022-08-31','2023-09-19','2024-09-07','2025-08-27'],
     'dussehra':['2022-10-05','2023-10-24','2024-10-12','2025-10-02'],
     'rakhi':['2022-08-11','2023-08-30','2024-08-19','2025-08-09'],
     'ramnavami':['2023-03-30','2024-04-17','2025-04-06'],
     'makar':['2023-01-15','2024-01-15','2025-01-14'],
     'mesha':['2023-04-14','2024-04-13','2025-04-14'],
     'dhanteras':['2022-10-22','2023-11-10','2024-10-29'],
     'navratri':['2022-09-26','2023-10-15','2024-10-03'],
     'akshaya':['2023-04-22','2024-05-10','2025-04-30'],
    }
    import datetime
    def dd(s): return datetime.date.fromisoformat(s)
    tot=0; good=0
    for fid,dates in EXP.items():
        yrs=sorted({int(d[:4]) for d in dates})
        r=run(y0=yrs[0],y1=yrs[-1],fest=fid,tol='0')
        got=[x['d'] for x in r['rows']]
        res=[]
        for d in dates:
            ex=d in got; near=any(abs((dd(g)-dd(d)).days)<=1 for g in got)
            tot+=1; good+= 1 if ex else 0
            res.append(('=' if ex else ('~' if near else 'X'))+d[2:])
        print(f'{fid:12}',' '.join(res),'| got',len(got))
    print('festival exact',good,'/',tot)
    # --- eclipses (tz 0 so dates are UTC)
    SOL="2009-07-22 2010-01-15 2010-07-11 2012-05-20 2013-11-03 2015-03-20 2017-08-21 2019-07-02 2019-12-26 2020-06-21 2020-12-14 2021-12-04 2023-04-20 2023-10-14 2024-04-08 2024-10-02".split()
    LUN="2010-12-21 2011-06-15 2014-04-15 2015-09-28 2018-01-31 2018-07-27 2019-01-21 2021-05-26 2022-11-08 2025-03-14 2025-09-07".split()
    rs=run(y0=2000,y1=2030,ecl='solar',tz=0,lat=0,lon=0,tol='0'); gs=[x['d'] for x in rs['rows']]
    rl=run(y0=2000,y1=2030,ecl='lunar',tz=0,lat=0,lon=0,tol='0'); gl=[x['d'] for x in rl['rows']]
    print('solar found',len(gs),'known hit',sum(d in gs for d in SOL),'/',len(SOL),'missing',[d for d in SOL if d not in gs])
    print('lunar found',len(gl),'known hit',sum(d in gl for d in LUN),'/',len(LUN),'missing',[d for d in LUN if d not in gl])
    # --- combined clue scenario
    t0=time.time(); r=run(y0=2020,y1=2025,tithi='A',wd='0',fest='diwali',tol='1'); print('Amavasya+Sunday+Diwali:',[x['d'] for x in r['rows'] if x['m']==0],'almost',r['nAlmost'],round(time.time()-t0,2),'s')
    # --- samvatsara
    r=run(y0=2024,y1=2024,sam="37",tol="0"); ds=[x['d'] for x in r['rows']]; print('Krodhi (idx37) 2024 first/last:',ds[0] if ds else None,ds[-1] if ds else None)
    r=run(y0=1987,y1=1987,sam='0'); ds=[x['d'] for x in r['rows']]; print('Prabhava 1987 first/last:',ds[0] if ds else None,ds[-1] if ds else None)
    # --- perf
    t0=time.time(); r=run(y0=1970,y1=2009,tithi='A',wd='6'); print('40y Shani Amavasya',r['nFull'],'dates',round(time.time()-t0,2),'s'); print([x['d'] for x in r['rows']][:6])
    print('page errors:',errs)
    b.close()

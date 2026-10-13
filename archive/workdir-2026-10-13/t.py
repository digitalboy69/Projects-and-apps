from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/w/srcB.html");pg.wait_for_timeout(1500)
    r=pg.evaluate("""()=>{const out=[];let bad=0,seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    for(let i=0;i<300;i++){const y=1940+Math.floor(rnd()*75),m=1+Math.floor(rnd()*12),d=1+Math.floor(rnd()*28),h=Math.floor(rnd()*24),mi=Math.floor(rnd()*60),lat=-40+rnd()*90,lon=-120+rnd()*240;
      try{const ds=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,ts=`${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`;const c=computeChart(ds,ts,lat,lon,5.5);const F=window.computeFate(c,{lat,lon});
      const vals=[F.fate,F.PF,F.HF,F.FF,F.YS,F.TWnow,F.GT,...F.houses.map(h=>h.fate),...F.years.map(y=>y.fate)];
      if(vals.some(v=>!isFinite(v))||F.fm.length!==12||F.wm.length!==12)bad++;out.push(F.fate);}catch(e){bad++;out.push('E:'+e.message);}}
    const nums=out.filter(x=>typeof x==='number').sort((a,b)=>a-b);
    return {bad,n:nums.length,min:nums[0],p10:nums[Math.floor(nums.length*.1)],med:nums[Math.floor(nums.length/2)],p90:nums[Math.floor(nums.length*.9)],max:nums[nums.length-1],errs:out.filter(x=>typeof x==='string').slice(0,3)};}""")
    print(json.dumps(r))
    # transit check vs live sky
    r2=pg.evaluate("""()=>{const s=computeLiveSky(20,78,0);const d=new Date(),jd=toJulianDay(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),d.getUTCHours(),d.getUTCMinutes(),0);
      return ['Jupiter','Saturn'].map(p=>[p,s.planets[p].sign,Math.floor(((planetGeocentricLongitude(p.toLowerCase(),jd)-lahiriAyanamsa(jd))%360+360)%360/30)]);}""")
    print(r2,errs[:3])
    b.close()

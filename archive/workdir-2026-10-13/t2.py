from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':430,'height':900});errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)));pg.on("console",lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto("file:///home/claude/w/srcB.html");pg.wait_for_timeout(1500)
    html=pg.evaluate("""()=>{const c=computeChart('1990-05-15','10:30',19.07,72.87,5.5);const h=window.buildFatePanel(c,{lat:19.07,lon:72.87});const d=document.createElement('div');d.id='tst';d.innerHTML=h;document.body.appendChild(d);
      const tiles=[...d.querySelectorAll('.fm-h')];let ok=0;tiles.forEach(t=>{t.click();if(d.querySelector('.fm-d'))ok++;});
      return {tiles:tiles.length,ok,layers:d.querySelectorAll('.fm-l').length,own:d.querySelectorAll('.fm-own .vx-chip').length,nan:/NaN|undefined/.test(d.innerText),det:d.querySelector('.fm-d').innerText.slice(0,400)};}""")
    print(html);print(errs[:5])
    pg.screenshot(path='fm.png',full_page=False)
    # wrapper loads
    pg2=b.new_page();e2=[];pg2.on("pageerror",lambda e:e2.append(str(e)));pg2.goto("file:///home/claude/w/new.html");pg2.wait_for_timeout(3000);print('wrapper errs',e2[:3]);b.close()

s=open('srcA.html',encoding='utf-8').read()
def rep(o,n,c=1):
    global s
    assert s.count(o)==c,(s.count(o),o[:60]); s=s.replace(o,n)
info=open('outer_info.js',encoding='utf-8').read()
rep("function closePlanetDetail(){", info+"\n"+open('outer_a.js',encoding='utf-8').read()+"\nfunction closePlanetDetail(){")
rep("function openPlanetDetail(name, jd){\n  if (jd == null) jd = currentJD;\n  const snap = snapshotPositions(jd), lon","function openPlanetDetail(name, jd){\n  if (jd == null) jd = currentJD;\n  if (OUTER_LIST.includes(name)) return openOuterPlanetDetail(name, jd);\n  const snap = snapshotPositions(jd), lon")
# row click + picker
rep("""      if (OUTER_LIST.includes(name)){ if (SOL.view==='solar') setSceneView('wheel'); setCamMode('focus'); focusedPlanetKey = 'geo_'+name; autoRotate = false; const sel = document.getElementById('focusPlanetSelect'); if (sel) sel.value = focusedPlanetKey; updateLegend(); markDirty(); }
      else openPlanetDetail(name);""","""      openPlanetDetail(name);""")
rep("""${outer?'':`<button class="pk-info" data-i="${n}" aria-label="Details">i</button>`}""","""<button class="pk-info" data-i="${n}" aria-label="Details">i</button>""")
rep("Tap a planet to fly the camera to it.${solar?'':' Tap ⓘ for its full details.'}","Tap a planet to fly the camera to it.${solar?'':' Tap ⓘ for its full details.'}")
open('srcA.html','w',encoding='utf-8').write(s)

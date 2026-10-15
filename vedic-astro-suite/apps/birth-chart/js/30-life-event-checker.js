/* ---------------------------- Life-Event checker ---------------------------- */
function rsBuildLife(p){
  p.innerHTML = `
  <div class="rs-pane-head"><h3>🌟 Life-Event Checker</h3><p>Real events are the best proof. We test every possible rising sign against your dashas and slow transits.</p></div>
  <details class="rs-how"><summary>💡 How it works (and how far to trust it)</summary>
    <p>For each possible rising sign we ask: <em>at the date of each event, were the running Mahadasha / Antardasha / Pratyantardasha lords linked to the houses that rule that kind of event?</em>
    Houses a planet is linked to = the house it sits in plus the houses it rules. Jupiter and Saturn transits to those houses add a bonus. Scores are relative, a ranking and not a proof.
    Add <b>3 or more</b> dated events (marriage, job, child, move…) for a meaningful result. Treat the answer as a clue to confirm with the other tools.</p></details>
  <div class="rs-ev-form">
    <label>Event<select id="rsEvCat">${Object.keys(RS_CATS).map(k=>`<option value="${k}">${RS_CATS[k].label}</option>`).join('')}</select></label>
    <label>Date<input type="date" id="rsEvDate"></label>
    <label class="grow">Note (optional)<input type="text" id="rsEvNote" maxlength="40" placeholder="e.g. first job"></label>
    <button type="button" class="btn btn-ghost" id="rsEvAdd">＋ Add event</button>
  </div>
  <div id="rsEvList" class="rs-ev-list"></div>
  <div class="rs-ev-opts">
    <label>Search around your working time<select id="rsEvWin">
      <option value="12">Whole day · all 12 signs</option><option value="6">± 6 hours</option><option value="3" selected>± 3 hours</option><option value="1.5">± 90 minutes</option></select></label>
    <button type="button" class="btn btn-primary" id="rsEvRun">✨ Find the best-fitting rising sign</button>
  </div>
  <div id="rsEvOut"></div>`;
  p.querySelector('#rsEvAdd').addEventListener('click', ()=>{
    const d = document.getElementById('rsEvDate').value, c = document.getElementById('rsEvCat').value, n = document.getElementById('rsEvNote').value.trim();
    if (!d){ rsToast('Pick the event date first 📅'); return; }
    const p0 = currentProfileForExport;
    if (p0 && d < p0.dob){ rsToast('That date is before the birth date'); return; }
    rsState.events.push({ c, d, n }); rsState.events.sort((a,b)=> a.d<b.d?-1:1);
    rsSaveEvents(); rsRenderEvents(); document.getElementById('rsEvDate').value=''; document.getElementById('rsEvNote').value='';
    rsToast('Event added ✓');
  });
  p.querySelector('#rsEvList').addEventListener('click', e=>{
    const b = e.target.closest('[data-rs-del]'); if (!b) return;
    rsState.events.splice(+b.dataset.rsDel,1); rsSaveEvents(); rsRenderEvents();
  });
  p.querySelector('#rsEvRun').addEventListener('click', rsRunLife);
  p.addEventListener('click', e=>{
    const b = e.target.closest('[data-rs-use]'); if (!b) return;
    const off = +b.dataset.rsUse, dEl = document.getElementById('rectDate');
    const base = shiftLocalDateTime(dEl.value, document.getElementById('rectCenterTime').value, off);
    dEl.value = base.dateStr;
    const pr = base.timeStr.split(':').map(Number); rectHms = { h:pr[0], m:pr[1], s:pr[2]||0 }; updateHmsDisplay();
    rsToast('Dial set to ' + base.timeStr.slice(0,5) + ' ✓'); rsShow('dial', true);
  });
}
function rsRenderEvents(){
  const el = document.getElementById('rsEvList'); if (!el) return;
  if (!rsState.events.length){ el.innerHTML = `<div class="rs-empty">No events yet. Add your first one above. Marriage, a job, a child, a big move all work well.</div>`; return; }
  el.innerHTML = rsState.events.map((e,i)=>`<span class="rs-evchip"><b>${RS_CATS[e.c]?RS_CATS[e.c].label:rsEsc(e.c)}</b> · ${rsEsc(e.d)}${e.n?` · ${rsEsc(e.n)}`:''}<button type="button" data-rs-del="${i}" aria-label="Remove">✕</button></span>`).join('') +
    (rsState.events.length<3 ? `<div class="rs-empty" style="margin-top:8px">Tip: ${3-rsState.events.length} more event${3-rsState.events.length>1?'s':''} will make the ranking much more reliable.</div>` : '');
}

function rsHouseOf(sign, L){ return ((sign - L + 12) % 12) + 1; }
function rsLinks(P, L, chart){
  // houses planet P is linked to from lagna L: occupied + owned (nodes also act through their sign lord)
  const out = {};
  const add = (h, why)=>{ if (!out[h]) out[h] = why; };
  const pl = chart.planets[P]; if (!pl) return out;
  add(rsHouseOf(pl.sign, L), 'sits in H'+rsHouseOf(pl.sign, L));
  const owner = (P==='Rahu'||P==='Ketu') ? SIGNS[pl.sign].lord : P;
  for (let s=0;s<12;s++) if (SIGNS[s].lord===owner) add(rsHouseOf(s,L), (owner===P?'rules':'via '+owner+' rules')+' H'+rsHouseOf(s,L));
  if (owner!==P && chart.planets[owner]) add(rsHouseOf(chart.planets[owner].sign, L), 'via '+owner+' in H'+rsHouseOf(chart.planets[owner].sign, L));
  return out;
}
function rsScore(P, L, cat, chart){
  const links = rsLinks(P, L, chart); let sc = 0; const hits = [];
  Object.keys(links).forEach(h=>{
    h = +h;
    if (cat.p.indexOf(h)>-1){ sc += 2; hits.push(links[h]+' ★'); }
    else if (cat.s.indexOf(h)>-1){ sc += 1; hits.push(links[h]); }
  });
  if (cat.k.indexOf(P)>-1) sc += 0.5;
  return { sc, hits };
}
function rsEvalLagna(L, chart, evs){
  let total = 0; const detail = [];
  evs.forEach(ev=>{
    const cat = RS_CATS[ev.c]; if (!cat) return;
    let s = 0; const lines = [];
    [['Mahadasha', ev.md, 1],['Antardasha', ev.ad, 1],['Pratyantardasha', ev.pd, .5]].forEach(([nm,P,w])=>{
      if (!P) return; const r = rsScore(P, L, cat, chart); s += r.sc*w;
      lines.push(`${nm} ${P}${r.hits.length?': '+r.hits.join(', '):': no link'}`);
    });
    // slow transits
    let tHit = 0;
    [['Jupiter',[0,4,6,8]],['Saturn',[0,2,6,9]]].forEach(([P,offs])=>{
      const hs = rsHouseOf(ev.tr[P], L); const set = offs.map(o=> ((hs-1+o)%12)+1);
      const pm = set.filter(h=> cat.p.indexOf(h)>-1).length>0, sm = set.filter(h=> cat.s.indexOf(h)>-1).length>0;
      if (pm){ s += 1; tHit++; lines.push(`${P} transit reaches H${cat.p.filter(h=>set.indexOf(h)>-1).join('/H')} ★`); }
      else if (sm){ s += .4; }
    });
    if (tHit===2){ s += 1; lines.push('Double transit ✨'); }
    total += s; detail.push({ ev, s, lines });
  });
  return { total, detail };
}

function rsRunLife(){
  const out = document.getElementById('rsEvOut'); if (!out) return;
  const chart = currentChartForModal, prof = currentProfileForExport;
  if (!chart || !prof){ out.innerHTML = `<div class="rs-empty">Generate a chart first.</div>`; return; }
  if (!rsState.events.length){ rsToast('Add at least one event first'); out.innerHTML = `<div class="rs-empty">Add some dated events above, then press the button again.</div>`; return; }
  const tz = prof.tz || 0;
  const evs = rsState.events.map(e=>{
    const [y,m,d] = e.d.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m-1, d, 12) - tz*3600000);
    const jd = dt.getTime()/86400000 + 2440587.5;
    const act = findActiveDasha(chart.dashaData.mahadashas, dt) || {};
    return { c:e.c, d:e.d, n:e.n, md: act.mahadasha&&act.mahadasha.lord, ad: act.antardasha&&act.antardasha.lord, pd: act.pratyantardasha&&act.pratyantardasha.lord,
      tr:{ Jupiter: Math.floor(getSiderealLongitudeAt('Jupiter', jd)/30), Saturn: Math.floor(getSiderealLongitudeAt('Saturn', jd)/30) } };
  });
  // which rising signs occur in the chosen window, and when
  const dEl = document.getElementById('rectDate'), tStr = document.getElementById('rectCenterTime').value;
  const half = parseFloat(document.getElementById('rsEvWin').value)*3600, step = half>14000 ? 240 : 120;
  const segs = []; let cur = null;
  for (let off=-half; off<=half; off+=step){
    const sh = shiftLocalDateTime(dEl.value, tStr, off);
    const sg = rectifyPoint(sh.dateStr, sh.timeStr, prof.lat, prof.lon, tz).asc.sign;
    if (cur && cur.sign===sg) cur.end = off+step; else { cur = { sign:sg, start:off, end:off+step }; segs.push(cur); }
  }
  const bySign = {};
  segs.forEach(s=>{ (bySign[s.sign] = bySign[s.sign] || []).push(s); });
  const ranked = Object.keys(bySign).map(k=>{ const L=+k, r = rsEvalLagna(L, chart, evs); return { L, total:r.total, detail:r.detail, segs:bySign[k] }; })
    .sort((a,b)=> b.total-a.total);
  const best = ranked[0].total || 1;
  const fmt = off=>{
    const sh = shiftLocalDateTime(dEl.value, tStr, off); const day = sh.dateStr===dEl.value ? '' : (sh.dateStr>dEl.value?' +1d':' −1d');
    return sh.timeStr.slice(0,5)+day;
  };
  const close = ranked.length>1 && ranked[1].total >= ranked[0].total*0.9;
  out.innerHTML = `
    <div class="rs-res-head">Ranking of possible rising signs <span>${evs.length} event${evs.length>1?'s':''} tested</span></div>
    ${ranked.map((r,i)=>{
      const pct = Math.round(r.total/best*100), sg = SIGNS[r.L];
      return `<div class="rs-rank ${i===0?'top':''}">
        <div class="rs-rank-row"><span class="rs-rank-n">${i===0?'👑':i+1}</span><b>${sg.symbol} ${sg.name}</b>
          <div class="rs-bar"><i data-w="${pct}"></i></div><em>${pct}%</em></div>
        <div class="rs-rank-segs">${r.segs.map(s=>`<button type="button" class="rs-seg" data-rs-use="${Math.round((s.start+s.end)/2)}" title="Set the dial to the middle of this window">🕰️ ${fmt(s.start)} – ${fmt(s.end)} <u>use ➜</u></button>`).join('')}</div>
        <details class="rs-why"><summary>Why this score?</summary>${r.detail.map(x=>`<div class="rs-why-ev"><b>${RS_CATS[x.ev.c]?RS_CATS[x.ev.c].label:''} · ${rsEsc(x.ev.d)}</b><ul>${x.lines.map(l=>`<li>${rsEsc(l)}</li>`).join('')}</ul></div>`).join('')}</details>
      </div>`;
    }).join('')}
    <div class="rs-note">${close?'⚖️ <b>Close call.</b> The top signs are within 10%. Add more events or check the Sandhi / Varga tools. ':''}Times are in your birth timezone and are approximate to a few minutes. Use <b>"use ➜"</b> to load a window into the Time Dial. This ranking supports your judgement, it does not replace it.</div>`;
  requestAnimationFrame(()=> requestAnimationFrame(()=> out.querySelectorAll('.rs-bar i').forEach(b=> b.style.width = b.dataset.w+'%')));
  rsToast('Done ✨ Top fit: ' + SIGNS[ranked[0].L].name);
}

/* Hooks: keep old panel ids working + keep clock/pill live */
(function rsInstallHooks(){
  if (window.__rsHooks) return; window.__rsHooks = 1;
  const _sw = switchAppTab;
  switchAppTab = function(id){
    if (RS_ROUTE[id] && document.getElementById('rsRoot')){
      _sw('panel-rectification'); rsShow(RS_ROUTE[id]); return;
    }
    _sw(id); if (id==='panel-rectification' && document.getElementById('rsRoot')) rsRefresh();
  };
  const _up = updateHmsDisplay;
  updateHmsDisplay = function(){ _up(); try{ rsRefresh(); }catch(e){} };
})();


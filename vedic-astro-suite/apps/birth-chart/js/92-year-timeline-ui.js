/* Year Timeline File: screen. Pick two dates, make one structured file (Markdown) to give to any AI. Engine 90-, writer 91-. */
(function(){
  let cur = null, last = null;
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function toJD(dateStr, tz){ const p = dateStr.split('-').map(Number); return toJulianDay(p[0], p[1], p[2], 0, 0, 0) - tz / 24; }
  window.buildYearTimelinePanel = function(c, P){
    cur = { c, P };
    const t = new Date(), e = new Date(t.getFullYear(), t.getMonth() + 12, t.getDate());
    return `<div class="yt-wrap">
      <h3 class="section-heading">Year Timeline File</h3>
      <p class="vx-note">Pick two dates. You get one file with every planet move, nakshatra change, transit contact and dasha change in that time, plus what each planet rules in this chart. Give the file to any AI to read. This file only has facts.</p>
      <div class="yt-row"><label>From <input type="date" id="ytFrom" value="${iso(t)}"></label><label>To <input type="date" id="ytTo" value="${iso(e)}"></label></div>
      <div class="yt-row"><label class="yt-chk"><input type="checkbox" id="ytMoon"> Add Moon moves (makes the file much longer)</label>
      <label class="yt-chk"><input type="checkbox" id="ytOuter"> Add Uranus, Neptune, Pluto</label>
      <label class="yt-chk"><input type="checkbox" id="ytAsk" checked> Add a "what to ask" note at the end</label></div>
      <button class="filter-chip yt-go" id="ytGo">Create file</button>
      <div id="ytOut" class="yt-out"></div></div>`;
  };
  document.addEventListener('click', function(ev){
    const go = ev.target.closest && ev.target.closest('#ytGo');
    if (go){
      const out = document.getElementById('ytOut'); if (!cur){ return; }
      try {
        const f = document.getElementById('ytFrom').value, t = document.getElementById('ytTo').value;
        if (!f || !t) { out.innerHTML = '<p class="vx-note">Please pick both dates.</p>'; return; }
        const tz = cur.c.tzOffsetHours, s = toJD(f, tz), e = toJD(t, tz) + 1;
        if (!(e > s)) { out.innerHTML = '<p class="vx-note">The end date must be after the start date.</p>'; return; }
        const days = e - s;
        if (days > 1100) { out.innerHTML = '<p class="vx-note">Please keep it to 3 years or less.</p>'; return; }
        out.innerHTML = '<p class="vx-note">Working…</p>';
        setTimeout(function(){
          try {
            const res = YT.scan(cur.c, cur.P, { startJD: s, endJD: e, moon: document.getElementById('ytMoon').checked, outer: document.getElementById('ytOuter').checked, ask: document.getElementById('ytAsk').checked });
            const w = YTW.write(cur.c, cur.P, res); last = { text: w.text, name: (cur.P && cur.P.name) || 'chart', f, t };
            const cnt = Object.keys(res.counts).map(k => res.counts[k] + ' ' + k.toLowerCase()).join(', ');
            out.innerHTML = '<p class="vx-note g">Ready: ' + res.events.length + ' events (' + cnt + '). About ' + w.tokens.toLocaleString() + ' tokens' + (w.tokens > 40000 ? ' – long. Try a shorter range if your AI cuts it off.' : '.') + '</p>' +
              (days > 730 ? '<p class="vx-note">Over 2 years: the file is big.</p>' : '') +
              res.warnings.map(x => '<p class="vx-note">' + x + '</p>').join('') +
              '<div class="yt-row"><button class="filter-chip" id="ytCopy"><span>📋</span> Copy</button><button class="filter-chip" id="ytDl"><span>⬇</span> Download .md</button></div>' +
              '<details><summary>Preview</summary><pre class="yt-pre"></pre></details>';
            out.querySelector('.yt-pre').textContent = w.text;
          } catch (err) { out.innerHTML = '<p class="vx-note">Could not make the file: ' + String(err.message || err).replace(/</g, '&lt;') + '</p>'; }
        }, 30);
      } catch (err) { out.innerHTML = '<p class="vx-note">Could not make the file.</p>'; }
      return;
    }
    const cp = ev.target.closest && ev.target.closest('#ytCopy');
    if (cp && last){ copyTextToClipboard(last.text, cp, '<span>📋</span> Copy'); return; }
    const dl = ev.target.closest && ev.target.closest('#ytDl');
    if (dl && last){
      const b = new Blob([last.text], { type: 'text/markdown' }), a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = 'year-timeline-' + last.name.replace(/[^\w-]+/g, '_') + '-' + last.f + '_to_' + last.t + '.md';
      document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }
  });
})();

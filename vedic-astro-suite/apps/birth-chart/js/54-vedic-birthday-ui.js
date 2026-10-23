/* ---------------------------------- VEDIC BIRTHDAY UI ---------------------------------- */
let VB = null;
const VB_COL = { tithi: '#D4AF37', nak: '#5EC4B7', solar: '#8A6FB8' };
const VB_MIN = 1900, VB_MAX = 2100;
const vbWd = d => PN_VARA[pnWeekday(d.y, d.m, d.d)][1];
const vbLong = d => `${vbWd(d).slice(0, 3)}, ${d.d} ${PN_MON[d.m - 1]} ${d.y}`;
const vbShort = d => `${d.d} ${PN_MON[d.m - 1]}`;
const vbDays = d => Math.round((Date.UTC(d.y, d.m - 1, d.d) - Date.UTC(VB.today.y, VB.today.m - 1, VB.today.d)) / 86400000);
function vbRel(d){ const n = vbDays(d); return n === 0 ? 'Today 🎉' : n > 0 ? `in ${n === 1 ? '1 day' : n < 60 ? n + ' days' : n < 500 ? Math.round(n / 30.44) + ' months' : (n / 365.25).toFixed(1) + ' years'}` : `${-n === 1 ? '1 day' : -n < 60 ? -n + ' days' : -n < 500 ? Math.round(-n / 30.44) + ' months' : (-n / 365.25).toFixed(1) + ' years'} ago`; }
function vbGreg(d, y){ const n = Math.round((Date.UTC(d.y, d.m - 1, d.d) - Date.UTC(y, VB.N.bm - 1, VB.N.bd)) / 86400000);
  return n === 0 ? 'Same day as your Gregorian birthday' : `${Math.abs(n)} day${Math.abs(n) === 1 ? '' : 's'} ${n > 0 ? 'after' : 'before'} your Gregorian birthday (${VB.N.bd} ${PN_MON[VB.N.bm - 1]})`; }

function buildVedicBirthdayPanel(chart, profile){
  const N = vbNatal(chart, profile), now = new Date();
  VB = { N, cache: {}, profile, y: now.getFullYear(), today: { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() } };
  VB.y = Math.min(VB_MAX, Math.max(VB_MIN, VB.y));
  const P = N.P;
  VB.pending = true;   // a year of lunar searches is heavy: compute only when the panel is opened (see vbLazyRender)
  setTimeout(() => { const pn = document.getElementById('panel-vbday'); if (pn && pn.classList.contains('active')) vbLazyRender(); }, 0);
  return `<div class="vb">
    <div class="vb-hero">
      <div class="vb-cake" aria-hidden="true">🎂</div>
      <h3>Your Vedic Birthday</h3>
      <p>In the Hindu calendar your birthday is not a fixed date — it follows the Moon and Sun. Pick any year to see when your birth <b>Tithi</b>, <b>Nakshatra</b> and <b>Sun position</b> return.</p>
      <div class="vb-born">
        <span>🌙 ${PN_MASA[N.masaIdx]}${N.adhika ? ' (Adhika)' : ''} · ${P.tithi.paksha} ${P.tithi.name}</span>
        <span>★ ${NAKSHATRAS[N.nak].name} · pada ${N.pada}</span>
        <span>☀ Sun ${nvDeg(N.sunSid)}</span>
        <span>📅 Born ${vbLong({ y: N.by, m: N.bm, d: N.bd })}</span>
      </div>
    </div>
    <div class="vb-year">
      <button type="button" data-vb-step="-1" aria-label="Previous year">‹</button>
      <label><span>Year</span><input type="number" id="vbYear" min="${VB_MIN}" max="${VB_MAX}" value="${VB.y}" inputmode="numeric"></label>
      <button type="button" data-vb-step="1" aria-label="Next year">›</button>
      <button type="button" class="vb-now" data-vb-this>This year</button>
    </div>
    <div id="vbBody"></div>
  </div>`;
}
function vbLazyRender(){ if (VB && VB.pending){ VB.pending = false; vbRender(); } }
/* Export / PDF read every panel's text: build the deferred ones first so reports stay complete. */
window.vxEnsurePanels = function(){ try { vbLazyRender(); } catch (e) {} try { if (window.tpRenderPending) window.tpRenderPending(); } catch (e) {} };
function vbGet(y){ if (!VB.cache[y]) VB.cache[y] = vbYear(VB.N, y); return VB.cache[y]; }
function vbRender(){
  const body = document.getElementById('vbBody'); if (!body || !VB) return;
  const y = VB.y; body.innerHTML = '<div class="vb-loading"><i></i> Calculating the sky for ' + y + '…</div>';
  setTimeout(() => {
    let Y; try { Y = vbGet(y); } catch(e){ console.error(e); body.innerHTML = '<div class="meta-err">Could not compute this year.</div>'; return; }
    VB.last = Y; body.innerHTML = vbBodyHtml(Y);
    vbNextUp();
  }, 20);
}
function vbDateBlock(label, day, sub, extra, y){
  const rel = vbRel(day), today = vbDays(day) === 0;
  return `<div class="vb-d ${today ? 'today' : ''}"><div class="vb-dl">${label}</div><b>${vbLong(day)}</b><span class="vb-rel">${rel}</span>
    <small>${sub}</small>${extra || ''}<em>${vbGreg(day, y)}</em></div>`;
}
function vbBodyHtml(Y){
  const N = VB.N, y = Y.y, tz = N.tz;
  const tCards = Y.tithi.length ? Y.tithi.map((t, i) => vbDateBlock(Y.tithi.length > 1 ? `Occurrence ${i + 1}` : 'Observed on', t.day,
    `${PN_MASA[N.masaIdx]} ${N.P.tithi.paksha} ${N.P.tithi.name}`,
    `<div class="vb-t">Tithi runs ${nvDate(t.start, tz, true)} → ${nvDate(t.end, tz, true)}</div>${t.day.sunrise ? '' : '<div class="vb-warn">⚠ This tithi begins and ends between two sunrises (kshaya). Many families observe it on this date regardless.</div>'}`, y)).join('') : '<div class="pl-empty">This tithi does not fall in this calendar year.</div>';
  const nb = Y.nak.filter(x => x.birthMonth);
  const nCards = nb.length ? nb.map((t, i) => vbDateBlock(nb.length > 1 ? `Occurrence ${i + 1}` : 'Observed on', t.day, `${NAKSHATRAS[N.nak].name} · in ${t.masa}`,
    `<div class="vb-t">Moon in ${NAKSHATRAS[N.nak].name}: ${nvDate(t.start, tz, true)} → ${nvDate(t.end, tz, true)}</div>`, y)).join('') : '<div class="pl-empty">No birth-month Nakshatra day found in this calendar year.</div>';
  const sr = Y.solar;
  const sCard = sr ? `<div class="vb-d ${vbDays(sr.day) === 0 ? 'today' : ''}"><div class="vb-dl">Exact moment</div><b>${vbLong(sr.day)}</b><span class="vb-rel">${vbRel(sr.day)}</span>
      <small>${sr.time} local time at the birth place · turning ${sr.age}</small>
      <div class="vb-t">Sun returns to ${nvDeg(N.sunSid)} (sidereal) · Varsha Lagna ${SIGNS[sr.lagna].symbol} ${SIGNS[sr.lagna].name} · Moon in ${SIGNS[sr.moon].symbol} ${SIGNS[sr.moon].name}</div><em>${vbGreg(sr.day, y)}</em></div>` : '<div class="pl-empty">Not available for this year.</div>';

  // year bar
  const dim = ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 366 : 365, doy = d => (Date.UTC(d.y, d.m - 1, d.d) - Date.UTC(y, 0, 1)) / 86400000;
  const pos = d => (doy(d) / dim * 100).toFixed(2);
  const mons = PN_MON.map(m => `<span>${m[0]}</span>`).join('');
  const lane = (lbl, col, items) => `<div class="vb-lane"><b style="color:${col}">${lbl}</b><div class="vb-ltrack">${items.map(d => `<i style="left:${pos(d)}%;background:${col}" title="${vbShort(d)}"></i>`).join('')}</div></div>`;
  const greg = `<div class="vb-gl"><u style="left:${pos({ y, m: N.bm, d: N.bd })}%"></u></div>`;
  const tn = Y.today || null;
  const bar = `<div class="vb-bar"><div class="vb-months">${mons}</div><div class="vb-lanes">${greg}
    ${lane('Tithi', VB_COL.tithi, Y.tithi.map(t => t.day))}${lane('Nakshatra', VB_COL.nak, nb.map(t => t.day))}${lane('Solar', VB_COL.solar, sr ? [sr.day] : [])}</div>
    <div class="vb-legend"><span><u></u> Gregorian birthday</span></div></div>`;

  const nakAll = Y.nak.map(x => `<div class="vb-nr ${x.birthMonth ? 'on' : ''}"><b>${vbLong(x.day)}</b><span>${x.masa}</span>${x.birthMonth ? '<em>birth month</em>' : ''}</div>`).join('');

  const P = N.P, main = Y.tithi;
  const hero = main.length ? `<div class="vb-main">
      <div class="vb-main-k">🎂 Your Vedic Birthday in ${y}</div>
      ${main.map(t => `<div class="vb-main-d ${vbDays(t.day) === 0 ? 'today' : ''}"><b>${vbLong(t.day)}</b><span class="vb-rel">${vbRel(t.day)}</span></div>`).join('')}
      <div class="vb-main-why"><span>🌙</span><p><b>${PN_MASA[N.masaIdx]} ${P.tithi.paksha} ${P.tithi.name}</b> — the day your birth Tithi comes back in your birth lunar month. This is the traditional Hindu birthday; your Gregorian date does not apply.</p></div>
      <div class="vb-main-g">${vbGreg(main[0].day, y)}</div>
      <div id="vbHeroNext"></div>
    </div>` : `<div class="vb-main"><div class="vb-main-k">🎂 Your Vedic Birthday in ${y}</div><div class="vb-main-why"><span>🌙</span><p>Your birth Tithi in ${PN_MASA[N.masaIdx]} does not fall inside calendar year ${y} — try the previous or next year.</p></div></div>`;
  return `${hero}
    <div id="vbNext"></div>
    <div class="vb-sec"><h5>${y} at a glance</h5>${bar}</div>
    <div class="vb-sec"><h5>All the ways to mark your day <span>the first is your main Vedic birthday</span></h5></div>
    <div class="vb-cards">
      <div class="vb-card main" style="--pc:${VB_COL.tithi}"><div class="vb-badge">★ Your Vedic birthday</div><div class="vb-ch"><span>🌙</span><div><b>Tithi Birthday</b><small>Janma Tithi · the traditional Hindu birthday</small></div></div>${tCards}</div>
      <div class="vb-card" style="--pc:${VB_COL.nak}"><div class="vb-badge soft">Also observed</div><div class="vb-ch"><span>★</span><div><b>Nakshatra Birthday</b><small>Moon returns to your birth star, in your birth month</small></div></div>${nCards}</div>
      <div class="vb-card" style="--pc:${VB_COL.solar}"><div class="vb-badge soft">Also observed</div><div class="vb-ch"><span>☀</span><div><b>Solar Return</b><small>Surya Varsha · Sun back at its birth degree</small></div></div>${sCard}</div>
    </div>
    <details class="sb-note vb-det"><summary>All ${Y.nak.length} Janma Nakshatra days in ${y}</summary><p>Your Moon passes through ${NAKSHATRAS[N.nak].name} about every 27 days. Many families also mark the star day each month.</p><div class="vb-nlist">${nakAll}</div></details>
    <div class="vb-actions"><button type="button" class="export-download-btn export-ghost" data-vb-decade>📆 Show next 10 years</button><button type="button" class="export-download-btn export-ghost" data-vb-copy>📋 Copy ${y} dates</button></div>
    <div id="vbDecade"></div>
    <div class="pn-note">Tithi and Nakshatra birthdays are observed on the day the Tithi or star is present at sunrise at your birth place; the lunar month is Amanta, and Adhika (leap) months are skipped. The Solar Return uses the sidereal Sun (Lahiri) in the birth-place time zone, so it can fall a day away from your Gregorian birthday. Reliable for 1900–2100.</div>`;
}
function vbNextUp(){
  const box = document.getElementById('vbNext'); if (!box || !VB) return;
  setTimeout(() => {
    let ev = [];
    [VB.today.y, VB.today.y + 1].forEach(y => { try { const Y = vbGet(y);
      Y.tithi.forEach(t => ev.push(['Tithi birthday', VB_COL.tithi, '🌙', t.day])); Y.nak.filter(x => x.birthMonth).forEach(t => ev.push(['Nakshatra birthday', VB_COL.nak, '★', t.day]));
      if (Y.solar) ev.push(['Solar return', VB_COL.solar, '☀', Y.solar.day]); } catch(e){} });
    ev = ev.filter(e => vbDays(e[3]) >= 0).sort((a, b) => vbDays(a[3]) - vbDays(b[3]));
    const hn = document.getElementById('vbHeroNext');
    if (hn && VB.last && VB.last.y === VB.today.y){
      const cur = VB.last.tithi.filter(t => vbDays(t.day) >= 0)[0];
      let nx = cur ? null : (vbGet(VB.today.y + 1).tithi[0] || null);
      if (nx) hn.innerHTML = `<div class="vb-main-next">Next Vedic birthday: <b>${vbLong(nx.day)}</b> <em>${vbRel(nx.day)}</em></div>`;
    }
    const el = document.getElementById('vbNext'); if (!el) return;
    el.innerHTML = ev.length ? `<div class="vb-next"><small>Coming up next</small><div>${ev.slice(0, 3).map(e => `<span style="--pc:${e[1]}">${e[2]} <b>${e[0]}</b> ${vbLong(e[3])} <em>${vbRel(e[3])}</em></span>`).join('')}</div></div>` : '';
  }, 30);
}
function vbSetYear(y){
  y = parseInt(y); if (isNaN(y)) return;
  if (y < VB_MIN || y > VB_MAX){ APP.toast(`Please choose a year between ${VB_MIN} and ${VB_MAX}.`, 'error'); y = Math.min(VB_MAX, Math.max(VB_MIN, y)); }
  VB.y = y; const inp = document.getElementById('vbYear'); if (inp) inp.value = y; vbRender();
}
async function vbDecade(){
  const box = document.getElementById('vbDecade'); if (!box) return;
  const y0 = VB.y, rows = [];
  for (let i = 0; i < 10 && y0 + i <= VB_MAX; i++){
    box.innerHTML = `<div class="vb-loading"><i></i> Calculating ${y0 + i}…</div>`; await new Promise(r => setTimeout(r, 15));
    const Y = vbGet(y0 + i), nb = Y.nak.filter(x => x.birthMonth);
    rows.push(`<div class="vb-row"><b>${Y.y}</b><span style="--pc:${VB_COL.tithi}">${Y.tithi.map(t => vbShort(t.day)).join(' · ') || '—'}</span><span style="--pc:${VB_COL.nak}">${nb.map(t => vbShort(t.day)).join(' · ') || '—'}</span><span style="--pc:${VB_COL.solar}">${Y.solar ? vbShort(Y.solar.day) + ' ' + Y.solar.time : '—'}</span></div>`);
  }
  box.innerHTML = `<div class="vb-table"><div class="vb-row head"><b>Year</b><span>🌙 Tithi</span><span>★ Nakshatra</span><span>☀ Solar return</span></div>${rows.join('')}</div>`;
}
document.addEventListener('click', (e) => {
  if (!VB) return;
  const st = e.target.closest('[data-vb-step]'); if (st){ vbSetYear(VB.y + parseInt(st.dataset.vbStep)); return; }
  if (e.target.closest('[data-vb-this]')){ vbSetYear(VB.today.y); return; }
  if (e.target.closest('[data-vb-decade]')){ vbDecade(); return; }
  if (e.target.closest('[data-vb-copy]') && VB.last){
    const Y = VB.last, N = VB.N, nb = Y.nak.filter(x => x.birthMonth);
    const txt = [`Vedic birthday dates for ${Y.y}`, `Born under: ${PN_MASA[N.masaIdx]} ${N.P.tithi.paksha} ${N.P.tithi.name}, ${NAKSHATRAS[N.nak].name}`,
      `Tithi birthday: ${Y.tithi.map(t => vbLong(t.day)).join(' / ') || '—'}`, `Nakshatra birthday: ${nb.map(t => vbLong(t.day)).join(' / ') || '—'}`,
      `Solar return: ${Y.solar ? vbLong(Y.solar.day) + ' ' + Y.solar.time : '—'}`].join('\n');
    APP.copy(txt).then(ok => APP.toast(ok ? 'Dates copied ✓' : 'Could not copy', ok ? 'success' : 'error'));
  }
});
document.addEventListener('change', (e) => { if (VB && e.target.id === 'vbYear') vbSetYear(e.target.value); });
document.addEventListener('keydown', (e) => { if (VB && e.target.id === 'vbYear' && e.key === 'Enter') vbSetYear(e.target.value); });


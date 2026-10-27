/* DATE ENTRY for old and BC dates: type Day, Month, Year and AD/BC yourself (the date lists only reach back to 1900).
   Sets window.__dobExt (the date string the app uses everywhere: parseDob / formatDobStr in js/03) while the panel is open.
   inDobValue() is what the form reads. Dates before 15 Oct 1582 are Julian-calendar dates; BC years are entered the everyday way (1 BC is year 0 inside). */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const st = { on: false, ext: '', era: 'AD' };
  window.inDobValue = () => st.on ? (st.ext || '') : (($('dobInput') || {}).value || '');
  const isGreg = (y, m, d) => y > 1582 || (y === 1582 && (m > 10 || (m === 10 && d >= 15)));
  function dim(y, m) { const leapJ = ((y % 4) + 4) % 4 === 0, leapG = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0, leap = y > 1582 || (y === 1582 && m >= 10) ? leapG : leapJ; return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  function check(d, m, yNum, era) {
    if (!(d >= 1 && m >= 1 && yNum >= 1)) return { ok: false, empty: true };
    const y = era === 'BC' ? 1 - yNum : yNum;
    if (era === 'BC' && yNum > 4713) return { ok: false, msg: 'The calculations start at 4713 BC. Please use a later year.' };
    if (era === 'AD' && yNum > 9999) return { ok: false, msg: 'The latest year is 9999.' };
    if (y === 1582 && m === 10 && d >= 5 && d <= 14) return { ok: false, msg: 'These days do not exist: the calendar jumped from 4 October to 15 October 1582.' };
    if (d > dim(y, m)) return { ok: false, msg: `${MONTHS[m - 1]} ${era === 'BC' ? yNum + ' BC' : yNum} has only ${dim(y, m)} days${isGreg(y, m, d) ? '' : ' (old Julian calendar)'}.` };
    return { ok: true, y, str: formatDobStr(y, m, d), julian: !isGreg(y, m, d) };
  }
  function notes(r, era, yNum) {
    const y = r.y, L = [];
    if (r.julian) L.push('📜 This date is read in the <b>Julian calendar</b>, the one in use at that time.');
    if (era === 'BC') L.push('🗓️ BC years are entered the everyday way: 1 BC is the year just before 1 AD.');
    const far = y < 1000 || y > 3000, mid = !far && (y < 1800 || y > 2200);
    if (far) L.push('⚠️ <b>Approximate.</b> The planet calculations are built for modern dates. Treat the Moon sign, the nakshatra and the ascendant as a rough guide for a date this far from today.');
    else if (mid) L.push('ℹ️ Positions this far from today are a little less exact. Check anything that sits near the edge of a sign or a star.');
    if (y < 1900) L.push('🕰️ Before about 1900 people used <b>local sun time</b>, not time zones. If that is what you know, use the button below.');
    return L;
  }
  function refresh() {
    const note = $('oNote'); if (!note) return;
    const d = +$('oDay').value, m = +$('oMon').value, yN = +$('oYear').value, c = check(d, m, yN, st.era);
    ['oDay', 'oMon', 'oYear'].forEach(i => $(i).classList.toggle('ok', !!$(i).value));
    if (c.ok) { st.ext = c.str; note.innerHTML = notes(c, st.era, yN).map(x => `<p>${x}</p>`).join(''); }
    else { st.ext = ''; note.innerHTML = c.msg ? `<p class="bad">${c.msg}</p>` : ''; }
    $('oLmt').hidden = !(c.ok && c.y < 1900);
    try { if (typeof inUpdate === 'function') inUpdate(); } catch (e) {}
  }
  function setOn(on) {
    st.on = !!on; const box = $('inOld'), lists = $('inDay') && $('inDay').closest('.in-row3'), btn = $('inOldBtn');
    if (!box) return;
    box.hidden = !on; if (lists) lists.hidden = on; $('inBadDate').hidden = true;
    btn.innerHTML = on ? '← Use the date lists instead' : '📜 Born before 1900, or in the BC era? Type the date yourself';
    if (on) { const dob = $('dobInput'); if (dob && dob.value) { dob.value = ''; } st.ext = ''; refresh(); }
    else { st.ext = ''; try { if (typeof inUpdate === 'function') inUpdate(); } catch (e) {} }
  }
  function build() {
    const bad = $('inBadDate'); if (!bad || $('inOld')) return !!$('inOld');
    const wrap = document.createElement('div'); wrap.className = 'in-oldwrap';
    wrap.innerHTML = `<button type="button" class="in-oldbtn" id="inOldBtn">📜 Born before 1900, or in the BC era? Type the date yourself</button>
      <div class="in-old" id="inOld" hidden>
        <div class="in-q">📜 Type the date</div>
        <div class="in-row3 o"><input type="number" id="oDay" min="1" max="31" inputmode="numeric" placeholder="Day" aria-label="Day"><select id="oMon" aria-label="Month"><option value="">Month</option>${MONTHS.map((x, i) => `<option value="${i + 1}">${x}</option>`).join('')}</select><input type="number" id="oYear" min="1" max="9999" inputmode="numeric" placeholder="Year" aria-label="Year"></div>
        <div class="in-ampm in-era" id="oEra" role="group" aria-label="Era"><button type="button" data-era="AD" class="on">AD (CE)</button><button type="button" data-era="BC">BC (BCE)</button></div>
        <div class="in-oldnote" id="oNote" aria-live="polite"></div>
        <button type="button" class="in-oldbtn lmt" id="oLmt" hidden>🕰️ Use local mean time for the birthplace</button>
      </div>`;
    bad.parentNode.insertBefore(wrap, bad.nextSibling);
    $('inOldBtn').addEventListener('click', () => setOn(!st.on));
    ['oDay', 'oYear'].forEach(i => $(i).addEventListener('input', e => { e.stopPropagation(); refresh(); }));
    $('oMon').addEventListener('change', refresh);
    $('oEra').addEventListener('click', e => { const b = e.target.closest('[data-era]'); if (!b) return; st.era = b.dataset.era; $('oEra').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); refresh(); });
    $('oLmt').addEventListener('click', () => {
      const lon = typeof selectedLon === 'number' ? selectedLon : null, note = $('oNote');
      if (lon === null || isNaN(lon)) { note.innerHTML += '<p class="bad">Pick the birthplace first (step 3), then tap this button again.</p>'; return; }
      const sel = $('tzInput'), v = (lon / 15).toFixed(4), h = lon / 15, a = Math.abs(h), hh = Math.floor(a), mm = Math.round((a - hh) * 60);
      let opt = [...sel.options].find(o => o.dataset.lmt); if (!opt) { opt = document.createElement('option'); opt.dataset.lmt = '1'; sel.appendChild(opt); }
      opt.value = v; opt.textContent = `UTC${h < 0 ? '-' : '+'}${hh}:${String(mm).padStart(2, '0')} (local mean time)`; sel.value = v;
      sel.dispatchEvent(new Event('change', { bubbles: true })); note.innerHTML += `<p>✓ Time zone set to local mean time: ${opt.textContent}.</p>`;
    });
    const f = $('birthForm'); if (f) f.addEventListener('reset', () => setTimeout(() => { ['oDay', 'oMon', 'oYear'].forEach(i => { $(i).value = ''; $(i).classList.remove('ok'); }); st.era = 'AD'; $('oEra').querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.era === 'AD')); $('oNote').innerHTML = ''; setOn(false); }, 0));
    return true;
  }
  /* a saved or shared date that the date lists cannot hold (BC, or before the 1583 calendar change) opens the typing panel */
  window.inLoadDob = function (dobStr) {
    if (!build()) return; const p = parseDob(dobStr);
    if (!isNaN(p.y) && p.y < 1583) {
      if (!st.on) setOn(true);
      st.era = p.y <= 0 ? 'BC' : 'AD'; $('oEra').querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.era === st.era));
      $('oDay').value = p.d; $('oMon').value = p.m; $('oYear').value = p.y <= 0 ? 1 - p.y : p.y; refresh();
    } else if (st.on) setOn(false);
  };
  let tries = 0; (function init() { if (!build() && ++tries < 40) setTimeout(init, 100); })();
})();

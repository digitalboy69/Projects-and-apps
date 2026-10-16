/* ===== UI overhaul glue: floating profile button, search pill label, avatar initial, profile sheet hero ===== */
(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const USER_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.9-3.7 3.7-5.6 7.2-5.6s6.3 1.9 7.2 5.6"/></svg>';
  const initial = n => ((n||'').trim().charAt(0) || '').toUpperCase();
  const profs = () => { try { return loadProfiles(); } catch(e){ return []; } };
  function activeProfile(){
    const sel = $('profileSelect'), l = profs(), i = sel && sel.value !== '' ? +sel.value : -1;
    if (i >= 0 && l[i]) return { p:l[i], i };
    const cur = window.__vgProf; if (cur && cur.name) return { p:cur, i:l.findIndex(x=>x.name===cur.name&&x.dob===cur.dob&&x.tob===cur.tob) };
    return null;
  }
  // floating profile button (input page)
  const fab = document.createElement('button');
  fab.type = 'button'; fab.id = 'vxFab'; fab.className = 'vx-fab'; fab.setAttribute('aria-label','Profile'); fab.innerHTML = USER_SVG;
  fab.addEventListener('click', () => $('openMenuBtn').click());
  document.body.appendChild(fab);
  // search pill text
  const lbl = document.querySelector('#quickSearchBtn .btn-label');
  if (lbl) lbl.textContent = 'Search tools, planets, terms…';
  // avatar initial / person icon in header + fab
  function paintAvatar(){
    const a = activeProfile(), ch = a ? initial(a.p.name) : '';
    const ico = document.querySelector('#openMenuBtn .menu-ico');
    if (ico){ if (ch) { if (ico.textContent !== ch) ico.textContent = ch; } else if (!ico.querySelector('svg')) ico.innerHTML = USER_SVG; }
    if (ch) { if (fab.textContent !== ch) fab.textContent = ch; } else if (!fab.querySelector('svg')) fab.innerHTML = USER_SVG;
  }
  paintAvatar(); setInterval(paintAvatar, 1500);
  // profile sheet
  const box = document.querySelector('#mainMenuModal .menu-modal-box');
  const sheet = document.createElement('div'); sheet.className = 'vx-sheet';
  if (box){
    [...box.children].forEach(c => { if (!c.classList.contains('pd-modal-close')) sheet.appendChild(c); });
    box.appendChild(sheet);
  }
  const fd = d => { try { return new Date(d+'T00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); } catch(e){ return d||''; } };
  function paintHero(){
    if (!box) return;
    let hero = $('vxProfHero');
    if (!hero){ hero = document.createElement('div'); hero.id = 'vxProfHero'; hero.className = 'vx-ph'; sheet.insertBefore(hero, sheet.firstChild); }
    const a = activeProfile(), ch = (typeof currentChartForModal !== 'undefined') ? currentChartForModal : null;
    if (!a){ hero.innerHTML = `<div class="vx-av guest">${USER_SVG}</div><h3>Your profiles</h3><p>Save a chart to see it here. Sign in below to keep them on every device.</p>`; return; }
    const p = a.p; let facts = '';
    try {
      if (ch){ const asc = SIGNS[ch.ascendant.sign], mo = ch.planets.Moon, su = ch.planets.Sun;
        facts = `<div class="vx-facts"><span><small>Rising</small>${asc.symbol}︎ ${asc.name}</span><span><small>Moon</small>${SIGNS[mo.sign].symbol}︎ ${SIGNS[mo.sign].name}</span><span><small>Sun</small>${SIGNS[su.sign].symbol}︎ ${SIGNS[su.sign].name}</span><span><small>Star</small>${escapeHtml(mo.nakshatra.name)}</span></div>`; }
    } catch(e){}
    const place = String(p.place||'').split(',')[0];
    hero.innerHTML = `<div class="vx-av">${escapeHtml(initial(p.name)||'✦')}</div><h3>${escapeHtml(p.name||'Your chart')}</h3><p>${fd(p.dob)}${p.tob?' · '+escapeHtml(String(p.tob).slice(0,5)):''}${place?' · '+escapeHtml(place):''}</p>${facts}
      <div class="vx-quick">${a.i>=0?'<button type="button" data-vx="edit">Edit</button><button type="button" data-vx="share">Share</button>':''}<button type="button" data-vx="report">Report</button></div>`;
    hero.dataset.i = a.i;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#vxProfHero [data-vx]'); if (!b) return;
    const i = +$('vxProfHero').dataset.i, k = b.dataset.vx;
    if (k === 'edit' && typeof openProfEdit === 'function') openProfEdit(i);
    else if (k === 'share'){ const s = document.querySelector(`[data-prof-share="${i}"]`); if (s) s.click(); }
    else if (k === 'report'){ const r = $('exportReportBtn'); if (r) r.click(); }
  });
  $('openMenuBtn').addEventListener('click', () => setTimeout(paintHero, 0));
  if (typeof renderProfileCards === 'function'){ const o = renderProfileCards; renderProfileCards = function(){ o.apply(this, arguments); paintHero(); paintAvatar(); }; }
  paintHero();
})();

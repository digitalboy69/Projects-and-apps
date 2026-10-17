/* ============================================================================
   POPULAR CHARTS (input page, below the 3-step form). Data: js/85-popular-charts-data.js. Styles: css/38-popular-charts.css.
   Tap a person -> detail sheet -> "Show this chart" fills the form with their birth data and casts it, exactly like opening a
   shared link (loadProfileIntoForm + submit). Like any cast chart it is saved in "Welcome back" (delete it from the profile list).
   Photos come from Wikipedia's REST summary API at runtime; if one is missing/wrong the card keeps the initials.
   ============================================================================ */
(function(){
'use strict';
const host = document.getElementById('popCharts');
if (!host || typeof PC_PEOPLE === 'undefined') return;

const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = d => { const a = d.split('-'); return +a[2] + ' ' + MON[+a[1]-1] + ' ' + a[0]; };
const initials = n => { const w = n.replace(/[^\p{L}\s]/gu,'').split(/\s+/).filter(Boolean); return (w[0]||'')[0] + (w.length>1 ? w[w.length-1][0] : ''); };
const signs = a => a.join(' or ');
const wikiUrl = p => 'https://en.wikipedia.org/wiki/' + encodeURIComponent(p.wiki);
let cur = PC_CATS[0][0], sheet = null;

/* ---------- photos (lazy, cached, 4 at a time) ---------- */
const imgCache = {}, queue = []; let active = 0;
const strip = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function fetchImg(p){
  if (imgCache[p.wiki] !== undefined) return Promise.resolve(imgCache[p.wiki]);
  return fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(p.wiki))
    .then(r => r.ok ? r.json() : null).then(j => {
      let url = null;
      if (j && j.type === 'standard' && j.thumbnail && j.thumbnail.source){
        // safety: the page must really be about this person (a name token of 4+ letters appears in its title/summary)
        const hay = strip((j.title||'') + ' ' + (j.extract||'')), toks = strip(p.name).split(/[^a-z]+/).filter(t => t.length >= 4);
        if (!toks.length || toks.some(t => hay.includes(t))) url = j.thumbnail.source;
      }
      return (imgCache[p.wiki] = url);
    }).catch(() => (imgCache[p.wiki] = null));
}
function loadInto(p, box){ queue.push({p, box}); pump(); }
function pump(){
  while (active < 4 && queue.length){
    const job = queue.shift(); active++;
    fetchImg(job.p).then(url => {
      if (url && document.body.contains(job.box)){
        const im = new Image(); im.alt = ''; im.referrerPolicy = 'no-referrer'; im.decoding = 'async';
        im.onload = () => { im.className = 'ok'; }; im.src = url; job.box.appendChild(im);
      }
    }).then(() => { active--; pump(); });
  }
}

/* ---------- gallery ---------- */
const posLine = p => '☉ ' + signs(p.sun) + ' · ☽ ' + signs(p.moon);
const cardHtml = (p, i) => `<button type="button" class="pc-card" data-i="${i}"><div class="pc-av" data-w="${i}">${esc(initials(p.name))}</div>` +
  `<div class="pc-n">${esc(p.name)}</div><div class="pc-d">${esc(p.desc)}</div><div class="pc-p">${esc(posLine(p))}</div></button>`;
function render(){
  const list = PC_PEOPLE.filter(p => p.cat === cur);
  const row = document.getElementById('pcRow');
  row.innerHTML = list.map(p => cardHtml(p, PC_PEOPLE.indexOf(p))).join(''); row.scrollLeft = 0;
  document.querySelectorAll('#pcChips .pc-chip').forEach(c => c.classList.toggle('on', c.dataset.c === cur));
  row.querySelectorAll('.pc-av').forEach(box => loadInto(PC_PEOPLE[+box.dataset.w], box));
}
host.innerHTML =
  '<div class="pc-h"><div class="pc-k">POPULAR CHARTS</div><div class="pc-t">See how the famous are placed</div>' +
  '<p class="pc-s">100 well-known people in 10 groups, shown in the Vedic (Lahiri) zodiac. Tap anyone for details, or open their full chart right here.</p></div>' +
  '<div class="pc-chips" id="pcChips" role="tablist">' + PC_CATS.map(c => `<button type="button" role="tab" class="pc-chip" data-c="${c[0]}">${c[1]} ${esc(c[2])}</button>`).join('') + '</div>' +
  '<div class="pc-row" id="pcRow"></div>' +
  '<p class="pc-note">Birth dates are public records. Most birth times were never recorded, so a sign shown as “A or B” means it changed during that day. Photos come from Wikipedia.</p>';

/* ---------- detail sheet + cast ---------- */
function closeSheet(){ if (sheet){ sheet.remove(); sheet = null; document.removeEventListener('keydown', onKey); } }
function onKey(e){ if (e.key === 'Escape') closeSheet(); }

// The timezone list only has today's standard offsets. Old births (local mean time) need their own entry, otherwise the
// previous selection would silently stay and the chart would be cast in the wrong zone.
function ensureTzOption(tz){
  const sel = document.getElementById('tzInput');
  sel.querySelectorAll('option[data-pc]').forEach(o => o.remove());
  if (![...sel.options].some(o => parseFloat(o.value) === tz)){
    const o = document.createElement('option'); o.value = tz; o.dataset.pc = '1';
    o.textContent = (typeof fmtTz === 'function' ? fmtTz(tz) : 'UTC' + tz) + ' (local mean time)'; sel.appendChild(o);
  }
}
function cast(p){
  const prof = { name: p.name.slice(0,40), dob: p.dob, tob: p.tob || '12:00', place: p.place, lat: +p.lat, lon: +p.lon, tz: +p.tz };
  closeSheet(); ensureTzOption(prof.tz); loadProfileIntoForm(prof);
  const f = document.getElementById('birthForm');
  f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit', {cancelable:true}));
}
function openSheet(i){
  const p = PC_PEOPLE[i]; closeSheet();
  const timed = !!p.tob;
  const rows = [['Born', fmtDate(p.dob) + (timed ? ', ' + p.tob : '')], ['Place', p.place], ['Sun sign', signs(p.sun)], ['Moon sign', signs(p.moon)]];
  if (p.nak) rows.push(['Moon nakshatra', p.nak]);
  rows.push(['Rising sign', p.lagna || (timed ? 'Too close to a sign edge' : 'Needs a birth time')]);
  const why = timed ? 'Birth time is documented, so the full chart can be cast.' :
    'No reliable birth time is recorded. The chart opens as a noon chart, so the Moon and Rising sign are approximate.';
  const bg = document.createElement('div'); bg.className = 'pc-bg'; bg.setAttribute('role','dialog'); bg.setAttribute('aria-modal','true'); bg.setAttribute('aria-label', p.name);
  bg.innerHTML = `<div class="pc-sheet"><button type="button" class="pc-x" aria-label="Close">✕</button>` +
    `<div class="pc-av">${esc(initials(p.name))}</div><h3>${esc(p.name)}</h3><div class="pc-sd">${esc(p.desc)}</div>` +
    `<div class="pc-tb">${rows.map(r => `<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')}</div>` +
    `<p class="pc-w">${esc(why)}</p><button type="button" class="pc-go">✨ Show this chart</button>` +
    `<a class="pc-src" href="${wikiUrl(p)}" target="_blank" rel="noopener noreferrer">Read about ${esc(p.name)} on Wikipedia ↗</a></div>`;
  document.body.appendChild(bg); sheet = bg;
  loadInto(p, bg.querySelector('.pc-av'));
  bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('.pc-x')) closeSheet(); });
  bg.querySelector('.pc-go').addEventListener('click', () => cast(p));
  document.addEventListener('keydown', onKey);
}

host.addEventListener('click', e => {
  const chip = e.target.closest('.pc-chip'); if (chip){ cur = chip.dataset.c; render(); return; }
  const card = e.target.closest('.pc-card'); if (card) openSheet(+card.dataset.i);
});

// photos are only requested when the gallery scrolls near the screen (the input page is long; most visitors never get here)
let started = false;
function start(){ if (started) return; started = true; render(); }
if ('IntersectionObserver' in window){
  new IntersectionObserver((en, ob) => { if (en.some(x => x.isIntersecting)){ ob.disconnect(); start(); } }, {rootMargin:'400px'}).observe(host);
} else start();
})();

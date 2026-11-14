/* Sky alerts (js/62, global SKA): under the Rising and Moon lines in the 3D Sky HUD, a small pill counts the planets sitting in the trine (1-5-9), square (4-10) and opposite (7) houses
   counted from the Rising sign and from the Moon sign; tap it for the full list. Also: planets on the Rising / Moon sign itself, the Rahu-Ketu axis on them, Jupiter's and Saturn's
   favourable or hard houses from the Moon, Sade Sati, and the Jupiter + Saturn "double transit".
   Sources: Wikipedia "Trikonasthanas" (1-5-9 are the Lakshmi / Dharma trikona; benefics are strengthened there, natural malefics tend to spoil it; kendras are 1-4-7-10; nodes in kendras are painful);
   Dekho Panchang "Gochar" (from the Moon Jupiter is favourable in 2-5-7-9-11 and hard in 3-6-8-10-12, Saturn is favourable in 3-6-11, Sade Sati = Saturn in 12th, 1st, 2nd from the Moon,
   Jupiter + Saturn both aspecting a house = double transit, Rahu-Ketu on the 1st-7th axis reshapes identity and relationships); aspects use ASPECT_OFFSETS (js/03).
   Tendency wording only: these are teaching alerts, not verdicts. Two views: "Sky now" (live Rising + the Moon in the sky) and "For you" (your birth Rising and Moon, when a profile is loaded).
   SKA.calc(sidereal, risingSign, moonSign) is pure (no DOM) so it can be tested. Hidden in the Navamsha sky (it reads the real sky). */
const SKA = (() => {
  'use strict';
  const PL = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const BEN = ['Jupiter', 'Venus', 'Mercury', 'Moon'];
  const AREA = { 1: 'self and body', 4: 'home, mother and property', 5: 'mind, learning and children', 7: 'partnerships and marriage', 9: 'fortune, faith and father', 10: 'career and public life' };
  const SHAPE = { 5: 'tri', 9: 'tri', 4: 'sq', 10: 'sq', 7: 'opp' };
  const hs = (from, to) => ((to - from + 12) % 12) + 1;
  const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));
  const sign = l => Math.floor(((l % 360) + 360) % 360 / 30);
  const G = n => (typeof PLANET_GLYPHS !== 'undefined' && PLANET_GLYPHS[n]) || '';
  const SN = i => (typeof SIGNS !== 'undefined' && SIGNS[i]) ? SIGNS[i].name : String(i);
  const MAL_NOTE = {
    '5:Mars': 'Mars in the 5th is said to strain the home, children and health',
    '5:Saturn': 'Saturn in the 5th is said to bring slow, heavy results through mind and children',
    '5:Sun': 'the Sun in the 5th is said to bring impatience and less peace at home',
    '5:Rahu': 'Rahu in the 5th can cloud judgement and learning',
    '5:Ketu': 'Ketu in the 5th leans the mind toward spirituality and detachment',
    '9:Mars': 'Mars in the 9th is said to give power and generosity',
    '9:Saturn': 'Saturn in the 9th is said to bring a lonely or delayed path to luck',
    '9:Sun': 'the Sun in the 9th is said to bring friction with the spouse',
    '9:Rahu': 'Rahu in the 9th can bring fame and wealth, but a hard-edged outlook',
    '9:Ketu': 'Ketu in the 9th leans toward detachment from luck and tradition'
  };
  const SHAPE_LBL = { tri: 'Trine', sq: 'Square', opp: 'Opposite' };
  const SHAPE_SYM = { tri: '△', sq: '□', opp: '☍' };

  function calc(sid, riseSign, moonSign) {
    const out = [], pSign = {}; PL.forEach(n => { pSign[n] = sign(sid[n]); });
    const refs = [{ k: 'Rising', s: riseSign }, { k: 'Moon', s: moonSign }].filter(r => r.s != null);
    refs.forEach(r => PL.forEach(n => {
      if (r.k === 'Moon' && n === 'Moon') return;
      const h = hs(r.s, pSign[n]), good = BEN.includes(n), shape = SHAPE[h];
      if (h === 1) {
        const tone = good ? 'good' : (n === 'Rahu' || n === 'Ketu') ? 'care' : 'info';
        out.push({ g: 'one', ref: r.k, h, n, tone, t: `${G(n)} ${n} on your ${r.k} sign (${SN(r.s)})`, x: good ? `${n} sitting on the ${r.k} sign lends it ease and support` : (tone === 'care' ? `${n} on the ${r.k} sign tends to colour the self and mind with restlessness or unusual pull` : `${n} on the ${r.k} sign brings its energy straight into the self`) });
      } else if (shape) {
        const note = shape === 'tri' && !good ? MAL_NOTE[h + ':' + n] : '';
        const x = good ? `${n} is a natural benefic, so the ${ord(h)} from ${r.k} (${AREA[h]}) tends to be supported` : (shape === 'tri' ? (note ? note.charAt(0).toUpperCase() + note.slice(1) : `${n} is a natural malefic in the ${ord(h)} (${AREA[h]}); go steady here`) : ((n === 'Rahu' || n === 'Ketu') ? `A node in the ${ord(h)} (${AREA[h]}) is classically uncomfortable; it can feel pressured there` : `${n} presses on the ${ord(h)} from ${r.k} (${AREA[h]}); expect friction or hard work there`));
        out.push({ g: shape, ref: r.k, h, n, tone: good ? 'good' : (shape === 'tri' && (h + ':' + n === '9:Mars' || h + ':' + n === '5:Ketu')) ? 'info' : 'care', t: `${G(n)} ${n} in the ${ord(h)} from ${r.k}`, x });
      }
    }));
    // special alerts (from the Moon / Rising)
    const mh = n => hs(moonSign, pSign[n]), rh = n => hs(riseSign, pSign[n]);
    if (moonSign != null) {
      const jh = mh('Jupiter'), sh = mh('Saturn');
      if ([2, 7, 11].includes(jh)) out.push({ g: 'sp', ref: 'Moon', n: 'Jupiter', tone: 'good', t: `♃ Jupiter in a favourable house (${ord(jh)}) from the Moon`, x: 'Jupiter transits the 2nd, 5th, 7th, 9th and 11th from the Moon are the classically good ones' });
      if ([3, 6, 8, 10, 12].includes(jh)) out.push({ g: 'sp', ref: 'Moon', n: 'Jupiter', tone: 'info', t: `♃ Jupiter in a harder house (${ord(jh)}) from the Moon`, x: 'The 3rd, 6th, 8th, 10th and 12th from the Moon are the classically mixed houses for Jupiter; help comes with effort' });
      if (sh === 12 || sh === 1 || sh === 2) out.push({ g: 'sp', ref: 'Moon', n: 'Saturn', tone: 'care', t: `♄ Sade Sati (${sh === 12 ? 'rising phase' : sh === 1 ? 'peak phase' : 'setting phase'})`, x: 'Saturn is in the 12th, 1st or 2nd from the Moon: a long stretch that tends to test the mind, routines and patience' });
      else if ([3, 6, 11].includes(sh)) out.push({ g: 'sp', ref: 'Moon', n: 'Saturn', tone: 'good', t: `♄ Saturn in a favourable house (${ord(sh)}) from the Moon`, x: 'Saturn in the 3rd, 6th or 11th from the Moon is the classically helpful placement: effort pays off' });
      else if (sh === 4 || sh === 8) out.push({ g: 'sp', ref: 'Moon', n: 'Saturn', tone: 'care', t: `♄ Saturn in the ${ord(sh)} from the Moon`, x: 'Saturn in the 4th or 8th from the Moon is traditionally a heavier period for comfort and change' });
      const rm = mh('Rahu');
      if (rm === 1 || rm === 7) out.push({ g: 'sp', ref: 'Moon', n: 'Rahu', tone: 'care', t: `☊☋ Rahu-Ketu axis over the Moon`, x: 'The nodes cross the Moon sign and its opposite: identity, moods and one-to-one bonds can feel reshaped' });
    }
    const rr = hs(riseSign, pSign.Rahu);
    if (rr === 1 || rr === 7) out.push({ g: 'sp', ref: 'Rising', n: 'Rahu', tone: 'care', t: '☊☋ Rahu-Ketu axis over the Rising sign', x: 'The nodes cross the 1st-7th axis: sense of self and relationships tend to be reshaped' });
    // double transit: Jupiter and Saturn both aspect (or sit in) the same house from Rising
    [4, 5, 7, 10].forEach(H => {
      const tgt = (riseSign + H - 1) % 12, hits = n => { const f = pSign[n]; return f === tgt || ASPECT_OFFSETS[n].some(o => (f + o - 1) % 12 === tgt); };
      if (hits('Jupiter') && hits('Saturn')) out.push({ g: 'sp', ref: 'Rising', n: 'Jupiter', tone: 'info', t: `♃♄ Double transit on the ${ord(H)} (${SN(tgt)})`, x: `Jupiter and Saturn both touch the ${ord(H)} house (${AREA[H]}); matters here can move, if the running dasha also supports them` });
    });
    return out;
  }
  const counts = a => ({ tri: a.filter(x => x.g === 'tri').length, sq: a.filter(x => x.g === 'sq').length, opp: a.filter(x => x.g === 'opp').length, care: a.filter(x => x.tone === 'care').length, good: a.filter(x => x.tone === 'good').length, all: a.length });

  /* ---- UI ---- */
  const $ = id => document.getElementById(id), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let mode = 'sky', last = { sky: [], you: null }, lastKey = '', open = false;
  function refs(snap, who) {
    const sid = snap.raw || snap.sidereal;
    if (who === 'sky') { const L = getLiveLoc(); return { sid, rise: sign(siderealAscendant(snap.jd, L.lat, L.lon)), moon: sign(sid.Moon), label: 'Live Rising and the Moon in the sky now' }; }
    const p = (typeof activeNatalProfile !== 'undefined' && isValidProfile(activeNatalProfile)) ? activeNatalProfile : null; if (!p) return null;
    const nat = computeNatalAscendant(p), ns = snapshotPositions(nat.jd).sidereal;
    return { sid, rise: sign(nat.lagnaLon), moon: sign(ns.Moon), label: `Your birth Rising (${SN(sign(nat.lagnaLon))}) and Moon (${SN(sign(ns.Moon))}) against today's planets` };
  }
  function refresh(snap) {
    const pill = $('skaPill'); if (!pill) return;
    if (!snap || snap.nav) { pill.style.display = 'none'; return; }
    let r; try { r = refs(snap, 'sky'); } catch (e) { pill.style.display = 'none'; return; }
    const key = Math.floor(snap.jd * 288) + '|' + r.rise + '|' + r.moon + '|' + mode + '|' + open;
    if (key === lastKey) return; lastKey = key;
    last.sky = calc(r.sid, r.rise, r.moon); const y = refs(snap, 'you'); last.you = y ? calc(y.sid, y.rise, y.moon) : null;
    const c = counts(last.sky); pill.style.display = '';
    pill.innerHTML = `<span class="ska-ic">⚑</span><span class="ska-c" title="Trine houses (1-5-9)">△${c.tri}</span><span class="ska-c" title="Square houses (4-10)">□${c.sq}</span><span class="ska-c" title="Opposite (7th)">☍${c.opp}</span>${c.care ? `<span class="ska-c care">!${c.care}</span>` : ''}`;
    pill.title = 'Sky alerts: planets in the trine, square and opposite houses from the Rising and the Moon. Tap for details.';
    if (open) paint();
  }
  function card(a) { return `<div class="ska-a ${a.tone}"><div class="ska-at">${esc(a.t)}</div><div class="ska-ax">${esc(a.x)}</div></div>`; }
  function paint() {
    const body = $('skaBody'), snap = snapshotPositions(currentJD);
    const hasYou = !!last.you; if (mode === 'you' && !hasYou) mode = 'sky';
    const a = (mode === 'you' ? last.you : last.sky) || [], info = refs(snap, mode);
    $('skaTabs').innerHTML = `<button type="button" data-m="sky" class="${mode === 'sky' ? 'on' : ''}">Sky now</button><button type="button" data-m="you" class="${mode === 'you' ? 'on' : ''}" ${hasYou ? '' : 'disabled title="Load a birth profile to see this"'}>For you</button>`;
    const sec = (title, sym, list, hint) => list.length ? `<section class="ska-s"><h4><i>${sym}</i>${title}<small>${hint}</small></h4>${['Rising', 'Moon'].map(k => { const l = list.filter(x => x.ref === k); return l.length ? `<div class="ska-ref">from ${k}${k === 'Rising' ? ' (Lagna)' : ''}</div>${l.map(card).join('')}` : ''; }).join('')}</section>` : '';
    const cn = counts(a);
    body.innerHTML = `<p class="ska-lead">${esc(info ? info.label : '')}.</p>
      <div class="ska-sum"><span>△ ${cn.tri}</span><span>□ ${cn.sq}</span><span>☍ ${cn.opp}</span><span class="good">${cn.good} supportive</span><span class="care">${cn.care} to watch</span></div>
      ${sec('Trine', '△', a.filter(x => x.g === 'tri'), '1st, 5th, 9th: luck, mind and dharma')}
      ${sec('Square', '□', a.filter(x => x.g === 'sq'), '4th, 10th: home and career pressure points')}
      ${sec('Opposite', '☍', a.filter(x => x.g === 'opp'), '7th: partnerships')}
      ${sec('On the sign itself', '●', a.filter(x => x.g === 'one'), 'planets in the same sign')}
      ${sec('Timing alerts', '✦', a.filter(x => x.g === 'sp'), 'Gochara and double transit')}
      ${a.length ? '' : '<p class="ska-empty">Nothing notable right now.</p>'}
      <p class="ska-foot">Houses are counted by sign from the Rising and from the Moon. Alerts are tendencies drawn from classical rules (Trikonasthanas and Gochar), not predictions; read them with the whole chart and the running dasha.</p>`;
  }
  function setOpen(v) { open = !!v; const s = $('skaSheet'); if (!s) return; s.hidden = !open; document.body.classList.toggle('ska-open', open); if (open) { lastKey = ''; try { refresh(snapshotPositions(currentJD)); } catch (e) { /* ignore */ } paint(); $('skaClose').focus(); } else { const p = $('skaPill'); if (p) p.focus(); } }
  function wire() {
    const pill = $('skaPill'); if (!pill) return;
    pill.addEventListener('click', e => { e.stopPropagation(); setOpen(true); });
    $('skaClose').addEventListener('click', () => setOpen(false));
    $('skaSheet').addEventListener('click', e => { if (e.target.id === 'skaSheet') setOpen(false); const b = e.target.closest('#skaTabs button'); if (b && !b.disabled) { mode = b.dataset.m; paint(); } });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) setOpen(false); });
  }
  const api = { calc, counts, refresh, setOpen, get open() { return open; } };
  window.SKA = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  return api;
})();

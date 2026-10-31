/* ============================================================================
   TODAY FOR YOU (TDY): the day (or any chosen date and time) read from the person's own Moon. Three simple classical checks:
     Chandrabala: where the Moon of the day stands counted from the birth Moon sign. Good: 1,3,6,7,10,11. Not good: 2,4,5,8,9,12. (Muhurta tradition.)
     Tarabala: count from the birth star to the star of the day, remainder of 9: 1 Janma, 2 Sampat, 3 Vipat, 4 Kshema, 5 Pratyak, 6 Sadhana, 7 Naidhana,
               8 Mitra, 9 Parama Mitra. Not good: Vipat, Pratyak, Naidhana. (Same names and rule as the Tara koota in Kundali Matching, js/51.)
     Gochara: each planet of the day counted from the birth Moon, with the houses the tradition calls favourable:
               Sun 3,6,10,11 · Moon 1,3,6,7,10,11 · Mars 3,6,11 · Mercury 2,4,6,8,10,11 · Jupiter 2,5,7,9,11 · Venus 1,2,3,4,5,8,9,11,12 · Saturn 3,6,11 ·
               Rahu and Ketu 3,6,11 (the commonly used list; schools differ). Marked "common practice".
   Plus the day's Panchanga, Rahu Kalam and the good Choghadiya slots, flagged when they overlap Rahu Kalam. The one-line "tone" only counts Chandrabala
   and Tarabala (both good / one / none) and says so. These are traditional markers for planning, not predictions.
   Uses panchangaAt (js/45), getSiderealLongitudeAt (js/03), CHG (js/118), nvTime/nvDate (js/48). API: TDY.compute(chart, profile, jd) -> {...}; TDY.html(...); TDY.text(...)
   ============================================================================ */
const TDY = (function(){
  const CB_GOOD = [1,3,6,7,10,11];
  const TARA = ['Janma','Sampat','Vipat','Kshema','Pratyak','Sadhana','Naidhana','Mitra','Parama Mitra'];
  const TARA_BAD = [3,5,7];
  const TARA_TXT = ['Janma (birth star): take care of health and keep the day simple','Sampat (wealth): good for money and gain','Vipat (danger): obstacles are likelier; avoid new starts','Kshema (well-being): good, steady and safe','Pratyak (obstacle): things may be blocked; avoid new starts','Sadhana (achievement): good for getting things done','Naidhana (loss): the least friendly star; avoid new starts','Mitra (friend): good, helpful people around','Parama Mitra (best friend): very good'];
  const GOCH = { Sun:[3,6,10,11], Moon:[1,3,6,7,10,11], Mars:[3,6,11], Mercury:[2,4,6,8,10,11], Jupiter:[2,5,7,9,11], Venus:[1,2,3,4,5,8,9,11,12], Saturn:[3,6,11], Rahu:[3,6,11], Ketu:[3,6,11] };
  const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th'));
  function compute(chart, profile, jd){
    const tz = Number(profile.tz != null ? profile.tz : chart.tzOffsetHours), lat = Number(profile.lat), lon = Number(profile.lon);
    const P = panchangaAt(jd, lat, lon, tz), moon = chart.planets.Moon, bNak = moon.nakshatra.index;
    const tNak = P.nakshatra.num - 1, tMoonSign = P.moonSign;
    const cb = (tMoonSign - moon.sign + 12) % 12 + 1, cbGood = CB_GOOD.includes(cb);
    let c = (tNak - bNak + 27) % 27 + 1, tr = c % 9 === 0 ? 9 : c % 9, tGood = !TARA_BAD.includes(tr);
    const goch = Object.keys(GOCH).map(n => { const l = getSiderealLongitudeAt(n, jd), s = getSignIndex(l), h = (s - moon.sign + 12) % 12 + 1; return { n, sign: s, deg: getDegInSign(l), house: h, good: GOCH[n].includes(h) }; });
    const tone = (cbGood && tGood) ? 'Supportive' : (cbGood || tGood) ? 'Mixed' : 'Go gently';
    const toneTxt = { Supportive:'Both your Moon checks are good today, a fair day to start or decide things.', Mixed:'One of your two Moon checks is good and one is not. Choose the quiet, routine tasks for the weaker part.', 'Go gently':'Both Moon checks are not at their best today. Keep to routine, and keep big starts for another day.' }[tone];
    let slots = [], ps = null; try { ps = CHG.parts(P); } catch(e){}
    if (ps){ const rk = P.rahu; const all = ps.day.concat(ps.night || []); slots = all.filter(s => s.tone === 'good').map(s => Object.assign({ rahu: !!(rk && s.from < rk[1] && s.to > rk[0]) }, s)); }
    return { P, tz, cb, cbGood, tr, trName: TARA[tr - 1], trTxt: TARA_TXT[tr - 1], tGood, tNak, goch, nGood: goch.filter(g => g.good).length, tone, toneTxt, slots };
  }
  function html(chart, profile, jd){
    let d; try { d = compute(chart, profile, jd); } catch(e){ console.warn('today for you', e); return '<div class="meta-err">Could not work out this moment.</div>'; }
    const P = d.P, ref = P.vara.date, c = { tz: d.tz }, sg = i => SIGNS[i], g = PLANET_GLYPHS;
    const big = (k, t, sub, good) => `<div class="tdy-b ${good ? 'good' : 'bad'}"><small>${k}</small><b>${t}</b><span>${sub}</span><em>${good ? 'Good' : 'Not at its best'}</em></div>`;
    const gr = d.goch.map(x => `<div class="tdy-g ${x.good ? 'good' : 'bad'}"><span class="tdy-gl">${g[x.n]}</span><div><b>${x.n}</b> <span>${sg(x.sign).symbol} ${sg(x.sign).name}</span><span class="tdy-gh">${ord(x.house)} from your Moon</span></div><em>${x.good ? '✓' : '–'}</em></div>`).join('');
    const sl = d.slots.length ? d.slots.map(s => `<div class="tdy-s${s.rahu ? ' rk' : ''}"><b>${s.name}</b><span>${nvTime(s.from, d.tz, ref)} – ${nvTime(s.to, d.tz, ref)}</span><em>${s.rahu ? 'overlaps Rahu Kalam' : 'clear'}</em></div>`).join('') : '<div class="pl-empty">Slots are not available for this place and date.</div>';
    return `<div class="tdy-hero ${d.tone === 'Supportive' ? 'good' : d.tone === 'Mixed' ? 'mid' : 'bad'}"><small>Your day · ${P.vara.name}, ${nvDate(jd, d.tz)}</small><b>${d.tone}</b><p>${d.toneTxt}</p>
        <span class="tdy-fine">This one-line tone counts only the two Moon checks below. It is a planning aid, not a prediction.</span></div>
      <div class="tdy-two">${big('Chandrabala', `Moon in your ${ord(d.cb)}`, `Today's Moon is in ${sg(P.moonSign).symbol} ${sg(P.moonSign).name}, the ${ord(d.cb)} sign from your birth Moon`, d.cbGood)}
        ${big('Tarabala', d.trName, d.trTxt, d.tGood)}</div>
      <div class="pn-sec"><h5>Today's Panchanga <span>for your birth place</span></h5><div class="tdy-pc"><span><small>Tithi</small><b>${P.tithi.paksha} ${P.tithi.name}</b></span><span><small>Star</small><b>${P.nakshatra.name}</b></span><span><small>Yoga</small><b>${P.yoga.name}</b></span><span><small>Rahu Kalam</small><b>${P.rahu ? nvTime(P.rahu[0], d.tz, ref) + ' – ' + nvTime(P.rahu[1], d.tz, ref) : '—'}</b></span></div></div>
      <div class="pn-sec"><h5>Planets of the day, from your Moon <span>${d.nGood} of 9 favourable</span></h5>${gr}
        <p class="pn-note">Gochara: the houses the tradition calls favourable for each planet, counted from your birth Moon sign. Common practice; Rahu and Ketu lists differ by school.</p></div>
      <div class="pn-sec"><h5>Good time slots <span>Amrit · Shubh · Labh</span></h5>${sl}<p class="pn-note">Slots that overlap Rahu Kalam are best avoided for new starts. See Choghadiya for all slots.</p></div>`;
  }
  function panel(chart, profile){
    const tz = Number(profile.tz != null ? profile.tz : chart.tzOffsetHours), now = jdToLocalParts(Date.now() / 86400000 + 2440587.5, tz);
    return `<div class="tdyp"><div class="avk-intro">Your day, read from your own Moon: <b>${escapeHtml(profile.name || 'you')}</b>, born under ${SIGNS[chart.planets.Moon.sign].name}, ${chart.planets.Moon.nakshatra.name}. Pick any date to look ahead.</div>
      <div class="chgp-in"><label>Date <input type="date" id="tdyDate" value="${now.dateStr}"></label><label>Time <input type="time" id="tdyTime" value="${now.timeStr.slice(0, 5)}"></label><button type="button" id="tdyNow" class="chgp-btn">Now</button></div><div id="tdyBody"></div></div>`;
  }
  function draw(){
    const b = document.getElementById('tdyBody'); if (!b) return;
    const pf = window.__vgProf, ch = (typeof currentChartForModal !== 'undefined') ? currentChartForModal : null; if (!pf || !ch) return;
    const tz = Number(pf.tz != null ? pf.tz : ch.tzOffsetHours), ds = document.getElementById('tdyDate').value, ts = document.getElementById('tdyTime').value || '12:00'; if (!ds) return;
    const [y, m, d] = ds.split('-').map(Number), [hh, mm] = ts.split(':').map(Number);
    b.innerHTML = html(ch, pf, toJulianDay(y, m, d, hh, mm, 0) - tz / 24);
  }
  document.addEventListener('input', e => { if (e.target.id === 'tdyDate' || e.target.id === 'tdyTime') draw(); });
  document.addEventListener('click', e => {
    if (e.target.id !== 'tdyNow') return; const pf = window.__vgProf; if (!pf) return;
    const n = jdToLocalParts(Date.now() / 86400000 + 2440587.5, Number(pf.tz != null ? pf.tz : 0));
    document.getElementById('tdyDate').value = n.dateStr; document.getElementById('tdyTime').value = n.timeStr.slice(0, 5); draw();
  });
  function text(chart, profile, jd){ try { const d = compute(chart, profile, jd); return `Today for you: ${d.tone}. Chandrabala: Moon in ${ord(d.cb)} from birth Moon (${d.cbGood ? 'good' : 'not at its best'}). Tarabala: ${d.trName} (${d.tGood ? 'good' : 'not at its best'}). Favourable planets from Moon: ${d.nGood} of 9.`; } catch(e){ return ''; } }
  window.buildTodayPanel = function(chart, profile){ setTimeout(draw, 0); return panel(chart, profile); };
  return { compute, html, text, draw, GOCH, TARA };
})();

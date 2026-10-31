/* ============================================================================
   DOSHA CHECK (DSH): one screen for the doshas people ask about most. It uses the app's own yoga engine (YGE, js/92) for Manglik, Kaal Sarp, Guru Chandala,
   Surya Grahan, Chandra Grahan, Shrapit and Angaraka (the exact placement it matched is shown as "Why"), and adds two checks that the engine does not have:
     Pitru dosha (common practice, schools differ): any of  Rahu or Ketu in the 9th house; the 9th lord in the same sign as Rahu, Ketu or Saturn;
                                                          the Sun in the 9th house with Saturn, Rahu or Ketu.
     Gand Mool (traditional birth-star rule): the Moon in Ashwini, Ashlesha, Magha, Jyeshtha, Mula or Revati (the six junction stars).
   Every item says what it traditionally means and what can soften it, in plain words. These are traditional markers to understand a chart, not verdicts or
   predictions, and the page says so. Whole-sign houses from the Lagna. No remedies are given. No new yoga is invented.
   API: DSH.compute(chart) -> [{id, name, present, why, level, note, meaning, scenes, best, watch, cancelled, tag}] ; DSH.text(chart)
   ============================================================================ */
const DSH = (function(){
  const IDS = ['manglik','kaal_sarp','pitru','gand_mool','guru_chandala','surya_grahan','chandra_grahan','shrapit','angaraka'];
  const GM = {0:'Ashwini (Ketu)',8:'Ashlesha (Mercury)',9:'Magha (Ketu)',17:'Jyeshtha (Mercury)',18:'Mula (Ketu)',26:'Revati (Mercury)'};
  const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th'));
  const TAG = { manglik:'Common practice. Rules and cancellations differ by school.', kaal_sarp:'Modern tradition. It is not in the BPHS.', pitru:'Common practice. Schools differ on the signs.', gand_mool:'Traditional birth-star rule.',
    guru_chandala:'Common practice (from the Jupiter-node conjunction).', surya_grahan:'Common practice.', chandra_grahan:'Common practice.', shrapit:'Common practice (Saturn with Rahu).', angaraka:'Common practice (Mars with Rahu).' };
  function pitru(chart){
    const P = chart.planets, asc = chart.ascendant.sign, s9 = (asc + 8) % 12, lord = SIGNS[s9].lord, why = [];
    if (P.Rahu.house === 9) why.push('Rahu is in the 9th house'); if (P.Ketu.house === 9) why.push('Ketu is in the 9th house');
    const L = P[lord];
    ['Rahu','Ketu','Saturn'].forEach(n => { if (n !== lord && L.sign === P[n].sign) why.push(`the 9th lord ${lord} is with ${n} in ${SIGNS[L.sign].name}`); });
    if (P.Sun.house === 9) ['Saturn','Rahu','Ketu'].forEach(n => { if (P[n].house === 9) why.push(`the Sun is with ${n} in the 9th house`); });
    return { present: why.length > 0, why: why.join('; '), level: why.length >= 2 ? 'Notable' : why.length ? 'Mild' : null };
  }
  function gandMool(chart){
    const m = chart.planets.Moon, ni = m.nakshatra.index, hit = GM[ni] != null;
    return { present: hit, why: hit ? `the Moon is in ${GM[ni].split(' (')[0]}, pada ${m.nakshatra.pada}` : '', level: null };
  }
  function compute(chart){
    let det = []; try { det = (typeof YGE !== 'undefined' && YGE) ? YGE.detect(chart) : []; } catch(e){ console.warn('dosha yge', e); }
    const by = {}; det.forEach(y => { by[y.id] = y; });
    const dat = {}; if (typeof YGE_DATA !== 'undefined') YGE_DATA.yogas.forEach(y => { dat[y.id] = y; });
    const EXTRA = {
      pitru: { name:'Pitru Dosha (ancestors)', meaning:'The 9th house, the house of father, elders and inherited merit, is touched by Rahu, Ketu or Saturn, which is traditionally read as a karmic theme with family elders or a delayed inheritance of luck', scenes:['you may feel your luck comes later than for others','you may carry a sense of duty towards parents and elders'], best:'deep respect for family roots and steady service', watch:'delays or distance from the father or elders', tone:'challenge' },
      gand_mool: { name:'Gand Mool (birth star)', meaning:'The Moon is in one of the six stars at the junctions of the water and fire signs. Tradition treats the birth as sensitive and asks families to take the birth star seriously', scenes:['you may have felt big changes early in life','you may have an unusually strong inner drive'], best:'strong intuition and the ability to start over', watch:'sudden turns in early life', tone:'challenge' }
    };
    const own = { pitru: pitru(chart), gand_mool: gandMool(chart) };
    return IDS.map(id => {
      const d = dat[id] || EXTRA[id] || {}, x = by[id] || (own[id] && own[id].present ? own[id] : null);
      return { id, name: d.name || id, present: !!x, why: x ? x.why : '', level: x ? (x.level || null) : null, levelWhy: x ? x.levelWhy : '', note: x && x.note ? x.note : '',
        cancelled: x ? !!x.cancelled : false, meaning: d.meaning || '', scenes: d.scenes || [], best: d.best || '', watch: d.watch || '', tone: d.tone || '', tag: TAG[id] || '' };
    });
  }
  function card(r, open){
    const st = r.present ? (r.cancelled ? 'softened' : 'present') : 'clear', lab = { present:'Present', softened:'Present, softened', clear:'Not found' }[st];
    const body = r.present ? `<p><b>Why:</b> ${escapeHtml(r.why)}${r.level ? ` <em class="dsh-lv">${escapeHtml(r.level)}</em>` : ''}</p>${r.levelWhy ? `<p class="dsh-sub">${escapeHtml(r.levelWhy)}</p>` : ''}${r.note ? `<p class="dsh-soft"><b>What can soften it:</b> ${escapeHtml(r.note)}</p>` : ''}${r.cancelled && !r.note ? '<p class="dsh-soft"><b>Softened:</b> a classical relief condition applies in your chart.</p>' : ''}
      <p><b>What it is said to mean:</b> ${escapeHtml(r.meaning)}.</p>${r.scenes.length ? `<ul>${r.scenes.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>` : ''}
      <p><b>At its best:</b> ${escapeHtml(r.best)}. <b>Watch for:</b> ${escapeHtml(r.watch)}.</p>`
      : `<p>Your chart does not show this. <span class="dsh-sub">What was checked: ${escapeHtml(r.meaning)}.</span></p>`;
    return `<details class="dsh-c ${st}"${open && r.present ? ' open' : ''}><summary><b>${escapeHtml(r.name)}</b><span class="dsh-p">${lab}</span></summary>${body}<p class="dsh-tag">${escapeHtml(r.tag)}</p></details>`;
  }
  function html(chart){
    let rs; try { rs = compute(chart); } catch(e){ console.warn('dosha', e); return '<div class="meta-err">Could not build the Dosha Check.</div>'; }
    const pres = rs.filter(r => r.present), clr = rs.filter(r => !r.present), soft = pres.filter(r => r.cancelled).length;
    return `<div class="dsh"><div class="dsh-hero"><b>${pres.length}</b> of ${rs.length} checks found in your chart${soft ? ` · ${soft} softened` : ''}</div>
      <p class="avk-intro">A dosha is a traditional marker that asks for care, not a verdict on your life. Each one shows the exact reason from your chart and what can soften it. Many people with a dosha live very full lives, and many astrologers read them lightly.</p>
      ${pres.length ? `<h4 class="dsh-h">Found in your chart</h4>${pres.map(r => card(r, true)).join('')}` : '<div class="dsh-none">None of these checks are found in your chart.</div>'}
      ${clr.length ? `<h4 class="dsh-h">Not found</h4>${clr.map(r => card(r, false)).join('')}` : ''}
      <p class="pn-note">Houses are counted from the rising sign (whole signs). The yoga engine on the Yogas screen uses the same rules. Schools differ on several of these, so read them with an astrologer you trust.</p></div>`;
  }
  function text(chart){ try { return compute(chart).map(r => `${r.name}: ${r.present ? 'present' + (r.cancelled ? ' (softened)' : '') + ' - ' + r.why : 'not found'}`).join('\n'); } catch(e){ return ''; } }
  return { compute, html, text, ids: IDS };
})();
window.buildDoshaPanel = function(chart){ return DSH.html(chart); };

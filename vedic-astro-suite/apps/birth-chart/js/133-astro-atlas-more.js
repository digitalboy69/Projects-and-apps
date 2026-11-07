/* ASTRO ATLAS, more tabs: Yogas, Remedies, Placements, Match, Muhurta, Learn. Adds itself to the Atlas through window.ATL_UI (js/131) and reads ATLAS_MORE (js/132).
   Own click handling uses data-yg, data-rm, data-pl2, data-md and the #atGlossQ search box. Pure reference, needs no chart. */
(function(){
  const U = window.ATL_UI, M = window.ATLAS_MORE; if (!U || !M) return;
  const { A, esc, col, gl, kv, sec } = U, X = { yg:0, rm:'Sun', pl2:'Sun', md:new Date().getDay(), q:'' };
  const V = '︎';
  U.TABS.push(['yogas','⚹'+V,'Yogas','Special combinations'],['remed','❖'+V,'Remedies','Mantra, gem, charity'],['place','▦'+V,'Placements','Planet in each house'],['match','♡'+V,'Match','Ashtakoota, 36 points'],['muhurta','◔'+V,'Muhurta','Good and bad hours'],['learn','✎'+V,'Learn','Glossary and more']);
  const planetTiles = (attr, cur) => `<div class="at-grid g3">${A.PL.map(p => `<button type="button" class="at-tile${cur === p ? ' on' : ''}" data-${attr}="${p}" style="--ac:${col(p)}"><b>${gl(p)}</b><span>${p}</span></button>`).join('')}</div>`;
  const mark = (sel, attr, v) => document.querySelectorAll(sel).forEach(b => b.classList.toggle('on', b.dataset[attr] === String(v)));

  /* ---------- YOGAS ---------- */
  function yogaList(){
    const list = M.YOGAS.filter(y => y[0] === X.yg);
    return list.map(y => `<article class="at-yg"><h5>${esc(y[1])}</h5><dl><dt>Formed by</dt><dd>${esc(y[2])}</dd><dt>Gives</dt><dd>${esc(y[3])}</dd></dl>${y[4] ? `<p class="at-note">${esc(y[4])}</p>` : ''}</article>`).join('');
  }
  function yogasTab(){
    return `<div class="at-chips at-cat">${M.YOGA_CATS.map((c, i) => `<button type="button" class="at-cb${X.yg === i ? ' on' : ''}" data-yg="${i}">${c}</button>`).join('')}</div>
      <div id="atYg" class="at-ygs">${yogaList()}</div>
      <p class="at-note c">A yoga is a pattern, not a promise. Its strength depends on the planets involved, their sign, their Dasha and the rest of the chart.</p>`;
  }

  /* ---------- REMEDIES ---------- */
  function remedyHtml(){
    const r = M.REMEDIES[X.rm], p = X.rm, c = col(p);
    return `<div class="at-card" style="--ac:${c}"><div class="at-hd"><span class="at-big">${gl(p)}</span><div><h3>${p}</h3><p>${r.deity} · ${r.day}</p></div></div>
      <div class="at-mantra"><small>Beeja mantra</small><b>${esc(r.mantra)}</b></div>
      ${kv([['Gem', r.gem], ['Finger', r.finger], ['Metal', r.metal], ['Charity', r.daan], ['Fasting', r.fast], ['Rudraksha', r.rud], ['Tree or herb', r.tree], ['Recite', r.text]])}</div>`;
  }
  function remedTab(){
    return `${planetTiles('rm', X.rm)}<div id="atRm">${remedyHtml()}</div>
      ${sec('How these are used', '', '<p class="at-note" style="margin:0">Mantra on the planet\'s day, charity given on that day, a simple fast and a calm mind are the gentle, traditional remedies. Gems are strong; many astrologers advise studying the whole chart and wearing one only after careful advice. None of this replaces medical, legal or financial care.</p>')}`;
  }

  /* ---------- PLACEMENTS ---------- */
  function placeHtml(){
    const p = X.pl2, rows = M.IN_HOUSE[p], c = col(p);
    const kind = n => [1,4,7,10].includes(n) ? 'Kendra' : [5,9].includes(n) ? 'Trikona' : [6,8,12].includes(n) ? 'Dusthana' : [3,11].includes(n) ? 'Upachaya' : 'Panaphara';
    return `<div class="at-card" style="--ac:${c}"><div class="at-hd"><span class="at-big">${gl(p)}</span><div><h3>${p} in the houses</h3><p>what ${p} tends to do in each house</p></div></div>
      <div class="at-pls">${rows.map((t, i) => `<div class="at-pl"><b>${i + 1}</b><span><em>${A.HOUSES[i].sa} · ${kind(i + 1)}</em>${esc(t)}</span></div>`).join('')}</div></div>
      <p class="at-note c">Tendencies only. The sign, the planet's aspects and the house lord change each reading.</p>`;
  }
  function placeTab(){ return `${planetTiles('pl2', X.pl2)}<div id="atPl">${placeHtml()}</div>`; }

  /* ---------- MATCH ---------- */
  function matchTab(){
    return sec('Ashtakoota', 'the 36-point system used in Kundali matching', `<div class="at-ak">${M.ASHTAKOOTA.map(k => `<div><b>${k[1]}</b><span>${k[0]}</span><em>${k[2]}<small>${k[3]}</small></em></div>`).join('')}</div>`)
      + sec('Total score', 'out of 36', `<div class="at-sc">${M.SCORES.map(s => `<div style="--ac:${s[2]}"><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}</div><p class="at-note">The Moon sign and birth star of each person drive the score. Eighteen is the usual minimum. Nadi and Bhakoot carry the most weight, so a zero there is looked at closely.</p>`)
      + sec('Also checked', '', kv([['Manglik', 'Mars in the 1st, 2nd, 4th, 7th, 8th or 12th. Balanced when both have it.'], ['Dasha fit', 'The running periods of both should support the marriage.'], ['7th house', 'Its sign, lord and planets describe the partner in each chart.'], ['Navamsa', 'The D9 shows the deeper strength of the bond.']]));
  }

  /* ---------- MUHURTA ---------- */
  const hrs = s => { const m = /^(\d\d):(\d\d)/.exec(s); return +m[1] + (+m[2]) / 60; };
  function mdHtml(){
    const d = X.md, rows = [['Rahu Kala', 'Rahu', '#8f79c9'], ['Yamaganda', 'Yamaganda', '#e5584b'], ['Gulika', 'Gulika', '#f2cf6b']];
    const track = (name, key, c) => { const t = M.BAD_TIMES[key][d], a = hrs(t); return `<div class="at-trk"><span>${name}<small>${t}</small></span><i><u style="left:${((a - 6) / 12 * 100).toFixed(2)}%;background:${c}"></u></i></div>`; };
    return `<div class="at-card" style="--ac:${col(A.DAYS[d].lord)}"><div class="at-hd"><span class="at-big">${gl(A.DAYS[d].lord)}</span><div><h3>${A.DAYS[d].en}</h3><p>times to avoid for new starts</p></div></div>
      ${rows.map(r => track(...r)).join('')}<div class="at-ax"><span>6am</span><span>9</span><span>noon</span><span>3pm</span><span>6pm</span></div>
      <p class="at-note">Each period is one eighth of a 12 hour day (an hour and a half when sunrise is at 6 and sunset at 18). Add or subtract the real sunrise to find your local times.</p></div>`;
  }
  function muhurtaTab(){
    return `<div class="at-chips at-cat">${A.DAYS.map((d, i) => `<button type="button" class="at-cb${X.md === i ? ' on' : ''}" data-md="${i}">${d.en.slice(0, 3)}</button>`).join('')}</div><div id="atMd">${mdHtml()}</div>`
      + sec('Good windows', '', M.MUHURTA_NOTES.map(n => `<div class="at-kind"><b>${n[0]}<small>${n[1]}</small></b><p>${n[2]}</p></div>`).join(''))
      + sec('Five limbs of a day', 'the Panchanga', `<div class="at-asps">${M.PANCHAKA.map(p => `<div class="at-asp"><b>${p[0]}</b><span>${p[1]} · ${p[2]}<small>${p[3]}</small></span></div>`).join('')}</div>`);
  }

  /* ---------- LEARN ---------- */
  function glossHtml(){
    const q = X.q.trim().toLowerCase(), list = M.GLOSSARY.filter(g => !q || g[0].toLowerCase().includes(q) || g[1].toLowerCase().includes(q));
    return list.length ? list.map(g => `<div class="at-gl"><b>${esc(g[0])}</b><p>${esc(g[1])}</p></div>`).join('') : '<p class="at-note c">No term matches. Try another word.</p>';
  }
  function learnTab(){
    const max = Math.max(...M.ASHTA.map(a => a[1]));
    return sec('Sade Sati', 'Saturn\'s 7.5 year passage around your Moon sign', `<div class="at-sd">${M.SADE.map((s, i) => `<div><em>${i + 1}</em><b>${s[0]}</b><span>${s[1]}<small>${s[2]}</small></span><p>${s[3]}</p></div>`).join('')}</div><p class="at-note">It returns about every 29.5 years. Many people find it a time of work and growth, and results depend on the chart and the Dasha running.</p>`)
      + sec('Ashtakavarga', 'points each planet gives to the 12 signs', `<div class="at-av">${M.ASHTA.map(a => `<div style="--ac:${col(a[0])}"><span>${gl(a[0])} ${a[0]}</span><i><u style="width:${(a[1] / max * 100).toFixed(0)}%"></u></i><b>${a[1]}</b></div>`).join('')}</div><p class="at-note">The seven bars add to 337 points across the chart, about 28 for an average sign. A sign with more than 28 is strong, and less than 25 is weak.</p>`)
      + sec('Glossary', M.GLOSSARY.length + ' terms in plain words', `<input id="atGlossQ" class="at-q" type="search" placeholder="Search a term" value="${esc(X.q)}" autocomplete="off"><div id="atGl" class="at-gls">${glossHtml()}</div>`);
  }

  Object.assign(U.BODY, { yogas:yogasTab, remed:remedTab, place:placeTab, match:matchTab, muhurta:muhurtaTab, learn:learnTab });

  document.addEventListener('click', e => {
    const t = e.target.closest ? e.target.closest('#atlas [data-yg],#atlas [data-rm],#atlas [data-pl2],#atlas [data-md]') : null; if (!t) return;
    const D = t.dataset;
    if (D.yg != null){ X.yg = +D.yg; mark('#atlas [data-yg]', 'yg', X.yg); U.upd('atYg', yogaList); }
    else if (D.rm){ X.rm = D.rm; mark('#atlas [data-rm]', 'rm', X.rm); U.upd('atRm', remedyHtml); }
    else if (D.pl2){ X.pl2 = D.pl2; mark('#atlas [data-pl2]', 'pl2', X.pl2); U.upd('atPl', placeHtml); }
    else if (D.md != null){ X.md = +D.md; mark('#atlas [data-md]', 'md', X.md); U.upd('atMd', mdHtml); }
  });
  document.addEventListener('input', e => {
    if (e.target && e.target.id === 'atGlossQ'){ X.q = e.target.value; const g = document.getElementById('atGl'); if (g) g.innerHTML = glossHtml(); }
  });
})();

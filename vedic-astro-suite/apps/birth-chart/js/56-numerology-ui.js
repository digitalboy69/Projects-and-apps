/* ---------------------------------- NUMEROLOGY UI ---------------------------------- */
let NM = null;
function buildNumerologyPanel(chart, profile){
  NM = { sys: 'chaldean', mode: 'name', name: '', name2: '', dob: profile.dob, year: new Date().getFullYear(), pick: 'life', profName: profile.name || '' };
  setTimeout(nmRender, 0);
  return `<div class="nm">
    <div class="nm-top">
      <div class="nm-seg nm-modes"><button type="button" class="on" data-nm-mode="name">✍ Name only</button><button type="button" data-nm-mode="dob">📅 Birth date + name</button></div>
      <div class="nm-seg nm-sys" title="Numbering system"><button type="button" class="on" data-nm-sys="chaldean">Chaldean</button><button type="button" data-nm-sys="pythagorean">Pythagorean</button></div>
    </div>
    <div class="nm-sysnote" id="nmSysNote"></div>
    <div class="nm-inputs">
      <div id="nmInName" class="nm-in"><label>Full name <small>(English letters)</small><input type="text" id="nmName" placeholder="e.g. Ananya Sharma" autocomplete="off"></label>
        <button type="button" class="nm-use" data-nm-use="name">Use “${escapeHtml((profile.name || '').split(' ')[0] || 'my name')}”</button></div>
      <div id="nmInDob" class="nm-in" hidden>
        <div class="nm-row"><label>Date of birth<input type="date" id="nmDob" value="${profile.dob}"></label>
        <label>Name <small>(optional)</small><input type="text" id="nmName2" placeholder="Add a name for more" autocomplete="off"></label></div>
        <button type="button" class="nm-use" data-nm-use="name2">Use “${escapeHtml((profile.name || '').split(' ')[0] || 'my name')}”</button></div>
    </div>
    <div id="nmBody"></div>
  </div>`;
}
function nmMeaningCard(n, label, opts){
  const info = NM_INFO[n]; if (!info) return '';
  const pc = NM_PCOL[info.p], base = info.base ? ` · reduces to ${info.base}` : '';
  return `<div class="nm-mean" style="--pc:${pc}">
    <div class="nm-mean-h"><span class="nm-bign">${n}</span><div><small>${label}</small><h4>${info.t}</h4><span>${info.k}</span></div></div>
    <p>${info.d}</p>
    <div class="nm-two"><div class="nm-good"><b>Strengths</b>${info.s.map(x => `<span>${x}</span>`).join('')}</div><div class="nm-warn"><b>Watch-outs</b>${info.w.map(x => `<span>${x}</span>`).join('')}</div></div>
    <div class="nm-facts"><div><small>Ruling planet</small><b>${info.p}</b></div><div><small>Colours</small><b>${info.col}</b></div><div><small>Gemstone</small><b>${info.gem}</b></div></div>
    ${opts && opts.inner ? `<div class="nm-ino"><div><b>Inner motivation</b><span>${info.soul}</span></div><div><b>Outer impression</b><span>${info.out}</span></div></div>` : ''}
    <small class="nm-base">${base ? 'Master number' + base : ''}</small></div>`;
}
function nmTrio(R){
  const one = (lbl, sub, r, comp) => r ? `<div class="nm-t" style="--pc:${NM_PCOL[NM_INFO[r.n].p]}"><small>${lbl}</small><b>${r.n}</b><span>${NM_INFO[r.n].t}</span><em>${comp > 9 ? comp + ' → ' + r.n + ' · ' : ''}${sub}</em></div>` : `<div class="nm-t"><small>${lbl}</small><b>—</b><span>no letters</span></div>`;
  return `<div class="nm-trio">${one('Expression · all letters', 'how you act', R.name, R.total)}${one('Soul urge · vowels', 'what you want', R.soul, R.vowels)}${one('Personality · consonants', 'how you appear', R.pers, R.cons)}</div>`;
}
function nmNameHtml(){
  const R = nmName(NM.name, NM.sys);
  if (!NM.name.trim()) return `<div class="nm-empty">✍ Type a name above to see its numbers, the final number and what it means.</div>`;
  if (!R) return `<div class="nm-empty">Please write the name using English (Latin) letters, for example “Ananya”.</div>`;
  const n = R.name.n, info = NM_INFO[n], pc = NM_PCOL[info.p], chal = NM.sys === 'chaldean';
  const words = R.words.map(w => `<div class="nm-word"><div class="nm-wl"><b>${w.w}</b><span>= ${w.sum}</span></div><div class="nm-tiles">${w.letters.map(l => `<span class="${l.vowel ? 'v' : 'c'}"><i>${l.ch}</i><b>${l.v}</b></span>`).join('')}</div></div>`).join('');
  const letterEq = R.words.map(w => w.letters.map(l => l.v).join('+')).join(' + ');
  const comp = R.total > 9 ? `Compound number <b>${R.total}</b>${chal ? ' (traditional “compound” before the final number)' : ''}` : 'Single-digit total';
  return `<div class="nm-hero" style="--pc:${pc}">
      <div class="nm-ring"><b>${n}</b></div>
      <div class="nm-hero-t"><small>Your ${chal ? 'Chaldean' : 'Pythagorean'} name number</small><h4>${info.t}</h4><span>${info.k}</span>
        <div class="nm-chips"><span>${comp}</span><span>Ruled by ${info.p}</span></div></div>
    </div>
    <div class="nm-sec"><h5>① Number of every letter <span>teal = vowel · gold = consonant</span></h5>${words}</div>
    <div class="nm-sec"><h5>② Adding it up</h5>
      <div class="nm-calc"><div class="nm-step"><small>All letters</small><code>${letterEq}</code><b>= ${R.total}</b></div>
      <div class="nm-step"><small>Reduce to the end number</small><code>${R.total > 9 ? nmStepsTxt(R.name) : 'already a single digit'}</code><b>→ ${n}</b></div></div></div>
    <div class="nm-sec"><h5>③ What the end number ${n} means</h5>${nmMeaningCard(n, 'Name number', { inner: true })}</div>
    <div class="nm-sec"><h5>④ Three views of your name</h5>${nmTrio(R)}</div>
    <div class="nm-actions"><button type="button" class="export-download-btn export-ghost" data-nm-copy>📋 Copy result</button></div>
    <div class="pn-note">${chal ? 'Chaldean numbers run 1–8 (9 is held sacred and never assigned to a letter). The compound total is shown first, then reduced to the final single digit.' : 'Pythagorean numbers run 1–9. Master numbers 11, 22 and 33 are kept unreduced.'} Y counts as a consonant unless the word has no other vowel. Numerology is a traditional symbolic system, not a scientific one.</div>`;
}
function nmDobHtml(){
  const D = nmDob(NM.dob, NM.sys, NM.year);
  if (!D) return `<div class="nm-empty">📅 Choose a date of birth to see your numbers.</div>`;
  const chal = NM.sys === 'chaldean', N = NM.name2.trim() ? nmName(NM.name2, NM.sys) : null;
  const cards = [
    { key: 'life', lbl: chal ? 'Bhagyank · Destiny' : 'Life Path', r: D.life, note: chal ? 'all digits of birth date' : 'day + month + year' },
    { key: 'day', lbl: chal ? 'Mulank · Psychic' : 'Birthday number', r: chal ? D.mulank : D.day, note: `born on the ${D.d}${[11,12,13].includes(D.d % 100) ? 'th' : ['th','st','nd','rd'][D.d % 10 > 3 ? 0 : D.d % 10]}` },
    { key: 'att', lbl: 'Attitude', r: D.attitude, note: 'day + month' }
  ];
  if (N) cards.push({ key: 'name', lbl: 'Name number', r: N.name, note: NM.name2.trim().split(/\s+/)[0] });
  if (!cards.some(c => c.key === NM.pick)) NM.pick = 'life';
  const tiles = cards.map(c => `<button type="button" class="nm-card ${NM.pick === c.key ? 'on' : ''}" style="--pc:${NM_PCOL[NM_INFO[c.r.n].p]}" data-nm-pick="${c.key}"><small>${c.lbl}</small><b>${c.r.n}</b><span>${NM_INFO[c.r.n].t}</span><em>${c.note}</em></button>`).join('');
  const sel = cards.find(c => c.key === NM.pick);
  const dayTxt = D.d > 9 ? `${String(D.d).split('').join('+')} = ${D.mulank.steps[1]}${D.mulank.steps.length > 2 ? ' → ' + D.mulank.n : ''}` : `${D.d}`;
  const lifeCalc = chal ? `${[...String(D.d), ...String(D.m), ...String(D.y)].join('+')} = ${[...String(D.d), ...String(D.m), ...String(D.y)].reduce((a, c) => a + (+c), 0)}${D.life.steps.length > 1 ? ' → ' + nmStepsTxt(D.life) : ''}`
    : `${D.lifeParts.join(' + ')} = ${D.lifeParts.reduce((a, b) => a + b, 0)}${D.life.steps.length > 1 ? ' → ' + nmStepsTxt(D.life) : ''}`;
  const py = D.py.n, years = [NM.year - 1, NM.year, NM.year + 1];
  const grid = NM_LOSHU.map(r => `<div class="nm-gr">${r.map(v => `<div class="nm-gc ${D.counts[v] ? 'has' : 'miss'}"><small>${v}</small><b>${D.counts[v] ? String(v).repeat(D.counts[v]) : '·'}</b></div>`).join('')}</div>`).join('');
  const missing = [1,2,3,4,5,6,7,8,9].filter(v => !D.counts[v]), lines = NM_LINES.filter(l => l[1].every(v => D.counts[v]));
  const info = NM_INFO[sel.r.n];
  return `<div class="nm-cards">${tiles}</div>
    ${nmMeaningCard(sel.r.n, sel.lbl, { inner: sel.key === 'name' })}
    ${N ? `<div class="nm-sec"><h5>Name · ${escapeHtml(NM.name2.trim())}</h5>${nmTrio(N)}</div>` : '<div class="nm-hint">💡 Add a name above to unlock the Name, Soul-urge and Personality numbers.</div>'}
    <div class="nm-sec"><h5>How these were worked out</h5><div class="nm-calc">
      <div class="nm-step"><small>${chal ? 'Mulank (day of birth)' : 'Birthday number'}</small><code>${dayTxt}</code><b>→ ${(chal ? D.mulank : D.day).n}</b></div>
      <div class="nm-step"><small>${chal ? 'Bhagyank (full date)' : 'Life Path'}</small><code>${lifeCalc}</code><b>→ ${D.life.n}</b></div>
      <div class="nm-step"><small>Attitude</small><code>${D.d} + ${D.m} = ${D.d + D.m}${D.attitude.steps.length > 1 ? ' → ' + nmStepsTxt(D.attitude) : ''}</code><b>→ ${D.attitude.n}</b></div></div></div>
    <div class="nm-sec"><h5>Personal year <span>a 9-year cycle</span></h5>
      <div class="nm-py"><div class="nm-pyn" style="--pc:${NM_PCOL[NM_INFO[py].p]}"><small>${NM.year}</small><b>${py}</b></div><div><b>${NM_YEAR[py]}</b><span>${D.d} + ${D.m} + ${NM.year} → ${py}</span>
        <div class="nm-yr"><button type="button" data-nm-year="-1">‹ ${NM.year - 1}</button><button type="button" data-nm-year="0">This year</button><button type="button" data-nm-year="1">${NM.year + 1} ›</button></div></div></div></div>
    <div class="nm-sec"><h5>Lo Shu grid <span>digits of your birth date + Mulank + Bhagyank</span></h5>
      <div class="nm-lo"><div class="nm-grid">${grid}</div><div class="nm-lo-s">
        <div><b>Present</b><p>${[1,2,3,4,5,6,7,8,9].filter(v => D.counts[v]).map(v => `<span class="ok">${v}${D.counts[v] > 1 ? '×' + D.counts[v] : ''}</span>`).join('') || '—'}</p></div>
        <div><b>Missing</b><p>${missing.length ? missing.map(v => `<span class="no" title="${NM_MISS[v]}">${v}</span>`).join('') : '<em>none — all nine present</em>'}</p>${missing.length ? `<small>Missing numbers point to areas to consciously develop: ${missing.slice(0, 3).map(v => v + ' (' + NM_MISS[v] + ')').join('; ')}${missing.length > 3 ? '…' : ''}.</small>` : ''}</div>
        <div><b>Complete lines</b><p>${lines.length ? lines.map(l => `<span class="ln">${l[0]} ${l[1].join('-')}</span>`).join('') : '<em>no full line</em>'}</p></div></div></div></div>
    <div class="nm-actions"><button type="button" class="export-download-btn export-ghost" data-nm-copy>📋 Copy result</button></div>
    <div class="pn-note">${chal ? 'Indian method: Mulank is the day of birth reduced to 1–9, Bhagyank is every digit of the birth date added and reduced to 1–9.' : 'Western method: Life Path adds the reduced day, month and year; master numbers 11, 22 and 33 are kept.'} Numerology is a traditional symbolic system, not a scientific one.</div>`;
}
function nmRender(){
  const b = document.getElementById('nmBody'); if (!b || !NM) return;
  document.getElementById('nmInName').hidden = NM.mode !== 'name'; document.getElementById('nmInDob').hidden = NM.mode !== 'dob';
  document.getElementById('nmSysNote').textContent = NM.sys === 'chaldean' ? 'Chaldean — the traditional system used in Indian numerology (numbers 1–8 on letters).' : 'Pythagorean — the Western system (numbers 1–9, master numbers 11/22/33 kept).';
  b.innerHTML = NM.mode === 'name' ? nmNameHtml() : nmDobHtml();
}
function nmCopyText(){
  if (NM.mode === 'name'){ const R = nmName(NM.name, NM.sys); if (!R) return ''; const n = R.name.n;
    return `Name numerology (${NM.sys}) — ${NM.name.trim()}\nTotal: ${R.total} → end number ${n} (${NM_INFO[n].t})\nSoul urge: ${R.soul ? R.soul.n : '—'}  Personality: ${R.pers ? R.pers.n : '—'}\n${NM_INFO[n].d}`; }
  const D = nmDob(NM.dob, NM.sys, NM.year); if (!D) return '';
  return `Numerology (${NM.sys}) — born ${NM.dob}\n${NM.sys === 'chaldean' ? 'Mulank' : 'Birthday'}: ${(NM.sys === 'chaldean' ? D.mulank : D.day).n}  ${NM.sys === 'chaldean' ? 'Bhagyank' : 'Life Path'}: ${D.life.n} (${NM_INFO[D.life.n].t})\nAttitude: ${D.attitude.n}  Personal year ${NM.year}: ${D.py.n}`;
}
document.addEventListener('click', (e) => {
  if (!NM) return;
  const mode = e.target.closest('[data-nm-mode]'); if (mode){ NM.mode = mode.dataset.nmMode; document.querySelectorAll('[data-nm-mode]').forEach(b => b.classList.toggle('on', b === mode)); nmRender(); return; }
  const sys = e.target.closest('[data-nm-sys]'); if (sys){ NM.sys = sys.dataset.nmSys; document.querySelectorAll('[data-nm-sys]').forEach(b => b.classList.toggle('on', b === sys)); nmRender(); return; }
  const use = e.target.closest('[data-nm-use]'); if (use){ const k = use.dataset.nmUse; NM[k] = NM.profName; document.getElementById(k === 'name' ? 'nmName' : 'nmName2').value = NM.profName; nmRender(); return; }
  const pick = e.target.closest('[data-nm-pick]'); if (pick){ NM.pick = pick.dataset.nmPick; nmRender(); return; }
  const yr = e.target.closest('[data-nm-year]'); if (yr){ const v = parseInt(yr.dataset.nmYear); NM.year = v === 0 ? new Date().getFullYear() : NM.year + v; nmRender(); return; }
  if (e.target.closest('[data-nm-copy]')){ const t = nmCopyText(); if (t) APP.copy(t).then(ok => APP.toast(ok ? 'Result copied ✓' : 'Could not copy', ok ? 'success' : 'error')); }
});
document.addEventListener('input', (e) => {
  if (!NM) return;
  if (e.target.id === 'nmName'){ NM.name = e.target.value; nmRender(); }
  else if (e.target.id === 'nmName2'){ NM.name2 = e.target.value; nmRender(); }
  else if (e.target.id === 'nmDob'){ NM.dob = e.target.value; nmRender(); }
});


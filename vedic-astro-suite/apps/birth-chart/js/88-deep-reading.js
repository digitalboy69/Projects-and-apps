/* ============================================================================
   DEEP READING: shows the Vedic Knowledge Database (js/87) for the chart that was just cast.
   Exposes window.VDR with four views of the same data (all take the chart from computeChart()):
     VDR.pane(c)                   the "📖 Deep reading" tab: rising sign, Moon, functional nature, conjunctions, 12 house cards
     VDR.planetBlock(c, planet)    extra lines inside each planet card of the Planets tab
     VDR.dashaBlock(c, md, ad)     what the running Mahadasha / Antardasha lords tend to bring (Now tab)
     VDR.reportText(c)             the same reading as plain text for the downloadable full report
   Hooked in from js/70-chart-reading.js (3 spots) and js/43-full-report-text.js (1 spot). If js/87 is missing, nothing is added.
   All texts come from VDB; this file only decides what to show where. Styles: css/39-deep-reading.css.
   ============================================================================ */
(function(){
'use strict';
if (typeof VDB === 'undefined') return;
const D = VDB.data, SIGN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const PL = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const HELPFUL = ['Jupiter','Venus','Mercury'], PRESS = ['Sun','Mars','Saturn','Rahu','Ketu'];
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const ordn = n => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
const glyph = n => (typeof PLANET_GLYPHS !== 'undefined' && PLANET_GLYPHS[n]) || '';
const strip = t => String(t).replace(/^[^:]{1,90}: /, '');                    // drop the "Planet in Sign (Dignity): " lead-in
const cache = new WeakMap();
const R = c => { let r = cache.get(c); if (!r){ r = VDB.reading(c); cache.set(c, r); } return r; };
const chip = (cls, t) => `<span class="vx-chip ${cls || ''}">${esc(t)}</span>`;
const toneCls = t => t === 'supportive' ? 'g' : t === 'challenging' ? 'b' : '';
const DIG = { Exalted:['Exalted','g'], Debilitated:['Debilitated','b'], Own:['Own sign','g'], Moolatrikona:['Own sign','g'], Friend:["Friend's sign",''], Enemy:["Enemy's sign",'b'], Neutral:['Neutral sign',''] };
const line = (head, chipHtml, body, small) => `<div class="dr-l"><b>${head}</b>${chipHtml || ''}<div>${esc(body)}</div>${small ? `<small>${small}</small>` : ''}</div>`;
const note = (cls, html) => `<div class="vx-note ${cls || ''}"><div>${html}</div></div>`;
const NKC = new WeakMap();
const NK = c => { if (typeof VNK === 'undefined' || !VNK) return null; let r = NKC.get(c); if (!r){ r = VNK.forChart(c); NKC.set(c, r); } return r; };
const TONE_CLS = { supportive: 'g', challenging: 'b', mixed: '' };
const RELLAB = { own: 'own star', friend: "friend's star", neutral: 'neutral star', enemy: "enemy's star" };
const lst = a => a.map(esc).join(', ');
const nakMeta = n => `${esc(n.name)}${n.pada ? ' pada ' + n.pada : ''} · ruled by ${esc(n.lord)} · deity ${esc(n.deity)} · symbol ${esc(n.symbol)} · ${esc(n.gana)} gana`;

/* ---------- Planets tab: extra block inside each planet card ---------- */
function planetBlock(c, n){
  const e = R(c).planets[n]; if (!e) return '';
  const L = [], dg = DIG[e.inSign.dignity] || ['', ''];
  L.push(line(`In the ${ordn(e.house)} house`, chip(toneCls(e.inHouse.tone), e.inHouse.tone), e.inHouse.text));
  L.push(line(`In ${e.sign}`, chip(dg[1], dg[0]), strip(e.inSign.text)));
  if (e.nakshatra){
    const pl = NK(c) && NK(c).planets[n];
    if (pl){
      const nk = VNK.nakshatra(pl.nakIndex), ni = nk.natureInfo;
      L.push(`<div class="dr-l"><b>Nakshatra: ${esc(pl.nakshatra)}, pada ${pl.pada.pada}</b>${chip(TONE_CLS[pl.tone], RELLAB[pl.relation.kind])}<div>${esc(nk.trait)}</div>` +
        `<div>${esc(pl.how)} ${esc(pl.relationText)}</div>` +
        `<small>${nakMeta(e.nakshatra)} · ${esc(pl.nature)} nature (${esc(ni.sk)}): ${esc(ni.tendency)}</small>` +
        `<small>Pada ${pl.pada.pada}: ${esc(pl.pada.navamsaSign)} navamsa · ${esc(pl.pada.purushartha)} flavour (${esc(pl.pada.focus)})</small>` +
        `<small><b>Strengths:</b> ${lst(pl.strengths)}<br><b>Points to watch:</b> ${lst(pl.shadows)}<br><b>Supportive practice:</b> ${esc(pl.practices[0])} ${esc(pl.practices[1])}</small>` +
        `<small>${esc(pl.lordNote || '')}<br>Suits: ${esc(nk.careers)} · Watch: ${esc(nk.watch)}</small></div>`);
    } else L.push(line('Nakshatra', '', e.nakshatra.trait, `${nakMeta(e.nakshatra)}<br>Suits: ${esc(e.nakshatra.careers)} · Watch: ${esc(e.nakshatra.watch)}`));
  }
  e.status.forEach(s => L.push(line({ retrograde:'Retrograde', combust:'Combust', vargottama:'Vargottama' }[s.key] || s.key, '', s.text)));
  e.conjunct.forEach(x => L.push(line(`Conjunct ${esc(x.with)}`, '', x.text)));
  e.aspectedBy.forEach(x => L.push(line(`Aspected by ${esc(x.from)}`, HELPFUL.includes(x.from) ? chip('g', 'helpful') : PRESS.includes(x.from) ? chip('b', 'pressuring') : '', strip(x.text))));
  e.aspectsHouses.forEach(a => L.push(line(`Aspect on the ${ordn(a.house)} house`, '', a.text)));
  e.lordOf.forEach(y => { const hl = R(c).houseLords[y - 1]; if (hl && hl.text) L.push(line(`Lord of the ${ordn(y)} house`, '', hl.text)); });
  return `<div class="rd-h">📖 Deep reading</div>${L.join('')}`;
}

/* ---------- Now tab: what the running dasha lords tend to bring ---------- */
function dashaBlock(c, md, ad){
  const r = R(c), out = [];
  [[md, 'Mahadasha'], [ad, 'Antardasha']].forEach(([n, role]) => {
    const e = n && r.planets[n], d = n && D.dasha[n]; if (!e || !d) return;
    out.push(note('', `📖 <b>${esc(n)} ${role}${role === 'Mahadasha' ? ' (' + esc(d.years) + ')' : ''}:</b> ${esc(d.text)}<br><small>${esc(n)} sits in the ${ordn(e.house)} house, so: ${esc(e.inHouse.text)}</small>`));
  });
  return out.join('');
}

/* ---------- the "📖 Deep reading" tab ---------- */
function pane(c){
  const r = R(c), asc = r.lagna.sign, ascIdx = SIGN.indexOf(asc), P = r.planets, out = [];
  const ll = r.houseLords[0], mo = P.Moon;
  out.push(note('g', `📖 <b>Deep reading</b>: classical meanings for every placement in this chart, house by house. Texts come from the built-in knowledge base; read them together, since each planet's result depends on its sign, house, aspects and the running period.`));
  out.push(note('', `🧭 <b>${esc(asc)} rising.</b> ${esc(r.lagna.text)}<br><small>${esc(ll.lord)}: ${esc(ll.text)}</small>`));
  out.push(note('', `🌙 <b>Moon in ${esc(mo.sign)}${mo.nakshatra ? ', ' + esc(mo.nakshatra.name) : ''}.</b> ${esc(D.moonSign[mo.sign])}${mo.nakshatra ? ' ' + esc(mo.nakshatra.trait) + `<br><small>${nakMeta(mo.nakshatra)} · Suits: ${esc(mo.nakshatra.careers)} · Watch: ${esc(mo.nakshatra.watch)}</small>` : ''}`));
  const nkc = NK(c);
  if (nkc && nkc.moon){ const m = nkc.moon;
    out.push(note('', `🌟 <b>Birth star: ${esc(m.nakshatra)}, pada ${m.pada.pada}.</b> ${esc(m.how)} In close relationships you tend to be ${esc(m.relating)}.<br><small><b>Wellbeing theme:</b> ${esc(m.wellbeing)}. <b>Strengths:</b> ${lst(m.strengths)}. <b>Points to watch:</b> ${lst(m.shadows)}. <b>Supportive practice:</b> ${esc(m.practices[0])}<br>Pada ${m.pada.pada} falls in ${esc(m.pada.navamsaSign)} navamsa, adding a ${esc(m.pada.purushartha)} flavour (${esc(m.pada.focus)}). Life began in a ${esc(m.dashaStart.lord)} Mahadasha${m.dashaStart.balanceYears != null ? ' with about ' + (Math.round(m.dashaStart.balanceYears * 10) / 10) + ' years left in it' : ''}.</small>`)); }
  if (nkc && nkc.lagna){ const g = nkc.lagna;
    out.push(note('', `🧭 <b>Rising nakshatra: ${esc(g.nakshatra)}, pada ${g.pada.pada}.</b> ${esc(g.how)} In dealings with others you tend to be ${esc(g.relating)}.<br><small><b>Strengths:</b> ${lst(g.strengths)}. <b>Points to watch:</b> ${lst(g.shadows)}. <b>Supportive practice:</b> ${esc(g.practices[0])} Pada ${g.pada.pada}: ${esc(g.pada.navamsaSign)} navamsa, ${esc(g.pada.purushartha)} flavour (${esc(g.pada.focus)}).</small>`)); }
  const chips = Object.entries(r.functional).map(([p, v]) => chip(v.kind === 'Yogakaraka' || v.kind === 'Functional benefic' ? 'g' : v.kind === 'Functional malefic' ? 'b' : '', `${glyph(p)} ${p}: ${v.kind.replace('Functional ', '')}`)).join('');
  out.push(note('g', `⚖️ <b>Functional nature for ${esc(asc)} rising</b> (rule of thumb from the houses each planet rules)<br>${chips}`));
  PL.forEach(a => (P[a] ? P[a].conjunct : []).forEach(x => { if (PL.indexOf(x.with) > PL.indexOf(a)) out.push(note('', `🔗 <b>${esc(a)} + ${esc(x.with)} together in ${esc(P[a].sign)}.</b> ${esc(x.text)}`)); }));
  const cards = [];
  for (let n = 1; n <= 12; n++){
    const H = D.houses[n - 1], si = (ascIdx + n - 1) % 12, S = D.signs[si], hl = r.houseLords[n - 1];
    const occ = PL.filter(p => P[p] && P[p].house === n), asp = PL.filter(p => P[p] && P[p].house !== n && P[p].aspectsHouses.some(a => a.house === n));
    const body = [];
    body.push(`<div class="rd-w"><b>Meaning:</b> ${esc(H.rules)}. <small>(${esc(H.kind)}; body: ${esc(H.body)})</small></div>`);
    body.push(`<div class="rd-w"><b>${esc(S.name)} on the house</b> (${esc(S.style)}), ruled by ${esc(S.lord)}.</div>`);
    body.push(line(`Lord: ${esc(hl.lord)}`, '', hl.text));
    if (occ.length) occ.forEach(p => body.push(line(`${glyph(p)} ${esc(p)} sits here`, chip(toneCls(P[p].inHouse.tone), P[p].inHouse.tone), P[p].inHouse.text)));
    else body.push(`<div class="rd-w">No planet sits here, so the lord's placement and the aspects below carry this house.</div>`);
    H.karaka.split(/,\s*/).forEach(k => { if (P[k]) body.push(`<div class="rd-w"><b>Natural significator ${esc(k)}</b> is in the ${ordn(P[k].house)} house in ${esc(P[k].sign)}.</div>`); });
    asp.forEach(p => body.push(line(`${glyph(p)} ${esc(p)} aspects this house`, HELPFUL.includes(p) ? chip('g', 'helpful') : PRESS.includes(p) ? chip('b', 'pressuring') : '', D.aspectOnHouse[p][n - 1])));
    body.push(`<div class="rd-w dr-ask">💡 ${esc(H.ask)}</div>`);
    const tag = occ.length ? occ.map(glyph).join(' ') : 'empty';
    cards.push(`<details class="vx-pl"${n === 1 ? ' open' : ''}><summary><span class="vx-gl">${n}</span><div><b>${ordn(n)} house: ${esc(H.name)}</b><small>${esc(S.name)} · lord ${esc(hl.lord)} in the ${ordn(hl.placedIn)}</small></div>${chip(occ.length ? 'g' : '', tag)}</summary><div class="rd-b">${body.join('')}</div></details>`);
  }
  out.push(`<div class="rd-h">House by house</div>`);
  return out.join('') + cards.join('');
}

/* ---------- plain text for the downloadable report ---------- */
function wrap(s, w, ind){
  const words = String(s).replace(/\s+/g, ' ').trim().split(' '), o = []; let cur = '';
  words.forEach(wd => { if ((cur + ' ' + wd).trim().length > w){ o.push(cur); cur = wd; } else cur = (cur + ' ' + wd).trim(); });
  if (cur) o.push(cur);
  return o.map((l, i) => (i ? ind : '') + l).join('\n');
}
function reportText(c){
  const r = R(c), asc = r.lagna.sign, ascIdx = SIGN.indexOf(asc), P = r.planets, W = 74, o = [];
  const para = (label, text, ind) => o.push(wrap(label + ' ' + text, W, ind || '    '));
  const sub = t => { o.push(''); o.push(t); o.push('-'.repeat(t.length)); };
  o.push(wrap('Classical interpretations from the built-in knowledge base. Read the texts together: each planet\'s result depends on its sign, house, aspects and the running dasha. A starting point for a reading, not a final verdict.', W, ''));
  sub('FOUNDATION');
  para(`${asc} rising.`, r.lagna.text);
  para(`${r.houseLords[0].lord} (Lagna lord):`, r.houseLords[0].text);
  const mo = P.Moon; para(`Moon in ${mo.sign}${mo.nakshatra ? ', ' + mo.nakshatra.name + ' pada ' + mo.nakshatra.pada : ''}.`, D.moonSign[mo.sign] + (mo.nakshatra ? ' ' + mo.nakshatra.trait : ''));
  const nkr = NK(c);
  if (nkr && nkr.moon) para('Birth star:', nkr.moon.text.replace(/^[^.]*\.\)? ?/, ''));
  if (nkr && nkr.lagna) para('Rising nakshatra:', nkr.lagna.text);
  para(`Functional nature for ${asc} rising:`, Object.entries(r.functional).map(([p, v]) => `${p} ${v.kind.replace('Functional ', '').toLowerCase()}`).join('; ') + '.');
  PL.forEach(a => (P[a] ? P[a].conjunct : []).forEach(x => { if (PL.indexOf(x.with) > PL.indexOf(a)) para(`${a} + ${x.with} in ${P[a].sign}:`, x.text); }));
  PL.forEach(n => {
    const e = P[n]; if (!e) return;
    sub(`${n.toUpperCase()}: ${e.sign}, ${ordn(e.house)} house`);
    para(`In the ${ordn(e.house)} house [${e.inHouse.tone}]:`, e.inHouse.text);
    para(`In ${e.sign} (${(DIG[e.inSign.dignity] || [''])[0]}):`, strip(e.inSign.text));
    if (e.nakshatra){
      const pl = nkr && nkr.planets[n];
      if (pl) para(`Nakshatra ${pl.nakshatra} pada ${pl.pada.pada} (deity ${e.nakshatra.deity}, ${e.nakshatra.gana} gana, ${pl.nature} nature) [${pl.tone}]:`, `${e.nakshatra.trait} ${pl.text.replace(/^[^.]*\. /, '')} ${pl.lordNote || ''} Suits: ${e.nakshatra.careers}. Watch: ${e.nakshatra.watch}.`);
      else para(`Nakshatra ${e.nakshatra.name} pada ${e.nakshatra.pada} (deity ${e.nakshatra.deity}, ${e.nakshatra.gana} gana):`, `${e.nakshatra.trait} Suits: ${e.nakshatra.careers}. Watch: ${e.nakshatra.watch}.`);
    }
    e.status.forEach(s => para(`${s.key[0].toUpperCase() + s.key.slice(1)}:`, s.text));
    e.conjunct.forEach(x => para(`Conjunct ${x.with}:`, x.text));
    e.aspectedBy.forEach(x => para(`Aspected by ${x.from}:`, strip(x.text)));
    e.aspectsHouses.forEach(a => para(`Aspect on the ${ordn(a.house)} house:`, a.text));
    e.lordOf.forEach(y => { const hl = r.houseLords[y - 1]; if (hl && hl.text) para(`Lord of the ${ordn(y)} house:`, hl.text); });
  });
  for (let n = 1; n <= 12; n++){
    const H = D.houses[n - 1], S = D.signs[(ascIdx + n - 1) % 12], hl = r.houseLords[n - 1];
    const occ = PL.filter(p => P[p] && P[p].house === n);
    sub(`${ordn(n).toUpperCase()} HOUSE (${H.name}): ${S.name}${occ.length ? ' with ' + occ.join(', ') : ', empty'}`);
    para('Meaning:', H.rules + '.');
    para(`Lord ${hl.lord}:`, hl.text);
    occ.forEach(p => para(`${p} here [${P[p].inHouse.tone}]:`, P[p].inHouse.text));
    PL.filter(p => P[p] && P[p].house !== n && P[p].aspectsHouses.some(a => a.house === n)).forEach(p => para(`${p} aspects this house:`, D.aspectOnHouse[p][n - 1]));
  }
  return o.join('\n');
}

window.VDR = { pane, planetBlock, dashaBlock, reportText };
})();

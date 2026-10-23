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
const TRS_fmt = jd => (typeof TRS !== 'undefined' && jd != null && typeof jdToDate === 'function') ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][jdToDate(jd).getUTCMonth()] + ' ' + jdToDate(jd).getUTCFullYear() : 'an open date';
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
const VMFC = new WeakMap();
const SG = c => { if (typeof VMF === 'undefined' || !VMF) return null; let r = VMFC.get(c); if (!r){ r = VMF.signature(c); VMFC.set(c, r); } return r; };
const sigNote = s => note('g', `✨ <b>Your signature at a glance</b>` + s.items.map(x => `<div class="dr-sig">${x.icon} <b>${esc(x.title)}.</b> ${esc(x.text)}</div>`).join(''));
// ---- dasha layer (VDA): life timeline, running period, next 5 years ----
const DVC = new WeakMap();
const DVA = c => { if (typeof VDA === 'undefined' || !VDA) return null; let r = DVC.get(c); if (!r){ r = VDA.current(c); DVC.set(c, r); } return r; };
function periodBody(p){
  return `<div class="rd-w"><b>This stage tends to be about</b> ${esc(p.theme)}. It often feels like ${esc(p.feelsLike)}.</div><div class="rd-w">${esc(p.arenaText)}</div>` +
    `<div class="rd-w"><ul class="dr-ul">${p.scenes.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>` +
    `<div class="rd-w"><b>Helps:</b> ${esc(p.helps.join(' '))} <b>Watch for:</b> ${esc(p.watch.join(' and '))}.</div>` +
    `<div class="dr-check"><b>Check this against your life</b><br>• ${esc(p.reflect)}</div><div class="rd-w"><small>Tone: ${esc(p.tone)} (${esc(p.why.join('; '))}). A rule of thumb from the rising sign, dignity and house.</small></div>`;
}
function dashaBlockV(dv){
  const out = [note('', `📖 <b>${esc(dv.md.lord)} Mahadasha, ${VDA.fmt(dv.md.start)} to ${VDA.fmt(dv.md.end)}</b> ${chip(toneCls(dv.md.tone), dv.md.tone)}<br>${esc(dv.md.arenaText)} It tends to be about ${esc(dv.md.theme)}.<br><small>${esc(dv.md.reflect)}</small>`)];
  if (dv.ad) out.push(note('', `📖 <b>${esc(dv.ad.lord)} Antardasha, ${VDA.fmt(dv.ad.start)} to ${VDA.fmt(dv.ad.end)}</b> ${chip(toneCls(dv.ad.tone), dv.ad.tone)}<br>${esc(dv.ad.blend)} ${esc(dv.ad.houseNote)}<br><small>${esc(dv.ad.scene)}</small>`));
  return out.join('');
}
function timelineHtml(c){
  if (typeof VDA === 'undefined' || !VDA) return '';
  const T = VDA.timeline(c), up = VDA.upcoming(c, 5);
  const cards = T.periods.map((p, i) => `<details class="vx-pl"${p.status === 'now' ? ' open' : ''}><summary><span class="vx-gl">${glyph(p.lord)}</span><div><b>${esc(p.lord)} Mahadasha: ${p.startYear} to ${p.endYear}</b><small>age ${p.ageStart} to ${p.ageEnd} · ${esc(p.tone)}</small></div>${chip(p.status === 'now' ? 'g' : '', p.status === 'now' ? 'now' : p.status)}</summary><div class="rd-b">${periodBody(p)}</div></details>`).join('');
  const rows = up.map(r => `<div class="rd-w"><b>${VDA.fmt(r.start)} to ${VDA.fmt(r.end)}</b> · ${esc(r.mdLord)}–${esc(r.lord)} ${chip(toneCls(r.tone), r.tone)}<br><small>${esc(r.blend)} ${esc(r.houseNote)}</small></div>`).join('');
  return `<div class="rd-h">⏳ Life timeline</div>` + note('g', esc(VDA.data.intro)) + cards + (up.length ? `<div class="rd-h">Next 5 years, sub-period by sub-period</div><div class="rd-b">${rows}</div>` : note('', 'This chart is past the 120-year Vimshottari cycle, so there is no running period to look ahead from.'));
}
function timelineText(c, sub, para){
  if (typeof VDA === 'undefined' || !VDA) return;
  const T = VDA.timeline(c); sub('LIFE TIMELINE (Vimshottari dasha)');
  para('How to read this:', VDA.data.intro);
  T.periods.forEach(p => { para(`[${p.status}]`, p.text); para('Check this against your life:', p.reflect); });
  const upc = VDA.upcoming(c, 5); if (upc.length) sub('NEXT 5 YEARS, SUB-PERIOD BY SUB-PERIOD');
  upc.forEach(r => para(`${VDA.fmt(r.start)} to ${VDA.fmt(r.end)}, ${r.mdLord}-${r.lord} [${r.tone}]:`, `${r.blend} ${r.houseNote}`));
}
// "in real life": planet (what you do) x house (where) x sign (how), with self-check questions
function realLife(c, n){
  if (typeof VMF === 'undefined' || !VMF) return '';
  const pe = c.planets[n], m = pe && VMF.placement(n, pe.house, pe.sign, pe.dignity && pe.dignity.status); if (!m) return '';
  return `<div class="dr-l dr-live"><b>🔎 In real life: ${esc(m.headline)}</b>` +
    `<ul class="dr-ul">${m.practice.map(x => `<li>${esc(x.line)}</li>`).join('')}</ul>` +
    `<div>${esc(m.others)} ${esc(m.inside)}</div>` +
    `<small>${esc(m.atBest)} ${esc(m.underStress)} ${esc(m.styleLine)}${m.cue ? ' ' + esc(m.cue) : ''}</small>` +
    `<div class="dr-check"><b>Check this against your life</b><br>• ${esc(m.reflect[0])}<br>• ${esc(m.reflect[1])}<br><small>${esc(m.note)}</small></div></div>`;
}
const nakMeta = n => `${esc(n.name)}${n.pada ? ' pada ' + n.pada : ''} · ruled by ${esc(n.lord)} · deity ${esc(n.deity)} · symbol ${esc(n.symbol)} · ${esc(n.gana)} gana`;

/* ---------- Planets tab: extra block inside each planet card ---------- */
function planetBlock(c, n){
  const e = R(c).planets[n]; if (!e) return '';
  const L = [], dg = DIG[e.inSign.dignity] || ['', ''];
  const rl = realLife(c, n); if (rl) L.push(rl);
  L.push(line(`In the ${ordn(e.house)} house`, chip(toneCls(e.inHouse.tone), e.inHouse.tone), e.inHouse.text));
  L.push(line(`In ${e.sign}`, chip(dg[1], dg[0]), strip(e.inSign.text)));
  if (e.nakshatra){
    const pl = NK(c) && NK(c).planets[n];
    if (pl){
      const nk = VNK.nakshatra(pl.nakIndex), ni = nk.natureInfo;
      L.push(`<div class="dr-l"><b>Nakshatra: ${esc(pl.nakshatra)}, pada ${pl.pada.pada}</b>${chip(TONE_CLS[pl.tone], RELLAB[pl.relation.kind])}<div>${esc(nk.trait)}</div>` +
        `<div>${esc(pl.how)} ${esc(pl.relationText)}</div>` +
        `<div>In everyday life, you may ${esc(pl.manifest.scene)}.</div>` +
        `<small>Others may experience you as ${esc(pl.manifest.others)}. At its best you ${esc(pl.manifest.atBest)}; under strain you may ${esc(pl.manifest.underStress)}.</small>` +
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
  const dv = DVA(c); if (dv) return dashaBlockV(dv);
  const r = R(c), out = [];
  [[md, 'Mahadasha'], [ad, 'Antardasha']].forEach(([n, role]) => {
    const e = n && r.planets[n], d = n && D.dasha[n]; if (!e || !d) return;
    out.push(note('', `📖 <b>${esc(n)} ${role}${role === 'Mahadasha' ? ' (' + esc(d.years) + ')' : ''}:</b> ${esc(d.text)}<br><small>${esc(n)} sits in the ${ordn(e.house)} house, so: ${esc(e.inHouse.text)}</small>`));
  });
  return out.join('');
}

/* ---------- the "📖 Deep reading" tab ---------- */
function pane(c){
  const r = R(c), asc = r.lagna.sign, ascIdx = SIGN.indexOf(asc), P = r.planets, out = [], S = { intro: [], you: [], planets: [], yogas: [], doshas: [], areas: [], vargas: [], time: [], transits: [], houses: [] };
  const ll = r.houseLords[0], mo = P.Moon;
  S.intro.push(note('g', `📖 <b>Deep reading</b>: classical meanings for every placement in this chart, house by house. Texts come from the built-in knowledge base; read them together, since each planet's result depends on its sign, house, aspects and the running period.`));
  const sg = SG(c); if (sg) S.intro.push(sigNote(sg));
  if (typeof PDFR !== 'undefined' && PDFR) S.intro.push(`<button type="button" class="dr-pdf" data-pdf-studio>📄 Generate the full PDF book of this reading</button>`);
  S.you.push(note('', `🧭 <b>${esc(asc)} rising.</b> ${esc(r.lagna.text)}<br><small>${esc(ll.lord)}: ${esc(ll.text)}</small>`));
  S.you.push(note('', `🌙 <b>Moon in ${esc(mo.sign)}${mo.nakshatra ? ', ' + esc(mo.nakshatra.name) : ''}.</b> ${esc(D.moonSign[mo.sign])}${mo.nakshatra ? ' ' + esc(mo.nakshatra.trait) + `<br><small>${nakMeta(mo.nakshatra)} · Suits: ${esc(mo.nakshatra.careers)} · Watch: ${esc(mo.nakshatra.watch)}</small>` : ''}`));
  const mpf = (typeof VMF !== 'undefined' && VMF) ? VMF.moonProfile(c.planets.Moon.sign) : null;
  if (mpf) S.you.push(note('', `🌙 <b>Your Moon in more detail.</b> ${esc(mpf.text)}<br><small>${esc(mpf.reflect)}</small>`));
  const nkc = NK(c);
  if (nkc && nkc.moon){ const m = nkc.moon;
    S.you.push(note('', `🌟 <b>Birth star: ${esc(m.nakshatra)}, pada ${m.pada.pada}.</b> ${esc(m.how)} In close relationships you tend to be ${esc(m.relating)}.<br><small><b>Wellbeing theme:</b> ${esc(m.wellbeing)}. <b>Strengths:</b> ${lst(m.strengths)}. <b>Points to watch:</b> ${lst(m.shadows)}. <b>Supportive practice:</b> ${esc(m.practices[0])}<br>Pada ${m.pada.pada} falls in ${esc(m.pada.navamsaSign)} navamsa, adding a ${esc(m.pada.purushartha)} flavour (${esc(m.pada.focus)}). Life began in a ${esc(m.dashaStart.lord)} Mahadasha${m.dashaStart.balanceYears != null ? ' with about ' + (Math.round(m.dashaStart.balanceYears * 10) / 10) + ' years left in it' : ''}.</small>`)); }
  if (nkc && nkc.lagna){ const g = nkc.lagna;
    S.you.push(note('', `🧭 <b>Rising nakshatra: ${esc(g.nakshatra)}, pada ${g.pada.pada}.</b> ${esc(g.how)} In dealings with others you tend to be ${esc(g.relating)}.<br><small><b>Strengths:</b> ${lst(g.strengths)}. <b>Points to watch:</b> ${lst(g.shadows)}. <b>Supportive practice:</b> ${esc(g.practices[0])} Pada ${g.pada.pada}: ${esc(g.pada.navamsaSign)} navamsa, ${esc(g.pada.purushartha)} flavour (${esc(g.pada.focus)}).</small>`)); }
  const chips = Object.entries(r.functional).map(([p, v]) => chip(v.kind === 'Yogakaraka' || v.kind === 'Functional benefic' ? 'g' : v.kind === 'Functional malefic' ? 'b' : '', `${glyph(p)} ${p}: ${v.kind.replace('Functional ', '')}`)).join('');
  S.planets.push(note('g', `⚖️ <b>Functional nature for ${esc(asc)} rising</b> (rule of thumb from the houses each planet rules)<br>${chips}`));
  if (typeof VMF !== 'undefined' && VMF){ const rl = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'].map(n => VMF.role(n, c.ascendant.sign)).filter(Boolean);
    S.planets.push(note('', `🎭 <b>What each planet's role means for you</b><br><small>${rl.map(x => `<b>${esc(x.planet)}</b> (${esc(x.kind.replace('Functional ', ''))}, ${x.rules.length > 1 ? 'houses' : 'house'} ${x.rules.join(' and ')}): It ${esc(x.gives)}. It can feel ${esc(x.feels)}. Watch for ${esc(x.watch)}.`).join('<br>')}</small>`)); }
  PL.forEach(a => (P[a] ? P[a].conjunct : []).forEach(x => { if (PL.indexOf(x.with) > PL.indexOf(a)) S.planets.push(note('', `🔗 <b>${esc(a)} + ${esc(x.with)} together in ${esc(P[a].sign)}.</b> ${esc(x.text)}`)); }));
  const yg = (typeof YGE !== 'undefined' && YGE) ? YGE.detect(c) : [];
  const isD = x => /^Doshas|^Cautions/.test(x.cat), yOne = x => note(x.tone === 'challenge' ? 'b' : x.tone === 'mixed' ? '' : 'g', `<b>${esc(x.name)}</b>${x.level ? ' ' + chip(x.level === 'strong' ? 'g' : x.level === 'mild' ? 'b' : '', x.level) : ''} <small>(${esc(x.cat)})</small><br><small><b>Why it shows:</b> ${esc(x.why)}.</small><br>${esc(x.text.replace(/^[^.]*\.( Why it shows in your chart: [^.]*\.)? /, '').replace(/ Check this against your life: .*$/, ''))}<br><small>${esc(x.ask)}</small>${window.PSTUI ? PSTUI.yogaHtml(c, x) : ''}`);
  const grp = (list, into) => { const cats = []; list.forEach(x => { if (cats.indexOf(x.cat) < 0) cats.push(x.cat); }); cats.forEach(k => { const m = list.filter(x => x.cat === k); into.push(`<details class="dr-grp" open><summary>${esc(k)} <span class="dr-n">${m.length}</span></summary><div class="dr-grp-b">${m.map(yOne).join('')}</div></details>`); }); };
  const ygGood = yg.filter(x => !isD(x)), ygDos = yg.filter(isD);
  if (ygGood.length){ S.yogas.push(note('g', `🔮 <b>Yogas in your chart (${ygGood.length})</b><br><small>Planet combinations found by exact rules, grouped by kind. Each one is a tendency to test against your life, not a promise.</small>`)); grp(ygGood, S.yogas); }
  if (ygDos.length){ S.doshas.push(note('', `⚠️ <b>Points that need care (${ygDos.length})</b><br><small>These are areas to look after, not verdicts. Many have conditions that ease them; those are listed with each point.</small>`)); grp(ygDos, S.doshas); }
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
  const la = (typeof LAE !== 'undefined' && LAE) ? LAE.assess(c) : null;
  const ln = (la && typeof LAN !== 'undefined' && LAN) ? LAN.all(c) : [], lnOf = id => ln.find(y => y.id === id);
  const dd = (la && typeof ADD !== 'undefined' && ADD) ? ADD.all(c) : [], ddOf = id => dd.find(y => y.id === id);
  if (la){ S.areas.push(note('g', `📊 <b>Nine areas of life, compared</b><br><small>Each score (0 to 100) blends house strength, the strength of the house lords and natural significators, the matching divisional chart, related yogas and the running dasha. It compares the areas inside your own chart. It is not a prediction.</small>`));
    la.areas.forEach(x => S.areas.push(`<div class="dr-area"><div class="dr-ah"><span class="dr-ai">${x.icon}</span><b>${esc(x.name)}</b>${chip(x.bandTone, x.band)}<span class="dr-as">${x.score}</span></div><div class="dr-bar"><i class="${x.bandTone || 'm'}" style="width:${x.score}%"></i></div>` +
      `<div class="dr-parts">${[['house', 'Houses'], ['lords', 'Lords'], ['karaka', 'Significators'], ['varga', 'Divisional'], ['yogas', 'Yogas'], ['dasha', 'Timing']].map(k => `<span>${k[1]} <b>${x.parts[k[0]]}</b></span>`).join('')}</div>` +
      (x.pos.length ? `<ul class="dr-ul">${x.pos.map(t => `<li>✔ ${esc(t)}.</li>`).join('')}${x.neg.map(t => `<li>▲ ${esc(t)}.</li>`).join('')}</ul>` : '') +
      `<div class="rd-w"><b>Right now:</b> ${esc(x.now.why.join('; ') || 'no direct link to this area')}. <small>(${x.now.score}/100)</small></div><div class="rd-w"><b>Next five years:</b> ${esc(x.next5.why.join('; '))}. <small>(${x.next5.score}/100)</small></div>${lnOf(x.id) ? `<details class="dr-story"><summary>📖 Read the full story (about ${Math.round(lnOf(x.id).words / 10) * 10} words)</summary>${lnOf(x.id).paragraphs.map(q => `<h5>${esc(q.h)}</h5><p>${esc(q.text)}</p>`).join('')}</details>` : ''}${ddOf(x.id) ? `<details class="dr-story dr-deep"><summary>🔬 Deep dive: strengths, weak points and direction across all charts (about ${Math.round(ddOf(x.id).words / 50) * 50} words)</summary>${ddOf(x.id).sections.map(q => `<h5>${esc(q.h)}</h5><p>${esc(q.text)}</p>`).join('')}</details>` : ''}</div>`)); }
  const vg = (typeof VGR !== 'undefined' && VGR) ? VGR.all(c) : [];
  if (vg.length){ S.vargas.push(note('g', `🔭 <b>Six zoom-in charts</b><br><small>Each divisional chart looks at one area of life in detail. Open one to see its rising sign, the houses that matter, every planet and how comfortable it is there.</small>`));
    vg.forEach(x => S.vargas.push(`<details class="dr-vg"><summary><b>${esc(x.name)}</b> <small>${esc(x.short)}</small>${chip(x.bandTone, x.band)}<span class="dr-as">${x.score}</span></summary><div class="dr-vg-b">${x.paragraphs.map(q => `<h5>${esc(q.h)}</h5><p>${esc(q.text)}</p>`).join('')}</div></details>`)); }
  const trs = (typeof TRS !== 'undefined' && TRS) ? TRS.assess(c, (typeof currentProfileForExport !== 'undefined') ? currentProfileForExport : null) : null;
  if (trs){
    S.transits.push(note('g', `🪐 <b>The slow planets, now and over the next three years</b><br><small>${esc(trs.note)}</small>`));
    if (!trs.available) S.transits.push(note('', esc(trs.notes.join(' '))));
    else {
      trs.notes.forEach(n => S.transits.push(note('b', esc(n))));
      S.transits.push(note('', `<b>In short:</b> ${trs.summary.map(esc).join(' ')}`));
      if (trs.sade.active.length) trs.sade.active.forEach(x => S.transits.push(`<div class="dr-area"><div class="dr-ah"><span class="dr-ai">⏳</span><b>${esc(x.kind)}: ${esc(x.name)}</b>${chip(x.level === 'lighter' ? 'g' : x.level === 'heavier' ? 'b' : '', x.level)}</div><p class="dr-p">${esc(x.text)}</p></div>`));
      else S.transits.push(note('', `<b>Sade Sati and Dhaiya:</b> not running now. ${esc(trs.sade.next ? trs.sade.next.text : '')}`));
      S.transits.push(`<details class="dr-vg"><summary><b>All Sade Sati and Dhaiya periods of your life</b></summary><div class="dr-vg-b">${trs.sade.cycles.map(cy => `<h5>${esc(cy.kind)} <small>${cy.status === 'now' ? 'running now' : cy.status === 'past' ? 'past' : 'ahead'}</small></h5><p>${cy.phases.map(p => `${esc(p.name)} (${esc(p.sign)}): ${TRS_fmt(p.start)} to ${TRS_fmt(p.end)}`).join('; ')}.</p>`).join('')}</div></details>`);
      S.transits.push(`<div class="dr-w-h">Where the slow planets are now</div>` + trs.gochar.map(g => note(g.tone === 'helpful' ? 'g' : '', `<b>${esc(g.planet)}</b> ${chip(g.tone === 'helpful' ? 'g' : 'b', g.tone)}<br>${esc(g.text)}`)).join(''));
      S.transits.push(`<details class="dr-vg"><summary><b>Sign changes in the next three years</b> <small>${trs.calendar.length} dates</small></summary><div class="dr-vg-b">${trs.calendar.map(x => `<p>${esc(x.text)}</p>`).join('')}</div></details>`);
      const LA = LAE.assess(c).areas;
      S.transits.push(`<div class="dr-w-h">Year by year, area by area</div><div class="dr-ol"><div class="dr-or dr-oh"><span></span>${[0, 1, 2].map(i => `<span>Year ${i + 1}</span>`).join('')}</div>${LA.map(a => `<div class="dr-or"><span>${a.icon} ${esc(a.name)}</span>${trs.outlook[a.id].map(o => `<span class="dr-oc ${o.bandTone || 'm'}" title="${esc(o.text)}">${o.score}</span>`).join('')}</div>`).join('')}</div><div class="rd-w"><small>Year 1 runs from now for twelve months. Each number blends your natal score for the area, the dasha running in the middle of that year and how long Jupiter and Saturn together influence the area's houses (the double transit).</small></div>`);
      S.transits.push(`<details class="dr-vg"><summary><b>Double-transit windows by area</b> <small>Jupiter and Saturn together</small></summary><div class="dr-vg-b">${LA.map(a => `<h5>${esc(a.icon)} ${esc(a.name)}</h5>${trs.double[a.id].length ? trs.double[a.id].map(w => `<p>${esc(w.text)}</p>`).join('') : '<p>No double transit on this area in the next three years.</p>'}`).join('')}</div></details>`);
    }
  }
  S.time.push(timelineHtml(c));
  S.houses = cards;
  const SEC = [['intro', '✨', 'Overview', 'Start here: what this reading is and your signature at a glance'], ['you', '🧭', 'Who you are', 'Rising sign, Moon and birth star'],
    ['planets', '🪐', 'Planet roles', 'What each planet does for you, and how they work together'], ['yogas', '🔮', 'Yogas', 'Supportive and notable planet combinations'],
    ['doshas', '⚠️', 'Points to watch', 'Areas that need extra care, with what eases them'], ['areas', '📊', 'Life areas', 'Career, money, marriage and six more, scored and explained'], ['vargas', '🔭', 'Divisional charts', 'Marriage, career, children, property, learning and spirit in detail'], ['time', '⏳', 'Life timeline', 'Every Mahadasha, now and the next five years'], ['transits', '🪐', 'Transits and Sade Sati', 'What the slow planets are doing now and next'], ['houses', '🏠', 'House by house', 'The twelve areas of life, one card each']]
    .filter(x => S[x[0]].length), nav = SEC.map((x, i) => `<button type="button" class="dr-nb" data-sec="${x[0]}">${x[1]} ${esc(x[2])}</button>`).join('');
  return `<nav class="dr-nav" aria-label="Sections of the reading">${nav}</nav>` + SEC.map((x, i) => `<section class="dr-sec" data-sec="${x[0]}"><div class="dr-sh"><span class="dr-sn">${i + 1}</span><div><b>${esc(x[2])}</b><small>${esc(x[3])}</small></div></div>${S[x[0]].join('')}</section>`).join('');
}

document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.dr-nb'); if (!b) return; const root = b.closest('.vx-pane') || document, t = root.querySelector('.dr-sec[data-sec="' + b.dataset.sec + '"]'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });

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
  const sgr = SG(c);
  if (sgr){ sub('YOUR SIGNATURE AT A GLANCE'); sgr.items.forEach(x => para(x.title + ':', x.text)); }
  sub('FOUNDATION');
  para(`${asc} rising.`, r.lagna.text);
  para(`${r.houseLords[0].lord} (Lagna lord):`, r.houseLords[0].text);
  const mo = P.Moon; para(`Moon in ${mo.sign}${mo.nakshatra ? ', ' + mo.nakshatra.name + ' pada ' + mo.nakshatra.pada : ''}.`, D.moonSign[mo.sign] + (mo.nakshatra ? ' ' + mo.nakshatra.trait : ''));
  if (typeof VMF !== 'undefined' && VMF){ const mpr = VMF.moonProfile(c.planets.Moon.sign); if (mpr) para('Your Moon in more detail:', mpr.text); }
  const nkr = NK(c);
  if (nkr && nkr.moon) para('Birth star:', nkr.moon.text.replace(/^[^.]*\.\)? ?/, ''));
  if (nkr && nkr.lagna) para('Rising nakshatra:', nkr.lagna.text);
  para(`Functional nature for ${asc} rising:`, Object.entries(r.functional).map(([p, v]) => `${p} ${v.kind.replace('Functional ', '').toLowerCase()}`).join('; ') + '.');
  if (typeof VMF !== 'undefined' && VMF) ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'].forEach(n => { const x = VMF.role(n, c.ascendant.sign); if (x) para(`${n} as ${x.kind.toLowerCase()}:`, x.text); });
  PL.forEach(a => (P[a] ? P[a].conjunct : []).forEach(x => { if (PL.indexOf(x.with) > PL.indexOf(a)) para(`${a} + ${x.with} in ${P[a].sign}:`, x.text); }));
  { const la2 = (typeof LAE !== 'undefined' && LAE) ? LAE.assess(c) : null; if (la2){ sub('LIFE AREAS (0-100, compared inside your own chart)'); la2.areas.forEach(x => para(`${x.name} - ${x.band} (${x.score}):`, x.headline.replace(/^[^.]*\.[^.]*\) ?/, '') + ' Right now: ' + (x.now.why.join('; ') || 'no direct link') + '. Next five years: ' + x.next5.why.join('; ') + '.')); if (typeof LAN !== 'undefined' && LAN) LAN.all(c).forEach(n => { sub(n.name.toUpperCase() + ' - THE FULL STORY'); n.paragraphs.forEach(q => para(q.h + ':', q.text)); }); if (typeof ADD !== 'undefined' && ADD) ADD.all(c).forEach(n => { sub(n.name.toUpperCase() + ' - DEEP DIVE (ALL CHARTS)'); n.sections.forEach(q => para(q.h + ':', q.text)); }); } }
  { if (typeof VGR !== 'undefined' && VGR){ const vgr = VGR.all(c); if (vgr.length){ sub('DIVISIONAL CHARTS'); vgr.forEach(x => { para(`${x.name} - ${x.band} (${x.score}):`, ''); x.paragraphs.forEach(q => para(q.h + ':', q.text)); }); } } }
  { if (typeof TRS !== 'undefined' && TRS){ const tr2 = TRS.assess(c, (typeof currentProfileForExport !== 'undefined') ? currentProfileForExport : null); sub('TRANSITS AND SADE SATI'); if (!tr2.available) para('Not shown:', tr2.notes.join(' ')); else { tr2.notes.forEach(n => para('Note:', n)); para('In short:', tr2.summary.join(' ')); tr2.sade.active.forEach(x => para(x.kind + ' - ' + x.name + ':', x.text)); if (!tr2.sade.active.length && tr2.sade.next) para('Sade Sati and Dhaiya:', 'Not running now. ' + tr2.sade.next.text); tr2.gochar.forEach(g => para(g.planet + ' now:', g.text)); tr2.calendar.forEach(x => para('Sign change:', x.text)); LAE.assess(c).areas.forEach(a => tr2.outlook[a.id].forEach(o => para(a.name + ', year ' + o.year + ':', o.text))); } } }
  { const yg2 = (typeof YGE !== 'undefined' && YGE) ? YGE.detect(c) : []; if (yg2.length){ sub('YOGAS IN YOUR CHART'); yg2.forEach(x => para(x.name + ':', x.text.replace(/^[^.]*\. /, ''))); } }
  PL.forEach(n => {
    const e = P[n]; if (!e) return;
    sub(`${n.toUpperCase()}: ${e.sign}, ${ordn(e.house)} house`);
    if (typeof VMF !== 'undefined' && VMF){ const pe = c.planets[n], m = VMF.placement(n, pe.house, pe.sign, pe.dignity && pe.dignity.status);
      if (m){ para('In real life:', m.practice.map(x => x.line).join(' ') + ' ' + m.others + ' ' + m.inside + ' ' + m.atBest + ' ' + m.underStress); para('Check this against your life:', m.reflect.join(' ')); } }
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
  timelineText(c, sub, para);
  return o.join('\n');
}

window.VDR = { pane, planetBlock, dashaBlock, reportText };
})();

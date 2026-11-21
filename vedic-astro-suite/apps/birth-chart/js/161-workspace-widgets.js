/* ASTROLOGER WORKSPACE WIDGETS (AWW): the native cards of the Workspace tab (docs/ASTRO_WORKSPACE_PLAN.md).
   AWW.render(id, chart, profile, options) -> HTML string for one widget (the catalogue and option lists are in AW.WIDGETS, js/160).
   Every widget reads the chart already on screen and the app's own engines (VDA, TRS, YGE, VMF, panchangaAt, chart.shadbala, chart.ashtakavarga);
   nothing here calculates astrology of its own. A widget that cannot draw returns a short plain message instead of throwing.
   Called only when a routine is opened, never at page load. Classes are aw- prefixed (css/50-workspace.css). */
(function(){
  'use strict';
  const SIGN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const PL = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'], P7 = PL.slice(0, 7);
  const GLY = { Sun: '☉', Moon: '☾', Mars: '♂', Mercury: '☿', Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋' };
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const ordn = n => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
  const dt = d => { d = new Date(d); return isNaN(d) ? '' : MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
  const deg = x => { const d = Math.floor(x), m = Math.floor((x - d) * 60); return d + '°' + String(m).padStart(2, '0') + '′'; };
  const chip = (t, c) => `<span class="aw-chip${c ? ' ' + c : ''}">${esc(t)}</span>`;
  const msg = t => `<p class="aw-msg">${esc(t)}</p>`;
  const tone = t => /support|help|benefic|good|strong/i.test(t || '') ? 'g' : /challeng|testing|strain|weak|malefic/i.test(t || '') ? 'b' : 'm';
  const scroll = h => `<div class="aw-scroll">${h}</div>`;
  const table = (head, rows) => scroll(`<table class="aw-tbl"><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td${i === 0 ? ' class="aw-f"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
  const gly = n => `<i class="aw-gl">${GLY[n] || ''}</i>`;
  const houseOf = (sign, asc) => ((sign - asc + 12) % 12) + 1;
  const AW_ = () => window.AW || { VARGA_ABOUT: {} };
  const vkey = k => /^D\d{1,3}$/.test(k) ? k : 'D1';
  const dignityChip = st => { if (!st) return ''; const t = String(st.label || st.status || ''); const s = String(st.status || ''); return chip(t.replace(/ \(.*\)/, '').replace(/ Sign$/, ''), /Exalt|Own|Moola/.test(s) ? 'g' : /Debil|Enemy/.test(s) ? 'b' : ''); };

  /* a chart drawn by the app's own SVG builders (they read window.__vgC) */
  function drawVarga(c, key, style){
    const V = c.vargas && c.vargas[key]; if (!V) return null;
    const prev = window.__vgC; window.__vgC = c;
    try { return style === 'south' ? buildSouthIndianSvg(V, null) : buildNorthIndianSvg(V, null); }
    catch (e) { return null; } finally { window.__vgC = prev; }
  }
  function chartBox(c, key, style, title){
    const svg = drawVarga(c, key, style), A = AW_().VARGA_ABOUT[key] || '';
    if (!svg) return msg(key + ' is not available for this chart.');
    const V = c.vargas[key];
    return `<figure class="aw-chartbox"><div class="aw-svg">${svg}</div><figcaption><b>${esc(title || key)}</b><span>${esc(A)}</span><span>Rising: ${esc(SIGN[V.ascendantSign])}</span></figcaption></figure>`;
  }

  const W = {};
  W.chart = (c, pf, o) => chartBox(c, vkey(o.varga), o.style === 'south' ? 'south' : 'north');
  W.chart2 = (c, pf, o) => `<div class="aw-two">${chartBox(c, vkey(o.a), o.style === 'south' ? 'south' : 'north')}${chartBox(c, vkey(o.b), o.style === 'south' ? 'south' : 'north')}</div>`;
  W.moonchart = (c, pf, o) => {
    const D1 = c.vargas.D1, ms = c.planets.Moon.sign, asc = D1.ascendantSign;
    const houses = Array.from({ length: 12 }, (_, i) => Object.assign({}, D1.houses[(ms + i - asc + 12) % 12], { houseNum: i + 1 }));
    const v = Object.assign({}, D1, { ascendantSign: ms, houses });
    const prev = window.__vgC; window.__vgC = c; let svg = null;
    try { svg = o.style === 'south' ? buildSouthIndianSvg(v, null) : buildNorthIndianSvg(v, null); } catch (e) { svg = null; } finally { window.__vgC = prev; }
    return svg ? `<figure class="aw-chartbox"><div class="aw-svg">${svg}</div><figcaption><b>Chandra Lagna</b><span>Counted from the Moon in ${esc(SIGN[ms])}</span></figcaption></figure>` : msg('The Moon chart could not be drawn.');
  };
  W.facts = (c, pf) => {
    const mo = c.planets.Moon, su = c.planets.Sun; let dn = ''; try { const cur = VDA.current(c); if (cur && cur.md) dn = cur.md.lord + (cur.ad ? ' / ' + cur.ad.lord : ''); } catch (e) {}
    const f = [['Lagna', SIGN[c.ascendant.sign], c.ascendant.nakshatra ? c.ascendant.nakshatra.name : ''], ['Moon', SIGN[mo.sign], mo.nakshatra ? mo.nakshatra.name + ' · pada ' + mo.nakshatra.pada : ''], ['Sun', SIGN[su.sign], su.nakshatra ? su.nakshatra.name : ''], ['Dasha now', dn || '–', 'mahadasha / antardasha']];
    return `<div class="aw-facts">${f.map(x => `<div class="aw-fact"><small>${esc(x[0])}</small><b>${esc(x[1])}</b><span>${esc(x[2])}</span></div>`).join('')}</div>`;
  };
  W.planets = (c, pf, o) => {
    const key = vkey(o.varga), V = c.vargas[key]; if (!V) return msg(key + ' is not available.');
    const asc = V.ascendantSign, pv = V.planetVargaSign || {};
    return table(['Planet', 'Sign', 'House', key === 'D1' ? 'Degree' : 'D1 sign', 'Nakshatra', 'State'], PL.filter(n => pv[n] != null).map(n => {
      const p = c.planets[n], s = pv[n]; let d = '';
      try { d = key === 'D1' ? deg(p.degInSign) : SIGN[p.sign]; } catch (e) {}
      let st = ''; try { st = dignityChip(key === 'D1' ? p.dignity : getDignity(n, s)); } catch (e) {}
      const extra = (p.retrograde ? chip('R', 'b') : '') + (p.combustion && p.combustion.combust ? chip('combust', 'b') : '');
      return [gly(n) + esc(n), esc(SIGN[s]), ordn(houseOf(s, asc)), esc(d), p.nakshatra ? esc(p.nakshatra.name) + ' ' + p.nakshatra.pada : '', st + extra];
    }));
  };
  W.houses = (c, pf, o) => {
    const key = vkey(o.varga), V = c.vargas[key]; if (!V) return msg(key + ' is not available.');
    const asc = V.ascendantSign, pv = V.planetVargaSign || {};
    return table(['House', 'Sign', 'Lord', 'Lord sits', 'Planets here'], V.houses.map((h, i) => {
      const lord = h.signLord, ls = pv[lord]; const occ = (h.planets || []).map(p => p.name);
      return [ordn(i + 1), esc(h.signName || SIGN[h.sign]), gly(lord) + esc(lord), ls == null ? '' : ordn(houseOf(ls, asc)) + ' · ' + esc(SIGN[ls]), occ.length ? occ.map(n => `<span class="aw-pn">${esc(n)}</span>`).join(' ') : '<span class="aw-dim">empty</span>'];
    }));
  };
  W.karakas = c => {
    const k = c.charaKarakas; if (!k) return msg('Chara Karakas are not available for this chart.');
    const short = { Atmakaraka: 'AK · soul', Amatyakaraka: 'AmK · career', Bhratrikaraka: 'BK · siblings', Matrikaraka: 'MK · mother', Putrakaraka: 'PuK · children', Gnatikaraka: 'GK · rivals', Darakaraka: 'DK · partner' };
    return table(['Role', 'Planet', 'Degree'], Object.keys(k).map(r => [esc(short[r] || r), gly(k[r].planet) + esc(k[r].planet), esc(deg(k[r].degree))]));
  };
  W.nakshatras = c => table(['Planet', 'Nakshatra', 'Pada', 'Lord', 'Deity'], PL.map(n => { const k = c.planets[n].nakshatra || {}; return [gly(n) + esc(n), esc(k.name), esc(k.pada), esc(k.lord), esc(k.deity)]; }));
  W.lagnas = c => {
    let S; try { S = computeAllSpecialLagnaSigns(c); } catch (e) { return msg('Special lagnas are not available.'); }
    const L = [['AL', 'Arudha Lagna', 'public image'], ['UL', 'Upapada', 'marriage'], ['KL', 'Karakamsha', 'soul calling'], ['HL', 'Hora Lagna', 'wealth'], ['GL', 'Ghati Lagna', 'power'], ['INDU', 'Indu Lagna', 'income'], ['SL', 'Sree Lagna', 'fortune'], ['VGL', 'Vighati Lagna', 'finer timing'], ['BL', 'Bhava Lagna', 'bhava'], ['SWAMSHA', 'Swamsha', 'inner path']];
    const asc = c.ascendant.sign, rows = L.filter(x => S[x[0]] != null && !isNaN(S[x[0]])).map(x => [`<b>${esc(x[0])}</b> ${esc(x[1])}`, esc(SIGN[S[x[0]]]), ordn(houseOf(S[x[0]], asc)) + ' house', `<span class="aw-dim">${esc(x[2])}</span>`]);
    return rows.length ? table(['Point', 'Sign', 'From Lagna', 'Looks at'], rows) : msg('Special lagnas are not available.');
  };
  function dashaBar(label, d){
    if (!d) return '';
    const s = new Date(d.start), e = new Date(d.end), n = Date.now(), pct = Math.max(0, Math.min(100, ((n - s) / (e - s)) * 100));
    return `<div class="aw-dash"><div class="aw-dh"><span>${esc(label)}</span><b>${gly(d.lord)}${esc(d.lord)}</b></div><div class="aw-track"><i style="width:${pct.toFixed(1)}%"></i></div><div class="aw-dd"><span>${esc(dt(s))}</span><span>${pct.toFixed(0)}% done</span><span>${esc(dt(e))}</span></div></div>`;
  }
  W.dashanow = c => {
    let cur; try { cur = VDA.current(c); } catch (e) { cur = null; }
    if (!cur || !cur.md) return msg('The dasha could not be worked out for this chart.');
    const md = cur.md, ad = cur.ad;
    let h = dashaBar('Mahadasha', md) + dashaBar('Antardasha', ad);
    h += `<div class="aw-read"><p><b>${esc(md.lord)} period.</b> ${esc(md.arenaText || '')}</p>` + (ad && ad.blend ? `<p>${esc(ad.blend)}</p>` : '') + `</div>`;
    return h + `<div class="aw-chips">${chip(md.tone || '', tone(md.tone))}${ad ? chip('sub-period: ' + (ad.tone || ''), tone(ad.tone)) : ''}</div>`;
  };
  W.dashanext = c => {
    let t; try { t = VDA.timeline(c); } catch (e) { t = null; }
    if (!t || !t.periods) return msg('The dasha list is not available.');
    const nx = t.periods.filter(p => p.status === 'ahead').slice(0, 4);
    if (!nx.length) return msg('No later periods in range.');
    return `<div class="aw-list">${nx.map(p => `<div class="aw-item"><div class="aw-it"><b>${gly(p.lord)}${esc(p.lord)}</b><span>${esc(p.startYear)}–${esc(p.endYear)} · age ${esc(p.ageStart)}–${esc(p.ageEnd)}</span>${chip(p.tone || '', tone(p.tone))}</div><p>${esc(p.theme ? 'A stage of ' + p.theme + '.' : '')} ${esc(p.arenaText || '')}</p></div>`).join('')}</div>`;
  };
  function trs(c, pf){ try { return TRS && TRS.assess(c, pf, { now: new Date() }); } catch (e) { return null; } }
  W.transits = (c, pf) => {
    const a = trs(c, pf); if (!a || !a.available || !a.gochar) return msg('Transit reading is not available for this chart.');
    return `<div class="aw-list">${a.gochar.map(g => `<div class="aw-item"><div class="aw-it"><b>${gly(g.planet)}${esc(g.planet)} in ${esc(g.sign)}</b><span>${esc(ordn(g.houseFromMoon))} from Moon · ${esc(ordn(g.houseFromLagna))} from Lagna</span>${chip(g.tone || '', tone(g.tone))}</div><p>${esc(g.text)}</p></div>`).join('')}</div>`;
  };
  W.sadesati = (c, pf) => {
    const a = trs(c, pf); if (!a || !a.available) return msg('Saturn timing is not available for this chart.');
    const act = (a.sade && a.sade.active) || [], sat = (a.gochar || []).find(g => g.planet === 'Saturn');
    let h = act.length ? act.map(x => `<div class="aw-read"><p><b>${esc(x.name || x.kind || 'Saturn over the Moon')}</b> ${esc(x.text || '')}</p></div>`).join('') : `<div class="aw-read"><p><b>Not running now.</b> ${esc((a.sade && a.sade.next && a.sade.next.text) || '')}</p></div>`;
    if (sat) h += `<div class="aw-chips">${chip('Saturn in ' + sat.sign)}${chip(ordn(sat.houseFromMoon) + ' from Moon')}${chip(sat.tone || '', tone(sat.tone))}</div>`;
    return h;
  };
  W.panchang = (c, pf) => {
    try {
      const n = new Date(), jd = toJulianDay(n.getUTCFullYear(), n.getUTCMonth() + 1, n.getUTCDate(), n.getUTCHours(), n.getUTCMinutes(), 0), P = panchangaAt(jd, +pf.lat, +pf.lon, +pf.tz);
      const f = [['Vara', P.vara.name, P.vara.lord], ['Tithi', P.tithi.paksha + ' ' + P.tithi.name, ''], ['Nakshatra', P.nakshatra.name, 'pada ' + P.nakshatra.pada], ['Yoga', P.yoga.name, ''], ['Karana', P.karana.name, P.karana.vishti ? 'Vishti' : '']];
      return `<div class="aw-facts">${f.map(x => `<div class="aw-fact"><small>${esc(x[0])}</small><b>${esc(x[1])}</b><span>${esc(x[2])}</span></div>`).join('')}</div><p class="aw-dim aw-sm">For the birth place, now.</p>`;
    } catch (e) { return msg('The panchang could not be worked out.'); }
  };
  W.shadbala = c => {
    const S = c.shadbala && c.shadbala.planets; if (!S) return msg('Shadbala is not available for this chart (it needs a birth time).');
    const rows = P7.filter(n => S[n]).map(n => { const p = S[n], pct = p.percentOfRequired || (p.totalRupas / p.requiredRupas * 100); return `<div class="aw-bar"><span>${gly(n)}${esc(n)}</span><div class="aw-track${pct >= 100 ? '' : ' lo'}"><i style="width:${Math.min(100, pct / 1.6).toFixed(1)}%"></i><u style="left:${(100 / 1.6).toFixed(1)}%"></u></div><b>${p.totalRupas.toFixed(1)}<small>/${p.requiredRupas}</small></b></div>`; });
    return `<div class="aw-bars">${rows.join('')}</div><p class="aw-dim aw-sm">Rupas against the minimum needed. The line marks the minimum.</p>`;
  };
  W.avsav = c => {
    const av = c.ashtakavarga && c.ashtakavarga.sav; if (!av) return msg('Ashtakavarga is not available for this chart.');
    const asc = c.ascendant.sign, v = Array.from({ length: 12 }, (_, h) => av[(asc + h) % 12]), avg = v.reduce((a, b) => a + b, 0) / 12, mx = Math.max(40, ...v);
    return `<div class="aw-cols">${v.map((x, i) => `<div class="aw-col"><b>${x}</b><div class="aw-ctrack"><i class="${x >= avg + 3 ? 'hi' : x <= avg - 3 ? 'lo' : ''}" style="height:${(x / mx * 100).toFixed(1)}%"></i><u style="bottom:${(avg / mx * 100).toFixed(1)}%"></u></div><small>${i + 1}</small></div>`).join('')}</div><p class="aw-dim aw-sm">Points of each house from the Lagna. The line is the average, ${avg.toFixed(1)}.</p>`;
  };
  function yogas(c){ try { return YGE.detect(c, { now: new Date() }) || []; } catch (e) { return null; } }
  W.yogas = c => {
    const y = yogas(c); if (!y) return msg('The yoga finder is not available.');
    const list = y.filter(x => !/Doshas/.test(x.cat));
    if (!list.length) return msg('No notable yoga was found.');
    return `<div class="aw-list">${list.map(x => `<details class="aw-item aw-yg"><summary><b>${esc(x.name)}</b>${chip(x.cat)}${x.tone ? chip(x.tone, tone(x.tone)) : ''}</summary><p class="aw-dim">${esc(x.why || '')}</p><p>${esc(x.meaning || x.text || '')}</p></details>`).join('')}</div>`;
  };
  W.dosha = c => {
    const y = yogas(c); if (!y) return msg('The dosha finder is not available.');
    const d = y.filter(x => /Doshas/.test(x.cat));
    if (!d.length) return `<div class="aw-read"><p><b>None of the checked doshas was found.</b> Manglik, Kaal Sarp, Kemadruma, Grahan and the other points that need care were looked at.</p></div>`;
    return `<div class="aw-list">${d.map(x => `<details class="aw-item aw-yg"><summary><b>${esc(x.name)}</b>${x.cancelled ? chip('cancelled', 'g') : chip('found', 'b')}</summary><p class="aw-dim">${esc(x.why || '')}</p><p>${esc(x.meaning || x.text || '')}</p></details>`).join('')}</div>`;
  };
  W.aspects = (c, pf, o) => {
    const h = Math.max(1, Math.min(12, +o.house || 7)), occ = PL.filter(n => c.planets[n].house === h), look = PL.filter(n => (c.planets[n].aspectsHouses || []).indexOf(h) >= 0 && c.planets[n].house !== h);
    const hs = c.vargas.D1.houses[h - 1], lord = hs && hs.signLord;
    return `<div class="aw-facts"><div class="aw-fact"><small>${esc(ordn(h))} house</small><b>${esc(hs ? hs.signName : '')}</b><span>lord ${esc(lord || '')}${lord && c.planets[lord] ? ' in ' + ordn(c.planets[lord].house) : ''}</span></div>` +
      `<div class="aw-fact"><small>Sitting in it</small><b>${occ.length ? occ.map(esc).join(', ') : 'nobody'}</b><span></span></div><div class="aw-fact"><small>Looking at it</small><b>${look.length ? look.map(esc).join(', ') : 'nobody'}</b><span></span></div></div>`;
  };
  W.housereading = (c, pf, o) => {
    const h = Math.max(1, Math.min(12, +o.house || 7)), V = c.vargas.D1, hs = V.houses[h - 1], lord = hs.signLord, lp = c.planets[lord];
    let out = ''; const ar = (typeof VMF !== 'undefined' && VMF && VMF.data && VMF.data.arena) ? VMF.data.arena[h - 1] : null;
    if (ar) out += `<p><b>${esc(ordn(h))} house in ${esc(hs.signName)}</b> is about ${esc(ar.theme)}.</p>`;
    try { const m = VMF.placement(lord, lp.house, lp.sign, lp.dignity && lp.dignity.status); if (m) out += `<h4 class="aw-h">Its lord</h4><p>${esc(m.text)}</p>`; } catch (e) {}
    const occ = (hs.planets || []).map(p => p.name);
    occ.forEach(n => { try { const p = c.planets[n], m = VMF.placement(n, p.house, p.sign, p.dignity && p.dignity.status); if (m) out += `<h4 class="aw-h">${esc(n)} in this house</h4><p>${esc(m.text)}</p>`; } catch (e) {} });
    if (!occ.length) out += `<p class="aw-dim">No planet sits here, so the lord carries the house.</p>`;
    return out ? `<div class="aw-read">${out}</div>` : msg('The reading is not available.');
  };
  W.planetreading = (c, pf, o) => {
    const n = PL.indexOf(o.planet) >= 0 ? o.planet : 'Jupiter', p = c.planets[n];
    try { const m = VMF.placement(n, p.house, p.sign, p.dignity && p.dignity.status); if (m) return `<div class="aw-read"><p><b>${esc(m.headline)}</b></p><p>${esc(m.text.replace(m.headline + '. ', ''))}</p></div>`; } catch (e) {}
    return msg('The reading is not available.');
  };
  W.note = (c, pf, o) => {
    const t = String(o.text || '').trim(); if (!t) return `<p class="aw-dim">An empty note. Edit this step to write your own checklist.</p>`;
    return `<div class="aw-note">${t.split('\n').map(l => /^\s*[-*•]\s+/.test(l) ? `<div class="aw-nl"><i></i>${esc(l.replace(/^\s*[-*•]\s+/, ''))}</div>` : l.trim() ? `<p>${esc(l)}</p>` : '').join('')}</div>`;
  };

  function render(id, c, pf, o){
    const f = W[id]; if (!f) return msg('This card is not part of this version of the app.');
    if (!c) return msg('Cast a chart first.');
    try { return f(c, pf || window.__vgProf || {}, o || {}); } catch (e) { if (window.console) console.warn('AWW', id, e); return msg('This card could not be drawn for this chart.'); }
  }
  window.AWW = { render, has: id => !!W[id], ids: () => Object.keys(W), esc, chip };
})();

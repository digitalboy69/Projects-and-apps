/* ============================================================================
   CHAKRA EXPLORER (CHX): three classical transit charts on one page, read against the chart that is open (panel-chakra, Home > Time & Cycles).
   Pick any moment (it opens on now); the page places the nine grahas and shows what they touch in YOUR chart.

   1. SARVATOBHADRA CHAKRA, a 9x9 grid: 28 nakshatras (with Abhijit) on the outer ring, then 20 consonants, 12 rashis and the centre with the five
      tithi groups (Nanda, Bhadra, Jaya, Rikta, Purna) or, switched, the weekdays; 16 vowels sit at the corners of the four rings.
      A planet in a nakshatra casts vedha along lines from its cell:
        Sammukha = straight across the grid (normal or stationary motion), Vama = the diagonal that leans toward the next wall clockwise (fast motion),
        Dakshina = the other diagonal (retrograde). Sun, Moon, Rahu and Ketu cast all three (common practice; sources differ: some give the Sun and Moon only
        Vama and the nodes only Dakshina, noted on the page). "Fast" = more than 1.2 x mean daily speed, this page's own rule of thumb. Malefic = Sun, Mars, Saturn, Rahu, Ketu; benefic = Jupiter, Venus;
        the Moon is benefic from Shukla 9 to Krishna 7 (a bright Moon); Mercury is malefic while it shares a sign with Mars, Saturn, Rahu or Ketu.
        Natal points checked: Janma Nakshatra, Rashi (Moon sign), Tithi group, Vaara and an optional Naam Akshara. Several malefic vedhas on the Janma
        Nakshatra: 1 friction, 2 loss, 3 defeat, 4+ heavy (Mansagari, as quoted in the common texts).
        Latta (optional): each planet kicks one nakshatra: Sun 12th, Mars 3rd, Jupiter 6th, Saturn 8th counted forward; Moon 22nd, Mercury 7th, Venus 5th,
        Rahu and Ketu 9th counted backward, own nakshatra = 1, the 27 nakshatras (no Abhijit).
   2. KOTA CHAKRA, a four-walled fort of the 28 nakshatras counted from the Janma Nakshatra (1). Counting 1..28: each run of seven goes
        Bahya(1) Prakaara(2) Madhya(3) Stambha(4) Madhya(5) Prakaara(6) Bahya(7). The first three of a run are the entry path (IN), the last three the
        exit path (OUT), the 4th is the pillar (STALL). A retrograde planet (Rahu and Ketu always) reverses IN and OUT. Kota Swami = lord of the Moon sign;
        Kota Paala = "lord of the pada of the Janma Nakshatra per the Avakahada Chakra". The letter table behind that was NOT found in full, and two
        published examples (Ashwini pada 1 = Venus, Ashlesha pada 4 = Mercury) do not match the navamsa lord. So the navamsa lord is only a best-guess
        default here, and the page has a selector to override it (ST.paala). Do not treat the default as verified.
        Benefics inside (Stambha, Madhya) give strength; malefics inside weaken the defence; on the walls and outside the reverse reading applies.
   3. SHOOLA (TRISHULA) CHAKRA: counted from the Janma Nakshatra (or, switched, the natal Sun nakshatra as the longevity texts do), 1 is the handle and the
        9th, 15th and 21st are the three spear-points; a malefic on a point is flagged. 27 nakshatras (no Abhijit).
   Tendencies, never fate. Uses getSiderealLongitudeAt, getPlanetSpeed (js/03), panchangaAt (js/45), SIGNS/NAKSHATRAS (js/05), registerLatePanel (js/120).
   API: CHX.compute(chart, profile, jd) -> data; CHX.html(chart, profile, jd) -> body html; CHX.text(chart, profile, jd); CHX.rays(r, c); CHX.grid.
   ============================================================================ */
const CHX = (function(){
  const PL = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  const AB = { Sun:'Su', Moon:'Mo', Mars:'Ma', Mercury:'Me', Jupiter:'Ju', Venus:'Ve', Saturn:'Sa', Rahu:'Ra', Ketu:'Ke' };
  const ALL3 = ['Sun','Moon','Rahu','Ketu'];
  const MEAN = { Mars:0.524, Mercury:0.986, Jupiter:0.083, Venus:0.986, Saturn:0.0335 };   /* mean daily motion, degrees */
  const FAST = 1.2;                                                                          /* faster than 1.2 x mean = "fast" (common practice) */
  const ABH_FROM = 276 + 40/60, ABH_TO = 280 + 53/60 + 20/3600;                               /* Abhijit: 276d40' to 280d53'20" */
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th'));

  /* 28 nakshatras in order (Abhijit between Uttara Ashadha and Shravana). */
  const NAK28 = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Abhijit','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
  const NK = ['Ashw','Bhar','Krit','Rohi','Mrig','Ardra','Puna','Push','Ashl','Magha','P.Pha','U.Pha','Hasta','Chit','Swati','Vish','Anu','Jye','Mula','P.Asha','U.Asha','Abhi','Shra','Dhan','Shata','P.Bha','U.Bha','Rev'];
  const to28 = i27 => (i27 >= 21 ? i27 + 1 : i27);                    /* the app's 27-list index -> 28-list index */
  function nak28(lon){ const l = normDeg(lon); if (l >= ABH_FROM && l < ABH_TO) return 21; return to28(Math.floor(l / (360 / 27))); }
  const S3 = ['Ari','Tau','Gem','Can','Leo','Vir','Lib','Sco','Sag','Cap','Aqu','Pis'];
  const TG = [{ n:'Nanda', d:'नन्दा', w:['Sun','Tue'] }, { n:'Bhadra', d:'भद्रा', w:['Mon','Wed'] }, { n:'Jaya', d:'जया', w:['Thu'] }, { n:'Rikta', d:'रिक्ता', w:['Fri'] }, { n:'Purna', d:'पूर्णा', w:['Sat'] }];
  const VG = [0, 1, 0, 1, 2, 3, 4];                                   /* weekday (0 = Sunday) -> tithi-group cell it shares */
  const VNAME = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const LN = { sam:'Sammukha', vama:'Vama', dak:'Dakshina' };
  const LNX = { sam:'straight across', vama:'forward diagonal', dak:'back diagonal' };

  /* ---------- the 9x9 grid (row 0..8, col 0..8; north on top, nakshatras run clockwise from Krittika) ---------- */
  const GRID = (function(){
    const G = Array.from({ length: 9 }, () => Array(9).fill(null));
    const v = (d, r) => ({ t:'v', d, r }), c = (d, r) => ({ t:'c', d, r });
    [2,3,4,5,6,7,8].forEach((n, i) => { G[0][1 + i] = { t:'k', n }; });             /* top: Krittika .. Ashlesha */
    [9,10,11,12,13,14,15].forEach((n, i) => { G[1 + i][8] = { t:'k', n }; });       /* right: Magha .. Vishakha */
    [16,17,18,19,20,21,22].forEach((n, i) => { G[8][7 - i] = { t:'k', n }; });      /* bottom: Anuradha .. Shravana (right to left) */
    [23,24,25,26,27,0,1].forEach((n, i) => { G[7 - i][0] = { t:'k', n }; });        /* left: Dhanishta .. Bharani (bottom to top) */
    G[0][0] = v('अ','A'); G[0][8] = v('इ','I'); G[8][0] = v('ए','E'); G[8][8] = v('उ','U');
    G[1][1] = v('आ','AA'); G[1][7] = v('ई','EE'); G[7][7] = v('ऊ','OO'); G[7][1] = v('ऐ','AI');
    /* ring 2: 20 consonants. The top-row cell next to Va is read as Ba (the one cell printed charts show least clearly). */
    [['ब','Ba'],['व','Va'],['क','Ka'],['ह','Ha'],['ड','Dda']].forEach((x, i) => { G[1][2 + i] = c(x[0], x[1]); });
    [['म','Ma'],['ट','Tta'],['प','Pa'],['र','Ra'],['त','Ta']].forEach((x, i) => { G[2 + i][7] = c(x[0], x[1]); });
    [['ख','Kha'],['ज','Ja'],['भ','Bha'],['य','Ya'],['न','Na']].forEach((x, i) => { G[7][2 + i] = c(x[0], x[1]); });
    [['ल','La'],['च','Cha'],['द','Da'],['स','Sa'],['ग','Ga']].forEach((x, i) => { G[2 + i][1] = c(x[0], x[1]); });
    /* ring 3: 12 rashis in zodiac order clockwise from Taurus (top), vowels at the corners */
    G[2][2] = v('ऋ','Ri'); G[2][6] = v('ऌ','Lri'); G[6][6] = v('ओ','O'); G[6][2] = v('अं','Am');
    [1,2,3].forEach((s, i) => { G[2][3 + i] = { t:'r', s }; });
    [4,5,6].forEach((s, i) => { G[3 + i][6] = { t:'r', s }; });
    [9,8,7].forEach((s, i) => { G[6][3 + i] = { t:'r', s }; });
    [0,11,10].forEach((s, i) => { G[3 + i][2] = { t:'r', s }; });
    /* ring 4 + centre: tithi groups (or weekdays) */
    G[3][3] = v('ॠ','Rri'); G[3][5] = v('ॡ','LLri'); G[5][5] = v('औ','Au'); G[5][3] = v('अः','Ah');
    G[3][4] = { t:'t', g:0 }; G[4][3] = { t:'t', g:3 }; G[4][5] = { t:'t', g:1 }; G[5][4] = { t:'t', g:2 }; G[4][4] = { t:'t', g:4 };
    return G;
  })();
  const POS = {}, RPOS = {}, TPOS = {}, LET = {}, LETLIST = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++){
    const g = GRID[r][c];
    if (g.t === 'k') POS[g.n] = [r, c]; else if (g.t === 'r') RPOS[g.s] = [r, c]; else if (g.t === 't') TPOS[g.g] = [r, c];
    else { const k = r + ',' + c; LET[k] = { dev:g.d, rom:g.r, cell:[r, c] }; LETLIST.push({ key:k, dev:g.d, rom:g.r, vowel:g.t === 'v' }); }
  }

  /* Rays from an outer-ring nakshatra cell. Stepping order: straight inward; "forward" = the diagonal that leans toward the next wall clockwise; "back" = the other. */
  function rays(r, c){
    let sam, fwd, bak;
    if (r === 0 && c > 0 && c < 8){ sam = [1,0]; fwd = [1,1]; bak = [1,-1]; }
    else if (c === 8 && r > 0 && r < 8){ sam = [0,-1]; fwd = [1,-1]; bak = [-1,-1]; }
    else if (r === 8 && c > 0 && c < 8){ sam = [-1,0]; fwd = [-1,-1]; bak = [-1,1]; }
    else if (c === 0 && r > 0 && r < 8){ sam = [0,1]; fwd = [-1,1]; bak = [1,1]; }
    else return null;
    const walk = d => { const out = []; let rr = r + d[0], cc = c + d[1]; while (rr >= 0 && rr <= 8 && cc >= 0 && cc <= 8){ out.push([rr, cc]); rr += d[0]; cc += d[1]; } return out; };
    return { sam: walk(sam), vama: walk(fwd), dak: walk(bak) };
  }
  const cellName = (r, c) => { const g = GRID[r][c]; return g.t === 'k' ? NAK28[g.n] : g.t === 'r' ? SIGNS[g.s].name : g.t === 't' ? TG[g.g].n : g.d; };

  /* ---------- sky: the nine grahas at a moment ---------- */
  function classify(list){
    const by = {}; list.forEach(p => { by[p.name] = p; });
    ['Sun','Mars','Saturn','Rahu','Ketu'].forEach(n => { by[n].benefic = false; });
    ['Jupiter','Venus'].forEach(n => { by[n].benefic = true; });
    const t = Math.floor(normDeg(by.Moon.lon - by.Sun.lon) / 12) + 1;
    by.Moon.tithi = t; by.Moon.benefic = t >= 9 && t <= 22;
    by.Moon.why = by.Moon.benefic ? 'a bright Moon (Shukla 9 to Krishna 7)' : 'a dim Moon (Krishna 8 to Shukla 8)';
    const mal = ['Mars','Saturn','Rahu','Ketu'].filter(n => by[n].sign === by.Mercury.sign);
    by.Mercury.benefic = mal.length === 0;
    by.Mercury.why = mal.length ? 'in company with ' + mal.join(' and ') : 'free of malefic company';
    return by;
  }
  function sky(jd){
    const list = PL.map(name => {
      const lon = getSiderealLongitudeAt(name, jd), node = name === 'Rahu' || name === 'Ketu', lum = name === 'Sun' || name === 'Moon';
      const sp = lum ? null : getPlanetSpeed(name, jd);
      const retro = node ? true : lum ? false : sp < 0;
      const kind = retro ? 'retro' : (!lum && !node && sp > MEAN[name] * FAST) ? 'fast' : 'normal';
      const L = normDeg(lon);
      return { name, ab: AB[name], lon: L, sign: Math.floor(L / 30), deg: L % 30, n27: Math.floor(L / (360 / 27)), n28: nak28(L), retro, kind, speed: sp, benefic: false, why: '' };
    });
    classify(list);
    return list;
  }

  /* ---------- the chart on screen: its five natal pillars ---------- */
  function natal(chart, profile, paalaOverride){
    const M = chart.planets.Moon, S = chart.planets.Sun, tz = Number(profile.tz != null ? profile.tz : chart.tzOffsetHours);
    let P = null; try { P = panchangaAt(chart.julianDay, Number(profile.lat), Number(profile.lon), tz); } catch(e){ P = null; }
    const t = P ? P.tithi.num : Math.floor(normDeg(M.longitude - S.longitude) / 12) + 1;
    const vi = P ? P.vara.idx : ((Math.floor(chart.julianDay + tz / 24 + 1.5) % 7) + 7) % 7;
    const tName = P ? P.tithi.paksha + ' ' + P.tithi.name : (t <= 15 ? 'Shukla ' : 'Krishna ') + ((t - 1) % 15 + 1);
    const navIdx = M.nakshatra.index * 4 + (M.nakshatra.pada - 1);                         /* the pada IS the navamsa */
    return { tz, j27: M.nakshatra.index, j28: to28(M.nakshatra.index), jName: NAK28[to28(M.nakshatra.index)], pada: M.nakshatra.pada, sign: M.sign, signName: SIGNS[M.sign].name,
      tithi: t, tg: (t - 1) % 5, tithiName: tName, vara: vi, varaName: VNAME[vi], vg: VG[vi], sun27: S.nakshatra.index, sunName: S.nakshatra.name,
      swami: SIGNS[M.sign].lord, paalaSign: navIdx % 12, paalaAuto: SIGNS[navIdx % 12].lord, paalaSet: PL.indexOf(paalaOverride) >= 0,
      paala: PL.indexOf(paalaOverride) >= 0 ? paalaOverride : SIGNS[navIdx % 12].lord };
  }

  /* ---------- 1. Sarvatobhadra ---------- */
  function sbcCalc(pl, nat, naamKey){
    const pts = [
      { key:'janma', label:'Janma Nakshatra', val: NAK28[nat.j28], cell: POS[nat.j28] },
      { key:'rashi', label:'Rashi', val: nat.signName, cell: RPOS[nat.sign] },
      { key:'tithi', label:'Tithi group', val: TG[nat.tg].n + ' (' + nat.tithiName + ')', cell: TPOS[nat.tg] },
      { key:'vara', label:'Vaara', val: nat.varaName, cell: TPOS[nat.vg] }
    ];
    if (naamKey && LET[naamKey]) pts.push({ key:'naam', label:'Naam Akshara', val: LET[naamKey].dev + ' (' + LET[naamKey].rom + ')', cell: LET[naamKey].cell });
    const rows = pl.map(p => {
      const cell = POS[p.n28], R = rays(cell[0], cell[1]);
      const ks = ALL3.indexOf(p.name) >= 0 ? ['sam','vama','dak'] : [p.kind === 'fast' ? 'vama' : p.kind === 'retro' ? 'dak' : 'sam'];
      const lines = ks.map(k => { const list = R[k], end = list[list.length - 1]; return { k, cells: list, end, endName: end ? cellName(end[0], end[1]) : '' }; });
      return { p, cell, lines };
    });
    pts.forEach(pt => {
      pt.hits = [];
      rows.forEach(rw => {
        rw.lines.forEach(L => { if (L.cells.some(x => x[0] === pt.cell[0] && x[1] === pt.cell[1])) pt.hits.push({ p: rw.p, k: L.k }); });
        if (rw.cell[0] === pt.cell[0] && rw.cell[1] === pt.cell[1]) pt.hits.push({ p: rw.p, k: 'on' });
      });
    });
    return { pts, rows };
  }
  const LATTA = { Sun:[12,1], Mars:[3,1], Jupiter:[6,1], Saturn:[8,1], Moon:[22,-1], Mercury:[7,-1], Venus:[5,-1], Rahu:[9,-1], Ketu:[9,-1] };
  function lattaCalc(pl, nat){
    return pl.map(p => { const L = LATTA[p.name], t27 = (((p.n27 + L[1] * (L[0] - 1)) % 27) + 27) % 27; return { p, count: L[0], dir: L[1], t28: to28(t27), name: NAK28[to28(t27)], onJanma: to28(t27) === nat.j28 }; });
  }

  /* ---------- 2. Kota ---------- */
  const H = [170, 128, 86, 44];
  function kotaInfo(n){ const k = ((n - 1) % 7) + 1; return { n, k, zone: ['Bahya','Prakaara','Madhya','Stambha','Madhya','Prakaara','Bahya'][k - 1], way: k < 4 ? 'IN' : k === 4 ? 'STALL' : 'OUT' }; }
  function kotaPos(n){
    const q = Math.floor((n - 1) / 7), k = ((n - 1) % 7) + 1, h = H[[0,1,2,3,2,1,0][k - 1]];
    const d = k <= 4 ? [[-1,-1],[1,-1],[1,1],[-1,1]][q] : [[0,-1],[1,0],[0,1],[-1,0]][q];
    return [200 + d[0] * h, 200 + d[1] * h];
  }
  function kotaCalc(pl, nat, sk){
    const J = nat.j28, rows = pl.map(p => {
      const n = ((p.n28 - J + 28) % 28) + 1, i = kotaInfo(n);
      const way = i.way === 'STALL' ? 'STALL' : (p.retro ? (i.way === 'IN' ? 'OUT' : 'IN') : i.way);
      return { p, n, zone: i.zone, way, base: i.way };
    });
    const by = {}; rows.forEach(r => { by[r.p.name] = r; });
    const inside = z => z === 'Stambha' || z === 'Madhya';
    let malIn = 0, benIn = 0, malOut = 0, benOut = 0;
    rows.forEach(r => { if (r.way === 'IN'){ if (r.p.benefic) benIn++; else malIn++; } else if (r.way === 'OUT'){ if (r.p.benefic) benOut++; else malOut++; } });
    const score = (benIn + malOut) - (malIn + benOut);
    const sw = by[nat.swami], pa = by[nat.paala];
    return { rows, by, tally: { malIn, benIn, malOut, benOut }, score, verdict: score >= 2 ? 'victory' : score <= -2 ? 'defeat' : 'mixed',
      swami: { lord: nat.swami, row: sw, good: inside(sw.zone) }, paala: { lord: nat.paala, row: pa, good: pa.zone === 'Bahya' } };
  }
  function kotaNote(r){
    const ins = r.zone === 'Stambha' || r.zone === 'Madhya', b = r.p.benefic;
    if (b && ins) return 'inside the fort: protection and strength to face trouble';
    if (b) return 'on the walls or outside: circumstances tend to improve';
    if (ins) return 'inside the fort: the defence feels weaker, so take extra care';
    return 'on the walls or outside: pressure or hard circumstances' + (r.p.retro ? ', more so while retrograde' : '');
  }

  /* ---------- 3. Shoola ---------- */
  function shoolaCalc(pl, nat, base){
    const b27 = base === 'sun' ? nat.sun27 : nat.j27, tips = [9, 15, 21];
    const rows = pl.map(p => ({ p, n: ((p.n27 - b27 + 27) % 27) + 1 }));
    const idx = n => (b27 + n - 1) % 27;
    return { b27, rows, tips: tips.map(n => ({ n, i27: idx(n), name: NK[to28(idx(n))], full: NAK28[to28(idx(n))] })), baseName: NK[to28(b27)], baseFull: NAK28[to28(b27)],
      flags: rows.filter(r => tips.indexOf(r.n) >= 0 && !r.p.benefic) };
  }

  /* ---------- everything for one moment ---------- */
  function compute(chart, profile, jd, o){
    o = o || ST;
    const nat = natal(chart, profile, o.paala), pl = sky(jd), vis = pl.filter(p => !o.hide[p.name]);
    return { jd, nat, pl, vis, sbc: sbcCalc(vis, nat, o.naam), latta: lattaCalc(vis, nat), kota: kotaCalc(pl, nat), shoola: shoolaCalc(pl, nat, o.shoola) };
  }

  /* ---------- drawing ---------- */
  const mk = (p, cx, cy, r, extra) => `<g class="chx-pm ${p.benefic ? 'b' : 'm'} ${extra || ''}"><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}"/><text x="${cx.toFixed(1)}" y="${(cy + r * 0.36).toFixed(1)}" font-size="${(r * 1.05).toFixed(1)}">${p.ab}</text>${p.retro ? `<text class="rt" x="${(cx + r * 0.7).toFixed(1)}" y="${(cy - r * 0.35).toFixed(1)}" font-size="${(r * 1.3).toFixed(1)}">*</text>` : ''}</g>`;
  function row(ps, cx, cy, r, pitchMax, extraFn){
    if (!ps.length) return '';
    const pitch = Math.min(pitchMax, 36 / ps.length), x0 = cx - (ps.length - 1) * pitch / 2;
    return ps.map((p, i) => mk(p, x0 + i * pitch, cy, r, extraFn ? extraFn(p) : '')).join('');
  }
  function sbcSVG(D, o){
    const S = 40, hl = {}, sbc = D.sbc;
    sbc.pts.forEach(pt => { if (pt.key === 'vara' && !o.vara) return; if (pt.key === 'tithi' && o.vara) return; hl[pt.cell[0] + ',' + pt.cell[1]] = pt.key === 'naam' ? 'naam' : 'nat'; });
    const byCell = {}; sbc.rows.forEach(rw => { const k = rw.cell[0] + ',' + rw.cell[1]; (byCell[k] = byCell[k] || []).push(rw.p); });
    let cells = '', txt = '', latta = '', lines = '', marks = '';
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++){
      const g = GRID[r][c], x = c * S, y = r * S, key = r + ',' + c, h = hl[key], cx = x + S / 2;
      cells += `<rect class="chx-c ${g.t}${h ? ' ' + h : ''}" x="${x}" y="${y}" width="${S}" height="${S}"/>`;
      const tc = 'chx-tx' + (h ? ' hl' : '');
      if (g.t === 'k') txt += `<text class="${tc} nk" x="${cx}" y="${y + 12}" font-size="8.4">${esc(NK[g.n])}</text>`;
      else if (g.t === 'v' || g.t === 'c') txt += `<text class="${tc}" x="${cx}" y="${y + 23}" font-size="14">${g.d}</text><text class="${tc} sm" x="${cx}" y="${y + 34}" font-size="6.8">${esc(g.r)}</text>`;
      else if (g.t === 'r') txt += `<text class="${tc}" x="${cx}" y="${y + 17}" font-size="12">${SIGNS[g.s].symbol}</text><text class="${tc} sm" x="${cx}" y="${y + 31}" font-size="8">${S3[g.s]}</text>`;
      else if (o.vara){ const w = TG[g.g].w; txt += w.map((nm, i) => `<text class="${tc}" x="${cx}" y="${y + (w.length === 1 ? 23 : 17 + i * 12)}" font-size="9">${nm}</text>`).join(''); }
      else txt += `<text class="${tc}" x="${cx}" y="${y + 17}" font-size="8.4">${TG[g.g].n}</text><text class="${tc} sm" x="${cx}" y="${y + 30}" font-size="8">${TG[g.g].d}</text>`;
      if (g.t === 'k'){ const ps = byCell[key] || []; marks += row(ps, cx, y + 27, 6, 13); }
    }
    if (o.latta) D.latta.forEach(L => { const q = POS[L.t28]; latta += `<rect class="chx-lt${L.onJanma ? ' hot' : ''}" x="${q[1] * S + 2}" y="${q[0] * S + 2}" width="${S - 4}" height="${S - 4}" rx="4"/>`; });
    if (o.rays) sbc.rows.forEach(rw => rw.lines.forEach(L => {
      if (!L.end) return;
      const x1 = rw.cell[1] * S + S / 2, y1 = rw.cell[0] * S + S / 2, x2 = L.end[1] * S + S / 2, y2 = L.end[0] * S + S / 2;
      lines += `<line class="chx-ray ${rw.p.benefic ? 'b' : 'm'} ${L.k}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#${rw.p.benefic ? 'chxArG' : 'chxArR'})"/>`;
    }));
    const defs = '<defs><marker id="chxArG" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8z" fill="#5fd08a"/></marker><marker id="chxArR" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8z" fill="#e0725a"/></marker></defs>';
    return `<svg class="chx-svg" viewBox="0 0 360 360" role="img" aria-label="Sarvatobhadra Chakra, 9 by 9 grid">${defs}${cells}${lines}${latta}${txt}${marks}</svg>`;
  }
  function kotaSVG(D){
    const K = D.kota, J = D.nat.j28, ZC = { Bahya:'#e0725a', Prakaara:'#5fd08a', Madhya:'#6f9be8', Stambha:'#b9b3c9' };
    const byN = {}; K.rows.forEach(r => { (byN[r.n] = byN[r.n] || []).push(r); });
    let out = '';
    [190, 148, 106, 64].forEach((h, i) => { out += `<rect class="chx-kz" x="${200 - h}" y="${200 - h}" width="${h * 2}" height="${h * 2}" rx="6" stroke="${ZC[['Bahya','Prakaara','Madhya','Stambha'][i]]}"/>`; });
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(d => { out += `<line class="chx-kg" x1="${200 + d[0] * 170}" y1="${200 + d[1] * 170}" x2="${200 + d[0] * 44}" y2="${200 + d[1] * 44}"/>`; });
    [[0,-1],[1,0],[0,1],[-1,0]].forEach(d => { out += `<line class="chx-kg ex" x1="${200 + d[0] * 44}" y1="${200 + d[1] * 44}" x2="${200 + d[0] * 170}" y2="${200 + d[1] * 170}"/>`; });
    [['Bahya',105,18],['Prakaara',135,60],['Madhya',157,102],['Stambha',200,203]].forEach(z => { out += `<text class="chx-kl" x="${z[1]}" y="${z[2]}" font-size="7.5" text-anchor="middle" fill="${ZC[z[0]]}">${z[0]}</text>`; });
    for (let n = 1; n <= 28; n++){
      const q = kotaPos(n), i = kotaInfo(n), idx = (J + n - 1) % 28, ps = (byN[n] || []).map(r => r.p);
      out += `<g><rect class="chx-kb${n === 1 ? ' hot' : ''}" x="${q[0] - 20}" y="${q[1] - 13}" width="40" height="26" rx="5" stroke="${ZC[i.zone]}"/><text class="chx-kn" x="${q[0] - 17}" y="${q[1] - 5}" font-size="6.2">${n}</text><text class="chx-kt${n === 1 ? ' hot' : ''}" x="${q[0]}" y="${q[1] - 2}" font-size="8.2">${esc(NK[idx])}</text>`;
      if (ps.length) out += row(ps, q[0], q[1] + 7, 5, 11, p => { const r = K.by[p.name]; return r.way === 'IN' ? 'in' : r.way === 'OUT' ? 'out' : 'st'; });
      out += '</g>';
    }
    return `<svg class="chx-svg kota" viewBox="0 0 400 400" role="img" aria-label="Kota Chakra, a four-walled fort of 28 nakshatras">${out}</svg>`;
  }
  function shoolaSVG(D, o){
    const Sh = D.shoola, at = {}; Sh.rows.forEach(r => { (at[r.n] = at[r.n] || []).push(r.p); });
    const tx = [70, 180, 290], ty = 52;
    let out = `<path class="chx-sh" d="M${tx[0]} ${ty + 24}V118H${tx[2]}V${ty + 24}M180 ${ty + 24}V118M180 118V212"/>`;
    Sh.tips.forEach((t, i) => {
      const hot = (at[t.n] || []).some(p => !p.benefic);
      out += `<g><circle class="chx-sc${hot ? ' hot' : ''}" cx="${tx[i]}" cy="${ty}" r="25"/><text class="chx-stx" x="${tx[i]}" y="${ty - 1}" font-size="9">${esc(t.name)}</text><text class="chx-stx sm" x="${tx[i]}" y="${ty + 11}" font-size="7.5">${ord(t.n)}</text></g>`;
      out += row(at[t.n] || [], tx[i], ty - 38, 6, 13);
    });
    out += `<g><circle class="chx-sc base" cx="180" cy="240" r="28"/><text class="chx-stx base" x="180" y="238" font-size="9.5">${esc(Sh.baseName)}</text><text class="chx-stx base sm" x="180" y="251" font-size="7.5">${o.shoola === 'sun' ? "Sun's star" : 'Janma'}</text></g>`;
    out += row(at[1] || [], 238, 240, 6.5, 14);
    return `<svg class="chx-svg shoola" viewBox="0 0 360 285" role="img" aria-label="Shoola Chakra, the trident of nakshatras">${out}</svg>`;
  }

  /* ---------- html pieces ---------- */
  const kindWord = p => p.retro ? 'retrograde' : p.kind === 'fast' ? 'fast' : 'normal pace';
  const tag = (p) => `<i class="chx-dot ${p.benefic ? 'b' : 'm'}">${p.ab}</i>`;
  function chips(D, o){
    return `<div class="chx-chips">${D.pl.map(p => `<button type="button" class="chx-chip ${p.benefic ? 'b' : 'm'}${o.hide[p.name] ? ' off' : ''}" data-chx="pl" data-p="${p.name}" aria-pressed="${o.hide[p.name] ? 'false' : 'true'}"><i></i>${p.name}${p.retro ? '*' : ''}</button>`).join('')}</div>`;
  }
  function sbcHTML(D, o){
    const sbc = D.sbc, ladder = ['', 'friction or conflict', 'loss of money or support', 'defeat or setbacks', 'a heavy phase: check the dasha and look after health'];
    const hits = sbc.pts.map(pt => {
      const mal = pt.hits.filter(h => !h.p.benefic), ben = pt.hits.filter(h => h.p.benefic);
      const how = h => `${h.p.name}${h.p.retro ? '*' : ''} <span>${h.k === 'on' ? 'sits on it' : LN[h.k] + ' ray'}</span>`;
      let cls = 'clear', body = '<span class="chx-calm">No planet casts a vedha here right now.</span>';
      if (pt.hits.length){
        cls = mal.length && ben.length ? 'mixed' : mal.length ? 'bad' : 'good';
        body = (mal.length ? `<div><em class="bad">Malefic</em> ${mal.map(how).join(' · ')}</div>` : '') + (ben.length ? `<div><em class="good">Benefic</em> ${ben.map(how).join(' · ')}</div>` : '');
        if (pt.key === 'janma' && mal.length) body += `<div class="chx-ladder">${mal.length >= 4 ? ladder[4] : ladder[mal.length]} <small>(${mal.length} malefic${mal.length > 1 ? 's' : ''}, from the texts)</small></div>`;
      }
      return `<div class="chx-hit ${cls}"><b>${pt.label}</b><span class="chx-hv">${esc(pt.val)}</span>${body}</div>`;
    }).join('');
    const rowsH = sbc.rows.map(rw => {
      const p = rw.p, ks = rw.lines.map(L => `<b>${LN[L.k]}</b> to ${esc(L.endName)}`).join(' · ');
      return `<div class="chx-pr ${p.benefic ? 'b' : 'm'}">${tag(p)}<div><b>${p.name}</b> <span>${NK[p.n28]} · ${kindWord(p)}${p.why ? ' · ' + p.why : ''}</span><div class="chx-pl">${ks}</div></div></div>`;
    }).join('');
    const lat = o.latta ? `<div class="chx-sec2"><h5>Latta kicks <span>each planet kicks one nakshatra</span></h5>${D.latta.map(L => `<div class="chx-lat${L.onJanma ? ' hot' : ''}">${tag(L.p)} ${L.p.name} kicks <b>${esc(L.name)}</b> <span>(${ord(L.count)} ${L.dir > 0 ? 'ahead' : 'back'})</span>${L.onJanma ? ' <em class="bad">your Janma Nakshatra</em>' : ''}</div>`).join('')}</div>` : '';
    return `<div class="chx-card">${sbcSVG(D, o)}
      <div class="chx-leg"><span><i class="sw nat"></i>Your point</span><span><i class="sw rb"></i>Benefic ray</span><span><i class="sw rm"></i>Malefic ray</span><span><i class="sw lt"></i>Latta kick</span></div></div>
      <div class="chx-sec2"><h5>What touches your points <span>by vedha ray</span></h5>${hits}</div>
      <div class="chx-sec2"><h5>Planets and their rays</h5>${rowsH}</div>${lat}`;
  }
  function kotaHTML(D){
    const K = D.kota, nat = D.nat, Z = { Bahya:'outer wall', Prakaara:'the wall', Madhya:'inner court', Stambha:'central pillar' };
    const way = r => r.way === 'IN' ? 'entering' : r.way === 'OUT' ? 'leaving' : 'at the pillar';
    const rowsH = K.rows.map(r => `<div class="chx-pr ${r.p.benefic ? 'b' : 'm'}">${tag(r.p)}<div><b>${r.p.name}${r.p.retro ? '*' : ''}</b> <span>${r.n}. ${NK[r.p.n28]} · ${r.zone} (${Z[r.zone]}) · <em class="way ${r.way.toLowerCase()}">${r.way}</em> ${way(r)}</span><div class="chx-pl">${kotaNote(r)}</div></div></div>`).join('');
    const sw = K.swami, pa = K.paala;
    const lords = `<div class="chx-two"><div class="chx-box"><small>Kota Swami (lord of the fort)</small><b>${sw.lord}</b><span>${sw.row.zone}, ${sw.row.way} · ${sw.good ? 'inside the fort, a supportive place' : 'outside the core, a less protected place'}</span></div>
      <div class="chx-box"><small>Kota Paala (keeper)</small><b>${pa.lord}</b><span>${pa.row.zone}, ${pa.row.way} · ${pa.good ? 'on the outer wall, a protective place' : 'not on the outer wall'}</span></div></div>`;
    const vt = { victory: 'Leans toward victory: benefics are coming in and malefics are going out.', defeat: 'Leans toward a breach (Durga Bhanga): malefics are coming in while benefics are going out.', mixed: 'Mixed: no clear lean either way.' }[K.verdict];
    const t = K.tally;
    return `<div class="chx-card">${kotaSVG(D)}<div class="chx-leg"><span><i class="sw in"></i>IN (entering)</span><span><i class="sw out"></i>OUT (leaving)</span><span><i class="sw st"></i>STALL (pillar)</span><span><i class="sw rb"></i>Benefic</span><span><i class="sw rm"></i>Malefic</span></div></div>
      ${lords}
      <div class="chx-verdict ${K.verdict}"><b>${K.verdict === 'victory' ? 'Fort holds' : K.verdict === 'defeat' ? 'Fort under strain' : 'Fort mixed'}</b><p>${vt}</p><small>Tally: benefics IN ${t.benIn}, OUT ${t.benOut} · malefics IN ${t.malIn}, OUT ${t.malOut}. The lean is this page's own simple count of the textual rule (benefics in and malefics out count for the fort), not a prediction.</small></div>
      <div class="chx-sec2"><h5>Planets in the fort <span>counted from ${esc(nat.jName)} as 1</span></h5>${rowsH}</div>
      <p class="chx-fine">Kota Swami is the lord of your Moon sign (${esc(nat.signName)}). Kota Paala is ${nat.paalaSet ? 'the planet you picked' : 'worked out here as the lord of the navamsa of ' + esc(nat.jName) + ' pada ' + nat.pada + ', which is a best guess: the texts say "lord of the pada" through a printed letter table that was not found in full, and two published examples differ from this rule, so pick the planet from your own book above if it differs'}. Check everything against the running dasha: a good period softens what is shown, a hard one sharpens it.</p>`;
  }
  function shoolaHTML(D, o){
    const Sh = D.shoola, nat = D.nat, at = {}; Sh.rows.forEach(r => { (at[r.n] = at[r.n] || []).push(r.p); });
    const order = []; for (let n = 1; n <= 27; n++) order.push(n);
    const strip = order.map(n => { const i27 = (Sh.b27 + n - 1) % 27, ps = at[n] || [], tip = n === 9 || n === 15 || n === 21;
      return `<span class="chx-sn${tip ? ' tip' : ''}${n === 1 ? ' base' : ''}"><small>${n}</small>${esc(NK[to28(i27)])}${ps.map(p => `<i class="chx-dot ${p.benefic ? 'b' : 'm'}">${p.ab}${p.retro ? '*' : ''}</i>`).join('')}</span>`; }).join('');
    const fl = Sh.flags.length ? Sh.flags.map(f => `<div class="chx-hit bad"><b>${f.p.name}${f.p.retro ? '*' : ''} on a spear-point</b><span class="chx-hv">${ord(f.n)} nakshatra, ${esc(NK[to28((Sh.b27 + f.n - 1) % 27)])}</span><div>A malefic landing on a point is the sensitive moment this chakra watches for. Read it with the dasha and keep the day simple.</div></div>`).join('')
      : '<div class="chx-hit clear"><b>No malefic on a spear-point</b><span class="chx-calm">The 9th, 15th and 21st nakshatras are free of malefics at this moment.</span></div>';
    return `<div class="chx-seg"><button type="button" class="${o.shoola === 'janma' ? 'on' : ''}" data-chx="sb" data-v="janma">Count from Janma Nakshatra</button><button type="button" class="${o.shoola === 'sun' ? 'on' : ''}" data-chx="sb" data-v="sun">Count from natal Sun</button></div>
      <div class="chx-card">${shoolaSVG(D, o)}</div>${fl}
      <div class="chx-strip">${strip}</div>
      <p class="chx-fine">${o.shoola === 'sun' ? `Counted from your natal Sun nakshatra (${esc(nat.sunName)}), as the classical longevity texts do.` : `Counted from your Janma Nakshatra (${esc(nat.jName)}) so it lines up with the other two charts.`} The 1st sits at the handle; the 9th, 15th and 21st are the three spear-points.</p>`;
  }
  function howHTML(){
    return `<details class="chx-how"><summary>How these charts are read, and where schools differ</summary><ul>
      <li><b>From the texts:</b> the 9x9 layout (28 nakshatras with Abhijit, 12 rashis, vowels and consonants, five tithi groups and the weekdays that share them), the three vedha lines, the ladder of 1 to 4 malefic vedhas, the Kota fort of 28 nakshatras and its IN, OUT and pillar paths, and the trident points at the 9th, 15th and 21st nakshatras.</li>
      <li><b>Common practice:</b> Sun, Moon, Rahu and Ketu cast all three rays (some schools give the Sun and Moon only Vama and the nodes only Dakshina). The Moon is benefic from Shukla 9 to Krishna 7; Mercury is malefic while it shares a sign with Mars, Saturn, Rahu or Ketu.</li>
      <li><b>This page's own rules of thumb:</b> a planet counts as fast when it moves more than 1.2 times its mean daily speed (the texts say only "fast"); the Kota lean is a simple count; four or more malefic vedhas on the Janma Nakshatra is worded as a heavy phase, not as a prediction.</li>
      <li><b>Left open:</b> Kota Paala is a best guess (navamsa lord) with a manual override. Letter cells follow the commonly printed chart, and one consonant cell (next to Va) is read as Ba. Only letters that have a cell can be picked as a Naam Akshara.</li>
      <li>Everything here is a tendency for planning and study, not a verdict. Check it against your running dasha and a trusted astrologer.</li></ul></details>`;
  }
  function html(chart, profile, jd, o){
    o = o || ST;
    let D; try { D = compute(chart, profile, jd, o); } catch(e){ console.warn('chakra explorer', e); return '<div class="meta-err">Could not work out this moment.</div>'; }
    const nat = D.nat;
    return `<div class="chx-sec"><h4>1. Sarvatobhadra Chakra</h4><p class="chx-sub">The 9x9 grid of 28 nakshatras, 12 rashis, letters, tithis and weekdays. Your five pillars are lit in gold. Each planet sends rays across the grid, and any ray that lands on a gold point is listed below.</p>
      <label class="chx-tg"><input type="checkbox" id="chxVara"${o.vara ? ' checked' : ''}> Show weekdays (Vaara) in the centre instead of tithi groups</label>
      <label class="chx-tg"><input type="checkbox" id="chxRays"${o.rays ? ' checked' : ''}> Show vedha rays</label><label class="chx-tg"><input type="checkbox" id="chxLatta"${o.latta ? ' checked' : ''}> Show Latta kicks</label>
      <div class="chx-hd">Planets <small>tap to show or hide · * = retrograde</small></div>${chips(D, o)}
      ${sbcHTML(D, o)}</div>
      <div class="chx-sec"><h4>2. Kota Chakra</h4><p class="chx-sub">A four-walled fort of 28 nakshatras counted from your Janma Nakshatra: the outer wall (Bahya), the Prakaara, the Madhya court and the central pillar (Stambha). A planet on its way in is IN, on its way out is OUT, on the pillar it is STALL. Retrograde planets, and Rahu and Ketu, reverse in and out.</p>${kotaHTML(D)}</div>
      <div class="chx-sec"><h4>3. Shoola (Trishula) Chakra</h4><p class="chx-sub">The trident of the nakshatras. The 1st sits at the handle and the three spear-points fall on the 9th, 15th and 21st nakshatras, the sensitive points a malefic transit is said to pierce.</p>${shoolaHTML(D, o)}</div>${howHTML()}`;
  }
  function text(chart, profile, jd){
    try {
      const D = compute(chart, profile, jd, ST), K = D.kota, hit = D.sbc.pts.filter(p => p.hits.length).map(p => p.label + ': ' + p.hits.map(h => h.p.name + (h.k === 'on' ? ' (on it)' : ' (' + LN[h.k] + ')')).join(', '));
      return `Chakra Explorer for ${D.nat.jName}: ${hit.length ? hit.join('; ') : 'no vedha on your five points'}. Kota: ${K.verdict}; Kota Swami ${K.swami.lord} (${K.swami.row.zone}), Kota Paala ${K.paala.lord} (${K.paala.row.zone}). Shoola: ${D.shoola.flags.length ? D.shoola.flags.map(f => f.p.name).join(', ') + ' on a spear-point' : 'no malefic on a spear-point'}.`;
    } catch(e){ return ''; }
  }

  /* ---------- panel, state and events ---------- */
  const ST = { jd: null, vara: false, rays: true, latta: false, hide: {}, naam: '', paala: '', shoola: 'janma', chart: null };
  const nowJD = () => Date.now() / 86400000 + 2440587.5;
  function ctx(){ const pf = window.__vgProf, ch = (typeof currentChartForModal !== 'undefined') ? currentChartForModal : null; return (pf && ch) ? { pf, ch } : null; }
  function tzOf(pf, ch){ return Number(pf.tz != null ? pf.tz : ch.tzOffsetHours); }
  function panel(chart, profile){
    if (ST.chart !== chart){ ST.chart = chart; ST.naam = ''; ST.paala = ''; ST.hide = {}; }
    if (ST.jd == null) ST.jd = nowJD();
    let nat; try { nat = natal(chart, profile); } catch(e){ return '<div class="meta-err">Could not read this chart.</div>'; }
    const tile = (k, v) => `<div class="chx-tile"><small>${k}</small><b>${esc(v)}</b></div>`;
    const naam = `<option value="">none</option>` + LETLIST.map(l => `<option value="${l.key}"${ST.naam === l.key ? ' selected' : ''}>${l.dev} (${l.rom})</option>`).join('');
    const stp = (u, label) => `<div class="chx-st"><small>${label}</small><span><button type="button" data-chx="step" data-u="${u}" data-d="-1" aria-label="${label} back">&minus;</button><button type="button" data-chx="step" data-u="${u}" data-d="1" aria-label="${label} forward">+</button></span></div>`;
    return `<div class="chx"><div class="avk-intro">Three classical transit charts on one page, read against your own chart (<b>${esc(profile.name || 'you')}</b>). It opens on today's sky. Use the time controls to move the transit forward or back.</div>
      <div class="chx-ctl"><div class="chgp-in"><label>Date <input type="date" id="chxDate"></label><label>Time <input type="time" id="chxTime"></label><button type="button" id="chxNow" class="chgp-btn">Now</button></div>
        <div class="chx-steps">${stp('min','Minute')}${stp('hour','Hour')}${stp('day','Day')}${stp('month','Month')}${stp('year','Year')}</div>
        <div class="chx-hd">Your natal pillars</div><div class="chx-tiles">${tile('Nakshatra', nat.jName)}${tile('Pada', 'Charan ' + nat.pada)}${tile('Rashi', nat.signName)}${tile('Tithi', nat.tithiName)}${tile('Vaara', nat.varaName)}</div>
        <label class="chx-nm">Naam Akshara <small>first letter of your name, optional, lights its cell</small><select id="chxNaam">${naam}</select></label>
        <label class="chx-nm">Kota Paala <small>automatic = lord of your pada's navamsa (${nat.paalaAuto}); pick another planet if your book gives a different one</small><select id="chxPaala"><option value="">automatic (${nat.paalaAuto})</option>${PL.map(n => `<option value="${n}"${ST.paala === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label></div>
      <div id="chxBody"></div></div>`;
  }
  function syncInputs(){
    const c = ctx(); if (!c) return; const d = document.getElementById('chxDate'), t = document.getElementById('chxTime'); if (!d || !t) return;
    const lp = jdToLocalParts(ST.jd, tzOf(c.pf, c.ch)); d.value = lp.dateStr; t.value = lp.timeStr.slice(0, 5);
  }
  function draw(){
    const b = document.getElementById('chxBody'); if (!b) return; const c = ctx(); if (!c) return;
    if (ST.jd == null) ST.jd = nowJD();
    b.innerHTML = html(c.ch, c.pf, ST.jd, ST);
  }
  function readInputs(){
    const c = ctx(); if (!c) return; const d = document.getElementById('chxDate'), t = document.getElementById('chxTime'); if (!d || !d.value) return;
    const dm = d.value.split('-').map(Number), tm = (t && t.value ? t.value : '12:00').split(':').map(Number);
    ST.jd = toJulianDay(dm[0], dm[1], dm[2], tm[0], tm[1] || 0, 0) - tzOf(c.pf, c.ch) / 24;
  }
  function step(u, dir){
    const c = ctx(); if (!c) return; const tz = tzOf(c.pf, c.ch);
    if (u === 'min') ST.jd += dir / 1440; else if (u === 'hour') ST.jd += dir / 24; else if (u === 'day') ST.jd += dir;
    else { const p = jdToParts(ST.jd + tz / 24); let y = p.y, m = p.m + (u === 'month' ? dir : 0); y += (u === 'year' ? dir : 0);
      while (m < 1){ m += 12; y--; } while (m > 12){ m -= 12; y++; }
      const dim = new Date(Date.UTC(y, m, 0)).getUTCDate(); ST.jd = toJulianDay(y, m, Math.min(p.d, dim), p.h, p.mi, 0) - tz / 24; }
    syncInputs(); draw();
  }
  document.addEventListener('input', e => { const t = e.target; if (t && (t.id === 'chxDate' || t.id === 'chxTime')){ readInputs(); draw(); } });
  document.addEventListener('change', e => {
    const t = e.target; if (!t || !t.id) return;
    if (t.id === 'chxVara'){ ST.vara = t.checked; draw(); } else if (t.id === 'chxRays'){ ST.rays = t.checked; draw(); } else if (t.id === 'chxLatta'){ ST.latta = t.checked; draw(); }
    else if (t.id === 'chxNaam'){ ST.naam = t.value; draw(); } else if (t.id === 'chxPaala'){ ST.paala = t.value; draw(); }
  });
  document.addEventListener('click', e => {
    const el = e.target && e.target.closest ? e.target.closest('#chxNow,[data-chx]') : null; if (!el) return;
    if (el.id === 'chxNow'){ ST.jd = nowJD(); syncInputs(); draw(); return; }
    const k = el.getAttribute('data-chx');
    if (k === 'pl'){ const p = el.getAttribute('data-p'); ST.hide[p] = !ST.hide[p]; draw(); }
    else if (k === 'step') step(el.getAttribute('data-u'), Number(el.getAttribute('data-d')));
    else if (k === 'sb'){ ST.shoola = el.getAttribute('data-v'); draw(); }
  });
  window.buildChakraExplorerPanel = function(chart, profile){ const h = panel(chart, profile || {}); setTimeout(() => { syncInputs(); draw(); }, 0); return h; };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-chakra', window.buildChakraExplorerPanel);
  return { compute, html, text, rays, grid: GRID, pos: POS, kotaInfo, kotaPos, nak28, natal, sky, state: ST, letters: LETLIST, tg: TG };
})();

/* ============================================================================
   AVAKAHADA CHAKRA (AVK): the standard table printed at the top of a kundli: the Moon-based markers (varna, vashya, yoni, gana, nadi), the
   sign and star with their lords, the birth tithi / karana / yoga / weekday, the element, the paya, and the name sounds (naam akshar).
   Tables are the standard Ashtakoota ones used in Kundali Matching (js: matching panel): varna/vashya by Moon SIGN (Capricorn and Sagittarius split at 15 degrees),
   yoni/gana/nadi by Moon NAKSHATRA. Paya (common rule): the Moon in houses 1,6,11 gold; 2,5,9 silver; 3,7,10 copper; 4,8,12 iron, counted from the rising sign.
   Name sounds: the usual 108-sound table by nakshatra and pada; North and South Indian lists differ for a few stars, so it is marked "usual".
   Tithi / karana / yoga come from panchangaAt() (js/45) for the birth moment and place. Nothing here is a prediction.
   API: AVK.compute(chart, profile) -> {rows:[{k,v,note}], ...}; AVK.html(chart, profile); AVK.text(chart, profile).
   ============================================================================ */
const AVK = (function(){
  const VARNA = ['Kshatriya','Vaishya','Shudra','Brahmin','Kshatriya','Vaishya','Shudra','Brahmin','Kshatriya','Vaishya','Shudra','Brahmin'];
  const YONI = ['Horse','Elephant','Sheep','Serpent','Serpent','Dog','Cat','Sheep','Cat','Rat','Rat','Cow','Buffalo','Tiger','Buffalo','Tiger','Deer','Deer','Dog','Monkey','Mongoose','Monkey','Lion','Horse','Lion','Cow','Elephant'];
  const GANA = ['Deva','Manushya','Rakshasa','Manushya','Deva','Manushya','Deva','Deva','Rakshasa','Rakshasa','Manushya','Manushya','Deva','Rakshasa','Deva','Rakshasa','Deva','Rakshasa','Rakshasa','Manushya','Manushya','Deva','Rakshasa','Rakshasa','Manushya','Manushya','Deva'];
  const NADI = ['Adi','Madhya','Antya','Antya','Madhya','Adi'];   // by nakshatra index mod 6
  const SYL = ['Chu Che Cho La','Li Lu Le Lo','A I U E','O Va Vi Vu','Ve Vo Ka Ki','Ku Gha Ng Chha','Ke Ko Ha Hi','Hu He Ho Da','Di Du De Do','Ma Mi Mu Me','Mo Ta Ti Tu','Te To Pa Pi','Pu Sha Na Tha','Pe Po Ra Ri','Ru Re Ro Ta','Ti Tu Te To','Na Ni Nu Ne','No Ya Yi Yu','Ye Yo Bha Bhi','Bhu Dha Pha Dha','Bhe Bho Ja Ji','Khi Khu Khe Kho','Ga Gi Gu Ge','Go Sa Si Su','Se So Da Di','Du Tha Jha Na','De Do Cha Chi'];
  const PAYA = {1:'Gold',6:'Gold',11:'Gold',2:'Silver',5:'Silver',9:'Silver',3:'Copper',7:'Copper',10:'Copper',4:'Iron',8:'Iron',12:'Iron'};
  const MEAN = {
    varna:'A traditional marker of temperament and ego (not of caste in real life): Brahmin = reflective, Kshatriya = leading, Vaishya = practical, Shudra = serving.',
    vashya:'Whom the person can easily guide or be guided by. Chatushpad = four-footed, Manav = human, Jalachara = water, Vanachara = wild, Keeta = insect.',
    yoni:'Instinct and natural nature, shown through an animal. Used in matching for physical and instinctive harmony.',
    gana:'Basic temperament: Deva = gentle and giving, Manushya = balanced and worldly, Rakshasa = intense and forceful.',
    nadi:'A body-type and health marker used in matching (Adi = Vata, Madhya = Pitta, Antya = Kapha). Same nadi in a couple is traditionally avoided.',
    paya:'A traditional marker from the Moon\'s house: Gold and Silver are said to be gentler, Copper middle, Iron harder. It is a folk indicator, read lightly.',
    syllable:'The sounds a baby\'s name often starts with, from the Moon\'s star and pada. The lists differ a little between regions.'
  };
  function vashya(sign, deg){
    if ([0,1].includes(sign)) return 'Chatushpad'; if ([2,5,6,10].includes(sign)) return 'Manav'; if (sign === 3 || sign === 11) return 'Jalachara';
    if (sign === 4) return 'Vanachara'; if (sign === 7) return 'Keeta';
    if (sign === 8) return deg < 15 ? 'Manav' : 'Chatushpad'; return deg < 15 ? 'Chatushpad' : 'Jalachara';   // Capricorn
  }
  function compute(chart, profile){
    const mo = chart.planets.Moon, ni = mo.nakshatra.index != null ? mo.nakshatra.index : NAKSHATRAS.findIndex(n => n.name === mo.nakshatra.name), pada = mo.nakshatra.pada;
    const sg = SIGNS[mo.sign], nk = NAKSHATRAS[ni], asc = SIGNS[chart.ascendant.sign];
    let P = null; try { P = panchangaAt(chart.julianDay, Number(profile.lat), Number(profile.lon), Number(profile.tz != null ? profile.tz : chart.tzOffsetHours)); } catch(e){ console.warn('avakahada panchang', e); }
    const rows = [
      {k:'Name sound', v: SYL[ni].split(' ')[pada - 1] + '  (' + SYL[ni] + ')', note: MEAN.syllable},
      {k:'Moon sign (Rashi)', v: sg.symbol + ' ' + sg.name + ' (' + sg.sk + ')'}, {k:'Sign lord', v: sg.lord},
      {k:'Birth star (Nakshatra)', v: nk.name + ', pada ' + pada}, {k:'Star lord', v: nk.lord},
      {k:'Rising sign (Lagna)', v: asc.symbol + ' ' + asc.name}, {k:'Lagna lord', v: asc.lord},
      {k:'Varna', v: VARNA[mo.sign], note: MEAN.varna}, {k:'Vashya', v: vashya(mo.sign, mo.degInSign != null ? mo.degInSign : getDegInSign(mo.longitude)), note: MEAN.vashya},
      {k:'Yoni', v: YONI[ni], note: MEAN.yoni}, {k:'Gana', v: GANA[ni], note: MEAN.gana}, {k:'Nadi', v: NADI[ni % 6], note: MEAN.nadi},
      {k:'Element (Tatva)', v: sg.element}, {k:'Paya', v: PAYA[mo.house] + ' (Moon in house ' + mo.house + ')', note: MEAN.paya}
    ];
    if (P){ rows.push({k:'Tithi', v: P.tithi.paksha + ' ' + P.tithi.name}, {k:'Karana', v: P.karana.name}, {k:'Yoga', v: P.yoga.name}, {k:'Weekday (Vara)', v: P.vara.name + ' · ' + P.vara.lord}); }
    return { rows, P };
  }
  function html(chart, profile){
    let d; try { d = compute(chart, profile); } catch(e){ console.warn('avakahada', e); return '<div class="meta-err">Could not build the Avakahada Chakra.</div>'; }
    const cell = r => `<div class="avk-c"><small>${r.k}</small><b>${r.v}</b>${r.note ? `<details><summary>What is this?</summary><p>${r.note}</p></details>` : ''}</div>`;
    return `<div class="avk"><div class="avk-intro">The standard table at the top of a kundli. Everything here comes from the Moon and the birth moment. Tap "What is this?" on any item.</div>
      <div class="avk-grid">${d.rows.map(cell).join('')}</div>
      <p class="pn-note">Tables are the standard Ashtakoota ones. Paya and name sounds follow the usual rule; regions differ slightly. These are traditional markers, not predictions.</p></div>`;
  }
  function text(chart, profile){ try { return compute(chart, profile).rows.map(r => r.k + ': ' + r.v).join('\n'); } catch(e){ return ''; } }
  return { compute, html, text, tables: { VARNA, YONI, GANA, NADI } };
})();
window.buildAvakahadaPanel = function(chart, profile){ try { return AVK.html(chart, profile || {}); } catch(e){ return ''; } };

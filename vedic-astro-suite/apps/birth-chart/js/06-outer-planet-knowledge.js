/* ---- Outer (trans-Saturnian) planet knowledge, shared by popups, reports and aspects ---- */
const OUTER_INFO = {
  Uranus:{ic:'⚡', role:'The Awakener', sk:'Prajapati',
    about:'Uranus is the planet of sudden change, originality and freedom. It breaks old structures so something truer can appear. Where it sits in your chart shows where you refuse to be ordinary, where life jolts you awake, and where you innovate. Its pace is slow (about 7 years per sign), so it colours a whole generation and is personal mainly through its house and its aspects to your own planets.',
    themes:['Sudden change','Innovation','Freedom','Rebellion','Technology','Eccentricity','Awakening','Surprises'],
    body:['Nervous system','Circulation','Ankles','Electrical impulses'], rules:'Aquarius (modern co-ruler with Saturn)', cycle:'≈ 84 years, about 7 years per sign', yrs:84, perSign:'≈ 7 years',
    facts:[['📏','Diameter','50,724 km (3.98× Earth)'],['☀️','Distance from Sun','19.2 AU (2.9 billion km)'],['🔄','Year','84 Earth years'],['⏱️','Day length','17 h 14 m'],['🌀','Quirk','Spins on its side (98° tilt)'],['🔭','Discovered','1781, William Herschel'],['🌡️','Cloud tops','≈ −224 °C'],['💍','Rings','13 faint rings']]},
  Neptune:{ic:'🔱', role:'The Dreamer', sk:'Varuna',
    about:'Neptune is the planet of imagination, compassion and illusion. It dissolves boundaries: it gives inspiration, music, faith and empathy, and also confusion, escapism and blind spots. Its house shows where you dream, idealise and sacrifice; its aspects show which planets it softens or clouds. It moves very slowly (about 14 years per sign).',
    themes:['Dreams','Compassion','Spirituality','Imagination','Illusion','Escapism','Intuition','Dissolving boundaries'],
    body:['Pineal gland','Immune system','Feet','Lymph'], rules:'Pisces (modern ruler)', cycle:'≈ 165 years, about 14 years per sign', yrs:165, perSign:'≈ 14 years',
    facts:[['📏','Diameter','49,244 km (3.86× Earth)'],['☀️','Distance from Sun','30.1 AU (4.5 billion km)'],['🔄','Year','164.8 Earth years'],['⏱️','Day length','16 h 6 m'],['🌬️','Winds','Up to ≈ 2,100 km/h'],['🔭','Discovered','1846, found by maths first'],['🌡️','Cloud tops','≈ −214 °C'],['🌑','Largest moon','Triton (orbits backwards)']]},
  Pluto:{ic:'♇', role:'The Transformer', sk:'Yama',
    about:'Pluto is the planet of deep transformation, power and rebirth. It strips away what is no longer true, then rebuilds. Its house shows where you meet intensity, control, secrets and renewal; aspects to your planets show what gets purged and reborn. Its orbit is very elongated, so it spends anywhere from about 12 to 31 years in a sign.',
    themes:['Transformation','Power','Death & rebirth','Secrets','Obsession','Regeneration','Purging','Depth'],
    body:['Reproductive organs','Excretory system','Regeneration'], rules:'Scorpio (modern co-ruler with Mars)', cycle:'≈ 248 years, about 12–31 years per sign', yrs:248, perSign:'≈ 12–31 years',
    facts:[['📏','Diameter','2,377 km (0.19× Earth)'],['☀️','Distance from Sun','29.7 – 49.3 AU'],['🔄','Year','247.9 Earth years'],['⏱️','Day length','6.4 Earth days'],['🪐','Status','Dwarf planet since 2006'],['🔭','Discovered','1930, Clyde Tombaugh'],['🌡️','Surface','≈ −229 °C'],['🌑','Moons','5 (largest: Charon)']]}
};
const OUTER_VEDIC_NOTE = 'Classical Jyotish works with the seven visible planets plus Rahu and Ketu. Uranus, Neptune and Pluto have no Parashari drishti, dasha or Shadbala, so their aspects here are Western-style (by angle and orb). Some Indian astrologers call them Prajapati, Varuna and Yama (names vary by author). Use them as supporting colour, not as primary significators.';
const OUTER_ASPECTS = [
  {name:'Conjunction', angle:0, symbol:'☌', orb:8, verb:'merges with'}, {name:'Sextile', angle:60, symbol:'⚹', orb:4, verb:'supports'},
  {name:'Square', angle:90, symbol:'□', orb:7, verb:'pressures'}, {name:'Trine', angle:120, symbol:'△', orb:7, verb:'flows with'},
  {name:'Opposition', angle:180, symbol:'☍', orb:8, verb:'pulls against'}
];
const OUTER_HOUSE_KW = ['self, body and identity','money, family and speech','courage, skills and siblings','home, mother and inner peace','creativity, children and romance','work, health and daily service','partnerships and marriage','change, the hidden and shared resources','beliefs, teachers and long journeys','career, status and public life','gains, friends and ambitions','endings, sleep, foreign lands and the spiritual'];
function outerHouseLine(name, h){ const t = OUTER_INFO[name].themes; return `${name} brings ${t[0].toLowerCase()}, ${t[1].toLowerCase()} and ${t[2].toLowerCase()} into the area of ${OUTER_HOUSE_KW[h-1]} (house ${h}).`; }
// targets: [[label, longitude], ...]; returns aspects within orb, tightest first. Orb is widened for Sun/Moon/Ascendant by 1°.
function outerAspectsTo(lon, targets, selfName){
  const res = [];
  targets.forEach(([n,l])=>{
    if (n===selfName) return;
    const diff = (((lon - l) % 360) + 360) % 360, d = diff > 180 ? 360 - diff : diff; // separation 0..180
    OUTER_ASPECTS.forEach(a=>{ const dev = Math.abs(d - a.angle), orb = a.orb + ((n==='Sun'||n==='Moon'||n==='Ascendant')?1:0); if (dev <= orb) res.push({target:n, asp:a, dev}); });
  });
  return res.sort((x,y)=>x.dev-y.dev);
}

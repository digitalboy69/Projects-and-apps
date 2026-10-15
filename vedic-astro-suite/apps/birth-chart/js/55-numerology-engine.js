/* =============================================================================
   NUMEROLOGY — Name number (Chaldean / Pythagorean) + Date-of-birth numbers + Lo Shu grid
   ============================================================================= */
const NM_CHALDEAN = {A:1,I:1,J:1,Q:1,Y:1,B:2,K:2,R:2,C:3,G:3,L:3,S:3,D:4,M:4,T:4,E:5,H:5,N:5,X:5,U:6,V:6,W:6,O:7,Z:7,F:8,P:8};
const NM_PYTH = {A:1,J:1,S:1,B:2,K:2,T:2,C:3,L:3,U:3,D:4,M:4,V:4,E:5,N:5,W:5,F:6,O:6,X:6,G:7,P:7,Y:7,H:8,Q:8,Z:8,I:9,R:9};
const NM_PCOL = { Sun:'#E0A64A', Moon:'#C9C3AE', Jupiter:'#E0C34A', Rahu:'#6B7FA3', Mercury:'#5EC4B7', Venus:'#D96C9B', Ketu:'#8A6FB8', Saturn:'#5B7FD6', Mars:'#C95050' };
const NM_INFO = {
 1:{t:'The Pioneer',k:'Leadership · Independence · Willpower',p:'Sun',col:'Gold, orange',gem:'Ruby',d:'A natural starter with a strong will and a need to lead and stand on your own feet. You do best when you are free to decide and take the first step.',s:['Self-reliant','Decisive','Original thinker'],w:['Pride or stubbornness','Impatience with a slower pace','Reluctance to ask for help'],soul:'Wants independence, achievement and to be recognised for it.',out:'Comes across as confident, direct and in charge.'},
 2:{t:'The Peacemaker',k:'Cooperation · Sensitivity · Intuition',p:'Moon',col:'White, cream, silver',gem:'Pearl',d:'Gentle and tuned in to other people’s feelings. You thrive in partnerships and bring calm and harmony wherever you go.',s:['Empathetic','Tactful','Supportive team player'],w:['Over-sensitivity','Indecision','Absorbing other people’s moods'],soul:'Wants love, peace and a trusted partner.',out:'Comes across as kind, approachable and diplomatic.'},
 3:{t:'The Communicator',k:'Creativity · Expression · Optimism',p:'Jupiter',col:'Yellow',gem:'Yellow sapphire',d:'Expressive, social and naturally optimistic, with a gift for words, ideas and the arts. You lift the mood of a room.',s:['Creative','Sociable','Optimistic'],w:['Scattered energy','Exaggeration or too much talk','Avoiding depth'],soul:'Wants to express, enjoy life and be heard.',out:'Comes across as charming, witty and lively.'},
 4:{t:'The Builder',k:'Discipline · Structure · Hard work',p:'Rahu',col:'Blue, grey, earthy tones',gem:'Hessonite (gomed)',d:'Methodical and dependable, you build things that last through steady effort. There is often an unconventional streak beneath the practical surface.',s:['Organised','Dependable','Determined'],w:['Rigidity','Stubbornness','Worry about security and sudden upsets'],soul:'Wants stability, order and visible results.',out:'Comes across as serious, reliable and grounded.'},
 5:{t:'The Adventurer',k:'Freedom · Change · Curiosity',p:'Mercury',col:'Green',gem:'Emerald',d:'A quick, curious mind that loves variety, movement and new experiences. You adapt fast and communicate well.',s:['Versatile','Quick learner','Persuasive'],w:['Restlessness','Inconsistency','Impulsiveness'],soul:'Wants freedom, adventure and mental stimulation.',out:'Comes across as energetic, clever and magnetic.'},
 6:{t:'The Nurturer',k:'Love · Responsibility · Harmony',p:'Venus',col:'White, pink',gem:'Diamond / white sapphire',d:'Caring, family-minded and drawn to beauty. You create comfort and balance and carry responsibility for the people you love.',s:['Loving','Responsible','Artistic'],w:['Over-giving','Perfectionism','Controlling “for others’ good”'],soul:'Wants a harmonious home and to care for others.',out:'Comes across as warm, dependable and gracious.'},
 7:{t:'The Seeker',k:'Analysis · Spirituality · Introspection',p:'Ketu',col:'Smoky grey, soft violet',gem:'Cat’s eye',d:'Thoughtful and private, drawn to deep questions, study and the inner life. You need quiet time to recharge and to find the truth for yourself.',s:['Analytical','Intuitive','Independent thinker'],w:['Aloofness','Isolating yourself','Skepticism or moodiness'],soul:'Wants understanding, solitude and inner truth.',out:'Comes across as reserved, wise and a little mysterious.'},
 8:{t:'The Achiever',k:'Power · Discipline · Material success',p:'Saturn',col:'Dark blue, black',gem:'Blue sapphire',d:'Serious and persistent, you build authority slowly through effort. You understand money, responsibility and the long game.',s:['Resilient','Strategic','Patient'],w:['Workaholic tendencies','Appearing cold or rigid','Fear of loss'],soul:'Wants achievement, security and respect.',out:'Comes across as capable, authoritative and driven.'},
 9:{t:'The Humanitarian',k:'Compassion · Courage · Completion',p:'Mars',col:'Red',gem:'Red coral',d:'A generous, energetic idealist who wants to make a difference. You fight for causes and are often at your best when serving something bigger.',s:['Compassionate','Courageous','Generous'],w:['Anger or impatience','Over-sacrificing','Difficulty letting go'],soul:'Wants to serve, to inspire and to finish what matters.',out:'Comes across as passionate, warm and larger than life.'},
 11:{t:'The Master Intuitive',k:'Inspiration · Intuition · Illumination',p:'Moon',col:'Silver, white',gem:'Pearl',d:'A master number that carries the 2’s sensitivity at a higher pitch — strong intuition, inspiration and the ability to uplift others.',s:['Visionary','Inspiring','Highly intuitive'],w:['Nervous tension','Self-doubt','Unrealistic expectations'],soul:'Wants to inspire and to follow a higher calling.',out:'Comes across as luminous, sensitive and idealistic.',base:2},
 22:{t:'The Master Builder',k:'Vision · Practicality · Large-scale results',p:'Rahu',col:'Blue, grey',gem:'Hessonite (gomed)',d:'A master number that joins the 4’s practicality to a big vision — the potential to turn large ideas into lasting structures.',s:['Practical visionary','Organised on a grand scale','Determined'],w:['Pressure and perfectionism','Overwhelm','Stubbornness'],soul:'Wants to build something that outlasts them.',out:'Comes across as capable, steady and quietly powerful.',base:4},
 33:{t:'The Master Teacher',k:'Compassion · Service · Guidance',p:'Venus',col:'Pink, white',gem:'Diamond / white sapphire',d:'A master number that lifts the 6’s love and care into service of many — healing, teaching and guiding others.',s:['Selfless','Nurturing','Inspiring teacher'],w:['Carrying everyone’s burdens','Self-neglect','Idealism'],soul:'Wants to heal, teach and uplift.',out:'Comes across as gentle, wise and deeply caring.',base:6}
};
const NM_YEAR = {1:'New beginnings — start, decide, take the lead.',2:'Patience and partnership — cooperate and let things grow.',3:'Creativity and social expansion — express yourself.',4:'Foundations and hard work — organise, build, be practical.',5:'Change and freedom — travel, variety, unexpected turns.',6:'Home, love and responsibility — family and relationships.',7:'Reflection and learning — slow down, study, look within.',8:'Achievement and money — career, power, results.',9:'Completion and release — finish, let go, forgive.'};
const NM_LOSHU = [[4,9,2],[3,5,7],[8,1,6]];
const NM_MISS = {1:'self-expression and assertiveness',2:'sensitivity and cooperation',3:'creative communication',4:'discipline and structure',5:'balance and adaptability',6:'care and domestic harmony',7:'reflection and faith',8:'drive and handling money',9:'idealism and follow-through'};
const NM_LINES = [['Mental plane',[4,9,2]],['Emotional plane',[3,5,7]],['Practical plane',[8,1,6]],['Thought',[4,3,8]],['Will',[9,5,1]],['Action',[2,7,6]],['Determination',[4,5,6]],['Compassion',[2,5,8]]];

function nmReduce(n, masters){ const steps = [n]; while (n > 9){ if (masters && (n === 11 || n === 22 || n === 33)) break; n = String(n).split('').reduce((a, c) => a + (+c), 0); steps.push(n); } return { n, steps }; }
function nmStepsTxt(r){ return r.steps.map((v, i) => i === 0 ? `${v}` : `${r.steps[i-1]}`.split('').join('+') + ` = ${v}`).slice(1).join(' → ') || `${r.steps[0]}`; }
function nmName(name, sys){
  const map = sys === 'chaldean' ? NM_CHALDEAN : NM_PYTH, masters = sys !== 'chaldean';
  const words = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().split(/[^A-Z]+/).filter(Boolean);
  if (!words.length) return null;
  let tot = 0, vow = 0, con = 0;
  const wl = words.map(w => {
    const hasV = /[AEIOU]/.test(w);
    const letters = [...w].map(ch => ({ ch, v: map[ch], vowel: 'AEIOU'.includes(ch) || (ch === 'Y' && !hasV) }));
    const sum = letters.reduce((a, l) => a + l.v, 0);
    letters.forEach(l => { tot += l.v; if (l.vowel) vow += l.v; else con += l.v; });
    return { w, letters, sum };
  });
  return { words: wl, total: tot, vowels: vow, cons: con, name: nmReduce(tot, masters), soul: vow ? nmReduce(vow, masters) : null, pers: con ? nmReduce(con, masters) : null };
}
function nmDob(ds, sys, year){
  const [y, m, d] = ds.split('-').map(Number); if (!y || !m || !d) return null;
  const masters = sys !== 'chaldean', ds2 = n => String(n).split('').reduce((a, c) => a + (+c), 0);
  const day = nmReduce(d, masters), mulank = nmReduce(d, false);
  const rd = nmReduce(d, masters).n, rm = nmReduce(m, masters).n, ry = nmReduce(ds2(y), masters).n;
  const life = masters ? nmReduce(rd + rm + ry, true) : nmReduce(ds2(d) + ds2(m) + ds2(y), false);
  const attitude = nmReduce(d + m, false), py = nmReduce(nmReduce(d, false).n + nmReduce(m, false).n + nmReduce(ds2(year), false).n, false);
  const digits = (`${String(d).padStart(2, '0')}${String(m).padStart(2, '0')}${y}`).split('').map(Number).filter(x => x > 0).concat([mulank.n, nmReduce(ds2(d) + ds2(m) + ds2(y), false).n]);
  const counts = {}; for (let i = 1; i <= 9; i++) counts[i] = digits.filter(x => x === i).length;
  return { y, m, d, day, mulank, life, attitude, py, counts, lifeParts: [rd, rm, ry] };
}


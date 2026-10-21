import os, json
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
# Yoga facets (layer schema v1.1): id -> (name, category, tone, meaning, [2 real-life scenes], at best, watch, self-check question)
# Detectors (exact rules, shown to the reader as "why it shows in your chart") live in the JS API below.
CATS = ['Moon yogas', 'Sun yogas', 'Planet combinations', 'Wealth and learning', 'Exchanges', 'Reversals and recoveries', 'Status and power', 'Great-person yogas', 'Surrounding yogas', 'Cautions']
Y = [
 ('sunapha', 'Sunapha Yoga', 0, 'support', 'a planet stands next to your Moon in the 2nd house from it, which tends to give your mind resources of its own', ['you often find your own ideas, savings or skills to lean on', 'people may notice that you recover on your own after a low patch'], 'turn self-reliance into steady earnings and a calm mind', 'relying on yourself so much that you do not ask for help', 'Do you tend to find your own way through a hard patch?'),
 ('anapha', 'Anapha Yoga', 0, 'support', 'a planet stands in the 12th house from your Moon, which tends to give a composed, well-mannered way of carrying yourself', ['you may be known for a calm, dignified manner', 'you often look after your health, comfort and reputation without fuss'], 'carry yourself with grace and a settled mind', 'drifting into comfort when effort is needed', 'Do others describe you as composed and well-mannered?'),
 ('durudhara', 'Durudhara Yoga', 0, 'support', 'planets stand on both sides of your Moon (2nd and 12th from it), which tends to give emotional support and a comfortable life with some resources', ['you often have people or resources you can fall back on', 'your mood tends to steady once you have a little security around you'], 'enjoy comfort and share it generously', 'taking your cushion for granted', 'Do you usually feel there is something to fall back on?'),
 ('kemadruma', 'Kemadruma Yoga', 0, 'challenge', 'no planet stands beside your Moon (2nd, 12th or with it), which tends to make you feel alone with your feelings at times', ['you may feel you carry your worries by yourself', 'you may need to build your own support, because it does not arrive on its own'], 'build a few reliable connections and a steady routine', 'withdrawing into worry or trusting nobody', 'Do you sometimes feel you carry your worries alone?'),
 ('adhi', 'Adhi Yoga', 0, 'support', 'benefic planets stand in the 6th, 7th or 8th from your Moon, which tends to give a gift for leading and for winning others over', ['you may find that people trust you with responsibility', 'you often manage rivals and obstacles with tact'], 'lead with steadiness and win support without force', 'relaxing into the lead and letting details slide', 'Do people tend to trust you with leading things?'),
 ('gajakesari', 'Gaja Kesari Yoga', 0, 'support', 'Jupiter stands in a kendra from your Moon, which tends to give a good name, sound judgement and a talent for recovering', ['people may come to you for advice', 'your reputation often outlasts a bad spell'], 'earn respect with sound judgement and a generous heart', 'overconfidence, or taking good fortune as a given', 'Do you tend to recover your standing after setbacks?'),
 ('chandramangala', 'Chandra-Mangala Yoga', 0, 'mixed', 'the Moon and Mars are together, which tends to combine feeling and drive into a talent for earning and for acting on instinct', ['you may be quick to turn an emotion into action', 'you may have a feel for money-making ideas and for taking a chance'], 'turn strong feeling into energy for work and earning', 'acting on a mood or an irritation too fast', 'Do you tend to turn feelings straight into action?'),
 ('shakata', 'Shakata Yoga', 0, 'challenge', 'the Moon stands in the 6th, 8th or 12th from Jupiter, which tends to make fortune rise and fall in waves', ['you may notice periods where things pick up and then slip', 'support may arrive, then need rebuilding'], 'keep a steady base so the low points stay short', 'reading every dip as the end of a good run', 'Do your fortunes tend to come in waves?'),
 ('amala', 'Amala Yoga', 0, 'support', 'only benefic planets stand in the 10th from your Lagna or Moon, which tends to give a clean reputation built on good conduct', ['you may care how your work reflects on your name', 'people often remember you for how you behaved, not only what you earned'], 'build a name that holds up over the years', 'being so careful of your image that you hold back', 'Do you tend to guard your good name carefully?'),
 ('vesi', 'Vesi Yoga', 1, 'support', 'a planet stands in the 2nd from your Sun, which tends to give a balanced, truthful and well-spoken way of working', ['you may be known for speaking plainly and keeping your word', 'you often work steadily and keep a good name for it'], 'be dependable and plain-spoken at work', 'being blunt without noticing', 'Do people count on you to say things plainly?'),
 ('vasi', 'Vasi Yoga', 1, 'support', 'a planet stands in the 12th from your Sun, which tends to give a giving, capable and active nature', ['you may be the one who steps in to help when needed', 'you often put effort into causes beyond your own'], 'put your energy where it helps others and yourself', 'giving so much that you run low', 'Do you tend to step in and help without being asked?'),
 ('ubhayachari', 'Ubhayachari Yoga', 1, 'support', 'planets stand on both sides of your Sun, which tends to give a steady presence and an even temper', ['you may stay level when others get excited', 'you often have people on both sides who back your efforts'], 'be a steady, balanced leader', 'taking support for granted', 'Do you tend to stay level when things get heated?'),
 ('budhaditya', 'Budhaditya Yoga', 1, 'support', 'the Sun and Mercury are together, which tends to give a sharp mind and skill with words and numbers', ['you may pick up ideas quickly and explain them clearly', 'you often do well where thinking and communication count'], 'think clearly and share what you know', 'overthinking or being too sure of your own opinion', 'Do you pick things up and explain them quickly?'),
 ('gurumangala', 'Guru-Mangala Yoga', 2, 'support', 'Jupiter and Mars are together, which tends to combine good judgement with drive', ['you may act on a plan with real energy', 'you often find it natural to defend a principle'], 'act on wise plans with courage', 'pushing a belief harder than the situation needs', 'Do you tend to act hard on what you believe?'),
 ('lakshmi', 'Lakshmi Yoga', 3, 'support', 'the 9th lord is strong in a kendra or trikona and the Lagna lord is not weak, which tends to bring comfort, grace and good fortune', ['you may find opportunities arrive through people you respect', 'you often feel supported in the long run'], 'use good fortune for something lasting', 'coasting on past luck', 'Do you feel a sense of support when you most need it?'),
 ('saraswati', 'Saraswati Yoga', 3, 'support', 'Jupiter, Venus and Mercury stand in kendras, trikonas or the 2nd with Jupiter strong, which tends to give learning, skill and expression', ['you may enjoy study, music, writing or craft', 'you often find that skill brings recognition'], 'learn deeply and share what you know', 'collecting knowledge without finishing anything', 'Do you enjoy learning and sharing what you know?'),
 ('dhana', 'Dhana Yoga', 3, 'support', 'two lords of the wealth houses (2nd, 5th, 9th, 11th) are linked, which tends to support earning and saving', ['you may find money connected to your skills and your people', 'you often see more than one route to income'], 'turn skill and connection into steady wealth', 'spending as freely as income arrives', 'Do you tend to see more than one way to earn?'),
 ('maha_parivartana', 'Maha Parivartana Yoga', 4, 'support', 'two lords of good houses have swapped places, which tends to link two areas of life so that they lift each other', ['you may notice two parts of life that feed each other', 'effort in one area often helps the other'], 'use the link between the two areas on purpose', 'neglecting one area and then feeling both slip', 'Do two areas of your life tend to help each other?'),
 ('khala_parivartana', 'Khala Parivartana Yoga', 4, 'mixed', 'the 3rd lord has swapped places with the lord of another good house, which tends to give courage and a restless drive to try again', ['you may be bold about starting over', 'you may meet resistance first and win by persistence'], 'turn persistence into progress', 'picking fights to prove a point', 'Do you tend to win through persistence?'),
 ('dainya_parivartana', 'Dainya Parivartana Yoga', 4, 'challenge', 'a lord of a difficult house (6th, 8th or 12th) has swapped places with another lord, which tends to link an easy area with a demanding one', ['you may feel one area pulls the other into effort', 'you may learn through pressure and then gain skill'], 'turn the demanding area into strength', 'letting stress from one area spill into the other', 'Do the harder and easier areas of your life tend to affect each other?'),
 ('harsha', 'Harsha Viparita Raja Yoga', 5, 'support', 'the 6th lord stands in a difficult house (6th, 8th or 12th), which tends to turn conflict and illness into strength', ['you may recover well from health scares or disputes', 'you often outlast people who opposed you'], 'turn rivals and health lessons into resilience', 'relishing a fight more than needed', 'Do you tend to come out of conflicts stronger?'),
 ('sarala', 'Sarala Viparita Raja Yoga', 5, 'support', 'the 8th lord stands in a difficult house (6th, 8th or 12th), which tends to turn sudden change into strength', ['you may handle crises with surprising calm', 'you often find a gain after a loss'], 'turn upheaval into long-term resilience', 'expecting the next shock', 'Do you tend to cope well when everything shifts?'),
 ('vimala', 'Vimala Viparita Raja Yoga', 5, 'support', 'the 12th lord stands in a difficult house (6th, 8th or 12th), which tends to keep expenses and losses in check', ['you may be careful and frugal when it counts', 'you often find peace in simple living'], 'live simply and keep your peace', 'living too tightly', 'Do you tend to spend carefully and keep things simple?'),
 ('neecha_bhanga', 'Neecha Bhanga Yoga', 5, 'support', 'a planet in its weak sign has its weakness eased by the chart, which tends to turn an early struggle in that area into a strength', ['you may start slowly in that area and then rise', 'you often develop the skill the hard way and keep it'], 'turn early struggle into mastery', 'writing yourself off in the early years', 'Has something that began as a weak point in your life turned into a strength?'),
 ('dharma_karmadhipati', 'Dharma-Karmadhipati Yoga', 6, 'support', 'the 9th and 10th lords are linked, which tends to join purpose and career', ['you may feel your work matters beyond a pay cheque', 'you often rise when you work for something you believe in'], 'build a career with purpose behind it', 'driving yourself on principle without rest', 'Do you work best when your work feels meaningful?'),
 ('raja_kt', 'Raja Yoga (kendra-trikona link)', 6, 'support', 'a kendra lord and a trikona lord are linked, which tends to give rise in status through effort', ['you may find that responsibility finds you and then lifts you', 'you often get recognised after a stretch of steady work'], 'earn a respected position with steady effort', 'wanting the title before the work', 'Do you tend to rise through steady effort?'),
 ('ruchaka', 'Ruchaka Yoga', 7, 'support', 'Mars is in its own or exalted sign in a kendra, which tends to give courage, strength and a commanding presence', ['you may take charge in a crisis', 'you often have stamina and a direct style'], 'lead with courage and protect others', 'temper and impatience', 'Do you tend to take charge when things get hard?'),
 ('bhadra', 'Bhadra Yoga', 7, 'support', 'Mercury is in its own or exalted sign in a kendra, which tends to give a sharp mind, a good memory and skill with words', ['you may be quick at study, trade or speaking', 'you often explain things well'], 'use your mind and speech for something worthwhile', 'talking more than doing', 'Do you tend to think and speak quickly and clearly?'),
 ('hamsa', 'Hamsa Yoga', 7, 'support', 'Jupiter is in its own or exalted sign in a kendra, which tends to give wisdom, goodwill and a respected name', ['you may be seen as a guide or teacher', 'you often act from clear principles'], 'guide others with wisdom and fairness', 'lecturing or overindulging', 'Do others tend to treat you as a guide?'),
 ('malavya', 'Malavya Yoga', 7, 'support', 'Venus is in its own or exalted sign in a kendra, which tends to give charm, refinement and enjoyment of life', ['you may enjoy beauty, comfort and good company', 'you often attract warmth easily'], 'create beauty and lasting affection', 'overspending on comfort', 'Do you tend to attract warmth and enjoy good company?'),
 ('sasa', 'Sasa Yoga', 7, 'support', 'Saturn is in its own or exalted sign in a kendra, which tends to give discipline, patience and authority built over time', ['you may become the dependable one others lean on', 'you often build slowly and keep what you build'], 'build something that lasts through patience', 'being stern or doubtful of yourself', 'Do others tend to lean on you as the dependable one?'),
 ('chamara', 'Chamara Yoga', 7, 'support', 'the Lagna lord is exalted in a kendra and Jupiter looks at it, which tends to give a respected, learned and well-regarded life', ['you may be treated with respect from early on', 'you often have a gift for speaking well'], 'use your standing to help others', 'taking respect as a given', 'Do you tend to be treated with respect by those around you?'),
 ('sankha', 'Sankha Yoga', 7, 'support', 'the Lagna lord is strong and the 5th and 6th lords stand in kendra to each other, which tends to give a long, comfortable life with a kind nature', ['you may feel generous and fairly comfortable', 'you often pair kindness with common sense'], 'share comfort and practise kindness', 'drifting into ease', 'Do you tend to combine kindness with common sense?'),
 ('kalanidhi', 'Kalanidhi Yoga', 7, 'support', 'Jupiter is in the 2nd or 5th with Mercury and Venus linked to it, which tends to give refined learning and the arts', ['you may have an ear for language, music or craft', 'you often earn respect for your skill'], 'refine a craft and teach it', 'staying a student forever', 'Do you tend to enjoy craft, language or the arts?'),
 ('vasumati', 'Vasumati Yoga', 3, 'support', 'Jupiter, Venus and Mercury all stand in the 3rd, 6th, 10th or 11th, which tends to give wealth that grows with effort', ['you may find your income grows as your skill grows', 'you often earn more in later years'], 'let effort and time compound', 'waiting for luck instead of using effort', 'Does your income tend to grow as your skill grows?'),
 ('subha_kartari_l', 'Shubha Kartari Yoga (from Lagna)', 8, 'support', 'benefic planets stand on both sides of your Lagna, which tends to give support around you', ['you may feel protected at key moments', 'you often have helpful people on both sides'], 'accept support and give it back', 'taking support for granted', 'Do you tend to feel protected at key moments?'),
 ('papa_kartari_l', 'Papa Kartari Yoga (from Lagna)', 8, 'challenge', 'harsh planets stand on both sides of your Lagna, which tends to bring pressure around you', ['you may feel hemmed in at times', 'you may learn firmness through that pressure'], 'turn pressure into discipline', 'feeling boxed in and giving up', 'Do you sometimes feel hemmed in?'),
 ('subha_kartari_m', 'Shubha Kartari Yoga (from Moon)', 8, 'support', 'benefic planets stand on both sides of your Moon, which tends to give emotional support', ['you may feel cushioned when feelings run high', 'you often have a steady circle around you'], 'accept comfort and give it back', 'avoiding discomfort', 'Do you tend to feel emotionally cushioned?'),
 ('papa_kartari_m', 'Papa Kartari Yoga (from Moon)', 8, 'challenge', 'harsh planets stand on both sides of your Moon, which tends to bring emotional pressure', ['you may feel tense and watchful', 'you may build resilience through it'], 'build calm habits that keep you steady', 'carrying tension without noticing', 'Do you sometimes feel tense without a clear reason?'),
 ('chatussagara', 'Chatussagara Yoga', 6, 'support', 'all four kendras are occupied, which tends to give wide reach and a well-known name', ['you may be involved in many areas at once', 'you often have a broad network'], 'use your reach with purpose', 'spreading yourself too thin', 'Do you tend to be involved in many areas at once?'),
 ('daridra', 'Daridra Yoga (income strain)', 9, 'challenge', 'the 11th lord stands in a difficult house (6th, 8th or 12th), which tends to make income need extra care', ['you may find gains arrive with extra effort', 'you may need to plan around uneven income'], 'build steady habits around money', 'living hand to mouth', 'Does your income tend to need extra planning?'),
]
assert len({y[0] for y in Y}) == len(Y) == 41 and all(len(y) == 9 and len(y[5]) == 2 and y[2] < len(CATS) for y in Y)
DATA = dict(schema='layer-v1.1', cats=CATS, yogas=[dict(id=y[0], name=y[1], cat=y[2], tone=y[3], meaning=y[4], scenes=y[5], best=y[6], watch=y[7], ask=y[8]) for y in Y],
            note='A yoga is a tendency, not a promise: it shows where the chart leans, and the running dasha, the strength of the planets and your own choices decide how much of it you see.')
HEAD = '''/* ============================================================================
   GENERATED by tools/reading_gen (edit the table in tools/reading_gen/build_yg.py, then run tools/reading_gen/regen.sh). Do not hand-edit this file.
   YOGA ENGINE (YGE): 41 yogas with exact detectors + real-life facets, layer schema v1.1.
   YGE.detect(chart)  -> [{id, name, cat, tone, planets, houses, why, cancelled?, text, ...}] for the yogas present in a computed chart.
   Every item shows the rule it matched ("why") with the actual placements, then meaning, 2 real-life scenes, at best, watch, a self-check question.
   Whole-sign houses from the Lagna; aspects come from the app's own planet.aspectsHouses. Needs js/07 (OWN_SIGNS, EXALTATION), js/87 (VDB).
   ============================================================================ */
const YGE_DATA = '''
API = r'''

window.YGE = (function(D){
  'use strict';
  if (typeof VDB === 'undefined') return null;
  const CP = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'], ALL = CP.concat(['Rahu','Ketu']);
  const BEN = ['Jupiter','Venus','Mercury'], MAL = ['Sun','Mars','Saturn','Rahu','Ketu'];
  const KEN = [1,4,7,10], TRI = [1,5,9], DUS = [6,8,12];
  const ordn = n => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
  const nm = arr => arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  const byId = {}; D.yogas.forEach(y => byId[y.id] = y);

  function detect(chart){
    const P = chart.planets, asc = chart.ascendant.sign, out = [];
    const lord = h => VDB.data.signs[(asc + h - 1) % 12].lord;
    const H = n => P[n] && P[n].house;
    const from = (a, k) => ((H(a) + k - 2) % 12) + 1;                      // the kth house counted from planet a's house
    const occ = (house, list) => (list || ALL).filter(n => P[n] && P[n].house === house);
    const asp = (a, b) => P[a] && P[b] && a !== b && (P[a].aspectsHouses || []).includes(P[b].house);
    const link = (a, b) => a !== b && P[a] && P[b] && (P[a].house === P[b].house || (asp(a, b) && asp(b, a)));
    const exch = (h1, h2) => { const a = lord(h1), b = lord(h2); return a !== b && P[a] && P[b] && P[a].house === h2 && P[b].house === h1; };
    const strong = n => P[n] && ((OWN_SIGNS[n] || []).includes(P[n].sign) || (EXALTATION[n] && EXALTATION[n].sign === P[n].sign));
    const weak = n => P[n] && EXALTATION[n] && P[n].sign === getDebilitation(n).sign;
    const lg = lord(1), L = h => lord(h);
    const add = (id, planets, houses, why, extra) => { const y = byId[id]; out.push(Object.assign({ id, name: y.name, cat: D.cats[y.cat], tone: y.tone, planets, houses, why, meaning: y.meaning, scenes: y.scenes, best: y.best, watch: y.watch, ask: y.ask }, extra || {})); };
    const mo = 'Moon';
    // ---- Moon yogas ----
    const s2 = occ(from(mo, 2), ['Mars','Mercury','Jupiter','Venus','Saturn']), s12 = occ(from(mo, 12), ['Mars','Mercury','Jupiter','Venus','Saturn']);
    if (s2.length && s12.length) add('durudhara', s2.concat(s12), [from(mo, 2), from(mo, 12)], `${nm(s2)} in the 2nd from the Moon and ${nm(s12)} in the 12th from it`);
    else if (s2.length) add('sunapha', s2, [from(mo, 2)], `${nm(s2)} in the 2nd house from the Moon`);
    else if (s12.length) add('anapha', s12, [from(mo, 12)], `${nm(s12)} in the 12th house from the Moon`);
    const near = occ(from(mo, 2), CP.filter(n => n !== 'Sun' && n !== mo)).concat(occ(from(mo, 12), CP.filter(n => n !== 'Sun' && n !== mo)), occ(H(mo), CP.filter(n => n !== 'Sun' && n !== mo)));
    if (!near.length){
      const why = [], moonKendra = KEN.includes(H(mo)), kendraPl = CP.filter(n => n !== mo && n !== 'Sun' && KEN.includes(H(n))), jAsp = asp('Jupiter', mo);
      if (moonKendra) why.push('the Moon stands in a kendra'); if (kendraPl.length) why.push(`${nm(kendraPl)} stand${kendraPl.length > 1 ? '' : 's'} in a kendra`); if (jAsp) why.push('Jupiter looks at the Moon');
      add('kemadruma', [mo], [H(mo)], 'no planet (apart from the Sun and the nodes) in the 2nd or 12th from the Moon or with it', { cancelled: why.length > 0, note: why.length ? `This is eased because ${nm(why)}.` : '' });
    }
    const adh = BEN.filter(n => [6,7,8].includes(((H(n) - H(mo) + 12) % 12) + 1));
    if (adh.length >= 2) add('adhi', adh, adh.map(H), `${nm(adh)} in the 6th, 7th or 8th from the Moon`);
    if (KEN.includes(((H('Jupiter') - H(mo) + 12) % 12) + 1)) add('gajakesari', ['Jupiter', mo], [H('Jupiter'), H(mo)], 'Jupiter in a kendra (1st, 4th, 7th or 10th) from the Moon');
    if (H(mo) === H('Mars')) add('chandramangala', [mo, 'Mars'], [H(mo)], `the Moon and Mars together in the ${ordn(H(mo))} house`);
    if ([6,8,12].includes(((H(mo) - H('Jupiter') + 12) % 12) + 1)) add('shakata', [mo, 'Jupiter'], [H(mo), H('Jupiter')], 'the Moon in the 6th, 8th or 12th from Jupiter', { cancelled: KEN.includes(H(mo)), note: KEN.includes(H(mo)) ? 'This is eased because the Moon stands in a kendra from the Lagna.' : '' });
    const ten = [10, from(mo, 10)];
    for (const t of ten){ const o = occ(t); if (o.length && o.every(n => BEN.includes(n))){ add('amala', o, [t], `only benefic planets (${nm(o)}) in the ${t === 10 ? '10th from the Lagna' : '10th from the Moon'}`); break; } }
    // ---- Sun yogas ----
    const v2 = occ(from('Sun', 2), ['Mars','Mercury','Jupiter','Venus','Saturn']), v12 = occ(from('Sun', 12), ['Mars','Mercury','Jupiter','Venus','Saturn']);
    if (v2.length && v12.length) add('ubhayachari', v2.concat(v12), [from('Sun', 2), from('Sun', 12)], `${nm(v2)} in the 2nd from the Sun and ${nm(v12)} in the 12th from it`);
    else if (v2.length) add('vesi', v2, [from('Sun', 2)], `${nm(v2)} in the 2nd house from the Sun`);
    else if (v12.length) add('vasi', v12, [from('Sun', 12)], `${nm(v12)} in the 12th house from the Sun`);
    if (H('Sun') === H('Mercury')) add('budhaditya', ['Sun', 'Mercury'], [H('Sun')], `the Sun and Mercury together in the ${ordn(H('Sun'))} house`, { note: (P.Mercury.combustion && P.Mercury.combustion.combust) ? 'Mercury is very close to the Sun here, so the mind-and-words gift may need extra care.' : '' });
    // ---- Planet combinations ----
    if (H('Jupiter') === H('Mars')) add('gurumangala', ['Jupiter', 'Mars'], [H('Jupiter')], `Jupiter and Mars together in the ${ordn(H('Jupiter'))} house`);
    if (strong(L(9)) && !weak(lg) && (KEN.includes(H(L(9))) || TRI.includes(H(L(9))))) add('lakshmi', [L(9), lg], [H(L(9))], `the 9th lord ${L(9)} is in its own or exalted sign in the ${ordn(H(L(9)))} house, and the Lagna lord ${lg} is not weak`);
    if (BEN.every(n => [1,2,4,5,7,9,10].includes(H(n))) && strong('Jupiter')) add('saraswati', BEN, BEN.map(H), 'Jupiter, Venus and Mercury in kendras, trikonas or the 2nd house, with Jupiter in its own or exalted sign');
    const W = [2,5,9,11], pairs = [];
    for (let i = 0; i < W.length; i++) for (let j = i + 1; j < W.length; j++){ const a = L(W[i]), b = L(W[j]); if (a !== b && (link(a, b) || exch(W[i], W[j]))) pairs.push([W[i], W[j], a, b]); }
    if (pairs.length) add('dhana', [...new Set(pairs.flatMap(p => [p[2], p[3]]))], [...new Set(pairs.flatMap(p => [H(p[2]), H(p[3])]))], pairs.slice(0, 3).map(p => `the ${ordn(p[0])} lord ${p[2]} and the ${ordn(p[1])} lord ${p[3]} are linked`).join('; '));
    // ---- Exchanges ----
    const GOOD = [1,2,4,5,7,9,10,11];
    for (let a = 1; a <= 12; a++) for (let b = a + 1; b <= 12; b++){
      if (!exch(a, b)) continue;
      const pl = [L(a), L(b)], why = `the ${ordn(a)} lord ${L(a)} and the ${ordn(b)} lord ${L(b)} have swapped houses`;
      if (GOOD.includes(a) && GOOD.includes(b)) add('maha_parivartana', pl, [a, b], why);
      else if ((a === 3 && !DUS.includes(b)) || (b === 3 && !DUS.includes(a))) add('khala_parivartana', pl, [a, b], why);
      else if (DUS.includes(a) !== DUS.includes(b)) add('dainya_parivartana', pl, [a, b], why);
    }
    // ---- Reversals and recoveries ----
    [[6,'harsha'],[8,'sarala'],[12,'vimala']].forEach(([h, id]) => { const l = L(h); if (P[l] && DUS.includes(H(l))) add(id, [l], [H(l)], `the ${ordn(h)} lord ${l} in the ${ordn(H(l))} house`); });
    CP.forEach(n => {
      if (!weak(n)) return;
      const disp = VDB.data.signs[P[n].sign].lord, exl = VDB.data.signs[EXALTATION[n].sign].lord, fromMoon = x => ((H(x) - H(mo) + 12) % 12) + 1;
      let cond = '';
      if (P[disp] && (KEN.includes(H(disp)) || (disp !== mo && KEN.includes(fromMoon(disp))))) cond = `its sign lord ${disp} stands in a kendra from the ${KEN.includes(H(disp)) ? 'Lagna' : 'Moon'}`;
      else if (P[exl] && exl !== disp && (KEN.includes(H(exl)) || (exl !== mo && KEN.includes(fromMoon(exl))))) cond = `${exl}, lord of the sign where ${n} would be exalted, stands in a kendra`;
      else if (P[disp] && disp !== n && (H(disp) === H(n) || asp(disp, n))) cond = `its sign lord ${disp} joins or looks at it`;
      if (cond) add('neecha_bhanga', [n, disp], [H(n)], `${n} is in its weak sign and ${cond}`, { planet: n });
    });
    // ---- Status and power ----
    const l9 = L(9), l10 = L(10);
    if (l9 === l10 && P[l9]) add('dharma_karmadhipati', [l9], [H(l9)], `${l9} rules both the 9th and 10th houses`);
    else if (P[l9] && P[l10] && (link(l9, l10) || exch(9, 10))) add('dharma_karmadhipati', [l9, l10], [H(l9), H(l10)], `the 9th lord ${l9} and the 10th lord ${l10} are linked`);
    const rp = [];
    [4,7,10].forEach(k => [5,9].forEach(t => { const a = L(k), b = L(t); if (a !== b && (link(a, b) || exch(k, t))) rp.push([k, t, a, b]); }));
    if (rp.length) add('raja_kt', [...new Set(rp.flatMap(p => [p[2], p[3]]))], [...new Set(rp.flatMap(p => [H(p[2]), H(p[3])]))], rp.slice(0, 3).map(p => `the ${ordn(p[0])} lord ${p[2]} and the ${ordn(p[1])} lord ${p[3]} are linked`).join('; '));
    // ---- Great-person (Pancha Mahapurusha) + rarer ----
    [['Mars','ruchaka'],['Mercury','bhadra'],['Jupiter','hamsa'],['Venus','malavya'],['Saturn','sasa']].forEach(([n, id]) => { if (strong(n) && KEN.includes(H(n))) add(id, [n], [H(n)], `${n} in its own or exalted sign in the ${ordn(H(n))} house (a kendra)`); });
    if (EXALTATION[lg] && P[lg].sign === EXALTATION[lg].sign && KEN.includes(H(lg)) && (asp('Jupiter', lg) || (H('Jupiter') === H(lg) && lg !== 'Jupiter'))) add('chamara', [lg, 'Jupiter'], [H(lg)], `the Lagna lord ${lg} is exalted in the ${ordn(H(lg))} house and Jupiter looks at it`);
    if (strong(lg) && L(5) !== L(6) && KEN.includes(((H(L(6)) - H(L(5)) + 12) % 12) + 1)) add('sankha', [lg, L(5), L(6)], [H(L(5)), H(L(6))], `the Lagna lord ${lg} is strong, and the 5th lord ${L(5)} and 6th lord ${L(6)} stand in kendra to each other`);
    if ([2,5].includes(H('Jupiter')) && ['Mercury','Venus'].every(n => H(n) === H('Jupiter') || asp(n, 'Jupiter'))) add('kalanidhi', ['Jupiter','Mercury','Venus'], [H('Jupiter')], `Jupiter in the ${ordn(H('Jupiter'))} house with Mercury and Venus joining or looking at it`);
    if (BEN.every(n => [3,6,10,11].includes(H(n)))) add('vasumati', BEN, BEN.map(H), 'Jupiter, Venus and Mercury all in the 3rd, 6th, 10th or 11th house');
    // ---- Surrounding ----
    const sides = (house, tag) => {
      const a = occ(house === 1 ? 2 : from(mo, 2)), b = occ(house === 1 ? 12 : from(mo, 12)), ha = house === 1 ? 2 : from(mo, 2), hb = house === 1 ? 12 : from(mo, 12);
      const A = a.filter(n => n !== mo), B = b.filter(n => n !== mo);
      if (A.length && B.length && A.concat(B).every(n => BEN.includes(n))) add('subha_kartari_' + tag, A.concat(B), [ha, hb], `benefic planets (${nm(A)} and ${nm(B)}) on both sides`);
      else if (A.length && B.length && A.concat(B).every(n => MAL.includes(n))) add('papa_kartari_' + tag, A.concat(B), [ha, hb], `harsh planets (${nm(A)} and ${nm(B)}) on both sides`);
    };
    sides(1, 'l'); sides(0, 'm');
    if (KEN.every(h => occ(h).length)) add('chatussagara', ALL.filter(n => KEN.includes(H(n))), KEN, 'all four kendras (1st, 4th, 7th, 10th) hold planets');
    if (P[L(11)] && DUS.includes(H(L(11)))) add('daridra', [L(11)], [H(L(11))], `the 11th lord ${L(11)} in the ${ordn(H(L(11)))} house`);
    out.forEach(x => {
      const cl = x.note ? ' ' + x.note : '';
      x.text = `${x.name}. Why it shows in your chart: ${x.why}. In plain words: ${x.meaning.charAt(0).toUpperCase() + x.meaning.slice(1)}. In real life, ${x.scenes[0]}; ${x.scenes[1]}. At its best, you ${x.best}. Watch for ${x.watch}.${cl} Check this against your life: ${x.ask}`;
      x.reflect = [x.ask];
    });
    return out;
  }
  return { data: D, detect, ids: D.yogas.map(y => y.id), byId };
})(YGE_DATA);
'''
out = HEAD + json.dumps(DATA, ensure_ascii=False, indent=1) + ';' + API
open(os.path.join(REPO, 'apps/birth-chart/js/92-yoga-engine.js'), 'w', encoding='utf-8').write(out)
print('written KB:', len(out.encode()) // 1024)

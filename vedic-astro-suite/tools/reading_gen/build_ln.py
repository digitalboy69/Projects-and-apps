import os, json
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
# Life-area narratives (S7, layer schema v1.1). Facts in (LAE scores, reasons, lord placement, yogas, dasha) -> facets out -> text composed.
# Per area: noun (what the area is, "your ..."), win / slip (what goes right / what gets harder), means (what the lords give you), grow (what develops),
# stance x4 (Strong / Steady / Mixed / Needs care), practices x4, ask x2 (self-check questions), timing noun.
A = {
 'career': dict(noun='your working life and public standing', win='recognition tends to follow steady effort and people notice what you do', slip='recognition can come slowly and you may have to make your own case', means='build a respected position', grow='a reputation that others can rely on', timing='your career',
   stance=['Your chart gives your working life more support than most areas: the planets that look after career are well placed, so effort tends to turn into standing.', 'Your working life has a solid base: some parts of the chart back it clearly, and others ask for steady effort.', 'Your working life is a mixed picture: some supports are strong and some are light, so your results depend a lot on choices, timing and fit.', 'Your working life is the area that asks the most of you. The chart gives less automatic support here, which often means you build your path through skill, patience and persistence.'],
   practices=['Write down the one result you want your work to be known for, and check each month whether your time goes there.', 'Ask a person you respect for honest feedback twice a year and act on one point.', 'Build one skill that makes you hard to replace, in small daily blocks.', 'Keep a short record of your wins, so you can describe your value without guessing.'],
   ask=['Do people tend to notice your work after it has been done for a while rather than right away?', 'Have the biggest steps in your career come from steady effort rather than sudden luck?']),
 'money': dict(noun='your money, savings and income', win='income tends to find more than one route and savings can grow', slip='money may need more planning and income can feel uneven', means='earn and keep what you earn', grow='steadier habits around income and savings', timing='your finances',
   stance=['Money is one of the better supported areas in your chart: the houses and planets behind earning and saving work well together.', 'Your money picture is steady: there is a sound base, with a few places where planning makes a visible difference.', 'Your money picture is mixed: some supports are good and others are thin, so how you plan matters more than usual.', 'Money is an area that asks for care in your chart. Support is lighter here, so clear habits, a buffer and patience tend to matter more than chance.'],
   practices=['Move a fixed share of income to savings on the day it arrives.', 'Keep one buffer fund before taking any new commitment.', 'List every source of income and add one small second source over a year.', 'Review spending once a month with a simple three-column list: needs, wants, drift.'],
   ask=['Do you tend to have more than one way to earn when one dries up?', 'Does money tend to come in waves, with easy and tight periods?']),
 'marriage': dict(noun='your closest partnerships and marriage', win='close bonds tend to deepen and commitment is supported', slip='partnership can ask for more patience and clearer talk', means='keep a bond warm over time', grow='trust and honest talk', timing='your closest relationships',
   stance=['Partnership is a well supported area in your chart: the planets that look after close bonds are comfortable, so warmth and commitment come more naturally.', 'Partnership has a steady base in your chart: there are real supports, and a few places where honest effort pays off.', 'Partnership is a mixed picture in your chart: some supports are strong and some are light, so choices and timing carry more weight.', 'Partnership is an area that asks for care in your chart. Support is lighter here, which often means that closeness is built through patience, clear talk and chosen commitment.'],
   practices=['Say one thing you appreciate every day, and one thing you need every week.', 'Raise small issues early, in calm words, before they pile up.', 'Protect one regular time for just the two of you or for a close friend.', 'Notice what you expect from a partner and ask whether you offer the same.'],
   ask=['Do you tend to feel closest to people when you are honest about what you need?', 'Do you take time to decide on commitment, and does that usually serve you well?']),
 'children': dict(noun='children, students and your creative work', win='children, students and creative projects tend to bring joy and growth', slip='this area can ask for more patience, and timing may not follow your plans', means='nurture what you start', grow='patience and a gift for guiding others', timing='children and creativity',
   stance=['Children and creativity are well supported in your chart: the houses and planets behind them are comfortable, so teaching, nurturing and making things tends to go well.', 'Children and creativity have a steady base in your chart, with a few places that reward patience.', 'Children and creativity are a mixed picture in your chart: some parts are well supported and some need time and care.', 'Children and creativity ask for patience in your chart. Support is lighter here, so steady care, good timing and your own effort tend to count for more.'],
   practices=['Give a child or student in your life regular, undivided time each week.', 'Start a creative project that you can finish in small pieces.', 'Learn about timing and health habits before big family decisions.', 'Keep a place for play in your week, even when work is heavy.'],
   ask=['Do you feel most alive when you are teaching, guiding or creating something?', 'Have plans around family or creative work tended to follow their own timing?']),
 'health': dict(noun='your health, energy and daily habits', win='energy tends to recover well and good routines hold', slip='energy can dip and habits need more attention', means='keep your energy steady', grow='stamina and a body that responds to good habits', timing='your health and energy',
   stance=['Your vitality is well supported in your chart: the houses and planets behind energy and recovery are comfortable, so good habits tend to pay off quickly.', 'Your vitality has a steady base in your chart, with a few places where routine makes a clear difference.', 'Your vitality is a mixed picture in your chart: some supports are good and some are light, so regular habits matter more.', 'Your vitality is an area that asks for care in your chart. Support is lighter here, so sleep, food, movement and early check-ups are especially worth protecting. This is a reminder to look after yourself, not a medical statement.'],
   practices=['Keep a fixed sleep and wake time for four weeks and notice the difference.', 'Walk or move for twenty minutes on most days.', 'Book routine check-ups on time instead of waiting for symptoms.', 'Notice which kind of stress hits your body first and plan a small reset for it.'],
   ask=['Does your energy recover well after a hard stretch?', 'Do you notice your body first when you are under stress?']),
 'education': dict(noun='learning, study and the habit of building skill', win='learning tends to stick and skills grow with practice', slip='study can feel uneven and may need structure', means='learn and use what you learn', grow='memory, skill and a love of learning', timing='your studies and skills',
   stance=['Learning is a well supported area in your chart: the planets that look after the mind and study are comfortable, so skills tend to build well.', 'Learning has a steady base in your chart, with a few places where structure helps.', 'Learning is a mixed picture in your chart: some supports are good and some are light, so how you study matters.', 'Learning asks for more structure in your chart. Support is lighter here, so routines, good teachers and repetition tend to matter more than talent alone.'],
   practices=['Study in short daily blocks rather than long, rare ones.', 'Teach what you learn to someone else within a week.', 'Keep one notebook for questions and review it monthly.', 'Choose a teacher or group that holds you to a schedule.'],
   ask=['Do you remember best what you have used or taught?', 'Do you learn better in short regular sessions than in long ones?']),
 'foreign': dict(noun='travel, living abroad and distance from where you began', win='travel and life away from home tend to open useful doors', slip='moving away can bring more strain and slower progress', means='adapt to new places', grow='range, adaptability and a wider view', timing='travel and life abroad',
   stance=['Travel and life abroad are well supported in your chart: the houses and planets behind distance and change work together, so moving or working away from home tends to open doors.', 'Travel and life abroad have a steady base in your chart, with some places that reward preparation.', 'Travel and life abroad are a mixed picture in your chart: some supports are good and some are light, so preparation and timing matter.', 'Travel and life abroad ask for care in your chart. Support is lighter here, so clear plans, paperwork and patience tend to matter more.'],
   practices=['Prepare paperwork and savings well before any big move.', 'Build one contact in the place you want to go before you go.', 'Try a short stay before a long one.', 'Keep a link to home, such as a routine or a call, while you are away.'],
   ask=['Do you feel more yourself when you are away from where you grew up?', 'Have distance and change helped your growth more than they have hurt it?']),
 'home': dict(noun='home, family roots and property', win='home and property tend to feel settled and supportive', slip='home life can feel unsettled and property matters may be slow', means='make a home that feels safe', grow='a sense of belonging and stability', timing='home and property',
   stance=['Home and property are well supported in your chart: the houses and planets behind roots and belonging work together, so a settled home tends to come more naturally.', 'Home and property have a steady base in your chart, with some places that reward careful decisions.', 'Home and property are a mixed picture in your chart: some supports are good and some are light, so planning matters.', 'Home and property ask for care in your chart. Support is lighter here, so patience and careful decisions tend to matter more than speed.'],
   practices=['Make one corner of your home truly restful and protect it.', 'Check documents and costs carefully before any property decision.', 'Set a regular time with the family members who matter most to you.', 'Do one small repair or improvement each month so the home feels cared for.'],
   ask=['Do you feel most at peace when your home is in order?', 'Have decisions about property or moving tended to take longer than planned?']),
 'spirit': dict(noun='your inner life, beliefs and sense of meaning', win='meaning tends to grow with quiet practice and good teachers', slip='faith and meaning can feel distant and may need a steady practice', means='keep a practice that steadies you', grow='depth, calm and a sense of purpose', timing='your inner life',
   stance=['Your inner life is well supported in your chart: the houses and planets behind belief and reflection are comfortable, so quiet practice tends to feel natural and rewarding.', 'Your inner life has a steady base in your chart, with a few places where regular practice helps.', 'Your inner life is a mixed picture in your chart: some supports are good and some are light, so consistency matters.', 'Your inner life asks for patience in your chart. Support is lighter here, so a simple regular practice and honest questions tend to matter more than big experiences.'],
   practices=['Sit quietly for ten minutes at the same time each day.', 'Read or listen to one teaching you respect each week and note one line.', 'Spend time alone in nature or in silence every week.', 'Write down what gave you a sense of meaning this month.'],
   ask=['Do quiet time and reflection steady you more than activity does?', 'Have your beliefs changed a lot over the years, and did that help you?']),
}
PARTS = {  # one sentence for a high and a low value of each part; {n} = noun, {w} = win, {s} = slip, {m} = means
 'house':  ("The houses that hold {n} are well supported (many Ashtakavarga points), so {w}.", "The houses that hold {n} have lighter support (fewer Ashtakavarga points), so {s}."),
 'lords':  ("The planets in charge of this area are well supplied with strength and well placed, so you tend to have what you need to {m}.", "The planets in charge of this area have less strength or stand in difficult places, so you may need to work harder to {m}."),
 'karaka': ("The natural significators of this area are comfortable in your chart, which adds a steady background support.", "The natural significators of this area are under some strain, so it helps to look after what they stand for with deliberate habits."),
 'varga':  ("The matching divisional chart repeats the good news: the same planets are comfortable there, which suggests the support runs deeper than the surface.", "The matching divisional chart is less comfortable for the same planets, so the first impression of this area may be easier than the longer run."),
 'yogas':  ("Several yogas in your chart touch this area in a supportive way, which adds to the sense that effort here tends to find a way.", "The yogas that touch this area add pressure more than support, so it helps to build supports on purpose."),
 'dasha':  ("The timing is favourable: the periods running now and soon link to this area, so effort now tends to be rewarded.", "The timing is quieter: the periods running now and soon link less to this area, so progress may come from steady groundwork rather than quick wins."),
}
TIMING = [("Right now the timing leans in your favour for {t}.", 58), ("Right now the timing is neutral for {t}: steady effort is enough, and you do not need to force anything.", 44), ("Right now the timing asks for patience around {t}: lay groundwork and avoid big, irreversible moves.", -1)]
CLOSING = ['Take this as encouragement to use what is already working for you, and to keep building on it with care.', 'Take this as a steady base: keep what works, and put your effort where the chart asks for it.', 'Take this as a prompt to choose where to put your effort, because choices will shape this area more than the chart does.', 'Take this as a gentle warning to be patient and deliberate here, and as a reminder that effort, support and good timing can all change the picture.']
DATA = dict(schema='layer-v1.1', areas=A, parts=PARTS, closing=CLOSING, timing=TIMING,
            note='This reading describes tendencies in your chart, not fixed events. Use the questions to test it against your own life, keep what fits and leave the rest.')
HEAD = '''/* ============================================================================
   GENERATED by tools/reading_gen (edit the tables in tools/reading_gen/build_ln.py, then run tools/reading_gen/regen.sh). Do not hand-edit this file.
   LIFE-AREA NARRATIVES (LAN): a 400-600 word personal reading for each of the 9 life areas, composed from the engine's facts (layer schema v1.1).
   LAN.area(chart, id, {now}) -> { id, name, score, band, words, paragraphs[{h, text}], questions[], parts{high[], low[]}, text }
   LAN.all(chart, {now})      -> the 9 areas
   Composition: stance by band -> where the house lord sits and how that shows (VMF) -> strengths (top reasons + strongest parts) -> watch-outs (weakest reasons + parts)
   -> yoga modifiers (YGE) -> timing (running period and next five years) -> practices -> self-check questions. Second person, tendencies not fate.
   Needs js/87 (VDB), js/90 (VMF), js/91 (VDA), js/92 (YGE), js/94 (LAE).
   ============================================================================ */
const LAN_DATA = '''
API = r'''

window.LAN = (function(D){
  'use strict';
  if (typeof LAE === 'undefined' || !LAE || typeof VMF === 'undefined' || !VMF) return null;
  const SIGN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ordn = n => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
  const fill = (t, a) => t.replace('{n}', a.noun).replace('{w}', a.win).replace('{s}', a.slip).replace('{m}', a.means);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1), lc = s => s.charAt(0).toLowerCase() + s.slice(1), dot = s => /[.?!]$/.test(s) ? s : s + '.';
  const words = t => (t.match(/\S+/g) || []).length;
  const PN = { house: 'houses', lords: 'house lords', karaka: 'significators', varga: 'divisional chart', yogas: 'yogas', dasha: 'timing' };

  function build(chart, ar, opts){
    const a = D.areas[ar.id], H1 = chart.vargas.D1.houses, P = chart.planets, now = (opts && opts.now) || new Date(), para = [];
    const bi = ['Strong', 'Steady', 'Mixed', 'Needs care'].indexOf(ar.band);
    // 1. stance
    para.push({ h: 'The big picture', text: `${a.stance[bi]} Your score here is ${ar.score} out of 100 (${ar.band.toLowerCase()}), which compares this area with the other eight in your own chart.` });
    // 2. where the main house lord sits
    const h = ar.primary[0], lord = H1[h - 1].signLord, lp = P[lord];
    if (lp){
      const m = VMF.placement(lord, lp.house, lp.sign, lp.dignity && lp.dignity.status);
      para.push({ h: 'How it shows up in daily life', text: `The lord of your ${ordn(h)} house is ${lord}, and it stands in your ${ordn(lp.house)} house in ${SIGN[lp.sign]}, so this area tends to be tied up with ${m.theme}. ${m.practice[0].line} ${m.practice[1].line} People tend to experience this as ${m.others.replace(/^People tend to experience this part of you as /, '').replace(/\.$/, '')}. At its best, you ${m.atBest}; under strain, you may ${m.underStress}.` });
    }
    { const ar2 = VMF.data.arena[h - 1]; if (ar2) para.push({ h: 'Where you may notice it', text: `Because your ${ordn(h)} house stands for ${ar2.theme}, you are most likely to notice this area in everyday moments such as: ${ar2.scenes.map(x => lc(x)).join('; ')}.` }); }
    // 3. strengths
    const parts = ar.parts, high = Object.keys(parts).filter(k => parts[k] >= 60).sort((x, y) => parts[y] - parts[x]).slice(0, 2), low = Object.keys(parts).filter(k => parts[k] <= 45).sort((x, y) => parts[x] - parts[y]).slice(0, 2);
    const st = ar.pos.slice(0, 2).map(t => dot(t)), stx = high.map(k => D.parts[k][0]).map(t => fill(t, a));
    if (st.length || stx.length) para.push({ h: 'What supports you here', text: [...st, ...stx].join(' ') });
    // 4. watch-outs
    const wo = ar.neg.slice(0, 2).map(t => dot(t)), wox = low.map(k => D.parts[k][1]).map(t => fill(t, a));
    if (wo.length || wox.length) para.push({ h: 'What deserves care', text: [...wo, ...wox].join(' ') });
    else para.push({ h: 'What deserves care', text: `Nothing in the chart stands out as a clear weak point for ${a.timing}. The usual advice still applies: strong support is a base to build on, not a guarantee, so keep using it.` });
    // 5. yoga modifiers
    const ys = ar.yogas.filter(y => Math.abs(y.w) >= 4).sort((x, y) => Math.abs(y.w) - Math.abs(x.w)).slice(0, 2), mods = [];
    if (typeof YGE !== 'undefined' && YGE) ys.forEach(y => { const d = YGE.byId[y.id]; if (!d) return; mods.push(`${d.name} is present (${y.why}); it ${y.w > 0 ? 'tends to help' : 'tends to add pressure'}: ${lc(d.meaning.charAt(0).toUpperCase() + d.meaning.slice(1))}. ${y.w > 0 ? 'At its best, you ' + d.best : 'Watch for ' + d.watch}.`); });
    if (mods.length) para.push({ h: 'Combinations that shape it', text: mods.join(' ') });
    // 6. timing
    const t1 = D.timing.find(x => ar.now.score >= x[1]) || D.timing[2];
    para.push({ h: 'Timing', text: [t1[0].replace('{t}', a.timing), ar.now.why.length ? cap(ar.now.why.join('; ')) + '.' : '', ar.next5.why.length ? cap(ar.next5.why.join('; ')) + '.' : ''].filter(Boolean).join(' ') });
    para.push({ h: 'How the score is built', text: `Your ${ar.score} comes from six parts, each scored from 0 to 100 where 50 is neutral: ${Object.keys(ar.parts).map(k => `${PN[k]} ${ar.parts[k]}`).join(', ')}. ${high.length ? 'The strongest parts are the ' + high.map(k => PN[k]).join(' and the ') + '.' : 'No single part stands far above the others.'} ${low.length ? 'The lightest parts are the ' + low.map(k => PN[k]).join(' and the ') + '.' : 'No single part falls far below the others.'}` });
    // 7. practices
    const pr = bi >= 2 ? [a.practices[0], a.practices[1], a.practices[2]] : [a.practices[3], a.practices[0], a.practices[2]];
    para.push({ h: 'What helps', text: `${bi >= 2 ? 'Because support is lighter, small steady habits matter most here.' : 'Because support is good, the aim is to use it well.'} ${pr.map(dot).join(' ')}` });
    // 8. questions
    const q = a.ask.slice(); if (ar.yogas.length){ const y = ar.yogas[0], d = typeof YGE !== 'undefined' && YGE && YGE.byId[y.id]; if (d) q.push(d.ask); }
    para.push({ h: 'Check this against your life', text: q.join(' ') });
    para.push({ h: 'In short', text: D.closing[bi] });
    const text = `${ar.name}\n` + para.map(x => `${x.h}. ${x.text}`).join('\n\n');
    return { id: ar.id, name: ar.name, icon: ar.icon, score: ar.score, band: ar.band, bandTone: ar.bandTone, words: words(para.map(x => x.text).join(' ')), paragraphs: para, questions: q, parts: { high, low }, text };
  }
  function all(chart, opts){ const la = LAE.assess(chart, opts); return la.areas.map(x => build(chart, x, opts)); }
  function area(chart, id, opts){ const la = LAE.assess(chart, opts), x = la.areas.find(y => y.id === id); return x ? build(chart, x, opts) : null; }
  return { data: D, all, area, build };
})(LAN_DATA);
'''
out = HEAD + json.dumps(DATA, ensure_ascii=False, indent=1) + ';' + API
open(os.path.join(REPO, 'apps/birth-chart/js/95-life-narratives.js'), 'w', encoding='utf-8').write(out)
print('written KB:', len(out.encode()) // 1024)

/* PROBLEM FINDER engine (PRB): pick what set a problem off, how it shows up, the area of life and the exact problem;
   the engine reads the birth chart and returns the likely reasons, in plain words.
   PRB.areas                       -> [{id,name,emoji,problems:[{id,label,nature}]}]
   PRB.assess(chart, sel, {now})   -> { sel, chips, level, top[], sections[{id,emoji,title,intro,items[{tone,text,fact}]}], help[], safety, words }
   sel = { trigger:'ext'|'int'|'both', feel:'int'|'ext'|'both', area, problem, span:'new'|'months'|'years'|'life' }
   Every item carries a `fact` ({kind,...}) naming the chart value it was built from, so each line can be checked against the chart.
   Tendencies, never fate. Hand-written data; the facts come from chart.planets, chart.vargas.D1.houses, chart.ashtakavarga and HNW (today's sky and running periods). */
const PRB = (() => {
  'use strict';
  const SIGN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const MAL = ['Saturn', 'Mars', 'Rahu', 'Ketu'], PLN7 = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const ordn = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
  const nm = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const HKIND = h => h === 1 || h === 4 || h === 7 || h === 10 ? 'angle' : h === 5 || h === 9 ? 'luck' : h === 6 || h === 8 || h === 12 ? 'hard' : 'mid';
  const HNAME = { 1: 'self and body', 2: 'money, family and speech', 3: 'effort, courage and siblings', 4: 'home, mother and inner peace', 5: 'mind, children and creativity', 6: 'effort, conflict and health', 7: 'partners and other people', 8: 'sudden change, loss and hidden things', 9: 'luck, belief and father', 10: 'work and public life', 11: 'gains and friends', 12: 'rest, loss and the unseen' };
  const PWHY = { Sun: 'confidence, authority and the father', Moon: 'the feeling mind, the mother and peace', Mars: 'energy, courage and conflict', Mercury: 'thinking, speech and trade', Jupiter: 'wisdom, growth and protection', Venus: 'love, comfort and harmony', Saturn: 'discipline, delay and endurance', Rahu: 'craving, confusion and sudden turns', Ketu: 'detachment, loss and withdrawal' };

  /* ---------- the problem map: area -> houses, natural significators, and the exact problems ---------- */
  const A = (id, name, emoji, houses, karakas, hw, kw, who, problems, tip) => ({ id, name, emoji, houses, karakas, hw, kw, who, problems: problems.map(p => ({ id: p[0], label: p[1], nature: p[2], eh: p[3] || [], ep: p[4] || [] })), tip });
  const AREAS = [
    A('mother', 'Mother', '🤱', [4], ['Moon'], { 4: 'your mother, your home base and your inner peace' }, { Moon: 'the natural significator of the mother' }, 'your mother', [
      ['distance', 'We feel distant and cannot connect', 'lack'], ['fights', 'Constant arguments with her', 'conflict'], ['hurt', 'She hurt me emotionally', 'pain'], ['harm', 'Physical harm or violence at home', 'harm', [6, 8]],
      ['control', 'She is controlling or smothering', 'pressure'], ['health', 'Her health worries me', 'pressure', [6]], ['loss', 'Separation from her, or losing her', 'loss', [8, 12]], ['support', 'I did not get the support I needed', 'lack']], 'Small, steady contact usually works better than one big conversation.'),
    A('father', 'Father', '🧔', [9, 10], ['Sun'], { 9: 'your father, luck and guidance', 10: 'your father\'s standing and your public life' }, { Sun: 'the natural significator of the father' }, 'your father', [
      ['distance', 'We feel distant', 'lack'], ['fights', 'Conflict and clashes of will', 'conflict'], ['hurt', 'I carry hurt from how he treated me', 'pain'], ['harm', 'Anger, shouting or physical harm', 'harm', [6, 8]],
      ['pressure', 'Pressure, expectations and comparison', 'pressure'], ['health', 'His health worries me', 'pressure', [6]], ['loss', 'Separation from him, or losing him', 'loss', [8, 12]], ['support', 'I lack his guidance or protection', 'lack']], 'Writing down what you need from him can make the next talk calmer.'),
    A('love', 'Love & relationships', '❤️', [7, 5], ['Venus'], { 7: 'partners and committed relationships', 5: 'romance, attraction and the heart' }, { Venus: 'the natural significator of love' }, 'your partner', [
      ['breakup', 'A breakup or a heartbreak', 'loss', [8, 12]], ['betrayal', 'Cheating, lies or broken trust', 'betrayal', [8]], ['delay', 'I cannot find a partner, or it keeps getting delayed', 'delay'], ['fights', 'Constant fights in the relationship', 'conflict'],
      ['unavail', 'Falling for people who are unavailable', 'confusion'], ['cold', 'The love has gone cold or distant', 'lack'], ['control', 'A controlling or toxic partner', 'pressure', [6]], ['onesided', 'One-sided love, I give more than I receive', 'pain'], ['moveon', 'I cannot let go and move on', 'pain', [12, 8]]], 'Say what you need in one clear sentence rather than hinting.'),
    A('marriage', 'Marriage & spouse', '💍', [7, 2, 8], ['Venus', 'Jupiter'], { 7: 'your spouse and marriage', 2: 'family life and shared resources', 8: 'the depth, secrets and strain inside a marriage' }, { Venus: 'the natural significator of marriage', Jupiter: 'the protector of marriage and family' }, 'your spouse', [
      ['delay', 'Marriage is delayed', 'delay'], ['fights', 'Constant arguments after marriage', 'conflict'], ['distance', 'We live like strangers', 'lack'], ['betrayal', 'Cheating or a third person', 'betrayal', [12]],
      ['inlaws', 'Trouble with in-laws', 'pressure', [4, 6]], ['harm', 'Anger, abuse or violence', 'harm', [6]], ['separation', 'Separation or divorce', 'loss', [12, 6]], ['intimacy', 'No closeness or intimacy', 'lack', [12]]], 'A fixed weekly time to talk, without phones, protects a marriage more than grand gestures.'),
    A('children', 'Children', '👶', [5], ['Jupiter'], { 5: 'children, creativity and joy' }, { Jupiter: 'the natural significator of children' }, 'your child', [
      ['delay', 'Delay in having a child', 'delay', [2, 11]], ['worry', 'Worry about a child', 'pressure'], ['fights', 'Clashes with my child', 'conflict'], ['distance', 'Distance from my child', 'lack'], ['loss', 'Loss or a difficult pregnancy', 'loss', [8, 12]], ['study', 'My child struggles in studies or behaviour', 'confusion', [4]]], 'Short daily time with your child, with no corrections, rebuilds trust.'),
    A('money', 'Money & debts', '💰', [2, 11], ['Jupiter', 'Venus'], { 2: 'savings, income and what you keep', 11: 'gains and the flow of money', 6: 'debts and loans', 8: 'sudden loss and other people\'s money' }, { Jupiter: 'the natural significator of wealth', Venus: 'the planet of comfort and money' }, 'your money', [
      ['shortage', 'Not enough money, hard to save', 'lack', [6]], ['debt', 'Debt, loans and EMI pressure', 'pressure', [6, 8]], ['loss', 'A sudden financial loss', 'loss', [8, 12]], ['cheated', 'Cheated or betrayed over money', 'betrayal', [8, 7]],
      ['unstable', 'Income comes and goes', 'instability', [10]], ['family', 'Money fights in the family', 'conflict', [4]], ['risk', 'Losses in trading, gambling or risky bets', 'instability', [5, 8]], ['stuck', 'Stuck at the same income for years', 'delay', [10]]], 'List every inflow and outflow for one month; clarity lowers money fear fast.'),
    A('career', 'Career & work', '💼', [10, 6], ['Sun', 'Saturn'], { 10: 'career, status and public standing', 6: 'daily work, service and competition', 11: 'gains from work' }, { Sun: 'the natural significator of status', Saturn: 'the planet of work and perseverance' }, 'your work', [
      ['nojob', 'I cannot find a job', 'delay', [11]], ['stuck', 'Stuck with no growth or promotion', 'delay', [11]], ['lost', 'Lost my job or business', 'loss', [8, 12]], ['boss', 'Trouble with a boss or colleagues', 'conflict', [7]],
      ['stress', 'Overwork and burnout', 'pressure', [1]], ['wrong', 'In the wrong field, no direction', 'confusion', [9, 5]], ['business', 'My business is not working', 'instability', [7, 11]], ['credit', 'Others take credit or I am overlooked', 'pain', [11]], ['change', 'Frequent job changes', 'instability', [3]]], 'Pick one skill to deepen for 90 days; focus beats scattering.'),
    A('enemies', 'Enemies, legal & conflict', '⚖️', [6, 7, 8], ['Mars', 'Saturn'], { 6: 'enemies, disputes and legal matters', 7: 'open opponents', 8: 'hidden opposition and long cases' }, { Mars: 'the natural significator of conflict', Saturn: 'the planet of delay in justice' }, 'the dispute', [
      ['case', 'A court case or legal dispute', 'delay'], ['rivals', 'Jealous people working against me', 'betrayal', [11]], ['harass', 'Bullying, threats or harassment', 'harm'], ['property', 'A property or family dispute', 'conflict', [4]], ['neighbours', 'Fights with neighbours or relatives', 'conflict', [3, 4]], ['fraud', 'Fraud or being cheated', 'betrayal', [2]]], 'Keep every message and paper in one folder; calm records win disputes.'),
    A('health', 'Health & body', '🩺', [1, 6, 8], ['Sun', 'Mars'], { 1: 'your body and vitality', 6: 'illness and recovery', 8: 'chronic or sudden trouble' }, { Sun: 'the natural significator of vitality', Mars: 'the planet of strength and blood' }, 'your health', [
      ['lowenergy', 'Low energy and constant tiredness', 'lack', [12]], ['chronic', 'A long-running health problem', 'pressure', [8]], ['injury', 'Accidents or injuries', 'harm', [3, 8]], ['digest', 'Stomach, skin or immunity issues', 'pressure'], ['sleep', 'Poor sleep', 'pressure', [12, 4], ['Moon']], ['recovery', 'Slow recovery from illness', 'delay', [8]], ['family', 'A family member\'s illness', 'pressure', [4, 7]]], 'Use the chart as a mirror only; please see a doctor for any health concern.'),
    A('mind', 'Mind & emotional peace', '🧠', [4, 5, 12], ['Moon', 'Mercury'], { 4: 'inner peace and emotional security', 5: 'thoughts, mood and the heart', 12: 'sleep, hidden fears and the subconscious' }, { Moon: 'the planet of the mind', Mercury: 'the planet of thinking' }, 'your mind', [
      ['anxiety', 'Anxiety and overthinking', 'pressure', [3], ['Mercury']], ['sad', 'Sadness, low mood or emptiness', 'lack'], ['anger', 'Anger and irritability', 'conflict', [1], ['Mars']], ['fear', 'Fear and insecurity without a clear reason', 'confusion'], ['lonely', 'Loneliness', 'lack', [11]],
      ['esteem', 'Low self-worth', 'pain', [1], ['Sun']], ['sleep', 'Restless nights', 'pressure'], ['mood', 'Mood swings', 'instability'], ['grief', 'Carrying an old hurt', 'pain', [8]]], 'A short daily walk and a fixed bedtime are the strongest steady supports for the mind.'),
    A('home', 'Home & property', '🏠', [4], ['Mars', 'Venus'], { 4: 'home, land and property', 12: 'living away from home' }, { Mars: 'the natural significator of land and property', Venus: 'the planet of comfort and vehicles' }, 'your home', [
      ['nohome', 'Cannot buy or build a home', 'delay', [2, 11]], ['dispute', 'Property dispute', 'conflict', [6, 8]], ['unrest', 'No peace at home', 'pressure'], ['shift', 'Frequent moves or instability at home', 'instability', [3, 12]], ['loan', 'Home loan pressure', 'pressure', [6]], ['vehicle', 'Trouble with vehicles or accidents', 'harm', [3, 8]]], 'Settle one corner of your home as a calm place first; it changes how the whole house feels.'),
    A('study', 'Education & learning', '🎓', [4, 5, 9], ['Mercury', 'Jupiter'], { 4: 'basic education and concentration', 5: 'intelligence and exams', 9: 'higher studies' }, { Mercury: 'the planet of learning', Jupiter: 'the planet of wisdom and teachers' }, 'your studies', [
      ['focus', 'Cannot concentrate', 'confusion'], ['exam', 'Exam failure or fear', 'pressure', [6]], ['delay', 'Studies delayed or interrupted', 'delay'], ['abroad', 'Cannot get into the course or country I want', 'delay', [12, 9]], ['teacher', 'Trouble with teachers or guidance', 'conflict', [9]], ['direction', 'Do not know what to study', 'confusion', [10]]], 'Study in short blocks with a fixed start time; the habit matters more than the hours.'),
    A('friends', 'Friends & social life', '🤝', [11, 3], ['Mercury', 'Venus'], { 11: 'friends, networks and wishes', 3: 'siblings, neighbours and close circle' }, { Mercury: 'the planet of communication', Venus: 'the planet of friendship' }, 'your circle', [
      ['betray', 'Friends betrayed me', 'betrayal', [8]], ['lonely', 'I have no real friends', 'lack', [7]], ['siblings', 'Trouble with brothers or sisters', 'conflict', [3]], ['fame', 'Reputation or gossip trouble', 'pain', [10]], ['use', 'People use me and leave', 'pain', [7]], ['drift', 'Friends drift away', 'lack']], 'Reach out to one person this week with no agenda; connection grows from small, repeated contact.'),
    A('self', 'Self, confidence & purpose', '🔥', [1, 5, 9], ['Sun', 'Jupiter'], { 1: 'your identity and confidence', 5: 'purpose and talent', 9: 'direction and belief' }, { Sun: 'the natural significator of the self', Jupiter: 'the planet of meaning' }, 'yourself', [
      ['confidence', 'Low confidence', 'lack'], ['purpose', 'Feeling lost, no purpose', 'confusion'], ['stuck', 'Stuck, not moving ahead', 'delay'], ['approval', 'Need others\' approval', 'pain', [7]], ['habit', 'Bad habits or addiction', 'pressure', [6, 12], ['Rahu']], ['failure', 'Repeated failures or bad luck', 'instability', [8]]], 'Choose one small promise to yourself and keep it daily; self-trust is built that way.'),
    A('loss', 'Loss, grief & endings', '🕊️', [8, 12], ['Saturn', 'Ketu'], { 8: 'endings, transformation and what is taken away', 12: 'letting go, separation and the unseen' }, { Saturn: 'the planet of loss and endurance', Ketu: 'the planet of detachment' }, 'the loss', [
      ['bereave', 'Losing someone close', 'loss', [4]], ['sudden', 'A sudden, shocking event', 'instability'], ['ending', 'The end of a phase, job or relationship', 'loss'], ['stolen', 'Something lost, stolen or taken', 'loss', [2]], ['ghost', 'Cannot stop thinking about what happened', 'pain', [4], ['Moon']]], 'Grief moves in waves. Let it, and keep one tiny daily routine steady.'),
    A('foreign', 'Foreign, travel & settling', '✈️', [12, 9, 3], ['Rahu', 'Moon'], { 12: 'foreign lands and living far from home', 9: 'long journeys and higher goals', 3: 'short travel and moves' }, { Rahu: 'the planet of foreign and unusual paths', Moon: 'the planet of homesickness' }, 'your move abroad', [
      ['visa', 'Visa or move abroad is blocked', 'delay'], ['homesick', 'Homesick and unsettled abroad', 'lack', [4]], ['unsettled', 'Cannot settle anywhere', 'instability', [4, 1]], ['forced', 'Forced to live away from family', 'pressure', [4]]], 'Prepare the paperwork in small parts; delays here are about process, not about you.'),
    A('faith', 'Faith & life direction', '🙏', [9, 12, 5], ['Jupiter', 'Ketu'], { 9: 'belief, teachers and grace', 12: 'inner life and surrender', 5: 'devotion and mantra' }, { Jupiter: 'the planet of faith and teachers', Ketu: 'the planet of detachment' }, 'your inner life', [
      ['doubt', 'Lost faith, doubt everything', 'confusion'], ['guide', 'No guide or teacher', 'lack'], ['pointless', 'Nothing feels meaningful', 'lack', [1]], ['pull', 'Pulled toward the spiritual path but stuck in life', 'confusion', [4], ['Ketu']]], 'Five quiet minutes at the same time daily is a better start than long, irregular practice.')
  ];
  const AREA = {}; AREAS.forEach(a => AREA[a.id] = a);

  /* ---------- natures: which planets carry each kind of trouble, and what helps ---------- */
  const NAT = {
    delay: { c: ['Saturn', 'Ketu'], say: 'delay and waiting', sig: 'the classic signature of delay: things come, but later and with effort', help: ['Plan in small steps and measure progress monthly, not daily.', 'Saturn rewards patience and routine; a steady habit counts for more than bursts.', 'Keep the effort visible: a list, a date and one action per week.'] },
    conflict: { c: ['Mars', 'Rahu'], say: 'friction, arguments and opposition', sig: 'the usual signature of friction: quick tempers and opposing wills', help: ['Pause before replying; a ten-minute gap changes most arguments.', 'Talk about one issue at a time and keep voices low.', 'Burn off Mars with exercise rather than in conversation.'] },
    loss: { c: ['Saturn', 'Ketu'], say: 'endings, separation and loss', sig: 'the usual signature of endings and separation', help: ['Allow the loss to be a loss before you try to fix it.', 'Keep one daily routine steady while everything else shifts.', 'Talk to someone you trust; carrying it alone makes it heavier.'] },
    pain: { c: ['Saturn', 'Ketu', 'Mars'], say: 'deep hurt that stays', sig: 'the usual signature of hurt that lingers: feelings that are held in and replayed', help: ['Write the feeling down without editing; naming it softens it.', 'Choose one trusted person to speak with about it.', 'Slow, regular habits (sleep, food, walking) steady a hurting mind.'] },
    betrayal: { c: ['Rahu', 'Ketu', 'Saturn'], say: 'broken trust and hidden things', sig: 'the usual signature of hidden motives and broken trust', help: ['Slow down on trust: let people show consistency over time.', 'Keep records and keep important decisions in writing.', 'Share less with those who have not earned more.'] },
    pressure: { c: ['Saturn', 'Sun', 'Mars'], say: 'weight, duty and strain', sig: 'the usual signature of heavy duty and strain', help: ['Separate what is truly yours to carry from what is not.', 'Rest is part of the plan; schedule it first.', 'Ask for help in one specific, small way.'] },
    lack: { c: ['Ketu', 'Saturn'], say: 'emptiness and not enough', sig: 'the usual signature of feeling that something is missing', help: ['Notice what is present as well as what is missing; do both lists.', 'Fill the gap with one small, regular act of care.', 'Ketu themes ease when you give attention rather than wait for it.'] },
    instability: { c: ['Rahu', 'Mars'], say: 'ups, downs and sudden turns', sig: 'the usual signature of sudden swings', help: ['Build a safety margin (time, money, sleep) before big moves.', 'Avoid decisions made in a rush or in a high mood.', 'Fixed routines are the anchor when everything else moves.'] },
    harm: { c: ['Mars', 'Rahu', 'Saturn'], say: 'harm, force and danger', sig: 'the usual signature of force and danger', help: ['Your safety comes first. Keep distance from the source and keep trusted people informed.', 'Keep a record of what happens (dates, messages, photos).', 'Contact a trusted adult, a helpline, a doctor or the police where needed.'] },
    confusion: { c: ['Rahu', 'Ketu', 'Mercury'], say: 'confusion and mixed signals', sig: 'the usual signature of unclear direction and mixed signals', help: ['Decide on one question at a time and write the options out.', 'Wait for patterns across several weeks before trusting a feeling.', 'Ask one grounded person for an outside view.'] },
    general: { c: ['Saturn', 'Mars', 'Rahu', 'Ketu'], say: 'pressure from the harder planets', sig: 'the usual signature of pressure', help: ['Work on the area in small, regular steps.', 'Protect sleep, food and routine first.', 'Review again after your running period changes.'] }
  };
  const SENSITIVE = { harm: 1, loss: 1 };

  /* ---------- helpers on the chart ---------- */
  const rules = (D1, n) => { const o = []; D1.forEach(h => { if (h.signLord === n) o.push(h.houseNum); }); return o; };
  function ctx(chart) {
    const P = chart.planets, D1 = chart.vargas.D1.houses, SAV = chart.ashtakavarga && chart.ashtakavarga.sav || [], asc = chart.ascendant.sign;
    const occ = h => Object.keys(P).filter(n => P[n].house === h);
    const asp = h => Object.keys(P).filter(n => (P[n].aspectsHouses || []).indexOf(h) >= 0 && P[n].house !== h);
    return { P, D1, SAV, asc, occ, asp };
  }

  /* ---------- findings: w > 0 strains the matter, w < 0 supports it ---------- */
  function planetFindings(X, n, why) {
    const p = X.P[n]; if (!p) return []; const out = [], F = (w, text, fact) => out.push({ w, text, fact: Object.assign({ kind: 'planet', p: n, house: p.house, sign: p.sign }, fact) });
    const st = p.dignity && p.dignity.status, where = `${n} (${why}) stands in ${SIGN[p.sign]}, your ${ordn(p.house)} house`;
    if (st === 'Debilitated') F(2.4, `${where}, in its sign of weakness. It has to work harder here, so what it stands for is less easy to use and tends to feel tested.`, { st });
    else if (st === 'Enemy') F(1.2, `${where}, in an enemy's sign, which is an uncomfortable place: ${n} acts, but with friction.`, { st });
    else if (st === 'Exalted' || st === 'OwnSign' || st === 'Moolatrikona') F(-2, `${where}, ${st === 'Exalted' ? 'exalted' : 'in its own sign'}, which is a strong and protected placement: this part of life has real inner resources.`, { st });
    else if (st === 'Friend') F(-0.5, `${where}, in a friend's sign: comfortable and cooperative.`, { st });
    else F(0, `${where}, in a neutral sign.`, { st });
    if (p.combustion && p.combustion.combust) F(1.5, `${n} is combust, too close to the Sun, which can dim or overshadow what ${n} stands for.`, { combust: true });
    if (p.retrograde && ['Sun', 'Moon', 'Rahu', 'Ketu'].indexOf(n) < 0) F(0.6, `${n} is retrograde, so its themes turn inward and tend to return for review before they settle.`, { retro: true });
    const hk = HKIND(p.house); if (hk === 'hard') F(1.4, `${n} sits in the ${ordn(p.house)}, a house of ${HNAME[p.house]}, so its matters tend to be met through effort or in hidden ways.`, { hk }); else if (hk === 'angle' || hk === 'luck') F(-0.8, `${n} sits in the ${ordn(p.house)}, a house of ${HNAME[p.house]}, a well-supported place for it.`, { hk });
    Object.keys(X.P).filter(m => m !== n && X.P[m].house === p.house).forEach(m => { if (MAL.indexOf(m) >= 0 || m === 'Sun') F(m === 'Sun' ? 0.8 : 1.2, `${m} (${PWHY[m]}) shares the house with ${n}, bringing ${m === 'Saturn' ? 'weight and delay' : m === 'Mars' ? 'heat and friction' : m === 'Rahu' ? 'craving and confusion' : m === 'Ketu' ? 'detachment and withdrawal' : 'ego and heat'} into it.`, { conj: m }); else if (m === 'Jupiter' || m === 'Venus') F(-1.2, `${m} (${PWHY[m]}) shares the house with ${n}, which softens and protects it.`, { conj: m }); });
    X.asp(p.house).forEach(m => { if (MAL.indexOf(m) >= 0) F(1, `${m} looks at ${n} from the ${ordn(X.P[m].house)} house, adding ${m === 'Saturn' ? 'pressure and delay' : m === 'Mars' ? 'friction' : 'confusion or detachment'}.`, { asp: m }); else if (m === 'Jupiter') F(-1.6, `Jupiter looks at ${n} from the ${ordn(X.P[m].house)} house, which protects and widens it.`, { asp: m }); else if (m === 'Venus') F(-0.6, `Venus looks at ${n}, adding warmth.`, { asp: m }); });
    const nk = p.nakshatra; if (nk) out.push({ w: 0, text: `${n} is in ${nk.name}, ruled by ${nk.lord}, so ${n}'s result here is coloured by ${nk.lord}.`, fact: { kind: 'planet', p: n, house: p.house, sign: p.sign, nak: nk.name } });
    return out.filter(f => f.text);
  }
  function houseFindings(X, h, hw) {
    const d = X.D1[h - 1], sign = d.sign, lord = d.signLord, lp = X.P[lord], out = [], F = (w, text, fact) => out.push({ w, text, fact: Object.assign({ kind: 'house', h, sign, lord }, fact) });
    out.push({ w: 0, text: `Your ${ordn(h)} house (${hw}) is ${SIGN[sign]}, ruled by ${lord}.`, fact: { kind: 'house', h, sign, lord, intro: true } });
    if (lp && lord) {
      const lh = lp.house, st = lp.dignity && lp.dignity.status;
      if (lh === h) F(-1, `${lord}, the lord of your ${ordn(h)} house, stays in its own house, which keeps this area close to you and well watched.`, { lordHouse: lh });
      else if (HKIND(lh) === 'hard') F(1.4, `${lord}, the lord of your ${ordn(h)} house, has gone to your ${ordn(lh)} house (${HNAME[lh]}), so the matters of the ${ordn(h)} get pulled into effort, loss or hidden themes.`, { lordHouse: lh });
      else if (HKIND(lh) === 'angle' || HKIND(lh) === 'luck') F(-1, `${lord}, the lord of your ${ordn(h)} house, stands in your ${ordn(lh)} house (${HNAME[lh]}), a supported place, so the ${ordn(h)} has good backing.`, { lordHouse: lh });
      else F(0, `${lord}, the lord of your ${ordn(h)} house, stands in your ${ordn(lh)} house (${HNAME[lh]}), linking the ${ordn(h)} with those matters.`, { lordHouse: lh });
      if (st === 'Debilitated') F(2.2, `${lord}, the lord of your ${ordn(h)} house, is debilitated, so it is not at full strength.`, { lordSt: st });
      else if (st === 'Enemy') F(1, `${lord}, the lord of your ${ordn(h)} house, is in an enemy's sign and works under friction.`, { lordSt: st });
      else if (st === 'Exalted' || st === 'OwnSign' || st === 'Moolatrikona') F(-1.4, `${lord}, the lord of your ${ordn(h)} house, is ${st === 'Exalted' ? 'exalted' : 'in its own sign'}, so it is strong.`, { lordSt: st });
      if (lp.combustion && lp.combustion.combust) F(1.2, `${lord}, the lord of your ${ordn(h)} house, is combust, which can overshadow it.`, { lordCombust: true });
    }
    X.occ(h).forEach(n => { if (MAL.indexOf(n) >= 0) F(1.4, `${n} sits in your ${ordn(h)} house, bringing ${n === 'Saturn' ? 'weight, delay and caution' : n === 'Mars' ? 'heat, speed and friction' : n === 'Rahu' ? 'craving, confusion and sudden turns' : 'detachment and a feeling of distance'}.`, { occ: n });
      else if (n === 'Sun') F(0.8, `The Sun sits in your ${ordn(h)} house, adding pride and heat; it shines a light here but can overpower.`, { occ: n });
      else if (n === 'Jupiter') F(-1.6, `Jupiter sits in your ${ordn(h)} house, which protects and grows it.`, { occ: n }); else if (n === 'Venus') F(-1, `Venus sits in your ${ordn(h)} house, adding warmth and ease.`, { occ: n }); else F(-0.6, `${n} sits in your ${ordn(h)} house, a supportive presence.`, { occ: n }); });
    X.asp(h).forEach(n => { if (MAL.indexOf(n) >= 0) F(1, `${n} looks at your ${ordn(h)} house from the ${ordn(X.P[n].house)}, adding ${n === 'Saturn' ? 'pressure and delay' : n === 'Mars' ? 'friction' : 'confusion or detachment'}.`, { asp: n }); else if (n === 'Jupiter') F(-1.6, `Jupiter looks at your ${ordn(h)} house from the ${ordn(X.P[n].house)}, which protects and widens it.`, { asp: n }); else if (n === 'Venus') F(-0.6, `Venus looks at your ${ordn(h)} house, adding warmth.`, { asp: n }); });
    const sv = X.SAV[sign]; if (sv != null) { if (sv >= 30) F(-1, `Your ${ordn(h)} house holds ${sv} Ashtakavarga points (average is 28), so many planets support it.`, { sav: sv }); else if (sv <= 24) F(1.2, `Your ${ordn(h)} house holds only ${sv} Ashtakavarga points (average is 28), so it gets little support from the other planets.`, { sav: sv }); else out.push({ w: 0, text: `Your ${ordn(h)} house holds ${sv} Ashtakavarga points (average is 28): ordinary support.`, fact: { kind: 'house', h, sign, lord, sav: sv } }); }
    return out;
  }
  function culpritFindings(X, nat, houses, karakas) {
    const out = [], seen = {}; const pts = [...houses.map(h => ['house', h]), ...karakas.map(k => ['planet', k])];
    NAT[nat].c.forEach(c => { const p = X.P[c]; if (!p) return;
      pts.forEach(([kind, v]) => { const h = kind === 'house' ? v : X.P[v] && X.P[v].house; if (!h) return; const label = kind === 'house' ? `your ${ordn(h)} house` : `${v}`;
        let via = null; if (p.house === h) via = kind === 'house' ? 'sits in' : 'shares the house with'; else if ((p.aspectsHouses || []).indexOf(h) >= 0) via = 'looks at';
        if (!via || kind === 'planet' && c === v) return; const key = c + label + via; if (seen[key]) return; seen[key] = 1;
        out.push({ w: c === 'Saturn' || c === 'Rahu' ? 1.8 : 1.5, text: `${c} (${PWHY[c]}) ${via} ${label}${kind === 'planet' ? ` (${ordn(h)} house)` : ''}. That is ${NAT[nat].sig}.`, fact: { kind: 'culprit', p: c, h, via, target: kind === 'house' ? 'house' : v } }); }); });
    return out;
  }

  /* ---------- today's sky and running periods ---------- */
  function timing(chart, X, nat, houses, karakas, now, feel, span) {
    const out = []; let hn = null; try { hn = HNW.assess(chart, { now }); } catch (e) { hn = null; }
    if (!hn) return { items: [{ tone: 'n', text: 'Today\'s sky and the running periods could not be read for this date, so only the birth pattern is used.', fact: { kind: 'timing', none: true } }], w: 0 };
    let w = 0; const T = (wt, text, fact, tone) => { w += wt; out.push({ tone: tone || (wt > 0.4 ? 'b' : wt < -0.4 ? 'g' : 'n'), text, fact: Object.assign({ kind: 'timing' }, fact) }); };
    const dl = [['Mahadasha', hn.dasha.md, 1.6], ['Antardasha', hn.dasha.ad, 1.2], ['Pratyantar', hn.dasha.pd, 0.6]].filter(x => x[1]);
    dl.forEach(([lab, d, wt]) => { const n = d.lord, r = rules(X.D1, n), hit = houses.filter(h => r.indexOf(h) >= 0), sits = X.P[n] && houses.indexOf(X.P[n].house) >= 0, kar = karakas.indexOf(n) >= 0, cul = NAT[nat].c.indexOf(n) >= 0;
      if (hit.length || sits || kar || cul) { const bits = []; if (hit.length) bits.push(`rules your ${nm(hit.map(ordn))} ${hit.length > 1 ? 'houses' : 'house'}`); if (sits) bits.push(`sits in your ${ordn(X.P[n].house)} house`); if (kar) bits.push('is a natural significator of this area'); if (cul) bits.push(`is one of the planets that carries ${NAT[nat].say}`);
        const benefic = n === 'Jupiter' || n === 'Venus'; T(benefic ? -wt * 0.8 : wt, `The running ${lab} of ${n} ${nm(bits)}, so this period speaks directly to the matter.`, { dasha: lab, p: n, rules: hit, sits: !!sits, kar, cul }); }
      else T(0, `The running ${lab} of ${n} has no direct link to this area.`, { dasha: lab, p: n, none: true }, 'n'); });
    const sky = {}; hn.sky.forEach(x => sky[x.n] = x);
    ['Saturn', 'Rahu', 'Ketu', 'Mars', 'Jupiter'].forEach(n => { const x = sky[n]; if (!x) return; const on = houses.filter(h => x.house === h), look = houses.filter(h => (x.asp || []).indexOf(h) >= 0 && x.house !== h);
      const base = n === 'Saturn' ? 1.8 : n === 'Rahu' ? 1.6 : n === 'Ketu' ? 1.4 : n === 'Mars' ? 1 : -1.8;
      if (on.length) T(base, `Today ${n} is passing through your ${nm(on.map(ordn))} ${on.length > 1 ? 'houses' : 'house'}, ${n === 'Jupiter' ? 'a supportive passage that tends to ease and widen it' : 'which tends to press on this area while it stays'}.`, { transit: n, on });
      else if (look.length) T(base * 0.5, `Today ${n} looks at your ${nm(look.map(ordn))} ${look.length > 1 ? 'houses' : 'house'} from the ${ordn(x.house)}, ${n === 'Jupiter' ? 'adding protection' : 'adding some pressure'}.`, { transit: n, look }); });
    const sat = sky.Saturn, mo = X.P.Moon; if (sat && mo && feel !== 'ext') { const d = (sat.sign - mo.sign + 12) % 12; if (d === 11 || d === 0 || d === 1) T(1.5, `Saturn is in ${SIGN[sat.sign]}, ${d === 11 ? 'the sign before' : d === 0 ? 'the same sign as' : 'the sign after'} your Moon sign ${SIGN[mo.sign]}. This is Sade Sati, a long period that tends to make feelings heavier and more serious.`, { sadesati: true, d }); }
    const mh = houses[0], hh = hn.houses[mh - 1]; if (hh) T(0, `Right now your ${ordn(mh)} house reads "${hh.band.toLowerCase()}" (${hh.score} out of 100)${hh.prs.length ? '; pressing on it: ' + nm(hh.prs.slice(0, 2)) : ''}${hh.sup.length ? '; supporting it: ' + nm(hh.sup.slice(0, 2)) : ''}.`, { house: mh, score: hh.score }, hh.score >= 60 ? 'g' : hh.score < 45 ? 'b' : 'n');
    if (span === 'life') out.push({ tone: 'n', text: 'You said this has been with you for a very long time. That points more to the birth pattern above than to today\'s sky, which only switches it on and off.', fact: { kind: 'timing', span } });
    else if (span === 'new') out.push({ tone: 'n', text: 'You said this started recently. That points more to the running period and today\'s sky than to the birth pattern, which shows the soil it grew in.', fact: { kind: 'timing', span } });
    return { items: out, w, dasha: hn.dasha };
  }

  const toneOf = w => w > 0.4 ? 'b' : w < -0.4 ? 'g' : 'n';
  const mk = list => list.filter(f => f.text).map(f => ({ tone: toneOf(f.w), text: f.text, fact: f.fact, w: f.w }));

  /* ---------- main ---------- */
  function assess(chart, sel, opts) {
    const now = (opts && opts.now) || new Date(), a = AREA[sel.area]; if (!a) return null; const pr = a.problems.find(p => p.id === sel.problem) || a.problems[0], nat = pr.nature, N = NAT[nat];
    const X = ctx(chart), trig = sel.trigger || 'both', feel = sel.feel || 'both', span = sel.span || 'years';
    const houses = a.houses.concat(pr.eh).filter((v, i, s) => s.indexOf(v) === i), karakas = a.karakas.concat(pr.ep).filter((v, i, s) => s.indexOf(v) === i);
    const sections = []; let strain = 0, support = 0; const all = [], memo = {};
    const add = (id, emoji, title, intro, items) => { items.forEach(i => { if (i.w > 0) strain += i.w; else support -= i.w; all.push(i); }); sections.push({ id, emoji, title, intro, items: items.map(i => ({ tone: i.tone || toneOf(i.w), text: i.text, fact: i.fact })) }); };
    const done = { h: {}, p: {} };
    const sum = (key, label, list) => { let st = 0, su = 0; list.forEach(i => { if (i.w > 0) st += i.w; else su -= i.w; }); memo[key] = { st, su, label }; };
    const again = key => { const m = memo[key]; if (!m) return null; const net = m.st - m.su * 0.6; const verdict = net >= 3 ? 'it carries real strain' : net <= -1 ? 'it is mostly supportive' : 'it is mixed'; return { tone: net >= 3 ? 'b' : net <= -1 ? 'g' : 'n', text: `${cap(m.label)} was already read above; ${verdict}, so it is part of this layer too.`, fact: { kind: 'again', key }, w: 0 }; };
    // 1. the area
    const areaItems = []; houses.forEach(h => { if (done.h[h]) return; done.h[h] = 1; const hw = a.hw[h] || HNAME[h], L = mk(houseFindings(X, h, hw)); sum('h' + h, `your ${ordn(h)} house`, L); L.forEach(i => areaItems.push(i)); });
    karakas.forEach(k => { if (done.p[k]) return; done.p[k] = 1; const L = mk(planetFindings(X, k, a.kw[k] || PWHY[k])); sum('p' + k, k, L); L.forEach(i => areaItems.push(i)); });
    add('area', a.emoji, `What your chart says about ${a.name.toLowerCase()}`, `The houses and planets that rule ${a.who === 'yourself' ? 'this part of you' : a.who}, read one by one.`, areaItems);
    // 2. signature of the problem
    const cul = culpritFindings(X, nat, houses, karakas);
    add('signature', '🔎', `Why it takes the form of "${pr.label}"`, `This problem is mainly about ${N.say}. In a chart that is carried by ${nm(N.c)}, and by how they touch the houses and planets above.`, cul.length ? mk(cul) : [{ tone: 'g', text: `None of ${nm(N.c)} touches these houses or planets directly, so the chart does not show the usual signature for ${N.say}. The problem is probably more situational than built into the birth pattern.`, fact: { kind: 'culprit', none: true }, w: -1 }]);
    // 3. trigger layer
    const tl = [], tH = trig === 'int' ? [1] : trig === 'ext' ? [7] : [1, 7];
    tH.forEach(h => { if (done.h[h]) { const r = again('h' + h); if (r) tl.push(r); return; } done.h[h] = 1; const L = mk(houseFindings(X, h, h === 1 ? 'you, your reactions and your body' : 'other people and how they treat you')); sum('h' + h, `your ${ordn(h)} house`, L); L.forEach(i => tl.push(i)); });
    if (trig !== 'ext') { if (done.p.Mercury) { const r = again('pMercury'); if (r) tl.push(r); } else { done.p.Mercury = 1; const L = mk(planetFindings(X, 'Mercury', 'how you think and respond')); sum('pMercury', 'Mercury', L); L.forEach(i => tl.push(i)); } }
    add('trigger', trig === 'ext' ? '⚡' : trig === 'int' ? '🪞' : '🔀', trig === 'ext' ? 'The trigger: it came from outside' : trig === 'int' ? 'The trigger: it started inside you' : 'The trigger: outside and inside together',
      trig === 'ext' ? 'When a person or event sets a problem off, the chart is read from the house of other people and from how the area above is pressed from outside.' : trig === 'int' ? 'When the spark is your own thoughts, reactions or habits, the chart is read from the first house and from Mercury (how you think).' : 'Both layers are read: the house of other people and your own inner response.', tl);
    // 4. pain layer
    const pl = [], fH = feel === 'int' ? [4, 12] : feel === 'ext' ? [6, 8] : [4, 6, 8, 12], fP = feel === 'int' ? ['Moon'] : feel === 'ext' ? ['Mars', 'Saturn'] : ['Moon', 'Mars', 'Saturn'];
    fH.forEach(h => { if (done.h[h]) { const r = again('h' + h); if (r) pl.push(r); return; } done.h[h] = 1; pl.push(...mk(houseFindings(X, h, h === 4 ? 'inner peace and emotional security' : h === 12 ? 'sleep, hidden fears and quiet pain' : h === 6 ? 'conflict, harm and health' : 'sudden loss and deep hurt'))); });
    fP.forEach(k => { if (done.p[k]) { const r = again('p' + k); if (r) pl.push(r); return; } done.p[k] = 1; const L = mk(planetFindings(X, k, PWHY[k])); sum('p' + k, k, L); pl.push(...L); });
    add('pain', feel === 'int' ? '💔' : feel === 'ext' ? '🧱' : '🌗', feel === 'int' ? 'How it is felt: inside you' : feel === 'ext' ? 'How it shows up: in real events' : 'How it shows up: inside and in real events',
      feel === 'int' ? 'Inner pain is read from the Moon (the feeling mind) and from the houses of inner peace and hidden worry.' : feel === 'ext' ? 'Harm, loss or conflict in real life is read from the houses of conflict and sudden change and from Mars and Saturn.' : 'Both layers are read: the feeling mind, and the houses and planets of real events.', pl);
    // 5. timing
    const tm = timing(chart, X, nat, houses, karakas, now, feel, span); tm.items.forEach(i => { all.push({ w: i.tone === 'b' ? 1 : i.tone === 'g' ? -1 : 0, text: i.text, fact: i.fact }); if (i.tone === 'b') strain += 1; if (i.tone === 'g') support += 1; });
    sections.push({ id: 'timing', emoji: '⏳', title: 'Why it is felt now', intro: 'The running periods (dasha) and today\'s sky decide when a birth pattern is switched on.', items: tm.items });
    // 6. what helps you
    const supItems = []; sections.slice(0, 4).forEach(s => s.items.filter(i => i.tone === 'g').slice(0, 3).forEach(i => supItems.push({ tone: 'g', text: i.text, fact: i.fact })));
    sections.push({ id: 'support', emoji: '🛡️', title: 'What is on your side', intro: 'The parts of the chart that protect this area and give you something to build on.', items: supItems.length ? supItems.slice(0, 6) : [{ tone: 'n', text: 'No single strong protection stands out in the birth chart for this area, so the help here comes mainly from steady habits and good people around you.', fact: { kind: 'support', none: true } }] });
    // summary
    const top = all.filter(i => i.w >= 1 && i.fact.kind !== 'timing').sort((x, y) => y.w - x.w).slice(0, 4).map(i => ({ text: i.text, fact: i.fact }));
    const ratio = strain / (strain + support + 2), level = ratio >= 0.63 ? 'strong' : ratio >= 0.52 ? 'clear' : 'light';
    const levelText = level === 'strong' ? 'The chart shows strong indications for this problem: several parts of it line up.' : level === 'clear' ? 'The chart shows clear indications for this problem, with some protection alongside.' : 'The chart shows only light indications. This problem is likely shaped more by circumstances and choices than by the birth pattern.';
    const help = N.help.concat([a.tip]), safety = SENSITIVE[nat] || sel.area === 'mind' || sel.area === 'health' ? 'This reading describes tendencies and is not medical, legal or psychological advice. If you feel unsafe, or things feel too heavy to carry, please speak to someone you trust or a qualified professional or helpline in your area.' : 'This reading describes tendencies and is not medical, legal or financial advice.';
    const chips = [{ k: 'Trigger', v: trig === 'ext' ? 'From outside' : trig === 'int' ? 'From inside' : 'Both' }, { k: 'It shows as', v: feel === 'int' ? 'Inner pain' : feel === 'ext' ? 'Real events' : 'Both' }, { k: 'Area', v: a.name }, { k: 'Problem', v: pr.label }];
    const words = sections.reduce((s, x) => s + x.items.reduce((t, i) => t + i.text.split(/\s+/).length, 0) + x.intro.split(/\s+/).length, 0);
    return { sel: Object.assign({}, sel, { problem: pr.id }), chips, level, levelText, top, sections, help, safety, words, nature: nat, natureSay: N.say, area: a.id, problemLabel: pr.label, strain: +strain.toFixed(1), support: +support.toFixed(1) };
  }
  return { areas: AREAS, natures: NAT, assess, area: id => AREA[id] };
})();
window.PRB = PRB;

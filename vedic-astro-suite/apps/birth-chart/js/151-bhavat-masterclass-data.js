/* Bhavat Bhavam Masterclass: teaching data (js/151). Plain text only, no engine code. Used by js/152 (global BMC).
   Tags on every rule: S = stated by the published sources named in SRC, M = worked out from the counting rule (arithmetic, no opinion), C = common practice / teaching aid (not a quoted verse).
   Sources read 2026-11-12 (two or more agree on each S rule where noted): PB panchangbodh.com (all 12 pairs), AS astrosight.ai (rule, limits, cautions), BP barbarapijan.com (pairs, themes), VJ vijayalur.com (any house read from any house).
   NOT verified: a classical verse for the same-number rule. VJ points to Bhavartha Ratnakara; BP mentions BPHS Sarga 7 without a quoted text. The page says so. Tendency wording only; no fate or fear words. */
const BMD = (() => {
  const SRC = {
    PB: { n: 'PanchangBodh, Bhavat Bhavam Calculator', u: 'https://panchangbodh.com/bhavat-bhavam-calculator' },
    AS: { n: 'AstroSight, Bhavat Bhavam Principle Explained', u: 'https://astrosight.ai/predictions/bhavat-bhavam-principle-explained' },
    BP: { n: 'B. P. Lama Jyotishavidya, Bhavat Bhavam', u: 'https://barbarapijan.com/bpa/Amsha/bhavat_bhavam.htm' },
    VJ: { n: 'Vijayalur, Bhavat Bhavam', u: 'https://vijayalur.com/2013/01/28/bhavat-bhavam/' }
  };
  /* what each house is "about" (the subject when it is used as a starting point) */
  const SUBJ = ['you (self and body)', 'family and money', 'siblings and effort', 'mother and home', 'children and learning', 'service, health and rivals', 'partner and dealings', 'life changes and the hidden', 'father, teachers and fortune', 'work and standing', 'gains and friends', 'losses, rest and far places'];
  /* what the Nth house says about a subject (the lens) */
  const LENS = ['the body, character and vitality', 'money, speech and support', 'courage, effort and short moves', 'comfort, home and peace of mind', 'intelligence, creativity and merit', 'health, debts and obstacles', 'partnerships and deals', 'crises, change and what is hidden', 'fortune, belief and guidance', 'work, standing and action', 'gains, friends and wishes', 'losses, expenses and retreat'];
  const SHORT = ['Self', 'Wealth', 'Effort', 'Home', 'Children', 'Service', 'Partner', 'Change', 'Fortune', 'Career', 'Gains', 'Release'];
  /* the 12 same-number pairs: a = short line (PB), b = what the second house adds (BP / AS), tags = which sources say it */
  const PAIRS = [
    { n: 1, d: 1, a: 'Self reflects back on self.', b: 'The first house counted from itself is itself, so it adds nothing new. Read the Lagna the normal way.', src: ['PB', 'AS'] },
    { n: 2, d: 3, a: 'Wealth grows a second time through effort.', b: 'Self-made wealth, and putting existing capital to work in a business. Also money through siblings or sustained action.', src: ['PB', 'BP', 'AS'] },
    { n: 3, d: 5, a: 'Courage develops into creativity.', b: 'Publicity, publishing, performance and being seen: effort that becomes recognised work.', src: ['PB', 'BP'] },
    { n: 4, d: 7, a: 'Home comfort extends into partnership.', b: 'Finishing a course, a licence or diploma, a house or vehicle. Also the parents\' marriage and the mother\'s partnerships.', src: ['PB', 'BP', 'AS'] },
    { n: 5, d: 9, a: 'Intelligence deepens into wisdom.', b: 'Grandchildren, sincere belief and religious practice, and the children\'s sense of ethics and purpose.', src: ['PB', 'BP', 'AS'] },
    { n: 6, d: 11, a: 'Overcoming opponents brings gains.', b: 'Hard-won profit from work or debt, and allies against rivals. Shows whether health or debt themes settle into gain or build into loss.', src: ['PB', 'BP', 'AS'] },
    { n: 7, d: 1, a: 'A partner mirrors you back to yourself.', b: 'Marriage and agreements as a mirror of the self. A strong Lagna with a weak 7th can mean the partnership leans on your own effort; the reverse can mean the partner carries more.', src: ['PB', 'BP', 'AS'] },
    { n: 8, d: 3, a: 'Change comes through effort.', b: 'Sudden news and announcements of upheaval or renewal. The 3rd also adds to how longevity is judged.', src: ['PB', 'BP', 'AS'] },
    { n: 9, d: 5, a: 'Fortune turns into creativity.', b: 'The timing of children and grandchildren, the results of inspired belief, a father\'s intelligence and past merit.', src: ['PB', 'BP', 'AS'] },
    { n: 10, d: 7, a: 'Career develops through partnership.', b: 'Career dignity, advisors, promotions, clients. A weak 10th with a strong 7th can point to success through partners.', src: ['PB', 'BP', 'AS'] },
    { n: 11, d: 9, a: 'Gains lead to wisdom.', b: 'Helpful networks and who you know alongside what you know. The 11th is neither a trine nor a kendra, so results here tend to be hard-won.', src: ['PB', 'BP'] },
    { n: 12, d: 11, a: 'Expenditure leads to gains.', b: 'Turning imagined goals into material achievement. The 12th\'s losses colour how the 11th\'s gains arrive.', src: ['PB', 'BP', 'AS'] }
  ];
  /* second use: the Xth house counted from the Yth, key "X-Y". Taken from VJ (the 2nd house seen from every other house). */
  const EX = {
    '12-3': 'Losses, hospital stays or restrictions for siblings and neighbours.',
    '11-4': 'The mother\'s social life and gains; property, land or vehicles.',
    '10-5': 'Children\'s career interests and school performance.',
    '9-6': 'Long journeys of maternal relatives.',
    '8-7': 'A deep change or an ending in the marriage (the source also mentions loss of the spouse).',
    '7-8': 'Inheritance that comes through the spouse.',
    '6-9': 'The father\'s health strain, debts and rivals.',
    '5-10': 'Speculation and risk-taking in career.',
    '4-11': 'Friends\' homes and the elder brother.',
    '3-12': 'Short journeys of hidden opponents.',
    '12-7': 'Losses within the marriage (VJ).'
  };
  /* reading recipes by question: primary and derived come from the rule, extra = more X-from-Y checks (same source tags) */
  const TOPICS = [
    { id: 'marriage', ic: '💍', t: 'Marriage and partner', h: 7, note: 'Read the 7th first, then the 1st (the 7th from the 7th). Compare who carries the partnership.', extra: [{ x: 8, y: 7, s: 'VJ' }, { x: 12, y: 7, s: 'VJ' }, { x: 7, y: 8, s: 'VJ' }] },
    { id: 'career', ic: '💼', t: 'Career and standing', h: 10, note: 'Read the 10th first, then the 7th (the 10th from the 10th): partners, clients and advisors shape the career.', extra: [{ x: 5, y: 10, s: 'VJ' }] },
    { id: 'wealth', ic: '🪙', t: 'Wealth and savings', h: 2, note: 'Read the 2nd first, then the 3rd: how savings grow through effort. Add the 11th for gains.', extra: [{ x: 11, y: 4, s: 'VJ' }, { x: 12, y: 3, s: 'VJ' }] },
    { id: 'children', ic: '🧸', t: 'Children and learning', h: 5, note: 'Read the 5th first, then the 9th: values, grandchildren and merit behind the children.', extra: [{ x: 10, y: 5, s: 'VJ' }] },
    { id: 'mother', ic: '🏡', t: 'Mother and home', h: 4, note: 'Read the 4th first, then the 7th: the mother\'s partnerships and the home as a finished place.', extra: [{ x: 11, y: 4, s: 'VJ' }] },
    { id: 'father', ic: '🌅', t: 'Father and fortune', h: 9, note: 'Read the 9th first, then the 5th: the father\'s outlook and the merit behind luck.', extra: [{ x: 6, y: 9, s: 'VJ' }] },
    { id: 'health', ic: '🌿', t: 'Health and obstacles', h: 6, note: 'Read the 6th first, then the 11th: whether strain settles into gain or builds up.', extra: [{ x: 9, y: 6, s: 'VJ' }] },
    { id: 'gains', ic: '🌐', t: 'Gains and networks', h: 11, note: 'Read the 11th first, then the 9th: whether the network also gives wisdom and guidance.', extra: [{ x: 4, y: 11, s: 'VJ' }] },
    { id: 'change', ic: '🌀', t: 'Change and the hidden', h: 8, note: 'Read the 8th first, then the 3rd: change often arrives through effort and news. The 3rd also adds to longevity judgement.', extra: [{ x: 7, y: 8, s: 'VJ' }] },
    { id: 'siblings', ic: '🤝', t: 'Siblings and effort', h: 3, note: 'Read the 3rd first, then the 5th: effort that turns into recognised work.', extra: [{ x: 12, y: 3, s: 'VJ' }] },
    { id: 'release', ic: '🕊️', t: 'Rest, losses and release', h: 12, note: 'Read the 12th first, then the 11th: how expense and retreat feed later gains.', extra: [{ x: 3, y: 12, s: 'VJ' }] },
    { id: 'self', ic: '🧘', t: 'Self and body', h: 1, note: 'The 1st from the 1st is itself. Read the Lagna, its lord and the 7th (the mirror) instead.', extra: [{ x: 7, y: 1, s: 'M' }] }
  ];
  const RULES = [
    { t: 'The main house always leads', b: 'Read the house itself first. The second house adds colour and never replaces it.', tag: 'S', src: ['AS'] },
    { t: 'One step only', b: 'Stop after one derived house. Chaining a second time (the 5th from the 5th from the 5th) turns into guesswork.', tag: 'S', src: ['AS'] },
    { t: 'Count inclusively', b: 'The starting house is number 1. So the 7th from the 7th is 6 houses further on, which lands on the 1st (not the 2nd).', tag: 'S', src: ['VJ', 'PB'] },
    { t: 'Agreement raises confidence', b: 'When a house and its derived house point the same way, the tendency is steadier. When they differ, look for nuance. Do not pick the one that gives the answer you want.', tag: 'S', src: ['AS'] },
    { t: 'Timing comes from the dashas', b: 'The effects are described as strongest in the periods of the planets involved. This page checks the current Mahadasha and Antardasha against the lords and occupants of both houses. One source treats the method mainly as a way to see karmic links, not to time events.', tag: 'S', src: ['AS', 'BP', 'PB'] },
    { t: 'The 1st from the 1st adds nothing', b: 'It is the Lagna again. Use the 7th (its mirror) for a second view of yourself.', tag: 'S', src: ['AS'] },
    { t: 'Check the natural significator', b: 'A planet that naturally signifies a house can thin out that house\'s results when it sits in it (the source gives Jupiter in the 5th, Sun in the 9th, Mars in the 3rd). Treat it as a prompt to look closer, not a verdict.', tag: 'S', src: ['VJ'] },
    { t: 'The 11th is hard-won', b: 'The 11th is neither a trine nor a kendra, so a good result there tends to come through effort.', tag: 'S', src: ['BP'] },
    { t: 'Partner houses share a second house', b: 'Houses 6 apart give the same derived house: 1 and 7 give the 1st, 2 and 8 give the 3rd, 3 and 9 give the 5th, 4 and 10 give the 7th, 5 and 11 give the 9th, 6 and 12 give the 11th. The odd houses 1, 3, 5, 7, 9, 11 are the only ones a derived house can be.', tag: 'M', src: [] },
    { t: 'Malefics help in the upachaya houses', b: 'Natural malefics in the 3rd, 6th, 10th and 11th are usually read as helping, so the score below does not count them against the house.', tag: 'C', src: [] },
    { t: 'The score is a teaching aid', b: 'The Support score adds a few clear signals so you can see why a house looks easy or hard. It is not a verdict and no source defines such a score. Read it with the full chart.', tag: 'C', src: [] }
  ];
  const DIFFS = [
    { t: 'Timing or only meaning?', b: 'AstroSight and B. P. Lama tie the method to dasha timing. PanchangBodh says it is mainly for understanding karmic links, not for timing events. This page shows both: the meaning, and which dasha lords touch the two houses.' },
    { t: 'Divisional charts', b: 'The Vijayalur author says Bhavat Bhavam applies to the main Rashi chart only. AstroSight suggests checking the matter in the divisional chart as well, for example the Navamsha for marriage. Use the Rashi reading first, then decide.' },
    { t: 'What the name covers', b: 'PanchangBodh, AstroSight and B. P. Lama use the same-number pairs (the 7th from the 7th). Vijayalur also reads any house from any other house as if that house were the Lagna. This page has both: the pairs, and the Explorer tab for any house from any house.' },
    { t: 'A classical verse', b: 'None of the four pages quotes a verse for the same-number rule. Vijayalur points to Bhavartha Ratnakara for more. Treat the pairs as a widely taught method, and check a classical text if you need the exact source.' }
  ];
  const STEPS = [
    'Read the main house first: its sign, its lord, where the lord sits, who is inside it and who looks at it.',
    'Find the derived house with the formula: counting the same number of houses from the house itself.',
    'Read the derived house the same way: sign, lord, lord\'s placement, occupants, aspects.',
    'Compare. Same direction means a steady tendency. Opposite directions mean look for a mix.',
    'Add timing: are the Mahadasha or Antardasha lords the lords or occupants of either house?',
    'Cross-check with the natural significator and, if you use them, the divisional charts.',
    'Write the result as a tendency with both layers and a time window. Never as a fixed outcome.'
  ];
  const MISTAKES = [
    'Counting from the next house (so the 7th from the 7th becomes the 2nd). The starting house is number 1.',
    'Letting the derived house overrule the main house.',
    'Chaining a second step.',
    'Reading only the sign and forgetting the lord, the occupants and the aspects.',
    'Using the score as a verdict instead of a reason to look closer.',
    'Mixing up house numbers and signs. Houses are counted from your Lagna sign; the sign of a house depends on your chart.'
  ];
  return { SRC, SUBJ, LENS, SHORT, PAIRS, EX, TOPICS, RULES, DIFFS, STEPS, MISTAKES };
})();

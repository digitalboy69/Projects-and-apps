/* ============================================================================
   HOW TO READ EACH DIVISIONAL CHART (VGG): a written guide for every chart in VARGAS (D1 to D144 + RTN).
   For each chart: what it is, how this app divides it, what the rising sign and houses mean there, a step-by-step way to read it,
   the rules astrologers use (marked "From the texts" or "Common practice"), the planets to check, how to judge strength, timing and cautions.
   Sources: Brihat Parashara Hora Shastra (BPHS) chapters on the sixteen divisions (Shodasavarga, about ch. 6 to 7) and Vimshopaka Bala (ch. 16);
   Jaimini Upadesa Sutras (Karakamsa, and the charts D5, D6, D8, D11 that sources attribute to Jaimini); teachers' common practice, clearly marked.
   No new yogas are defined here. Static text only (no chart maths except the birth-time sensitivity line).
   API: VGG.html(key) -> HTML string for a <details> block (key = 'D9', 'RTN', ...). VGG.text(key) -> plain text (for copy).
   "How this app divides it" matches calcVarga() in js/05-ascendant-nakshatra-vargas.js; change both together.
   ============================================================================ */
const VGG = (function(){
  const C = 'c', P = 'p'; /* c = from the texts, p = common practice */
  const SRC = { core:'One of the sixteen divisions in Parashara (BPHS)', jaim:'Attributed to Jaimini (not in the sixteen of Parashara); teachers differ on its method', later:'Not in the sixteen of Parashara; used by some schools, so treat as a fine detail only', app:'A helper view built for this app' };
  const GEN = [
    [C,'The Rasi chart (D1) is the body of the reading. The divisional charts are closer looks at one subject each. Always read a divisional chart together with D1, never alone.'],
    [C,'A planet that stands in the same sign in D1 and in D9 is called vargottama and is read as strong. Some teachers extend the idea to other divisions.'],
    [C,'A planet in its own or exalted sign in several divisions gains rank by how many it holds (classical names run from Parijata for 2, Uttama for 3, Gopura for 4, Simhasana for 5, up to Sridhama for 10; names differ slightly between translations). More divisions in good signs = more dependable results.'],
    [C,'In the classical strength count (Vimshopaka Bala, BPHS ch. 16) D9 and D60 carry large weight, together with D1; the smaller charts add small amounts.'],
    [P,'Houses are counted from that chart\'s own rising sign (whole-sign houses), and planets look at houses the same way as in D1 (7th for all; Mars 4th and 8th; Jupiter 5th and 9th; Saturn 3rd and 10th).'],
    [P,'For any life topic: find the house of the topic, its lord, the natural significator (karaka), then see how each stands in this chart, and check the planet whose dasha is running.'],
    [P,'A planet weak in D1 but strong in its divisional chart is read as better than it first looks; strong in D1 but weak in the divisional chart is read as a promise that does not fully ripen.'],
    [P,'Do not predict from one divisional chart alone. Agreement between D1, the topic chart and the dasha timing is what makes a reading dependable.']
  ];
  const D = {};
  D.D1 = { head:'Rashi: the whole life in outline', src:'core',
    gist:'The main birth chart. It shows the body, mind, character and the whole life in outline. Every other chart is a closer look at one part of this one.',
    how:'Each planet stays in the sign where it really is. Nothing is divided.',
    lagna:'The rising sign is you: body and personality. House 1 self, 2 money, family and speech, 3 courage, efforts and younger siblings, 4 mother, home and peace of mind, 5 children, intelligence and past merit, 6 enemies, debts, illness and service, 7 spouse and partners, 8 sudden change, obstacles and depth, 9 luck, father, teachers and dharma, 10 career and public standing, 11 gains, friends and elder siblings, 12 expenses, loss, sleep, foreign lands and liberation.',
    steps:['Read the rising sign, its lord and where that lord stands. The strength of the whole chart rests on this.','Read the Moon (sign, star, house) for the mind, and the Sun for the soul and vitality. Many teachers also read the whole chart from the Moon.','For each house find: its lord, where the lord stands, who sits in it, who looks at it.','Judge each planet: sign (exalted, own, friend, enemy, debilitated), retrograde, too close to the Sun (combust), planetary war.','Look for links between the lords of the angles (1, 4, 7, 10) and trines (1, 5, 9): joining, looking at each other, or exchanging signs.','Open the divisional chart for the subject you care about (D9 marriage, D10 career, D7 children) and compare.'],
    rules:[[C,'Angles (1, 4, 7, 10) and trines (1, 5, 9) are the strong houses. Houses 6, 8 and 12 are the hard houses (dusthana).'],[C,'The lord of a trine and the lord of an angle joining, looking at each other or exchanging signs makes the chart strong (BPHS chapters on Raja Yoga).'],[P,'Houses 3, 6, 10 and 11 are growth houses (upachaya): hard planets do better there and improve with time.'],[P,'A planet in a hard house or enemy sign gives mixed results; in own, exalted or friendly sign gives clean results.'],[P,'Read the lord of a house by the house it sits in: the lord carries the matters of its house into the house where it stands.']],
    karakas:'Sun: soul, father, authority. Moon: mind, mother. Mars: energy, younger siblings, land. Mercury: speech, learning, trade. Jupiter: wisdom, children, teachers. Venus: spouse, comfort, art. Saturn: work, time, hardship, long life. Rahu and Ketu: hunger and detachment, often sudden or unusual events.',
    strength:'Use sign dignity first, then the strength tools in this app (Shadbala, Ashtakavarga, Bhava Bala).',
    timing:'Vimshottari dasha: the running planets decide which houses wake up. Check each running planet in D1 and in the chart of the topic.',
    care:'A strong D1 shows the promise. Whether it is kept needs the divisional charts and the timing.' };
  D.D2 = { head:'Hora: wealth and family resources', src:'core',
    gist:'Shows money, resources and family wealth. Only two signs appear in this chart: Leo (the Sun\'s half) and Cancer (the Moon\'s half). It is the simplest chart and is read by counting who sits in which half.',
    how:'Each sign is cut into two halves of 15 degrees. In an odd sign (Aries, Gemini, Leo...) the first half is Leo and the second half is Cancer. In an even sign (Taurus, Cancer, Virgo...) it is the other way round: first half Cancer, second half Leo.',
    lagna:'The rising sign is Leo or Cancer. House 2 (stored money), 11 (income and gains), 5 and 9 (luck that brings money) are the houses to watch.',
    steps:['Count the planets in the Sun\'s half (Leo) and in the Moon\'s half (Cancer).','Read the lord of the Hora lagna: Sun for Leo, Moon for Cancer.','Check the lords of houses 2 and 11 of D1: are they strong in D2?','Check Jupiter (natural significator of wealth) and Venus (comforts).','Compare with D1 houses 2, 5, 9, 11 and the Ashtakavarga of the 2nd and 11th houses.'],
    rules:[[C,'D2 is for wealth and family resources (BPHS list of sixteen divisions).'],[P,'The Sun, Mars and Jupiter are read as strong in the Sun\'s half, and the Moon, Venus and Saturn as strong in the Moon\'s half. Mercury fits either.'],[P,'Planets in the Sun\'s half: wealth by own effort, authority, direct action. In the Moon\'s half: wealth by care, trade, public, steady saving.'],[P,'Most planets in one half show one clear way of earning; a mix shows more than one source.']],
    karakas:'Jupiter for wealth, Venus for comforts, the Sun and Moon as the two halves, lords of houses 2 and 11.',
    strength:'Count of planets in their favoured half, plus how the lords of 2 and 11 stand in D1.',
    timing:'Check the dasha of the lords of houses 2 and 11 and of Jupiter.',
    care:'Only two outcomes exist here, so it is a rough guide. Use it as a check, not as the main source for money.' };
  D.D3 = { head:'Drekkana: brothers, sisters and courage', src:'core',
    gist:'Shows younger and older siblings, courage, effort, and the spirit you work with.',
    how:'Each sign is cut into 3 parts of 10 degrees. The first part is the sign itself, the second is its 5th sign, the third is its 9th sign (the Parashara method).',
    lagna:'Rising sign of D3. House 3 (younger siblings, courage), 11 (elder siblings), 1 (the person), 9 and 5 (support).',
    steps:['Look at the 3rd and 11th houses and their lords in D3.','Check Mars (courage and younger siblings) and Jupiter (elder siblings in many teachers; some use Saturn).','Compare with the 3rd and 11th houses of D1.','Check the lagna lord of D3 for the strength of effort.'],
    rules:[[C,'D3 is for siblings (BPHS list of divisions).'],[P,'The 3rd house and its lord show younger siblings, the 11th elder siblings.'],[P,'Mars strong in D1 and D3 gives courage and initiative; Mars weak in both gives hesitation or conflict with siblings.'],[P,'Malefics in the 3rd house of D3 are tolerated (growth house); benefics there give gentle help from siblings.']],
    karakas:'Mars (younger siblings, courage), Jupiter (elder siblings), Mercury (skills and communication).',
    strength:'Dignity of Mars and of the lords of 3 and 11 in D3.',
    timing:'Dasha of the lord of the 3rd or 11th, or of Mars.',
    care:'Do not state numbers of siblings from this chart alone.' };
  D.D4 = { head:'Chaturthamsa: home, land and fortune', src:'core',
    gist:'Shows fixed property, house, land, vehicles of the home, and the luck that comes through them.',
    how:'Each sign is cut into 4 parts of 7.5 degrees. The parts go to the 1st, 4th, 7th and 10th sign from it.',
    lagna:'Rising sign of D4. House 4 (house, land, mother, peace), 9 (luck), 11 (gains), 2 (family wealth).',
    steps:['Check the 4th house and its lord in D4, and the 9th.','Check Mars (land), Venus (comforts, vehicles), Moon (home and peace).','Compare with D1 house 4 and with D16 for vehicles.','See the lagna lord of D4 for how supported the home life is.'],
    rules:[[C,'D4 is for fortune and property (BPHS list).'],[P,'A strong 4th lord in D4, not tied to 6, 8, 12, supports owning land and a settled home.'],[P,'Mars strong in D4 favours land; Venus strong favours a comfortable house and vehicles; the Moon strong favours peace at home.'],[P,'Malefics in the 4th house of D4 show repairs, disputes or moving around; benefics show a pleasant home.']],
    karakas:'Mars (land), Venus (comfort), Moon (home, mother), Saturn (old buildings, slow gain).',
    strength:'Dignity of the 4th lord and Mars in D4 and D1.',
    timing:'Dasha and transits to the 4th lord, Mars and Venus.',
    care:'Good for tendency. Do not name a purchase date from D4 alone.' };
  D.D5 = { head:'Panchamsa: fame, authority and merit', src:'jaim',
    gist:'Used for fame, power, authority and the merit stored from before. Sources attribute it to Jaimini and teachers give it different meanings, so read it lightly.',
    how:'Each sign is cut into 5 parts of 6 degrees. Parts of an odd sign go to Aries, Aquarius, Sagittarius, Gemini, Libra; parts of an even sign go to Taurus, Virgo, Pisces, Capricorn, Scorpio.',
    lagna:'Rising sign of D5. House 5 (merit, mantra, intelligence), 10 (rank), 9 (luck), 1 (the self).',
    steps:['Check the 5th and 10th houses and their lords in D5.','Check the Sun (authority) and Jupiter (wisdom, merit).','Compare with D1 houses 5 and 10 and with D10 for the actual career rank.'],
    rules:[[C,'Sources attribute D5 to Jaimini for fame and power (not in the sixteen of Parashara).'],[P,'A strong Sun and a strong 10th lord here support rank and recognition.'],[P,'A strong 5th lord and Jupiter here show stored merit that helps at the right time.']],
    karakas:'Sun, Jupiter, lords of 5 and 10.',
    strength:'Dignity of the Sun, Jupiter and the lords of 5 and 10.',
    timing:'Dasha of the 5th or 10th lord, Sun or Jupiter.',
    care:'The method and meaning of D5 are not agreed. Use only as a side check.' };
  D.D6 = { head:'Shashthamsa: health, debts and obstacles', src:'jaim',
    gist:'Used for illness, debts, enemies and daily struggles. Sources attribute it to Jaimini. It is not a medical tool.',
    how:'Each sign is cut into 6 parts of 5 degrees. An odd sign starts from Aries, an even sign starts from Libra, and the parts go on one sign at a time.',
    lagna:'Rising sign of D6. House 6 (illness, debts, enemies, service), 8 (long illness, shocks), 12 (hospital, loss), 1 (body).',
    steps:['Check the 6th, 8th and 12th houses and their lords in D6.','Check the lagna lord of D6: a strong one shows resilience.','Check the Sun (vitality), Moon (mind), Mars (inflammation, injury), Saturn (long and slow trouble).','Compare with D1 houses 1, 6, 8 and with D30.'],
    rules:[[C,'Sources attribute D6 to Jaimini for health (not in the sixteen of Parashara).'],[P,'Malefics in the 6th house are a growth position (they fight trouble); benefics in the 6th soften the fight but may show slow recovery.'],[P,'A strong lagna lord of D6 supports recovery; the lagna lord tied to 8th or 12th shows weak stamina.']],
    karakas:'Sun (vitality), Moon (mind, fluids), Mars (blood, injury), Saturn (chronic), Mercury (nerves), 6th lord.',
    strength:'Dignity of the lagna lord and of the 6th lord in D6 and D1.',
    timing:'Dasha and transit of the 6th, 8th and 12th lords and of Saturn and Mars.',
    care:'This chart shows tendencies only. Never use it to diagnose or to decide treatment; see a doctor for health.' };
  D.D7 = { head:'Saptamsa: children', src:'core',
    gist:'Shows children and grandchildren, and the creative work you bring into the world.',
    how:'Each sign is cut into 7 parts of about 4.29 degrees. An odd sign starts from itself; an even sign starts from its 7th sign. The parts go on one sign at a time.',
    lagna:'Rising sign of D7. House 5 (children), 9 (children of children, luck), 2 and 11 (the family grows), 1 (the parent).',
    steps:['Check the 5th house and its lord in D7.','Check Jupiter, the natural significator of children.','Check the lagna lord of D7 and the 9th house.','Compare with D1 house 5, its lord and Jupiter.'],
    rules:[[C,'D7 is for children (BPHS list).'],[P,'Jupiter strong in D1 and D7, with a clean 5th house and lord, supports children; heavy hard planets on the 5th house or Jupiter suggest delay or more effort.'],[P,'The 5th lord in a hard house (6, 8, 12) in D7 shows worry or delay around children.'],[P,'Check D9 5th house as well; many teachers read both.']],
    karakas:'Jupiter (children), the 5th lord, the Moon (care) and Venus.',
    strength:'Dignity of Jupiter and the 5th lord in D7 and D1.',
    timing:'Dasha of the 5th lord, Jupiter, the 9th lord; Jupiter transit over the 5th house or its lord.',
    care:'Handle with care. Do not give yes or no on children; speak of ease or effort and of timing windows.' };
  D.D8 = { head:'Ashtamsa: sudden troubles and the long run', src:'jaim',
    gist:'Used for sudden troubles, hidden matters, inheritances and the length of the road. Sources attribute it to Jaimini and teachers differ; read it lightly.',
    how:'Each sign is cut into 8 parts of 3.75 degrees. Moving signs start from Aries, fixed signs start from Leo, dual signs start from Sagittarius; the parts go on one sign at a time.',
    lagna:'Rising sign of D8. House 8 (sudden events, hidden things, inheritance), 3 (the other house of life span), 12 (loss), 1 (the body).',
    steps:['Check the 8th house and its lord in D8.','Check Saturn, the significator of long life, and the lagna lord of D8.','Compare with D1 houses 8, 3 and 12.'],
    rules:[[C,'Sources attribute D8 to Jaimini for unexpected troubles (not in the sixteen of Parashara).'],[P,'A strong lagna lord and a strong 8th lord not tied to hard planets shows the ability to pass through sudden changes.'],[P,'Planets in the 8th house of D8 are read as hidden or sudden themes tied to that planet.']],
    karakas:'Saturn (long life, delays), Mars (sudden events), 8th lord.',
    strength:'Dignity of Saturn, the lagna lord and the 8th lord.',
    timing:'Dasha and transit of the 8th lord, Saturn and Mars.',
    care:'Never state the length of life or a date of death from this or any chart.' };
  D.D9 = { head:'Navamsa: marriage, dharma and the real strength of planets', src:'core',
    gist:'The most used divisional chart. Parashara treats it as the fruit of the tree: D1 is the tree, D9 shows whether the fruit comes and how sweet it is. It shows the spouse, the marriage, the inner nature, and the real strength of each planet.',
    how:'Each sign is cut into 9 parts of 3 degrees 20 minutes. In a moving sign (Aries, Cancer, Libra, Capricorn) the first part is the sign itself. In a fixed sign (Taurus, Leo, Scorpio, Aquarius) the first part is its 9th sign. In a dual sign (Gemini, Virgo, Sagittarius, Pisces) the first part is its 5th sign. The parts then go on one sign at a time.',
    lagna:'Rising sign of D9 is the inner self. House 7 (spouse and marriage), 9 (dharma and luck), 5 (love, wisdom, children), 1 (inner nature), 2 and 8 (family and the marriage bond).',
    steps:['Compare each planet in D1 and D9. Same sign in both means vargottama (strong).','Read each planet\'s dignity in D9. It shows the planet\'s true inner strength.','Read the D9 rising sign and its lord, then the 7th house and its lord for the spouse and marriage.','Check Venus (for a man\'s wife) or Jupiter (for a woman\'s husband), the classical significators of marriage.','Check the D9 sign of the planets running the dasha.','Find the Atmakaraka (the planet with the highest degree inside its sign). Its D9 sign is the Karakamsa (Jaimini). Read houses from it; its 12th is read for liberation and the inner calling.'],
    rules:[[C,'Vargottama (same sign in D1 and D9) makes a planet strong.'],[C,'Venus is the significator of the wife for a man and Jupiter of the husband for a woman (BPHS).'],[C,'D9 carries heavy weight in the classical strength count (Vimshopaka Bala).'],[C,'Karakamsa: the Navamsa sign of the Atmakaraka is read as a second rising sign (Jaimini).'],[P,'Weak (debilitated) in D1 but strong in D9: results improve with time. Strong in D1 but weak in D9: the result looks good but does not satisfy for long.'],[P,'The 7th lord in a hard house or with hard planets in D9 shows strain in marriage; check D1 house 7 and the dasha of the 7th lord.'],[P,'A strong D9 lagna lord shows steady inner character and faith.']],
    karakas:'Venus, Jupiter, the Moon (mind), the 7th and 9th lords, the Atmakaraka.',
    strength:'Dignity of every planet in D9, and vargottama planets.',
    timing:'Dasha of the 7th lord, Venus (or Jupiter) and the Navamsa lagna lord for marriage matters; the Atmakaraka dasha for the inner turning point.',
    care:'The D9 rising sign changes about every 13 minutes, so the birth time must be right before you trust D9 houses.' };
  D.RTN = { head:'Rasi Tulya Navamsa: Navamsa signs on the Rasi lagna', src:'later',
    gist:'A teaching view used by some schools. Each planet\'s Navamsa sign is shown on the Rasi chart while the D1 rising sign stays fixed, so you see which D1 house each planet\'s Navamsa nature falls in.',
    how:'Every planet takes its D9 sign. The rising sign is kept as the D1 rising sign. Houses are counted from that D1 lagna.',
    lagna:'The rising sign is the D1 rising sign. House meanings are the same as in D1.',
    steps:['Compare each planet\'s house here with its house in D1.','A planet that stays in the same house in both is steady and clear in its matters.','A planet that moves to another house shows where its inner (D9) nature works through your outer life.','Read it together with D9 and D1, never alone.'],
    rules:[[P,'This view is a teaching aid used by some schools; it is not a Parashara or Jaimini rule.'],[P,'Planets that move into houses 6, 8, 12 here point to an inner theme that feels heavier than the D1 position suggests.']],
    karakas:'As in D1.',
    strength:'Same as D9 dignity.',
    timing:'Dasha lords as in D1 and D9.',
    care:'Use only as a side view. Do not rely on it alone.' };
  D.D10 = { head:'Dasamsa: career and actions in the world', src:'core',
    gist:'Shows career, public work, status and achievements, and how your actions are seen by society.',
    how:'Each sign is cut into 10 parts of 3 degrees. An odd sign starts from itself; an even sign starts from its 9th sign. The parts go on one sign at a time.',
    lagna:'Rising sign of D10 is you at work. House 10 (profession, rank), 6 (service, daily work), 7 (business and partners), 11 (gains), 2 (earning), 1 (the worker), 9 (luck and mentors).',
    steps:['Read the D10 rising sign and its lord for working style.','Read the 10th house, its lord and any planet in it.','Check the Sun (authority), Saturn (long hard work), Mercury (trade, skill), Jupiter (guidance, teaching), Mars (technical, action), Venus (arts, luxury), Moon (public, care).','Check houses 6, 7 and 11 for service, business and gains.','Check the D10 sign of the planets running the dasha.','Compare with D1 house 10 and its lord.'],
    rules:[[C,'D10 is for actions in society and profession (BPHS list).'],[P,'The 10th lord strong in D10 and D1 supports steady career growth.'],[P,'A planet in the 10th house of D10 colours the kind of work: Sun leadership or government, Moon public or care, Mars technical or action, Mercury trade or writing, Jupiter teaching or advice, Venus arts or comfort, Saturn labour, systems or service.'],[P,'The D10 lagna lord in houses 6, 8, 12 shows a tiring path; in 1, 5, 9, 10, 11 an easier path.'],[P,'Houses 6 and 7 here help tell service from business.']],
    karakas:'Sun, Saturn, Mercury, Jupiter, the 10th lord, the lord of D10 lagna.',
    strength:'Dignity of the 10th lord and of the planets running the dasha in D10.',
    timing:'Dasha and antardasha of the 10th lord, the 6th, 11th and 2nd lords and the D10 lagna lord; Saturn and Jupiter transits over D1 house 10.',
    care:'The D10 rising sign changes about every 12 minutes. Confirm the birth time with a known career event before relying on it.' };
  D.D11 = { head:'Rudramsa (Ekadasamsa): endings and gains', src:'jaim',
    gist:'Sources attribute it to Jaimini and give it two readings: older texts call it Rudramsa (destruction, endings); many modern teachers read it for gains. Treat as a minor, uncertain chart.',
    how:'Each sign is cut into 11 parts of about 2.73 degrees. The starting sign is found by counting backward from Aries as many signs as the sign is forward from Aries; the parts go on one sign at a time.',
    lagna:'Rising sign of D11. House 11 (gains), 8 (endings), 12 (loss), 1 (the self).',
    steps:['Check the 11th and 8th houses and their lords in D11.','Check the lagna lord of D11.','Compare with D1 houses 11 and 8.'],
    rules:[[C,'Sources attribute D11 to Jaimini, with the sense of destruction (Rudramsa).'],[P,'Modern teachers often read it for gains and for the end of cycles; the meaning varies, so state the school you follow.']],
    karakas:'Saturn, Jupiter (gains), 11th lord.',
    strength:'Dignity of the lagna lord and the 11th lord.',
    timing:'Dasha of the 11th and 8th lords.',
    care:'Uncertain method. Do not use it for firm statements.' };
  D.D12 = { head:'Dwadasamsa: parents and ancestry', src:'core',
    gist:'Shows the parents, the family line and what you inherit from it (looks, nature, luck).',
    how:'Each sign is cut into 12 parts of 2.5 degrees, starting from the sign itself and going on one sign at a time.',
    lagna:'Rising sign of D12. House 4 (mother), 9 (father in the main Parashari method; some also use 10), 2 (family), 8 (hidden family matters), 1 (the child).',
    steps:['Check the 4th house and Moon for the mother, and the 9th house and Sun for the father.','Check the lagna lord of D12 for what you carry from the family.','Compare with D1 houses 4 and 9 and with D45 and D40.'],
    rules:[[C,'D12 is for parents (BPHS list).'],[P,'Sun strong and well placed shows a supportive father; Moon strong and well placed shows a supportive mother.'],[P,'Planets in the 4th or 9th house of D12 show how the parents were or what their life was like.'],[P,'Some teachers use the 10th house for the father; say which method you use.']],
    karakas:'Sun (father), Moon (mother), 4th and 9th lords.',
    strength:'Dignity of the Sun, Moon and the 4th and 9th lords.',
    timing:'Dasha and transits to the Sun, Moon and the 4th and 9th lords.',
    care:'Do not claim illness or death of parents from this chart.' };
  D.D16 = { head:'Shodasamsa: vehicles and comforts', src:'core',
    gist:'Shows vehicles, travel, comforts and ease of daily life.',
    how:'Each sign is cut into 16 parts of 1.875 degrees. Moving signs start from Aries, fixed signs start from Leo, dual signs start from Sagittarius (BPHS); the parts go on one sign at a time.',
    lagna:'Rising sign of D16. House 4 (vehicles, comfort), 2 (possessions), 11 (gains), 12 (spending on pleasures), 1 (the owner).',
    steps:['Check the 4th house and its lord in D16.','Check Venus (vehicles and luxury) and Moon, Mars (machines).','Compare with D1 house 4 and with D4.'],
    rules:[[C,'D16 is for vehicles and comforts (BPHS list); the classical strength count gives it a large weight among the smaller charts.'],[P,'A strong 4th lord and Venus show comfort and vehicles; hard planets there show repairs or accidents with vehicles.']],
    karakas:'Venus, Mars (engines), Moon, the 4th lord.',
    strength:'Dignity of Venus and the 4th lord.',
    timing:'Dasha of the 4th lord and Venus.',
    care:'Use for tendency only; it changes about every 7 to 8 minutes, so the birth time must be exact.' };
  D.D20 = { head:'Vimsamsa: worship and spiritual practice', src:'core',
    gist:'Shows spiritual practice, worship, faith and inner discipline.',
    how:'Each sign is cut into 20 parts of 1.5 degrees. Moving signs start from Aries, fixed signs start from Sagittarius, dual signs start from Leo; the parts go on one sign at a time.',
    lagna:'Rising sign of D20. House 5 (mantra, devotion), 9 (dharma, teacher), 12 (liberation), 8 (deep practice), 1 (the practitioner).',
    steps:['Check the 5th, 9th and 12th houses and their lords in D20.','Check Jupiter (guru), Ketu (detachment) and the Moon (faith).','Compare with D1 houses 5, 9, 12 and with D9 Karakamsa.'],
    rules:[[C,'D20 is for worship and spiritual pursuits (BPHS list).'],[P,'Jupiter, the Moon or Ketu strong in D20 show steady practice or a pull toward renunciation.'],[P,'Hard planets in the 5th or 9th house show a path of effort or doubt before faith.']],
    karakas:'Jupiter, Ketu, Moon, lords of 5, 9, 12.',
    strength:'Dignity of Jupiter and the lords of 5 and 9.',
    timing:'Dasha of the 5th, 9th and 12th lords, Jupiter and Ketu.',
    care:'Spiritual life cannot be measured by a chart. Use it as a mirror, not a score.' };
  D.D24 = { head:'Chaturvimsamsa (Siddhamsa): education and learning', src:'core',
    gist:'Shows schooling, learning, skill and the knowledge you gain.',
    how:'Each sign is cut into 24 parts of 1.25 degrees. Odd signs start from Leo, even signs start from Cancer; the parts go on one sign at a time.',
    lagna:'Rising sign of D24. House 4 (basic schooling), 5 (intelligence, higher study), 9 (higher learning), 2 (speech and memory), 1 (the student).',
    steps:['Check the 4th and 5th houses and their lords in D24.','Check Mercury (learning), Jupiter (higher knowledge) and the Moon (memory).','Compare with D1 houses 4, 5, 9 and with D10 for the work that follows from study.'],
    rules:[[C,'D24 is for education and knowledge (BPHS list).'],[P,'Mercury and Jupiter strong in D24 support study and teaching; hard planets in the 4th or 5th show interruptions.'],[P,'The D24 lagna lord strong shows ability to finish what you study.']],
    karakas:'Mercury, Jupiter, Moon, lords of 4 and 5.',
    strength:'Dignity of Mercury, Jupiter and the 4th and 5th lords.',
    timing:'Dasha of the 4th, 5th and 9th lords, Mercury and Jupiter during school years.',
    care:'Changes about every 5 minutes; confirm the time first.' };
  D.D27 = { head:'Bhamsa (Nakshatramsa): strengths and weaknesses', src:'core',
    gist:'Shows your inborn strengths and weak points, stamina and the kind of strength you can use.',
    how:'Each sign is cut into 27 parts of about 1.11 degrees (one for each lunar star). Fire signs start from Aries, earth signs from Cancer, air signs from Libra, water signs from Capricorn; the parts go on one sign at a time.',
    lagna:'Rising sign of D27. House 1 (strength of the self), 3 (courage), 6 (fight), 8 (endurance).',
    steps:['Check the D27 rising sign, its lord and the Moon.','Check the dignity of each planet; strong ones are your reliable strengths.','Check houses 3, 6 and 8 for courage and endurance.','Compare with the strength tools (Shadbala) and D1.'],
    rules:[[C,'D27 is for strengths and weaknesses (BPHS list).'],[P,'Planets exalted or in own sign in D27 are read as natural strengths; debilitated ones as weak points to work on.']],
    karakas:'Mars (strength), Sun (vitality), the lagna lord.',
    strength:'Dignity of each planet in D27.',
    timing:'Dasha of the strongest and the weakest planets show when strengths or weak points are tested.',
    care:'Use for self-knowledge, not for labelling people.' };
  D.D30 = { head:'Trimsamsa: faults, troubles and misfortunes', src:'core',
    gist:'Shows faults, troubles and misfortunes, and the kind of hardship that tests you.',
    how:'Each sign is split in 5 uneven parts, each ruled by a planet. Odd signs: 0 to 5 degrees Mars (Aries), 5 to 10 Saturn (Aquarius), 10 to 18 Jupiter (Sagittarius), 18 to 25 Mercury (Gemini), 25 to 30 Venus (Libra). Even signs are the reverse: 0 to 5 Venus (Taurus), 5 to 12 Mercury (Virgo), 12 to 20 Jupiter (Pisces), 20 to 25 Saturn (Capricorn), 25 to 30 Mars (Scorpio).',
    lagna:'Rising sign of D30. House 6 (struggle), 8 (shocks), 12 (loss), 1 (the one who faces it).',
    steps:['Check the 6th, 8th and 12th houses and their lords in D30.','Check the D30 lagna lord and which hard planets are strong.','Compare with D1 and D6.'],
    rules:[[C,'D30 is for evils and misfortunes (BPHS list); each part is ruled by Mars, Saturn, Jupiter, Mercury or Venus.'],[P,'Hard planets strong here show where hardship tends to come; benefics strong here soften it.'],[P,'A planet in its own part shows that its themes can become the test.']],
    karakas:'Saturn, Mars, Rahu, lords of 6, 8, 12.',
    strength:'Dignity of the hard planets and the lagna lord.',
    timing:'Dasha of the 6th, 8th and 12th lords and of Saturn, Mars or Rahu.',
    care:'It shows tests, not fate. Speak of what to guard against and how to prepare.' };
  D.D40 = { head:'Khavedamsa: inherited good and bad effects', src:'core',
    gist:'Shows the auspicious and inauspicious effects that work in the chart; many teachers use it for the mother\'s line and what is inherited from it.',
    how:'Each sign is cut into 40 parts of 0.75 degrees. Odd signs start from Aries, even signs start from Libra; the parts go on one sign at a time.',
    lagna:'Rising sign of D40. House 4 (mother\'s line), 9 (luck), 1 (the self).',
    steps:['Check the lagna lord, the 4th and 9th houses and their lords in D40.','Check the Moon (mother) and the benefic planets.','Compare with D12 for family and D1.'],
    rules:[[C,'D40 is for auspicious and inauspicious effects (BPHS list).'],[P,'Many teachers read it for the mother\'s side; benefics strong show inherited good, hard planets strong show inherited trouble.']],
    karakas:'Moon, Jupiter, 4th and 9th lords.',
    strength:'Dignity of the Moon, Jupiter and the lagna lord.',
    timing:'Dasha of the 4th and 9th lords.',
    care:'Changes about every 3 minutes. Use only with a verified birth time.' };
  D.D45 = { head:'Akshavedamsa: character and conduct', src:'core',
    gist:'Shows character, conduct and the general feel of a life; many teachers use it for the father\'s line.',
    how:'Each sign is cut into 45 parts of about 0.67 degrees. Moving signs start from Aries, fixed signs from Leo, dual signs from Sagittarius; the parts go on one sign at a time.',
    lagna:'Rising sign of D45. House 1 (conduct), 9 (father\'s line, dharma), 10 (deeds).',
    steps:['Check the lagna lord and the 1st, 9th and 10th houses in D45.','Check the Sun (father) and benefic planets.','Compare with D12 and D1.'],
    rules:[[C,'D45 is for general indications: character and conduct (BPHS list).'],[P,'Many teachers read it for the father\'s side; benefics strong show a clean line, hard planets strong show a rough one.']],
    karakas:'Sun, Jupiter, the lagna lord.',
    strength:'Dignity of the lagna lord and the Sun.',
    timing:'Dasha of the 1st, 9th and 10th lords.',
    care:'The rising sign changes about every 2.7 minutes. Only use with a very exact time.' };
  D.D60 = { head:'Shashtiamsa: the finest division, past karma', src:'core',
    gist:'The finest classical chart. Teachers read it for the root of the whole chart and for karma carried from before. It carries great weight in the classical strength count and is the most sensitive to birth time.',
    how:'Each sign is cut into 60 parts of 0.5 degrees. They start from the sign itself and go on one sign at a time.',
    lagna:'Rising sign of D60. Read its houses like D1, but as the root: what the chart is made of.',
    steps:['Read the D60 rising sign and its lord.','Check each planet\'s dignity in D60: strong ones carry good karma, weak ones show work to do.','Check the planets running the dasha in D60.','Compare with D1 and D9; if all three agree the reading is firm.'],
    rules:[[C,'D60 is for general indications, past birth and karma, and carries large weight in the classical strength count (BPHS).'],[P,'A planet strong in D1, D9 and D60 gives its result without fail; a planet strong in D1 but weak in D60 may give less than it shows.'],[P,'Teachers also read the nature of each of the 60 parts (each part has a name and is counted good or bad); use a source you trust for those names.']],
    karakas:'All planets; the lagna lord and the planets of the running dasha first.',
    strength:'Dignity of each planet in D60.',
    timing:'Dasha lords; read their D60 placement.',
    care:'The rising sign changes about every 2 minutes. A few minutes of error give a different D60 chart, so use it only with a verified time.' };
  D.D81 = { head:'Nava-navamsa: Navamsa of the Navamsa', src:'later',
    gist:'A very fine chart built from D9: the planet\'s D9 position is divided into nine again. Some schools read it for the finer details of dharma and fortune.',
    how:'The planet\'s position inside its D9 sign is stretched back to a full 30 degrees, then divided in 9 by the D9 rule.',
    lagna:'Rising sign of D81. Read like D9: 7th spouse, 9th dharma, 1st the inner self.',
    steps:['Read D9 first and decide what it says.','Use D81 only to confirm or fine-tune it: are the same planets strong?','Look for planets in the same sign in D9 and D81 (repeat strength).'],
    rules:[[P,'Used by some schools; not in the sixteen of Parashara.'],[P,'A planet strong in D1, D9 and D81 is read as very dependable.']],
    karakas:'As in D9.',
    strength:'Dignity in D81 beside D9.',
    timing:'Dasha lords as in D9.',
    care:'Changes about every 1.5 minutes. Only worth reading when the birth time is known to the minute.' };
  D.D108 = { head:'Ashtottaramsa: finest karmic detail', src:'later',
    gist:'A very fine chart used by some schools for deep karmic themes. Definitions vary between teachers; this app builds it from D9 and D12.',
    how:'The planet\'s D9 position is stretched to 30 degrees and then divided in 12 by the D12 rule.',
    lagna:'Rising sign of D108. Read as a fine view of the D9 and D12 themes.',
    steps:['Read D9 and D12 first.','Use D108 only to confirm: are the same planets strong?','Note planets that repeat their sign in D9 and D108.'],
    rules:[[P,'Used by some schools; not in the sixteen of Parashara; definitions differ.']],
    karakas:'As in D9 and D12.',
    strength:'Dignity beside D9.',
    timing:'Dasha lords as in D9.',
    care:'Changes about every 1 minute. Use only with a birth time checked to the minute. Treat as a curiosity, not as proof.' };
  D.D144 = { head:'Dwadasa-dwadasamsa: the 12 of the 12', src:'later',
    gist:'The 12th part of the 12th part: a very fine chart for family and ancestry themes used by some schools.',
    how:'The planet\'s D12 position is stretched to 30 degrees and then divided in 12 again by the D12 rule.',
    lagna:'Rising sign of D144. Read as a fine view of D12 (family line).',
    steps:['Read D12 first.','Use D144 only to confirm: are the same planets strong?','Note planets that repeat their sign in D12 and D144.'],
    rules:[[P,'Used by some schools; not in the sixteen of Parashara; definitions differ.']],
    karakas:'As in D12.',
    strength:'Dignity beside D12.',
    timing:'Dasha lords as in D12.',
    care:'Changes about every 50 seconds. Use only with a birth time known to the second. Treat as a curiosity.' };

  const tag = t => t === C ? '<b class="vgg-tag c">From the texts</b>' : '<b class="vgg-tag p">Common practice</b>';
  const li = a => '<li>' + a + '</li>', ol = a => '<ol>' + a.map(li).join('') + '</ol>';
  const rules = a => '<ul class="vgg-rules">' + a.map(r => '<li>' + tag(r[0]) + r[1] + '</li>').join('') + '</ul>';
  function mins(key){ const n = (typeof VARGAS !== 'undefined' && VARGAS[key]) ? VARGAS[key].n : 1; if (key === 'RTN') return ''; const m = 120 / n; return m >= 3 ? 'about every ' + (m >= 10 ? Math.round(m) : m.toFixed(1)) + ' minutes' : 'about every ' + Math.round(m * 60) + ' seconds'; }
  function html(key){
    const d = D[key]; if (!d) return '';
    const t = mins(key);
    return '<details class="vgg"><summary><span>📖 How to read this chart: guide and rules</span></summary><div class="vgg-body">'
      + '<div class="vgg-src">' + SRC[d.src] + '</div>'
      + '<h4>' + d.head + '</h4><p>' + d.gist + '</p>'
      + '<h5>How this app divides it</h5><p>' + d.how + '</p>'
      + '<h5>Rising sign and houses in this chart</h5><p>' + d.lagna + '</p>'
      + '<h5>How to read it, step by step</h5>' + ol(d.steps)
      + '<h5>Rules astrologers use</h5>' + rules(d.rules)
      + '<h5>Planets to check</h5><p>' + d.karakas + '</p>'
      + '<h5>How to judge strength</h5><p>' + d.strength + '</p>'
      + '<h5>Timing</h5><p>' + d.timing + '</p>'
      + '<h5>Be careful</h5><p>' + d.care + (t ? ' In this chart the rising sign can change ' + t + ' on average, so a small birth-time error can change the whole picture.' : '') + '</p>'
      + '<h5>Rules for every divisional chart</h5>' + rules(GEN)
      + '</div></details>';
  }
  function text(key){
    const d = D[key]; if (!d) return '';
    const L = a => a.map((x, i) => (i + 1) + '. ' + x).join('\n'), R = a => a.map(r => '- [' + (r[0] === C ? 'From the texts' : 'Common practice') + '] ' + r[1]).join('\n');
    return key + ' · ' + d.head + '\n' + SRC[d.src] + '\n\n' + d.gist + '\n\nHow this app divides it: ' + d.how + '\nRising sign and houses: ' + d.lagna + '\n\nSteps:\n' + L(d.steps) + '\n\nRules:\n' + R(d.rules) + '\n\nPlanets to check: ' + d.karakas + '\nStrength: ' + d.strength + '\nTiming: ' + d.timing + '\nBe careful: ' + d.care + '\n\nRules for every divisional chart:\n' + R(GEN);
  }
  return { html, text, keys: () => Object.keys(D) };
})();

/* ============================================================================
   PLANET ENCYCLOPEDIA (PEN): one full page for each of the 9 grahas, opened from Home > Analysis > "Planet Encyclopedia".
   Tabs per planet: Nature, Aspects, Strength (exalted ... debilitated, every sign), Friends & foes (every other planet), Houses (1 to 12),
   Your chart (only the facts the app already computed for the person's chart).
   Reads: VDB (js/87) for house/sign/aspect/conjunction/dasha/status texts; the hand-written PEN_DATA below for nature, behaviour, aspects and the four
   special dignity states. Facts (exaltation signs and degrees, moolatrikona ranges, own signs, natural friendships, aspects) match js/07 and js/05.
   Sources: Brihat Parashara Hora Shastra (planet characters, exaltation/debilitation degrees, moolatrikona, natural friendships, aspects),
   teaching sources for the rest. Rules are tagged "From the texts" or "Common practice". Schools differ on the nodes; this is said on the page.
   No new yogas, no predictions. API: PEN.html(chart) -> panel HTML (also remembers the chart), PEN.open(planet, tab), PEN.text(planet) -> plain text.
   Events are delegated on document (data-pen attributes). Calm: no animation.
   ============================================================================ */
const PEN = (function(){
  const PL = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  const SG = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const COL = {Sun:'#e8a33d',Moon:'#cfd8e6',Mars:'#e0645a',Mercury:'#5fc59a',Jupiter:'#e6c34d',Venus:'#e58bb8',Saturn:'#7f93c4',Rahu:'#9a8bd0',Ketu:'#c9a27a'};
  const DCOL = {Exalted:'#5fd08a',Moolatrikona:'#9ad060',OwnSign:'#d4af37',Own:'#d4af37',Friend:'#6fb6e8',Neutral:'#9a9a9a',Enemy:'#e0925a',Debilitated:'#e0605a'};
  const DLAB = {Exalted:'Exalted',Moolatrikona:'Moolatrikona',OwnSign:'Own sign',Own:'Own sign',Friend:"Friend's sign",Neutral:'Neutral sign',Enemy:"Enemy's sign",Debilitated:'Debilitated'};
  const ordn = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th'));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const TABS = [['nature','Nature'],['aspects','Aspects'],['strength','Strength'],['rel','Friends & foes'],['houses','Houses'],['mine','Your chart']];
  const C = 'From the texts', P = 'Common practice';

  /* ---------- hand-written planet data ---------- */
  const PEN_DATA = {
   Sun:{
    tag:'The king: soul, purpose and authority',
    guna:'Sattva (pure, steady)', gender:'Male', deity:'Surya (fire/light)', dig:10, karaka:[1,9,10],
    who:`The Sun is the centre the chart turns around. It shows who you are at the core, your sense of purpose, your will and how you want to be seen. It is hot, bright, dry and proud. It does not bend easily: it wants to lead, to be recognised and to act from principle. It stands for the father, the king, government, bosses, doctors, status and the health of the heart, bones and eyes. It gives light, so it also shows where the person needs to shine.`,
    good:`Clear purpose, steady confidence, honour, leadership, good vitality, a fair relationship with the father and with people in power, success in government, medicine, administration or any work that needs authority.`,
    bad:`Ego, pride, anger at being ignored, clashes with fathers or bosses, loneliness at the top, heat in the body (heart, eyes, head), low self-worth when weak. Too close to the Sun, other planets are burnt (combust).`,
    asp:[[7,`The Sun's only aspect is the 7th. It puts a spotlight on the opposite house: whatever sits there is noticed, judged and held to a standard. It can bring honour to that area, or pride and ego-clashes (the 7th house is partners and the public, so this is often "how others see me").`]],
    ex:`Exalted in Aries, strongest at 10 degrees. Authority is natural and trusted: bold leadership, clear purpose, strong vitality, standing with the father, government and seniors. The ego is healthy because real ability stands behind it. The Sun is weakest at 10 degrees of Libra and the strength fades as it moves away from the peak.`,
    mt:`Moolatrikona in Leo, 0 to 20 degrees. The Sun is in its "office": dignified, dutiful, steady authority and self-respect. The BPHS counts this as stronger than plain own sign.`,
    own:`Own sign Leo (20 to 30 degrees is the plain own-sign part). Comfortable, regal and generous; needs recognition and loyalty; good health and confidence. Leadership comes naturally and warmly.`,
    deb:`Debilitated in Libra, deepest at 10 degrees. Authority is doubted: the person seeks approval, hands decisions to others to keep peace, and the father or government matters need effort. The gift is diplomacy and fairness. Cancellation (neecha bhanga) can turn this into late, hard-won leadership.`
   },
   Moon:{
    tag:'The mind: feelings, mother and the public',
    guna:'Sattva (gentle, receptive)', gender:'Female', deity:'Chandra / Parvati (water)', dig:4, karaka:[4],
    who:`The Moon is the mind, the emotions and the way the person feels safe. It is cool, moist, quick-changing and nourishing. It shows the mother, the home, memory, sleep, the public mood and the daily rhythm. It waxes and wanes, so it is the fastest changing planet and its strength depends on its phase: a bright (waxing) Moon is a natural benefic and gentle; a dark (waning) Moon is thinner and moodier. The sign and nakshatra the Moon sits in colour the whole personality, and it is the base of the main dasha system.`,
    good:`Calm and caring mind, good memory and sleep, popularity, comfort at home, a warm relationship with the mother, success with the public (food, care, hospitality, teaching, healing).`,
    bad:`Mood swings, worry, over-sensitivity, dependence on others for comfort, sleep and digestion trouble, trouble with the mother or home when weak or hurt by Saturn, Rahu or Ketu.`,
    asp:[[7,`The Moon's only aspect is the 7th. It brings feeling, care and change to the opposite house: matters there turn emotional, public and fluctuating. A bright Moon soothes and nourishes; a dark Moon sends a thinner, more worried gaze.`]],
    ex:`Exalted in Taurus, strongest at 3 degrees. Calm, steady and nourishing: emotional security, comfort, good memory, popularity and money that is slowly built. The mind is stable and sensual. It is weakest at 3 degrees of Scorpio.`,
    mt:`Moolatrikona in Taurus, from 3 to 30 degrees in this app (some teachers start at 4). In practice the Moon is exalted at the very start of Taurus and moolatrikona for the rest of the sign. Steady, loving and secure.`,
    own:`Own sign Cancer. At home: very caring, protective, family and home loving, strong imagination and memory. Sensitive to moods around it.`,
    deb:`Debilitated in Scorpio, deepest at 3 degrees. Feelings run deep and secret: brooding, jealousy, suspicion, sleep and mood trouble, hard to feel safe. The gift is deep psychological insight and emotional endurance. A bright Moon or a cancellation helps a lot.`
   },
   Mars:{
    tag:'The warrior: energy, courage and action',
    guna:'Tamas (fiery, forceful)', gender:'Male', deity:'Kartikeya / Hanuman (fire)', dig:10, karaka:[3,6],
    who:`Mars is energy in action: courage, drive, competition, anger, speed, land and machines. It is hot, dry and sharp. It shows brothers and sisters (younger), property, surgeons, soldiers, police, engineers and athletes, and in the body the blood, muscles, bone marrow and heat. It gets things done and fights what stands in the way. Mars works best when it has a clear goal and a way to spend its energy.`,
    good:`Courage, stamina, quick action, leadership under pressure, discipline in sport or the forces, success with land, machines, engineering or surgery, and strong protection of family.`,
    bad:`Anger, accidents, cuts, burns, fevers, rash decisions, fights with brothers or neighbours, impatience, a hard married life when it is afflicted or in certain houses (the "Mangal dosha" idea, read with care).`,
    asp:[[4,`Mars's 4th aspect pushes energy and defence into the 4th house from itself: home, land, comfort and inner peace. It can build property through effort or make the home restless.`],[7,`The 7th is the direct stare: confrontation, passion and courage poured into the opposite house. It makes partnerships energetic and, if unbalanced, quarrelsome.`],[8,`The 8th aspect is sudden and deep: surgery, accidents, hidden matters, transformation, research and endurance. It makes the 8th-from-Mars house intense and not easy to predict.`]],
    ex:`Exalted in Capricorn, strongest at 28 degrees. Controlled power: strategy and stamina instead of mere anger. Great for engineering, the forces, sport and leadership. It is weakest at 28 degrees of Cancer.`,
    mt:`Moolatrikona in Aries, 0 to 12 degrees. Direct, brave and focused; a natural commander who acts straight away.`,
    own:`Own signs Aries (12 to 30 degrees is the plain own-sign part) and Scorpio. In Aries: bold, quick and open. In Scorpio: patient, strategic, secretive, with huge endurance.`,
    deb:`Debilitated in Cancer, deepest at 28 degrees. Energy is soaked by feeling: anger turns inward, moods block action, courage comes in bursts and then burns out. The gift is protectiveness and emotional courage. Regular exercise and a clear purpose steady it.`
   },
   Mercury:{
    tag:'The prince: mind, speech and trade',
    guna:'Rajas (quick, restless)', gender:'Neuter (takes the nature of what it joins)', deity:'Vishnu (earth)', dig:1, karaka:[4,10],
    who:`Mercury is the thinking, talking, learning and trading planet. It is young, quick, curious and adaptable, and it takes the colour of the planets it joins: with benefics it becomes helpful, with malefics it turns sharp or tricky. It shows speech, writing, maths, logic, business, skin, nerves and the uncle (mother's brother). It is the planet of skill, not power: it succeeds by being clever and flexible.`,
    good:`Sharp intelligence, clear speech and writing, good memory for facts, trading and accounting skill, learning many things, humour, adaptability and success in business, media, teaching and technology.`,
    bad:`Nervousness, over-thinking, gossip and sharp tongue, restless mind, cunning, skin and nerve problems, scattered effort and speech that hurts. Too near the Sun, it is combust and loses independence.`,
    asp:[[7,`Mercury's only aspect is the 7th. It brings intellect, talk and trade into the opposite house: matters there get discussed, negotiated and put on paper. It makes that area clever and light, and sometimes nervous.`]],
    ex:`Exalted in Virgo, strongest at 15 degrees. Sharp, exact and skilled: analysis, medicine, accounts, craft and clear speech. It is weakest at 15 degrees of Pisces.`,
    mt:`Moolatrikona in Virgo, 15 to 20 degrees (Virgo 0 to 15 is the exaltation part and 20 to 30 plain own sign). Orderly, precise and practical.`,
    own:`Own signs Gemini and Virgo. In Gemini: quick, curious, a talker and a connector. In Virgo: careful, detailed, a problem solver.`,
    deb:`Debilitated in Pisces, deepest at 15 degrees. Logic dissolves into imagination and feeling: details are missed, speech is vague, the person trusts hunches over facts. The gift is intuitive, creative and poetic thinking. Writing lists and checking facts helps.`
   },
   Jupiter:{
    tag:'The teacher: wisdom, growth and grace',
    guna:'Sattva (wise, expansive)', gender:'Male', deity:'Brihaspati / Indra (ether)', dig:1, karaka:[2,5,9,11],
    who:`Jupiter is the greatest natural benefic. It stands for wisdom, teachers, dharma, children, faith, law, money and good fortune in general. It expands whatever it touches: it grows what it sees. It is warm, soft and generous. It shows the guru, advisers, judges, priests and bankers, and in the body the liver, fat and thighs. It is the karaka of children and (for women) the husband.`,
    good:`Wisdom and good judgement, honest guidance, children, teachers and blessings, generosity, faith, success in teaching, law, advice, finance and spiritual life, and protection of whatever it aspects.`,
    bad:`Over-optimism, over-spending and over-eating, lazy trust in luck, preaching, weight and liver issues, and giving away too much. A weak Jupiter can leave a person without good advice or guidance.`,
    asp:[[5,`The 5th aspect blesses the trine: intelligence, children, merit and creative power in the house it falls on. It is a protective gaze that expands the matters there.`],[7,`The 7th aspect protects and guides partnerships and public dealings in the opposite house. It is known to soften problems in the 7th and increase trust.`],[9,`The 9th aspect gives dharma and fortune: teachers, faith, luck and higher meaning. The matters of the house it falls on grow in a lawful, generous way.`]],
    ex:`Exalted in Cancer, strongest at 5 degrees. Wise, caring and abundant: gifts from family and teachers, protective leadership, good fortune. It is weakest at 5 degrees of Capricorn.`,
    mt:`Moolatrikona in Sagittarius, 0 to 10 degrees (Sagittarius 10 to 30 is plain own sign). Teaching, law, faith and honest guidance flow strongly.`,
    own:`Own signs Sagittarius and Pisces. Sagittarius: open, philosophical and truthful. Pisces: compassionate, spiritual and giving.`,
    deb:`Debilitated in Capricorn, deepest at 5 degrees. Wisdom turns practical and doubtful: optimism is held back, faith is questioned, advice becomes rigid. Growth comes through discipline, ethics and work, and blessings arrive after effort.`
   },
   Venus:{
    tag:'The minister: love, beauty and comfort',
    guna:'Rajas (pleasure-seeking)', gender:'Female', deity:'Lakshmi / Sachi (water)', dig:4, karaka:[7,12],
    who:`Venus is love, beauty, art, pleasure and comfort. It is cool, soft and attractive. It shows the spouse (especially the wife), romance, music, dance, fashion, vehicles, luxury and money for enjoyment, and in the body the reproductive system, face, throat and kidneys. It also stands for the harmony between people. It is a benefic that wants the good life and good company.`,
    good:`Charm, a loving marriage, taste, artistic gifts, comforts and luxuries, good vehicles and home, harmony, diplomacy, and success in art, design, entertainment, fashion, hospitality.`,
    bad:`Over-indulgence, laziness, vanity, trouble in love or marriage, many affairs, overspending, throat, kidney and sugar-related issues, and a life ruled by pleasure.`,
    asp:[[7,`Venus has only the 7th aspect. It brings harmony, affection, charm and refinement to the opposite house. Matters there become pleasant and artistic; too much can mean indulgence or comfort-seeking.`]],
    ex:`Exalted in Pisces, strongest at 27 degrees. Selfless, devoted love; refined art and compassion; a romantic and spiritual heart. It is weakest at 27 degrees of Virgo.`,
    mt:`Moolatrikona in Libra, 0 to 15 degrees (Libra 15 to 30 is plain own sign). Balanced, fair, artistic and good at relationships.`,
    own:`Own signs Taurus and Libra. Taurus: sensual, stable, loyal and rich in comfort. Libra: social, balanced, fair and charming.`,
    deb:`Debilitated in Virgo, deepest at 27 degrees. Love is analysed and criticised: perfectionism, shyness, worry about duty in relationships, and pleasure mixed with doubt. The gift is practical, sincere and skilled love. Relationships need kindness and patience.`
   },
   Saturn:{
    tag:'The servant: time, discipline and karma',
    guna:'Tamas (slow, heavy)', gender:'Neuter', deity:'Shani / Brahma (air)', dig:7, karaka:[8,10],
    who:`Saturn is time, work, discipline and the lessons of karma. It is cold, dry, slow and heavy. It shows hard work, service, laborers, structure, delay, old age, loss and long life. In the body it shows bones, joints, teeth, nerves and chronic conditions. It is the strictest teacher: it gives nothing for free, but what it gives lasts. Its results come late and stay long.`,
    good:`Discipline, patience, deep responsibility, a long life, steady rise in career, justice, endurance, success through hard work, in service, farming, mining, industry and any slow, solid structure.`,
    bad:`Delay, heavy burden, loneliness, fear, pessimism, poor health with bones and joints, losses, hard relationships with elders and a feeling of being held back. It cools and slows whatever it touches.`,
    asp:[[3,`Saturn's 3rd aspect slows and disciplines effort, courage and communication in the house it falls on. It makes the person careful and hard-working there, but can delay.`],[7,`The 7th aspect tests and matures partnerships and public dealings. Commitments become serious, sometimes cold or late.`],[10,`The 10th aspect demands responsibility and slow, earned results in career and public life. It builds a lasting reputation if the work is honest.`]],
    ex:`Exalted in Libra, strongest at 20 degrees. Fair and well organised: justice, structured leadership, patient success and long-lasting fortune. It is weakest at 20 degrees of Aries.`,
    mt:`Moolatrikona in Aquarius, 0 to 20 degrees (Aquarius 20 to 30 is plain own sign). Serious, disciplined and social-minded; works for the group.`,
    own:`Own signs Capricorn and Aquarius. Capricorn: practical, ambitious, patient climber. Aquarius: principled, detached and thinking of the many.`,
    deb:`Debilitated in Aries, deepest at 20 degrees. Discipline runs against impatience: restlessness, rule-breaking or burnout, delay and frustration. The person learns through hard experience and often becomes strong later. Cancellation can make this a powerful placement.`
   },
   Rahu:{
    tag:'The shadow that amplifies',
    guna:'Tamas (hungry, unconventional)', gender:'Neuter (shadow)', deity:'Durga (commonly)', dig:null, karaka:[],
    who:`Rahu is the north node, a shadow point and not a body. It is the hunger for more: ambition, foreign lands, technology, crowds, sudden rise and fall, illusion, obsession and unconventional paths. It has no sign of its own to rule, so it acts like the planet that joins it and like the lord of the sign it sits in. It often makes things bigger than they are. It is read as a natural malefic.`,
    good:`Bold ambition, innovation, success through the foreign or unusual, technology, politics, large audiences, sudden gains, and the courage to break old patterns, especially in the 3rd, 6th, 10th and 11th houses.`,
    bad:`Obsession, confusion, deception, addiction, anxiety, restlessness, scandal, risk-taking and a feeling that nothing is enough. Rahu takes away the sense of enough.`,
    asp:[[7,`This app counts only the 7th aspect for Rahu. It amplifies and distorts the opposite house: more, faster, stranger. Many schools also give Rahu the 5th and 9th (the same flavour on the trine houses); schools differ.`]],
    ex:`There is no agreement. This app (and many teachers) treats Taurus as Rahu's exaltation. Material ambition gets steady ground and wealth, status and pleasure grow. Some teachers use Gemini instead.`,
    mt:`No moolatrikona is agreed for the nodes.`,
    own:`No own sign is agreed. Some teachers give Rahu Aquarius, others Virgo; most read Rahu by the lord of the sign it sits in.`,
    deb:`This app treats Scorpio as Rahu's debilitation (some use Sagittarius). Hunger turns obsessive and secretive; control issues and suspicion. The gift is deep research and intensity.`
   },
   Ketu:{
    tag:'The shadow that detaches',
    guna:'Tamas (withdrawn, spiritual)', gender:'Neuter (shadow)', deity:'Ganesha (commonly)', dig:null, karaka:[],
    who:`Ketu is the south node, the headless shadow. It is detachment: it cuts away, withdraws and sees through. It stands for past-life skill, spiritual insight, research, isolation, sudden loss, moksha and the sharp, precise mind. Like Rahu it acts like the lord of its sign and the planets with it. Wherever Ketu sits, the person tends to feel less attached, and also tends to have a natural talent without trying.`,
    good:`Deep intuition, research and healing skill, freedom from craving, spiritual progress, precision, and sudden insight, especially in the 3rd, 6th, 9th, 11th and 12th houses.`,
    bad:`Confusion of purpose, withdrawal, loneliness, accidents and cuts, scattered focus, detachment from family or goals, and feeling that nothing is "mine".`,
    asp:[[7,`This app counts only the 7th aspect for Ketu. It cuts away or detaches the matters of the opposite house: less attachment, more insight. Many schools also give Ketu the 5th and 9th; schools differ.`]],
    ex:`There is no agreement. This app treats Scorpio as Ketu's exaltation (some use Sagittarius). Detachment becomes powerful research, occult skill and spiritual depth.`,
    mt:`No moolatrikona is agreed for the nodes.`,
    own:`No own sign is agreed. Some teachers give Ketu Scorpio, others Pisces; read Ketu by the lord of the sign it sits in.`,
    deb:`This app treats Taurus as Ketu's debilitation (some use Gemini). Detachment makes it hard to enjoy comforts or hold money; uneasy with possessions. The gift is simplicity.`
   }
  };

  /* ---------- rules shown once, for every planet ---------- */
  const ASP_RULES = [
    [C,'Every planet looks at the 7th house from itself (the opposite sign). Mars also looks at the 4th and 8th, Jupiter at the 5th and 9th, Saturn at the 3rd and 10th. These are the special aspects of the BPHS.'],
    [C,'Strength of an aspect (BPHS, aspects chapter): the 7th is full, the 4th and 8th three-quarters, the 5th and 9th half, the 3rd and 10th a quarter. Mars (4th, 8th), Jupiter (5th, 9th) and Saturn (3rd, 10th) give full strength on their special aspects.'],
    [C,'Aspects are counted by whole sign in this app: the aspect falls on the whole sign, not on exact degrees. Many teachers also look at how close the degrees are (orbs) for timing and strength.'],
    [P,'An aspect works on the house, on every planet in that house, and on the lord of that house. All three are read.'],
    [P,'A benefic aspect (Jupiter, Venus, a bright Moon, a clean Mercury) nourishes and protects. A malefic aspect (Saturn, Mars, Rahu, Ketu, the Sun) pressures, cools, heats or cuts. Malefic aspect can still toughen and build: it is not simply "bad".'],
    [P,'The aspect of a friend is easy, of an enemy is strained, of a neutral is plain. The aspecting planet\'s own strength, house lordship and sign matter more than the simple label.'],
    [P,'Two planets in opposite signs aspect each other (mutual 7th aspect). Their matters pull and balance, and each strengthens the other\'s theme in a tense way.'],
    [P,'Rahu and Ketu: this app uses the 7th only. Some traditions give them 5th and 9th too. Say which one you use when you share a reading.']
  ];
  const STR_RULES = [
    [C,'Exaltation and debilitation are 180 degrees apart. A planet is strongest at its exact exaltation degree and weakest at the exact degree in the opposite sign. Strength fades smoothly in between (BPHS lists the degrees for the seven planets).'],
    [C,'Order of dignity, strongest to weakest: exalted, moolatrikona, own sign, great friend\'s sign, friend\'s sign, neutral sign, enemy\'s sign, great enemy\'s sign, debilitated (BPHS and Saravali).'],
    [C,'Friendship is of two kinds. Natural (permanent) friends are fixed. Temporary friends are the planets in the 2nd, 3rd, 4th, 10th, 11th and 12th from the planet in the chart; the rest (1st, 5th, 6th, 7th, 8th, 9th) are temporary enemies.'],
    [C,'Compound friendship (panchadha maitri): natural friend and temporary friend = great friend; natural neutral and temporary friend = friend; natural friend and temporary enemy = neutral; natural neutral and temporary enemy = enemy; natural enemy and temporary enemy = great enemy.'],
    [P,'Neecha bhanga (debilitation cancelled) is commonly taught when: the lord of the debilitation sign is in a kendra from the Lagna or the Moon; or the lord of the exaltation sign of that planet is in a kendra; or the debilitated planet is aspected or joined by the lord of its debilitation sign; or the sign\'s lord and the planet exchange. Teachers differ on which count and how much they cancel.'],
    [P,'A debilitated planet in a good house with cancellation can give a "raja yoga" style result in some schools. This app does not label it a yoga; read the full chart.'],
    [P,'Vargottama (same sign in D1 and D9) adds strength. Retrograde adds effort but also delay (cheshta bala). Combustion (near the Sun) weakens independence.'],
    [C,'BPHS 6.53 (as read in this app\'s divisional guide): planets that are combust, beaten in planetary war, debilitated or weak damage the yogas they join. Check the strength of the planets in any combination.']
  ];
  const REL_RULES = [
    [C,'Friend, neutral and enemy are natural (permanent) relationships fixed by the BPHS for the seven planets; they come from the planet\'s own nature and its signs. The relation is not always mutual: Saturn is neutral to Jupiter but the Moon is neutral to everyone.'],
    [C,'A planet in a friend\'s sign is comfortable and gives results easily. In an enemy\'s sign it works under friction. See the Strength tab.'],
    [P,'Conjunction (two planets in the same sign): both lend their nature to the other. The stronger or the closer in degrees leads. A benefic with a malefic mixes, an enemy pair strains, a friend pair is smooth.'],
    [P,'Rahu and Ketu have no fixed list in the BPHS. The common scheme used here: Rahu friendly to Mercury, Venus, Saturn; unfriendly to the Sun, Moon, Mars; neutral to Jupiter. Ketu follows Mars in nature. Schools differ.'],
    [C,'Planetary war (graha yuddha): two planets, not the Sun or Moon, within one degree of each other. The one with the higher latitude (north) wins in the classical rule; the app uses the simpler longitude rule. The loser is weakened.'],
    [C,'Combustion: a planet too close to the Sun loses strength. The app uses: Moon 12, Mars 17, Mercury 14, Jupiter 11, Venus 10, Saturn 15 degrees (and fewer when retrograde in some systems).']
  ];

  /* ---------- helpers ---------- */
  const VD = () => (typeof VDB !== 'undefined' && VDB.data) ? VDB.data : null;
  const V = () => VD() ? VDB.data.planets : {};
  const ruleList = a => `<ul class="pen-rules">${a.map(r => `<li><span class="pen-tag ${r[0] === C ? 'c' : 'p'}">${r[0]}</span>${esc(r[1])}</li>`).join('')}</ul>`;
  const chips = list => `<div class="pen-chips">${list.map(x => `<span>${esc(x)}</span>`).join('')}</div>`;
  const split = s => String(s || '').split(/,\s*/).filter(Boolean).map(x => x.charAt(0).toUpperCase() + x.slice(1));
  const strengthWord = o => ({7:'full',4:'three-quarters',8:'three-quarters',5:'half',9:'half',3:'a quarter',10:'a quarter'}[o] || 'full');
  const fullAsp = (p, o) => (p === 'Mars' && (o === 4 || o === 8)) || (p === 'Jupiter' && (o === 5 || o === 9)) || (p === 'Saturn' && (o === 3 || o === 10)) || o === 7;
  const g = n => (typeof PLANET_GLYPHS !== 'undefined' && PLANET_GLYPHS[n]) || '';
  const st = { p: 'Sun', tab: 'nature', sign: null, house: null, asph: null };
  let CH = null;

  /* ---------- tab bodies ---------- */
  function secH(t, sub){ return `<h4 class="pen-h">${esc(t)}${sub ? `<small>${esc(sub)}</small>` : ''}</h4>`; }

  function tabNature(p){
    const D = PEN_DATA[p], v = V()[p] || {}, d = VD(), da = d && d.dasha ? d.dasha[p] : null;
    const facts = [['Type', v.nature], ['Element', v.element], ['Gender', D.gender], ['Quality (guna)', D.guna], ['Deity (common)', D.deity], ['Day', v.day], ['Direction', v.direction], ['Colour', v.colour || v.color], ['Gem (tradition)', v.gem], ['Metal', v.metal], ['Dasha length', da ? da.years : '']].filter(f => f[1]);
    const dig = D.dig ? `Strongest in the ${ordn(D.dig)} house (directional strength, dig bala).` : 'Rahu and Ketu have no directional-strength house in the classical scheme.';
    const kar = D.karaka.length ? D.karaka.map(ordn).join(', ') + ' house' + (D.karaka.length > 1 ? 's' : '') + ' (commonly taught)' : 'None fixed. They act as the lord of the sign they sit in and as the planets they join.';
    return `<div class="pen-sec">${secH('How it behaves')}<p>${esc(D.who)}</p></div>
      <div class="pen-two"><div class="pen-card good"><b>At its best</b><p>${esc(D.good)}</p></div><div class="pen-card bad"><b>When it struggles</b><p>${esc(D.bad)}</p></div></div>
      <div class="pen-sec">${secH('Quick facts')}<div class="pen-facts">${facts.map(f => `<div><small>${esc(f[0])}</small><b>${esc(f[1])}</b></div>`).join('')}</div></div>
      <div class="pen-sec">${secH('What it stands for')}${chips(split(v.signifies))}<p class="pen-note"><b>Body:</b> ${esc(v.body)}.</p></div>
      <div class="pen-sec">${secH('Houses')}<p class="pen-note"><b>Natural significator (karaka) of the:</b> ${esc(kar)}</p><p class="pen-note">${esc(dig)}</p></div>
      <div class="pen-sec">${secH('When strong, when weak')}<p class="pen-note"><b>Strong:</b> ${esc(v.strong)}.</p><p class="pen-note"><b>Weak:</b> ${esc(v.weak)}.</p></div>
      ${da ? `<div class="pen-sec">${secH(p + ' dasha (Vimshottari)', da.years)}<p>${esc(da.text)}</p></div>` : ''}`;
  }

  function tabAspects(p){
    const D = PEN_DATA[p], d = VD(), offs = (d && d.aspectRules.offsets[p]) || [7];
    let h = `<div class="pen-sec">${secH('Where ' + p + ' looks', 'counted from the house it sits in')}
      <div class="pen-ring">${[1,2,3,4,5,6,7,8,9,10,11,12].map(n => `<span class="${n === 1 ? 'me' : ''}${offs.includes(n) ? ' hit' : ''}">${n === 1 ? g(p) : ''}<em>${n}</em></span>`).join('')}</div>
      <p class="pen-note">Gold boxes are the houses it looks at. Box 1 is the house where ${esc(p)} sits.</p></div>`;
    D.asp.forEach(a => {
      h += `<div class="pen-card asp"><b>${ordn(a[0])} aspect <i>${fullAsp(p, a[0]) ? 'full strength' : strengthWord(a[0])}</i></b><p>${esc(a[1])}</p></div>`;
    });
    if (p === 'Rahu' || p === 'Ketu') h += `<div class="pen-card asp"><b>5th and 9th aspect <i>some schools</i></b><p>${esc(p)} is given these two aspects by many teachers, the same flavour on the trine houses. This app uses the 7th only.</p></div>`;
    // aspect on each planet
    h += `<div class="pen-sec">${secH(p + ' looking at each planet', 'tap to open')}`;
    PL.filter(x => x !== p).forEach(o => {
      const t = d && d.planetAspect[p + '>' + o];
      if (t) h += `<details class="pen-d"><summary><span style="color:${COL[o]}">${g(o)}</span> ${esc(p)} looks at ${esc(o)}</summary><p>${esc(t)}</p></details>`;
    });
    h += `</div>`;
    // aspect on house
    const hs = st.asph || 7;
    h += `<div class="pen-sec">${secH('When ' + p + ' looks at a house', 'pick the house')}
      <div class="pen-pills">${[1,2,3,4,5,6,7,8,9,10,11,12].map(n => `<button type="button" data-pen-ah="${n}" class="${n === hs ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="pen-card"><p>${esc(d && d.aspectOnHouse[p] ? d.aspectOnHouse[p][hs - 1] : '')}</p></div></div>`;
    h += `<details class="pen-d big"><summary>Rules of aspects (all planets)</summary>${ruleList(ASP_RULES)}</details>`;
    return h;
  }

  function tabStrength(p){
    const D = PEN_DATA[p], d = VD(), dg = d && d.planetInSignDignity ? d.planetInSignDignity[p] : [], v = V()[p] || {};
    const by = k => SG.filter((s, i) => dg[i] === k);
    const row = (k, signs, deg, txt) => `<div class="pen-dig" style="--dc:${DCOL[k]}"><div class="pen-dig-h"><i></i><b>${DLAB[k]}</b><span>${signs.length ? esc(signs.join(', ')) : 'none agreed'}${deg ? ' <em>' + esc(deg) + '</em>' : ''}</span></div><p>${esc(txt)}</p></div>`;
    const E = (typeof EXALTATION !== 'undefined') ? EXALTATION[p] : null, M = (typeof MOOLATRIKONA !== 'undefined') ? MOOLATRIKONA[p] : null;
    const exD = E && E.deg != null ? 'peak ' + E.deg + '°' : '';
    const mtD = M ? M.from + '° to ' + M.to + '°' : '';
    const friendTxt = `Comfortable and supported. ${v.strong ? 'Typical result: ' + v.strong + '.' : ''} The planet\'s good traits show without strain.`;
    const neutTxt = `Works at a normal level. The result depends on the planet\'s house, its aspects and the strength of the sign\'s lord.`;
    const enemTxt = `Works under friction. ${v.weak ? 'Typical result: ' + v.weak + '.' : ''} More effort is needed and the planet may feel defensive.`;
    let h = `<div class="pen-sec">${secH(p + ' by dignity', 'strongest to weakest')}
      <div class="pen-bar">${['Exalted','Moolatrikona','OwnSign','Friend','Neutral','Enemy','Debilitated'].map(k => `<i style="background:${DCOL[k]}" title="${DLAB[k]}"></i>`).join('')}</div>
      ${row('Exalted', by('Exalted'), exD, D.ex)}${row('Moolatrikona', by('Moolatrikona'), mtD, D.mt)}${row('OwnSign', by('Own'), '', D.own)}
      ${row('Friend', by('Friend'), '', friendTxt)}${row('Neutral', by('Neutral'), '', neutTxt)}${row('Enemy', by('Enemy'), '', enemTxt)}${row('Debilitated', by('Debilitated'), E && E.deg != null ? 'lowest ' + E.deg + '°' : '', D.deb)}</div>`;
    const sg = st.sign != null ? st.sign : (CH && CH.planets && CH.planets[p] ? CH.planets[p].sign : (E ? E.sign : 0));
    const sd = dg[sg];
    h += `<div class="pen-sec">${secH(p + ' in each sign', 'tap a sign')}<div class="pen-signs">${SG.map((s, i) => `<button type="button" data-pen-sg="${i}" class="${i === sg ? 'on' : ''}" style="--dc:${DCOL[dg[i]] || '#888'}"><i></i>${s.slice(0, 3)}</button>`).join('')}</div>
      <div class="pen-card"><b style="color:${DCOL[sd] || '#aaa'}">${esc(SG[sg])}: ${esc(DLAB[sd] || '')}</b><p>${esc(d && d.planetInSign[p] ? d.planetInSign[p][sg] : '')}</p></div></div>`;
    const stat = d && d.status ? d.status : {};
    h += `<div class="pen-sec">${secH('Other things that change its strength')}`;
    if (p !== 'Rahu' && p !== 'Ketu' && p !== 'Sun') h += `<details class="pen-d"><summary>Retrograde ${esc(p)}</summary><p>${esc(stat.retrograde && (stat.retrograde[p] || stat.retrograde.general))}</p></details>`;
    if (p === 'Rahu' || p === 'Ketu') h += `<details class="pen-d"><summary>${esc(p)} is always retrograde</summary><p>${esc(stat.retrograde && stat.retrograde[p] || 'The nodes always move backwards, so retrograde is not a special mark for them.')}</p></details>`;
    if (p !== 'Rahu' && p !== 'Ketu' && p !== 'Sun') h += `<details class="pen-d"><summary>Combust ${esc(p)} (too close to the Sun)</summary><p>${esc(stat.combust && (stat.combust[p] || stat.combust.general))}</p></details>`;
    if (stat.vargottama) h += `<details class="pen-d"><summary>Vargottama ${esc(p)}</summary><p>${esc(typeof stat.vargottama === 'string' ? stat.vargottama : (stat.vargottama[p] || stat.vargottama.general || ''))}</p></details>`;
    h += `</div><details class="pen-d big"><summary>Rules of strength (all planets)</summary>${ruleList(STR_RULES)}</details>`;
    return h;
  }

  function tabRel(p){
    const d = VD(), v = V()[p] || {}, r = v.relations || {friends:[],enemies:[],neutrals:[]};
    const grp = (t, a, k) => `<div class="pen-rel ${k}"><b>${t}</b>${a.length ? `<div>${a.map(x => `<span style="--c:${COL[x]}">${g(x)} ${x}</span>`).join('')}</div>` : '<em>none</em>'}</div>`;
    let h = `<div class="pen-sec">${secH(p + ' relationships', 'natural, permanent')}${grp('Friends', r.friends, 'f')}${grp('Neutral', r.neutrals, 'n')}${grp('Enemies', r.enemies, 'e')}
      ${(p === 'Rahu' || p === 'Ketu') ? `<p class="pen-note">The BPHS gives no fixed list for the nodes. This is the common scheme; schools differ.</p>` : ''}</div>`;
    h += `<div class="pen-sec">${secH(p + ' with every other planet', 'tap one')}`;
    PL.filter(x => x !== p).forEach(o => {
      const kind = r.friends.includes(o) ? ['friend', 'f'] : r.enemies.includes(o) ? ['enemy', 'e'] : ['neutral', 'n'];
      const cj = d && VDB.conjunction(p, o), a1 = d && d.planetAspect[p + '>' + o], a2 = d && d.planetAspect[o + '>' + p];
      h += `<details class="pen-d"><summary><span style="color:${COL[o]}">${g(o)}</span> ${esc(o)} <em class="pen-badge ${kind[1]}">${kind[0]}</em></summary>
        ${cj ? `<p><b>${esc(p)} and ${esc(o)} in the same sign.</b> ${esc(cj)}</p>` : `<p><b>Same sign.</b> ${esc(p)} and ${esc(o)} are always opposite each other, so they never join.</p>`}
        ${a1 ? `<p>${esc(a1)}</p>` : ''}${a2 ? `<p>${esc(a2)}</p>` : ''}</details>`;
    });
    h += `</div><details class="pen-d big"><summary>Rules of friendship (all planets)</summary>${ruleList(REL_RULES)}</details>`;
    return h;
  }

  function tabHouses(p){
    const d = VD(), D = PEN_DATA[p], tone = d && d.tone[p] ? d.tone[p].split(' ') : [];
    const sel = st.house || (CH && CH.planets && CH.planets[p] ? CH.planets[p].house : (D.dig || 1));
    const tc = {'+':'#5fd08a','0':'#d4af37','-':'#e0725a'}, tw = {'+':'supportive','0':'mixed','-':'challenging'};
    const t = d ? d.planetInHouse[p][sel - 1] : '';
    return `<div class="pen-sec">${secH(p + ' in each house', 'tap a house')}
      <div class="pen-pills tone">${[1,2,3,4,5,6,7,8,9,10,11,12].map(n => `<button type="button" data-pen-ho="${n}" class="${n === sel ? 'on' : ''}" style="--dc:${tc[tone[n - 1]] || '#888'}"><i></i>${n}</button>`).join('')}</div>
      <p class="pen-note"><i class="pen-dot" style="background:#5fd08a"></i>supportive <i class="pen-dot" style="background:#d4af37"></i>mixed <i class="pen-dot" style="background:#e0725a"></i>challenging (a rule of thumb, always read with sign, aspects and the house lord)</p>
      <div class="pen-card"><b style="color:${tc[tone[sel - 1]] || '#aaa'}">${esc(p)} in the ${ordn(sel)} house: ${esc(tw[tone[sel - 1]] || '')}</b><p>${esc(t)}</p></div>
      ${D.dig ? `<p class="pen-note">Directional strength: ${esc(p)} gains strength in the ${ordn(D.dig)} house.</p>` : ''}</div>`;
  }

  function tabMine(p){
    if (!CH || !CH.planets || !CH.planets[p]) return `<div class="pen-card"><p>Create or open a chart to see ${esc(p)} in your own chart here.</p></div>`;
    let rd = null; try { rd = VDB.reading(CH).planets[p]; } catch (e) {}
    const pl = CH.planets[p], deg = (pl.longitude % 30), dd = Math.floor(deg), mm = Math.floor((deg - dd) * 60);
    const dstat = pl.dignity && pl.dignity.status;
    let h = `<div class="pen-me" style="--pc:${COL[p]}"><div class="pen-me-g">${g(p)}</div><div><b>${esc(p)} in ${esc(SG[pl.sign])}</b><span>${dd}° ${mm}' · ${ordn(pl.house)} house${pl.nakshatra ? ' · ' + esc(pl.nakshatra.name) + ' pada ' + pl.nakshatra.pada : ''}</span></div></div>
      <div class="pen-chips big">${dstat ? `<span style="border-color:${DCOL[dstat] || '#888'};color:${DCOL[dstat] || '#ccc'}">${esc(DLAB[dstat] || dstat)}</span>` : ''}${pl.retrograde && p !== 'Rahu' && p !== 'Ketu' ? '<span>Retrograde</span>' : ''}${pl.combustion && pl.combustion.combust ? '<span>Combust</span>' : ''}${rd && rd.lordOf && rd.lordOf.length ? `<span>Lord of the ${rd.lordOf.map(ordn).join(' and ')}</span>` : ''}</div>`;
    if (rd){
      if (rd.inSign) h += `<div class="pen-card"><b>In ${esc(SG[pl.sign])}</b><p>${esc(rd.inSign.text)}</p></div>`;
      if (rd.inHouse) h += `<div class="pen-card"><b>In the ${ordn(pl.house)} house (${esc(rd.inHouse.tone)})</b><p>${esc(rd.inHouse.text)}</p></div>`;
      (rd.status || []).forEach(s => { h += `<div class="pen-card"><b>${esc(s.key.charAt(0).toUpperCase() + s.key.slice(1))}</b><p>${esc(s.text)}</p></div>`; });
      if (rd.aspectsHouses && rd.aspectsHouses.length) h += `<div class="pen-sec">${secH('It looks at')}${rd.aspectsHouses.map(a => `<details class="pen-d"><summary>The ${ordn(a.house)} house</summary><p>${esc(a.text)}</p></details>`).join('')}${(rd.aspectsPlanets || []).map(a => `<details class="pen-d"><summary><span style="color:${COL[a.to]}">${g(a.to)}</span> ${esc(a.to)}</summary><p>${esc(a.text)}</p></details>`).join('')}</div>`;
      if (rd.aspectedBy && rd.aspectedBy.length) h += `<div class="pen-sec">${secH('Looked at by')}${rd.aspectedBy.map(a => `<details class="pen-d"><summary><span style="color:${COL[a.from]}">${g(a.from)}</span> ${esc(a.from)}</summary><p>${esc(a.text)}</p></details>`).join('')}</div>`;
      if (rd.conjunct && rd.conjunct.length) h += `<div class="pen-sec">${secH('Together in the same sign')}${rd.conjunct.map(a => `<details class="pen-d" open><summary><span style="color:${COL[a.with]}">${g(a.with)}</span> with ${esc(a.with)}</summary><p>${esc(a.text)}</p></details>`).join('')}</div>`;
    }
    return h;
  }

  const BODY = { nature: tabNature, aspects: tabAspects, strength: tabStrength, rel: tabRel, houses: tabHouses, mine: tabMine };

  /* ---------- panel ---------- */
  function shell(){
    const p = st.p, v = V()[p] || {};
    return `<div class="pen" style="--pc:${COL[p]}">
      <div class="pen-pick" role="tablist">${PL.map(n => `<button type="button" data-pen-p="${n}" class="${n === p ? 'on' : ''}" style="--c:${COL[n]}"><b>${g(n)}</b><span>${n}</span></button>`).join('')}</div>
      <div class="pen-hero"><div class="pen-hg">${g(p)}</div><div><h3>${esc(p)} <small>${esc(v.sk || '')}</small></h3><p>${esc(PEN_DATA[p].tag)}</p></div></div>
      <div class="pen-tabs" role="tablist">${TABS.map(t => `<button type="button" data-pen-t="${t[0]}" class="${t[0] === st.tab ? 'on' : ''}">${t[1]}</button>`).join('')}</div>
      <div class="pen-body" id="penBody">${BODY[st.tab](p)}</div>
      <p class="pen-foot">Traditional Jyotish significations for study and reflection, not predictions or advice. Sources: BPHS and teaching sources; rules are tagged.</p></div>`;
  }
  function render(keepScroll){
    const root = document.getElementById('penRoot'); if (!root) return;
    const y = window.scrollY;
    root.innerHTML = shell();
    if (keepScroll) window.scrollTo(0, y);
  }
  function renderBody(){
    const b = document.getElementById('penBody'); if (!b) return;
    b.innerHTML = BODY[st.tab](st.p);
    document.querySelectorAll('[data-pen-t]').forEach(x => x.classList.toggle('on', x.dataset.penT === st.tab));
  }

  document.addEventListener('click', function(e){
    const t = e.target.closest && e.target.closest('[data-pen-p],[data-pen-t],[data-pen-sg],[data-pen-ho],[data-pen-ah]');
    if (!t || !document.getElementById('penRoot')) return;
    const D = t.dataset;
    if (D.penP){ st.p = D.penP; st.sign = null; st.house = null; st.asph = null; render(false); const pk = document.querySelector('.pen-pick'); const on = pk && pk.querySelector('.on'); if (on && on.scrollIntoView) on.scrollIntoView({inline:'center', block:'nearest'}); return; }
    if (D.penT){ st.tab = D.penT; renderBody(); return; }
    if (D.penSg != null){ st.sign = +D.penSg; renderBody(); return; }
    if (D.penHo != null){ st.house = +D.penHo; renderBody(); return; }
    if (D.penAh != null){ st.asph = +D.penAh; renderBody(); return; }
  });

  function html(chart){
    CH = chart || null;
    st.sign = null; st.house = null; st.asph = null;
    let h = '';
    try { h = `<div id="penRoot">${shell()}</div>`; } catch (e) { console.warn('planet encyclopedia', e); h = '<div id="penRoot"><p>Planet Encyclopedia could not load.</p></div>'; }
    return h;
  }
  function open(p, tab){
    if (PEN_DATA[p]) st.p = p; if (tab) st.tab = tab;
    if (typeof switchAppTab === 'function') switchAppTab('panel-planetency');
    render(false);
  }
  function text(p){
    const D = PEN_DATA[p]; if (!D) return '';
    const v = V()[p] || {};
    return [`${p} (${v.sk || ''}): ${D.tag}`, D.who, 'At its best: ' + D.good, 'When it struggles: ' + D.bad, 'Exalted: ' + D.ex, 'Moolatrikona: ' + D.mt, 'Own sign: ' + D.own, 'Debilitated: ' + D.deb,
      'Aspects: ' + D.asp.map(a => ordn(a[0]) + ' - ' + a[1]).join(' ')].join('\n\n');
  }
  return { html, open, text, data: PEN_DATA, planets: PL, rules: { aspects: ASP_RULES, strength: STR_RULES, relations: REL_RULES } };
})();
window.buildPlanetEncyPanel = function(chart){ return PEN.html(chart); };

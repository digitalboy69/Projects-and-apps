/* ASTRO ATLAS, more reference data (global ATLAS_MORE): yogas, remedies, planet in each house, match (ashtakoota), muhurta timings, glossary, Sade Sati, Ashtakavarga.
   Traditional teaching only; nothing here is calculated from a chart. Used by js/133-astro-atlas-more.js. */
const ATLAS_MORE = (function(){
  const YOGA_CATS = ['Great persons', 'Power and wealth', 'Moon and Sun', 'Repair', 'Hard patterns'];
  /* [category, name, formation, result, note] */
  const YOGAS = [
    [0,'Ruchaka','Mars in Aries, Scorpio or Capricorn, in a Kendra from the Lagna','Brave, athletic, commanding; strong in sport, defence, property and leadership',''],
    [0,'Bhadra','Mercury in Gemini or Virgo, in a Kendra','Sharp mind, speech and trade; good at learning, writing and business',''],
    [0,'Hamsa','Jupiter in Sagittarius, Pisces or Cancer, in a Kendra','Wise, respected, fortunate; teacher, adviser or leader of principle',''],
    [0,'Malavya','Venus in Taurus, Libra or Pisces, in a Kendra','Charm, comfort, art and a refined life; good partnerships and vehicles',''],
    [0,'Sasa','Saturn in Capricorn, Aquarius or Libra, in a Kendra','Discipline, authority built by work; command over workers and systems','These five are the Pancha Mahapurusha yogas. The planet must be in its own or exalted sign.'],
    [1,'Raja yoga','The lord of a Kendra and the lord of a Trikona join, aspect each other or exchange signs','Rise in status, recognition and authority, in the periods of those planets','The more strongly placed the two planets are, the better the result.'],
    [1,'Dharma Karmadhipati','Lords of the 9th and 10th houses linked','Career guided by purpose; a path where work and dharma meet',''],
    [1,'Yogakaraka','One planet owns both a Kendra and a Trikona: Mars for Cancer and Leo rising, Saturn for Taurus and Libra, Venus for Capricorn and Aquarius','That planet acts as the chart\'s best friend, giving support in its Dasha',''],
    [1,'Dhana yoga','Lords of the 2nd, 5th, 9th and 11th houses linked with each other or with the Lagna lord','Wealth that builds in steady stages','The 2nd and 11th are the money houses; the 5th and 9th add merit.'],
    [1,'Lakshmi yoga','Strong 9th lord in a Kendra or Trikona, with a strong Lagna lord','Comfort, grace and lasting prosperity',''],
    [1,'Saraswati yoga','Jupiter, Venus and Mercury in Kendra, Trikona or the 2nd, with Jupiter strong','Learning, arts, speech and a gifted mind',''],
    [2,'Gajakesari','Jupiter in a Kendra from the Moon','Good name, steady mind, protection in trouble; wise standing among people',''],
    [2,'Budhaditya','Sun and Mercury in the same sign','Intelligence, administration, clear thinking','Very close to the Sun, Mercury is combust and the effect weakens.'],
    [2,'Chandra Mangala','Moon and Mars in the same sign','Drive for earning, enterprise, bold feelings',''],
    [2,'Sunapha, Anapha, Durudhara','Planets (other than the Sun) in the 2nd, the 12th, or both, from the Moon','Self-made wealth, good reputation, comforts, giving nature',''],
    [2,'Adhi yoga','Benefics (Mercury, Venus, Jupiter) in the 6th, 7th and 8th from the Moon','Leadership, security and gradual high position',''],
    [2,'Amala yoga','A benefic planet in the 10th from the Lagna or from the Moon','Lasting good name and clean reputation',''],
    [3,'Neecha Bhanga','A debilitated planet\'s weakness is cancelled: its sign lord or the lord of its exaltation sign sits in a Kendra from the Lagna or Moon, or the exaltation lord aspects it','Struggle early, then a strong rise; the weak planet becomes a source of strength','Several versions exist; the more conditions are met, the stronger the repair.'],
    [3,'Viparita Raja','Lords of the 6th, 8th and 12th placed in 6th, 8th or 12th (Harsha, Sarala, Vimala)','Gain after loss; winning through crisis, debt or opposition',''],
    [3,'Parivartana','Two planets in each other\'s signs. Maha: both good houses. Khala: the 3rd involved. Dainya: the 6th, 8th or 12th involved','The two houses act together, strongly',''],
    [3,'Kemadruma cancellation','Kemadruma is cancelled when the Moon has a planet with it or in a Kendra from the Lagna or from the Moon','Loneliness effects soften',''],
    [4,'Kemadruma','No planet (apart from the Sun, Rahu and Ketu) in the 2nd or 12th from the Moon, and none with it','Feeling of emptiness or going it alone; needs a strong support net','Cancelled in several ways (see Repair).'],
    [4,'Kala Sarpa','All seven planets between Rahu and Ketu','A life of sudden turns; strong karmic themes','Views differ; many astrologers give it little weight.'],
    [4,'Manglik (Kuja dosha)','Mars in the 1st, 2nd, 4th, 7th, 8th or 12th from the Lagna (some add the Moon and Venus)','Strong temper in partnership; checked in marriage matching','Cancelled when both partners have it, or by Mars in own or exalted sign, and in other cases.'],
    [4,'Guru Chandala','Jupiter with Rahu','Unconventional beliefs; question of teachers and trust',''],
    [4,'Grahan yoga','Sun or Moon with Rahu or Ketu','Distortion of the mind or vitality; best read with the whole chart',''],
    [4,'Shrapit yoga','Saturn with Rahu','Heavy karmic weight, delays and tests of patience','Traditional teaching; reading it needs the whole chart.']
  ];

  const REMEDIES = {
    Sun:     { mantra:'Om Hraam Hreem Hraum Sah Suryaya Namah',        deity:'Surya',               gem:'Ruby',               finger:'Ring finger',   metal:'Gold',          day:'Sunday',    daan:'Wheat, jaggery, copper, red cloth', rud:'1 or 12 mukhi', tree:'Arka (calotropis), Bael',  fast:'Sunday, one meal without salt',  text:'Aditya Hridayam' },
    Moon:    { mantra:'Om Shraam Shreem Shraum Sah Chandraya Namah',    deity:'Shiva and Parvati',   gem:'Pearl',              finger:'Little finger', metal:'Silver',        day:'Monday',    daan:'Rice, milk, white cloth, silver',   rud:'2 mukhi',       tree:'Palash',                   fast:'Monday, milk and fruit',          text:'Shiva Chalisa, Chandra stotra' },
    Mars:    { mantra:'Om Kraam Kreem Kraum Sah Bhaumaya Namah',        deity:'Hanuman, Kartikeya',  gem:'Red coral',          finger:'Ring finger',   metal:'Copper, gold',  day:'Tuesday',   daan:'Red lentils, jaggery, red cloth',   rud:'3 mukhi',       tree:'Khadira',                  fast:'Tuesday',                         text:'Hanuman Chalisa' },
    Mercury: { mantra:'Om Braam Breem Braum Sah Budhaya Namah',         deity:'Vishnu',              gem:'Emerald',            finger:'Little finger', metal:'Gold, bronze',  day:'Wednesday', daan:'Green moong, green cloth, books',   rud:'4 mukhi',       tree:'Apamarga',                 fast:'Wednesday',                       text:'Vishnu Sahasranama' },
    Jupiter: { mantra:'Om Graam Greem Graum Sah Gurave Namah',          deity:'Brihaspati, Vishnu',  gem:'Yellow sapphire',    finger:'Index finger',  metal:'Gold',          day:'Thursday',  daan:'Chana dal, turmeric, yellow cloth', rud:'5 mukhi',       tree:'Peepal',                   fast:'Thursday, yellow food',           text:'Guru stotra' },
    Venus:   { mantra:'Om Draam Dreem Draum Sah Shukraya Namah',        deity:'Lakshmi, Devi',       gem:'Diamond (or white sapphire)', finger:'Middle finger', metal:'Silver, platinum', day:'Friday', daan:'Rice, sugar, white cloth, curd', rud:'6 mukhi',       tree:'Gular (udumbara)',         fast:'Friday',                          text:'Lakshmi stotra, Durga Saptashati' },
    Saturn:  { mantra:'Om Praam Preem Praum Sah Shanaishcharaya Namah', deity:'Shani, Hanuman',      gem:'Blue sapphire',      finger:'Middle finger', metal:'Iron, silver',  day:'Saturday',  daan:'Black sesame, mustard oil, iron, black cloth', rud:'7 mukhi', tree:'Shami',          fast:'Saturday',                        text:'Shani stotra, Hanuman Chalisa' },
    Rahu:    { mantra:'Om Bhraam Bhreem Bhraum Sah Rahave Namah',       deity:'Durga',               gem:'Hessonite (gomed)',  finger:'Middle finger', metal:'Silver, mixed', day:'Saturday',  daan:'Urad dal, blue or black cloth, coconut', rud:'8 mukhi',  tree:'Sandalwood',               fast:'Saturday',                        text:'Durga Saptashati' },
    Ketu:    { mantra:'Om Sraam Sreem Sraum Sah Ketave Namah',          deity:'Ganesha',             gem:'Cat\'s eye',         finger:'Middle finger', metal:'Silver, mixed', day:'Tuesday',   daan:'Sesame, blanket, feeding dogs',     rud:'9 mukhi',       tree:'Kusha grass',              fast:'Tuesday',                         text:'Ganesha Atharvashirsha' }
  };

  /* planet in each house, 12 short readings */
  const IN_HOUSE = {
    Sun: ['Strong ego, vitality and leadership; watch pride','Family pride, authoritative speech; wealth through status','Courage, initiative and strong will; younger siblings','Heart tied to home and mother; property by effort, peace takes work','Creative and proud of intellect; leader among children and students','Wins over rivals, strong digestion; service to authority','Strong-willed partner; ego in partnership','Research, inheritance, ups and downs in health; transformation','Respect for father and teachers; fortune through authority','Directional strength: authority, public standing and career','Gains through influential networks; ambitions are met','Foreign lands, hidden effort and spending; spiritual search'],
    Moon: ['Sensitive, changeable, intuitive and popular','Soft speech, family bonds, fluctuating income','Imaginative; short journeys; closeness to siblings','Directional strength: emotional peace, mother, home and vehicles','Emotional intelligence, love for children, creative','Worry and digestion need care; service-minded','Caring partner, changeable relationships, public dealings','Deep feelings, intuition and sudden changes','Faith, travel and devotion; close to the guru','Public career, caring professions, changing status','Many friends, steady gains, wishes fulfilled','Retreat, dreams, foreign stays; sleep and spending'],
    Mars: ['Energetic, bold, quick to anger; mark or scar on the head','Sharp speech; wealth by effort; family tension','Great courage and stamina; sporty (a strong place)','Restless home; land and property interest or dispute','Competitive mind, passionate creativity, strategy','Defeats enemies, strong immunity (a strong place)','Passionate, argumentative partnership (Manglik)','Intensity; care with accidents or surgery; research','Fighter for beliefs; friction with father or teachers','Directional strength: drive, command, engineering, defence or sport','Gains through bold effort and networks (a strong place)','Hidden anger, expenses, foreign link, restless sleep'],
    Mercury: ['Directional strength: quick-witted, youthful, talkative','Skilled speaker and trader; wealth through words','Writers and communicators; many short trips','Learned home; studies; educated mother','Sharp intellect; teachers and advisers; clever with children','Analytical; handles debts and disputes; nerves need care','Business partnerships; clever, young-minded spouse','Research, occult and hidden knowledge; insurance','Higher study, scholar, publishing','Career in business, writing, media or analysis','Gains through networks and trade','Private thinker; foreign or behind-the-scenes work'],
    Jupiter: ['Directional strength: wisdom, optimism, good health, protective','Wealth, wise speech, family blessing','Courage in knowledge; writing; helpful siblings','Happiness, home, education, vehicles','Excellent for intellect, children and mantra (a strong place)','Service; debts and health need care; slow victory over enemies','Wise partner; good marriage; counselling','Long life, inheritance, deep research','Fortunate: dharma, teachers and blessings (a strong place)','Respected career: teaching, law, counselling','Strong gains, fulfilled wishes, large network','Spiritual, charitable, foreign stays, liberation'],
    Venus: ['Charming, attractive, loves comfort','Sweet speech, wealth, love of food and family','Artistic skill, pleasant communicator, pleasure trips','Directional strength: home comfort, vehicles, mother, peace','Romance, creative talent, children','Health and service need care; manage debts and relations','Love and marriage take centre stage; charming partnerships','Hidden pleasures, inheritance, deep bonds','Fortunate; refined beliefs; long journeys','Career in art, luxury, beauty or diplomacy','Gains through relationships and arts (a strong place)','Bed pleasures, foreign stays, spiritual love, luxury spending'],
    Saturn: ['Serious, disciplined, a late bloomer; take care of health','Measured speech; slow savings; family duty','Perseverance; hard worker; courage by effort','Responsibility for home; delayed peace; mother\'s care','Slow children or study; disciplined intellect','Beats rivals by patience; service (a strong place)','Directional strength: serious partner, stable or later marriage; justice','Long life; hidden obstacles; research; endurance','Faith grows slowly; teachers; duty','Career grows slowly and lasts; authority built by work','Gains grow with time; older friends (a strong place)','Isolation, spending, foreign, detachment; sleep discipline'],
    Rahu: ['Magnetic, unconventional, restless sense of identity','Unusual speech and family pattern; sudden money swings','Bold, ambitious communicator; media skills (a strong place)','Restless home; foreign settlement; unease of mind','Unconventional ideas; speculation needs care','Overcomes rivals; strong in competition (a good place)','Unusual partner or foreign link','Interest in the occult; sudden events','Unorthodox beliefs; foreign teachers','Ambition, fame and sudden rise (a good place)','Excellent gains and wide networks (a good place)','Foreign link, hidden matters, spiritual searching'],
    Ketu: ['Detached, intuitive and private','Blunt speech; detached from family wealth','Strong courage; spiritual practice (a good place)','Detached from home; inner peace through retreat','Mantra and past-life skill; children matters sensitive','Good for healing and defeating enemies','Detachment in partnership; spiritual partner','Occult, research and liberation (a good place)','Spiritual, unconventional faith, guru','Unconventional career; works behind the scenes','Gains through detached effort','Liberation, retreat, meditation (a good place)']
  };

  const ASHTAKOOTA = [
    ['Varna','1','Work and ego fit','Spiritual ranking of the two Moon signs'],
    ['Vashya','2','Mutual pull and control','Which partner leads and how'],
    ['Tara','3','Health and luck','Count between the two birth stars'],
    ['Yoni','4','Physical and instinct match','Animal symbol of each star'],
    ['Graha Maitri','5','Mental friendship','Friendship of the two Moon-sign lords'],
    ['Gana','6','Temperament','Deva, Manushya or Rakshasa nature'],
    ['Bhakoot','7','Emotional and money harmony','Distance between the two Moon signs'],
    ['Nadi','8','Health and children','Aadi, Madhya or Antya pulse type; same Nadi is a concern']
  ];
  const SCORES = [['0 to 17','Not recommended','#e5584b'],['18 to 24','Average, workable','#f2cf6b'],['25 to 32','Good','#58c98a'],['33 to 36','Excellent','#5ad6c4']];

  /* Muhurta: eight 1.5 hour parts of a 6:00 to 18:00 day, shown by weekday Sun..Sat */
  const BAD_TIMES = {
    Rahu:    ['16:30 to 18:00','07:30 to 09:00','15:00 to 16:30','12:00 to 13:30','13:30 to 15:00','10:30 to 12:00','09:00 to 10:30'],
    Yamaganda:['12:00 to 13:30','10:30 to 12:00','09:00 to 10:30','07:30 to 09:00','06:00 to 07:30','15:00 to 16:30','13:30 to 15:00'],
    Gulika:  ['15:00 to 16:30','13:30 to 15:00','12:00 to 13:30','10:30 to 12:00','09:00 to 10:30','07:30 to 09:00','06:00 to 07:30']
  };
  const MUHURTA_NOTES = [
    ['Brahma Muhurta','96 to 48 minutes before sunrise','Quiet, clear time for prayer, study and meditation'],
    ['Abhijit Muhurta','About 24 minutes either side of local noon','A victorious window; many faults are set aside'],
    ['Godhuli','Around sunset','Cow-dust hour; calm, used for some ceremonies'],
    ['Amrit and Siddha Yoga','Special weekday and star pairs','Auspicious combinations for starts and journeys']
  ];
  const PANCHAKA = [['Tithi','Lunar day','30 per month','Moon minus Sun, every 12 degrees'],['Vara','Weekday','7','Ruled by a planet'],['Nakshatra','Moon\'s star','27','13 degrees 20 minutes each'],['Yoga','Sun plus Moon','27','Every 13 degrees 20 minutes'],['Karana','Half a tithi','11','Seven moving, four fixed']];

  const SADE = [
    ['Rising phase','Saturn in the 12th from the natal Moon sign','About 2.5 years','Expenses, sleep and quiet pressure; letting things go'],
    ['Peak phase','Saturn over the natal Moon sign','About 2.5 years','The heaviest test; patience and the body-mind need care'],
    ['Setting phase','Saturn in the 2nd from the Moon sign','About 2.5 years','Money and family matters settle; recovery builds']
  ];
  const ASHTA = [['Sun',48],['Moon',49],['Mars',39],['Mercury',54],['Jupiter',56],['Venus',52],['Saturn',39]];

  const GLOSSARY = [
    ['Lagna','The Ascendant: the sign rising on the eastern horizon at birth. It starts the 1st house.'],
    ['Rashi','A zodiac sign of 30 degrees. Also used for the sign the Moon is in.'],
    ['Bhava','A house, one of the 12 areas of life.'],
    ['Graha','A planet. In Vedic astrology, the nine grahas include Rahu and Ketu.'],
    ['Nakshatra','One of the 27 lunar mansions, each 13 degrees 20 minutes.'],
    ['Pada','A quarter of a nakshatra (3 degrees 20 minutes). Four padas fill a nakshatra.'],
    ['Dasha','A planetary period. Vimshottari runs 120 years in a fixed order.'],
    ['Antardasha','The sub-period inside a Dasha.'],
    ['Gochara','Transit: where the planets are now compared with the birth chart.'],
    ['Ayanamsa','The gap between the tropical and sidereal zodiacs, about 24 degrees today. Lahiri is the common one.'],
    ['Kendra','Angle houses: 1, 4, 7, 10.'],
    ['Trikona','Trine houses: 1, 5, 9. The luckiest houses.'],
    ['Dusthana','Difficult houses: 6, 8, 12.'],
    ['Upachaya','Growing houses: 3, 6, 10, 11. Hard planets do well here.'],
    ['Karaka','A natural significator: the planet that stands for a thing, such as Venus for love.'],
    ['Yogakaraka','A planet that owns both a Kendra and a Trikona for a given Lagna.'],
    ['Maraka','A death-inflicting planet or house: the 2nd and 7th and their lords. Read with care.'],
    ['Badhaka','The obstructing house and lord for the Lagna type.'],
    ['Combust (Asta)','A planet very close to the Sun, lost in its glare and weakened.'],
    ['Vakri','Retrograde: a planet seems to move backwards. It is strong in effort and turns things inward.'],
    ['Digbala','Directional strength: Jupiter and Mercury in the 1st, Sun and Mars in the 10th, Saturn in the 7th, Moon and Venus in the 4th.'],
    ['Shadbala','The six sources of planetary strength, counted in rupas.'],
    ['Ashtakavarga','A scoring system of points (bindus) given by each planet to each sign.'],
    ['Vargottama','A planet in the same sign in the Rashi chart and the Navamsa. A strong sign.'],
    ['Gandanta','The last and first degrees where a water sign meets a fire sign. A sensitive knot.'],
    ['Arudha','The image of a house: how it appears to the world.'],
    ['Atmakaraka','The planet with the highest degree in its sign, the soul significator in Jaimini astrology.'],
    ['Navamsa','The D9 chart: the ninth division. Shows marriage and the real strength of a planet.'],
    ['Muhurta','A chosen time for an act, or a division of the day of about 48 minutes.'],
    ['Panchanga','The five limbs of a day: tithi, vara, nakshatra, yoga and karana.'],
    ['Tithi','A lunar day, one thirtieth of the Moon\'s monthly cycle.'],
    ['Hora','A planetary hour. The first hora of a day belongs to the day lord.'],
    ['Choghadiya','A day split into eight parts, each named good or bad for a start.'],
    ['Sade Sati','Saturn\'s 7.5 year pass over the 12th, 1st and 2nd from the natal Moon sign.'],
    ['Dhaiya','Saturn in the 4th or 8th from the Moon sign: a 2.5 year test.'],
    ['Drishti','Aspect: the way a planet looks at a house or planet.'],
    ['Argala','Intervention: planets in the 2nd, 4th and 11th from a house that act on it.'],
    ['Neecha Bhanga','The cancelling of a planet\'s debilitation.'],
    ['Parivartana','Exchange of signs between two planets.'],
    ['Papakartari','A house or planet hemmed between two malefics.'],
    ['Shubhakartari','A house or planet hemmed between two benefics.'],
    ['Bhava Chalit','A chart that places planets in houses by house middle points, not by sign.'],
    ['Sandhi','A junction of signs or houses, where effects blend.'],
    ['Pushkara','Special degrees and Navamsas that carry nourishing, protective power.'],
    ['Panchang','Another spelling of Panchanga.'],
    ['Rahu and Ketu','The two lunar nodes. Shadow planets that make eclipses; always 180 degrees apart.']
  ];
  return { YOGA_CATS, YOGAS, REMEDIES, IN_HOUSE, ASHTAKOOTA, SCORES, BAD_TIMES, MUHURTA_NOTES, PANCHAKA, SADE, ASHTA, GLOSSARY };
})();
window.ATLAS_MORE = ATLAS_MORE;

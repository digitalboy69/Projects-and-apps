/* ============================================================================
   ASTRO ATLAS DATA: the classical reference facts (Parashara tradition), as plain data. No UI here.
   Used by js/131-astro-atlas.js. Where schools differ the entry says so.
   ============================================================================ */
const ATLAS = (function(){
  const T = s => s + '︎';                                    // force text (not emoji) glyphs
  const PL = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  const GL = { Sun:T('☉'), Moon:T('☽'), Mars:T('♂'), Mercury:T('☿'), Jupiter:T('♃'), Venus:T('♀'), Saturn:T('♄'), Rahu:T('☊'), Ketu:T('☋') };
  const COL = { Sun:'#f2a93b', Moon:'#cfd8e8', Mars:'#e5584b', Mercury:'#58c98a', Jupiter:'#f2cf6b', Venus:'#f08fbd', Saturn:'#7f93c9', Rahu:'#9b82d6', Ketu:'#c98a5e' };
  const SG = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'].map(T);

  /* ---- week: day order is the Chaldean order taken every third step ---- */
  const CHALDEAN = ['Saturn','Jupiter','Mars','Sun','Venus','Mercury','Moon'];            // slowest to fastest
  const DAYS = [
    { en:'Sunday',    sa:'Ravivara',    lord:'Sun',     deity:'Surya',                 good:'Leadership, authority, government matters, health and vitality',   avoid:'Starting quarrels with seniors' },
    { en:'Monday',    sa:'Somavara',    lord:'Moon',    deity:'Shiva and Parvati',     good:'Travel, public dealings, caring work, liquids and farming',        avoid:'Big decisions made on mood' },
    { en:'Tuesday',   sa:'Mangalavara', lord:'Mars',    deity:'Hanuman, Kartikeya',    good:'Courage, property, machines, sport and competition',               avoid:'Arguments and haste' },
    { en:'Wednesday', sa:'Budhavara',   lord:'Mercury', deity:'Vishnu',                good:'Study, writing, trade, contracts and communication',               avoid:'Signing without reading' },
    { en:'Thursday',  sa:'Guruvara',    lord:'Jupiter', deity:'Brihaspati, Dakshinamurthy', good:'Teaching, learning, ceremonies, advice, finance and children', avoid:'Cutting the elders short' },
    { en:'Friday',    sa:'Shukravara',  lord:'Venus',   deity:'Lakshmi, Devi',         good:'Love, arts, beauty, vehicles, luxury and partnership',              avoid:'Overspending' },
    { en:'Saturday',  sa:'Shanivara',   lord:'Saturn',  deity:'Shani, Hanuman',        good:'Hard work, long-term plans, service, discipline and iron or oil trades', avoid:'Rushing new risky ventures' }
  ];
  const RAHU_KALA = ['4:30 to 6:00 pm','7:30 to 9:00 am','3:00 to 4:30 pm','12:00 to 1:30 pm','1:30 to 3:00 pm','10:30 am to 12:00','9:00 to 10:30 am'];   // Sun..Sat, for a 6 am to 6 pm day

  /* ---- planets ---- */
  const P = {
    Sun:     { sa:'Surya',   gender:'Male',   nature:'Mild malefic', guna:'Sattva', dosha:'Pitta',         tattva:'Fire',   dir:'East',      color:'Copper red',   gem:'Ruby',           metal:'Gold, copper', taste:'Pungent',      season:'Grishma (summer)',      deity:'Shiva, Agni', mantra:'Om Suryaya Namah',     body:'Heart, bones, head, right eye',     karaka:'Soul, father, authority, government', exalt:['Aries',10],     debil:['Libra',10],      mt:['Leo','0 to 20'],        own:['Leo'],                  years:6,  speed:'About 1 degree a day',      period:'1 month in a sign' },
    Moon:    { sa:'Chandra', gender:'Female', nature:'Benefic when waxing', guna:'Sattva', dosha:'Vata and Kapha', tattva:'Water',  dir:'North-west',color:'White',        gem:'Pearl',          metal:'Silver',       taste:'Salty',        season:'Varsha (rains)',        deity:'Parvati, Gauri', mantra:'Om Chandraya Namah', body:'Blood and fluids, mind, left eye, breasts', karaka:'Mind, mother, emotions, public',  exalt:['Taurus',3],     debil:['Scorpio',3],     mt:['Taurus','4 to 30'],     own:['Cancer'],               years:10, speed:'About 13 degrees a day',    period:'2.25 days in a sign' },
    Mars:    { sa:'Mangala', gender:'Male',   nature:'Malefic',      guna:'Tamas',  dosha:'Pitta',         tattva:'Fire',   dir:'South',     color:'Red',          gem:'Red coral',      metal:'Copper',       taste:'Bitter',       season:'Grishma (summer)',      deity:'Hanuman, Kartikeya', mantra:'Om Angarakaya Namah', body:'Muscles, bone marrow, blood, bile', karaka:'Courage, siblings, land, energy',  exalt:['Capricorn',28], debil:['Cancer',28],     mt:['Aries','0 to 12'],      own:['Aries','Scorpio'],      years:7,  speed:'About half a degree a day', period:'About 45 days in a sign' },
    Mercury: { sa:'Budha',   gender:'Neutral',nature:'Benefic with benefics', guna:'Rajas', dosha:'All three (Tridosha)', tattva:'Earth', dir:'North', color:'Green',    gem:'Emerald',        metal:'Bronze, brass',taste:'Mixed',        season:'Sharad (autumn)',       deity:'Vishnu',      mantra:'Om Budhaya Namah',    body:'Skin, nerves, speech, hands',       karaka:'Intellect, speech, trade, learning',exalt:['Virgo',15],     debil:['Pisces',15],     mt:['Virgo','16 to 20'],     own:['Gemini','Virgo'],       years:17, speed:'About 1 degree a day',      period:'About 1 month in a sign' },
    Jupiter: { sa:'Guru',    gender:'Male',   nature:'Greatest benefic', guna:'Sattva', dosha:'Kapha',     tattva:'Ether',  dir:'North-east',color:'Yellow',       gem:'Yellow sapphire',metal:'Gold',         taste:'Sweet',        season:'Hemanta (pre-winter)',  deity:'Brihaspati, Dakshinamurthy', mantra:'Om Gurave Namah', body:'Fat, liver, thighs, hips',    karaka:'Wisdom, children, wealth, teacher', exalt:['Cancer',5],     debil:['Capricorn',5],   mt:['Sagittarius','0 to 10'],own:['Sagittarius','Pisces'], years:16, speed:'About 5 minutes a day',     period:'About 1 year in a sign' },
    Venus:   { sa:'Shukra',  gender:'Female', nature:'Benefic',      guna:'Rajas',  dosha:'Kapha and Vata',tattva:'Water',  dir:'South-east',color:'White, pink',  gem:'Diamond',        metal:'Silver, platinum', taste:'Sour',     season:'Vasanta (spring)',      deity:'Lakshmi',     mantra:'Om Shukraya Namah',   body:'Reproductive system, face, kidneys',karaka:'Spouse, love, arts, luxury, vehicles',exalt:['Pisces',27],    debil:['Virgo',27],      mt:['Libra','0 to 15'],      own:['Taurus','Libra'],       years:20, speed:'About 1 degree a day',      period:'About 1 month in a sign' },
    Saturn:  { sa:'Shani',   gender:'Neutral',nature:'Malefic',      guna:'Tamas',  dosha:'Vata',          tattva:'Air',    dir:'West',      color:'Black, dark blue', gem:'Blue sapphire', metal:'Iron',      taste:'Astringent',   season:'Shishira (winter)',     deity:'Shani, Hanuman', mantra:'Om Shanaishcharaya Namah', body:'Nerves, bones, knees, legs, teeth', karaka:'Karma, discipline, delay, long life',exalt:['Libra',20],     debil:['Aries',20],      mt:['Aquarius','0 to 20'],   own:['Capricorn','Aquarius'], years:19, speed:'About 2 minutes a day',     period:'About 2.5 years in a sign' },
    Rahu:    { sa:'Rahu',    gender:'Neutral',nature:'Malefic',      guna:'Tamas',  dosha:'Vata',          tattva:'Air',    dir:'South-west',color:'Smoky, dark',  gem:'Hessonite (gomed)', metal:'Lead, mixed', taste:'Sour',      season:'None of its own',       deity:'Durga',       mantra:'Om Rahave Namah',     body:'Skin, poison, nervous disorders',   karaka:'Foreign things, illusion, technology, obsession', exalt:['Taurus or Gemini (schools differ)',0], debil:['Scorpio or Sagittarius (schools differ)',0], mt:['Gemini (some schools)',''], own:['Aquarius (some schools)'], years:18, speed:'Moves backward, 3 minutes a day', period:'About 18 months in a sign' },
    Ketu:    { sa:'Ketu',    gender:'Neutral',nature:'Malefic',      guna:'Tamas',  dosha:'Pitta',         tattva:'Fire',   dir:'No fixed direction', color:'Grey, mixed', gem:"Cat's eye",  metal:'Mixed metals', taste:'Pungent',      season:'None of its own',       deity:'Ganesha',     mantra:'Om Ketave Namah',     body:'Nerves, wounds, hidden ailments',   karaka:'Detachment, past-life skill, moksha',exalt:['Scorpio or Sagittarius (schools differ)',0], debil:['Taurus or Gemini (schools differ)',0], mt:['Sagittarius (some schools)',''], own:['Scorpio (some schools)'], years:7,  speed:'Moves backward, 3 minutes a day', period:'About 18 months in a sign' }
  };

  /* ---- signs ---- */
  const ELEM = ['Fire','Earth','Air','Water'], QUAL = ['Movable (Chara)','Fixed (Sthira)','Dual (Dwiswabhava)'];
  const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const SIGN_SA = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrischika','Dhanu','Makara','Kumbha','Meena'];
  const SIGN_SYM = ['Ram','Bull','Twins','Crab','Lion','Maiden','Scales','Scorpion','Archer','Sea-goat','Water-bearer','Two fish'];
  const SIGN_LORD = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
  const SIGN_DIR = ['East','South','West','North','East','South','West','North','East','South','West','North'];
  const SIGN_BODY = ['Head and brain','Face, neck, throat','Shoulders, arms, lungs','Chest, breasts, stomach','Heart, upper back, spine','Intestines, digestion','Kidneys, lower back, skin','Reproductive organs','Hips and thighs','Knees, joints, bones','Calves, ankles, circulation','Feet'];
  const SIGN_RISE = ['Back first (Prishthodaya)','Back first (Prishthodaya)','Head first (Shirshodaya)','Back first (Prishthodaya)','Head first (Shirshodaya)','Head first (Shirshodaya)','Head first (Shirshodaya)','Head first (Shirshodaya)','Back first (Prishthodaya)','Back first (Prishthodaya)','Head first (Shirshodaya)','Both (Ubhayodaya)'];
  const SIGN_TRAIT = ['Pioneering, direct, quick to start','Steady, sensual, values security','Curious, talkative, adaptable','Nurturing, emotional, protective','Proud, warm, wants to lead','Careful, analytical, service-minded','Balanced, fair, relationship-minded','Intense, private, transformative','Hopeful, philosophical, freedom-loving','Disciplined, ambitious, patient','Independent, humane, unconventional','Dreamy, compassionate, spiritual'];
  const SIGNS = SIGN_NAMES.map((n, i) => ({ i, name:n, sa:SIGN_SA[i], glyph:SG[i], symbol:SIGN_SYM[i], lord:SIGN_LORD[i], element:ELEM[i % 4], quality:QUAL[i % 3], gender:i % 2 ? 'Female (even)' : 'Male (odd)', dir:SIGN_DIR[i], body:SIGN_BODY[i], rise:SIGN_RISE[i], trait:SIGN_TRAIT[i] }));

  /* ---- houses ---- */
  const HOUSES = [
    { n:1,  sa:'Tanu',    name:'Self',                  sig:'Body, looks, health, character, how you begin',            karaka:'Sun',      body:'Head' },
    { n:2,  sa:'Dhana',   name:'Wealth and family',     sig:'Money, speech, food, face, family you were born into',     karaka:'Jupiter',  body:'Face, mouth' },
    { n:3,  sa:'Sahaja',  name:'Courage and siblings',  sig:'Younger siblings, effort, skills, short travel, hobbies',   karaka:'Mars',     body:'Arms, shoulders' },
    { n:4,  sa:'Sukha',   name:'Home and peace',        sig:'Mother, home, land, vehicles, inner peace, early education', karaka:'Moon',     body:'Chest, heart' },
    { n:5,  sa:'Putra',   name:'Creativity and children', sig:'Children, intelligence, romance, past merit, mantra',      karaka:'Jupiter',  body:'Stomach' },
    { n:6,  sa:'Ari',     name:'Enemies and service',   sig:'Debts, disease, enemies, daily work, service, pets',        karaka:'Mars',     body:'Waist, intestines' },
    { n:7,  sa:'Kalatra', name:'Partnership',           sig:'Spouse, business partners, open enemies, travel abroad',    karaka:'Venus',    body:'Lower abdomen' },
    { n:8,  sa:'Ayu',     name:'Change and the hidden', sig:'Longevity, sudden events, inheritance, secrets, research',  karaka:'Saturn',   body:'Genitals' },
    { n:9,  sa:'Dharma',  name:'Luck and dharma',       sig:'Father, teacher, fortune, long journeys, belief, higher study', karaka:'Jupiter', body:'Thighs' },
    { n:10, sa:'Karma',   name:'Career and status',     sig:'Profession, public image, authority, action in the world',  karaka:'Sun, Mercury, Jupiter, Saturn', body:'Knees' },
    { n:11, sa:'Labha',   name:'Gains and friends',     sig:'Income, elder siblings, networks, fulfilled desires',       karaka:'Jupiter',  body:'Calves' },
    { n:12, sa:'Vyaya',   name:'Loss and release',      sig:'Expenses, foreign lands, sleep, isolation, moksha, hospitals', karaka:'Saturn',body:'Feet' }
  ];
  const HOUSE_KINDS = [
    { name:'Kendra',   sa:'Angles',            h:[1,4,7,10], note:'Pillars of the chart. Planets here act with force.' },
    { name:'Trikona',  sa:'Trines',            h:[1,5,9],    note:'Luck and merit. The most auspicious houses.' },
    { name:'Dusthana', sa:'Difficult',         h:[6,8,12],   note:'Struggle, loss and transformation.' },
    { name:'Upachaya', sa:'Growing',           h:[3,6,10,11],note:'Results improve with time; tough planets do well here.' },
    { name:'Maraka',   sa:'Death-inflicting',  h:[2,7],      note:'Linked with the end of a Dasha cycle of life. Read with care.' },
    { name:'Panaphara',sa:'Succeedent',        h:[2,5,8,11], note:'Houses that follow the angles and hold resources.' },
    { name:'Apoklima', sa:'Cadent',            h:[3,6,9,12], note:'Houses that fall away from the angles.' }
  ];
  const AIMS = [
    { name:'Dharma', sa:'Purpose',  h:[1,5,9],  color:'#f2cf6b' }, { name:'Artha', sa:'Wealth', h:[2,6,10], color:'#58c98a' },
    { name:'Kama',   sa:'Desire',   h:[3,7,11], color:'#f08fbd' }, { name:'Moksha', sa:'Release', h:[4,8,12], color:'#7f93c9' }
  ];

  /* ---- 27 nakshatras ---- */
  const NAK = [
    ['Ashwini','Ketu','Ashwini Kumaras','Horse head','Deva','Horse','Light (Kshipra)'], ['Bharani','Venus','Yama','Yoni','Manushya','Elephant','Fierce (Ugra)'], ['Krittika','Sun','Agni','Razor, flame','Rakshasa','Sheep','Mixed (Mishra)'],
    ['Rohini','Moon','Brahma (Prajapati)','Chariot','Manushya','Serpent','Fixed (Dhruva)'], ['Mrigashira','Mars','Soma','Deer head','Deva','Serpent','Soft (Mridu)'], ['Ardra','Rahu','Rudra','Teardrop','Manushya','Dog','Sharp (Tikshna)'],
    ['Punarvasu','Jupiter','Aditi','Bow and quiver','Deva','Cat','Movable (Chara)'], ['Pushya','Saturn','Brihaspati','Flower, udder','Deva','Sheep','Light (Kshipra)'], ['Ashlesha','Mercury','Nagas','Coiled serpent','Rakshasa','Cat','Sharp (Tikshna)'],
    ['Magha','Ketu','Pitris','Throne','Rakshasa','Rat','Fierce (Ugra)'], ['Purva Phalguni','Venus','Bhaga','Front of a bed','Manushya','Rat','Fierce (Ugra)'], ['Uttara Phalguni','Sun','Aryaman','Back of a bed','Manushya','Cow','Fixed (Dhruva)'],
    ['Hasta','Moon','Savitar','Hand','Deva','Buffalo','Light (Kshipra)'], ['Chitra','Mars','Tvashtar','Bright jewel','Rakshasa','Tiger','Soft (Mridu)'], ['Swati','Rahu','Vayu','Young shoot','Deva','Buffalo','Movable (Chara)'],
    ['Vishakha','Jupiter','Indra and Agni','Archway','Rakshasa','Tiger','Mixed (Mishra)'], ['Anuradha','Saturn','Mitra','Lotus','Deva','Deer','Soft (Mridu)'], ['Jyeshtha','Mercury','Indra','Earring, umbrella','Rakshasa','Deer','Sharp (Tikshna)'],
    ['Mula','Ketu','Nirriti','Bunch of roots','Rakshasa','Dog','Sharp (Tikshna)'], ['Purva Ashadha','Venus','Apas (Waters)','Winnowing fan','Manushya','Monkey','Fierce (Ugra)'], ['Uttara Ashadha','Sun','Vishvadevas','Elephant tusk','Manushya','Mongoose','Fixed (Dhruva)'],
    ['Shravana','Moon','Vishnu','Ear','Deva','Monkey','Movable (Chara)'], ['Dhanishta','Mars','Vasus','Drum','Rakshasa','Lion','Movable (Chara)'], ['Shatabhisha','Rahu','Varuna','Empty circle','Rakshasa','Horse','Movable (Chara)'],
    ['Purva Bhadrapada','Jupiter','Aja Ekapada','Front of a cot, sword','Manushya','Lion','Fierce (Ugra)'], ['Uttara Bhadrapada','Saturn','Ahir Budhnya','Back of a cot','Manushya','Cow','Fixed (Dhruva)'], ['Revati','Mercury','Pushan','Fish, drum','Deva','Elephant','Soft (Mridu)']
  ].map((a, i) => ({ i, name:a[0], lord:a[1], deity:a[2], symbol:a[3], gana:a[4], animal:a[5], nature:a[6], from:i * 360 / 27, sign:Math.floor(i * 360 / 27 / 30) }));

  /* ---- time ---- */
  const TITHI = [['Pratipada','Agni'],['Dwitiya','Brahma'],['Tritiya','Gauri'],['Chaturthi','Ganesha'],['Panchami','Naga'],['Shashthi','Kartikeya'],['Saptami','Surya'],['Ashtami','Shiva'],['Navami','Durga'],['Dashami','Yama'],['Ekadashi','Vishvadevas'],['Dwadashi','Vishnu'],['Trayodashi','Kamadeva'],['Chaturdashi','Shiva'],['Purnima','Chandra']];
  const TITHI_KIND = ['Nanda (joy)','Bhadra (good)','Jaya (victory)','Rikta (empty)','Purna (full)'];       // tithi 1,6,11 = Nanda ... cycles through five
  const YOGA = ['Vishkambha','Priti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma','Dhriti','Shula','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata','Variyana','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti'];
  const YOGA_BAD = ['Vishkambha','Atiganda','Shula','Ganda','Vyaghata','Vajra','Vyatipata','Parigha','Vaidhriti'];
  const KARANA = { moving:['Bava','Balava','Kaulava','Taitila','Gara','Vanija','Vishti (Bhadra)'], fixed:['Shakuni','Chatushpada','Naga','Kimstughna'] };
  const SEASONS = [
    { n:'Vasanta', en:'Spring',      months:'Mar to May', lord:'Venus' }, { n:'Grishma', en:'Summer',      months:'May to Jul', lord:'Sun and Mars' },
    { n:'Varsha',  en:'Rains',       months:'Jul to Sep', lord:'Moon' },  { n:'Sharad',  en:'Autumn',      months:'Sep to Nov', lord:'Mercury' },
    { n:'Hemanta', en:'Pre-winter',  months:'Nov to Jan', lord:'Jupiter' },{ n:'Shishira',en:'Winter',      months:'Jan to Mar', lord:'Saturn' }
  ];
  const DASHA_ORDER = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
  const DASHA_YEARS = { Ketu:7, Venus:20, Sun:6, Moon:10, Mars:7, Rahu:18, Jupiter:16, Saturn:19, Mercury:17 };
  const DASHA_LEVELS = ['Mahadasha','Antardasha','Pratyantardasha','Sookshma','Prana','Deha'];

  /* ---- rules ---- */
  // natural friendship (Naisargika): F friend, N neutral, E enemy. Row planet looks at column planet.
  const FRIEND = {
    Sun:    { Moon:'F', Mars:'F', Mercury:'N', Jupiter:'F', Venus:'E', Saturn:'E' },
    Moon:   { Sun:'F', Mars:'N', Mercury:'F', Jupiter:'N', Venus:'N', Saturn:'N' },
    Mars:   { Sun:'F', Moon:'F', Mercury:'E', Jupiter:'F', Venus:'N', Saturn:'N' },
    Mercury:{ Sun:'F', Moon:'E', Mars:'N', Jupiter:'N', Venus:'F', Saturn:'N' },
    Jupiter:{ Sun:'F', Moon:'F', Mars:'F', Mercury:'E', Venus:'E', Saturn:'N' },
    Venus:  { Sun:'E', Moon:'E', Mars:'N', Mercury:'F', Jupiter:'N', Saturn:'F' },
    Saturn: { Sun:'E', Moon:'E', Mars:'E', Mercury:'F', Jupiter:'N', Venus:'F' }
  };
  const NODE_FRIEND = { friends:['Mercury','Venus','Saturn'], neutral:['Jupiter'], enemies:['Sun','Moon','Mars'] };
  const ASPECTS = [ ['Sun','7th'], ['Moon','7th'], ['Mercury','7th'], ['Venus','7th'], ['Mars','4th, 7th, 8th'], ['Jupiter','5th, 7th, 9th'], ['Saturn','3rd, 7th, 10th'], ['Rahu and Ketu','5th, 7th, 9th (most teachers)'] ];
  const DIKBALA = [ { house:1, dir:'East',  planets:['Jupiter','Mercury'] }, { house:10, dir:'South', planets:['Sun','Mars'] }, { house:7, dir:'West', planets:['Saturn'] }, { house:4, dir:'North', planets:['Moon','Venus'] } ];
  const DIKPALA = [ ['East','Indra','Sun'], ['South-east','Agni','Venus'], ['South','Yama','Mars'], ['South-west','Nirriti','Rahu'], ['West','Varuna','Saturn'], ['North-west','Vayu','Moon'], ['North','Kubera','Mercury'], ['North-east','Ishana','Jupiter'] ];
  const GUNAS = { Sattva:['Sun','Moon','Jupiter'], Rajas:['Mercury','Venus'], Tamas:['Mars','Saturn','Rahu','Ketu'] };
  const DOSHAS = { Vata:['Saturn','Rahu','Mercury'], Pitta:['Sun','Mars','Ketu'], Kapha:['Jupiter','Moon','Venus'] };
  const TATTVAS = { Fire:['Sun','Mars'], Earth:['Mercury'], Air:['Saturn','Rahu'], Water:['Moon','Venus'], Ether:['Jupiter'] };

  /* ---- divisional charts ---- */
  const VARGAS = [
    ['D1','Rashi','The body and whole life'], ['D2','Hora','Wealth'], ['D3','Drekkana','Siblings and courage'], ['D4','Chaturthamsa','Home, property, fortune'],
    ['D7','Saptamsa','Children'], ['D9','Navamsa','Spouse, dharma, inner strength of planets'], ['D10','Dashamsa','Career and public life'], ['D12','Dwadashamsa','Parents'],
    ['D16','Shodashamsa','Vehicles and comforts'], ['D20','Vimshamsa','Worship and spiritual practice'], ['D24','Chaturvimshamsa','Education and learning'], ['D27','Bhamsa','Strengths and weaknesses'],
    ['D30','Trimshamsa','Troubles and misfortune'], ['D40','Khavedamsa','Maternal line, good and bad effects'], ['D45','Akshavedamsa','Paternal line, character'], ['D60','Shashtiamsa','Past-life karma, fine detail']
  ];
  return { PL, GL, COL, SG, CHALDEAN, DAYS, RAHU_KALA, P, SIGNS, ELEM, HOUSES, HOUSE_KINDS, AIMS, NAK, TITHI, TITHI_KIND, YOGA, YOGA_BAD, KARANA, SEASONS, DASHA_ORDER, DASHA_YEARS, DASHA_LEVELS, FRIEND, NODE_FRIEND, ASPECTS, DIKBALA, DIKPALA, GUNAS, DOSHAS, TATTVAS, VARGAS };
})();
window.ATLAS = ATLAS;

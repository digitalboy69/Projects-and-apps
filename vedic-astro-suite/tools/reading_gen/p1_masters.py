# ---------- MASTER TABLES (hand-written) ----------
PL = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']
SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
SIGN_LORD = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter']

PLANETS = {
 'Sun':    dict(sk='Surya',  nature='Natural malefic (hot, royal)', element='Fire', day='Sunday',    direction='East',       color='copper-red, gold', gem='ruby',            metal='gold / copper',
      signifies='soul, vitality, authority, father, government, confidence, leadership, status',
      body='heart, bones, spine, right eye, head', strong='clear purpose, good health, respect from authority', weak='ego clashes, low confidence, problems with father figures or authority'),
 'Moon':   dict(sk='Chandra',nature='Natural benefic (waxing) / mild malefic (waning, dark)', element='Water', day='Monday', direction='North-west', color='white, cream', gem='pearl', metal='silver',
      signifies='mind, emotions, mother, public, comfort, memory, nourishment, home',
      body='mind, blood and body fluids, chest, left eye, stomach', strong='emotional steadiness, popularity, good memory and sleep', weak='mood swings, worry, dependence on others for comfort'),
 'Mars':   dict(sk='Mangala',nature='Natural malefic (fiery, energetic)', element='Fire', day='Tuesday', direction='South', color='red', gem='red coral', metal='copper',
      signifies='energy, courage, action, siblings (younger), land and property, sports, surgery, defence',
      body='blood, muscles, bone marrow, head injuries, heat in the body', strong='stamina, courage, decisive action, winning competitions', weak='anger, accidents, haste, conflicts and inflammation'),
 'Mercury':dict(sk='Budha',  nature='Neutral, takes on the company it keeps', element='Earth', day='Wednesday', direction='North', color='green', gem='emerald', metal='brass / bronze',
      signifies='intellect, speech, writing, trade, analysis, skills, humour, youthful energy',
      body='nerves, skin, lungs, speech, hands', strong='quick learning, clear speech, business sense', weak='nervousness, scattered focus, anxiety, skin or nerve sensitivity'),
 'Jupiter':dict(sk='Guru (Brihaspati)', nature='Greatest natural benefic', element='Ether', day='Thursday', direction='North-east', color='yellow', gem='yellow sapphire', metal='gold',
      signifies='wisdom, teachers, children, fortune, faith, wealth, advice, expansion, dharma',
      body='liver, fat, thighs, hips, ears', strong='guidance, growth, protection and good judgment', weak='over-optimism, excess, missed chances, weight gain'),
 'Venus':  dict(sk='Shukra', nature='Natural benefic', element='Water', day='Friday', direction='South-east', color='white, pink', gem='diamond / white sapphire', metal='silver',
      signifies='love, marriage, comforts, art, beauty, vehicles, luxury, harmony, pleasure',
      body='kidneys, reproductive system, face, throat, skin glow', strong='charm, harmony, artistic gift, comfortable relationships', weak='indulgence, relationship friction, overspending on pleasure'),
 'Saturn': dict(sk='Shani',  nature='Natural malefic (cold, slow, disciplined)', element='Air', day='Saturday', direction='West', color='blue-black', gem='blue sapphire', metal='iron',
      signifies='discipline, karma, delay, hard work, service, longevity, sorrow and maturity, laborers',
      body='bones, joints, knees, teeth, nerves, chronic conditions', strong='lasting success through effort, patience, mature responsibility', weak='delays, burden, isolation, pessimism and chronic strain'),
 'Rahu':   dict(sk='Rahu (north node)', nature='Shadow planet, acts like a malefic (amplifier)', element='Air', day='Saturday', direction='South-west', color='smoky, dark blue', gem='hessonite (gomed)', metal='mixed metals',
      signifies='ambition, foreign things, technology, obsession, illusion, sudden rise, unconventional paths',
      body='nerves, skin, poisons and allergies, phobias', strong='bold rise, innovation, success through the unconventional', weak='confusion, craving, deception, restlessness'),
 'Ketu':   dict(sk='Ketu (south node)', nature='Shadow planet, acts like a malefic (detacher)', element='Fire', day='Tuesday', direction='', color='grey, multi-coloured', gem="cat's eye", metal='mixed metals',
      signifies='detachment, past-life skills, spirituality, intuition, research, liberation, loss of interest',
      body='nerves, wounds, mysterious or hard-to-diagnose ailments', strong='deep insight, healing, freedom from attachment', weak='withdrawal, scattered energy, sudden separations'),
}
PL_NOTE = 'Gem, metal, colour, day and direction are traditional associations given for reference; they are not medical or financial advice.'

HOUSES = [
 dict(n=1,  sk='Tanu bhava',     short='self, body and personality',               name='Self',            kind='Kendra, Trikona', body='head', karaka='Sun',
      rules='body, appearance, temperament, vitality, life direction, how the world first sees you', ask='How strong is the Lagna lord? Which planets sit in or aspect the 1st?'),
 dict(n=2,  sk='Dhana bhava',    short='money, speech and family',                 name='Wealth',          kind='Maraka (marak)',  body='face, mouth, right eye', karaka='Jupiter',
      rules='savings, income kept, speech, food, early family, values, eyes and face', ask='How does the 2nd lord sit? Is Jupiter supporting the house?'),
 dict(n=3,  sk='Sahaja bhava',   short='courage, effort and siblings',             name='Courage',         kind='Upachaya',        body='arms, shoulders, hands, ears', karaka='Mars',
      rules='initiative, courage, younger siblings, short journeys, skills, writing and communication', ask='Is Mars or the 3rd lord strong? Malefics here usually help.'),
 dict(n=4,  sk='Sukha bhava',    short='home, mother and inner peace',             name='Home',            kind='Kendra',          body='chest, heart region', karaka='Moon',
      rules='mother, home, property, vehicles, education base, inner happiness, roots', ask='How are the Moon and the 4th lord? Is the home life peaceful?'),
 dict(n=5,  sk='Putra bhava',    short='children, creativity and intelligence',    name='Children',        kind='Trikona',         body='stomach, upper abdomen', karaka='Jupiter',
      rules='children, creativity, romance, intelligence, mantra, past-life merit, speculation', ask='Where is Jupiter? What is the condition of the 5th lord?'),
 dict(n=6,  sk='Ari bhava',      short='work, service, health issues and rivals',  name='Service',         kind='Dusthana, Upachaya', body='intestines, digestion', karaka='Mars, Saturn',
      rules='daily work, service, debts, disease, enemies and competition, pets, discipline', ask='Malefics here fight problems well. Is the 6th lord placed in a dusthana?'),
 dict(n=7,  sk='Kalatra bhava',  short='marriage and partnerships',                name='Partnership',     kind='Kendra, Maraka',  body='lower abdomen, kidneys', karaka='Venus',
      rules='spouse, marriage, business partners, open dealings, the public you meet', ask='Venus, the 7th lord and aspects on the 7th together describe partnership.'),
 dict(n=8,  sk='Ayu bhava',      short='change, research and sudden events',       name='Transformation',  kind='Dusthana',        body='reproductive organs, excretory system', karaka='Saturn',
      rules='longevity, sudden change, hidden matters, research, inheritance, occult, in-laws money', ask='Is the 8th lord placed in a dusthana (Viparita pattern) or in a kendra?'),
 dict(n=9,  sk='Bhagya bhava',   short='luck, dharma and mentors',                 name='Fortune',         kind='Trikona',         body='thighs, hips', karaka='Jupiter, Sun',
      rules='fortune, father, teachers, higher learning, faith, long journeys, pilgrimage', ask='How placed are Jupiter and the 9th lord? Any benefic aspect on the 9th?'),
 dict(n=10, sk='Karma bhava',    short='career and public status',                 name='Career',          kind='Kendra, Upachaya', body='knees, joints', karaka='Sun, Mercury, Jupiter, Saturn',
      rules='career, authority, reputation, public actions, status, responsibilities', ask='Where is the 10th lord? Is Saturn or the Sun helping the house?'),
 dict(n=11, sk='Labha bhava',    short='gains, friends and ambitions',             name='Gains',           kind='Upachaya',        body='calves, ankles', karaka='Jupiter',
      rules='income and gains, friends, elder siblings, networks, fulfilment of desires', ask='Do planets in the 11th and its lord support steady income?'),
 dict(n=12, sk='Vyaya bhava',    short='losses, foreign lands and release',        name='Liberation',      kind='Dusthana',        body='feet, sleep, left eye', karaka='Saturn, Ketu',
      rules='expenses, foreign residence, isolation, sleep, hospitals, ashrams, spiritual liberation', ask='Is the 12th lord supported? Benefics here often show charity and spiritual growth.'),
]

SIGNS = [
 dict(sk='Mesha',      ruler='Mars',    element='Fire',  quality='Movable', gender='Male',   body='head, face',          style='bold, direct, pioneering',                       channel='initiative and direct action',       look='athletic, alert, strong brow',     rising='Quick, competitive and self-starting; acts first and thinks later. The Lagna lord Mars sets the pace.', moon='Feelings are fast and fiery; quick to react, quick to forgive. Needs action to feel settled.'),
 dict(sk='Vrishabha',  ruler='Venus',   element='Earth', quality='Fixed',   gender='Female', body='face, throat, neck',  style='steady, sensual, determined',                    channel='steadiness, resources and the senses', look='sturdy, pleasant face, strong neck', rising='Calm, patient and comfort-loving; slow to start but very hard to move. The Lagna lord Venus brings taste and charm.', moon='Exalted Moon: emotionally steady and loyal; security, food and comfort matter a lot.'),
 dict(sk='Mithuna',    ruler='Mercury', element='Air',   quality='Dual',    gender='Male',   body='shoulders, arms, lungs', style='curious, witty, adaptable',                    channel='ideas, speech and versatility',        look='slim, youthful, expressive hands', rising='Curious, talkative and quick; likes variety and learning. The Lagna lord Mercury keeps the mind busy.', moon='A restless, curious mind; feelings are processed by talking and learning. Needs mental stimulation.'),
 dict(sk='Karka',      ruler='Moon',    element='Water', quality='Movable', gender='Female', body='chest, stomach',       style='nurturing, emotional, protective',               channel='care, memory and belonging',           look='round face, soft features',       rising='Sensitive, caring and protective; strongly tied to home and family. The Lagna lord Moon makes moods visible.', moon='Own sign: deeply sensitive, nurturing and attached to home; strong memory and empathy.'),
 dict(sk='Simha',      ruler='Sun',     element='Fire',  quality='Fixed',   gender='Male',   body='heart, spine',         style='proud, generous, commanding',                    channel='leadership and creative self-expression', look='regal bearing, strong frame, thick hair', rising='Confident, warm and dignified; needs to be respected and to lead. The Lagna lord Sun gives presence.', moon='A proud, warm heart; needs appreciation and a stage. Generous and loyal when respected.'),
 dict(sk='Kanya',      ruler='Mercury', element='Earth', quality='Dual',    gender='Female', body='intestines, digestion', style='analytical, practical, perfectionist',        channel='detail, service and improvement',      look='neat, modest, youthful look',      rising='Practical, observant and modest; notices every detail and wants to be useful. The Lagna lord Mercury sharpens the mind.', moon='A careful, analytical mind; feelings are managed through routine and usefulness. Prone to worry.'),
 dict(sk='Tula',       ruler='Venus',   element='Air',   quality='Movable', gender='Male',   body='kidneys, lower back',  style='charming, fair-minded, partnership-focused',     channel='balance, relationships and aesthetics', look='pleasing face, graceful movement', rising='Gracious, fair-minded and sociable; seeks balance and company. The Lagna lord Venus gives charm.', moon='Feelings need harmony and company; dislikes conflict, weighs everything before deciding.'),
 dict(sk='Vrischika',  ruler='Mars',    element='Water', quality='Fixed',   gender='Female', body='reproductive organs', style='intense, private, transformative',               channel='depth, focus and hidden strength',     look='magnetic eyes, intense presence',  rising='Intense, private and determined; deep emotions kept under control. The Lagna lord Mars gives endurance.', moon='Debilitated Moon: very deep, intense feelings; loyal but secretive. Emotional growth comes through transformation.'),
 dict(sk='Dhanu',      ruler='Jupiter', element='Fire',  quality='Dual',    gender='Male',   body='thighs, hips',         style='optimistic, freedom-loving, philosophical',      channel='belief, exploration and teaching',     look='tall, open, friendly face',        rising='Optimistic, honest and freedom-loving; looks for meaning and adventure. The Lagna lord Jupiter brings goodwill.', moon='An optimistic, restless heart; needs freedom, faith and movement to feel well.'),
 dict(sk='Makara',     ruler='Saturn',  element='Earth', quality='Movable', gender='Female', body='knees, bones',         style='disciplined, ambitious, patient',                channel='structure, responsibility and long-term effort', look='lean, bony, serious look', rising='Serious, ambitious and responsible; matures early and builds step by step. The Lagna lord Saturn rewards patience.', moon='Reserved feelings; seeks security through achievement and duty. Slow to open up.'),
 dict(sk='Kumbha',     ruler='Saturn',  element='Air',   quality='Fixed',   gender='Male',   body='calves, ankles',       style='original, humanitarian, independent',            channel='ideas, community and unconventional thinking', look='tall, distinctive, friendly eyes', rising='Independent, original and friendly yet detached; thinks of the group. The Lagna lord Saturn adds discipline.', moon='A detached, thoughtful heart; values friends and ideals; needs space and intellectual freedom.'),
 dict(sk='Meena',      ruler='Jupiter', element='Water', quality='Dual',    gender='Female', body='feet',                 style='compassionate, intuitive, dreamy',               channel='intuition, compassion and imagination', look='soft eyes, gentle expression',   rising='Gentle, imaginative and compassionate; absorbs the mood around. The Lagna lord Jupiter brings faith and kindness.', moon='Highly intuitive and compassionate; absorbs others\' feelings. Needs quiet, art or devotion to recharge.'),
]

# short per-planet vocabulary used by the rule-based tables
GIFT = {  # what the planet tends to bring to an area when well placed / what it risks when strained
 'Sun':('confidence, authority and clarity','ego friction, pride and heat'),
 'Moon':('care, adaptability and public support','mood swings, worry and dependence'),
 'Mars':('drive, courage and protection','conflict, haste and injury'),
 'Mercury':('intelligence, communication and skill','overthinking and scattered effort'),
 'Jupiter':('growth, guidance and protection','excess, complacency and over-promising'),
 'Venus':('harmony, affection and comfort','indulgence and relationship friction'),
 'Saturn':('discipline, durability and maturity','delay, restriction and heaviness'),
 'Rahu':('ambition, innovation and unusual openings','obsession, confusion and shortcuts'),
 'Ketu':('insight, detachment and sharp intuition','withdrawal and loss of interest'),
}
VERB = {'Sun':'illuminates and tests','Moon':'softens and sensitises','Mars':'energises and provokes','Mercury':'analyses and informs','Jupiter':'expands and protects',
        'Venus':'harmonises and attracts','Saturn':'restrains and matures','Rahu':'amplifies and distorts','Ketu':'detaches and sharpens'}
DRIVE = {'Sun':'confidence and need for recognition','Moon':'feelings and need for security','Mars':'energy and courage','Mercury':'thinking and communication',
         'Jupiter':'wisdom and optimism','Venus':'affection and sense of beauty','Saturn':'discipline and sense of duty','Rahu':'ambition and hunger for the new','Ketu':'detachment and inner knowing'}
# natural relationships (same as the app's NATURAL_RELATIONS; nodes follow the commonly used scheme)
REL = {
 'Sun':    dict(friends=['Moon','Mars','Jupiter'], enemies=['Venus','Saturn'], neutrals=['Mercury']),
 'Moon':   dict(friends=['Sun','Mercury'], enemies=[], neutrals=['Mars','Jupiter','Venus','Saturn']),
 'Mars':   dict(friends=['Sun','Moon','Jupiter'], enemies=['Mercury'], neutrals=['Venus','Saturn']),
 'Mercury':dict(friends=['Sun','Venus'], enemies=['Moon'], neutrals=['Mars','Jupiter','Saturn']),
 'Jupiter':dict(friends=['Sun','Moon','Mars'], enemies=['Mercury','Venus'], neutrals=['Saturn']),
 'Venus':  dict(friends=['Mercury','Saturn'], enemies=['Sun','Moon'], neutrals=['Mars','Jupiter']),
 'Saturn': dict(friends=['Mercury','Venus'], enemies=['Sun','Moon','Mars'], neutrals=['Jupiter']),
 'Rahu':   dict(friends=['Mercury','Venus','Saturn'], enemies=['Sun','Moon','Mars'], neutrals=['Jupiter']),
 'Ketu':   dict(friends=['Mars','Venus','Saturn'], enemies=['Sun','Moon'], neutrals=['Mercury','Jupiter']),
}
# dignity table (same as the app: exaltation sign index, own signs, moolatrikona sign)
EXALT = {'Sun':0,'Moon':1,'Mars':9,'Mercury':5,'Jupiter':3,'Venus':11,'Saturn':6,'Rahu':1,'Ketu':7}
OWN = {'Sun':[4],'Moon':[3],'Mars':[0,7],'Mercury':[2,5],'Jupiter':[8,11],'Venus':[1,6],'Saturn':[9,10],'Rahu':[],'Ketu':[]}
MOOLA = {'Sun':4,'Moon':1,'Mars':0,'Mercury':5,'Jupiter':8,'Venus':6,'Saturn':10}

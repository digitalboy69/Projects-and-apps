/* ============================================================================
   LIFE-EVENT CATALOG (global LEC) — 240+ everyday events for the Life-Event Checker
   Each event: id, emoji, label, plain (one simple sentence), p = primary houses, s = secondary houses,
   k = natural significator planets, sh = how exactly a person can date it (3 = to the day, 2 = to a few weeks,
   1 = a phase / gradual), n = 1 for hard/negative events (shown with a soft tag only; same scoring).
   Browse views: by life area (house), by planet (first significator), by sign (natural zodiac: sign N = house N).
   The 10 original ids (marriage, child, career, edu, foreign, property, gain, father, mother, health) keep
   their original houses so saved events still work.
   Row format: 'emoji|id|label|plain|primary houses|secondary houses|planets|sharpness[|n]'
   Loaded after 26-rectification-studio.js (RS_CATS) and 30-life-event-checker.js; used by 98-life-event-engine.js.
   ============================================================================ */
const LEC_HOUSES = [
  { h:1,  name:'Self & body',            plain:'You, your body, looks, health basics, new beginnings',  sign:0,  signWords:'self, courage, fresh starts' },
  { h:2,  name:'Money & family',         plain:'Income, savings, food, speech, close family',            sign:1,  signWords:'money, values, comfort' },
  { h:3,  name:'Skills & siblings',      plain:'Effort, courage, younger siblings, short trips, media',  sign:2,  signWords:'skills, talk, short trips' },
  { h:4,  name:'Home & mother',          plain:'House, land, vehicles, mother, school, inner peace',     sign:3,  signWords:'home, mother, feelings' },
  { h:5,  name:'Children & romance',     plain:'Kids, love affairs, exams, creativity, risk-taking',     sign:4,  signWords:'children, romance, talent' },
  { h:6,  name:'Work, health & debts',   plain:'Daily job, illness, loans, rivals, legal fights',        sign:5,  signWords:'service, health, problems' },
  { h:7,  name:'Partners & deals',       plain:'Marriage, partners, clients, contracts, public dealings',sign:6,  signWords:'partners, deals, balance' },
  { h:8,  name:'Sudden change',          plain:'Surgery, accidents, inheritance, shocks, deep change',   sign:7,  signWords:'crisis, rebirth, secrets' },
  { h:9,  name:'Luck, father & travel',  plain:'Fortune, father, teachers, long journeys, higher study', sign:8,  signWords:'luck, wisdom, long journeys' },
  { h:10, name:'Career & status',        plain:'Profession, promotions, reputation, authority',          sign:9,  signWords:'career, status, duty' },
  { h:11, name:'Gains & friends',        plain:'Profits, friends, networks, elder siblings, wishes',     sign:10, signWords:'gains, friends, goals' },
  { h:12, name:'Foreign & endings',      plain:'Living abroad, expenses, hospital, solitude, spirit',    sign:11, signWords:'loss, foreign lands, spirit' }
];
const LEC_PLANETS = {
  Sun:    { icon:'☀️', name:'Sun',     plain:'Authority, father, government, self-respect' },
  Moon:   { icon:'🌙', name:'Moon',    plain:'Mind, mother, home feelings, the public' },
  Mars:   { icon:'🔥', name:'Mars',    plain:'Energy, property, surgery, siblings, accidents' },
  Mercury:{ icon:'💬', name:'Mercury', plain:'Talk, study, business, writing, trade' },
  Jupiter:{ icon:'🌟', name:'Jupiter', plain:'Growth, children, teachers, money, luck' },
  Venus:  { icon:'💖', name:'Venus',   plain:'Love, comfort, luxury, arts, vehicles' },
  Saturn: { icon:'⛓️', name:'Saturn',  plain:'Delay, hard work, service, loss, long-term' },
  Rahu:   { icon:'🌀', name:'Rahu',    plain:'Foreign, sudden, ambition, technology' },
  Ketu:   { icon:'🪔', name:'Ketu',    plain:'Letting go, spirit, cuts, detachment' }
};
const LEC_SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

const LEC_RAW = [
/* ---- 1st house: self, body, new beginnings ---- */
'🌱|freshstart|Began a brand-new phase of life|A clear "before and after" moment in your own life|1|10,3|Sun|2',
'💪|fitness|Started serious fitness or sport|Joined a gym, a team or began regular training|1|3,6|Mars|2',
'🏆|personalwin|Won a personal title or first prize|You personally came first in something|1,10|11|Sun|3',
'🤕|bodyinjury|Injury to head or body|An accident that hurt your body|1,8|6,12|Mars,Saturn|3|1',
'🩹|fullrecovery|Recovered fully from a long illness|Health returned after a long bad patch|1|6,11|Sun,Jupiter|2',
'🧠|confidence|Big jump in confidence|Suddenly felt bold and sure of yourself|1|3,5|Sun,Mars|1',
'💇|newlook|Big change in looks, weight or style|People noticed you look very different|1|2,7|Venus|2',
'📛|namechange|Changed name or title|Legally or socially took a new name|1,2|3,8|Mercury,Rahu|3',
'🦸|leader|Became a leader or captain|Put in charge of a group, team or class|1,10|11,3|Sun,Mars|2',
'😔|lowphase|A phase of low energy or self-doubt|Months of feeling flat or lost|1,12|8|Moon,Saturn|1|1',
'🚀|ownlaunch|Launched your own project or brand|Put your own name on a new thing|1,10|3,7|Sun,Mercury|3',
'🧬|healthturn|Began a lifestyle or health turnaround|Changed diet, sleep or habits for good|1,6|11|Mars,Sun|2',
'🎭|stagedebut|First time in the public spotlight|First stage, screen or big audience moment|1,5|10,3|Sun,Venus|3',
'🧗|challenge|Took on a big personal challenge|Trek, marathon, exam of the body or nerve|1,3|6|Mars|2',
'🛡️|selfreliance|Became fully independent|Started standing on your own feet|1|3,10|Sun,Saturn|1',
'🔄|lifepivot|Total life direction change|Dropped the old path and chose a new one|1,10|8,9|Rahu,Saturn|2',
'🪪|identitydoc|Got a major ID or citizenship paper|Passport, citizenship or major identity document|1,3|12,9|Rahu,Mercury|3',
'🌞|famouslocal|Became known in your circle|Noticed and respected in your area or community|1,11|10|Sun|1',
'🧴|skinhair|Skin, hair or appearance treatment|Medical or cosmetic work on your looks|1|6,2|Venus,Mars|2',
'🎯|goalset|Set and started a life goal|Wrote it down and began moving toward it|1,11|10,5|Sun,Jupiter|1',
/* ---- 2nd house: money, family, speech ---- */
'💵|salary|First salary or big pay rise|Money coming in grew noticeably|2,11|10|Jupiter,Mercury|3',
'🏦|savings|Built big savings or began investing|Started saving seriously or opened an investment|2|11|Jupiter,Venus|2',
'💍|jewellery|Received gold, jewellery or family wealth|Gold or valuables came to you|2|8,11|Jupiter,Venus|3',
'🗣️|speaking|Success with voice, speech or singing|Your voice or talk won you praise or work|2,3|5|Mercury,Venus|2',
'🍽️|foodbiz|Started a food or catering business|Restaurant, cloud kitchen, tiffin, catering|2|7,10|Venus,Moon|3',
'👪|familyjoin|New member joined the family|In-law, adoption or relative came to live with you|2|7,5|Jupiter|2',
'💸|moneyloss|Major money loss, theft or fraud|Lost a large amount of money|2,12|6,8|Saturn,Rahu|3|1',
'🧓|familyfight|Family dispute or property-split talk|Serious quarrel inside the family|2|4,8|Mars,Saturn|2|1',
'🦷|faceeye|Dental, eye or face treatment|Teeth, eyes or face needed medical care|2|12,6|Venus,Sun|2|1',
'📈|shares|Gains from shares or trading|Money made from market investments|2,11|5,8|Mercury,Rahu|3',
'🏭|familybiz|Joined the family business|Took a role in the business your family runs|2,10|4|Sun,Jupiter|2',
'🧮|stable|Became financially stable|Money worries finally eased|2,11|9|Jupiter,Venus|1',
'🌐|language|Learned a new language or voice skill|Fluent or certified in something spoken|2,3||Mercury|1',
'🏧|bankacct|Opened a major account or fixed deposit|Large formal money step like FD, trust or business account|2||Jupiter,Mercury|3',
'🎁|giftmoney|Received a big gift of money|Relatives or well-wishers gave you funds|2,11|5|Jupiter|3',
'🥘|diet|Big change in food habits|Became vegetarian, vegan or changed diet fully|2|6,1|Venus,Moon|2',
'🧾|budgetcrisis|Money tight for a long time|A season of constant cash shortage|2,6|12,8|Saturn|1|1',
'📣|ownvoice|Started a talking-based income|Teaching, anchoring, podcast, coaching income|2,3|10,11|Mercury,Jupiter|2',
'🪙|familywealth|Family fortune improved|Parents or family became wealthier|2,9|11|Jupiter|1',
'👶|babyname|Naming ceremony / family function at home|A big family function was held|2,4|5|Moon,Jupiter|3',
/* ---- 3rd house: skills, siblings, courage, media ---- */
'👦|sibbirth|Younger brother or sister born|A younger sibling arrived|3|5,11|Mars|3',
'💒|sibmarry|Sibling got married|A brother or sister’s wedding|3,11|7|Mars,Venus|3',
'⚡|sibfight|Conflict with sibling|Serious fight or break with a brother/sister|3|8,6|Mars|2|1',
'🕊️|sibloss|Loss or serious illness of a sibling|A brother or sister fell very ill or passed away|3,8|12|Mars,Saturn|3|1',
'✍️|writing|Started writing or blogging|First articles, blog or channel posts|3|5,11|Mercury|2',
'📚|bookpub|Published an article or book|Your writing was printed or released|3,5|9,11|Mercury,Jupiter|3',
'📱|viral|Social media growth or went viral|Followers or views jumped|3,11|5,1|Mercury,Rahu|2',
'💻|gadget|Bought laptop, phone or key gadget|A major device purchase|3|4,11|Mercury,Rahu|3',
'🚌|shorttrip|Short trips became frequent|Many short journeys for work or family|3|9,12|Mercury,Moon|1',
'🥇|sportwin|Won in sport or competition|Medal, match win or tournament success|3,1|5,6|Mars|3',
'🎓|skillcourse|Completed a skill course or certificate|Finished a short course or training|3,5|4,9|Mercury|3',
'🛒|salessucc|Sales or marketing success|Closed a big sale or ran a winning campaign|3,11|7,10|Mercury,Mars|2',
'✋|handinjury|Hand, arm or shoulder injury|Hurt your hand, arm, shoulder or ear|3|6,8|Mars|3|1',
'🏘️|neighbour|Dispute or change with neighbours|Trouble or help from people next door|3|4,6|Mars,Mercury|2',
'🎬|mediadebut|Media, film or acting debut|First time in a film, ad, show or publication|3,5|10,1|Mercury,Venus|3',
'🥋|martial|Started martial arts or defence training|Karate, boxing, military-style training|3,1|6|Mars|2',
'📷|photovideo|Started photography, video or design work|Began making visual content|3,5|2,11|Mercury,Venus|2',
'📨|negotiation|Won an important negotiation|Talked your way to a good deal|3,7|2,11|Mercury|2',
'💪|bravemove|Did something very brave|Took a bold risk that needed courage|3|1,10|Mars|2',
'🛵|commute|Started a daily travelling routine|Long daily commute or frequent travelling job|3|6,10|Mercury,Moon|1',
/* ---- 4th house: home, mother, vehicle, peace ---- */
'🏠|property|Bought a house, flat or vehicle|A major property or vehicle purchase|4|2,11|Mars,Venus|3',
'🔑|newhome|Moved into a new home|Shifted your main residence|4|12,3|Moon,Mars|3',
'🧱|renovation|Built or renovated your home|Construction, interiors or major repairs|4|2,11|Mars,Venus|2',
'🌾|land|Bought land or agricultural property|Plot, farm or land purchase|4|2,11|Mars|3',
'🚗|car|Bought a car|Four-wheeler purchase|4|2,11|Venus|3',
'🏍️|twowheeler|Bought a bike or scooter|Two-wheeler purchase|4|3,11|Mars,Venus|3',
'👩|mother|Mother: major event|Mother had a big life event or illness|4|8,10|Moon|3',
'🩺|motherill|Mother’s illness or surgery|Mother needed treatment or an operation|4,6|8|Moon,Saturn|3|1',
'🕯️|motherloss|Loss of mother|Mother passed away|4,8|12|Moon,Saturn|3|1',
'🎓|edu|Higher education started or finished|College, degree or major study milestone|4,9|5|Jupiter,Mercury|3',
'🏫|schoolfinish|Finished school (10th / 12th)|Board exams or school completion|4,5|9|Mercury,Moon|3',
'🏛️|collegeadmit|Admission to college|Got a seat in college or university|4,5|9|Mercury,Jupiter|3',
'😌|peacelost|Lost peace of mind at home|Long tension or unrest at home|4|8,12|Moon,Saturn|1|1',
'💔|breakdown|Emotional breakdown or heavy stress|A very hard emotional period|4|5,12|Moon,Saturn|2|1',
'📦|sellhome|Sold a house or property|Sale of a home or land|4|2,12|Mars,Saturn|3',
'🏘️|rented|Rented a new place|Started living in a rented home|4|12,3|Moon|3',
'💳|homeloan|Took a home loan|Started a large housing EMI|4,6|2|Mars,Saturn|3',
'🧑‍🏫|teachjob|Started teaching at school level|Began work as a school teacher|4,5|10,3|Moon,Mercury|3',
'🫀|heartissue|Heart or chest health problem|Chest, heart or lung trouble|4|6,8|Moon,Sun|2|1',
'🏡|homecoming|Came back to the home town|Returned home after living away|4|12|Moon|3',
/* ---- 5th house: children, romance, exams, creativity ---- */
'👶|child|Child born|A baby was born to you|5|2,9,11|Jupiter|3',
'🤰|pregnancy|Pregnancy confirmed|You learned a baby was on the way|5|2,11|Jupiter,Moon|3',
'💔|miscarry|Pregnancy loss|A pregnancy ended early|5,8|12,6|Moon,Saturn|3|1',
'👧|secondchild|Second child born|Another baby arrived|5|2,11|Jupiter|3',
'🎒|childschool|Child achievement or admission|Your child did well or started a new school|5|4,9|Jupiter,Mercury|2',
'👰|childmarry|Child’s marriage|Your son or daughter got married|5,7|9|Jupiter,Venus|3',
'🧒|childhealth|Child’s health problem|Your child had a serious health scare|5,6|8|Jupiter,Mars|2|1',
'❤️|fallinlove|Fell in love|A strong romantic attachment began|5|7,11|Venus|2',
'🌹|firstlove|First romantic relationship|Your very first serious relationship|5,7|11|Venus|2',
'💘|lovemarriage|Love turned into marriage decision|You both decided to marry out of love|5,7|11|Venus,Rahu|3',
'💔|breakup|Break-up of a relationship|A romantic relationship ended|5,7|12,8|Venus,Saturn|3|1',
'📝|examclear|Cleared an important exam|Passed a key or competitive exam|5|9,6|Mercury,Jupiter|3',
'🏅|rank|Top rank or scholarship in studies|Excellent result or scholarship award|5,9|11|Jupiter,Mercury|3',
'🧪|research|Research or project success|A thesis, invention or project worked|5|8,9|Mercury,Jupiter|2',
'🎨|creative|Creative breakthrough|Art, music, film or design got noticed|5|3,11|Venus,Moon|2',
'🏆|contest|Won a contest or talent show|Public competition win|5|1,3|Venus,Sun|3',
'🎰|speculative|Gain from lottery or speculation|Luck-based money gain|5,11|2,8|Jupiter,Rahu|3',
'📉|spectrade|Loss in speculation or trading|Money lost in luck-based risk|5,12|8,2|Rahu,Saturn|3|1',
'🕉️|mantra|Received a mantra or initiation|Spiritual teaching given to you|5,9|12|Jupiter|3',
'🍼|adoption|Adopted a child|Legally welcomed an adopted child|5|2,11|Jupiter,Moon|3',
/* ---- 6th house: job, illness, debts, rivals ---- */
'💼|career|Job start or promotion|A new job or a step up at work|10|6,11|Sun,Saturn|3',
'📬|joboffer|Received a job offer|Got an offer letter|6,10|11|Saturn,Mercury|3',
'📤|joblost|Lost a job|Laid off, fired or contract ended|6,8,12|10|Saturn,Rahu|3|1',
'🤝|bossclash|Conflict with boss or colleague|Serious friction at work|6|10,8|Mars,Saturn|2|1',
'😮‍💨|burnout|Work stress or burnout|Long heavy work pressure|6,10|8,12|Saturn,Mars|1|1',
'💳|loantaken|Took a big loan|A large borrowing began|6|2,12|Saturn|3|1',
'✅|loancleared|Cleared a loan|Finished repaying a big debt|6,11|2|Jupiter,Saturn|3',
'⚖️|lawstart|Legal case started against or by you|A court or legal fight began|6|7,8|Mars,Saturn|3|1',
'🏛️|lawwon|Won a legal case|The verdict went your way|6,9|11,10|Mars,Jupiter|3',
'🥊|rivalbeat|Defeated a rival or competitor|Overcame an opponent|6|3,11|Mars|2',
'🤒|health|Fell seriously ill or needed surgery|A real illness or an operation|6,8|1,12|Mars,Saturn|3|1',
'🏥|hospital|Hospital admission|Stayed in hospital|6,8,12|1|Mars,Saturn|3|1',
'🩸|chronic|Chronic condition diagnosed|Long-term health condition identified|6,8|1|Saturn|3|1',
'💊|treatment|Started a long treatment or therapy|Medical or alternative treatment began|6|1,8|Mars,Mercury|2',
'🐕|pet|Got or lost a pet|A pet joined or left your life|6|5,4|Mercury,Moon|3',
'🛠️|servicejob|Joined service / support / NGO work|Began a helping or service-based role|6|10,12|Saturn,Moon|2',
'🪖|uniform|Joined army, police or uniformed service|Started in a uniformed or force job|6,10|3,1|Mars,Sun|3',
'🧾|taxissue|Tax, audit or official notice trouble|Authorities questioned your accounts|6,8|2,10|Saturn,Rahu|2|1',
'🔪|betrayed|Betrayed by colleague or friend|Trust broken by someone close at work|6,8|7,11|Rahu,Saturn|2|1',
'🌙|nightshift|Started night shifts or odd hours|Work schedule turned upside down|6,12|10|Saturn,Moon|2',
/* ---- 7th house: marriage, partners, contracts ---- */
'💍|marriage|Marriage or partnership|Wedding or formal long-term commitment|7|2,11|Venus|3',
'💐|engaged|Engagement or betrothal|Formally promised to marry|7|5,11|Venus,Jupiter|3',
'👀|metspouse|Met your future partner|First meeting with the person you later married|7|5,11|Venus|3',
'🏘️|livein|Started living together|Moved in with a partner without or before marriage|7|4,5|Venus,Moon|3',
'📜|divorce|Divorce or legal separation|A marriage ended in law|7,8|6,12|Saturn,Mars|3|1',
'🚪|separation|Separation or partner moved away|You and your partner lived apart|7,12|8|Saturn,Rahu|2|1',
'🛏️|spouseill|Spouse’s illness|Partner had serious health trouble|7,6|8|Venus,Saturn|2|1',
'📈|spouserise|Spouse’s career rise|Partner got a big promotion or success|7,10|11|Venus,Jupiter|2',
'🔁|remarry|Second marriage or remarriage|Married again|7|2,11|Venus,Rahu|3',
'🤝|bizpartner|Started a business partnership|Joined or formed a partner-based venture|7|10,11|Mercury,Venus|3',
'🔚|partnerend|Business partnership ended|Parted ways with a business partner|7,8|12,6|Saturn,Rahu|3|1',
'🧑‍💼|bigclient|Signed a very big client or contract|A large customer or deal came in|7,10|11|Mercury,Venus|3',
'🖋️|contract|Signed an important legal agreement|Contract, MOU or formal deal|7|10,9|Mercury|3',
'🌍|publicsucc|Won public attention and approval|People at large noticed and liked your work|7,10|11|Venus,Sun|2',
'💞|arranged|Marriage proposals started coming|Family began serious match-making|7|2,5|Venus,Jupiter|2',
'🔥|exreturn|Old partner came back|Reunion with a former partner|7,5|12|Venus,Rahu|2',
'🛫|spouseabroad|Spouse from or moved abroad|Partner linked to a foreign place|7,12|9|Rahu,Venus|3',
'🧑‍⚖️|spouselaw|Legal fight with partner|Court or lawyer matters with a spouse or partner|7,6|8|Mars,Saturn|3|1',
'🛍️|customers|Customer base grew|Business or practice got many more clients|7,11|10|Mercury,Venus|1',
'🌉|longdistance|Long-distance relationship began|Love or marriage across places|7,12|3|Venus,Rahu|1',
/* ---- 8th house: sudden change, inheritance, surgery, shocks ---- */
'🔪|surgery|Surgery or operation|A planned or emergency operation|8|6,1|Mars,Saturn|3|1',
'🚑|accident|Serious accident|A major accident with real harm|8|1,6|Mars,Rahu|3|1',
'😮|nearmiss|Near-death or narrow escape|Came very close to danger and survived|8,1|12|Mars,Ketu|3|1',
'⚡|shock|Sudden shock or reversal|Life flipped suddenly overnight|8|12,1|Rahu,Saturn|3|1',
'🎉|windfall|Sudden windfall|Unexpected money arrived|8,11|2,5|Rahu,Jupiter|3',
'📜|inherit|Received inheritance|Property or money came from a family elder|8,2|4,11|Saturn,Jupiter|3',
'🛡️|insurance|Insurance claim or payout|Received insurance money|8|2,6|Saturn,Mercury|3',
'🕊️|grandloss|Death of grandparent or elder|An elder in the family passed away|8,4|9|Saturn,Moon|3|1',
'🕯️|relloss|Death of a close relative|A relative close to you passed away|8|12,4|Saturn,Ketu|3|1',
'😢|friendloss|Death of a close friend|A friend passed away|8,11|12|Saturn,Ketu|3|1',
'🔮|occultstudy|Began astrology, occult or deep research|Started studying hidden or mystical subjects|8|9,12|Ketu,Rahu|2',
'🌪️|crisis|Crisis that changed you|Hard time that rebuilt your outlook|8|1,12|Saturn,Ketu|2|1',
'🗞️|scandal|Scandal or false accusation|Name dragged into trouble|8|10,6|Rahu,Mars|2|1',
'🤫|secret|Secret revealed|Hidden matter came to light|8|12,3|Rahu,Mercury|3|1',
'🚛|suddentransfer|Sudden transfer or relocation|Forced to shift quickly|8,3|10,12|Rahu,Saturn|3',
'🧠|depression|Depression or deep low mood|A long period of heavy sadness|8,12|4,1|Moon,Saturn|1|1',
'🛋️|therapy|Began therapy or inner healing|Sought counselling or deep emotional work|8|12,5|Moon,Ketu|2',
'🏚️|bankrupt|Bankruptcy or business collapse|Business or finances fell apart|8,12|2,6|Saturn,Rahu|3|1',
'💰|spousewealth|Gain through spouse or in-laws|Money or support from partner’s side|8,7|2|Venus,Saturn|2',
'🧪|deepresearch|Breakthrough in research|Discovery in science, tech or investigation|8,5|9,3|Rahu,Mercury|2',
/* ---- 9th house: luck, father, guru, long travel ---- */
'👨|father|Father: major event|Father had a big life event or illness|9|3,8|Sun|3',
'🩺|fatherill|Father’s illness|Father was seriously unwell|9,6|8|Sun,Saturn|3|1',
'🕯️|fatherloss|Loss of father|Father passed away|9,8|12|Sun,Saturn|3|1',
'🧑‍🏫|mentor|Met a mentor or guru|A teacher who changed your path|9|5,11|Jupiter|2',
'🛕|pilgrimage|Pilgrimage or holy journey|Visited a sacred place|9|12,3|Jupiter,Ketu|3',
'🌏|longtrip|Long journey abroad (not to live)|Holiday or work trip to a distant country|9,12|3|Jupiter,Rahu|3',
'🎓|phd|Master’s, PhD or advanced study|Postgraduate or doctoral milestone|9,5|4,8|Jupiter,Mercury|3',
'📖|scholarship|Won a scholarship or fellowship|Funding for higher study|9,5|11|Jupiter|3',
'🧘|ritual|Major religious ceremony|Thread ceremony, initiation, big puja or yagna|9|5,12|Jupiter|3',
'🪔|charity|Started charity or temple service|Gave time or money for good causes|9|12,11|Jupiter,Ketu|2',
'🍀|luckybreak|A big lucky break|Opportunity arrived at just the right time|9,11|5,10|Jupiter|2',
'⚖️|verdict|Favourable court or authority decision|Official decision came in your favour|9,6|10|Jupiter,Sun|3',
'🏫|teaching|Started teaching at college level or coaching|Began lecturing, training or coaching others|9,5|10|Jupiter,Mercury|3',
'🏔️|retreat|Spiritual retreat or long course|Went on a retreat, vipassana or similar|9,12|5|Jupiter,Ketu|3',
'🛂|visa|Visa approved|Got permission to travel or stay abroad|9,12|3,10|Rahu,Jupiter|3',
'🧭|philosophy|Big shift in beliefs|Changed how you see life or faith|9|1,12|Jupiter,Ketu|1',
'📕|authorbook|Wrote a full book|Finished a full-length book|9,5|3|Jupiter,Mercury|3',
'🌠|fortuneturn|Fortune turned for the better|A clear rise in luck and support|9|11,2|Jupiter|1',
'👴|fatherretire|Father’s retirement or relocation|Father stepped back or moved|9|4,12|Sun|3',
'🌐|successabroad|Success linked to a foreign place|A result that came through overseas people|9,12|11,10|Rahu,Jupiter|2',
/* ---- 10th house: career, status, authority ---- */
'🪜|promotion|Promotion or new designation|Moved up in rank or title|10|6,11|Sun,Saturn|3',
'🔀|careerchange|Changed career or field|Moved to a very different line of work|10|8,9|Saturn,Rahu|3',
'🏢|startbiz|Started your own business|Opened a business or practice|10,7|11,3|Sun,Mercury|3',
'🏛️|govjob|Got a government job|Entered public service|10|6,1|Sun,Saturn|3',
'🗳️|politics|Entered politics or public office|Joined politics or won a post|10|11,1|Sun,Mars|3',
'📺|fame|Fame or media recognition|Noticed widely in media or your industry|10,1|11,5|Sun,Venus|2',
'🏅|careeraward|Award or honour at work|Formal recognition for your work|10|11,1|Sun,Jupiter|3',
'📉|demotion|Demotion or loss of status|Lost position, power or rank|10,12|8,6|Saturn,Rahu|3|1',
'🚪|resign|Resigned from a job|You chose to leave your job|10,12|9,8|Saturn,Rahu|3',
'🛏️|retire|Retired or stepped back|Finished your main career|10,12|9|Saturn,Sun|3',
'👔|manager|Became a manager or head|Given a team or department to lead|10|1,6|Sun,Saturn|3',
'👑|ceo|Became director, owner or CEO|Reached the top role of an organisation|10,1|11,9|Sun,Jupiter|3',
'📜|licence|Got a professional licence|Bar, medical, CA, pilot or similar licence|10,5|9,6|Saturn,Jupiter|3',
'🏗️|bigproject|Led a big successful project|A project you led was a clear success|10|3,11|Sun,Mars|2',
'📰|reputation|Reputation damage|Public name or image harmed|10,8|6,12|Saturn,Rahu|2|1',
'🚚|jobtransfer|Job transfer to another city|Company moved you to a new place|10,3|4,12|Saturn,Mercury|3',
'💼|careerbreak|Career break or long gap|Time away from work|10,12|6|Saturn,Ketu|2',
'🥇|topclient|Won a very important account|Landed a major prestigious client or tender|10,7|11|Sun,Mercury|3',
'🎖️|authority|Gained real authority or power|Given real decision-making power|10|1,11|Sun|2',
'📈|careerrise|Long steady rise in career|Years of clear upward movement|10,11|6|Saturn,Jupiter|1',
/* ---- 11th house: gains, friends, networks ---- */
'💰|gain|Big gain or wealth jump|A large increase in money or assets|2,11|5,9|Jupiter|3',
'🌟|wishdone|A long-held wish was fulfilled|Something you wanted for years came true|11|5,9|Jupiter|3',
'💵|incomejump|Income jumped sharply|Earnings rose by a big step|11,2|10|Jupiter,Mercury|2',
'🎁|bonus|Received a big bonus or reward|Bonus, prize money or award cash|11|2,10|Jupiter,Mercury|3',
'👥|network|Joined a powerful network or group|Club, association or elite community|11|3,7|Rahu,Mercury|2',
'🤗|newfriend|Met a lifelong friend|A friend who stayed with you for years|11|3,7|Mercury,Venus|3',
'💔|friendlost|Lost or broke a close friendship|A friendship ended|11,12|8,6|Rahu,Saturn|2|1',
'👨‍🦱|eldersib|Elder sibling: major event|Elder brother or sister had a big event|11|3,9|Jupiter,Mars|3',
'💞|eldersibmarry|Elder sibling’s wedding|Elder brother or sister got married|11,7|3|Jupiter,Venus|3',
'🔗|connection|A contact opened a big door|Someone you know got you a big chance|11|3,10|Mercury,Rahu|2',
'🏭|sideincome|Started a side income|Second source of earnings began|11,2|3,6|Mercury,Rahu|3',
'📦|ecommerce|Started online selling or e-commerce|Launched an online shop or marketplace business|11,3|7,10|Mercury,Rahu|3',
'💹|investgain|Long-term investments paid off|Property or investments grew a lot|11|2,5|Jupiter,Saturn|2',
'🧑‍🤝‍🧑|community|Became a leader in a community|Elected or trusted in a group|11,10|1,3|Saturn,Jupiter|2',
'📱|appwebsite|Launched an app, website or platform|Put a digital product live|11,3|5,10|Rahu,Mercury|3',
'🎓|alumni|Gained from an alumni or old friend network|Old classmates or friends helped|11|3,5|Mercury|2',
'🏆|goalreached|Reached a long-term goal|A multi-year target was reached|11|10,1|Jupiter,Saturn|3',
'💸|fundraise|Raised money for a venture|Investors, crowdfunding or loans for your plan|11,2|7,5|Jupiter,Rahu|3',
'🤲|debtfree|Became completely debt-free|No big loans remain|11,6|2|Jupiter,Saturn|3',
'👍|socialfame|Friends circle grew very large|Many new contacts and social events|11|3,5|Venus,Mercury|1',
/* ---- 12th house: foreign, loss, solitude, spirit ---- */
'✈️|foreign|Moved or settled abroad|Went to live in another country|12|3,9|Rahu|3',
'💼|workabroad|Started working abroad|Took a job in another country|12,10|9,3|Rahu,Saturn|3',
'🎓|studyabroad|Went abroad to study|Joined a foreign university or programme|12,9|5,4|Rahu,Jupiter|3',
'🛬|returnhome|Returned from abroad for good|Came back to your home country|12,4|9|Rahu,Moon|3',
'🏥|longhospital|Long hospital stay or bed rest|Weeks in hospital or recovery|12,6|8,1|Saturn,Moon|3|1',
'💸|bigexpense|Very large expense|A big one-time spending|12|2,6|Venus,Saturn|3',
'🎒|lostitem|Lost valuables or belongings|Lost something important or costly|12,2|8|Rahu,Saturn|2|1',
'🧘|solitude|A period of solitude or retreat|Withdrew from the world for a while|12|9,8|Ketu,Saturn|1',
'😴|sleep|Sleep trouble or insomnia|A long stretch of poor sleep|12,6|4,1|Moon,Saturn|1|1',
'🛕|ashram|Stayed in an ashram or monastery|Lived for a time in a spiritual place|12,9|8,5|Ketu,Jupiter|3',
'🔒|confinement|Legal confinement or restriction|Detained, restricted or bound by rules|12,6|8|Saturn,Rahu|3|1',
'🕶️|secretaffair|Hidden relationship or secret matter|A relationship kept private|12,7|5,8|Rahu,Venus|2',
'🌎|foreignspouse|Partner from another country|Married or partnered with someone foreign|12,7|9|Rahu,Venus|3',
'🧳|emigrate|Emigrated permanently|Left your country for good|12|9,3|Rahu|3',
'🛬|immigrate|Got permanent residency or citizenship abroad|PR, green card or foreign citizenship|12,9|1,10|Rahu,Jupiter|3',
'🤲|givingaway|Gave away a lot (donation)|Large donation or sacrifice|12,9|11|Ketu,Jupiter|2',
'🧘‍♀️|meditate|Began a daily meditation practice|Settled into regular spiritual practice|12,5|9|Ketu,Jupiter|2',
'📉|businessloss|Business or investment loss|Large loss in work or money|12,8|2,6|Saturn,Rahu|3|1',
'👁️|eyesurg|Eye operation or foot problem|Eye or foot treatment|12,2|6|Venus,Saturn|3|1',
'🪽|letgo|Ended a major chapter and let go|Closed a long chapter of life|12,8|1,4|Ketu,Saturn|2',
/* ---- Cross-area milestones (appear in the house of their main theme) ---- */
'🎂|firstjob|First job in life (any kind)|Your very first paid work|10,6|3,11|Saturn,Mercury|3',
'🧑‍🎓|graduate|Graduation|Completed a college degree|5,9|4,10|Mercury,Jupiter|3',
'🏠|ownroof|Moved out of parents’ home|Started living on your own|4,12|1,3|Moon,Mars|3',
'🏙️|citymove|Moved to a bigger city|Shifted cities for work or study|3,12|4,10|Mercury,Rahu|3',
'👩‍👧|momtobe|Became a parent for the first time|The first time you became mother or father|5|4,2|Jupiter,Moon|3',
'🧓|inlaws|Major event with in-laws|Big change or illness among in-laws|7,8|4,12|Venus,Saturn|2',
'🎤|publicperf|Big public performance or speech|A well-attended performance or talk|3,5|10,1|Mercury,Venus|3',
'🏦|bankjob|Bank, finance or accounts job|Work with money or accounts started|2,6|10,11|Mercury,Jupiter|3',
'⚙️|techjob|Technology or engineering job|Started in tech, engineering or IT|10,3|6,11|Rahu,Mercury|3',
'🩺|medicalcareer|Entered medicine or healing|Medical, nursing or healing profession began|6,10|8,1|Sun,Mars|3',
'⚖️|lawcareer|Entered law or judiciary|Started as lawyer, judge or legal officer|9,10|6,7|Jupiter,Saturn|3',
'🎭|artcareer|Arts or entertainment career began|Professional work in arts, music or entertainment|5,10|3,7|Venus,Moon|3',
'🌾|agricareer|Farming or land-based work started|Agriculture, farm or land business began|4,10|3,6|Mars,Moon|3',
'🏗️|builderbiz|Real estate or construction business|Deals in property or building work began|4,10|11,3|Mars,Saturn|3',
'🧑‍🍳|hospitality|Hospitality or beauty business|Hotel, salon, fashion or beauty work started|7,2|10,11|Venus|3',
'🎓|ownclass|Opened a coaching or training centre|Started your own teaching centre|5,9|10,11|Jupiter,Mercury|3',
'🛳️|shipping|Export, import or shipping work|International trade or logistics work|12,7|10,3|Rahu,Mercury|3',
'🔬|science|Joined a scientific or research post|Lab, institute or research appointment|8,5|10,9|Mercury,Rahu|3',
'📡|mediajob|Joined media, news or communications|Journalism, PR or media job|3,10|5,11|Mercury,Rahu|3',
'🪖|retiredforce|Left a uniformed service|Left army, police or similar force|10,12|6,3|Mars,Sun|3',
'🏥|healthcheck|Major medical check-up or scan found something|A test or scan revealed a health matter|6,8|1,12|Mars,Saturn|3|1',
'🧪|surgerymother|Parent’s surgery|Father or mother had an operation|4,9|8,6|Moon,Sun|3|1',
'💒|ownwedding|Wedding ceremony of your own (rituals done)|The actual wedding rituals and ceremony|7|5,11|Venus,Jupiter|3',
'🏘️|buyshop|Bought a shop or office|Commercial property purchase|4,10|11,2|Mars,Mercury|3',
'🛶|holiday|Took a major holiday|A special long vacation|5,12|9,3|Venus,Moon|3',
'🪞|spirituawake|Spiritual awakening|A deep inner turning toward spirit|9,12|8,5|Ketu,Jupiter|1',
'🧑‍🍼|childabroad|Child went abroad or moved far|Your child left for another place|5,12|9|Jupiter,Rahu|3',
'🏆|sibsuccess|Sibling’s big success|A brother or sister did very well|3,11|10|Mars,Jupiter|2',
'📱|techgadgetbiz|Started a tech or online business|Online or tech-based enterprise began|3,11|10,7|Rahu,Mercury|3',
'🛑|legalnotice|Received a legal notice|Official notice from court or lawyer|6,8|7,10|Mars,Saturn|3|1',
'🧑‍🔧|skilledtrade|Started a hands-on trade|Mechanic, electrical, carpentry or craft work|3,6|10|Mars,Mercury|3',
'🪴|garden|Took up farming, gardening or nature life|Began a life close to nature|4|5,12|Moon,Venus|1',
'🧑‍⚕️|healerrole|Began healing others|Started therapy, yoga or healing work|6,12|5,10|Ketu,Moon|2',
'📚|libraryphase|A long phase of deep study|Years of focused learning|5,4|9|Mercury,Jupiter|1',
'🚪|exitgroup|Left a group, party or organisation|Walked away from a long membership|11,12|3|Saturn,Ketu|2',
'🏅|sportcareer|Professional sports career began|Joined a team or league professionally|3,1|5,10|Mars|3',
'🎻|musiclearn|Started learning music or dance|Began formal lessons in music or dance|5,2|3|Venus,Moon|2',
'🧑‍🚀|risktaker|Left safety for a risky dream|Quit security to follow a bold plan|3,10|1,8|Mars,Rahu|2'
];

const LEC = (function(){
  const list = [], byId = {};
  LEC_RAW.forEach(row=>{
    const f = row.split('|');
    const nums = s=> s ? s.split(',').map(Number) : [];
    const ks = f[6] ? f[6].split(',') : [];
    const e = { id:f[1], emoji:f[0], label:f[2], plain:f[3], p:nums(f[4]), s:nums(f[5]), k:ks, sh:+f[7]||2, n:f[8]==='1' };
    e.label = e.emoji + ' ' + e.label;
    e.house = e.p[0];
    e.planet = e.k[0] || 'Jupiter';
    if (byId[e.id]) return;              // first row wins (ids are unique anyway)
    byId[e.id] = e; list.push(e);
  });
  return { list, byId, houses:LEC_HOUSES, planets:LEC_PLANETS, signs:LEC_SIGN_NAMES, count:list.length };
})();

/* Plug the catalog into the existing studio table (keeps the 10 original ids and their houses). */
(function(){
  if (typeof RS_CATS === 'undefined') return;
  LEC.list.forEach(e=>{ RS_CATS[e.id] = e; });
})();

/* ============================================================================
   EXTRA CATEGORIES — every event is also tagged with: theme, who it is about, mood, life stage, date accuracy
   (house / planet / sign come from the rows above). Used by the browse views and filters of 98-life-event-engine.js.
   ============================================================================ */
const LEC_THEMES = [
  { id:'self',   icon:'🌱', name:'Self & Identity',      plain:'You as a person: image, confidence, new starts', c:'#e9b949' },
  { id:'love',   icon:'💞', name:'Love & Family',        plain:'Partner, children, parents, siblings, relatives', c:'#ef6f9a' },
  { id:'money',  icon:'💰', name:'Money & Wealth',       plain:'Income, savings, loans, gains, windfalls',        c:'#5fcf8d' },
  { id:'work',   icon:'💼', name:'Work & Business',      plain:'Jobs, promotions, business, clients, contracts',  c:'#5aa9ff' },
  { id:'home',   icon:'🏡', name:'Home & Property',      plain:'Houses, land, vehicles, moves at home',           c:'#e29a5b' },
  { id:'learn',  icon:'🎓', name:'Study & Skills',       plain:'School, exams, courses, writing, new skills',     c:'#a78bfa' },
  { id:'body',   icon:'🩺', name:'Health & Body',        plain:'Illness, surgery, fitness, recovery',             c:'#ff7a6b' },
  { id:'travel', icon:'✈️', name:'Travel & Foreign',     plain:'Trips, moving abroad, visas, relocation',         c:'#4fd1c5' },
  { id:'spirit', icon:'🕉️', name:'Spirit & Inner Life',  plain:'Faith, retreats, meditation, letting go',         c:'#c4b5fd' },
  { id:'legal',  icon:'⚖️', name:'Legal & Conflict',     plain:'Courts, notices, rivals, secrets, disputes',      c:'#94a3b8' },
  { id:'social', icon:'🌟', name:'Fame, Friends & Luck', plain:'Recognition, friends, networks, lucky breaks',    c:'#f6c453' },
  { id:'loss',   icon:'🥀', name:'Loss & Crisis',        plain:'Deaths, accidents, shocks, hard turning points',  c:'#d96a8a' }
];
const LEC_THEME_IDS = {
  self:'freshstart personalwin confidence newlook namechange leader lowphase ownlaunch stagedebut challenge selfreliance lifepivot identitydoc goalset bravemove risktaker',
  love:'familyjoin familyfight babyname sibbirth sibmarry sibfight child pregnancy secondchild childschool childmarry fallinlove firstlove lovemarriage breakup adoption momtobe childabroad marriage engaged metspouse livein divorce separation spouserise remarry arranged exreturn spouseabroad inlaws ownwedding longdistance foreignspouse secretaffair mother father fatherretire eldersib eldersibmarry familywealth sibsuccess',
  money:'salary savings jewellery shares stable bankacct giftmoney budgetcrisis moneyloss gain windfall inherit insurance spousewealth speculative spectrade incomejump bonus sideincome investgain fundraise debtfree loantaken loancleared bigexpense lostitem taxissue businessloss bankrupt',
  work:'career promotion careerchange startbiz govjob politics careeraward demotion resign retire manager ceo licence bigproject reputation jobtransfer careerbreak topclient authority careerrise firstjob techjob retiredforce joboffer joblost bossclash burnout nightshift servicejob uniform betrayed bizpartner partnerend bigclient contract customers hospitality ecommerce appwebsite techgadgetbiz salessucc negotiation foodbiz familybiz ownvoice commute mediajob artcareer agricareer builderbiz lawcareer shipping skilledtrade science medicalcareer ownclass teachjob teaching bankjob sportcareer',
  home:'property newhome renovation land car twowheeler sellhome rented homeloan homecoming ownroof garden buyshop gadget',
  learn:'edu schoolfinish collegeadmit examclear rank research graduate libraryphase musiclearn skillcourse language writing bookpub photovideo phd scholarship authorbook mentor deepresearch speaking',
  body:'fitness bodyinjury fullrecovery healthturn skinhair faceeye diet handinjury heartissue health hospital chronic treatment healthcheck healerrole longhospital sleep eyesurg martial sportwin motherill fatherill spouseill childhealth surgery surgerymother depression therapy',
  travel:'foreign workabroad studyabroad returnhome emigrate immigrate longtrip visa successabroad shorttrip citymove holiday suddentransfer',
  spirit:'mantra pilgrimage ritual charity retreat philosophy spirituawake solitude ashram meditate letgo occultstudy givingaway',
  legal:'lawstart lawwon verdict legalnotice spouselaw confinement rivalbeat scandal secret',
  social:'fame viral newfriend friendlost network connection community alumni socialfame exitgroup wishdone goalreached luckybreak fortuneturn neighbour publicsucc mediadebut publicperf contest creative famouslocal',
  loss:'accident nearmiss shock crisis sibloss motherloss fatherloss grandloss relloss friendloss miscarry breakdown peacelost'
};
const LEC_WHO = [
  { id:'me',       icon:'🙋', name:'Me',                         plain:'Something that happened to you directly', c:'#e9b949' },
  { id:'partner',  icon:'💑', name:'Partner & love',             plain:'Spouse, partner, romance',                 c:'#ef6f9a' },
  { id:'children', icon:'👶', name:'Children',                   plain:'Your kids or pregnancy',                   c:'#5fcf8d' },
  { id:'parents',  icon:'👪', name:'Parents',                    plain:'Mother or father',                         c:'#e29a5b' },
  { id:'siblings', icon:'👫', name:'Brothers & sisters',         plain:'Younger or elder siblings',                c:'#5aa9ff' },
  { id:'family',   icon:'🏘️', name:'Wider family',               plain:'Grandparents, in-laws, relatives',         c:'#a78bfa' },
  { id:'others',   icon:'🤝', name:'Friends, work people & clients', plain:'Colleagues, bosses, clients, rivals, mentors', c:'#4fd1c5' }
];
const LEC_STAGES = [
  { id:'study',   icon:'🎒', name:'Study years',  plain:'Roughly up to age 25', c:'#a78bfa' },
  { id:'start',   icon:'🚀', name:'Starting out', plain:'Roughly age 22 to 35', c:'#5aa9ff' },
  { id:'settled', icon:'🏛️', name:'Settled life', plain:'Roughly age 35 to 55', c:'#e9b949' },
  { id:'later',   icon:'🌇', name:'Later life',   plain:'Roughly age 55 and on', c:'#e29a5b' },
  { id:'any',     icon:'🔁', name:'Any age',      plain:'Can happen at any time of life', c:'#94a3b8' }
];
const LEC_STAGE_IDS = {
  study:'schoolfinish collegeadmit edu examclear rank graduate firstlove fallinlove skillcourse libraryphase musiclearn scholarship',
  start:'firstjob joboffer salary marriage engaged arranged metspouse lovemarriage ownwedding livein child pregnancy property car twowheeler homeloan startbiz citymove studyabroad workabroad ownroof newhome rented foreign phd bizpartner ownlaunch',
  settled:'promotion manager ceo secondchild childschool careerchange authority politics careeraward bigproject careerrise investgain buyshop land familybiz',
  later:'retire retiredforce childmarry childabroad pilgrimage ashram meditate fatherretire fatherloss motherloss grandloss careerbreak charity mentor'
};
const LEC_MOODS = [
  { id:'good', icon:'✨', name:'Good news',      plain:'Positive events and wins',            c:'#5fcf8d' },
  { id:'turn', icon:'🔄', name:'Turning points', plain:'Big changes that open a new chapter', c:'#e9b949' },
  { id:'hard', icon:'⚠️', name:'Hard times',     plain:'Difficult or painful events',          c:'#ff7a6b' }
];
const LEC_TURN_IDS = 'freshstart lifepivot careerchange citymove foreign emigrate immigrate ownroof marriage startbiz ownlaunch jobtransfer newhome studyabroad workabroad returnhome remarry retire resign letgo spirituawake ownwedding livein divorce';
const LEC_ACC = [
  { id:3, icon:'🎯', name:'Exact day',        plain:'You can name the date',                c:'#5fcf8d' },
  { id:2, icon:'📅', name:'A few weeks',      plain:'You know the month or so',             c:'#e9b949' },
  { id:1, icon:'🌫️', name:'A phase',          plain:'Gradual: only a period of time',       c:'#94a3b8' }
];
/* colour sets for the browse views */
const LEC_HC = ['#e9b949','#5fcf8d','#4fd1c5','#e29a5b','#ef6f9a','#ff7a6b','#f472b6','#d96a8a','#a78bfa','#5aa9ff','#f6c453','#7dd3fc'];
const LEC_PC = { Sun:'#f6c453', Moon:'#cbd5e1', Mars:'#ff7a6b', Mercury:'#5fcf8d', Jupiter:'#e9b949', Venus:'#ef6f9a', Saturn:'#94a3b8', Rahu:'#a78bfa', Ketu:'#c08457' };
const LEC_EC = { Fire:'#ff7a6b', Earth:'#5fcf8d', Air:'#7dd3fc', Water:'#7c8cf8' };

(function(){
  const idx = (obj)=>{ const m = {}; Object.keys(obj).forEach(k=> obj[k].split(' ').forEach(id=>{ if (id) m[id] = k; })); return m; };
  const th = idx(LEC_THEME_IDS), st = idx(LEC_STAGE_IDS), turn = {}; LEC_TURN_IDS.split(' ').forEach(i=>{ turn[i] = 1; });
  const houseTheme = { 1:'self', 2:'money', 3:'learn', 4:'home', 5:'love', 6:'work', 7:'love', 8:'loss', 9:'spirit', 10:'work', 11:'social', 12:'travel' };
  const whoRx = [
    ['children', /child|baby|pregnan|miscarry|adopt|momtobe|secondchild/],
    ['parents',  /mother|father|parent/],
    ['siblings', /sib|eldersib|brother|sister/],
    ['partner',  /spouse|partner|marri|engage|wedding|divorce|separation|remarry|livein|metspouse|arranged|exreturn|lover|love|romantic|breakup|longdistance|secretaffair/],
    ['family',   /inlaws|in-law|grand|relloss|relative|familyjoin|familyfight|familywealth|babyname/],
    ['others',   /friend|colleague|boss|neighbour|network|client|rival|enemy|mentor|guru|alumni|community|betray|bizpartner|partnerend|customers|connection|exitgroup/]
  ];
  const whoFix = { ownroof:'me', grandloss:'family' };
  LEC.list.forEach(e=>{
    e.name = e.label.slice(e.emoji.length + 1);
    e.theme = th[e.id] || houseTheme[e.house];
    e.stage = st[e.id] || 'any';
    e.mood = e.n ? 'hard' : (turn[e.id] ? 'turn' : 'good');
    const txt = (e.id + ' ' + e.name).toLowerCase(); e.who = 'me';
    for (const r of whoRx) if (r[1].test(txt)){ e.who = r[0]; break; }
    if (whoFix[e.id]) e.who = whoFix[e.id];
    e.acc = e.sh;
  });
  LEC.themes = LEC_THEMES; LEC.whoList = LEC_WHO; LEC.stages = LEC_STAGES; LEC.moods = LEC_MOODS; LEC.accs = LEC_ACC;
  LEC.hc = LEC_HC; LEC.pc = LEC_PC; LEC.ec = LEC_EC;
})();

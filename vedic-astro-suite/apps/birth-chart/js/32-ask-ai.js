/* ---------- Ask-AI: topic → small box of focused questions → Google AI mode ---------- */
const SRCH_STYLE = 'RULES: (1) Use ONLY the CHART DATA below. It is exact and authoritative: never invent, change or guess any sign, house, degree, aspect or planet; if something is not listed, do not claim it; if your memory disagrees with the data, the data wins. (2) Be PRECISE, not generic: every point must be a specific, checkable behaviour, habit, event, body area, relationship scenario or age window that a person can test against their own life. Forbidden: statements that fit almost anyone (e.g. "you value...", "sometimes you...", "deep down...", "you can be both..."). Prefer concrete contrasts and numbers. (3) BLEND, do not list: combine Lagna + Sun + Moon signs, conjunctions and aspects from the data into one picture, and say how each aspect or conjunction modifies the trait or event (example style: Saturn+Ketu together in a fire sign -> a specific accident/injury or detachment pattern). (4) End every bullet with a tiny tag: 🔎 Because: <exact combination from the data>. (5) FORMAT: bold headline with an emoji verdict; 3-5 sections with emoji + CAPS headline; tight ranked bullets; ✅ strengths, ⚠️ cautions, ⏳ timing; finish with 🎯 Bottom line in one sentence. Plain words, no jargon. Health topics: one-line not-medical-advice note.';
const SRCH_TOPICS = [
 {id:'me',ico:'🪞',t:'This is me — precise self-check',kw:'verify my chart is mine personality blend aspects conjunction accuracy relatable self reflect barnum',h:[1],s:[5,9],k:['Sun','Moon'],ck:'Atmakaraka',v:'D1',ar:['AL'],subs:[
  ['✅ Verify: is this chart mine? (10 checks)','Give 10 very specific, hard-to-fake statements about my PAST and everyday life that I can mark ✔ or ✖: childhood or family situation, a recurring health/injury/body-mark pattern, a relationship scenario that repeats, a school or work turning point with an approximate age window, habits, living situation, parents/siblings facts. Rank from most to least confident. End with: how many ✔ out of 10 would confirm this chart is mine, and which of the 10 depend on the exact birth time (Lagna/house based) versus Sun/Moon-sign based ones that survive a time error.'],
  ['🧬 My personality blend (Lagna + Sun + Moon)','Explain my personality as ONE blend. Three short blocks: Outer me (Lagna sign + planets in/aspecting Lagna), Core me (Sun sign + what conjoins/aspects Sun), Inner me (Moon sign + what conjoins/aspects Moon). Then say precisely where these three clash or reinforce, and how each aspect/conjunction in the data shifts the behaviour. Give 10 relatable but non-generic behaviours I can recognise in myself.'],
  ['🔗 What each aspect & conjunction does to me','Go through EVERY conjunction and EVERY aspect in the data. For each: one line on exactly how it changes my behaviour or life events (be concrete: situations, reactions, accident/health/relationship patterns, ages), plus its 🔎 Because tag. Rank from strongest effect to weakest.'],
  ['🔒 10 private things only I would know','Give 10 specific private habits, thoughts or reactions that I can easily self-reflect on but that are NOT generic: how I react under stress, spending/sleep/food habits, texting or arguing style, what I do when ignored, what I hide, what triggers me. Each must be checkable ✔/✖.'],
  ['👪 Childhood & family snapshot','Give 10 specific, checkable statements about my childhood, parents, siblings, home environment and early school years, with approximate age windows.'],
  ['🔁 Relationship scenarios I keep repeating','Give 8 specific repeating scenarios in my close relationships (who I attract, what goes wrong, how it ends or restarts) that I can recognise, with an age window where the pattern began.'],
  ['⚙️ How I really work & handle money','Give 10 specific, checkable work-style and money habits (how I start tasks, deadlines, bargains, savings, impulse spending, risk) — nothing generic.'],
  ['🩹 Body & health quirks to verify','Give 8 specific body/health tendencies I can verify in my own history (areas, injuries, digestion, sleep, energy dips, skin/hair, accident-prone situations). Traditional astrology only, not medical advice.'],
  ['⏱️ Birth-time sanity check','Using only the data: which 5 claims about me depend on the Lagna/houses (change if my birth time is off), and which 5 depend only on Sun/Moon/planet signs? Suggest 3 life events I should ask family about to confirm the birth time.']]},
 {id:'career',ico:'💼',t:'Career & profession',kw:'job work profession promotion success',h:[10],s:[6,2,11],k:['Sun','Saturn','Mercury','Jupiter'],ck:'Amatyakaraka',v:'D10',ar:['A10','AL'],subs:[
  ['Top 20 careers for me','List 20 specific careers/professions ranked from most to least likely for me (like artist, scientist, doctor, advocate, engineer, teacher). One line each: the job + a 4-6 word reason in plain words.'],
  ['Job or business?','Say clearly: job, business, or both, with one line why. Then list 5 job roles and 5 business types that fit me.'],
  ['Best industries & work style','List my 10 best industries, then my ideal work style (solo or team, desk or field, own boss or not) in 5 short bullets.'],
  ['Next 5 years of career','Give a year-by-year list for the next 5 years: rise / stable / change / risk, one line each, with the best months or quarters to move.'],
  ['Blockers & fixes','List my 5 biggest career blockers and one practical fix for each.'],
  ['Skills to build','List my 8 strongest professional strengths and the 3 skills I should develop most.']]},
 {id:'job',ico:'🧑‍💻',t:'Job vs business',kw:'employment self employed entrepreneur startup',h:[10,7],s:[6,3,11],k:['Mercury','Saturn','Mars'],ck:'Amatyakaraka',v:'D10',ar:['A10'],subs:[
  ['Job or business: decide','Give a direct verdict (job / business / both) with a percentage split and one reason.'],
  ['15 business ideas','List 15 specific business ideas ranked by fit for me, with 4-word reasons.'],
  ['Best time to switch or start','List the 3 best years/windows to change jobs or start a business, and 2 periods to avoid.'],
  ['Solo or partners?','Should I work alone or with partners? Describe the type of partner to trust and the type to avoid.']]},
 {id:'money',ico:'💰',t:'Wealth & finances',kw:'money income savings rich dhana',h:[2,11],s:[5,9,8],k:['Jupiter','Venus'],ck:'',v:'D2',ar:['A2','A11'],subs:[
  ['10 income sources','List my 10 most likely sources of income, ranked, one line each.'],
  ['Money habits','Give 8 specific, checkable money behaviours: what I do right after income, impulse-spend categories, saving style, lending/borrowing habit, risk appetite, with an example each.'],
  ['Wealth years ahead','Year-by-year for the next 5 years: income up/down, best years to invest, buy or save.'],
  ['Where to invest','List 8 asset types that suit my nature ranked, and 4 to avoid (general idea only, not financial advice).'],
  ['Money leaks & fixes','List my 5 biggest money leaks and a fix for each.'],
  ['Best age to build wealth','Give the 3 age windows when I build the most wealth, and what I should do in each.'],
  ['Good & bad money days','List the weekdays and 3 conditions that are good for money decisions for me and which to avoid.']]},
 {id:'moneyblocks',ico:'🚧',t:'Money blocks & delays',kw:'money block stuck poor debt loan loss not saving financial problem scarcity obstacle',h:[2,11,6,8,12],s:[5,9,10],k:['Saturn','Rahu','Ketu','Jupiter'],ck:'',v:'D2',ar:['A2','A11'],subs:[
  ['My top 7 money blocks','List my 7 most likely money blocks, tied to specific placements, each with a checkable real-life sign (no generic lines).'],
  ['Why money leaves me','List 6 specific ways money leaves me (loans, trust, impulse, family, health, fines, scams, lending) ranked, with a fix for each.'],
  ['Debt & loans','Give a direct view on debt and loan risk (low / medium / high), 4 reasons, and the safest way I should borrow or avoid it.'],
  ['Mindset blocks','Give 6 specific beliefs or habits about money that my chart suggests I hold, and a replacement habit for each.'],
  ['Blocked years & when it eases','List the next 3 tight financial periods (with years) and the first window when money flow clearly improves.'],
  ['Unexpected loss risks','List 5 types of sudden financial loss to guard against (theft, fraud, partners, speculation, health) and a precaution for each.']]},
 {id:'wealthboost',ico:'📈',t:'Wealth growth & luck',kw:'rich millionaire business profit investment property lottery speculation windfall gains',h:[2,5,9,11],s:[8,10],k:['Jupiter','Venus','Mercury'],ck:'',v:'D2',ar:['A2','A11'],subs:[
  ['Rich or comfortable?','Give a direct verdict (struggle / comfortable / wealthy / very wealthy) with a percentage and 5 chart reasons.'],
  ['Salary, business or both','Rank salary, business, freelance, investments and family money for me with a percentage and reason.'],
  ['Windfalls & speculation','Say whether sudden gains (inheritance, gifts, stocks, lottery) are likely, with 4 reasons and how careful I should be.'],
  ['Property, gold or stocks','Rank property, gold, stocks, business and savings for my nature, 1 line each (general idea only, not financial advice).'],
  ['My 5 best money years','List the 5 best years ahead for income growth, each with one action to take.'],
  ['Multiple income streams','List 8 income stream ideas that fit my chart, ranked, with the planet behind each.']]},
 {id:'remedies',ico:'🪔',t:'Remedies & what to do',kw:'remedy remedies upay mantra gemstone puja charity fasting donate fix dosha solution',h:[1,6,8,12],s:[9,5],k:['Jupiter','Saturn','Sun','Moon'],ck:'',v:'D1',ar:[],subs:[
  ['My top 5 remedies','Pick the 5 most useful traditional remedies for MY chart, ranked by importance, with the exact planet and reason for each.'],
  ['Weak planets & how to strengthen','List my 3 weakest planets and, for each: a simple mantra, a day to fast or donate, a colour and a daily habit.'],
  ['Gemstones: wear or avoid','Say which gemstones may suit me and which to avoid, with the reason and a caution to consult a trusted astrologer before wearing.'],
  ['Mantras & daily routine','Build a 10-minute daily routine: mantras, timing and simple actions matched to my chart.'],
  ['Charity & seva that helps','List 7 specific charity or service actions (what to give, on which day, to whom) matched to my planets.'],
  ['Habits that matter more than rituals','List 8 practical, non-ritual habits that work as remedies for my chart in everyday life.'],
  ['Money-focused remedies','Give 8 traditional remedies and 4 practical habits specifically to improve money flow in my chart.'],
  ['Love-focused remedies','Give 8 traditional remedies and 4 practical habits specifically for love, marriage and relationships in my chart.'],
  ['Remedies for the running period','Based on my current dasha and antardasha, list 6 targeted remedies and what to avoid until it ends.']]},
 {id:'karmapat',ico:'♾️',t:'Karmic patterns',kw:'karma karmic past life rahu ketu nodes saturn lesson debt repeating pattern destiny dharma',h:[5,8,9,12],s:[1,6,10],k:['Rahu','Ketu','Saturn'],ck:'Atmakaraka',v:'D60',ar:[],subs:[
  ['My Rahu–Ketu life lesson','Using the houses and signs of Rahu and Ketu, explain in 8 plain bullets: what I over-chase now (Rahu), what I already mastered and tend to abandon (Ketu), and the balance to find.'],
  ['Top 8 repeating patterns','List the 8 life patterns that keep repeating for me (people, situations, endings), each tied to a placement and a checkable real-life example.'],
  ['Soul purpose (Atmakaraka)','Based on my Atmakaraka planet and sign, describe my soul\'s core lesson, 6 gifts I carry and 4 traps.'],
  ['Saturn: where life tests me','Using Saturn\'s house, sign and aspects, list 7 areas where I face delay or pressure, what it asks of me, and the reward when I do it.'],
  ['Karmic debts I owe / are owed','Using the 6th, 8th, 12th houses and their lords, list 6 likely karmic debts (family, money, relationships, health, duty) and how to settle each.'],
  ['Retrograde planets & unfinished work','List each retrograde planet in my chart and what unfinished past-life theme it points to, 1 line each.'],
  ['Family & ancestral karma','Using the 4th, 9th, Sun, Moon and Saturn, list 6 ancestral or family patterns I may be carrying and healthy ways to break them.'],
  ['Karmic turning points','List the 5 age windows where my karma shifts strongly (dasha or node transits), with what changes at each.'],
  ['Breaking the cycle','Give 10 practical steps (habits, boundaries, service, remedies) to break my top repeating karmic patterns.']]},
 {id:'karmarel',ico:'🪢',t:'Karmic relationships',kw:'karmic relationship soul contract twin flame toxic cycle attachment rahu ketu 7th 12th',h:[5,7,8,12],s:[4,11],k:['Rahu','Ketu','Venus','Saturn'],ck:'Darakaraka',v:'D9',ar:['UL'],subs:[
  ['My karmic relationship type','Describe in 7 checkable bullets the type of karmic relationship I attract (teacher, mirror, rescuer, avoidant, controlling...) and why.'],
  ['Signs a bond is karmic','List 8 clear signs a relationship is karmic for me versus healthy, so I can recognise it early.'],
  ['Parents, siblings & friends karma','Using the 4th, 3rd, 9th and 11th, list 6 karmic lessons with parents, siblings, friends and mentors.'],
  ['Teachers & mentors I meet','Say when and what kind of teachers or mentors appear in my life, with 4 age windows.'],
  ['Cutting toxic cycles','Give 8 specific boundaries and habits to stop repeating toxic cycles, tied to my chart.']]},
 {id:'fame',ico:'🌟',t:'Fame, status & recognition',kw:'reputation name public image authority',h:[10,1],s:[11,5],k:['Sun','Moon'],ck:'Atmakaraka',v:'D10',ar:['AL','A10'],subs:[
  ['Will I become well known?','Give a direct verdict with a percentage and the fields where it is most likely.'],
  ['My public image','In 6 bullets: how people see me, and how to sharpen it.'],
  ['10 best fields for recognition','List 10 fields or platforms where I can get recognised, ranked.'],
  ['When recognition peaks','List the 3 best years/windows for visibility and 1 to avoid.']]},
 {id:'spouse',ico:'💍',t:'Spouse & marriage',kw:'wife husband partner relationship spouse details',h:[7],s:[2,11,12],k:['Venus','Jupiter'],ck:'Darakaraka',v:'D9',ar:['UL','A7'],subs:[
  ['Who is my likely spouse','Describe my likely spouse in bullets: personality, looks tendency, 8 most likely professions, family background, age gap tendency and how close our culture will be.'],
  ['Where & how will I meet','List the 10 most likely places or ways I meet my partner, ranked (work, college, friends, family introduction, online, travel, neighbourhood...). One line each.'],
  ['Love or arranged?','Give a direct verdict with a percentage split between love and arranged.'],
  ['Where is my partner from','Rank where my partner is likely from: same city, another city, another state, abroad, other culture. One line each.'],
  ['Marriage quality','List my marriage strengths (5) and challenges (5) in plain words.'],
  ['Making marriage smoother','Give 6 practical habits and traditional remedies for a smoother marriage.']]},
 {id:'marriagetime',ico:'📅',t:'Marriage timing',kw:'when will i marry wedding delay',h:[7,2,11],s:[5,12],k:['Venus','Jupiter'],ck:'Darakaraka',v:'D9',ar:['UL'],subs:[
  ['Likely marriage years','List the 3 most likely years/age windows for marriage, ranked, one line each.'],
  ['Any delay and why','Is there a delay? Say yes/no, give 3 plain reasons, and the first window when it eases.'],
  ['Best months next 12 months','List the best 3 months in the next 12 for engagement/marriage steps and any to avoid.']]},
 {id:'love',ico:'❤️',t:'Love & romance',kw:'dating affair crush relationship attraction',h:[5,7],s:[11,2],k:['Venus','Moon'],ck:'Darakaraka',v:'D9',ar:['UL'],subs:[
  ['My romance pattern','Give 8 specific, checkable things about how I behave in love (who initiates, how I act in the first 3 months, what I do when jealous or hurt, what I secretly need). Nothing generic.'],
  ['Types of people I attract','List 8 types of partner I am attracted to or attract.'],
  ['Heartbreak risks & how to avoid','List 5 relationship traps for me and how to avoid each.'],
  ['Best time for new love','List the best 3 windows for new love in the next 3 years.'],
  ['How to attract the right person','Give 8 specific actions, places and habits that help me attract the right partner, plus 3 things to stop doing.']]},
 {id:'lovers',ico:'💞',t:'Lovers & love story',kw:'lover boyfriend girlfriend ex first love crush story attraction partner type',h:[5,7,11],s:[2,8,12],k:['Venus','Moon','Mars'],ck:'Darakaraka',v:'D9',ar:['UL','A7'],subs:[
  ['My love story outline','Outline my love life as 6 chapters (age windows): first attraction, first serious relationship, hardest phase, turning point, settling phase, long-term. One line each, concrete.'],
  ['My first love','Describe, in 7 specific bullets, the kind of person my first real love is likely to be and how it starts and ends.'],
  ['How many serious relationships','Give a direct estimate of how many serious relationships I am likely to have before settling, with the reason in one line each.'],
  ['What I want vs what I attract','Two lists of 6 bullets: what I consciously want in a lover, and what I actually keep attracting. Point out the gap.'],
  ['My love language','Rank my 5 love languages (words, time, touch, gifts, acts) with a checkable example of each.'],
  ['My attachment style','Name my attachment style (secure, anxious, avoidant, mixed) and give 6 checkable behaviours: texting habits, reaction to silence, jealousy, space needs.']]},
 {id:'soulmate',ico:'🔮',t:'Soulmate & karmic love',kw:'soulmate twin flame karmic past life rahu ketu connection destiny',h:[5,7,8,12],s:[11,1],k:['Rahu','Ketu','Venus'],ck:'Darakaraka',v:'D9',ar:['UL'],subs:[
  ['Karmic love pattern','Using Rahu/Ketu, Venus and the 5th/7th/8th/12th, give 6 specific karmic patterns in my love life (repeating situations, a type of person, a lesson).'],
  ['Past-life love debts','Give 5 plain-language signs of unfinished love karma and how it shows up in my life now.'],
  ['Is this a soulmate or a lesson?','Give 8 checkable signs that separate a soulmate-type bond from a karmic lesson for my chart, so I can judge my current relationship.'],
  ['The one who comes back','Will an ex or old lover return? Give a verdict with a percentage and 4 reasons.'],
  ['Healing karmic ties','Give 6 practical steps and traditional remedies to heal karmic love knots.']]},
 {id:'chemistry',ico:'🔥',t:'Chemistry & intimacy',kw:'romance passion physical attraction desire bedroom chemistry intimacy',h:[7,8,12],s:[5,2],k:['Venus','Mars','Moon'],ck:'Darakaraka',v:'D9',ar:['UL'],subs:[
  ['My attraction style','Describe in 7 tasteful, specific bullets what draws me to someone, how I flirt, and how fast I open up.'],
  ['Emotional vs physical needs','Give a balanced view of my emotional versus physical needs in a relationship in 6 bullets.'],
  ['What keeps the spark alive','List 8 practical things that keep romance and closeness alive for me.'],
  ['Mismatch risks','List 5 chemistry mismatches to watch for in a partner and how to talk about them kindly.']]},
 {id:'breakup',ico:'💔',t:'Breakups & healing',kw:'breakup heartbreak separation divorce cheating betrayal move on pain',h:[7,8,12],s:[5,6],k:['Saturn','Mars','Rahu'],ck:'Darakaraka',v:'D9',ar:['UL','A7'],subs:[
  ['Why relationships break for me','Give 7 specific, checkable reasons my relationships may strain or end, tied to my chart (no generic lines).'],
  ['Breakup or divorce risk','Give a direct risk level (low / medium / high) for lasting separation and the 4 main factors.'],
  ['Trust & loyalty patterns','List 6 patterns around trust, loyalty and secrecy for me and for my partner type.'],
  ['How I heal','Give 8 specific steps for how I personally heal after heartbreak, and how long it tends to take.'],
  ['Danger periods','List the next 3 periods (with years) where relationships need extra care, and what to do in each.']]},
 {id:'partnerfit',ico:'🧩',t:'Ideal partner & red flags',kw:'ideal partner compatibility match red flags green flags zodiac sign suits me',h:[7,1,5],s:[11,2],k:['Venus','Jupiter'],ck:'Darakaraka',v:'D9',ar:['UL'],subs:[
  ['My ideal partner profile','Describe my ideal partner in 10 bullets: temperament, values, communication style, ambition level, family attitude.'],
  ['Best 5 signs/nakshatras for me','Rank the 5 zodiac signs and 5 nakshatras that match me best, with one line why.'],
  ['Red flags for me','List 8 partner red flags specifically dangerous for me, and 5 green flags to look for.'],
  ['Age gap & distance','Say whether an age gap, long distance or a partner from another city, culture or country suits me, with reasons.'],
  ['Questions to ask before committing','Give 10 sharp questions I should ask a partner before committing, based on my chart weak spots.']]},
 {id:'marriedlife',ico:'🏠',t:'Married life & in-laws',kw:'after marriage husband wife in-laws family home harmony fights',h:[7,4,2],s:[8,12,10],k:['Venus','Moon','Jupiter'],ck:'Darakaraka',v:'D9',ar:['UL','A4'],subs:[
  ['Daily life after marriage','Describe in 8 checkable bullets how my married life looks day to day: who leads, fights, money, home.'],
  ['In-laws & family','Give 6 bullets on my relationship with in-laws and joint-family dynamics.'],
  ['Common fights & solutions','List my 6 most likely arguments and a solution for each.'],
  ['Spouse\'s support & career','How will my spouse help or affect my career and money? 6 bullets.'],
  ['Marriage strong years','List the 3 strongest and 2 testing phases of my marriage by age window.']]},
 {id:'children',ico:'👶',t:'Children & progeny',kw:'kids baby child birth pregnancy fertility',h:[5],s:[2,9,11],k:['Jupiter'],ck:'Putrakaraka',v:'D7',ar:['A5'],subs:[
  ['Children: outlook','Give a direct outlook on having children (easy / some delay / needs care) with a one-line reason.'],
  ['Best years for children','List the 3 most favourable years/windows.'],
  ['My child\'s nature','Describe the kind of child(ren) I am likely to have in 6 bullets and my parenting style.'],
  ['Support & remedies','List 5 practical supports or traditional remedies that help.']]},
 {id:'education',ico:'🎓',t:'Education & learning',kw:'study college exams degree knowledge',h:[4,5],s:[9,2],k:['Mercury','Jupiter'],ck:'Putrakaraka',v:'D24',ar:[],subs:[
  ['15 best subjects/degrees','List 15 subjects or degrees ranked by fit.'],
  ['How I learn best','Give 8 specific, checkable learning habits: best time of day, format, memory style, subjects I struggle with, how I react to exams.'],
  ['Exam & degree timing','List the best years/windows for exams, admissions or a new course.'],
  ['Study abroad chance','Give a direct verdict on studying abroad, best regions, and best timing.']]},
 {id:'health',ico:'🩺',t:'Health & vitality',kw:'disease illness body fitness immunity',h:[1,6],s:[8,12],k:['Sun','Moon','Mars'],ck:'Atmakaraka',v:'D30',ar:['A6'],subs:[
  ['Strong & sensitive areas','List my body areas from strongest to most sensitive, one line each (traditional astrology, not medical advice).'],
  ['Habits that suit me','List 8 daily habits, foods and exercise types that suit me.'],
  ['Care periods','List the periods that need extra care and the periods of strong vitality (balanced, non-fearful).'],
  ['Stress & sleep','Give 5 tips for my stress and sleep pattern.']]},
 {id:'mind',ico:'🧠',t:'Mind & emotional peace',kw:'stress anxiety depression mood happiness',h:[4,1],s:[5,12],k:['Moon','Mercury'],ck:'Atmakaraka',v:'D1',ar:[],subs:[
  ['My stress triggers','List 8 very specific situations that spike my stress (types of people, settings, deadlines, noise, money, health) that I can verify from my own past.'],
  ['Mood pattern','Give 8 specific, checkable mood patterns: times of day/month/year I dip or peak, what triggers a swing, how long it lasts, what I do when low.'],
  ['Habits for peace','List 8 daily practices that bring me peace.'],
  ['Best calming practices','Rank 8 practices (meditation, music, nature, prayer, exercise...) by how well they suit me.']]},
 {id:'longevity',ico:'⏳',t:'Resilience & sudden changes',kw:'life span accidents surgery transformation 8th house',h:[8,1],s:[3,6,12],k:['Saturn'],ck:'Atmakaraka',v:'D30',ar:['A8'],subs:[
  ['Sudden-change areas','List the life areas where sudden change is most likely, ranked, with a calm tone.'],
  ['Sensitive periods','List the next 3 sensitive periods and how to handle each (balanced, no fear).'],
  ['Protective habits','List 6 habits that protect me.']]},
 {id:'father',ico:'👨',t:'Father & mentors',kw:'dad guru teacher blessings',h:[9],s:[10,3],k:['Sun','Jupiter'],ck:'',v:'D12',ar:['A9'],subs:[
  ['Bond with father','Give 8 specific, checkable facts about my relationship with my father: closeness/distance phases with ages, conflict style, how he shaped my career, health or support issues.'],
  ['Father\'s nature & work','Describe my father\'s likely nature and 5 likely professions.'],
  ['Mentors & gurus','Describe the type of mentor/teacher who helps me and when they appear.']]},
 {id:'mother',ico:'👩',t:'Mother & home life',kw:'mom family happiness domestic',h:[4],s:[10,9],k:['Moon'],ck:'Matrikaraka',v:'D12',ar:['A4'],subs:[
  ['Bond with mother','Give 8 specific, checkable facts about my relationship with my mother: closeness/distance phases with ages, conflict style, her health or role at home, what I got or missed from her.'],
  ['Home happiness','Give 8 specific, checkable facts about my home life (moves, property disputes, noise/peace, who dominates, mother\'s role) and 3 fixes.']]},
 {id:'siblings',ico:'🧑‍🤝‍🧑',t:'Siblings & courage',kw:'brother sister effort initiative',h:[3],s:[11,1],k:['Mars'],ck:'Bhratrikaraka',v:'D3',ar:['A3'],subs:[
  ['Siblings','Give 8 specific, checkable facts about my siblings situation (number tendency, birth order feel, age gaps, closeness, rivalry, who helps whom).'],
  ['My courage & effort style','Give 8 specific, checkable ways I take initiative, handle risk, react to dares or competition, and where I hold back.']]},
 {id:'property',ico:'🏠',t:'Property, home & vehicles',kw:'house land real estate car buy flat',h:[4],s:[2,11,12],k:['Mars','Venus','Saturn'],ck:'Matrikaraka',v:'D4',ar:['A4'],subs:[
  ['Will I own property?','Give a direct verdict and the likely age/year range.'],
  ['What suits me','Rank: house, flat, land, farm, commercial, vehicle, with a one-line reason each.'],
  ['Where to buy','Describe the best type of location/direction and city style for me.'],
  ['Best years to buy','List the best 3 years/windows to buy property or a vehicle.']]},
 {id:'foreign',ico:'✈️',t:'Foreign travel & settlement',kw:'abroad visa immigration relocate overseas',h:[12,9],s:[3,7,4],k:['Rahu','Moon'],ck:'',v:'D1',ar:[],subs:[
  ['Will I go abroad?','Give a direct verdict with a percentage and the type: study, work, settle, or travel.'],
  ['10 best countries/regions','List 10 countries or regions ranked by fit for me.'],
  ['Best years to go','List the best 3 years/windows to travel, move or study abroad.']]},
 {id:'enemies',ico:'⚔️',t:'Rivals, debts & disputes',kw:'enemies litigation court competition loans conflict',h:[6],s:[8,12,3],k:['Mars','Saturn'],ck:'Gnatikaraka',v:'D1',ar:['A6'],subs:[
  ['Types of rivals','Describe the kind of rivals/opponents I face in 6 bullets.'],
  ['Debt & legal risk','Give a calm verdict on debt and legal-dispute risk and 5 ways to stay safe.'],
  ['How I win','List 6 strategies that work best for me in conflicts.']]},
 {id:'spiritual',ico:'🕉️',t:'Spirituality & moksha',kw:'meditation dharma purpose inner growth',h:[9,12],s:[5,8],k:['Ketu','Jupiter'],ck:'Atmakaraka',v:'D20',ar:[],subs:[
  ['8 paths that suit me','List 8 spiritual paths/practices (bhakti, meditation, yoga, service, study...) ranked.'],
  ['Traditional mantra / deity leaning','Name the traditional deities or mantras that match my chart (3-5) and a simple daily practice.'],
  ['When spirituality deepens','List the best periods for spiritual growth.']]},
 {id:'karma',ico:'🔮',t:'Karma & past life',kw:'karmic lessons rahu ketu dosha pitru kala sarpa mangal past life debt',h:[5,9,12,8],s:[1],k:['Rahu','Ketu','Saturn'],ck:'Atmakaraka',v:'D60',ar:[],subs:[
  ['My karmic lessons','List my top 6 karmic lessons in this life in plain words, one line each.'],
  ['Past-life gifts','List 8 talents or instincts that feel naturally mine (likely carried from the past).'],
  ['Repeating patterns','List 5 relationship/life patterns that repeat for me and how to break each.'],
  ['Doshas explained simply','Using DOSHA FACTS, say which doshas apply (Mangal, Kala Sarpa, Pitru, Shani), in plain words, with how serious each is and 3 traditional remedies.'],
  ['Soul\'s mission','In 3 short lines, say my soul\'s mission and what to focus on.']]},
 {id:'purpose',ico:'🧭',t:'Personality & life purpose',kw:'nature character soul atmakaraka self',h:[1],s:[5,9],k:['Sun','Moon'],ck:'Atmakaraka',v:'D9',ar:['AL'],subs:[
  ['My top 10 strengths','Give 10 specific strengths shown as concrete behaviours that others have actually noticed in me, with the situation where each shows.'],
  ['5 weaknesses & fixes','List 5 weaknesses as concrete recurring mistakes (with the typical situation where each happens), each with one practical fix.'],
  ['Life purpose','State my life direction in 3 lines using specific themes from the data (no motivational clichés) and name 3 concrete fields or life areas where it plays out.'],
  ['Traditional lucky aids','List my traditional lucky colour, day, number, direction and gem (for fun, traditional).']]},
 {id:'friends',ico:'🤝',t:'Friends, networks & gains',kw:'social circle allies fulfilment desires',h:[11],s:[3,7,5],k:['Jupiter','Mercury'],ck:'',v:'D1',ar:['A11'],subs:[
  ['My friend types','Give 8 specific traits of the friends I attract: age gap, profession types, how friendships start and end, who supports me and who lets me down.'],
  ['Networking strengths','List how I gain from networks and 5 ways to use it.']]},
 {id:'losses',ico:'📉',t:'Expenses, losses & sleep',kw:'spending waste hospital isolation bed',h:[12],s:[2,6,8],k:['Saturn','Ketu'],ck:'',v:'D1',ar:[],subs:[
  ['Where money leaks','List my top 6 spending leaks and a fix each.'],
  ['Sleep & rest','Describe my sleep pattern and 5 tips.'],
  ['Hidden fears','List 5 hidden fears or blocks and how to ease them.']]},
 {id:'talent',ico:'🎨',t:'Talent, creativity & arts',kw:'music art writing skill hobby entertainment',h:[5,3],s:[10,11],k:['Venus','Mercury','Moon'],ck:'Putrakaraka',v:'D9',ar:[],subs:[
  ['15 creative fields','List 15 creative fields ranked by fit for me.'],
  ['Natural talents','List 8 natural talents as concrete things I picked up fast without training, with the age or situation where it showed.'],
  ['Hobbies that suit me','List 8 hobbies that recharge me.']]},
 {id:'inherit',ico:'🏦',t:'Inheritance & hidden wealth',kw:'will insurance partner money legacy',h:[8,2],s:[11,7],k:['Saturn','Jupiter'],ck:'',v:'D1',ar:['A8'],subs:[
  ['Inheritance outlook','Give a direct outlook on inheritance and family wealth.'],
  ['Partner / insurance money','Describe money from partners, insurance or sudden sources in 5 bullets.']]},
 {id:'thisyear',ico:'🗓️',t:'This year & next 12 months',kw:'forecast prediction timing dasha transit now upcoming',h:[1,10,7,2,11],s:[4,5,9],k:['Jupiter','Saturn'],ck:'',v:'D1',ar:[],subs:[
  ['Month-by-month next 12 months','List the next 12 months, one line each: theme + one thing to do.'],
  ['Best 3 & toughest 3 months','Name my best 3 and toughest 3 months in the next 12, with a short reason.'],
  ['Do & avoid this year','Give 6 things to do and 6 things to avoid this year.']]}
];
SRCH_TOPICS.forEach(tp=>{ if (tp.id==='me') return;
  tp.subs.unshift(['🪞 10 precise checks: '+tp.t, 'Give exactly 10 precise, self-verifiable statements about my '+tp.t.toLowerCase()+': specific behaviours, past events, situations, habits or age windows I can check against my own life. Nothing that fits most people. Each bullet: the statement, then 🔎 Because (exact combination), then a ✔/✖ test I can do.']);
});
function srchHouseLine(ch, L, h){
  const pr = ch.planets, si = (L+h-1)%12, s = SIGNS[si], lp = pr[s.lord];
  const occ = PLANET_LIST.filter(n=> pr[n] && pr[n].house===h);
  const asp = PLANET_LIST.filter(n=> pr[n] && pr[n].house!==h && (pr[n].aspectsHouses||[]).indexOf(h)>-1);
  return `H${h} ${s.name}: lord ${s.lord}${lp?` in H${lp.house} ${SIGNS[lp.sign].name}${srchDig(lp)}${lp.retrograde?' Retro':''}`:''}; occ ${occ.length?occ.join(','):'none'}; aspected by ${asp.length?asp.join(','):'none'}`;
}
function srchVargaPos(ch, vk, name){
  try { const v = ch.vargas[vk]; for (const hh of v.houses){ if (hh.planets.some(x=>x.name===name)) return `${name} ${hh.signName} H${hh.houseNum}`; } } catch(e){} return '';
}
function srchDoshas(ch){
  const pr = ch.planets, L = ch.ascendant.sign, out = [];
  const mh = rsHouseOf(pr.Mars.sign, L); out.push(`Mangal dosha (Mars in H${mh}): ${[1,2,4,7,8,12].indexOf(mh)>-1?'present':'absent'}`);
  const r = pr.Rahu.longitude, k = pr.Ketu.longitude, inArc = lon=> ((lon - r + 360) % 360) < ((k - r + 360) % 360);
  const others = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'], a = others.filter(n=>inArc(pr[n].longitude)).length;
  out.push(`Kala Sarpa: ${a===7||a===0?'present (all planets on one side of Rahu-Ketu)':'absent'}`);
  const sa = pr.Sun.house; out.push(`Pitru dosha hint: Sun with ${['Rahu','Ketu','Saturn'].filter(n=>pr[n].house===sa).join('/')||'no node/Saturn'} in H${sa}; 9th house occupants ${PLANET_LIST.filter(n=>pr[n].house===9).join(',')||'none'}`);
  const sh = pr.Saturn.house; out.push(`Saturn in H${sh}${sh===7||sh===1||sh===4||sh===8||sh===12?' (Shani dosha-type placement)':''}`);
  return out.join('; ');
}
function srchDig(p){ const st = p.dignity && p.dignity.status; return st==='Exalted'?' Exalted':st==='Debilitated'?' Debilitated':st==='OwnSign'?' OwnSign':st==='Moolatrikona'?' Moolatrikona':''; }
function srchPlanetLine(ch, n){
  const p = ch.planets[n]; if (!p) return '';
  return `${n} in ${SIGNS[p.sign].name} ${Math.floor(p.degInSign)}° H${p.house}${srchDig(p)}${p.retrograde?' Retro':''}${p.combustion&&p.combustion.combust?' Combust':''}`;
}
function srchAspects(ch){
  const pr = ch.planets, out = [];
  PLANET_LIST.forEach(a=>{
    const p = pr[a]; if (!p) return; const t = [];
    (p.aspectsHouses||[]).forEach(h=>{
      PLANET_LIST.forEach(b=>{ if (b!==a && pr[b] && pr[b].house===h) t.push(b); });
      if (h===1) t.push('Lagna');
    });
    if (t.length) out.push(`${a}(H${p.house}) aspects ${t.join(', ')}`);
  });
  return out;
}
function srchConj(ch){
  const pr = ch.planets, L = ch.ascendant.sign, out = [];
  for (let h=1; h<=12; h++){
    const occ = PLANET_LIST.filter(n=> pr[n] && pr[n].house===h);
    if (occ.length>=2) out.push(`H${h} ${SIGNS[(L+h-1)%12].name}: ${occ.join('+')}`);
  }
  return out;
}
function srchBrief(tp, sub, cap){
  const ch = currentChartForModal; if (!ch) return '';
  const L = ch.ascendant.sign, pr = ch.planets, S = [];  // S = [priority, text]
  const lordP = pr[SIGNS[L].lord];
  S.push([0,'LAGNA: '+SIGNS[L].name+' '+Math.floor(ch.ascendant.degInSign)+'°'+(ch.ascendant.nakshatra?', '+ch.ascendant.nakshatra.name:'')+'; lord '+SIGNS[L].lord+(lordP?' in '+SIGNS[lordP.sign].name+' H'+lordP.house:'')]);
  S.push([0,'PLANETS (exact): '+PLANET_LIST.map(n=>{ const p = pr[n]; return `${n} ${SIGNS[p.sign].name} ${Math.floor(p.degInSign)}° H${p.house}${p.nakshatra?' '+p.nakshatra.name:''}${srchDig(p)}${p.retrograde?' Retro':''}${p.combustion&&p.combustion.combust?' Combust':''}`; }).join('; ')]);
  const cj = srchConj(ch); if (cj.length) S.push([0,'CONJUNCTIONS: '+cj.join('; ')]);
  const as = srchAspects(ch); if (as.length) S.push([0,'ASPECTS (drishti): '+as.join('; ')]);
  S.push([1,'KEY HOUSES: '+tp.h.concat(tp.s.slice(0,2)).map(h=>srchHouseLine(ch,L,h)).join(' | ')]);
  try {
    const act = findActiveDasha(ch.dashaData.mahadashas, new Date());
    if (act && act.mahadasha){
      const ds = [['MD',act.mahadasha],['AD',act.antardasha],['PD',act.pratyantardasha]].filter(x=>x[1]).map(([nm,x])=>{
        const lk = rsLinks(x.lord, L, ch), hit = Object.keys(lk).filter(h=> tp.h.indexOf(+h)>-1 || tp.s.indexOf(+h)>-1).map(h=>lk[h]);
        return `${nm} ${x.lord}${hit.length?' ('+hit.join(', ')+')':''}`; });
      S.push([1,`DASHA NOW: ${ds.join(' / ')}${act.antardasha?` (AD until ${act.antardasha.endDate.toISOString().slice(0,10)})`:''}`]);
    }
  } catch(e){}
  if (tp.id==='karma' || tp.id==='spouse' || tp.id==='marriagetime' || tp.id==='me') { try { S.push([1,'DOSHA FACTS: ' + srchDoshas(ch)]); } catch(e){} }
  if (tp.ck && ch.charaKarakas && ch.charaKarakas[tp.ck]){ const n = ch.charaKarakas[tp.ck].planet; S.push([2,`${tp.ck}: ${srchPlanetLine(ch,n)}${srchVargaPos(ch,'D9',n)?'; D9 '+srchVargaPos(ch,'D9',n):''}`]); }
  if (tp.k.length) S.push([2,'TOPIC KARAKAS: '+tp.k.map(n=>srchPlanetLine(ch,n)).filter(Boolean).join('; ')]);
  if (tp.v && tp.v!=='D1' && ch.vargas[tp.v]){
    const vv = ch.vargas[tp.v], lord = SIGNS[vv.ascendantSign].lord, kp = tp.k.map(n=>srchVargaPos(ch,tp.v,n)).filter(Boolean);
    S.push([3,`${tp.v}: lagna ${SIGNS[vv.ascendantSign].name}, lord ${lord}${srchVargaPos(ch,tp.v,lord)?' ('+srchVargaPos(ch,tp.v,lord).replace(lord+' ','')+')':''}${kp.length?'; '+kp.join(', '):''}`]);
  }
  try {
    const ar = calcAllArudhaPadas(ch, L), a = (tp.ar||[]).filter(k=>ar[k]!==undefined).map(k=>`${k} ${SIGNS[ar[k]].name} H${((ar[k]-L+12)%12)+1}`);
    if (a.length) S.push([3,'ARUDHA: ' + a.join(', ')]);
  } catch(e){}
  try {
    const jd = nowJulianDay(), mo = pr.Moon.sign, T = ['Saturn','Jupiter','Rahu'].map(n=>{ const sg = Math.floor(getSiderealLongitudeAt(n, jd)/30); return `${n} ${SIGNS[sg].name} H${rsHouseOf(sg,L)}(from Moon H${rsHouseOf(sg,mo)})`; });
    S.push([4,`TRANSITS ${new Date().toISOString().slice(0,10)}: ${T.join('; ')}`]);
  } catch(e){}
  const q = sub ? sub[1] : ('Give a precise overview of ' + tp.t.toLowerCase() + ' for me.');
  const head = `Act as an expert Vedic astrologer.\nTOPIC: ${tp.t}${sub?' › '+sub[0]:''}\nQUESTION: ${q}\n${SRCH_STYLE}\nCHART DATA (authoritative):\n`;
  let keep = S.slice();
  const len = ()=> head.length + keep.map(x=>x[1]).join('\n').length;
  while (cap && len() > cap){ const mx = Math.max.apply(null, keep.map(x=>x[0])); if (mx===0) break; const idx = keep.map(x=>x[0]).lastIndexOf(mx); keep.splice(idx,1); }
  return head + keep.map(x=>x[1]).join('\n');
}
function srchAsk(tp, sub, copyOnly){
  const full = srchBrief(tp, sub, 0); if (!full){ rsToast('Generate a chart first'); return; }
  try { if (navigator.clipboard) navigator.clipboard.writeText(full).catch(function(){}); } catch(e){}
  if (copyOnly){ rsToast('Full AI brief copied ✓ — paste it into any AI'); return; }
  const text = srchBrief(tp, sub, 2700);
  window.open('https://www.google.com/search?q=' + encodeURIComponent(text) + '&udm=50', '_blank', 'noopener');
  rsToast('Opening Google AI · full brief also copied 📋');
}
function srchTopicBox(i){
  const tp = SRCH_TOPICS[i], list = document.getElementById('srchList'); if (!tp || !list) return;
  srchRows = tp.subs.map(sb=>({k:'ask',ico:tp.ico,t:sb[0],s:sb[1],tp,sub:sb,q:tp.t}));
  list.innerHTML = `<div class="srch-box2 sticky"><button type="button" class="srch-back" data-back="1">← All topics</button><div class="srch-h2">${tp.ico} ${rsEsc(tp.t)} <span class="srch-sub">pick a question · opens Google AI</span></div></div>` + srchRows.map((r,j)=> srchRowHTML(r,j)).join('') +
    `<div class="srch-row" data-i="${srchRows.length}" data-k="ask"><span class="srch-ico">✨</span><div class="srch-txt"><b>Quick overview</b><small>One short summary of ${rsEsc(tp.t.toLowerCase())}</small></div><span class="srch-tag">Ask AI</span></div>`;
  srchRows.push({k:'ask',ico:'✨',t:'Quick overview',s:'',tp,sub:null,q:tp.t});
  srchSel = 0; const f = list.querySelector('.srch-row'); if (f) f.classList.add('sel'); list.scrollTop = 0;
}


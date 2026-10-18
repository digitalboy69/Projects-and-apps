/* ============================================================================
   NAKSHATRA LAYER (VNK): a structured database that works for ANY placement, not a list of fixed sentences.
   Layer schema v1 (every reading layer follows this idea):  facts in -> facets out -> text composed from the facets.
     facets   = style, keywords, strengths[], shadows[] (points to watch), relating, wellbeing, practices[] (supportive actions)
     scores   = ease (-0.5 .. +1) and tone (supportive / mixed / challenging), so a rules engine can combine layers later
     tags     = ['planet:Mars','nakshatra:Rohini','pada:2','nature:Fixed','purushartha:Artha','relation:friend'] for filtering/search
   Wording is about tendencies and potential ("tends to", "can"), never fixed fate.

   COVERAGE: 27 nakshatras x 4 padas x 9 planets = 972 placements, plus Lagna (108) and Moon birth star, all generated on demand.
     VNK.nakshatra(i)                      facets of nakshatra i (0 = Ashwini) merged with VDB trait/deity/symbol/gana/careers
     VNK.pada(i, p)                        navamsa sign of the pada, its element and Purushartha flavour (Dharma/Artha/Kama/Moksha)
     VNK.placement(planet, i, p)           full structured result + composed `text` for one planet in one nakshatra pada
     VNK.lagna(i, p), VNK.moon(i, p, dasha)   the same idea for the rising nakshatra and the birth star
     VNK.forChart(chart)                   everything above for a computeChart() result (+ where each nakshatra lord sits)
     VNK.each(cb) / VNK.find({...})        walk or filter all 972 placements (used by tests and the future rules engine)
   Hand-written: nakshatra facets and planet facets (below). Rule-based: relation to the nakshatra lord, pada flavour, composition.
   Needs js/87-vedic-knowledge-db.js (VDB). Edit a facet below and every placement that uses it updates.
   ============================================================================ */
const VNK_DATA = {
 "schema": "layer-v1",
 "nature": {
  "Swift": {
   "sk": "Kshipra / Laghu",
   "tendency": "quick and light: good for fast starts, trade, travel and healing; can be hasty"
  },
  "Fixed": {
   "sk": "Dhruva / Sthira",
   "tendency": "stable and enduring: good for building, institutions and lasting commitments; can resist change"
  },
  "Movable": {
   "sk": "Chara / Chala",
   "tendency": "mobile and adaptable: good for travel, trade and learning; can lack roots"
  },
  "Sharp": {
   "sk": "Tikshna / Daruna",
   "tendency": "sharp and intense: good for research, surgery-like precision and breakthroughs; can be harsh"
  },
  "Fierce": {
   "sk": "Ugra / Krura",
   "tendency": "forceful and driven: good for effort and endurance; can be heavy-handed"
  },
  "Soft": {
   "sk": "Mridu / Maitra",
   "tendency": "gentle and friendly: good for the arts, friendship and refined work; can avoid conflict"
  },
  "Mixed": {
   "sk": "Mishra / Sadharana",
   "tendency": "a blend of qualities: practical and versatile; results depend on the planet placed here"
  }
 },
 "planet": {
  "Sun": {
   "drive": "confidence and need for recognition",
   "domains": [
    "identity",
    "authority",
    "vitality"
   ],
   "gives": [
    "a clear sense of purpose",
    "natural presence"
   ],
   "shadows": [
    "pride",
    "a need for approval"
   ],
   "practice": "Lead by serving a purpose bigger than status."
  },
  "Moon": {
   "drive": "feelings and need for security",
   "domains": [
    "mind",
    "emotions",
    "home"
   ],
   "gives": [
    "emotional intelligence",
    "a nurturing instinct"
   ],
   "shadows": [
    "mood swings",
    "dependence on comfort"
   ],
   "practice": "Build a calming daily routine."
  },
  "Mars": {
   "drive": "energy and courage",
   "domains": [
    "action",
    "drive",
    "protection"
   ],
   "gives": [
    "the drive to act",
    "protective courage"
   ],
   "shadows": [
    "anger",
    "haste"
   ],
   "practice": "Give your energy a daily physical outlet."
  },
  "Mercury": {
   "drive": "thinking and communication",
   "domains": [
    "intellect",
    "speech",
    "skills"
   ],
   "gives": [
    "quick learning",
    "clear expression"
   ],
   "shadows": [
    "overthinking",
    "scattered focus"
   ],
   "practice": "Write things down and do one task at a time."
  },
  "Jupiter": {
   "drive": "wisdom and optimism",
   "domains": [
    "wisdom",
    "growth",
    "guidance"
   ],
   "gives": [
    "good judgement",
    "generous guidance"
   ],
   "shadows": [
    "over-confidence",
    "excess"
   ],
   "practice": "Match optimism with a concrete plan."
  },
  "Venus": {
   "drive": "affection and sense of beauty",
   "domains": [
    "love",
    "harmony",
    "comfort"
   ],
   "gives": [
    "charm",
    "an appreciation of harmony"
   ],
   "shadows": [
    "indulgence",
    "people-pleasing"
   ],
   "practice": "Choose quality and keep your boundaries."
  },
  "Saturn": {
   "drive": "discipline and sense of duty",
   "domains": [
    "discipline",
    "structure",
    "time"
   ],
   "gives": [
    "perseverance",
    "reliability"
   ],
   "shadows": [
    "pessimism",
    "over-restriction"
   ],
   "practice": "Build in steady steps and include rest."
  },
  "Rahu": {
   "drive": "ambition and hunger for the new",
   "domains": [
    "ambition",
    "innovation",
    "the unusual"
   ],
   "gives": [
    "bold innovation",
    "openness to the unusual"
   ],
   "shadows": [
    "obsession",
    "shortcuts"
   ],
   "practice": "Check your ambitions against your values."
  },
  "Ketu": {
   "drive": "detachment and inner knowing",
   "domains": [
    "intuition",
    "detachment",
    "research"
   ],
   "gives": [
    "intuition",
    "the ability to let go"
   ],
   "shadows": [
    "withdrawal",
    "loss of interest"
   ],
   "practice": "Stay engaged with one practical commitment."
  }
 },
 "purushartha": {
  "Fire": {
   "name": "Dharma",
   "focus": "purpose, ideals and right action"
  },
  "Earth": {
   "name": "Artha",
   "focus": "practical results, resources and security"
  },
  "Air": {
   "name": "Kama",
   "focus": "desire, connection and enjoyment"
  },
  "Water": {
   "name": "Moksha",
   "focus": "inner growth, release and meaning"
  }
 },
 "nakshatras": [
  {
   "nature": "Swift",
   "style": "quickly, instinctively and with a healer's reflex",
   "keywords": [
    "speed",
    "beginnings",
    "healing",
    "initiative"
   ],
   "strengths": [
    "fast start-up energy",
    "a practical healing instinct",
    "the courage to go first"
   ],
   "shadows": [
    "impatience",
    "starting more than finishing",
    "recklessness under pressure"
   ],
   "relating": "direct, energetic, quick to help and quick to move on",
   "wellbeing": "restless energy that needs regular movement and rest",
   "practices": [
    "Finish one thing before starting the next.",
    "Build a short daily movement habit."
   ]
  },
  {
   "nature": "Fierce",
   "style": "intensely, with a strong sense of duty and the will to carry things through",
   "keywords": [
    "endurance",
    "responsibility",
    "transformation",
    "restraint"
   ],
   "strengths": [
    "the ability to carry heavy loads",
    "a strong sense of fairness",
    "deep creative life-force"
   ],
   "shadows": [
    "all-or-nothing swings",
    "guilt or self-denial",
    "intensity in love and desire"
   ],
   "relating": "loyal and intense; takes commitments very seriously",
   "wellbeing": "pressure that builds quietly and needs outlets for strong feelings",
   "practices": [
    "Share the load instead of carrying it alone.",
    "Give strong feelings a creative outlet."
   ]
  },
  {
   "nature": "Mixed",
   "style": "sharply and decisively, cutting to what matters",
   "keywords": [
    "clarity",
    "purification",
    "courage",
    "standards"
   ],
   "strengths": [
    "clear judgement",
    "a refusal to fake things",
    "protective leadership"
   ],
   "shadows": [
    "a sharp tongue",
    "harsh criticism",
    "burning out"
   ],
   "relating": "honest to the point of bluntness and protective of those they care about",
   "wellbeing": "stress that tends to show up as irritability and heat",
   "practices": [
    "Pause before correcting others.",
    "Balance high standards with warmth."
   ]
  },
  {
   "nature": "Fixed",
   "style": "steadily, with charm and a taste for beauty and growth",
   "keywords": [
    "growth",
    "beauty",
    "comfort",
    "fertility"
   ],
   "strengths": [
    "magnetic charm",
    "a nurturing and creative streak",
    "the ability to build and sustain things"
   ],
   "shadows": [
    "possessiveness",
    "attachment to comfort",
    "resistance to change"
   ],
   "relating": "affectionate and sensual; wants security and loyalty",
   "wellbeing": "comfort habits that can slide into excess",
   "practices": [
    "Treat comfort as a tool, not a goal.",
    "Practise letting go of small things."
   ]
  },
  {
   "nature": "Soft",
   "style": "curiously, searching and sampling before settling",
   "keywords": [
    "seeking",
    "curiosity",
    "gentleness",
    "travel"
   ],
   "strengths": [
    "a curious, quick learner",
    "a gentle and graceful manner",
    "easy adaptability"
   ],
   "shadows": [
    "restlessness",
    "difficulty committing",
    "a scattered search"
   ],
   "relating": "friendly, light and curious; needs freedom",
   "wellbeing": "a mind that keeps moving and needs quiet time",
   "practices": [
    "Pick one question and follow it deeply.",
    "Schedule unplanned time to wander."
   ]
  },
  {
   "nature": "Sharp",
   "style": "intensely, through storms that clear the air and renew",
   "keywords": [
    "storm",
    "renewal",
    "intellect",
    "honesty"
   ],
   "strengths": [
    "a sharp analytical mind",
    "resilience after upheaval",
    "the courage to tell the truth"
   ],
   "shadows": [
    "emotional storms",
    "harshness under stress",
    "restless dissatisfaction"
   ],
   "relating": "intense and honest; changes deeply through relationships",
   "wellbeing": "mental overheating that eases with calm routines",
   "practices": [
    "Let feelings settle before big decisions.",
    "Channel intensity into problem-solving or writing."
   ]
  },
  {
   "nature": "Movable",
   "style": "with renewal and optimism, bouncing back after setbacks",
   "keywords": [
    "return",
    "renewal",
    "optimism",
    "home"
   ],
   "strengths": [
    "resilience",
    "a forgiving nature",
    "a talent for starting over"
   ],
   "shadows": [
    "over-trusting",
    "drifting between plans",
    "avoiding conflict"
   ],
   "relating": "kind, tolerant and easy to be with; values home and family",
   "wellbeing": "a need for a stable routine and a home base",
   "practices": [
    "Give optimism a clear plan.",
    "Say no early and kindly."
   ]
  },
  {
   "nature": "Swift",
   "style": "by nourishing and supporting, steadily and out of duty",
   "keywords": [
    "nourishment",
    "guidance",
    "duty",
    "protection"
   ],
   "strengths": [
    "dependable care for others",
    "wise counsel",
    "steady discipline"
   ],
   "shadows": [
    "rigidity",
    "over-responsibility",
    "difficulty receiving help"
   ],
   "relating": "supportive and responsible; shows love through service",
   "wellbeing": "duty that can crowd out rest",
   "practices": [
    "Schedule rest as if it were a responsibility.",
    "Let others support you too."
   ]
  },
  {
   "nature": "Sharp",
   "style": "perceptively and strategically, reading what lies beneath the surface",
   "keywords": [
    "insight",
    "strategy",
    "privacy",
    "magnetism"
   ],
   "strengths": [
    "deep psychological insight",
    "a strategic mind",
    "strong intuition about people"
   ],
   "shadows": [
    "mistrust",
    "guardedness or manipulation under stress",
    "holding on to grievances"
   ],
   "relating": "magnetic, private and slow to trust",
   "wellbeing": "tension held inside that needs trusted outlets",
   "practices": [
    "Test trust gradually instead of expecting betrayal.",
    "Use insight to help, not to control."
   ]
  },
  {
   "nature": "Fierce",
   "style": "with dignity and a sense of lineage and responsibility",
   "keywords": [
    "heritage",
    "authority",
    "honour",
    "tradition"
   ],
   "strengths": [
    "natural authority",
    "respect for roots",
    "the generosity of a leader"
   ],
   "shadows": [
    "pride",
    "a need for recognition",
    "clinging to status or old ways"
   ],
   "relating": "loyal and proud; wants respect",
   "wellbeing": "pride that can hide stress",
   "practices": [
    "Earn authority through service.",
    "Ask for feedback you may not enjoy."
   ]
  },
  {
   "nature": "Fierce",
   "style": "warmly and playfully, with a love of pleasure and celebration",
   "keywords": [
    "enjoyment",
    "creativity",
    "romance",
    "rest"
   ],
   "strengths": [
    "warmth and charm",
    "creative flair",
    "a gift for enjoying life"
   ],
   "shadows": [
    "laziness",
    "indulgence",
    "avoiding effort"
   ],
   "relating": "affectionate and sociable; needs romance and fun",
   "wellbeing": "pleasure habits that can outrun discipline",
   "practices": [
    "Pair every pleasure with one productive habit.",
    "Create regularly, even when not inspired."
   ]
  },
  {
   "nature": "Fixed",
   "style": "helpfully and reliably, building lasting agreements and friendships",
   "keywords": [
    "service",
    "agreements",
    "friendship",
    "reliability"
   ],
   "strengths": [
    "dependability as an ally",
    "fair negotiation",
    "lasting partnerships"
   ],
   "shadows": [
    "over-giving",
    "stubbornness once decided",
    "resentment when unappreciated"
   ],
   "relating": "generous and loyal; shows love through help",
   "wellbeing": "a need to protect one's own time",
   "practices": [
    "State your own needs, not only others'.",
    "Revisit decisions when the facts change."
   ]
  },
  {
   "nature": "Swift",
   "style": "with skill, cleverness and a practical touch",
   "keywords": [
    "craft",
    "wit",
    "dexterity",
    "resourcefulness"
   ],
   "strengths": [
    "skilled hands and mind",
    "resourceful problem-solving",
    "quick, practical humour"
   ],
   "shadows": [
    "nervous energy",
    "over-cleverness or cutting wit",
    "difficulty relaxing"
   ],
   "relating": "witty, helpful and practical",
   "wellbeing": "busy hands and mind that benefit from rest and routine",
   "practices": [
    "Turn cleverness into craft through long practice.",
    "Take regular screen-free breaks."
   ]
  },
  {
   "nature": "Soft",
   "style": "with design, flair and attention to form",
   "keywords": [
    "design",
    "brilliance",
    "craftsmanship",
    "image"
   ],
   "strengths": [
    "a strong aesthetic sense",
    "an ability to design and build",
    "a striking presence"
   ],
   "shadows": [
    "vanity",
    "perfectionism",
    "restlessness for the next idea"
   ],
   "relating": "attractive and expressive; enjoys admiration",
   "wellbeing": "perfectionism that drains energy",
   "practices": [
    "Define what 'finished' looks like.",
    "Value substance as much as appearance."
   ]
  },
  {
   "nature": "Movable",
   "style": "independently and flexibly, adapting like a reed in the wind",
   "keywords": [
    "independence",
    "trade",
    "diplomacy",
    "flexibility"
   ],
   "strengths": [
    "adaptability and diplomacy",
    "independent thinking",
    "a talent for trade and negotiation"
   ],
   "shadows": [
    "indecision",
    "detachment",
    "bending with every wind"
   ],
   "relating": "friendly but needs personal space",
   "wellbeing": "scattered energy that benefits from anchoring routines",
   "practices": [
    "Choose a few values and decide by them.",
    "Commit to one routine that grounds you."
   ]
  },
  {
   "nature": "Mixed",
   "style": "with a single-minded drive toward a goal",
   "keywords": [
    "ambition",
    "goals",
    "determination",
    "rivalry"
   ],
   "strengths": [
    "strong focus",
    "persistence until goals are met",
    "persuasive drive"
   ],
   "shadows": [
    "jealousy",
    "tunnel vision",
    "competitiveness spilling into relationships"
   ],
   "relating": "passionate and driven; loyal when goals align",
   "wellbeing": "intensity that needs balancing with rest",
   "practices": [
    "Celebrate others' wins on purpose.",
    "Set goals that include relationships."
   ]
  },
  {
   "nature": "Soft",
   "style": "devotedly and cooperatively, building networks across distance",
   "keywords": [
    "friendship",
    "devotion",
    "organisation",
    "networks"
   ],
   "strengths": [
    "loyal friendship",
    "strong organising ability",
    "the ability to thrive away from home"
   ],
   "shadows": [
    "self-sacrifice to exhaustion",
    "jealousy of closeness",
    "nostalgia"
   ],
   "relating": "devoted and cooperative; forms deep friendships",
   "wellbeing": "learning to ask for help",
   "practices": [
    "Keep a few close friendships alive on purpose.",
    "Set limits on what you give."
   ]
  },
  {
   "nature": "Sharp",
   "style": "protectively and with seniority, taking responsibility for others",
   "keywords": [
    "seniority",
    "protection",
    "courage",
    "pride"
   ],
   "strengths": [
    "protective leadership",
    "a strong sense of duty",
    "a sharp strategic mind"
   ],
   "shadows": [
    "pride",
    "loneliness at the top",
    "fear of losing status"
   ],
   "relating": "protective and proud; takes the elder role",
   "wellbeing": "stress carried privately",
   "practices": [
    "Delegate and let others lead sometimes.",
    "Share worries with a trusted person."
   ]
  },
  {
   "nature": "Sharp",
   "style": "by digging to the root, even if that means starting over",
   "keywords": [
    "roots",
    "truth",
    "uprooting",
    "research"
   ],
   "strengths": [
    "getting to the bottom of things",
    "the courage to start over",
    "a strong investigative drive"
   ],
   "shadows": [
    "upheaval",
    "tearing down before rebuilding",
    "extremes"
   ],
   "relating": "intense and truth-seeking; change can be dramatic",
   "wellbeing": "a need for grounding practices",
   "practices": [
    "Rebuild deliberately after every clearing.",
    "Ground yourself in a steady routine."
   ]
  },
  {
   "nature": "Fierce",
   "style": "persuasively and with an unbeaten spirit",
   "keywords": [
    "invincibility",
    "persuasion",
    "enthusiasm",
    "purification"
   ],
   "strengths": [
    "infectious enthusiasm",
    "persuasive speaking",
    "a refusal to quit"
   ],
   "shadows": [
    "stubborn pride",
    "over-confidence",
    "arguing to win"
   ],
   "relating": "warm, persuasive and spirited",
   "wellbeing": "high spirits that can hide fatigue",
   "practices": [
    "Listen fully before persuading.",
    "Rest between big pushes."
   ]
  },
  {
   "nature": "Fixed",
   "style": "on principle, with a patience that wins in the long run",
   "keywords": [
    "principle",
    "patience",
    "victory",
    "integrity"
   ],
   "strengths": [
    "an ethical backbone",
    "patient endurance",
    "durable, late-peaking success"
   ],
   "shadows": [
    "over-seriousness",
    "slowness to open up",
    "rigid standards"
   ],
   "relating": "steady and principled; commits for the long term",
   "wellbeing": "forgetting play and rest",
   "practices": [
    "Schedule play and rest on purpose.",
    "Let standards bend for people you love."
   ]
  },
  {
   "nature": "Movable",
   "style": "by listening, learning and passing knowledge on",
   "keywords": [
    "listening",
    "learning",
    "connection",
    "guidance"
   ],
   "strengths": [
    "attentive listening",
    "learning by hearing",
    "being a good teacher and guide"
   ],
   "shadows": [
    "gossip or over-listening",
    "absorbing others' opinions",
    "indecision"
   ],
   "relating": "attentive and wise; good at advice",
   "wellbeing": "a need for quiet to digest what it hears",
   "practices": [
    "Reflect in silence each day.",
    "Separate others' opinions from your own."
   ]
  },
  {
   "nature": "Movable",
   "style": "rhythmically and ambitiously, with a gift for timing",
   "keywords": [
    "rhythm",
    "prosperity",
    "ambition",
    "music"
   ],
   "strengths": [
    "a strong sense of timing",
    "ambition and resourcefulness",
    "a talent for music or rhythm"
   ],
   "shadows": [
    "arrogance",
    "impulsive spending or speech",
    "restlessness"
   ],
   "relating": "lively and sociable; likes to be seen",
   "wellbeing": "a pace that can outrun rest",
   "practices": [
    "Slow down on money decisions.",
    "Keep a steady daily rhythm."
   ]
  },
  {
   "nature": "Movable",
   "style": "privately and independently, seeking cures and hidden truths",
   "keywords": [
    "healing",
    "research",
    "solitude",
    "secrets"
   ],
   "strengths": [
    "deep research ability",
    "independent thinking",
    "a healing instinct"
   ],
   "shadows": [
    "isolation",
    "secrecy",
    "detachment from people"
   ],
   "relating": "reserved and independent; slow to share",
   "wellbeing": "a need for both solitude and connection",
   "practices": [
    "Share ideas before they feel finished.",
    "Schedule regular time with people."
   ]
  },
  {
   "nature": "Fierce",
   "style": "intensely and idealistically, with a mystical, passionate streak",
   "keywords": [
    "intensity",
    "idealism",
    "transformation",
    "mysticism"
   ],
   "strengths": [
    "passionate conviction",
    "deep ideals",
    "the ability to transform through crisis"
   ],
   "shadows": [
    "extremes",
    "fanaticism under stress",
    "dissatisfaction"
   ],
   "relating": "intense and idealistic; holds strong convictions",
   "wellbeing": "intensity that needs release",
   "practices": [
    "Test big beliefs against real-world results.",
    "Balance fire with regular calm."
   ]
  },
  {
   "nature": "Fixed",
   "style": "calmly and deeply, with restraint and compassion",
   "keywords": [
    "depth",
    "restraint",
    "compassion",
    "endurance"
   ],
   "strengths": [
    "calm under pressure",
    "deep wisdom",
    "compassion with boundaries"
   ],
   "shadows": [
    "passivity",
    "withdrawal",
    "slowness to assert needs"
   ],
   "relating": "calm and compassionate; quietly loyal",
   "wellbeing": "a tendency to bottle things up",
   "practices": [
    "Voice needs earlier.",
    "Act on what you already know."
   ]
  },
  {
   "nature": "Soft",
   "style": "gently and protectively, guiding others along the way",
   "keywords": [
    "guidance",
    "kindness",
    "journeys",
    "completion"
   ],
   "strengths": [
    "kindness and protectiveness",
    "artistic sensitivity",
    "guiding others through transitions"
   ],
   "shadows": [
    "naivety",
    "over-dependence",
    "difficulty finishing or letting go"
   ],
   "relating": "gentle and caring; absorbs others' moods",
   "wellbeing": "sensitivity that needs clear boundaries",
   "practices": [
    "Set boundaries kindly.",
    "Finish projects and close chapters."
   ]
  }
 ]
};

window.VNK = (function(D){
  'use strict';
  if (typeof VDB === 'undefined') return null;
  const PL = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  const SIGN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ordn = n => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
  const CAP = p => (p === 'Sun' || p === 'Moon') ? 'The ' + p : p;
  const THE = p => (p === 'Sun' || p === 'Moon') ? 'the ' + p : p;
  const rot = (a, k) => { const m = k % a.length; return a.slice(m).concat(a.slice(0, m)); };
  const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const okI = i => Number.isInteger(i) && i >= 0 && i <= 26, okP = p => Number.isInteger(p) && p >= 1 && p <= 4;

  function nakshatra(i){
    const f = D.nakshatras[i], b = VDB.data.nakshatras[i]; if (!okI(i) || !f || !b) return null;
    return Object.assign({ index: i }, b, f, { natureInfo: D.nature[f.nature] });
  }
  // pada p (1..4) of nakshatra i falls in navamsa sign (i*4+p-1) % 12; the sign's element gives the Purushartha flavour
  function pada(i, p){
    if (!okI(i) || !okP(p)) return null;
    const idx = (i * 4 + p - 1) % 12, S = VDB.data.signs[idx], pu = D.purushartha[S.element];
    return { pada: p, navamsaIndex: idx, navamsaSign: S.name, navamsaStyle: S.style, element: S.element, purushartha: pu.name, focus: pu.focus };
  }
  function relation(planet, lord){
    if (planet === lord) return 'own';
    const r = VDB.data.planets[planet].relations;
    return r.friends.includes(lord) ? 'friend' : r.enemies.includes(lord) ? 'enemy' : 'neutral';
  }
  const EASE = { own: 1, friend: 0.5, neutral: 0, enemy: -0.5 };
  const toneOf = e => e >= 0.5 ? 'supportive' : e < 0 ? 'challenging' : 'mixed';
  const REL_TEXT = (planet, lord) => ({
    own: `${CAP(planet)} is in its own nakshatra, so it expresses itself directly and its results are easier to read and more self-driven.`,
    friend: `${lord}, the nakshatra lord, is a natural friend of ${THE(planet)}, so the two cooperate and this star is an easy home for it.`,
    neutral: `${lord}, the nakshatra lord, is neutral to ${THE(planet)}, so results depend mostly on sign, house and aspects.`,
    enemy: `${lord}, the nakshatra lord, is a natural enemy of ${THE(planet)}, so this placement works through friction and asks for extra patience.`
  });

  function placement(planet, i, p){
    const n = nakshatra(i), pf = D.planet[planet], pd = pada(i, p); if (!n || !pf || !pd) return null;
    const k = p - 1, rel = relation(planet, n.lord), ease = EASE[rel];
    const strengths = rot(n.strengths, k).slice(0, 2).concat(pf.gives[k % 2]);
    const shadows = rot(n.shadows, k).slice(0, 2).concat(pf.shadows[(k + 1) % 2]);
    const practices = [n.practices[k % 2], pf.practice];
    const how = `${CAP(planet)}'s ${pf.drive} tends to show up ${n.style}.`;
    const relText = REL_TEXT(planet, n.lord)[rel];
    const padaText = `Pada ${p} falls in ${pd.navamsaSign} navamsa (${pd.navamsaStyle}), which adds a ${pd.purushartha} flavour: ${pd.focus}.`;
    const text = `${planet} in ${n.name}, pada ${p}. ${how} ${relText} ${padaText} Likely strengths: ${list(strengths)}. Points to watch: ${list(shadows)}. Supportive practice: ${practices[0]} ${practices[1]}`;
    return { key: `${planet}|${i}|${p}`, planet, nakshatra: n.name, nakIndex: i, nakLord: n.lord, nature: n.nature, pada: pd, relation: { kind: rel, lord: n.lord, ease },
      how, relationText: relText, relating: n.relating, strengths, shadows, practices, ease, score: ease, tone: toneOf(ease), keywords: n.keywords,
      tags: [`planet:${planet}`, `nakshatra:${n.name}`, `pada:${p}`, `nature:${n.nature}`, `purushartha:${pd.purushartha}`, `relation:${rel}`], text };
  }
  function lagna(i, p){
    const n = nakshatra(i), pd = pada(i, p); if (!n || !pd) return null; const k = p - 1;
    const strengths = rot(n.strengths, k), shadows = rot(n.shadows, k), practices = [n.practices[k % 2]];
    const how = `Your approach to life tends to be ${n.style}.`;
    const text = `Rising in ${n.name}, pada ${p}. ${how} In dealings with others you tend to be ${n.relating}. Pada ${p} falls in ${pd.navamsaSign} navamsa, adding a ${pd.purushartha} flavour: ${pd.focus}. Likely strengths: ${list(strengths)}. Points to watch: ${list(shadows)}. Supportive practice: ${practices[0]}`;
    return { key: `Lagna|${i}|${p}`, planet: 'Lagna', nakshatra: n.name, nakIndex: i, nakLord: n.lord, nature: n.nature, pada: pd, how, relating: n.relating, strengths, shadows, practices, keywords: n.keywords,
      tags: ['planet:Lagna', `nakshatra:${n.name}`, `pada:${p}`, `nature:${n.nature}`, `purushartha:${pd.purushartha}`], text };
  }
  function moon(i, p, dasha){
    const n = nakshatra(i), pd = pada(i, p); if (!n || !pd) return null; const k = p - 1;
    const strengths = rot(n.strengths, k), shadows = rot(n.shadows, k), practices = [n.practices[k % 2]];
    const start = dasha ? { lord: dasha.lord || n.lord, balanceYears: dasha.balanceYears } : { lord: n.lord };
    const how = `Emotionally you tend to respond ${n.style}.`;
    const text = `Moon in ${n.name}, pada ${p} (the birth star). ${how} In close relationships you tend to be ${n.relating}. Wellbeing theme: ${n.wellbeing}. Pada ${p} falls in ${pd.navamsaSign} navamsa, adding a ${pd.purushartha} flavour: ${pd.focus}. Likely strengths: ${list(strengths)}. Points to watch: ${list(shadows)}. Supportive practice: ${practices[0]} Because ${n.lord} rules this nakshatra, life began in a ${start.lord} Mahadasha${start.balanceYears != null ? ' with about ' + (Math.round(start.balanceYears * 10) / 10) + ' years left in it' : ''}.`;
    return { key: `Moon|${i}|${p}`, planet: 'Moon', nakshatra: n.name, nakIndex: i, nakLord: n.lord, nature: n.nature, pada: pd, how, relating: n.relating, wellbeing: n.wellbeing, strengths, shadows, practices, keywords: n.keywords, dashaStart: start,
      tags: ['planet:Moon', 'role:birth-star', `nakshatra:${n.name}`, `pada:${p}`, `nature:${n.nature}`, `purushartha:${pd.purushartha}`], text };
  }

  // everything for one computed chart (chart = computeChart() result)
  function forChart(chart){
    const out = { lagna: null, moon: null, planets: {} }, P = chart.planets, a = chart.ascendant && chart.ascendant.nakshatra;
    if (a) out.lagna = lagna(a.index, a.pada);
    PL.forEach(n => {
      const e = P[n]; if (!e || !e.nakshatra) return;
      const pl = placement(n, e.nakshatra.index, e.nakshatra.pada); if (!pl) return;
      const L = P[pl.nakLord];
      if (L){ pl.lordPlacement = { planet: pl.nakLord, house: L.house, sign: SIGN[L.sign] };
        pl.lordNote = pl.nakLord === n ? `${n} rules its own nakshatra, so look at its own house, sign and aspects for the full story.` : `${pl.nakLord}, which rules this nakshatra, sits in the ${ordn(L.house)} house in ${SIGN[L.sign]}; its condition shades how ${THE(n)}'s results play out.`; }
      out.planets[n] = pl;
    });
    const m = P.Moon && P.Moon.nakshatra;
    if (m) out.moon = moon(m.index, m.pada, chart.dashaData ? { lord: chart.dashaData.startLord, balanceYears: chart.dashaData.balanceYears } : null);
    return out;
  }
  function each(cb){ for (let i = 0; i < 27; i++) for (let p = 1; p <= 4; p++) PL.forEach(n => cb(placement(n, i, p))); }
  function find(q){
    q = q || {}; const out = [];
    each(x => { if ((!q.planet || x.planet === q.planet) && (!q.nakshatra || x.nakshatra === q.nakshatra) && (!q.nature || x.nature === q.nature) && (!q.relation || x.relation.kind === q.relation) &&
      (!q.purushartha || x.pada.purushartha === q.purushartha) && (!q.tone || x.tone === q.tone) && (!q.pada || x.pada.pada === q.pada)) out.push(x); });
    return out;
  }
  return { data: D, nakshatra, pada, placement, lagna, moon, forChart, each, find, relation };
})(VNK_DATA);

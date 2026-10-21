import os, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
TMPJSON = os.path.join(tempfile.gettempdir(), 'vdb_data.json')
sys.path.insert(0, HERE)
import json, re, itertools, collections
from p1_masters import *
from p2_planet_house import PIH, TONE
from p3_more import *

def ordn(n): return f"{n}{'th' if 10<=n%100<=20 else {1:'st',2:'nd',3:'rd'}.get(n%10,'th')}"
HT = [h['short'] for h in HOUSES]
THE = lambda p: 'the ' + p if p in ('Sun','Moon') else p
CAP = lambda p: ('The ' + p) if p in ('Sun','Moon') else p      # sentence-start form
art = lambda w: ('an ' if w[0].lower() in 'aeiou' else 'a ') + w

# ---------- dignity of a planet in a sign (same tables as the app) ----------
def dignity(p, s):
    if s == EXALT[p]: return 'Exalted'
    if s == (EXALT[p]+6)%12: return 'Debilitated'
    if s in OWN[p]: return 'Moolatrikona' if MOOLA.get(p)==s else 'Own'
    if p in ('Rahu','Ketu'): return 'Neutral'      # same as the app: nodes have no agreed friend/enemy signs, only exaltation/debilitation by convention
    lord = SIGN_LORD[s]; r = REL[p]
    return 'Friend' if lord in r['friends'] else 'Enemy' if lord in r['enemies'] else 'Neutral'
DIG_LABEL = {'Exalted':'Exalted','Debilitated':'Debilitated','Moolatrikona':'Own sign / Moolatrikona range','Own':'Own sign','Friend':"Friend's sign",'Enemy':"Enemy's sign",'Neutral':'Neutral sign'}
NODE_NOTE = " (Rahu and Ketu exaltation signs vary between schools; this app uses Taurus for Rahu and Scorpio for Ketu.)"

# ---------- planet in sign (rule-based) ----------
PIS = {}; PIS_DIG = {}
for p in PL:
    PIS[p] = []; PIS_DIG[p] = []
    for s in range(12):
        d = dignity(p, s); PIS_DIG[p].append(d)
        sg = SIGNS[s]
        t = (f"{p} in {SIGN_NAMES[s]} ({DIG_LABEL[d]}): {CAP(p)}'s {DRIVE[p]} show up in {art(sg['style'])} way, "
             f"finding their outlet through {sg['channel']}. {STATUS['dignity']['Own' if d=='Moolatrikona' else d]}")
        if p in ('Rahu','Ketu') and d in ('Exalted','Debilitated'): t += NODE_NOTE
        PIS[p].append(t)

# ---------- house lord in house (rule-based, 12 x 12) ----------
OFFSET = [
 "",
 "Counted from its own house this is the 2nd, which adds a practical, resource-minded note.",
 "Counted from its own house this is the 3rd, which adds a note of personal effort, initiative and communication.",
 "Counted from its own house this is the 4th (angular), which adds stability and a strong, visible footing.",
 "Counted from its own house this is the 5th (trine), which tends to add ease and good fortune.",
 "Counted from its own house this is the 6th, which adds a note of obstacles, competition or service that asks for steady effort.",
 "Counted from its own house this is the 7th (opposite), which brings in other people and open dealings.",
 "Counted from its own house this is the 8th, which adds a hidden or intense note, with delays and sudden turns, but also depth and research.",
 "Counted from its own house this is the 9th (trine), which adds fortune, belief and good guidance.",
 "Counted from its own house this is the 10th (angular), which adds visibility through action and public standing.",
 "Counted from its own house this is the 11th, which adds a note of gains, networks and fulfilled hopes.",
 "Counted from its own house this is the 12th, which adds a note of expense, distance or letting go.",
]
ROLE = ["The Lagna lord shows where the person's energy and life direction go.","The 2nd lord shows how income, speech and family values are handled.",
 "The 3rd lord shows where effort, courage and sibling matters are directed.","The 4th lord shows where the search for peace, home and comfort goes.",
 "The 5th lord shows where creativity, intelligence and merit are directed.","The 6th lord shows where conflict, service and health habits show up.",
 "The 7th lord shows where partnerships and open dealings are pulled.","The 8th lord shows where change, research and the unexpected are felt.",
 "The 9th lord shows where fortune, belief and guidance are channelled.","The 10th lord shows where career effort and public standing are directed.",
 "The 11th lord shows where gains and the social circle are focused.","The 12th lord shows where expenses, withdrawal and letting go occur."]
DUS, KEN, TRI = {6,8,12}, {1,4,7,10}, {1,5,9}
def special(x, y):
    out = []
    if x in DUS and y in DUS: out.append("A dusthana lord in a dusthana is the classical Viparita Raja pattern: reversals tend to turn into protection or unexpected gain when the planet itself is unharmed.")
    if x in TRI and y in (KEN | TRI) and not (x == y and x == 1 and False): out.append("A trikona lord linked with a kendra or trikona is a Raja Yoga-type link that supports status and fortune.")
    if x in TRI and y in DUS: out.append("A fortunate house's lord sits in a difficult house, so benefits arrive with effort, delay or distance.")
    if x in DUS and y in KEN: out.append("A difficult house's lord in an angular house can bring struggle, change or loss into that area of life, which calls for care.")
    if x in (4,7,10) and y in TRI and x != y: out.append("An angular lord placed in a trikona tends to support fortune and status.")
    if x in (4,7,10) and y in DUS: out.append("Angular matters drift into struggle or transformation and need steady handling.")
    if x in (2,11) and y in DUS: out.append("The wealth house lord in a difficult house means money comes with effort or fluctuations.")
    return ' '.join(out)
LIH = []
for x in range(1,13):
    row = []
    for y in range(1,13):
        d = (y-x) % 12
        if d == 0: t = f"{ROLE[x-1]} Here it sits in its own house ({HT[x-1]}), so those matters get concentrated attention, for better or worse depending on the planet's strength."
        else: t = f"{ROLE[x-1]} Here it sits in the {ordn(y)} house ({HT[y-1]}), so matters of {HT[x-1]} are worked out through {HT[y-1]}. {OFFSET[d]}"
        sp = special(x, y)
        if sp: t += ' ' + sp
        row.append(t)
    LIH.append(row)

# ---------- aspects on houses (rule-based, 9 x 12) ----------
BEN = {'Jupiter','Venus','Moon','Mercury'}
UPA = {3,6,10,11}
ASPECT_OFFSETS = {'Sun':[7],'Moon':[7],'Mars':[4,7,8],'Mercury':[7],'Jupiter':[5,7,9],'Venus':[7],'Saturn':[3,7,10],'Rahu':[7],'Ketu':[7]}
AOH = {}
for p in PL:
    AOH[p] = []
    g, r = GIFT[p]
    for h in range(1, 13):
        t = f"{p}'s aspect on the {ordn(h)} house touches {HT[h-1]}. {CAP(p)} tends to bring {g} here when well placed; if weak or afflicted, expect {r}."
        if p in BEN: t += " As a natural benefic its gaze is generally supportive" + (", and it softens the troubles of a dusthana." if h in DUS else ".")
        else: t += " As a natural malefic its gaze pressures the house but also toughens it" + (", and malefic influence on an upachaya house usually helps with time." if h in UPA else ".")
        AOH[p].append(t)

# ---------- planet aspecting planet (rule-based, ordered 9 x 8) ----------
def sig4(b): return ', '.join(PLANETS[b]['signifies'].split(', ')[:4])
PAS = {}
for a in PL:
    for b in PL:
        if a == b: continue
        r = REL[a]
        rel = ("As natural friends, the influence is cooperative and supportive." if b in r['friends'] else
               "As natural enemies, the influence tends to feel like friction or pressure." if b in r['enemies'] else
               "As neutral planets, the result depends on signs, houses and strength.")
        PAS[f"{a}>{b}"] = f"{CAP(a)} aspecting {THE(b)}: {THE(a)} {VERB[a]} {THE(b)}'s matters ({sig4(b)}). {rel}".replace('Sun aspecting','The Sun aspecting').replace('Moon aspecting','The Moon aspecting') if False else f"{CAP(a)} aspecting {THE(b)}: {CAP(a)} {VERB[a]} {THE(b)}'s matters ({sig4(b)}). {rel}"

# ---------- assemble ----------
nak_rows = []
for i, (name, lord, deity, symbol, gana, trait, work, watch) in enumerate(NAK):
    nak_rows.append(dict(i=i+1, name=name, lord=lord, deity=deity, symbol=symbol, gana=gana, span=[round(i*360/27,4), round((i+1)*360/27,4)], trait=trait, careers=work, watch=watch))
DATA = dict(
 meta=dict(name='Vedic Knowledge Database', version=1,
   note='Traditional Jyotish (Vedic astrology) significations written for reading charts. These are interpretive traditions, not scientific facts or predictions; a chart reading always combines sign, house, dignity, aspects, dasha and transits.',
   sections={'planets':'hand-written','houses':'hand-written','signs':'hand-written','planetInHouse':'hand-written (108)','planetInSign':'rule-based from planet drive x sign style x dignity (108)',
             'lordInHouse':'rule-based from house themes x relative position x classical lord rules (144)','aspectOnHouse':'rule-based from planet gifts/risks x house themes (108)',
             'planetAspect':'rule-based from planet verb x natural relationship (72)','conjunction':'hand-written (35)','nakshatras':'hand-written (27)','yogas':'hand-written (23)',
             'dasha':'hand-written (9)','status':'hand-written','rising':'hand-written (12)','moonSign':'hand-written (12)'},
   indexing={'planetInHouse':'planetInHouse[planet][house-1]','planetInSign':'planetInSign[planet][signIndex 0=Aries]','lordInHouse':'lordInHouse[lordOfHouse-1][placedInHouse-1]','aspectOnHouse':'aspectOnHouse[planet][house-1]','planetAspect':"planetAspect['From>To']",'conjunction':"conjunction['A+B'] in planet order Sun,Moon,Mars,Mercury,Jupiter,Venus,Saturn,Rahu,Ketu"}),
 planets={p:dict(PLANETS[p], aspects=ASPECT_OFFSETS[p], relations=REL[p], exaltSign=SIGN_NAMES[EXALT[p]], debilitationSign=SIGN_NAMES[(EXALT[p]+6)%12], ownSigns=[SIGN_NAMES[s] for s in OWN[p]]) for p in PL},
 planetsNote=PL_NOTE + ' Rahu/Ketu friend/enemy lists follow a commonly used scheme and only feed the wording of planet-to-planet aspects; schools differ.',
 houses=HOUSES,
 signs=[dict(name=SIGN_NAMES[i], lord=SIGN_LORD[i], **{k:v for k,v in SIGNS[i].items() if k not in ('rising','moon','ruler')}) for i in range(12)],
 aspectRules=dict(all="Every planet aspects the 7th house from itself.", special={'Mars':[4,8],'Jupiter':[5,9],'Saturn':[3,10]},
   nodes="Rahu and Ketu: this app counts only the 7th. Many schools also give them the 5th and 9th; the text for every planet/house pair is provided either way.", offsets=ASPECT_OFFSETS),
 tone=TONE,
 planetInHouse=PIH, planetInSign=PIS, planetInSignDignity=PIS_DIG, lordInHouse=LIH, aspectOnHouse=AOH, planetAspect=PAS,
 conjunction=CONJ, nodalAxis=NODAL, nakshatras=nak_rows, yogas=YOGAS, dasha={k:dict(years=v[0], text=v[1]) for k,v in DASHA.items()}, dashaNote=DASHA_NOTE,
 status=STATUS, rising={SIGN_NAMES[i]:SIGNS[i]['rising'] for i in range(12)}, moonSign={SIGN_NAMES[i]:SIGNS[i]['moon'] for i in range(12)},
)

# ---------- quality gates ----------
texts = []
def walk(o, path=''):
    if isinstance(o, str): texts.append((path, o))
    elif isinstance(o, list): [walk(v, f"{path}[{i}]") for i, v in enumerate(o)]
    elif isinstance(o, dict): [walk(v, f"{path}.{k}") for k, v in o.items()]
walk({k: DATA[k] for k in ('planetInHouse','planetInSign','lordInHouse','aspectOnHouse','planetAspect','conjunction','rising','moonSign')})
dup = [p for p, c in collections.Counter(t for _, t in texts).items() if c > 1]
bad = [(p, t) for p, t in texts if re.search(r"undefined|\{|\}|TODO|\bNone\b|  ", t) or len(t.split()) < 10 or not t.rstrip().endswith(('.', ')'))]
print('long-text entries:', len(texts), '| duplicates:', len(dup), '| flagged:', len(bad))
for p, t in bad[:8]: print('  FLAG', p, '->', t[:90])
assert not dup and not bad
cnt = dict(planetInHouse=sum(len(v) for v in PIH.values()), planetInSign=sum(len(v) for v in PIS.values()), lordInHouse=sum(len(r) for r in LIH),
           aspectOnHouse=sum(len(v) for v in AOH.values()), planetAspect=len(PAS), conjunction=len(CONJ), nakshatras=len(nak_rows), yogas=len(YOGAS))
print(cnt, '| total entries:', sum(cnt.values()))
assert cnt == dict(planetInHouse=108, planetInSign=108, lordInHouse=144, aspectOnHouse=108, planetAspect=72, conjunction=35, nakshatras=27, yogas=23)
json.dump(DATA, open(TMPJSON, 'w'), ensure_ascii=False)
print('data.json KB:', len(json.dumps(DATA, ensure_ascii=False).encode())//1024)

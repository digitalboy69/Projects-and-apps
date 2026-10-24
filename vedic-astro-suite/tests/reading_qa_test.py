# S11 QA: 12 charts incl. edge cases (polar, southern, equator, midnight, leap day, very old, future, odd timezone). Whole-reading invariants:
# no placeholder text, no banned absolutes, no duplicated paragraphs, every section present, sane word counts, area scores match their band wording,
# deterministic output, PDF builds with every section. Also writes docs/ASTROLOGER_REVIEW_SHEET.md (--sheet) for a human reviewer.
# The word ban covers the new reading layers (life areas onward); the older Signature/Foundation text is only reported as advisory. The Pluto theme label "Death & rebirth" is exempt.
# Run: python3 tests/reading_qa_test.py [--sheet]
import functools, http.server, os, re, socketserver, sys, threading, collections
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
PAGE = 'http://127.0.0.1:%d/apps/birth-chart/index.html' % srv.server_address[1]
CHARTS = [('Hyderabad 1995', '1995-03-14', '11:00', 17.385, 78.4867, 5.5), ('Honolulu 1961', '1961-08-04', '19:24', 21.3069, -157.8583, -10),
 ('Sydney 2000 (UTC+11)', '2000-01-01', '00:00', -33.87, 151.21, 11), ('Delhi 1947 midnight', '1947-08-15', '00:00', 28.61, 77.21, 5.5),
 ('Reykjavik 1988 (near-polar)', '1988-12-21', '03:15', 64.15, -21.94, 0), ('Quito 1975 (equator)', '1975-06-30', '23:50', -0.18, -78.47, -5),
 ('Omaha 1930', '1930-08-30', '15:00', 41.26, -95.93, -6), ('Leap day 1992', '1992-02-29', '09:10', 13.08, 80.27, 5.5),
 ('Kathmandu 1984 (UTC+5:45)', '1984-04-10', '06:30', 27.7, 85.32, 5.75), ('Tromso 1999 (polar night)', '1999-12-21', '12:00', 69.65, 18.96, 1),
 ('Ulaanbaatar 2012', '2012-05-21', '14:30', 47.92, 106.92, 8), ('Auckland 2024 (recent)', '2024-02-10', '08:45', -36.85, 174.76, 13)]
SECTIONS = ['YOUR SIGNATURE AT A GLANCE', 'FOUNDATION', 'CAREER AND PUBLIC STANDING', 'MONEY AND SAVINGS', 'MARRIAGE AND PARTNERSHIP', 'CHILDREN AND CREATIVITY', 'HEALTH AND VITALITY',
 'LEARNING AND EDUCATION', 'FOREIGN LANDS AND MOVING AWAY', 'HOME AND PROPERTY', 'INNER LIFE AND SPIRITUALITY', 'DIVISIONAL CHARTS', 'TRANSITS AND SADE SATI', 'YOGAS IN YOUR CHART']
BAN = re.compile(r"\b(always|never|certainly|definitely|guaranteed|doomed|destined|fatal|cursed|will die|death|you will|you are going to)\b", re.I)
JUNK = re.compile(r"undefined|\bNaN\b|\[object|\bnull\b|\{\{|\}\}|TODO|lorem|  +\.|\.\.\.\.|\bInfinity\b")
SHEET = '--sheet' in sys.argv
res = []; sheet = []; legacy = set()
def ok(n, c, d=''): res.append((n, bool(c), d))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME); pg = b.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('http://127.0.0.1', 'data:', 'blob:', 'about:')) else r.abort())
    pg.goto(PAGE); pg.wait_for_selector('#birthForm')
    for name, dob, tob, lat, lon, tz in CHARTS:
        pg.evaluate("(p)=>{loadProfileIntoForm(p);document.getElementById('birthForm').requestSubmit();}", dict(name=name, dob=dob, tob=tob, place=name, lat=lat, lon=lon, tz=tz))
        pg.wait_for_selector('#results.show', timeout=20000)
        r = pg.evaluate("""()=>{const ch=currentChartForModal,pr=currentProfileForExport,now=new Date('2026-10-22T00:00:00Z'),t=buildFullReportText(ch,pr,{}),t2=buildFullReportText(ch,pr,{}),
          A=LAE.assess(ch,{now}),pdf=PDFR.build(ch,pr,{}),d=new DOMParser().parseFromString(pdf,'text/html');
          return {t:t.replace(/Generated:.*\\n/,''),t2:t2.replace(/Generated:.*\\n/,''),areas:A.areas.map(a=>({id:a.id,name:a.name,score:a.score,band:a.band,headline:a.headline,pos:a.pos.length,neg:a.neg.length})),
            pdfSections:d.querySelectorAll('section[id^=s-]').length,pdfLen:pdf.length,asc:ch.ascendant.sign,moon:ch.planets.Moon.sign}}""")
        t = r['t']; bad = []
        for s in SECTIONS:
            if s not in t: bad.append('missing ' + s)
        if JUNK.search(t): bad.append('junk: ' + JUNK.search(t).group(0))
        k = t.find('CAREER AND PUBLIC STANDING'); tt = re.sub(r'death & rebirth', 'x', t[k:], flags=re.I); m = BAN.search(tt)  # new layers only; older FOUNDATION text is advisory
        legacy.update(x.lower() for x in BAN.findall(t[:k]))
        if m: bad.append('banned: ' + tt[max(0, m.start() - 40):m.end() + 20].replace('\n', ' '))
        if r['t'] != r['t2']: bad.append('not deterministic')
        wc = len(t.split())
        if not 14000 <= wc <= 115000: bad.append('word count %d' % wc)
        paras = [re.sub(r'\s+', ' ', x).strip() for x in re.split(r'\n\s*\n', t)]
        cnt = collections.Counter(x for x in paras if len(x.split()) >= 25 and not x.startswith('H1:'))
        dup = [x[:70] + " ##" + str(x.count("H1:")) for x, n in cnt.items() if n > 1]
        if dup: bad.append('duplicate paragraphs %d e.g. %s' % (len(dup), dup[0]))
        if len(r['areas']) != 9: bad.append('areas')
        for a in r['areas']:
            if not 3 <= a['score'] <= 97: bad.append('score ' + a['id'])
            if not a['headline'].split(': ',1)[-1].lower().startswith(a['band'].lower()): bad.append('headline band mismatch %s: %s / %s' % (a['id'], a['band'], a['headline'][:90]))
        if r['pdfSections'] < 12: bad.append('pdf sections %d' % r['pdfSections'])
        if r['pdfLen'] > 3_000_000: bad.append('pdf size %d' % r['pdfLen'])
        ok('%s: all sections, clean text, no duplicate paragraphs, %d words, deterministic, PDF %d KB' % (name, wc, r['pdfLen'] // 1024), not bad, bad[:5])
        sheet.append((name, dob, tob, lat, lon, tz, r['asc'], r['moon'], r['areas'], wc))
    ok('no JavaScript errors', not errs, errs[:3]); b.close()
if SHEET:
    L = ['# Astrologer review sheet', '', 'For a human astrologer. For each chart below, read the area scores and the full report (Deep reading tab or PDF) and mark each line OK / Disagree with a short note.', '',
         'Questions for every chart: (1) Do the ascendant and Moon sign match your own calculation? (2) Do the strongest and weakest areas fit the chart? (3) Is any sentence wrong in tradition, too absolute or confusing? (4) Do the Sade Sati and transit notes match the ephemeris?', '']
    for n, dob, tob, lat, lon, tz, asc, moon, areas, wc in sheet:
        L += ['## ' + n, '', 'Born %s %s, lat %s, lon %s, UTC%+g. Ascendant: sign %s. Moon: sign %s (sign numbers 0 = Aries). Report length %d words.' % (dob, tob, lat, lon, tz, asc, moon, wc), '',
              '| Area | Score | Band | Headline | Verdict | Note |', '|---|---|---|---|---|---|']
        L += ['| %s | %d | %s | %s | OK / Disagree | |' % (a['name'], a['score'], a['band'], a['headline'].replace('|', '/')) for a in areas] + ['']
    open(os.path.join(ROOT, 'docs', 'ASTROLOGER_REVIEW_SHEET.md'), 'w', encoding='utf-8').write('\n'.join(L))
print('ADVISORY: absolute words still in the older Signature/Foundation text:', sorted(legacy))
bad = [r for r in res if not r[1]]
for n, c, d in res: print(('PASS ' if c else 'FAIL ') + n + ('' if c or d == '' else '  -> ' + str(d)[:400]))
print('ALL PASS' if not bad else f'{len(bad)} FAILED'); raise SystemExit(1 if bad else 0)

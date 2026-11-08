# Astro Features Plan (the tools working astrologers use that the app does not have yet)

This file is the single source of truth for this program of work. **A new chat reads this file first, does the next unchecked step, ticks it, and continues.**
Last updated: Session 1 (rebased on main). Owner: Madhu Yadav. Written together with the owner after a gap audit of the code.

## 0. START HERE (for a new chat)

Paste this as the first message of a new chat:

> Read `vedic-astro-suite/docs/ASTRO_FEATURES_PLAN.md` on branch `feature/astro-roadmap` of `digitalboy69/Projects-and-apps` and follow it.
> Do the next unchecked step, tick it, commit, push the branch, then go on to the next one. Keep replies short.

Setup, in this order:
1. Attach the repo with push access (`add_repo` with `access: push`), then `git clone --depth 1 --branch feature/astro-roadmap https://github.com/digitalboy69/projects-and-apps /home/claude/projects-and-apps`.
   A read-only clone works for reading, but cannot push.
2. `cd vedic-astro-suite`, read `AI_GUIDE.md` sections 0 to 5 and `STRUCTURE.md` once (the repo rules), then this file.
3. `sh tools/ai/session.sh start` prints the next unchecked line of this plan (it is in the loop). Work on the FIRST unchecked step of section 2.
4. Build and test (section 3), tick the box, add a log line (section 7), commit, push the **branch only**.
5. **Do not push to `main` or `Root` unless the owner says so in that chat.** The owner merges (a pull request, or tells you to fast-forward). Say what is not on main yet.
6. Do not use `session.sh ship` for this plan: it is hard-coded to `feature/full-reading`. Use plain `git add -A && git commit && git push origin feature/astro-roadmap`.

Branch note: `feature/astro-roadmap` starts from the Chakra Explorer commits (`feature/chakra-explorer`), which are not on `main` yet.

## 0b. Rebase rule (owner request, 2026-11-08)
The owner works on `main` a lot. **Before every step: `git fetch origin main && git rebase origin/main`**, then re-run `ls apps/birth-chart/js | grep -E '^1[3-9]'` and `ls apps/birth-chart/css | tail -4` for free file numbers, and read the AI_GUIDE changelog for new features. Renumber this plan's file names if the owner took them. The Chakra Explorer is already merged to main (PR #3).
Already taken by the owner since this plan was written: js/130-astro-atlas-data, 131-astro-atlas, 132/133-astro-atlas-more, css/67-astro-atlas (Astro Atlas panel: reference tabs incl. Yogas, Remedies, Placements, Match, Muhurta). Reuse, do not duplicate: **A13 Remedies and A11 Muhurta must start from the Atlas content (`ATLAS_MORE.REMEDIES`, `BAD_TIMES`) and add only the chart-linked / date-search part.** The Atlas tab cards use `window.ATL_UI`; new features may add a tab there if it fits.

## 1. Why these steps (audit result, honest)

Method: the app code (`apps/birth-chart/js`, `apps/sky3d/js`) was searched for each feature by name. "No trace" means no keyword hit outside the generated reading databases. It does not prove absence, so each step begins by re-checking (step item 1 "Re-check").

| Area | Already in the app | Missing (this plan) |
|---|---|---|
| Planet states | dignity, combustion, retrograde, war, Shadbala, `PST` planet-state readings | Baladi / Jagradadi / Deeptadi avasthas, Vimshopaka bala |
| Sub-planets, sensitive degrees | Gulika in `chart.upagraha`, Gand Mool in Dosha Check, Gandanta only in the 3D dashboard | Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu; Pushkara navamsa / bhaga; Mrityu bhaga |
| Chart reading tools | Jaimini karakas, rashi drishti, arudha padas, Bhrigu Bindu, 36 dashas, Chakra Explorer | Sudarshana Chakra, Argala, Bhavat Bhavam |
| Ashtakavarga | BAV + SAV (`11-`), Fate Meter use, `CONTRIBUTION_TABLE` | Prastara tables, Sodhana, Shodhya pindas, Kakshya, transit Ashtakavarga |
| Transits | Gochara in Today for You and Live Sky, Sade Sati, Chakra Explorer vedha rays | classical Gochara vedha (house blocks house) |
| People | Ashtakoota matching, Manglik | Synastry (planets of A in B's houses, inter-chart aspects) |
| Time | Panchanga, Choghadiya, Today for You, Tithi Pravesh (Muntha, Mudda), Date Finder | Muhurta finder, monthly Panchang calendar with festivals and eclipses |
| Guidance | Ask-AI prompts only | Remedies (gentle, sourced) |
| Parked (not in this plan) | | Lal Kitab, Panchapakshi, Nadi amsa, full Tajika Varshaphal |

## 2. Checklist (the order of work). ONE LINE PER STEP: `session.sh` reads the first `- [ ]` line.

Legend: effort S (a session or less), M (1 to 2 sessions), L (3+). `[x]` done, `[~]` started, `[ ]` not started.

- [x] **A0 Plan and wiring**: this file, STRUCTURE.md row, `session.sh start` shows it, branch `feature/astro-roadmap` pushed. (S, done in Session 0)
- [x] **A1 Planetary avasthas**: Baladi, Jagradadi, Deeptadi for the 7 grahas (Lajjitadi and nodes left out, see Notes), panel `panel-avasthas`. DONE Session 1: js/134, css/68, 2 tests. (M)
- [ ] **A2 Vimshopaka bala**: Shadvarga, Saptavarga, Dashavarga, Shodasavarga scores per planet, panel `panel-vimshopaka`. (M)
- [ ] **A3 Upagrahas**: Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu (+ Gulika and Mandi as already known), sign / degree / nakshatra / house, in `chart.upagraha` and a panel. (S)
- [ ] **A4 Sensitive degrees**: Gandanta, Pushkara navamsa / bhaga, Mrityu bhaga check for every planet and the Lagna, panel `panel-sensitive`. (M, needs source tables)
- [ ] **A5 Sudarshana Chakra**: three rings (Lagna, Moon, Sun), planets in each, the running year's house, drawing + simple tally. (M)
- [ ] **A6 Argala and Virodhargala**: per house, who intervenes and who obstructs. (S)
- [ ] **A7 Bhavat Bhavam and Bhava arudhas**: "house from the house" table, and all 12 arudha padas if `17-` does not already give them. (S)
- [ ] **A8 Ashtakavarga extras**: Prastara tables, Trikona and Ekadhipatya Sodhana, Shodhya pindas, Kakshya, transit Ashtakavarga for today. (L)
- [ ] **A9 Gochara vedha**: classical vedha pairs added to Today for You and Live Sky. (S, needs source table)
- [ ] **A10 Synastry**: pick two saved profiles; planets in the other's houses, inter-chart aspects, Moon relations. (M)
- [ ] **A11 Muhurta finder**: search a date range for an event type using sourced rule sets. (L: A11a sources and decisions, A11b engine, A11c UI)
- [ ] **A12 Monthly Panchang calendar**: month grid with tithi, nakshatra, sankranti, ekadashi, purnima/amavasya, festivals, eclipses. (L)
- [ ] **A13 Remedies**: planet by planet traditional remedies, gentle wording, linked to weak planets from A1 and Shadbala. (M, needs owner sign-off on tone)
- [ ] **A14 Wrap-up**: Home tiles reviewed, search index entries, export/report text, AI_GUIDE router rows, one smoke run of everything, merge request text for the owner. (S)

## 3. Rules for EVERY step (read once, then they apply to all)

### 3.1 Source rule (this program's most important rule)
- Never add a rule table from memory. The AI_GUIDE rule stands: **no yoga, saham or table without a verifiable source.**
- Each step lists a **Source needed** line. Before coding, find the table in two independent places (a classical text translation or a reputable astrologer's published page) and write the agreed values and the URLs/book names into that step's **Notes**.
  If two sources disagree, ask the owner or implement the choice behind a visible setting and say so on the page ("schools differ").
- A rule written in this file as "known rule" is the author's recollection. It is a starting point to verify, not a verified source.
- Say plainly on the page when something is this app's own rule of thumb (the Chakra Explorer does this in its "How these charts are read" note; copy that pattern).

### 3.2 Wording rule (from the reading layers)
Second person, tendencies never fate, no absolute or fatal words (the tests ban them), no medical or financial promises. Say "tends to", "often", "check with the dasha".

### 3.3 Code rules (from AI_GUIDE)
- New files: `apps/birth-chart/js/NNN-name.js` (next free number is **134**; re-check with `ls apps/birth-chart/js | grep -E '^1[3-9]'` because the owner adds files too), `apps/birth-chart/css/NN-name.css` (next free css number is **68**). Add the tags to `apps/birth-chart/index.html` after the last script / stylesheet. Never renumber.
- Engine functions are shared globals (no modules). Class names get a unique prefix per feature (for example `avs-`, `vim-`). Never style bare `i`, `b` or `span` (the icon layer inserts `.vxi` spans).
- Panels: register with `registerLatePanel('panel-x', buildXPanel)` (see `js/120-late-panels.js`) and add the Home tile as one row in `HOME_ITEMS` in `js/25-home-and-tabs.js`: `['panel-x','icon','Title','one line','Section','group']`. Sections used today: `Your Chart`, `Fix Birth Time`, `Time & Cycles`, `Analysis`. Copy `js/130-chakra-explorer.js` (a complete small feature) as the template for a panel with engine, html, text and tests.
- Phone first: every screen works at 360 px, no sideways scroll.
- Motion: opacity and transform only, nothing looping, off for reduced motion, no backdrop-filter. SVG gradient fills must be inline `style="fill:url(#id)"` (a class fill rule beats a fill attribute; this once made text unreadable).
- Do not edit `dist/`. Never read built html. Use `grep -P "^name\t" symbols.idx`.

### 3.4 Definition of done (every step)
1. **Re-check** the audit: grep the code for the feature name and the nearby ones (it may exist by now). Reuse any existing helper instead of writing a second one.
2. Rules/tables verified and recorded in the step's Notes (3.1).
3. Engine in its own `js` file with a small public API (`X.compute(chart, profile, ...)`, `X.html(...)`, `X.text(...)`).
4. Engine test `tests/<name>_test.js` (Node `vm`, copy `tests/chakra_explorer_test.js`): checks against hand-worked values and against the app's own functions; ban `undefined`/`NaN`/`[object` in output; 50+ random charts render.
5. Browser test `tests/<name>_browser_test.py` (copy `tests/chakra_explorer_browser_test.py`) with `CHX_SHOTS`-style screenshots. **Look at the screenshots.** The assertions alone missed unreadable text once.
6. `python3 build.py`, `python3 tests/syntax_check.py`, `python3 tools/check_structure.py` all OK; list every new file in `STRUCTURE.md`.
7. Run the neighbouring tests: `dosha_late_panels_test`, `home_chart_first_test`, `kp_test`, plus the tests of anything touched.
8. Add one row to the AI_GUIDE router (section 2) and one line to its changelog (section 7).
9. Tick this file's box, add a log line (section 7 below), commit with the attribution lines the environment gives, push the branch.

### 3.5 Run commands
```
cd vedic-astro-suite
python3 build.py && python3 tests/syntax_check.py && python3 tools/check_structure.py
node tests/<name>_test.js
python3 tests/<name>_browser_test.py            # needs the pre-installed Chromium
CHX_SHOTS=/some/dir python3 tests/<name>_browser_test.py   # screenshots, then look at them
```

## 4. Building blocks that already exist (reuse, do not rewrite)

| Need | Use | Where |
|---|---|---|
| Chart object | `computeChart(dateStr, timeStr, lat, lon, tz)` -> `planets[name]` {longitude, sign, degInSign, house, nakshatra{index,pada}, retrograde, dignity, combustion, speed}, `ascendant`, `vargas`, `upagraha`, `ashtakavarga` {bavTables, sav}, `shadbala`, `dashaData` | `15-chart-core-compute.js` |
| Planet at any time | `getSiderealLongitudeAt(name, jd)`, `getPlanetSpeed(name, jd)`, `isRetrograde` | `03-ephemeris-engine.js` |
| Sign / nakshatra helpers | `SIGNS` (name, lord, element, modality), `NAKSHATRAS`, `getSignIndex`, `getDegInSign`, `getNakshatra` | `05-` |
| Varga signs | `calcVarga`, `VARGAS` (D1 to D144), `chart.vargas[key].planetVargaSign` | `05-`, `15-` |
| Dignity and friendships | `OWN_SIGNS`, `NATURAL_RELATIONS` (natural only), `getDignity` | `07-planetary-dignity.js` |
| Ashtakavarga | `CONTRIBUTION_TABLE`, `computeBAV`, `computeFullAshtakavarga` | `11-ashtakavarga-engine.js` |
| Panchanga | `panchangaAt(jd, lat, lon, tz)` | `45-panchanga-engine.js` |
| Time helpers | `toJulianDay`, `jdToParts`, `jdToLocalParts`, `nvTime`, `nvDate` | `03-`, `04-`, `48-` |
| Today's Moon checks | `TDY.compute` (Chandrabala, Tarabala, Gochara) | `122-today-for-you.js` |
| Date search pattern | `dfGen` (generator over days with clue filters) | `27-`, `28-date-finder-*.js` |
| Eclipses, festivals | eclipse test and `DF_FEST` | `27-date-finder-core.js`, `28-` |
| Gulika / upagraha slot | `computeGulika`, `chart.upagraha.Gulika` | `117-gulika.js` |
| Saved profiles | the profile list used by `loadProfileIntoForm` and `window.__vgProf` | `18-`, `63-`, `64-` |
| Panel registration | `registerLatePanel`, `HOME_ITEMS` | `120-`, `25-` |
| A finished small feature to copy | Chakra Explorer: engine + html + text + panel + css + 2 tests | `130-chakra-explorer.js`, `css/67-`, `tests/chakra_explorer_*` |

## 5. Step details

Each step has the same fields: **Goal**, **Why astrologers use it**, **Known rule (VERIFY)**, **Source needed**, **Files**, **Screen**, **API**, **Tests**, **Done when**, **Notes** (filled by whoever does the step).

### A1 Planetary avasthas (M)
- **Goal**: show each planet's states: age state (Baladi), alertness (Jagradadi), mood (Deeptadi); optionally Lajjitadi (6 states).
- **Why**: a standard first check of how fully a planet can deliver its results, used next to dignity and Shadbala.
- **Known rule (VERIFY against BPHS and one more text)**:
  - Baladi from the degree in the sign: odd signs 0-6 Bala, 6-12 Kumara, 12-18 Yuva, 18-24 Vriddha, 24-30 Mrita; even signs run in reverse. Results classically: Bala about a quarter, Kumara half, Yuva full, Vriddha little, Mrita none.
  - Jagradadi: Jagrat (awake) in own or exaltation sign, Swapna (dreaming) in a friend's or neutral sign, Sushupti (asleep) in an enemy's or debilitation sign.
  - Deeptadi: states such as Deepta, Swastha, Mudita, Shanta, Dina, Dukhita, Vikala, Khala, Bhita/Kopa decided by dignity, friendship, combustion and malefic company. **The exact list and conditions must come from the source; do not guess.**
- **Source needed**: BPHS chapter on avasthas (confirm chapter number in the translation used), plus one independent page. Record the state list and conditions in Notes.
- **Files**: `js/134-avasthas.js` (engine `AVS`), `css/68-avasthas.css`, `tests/avasthas_test.js`, `tests/avasthas_browser_test.py`. Hook: tile in Analysis; text for `43-full-report-text.js` is optional (later).
- **Screen**: one card per graha: three state chips with a one-line plain meaning and the rule that gave it ("because it is in 14 degrees of an odd sign"). A summary line: how many of 9 are in a strong state. Tendency wording only.
- **API**: `AVS.compute(chart)` -> `{planets:{Sun:{baladi:{state,why},jagradadi:{...},deeptadi:{...}}}}`, `AVS.html(chart, profile)`, `AVS.text(chart)`.
- **Tests**: Baladi at the exact edges (0, 6, 12, 18, 24, 29.99 degrees) for an odd and an even sign; Jagradadi equals the app's dignity (own / exalted / friend / enemy) for all 9 x 12 signs; every output state is in the allowed list; no NaN.
- **Done when**: section 3.4 passes, and the page states which states are from the texts and which condition is this app's reading.
- **Notes (Session 1, DONE)**: Sources read: BPHS ch.45 (barbarapijan.com/bpa/Amsha/avasta_BPHS_ch45_Avasta.htm; its English text names 8 Deeptadi states though it says nine) and Wikipedia "Avastha (Hindu astrology)". They AGREE on: Baladi slices (5 x 6 deg, reversed in even signs), Jagradadi (own/exalted awake; friend/neutral dreaming; enemy/debilitated asleep), Deeptadi list (Deepta exalted, Swastha own, Pramudita great friend, Shanta friend, Deena neutral, Khala enemy, Kopa combust). They DISAGREE on Vikala (BPHS text: in company of a malefic; Wikipedia: in a malefic's sign) -> built the BPHS reading as an extra note. Lajjitadi wording differs between the two sources -> NOT built. Rahu/Ketu not built (lists are for 7 grahas). No compound friendship existed in the app (only natural), so `AVS.compound` was written and hand-tested. Own choices stated on the page: compound friendship, Moolatrikona counted as own sign, Kopa/Vikala as notes not replacements, debilitated planets take Deeptadi from the sign lord. Vriddha strength shown as "a little", Mrita as "hardly any" (BPHS: negligible / nil). NOT independently verified: a second classical text for Vikala; the Pramudita = adhi-mitra mapping ("thick friend" in the translation).

### A2 Vimshopaka bala (M)
- **Goal**: per planet a score out of 20 built from its dignity across a set of divisional charts.
- **Why**: summarises divisional-chart strength in one number; used to judge how reliable a planet's promise is.
- **Known rule (VERIFY)**: weights add to 20. Shadvarga: D1 6, D2 2, D3 4, D9 5, D12 2, D30 1. Saptavarga: D1 5, D2 2, D3 3, D7 2.5, D9 4.5, D12 2, D30 1. Dashavarga: D1 3, D2 1.5, D3 1.5, D7 1.5, D9 1.5, D10 1.5, D12 1.5, D16 1.5, D30 1.5, D60 5. Shodasavarga uses 16 charts (weights from the source). Points per placement: own sign 20, adhi-mitra 18, mitra 15, sama 10, shatru 7, adhi-shatru 5 (as a share of the weight). Compound (panchadha) friendship = natural relation combined with temporary relation (houses 2, 3, 4, 10, 11, 12 from the planet are temporary friends, the others enemies).
- **Source needed**: BPHS chapter on Vimshopaka, and one independent page for each weight set. The app only has natural friendship (`NATURAL_RELATIONS`): **first grep `14-shadbala-engine.js` for an existing compound/temporary relation (Saptavargaja bala uses one) and reuse it; otherwise write `compoundRelation(a, b, signA, signB)` with its own test.**
- **Files**: `js/135-vimshopaka.js` (`VIM`), `css/69-vimshopaka.css`, tests.
- **Screen**: bar per planet (score of 20) for the chosen set; switch between the four sets; tap a planet to see the table "chart, sign, relation, points". Plain bands (for example under 10 weak, 10 to 15 middle, over 15 strong) marked as this app's reading unless a source gives bands.
- **API**: `VIM.compute(chart, set)` -> per planet `{total, rows:[{varga, sign, relation, weight, points}]}`.
- **Tests**: weights of each set add to 20; an all-own-sign planet scores 20; compound relation symmetric cases hand-checked; varga signs equal `chart.vargas` values.
- **Done when**: 3.4 passes and a worked example is in the test comments.
- **Notes**:

### A3 Upagrahas (S)
- **Goal**: compute the five Sun-based upagrahas and list them with Gulika and Mandi.
- **Known rule (VERIFY, BPHS upagraha chapter)**: Dhuma = Sun + 133 deg 20 min. Vyatipata = 360 - Dhuma. Parivesha = Vyatipata + 180. Indrachapa = 360 - Parivesha. Upaketu = Indrachapa + 16 deg 40 min (equal to Sun - 30). Note: "Vyatipata" in `45-panchanga-engine.js` is a panchang yoga, a different thing; keep names separate (`UPA.Vyatipata`).
- **Source needed**: BPHS plus one more page for the five formulas and for whether Mandi equals Gulika in this app's school (the existing `117-gulika.js` says "Mandi by many teachers"; read it first and keep its stance).
- **Files**: `js/136-upagrahas.js` (`UPA`), extend `chart.upagraha` without changing existing keys; panel row or a small panel; `css` reuse `avk-` grid or a tiny new file.
- **Screen**: table: name, sign, degree, nakshatra pada, house; one plain line each on what it is ("a shadow point derived from the Sun"). Never claim effects without a source.
- **Tests**: all five from a known Sun longitude (hand-worked); Indrachapa/Parivesha relations hold for 1000 random longitudes; `chart.upagraha.Gulika` untouched.
- **Notes**:

### A4 Sensitive degrees (M, needs source tables)
- **Goal**: flag planets and the Lagna that sit in Gandanta, Pushkara navamsa / Pushkara bhaga, or Mrityu bhaga.
- **Known rule (VERIFY)**: Gandanta = the junction of Cancer-Leo, Scorpio-Sagittarius, Pisces-Aries, about 3 deg 20 min on each side (Gand Mool is already in Dosha Check: reuse its nakshatra rule; the 3D dashboard also has a gandanta check: read both and make one shared helper). Pushkara navamsa: specific navamsas per element. Mrityu bhaga: one degree per planet per sign (a table of 12 signs x planets).
- **Source needed**: **the Mrityu bhaga and Pushkara bhaga degree tables and the Pushkara navamsa list must be copied from a classical or reputable source and confirmed by a second one. Do not write them from memory.** Put the agreed tables in `tools/reading_gen/` style data comments with the source names.
- **Files**: `js/137-sensitive-degrees.js` (`SDG`), css, tests (every table row checked by a test that re-reads the table in a different form).
- **Screen**: list of the chart's points with a clear/flagged state and the exact degree; "none found" is a valid, calm result.
- **Notes**:

### A5 Sudarshana Chakra (M)
- **Goal**: draw three concentric 12-house rings, counted from the Lagna, the Moon and the Sun, with planets placed in each; show the house that the current year of age points to in each ring.
- **Known rule (VERIFY)**: the first year of life is the 1st house of every ring, the second year the 2nd house, and so on, cycling every 12 years. A planet's results are judged from each of the three references and compared.
- **Source needed**: one classical or reputable description of how the three readings are combined. If there is no agreed scoring, show **facts only** (planet-by-house in each ring, benefic/malefic counts by natural nature) and say so.
- **Files**: `js/138-sudarshana.js` (`SDC`), `css/70-sudarshana.css`, tests (ring geometry: 36 slots, each planet appears exactly 3 times; year-to-house cycle for ages 0 to 100).
- **Screen**: one SVG, three rings (use the Chakra Explorer's frame/gradient look), planet chips, age picker (default = today's age), a small table "house in Lagna / Moon / Sun ring".
- **Notes**:

### A6 Argala and Virodhargala (S)
- **Known rule (VERIFY: Jaimini Sutras / BPHS)**: for a house, planets in its 2nd, 4th and 11th cause argala (the 5th as a secondary place in some texts); the obstructing places are the 12th, 10th and 3rd (the 9th for the 5th-house argala). Argala stands if the planets in the obstructing houses are fewer than those causing it. Nodes and exceptions: read the source.
- **Source needed**: two texts; record the exact exceptions (Ketu, count rules, benefic/malefic argala).
- **Files**: `js/139-argala.js` (`ARG`), small panel under Analysis, tests with hand-worked houses.
- **Screen**: 12 rows (house, who causes argala, who obstructs, net result in plain words). Optional: tap a house to highlight on the chart.
- **Notes**:

### A7 Bhavat Bhavam and Bhava arudhas (S)
- **First**: grep `17-special-lagnas.js` for arudha pada code. The app lists "arudha padas"; if all twelve (A1 to A12) already exist, only build Bhavat Bhavam and link to the existing arudhas.
- **Known rule**: Bhavat Bhavam = the house counted from a house by the same number (the 7th from the 7th is the 1st); used to read the "second meaning" of a house.
- **Source needed**: one text for the use, one for the arudha rule if missing (the usual rule: count the lord's distance; exceptions when the result lands in the same or 7th house, then take the 10th from it).
- **Files**: `js/140-bhavat-bhavam.js` and a table inside an existing panel or a small new panel.
- **Notes**:

### A8 Ashtakavarga extras (L)
- **Goal**: Prastara tables, Sodhana (reduction), Shodhya pindas, Kakshya, transit Ashtakavarga.
- **Prastara (no new data)**: for each planet, a table of rows (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Lagna) by 12 signs, 1 where that contributor gives a bindu. **Build from `CONTRIBUTION_TABLE` and `computeBAV`: column sums must equal `chart.ashtakavarga.bavTables`.** (First sub-step, safe to ship alone: A8a.)
- **Sodhana (VERIFY)**: Trikona sodhana then Ekadhipatya sodhana on each planet's BAV, in that order; rules for trines (reduce by the smallest), exceptions with planets in the signs, and the own-sign pairs. Then Rasi pinda (sign multipliers) and Graha pinda (planet multipliers). **The multipliers and the exceptions must come from the source.**
- **Kakshya (VERIFY)**: each sign is cut into 8 parts of 3 deg 45 min ruled in order by Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon, Lagna; the bindu given by the kakshya lord to the planet decides if the transit in that part is supported. There is already a "kakshya" mention in `90-year-timeline-engine.js`: read it first and reuse.
- **Transit Ashtakavarga**: for today's sky, each planet's bindus in the sign it transits (BAV of that planet), the SAV of the sign, and the kakshya bindu. Link to the Fate Meter inputs but do not change its numbers.
- **Files**: `js/141-ashtakavarga-extras.js` (`AVX2`, avoid the existing `av-`/`avx-`/`avr-` class prefixes: use `asx-`), css, tests (A8a: Prastara sums equal BAV for 100 charts; Sodhana: totals never rise and match a hand-worked chart from the source).
- **Split into sub-steps; tick each in Notes**: A8a Prastara, A8b Sodhana + pindas, A8c Kakshya, A8d transit view.
- **Notes**:

### A9 Gochara vedha (S, needs source table)
- **Goal**: in Today for You and Live Sky, mark a favourable Gochara house as "obstructed" when the vedha house holds another planet.
- **Source needed**: **the vedha pairs per planet (favourable house and its obstructing house) from Phaladeepika or Brihat Samhita and a second source; also the exceptions (for example no vedha between certain pairs such as Sun and Saturn, Moon and Mercury).** Do not write them from memory.
- **Files**: `js/142-gochara-vedha.js` (`GVD`), then a small hook in `122-today-for-you.js` and `59-live-transit-form.js` (read both before editing; keep their output unchanged when no vedha applies).
- **Tests**: every pair table row symmetric where the source says so; no change to existing Today-for-You output for charts with no vedha.
- **Notes**:

### A10 Synastry (M)
- **Goal**: choose two saved profiles and show how they sit on each other.
- **Contents**: planets of A in the houses of B and of B in A; conjunctions and aspects between the two charts (use the app's aspect rule at sign level); the two Moon signs' relation; Lagna lord of each in the other's chart; link to the existing Ashtakoota score.
- **Known rule**: this is mostly factual placement. Anything interpretive (for example "7th lord in the 1st") needs a source line or stays out. Use tendency wording.
- **Files**: `js/143-synastry.js` (`SYN`), css, tests (A over B then B over A is consistent, swapping the two profiles gives the mirrored table).
- **Screen**: profile pickers (from the saved profile list), two tables, a summary of 3 to 5 strongest links with their reason.
- **Notes**:

### A11 Muhurta finder (L)
Split into three tickable sub-steps.
- **A11a Sources and decisions**: choose the first event types (suggested: marriage, griha pravesh, vehicle purchase, start of business, travel, naming). For each, copy from Muhurta Chintamani (and a second source) the allowed tithis, nakshatras, weekdays, yogas, avoided yogas/karanas, forbidden periods (Rahu Kalam, Panchaka, eclipse windows, Chaturmasya if used), month rules, lagna and its lords' conditions. Write them into `docs/MUHURTA_RULES.md` with source names; **the owner approves the list before A11b.** Decide school differences (North vs South, Amanta vs Purnimanta) and show a setting for each.
- **A11b Engine**: `js/144-muhurta-engine.js` (`MHT`): iterate days like `dfGen`, check Panchanga elements with `panchangaAt`, personal Chandrabala/Tarabala from the person's Moon (`TDY`), exclusion windows, and rank by a transparent count; return, for each good day, the reasons and the good time windows (use Choghadiya and, if the owner wants a rising-sign window, the rising timeline from sky3d js/18 logic: stop and ask first).
- **A11c UI**: `js/145-muhurta-ui.js`: event picker, date range, results list with reasons ("passes: tithi, nakshatra, Chandrabala; avoided: Rahu Kalam 10:30 to 12:00"), tap a day to open that day's Panchanga.
- **Tests**: every rule in `MUHURTA_RULES.md` has a test that builds a date that passes and one that fails; a known good wedding date from the source examples passes.
- **Notes**:

### A12 Monthly Panchang calendar (L)
- **Goal**: a month grid with tithi, nakshatra, paksha, sankranti, ekadashi, purnima/amavasya, major festivals and eclipses; tap a day to open the full Panchanga for that day.
- **Reuse**: `panchangaAt` for every day (check speed: 30 calls per month must stay fast; compute lazily per visible week if needed), `DF_FEST` for festival rules (read `27-date-finder-core.js` first), the eclipse test from the Date Finder (solar and lunar, from Moon latitude at new/full moon). **Festival and eclipse dates must match an authoritative published panchang for 3 known months; record the comparison in Notes.**
- **Settings**: place (birth place or any), Amanta/Purnimanta, regional festival set (start with the nationwide ones).
- **Files**: `js/146-panchang-calendar.js` (`PCAL`), `css/71-panchang-calendar.css`, tests (all 12 months of a year produce no empty day, tithi sequence continuous across days, eclipse list matches NASA dates for the test year).
- **Notes**:

### A13 Remedies (M, owner sign-off on tone)
- **Goal**: for each planet, the traditional remedies listed in the texts, shown gently, and linked to the planets the chart finds weak.
- **Rules of content**: say "traditionally", never promise results, no medical or money claims, no fear, gemstones carry "have a trusted astrologer confirm; stones can also disagree with a chart" and a note that mantra, charity, fasting and service are free options. No product links.
- **Source needed**: per planet the day, deity, bija and common mantra, charity items, and the gemstone, from a classical text plus a second source. The owner approves the tone and the list before coding.
- **Weak-planet link**: use A1 (avasthas) and the Shadbala ratio (`chart.shadbala`) with the thresholds the app already uses in `105-shadbala-reading.js`; do not invent a new threshold.
- **Files**: `js/147-remedies.js` (`RMD`), css, tests (wording ban list: no "guarantee", "cure", "will", "must"; every planet has all fields).
- **Notes**:

### A14 Wrap-up (S)
- Review that every new Home tile has a clear one-line description and sits in a sensible section; add search keywords (see `31-smart-search.js` `srchBuild`); add the new texts to the export report only if the owner wants it; update `README.md` "What's inside"; run all new tests and the neighbours once; list in Notes anything not verified; write the pull-request text for the owner.

## 6. Parked (do not start without the owner)
Lal Kitab, Panchapakshi, Nadi amsa / Nadi astrology, full Tajika Varshaphal (Muntha and Mudda exist in Tithi Pravesh; Tajika yogas exist only in Prashna), planetary friendship tables beyond the classical ones.

## 7. Session log (newest last, one line each: date, step, result, what is NOT verified)
- Session 0 (2026-11-08): gap audit, this plan, A0 done. Nothing built. Chakra Explorer (js/130, css/67) exists on `feature/chakra-explorer`; known open points from it: Kota Paala letter table (default is the navamsa lord, unverified), fast-planet threshold is a rule of thumb, one consonant cell read as Ba.

- Session 1 (2026-11-08): rebased on main (owner added Astro Atlas js/130-133), plan file numbers shifted to js/134+. A1 Planet States done and tested (engine 11 checks over 840 planet states, browser 7/7, screenshots viewed). Not verified: Vikala second source, Pramudita mapping.

## 8. Owner decisions pending
- Merge `feature/chakra-explorer` / `feature/astro-roadmap` to `main` and `Root` (the owner decides when).
- A11a: approve the Muhurta event list and school settings.
- A13: approve the remedy list and wording.
- Whether to keep the Chakra Explorer's Kota Paala override or supply the letter table.

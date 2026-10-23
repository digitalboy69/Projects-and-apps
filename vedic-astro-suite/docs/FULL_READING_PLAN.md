# Full Reading Plan (PDF-grade reading)

Goal: a detailed, personal PDF reading per chart (target 70-90 pages, ~40k words) built from the app's own calculations plus an
interpretation database. This file is the single source of truth: **read it at the start of every session, update the checklist
and the decisions log at the end.** Last updated: Session 0 (plan).

## 1. What exists today (audited, not assumed)
| Area | What is already there (file / function) |
|---|---|
| Chart core | `computeChart` -> `julianDay, ascendant, planets, outer, vargas (24), siderealLongitudes, wars, dashaData, yogas, ashtakavarga {bavTables, sav}, charaKarakas, shadbala` |
| Timing | Vimshottari 5 levels (`10-`), 36 dasha systems (`78-82`), `37-dasha-check-date`, `46-transit-stays` (Sade Sati/Dhaiya), `04-transit-timing`, `71-life-activation`, `30-life-event-checker`, `75-fate-meter` |
| Strength | `computeShadbala` (`14-`), `computeFullAshtakavarga` (`11-`), `computeBhavaBala` (`72-`), `47-bhava-chalit` |
| Text today | `87-vedic-knowledge-db` (625 entries, ~27k words) + `88-deep-reading` (~5.2k words per chart); old `70-chart-reading` (3 phrases per planet); AREAS table with 8 life areas (houses, karakas, matching varga) |
| Output | Full report = TXT only (`43-full-report-text`, `44-export-modal`). Current report ~11.5k words (~23 pages) |

## 2. Gaps (what the plan fills)
1. **Yogas**: app detects 6 types (Pancha Mahapurusha, Gaja Kesari, Raja, Parivartana, Viparita, Neecha Bhanga); DB describes 23; target ~80 with detectors.
2. **No text** for: Mahadasha/Antardasha periods, planet-in-nakshatra, planet-by-rising-sign, divisional charts (D9, D10...), transits/Sade Sati phases.
3. **No synthesis**: nothing turns shadbala + ashtakavarga + bhava bala + varga dignity + dasha into a judgment per life area.
4. **No PDF** (text file only), no chart images in a document.
5. **No validation** on real, reviewed charts.

## 3. Target report (Professional level)
cover + summary 3p | foundation (rising, Moon, nakshatra, functional nature) 6p | planets 18p | houses 14p | yogas & doshas 8p |
dasha life timeline 12p | 9 life areas 14p | divisional charts 6p | transits next 3 years 5p | appendix + disclaimer 3p  (~89p)

## 4. Architecture
**Layer schema v1 (decided in S1; every layer follows it).** A layer is a database keyed by *placements*, not a list of finished sentences:
facts in (planet, nakshatra, pada, house, sign...) -> **facets** out (style, keywords, strengths[], shadows[] = points to watch, relating, wellbeing,
practices[] = supportive actions) + a numeric **score/ease** and a **tone** (supportive / mixed / challenging) + **tags** for filtering ->
**text composed from the facets**. Why: it covers every combination (e.g. 972 nakshatra placements from 27 + 9 small tables), a future rules
engine (S6) can add the scores of different layers, and the wording stays about tendencies and potential ("tends to", "can"), never fixed fate.
Rules: no absolute/fatalistic words (tests enforce), facets are hand-written, composition is rule-based and unit-tested against the app's own engine.

**Schema v1.1 - MANIFESTATION (added in S2 after the user said the reading "doesn't feel personal").** Meaning alone is abstract; people recognise
themselves in *situations*. Every layer must also say how it shows up in real life, in second person ("you tend to", "you may"):
planet = what you DO (habits, at best, under strain, how others experience it, how it feels inside), house = WHERE (an arena: theme + concrete
everyday scenes), sign = HOW (manner/pace), nakshatra = texture (scene, others, at best, under strain). Each manifestation ends with **self-check
questions** ("Does this ring true: ...?") so the reader confirms or rejects every line; a rejected line is useful (look at the sign lord, aspects, dasha).
The top of the Deep reading is a personal **"Your signature at a glance"** picked from the whole chart. Later layers (dasha, yogas, life areas,
vargas, transits) must provide manifestation facets + self-check questions too.
1. **Database** (hand-written core + rule-based fill), split into small files, each with tests: see phases.
2. **Rules engine**: factor scores -> bands (very strong / strong / mixed / weak / very weak) -> narrative variants. All weights in one table per file (like `W` in the Triggers engine), tunable.
3. **Report builder**: one data model (`sections[]`) rendered three ways: screen tabs, TXT, PDF.
4. **PDF**: v1 = print stylesheet + "Save as PDF" (zero dependencies, offline, works on phones); v2 = direct download via a vendored library only if v1 is not good enough. Decide in S10.
5. **Optional later (hybrid)**: AI writer for summary/life-area prose, grounded on database facts. Not before S9; needs server key.
Size budget: app is ~2.8 MB single file; allow +2 MB; if exceeded, lazy-load reading data on first use.

## 5. Sessions (each = one "Continue" block; ~12 total)
Every session: build -> its own test -> commit -> push to `feature/full-reading` -> tick the box. Merge to `main` only at milestones (M1-M4).

- [x] **S1 Nakshatra layer** (`js/89-vedic-nakshatra-db.js`, `VNK`): 27 nakshatra facet records + 7 nature groups + 9 planet facets; 972 placements (9 planets x 27 x 4 padas) + Lagna 108 + Moon birth star composed on demand; relation to the nakshatra lord (own/friend/neutral/enemy) gives ease/tone; pada -> navamsa sign -> Purushartha flavour. Wired into Deep reading (planet cards, birth-star + rising-nakshatra notes) and the report. `tests/nakshatra_db_test.py`: pada->navamsa equals the app's D9 for 8 charts, Moon star = dasha start lord.
- [x] **S2 Lagna + manifestation layer** (`js/90-reading-manifest.js`, `VMF`, schema v1.1) - DONE: planet x house x sign manifestation for all 1296 combinations (3 concrete scenes, others/inside/at best/under strain, 2 self-check questions, dignity cue); 12 rising-sign profiles (first impression, body language, first reaction, how others describe you, what life keeps asking); Lagna-lord arc by house; `signature(chart)` = "Your signature at a glance"; nakshatra manifest facets (scene/others/at best/under strain) added to VNK. Wired into Deep reading (signature at the top, "In real life" block in every planet card, report). `tests/manifest_test.py`. S2b DONE: `VMF.role(planet, risingSign)` = functional role (kind + houses ruled, from VDB.functionalNature) told through manifestation, 7 planets x 12 = 84 (nodes own no sign: use `placement`); `VMF.moonProfile(sign)` = 12 Moon-sign profiles (needs, comfort, stress, close relationships, helpful habit). Wired into Deep reading and the report.
- [x] **S3 Dasha layer** (`js/91-dasha-reading.js`, `VDA`, schema v1.1): every Mahadasha of the life (dates/lords from the app's own engine) with theme, how it feels, where the lord sits (arena), houses it rules, 2 real-life lines, helps/watch, tone (functional nature + dignity + house, reasons shown) and a self-check question that looks back at past stages; 9 Antardashas per Mahadasha and a gap-free next-5-years table with main-lord x sub-lord blend (81 pairs) and house relation; Now tab shows the running Mahadasha + Antardasha. Charts past the 120-year cycle degrade gracefully. `tests/dasha_reading_test.py`. **-> M1 (merge)**. Simplification vs the original wording: planet x house texts reuse VMF instead of 108 new texts.
- [x] **S4 Yogas I** (`js/92-yoga-engine.js`, `YGE`, schema v1.1, generated by `tools/reading_gen/build_yg.py`): 41 yogas with exact detectors - Moon (Sunapha, Anapha, Durudhara, Kemadruma + cancellation, Adhi, Gaja Kesari, Chandra-Mangala, Shakata + cancellation, Amala), Sun (Vesi, Vasi, Ubhayachari, Budhaditya), Guru-Mangala, Lakshmi, Saraswati, Dhana, Parivartana types (Maha/Khala/Dainya), Viparita (Harsha/Sarala/Vimala), Neecha Bhanga (3 rules), Dharma-Karmadhipati, Raja (kendra-trikona), Pancha Mahapurusha (5), Chamara, Sankha, Kalanidhi, Vasumati, Kartari (Lagna/Moon, benefic/harsh), Chatussagara, Daridra caution. Each result shows the rule matched with the real placements, meaning, 2 real-life scenes, at best, watch, self-check question. Wired into Deep reading ("Yogas in your chart") and the report. `tests/yoga_engine_test.py`: 41 charts that have each yoga + 41 that do not, cross-check vs the app's own detectors on 8 real charts. Strength rating and timing hints come in S5.
- [x] **S5 Yogas II + doshas** (same `YGE` engine, now 83 items): +42 - Yogakaraka, Trikona/Labha-Dhana/Bhagya/Karma links, Lakshmi-Narayana, Shani-Mangal, Surya-Shani, Vish, Digbala, Kahala/Parvata/Mridanga, Amavasya/Purnima, Nabhasa patterns (Rajju, Musala, Nala, Maala, Sarpa, Gada, Sakata, Vihaga, Sringataka, Hala, Vajra, Yava, Gola, Yuga, Sula, Kedara, Pasha, Dama, Veena) and doshas (Manglik with cancellations, Kaal Sarp, Guru Chandala, Surya/Chandra Grahan, Shrapit, Angaraka). Every result has a strength level (strong/moderate/mild, with reason from dignity and combustion) and a timing hint from the Mahadasha of its planets (running now / next). Fixtures: 83 has/does-not-have charts in tests/yoga_engine_test.py. **M2 reached: full test set passes.**
- [x] **S6 Life-area engine** (`js/94-life-areas.js`, `LAE`, generated by `tools/reading_gen/build_la.py`): 9 areas (career, money, marriage, children, health, learning, foreign, home, inner life) scored 0-100 = house strength (Ashtakavarga points + occupants) 24% + house lords (shadbala + placement) 20% + natural significators 16% + matching divisional chart dignity (D10/D2/D9/D7/D6/D24/D4/D20) 10% + related yogas from YGE 15% + dasha support (running period and next 5 years, shown separately as now / next5) 15%; raw score calibrated on 12 sample charts (mu 57.9, gain 2.4 -> sd about 11.5, 4 bands: Strong/Steady/Mixed/Needs care). Every score lists its reasons (pos/neg). Shown in Deep reading ("Life areas" section), report text and PDF. `tests/life_areas_test.py`: bounds, determinism, calibration spread (12 charts x 9 areas), per-input sensitivity (SAV up -> house part up, lord strength down -> lords part down, dasha moves with date), screens. Charts older than 120 years get a neutral timing note. Narratives per band come in S7.
- [x] **S7 Life-area narratives** (`js/95-life-narratives.js`, `LAN`, generated by `tools/reading_gen/build_ln.py`): for each of the 9 areas a composed personal reading of 430-690 words (mean about 580) from the engine's facts: stance by band (4 per area), where the main house lord sits and how that shows in daily life (VMF), everyday scenes of the house, what supports you (top reasons + strongest parts), what deserves care (weakest reasons + parts), yoga modifiers (YGE), timing (running period + next 5 years), how the score is built, practices (band-aware), self-check questions, closing. Shown as a fold-out story under each area in Deep reading, in the report text and inside the PDF. `tests/life_narratives_test.py`: 12 charts x 9 areas (length, fixed structure, wording bans, no sentence that contradicts a score, area texts differ across charts, story reacts to changed facts). Heading wording is 'may', not 'will'. **M3 reached: full test set passes.**
- [x] **S8 Divisional charts** (`js/96-varga-reading.js`, `VGR`, generated by `tools/reading_gen/build_vg.py`): D9 (marriage and values, with Vargottama), D10 career, D7 children, D4 home/property, D24 learning, D20 spirituality. Each: what the chart shows, rising sign of the varga, the houses that matter for the area (sign, lord, lord's strength, occupants), planet by planet in the varga (house of the varga chart, strong/weaker sign, vargottama, key-planet and house-lord roles; text from VMF planet x house x sign), strength summary + score/band, 2 self-check questions (450-700 words per chart). Positions come from the app's own `chart.vargas`. Shown as 6 fold-outs in Deep reading ("Divisional charts"), in the report and in the PDF. `tests/varga_reading_test.py`: 12 charts x 6 vargas cross-checked with the app's varga data, dignity and VDB's D9 vargottama; variation; one-fact sensitivity (Venus exalted/debilitated in D9).
- [x] **S9 Transits & Sade Sati** (`js/97-transit-reading.js`, `TRS.assess(chart,profile,{now})`, tables in build_ts.py; shown in Deep reading 'transits', report and PDF section 'transits'; tests/transit_reading_test.py; charts beyond the 100-year transit range report unavailable): Sade Sati/Dhaiya phase texts, Saturn/Jupiter/Rahu through each house from the Moon (gochar), 3-year sign-change calendar, double-transit windows (reuse the 3D Sky Triggers logic), year-by-year outlook per area.
- [x] **S10 PDF builder** (`js/93-pdf-report.js`, `PDFR`, `css/40-pdf-studio.css`; hand-written, no libraries, no network): `PDFR.build(chart, profile, opts)` makes one self-contained HTML document (cover, contents, 10 sections: signature, chart + planet table, foundation, planet roles, yogas, points to watch, life areas (scores + full stories), life timeline, house by house, house-strength bars; inline SVG North Indian chart and Ashtakavarga bars; Ivory/Midnight themes; A4/Letter; page numbers via @page; closing page). `PDFR.open()` = PDF Studio dialog (live preview, section toggles, title/subtitle/prepared-by, self-check and 'why it shows' switches, Save as PDF through the print dialog in a hidden iframe, Download HTML). Entry points: export dialog button and the Deep reading overview. `tests/pdf_report_test.py` (4 variants x 4 charts, Studio, real PDF render). Later: reuse for new layers (life areas S6-S8, transits S9) by adding builders to BUILD/SECTIONS; customer-edition brand header = the 'Prepared by' field for now.
- [x] **S11 QA** (tests/reading_qa_test.py, 12 charts; docs/ASTROLOGER_REVIEW_SHEET.md; fixes: D11 label softened, 'always' wording in Budhaditya/Mrigashira text; open: older Foundation text still has 'death' in places, needs human review): 10 sample charts (incl. edge cases); invariants (no undefined, no duplicate paragraphs, section coverage, word counts, no contradictions within one area); "astrologer review sheet" for a human reviewer; fix list. **-> M4 (merge)**
- [x] **S12 Polish & release** (done: brand on cover/headers/closing page from `__VAX_BRAND`, disclaimers + birth-time note in the book, speed/size budgets in tests/pdf_report_test.py, docs/RELEASE_CHECKLIST.md; AI writer decided: not now): disclaimers, speed, size budget, customer edition, docs; decide on the optional AI-writer step.
- [x] **S13 Area deep dive** (done: js/99-area-deep.js via tools/reading_gen/build_dd.py; about 1,900 words per area across D1-D144, Ashtakavarga, Shadbala, drishti, yogas and timing, plus love, partner, workstyle, keeping and path extras; shown in Deep reading, the report and the PDF; tests/area_deep_test.py): long connected pattern readings for each life area.
- [x] **S14 Right now (12 houses)** (done: js/100-house-now.js via tools/reading_gen/build_hn.py + js/101-house-now-ui.js; first tab of Chart Reading, report text and first PDF page of the Time part; each house read from sign, lord, natal planets, today's transits, aspects, nakshatras and Mahadasha/Antardasha/Pratyantar; tests/house_now_test.py): how life is going now, house by house and area by area.
- [ ] **S15 Richer dataset with states** (in progress): [x] 15a planet states (js/102 PST: exalted, debilitated + cancellation, own, friend, neutral, enemy, retrograde, combust, vargottama, navamsa, house, combinations; tests/planet_states_test.py); [ ] 15b dasha and pratyantar texts by lord state; [ ] 15c nakshatras by planet state; [ ] 15d houses and signs by occupant state; [ ] 15e yogas by state and older Signature text.

## 6. Working rules (every session)
1. Start: read this file + `AI_GUIDE.md`; take the next unchecked session. Do not skip ahead.
2. Facts come from the app's calculations; wording comes from the database; never hard-code a chart-specific answer.
3. Every text table ships with a test: expected counts, uniqueness, placeholder/grammar gates, cross-check against engine tables (see `tests/knowledge_db_test.py`).
4. Hand-written core + rule-based fill; mark which is which in each file header. All text is original (no copying from books/sites).
5. Soft language ("tends to", "can"); no predictions of death or medical outcomes; no fear-based wording; short disclaimer in the PDF.
6. Push to `feature/full-reading` every session (cheap). Merge to `main` at M1-M4 only: rebase on latest `main` (it moves), run all tests (`smoke`, `customer_smoke`, `popular_charts_test`, `knowledge_db_test`, `deep_reading_test` + new ones), fresh-clone check, fast-forward merge.
7. End: tick the box, update section 8 (decisions) and the AI_GUIDE changelog line.

## 7. Decisions (defaults chosen; change any by telling me)
| # | Question | Default |
|---|---|---|
| 1 | Language | English first; Hindi/Telugu after S12 |
| 2 | Remedies (gems, mantras, charity) | **Off.** Only a gentle "guidance" paragraph per area |
| 3 | PDF route | Print stylesheet + Save as PDF first (S10) |
| 4 | AI writer | Not until after S9; database-only until then |
| 5 | Dasha system in the report | Vimshottari only (others stay in the app) |
| 6 | Divisional charts in the report | D9, D10, D7, D4, D24, D20 |
| 7 | Brand header in PDF | Yes for customer edition (existing brand profile) |
| 8 | Age/sensitivity | Neutral wording on health, children, marriage timing |

## 8. Decisions log / progress notes
- Session 0: audit done, plan written, defaults set. Nothing built yet.
- System session: generators moved into tools/reading_gen (reproduce the 4 databases byte for byte), tools/ai/session.sh (start/check/test/ship), tests/prod_forms_check.py, docs/AI_START_HERE.md, .gitattributes merge rules. M1 (S2+S3) merged to main (875b075). Next: S2b, then S4 yogas.
- Session 3: dasha layer built on VMF/VDB (small per-planet table + composition). Deep reading tab now has a Life timeline (card per Mahadasha, current open) + next-5-years rows; test counts house cards as the last 12. M1 = merge of S2 + S3 to main.
- Session 2 (part 1): user feedback: "something is missing - how it manifests in reality; it doesn't feel personal". Added schema v1.1 (manifestation + self-check questions + second-person voice) and the signature summary; rising-sign profiles done as part of it. Voice rule: second person for manifestation text; the older VDB texts stay third person for now (S2b/S3 restate them where useful).
- Session 1: nakshatra layer built under Layer schema v1 (facets + scores + tags, composed text). User asked for databases that work for all placements instead of fixed fate sentences; later layers (S2+) follow the same schema, and S2 will also restate the existing VDB planet-in-house/sign tables as facets where useful. Pushed to `feature/full-reading` (not merged; next merge is M1 after S3).
- Session 4: S2b done (role by rising sign 84 + Moon-sign profiles 12 in tools/reading_gen/build_vmf.py, tests in manifest_test). S2 ticked. Next: S4 Yogas I.
- Session 4 (cont.): S4 done (41 yogas, detectors + facets + tests). Neecha Bhanga here does not count 'kendra from the Moon' when the dispositor is the Moon itself (trivially true in the app's older detector). Next: S5 Yogas II + doshas (-> M2: run the full test set).
- Session 5: S5 done and M2 (full test set) passed. Next: S6 Life-area engine (9 areas, score 0-100 from house strength, lords/karakas, varga, yogas, dasha; calibrate on 10 charts).
- Session 5 (cont.): Deep reading reorganised into 7 numbered sections (Overview, Who you are, Planet roles, Yogas, Points to watch, Life timeline, House by house) with a sticky jump bar; yogas grouped by kind, doshas separate. Same pane and same text, so older tests are unchanged; section test lives in yoga_engine_test.
- Session 5 (cont.): S10 PDF builder done early (it only needs the existing layers; new layers plug in as extra section builders). Next: S6 Life-area engine.
- Session 6: S6 done. Calibration constants live in build_la.py (CAL, BANDS, WEIGHTS); re-fit if weights change. Next: S7 Life-area narratives (400-600 words per area, per band + configuration modifiers) -> M3.
- Session 6 (cont.): S7 done, M3 passed. Next: S8 Divisional charts (D9 etc. text per varga), S9 Transits and Sade Sati, then S11 QA and S12 polish (S10 PDF already built).
- Session 7: S8 done. Next: S9 Transits and Sade Sati, then S11 QA (10 sample charts, invariants, astrologer review sheet) and S12 polish.
- Session 8: S9 done. Next: S11 QA (M4), then S12 polish.
- Session 9: S10-S12 done; S13 Area deep dive done (long pattern paragraphs per life area). Next: relatability pass (top signals, scene library, time anchors) once the user picks a direction.
- Session 10: S14 Right now done. Next: relatability pass (top signals, scene library) when the user picks a direction.
- Session 9: S11 done, M4 passed. Next: S12 polish and release.
- Session 10: S14 Right now done. Next: relatability pass (top signals, scene library) when the user picks a direction.
- Session 9 (cont.): PDF rebuilt as a one-click book (no Studio/settings): dark cover with zodiac wheel, contents, 9 part dividers, 21 sections (js/93 core + js/98 extra pages): panchang, planet pages, special lagnas + Bhava Chalit, Shadbala, Ashtakavarga heat map, all 24 divisional charts drawn, every Mahadasha/Antardasha, life-area plates, house plates, glossary, notes. About 125 pages. tests/pdf_report_test.py rewritten.
- Session 9 (fix): PDF no longer opens a blank print window first; prints once when the book is loaded.
- Session 10: S12 done. All plan steps ticked (S1-S12). Remaining work is outside the plan: astrologer review of the sheet, checkout/delivery, Hindi/Telugu.

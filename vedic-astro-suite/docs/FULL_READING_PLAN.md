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
- [~] **S2 Lagna + manifestation layer** (`js/90-reading-manifest.js`, `VMF`, schema v1.1) - DONE: planet x house x sign manifestation for all 1296 combinations (3 concrete scenes, others/inside/at best/under strain, 2 self-check questions, dignity cue); 12 rising-sign profiles (first impression, body language, first reaction, how others describe you, what life keeps asking); Lagna-lord arc by house; `signature(chart)` = "Your signature at a glance"; nakshatra manifest facets (scene/others/at best/under strain) added to VNK. Wired into Deep reading (signature at the top, "In real life" block in every planet card, report). `tests/manifest_test.py`. REMAINING (S2b): planet role by rising sign 9x12 in facet form (functional nature as manifestation), Moon-sign long profiles 12.
- [x] **S3 Dasha layer** (`js/91-dasha-reading.js`, `VDA`, schema v1.1): every Mahadasha of the life (dates/lords from the app's own engine) with theme, how it feels, where the lord sits (arena), houses it rules, 2 real-life lines, helps/watch, tone (functional nature + dignity + house, reasons shown) and a self-check question that looks back at past stages; 9 Antardashas per Mahadasha and a gap-free next-5-years table with main-lord x sub-lord blend (81 pairs) and house relation; Now tab shows the running Mahadasha + Antardasha. Charts past the 120-year cycle degrade gracefully. `tests/dasha_reading_test.py`. **-> M1 (merge)**. Simplification vs the original wording: planet x house texts reuse VMF instead of 108 new texts.
- [ ] **S4 Yogas I**: ~40 yogas with exact detectors (Chandra yogas incl. Kemadruma + cancellation, Budhaditya, Chandra-Mangala, Vesi/Vasi/Ubhayachari, Adhi, Dhana, Lakshmi, Saraswati, Amala, Parivartana types, Vipareeta types, Neecha Bhanga rules).
- [ ] **S5 Yogas II + doshas**: ~80 total; doshas (Manglik with cancellations, Kaal Sarp, Guru Chandala, Grahan, Shrapit); strength rating per yoga (dignity/shadbala), timing hint (when the yoga planets' dasha runs), cautions. Fixtures: each yoga has a chart that has it and one that does not. **-> M2**
- [ ] **S6 Life-area engine**: 9 areas (career, money, marriage, children, health, education, foreign, home/property, spirituality). Score 0-100 from: house strength (bhava bala + SAV bindus), lord + karaka strength (shadbala), matching varga dignity, related yogas, dasha support now/next 5 years. Calibrate on 10 charts (avoid everything-is-strong).
- [ ] **S7 Life-area narratives**: headline / strengths / watch-outs / timing / guidance per area x band, plus configuration modifiers. 400-600 words per area. **-> M3**
- [ ] **S8 Divisional charts**: D9 (+ Vargottama, marriage/dharma), D10 career, D7 children, D4 property, D24 education, D20 spirituality: planet-in-sign text per varga (rule-based on VDB x domain), varga lagna, strength summary.
- [ ] **S9 Transits & Sade Sati**: Sade Sati/Dhaiya phase texts, Saturn/Jupiter/Rahu through each house from the Moon (gochar), 3-year sign-change calendar, double-transit windows (reuse the 3D Sky Triggers logic), year-by-year outlook per area.
- [ ] **S10 PDF builder**: cover, contents, page numbers, chart images (SVG from `61-varga-chart-svg`), tables and bars (planets, dasha timeline, SAV, shadbala), customer-edition brand header. Print stylesheet first; test on a phone-size viewport and A4.
- [ ] **S11 QA**: 10 sample charts (incl. edge cases); invariants (no undefined, no duplicate paragraphs, section coverage, word counts, no contradictions within one area); "astrologer review sheet" for a human reviewer; fix list. **-> M4 (merge)**
- [ ] **S12 Polish & release**: disclaimers, speed, size budget, customer edition, docs; decide on the optional AI-writer step.

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
- Session 3: dasha layer built on VMF/VDB (small per-planet table + composition). Deep reading tab now has a Life timeline (card per Mahadasha, current open) + next-5-years rows; test counts house cards as the last 12. M1 = merge of S2 + S3 to main.
- Session 2 (part 1): user feedback: "something is missing - how it manifests in reality; it doesn't feel personal". Added schema v1.1 (manifestation + self-check questions + second-person voice) and the signature summary; rising-sign profiles done as part of it. Voice rule: second person for manifestation text; the older VDB texts stay third person for now (S2b/S3 restate them where useful).
- Session 1: nakshatra layer built under Layer schema v1 (facets + scores + tags, composed text). User asked for databases that work for all placements instead of fixed fate sentences; later layers (S2+) follow the same schema, and S2 will also restate the existing VDB planet-in-house/sign tables as facets where useful. Pushed to `feature/full-reading` (not merged; next merge is M1 after S3).

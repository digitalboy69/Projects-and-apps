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
1. **Database** (hand-written core + rule-based fill), split into small files, each with tests: see phases.
2. **Rules engine**: factor scores -> bands (very strong / strong / mixed / weak / very weak) -> narrative variants. All weights in one table per file (like `W` in the Triggers engine), tunable.
3. **Report builder**: one data model (`sections[]`) rendered three ways: screen tabs, TXT, PDF.
4. **PDF**: v1 = print stylesheet + "Save as PDF" (zero dependencies, offline, works on phones); v2 = direct download via a vendored library only if v1 is not good enough. Decide in S10.
5. **Optional later (hybrid)**: AI writer for summary/life-area prose, grounded on database facts. Not before S9; needs server key.
Size budget: app is ~2.8 MB single file; allow +2 MB; if exceeded, lazy-load reading data on first use.

## 5. Sessions (each = one "Continue" block; ~12 total)
Every session: build -> its own test -> commit -> push to `feature/full-reading` -> tick the box. Merge to `main` only at milestones (M1-M4).

- [ ] **S1 Nakshatra layer**: planet-in-nakshatra 9x27 (rule-based from nakshatra trait x planet drive), Lagna-nakshatra 27, Moon-nakshatra pada 27x4 (short, hand-written). Wire into Deep reading + report. Test vs `NAKSHATRAS`.
- [ ] **S2 Lagna layer**: planet role by rising sign 9x12 (from lordship rules + notes), 12 long rising-sign profiles (~300 words), Moon-by-sign 12 long, Lagna lord by house 12 long. Wire.
- [ ] **S3 Dasha text layer**: Mahadasha planet x house 9x12 (hand-written ~60 words), MD x rising-sign function, Antardasha pairs 9x9, "life timeline" section (every Mahadasha with dates + theme; next 5 years Antardasha table). Wire into Now tab + report. **-> M1 (merge)**
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

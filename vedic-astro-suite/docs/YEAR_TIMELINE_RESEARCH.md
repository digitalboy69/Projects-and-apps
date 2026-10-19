# Year Timeline Pack: research + data plan

Written 19 Oct 2026. Status: **research and plan only, no code yet.** Read this before building.

## 1. The idea in one paragraph
The user picks a start date and an end date. The app builds **one structured file** with everything an AI needs to read that period of the person's life:
a dated timeline of planet movements, transits over the birth chart, aspects, nakshatra changes and Vimshottari changes, plus a clear map of
**which planet controls what in this person's life**. The app tells **no story**. It only produces correct, complete, well-organised data. The user pastes or
uploads the file into any AI, and the AI writes the themes. The main design goal: *two different AIs (or the same AI twice) should reach the same facts.*

## 2. What the research found

### 2.1 How astrologers build a year view (so we include the right data)
- The usual order is: **natal promise, then running dasha, then slow transits, then check that they agree** on the same theme in the same window. Transits are said to activate only what the birth chart already promises. ([Paramarsh: dasha-transit techniques](https://paramarsh.app/patrika/dashas-transits/dasha-transit-predictive-techniques))
- **Slow planets** (Saturn, Jupiter, Rahu/Ketu) set structural themes. Mars adds sharper events. Sun, Moon, Mercury and Venus are for short-window fine tuning. Same source.
- A transit has stages: entering a house (wide period), approaching the natal degree (focus rising), exact contact (peak), separating (release). So the file needs **ingress, approach, exact and separation dates**, not just "Saturn is in Aquarius".
- An annual scan = list the year's slow-planet ingresses and aspects, find windows where two or three touch the same house, keep those where the dasha also touches that house. This is the "convergence table" in section 4.
- **Two traditions to keep apart:** (a) dasha + transit (gochara) over the birth chart, which is what this feature is; (b) Varshaphal / Tajika, a separate chart cast for the solar return with its own year lord and Varsha dasha ([VedAstro: annual horoscopes](https://vedastro.org/blog/Hindu-Predictive-Astrology-Chapter-33-Annual-Horoscopes.html)). Our app already has Tithi Pravesh and 36 Tajika Sahams. Keep (b) out of v1; offer it later as an optional section.

### 2.2 Gochara (transit) facts we can state without inventing rules
Source: [DekhoPanchang: Gochar](https://dekhopanchang.com/en/learn/gochar)
- Transit house from the Moon = transit sign minus natal Moon sign, plus 1. Advanced practice also reads transits **from the Lagna** and from the relevant house lord. **We will print both.**
- Typical time in a sign: Moon about 2.25 days; Sun, Mercury, Venus about a month; Mars about 1.5 months; Jupiter about a year; Saturn about 2.5 years; Rahu/Ketu about 1.5 years.
- Double transit: Jupiter aspects the 5th, 7th, 9th from its place; Saturn aspects the 3rd, 7th, 10th. An event theme needs both on the same house, plus dasha support.
- Sade Sati phases = Saturn in the 12th, 1st, 2nd from the natal Moon.
- Tara Balam favourable Taras listed: 2, 4, 6, 8, 9.
- **Not verified:** the page lists "good houses" only for Jupiter and the Moon. Good/bad house lists for Sun, Mars, Mercury, Venus, Saturn and the vedha (obstruction) pairs are *not* confirmed by any source I read.
  Project rule 8 says no rules without a verifiable source, so **v1 prints the house numbers and strengths as facts and does not label transits good or bad.** Letting the AI judge from facts is also the goal.

### 2.3 Ashtakavarga as a strength filter
Source: [DekhoPanchang: Ashtakavarga](https://dekhopanchang.com/en/learn/ashtakavarga)
- Bhinna Ashtakavarga gives each planet 0 to 8 points per sign. The page calls **4** the key cut-off; 0 to 1 is shown as serious trouble.
- Sarvashtakavarga (SAV) totals 337 across 12 signs, average about 28. 28 or more is called strong, under 25 weak.
- Kakshya: each sign is split into eight parts of 3°45', ruled in the order Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon, Lagna. A transit in a part ruled by a contributor tends to be favourable. The page does not say how to combine this with the sign score, and it notes that "reduced" (Shodhana) tables are described differently in different places.
- Plan: for every sign ingress print the transiting planet's own points in that sign and the sign's SAV. Kakshya part and ruler at ingress and at stations is a cheap, precise extra. Paramarsh calls Ashtakavarga a secondary filter, not proof.

### 2.4 Vimshottari details that change the dates
Source: [DekhoPanchang: dasha year length](https://dekhopanchang.com/en/learn/dasha-year-length)
- The texts do not fix the length of a "year". The mainstream choice is **365.25 days** (JHora and most tables). Savana 360 days is a minority choice and makes a 19-year Saturn period about 100 days shorter.
- **Our engine uses 365.25** (`addYearsToDate` in `birth-chart/js/10-vimshottari-dasha-engine.js`). The file header must say so, so any AI or astrologer comparing with other software knows why dates may differ.

### 2.5 "Which planet controls what in this life" (functional roles)
Source: [Astromitra: functional benefics and malefics](https://www.astromitra.com/Functional_Malefic_Benefic_Planets.php)
- Function depends on **house lordship for this rising sign**, not only the planet's natural nature. In this source: lords of the 1st (not the Moon), 5th and 9th are benefic; 3rd, 6th, 11th lords are malefic; kendra lords change role depending on whether the planet is naturally benefic; Sun/Moon as 8th, 2nd or 12th lord and the Moon as Lagna lord are neutral. Example: for Taurus rising, Saturn rules the 9th and 10th.
- The source does **not** cover maraka, yogakaraka or Rahu/Ketu. Our app already has `functionalNature` (`birth-chart/js/87-vedic-knowledge-db.js`). **Reuse it as is; do not add new rules.**
- For the "role map" we print, for every planet: houses it rules, house and sign it sits in, dispositor, natural significations (the app's AREAS table), functional nature from `functionalNature`, strength numbers (Shadbala, own-sign Ashtakavarga points), and a flag for whether it is the **running Maha / Antar / Pratyantar lord** in the period. That last flag shows which planet "controls" the time.

### 2.6 What AI needs so it does not guess or drift
- Chatbots do not calculate positions. One vendor test (a company blog, so treat it as indicative, not proof) found slow planets mostly close, but the Moon, inner planets and Ascendant far off (about 8° on average; Venus about 23°; the Ascendant sometimes in the wrong sign, which moves every house). Their fix: give computed values to the model as ground truth and let it handle only the narrative ([RoxyAPI](https://roxyapi.com/blogs/ai-chatbot-hallucinates-birth-charts-grounding)). Our whole design follows this.
- Format. A preprint (not peer reviewed; 5 models, one synthetic data set) found **no format wins everywhere**; adherence to instructions **drops sharply as the number of rules grows** (for one model, perfect answers fell from about 94% at 10 rules to about 24% at 40); recall was near perfect up to roughly 64k tokens, then differed a lot by format at 128k and above ([arXiv 2607.19257](https://arxiv.org/pdf/2607.19257)). A practitioner article advises keyed Markdown or YAML-like records for data, one consistent style for instructions, and clear cues when mixing data and instructions ([Tian Pan](https://tianpan.co/blog/2026-05-07-context-format-decision-agent-reasoning-json-markdown-plain-text)).
- What we take from this:
  1. **Few instructions** at the top (8 or fewer) and no long prompt.
  2. **Keyed Markdown** (tables and "key: value" lines), one style, with a clear line saying where instructions end and data begins.
  3. **Keep the file well under about 40k tokens**; if it would be longer, split into Part 1 / Part 2 with a short index repeated in each part.
  4. **Every fact appears once, with a stable ID** (E001...), and the monthly index and convergence table refer to IDs, so the AI cites rather than recomputes.

## 3. Proposed file layout ("Year Timeline Pack", Markdown)
Order matters: static facts first, then time.

| # | Section | Contents |
|---|---|---|
| 0 | **Header + rules** | Purpose in 2 lines; date range; time zone and UTC offset; zodiac = sidereal, Lahiri, with the ayanamsa value at the start date; house method; dasha year = 365.25; aspect rules used; orbs used; ephemeris accuracy statement; **max 8 rules for the AI** (use only this data; do not recompute positions; cite event IDs; say when data is missing; no certainty claims; no health or death predictions) |
| 1 | **Native card** | Name, birth date/time/place, Lagna, Moon sign + nakshatra + pada, Sun sign |
| 2 | **Natal planets table** | Sign, degree, nakshatra + pada, house (whole-sign, plus Chalit house if different), retrograde, dignity, combustion, war, nakshatra lord, dispositor, speed |
| 3 | **Role map: who controls what** | One block per planet (see 2.5) and one row per house: sign, lord, lord's house, occupants, aspects received, SAV points, Bhava Bala |
| 4 | **Natal aspects, conjunctions, yogas** | From the app's own detectors |
| 5 | **Vimshottari for the period** | Running Maha/Antar/Pratyantar at the start; every change inside the range with exact date and time at each level; the next level change after the range end |
| 6 | **State at the start** | For Saturn, Jupiter, Rahu, Ketu, Mars (and Sun, Venus, Mercury): sign, nakshatra, house from Lagna and from Moon, retrograde or direct, Ashtakavarga points |
| 7 | **Master timeline (chronological)** | Typed events with IDs: INGRESS, NAKSHATRA-CHANGE, STATION (retro/direct, with degree), ECLIPSE and lunation (house, natal contact), TRANSIT-HIT (a slow planet conjunct or aspecting a natal planet, the Lagna, or a house lord, with orb and stage: approach / exact / separation), DASHA-CHANGE, SADE-SATI-PHASE, DOUBLE-TRANSIT window |
| 8 | **Active periods** | A text Gantt: dasha periods, retrograde periods, Saturn and Jupiter sign stays, nodal axis, Sade Sati, eclipse seasons, each with start and end |
| 9 | **Monthly index** | For each month, the event IDs that fall in it |
| 10 | **Convergence table** | For each of the 12 houses, per month or quarter: which slow transits touch it, which running dasha lords are linked to it. Counts and facts only, no verdict. Reuse the logic behind the 3D Sky triggers |
| 11 | **Ask block (editable)** | A short suggested request the user can change: "Give the main themes of the period, then month by month, cite event IDs, mark which statements rest on several factors" |

Options on the screen: range (default 12 months, warn above 24), a **Moon layer** (off by default: the Moon changes sign every 2 days and nakshatra almost daily, which would swamp the file; instead the default includes lunations and eclipses), outer planets on or off, compact vs full.

## 4. What the app already has (reuse, do not rewrite)
| Need | Existing code |
|---|---|
| Natal chart, dignity, combustion, war | `computeChart`, `getDignity`, `getCombustion`, `findPlanetaryWars` (`birth-chart/js/15-, 07-, 08-`) |
| Nakshatra and pada | `getNakshatra` (`birth-chart/js/05-`), `VNK` (`89-`) |
| Vimshottari at every level | `calculateVimshottariDasha`, `calculateAntardashas`, `findActiveDasha` (`birth-chart/js/10-`) |
| Slow-planet sign stays, Sade Sati, Dhaiya | `trStays`, `trCycles`, `computeTransits` (`birth-chart/js/46-transit-stays-engine.js`) |
| Ingresses, stations, retrograde planner (3D Sky copy) | `findIngresses`, `stayEdges` (`sky3d/js/06-`), `stations` (`sky3d/js/44-`) |
| Double-transit logic (house by house, tunable weights) | `DTrig`, `houseTransit` (`sky3d/js/46-dasha-transit-engine.js`) |
| Ashtakavarga (BAV, SAV) | `computeFullAshtakavarga` (`birth-chart/js/11-`) |
| Strength | `computeShadbala` (`14-`), `computeBhavaBala` (`72-`) |
| Lordship and functional nature, karakas | `lordOf` (`78-`), `functionalNature` (`87-`), AREAS table, `calculateCharaKarakas` |
| Eclipses | `dfEclipses` (`birth-chart/js/28-date-finder-engine.js`) |
| Copy / export plumbing | `buildFullReportText` (`43-`), `openExportModal` (`44-`), `shared/export-addon.js` |
| Ephemeris | `birth-chart/js/03-ephemeris-engine.js` (**elements valid about 1800 to 2050**, so refuse or warn outside that range) |

Overlap with `docs/FULL_READING_PLAN.md`: its S9 (transits and Sade Sati) wants the same ingress calendar and double-transit windows. Build the scanner once, so both use it.

## 5. What has to be built
1. **Range scanner** on the Birth Chart ephemeris (one engine, so no cross-frame dependency): ingresses, nakshatra changes, stations for the 9 grahas, plus outer planets if enabled.
2. **Transit-to-natal contacts** with stated orbs and stages (approach, exact, separation), including Lagna and house lords.
3. **Lunations and eclipses** with the house they fall in and natal contacts.
4. **Role map builder** from existing lordship, functional nature, karakas, strength.
5. **Dasha changes in a range** (all levels) with the next change after the range.
6. **Convergence table** (reuse the DTrig logic by house, not by life theme).
7. **Markdown formatter** with IDs, a token estimate and an automatic Part 1 / Part 2 split.
8. **UI** in Birth Chart: date range, options, Copy for AI, Download .md.
9. **Tests**: events sorted and unique; counts match independent scans; dasha dates equal the engine; a snapshot on the demo chart; size budget; every ID referenced exists.

## 6. Accuracy: the one thing to check before trusting dates
The file will print an accuracy line, so it must be a **measured** one. Compare ingress and station times for Saturn, Jupiter, Mars, Venus, Mercury and the Sun against a trusted ephemeris (JPL Horizons or Swiss Ephemeris) over 2020 to 2035, and print the worst error (for example "ingress times within X minutes"). Sun and slow planets are usually easy; Mercury and Venus stations are the hard ones.

## 7. Decisions I need from the owner (defaults in bold)
1. Default range: **12 months** from today, change freely. Max **36**.
2. Moon layer: **off by default**, optional switch.
3. House method for "house from Lagna": **whole-sign**, with the Chalit house shown too for natal planets (confirm the app's current default).
4. Tajika / Varshaphal section: **not in v1.**
5. Verdict words (good/bad) in the file: **none.** Facts only, the AI judges.
6. Where it lives: **a new tool under Time and Cycles in Birth Chart**, with its own Home card.

## 8. Build order (small steps, one "Continue" each)
- **S1** Range scanner + tests (ingress, nakshatra, stations, dasha changes).
- **S2** Transit contacts, lunations, eclipses + tests.
- **S3** Role map + natal sections.
- **S4** Convergence table.
- **S5** Formatter, IDs, token budget, split.
- **S6** UI + Copy / Download.
- **S7** Accuracy check against a trusted ephemeris, then a real run with an AI to see whether two runs agree on the facts.

## 9. Sources and how much to trust them
| Source | Used for | Trust |
|---|---|---|
| [Paramarsh: dasha-transit techniques](https://paramarsh.app/patrika/dashas-transits/dasha-transit-predictive-techniques) | Workflow, slow vs fast planets, stages, annual scan | Practitioner article; says the "double trigger" is a practical framework, not a classical rule |
| [DekhoPanchang: Gochar](https://dekhopanchang.com/en/learn/gochar) | House formula, time in sign, Jupiter/Moon house lists, double transit, Sade Sati | Educational site; incomplete for other planets |
| [DekhoPanchang: Ashtakavarga](https://dekhopanchang.com/en/learn/ashtakavarga) | Bindu cut-offs, SAV, Kakshya | Educational site; notes method differences |
| [DekhoPanchang: dasha year length](https://dekhopanchang.com/en/learn/dasha-year-length) | Year conventions | Good; one worked date example has a one-day slip |
| [Astromitra: functional planets](https://www.astromitra.com/Functional_Malefic_Benefic_Planets.php) | Lordship-based function | Summary of Parashari rules; silent on maraka, yogakaraka, nodes |
| [VedAstro: annual horoscopes](https://vedastro.org/blog/Hindu-Predictive-Astrology-Chapter-33-Annual-Horoscopes.html) | Varshaphal outline | Modern guide to a classic text |
| [RoxyAPI: chatbots and birth charts](https://roxyapi.com/blogs/ai-chatbot-hallucinates-birth-charts-grounding) | Why precomputed data is needed | Vendor blog; indicative only |
| [arXiv 2607.19257](https://arxiv.org/pdf/2607.19257) | Format, rule count, context length | Preprint, not peer reviewed |
| [Tian Pan: context formats](https://tianpan.co/blog/2026-05-07-context-format-decision-agent-reasoning-json-markdown-plain-text) | Markdown vs JSON guidance | Practitioner article |

**Still not researched or verified:** Good/bad house lists for Sun, Mars, Mercury, Venus, Saturn from the Moon; vedha pairs; maraka and yogakaraka rules; Rahu/Ketu functional nature. If we ever want verdict labels, find them in Brihat Parashara Hora Shastra or Phaladeepika first. v1 does not need them.

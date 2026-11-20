# Birth Time Rectification — complete guide to every tool in the app

*Written 2026-11-20 from the real code (every file named below was read). Scope: only birth-time / birth-date rectification. Line counts are the files as they are today.*

---

## 1. The short answer

| Question | Answer |
|---|---|
| How many rectification tools are inside the app? | **9 tools**, all inside one screen called the **Rectification Studio** (bottom bar: **Rectify** tab). |
| How many appear as their own tile on Home / Tools tab ("Fix Birth Time" group)? | **6** (Rectification Studio, Date Finder, Sandhi Table, Varga Timeline, Transit Timer, Life-Event Checker). **Dasha Lens, Dasha Reverse and Time Dial** live only inside the Studio. |
| How many different ways can I rectify? | **9 methods** (one per tool), arranged in **3 stages**, and you can start from **4 entry paths** depending on how sure you are of the time. Each method answers a different question, so they are meant to be combined. |
| Helpers around the 9 tools | A **Time-Sky panel** (dasha chain + rising-sign boundaries for the time under test), a **"Show in 3D wheel" bridge** to the 3D Sky app, an **"Apply this time"** button that rewrites the saved profile. |
| Where do the 9 tools sit in the app? | Birth Chart app → bottom bar **Rectify** (also Home → *Fix Birth Time*). |

The nine tools, in the order the Studio shows them:

| # | Tab (icon) | Stage | One-line job |
|---|---|---|---|
| 1 | 🔎 **Date Finder** | 1 · Set date & time | Find a forgotten birth **date** from clues (festival, tithi, weekday, nakshatra…). |
| 2 | 🕰️ **Time Dial** | 1 · Set date & time | Dial an exact moment; see rising sign, Moon star, and the **whole chart** for it. |
| 3 | 🎯 **Second Scan** | 2 · Narrow it down | List every second/step in a window with Ascendant, Asc D60 amsa, Moon, nakshatra. |
| 4 | ⏱️ **Sandhi Table** | 2 · Narrow it down | When the rising sign changes in every divisional chart (D1…D144), with live countdown. |
| 5 | 🗺️ **Varga Timeline** | 2 · Narrow it down | Slices of the birth Ascendant window for any divisional chart, birth slice marked. |
| 6 | ⏳ **Transit Timer** | 2 · Narrow it down | When any planet or the Ascendant enters / leaves a division in any D-chart. |
| 7 | 🔱 **Dasha Lens** | 3 · Confirm with life | The full Vimshottari stack (Maha → Deha) at any instant + birth-time error calculator. |
| 8 | 🔁 **Dasha Reverse** | 3 · Confirm with life | Know the dasha periods at a moment → get the **birth-time windows** that produce them. |
| 9 | 🌟 **Life Events** | 3 · Confirm with life | Add dated life events (278 types) → ranks rising signs and time windows, with a confidence score. |

---

## 2. How the Studio works (the frame around the nine tools)

File: `js/26-rectification-studio.js` (249 lines) + `css/31-rectification-studio.css` (182 lines).

**Step rail.** Three steps along the top: **1 Set date & time → 2 Narrow it down → 3 Confirm with life**. The tab strip scrolls so the active tab stays in view. Each pane has **← Back / Next →** buttons; the last one offers **↺ Start over**.

**"How sure are you of the birth time?" — four entry paths** (`rsChip`):

| Chip | What the app does |
|---|---|
| 🎯 **To the minute** (I trust it closely) | Opens **Time Dial**; sets scan window ±2 min, 1-second steps. Advice: check the full chart, then scan ±2 min. |
| 🕐 **Within ~30 min** | Opens **Second Scan**; sets window ±30 min, 10-second steps. Advice: press Run and look for the Ascendant sign changes. |
| 🌓 **Within a few hours** | Opens **Sandhi Table**. Advice: it shows when the rising sign changes so you can cut the hours down. |
| ❔ **Not sure at all** | Opens **Life Events**. Advice: add 3+ real events and the app ranks likely rising signs. |

**One working time everywhere.** The Date field (`rectDate`) and the time dial (`rectHms`, hours/minutes/seconds) are shared. A "use ➜" button in Life Events or Dasha Reverse writes a time back to the dial. The top pill always shows the dialled time, the rising sign with degree, and the Moon's nakshatra + pada.

**Nothing is saved until you press Apply.** Previews (Full Chart on the dial) are temporary; only "✓ Apply This Second & Recalculate Full Chart" in Second Scan rewrites the saved profile's time.

**Old links still work.** `switchAppTab('panel-sandhi' | 'panel-vargatimeline' | 'panel-transittimer' | 'panel-lifeevents' | 'panel-datefinder')` is wrapped so any old tile or link opens the Studio on the right tab.

**Core engine** — `js/16-rectification-engine.js` (35 lines): `rectifyPoint(date, time, lat, lon, tz)` computes only what changes second to second — **Lahiri-sidereal Ascendant and Moon** — plus nakshatra/pada and the **D60 (Shashtiamsha) sign and amsa number (1–60, 0.5° each)** for both. It skips the full chart so thousands of candidate moments scan fast. `shiftLocalDateTime()` moves a local date/time by ± seconds across midnight correctly. Nearly every tool below calls these two functions.

---

## 3. The nine tools in detail

### 3.1 🔎 Date Finder — find the birth DATE (stage 1)
Files: `js/27-date-finder-core.js` (49), `js/28-date-finder-engine.js` (185), `js/29-date-finder-ui.js` (190), `css/32-date-finder.css`, test `tests/datefinder_test.py`.

**Use it when** only a clue is remembered ("born on Diwali", "a Tuesday in the waning Moon", "during an eclipse").

**What it searches.** Every day in the year range you give (From year → To year). For each day it computes, **at local sunrise** for the place (Vedic day = sunrise to next sunrise): tithi, nakshatra, Moon sign, Sun sign, lunar month (Amanta names; optional North-India names), Adhika months, Samvatsara (60-year name), eclipses (Moon-latitude limits 1.55° solar / 1.0° lunar), slow-planet signs.

**Clues you can combine** (any subset; more clues → fewer dates):
- Paksha (Shukla/Krishna), **Tithi** (1–15, Purnima, Amavasya), **Weekday**
- **Festival** from a list of **34** (Ugadi, Diwali, Holi, Navaratri, Makar Sankranti, Onam, …) with a tolerance of 0, 1, 2, 3, 7 or 15 days
- Eclipse (solar / lunar / either)
- Nakshatra, Moon sign, Hindu lunar month, Sun-sign month (Tamil/Malayalam), Samvatsara name, English month, date number (1–31)
- **Saturn / Jupiter / Rahu** sign at the time

**Output.** A list of matching dates (first 40 shown, more on request) with tap-to-open detail (tithi, nakshatra, sunrise etc.). **Use this date** writes it into the dial. Place defaults: the place chosen on the form → the open profile → central India (flagged as a default).

**Limit.** It narrows the date; it does not touch the time. Tithi/nakshatra match if active at sunrise **or** during that day.

---

### 3.2 🕰️ Time Dial — test one exact moment (stage 1)
Files: `js/20-rectification-scan-tab.js` (301; dial steppers `wireHmsSteppers`, `runFullChartCalculation`), `js/26` (clock SVG), `js/127-time-sky-panel.js` (82), `css/62-time-sky-panel.css`.

**What you get.** An animated clock (three hands for h/m/s, zodiac ring) and steppers for hour, minute, second (hold to repeat). Live pill: time · rising sign + degree · Moon nakshatra + pada.

**Buttons.**
- **Calculate Full Chart** → recomputes *every* tab (Overview, Dasha, Yogas, Ashtakavarga, Shadbala, Planets, Divisions, Lagnas) for the dialled time through the normal pipeline — as a **temporary preview**; your saved profile is not changed.
- **🌌 Show this time in the 3D wheel** → sends the moment and place to the 3D Sky (see §5).

**Time-Sky panel** ("what is happening at this time"): the **full Vimshottari chain (Maha → Deha, start and end of each level)** at three moments — the time under test, an optional day + time, and today — and the **rising-sign boundaries in a 2-hour window** around the tested time ("x to y: Leo rising, Navamsha Cancer rising"; D1 changes are marked). Test: `tests/time_sky_test.js`.

---

### 3.3 🎯 Second Scan — second-by-second scan (stage 2)
File: `js/20-rectification-scan-tab.js`, `js/16`.

**Inputs.** Date, centre time, **window** ±1 / 2 / 5 / 10 / 20 / 30 minutes, **step** 1 / 2 / 5 / 10 / 30 seconds. Hard limit **6,000 candidate moments** (the screen asks you to widen the step otherwise).

**Run.** Computes `rectifyPoint` for every moment in chunks of 150 (progress bar; a newer run cancels an older one, so the screen never freezes). Result is a **virtualised table** (row height 40 px) with: local time, Ascendant sign + deg-min-sec, Ascendant nakshatra-pada, **Asc D60 amsa**, Moon sign/degree, **Moon D60 amsa**.

**How to read it.** Watch where the **Ascendant sign changes** (that is the sandhi), where the **Ascendant nakshatra-pada changes**, and where the **D60 amsa changes** (every 0.5° of the Ascendant ≈ 2 minutes of time, so D60 is the finest time test). Tap a row → candidate detail (Julian Day, all of the above) with:
- **✓ Apply This Second & Recalculate Full Chart** — saves the new time into the profile and rebuilds the chart,
- 📋 Copy time, 🌌 Show in the 3D wheel.

---

### 3.4 ⏱️ Sandhi Table — rising-sign change times, all divisional charts (stage 2)
Files: `js/22-sandhi-table-tab.js` (68), `js/04-transit-timing-engine.js` (246).

**Button:** *Calculate Sandhi Table Now.* For **23 divisional charts (D1, D2, D3, D4, D5, D6, D7, D8, D9, D10, D11, D12, D16, D20, D24, D27, D30, D40, D45, D60, D81, D108, D144)** it finds the **exact boundary crossings of the Ascendant** using the real longitude function (adaptive scan + bisection, so speed changes are respected).

**Columns:** Varga · Window width · Before started · Current started · Next starts · **Remaining (live countdown, 1-second tick, paused while hidden)**.

**Important — reads "now".** The table is anchored to the **current clock time at the chart's place**, not to the birth moment. It is excellent for seeing *how wide* each divisional window is (D9 ≈ 13 min, D60 ≈ 2 min at a given latitude) and how much the birth time may drift before a chart changes sign. To see the windows **around the birth moment**, use Varga Timeline (3.5).

---

### 3.5 🗺️ Varga Timeline — windows around the birth moment (stage 2)
Files: `js/23-varga-timeline-tab.js` (78), `js/04` (`computeAscendantD1Window`, `computeVargaTimelineForD1Window`).

**Pick any divisional chart** (D9 pre-selected, ordered by division count). **Map Out Timeline** then:
1. Finds the exact start and end time of the **D1 rising sign that contains the birth moment**.
2. Splits that window into the n slices of the chosen varga (D9 → 9 slices, D60 → 60 …), each with exact start, end, resulting varga sign; each slice ≈ window/n wide.
3. Highlights the slice containing the recorded birth time: **← birth moment**.

**Use.** If the family says "she was a Cancer-Navamsha child", the slice(s) of the right sign show the time range allowed; combining D9, D10, D60 slices narrows the minute.

---

### 3.6 ⏳ Transit Timer — when a body changes division (stage 2)
Files: `js/21-transit-timer-tab.js` (100), `js/04-transit-timing-engine.js`.

**Pick a body** (a planet or the Ascendant) **and a divisional chart. Check Transit Timing** gives: when it entered the current division, when it leaves, remaining time (live countdown), and the sign before/after. Retrograde loops and speed changes are handled by the same bisection solver as the Sandhi Table.

**Use.** A quick "how close is the next change" check for any D-chart; like Sandhi it works from the **current time** (the Feature Guide says "handy for judging how near an ascendant change is").

---

### 3.7 🔱 Dasha Lens — the full dasha stack at any instant (stage 3)
Files: `js/99-dasha-lens.js` (323), `css/44-dasha-lens.css`, test `tests/dasha_lens_test.js` (53).

**Shows, for any date + hour + minute + second:** Mahadasha > Antardasha > Pratyantardasha > Sookshma > Prana > Deha — each with exact start, end, length, time left, and where that planet sits in the chart. Presets: 🍼 Birth, ⏱ Now, 🕰️ Dial time, 🌓 Midnight; nudge buttons ±1 year / month / day; hour/minute/second **pods** with hold-to-repeat and step sizes; source switch: *Recorded birth time* or *Time Dial time*. A sibling timeline lists the 9 periods of any level.

**Saved moments.** Add life moments (single or paste many lines) per profile (browser storage) and see their dasha chain side by side.

**ⓘ Mismatch calculator.** `dlShiftCore` re-runs the real chart maths with the birth time moved by an error you type (± hours/minutes/seconds) and shows how far **every dasha boundary** shifts. `dlMargin` tells how long the birth time can move **before the Moon crosses into another nakshatra** (when every dasha changes). Rule of thumb printed in the tool: deep levels (Sookshma, Prana, Deha) are only trustworthy if the birth time is exact to the second.

**Why it matters.** The Vimshottari balance depends on the Moon's exact degree, so a time error of one second slides the whole timeline by about **2 hours** (see 3.8). The Lens makes that visible so you test events against the right level.

**Button:** 🌌 Show this moment in the 3D wheel; 📋 Copy.

---

### 3.8 🔁 Dasha Reverse — dasha at a known moment → birth-time windows (stage 3)
Files: `js/126-dasha-reverse-finder.js` (178), `css/61-dasha-reverse.css`, test `tests/dasha_reverse_test.js` (23).

**You know** the birth **date and place** but not the time, and you know **which dasha periods were running at some moment** (e.g. "marriage on 12 May 2009, in Venus Maha / Mercury Antar").

**Inputs.** 1 Birth date and a search range within the day. 2 The moment you know (date + time). 3 Dasha planets — **Mahadasha required**; Antar, Pratyantar, Sookshma, Prana, Deha optional (fill only what you are sure of; "Clear levels 2–6").

**Engine** (`drevSearch`). Builds a Moon table for the day (exact 30-second values, interpolated, error < 0.001″), then tries every moment of the day: for each candidate birth time it computes the dasha chain at your moment and keeps the times where the chain equals the chosen planets. Step size adapts to how many levels you fixed (min 0.25 s, max 60 s); every flip is refined by bisection to 0.01 s. It uses the app's own `calculateVimshottariDasha`, so it agrees exactly with the chart and the Dasha Lens.

**Output.** Birth-time **windows** (start – end, middle, Moon position), each with a use → button to set the dial. **Why it works:** about **2 hours of dasha for every second of birth time**, so one remembered Maha+Antar+Pratyantar often reduces the whole day to a window of a few minutes.

---

### 3.9 🌟 Life Events (Life-Event Checker Pro) — confirm with real events (stage 3)
Files: `js/97-life-event-catalog.js` (450), `js/98-life-event-engine.js` (420), `js/30-life-event-checker.js` (159; keeps the old simple checker as a base and the Studio hooks), `css/42-life-event-pro.css`, test `tests/life_event_pro_test.js` (37).

**You enter.** Dated life events chosen from a **catalog of 278 events** (e.g. marriage, child, job start, promotion, move abroad, property, loss of a parent, surgery…). Each event has: primary houses, secondary houses, natural significator planets, **sharpness** (3 = datable to the day: 172 events, 2 = to a few weeks: 81, 1 = a phase: 25) and a **date precision** you set (🎯 exact day weight 1.0 · 📅 within a month 0.75 · 🌫️ only the year 0.45). **7 ways to browse** the catalog: Life area (house), Theme (12 themes), Planet, Sign, Who (me / partner / children / parents / siblings / wider family / friends & clients), Life stage, Date accuracy. Events are saved per profile in the browser.

**You choose the search window** around your working time: **Whole day (all 12 signs), ±6 h, ±3 h (default), ±90 min.** 360 candidate birth moments are sampled across it.

**What the engine does for every candidate moment** (all re-computed, not copied from the recorded chart):
1. Computes Ascendant + Moon; re-builds the **Vimshottari lords at each event date** (Maha/Antar/Pratyantar) because the Moon moves with time, so the whole dasha timeline shifts.
2. Finds the houses each dasha lord is **linked to** from that Ascendant: *sits in* + *rules* + *aspects* (Mars 4/7/8, Jupiter 5/7/9, Saturn 3/7/10; nodes act through their sign lord).
3. Adds **transits** at the event date: Jupiter and Saturn (weight 1 each), Mars, Rahu, Ketu (0.5 each).
4. Scores each event: **50 % dasha cover + 25 % transit cover + 10 % significator planets + 15 % double transit (Jupiter and Saturn both on the event houses)**, times event sharpness × date precision.
5. Adds the events' scores into one curve over the window; the **peak per rising sign** gives the ranking, and the time range near the peak gives the **time window** for that sign.

**Output.**
- Ranking of rising signs with a bar per sign, the best time window(s) per sign and **use ➜** to load a window into the dial.
- **Why this score?** — plain-words reasons per event (e.g. "Mahadasha Venus → H7 ★; Jupiter transit reaches H7").
- **Minimum confidence gauge** = the **weakest of three honesty tests × an evidence factor**:
  1. 🍀 **Not just luck** — the same dates are tested with *random event types* (≈300 tries); if random events fit as well in ≥25 % of tries you get 0 %; under 5 % gives 80 %.
  2. 🔀 **Stays the same when events are reshuffled** (400 bootstrap resamples).
  3. ✂️ **Survives dropping one** — same sign when each single event is left out.
  Evidence factor = how many *independent life areas* you gave (repeats of the same theme count only partly) — so ten marriage dates do not make a strong case; marriage + job + child + a move do.
- **Close call** warning when the top two signs are within ~7 %; list of **outlier events** that fit the answer poorly.
- Same input always gives the same confidence (seeded).

**Honest meaning.** The result is a ranking and a consistency score, **not a proof**. The tool itself asks for 3+ events from different areas and says to confirm with the other tools.

---

## 4. How the tools fit together — recommended workflows

**A. "I trust the time to the minute."**
Time Dial → Calculate Full Chart → Second Scan (±2 min, 1 s) → look for sign / nakshatra-pada / D60 changes → Dasha Lens (check the Mismatch calculator).

**B. "Within about 30 minutes."**
Second Scan (±30 min, 10 s) → Varga Timeline (D9, D10, D60 slices around birth) → Life Events (±90 min) → narrow in Second Scan → Apply.

**C. "A few hours, or unknown."**
Sandhi Table (how wide each window is) → Life Events (whole day, 12 signs) → pick the best-ranked sign and window → Dasha Reverse (if you know a dasha at a moment) → Second Scan inside the window → Dasha Lens.

**D. "I only half-remember the date."**
Date Finder first (festival/tithi/weekday/eclipse/slow-planet signs) → pick the date → follow A, B or C.

**E. Fine confirmation with deep dashas.**
Dasha Reverse with Maha + Antar + Pratyantar (+ Sookshma if the event day is known) → it returns windows of a few minutes → Dasha Lens on 2–3 other life moments to see that the same window holds.

**F. Visual check.**
From the Time Dial, Dasha Lens, or a scan result tap **🌌 Show in the 3D wheel**: the 3D Sky opens at that exact moment at the birth place on the Zodiac Wheel, paused, with the Rising sign shown.

---

## 5. Connections outside the Studio

| Connection | What it does | Files |
|---|---|---|
| **3D Sky jump** | `vxJump3D({date,time,tz,lat,lon,place,label})` writes a local-storage message (`vax_jump_3d`); the 3D app switches to the Zodiac Wheel, jumps to the exact moment, pauses play, shows the Rising sign for the birth place (session only) and a toast. Buttons: Time Dial, Second Scan detail, Dasha Lens. | `js/99-jump-3d-bridge.js` (36), `apps/sky3d/js/51-jump-from-rectification.js` (33) |
| **3D Sky rising-sign tools** | Long-press popup and Rising tab show rising-sign timings, Navamsha now, and every Navamsha of a sign with times to the second — a second source for sandhi times. | `apps/sky3d/js/18-rising-sign-timeline.js` |
| **3D Sky Timeline finder** | Works backwards from the sky to dates (age range or birth years + conditions such as planets in a sign / conjunction / retrograde). Useful as another way to find a birth **date**. | `apps/sky3d/js/63-timeline-finder.js` |
| **Open any divisional chart in 3D** | Draws D9, D10, D60 … as a sky at the birth moment. | Birth Chart → Divisional Charts → Open in 3D |
| **Profiles** | "Apply This Second" rewrites the stored profile (`dob`, `tob`) and rebuilds every tab. Life-event lists are stored per profile (`vax_rs_events:name|dob|tob`) and Dasha-Lens moments per profile. | `js/20`, `js/26`, `js/99-dasha-lens.js` |
| **Export** | The Sandhi, Varga Timeline and Transit Timer panels keep their ids so the Export tab can still find them. | `js/148-export-builder.js` |
| **Feature Guide** | Entries for Rectification Studio, Date Finder, Sandhi, Varga Timeline, Transit Timer, Life-Event Checker. | `js/149-feature-guide-data.js` |

---

## 6. Accuracy notes (what each method can and cannot do)

- **Maths base.** The app's own Meeus-style ephemeris and **Lahiri ayanamsa**; Vimshottari uses 365.25-day years. A rising sign needs correct place (latitude/longitude) and time zone — a wrong zone looks exactly like a wrong birth time. Check the place first.
- **Ephemeris range.** About 1801–2049 for the full engine.
- **Window sizes.** A rising sign lasts about 1½–3 hours at Indian latitudes; D9 slice ≈ 13–20 min; D60 slice ≈ 2–3 min (0.5° of the Ascendant). Sub-minute work should be seen as *tests of consistency*, not proof.
- **Dasha sensitivity.** One second of birth time moves the whole Vimshottari timeline by roughly **2 hours**; one minute by about 5 days. That is why Dasha Reverse can be sharp, and why Sookshma/Prana/Deha are used only when the birth time is already very close.
- **Sandhi Table and Transit Timer are "now-based".** They answer *when does the current rising sign (or body) change division*, from the present moment; they do not look at the recorded birth moment. For birth-anchored windows use **Varga Timeline** or **Second Scan**. (Improvement idea listed in §8.)
- **Life Events** is a ranking with an honesty score; it uses Vimshottari + Jupiter/Saturn (+ Mars, Rahu, Ketu) transits and house linkage. It does not use other dasha systems, progressions, Tara-bala or varga-specific event rules.
- **Wording rule in the app:** tendencies only; no fate or fear words.

---

## 7. File map (everything that belongs to rectification)

| File | Lines | Role |
|---|---:|---|
| `apps/birth-chart/js/16-rectification-engine.js` | 35 | `rectifyPoint`, `shiftLocalDateTime`: per-second Ascendant/Moon/nakshatra/D60 |
| `apps/birth-chart/js/04-transit-timing-engine.js` | 246 | boundary-crossing solver; D1 window; Varga slices; used by Sandhi/Varga/Transit |
| `apps/birth-chart/js/20-rectification-scan-tab.js` | 301 | Second Scan, Time Dial steppers, full-chart preview, Apply |
| `apps/birth-chart/js/21-transit-timer-tab.js` | 100 | Transit Timer tab |
| `apps/birth-chart/js/22-sandhi-table-tab.js` | 68 | Sandhi Table tab |
| `apps/birth-chart/js/23-varga-timeline-tab.js` | 78 | Varga Timeline tab |
| `apps/birth-chart/js/26-rectification-studio.js` | 249 | the Studio frame: tabs, steps, chips, router, clock |
| `apps/birth-chart/js/27-date-finder-core.js` | 49 | Date Finder tables (festivals, Samvatsara names, limits) |
| `apps/birth-chart/js/28-date-finder-engine.js` | 185 | Date Finder engine (`dfGen`) |
| `apps/birth-chart/js/29-date-finder-ui.js` | 190 | Date Finder screen |
| `apps/birth-chart/js/30-life-event-checker.js` | 159 | original checker + Studio hooks |
| `apps/birth-chart/js/97-life-event-catalog.js` | 450 | 278-event catalog, houses, themes, stages, accuracy |
| `apps/birth-chart/js/98-life-event-engine.js` | 420 | Life-Event Checker Pro engine, tests, UI |
| `apps/birth-chart/js/99-dasha-lens.js` | 323 | Dasha Lens + mismatch calculator + saved moments |
| `apps/birth-chart/js/99-jump-3d-bridge.js` | 36 | send a moment to 3D Sky |
| `apps/birth-chart/js/126-dasha-reverse-finder.js` | 178 | Dasha Reverse |
| `apps/birth-chart/js/127-time-sky-panel.js` | 82 | dasha chain + rising boundaries for the tested time |
| `apps/birth-chart/css/31-rectification-studio.css` | 182 | Studio styles (`rs-`) |
| `apps/birth-chart/css/32-date-finder.css` | 59 | Date Finder styles (`df-`) |
| `apps/birth-chart/css/42-life-event-pro.css` | 192 | Life-Event Pro styles (`le-`) |
| `apps/birth-chart/css/44-dasha-lens.css` | 123 | Dasha Lens styles (`dl-`) |
| `apps/birth-chart/css/61-dasha-reverse.css` | 39 | Dasha Reverse styles (`drev-`) |
| `apps/birth-chart/css/62-time-sky-panel.css` | 19 | Time-Sky panel styles (`tsky-`) |
| `apps/sky3d/js/51-jump-from-rectification.js` | 33 | 3D side of the jump |
| `tests/datefinder_test.py` | 68 | Date Finder test |
| `tests/dasha_lens_test.js` | 53 | Dasha Lens maths |
| `tests/dasha_reverse_test.js` | 23 | Dasha Reverse |
| `tests/life_event_pro_test.js` | 37 | Life-Event engine |
| `tests/time_sky_test.js` | 15 | Time-Sky panel |

**Total hand-written rectification code:** about **3,530 lines** across the files with a counted size above (plus the CSS files without a count and the Date Finder test).

---

## 8. Gaps and ideas (for the owner; nothing here is built)

1. **Birth-anchored Sandhi Table.** Add a switch "at the birth moment" so the table shows windows around the recorded time instead of "now".
2. **A "Rectification Report" button.** Gather the results from all nine tools (windows from Dasha Reverse, ranking from Life Events, slices from Varga Timeline) into one agreement table and one exportable summary for a client.
3. **Combine Life Events + Dasha Reverse.** Let the best Life-Events window pre-fill the Dasha Reverse search range.
4. **More confirmation methods not in the app today:** Tattwa/Pranapada and Gulika-based checks, Kunda/Nisheka, Praveshaka (Tithi Pravesh) based event timing, and Tara-bala/Ashtakavarga of the event dates.
5. **Marketplace angle.** The Studio is the strongest differentiator for a paid astrologer tool (nobody else has Dasha Reverse with seconds-level windows plus an honesty score). A one-page sample "rectified time report" would be the first sellable output.

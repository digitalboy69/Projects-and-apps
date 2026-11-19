# Vedic Astro Suite — ALL FEATURES (one-file guide to everything inside the app)

> Generated 2026-11-20 by `python3 tools/gen_all_features.py` — do not hand-edit; re-run it after adding a tool or file. Totals below are counted from the real files (lines = newline count, size = bytes on disk).

**Owner:** Madhu Yadav · **Repo:** `digitalboy69/Projects-and-apps`, folder `vedic-astro-suite/` · **Stack:** plain HTML + CSS + JavaScript (no framework), dark-and-gold, phone-first · **Host:** Vercel from `main`

## Contents

- 1. What the app is (in one minute)
- 2. Numbers at a glance
- 3. How the suite is built (architecture, build, deploy)
- 4. The six bottom-bar tabs
- 5. Every tool in the Birth Chart app (60 tools, grouped as in the Tools tab)
- 6. The 3D Sky app: every feature
- 7. Notepad, Developer card, Shell, Shared layers
- 8. Data the app keeps on the device (storage keys)
- 9. Every file: path, lines, size, purpose
- 10. Tests
- 11. Docs and plans
- 12. Rules every contributor (human or AI) follows
- 13. How to keep this file true

## 1. What the app is (in one minute)

The Vedic Astro Suite is a free-to-run, offline-capable Vedic (Jyotish) astrology toolkit. You enter a birth date, time and place and it builds the chart, then offers dozens of tools to read it (dashas, divisional charts, strengths, yogas, transits, matching, panchang, remedies, an AI astrologer) and a real-time 3D sky. It is four small apps inside one shell:

| App | What it is for |
|---|---|
| **Birth Chart** (`apps/birth-chart/`) | The main app: chart creation, 60 tools, profiles, matching, rectification, export, AI astrologer. |
| **3D Sky** (`apps/sky3d/`) | A live Three.js sky: zodiac wheel, solar system, rising signs, aspects, dasha triggers, Formula Maker, export studio. |
| **Notepad** (`apps/notepad/`) | Notes, templates and client cards for an astrologer. |
| **Developer card** (`apps/developer/`) | Overlay card with the developer contact details. |

Wording rule across the whole app: *tendencies*, never fate or fear words.

## 2. Numbers at a glance

- Project files counted: **576** (excluding generated `dist/`, `.git`, `node_modules`)
- Total lines: **144,114** · Total size: **14.25 MB**
- Tools in the Birth Chart app: **60** (Home tiles / Tools tab / Feature Guide)

### By area

| Area | Files | Lines | Size |
|---|---:|---:|---:|
| `apps/birth-chart` | 255 | 86,915 | 6.74 MB |
| `apps/sky3d` | 108 | 22,471 | 1.67 MB |
| `vendor` | 1 | 12,399 | 306.1 KB |
| `tests` | 113 | 6,613 | 700.7 KB |
| `(root files)` | 11 | 3,877 | 359.7 KB |
| `tools` | 32 | 3,572 | 463.8 KB |
| `docs` | 19 | 3,410 | 356.1 KB |
| `apps/notepad` | 4 | 1,855 | 265.5 KB |
| `shared` | 9 | 1,185 | 107.7 KB |
| `apps/developer` | 5 | 719 | 62.6 KB |
| `shell` | 4 | 588 | 66.7 KB |
| `mobile` | 11 | 254 | 3.19 MB |
| `gate` | 2 | 174 | 15.2 KB |
| `editions` | 2 | 82 | 6.0 KB |

### By file type (hand-written files; the generated `index.bundle.html` copies are left out to avoid double counting)

| Type | Files | Lines | Size |
|---|---:|---:|---:|
| `.js` | 280 | 53,534 | 3.78 MB |
| `.css` | 131 | 8,901 | 869.8 KB |
| `.py` | 114 | 8,845 | 1017.3 KB |
| `.md` | 24 | 4,869 | 556.9 KB |
| `.idx` | 1 | 2,407 | 155.7 KB |
| `.html` | 8 | 1,455 | 98.3 KB |
| `.sh` | 3 | 82 | 7.4 KB |
| `.ts` | 1 | 57 | 3.4 KB |
| `.json` | 3 | 36 | 1.6 KB |
| `.webmanifest` | 1 | 1 | 0.4 KB |
| `.png` | 5 | 0 | 3.17 MB |
| `.ico` | 1 | 0 | 10.7 KB |

## 3. How the suite is built

- **Shell** (`index.html`, `shell/`): the loading screen, floating app switcher, location/map picker and the silent updater. It opens each app inside an iframe.
- **Apps** (`apps/<name>/`): each is `index.html` + `css/NN-topic.css` + `js/NN-topic.js`. Files load in **number order** and are never renumbered. Late panels register through `registerLatePanel(id, fn)` (js/120) so nothing heavy runs at boot.
- **Shared** (`shared/`, `vendor/`): the global feel layer (`meta.css`), icon library (`icons.js`), liquid-glass look, quick menu, copy-button toggle, export add-on, QR libraries.
- **Editions** (`editions/customer`, `gate/`): the locked customer edition and its access gate.
- **Build** (`python3 build.py` → `tools/build.py`): writes `dist/*` single-file builds, `symbols.idx` (symbol → file:line), the AI_GUIDE auto-map, one `index.bundle.html` per app (the shell loads 1 file instead of ~260) and `version.json` (the silent updater reloads once when the build id changes).
- **Hooks**: `.githooks/pre-commit` regenerates the bundles/guide and checks `STRUCTURE.md` lists every file (`tools/check_structure.py`).
- **Deploy**: push to `main` → Vercel publishes. The working branch is `feature/astro-roadmap`; `Root` mirrors main. Never force-push `main` or `Root`.
- **Mobile** (`mobile/`): Capacitor wrapper for Android/iOS.
- **Door site** (`../door-site/`): licensing/door website with admin, functions and tests (own README).
- **Startup speed** (`docs/STARTUP_SPEED_PLAN.md`): nothing heavy at boot, rare features load on first open, no artificial waits.

## 4. The six bottom-bar tabs

| | Tab | What it does |
|---|---|---|
| 🏠 | **Home** | Your starting page: tiles for every tool, a search box and a short "ask" area. |
| 🧰 | **Tools** | Every tool in one list, grouped by what you want to do. Search, pick a group, or reopen something you used recently. |
| 📜 | **My Chart** | Your birth chart and the pages that read it: overview, planets, houses, divisional charts. |
| 🔎 | **Rectify** | Tools for fixing an uncertain birth time or finding a forgotten birth date. |
| 💞 | **Match** | Kundali Matching: compare two charts with the 36-point Ashtakoota system. |
| 📤 | **Export** | Choose exactly what goes into a file or a copied report, then download or copy it. |

## 5. Every tool in the Birth Chart app

Each entry: what it does, when to use it, how, key words and the files behind it. Text comes from the in-app Feature Guide (`js/149`), so this file and the app say the same thing.

### Read my chart — Understand my chart in plain words

#### ✦ AI Astrologer `panel-ai`

*Ask questions about your chart with your own AI model, persona and skills. It reads only the variables it needs* · Home section: Analysis

- **What it does:** An AI assistant that you set up yourself: your own provider, API address, key and model, your own personas and your own uploaded skills. It answers questions about your chart, and for each question it reads only the chart variables it needs from one index, so it is not flooded with data.
- **When to use it:** You want to ask your chart a question in plain words, use a model you choose (cloud or on your own computer), or make the AI follow your own instructions.
- **How:**
  1. Open Settings first. Fastest: paste a cURL command or a code snippet (JavaScript fetch, axios, SDK, or Python requests) into the paste box and every field fills itself; the key, URL, model, headers and extra options are read from it. Or pick a preset (OpenAI, OpenRouter, Groq, Anthropic, Gemini, Ollama, LM Studio) or Custom, then fill the base URL, API key and model name and tap Test connection. Everything, including the key, is stored only on this device.
  2. Open Chat and ask. The app first shows the model a short index of variables, the model chooses the few it needs, the app fetches just those, and then the model answers from them. The chips under each answer show exactly which variables were used.
  3. Open Variables to browse the index, preview any value, search it, or tap the star to include a variable in every question. The raw box can read any field of the chart by its path.
  4. Open Persona to switch the voice (Classical Jyotishi, Friendly guide, Strict analyst) or make your own, with an optional language.
  5. Open Skills and upload a .md, .txt or .json file of instructions. A skill that is switched on is followed exactly, and it can list variables it always needs.
  6. Settings also lets you tune how many variables per question, answer length and creativity, turn smart routing off for small models, and export or import your setup (keys are left out unless you choose otherwise).
- **Key words:** **Variable** — One piece of chart data, such as planet.Mars, house.10, varga.D9 or dasha.current.; **Index** — The single list of every variable the AI is allowed to ask for.; **Routing** — The first small step in which the model picks which variables it needs.; **Persona** — The voice and attitude the AI answers in.; **Skill** — Instructions you upload that the AI follows exactly.
- **Tip:** Your question and the variables it needs go to the provider you chose, from this device. Answers are tendencies drawn from your chart data, not predictions; if something is missing the AI should name the variable it needs instead of guessing.
- **Read with:** Chart Reading (`panel-reading`), Divisional Charts (`panel-vargas`), Dasha (`panel-dasha`)
- **Code (file where the panel is defined or its markup lives):** `js/160-ai-panel.js` (171 lines)

#### 📖 Chart Reading `panel-reading`

*Plain-language reading, life areas & timing* · Home section: Your Chart

- **What it does:** A plain-language reading of your whole chart, written automatically from classical rules (house lords, dignity, aspects, Ashtakavarga and Dasha). It is split into ten short parts.
- **When to use it:** You want the big picture first, in words, before opening any technical page.
- **How:**
  1. Open it after your chart is made.
  2. Pick a part from the row: Right now, Summary, Life areas, Planets, Now, Yogas, Deep reading, Strength, Ashtakavarga or Problem finder.
  3. Read one part at a time; the counter shows how many you have explored.
- **Key words:** **Life areas** — The twelve houses, each read as an area of life such as money, home or work.; **Dignity** — How comfortable a planet is in its sign (own, exalted, friendly, weak).
- **Tip:** Treat it as a starting point for a reading, not a final answer.
- **Read with:** Problem Finder (`panel-problem`), Dasha (`panel-dasha`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### 🧭 Problem Finder `panel-problem`

*Pick a life problem; see the chart reasons* · Home section: Your Chart

- **What it does:** Pick a life problem you are facing and see the chart reasons that tend to sit behind it, with the planets and houses involved.
- **When to use it:** You have a specific worry (delay, work, relationships, health) and want to know where the chart points.
- **How:**
  1. Choose the problem that fits best.
  2. Read the reasons shown from your own chart.
  3. Open the linked tool for more detail.
- **Key words:** **House lord** — The planet that rules the sign of a house; its condition colours that area.
- **Tip:** It shows tendencies in the chart, not a verdict.
- **Read with:** Chart Reading (`panel-reading`), Dosha Check (`panel-dosha`)

#### ◈ Overview `panel-overview`

*Birth chart & key details* · Home section: Your Chart

- **What it does:** Your birth chart drawn as a diagram, with your Lagna (rising sign), Moon sign and Sun sign and the birth details.
- **When to use it:** You want to see the chart itself, or switch between North and South Indian style.
- **How:**
  1. Read the three cards: Lagna, Rashi (Moon sign) and Surya (Sun sign).
  2. Tap North Indian or South Indian to change the drawing style.
  3. Open "Calculation details" to see the settings used.
- **Key words:** **Lagna** — The sign rising in the east at birth; house 1.; **Rashi** — The sign the Moon was in.
- **Tip:** This is the D1 (Rashi) chart; other charts are in Divisional Charts.
- **Read with:** Divisional Charts (`panel-vargas`), Planets (`panel-planets`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### 🪪 Avakahada Chakra `panel-avakahada`

*The standard kundli table: varna, yoni, gana, nadi, paya, name sounds* · Home section: Your Chart

- **What it does:** The standard table at the top of a kundli: varna, vashya, yoni, gana, nadi, paya, name sound and more, all from the Moon and birth moment.
- **When to use it:** You need the classic kundli details, or the name syllables for your birth star.
- **How:**
  1. Scroll the table.
  2. Tap "What is this?" beside any item for a plain explanation.
- **Key words:** **Nakshatra** — The birth star (one of 27) the Moon was in.; **Nadi / Gana / Yoni** — Matching factors used in Kundali Matching.
- **Tip:** These same factors feed the Ashtakoota match.
- **Read with:** Kundali Matching (`panel-match`), Overview (`panel-overview`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### ☉ Planets `panel-planets`

*Positions & aspects of every planet* · Home section: Your Chart

- **What it does:** Where every planet stood at birth: sign, degree, nakshatra and pada, house, dignity, and what it aspects.
- **When to use it:** You want the exact placement and condition of a planet.
- **How:**
  1. Tap any planet to open its full story.
  2. Use the filters: All, Retrograde, Strong, Challenged.
- **Key words:** **Retrograde (℞)** — The planet appears to move backward; read as turned inward.; **Pada** — A quarter of a nakshatra.
- **Tip:** Open the Planet Encyclopedia to learn what each planet means.
- **Read with:** Planet Encyclopedia (`panel-planetency`), Shadbala (`panel-shadbala`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### ⌂ Bhava Chalit `panel-bhava`

*Sripati house cusps & shifted planets* · Home section: Your Chart

- **What it does:** Bhava Chalit: house cusps by the Sripati method. A planet near a sign edge can shift into the neighbouring house.
- **When to use it:** A planet sits close to a house edge and you want to know which house it really acts in.
- **How:**
  1. Read the Lagna and Midheaven cards.
  2. See the "planets changing house" list.
- **Key words:** **Whole-sign house** — Each house is one full sign.; **Sripati** — A way of centring each house on its midpoint.
- **Tip:** If nothing shifts, the whole-sign chart already tells the story.
- **Read with:** Overview (`panel-overview`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### ◫ Divisional Charts `panel-vargas`

*D1 to D144 chart viewer* · Home section: Your Chart

- **What it does:** A viewer for all divisional (varga) charts, D1 to D144. Each chart zooms into one area of life.
- **When to use it:** You want Navamsa (marriage), Dashamsa (career) or any other divisional chart.
- **How:**
  1. Tap a chart tile or use the dropdown.
  2. Choose North or South style.
  3. Switch on aspects if you want them drawn.
  4. Use Copy if the Copy switch is on in Settings.
  5. Open the House details tab under the chart: one card per house with its sign, lord, and for every planet there its nakshatra, pada and nakshatra lord, the houses it aspects and its dignity, plus which planets aspect the house.
- **Key words:** **D9 Navamsa** — The marriage and dharma chart, the most used after D1.; **Varga** — A divisional chart.
- **Tip:** Start with D1 and D9, then add others as needed.
- **Read with:** Vimshopaka Bala (`panel-vimshopaka`), Special Lagnas (`panel-lagnas`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### ✧ Special Lagnas `panel-lagnas`

*23 alternate ascendants* · Home section: Your Chart

- **What it does:** Twenty-three alternate ascendants (special lagnas), each viewable as a full chart.
- **When to use it:** You study Jaimini or deeper methods and want Arudha, Hora, Ghati or Upapada lagna.
- **How:**
  1. Tap a lagna card.
  2. Pick a divisional chart and style.
  3. Copy all lagnas if you need the list.
- **Key words:** **Arudha Lagna (AL)** — The image of you that others see.; **Upapada (UL)** — The lagna read for marriage and partner.
- **Tip:** The Arudha and Upapada are the usual starting points.
- **Read with:** House from the House (`panel-bhavat`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

### Today & now — See what the sky is doing today

#### 🌅 Today for You `panel-today`

*Your day from your own Moon: Chandrabala, Tarabala, planets & good slots* · Home section: Time & Cycles

- **What it does:** Your day read from your own Moon: Chandrabala, Tarabala, planet holds and good time slots.
- **When to use it:** You want a daily planning aid or to look ahead at a chosen date.
- **How:**
  1. Open it; it starts at today.
  2. Change the date or time, or tap Now.
  3. Read the one-line tone first, then the checks below.
- **Key words:** **Chandrabala** — How the Moon of the day sits from your Moon sign.; **Tarabala** — The day star counted from your birth star.
- **Tip:** It counts only the two Moon checks for its tone; it is a planning aid.
- **Read with:** Choghadiya (`panel-choghadiya`), Panchanga (`panel-panchanga`)

#### 🔥 Life Activation `panel-active`

*Houses lit up now · pick any date* · Home section: Time & Cycles

- **What it does:** Life Activation: which of your 12 houses are switched on now, from your running Dasha plus transiting planets.
- **When to use it:** You want to know which life areas are in focus at a date.
- **How:**
  1. Move the date with «1y ‹1m 1m› 1y» or tap Today.
  2. Read the big-picture line, then open each house.
- **Key words:** **Activation** — A house that Dasha and transits both touch.
- **Tip:** Pick a past date to see why a period felt a certain way.
- **Read with:** Dasha (`panel-dasha`), Live Sky (`panel-transit`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### ⟲ Live Sky `panel-transit`

*Today's planets vs your chart* · Home section: Time & Cycles

- **What it does:** Live Sky: today's planets placed against your birth chart.
- **When to use it:** You want to see where the planets are right now relative to your houses.
- **How:**
  1. Check the location and timezone (it need not be your birth place).
  2. Tap "Check Live Transits".
- **Key words:** **Gochara** — Transit.
- **Tip:** Enter where you are now.
- **Read with:** Transits & Sade Sati (`panel-transits`), Life Activation (`panel-active`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### 🕰️ Choghadiya `panel-choghadiya`

*Good and bad time slots for the day and night* · Home section: Time & Cycles

- **What it does:** Good and bad time slots for day and night: Amrit, Shubh, Labh, Chal, Rog, Kaal and Udveg.
- **When to use it:** You want to pick a time for a task today.
- **How:**
  1. Change the date or time if needed.
  2. Read the slots marked Good, So-so or Avoid.
  3. Open "What each name means".
- **Key words:** **Choghadiya** — An eight-part split of day and night.
- **Tip:** Slots shift with sunrise at your place.
- **Read with:** Panchanga (`panel-panchanga`), Today for You (`panel-today`)

#### 🌙 Panchanga `panel-panchanga`

*Tithi, nakshatra, yoga, karana & day timings* · Home section: Time & Cycles

- **What it does:** The five limbs of the day: tithi, vara, nakshatra, yoga and karana, with end times and sunrise.
- **When to use it:** You want the almanac for a day, or for your birth moment.
- **How:**
  1. Set the date and time, or tap At birth or Now.
  2. Read each limb and its end time.
- **Key words:** **Yoga** — A 27-part Sun-Moon measure.; **Karana** — Half a tithi.
- **Tip:** Use the Calendar for a whole month.
- **Read with:** Panchang Calendar (`panel-pcal`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### 🗓️ Panchang Calendar `panel-pcal`

*Month calendar: tithi, nakshatra, Ekadashi, Purnima, Amavasya, festivals and eclipses* · Home section: Time & Cycles

- **What it does:** A month calendar with tithi, nakshatra, Ekadashi, full and new moons, Sankranti, festivals and eclipses.
- **When to use it:** You want to find a festival, a fasting day or a lunar date.
- **How:**
  1. Use ‹ and › to change month, or tap Today.
  2. Tap a day for details.
  3. Choose Purnimanta or Amanta month names.
- **Key words:** **Purnimanta** — Months that end on the full Moon (North India).; **Sankranti** — The Sun entering a new sign.
- **Tip:** A few Bhadra-based festivals can differ from other almanacs; the page flags them.
- **Read with:** Panchanga (`panel-panchanga`), Date Finder (`panel-datefinder`)
- **Code (file where the panel is defined or its markup lives):** `js/146-panchang-calendar.js` (168 lines)

#### 🔮 Prashna Chart `panel-prashna`

*Cast a chart for the moment you ask a question and read the signs* · Home section: Time & Cycles

- **What it does:** A Prashna (horary) chart cast for the moment you ask a question, with the signs read for your topic.
- **When to use it:** You have a single question right now and no birth data matters.
- **How:**
  1. Pick the topic (marriage, job, money, travel and more).
  2. Use Now or set a date and time.
  3. Check the location, then read the signs.
- **Key words:** **Prashna** — Question chart.
- **Tip:** Ask one clear question at a time.
- **Read with:** Today for You (`panel-today`)

#### 🔱 Chakra Explorer `panel-chakra`

*Sarvatobhadra, Kota and Shoola charts: what today's planets touch in your chart* · Home section: Time & Cycles

- **What it does:** Three classical transit charts (Sarvatobhadra, Kota, Shoola) read against your birth star, tithi and name.
- **When to use it:** You want to see what today's planets touch in your chart, or any other moment.
- **How:**
  1. Pick the chart tab.
  2. Move the date and time with ‹ › and the −/+ steppers, or tap Now.
  3. Read what touches your natal pillars.
- **Key words:** **Vedha** — A piercing; a planet striking a point.; **Paala** — The guardian of a Kota section.
- **Tip:** Use the option rows to turn naam, vara and rays on or off.
- **Read with:** Live Sky (`panel-transit`)
- **Code (file where the panel is defined or its markup lives):** `js/130-chakra-explorer.js` (440 lines)

### Life timing & cycles — Know which period of life is running and what comes next

#### ☉ Hora `panel-hora`

*Planetary hours: the planet of every hour and the best times for any task* · Home section: Time & Cycles

- **What it does:** Hora (planetary hours): the planet that rules every hour of your day, a live countdown to the next one, the full hora of any date and time you type in, for any place, and the best times for what you want to do.
- **When to use it:** You want to pick a good hour for a task, see which planet rules right now, or plan the week.
- **How:**
  1. Tap the place chip at the top to change the place. Search a city, use your current location, go back to your birth place, or type latitude, longitude and time zone. Every tab then uses that place.
  2. Moment: type any date and time (or tap Right now or My birth moment) to see the hora at that moment: planet, where it starts and ends, how far through it you are, what comes before and after, and the full 24 horas of that day.
  3. Now: see the planet ruling this hour, the countdown ring, what it tends to favour, and the next three horas.
  4. Today: all 24 horas (12 day and 12 night) for any date. Tap a row to read it. Pick an activity to see a score on every row.
  5. Week: a colour grid of seven days. Choose an activity and the horas that suit it glow. Tap a square to read it.
  6. Best: choose what you want to do and the next 24 hours, 3 days or 7 days. You get the best horas ranked with reasons, and the times to skip.
  7. Learn: how a hora is made, the planet order, what each planet is for, how the score works, and where teachers differ.
- **Key words:** **Hora** — One of 24 slices of the day, each ruled by a planet.; **Vedic day** — Runs from sunrise to the next sunrise. A time before sunrise still belongs to the day before.; **Chaldean order** — The planet order the horas follow: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon.; **Day lord** — The planet of the weekday. It rules the first hora of the day.; **Rahu Kalam, Yamaganda, Gulika** — Three short periods many people avoid for new starts. Any hora that overlaps one is marked.
- **Tip:** The Vedic day starts at sunrise, so before sunrise you are still in the horas of the day before. Treat the score as a tendency, not a promise.
- **Read with:** Choghadiya (`panel-choghadiya`), Panchanga (`panel-panchanga`), Divisional Charts (`panel-vargas`), Special Lagnas (`panel-lagnas`)
- **Code (file where the panel is defined or its markup lives):** `js/157-hora-panel.js` (293 lines)

#### ⏳ Past · Present · Future `panel-ppf`

*Your life periods: what has run, what runs now, what comes next* · Home section: Time & Cycles

- **What it does:** A + shaped directional chart (houses counted in four groups, with the past, present and future arms), then your whole life on one line and three views: what has already run, what is running now and what comes next, from your Vimshottari dasha periods.
- **When to use it:** You want to know which stage of life you are in, look back at past stages, or see what the next few years tend to be about.
- **How:**
  1. Start with the + shaped directional chart. Pick who you are reading for (Lagna or a planet). The arm where that planet sits is You. The arm ahead (clockwise) is the Future, the arm opposite is the Present and the arm behind is the Past. Read the planets in each arm below the chart.
  2. Read the coloured life line. Each block is one big stage (Mahadasha). Faded blocks are behind you and the needle is today. Tap a block to read it.
  3. Look at the bar chart of ten years back and ten years ahead. Up bars are easier sub-periods, down bars are more testing. Tap a bar to read it.
  4. Use the Past, Present and Future tabs. Present shows three running clocks with progress bars and the houses lit up now. Future lists the next five years and the bigger stages after.
  5. On each card, open "More about this stage" and read the line that starts "Looking back" or "When it arrives" to check it against your life.
- **Key words:** **Directional chart** — The 12 houses in four groups: 1·5·9 Dharma, 2·6·10 Artha, 3·7·11 Kama, 4·8·12 Moksha, drawn as a +. The groups are standard; the past, present and future rule is a teaching method, not a verified classical rule.; **Mahadasha** — The big stage of life, ruled by one planet, lasting 6 to 20 years.; **Antardasha** — A sub-stage inside a Mahadasha, ruled by another planet.; **Pratyantardasha** — A shorter stage inside the Antardasha.; **Supportive, mixed, challenging** — A teaching aid for how easy a period tends to feel, from how friendly the lord is for your rising sign, its dignity and its house.
- **Tip:** Dates depend on the birth time, so check the Moon-based start is right before trusting a boundary date.
- **Read with:** Dasha (`panel-dasha`), 36 Dasha Systems (`panel-dashasys`), Year Timeline File (`panel-yeartimeline`)
- **Code (file where the panel is defined or its markup lives):** `js/155-past-present-future.js` (198 lines)

#### ◷ Dasha `panel-dasha`

*120-year life-period timeline* · Home section: Time & Cycles

- **What it does:** Your 120-year Vimshottari Dasha timeline, level by level (Maha, Antar and deeper).
- **When to use it:** You want to know which period you are in and what comes next.
- **How:**
  1. Read the "You are in" card.
  2. Tap Now or At birth, or set a date.
  3. Tap a period to open its sub-periods.
- **Key words:** **Mahadasha** — The main period of a planet.; **Antardasha** — A sub-period inside it.
- **Tip:** Open the navigator for deeper levels.
- **Read with:** 36 Dasha Systems (`panel-dashasys`), Life Activation (`panel-active`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### 🎡 36 Dasha Systems `panel-dashasys`

*Vimshottari, Yogini, Chara, Narayana & more* · Home section: Time & Cycles

- **What it does:** Thirty-six dasha systems in seven groups, each opened level by level with start and end dates.
- **When to use it:** You want to compare Vimshottari with Yogini, Chara, Narayana and others.
- **How:**
  1. Open a group.
  2. Tap a system.
  3. Drill through Maha to Prana.
- **Key words:** **Chara dasha** — A Jaimini sign-based system.
- **Tip:** Start with Vimshottari, then add one other to compare.
- **Read with:** Dasha (`panel-dasha`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### ♄ Transits & Sade Sati `panel-transits`

*Saturn, Jupiter & node ingress dates* · Home section: Time & Cycles

- **What it does:** Saturn and Jupiter transits against your Moon and Lagna, including Sade Sati, Kantaka and Ashtama Shani, plus Rahu and Ketu dates.
- **When to use it:** You want to know if a Saturn phase is running or when the next sign change is.
- **How:**
  1. Read the status cards.
  2. Tap a planet tab.
  3. Tap "Show full timeline" for all dates.
- **Key words:** **Sade Sati** — Saturn in the 12th, 1st and 2nd sign from the Moon.
- **Tip:** Phases are tendencies; the soft wording is deliberate.
- **Read with:** Live Sky (`panel-transit`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### ☸️ Sudarshana Chakra `panel-sudarshana`

*Lagna, Moon and Sun views together: what each year of life lights up* · Home section: Time & Cycles

- **What it does:** Three views of one chart at once (Lagna, Moon and Sun), showing which house each year of life lights.
- **When to use it:** You want a yearly view of themes by age.
- **How:**
  1. Use − and + or Now to pick the year of life.
  2. Read what sits in the lit house in all three rings.
- **Key words:** **Sudarshana** — The wheel of three reference points.
- **Tip:** Where all three agree, the theme is stronger.
- **Read with:** Dasha (`panel-dasha`), Tithi Pravesh (`panel-tithi`)
- **Code (file where the panel is defined or its markup lives):** `js/138-sudarshana.js` (107 lines)

#### 🪔 Tithi Pravesh `panel-tithi`

*Your yearly lunar-birthday chart* · Home section: Time & Cycles

- **What it does:** Tithi Pravesh: the chart for the exact moment each year when the Moon returns to its birth angle from the Sun.
- **When to use it:** You want the yearly chart of your lunar birthday.
- **How:**
  1. Pick a year with ‹ Year, Year ›.
  2. Choose Pravesh 1 or 2, and North, South or Wheel.
  3. Open Focus, Planets, Panchang or Mudda tabs.
- **Key words:** **Muntha** — The yearly progressed point.; **Mudda** — A short yearly Dasha.
- **Tip:** Some years have two Praveshas.
- **Read with:** Vedic Birthday (`panel-vbday`), Sahams (`panel-sahams`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### 🎂 Vedic Birthday `panel-vbday`

*Tithi, Nakshatra & solar birthday for any year* · Home section: Time & Cycles

- **What it does:** Your Vedic birthday: when your birth tithi, nakshatra and Sun position return in any year.
- **When to use it:** You want to celebrate by the Hindu calendar.
- **How:**
  1. Pick a year with ‹ ›, or tap This year.
  2. Read the tithi, nakshatra and solar birthdays.
  3. Open the list of Janma Nakshatra days or the next 10 years.
- **Key words:** **Janma Nakshatra** — The day the Moon returns to your birth star.
- **Tip:** The tithi birthday can fall on two dates in a year.
- **Read with:** Tithi Pravesh (`panel-tithi`), Panchang Calendar (`panel-pcal`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### 🗓️ Year Timeline File `panel-yeartimeline`

*Pick two dates: planet moves, transits & dashas as one file for AI* · Home section: Time & Cycles

- **What it does:** Pick two dates and get one file of planet moves, nakshatra changes, transit contacts and Dasha changes, for any AI to read.
- **When to use it:** You want a factual timeline of a period to share.
- **How:**
  1. Choose From and To.
  2. Tick the extras (Moon moves, outer planets, a question).
  3. Tap Create file, then copy or download.
- **Key words:** **Ingress** — A planet entering a sign.
- **Tip:** The file holds facts only.
- **Read with:** Export & Share (`panel-export`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

### Planet & house strength — Check how strong or weak each planet and house is

#### ⚖ Shadbala `panel-shadbala`

*Planet strength* · Home section: Analysis

- **What it does:** Six-fold planet strength ranked, with each planet's total against the minimum required.
- **When to use it:** You want to know which planets are strong or weak.
- **How:**
  1. Read strongest and weakest.
  2. Tap a planet to see its six parts.
  3. Open the full planet detail.
- **Key words:** **Rupa** — A unit of strength.
- **Tip:** The tick marks the required minimum.
- **Read with:** Vimshopaka Bala (`panel-vimshopaka`), Planet States (`panel-avasthas`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### 🏠 Bhava Bala `panel-bhavabala`

*House strength — which life areas are strong* · Home section: Analysis

- **What it does:** Strength of each of the twelve houses: which life areas get natural support.
- **When to use it:** You want to know which areas of life are better supported.
- **How:**
  1. Switch By house or By strength.
  2. Open "How is this calculated?".
- **Key words:** **Bhava** — House.
- **Tip:** Compare with Shadbala for the planets.
- **Read with:** Shadbala (`panel-shadbala`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### ⚖️ Vimshopaka Bala `panel-vimshopaka`

*Strength out of 20 for each planet from its divisional charts* · Home section: Analysis

- **What it does:** A strength out of 20 for each planet, built from how it sits across the divisional charts.
- **When to use it:** You want to know if a planet's promise holds up across many charts.
- **How:**
  1. Pick a scheme (Shadvarga, Saptavarga, Dashavarga, Shodashavarga).
  2. Tap a planet to see every chart it uses.
- **Key words:** **Varga** — A divisional chart.
- **Tip:** Higher tends to mean steadier results.
- **Read with:** Divisional Charts (`panel-vargas`), Shadbala (`panel-shadbala`)
- **Code (file where the panel is defined or its markup lives):** `js/135-vimshopaka.js` (86 lines)

#### 🌓 Planet States `panel-avasthas`

*Avasthas: each planet's age, alertness and mood, and how freely it can give results* · Home section: Analysis

- **What it does:** Planet States (Avasthas): each planet's age, alertness and mood, and how freely it can give results.
- **When to use it:** You want a second view of planet strength beyond points.
- **How:**
  1. Read the summary line.
  2. Open "How these are worked out" for the rules.
- **Key words:** **Baladi** — Age state: infant, young, adult, old, spent.; **Jagradadi** — Alertness: awake, dreaming, asleep.
- **Tip:** Use with Shadbala.
- **Read with:** Shadbala (`panel-shadbala`)
- **Code (file where the panel is defined or its markup lives):** `js/134-avasthas.js` (147 lines)

#### ▦ Ashtakavarga `panel-ashtakavarga`

*Point-strength system* · Home section: Analysis

- **What it does:** The point-strength system: Sarva totals and a table for each planet across the signs.
- **When to use it:** You want to know which signs and houses are supported.
- **How:**
  1. Tap Σ Sarva or a planet.
  2. Read the sign tiles from your Lagna.
- **Key words:** **SAV** — Sarvashtakavarga: all points per sign.
- **Tip:** 32+ excellent, 28+ good, 25–27 average, below 25 weak.
- **Read with:** Ashtakavarga Workings (`panel-asx`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### 🧮 Ashtakavarga Workings `panel-asx`

*Prastara tables and the working behind the Ashtakavarga numbers* · Home section: Analysis

- **What it does:** The working behind the Ashtakavarga numbers: Prastara, Sodhana (reductions), Kakshya and Transit tabs.
- **When to use it:** You want to see how a point score was made, or check a transit against it.
- **How:**
  1. Switch tab: Prastara, Sodhana, Kakshya, Transit.
  2. Pick a planet.
  3. Copy the table if needed.
- **Key words:** **Bindu** — A single point in the system.; **Kakshya** — An eight-part split of a sign.
- **Tip:** Use Ashtakavarga first for the totals.
- **Read with:** Ashtakavarga (`panel-ashtakavarga`)
- **Code (file where the panel is defined or its markup lives):** `js/141-ashtakavarga-extras.js` (144 lines)

#### 🌡️ Fate Meter `panel-fate`

*How much is written vs in your control* · Home section: Analysis

- **What it does:** Fate Meter: an index of how much is set versus in your control, built from Shadbala, Bhava Bala, Ashtakavarga, Dasha and Yogas.
- **When to use it:** You want a thoughtful balance read on each life area.
- **How:**
  1. Read the main percentage.
  2. Tap a house chip to see its own balance.
- **Key words:** **Index** — An interpretive score, not a classical one.
- **Tip:** It shows a starting position, not an ending.
- **Read with:** Bhava Bala (`panel-bhavabala`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### ✨ Sensitive Degrees `panel-sensitive`

*Gandanta, Mrityu Bhaga and Pushkara: which of your planets sit on a marked degree* · Home section: Analysis

- **What it does:** Degrees read with extra care (Gandanta, Mrityu Bhaga) and nourishing ones (Pushkara).
- **When to use it:** You want to check whether any planet sits on a marked degree.
- **How:**
  1. Scan the list; flagged planets are highlighted.
  2. Open "Where these come from".
- **Key words:** **Gandanta** — The junction between water and fire signs.; **Pushkara** — A nourishing degree.
- **Tip:** A mark is a note to read with care, not a verdict.
- **Read with:** Planets (`panel-planets`)
- **Code (file where the panel is defined or its markup lives):** `js/137-sensitive-degrees.js` (83 lines)

#### 🌑 Upagrahas `panel-upagrahas`

*Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu and Gulika: where each shadow point falls* · Home section: Analysis

- **What it does:** Shadow points (Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu and Gulika): where each falls in your chart.
- **When to use it:** You study Gulika or other sub-planets.
- **How:**
  1. Read each card for sign, house and nakshatra.
  2. Open "How these are worked out".
- **Key words:** **Upagraha** — A calculated point, not a body.; **Gulika** — Saturn's son, worked from Saturn's part of the day.
- **Tip:** Read them as supporting detail.
- **Read with:** Planets (`panel-planets`)
- **Code (file where the panel is defined or its markup lives):** `js/136-upagrahas.js` (47 lines)

### Combinations & deeper study — Look for yogas, doshas and a second opinion on a house

#### ✦ Yogas `panel-yogas`

*Notable planet combinations* · Home section: Analysis

- **What it does:** Notable planet combinations in your chart, grouped by type.
- **When to use it:** You want to know which classical combinations are present.
- **How:**
  1. Use the filter chips.
  2. Tap a card to read its meaning.
- **Key words:** **Yoga** — A planet-house-sign combination.
- **Tip:** It is a focused, verified set, not every yoga in the texts.
- **Read with:** Dosha Check (`panel-dosha`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### 🧿 Dosha Check `panel-dosha`

*Manglik, Kaal Sarp, Pitru, Gand Mool & more: the reason and what softens it* · Home section: Analysis

- **What it does:** Checks for Manglik, Kaal Sarp, Pitru, Gand Mool, Guru Chandala and more, each with the exact reason and what softens it.
- **When to use it:** You want to know if a classical marker is present and how heavily to read it.
- **How:**
  1. Read the count at the top.
  2. Tap a check to see the reason from your chart.
- **Key words:** **Dosha** — A marker that asks for care, not a verdict.
- **Tip:** Many astrologers read these lightly.
- **Read with:** Kundali Matching (`panel-match`), Yogas (`panel-yogas`)

#### 🧲 Argala `panel-argala`

*Which planets press on each house and which obstruct them (Jaimini)* · Home section: Analysis

- **What it does:** Jaimini Argala: planets that press on a house from the 2nd, 4th and 11th, and the ones that obstruct them.
- **When to use it:** You want to know who supports or blocks a house.
- **How:**
  1. Tap a house.
  2. Read the planets that intervene and the ones that obstruct.
- **Key words:** **Argala** — Intervention on a house.; **Virodha** — Obstruction of an argala.
- **Tip:** Equal numbers on both sides are read as contested.
- **Read with:** House from the House (`panel-bhavat`)
- **Code (file where the panel is defined or its markup lives):** `js/139-argala.js` (78 lines)

#### 🪞 House from the House `panel-bhavat`

*Bhavat Bhavam and all twelve Arudha Padas: a second reading of each house* · Home section: Analysis

- **What it does:** House from the House (Bhavat Bhavam) and all twelve Arudha Padas, a second reading of each house.
- **When to use it:** You want to read a matter twice, for example a partner through the 7th and the 1st.
- **How:**
  1. Open a house row.
  2. Read the sign, lord and planets there.
  3. See the Arudha Pada for the same house.
- **Key words:** **Bhavat Bhavam** — The Nth house from the Nth house.; **Pada** — The Arudha of a house; how it appears to the world.
- **Tip:** It supplements the main reading.
- **Read with:** Bhavat Bhavam Masterclass (`panel-bhavatclass`), Special Lagnas (`panel-lagnas`), Argala (`panel-argala`)
- **Code (file where the panel is defined or its markup lives):** `js/140-bhavat-bhavam.js` (44 lines)

#### 🎓 Bhavat Bhavam Masterclass `panel-bhavatclass`

*Every house read twice: formulas, rules, scores, dasha timing and any house from any house* · Home section: Analysis

- **What it does:** A full course on Bhavat Bhavam with your own chart: every house read twice, a Support score with its formula, how the two layers agree, and which dasha is touching them.
- **When to use it:** You want to know why a house looks easy or hard, or to read a matter through a second house, or to count any house from any house.
- **How:**
  1. Open My chart. Tap a house on the pair map or a colour tile, or open a row, for example 7 → 1.
  2. Read the main layer, the second layer and how they sit together.
  3. Use Explorer to tap any square of the 12 by 12 map, or see one house from all twelve starting points.
  4. Use Recipes for a question like marriage or career, and Learn for the formulas and rules.
- **Key words:** **Bhavat Bhavam** — House from house: the Nth house counted from the Nth house, or any house counted from any other.; **Support score** — A small teaching score from the lord, its strength, planets inside, aspects and Ashtakavarga. Not a verdict.; **Derived house** — The second house found by the pair rule.
- **Tip:** The main house leads. The second house adds colour and never replaces it.
- **Read with:** House from the House (`panel-bhavat`), Argala (`panel-argala`), Dasha (`panel-dasha`)
- **Code (file where the panel is defined or its markup lives):** `js/152-bhavat-masterclass.js` (227 lines)

#### ▦ Varga Matrix `panel-vargamatrix`

*All planets across D1 to D144 in one colour grid* · Home section: Your Chart

- **What it does:** Every planet in every divisional chart (D1 to D144) in one colour-coded grid, so you can see where each planet is comfortable or strained across the whole chart family.
- **When to use it:** You want the big picture of your divisional charts quickly, or want to spot Vargottama planets and the strongest and weakest planets across the charts.
- **How:**
  1. Pick Sapta 7, Shodasha 16 or All charts at the top.
  2. Read a row for one chart and a column for one planet. Gold means exalted, green own or friendly, pink enemy or debilitated.
  3. Tap any square to see the sign, house, movement and how it compares with D1.
  4. Scroll down for the strongest and weakest planets and the Vargottama list.
- **Key words:** **Vargottama** — A planet in the same sign in D1 and D9.; **Dignity** — How comfortable a planet is in a sign: exalted, own, friendly, neutral, enemy or debilitated.; **Lg** — The Lagna (rising sign) of that divisional chart.
- **Tip:** Colour shows comfort, not a verdict. Read it with the whole chart.
- **Read with:** Divisional Charts (`panel-vargas`), Shadbala (`panel-shadbala`), Bhavat Bhavam Masterclass (`panel-bhavatclass`)
- **Code (file where the panel is defined or its markup lives):** `js/153-varga-matrix.js` (107 lines)

#### 🧭 KP System `panel-kp`

*Cusps, star and sub lords, significators, event promise, ruling planets* · Home section: Analysis

- **What it does:** The KP system: cusps, star and sub lords, significators, event promise and ruling planets.
- **When to use it:** You follow Krishnamurti Paddhati and want its tables.
- **How:**
  1. Read the cusp table.
  2. Check significators (A strongest to D).
  3. Copy the KP table if needed.
- **Key words:** **Sub lord** — The finer division of a star; decides if a matter is promised.; **Significator** — A planet linked to a house.
- **Tip:** KP uses its own ayanamsa, kept separate from your main one.
- **Read with:** Planets (`panel-planets`)

#### ⭐ Sahams `panel-sahams`

*36 sensitive points with readings* · Home section: Analysis

- **What it does:** Thirty-six sensitive points (Sahams) with readings, for the birth chart or the annual chart.
- **When to use it:** You want finer points for marriage, career, children and more.
- **How:**
  1. Switch Birth chart or Annual.
  2. Tap a saham to read it.
- **Key words:** **Saham** — An Arabic-Persian sensitive point used in annual charts.
- **Tip:** Night charts reverse some formulas; the page notes this.
- **Read with:** Tithi Pravesh (`panel-tithi`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### ⚯ Relationships `panel-relationships`

*Conjunctions & aspects* · Home section: Analysis

- **What it does:** Pick two or more planets and find when they were last in conjunction or aspect and when they next will be.
- **When to use it:** You want dates of planetary meetings.
- **How:**
  1. Tap the planets.
  2. Choose Vedic (house aspects) or Western aspects.
  3. Run the search.
- **Key words:** **Conjunction** — Two planets at the same degree.
- **Tip:** Searched against real planetary motion.
- **Read with:** Live Sky (`panel-transit`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### ⚡ Trigger Lab `panel-triggerlab`

*Pick the Dasha pattern and your transit rules; see when they meet and which houses they activate* · Home section: Analysis

- **What it does:** Pick a Dasha pattern and your own transit rules; it finds every time they hold together.
- **When to use it:** You study timing and want to test a rule such as "this Dasha plus Saturn in this sign".
- **How:**
  1. Choose Single or Double pattern.
  2. Set your transit rules (sign, lord, aspect, nakshatra).
  3. Tap "Find triggers".
- **Key words:** **Trigger** — A moment when the Dasha pattern and your transit rules agree.
- **Tip:** You do not pick planets: it finds them.
- **Read with:** Dasha (`panel-dasha`), Transits & Sade Sati (`panel-transits`)

#### 🧩 Meaning Lab `panel-meaninglab`

*Mix any planets, houses, signs and lords; read each raw meaning side by side and write your own* · Home section: Analysis

- **What it does:** Mix any planets, houses, signs, lords and nakshatras and read each raw meaning side by side from your Knowledge Database.
- **When to use it:** You want to build your own reading from pieces.
- **How:**
  1. Choose a type and a value, then tap Add.
  2. Or add a planet with its sign and house.
  3. Write your own meaning for each piece and the combined result.
- **Key words:** **Raw meaning** — The stored keyword meaning before interpretation.
- **Tip:** You do the reading; the lab gathers the pieces.
- **Read with:** Astro Atlas (`panel-atlas`)

### People & compatibility — Compare my chart with someone else

#### 💞 Kundali Matching `panel-match`

*Ashtakoota 36-point match & Manglik check* · Home section: Compatibility

- **What it does:** Ashtakoota matching: eight factors worth 36 points, plus a Manglik check.
- **When to use it:** You are comparing two charts for marriage.
- **How:**
  1. Choose two people (a saved profile or a new person).
  2. Tap check.
  3. Read the score and each factor.
- **Key words:** **Ashtakoota** — The eight-fold match.; **Manglik** — A Mars placement check.
- **Tip:** Use Synastry for a deeper view.
- **Read with:** Synastry (`panel-synastry`), Dosha Check (`panel-dosha`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### 🤝 Synastry `panel-synastry`

*Compatibility of two charts: planets in each other's houses, contacts and the two Moons* · Home section: Analysis

- **What it does:** How two charts sit on each other: planets in the other's houses, contacts, and the two Moons.
- **When to use it:** You want to see how two people's charts interact, beyond the 36-point score.
- **How:**
  1. Pick the first and second person.
  2. Tap ⇄ to swap them.
  3. Read the strongest contacts, then the house overlays.
- **Key words:** **Overlay** — A planet of one person falling in a house of the other.
- **Tip:** These are placements, not predictions.
- **Read with:** Kundali Matching (`panel-match`)
- **Code (file where the panel is defined or its markup lives):** `js/143-synastry.js` (134 lines)

### Fix the birth time or date — Correct an uncertain birth time or find a forgotten birth date

#### 🎯 Rectification Studio `panel-rectification`

*Dial, scan & confirm the time* · Home section: Fix Birth Time

- **What it does:** A guided studio for finding the true birth time. You say how sure you are and it points you to the right tool.
- **When to use it:** The birth time is uncertain, rounded, or you want to confirm it.
- **How:**
  1. Choose how sure you are (to the minute, within 30 minutes, a few hours, or unknown).
  2. Follow the suggested tools.
  3. Check the dial and scan until the chart fits real events.
- **Key words:** **Rectification** — Adjusting the birth time until the chart matches known life events.
- **Tip:** Use Life-Event Checker last, to confirm.
- **Read with:** Life-Event Checker (`panel-lifeevents`), Sandhi Table (`panel-sandhi`), Varga Timeline (`panel-vargatimeline`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### 🌟 Life-Event Checker `panel-lifeevents`

*Confirm the time with real events* · Home section: Fix Birth Time

- **What it does:** Confirm the birth time using real events such as marriage, a move, or a job, checked against Dasha and transits.
- **When to use it:** You know a few dated life events and want to test candidate birth times.
- **How:**
  1. Add events with their dates.
  2. Run the check.
  3. Compare how well each time fits.
- **Key words:** **Dasha** — The running life period of a planet.
- **Tip:** Use at least three events.
- **Read with:** Rectification Studio (`panel-rectification`), Dasha (`panel-dasha`)

#### ⏱ Sandhi Table `panel-sandhi`

*Ascendant window across all charts* · Home section: Fix Birth Time

- **What it does:** Shows the window in which the ascendant stays the same across all divisional charts.
- **When to use it:** You want to know how much the birth time can move before a chart changes sign.
- **How:**
  1. Tap "Calculate Sandhi Table Now".
  2. Read the window per chart.
- **Key words:** **Sandhi** — The junction where one sign changes to the next.
- **Tip:** Narrow windows show which charts are most time-sensitive.
- **Read with:** Varga Timeline (`panel-vargatimeline`), Rectification Studio (`panel-rectification`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### 🗺️ Varga Timeline `panel-vargatimeline`

*Map the birth window on any chart* · Home section: Fix Birth Time

- **What it does:** Maps the birth window on any chosen divisional chart, showing when the ascendant changes there.
- **When to use it:** You test a birth time against one divisional chart.
- **How:**
  1. Pick a divisional chart.
  2. Tap "Map Out Timeline".
  3. Read the start and end of each stretch.
- **Key words:** **Window** — The span of time in which the D1 ascendant stays the same.
- **Tip:** Use D9 first.
- **Read with:** Sandhi Table (`panel-sandhi`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### ⏳ Transit Timer `panel-transittimer`

*When a planet changes house* · Home section: Fix Birth Time

- **What it does:** Tells when a planet or the Lagna changes house or sign in a chosen chart.
- **When to use it:** You want the exact moment of a sign change, for example around the birth time.
- **How:**
  1. Pick the body and divisional chart.
  2. Tap "Check Transit Timing".
- **Key words:** **Ingress** — The moment a planet enters a new sign.
- **Tip:** Handy for judging how near an ascendant change is.
- **Read with:** Sandhi Table (`panel-sandhi`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### 🔎 Date Finder `panel-datefinder`

*Find the birth date from festival, tithi & day clues* · Home section: Fix Birth Time

- **What it does:** Finds a forgotten birth date from clues such as a festival, tithi, weekday, nakshatra or Moon sign.
- **When to use it:** You only remember something like "born on Diwali" or "on a Tuesday in the waning Moon".
- **How:**
  1. Enter the years to search.
  2. Add any clues you know (tithi, weekday, festival, star, Moon sign, month).
  3. Pick from the matching dates.
- **Key words:** **Tithi** — A lunar day (1 of 30 in a month).; **Masa** — The lunar month.
- **Tip:** More clues give fewer dates.
- **Read with:** Panchang Calendar (`panel-pcal`), Panchanga (`panel-panchanga`)

### Learn & look things up — Learn the basics or look up a planet, sign or number

#### 📖 Feature Guide `panel-guide`

*Every tool explained: what it does and how to use it* · Home section: Export & Help

- **What it does:** This guide: every tool explained, searchable, with a button to open each.
- **When to use it:** You do not know which tool to use or what one does.
- **How:**
  1. Type a word in the search box.
  2. Or pick a group chip.
  3. Tap a card to open it and read the steps.
  4. Tap "Open this tool".
- **Tip:** Search works on plain words like "marriage" or "time".
- **Read with:** Astro Atlas (`panel-atlas`), Planet Encyclopedia (`panel-planetency`)

#### 🧭 Astro Atlas `panel-atlas`

*The basics in one place: day lords, signs, body parts, houses, 27 nakshatras, tithi, dasha, friends and rules* · Home section: Analysis

- **What it does:** The basics of Vedic astrology in one place: weekdays, planets, signs, body parts, houses, nakshatras, time, rules, charts, yogas and remedies.
- **When to use it:** You are new, or need a quick definition.
- **How:**
  1. Tap a topic chip.
  2. Read the short tables.
- **Key words:** **Atlas** — A reference, not a reading.
- **Tip:** Use it alongside the Planet Encyclopedia.
- **Read with:** Planet Encyclopedia (`panel-planetency`)

#### 📚 Planet Encyclopedia `panel-planetency`

*Every planet in full: nature, aspects, exalted & debilitated, friends & foes* · Home section: Analysis

- **What it does:** Every planet in full: nature, aspects, exalted and weak signs, friends and foes, houses, and how it sits in your chart.
- **When to use it:** You want to understand what a planet stands for.
- **How:**
  1. Tap a planet.
  2. Switch between Nature, Aspects, Strength, Friends & foes, Houses, Your chart.
- **Key words:** **Exaltation** — The sign where a planet is strongest.
- **Tip:** The "Your chart" tab ties the text to your placements.
- **Read with:** Planets (`panel-planets`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

#### 🔢 Numerology `panel-numerology`

*Name number & birth-date numbers with meanings* · Home section: Analysis

- **What it does:** Name number and birth-date numbers with meanings, in Chaldean or Pythagorean systems.
- **When to use it:** You are curious about the numbers of a name or birth date.
- **How:**
  1. Choose Name only or Birth date + name.
  2. Pick Chaldean or Pythagorean.
  3. Type the name; add a date if you want.
- **Key words:** **Chaldean** — The traditional system with numbers 1 to 8.
- **Tip:** Use the English spelling of the name.
- **Read with:** Avakahada Chakra (`panel-avakahada`)
- **Code (file where the panel is defined or its markup lives):** `js/58-render-results.js` (760 lines)

### Export & help — Save, share or ask the developer

#### 📤 Export & Share `panel-export`

*Download a file or copy your full report* · Home section: Export & Help

- **What it does:** Export & Share: a builder where you choose every section, as text or JSON, and split it into parts for AI tools.
- **When to use it:** You want to save, share, or give your chart to an AI.
- **How:**
  1. Pick a preset (Essentials, AI, All, None).
  2. Tick sections by group.
  3. Choose format and part size.
  4. Download or copy.
- **Key words:** **Parts** — Smaller pieces of 20K, 50K or 100K characters.
- **Tip:** Your choices are remembered on this device.
- **Read with:** Year Timeline File (`panel-yeartimeline`)
- **Code (file where the panel is defined or its markup lives):** `js/148-export-builder.js` (275 lines)

#### 💬 Contact Developer `panel-contact`

*Bugs, ideas or astrology chat* · Home section: Export & Help

- **What it does:** A form to report bugs, suggest ideas or ask the developer about astrology.
- **When to use it:** Something looks wrong or you have an idea.
- **How:**
  1. Open it and write your message.
  2. Send it.
- **Tip:** Say which tool and what you tapped.

## 6. The 3D Sky app: every feature

Three.js r128 loaded from a CDN. Open it from the switcher. Tabs and tools (from `apps/sky3d/js` and the Feature Guide):

- **⇪ Export Studio (3D Sky)** — Open the Export tab and tap Open Export Studio to build clean, structured data for an AI chat or your own tools. Start from a preset (Quick sky, AI brief, Forecast, Everything), then choose the chart (sky, birth chart or both) and the moment (the 3D date, right now, or a date you pick). Switch each section on or off: Planets, Signs, Houses, Panchang, Aspects, Planet relations, Sky alerts, Divisional charts, Vimshottari Dasha, Sign changes, Planet meetings, Retrograde periods, an Ephemeris table and your last Timeline finder results. The gear next to a section sets its options, such as which divisional charts, how many years ahead, or the table step. Pick Markdown (best for AI), JSON or plain text, degrees or decimals, add a how-to-read guide and rules for the AI, and type your own question to put at the top. A live preview shows the size in characters and tokens. Export to clipboard, Download or Share. The Export tab also has one-tap AI brief, Quick sky, Forecast and Everything.
- **🌌 Open a divisional chart in 3D (Birth Chart to 3D Sky)** — In the Birth Chart, open Divisional Charts, pick any chart (D2 Hora, D10 Dasamsa, D60 and so on, even the nested D81, D108 and D144) and tap Open in 3D. The 3D Sky opens at the birth moment with that chart drawn as the sky, the same way the Navamsha sky works: every planet sits in its divisional sign, with its place inside the division stretched over the sign, and the Rising and Moon lines name the chart. A round badge (for example D10) at the top right shows it is on; tap it to return to the normal sky. Pick D1 to see the ordinary birth sky.
- **⌛ Timeline finder (3D Sky)** — Open the Tools menu and tap the hourglass to work backwards from the sky to dates. Step 1: pick when the person was born, either an age range counted from today (30 to 40 means the last 10 years of births) or a range of birth years. Step 2: add conditions: a planet or several planets in a sign, a planet in a nakshatra, two planets in conjunction, square, trine or opposition (with an orb you can set), or a planet retrograde. Add as many as you like and choose whether ALL must be true together or ANY one is enough. Example: Sun in Libra plus Moon in Pisces lists every window in that span when both were true, which is useful for reading a child chart as father and mother. Each retrograde re-entry shows as its own period. Tap a result and the 3D sky opens on that day, the same as typing the date. Tap All planets on that day under a result to read every planet with its sign, degree, nakshatra and pada (℞ when retrograde) at the start, middle or end of the period, with an Open this day in the 3D Sky button. Dates are sidereal (Lahiri) and accurate to about a minute.
- **ƒ Formula maker (3D Sky)** — Open the Tools menu and tap ƒ to build your own astrology formulas, test them, find dates and share them. A formula is a list of rules joined by All, Any, None or At least N. Each rule says that something is in a relation to something else, for example Jupiter is in a kendra from the Moon, the Atmakaraka is in the 1st, 4th, 7th or 10th, or Saturn is within 3 degrees of your Bhrigu Bindu. You can use planets, signs, nakshatras and padas, degrees, aspects, conjunctions, angles, houses, dignity, retrograde, combust, divisional-chart signs, house lords and the points: Chara Karakas AK to DK (7 or 8 karaka scheme), Bhrigu Bindu, Yogi and Avayogi points and planets, Duplicate Yogi, Gulika, Lagna, Hora, Ghati and Indu lagna, Karakamsa, Swamsha and Arudha A1 to A12. Each thing can come from this chart, a saved person, the sky moment or a second person, so transit formulas like Sade Sati are easy. The Result tab checks the formula on a birth chart, the 3D date, now or any date and shows every rule with a tick, cross or question mark and the actual values. A question mark means it cannot be decided (for example no birth time), never a guess. Find dates lists every time the formula is true, in the sky or as birth dates; tap one to open that day in 3D. The Library has about 45 ready formulas (yogas, karaka links, transits, sky events). Share gives a short VF1 code, a link that opens the formula for anyone, a text card, a JSON file and a picture; Saved keeps your list and can export or import all of it.
- **⚑ Sky alerts (3D Sky)** — Under the Rising and Moon lines in the 3D Sky there is a small pill with counts: △ planets in the trine houses (1st, 5th, 9th), □ squares (4th, 10th), ☍ the 7th, and ! the ones to watch. Houses are counted by sign from the Rising and from the Moon. Tap it for the full list, plus planets on the sign itself, Jupiter and Saturn Gochara from the Moon, Sade Sati, the Rahu-Ketu axis and the Jupiter + Saturn double transit. Switch to For you to count from your own birth Rising and Moon. These are tendencies from classical rules, not predictions. Hidden in the Navamsha sky.
- **⚒ Tools menu and Navamsha sky (3D Sky)** — Top right of the 3D Sky now has just two icon buttons, one above the other: the eye 👁 (hides all controls for a clean view) and ⚒ Tools. Tap ⚒ to drop down icon buttons for Sky Dashboard, Aspect Explorer, Select a planet, Reset view and Navamsha sky (press and hold or hover an icon to see its name). Navamsha sky redraws the exact current sky with every planet at its Navamsha (D9) position; the HUD, sky table and chart tab switch to D9, and a gold D9 circle shows under the buttons (tap it to go back). It works in the Zodiac Wheel view only. Planet pop-ups keep the real data and add the exact D9 degree.
- **◀ Reverse play (3D Sky)** — Beside ▶ in the timeline bar. Tap ◀ and time runs backward at the chosen speed (1d/s to 1y/s). Tap ▶ while it runs backward to turn time around, tap the running button to pause.
- **⊞ All tabs grid (3D Sky)** — Tap All at the start of the tab strip under the sky to see every tab as a big grid with a short line each. One tap opens that tab. The strip scrolls to keep the tab you opened in view.
- **👤 Make a profile from a moment (3D Sky)** — Tap 👤 in the timeline bar to turn the moment showing now (even while time is running), or 👤 on any Saved moment, into a natal profile. Date and time are the ones shown; the place is your "Where are you now?" place.

Files and what each does (full table is in section 9; the 3D Sky part, in load order):

| File | Lines | What it does |
|---|---:|---|
| `index.bundle.html` | 11,852 | GENERATED by build.py (do not edit): this app with every css/js inlined, what the shell loads (1 request instead of ~260) |
| `index.html` | 553 | markup of this app; lists its css/js in load order |
| `js/01-astro-engine.js` | 162 | core astronomy engine (Sun, Moon, planets, ayanamsa) |
| `js/02-planetary-dignity.js` | 49 | dignity tables incl. outer planets |
| `js/03-ascendant-houses-drishti.js` | 51 | ascendant, houses, drishti |
| `js/04-sign-level-aspects.js` | 21 | sign-level aspects |
| `js/05-aspect-resolver.js` | 57 | aspect resolver |
| `js/06-planet-detail-helpers.js` | 153 | transit/conjunction scanning, retrogrades, returns helpers (findIngresses...) |
| `js/07-position-snapshot.js` | 39 | full position snapshot at a Julian day |
| `js/08-scene-setup-and-camera.js` | 398 | Three.js scene, camera modes, zodiac ring |
| `js/09-free-fly-joystick.js` | 59 | mobile free-fly joystick |
| `js/10-procedural-textures.js` | 314 | procedural planet textures |
| `js/11-planet-visuals.js` | 252 | planet meshes and visuals |
| `js/12-solar-system-view.js` | 193 | Solar System view (SOL, setSceneView, real distances) |
| `js/13-camera-mode-control.js` | 49 | camera mode control (orbit/focus/free) |
| `js/14-line-visibility-toggles.js` | 67 | line visibility toggles |
| `js/15-planet-labels.js` | 74 | 3D planet labels |
| `js/16-app-state.js` | 34 | global app state |
| `js/17-render-sky-table.js` | 22 | sky table renderer |
| `js/18-rising-sign-timeline.js` | 108 | rising-sign timings (long-press popup + Rising tab); Navamsha now + tap a sign for its 9 Navamshas with times to the second |
| `js/19-hud-render.js` | 64 | HUD (ascendant chip, rising chip) rendering |
| `js/20-transit-conjunction-scanner.js` | 151 | transit/conjunction scanner UI |
| `js/21-natal-profile.js` | 49 | natal profile |
| `js/22-chart-tab.js` | 37 | Chart tab |
| `js/23-north-indian-wheel.js` | 77 | North-Indian diamond wheel (SVG) |
| `js/24-sign-selector.js` | 82 | sign selector dropdown |
| `js/25-rich-sign-detail.js` | 94 | rich sign detail |
| `js/26-sign-aspects.js` | 102 | sign aspects UI |
| `js/27-aspect-explorer-ui.js` | 158 | aspect explorer UI |
| `js/28-planet-detail-popup.js` | 148 | planet detail popup |
| `js/29-planet-detail-content.js` | 144 | planet detail content (PD table) |
| `js/30-outer-planet-knowledge.js` | 37 | outer planet knowledge text |
| `js/31-outer-planet-popup.js` | 99 | Uranus/Neptune/Pluto popup |
| `js/32-aspect-explorer-popup.js` | 73 | aspect explorer popup, long-press + magnetic wiring |
| `js/33-timeline-scrubber.js` | 57 | timeline scrubber |
| `js/34-main-refresh-loop.js` | 59 | main refresh loop |
| `js/35-ui-wiring.js` | 20 | UI event wiring |
| `js/36-mobile-bottom-sheet.js` | 98 | mobile bottom sheet |
| `js/37-natal-form-location.js` | 117 | natal form + location autocomplete |
| `js/38-data-export-wiring.js` | 11 | data export wiring |
| `js/39-smoothness.js` | 50 | smoothness: skip no-op DOM writes |
| `js/40-3d-astro-layers.js` | 144 | 3D astro layers (lines, houses) |
| `js/41-quick-planet-picker.js` | 46 | quick planet picker |
| `js/42-init.js` | 23 | startup / init |
| `js/43-degree-finder-returns.js` | 213 | degree finder and returns |
| `js/44-retrograde-planner.js` | 40 | retrograde planner |
| `js/45-vimshottari-dasha.js` | 59 | Vimshottari dasha engine in Julian Days (VDasha: build timeline, at(jd) -> Maha/Antar/Pratyantar) |
| `js/46-dasha-transit-engine.js` | 318 | Dasha + Transit trigger engine (DTrig): 23 life areas with sourced rules (double transit, Jupiter, Saturn, Saturn+node, node triggers), dasha link per house, dasha-lord activation, window scan |
| `js/47-dasha-transit-ui.js` | 144 | Triggers tab UI: running dashas, live strength per life area, scan windows, why details, tap = jump to date |
| `js/48-profile-bridge.js` | 47 | Profile bridge: all Birth Chart profiles appear in 3D (marked ✦, live), and the chart opened in the main app is auto-selected in 3D |
| `js/49-time-machine.js` | 169 | Date picker (five snapping wheels: day with weekday, month, year, hour, minute; quick steppers with hold-to-repeat; year scrub bar; typed dates; Now / Birth / Midnight) + draggable, zoomable timeline |
| `js/50-sky-dashboard.js` | 294 | Sky Dashboard (top-right ▦ button): full-screen page with panchang, highlights, planet cards, who aspects whom, trine/house matrix, sign + nakshatra exchanges, dispositor chains, signs, nakshatras, houses, balance, outer planets; reads the 3D date or the birth chart (`DBX`) |
| `js/51-jump-from-rectification.js` | 33 | receives the Rectification jump: switches to the Zodiac Wheel, jumps to the exact moment, pauses play, shows the Rising sign for the birth place (session only), toast |
| `js/52-gulika.js` | 52 | Gulika (Mandi) for 3D Sky (global GK): same method as the Birth Chart; marker on the zodiac ring, natal ring, dashboard card |
| `js/53-exact-aspects.js` | 209 | Aspects tab: when a planet's aspect (Moon 7; Mars 4/7/8; Jupiter/Rahu/Ketu 5/7/9; Saturn 3/7/10; plus conjunction) lands on the exact degree of a natal planet/Lagna (if a profile is active), a live-sky planet, or a custom degree; exact moments, orb entry/exit and duration |
| `js/54-degree-houses.js` | 139 | Houses tab + 3D layer: degree-based houses from the exact rising degree (Sripati / Equal), wheel, planets that change house, 3D house lines and tags |
| `js/55-live-shadbala-engine.js` | 329 | copy of the Birth Chart Shadbala engine (SHB_ENGINE), kept identical by tests/sky3d_shadbala_test.js |
| `js/56-live-shadbala.js` | 100 | live Shadbala for the 7 planets at the 3D time and viewer place; adds the Shadbala block and badge to the planet window (Strength tab) |
| `js/57-profile-from-moment.js` | 77 | Make a profile from a moment: 👤 in the timeline bar (moment on screen, even while running) and on each Saved moment; pmDraft/pmCreate; uses the live place, blocks a time-zone guess |
| `js/58-ui-all-tabs.js` | 43 | "All" button in the tab strip: grid of every tab (one tap to open), keeps the active tab in view |
| `js/59-wheel-frame.js` | 53 | wheel framing on phones: finds the free band between the cards and the timeline bar, shifts the picture into it (camera view offset) and re-fits the zoom; `wheelBand()`, `wheelFrameUpdate()` |
| `js/60-wheel-beauty.js` | 76 | Zodiac Wheel beauty pass: soft Sun glow (replaces hard shells), degree scale on the sign ring, golden aura and inner plate, Earth/Moon lift, gentle Sun breathing and gem twinkle; off with localStorage vax3d_beauty='0' |
| `js/61-navamsha-sky.js` | 53 | global `NAV`: Navamsha (D9) sky (`NAV.snap/asc/set`, D9 = lon×9 mod 360) used by scene, HUD, sky table, overlays and chart tab; top-right Tools drop-down wiring (`#toolsBtn`, `#toolsMenu`, `#navBtn`, `#navBadge`); forced off in Solar System view |
| `js/62-sky-alerts.js` | 125 | global `SKA`: HUD pill under the Moon line + bottom sheet of trine (1-5-9), square (4-10), opposite (7), on-the-sign, Gochara, Sade Sati, Rahu-Ketu axis and Jupiter+Saturn double-transit alerts from the live Rising and Moon, or your birth Rising and Moon (`SKA.calc` is pure) |
| `js/63-timeline-finder.js` | 138 | global `TLF`: Tools > Timeline finder. Age range (from today) or birth years + conditions (planets in a sign, in a nakshatra, planets meeting/aspecting, retrograde), match ALL or ANY, scans the sky engine and lists every matching period; tap to jump the 3D sky (`TLF.test/search` are pure) |
| `js/64-varga-math.js` | 165 | global `VG`: divisional-chart sign rules copied from the Birth Chart `calcVarga`, plus `VG.lon` (a full 0-360 sky longitude in any varga); used by `NAV` to draw any D2-D144 chart as a sky |
| `js/65-export-studio.js` | 377 | global `XS`: the 3D Sky export engine. One data model (sections of kv / table / list / text blocks) rendered as Markdown, JSON or plain text; presets, section builders (planets, signs, houses, panchang, aspects, relations, alerts, divisional charts, Dasha, transits, meetings, retrograde, ephemeris, Timeline finder results) |
| `js/66-export-studio-ui.js` | 130 | global `XSU`: the Export Studio sheet (presets, chart and moment, section switches and options, format, question for the AI, live preview, Copy / Download / Share) and the one-tap copies on the Export tab |
| `js/67-formula-engine.js` | 295 | global `FM`: Formula Maker engine. Subjects (planets, Chara Karakas AK..DK 7/8 scheme, Bhrigu Bindu, Yogi/Avayogi, Gulika, Hora/Ghati/Indu lagna, Karakamsa, Swamsha, Arudha A1..A12, house lords), ~25 relations, tri-state evaluator with explained tree, charts C/N/S/P, Find-dates scan |
| `js/68-formula-library.js` | 94 | global `FMX`: ~45 ready formulas, share code `VF1.` + `#f=` link, text card, JSON import/export, Saved list (localStorage `sky3d_fm_saved`) |
| `js/69-formula-ui.js` | 344 | global `FMU`: Formula Maker sheet (Tools > ƒ): Build / Result / Library / Saved tabs, rule editor, operand picker, find dates, share sheet, PNG card |

## 7. Notepad, Developer card, Shell, Shared layers

**Notepad**

- `apps/notepad/index.html` (51 lines, 3.3 KB) — markup of this app; lists its css/js in load order
- `apps/notepad/css/01-notepad.css` (245 lines, 32.1 KB) — notepad styles
- `apps/notepad/js/01-notepad.js` (358 lines, 73.2 KB) — notepad: notes, templates, client cards (key vedicNotepad_v1); Settings tab (view "settings", on/off switches in S.set.o, OPT_DEF defaults) and per-line / per-card copy buttons (off by default)

**Developer card**

- `apps/developer/index.html` (43 lines, 4.0 KB) — markup of this app; lists its css/js in load order
- `apps/developer/css/01-base.css` (61 lines, 2.5 KB) — base reset
- `apps/developer/css/02-developer-card.css` (65 lines, 8.5 KB) — developer card styles
- `apps/developer/js/01-dev-card.js` (11 lines, 0.8 KB) — developer card logic

**Shell**

- `shell/css/shell.css` (113 lines, 12.1 KB) — loader, switcher, dev overlay styles
- `shell/js/locpicker.js` (201 lines, 34.4 KB) — map / location picker used by every app (LocPicker)
- `shell/js/shell.js` (242 lines, 17.7 KB) — mounts app iframes, loader timing, switcher, dev overlay
- `shell/js/updater.js` (32 lines, 2.4 KB) — silent updater: reads version.json, re-downloads stale cached files when the build changed and reloads once (hosted and installed app; no-op in the single-file build)

**Shared**

- `shared/copy-toggle.js` (27 lines, 2.0 KB) — hides every "Copy ..." button in an app while the main-menu Settings switch "Copy buttons" is off (default off; key vedicCopyBtns); loaded by all 4 apps
- `shared/export-addon.js` (643 lines, 48.1 KB) — export add-on UI used by apps (window.VAX); do not edit unless asked
- `shared/icons.js` (168 lines, 17.5 KB) — ICON LIBRARY: premium duotone line SVG icons that automatically replace UI emojis in every app + shell (MutationObserver, original emoji kept as hidden text). To add/change an icon edit `I` (svg) and `M` (emoji map) in this file. Astro glyphs, arrows, ✓ ✕ are intentionally left as text. Styles in `shared/meta.css`
- `shared/liquid-glass.css` (45 lines, 5.0 KB) — Liquid glass look for the shell and all apps (aurora background, frosted translucent cards, floating glass tab bar); every rule is scoped by `html.lg` + `data-app` (bc/3d/np/dev); no motion
- `shared/liquid-glass.js` (15 lines, 0.9 KB) — turns class `lg` on <html> (on by default; main-menu Settings switch "Liquid glass look", key vedicGlass; off if the device asks for less transparency)
- `shared/meta.css` (97 lines, 5.8 KB) — META LAYER: one global file for feel (smooth transitions, touch press feedback, gold focus/selection/scrollbars, text wrapping, safe areas, reduced motion). Linked LAST by the shell and every app; all rules are `:where()` zero-specificity so app css always wins. Edit this file for any app-wide smoothness/responsiveness change
- `shared/quick-menu.js` (189 lines, 17.3 KB) — Quick Menu: top-left ☰ button in 3D Sky, Birth Chart and Notepad; opens a sheet to jump to any tool or tab, pin favourites and make named groups (localStorage key vedicQuickMenu_v1; tool switching via postMessage {vqm:'go'} handled in shell/js/shell.js); loaded by each app after copy-toggle.js.
- `shared/brand/favicon.ico` (0 lines, 10.7 KB) — website favicon (16, 32, 48)
- `shared/brand/manifest.webmanifest` (1 lines, 0.4 KB) — web app manifest (name, colours, icons) linked from the shell

**Vendor**

- `vendor/qrlibs.js` (12,399 lines, 306.1 KB) — QR code libraries (third party)

**Editions**

- `editions/customer/customer-layer.js` (67 lines, 4.5 KB) — customer edition behaviour layer
- `editions/customer/customer-top.js` (15 lines, 1.5 KB) — customer edition top-of-page code

**Gate**

- `gate/get-app.ts` (57 lines, 3.4 KB) — edge function that serves the locked app
- `gate/index.html` (117 lines, 11.8 KB) — access gate page for the locked edition

## 8. Data kept on the device (storage keys)

Found by scanning the code for `localStorage` / `sessionStorage` calls. Nothing leaves the device unless the owner turns on cloud sync, export or the AI provider.

| Key | Used in |
|---|---|
| `VedicAstrology_lastProfileIdx` | `apps/birth-chart` |
| `VedicAstrology_quickSearch` | `apps/birth-chart` |
| `jn_nvc` | `apps/notepad` |
| `lpLayer` | `shell` |
| `vax3d_beauty` | `apps/sky3d` |
| `vax_active_profile_v1` | `apps/birth-chart` |
| `vax_ayanamsa` | `apps/birth-chart`, `apps/sky3d` |
| `vax_hm_style` | `apps/birth-chart` |
| `vax_live_loc` | `apps/sky3d` |
| `vax_srch_recent` | `apps/birth-chart` |
| `vedic3dClean` | `apps/sky3d` |
| `vedicCopyBtns` | `shell` |
| `vedicGlass` | `shell` |
| `vedicSwPos` | `shell` |
| `vx_ds_gender` | `apps/birth-chart` |
| `vx_ds_sub` | `apps/birth-chart` |

## 9. Every file: path, lines, size, purpose

Sorted by folder. "Purpose" is the one-line description kept in `STRUCTURE.md` (empty = folder-level file listed there as a group).

### `(root)/` — 11 files, 3,877 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `AI_GUIDE.md` | 732 | 111.6 KB | rules + prompt router for AI (partly auto-generated) |
| `CLAUDE.md` | 10 | 1.5 KB | pointer to AI_GUIDE.md and STRUCTURE.md |
| `README.md` | 54 | 4.4 KB | human readme |
| `STRUCTURE.md` | 650 | 82.0 KB | this file |
| `build.py` | 3 | 0.2 KB | shim: runs tools/build.py |
| `index.html` | 1 | 2.7 KB | shell page (one line, on purpose): loading screen, switcher markup, loads shell.js |
| `install-hooks.sh` | 7 | 0.3 KB | installs the git pre-commit hook |
| `symbols.idx` | 2,407 | 155.7 KB | generated symbol -> file:line index (grep only) |
| `vedic-astro-suite-2.html` | 6 | 0.4 KB | redirect stub to index.html (old URL) |
| `vedic-astro-suite-readable.html` | 6 | 0.4 KB | redirect stub to index.html (old URL) |
| `version.json` | 1 | 0.4 KB | GENERATED build id and file list read by shell/js/updater.js (never hand-edit) |

### `apps/birth-chart/` — 2 files, 51,013 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `index.bundle.html` | 50,335 | 3.56 MB | GENERATED by build.py (do not edit): this app with every css/js inlined, what the shell loads (1 request instead of ~260) |
| `index.html` | 678 | 39.0 KB | markup of this app; lists its css/js in load order |

### `apps/birth-chart/css/` — 88 files, 6,367 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `01-premium-tokens-reset.css` | 84 | 2.8 KB | design tokens (colors, fonts) and reset |
| `02-header.css` | 54 | 3.1 KB | header |
| `03-hero-intake-form.css` | 77 | 4.5 KB | hero and birth intake form |
| `04-app-tab-navigation.css` | 49 | 2.5 KB | tab navigation |
| `05-results-sections.css` | 969 | 59.6 KB | result sections, cards, tables, loading overlay |
| `06-quick-search.css` | 60 | 3.7 KB | quick search |
| `07-ai-jyotish-chatbot.css` | 296 | 13.3 KB | AI Jyotish chat styles |
| `08-responsive.css` | 70 | 3.5 KB | responsive / mobile rules |
| `09-home-launcher.css` | 34 | 2.8 KB | home launcher grid |
| `10-dasha-redesign.css` | 70 | 5.9 KB | dasha panel |
| `11-yogas-shadbala-redesign.css` | 73 | 6.9 KB | yogas + shadbala panels |
| `12-export-and-profiles.css` | 45 | 4.3 KB | export modal + profiles |
| `13-ui-polish-layer.css` | 30 | 3.6 KB | polish layer (glass, motion) |
| `14-share-qr.css` | 38 | 4.1 KB | share / QR UI |
| `15-search-ui.css` | 51 | 5.0 KB | search UI |
| `16-cloud-account-ui.css` | 34 | 5.1 KB | cloud account UI |
| `17-my-chart-redesign.css` | 62 | 6.4 KB | My Chart panel |
| `18-intake-redesign.css` | 52 | 4.7 KB | intake form redesign |
| `19-planets-popup-redesign.css` | 74 | 7.2 KB | planets panel + popup |
| `20-meta-layer.css` | 33 | 3.1 KB | meta layer (errors, modals) |
| `21-panchanga-transits-bhava.css` | 71 | 8.0 KB | Panchanga, Transits, Bhava panels |
| `22-kundali-matching.css` | 78 | 9.5 KB | Kundali matching |
| `23-vedic-birthday.css` | 58 | 6.8 KB | Vedic birthday |
| `24-dasha-navigator.css` | 31 | 4.0 KB | dasha navigator |
| `25-vedic-birthday-hero.css` | 96 | 12.8 KB | Vedic birthday hero |
| `26-developer-card.css` | 58 | 7.6 KB | developer card |
| `27-d-chart-explorer.css` | 99 | 11.3 KB | D-chart explorer |
| `28-drishti-explorer.css` | 30 | 3.1 KB | Drishti explorer |
| `29-special-lagnas.css` | 62 | 9.2 KB | special lagnas |
| `30-ashtakavarga.css` | 98 | 16.3 KB | ashtakavarga |
| `31-rectification-studio.css` | 182 | 19.8 KB | Rectification Studio |
| `32-date-finder.css` | 59 | 7.2 KB | Date Finder |
| `33-friendly-input-page.css` | 46 | 4.9 KB | friendly input page |
| `34-smart-search.css` | 29 | 3.5 KB | Smart Search |
| `35-dasha-systems.css` | 95 | 8.4 KB | 36 Dasha Systems panel styles (`ds-*`) |
| `36-ui-overhaul.css` | 125 | 11.6 KB | UI overhaul: clean full-screen input page, search-first header, segmented tile Home, profile sheet |
| `37-d-chart-overview.css` | 75 | 6.1 KB | Divisional charts "At a glance" dashboard (hero, planet table, 12-house grid, balance bars, highlights) |
| `38-popular-charts.css` | 34 | 4.4 KB | Popular charts section + detail sheet styles |
| `39-deep-reading.css` | 46 | 5.6 KB | Deep reading lines (dr-l) and small text in notes/cards |
| `40-pdf-studio.css` | 3 | 0.5 KB | notice shown while the PDF is prepared |
| `40-year-timeline.css` | 7 | 0.6 KB | Year Timeline File panel styles |
| `41-dasha-time-finder.css` | 62 | 5.4 KB | Dasha Time Finder styles |
| `42-life-event-pro.css` | 192 | 22.5 KB | styles for the Life-Event picker, evidence meter and confidence hero |
| `43-house-now.css` | 7 | 1.8 KB | styles for the Right now tab (area bars, house chips, today's sky, house cards) |
| `44-dasha-lens.css` | 123 | 15.2 KB | Dasha Lens (studio tab) and the 'Show in the 3D wheel' buttons |
| `44-reading-style.css` | 46 | 6.0 KB | Chart Reading look: big headlines, hero, hooks, house cards, progress bar, explored dots and next-up buttons |
| `45-shadbala-reading.css` | 10 | 2.6 KB | styles for the Strength tab (bars with a 100% line, the six strengths, planet cards; classes use the sbr- prefix because sb- belongs to the older Shadbala screen) |
| `46-ashtakavarga-reading.css` | 9 | 2.4 KB | styles for the Ashtakavarga tab (avr- prefix; av- and avx- belong to older screens) |
| `47-pdf-download.css` | 6 | 1.1 KB | progress card for the PDF download (pdfd- prefix) |
| `48-reading-polish.css` | 83 | 8.4 KB | READING POLISH, loaded last: one calm premium look for every Chart Reading tab (underline tabs, one 880px column, serif headings with thin gold rules, quiet cards and callouts, fewer emoji, footnote disclaimer, smooth motion); scoped to .rd |
| `49-intake-polish.css` | 101 | 12.8 KB | INTAKE POLISH, loaded last: the birth-details page (glowing emblem, starfield, glass card, three-step timeline that fills as you go, gold focus glow, segmented AM/PM, shimmering action button, staggered entrance); scoped to .in-wrap |
| `50-home-polish.css` | 51 | 7.5 KB | HOME POLISH, loaded last: the tool hub on the Home tab (filter chips, Quick start tiles, tool cards with tinted glass, glowing icon tiles, arrow badges, staggered entrance and scroll reveal); scoped to #panel-home |
| `51-problem-finder.css` | 65 | 9.2 KB | Problem finder screens (pf- prefix) |
| `52-date-entry.css` | 12 | 1.5 KB | the typed-date panel on the birth-details page |
| `53-varga-guide.css` | 31 | 2.7 KB | styles for the divisional chart guide (vgg- prefix) |
| `54-compare-lab.css` | 62 | 7.9 KB | styles for the Compare Lab (cl- prefix) |
| `55-planet-encyclopedia.css` | 88 | 8.0 KB | styles for the Planet Encyclopedia panel (pen- prefix) |
| `56-choghadiya-avakahada.css` | 63 | 7.2 KB | styles for Choghadiya and Avakahada Chakra |
| `57-prashna.css` | 21 | 2.0 KB | styles for the Prashna chart panel |
| `58-ayanamsa-choice.css` | 6 | 0.7 KB | styles for the ayanamsa selector |
| `59-kp-system.css` | 19 | 1.9 KB | styles for the KP system panel |
| `60-home-chart-first.css` | 30 | 4.2 KB | Home in two screens: chart first (hero chart, details hidden), then All tools (data-page switch, tinted tool panels) |
| `61-dasha-reverse.css` | 39 | 4.9 KB | styles for the Dasha Reverse tab |
| `62-time-sky-panel.css` | 19 | 2.1 KB | styles for the time sky panel |
| `63-meaning-lab.css` | 20 | 2.9 KB | styles for the Meaning Lab |
| `64-trigger-lab.css` | 26 | 4.0 KB | styles for the Trigger Lab |
| `65-profile-menu.css` | 29 | 3.5 KB | Profile menu redesign: profile register entries that fit the screen, labeled Share/Edit/Delete row |
| `66-feature-polish.css` | 120 | 12.3 KB | shared refined look for Dasha Reverse, Time sky, Meaning Lab, Trigger Lab (fields, panels, chains, reveal) |
| `67-astro-atlas.css` | 159 | 23.6 KB | Astro Atlas look (tabs, week wheel, body figure, house chart, nakshatra groups) |
| `67-chakra-explorer.css` | 140 | 13.9 KB | styles for the Chakra Explorer (chx- prefix) |
| `68-avasthas.css` | 27 | 2.3 KB | styles for Planet States (`avs-` prefix) |
| `69-vimshopaka.css` | 30 | 2.9 KB | styles for Vimshopaka Bala (`vim-` prefix) |
| `70-upagrahas.css` | 19 | 1.4 KB | styles for Upagrahas (`upa-` prefix) |
| `71-sensitive-degrees.css` | 24 | 1.8 KB | styles for Sensitive Degrees (`sdg-` prefix) |
| `72-sudarshana.css` | 37 | 3.4 KB | styles for Sudarshana Chakra (`sdc-` prefix) |
| `73-argala.css` | 24 | 2.3 KB | styles for Argala (`arg-` prefix) |
| `74-bhavat-bhavam.css` | 21 | 1.7 KB | styles for House from the House (`bbh-` prefix) |
| `75-ashtakavarga-extras.css` | 58 | 5.0 KB | styles for Ashtakavarga Workings (`asx-` prefix) |
| `76-synastry.css` | 28 | 2.4 KB | styles for Synastry (`syn-` prefix) |
| `77-panchang-calendar.css` | 36 | 3.2 KB | styles for the Panchang Calendar (`pcal-` prefix) |
| `78-tools-hub.css` | 34 | 3.6 KB | styles for the Tools hub (`th-` prefix) and the six-tab bottom bar |
| `79-export-builder.css` | 52 | 6.2 KB | styles for the Export builder (`exb-` prefix) |
| `80-feature-guide.css` | 45 | 5.9 KB | styles for the Feature Guide (`fg-` prefix) |
| `81-bhavat-masterclass.css` | 203 | 18.7 KB | styles for the Masterclass (`bmc-` prefix) |
| `82-varga-matrix.css` | 85 | 8.9 KB | styles for the Varga Matrix (`vmx-` and `vx-` prefixes) |
| `84-past-present-future.css` | 128 | 11.4 KB | styles for the Past · Present · Future panel (`ppf-` prefix) |
| `85-hora.css` | 174 | 16.6 KB | styles for the Hora panel (`hr-` prefix) |
| `86-ai.css` | 66 | 11.0 KB | styles for the AI Astrologer panel (`aix-` prefix) |

### `apps/birth-chart/js/` — 165 files, 29,535 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `01-dev-contact.js` | 6 | 0.5 KB | developer contact details used by the dev card |
| `02-app-meta-layer.js` | 73 | 4.4 KB | app-wide meta layer: version, feature flags, global helpers |
| `03-ephemeris-engine.js` | 287 | 14.6 KB | ephemeris math: Sun/Moon/planets, ayanamsa, Julian day |
| `04-transit-timing-engine.js` | 246 | 11.0 KB | finds exact transit / ingress timings |
| `05-ascendant-nakshatra-vargas.js` | 210 | 12.6 KB | ascendant, nakshatra/pada, divisional (varga) calculation incl. outer planets |
| `06-outer-planet-knowledge.js` | 36 | 5.3 KB | text knowledge for Uranus/Neptune/Pluto |
| `07-planetary-dignity.js` | 76 | 3.2 KB | exaltation, debilitation, own sign, dignity tables |
| `08-combustion-and-war.js` | 29 | 1.2 KB | combustion and planetary war rules |
| `09-aspect-events.js` | 68 | 2.6 KB | aspect (drishti) events between planets |
| `10-vimshottari-dasha-engine.js` | 98 | 4.5 KB | Vimshottari dasha engine (5 levels) |
| `100-house-now.js` | 299 | 21.3 KB | GENERATED "Right now" reading (HNW): 12 houses x 9 emoji sections from sign, lord, natal planets, today's transits, aspects, nakshatras and Mahadasha/Antardasha/Pratyantar |
| `101-house-now-ui.js` | 60 | 8.5 KB | Right now screens: first tab of Chart Reading, report text and the PDF section |
| `102-planet-states.js` | 450 | 47.4 KB | GENERATED planet states (PST): every state of a planet (exalted, own, friend, neutral, enemy, debilitated with cancellation check, retrograde, combust, vargottama, navamsa, house) with everyday examples |
| `103-planet-states-ui.js` | 26 | 3.4 KB | adds the PST blocks to the Planets tab cards, the report text and the PDF planet pages |
| `104-reading-style.js` | 41 | 3.9 KB | Chart Reading helpers: bold hook sentence, scroll progress, explored dots with ticks, next-up buttons |
| `105-shadbala-reading.js` | 453 | 36.7 KB | GENERATED Shadbala reading (SBR): all six strengths and every component (Uchcha, Saptavargaja, Ojayugma, Kendradi, Drekkana, Dig, Nathonnata, Paksha, Tribhaga, Varsha-Masa-Dina-Hora, Ayana, Cheshta, Naisargika, Drik, Ishta/Kashta) explained and read per planet |
| `106-shadbala-ui.js` | 42 | 5.1 KB | the Strength tab of Chart Reading, the report text and the PDF Shadbala pages |
| `107-ashtakavarga-reading.js` | 323 | 26.6 KB | GENERATED Ashtakavarga reading (AVR): combined house map and life axes, then each planet (overview, best, thin, balance, home, today) and that planet's points in each of the 12 houses |
| `108-ashtakavarga-ui.js` | 49 | 6.8 KB | Ashtakavarga tab, PDF plates and report text (AVRUI) |
| `109-pdf-download.js` | 144 | 10.0 KB | PDF DOWNLOAD (PDFD): turns the PDF book straight into a .pdf file with no print window (hidden A4 frame, page cuts at block ends, browser-drawn pages as JPEG, built-in PDF writer); PDFR falls back to print if it fails |
| `11-ashtakavarga-engine.js` | 31 | 2.3 KB | Ashtakavarga bindu engine |
| `111-problem-finder.js` | 405 | 85.5 KB | PROBLEM FINDER engine (PRB): areas of life, exact problems, trigger (outside/inside) and how it shows up (inner pain/real events); reads the chart and returns the reasons (houses, lords, planets, aspects, Ashtakavarga, running periods, today's sky); every line carries the chart fact it came from |
| `112-problem-finder-ui.js` | 76 | 11.0 KB | Problem finder tab (PFUI): the five questions, the result screens, Home tile hook |
| `113-date-entry.js` | 85 | 7.5 KB | type Day, Month, Year and AD/BC yourself (old and BC dates); inDobValue / inLoadDob; Julian calendar before 15 Oct 1582, accuracy notes, local-mean-time button |
| `114-varga-guide.js` | 521 | 113.3 KB | How to read each divisional chart (global VGG): for all 24 charts (D1 to D144 + RTN) what it is, how the app divides it, houses, step-by-step reading, rules marked "From the texts" or "Common practice", planets to check, strength, timing, cautions; shown as a collapsible guide under every D-chart |
| `115-compare-lab.js` | 223 | 16.3 KB | Compare Lab experiment (global CMPLAB): full-screen canvas in Divisional Charts to compare up to 4 charts (D1 vs D9, any vs any); three-dot menu, follow a planet across charts, planet-by-chart table, plain-language notes, copy as text |
| `116-planet-encyclopedia.js` | 349 | 42.9 KB | Planet Encyclopedia (global PEN, panel-planetency, Home > Analysis): one page per graha with tabs Nature, Aspects, Strength (all dignities + 12 signs), Friends & foes, Houses, Your chart; hand-written PEN_DATA + VDB texts |
| `117-gulika.js` | 33 | 3.1 KB | Gulika (Mandi) point (computeGulika, global GUL): day/night parts of Saturn, rising degree at that moment; stored in chart.upagraha and every varga (outerSign.Gulika) |
| `118-choghadiya.js` | 64 | 6.2 KB | Choghadiya (global CHG): 8 day + 8 night slots by weekday, shown inside the Panchanga panel |
| `119-avakahada.js` | 57 | 6.5 KB | Avakahada Chakra (global AVK, panel-avakahada, Home > Your Chart): varna, vashya, yoni, gana, nadi, paya, name sounds, tithi/karana/yoga |
| `12-yoga-detection.js` | 116 | 5.0 KB | yoga detection rules |
| `120-late-panels.js` | 38 | 3.9 KB | safety net: panels registered here (Avakahada, Planet Encyclopedia, Choghadiya, Dosha) are built on first open if js/58 did not add them; also puts Choghadiya into the Panchanga panel |
| `121-dosha.js` | 64 | 7.6 KB | Dosha Check (global DSH, panel-dosha, Home > Analysis): Manglik, Kaal Sarp, Pitru, Gand Mool, Guru Chandala, Grahan, Shrapit, Angaraka with the reason and what softens it |
| `122-today-for-you.js` | 70 | 9.7 KB | Today for You (global TDY, panel-today, Home > Time & Cycles): Chandrabala, Tarabala, Gochara from the birth Moon, good Choghadiya slots vs Rahu Kalam, any date |
| `123-prashna.js` | 132 | 13.3 KB | Prashna (horary) chart (global PRN, panel-prashna, Home > Time & Cycles): chart cast for a question moment, topic→house, lagna lord / matter lord strength, Ithasala/Easarapha (Tajika orbs), Moon checks, North/South chart, copy reading |
| `124-ayanamsa-choice.js` | 28 | 2.4 KB | ayanamsa selector on the intake form (Lahiri default, Raman, KP); saves choice, re-draws chart. Engine offsets live in js/03 and sky3d js/01 (AYAN_MODES, ayanKey, ayanName) |
| `125-kp-system.js` | 106 | 11.8 KB | KP system (global KP, panel-kp, Home > Analysis): Placidus cusps, star/sub/sub-sub lords, planet and house significators, cusp sub-lord promise checks, ruling planets, KP-ayanamsa button |
| `126-dasha-reverse-finder.js` | 178 | 15.4 KB | Dasha Reverse (Rectify tab `drev`): pick Maha..Deha planets active at a known moment, finds the birth-time windows of the birth day (interpolated Moon, engine reuse) |
| `127-time-sky-panel.js` | 82 | 7.1 KB | Time sky panel (Time Dial card + Dasha Reverse per-window): Dasha chain at birth/custom/today, rising sign + D9 boundaries in a 2-hour window |
| `128-meaning-lab.js` | 133 | 11.2 KB | Meaning Lab (Home > Analysis + left quick menu): free mix of planet/house/sign/lord/nakshatra/dasha pieces, raw meanings from VDB, optional database links, own notes saved locally |
| `129-trigger-lab.js` | 193 | 17.6 KB | Trigger Lab (Home > Analysis + left quick menu): Single/Double Dasha-repeat pattern + sign / lord's-sign / aspect / nakshatra transit rules, raw activated houses |
| `13-chara-karakas.js` | 23 | 1.1 KB | Jaimini chara karakas |
| `130-astro-atlas-data.js` | 135 | 20.4 KB | Astro Atlas reference data (global ATLAS) |
| `130-chakra-explorer.js` | 440 | 44.6 KB | Chakra Explorer (global CHX, panel-chakra, Home > Time & Cycles): Sarvatobhadra Chakra (9x9 grid, vedha rays by planet motion, five natal pillars + optional Naam Akshara, Latta kicks), Kota Chakra (28-nakshatra fort, IN/OUT/STALL, Kota Swami/Paala) and Shoola/Trishula Chakra (9th/15th/21st points); opens on today's sky with minute-to-year time controls; registered through registerLatePanel |
| `131-astro-atlas.js` | 184 | 24.6 KB | Astro Atlas panel UI (panel-atlas): Week, Planets, Signs, Body, Houses, Stars, Time, Rules, Charts |
| `132-astro-atlas-more.js` | 144 | 20.6 KB | Astro Atlas extra data (global ATLAS_MORE: yogas, remedies, planet in house, ashtakoota, muhurta, glossary) |
| `133-astro-atlas-more.js` | 91 | 8.9 KB | Astro Atlas extra tabs: Yogas, Remedies, Placements, Match, Muhurta, Learn (adds itself via window.ATL_UI) |
| `134-avasthas.js` | 147 | 9.9 KB | Planet States (avasthas, global `AVS`): Baladi / Jagradadi / Deeptadi for the seven grahas from BPHS ch.45, panel-avasthas, `AVS.compute/html/text` |
| `135-vimshopaka.js` | 86 | 7.7 KB | Vimshopaka Bala (global `VIM`): 0-20 strength per graha from Shad/Sapta/Dasha/Shodasha-varga (BPHS ch.7), panel-vimshopaka, `VIM.compute/html/text` |
| `136-upagrahas.js` | 47 | 4.6 KB | Upagrahas (global `UPA`): Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu from the Sun plus Gulika, panel-upagrahas, `UPA.compute/fromSun/html/text` |
| `137-sensitive-degrees.js` | 83 | 8.5 KB | Sensitive Degrees (global `SDG`): Gandanta, Mrityu Bhaga (Jataka Parijata table, Moon in two traditions), Pushkara Navamsa and Pushkara Bhaga for 9 grahas + Lagna, panel-sensitive |
| `138-sudarshana.js` | 107 | 10.9 KB | Sudarshana Chakra (global `SDC`): three 12-house rings from Lagna, Moon, Sun, year-of-life house, benefic/malefic counts, SVG drawing, panel-sudarshana |
| `139-argala.js` | 78 | 7.6 KB | Argala and Virodhargala (global `ARG`): for each house who intervenes (2nd/4th/11th, special 5th) and who obstructs (12th/10th/3rd, 9th), count rule, Ketu reversal, panel-argala |
| `14-shadbala-engine.js` | 278 | 12.4 KB | Shadbala six-fold strength engine |
| `140-bhavat-bhavam.js` | 44 | 5.9 KB | Bhavat Bhavam (Nth from the Nth house) and all twelve Arudha Padas incl. the missing A7 Dara Pada (global `BBH`), panel-bhavat |
| `141-ashtakavarga-extras.js` | 144 | 16.9 KB | Ashtakavarga Workings (global `ASX`): Prastara, Sodhana + pindas, Kakshya and Transit tabs (A8a-d); panel-asx |
| `142-gochara-vedha.js` | 47 | 3.2 KB | Gochara vedha pair tables and check (global `GVD`); used by Today for You to mark a favourable planet as held back |
| `143-synastry.js` | 134 | 12.2 KB | Synastry (global `SYN`): two charts side by side, planets in each other's houses, contacts, Moon relation, Lagna lords, Ashtakoota both orders; panel-synastry |
| `146-panchang-calendar.js` | 168 | 15.3 KB | Panchang Calendar (global `PCAL`): month grid of tithi, nakshatra, Ekadashi, Purnima, Amavasya, Sankranti, festivals and eclipses, built on the Date Finder engine (js/27-28); panel-pcal |
| `147-tools-hub.js` | 116 | 12.0 KB | Tools hub (global `THB`): bottom-bar "Tools" tab listing every HOME_ITEMS tool in 9 groups by use, with search, group chips and Recently used; panel-tools |
| `148-export-builder.js` | 275 | 27.2 KB | Export builder (global `EXB`): the Export tab as a structured screen (presets, output type, split into parts, grouped sections with sizes, live totals, Copy / Download); replaces the old pop-up; panel-export |
| `149-feature-guide-data.js` | 328 | 44.6 KB | Feature Guide data (`FG_DATA`): what / when / steps / key words / tip for every tool and the six tabs |
| `15-chart-core-compute.js` | 160 | 7.7 KB | computeChart: main chart calculation (planets, houses, sunrise) |
| `150-feature-guide.js` | 72 | 7.3 KB | Feature Guide screen (`FG`): searchable accordion cards, group chips, Open-this-tool buttons; panel-guide |
| `151-bhavat-masterclass-data.js` | 98 | 13.0 KB | Bhavat Bhavam Masterclass teaching data (global `BMD`): 12 pairs, sourced X-from-Y examples, reading recipes by question, rules tagged S/M/C, where teachers differ, steps, mistakes, source URLs |
| `152-bhavat-masterclass.js` | 227 | 27.7 KB | Bhavat Bhavam Masterclass engine and panel (global `BMC`): derived-house formula, any house from any house, twelve hats, Support score per house, agreement of the two layers, dasha timing check; panel-bhavatclass (tabs My chart, Explorer, Recipes, Learn) |
| `153-varga-matrix.js` | 107 | 11.2 KB | Varga Matrix engine and panel (global `VMX`): all nine planets across D1 to D144 in one colour-coded grid (sets Sapta 7, Shodasha 16, All), dignity points, Vargottama list, strongest and weakest planets, tap detail; panel-vargamatrix |
| `155-past-present-future.js` | 198 | 21.1 KB | Past · Present · Future panel (global `PPF`, `panel-ppf`): directional + chart (houses in four groups 1·5·9, 2·6·10, 3·7·11, 4·8·12; arm of the chosen planet = You, next clockwise = Future, opposite = Present, behind = Past), life river of Mahadashas (faded past, NOW needle), ten-years-back/ahead ease bars of Antardashas, Past / Present / Future tabs (period cards with sub-period strip, running clocks with progress, houses lit now, next 5 years); reads VDA (js/91) and the dasha engine only |
| `156-hora-engine.js` | 100 | 9.6 KB | Hora (planetary hours) engine (global `HORA`): 24 unequal horas per Vedic day (12 day = day length / 12, 12 night = night length / 12) in Chaldean order from the weekday lord, overlaps with Rahu Kalam / Yamaganda / Gulika, Choghadiya at the midpoint, 14-activity table, teaching-aid score with reasons, best-times search, week, chart link (`forYou`); reuses panchangaAt, CHG, VDB, VDA only |
| `157-hora-panel.js` | 293 | 38.3 KB | Hora panel (global `HORAUI`, `panel-hora`, Home > Time & Cycles + Tools): custom place (city search via Nominatim, current location, birth place, manual lat/lon/time zone, saved in localStorage `hora_place_v1`), tabs Now (live countdown ring, next 3, whole-day ribbon, hora planet in your chart), Moment (any date + time: hora, progress, before/after, full day of 24 horas, birth moment button), Today (24 horas for any date, score for any activity, copy as text), Week (7 x 24 colour grid, glow by activity), Best (best and worst horas for 14 activities over 24 h / 3 / 7 days with reasons), Learn (how horas are made, order, planets, scoring, where teachers differ); reads HORA (js/156) only |
| `158-ai-index.js` | 86 | 12.8 KB | `AIX`: the ONE index/registry of every chart variable the AI can read (`catalogue()` for the model, `get(id)` on demand, `raw:<path>` for any field) |
| `159-ai-engine.js` | 212 | 24.2 KB | `AIS` (local store: providers+keys, personas, skills, settings, import/export) and `AIE` (provider calls for OpenAI-compatible/Anthropic/Gemini/custom; route → fetch → answer flow) |
| `16-rectification-engine.js` | 35 | 2.0 KB | birth-time rectification scoring engine |
| `160-ai-panel.js` | 171 | 28.0 KB | `AIUI` AI Astrologer panel (`panel-ai`): Chat, Variables, Persona, Skills, Settings tabs |
| `17-special-lagnas.js` | 403 | 23.6 KB | special lagnas and arudha padas |
| `18-ui-location-profiles.js` | 123 | 5.6 KB | location field + saved profiles UI |
| `19-planets-panel.js` | 235 | 17.2 KB | Planets panel and planet detail popup |
| `20-rectification-scan-tab.js` | 301 | 15.1 KB | rectification scan tab |
| `21-transit-timer-tab.js` | 100 | 4.9 KB | transit timer tab |
| `22-sandhi-table-tab.js` | 68 | 3.0 KB | sandhi (sign-edge) table tab |
| `23-varga-timeline-tab.js` | 78 | 3.8 KB | varga timeline tab |
| `24-profile-backup.js` | 79 | 4.1 KB | backup / restore of saved profiles |
| `25-home-and-tabs.js` | 176 | 19.7 KB | home dashboard (HOME_ITEMS), tab bar, switchAppTab |
| `26-rectification-studio.js` | 249 | 14.8 KB | Rectification Studio UI |
| `27-date-finder-core.js` | 49 | 3.4 KB | Date Finder: clues data, festivals, eclipse helpers |
| `28-date-finder-engine.js` | 185 | 11.9 KB | Date Finder search engine (dfGen) |
| `29-date-finder-ui.js` | 190 | 18.1 KB | Date Finder screen |
| `30-life-event-checker.js` | 159 | 10.4 KB | life-event checker against dashas/transits |
| `31-smart-search.js` | 189 | 16.3 KB | Smart Search (find any feature by typing) |
| `32-ask-ai.js` | 316 | 39.5 KB | Ask-AI: question boxes opening Google AI mode |
| `33-quick-search.js` | 98 | 4.3 KB | quick search bar |
| `34-relationships-tab.js` | 210 | 8.2 KB | relationships tab |
| `35-form-submit-compute-render.js` | 54 | 2.2 KB | birth form submit -> compute -> render pipeline |
| `36-render-helpers.js` | 42 | 2.9 KB | shared render helpers (tables, chips, cards) |
| `37-dasha-check-date.js` | 29 | 1.9 KB | check any date/time in all 5 dasha levels |
| `38-dasha-navigator.js` | 187 | 13.4 KB | drill-down dasha navigator |
| `39-yogas.js` | 66 | 5.0 KB | Yogas panel |
| `40-shadbala.js` | 54 | 4.0 KB | Shadbala panel |
| `41-ashtakavarga-section.js` | 34 | 5.7 KB | Ashtakavarga panel |
| `42-relationships-section.js` | 20 | 1.2 KB | relationships section content |
| `43-full-report-text.js` | 267 | 14.7 KB | buildFullReportText: full text report / Copy for AI |
| `44-export-modal.js` | 203 | 10.1 KB | export modal (copy, JSON, download) |
| `45-panchanga-engine.js` | 106 | 7.6 KB | Panchanga engine (tithi, nakshatra, yoga, karana, vara) |
| `46-transit-stays-engine.js` | 42 | 2.3 KB | sign-stay timeline, Sade Sati and Dhaiya |
| `47-bhava-chalit-engine.js` | 28 | 1.8 KB | Bhava Chalit (Sripati) engine |
| `48-panchanga-panel.js` | 95 | 7.7 KB | Panchanga panel |
| `49-transits-panel.js` | 77 | 7.8 KB | Transits and Sade Sati panel |
| `50-bhava-chalit-panel.js` | 29 | 3.0 KB | Bhava Chalit panel |
| `51-kundali-matching-engine.js` | 93 | 7.5 KB | Kundali matching (Ashtakoota) engine |
| `52-kundali-matching-ui.js` | 179 | 16.2 KB | Kundali matching screen |
| `53-vedic-birthday-engine.js` | 75 | 4.1 KB | Vedic (tithi) birthday engine |
| `54-vedic-birthday-ui.js` | 155 | 13.3 KB | Vedic birthday screen |
| `55-numerology-engine.js` | 53 | 9.5 KB | numerology engine |
| `56-numerology-ui.js` | 125 | 13.3 KB | numerology screen |
| `57-my-chart-overview.js` | 99 | 6.1 KB | My Chart / Overview panel |
| `58-render-results.js` | 760 | 35.5 KB | renderResults: builds all result panels |
| `59-live-transit-form.js` | 149 | 7.4 KB | live transit form (computeLiveSky) |
| `60-interactive-varga-svg.js` | 162 | 7.2 KB | interactive D-chart explorer |
| `61-varga-chart-svg.js` | 70 | 13.4 KB | North/South/West chart SVG drawing |
| `62-clipboard-download-helpers.js` | 120 | 4.6 KB | clipboard copy and file download helpers |
| `63-profile-cards.js` | 37 | 3.0 KB | saved profile cards in the menu |
| `64-edit-saved-profile.js` | 31 | 2.2 KB | edit a saved profile name/date/time |
| `65-error-boundaries.js` | 31 | 1.7 KB | error boundaries around every panel builder |
| `66-modal-accessibility.js` | 22 | 1.3 KB | keyboard, scroll-lock and a11y for modals |
| `67-friendly-input-page.js` | 106 | 9.6 KB | friendly input page (dropdown date/time, guesses) |
| `68-intake-progress.js` | 64 | 3.6 KB | intake progress and welcome-back chips |
| `69-divisional-areas.js` | 139 | 23.9 KB | divisional chart area helpers |
| `70-chart-reading.js` | 75 | 17.2 KB | plain-language chart reading engine |
| `71-life-activation.js` | 49 | 9.6 KB | Life Activation: houses lit on any date |
| `72-bhava-bala.js` | 46 | 7.8 KB | Bhava Bala house strength |
| `73-tithi-pravesh.js` | 63 | 15.6 KB | Tithi Pravesh yearly chart |
| `74-sahams.js` | 66 | 15.6 KB | Sahams (36 Tajika sensitive points) |
| `75-fate-meter.js` | 75 | 21.0 KB | Fate Meter |
| `76-share-link-qr.js` | 128 | 10.2 KB | share chart by link / QR (data in URL hash) |
| `77-cloud-account.js` | 141 | 14.6 KB | cloud sign-in and profile sync (Supabase REST) |
| `78-dasha-systems-core.js` | 243 | 11.1 KB | 36 Dasha Systems: helpers (sign strength, rashi drishti, padakrama, durations), registry `DashaSys.register`, layout engine (`compute`, `children`, `active`) |
| `79-dasha-systems-nakshatra.js` | 149 | 9.0 KB | 36 Dasha Systems: 12 nakshatra systems (Vimshottari, Ashtottari, Kala Chakra, Yogini + 8 conditional: Shodasottari, Shattrimsa Sama, Dwadasottari, Dwisaptati Sama, Sataabdika, Chaturaseeti Sama, Shashtihayani, Panchottari) |
| `80-dasha-systems-rasi.js` | 148 | 8.8 KB | 36 Dasha Systems: 14 phalita rasi systems (Chara Parasara/K.N. Rao/Iranganti 1 & 2, Narayana, Sudasa, Drig, Trikona, Lagnamsaka, Yogardha, Kendradi, Padanadhamsa, Paryaya, Moola) |
| `81-dasha-systems-ayur-special.js` | 145 | 7.0 KB | 36 Dasha Systems: 5 Ayur (Sthira, Shoola, Niryana Shoola, Mandooka, Brahma) + 5 Special (Varnada, Navamsa, Sandhya, Chakra, Tara Lagna) |
| `82-dasha-systems-ui.js` | 199 | 14.1 KB | 36 Dasha Systems panel `buildDashaSystemsPanel` (7 groups → side-by-side compare of each group's systems → per-system running-now ladder + level-by-level drill-down with start/end of every period; gender + sub-period toggles; conditional dashas sorted by whether the chart qualifies) |
| `83-ui-overhaul.js` | 67 | 5.1 KB | UI overhaul glue: floating profile button (input page), search pill label, avatar initial, profile sheet hero (rising/moon/sun/star) |
| `84-bridge-3d.js` | 44 | 2.8 KB | "View this chart in 3D" button: stores the open chart (all vargas) under `vax_bridge_3d` and asks the shell to open 3D Sky |
| `85-popular-charts-data.js` | 115 | 26.2 KB | Popular charts data: 100 public figures (10 groups x 10), birth date/place/tz, Lahiri Sun/Moon/nakshatra/rising, Wikipedia titles; add a person = append a row |
| `86-popular-charts.js` | 119 | 7.8 KB | Popular charts UI under the 3-step form on the input page: group chips, photo cards (Wikipedia, lazy), detail sheet, "Show this chart" casts it via loadProfileIntoForm + submit |
| `87-vedic-knowledge-db.js` | 2,268 | 202.6 KB | Vedic Knowledge Database (VDB): 625 entries — planet-in-house 108, planet-in-sign 108, house-lord-in-house 144, planet-aspect-on-house 108, planet-aspects-planet 72, conjunctions 35, 27 nakshatras, 23 yogas, dasha lords, status modifiers, functional nature by rising sign; lookup API + `VDB.reading(chart)` |
| `88-deep-reading.js` | 261 | 31.6 KB | Deep reading (window.VDR): the "📖 Deep reading" tab (rising, Moon, functional nature, conjunctions, 12 house cards), extra block in each Planets-tab card, dasha-lord text in the Now tab, and the DEEP READING section of the full report; all text from VDB |
| `89-vedic-nakshatra-db.js` | 1,186 | 38.7 KB | Nakshatra layer (global VNK), layer schema v1: structured facets for 27 nakshatras + 9 planets, composes 972 planet placements + Lagna + Moon birth star on demand (relation to nakshatra lord, pada -> navamsa -> Purushartha, scores, tags); used by Deep reading |
| `90-reading-manifest.js` | 526 | 26.7 KB | Manifestation layer (global VMF), schema v1.1: planet (what you do) x house (arena scenes) x sign (manner) for 1296 combinations in second person with self-check questions; 12 rising-sign profiles; Lagna-lord arc; `signature(chart)` = personal summary; used by Deep reading |
| `90-year-timeline-engine.js` | 264 | 15.6 KB | Year Timeline scanner (global YT): date range -> sign/nakshatra changes, stations, transit contacts with natal points, lunations/eclipses, dasha changes (3 levels), Sade Sati edges, Jupiter+Saturn house segments; facts only |
| `91-dasha-reading.js` | 273 | 14.5 KB | Dasha layer (global VDA), schema v1.1: life timeline (every Mahadasha: theme, arena, ruled houses, real-life lines, tone with reasons, self-check), 9 Antardashas each, next-5-years rows, 81 main x sub blends; dates/lords from the app's dasha engine; used by Deep reading and the report |
| `91-year-timeline-writer.js` | 189 | 18.1 KB | Year Timeline writer (global YTW): turns scan result into one structured Markdown file for an AI (planet role map, house map, dasha table, event list) |
| `92-year-timeline-ui.js` | 56 | 4.5 KB | "Year Timeline File" panel (panel-yeartimeline): two dates, options, Copy / Download .md |
| `92-yoga-engine.js` | 1,378 | 63.8 KB | Yoga engine (global YGE), schema v1.1, GENERATED: 41 yogas with exact detectors (Moon, Sun, combinations, wealth, exchanges, reversals, status, Pancha Mahapurusha, surrounding, cautions); each shows the rule it matched plus real-life text |
| `93-dasha-time-finder.js` | 162 | 10.8 KB | Dasha Time Finder: five cards (Mahadasha to Prana) showing exact start/end date and time of the chosen period; uses the existing dasha engine only |
| `93-pdf-report.js` | 404 | 57.2 KB | PDF book (global PDFR): one click builds a self-contained printable HTML book (cover with zodiac wheel, contents, nine parts with full-page dividers, sections, plates, inline SVG charts) and opens the print window; `PDFR.reg` registers section builders. Hand-written, no libraries. |
| `94-life-areas.js` | 415 | 16.2 KB | Life-area engine (global LAE), GENERATED: 9 areas (career, money, marriage, children, health, learning, foreign, home, inner life) scored 0-100 from house strength, lords, significators, divisional chart, yogas and dasha; calibrated on 12 charts; each score lists its reasons |
| `95-life-narratives.js` | 330 | 21.9 KB | Life-area narratives (global LAN), GENERATED: a 450-700 word personal reading for each of the 9 life areas, composed from the engine facts (stance by band, house-lord arena, strengths, care points, yoga modifiers, timing, practices, self-check questions) |
| `96-varga-reading.js` | 188 | 11.2 KB | Divisional chart readings (global VGR), GENERATED: D9, D10, D7, D4, D24, D20 each with rising sign, the houses that matter, planet-by-planet text, strength summary, vargottama and a score; positions come from the app's own varga engine |
| `97-life-event-catalog.js` | 450 | 43.4 KB | Life-Event catalog (global LEC): 278 everyday events tagged by house, planet, sign, plain words and date sharpness; plugs into RS_CATS (keeps the 10 original ids) |
| `97-transit-reading.js` | 223 | 17.3 KB | Transits and Sade Sati (global TRS), GENERATED: Sade Sati/Dhaiya phase texts and ease for your chart, where Saturn/Jupiter/Rahu/Ketu are now (from the Moon and Lagna), a three-year sign-change calendar, double-transit windows and a year-by-year outlook per life area; dates come from the app's own computeTransits |
| `98-life-event-engine.js` | 420 | 39.7 KB | Life-Event Checker Pro (global LEE): per-minute dasha, aspects + 5 transit planets, Monte-Carlo luck test, bootstrap/drop-one stability, confidence floor; overrides rsBuildLife/rsRenderEvents/rsRunLife |
| `98-pdf-pages.js` | 175 | 32.3 KB | extra PDF sections registered into PDFR: panchang, planet pages, special lagnas + Bhava Chalit, Shadbala, Ashtakavarga, gallery of all divisional charts, every Mahadasha/Antardasha, glossary, notes |
| `99-area-deep.js` | 267 | 37.2 KB | GENERATED area deep dive (ADD): long connected readings for 9 life areas across all divisional charts, Ashtakavarga, Shadbala, drishti, yogas, timing, plus love/partner/workstyle/keeping/path extras |
| `99-dasha-lens.js` | 323 | 36.4 KB | Dasha Lens (studio tab): any moment (date + h/m/s with nudge + hold-to-repeat) -> full Vimshottari stack MD/AD/PD/SD/Prana/Deha with exact times, time left, natal house; 9-period sibling timeline per level; sensitivity of boundaries to birth-time error; Moon from the recorded birth time or the Time Dial |
| `99-jump-3d-bridge.js` | 36 | 2.6 KB | vxJump3D(): sends an exact moment + birth place to the 3D Sky app (localStorage vax_jump_3d + the shell's open-3d message); the Time Dial and scan-candidate 'Show in the 3D wheel' buttons |

### `apps/developer/` — 2 files, 582 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `index.bundle.html` | 539 | 46.8 KB | GENERATED by build.py (do not edit): this app with every css/js inlined, what the shell loads (1 request instead of ~260) |
| `index.html` | 43 | 4.0 KB | markup of this app; lists its css/js in load order |

### `apps/developer/css/` — 2 files, 126 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `01-base.css` | 61 | 2.5 KB | base reset |
| `02-developer-card.css` | 65 | 8.5 KB | developer card styles |

### `apps/developer/js/` — 1 files, 11 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `01-dev-card.js` | 11 | 0.8 KB | developer card logic |

### `apps/notepad/` — 2 files, 1,252 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `index.bundle.html` | 1,201 | 156.9 KB | GENERATED by build.py (do not edit): this app with every css/js inlined, what the shell loads (1 request instead of ~260) |
| `index.html` | 51 | 3.3 KB | markup of this app; lists its css/js in load order |

### `apps/notepad/css/` — 1 files, 245 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `01-notepad.css` | 245 | 32.1 KB | notepad styles |

### `apps/notepad/js/` — 1 files, 358 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `01-notepad.js` | 358 | 73.2 KB | notepad: notes, templates, client cards (key vedicNotepad_v1); Settings tab (view "settings", on/off switches in S.set.o, OPT_DEF defaults) and per-line / per-card copy buttons (off by default) |

### `apps/sky3d/` — 2 files, 12,405 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `index.bundle.html` | 11,852 | 903.7 KB | GENERATED by build.py (do not edit): this app with every css/js inlined, what the shell loads (1 request instead of ~260) |
| `index.html` | 553 | 36.6 KB | markup of this app; lists its css/js in load order |

### `apps/sky3d/css/` — 37 files, 1,908 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `01-base-tokens.css` | 50 | 1.5 KB | base + design tokens |
| `02-app-shell.css` | 47 | 2.0 KB | app shell (desktop) |
| `03-3d-viewport.css` | 62 | 5.2 KB | 3D viewport |
| `04-side-panel.css` | 114 | 7.6 KB | side panel (glass) |
| `05-timeline-scrubber.css` | 86 | 5.7 KB | timeline scrubber |
| `06-chart-wheel.css` | 30 | 2.4 KB | chart wheel |
| `07-aspect-list.css` | 26 | 2.4 KB | aspect list |
| `08-aspect-explorer.css` | 41 | 3.5 KB | aspect explorer |
| `09-mobile-free-fly-joystick.css` | 41 | 2.5 KB | joystick |
| `10-planet-detail-header.css` | 47 | 3.6 KB | planet detail header |
| `11-sign-selector-dropdown.css` | 30 | 2.6 KB | sign selector |
| `12-polish-layer.css` | 53 | 4.1 KB | polish layer |
| `13-tablet.css` | 119 | 7.2 KB | tablet rules |
| `14-structure-visual-layer.css` | 53 | 4.9 KB | structure + visual layer |
| `15-smoothness.css` | 35 | 3.1 KB | smoothness |
| `16-astro-layers.css` | 51 | 6.2 KB | astro layers |
| `17-polish-rest-of-app.css` | 26 | 3.5 KB | polish rest of app |
| `18-planet-picker.css` | 39 | 3.9 KB | planet picker |
| `19-retrograde-planner.css` | 34 | 4.2 KB | retrograde planner (also hides old loadingMask) |
| `20-hud-ascendant-rising.css` | 55 | 4.9 KB | HUD ascendant/rising chips, popups |
| `21-premium-polish.css` | 31 | 3.7 KB | premium gold glass, magnetic hover |
| `22-dasha-transit-triggers.css` | 30 | 3.8 KB | Triggers tab (dasha + transit) styles |
| `23-time-machine-polish.css` | 160 | 16.8 KB | Time Machine styles + 3D Sky visual polish (top bar, tabs, timeline dock, buttons) |
| `24-sky-dashboard.css` | 91 | 8.9 KB | Sky Dashboard page styles |
| `25-date-entry.css` | 7 | 0.5 KB | Day/Month/Year + AD/BC birth date fields |
| `25-solid-panels.css` | 31 | 4.2 KB | 3D Sky side panel, tabs, cards and popups: solid surfaces and calm motion (loaded last, overrides older polish layers) |
| `26-exact-aspects.css` | 64 | 6.6 KB | styles for the Aspects tab (numbered steps, planet grid, summary card, result cards with orb bar) |
| `27-panel-unify.css` | 66 | 5.0 KB | one look for every 3D tab (same language as the Aspects tab): hero intro cards, gold step headings, pill chips, clean cards, quiet notes, larger form fields |
| `28-degree-houses.css` | 42 | 5.5 KB | styles for the Houses tab (wheel, planet rows, house starts) |
| `29-live-shadbala.css` | 31 | 5.2 KB | styles for the live Shadbala block (shb- prefix); planet-window tabs wrap instead of scrolling |
| `30-profile-from-moment.css` | 21 | 2.3 KB | popup styles (`pm-` prefix) and the running glow on the Reverse button |
| `31-ui-refresh.css` | 64 | 5.2 KB | phone interface refresh loaded last: slim timeline grid, compact top card, hidden logo mark, compact tab strip, All-tabs grid (`ui-` prefix) |
| `32-tools-menu.css` | 20 | 1.6 KB | top-right Eye + Tools icon, Tools drop-down menu and the D9 Navamsha badge (`tools-menu`, `tm-`, `hud-nav`) |
| `33-sky-alerts.css` | 32 | 3.5 KB | Sky alerts pill and bottom sheet (`hud-ska`, `ska-`) |
| `34-timeline-finder.css` | 57 | 8.2 KB | Timeline finder sheet (`tlf-` prefix) |
| `35-export-studio.css` | 62 | 9.5 KB | Export Studio sheet and the Export tab launcher (xs- classes) |
| `36-formula-maker.css` | 60 | 11.7 KB | Formula Maker sheets: builder, rule editor, operand picker, result tree, library, share (fm- prefix) |

### `apps/sky3d/js/` — 69 files, 8,158 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `01-astro-engine.js` | 162 | 10.2 KB | core astronomy engine (Sun, Moon, planets, ayanamsa) |
| `02-planetary-dignity.js` | 49 | 3.1 KB | dignity tables incl. outer planets |
| `03-ascendant-houses-drishti.js` | 51 | 1.8 KB | ascendant, houses, drishti |
| `04-sign-level-aspects.js` | 21 | 1.0 KB | sign-level aspects |
| `05-aspect-resolver.js` | 57 | 2.4 KB | aspect resolver |
| `06-planet-detail-helpers.js` | 153 | 6.6 KB | transit/conjunction scanning, retrogrades, returns helpers (findIngresses...) |
| `07-position-snapshot.js` | 39 | 2.2 KB | full position snapshot at a Julian day |
| `08-scene-setup-and-camera.js` | 398 | 16.1 KB | Three.js scene, camera modes, zodiac ring |
| `09-free-fly-joystick.js` | 59 | 2.3 KB | mobile free-fly joystick |
| `10-procedural-textures.js` | 314 | 13.7 KB | procedural planet textures |
| `11-planet-visuals.js` | 252 | 14.6 KB | planet meshes and visuals |
| `12-solar-system-view.js` | 193 | 12.0 KB | Solar System view (SOL, setSceneView, real distances) |
| `13-camera-mode-control.js` | 49 | 2.1 KB | camera mode control (orbit/focus/free) |
| `14-line-visibility-toggles.js` | 67 | 2.7 KB | line visibility toggles |
| `15-planet-labels.js` | 74 | 4.5 KB | 3D planet labels |
| `16-app-state.js` | 34 | 1.8 KB | global app state |
| `17-render-sky-table.js` | 22 | 1.6 KB | sky table renderer |
| `18-rising-sign-timeline.js` | 108 | 8.5 KB | rising-sign timings (long-press popup + Rising tab); Navamsha now + tap a sign for its 9 Navamshas with times to the second |
| `19-hud-render.js` | 64 | 3.2 KB | HUD (ascendant chip, rising chip) rendering |
| `20-transit-conjunction-scanner.js` | 151 | 6.1 KB | transit/conjunction scanner UI |
| `21-natal-profile.js` | 49 | 2.3 KB | natal profile |
| `22-chart-tab.js` | 37 | 1.9 KB | Chart tab |
| `23-north-indian-wheel.js` | 77 | 4.1 KB | North-Indian diamond wheel (SVG) |
| `24-sign-selector.js` | 82 | 4.1 KB | sign selector dropdown |
| `25-rich-sign-detail.js` | 94 | 7.0 KB | rich sign detail |
| `26-sign-aspects.js` | 102 | 4.3 KB | sign aspects UI |
| `27-aspect-explorer-ui.js` | 158 | 7.4 KB | aspect explorer UI |
| `28-planet-detail-popup.js` | 148 | 6.9 KB | planet detail popup |
| `29-planet-detail-content.js` | 144 | 19.0 KB | planet detail content (PD table) |
| `30-outer-planet-knowledge.js` | 37 | 5.3 KB | outer planet knowledge text |
| `31-outer-planet-popup.js` | 99 | 9.0 KB | Uranus/Neptune/Pluto popup |
| `32-aspect-explorer-popup.js` | 73 | 4.4 KB | aspect explorer popup, long-press + magnetic wiring |
| `33-timeline-scrubber.js` | 57 | 2.2 KB | timeline scrubber |
| `34-main-refresh-loop.js` | 59 | 2.5 KB | main refresh loop |
| `35-ui-wiring.js` | 20 | 1.0 KB | UI event wiring |
| `36-mobile-bottom-sheet.js` | 98 | 5.3 KB | mobile bottom sheet |
| `37-natal-form-location.js` | 117 | 7.3 KB | natal form + location autocomplete |
| `38-data-export-wiring.js` | 11 | 0.8 KB | data export wiring |
| `39-smoothness.js` | 50 | 3.3 KB | smoothness: skip no-op DOM writes |
| `40-3d-astro-layers.js` | 144 | 11.7 KB | 3D astro layers (lines, houses) |
| `41-quick-planet-picker.js` | 46 | 3.7 KB | quick planet picker |
| `42-init.js` | 23 | 0.6 KB | startup / init |
| `43-degree-finder-returns.js` | 213 | 13.5 KB | degree finder and returns |
| `44-retrograde-planner.js` | 40 | 7.5 KB | retrograde planner |
| `45-vimshottari-dasha.js` | 59 | 2.8 KB | Vimshottari dasha engine in Julian Days (VDasha: build timeline, at(jd) -> Maha/Antar/Pratyantar) |
| `46-dasha-transit-engine.js` | 318 | 21.8 KB | Dasha + Transit trigger engine (DTrig): 23 life areas with sourced rules (double transit, Jupiter, Saturn, Saturn+node, node triggers), dasha link per house, dasha-lord activation, window scan |
| `47-dasha-transit-ui.js` | 144 | 10.7 KB | Triggers tab UI: running dashas, live strength per life area, scan windows, why details, tap = jump to date |
| `48-profile-bridge.js` | 47 | 2.8 KB | Profile bridge: all Birth Chart profiles appear in 3D (marked ✦, live), and the chart opened in the main app is auto-selected in 3D |
| `49-time-machine.js` | 169 | 13.9 KB | Date picker (five snapping wheels: day with weekday, month, year, hour, minute; quick steppers with hold-to-repeat; year scrub bar; typed dates; Now / Birth / Midnight) + draggable, zoomable timeline |
| `50-sky-dashboard.js` | 294 | 26.9 KB | Sky Dashboard (top-right ▦ button): full-screen page with panchang, highlights, planet cards, who aspects whom, trine/house matrix, sign + nakshatra exchanges, dispositor chains, signs, nakshatras, houses, balance, outer planets; reads the 3D date or the birth chart (`DBX`) |
| `51-jump-from-rectification.js` | 33 | 2.7 KB | receives the Rectification jump: switches to the Zodiac Wheel, jumps to the exact moment, pauses play, shows the Rising sign for the birth place (session only), toast |
| `52-gulika.js` | 52 | 4.3 KB | Gulika (Mandi) for 3D Sky (global GK): same method as the Birth Chart; marker on the zodiac ring, natal ring, dashboard card |
| `53-exact-aspects.js` | 209 | 13.8 KB | Aspects tab: when a planet's aspect (Moon 7; Mars 4/7/8; Jupiter/Rahu/Ketu 5/7/9; Saturn 3/7/10; plus conjunction) lands on the exact degree of a natal planet/Lagna (if a profile is active), a live-sky planet, or a custom degree; exact moments, orb entry/exit and duration |
| `54-degree-houses.js` | 139 | 12.7 KB | Houses tab + 3D layer: degree-based houses from the exact rising degree (Sripati / Equal), wheel, planets that change house, 3D house lines and tags |
| `55-live-shadbala-engine.js` | 329 | 16.8 KB | copy of the Birth Chart Shadbala engine (SHB_ENGINE), kept identical by tests/sky3d_shadbala_test.js |
| `56-live-shadbala.js` | 100 | 10.6 KB | live Shadbala for the 7 planets at the 3D time and viewer place; adds the Shadbala block and badge to the planet window (Strength tab) |
| `57-profile-from-moment.js` | 77 | 6.1 KB | Make a profile from a moment: 👤 in the timeline bar (moment on screen, even while running) and on each Saved moment; pmDraft/pmCreate; uses the live place, blocks a time-zone guess |
| `58-ui-all-tabs.js` | 43 | 3.5 KB | "All" button in the tab strip: grid of every tab (one tap to open), keeps the active tab in view |
| `59-wheel-frame.js` | 53 | 4.4 KB | wheel framing on phones: finds the free band between the cards and the timeline bar, shifts the picture into it (camera view offset) and re-fits the zoom; `wheelBand()`, `wheelFrameUpdate()` |
| `60-wheel-beauty.js` | 76 | 6.8 KB | Zodiac Wheel beauty pass: soft Sun glow (replaces hard shells), degree scale on the sign ring, golden aura and inner plate, Earth/Moon lift, gentle Sun breathing and gem twinkle; off with localStorage vax3d_beauty='0' |
| `61-navamsha-sky.js` | 53 | 4.4 KB | global `NAV`: Navamsha (D9) sky (`NAV.snap/asc/set`, D9 = lon×9 mod 360) used by scene, HUD, sky table, overlays and chart tab; top-right Tools drop-down wiring (`#toolsBtn`, `#toolsMenu`, `#navBtn`, `#navBadge`); forced off in Solar System view |
| `62-sky-alerts.js` | 125 | 12.8 KB | global `SKA`: HUD pill under the Moon line + bottom sheet of trine (1-5-9), square (4-10), opposite (7), on-the-sign, Gochara, Sade Sati, Rahu-Ketu axis and Jupiter+Saturn double-transit alerts from the live Rising and Moon, or your birth Rising and Moon (`SKA.calc` is pure) |
| `63-timeline-finder.js` | 138 | 19.3 KB | global `TLF`: Tools > Timeline finder. Age range (from today) or birth years + conditions (planets in a sign, in a nakshatra, planets meeting/aspecting, retrograde), match ALL or ANY, scans the sky engine and lists every matching period; tap to jump the 3D sky (`TLF.test/search` are pure) |
| `64-varga-math.js` | 165 | 10.6 KB | global `VG`: divisional-chart sign rules copied from the Birth Chart `calcVarga`, plus `VG.lon` (a full 0-360 sky longitude in any varga); used by `NAV` to draw any D2-D144 chart as a sky |
| `65-export-studio.js` | 377 | 36.5 KB | global `XS`: the 3D Sky export engine. One data model (sections of kv / table / list / text blocks) rendered as Markdown, JSON or plain text; presets, section builders (planets, signs, houses, panchang, aspects, relations, alerts, divisional charts, Dasha, transits, meetings, retrograde, ephemeris, Timeline finder results) |
| `66-export-studio-ui.js` | 130 | 15.9 KB | global `XSU`: the Export Studio sheet (presets, chart and moment, section switches and options, format, question for the AI, live preview, Copy / Download / Share) and the one-tap copies on the Export tab |
| `67-formula-engine.js` | 295 | 28.0 KB | global `FM`: Formula Maker engine. Subjects (planets, Chara Karakas AK..DK 7/8 scheme, Bhrigu Bindu, Yogi/Avayogi, Gulika, Hora/Ghati/Indu lagna, Karakamsa, Swamsha, Arudha A1..A12, house lords), ~25 relations, tri-state evaluator with explained tree, charts C/N/S/P, Find-dates scan |
| `68-formula-library.js` | 94 | 12.2 KB | global `FMX`: ~45 ready formulas, share code `VF1.` + `#f=` link, text card, JSON import/export, Saved list (localStorage `sky3d_fm_saved`) |
| `69-formula-ui.js` | 344 | 39.3 KB | global `FMU`: Formula Maker sheet (Tools > ƒ): Build / Result / Library / Saved tabs, rule editor, operand picker, find dates, share sheet, PNG card |

### `docs/` — 19 files, 3,410 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `AI_START_HERE.md` | 31 | 4.3 KB | The repeatable AI session system: start prompt, session loop (session.sh start/check/test/ship), token hygiene, where things are, layer rules, lessons learned. READ FIRST in every new chat |
| `AI_SYSTEM_PLAN.md` | 21 | 3.5 KB | plan and architecture of the AI system (index, engine, panel) |
| `ALL_FEATURES.md` | 2,045 | 177.9 KB | GENERATED one-file guide to the whole app (what it is, every tool and what it does, 3D Sky features, every file with lines, size and purpose, tests, storage keys); regenerate with `python3 tools/gen_all_features.py`, never hand-edit |
| `APP_NAVIGATION_PLAN.md` | 69 | 7.8 KB | Plan to make every tool fast to reach: measured audit (32 tools, Home = 4 screens, 17 tools without a bottom tab), target hubs Start/Chart/Time/Strength/Tools with a place for every tool, 9 sessions N1-N9, acceptance tests, decisions. Read with AI_START_HERE |
| `ASTROLOGER_REVIEW_SHEET.md` | 197 | 33.2 KB | generated by `python3 tests/reading_qa_test.py --sheet`: per-chart area scores for a human astrologer to mark OK / Disagree |
| `ASTRO_FEATURES_PLAN.md` | 272 | 46.1 KB | Handoff plan for the astrologer tools the app still lacks (avasthas, Vimshopaka, upagrahas, sensitive degrees, Sudarshana, Argala, Ashtakavarga extras, Gochara vedha, synastry, Muhurta, Panchang calendar, remedies): ordered checklist A0-A14, source rules, per-step detail, session log. A new chat starts here |
| `DOOR.md` | 37 | 2.8 KB | door / licensing site notes |
| `EXPORT_STUDIO_PLAN.md` | 12 | 1.8 KB | plan for the structured 3D Sky export and its control screen |
| `FORMULA_MAKER_PLAN.md` | 49 | 4.9 KB | plan for the 3D Sky Formula Maker (subjects, relations, evaluator, find dates, library, sharing, UI) |
| `FULL_READING_PLAN.md` | 127 | 25.9 KB | Plan for the PDF-grade full reading: audit of what exists, gaps, architecture, 12 sessions with checklist, working rules, decisions. READ FIRST in every reading session |
| `HANDOFF.md` | 6 | 0.6 KB | handoff notes |
| `HORA_PLAN.md` | 31 | 5.2 KB | Hora plan, checklist and research log (sources, where teachers differ) |
| `RELEASE_CHECKLIST.md` | 28 | 3.0 KB | owner's checklist for selling the PDF reading: review, brand, disclaimers, delivery, licences, quality gates, AI-writer decision |
| `STARTUP_SPEED_PLAN.md` | 57 | 4.2 KB | plan for faster start-up: bundle each app, load rare features on first open, how to measure, and the rule every new feature follows |
| `SUPABASE.md` | 29 | 2.8 KB | Supabase cloud-sync notes |
| `THIRD_PARTY_LICENSES.md` | 236 | 12.4 KB | third-party licences |
| `TIMELINE_FINDER_PLAN.md` | 13 | 1.9 KB | plan, method and accuracy notes for the 3D Sky Timeline finder |
| `VARGA_3D_PLAN.md` | 11 | 1.1 KB | plan for opening any divisional chart as a sky in the 3D Sky |
| `YEAR_TIMELINE_RESEARCH.md` | 139 | 16.7 KB | Research + plan for the "Year Timeline Pack" (date-range, AI-ready data file: timeline, transits, dasha changes, planet role map); sources, file layout, reuse map, build order |

### `editions/customer/` — 2 files, 82 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `customer-layer.js` | 67 | 4.5 KB | customer edition behaviour layer |
| `customer-top.js` | 15 | 1.5 KB | customer edition top-of-page code |

### `gate/` — 2 files, 174 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `get-app.ts` | 57 | 3.4 KB | edge function that serves the locked app |
| `index.html` | 117 | 11.8 KB | access gate page for the locked edition |

### `mobile/` — 3 files, 48 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `README.md` | 13 | 1.4 KB | Android app (Capacitor): how it works, install link, signing |
| `capacitor.config.json` | 13 | 0.6 KB | app id, offline / live-update / splash settings |
| `package.json` | 22 | 0.6 KB | Capacitor + live-updater packages for the Android app |

### `mobile/resources/` — 5 files, 0 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `icon-background.png` | 0 | 281.0 KB | adaptive icon background |
| `icon-foreground.png` | 0 | 1.10 MB | adaptive icon foreground |
| `icon-only.png` | 0 | 1.51 MB | app icon |
| `splash-dark.png` | 0 | 144.0 KB | splash screen (dark) |
| `splash.png` | 0 | 144.0 KB | splash screen |

### `mobile/scripts/` — 2 files, 93 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `patch-android.py` | 22 | 1.2 KB | adds release signing and version numbers to the generated Android project |
| `prepare-web.js` | 71 | 5.8 KB | builds www (offline copy incl. three.js + fonts) and the live-update bundle |

### `mobile/src/` — 1 files, 113 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `native-bridge.js` | 113 | 11.0 KB | runs inside the APK: live updates from GitHub, back button, status bar |

### `shared/` — 7 files, 1,184 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `copy-toggle.js` | 27 | 2.0 KB | hides every "Copy ..." button in an app while the main-menu Settings switch "Copy buttons" is off (default off; key vedicCopyBtns); loaded by all 4 apps |
| `export-addon.js` | 643 | 48.1 KB | export add-on UI used by apps (window.VAX); do not edit unless asked |
| `icons.js` | 168 | 17.5 KB | ICON LIBRARY: premium duotone line SVG icons that automatically replace UI emojis in every app + shell (MutationObserver, original emoji kept as hidden text). To add/change an icon edit `I` (svg) and `M` (emoji map) in this file. Astro glyphs, arrows, ✓ ✕ are intentionally left as text. Styles in `shared/meta.css` |
| `liquid-glass.css` | 45 | 5.0 KB | Liquid glass look for the shell and all apps (aurora background, frosted translucent cards, floating glass tab bar); every rule is scoped by `html.lg` + `data-app` (bc/3d/np/dev); no motion |
| `liquid-glass.js` | 15 | 0.9 KB | turns class `lg` on <html> (on by default; main-menu Settings switch "Liquid glass look", key vedicGlass; off if the device asks for less transparency) |
| `meta.css` | 97 | 5.8 KB | META LAYER: one global file for feel (smooth transitions, touch press feedback, gold focus/selection/scrollbars, text wrapping, safe areas, reduced motion). Linked LAST by the shell and every app; all rules are `:where()` zero-specificity so app css always wins. Edit this file for any app-wide smoothness/responsiveness change |
| `quick-menu.js` | 189 | 17.3 KB | Quick Menu: top-left ☰ button in 3D Sky, Birth Chart and Notepad; opens a sheet to jump to any tool or tab, pin favourites and make named groups (localStorage key vedicQuickMenu_v1; tool switching via postMessage {vqm:'go'} handled in shell/js/shell.js); loaded by each app after copy-toggle.js. |

### `shared/brand/` — 2 files, 1 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `favicon.ico` | 0 | 10.7 KB | website favicon (16, 32, 48) |
| `manifest.webmanifest` | 1 | 0.4 KB | web app manifest (name, colours, icons) linked from the shell |

### `shell/css/` — 1 files, 113 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `shell.css` | 113 | 12.1 KB | loader, switcher, dev overlay styles |

### `shell/js/` — 3 files, 475 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `locpicker.js` | 201 | 34.4 KB | map / location picker used by every app (LocPicker) |
| `shell.js` | 242 | 17.7 KB | mounts app iframes, loader timing, switcher, dev overlay |
| `updater.js` | 32 | 2.4 KB | silent updater: reads version.json, re-downloads stale cached files when the build changed and reloads once (hosted and installed app; no-op in the single-file build) |

### `tests/` — 113 files, 6,613 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `_helpers.py` | 19 | 1.1 KB | shared Playwright helpers (VAX_TARGET=hosted tests the folder version) |
| `ai_paste_test.js` | 38 | 4.4 KB | paste-to-fill parser (cURL, JS fetch/axios/SDK, Python requests/SDK) for the AI provider settings |
| `ai_system_browser_test.py` | 93 | 8.9 KB | AI system: every index entry, route → fetch → answer with a stubbed provider, skills, personas, key rules, panel at 390 and 360 |
| `area_deep_test.py` | 69 | 8.9 KB | area deep dive: every quoted number vs the chart over 12 charts, wording rules, determinism, Deep reading/report/PDF wiring |
| `argala_browser_test.py` | 42 | 4.3 KB | Playwright test of the Argala panel at 390px (`ARG_SHOTS=dir`) |
| `argala_test.js` | 42 | 4.9 KB | node test for js/139 (pair mapping, count rule, Ketu, 3-malefic row, 60 real charts) |
| `ashtakavarga_extras_browser_test.py` | 66 | 8.8 KB | Playwright test of the Ashtakavarga Workings panel at 390px (`ASX_SHOTS=dir`) |
| `ashtakavarga_extras_test.js` | 95 | 9.8 KB | node test for js/141 (Prastara column sums equal the app BAV over 100 charts, classic totals, SAV 337) |
| `ashtakavarga_reading_test.py` | 74 | 9.5 KB | Ashtakavarga reading: every point, total, rank, tier, sign, house and contributor vs chart.ashtakavarga over 12 charts, wording, tab, report and PDF |
| `avasthas_browser_test.py` | 37 | 3.3 KB | Playwright test of the Planet States panel at 390px (`AVS_SHOTS=dir` for screenshots) |
| `avasthas_test.js` | 45 | 4.4 KB | node test for js/134 (Baladi edges, compound friendship, Jagradadi/Deeptadi vs app dignity over 120 charts) |
| `ayanamsa_reset_test.js` | 16 | 1.5 KB | a forgotten permanent KP/Raman choice is erased and ignored on a fresh visit (Lahiri), tab-only choice still works (Node) |
| `ayanamsa_test.py` | 44 | 4.0 KB | Ayanamsa choice: offsets at J2000, chart shifts by exact offset, saved choice, labels |
| `bhavat_bhavam_browser_test.py` | 37 | 3.6 KB | Playwright test of the House from the House panel at 390px (`BBH_SHOTS=dir`) |
| `bhavat_bhavam_test.js` | 37 | 4.2 KB | node test for js/140 (pairs vs two sources, arudha rule hand-worked, 60 real charts) |
| `bhavat_masterclass_browser_test.py` | 86 | 9.8 KB | Playwright test of the Masterclass at 390 and 360px (`BMC_SHOTS=dir`) |
| `bhavat_masterclass_test.js` | 70 | 7.0 KB | node test for js/151-152 (formulas vs sources, inverse of all 144 counts, scoring rules, dasha, 60 real charts) |
| `camera_motion_test.py` | 48 | 3.7 KB | camera momentum test |
| `chakra_explorer_browser_test.py` | 108 | 11.7 KB | Chakra Explorer in the real app: Home tile, three drawings, date and step controls, every toggle, Kota Paala override, phone width, rebuild if missing (CHX_SHOTS=dir saves screenshots) |
| `chakra_explorer_test.js` | 72 | 8.0 KB | Chakra Explorer: 81-cell grid, 28 wall cells, ray geometry, Kota zones vs the published lists, Latta examples, Shoola tips, retrograde IN/OUT flip, full render on 60 random moments |
| `choghadiya_avakahada_test.py` | 42 | 5.1 KB | Choghadiya order for all 7 weekdays, equal slots, Avakahada values for a known Moon, tables match Kundali Matching |
| `classic_moon_test.js` | 18 | 2.8 KB | Classic Moon (default, no delta-T): reference chart 2007-11-11 02:23 IST Hyderabad gives exactly the trusted Dasha dates (Maha to Prana, to the minute) |
| `compare_lab_test.py` | 56 | 5.3 KB | Compare Lab test: opens from Divisional Charts, three-dot menu, up to 4 charts, follow a planet, table, notes, copy text |
| `customer_smoke.py` | 44 | 3.9 KB | customer edition smoke test |
| `dasha_lens_test.js` | 53 | 7.0 KB | Dasha Lens engine in a Node vm: levels 1-5 equal the app's dasha engine on 1,200 random moments over 3 charts, nesting laws, Prana length, duration text |
| `dasha_reading_test.py` | 62 | 6.9 KB | Dasha layer: all Mahadashas + Antardashas equal the app's engine on 8 charts, current period, gap-free 5-year window, clean texts, screens + report |
| `dasha_reverse_test.js` | 23 | 1.6 KB | reverses the reference chart's Dasha chain, window must contain 02:23:00 |
| `date_entry_test.py` | 91 | 10.8 KB | Julian Day and calendar maths, parseDob, deltaT, typed old/BC dates through the form and every tab |
| `datefinder_test.py` | 68 | 4.6 KB | Date Finder test |
| `deep_reading_test.py` | 77 | 9.7 KB | Deep reading: 6 tabs, 12 house cards, every on-screen text equals the database text for the chart's real placements, report section + export checkbox, 6 more charts, phone layout |
| `degree_houses_test.js` | 24 | 2.4 KB | Degree houses engine (Sripati / Equal): 12 houses cover 360°, Lagna madhya, shifted flag |
| `dosha_late_panels_test.py` | 55 | 5.8 KB | Dosha Check rules, Choghadiya panel, every new Home card opens non-blank (also with an older js/58) |
| `ephemeris_vs_swiss_test.js` | 42 | 7.2 KB | REAL-CHART verification: 14 real births vs the Swiss Ephemeris (Moon within 25 arcsec, Ascendant, Lahiri anchor = official ICRC value, delta-T) and 504 Vimshottari boundaries over 6 levels equal an independent calculation |
| `exact_aspects_test.js` | 54 | 5.5 KB | Exact Aspects engine test (Node, 31 checks): Rahu 5/7/9/conjunction on 18° Gemini, orb edges, 18.6-year repeat, retro passes, Moon, live-sky moving target, window running now |
| `explorer_time_test.py` | 34 | 2.5 KB | Aspect Explorer follows the app time (not the birth time) when a profile is loaded |
| `export_builder_browser_test.py` | 121 | 12.2 KB | Export tab at phone width: presets, group All/None, divisional chart picks, remembered selection, txt/json download, split into parts, sky-right-now place, quiet opening of unopened tool pages |
| `export_no_flicker_browser_test.py` | 44 | 4.3 KB | the Birth Chart Export tab does not flicker while it measures tool pages: always the Export panel on screen, no scroll jump, no fade-in replay, sizes still fill in |
| `feature_guide_browser_test.py` | 51 | 4.2 KB | Feature Guide at 390 and 360px: cards, one open at a time, search, group chips, Open button, listed in Tools tab |
| `feature_guide_test.js` | 28 | 2.6 KB | node test: every tool has a full guide entry, links valid, no fear words, search finds plain words |
| `gochara_vedha_test.js` | 52 | 4.9 KB | node test for js/142 (pair tables vs the published house sets, exceptions both ways, nodes ignored) |
| `gulika_test.py` | 64 | 6.5 KB | Gulika test: day/night tables, before-sunrise rule, start<middle<end, charts, Planets panel, report text, 3D vs Birth Chart agreement, 3D dashboard |
| `home_chart_first_test.py` | 52 | 5.5 KB | Home chart-first: chart + Rising/Moon/Sun, details hidden then shown, North/South saved, Explore all tools / back, returns to tools page from a tool, new chart resets |
| `hora_browser_test.py` | 136 | 16.4 KB | Playwright test of the Hora panel at 390 and 360px (`HORA_SHOTS=dir`) |
| `hora_test.py` | 67 | 7.2 KB | Playwright test of the Hora engine against panchangaAt (order, contiguity, Drik day/night lengths) |
| `house_now_test.py` | 67 | 7.7 KB | Right now: sky, dasha chain, signs, lords, Ashtakavarga and scores vs the engines at two dates over 12 charts, wording, first tab, report and PDF |
| `knowledge_db_test.py` | 74 | 8.3 KB | Knowledge database: completeness, quality gates, cross-check of signs/nakshatras/aspects/dignity against the app tables, `VDB.reading()` on real charts |
| `kp_test.py` | 51 | 7.0 KB | KP: sub/sub-sub lord bisect over all 27 nakshatras, Placidus checks, significators, panel, KP ayanamsa button |
| `life_areas_test.py` | 79 | 9.0 KB | Life-area engine: bounds, determinism, calibration spread on 12 charts, per-input sensitivity, Deep reading + report + PDF wiring |
| `life_event_pro_test.js` | 37 | 4.5 KB | Life-Event Pro engine in a Node vm: catalog integrity, dasha equals the app engine, recovers a known rising sign and time, flags wrong dates, random events stay below a 40% floor |
| `life_narratives_test.py` | 77 | 9.1 KB | Life-area narratives: 12 charts x 9 areas (length, structure, wording, consistency with scores), variation, sensitivity, Deep reading + report + PDF wiring |
| `manifest_test.py` | 86 | 11.1 KB | Manifestation layer: 1296 unique combinations, grammar/voice/wording gates, signature matches real chart data on 8 charts, on-screen blocks and report |
| `meaning_lab_test.js` | 13 | 1.1 KB | Meaning Lab: panel builds, database lookups for lord/planet pieces |
| `nakshatra_db_test.py` | 80 | 8.7 KB | Nakshatra layer: 972 unique placements, wording gates (no fatalistic/absolute words), pada->navamsa equals the app's D9 on 8 charts, Moon star = dasha start, on-screen check |
| `notepad_sidemenu_test.py` | 49 | 4.7 KB | Notepad side menu redesign: stats tiles, quick find, collapsible sections (saved), tag chips + show all, recent notes, solid drawer, at 1100 and 390 px |
| `notepad_test.py` | 88 | 7.4 KB | Notepad test: typing order, note links, templates from every view, side menu, Settings tab switches (copy buttons off by default), at 390 px and 1280 px |
| `panchang_calendar_browser_test.py` | 60 | 6.2 KB | Panchang Calendar at phone width: grid, navigation, day detail, Purnimanta, open Panchanga for a day |
| `panchang_calendar_test.js` | 53 | 6.3 KB | node test for js/146 (2026 festivals vs drikpanchang New Delhi, eclipses vs NASA, 24 months continuous, counts, Purnimanta) |
| `past_present_future_browser_test.py` | 71 | 8.4 KB | Playwright test of the Past · Present · Future panel at 390 and 360px (`PPF_SHOTS=dir`) |
| `pdf_download_test.py` | 41 | 3.6 KB | PDF download: a real multi-page A4 .pdf file is saved directly, no print window, page plan cuts only at block ends |
| `pdf_report_test.py` | 84 | 11.4 KB | PDF report: 4 theme/paper variants x 4 charts clean and self-contained, sections/options, Studio dialog, real PDF render |
| `planet_encyclopedia_test.py` | 49 | 4.7 KB | Planet Encyclopedia test: Home card, 9 planets x 6 tabs have text, Saturn/Mars aspects and dignities, taps, 390 px |
| `planet_states_test.py` | 79 | 10.1 KB | planet states: tags vs the chart over 12 charts, every planet x state paragraph, wording, Planets tab, report and PDF wiring |
| `popular_charts_test.py` | 77 | 7.3 KB | Popular charts section: 10 groups x 10 people, lazy Wikipedia photos (wrong-person guard), detail sheet, casting a chart incl. old-timezone option, no JS errors |
| `prashna_test.py` | 45 | 4.6 KB | Prashna: Ithasala/Easarapha maths, topic houses, panel, styles, rebuild if missing |
| `problem_finder_test.py` | 144 | 22.9 KB | Problem finder: every fact in every reason vs the chart over 12 charts x all areas x all problems, wording, click-through, Home tile |
| `prod_forms_check.py` | 26 | 2.4 KB | Deep reading inside the real production forms (single-file build + customer edition): 6 tabs, 12 house cards, 9 planet blocks, all layers loaded, report section |
| `quick_menu_test.py` | 56 | 5.5 KB | Quick Menu: descriptions, collapsible sections, search by name or description, Organise (pin/group), Recent, Enter to open, 390 px |
| `reading_qa_test.py` | 74 | 7.3 KB | S11 QA: 12 charts incl. edge cases; whole-report invariants (sections, junk text, banned absolutes, duplicates, word counts, headline/band match, determinism, PDF); `--sheet` rewrites docs/ASTROLOGER_REVIEW_SHEET.md |
| `reading_style_test.py` | 54 | 5.6 KB | reading style: hooks, progress, explored dots, next-up, hero, headline sizes, 3 phone/desktop widths, reduced motion |
| `rising_lines_test.py` | 60 | 5.2 KB | rising lines test |
| `rising_navamsha_test.py` | 41 | 3.9 KB | 3D rising view Navamsha test: current Navamsha line, 12 signs x 9 Navamshas, order rule per sign type, boundary accuracy, tap and back |
| `rising_popup_test.py` | 69 | 5.5 KB | rising popup test |
| `sensitive_degrees_browser_test.py` | 35 | 2.9 KB | Playwright test of the Sensitive Degrees panel at 390px (`SDG_SHOTS=dir`) |
| `sensitive_degrees_test.js` | 57 | 7.3 KB | node test for js/137 (tables vs two independently typed source tables, window edges, 80 real charts) |
| `shadbala_reading_test.py` | 72 | 8.7 KB | Shadbala reading: every number, rank, tier and component vs chart.shadbala over 12 charts, wording, Strength tab, report and PDF |
| `sky3d_date_test.py` | 47 | 3.0 KB | 3D app BC/Julian date maths and Day/Month/Year checks (node, no browser) |
| `sky3d_export_studio_browser_test.py` | 123 | 12.9 KB | Export Studio: structured Markdown / JSON / text output, section and option switches, copy and download, the sheet at 390 and 360 |
| `sky3d_formula_maker_browser_test.py` | 148 | 14.9 KB | Formula Maker: karakas, Bhrigu Bindu, Yogi points, relations, tri-state, every library formula, share round-trip, scan, and the sheet at 390 and 360 |
| `sky3d_navamsha_tools_browser_test.py` | 55 | 4.3 KB | 3D Sky Tools drop-down, Eye, Navamsha sky toggle and D9 math at 390 and 360 (Three.js stubbed; `S3_SHOTS=dir` for screenshots) |
| `sky3d_profile_moment_browser_test.py` | 90 | 8.1 KB | 3D Sky at phone width (Three.js stubbed): Reverse play both ways and pause, Make a profile from the current moment and from a saved moment |
| `sky3d_shadbala_test.js` | 44 | 4.1 KB | engine parity with the Birth Chart plus live adapter checks |
| `sky3d_sky_alerts_browser_test.py` | 50 | 4.6 KB | Sky alerts rules (`SKA.calc`), HUD pill and bottom sheet at 390 and 360 |
| `sky3d_timeline_finder_browser_test.py` | 82 | 9.2 KB | Timeline finder: ingress dates vs known values, Sun in Libra + Moon in Pisces, ALL vs ANY, planets meet, the sheet at 390 and 360 |
| `sky3d_ui_refresh_browser_test.py` | 59 | 6.1 KB | 3D Sky at 390 and 360 wide (Three.js stubbed): slim timeline, buttons in one row, All-tabs grid opens each tab, no overflow |
| `sky3d_varga_parity_test.js` | 25 | 2.2 KB | the 3D Sky's varga rules equal the Birth Chart's for all 24 vargas and every degree; D9 equals the Navamsha sky |
| `sky_dashboard_test.py` | 34 | 3.0 KB | Sky Dashboard test: button, all sections, 9 cards, 9x9 matrix, summary text, close |
| `smoke.py` | 49 | 3.9 KB | main end-to-end smoke test |
| `startup_bundles_browser_test.py` | 46 | 3.7 KB | the shell loads the per-app bundles: bundles are fresh, same globals as the plain source files, no page errors, Formula Maker and Birth Chart usable, far fewer requests |
| `sudarshana_browser_test.py` | 45 | 4.7 KB | Playwright test of the Sudarshana panel at 390px (`SDC_SHOTS=dir`) |
| `sudarshana_test.js` | 45 | 4.9 KB | node test for js/138 (year cycle, ring geometry, nature rules, 60 charts x 6 years) |
| `synastry_browser_test.py` | 55 | 5.5 KB | Synastry panel at phone width: Home card, pickers, swap, tables, no sideways scroll |
| `synastry_test.js` | 65 | 7.3 KB | node test for js/143 (hand-worked houses, aspects and scores; 60 chart pairs give mirrored tables and contacts when swapped) |
| `syntax_check.py` | 17 | 1.3 KB | node --check over every js file |
| `time_sky_test.js` | 15 | 1.5 KB | Time sky panel: Dasha at 3 moments + rising/D9 segments (contiguous, 2 h, 6+ segments) |
| `time_wheels_test.py` | 46 | 4.5 KB | 3D date picker test: five snap wheels, tap/scroll select, steppers with month-end clamp, typed date |
| `today_for_you_test.py` | 79 | 7.5 KB | Today for You: Chandrabala/Tarabala/Gochara maths over 10 days, tone, slots, panel, new profile |
| `tools_hub_browser_test.py` | 61 | 6.1 KB | Tools tab at phone width: bar fits, search, chips, open a tool, recents |
| `tools_hub_test.js` | 56 | 4.9 KB | node test for js/147 (every tool listed exactly once, groups, search words, recents) |
| `transit_reading_test.py` | 79 | 10.3 KB | Transit reading: planet signs, sign-change dates, Sade Sati/Dhaiya phase and double-transit windows checked against the ephemeris on 12 charts; outlook bounds; date sensitivity; Deep reading + report + PDF wiring |
| `trigger_lab_test.js` | 40 | 5.1 KB | Trigger Lab engine: periods contiguous, pattern + rule hold at every found window, aspect/nakshatra rules |
| `upagrahas_browser_test.py` | 35 | 3.1 KB | Playwright test of the Upagrahas panel at 390px (`UPA_SHOTS=dir`) |
| `upagrahas_test.js` | 31 | 3.4 KB | node test for js/136 (hand-worked values, 180-degree invariants over 1000 Suns, 60 real charts) |
| `updater_test.py` | 29 | 2.4 KB | silent updater: stale build triggers one silent reload and re-download, current build does nothing |
| `varga_guide_test.py` | 46 | 4.6 KB | Divisional chart guide test: one guide per chart, all sections, tagged rules, follows the chart picker |
| `varga_house_details_browser_test.py` | 39 | 3.9 KB | Divisional Charts House details tab (one column, nakshatra, pada, lord, aspects, dignity) at 390 and 360 |
| `varga_matrix_browser_test.py` | 53 | 5.5 KB | Playwright test of the Varga Matrix at 390 and 360px (`VMX_SHOTS=dir`) |
| `varga_matrix_test.js` | 49 | 4.9 KB | node test for js/153 (cells equal raw varga data, points recomputed by hand, Vargottama, 60 real charts x 3 sets) |
| `varga_open_3d_browser_test.py` | 44 | 3.9 KB | Divisional Charts > Open in 3D: the 3D Sky opens at the birth moment with that varga drawn as the sky, at 390 and 360 |
| `varga_reading_test.py` | 82 | 10.0 KB | Divisional chart readings: 12 charts x 6 vargas cross-checked with the app's own varga data and VDB's D9 vargottama, variation, one-fact sensitivity, Deep reading + report + PDF wiring |
| `vimshopaka_browser_test.py` | 40 | 3.8 KB | Playwright test of the Vimshopaka panel at 390px (`VIM_SHOTS=dir`) |
| `vimshopaka_test.js` | 41 | 4.9 KB | node test for js/135 (weights add to 20, hand-worked scores, 80 real charts x 4 sets) |
| `year_timeline_test.py` | 48 | 4.2 KB | Year Timeline File test: scan + file on a real chart (ids, order, known Saturn/Rahu ingress dates, dasha changes, size) and the panel at 400 px |
| `yoga_engine_test.py` | 177 | 17.3 KB | Yoga engine: 41 hand-built charts that have each yoga and 41 that do not, cross-check with the app's own detectors on 8 real charts, texts, screen and report |

### `tools/` — 10 files, 520 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `assemble.py` | 67 | 2.8 KB | shared helpers: inline css/js, build the shell with embedded apps |
| `build.py` | 25 | 1.3 KB | python3 build.py: writes dist/*, symbols.idx, AI_GUIDE auto block |
| `build_customer.py` | 35 | 1.9 KB | builds dist/customer-edition.html (locked edition) |
| `bundle.py` | 19 | 1.0 KB | makes apps/*/index.bundle.html (one file per app for fast loading); `build.py --bundles` runs just this (used by the git hook) |
| `check_structure.py` | 19 | 1.2 KB | verifies STRUCTURE.md lists every project file |
| `dump_features.js` | 10 | 0.9 KB | node helper for gen_all_features.py: prints HOME_ITEMS, THB.CATS and FG_DATA as JSON |
| `encrypt.py` | 8 | 0.6 KB | encryption helper for the customer edition |
| `gen_all_features.py` | 263 | 15.4 KB | generates docs/ALL_FEATURES.md (the one-file guide: every tool, every file with lines/size/purpose, tests, storage keys); re-run after adding a tool or file |
| `guide.py` | 54 | 3.3 KB | generates symbols.idx and the AI_GUIDE auto map |
| `version.py` | 20 | 1.3 KB | writes version.json (build id + file list) for the silent updater; run by build.py |

### `tools/ai/` — 1 files, 56 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `session.sh` | 56 | 5.3 KB | AI session helper: start / check / test / ship (commit, rebase on moved main, check, push branch, fast-forward main; token only via GH_TOKEN env) |

### `tools/reading_gen/` — 21 files, 2,996 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `build_av.py` | 129 | 21.6 KB | Ashtakavarga reading tables and composer; writes js/107-ashtakavarga-reading.js |
| `build_dd.py` | 191 | 37.5 KB | area deep dive tables and composer; writes js/99-area-deep.js |
| `build_hn.py` | 163 | 21.6 KB | Right now tables and composer; writes js/100-house-now.js |
| `build_la.py` | 156 | 15.9 KB | life-area table (houses, significators, varga, yogas per area), weights, calibration constants and the scoring code; writes js/94-life-areas.js |
| `build_ln.py` | 123 | 21.9 KB | narrative tables (noun/win/slip/stance/practices/questions per area, part sentences, timing, closing) + composer; writes js/95-life-narratives.js |
| `build_nk.py` | 132 | 11.0 KB | writes js/89-vedic-nakshatra-db.js |
| `build_ps.py` | 182 | 28.1 KB | planet states frames, combinations and composer; writes js/102-planet-states.js |
| `build_sb.py` | 179 | 31.0 KB | Shadbala reading tables and composer; writes js/105-shadbala-reading.js |
| `build_ts.py` | 141 | 17.5 KB | transit wording tables (phases, favourable houses) + composer; writes js/97-transit-reading.js |
| `build_vda.py` | 131 | 14.2 KB | dasha planet table + house relations + writes js/91-dasha-reading.js |
| `build_vg.py` | 96 | 11.4 KB | varga table (domain, houses, key planets, intro, questions) + composer; writes js/96-varga-reading.js |
| `build_vmf.py` | 179 | 25.5 KB | manifestation tables (behave, arena, manner, rising) + writes js/90-reading-manifest.js |
| `build_yg.py` | 295 | 55.0 KB | yoga facet table (41 yogas) + detector code, writes js/92-yoga-engine.js |
| `nk_data.py` | 143 | 21.0 KB | nakshatra / planet / purushartha facet tables (+ manifest facets) |
| `p1_masters.py` | 110 | 17.6 KB | master tables (planets, houses, signs, vocabulary) for the knowledge database |
| `p2_planet_house.py` | 135 | 15.0 KB | the 108 hand-written planet-in-house texts + tone markers |
| `p3_more.py` | 144 | 21.1 KB | conjunctions, nakshatras, yogas, dasha lords, status modifiers (hand-written) |
| `p4_build.py` | 150 | 11.9 KB | rule-based tables (planet-in-sign, house lord in house, aspects) + quality gates -> temp json |
| `p5_write.py` | 131 | 9.1 KB | writes js/87-vedic-knowledge-db.js (data + VDB API) |
| `ps_data.py` | 67 | 19.1 KB | planet-by-planet state wording (exalted, debilitated, retrograde, combust, scenes, friction, help) used by build_ps.py |
| `regen.sh` | 19 | 1.8 KB | regenerates all four reading databases (js/87, 89, 90, 91); afterwards `git status` must show no change unless a table was edited |

### `vendor/` — 1 files, 12,399 lines

| File | Lines | Size | Purpose |
|---|---:|---:|---|
| `qrlibs.js` | 12,399 | 306.1 KB | QR code libraries (third party) |

## 10. Tests

113 test files, 6,613 lines. Node `vm` tests check the maths against hand-worked values and published sources; Playwright `*_browser_test.py` tests open each screen at 390 px and 360 px and check there is no sideways scroll. Run with `node tests/<name>.js` or `python3 tests/<name>.py`; `python3 tests/syntax_check.py` checks every file.

| Test | Lines | What it checks |
|---|---:|---|
| `_helpers.py` | 19 | shared Playwright helpers (VAX_TARGET=hosted tests the folder version) |
| `ai_paste_test.js` | 38 | paste-to-fill parser (cURL, JS fetch/axios/SDK, Python requests/SDK) for the AI provider settings |
| `ai_system_browser_test.py` | 93 | AI system: every index entry, route → fetch → answer with a stubbed provider, skills, personas, key rules, panel at 390 and 360 |
| `area_deep_test.py` | 69 | area deep dive: every quoted number vs the chart over 12 charts, wording rules, determinism, Deep reading/report/PDF wiring |
| `argala_browser_test.py` | 42 | Playwright test of the Argala panel at 390px (`ARG_SHOTS=dir`) |
| `argala_test.js` | 42 | node test for js/139 (pair mapping, count rule, Ketu, 3-malefic row, 60 real charts) |
| `ashtakavarga_extras_browser_test.py` | 66 | Playwright test of the Ashtakavarga Workings panel at 390px (`ASX_SHOTS=dir`) |
| `ashtakavarga_extras_test.js` | 95 | node test for js/141 (Prastara column sums equal the app BAV over 100 charts, classic totals, SAV 337) |
| `ashtakavarga_reading_test.py` | 74 | Ashtakavarga reading: every point, total, rank, tier, sign, house and contributor vs chart.ashtakavarga over 12 charts, wording, tab, report and PDF |
| `avasthas_browser_test.py` | 37 | Playwright test of the Planet States panel at 390px (`AVS_SHOTS=dir` for screenshots) |
| `avasthas_test.js` | 45 | node test for js/134 (Baladi edges, compound friendship, Jagradadi/Deeptadi vs app dignity over 120 charts) |
| `ayanamsa_reset_test.js` | 16 | a forgotten permanent KP/Raman choice is erased and ignored on a fresh visit (Lahiri), tab-only choice still works (Node) |
| `ayanamsa_test.py` | 44 | Ayanamsa choice: offsets at J2000, chart shifts by exact offset, saved choice, labels |
| `bhavat_bhavam_browser_test.py` | 37 | Playwright test of the House from the House panel at 390px (`BBH_SHOTS=dir`) |
| `bhavat_bhavam_test.js` | 37 | node test for js/140 (pairs vs two sources, arudha rule hand-worked, 60 real charts) |
| `bhavat_masterclass_browser_test.py` | 86 | Playwright test of the Masterclass at 390 and 360px (`BMC_SHOTS=dir`) |
| `bhavat_masterclass_test.js` | 70 | node test for js/151-152 (formulas vs sources, inverse of all 144 counts, scoring rules, dasha, 60 real charts) |
| `camera_motion_test.py` | 48 | camera momentum test |
| `chakra_explorer_browser_test.py` | 108 | Chakra Explorer in the real app: Home tile, three drawings, date and step controls, every toggle, Kota Paala override, phone width, rebuild if missing (CHX_SHOTS=dir saves screenshots) |
| `chakra_explorer_test.js` | 72 | Chakra Explorer: 81-cell grid, 28 wall cells, ray geometry, Kota zones vs the published lists, Latta examples, Shoola tips, retrograde IN/OUT flip, full render on 60 random moments |
| `choghadiya_avakahada_test.py` | 42 | Choghadiya order for all 7 weekdays, equal slots, Avakahada values for a known Moon, tables match Kundali Matching |
| `classic_moon_test.js` | 18 | Classic Moon (default, no delta-T): reference chart 2007-11-11 02:23 IST Hyderabad gives exactly the trusted Dasha dates (Maha to Prana, to the minute) |
| `compare_lab_test.py` | 56 | Compare Lab test: opens from Divisional Charts, three-dot menu, up to 4 charts, follow a planet, table, notes, copy text |
| `customer_smoke.py` | 44 | customer edition smoke test |
| `dasha_lens_test.js` | 53 | Dasha Lens engine in a Node vm: levels 1-5 equal the app's dasha engine on 1,200 random moments over 3 charts, nesting laws, Prana length, duration text |
| `dasha_reading_test.py` | 62 | Dasha layer: all Mahadashas + Antardashas equal the app's engine on 8 charts, current period, gap-free 5-year window, clean texts, screens + report |
| `dasha_reverse_test.js` | 23 | reverses the reference chart's Dasha chain, window must contain 02:23:00 |
| `date_entry_test.py` | 91 | Julian Day and calendar maths, parseDob, deltaT, typed old/BC dates through the form and every tab |
| `datefinder_test.py` | 68 | Date Finder test |
| `deep_reading_test.py` | 77 | Deep reading: 6 tabs, 12 house cards, every on-screen text equals the database text for the chart's real placements, report section + export checkbox, 6 more charts, phone layout |
| `degree_houses_test.js` | 24 | Degree houses engine (Sripati / Equal): 12 houses cover 360°, Lagna madhya, shifted flag |
| `dosha_late_panels_test.py` | 55 | Dosha Check rules, Choghadiya panel, every new Home card opens non-blank (also with an older js/58) |
| `ephemeris_vs_swiss_test.js` | 42 | REAL-CHART verification: 14 real births vs the Swiss Ephemeris (Moon within 25 arcsec, Ascendant, Lahiri anchor = official ICRC value, delta-T) and 504 Vimshottari boundaries over 6 levels equal an independent calculation |
| `exact_aspects_test.js` | 54 | Exact Aspects engine test (Node, 31 checks): Rahu 5/7/9/conjunction on 18° Gemini, orb edges, 18.6-year repeat, retro passes, Moon, live-sky moving target, window running now |
| `explorer_time_test.py` | 34 | Aspect Explorer follows the app time (not the birth time) when a profile is loaded |
| `export_builder_browser_test.py` | 121 | Export tab at phone width: presets, group All/None, divisional chart picks, remembered selection, txt/json download, split into parts, sky-right-now place, quiet opening of unopened tool pages |
| `export_no_flicker_browser_test.py` | 44 | the Birth Chart Export tab does not flicker while it measures tool pages: always the Export panel on screen, no scroll jump, no fade-in replay, sizes still fill in |
| `feature_guide_browser_test.py` | 51 | Feature Guide at 390 and 360px: cards, one open at a time, search, group chips, Open button, listed in Tools tab |
| `feature_guide_test.js` | 28 | node test: every tool has a full guide entry, links valid, no fear words, search finds plain words |
| `gochara_vedha_test.js` | 52 | node test for js/142 (pair tables vs the published house sets, exceptions both ways, nodes ignored) |
| `gulika_test.py` | 64 | Gulika test: day/night tables, before-sunrise rule, start<middle<end, charts, Planets panel, report text, 3D vs Birth Chart agreement, 3D dashboard |
| `home_chart_first_test.py` | 52 | Home chart-first: chart + Rising/Moon/Sun, details hidden then shown, North/South saved, Explore all tools / back, returns to tools page from a tool, new chart resets |
| `hora_browser_test.py` | 136 | Playwright test of the Hora panel at 390 and 360px (`HORA_SHOTS=dir`) |
| `hora_test.py` | 67 | Playwright test of the Hora engine against panchangaAt (order, contiguity, Drik day/night lengths) |
| `house_now_test.py` | 67 | Right now: sky, dasha chain, signs, lords, Ashtakavarga and scores vs the engines at two dates over 12 charts, wording, first tab, report and PDF |
| `knowledge_db_test.py` | 74 | Knowledge database: completeness, quality gates, cross-check of signs/nakshatras/aspects/dignity against the app tables, `VDB.reading()` on real charts |
| `kp_test.py` | 51 | KP: sub/sub-sub lord bisect over all 27 nakshatras, Placidus checks, significators, panel, KP ayanamsa button |
| `life_areas_test.py` | 79 | Life-area engine: bounds, determinism, calibration spread on 12 charts, per-input sensitivity, Deep reading + report + PDF wiring |
| `life_event_pro_test.js` | 37 | Life-Event Pro engine in a Node vm: catalog integrity, dasha equals the app engine, recovers a known rising sign and time, flags wrong dates, random events stay below a 40% floor |
| `life_narratives_test.py` | 77 | Life-area narratives: 12 charts x 9 areas (length, structure, wording, consistency with scores), variation, sensitivity, Deep reading + report + PDF wiring |
| `manifest_test.py` | 86 | Manifestation layer: 1296 unique combinations, grammar/voice/wording gates, signature matches real chart data on 8 charts, on-screen blocks and report |
| `meaning_lab_test.js` | 13 | Meaning Lab: panel builds, database lookups for lord/planet pieces |
| `nakshatra_db_test.py` | 80 | Nakshatra layer: 972 unique placements, wording gates (no fatalistic/absolute words), pada->navamsa equals the app's D9 on 8 charts, Moon star = dasha start, on-screen check |
| `notepad_sidemenu_test.py` | 49 | Notepad side menu redesign: stats tiles, quick find, collapsible sections (saved), tag chips + show all, recent notes, solid drawer, at 1100 and 390 px |
| `notepad_test.py` | 88 | Notepad test: typing order, note links, templates from every view, side menu, Settings tab switches (copy buttons off by default), at 390 px and 1280 px |
| `panchang_calendar_browser_test.py` | 60 | Panchang Calendar at phone width: grid, navigation, day detail, Purnimanta, open Panchanga for a day |
| `panchang_calendar_test.js` | 53 | node test for js/146 (2026 festivals vs drikpanchang New Delhi, eclipses vs NASA, 24 months continuous, counts, Purnimanta) |
| `past_present_future_browser_test.py` | 71 | Playwright test of the Past · Present · Future panel at 390 and 360px (`PPF_SHOTS=dir`) |
| `pdf_download_test.py` | 41 | PDF download: a real multi-page A4 .pdf file is saved directly, no print window, page plan cuts only at block ends |
| `pdf_report_test.py` | 84 | PDF report: 4 theme/paper variants x 4 charts clean and self-contained, sections/options, Studio dialog, real PDF render |
| `planet_encyclopedia_test.py` | 49 | Planet Encyclopedia test: Home card, 9 planets x 6 tabs have text, Saturn/Mars aspects and dignities, taps, 390 px |
| `planet_states_test.py` | 79 | planet states: tags vs the chart over 12 charts, every planet x state paragraph, wording, Planets tab, report and PDF wiring |
| `popular_charts_test.py` | 77 | Popular charts section: 10 groups x 10 people, lazy Wikipedia photos (wrong-person guard), detail sheet, casting a chart incl. old-timezone option, no JS errors |
| `prashna_test.py` | 45 | Prashna: Ithasala/Easarapha maths, topic houses, panel, styles, rebuild if missing |
| `problem_finder_test.py` | 144 | Problem finder: every fact in every reason vs the chart over 12 charts x all areas x all problems, wording, click-through, Home tile |
| `prod_forms_check.py` | 26 | Deep reading inside the real production forms (single-file build + customer edition): 6 tabs, 12 house cards, 9 planet blocks, all layers loaded, report section |
| `quick_menu_test.py` | 56 | Quick Menu: descriptions, collapsible sections, search by name or description, Organise (pin/group), Recent, Enter to open, 390 px |
| `reading_qa_test.py` | 74 | S11 QA: 12 charts incl. edge cases; whole-report invariants (sections, junk text, banned absolutes, duplicates, word counts, headline/band match, determinism, PDF); `--sheet` rewrites docs/ASTROLOGER_REVIEW_SHEET.md |
| `reading_style_test.py` | 54 | reading style: hooks, progress, explored dots, next-up, hero, headline sizes, 3 phone/desktop widths, reduced motion |
| `rising_lines_test.py` | 60 | rising lines test |
| `rising_navamsha_test.py` | 41 | 3D rising view Navamsha test: current Navamsha line, 12 signs x 9 Navamshas, order rule per sign type, boundary accuracy, tap and back |
| `rising_popup_test.py` | 69 | rising popup test |
| `sensitive_degrees_browser_test.py` | 35 | Playwright test of the Sensitive Degrees panel at 390px (`SDG_SHOTS=dir`) |
| `sensitive_degrees_test.js` | 57 | node test for js/137 (tables vs two independently typed source tables, window edges, 80 real charts) |
| `shadbala_reading_test.py` | 72 | Shadbala reading: every number, rank, tier and component vs chart.shadbala over 12 charts, wording, Strength tab, report and PDF |
| `sky3d_date_test.py` | 47 | 3D app BC/Julian date maths and Day/Month/Year checks (node, no browser) |
| `sky3d_export_studio_browser_test.py` | 123 | Export Studio: structured Markdown / JSON / text output, section and option switches, copy and download, the sheet at 390 and 360 |
| `sky3d_formula_maker_browser_test.py` | 148 | Formula Maker: karakas, Bhrigu Bindu, Yogi points, relations, tri-state, every library formula, share round-trip, scan, and the sheet at 390 and 360 |
| `sky3d_navamsha_tools_browser_test.py` | 55 | 3D Sky Tools drop-down, Eye, Navamsha sky toggle and D9 math at 390 and 360 (Three.js stubbed; `S3_SHOTS=dir` for screenshots) |
| `sky3d_profile_moment_browser_test.py` | 90 | 3D Sky at phone width (Three.js stubbed): Reverse play both ways and pause, Make a profile from the current moment and from a saved moment |
| `sky3d_shadbala_test.js` | 44 | engine parity with the Birth Chart plus live adapter checks |
| `sky3d_sky_alerts_browser_test.py` | 50 | Sky alerts rules (`SKA.calc`), HUD pill and bottom sheet at 390 and 360 |
| `sky3d_timeline_finder_browser_test.py` | 82 | Timeline finder: ingress dates vs known values, Sun in Libra + Moon in Pisces, ALL vs ANY, planets meet, the sheet at 390 and 360 |
| `sky3d_ui_refresh_browser_test.py` | 59 | 3D Sky at 390 and 360 wide (Three.js stubbed): slim timeline, buttons in one row, All-tabs grid opens each tab, no overflow |
| `sky3d_varga_parity_test.js` | 25 | the 3D Sky's varga rules equal the Birth Chart's for all 24 vargas and every degree; D9 equals the Navamsha sky |
| `sky_dashboard_test.py` | 34 | Sky Dashboard test: button, all sections, 9 cards, 9x9 matrix, summary text, close |
| `smoke.py` | 49 | main end-to-end smoke test |
| `startup_bundles_browser_test.py` | 46 | the shell loads the per-app bundles: bundles are fresh, same globals as the plain source files, no page errors, Formula Maker and Birth Chart usable, far fewer requests |
| `sudarshana_browser_test.py` | 45 | Playwright test of the Sudarshana panel at 390px (`SDC_SHOTS=dir`) |
| `sudarshana_test.js` | 45 | node test for js/138 (year cycle, ring geometry, nature rules, 60 charts x 6 years) |
| `synastry_browser_test.py` | 55 | Synastry panel at phone width: Home card, pickers, swap, tables, no sideways scroll |
| `synastry_test.js` | 65 | node test for js/143 (hand-worked houses, aspects and scores; 60 chart pairs give mirrored tables and contacts when swapped) |
| `syntax_check.py` | 17 | node --check over every js file |
| `time_sky_test.js` | 15 | Time sky panel: Dasha at 3 moments + rising/D9 segments (contiguous, 2 h, 6+ segments) |
| `time_wheels_test.py` | 46 | 3D date picker test: five snap wheels, tap/scroll select, steppers with month-end clamp, typed date |
| `today_for_you_test.py` | 79 | Today for You: Chandrabala/Tarabala/Gochara maths over 10 days, tone, slots, panel, new profile |
| `tools_hub_browser_test.py` | 61 | Tools tab at phone width: bar fits, search, chips, open a tool, recents |
| `tools_hub_test.js` | 56 | node test for js/147 (every tool listed exactly once, groups, search words, recents) |
| `transit_reading_test.py` | 79 | Transit reading: planet signs, sign-change dates, Sade Sati/Dhaiya phase and double-transit windows checked against the ephemeris on 12 charts; outlook bounds; date sensitivity; Deep reading + report + PDF wiring |
| `trigger_lab_test.js` | 40 | Trigger Lab engine: periods contiguous, pattern + rule hold at every found window, aspect/nakshatra rules |
| `upagrahas_browser_test.py` | 35 | Playwright test of the Upagrahas panel at 390px (`UPA_SHOTS=dir`) |
| `upagrahas_test.js` | 31 | node test for js/136 (hand-worked values, 180-degree invariants over 1000 Suns, 60 real charts) |
| `updater_test.py` | 29 | silent updater: stale build triggers one silent reload and re-download, current build does nothing |
| `varga_guide_test.py` | 46 | Divisional chart guide test: one guide per chart, all sections, tagged rules, follows the chart picker |
| `varga_house_details_browser_test.py` | 39 | Divisional Charts House details tab (one column, nakshatra, pada, lord, aspects, dignity) at 390 and 360 |
| `varga_matrix_browser_test.py` | 53 | Playwright test of the Varga Matrix at 390 and 360px (`VMX_SHOTS=dir`) |
| `varga_matrix_test.js` | 49 | node test for js/153 (cells equal raw varga data, points recomputed by hand, Vargottama, 60 real charts x 3 sets) |
| `varga_open_3d_browser_test.py` | 44 | Divisional Charts > Open in 3D: the 3D Sky opens at the birth moment with that varga drawn as the sky, at 390 and 360 |
| `varga_reading_test.py` | 82 | Divisional chart readings: 12 charts x 6 vargas cross-checked with the app's own varga data and VDB's D9 vargottama, variation, one-fact sensitivity, Deep reading + report + PDF wiring |
| `vimshopaka_browser_test.py` | 40 | Playwright test of the Vimshopaka panel at 390px (`VIM_SHOTS=dir`) |
| `vimshopaka_test.js` | 41 | node test for js/135 (weights add to 20, hand-worked scores, 80 real charts x 4 sets) |
| `year_timeline_test.py` | 48 | Year Timeline File test: scan + file on a real chart (ids, order, known Saturn/Rahu ingress dates, dasha changes, size) and the panel at 400 px |
| `yoga_engine_test.py` | 177 | Yoga engine: 41 hand-built charts that have each yoga and 41 that do not, cross-check with the app's own detectors on 8 real charts, texts, screen and report |

## 11. Docs and plans

- `AI_GUIDE.md` (732 lines) — rules + prompt router for AI (partly auto-generated)
- `CLAUDE.md` (10 lines) — pointer to AI_GUIDE.md and STRUCTURE.md
- `README.md` (54 lines) — human readme
- `STRUCTURE.md` (650 lines) — this file
- `docs/AI_START_HERE.md` (31 lines) — The repeatable AI session system: start prompt, session loop (session.sh start/check/test/ship), token hygiene, where things are, layer rules, lessons learned. READ FIRST in every new chat
- `docs/AI_SYSTEM_PLAN.md` (21 lines) — plan and architecture of the AI system (index, engine, panel)
- `docs/ALL_FEATURES.md` (2,045 lines) — GENERATED one-file guide to the whole app (what it is, every tool and what it does, 3D Sky features, every file with lines, size and purpose, tests, storage keys); regenerate with `python3 tools/gen_all_features.py`, never hand-edit
- `docs/APP_NAVIGATION_PLAN.md` (69 lines) — Plan to make every tool fast to reach: measured audit (32 tools, Home = 4 screens, 17 tools without a bottom tab), target hubs Start/Chart/Time/Strength/Tools with a place for every tool, 9 sessions N1-N9, acceptance tests, decisions. Read with AI_START_HERE
- `docs/ASTROLOGER_REVIEW_SHEET.md` (197 lines) — generated by `python3 tests/reading_qa_test.py --sheet`: per-chart area scores for a human astrologer to mark OK / Disagree
- `docs/ASTRO_FEATURES_PLAN.md` (272 lines) — Handoff plan for the astrologer tools the app still lacks (avasthas, Vimshopaka, upagrahas, sensitive degrees, Sudarshana, Argala, Ashtakavarga extras, Gochara vedha, synastry, Muhurta, Panchang calendar, remedies): ordered checklist A0-A14, source rules, per-step detail, session log. A new chat starts here
- `docs/DOOR.md` (37 lines) — door / licensing site notes
- `docs/EXPORT_STUDIO_PLAN.md` (12 lines) — plan for the structured 3D Sky export and its control screen
- `docs/FORMULA_MAKER_PLAN.md` (49 lines) — plan for the 3D Sky Formula Maker (subjects, relations, evaluator, find dates, library, sharing, UI)
- `docs/FULL_READING_PLAN.md` (127 lines) — Plan for the PDF-grade full reading: audit of what exists, gaps, architecture, 12 sessions with checklist, working rules, decisions. READ FIRST in every reading session
- `docs/HANDOFF.md` (6 lines) — handoff notes
- `docs/HORA_PLAN.md` (31 lines) — Hora plan, checklist and research log (sources, where teachers differ)
- `docs/RELEASE_CHECKLIST.md` (28 lines) — owner's checklist for selling the PDF reading: review, brand, disclaimers, delivery, licences, quality gates, AI-writer decision
- `docs/STARTUP_SPEED_PLAN.md` (57 lines) — plan for faster start-up: bundle each app, load rare features on first open, how to measure, and the rule every new feature follows
- `docs/SUPABASE.md` (29 lines) — Supabase cloud-sync notes
- `docs/THIRD_PARTY_LICENSES.md` (236 lines) — third-party licences
- `docs/TIMELINE_FINDER_PLAN.md` (13 lines) — plan, method and accuracy notes for the 3D Sky Timeline finder
- `docs/VARGA_3D_PLAN.md` (11 lines) — plan for opening any divisional chart as a sky in the 3D Sky
- `docs/YEAR_TIMELINE_RESEARCH.md` (139 lines) — Research + plan for the "Year Timeline Pack" (date-range, AI-ready data file: timeline, transits, dasha changes, planet role map); sources, file layout, reuse map, build order

## 12. Rules every contributor follows

1. Read `AI_GUIDE.md` then `STRUCTURE.md`; never read `dist/`. Find code with `grep -P "^symbol\t" symbols.idx`.
2. Keep a plan file; **rebase on the latest `origin/main`** at the start, before each commit and before each push.
3. Research each feature in at least two sources; tendency wording only.
4. Test: node `vm` tests plus Playwright at phone width (360 px must work); look at the screenshots.
5. New tool = `HOME_ITEMS` row (js/25) + `reg()` (js/120) + `THB.CATS` group (js/147) + a **Feature Guide entry** (js/149, `FG_DATA.e`) + `STRUCTURE.md` + an AI_GUIDE changelog line.
6. New feature follows the startup-speed plan: load on first open, no heavy boot work, report the KB added.
7. Own CSS class prefix per feature; animate only `transform` and `opacity`.
8. Visible UI change: show screenshots, commit locally, wait for approval before pushing. Backend/doc steps are pushed straight away to `main`, `Root` and `feature/astro-roadmap`.

## 13. How to keep this file true

Run `python3 tools/gen_all_features.py` after adding or changing a tool or file. It re-counts every file, re-reads `STRUCTURE.md`, and re-reads the tool list and Feature Guide from the code, then rewrites this file. Because the tool texts come from `FG_DATA`, updating the Feature Guide (rule 5) updates this file automatically.

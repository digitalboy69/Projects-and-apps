# App Navigation Plan (make every tool easy and fast to reach)

Goal: any tool in at most 2 taps from anywhere, a short Start screen instead of a 4-screen tile list, one source of truth for the tool list,
and the other apps (3D Sky, Notepad, Developer, Signal Decoder) feeling like part of the same suite. **Navigation only: no calculation changes.**
Read docs/AI_START_HERE.md first (session loop, `tools/ai/session.sh`), then this file. Last updated: Session 0 (audit + plan).

## 1. Audit (measured on a phone viewport, 390x844, not guessed)
| Fact | Value |
|---|---|
| Panels in the Birth Chart app | 26 (`.app-panel`); 32 tools on the Home grid (`HOME_ITEMS` in `js/25-home-and-tabs.js`) |
| Home sections | Your Chart 6, Fix Birth Time 6, Time & Cycles 9, Analysis 8, Compatibility 1, Export & Help 2 |
| Home length | **4 screens** of scrolling after the profile header, "Your planets" and "Quick start" blocks |
| Bottom bar | 5 tabs: Home, My Chart, Rectify, Match, Export. **17 tools (Time & Cycles 9 + Analysis 8) have no bottom-bar entry**: Home grid only |
| Inside panels | Chart Reading has 6 tabs; no shared sub-navigation pattern elsewhere |
| Search | exists (header "Search tools, planets, terms"), `js/31-smart-search.js`, but is one of several parallel ways to navigate |
| Other apps | 3D Sky has 13 tabs (chart, conjunctions, degree, export, natal, retro, returns, rising, sky, solar, transits, triggers, view); Notepad; Developer; Signal Decoder (separate app); door-site / pay-hub deploy elsewhere |
| Duplication | the tool list lives in several places (HOME_ITEMS, bottom bar, search groups, smart-search panel refs) |

## 2. Problems to fix
1. Time & Cycles (9) and Analysis (8) are hidden behind Home and a long scroll; Rectify and Match have bottom tabs although they are used less than Time.
2. Related tools are scattered: dasha / 36 dasha systems / transits / Sade Sati / Live Sky / Life Activation / Year Timeline / Panchanga are all "time" but sit apart.
3. Strength tools (Shadbala, Bhava Bala, Ashtakavarga) and meaning tools (Yogas, Sahams, Fate Meter, Numerology, Relationships) are mixed in one list.
4. After opening a tool there is no "what next": you go back to Home and scroll again.
5. Each app has its own navigation; the active person is not obviously the same everywhere.
6. All 26 panels are built when a chart is cast (check in N7), which slows the first result.

## 3. Target structure (every existing tool gets a place; no tool is removed)
Bottom bar (5): **Start | Chart | Time | Strength | Tools**. Each hub (except Start) has a row of chips (segments) at the top; chips remember the last one used.
| Hub | Chips -> existing panels |
|---|---|
| **Start** (<= 1.5 screens) | profile switcher, "Now" card (running dasha + transit highlight, from `panel-active` / `panel-transit` data), Continue (last tool), Pins (up to 6), Search, Share/Open a chart, examples, Popular charts |
| **Chart** | Reading `panel-reading` · Chart `panel-overview` · Planets `panel-planets` (+ Relationships `panel-relationships`) · Houses `panel-bhava` (+ Bhava Bala `panel-bhavabala`) · Divisional `panel-vargas` · Lagnas `panel-lagnas` |
| **Time** | Now: Live Sky `panel-transit`, Life Activation `panel-active` · Dasha: Dasha `panel-dasha`, 36 Dasha Systems `panel-dashasys` · Transits: Transits & Sade Sati `panel-transits` · Calendar: Panchanga `panel-panchanga`, Vedic Birthday `panel-vbday`, Tithi Pravesh `panel-tithi` · File: Year Timeline `panel-yeartimeline` |
| **Strength** | Planets: Shadbala `panel-shadbala` · Points: Ashtakavarga `panel-ashtakavarga` · Yogas `panel-yogas` · Sahams `panel-sahams` · Fate Meter `panel-fate` · Numbers: Numerology `panel-numerology` |
| **Tools** | Fix birth time: Rectification Studio `panel-rectification`, Date Finder `panel-datefinder`, Sandhi `panel-sandhi`, Varga Timeline `panel-vargatimeline`, Transit Timer `panel-transittimer`, Life-Event Checker `panel-lifeevents` · Match `panel-match` · Export & Share `panel-export` · Apps (3D Sky, Notepad, Developer, Signal Decoder) · Help `panel-contact` |
Rules: 2 taps max (hub, chip); Start also reaches any tool through Search or Pins; the old panel ids and deep links (`#c=` share links, search results, smart links) keep working through one `openTool(id)`.

## 4. Principles
One registry (`TOOLS`: id, title, icon, hub, chip, keywords, related[]) feeds the bottom bar, hubs, Start, Search and "Related tools"; nothing else lists tools.
Plain words. Show the 4-7 most useful things first; the rest one tap away. Every tool ends with a "Related tools" strip (from the registry). Remember last chip per hub, last tool, last profile.
Do not change calculations or panel contents; do not break the customer edition (brand header), the shell, or share links.

## 5. Sessions (each = one "Continue" block)
Every session: build -> only the tests it touches -> `session.sh ship`. Merge to main at milestones (NM1-NM3). Acceptance tests are listed per session.
- [ ] **N1 Registry**: `js/` file with `TOOLS` (all 32 + 3 Start extras); generate HOME_ITEMS, smart-search groups and bottom bar from it; no visible change yet. Test: every `.app-panel` id is in the registry exactly once; registry ids all exist.
- [ ] **N2 Hubs + new bottom bar**: Start / Chart / Time / Strength / Tools with chips; `openTool(id)` keeps all old entry points working; remember last chip. Test (`tests/nav_taps_test.py`): all 32 tools open in <= 2 taps from 3 different starting panels; old deep links still land on the right panel.
- [ ] **N3 Start screen**: replaces the 32-tile grid: profile switcher, Now card, Continue, Pins (<= 6, localStorage), Search, Share/Open, Popular charts. Test: Start <= 1.5 screens at 390x844; pin/unpin works; Continue reopens the last tool. **-> NM1 (merge)**
- [ ] **N4 Search as the fast lane**: focus shows recent + popular tools; each tool findable by 3 synonyms (registry `keywords`); result opens in 1 tap; planets/terms still work. Test: 32 tools x 3 synonyms.
- [ ] **N5 Related tools + "what next"**: strip at the bottom of every panel from `related[]` (e.g. Dasha -> Transits, Live Sky, 3D Sky at this date; Reading -> Time hub). Test: no panel without a strip; links resolve.
- [ ] **N6 One suite**: shell app switcher becomes an "Apps" sheet (also reachable from Tools); one active person shared by Birth Chart / 3D Sky / Notepad (audit first: how profiles are stored in each app); deep links "Open in 3D Sky at this date", "Back to chart". **-> NM2**
- [ ] **N7 Speed**: build panels lazily on first open (cast time before/after measured and recorded here); skeletons; keep scroll position per panel; swipe between chips on phones.
- [ ] **N8 3D Sky tabs**: 13 tabs into 4 groups (Sky now / Natal & timing / Find / Share) with the same chip pattern.
- [ ] **N9 QA + polish**: taps metric test in CI list, phone + desktop, customer edition, a11y labels, docs; **-> NM3**

## 6. Acceptance (the whole plan)
1. Any of the 32 tools: <= 2 taps from anywhere (test-enforced). 2. Start <= 1.5 screens. 3. First useful screen after casting a chart: 0 extra taps. 4. All old panel ids / deep links / share links work. 5. Each tool is found by name and 3 synonyms. 6. Cast-to-first-paint not slower (N7 improves it). 7. Customer edition and shell unaffected.

## 7. Decisions (defaults chosen; change by telling me)
| # | Question | Default |
|---|---|---|
| 1 | Bottom bar | Start / Chart / Time / Strength / Tools |
| 2 | Match and Rectify get their own tab? | No: inside Tools, plus Start quick actions (they are workflows, used less than Time) |
| 3 | Old Home grid | Replaced by Start + Tools hub; full list stays reachable via Tools and Search |
| 4 | Pins | up to 6, stored on the device |
| 5 | Language | plain words (Time, Strength, Tools) |
| 6 | Other apps | stay separate apps; linked from Tools > Apps and by contextual links |

## 8. Notes log
- Session 0: audit and plan written (numbers above). Nothing built yet.

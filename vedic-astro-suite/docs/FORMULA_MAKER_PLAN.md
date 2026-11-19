# Formula Maker (3D Sky) — plan

Goal: let anyone build, test, find, save and share their own astrology "formulas" (a formula is a set of yes/no rules about a chart) from every ingredient the app knows: planets, signs, nakshatras, degrees, aspects, conjunctions, houses, Chara Karakas (AK to DK), Bhrigu Bindu, Yogi points, Lagna, Arudha padas, Gulika and more. A formula can be checked on a person, on the sky now / on the 3D date, or scanned through time to find every date it was true.

## Research (two sources each)
- Chara Karakas: planets ranked by degree inside the sign, highest first. 7-karaka scheme (Sun..Saturn): AK, AmK, BK, MK, PuK, GK, DK. 8-karaka scheme adds Rahu (degree = 30 minus its in-sign degree; Ketu excluded) and Pitrikaraka (PiK) between MK and PuK. (Wikipedia "Atmakaraka", jagannathhora.com 8-karaka guide.)
- Bhrigu Bindu: midpoint of Moon and Rahu on the shorter arc. (astrosight.ai, Narasimha Rao article.)
- Yogi point = Sun + Moon + 93°20'. Avayogi point = Yogi + 186°40'. Yogi / Avayogi planet = Vimshottari lord of the nakshatra of that point. Duplicate Yogi (Sahayogi) = lord of the sign holding the Yogi point (one source uses the sign of the Yogi planet; we state our choice in the app).
- Pancha Mahapurusha: Mars, Mercury, Jupiter, Venus, Saturn in own / exaltation sign in a kendra (1/4/7/10) from Lagna.
- Special lagnas follow the Birth Chart app's own code (Arudha, Indu, Hora, Ghati, Karakamsa, Swamsha).

## Data model (plain JSON, versioned)
Formula = `{v:1, id, name, about, scheme:7|8, root:Group}`
Group = `{g:'all'|'any'|'none'|'atleast', n, items:[Group|Rule]}`
Rule = `{a:[Operand], q:'any'|'all', r:relation, b:[Operand], p:{params}, neg}`
Operand = `{k:'planet'|'role'|'point'|'lord'|'yogi'|'arudha', v, of:'C'|'N'|'S'|'P'}`
- `C` the chart being checked (default), `N` the chosen person, `S` the sky moment, `P` second person.

## Subjects
9 planets; roles AK AmK BK MK PiK PuK GK DK (7/8 toggle); Lagna, Bhrigu Bindu, Yogi point, Avayogi point, Yogi planet, Avayogi planet, Duplicate Yogi, Gulika, Hora and Ghati lagna, Indu lagna, Karakamsa, Swamsha, Arudha pada AL (A1) to A12 (UL = A12), lord of house 1–12. Sign-only points carry no degree, so degree rules on them are "unknown".

## Relations
in sign, in nakshatra, in pada, in house (from Lagna or from another subject), same sign, conjunct within orb, aspects (graha drishti, a→b or mutual), angle ±orb (0/60/90/120/150/180), degree-in-sign range, longitude range, near a longitude, same nakshatra, rules (lord of sign/house), dispositor of, sign exchange, retrograde / direct, combust, dignity, vargottama, gandanta, sign in a varga (D2..D144 via VG), nakshatra lord of.

## Evaluation
Tri-state (true / false / unknown). Each rule produces a plain-English sentence with the actual values; groups combine children (all / any / none / at least N). Unknown never counts as true. The result is a tree shown with ✓ ✗ ?.

## Modes
1. Check: person birth chart, sky on the 3D date, now, or any date.
2. Find dates: scan a range (ages from today or calendar years) with a step set by the fastest planet involved, edges bisected, chunked and cancellable. Scan as sky (transit) or as birth charts (reverse-engineer birth dates; Lagna rules unknown without time and place). Tap a window to open that day in 3D.

## Library
About 30 neutral presets (Gajakesari, Budhaditya, Chandra-Mangala, five Mahapurusha, Kemadruma, Sunapha, Anapha, Duradhara, Kaal Sarp, Sade Sati, Guru-Chandal, Angarak, Grahan, Manglik, Shani Dhaiya, Libra Sun + Pisces Moon, AK/DK links, Bhrigu Bindu transits…). Definitions only, no predictions.

## Sharing
Share code `VF1.<base64url JSON, short keys>`; link `#f=VF1...` imports and opens the maker; plain-English card text; JSON download; Web Share; import by pasting code, link or JSON; Saved list in localStorage (rename, duplicate, delete, export / import all). Buttons never start with "Copy" (copy-toggle hides them).

## UI
Full-screen sheet `#fmSheet`, prefix `fm-`, tabs Build / Result / Library / Saved, opened from the Tools menu button `#fmBtn`. Operand picker as a bottom sheet, chip-based rule editor, "chart points" panel listing the person's AK..DK, BB, Lagna, Yogi, etc. Tap targets ≥ 44px, only opacity/transform animate, no backdrop-filter. Checked at 390 and 360 px.

## Files
- `apps/sky3d/js/67-formula-engine.js` — global `FM`: points, operands, relations, evaluator, scan
- `apps/sky3d/js/68-formula-library.js` — presets and share codec
- `apps/sky3d/js/69-formula-ui.js` — sheet UI
- `apps/sky3d/css/36-formula-maker.css`
- tests: `tests/sky3d_formula_engine_test.js` (node, stubbed engine) and `tests/sky3d_formula_maker_browser_test.py`

## Done when
Engine tests pass against known charts; Library formulas evaluate; share code round-trips; screenshots at 390/360 clean; Feature Guide, STRUCTURE, AI_GUIDE updated; build and feature-guide tests green. No push until the user says so.

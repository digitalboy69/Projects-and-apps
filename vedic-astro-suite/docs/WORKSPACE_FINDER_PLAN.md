# Workspace Point Finder — plan

Owner request (2026-11-21): pick any "variable" (a planet, the Atmakaraka, the Darakaraka, a house lord, a special lagna ...) and find where the same thing stands in the D9 or any divisional chart. It must work for every kind of variable the app knows, not just planets, and be usable in a routine.

## Reasoning
1. A "variable" in this app is always one of: a planet (9, plus Uranus, Neptune, Pluto), a role that names a planet (Chara Karakas AK..DK, lord of house 1–12, nakshatra lord of Moon or Lagna, the dasha lord running now, strongest and weakest planet by Shadbala), or a point with its own longitude (Lagna, Gulika, Hora, Ghati, Shree, Pranapada, Bhava, Vighati lagnas, Bhrigu Bindu), or a sign-only point (Arudha Lagna, Upapada, Karakamsha, Indu, Swamsha...).
2. To find it in a divisional chart you need its longitude: the app's own `calcVarga(key, longitude)` gives the sign in any of the 23 charts, and `chart.vargas[key].planetVargaSign` is the engine's own table for planets (the two must agree; the test checks it). Lagna in a chart is `vargas[key].ascendantSign`.
3. Sign-only points have no degree, so they cannot be placed in D9 honestly. The finder shows their D1 sign and says "sign only, no degree, so no place in other charts" instead of guessing.
4. Meaning of the result (two sources: Wikipedia "Varga (astrology)" and astrosight.ai "Vargottama"): a planet in the same sign in D1 and D9 is Vargottama. We call it Vargottama only for D9, and "same sign as D1" for other charts. Dignity in a chart comes from the sign it falls in, with the app's own `getDignity` (same as VGR).

## What gets built
- `js/163-workspace-points.js` (global `AWP`): `AWP.resolve(id, chart, profile)` -> `{id, label, group, kind:'planet'|'point'|'sign', planet, lon, sign, note}`; `AWP.locate(chart, subject, vkey)` -> sign, house from that chart's Lagna, dignity, vargottama / same-as-D1, planets in the same sign, sign lord and where that lord stands; `AWP.all(chart, subject)` -> the same for all 23 charts plus a summary (own/exalted/vargottama counts).
- Engine (`js/160`): `AW.SUBJECTS` catalogue (ids, labels, groups) so routines can store a subject; option types `subject` (grouped select) and `subjects` (several, with preset buttons: Karakas, Planets, House lords, Special lagnas).
- New cards (`js/161`): **Where is it?** (one point, one chart, chart drawn with the point highlighted), **Everywhere** (one point across all 23 charts as a strip and list), **Points in a chart** (several points in one chart as a table). `Reading of a planet` now takes any planet-valued variable (Atmakaraka reading, 7th lord reading).
- UI (`js/162`): grouped selects and chips in the step sheet; a **Point finder** view on the Workspace list (pick a point and a chart, see the answer at once, "Add to a routine" button).
- Chart builders already tag planets with `data-p`; the card adds a glow class to the chosen planet.

## Honesty rules
No prediction text. A point that cannot be resolved (no birth time for Lagna, no Shadbala) says so in plain words. Sign-only points are marked as such.

## Tests
`tests/workspace_points_test.py` (browser): for the demo charts, every planet in every chart: `AWP.locate` sign equals `planetVargaSign`; the lon-based path (`calcVarga`) equals it too; AK resolves to the planet with the highest degree; DK to the lowest; lord of 7th matches the house table; the card text shows the same sign as the chart; the finder opens and adds a step. `workspace_engine_test.js` gains subject option checks. Screenshots at 390 and 360.

## Done when
Selecting Atmakaraka and D9 shows its D9 sign and house and highlights it on the chart; Everywhere lists all 23 charts; the same step in a routine opens on another chart with that chart's Atmakaraka; all tests green; Feature Guide, STRUCTURE, AI_GUIDE updated. Local commit; push only when the owner says so.

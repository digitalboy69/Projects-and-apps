# Workspace: my own variables — plan

Owner request (2026-11-21): users can create their own variables, then use them everywhere a built-in variable works (Point finder, Where is it, Everywhere, Points in a chart, Reading of a planet, routines).

## Reasoning
A built-in variable is "a name for a planet or a point in this chart" (Atmakaraka, lord of the 7th, Gulika). Astrologers define their own the same way: by starting from something known and following a short rule. Examples: "my marriage planet = the lord of the sign the Darakaraka stands in"; "7th lord from the Moon"; "the strongest of Jupiter, Venus and Mercury"; "the planet that rules the nakshatra of my Lagna lord". So a custom variable is a small recipe with two parts, and nothing else (no free code, so nothing can break or be unsafe):
1. A **start**: either any existing variable (built-in or one of your own, up to 4 levels deep, loops refused), or a **pick** among a set of variables by a measure: strongest / weakest by Shadbala, or highest / lowest degree in the sign.
2. Zero or more **steps**, applied in order, each turning the current thing into the next:
   - the lord of the sign it stands in (dispositor)
   - the nakshatra lord of it (needs a degree)
   - the Nth house from it (N = 1 to 12; gives a sign)
   - the lord of that sign (sign to planet)
The result is a planet, a point with a degree, or a sign-only point. A planet or a point with a degree can be found in D9 or any divisional chart exactly like a built-in variable; a sign-only result is shown in D1 only, and the screen says why (same rule as Arudha Lagna).

## Storage and sharing
Saved in localStorage `vax_workspace_vars_v1` (name, start or pick, steps, note). Ids look like `cv:xxxxxx`. A routine's share code now carries the definitions of the custom variables it uses, so the receiver gets a working routine; on import the ids are re-issued and remapped. A backup file includes variables.

## Where it shows
- Workspace list: a "My variables" section with cards (name, plain-English description, "= Mercury" for the chart on screen) and "New variable".
- Variable editor view: name, start (grouped select or "pick among" with chips), steps list with up/down/delete, live preview: what it equals in this chart, and where that is in D1 and D9.
- Every picker (Point finder, step sheet selects and chips) lists "My variables" as a group.
- Point finder gets "Make my own variable".

## Files
- `js/164-workspace-vars.js` (`AWV`): storage, sanitising, plain-English description, evaluation, draft preview, bundling for sharing.
- `js/160` accepts `cv:` ids in subject options and keeps `AW.subjectList()`; `encode/decode` carry variable definitions.
- `js/163` resolves `cv:` ids through AWV.
- `js/162` the editor view, list section, picker merging; `css/90`.

## Honesty rules
Every variable shows how it was worked out in words. A step that cannot apply (for example a nakshatra lord of a sign-only point) says so and the variable shows "not available" instead of a guess.

## Tests
`tests/workspace_vars_test.js` (node: sanitising, loops, description, limits) and `tests/workspace_vars_browser_test.py` (create "my marriage planet", "7th lord from the Moon", "strongest of Jupiter, Venus, Mercury"; each compared with an independent calculation on three charts; used in the finder and in a routine; share code carries it; edit and delete). Screenshots at 390 and 360.

## Done when
A user can build a variable in the editor and use it everywhere; results match independent checks; tests, build, Feature Guide, STRUCTURE, AI_GUIDE updated; local commit; push only when the owner says so.

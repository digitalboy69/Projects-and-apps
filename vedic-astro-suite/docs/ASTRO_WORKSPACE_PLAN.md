# Astrologer Workspace (Birth Chart) — plan

Owner request (2026-11-21): a new tab placed just before Export. An astrologer who always checks the same things in the same order (D1, D9, a dasha, a yoga list, ...) builds one saved **routine** once. It lives in the device's local storage. For any chart, new or old, one tap brings every item up, in order. Make it the most powerful, useful, beautiful, smooth tool in the app.

## Name and place
- Tab "Workspace" (icon: a compass-and-grid mark), the last tab before "Export" in the tab bar (`index.html` app-tabbar), plus a Home card (HOME_ITEMS group `Your Chart`) and a Tools hub entry. Panel id `panel-workspace`, built late (`registerLatePanel`, js/120) so nothing is built at boot (rule 5b).
- In the screen the saved thing is called a **Routine** ("my formula" in the owner's words; named Routine so it is not confused with the Formula Maker in 3D Sky). The first-run text says "Make your own routine: pick what you check, in the order you check it."

## What a routine is (plain JSON, versioned, local only)
`{ v:1, id, name, icon, color, note, layout:'flow'|'board', steps:[Step], made, used, uses, pin }`
`Step = { id, k:'w'|'p', t:<widget id or panel id>, o:{options}, label, note }`
- `k:'w'` native **widget**: a card the Workspace draws itself from the chart on screen.
- `k:'p'` any existing **tool panel** of the app (every HOME_ITEMS entry, about 90), shown live and fully usable.
Stored under `vax_workspace_v1` (routines) and `vax_workspace_ui_v1` (last routine, layout, view prefs). Every read and write is wrapped in try/catch; the page works without storage.

## The widgets (native, drawn from the current chart)
Charts: any divisional chart D1–D144 (North / South / East style, pick the number), two charts side by side (D1 + D9 and the like), Moon chart, special-lagna charts. Tables: planet positions in any varga (sign, degree, house, nakshatra, dignity, retro, combust), house table with lords, Chara Karakas, Nakshatra of planets, Avasthas. Time: dasha now (Vimshottari mahadasha, antardasha, pratyantar with dates and a bar), next 5 periods, transits now against the birth chart, Sade Sati status, Panchang for today. Strength: Shadbala bars, Ashtakavarga SAV bars, Bhava Bala, Vimshopaka. Combinations: yogas and doshas list, key aspects. Plain-words: one-paragraph reading of a chosen house or planet (from the app's own reading engines), Quick facts strip (Lagna, Moon sign, nakshatra, dasha), free text note card for the astrologer's own checklist.
Each widget has options (which varga, which planet, which house, style) kept in the step.

## Panel steps
Any tool can be added by name from a searchable list that reuses the app's own tool list. In **Flow** layout it is opened as the real panel with a floating routine bar. In **Board** layout the real panel is moved into a card on the board and put back afterwards, so nothing is copied or broken.

## Run modes
1. **Flow** (default): a step rail at the top (numbered chips, progress line), one item at a time, previous/next buttons, swipe left/right, keyboard arrows, "jump to step". Works on every step kind.
2. **Board**: all steps stacked as large cards in order, each with a collapse toggle; a floating mini-rail jumps between them.
3. **Present**: full-screen clean view of the same routine (hides chrome), for showing a client.
The routine re-draws itself when the chart changes (a new chart, another saved profile): same routine, new values.

## Building a routine (the editor)
Bottom-sheet **Add step** picker: search box, category chips (Charts, Time, Strength, Combinations, Readings, Tools), live mini-preview of the widget with the current chart, options inline. Steps are reordered with big up/down buttons and drag handles (touch-safe), duplicated, renamed, noted, deleted with undo toast. Starter routines (editable copies): "Quick read", "Marriage check", "Career check", "Dasha and transit", "Strength audit". Routines can be pinned, renamed, duplicated, deleted, sorted (pinned, recent, A–Z). 

## Sharing and safety
Share code `AW1.<base64url JSON>` (copy via a button not starting with the word Copy, see copy-toggle), `#w=` link, JSON download, paste to import, import/export all. Routines contain no chart data and no birth details, only the recipe.

## Look and feel
Own namespace `aw-`. Deep indigo to gold gradient hero with a mandala line-art watermark; routine cards with a coloured spine, step chips with icons, mini sparkline of the step kinds; glass-free (no backdrop-filter), only opacity/transform animations, staggered card entrance, smooth rail progress, spring-feel buttons, light and dark safe, reduced-motion respected, tap targets at least 44px, checked at 390 and 360 px width.

## Speed (rule 5b, docs/STARTUP_SPEED_PLAN.md)
Nothing at boot except the tab button. The three scripts load with the rest but do no work until the tab is first opened (the panel is built lazily; widgets render only when the run view opens; Board renders cards one at a time with idle-callback so the screen never freezes). Report KB added after build.

## Files
- `apps/birth-chart/js/160-workspace-engine.js` — `AW`: routine model, storage, share codec, starter routines, step catalogue
- `apps/birth-chart/js/161-workspace-widgets.js` — `AWW`: the native widgets
- `apps/birth-chart/js/162-workspace-ui.js` — tab panel, editor, flow/board/present runner
- `apps/birth-chart/css/90-workspace.css`
- tests: `tests/workspace_engine_test.js` (node) and `tests/workspace_browser_test.py` (Playwright, 390 and 360 screenshots)

## Steps of work
1. Engine, storage, share codec, starters (+ node test).
2. Widgets, one by one, each checked with a demo chart.
3. UI: tab, list, editor, Flow run.
4. Board and Present modes, reparenting of panel steps (with restore).
5. Polish, screenshots, Feature Guide, STRUCTURE, AI_GUIDE, build, tests.
Order of risk: panel reparenting last. Local commits per step; push only when the owner says so, except this plan, pushed on the owner's request.

## Done when
A routine made once opens on a second chart with that chart's values in the same order; survives reload; shares and imports; no blank step; 390/360 screenshots clean; tests, `python3 build.py`, `node tests/feature_guide_test.js` green.

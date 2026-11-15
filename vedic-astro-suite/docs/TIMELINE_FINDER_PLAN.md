# 3D Sky "Timeline finder" (reverse-engineer a timeline) — plan
Owner request 2026-11-15: in the 3D Sky Tools menu, pick an age range (e.g. 30 to 40, counted from today), then one or more conditions "sign + planet(s)" (e.g. Libra + Sun, Pisces + Moon); the app lists every date in that period when they were all true. The owner chooses whether ALL conditions must hold together or ANY. Also nakshatra, planet-meets-planet (conjunction, opposition, trine, square) and retrograde conditions.
Use: a child's chart shows Sun in Libra (father) and Moon in Pisces (mother) — which dates in the 10 years could that be?

## Method
- Same sidereal sky as the rest of the app: `siderealLongitude(name, jd)` and `isRetrograde(name, jd)` (js/01). Measured 0.003 ms per call, so scanning decades is instant.
- Scan the period with a step chosen from the fastest planet used (Moon 0.2 d, Sun/Mars/Venus 0.5 d, Mercury 0.4 d, Jupiter 2 d, Saturn 3 d, nodes 4 d, outer 6-8 d; halved when a "planets meet" condition is used). When the combined test flips, bisect to about one second. Retrograde re-entries therefore show up as separate stays.
- Age is counted back from today: age 30 to 40 = the 10 years from today minus 40 years to today minus 30 years. A "birth years" mode is also offered.
- Checked against known sidereal (Lahiri) ingress dates: Saturn into Capricorn about 24 Jan 2020, into Aquarius 29 Apr 2022, back into Capricorn 12 Jul 2022 (retrograde), into Aquarius again 17 Jan 2023; Jupiter into Taurus 1 May 2024 and Gemini 14 May 2025; Sun into Libra 17 Oct 2024 (the app's engine gives those to the hour).
- Tapping a result jumps the 3D sky to the middle of that period (`jumpToJD`).

## Files
`apps/sky3d/js/63-timeline-finder.js` (global `TLF`: pure `test/search/ageRange` + sheet UI), `css/34-timeline-finder.css`, `#tlBtn` in the Tools menu (index.html), test `tests/sky3d_timeline_finder_browser_test.py`.

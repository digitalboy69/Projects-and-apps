# Hora (planetary hours) — plan
Owner request 2026-11-13: "We don't have hora, plan it and add it, fully powerful, all features, beautiful, smooth, perfect UI. Plan first, then research, then execute step by step."
Existing in the app today (checked 2026-11-13): only a one-line "Hora now" in the Panchang card (js/45 `out.hora`), the D2 Hora divisional chart, and the Hora Lagna special lagna. No Hora tool.

## Checklist (first unchecked box is the next step)
- [x] S1 Research (two sources each): hora order, unequal hours, planet nature, activity suitability, birth hora, differences between teachers. Record URLs in Notes.
- [x] S2 Engine `js/156-hora-engine.js` (global HORA) + node test `tests/hora_test.js`. Backend step: push live after it passes.
- [x] S3 Panel `js/157-hora-panel.js` + `css/85-hora.css` (`panel-hora`, prefix `hr-`): tabs Now / Today / Week / Best times / Learn. Browser test at 390 and 360. Screenshots, WAIT for owner approval, then push.
- [x] S4 Wire: HOME_ITEMS (js/25), `reg` (js/120), Tools group "Time" (js/147), Panchang card link, Feature Guide entry (js/149), STRUCTURE.md, AI_GUIDE section 7.
- [ ] S5 Full regression + final screenshots, push main and Root after approval.

## Feature list (what "fully powerful" means here)
1. **Now**: live hora lord with a countdown ring (updates each second only while the panel is open), next 3 horas, day lord, sunrise and sunset, the Hora in plain words, what it favours and what to avoid.
2. **Today (24 horas)**: 12 day + 12 night horas from sunrise to next sunrise (unequal, each = day length / 12 or night length / 12), each with planet, exact times, nature chip, short use, and an overlap warning with Rahu Kalam, Yamaganda, Gulika. Pick any date and place date.
3. **Week**: 7 days x 24 horas colour grid, now marker, tap a cell to read it; filter by activity (cells that suit it glow).
4. **Best times**: choose an activity (start work, money, study, travel, marriage talks, medical, buy vehicle, sign papers, creative, spiritual ...) and find the best horas in the next 7 days, ranked, with reasons: hora planet suits the activity, hora lord is friendly to the day lord, hora lord is a friend and not a debilitated planet in the person's chart, no Rahu Kalam/Gulika/Yamaganda overlap, Choghadiya agrees. Teaching-aid score with the reasons shown.
5. **For you (chart link)**: the hora lord's house and dignity in the person's birth chart, its relation to the Lagna lord and the running Mahadasha lord, and the person's **birth hora** (hora of the birth moment).
6. **Learn**: how a hora is made (Chaldean order, day lord first, unequal hours), the order table, planet natures, the Sun/Moon hora meaning of D2 (link to Divisional Charts), Hora Lagna (link), common mistakes, where teachers differ.
7. Beautiful: planet colours, glass cards, ring, smooth tab switching, transform/opacity animation only, no backdrop-filter, 40px tap targets, works at 360px.

## Rules
Tendency wording only. Say plainly that hora is a popular timing practice (Muhurta) and not a guarantee. Every table from two sources. Prefix `hr-`. Reuse `panchangaAt`, `pnRiseSet`, `PN_CHALDEAN`, VDA, VDB; no new astronomy.

## Notes (research log, add URLs here)
- 2026-11-13 S1 research. Sources read: Wikipedia Planetary hours (Chaldean order Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon; day ruler = first hour; day split in 12 and night in 12, unequal); drikpanchang.com/muhurat/hora.html (24 horas, 12 day + 12 night, not 60 min: 13 Nov 2026 Delhi day ~54 min, night ~66 min; per-planet uses; Mars and Saturn horas called inauspicious but 'situational'); performance.shubhpanchang.com/hora (same split, per-planet uses and cautions, Mars/Saturn 'situational, not inherently bad'); dekhopanchang.com/en/learn/hora (per-planet uses; calls a hora 1/24 of sunrise to next sunrise without saying unequal; says Hora is separate from Rahu Kalam, Choghadiya, Abhijit).
- Where sources differ (say on the page): dekhopanchang describes equal 1/24; Drik and Shubh and Wikipedia use unequal day/12 and night/12, and the app follows those. Nobody labels hora lords shubh/ashubh the same way; the app uses supportive / mixed / careful and says so. Vettius Valens started the hour at sunset (Western); modern Indian practice starts at sunrise.
- Activity table: kept pairs that two or more of Drik, Shubh, Dekho agree on as 'good'; a pair seen on one page is 'fair'; cautions (Saturn: new beginnings, Mars: peacemaking and auspicious starts) are on two pages. Weekday-strength claims on Drik (Sun hora strongest Tue/Thu/Sun) are single-source and NOT used.
- Chart link (hora lord's house, dignity, ease, relation to Lagna lord and Mahadasha lord) and the 0..5 score are the app's own teaching aid, built from VDA/VDB. Labelled as such on the page.
- 2026-11-13 S2 done: js/156 engine + tests/hora_test.py (21 checks). Friday Jupiter hora = 1.5 because Jupiter is an enemy of the day lord Venus; Thursday Jupiter = 2.5.
- 2026-11-13 S3/S4 built locally: js/157 + css/85, wired in HOME_ITEMS, js/120, Tools 'Time' group, Feature Guide, STRUCTURE. tests/hora_browser_test.py 56 checks pass at 390 and 360. WAITING for owner approval of screenshots before pushing (S5).

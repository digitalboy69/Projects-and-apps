# Release checklist: selling the PDF reading

Plain facts for the owner. Not legal advice; ask a lawyer about contracts and local consumer rules.

## What the product is
One click in the app builds a self-contained report (about 125 pages, about 1.7 MB as PDF). It is built in the browser from the app's own tables and calculations. Nothing is sent to a server, so it works offline and costs nothing per report.

## Before the first paid report
1. **Astrologer review.** Give a practising astrologer `docs/ASTROLOGER_REVIEW_SHEET.md` (regenerate with `python3 tests/reading_qa_test.py --sheet`). Fix what they disagree with in `tools/reading_gen/*.py`, then run `sh tools/reading_gen/regen.sh`.
2. **Brand.** In the customer edition the wrapper injects `window.__VAX_BRAND = {brand_name, tagline, phone, logo}`. The cover, page headers and closing page then carry it. Without a brand the cover says "Prepared with care".
3. **Disclaimers.** Already in the report: tendencies not fate; not medical, legal, financial or psychological advice; birth-time accuracy note. Repeat the same lines on your order page.
4. **Payment and delivery.** The app has no checkout. Take payment outside (UPI link, Razorpay, etc.), generate the report from the customer's birth details and send the PDF. Do not store customers' birth details longer than needed and tell them what you keep.
5. **Licences.** The planet maths is the app's own code (Meeus-style methods), not Swiss Ephemeris. The only third-party code is `vendor/qrlibs.js` (MIT, see `docs/THIRD_PARTY_LICENSES.md`), which allows commercial use. Keep that file and the notice.
6. **Sample for buyers.** Send a sample only to people who asked for one. Cold messages in groups look like spam.

## Quality gates (run before every release)
`sh tools/ai/session.sh test dasha_reading_test manifest_test nakshatra_db_test deep_reading_test knowledge_db_test popular_charts_test smoke customer prod yoga_engine_test pdf_report_test life_areas_test life_narratives_test varga_reading_test transit_reading_test reading_qa_test`

Budgets enforced by `tests/pdf_report_test.py`: build under 4 seconds, HTML under 900 KB, PDF 100 to 220 pages under 6 MB, print window opens exactly once.

## Decision: optional AI writer
Not now. The database-only reading is free to run, works offline, gives the same text for the same chart (which makes review and refunds simple) and has no key to leak. Revisit only if customers ask for a personal summary; it would need a server-side key and must be grounded on the same facts the tables use.

## Known limits (be honest on the order page)
- Transits and Sade Sati are available from 100 years before to 100 years after the chart's own date only for charts inside the ephemeris range (about 1801 to 2049).
- A few minutes of birth-time error can change the rising sign and divisional charts.
- Scores compare areas inside one chart; they are not predictions.
- The older Signature/Foundation text still has a few absolute words ("death") that need a human decision.

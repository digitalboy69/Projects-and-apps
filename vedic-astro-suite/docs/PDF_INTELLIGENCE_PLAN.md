# PDF intelligence — plan

Goal (owner, 2026-11-20): the PDF cuts pages after a paragraph, never through an important line; words stay sharp at any zoom; sections are spaced cleanly.

## Decisions
- Sharpness: the true text (vector) PDF. The book is printed by the browser's own print-to-PDF, so words are real text (sharp at any zoom, selectable, small file). The old picture-per-page download (js/109, PDFD) stays only as a fallback where printing is not available (for example the APK web view) and for `?imgpdf`.
- Page cuts: a layout-rules module `PDFI` (js/110-pdf-intelligence.js), added to the book's CSS by `PDFR.build`.

## Rules PDFI applies
1. A heading never ends a page: it moves with the first lines after it (`break-after: avoid`, and the heading + first block are kept together).
2. A paragraph never leaves 1 line alone at the page end (orphans) or top (widows): `orphans:3; widows:3`.
3. Short paragraphs (up to about 6 lines), labelled lines ("Strength: ..."), list items, quotes, cards, plates, table rows and chart figures are kept whole.
4. Tables repeat their header row on the next page and never split a row.
5. A section starts on a new page only when it has a divider or title page; otherwise the gap between sections is a fixed, even space, and the last element of a page never leaves a big empty hole (a block taller than 40% of a page is allowed to split between lines instead).
6. Charts and their caption stay together.
7. The test prints the book to a real PDF and checks page ends from the PDF text (compared with no rules).

## Done when
Test prints the book with Chromium, reads the PDF text per page and finds: no page ends mid-sentence in a short paragraph, no page ends with a heading, text is real text (not images). `python3 build.py`, feature guide test, PDF tests green. No push until the user says so.

# Export Studio plan (3D Sky)

Problem: the old 3D export was one dropdown that pasted flat "--- HEADING ---" text (and the shared add-on appended raw page text), which an AI could not read reliably, with no control over what went in.

Design
- One data model, three renderers (js/65 `XS`): Markdown (default), JSON, plain text. A section is {id, title, about, blocks}; blocks are kv / table / list / text, so every format shows the same facts.
- Document order is fixed: title, optional task, optional rules for the reader, optional how-to-read guide, contents, overview (moment, ayanamsa, house system, birth profile), Part A chart sections (sky and/or birth chart), Part B timing (Dasha, transits, meetings, retrograde, ephemeris, Timeline finder results). Sections are numbered and every one starts with one line saying what it is.
- Section data comes from existing engines only: `DBX.analyse` (js/50, now exposed), `computeNatalAscendant`, `VDasha`, `VG` (js/64), `SKA.calc`, `findIngresses`, `findConjunctions`, `isRetrograde`, `TLF.state`. Nothing is guessed.
- Control screen (js/66 `XSU`, css/35): presets, chart and moment (sky / birth / both; 3D date / now / picked), per-section switches with options (divisional chart picker, forecast horizon and Moon toggle, ephemeris step / rows / planets), format, degrees style, guide and rules switches, a free question for the AI, live preview with size and token estimate, Copy / Download / Share. Settings are kept in localStorage `sky3d_xs`.
- The Export tab keeps four one-tap copies (AI brief, Quick sky, Forecast, Everything). `generateExportData(type)` (js/38) stays as the old entry point and now returns the same Markdown. The shared add-on's floating menu uses the engine too.

Checks: tests/sky3d_export_studio_browser_test.py (structure, all formats, options, UI at 390 and 360).

# Vedic Astro Suite - what is inside

## The files
| File / folder | What it is | Edit it? |
|---|---|---|
| `wrapper_template.html` | The outer shell: loader, floating switcher (3D / Birth Chart / Developer), dark theme. Has 3 empty slots (`..`) where the apps go. Small (~10 KB). | Yes, for loader, switcher, default screen |
| `parts/srcA.html` | The **3D Sky** app (Three.js): planets in 3D, degree finder, planet returns, retrograde planner. | Yes, for anything 3D |
| `parts/srcB_01..07.part` | The **Birth Chart (Vedic)** app, split into 7 consecutive pieces. Joined in order by `build.py`. | Yes, for all chart features |
| `parts/srcN.html` | The **Notepad** app (Jyotish Notebook): notes, templates, astro palette, chart inserter, tasks, predictions tracker, backup, PIN lock. One self-contained file (~70 KB). | Yes, for anything notepad |
| `parts/locpicker.js` | The shared **Pick location** popup (map with search, pin, satellite/dark styles, coordinates tab, Google-link reader). Built into the wrapper; every app calls `parent.LocPicker.attach(...)` next to its place field. | Yes, for location features |
| `parts/srcDev.html` | The Developer card overlay. | Rarely |
| `build.py` | Joins everything and writes the final HTML files. Run: `python3 build.py` | No |
| `HANDOFF.md` | Short project notes and rules for a new chat. | Update as you go |

Build outputs: `vedic-astro-suite-readable.html` (plain code, use this) and `vedic-astro-suite-2.html` (base64 copy).

## Sizes (what you upload to a chat)
| Part | Size |
|---|---|
| `srcA.html` | 288 KB |
| `srcB_01.part` | 89 KB |
| `srcB_02.part` | 148 KB |
| `srcB_03.part` | 72 KB |
| `srcB_04.part` | 82 KB |
| `srcB_05.part` | 94 KB |
| `srcB_06.part` | 105 KB |
| `srcB_07.part` | 141 KB |
| `srcDev.html` | 12 KB |

## Which part holds which feature (srcB)
| Feature | File | Where |
|---|---|---|
| Chart engine (computeChart, planets, houses) | `srcB_03.part` | ~line 1420 in that file |
| Vimshottari dasha | `srcB_03.part` | ~line 860 in that file |
| Ashtakavarga calc | `srcB_03.part` | ~line 967 in that file |
| Vargas (D-charts) | `srcB_03.part` | ~line 573 in that file |
| Special lagnas | `srcB_04.part` | ~line 100 in that file |
| Panchang | `srcB_05.part` | ~line 1211 in that file |
| Bhava Bala | `srcB_07.part` | ~line 888 in that file |
| Sahams | `srcB_07.part` | ~line 995 in that file |
| Fate Meter | `srcB_07.part` | ~line 1065 in that file |
| Live transit sky | `srcB_07.part` | ~line 63 in that file |
| Tithi Pravesh | `srcB_07.part` | ~line 934 in that file |
| Life Activation | `srcB_07.part` | ~line 869 in that file |

(Use search for the function name inside the file; line numbers shift when you edit.)

## Fast workflow, one task per chat
1. Pick ONE feature (example: "add Kama saham" or "improve Bhava Bala UI").
2. New chat, upload only: `HANDOFF.md` + the ONE part from the table above (never the whole project).
3. Prompt template:
   > Project notes are in HANDOFF.md. The attached part holds [feature]. Task: [what you want]. Return only the changed function(s) or the full edited part, tested with a quick script. Do not rewrite unrelated code.
4. Paste the returned code into that part file, run `python3 build.py`, open `vedic-astro-suite-readable.html` and test.
5. Commit to GitHub (free) so every account can pull the latest.

## Switching between accounts
- Keep ONE source of truth: a GitHub repo (or Google Drive folder) with this project. Never keep the only copy inside a chat.
- When an account's limit ends, open the next account, start a new chat, and repeat step 2 with the same `HANDOFF.md`. Nothing else needs moving.
- If you changed things yourself, update `HANDOFF.md` ("Features done" and "Next") so the next account knows the state.
- Save every returned code block into the repo before moving to the next account.

## Saving your limit
- One feature per chat; do not ask for the whole file back.
- Say "return only changed functions".
- Ask for tests on only what changed.
- Big parts (07 is ~145 KB): paste just the function you want changed instead of uploading the part when the upload fails.

## Export & Copy add-on (new)
`parts/export_addon.js` is already embedded at the end of srcA.html and srcB_07.part (inline script before `</body>`). It adds "More data" export sections, presets, search, Copy JSON/.json, per-section copy buttons and the floating ⧉ button. To update it, replace the `<script>` block in both apps with the new file.

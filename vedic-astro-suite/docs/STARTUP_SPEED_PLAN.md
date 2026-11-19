# Start-up speed plan

Goal: the app should be usable as soon as possible, on a slow phone as well as on a PC, without hiding real work behind a show. Owner request 2026-11-20.

## Where we are (measured 2026-11-20, local server, headless Chromium)
| | PC (CPU x1) | Phone-like (CPU x4) |
|---|---|---|
| Birth Chart view ready | about 1.5 s | about 5 s |
| Birth Chart files | 170 scripts (2.6 MB), 91 stylesheets | same |
| 3D Sky files | 74 scripts (0.6 MB), 40 stylesheets | same |

Done already (commit 88d1f47): removed the forced 1.5 s loader hold and the welcome greeting, 3D Sky waits 3 frames (max 0.8 s), loader only fades in after 0.3 s.

## Step 1: bundle each app: DONE (2026-11-20)
- [x] `tools/bundle.py` writes `apps/<name>/index.bundle.html` (the app with every local css/js inlined, each script still its own block, so behaviour is identical; no joining of files, so no `'use strict'` or error-isolation changes). `build.py` and `build.py --bundles` run it; the git pre-commit hook runs it, so bundles can never be stale in a commit.
- [x] The shell loads the bundles; `?dev` on the shell URL loads the plain source files for editing. Tests still use the plain `index.html` files.
- [x] `version.json` / `shell/js/updater.js` now list only what the shell loads (17 files instead of about 480), so silent updates download far less.
- [x] Test: `tests/startup_bundles_browser_test.py` (same globals as plain files in all three apps, no page errors, freshness, fewer requests).
- [x] Measured (local server, 3 runs each, Birth Chart default view):

| | requests | PC (CPU x1) | phone-like (CPU x4) |
|---|---|---|---|
| plain files | 289 | 1.33 to 1.62 s | 2.5 to 2.8 s |
| bundles | 30 | 0.68 to 0.84 s | 2.5 to 2.6 s |

On a real connection every request costs a round trip, so the saving is larger than on this zero-latency test. On a slow CPU the time is spent running the code, which Step 2 addresses.
- [ ] Not done on purpose: the APK still carries the plain source files next to the bundles (safe, small); removing them would shrink the APK.

## Step 2: load rare features only when opened (several hours, in stages)
Order: biggest and least used first. For each feature: move it to a lazy file, load it on first tap with a short "opening" state, add a test that opens it, measure.
- [ ] Reading and nakshatra databases (large data, used only in readings)
- [ ] Export builder and Export Studio
- [ ] Divisional chart explorer
- [ ] Rectification and Date Finder
- [ ] Anything else the measurement shows is large and rarely used
Rule for every stage: no change in behaviour, only in when the code loads; keep a fallback so a failed lazy load shows a retry button, never a blank panel.

## How to measure (do this before and after every step)
1. Serve the folder with `python3 -m http.server`, open `index.html` in headless Chromium with external hosts blocked.
2. Record time until `#load` gets class `hide`, at CPU x1 and CPU x4 (`Emulation.setCPUThrottlingRate`).
3. Record the app frame's script count and `domContentLoadedEventEnd`.
4. Write the numbers in the table above (new column per step).

## Rule for every new feature (also in AI_GUIDE.md section 0a, item 5b)
- A new feature must not add work to start-up. Anything heavy (large data, a big engine, a big sheet) loads when it is first opened, not at boot.
- No `setTimeout` waits, animations or "show" screens that delay the first usable screen.
- Say in the plan or the reply: how many KB it adds and whether it loads at boot or on demand.
- If a feature adds more than about 50 KB of script at boot, make it lazy or explain why not.

## Done when
Birth Chart view ready is clearly faster on the phone-like run, nothing behaves differently, tests pass, numbers are recorded here.

# Start-up speed plan

Goal: the app should be usable as soon as possible, on a slow phone as well as on a PC, without hiding real work behind a show. Owner request 2026-11-20.

## Where we are (measured 2026-11-20, local server, headless Chromium)
| | PC (CPU x1) | Phone-like (CPU x4) |
|---|---|---|
| Birth Chart view ready | about 1.5 s | about 5 s |
| Birth Chart files | 170 scripts (2.6 MB), 91 stylesheets | same |
| 3D Sky files | 74 scripts (0.6 MB), 40 stylesheets | same |

Done already (commit 88d1f47): removed the forced 1.5 s loader hold and the welcome greeting, 3D Sky waits 3 frames (max 0.8 s), loader only fades in after 0.3 s.

## Step 1: bundle each app (about 1 to 2 hours)
- [ ] Build step makes `apps/<app>/dist/app.js` and `app.css` by joining the files in their number order (same order the single-file build already uses, see `tools/assemble.py`).
- [ ] Production pages (website and APK) load the bundle; the folder version with separate files stays for development and tests.
- [ ] `mobile/scripts/prepare-web.js` and the live-update bundle include the bundles.
- [ ] Service/offline cache list (shell/js/updater.js) points at the bundles.
- [ ] Check: same behaviour as before. Run the full test set, the smoke test and the screenshot tests.
- [ ] Measure again with the same method and record the numbers here.

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

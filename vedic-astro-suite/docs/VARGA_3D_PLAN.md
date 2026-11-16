# Open a divisional chart in 3D: plan

Goal: in the Birth Chart app, Divisional Charts tab, one button opens the 3D Sky at the birth moment with the chosen divisional chart (D2 ... D144) drawn as the sky, the same way D9 already works (Tools > Navamsha).

Method
- `VG` (apps/sky3d/js/64-varga-math.js) holds the sign rules copied from the Birth Chart `calcVarga`. `VG.lon(key, lon)` = divisional sign x 30 + the place inside the division stretched over 30 degrees. For D9 this equals (lon x 9) mod 360, so the Navamsha sky is unchanged.
- `NAV` (js/61) now carries a key (default D9). `NAV.set(true, quiet, key)` draws that varga; labels in the HUD, rising line and chart tab use `NAV.label`.
- Handoff: the existing button (js/84 `vxSend3D`) now calls `vxJump3D` (js/99) with `varga`; js/51 reads it, switches to the wheel, sets the varga and jumps to the birth moment.
- Rasi Tulya Navamsa keeps the D1 lagna; the nested D81/D108/D144 stretch the inner division and divide again.

Checks: tests/sky3d_varga_parity_test.js (rules equal the Birth Chart for all 24 vargas and every degree), tests/varga_open_3d_browser_test.py (end to end at 390 and 360).

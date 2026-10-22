#!/bin/sh
# Regenerates the four reading databases from the tables in this folder (the tables are the source of truth).
# Run from anywhere: sh vedic-astro-suite/tools/reading_gen/regen.sh ; then run build.py and the tests.
set -e
cd "$(dirname "$0")"
python3 p4_build.py | tail -2 && python3 p5_write.py   # js/87-vedic-knowledge-db.js  (tables: p1_masters, p2_planet_house, p3_more, p4_build)
python3 build_nk.py                                    # js/89-vedic-nakshatra-db.js  (table: nk_data)
python3 build_vmf.py                                   # js/90-reading-manifest.js    (tables inside build_vmf.py)
python3 build_vda.py                                   # js/91-dasha-reading.js       (tables inside build_vda.py)
python3 build_yg.py                                    # js/92-yoga-engine.js         (table inside build_yg.py)
python3 build_la.py                                    # js/94-life-areas.js          (table inside build_la.py)

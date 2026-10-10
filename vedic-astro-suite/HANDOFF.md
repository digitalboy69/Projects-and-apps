# Handoff (short)
Everything an AI needs is in **`AI_GUIDE.md`** (prompt router, token-saving rules, build/test/deliver steps, changelog). Start every new chat with:

> Read AI_GUIDE.md first, then do: [task]. Return the readable HTML + zip, keep the reply short.

Project = one HTML file with 4 embedded apps (3D Sky `srcA`, Birth Chart `srcB`, Notepad `srcN`, Developer card `srcDev`). Edit `parts/`, run `python3 build.py`, test with `python3 tests/smoke.py`, commit. If a chat only has a few tokens left: upload/paste nothing big; the repo is the source of truth.

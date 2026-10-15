#!/usr/bin/env python3
"""Fails if STRUCTURE.md and the real files disagree.
Every project file must appear as a `- `path` — description` line; every listed path must exist."""
import os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
files = subprocess.run(['git', 'ls-files', '-co', '--exclude-standard', '--full-name', '.'], capture_output=True, text=True).stdout.split('\n')
top = subprocess.run(['git', 'rev-parse', '--show-prefix'], capture_output=True, text=True).stdout.strip()
actual = {f[len(top):] for f in files if f and f.startswith(top)}
actual = {f for f in actual if not f.endswith('.pyc') and f != 'symbols.idx.tmp' and f != 'dist/customer-edition.html'}
txt = open('STRUCTURE.md', encoding='utf-8').read().split('### Repo root')[0]   # the repo-root section is informational
listed = set(re.findall(r'^- `([^`]+)` —', txt, flags=re.M))
missing = sorted(actual - listed)
ghost = sorted(p for p in listed if not os.path.exists(p))
if missing or ghost:
    for p in missing: print('NOT IN STRUCTURE.md:', p)
    for p in ghost: print('IN STRUCTURE.md BUT MISSING ON DISK:', p)
    print('-> update STRUCTURE.md (path — what it does).'); sys.exit(1)
print('structure: OK (%d files)' % len(actual))

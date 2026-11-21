#!/usr/bin/env python3
"""Install the AI Brain into a project.   python3 install.py /path/to/project [--tool all|claude,cursor,copilot,windsurf,gemini,agents,cline,aider] [--no-hooks] [--no-skill] [--no-init]
Copies brain/ into the project, copies the Claude skill to <project>/.claude/skills/codebase-brain, then runs `brain.py init`.
Safe to re-run: existing AI_GUIDE.md / STRUCTURE.md / CLAUDE.md / brain.json are never overwritten (brain.py itself and templates are updated)."""
import os, shutil, subprocess, sys
kit = os.path.dirname(os.path.abspath(__file__))
argv = sys.argv[1:]
tool = ''
if '--tool' in argv:
    i = argv.index('--tool'); tool = argv[i + 1]; argv = argv[:i] + argv[i + 2:]
args = [a for a in argv if not a.startswith('--')]
flags = [a for a in argv if a.startswith('--')]
dest = os.path.abspath(args[0] if args else '.')
if not os.path.isdir(dest):
    sys.exit('not a folder: ' + dest)
if os.path.abspath(dest) == kit:
    sys.exit('run this against YOUR project folder, not the kit folder')
bdst = os.path.join(dest, 'brain'); keep = None
if os.path.exists(os.path.join(bdst, 'brain.json')):
    keep = open(os.path.join(bdst, 'brain.json'), encoding='utf-8').read()
shutil.copytree(os.path.join(kit, 'brain'), bdst, dirs_exist_ok=True, ignore=shutil.ignore_patterns('__pycache__', 'brain.json'))
if keep is not None:
    open(os.path.join(bdst, 'brain.json'), 'w', encoding='utf-8').write(keep)
print('copied brain/ ->', bdst)
if '--no-skill' not in flags:
    sdst = os.path.join(dest, '.claude', 'skills', 'codebase-brain')
    shutil.copytree(os.path.join(kit, 'skill', 'codebase-brain'), sdst, dirs_exist_ok=True)
    print('copied skill ->', sdst)
if '--no-init' not in flags:
    subprocess.call([sys.executable, os.path.join(bdst, 'brain.py'), 'init'] + (['--no-hooks'] if '--no-hooks' in flags else []) + (['--tool', tool] if tool else []), cwd=dest)

#!/usr/bin/env python3
"""Token-savings simulation for the AI Brain. Costs NO model tokens: it runs the real brain commands and the real
alternatives (grep + whole-file reads) on this repo and counts the text each path would put into the AI's context (chars/4).

  python3 tools/ai/sim_savings.py          table + totals + break-even
Baselines:  B = careful AI with no brain (greps, reads only the right files whole, no guide docs)
            A = typical AI with no brain (reads AI_GUIDE + STRUCTURE whole once, then per task: grep, the right file + 2 median-size wrong guesses, whole)
Brain:      AI_START + start once, then per task: ctx + show of the target symbol (+ impact when the task changes a shared function).
A brain result only counts as a hit when ctx's top 8 contained the file to edit; a miss is charged the full fallback (find + whole file).
"""
import os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
BR = os.path.join(HERE, 'brain.py')
JS = 'apps/birth-chart/js/'
# (what the user asks, file to edit, symbol to change, shared function? -> also run impact)
TASKS = [
 ('change how the fate meter score is calculated', JS + '75-fate-meter.js', 'computeFate', True),
 ('fix the gulika day and night timing rule', JS + '117-gulika.js', 'computeGulika', True),
 ('the transit timer result card shows wrong text', JS + '21-transit-timer-tab.js', 'renderTransitTimerResult', False),
 ('add a field to the hora panel custom place search', JS + '157-hora-panel.js', 'buildHoraPanel', False),
 ('change the ashtakavarga bindu engine', JS + '11-ashtakavarga-engine.js', 'computeFullAshtakavarga', True),
 ('the sandhi table tab is showing the wrong sign edge', JS + '22-sandhi-table-tab.js', None, False),
 ('life event checker per minute dasha scoring', JS + '98-life-event-engine.js', None, False),
 ('pdf book report export cover page', JS + '93-pdf-report.js', None, False),
 ('chart core compute sunrise handling', JS + '15-chart-core-compute.js', 'computeChart', True),
 ('date finder search engine generate dates', JS + '28-date-finder-engine.js', None, False),
 ('feature guide screen search chips', JS + '150-feature-guide.js', None, False),
 ('muhurta tab in the astro atlas', JS + '133-astro-atlas-more.js', 'muhurtaTab', False),
 ('shadbala engine in the sky3d live view', 'apps/sky3d/js/55-live-shadbala-engine.js', 'computeShadbala', True),
 ('special lagnas and arudha padas calculation', JS + '17-special-lagnas.js', None, False),
]

def tok(s): return (len(s.encode('utf-8')) + 3) // 4
def rd(rel):
    try: return open(os.path.join(ROOT, rel), encoding='utf-8').read()
    except Exception: return ''
def brain(*a):
    p = subprocess.run([sys.executable, BR] + list(a), capture_output=True, text=True, cwd=ROOT)
    return p.stdout + p.stderr
def grep(words):
    pat = '|'.join(re.escape(w) for w in words)
    p = subprocess.run(['grep', '-rnIE', '-i', pat, 'apps', 'shared', 'shell', 'tools', 'tests', '--include=*.js', '--include=*.py', '--include=*.css', '--exclude=*.bundle.html', '--exclude-dir=dist'],
                       capture_output=True, text=True, cwd=ROOT)
    return '\n'.join(p.stdout.splitlines()[:250])      # the Grep tool's own default head_limit

def main():
    guide = tok(rd('AI_GUIDE.md')) + tok(rd('STRUCTURE.md'))
    start = tok(rd('AI_START.md')) + tok(brain('start'))
    rows = []; hits = 0
    allf = subprocess.run(['git', 'ls-files'], capture_output=True, text=True, cwd=ROOT).stdout.split()
    code = sorted(tok(rd(f)) for f in allf if f.endswith(('.js', '.py', '.css')) and not f.startswith(('dist/', 'vendor/')))
    wrong_cost = 2 * code[len(code) // 2]                 # two wrong guesses opened whole, each a MEDIAN file (not the huge ones)
    for q, f, sym, shared in TASKS:
        whole = tok(rd(f)); words = [w for w in re.findall(r'[a-z]{4,}', q.lower())][:4]
        g = tok(grep(words))
        B = g + whole
        A = g + whole + wrong_cost
        c = brain('ctx', q); ok = f in c
        hits += ok
        cost = tok(c)
        if sym: cost += tok(brain('show', sym))
        else: cost += tok(brain('outline', f))
        if shared and sym: cost += tok(brain('impact', sym))
        if not ok: cost += tok(brain('find', *words)) + whole
        rows.append((q[:44], whole, B, A, cost, ok))
    print('%-46s %7s %8s %8s %7s %s' % ('task', 'file', 'B', 'A', 'brain', 'hit'))
    for q, w, B, A, c, ok in rows:
        print('%-46s %7d %8d %8d %7d %s' % (q, w, B, A, c, 'yes' if ok else 'MISS'))
    n = len(rows); sB = sum(r[2] for r in rows); sA = sum(r[3] for r in rows) + guide; sC = sum(r[4] for r in rows) + start
    print('\nctx found the right file in top 8: %d/%d' % (hits, n))
    print('session of %d tasks   careful-no-brain B: %s   typical-no-brain A: %s   brain (incl. one start of %d): %s' % (n, format(sB, ','), format(sA, ','), start, format(sC, ',')))
    print('SAVED vs B: %s tokens (%d%%)   SAVED vs A: %s tokens (%d%%)' % (format(sB - sC, ','), round(100 * (sB - sC) / sB), format(sA - sC, ','), round(100 * (sA - sC) / sA)))
    one = rows[0]
    a1 = guide + one[3]; b1 = start + one[4]
    print('single task, cold session (start + 1 task): A %s vs brain %s  -> %d%% saved' % (format(a1, ','), format(b1, ','), round(100 * (1 - b1 / a1))))
    # break-even: a file only saves tokens if reading it whole costs more than ctx+show/outline
    per = sum(r[4] for r in rows) / n
    sizes = code
    over = sum(1 for s in sizes if s > per)
    print('\nBREAK-EVEN: brain costs ~%d tokens per task. Files smaller than that (read whole = cheaper) are %d%% of the %d code files; for the other %d%% the brain wins.'
          % (per, round(100 * (len(sizes) - over) / len(sizes)), len(sizes), round(100 * over / len(sizes))))
    small = sum(s for s in sizes if s <= per); big = sum(s for s in sizes if s > per)
    print('those big files hold %d%% of all code tokens (that is where reading costs money).' % round(100 * big / (big + small)))
    return 0
if __name__ == '__main__': sys.exit(main())

#!/bin/sh
# One helper for every AI session. Usage (from anywhere inside the repo):
#   sh vedic-astro-suite/tools/ai/session.sh start                 where am I, did main move, what is the next plan item
#   sh vedic-astro-suite/tools/ai/session.sh check                 build.py + structure + syntax (compact)
#   sh vedic-astro-suite/tools/ai/session.sh test NAME [NAME...]   run tests/NAME.py compactly; NAME may be: smoke, customer, prod, or any tests/*_test name
#   GH_TOKEN=... sh vedic-astro-suite/tools/ai/session.sh ship "message" [--branch-only|--dry]
# ship: commit -> rebase on the newest main if it moved (docs/generated files auto-resolve via .gitattributes, then build.py) -> check -> push the
#       feature branch -> fast-forward main (skipped with --branch-only). The token is read from GH_TOKEN, passed only as a header, never written to disk.
set -e
SELF=$(cd "$(dirname "$0")" && pwd)/$(basename "$0")   # absolute: the script changes directory
ROOT=$(git rev-parse --show-toplevel); S="$ROOT/vedic-astro-suite"; BRANCH=${BRANCH:-feature/full-reading}; REPO_URL=https://github.com/digitalboy69/Projects-and-apps.git
cd "$S"
git config merge.ours.driver true
if [ -z "$CHROMIUM" ]; then for c in /opt/pw-browsers/chromium-*/chrome-linux/chrome /opt/pw-browsers/chromium; do [ -x "$c" ] && CHROMIUM=$c && break; done; export CHROMIUM; fi
last() { grep -E "^FAIL|ALL PASS|FAILED|PASS no page errors|^[0-9]+ / [0-9]+|^PASS |Error" | cut -c1-230 | tail -${1:-3}; }
case "$1" in
 start)
  git fetch -q origin
  echo "branch: $(git rev-parse --abbrev-ref HEAD) @ $(git rev-parse --short HEAD) | origin/main @ $(git rev-parse --short origin/main) | main moved since my base: $(git merge-base --is-ancestor origin/main HEAD && echo no || echo YES)"
  for PL in FULL_READING_PLAN APP_NAVIGATION_PLAN; do echo "[$PL] next unchecked item:"; grep -m1 -E '^- \[( |~)\]' docs/$PL.md | cut -c1-200; done ;;
 check)
  python3 build.py 2>&1 | tail -1; python3 tools/check_structure.py | tail -1; python3 tests/syntax_check.py | tail -1 ;;
 test)
  shift
  for n in "$@"; do
   case "$n" in
    customer) python3 tools/build_customer.py >/dev/null 2>&1; sed "s#/opt/pw-browsers/chromium'#$CHROMIUM'#" tests/customer_smoke.py > tests/_cs_tmp.py; printf "%-22s" customer; timeout 280 python3 tests/_cs_tmp.py 2>&1 | last 1; rm -f tests/_cs_tmp.py ;;
    prod) python3 tools/build_customer.py >/dev/null 2>&1; printf "%-22s\n" prod_forms; timeout 280 python3 tests/prod_forms_check.py 2>&1 | last 4 ;;
    *) f="tests/${n%.py}.py"; [ -f "$f" ] || f="tests/${n%.py}_test.py"; printf "%-22s" "$(basename $f .py)"; timeout 280 python3 "$f" 2>&1 | last 1 ;;
   esac
  done ;;
 ship)
  MSG="$2"; MODE="$3"; [ -n "$MSG" ] || { echo "usage: ship \"message\" [--branch-only|--dry]"; exit 2; }
  [ "$MODE" = "--dry" ] || [ -n "$GH_TOKEN" ] || { echo "GH_TOKEN is not set"; exit 2; }
  python3 build.py >/dev/null 2>&1   # generated files must be current BEFORE the commit
  cd "$ROOT"; git add -A vedic-astro-suite .gitattributes; git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "$MSG" 2>/dev/null || echo "(nothing new to commit)"
  git fetch -q origin
  if ! git merge-base --is-ancestor origin/main HEAD; then
    echo "main moved: rebasing"; git -c user.name="Claude" -c user.email="noreply@anthropic.com" rebase origin/main >/dev/null 2>&1 || {
      while [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ]; do
        U=$(git diff --name-only --diff-filter=U); [ -z "$U" ] && { GIT_EDITOR=true git -c user.name="Claude" -c user.email="noreply@anthropic.com" rebase --continue >/dev/null 2>&1 || break; continue; }
        for f in $U; do case "$f" in vedic-astro-suite/dist/*|vedic-astro-suite/symbols.idx) git checkout --ours -- "$f" && git add "$f";; esac; done
        U=$(git diff --name-only --diff-filter=U); [ -n "$U" ] && { echo "CONFLICT needs a human/AI merge: $U"; exit 3; }
        GIT_EDITOR=true git -c user.name="Claude" -c user.email="noreply@anthropic.com" rebase --continue >/dev/null 2>&1 || true
      done; }
    cd "$S"; python3 build.py >/dev/null 2>&1; cd "$ROOT"; git add -A vedic-astro-suite .gitattributes; git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "Rebuild generated files after rebase" 2>/dev/null || true
  fi
  cd "$S"; sh "$SELF" check
  [ "$MODE" = "--dry" ] && { echo "dry run: not pushing"; exit 0; }
  cd "$ROOT"; AUTH=$(printf 'x-access-token:%s' "$GH_TOKEN" | base64 -w0); G="git -c http.extraheader=Authorization:\ Basic\ $AUTH"
  RSHA=$(git ls-remote $REPO_URL refs/heads/$BRANCH | cut -c1-40)
  if [ -n "$RSHA" ]; then eval GIT_TERMINAL_PROMPT=0 $G push --force-with-lease=$BRANCH:$RSHA origin HEAD:refs/heads/$BRANCH 2>&1 | tail -1; else eval GIT_TERMINAL_PROMPT=0 $G push origin HEAD:refs/heads/$BRANCH 2>&1 | tail -1; fi
  if [ "$MODE" != "--branch-only" ]; then git fetch -q origin; if git merge-base --is-ancestor origin/main HEAD; then eval GIT_TERMINAL_PROMPT=0 $G push origin HEAD:refs/heads/main 2>&1 | tail -1; else echo "main moved again: not pushed to main, run ship again"; fi; fi
  echo "remote main @ $(git ls-remote $REPO_URL refs/heads/main | cut -c1-7) | remote $BRANCH @ $(git ls-remote $REPO_URL refs/heads/$BRANCH | cut -c1-7) | token on disk: $(grep -rl "$GH_TOKEN" .git 2>/dev/null | wc -l) files" ;;
 *) sed -n 2,8p "$SELF" ;;
esac

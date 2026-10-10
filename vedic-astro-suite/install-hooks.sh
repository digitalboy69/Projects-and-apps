#!/bin/sh
# Run once per clone: makes git regenerate AI_GUIDE.md + symbols.idx before every commit.
cd "$(dirname "$0")" || exit 1
PREFIX="$(git rev-parse --show-prefix)"
git config core.hooksPath "${PREFIX}.githooks"
chmod +x .githooks/pre-commit
echo "hooks installed (core.hooksPath=${PREFIX}.githooks)"

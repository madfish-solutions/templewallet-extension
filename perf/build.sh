#!/bin/sh
# Builds the Chrome extension from a git ref or from the working tree, ready for perf/compare.mjs:
#   perf/build.sh <git ref | .> [out dir]        default out dir: perf/out/builds/<ref or working-tree>-<time>
# A ref is exported with `git archive` into /tmp/tw-build-<commit> (your checkout is untouched) and reuses this
# checkout's node_modules when yarn.lock is identical; `.` builds the working tree in place (it rewrites dist/).
# .env is copied from this checkout. Nothing is deleted: remove old /tmp/tw-build-* and out dirs by hand.
# The build log goes to stderr and only the out dir is printed to stdout, so `BUILD=$(perf/build.sh .)` works.
set -eu
if [ $# -lt 1 ]; then
  sed -n 2,7p "$0" >&2
  exit 2
fi
REF=$1
OUT=${2:-}
case $OUT in
  '' | /*) ;;
  *) OUT=$(pwd)/$OUT ;;
esac
cd "$(dirname "$0")/.."
REPO=$(pwd)
if [ "$REF" = . ]; then
  NAME=working-tree
else
  NAME=$(printf '%s' "$REF" | tr '/:' '--')
fi
OUT=${OUT:-$REPO/perf/out/builds/$NAME-$(date +%Y%m%d-%H%M%S)}
if [ -d "$OUT" ] && [ -n "$(ls -A "$OUT")" ]; then
  echo "$OUT is not empty: pass another out dir or remove it first." >&2
  exit 2
fi

if [ "$REF" = . ]; then
  SRC=$REPO
else
  SHA=$(git rev-parse --short "$REF^{commit}")
  SRC=/tmp/tw-build-$SHA
  if [ ! -f "$SRC/package.json" ]; then
    mkdir -p "$SRC"
    git archive "$SHA" | tar -x -C "$SRC"
  fi
  cp .env "$SRC/.env"
  if [ ! -e "$SRC/node_modules" ]; then
    if git show "$SHA:yarn.lock" | cmp -s - yarn.lock; then
      ln -s "$REPO/node_modules" "$SRC/node_modules"
    else
      (cd "$SRC" && yarn install --frozen-lockfile) >&2
    fi
  fi
fi

(cd "$SRC" && yarn build:without-zip:chrome) >&2
mkdir -p "$OUT"
cp -R "$SRC/dist/chrome_unpacked/." "$OUT/"
echo "built $REF → $OUT" >&2
echo "$OUT"

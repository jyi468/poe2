#!/usr/bin/env bash
# Verify PoB headless prerequisites. Exit 0 = ready, 1 = something missing.
set -uo pipefail
POB_REPO="${POB_REPO:-$HOME/projects/PathOfBuilding-PoE2}"
fail=0

if ! command -v luajit >/dev/null 2>&1; then
	echo "MISSING: luajit  ->  sudo apt-get install -y luajit luarocks libluajit-5.1-dev"
	fail=1
fi
if [ ! -f "$POB_REPO/src/HeadlessWrapper.lua" ]; then
	echo "MISSING: PoB source at $POB_REPO/src (set POB_REPO)"
	fail=1
fi
if [ ! -f "$POB_REPO/runtime/lua/dkjson.lua" ]; then
	echo "MISSING: dkjson at $POB_REPO/runtime/lua/dkjson.lua"
	fail=1
fi
if [ "$fail" -eq 0 ]; then
	echo "OK: luajit + PoB source + dkjson present."
	echo "If eval.lua reports a missing 'lua-utf8' module, run: luarocks install luautf8"
fi
exit "$fail"

# PoB2 Headless Setup (WSL2)

1. Install the interpreter and build tooling:
   `sudo apt-get install -y luajit luarocks libluajit-5.1-dev`
2. If `eval.lua` errors with a missing `lua-utf8` module:
   `luarocks install luautf8` (uses the LuaJIT 5.1 ABI).
3. Verify: `pnpm doctor` (runs `pob/doctor.sh`).
4. Smoke test the engine:
   `cd "$POB_REPO/src" && luajit "$OLDPWD/pob/eval.lua" "/mnt/c/Users/jyi46/OneDrive/Documents/Path of Building (PoE2)/Builds/UR HOMO.xml"`
   Expected: a single JSON line with numeric metrics (e.g. `Life`, `TotalDPS`).

`POB_REPO` defaults to `~/projects/PathOfBuilding-PoE2`; override via env if cloned elsewhere.

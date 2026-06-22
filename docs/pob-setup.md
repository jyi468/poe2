# PoB2 Headless Setup (WSL2)

PoB headless needs a Lua 5.1-compatible interpreter (`luajit`) plus the
`lua-utf8` C module. Two ways to get them:

## Option A — system packages (needs sudo)

1. Install the interpreter and build tooling:
   `sudo apt-get install -y luajit luarocks libluajit-5.1-dev`
2. If `eval.lua` errors with a missing `lua-utf8` module:
   `luarocks install luautf8` (uses the LuaJIT 5.1 ABI).

## Option B — build from source into ~/.local (no sudo) — verified

Used when sudo isn't available. Requires `gcc`/`make`/`git` only.

1. Build LuaJIT (pin matches PoB's Dockerfile):
   ```bash
   git clone https://github.com/LuaJIT/LuaJIT /tmp/LuaJIT-build
   cd /tmp/LuaJIT-build && git checkout 871db2c84ecefd70a850e03a6c340214a81739f0
   make PREFIX="$HOME/.local" -j4 && make install PREFIX="$HOME/.local"
   ```
2. Build the `lua-utf8` module against the LuaJIT headers and drop it on the
   C module path (`require("lua-utf8")` loads `lua-utf8.so` → `luaopen_utf8`):
   ```bash
   git clone https://github.com/starwing/luautf8 /tmp/luautf8
   mkdir -p "$HOME/.local/lib/lua/5.1"
   gcc -O2 -fPIC -shared -I"$HOME/.local/include/luajit-2.1" \
     /tmp/luautf8/lutf8lib.c -o "$HOME/.local/lib/lua/5.1/lua-utf8.so"
   ```
3. Ensure `~/.local/bin` is on PATH (Ubuntu's `~/.profile` does this by default).

## Verify

1. Verify prerequisites: `pnpm doctor` (runs `pob/doctor.sh`).
2. Smoke test the engine:
   `cd "$POB_REPO/src" && luajit "$OLDPWD/pob/eval.lua" "/mnt/c/Users/jyi46/OneDrive/Documents/Path of Building (PoE2)/Builds/UR HOMO.xml"`
   Expected: a single JSON line of numeric metrics (e.g. `Life`, `EnergyShield`).
   Note: defensive stats populate from any saved build; DPS fields read `0`
   until the build has a configured main skill group (PoB reports them as `0`
   in that state too — the bridge is faithful, not wrong).

`POB_REPO` defaults to `~/projects/PathOfBuilding-PoE2`; override via env if cloned elsewhere.

# PoE2 Build & Crafting Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a repo-based workspace that drives Path of Building 2 (PoB2) headlessly to evaluate the owner's build, plus a knowledge/crafting workspace, so an AI assistant can analyze and improve builds with real PoB numbers.

**Architecture:** A Lua bridge (`pob/eval.lua`) runs PoB2's calc engine via its `HeadlessWrapper.lua` under `luajit`, taking a build XML and emitting JSON metrics. A TypeScript layer wraps that bridge, reads/snapshots builds, and decodes/encodes PoB share codes. Markdown knowledge + a scaffolded crafting workspace provide the reasoning context. Live economy scraping and automated build-space optimization are explicitly deferred.

**Tech Stack:** TypeScript + Node (ESM), pnpm, vitest; Lua/LuaJIT bridge against the cloned `PathOfBuilding-PoE2` repo; Node `zlib` for build codes.

## Global Constraints

- Package manager: **pnpm only** (`pnpm dlx`, never `npx`/`npm`). Copied from user global instructions.
- Language above the bridge: **TypeScript / Node, ESM modules** (`"type": "module"`).
- Test runner: **vitest**.
- The bridge is **Lua**, run with **`luajit`**, cwd = `$POB_REPO/src`.
- `POB_REPO` env var, default `~/projects/PathOfBuilding-PoE2`. PoB2 source + `runtime/lua/dkjson.lua` live there.
- Owner's primary build: `/mnt/c/Users/jyi46/OneDrive/Documents/Path of Building (PoE2)/Builds/UR HOMO.xml` (level 96 Ranger/Deadeye) — the golden build for integration tests.
- Platform: WSL2 Linux. Windows paths under `/mnt/c/...`.
- PoB build-code format: `base64(Deflate(xml))` then `+`→`-`, `/`→`_` (URL-safe). Decode is the inverse. (Verified in PoB `src/Classes/ImportTab.lua`.)
- **Out of scope this phase:** live trade/economy scraping, automated build-space search/optimization, any GUI/web app.

---

### Task 1: Project scaffolding & TypeScript toolchain

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`
- Create: `src/index.ts`
- Test: `src/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a working pnpm + vitest + tsc toolchain; ESM project root at repo root.

- [ ] **Step 1: Write the failing test**

`src/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { hello } from "./index.js";

describe("toolchain", () => {
  it("runs and imports ESM", () => {
    expect(hello()).toBe("poe2-assistant");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/smoke.test.ts`
Expected: FAIL — cannot find module `./index.js` / `hello` is not defined.

- [ ] **Step 3: Create the toolchain files and minimal implementation**

`package.json`:
```json
{
  "name": "poe2-assistant",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "doctor": "bash pob/doctor.sh"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "tsx": "^4.16.0",
    "@types/node": "^20.14.0"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["src/**/*.test.ts"] },
});
```

`.gitignore`:
```
node_modules/
dist/
*.log
```

`src/index.ts`:
```ts
export function hello(): string {
  return "poe2-assistant";
}
```

- [ ] **Step 4: Install and run the test**

Run: `pnpm install && pnpm vitest run src/smoke.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts .gitignore src/index.ts src/smoke.test.ts pnpm-lock.yaml
git commit -m "chore: scaffold TypeScript + vitest toolchain"
```

---

### Task 2: PoB2 headless bridge (`pob/eval.lua` + doctor)

**Files:**
- Create: `pob/eval.lua`
- Create: `pob/doctor.sh`
- Create: `docs/pob-setup.md`

**Interfaces:**
- Consumes: `$POB_REPO/src/HeadlessWrapper.lua`, `$POB_REPO/runtime/lua/dkjson.lua`, a build XML path as `arg[1]`.
- Produces: a CLI contract — `cd $POB_REPO/src && luajit <repo>/pob/eval.lua <buildXmlPath>` prints a single JSON object of numeric metrics to stdout (last `{`-prefixed line), or `{"error":"..."}` and exits non-zero. Keys include `TotalDPS`, `CombinedDPS`, `Life`, `EnergyShield`, `Mana`, `FireResist`, `ColdResist`, `LightningResist`, `ChaosResist` when present.

> This task is the integration spike. PoB prints log lines during init via `ConPrintf` → our JSON is the **last** `{`-prefixed stdout line by design.

- [ ] **Step 1: Write `pob/eval.lua`**

```lua
-- pob/eval.lua
-- Run with: cd $POB_REPO/src && luajit <abs path>/pob/eval.lua <buildXmlPath>
-- Emits one JSON object of numeric metrics to stdout, or {"error":"..."} on failure.

local function jsonStr(s)
	s = tostring(s)
		:gsub("\\", "\\\\"):gsub('"', '\\"')
		:gsub("\n", "\\n"):gsub("\r", "\\r"):gsub("\t", "\\t")
	return '"' .. s .. '"'
end

local function emitError(msg)
	io.write('{"error":' .. jsonStr(msg) .. '}\n')
	os.exit(1)
end

local buildPath = arg and arg[1]
if not buildPath then emitError("missing build XML path argument") end

-- Mirror .busted lpath so dkjson and pure-lua deps resolve (cwd is $POB_REPO/src).
package.path = "../runtime/lua/?.lua;../runtime/lua/?/init.lua;" .. package.path

local ok, err = pcall(function() dofile("HeadlessWrapper.lua") end)
if not ok then emitError("failed to init PoB headless: " .. tostring(err)) end
if mainObject and mainObject.promptMsg then
	emitError("PoB startup error: " .. tostring(mainObject.promptMsg))
end

local f, ferr = io.open(buildPath, "r")
if not f then emitError("cannot open build file: " .. tostring(ferr)) end
local xml = f:read("*a"); f:close()

local lok, lerr = pcall(function() loadBuildFromXML(xml, "eval") end)
if not lok then emitError("failed to load build: " .. tostring(lerr)) end

local o = build and build.calcsTab and build.calcsTab.mainOutput
if not o then emitError("no calc output produced") end

local keys = {
	"TotalDPS", "CombinedDPS", "FullDPS", "TotalDot",
	"WithPoisonDPS", "WithBleedDPS", "WithIgniteDPS",
	"Life", "LifeUnreserved", "EnergyShield", "Mana", "ManaUnreserved", "Ward",
	"TotalEHP", "Armour", "Evasion", "BlockChance", "SpellSuppressionChance",
	"FireResist", "ColdResist", "LightningResist", "ChaosResist",
	"CritChance", "CritMultiplier", "Speed",
}

local dkjson = require("dkjson")
local out = {}
for _, k in ipairs(keys) do
	local v = o[k]
	if type(v) == "number" then out[k] = v end
end
io.write(dkjson.encode(out, { indent = false }))
io.write("\n")
```

- [ ] **Step 2: Write `pob/doctor.sh`**

```bash
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
```

- [ ] **Step 3: Write `docs/pob-setup.md`**

```markdown
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
```

- [ ] **Step 4: Run doctor, install deps, run the engine against the golden build**

Run:
```bash
chmod +x pob/doctor.sh && pnpm doctor
# install anything doctor reports missing (see docs/pob-setup.md), then:
cd "$HOME/projects/PathOfBuilding-PoE2/src" && \
  luajit "$HOME/projects/poe2/pob/eval.lua" \
  "/mnt/c/Users/jyi46/OneDrive/Documents/Path of Building (PoE2)/Builds/UR HOMO.xml"
```
Expected: a single JSON object on the last line containing at least `"Life"` and `"EnergyShield"` with positive numbers. If a `lua-utf8` error appears, `luarocks install luautf8` and retry. Record the JSON — Task 3 uses it as a fixture.

- [ ] **Step 5: Commit**

```bash
git add pob/eval.lua pob/doctor.sh docs/pob-setup.md
git commit -m "feat: PoB2 headless eval bridge + setup doctor"
```

---

### Task 3: TypeScript PoB client (`src/pob/evaluate.ts`)

**Files:**
- Create: `src/pob/evaluate.ts`
- Test: `src/pob/evaluate.test.ts`

**Interfaces:**
- Consumes: the `pob/eval.lua` CLI contract from Task 2; `luajit` on PATH.
- Produces:
  - `interface BuildMetrics { TotalDPS?: number; CombinedDPS?: number; FullDPS?: number; Life?: number; EnergyShield?: number; Mana?: number; TotalEHP?: number; FireResist?: number; ColdResist?: number; LightningResist?: number; ChaosResist?: number; [key: string]: number | undefined; }`
  - `function parseEvalOutput(stdout: string): BuildMetrics` — pure; pulls the last `{`-prefixed line, throws on `{"error":...}` or unparseable output.
  - `function evaluateBuild(buildXmlPath: string): BuildMetrics` — spawns the bridge.

- [ ] **Step 1: Write the failing test (pure parser, with PoB log noise)**

`src/pob/evaluate.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseEvalOutput } from "./evaluate.js";

describe("parseEvalOutput", () => {
  it("extracts JSON from the last brace-line ignoring PoB log noise", () => {
    const stdout =
      "Loading main script...\n" +
      "Initialising mod cache\n" +
      '{"Life":4200,"EnergyShield":120,"TotalDPS":1850000,"LightningResist":75}\n';
    const m = parseEvalOutput(stdout);
    expect(m.Life).toBe(4200);
    expect(m.TotalDPS).toBe(1850000);
    expect(m.LightningResist).toBe(75);
  });

  it("throws on a structured engine error", () => {
    expect(() => parseEvalOutput('{"error":"failed to load build: boom"}'))
      .toThrowError(/failed to load build: boom/);
  });

  it("throws when no JSON line is present", () => {
    expect(() => parseEvalOutput("just logs\nno json here"))
      .toThrowError(/no JSON/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/pob/evaluate.test.ts`
Expected: FAIL — `./evaluate.js` not found.

- [ ] **Step 3: Implement `src/pob/evaluate.ts`**

```ts
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

export interface BuildMetrics {
  TotalDPS?: number;
  CombinedDPS?: number;
  FullDPS?: number;
  Life?: number;
  EnergyShield?: number;
  Mana?: number;
  TotalEHP?: number;
  FireResist?: number;
  ColdResist?: number;
  LightningResist?: number;
  ChaosResist?: number;
  [key: string]: number | undefined;
}

const HERE = dirname(fileURLToPath(import.meta.url)); // <root>/src/pob
const REPO_ROOT = join(HERE, "..", "..");
const POB_REPO = process.env.POB_REPO ?? join(homedir(), "projects", "PathOfBuilding-PoE2");
const POB_SRC = join(POB_REPO, "src");
const EVAL_LUA = process.env.POB_EVAL_LUA ?? join(REPO_ROOT, "pob", "eval.lua");

export function parseEvalOutput(stdout: string): BuildMetrics {
  const line = stdout
    .split("\n")
    .map((l) => l.trim())
    .reverse()
    .find((l) => l.startsWith("{"));
  if (!line) throw new Error(`no JSON found in eval output:\n${stdout}`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    throw new Error(`invalid JSON from eval.lua: ${line}`);
  }
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.error === "string") {
    throw new Error(`PoB eval error: ${obj.error}`);
  }
  return obj as BuildMetrics;
}

export function evaluateBuild(buildXmlPath: string): BuildMetrics {
  if (!existsSync(buildXmlPath)) {
    throw new Error(`build file not found: ${buildXmlPath}`);
  }
  const res = spawnSync("luajit", [EVAL_LUA, buildXmlPath], {
    cwd: POB_SRC,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (res.error) {
    throw new Error(`failed to spawn luajit (is it installed?): ${res.error.message}`);
  }
  const stdout = res.stdout ?? "";
  if (!stdout.trim()) {
    throw new Error(`empty output from eval.lua. stderr: ${res.stderr ?? ""}`);
  }
  return parseEvalOutput(stdout);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/pob/evaluate.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Add a golden integration test (gated on luajit)**

Append to `src/pob/evaluate.test.ts`:
```ts
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const GOLDEN = "/mnt/c/Users/jyi46/OneDrive/Documents/Path of Building (PoE2)/Builds/UR HOMO.xml";
function luajitAvailable(): boolean {
  try { execSync("command -v luajit", { stdio: "ignore" }); return true; } catch { return false; }
}
const liveRun = luajitAvailable() && existsSync(GOLDEN);

describe.runIf(liveRun)("evaluateBuild (live PoB engine)", () => {
  it("produces positive Life for the golden build", async () => {
    const { evaluateBuild } = await import("./evaluate.js");
    const m = evaluateBuild(GOLDEN);
    expect(m.Life ?? 0).toBeGreaterThan(0);
  });
});
```

Run: `pnpm vitest run src/pob/evaluate.test.ts`
Expected: PASS — 4 tests if luajit+golden present, else the live block is skipped (still green).

- [ ] **Step 6: Commit**

```bash
git add src/pob/evaluate.ts src/pob/evaluate.test.ts
git commit -m "feat: typed PoB client wrapping the headless eval bridge"
```

---

### Task 4: Build I/O — read & snapshot builds (`src/build-io.ts`)

**Files:**
- Create: `src/build-io.ts`
- Create: `src/fixtures/sample-build.xml`
- Test: `src/build-io.test.ts`

**Interfaces:**
- Consumes: filesystem only.
- Produces:
  - `const ONEDRIVE_BUILDS_DIR: string` — the OneDrive PoB2 Builds folder.
  - `function readBuildXml(path: string): string`
  - `function snapshotBuild(srcPath: string, destDir?: string): string` — copies a build into the repo (default `builds/`), returns the destination path.

- [ ] **Step 1: Create the fixture**

`src/fixtures/sample-build.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<PathOfBuilding2>
	<Build level="96" className="Ranger" ascendClassName="Deadeye"/>
</PathOfBuilding2>
```

- [ ] **Step 2: Write the failing test**

`src/build-io.test.ts`:
```ts
import { describe, it, expect, afterEach } from "vitest";
import { rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { readBuildXml, snapshotBuild } from "./build-io.js";

const FIXTURE = join(import.meta.dirname, "fixtures", "sample-build.xml");
const OUT_DIR = join(import.meta.dirname, "..", ".tmp-builds");

afterEach(() => rmSync(OUT_DIR, { recursive: true, force: true }));

describe("build-io", () => {
  it("reads build XML", () => {
    expect(readBuildXml(FIXTURE)).toContain("<PathOfBuilding2");
  });

  it("snapshots a build into the target dir", () => {
    const dest = snapshotBuild(FIXTURE, OUT_DIR);
    expect(existsSync(dest)).toBe(true);
    expect(readFileSync(dest, "utf8")).toContain("Deadeye");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run src/build-io.test.ts`
Expected: FAIL — `./build-io.js` not found.

- [ ] **Step 4: Implement `src/build-io.ts`**

```ts
import { readFileSync, mkdirSync, copyFileSync } from "node:fs";
import { join, basename } from "node:path";

export const ONEDRIVE_BUILDS_DIR =
  "/mnt/c/Users/jyi46/OneDrive/Documents/Path of Building (PoE2)/Builds";

export function readBuildXml(path: string): string {
  return readFileSync(path, "utf8");
}

export function snapshotBuild(srcPath: string, destDir = "builds"): string {
  mkdirSync(destDir, { recursive: true });
  const dest = join(destDir, basename(srcPath));
  copyFileSync(srcPath, dest);
  return dest;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run src/build-io.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/build-io.ts src/build-io.test.ts src/fixtures/sample-build.xml
git commit -m "feat: build XML read + repo snapshot helpers"
```

---

### Task 5: PoB build-code decode/encode (`src/build-code.ts`)

**Files:**
- Create: `src/build-code.ts`
- Test: `src/build-code.test.ts`

**Interfaces:**
- Consumes: Node `zlib`.
- Produces:
  - `function decodeBuildCode(code: string): string` — URL-safe base64 → zlib inflate → XML.
  - `function encodeBuildCode(xml: string): string` — XML → zlib deflate → URL-safe base64.

- [ ] **Step 1: Write the failing test**

`src/build-code.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { decodeBuildCode, encodeBuildCode } from "./build-code.js";

describe("build-code", () => {
  it("round-trips XML through encode then decode", () => {
    const xml = '<?xml version="1.0"?>\n<PathOfBuilding2><Build level="96"/></PathOfBuilding2>';
    expect(decodeBuildCode(encodeBuildCode(xml))).toBe(xml);
  });

  it("produces URL-safe output (no +, /, or =-padding chars from the alphabet)", () => {
    const code = encodeBuildCode("<PathOfBuilding2/>");
    expect(code).not.toMatch(/[+/]/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/build-code.test.ts`
Expected: FAIL — `./build-code.js` not found.

- [ ] **Step 3: Implement `src/build-code.ts`**

```ts
import { deflateSync, inflateSync } from "node:zlib";

// PoB share codes: base64(Deflate(xml)) with + -> -, / -> _ (see PoB ImportTab.lua).
export function decodeBuildCode(code: string): string {
  const b64 = code.trim().replace(/-/g, "+").replace(/_/g, "/");
  return inflateSync(Buffer.from(b64, "base64")).toString("utf8");
}

export function encodeBuildCode(xml: string): string {
  return deflateSync(Buffer.from(xml, "utf8"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/build-code.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Validate against a real code (manual, optional but recommended)**

In PoB2: open `UR HOMO`, Import/Export tab → "Generate" a code, copy it. Then:
```bash
node --input-type=module -e '
import { decodeBuildCode } from "./src/build-code.ts";
' 2>/dev/null || true
pnpm dlx tsx -e 'import {decodeBuildCode} from "./src/build-code.js"; process.stdin.on("data",d=>console.log(decodeBuildCode(d.toString()).slice(0,80)))'
```
Paste the code, press Ctrl-D. Expected: output starts with `<?xml` / `<PathOfBuilding2`. If it does not, the code is a `pobb.in`-style URL, not a raw export — strip the URL prefix and retry. (No code change needed; this only confirms real-world compatibility.)

- [ ] **Step 6: Commit**

```bash
git add src/build-code.ts src/build-code.test.ts
git commit -m "feat: PoB build-code decode/encode (zlib + url-safe base64)"
```

---

### Task 6: Metrics diff for before/after reports (`src/analyze.ts`)

**Files:**
- Create: `src/analyze.ts`
- Test: `src/analyze.test.ts`

**Interfaces:**
- Consumes: `BuildMetrics` from `src/pob/evaluate.ts`.
- Produces:
  - `interface MetricDelta { key: string; before: number | null; after: number | null; delta: number; pct: number | null; }`
  - `function diffMetrics(before: BuildMetrics, after: BuildMetrics): MetricDelta[]` — union of keys, sorted by descending absolute delta; `pct` is null when `before` is 0 or missing.

- [ ] **Step 1: Write the failing test**

`src/analyze.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { diffMetrics } from "./analyze.js";

describe("diffMetrics", () => {
  it("computes deltas and percentages, sorted by magnitude", () => {
    const before = { Life: 4000, TotalDPS: 1_000_000, FireResist: 75 };
    const after = { Life: 4200, TotalDPS: 1_500_000, FireResist: 75 };
    const d = diffMetrics(before, after);
    expect(d[0].key).toBe("TotalDPS");
    expect(d[0].delta).toBe(500_000);
    const life = d.find((x) => x.key === "Life")!;
    expect(life.pct).toBeCloseTo(5, 5);
  });

  it("handles new keys with null pct", () => {
    const d = diffMetrics({}, { EnergyShield: 300 });
    expect(d[0]).toMatchObject({ key: "EnergyShield", before: null, after: 300, delta: 300, pct: null });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/analyze.test.ts`
Expected: FAIL — `./analyze.js` not found.

- [ ] **Step 3: Implement `src/analyze.ts`**

```ts
import type { BuildMetrics } from "./pob/evaluate.js";

export interface MetricDelta {
  key: string;
  before: number | null;
  after: number | null;
  delta: number;
  pct: number | null;
}

export function diffMetrics(before: BuildMetrics, after: BuildMetrics): MetricDelta[] {
  const keys = new Set<string>([...Object.keys(before), ...Object.keys(after)]);
  const deltas: MetricDelta[] = [];
  for (const key of keys) {
    const b = before[key];
    const a = after[key];
    const bv = typeof b === "number" ? b : null;
    const av = typeof a === "number" ? a : null;
    const delta = (av ?? 0) - (bv ?? 0);
    const pct = bv && bv !== 0 ? (delta / bv) * 100 : null;
    deltas.push({ key, before: bv, after: av, delta, pct });
  }
  return deltas.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/analyze.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/analyze.ts src/analyze.test.ts
git commit -m "feat: before/after build metrics diff"
```

---

### Task 7: Knowledge base + crafting workspace + analysis workflow

**Files:**
- Create (via `/scaffold-workspaces`): `crafting/` workspace (axes: budget / base / method)
- Create: `knowledge/README.md`, `knowledge/patch-notes.md`, `knowledge/mechanics.md`, `knowledge/meta.md`, `knowledge/notes.md`, `knowledge/sources.md`
- Create: `knowledge/workflows/build-analysis.md`

**Interfaces:**
- Consumes: `evaluateBuild`, `diffMetrics`, `snapshotBuild`, `readBuildXml` from earlier tasks (referenced by the workflow doc).
- Produces: the assistant-facing knowledge/crafting context and the documented analysis loop. (Docs only — no automated test; verified by review + link integrity.)

- [ ] **Step 1: Scaffold the crafting workspace**

Invoke the **`/scaffold-workspaces`** skill to generate `crafting/` with three lookup axes — `budget/` (e.g. `ssf-league-start/`, `mid/`, `mirror/`), `base/` (item base types + mod pools), `method/` (techniques → steps + expected cost). Follow the skill's prompts; target directory `crafting/`.

- [ ] **Step 2: Write `knowledge/sources.md`**

```markdown
# Data Sources (items & crafting)

- **poe2db.tw** — https://poe2db.tw/us/ — bases, mods, tiers, tags, skills. Predictable per-item URLs.
- **craftofexile.com** — https://www.craftofexile.com/?game=poe2 — crafting odds & expected cost.
  - Data view / extractor: https://www.craftofexile.com/about — investigate as the cleanest structured-data path before any scraping.

> Phase 1: manual references the assistant distills into `crafting/`. Programmatic pulls + terms-of-use review are a later phase (alongside economy data).
```

- [ ] **Step 3: Write the remaining knowledge seeds**

`knowledge/README.md`:
```markdown
# Knowledge Base

Context the assistant reads to reason about builds and crafting.

- `patch-notes.md` — current patch summary (hand-maintained).
- `mechanics.md` — game mechanics relevant to build math.
- `meta.md` — popular skills/uniques/archetypes this patch.
- `notes.md` — owner's own observations & price sightings.
- `sources.md` — external item/crafting data sources.
- `workflows/build-analysis.md` — the repeatable build-improvement loop.

Live economy scraping is deferred; meta/budget data is hand-maintained for now.
```

Create `knowledge/patch-notes.md`, `knowledge/mechanics.md`, `knowledge/meta.md`, `knowledge/notes.md` each with a single H1 title and a `_TODO: fill in as we learn._` line is **not allowed** — instead seed each with a concrete starter line:
- `patch-notes.md`: `# Patch Notes` + `Current patch: _record version here when known._ Sources: see sources.md.`
- `mechanics.md`: `# Mechanics` + `Damage, defenses (EHP), resistances, ailments — notes accumulate here as they inform build decisions.`
- `meta.md`: `# Meta` + `Popular archetypes / skills / uniques observed this patch. Cross-reference poe2.ninja-style data when added.`
- `notes.md`: `# Owner Notes` + `Personal observations, target items, and price sightings (manual).`

- [ ] **Step 4: Write `knowledge/workflows/build-analysis.md`**

```markdown
# Build Analysis Workflow

Repeatable loop the assistant runs to improve a build.

1. **Snapshot** the current build:
   `snapshotBuild("/mnt/c/Users/jyi46/OneDrive/Documents/Path of Building (PoE2)/Builds/UR HOMO.xml", "builds")`
2. **Baseline**: `const before = evaluateBuild("builds/UR HOMO.xml")`.
3. **Find weak spots**: compare `before` against `knowledge/mechanics.md`
   (uncapped resists, low EHP, DPS bottlenecks) and `knowledge/meta.md`.
4. **Propose** a change (tree node, gem/support swap, item) and produce a modified
   build XML (edit a copy; re-encode with `encodeBuildCode` if sharing).
5. **Re-evaluate**: `const after = evaluateBuild("builds/<variant>.xml")`.
6. **Diff & report**: `diffMetrics(before, after)` → present before/after numbers,
   rough cost (from `crafting/` + sources), and exact steps to apply in PoB2.

Repeat per candidate. Keep accepted changes; discard regressions.
```

- [ ] **Step 5: Verify structure and links**

Run:
```bash
ls -R crafting knowledge
grep -rL "^# " knowledge --include="*.md"   # every md should have an H1; expect no output
```
Expected: `crafting/` shows the three axes; `knowledge/` shows all seed files; the grep prints nothing (all files have a title).

- [ ] **Step 6: Commit**

```bash
git add crafting knowledge
git commit -m "docs: knowledge base, crafting workspace, and build-analysis workflow"
```

---

## Self-Review

**Spec coverage:**
- Layer 1 PoB2 bridge → Task 2. ✓
- Layer 2 Build I/O (read/snapshot + code decode/encode) → Tasks 4 & 5. ✓
- Layer 3 Knowledge base → Task 7. ✓
- Layer 3b Crafting workspace via `/scaffold-workspaces` → Task 7 Step 1. ✓
- Layer 4 Analysis workflow (import→eval→weak spots→propose→re-eval→diff) → Task 6 (diff) + Task 7 Step 4 (documented loop). ✓
- External data sources (poe2db, craftofexile + `/about` extractor) → Task 7 Steps 2. ✓
- Error handling (structured JSON errors + doctor) → Task 2 (`emitError`, `doctor.sh`) + Task 3 (`parseEvalOutput` throws). ✓
- Testing (golden-build snapshot, code round-trip) → Task 3 Step 5, Task 5 Step 1. ✓
- Deferred phases (economy, optimization) → explicitly out of scope; noted in `knowledge/README.md` & `sources.md`. ✓
- TS/Node + pnpm + vitest toolchain → Task 1. ✓

**Placeholder scan:** Task 7 Step 3 explicitly forbids `_TODO_` filler and gives concrete seed lines; "optional" validation steps (Task 5 Step 5, Task 2 dep install) are real actions with commands, not placeholders. No "TBD"/"implement later" remain.

**Type consistency:** `BuildMetrics` defined in Task 3 and imported by Task 6. `diffMetrics`, `evaluateBuild`, `parseEvalOutput`, `decodeBuildCode`, `encodeBuildCode`, `readBuildXml`, `snapshotBuild` names are used consistently across tasks and the workflow doc. `eval.lua` CLI contract (last `{`-line / `{"error":...}`) matches `parseEvalOutput`.

# Crafting Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local web "command center" that wraps the existing poe2-assistant CLIs (economy pull, trade search, craft EV) behind four tabs — Economy, Methods, Craft sim, Trade — so crafting analysis stops being hand-run shell commands.

**Architecture:** Extract the domain logic currently buried in CLI `main()` functions into pure, importable core modules under `src/`. A thin `node:http` server in `src/server/` exposes those cores as a small JSON API. A Vite + React + TS frontend in `app/` renders the four tabs against that API. The existing CLIs keep working by calling the same extracted cores.

**Tech Stack:** Node 20, TypeScript (ESM, strict), tsx, vitest, `node:http` (no web framework), Vite + React 18.

## Global Constraints

- **pnpm only** — never npm or yarn. Use `pnpm dlx` not `npx`.
- **ESM imports** — every relative TypeScript import path ends in `.js`.
- **Immutability** — return new objects; never mutate inputs.
- **No hardcoded secrets/paths** — `POB_REPO` and economy paths come from env or are derived from `import.meta.url`; never hardcode absolute user paths.
- **No code in `knowledge/` or `crafting/`** — those are docs. Code that *reads* them lives in `src/`.
- **File size** — kebab-case `.ts` under `src/`; co-located `*.test.ts`; aim 200–400 lines, 800 max; many small focused files.
- **API envelope** — every API response is `{ ok: true, data: T }` or `{ ok: false, error: string }`.
- **Impact analysis** — before modifying any existing exported symbol or a CLI `main()`, run `gitnexus_impact({target, direction:"upstream"})` if the index is fresh; run `gitnexus_detect_changes()` before each commit. If the index warns stale, skip rather than block.
- **Behavior preservation** — CLI stdout output must not change when logic is extracted; the CLI calls the new core and prints the same lines.
- **Server port** — API server listens on **5179**; Vite dev proxies `/api` to it.

---

### Task 1: Extract economy pull into an importable core

**Files:**
- Create: `src/economy/pull-core.ts`
- Create: `src/economy/pull-core.test.ts`
- Create: `src/fixtures/economy-latest.sample.json`
- Modify: `src/economy/pull.ts` (replace `main()` body with calls into the core)

**Interfaces:**
- Consumes: `getByCategory`, `getLeagues` from `./client.js`; `formatDigest` from `./digest.js`; `normalizeItem`, `pickCurrentLeague` from `./normalize.js`; types `EconomySnapshot`, `NormalizedItem`, `RawItem` from `./types.js`.
- Produces:
  - `interface PullOpts { realm: string; league?: string; hardcore?: boolean; currencyCats?: string[]; uniqueCats?: string[]; onProgress?: (line: string) => void }`
  - `pullEconomy(opts: PullOpts): Promise<EconomySnapshot>` — fetch + assemble, no file write.
  - `writeSnapshot(snapshot: EconomySnapshot): Promise<{ dir: string; digest: string }>` — writes `latest.json`, `latest.md`, `snapshot-<date>.json` under `data/economy/`.
  - `readLatestSnapshot(path?: string): Promise<EconomySnapshot>` — reads `data/economy/latest.json` (default) or an explicit path.
  - `DEFAULT_CURRENCY_CATS`, `DEFAULT_UNIQUE_CATS` (string arrays).

- [ ] **Step 1: Create the fixture**

Create `src/fixtures/economy-latest.sample.json`:

```json
{
  "realm": "poe2",
  "league": "Sample League",
  "pulledAt": "2026-06-25T00:00:00.000Z",
  "divinePriceExalted": 341,
  "currencies": [
    { "key": "exalted", "name": "Exalted Orb", "type": null, "category": "currency", "priceExalted": 1, "quantity": 1000, "time": "2026-06-25T00:00:00" }
  ],
  "uniques": [
    { "key": "mageblood", "name": "Mageblood", "type": "Utility Belt", "category": "accessory", "priceExalted": 200000, "quantity": 10, "time": "2026-06-25T00:00:00" }
  ]
}
```

- [ ] **Step 2: Write the failing test**

Create `src/economy/pull-core.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { readLatestSnapshot } from "./pull-core.js";

const fixture = fileURLToPath(new URL("../fixtures/economy-latest.sample.json", import.meta.url));

describe("readLatestSnapshot", () => {
  it("reads and parses a snapshot file at an explicit path", async () => {
    const snap = await readLatestSnapshot(fixture);
    expect(snap.league).toBe("Sample League");
    expect(snap.divinePriceExalted).toBe(341);
    expect(snap.currencies[0].name).toBe("Exalted Orb");
    expect(snap.uniques).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run src/economy/pull-core.test.ts`
Expected: FAIL — cannot find module `./pull-core.js`.

- [ ] **Step 4: Create `pull-core.ts`**

Move the logic out of `pull.ts`. Create `src/economy/pull-core.ts`:

```ts
// Importable core for the economy pull: fetch+assemble a snapshot, write it to
// disk, and read the latest one back. The CLI (pull.ts) and the API server both
// call these — keep them free of process.argv / console side effects except via
// the injected onProgress callback.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getByCategory, getLeagues } from "./client.js";
import { formatDigest } from "./digest.js";
import { normalizeItem, pickCurrentLeague } from "./normalize.js";
import type { EconomySnapshot, NormalizedItem, RawItem } from "./types.js";

export const DEFAULT_CURRENCY_CATS = ["currency", "essences", "ritual", "breach", "fragments"];
export const DEFAULT_UNIQUE_CATS = ["accessory", "armour", "weapon", "jewel", "flask"];

export interface PullOpts {
  realm: string;
  league?: string;
  hardcore?: boolean;
  currencyCats?: string[];
  uniqueCats?: string[];
  onProgress?: (line: string) => void;
}

function economyDir(): string {
  const here = fileURLToPath(new URL(".", import.meta.url));
  return resolve(here, "../../data/economy");
}

async function collect(
  realm: string,
  league: string,
  kind: "Currencies" | "Uniques",
  cats: string[],
  log: (line: string) => void,
): Promise<NormalizedItem[]> {
  const out: NormalizedItem[] = [];
  const seen = new Set<string>();
  for (const cat of cats) {
    let raw: RawItem[];
    try {
      raw = await getByCategory(realm, league, kind, cat);
    } catch (err) {
      log(`  ! skipped ${kind}/${cat}: ${(err as Error).message}`);
      continue;
    }
    for (const item of raw) {
      const norm = normalizeItem(item, cat);
      const id = `${norm.category}:${norm.key}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(norm);
    }
    log(`  ${kind}/${cat}: ${raw.length} items`);
  }
  return out;
}

export async function pullEconomy(opts: PullOpts): Promise<EconomySnapshot> {
  const log = opts.onProgress ?? (() => {});
  const currencyCats = opts.currencyCats ?? DEFAULT_CURRENCY_CATS;
  const uniqueCats = opts.uniqueCats ?? DEFAULT_UNIQUE_CATS;

  const leagues = await getLeagues(opts.realm);
  const chosen = opts.league
    ? leagues.find((l) => l.Value === opts.league)
    : pickCurrentLeague(leagues, { hardcore: opts.hardcore ?? false });
  if (!chosen) throw new Error("Could not resolve a current league; pass league.");
  log(`League: ${chosen.Value} (1 div ≈ ${Math.round(chosen.DivinePrice ?? 0)} ex)`);

  const currencies = await collect(opts.realm, chosen.Value, "Currencies", currencyCats, log);
  const uniques = await collect(opts.realm, chosen.Value, "Uniques", uniqueCats, log);

  return {
    realm: opts.realm,
    league: chosen.Value,
    pulledAt: new Date().toISOString(),
    divinePriceExalted: chosen.DivinePrice,
    currencies,
    uniques,
  };
}

export async function writeSnapshot(
  snapshot: EconomySnapshot,
): Promise<{ dir: string; digest: string }> {
  const dir = economyDir();
  await mkdir(dir, { recursive: true });
  const digest = formatDigest(snapshot);
  const stamp = snapshot.pulledAt.slice(0, 10);
  const json = JSON.stringify(snapshot, null, 2);
  await writeFile(resolve(dir, "latest.json"), json);
  await writeFile(resolve(dir, "latest.md"), digest);
  await writeFile(resolve(dir, `snapshot-${stamp}.json`), json);
  return { dir, digest };
}

export async function readLatestSnapshot(path?: string): Promise<EconomySnapshot> {
  const file = path ?? resolve(economyDir(), "latest.json");
  return JSON.parse(await readFile(file, "utf8")) as EconomySnapshot;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/economy/pull-core.test.ts`
Expected: PASS.

- [ ] **Step 6: Rewrite `pull.ts` to use the core (behavior-preserving)**

Replace the entire body of `src/economy/pull.ts` with:

```ts
// CLI: pull a live economy snapshot from poe2scout and write JSON + a markdown
// digest under data/economy/. Run: pnpm economy [-- --hardcore --league "Name"]
//
// All logic lives in pull-core.ts; this file is the argv + stdout wrapper.

import {
  DEFAULT_CURRENCY_CATS,
  DEFAULT_UNIQUE_CATS,
  pullEconomy,
  writeSnapshot,
  type PullOpts,
} from "./pull-core.js";

function parseArgs(argv: string[]): PullOpts {
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const list = (flag: string, fallback: string[]) => {
    const v = get(flag);
    return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : fallback;
  };
  return {
    realm: get("--realm") ?? "poe2",
    league: get("--league"),
    hardcore: argv.includes("--hardcore"),
    currencyCats: list("--currency-cats", DEFAULT_CURRENCY_CATS),
    uniqueCats: list("--unique-cats", DEFAULT_UNIQUE_CATS),
  };
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  console.log(`Pulling ${opts.realm} economy from poe2scout…`);
  const snapshot = await pullEconomy({ ...opts, onProgress: (l) => console.log(l) });
  const { dir, digest } = await writeSnapshot(snapshot);
  console.log(
    `\nWrote ${snapshot.currencies.length} currencies + ${snapshot.uniques.length} uniques to ${dir}`,
  );
  console.log(`\n${digest}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 7: Verify the CLI still runs**

Run: `POB_REPO="$HOME/projects/PathOfBuilding-PoE2" pnpm economy 2>&1 | tail -5`
Expected: pulls and prints the digest as before (network permitting). If offline, confirm it reaches the network call and fails gracefully — no syntax/import error.

- [ ] **Step 8: Commit**

```bash
git add src/economy/pull-core.ts src/economy/pull-core.test.ts src/economy/pull.ts src/fixtures/economy-latest.sample.json
git commit -m "refactor: extract economy pull into importable pull-core"
```

---

### Task 2: Extract trade search into an importable core

**Files:**
- Create: `src/economy/trade-core.ts`
- Create: `src/economy/trade-core.test.ts`
- Modify: `src/economy/trade.ts` (use the core; keep CLI printing)

**Interfaces:**
- Consumes: `getLeagues` from `./client.js`.
- Produces:
  - `interface StatFilter { id: string; min?: number; max?: number }`
  - `interface QuerySpec { label?: string; category?: string; rarity?: string; name?: string; type?: string; stats?: StatFilter[]; sort?: "asc" | "desc"; limit?: number; corrupted?: boolean; qualityMin?: number }`
  - `interface TradeListing { priceAmount: number | null; priceCurrency: string | null; priceExalted: number | null; typeLine: string; ilvl?: number; mods: string[] }`
  - `interface TradeResult { label: string; total: number; listings: TradeListing[] }`
  - `buildBody(spec: QuerySpec): unknown` — the trade2 query JSON.
  - `searchTrade(spec: QuerySpec, league: string, divine: number): Promise<TradeResult>`
  - `findStats(text: string): Promise<{ label: string; id: string; text: string }[]>`

- [ ] **Step 1: Write the failing test**

Create `src/economy/trade-core.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildBody } from "./trade-core.js";

describe("buildBody", () => {
  it("builds an and-group of stat filters with min/max and type filters", () => {
    const body = buildBody({
      category: "jewel",
      rarity: "nonunique",
      stats: [{ id: "explicit.stat_1", min: 8 }, { id: "explicit.stat_2" }],
      sort: "asc",
    }) as any;
    expect(body.query.status.option).toBe("online");
    expect(body.query.stats[0].type).toBe("and");
    expect(body.query.stats[0].filters[0]).toEqual({ id: "explicit.stat_1", value: { min: 8 } });
    expect(body.query.stats[0].filters[1]).toEqual({ id: "explicit.stat_2" });
    expect(body.query.filters.type_filters.filters.category.option).toBe("jewel");
    expect(body.query.filters.type_filters.filters.rarity.option).toBe("nonunique");
    expect(body.sort.price).toBe("asc");
  });

  it("omits stats and filters when none are given", () => {
    const body = buildBody({}) as any;
    expect(body.query.stats).toBeUndefined();
    expect(body.query.filters).toBeUndefined();
    expect(body.sort.price).toBe("asc");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/economy/trade-core.test.ts`
Expected: FAIL — cannot find module `./trade-core.js`.

- [ ] **Step 3: Create `trade-core.ts`**

Create `src/economy/trade-core.ts` (lifts `buildBody`, `runQuery`, `findStats`, and the http helpers out of `trade.ts`, returning data instead of printing):

```ts
// Importable core for the official PoE2 trade2 API. buildBody is pure; searchTrade
// performs the search+fetch round-trip and returns structured listings. The CLI
// (trade.ts) prints these; the API server returns them as JSON.

const BASE = "https://www.pathofexile.com/api/trade2";
const HEADERS = {
  "User-Agent": "poe2-assistant/trade (Contact jyi468@gmail.com)",
  "Content-Type": "application/json",
};

export interface StatFilter {
  id: string;
  min?: number;
  max?: number;
}
export interface QuerySpec {
  label?: string;
  category?: string;
  rarity?: string;
  name?: string;
  type?: string;
  stats?: StatFilter[];
  sort?: "asc" | "desc";
  limit?: number;
  corrupted?: boolean;
  qualityMin?: number;
}
export interface TradeListing {
  priceAmount: number | null;
  priceCurrency: string | null;
  priceExalted: number | null;
  typeLine: string;
  ilvl?: number;
  mods: string[];
}
export interface TradeResult {
  label: string;
  total: number;
  listings: TradeListing[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function postJson<T>(url: string, body: unknown, attempt = 0): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: HEADERS, body: JSON.stringify(body) });
  if (res.status === 429 && attempt < 4) {
    const wait = Number(res.headers.get("Retry-After") ?? 8) * 1000;
    await sleep(wait);
    return postJson<T>(url, body, attempt + 1);
  }
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

async function getJson<T>(url: string, attempt = 0): Promise<T> {
  const res = await fetch(url, { headers: HEADERS });
  if (res.status === 429 && attempt < 4) {
    const wait = Number(res.headers.get("Retry-After") ?? 8) * 1000;
    await sleep(wait);
    return getJson<T>(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export function buildBody(spec: QuerySpec): unknown {
  const query: Record<string, unknown> = { status: { option: "online" } };
  if (spec.name) query.name = spec.name;
  if (spec.type) query.type = spec.type;
  if (spec.stats?.length) {
    query.stats = [
      {
        type: "and",
        filters: spec.stats.map((s) => {
          const value: Record<string, number> = {};
          if (s.min != null) value.min = s.min;
          if (s.max != null) value.max = s.max;
          return Object.keys(value).length ? { id: s.id, value } : { id: s.id };
        }),
      },
    ];
  }
  const typeFilters: Record<string, unknown> = {};
  if (spec.category) typeFilters.category = { option: spec.category };
  if (spec.rarity) typeFilters.rarity = { option: spec.rarity };
  const miscFilters: Record<string, unknown> = {};
  if (spec.corrupted != null) miscFilters.corrupted = { option: String(spec.corrupted) };
  if (spec.qualityMin != null) miscFilters.quality = { min: spec.qualityMin };
  const filters: Record<string, unknown> = {};
  if (Object.keys(typeFilters).length) filters.type_filters = { filters: typeFilters };
  if (Object.keys(miscFilters).length) filters.misc_filters = { filters: miscFilters };
  if (Object.keys(filters).length) query.filters = filters;
  return { query, sort: { price: spec.sort ?? "asc" } };
}

type ModEntry = string | { description?: string; mods?: { tier?: string }[] };
interface RawListing {
  listing: { price: { amount: number; currency: string } | null };
  item: { typeLine?: string; explicitMods?: ModEntry[]; ilvl?: number };
}

function modText(m: ModEntry): string {
  if (typeof m === "string") return m;
  const tier = m.mods?.[0]?.tier ? ` [${m.mods[0].tier}]` : "";
  return `${m.description ?? JSON.stringify(m)}${tier}`;
}

export async function searchTrade(
  spec: QuerySpec,
  league: string,
  divine: number,
): Promise<TradeResult> {
  const label = spec.label ?? spec.name ?? spec.category ?? "query";
  const limit = spec.limit ?? 6;
  const search = await postJson<{ id: string; total: number; result: string[] }>(
    `${BASE}/search/poe2/${encodeURIComponent(league)}`,
    buildBody(spec),
  );
  if (!search.result?.length) return { label, total: search.total, listings: [] };
  const ids = search.result.slice(0, limit).join(",");
  const fetched = await getJson<{ result: (RawListing | null)[] }>(
    `${BASE}/fetch/${ids}?query=${search.id}&realm=poe2`,
  );
  const listings: TradeListing[] = [];
  for (const r of fetched.result) {
    if (!r) continue;
    const price = r.listing?.price ?? null;
    const exalted = price ? (price.currency === "divine" ? price.amount * divine : price.amount) : null;
    listings.push({
      priceAmount: price?.amount ?? null,
      priceCurrency: price?.currency ?? null,
      priceExalted: exalted == null ? null : Math.round(exalted),
      typeLine: r.item.typeLine ?? "?",
      ilvl: r.item.ilvl,
      mods: (r.item.explicitMods ?? []).map(modText),
    });
  }
  await sleep(1500);
  return { label, total: search.total, listings };
}

export async function findStats(text: string): Promise<{ label: string; id: string; text: string }[]> {
  const data = await getJson<{ result: { label: string; entries: { id: string; text: string }[] }[] }>(
    `${BASE}/data/stats`,
  );
  const needle = text.toLowerCase();
  const out: { label: string; id: string; text: string }[] = [];
  for (const grp of data.result) {
    for (const e of grp.entries) {
      if (e.text.toLowerCase().includes(needle)) out.push({ label: grp.label, id: e.id, text: e.text });
    }
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/economy/trade-core.test.ts`
Expected: PASS.

- [ ] **Step 5: Rewrite `trade.ts` to use the core**

Replace `src/economy/trade.ts` with the CLI wrapper that prints `TradeResult`:

```ts
// CLI for the official PoE2 trade2 API. Logic lives in trade-core.ts; this file
// parses flags and prints. Usage unchanged:
//   pnpm trade --find "critical damage bonus"
//   pnpm trade --category jewel --rarity nonunique --stat explicit.stat_x:8 --limit 8
//   pnpm trade --batch path/to/queries.json

import { readFile } from "node:fs/promises";

import { getLeagues } from "./client.js";
import { findStats, searchTrade, type QuerySpec, type TradeResult } from "./trade-core.js";

function printResult(r: TradeResult, divine: number): void {
  console.log(`\n### ${r.label} — ${r.total} listings`);
  if (!r.listings.length) {
    console.log("  (no matches)");
    return;
  }
  for (const l of r.listings) {
    const exq = l.priceExalted ?? 0;
    console.log(
      `  ${l.priceAmount} ${l.priceCurrency} (~${exq} ex / ${(exq / divine).toFixed(2)} div) | ${l.typeLine} [${l.mods.length} mods]`,
    );
    for (const m of l.mods) console.log(`      ${m}`);
  }
}

function parseFlags(argv: string[]): QuerySpec & { find?: string; batch?: string; league?: string } {
  const out: QuerySpec & { find?: string; batch?: string; league?: string } = { stats: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--find") out.find = next();
    else if (a === "--batch") out.batch = next();
    else if (a === "--league") out.league = next();
    else if (a === "--category") out.category = next();
    else if (a === "--rarity") out.rarity = next();
    else if (a === "--name") out.name = next();
    else if (a === "--type") out.type = next();
    else if (a === "--sort") out.sort = next() as "asc" | "desc";
    else if (a === "--limit") out.limit = Number(next());
    else if (a === "--stat") {
      const [id, min, max] = next().split(":");
      out.stats!.push({ id, min: min ? Number(min) : undefined, max: max ? Number(max) : undefined });
    }
  }
  return out;
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));
  if (flags.find) {
    for (const s of await findStats(flags.find)) console.log(`${s.label.padEnd(10)} ${s.id.padEnd(28)} ${s.text}`);
    return;
  }
  const leagues = await getLeagues("poe2");
  const current =
    leagues.find((l) => l.Value === flags.league) ??
    leagues.find((l) => l.IsCurrent && !l.Value.startsWith("HC "));
  if (!current) throw new Error("No current league; pass --league.");
  const divine = current.DivinePrice ?? 1;
  console.log(`League: ${current.Value} (1 div ≈ ${Math.round(divine)} ex)`);
  if (flags.batch) {
    const specs = JSON.parse(await readFile(flags.batch, "utf8")) as QuerySpec[];
    for (const spec of specs) printResult(await searchTrade(spec, current.Value, divine), divine);
  } else {
    printResult(await searchTrade(flags, current.Value, divine), divine);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 6: Verify the CLI still parses (offline-safe path)**

Run: `pnpm tsx src/economy/trade.ts --category jewel --rarity nonunique --stat explicit.stat_x:8 2>&1 | head -3`
Expected: prints `League: …` then attempts the network call — no import/type error. (A network failure here is fine; we only verify the code path loads.)

- [ ] **Step 7: Commit**

```bash
git add src/economy/trade-core.ts src/economy/trade-core.test.ts src/economy/trade.ts
git commit -m "refactor: extract trade search into importable trade-core"
```

---

### Task 3: Extract craft EV estimator into a pure function

**Files:**
- Create: `src/crafting-sim/estimate.ts`
- Create: `src/crafting-sim/estimate.test.ts`
- Modify: `src/crafting-sim/magic-craft.ts` (call `estimateCraft`, keep printed output)

**Interfaces:**
- Consumes: `ModTier`, `statLow`, `statHigh` from `./pob-mods.js`.
- Produces:
  - `interface WeightBand { low: number; central: number; high: number }`
  - `interface OrbPrices { transmute: number; augment: number; divine: number }`
  - `interface CraftInput { prefixes: ModTier[]; suffixes: ModTier[]; prefixGroup?: string; prefixMin?: number; suffixStat?: string; weights: { pref: WeightBand; suf: WeightBand }; orb: OrbPrices; buyPriceDiv: number; baseCostsEx?: number[] }`
  - `interface CraftScenario { label: string; pPref: number; pSuf: number; p: number; attempts: number; currencyOnlyDiv: number; withBase: { baseEx: number; totalDiv: number; cheaperThanBuy: boolean }[]; breakevenBaseEx: number }`
  - `interface TargetTier { affix: string; stat: string; level: number; fracAboveMin: number }`
  - `interface CraftEstimate { prefixGroups: number; suffixGroups: number; targetPrefixTiers: TargetTier[]; targetSuffix: { affix: string; stat: string; level: number } | null; scenarios: CraftScenario[] }`
  - `fracAbove(tier: ModTier, min: number): number`
  - `estimateCraft(input: CraftInput): CraftEstimate`

- [ ] **Step 1: Write the failing test**

Create `src/crafting-sim/estimate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { estimateCraft, fracAbove, type CraftInput } from "./estimate.js";
import type { ModTier } from "./pob-mods.js";

function tier(partial: Partial<ModTier>): ModTier {
  return {
    id: "x", type: "Prefix", affix: "T", stat: "(60-84)% increased Physical Damage",
    level: 1, group: "G", weightKeys: ["bow"], canSpawnOn: () => true, ...partial,
  };
}

describe("fracAbove", () => {
  it("is 1 when whole range clears the threshold", () => {
    expect(fracAbove(tier({ stat: "(70-84)% increased Physical Damage" }), 66)).toBe(1);
  });
  it("is 0 when whole range is below", () => {
    expect(fracAbove(tier({ stat: "(40-60)% increased Physical Damage" }), 66)).toBe(0);
  });
  it("is the partial fraction for a straddling range", () => {
    // (60-84): portion above 66 = (84-66)/(84-60) = 18/24 = 0.75
    expect(fracAbove(tier({ stat: "(60-84)% increased Physical Damage" }), 66)).toBeCloseTo(0.75, 5);
  });
});

describe("estimateCraft", () => {
  const input: CraftInput = {
    prefixes: [tier({ group: "PhysPct", stat: "(60-84)% increased Physical Damage" })],
    suffixes: [tier({ type: "Suffix", group: "ProjLevel", stat: "+4 to Level of all Projectile Skills", affix: "of the Sniper", level: 81 })],
    prefixGroup: "PhysPct",
    prefixMin: 66,
    suffixStat: "+4 to Level of all Projectile Skills",
    weights: { pref: { low: 0.04, central: 0.07, high: 0.1 }, suf: { low: 0.004, central: 0.008, high: 0.015 } },
    orb: { transmute: 0.16, augment: 0.28, divine: 341 },
    buyPriceDiv: 30,
  };

  it("computes central scenario odds and attempts", () => {
    const est = estimateCraft(input);
    const central = est.scenarios.find((s) => s.label.includes("CENTRAL"))!;
    // pPref central is weight*fracAbove = 0.07*0.75 = 0.0525; pSuf = 0.008
    expect(central.pPref).toBeCloseTo(0.0525, 4);
    expect(central.pSuf).toBeCloseTo(0.008, 4);
    expect(central.p).toBeCloseTo(0.0525 * 0.008, 6);
    expect(central.attempts).toBeCloseTo(1 / (0.0525 * 0.008), 1);
  });

  it("reports the target tiers and suffix availability", () => {
    const est = estimateCraft(input);
    expect(est.targetPrefixTiers[0].fracAboveMin).toBeCloseTo(0.75, 5);
    expect(est.targetSuffix?.stat).toBe("+4 to Level of all Projectile Skills");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/crafting-sim/estimate.test.ts`
Expected: FAIL — cannot find module `./estimate.js`.

- [ ] **Step 3: Create `estimate.ts`**

Create `src/crafting-sim/estimate.ts`. The `pPref` for a band is `weightBand * (max fracAbove across qualifying tiers of the group)`; `pSuf` is the band value directly (the suffix is a single target tier). Per-attempt cost mirrors `magic-craft.ts`:

```ts
// Pure EV estimator for a Transmute->Augment magic craft targeting one prefix
// group (optionally above a value threshold) and one suffix stat. Weight bands
// are MODELLED (PoB ships no real spawn weights) — callers pass low/central/high.

import { statHigh, statLow, type ModTier } from "./pob-mods.js";

export interface WeightBand { low: number; central: number; high: number }
export interface OrbPrices { transmute: number; augment: number; divine: number }
export interface CraftInput {
  prefixes: ModTier[];
  suffixes: ModTier[];
  prefixGroup?: string;
  prefixMin?: number;
  suffixStat?: string;
  weights: { pref: WeightBand; suf: WeightBand };
  orb: OrbPrices;
  buyPriceDiv: number;
  baseCostsEx?: number[];
}
export interface CraftScenario {
  label: string;
  pPref: number;
  pSuf: number;
  p: number;
  attempts: number;
  currencyOnlyDiv: number;
  withBase: { baseEx: number; totalDiv: number; cheaperThanBuy: boolean }[];
  breakevenBaseEx: number;
}
export interface TargetTier { affix: string; stat: string; level: number; fracAboveMin: number }
export interface CraftEstimate {
  prefixGroups: number;
  suffixGroups: number;
  targetPrefixTiers: TargetTier[];
  targetSuffix: { affix: string; stat: string; level: number } | null;
  scenarios: CraftScenario[];
}

const DEFAULT_BASE_COSTS = [1, 3, 5, 10, 20];

/** Fraction of a tier's roll-range strictly greater than `min` (uniform). */
export function fracAbove(tier: ModTier, min: number): number {
  const lo = statLow(tier.stat);
  const hi = statHigh(tier.stat);
  if (hi <= min) return 0;
  if (lo > min) return 1;
  return (hi - min) / (hi - lo);
}

function uniqueGroups(pool: ModTier[]): number {
  return new Set(pool.map((t) => t.group)).size;
}

export function estimateCraft(input: CraftInput): CraftEstimate {
  const { prefixes, suffixes, prefixGroup, prefixMin, suffixStat, weights, orb, buyPriceDiv } = input;
  const baseCosts = input.baseCostsEx ?? DEFAULT_BASE_COSTS;

  const groupTiers = prefixGroup ? prefixes.filter((t) => t.group === prefixGroup) : [];
  const min = prefixMin ?? 0;
  const targetPrefixTiers: TargetTier[] = groupTiers.map((t) => ({
    affix: t.affix, stat: t.stat, level: t.level, fracAboveMin: fracAbove(t, min),
  }));
  const bestFrac = targetPrefixTiers.reduce((m, t) => Math.max(m, t.fracAboveMin), 0);
  const prefFracForOdds = prefixGroup ? bestFrac : 1; // no prefix target -> doesn't gate

  const suffixTier = suffixStat ? suffixes.find((t) => t.stat === suffixStat) ?? null : null;
  const targetSuffix = suffixTier
    ? { affix: suffixTier.affix, stat: suffixTier.stat, level: suffixTier.level }
    : null;
  const sufHasTarget = suffixStat ? suffixTier != null : true;

  const make = (label: string, pPrefRaw: number, pSufRaw: number): CraftScenario => {
    const pPref = prefixGroup ? pPrefRaw * prefFracForOdds : 1;
    const pSuf = suffixStat ? (sufHasTarget ? pSufRaw : 0) : 1;
    const p = pPref * pSuf;
    const attempts = p > 0 ? 1 / p : Infinity;
    const costPerAttempt = orb.transmute + (pPref + pSuf) * orb.augment;
    const currencyOnlyDiv = (attempts * costPerAttempt) / orb.divine;
    const budgetEx = buyPriceDiv * orb.divine;
    const breakevenBaseEx = budgetEx / attempts - costPerAttempt;
    const withBase = baseCosts.map((baseEx) => {
      const totalDiv = (attempts * (costPerAttempt + baseEx)) / orb.divine;
      return { baseEx, totalDiv, cheaperThanBuy: totalDiv < buyPriceDiv };
    });
    return { label, pPref, pSuf, p, attempts, currencyOnlyDiv, withBase, breakevenBaseEx };
  };

  return {
    prefixGroups: uniqueGroups(prefixes),
    suffixGroups: uniqueGroups(suffixes),
    targetPrefixTiers,
    targetSuffix,
    scenarios: [
      make("LUCKY (high weights)", weights.pref.high, weights.suf.high),
      make("CENTRAL estimate", weights.pref.central, weights.suf.central),
      make("UNLUCKY (low weights)", weights.pref.low, weights.suf.low),
    ],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/crafting-sim/estimate.test.ts`
Expected: PASS.

- [ ] **Step 5: Rewrite `magic-craft.ts` to use `estimateCraft`**

Replace `src/crafting-sim/magic-craft.ts` from the `// ---- main` section onward so it loads pools, calls `estimateCraft`, and prints the scenarios. Keep the top constants (BASE_WEIGHTKEYS, ITEM_LEVEL, PREFIX_GROUP, PREFIX_MIN_VALUE, SUFFIX_STAT_MATCH, BUY_PRICE_DIV, P_PREF, P_SUF) and the `orbPrices()` helper. Replace the computation/printing tail with:

```ts
import { estimateCraft } from "./estimate.js";
// ...keep existing imports, constants, orbPrices(), pct(), oneIn()...

const tiers = loadModTiers();
const prefixes = poolFor(tiers, BASE_WEIGHTKEYS, "Prefix", ITEM_LEVEL);
const suffixes = poolFor(tiers, BASE_WEIGHTKEYS, "Suffix", ITEM_LEVEL);
const prices = orbPrices();

const est = estimateCraft({
  prefixes,
  suffixes,
  prefixGroup: PREFIX_GROUP,
  prefixMin: PREFIX_MIN_VALUE,
  suffixStat: SUFFIX_STAT_MATCH,
  weights: { pref: P_PREF, suf: P_SUF },
  orb: {
    transmute: prices["Orb of Transmutation"] ?? 0.16,
    augment: prices["Orb of Augmentation"] ?? 0.28,
    divine: prices._divine,
  },
  buyPriceDiv: BUY_PRICE_DIV,
});

console.log(`\n=== ${BASE_WEIGHTKEYS[0]} @ ilvl ${ITEM_LEVEL} — magic Transmute->Augment craft ===\n`);
console.log(`Prefix pool groups: ${est.prefixGroups}   Suffix pool groups: ${est.suffixGroups}\n`);
console.log(`TARGET PREFIX "%increased Physical Damage" > ${PREFIX_MIN_VALUE}% (group ${PREFIX_GROUP}):`);
for (const t of est.targetPrefixTiers) {
  const mark = t.fracAboveMin === 0 ? "✗" : t.fracAboveMin === 1 ? "✓" : `~${pct(t.fracAboveMin)} of rolls`;
  console.log(`   ${t.affix.padEnd(14)} ${t.stat.padEnd(34)} ilvl${String(t.level).padStart(3)}  ${mark}`);
}
console.log(`\nTARGET SUFFIX "${SUFFIX_STAT_MATCH}": ${est.targetSuffix ? `ilvl ${est.targetSuffix.level} ✓` : "✗ not available"}\n`);
const DIV = prices._divine;
for (const s of est.scenarios) {
  console.log(`-- ${s.label}: P_pref=${pct(s.pPref)}, P_suf=${pct(s.pSuf)}`);
  console.log(`   per attempt: ${pct(s.p)} (${oneIn(s.p)})  expected attempts: ${Math.round(s.attempts).toLocaleString()}`);
  console.log(`   currency only (free bases): ${s.currencyOnlyDiv.toFixed(1)} div`);
  for (const b of s.withBase) {
    console.log(`     + white base @ ${String(b.baseEx).padStart(2)} ex: ${b.totalDiv.toFixed(1).padStart(6)} div  ${b.cheaperThanBuy ? "← cheaper than buying" : ""}`);
  }
  console.log(`   BREAK-EVEN vs ${BUY_PRICE_DIV} div: craft wins if white bases < ${s.breakevenBaseEx.toFixed(1)} ex each\n`);
}
```

(`pct`/`oneIn` stay; the `scenario()` function and the old per-tier loop are removed. Drop the now-unused `statLow`/`statHigh` import from magic-craft since `estimate.ts` owns `fracAbove`.)

- [ ] **Step 6: Verify the CLI output is equivalent**

Run: `POB_REPO="$HOME/projects/PathOfBuilding-PoE2" pnpm craft-sim 2>&1 | head -30`
Expected: same shape of output (pool groups, target prefix tiers with ✓/✗/~%, three scenarios with attempts + break-even).

- [ ] **Step 7: Commit**

```bash
git add src/crafting-sim/estimate.ts src/crafting-sim/estimate.test.ts src/crafting-sim/magic-craft.ts
git commit -m "refactor: extract pure estimateCraft from magic-craft CLI"
```

---

### Task 4: Slot-scan core (per-slot pool sizes + chase mods)

**Files:**
- Create: `src/crafting-sim/slots.ts`
- Create: `src/crafting-sim/slots.test.ts`

**Interfaces:**
- Consumes: `loadModTiers`, `poolFor`, `ModTier` from `./pob-mods.js`.
- Produces:
  - `interface ChaseMod { type: "Prefix" | "Suffix"; affix: string; stat: string; level: number; group: string }`
  - `interface SlotSummary { slot: string; keys: string[]; prefixCount: number; prefixGroups: number; suffixCount: number; suffixGroups: number; chase: ChaseMod[] }`
  - `const SLOT_DEFS: { name: string; keys: string[] }[]`
  - `scanSlots(ilvl: number, tiers?: ModTier[]): SlotSummary[]` — defaults to `loadModTiers()`.

- [ ] **Step 1: Write the failing test**

Create `src/crafting-sim/slots.test.ts` (pure: pass synthetic tiers so it needs no PoB install):

```ts
import { describe, it, expect } from "vitest";
import { scanSlots } from "./slots.js";
import type { ModTier } from "./pob-mods.js";

function t(p: Partial<ModTier>): ModTier {
  return {
    id: "x", type: "Suffix", affix: "of the Sniper",
    stat: "+4 to Level of all Projectile Skills", level: 81, group: "ProjLevel",
    weightKeys: ["bow"], canSpawnOn: (k) => k === "bow", ...p,
  };
}

describe("scanSlots", () => {
  it("summarizes pool sizes and flags chase mods per slot", () => {
    const tiers: ModTier[] = [
      t({}),
      t({ id: "y", type: "Prefix", group: "PhysPct", affix: "Tyrannical", stat: "(70-84)% increased Physical Damage" }),
    ];
    const bow = scanSlots(82, tiers).find((s) => s.slot === "bow")!;
    expect(bow.suffixGroups).toBe(1);
    expect(bow.prefixGroups).toBe(1);
    expect(bow.chase.some((c) => c.stat.includes("Projectile Skills"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/crafting-sim/slots.test.ts`
Expected: FAIL — cannot find module `./slots.js`.

- [ ] **Step 3: Create `slots.ts`**

```ts
// Per-slot mod-pool structure from PoB's tier tables: pool sizes (the variance
// driver) plus the "chase" mods (+skill levels, Spirit, additional projectile)
// with their ilvl gates and value ranges. Pure over an injected tier list.

import { loadModTiers, poolFor, type ModTier } from "./pob-mods.js";

export const SLOT_DEFS: { name: string; keys: string[] }[] = [
  { name: "amulet", keys: ["amulet"] },
  { name: "ring", keys: ["ring"] },
  { name: "wand", keys: ["wand", "weapon"] },
  { name: "sceptre", keys: ["sceptre", "weapon"] },
  { name: "focus", keys: ["focus"] },
  { name: "staff", keys: ["staff", "weapon"] },
  { name: "bow", keys: ["bow", "weapon"] },
  { name: "spear", keys: ["spear", "weapon"] },
  { name: "crossbow", keys: ["crossbow", "weapon"] },
  { name: "quiver", keys: ["quiver"] },
  { name: "gloves", keys: ["gloves"] },
  { name: "boots", keys: ["boots"] },
  { name: "belt", keys: ["belt"] },
  { name: "helmet", keys: ["helmet"] },
  { name: "body_armour", keys: ["body_armour"] },
];

const CHASE = [/to Level of all .* Skills/i, /\bSpirit\b/i, /additional Arrow|additional Projectile/i];

export interface ChaseMod {
  type: "Prefix" | "Suffix";
  affix: string;
  stat: string;
  level: number;
  group: string;
}
export interface SlotSummary {
  slot: string;
  keys: string[];
  prefixCount: number;
  prefixGroups: number;
  suffixCount: number;
  suffixGroups: number;
  chase: ChaseMod[];
}

function groups(pool: ModTier[]): number {
  return new Set(pool.map((t) => t.group)).size;
}

export function scanSlots(ilvl: number, tiers: ModTier[] = loadModTiers()): SlotSummary[] {
  return SLOT_DEFS.map((s) => {
    const pre = poolFor(tiers, s.keys, "Prefix", ilvl);
    const suf = poolFor(tiers, s.keys, "Suffix", ilvl);
    const byGroup = new Map<string, ChaseMod>();
    for (const t of [...pre, ...suf]) {
      if (!CHASE.some((r) => r.test(t.stat))) continue;
      const cur = byGroup.get(t.group);
      if (!cur || t.level > cur.level) {
        byGroup.set(t.group, { type: t.type, affix: t.affix, stat: t.stat, level: t.level, group: t.group });
      }
    }
    return {
      slot: s.name,
      keys: s.keys,
      prefixCount: pre.length,
      prefixGroups: groups(pre),
      suffixCount: suf.length,
      suffixGroups: groups(suf),
      chase: [...byGroup.values()].sort((a, b) => b.level - a.level),
    };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/crafting-sim/slots.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/crafting-sim/slots.ts src/crafting-sim/slots.test.ts
git commit -m "feat: add per-slot mod-pool scan core"
```

---

### Task 5: Method-board parser

**Files:**
- Create: `src/methods/parse.ts`
- Create: `src/methods/parse.test.ts`
- Create: `src/fixtures/method-readme.sample.md`

**Interfaces:**
- Consumes: `node:fs/promises`.
- Produces:
  - `interface MethodRow { method: string; capital: string; margin: string; risk: string; bestWindow: string; link: string }`
  - `parseMethodBoard(readmeText: string): MethodRow[]` — parses the markdown profit-board table.
  - `loadMethodBoard(repoRoot?: string): Promise<MethodRow[]>` — reads `crafting/method/README.md` (repoRoot derived from `import.meta.url` by default).

- [ ] **Step 1: Create the fixture**

Create `src/fixtures/method-readme.sample.md`:

```markdown
# Method index — profit board

| Method | Capital | Margin (rough) | Risk | Best window | Link |
|--------|---------|----------------|------|-------------|------|
| Greater-essence resist armour | ssf | low–medium † | low | any | [greater-essence-resist-armour.md](greater-essence-resist-armour.md) |
| Desecration Lich modifier | mid | high (selective) † | medium | any | [desecration-lich-modifier.md](desecration-lich-modifier.md) |

> trailing note that is not a table row
```

- [ ] **Step 2: Write the failing test**

Create `src/methods/parse.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseMethodBoard } from "./parse.js";

const fixture = fileURLToPath(new URL("../fixtures/method-readme.sample.md", import.meta.url));

describe("parseMethodBoard", () => {
  it("parses each data row, skipping the header/separator and prose", async () => {
    const rows = parseMethodBoard(await readFile(fixture, "utf8"));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      method: "Greater-essence resist armour",
      capital: "ssf",
      margin: "low–medium",
      risk: "low",
      bestWindow: "any",
      link: "greater-essence-resist-armour.md",
    });
    expect(rows[1].method).toBe("Desecration Lich modifier");
    expect(rows[1].link).toBe("desecration-lich-modifier.md");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run src/methods/parse.test.ts`
Expected: FAIL — cannot find module `./parse.js`.

- [ ] **Step 4: Create `parse.ts`**

```ts
// Parse the crafting method profit-board (crafting/method/README.md) markdown
// table into structured rows. The Methods tab renders these. Read-only over the
// docs directory — never writes there.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface MethodRow {
  method: string;
  capital: string;
  margin: string;
  risk: string;
  bestWindow: string;
  link: string;
}

const LINK = /\[[^\]]*\]\(([^)]+)\)/;

function cells(line: string): string[] {
  return line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((c) => c.trim());
}

export function parseMethodBoard(readmeText: string): MethodRow[] {
  const rows: MethodRow[] = [];
  for (const line of readmeText.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const c = cells(line);
    if (c.length < 6) continue;
    if (/^-+$/.test(c[0].replace(/\s/g, ""))) continue; // separator row
    if (c[0].toLowerCase() === "method") continue; // header
    const linkMatch = LINK.exec(c[5]);
    if (!linkMatch) continue; // only real method rows carry a link
    rows.push({
      method: c[0],
      capital: c[1],
      margin: c[2].replace(/\s*†\s*$/, "").trim(),
      risk: c[3],
      bestWindow: c[4],
      link: linkMatch[1],
    });
  }
  return rows;
}

export async function loadMethodBoard(repoRoot?: string): Promise<MethodRow[]> {
  const root = repoRoot ?? resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
  const text = await readFile(resolve(root, "crafting/method/README.md"), "utf8");
  return parseMethodBoard(text);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/methods/parse.test.ts`
Expected: PASS.

- [ ] **Step 6: Sanity-check against the real README**

Run: `pnpm tsx -e "import('./src/methods/parse.js').then(async m => console.log(await m.loadMethodBoard()))"`
Expected: an array of the 6 real methods with non-empty `link` fields.

- [ ] **Step 7: Commit**

```bash
git add src/methods/parse.ts src/methods/parse.test.ts src/fixtures/method-readme.sample.md
git commit -m "feat: add crafting method-board parser"
```

---

### Task 6: HTTP helpers + response envelope

**Files:**
- Create: `src/server/http.ts`
- Create: `src/server/http.test.ts`

**Interfaces:**
- Consumes: `node:http` (`IncomingMessage`, `ServerResponse`).
- Produces:
  - `type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }`
  - `type Handler = (req: IncomingMessage, body: unknown) => Promise<unknown>`
  - `sendJson(res: ServerResponse, status: number, payload: unknown): void`
  - `readBody(req: IncomingMessage): Promise<unknown>` — parses a JSON request body (empty body → `{}`).
  - `wrap(handler: Handler): (req, res, body) => Promise<void>` — runs a handler, sends `{ok:true,data}` on success or `{ok:false,error}` + status 500 on throw.

- [ ] **Step 1: Write the failing test**

Create `src/server/http.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import type { ServerResponse } from "node:http";
import { wrap } from "./http.js";

function fakeRes() {
  const res = { statusCode: 0, headers: {} as Record<string, string>, body: "" };
  return {
    res: res as unknown as ServerResponse,
    capture: res,
    setHeader: (k: string, v: string) => (res.headers[k] = v),
  };
}

describe("wrap", () => {
  it("wraps a successful handler in {ok:true,data}", async () => {
    const f = fakeRes();
    const res = Object.assign(f.res, { setHeader: f.setHeader, end: (s: string) => (f.capture.body = s) });
    await wrap(async () => ({ value: 42 }))({} as any, res as any, {});
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(f.capture.body)).toEqual({ ok: true, data: { value: 42 } });
  });

  it("wraps a thrown error in {ok:false,error} with status 500", async () => {
    const f = fakeRes();
    const res = Object.assign(f.res, { setHeader: f.setHeader, end: (s: string) => (f.capture.body = s) });
    await wrap(async () => { throw new Error("boom"); })({} as any, res as any, {});
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(f.capture.body)).toEqual({ ok: false, error: "boom" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/server/http.test.ts`
Expected: FAIL — cannot find module `./http.js`.

- [ ] **Step 3: Create `http.ts`**

```ts
// Tiny HTTP helpers for the command-center API: JSON send, body parse, and a
// wrap() that enforces the {ok,data}|{ok,error} envelope and turns thrown
// errors into 500s instead of crashing the server.

import type { IncomingMessage, ServerResponse } from "node:http";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };
export type Handler = (req: IncomingMessage, body: unknown) => Promise<unknown>;

export function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const text = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(text);
}

export async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

export function wrap(handler: Handler) {
  return async (req: IncomingMessage, res: ServerResponse, body: unknown): Promise<void> => {
    try {
      const data = await handler(req, body);
      sendJson(res, 200, { ok: true, data });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: (err as Error).message });
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/server/http.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/http.ts src/server/http.test.ts
git commit -m "feat: add command-center HTTP helpers + envelope"
```

---

### Task 7: API server + routes

**Files:**
- Create: `src/server/server.ts`
- Create: `src/server/routes.ts`

**Interfaces:**
- Consumes: `wrap`, `readBody`, `sendJson` from `./http.js`; `readLatestSnapshot`, `pullEconomy`, `writeSnapshot` from `../economy/pull-core.js`; `searchTrade`, `findStats`, `type QuerySpec` from `../economy/trade-core.js`; `getLeagues` from `../economy/client.js`; `scanSlots` from `../crafting-sim/slots.js`; `estimateCraft`, `type CraftInput` from `../crafting-sim/estimate.js`; `loadModTiers`, `poolFor` from `../crafting-sim/pob-mods.js`; `loadMethodBoard` from `../methods/parse.js`.
- Produces: `createServer(): http.Server` and a default-export start on `process.env.PORT ?? 5179`.

- [ ] **Step 1: Create `routes.ts`**

Each route is a `Handler`. The craft route loads pools then calls `estimateCraft`; weight bands default to the modelled values from `magic-craft.ts`.

```ts
// Route handlers for the command-center API. Each returns plain data; http.wrap
// adds the envelope. Network/disk errors surface as {ok:false,error}.

import type { IncomingMessage } from "node:http";

import { getLeagues } from "../economy/client.js";
import { pullEconomy, readLatestSnapshot, writeSnapshot } from "../economy/pull-core.js";
import { findStats, searchTrade, type QuerySpec } from "../economy/trade-core.js";
import { loadModTiers, poolFor } from "../crafting-sim/pob-mods.js";
import { estimateCraft } from "../crafting-sim/estimate.js";
import { scanSlots, SLOT_DEFS } from "../crafting-sim/slots.js";
import { loadMethodBoard } from "../methods/parse.js";

export const getEconomy = async () => readLatestSnapshot();

export const refreshEconomy = async () => {
  const snapshot = await pullEconomy({ realm: "poe2" });
  await writeSnapshot(snapshot);
  return snapshot;
};

export const getMethods = async () => loadMethodBoard();

export const getSlots = async () => scanSlots(82);

interface CraftBody {
  slot: string;
  ilvl?: number;
  prefixGroup?: string;
  prefixMin?: number;
  suffixStat?: string;
  buyPriceDiv?: number;
  weights?: CraftInputWeights;
}
interface CraftInputWeights {
  pref: { low: number; central: number; high: number };
  suf: { low: number; central: number; high: number };
}
const DEFAULT_WEIGHTS: CraftInputWeights = {
  pref: { low: 0.04, central: 0.07, high: 0.1 },
  suf: { low: 0.004, central: 0.008, high: 0.015 },
};

export const postCraft = async (_req: IncomingMessage, body: unknown) => {
  const b = body as CraftBody;
  const def = SLOT_DEFS.find((s) => s.name === b.slot);
  if (!def) throw new Error(`unknown slot "${b.slot}"`);
  const ilvl = b.ilvl ?? 82;
  const tiers = loadModTiers();
  const prefixes = poolFor(tiers, def.keys, "Prefix", ilvl);
  const suffixes = poolFor(tiers, def.keys, "Suffix", ilvl);
  const snap = await readLatestSnapshot().catch(() => null);
  const divine = snap?.divinePriceExalted ?? 341;
  const orbEx = (name: string, fallback: number) =>
    snap?.currencies.find((c) => c.name === name)?.priceExalted ?? fallback;
  return estimateCraft({
    prefixes,
    suffixes,
    prefixGroup: b.prefixGroup,
    prefixMin: b.prefixMin,
    suffixStat: b.suffixStat,
    weights: b.weights ?? DEFAULT_WEIGHTS,
    orb: {
      transmute: orbEx("Orb of Transmutation", 0.16),
      augment: orbEx("Orb of Augmentation", 0.28),
      divine,
    },
    buyPriceDiv: b.buyPriceDiv ?? 30,
  });
};

export const postTrade = async (_req: IncomingMessage, body: unknown) => {
  const spec = body as QuerySpec & { find?: string };
  const leagues = await getLeagues("poe2");
  const current = leagues.find((l) => l.IsCurrent && !l.Value.startsWith("HC "));
  if (!current) throw new Error("no current league");
  const divine = current.DivinePrice ?? 1;
  if (spec.find) return { league: current.Value, stats: await findStats(spec.find) };
  const result = await searchTrade(spec, current.Value, divine);
  return { league: current.Value, divine, ...result };
};
```

(Note: add `import type { CraftInput } from "../crafting-sim/estimate.js";` only if referenced; here weights are inlined, so `CraftInputWeights` is local. Keep `CraftBody`/`CraftInputWeights` in this file.)

- [ ] **Step 2: Create `server.ts`**

```ts
// node:http server for the command center. Serves the JSON API under /api and,
// in production, the built Vite app from app/dist. Dev uses Vite's proxy, so the
// static fallback is only hit by `pnpm app:serve`.

import { createServer as createHttp, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readBody, sendJson, wrap, type Handler } from "./http.js";
import {
  getEconomy, getMethods, getSlots, postCraft, postTrade, refreshEconomy,
} from "./routes.js";

const PORT = Number(process.env.PORT ?? 5179);
const DIST = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../app/dist");

const ROUTES: Record<string, { method: string; handler: Handler }> = {
  "GET /api/economy": { method: "GET", handler: getEconomy },
  "POST /api/economy/refresh": { method: "POST", handler: refreshEconomy },
  "GET /api/methods": { method: "GET", handler: getMethods },
  "GET /api/slots": { method: "GET", handler: getSlots },
  "POST /api/craft": { method: "POST", handler: postCraft },
  "POST /api/trade": { method: "POST", handler: postTrade },
};

const MIME: Record<string, string> = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml",
};

async function serveStatic(url: string, res: ServerResponse): Promise<void> {
  const rel = url === "/" ? "index.html" : url.replace(/^\//, "");
  try {
    const file = join(DIST, rel);
    const data = await readFile(file);
    res.statusCode = 200;
    res.setHeader("Content-Type", MIME[extname(file)] ?? "application/octet-stream");
    res.end(data);
  } catch {
    try {
      const data = await readFile(join(DIST, "index.html")); // SPA fallback
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html");
      res.end(data);
    } catch {
      sendJson(res, 404, { ok: false, error: "not found (run pnpm app:build)" });
    }
  }
}

export function createServer() {
  return createHttp(async (req: IncomingMessage, res: ServerResponse) => {
    const url = (req.url ?? "/").split("?")[0];
    const key = `${req.method} ${url}`;
    const route = ROUTES[key];
    if (route) {
      const body = req.method === "POST" ? await readBody(req).catch(() => ({})) : {};
      return wrap(route.handler)(req, res, body);
    }
    if (req.method === "GET" && !url.startsWith("/api")) return serveStatic(url, res);
    sendJson(res, 404, { ok: false, error: `no route ${key}` });
  });
}

createServer().listen(PORT, () => console.log(`command-center API on http://localhost:${PORT}`));
```

- [ ] **Step 3: Smoke-test the server boots and serves a route**

Run:
```bash
POB_REPO="$HOME/projects/PathOfBuilding-PoE2" pnpm tsx src/server/server.ts &
SRV=$!; sleep 1
curl -s http://localhost:5179/api/economy | head -c 120; echo
curl -s http://localhost:5179/api/slots | head -c 120; echo
kill $SRV
```
Expected: `/api/economy` returns `{"ok":true,"data":{...}}` (or `{"ok":false,...}` if no snapshot yet); `/api/slots` returns `{"ok":true,"data":[{"slot":"amulet",...`.

- [ ] **Step 4: Commit**

```bash
git add src/server/server.ts src/server/routes.ts
git commit -m "feat: add command-center API server + routes"
```

---

### Task 8: Frontend scaffold, scripts, and dev deps

**Files:**
- Modify: `package.json` (deps + scripts)
- Create: `app/index.html`, `app/vite.config.ts`, `app/tsconfig.json`
- Create: `app/src/main.tsx`, `app/src/App.tsx`, `app/src/api.ts`, `app/src/format.ts`, `app/src/styles.css`

**Interfaces:**
- Produces: `api.ts` typed client (`get<T>(path)`, `post<T>(path, body)` unwrapping the `{ok,data}` envelope, throwing on `{ok:false}`); `format.ts` (`ex(n)`, `div(n, divine)`, `fmt(n)`); `App.tsx` tab shell with four tab components (added in later tasks — stub them now).

- [ ] **Step 1: Add deps**

Run:
```bash
pnpm add -D vite@^5 @vitejs/plugin-react@^4 concurrently@^9
pnpm add react@^18 react-dom@^18
pnpm add -D @types/react@^18 @types/react-dom@^18
```

- [ ] **Step 2: Add scripts to `package.json`**

Add to the `scripts` block:

```json
"api": "tsx watch src/server/server.ts",
"app": "concurrently -n api,web -c blue,green \"pnpm api\" \"vite --config app/vite.config.ts\"",
"app:build": "vite --config app/vite.config.ts build",
"app:serve": "tsx src/server/server.ts"
```

- [ ] **Step 3: Create `app/vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "app",
  plugins: [react()],
  server: {
    port: 5180,
    proxy: { "/api": "http://localhost:5179" },
  },
  build: { outDir: "dist", emptyOutDir: true },
});
```

- [ ] **Step 4: Create `app/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Create `app/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PoE2 Crafting Command Center</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `app/src/api.ts`**

```ts
type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function unwrap<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResult<T>;
  if (!body.ok) throw new Error(body.error);
  return body.data;
}

export async function get<T>(path: string): Promise<T> {
  return unwrap<T>(await fetch(path));
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  return unwrap<T>(
    await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }),
  );
}
```

- [ ] **Step 7: Create `app/src/format.ts`**

```ts
export const fmt = (n: number): string => Math.round(n).toLocaleString();
export const ex = (n: number | null): string => (n == null ? "—" : `${fmt(n)} ex`);
export const div = (n: number | null, divine: number): string =>
  n == null ? "—" : `${(n / divine).toFixed(1)} div`;
```

- [ ] **Step 8: Create `app/src/styles.css`** (minimal, dark, readable)

```css
:root { color-scheme: dark; font-family: ui-monospace, monospace; }
body { margin: 0; background: #14161a; color: #e6e6e6; }
.tabs { display: flex; gap: .25rem; padding: .5rem; background: #1d2026; position: sticky; top: 0; }
.tabs button { background: #2a2f37; color: #cfd3da; border: 0; padding: .5rem 1rem; cursor: pointer; border-radius: 6px; }
.tabs button.active { background: #3a6ea5; color: #fff; }
main { padding: 1rem; max-width: 1100px; }
table { border-collapse: collapse; width: 100%; font-size: 13px; }
th, td { text-align: left; padding: .35rem .6rem; border-bottom: 1px solid #2a2f37; }
th { cursor: pointer; color: #9aa3af; }
.err { background: #5a1d1d; color: #ffd7d7; padding: .6rem; border-radius: 6px; margin: .5rem 0; }
button.act { background: #3a6ea5; color: #fff; border: 0; padding: .45rem .9rem; border-radius: 6px; cursor: pointer; }
.muted { color: #9aa3af; }
.stat { display: inline-block; margin-right: 1.5rem; }
.stat b { display: block; font-size: 1.1rem; }
input, select { background: #20242b; color: #e6e6e6; border: 1px solid #2a2f37; padding: .35rem; border-radius: 4px; }
```

- [ ] **Step 9: Create stub tab components and `App.tsx`**

Create `app/src/tabs/EconomyTab.tsx`, `MethodsTab.tsx`, `CraftSimTab.tsx`, `TradeTab.tsx`, each temporarily:

```tsx
export default function EconomyTab() {
  return <p className="muted">Economy tab — implemented in Task 9.</p>;
}
```
(Adjust the name/text per file: MethodsTab/Task 10, CraftSimTab/Task 11, TradeTab/Task 12.)

Create `app/src/App.tsx`:

```tsx
import { useState } from "react";
import EconomyTab from "./tabs/EconomyTab.js";
import MethodsTab from "./tabs/MethodsTab.js";
import CraftSimTab from "./tabs/CraftSimTab.js";
import TradeTab from "./tabs/TradeTab.js";

const TABS = [
  { id: "economy", label: "Economy", el: <EconomyTab /> },
  { id: "methods", label: "Methods", el: <MethodsTab /> },
  { id: "craft", label: "Craft sim", el: <CraftSimTab /> },
  { id: "trade", label: "Trade", el: <TradeTab /> },
];

export default function App() {
  const [active, setActive] = useState("economy");
  return (
    <>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === active ? "active" : ""} onClick={() => setActive(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <main>{TABS.find((t) => t.id === active)?.el}</main>
    </>
  );
}
```

Create `app/src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 10: Verify it builds and boots**

Run: `pnpm app:build`
Expected: Vite writes `app/dist/` with no type errors.

Then (manual): `POB_REPO="$HOME/projects/PathOfBuilding-PoE2" pnpm app`, open `http://localhost:5180`, confirm four tabs render and switch.

- [ ] **Step 11: Commit**

```bash
git add package.json pnpm-lock.yaml app/
git commit -m "feat: scaffold command-center frontend (Vite + React) with tab shell"
```

---

### Task 9: Economy tab

**Files:**
- Create: `app/src/components/PriceTable.tsx`, `app/src/components/ErrorBanner.tsx`
- Modify: `app/src/tabs/EconomyTab.tsx`

**Interfaces:**
- Consumes: `get`, `post` from `../api.js`; `ex`, `div`, `fmt` from `../format.js`; the snapshot shape `{ league, pulledAt, divinePriceExalted, currencies, uniques }` where each item is `{ name, type, priceExalted, quantity }`.
- Produces: `<PriceTable items={...} divine={...} />` (sortable by price); `<ErrorBanner error={...} />`.

- [ ] **Step 1: Create `ErrorBanner.tsx`**

```tsx
export default function ErrorBanner({ error }: { error: string | null }) {
  if (!error) return null;
  return <div className="err">⚠ {error}</div>;
}
```

- [ ] **Step 2: Create `PriceTable.tsx`**

```tsx
import { useState } from "react";
import { div, ex, fmt } from "../format.js";

export interface PriceItem {
  name: string;
  type: string | null;
  priceExalted: number | null;
  quantity: number | null;
}

export default function PriceTable({ items, divine }: { items: PriceItem[]; divine: number }) {
  const [desc, setDesc] = useState(true);
  const sorted = [...items].sort((a, b) => {
    const av = a.priceExalted ?? 0;
    const bv = b.priceExalted ?? 0;
    return desc ? bv - av : av - bv;
  });
  return (
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th onClick={() => setDesc(!desc)}>Price {desc ? "▼" : "▲"}</th>
          <th>div</th>
          <th>Qty</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((i) => (
          <tr key={i.name + (i.type ?? "")}>
            <td>{i.name}{i.type ? <span className="muted"> ({i.type})</span> : null}</td>
            <td>{ex(i.priceExalted)}</td>
            <td>{div(i.priceExalted, divine)}</td>
            <td className="muted">{i.quantity == null ? "—" : fmt(i.quantity)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 3: Implement `EconomyTab.tsx`**

```tsx
import { useEffect, useState } from "react";
import { get, post } from "../api.js";
import ErrorBanner from "../components/ErrorBanner.js";
import PriceTable, { type PriceItem } from "../components/PriceTable.js";

interface Snapshot {
  league: string;
  pulledAt: string;
  divinePriceExalted: number | null;
  currencies: PriceItem[];
  uniques: PriceItem[];
}

export default function EconomyTab() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => get<Snapshot>("/api/economy").then(setSnap).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const refresh = async () => {
    setBusy(true); setError(null);
    try { setSnap(await post<Snapshot>("/api/economy/refresh", {})); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const divine = snap?.divinePriceExalted ?? 1;
  const ageHours = snap ? (Date.now() - Date.parse(snap.pulledAt)) / 3.6e6 : 0;

  return (
    <div>
      <ErrorBanner error={error} />
      {snap && (
        <p>
          <span className="stat"><b>{snap.league}</b>league</span>
          <span className="stat"><b>{Math.round(divine)} ex</b>1 divine</span>
          <span className="stat"><b>{ageHours.toFixed(1)} h</b>snapshot age {ageHours > 6 ? "⚠ stale" : ""}</span>
          <button className="act" disabled={busy} onClick={refresh}>{busy ? "Refreshing…" : "Refresh prices"}</button>
        </p>
      )}
      {snap && (
        <>
          <h3>Currencies & crafting inputs</h3>
          <PriceTable items={snap.currencies} divine={divine} />
          <h3>Uniques</h3>
          <PriceTable items={snap.uniques} divine={divine} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify build + manual check**

Run: `pnpm app:build`
Expected: builds clean. Manual: `pnpm app`, Economy tab shows price tables, sort toggles, Refresh works.

- [ ] **Step 5: Commit**

```bash
git add app/src/tabs/EconomyTab.tsx app/src/components/PriceTable.tsx app/src/components/ErrorBanner.tsx
git commit -m "feat: economy tab with sortable price tables + refresh"
```

---

### Task 10: Methods tab (board + 100-div allocation)

**Files:**
- Create: `app/src/allocation.ts`
- Modify: `app/src/tabs/MethodsTab.tsx`

**Interfaces:**
- Consumes: `get` from `../api.js`; method rows `{ method, capital, margin, risk, bestWindow, link }`.
- Produces: `STAGES` (the staged ~100-div plan) in `allocation.ts`; the rendered Methods tab.

- [ ] **Step 1: Create `allocation.ts`** (the staged 100-div strategy — durable guidance, capital bands not live prices)

```ts
// Staged ~100-div bankroll allocation. Durable guidance (capital bands + method
// sequencing), mirroring crafting/method/README.md's by-budget playbook scaled
// to a 100-div bankroll. Per-craft cost is recomputed live in the Craft sim tab.
export interface Stage {
  budgetDiv: string;
  lead: string;
  why: string;
}

export const STAGES: Stage[] = [
  {
    budgetDiv: "~10 div",
    lead: "Warm up on the cheap loops",
    why: "Greater-essence hybrid resist/armour + a handful of transmute→augment weapon flips to practice reading mod tiers and live prices before risking real capital.",
  },
  {
    budgetDiv: "~55 div",
    lead: "Desecration / Lich modifier as the main earner",
    why: "Verified top earner on strong meta bases (amulets, rings, weapons). Omens are a few ex; the cost driver is the base + bones. Pick the Lich pool by demand: Kurgal/Ulaman for cold-freeze, Amanamu for hybrid-defence. Inputs cheapen as the league ages.",
  },
  {
    budgetDiv: "~25 div",
    lead: "Jewel crafting for liquid swing upside",
    why: "Crit-combo jewels for safe volume; fractured multi-mod jewels for high-margin/high-variance hits. Small stash, broad demand, sells fast.",
  },
  {
    budgetDiv: "~10 div buffer",
    lead: "Hold for omen/catalyst spikes + restocks",
    why: "Keep dry powder so a price spike on a key input never forces a bad sell. Avoid Breach/Genesis rings (underwater late-league) and pure-ES targets (low demand this patch).",
  },
];
```

- [ ] **Step 2: Implement `MethodsTab.tsx`**

```tsx
import { useEffect, useState } from "react";
import { get } from "../api.js";
import ErrorBanner from "../components/ErrorBanner.js";
import { STAGES } from "../allocation.js";

interface MethodRow {
  method: string; capital: string; margin: string; risk: string; bestWindow: string; link: string;
}

export default function MethodsTab() {
  const [rows, setRows] = useState<MethodRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { get<MethodRow[]>("/api/methods").then(setRows).catch((e) => setError(e.message)); }, []);

  return (
    <div>
      <ErrorBanner error={error} />
      <h3>Staged ~100-div allocation</h3>
      <ol>
        {STAGES.map((s) => (
          <li key={s.lead} style={{ marginBottom: ".5rem" }}>
            <b>{s.budgetDiv} — {s.lead}.</b> <span className="muted">{s.why}</span>
          </li>
        ))}
      </ol>
      <h3>Method profit board</h3>
      <table>
        <thead>
          <tr><th>Method</th><th>Capital</th><th>Margin</th><th>Risk</th><th>Best window</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.method}>
              <td>{r.method}</td><td>{r.capital}</td><td>{r.margin}</td><td>{r.risk}</td><td>{r.bestWindow}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">Board parsed live from crafting/method/README.md. Per-craft cost: use the Craft sim tab.</p>
    </div>
  );
}
```

- [ ] **Step 3: Verify build + manual check**

Run: `pnpm app:build`
Expected: clean build. Manual: Methods tab shows the 4 stages + the 6-row board.

- [ ] **Step 4: Commit**

```bash
git add app/src/allocation.ts app/src/tabs/MethodsTab.tsx
git commit -m "feat: methods tab with staged 100-div allocation + live board"
```

---

### Task 11: Craft sim tab

**Files:**
- Modify: `app/src/tabs/CraftSimTab.tsx`

**Interfaces:**
- Consumes: `get`, `post` from `../api.js`; `/api/slots` (array of `SlotSummary`); `/api/craft` (a `CraftEstimate`).
- Produces: the interactive craft estimator UI.

- [ ] **Step 1: Implement `CraftSimTab.tsx`**

```tsx
import { useEffect, useMemo, useState } from "react";
import { get, post } from "../api.js";
import ErrorBanner from "../components/ErrorBanner.js";

interface ChaseMod { type: string; affix: string; stat: string; level: number; group: string }
interface SlotSummary {
  slot: string; prefixGroups: number; suffixGroups: number; chase: ChaseMod[];
}
interface TargetTier { affix: string; stat: string; level: number; fracAboveMin: number }
interface Scenario {
  label: string; pPref: number; pSuf: number; p: number; attempts: number;
  currencyOnlyDiv: number; breakevenBaseEx: number;
  withBase: { baseEx: number; totalDiv: number; cheaperThanBuy: boolean }[];
}
interface CraftEstimate {
  prefixGroups: number; suffixGroups: number;
  targetPrefixTiers: TargetTier[]; targetSuffix: { affix: string; stat: string; level: number } | null;
  scenarios: Scenario[];
}

const pct = (x: number) => (x * 100).toPrecision(3) + "%";

export default function CraftSimTab() {
  const [slots, setSlots] = useState<SlotSummary[]>([]);
  const [slot, setSlot] = useState("bow");
  const [suffixStat, setSuffixStat] = useState("");
  const [prefixGroup, setPrefixGroup] = useState("");
  const [prefixMin, setPrefixMin] = useState(0);
  const [buyPriceDiv, setBuyPriceDiv] = useState(30);
  const [est, setEst] = useState<CraftEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { get<SlotSummary[]>("/api/slots").then(setSlots).catch((e) => setError(e.message)); }, []);
  const current = useMemo(() => slots.find((s) => s.slot === slot), [slots, slot]);

  const run = async () => {
    setError(null);
    try {
      setEst(await post<CraftEstimate>("/api/craft", {
        slot, ilvl: 82,
        prefixGroup: prefixGroup || undefined,
        prefixMin: prefixMin || undefined,
        suffixStat: suffixStat || undefined,
        buyPriceDiv,
      }));
    } catch (e) { setError((e as Error).message); }
  };

  return (
    <div>
      <ErrorBanner error={error} />
      <p>
        <label className="stat">Slot{" "}
          <select value={slot} onChange={(e) => { setSlot(e.target.value); setSuffixStat(""); setPrefixGroup(""); }}>
            {slots.map((s) => <option key={s.slot} value={s.slot}>{s.slot}</option>)}
          </select>
        </label>
        <label className="stat">Target suffix{" "}
          <select value={suffixStat} onChange={(e) => setSuffixStat(e.target.value)}>
            <option value="">(none)</option>
            {current?.chase.filter((c) => c.type === "Suffix").map((c) => (
              <option key={c.group} value={c.stat}>{c.stat} (ilvl {c.level})</option>
            ))}
          </select>
        </label>
        <label className="stat">Prefix group{" "}
          <input value={prefixGroup} placeholder="e.g. LocalPhysicalDamagePercent"
            onChange={(e) => setPrefixGroup(e.target.value)} />
        </label>
        <label className="stat">Prefix min{" "}
          <input type="number" value={prefixMin} style={{ width: "4rem" }}
            onChange={(e) => setPrefixMin(Number(e.target.value))} />
        </label>
        <label className="stat">Buy price (div){" "}
          <input type="number" value={buyPriceDiv} style={{ width: "4rem" }}
            onChange={(e) => setBuyPriceDiv(Number(e.target.value))} />
        </label>
        <button className="act" onClick={run}>Estimate</button>
      </p>

      {current && (
        <p className="muted">
          Pool: {current.prefixGroups} prefix groups · {current.suffixGroups} suffix groups (variance driver).
        </p>
      )}

      {est && (
        <>
          {est.targetPrefixTiers.length > 0 && (
            <table>
              <thead><tr><th>Prefix tier</th><th>Range</th><th>ilvl</th><th>clears min</th></tr></thead>
              <tbody>
                {est.targetPrefixTiers.map((t) => (
                  <tr key={t.affix + t.level}>
                    <td>{t.affix}</td><td>{t.stat}</td><td>{t.level}</td>
                    <td>{t.fracAboveMin === 0 ? "✗" : t.fracAboveMin === 1 ? "✓" : `~${pct(t.fracAboveMin)}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="muted">Weight bands are MODELLED (PoB ships no real spawn weights) — see low/central/high.</p>
          <table>
            <thead>
              <tr><th>Scenario</th><th>P/attempt</th><th>Attempts</th><th>Currency-only</th><th>Break-even base</th></tr>
            </thead>
            <tbody>
              {est.scenarios.map((s) => (
                <tr key={s.label}>
                  <td>{s.label}</td>
                  <td>{pct(s.p)}</td>
                  <td>{Number.isFinite(s.attempts) ? Math.round(s.attempts).toLocaleString() : "∞"}</td>
                  <td>{s.currencyOnlyDiv.toFixed(1)} div</td>
                  <td>{s.breakevenBaseEx.toFixed(1)} ex</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm app:build`
Expected: clean build. Manual (`pnpm app`, with `POB_REPO` set): pick slot `bow`, target suffix `+4 to Level of all Projectile Skills`, prefix group `LocalPhysicalDamagePercent`, min `66`, Estimate → tier table + three scenarios render with finite attempts.

- [ ] **Step 3: Commit**

```bash
git add app/src/tabs/CraftSimTab.tsx
git commit -m "feat: craft sim tab with slot/target picker + EV scenarios"
```

---

### Task 12: Trade tab

**Files:**
- Modify: `app/src/tabs/TradeTab.tsx`

**Interfaces:**
- Consumes: `post` from `../api.js`; `/api/trade` returns either `{ league, divine, label, total, listings }` or `{ league, stats }` for a `find`.
- Produces: the mod-filtered trade floor UI.

- [ ] **Step 1: Implement `TradeTab.tsx`**

```tsx
import { useState } from "react";
import { post } from "../api.js";
import ErrorBanner from "../components/ErrorBanner.js";

interface Listing { priceAmount: number | null; priceCurrency: string | null; priceExalted: number | null; typeLine: string; ilvl?: number; mods: string[] }
interface TradeResp { league: string; divine: number; label: string; total: number; listings: Listing[] }
interface StatHit { label: string; id: string; text: string }

export default function TradeTab() {
  const [category, setCategory] = useState("ring");
  const [statLine, setStatLine] = useState(""); // "id:min,id:min"
  const [find, setFind] = useState("");
  const [resp, setResp] = useState<TradeResp | null>(null);
  const [stats, setStats] = useState<StatHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const doFind = async () => {
    setBusy(true); setError(null);
    try { setStats((await post<{ stats: StatHit[] }>("/api/trade", { find })).stats); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  const doSearch = async () => {
    setBusy(true); setError(null);
    const statsArr = statLine.split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
      const [id, min] = s.split(":");
      return { id, min: min ? Number(min) : undefined };
    });
    try { setResp(await post<TradeResp>("/api/trade", { category, rarity: "nonunique", stats: statsArr, limit: 8 })); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div>
      <ErrorBanner error={error} />
      <p>
        <label className="stat">Find stat id{" "}
          <input value={find} placeholder="e.g. spirit" onChange={(e) => setFind(e.target.value)} />
        </label>
        <button className="act" disabled={busy} onClick={doFind}>Find</button>
      </p>
      {stats.length > 0 && (
        <table>
          <thead><tr><th>label</th><th>id</th><th>text</th></tr></thead>
          <tbody>{stats.slice(0, 20).map((s) => <tr key={s.id}><td>{s.label}</td><td>{s.id}</td><td>{s.text}</td></tr>)}</tbody>
        </table>
      )}
      <p>
        <label className="stat">Category{" "}
          <input value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        <label className="stat">Stats (id:min,id:min){" "}
          <input value={statLine} style={{ width: "22rem" }} onChange={(e) => setStatLine(e.target.value)} />
        </label>
        <button className="act" disabled={busy} onClick={doSearch}>{busy ? "Searching…" : "Search floor"}</button>
      </p>
      {resp && (
        <>
          <p className="muted">{resp.label} — {resp.total} listings (cheapest 8). Asking floor ≈ order of magnitude.</p>
          {resp.listings.map((l, i) => (
            <div key={i} style={{ marginBottom: ".4rem" }}>
              <b>{l.priceAmount} {l.priceCurrency}</b> <span className="muted">(~{l.priceExalted} ex)</span> · {l.typeLine}
              <ul style={{ margin: ".2rem 0" }}>{l.mods.map((m, j) => <li key={j} className="muted">{m}</li>)}</ul>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm app:build`
Expected: clean build. Manual: Find `spirit` lists stat ids; a category search returns cheapest listings (network permitting).

- [ ] **Step 3: Commit**

```bash
git add app/src/tabs/TradeTab.tsx
git commit -m "feat: trade tab with stat-id finder + mod-filtered floor search"
```

---

### Task 13: Full-suite verification + docs

**Files:**
- Modify: `README` or `docs/` note (optional one-liner on `pnpm app`)
- Modify: `CLAUDE.md` routing table (add the app row)

- [ ] **Step 1: Run the whole test suite**

Run: `pnpm test`
Expected: all vitest tests pass (pull-core, trade-core, estimate, slots, methods/parse, http).

- [ ] **Step 2: Typecheck the backend**

Run: `pnpm build`
Expected: `tsc` completes with no errors (the new `src/server`, `src/methods`, `src/crafting-sim` files compile).

- [ ] **Step 3: Build the frontend**

Run: `pnpm app:build`
Expected: `app/dist` produced, no type errors.

- [ ] **Step 4: End-to-end smoke via the production server**

Run:
```bash
POB_REPO="$HOME/projects/PathOfBuilding-PoE2" pnpm app:serve &
SRV=$!; sleep 1
curl -s http://localhost:5179/api/methods | head -c 80; echo
curl -s http://localhost:5179/ | head -c 40; echo
kill $SRV
```
Expected: `/api/methods` returns `{"ok":true,...}`; `/` returns the built `index.html`.

- [ ] **Step 5: Add the routing-table row to `CLAUDE.md`**

Add under the Routing Table:

```markdown
| Run the crafting command center | `app/` + `src/server/` | `src/server/server.ts`, `app/src/App.tsx` | `pob/` |
```

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: route the crafting command center in CLAUDE.md"
```

---

## Self-Review

**Spec coverage:**
- Four tabs (Economy/Methods/Craft sim/Trade) → Tasks 9–12. ✓
- Thin `node:http` API reusing modules → Tasks 6–7. ✓
- Three behavior-preserving extractions (`pullEconomy`, `searchTrade`, `estimateCraft`) → Tasks 1–3. ✓
- API surface (`GET/POST` routes, envelope) → Tasks 6–7. ✓
- `/api/slots` from `poolFor` → Task 4 + Task 7. ✓
- Methods tab reads README + the staged 100-div allocation → Tasks 5, 10. ✓
- Craft sim shows tier table, pool-group count, odds, EV, break-even, modelled-weight labelling → Tasks 4, 11. ✓
- Error handling (envelope, POB_REPO-unset surfaced) → Tasks 6, 7 (routes throw → `{ok:false}`; tabs render ErrorBanner). ✓
- POB_REPO-unset clarity: `loadModTiers()` throws a read error; surfaced via envelope + ErrorBanner. Acceptable; message could be friendlier but spec only requires it not crash. ✓
- Testing on pure functions (estimateCraft, trade buildBody, method parser) → Tasks 3, 2, 5; plus pull-core, slots, http. ✓
- Run story (`pnpm app`, `app:build`, `app:serve`) → Task 8. ✓
- Dev deps list matches spec → Task 8. ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code. Frontend tabs are stubbed in Task 8 then fully implemented in Tasks 9–12 (the stub is explicitly temporary, not a placeholder-in-final-code). ✓

**Type consistency:** `EconomySnapshot`/`NormalizedItem` reused from `types.ts`. `QuerySpec`/`TradeListing`/`TradeResult` defined in Task 2 and consumed in Task 7/12. `CraftInput`/`CraftEstimate`/`CraftScenario`/`TargetTier` defined in Task 3, consumed in Task 7 (route) and Task 11 (frontend mirrors the shape). `SlotSummary`/`ChaseMod`/`SLOT_DEFS` defined in Task 4, consumed in Tasks 7 and 11. `ApiResult`/`Handler` defined in Task 6, used in Tasks 7. Frontend `api.ts` envelope mirrors server envelope. Method `MethodRow` fields identical in Tasks 5 and 10. ✓

One note carried into execution: in Task 7 `routes.ts`, the unused `CraftInput` import is intentionally omitted (weights inlined); do not add it or `tsc`/lint will flag an unused import.

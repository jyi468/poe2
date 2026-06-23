// CLI for the official PoE2 trade2 API: run mod-filtered searches and print the
// cheapest real listings (price + mods) so we can sanity-check craft profitability.
//
//   pnpm trade --find "critical damage bonus"        # discover stat ids
//   pnpm trade --category jewel --rarity nonunique \
//     --stat explicit.stat_3556824919:8 --stat explicit.stat_587431675:8 --limit 8
//   pnpm trade --batch path/to/queries.json          # run many queries, one report
//
// A query is the cheapest-first floor for items matching ALL given stats. Asking
// floors run above real sold prices — treat as order-of-magnitude.

import { readFile } from "node:fs/promises";

import { getLeagues } from "./client.js";

const BASE = "https://www.pathofexile.com/api/trade2";
const HEADERS = {
  "User-Agent": "poe2-assistant/trade (Contact jyi468@gmail.com)",
  "Content-Type": "application/json",
};

interface StatFilter {
  id: string;
  min?: number;
  max?: number;
}
interface QuerySpec {
  label?: string;
  category?: string;
  rarity?: string; // e.g. "nonunique"
  name?: string;
  type?: string;
  stats?: StatFilter[];
  sort?: "asc" | "desc";
  limit?: number;
  corrupted?: boolean;
  qualityMin?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function postJson<T>(url: string, body: unknown, attempt = 0): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: HEADERS, body: JSON.stringify(body) });
  if (res.status === 429 && attempt < 4) {
    const wait = Number(res.headers.get("Retry-After") ?? 8) * 1000;
    console.warn(`  (rate limited, waiting ${wait / 1000}s)`);
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

/** Build the trade2 query body from a spec. */
function buildBody(spec: QuerySpec) {
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

async function findStats(text: string): Promise<void> {
  const data = await getJson<{ result: { label: string; entries: { id: string; text: string }[] }[] }>(
    `${BASE}/data/stats`,
  );
  const needle = text.toLowerCase();
  for (const grp of data.result) {
    for (const e of grp.entries) {
      if (e.text.toLowerCase().includes(needle)) {
        console.log(`${grp.label.padEnd(10)} ${e.id.padEnd(28)} ${e.text}`);
      }
    }
  }
}

// The fetch endpoint returns mods either as plain strings or as objects with a
// `description`. Normalize both to a readable line.
type ModEntry = string | { description?: string; mods?: { tier?: string }[] };
interface Listing {
  listing: { price: { amount: number; currency: string } | null };
  item: { typeLine?: string; explicitMods?: ModEntry[]; ilvl?: number };
}

function modText(m: ModEntry): string {
  if (typeof m === "string") return m;
  const tier = m.mods?.[0]?.tier ? ` [${m.mods[0].tier}]` : "";
  return `${m.description ?? JSON.stringify(m)}${tier}`;
}

async function runQuery(spec: QuerySpec, league: string, divine: number): Promise<void> {
  const label = spec.label ?? spec.name ?? spec.category ?? "query";
  const limit = spec.limit ?? 6;
  const search = await postJson<{ id: string; total: number; result: string[]; error?: unknown }>(
    `${BASE}/search/poe2/${encodeURIComponent(league)}`,
    buildBody(spec),
  );
  const ex = (amt: number, cur: string) => (cur === "divine" ? amt * divine : amt);
  console.log(`\n### ${label} — ${search.total} listings`);
  if (!search.result?.length) {
    console.log("  (no matches)");
    return;
  }
  const ids = search.result.slice(0, limit).join(",");
  const fetched = await getJson<{ result: (Listing | null)[] }>(
    `${BASE}/fetch/${ids}?query=${search.id}&realm=poe2`,
  );
  for (const r of fetched.result) {
    if (!r?.listing?.price) continue;
    const { amount, currency } = r.listing.price;
    const exq = Math.round(ex(amount, currency));
    const mods = r.item.explicitMods ?? [];
    console.log(`  ${amount} ${currency} (~${exq} ex / ${(exq / divine).toFixed(2)} div) | ${r.item.typeLine} [${mods.length} mods]`);
    for (const m of mods) console.log(`      ${modText(m)}`);
  }
  await sleep(1500); // be polite to the trade API between queries
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
  if (flags.find) return findStats(flags.find);

  const leagues = await getLeagues("poe2");
  const current =
    leagues.find((l) => l.Value === flags.league) ??
    leagues.find((l) => l.IsCurrent && !l.Value.startsWith("HC "));
  if (!current) throw new Error("No current league; pass --league.");
  const divine = current.DivinePrice ?? 1;
  console.log(`League: ${current.Value} (1 div ≈ ${Math.round(divine)} ex)`);

  if (flags.batch) {
    const specs = JSON.parse(await readFile(flags.batch, "utf8")) as QuerySpec[];
    for (const spec of specs) await runQuery(spec, current.Value, divine);
  } else {
    await runQuery(flags, current.Value, divine);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

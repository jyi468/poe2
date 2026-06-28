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
export interface Range {
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
  /** Equipment (weapon-property) filters — the computed values, not mods. */
  dps?: Range; // total damage per second
  pdps?: Range; // physical DPS
  crit?: Range; // critical hit chance %
  aps?: Range; // attacks per second
  sort?: "asc" | "desc";
  limit?: number;
  corrupted?: boolean;
  qualityMin?: number;
  /** Listing availability. "securable" = instant-buyout, actually purchasable (merchant/premium
   * tabs with a buyout); the real floor. "online" includes price-fixer ghosts. Default securable. */
  status?: "securable" | "online" | "any";
  /** Collapse multiple listings from the same account into one (default true) — avoids one
   * seller's spam dominating the floor. */
  collapse?: boolean;
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

// --- Global throttle -------------------------------------------------------
// Every trade2 request goes through one serial queue: at most one request is in
// flight, and the next one is held until `nextAllowedAt`. Spacing is derived
// from the API's own X-Rate-Limit-Ip policy (hits:period buckets) so we self-pace
// to the server's limit instead of guessing — and a 429 parks the queue for the
// full Retry-After. This is what stops the "too many attempts" bursts.

let gate: Promise<unknown> = Promise.resolve();
let nextAllowedAt = 0; // epoch ms; earliest the next request may fire

/** Steady-state ms between requests implied by a "hits:period:restriction,..." policy. */
function spacingFromPolicy(policy: string | null): number {
  if (!policy) return 1500;
  let ms = 0;
  for (const bucket of policy.split(",")) {
    const [hits, period] = bucket.split(":").map(Number);
    if (hits > 0 && period > 0) ms = Math.max(ms, Math.ceil((period / hits) * 1000));
  }
  return ms || 1500;
}

async function rateLimitedFetch(url: string, init: RequestInit, attempt = 0): Promise<Response> {
  const run = gate.then(async () => {
    const wait = nextAllowedAt - Date.now();
    if (wait > 0) await sleep(wait);
    const res = await fetch(url, init);
    // Pace the *next* request off this response's IP policy bucket.
    nextAllowedAt = Date.now() + spacingFromPolicy(res.headers.get("x-rate-limit-ip"));
    return res;
  });
  gate = run.catch(() => {}); // keep the queue alive even if a request throws
  const res = await run;
  if (res.status === 429 && attempt < 4) {
    const retry = Number(res.headers.get("retry-after") ?? 8);
    nextAllowedAt = Date.now() + retry * 1000;
    return rateLimitedFetch(url, init, attempt + 1);
  }
  return res;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await rateLimitedFetch(url, { method: "POST", headers: HEADERS, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await rateLimitedFetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export function buildBody(spec: QuerySpec): unknown {
  const query: Record<string, unknown> = { status: { option: spec.status ?? "securable" } };
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
  const range = (r: Range) => {
    const v: Record<string, number> = {};
    if (r.min != null) v.min = r.min;
    if (r.max != null) v.max = r.max;
    return v;
  };
  const equipmentFilters: Record<string, unknown> = {};
  if (spec.dps) equipmentFilters.damage = range(spec.dps);
  if (spec.pdps) equipmentFilters.pdps = range(spec.pdps);
  if (spec.crit) equipmentFilters.crit = range(spec.crit);
  if (spec.aps) equipmentFilters.aps = range(spec.aps);
  const filters: Record<string, unknown> = {
    trade_filters: { filters: { collapse: { option: String(spec.collapse ?? true) } } },
  };
  if (Object.keys(typeFilters).length) filters.type_filters = { filters: typeFilters };
  if (Object.keys(miscFilters).length) filters.misc_filters = { filters: miscFilters };
  if (Object.keys(equipmentFilters).length) filters.equipment_filters = { filters: equipmentFilters };
  query.filters = filters;
  return { query, sort: { price: spec.sort ?? "asc" } };
}

type ModEntry = string | { description?: string; mods?: { tier?: string }[] };
interface RawItem {
  typeLine?: string;
  ilvl?: number;
  explicitMods?: ModEntry[];
  fracturedMods?: ModEntry[];
  desecratedMods?: ModEntry[];
  craftedMods?: ModEntry[];
}
interface RawListing {
  listing: { price: { amount: number; currency: string } | null };
  item: RawItem;
}

function modText(m: ModEntry, tag = ""): string {
  if (typeof m === "string") return m;
  const tier = m.mods?.[0]?.tier ? ` [${m.mods[0].tier}]` : "";
  return `${m.description ?? JSON.stringify(m)}${tier}${tag}`;
}

/** All mod groups in one list, tagging the special (non-explicit) sources that carry the value. */
function allMods(item: RawItem): string[] {
  return [
    ...(item.explicitMods ?? []).map((m) => modText(m)),
    ...(item.fracturedMods ?? []).map((m) => modText(m, " {fractured}")),
    ...(item.desecratedMods ?? []).map((m) => modText(m, " {desecrated}")),
    ...(item.craftedMods ?? []).map((m) => modText(m, " {crafted}")),
  ];
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
    if (!r || !r.listing?.price) continue;
    const price = r.listing?.price ?? null;
    const exalted = price ? (price.currency === "divine" ? price.amount * divine : price.amount) : null;
    listings.push({
      priceAmount: price?.amount ?? null,
      priceCurrency: price?.currency ?? null,
      priceExalted: exalted == null ? null : Math.round(exalted),
      typeLine: r.item.typeLine ?? "?",
      ilvl: r.item.ilvl,
      mods: allMods(r.item),
    });
  }
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

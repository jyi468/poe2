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

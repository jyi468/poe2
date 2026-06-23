// Pure transforms over raw poe2scout payloads. No IO here so these are unit-testable.

import type {
  NormalizedItem,
  PriceLog,
  RawItem,
  RawLeague,
} from "./types.js";

/** Most recent price log by timestamp, or null if there are none. */
export function latestLog(logs: PriceLog[] | null | undefined): PriceLog | null {
  const valid = (logs ?? []).filter(
    (log): log is PriceLog => log != null && typeof log.Time === "string",
  );
  if (valid.length === 0) return null;
  return valid.reduce((newest, log) => (log.Time > newest.Time ? log : newest));
}

/**
 * Pick the current league for a realm, preferring softcore (entries whose Value
 * does not start with "HC "). Returns null if none are marked current.
 */
export function pickCurrentLeague(
  leagues: RawLeague[],
  { hardcore = false }: { hardcore?: boolean } = {},
): RawLeague | null {
  const current = leagues.filter((l) => l.IsCurrent);
  const isHc = (l: RawLeague) => l.Value.startsWith("HC ");
  const match = current.find((l) => (hardcore ? isHc(l) : !isHc(l)));
  return match ?? current[0] ?? null;
}

/** Normalize a raw currency/unique item into a price-bearing record. */
export function normalizeItem(raw: RawItem, fallbackCategory: string): NormalizedItem {
  const latest = latestLog(raw.PriceLogs);
  const priceExalted =
    typeof raw.CurrentPrice === "number" ? raw.CurrentPrice : latest?.Price ?? null;
  const quantity =
    typeof raw.CurrentQuantity === "number"
      ? raw.CurrentQuantity
      : latest?.Quantity ?? null;
  const name = raw.Name ?? raw.Text ?? raw.ApiId ?? "unknown";
  return {
    key: raw.ApiId ?? name,
    name,
    type: raw.Type ?? null,
    category: raw.CategoryApiId ?? fallbackCategory,
    priceExalted,
    quantity,
    time: latest?.Time ?? null,
  };
}

/** Items sorted by Exalted price descending; unpriced items fall to the end. */
export function byPriceDesc(items: NormalizedItem[]): NormalizedItem[] {
  return [...items].sort(
    (a, b) => (b.priceExalted ?? -Infinity) - (a.priceExalted ?? -Infinity),
  );
}

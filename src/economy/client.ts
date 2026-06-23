// Thin HTTP client for the (undocumented but stable) poe2scout economy API.
// Spec: https://poe2scout.com/api/openapi.json

import type { ByCategoryPage, RawItem, RawLeague } from "./types.js";

const BASE = "https://poe2scout.com/api";
const HEADERS = { "User-Agent": "poe2-assistant/economy-pull (github poe2-assistant)" };

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`poe2scout ${path} -> ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

const enc = (s: string) => encodeURIComponent(s);

/** All leagues for a realm (e.g. "poe2"). */
export function getLeagues(realm: string): Promise<RawLeague[]> {
  return fetchJson<RawLeague[]>(`/${enc(realm)}/Leagues`);
}

/**
 * Pull every page of a ByCategory endpoint and return the flattened Items.
 * `kind` is "Currencies" or "Uniques". DataPoints=1 keeps PriceLogs light.
 */
export async function getByCategory(
  realm: string,
  league: string,
  kind: "Currencies" | "Uniques",
  category: string,
  perPage = 250, // poe2scout caps PerPage at 250
): Promise<RawItem[]> {
  // DataPoints only accepts 7 or 8 (it is PriceLog history length, not a row cap);
  // we omit it and use the default, then keep just the latest log when normalizing.
  const base =
    `/${enc(realm)}/Leagues/${enc(league)}/${kind}/ByCategory` +
    `?Category=${enc(category)}&PerPage=${perPage}`;
  const first = await fetchJson<ByCategoryPage>(`${base}&Page=1`);
  const items = [...first.Items];
  for (let page = 2; page <= first.Pages; page++) {
    const next = await fetchJson<ByCategoryPage>(`${base}&Page=${page}`);
    items.push(...next.Items);
  }
  return items;
}

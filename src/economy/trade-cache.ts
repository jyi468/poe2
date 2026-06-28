// Disk-backed cache for official PoE2 trade2 results. The trade API is harshly
// rate-limited, so we save every fetched value locally and serve it back without
// a network call (cache-first). Callers force a live refetch explicitly; this
// module never decides freshness by age — a saved value is reused indefinitely
// until something overwrites it.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface CacheEntry<T> {
  fetchedAt: string; // ISO timestamp of the live fetch that produced `value`
  value: T;
}

type Store = Record<string, CacheEntry<unknown>>;

function cacheFile(): string {
  const here = fileURLToPath(new URL(".", import.meta.url));
  return resolve(here, "../../data/economy/trade-cache.json");
}

/** Stable cache key for an arbitrary query descriptor (order-independent). */
export function cacheKey(namespace: string, descriptor: unknown): string {
  const json = JSON.stringify(descriptor);
  const hash = createHash("sha1").update(json).digest("hex").slice(0, 16);
  return `${namespace}:${hash}`;
}

let loaded: Store | null = null;
async function load(): Promise<Store> {
  if (loaded) return loaded;
  try {
    loaded = JSON.parse(await readFile(cacheFile(), "utf8")) as Store;
  } catch {
    loaded = {};
  }
  return loaded;
}

// Serialize read-modify-write so concurrent setCached calls never clobber.
let writeChain: Promise<unknown> = Promise.resolve();

export async function getCached<T>(key: string): Promise<CacheEntry<T> | null> {
  const store = await load();
  return (store[key] as CacheEntry<T> | undefined) ?? null;
}

export async function setCached<T>(key: string, value: T, fetchedAt: string): Promise<CacheEntry<T>> {
  const entry: CacheEntry<T> = { fetchedAt, value };
  writeChain = writeChain.then(async () => {
    const store = await load();
    const next: Store = { ...store, [key]: entry };
    loaded = next;
    const file = cacheFile();
    await mkdir(resolve(file, ".."), { recursive: true });
    await writeFile(file, JSON.stringify(next, null, 2));
  });
  await writeChain.catch(() => {});
  return entry;
}

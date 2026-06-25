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

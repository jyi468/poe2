// CLI: pull a live economy snapshot from poe2scout and write JSON + a markdown
// digest under data/economy/. Run: pnpm economy [-- --hardcore --league "Name"]
//
// Categories default to the crafting-relevant set plus all unique slots. Override
// with --currency-cats a,b and --unique-cats a,b.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getByCategory, getLeagues } from "./client.js";
import { formatDigest } from "./digest.js";
import { normalizeItem, pickCurrentLeague } from "./normalize.js";
import type { EconomySnapshot, NormalizedItem, RawItem } from "./types.js";

const DEFAULT_CURRENCY_CATS = ["currency", "essences", "ritual", "breach", "fragments"];
const DEFAULT_UNIQUE_CATS = ["accessory", "armour", "weapon", "jewel", "flask"];

function parseArgs(argv: string[]): {
  realm: string;
  league?: string;
  hardcore: boolean;
  currencyCats: string[];
  uniqueCats: string[];
} {
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

async function collect(
  realm: string,
  league: string,
  kind: "Currencies" | "Uniques",
  cats: string[],
): Promise<NormalizedItem[]> {
  const out: NormalizedItem[] = [];
  const seen = new Set<string>();
  for (const cat of cats) {
    let raw: RawItem[];
    try {
      raw = await getByCategory(realm, league, kind, cat);
    } catch (err) {
      console.warn(`  ! skipped ${kind}/${cat}: ${(err as Error).message}`);
      continue;
    }
    for (const item of raw) {
      const norm = normalizeItem(item, cat);
      const id = `${norm.category}:${norm.key}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(norm);
    }
    console.log(`  ${kind}/${cat}: ${raw.length} items`);
  }
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Pulling ${args.realm} economy from poe2scout…`);

  const leagues = await getLeagues(args.realm);
  const chosen = args.league
    ? leagues.find((l) => l.Value === args.league)
    : pickCurrentLeague(leagues, { hardcore: args.hardcore });
  if (!chosen) throw new Error("Could not resolve a current league; pass --league.");
  console.log(`League: ${chosen.Value} (1 div ≈ ${Math.round(chosen.DivinePrice ?? 0)} ex)`);

  const currencies = await collect(args.realm, chosen.Value, "Currencies", args.currencyCats);
  const uniques = await collect(args.realm, chosen.Value, "Uniques", args.uniqueCats);

  const snapshot: EconomySnapshot = {
    realm: args.realm,
    league: chosen.Value,
    pulledAt: new Date().toISOString(),
    divinePriceExalted: chosen.DivinePrice,
    currencies,
    uniques,
  };

  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = resolve(here, "../../data/economy");
  await mkdir(outDir, { recursive: true });
  const stamp = snapshot.pulledAt.slice(0, 10);
  const digest = formatDigest(snapshot);

  await writeFile(resolve(outDir, "latest.json"), JSON.stringify(snapshot, null, 2));
  await writeFile(resolve(outDir, "latest.md"), digest);
  await writeFile(resolve(outDir, `snapshot-${stamp}.json`), JSON.stringify(snapshot, null, 2));

  console.log(`\nWrote ${currencies.length} currencies + ${uniques.length} uniques to ${outDir}`);
  console.log(`\n${digest}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

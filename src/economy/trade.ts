// CLI for the official PoE2 trade2 API. Logic lives in trade-core.ts; this file
// parses flags and prints. Usage:
//   pnpm trade --find "critical damage bonus"
//   pnpm trade --category jewel --rarity nonunique --stat explicit.stat_x:8 --limit 8
//   pnpm trade --batch path/to/queries.json
// Listings default to status=securable (instant-buyout, actually purchasable) + collapsed
// per-account — the REAL floor. Add --online (or --status any) to include price-fixer ghosts,
// and --no-collapse to show every per-seller listing. Mods show {fractured}/{desecrated}/{crafted} tags.

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
    else if (a === "--status") out.status = next() as "securable" | "online" | "any";
    else if (a === "--online") out.status = "online"; // shortcut: include unbuyable listings
    else if (a === "--no-collapse") out.collapse = false;
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

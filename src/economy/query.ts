// CLI: print a FULL live price table for one poe2scout category, without writing
// a snapshot. This is the "just look up prices" companion to `pnpm economy`
// (which only keeps the top ~20 per category in its digest). Reuses the same
// poe2scout client, so no ad-hoc curl is needed.
//
//   pnpm prices                       # all essences, priced desc
//   pnpm prices currency --grep omen  # currencies whose name contains "omen"
//   pnpm prices essences --top 15     # 15 most expensive essences
//   pnpm prices armour --kind Uniques # unique armour pieces
//   pnpm prices --league "Standard"   # override league resolution
//
// Categories (Currencies): currency · essences · ritual · breach · fragments
// Categories (Uniques):    accessory · armour · weapon · jewel · flask

import { getByCategory, getLeagues } from "./client.js";
import { byPriceDesc, normalizeItem, pickCurrentLeague } from "./normalize.js";
import type { NormalizedItem } from "./types.js";

interface QueryArgs {
  category: string;
  kind: "Currencies" | "Uniques";
  realm: string;
  league?: string;
  hardcore: boolean;
  grep?: string;
  top?: number;
}

function parseArgs(argv: string[]): QueryArgs {
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  // First non-flag token is the category (defaults to essences).
  const positional = argv.find((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
  const kind = (get("--kind") ?? "Currencies") as "Currencies" | "Uniques";
  const topRaw = get("--top");
  return {
    category: positional ?? "essences",
    kind: kind === "Uniques" ? "Uniques" : "Currencies",
    realm: get("--realm") ?? "poe2",
    league: get("--league"),
    hardcore: argv.includes("--hardcore"),
    grep: get("--grep")?.toLowerCase(),
    top: topRaw ? Math.max(1, Number(topRaw)) : undefined,
  };
}

/** Pure: filter by name substring, sort by price desc, cap to `top`. */
export function selectRows(
  items: NormalizedItem[],
  opts: { grep?: string; top?: number },
): NormalizedItem[] {
  const filtered = opts.grep
    ? items.filter((i) => i.name.toLowerCase().includes(opts.grep!))
    : items;
  const sorted = byPriceDesc(filtered);
  return opts.top ? sorted.slice(0, opts.top) : sorted;
}

function formatTable(rows: NormalizedItem[], divPrice: number | null): string {
  const div = (ex: number | null) =>
    ex != null && divPrice ? (ex / divPrice).toFixed(3) : "—";
  const cells = rows.map((r) => ({
    name: r.name,
    ex: r.priceExalted != null ? r.priceExalted.toLocaleString("en-US") : "—",
    div: div(r.priceExalted),
    qty: r.quantity != null ? r.quantity.toLocaleString("en-US") : "—",
  }));
  const w = (key: "name" | "ex" | "div" | "qty", header: string) =>
    Math.max(header.length, ...cells.map((c) => c[key].length));
  const wn = w("name", "Item");
  const we = w("ex", "ex");
  const wd = w("div", "div");
  const wq = w("qty", "qty");
  const head = `${"Item".padEnd(wn)}  ${"ex".padStart(we)}  ${"div".padStart(wd)}  ${"qty".padStart(wq)}`;
  const rule = "-".repeat(head.length);
  const body = cells.map(
    (c) =>
      `${c.name.padEnd(wn)}  ${c.ex.padStart(we)}  ${c.div.padStart(wd)}  ${c.qty.padStart(wq)}`,
  );
  return [head, rule, ...body].join("\n");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const leagues = await getLeagues(args.realm);
  const chosen = args.league
    ? leagues.find((l) => l.Value === args.league)
    : pickCurrentLeague(leagues, { hardcore: args.hardcore });
  if (!chosen) throw new Error("Could not resolve a current league; pass --league.");

  const raw = await getByCategory(args.realm, chosen.Value, args.kind, args.category);
  const items = raw.map((r) => normalizeItem(r, args.category));
  const rows = selectRows(items, { grep: args.grep, top: args.top });

  const divPrice = chosen.DivinePrice;
  console.log(
    `${args.kind}/${args.category} · league ${chosen.Value} · 1 div ≈ ${
      divPrice ? Math.round(divPrice) : "?"
    } ex` + (args.grep ? ` · grep "${args.grep}"` : ""),
  );
  console.log(`${rows.length} of ${items.length} items\n`);
  console.log(formatTable(rows, divPrice));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

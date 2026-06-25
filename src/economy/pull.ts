// CLI: pull a live economy snapshot from poe2scout and write JSON + a markdown
// digest under data/economy/. Run: pnpm economy [-- --hardcore --league "Name"]
//
// All logic lives in pull-core.ts; this file is the argv + stdout wrapper.

import {
  DEFAULT_CURRENCY_CATS,
  DEFAULT_UNIQUE_CATS,
  pullEconomy,
  writeSnapshot,
  type PullOpts,
} from "./pull-core.js";

function parseArgs(argv: string[]): PullOpts {
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

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  console.log(`Pulling ${opts.realm} economy from poe2scout…`);
  const snapshot = await pullEconomy({ ...opts, onProgress: (l) => console.log(l) });
  const { dir, digest } = await writeSnapshot(snapshot);
  console.log(
    `\nWrote ${snapshot.currencies.length} currencies + ${snapshot.uniques.length} uniques to ${dir}`,
  );
  console.log(`\n${digest}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

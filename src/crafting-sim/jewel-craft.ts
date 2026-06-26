// CLI: expected profit (div) for the jewel crit-pair craft via Liquid Emotion
// (crafting/method/jewel-crit-combo.md).
//
// Run: pnpm jewel-sim   (or: pnpm tsx src/crafting-sim/jewel-craft.ts)
//
// EXACT: emotion cost (live, data/economy/latest.json — needs the "delirium"
//   category, now in DEFAULT_CURRENCY_CATS). MODELLED: base jewel cost, sale
//   bands, and uniform-removal keepProb. Edit the modelled block below.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { simulateJewel, type JewelInputs } from "./jewel.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(here, "../..");

interface PriceData {
  divinePriceExalted: number;
  pulledAt: string;
  currencies: Array<{ name: string; priceExalted: number }>;
}

function loadPrices() {
  const raw = JSON.parse(readFileSync(join(REPO_ROOT, "data/economy/latest.json"), "utf8")) as PriceData;
  const div = raw.divinePriceExalted;
  const byName = new Map(raw.currencies.map((c) => [c.name, c.priceExalted]));
  return { div, pulledAt: raw.pulledAt, divOf: (n: string, fb: number) => (byName.get(n) ?? fb) / div };
}

// ---- modelled inputs (EDIT to taste) ----------------------------------------
// Default path: buy a rare jewel with a NATURAL crit-chance suffix + junk, then
// craft crit DAMAGE via Concentrated Liquid Fear. (Inverse: natural crit-damage
// + Liquid Despair for crit chance — cheaper emotion, ~6.7 ex.)
const EMOTION_NAME = "Concentrated Liquid Fear"; // crafted crit damage suffix
const EMOTION_FALLBACK_EX = 26;
const BASE_DIV = 0.02; // a cheap rare jewel carrying a natural crit mod
const FLOOR_DIV = 0.003; // a brick (natural crit nuked) ~1 ex
const SELL_PAIR = { low: 0.5, central: 1.5, high: 6 }; // realised sale of a clean crit pair
const MOD_COUNTS = [2, 3, 4]; // how many mods the bought jewel carries (incl. the crit)

const { div, pulledAt, divOf } = loadPrices();
const emotionDiv = divOf(EMOTION_NAME, EMOTION_FALLBACK_EX);

const fmt = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(3);
const pct = (n: number) => (n * 100).toFixed(0) + "%";

console.log(`\n=== Jewel crit-pair via Liquid Emotion — expected profit (div) ===`);
console.log(`prices: data/economy/latest.json @ ${pulledAt} · 1 div ≈ ${div.toFixed(0)} ex`);
console.log(
  `emotion: ${EMOTION_NAME} = ${(emotionDiv * div).toFixed(1)} ex (${emotionDiv.toFixed(3)} div) · ` +
    `base ${BASE_DIV} div · sale ${SELL_PAIR.low}/${SELL_PAIR.central}/${SELL_PAIR.high} div (modelled)\n`,
);
console.log(`Mechanic: emotion REMOVES a random mod then ADDS the crafted crit. P(keep) = (N-1)/N.`);
console.log(`So MORE junk mods on the bought jewel = safer. A 1-mod jewel is a guaranteed brick.\n`);

for (const modCount of MOD_COUNTS) {
  const inp: JewelInputs = {
    baseDiv: BASE_DIV,
    emotionDiv,
    modCount,
    floorDiv: FLOOR_DIV,
    sellPair: SELL_PAIR,
  };
  const paths = simulateJewel(inp);
  const central = paths.find((p) => p.band.startsWith("CENTRAL"))!;
  console.log(`-- ${modCount}-mod jewel (natural crit + ${modCount - 1} other): keep ${pct(central.keepProb)}`);
  console.log(
    `   attempt cost ${central.attemptCostDiv.toFixed(3)} div · cost per keeper ${central.costPerKeeperDiv.toFixed(3)} div`,
  );
  for (const p of paths) {
    console.log(`   ${p.band}: EV/attempt ${fmt(p.evPerAttemptDiv)} · EV/keeper ${fmt(p.evPerKeeperDiv)} div`);
  }
  console.log("");
}

console.log(
  `VERDICT: a cheap, high-volume +EV loop — the emotion (~${(emotionDiv * div).toFixed(0)} ex) is a fraction of a clean ` +
    `pair's sale. Buy rare jewels with the natural crit + junk (4 mods → 75% keep), fire the emotion, keep the pairs.`,
);
console.log(
  `Caveats: removal-targeting by side is UNCONFIRMED (verify in-game); only ONE crafted mod allowed, so the pair is ` +
    `1 natural + 1 crafted; partial/non-pair jewels floor at ~1 ex. Re-pull: pnpm economy ; pnpm prices delirium.\n`,
);

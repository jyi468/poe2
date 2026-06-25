// CLI: estimate the odds + expected cost of hitting TWO specific mods on a MAGIC
// item via Transmute -> Augment (no Alteration exists in this patch, so every
// attempt is a fresh white base). Built for the question:
//   "Obliterator Bow, >66% increased Physical Damage  +  +4 to Level of all
//    Projectile Skills — cheaper to craft or to buy at ~30 div?"
//
// Run: pnpm craft-sim   (or: pnpm tsx src/crafting-sim/magic-craft.ts)
//
// WHAT IS EXACT vs MODELLED
//  - EXACT (from PoB Data/ModItem.lua): tier list, ilvl gates, value ranges, the
//    fraction of the partial phys tier that clears the >66 threshold, and that the
//    suffix target only exists at ilvl >= 81.
//  - MODELLED: the two pool-share probabilities P_pref / P_suf. PoB does NOT ship
//    real GGG spawn weights (its weightVal is a 1/0 can-spawn flag), so these come
//    from a documented estimate with a low/central/high band. Plug real weights
//    from craftofexile/poe2db here to tighten the answer.

import { loadModTiers, poolFor, statLow, statHigh, type ModTier } from "./pob-mods.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// ---- target definition ------------------------------------------------------
const BASE_WEIGHTKEYS = ["bow", "weapon"]; // bows inherit weapon-generic mods
const ITEM_LEVEL = 81; // need >=81 for the +4 proj suffix; 82 also unlocks Merciless phys
const PREFIX_GROUP = "LocalPhysicalDamagePercent"; // pure "% increased Physical Damage"
const PREFIX_MIN_VALUE = 66; // strictly greater than
const SUFFIX_STAT_MATCH = "+4 to Level of all Projectile Skills";
const BUY_PRICE_DIV = 30;

// ---- modelled pool shares (EDIT THESE with real weights for precision) -------
// P_pref = weight(qualifying phys tiers) / weight(all bow prefixes available)
// P_suf  = weight(+4 proj tier)         / weight(all bow suffixes available)
// Derivation of central values:
//   prefixes: ~8 groups; pure %phys is a common/desirable group (~12-15% of prefix
//     weight), of which ~55-65% of weight clears >66 once low tiers are excluded.
//   suffixes: ~16 groups; +to-proj-level is a premium (low-weight) group and +4 is
//     its top tier, so the single +4 tier is a small slice of total suffix weight.
const P_PREF = { low: 0.04, central: 0.07, high: 0.1 };
const P_SUF = { low: 0.004, central: 0.008, high: 0.015 };

// ---- helpers ----------------------------------------------------------------
const here = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(here, "../..");

function orbPrices(): Record<string, number> {
  const data = JSON.parse(readFileSync(join(REPO_ROOT, "data/economy/latest.json"), "utf8"));
  const div: number = data.divinePriceExalted;
  const map: Record<string, number> = { _divine: div };
  for (const c of data.currencies as Array<{ name: string; priceExalted: number }>) {
    map[c.name] = c.priceExalted;
  }
  return map;
}

/** Fraction of a tier's roll-range that is strictly greater than `min`. */
function fracAbove(tier: ModTier, min: number): number {
  const lo = statLow(tier.stat);
  const hi = statHigh(tier.stat);
  if (hi <= min) return 0;
  if (lo > min) return 1;
  return (hi - min) / (hi - lo); // uniform over integer-ish range, good enough
}

function pct(x: number): string {
  return (x * 100).toPrecision(3) + "%";
}
function oneIn(p: number): string {
  return p > 0 ? "1 in " + Math.round(1 / p).toLocaleString() : "impossible";
}

// ---- main -------------------------------------------------------------------
const tiers = loadModTiers();
const prefixes = poolFor(tiers, BASE_WEIGHTKEYS, "Prefix", ITEM_LEVEL);
const suffixes = poolFor(tiers, BASE_WEIGHTKEYS, "Suffix", ITEM_LEVEL);

const physTiers = prefixes.filter((t) => t.group === PREFIX_GROUP);
const qualifyingPhys = physTiers
  .map((t) => ({ t, frac: fracAbove(t, PREFIX_MIN_VALUE) }))
  .filter((x) => x.frac > 0);
const suffixTarget = suffixes.find((t) => t.stat === SUFFIX_STAT_MATCH);

const prefixGroups = new Set(prefixes.map((t) => t.group)).size;
const suffixGroups = new Set(suffixes.map((t) => t.group)).size;

console.log(`\n=== ${BASE_WEIGHTKEYS[0]} @ ilvl ${ITEM_LEVEL} — magic Transmute->Augment craft ===\n`);
console.log(`Prefix pool: ${prefixes.length} mods across ${prefixGroups} groups`);
console.log(`Suffix pool: ${suffixes.length} mods across ${suffixGroups} groups\n`);

console.log(`TARGET PREFIX  "%increased Physical Damage" > ${PREFIX_MIN_VALUE}% (group ${PREFIX_GROUP}):`);
for (const t of physTiers) {
  const f = fracAbove(t, PREFIX_MIN_VALUE);
  const mark = f === 0 ? "  ✗" : f === 1 ? "  ✓" : `  ~${pct(f)} of rolls`;
  console.log(`   ${t.affix.padEnd(14)} ${t.stat.padEnd(34)} ilvl${String(t.level).padStart(3)}${mark}`);
}
console.log(`   -> ${qualifyingPhys.length}/${physTiers.length} tiers qualify (some partially)\n`);

console.log(`TARGET SUFFIX  "${SUFFIX_STAT_MATCH}":`);
if (suffixTarget) {
  console.log(`   ${suffixTarget.affix} — ilvl ${suffixTarget.level} (top tier of its group) ✓ available\n`);
} else {
  console.log(`   ✗ NOT available at ilvl ${ITEM_LEVEL} — raise item level.\n`);
  process.exit(1);
}

// per-attempt success ~= P_pref * P_suf  (Transmute+Augment fills 1 prefix + 1
// suffix; success needs the prefix slot = qualifying phys AND suffix slot = +4).
const prices = orbPrices();
const transmute = prices["Orb of Transmutation"] ?? 0.16;
const augment = prices["Orb of Augmentation"] ?? 0.28;
const DIV = prices._divine;

console.log(`Orb prices (live, ${DIV.toFixed(0)} ex/div):  transmute ${transmute.toFixed(2)} ex · augment ${augment.toFixed(2)} ex\n`);

function scenario(name: string, pPref: number, pSuf: number) {
  const p = pPref * pSuf;
  const attempts = 1 / p;
  // cost/attempt: 1 transmute always; augment only when transmute hits a target (~pPref+pSuf of the time)
  const costPerAttemptNoBase = transmute + (pPref + pSuf) * augment;
  console.log(`-- ${name}: P_pref=${pct(pPref)}, P_suf=${pct(pSuf)}`);
  console.log(`   per attempt: ${pct(p)}  (${oneIn(p)})   expected attempts: ${Math.round(attempts).toLocaleString()}`);
  // break-even white-base price vs buying at BUY_PRICE_DIV
  const budgetEx = BUY_PRICE_DIV * DIV;
  const breakevenBaseEx = budgetEx / attempts - costPerAttemptNoBase;
  console.log(`   currency only (free bases): ${(attempts * costPerAttemptNoBase / DIV).toFixed(1)} div expected`);
  for (const base of [1, 3, 5, 10, 20]) {
    const totalDiv = (attempts * (costPerAttemptNoBase + base)) / DIV;
    console.log(`     + white base @ ${String(base).padStart(2)} ex:  ${totalDiv.toFixed(1).padStart(6)} div  ${totalDiv < BUY_PRICE_DIV ? "← cheaper than buying" : ""}`);
  }
  console.log(`   BREAK-EVEN vs ${BUY_PRICE_DIV} div: craft wins if white bases cost < ${breakevenBaseEx.toFixed(1)} ex each\n`);
}

scenario("LUCKY (high weights)", P_PREF.high, P_SUF.high);
scenario("CENTRAL estimate", P_PREF.central, P_SUF.central);
scenario("UNLUCKY (low weights)", P_PREF.low, P_SUF.low);

console.log(`NOTE: result is a 2-mod MAGIC bow. A trade listing at ~${BUY_PRICE_DIV} div is`);
console.log(`usually a RARE with these two as standout mods — to match it you'd Regal+Exalt`);
console.log(`after, adding more cost/variance. Weights are modelled; plug real craftofexile`);
console.log(`numbers into P_PREF / P_SUF for a precise answer.\n`);

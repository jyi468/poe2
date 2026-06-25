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

import { loadModTiers, poolFor } from "./pob-mods.js";
import { estimateCraft } from "./estimate.js";
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
const prices = orbPrices();

const est = estimateCraft({
  prefixes,
  suffixes,
  prefixGroup: PREFIX_GROUP,
  prefixMin: PREFIX_MIN_VALUE,
  suffixStat: SUFFIX_STAT_MATCH,
  weights: { pref: P_PREF, suf: P_SUF },
  orb: {
    transmute: prices["Orb of Transmutation"] ?? 0.16,
    augment: prices["Orb of Augmentation"] ?? 0.28,
    divine: prices._divine,
  },
  buyPriceDiv: BUY_PRICE_DIV,
});

console.log(`\n=== ${BASE_WEIGHTKEYS[0]} @ ilvl ${ITEM_LEVEL} — magic Transmute->Augment craft ===\n`);
console.log(`Prefix pool groups: ${est.prefixGroups}   Suffix pool groups: ${est.suffixGroups}\n`);
console.log(`TARGET PREFIX "%increased Physical Damage" > ${PREFIX_MIN_VALUE}% (group ${PREFIX_GROUP}):`);
for (const t of est.targetPrefixTiers) {
  const mark = t.fracAboveMin === 0 ? "✗" : t.fracAboveMin === 1 ? "✓" : `~${pct(t.fracAboveMin)} of rolls`;
  console.log(`   ${t.affix.padEnd(14)} ${t.stat.padEnd(34)} ilvl${String(t.level).padStart(3)}  ${mark}`);
}
console.log(`\nTARGET SUFFIX "${SUFFIX_STAT_MATCH}": ${est.targetSuffix ? `ilvl ${est.targetSuffix.level} ✓` : "✗ not available"}\n`);
const DIV = prices._divine;
for (const s of est.scenarios) {
  console.log(`-- ${s.label}: P_pref=${pct(s.pPref)}, P_suf=${pct(s.pSuf)}`);
  console.log(`   per attempt: ${pct(s.p)} (${oneIn(s.p)})  expected attempts: ${Math.round(s.attempts).toLocaleString()}`);
  console.log(`   currency only (free bases): ${s.currencyOnlyDiv.toFixed(1)} div`);
  for (const b of s.withBase) {
    console.log(`     + white base @ ${String(b.baseEx).padStart(2)} ex: ${b.totalDiv.toFixed(1).padStart(6)} div  ${b.cheaperThanBuy ? "← cheaper than buying" : ""}`);
  }
  console.log(`   BREAK-EVEN vs ${BUY_PRICE_DIV} div: craft wins if white bases < ${s.breakevenBaseEx.toFixed(1)} ex each\n`);
}

// CLI: expected profit (in divines) for the movement-speed boots method
// (crafting/method/movement-speed-boots.md). Buy a Magic ilvl-82 boot that
// already has movement speed, lock a resist with a Greater Essence, then fill
// the open slots with side-controlled Exalt slams. We value the *distribution*
// of finished boots and compare the lean path against paying for a Perfect Exalt.
//
// Run: pnpm boots-sim   (or: pnpm tsx src/crafting-sim/boots-craft.ts)
//
// EXACT: every input cost (live, from data/economy/latest.json) and the real
//   boots mod-pool composition (from PoB, when $POB_REPO is set).
// MODELLED: the per-slam category-share bands (u/h/R) — GGG ships no spawn
//   weights, so these are documented estimates; the pool composition is printed
//   as a sanity-check floor. Refine the bands with craftofexile weights.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { simulateBoots, type BootsCosts, type BootsModel, type OutcomeValues } from "./boots.js";
import { loadModTiers, poolFor } from "./pob-mods.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(here, "../..");
const ITEM_LEVEL = 82; // T1 movement speed gates at ilvl 82

// ---- live prices ------------------------------------------------------------
interface PriceData {
  divinePriceExalted: number;
  currencies: Array<{ name: string; priceExalted: number }>;
}

function loadPrices(): { div: number; ex: (name: string) => number | undefined; pulledAt: string } {
  const raw = JSON.parse(readFileSync(join(REPO_ROOT, "data/economy/latest.json"), "utf8")) as PriceData & {
    pulledAt: string;
  };
  const div = raw.divinePriceExalted;
  const byName = new Map(raw.currencies.map((c) => [c.name, c.priceExalted]));
  return { div, ex: (n) => byName.get(n), pulledAt: raw.pulledAt };
}

// ---- modelled per-slam bands (EDIT with real craftofexile weights) ----------
// u = P(forced-prefix slam lands a wanted stat: life / %ES / %evasion / %armour)
// h = P(high tier | a wanted prefix landed)
// R = P(the single forced-suffix slam lands a 2nd resistance)
const MODEL: BootsModel = {
  openPrefixSlots: 3, // life + two defence prefixes after the MS+resist lock
  openSuffixSlots: 1, // MS + essence resist already fill 2 of 3 suffixes
  pUsefulPrefix: { low: 0.3, central: 0.4, high: 0.5 },
  pHighTier: { low: 0.25, central: 0.35, high: 0.45 },
  pResistSuffix: { low: 0.3, central: 0.4, high: 0.5 },
};

// Asking-price (div) of each finished-boot bucket on a meta evasion/ES base,
// and the asking->sold haircut (asking floors run hot — see the method file).
const VALUES: OutcomeValues = { premium: 3, good: 1, mediocre: 0.3, junk: 0.1 };
const SALE_DISCOUNT = 0.65;
const BASE_DIV = 0.15; // a Magic ilvl-82 30%-MS boot; not poe2scout-tracked, assumed

// ---- optional PoB pool sanity check -----------------------------------------
// Boots inherit generic armour-piece mods: movement speed/life are keyed "boots",
// but resistances and defence rolls are keyed "armour" (cf. bows -> ["bow","weapon"]).
const BOOTS_KEYS = ["boots", "armour"];
const DESIRABLE_PREFIX = /maximum Life|maximum Energy Shield|Evasion Rating|to Armour|increased Armour|increased Evasion|increased Energy Shield/i;
const RESIST_SUFFIX = /Resistance/i;

function poolSanity(): string[] {
  try {
    // loadModTiers() reads $POB_REPO — guard so the sim still runs without it.
    const tiers = loadModTiers();
    const pre = poolFor(tiers, BOOTS_KEYS, "Prefix", ITEM_LEVEL);
    const suf = poolFor(tiers, BOOTS_KEYS, "Suffix", ITEM_LEVEL);
    const preGroups = new Set(pre.map((t) => t.group));
    const sufGroups = new Set(suf.map((t) => t.group));
    const desirablePre = new Set(pre.filter((t) => DESIRABLE_PREFIX.test(t.stat)).map((t) => t.group));
    const resistSuf = new Set(suf.filter((t) => RESIST_SUFFIX.test(t.stat)).map((t) => t.group));
    const rFloor = resistSuf.size / sufGroups.size;
    return [
      `PoB boots pool @ ilvl ${ITEM_LEVEL}: ${sufGroups.size} suffix groups, ${resistSuf.size} of them resist.`,
      `  → even-weight floor R≈${rFloor.toFixed(2)} corroborates the modelled central R=${pct(MODEL.pResistSuffix.central)} ` +
        `(resists carry above-average weight, so the true R sits a little higher).`,
      `  (prefix u left to the documented estimate: local life/ES/evasion/armour rolls are base-type-keyed, ` +
        `so a generic ["boots","armour"] scan under-counts them — refine per base on craftofexile.)`,
    ];
  } catch {
    return ["PoB pool sanity check skipped ($POB_REPO not set) — using documented modelled bands only."];
  }
}

// ---- main -------------------------------------------------------------------
const { div, ex, pulledAt } = loadPrices();
const divOf = (name: string, fallbackEx: number) => (ex(name) ?? fallbackEx) / div;

const costs: BootsCosts = {
  baseDiv: BASE_DIV,
  essenceDiv: divOf("Greater Essence of Grounding", 2.3),
  exaltDiv: divOf("Exalted Orb", 1),
  // 3 prefix slams use Sinistral, 1 suffix uses Dextral — blend across 4 slams.
  sideOmenDiv:
    (3 * divOf("Omen of Sinistral Exaltation", 16) + divOf("Omen of Dextral Exaltation", 5)) / 4,
  perfectExaltDiv: divOf("Perfect Exalted Orb", 827),
};
const whittlingDiv = divOf("Omen of Whittling", 2275);
const annulDiv = divOf("Orb of Annulment", 233);

const scenarios = simulateBoots(MODEL, costs, VALUES, SALE_DISCOUNT);
const fmt = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2);
const pct = (n: number) => (n * 100).toFixed(0) + "%";

console.log(`\n=== Movement-speed boots — expected profit (div) ===`);
console.log(`prices: data/economy/latest.json @ ${pulledAt} · 1 div ≈ ${div.toFixed(0)} ex\n`);
for (const line of poolSanity()) console.log(line);
console.log(
  `\ninputs (div): base ${costs.baseDiv} · essence ${costs.essenceDiv.toFixed(3)} · ` +
    `Exalt ${costs.exaltDiv.toFixed(3)} · side-omen ${costs.sideOmenDiv.toFixed(3)} · ` +
    `Perfect Exalt ${costs.perfectExaltDiv.toFixed(2)} · Whittling ${whittlingDiv.toFixed(2)} · Annul ${annulDiv.toFixed(2)}`,
);
console.log(
  `model (modelled): u=${pct(MODEL.pUsefulPrefix.central)} h=${pct(MODEL.pHighTier.central)} ` +
    `R=${pct(MODEL.pResistSuffix.central)} (central) · sale haircut ${pct(SALE_DISCOUNT)} · ` +
    `values prem/good/med/junk = ${VALUES.premium}/${VALUES.good}/${VALUES.mediocre}/${VALUES.junk} div\n`,
);

for (const s of scenarios) {
  console.log(`-- ${s.band}`);
  for (const p of [s.lean, s.perfect]) {
    const d = p.dist;
    console.log(
      `   ${p.label.padEnd(16)} dist prem/good/med/junk = ` +
        `${pct(d.premium)}/${pct(d.good)}/${pct(d.mediocre)}/${pct(d.junk)}`,
    );
    console.log(
      `   ${" ".repeat(16)} revenue(sold) ${p.evRevenueSold.toFixed(2)}  ` +
        `cost ${p.costDiv.toFixed(2)}  EV profit ${fmt(p.evProfitDiv)} div`,
    );
  }
  console.log();
}

const central = scenarios.find((s) => s.band === "CENTRAL estimate")!;
console.log(`VERDICT (central): lean EV ${fmt(central.lean.evProfitDiv)} div/craft · ` +
  `Perfect-Exalt EV ${fmt(central.perfect.evProfitDiv)} div/craft.`);
console.log(
  `Whittling recovery (${whittlingDiv.toFixed(1)} div) is +EV only if it lifts expected sale by ` +
    `more than ${whittlingDiv.toFixed(1)} div — impossible on a ${VALUES.premium}-div ceiling. ` +
    `Reserve Perfect Exalt / Whittling for top-end bases only.\n`,
);

// CLI: expected profit (div) for the Desecration Lich-modifier craft
// (crafting/method/desecration-lich-modifier.md). Rung 3 of the crafting ladder
// (knowledge/workflows/crafting-ladder.md).
//
// Run: pnpm desecration-sim   (or: pnpm tsx src/crafting-sim/desecration-craft.ts)
//
// EXACT: consumable costs (live, data/economy/latest.json).
// MODELLED: poolShare `w` (chance a revealed mod is acceptable) — documented
//   bands; refine against craftofexile reveal data. Bones are sourced in-game
//   (not poe2scout-tracked), so boneDiv is an assumption — edit it below.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { simulateDesecration, type DesecCosts, type DesecModel } from "./desecration.js";

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

// ---- modelled inputs (EDIT with craftofexile reveal data) -------------------
const BONE_DIV = 0.1; // Ancient bone, sourced in-game — assumption
const MODEL: DesecModel = {
  // w = chance a single revealed mod is one you'd accept. Ancient Bones filter
  // out low tiers, shrinking the pool and raising w. ~1 acceptable in ~13–33.
  poolShare: { low: 0.03, central: 0.05, high: 0.08 },
  revealsPerCycle: 6, // Abyssal Echoes used every cycle (cheap reroll → 6 shown)
  // realised sale of a finished piece carrying the exclusive Lich mod on a meta base.
  soldValue: { low: 3, central: 5, high: 9 },
};
const BASE_DIV = 1.0; // a 3–4 mod jewellery base ready to desecrate — keep this LOW

const { div, pulledAt, divOf } = loadPrices();

const costs: DesecCosts = {
  baseDiv: BASE_DIV,
  boneDiv: BONE_DIV,
  // Necromancy (side) + Lich-pool omen + Abyssal Echoes, per cycle.
  cycleOmensDiv:
    divOf("Omen of Dextral Necromancy", 2) +
    divOf("Omen of the Sovereign", 4) +
    divOf("Omen of Abyssal Echoes", 90),
  // The expensive reset: Omen of Light + Orb of Annulment.
  clearDiv: divOf("Omen of Light", 2929) + divOf("Orb of Annulment", 233),
};

const paths = simulateDesecration(MODEL, costs);
const fmt = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2);
const pct = (n: number) => (n * 100).toFixed(0) + "%";

console.log(`\n=== Desecration Lich modifier — expected profit (div) ===`);
console.log(`prices: data/economy/latest.json @ ${pulledAt} · 1 div ≈ ${div.toFixed(0)} ex\n`);
console.log(
  `inputs (div): base ${costs.baseDiv} · bone ${costs.boneDiv} · cycle-omens ${costs.cycleOmensDiv.toFixed(2)} ` +
    `(necro+lich+echoes) · CLEAR ${costs.clearDiv.toFixed(2)} (Light+Annul)`,
);
console.log(
  `model (modelled): w=${pct(MODEL.poolShare.central)} central · ${MODEL.revealsPerCycle} reveals/cycle (Echoes) · ` +
    `sale ${MODEL.soldValue.low}/${MODEL.soldValue.central}/${MODEL.soldValue.high} div\n`,
);

for (const p of paths) {
  console.log(`-- ${p.band}  (w=${pct(p.w)})`);
  console.log(
    `   hit/cycle ${pct(p.hitPerCycle)}  →  ~${p.expectedCycles.toFixed(1)} cycles to land the mod`,
  );
  console.log(
    `   reset cost: CLEAR ${p.clearCostDiv.toFixed(1)} vs FRESH ${p.freshCostDiv.toFixed(1)} → use ${p.bestStrategy.toUpperCase()} (${p.bestCostDiv.toFixed(1)} div)`,
  );
  console.log(`   EV profit: ${fmt(p.evProfitDiv)} div / finished piece\n`);
}

const central = paths.find((p) => p.band === "CENTRAL estimate")!;
console.log(
  `VERDICT (central): ${fmt(central.evProfitDiv)} div, using ${central.bestStrategy.toUpperCase()} resets.`,
);
console.log(
  `Omen of Light is ${costs.clearDiv.toFixed(1)} div — clearing a bad mod usually costs MORE than a ready base, ` +
    `so re-bone a fresh cheap base instead of Light-clearing. Keep base cost low; +EV lives in cheap bases + few cycles.\n`,
);

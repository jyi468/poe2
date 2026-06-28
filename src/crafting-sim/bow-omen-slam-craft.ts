// CLI: bankroll + ROI for the omen-slam bow craft (crafting/method/omen-slam-bow.md).
// Compares the Greater-Exalt build (recommended) vs the Perfect-Exalt build (chase T1),
// plus the desecrate-crit alternative and the don't-craft crit-fractured path.
//
// Run: pnpm bow-sim   (or: pnpm tsx src/crafting-sim/bow-omen-slam-craft.ts)
//
// EXACT: live prices + per-slam odds at each exalt floor (crafting/reference/bow-affix-weights.md).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { simulateBowSlam, type FracturePath, type SlamCosts, type SlamModel } from "./bow-omen-slam.js";

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

const { div, pulledAt, divOf } = loadPrices();

const costs: SlamCosts = {
  exaltOmenDiv: divOf("Omen of Sinistral Exaltation", 14),
  annulDiv: divOf("Orb of Annulment", 212),
  sinistralAnnulDiv: divOf("Omen of Sinistral Annulment", 4222),
  divineDiv: divOf("Divine Orb", div),
  boneDiv: divOf("Ancient Jawbone", 3505),
  lightDiv: divOf("Omen of Light", 3149),
  echoesDiv: divOf("Omen of Abyssal Echoes", 106),
};

// EXACT per-slam shares at each min-mod-level floor (crafting/reference/bow-affix-weights.md).
const SHARE = { prefix: { greater: 0.864, perfect: 0.904 }, critT3: { greater: 0.036, perfect: 0.024 }, second: 0.141 };

const base = {
  pSecond: SHARE.second,
  secondOrbDiv: divOf("Exalted Orb", 1),
  prefixCount: 3,
  finishingDivines: 4,
  pCritDesecReveal: 875 / 21400,
  revealsPerCycle: 6,
};
const greater: SlamModel = { ...base, orbDiv: divOf("Greater Exalted Orb", 3.3), pPrefix: SHARE.prefix.greater, pCrit: SHARE.critT3.greater, critSource: "exalt" };
const perfect: SlamModel = { ...base, orbDiv: divOf("Perfect Exalted Orb", 865), pPrefix: SHARE.prefix.perfect, pCrit: SHARE.critT3.perfect, critSource: "exalt" };

const BASE_DIV: Record<FracturePath, number> = { proj: 30, crit: 32 };
const RESALE = { greater: 200, perfect: 460, crit: 0.5 };

interface Row { label: string; model: SlamModel; base: number; resale: number; }
const rows: Row[] = [
  { label: "Greater build (min 35) · crit T3+   [RECOMMENDED]", model: greater, base: BASE_DIV.proj, resale: RESALE.greater },
  { label: "Perfect build (min 50) · crit T2+ · chase T1", model: perfect, base: BASE_DIV.proj, resale: RESALE.perfect },
  { label: "Greater build, but DESECRATE crit (worse)", model: { ...greater, critSource: "desecrate" }, base: BASE_DIV.proj, resale: RESALE.greater },
];

const d0 = (n: number) => n.toFixed(0);

console.log(`\n=== Omen-slam bow craft — bankroll & ROI (div) ===`);
console.log(`prices: data/economy/latest.json @ ${pulledAt} · 1 div ≈ ${div.toFixed(0)} ex`);
console.log(
  `orbs (div): Greater Exalt ${greater.orbDiv.toFixed(2)} · Perfect Exalt ${perfect.orbDiv.toFixed(2)} · ` +
    `plain Exalt ${base.secondOrbDiv.toFixed(3)} · annul ${costs.annulDiv.toFixed(2)} · Sinistral-annul ${costs.sinistralAnnulDiv.toFixed(1)}`,
);
console.log(
  `crit ≥T3 per slam: Greater ${(SHARE.critT3.greater * 100).toFixed(1)}% · Perfect ${(SHARE.critT3.perfect * 100).toFixed(1)}% ` +
    `(craftofexile weights at the exalt's min-mod-level floor)\n`,
);

console.log(`${"scenario".padEnd(48)} ${"mean".padStart(5)} ${"p50".padStart(5)} ${"p85".padStart(5)} ${"p95".padStart(5)}   bankroll  EV`);
for (const r of rows) {
  const s = simulateBowSlam("proj", r.model, costs, { trials: 30000 }).stats;
  const bankroll = r.base + s.p85;
  const ev = r.resale - (r.base + s.mean);
  console.log(
    `${r.label.padEnd(48)} ${d0(s.mean).padStart(5)} ${d0(s.p50).padStart(5)} ${d0(s.p85).padStart(5)} ${d0(s.p95).padStart(5)}   ` +
      `${(d0(bankroll) + "d").padStart(7)}  ${ev >= 0 ? "+" : ""}${d0(ev)}d`,
  );
}
console.log(
  `\nGreater Exalt is ~free, so spamming crit at 3.6% is cheap; Perfect's value is forcing\n` +
    `crit T2+ / top prefixes for the ~460–630 tier, at ~2.5× the cost and much fatter variance.\n` +
    `Crit-fractured (no +levels) resells ~0.5d — buy it, don't craft.\n`,
);

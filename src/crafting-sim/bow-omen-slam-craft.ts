// CLI: bankroll + ROI for the omen-slam bow craft (crafting/method/omen-slam-bow.md).
// Shows the recommended all-Perfect-Exalt path vs the (worse) desecrate-crit path,
// and the prefix strategy (elemental-allowed vs phys-only).
//
// Run: pnpm bow-sim   (or: pnpm tsx src/crafting-sim/bow-omen-slam-craft.ts)
//
// EXACT: consumable prices (live, data/economy/latest.json) and per-slam PREFIX + SUFFIX
//   odds (craftofexile spawn-weight shares, bow id_base 20, ilvl 81), assuming the slam/
//   desecrate samples the normal suffix pool by weight.
// Base-item prices and resale values are market judgement — set BASE_DIV / RESALE_DIV.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  simulateBowSlam,
  type FracturePath,
  type SlamCosts,
  type SlamModel,
} from "./bow-omen-slam.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(here, "../..");

interface PriceData {
  divinePriceExalted: number;
  pulledAt: string;
  currencies: Array<{ name: string; priceExalted: number }>;
}

function loadPrices() {
  const raw = JSON.parse(
    readFileSync(join(REPO_ROOT, "data/economy/latest.json"), "utf8"),
  ) as PriceData;
  const div = raw.divinePriceExalted;
  const byName = new Map(raw.currencies.map((c) => [c.name, c.priceExalted]));
  return {
    div,
    pulledAt: raw.pulledAt,
    divOf: (n: string, fallbackEx: number) => (byName.get(n) ?? fallbackEx) / div,
  };
}

const { div, pulledAt, divOf } = loadPrices();

const costs: SlamCosts = {
  perfectExaltDiv: divOf("Perfect Exalted Orb", 865),
  exaltOmenDiv: divOf("Omen of Sinistral Exaltation", 14),
  annulDiv: divOf("Orb of Annulment", 212),
  lightDiv: divOf("Omen of Light", 3149), // desecrate alternative only
  boneDiv: divOf("Ancient Jawbone", 3505), // desecrate alternative only (in-game)
  echoesDiv: divOf("Omen of Abyssal Echoes", 210), // desecrate alternative only
  divineDiv: divOf("Divine Orb", div),
};

// ---- EXACT weight shares (craftofexile, bow id_base 20, ilvl 81) -------------
const P_PREFIX_ELE = 0.753; // phys OR elemental prefix, top tier
const P_PREFIX_PHYS = 0.225; // flat-or-% physical only, top tier
const P_CRIT_SUFFIX = 3875 / 55050; // 7.04% — crit chance share of the suffix pool
const P_SECOND_SUFFIX = (3900 + 3875) / 55050; // 14.1% — attack speed OR crit damage
const P_CRIT_DESEC_ANCIENT = 875 / 21400; // 4.09% — crit ≥T3 per reveal, Ancient bone

const MODEL: SlamModel = {
  pPrefix: P_PREFIX_ELE,
  critSource: "exalt",
  pCritSuffix: P_CRIT_SUFFIX,
  pSecondSuffix: P_SECOND_SUFFIX,
  pCritDesecReveal: P_CRIT_DESEC_ANCIENT,
  revealsPerCycle: 6, // Abyssal Echoes (desecrate path)
  prefixCount: 3,
  finishingDivines: 4,
};

// ---- market values (LIVE trade2 floors, equipment filters, 2026-06-28) -------
const BASE_DIV: Record<FracturePath, number> = { proj: 30, crit: 32 };
const RESALE_DIV: Record<FracturePath, number> = { proj: 200, crit: 0.5 };

interface Row {
  label: string;
  path: FracturePath;
  model: SlamModel;
}

const rows: Row[] = [
  { label: "A · +Proj · Perfect-Exalt crit (T1) + AS  [RECOMMENDED]", path: "proj", model: MODEL },
  {
    label: "A · +Proj · DESECRATE crit (Ancient) + exalt AS",
    path: "proj",
    model: { ...MODEL, critSource: "desecrate" },
  },
  {
    label: "A · +Proj · PHYS-only prefixes (exalt crit)",
    path: "proj",
    model: { ...MODEL, pPrefix: P_PREFIX_PHYS },
  },
  { label: "B · frac Crit · ELE prefixes (buy don't craft)", path: "crit", model: MODEL },
];

const d1 = (n: number) => n.toFixed(0);

console.log(`\n=== Omen-slam bow craft — bankroll & ROI (div) ===`);
console.log(`prices: data/economy/latest.json @ ${pulledAt} · 1 div ≈ ${div.toFixed(0)} ex`);
console.log(
  `inputs (div): Perfect Exalt ${costs.perfectExaltDiv.toFixed(2)} · ` +
    `exalt-omen ${costs.exaltOmenDiv.toFixed(2)} · annul ${costs.annulDiv.toFixed(2)} · ` +
    `[desec-only] Light ${costs.lightDiv.toFixed(2)} · bone ${costs.boneDiv.toFixed(2)}`,
);
console.log(
  `EXACT odds: prefix ele ${(P_PREFIX_ELE * 100).toFixed(1)}% · crit suffix ` +
    `${(P_CRIT_SUFFIX * 100).toFixed(1)}% (→T1) · 2nd suffix ${(P_SECOND_SUFFIX * 100).toFixed(1)}% ` +
    `(craftofexile weights, id_base 20, ilvl 81)\n`,
);

console.log(
  `${"scenario".padEnd(50)} ${"mean".padStart(5)} ${"p50".padStart(5)} ` +
    `${"p85".padStart(5)} ${"p95".padStart(5)}   (consumables only)`,
);
for (const r of rows) {
  const s = simulateBowSlam(r.path, r.model, costs).stats;
  console.log(
    `${r.label.padEnd(50)} ${d1(s.mean).padStart(5)} ${d1(s.p50).padStart(5)} ` +
      `${d1(s.p85).padStart(5)} ${d1(s.p95).padStart(5)}`,
  );
}

console.log(`\n--- bankroll (base + p85 consumables) & ROI at example trade prices ---`);
console.log(
  `(base & resale are market inputs — edit BASE_DIV / RESALE_DIV: ` +
    `+Proj base ${BASE_DIV.proj}d, Crit base ${BASE_DIV.crit}d, ` +
    `resale ${RESALE_DIV.proj}d / ${RESALE_DIV.crit}d)\n`,
);
for (const path of ["proj", "crit"] as FracturePath[]) {
  const s = simulateBowSlam(path, MODEL, costs).stats;
  const base = BASE_DIV[path];
  const bankroll = base + s.p85;
  const typical = base + s.mean;
  const roi = RESALE_DIV[path] - typical;
  console.log(
    `${path === "proj" ? "A +Proj" : "B Crit "} · base ${d1(base)}d · ` +
      `typical all-in ${d1(typical)}d · BRING ${d1(bankroll)}d (covers ~85%) · ` +
      `resale ${d1(RESALE_DIV[path])}d → EV ${roi >= 0 ? "+" : ""}${d1(roi)}d`,
  );
}
console.log(
  `\nNote: crit is only ~7% of the suffix pool, so the p95 tail is the crit-suffix hunt. ` +
    `Perfect-Exalt it (T1 free, cheap annul misses) — don't desecrate it.\n`,
);

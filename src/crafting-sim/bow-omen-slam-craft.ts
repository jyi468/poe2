// CLI: bankroll + ROI for the omen-slam bow craft (crafting/method/omen-slam-bow.md).
// Compares the two fracture paths (+Proj vs Crit) and the prefix strategy
// (elemental-allowed vs phys-only).
//
// Run: pnpm bow-sim   (or: pnpm tsx src/crafting-sim/bow-omen-slam-craft.ts)
//
// EXACT: consumable prices (live, data/economy/latest.json) and per-slam PREFIX odds
//   (craftofexile spawn weights, bow id_base 20, ilvl 81).
// MODELLED: per-desecrate crit/attack-speed/crit-damage chances (Abyssal pool, not in
//   the craftofexile dump) — calibrated to the source video's "~10 Omen of Lights"
//   budget. Edit MODEL below to taste. Base-item prices and resale values are market
//   judgement — set BASE_DIV / RESALE_DIV to your live trade numbers.

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
  lightDiv: divOf("Omen of Light", 3149),
  jawboneDiv: 0.02, // Preserved Jawbone + Dextral Necromancy — sourced in-game, assumption
  echoesDiv: divOf("Omen of Abyssal Echoes", 210),
  essenceSeekingDiv: divOf("Greater Essence of Seeking", 6),
  divineDiv: divOf("Divine Orb", div),
};

// ---- EXACT prefix odds (craftofexile weights, bow id_base 20, ilvl 81) -------
const P_PREFIX_ELE = 0.753; // phys OR elemental damage prefix, top tier
const P_PREFIX_PHYS = 0.225; // flat-or-% physical only, top tier

// ---- MODELLED desecration odds (per single revealed mod; edit with real data) -
const MODEL: SlamModel = {
  pPrefix: P_PREFIX_ELE,
  critSource: "desecrate",
  revealsPerCycle: 6, // Abyssal Echoes (3 options + 1 reroll)
  pCrit: 0.13, // acceptable crit-chance (>=T3) per revealed mod
  pAttackSpeed: 0.2,
  pCritDamage: 0.18,
  prefixCount: 3,
  finishingDivines: 4,
};

// ---- market values (LIVE trade2 floors, equipment filters, 2026-06-28) -------
// Pulled via: pnpm trade --category weapon.bow --crit <%> --pdps <n> [--stat +proj].
//   proj : +4 Proj · crit>=8% · pDPS>=450 floor ~130 div; settled-typical ~200;
//          T1 crit (>=9%) + pDPS>=600 tier ~460-630 div.
//   crit : a crit+pDPS bow WITHOUT +levels floors at ~0.5 div (market is flooded) —
//          so the Crit-fracture craft has no resale; BUY one instead of crafting.
const BASE_DIV: Record<FracturePath, number> = { proj: 30, crit: 32 };
const RESALE_DIV: Record<FracturePath, number> = { proj: 200, crit: 0.5 };

interface Row {
  label: string;
  path: FracturePath;
  model: SlamModel;
}

const rows: Row[] = [
  {
    label: "A · +Proj · Essence-Seeking crit (guaranteed) · Echoes AS",
    path: "proj",
    model: { ...MODEL, critSource: "essence" },
  },
  {
    label: "A · +Proj · desecrate crit (Abyssal Echoes) · Echoes AS",
    path: "proj",
    model: MODEL,
  },
  {
    label: "A · +Proj · desecrate crit · Light-clear per miss (pessimistic)",
    path: "proj",
    model: { ...MODEL, revealsPerCycle: 1 },
  },
  {
    label: "A · +Proj · PHYS-only prefixes (Echoes crit)",
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
    `Light ${costs.lightDiv.toFixed(2)} · jawbone ${costs.jawboneDiv.toFixed(2)} (in-game)`,
);
console.log(
  `EXACT prefix odds: ele ${(P_PREFIX_ELE * 100).toFixed(1)}% · phys-only ${(
    P_PREFIX_PHYS * 100
  ).toFixed(1)}% (craftofexile weights, id_base 20, ilvl 81)`,
);
console.log(
  `MODELLED desec odds: crit T3 ${(MODEL.pCrit * 100).toFixed(0)}% · ` +
    `AS ${(MODEL.pAttackSpeed * 100).toFixed(0)}% · CD ${(MODEL.pCritDamage * 100).toFixed(0)}% ` +
    `(Abyssal pool — assumption)\n`,
);

console.log(
  `${"scenario".padEnd(42)} ${"mean".padStart(5)} ${"p50".padStart(5)} ` +
    `${"p85".padStart(5)} ${"p95".padStart(5)}   (consumables only)`,
);
for (const r of rows) {
  const s = simulateBowSlam(r.path, r.model, costs).stats;
  console.log(
    `${r.label.padEnd(42)} ${d1(s.mean).padStart(5)} ${d1(s.p50).padStart(5)} ` +
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
  const model = path === "proj" ? MODEL : MODEL; // both use ELE prefixes here
  const s = simulateBowSlam(path, model, costs).stats;
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
  `\nNote: the p95 tail is the desecration crit hunt — if a run blows past p85, ` +
    `re-bone a fresh base rather than Light-chasing a stubborn tier.\n`,
);

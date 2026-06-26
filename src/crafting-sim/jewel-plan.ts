// Server-side plan for the Jewel tab: the two Liquid-Emotion crit-pair recipes
// with live emotion prices, EV scenarios across mod counts, the "find natural-crit
// jewels" trade presets, and a Mermaid flowchart. See jewel.ts for the EV model
// and crafting/method/jewel-crit-combo.md for the strategy.

import { simulateJewel, type JewelInputs, type WeightBand } from "./jewel.js";

export type DivOf = (name: string, fallbackEx: number) => number;

// Modelled assumptions (mirror src/crafting-sim/jewel-craft.ts). Inputs (emotion)
// are live; base/sale/keepProb are modelled and flagged in the UI.
const BASE_DIV = 0.02;
const FLOOR_DIV = 0.003;
const SELL_PAIR: WeightBand = { low: 0.5, central: 1.5, high: 6 };
const MOD_COUNTS = [2, 3, 4] as const;

interface SearchStat {
  readonly id: string;
  readonly label: string;
}

interface RecipeDef {
  readonly key: string;
  readonly emotionName: string;
  readonly emotionFallbackEx: number;
  readonly crafts: string; // the crit mod the emotion adds
  readonly buyNatural: string; // the crit mod you must already have (natural)
  readonly searchStats: readonly SearchStat[]; // to find the natural-crit jewel on trade
}

// Two recipes: pick the one matching the natural crit your cheap jewels carry.
const RECIPES: readonly RecipeDef[] = [
  {
    key: "fear-crit-damage",
    emotionName: "Concentrated Liquid Fear",
    emotionFallbackEx: 26,
    crafts: "Critical Damage Bonus",
    buyNatural: "Critical Hit Chance",
    searchStats: [
      { id: "explicit.stat_737908626", label: "Crit Hit Chance for Spells (Sapphire)" },
      { id: "explicit.stat_2194114101", label: "Crit Hit Chance for Attacks (Emerald)" },
    ],
  },
  {
    key: "despair-crit-chance",
    emotionName: "Liquid Despair",
    emotionFallbackEx: 7,
    crafts: "Critical Hit Chance",
    buyNatural: "Critical Damage Bonus",
    searchStats: [
      { id: "explicit.stat_3714003708", label: "Crit Damage Bonus for Attack Damage (Emerald)" },
      { id: "explicit.stat_3556824919", label: "Crit Damage Bonus (generic)" },
    ],
  },
];

export interface JewelScenario {
  readonly modCount: number;
  readonly keepProb: number;
  readonly costPerKeeperDiv: number;
  readonly evPerAttemptDiv: number; // central band
}

export interface JewelRecipe {
  readonly key: string;
  readonly emotionName: string;
  readonly crafts: string;
  readonly buyNatural: string;
  readonly priceEx: number | null; // null when the emotion isn't tracked
  readonly priceDiv: number;
  readonly searchStats: readonly SearchStat[];
  readonly scenarios: readonly JewelScenario[];
}

/** Generic jewel crit-pair flowchart (one diagram for the whole loop). */
export function jewelFlowchart(): string {
  return [
    "flowchart TD",
    `  A["Buy a RARE jewel with a natural crit suffix<br/>+ 2-3 junk mods (3-4 total)"] --> B`,
    `  B["Apply the complementary Liquid Emotion<br/>Conc. Fear = crit damage · Despair = crit chance"] --> C`,
    `  C["Removes 1 RANDOM mod, then adds the crafted crit<br/>(one crafted mod per jewel)"] --> D`,
    `  D{"Did the natural crit survive?<br/>P(keep) = (N-1)/N"}`,
    `  D -->|"yes (~75% at 4 mods)"| E["Crit PAIR. Exalt an open slot for a build damage mod, then list"]`,
    `  D -->|"no"| F["Natural crit nuked -> ~1 ex floor. Next jewel."]`,
  ].join("\n");
}

/** Build the full Jewel-tab plan from live emotion prices. */
export function buildJewelPlan(divOf: DivOf): { flowchart: string; recipes: JewelRecipe[]; assumptions: { baseDiv: number; floorDiv: number; sellPair: WeightBand } } {
  const recipes = RECIPES.map((r): JewelRecipe => {
    const priceDiv = divOf(r.emotionName, r.emotionFallbackEx);
    const scenarios = MOD_COUNTS.map((modCount): JewelScenario => {
      const inp: JewelInputs = {
        baseDiv: BASE_DIV,
        emotionDiv: priceDiv,
        modCount,
        floorDiv: FLOOR_DIV,
        sellPair: SELL_PAIR,
      };
      const central = simulateJewel(inp).find((p) => p.band.startsWith("CENTRAL"))!;
      return {
        modCount,
        keepProb: central.keepProb,
        costPerKeeperDiv: central.costPerKeeperDiv,
        evPerAttemptDiv: central.evPerAttemptDiv,
      };
    });
    return {
      key: r.key,
      emotionName: r.emotionName,
      crafts: r.crafts,
      buyNatural: r.buyNatural,
      priceEx: null, // filled by the route from the snapshot; see getJewel
      priceDiv,
      searchStats: r.searchStats,
      scenarios,
    };
  });
  return { flowchart: jewelFlowchart(), recipes, assumptions: { baseDiv: BASE_DIV, floorDiv: FLOOR_DIV, sellPair: SELL_PAIR } };
}
